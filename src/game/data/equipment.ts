import type { Equipment, ItemDef, EquipSlot, EquipRarity, ItemRarity, SetBonus, SetBonusId, EquipmentAffix, ElementType, QualityTier, QualitySetData } from '../types/game';
export { SKILLS, SKILL_TREE_LAYERS, FX_SKILL_TREE_LAYERS, CLONE_SKILL_TREE_LAYERS } from './skills';

// 品质套装定义：传说/史诗/神话 3/6/9 件套效果（神话数值砍至原20%）
export const QUALITY_SETS: QualitySetData[] = [
  {
    tier: 'legendary',
    name: '传说套装',
    icon: '🟠',
    effects: [
      { pieces: 3, name: '传说之力', description: '攻击力 +15%', stat: 'attack', value: 15 },
      { pieces: 6, name: '传说守护', description: '生命 +25%，防御 +15%', stat: 'maxHealth', value: 25 },
      { pieces: 9, name: '传说裁决', description: '暴击伤害 +50%，攻速 +15%', stat: 'critDamage', value: 50 },
    ],
  },
  {
    tier: 'epic',
    name: '史诗套装',
    icon: '🟡',
    effects: [
      { pieces: 3, name: '史诗狂战', description: '攻击力 +25%', stat: 'attack', value: 25 },
      { pieces: 6, name: '史诗壁垒', description: '生命 +40%，防御 +25%', stat: 'maxHealth', value: 40 },
      { pieces: 9, name: '史诗审判', description: '暴击率 +15%，暴击伤害 +80%', stat: 'critRate', value: 15 },
    ],
  },
  {
    tier: 'mythic',
    name: '神话套装',
    icon: '🔴',
    effects: [
      { pieces: 3, name: '神话觉醒', description: '攻击力 +8%，攻速 +4%', stat: 'attack', value: 8 },
      { pieces: 6, name: '神话不朽', description: '生命 +12%，防御 +8%', stat: 'maxHealth', value: 12 },
      { pieces: 9, name: '神话至高', description: '全属性 +10%，每秒回 0.4% 生命', stat: 'allStats', value: 10 },
    ],
  },
];

// 获取品质套装数据
export function getQualitySet(tier: QualityTier): QualitySetData | undefined {
  return QUALITY_SETS.find(s => s.tier === tier);
}

// 计算装备中成套的（同品质+同等级，3件及以上）分组
export interface QualitySetGroup {
  tier: QualityTier;
  level: number;
  count: number;
  pieces: number; // 3 / 6 / 9 中已达到的最高档
  set: QualitySetData;
}

export function getQualitySetGroups(equipment: Equipment[]): QualitySetGroup[] {
  const groups: QualitySetGroup[] = [];
  const map = new Map<string, Equipment[]>();
  for (const e of equipment) {
    if (e.rarity !== 'legendary' && e.rarity !== 'epic' && e.rarity !== 'mythic') continue;
    const key = `${e.rarity}_${e.level}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  for (const [key, items] of map) {
    if (items.length < 3) continue;
    const [tier, lvlStr] = key.split('_');
    const set = getQualitySet(tier as QualityTier)!;
    let pieces = 3;
    if (items.length >= 9) pieces = 9;
    else if (items.length >= 6) pieces = 6;
    groups.push({
      tier: tier as QualityTier,
      level: parseInt(lvlStr),
      count: items.length,
      pieces,
      set,
    });
  }
  return groups;
}

// 判断单件装备是否属于成套（用于跑马灯特效）
export function isEquipmentInActiveSet(equip: Equipment, allEquipped: Equipment[]): boolean {
  if (equip.rarity !== 'legendary' && equip.rarity !== 'epic' && equip.rarity !== 'mythic') return false;
  const sameSet = allEquipped.filter(e => e.rarity === equip.rarity && e.level === equip.level);
  return sameSet.length >= 3;
}

export const EQUIP_SLOTS: EquipSlot[] = ['weapon', 'armor', 'pants', 'shoulder', 'belt', 'shoes', 'earring', 'ring', 'necklace'];

export const RARITY_COLORS: Record<EquipRarity | ItemRarity, string> = {
  common: '#9A9A9A',
  advanced: '#5BA3E0',
  fine: '#B060E0',
  legendary: '#E08030',
  epic: '#E0C040',
  mythic: '#E03030',
};

const RARITY_BG: Record<EquipRarity | ItemRarity, string> = {
  common: '#D4C8B0',
  advanced: '#A8C8E0',
  fine: '#C8A0E0',
  // 传说：暖棕红底，衬托橙色边框
  legendary: '#7A3A1A',
  // 史诗：深紫底，衬托金色边框
  epic: '#4A2A7A',
  // 神话：深红底，衬托红色边框
  mythic: '#7A1A2A',
};

const RARITY_BG_DARK: Record<EquipRarity | ItemRarity, string> = {
  common: '#A89880',
  advanced: '#7090B0',
  fine: '#9070B0',
  legendary: '#3D1A08',
  epic: '#1E0E3D',
  mythic: '#3D0A12',
};

export const RARITY_LABELS: Record<EquipRarity | ItemRarity, string> = {
  common: '普通',
  advanced: '高级',
  fine: '精致',
  legendary: '传说',
  epic: '史诗',
  mythic: '神话',
};

export const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon: '武器',
  armor: '上衣',
  pants: '下装',
  shoulder: '护肩',
  belt: '腰带',
  shoes: '鞋子',
  earring: '耳环',
  ring: '戒指',
  necklace: '项链',
};

// BALANCE v12: Enhanced equipment icons - 10 variants per slot with thematic designs
const SLOT_ICONS: Record<EquipSlot, string[]> = {
  weapon: ['🔫', '⚔️', '🏹', '🗡️', '💣', '🎯', '🔪', '🪓', '⚙️', '🔧'],
  armor: ['🛡️', '🦺', '👕', '🦾', '🔰', '🏋️', '🧥', '🪖', '💠', '⚙️'],
  pants: ['👖', '🩳', '🦵', '🎽', '🩱', '🦸', '🦹', '⚔️', '🛡️', '💎'],
  shoulder: ['🦴', '💀', '🪖', '🎩', '⛑️', '🔔', '🎭', '🦾', '⚙️', '💠'],
  belt: ['💼', '👜', '🎒', '📦', '🗝️', '🔑', '⛓️', '🔗', '⚙️', '💎'],
  shoes: ['👢', '👟', '🥾', '🥿', '🚀', '⚡', '🔥', '💨', '🦶', '👠'],
  earring: ['🎧', '💎', '🔔', '🎵', '🎶', '🪈', '🔊', '🎙️', '🎚️', '🎛️'],
  ring: ['💍', '🪙', '⭕', '🔘', '⚫', '🔴', '🟡', '🟢', '🔵', '🟣'],
  necklace: ['📿', '⛓️', '🪢', '💠', '🔮', '🎀', '🎗️', '🏷️', '💝', '💞'],
};

export const SET_BONUSES: Record<SetBonusId, SetBonus> = {
  wasteland_ranger: {
    id: 'wasteland_ranger',
    name: '废土游侠',
    description: '废土中游荡的精锐游侠装备',
    pieces: 6,
    icon: '🏜️',
    effects: [
      { pieces: 2, effect: '攻击力+10%', value: 10, stat: 'attack' },
      { pieces: 4, effect: '暴击率+5%', value: 5, stat: 'critRate' },
      { pieces: 6, effect: '攻击速度+20%', value: 20, stat: 'attackSpeed' },
    ],
  },
  tech_soldier: {
    id: 'tech_soldier',
    name: '科技战士',
    description: '高科技改造的战士装备',
    pieces: 6,
    icon: '🤖',
    effects: [
      { pieces: 2, effect: '防御力+15%', value: 15, stat: 'defense' },
      { pieces: 4, effect: '生命值+20%', value: 20, stat: 'health' },
      { pieces: 6, effect: '护盾再生', value: 5, stat: 'shieldRegen' },
    ],
  },
  mutant_hunter: {
    id: 'mutant_hunter',
    name: '变异猎人',
    description: '专门猎杀变异生物的装备',
    pieces: 6,
    icon: '🧟',
    effects: [
      { pieces: 2, effect: '对精英怪伤害+20%', value: 20, stat: 'eliteDamage' },
      { pieces: 4, effect: '暴击伤害+30%', value: 30, stat: 'critDamage' },
      { pieces: 6, effect: '击杀回血', value: 5, stat: 'lifesteal' },
    ],
  },
  survivor: {
    id: 'survivor',
    name: '幸存者',
    description: '废土幸存者的基础装备',
    pieces: 6,
    icon: '🎒',
    effects: [
      { pieces: 2, effect: '拾取范围+50%', value: 50, stat: 'pickupRange' },
      { pieces: 4, effect: '金币获取+30%', value: 30, stat: 'goldBonus' },
      { pieces: 6, effect: '经验获取+25%', value: 25, stat: 'expBonus' },
    ],
  },
  raider: {
    id: 'raider',
    name: '掠夺者',
    description: '凶狠掠夺者的战斗装备',
    pieces: 6,
    icon: '💀',
    effects: [
      { pieces: 2, effect: '攻击速度+10%', value: 10, stat: 'attackSpeed' },
      { pieces: 4, effect: '攻击力+15%', value: 15, stat: 'attack' },
      { pieces: 6, effect: '吸血+10%', value: 10, stat: 'lifesteal' },
    ],
  },
  
  wasteland_destroyer: {
    id: 'wasteland_destroyer',
    name: '废土毁灭者',
    description: '传说中毁灭一切的武器套装',
    pieces: 6,
    icon: '☠️',
    // BALANCE v12: Optimized wasteland_destroyer - stronger effects
    effects: [
      { pieces: 2, effect: '攻击力+20%', value: 20, stat: 'attack' },
      { pieces: 4, effect: '暴击伤害+50%', value: 50, stat: 'critDamage' },
      { pieces: 6, effect: '攻击附带灼烧伤害，攻速+15%', value: 25, stat: 'burnDamage' },
    ],
  },
};

// 基础属性类型：仅6种（攻击、生命、防御、暴击率、射程、穿透）
const BASE_STAT_TYPES: EquipmentAffix['type'][] = ['attack', 'health', 'defense', 'critRate', 'range', 'pierce'];

// 词条池：战斗力弹窗内所有13种属性 + 元素伤害词条
const AFFIX_POOL: Omit<EquipmentAffix, 'value'>[] = [
  { id: 'affix_attack', name: '强力', type: 'attack' },
  { id: 'affix_attack_speed', name: '迅捷', type: 'attackSpeed' },
  { id: 'affix_health', name: '生命', type: 'health' },
  { id: 'affix_crit_rate', name: '暴击', type: 'critRate' },
  { id: 'affix_crit_damage', name: '暴伤', type: 'critDamage' },
  { id: 'affix_pierce', name: '物理穿透', type: 'pierce' },
  { id: 'affix_range', name: '远程', type: 'range' },
  { id: 'affix_defense', name: '坚固', type: 'defense' },
  { id: 'affix_lifesteal', name: '吸血', type: 'lifesteal' },
  { id: 'affix_status_burn', name: '灼烧附魔', type: 'statusBurn' },
  { id: 'affix_status_poison', name: '剧毒附魔', type: 'statusPoison' },
  { id: 'affix_status_freeze', name: '冰冻附魔', type: 'statusFreeze' },
  { id: 'affix_status_lightning', name: '雷电附魔', type: 'statusLightning' },
  { id: 'affix_fire_dmg', name: '烈焰', type: 'elementalDamage', element: 'fire' },
  { id: 'affix_ice_dmg', name: '寒冰', type: 'elementalDamage', element: 'ice' },
  { id: 'affix_lightning_dmg', name: '雷霆', type: 'elementalDamage', element: 'lightning' },
  { id: 'affix_poison_dmg', name: '剧毒', type: 'elementalDamage', element: 'poison' },
];

// 属性攻击词条池（传说以上强制+1）
const ELEMENTAL_ATTACK_POOL: Omit<EquipmentAffix, 'value'>[] = [
  { id: 'affix_fire_atk', name: '火焰攻击', type: 'elementalAttack', element: 'fire' },
  { id: 'affix_ice_atk', name: '寒冰攻击', type: 'elementalAttack', element: 'ice' },
  { id: 'affix_lightning_atk', name: '雷电攻击', type: 'elementalAttack', element: 'lightning' },
  { id: 'affix_poison_atk', name: '毒素攻击', type: 'elementalAttack', element: 'poison' },
];

// 品质对应的基础属性数量、词条数量范围
const RARITY_STAT_CONFIG: Record<EquipRarity, { baseStatCount: number; affixMin: number; affixMax: number; hasElementalAttack: boolean }> = {
  common: { baseStatCount: 1, affixMin: 0, affixMax: 0, hasElementalAttack: false },
  advanced: { baseStatCount: 2, affixMin: 0, affixMax: 0, hasElementalAttack: false },
  fine: { baseStatCount: 3, affixMin: 0, affixMax: 0, hasElementalAttack: false },
  legendary: { baseStatCount: 4, affixMin: 0, affixMax: 1, hasElementalAttack: true },
  epic: { baseStatCount: 4, affixMin: 1, affixMax: 2, hasElementalAttack: true },
  mythic: { baseStatCount: 5, affixMin: 2, affixMax: 2, hasElementalAttack: true },
};

const SET_EQUIPMENT_NAMES: Record<SetBonusId, Record<EquipSlot, string>> = {
  wasteland_ranger: {
    weapon: '游侠步枪', armor: '游侠风衣', pants: '游侠皮裤',
    shoulder: '游侠护肩', belt: '游侠腰带', shoes: '游侠长靴',
    earring: '游侠耳坠', ring: '游侠指环', necklace: '游侠项链',
  },
  tech_soldier: {
    weapon: '能量步枪', armor: '动力护甲', pants: '动力腿甲',
    shoulder: '机械护肩', belt: '能量腰带', shoes: '推进靴',
    earring: '通讯耳环', ring: '能量指环', necklace: '核心项链',
  },
  mutant_hunter: {
    weapon: '猎魔霰弹', armor: '猎魔护甲', pants: '猎魔裤',
    shoulder: '猎魔肩甲', belt: '猎魔腰带', shoes: '猎魔靴',
    earring: '猎魔耳饰', ring: '猎魔之戒', necklace: '猎魔项链',
  },
  survivor: {
    weapon: '改装步枪', armor: '破旧夹克', pants: '工装裤',
    shoulder: '垫肩', belt: '工具腰带', shoes: '旧军靴',
    earring: '耳机', ring: '铜戒指', necklace: '十字架',
  },
  raider: {
    weapon: '掠夺者之刃', armor: '钉刺护甲', pants: '战裤',
    shoulder: '尖刺肩甲', belt: '骷髅腰带', shoes: '战靴',
    earring: '骷髅耳环', ring: '骨戒', necklace: '獠牙项链',
  },
  wasteland_destroyer: {
    weapon: '毁灭者巨炮', armor: '毁灭战甲', pants: '毁灭战裙',
    shoulder: '毁灭肩铠', belt: '毁灭束腰', shoes: '毁灭重靴',
    earring: '毁灭耳坠', ring: '毁灭之戒', necklace: '毁灭核心',
  },
};

// 基础属性基础值（用于主属性生成）
// 平衡调整：降低攻击基础值（5→3），减少前期装备攻击占比
const BASE_STAT_VALUES: Record<string, number> = {
  attack: 3,
  health: 40,
  defense: 4,
  critRate: 1.5,
  range: 6,
  pierce: 1,
};

// 基础属性类型 → Equipment字段名映射
const STAT_TYPE_TO_FIELD: Record<string, string> = {
  attack: 'attack',
  health: 'health',
  defense: 'defense',
  critRate: 'critRate',
  range: 'range',
  pierce: 'pierce',
};

// 词条基础值
// 平衡调整：降低攻击词条基础值（3.8→2.5）
const AFFIX_BASE_VALUES: Record<string, number> = {
  attack: 2.5,
  attackSpeed: 4,
  health: 16,
  critRate: 1.2,
  critDamage: 6,
  pierce: 1,
  range: 4,
  defense: 1.8,
  lifesteal: 1.5,
  statusBurn: 6,
  statusPoison: 6,
  statusFreeze: 6,
  statusLightning: 6,
  elementalDamage: 16,
  elementalAttack: 8,
};

const RARITY_MULT: Record<EquipRarity, number> = {
  common: 1, advanced: 1.4, fine: 1.9, legendary: 2.8, epic: 4.0, mythic: 5.5,
};

// 射程上限（需求 #3）：神话品质不超过100点
const RANGE_CAP: Record<EquipRarity, number> = {
  common: 20, advanced: 35, fine: 50, legendary: 70, epic: 85, mythic: 100,
};

// 生成装备主属性（基础属性）：从6种基础属性中按品质数量随机选取
function rollBaseStats(rarity: EquipRarity, level: number): Record<string, number> {
  const config = RARITY_STAT_CONFIG[rarity];
  const count = config.baseStatCount;
  if (count <= 0) return {};

  const types = [...BASE_STAT_TYPES].sort(() => Math.random() - 0.5).slice(0, count);
  const rarityMult = RARITY_MULT[rarity];
  // 平衡调整：提升等级成长系数（0.10→0.13），保证后期装备攻击力
  const levelMult = 1 + (level - 1) * 0.13;

  const result: Record<string, number> = {};
  for (const type of types) {
    const baseValue = BASE_STAT_VALUES[type];
    let value = Math.max(1, Math.floor(baseValue * rarityMult * levelMult * (0.85 + Math.random() * 0.3)));
    if (type === 'range') {
      value = Math.min(value, RANGE_CAP[rarity]);
    }
    const fieldName = STAT_TYPE_TO_FIELD[type];
    result[fieldName] = (result[fieldName] || 0) + value;
  }
  return result;
}

// 生成装备词条（含属性攻击词条）
// 【普通】0词条、【高级】0词条、【精致】0词条
// 【传说】0-1词条+1属性攻击、【史诗】1-2词条+1属性攻击、【神话】2词条+1属性攻击
function rollAffixes(rarity: EquipRarity, level: number, _slot: EquipSlot): EquipmentAffix[] {
  const config = RARITY_STAT_CONFIG[rarity];
  const result: EquipmentAffix[] = [];

  const rarityMult = RARITY_MULT[rarity];
  // 平衡调整：提升等级成长系数（0.10→0.13）
  const levelMult = 1 + (level - 1) * 0.13;

  // 1. 普通词条：从AFFIX_POOL中随机选取 affixMin~affixMax 个
  if (config.affixMax > 0) {
    const affixCount = config.affixMin + Math.floor(Math.random() * (config.affixMax - config.affixMin + 1));
    if (affixCount > 0) {
      const pool = [...AFFIX_POOL].sort(() => Math.random() - 0.5);
      const usedTypes = new Set<string>();
      for (const affix of pool) {
        if (result.length >= affixCount) break;
        // 同类型词条不重复
        if (usedTypes.has(affix.type)) continue;
        usedTypes.add(affix.type);
        const baseValue = AFFIX_BASE_VALUES[affix.type] || 6;
        let value = Math.max(1, Math.floor(baseValue * rarityMult * levelMult * (0.8 + Math.random() * 0.4)));
        if (affix.type === 'range') {
          value = Math.min(value, RANGE_CAP[rarity]);
        }
        result.push({ ...affix, value });
      }
    }
  }

  // 2. 属性攻击词条（传说以上强制+1，独立于普通词条数量）
  if (config.hasElementalAttack) {
    const chosen = ELEMENTAL_ATTACK_POOL[Math.floor(Math.random() * ELEMENTAL_ATTACK_POOL.length)];
    const baseValue = AFFIX_BASE_VALUES['elementalAttack'];
    const value = Math.max(1, Math.floor(baseValue * rarityMult * levelMult * (0.8 + Math.random() * 0.4)));
    result.push({ ...chosen, value });
  }

  return result;
}

function rollSetBonus(rarity: EquipRarity): SetBonusId | undefined {
  // 传说/史诗/神话改用品质套装系统（同品质+同等级），不再分配命名套装
  if (rarity === 'legendary' || rarity === 'epic' || rarity === 'mythic') return undefined;
  const setChance = {
    common: 0,
    advanced: 0.05,
    fine: 0.15,
    legendary: 0,
    epic: 0,
    mythic: 0,
  }[rarity];

  if (Math.random() > setChance) return undefined;

  const sets: SetBonusId[] = ['wasteland_ranger', 'tech_soldier', 'mutant_hunter', 'survivor', 'raider', 'wasteland_destroyer'];
  return sets[Math.floor(Math.random() * sets.length)];
}

function rollElement(rarity: EquipRarity): ElementType | undefined {
  const elementChance = {
    common: 0,
    advanced: 0.1,
    fine: 0.2,
    legendary: 0.35,
    epic: 0.5,
    mythic: 0.7,
  }[rarity];

  if (Math.random() > elementChance) return undefined;

  const elements: ElementType[] = ['fire', 'ice', 'lightning', 'poison'];
  return elements[Math.floor(Math.random() * elements.length)];
}

function generateEquipment(name: string, slot: EquipSlot, rarity: EquipRarity, level: number): Equipment {
  // 主属性（基础属性）：按品质数量从6种基础属性中随机生成
  const stats = rollBaseStats(rarity, level);
  const setBonus = rollSetBonus(rarity);
  const affixes = rollAffixes(rarity, level, slot);
  const element = rollElement(rarity);

  const maxDurability = {
    common: 100,
    advanced: 150,
    fine: 200,
    legendary: 300,
    epic: 400,
    mythic: 500,
  }[rarity];

  let finalName = name;
  let finalDescription = `${SLOT_LABELS[slot]} - Lv.${level}`;

  if (setBonus) {
    finalName = SET_EQUIPMENT_NAMES[setBonus][slot];
    finalDescription = `[${SET_BONUSES[setBonus].name}] ${finalDescription}`;
  }

  const icons = SLOT_ICONS[slot];
  const iconIndex = Math.floor(Math.random() * icons.length);

  return {
    id: `${slot}_${rarity}_${level}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: `${RARITY_LABELS[rarity]}${finalName}`,
    slot,
    rarity,
    level,
    icon: icons[iconIndex],
    iconVariant: iconIndex,
    description: finalDescription,
    durability: maxDurability,
    maxDurability,
    setBonus,
    affixes,
    element,
    ...stats,
  } as Equipment;
}

export const EQUIPMENT_TEMPLATES: Record<EquipSlot, { name: string }> = {
  weapon: { name: '步枪' },
  armor: { name: '战术背心' },
  pants: { name: '战斗裤' },
  shoulder: { name: '护肩' },
  belt: { name: '战术腰带' },
  shoes: { name: '军靴' },
  earring: { name: '通讯耳环' },
  ring: { name: '能量戒指' },
  necklace: { name: '生命项链' },
};

export function createEquipment(slot: EquipSlot, rarity: EquipRarity, level: number): Equipment {
  const template = EQUIPMENT_TEMPLATES[slot];
  return generateEquipment(template.name, slot, rarity, level);
}

export const WEAPONS: Equipment[] = [
  createEquipment('weapon', 'common', 1),
];

export const ARMORS: Equipment[] = [
  createEquipment('armor', 'common', 1),
];

export const INITIAL_EQUIPMENT: Equipment[] = [];

export const ITEMS: Record<string, ItemDef> = {
  health_potion: {
    id: 'health_potion',
    name: '普通血瓶',
    type: 'consumable',
    rarity: 'common',
    effect: 'heal',
    value: 10,
    icon: '❤️',
    description: '恢复10%生命值',
    cooldown: 3000,
  },
  health_potion_advanced: {
    id: 'health_potion_advanced',
    name: '高级血瓶',
    type: 'consumable',
    rarity: 'advanced',
    effect: 'heal',
    value: 20,
    icon: '🧡',
    description: '恢复20%生命值',
    cooldown: 6000,
  },
  health_potion_fine: {
    id: 'health_potion_fine',
    name: '精致血瓶',
    type: 'consumable',
    rarity: 'fine',
    effect: 'heal',
    value: 35,
    icon: '💛',
    description: '恢复35%生命值',
    cooldown: 10000,
  },
  health_potion_legendary: {
    id: 'health_potion_legendary',
    name: '传说血瓶',
    type: 'consumable',
    rarity: 'legendary',
    effect: 'heal',
    value: 50,
    icon: '💚',
    description: '恢复50%生命值',
    cooldown: 15000,
  },
  health_potion_epic: {
    id: 'health_potion_epic',
    name: '史诗血包',
    type: 'consumable',
    rarity: 'epic',
    effect: 'heal',
    value: 75,
    icon: '💙',
    description: '恢复75%生命值',
    cooldown: 22000,
  },
  health_potion_mythic: {
    id: 'health_potion_mythic',
    name: '神话血包',
    type: 'consumable',
    rarity: 'mythic',
    effect: 'heal',
    value: 100,
    icon: '💜',
    description: '恢复100%生命值',
    cooldown: 30000,
  },
  regen_potion: {
    id: 'regen_potion',
    name: '再生药水',
    type: 'consumable',
    rarity: 'advanced',
    effect: 'regen',
    value: 5,
    duration: 10000,
    icon: '🔄',
    description: '10秒内每秒恢复5%生命',
    cooldown: 30000,
  },
  regen_potion_mythic: {
    id: 'regen_potion_mythic',
    name: '神话再生',
    type: 'consumable',
    rarity: 'mythic',
    effect: 'regen',
    value: 15,
    duration: 15000,
    icon: '⏳',
    description: '15秒内每秒恢复15%生命',
    cooldown: 45000,
  },
  attack_boost: {
    id: 'attack_boost',
    name: '力量药水',
    type: 'consumable',
    rarity: 'advanced',
    effect: 'attack_boost',
    value: 50,
    duration: 10000,
    icon: '💪',
    description: '10秒内攻击力+50%',
    cooldown: 30000,
  },
  attack_boost_mythic: {
    id: 'attack_boost_mythic',
    name: '神话力量',
    type: 'consumable',
    rarity: 'mythic',
    effect: 'attack_boost',
    value: 100,
    duration: 15000,
    icon: '⚡',
    description: '15秒内攻击力+100%',
    cooldown: 45000,
  },
  speed_boost: {
    id: 'speed_boost',
    name: '敏捷药水',
    type: 'consumable',
    rarity: 'advanced',
    effect: 'speed_boost',
    value: 50,
    duration: 8000,
    icon: '👟',
    description: '8秒内攻速+50%',
    cooldown: 24000,
  },
  bomb: {
    id: 'bomb',
    name: '手榴弹',
    type: 'consumable',
    rarity: 'fine',
    effect: 'bomb',
    value: 200,
    icon: '💣',
    description: '对所有敌人造成200伤害',
    cooldown: 3000,
  },
  bomb_mythic: {
    id: 'bomb_mythic',
    name: '核弹',
    type: 'consumable',
    rarity: 'mythic',
    effect: 'bomb',
    value: 1000,
    icon: '☢️',
    description: '对所有敌人造成1000伤害',
    cooldown: 10000,
  },
  magnet: {
    id: 'magnet',
    name: '磁力装置',
    type: 'consumable',
    rarity: 'advanced',
    effect: 'magnet',
    duration: 5000,
    icon: '🧲',
    description: '5秒内自动拾取掉落物',
    cooldown: 15000,
  },
  poison_bomb: {
    id: 'poison_bomb',
    name: '毒雾弹',
    type: 'consumable',
    rarity: 'fine',
    effect: 'poison',
    value: 10,
    duration: 5000,
    icon: '☠️',
    description: '敌人中毒5秒，每秒10伤害',
    cooldown: 15000,
  },
  freeze_bomb: {
    id: 'freeze_bomb',
    name: '冰冻弹',
    type: 'consumable',
    rarity: 'legendary',
    effect: 'freeze',
    duration: 3000,
    icon: '❄️',
    description: '冻结敌人3秒',
    cooldown: 10000,
  },
  fire_bomb: {
    id: 'fire_bomb',
    name: '燃烧弹',
    type: 'consumable',
    rarity: 'legendary',
    effect: 'burn',
    value: 20,
    duration: 5000,
    icon: '🔥',
    description: '敌人燃烧5秒，每秒20伤害',
    cooldown: 15000,
  },
  invincibility: {
    id: 'invincibility',
    name: '无敌药',
    type: 'consumable',
    rarity: 'epic',
    effect: 'invincible',
    duration: 5000,
    icon: '⭐',
    description: '5秒内无敌',
    cooldown: 15000,
  },
  invincibility_mythic: {
    id: 'invincibility_mythic',
    name: '神话无敌',
    type: 'consumable',
    rarity: 'mythic',
    effect: 'invincible',
    duration: 10000,
    icon: '🌟',
    description: '10秒内无敌',
    cooldown: 30000,
  },

  // BALANCE v12: Optimized new items
  stun_bomb: {
    id: 'stun_bomb',
    name: '眩晕弹',
    type: 'consumable',
    rarity: 'fine',
    effect: 'stun',
    duration: 3000,
    icon: '💫',
    description: '使所有敌人眩晕2秒',
    cooldown: 6000,
  },
  lightning_bolt: {
    id: 'lightning_bolt',
    name: '闪电箭',
    type: 'consumable',
    rarity: 'legendary',
    effect: 'lightning',
    value: 150,
    duration: 3000,
    icon: '⚡',
    description: '对所有敌人造成100伤害并感电3秒',
    cooldown: 10000,
  },
  curse_scroll: {
    id: 'curse_scroll',
    name: '诅咒卷轴',
    type: 'consumable',
    rarity: 'epic',
    effect: 'curse',
    value: 25,
    duration: 8000,
    icon: '📜',
    description: '敌人受到伤害+20%，持续8秒',
    cooldown: 24000,
  },
  potion_attack: {
    id: 'potion_attack',
    name: '力量技能药水',
    type: 'consumable',
    rarity: 'fine',
    effect: 'skill_potion',
    potionType: 'attack',
    icon: '💪',
    description: '攻击+等级值，持续一回合',
    cooldown: 0,
  },
  potion_speed: {
    id: 'potion_speed',
    name: '敏捷技能药水',
    type: 'consumable',
    rarity: 'fine',
    effect: 'skill_potion',
    potionType: 'attackSpeed',
    icon: '👟',
    description: '攻速+等级值%，持续一回合',
    cooldown: 0,
  },
  potion_health: {
    id: 'potion_health',
    name: '生命技能药水',
    type: 'consumable',
    rarity: 'fine',
    effect: 'skill_potion',
    potionType: 'maxHealth',
    icon: '❤️',
    description: '生命+等级值*20，持续一回合',
    cooldown: 0,
  },
  potion_crit: {
    id: 'potion_crit',
    name: '暴击技能药水',
    type: 'consumable',
    rarity: 'fine',
    effect: 'skill_potion',
    potionType: 'critRate',
    icon: '💥',
    description: '暴击+等级值%，持续一回合',
    cooldown: 0,
  },
  potion_defense: {
    id: 'potion_defense',
    name: '防御技能药水',
    type: 'consumable',
    rarity: 'fine',
    effect: 'skill_potion',
    potionType: 'defense',
    icon: '🛡️',
    description: '防御+等级值，持续一回合',
    cooldown: 0,
  },
  potion_range: {
    id: 'potion_range',
    name: '射程技能药水',
    type: 'consumable',
    rarity: 'legendary',
    effect: 'skill_potion',
    potionType: 'range',
    icon: '🦅',
    description: '射程+等级值*5，持续一回合',
    cooldown: 0,
  },
  potion_laser: {
    id: 'potion_laser',
    name: '激光炮药水',
    type: 'consumable',
    rarity: 'legendary',
    effect: 'skill_potion',
    potionType: 'laser',
    icon: '⚡',
    description: '获得激光炮效果，持续一回合',
    cooldown: 0,
  },
  potion_flash: {
    id: 'potion_flash',
    name: '闪光药水',
    type: 'consumable',
    rarity: 'epic',
    effect: 'skill_potion',
    potionType: 'flash',
    icon: '🌟',
    description: '使用后立即眩晕所有敌人5秒',
    cooldown: 0,
  },
  potion_sweep: {
    id: 'potion_sweep',
    name: '横扫药水',
    type: 'consumable',
    rarity: 'epic',
    effect: 'skill_potion',
    potionType: 'sweep',
    icon: '🌀',
    description: '获得战术横扫效果，持续一回合',
    cooldown: 0,
  },
  potion_clone: {
    id: 'potion_clone',
    name: '分身药水',
    type: 'consumable',
    rarity: 'mythic',
    effect: 'skill_potion',
    potionType: 'clone',
    icon: '👥',
    description: '召唤1个分身，持续一回合',
    cooldown: 0,
  },
};

export { RARITY_BG, RARITY_BG_DARK, SLOT_ICONS };

// 根据药水类型和等级计算效果数值
export function getPotionEffectValue(potionType: string, level: number): number {
  switch (potionType) {
    case 'attack': return level;
    case 'attackSpeed': return level;
    case 'maxHealth': return level * 20;
    case 'critRate': return level;
    case 'defense': return level;
    case 'range': return level * 5;
    default: return 0;
  }
}

// 根据药水类型和等级生成描述文本
export function getPotionEffectText(potionType: string, level: number): string {
  switch (potionType) {
    case 'attack': return `攻击+${level}，持续一回合`;
    case 'attackSpeed': return `攻速+${level}%，持续一回合`;
    case 'maxHealth': return `生命+${level * 20}，持续一回合`;
    case 'critRate': return `暴击+${level}%，持续一回合`;
    case 'defense': return `防御+${level}，持续一回合`;
    case 'range': return `射程+${level * 5}，持续一回合`;
    case 'laser': return '获得激光炮效果，持续一回合';
    case 'flash': return '使用后立即眩晕所有敌人5秒';
    case 'sweep': return '获得战术横扫效果，持续一回合';
    case 'clone': return '召唤1个分身，持续一回合';
    default: return '';
  }
}

export function getItemDef(itemId: string): any {
  if (ITEMS[itemId]) return ITEMS[itemId];
  const skillPotionMatch = itemId.match(/^(potion_\w+)_lv(\d+)$/);
  if (skillPotionMatch) {
    const baseId = skillPotionMatch[1];
    const level = parseInt(skillPotionMatch[2], 10);
    const baseItem = ITEMS[baseId];
    if (baseItem && baseItem.effect === 'skill_potion') {
      return {
        ...baseItem,
        id: itemId,
        name: `${baseItem.name} - Lv.${level}`,
        description: getPotionEffectText(baseItem.potionType, level),
        potionLevel: level,
      };
    }
  }
  return null;
}

export function getRarityName(rarity: EquipRarity | ItemRarity): string {
  return RARITY_LABELS[rarity];
}

export function getEquipmentBonus(equipment: Equipment[]): Record<string, number> {
  const bonus: Record<string, number> = {
    attack: 0,
    maxHp: 0,
    attackSpeed: 0,
    critRate: 0,
  };

  equipment.forEach((equip) => {
    if (equip.attack) bonus.attack += equip.attack;
    if (equip.health) bonus.maxHp += equip.health;
    if (equip.attackSpeed) bonus.attackSpeed += equip.attackSpeed;
    if (equip.critRate) bonus.critRate += equip.critRate;
  });

  return bonus;
}
