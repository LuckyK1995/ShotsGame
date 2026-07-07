// 强化系统道具：4 种强化用品
// 复用 ItemRarity（与装备品质共用），与 EquipmentIcon 的品质色板一致

import type { ItemRarity } from '../types/game';

export type EnhanceItemId =
  | 'enhance_scroll_plus1'   // 强化等级+1卷（限13以下使用）
  | 'enhance_scroll_plus2'   // 强化等级+2卷（限9以下使用）
  | 'enhance_normal_booster' // 普通强化器：免费强化一次
  | 'enhance_ancient_booster'; // 远古强化器：免费强化一次，成功率+10%

export interface EnhanceItemDef {
  id: EnhanceItemId;
  name: string;
  shortName: string;
  rarity: ItemRarity;
  description: string;
  // 使用模式
  mode: 'scroll' | 'booster';
  // scroll: 直接 +N，使用时受 maxLevel 限制
  plusAmount?: number;
  maxLevel?: number; // 限该等级以下使用（不含该等级）
  // booster: 免费强化一次；ancient_booster 额外成功率
  successBonus?: number;
}

export const ENHANCE_ITEMS: Record<EnhanceItemId, EnhanceItemDef> = {
  enhance_scroll_plus1: {
    id: 'enhance_scroll_plus1',
    name: '强化等级+1卷',
    shortName: '+1卷',
    rarity: 'mythic',
    description: '使用后，装备的强化等级+1，限强化 13（不含）以下使用。',
    mode: 'scroll',
    plusAmount: 1,
    maxLevel: 13,
  },
  enhance_scroll_plus2: {
    id: 'enhance_scroll_plus2',
    name: '强化等级+2卷',
    shortName: '+2卷',
    rarity: 'fine',
    description: '使用后，装备的强化等级+2，限强化 9（不含）以下使用。',
    mode: 'scroll',
    plusAmount: 2,
    maxLevel: 9,
  },
  enhance_normal_booster: {
    id: 'enhance_normal_booster',
    name: '普通强化器',
    shortName: '强化器',
    rarity: 'common',
    description: '使用后，免费强化一次装备（不消耗金币）。',
    mode: 'booster',
  },
  enhance_ancient_booster: {
    id: 'enhance_ancient_booster',
    name: '远古强化器',
    shortName: '远古器',
    rarity: 'epic',
    description: '使用后，免费强化一次装备，强化成功率+10%。',
    mode: 'booster',
    successBonus: 0.1,
  },
};

export const ENHANCE_ITEM_ORDER: EnhanceItemId[] = [
  'enhance_scroll_plus1',
  'enhance_scroll_plus2',
  'enhance_normal_booster',
  'enhance_ancient_booster',
];

export function getEnhanceItemDef(id: string): EnhanceItemDef | undefined {
  return ENHANCE_ITEMS[id as EnhanceItemId];
}

// 最大强化等级
export const MAX_ENHANCE_LEVEL = 15;

// 强化攻击力加成：累加值，如 +3 = 1+2+3 = 6 点攻击力，+7 = 1+2+...+7 = 28 点攻击力
// 公式：n*(n+1)/2 * 0.35（平衡调整：削弱强化攻击加成，原公式无0.35系数）
export function getEnhanceAttackBonus(enhanceLevel: number): number {
  if (enhanceLevel <= 0) return 0;
  return Math.floor((enhanceLevel * (enhanceLevel + 1)) / 2 * 0.35);
}

// 强化成功率：1-3:100%，4-6：75%，7-9:50%，10-12：30%，13-15:10%
export function getEnhanceSuccessRate(currentLevel: number): number {
  if (currentLevel < 3) return 1.0;
  if (currentLevel < 6) return 0.75;
  if (currentLevel < 9) return 0.5;
  if (currentLevel < 12) return 0.3;
  return 0.1;
}

// 失败结果：1-3 无；4-6 保留等级；7-12 等级-2；13-15 等级-1
export type EnhanceFailResult = 'none' | 'keep' | 'minus2' | 'minus1';
export function getEnhanceFailResult(currentLevel: number): EnhanceFailResult {
  if (currentLevel < 3) return 'none';
  if (currentLevel < 6) return 'keep';
  if (currentLevel < 12) return 'minus2';
  return 'minus1';
}

// 金币消耗公式：随装备等级 / 品质 / 强化数值 三权重变化
const RARITY_GOLD_MULT: Record<ItemRarity, number> = {
  common: 1,
  advanced: 1.5,
  fine: 2,
  legendary: 3,
  epic: 4,
  mythic: 5,
};
export function getEnhanceGoldCost(
  equipLevel: number,
  rarity: ItemRarity,
  currentEnhance: number
): number {
  const base = 100;
  const levelMult = 1 + equipLevel * 0.5;
  const rarityMult = RARITY_GOLD_MULT[rarity] || 1;
  const enhanceMult = 1 + currentEnhance * 0.3;
  return Math.floor(base * levelMult * rarityMult * enhanceMult);
}
