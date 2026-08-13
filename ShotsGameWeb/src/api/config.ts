// API 基础配置
// 开发环境通过 Vite 代理（vite.config.ts 中 /api → http://localhost:5253）
// 生产环境通过 VITE_API_BASE_URL 环境变量配置
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ?? '';

export const API_PREFIX = '/api';

// 拼接完整 API 地址
export function buildUrl(path: string): string {
  // path 形如 '/auth/login'，最终请求 '/api/auth/login'
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${API_PREFIX}${normalized}`;
}
