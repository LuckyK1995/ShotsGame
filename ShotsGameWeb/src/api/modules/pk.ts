// PK 对战 API
import { http } from '../client';

export interface OnlinePlayer {
  playerId: string;
  displayName: string;
  level: number;
  power: number;
  pkWins: number;
  pkLosses: number;
  pkTotal: number;
  pkWinRate: number;
  isOnline: boolean;
  lastActiveAt: string;
}

export interface ReportPkResultInput {
  defenderId: string;
  isWin: boolean;
  durationSeconds: number;
}

export interface PkRecord {
  id: string;
  challengerId: string;
  challengerName: string;
  defenderId: string;
  defenderName: string;
  winnerId: string | null;
  playedAt: string;
  durationSeconds: number;
}

/** 玩家真实战斗属性（PK BattleScene 口径：attackSpeed=次/秒，critRate=0~1小数，critDamage=倍率） */
export interface OpponentBattleStats {
  playerId: string;

  attack: number;
  attackSpeed: number;   // 次/秒
  maxHealth: number;
  critRate: number;      // 0~1 小数
  critDamage: number;    // 倍率（如 1.5）
  defense: number;
  range: number;
  physicalPenetration: number;
  resistance: number;    // 通用抗性百分数

  fireDamageBonus: number;
  iceDamageBonus: number;
  lightningDamageBonus: number;
  poisonDamageBonus: number;

  fireResistance: number;
  iceResistance: number;
  lightningResistance: number;
  poisonResistance: number;

  /** real=真实快照 / fallback=估算公式兜底 */
  source: 'real' | 'fallback';
}

export const pkApi = {
  /** 获取在线玩家列表 */
  getOnlinePlayers: () => http.get<OnlinePlayer[]>('/pk/online-players'),
  /** 上报 PK 结果 */
  reportResult: (input: ReportPkResultInput) =>
    http.post<PkRecord>('/pk/report', input),
  /** 获取指定玩家真实战斗属性（PK 对战时取对手完整属性） */
  getOpponentStats: (playerId: string) =>
    http.get<OpponentBattleStats>(`/pk/player-stats/${encodeURIComponent(playerId)}`),
};
