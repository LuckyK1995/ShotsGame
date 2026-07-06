// 宝石系统：5种类型 × 2种品质（普通/高级）
// 普通 = 1点属性，高级 = 2点属性
// 每件装备最多镶嵌15颗宝石

import type { ItemRarity } from '../types/game';

// 宝石类型：攻击力、生命、防御、暴击、抗性
export type GemType = 'attack' | 'health' | 'defense' | 'critRate' | 'resistance';

// 宝石品质：仅 普通/高级
export type GemRarity = 'common' | 'advanced';

export interface GemDef {
  id: string;            // gem_attack_common, gem_health_advanced 等
  type: GemType;
  rarity: GemRarity;
  name: string;          // 完整名称：高级攻击力宝石
  shortName: string;     // 单字标识：攻、生、防、暴、抗
  icon: string;          // 图标 emoji
  value: number;         // 1=普通，2=高级
  description: string;
}

// 类型 -> 中文名 + 短标识 + 图标 + 颜色
export const GEM_TYPE_INFO: Record<GemType, { name: string; short: string; icon: string; color: string }> = {
  attack:     { name: '攻击力宝石', short: '攻', icon: '💎', color: '#FF6B8A' },  // 红粉
  health:     { name: '生命宝石',   short: '生', icon: '💚', color: '#34C759' },  // 绿
  defense:    { name: '防御宝石',   short: '防', icon: '🔷', color: '#5BA3E0' },  // 蓝
  critRate:   { name: '暴击宝石',   short: '暴', icon: '🌟', color: '#B026FF' },  // 紫
  resistance: { name: '抗性宝石',   short: '抗', icon: '🔮', color: '#00F5D4' },  // 青
};

// 品质 -> 中文标签
export const GEM_RARITY_LABELS: Record<GemRarity, string> = {
  common: '普通',
  advanced: '高级',
};

// 宝石图标颜色（背景渐变用）
export const GEM_RARITY_BG: Record<GemRarity, string> = {
  common: 'radial-gradient(circle at 50% 40%, #4A4060 0%, #2A2038 60%, #18101E 100%)',
  advanced: 'radial-gradient(circle at 50% 40%, #2A5A8A 0%, #1A3A60 60%, #082038 100%)',
};

export const GEM_RARITY_BORDER: Record<GemRarity, string> = {
  common: '#9A9A9A',
  advanced: '#5BA3E0',
};

// 全部宝石定义：5种 × 2品质 = 10种
export const GEMS: Record<string, GemDef> = (() => {
  const out: Record<string, GemDef> = {};
  const types: GemType[] = ['attack', 'health', 'defense', 'critRate', 'resistance'];
  const rarities: GemRarity[] = ['common', 'advanced'];
  for (const t of types) {
    for (const r of rarities) {
      const info = GEM_TYPE_INFO[t];
      const value = r === 'common' ? 1 : 2;
      const rarityLabel = GEM_RARITY_LABELS[r];
      const id = `gem_${t}_${r}`;
      out[id] = {
        id,
        type: t,
        rarity: r,
        name: `${rarityLabel}${info.name}`,
        shortName: info.short,
        icon: info.icon,
        value,
        description: `+${value} ${t === 'attack' ? '攻击力' : t === 'health' ? '生命' : t === 'defense' ? '防御' : t === 'critRate' ? '暴击率' : '抗性'} (镶嵌后生效)`,
      };
    }
  }
  return out;
})();

// 工具函数
export function getGemDef(gemId: string): GemDef | undefined {
  return GEMS[gemId];
}

// 镶嵌规则常量
export const MAX_GEM_SOCKETS = 15;

// 第1颗 100% 成功，第2-15颗 50% 成功
// 失败规则：第2-7颗失败不归零（仅损失此次尝试的宝石），第8-15颗失败直接归零（所有已镶嵌的宝石清空）
export function getSocketSuccessRate(currentCount: number): number {
  if (currentCount <= 0) return 1.0;  // 第1颗 100%
  return 0.5;
}

// 失败后是否归零
export function isFailResetToZero(currentCount: number): boolean {
  // 当前数量在 7-14 之间（即正在镶嵌第 8-15 颗）时失败归零
  return currentCount >= 7;
}

// 随机生成一颗宝石（掉落用）
export function randomGemId(): string {
  const types: GemType[] = ['attack', 'health', 'defense', 'critRate', 'resistance'];
  const t = types[Math.floor(Math.random() * types.length)];
  // 普通概率70%，高级30%
  const r: GemRarity = Math.random() < 0.7 ? 'common' : 'advanced';
  return `gem_${t}_${r}`;
}

// 把宝石类型转换为 ItemRarity（用于兼容 store）
export function gemRarityToItemRarity(r: GemRarity): ItemRarity {
  return r as ItemRarity;
}
