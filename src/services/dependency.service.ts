import { ok, err } from '@/types/result.js';
import type { Result, TaskError } from '@/types/result.js';
import type { DependencyType } from '@/types/constants.js';
import { getTask, updateTask, listTasks } from './task.service.js';

export async function addDependency(
  fromId: number,
  toId: number,
  type: DependencyType,
  description?: string
): Promise<Result<void, TaskError>> {
  // Validate both tasks exist
  const fromTaskResult = await getTask(fromId);
  if (!fromTaskResult.success) return fromTaskResult;

  const toTaskResult = await getTask(toId);
  if (!toTaskResult.success) {
    return err({ code: 'DEPENDENCY_NOT_FOUND', taskId: toId });
  }

  // Check for cycles
  const cycleResult = await detectCycle(fromId, toId);
  if (!cycleResult.success) return cycleResult;

  if (cycleResult.data) {
    // Cycle detected - build the path
    const path = await buildCyclePath(fromId, toId);
    return err({ code: 'DEPENDENCY_CYCLE', path });
  }

  // Add dependency
  const fromTask = fromTaskResult.data;
  const existingDeps = fromTask.dependencies || [];

  // Check if dependency already exists
  const alreadyExists = existingDeps.some(
    dep => dep.taskId === toId && dep.type === type
  );

  if (alreadyExists) {
    // Already exists, just return success
    return ok(undefined);
  }

  const newDependencies = [
    ...existingDeps,
    {
      taskId: toId,
      type,
      ...(description && { description }),
    },
  ];

  const updateResult = await updateTask(fromId, { dependencies: newDependencies });
  if (!updateResult.success) return updateResult;

  return ok(undefined);
}

export async function removeDependency(
  fromId: number,
  toId: number
): Promise<Result<void, TaskError>> {
  const fromTaskResult = await getTask(fromId);
  if (!fromTaskResult.success) return fromTaskResult;

  const fromTask = fromTaskResult.data;
  const existingDeps = fromTask.dependencies || [];

  // Filter out the dependency
  const newDependencies = existingDeps.filter(dep => dep.taskId !== toId);

  const updateResult = await updateTask(fromId, { dependencies: newDependencies });
  if (!updateResult.success) return updateResult;

  return ok(undefined);
}

export async function getDependents(taskId: number): Promise<Result<number[], TaskError>> {
  const allTasksResult = await listTasks();
  if (!allTasksResult.success) return allTasksResult;

  const dependents = allTasksResult.data
    .filter(task => task.dependencies.some(dep => dep.taskId === taskId))
    .map(task => task.id);

  return ok(dependents);
}

// Cycle detection using DFS
export async function detectCycle(fromId: number, toId: number): Promise<Result<boolean, TaskError>> {
  // If we add an edge from fromId -> toId, check if there's already a path from toId -> fromId
  // which would create a cycle
  const visited = new Set<number>();
  const result = await dfs(toId, fromId, visited);
  return result;
}

// DFS to find if there's a path from start to target
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

  // Get the current task's dependencies
  const taskResult = await getTask(current);
  if (!taskResult.success) {
    // If task doesn't exist, no cycle through this path
    if (taskResult.error.code === 'NOT_FOUND') {
      return ok(false);
    }
    return taskResult;
  }

  const task = taskResult.data;

  // Check all dependencies
  for (const dep of task.dependencies) {
    const result = await dfs(dep.taskId, target, visited);
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

    const taskResult = await getTask(current);
    if (!taskResult.success) {
      path.pop();
      return false;
    }

    const task = taskResult.data;

    for (const dep of task.dependencies) {
      if (await findPath(dep.taskId, target)) {
        return true;
      }
    }

    path.pop();
    return false;
  }

  await findPath(toId, fromId);
  return path;
}

