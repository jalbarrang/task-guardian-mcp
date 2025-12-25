# Task Guardian MCP

A Model Context Protocol (MCP) server for intelligent task management in AI-powered development environments like Cursor.

## Features

- 📁 **File-based storage** - Tasks stored as JSON files in `.task/` directory
- 🔢 **Sequential IDs** - Simple, incremental task numbering
- 🔗 **Typed dependencies** - Model relationships between tasks (blocks, requires, related-to)
- 🔄 **Cycle detection** - Prevents circular dependencies at creation time
- 📝 **Rich descriptions** - Full markdown support with code blocks and checklists
- 🎯 **Task types** - Support for user stories, tasks, and bugs
- 🔍 **Advanced querying** - Filter, sort, and search tasks
- ⚡ **Batch operations** - Create or update multiple tasks at once
- 📦 **Custom metadata** - Store project-specific attributes on tasks

## Installation

```bash
bun install
```

## Usage

### Running the Server

Start the MCP server:

```bash
bun start
```

For development with auto-reload:

```bash
bun run dev
```

### Cursor Integration

Add Task Guardian to your Cursor MCP configuration:

**Location**: `~/.cursor/config/mcp_settings.json`

```json
{
  "mcpServers": {
    "task-guardian": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/task-guardian-mcp/src/index.ts"]
    }
  }
}
```

Replace `/absolute/path/to/task-guardian-mcp` with the actual path to this repository on your machine.

## Task Schema

Tasks are stored in `.task/task-{id}.json` with the following structure:

```typescript
{
  id: number;              // Sequential ID (1, 2, 3, ...)
  title: string;           // Task title (1-200 chars)
  description: string;     // Markdown-formatted description
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'user_story' | 'task' | 'bug';
  dependencies: Array<{
    taskId: number;
    type: 'blocks' | 'requires' | 'related-to';
    description?: string;
  }>;
  createdAt: string;       // ISO8601 timestamp
  updatedAt: string;       // ISO8601 timestamp
  [key: string]: any;      // Custom metadata fields
}
```

## Available Tools

### Core Operations

- **`create_task`** - Create a new task
- **`get_task`** - Retrieve a task by ID
- **`update_task`** - Update task fields
- **`delete_task`** - Delete a task (with dependency check)
- **`list_tasks`** - List tasks with optional filtering
- **`query_tasks`** - Advanced search with sorting and pagination

### Dependency Management

- **`add_dependency`** - Add a typed dependency (with cycle detection)
- **`remove_dependency`** - Remove a dependency link

### Batch Operations

- **`create_tasks`** - Create multiple tasks at once
- **`update_tasks`** - Update multiple tasks at once

## Examples

### Creating a Task

```json
{
  "title": "Implement OAuth2 authentication",
  "description": "## Overview\n\nAdd OAuth2 support using Google identity provider.\n\n## Acceptance Criteria\n\n- [ ] User can login with Google\n- [ ] JWT tokens generated\n- [ ] Token refresh works",
  "priority": "high",
  "type": "task"
}
```

### Adding Dependencies

```json
{
  "fromTaskId": 5,
  "toTaskId": 3,
  "type": "blocks",
  "description": "OAuth requires database setup first"
}
```

### Querying Tasks

```json
{
  "filters": {
    "status": ["in_progress", "blocked"],
    "priority": ["high", "critical"],
    "titleContains": "auth"
  },
  "sort": {
    "field": "priority",
    "order": "desc"
  },
  "limit": 10
}
```

## Architecture

- **Types** (`src/types/`) - Type definitions and constants using `as const` pattern
- **Schemas** (`src/schemas/`) - Zod validation schemas with type inference
- **Services** (`src/services/`) - Business logic for tasks and dependencies
- **Tools** (`src/tools/`) - MCP tool implementations
- **Index** (`src/index.ts`) - MCP server entry point

## Development

Type checking:

```bash
bun run typecheck
```

## File Structure

```
.task/
├── .meta.json           # Stores last task ID
├── task-1.json          # Individual task files
├── task-2.json
└── archive/             # Archived completed tasks
    └── task-old.json
```

## TypeScript Best Practices

This project follows modern TypeScript patterns:

- ✅ `as const` objects instead of enums
- ✅ Zod schema inference for single source of truth
- ✅ Result types for error handling
- ✅ `readonly` modifiers for immutability
- ✅ `type` over `interface` for data shapes
- ✅ Permissive validation with `.passthrough()`

## License

MIT

## Related

- [ADR-001: Initial Architecture](docs/adr/001-initial-architecture.md)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cursor Documentation](https://cursor.sh/docs)
