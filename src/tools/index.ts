import type { Result, TaskError } from '@/types/result.js';

/**
 * Helper function to create consistent MCP tool responses
 * Converts Result types into MCP-compatible response format
 */
export function toolResponse<T>(result: Result<T, TaskError>) {
  if (result.success) {
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }],
      structuredContent: result.data,
    };
  }

  // Format error message based on error code
  let errorMessage = `Error: ${result.error.code}`;

  switch (result.error.code) {
    case 'NOT_FOUND':
      errorMessage = `Task ${result.error.taskId} not found`;
      break;
    case 'ALREADY_EXISTS':
      errorMessage = `Task ${result.error.taskId} already exists`;
      break;
    case 'VALIDATION_ERROR':
      errorMessage = `Validation error: ${result.error.message}`;
      if (result.error.details) {
        errorMessage += `\nDetails: ${JSON.stringify(result.error.details, null, 2)}`;
      }
      break;
    case 'DEPENDENCY_CYCLE':
      errorMessage = `Dependency cycle detected: ${result.error.path.join(' -> ')}`;
      break;
    case 'DEPENDENCY_NOT_FOUND':
      errorMessage = `Dependency target task ${result.error.taskId} not found`;
      break;
    case 'HAS_DEPENDENTS':
      errorMessage = `Cannot delete task - other tasks depend on it: ${result.error.dependentIds.join(', ')}`;
      break;
    case 'FILE_SYSTEM_ERROR':
      errorMessage = `File system error during ${result.error.operation}`;
      break;
  }

  return {
    content: [{ type: 'text' as const, text: errorMessage }],
    isError: true,
  };
}

