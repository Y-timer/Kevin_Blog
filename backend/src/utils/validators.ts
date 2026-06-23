import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(2).max(20),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const postSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  published: z.boolean().optional().default(true),
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});

export const postUpdateSchema = postSchema.partial();

export const commentSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(50),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(50),
});
