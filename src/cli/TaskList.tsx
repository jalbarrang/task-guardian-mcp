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

  const groups: GroupedTasks[] = [];
  const processedIds = new Set<number>();

  // Helper to build hierarchy recursively
  function buildHierarchy(parent: Task | null, depth: number = 0): GroupedTasks[] {
    const result: GroupedTasks[] = [];
    const children: Task[] = [];

    // Find direct children of this parent
    for (const task of tasks) {
      if (processedIds.has(task.id)) continue;

      const taskParentId = task.parentId;
      const parentId = parent?.id;

      if (taskParentId === parentId) {
        children.push(task);
        processedIds.add(task.id);
      }
    }

    // Sort children by ID
    children.sort((a, b) => a.id - b.id);

    if (parent || children.length > 0) {
      result.push({ parent, children: [] });

      // Add children and recursively process their children
      for (const child of children) {
        result[0].children.push(child);

        // If this child can have children (epic, user_story, task), recurse
        if (['epic', 'user_story', 'task'].includes(child.type)) {
          const subGroups = buildHierarchy(child, depth + 1);
          result.push(...subGroups);
        }
      }
    }

    return result;
  }

  // Start with top-level items (no parent)
  const topLevelGroups = buildHierarchy(null, 0);
  groups.push(...topLevelGroups);

  // Add any remaining ungrouped tasks
  const ungrouped = tasks.filter(task => !processedIds.has(task.id));
  if (ungrouped.length > 0) {
    groups.push({ parent: null, children: ungrouped });
  }

  return groups;
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
  return status.replace('_', ' ').toUpperCase();
}

// Format type for display
function formatType(type: string): string {
  return type.replace('_', ' ');
}

// Truncate text with ellipsis
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function TaskList({ tasks, selectedIndex = -1 }: TaskListProps) {
  const groups = groupTasksByParent(tasks);

  // Build flat list for index mapping
  const flatTasks: Task[] = [];
  groups.forEach(group => {
    if (group.parent) {
      flatTasks.push(group.parent);
    }
    group.children.forEach(child => {
      flatTasks.push(child);
    });
  });

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

      {/* Grouped task rows */}
      {groups.map((group, groupIndex) => {
        const isUngrouped = group.parent === null && groupIndex === groups.length - 1 && group.children.length > 0;

        return (
          <Box key={groupIndex} flexDirection="column">
            {/* Ungrouped header */}
            {isUngrouped && (
              <Box marginTop={1} marginBottom={1}>
                <Text bold dimColor>Ungrouped</Text>
              </Box>
            )}

            {/* Parent task (if exists) */}
            {group.parent && (() => {
              const taskIndex = flatTasks.indexOf(group.parent!);
              const isSelected = taskIndex === selectedIndex;
              const indentLevel = getIndentLevel(group.parent!);
              const indent = '  '.repeat(indentLevel);

              return (
                <Box key={group.parent.id}>
                  <Text color={isSelected ? 'cyan' : 'gray'}>
                    {isSelected ? '▶ ' : '  '}
                  </Text>
                  <Box width={4} marginRight={1}>
                    <Text bold={isSelected}>{group.parent.id}</Text>
                  </Box>
                  <Box width={40} marginRight={1}>
                    <Text bold={isSelected}>
                      {indent}{truncate(group.parent.title, 38 - indent.length)}
                    </Text>
                  </Box>
                  <Box width={15} marginRight={1}>
                    <Text color={getStatusColor(group.parent.status)} bold={isSelected}>
                      {formatStatus(group.parent.status)}
                    </Text>
                  </Box>
                  <Box width={12} marginRight={1}>
                    <Text color={getPriorityColor(group.parent.priority)} bold={isSelected}>
                      {group.parent.priority}
                    </Text>
                  </Box>
                  <Box width={12}>
                    <Text color={getTypeColor(group.parent.type)} bold={isSelected}>
                      {formatType(group.parent.type)}
                    </Text>
                  </Box>
                </Box>
              );
            })()}

            {/* Child tasks */}
            {group.children.map((task) => {
              const taskIndex = flatTasks.indexOf(task);
              const isSelected = taskIndex === selectedIndex;
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
                      {task.priority}
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
      })}
    </Box>
  );
}

