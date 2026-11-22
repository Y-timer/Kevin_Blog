import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

export const apiBaseUrl =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

interface AuthRequest extends InternalAxiosRequestConfig {
  sentRefreshToken?: string | null;
  retried?: boolean;
}

const authEndpoints = new Set(['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']);
let pendingRefresh: { token: string; promise: Promise<void> } | undefined;
let lastRotation: { previous: string; current: string } | undefined;

function refreshSession(token: string) {
  if (pendingRefresh?.token === token) return pendingRefresh.promise;

  const promise = axios
    .post<{ data: { accessToken: string; refreshToken: string } }>(
      `${apiBaseUrl}/auth/refresh`, { refreshToken: token }, { timeout: 10000 },
    )
    .then(({ data: { data: tokens } }) => {
      if (localStorage.getItem('refreshToken') !== token) return;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      lastRotation = { previous: token, current: tokens.refreshToken };
    })
    .catch((error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401 &&
          localStorage.getItem('refreshToken') === token) {
        useAuthStore.getState().logout();
      }
      throw error;
    })
    .finally(() => {
      if (pendingRefresh?.promise === promise) pendingRefresh = undefined;
    });
  pendingRefresh = { token, promise };
  return promise;
}

api.interceptors.request.use((config: AuthRequest) => {
  if (authEndpoints.has(config.url ?? '')) return config;
  config.sentRefreshToken = localStorage.getItem('refreshToken');
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original: AuthRequest | undefined = error.config;
    if (error.response?.status !== 401 || !original || original.retried || !original.sentRefreshToken) {
      throw error;
    }

    const sent = original.sentRefreshToken;
    if (localStorage.getItem('refreshToken') === sent) await refreshSession(sent);
    // 退出或切换账号后，旧请求不能用新会话重试。
    if (lastRotation?.previous !== sent || lastRotation.current !== localStorage.getItem('refreshToken')) {
      throw error;
    }
    original.retried = true;
    return api(original);
  },
);

export default api;
