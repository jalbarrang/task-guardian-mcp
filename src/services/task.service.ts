import { ok, err } from '@/types/result.js';
import type { Result, TaskError } from '@/types/result.js';
import { TaskSchema } from '@/schemas/task.schema.js';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/schemas/task.schema.js';
import { join } from 'path';
import { mkdir, exists } from 'fs/promises';

const TASK_DIR = '.task';
const META_FILE = `${TASK_DIR}/.meta.json`;
const ARCHIVE_DIR = `${TASK_DIR}/archive`;

type Meta = { lastId: number };

type TaskFilters = {
  status?: string;
  priority?: string;
  type?: string;
  limit?: number;
  offset?: number;
};

type TaskQuery = {
  filters?: {
    status?: string[];
    priority?: string[];
    type?: string[];
    hasDependencies?: boolean;
    titleContains?: string;
    descriptionContains?: string;
  };
  sort?: {
    field: 'createdAt' | 'updatedAt' | 'priority' | 'title';
    order: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
};

type QueryResult = {
  tasks: Task[];
  total: number;
};

function getTaskPath(id: number): string {
  return `${TASK_DIR}/task-${id}.json`;
}

function getArchiveTaskPath(id: number): string {
  return `${ARCHIVE_DIR}/task-${id}.json`;
}

export async function initTaskDirectory(): Promise<Result<void, TaskError>> {
  try {
    // Create .task directory
    if (!await exists(TASK_DIR)) {
      await mkdir(TASK_DIR, { recursive: true });
    }

    // Create .task/archive directory
    if (!await exists(ARCHIVE_DIR)) {
      await mkdir(ARCHIVE_DIR, { recursive: true });
    }

    // Create .meta.json if it doesn't exist
    if (!await exists(META_FILE)) {
      const meta: Meta = { lastId: 0 };
      await Bun.write(META_FILE, JSON.stringify(meta, null, 2));
    }

    return ok(undefined);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'initTaskDirectory',
      cause,
    });
  }
}

export async function getNextTaskId(): Promise<Result<number, TaskError>> {
  try {
    const file = Bun.file(META_FILE);
    const meta: Meta = await file.json();
    const nextId = meta.lastId + 1;

    // Update meta file atomically
    meta.lastId = nextId;
    await Bun.write(META_FILE, JSON.stringify(meta, null, 2));

    return ok(nextId);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'getNextTaskId',
      cause,
    });
  }
}

export async function createTask(input: CreateTaskInput): Promise<Result<Task, TaskError>> {
  try {
    // Get next ID
    const idResult = await getNextTaskId();
    if (!idResult.success) return idResult;

    const id = idResult.data;
    const now = new Date().toISOString();

    // Build task object
    const taskData = {
      id,
      title: input.title,
      description: input.description,
      status: input.status ?? 'pending',
      priority: input.priority ?? 'medium',
      type: input.type ?? 'task',
      dependencies: input.dependencies ?? [],
      createdAt: now,
      updatedAt: now,
      ...(input as any), // Include any custom metadata fields
    };

    // Validate with Zod (passthrough allows custom fields)
    const validation = TaskSchema.safeParse(taskData);
    if (!validation.success) {
      return err({
        code: 'VALIDATION_ERROR',
        message: 'Task validation failed',
        details: validation.error,
      });
    }

    const task = validation.data;

    // Write to file
    const taskPath = getTaskPath(id);
    await Bun.write(taskPath, JSON.stringify(task, null, 2));

    return ok(task);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'createTask',
      cause,
    });
  }
}

export async function getTask(id: number): Promise<Result<Task, TaskError>> {
  try {
    const taskPath = getTaskPath(id);
    const file = Bun.file(taskPath);

    if (!await file.exists()) {
      return err({ code: 'NOT_FOUND', taskId: id });
    }

    const taskData = await file.json();
    const validation = TaskSchema.safeParse(taskData);

    if (!validation.success) {
      return err({
        code: 'VALIDATION_ERROR',
        message: 'Stored task data is invalid',
        details: validation.error,
      });
    }

    return ok(validation.data);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'getTask',
      cause,
    });
  }
}

export async function updateTask(id: number, updates: UpdateTaskInput): Promise<Result<Task, TaskError>> {
  try {
    // Get existing task
    const existingResult = await getTask(id);
    if (!existingResult.success) return existingResult;

    const existing = existingResult.data;
    const now = new Date().toISOString();

    // Merge updates
    const updated = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      createdAt: existing.createdAt, // Preserve creation time
      updatedAt: now,
    };

    // Validate
    const validation = TaskSchema.safeParse(updated);
    if (!validation.success) {
      return err({
        code: 'VALIDATION_ERROR',
        message: 'Updated task validation failed',
        details: validation.error,
      });
    }

    const task = validation.data;

    // Write atomically
    const taskPath = getTaskPath(id);
    await Bun.write(taskPath, JSON.stringify(task, null, 2));

    return ok(task);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'updateTask',
      cause,
    });
  }
}

export async function deleteTask(id: number, force = false): Promise<Result<void, TaskError>> {
  try {
    // Check if task exists
    const taskResult = await getTask(id);
    if (!taskResult.success) return taskResult;

    // Check for dependents unless force is true
    if (!force) {
      const dependentsResult = await getDependents(id);
      if (!dependentsResult.success) return dependentsResult;

      if (dependentsResult.data.length > 0) {
        return err({
          code: 'HAS_DEPENDENTS',
          dependentIds: dependentsResult.data,
        });
      }
    }

    // Delete the file
    const taskPath = getTaskPath(id);
    await Bun.write(taskPath, ''); // Bun doesn't have unlink in the same way, so we'll use rm
    const proc = Bun.spawn(['rm', taskPath]);
    await proc.exited;

    return ok(undefined);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'deleteTask',
      cause,
    });
  }
}

export async function listTasks(filters?: TaskFilters): Promise<Result<Task[], TaskError>> {
  try {
    // Read all task files
    const glob = new Bun.Glob('task-*.json');
    const files = Array.from(glob.scanSync({ cwd: TASK_DIR }));

    const tasks: Task[] = [];

    for (const file of files) {
      const taskPath = join(TASK_DIR, file);
      const taskFile = Bun.file(taskPath);
      const taskData = await taskFile.json();
      const validation = TaskSchema.safeParse(taskData);

      if (validation.success) {
        tasks.push(validation.data);
      }
    }

    // Apply filters
    let filtered = tasks;

    if (filters?.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters?.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    if (filters?.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Apply pagination
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit;

    let paginated = filtered.slice(offset);
    if (limit) {
      paginated = paginated.slice(0, limit);
    }

    return ok(paginated);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'listTasks',
      cause,
    });
  }
}

export async function queryTasks(query: TaskQuery): Promise<Result<QueryResult, TaskError>> {
  try {
    // Get all tasks
    const allTasksResult = await listTasks();
    if (!allTasksResult.success) return allTasksResult;

    let tasks = allTasksResult.data;

    // Apply filters
    if (query.filters) {
      const f = query.filters;

      if (f.status && f.status.length > 0) {
        tasks = tasks.filter(t => f.status!.includes(t.status));
      }

      if (f.priority && f.priority.length > 0) {
        tasks = tasks.filter(t => f.priority!.includes(t.priority));
      }

      if (f.type && f.type.length > 0) {
        tasks = tasks.filter(t => f.type!.includes(t.type));
      }

      if (f.hasDependencies !== undefined) {
        tasks = tasks.filter(t => (t.dependencies.length > 0) === f.hasDependencies);
      }

      if (f.titleContains) {
        const search = f.titleContains.toLowerCase();
        tasks = tasks.filter(t => t.title.toLowerCase().includes(search));
      }

      if (f.descriptionContains) {
        const search = f.descriptionContains.toLowerCase();
        tasks = tasks.filter(t => t.description.toLowerCase().includes(search));
      }
    }

    // Apply sorting
    if (query.sort) {
      const { field, order } = query.sort;
      tasks.sort((a, b) => {
        let aVal: any = a[field];
        let bVal: any = b[field];

        // Handle priority sorting by converting to numeric
        if (field === 'priority') {
          const priorityOrder: Record<string, number> = {
            low: 1,
            medium: 2,
            high: 3,
            critical: 4,
          };
          aVal = priorityOrder[aVal] ?? 0;
          bVal = priorityOrder[bVal] ?? 0;
        }

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = tasks.length;

    // Apply pagination
    const offset = query.offset ?? 0;
    const limit = query.limit;

    let paginated = tasks.slice(offset);
    if (limit) {
      paginated = paginated.slice(0, limit);
    }

    return ok({ tasks: paginated, total });
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'queryTasks',
      cause,
    });
  }
}

export async function archiveTask(id: number): Promise<Result<void, TaskError>> {
  try {
    // Get task
    const taskResult = await getTask(id);
    if (!taskResult.success) return taskResult;

    const task = taskResult.data;

    // Write to archive
    const archivePath = getArchiveTaskPath(id);
    await Bun.write(archivePath, JSON.stringify(task, null, 2));

    // Delete original
    const taskPath = getTaskPath(id);
    const proc = Bun.spawn(['rm', taskPath]);
    await proc.exited;

    return ok(undefined);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'archiveTask',
      cause,
    });
  }
}

// Helper function to get all tasks that depend on a given task
async function getDependents(taskId: number): Promise<Result<number[], TaskError>> {
  try {
    const allTasksResult = await listTasks();
    if (!allTasksResult.success) return allTasksResult;

    const dependents = allTasksResult.data
      .filter(task => task.dependencies.some(dep => dep.taskId === taskId))
      .map(task => task.id);

    return ok(dependents);
  } catch (cause) {
    return err({
      code: 'FILE_SYSTEM_ERROR',
      operation: 'getDependents',
      cause,
    });
  }
}

export { getDependents };

