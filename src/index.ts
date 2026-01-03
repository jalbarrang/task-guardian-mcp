#!/usr/bin/env bun
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initTaskDirectory } from '@/services/task.service.js';
import { createTaskHandler } from '@/tools/create-task.js';
import { getTaskHandler } from '@/tools/get-task.js';
import { updateTaskHandler } from '@/tools/update-task.js';
import { deleteTaskHandler } from '@/tools/delete-task.js';
import { listTasksHandler } from '@/tools/list-tasks.js';
import { queryTasksHandler } from '@/tools/query-tasks.js';
import { linkTasksHandler } from '@/tools/link-tasks.js';
import { unlinkTasksHandler } from '@/tools/unlink-tasks.js';
import { getLinksHandler } from '@/tools/get-links.js';
import { createTasksHandler } from '@/tools/create-tasks.js';
import { updateTasksHandler } from '@/tools/update-tasks.js';
import {
  CreateTaskToolSchema,
  CreateTaskOutputSchema,
  GetTaskToolSchema,
  GetTaskOutputSchema,
  UpdateTaskToolSchema,
  UpdateTaskOutputSchema,
  DeleteTaskToolSchema,
  DeleteTaskOutputSchema,
  ListTasksToolSchema,
  ListTasksOutputSchema,
  QueryTasksToolSchema,
  QueryTasksOutputSchema,
  LinkTasksToolSchema,
  LinkTasksOutputSchema,
  UnlinkTasksToolSchema,
  UnlinkTasksOutputSchema,
  GetLinksToolSchema,
  GetLinksOutputSchema,
  CreateTasksToolSchema,
  CreateTasksOutputSchema,
  UpdateTasksToolSchema,
  UpdateTasksOutputSchema,
} from '@/schemas/tool.schema.js';

async function main() {
  // Initialize task directory
  const initResult = await initTaskDirectory();
  if (!initResult.success) {
    console.error('Failed to initialize task directory:', initResult.error);
    process.exit(1);
  }

  // Create MCP server
  const server = new McpServer({
    name: 'task-guardian',
    version: '0.0.1',
  });

  // Register tools
  server.registerTool(
    'create_task',
    {
      title: 'Create Task',
      description: 'Create a new task with title, description, and optional metadata',
      inputSchema: CreateTaskToolSchema.shape,
      outputSchema: CreateTaskOutputSchema.shape,
    },
    createTaskHandler
  );

  server.registerTool(
    'get_task',
    {
      title: 'Get Task',
      description: 'Retrieve a task by its ID',
      inputSchema: GetTaskToolSchema.shape,
      outputSchema: GetTaskOutputSchema.shape,
    },
    getTaskHandler
  );

  server.registerTool(
    'update_task',
    {
      title: 'Update Task',
      description: 'Update an existing task with new values',
      inputSchema: UpdateTaskToolSchema.shape,
      outputSchema: UpdateTaskOutputSchema.shape,
    },
    updateTaskHandler
  );

  server.registerTool(
    'delete_task',
    {
      title: 'Delete Task',
      description: 'Delete a task (with optional force flag to ignore dependents)',
      inputSchema: DeleteTaskToolSchema.shape,
      outputSchema: DeleteTaskOutputSchema.shape,
    },
    deleteTaskHandler
  );

  server.registerTool(
    'list_tasks',
    {
      title: 'List Tasks',
      description: 'List tasks with optional filtering by status, priority, or type',
      inputSchema: ListTasksToolSchema.shape,
      outputSchema: ListTasksOutputSchema.shape,
    },
    listTasksHandler
  );

  server.registerTool(
    'query_tasks',
    {
      title: 'Query Tasks',
      description: 'Advanced task search with filtering, sorting, and pagination',
      inputSchema: QueryTasksToolSchema.shape,
      outputSchema: QueryTasksOutputSchema.shape,
    },
    queryTasksHandler
  );

  server.registerTool(
    'link_tasks',
    {
      title: 'Link Tasks',
      description: 'Create a typed link between two tasks (blocks, relates_to, etc.) with cycle detection for blocking links',
      inputSchema: LinkTasksToolSchema.shape,
      outputSchema: LinkTasksOutputSchema.shape,
    },
    linkTasksHandler
  );

  server.registerTool(
    'unlink_tasks',
    {
      title: 'Unlink Tasks',
      description: 'Remove a link between tasks by link ID or by task IDs',
      inputSchema: UnlinkTasksToolSchema.shape,
      outputSchema: UnlinkTasksOutputSchema.shape,
    },
    unlinkTasksHandler
  );

  server.registerTool(
    'get_links',
    {
      title: 'Get Links',
      description: 'Get all links for a task (both outgoing and incoming)',
      inputSchema: GetLinksToolSchema.shape,
      outputSchema: GetLinksOutputSchema.shape,
    },
    getLinksHandler
  );

  server.registerTool(
    'create_tasks',
    {
      title: 'Create Multiple Tasks',
      description: 'Batch create multiple tasks at once',
      inputSchema: CreateTasksToolSchema.shape,
      outputSchema: CreateTasksOutputSchema.shape,
    },
    createTasksHandler
  );

  server.registerTool(
    'update_tasks',
    {
      title: 'Update Multiple Tasks',
      description: 'Batch update multiple tasks at once',
      inputSchema: UpdateTasksToolSchema.shape,
      outputSchema: UpdateTasksOutputSchema.shape,
    },
    updateTasksHandler
  );

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Task Guardian MCP server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

