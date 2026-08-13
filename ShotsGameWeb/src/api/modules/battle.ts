// 战斗 API
import { http } from '../client';

export interface SubmitBattleInput {
  modeId: string;
  difficulty?: string;
  result: 'victory' | 'defeat' | 'exit';
  wave: number;
  kills: number;
  eliteKills?: number;
  bossKills?: number;
  durationSeconds?: number;
  score: number;
  // 战利品快照（可选，用于服务端校验/记录）
  drops?: unknown;
}

export interface BattleResultOutput {
  success: boolean;
  goldGained: number;
  expGained: number;
  newLevel: number;
  leveledUp: boolean;
  skillPointsGained: number;
  achievementUnlocked: string[];
  message: string | null;
}

export interface BattleRecordOutput {
  id: string;
  modeId: string;
  difficulty: string;
  result: string;
  wave: number;
  kills: number;
  score: number;
  goldGained: number;
  expGained: number;
  createdAt: string;
}

export const battleApi = {
  submit: (input: SubmitBattleInput) => http.post<BattleResultOutput>('/battle/submit', input),
  history: (page = 1, pageSize = 20) =>
    http.get<{ items: BattleRecordOutput[]; total: number; page: number; pageSize: number }>(
      '/battle/history',
      { query: { page, pageSize } }
    ),
};
