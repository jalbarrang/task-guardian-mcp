import { toolResponse } from './index.js';
import { getLinks } from '@/services/link.service.js';
import type { GetLinksToolInput } from '@/schemas/tool.schema.js';

export async function getLinksHandler(input: GetLinksToolInput) {
  const result = await getLinks(input.taskId);
  return toolResponse(result);
}

