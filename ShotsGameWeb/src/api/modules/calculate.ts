// 属性计算 API
import { http } from '../client';

export interface PlayerStatsOutput {
  attack: number;
  attackSpeed: number;
  maxHealth: number;
  defense: number;
  critRate: number;
  critDamage: number;
  range: number;
  pierce: number;
  power: number;
  // 元素与扩展属性
  burnChance: number;
  poisonChance: number;
  freezeChance: number;
  lightningChance: number;
  lifestealPercent: number;
  goldBonus: number;
  expBonus: number;
  [key: string]: number;
}

export interface ExpCalculationOutput {
  level: number;
  exp: number;
  expToNextLevel: number;
  progressPercent: number;
}

export interface GoldCalculationInput {
  source: string;
  amount?: number;
  wave?: number;
  enemyType?: string;
}

export interface GoldCalculationOutput {
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  goldBonusPercent: number;
}

export const calculateApi = {
  playerStats: () => http.get<PlayerStatsOutput>('/calculate/player-stats'),
  expProgress: () => http.get<ExpCalculationOutput>('/calculate/exp-progress'),
  calculateGold: (input: GoldCalculationInput) =>
    http.post<GoldCalculationOutput>('/calculate/gold', input),
};
