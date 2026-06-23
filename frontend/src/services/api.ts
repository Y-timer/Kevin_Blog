import axios from 'axios';

/**
 * Axios 实例 —— 全局 API 请求配置
 *
 * 关键机制：
 * 1. 请求拦截器：自动附加 Authorization Bearer token
 * 2. 响应拦截器：检测 401 → 自动用 refreshToken 换取新 accessToken → 重试原请求
 *    如果刷新也失败，清除 token 并跳转登录页
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器——每次请求自动带上 JWT accessToken
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器——处理 401 未授权错误
// _retry 标记防止无限循环：如果刷新 token 的请求也返回 401，不再重试
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh`,
          { refreshToken },
        );
        // 后端返回 { data: { accessToken, refreshToken } }，所以取 data.data
        const tokens = data.data || data;
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken); // 同时更新 refreshToken，防止滚动刷新后旧值失效
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(original);
      } catch {
        // 刷新也失败，清除所有 token 并跳转登录页
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
