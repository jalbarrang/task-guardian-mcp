import { toolResponse } from './index.js';
import { deleteLink, deleteLinksBetween } from '@/services/link.service.js';
import type { UnlinkTasksToolInput } from '@/schemas/tool.schema.js';
import { ok } from '@/types/result.js';

export async function unlinkTasksHandler(input: UnlinkTasksToolInput) {
  if (input.linkId !== undefined) {
    // Delete by link ID
    const result = await deleteLink(input.linkId);
    if (result.success) {
      return toolResponse(ok({ success: true as const, linkId: input.linkId }));
    }
    return toolResponse(result);
  } else if (input.fromTaskId !== undefined && input.toTaskId !== undefined) {
    // Delete by task IDs
    const result = await deleteLinksBetween(input.fromTaskId, input.toTaskId);
    if (result.success) {
      return toolResponse(ok({
        success: true as const,
        deletedCount: result.data,
        fromTaskId: input.fromTaskId,
        toTaskId: input.toTaskId
      }));
    }
    return toolResponse(result);
  }

  // Should never reach here due to schema validation
  return toolResponse({
    success: false,
    error: {
      code: 'VALIDATION_ERROR' as const,
      message: 'Either linkId or both fromTaskId and toTaskId must be provided',
    },
  });
}

