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
    case 'INVALID_PARENT_TYPE':
      errorMessage = `Invalid parent type: Task ${result.error.taskId} cannot have parent ${result.error.parentId} of type '${result.error.parentType}'. Expected: ${result.error.expectedTypes.join(', ')}`;
      break;
    case 'PARENT_NOT_FOUND':
      errorMessage = `Parent task ${result.error.parentId} not found`;
      break;
    case 'SUBTASK_REQUIRES_PARENT':
      errorMessage = `SubTask must have a parent task`;
      break;
    case 'LINK_NOT_FOUND':
      if (result.error.linkId) {
        errorMessage = `Link ${result.error.linkId} not found`;
      } else {
        errorMessage = `Link between tasks ${result.error.fromTaskId} and ${result.error.toTaskId} not found`;
      }
      break;
  }

  return {
    content: [{ type: 'text' as const, text: errorMessage }],
    isError: true,
  };
}

