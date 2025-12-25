import { toolResponse } from './index.js';
import { queryTasks } from '@/services/task.service.js';
import type { QueryTasksToolInput } from '@/schemas/tool.schema.js';

export async function queryTasksHandler(input: QueryTasksToolInput) {
  const result = await queryTasks(input);
  return toolResponse(result);
}

