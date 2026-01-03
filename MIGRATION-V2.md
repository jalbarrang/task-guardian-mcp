# Task Guardian v2 Migration Guide

> ⚠️ **Breaking Changes**: This is a **full refactor** with no backward compatibility. The `dependencies` field is completely removed from tasks. Make sure you have backups before migrating!

## Quick Start

**For projects using Task Guardian MCP:**

```bash
# 1. Navigate to YOUR project (not the MCP server directory)
cd /path/to/your/project

# 2. Find your MCP server path (see Step 0 below if unsure)
# 3. Run the migration
bun /path/to/task-guardian-mcp/scripts/migrate-v2.ts

# 4. Test the CLI
# (If you have the CLI configured)
task-guardian-cli
```

That's it! Continue reading for detailed information about what changed and how to use the new features.

---

## Overview

Task Guardian v2 introduces a hierarchical work item system and separate linked items management, bringing the system closer to enterprise task management tools like Jira.

## What's New

### 1. Hierarchical Work Items

Tasks now support parent-child relationships via the `parentId` field:

```
Epic → User Story → Task → SubTask
```

**New Task Types:**
- `epic` - Top-level initiative
- `user_story` - Feature or requirement (can belong to Epic)
- `task` - Implementation work (can belong to User Story)
- `sub_task` - Granular work item (must belong to Task)
- `bug` - Defect (can belong to Epic or User Story)

**Hierarchy Rules:**
- **Epic**: No parent required, no valid parent types
- **User Story**: Optional parent, can belong to Epic
- **Task**: Optional parent, can belong to User Story
- **SubTask**: Parent required, must belong to Task
- **Bug**: Optional parent, can belong to Epic or User Story

### 2. Separate Linked Items System

Dependencies have been moved from inline task fields to a separate `.task/links.json` file.

**New Link Types:**
- `blocks` - Hard dependency with cycle detection
- `is_blocked_by` - Reverse of blocks
- `relates_to` - Informational relationship
- `duplicates` - Marks as duplicate
- `is_duplicated_by` - Reverse of duplicates

### 3. New MCP Tools

**Replaced:**
- `add_dependency` → `link_tasks`
- `remove_dependency` → `unlink_tasks`

**New:**
- `get_links` - Get all links for a task (incoming and outgoing)

**Updated:**
- `create_task` - Now accepts `parentId`
- `update_task` - Now accepts `parentId`
- `create_tasks` - Now accepts `parentId` per task
- `update_tasks` - Now accepts `parentId` per task

### 4. Enhanced CLI

The CLI now displays tasks in a hierarchical tree structure:

```
Epic 1: Platform Foundation
  User Story 2: Authentication
    Task 3: Implement OAuth
      SubTask 4: Add Google provider
    Task 5: Session management

Ungrouped
  Bug 8: Fix login crash
```

Task detail view now shows:
- Parent task (if any)
- Child tasks
- Legacy dependencies (for backward compatibility)

## Migration Steps

**Important**: Run these commands from your **consumer project** directory (where your `.task/` folder is), not from the MCP server directory.

### Step 0: Find Your MCP Server Path

If you're not sure where your MCP server is installed, check your Cursor MCP configuration:

1. **Via Cursor Settings UI:**
   - Open Cursor Settings
   - Go to "Features" → "MCP"
   - Look for `task-guardian-mcp` entry
   - Note the path shown

2. **Via Settings File:**
   ```bash
   # macOS/Linux
   cat ~/.cursor/settings.json | grep -A 5 "task-guardian"

   # Or manually check:
   # ~/.cursor/mcp_server_settings.json
   # or
   # .cursor/settings.json in your project
   ```

The output will show something like:
```json
{
  "mcpServers": {
    "task-guardian-mcp": {
      "command": "bun",
      "args": ["run", "/Users/you/projects/task-guardian-mcp/src/index.ts"]
    }
  }
}
```

Use the path from `args` (e.g., `/Users/you/projects/task-guardian-mcp`) in the migration commands below.

### Step 1: Backup Your Data

The migration script automatically creates backups, but you can manually backup:

```bash
# From your project root (where .task/ is located)
cp -r .task .task-backup
```

### Step 2: Run Migration Script

You have several options to run the migration script:

#### Option A: Use the Installed Binary (Easiest)

If you have `task-guardian-mcp` configured in your Cursor settings, the migration tool is already available:

```bash
# From your project root (where .task/ is located)
# If using local path from Cursor MCP settings
/path/to/task-guardian-mcp/scripts/migrate-v2.ts

# Or if you have bun and can access the node_modules
bunx task-guardian-migrate
```

#### Option B: Run Directly with Bun

```bash
# From your project root (where .task/ is located)
bun /path/to/task-guardian-mcp/scripts/migrate-v2.ts
```

Replace `/path/to/task-guardian-mcp` with the actual path to where you cloned the MCP server (check your `.cursor/settings.json` or Cursor MCP configuration).

#### Option C: Copy Script to Your Project

```bash
# From your project root
# Copy the script from the MCP server location
cp /path/to/task-guardian-mcp/scripts/migrate-v2.ts ./migrate-v2.ts

# Run it
bun migrate-v2.ts

# Clean up after successful migration
rm migrate-v2.ts
```

#### Option D: Use bunx (if published to npm)

```bash
# From your project root (future option when published)
bunx task-guardian-migrate
```

The script will:
1. Create `.task/backup-v1/` with original task files
2. Convert inline dependencies to `.task/links.json`
3. Update task files (**REMOVES dependencies field completely** - no backward compatibility)

### Step 3: Test the CLI

```bash
bun run cli
```

Verify that:
- All tasks are displayed correctly
- Navigation works
- Task details show properly

### Step 4: Update Your Workflows

**Old way (deprecated):**
```typescript
// Add dependency
await addDependency(fromTaskId, toTaskId, 'blocks', 'Must complete first');

// Remove dependency
await removeDependency(fromTaskId, toTaskId);
```

**New way:**
```typescript
// Link tasks
await linkTasks(fromTaskId, toTaskId, 'blocks', 'Must complete first');

// Unlink tasks (by link ID)
await unlinkTasks({ linkId: 123 });

// Or unlink by task IDs
await unlinkTasks({ fromTaskId: 1, toTaskId: 2 });

// Get all links for a task
const links = await getLinks(taskId);
// Returns: { from: Link[], to: Link[] }
```

**Creating hierarchical tasks:**
```typescript
// Create an Epic
const epic = await createTask({
  title: 'Q1 Platform Improvements',
  description: 'Major platform enhancements',
  type: 'epic',
  priority: 'high',
});

// Create a User Story under the Epic
const userStory = await createTask({
  title: 'User Authentication',
  description: 'Implement OAuth2 flow',
  type: 'user_story',
  parentId: epic.id,
  priority: 'high',
});

// Create a Task under the User Story
const task = await createTask({
  title: 'Add Google OAuth provider',
  description: 'Integrate Google OAuth',
  type: 'task',
  parentId: userStory.id,
  priority: 'high',
});

// Create a SubTask under the Task
const subTask = await createTask({
  title: 'Configure OAuth credentials',
  description: 'Set up Google Cloud project',
  type: 'sub_task',
  parentId: task.id, // Required for sub_task
  priority: 'medium',
});
```

## Breaking Changes

### 1. Dependency Service Removed

`src/services/dependency.service.ts` has been removed. Use `src/services/link.service.ts` instead.

**Migration:**
- `addDependency()` → `createLink()`
- `removeDependency()` → `deleteLink()` or `deleteLinksBetween()`
- `getDependents()` → `getLinksTo()`

### 2. New Error Codes

Added error codes for hierarchy validation:
- `INVALID_PARENT_TYPE` - Parent has wrong type for child
- `PARENT_NOT_FOUND` - Parent task doesn't exist
- `SUBTASK_REQUIRES_PARENT` - SubTask created without parent
- `LINK_NOT_FOUND` - Link doesn't exist

### 3. Schema Changes

**TaskSchema:**
- Added: `parentId?: number`
- Changed: `dependencies` is now optional (for backward compat)
- Added: `type` now includes 'epic' and 'sub_task'

**New LinkSchema:**
```typescript
{
  id: number;
  fromTaskId: number;
  toTaskId: number;
  type: 'blocks' | 'is_blocked_by' | 'relates_to' | 'duplicates' | 'is_duplicated_by';
  description?: string;
  createdAt: string;
}
```

## Breaking Changes - No Backward Compatibility

**Important**: This is a **full refactor** with no backward compatibility.

### Dependencies Field Removed

The migration script **completely removes** the `dependencies` field from all task files:

1. ❌ Old code that expects `task.dependencies` will break
2. ✅ All dependency data is now in `.task/links.json`
3. ✅ Use `get_links` MCP tool or link service to query links
4. ✅ Cleaner task files without redundant data

### No Gradual Migration

This is an **all-or-nothing** migration:
1. Run the migration script (creates backup automatically)
2. All tasks are updated immediately
3. Use new `link_tasks` / `unlink_tasks` tools
4. Old `add_dependency` / `remove_dependency` tools are removed

## Rollback

If you need to rollback:

1. Stop the MCP server
2. Restore from backup:
   ```bash
   rm -rf .task
   mv .task-backup .task
   ```
3. Restart with v1 code

## Best Practices

### 1. Use Hierarchy for Organization

```
Epic: Q1 Goals
  ├─ User Story: Feature A
  │   ├─ Task: Implement backend
  │   │   └─ SubTask: Add database schema
  │   └─ Task: Implement frontend
  └─ User Story: Feature B
      └─ Task: Research options
```

### 2. Use Links for Dependencies

```typescript
// Task 5 blocks Task 6
await linkTasks(5, 6, 'blocks', 'API must be ready first');

// Task 7 relates to Task 8
await linkTasks(7, 8, 'relates_to', 'Similar implementation');
```

### 3. Bugs Can Float

Bugs don't need to follow strict hierarchy:
```typescript
// Bug at Epic level
await createTask({
  type: 'bug',
  parentId: epicId, // Optional
  title: 'Performance issue in dashboard',
});

// Standalone bug
await createTask({
  type: 'bug',
  title: 'Login page crash',
  // No parentId needed
});
```

## Troubleshooting

### "SubTask requires parent" Error

SubTasks must have a parent Task:
```typescript
// ❌ Wrong
await createTask({ type: 'sub_task', title: 'Do something' });

// ✅ Correct
await createTask({
  type: 'sub_task',
  title: 'Do something',
  parentId: taskId
});
```

### "Invalid parent type" Error

Check hierarchy rules:
```typescript
// ❌ Wrong - Task cannot be parent of Epic
await createTask({
  type: 'epic',
  parentId: taskId // taskId is type 'task'
});

// ✅ Correct - Epic can be parent of User Story
await createTask({
  type: 'user_story',
  parentId: epicId // epicId is type 'epic'
});
```

### Migration Script Fails

1. Check that `.task/` directory exists
2. Ensure task files are valid JSON
3. Check file permissions
4. Review error messages for specific issues

## Support

For issues or questions:
1. Check this migration guide
2. Review the plan file: `.cursor/plans/work_item_hierarchy_refactoring_*.plan.md`
3. Check ADR: `docs/adr/001-initial-architecture.md`

## Version History

- **v2.0.0** - Hierarchical work items and linked items system
- **v1.0.0** - Initial release with inline dependencies

