import { ok, err } from '@/types/result.js';
import type { Result, TaskError } from '@/types/result.js';
import type { Link } from '@/schemas/task.schema.js';
import type { LinkType } from '@/types/constants.js';
import { getTask } from './task.service.js';

const LINKS_FILE = '.task/links.json';

type LinksData = {
  lastId: number;
  links: Link[];
};

// Initialize links file if it doesn't exist
async function initLinksFile(): Promise<Result<void, TaskError>> {
  try {
    const file = Bun.file(LINKS_FILE);
    if (!await file.exists()) {
      const initialData: LinksData = { lastId: 0, links: [] };
      await Bun.write(LINKS_FILE, JSON.stringify(initialData, null, 2));
    }
    return ok(undefined);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'initLinksFile',
      cause,
    });
  }
}

// Read all links
async function readLinks(): Promise<Result<LinksData, TaskError>> {
  try {
    await initLinksFile();
    const file = Bun.file(LINKS_FILE);
    const data: LinksData = await file.json();
    return ok(data);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'readLinks',
      cause,
    });
  }
}

// Write all links
async function writeLinks(data: LinksData): Promise<Result<void, TaskError>> {
  try {
    await Bun.write(LINKS_FILE, JSON.stringify(data, null, 2));
    return ok(undefined);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'writeLinks',
      cause,
    });
  }
}

// Get next link ID
async function getNextLinkId(): Promise<Result<number, TaskError>> {
  const linksResult = await readLinks();
  if (!linksResult.success) return linksResult;

  const nextId = linksResult.data.lastId + 1;
  return ok(nextId);
}

// Create a new link
export async function createLink(
  fromTaskId: number,
  toTaskId: number,
  type: LinkType,
  description?: string
): Promise<Result<Link, TaskError>> {
  // Validate both tasks exist
  const fromTaskResult = await getTask(fromTaskId);
  if (!fromTaskResult.success) {
    return err({ code: 'NOT_FOUND', taskId: fromTaskId });
  }

  const toTaskResult = await getTask(toTaskId);
  if (!toTaskResult.success) {
    return err({ code: 'NOT_FOUND', taskId: toTaskId });
  }

  // Check for cycles if this is a blocking link
  if (type === 'blocks') {
    const cycleResult = await detectCycle(fromTaskId, toTaskId);
    if (!cycleResult.success) return cycleResult;

    if (cycleResult.data) {
      const path = await buildCyclePath(fromTaskId, toTaskId);
      return err({ code: 'DEPENDENCY_CYCLE', path });
    }
  }

  // Read current links
  const linksResult = await readLinks();
  if (!linksResult.success) return linksResult;

  const linksData = linksResult.data;

  // Check if link already exists
  const existingLink = linksData.links.find(
    link => link.fromTaskId === fromTaskId &&
            link.toTaskId === toTaskId &&
            link.type === type
  );

  if (existingLink) {
    return ok(existingLink);
  }

  // Get next ID
  const nextIdResult = await getNextLinkId();
  if (!nextIdResult.success) return nextIdResult;

  const id = nextIdResult.data;
  const now = new Date().toISOString();

  // Create new link
  const newLink: Link = {
    id,
    fromTaskId,
    toTaskId,
    type,
    ...(description && { description }),
    createdAt: now,
  };

  // Add to links array and update lastId
  linksData.links.push(newLink);
  linksData.lastId = id;

  // Write back
  const writeResult = await writeLinks(linksData);
  if (!writeResult.success) return writeResult;

  return ok(newLink);
}

// Delete a link by ID
export async function deleteLink(linkId: number): Promise<Result<void, TaskError>> {
  const linksResult = await readLinks();
  if (!linksResult.success) return linksResult;

  const linksData = linksResult.data;
  const linkIndex = linksData.links.findIndex(link => link.id === linkId);

  if (linkIndex === -1) {
    return err({ code: 'LINK_NOT_FOUND', linkId });
  }

  // Remove the link
  linksData.links.splice(linkIndex, 1);

  // Write back
  const writeResult = await writeLinks(linksData);
  if (!writeResult.success) return writeResult;

  return ok(undefined);
}

// Delete links between two tasks
export async function deleteLinksBetween(
  fromTaskId: number,
  toTaskId: number
): Promise<Result<number, TaskError>> {
  const linksResult = await readLinks();
  if (!linksResult.success) return linksResult;

  const linksData = linksResult.data;
  const initialCount = linksData.links.length;

  // Filter out links between these tasks
  linksData.links = linksData.links.filter(
    link => !(link.fromTaskId === fromTaskId && link.toTaskId === toTaskId)
  );

  const deletedCount = initialCount - linksData.links.length;

  if (deletedCount === 0) {
    return err({ code: 'LINK_NOT_FOUND', fromTaskId, toTaskId });
  }

  // Write back
  const writeResult = await writeLinks(linksData);
  if (!writeResult.success) return writeResult;

  return ok(deletedCount);
}

// Get all links originating from a task
export async function getLinksFrom(taskId: number): Promise<Result<Link[], TaskError>> {
  const linksResult = await readLinks();
  if (!linksResult.success) return linksResult;

  const links = linksResult.data.links.filter(link => link.fromTaskId === taskId);
  return ok(links);
}

// Get all links pointing to a task
export async function getLinksTo(taskId: number): Promise<Result<Link[], TaskError>> {
  const linksResult = await readLinks();
  if (!linksResult.success) return linksResult;

  const links = linksResult.data.links.filter(link => link.toTaskId === taskId);
  return ok(links);
}

// Get all links for a task (both from and to)
export async function getLinks(taskId: number): Promise<Result<{ from: Link[]; to: Link[] }, TaskError>> {
  const fromResult = await getLinksFrom(taskId);
  if (!fromResult.success) return fromResult;

  const toResult = await getLinksTo(taskId);
  if (!toResult.success) return toResult;

  return ok({
    from: fromResult.data,
    to: toResult.data,
  });
}

// Get links between two specific tasks
export async function getLinksBetween(
  fromTaskId: number,
  toTaskId: number
): Promise<Result<Link[], TaskError>> {
  const linksResult = await readLinks();
  if (!linksResult.success) return linksResult;

  const links = linksResult.data.links.filter(
    link => link.fromTaskId === fromTaskId && link.toTaskId === toTaskId
  );

  return ok(links);
}

// Cycle detection using DFS (only for blocking links)
async function detectCycle(fromId: number, toId: number): Promise<Result<boolean, TaskError>> {
  // If we add a blocking edge from fromId -> toId, check if there's already a path from toId -> fromId
  // through blocking links, which would create a cycle
  const visited = new Set<number>();
  const result = await dfs(toId, fromId, visited);
  return result;
}

// DFS to find if there's a path from start to target through blocking links
async function dfs(
  current: number,
  target: number,
  visited: Set<number>
): Promise<Result<boolean, TaskError>> {
  if (current === target) {
    return ok(true); // Found a path (cycle)
  }

  if (visited.has(current)) {
    return ok(false); // Already visited this node
  }

  visited.add(current);

  // Get all blocking links from the current task
  const linksResult = await getLinksFrom(current);
  if (!linksResult.success) {
    // If we can't read links, assume no cycle
    return ok(false);
  }

  const blockingLinks = linksResult.data.filter(link => link.type === 'blocks');

  // Check all blocking dependencies
  for (const link of blockingLinks) {
    const result = await dfs(link.toTaskId, target, visited);
    if (!result.success) return result;
    if (result.data) {
      return ok(true); // Found a cycle
    }
  }

  return ok(false); // No cycle found through this path
}

// Build the cycle path for error reporting
async function buildCyclePath(fromId: number, toId: number): Promise<number[]> {
  const path: number[] = [fromId];
  const visited = new Set<number>();

  async function findPath(current: number, target: number): Promise<boolean> {
    if (current === target) {
      path.push(current);
      return true;
    }

    if (visited.has(current)) {
      return false;
    }

    visited.add(current);
    path.push(current);

    const linksResult = await getLinksFrom(current);
    if (!linksResult.success) {
      path.pop();
      return false;
    }

    const blockingLinks = linksResult.data.filter(link => link.type === 'blocks');

    for (const link of blockingLinks) {
      if (await findPath(link.toTaskId, target)) {
        return true;
      }
    }

    path.pop();
    return false;
  }

  await findPath(toId, fromId);
  return path;
}

// Delete all links associated with a task (used when deleting a task)
export async function deleteTaskLinks(taskId: number): Promise<Result<void, TaskError>> {
  const linksResult = await readLinks();
  if (!linksResult.success) return linksResult;

  const linksData = linksResult.data;

  // Filter out all links involving this task
  linksData.links = linksData.links.filter(
    link => link.fromTaskId !== taskId && link.toTaskId !== taskId
  );

  // Write back
  const writeResult = await writeLinks(linksData);
  if (!writeResult.success) return writeResult;

  return ok(undefined);
}

