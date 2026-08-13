// HTTP 客户端：基于 fetch 封装，自动注入 JWT、401 自动刷新、统一错误处理
import { buildUrl } from './config';
import { ApiError, ApiResponse, emitUnauthorized, ResultCode } from './types';
import {
  canRefresh,
  clearToken,
  isTokenExpired,
  loadToken,
  saveToken,
  type TokenInfo,
} from './token';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  // 查询参数
  query?: Record<string, unknown>;
  // JSON body
  body?: unknown;
  // 是否需要鉴权（默认 true）
  auth?: boolean;
  // 自定义 header
  headers?: Record<string, string>;
  // 401 时是否自动刷新 token 重试（默认 true）
  autoRetry?: boolean;
  // 是否返回原始 ApiResponse（默认 false，直接返回 data）
  rawResponse?: boolean;
}

// 全局刷新锁：防止并发请求同时刷新
let refreshingPromise: Promise<TokenInfo | null> | null = null;

async function refreshToken(): Promise<TokenInfo | null> {
  if (refreshingPromise) return refreshingPromise;
  const current = loadToken();
  if (!current || !canRefresh(current)) {
    clearToken();
    return null;
  }
  refreshingPromise = (async () => {
    try {
      const resp = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      if (!resp.ok) {
        clearToken();
        return null;
      }
      const json = (await resp.json()) as ApiResponse<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>;
      if (json.code !== ResultCode.Success || !json.data) {
        clearToken();
        return null;
      }
      const next: TokenInfo = {
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
        expiresAt: Date.now() + json.data.expiresIn * 1000,
        autoLogin: current.autoLogin,
      };
      saveToken(next);
      return next;
    } catch {
      clearToken();
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();
  return refreshingPromise;
}

function buildQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    query,
    body,
    auth = true,
    headers = {},
    autoRetry = true,
    rawResponse = false,
  } = options;

  const url = buildUrl(path) + buildQueryString(query ?? {});

  const doRequest = async (token: string | null): Promise<Response> => {
    const finalHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...headers,
    };
    if (body !== undefined && !finalHeaders['Content-Type']) {
      finalHeaders['Content-Type'] = 'application/json';
    }
    if (auth && token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
  };

  let token = auth ? loadToken()?.accessToken ?? null : null;
  let response = await doRequest(token);

  // 401 自动刷新一次重试
  if (response.status === 401 && auth && autoRetry) {
    const refreshed = await refreshToken();
    if (refreshed) {
      token = refreshed.accessToken;
      response = await doRequest(token);
    } else {
      emitUnauthorized();
      throw new ApiError('登录已过期，请重新登录', ResultCode.Unauthorized, 401);
    }
  }

  // 非 2xx HTTP 状态码处理
  if (!response.ok) {
    if (response.status === 401) {
      emitUnauthorized();
      throw new ApiError('未授权', ResultCode.Unauthorized, 401);
    }
    // 尝试解析业务错误
    let errBody: ApiResponse | null = null;
    try {
      errBody = (await response.json()) as ApiResponse;
    } catch {
      /* ignore */
    }
    const msg = errBody?.message ?? `请求失败 (${response.status})`;
    const code = errBody?.code ?? ResultCode.Fail;
    throw new ApiError(msg, code, response.status);
  }

  // 解析响应
  let json: ApiResponse<T>;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch (e) {
    throw new ApiError('响应解析失败', ResultCode.ServerError, response.status);
  }

  if (rawResponse) {
    return json as unknown as T;
  }

  if (json.code !== ResultCode.Success) {
    throw new ApiError(json.message ?? '业务失败', json.code, response.status);
  }

  return json.data as T;
}

// 便捷方法
export const http = {
  get: <T = unknown>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  del: <T = unknown>(path: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

// 主动触发一次 token 刷新（登录后或手动续期时调用）
export function ensureValidToken(): Promise<TokenInfo | null> {
  const current = loadToken();
  if (!current) return Promise.resolve(null);
  if (!isTokenExpired(current)) return Promise.resolve(current);
  return refreshToken();
}

// 标记：当前是否已登录
export function isAuthenticated(): boolean {
  const info = loadToken();
  return !!info && !!info.accessToken;
}
