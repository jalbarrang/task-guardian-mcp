#!/usr/bin/env bun
/**
 * Migration script for Task Guardian v2
 *
 * This script migrates tasks from v1 schema to v2 schema:
 * - Moves inline dependencies to separate links.json file
 * - Adds parentId field (defaults to undefined)
 * - Creates backup of original files
 *
 * Usage: bun scripts/migrate-v2.ts
 */

import { mkdir, exists } from 'fs/promises';
import { join } from 'path';

const TASK_DIR = '.task';
const BACKUP_DIR = `${TASK_DIR}/backup-v1`;
const LINKS_FILE = `${TASK_DIR}/links.json`;

type V1Dependency = {
  taskId: number;
  type: 'blocks' | 'requires' | 'related-to';
  description?: string;
};

type V1Task = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  dependencies: V1Dependency[];
  createdAt: string;
  updatedAt: string;
  [key: string]: any; // Custom metadata
};

type V2Task = Omit<V1Task, 'dependencies'> & {
  parentId?: number;
  dependencies?: V1Dependency[]; // Optional for backward compatibility
};

type Link = {
  id: number;
  fromTaskId: number;
  toTaskId: number;
  type: string;
  description?: string;
  createdAt: string;
};

type LinksData = {
  lastId: number;
  links: Link[];
};

async function main() {
  console.log('🔄 Task Guardian v2 Migration Script\n');

  // Check if .task directory exists
  if (!await exists(TASK_DIR)) {
    console.error('❌ Error: .task directory not found');
    console.error('   Please run this script from your project root');
    process.exit(1);
  }

  // Create backup directory
  console.log('📦 Creating backup directory...');
  if (!await exists(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }

  // Read all task files
  console.log('📖 Reading existing tasks...');
  const glob = new Bun.Glob('task-*.json');
  const taskFiles = Array.from(glob.scanSync({ cwd: TASK_DIR }));

  if (taskFiles.length === 0) {
    console.log('✅ No tasks found - nothing to migrate');
    return;
  }

  console.log(`   Found ${taskFiles.length} task(s)\n`);

  const tasks: V1Task[] = [];
  const links: Link[] = [];
  let linkId = 0;

  // Process each task
  for (const filename of taskFiles) {
    const taskPath = join(TASK_DIR, filename);
    const file = Bun.file(taskPath);

    try {
      const taskData: V1Task = await file.json();
      tasks.push(taskData);

      // Convert dependencies to links
      if (taskData.dependencies && taskData.dependencies.length > 0) {
        for (const dep of taskData.dependencies) {
          linkId++;

          // Map old dependency types to new link types
          let linkType = 'relates_to';
          if (dep.type === 'blocks') {
            linkType = 'blocks';
          } else if (dep.type === 'requires') {
            linkType = 'blocks'; // Map requires to blocks
          } else if (dep.type === 'related-to') {
            linkType = 'relates_to';
          }

          links.push({
            id: linkId,
            fromTaskId: taskData.id,
            toTaskId: dep.taskId,
            type: linkType,
            ...(dep.description && { description: dep.description }),
            createdAt: taskData.updatedAt || new Date().toISOString(),
          });
        }
      }

      // Backup original file
      const backupPath = join(BACKUP_DIR, filename);
      await Bun.write(backupPath, JSON.stringify(taskData, null, 2));

    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error);
    }
  }

  console.log('💾 Backing up original files...');
  console.log(`   Backup created at: ${BACKUP_DIR}\n`);

  // Create links.json
  console.log('🔗 Creating links.json...');
  const linksData: LinksData = {
    lastId: linkId,
    links,
  };
  await Bun.write(LINKS_FILE, JSON.stringify(linksData, null, 2));
  console.log(`   Created ${links.length} link(s)\n`);

  // Update task files (add parentId field, REMOVE dependencies - full v2 refactor)
  console.log('✏️  Updating task files (removing dependencies field)...');
  for (const task of tasks) {
    const v2Task: any = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      type: task.type,
      // Add parentId (omit if undefined so JSON is clean)
      ...((task as any).parentId !== undefined && { parentId: (task as any).parentId }),
      // NOTE: dependencies field is NOT included - moved to links.json
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      // Preserve any custom metadata
      ...Object.fromEntries(
        Object.entries(task).filter(([key]) =>
          !['id', 'title', 'description', 'status', 'priority', 'type', 'dependencies', 'createdAt', 'updatedAt', 'parentId'].includes(key)
        )
      ),
    };

    const taskPath = join(TASK_DIR, `task-${task.id}.json`);
    await Bun.write(taskPath, JSON.stringify(v2Task, null, 2));
  }
  console.log(`   Updated ${tasks.length} task file(s) - removed dependencies field\n`);

  console.log('✅ Migration complete!\n');
  console.log('Summary:');
  console.log(`  - Migrated ${tasks.length} task(s)`);
  console.log(`  - Created ${links.length} link(s)`);
  console.log(`  - Backup saved to ${BACKUP_DIR}`);
  console.log('\nNext steps:');
  console.log('  1. Test your tasks with the new CLI: bun run cli');
  console.log('  2. If everything works, you can safely delete the backup directory');
  console.log('  3. Start using the new link_tasks MCP tool instead of add_dependency');
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

