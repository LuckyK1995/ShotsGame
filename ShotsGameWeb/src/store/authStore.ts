// 鉴权状态管理：登录/登出/注册/会话恢复
import { create } from 'zustand';
import { authApi, type LoginInput, type RegisterInput, type TokenOutput } from '../api';
import {
  canRefresh,
  clearToken,
  loadToken,
  saveToken,
  type TokenInfo,
} from '../api/token';
import { isAuthenticated } from '../api/client';
import { onUnauthorized } from '../api/types';
import { playerApi, type PlayerProfile } from '../api/modules/player';

// 清除上一个账号的本地游戏存档残留，避免新账号读到旧存档导致等级/装备串号
function clearLocalGameCache(): void {
  try {
    localStorage.removeItem('shotsGameSave');
    localStorage.removeItem('shotsGameHighScore');
    localStorage.removeItem('shotsGame_lastOnline');
    localStorage.removeItem('shotsGameDailyChallenge');
  } catch {
    /* ignore */
  }
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  token: TokenInfo | null;
  profile: PlayerProfile | null;
  error: string | null;

  // 启动时调用：尝试用缓存 token 恢复会话
  initialize: () => Promise<void>;
  // 登录
  login: (input: LoginInput) => Promise<void>;
  // 注册（注册成功后自动登录）
  register: (input: RegisterInput) => Promise<void>;
  // 登出
  logout: () => Promise<void>;
  // 拉取最新玩家档案
  refreshProfile: () => Promise<void>;
  // 清除错误
  clearError: () => void;
}

let unauthorizedUnsub: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => {
  // 监听 401 事件（来自 HTTP 拦截器）：自动登出
  if (!unauthorizedUnsub) {
    unauthorizedUnsub = onUnauthorized(() => {
      clearToken();
      set({ status: 'unauthenticated', token: null, profile: null });
    });
  }

  const persistToken = (output: TokenOutput, autoLogin: boolean) => {
    const info: TokenInfo = {
      accessToken: output.accessToken,
      refreshToken: output.refreshToken,
      expiresAt: Date.now() + output.expiresIn * 1000,
      autoLogin,
    };
    saveToken(info);
    return info;
  };

  return {
    status: 'loading',
    token: null,
    profile: null,
    error: null,

    initialize: async () => {
      // 无缓存 token：直接未授权
      if (!isAuthenticated()) {
        set({ status: 'unauthenticated', token: null, profile: null });
        return;
      }
      const cached = loadToken();
      // Refresh Token 也失效：需重新登录
      if (!cached || !canRefresh(cached)) {
        clearToken();
        set({ status: 'unauthenticated', token: null, profile: null });
        return;
      }
      try {
        // 拉取玩家档案，验证 token 是否仍然有效
        const profile = await playerApi.getProfile();
        set({ status: 'authenticated', token: cached, profile });
      } catch (e: any) {
        // token 已失效且无法刷新：拦截器会触发 onUnauthorized
        set({
          status: 'unauthenticated',
          token: null,
          profile: null,
          error: e?.message ?? '会话已过期',
        });
      }
    },

    login: async (input) => {
      set({ error: null });
      try {
        const output = await authApi.login(input);
        const info = persistToken(output, !!input.autoLogin);
        const profile = await playerApi.getProfile();
        set({ status: 'authenticated', token: info, profile });
      } catch (e: any) {
        const msg = e?.message ?? '登录失败';
        set({ error: msg });
        throw new Error(msg);
      }
    },

    register: async (input) => {
      set({ error: null });
      try {
        const output = await authApi.register(input);
        const info = persistToken(output, false);
        // 新注册账号：清除本地旧账号存档残留，确保从 1 级开始
        clearLocalGameCache();
        const profile = await playerApi.getProfile();
        set({ status: 'authenticated', token: info, profile });
      } catch (e: any) {
        const msg = e?.message ?? '注册失败';
        set({ error: msg });
        throw new Error(msg);
      }
    },

    logout: async () => {
      try {
        await authApi.logout();
      } catch {
        /* ignore */
      }
      clearToken();
      clearLocalGameCache();
      set({ status: 'unauthenticated', token: null, profile: null });
    },

    refreshProfile: async () => {
      try {
        const profile = await playerApi.getProfile();
        set({ profile });
      } catch {
        /* ignore */
      }
    },

    clearError: () => set({ error: null }),
  };
});
