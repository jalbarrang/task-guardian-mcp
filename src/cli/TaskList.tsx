import React from 'react';
import { Box, Text } from 'ink';
import type { Task } from '../schemas/task.schema.js';

interface TaskListProps {
  tasks: Task[];
  selectedIndex?: number;
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

      {/* Task rows */}
      {tasks.map((task, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box key={task.id}>
            <Text color={isSelected ? 'cyan' : 'gray'}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Box width={4} marginRight={1}>
              <Text bold={isSelected}>{task.id}</Text>
            </Box>
            <Box width={40} marginRight={1}>
              <Text bold={isSelected}>{truncate(task.title, 38)}</Text>
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
}

