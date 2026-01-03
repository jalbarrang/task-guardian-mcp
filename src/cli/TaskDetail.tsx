import React from 'react';
import { Box, Text } from 'ink';
import type { Task } from '../schemas/task.schema.js';

interface TaskDetailProps {
  task: Task;
  allTasks: Task[];
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

// Format status for display
function formatStatus(status: string): string {
  return status.replace('_', ' ').toUpperCase();
}

// Format type for display
function formatType(type: string): string {
  return type.replace('_', ' ');
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

export function TaskDetail({ task, allTasks }: TaskDetailProps) {
  // Find parent task
  const parentTask = task.parentId ? allTasks.find(t => t.id === task.parentId) : undefined;

  // Find child tasks
  const childTasks = allTasks.filter(t => t.parentId === task.id);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Task #{task.id}
        </Text>
      </Box>

      {/* Title */}
      <Box marginBottom={1}>
        <Text bold>{task.title}</Text>
      </Box>

      {/* Metadata */}
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Box width={15}>
            <Text dimColor>Status:</Text>
          </Box>
          <Text color={getStatusColor(task.status)}>
            {formatStatus(task.status)}
          </Text>
        </Box>
        <Box>
          <Box width={15}>
            <Text dimColor>Priority:</Text>
          </Box>
          <Text color={getPriorityColor(task.priority)}>
            {task.priority}
          </Text>
        </Box>
        <Box>
          <Box width={15}>
            <Text dimColor>Type:</Text>
          </Box>
          <Text>{formatType(task.type)}</Text>
        </Box>
        {parentTask && (
          <Box>
            <Box width={15}>
              <Text dimColor>Parent:</Text>
            </Box>
            <Text color="cyan">#{parentTask.id} {parentTask.title}</Text>
          </Box>
        )}
      </Box>

      {/* Description */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Description:</Text>
        <Box paddingLeft={2} paddingTop={1}>
          <Text>{task.description || '(No description)'}</Text>
        </Box>
      </Box>

      {/* Child tasks in hierarchy */}
      {childTasks.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold>Child Tasks:</Text>
          <Box flexDirection="column" paddingLeft={2} paddingTop={1}>
            {childTasks.map((child) => (
              <Box key={child.id} marginBottom={1}>
                <Text color="cyan">• Task #{child.id}</Text>
                <Text> - {child.title}</Text>
                <Text> </Text>
                <Text color={getStatusColor(child.status)}>
                  ({formatStatus(child.status)})
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Note: Linked items are stored in .task/links.json */}
      {/* Use the get_links MCP tool or API to view task links */}

      {/* Timestamps */}
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Box width={15}>
            <Text dimColor>Created:</Text>
          </Box>
          <Text dimColor>{formatDate(task.createdAt)}</Text>
        </Box>
        <Box>
          <Box width={15}>
            <Text dimColor>Updated:</Text>
          </Box>
          <Text dimColor>{formatDate(task.updatedAt)}</Text>
        </Box>
      </Box>

      {/* Custom metadata */}
      {Object.keys(task).some(
        (key) =>
          ![
            'id',
            'title',
            'description',
            'status',
            'priority',
            'type',
            'parentId',
            'dependencies',
            'createdAt',
            'updatedAt',
          ].includes(key)
      ) && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Custom Metadata:</Text>
          <Box flexDirection="column" paddingLeft={2} paddingTop={1}>
            {Object.entries(task)
              .filter(
                ([key]) =>
                  ![
                    'id',
                    'title',
                    'description',
                    'status',
                    'priority',
                    'type',
                    'parentId',
                    'dependencies',
                    'createdAt',
                    'updatedAt',
                  ].includes(key)
              )
              .map(([key, value]) => (
                <Box key={key}>
                  <Text dimColor>{key}: </Text>
                  <Text>{JSON.stringify(value)}</Text>
                </Box>
              ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

