// 附魔系统道具：基础属性附魔书
// 复用 ItemRarity（与装备品质共用），与 EquipmentIcon 的品质色板一致
// 5 种属性 × 6 种品质 = 30 种附魔书
// 品质 → 属性百分比：普通 1%, 高级 2%, 精致 3%, 传说 4%, 史诗 5%, 神话 6%
// 合成规则：每 2 本相同品质合成 1 本高一级品质的书（神话为最高，不可再合成）

import type { ItemRarity } from '../types/game';

// 附魔属性类型（5 种基础属性）
export type EnchantStat = 'attack' | 'health' | 'defense' | 'critRate' | 'resistance';

// 附魔书 ID 格式：`enchant_<stat>_<rarity>` 例如 `enchant_attack_common`
export type EnchantItemId = `enchant_${EnchantStat}_${ItemRarity}`;

export interface EnchantItemDef {
  id: EnchantItemId;
  name: string;
  shortName: string;
  stat: EnchantStat;
  rarity: ItemRarity;
  percent: number; // 属性加成百分比，1-6
  description: string;
}

// 属性元信息
export const ENCHANT_STAT_INFO: Record<EnchantStat, { name: string; color: string; label: string }> = {
  attack: { name: '攻击力', color: '#FF0080', label: '攻' },
  health: { name: '生命', color: '#34C759', label: '生' },
  defense: { name: '防御', color: '#5BA3E0', label: '防' },
  critRate: { name: '暴击率', color: '#B026FF', label: '暴' },
  resistance: { name: '抗性', color: '#5BC0EB', label: '抗' },
};

export const ENCHANT_STAT_ORDER: EnchantStat[] = ['attack', 'health', 'defense', 'critRate', 'resistance'];

// 品质 → 百分比
export const RARITY_PERCENT: Record<ItemRarity, number> = {
  common: 1,
  advanced: 2,
  fine: 3,
  legendary: 4,
  epic: 5,
  mythic: 6,
};

// 品质升级路径
export const RARITY_UPGRADE: Record<ItemRarity, ItemRarity | null> = {
  common: 'advanced',
  advanced: 'fine',
  fine: 'legendary',
  legendary: 'epic',
  epic: 'mythic',
  mythic: null, // 最高级，不可再合成
};

// 品质中文显示
export const ENCHANT_RARITY_LABELS: Record<ItemRarity, string> = {
  common: '普通',
  advanced: '高级',
  fine: '精致',
  legendary: '传说',
  epic: '史诗',
  mythic: '神话',
};

// 生成所有附魔书定义
function buildEnchantItems(): Record<EnchantItemId, EnchantItemDef> {
  const result = {} as Record<EnchantItemId, EnchantItemDef>;
  const rarities: ItemRarity[] = ['common', 'advanced', 'fine', 'legendary', 'epic', 'mythic'];
  for (const stat of ENCHANT_STAT_ORDER) {
    for (const rarity of rarities) {
      const id = `enchant_${stat}_${rarity}` as EnchantItemId;
      const statName = ENCHANT_STAT_INFO[stat].name;
      const rarityLabel = ENCHANT_RARITY_LABELS[rarity];
      const percent = RARITY_PERCENT[rarity];
      result[id] = {
        id,
        name: `${statName}附魔书·${rarityLabel}`,
        shortName: `${statName}·${rarityLabel}`,
        stat,
        rarity,
        percent,
        description: `使用后，装备获得附魔效果：${statName} +${percent}%（百分比加成到该属性）。`,
      };
    }
  }
  return result;
}

export const ENCHANT_ITEMS = buildEnchantItems();

// ID 排序：属性优先，品质升序
export const ENCHANT_ITEM_ORDER: EnchantItemId[] = ENCHANT_STAT_ORDER.flatMap(stat =>
  (['common', 'advanced', 'fine', 'legendary', 'epic', 'mythic'] as ItemRarity[]).map(
    rarity => `enchant_${stat}_${rarity}` as EnchantItemId
  )
);

export function getEnchantItemDef(id: string): EnchantItemDef | undefined {
  return ENCHANT_ITEMS[id as EnchantItemId];
}

// 获取合成后高一级的附魔书 ID（同 stat）
export function getUpgradeEnchantId(id: EnchantItemId): EnchantItemId | null {
  const def = ENCHANT_ITEMS[id];
  if (!def) return null;
  const nextRarity = RARITY_UPGRADE[def.rarity];
  if (!nextRarity) return null;
  return `enchant_${def.stat}_${nextRarity}` as EnchantItemId;
}

// 合成所需数量
export const ENCHANT_SYNTH_COST = 2;

// 初始库存：普通、高级、精品质各 50 本
export const INITIAL_ENCHANT_INVENTORY = (() => {
  const list: { itemId: string; count: number }[] = [];
  for (const stat of ENCHANT_STAT_ORDER) {
    for (const rarity of ['common', 'advanced', 'fine'] as ItemRarity[]) {
      list.push({ itemId: `enchant_${stat}_${rarity}`, count: 50 });
    }
  }
  return list;
})();
