// 玩家档案 API
import { http } from '../client';

export interface PlayerProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  level: number;
  exp: number;
  expToNextLevel: number;
  gold: number;
  score: number;
  skillPoints: number;
  maxWave: number;
  totalKills: number;
  totalBattles: number;
  totalVictories: number;
  lastActiveAt: string;
  // PK 与战斗力扩展
  pkWins: number;
  pkLosses: number;
  pkTotal: number;
  power: number;
  maxStage: number;
}

export interface UpdatePlayerInput {
  displayName?: string;
  avatarUrl?: string;
}

export interface UpdatePlayerStatsInput {
  power?: number;
  maxStage?: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  score: number;
  maxWave: number;
  // 扩展字段
  power: number;
  pkWins: number;
  pkLosses: number;
  pkTotal: number;
  pkWinRate: number;
  isOnline: boolean;
  maxStage: number;
}

export type LeaderboardSortBy = 'power' | 'level' | 'score';

export const playerApi = {
  getProfile: () => http.get<PlayerProfile>('/player/profile'),
  updateProfile: (input: UpdatePlayerInput) => http.put<PlayerProfile>('/player/profile', input),
  updateStats: (input: UpdatePlayerStatsInput) => http.put<PlayerProfile>('/player/stats', input),
  getLeaderboard: (top = 50, sortBy: LeaderboardSortBy = 'power') =>
    http.get<LeaderboardEntry[]>('/player/leaderboard', { query: { top, sortBy }, auth: false }),
};

