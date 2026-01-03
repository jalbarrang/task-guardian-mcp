export type Result<T, E = TaskError> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export type TaskError =
  | { readonly code: 'NOT_FOUND'; readonly taskId: number }
  | { readonly code: 'ALREADY_EXISTS'; readonly taskId: number }
  | { readonly code: 'VALIDATION_ERROR'; readonly message: string; readonly details?: unknown }
  | { readonly code: 'DEPENDENCY_CYCLE'; readonly path: readonly number[] }
  | { readonly code: 'DEPENDENCY_NOT_FOUND'; readonly taskId: number }
  | { readonly code: 'HAS_DEPENDENTS'; readonly dependentIds: readonly number[] }
  | { readonly code: 'FILE_SYSTEM_ERROR'; readonly operation: string; readonly cause: unknown }
  | { readonly code: 'INVALID_PARENT_TYPE'; readonly taskId: number; readonly parentId: number; readonly parentType: string; readonly expectedTypes: readonly string[] }
  | { readonly code: 'PARENT_NOT_FOUND'; readonly parentId: number }
  | { readonly code: 'SUBTASK_REQUIRES_PARENT'; readonly taskId: number }
  | { readonly code: 'LINK_NOT_FOUND'; readonly linkId?: number; readonly fromTaskId?: number; readonly toTaskId?: number };

// Helper constructors
export const ok = <T>(data: T): Result<T, never> => ({ success: true, data });
export const err = <E>(error: E): Result<never, E> => ({ success: false, error });

