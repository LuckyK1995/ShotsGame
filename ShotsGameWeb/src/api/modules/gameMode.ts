// 游戏模式 API
import { http } from '../client';

export interface GameModeInfo {
  id: string;
  name: string;
  unlockLevel: number;
  dailyLimit: number;
  remainingToday: number;
  description: string;
}

export interface MaterialDungeonInfo {
  type: string;
  name: string;
  description: string;
  remainingToday: number;
}

export interface StartGameInput {
  modeId: string;
  difficulty?: string;
  dungeonType?: string;
}

export interface StartGameOutput {
  success: boolean;
  modeId: string;
  difficulty: string;
  remainingToday: number;
  initialData?: unknown;
  message: string | null;
}

export const gameModeApi = {
  getModes: () => http.get<{ modes: GameModeInfo[] }>('/game-mode/modes'),
  start: (input: StartGameInput) => http.post<StartGameOutput>('/game-mode/start', input),
  getMaterialDungeons: () =>
    http.get<{ dungeons: MaterialDungeonInfo[] }>('/game-mode/material-dungeons'),
};
