import { deleteTask } from '@/services/task.service.js';
import type { DeleteTaskToolInput } from '@/schemas/tool.schema.js';

export async function deleteTaskHandler(input: DeleteTaskToolInput) {
  const result = await deleteTask(input.taskId, input.force);

  if (result.success) {
    return {
      content: [{
        type: 'text' as const,
        text: `Task ${input.taskId} deleted successfully`
      }],
      structuredContent: {
        success: true,
        taskId: input.taskId,
      },
    };
  }

  // Format error message
  let errorMessage = `Error: ${result.error.code}`;

  if (result.error.code === 'HAS_DEPENDENTS') {
    errorMessage = `Cannot delete task ${input.taskId} - other tasks depend on it: ${result.error.dependentIds.join(', ')}`;
  } else if (result.error.code === 'NOT_FOUND') {
    errorMessage = `Task ${result.error.taskId} not found`;
  }

  return {
    content: [{ type: 'text' as const, text: errorMessage }],
    isError: true,
  };
}

