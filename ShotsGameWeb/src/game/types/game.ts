export type EnemyType = 'normal' | 'elite' | 'boss';
export type EquipSlot = 'weapon' | 'armor' | 'pants' | 'shoulder' | 'belt' | 'shoes' | 'earring' | 'ring' | 'necklace';
export type EquipRarity = 'common' | 'advanced' | 'fine' | 'legendary' | 'epic' | 'mythic';
export type ItemRarity = 'common' | 'advanced' | 'fine' | 'legendary' | 'epic' | 'mythic';
export type ElementType = 'fire' | 'ice' | 'lightning' | 'poison' | 'physical';
export type WeatherType = 'clear' | 'rain' | 'sandstorm' | 'thunderstorm' | 'snow' | 'acid_rain' | 'radiation' | 'fog' | 'heat_wave';
export type SetBonusId = 'wasteland_ranger' | 'tech_soldier' | 'mutant_hunter' | 'survivor' | 'raider' | 'wasteland_destroyer';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Buff {
  id: string;
  type: string;
  duration: number;
  remainingTime: number;
  value: number;
  icon: string;
  name: string;
  description: string;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  attack: number;
  attackSpeed: number;
  manualAttackSpeed: number;
  range: number;
  isManualShooting: boolean;
  manualShootTimer: number;
  autoShootTimer: number;
  score: number;
  skillPoints: number;
  gold: number;
  dodgeCooldown: number;
  isDodging: boolean;
  dodgeTimer: number;
  invincibleTimer: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  damage: number;
  active: boolean;
  element?: ElementType;
  trailColor?: string;
  isCrit?: boolean;
}

export interface EnemyDebuff {
  type: string;
  damage: number;
  duration: number;
  startTime: number;
  element?: ElementType;
  stacks?: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  speed: number;
  baseSpeed: number;
  damage: number;
  exp: number;
  dropRate: number;
  color: string;
  active: boolean;
  hitFlash: number;
  stunTimer: number;
  slowTimer: number;
  slowAmount: number;
  debuffs: EnemyDebuff[];
  weakPoints: EnemyWeakPoint[];
  element: ElementType | null;
  isElite: boolean;
  isBoss: boolean;
  bossPhase: number;
  bossMaxPhase: number;
  bossSkillCooldown: number;
  weakPoint?: string;
  animFrame: number;
  // 与玩家统一的战斗力属性
  attack: number;
  attackSpeed: number;
  critRate: number;
  critDamage: number;
  pierceCount: number;
  lifestealPercent: number;
  range: number;
  defense: number;
  burnChance: number;
  poisonChance: number;
  freezeChance: number;
  lightningChance: number;
}

export interface EnemyWeakPoint {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  effect: 'stun' | 'slow' | 'extra_damage' | 'bleed';
  broken: boolean;
  health: number;
  maxHealth: number;
}

export interface DropItem {
  id: number;
  type: 'exp' | 'health' | 'coin' | 'item' | 'equipment';
  itemId?: string;
  equipmentId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  active: boolean;
  magnetSpeed: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  value: number;
  life: number;
  maxLife: number;
  color: string;
  active: boolean;
}

export interface EquipmentAffix {
  id: string;
  name: string;
  value: number;
  type: 'attack' | 'defense' | 'health' | 'critRate' | 'critDamage' | 'attackSpeed' | 'range' | 'elementalDamage' | 'elementalAttack' | 'pierce' | 'resistance' | 'lifesteal' | 'statusFreeze' | 'statusPoison' | 'statusBurn' | 'statusLightning';
  element?: ElementType;
}

export interface SocketedGem {
  gemId: string;     // gem_attack_common 等
  type: 'attack' | 'health' | 'defense' | 'critRate' | 'resistance';
  rarity: 'common' | 'advanced';
  value: number;     // 1 或 2
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: EquipRarity;
  level: number;
  attack?: number;
  attackSpeed?: number;
  range?: number;
  health?: number;
  defense?: number;
  critRate?: number;
  critDamage?: number;
  pierce?: number;
  icon: string;
  iconVariant: number;
  description: string;
  setBonus?: SetBonusId;
  durability?: number;
  maxDurability?: number;
  affixes?: EquipmentAffix[];
  element?: ElementType;
  elementalDamage?: number;
  // 宝石镶嵌系统：已镶嵌的宝石列表（最多15颗）
  socketedGems?: SocketedGem[];
  // 强化等级
  enhanceLevel?: number;
  // 附魔系统：附魔效果（百分比加成到对应属性）
  enchantment?: Enchantment;
}

export interface Enchantment {
  stat: 'attack' | 'health' | 'defense' | 'critRate' | 'resistance';
  rarity: ItemRarity;
  percent: number;
}

export interface SetBonus {
  id: SetBonusId;
  name: string;
  description: string;
  pieces: number;
  icon: string;
  effects: { pieces: number; effect: string; value: number; stat: string }[];
}

export type QualityTier = 'legendary' | 'epic' | 'mythic';

export interface QualitySetEffect {
  pieces: number;
  name: string;
  description: string;
  stat: string;
  value: number;
}

export interface QualitySetData {
  tier: QualityTier;
  name: string;
  icon: string;
  effects: QualitySetEffect[];
}

export interface ItemStack {
  itemId: string;
  count: number;
}

export interface ItemDef {
  id: string;
  name: string;
  type: 'consumable' | 'material' | 'enhancement' | 'quest';
  rarity: ItemRarity;
  effect?: string;
  value?: number;
  duration?: number;
  icon: string;
  description: string;
  cooldown: number;
  potionType?: string;
  /** 道具分类：battle=战斗（仅战斗中可用），normal=普通（仅主界面可用） */
  category?: 'battle' | 'normal';
}

export interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  /** 按等级的冷却时间（毫秒），索引0=1级；若存在则 useSkill 使用 cooldowns[level-1] */
  cooldowns?: number[];
  damage?: number;
  duration?: number;
  level: number;
  maxLevel: number;
  cost: number;
  requiredLevel: number;
  requiredSkills?: string[];
}

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  currentWave: number;
  waveEnemiesRemaining: number;
  waveEnemiesTotal: number;
  waveEnemiesSpawned: number;
  waveSpawnTimer: number;
  waveInterval: number;
  betweenWaves: boolean;
  betweenWaveTimer: number;
  showWaveNotice: boolean;
  waveNoticeTimer: number;
  bossActive: boolean;
  bossHealth: number;
  bossMaxHealth: number;
  bossName: string;
  // Boss 增益/减益状态显示（血条下方一行）
  bossBuffs: { type: string; name: string; icon: string; color: string; remaining: number; duration: number }[];
  bossDebuffs: { type: string; name: string; icon: string; color: string; remaining: number; duration: number }[];
  eliteBossPending: boolean;
  eliteBossSpawnTimer: number;
  showEliteBossNotice: boolean;
  eliteBossNoticeTimer: number;
  eliteBossNoticeType: 'elite' | 'boss' | 'purgatory' | null;
}

export interface Talent {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  effect: string;
  value: number;
  stat: string;
}

export interface WeatherState {
  type: WeatherType;
  duration: number;
  intensity: number;
  transitionTimer: number;
}

export interface CodexEntry {
  id: string;
  type: 'enemy' | 'equipment' | 'item';
  name: string;
  discovered: boolean;
  kills?: number;
  obtained?: number;
  description: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  claimed: boolean;
  category: 'system' | 'level';
  progress: number;
  target: number;
  reward: string;
  rewardValue: number;
}

export interface ShopItem {
  id: string;
  type: 'item' | 'equipment' | 'refill';
  itemId?: string;
  equipment?: Equipment;
  price: number;
  sold: boolean;
}

// 装备商人：可购买的装备条目
export interface MerchantEquipment {
  id: string;
  equipment: Equipment;
  price: number;
  sold: boolean;
}

// 装备设计图：购买后需收集材料+金币制作
export interface Blueprint {
  id: string;
  slot: EquipSlot;
  rarity: 'legendary' | 'epic';
  level: number;
  name: string;
  icon: string;
  // 制作所需材料（itemId → 数量）
  materials: { itemId: string; name: string; icon: string; count: number; have: number }[];
  // 制作所需金币
  goldCost: number;
  // 购买设计图本身的价格
  price: number;
  sold: boolean;
  crafted: boolean;
}

export interface OfflineReward {
  gold: number;
  exp: number;
  items: { itemId: string; count: number }[];
  duration: number;
}

export interface ActiveSkill {
  id: string;
  name: string;
  icon: string;
  cooldown: number;
  currentCooldown: number;
  description: string;
  key: string;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  playerStartX: number;
  playerStartY: number;
  groundY: number;
  baseEnemyCount: number;
  maxEnemyCount: number;
  eliteWaveInterval: number;
  bossWaveInterval: number;
  spawnZoneWidth: number;
}

// 邮件附件：仓库满时无法拾取的掉落物
export interface MailAttachments {
  equipment?: Equipment[];
  items?: ItemStack[];
  gold?: number;
}

// 邮件
export interface Mail {
  id: string;
  type: 'system' | 'battle';
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  claimed: boolean;
  attachments?: MailAttachments;
}
