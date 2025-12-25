import { removeDependency } from '@/services/dependency.service.js';
import type { RemoveDependencyToolInput } from '@/schemas/tool.schema.js';

export async function removeDependencyHandler(input: RemoveDependencyToolInput) {
  const result = await removeDependency(input.fromTaskId, input.toTaskId);

  if (result.success) {
    return {
      content: [{
        type: 'text' as const,
        text: `Dependency removed: Task ${input.fromTaskId} no longer depends on Task ${input.toTaskId}`
      }],
      structuredContent: {
        success: true,
        fromTaskId: input.fromTaskId,
        toTaskId: input.toTaskId,
      },
    };
  }

  // Format error message
  let errorMessage = `Error: ${result.error.code}`;

  if (result.error.code === 'NOT_FOUND') {
    errorMessage = `Task ${result.error.taskId} not found`;
  }

  return {
    content: [{ type: 'text' as const, text: errorMessage }],
    isError: true,
  };
}

