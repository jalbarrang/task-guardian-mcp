import { z } from 'zod';
import { TaskStatusSchema, TaskPrioritySchema, TaskTypeSchema, DependencyTypeSchema, DependencySchema, TaskSchema, LinkTypeSchema, LinkSchema } from './task.schema.js';

// Tool input schemas for MCP tool registration

export const CreateTaskToolSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  type: TaskTypeSchema.optional(),
  parentId: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const GetTaskToolSchema = z.object({
  taskId: z.number().int().positive(),
});

export const UpdateTaskToolSchema = z.object({
  taskId: z.number().int().positive(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  type: TaskTypeSchema.optional(),
  parentId: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const DeleteTaskToolSchema = z.object({
  taskId: z.number().int().positive(),
  force: z.boolean().optional(),
});

export const ListTasksToolSchema = z.object({
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  type: TaskTypeSchema.optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const QueryTasksToolSchema = z.object({
  filters: z.object({
    status: z.array(TaskStatusSchema).optional(),
    priority: z.array(TaskPrioritySchema).optional(),
    type: z.array(TaskTypeSchema).optional(),
    hasDependencies: z.boolean().optional(),
    titleContains: z.string().optional(),
    descriptionContains: z.string().optional(),
  }).optional(),
  sort: z.object({
    field: z.enum(['createdAt', 'updatedAt', 'priority', 'title']),
    order: z.enum(['asc', 'desc']),
  }).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const AddDependencyToolSchema = z.object({
  fromTaskId: z.number().int().positive(),
  toTaskId: z.number().int().positive(),
  type: DependencyTypeSchema,
  description: z.string().optional(),
});

export const RemoveDependencyToolSchema = z.object({
  fromTaskId: z.number().int().positive(),
  toTaskId: z.number().int().positive(),
});

export const CreateTasksToolSchema = z.object({
  tasks: z.array(CreateTaskToolSchema).min(1),
});

export const UpdateTasksToolSchema = z.object({
  updates: z.array(
    z.object({
      taskId: z.number().int().positive(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      status: TaskStatusSchema.optional(),
      priority: TaskPrioritySchema.optional(),
      type: TaskTypeSchema.optional(),
      parentId: z.number().int().positive().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
  ).min(1),
});

// New Link Tool Schemas
export const LinkTasksToolSchema = z.object({
  fromTaskId: z.number().int().positive(),
  toTaskId: z.number().int().positive(),
  type: LinkTypeSchema,
  description: z.string().optional(),
});

export const UnlinkTasksToolSchema = z.object({
  linkId: z.number().int().positive().optional(),
  fromTaskId: z.number().int().positive().optional(),
  toTaskId: z.number().int().positive().optional(),
}).refine(
  (data) => data.linkId !== undefined || (data.fromTaskId !== undefined && data.toTaskId !== undefined),
  { message: "Either linkId or both fromTaskId and toTaskId must be provided" }
);

export const GetLinksToolSchema = z.object({
  taskId: z.number().int().positive(),
});

// Tool output schemas
export const CreateTaskOutputSchema = TaskSchema;

export const GetTaskOutputSchema = TaskSchema;

export const UpdateTaskOutputSchema = TaskSchema;

export const DeleteTaskOutputSchema = z.object({
  success: z.literal(true),
  taskId: z.number().int().positive(),
});

export const ListTasksOutputSchema = z.object({
  tasks: z.array(TaskSchema),
  count: z.number().int().nonnegative(),
});

export const QueryTasksOutputSchema = z.object({
  tasks: z.array(TaskSchema),
  total: z.number().int().nonnegative(),
});

export const AddDependencyOutputSchema = z.object({
  success: z.literal(true),
  fromTaskId: z.number().int().positive(),
  toTaskId: z.number().int().positive(),
  type: DependencyTypeSchema,
});

export const RemoveDependencyOutputSchema = z.object({
  success: z.literal(true),
  fromTaskId: z.number().int().positive(),
  toTaskId: z.number().int().positive(),
});

export const CreateTasksOutputSchema = z.object({
  success: z.array(TaskSchema),
  failed: z.array(z.object({
    index: z.number().int().nonnegative(),
    error: z.any(), // TaskError type - complex union type, using any for simplicity
  })),
});

export const UpdateTasksOutputSchema = z.object({
  success: z.array(TaskSchema),
  failed: z.array(z.object({
    taskId: z.number().int().positive(),
    error: z.any(), // TaskError type - complex union type, using any for simplicity
  })),
});

// New Link Tool Output Schemas
export const LinkTasksOutputSchema = LinkSchema;

export const UnlinkTasksOutputSchema = z.object({
  success: z.literal(true),
  linkId: z.number().int().positive(),
});

export const GetLinksOutputSchema = z.object({
  from: z.array(LinkSchema),
  to: z.array(LinkSchema),
});

export type CreateTaskToolInput = z.infer<typeof CreateTaskToolSchema>;
export type GetTaskToolInput = z.infer<typeof GetTaskToolSchema>;
export type UpdateTaskToolInput = z.infer<typeof UpdateTaskToolSchema>;
export type DeleteTaskToolInput = z.infer<typeof DeleteTaskToolSchema>;
export type ListTasksToolInput = z.infer<typeof ListTasksToolSchema>;
export type QueryTasksToolInput = z.infer<typeof QueryTasksToolSchema>;
export type AddDependencyToolInput = z.infer<typeof AddDependencyToolSchema>;
export type RemoveDependencyToolInput = z.infer<typeof RemoveDependencyToolSchema>;
export type CreateTasksToolInput = z.infer<typeof CreateTasksToolSchema>;
export type UpdateTasksToolInput = z.infer<typeof UpdateTasksToolSchema>;
export type LinkTasksToolInput = z.infer<typeof LinkTasksToolSchema>;
export type UnlinkTasksToolInput = z.infer<typeof UnlinkTasksToolSchema>;
export type GetLinksToolInput = z.infer<typeof GetLinksToolSchema>;

export type CreateTaskOutput = z.infer<typeof CreateTaskOutputSchema>;
export type GetTaskOutput = z.infer<typeof GetTaskOutputSchema>;
export type UpdateTaskOutput = z.infer<typeof UpdateTaskOutputSchema>;
export type DeleteTaskOutput = z.infer<typeof DeleteTaskOutputSchema>;
export type ListTasksOutput = z.infer<typeof ListTasksOutputSchema>;
export type QueryTasksOutput = z.infer<typeof QueryTasksOutputSchema>;
export type AddDependencyOutput = z.infer<typeof AddDependencyOutputSchema>;
export type RemoveDependencyOutput = z.infer<typeof RemoveDependencyOutputSchema>;
export type CreateTasksOutput = z.infer<typeof CreateTasksOutputSchema>;
export type UpdateTasksOutput = z.infer<typeof UpdateTasksOutputSchema>;
export type LinkTasksOutput = z.infer<typeof LinkTasksOutputSchema>;
export type UnlinkTasksOutput = z.infer<typeof UnlinkTasksOutputSchema>;
export type GetLinksOutput = z.infer<typeof GetLinksOutputSchema>;

