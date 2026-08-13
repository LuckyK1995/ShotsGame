// 统一 API 响应类型
// 后端 ApiResponse<T> 结构：{ code, data, message, traceId }
// code = 0 成功，其他为失败；HTTP 401 表示未授权

export enum ResultCode {
  Success = 0,
  Fail = 1,
  InvalidParam = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  ServerError = 500,
}

export interface ApiResponse<T = unknown> {
  code: ResultCode;
  data: T | null;
  message: string | null;
  traceId?: string | null;
}

// 业务错误异常
export class ApiError extends Error {
  code: ResultCode;
  httpStatus?: number;
  constructor(message: string, code: ResultCode = ResultCode.Fail, httpStatus?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// 未授权事件：token 失效时通知上层（authStore 监听后清除会话并跳回登录）
type UnauthorizedListener = () => void;
const unauthorizedListeners: UnauthorizedListener[] = [];

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.push(listener);
  return () => {
    const idx = unauthorizedListeners.indexOf(listener);
    if (idx >= 0) unauthorizedListeners.splice(idx, 1);
  };
}

export function emitUnauthorized(): void {
  for (const listener of unauthorizedListeners.slice()) {
    try { listener(); } catch { /* ignore */ }
  }
}

// 通用分页结果
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 通用 ID 入参
export interface IdInput {
  id: string;
}
