import { toolResponse } from './index.js';
import { createTask } from '@/services/task.service.js';
import type { CreateTasksToolInput } from '@/schemas/tool.schema.js';
import type { Task } from '@/schemas/task.schema.js';
import type { TaskError } from '@/types/result.js';

type BatchResult = {
  success: Task[];
  failed: Array<{ index: number; error: TaskError }>;
};

export async function createTasksHandler(input: CreateTasksToolInput) {
  const results: BatchResult = {
    success: [],
    failed: [],
  };

  for (let i = 0; i < input.tasks.length; i++) {
    const taskInput = input.tasks[i];
    if (!taskInput) continue;
    const result = await createTask(taskInput);

    if (result.success) {
      results.success.push(result.data);
    } else {
      results.failed.push({ index: i, error: result.error });
    }
  }

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify(results, null, 2),
    }],
    structuredContent: results,
  };
}

