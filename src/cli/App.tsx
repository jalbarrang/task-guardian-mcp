import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Spinner } from '@inkjs/ui';
import { listTasks } from '../services/task.service.js';
import type { Task } from '../schemas/task.schema.js';
import { TaskList } from './TaskList.js';
import { TaskDetail } from './TaskDetail.js';

interface AppProps {
  filters?: {
    status?: string;
    priority?: string;
    type?: string;
  };
}

export function App({ filters }: AppProps) {
  const { exit } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Load tasks on mount
  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      setError(null);

      const result = await listTasks(filters);

      if (result.success) {
        // Sort tasks by ID
        const sortedTasks = result.data.sort((a, b) => a.id - b.id);

        setTasks(sortedTasks);
      } else {
        setError(`Error loading tasks: ${result.error.code}`);
      }

      setLoading(false);
    }

    loadTasks();
  }, []);

  // Handle keyboard input
  useInput((input, key) => {
    // Always allow quit
    if (input === 'q' || (input === 'c' && key.ctrl)) {
      exit();
      return;
    }

    // In list view
    if (viewMode === 'list' && tasks.length > 0) {
      if (key.upArrow || input === 'k') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : tasks.length - 1));
      } else if (key.downArrow || input === 'j') {
        setSelectedIndex((prev) => (prev < tasks.length - 1 ? prev + 1 : 0));
      } else if (key.return) {
        setViewMode('detail');
      }
    }

    // In detail view - just handle back navigation
    // Terminal will handle native scrolling with mouse/trackpad
    if (viewMode === 'detail') {
      if (key.escape || input === 'b') {
        setViewMode('list');
      }
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner label="Loading tasks..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">Error: {error}</Text>
        <Text dimColor>Press 'q' to quit</Text>
      </Box>
    );
  }

  // Detail view
  if (viewMode === 'detail' && tasks.length > 0) {
    const selectedTask = tasks[selectedIndex];

    // Safety check - shouldn't happen but TypeScript wants it
    if (!selectedTask) {
      setViewMode('list');
      return null;
    }

    return (
      <Box flexDirection="column" padding={1}>
        <TaskDetail task={selectedTask} allTasks={tasks} />
        <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
          <Text dimColor>Esc/b: Back | q: Quit | Scroll with mouse/trackpad or terminal scroll</Text>
        </Box>
      </Box>
    );
  }

  // List view
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Task Guardian - {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </Text>
      </Box>

      {tasks.length === 0 ? (
        <Box flexDirection="column">
          <Text dimColor>No tasks found.</Text>
          {filters && Object.keys(filters).length > 0 && (
            <Text dimColor>Try removing filters to see all tasks.</Text>
          )}
        </Box>
      ) : (
        <TaskList tasks={tasks} selectedIndex={selectedIndex} />
      )}

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          {tasks.length > 0
            ? '↑↓/j/k: Navigate | Enter: View details | q: Quit'
            : 'q: Quit'}
        </Text>
      </Box>
    </Box>
  );
}

