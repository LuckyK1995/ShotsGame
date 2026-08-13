// Token 缓存：localStorage 持久化，支持 Access Token + Refresh Token + 过期时间
// 默认第一次需要登录，后续使用缓存的 token 自动恢复会话

const TOKEN_KEY = 'shotsGameToken';

export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  // 过期时间戳（毫秒）
  expiresAt: number;
  // 是否自动登录（30天有效期）
  autoLogin: boolean;
}

export function loadToken(): TokenInfo | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const info = JSON.parse(raw) as TokenInfo;
    if (!info.accessToken || !info.refreshToken) return null;
    return info;
  } catch {
    return null;
  }
}

export function saveToken(info: TokenInfo): void {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(info));
  } catch (e) {
    console.warn('Failed to save token:', e);
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

// 判断 Access Token 是否已过期（预留 30 秒提前刷新）
export function isTokenExpired(info: TokenInfo | null): boolean {
  if (!info) return true;
  return Date.now() >= info.expiresAt - 30 * 1000;
}

// 判断 Refresh Token 是否仍然有效（autoLogin 模式下 30 天）
export function canRefresh(info: TokenInfo | null): boolean {
  if (!info) return false;
  // autoLogin 模式：30 天内可刷新
  if (info.autoLogin) {
    return Date.now() < info.expiresAt + 30 * 24 * 60 * 60 * 1000;
  }
  // 普通模式：Access Token 过期后 7 天内可刷新
  return Date.now() < info.expiresAt + 7 * 24 * 60 * 60 * 1000;
}
