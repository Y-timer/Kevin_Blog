import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(2).max(20),
  email: z.string().email(),
  password: z.string().min(8).refine((value) => Buffer.byteLength(value) <= 72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const positiveInteger = (max: number) =>
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(max));

export const paginationQuery = z.object({
  page: positiveInteger(1_000_000).optional(),
  pageSize: positiveInteger(100).optional(),
});

export const postListQuery = paginationQuery.extend({
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
  published: z.enum(['true', 'false']).optional(),
});

export const profileSchema = z.object({
  username: z.string().trim().min(2).max(20).optional(),
  bio: z.string().max(1000).optional(),
  avatar: z.string().max(2048).optional(),
}).strict();

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).refine((value) => Buffer.byteLength(value) <= 72),
});

export const postSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().min(1).refine((value) => value.trim().length > 0),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  published: z.boolean().optional().default(true),
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});

export const postUpdateSchema = postSchema.partial().extend({
  categoryId: z.string().uuid().nullable().optional(),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(50),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(50),
});
