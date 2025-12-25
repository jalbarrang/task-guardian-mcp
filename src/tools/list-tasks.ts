import { listTasks } from '@/services/task.service.js';
import type { ListTasksToolInput } from '@/schemas/tool.schema.js';

export async function listTasksHandler(input: ListTasksToolInput) {
  const result = await listTasks(input);

  if (result.success) {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result.data, null, 2)
      }],
      structuredContent: {
        tasks: result.data,
        count: result.data.length,
      },
    };
  }

  return {
    content: [{
      type: 'text' as const,
      text: `Error: ${result.error.code}`
    }],
    isError: true,
  };
}

