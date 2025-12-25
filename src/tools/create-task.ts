import { toolResponse } from './index.js';
import { createTask } from '@/services/task.service.js';
import type { CreateTaskToolInput } from '@/schemas/tool.schema.js';

export async function createTaskHandler(input: CreateTaskToolInput) {
  const result = await createTask(input);
  return toolResponse(result);
}

