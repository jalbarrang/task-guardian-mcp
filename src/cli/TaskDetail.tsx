import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { Task } from '../schemas/task.schema.js';
import type { Link } from '../schemas/task.schema.js';
import { getLinks } from '../services/link.service.js';

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

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Format link type for display based on direction
function formatLinkType(linkType: string, isIncoming: boolean): string {
  if (isIncoming) {
    // Link coming TO this task
    switch (linkType) {
      case 'blocks':
        return 'Blocked by';
      case 'is_blocked_by':
        return 'Blocks';
      case 'relates_to':
        return 'Related to';
      case 'duplicates':
        return 'Duplicated by';
      case 'is_duplicated_by':
        return 'Duplicates';
      default:
        return linkType;
    }
  } else {
    // Link going FROM this task
    switch (linkType) {
      case 'blocks':
        return 'Blocks';
      case 'is_blocked_by':
        return 'Blocked by';
      case 'relates_to':
        return 'Related to';
      case 'duplicates':
        return 'Duplicates';
      case 'is_duplicated_by':
        return 'Duplicated by';
      default:
        return linkType;
    }
  }
}

export function TaskDetail({ task, allTasks }: TaskDetailProps) {
  // Find parent task
  const parentTask = task.parentId ? allTasks.find(t => t.id === task.parentId) : undefined;

  // Find child tasks
  const childTasks = allTasks.filter(t => t.parentId === task.id);

  // Load linked items
  const [linksFrom, setLinksFrom] = useState<Link[]>([]);
  const [linksTo, setLinksTo] = useState<Link[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);

  useEffect(() => {
    async function loadLinks() {
      setLinksLoading(true);
      const result = await getLinks(task.id);
      if (result.success) {
        setLinksFrom(result.data.from);
        setLinksTo(result.data.to);
      }
      setLinksLoading(false);
    }
    loadLinks();
  }, [task.id]);

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
            {formatPriority(task.priority)}
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

      {/* Linked Items (from .task/links.json) */}
      {!linksLoading && (linksFrom.length > 0 || linksTo.length > 0) && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold>Linked Items:</Text>

          {/* Outgoing links */}
          {linksFrom.length > 0 && (
            <Box flexDirection="column" paddingLeft={2} paddingTop={1}>
              <Text dimColor>Links from this task:</Text>
              {linksFrom.map((link) => {
                const linkedTask = allTasks.find(t => t.id === link.toTaskId);
                const label = formatLinkType(link.type, false);
                return (
                  <Box key={link.id} flexDirection="column" marginBottom={1} paddingLeft={2}>
                    <Box>
                      <Text color="magenta">{label}</Text>
                      <Text> </Text>
                      <Text color="cyan">Task #{link.toTaskId}</Text>
                    </Box>
                    {linkedTask && (
                      <Box paddingLeft={2}>
                        <Text>{linkedTask.title}</Text>
                        <Text> - </Text>
                        <Text color={getStatusColor(linkedTask.status)}>
                          {formatStatus(linkedTask.status)}
                        </Text>
                      </Box>
                    )}
                    {link.description && (
                      <Box paddingLeft={2}>
                        <Text dimColor>Note: {link.description}</Text>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Incoming links */}
          {linksTo.length > 0 && (
            <Box flexDirection="column" paddingLeft={2} paddingTop={1}>
              <Text dimColor>Links to this task:</Text>
              {linksTo.map((link) => {
                const linkedTask = allTasks.find(t => t.id === link.fromTaskId);
                const label = formatLinkType(link.type, true);
                return (
                  <Box key={link.id} flexDirection="column" marginBottom={1} paddingLeft={2}>
                    <Box>
                      <Text color="yellow">{label}</Text>
                      <Text> </Text>
                      <Text color="cyan">Task #{link.fromTaskId}</Text>
                    </Box>
                    {linkedTask && (
                      <Box paddingLeft={2}>
                        <Text>{linkedTask.title}</Text>
                        <Text> - </Text>
                        <Text color={getStatusColor(linkedTask.status)}>
                          {formatStatus(linkedTask.status)}
                        </Text>
                      </Box>
                    )}
                    {link.description && (
                      <Box paddingLeft={2}>
                        <Text dimColor>Note: {link.description}</Text>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
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

