import { addDependency } from '@/services/dependency.service.js';
import type { AddDependencyToolInput } from '@/schemas/tool.schema.js';

export async function addDependencyHandler(input: AddDependencyToolInput) {
  const result = await addDependency(
    input.fromTaskId,
    input.toTaskId,
    input.type,
    input.description
  );

  if (result.success) {
    return {
      content: [{
        type: 'text' as const,
        text: `Dependency added: Task ${input.fromTaskId} ${input.type} Task ${input.toTaskId}`
      }],
      structuredContent: {
        success: true,
        fromTaskId: input.fromTaskId,
        toTaskId: input.toTaskId,
        type: input.type,
      },
    };
  }

  // Format error message
  let errorMessage = `Error: ${result.error.code}`;

  if (result.error.code === 'DEPENDENCY_CYCLE') {
    errorMessage = `Dependency cycle detected: ${result.error.path.join(' -> ')}`;
  } else if (result.error.code === 'NOT_FOUND') {
    errorMessage = `Task ${result.error.taskId} not found`;
  } else if (result.error.code === 'DEPENDENCY_NOT_FOUND') {
    errorMessage = `Dependency target task ${result.error.taskId} not found`;
  }

  return {
    content: [{ type: 'text' as const, text: errorMessage }],
    isError: true,
  };
}

