import { z } from 'zod';

// Use z.enum with the values from our constants
export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled']);
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const TaskTypeSchema = z.enum(['epic', 'user_story', 'task', 'sub_task', 'bug']);
export const LinkTypeSchema = z.enum(['blocks', 'is_blocked_by', 'relates_to', 'duplicates', 'is_duplicated_by']);

// Legacy - kept for migration compatibility
export const DependencyTypeSchema = z.enum(['blocks', 'requires', 'related-to']);

export const DependencySchema = z.object({
  taskId: z.number().int().positive(),
  type: DependencyTypeSchema,
  description: z.string().optional(),
});

// New Link Schema for separate linked items system
export const LinkSchema = z.object({
  id: z.number().int().positive(),
  fromTaskId: z.number().int().positive(),
  toTaskId: z.number().int().positive(),
  type: LinkTypeSchema,
  description: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const TaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string(),
  status: TaskStatusSchema.default('pending'),
  priority: TaskPrioritySchema.default('medium'),
  type: TaskTypeSchema.default('task'),
  parentId: z.number().int().positive().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).passthrough(); // Allow custom metadata fields (permissive per ADR)

// Infer types from schemas
export type Dependency = z.infer<typeof DependencySchema>;
export type Link = z.infer<typeof LinkSchema>;
export type Task = z.infer<typeof TaskSchema>;

// Input schemas for create/update (omit auto-generated fields)
export const CreateTaskInputSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({ status: true, priority: true, type: true, parentId: true });

export const UpdateTaskInputSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;

