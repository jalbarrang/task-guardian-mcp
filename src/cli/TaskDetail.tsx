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
  // task.dependencies contains tasks that THIS task blocks (tasks waiting for this one)
  const blockedTasks = task.dependencies.map(dep => {
    const depTask = allTasks.find(t => t.id === dep.taskId);
    return { dep, task: depTask };
  });

  // Find tasks that block this task (tasks that have this task in THEIR dependencies)
  const blockingTasks = allTasks.filter(t =>
    t.dependencies.some(dep => dep.taskId === task.id)
  );

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
      </Box>

      {/* Description */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Description:</Text>
        <Box paddingLeft={2} paddingTop={1}>
          <Text>{task.description || '(No description)'}</Text>
        </Box>
      </Box>

      {/* Dependencies - Tasks that block this task */}
      {blockingTasks.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold>Dependencies:</Text>
          <Box paddingLeft={2}>
            <Text dimColor>This task needs these to be completed first:</Text>
          </Box>
          <Box flexDirection="column" paddingLeft={2} paddingTop={1}>
            {blockingTasks.map((blockingTask) => {
              const depLink = blockingTask.dependencies.find(d => d.taskId === task.id);
              return (
                <Box key={blockingTask.id} flexDirection="column" marginBottom={1}>
                  <Box>
                    <Text color="cyan">• Task #{blockingTask.id}</Text>
                    {depLink && <Text dimColor> ({depLink.type})</Text>}
                  </Box>
                  <Box paddingLeft={2}>
                    <Text>{blockingTask.title}</Text>
                    <Text> - </Text>
                    <Text color={getStatusColor(blockingTask.status)}>
                      {formatStatus(blockingTask.status)}
                    </Text>
                  </Box>
                  {depLink?.description && (
                    <Box paddingLeft={2}>
                      <Text dimColor>Note: {depLink.description}</Text>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Dependents - Tasks blocked by this task */}
      {task.dependencies.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold>Dependents:</Text>
          <Box paddingLeft={2}>
            <Text dimColor>These tasks are blocked until this one is done:</Text>
          </Box>
          <Box flexDirection="column" paddingLeft={2} paddingTop={1}>
            {blockedTasks.map(({ dep, task: depTask }, index) => (
              <Box key={index} flexDirection="column" marginBottom={1}>
                <Box>
                  <Text color="magenta">• Task #{dep.taskId}</Text>
                  <Text dimColor> ({dep.type})</Text>
                </Box>
                {depTask ? (
                  <Box paddingLeft={2}>
                    <Text>{depTask.title}</Text>
                    <Text> - </Text>
                    <Text color={getStatusColor(depTask.status)}>
                      {formatStatus(depTask.status)}
                    </Text>
                  </Box>
                ) : (
                  <Box paddingLeft={2}>
                    <Text dimColor>(Task not found)</Text>
                  </Box>
                )}
                {dep.description && (
                  <Box paddingLeft={2}>
                    <Text dimColor>Note: {dep.description}</Text>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}

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

