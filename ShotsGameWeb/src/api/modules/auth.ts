// 认证 API
import { http } from '../client';

export interface LoginInput {
  username: string;
  password: string;
  autoLogin?: boolean;
}

export interface RegisterInput {
  username: string;
  password: string;
  displayName?: string;
  email?: string;
}

export interface TokenOutput {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const authApi = {
  login: (input: LoginInput) =>
    http.post<TokenOutput>('/auth/login', input, { auth: false }),

  register: (input: RegisterInput) =>
    http.post<TokenOutput>('/auth/register', input, { auth: false }),

  refresh: (refreshToken: string) =>
    http.post<TokenOutput>('/auth/refresh', { refreshToken }, { auth: false }),

  logout: () => http.post('/auth/logout', undefined, { auth: false }),
};
