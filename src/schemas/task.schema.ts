import { z } from 'zod';

// Use z.enum with the values from our constants
export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'blocked', 'cancelled']);
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const TaskTypeSchema = z.enum(['user_story', 'task', 'bug']);
export const DependencyTypeSchema = z.enum(['blocks', 'requires', 'related-to']);

export const DependencySchema = z.object({
  taskId: z.number().int().positive(),
  type: DependencyTypeSchema,
  description: z.string().optional(),
});

export const TaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string(),
  status: TaskStatusSchema.default('pending'),
  priority: TaskPrioritySchema.default('medium'),
  type: TaskTypeSchema.default('task'),
  dependencies: z.array(DependencySchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).passthrough(); // Allow custom metadata fields (permissive per ADR)

// Infer types from schemas
export type Dependency = z.infer<typeof DependencySchema>;
export type Task = z.infer<typeof TaskSchema>;

// Input schemas for create/update (omit auto-generated fields)
export const CreateTaskInputSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({ status: true, priority: true, type: true, dependencies: true });

export const UpdateTaskInputSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;

