import api from './api';
import type { Post, Pagination, Comment, Category } from '../types';

/**
 * 文章相关 API 调用封装
 *
 * 查询参数说明：
 * - page/pageSize 分页（默认 page=1, pageSize=10）
 * - categoryId/tagId 按分类或标签筛选
 * - search 标题/正文模糊搜索
 */

/** 获取文章列表，支持分页和筛选 */
export async function getPosts(params?: {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  tagId?: string;
  search?: string;
}): Promise<{ data: Post[]; pagination: Pagination }> {
  const res = await api.get('/posts', { params });
  return res.data;
}

/** 按 slug 获取单篇文章（自动增加浏览计数，后端实现） */
export async function getPostBySlug(slug: string): Promise<Post> {
  const res = await api.get(`/posts/${slug}`);
  return res.data.data;
}

/** 创建文章 */
export async function createPost(data: {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  categoryId?: string;
  tagIds?: string[];
}): Promise<Post> {
  const res = await api.post('/posts', data);
  return res.data.data;
}

/** 获取文章评论（分页） */
export async function getComments(postId: string, page = 1): Promise<{ data: Comment[]; pagination: Pagination }> {
  const res = await api.get(`/comments/post/${postId}`, { params: { page } });
  return res.data;
}

/** 发表评论 */
export async function createComment(postId: string, content: string): Promise<Comment> {
  const res = await api.post(`/comments/post/${postId}`, { content });
  return res.data.data;
}

/** 获取分类列表 */
export async function getCategories(): Promise<Category[]> {
  const res = await api.get('/categories');
  return res.data.data;
}
