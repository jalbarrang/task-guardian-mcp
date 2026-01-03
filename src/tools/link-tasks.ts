import { toolResponse } from './index.js';
import { createLink } from '@/services/link.service.js';
import type { LinkTasksToolInput } from '@/schemas/tool.schema.js';

export async function linkTasksHandler(input: LinkTasksToolInput) {
  const result = await createLink(
    input.fromTaskId,
    input.toTaskId,
    input.type,
    input.description
  );
  return toolResponse(result);
}

