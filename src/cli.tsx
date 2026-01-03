#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { App } from './cli/App.js';
import { initTaskDirectory } from './services/task.service.js';

// Parse command-line arguments
const args = process.argv.slice(2);
const filters: { status?: string; priority?: string; type?: string } = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--status' && i + 1 < args.length) {
    filters.status = args[++i];
  } else if (arg === '--priority' && i + 1 < args.length) {
    filters.priority = args[++i];
  } else if (arg === '--type' && i + 1 < args.length) {
    filters.type = args[++i];
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Task Guardian CLI - View tasks in your project

Usage: task-guardian-cli [options]

Options:
  --status <status>       Filter by status (pending|in_progress|completed|blocked|cancelled)
  --priority <priority>   Filter by priority (low|medium|high|critical)
  --type <type>          Filter by type (user_story|task|bug)
  --help, -h             Show this help message

Examples:
  task-guardian-cli                          # List all tasks
  task-guardian-cli --status in_progress     # List in-progress tasks
  task-guardian-cli --priority high          # List high priority tasks
`);
    process.exit(0);
  }
}

async function main() {
  // Initialize task directory
  const initResult = await initTaskDirectory();
  if (!initResult.success) {
    console.error('Failed to initialize task directory:', initResult.error);
    process.exit(1);
  }

  // Render the App
  render(<App filters={filters} />);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

