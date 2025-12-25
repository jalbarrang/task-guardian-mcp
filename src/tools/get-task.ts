import { toolResponse } from './index.js';
import { getTask } from '@/services/task.service.js';
import type { GetTaskToolInput } from '@/schemas/tool.schema.js';

export async function getTaskHandler(input: GetTaskToolInput) {
  const result = await getTask(input.taskId);
  return toolResponse(result);
}

