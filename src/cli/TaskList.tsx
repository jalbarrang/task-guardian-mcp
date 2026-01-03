import React from 'react';
import { Box, Text } from 'ink';
import type { Task } from '../schemas/task.schema.js';

interface TaskListProps {
  tasks: Task[];
  selectedIndex?: number;
}

interface GroupedTasks {
  parent: Task | null;
  children: Task[];
}

// Group tasks by their parent hierarchy
function groupTasksByParent(tasks: Task[]): GroupedTasks[] {
  // Check if any tasks have parentId - if not, return flat list
  const hasHierarchy = tasks.some(task => task.parentId !== undefined);

  if (!hasHierarchy) {
    // No hierarchy - return single group with all tasks
    return [{ parent: null, children: tasks }];
  }

  const taskMap = new Map<number, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));

  const processedIds = new Set<number>();
  const result: Task[] = []; // Flat list in hierarchical order

  // Recursive function to add task and its children
  function addTaskAndChildren(task: Task) {
    if (processedIds.has(task.id)) return;

    processedIds.add(task.id);
    result.push(task);

    // Find and add children
    const children = tasks
      .filter(t => t.parentId === task.id)
      .sort((a, b) => a.id - b.id);

    for (const child of children) {
      addTaskAndChildren(child);
    }
  }

  // Start with top-level tasks (no parentId)
  const topLevel = tasks
    .filter(task => !task.parentId)
    .sort((a, b) => a.id - b.id);

  for (const task of topLevel) {
    addTaskAndChildren(task);
  }

  // Add any orphaned tasks at the end
  const orphaned = tasks.filter(task => !processedIds.has(task.id));

  if (orphaned.length > 0) {
    result.push(...orphaned);
  }

  // Return as single flat group for simple rendering
  return [{ parent: null, children: result }];
}

// Color mapping for status
function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'green';
    case 'in_progress':
      return 'yellow';
    case 'blocked':
      return 'red';
    case 'cancelled':
      return 'gray';
    case 'pending':
    default:
      return 'blue';
  }
}

// Color mapping for priority
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'red';
    case 'high':
      return 'yellow';
    case 'medium':
      return 'cyan';
    case 'low':
    default:
      return 'gray';
  }
}

// Color mapping for type
function getTypeColor(type: string): string {
  switch (type) {
    case 'bug':
      return 'red';
    case 'user_story':
      return 'magenta';
    case 'task':
    default:
      return 'white';
  }
}

// Format status for display
function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Format priority for display
function formatPriority(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
}

// Format type for display
function formatType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Truncate text with ellipsis
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function TaskList({ tasks, selectedIndex = -1 }: TaskListProps) {
  const groups = groupTasksByParent(tasks);
  const orderedTasks = groups[0]?.children || tasks; // Get the flat ordered list

  // Helper to get indent level for a task
  function getIndentLevel(task: Task): number {
    let level = 0;
    let current = task;
    while (current.parentId) {
      level++;
      const parent = tasks.find(t => t.id === current.parentId);
      if (!parent) break;
      current = parent;
    }
    return level;
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        <Box width={6} marginRight={1}>
          <Text bold>ID</Text>
        </Box>
        <Box width={40} marginRight={1}>
          <Text bold>Title</Text>
        </Box>
        <Box width={15} marginRight={1}>
          <Text bold>Status</Text>
        </Box>
        <Box width={12} marginRight={1}>
          <Text bold>Priority</Text>
        </Box>
        <Box width={12}>
          <Text bold>Type</Text>
        </Box>
      </Box>

      {/* Divider */}
      <Box marginBottom={1}>
        <Text dimColor>{'─'.repeat(92)}</Text>
      </Box>

      {/* Task rows with hierarchy */}
      {orderedTasks.map((task, index) => {
        const isSelected = index === selectedIndex;
        const indentLevel = getIndentLevel(task);
        const indent = '  '.repeat(indentLevel);

        return (
          <Box key={task.id}>
            <Text color={isSelected ? 'cyan' : 'gray'}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Box width={4} marginRight={1}>
              <Text bold={isSelected}>{task.id}</Text>
            </Box>
            <Box width={40} marginRight={1}>
              <Text bold={isSelected}>
                {indent}{truncate(task.title, 38 - indent.length)}
              </Text>
            </Box>
            <Box width={15} marginRight={1}>
              <Text color={getStatusColor(task.status)} bold={isSelected}>
                {formatStatus(task.status)}
              </Text>
            </Box>
            <Box width={12} marginRight={1}>
              <Text color={getPriorityColor(task.priority)} bold={isSelected}>
                {formatPriority(task.priority)}
              </Text>
            </Box>
            <Box width={12}>
              <Text color={getTypeColor(task.type)} bold={isSelected}>
                {formatType(task.type)}
              </Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

