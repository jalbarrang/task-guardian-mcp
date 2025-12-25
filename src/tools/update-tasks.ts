import { toolResponse } from './index.js';
import { updateTask } from '@/services/task.service.js';
import type { UpdateTasksToolInput } from '@/schemas/tool.schema.js';
import type { Task } from '@/schemas/task.schema.js';
import type { TaskError } from '@/types/result.js';

type BatchUpdateResult = {
  success: Task[];
  failed: Array<{ taskId: number; error: TaskError }>;
};

export async function updateTasksHandler(input: UpdateTasksToolInput) {
  const results: BatchUpdateResult = {
    success: [],
    failed: [],
  };

  for (const update of input.updates) {
    const { taskId, ...updates } = update;
    const result = await updateTask(taskId, updates);

    if (result.success) {
      results.success.push(result.data);
    } else {
      results.failed.push({ taskId, error: result.error });
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

