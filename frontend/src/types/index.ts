/**
 * 全局 TypeScript 类型定义
 *
 * 与后端 Prisma schema 保持一致，用于前后端接口对接和组件 props 类型约束
 *
 * 关键类型：
 * - User/Post/Category/Tag/Comment —— 与数据库模型一一对应
 * - AuthResponse —— 登录/注册接口返回的双 Token + 用户信息
 * - Pagination —— 分页数据的标准格式 { page, pageSize, total, totalPages }
 * - LoginInput/RegisterInput —— 表单收集的数据结构
 */

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImage?: string;
  excerpt?: string;
  published: boolean;
  views: number;
  likes: number;
  authorId: string;
  author?: User;
  categoryId?: string;
  category?: Category;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
// 登录输入接口
export interface LoginInput {
  email: string;
  password: string;
}

// 注册输入接口
export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}
