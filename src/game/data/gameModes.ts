export type GameMode = 'stage' | 'worldboss' | 'purgatory' | 'daily' | 'material' | 'mirror' | 'guard' | 'homedefense';

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  fullDescription: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockLevel: number;
  dailyLimit?: number;
  hasDifficulty?: boolean;
}

export const GAME_MODE_CONFIGS: Record<GameMode, GameModeConfig> = {
  stage: {
    id: 'stage',
    name: '关卡挑战',
    description: '挑战无尽波次',
    fullDescription: '经典闯关模式，挑战一波又一波的敌人，击败BOSS获取丰厚奖励。波次越高，敌人越强，奖励越好。',
    icon: 'stage',
    color: '#00F5D4',
    unlocked: true,
    unlockLevel: 1,
  },
  worldboss: {
    id: 'worldboss',
    name: '世界BOSS',
    description: '集结讨伐强敌',
    fullDescription: '挑战超巨型世界BOSS，限时5分钟内击败。BOSS血量超亿，拥有多阶段形态，血量越低越狂暴。击败后获得稀有装备和大量材料。',
    icon: 'worldboss',
    color: '#FF4757',
    unlocked: true,
    unlockLevel: 10,
    dailyLimit: 3,
    hasDifficulty: true,
  },
  purgatory: {
    id: 'purgatory',
    name: '炼狱',
    description: '极限生存挑战',
    fullDescription: '炼狱模式，只有1条命！敌人伤害翻倍，速度更快，看看你能撑到第几波。每隔5波会触发特殊debuff效果。挑战你的极限！',
    icon: 'purgatory',
    color: '#FF8C42',
    unlocked: true,
    unlockLevel: 15,
  },
  daily: {
    id: 'daily',
    name: '日常挑战',
    description: '每日限定任务',
    fullDescription: '每天刷新3个不同的挑战任务，完成后获得丰厚奖励。任务类型包括：限时击杀、只用手动射击、特定天气下通关等。',
    icon: 'daily',
    color: '#FFD93D',
    unlocked: true,
    unlockLevel: 5,
    dailyLimit: 3,
  },
  material: {
    id: 'material',
    name: '材料副本',
    description: '收集稀有材料',
    fullDescription: '专门用于收集各种强化、宝石、附魔材料的副本。选择不同的副本类型获取对应材料，难度越高掉落越多。每天有5次挑战机会。',
    icon: 'material',
    color: '#9B59B6',
    unlocked: true,
    unlockLevel: 8,
    dailyLimit: 5,
    hasDifficulty: true,
  },
  mirror: {
    id: 'mirror',
    name: '镜像挑战',
    description: '挑战自我镜像',
    fullDescription: '挑战和你装备、属性完全一样的镜像AI。1v1公平对决，只有技巧更高的人才能获胜。击败镜像可获得稀有洗练材料。',
    icon: 'mirror',
    color: '#3498DB',
    unlocked: true,
    unlockLevel: 20,
    dailyLimit: 5,
    hasDifficulty: true,
  },
  guard: {
    id: 'guard',
    name: '守卫战',
    description: '坚守阵地',
    fullDescription: '守卫战模式：保护你的基地不被敌人攻破！基地位于左侧，拥有独立血量。敌人从右侧源源不断涌来，你需要在它们到达基地前将其消灭。',
    icon: 'guard',
    color: '#00F5D4',
    unlocked: true,
    unlockLevel: 12,
  },
  homedefense: {
    id: 'homedefense',
    name: '家园守卫',
    description: '守护最后家园',
    fullDescription: '家园守卫模式：守护人类最后的家园！敌人从多个方向进攻，你可以使用资源放置防御塔协助防守。坚持更多波次，获取家园建设材料。',
    icon: 'homedefense',
    color: '#2ECC71',
    unlocked: true,
    unlockLevel: 25,
  },
};

export type DailyTaskType = 'timed_kill' | 'manual_only' | 'weather_survive' | 'elite_hunter' | 'no_damage';

export interface DailyTask {
  id: string;
  type: DailyTaskType;
  name: string;
  description: string;
  target: number;
  reward: {
    gold?: number;
    exp?: number;
    items?: Array<{ itemId: string; count: number }>;
  };
}

export type MaterialDungeonType = 'enhance' | 'gem' | 'enchant' | 'exp' | 'gold';

export interface MaterialDungeonConfig {
  id: MaterialDungeonType;
  name: string;
  description: string;
  drops: Array<{ itemId: string; chance: number; minCount: number; maxCount: number }>;
}

export const MATERIAL_DUNGEONS: Record<MaterialDungeonType, MaterialDungeonConfig> = {
  enhance: {
    id: 'enhance',
    name: '强化石副本',
    description: '掉落各种强化材料',
    drops: [
      { itemId: 'enhance_scroll_plus1', chance: 0.8, minCount: 1, maxCount: 3 },
      { itemId: 'enhance_scroll_plus2', chance: 0.4, minCount: 1, maxCount: 2 },
      { itemId: 'enhance_normal_booster', chance: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'enhance_ancient_booster', chance: 0.1, minCount: 1, maxCount: 1 },
    ],
  },
  gem: {
    id: 'gem',
    name: '宝石矿洞',
    description: '掉落各种宝石',
    drops: [
      { itemId: 'gem_attack_common', chance: 0.9, minCount: 2, maxCount: 5 },
      { itemId: 'gem_health_common', chance: 0.9, minCount: 2, maxCount: 5 },
      { itemId: 'gem_defense_common', chance: 0.8, minCount: 2, maxCount: 4 },
      { itemId: 'gem_critRate_common', chance: 0.7, minCount: 1, maxCount: 3 },
      { itemId: 'gem_resistance_common', chance: 0.7, minCount: 1, maxCount: 3 },
      { itemId: 'gem_attack_advanced', chance: 0.3, minCount: 1, maxCount: 2 },
      { itemId: 'gem_health_advanced', chance: 0.3, minCount: 1, maxCount: 2 },
    ],
  },
  enchant: {
    id: 'enchant',
    name: '附魔秘境',
    description: '掉落附魔书',
    drops: [
      { itemId: 'enchant_attack_common', chance: 0.6, minCount: 1, maxCount: 2 },
      { itemId: 'enchant_health_common', chance: 0.6, minCount: 1, maxCount: 2 },
      { itemId: 'enchant_defense_common', chance: 0.5, minCount: 1, maxCount: 2 },
      { itemId: 'enchant_attack_advanced', chance: 0.25, minCount: 1, maxCount: 1 },
      { itemId: 'enchant_crit_advanced', chance: 0.2, minCount: 1, maxCount: 1 },
    ],
  },
  exp: {
    id: 'exp',
    name: '经验秘境',
    description: '获得大量经验',
    drops: [
      { itemId: 'exp_book_small', chance: 1, minCount: 3, maxCount: 8 },
      { itemId: 'exp_book_medium', chance: 0.5, minCount: 1, maxCount: 3 },
      { itemId: 'exp_book_large', chance: 0.2, minCount: 1, maxCount: 1 },
    ],
  },
  gold: {
    id: 'gold',
    name: '金币矿洞',
    description: '获得大量金币',
    drops: [
      { itemId: 'gold_bag_small', chance: 1, minCount: 2, maxCount: 5 },
      { itemId: 'gold_bag_medium', chance: 0.5, minCount: 1, maxCount: 3 },
      { itemId: 'gold_bag_large', chance: 0.2, minCount: 1, maxCount: 1 },
    ],
  },
};

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'nightmare';

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, { name: string; enemyMult: number; rewardMult: number; color: string }> = {
  easy: { name: '简单', enemyMult: 0.6, rewardMult: 0.7, color: '#2ECC71' },
  normal: { name: '普通', enemyMult: 1.0, rewardMult: 1.0, color: '#3498DB' },
  hard: { name: '困难', enemyMult: 1.8, rewardMult: 1.8, color: '#E74C3C' },
  nightmare: { name: '噩梦', enemyMult: 3.0, rewardMult: 3.0, color: '#9B59B6' },
};
