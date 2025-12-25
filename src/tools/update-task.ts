import { toolResponse } from './index.js';
import { updateTask } from '@/services/task.service.js';
import type { UpdateTaskToolInput } from '@/schemas/tool.schema.js';

export async function updateTaskHandler(input: UpdateTaskToolInput) {
  const { taskId, ...updates } = input;
  const result = await updateTask(taskId, updates);
  return toolResponse(result);
}

