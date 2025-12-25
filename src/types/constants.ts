export const TaskStatus = {
  Pending: 'pending',
  InProgress: 'in_progress',
  Completed: 'completed',
  Blocked: 'blocked',
  Cancelled: 'cancelled',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'critical',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskType = {
  UserStory: 'user_story',
  Task: 'task',
  Bug: 'bug',
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const DependencyType = {
  Blocks: 'blocks',
  Requires: 'requires',
  RelatedTo: 'related-to',
} as const;
export type DependencyType = (typeof DependencyType)[keyof typeof DependencyType];

