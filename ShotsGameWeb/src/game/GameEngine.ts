import type {
  Player,
  Bullet,
  Enemy,
  DropItem,
  Particle,
  DamageNumber,
  GameState,
  GameConfig,
  EnemyType,
  Equipment,
  ItemStack,
  Skill,
  EquipSlot,
  EquipRarity,
  Buff,
  WeatherType,
  WeatherState,
  Talent,
  ActiveSkill,
  ShopItem,
  SetBonus,
  SetBonusId,
  ElementType,
  CodexEntry,
  Achievement,
  ItemDef,
  SocketedGem,
  Mail,
  MailAttachments,
  Blueprint,
  MerchantEquipment,
} from './types/game';
import {
  ObjectPool,
  createBullet,
  resetBullet,
  createEnemy,
  createDropItem,
  createParticle,
  createDamageNumber,
  checkCollision,
  clamp,
  randomRange,
  randomInt,
  getNextId,
} from './utils';
import { ENEMY_CONFIGS, NORMAL_ENEMY_TYPES, ELITE_ENEMY_TYPES, BOSS_ENEMY_TYPES, PURGATORY_BOSS_TYPES, PURGATORY_CHAINS_CONFIG, PURGATORY_BOSS_CONFIGS, PURGATORY_BOSS_SPEED, MATERIAL_BOSS_CONFIG } from './data/enemies';
import { WEAPONS, ARMORS, ITEMS, SKILLS, INITIAL_EQUIPMENT, createEquipment, getQualitySetGroups, getItemDef, SLOT_LABELS, RARITY_LABELS, getRarityDropChance, getRarityDropWeights, getMerchantTiers, generateMerchantEquipmentSet, generateBlueprintSet, getStatThreshold, getEquipmentBaseStats, BASE_STAT_LABELS, rerollEquipmentStats, transformEquipmentStats, getBlueprintDefFromItemId } from './data/equipment';
import { getGemDef, MAX_GEM_SOCKETS, getSocketSuccessRate, isFailResetToZero, randomGemId } from './data/gems';
import {
  ENHANCE_ITEMS,
  getEnhanceSuccessRate,
  getEnhanceFailResult,
  getEnhanceGoldCost,
  getEnhanceAttackBonus,
  MAX_ENHANCE_LEVEL,
} from './data/enhanceItems';
import type { EnhanceItemId } from './data/enhanceItems';
import {
  ENCHANT_ITEMS,
  ENCHANT_ITEM_ORDER,
  getEnchantItemDef,
  getUpgradeEnchantId,
  ENCHANT_SYNTH_COST,
  INITIAL_ENCHANT_INVENTORY,
} from './data/enchantItems';
import type { EnchantItemId, EnchantStat } from './data/enchantItems';
import type { GameMode, DifficultyLevel, MaterialDungeonType } from './data/gameModes';
import { GAME_MODE_CONFIGS, MATERIAL_DUNGEONS, DIFFICULTY_CONFIG } from './data/gameModes';
import { STORAGE_CAPACITY } from './data/storageCapacity';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  config: GameConfig;

  player: Player;
  gameState: GameState;

  // 游戏模式相关
  gameMode: GameMode = 'stage';
  modeDifficulty: DifficultyLevel = 'normal';
  modeDungeonType: MaterialDungeonType = 'enhance';
  modeTimeLimit: number = 0;
  modeTimeRemaining: number = 0;
  modeBaseHealth: number = 0;
  modeBaseDamage: number = 0;
  modeVictory: boolean = false;
  modeFailed: boolean = false;
  modeScore: number = 0;
  modeData: Record<string, any> = {};

  // 炼狱模式每日挑战上限
  readonly PURGATORY_DAILY_LIMIT: number = 5;

  // 材料副本每日挑战上限
  readonly MATERIAL_DAILY_LIMIT: number = 5;

  // 守卫战相关
  guardBaseHealth: number = 100;
  guardBaseMaxHealth: number = 100;

  // 家园守卫相关
  homeBaseHealth: number = 500;
  homeBaseMaxHealth: number = 500;
  homeTowers: Array<{ x: number; y: number; type: string; damage: number; cooldown: number; lastShot: number }> = [];

  bulletPool: ObjectPool<Bullet>;
  enemyPool: ObjectPool<Enemy>;
  dropPool: ObjectPool<DropItem>;
  particlePool: ObjectPool<Particle>;
  damageNumberPool: ObjectPool<DamageNumber>;

  equipment: Equipment[];
  equipmentStorage: Equipment[];
  inventory: ItemStack[];
  // 宝石背包：与 inventory 平行存储
  gemInventory: ItemStack[];
  // 强化道具背包
  enhanceItemInventory: ItemStack[];
  // 附魔书背包
  enchantItemInventory: ItemStack[];
  skills: Skill[];

  private animationId: number | null = null;
  private lastTime: number = 0;
  private stars: { x: number; y: number; size: number; speed: number }[] = [];

  onStateChange?: (state: GameState, player: Player) => void;
  onWaveChange?: (wave: number) => void;
  onBossSpawn?: (name: string, health: number, maxHealth: number) => void;
  onBossDefeat?: () => void;
  onInventoryChange?: (inventory: ItemStack[]) => void;
  onGemInventoryChange?: (gems: ItemStack[]) => void;
  onEnhanceItemInventoryChange?: (items: ItemStack[]) => void;
  onEnchantItemInventoryChange?: (items: ItemStack[]) => void;
  onSkillsChange?: (skills: Skill[]) => void;
  onEquipmentChange?: (equipment: Equipment[]) => void;
  onEquipmentStorageChange?: (storage: Equipment[]) => void;
  onPlayerChange?: (player: Player) => void;
  onMailChange?: (mails: Mail[]) => void;

  private manualShootCooldown: number = 0;
  private autoShootTimer: number = 0;

  // 手动瞄准准星位置（世界坐标）
  private aimX: number = 0;
  private aimY: number = 0;
  private hasAim: boolean = false;
  private aimExpireTimer: number = 0; // 准星存活计时（ms），到0自动消失

  private shieldActive: boolean = false;
  private multishotActive: boolean = false;
  private multishotDuration: number = 0;
  private laserActive: boolean = false;
  private laserDuration: number = 0;
  private laserDamageTimer: number = 0;
  private laserDamageReady: boolean = false;
  private cloneLasersActive: boolean[] = [];
  private cloneLaserDurations: number[] = [];
  private cloneLaserDamageTimers: number[] = [];
  private cloneLaserDamageReady: boolean[] = [];
  private flashLightningActive: boolean = false;
  private flashLightningTimer: number = 0;

  // 连发队列
  private burstRemaining: number = 0;
  private burstTimer: number = 0;
  private burstAngles: number[] = [];
  // 分身连发队列
  private cloneBurstRemaining: number[] = [];
  private cloneBurstTimer: number[] = [];
  private cloneBurstAngles: number[][] = [];
  // 电击弹内置CD（玩家+分身）
  private shockCooldown: number = 0;
  private cloneShockCooldowns: number[] = [];
  private sweepActive: boolean = false;
  private sweepDuration: number = 0;

  private screenShake: number = 0;
  // 终极核弹冲击波环特效
  private nukeShockwaves: { x: number; y: number; radius: number; maxRadius: number; alpha: number; color: string }[] = [];
  private sprites: Record<string, HTMLImageElement | null> = {};
  // 战士海报图（已抠图，透明背景），主界面同款
  private warriorHeroKnockout: HTMLCanvasElement | null = null;
  // 怪物贴图：4 种体型，已 knockout 透明背景
  private monsterKnockouts: {
    tall: HTMLCanvasElement | null;       // 瘦高：丧尸/掠夺者/感染者/刺客/远程射手
    stout: HTMLCanvasElement | null;      // 矮胖：变异体/巨型蜘蛛
    heavy: HTMLCanvasElement | null;      // 重装：暴徒/重装兵/机甲兵/狙击机器人
    boss: HTMLCanvasElement | null;       // 巨型：高达/异形/战争坦克/各BOSS
  } = { tall: null, stout: null, heavy: null, boss: null };

  private spriteLoaded: Promise<void> | null = null;

  private animFrame: number = 0;
  private muzzleFlashTimer: number = 0;
  // React 状态同步节流：避免每帧触发重渲染
  private stateSyncTimer: number = 0;
  private buffsSignature: string = '';
  // 碰撞检测复用缓冲区
  private _nearbyBuf: Enemy[] = [];
  private _nearbySeen: Set<Enemy> = new Set();
  // 性能优化：复用 bulletBox 对象，避免每子弹分配
  private _bulletBox: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };
  // 性能优化：getNearbyEnemies 用版本号标志位代替 Set，避免 Set.has/add 开销
  private _nearbyFlag: number = 0;
  // 技能等级缓存 Map（避免每帧 skills.find 线性查找）
  private skillLevels: Map<string, number> = new Map();
  private skillsDirty: boolean = true;
  // setTimeout 句柄跟踪（stop 时统一清理，避免组件卸载后回调仍执行）
  private pendingTimers: number[] = [];

  private trackTimer(handle: number): number {
    this.pendingTimers.push(handle);
    return handle;
  }

  private clearTrackedTimers(): void {
    for (const id of this.pendingTimers) {
      clearTimeout(id);
    }
    this.pendingTimers.length = 0;
  }

  private droppedEquipmentMap: Map<string, Equipment> = new Map();

  // 邮件系统：仓库满时无法拾取的掉落物，按波次收集，波次结束后发送
  private pendingMailDrops: MailAttachments = {};
  private mails: Mail[] = [];

  private parallaxLayers: { offset: number; speed: number; buildings: { x: number; w: number; h: number }[] }[] = [];
  private weather: WeatherState = { type: 'clear', duration: 0, intensity: 0, transitionTimer: 0 };
  private weatherParticles: { x: number; y: number; vx: number; vy: number; size: number; life: number }[] = [];

  private buffs: Buff[] = [];

  // 技能药水效果（持续本回合，下回合清除）
  private wavePotionEffects: Record<string, number> = {};
  private wavePotionClone: { active: boolean; level: number } = { active: false, level: 0 };
  // 定时技能药水（laser/sweep/clone）：按 duration 衰减，到时清除对应状态
  // 与 wavePotionEffects 区分：属性类药水整回合持续，特效/主动药水按实际技能时长
  private timedPotionEffects: { type: string; remaining: number; duration: number; icon: string; name: string; itemId: string }[] = [];

  // 需求 #8：玩家debuff系统（精英/BOSS对玩家施加）
  private playerDebuffs: { type: 'burn' | 'poison' | 'attackSpeedDown' | 'bulletSpeedDown' | 'rangeDown' | 'stun'; remaining: number; duration: number; value: number; tickTimer: number }[] = [];

  // BALANCE v13 FINAL: Enhanced debuff effects system with perfectly balanced parameters
  // Each status effect has unique visual signature, damage profile, crowd control intensity, and particle behavior
  private debuffEffects: Record<string, { color: string; particleColor: string; damage: number; speedMultiplier: number; icon: string; name: string; description: string; damageMultiplier?: number; glowColor?: string; tickInterval?: number; particleCount?: number; particleSize?: number; fadeSpeed?: number; visualEffect?: string; attackSpeedMultiplier?: number; armorShred?: number; stunDuration?: number }> = {
    burn: {
      color: '#FF9900',
      particleColor: '#FF5500',
      damage: 8,
      speedMultiplier: 0.92,
      icon: '🔥',
      name: '灼烧',
      description: '持续受到烈焰伤害，攻击力略降',
      glowColor: '#FF8800',
      tickInterval: 400,
      particleCount: 6,
      particleSize: 6,
      fadeSpeed: 0.028,
      visualEffect: 'fire',
      attackSpeedMultiplier: 0.92,
    },
    poison: {
      color: '#00FF66',
      particleColor: '#00CC44',
      damage: 7,
      speedMultiplier: 0.7,
      icon: '☠️',
      name: '中毒',
      description: '持续受到剧毒伤害，移动速度大幅降低，防御削减',
      glowColor: '#00FF88',
      tickInterval: 550,
      particleCount: 5,
      particleSize: 5,
      fadeSpeed: 0.022,
      visualEffect: 'gas',
      armorShred: 10,
    },
    freeze: {
      color: '#00CCFF',
      particleColor: '#0088FF',
      damage: 2,
      speedMultiplier: 0.05,
      icon: '❄️',
      name: '冰冻',
      description: '被极寒冻结，完全无法移动攻击',
      glowColor: '#88EEFF',
      tickInterval: 900,
      particleCount: 8,
      particleSize: 7,
      fadeSpeed: 0.009,
      visualEffect: 'ice',
      stunDuration: 0,
    },
    lightning: {
      color: '#FFFF00',
      particleColor: '#FFFF88',
      damage: 10,
      speedMultiplier: 0.6,
      icon: '⚡',
      name: '感电',
      description: '持续受到雷电伤害，移动降低，攻击速度锐减，受到的伤害+20%',
      glowColor: '#FFFFAA',
      tickInterval: 450,
      particleCount: 5,
      particleSize: 6,
      fadeSpeed: 0.032,
      visualEffect: 'spark',
      attackSpeedMultiplier: 0.55,
      damageMultiplier: 1.2,
    },
    slow: {
      color: '#8888FF',
      particleColor: '#AAAAFF',
      damage: 0,
      speedMultiplier: 0.35,
      icon: '🐢',
      name: '减速',
      description: '移动速度大幅削减',
      glowColor: '#BBBBFF',
      tickInterval: 1000,
      particleCount: 3,
      particleSize: 5,
      fadeSpeed: 0.012,
      visualEffect: 'fog',
    },
    curse: {
      color: '#CC33CC',
      particleColor: '#DD55DD',
      damage: 5,
      speedMultiplier: 0.88,
      icon: '📜',
      name: '诅咒',
      description: '受到伤害+40%，持续暗影伤害',
      damageMultiplier: 1.4,
      glowColor: '#EE66EE',
      tickInterval: 700,
      particleCount: 4,
      particleSize: 6,
      fadeSpeed: 0.018,
      visualEffect: 'dark',
    },
    stun: {
      color: '#FFD700',
      particleColor: '#FFEA00',
      damage: 0,
      speedMultiplier: 0,
      icon: '💫',
      name: '眩晕',
      description: '完全无法移动和攻击',
      glowColor: '#FFFF88',
      tickInterval: 1000,
      particleCount: 6,
      particleSize: 7,
      fadeSpeed: 0.022,
      visualEffect: 'stars',
    },
  };

  // Boss 增益 buff 定义（type → 名称/图标/颜色）
  private bossBuffDefs: Record<string, { name: string; icon: string; color: string }> = {
    enrage_1: { name: '狂暴I', icon: 'rage', color: '#FF6B35' },
    enrage_2: { name: '狂暴II', icon: 'rage', color: '#FF2200' },
    enrage_3: { name: '狂暴III', icon: 'rage', color: '#FF0044' },
    charge: { name: '冲锋', icon: 'charge', color: '#FFD700' },
    summon: { name: '召唤', icon: 'summon', color: '#9B59B6' },
  };
  // Boss 减益 debuff 显示定义（沿用 debuffEffects 的子集）
  // bossDebuffs 数组中的元素：{ type, name, icon, color, remaining, duration }
  private bossBuffsList: { type: string; name: string; icon: string; color: string; remaining: number; duration: number; startAt: number }[] = [];
  private bossDebuffsList: { type: string; name: string; icon: string; color: string; remaining: number; duration: number; startAt: number }[] = [];
  private talents: Talent[] = [];
  private activeSkills: ActiveSkill[] = [];
  private showTalentSelection: boolean = false;
  private talentChoices: Talent[] = [];
  private itemCooldowns: Record<string, { remaining: number; duration: number; icon: string; name: string; itemId: string }> = {};

  private shopItems: ShopItem[] = [];
  private shopOpen: boolean = false;

  // 装备商人：按等级档位缓存商品（关闭弹窗时清空）
  private merchantEquipmentCache: Map<number, MerchantEquipment[]> = new Map();
  private merchantBlueprintCache: Map<number, Blueprint[]> = new Map();

  private activeSetBonuses: SetBonusId[] = [];

  private codexEntries: CodexEntry[] = [];
  private achievements: Achievement[] = [];
  private totalKills: number = 0;
  private waveKillCount: number = 0;
  private eliteBossSpawnedThisWave: boolean = false;
  private highestWave: number = 0;

  // 7日签到数据
  private checkInDays: number[] = [];   // 本周已签到的天数（0-6）
  private checkInWeekKey: string = '';   // 当前周的标识（用于判断是否需要重置）
  // 在线奖励数据
  private onlineMinutes: number = 0;     // 本周期累计在线分钟数
  private onlineRewardClaimed: number = 0; // 已领取次数（0-4）
  private onlineTimer: number = 0;       // 分钟计时器
  // 在线奖励后台独立计时器（不依赖游戏循环，主界面也计时）
  private onlineRewardInterval: ReturnType<typeof setInterval> | null = null;
  // 抽奖机（跑马灯水果机）系统
  private lotteryCoins: number = 0;              // 抽奖机硬币（每日发放，直接作为押注筹码）
  private lotteryCoinsDate: string = '';         // 上次发放日期（YYYY-MM-DD），用于每日重置
  private lotteryBets: Record<string, number> = {}; // 各水果种类押注 {categoryId: 硬币数}
  private lotteryConsecutiveLogin: number = 0;   // 连续登录天数
  private lotteryLastLoginDate: string = '';     // 上次登录日期（用于连续登录判定）
  private lotteryTournamentBest: number = 0;     // 锦标赛最高分（单局最高中奖）
  private lotteryLastWin: number = 0;            // 上一次中奖金额（锦标赛用）
  private lotteryHistory: number[] = [];         // 最近若干次跑马灯停下位置（用于特殊奖励判定）
  private lotteryFreeSpins: number = 0;          // 免费旋转次数（送灯触发）
  private lotteryLuckyMissCounter: number = 0;   // Lucky 未命中累积次数（用于保底递增）

  debugConfig: {
    baseStats: { attack: number; attackSpeed: number; manualAttackSpeed: number; maxHealth: number; range: number; level: number };
    powerWeights: { attack: number; attackSpeed: number; maxHealth: number; critRate: number; critDamage: number; physicalPenetration: number; lifestealPercent: number; range: number; defense: number; burnChance: number; poisonChance: number; freezeChance: number; lightningChance: number };
    enemyPowerWeights: { attack: number; attackSpeed: number; maxHealth: number; critRate: number; critDamage: number; physicalPenetration: number; lifestealPercent: number; range: number; defense: number; burnChance: number; poisonChance: number; freezeChance: number; lightningChance: number };
  };

  onWeatherChange?: (weather: WeatherState) => void;
  onBuffsChange?: (buffs: Buff[]) => void;
  onTalentSelection?: (choices: Talent[]) => void;
  onShopOpen?: (items: ShopItem[]) => void;
  onCodexChange?: (entries: CodexEntry[]) => void;
  onAchievementUnlock?: (achievement: Achievement) => void;
  onAchievementsChange?: (achievements: Achievement[]) => void;
  // 高品质掉落（fine/legendary/epic/mythic 装备或物品）通知 UI 显示气泡
  onRareDrop?: (info: { id: number; rarity: string; name: string; icon: string; kind: 'equipment' | 'item' }) => void;
  private rareDropIdCounter: number = 0;
  // 游戏 UI 悬浮提示（道具使用、升级等）
  onToast?: (info: { icon: string; text: string; color: string }) => void;

  /** 触发 UI 悬浮提示 */
  private showToast(icon: string, text: string, color: string = '#00F5D4'): void {
    if (this.onToast) {
      this.onToast({ icon, text, color });
    }
  }

  private addPlayerBuff(type: string, duration: number, value: number): void {
    const buffDefs: Record<string, { name: string; icon: string; description: string }> = {
      regen: { name: '生命恢复', icon: '💚', description: '持续恢复生命值' },
      attack: { name: '攻击强化', icon: '⚔', description: '提升攻击力' },
      attack_speed: { name: '攻速提升', icon: '💨', description: '提升攻击速度' },
      invincible: { name: '无敌', icon: '🛡', description: '免疫所有伤害' },
      shield: { name: '护盾', icon: '🛡', description: '吸收伤害' },
      speed_boost: { name: '移速提升', icon: '💨', description: '提升移动速度' },
      damage_boost: { name: '伤害提升', icon: '⚔', description: '提升伤害' },
      poison: { name: '中毒', icon: '☠', description: '持续受到毒素伤害' },
      burn: { name: '燃烧', icon: '🔥', description: '持续受到火焰伤害' },
      wet: { name: '潮湿', icon: '💧', description: '被水浸湿，易导电' },
      shock: { name: '感电', icon: '⚡', description: '受到雷电伤害' },
      freeze: { name: '冰冻', icon: '❄', description: '移动速度降低' },
    };
    const def = buffDefs[type] || { name: type, icon: '?', description: '' };
    this.buffs.push({
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      duration,
      remainingTime: duration,
      value,
      icon: def.icon,
      name: def.name,
      description: def.description,
    });
    if (this.onBuffsChange) {
      this.onBuffsChange([...this.buffs]);
    }
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    // 战场固定300px高度，不按比例，保证每个设备一致
    const ARENA_HEIGHT = 300;
    const groundY = canvas.height - ARENA_HEIGHT;
    this.config = {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      playerStartX: 14,
      playerStartY: groundY + (ARENA_HEIGHT * 0.5) - 16,
      groundY,
      baseEnemyCount: 11,
      maxEnemyCount: 30,
      eliteWaveInterval: 5,
      bossWaveInterval: 10,
      spawnZoneWidth: 11,
    };

    // 调试配置：基础属性 + 战斗力权重（必须在 createPlayer 之前）
    this.debugConfig = {
      baseStats: {
        attack: 8,
        attackSpeed: 800,
        manualAttackSpeed: 1000,
        maxHealth: 100,
        // 需求 #4：人物最大射程为战场95%宽度（约为395），初始给基础值，calculatePlayerStats会clamp
        range: 200,
        level: 1,
      },
      powerWeights: {
        attack: 10,
        attackSpeed: 15,
        maxHealth: 0.5,
        critRate: 8,
        critDamage: 2,
        physicalPenetration: 30,
        lifestealPercent: 20,
        range: 0.3,
        defense: 5,
        burnChance: 3,
        poisonChance: 3,
        freezeChance: 3,
        lightningChance: 4,
      },
      enemyPowerWeights: {
        attack: 10,
        attackSpeed: 15,
        maxHealth: 0.5,
        critRate: 8,
        critDamage: 2,
        physicalPenetration: 30,
        lifestealPercent: 20,
        range: 0.3,
        defense: 5,
        burnChance: 3,
        poisonChance: 3,
        freezeChance: 3,
        lightningChance: 4,
      },
    };

    this.player = this.createPlayer();
    this.gameState = this.createGameState();

    this.bulletPool = new ObjectPool<Bullet>(createBullet, resetBullet, 150);
    this.enemyPool = new ObjectPool<Enemy>(createEnemy, this.resetEnemy.bind(this), 80);
    this.dropPool = new ObjectPool<DropItem>(createDropItem, this.resetDropItem.bind(this), 50);
    this.particlePool = new ObjectPool<Particle>(createParticle, this.resetParticle.bind(this), 150);
    this.damageNumberPool = new ObjectPool<DamageNumber>(createDamageNumber, this.resetDamageNumber.bind(this), 60);

    this.equipment = INITIAL_EQUIPMENT;
    this.equipmentStorage = [] as Equipment[];
    this.inventory = [
      { itemId: 'health_potion', count: 5 },
      { itemId: 'attack_boost', count: 3 },
      { itemId: 'speed_boost', count: 3 },
      { itemId: 'bomb', count: 2 },
      { itemId: 'lottery_pot', count: 10 },
    ];
    // 初始宝石背包：每种宝石各 99 颗，便于测试
    this.gemInventory = [
      { itemId: 'gem_attack_common', count: 99 },
      { itemId: 'gem_attack_advanced', count: 99 },
      { itemId: 'gem_health_common', count: 99 },
      { itemId: 'gem_health_advanced', count: 99 },
      { itemId: 'gem_defense_common', count: 99 },
      { itemId: 'gem_defense_advanced', count: 99 },
      { itemId: 'gem_critRate_common', count: 99 },
      { itemId: 'gem_critRate_advanced', count: 99 },
      { itemId: 'gem_resistance_common', count: 99 },
      { itemId: 'gem_resistance_advanced', count: 99 },
    ];
    // 初始强化道具背包：每种 99 个，便于测试
    this.enhanceItemInventory = [
      { itemId: 'enhance_scroll_plus1', count: 99 },
      { itemId: 'enhance_scroll_plus2', count: 99 },
      { itemId: 'enhance_normal_booster', count: 99 },
      { itemId: 'enhance_ancient_booster', count: 99 },
    ];
    // 初始附魔书背包：普通、高级、精致品质各属性 50 本
    this.enchantItemInventory = INITIAL_ENCHANT_INVENTORY.map(x => ({ ...x }));
    this.skills = SKILLS.map(s => ({ ...s, currentCooldown: 0 }));
    // 1级默认自带一级【冰冻弹】
    const fxFreezeInit = this.skills.find(s => s.id === 'fx_freeze_1');
    if (fxFreezeInit && fxFreezeInit.level < 1) fxFreezeInit.level = 1;
    this.activeSkills = this.initActiveSkills();

    this.initStars();
    this.initParallaxLayers();
    this.initWeather();
    this.initSprites();
    this.initCodex();
    this.initAchievements();
    this.calculatePlayerStats();
    
    this.loadGame();
    this.initStarterMail();

    // 启动在线奖励后台独立计时器（无论战斗/主界面都计时）
    this.onlineRewardInterval = setInterval(() => {
      this.updateOnlineTime(1000);
    }, 1000);
  }

  /** 销毁引擎：清理后台计时器，防止内存泄漏 */
  destroy(): void {
    if (this.onlineRewardInterval) {
      clearInterval(this.onlineRewardInterval);
      this.onlineRewardInterval = null;
    }
    this.stop();
  }

  /** 新手大礼包：首次进入游戏时发送系统邮件 */
  private initStarterMail(): void {
    const starterMailId = 'mail_starter_pack';
    if (this.mails.some(m => m.id === starterMailId)) return;
    this.mails.unshift({
      id: starterMailId,
      type: 'system',
      title: '新手大礼包',
      body: '欢迎来到末日突围！这是为您准备的新手大礼包，包含以下物资：\n\n💰 金币 x2000\n🧪 生命药水 x10\n⚔️ 攻击药剂 x5\n💣 炸弹 x3\n\n祝您在废土世界中生存愉快！',
      timestamp: Date.now(),
      read: false,
      claimed: false,
      attachments: {
        gold: 2000,
        items: [
          { itemId: 'health_potion', count: 10 },
          { itemId: 'attack_boost', count: 5 },
          { itemId: 'bomb', count: 3 },
        ],
      },
    });
  }

  private createPlayer(): Player {
    const bs = this.debugConfig.baseStats;
    return {
      x: this.config.playerStartX,
      y: this.config.playerStartY,
      width: 14,
      height: 32,
      health: bs.maxHealth,
      maxHealth: bs.maxHealth,
      level: bs.level,
      exp: 0,
      // BALANCE v13 FINAL: Perfectly balanced level growth curve
      // Lv1→2: ~100exp, Lv50: ~52k, Lv100: ~380k, Lv200: ~3.8M, Lv300: ~13M
      expToNextLevel: Math.floor(80 + Math.pow(bs.level, 2.05) * 3.5 + bs.level * 6),
      attack: bs.attack,
      attackSpeed: bs.attackSpeed,
      manualAttackSpeed: bs.manualAttackSpeed,
      range: bs.range,
      isManualShooting: false,
      manualShootTimer: 0,
      autoShootTimer: 0,
      score: 0,
      skillPoints: 0,
      gold: 0,
      dodgeCooldown: 0,
      isDodging: false,
      dodgeTimer: 0,
      invincibleTimer: 0,
    };
  }

  private createGameState(): GameState {
    return {
      isRunning: false,
      isPaused: false,
      isGameOver: false,
      currentWave: 0,
      waveEnemiesRemaining: 0,
      waveEnemiesTotal: 0,
      waveEnemiesSpawned: 0,
      waveSpawnTimer: 0,
      waveInterval: 800,
      betweenWaves: true,
      betweenWaveTimer: 3000,
      showWaveNotice: false,
      waveNoticeTimer: 0,
      bossActive: false,
      bossHealth: 0,
      bossMaxHealth: 0,
      bossName: '',
      bossBuffs: [],
      bossDebuffs: [],
      eliteBossPending: false,
      eliteBossSpawnTimer: 0,
      showEliteBossNotice: false,
      eliteBossNoticeTimer: 0,
      eliteBossNoticeType: null,
    };
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.config.canvasWidth,
        y: Math.random() * this.config.canvasHeight,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 20 + 10,
      });
    }
  }

  private initParallaxLayers(): void {
    const { canvasWidth, groundY } = this.config;
    this.parallaxLayers = [
      {
        offset: 0,
        speed: 5,
        buildings: [
          { x: 50, w: 60, h: 80 }, { x: 150, w: 40, h: 60 },
          { x: 230, w: 70, h: 100 }, { x: 350, w: 50, h: 70 },
          { x: 450, w: 80, h: 110 }, { x: 580, w: 45, h: 65 },
          { x: 680, w: 65, h: 90 }, { x: 800, w: 55, h: 90 },
          { x: 900, w: 70, h: 95 }, { x: 1020, w: 50, h: 70 },
        ],
      },
      {
        offset: 0,
        speed: 15,
        buildings: [
          { x: 80, w: 90, h: 50 }, { x: 200, w: 70, h: 40 },
          { x: 350, w: 100, h: 60 }, { x: 520, w: 80, h: 45 },
          { x: 680, w: 95, h: 55 }, { x: 850, w: 90, h: 50 },
          { x: 1000, w: 85, h: 48 },
        ],
      },
      {
        offset: 0,
        speed: 30,
        buildings: [
          { x: 100, w: 150, h: 35 }, { x: 300, w: 100, h: 30 },
          { x: 500, w: 160, h: 40 }, { x: 720, w: 110, h: 32 },
          { x: 920, w: 105, h: 45 },
        ],
      },
    ];
  }

  private initSprites(): void {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
    };

    // 抠图处理：低亮度像素 → 完全透明，边缘羽化平滑过渡
    // 与主界面 useKnockoutImage 完全一致
    // 贴图文件已在素材层面完成背景透明化与边缘羽化，此处直接绘制到 canvas 即可
    const processKnockout = (img: HTMLImageElement): HTMLCanvasElement => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const cctx = canvas.getContext('2d');
      if (!cctx) return canvas;
      cctx.drawImage(img, 0, 0);
      return canvas;
    };

    this.spriteLoaded = Promise.all([
      loadImage('/assets/player.png').then(img => { this.sprites.player = img; }),
      loadImage('/assets/player_frames/player_idle_sheet.png').then(img => { this.sprites.playerIdleSheet = img; }),
      loadImage('/assets/player_frames/player_shoot_sheet.png').then(img => { this.sprites.playerShootSheet = img; }),
      loadImage('/assets/monster_orc.png').then(img => { this.sprites.monsterOrc = img; }),
      loadImage('/assets/monster_orc_0.png').then(img => { this.sprites.monsterOrc0 = img; }),
      loadImage('/assets/monster_orc_1.png').then(img => { this.sprites.monsterOrc1 = img; }),
      loadImage('/assets/monster_orc_2.png').then(img => { this.sprites.monsterOrc2 = img; }),
      loadImage('/assets/monster_orc_3.png').then(img => { this.sprites.monsterOrc3 = img; }),
      loadImage('/assets/monster_slime.png').then(img => { this.sprites.monsterSlime = img; }),
      loadImage('/assets/background.png').then(img => { this.sprites.background = img; }),
      // 赛博城市远景贴图：与角色同思路，用 drawImage + 全息滤镜渲染
      loadImage('/images/cyber-city-bg.jpg').then(img => { this.sprites.cityBg = img; }).catch(err => {
        console.warn('Failed to load cyber-city-bg.jpg:', err);
      }),
      // 战士海报：与主界面同款，抠图后存储为 canvas（透明背景）
      loadImage('/images/warrior-hero.png').then(img => {
        this.warriorHeroKnockout = processKnockout(img);
      }).catch(err => {
        console.warn('Failed to load warrior-hero.png:', err);
      }),
      // 怪物贴图：4 种体型，抠图后存储，不同怪物用 hue-rotate/brightness 改色区分
      loadImage('/images/monster-humanoid-tall.png').then(img => {
        this.monsterKnockouts.tall = processKnockout(img);
      }).catch(err => {
        console.warn('Failed to load monster-humanoid-tall.png:', err);
      }),
      loadImage('/images/monster-stout.png').then(img => {
        this.monsterKnockouts.stout = processKnockout(img);
      }).catch(err => {
        console.warn('Failed to load monster-stout.png:', err);
      }),
      loadImage('/images/monster-heavy.png').then(img => {
        this.monsterKnockouts.heavy = processKnockout(img);
      }).catch(err => {
        console.warn('Failed to load monster-heavy.png:', err);
      }),
      loadImage('/images/monster-boss.png').then(img => {
        this.monsterKnockouts.boss = processKnockout(img);
      }).catch(err => {
        console.warn('Failed to load monster-boss.png:', err);
      }),
      // 终极核弹贴图：JPG需去除白色+深色背景，存为 canvas（透明背景）
      loadImage('/images/fx-nuke.jpg').then(img => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const cctx = canvas.getContext('2d');
        if (cctx) {
          cctx.drawImage(img, 0, 0);
          const data = cctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < data.data.length; i += 4) {
            const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
            const minRGB = Math.min(r, g, b);
            const maxRGB = Math.max(r, g, b);
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            const saturation = maxRGB === 0 ? 0 : (maxRGB - minRGB) / maxRGB;
            // 白色背景：所有RGB通道最小值>230
            if (minRGB > 230) {
              data.data[i + 3] = 0;
            } else if (luminance < 115 && saturation < 0.45) {
              // 深色背景：亮度<45%（HSL L<0.45）且饱和度<0.45
              data.data[i + 3] = 0;
            } else if (minRGB > 200) {
              // 近白边缘羽化
              data.data[i + 3] = Math.floor((minRGB - 200) * 255 / 30);
            } else if (luminance < 140 && saturation < 0.55) {
              // 近暗边缘羽化
              data.data[i + 3] = Math.floor((luminance - 115) * 255 / 25);
            }
          }
          cctx.putImageData(data, 0, 0);
        }
        this.sprites.nuke = canvas as any;
      }).catch(err => {
        console.warn('Failed to load fx-nuke.jpg:', err);
      }),
    ]).then(() => {}).catch(err => {
      console.warn('Failed to load sprites:', err);
    });
  }

  private initWeather(): void {
    this.weather = {
      type: 'clear',
      duration: 30000,
      intensity: 0,
      transitionTimer: 0,
    };
  }

  private initActiveSkills(): ActiveSkill[] {
    return [
      {
        id: 'dodge',
        name: '翻滚闪避',
        icon: '🌀',
        cooldown: 5000,
        currentCooldown: 0,
        description: '快速翻滚闪避，短暂无敌',
        key: 'Q',
      },
      {
        id: 'grenade',
        name: '手雷投掷',
        icon: '💣',
        cooldown: 8000,
        currentCooldown: 0,
        description: '投掷手雷造成范围爆炸伤害',
        key: 'E',
      },
      {
        id: 'drone',
        name: '攻击无人机',
        icon: '🛸',
        cooldown: 20000,
        currentCooldown: 0,
        description: '召唤无人机协助攻击10秒',
        key: 'R',
      },
    ];
  }

  private initCodex(): void {
    const entries: CodexEntry[] = [];

    for (const [id, config] of Object.entries(ENEMY_CONFIGS)) {
      entries.push({
        id: `enemy_${id}`,
        type: 'enemy',
        name: config.name,
        discovered: false,
        kills: 0,
        description: this.getEnemyDescription(id),
      });
    }

    entries.push(
      { id: 'equip_common', type: 'equipment', name: '普通装备', discovered: false, obtained: 0, description: '最基础的装备品质' },
      { id: 'equip_advanced', type: 'equipment', name: '进阶装备', discovered: false, obtained: 0, description: '略有提升的装备品质' },
      { id: 'equip_fine', type: 'equipment', name: '精良装备', discovered: false, obtained: 0, description: '品质不错的装备' },
      { id: 'equip_legendary', type: 'equipment', name: '传说装备', discovered: false, obtained: 0, description: '稀有的传说级装备' },
      { id: 'equip_epic', type: 'equipment', name: '史诗装备', discovered: false, obtained: 0, description: '极其稀有的史诗装备' },
      { id: 'equip_mythic', type: 'equipment', name: '神话装备', discovered: false, obtained: 0, description: '传说中的神话级装备' },
    );

    entries.push(
      { id: 'item_health_potion', type: 'item', name: '生命药水', discovered: false, obtained: 0, description: '恢复生命值' },
      { id: 'item_attack_boost', type: 'item', name: '攻击药剂', discovered: false, obtained: 0, description: '临时提升攻击力' },
      { id: 'item_speed_boost', type: 'item', name: '速度药剂', discovered: false, obtained: 0, description: '临时提升移动速度' },
      { id: 'item_bomb', type: 'item', name: '炸弹', discovered: false, obtained: 0, description: '造成范围伤害' },
      { id: 'item_stun_bomb', type: 'item', name: '眩晕弹', discovered: false, obtained: 0, description: '使所有敌人眩晕' },
      { id: 'item_lightning_bolt', type: 'item', name: '闪电箭', discovered: false, obtained: 0, description: '造成雷电伤害并感电' },
      { id: 'item_curse_scroll', type: 'item', name: '诅咒卷轴', discovered: false, obtained: 0, description: '敌人受到伤害增加' },
    );

    this.codexEntries = entries;
  }

  private getEnemyDescription(id: string): string {
    const descs: Record<string, string> = {
      mutant: '废土中常见的变异生物，行动迟缓但数量众多',
      raider: '掠夺者团伙成员，擅长快速突袭',
      infected: '被未知病毒感染的人类，具有较强的攻击性',
      brute: '身材魁梧的暴徒，破坏力惊人',
      heavy_trooper: '装备重型护甲的精英士兵，防御极高',
      mech_soldier: '穿戴外骨骼机甲的精英战士，攻守兼备',
      war_tank: '战争机器改造的巨型坦克，拥有毁灭性火力',
      alien_hive: '来自异星的神秘母巢，能不断孵化外星生物',
    };
    return descs[id] || '未知生物';
  }

  private initAchievements(): void {
    this.achievements = [
      // ===== 系统成就 =====
      { id: 'first_blood', name: '初次击杀', description: '击杀第一个敌人', icon: '⚔️', unlocked: false, claimed: false, category: 'system', progress: 0, target: 1, reward: '金币 +100', rewardValue: 100 },
      { id: 'kill_10', name: '小试牛刀', description: '累计击杀10个敌人', icon: '🗡️', unlocked: false, claimed: false, category: 'system', progress: 0, target: 10, reward: '金币 +300', rewardValue: 300 },
      { id: 'kill_100', name: '百人斩', description: '累计击杀100个敌人', icon: '💀', unlocked: false, claimed: false, category: 'system', progress: 0, target: 100, reward: '金币 +1000', rewardValue: 1000 },
      { id: 'kill_500', name: '杀戮机器', description: '累计击杀500个敌人', icon: '☠️', unlocked: false, claimed: false, category: 'system', progress: 0, target: 500, reward: '金币 +3000', rewardValue: 3000 },
      { id: 'wave_5', name: '幸存者', description: '存活到第5波', icon: '🏆', unlocked: false, claimed: false, category: 'system', progress: 0, target: 5, reward: '金币 +500', rewardValue: 500 },
      { id: 'wave_10', name: '坚韧不拔', description: '存活到第10波', icon: '🏅', unlocked: false, claimed: false, category: 'system', progress: 0, target: 10, reward: '金币 +2000', rewardValue: 2000 },
      { id: 'wave_20', name: '废土传说', description: '存活到第20波', icon: '👑', unlocked: false, claimed: false, category: 'system', progress: 0, target: 20, reward: '金币 +5000', rewardValue: 5000 },
      { id: 'boss_slayer', name: 'Boss杀手', description: '击败第一个Boss', icon: '🐉', unlocked: false, claimed: false, category: 'system', progress: 0, target: 1, reward: '金币 +1500', rewardValue: 1500 },
      { id: 'elite_hunter', name: '精英猎手', description: '击杀10个精英怪', icon: '🎯', unlocked: false, claimed: false, category: 'system', progress: 0, target: 10, reward: '金币 +800', rewardValue: 800 },
      { id: 'single_wave_50', name: '清场专家', description: '单波次击杀50个敌人', icon: '💥', unlocked: false, claimed: false, category: 'system', progress: 0, target: 50, reward: '金币 +600', rewardValue: 600 },
      { id: 'equip_legendary_get', name: '传说降临', description: '获得第一件传说装备', icon: '✨', unlocked: false, claimed: false, category: 'system', progress: 0, target: 1, reward: '金币 +500', rewardValue: 500 },
      // ===== 等级成就（10-200级，每10级） =====
      { id: 'level_10', name: '初露锋芒', description: '角色达到10级', icon: '⭐', unlocked: false, claimed: false, category: 'level', progress: 0, target: 10, reward: '技能点 +3', rewardValue: 3 },
      { id: 'level_20', name: '渐入佳境', description: '角色达到20级', icon: '🌟', unlocked: false, claimed: false, category: 'level', progress: 0, target: 20, reward: '技能点 +5', rewardValue: 5 },
      { id: 'level_30', name: '小有所成', description: '角色达到30级', icon: '✨', unlocked: false, claimed: false, category: 'level', progress: 0, target: 30, reward: '技能点 +8', rewardValue: 8 },
      { id: 'level_40', name: '勇往直前', description: '角色达到40级', icon: '💫', unlocked: false, claimed: false, category: 'level', progress: 0, target: 40, reward: '技能点 +10', rewardValue: 10 },
      { id: 'level_50', name: '百战不殆', description: '角色达到50级', icon: '🌠', unlocked: false, claimed: false, category: 'level', progress: 0, target: 50, reward: '技能点 +12', rewardValue: 12 },
      { id: 'level_60', name: '锋芒毕露', description: '角色达到60级', icon: '🔥', unlocked: false, claimed: false, category: 'level', progress: 0, target: 60, reward: '技能点 +15', rewardValue: 15 },
      { id: 'level_70', name: '独当一面', description: '角色达到70级', icon: '⚡', unlocked: false, claimed: false, category: 'level', progress: 0, target: 70, reward: '技能点 +18', rewardValue: 18 },
      { id: 'level_80', name: '所向披靡', description: '角色达到80级', icon: '💥', unlocked: false, claimed: false, category: 'level', progress: 0, target: 80, reward: '技能点 +20', rewardValue: 20 },
      { id: 'level_90', name: '登峰造极', description: '角色达到90级', icon: '🏔️', unlocked: false, claimed: false, category: 'level', progress: 0, target: 90, reward: '技能点 +25', rewardValue: 25 },
      { id: 'level_100', name: '百级达成', description: '角色达到100级', icon: '💯', unlocked: false, claimed: false, category: 'level', progress: 0, target: 100, reward: '技能点 +30', rewardValue: 30 },
      { id: 'level_110', name: '超凡入圣', description: '角色达到110级', icon: '🔮', unlocked: false, claimed: false, category: 'level', progress: 0, target: 110, reward: '技能点 +35', rewardValue: 35 },
      { id: 'level_120', name: '天外飞仙', description: '角色达到120级', icon: '🌸', unlocked: false, claimed: false, category: 'level', progress: 0, target: 120, reward: '技能点 +40', rewardValue: 40 },
      { id: 'level_130', name: '一念通天', description: '角色达到130级', icon: '🌌', unlocked: false, claimed: false, category: 'level', progress: 0, target: 130, reward: '技能点 +45', rewardValue: 45 },
      { id: 'level_140', name: '万法归一', description: '角色达到140级', icon: '🌀', unlocked: false, claimed: false, category: 'level', progress: 0, target: 140, reward: '技能点 +50', rewardValue: 50 },
      { id: 'level_150', name: '掌控命运', description: '角色达到150级', icon: '🗝️', unlocked: false, claimed: false, category: 'level', progress: 0, target: 150, reward: '技能点 +60', rewardValue: 60 },
      { id: 'level_160', name: '心之所向', description: '角色达到160级', icon: '❤️', unlocked: false, claimed: false, category: 'level', progress: 0, target: 160, reward: '技能点 +70', rewardValue: 70 },
      { id: 'level_170', name: '无所不知', description: '角色达到170级', icon: '🧠', unlocked: false, claimed: false, category: 'level', progress: 0, target: 170, reward: '技能点 +80', rewardValue: 80 },
      { id: 'level_180', name: '洞悉万物', description: '角色达到180级', icon: '👁️', unlocked: false, claimed: false, category: 'level', progress: 0, target: 180, reward: '技能点 +90', rewardValue: 90 },
      { id: 'level_190', name: '至高境界', description: '角色达到190级', icon: '👑', unlocked: false, claimed: false, category: 'level', progress: 0, target: 190, reward: '技能点 +100', rewardValue: 100 },
      { id: 'level_200', name: '传说诞生', description: '角色达到200级', icon: '🏆', unlocked: false, claimed: false, category: 'level', progress: 0, target: 200, reward: '技能点 +150', rewardValue: 150 },
    ];
  }

  private discoverEnemy(enemyName: string): void {
    const entry = this.codexEntries.find(e => e.name === enemyName && e.type === 'enemy');
    if (entry && !entry.discovered) {
      entry.discovered = true;
      this.notifyCodexChange();
    }
  }

  private addEnemyKill(enemyName: string): void {
    const entry = this.codexEntries.find(e => e.name === enemyName && e.type === 'enemy');
    if (entry) {
      entry.kills = (entry.kills || 0) + 1;
      this.notifyCodexChange();
    }
  }

  private addEquipmentObtained(rarity: EquipRarity): void {
    const entry = this.codexEntries.find(e => e.id === `equip_${rarity}`);
    if (entry) {
      entry.discovered = true;
      entry.obtained = (entry.obtained || 0) + 1;
      this.notifyCodexChange();
    }
  }

  private addItemObtained(itemId: string): void {
    const entry = this.codexEntries.find(e => e.id === `item_${itemId}`);
    if (entry) {
      entry.discovered = true;
      entry.obtained = (entry.obtained || 0) + 1;
      this.notifyCodexChange();
    }
  }

  private notifyCodexChange(): void {
    if (this.onCodexChange) {
      this.onCodexChange([...this.codexEntries]);
    }
  }

  private checkAchievements(): void {
    for (const ach of this.achievements) {
      // 已解锁的成就只更新进度展示（不再自动触发解锁逻辑）
      if (ach.unlocked) continue;

      let progress = 0;
      switch (ach.id) {
        case 'first_blood':
        case 'kill_10':
        case 'kill_100':
        case 'kill_500':
          progress = this.totalKills;
          break;
        case 'wave_5':
        case 'wave_10':
        case 'wave_20':
          progress = this.highestWave;
          break;
        case 'boss_slayer':
          progress = this.codexEntries.find(e => e.id === 'enemy_war_tank' || e.id === 'enemy_alien_hive')?.kills || 0;
          break;
        case 'elite_hunter':
          progress = (this.codexEntries.find(e => e.id === 'enemy_heavy_trooper')?.kills || 0) +
                    (this.codexEntries.find(e => e.id === 'enemy_mech_soldier')?.kills || 0);
          break;
        case 'single_wave_50':
          progress = Math.max(progress, this.waveKillCount);
          break;
        case 'equip_legendary_get':
          progress = this.codexEntries.find(e => e.id === 'equip_legendary')?.obtained || 0;
          break;
        default:
          // 等级成就：level_10 ~ level_200，统一用 player.level
          if (ach.id.startsWith('level_')) {
            progress = this.player.level;
          }
          break;
      }

      ach.progress = Math.min(progress, ach.target);

      if (ach.progress >= ach.target && !ach.unlocked) {
        this.unlockAchievement(ach);
      }
    }

    if (this.onAchievementsChange) {
      this.onAchievementsChange([...this.achievements]);
    }
  }

  private unlockAchievement(achievement: Achievement): void {
    // 仅解锁，不自动发放奖励（需玩家在成就界面手动领取）
    achievement.unlocked = true;
    if (this.onAchievementUnlock) {
      this.onAchievementUnlock({ ...achievement });
    }
  }

  /** 领取成就奖励：只有 unlocked 且未 claimed 时才能领取 */
  claimAchievement(achievementId: string): { success: boolean; reason?: string } {
    const ach = this.achievements.find(a => a.id === achievementId);
    if (!ach) return { success: false, reason: '成就不存在' };
    if (!ach.unlocked) return { success: false, reason: '未达成' };
    if (ach.claimed) return { success: false, reason: '已领取' };

    ach.claimed = true;
    if (ach.category === 'level') {
      this.player.skillPoints += ach.rewardValue;
    } else {
      this.player.gold += ach.rewardValue;
    }

    if (this.onAchievementsChange) {
      this.onAchievementsChange([...this.achievements]);
    }
    if (this.onPlayerChange) {
      this.onPlayerChange({ ...this.player });
    }
    return { success: true };
  }

  private resetEnemy(enemy: Enemy, type: string, wave: number): void {
    // 清除全屏闪光持续伤害标记（防止对象池复用残留）
    (enemy as any).flashBurnUntil = 0;
    (enemy as any).flashBurnAccum = 0;
    (enemy as any).flashBurnTick = 0;
    if (type === 'sandbag') {
      enemy.id = getNextId();
      enemy.type = 'normal';
      enemy.name = '沙袋';
      enemy.width = 44;
      enemy.height = 63;
      enemy.maxHealth = 999999999;
      enemy.health = 999999999;
      enemy.baseSpeed = 0;
      enemy.speed = 0;
      enemy.damage = 0;
      enemy.exp = 0;
      enemy.dropRate = 0;
      enemy.color = '#8B7355';
      enemy.element = null;
      enemy.isElite = false;
      enemy.isBoss = false;
      enemy.x = 0;
      enemy.y = 0;
      enemy.active = true;
      enemy.hitFlash = 0;
      enemy.stunTimer = 0;
      enemy.slowTimer = 0;
      enemy.slowAmount = 0;
      enemy.bossPhase = 0;
      enemy.bossSkillCooldown = 0;
      enemy.animFrame = 0;
      enemy.weakPoints = [];
      enemy.debuffs = [];
      enemy.attack = 0;
      enemy.attackSpeed = 0;
      enemy.critRate = 0;
      enemy.critDamage = 0;
      enemy.pierceCount = 0;
      enemy.lifestealPercent = 0;
      enemy.range = 0;
      enemy.defense = 0;
      enemy.burnChance = 0;
      enemy.poisonChance = 0;
      enemy.freezeChance = 0;
      enemy.lightningChance = 0;
      (enemy as any).isSandbag = true;
      (enemy as any).configKey = 'sandbag';
      return;
    }

    if (type === 'monster_sandbag') {
      enemy.id = getNextId();
      enemy.type = 'boss';
      enemy.name = '怪物沙袋';
      enemy.width = 44;
      enemy.height = 63;
      enemy.maxHealth = 100000000;
      enemy.health = 100000000;
      enemy.baseSpeed = 0;
      enemy.speed = 0;
      enemy.damage = 10;
      enemy.exp = 10;
      enemy.dropRate = 0;
      enemy.color = '#8B5E3C';
      enemy.element = null;
      enemy.isElite = false;
      enemy.isBoss = true;
      enemy.x = 0;
      enemy.y = 0;
      enemy.active = true;
      enemy.hitFlash = 0;
      enemy.stunTimer = 0;
      enemy.slowTimer = 0;
      enemy.slowAmount = 0;
      enemy.bossPhase = 0;
      enemy.bossSkillCooldown = 0;
      enemy.animFrame = 0;
      enemy.weakPoints = [];
      enemy.debuffs = [];
      // 其他属性全部为10
      enemy.attack = 10;
      enemy.attackSpeed = 10;
      enemy.critRate = 10;
      enemy.critDamage = 10;
      enemy.pierceCount = 10;
      enemy.lifestealPercent = 10;
      enemy.range = 10;
      enemy.defense = 10;
      enemy.burnChance = 10;
      enemy.poisonChance = 10;
      enemy.freezeChance = 10;
      enemy.lightningChance = 10;
      (enemy as any).isSandbag = true;
      (enemy as any).isMonsterSandbag = true;
      (enemy as any).configKey = 'monster_sandbag';
      return;
    }

    const config = ENEMY_CONFIGS[type];
    
    // 平衡调整：提高怪物血量成长以应对数值膨胀
    const healthMultiplier = 1 + (wave - 1) * 0.12 + Math.pow(1.010, wave - 1) * 0.4;
    const damageMultiplier = 1 + (wave - 1) * 0.05 + Math.pow(1.006, wave - 1) * 0.25;
    const speedMultiplier = 1 + Math.min(0.35, (wave - 1) * 0.0035);
    const expMultiplier = 1 + (wave - 1) * 0.07 + Math.pow(1.008, wave - 1) * 0.35;

    // Boss额外血量倍率（平衡调整：应对装备强化宝石附魔导致的数值膨胀）
    // 动态倍率：随波次增长，前期新手友好，后期有挑战
    const bossHpMultiplier = config.type === 'boss'
      ? Math.min(45, 1 + Math.sqrt(wave) * 9 + wave * 0.3)
      : 1;

    enemy.id = getNextId();
    enemy.type = config.type;
    enemy.name = config.name;
    // 精英怪和BOSS体型统一为 90×100
    if (config.type === 'elite' || config.type === 'boss') {
      enemy.width = 90;
      enemy.height = 100;
    } else {
      // 小怪体型 +50%
      enemy.width = Math.round(config.width * 1.5);
      enemy.height = Math.round(config.height * 1.5);
    }
    enemy.maxHealth = Math.floor(config.baseHealth * healthMultiplier * bossHpMultiplier);
    enemy.health = enemy.maxHealth;
    // 怪物速度：普通怪+100%，精英/BOSS+200%
    const speedBonus = config.type === 'normal' ? 2.0 : 3.2;
    // 高达移速 = 普通怪物移速的110%（在普通怪速度基础上×1.1）
    const gundamBonus = type === 'gundam' ? 1.1 : 1.0;
    // 精英/BOSS移速 = 普通怪物的95%
    const eliteBossSpeedMult = config.type === 'elite' || config.type === 'boss' ? 0.95 : 1.0;
    // 日常挑战：所有怪物移速 ×5（比普通怪物快5倍）
    const dailySpeedMult = this.gameMode === 'daily' ? 5.0 : 1.0;
    enemy.baseSpeed = config.baseSpeed * speedMultiplier * speedBonus * gundamBonus * eliteBossSpeedMult * dailySpeedMult;
    enemy.speed = enemy.baseSpeed;
    enemy.damage = Math.floor(config.baseDamage * damageMultiplier);
    enemy.exp = Math.floor(config.baseExp * expMultiplier);
    enemy.dropRate = Math.min(1, config.dropRate + (wave - 1) * 0.0045);
    enemy.color = config.color;
    enemy.element = config.element || null;
    enemy.isElite = config.type === 'elite';
    enemy.isBoss = config.type === 'boss';
    enemy.x = this.config.canvasWidth + this.config.spawnZoneWidth;
    enemy.y = randomRange(this.config.groundY + 10, this.config.canvasHeight - enemy.height - 10);
    enemy.active = true;
    enemy.hitFlash = 0;
    enemy.stunTimer = 0;
    enemy.slowTimer = 0;
    enemy.slowAmount = 0;
    enemy.bossPhase = 1;
    enemy.bossSkillCooldown = 3000;
    enemy.animFrame = 0;
    // 与玩家统一的战斗力属性（随波次缩放）
    enemy.attack = enemy.damage;
    enemy.attackSpeed = Math.max(400, Math.floor(config.baseAttackSpeed / (1 + Math.min(0.3, (wave - 1) * 0.003))));
    enemy.critRate = config.baseCritRate + Math.min(10, (wave - 1) * 0.1);
    enemy.critDamage = config.baseCritDamage + Math.min(50, (wave - 1) * 0.5);
    enemy.pierceCount = config.basePierceCount;
    enemy.lifestealPercent = config.baseLifestealPercent;
    enemy.range = config.baseRange;
    // 平衡调整：提升防御成长速度（0.20→0.25/波），上限提高至75%，应对数值膨胀
    const defCap = config.type === 'boss' ? 75 : 70;
    enemy.defense = Math.min(defCap, config.baseDefense + (wave - 1) * 0.25);
    enemy.burnChance = config.baseBurnChance;
    enemy.poisonChance = config.basePoisonChance;
    enemy.freezeChance = config.baseFreezeChance;
    enemy.lightningChance = config.baseLightningChance;
    (enemy as any).configKey = type;
    // 清理弓箭手/刺客的残留状态，防止 ObjectPool 复用时卡在攻击动画中
    (enemy as any).attackWindup = 0;
    (enemy as any).attackRecovery = 0;
    (enemy as any).hitStunTimer = 0;
    (enemy as any).frozenUntil = 0;
    // 近战普通攻击计时器初始化（首次进入范围即可攻击）
    (enemy as any).meleeAttackTimer = 0;
    // 清理残留的 debuffs 和 weakPoints，防止复用时带有上一次的异常状态
    if (enemy.debuffs) enemy.debuffs.length = 0;
    else enemy.debuffs = [];
    if (enemy.weakPoints) enemy.weakPoints.length = 0;
    else enemy.weakPoints = [];
  }

  private resetDropItem(item: DropItem, type: DropItem['type'], x: number, y: number, value: number, itemId?: string, equipmentId?: string): void {
    item.id = getNextId();
    item.type = type;
    item.x = x;
    item.y = y;
    item.value = value;
    item.itemId = itemId;
    (item as any).equipmentId = equipmentId;
    item.active = true;
    item.magnetSpeed = 0;
    (item as any).spawnTime = performance.now();
  }

  private resetParticle(p: Particle, x: number, y: number, color: string, count: number = 1): void {
    p.id = getNextId();
    p.x = x;
    p.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = randomRange(50, 200);
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = randomRange(0.3, 0.8);
    p.maxLife = p.life;
    p.color = color;
    p.size = randomRange(2, 5);
    p.active = true;
  }

  private resetDamageNumber(dn: DamageNumber, x: number, y: number, value: number, color: string): void {
    dn.id = getNextId();
    dn.x = x;
    dn.y = y;
    dn.value = value;
    dn.life = 1;
    dn.maxLife = 1;
    dn.color = color;
    dn.active = true;
  }

  private calculatePlayerStats(): void {
    const bs = this.debugConfig.baseStats;
    let attack = bs.attack;
    let attackSpeed = bs.attackSpeed;
    let range = bs.range;
    let maxHealth = bs.maxHealth;
    let critRate = 0;
    let critDamage = 50;
    let defense = 0;
    let regenPerSec = 0;
    let goldBonus = 0;
    let expBonus = 0;
    let dropBonus = 0;
    let burnChance = 0;
    let burnDamage = 0;
    let burnDuration = 0;
    let poisonChance = 0;
    let poisonDamage = 0;
    let poisonDuration = 0;
    let freezeChance = 0;
    let freezeSlowAmount = 0;
    let freezeDuration = 0;
    let lightningChance = 0;
    let lightningChain = 0;
    let lightningDamage = 0;
    let lifestealPercent = 0;
    let lifestealFlat = 0;
    let physicalPenetration = 0;
    let bulletPierceCount = 0;
    let resistance = 0;
    const elementalDamageBonus: Record<string, number> = { fire: 0, ice: 0, lightning: 0, poison: 0 };

    // 需求 #1：必须装备中带【火/冰/雷/毒属性攻击】词条，对应的【属性伤害增加】词条才生效
    // 先收集所有 elementalAttack 激活的元素类型
    const activeElements = new Set<ElementType>();
    for (const equip of this.equipment) {
      if (equip.affixes) {
        for (const affix of equip.affixes) {
          if (affix.type === 'elementalAttack' && affix.element) {
            activeElements.add(affix.element);
          }
        }
      }
      // 装备主属性 element + elementalDamage 也需要属性攻击激活
    }

    for (const equip of this.equipment) {
      if (equip.attack) attack += equip.attack;
      if (equip.attackSpeed) attackSpeed += equip.attackSpeed;
      if (equip.range) range += equip.range;
      if (equip.health) maxHealth += equip.health;
      if (equip.critRate) critRate += equip.critRate;
      if (equip.critDamage) critDamage += equip.critDamage;
      if (equip.defense) defense += equip.defense;
      if (equip.pierce) physicalPenetration += equip.pierce;
      // 强化加成：累加值，如 +3 = 1+2+3 = 6 点攻击力
      if (equip.enhanceLevel && equip.enhanceLevel > 0) {
        attack += getEnhanceAttackBonus(equip.enhanceLevel);
      }
      // 装备主属性元素伤害需要属性攻击激活
      if (equip.elementalDamage && equip.element && activeElements.has(equip.element)) {
        elementalDamageBonus[equip.element] = (elementalDamageBonus[equip.element] || 0) + equip.elementalDamage;
      }
      // 宝石镶嵌加成：与装备主属性同时累加
      if (equip.socketedGems && equip.socketedGems.length > 0) {
        for (const g of equip.socketedGems) {
          switch (g.type) {
            case 'attack':     attack += g.value; break;
            case 'health':     maxHealth += g.value; break;
            case 'defense':    defense += g.value; break;
            case 'critRate':   critRate += g.value; break;
            case 'resistance': resistance += g.value; break;
          }
        }
      }
      // 词条加成
      if (equip.affixes) {
        for (const affix of equip.affixes) {
          switch (affix.type) {
            case 'attack': attack += affix.value; break;
            case 'defense': defense += affix.value; break;
            case 'resistance': resistance += affix.value; break;
            case 'health': maxHealth += affix.value; break;
            case 'critRate': critRate += affix.value; break;
            case 'critDamage': critDamage += affix.value; break;
            case 'attackSpeed': attackSpeed = Math.floor(attackSpeed * (1 - affix.value / 100)); break;
            case 'range': range += affix.value; break;
            case 'pierce': physicalPenetration += affix.value; break;
            case 'elementalAttack':
              // 属性攻击词条不直接提供数值加成，仅激活对应元素的属性伤害
              break;
            case 'elementalDamage':
              // 属性伤害词条仅在拥有对应元素属性攻击时生效
              if (affix.element && activeElements.has(affix.element)) {
                elementalDamageBonus[affix.element] = (elementalDamageBonus[affix.element] || 0) + affix.value;
              }
              break;
            case 'statusFreeze':
              freezeChance += affix.value;
              freezeSlowAmount = Math.max(freezeSlowAmount, 50);
              freezeDuration = Math.max(freezeDuration, 2000);
              break;
            case 'statusPoison':
              poisonChance += affix.value;
              poisonDamage += affix.value * 1.5;
              poisonDuration = Math.max(poisonDuration, 3000);
              break;
            case 'statusBurn':
              burnChance += affix.value;
              burnDamage += affix.value * 1.5;
              burnDuration = Math.max(burnDuration, 3000);
              break;
            case 'statusLightning':
              lightningChance += affix.value;
              lightningChain = Math.max(lightningChain, 3);
              lightningDamage += affix.value * 1.5;
              break;
            case 'lifesteal':
              lifestealPercent += affix.value;
              break;
          }
        }
      }
    }

    // 附魔加成：百分比加成到对应属性（在所有装备主属性 + 词条累加完毕后应用）
    let enchantAttackPct = 0;
    let enchantHealthPct = 0;
    let enchantDefensePct = 0;
    let enchantCritRateFlat = 0;
    let enchantResistanceFlat = 0;
    for (const equip of this.equipment) {
      if (equip.enchantment) {
        switch (equip.enchantment.stat) {
          case 'attack': enchantAttackPct += equip.enchantment.percent; break;
          case 'health': enchantHealthPct += equip.enchantment.percent; break;
          case 'defense': enchantDefensePct += equip.enchantment.percent; break;
          case 'critRate': enchantCritRateFlat += equip.enchantment.percent; break;
          case 'resistance': enchantResistanceFlat += equip.enchantment.percent; break;
        }
      }
    }
    if (enchantAttackPct > 0) attack = Math.floor(attack * (1 + enchantAttackPct / 100));
    if (enchantHealthPct > 0) maxHealth = Math.floor(maxHealth * (1 + enchantHealthPct / 100));
    if (enchantDefensePct > 0) defense = Math.floor(defense * (1 + enchantDefensePct / 100));
    critRate += enchantCritRateFlat;
    resistance += enchantResistanceFlat;

    // 品质套装加成（3/6/9 件套）
    const setGroups = getQualitySetGroups(this.equipment);
    let setAttackPct = 0;
    let setMaxHealthPct = 0;
    let setDefensePct = 0;
    let setCritRateFlat = 0;
    let setCritDamageFlat = 0;
    let setAttackSpeedPct = 0;
    let setAllStatsPct = 0;
    let setRegenPerSec = 0;
    for (const group of setGroups) {
      for (const effect of group.set.effects) {
        if (group.count < effect.pieces) continue;
        switch (effect.stat) {
          case 'attack': setAttackPct += effect.value; break;
          case 'maxHealth': setMaxHealthPct += effect.value; break;
          case 'critDamage': setCritDamageFlat += effect.value; break;
          case 'critRate': setCritRateFlat += effect.value; break;
          case 'attackSpeed': setAttackSpeedPct += effect.value; break;
          case 'allStats': setAllStatsPct += effect.value; break;
        }
        // 神话9件套：每秒回 0.4% 生命（数值已砍至20%）
        if (group.tier === 'mythic' && group.count >= 9) {
          setRegenPerSec += 0.004;
        }
      }
    }
    attack = Math.floor(attack * (1 + setAttackPct / 100));
    maxHealth = Math.floor(maxHealth * (1 + setMaxHealthPct / 100));
    defense = Math.floor(defense * (1 + setDefensePct / 100));
    critRate += setCritRateFlat;
    critDamage += setCritDamageFlat;
    attackSpeed = Math.floor(attackSpeed * (1 - setAttackSpeedPct / 100));
    if (setAllStatsPct > 0) {
      attack = Math.floor(attack * (1 + setAllStatsPct / 100));
      maxHealth = Math.floor(maxHealth * (1 + setAllStatsPct / 100));
      defense = Math.floor(defense * (1 + setAllStatsPct / 100));
    }
    regenPerSec += setRegenPerSec;

    for (const skill of this.skills) {
      if (skill.level <= 0) continue;
      const lvl = skill.level;
      
      switch (skill.id) {
        // ===== 属性技能（合并后单一技能） =====
        case 'atk': attack += 5 * lvl; break;
        case 'spd': attackSpeed = Math.floor(attackSpeed * (1 - 0.03 * lvl)); break;
        case 'hp': maxHealth += 40 * lvl; break;
        case 'crit': critRate += 1 * lvl; break;
        case 'def': defense += 1 * lvl; break;
        case 'cdmg': critDamage += 3 * lvl; break;
        case 'regen': regenPerSec += 0.002 * lvl; break;
        case 'lifesteal': lifestealFlat += 2 * lvl; break;
        case 'piercing': bulletPierceCount = Math.max(bulletPierceCount, 1 + lvl); break;

        case 'ultimate':
          attack = Math.floor(attack * 1.20);
          maxHealth = Math.floor(maxHealth * 1.20);
          attackSpeed = Math.floor(attackSpeed * 0.80);
          critRate += 12;
          critDamage += 25;
          break;
      }
    }

    for (const talent of this.talents) {
      switch (talent.stat) {
        case 'attack': attack += talent.value; break;
        case 'attackSpeed': attackSpeed = Math.floor(attackSpeed * (1 - talent.value / 100)); break;
        case 'range': range += talent.value; break;
        case 'health': maxHealth += talent.value; break;
        case 'defense': defense += talent.value; break;
        case 'critRate': critRate += talent.value; break;
        case 'critDamage': critDamage += talent.value; break;
        case 'regenPerSec': regenPerSec += talent.value / 100; break;
        case 'goldBonus': goldBonus += talent.value / 100; break;
        case 'expBonus': expBonus += talent.value / 100; break;
      }
    }

    // 技能药水效果（持续本回合）
    if (this.wavePotionEffects['attack']) attack += this.wavePotionEffects['attack'];
    if (this.wavePotionEffects['attackSpeed']) attackSpeed = Math.floor(attackSpeed * (1 - this.wavePotionEffects['attackSpeed'] / 100));
    if (this.wavePotionEffects['maxHealth']) maxHealth += this.wavePotionEffects['maxHealth'];
    if (this.wavePotionEffects['critRate']) critRate += this.wavePotionEffects['critRate'];
    if (this.wavePotionEffects['defense']) defense += this.wavePotionEffects['defense'];
    if (this.wavePotionEffects['range']) range += this.wavePotionEffects['range'];

    const levelBonus = Math.max(0, (this.player.level - 1)) * 0.015;
    attack = Math.floor(attack * (1 + levelBonus));
    maxHealth = Math.floor(maxHealth * (1 + levelBonus * 1.2));

    this.player.attack = attack;
    this.player.attackSpeed = attackSpeed;
    // 需求 #4：人物最大射程为战场95%宽度；debuff时最低25%宽度
    const battlefieldWidth = this.config.canvasWidth - this.config.playerStartX;
    const maxRange = battlefieldWidth * 0.95;
    const minRange = battlefieldWidth * 0.25;
    this.player.range = Math.max(minRange, Math.min(range, maxRange));
    this.player.maxHealth = maxHealth;
    (this.player as any).critRate = critRate;
    (this.player as any).critDamage = critDamage;
    (this.player as any).defense = defense;
    (this.player as any).regenPerSec = regenPerSec;
    (this.player as any).goldBonus = goldBonus;
    (this.player as any).expBonus = expBonus;
    (this.player as any).dropBonus = dropBonus;
    (this.player as any).burnChance = burnChance;
    (this.player as any).burnDamage = burnDamage;
    (this.player as any).burnDuration = burnDuration;
    (this.player as any).poisonChance = poisonChance;
    (this.player as any).poisonDamage = poisonDamage;
    (this.player as any).poisonDuration = poisonDuration;
    (this.player as any).freezeChance = freezeChance;
    (this.player as any).freezeSlowAmount = freezeSlowAmount;
    (this.player as any).freezeDuration = freezeDuration;
    (this.player as any).lightningChance = lightningChance;
    (this.player as any).lightningChain = lightningChain;
    (this.player as any).lightningDamage = lightningDamage;
    (this.player as any).lifestealPercent = lifestealPercent;
    (this.player as any).lifestealFlat = lifestealFlat;
    (this.player as any).physicalPenetration = physicalPenetration;
    (this.player as any).bulletPierceCount = bulletPierceCount;
    (this.player as any).resistance = resistance;
    (this.player as any).elementalDamageBonus = elementalDamageBonus;

    if (this.player.health > maxHealth) this.player.health = maxHealth;
  }

  start(): void {
    if (this.gameState.isRunning) return;
    this.gameState.isRunning = true;
    this.gameState.isPaused = false;
    this.lastTime = performance.now();
    this.rebuildBackgroundCache();
    this.rebuildCloneSprite();
    this.initMode();
    // 无波次模式（世界BOSS/炼狱/镜像/材料副本/日常挑战）不使用波次系统，跳过 startWave
    if (this.gameMode !== 'worldboss' && this.gameMode !== 'purgatory' && this.gameMode !== 'mirror' && this.gameMode !== 'material' && this.gameMode !== 'daily') {
      this.startWave();
    }
    // 立即同步状态到 React，避免首帧渲染时显示旧 gameState（如"第2波"闪烁）
    if (this.onStateChange) {
      this.onStateChange(this.gameState, this.player);
    }
    this.gameLoop();
  }

  setGameMode(mode: GameMode, difficulty: DifficultyLevel = 'normal', dungeonType: MaterialDungeonType = 'enhance'): void {
    this.gameMode = mode;
    this.modeDifficulty = difficulty;
    this.modeDungeonType = dungeonType;
  }

  restartWithMode(mode: GameMode, difficulty: DifficultyLevel = 'normal', dungeonType: MaterialDungeonType = 'enhance'): void {
    this.setGameMode(mode, difficulty, dungeonType);
    this.resetGameForMode();
    this.start();
  }

  private resetGameForMode(): void {
    this.stop();
    // 先发送上一场遗留的 pendingMailDrops（仓库满未拾取的掉落），避免混入下一场奖励邮件
    this.sendBattleMail();
    this.player.health = this.player.maxHealth;
    this.gameState.isGameOver = false;
    this.gameState.isPaused = false;
    this.gameState.bossActive = false;
    this.gameState.bossHealth = 0;
    this.gameState.bossMaxHealth = 0;
    this.gameState.bossName = '';
    this.gameState.currentWave = 0;
    this.gameState.betweenWaves = true;
    this.gameState.betweenWaveTimer = 3000;
    this.gameState.waveEnemiesSpawned = 0;
    this.gameState.waveEnemiesRemaining = 0;
    this.gameState.waveEnemiesTotal = 0;

    for (const enemy of this.enemyPool.getActive()) {
      this.enemyPool.release(enemy);
    }
    for (const bullet of this.bulletPool.getActive()) {
      this.bulletPool.release(bullet);
    }
    for (const drop of this.dropPool.getActive()) {
      this.dropPool.release(drop);
    }
    for (const particle of this.particlePool.getActive()) {
      this.particlePool.release(particle);
    }
    for (const dn of this.damageNumberPool.getActive()) {
      this.damageNumberPool.release(dn);
    }
    this.weatherParticles = [];
    this.weather.type = 'clear';
    this.weather.intensity = 0;
    this.buffs = [];
    this.playerDebuffs = [];
    this.modeVictory = false;
    this.modeFailed = false;
    this.modeScore = 0;
  }

  private initMode(): void {
    this.modeVictory = false;
    this.modeFailed = false;
    this.modeScore = 0;
    this.modeTimeRemaining = this.modeTimeLimit;
    this.modeData = {};

    switch (this.gameMode) {
      case 'worldboss':
        this.initWorldBossMode();
        break;
      case 'purgatory':
        this.initPurgatoryMode();
        break;
      case 'daily':
        this.initDailyMode();
        break;
      case 'material':
        this.initMaterialMode();
        break;
      case 'mirror':
        this.initMirrorMode();
        break;
      case 'guard':
        this.initGuardMode();
        break;
      case 'homedefense':
        this.initHomeDefenseMode();
        break;
      case 'stage':
      default:
        break;
    }
  }

  private initWorldBossMode(): void {
    this.modeTimeLimit = 5 * 60 * 1000;
    this.modeTimeRemaining = this.modeTimeLimit;
    this.gameState.betweenWaves = false;
    this.gameState.waveInterval = 0;
    this.gameState.betweenWaveTimer = 0;
    this.gameState.currentWave = 1;
    this.gameState.waveEnemiesSpawned = 1;
    this.gameState.waveEnemiesRemaining = 1;
    this.gameState.waveEnemiesTotal = 1;
    this.spawnWorldBoss();
  }

  private spawnWorldBoss(): void {
    const diffMult = DIFFICULTY_CONFIG[this.modeDifficulty].enemyMult;
    const boss = this.enemyPool.acquire('mutant', 1) as Enemy;
    const playerLevel = this.player.level;

    boss.name = '世界BOSS·毁灭者';
    boss.type = 'boss';
    boss.isBoss = true;
    boss.width = 200;
    boss.height = 220;
    boss.maxHealth = Math.floor(50000000 * Math.pow(1.15, playerLevel) * diffMult);
    boss.health = boss.maxHealth;
    boss.baseSpeed = 0.8;
    boss.speed = 0.8;
    boss.damage = Math.floor(20 + playerLevel * 5 * diffMult);
    boss.exp = 0;
    boss.dropRate = 1;
    boss.color = '#E74C3C';
    boss.x = this.config.canvasWidth - 250;
    boss.y = this.config.groundY + 40;
    boss.attack = Math.floor(50 + playerLevel * 10 * diffMult);
    boss.attackSpeed = 1500;
    boss.critRate = 10;
    boss.critDamage = 150;
    boss.defense = Math.min(60, 20 + playerLevel * 0.5);
    boss.range = 400;
    boss.bossMaxPhase = 3;
    boss.bossPhase = 0;
    boss.bossSkillCooldown = 3000;
    (boss as any).isWorldBoss = true;
    (boss as any).shootCooldown = boss.attackSpeed;
    (boss as any).specialCooldown = 5000;
    (boss as any).chargeCooldown = 8000;
    (boss as any).isCharging = false;
    (boss as any).chargeTimer = 0;

    this.gameState.bossActive = true;
    this.gameState.bossHealth = boss.health;
    this.gameState.bossMaxHealth = boss.maxHealth;
    this.gameState.bossName = boss.name;
    this.gameState.eliteBossNoticeType = 'boss';
    this.gameState.showEliteBossNotice = true;
    this.gameState.eliteBossNoticeTimer = 3000;
  }

  private initPurgatoryMode(): void {
    // 取消波次系统
    this.gameState.betweenWaves = false;
    this.gameState.waveInterval = 0;
    this.gameState.betweenWaveTimer = 0;
    this.gameState.currentWave = 1;
    this.gameState.waveEnemiesSpawned = 0;
    this.gameState.waveEnemiesRemaining = 0;
    this.gameState.waveEnemiesTotal = 0;

    // 炼狱模式状态
    this.modeData.purgatoryPhase = 'chains'; // 'chains' | 'boss' | 'settlement'
    this.modeData.purgatoryBossType = null;
    this.modeData.purgatoryBossElement = null;

    // 刷新炼狱枷锁
    this.spawnPurgatoryChains();
  }

  /** 刷新炼狱枷锁（第一阶段，非BOSS：不显示BOSS血条/来袭提示） */
  private spawnPurgatoryChains(): void {
    const playerLevel = this.player.level;
    const diffMult = DIFFICULTY_CONFIG[this.modeDifficulty].enemyMult;
    const chains = this.enemyPool.acquire('mutant', 1) as Enemy;

    chains.name = '炼狱枷锁';
    chains.type = 'elite'; // 非boss，避免触发BOSS血条/击杀逻辑
    chains.isBoss = false;
    chains.width = 200;
    chains.height = 200;
    chains.x = 240;
    chains.y = this.config.groundY + (this.config.canvasHeight - this.config.groundY) / 2 - 100;
    chains.maxHealth = Math.floor(PURGATORY_CHAINS_CONFIG.baseHealth * (1 + playerLevel * 0.1) * diffMult);
    chains.health = chains.maxHealth;
    chains.baseSpeed = 0;
    chains.speed = 0;
    chains.damage = 0;
    chains.exp = 0;
    chains.dropRate = 0;
    chains.color = '#666666';
    chains.defense = Math.min(70, 30 + Math.floor(playerLevel * 0.3));
    (chains as any).isPurgatoryChains = true;
    (chains as any).bossPhase = 1;
    (chains as any).bossSkillCooldown = 999999;

    // 枷锁阶段不激活BOSS状态（无BOSS血条/来袭提示）
    this.gameState.bossActive = false;
    this.gameState.bossHealth = 0;
    this.gameState.bossMaxHealth = 0;
    this.gameState.bossName = '';
    this.gameState.showEliteBossNotice = false;
  }

  /** 刷新炼狱BOSS（第二阶段） */
  private spawnPurgatoryBoss(): void {
    const playerLevel = this.player.level;
    const diffMult = DIFFICULTY_CONFIG[this.modeDifficulty].enemyMult;
    const bossType = PURGATORY_BOSS_TYPES[Math.floor(Math.random() * PURGATORY_BOSS_TYPES.length)];
    const config = PURGATORY_BOSS_CONFIGS[bossType];
    const boss = this.enemyPool.acquire('mutant', 1) as Enemy;

    boss.name = config.name;
    boss.type = 'boss';
    boss.isBoss = true;
    boss.width = 200;
    boss.height = 200;
    boss.x = 240;
    boss.y = this.config.groundY + (this.config.canvasHeight - this.config.groundY) / 2 - 100;
    boss.maxHealth = Math.floor(config.baseHealth * (1 + playerLevel * 0.12) * diffMult);
    boss.health = boss.maxHealth;
    boss.baseSpeed = PURGATORY_BOSS_SPEED;
    boss.speed = PURGATORY_BOSS_SPEED;
    boss.damage = Math.floor(config.baseDamage * (1 + playerLevel * 0.05) * diffMult);
    boss.exp = 0;
    boss.dropRate = 0;
    boss.color = config.color;
    boss.element = config.element;
    boss.defense = Math.min(80, config.baseDefense + Math.floor(playerLevel * 0.3));
    (boss as any).isPurgatoryBoss = true;
    (boss as any).purgatoryBossType = bossType;
    (boss as any).bossPhase = 1;
    (boss as any).bossSkillCooldown = 2000;

    this.modeData.purgatoryBossType = bossType;
    this.modeData.purgatoryBossElement = config.element;

    this.gameState.bossActive = true;
    this.gameState.bossHealth = boss.health;
    this.gameState.bossMaxHealth = boss.maxHealth;
    this.gameState.bossName = boss.name;
    this.gameState.eliteBossNoticeType = 'purgatory';
    this.gameState.showEliteBossNotice = true;
    this.gameState.eliteBossNoticeTimer = 3000;
  }

  private initDailyMode(): void {
    // 取消波次系统：单波次无限刷怪
    this.gameState.betweenWaves = false;
    this.gameState.waveInterval = 0;
    this.gameState.betweenWaveTimer = 0;
    this.gameState.currentWave = 1;
    this.gameState.waveEnemiesSpawned = 0;
    this.gameState.waveEnemiesRemaining = 0;
    this.gameState.waveEnemiesTotal = 0;

    // 无时间限制（玩家主动退出结算）
    this.modeTimeLimit = 0;
    this.modeTimeRemaining = 0;

    // 击杀计数（按类型分别累计）
    this.modeData.dailyNormalKills = 0;
    this.modeData.dailyEliteKills = 0;
    this.modeData.dailyBossKills = 0;

    // 下次精英/BOSS刷新阈值
    this.modeData.dailyNextEliteKill = 50;
    this.modeData.dailyNextBossKill = 100;

    // 刷怪计时器（与普通波次刷怪间隔一致）
    this.modeData.dailySpawnTimer = 800;
    this.modeData.dailySpawnInterval = 800;

    // 战斗阶段：'fight' | 'settlement'
    this.modeData.dailyPhase = 'fight';

    // 奖励（金币 + 经验书列表）
    this.modeData.dailyRewards = { gold: 0, books: [] };

    // 强度档位：每击杀50只普通怪提升1档，每档各项数值+20%
    this.modeData.dailyStrengthTier = 0;
  }

  private initMaterialMode(): void {
    // 取消波次系统：单波次，50只怪同时刷新 + 1只BOSS
    this.gameState.betweenWaves = false;
    this.gameState.waveInterval = 0;
    this.gameState.betweenWaveTimer = 0;
    this.gameState.currentWave = 1;
    this.gameState.waveEnemiesSpawned = 0;
    this.gameState.waveEnemiesRemaining = 0;
    this.gameState.waveEnemiesTotal = 0;

    // 无时间限制（击败BOSS即通关）
    this.modeTimeLimit = 0;
    this.modeTimeRemaining = 0;
    this.modeData.materialDrops = [];
    this.modeData.materialStartKills = this.totalKills;
    this.modeData.materialPhase = 'fight'; // 'fight' | 'settlement'
    this.modeData.materialRewards = [];

    // 同时刷新49只普通怪+1只BOSS（共50只）
    const wave = Math.max(1, this.player.level);
    for (let i = 0; i < 49; i++) {
      // 从基础怪物池随机选择类型
      const baseTypes = NORMAL_ENEMY_TYPES.slice(0, Math.min(2 + Math.floor(wave / 3), 6));
      const type = baseTypes[randomInt(0, baseTypes.length - 1)];
      this.enemyPool.acquire(type, wave);
      this.gameState.waveEnemiesSpawned++;
    }

    // 刷新材料副本BOSS
    this.spawnMaterialBoss();
  }

  /** 刷新材料副本BOSS（晶石巨魔：战斗力中等，仅近战碰撞伤害） */
  private spawnMaterialBoss(): void {
    const playerLevel = this.player.level;
    const diffMult = DIFFICULTY_CONFIG[this.modeDifficulty].enemyMult;
    const boss = this.enemyPool.acquire('mutant', 1) as Enemy;

    boss.name = MATERIAL_BOSS_CONFIG.name;
    boss.type = 'boss';
    boss.isBoss = true;
    boss.width = MATERIAL_BOSS_CONFIG.width;
    boss.height = MATERIAL_BOSS_CONFIG.height;
    // 血量随玩家等级成长，但远低于炼狱BOSS
    boss.maxHealth = Math.floor(MATERIAL_BOSS_CONFIG.baseHealth * (1 + playerLevel * 0.15) * diffMult);
    boss.health = boss.maxHealth;
    boss.baseSpeed = MATERIAL_BOSS_CONFIG.baseSpeed;
    boss.speed = MATERIAL_BOSS_CONFIG.baseSpeed;
    boss.damage = Math.floor(MATERIAL_BOSS_CONFIG.baseDamage * (1 + playerLevel * 0.05) * diffMult);
    boss.exp = MATERIAL_BOSS_CONFIG.baseExp;
    boss.dropRate = 0;
    boss.color = MATERIAL_BOSS_CONFIG.color;
    boss.x = this.config.canvasWidth - 200;
    boss.y = this.config.groundY + (this.config.canvasHeight - this.config.groundY) / 2 - boss.height / 2;
    boss.attack = boss.damage;
    boss.attackSpeed = MATERIAL_BOSS_CONFIG.baseAttackSpeed;
    boss.critRate = MATERIAL_BOSS_CONFIG.baseCritRate;
    boss.critDamage = MATERIAL_BOSS_CONFIG.baseCritDamage;
    boss.pierceCount = MATERIAL_BOSS_CONFIG.basePierceCount;
    boss.lifestealPercent = MATERIAL_BOSS_CONFIG.baseLifestealPercent;
    boss.range = MATERIAL_BOSS_CONFIG.baseRange;
    boss.defense = Math.min(60, MATERIAL_BOSS_CONFIG.baseDefense + Math.floor(playerLevel * 0.2));
    boss.burnChance = 0;
    boss.poisonChance = 0;
    boss.freezeChance = 0;
    boss.lightningChance = 0;
    boss.bossPhase = 1;
    boss.bossSkillCooldown = 999999; // 无特殊技能
    (boss as any).isMaterialBoss = true;

    this.gameState.bossActive = true;
    this.gameState.bossHealth = boss.health;
    this.gameState.bossMaxHealth = boss.maxHealth;
    this.gameState.bossName = boss.name;
    this.gameState.eliteBossNoticeType = 'boss';
    this.gameState.showEliteBossNotice = true;
    this.gameState.eliteBossNoticeTimer = 3000;
  }

  private initMirrorMode(): void {
    this.modeTimeLimit = 3 * 60 * 1000;
    this.modeTimeRemaining = this.modeTimeLimit;
    this.gameState.betweenWaves = false;
    this.gameState.waveInterval = 0;
    this.gameState.betweenWaveTimer = 0;
    this.gameState.currentWave = 1;
    this.gameState.waveEnemiesSpawned = 1;
    this.gameState.waveEnemiesRemaining = 1;
    this.gameState.waveEnemiesTotal = 1;
    this.spawnMirrorEnemy();
  }

  private spawnMirrorEnemy(): void {
    const diffMult = DIFFICULTY_CONFIG[this.modeDifficulty].enemyMult;
    const mirror = this.enemyPool.acquire('mutant', 1) as Enemy;

    mirror.name = '镜像战士';
    mirror.type = 'boss';
    mirror.isBoss = true;
    mirror.width = 24;
    mirror.height = 48;
    mirror.maxHealth = Math.floor(this.player.maxHealth * diffMult);
    mirror.health = mirror.maxHealth;
    mirror.baseSpeed = 2.5;
    mirror.speed = 2.5;
    mirror.damage = Math.floor(this.player.attack * 0.3 * diffMult);
    mirror.exp = 0;
    mirror.dropRate = 0;
    mirror.color = '#9B59B6';
    mirror.x = this.config.canvasWidth - 100;
    mirror.y = this.player.y;
    mirror.attack = Math.floor(this.player.attack * diffMult);
    mirror.attackSpeed = this.player.attackSpeed;
    mirror.critRate = (this.player as any).critRate || 5;
    mirror.critDamage = (this.player as any).critDamage || 150;
    mirror.defense = (this.player as any).defense || 0;
    mirror.range = (this.player as any).range || 300;
    (mirror as any).isMirror = true;
    (mirror as any).shootCooldown = mirror.attackSpeed;
    (mirror as any).mirrorAnimFrame = 0;

    this.gameState.bossActive = true;
    this.gameState.bossHealth = mirror.health;
    this.gameState.bossMaxHealth = mirror.maxHealth;
    this.gameState.bossName = mirror.name;
    this.gameState.eliteBossNoticeType = 'boss';
    this.gameState.showEliteBossNotice = true;
    this.gameState.eliteBossNoticeTimer = 2000;
  }

  private initGuardMode(): void {
    this.guardBaseMaxHealth = 500 + this.player.level * 20;
    this.guardBaseHealth = this.guardBaseMaxHealth;
  }

  private initHomeDefenseMode(): void {
    this.homeBaseMaxHealth = 1000 + this.player.level * 50;
    this.homeBaseHealth = this.homeBaseMaxHealth;
    this.homeTowers = [
      { x: 60, y: this.config.groundY + 80, type: 'cannon', damage: 15 + this.player.level * 2, cooldown: 1500, lastShot: 0 },
      { x: 60, y: this.config.groundY + 160, type: 'cannon', damage: 15 + this.player.level * 2, cooldown: 1500, lastShot: 750 },
    ];
  }

  private updateMode(dt: number): void {
    if (this.gameMode === 'stage') return;
    if (this.gameState.isGameOver || this.modeVictory || this.modeFailed) return;

    if (this.modeTimeLimit > 0) {
      this.modeTimeRemaining -= dt * 1000;
      if (this.modeTimeRemaining <= 0) {
        this.modeTimeRemaining = 0;
        this.onModeTimeUp();
      }
    }

    switch (this.gameMode) {
      case 'worldboss':
        this.updateWorldBossMode(dt);
        break;
      case 'purgatory':
        this.updatePurgatoryMode(dt);
        break;
      case 'daily':
        this.updateDailyMode(dt);
        break;
      case 'material':
        this.updateMaterialMode(dt);
        break;
      case 'mirror':
        this.updateMirrorMode(dt);
        break;
      case 'guard':
        this.updateGuardMode(dt);
        break;
      case 'homedefense':
        this.updateHomeDefenseMode(dt);
        break;
    }
  }

  private onModeTimeUp(): void {
    switch (this.gameMode) {
      case 'worldboss':
        this.modeFailed = true;
        this.gameState.isGameOver = true;
        break;
      case 'daily':
        this.modeVictory = true;
        this.gameState.isGameOver = true;
        break;
      case 'mirror':
        this.modeFailed = true;
        this.gameState.isGameOver = true;
        break;
      default:
        break;
    }
  }

  private updateWorldBossMode(dt: number): void {
    const dtMs = dt * 1000;
    const enemies = this.enemyPool.getActive();
    const boss = enemies.find(e => (e as any).isWorldBoss);

    if (!boss || boss.health <= 0) {
      this.modeVictory = true;
      this.gameState.isGameOver = true;
      return;
    }

    this.gameState.bossHealth = boss.health;

    const healthPercent = boss.health / boss.maxHealth;
    if (healthPercent <= 0.33 && boss.bossPhase < 3) {
      boss.bossPhase = 3;
      boss.attackSpeed = Math.floor(boss.attackSpeed * 0.6);
      boss.speed = boss.baseSpeed * 1.5;
      this.addBossBuff('enrage_3', 9999999);
    } else if (healthPercent <= 0.66 && boss.bossPhase < 2) {
      boss.bossPhase = 2;
      boss.attackSpeed = Math.floor(boss.attackSpeed * 0.75);
      boss.speed = boss.baseSpeed * 1.2;
      this.addBossBuff('enrage_2', 9999999);
    } else if (healthPercent <= 0.9 && boss.bossPhase < 1) {
      boss.bossPhase = 1;
      this.addBossBuff('enrage_1', 9999999);
    }

    this.updateBossStatusDisplay();

    (boss as any).shootCooldown -= dtMs;
    if ((boss as any).shootCooldown <= 0) {
      this.worldBossShoot(boss);
      (boss as any).shootCooldown = boss.attackSpeed;
    }

    (boss as any).specialCooldown -= dtMs;
    if ((boss as any).specialCooldown <= 0) {
      this.worldBossSpecialAttack(boss);
      (boss as any).specialCooldown = 5000 + Math.random() * 3000;
    }

    (boss as any).chargeCooldown -= dtMs;
    if ((boss as any).chargeCooldown <= 0 && !(boss as any).isCharging) {
      (boss as any).isCharging = true;
      (boss as any).chargeTimer = 1500;
      (boss as any).chargeDir = this.player.y < boss.y + boss.height / 2 ? -1 : 1;
    }

    if ((boss as any).isCharging) {
      (boss as any).chargeTimer -= dtMs;
      boss.y += 6 * (boss as any).chargeDir;
      if ((boss as any).chargeTimer <= 0) {
        (boss as any).isCharging = false;
        (boss as any).chargeCooldown = 10000 + Math.random() * 5000;
      }
    } else {
      const playerCy = this.player.y + this.player.height / 2;
      const bossCy = boss.y + boss.height / 2;
      if (Math.abs(playerCy - bossCy) > 30) {
        boss.y += boss.speed * 0.5 * (bossCy > playerCy ? -1 : 1);
      }
    }

    boss.y = Math.max(this.config.groundY + 10, Math.min(this.config.canvasHeight - boss.height - 10, boss.y));
  }

  private worldBossShoot(boss: Enemy): void {
    const bulletX = boss.x;
    const bulletY = boss.y + boss.height / 2;
    const angle = Math.atan2(
      this.player.y + this.player.height / 2 - bulletY,
      this.player.x + this.player.width / 2 - bulletX
    );

    const spreadCount = boss.bossPhase >= 2 ? 5 : 3;
    const spreadAngle = 0.15;
    for (let i = 0; i < spreadCount; i++) {
      const offset = (i - Math.floor(spreadCount / 2)) * spreadAngle;
      const bullet = this.bulletPool.acquire(bulletX, bulletY + (i - Math.floor(spreadCount / 2)) * 8, boss.damage) as Bullet;
      (bullet as any).angle = angle + offset;
      (bullet as any).speed = 180;
      (bullet as any).isEnemyBullet = true;
      bullet.trailColor = '#FF4757';
      bullet.element = 'physical';
      bullet.width = 8;
      bullet.height = 8;
    }
  }

  private worldBossSpecialAttack(boss: Enemy): void {
    const bulletX = boss.x;
    const bulletY = boss.y + boss.height / 2;

    const count = 12 + boss.bossPhase * 4;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.1;
      const bullet = this.bulletPool.acquire(bulletX, bulletY, Math.floor(boss.damage * 0.5)) as Bullet;
      (bullet as any).angle = angle;
      (bullet as any).speed = 150 + Math.random() * 50;
      (bullet as any).isEnemyBullet = true;
      bullet.trailColor = '#FF6B81';
      bullet.element = 'fire';
      bullet.width = 6;
      bullet.height = 6;
    }
  }

  private updatePurgatoryMode(dt: number): void {
    const dtMs = dt * 1000;
    // 炼狱模式跳过 updateWave，需在此处衰减 BOSS/精英来袭提示计时器
    if (this.gameState.showEliteBossNotice) {
      this.gameState.eliteBossNoticeTimer -= dtMs;
      if (this.gameState.eliteBossNoticeTimer <= 0) {
        this.gameState.showEliteBossNotice = false;
      }
    }

    const phase = this.modeData.purgatoryPhase as string;
    const enemies = this.enemyPool.getActive();

    if (phase === 'chains') {
      // 第一阶段：炼狱枷锁（非BOSS，不更新bossHealth）
      const chains = enemies.find(e => (e as any).isPurgatoryChains);
      if (chains) {
        // 枷锁被击败 → 进入第二阶段
        if (chains.health <= 0) {
          this.enemyPool.release(chains);
          this.modeData.purgatoryPhase = 'boss';
          // 延迟1秒后刷新BOSS
          this.trackTimer(setTimeout(() => {
            this.spawnPurgatoryBoss();
          }, 1000) as unknown as number);
        }
      }
      return;
    }

    if (phase === 'boss') {
      // 第二阶段：炼狱BOSS
      const boss = enemies.find(e => (e as any).isPurgatoryBoss);
      if (boss) {
        this.gameState.bossHealth = boss.health;
        // BOSS技能更新
        this.updatePurgatoryBossSkills(boss, dt);
        // BOSS被击败 → 进入结算
        if (boss.health <= 0) {
          this.enemyPool.release(boss);
          this.modeData.purgatoryPhase = 'settlement';
          this.gameState.bossActive = false;
          this.gameState.bossHealth = 0;
          this.modeVictory = true;
          this.gameState.isGameOver = true;
          // 生成奖励装备
          this.generatePurgatoryRewards();
          // 记录今日挑战次数
          this.incrementPurgatoryChallenge();
          // 立即同步状态到 React，绕过节流机制（同 triggerGameOver）
          // 否则下一帧 gameLoop 因 isGameOver=true 跳过 update()，onStateChange 永不触发
          if (this.onStateChange) {
            this.onStateChange(this.gameState, this.player);
          }
          if (this.onPlayerChange) {
            this.onPlayerChange(this.player);
          }
        }
      }
      return;
    }
  }

  /** 炼狱BOSS技能更新 */
  private updatePurgatoryBossSkills(boss: Enemy, dt: number): void {
    const dtMs = dt * 1000;
    boss.bossSkillCooldown = (boss.bossSkillCooldown || 3000) - dtMs;

    // 血量阶段切换
    const healthPercent = boss.health / boss.maxHealth;
    if (healthPercent < 0.3 && boss.bossPhase === 1) {
      boss.bossPhase = 2;
      this.screenShake = 8;
      this.addBossBuff('enrage_2', 9999999);
    }

    this.updateBossStatusDisplay();

    if (boss.bossSkillCooldown <= 0) {
      this.purgatoryBossUseSkill(boss);
      boss.bossSkillCooldown = boss.bossPhase === 2 ? 2500 : 3500;
    }
  }

  /** 炼狱BOSS使用技能 */
  private purgatoryBossUseSkill(boss: Enemy): void {
    const bossType = (boss as any).purgatoryBossType as string;
    const skillId = randomInt(0, 2);
    const bossCx = boss.x + boss.width / 2;
    const bossCy = boss.y + boss.height / 2;
    const playerCx = this.player.x + this.player.width / 2;
    const playerCy = this.player.y + this.player.height / 2;

    switch (bossType) {
      case 'purgatory_fire': {
        // 灼炎领主
        if (skillId === 0) {
          // 火焰风暴：围绕BOSS发射环形火焰弹
          for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const bx = bossCx + Math.cos(angle) * 40;
            const by = bossCy + Math.sin(angle) * 40;
            const bullet = this.bulletPool.acquire(bx, by, Math.floor(boss.damage * 0.4)) as Bullet;
            (bullet as any).angle = angle;
            (bullet as any).speed = 200;
            (bullet as any).isEnemyBullet = true;
            bullet.trailColor = '#FF4500';
            bullet.element = 'fire';
            bullet.width = 8;
            bullet.height = 8;
          }
        } else if (skillId === 1) {
          // 烈焰冲击：朝玩家方向发射5发火焰弹扇形
          const baseAngle = Math.atan2(playerCy - bossCy, playerCx - bossCx);
          for (let i = -2; i <= 2; i++) {
            const angle = baseAngle + i * 0.2;
            const bullet = this.bulletPool.acquire(bossCx, bossCy, Math.floor(boss.damage * 0.5)) as Bullet;
            (bullet as any).angle = angle;
            (bullet as any).speed = 250;
            (bullet as any).isEnemyBullet = true;
            bullet.trailColor = '#FF6600';
            bullet.element = 'fire';
            bullet.width = 10;
            bullet.height = 10;
          }
        } else {
          // 陨石坠落：在玩家附近3个位置降下火焰
          for (let i = 0; i < 3; i++) {
            const tx = playerCx + (Math.random() - 0.5) * 200;
            const ty = playerCy + (Math.random() - 0.5) * 100;
            this.trackTimer(setTimeout(() => {
              if (!this.gameState.isGameOver) {
                this.spawnFireMeteor(tx, ty, Math.floor(boss.damage * 0.6));
              }
            }, (i * 300 + 500) as unknown as number) as unknown as number);
          }
        }
        break;
      }
      case 'purgatory_poison': {
        // 剧毒女王
        if (skillId === 0) {
          // 毒雾蔓延：发射6发毒弹
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.3;
            const bullet = this.bulletPool.acquire(bossCx, bossCy, Math.floor(boss.damage * 0.35)) as Bullet;
            (bullet as any).angle = angle;
            (bullet as any).speed = 150;
            (bullet as any).isEnemyBullet = true;
            bullet.trailColor = '#7B00FF';
            bullet.element = 'poison';
            bullet.width = 12;
            bullet.height = 12;
          }
        } else if (skillId === 1) {
          // 毒刺弹幕：朝玩家方向发射密集毒弹
          const baseAngle = Math.atan2(playerCy - bossCy, playerCx - bossCx);
          for (let i = 0; i < 8; i++) {
            const angle = baseAngle + (Math.random() - 0.5) * 0.5;
            const bullet = this.bulletPool.acquire(bossCx, bossCy, Math.floor(boss.damage * 0.3)) as Bullet;
            (bullet as any).angle = angle;
            (bullet as any).speed = 220 + Math.random() * 50;
            (bullet as any).isEnemyBullet = true;
            bullet.trailColor = '#9B00FF';
            bullet.element = 'poison';
            bullet.width = 6;
            bullet.height = 6;
          }
        } else {
          // 腐蚀之雨：在玩家上方区域投掷毒云
          for (let i = 0; i < 5; i++) {
            const tx = playerCx + (Math.random() - 0.5) * 250;
            const ty = playerCy - 100 - Math.random() * 50;
            const bullet = this.bulletPool.acquire(tx, ty, Math.floor(boss.damage * 0.4)) as Bullet;
            (bullet as any).angle = Math.PI / 2;
            (bullet as any).speed = 100;
            (bullet as any).isEnemyBullet = true;
            bullet.trailColor = '#7B00FF';
            bullet.element = 'poison';
            bullet.width = 10;
            bullet.height = 10;
          }
        }
        break;
      }
      case 'purgatory_ice': {
        // 极寒君王
        if (skillId === 0) {
          // 冰锥突刺：从地面发射冰锥弹幕
          for (let i = 0; i < 10; i++) {
            const tx = bossCx - 100 + i * 30;
            const ty = this.config.groundY + (this.config.canvasHeight - this.config.groundY) / 2;
            const bullet = this.bulletPool.acquire(tx, ty, Math.floor(boss.damage * 0.4)) as Bullet;
            (bullet as any).angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
            (bullet as any).speed = 180;
            (bullet as any).isEnemyBullet = true;
            bullet.trailColor = '#00BFFF';
            bullet.element = 'ice';
            bullet.width = 8;
            bullet.height = 8;
          }
        } else if (skillId === 1) {
          // 冰晶散射：向四周发射冰弹
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const bullet = this.bulletPool.acquire(bossCx, bossCy, Math.floor(boss.damage * 0.35)) as Bullet;
            (bullet as any).angle = angle;
            (bullet as any).speed = 170;
            (bullet as any).isEnemyBullet = true;
            bullet.trailColor = '#00CCFF';
            bullet.element = 'ice';
            bullet.width = 8;
            bullet.height = 8;
          }
        } else {
          // 冰冻射线：朝玩家方向发射大冰弹
          const baseAngle = Math.atan2(playerCy - bossCy, playerCx - bossCx);
          for (let i = -1; i <= 1; i++) {
            const angle = baseAngle + i * 0.1;
            const bullet = this.bulletPool.acquire(bossCx, bossCy, Math.floor(boss.damage * 0.5)) as Bullet;
            (bullet as any).angle = angle;
            (bullet as any).speed = 200;
            (bullet as any).isEnemyBullet = true;
            bullet.trailColor = '#00BFFF';
            bullet.element = 'ice';
            bullet.width = 14;
            bullet.height = 14;
          }
        }
        break;
      }
      case 'purgatory_lightning': {
        // 雷霆主宰
        if (skillId === 0) {
          // 雷击：在玩家位置周围劈下雷电
          for (let i = 0; i < 4; i++) {
            const tx = playerCx + (Math.random() - 0.5) * 150;
            const ty = playerCy + (Math.random() - 0.5) * 80;
            this.trackTimer(setTimeout(() => {
              if (!this.gameState.isGameOver) {
                this.spawnLightningStrike(tx, ty, Math.floor(boss.damage * 0.5));
              }
            }, (i * 200) as unknown as number) as unknown as number);
          }
        } else if (skillId === 1) {
          // 电磁脉冲：向四周发射快速雷电弹
          for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const bullet = this.bulletPool.acquire(bossCx, bossCy, Math.floor(boss.damage * 0.3)) as Bullet;
            (bullet as any).angle = angle;
            (bullet as any).speed = 280;
            (bullet as any).isEnemyBullet = true;
            bullet.trailColor = '#FFD700';
            bullet.element = 'lightning';
            bullet.width = 6;
            bullet.height = 6;
          }
        } else {
          // 连锁闪电：朝玩家方向发射3发快速雷电弹
          const baseAngle = Math.atan2(playerCy - bossCy, playerCx - bossCx);
          for (let i = 0; i < 3; i++) {
            const angle = baseAngle + (i - 1) * 0.15;
            const bullet = this.bulletPool.acquire(bossCx, bossCy, Math.floor(boss.damage * 0.6)) as Bullet;
            (bullet as any).angle = angle;
            (bullet as any).speed = 300;
            (bullet as any).isEnemyBullet = true;
            bullet.trailColor = '#FFFF00';
            bullet.element = 'lightning';
            bullet.width = 8;
            bullet.height = 8;
          }
        }
        break;
      }
    }
  }

  /** 火焰陨石效果 */
  private spawnFireMeteor(x: number, y: number, damage: number): void {
    // 在目标位置创建爆炸效果
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const bullet = this.bulletPool.acquire(x, y, damage) as Bullet;
      (bullet as any).angle = angle;
      (bullet as any).speed = 120;
      (bullet as any).isEnemyBullet = true;
      bullet.trailColor = '#FF4500';
      bullet.element = 'fire';
      bullet.width = 8;
      bullet.height = 8;
    }
    // 粒子效果
    for (let i = 0; i < 8; i++) {
      this.particlePool.acquire(x, y, '#FF6600');
    }
    this.screenShake = Math.max(this.screenShake, 5);
  }

  /** 雷电劈击效果 */
  private spawnLightningStrike(x: number, y: number, damage: number): void {
    // 在目标位置创建雷电效果
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const bullet = this.bulletPool.acquire(x, y, damage) as Bullet;
      (bullet as any).angle = angle;
      (bullet as any).speed = 150;
      (bullet as any).isEnemyBullet = true;
      bullet.trailColor = '#FFFF00';
      bullet.element = 'lightning';
      bullet.width = 6;
      bullet.height = 6;
    }
    for (let i = 0; i < 6; i++) {
      this.particlePool.acquire(x, y, '#FFD700');
    }
    this.screenShake = Math.max(this.screenShake, 4);
  }

  /** 生成炼狱模式奖励装备 */
  private generatePurgatoryRewards(): void {
    const playerLevel = this.player.level;
    const bossElement = this.modeData.purgatoryBossElement as ElementType | null;
    const rewards: Equipment[] = [];

    // 1件保底装备：同等级、精致品质以上、带有BOSS同种属性词条
    if (bossElement) {
      const guaranteedRarities: EquipRarity[] = ['fine', 'legendary', 'epic', 'mythic'];
      const rarity = guaranteedRarities[Math.floor(Math.random() * guaranteedRarities.length)];
      const slots: EquipSlot[] = ['weapon', 'armor', 'pants', 'shoulder', 'belt', 'shoes', 'earring', 'ring', 'necklace'];
      const slot = slots[Math.floor(Math.random() * slots.length)];
      const equip = createEquipment(slot, rarity, playerLevel);
      // 确保装备带有BOSS同种属性词条
      if (!equip.affixes) equip.affixes = [];
      const hasElementalAttack = equip.affixes.some(a => a.type === 'elementalAttack' && a.element === bossElement);
      if (!hasElementalAttack) {
        const elemNames: Record<string, string> = { fire: '火焰攻击', ice: '寒冰攻击', lightning: '雷电攻击', poison: '毒素攻击' };
        equip.affixes.push({
          id: `affix_${bossElement}_atk`,
          name: elemNames[bossElement] || '属性攻击',
          type: 'elementalAttack',
          element: bossElement,
          value: Math.max(8, Math.floor(8 * (1 + playerLevel * 0.05))),
        });
      }
      rewards.push(equip);
    }

    // 随机4件装备
    for (let i = 0; i < 4; i++) {
      const { rarities, weights } = getRarityDropWeights(playerLevel);
      let rarity = rarities[0];
      let roll = Math.random();
      for (let j = 0; j < rarities.length; j++) {
        roll -= weights[j] / weights.reduce((a, b) => a + b, 0);
        if (roll <= 0) { rarity = rarities[j]; break; }
      }
      const slots: EquipSlot[] = ['weapon', 'armor', 'pants', 'shoulder', 'belt', 'shoes', 'earring', 'ring', 'necklace'];
      const slot = slots[Math.floor(Math.random() * slots.length)];
      rewards.push(createEquipment(slot, rarity as EquipRarity, playerLevel));
    }

    this.modeData.purgatoryRewards = rewards;
  }

  /** 生成材料副本奖励（5个：宝石或强化道具，根据品质调整概率） */
  private generateMaterialRewards(): void {
    const rewards: ItemStack[] = [];

    // 奖励池：宝石 + 强化道具，品质越高权重越低
    const pool: Array<{ itemId: string; weight: number }> = [
      // 宝石 - 普通品质（各类型权重高）
      { itemId: 'gem_attack_common', weight: 12 },
      { itemId: 'gem_health_common', weight: 12 },
      { itemId: 'gem_defense_common', weight: 10 },
      { itemId: 'gem_critRate_common', weight: 10 },
      { itemId: 'gem_resistance_common', weight: 10 },
      // 宝石 - 高级品质（权重降低）
      { itemId: 'gem_attack_advanced', weight: 4 },
      { itemId: 'gem_health_advanced', weight: 4 },
      { itemId: 'gem_defense_advanced', weight: 3 },
      { itemId: 'gem_critRate_advanced', weight: 3 },
      { itemId: 'gem_resistance_advanced', weight: 3 },
      // 强化道具 - 按品质递减
      { itemId: 'enhance_normal_booster', weight: 8 },   // 普通
      { itemId: 'enhance_scroll_plus2', weight: 4 },      // 精致
      { itemId: 'enhance_ancient_booster', weight: 2 },   // 史诗
      { itemId: 'enhance_scroll_plus1', weight: 1 },      // 神话
    ];

    const totalWeight = pool.reduce((s, p) => s + p.weight, 0);

    // 生成5个奖励，相同物品合并堆叠
    for (let i = 0; i < 5; i++) {
      let roll = Math.random() * totalWeight;
      let chosen = pool[0];
      for (const item of pool) {
        roll -= item.weight;
        if (roll <= 0) { chosen = item; break; }
      }
      const existing = rewards.find(r => r.itemId === chosen.itemId);
      if (existing) {
        existing.count++;
      } else {
        rewards.push({ itemId: chosen.itemId, count: 1 });
      }
    }

    this.modeData.materialRewards = rewards;
  }

  private updateDailyMode(dt: number): void {
    const dtMs = dt * 1000;
    // 日常挑战跳过 updateWave，需在此处衰减 BOSS/精英来袭提示计时器
    if (this.gameState.showEliteBossNotice) {
      this.gameState.eliteBossNoticeTimer -= dtMs;
      if (this.gameState.eliteBossNoticeTimer <= 0) {
        this.gameState.showEliteBossNotice = false;
      }
    }

    const phase = this.modeData.dailyPhase as string;
    if (phase !== 'fight') return;

    // 持续刷怪（场上最多保留 30 只普通怪，避免过于拥挤）
    const activeNormals = this.enemyPool.getActive().filter(e => e.active && !e.isElite && !e.isBoss && !(e as any).isSandbag && !(e as any).isMonsterSandbag).length;
    if (activeNormals < 30) {
      this.modeData.dailySpawnTimer -= dtMs;
      if (this.modeData.dailySpawnTimer <= 0) {
        this.spawnDailyEnemy();
        this.modeData.dailySpawnTimer = this.modeData.dailySpawnInterval;
      }
    }

    // 检查精英刷新阈值
    const totalKills = this.modeData.dailyNormalKills + this.modeData.dailyEliteKills + this.modeData.dailyBossKills;
    if (totalKills >= this.modeData.dailyNextEliteKill) {
      this.spawnDailyElite();
      this.modeData.dailyNextEliteKill += 50;
    }

    // 检查BOSS刷新阈值
    if (totalKills >= this.modeData.dailyNextBossKill) {
      this.spawnDailyBoss();
      this.modeData.dailyNextBossKill += 100;
    }
  }

  /** 日常挑战：刷新普通怪（使用玩家等级作为波次强度） */
  private spawnDailyEnemy(): void {
    const wave = Math.max(1, this.player.level);
    const baseTypes = NORMAL_ENEMY_TYPES.slice(0, Math.min(2 + Math.floor(wave / 3), 6));
    let pool = [...baseTypes];
    if (wave >= 3 && Math.random() < 1 / 3) pool.push('ranged_shooter');
    if (wave >= 5) pool.push('assassin');
    const type = pool[randomInt(0, pool.length - 1)];
    const enemy = this.enemyPool.acquire(type, wave) as Enemy;

    // 强度档位：每击杀50只普通怪提升1档，每档各项数值+20%
    const tier = Math.floor((this.modeData.dailyNormalKills as number) / 50);
    this.modeData.dailyStrengthTier = tier;
    if (tier > 0) {
      const mult = 1 + 0.2 * tier;
      enemy.maxHealth = Math.floor(enemy.maxHealth * mult);
      enemy.health = enemy.maxHealth;
      enemy.damage = Math.floor(enemy.damage * mult);
      enemy.attack = Math.floor(enemy.attack * mult);
      enemy.defense = Math.floor(enemy.defense * mult);
      // 移速不强化（已经5倍速），强化攻速、暴击等
      enemy.attackSpeed = Math.floor(enemy.attackSpeed * mult);
      enemy.critRate = Math.min(100, enemy.critRate * mult);
      enemy.critDamage = Math.floor(enemy.critDamage * mult);
      enemy.lifestealPercent = enemy.lifestealPercent * mult;
      enemy.exp = Math.floor(enemy.exp * mult);
    }
  }

  /** 日常挑战：刷新精英怪 */
  private spawnDailyElite(): void {
    const wave = Math.max(1, this.player.level);
    const idx = Math.min(Math.floor(wave / 10), ELITE_ENEMY_TYPES.length - 1);
    const type = ELITE_ENEMY_TYPES[idx];
    this.enemyPool.acquire(type, wave);
    this.gameState.eliteBossNoticeType = 'elite';
    this.gameState.showEliteBossNotice = true;
    this.gameState.eliteBossNoticeTimer = 2000;
  }

  /** 日常挑战：刷新BOSS */
  private spawnDailyBoss(): void {
    const wave = Math.max(1, this.player.level);
    const idx = Math.min(Math.floor(wave / 20), BOSS_ENEMY_TYPES.length - 1);
    const type = BOSS_ENEMY_TYPES[idx];
    const boss = this.enemyPool.acquire(type, wave) as Enemy;
    this.gameState.bossActive = true;
    this.gameState.bossHealth = boss.health;
    this.gameState.bossMaxHealth = boss.maxHealth;
    this.gameState.bossName = boss.name;
    this.gameState.eliteBossNoticeType = 'boss';
    this.gameState.showEliteBossNotice = true;
    this.gameState.eliteBossNoticeTimer = 2000;
    if (this.onBossSpawn) {
      this.onBossSpawn(boss.name, boss.health, boss.maxHealth);
    }
  }

  private updateMaterialMode(dt: number): void {
    const dtMs = dt * 1000;
    // 材料副本跳过 updateWave，需在此处衰减 BOSS/精英来袭提示计时器
    if (this.gameState.showEliteBossNotice) {
      this.gameState.eliteBossNoticeTimer -= dtMs;
      if (this.gameState.eliteBossNoticeTimer <= 0) {
        this.gameState.showEliteBossNotice = false;
      }
    }

    const phase = this.modeData.materialPhase as string;
    if (phase !== 'fight') return;

    const enemies = this.enemyPool.getActive();
    const boss = enemies.find(e => (e as any).isMaterialBoss);
    if (boss) {
      this.gameState.bossHealth = boss.health;
      // BOSS被击败 → 进入结算
      if (boss.health <= 0) {
        this.enemyPool.release(boss);
        this.modeData.materialPhase = 'settlement';
        this.gameState.bossActive = false;
        this.gameState.bossHealth = 0;
        this.modeVictory = true;
        this.gameState.isGameOver = true;
        // 生成奖励（宝石或强化类道具，根据品质调整概率）
        this.generateMaterialRewards();
        // 记录今日挑战次数
        this.incrementMaterialChallenge();
        // 立即同步状态到 React，绕过节流机制
        if (this.onStateChange) {
          this.onStateChange(this.gameState, this.player);
        }
        if (this.onPlayerChange) {
          this.onPlayerChange(this.player);
        }
      }
    }
  }

  private updateMirrorMode(dt: number): void {
    const dtMs = dt * 1000;
    const enemies = this.enemyPool.getActive();
    const mirror = enemies.find(e => (e as any).isMirror);

    if (!mirror || mirror.health <= 0) {
      this.modeVictory = true;
      this.gameState.isGameOver = true;
      return;
    }

    this.gameState.bossHealth = mirror.health;

    (mirror as any).shootCooldown -= dtMs;
    if ((mirror as any).shootCooldown <= 0) {
      this.mirrorShoot(mirror);
      (mirror as any).shootCooldown = mirror.attackSpeed;
    }

    const playerCx = this.player.x + this.player.width / 2;
    const mirrorCx = mirror.x + mirror.width / 2;
    const targetDist = 180;
    if (Math.abs(playerCx - mirrorCx) > targetDist + 20) {
      mirror.x -= mirror.speed * (mirrorCx > playerCx ? 1 : -1);
    } else if (Math.abs(playerCx - mirrorCx) < targetDist - 20) {
      mirror.x += mirror.speed * (mirrorCx > playerCx ? 1 : -1);
    }

    const playerCy = this.player.y + this.player.height / 2;
    const mirrorCy = mirror.y + mirror.height / 2;
    if (Math.abs(playerCy - mirrorCy) > 5) {
      mirror.y += mirror.speed * 0.5 * (mirrorCy > playerCy ? -1 : 1);
    }

    mirror.x = Math.max(this.config.canvasWidth * 0.3, Math.min(this.config.canvasWidth - 50, mirror.x));
    mirror.y = Math.max(this.config.groundY + 10, Math.min(this.config.canvasHeight - 60, mirror.y));

    (mirror as any).mirrorAnimFrame++;
  }

  private mirrorShoot(mirror: Enemy): void {
    const bulletX = mirror.x;
    const bulletY = mirror.y + mirror.height / 2;
    const angle = Math.atan2(
      this.player.y + this.player.height / 2 - bulletY,
      this.player.x + this.player.width / 2 - bulletX
    );

    const bullet = this.bulletPool.acquire(bulletX, bulletY, mirror.damage) as Bullet;
    (bullet as any).angle = angle;
    (bullet as any).speed = 200;
    (bullet as any).isEnemyBullet = true;
    bullet.trailColor = '#FF6B6B';
    bullet.element = 'physical';
  }

  private updateGuardMode(dt: number): void {
    const enemies = this.enemyPool.getActive();
    const baseX = 30;

    for (const enemy of enemies) {
      if (enemy.x <= baseX + 40 && enemy.active) {
        const dmgPerSec = enemy.damage * 2;
        this.guardBaseHealth -= dmgPerSec * dt;

        if (this.guardBaseHealth <= 0) {
          this.guardBaseHealth = 0;
          this.modeFailed = true;
          this.gameState.isGameOver = true;
          return;
        }
      }
    }
  }

  private updateHomeDefenseMode(dt: number): void {
    const enemies = this.enemyPool.getActive();
    const baseX = 20;

    for (const enemy of enemies) {
      if (enemy.x <= baseX + 30 && enemy.active) {
        const dmgPerSec = enemy.damage * 1.5;
        this.homeBaseHealth -= dmgPerSec * dt;

        if (this.homeBaseHealth <= 0) {
          this.homeBaseHealth = 0;
          this.modeFailed = true;
          this.gameState.isGameOver = true;
          return;
        }
      }
    }
  }

  private updateHomeTowers(dt: number): void {
    if (this.gameMode !== 'homedefense') return;
    for (const tower of this.homeTowers) {
      tower.lastShot -= dt * 1000;
      if (tower.lastShot <= 0) {
        const enemies = this.getSortedRightEnemies(tower.x);
        if (enemies.length > 0) {
          const target = enemies[0];
          const angle = Math.atan2(target.y + target.height / 2 - tower.y, target.x + target.width / 2 - tower.x);
          const bullet = this.bulletPool.acquire(tower.x, tower.y, tower.damage) as Bullet;
          (bullet as any).angle = angle;
          (bullet as any).speed = 250;
          (bullet as any).isTowerBullet = true;
          bullet.trailColor = '#FFD700';
          tower.lastShot = tower.cooldown;
        }
      }
    }
  }

  stop(): void {
    this.gameState.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clearTrackedTimers();
  }

  // 返回主界面时调用：清空战斗残留状态（debuffs/buffs/满血），避免主界面显示低血量或下次进战斗残留 DoT
  resetPlayerForMenu(): void {
    this.stop();

    // 1. 清空所有怪物/掉落物/子弹/粒子/伤害数字
    for (const enemy of this.enemyPool.getActive()) {
      this.enemyPool.release(enemy);
    }
    for (const bullet of this.bulletPool.getActive()) {
      this.bulletPool.release(bullet);
    }
    for (const drop of this.dropPool.getActive()) {
      this.dropPool.release(drop);
    }
    for (const particle of this.particlePool.getActive()) {
      this.particlePool.release(particle);
    }
    for (const dn of this.damageNumberPool.getActive()) {
      this.damageNumberPool.release(dn);
    }
    this.weatherParticles = [];
    this.weather.type = 'clear';
    this.weather.intensity = 0;

    // 2. 清空玩家战斗状态
    this.playerDebuffs = [];
    this.buffs = [];
    this.player.health = this.player.maxHealth;
    this.player.invincibleTimer = 0;
    this.player.isDodging = false;
    this.shieldActive = false;

    // 3. 重置游戏状态
    this.gameState.isGameOver = false;
    this.gameState.isPaused = false;
    this.gameState.isRunning = false;
    this.gameState.bossActive = false;
    this.gameState.bossHealth = 0;
    this.gameState.bossMaxHealth = 0;
    this.gameState.bossName = '';
    this.clearBossStatus();
    this.gameState.currentWave = 0;
    this.gameState.waveEnemiesSpawned = 0;
    this.gameState.waveEnemiesRemaining = 0;
    this.gameState.waveEnemiesTotal = 0;
    this.gameState.waveInterval = 0;
    this.gameState.waveSpawnTimer = 0;
    this.gameState.waveNoticeTimer = 0;
    this.gameState.betweenWaves = false;
    this.gameState.betweenWaveTimer = 0;

    // 4. 立即同步给 UI
    if (this.onStateChange) {
      this.onStateChange(this.gameState, this.player);
    }
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }
    if (this.onBuffsChange) {
      this.onBuffsChange([]);
    }
  }

  pause(): void {
    this.gameState.isPaused = true;
  }

  resume(): void {
    this.gameState.isPaused = false;
    this.lastTime = performance.now();
  }

  restartCurrentWave(): void {
    const wave = this.gameState.currentWave;
    this.player.health = this.player.maxHealth;
    this.gameState.isGameOver = false;
    this.gameState.isPaused = false;
    this.gameState.bossActive = false;
    this.gameState.bossHealth = 0;
    this.gameState.bossMaxHealth = 0;
    this.gameState.bossName = '';

    for (const enemy of this.enemyPool.getActive()) {
      this.enemyPool.release(enemy);
    }
    for (const bullet of this.bulletPool.getActive()) {
      this.bulletPool.release(bullet);
    }
    for (const drop of this.dropPool.getActive()) {
      this.dropPool.release(drop);
    }
    for (const particle of this.particlePool.getActive()) {
      this.particlePool.release(particle);
    }
    for (const dn of this.damageNumberPool.getActive()) {
      this.damageNumberPool.release(dn);
    }
    this.weatherParticles = [];
    this.weather.type = 'clear';
    this.weather.intensity = 0;
    this.buffs = [];
    this.playerDebuffs = [];

    this.gameState.currentWave = wave - 1;
    this.gameState.betweenWaves = false;
    this.gameState.waveEnemiesSpawned = 0;
    this.gameState.waveEnemiesRemaining = this.getWaveEnemyCount();
    this.gameState.waveSpawnTimer = 800;
    this.gameState.waveInterval = Math.max(800, 1200 - wave * 30);
    this.gameState.showWaveNotice = true;
    this.gameState.waveNoticeTimer = 2000;
    this.gameState.currentWave = wave;
    this.waveKillCount = 0;
    this.eliteBossSpawnedThisWave = false;
    this.gameState.eliteBossPending = false;
    this.gameState.eliteBossSpawnTimer = 0;
    this.gameState.showEliteBossNotice = false;
    this.gameState.eliteBossNoticeTimer = 0;
    this.gameState.eliteBossNoticeType = null;

    this.lastTime = performance.now();

    if (this.onStateChange) {
      this.onStateChange(this.gameState, this.player);
    }
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }
    if (this.onWeatherChange) {
      this.onWeatherChange({ ...this.weather });
    }
    if (this.onWaveChange) {
      this.onWaveChange(wave);
    }
  }

  // 统一触发游戏结束：设置标志位 + 立即同步状态给 React（避免节流导致 UI 收不到通知）
  private triggerGameOver(): void {
    if (this.gameState.isGameOver) return; // 已结束则不重复触发
    this.gameState.isGameOver = true;
    this.player.health = 0; // 确保 blood 不为负
    if (this.onStateChange) {
      this.onStateChange(this.gameState, this.player);
    }
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }
  }

  private gameLoop = (): void => {
    if (!this.gameState.isRunning) return;

    try {
      const currentTime = performance.now();
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      if (!this.gameState.isPaused && !this.gameState.isGameOver) {
        this.update(deltaTime);
      }

      this.animFrame++;
      if (this.muzzleFlashTimer > 0) this.muzzleFlashTimer--;

      this.render();
    } catch (err) {
      // 异常捕获：确保 rAF 链不中断，避免游戏永久冻结
      console.error('[GameEngine] gameLoop error:', err);
    }

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(dt: number): void {
    // 性能优化：每帧标记排序列表脏数据，shoot/updateClones 复用缓存
    this._sortedEnemiesDirty = true;
    // 准星计时：到0自动消失，角色恢复自动攻击
    if (this.hasAim) {
      this.aimExpireTimer -= dt * 1000;
      if (this.aimExpireTimer <= 0) {
        this.hasAim = false;
      }
    }
    this.updateStars(dt);
    this.updateParallax(dt);
    this.updateWeather(dt);
    this.updateBuffs(dt);
    this.updateSkills(dt);
    this.updateActiveSkills(dt);
    this.updateMode(dt);
    // 炼狱模式不使用波次系统
    if (this.gameMode !== 'purgatory') {
      this.updateWave(dt);
    }
    this.updateShooting(dt);
    this.updateBullets(dt);
    this.updateEnemies(dt);
    this.updateDrops(dt);
    this.updateParticles(dt);
    this.updateDamageNumbers(dt);
    this.checkCollisions();
    this.updateScreenShake(dt);
    this.updatePlayerRegen(dt);
    this.updatePlayerDebuffs(dt);
    this.updateDodge(dt);
    this.updateDrone(dt);
    this.updateClones(dt);
    this.updateHomeTowers(dt);
    // 在线奖励计时已改为独立 setInterval，不在此处调用

    // 更新剩余怪物数
    this.gameState.waveEnemiesRemaining = this.getWaveRemainingCount();

    // 统一监听血量：任何伤害导致 hp<=0 时，clamp 到 0 并触发游戏结束（弹出继续挑战界面）
    if (this.player.health <= 0 && !this.gameState.isGameOver) {
      this.player.health = 0;
      this.triggerGameOver();
    }

    // 节流 React 状态同步：100ms 一次（每秒 10 次，足够 UI 显示）
    this.stateSyncTimer += dt;
    if (this.stateSyncTimer >= 0.1) {
      this.stateSyncTimer = 0;
      if (this.onStateChange) {
        this.onStateChange(this.gameState, this.player);
      }
    }

    // buffs 只在内容变化时同步
    if (this.onBuffsChange) {
      const sig = this.buffs.map(b => `${b.type}:${b.duration.toFixed(0)}`).join('|');
      if (sig !== this.buffsSignature) {
        this.buffsSignature = sig;
        this.onBuffsChange([...this.buffs]);
      }
    }
  }

  private updatePlayerRegen(dt: number): void {
    const regenPerSec = (this.player as any).regenPerSec || 0;
    if (regenPerSec > 0 && this.player.health < this.player.maxHealth) {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + this.player.maxHealth * regenPerSec * dt);
    }
  }

  // 需求 #8：玩家debuff更新（灼伤/中毒DoT + 计时递减）
  private updatePlayerDebuffs(dt: number): void {
    const dtMs = dt * 1000;
    const playerInvincible = this.shieldActive || this.player.invincibleTimer > 0 || this.player.isDodging;
    for (let i = this.playerDebuffs.length - 1; i >= 0; i--) {
      const d = this.playerDebuffs[i];
      d.remaining -= dtMs;
      d.tickTimer -= dtMs;
      // DoT：灼伤/中毒每0.5秒造成伤害（数值随玩家最大生命动态变化）
      if ((d.type === 'burn' || d.type === 'poison') && d.tickTimer <= 0 && !playerInvincible) {
        d.tickTimer = 500;
        const dotDamage = this.player.maxHealth * d.value * 0.005; // value=百分比，每tick扣value*0.5%最大生命
        // 实际扣血量 clamp 到当前剩余血量，避免伤害数字显示超过剩余血量
        const actualDamage = Math.min(dotDamage, this.player.health);
        this.player.health -= actualDamage;
        // 血量监听统一在 update() 中处理，无需此处重复判断
        // DoT粒子
        const color = d.type === 'burn' ? '#FF5540' : '#00CC00';
        this.particlePool.acquire(
          this.player.x + this.player.width / 2 + (Math.random() - 0.5) * 12,
          this.player.y + (Math.random() - 0.5) * 16,
          color
        );
      }
      if (d.remaining <= 0) {
        this.playerDebuffs.splice(i, 1);
      }
    }
  }

  // 需求 #8：精英/BOSS接触玩家时施加debuff（数值随玩家当前属性动态变化）
  private applyEliteBossDebuff(enemy: Enemy): void {
    if (!enemy.isElite && !enemy.isBoss) return;
    // BOSS有更高几率和更强debuff
    const isBoss = enemy.isBoss;
    const debuffChance = isBoss ? 0.35 : 0.15;
    if (Math.random() > debuffChance) return;

    const debuffTypes: ('burn' | 'poison' | 'attackSpeedDown' | 'bulletSpeedDown' | 'rangeDown' | 'stun')[] =
      ['burn', 'poison', 'attackSpeedDown', 'bulletSpeedDown', 'rangeDown', 'stun'];
    const chosen = debuffTypes[Math.floor(Math.random() * debuffTypes.length)];

    let duration = 0;
    let value = 0;
    switch (chosen) {
      case 'burn':
      case 'poison':
        // 持续伤害：BOSS 3-5%最大生命/秒，精英 2-3%，持续3-5秒
        duration = (isBoss ? 4000 : 3000) + Math.random() * 1000;
        value = isBoss ? 3 + Math.random() * 2 : 2 + Math.random();
        break;
      case 'attackSpeedDown':
        // 攻速降低：BOSS 50%，精英 30%，持续3-4秒
        duration = (isBoss ? 4000 : 3000) + Math.random() * 1000;
        value = isBoss ? 50 : 30;
        break;
      case 'bulletSpeedDown':
        // 射速降低：BOSS 40%，精英 25%，持续3-4秒
        duration = (isBoss ? 4000 : 3000) + Math.random() * 1000;
        value = isBoss ? 40 : 25;
        break;
      case 'rangeDown':
        // 射程降低：BOSS 40%，精英 25%，持续3-5秒
        duration = (isBoss ? 5000 : 3000) + Math.random() * 1000;
        value = isBoss ? 40 : 25;
        break;
      case 'stun':
        // 定身：BOSS 1.5-2.5秒，精英 1-1.5秒
        duration = (isBoss ? 1500 : 1000) + Math.random() * (isBoss ? 1000 : 500);
        value = 0;
        break;
    }

    // 同类debuff刷新（取更强/更长）
    const existing = this.playerDebuffs.find(d => d.type === chosen);
    if (existing) {
      existing.remaining = Math.max(existing.remaining, duration);
      existing.duration = Math.max(existing.duration, duration);
      existing.value = Math.max(existing.value, value);
      existing.tickTimer = 500;
    } else {
      this.playerDebuffs.push({ type: chosen, remaining: duration, duration, value, tickTimer: 500 });
    }
  }

  // 获取玩家debuff乘数（用于updateShooting）
  private getPlayerDebuffMultiplier(type: 'attackSpeedDown' | 'bulletSpeedDown' | 'rangeDown'): number {
    const d = this.playerDebuffs.find(d => d.type === type);
    return d ? (1 - d.value / 100) : 1;
  }

  private isPlayerStunned(): boolean {
    return this.playerDebuffs.some(d => d.type === 'stun');
  }

  private updateStars(dt: number): void {
    for (const star of this.stars) {
      star.x -= star.speed * dt;
      if (star.x < 0) {
        star.x = this.config.canvasWidth;
        star.y = Math.random() * this.config.canvasHeight;
      }
    }
  }

  private updateParallax(dt: number): void {
    for (const layer of this.parallaxLayers) {
      layer.offset += layer.speed * dt;
      const totalWidth = this.config.canvasWidth * 2;
      if (layer.offset > totalWidth) {
        layer.offset = 0;
      }
    }
  }

  private updateWeather(dt: number): void {
    const dtMs = dt * 1000;
    const wave = this.gameState.currentWave;
    const isSpecialWave = wave % 5 === 0;
    const activeEliteOrBoss = this.enemyPool.getActive().find(e => e.isElite || e.isBoss);

    if (isSpecialWave && activeEliteOrBoss && this.weather.type === 'clear') {
      const configKey = (activeEliteOrBoss as any).configKey;
      const config = ENEMY_CONFIGS[configKey];
      if (config && config.weatherType) {
        this.weather.type = config.weatherType;
        this.weather.duration = 999999;
        this.weather.intensity = 0;
        this.weather.transitionTimer = 2000;
        if (this.onWeatherChange) {
          this.onWeatherChange({ ...this.weather });
        }
      }
    }

    if (!activeEliteOrBoss && this.weather.type !== 'clear') {
      this.weather.transitionTimer = 2000;
      this.weather.intensity = Math.max(0, this.weather.intensity - dt * 0.5);
      if (this.weather.intensity <= 0) {
        this.weather.type = 'clear';
        this.weather.duration = 999999;
        if (this.onWeatherChange) {
          this.onWeatherChange({ ...this.weather });
        }
      }
      this.updateWeatherParticles(dt);
      return;
    }

    if (this.weather.transitionTimer > 0 && this.weather.type !== 'clear') {
      this.weather.transitionTimer -= dtMs;
      this.weather.intensity = Math.min(1, this.weather.intensity + dt * 0.5);
    }

    if (this.weather.type !== 'clear' && this.weather.intensity > 0.3) {
      this.spawnWeatherParticle();
      this.applyWeatherEffects(dt);
    }

    this.updateWeatherParticles(dt);
  }

  private spawnWeatherParticle(): void {
    if (this.weatherParticles.length >= 120) return;

    const { canvasWidth, canvasHeight } = this.config;
    let vx = -100, vy = 200, size = 2;

    switch (this.weather.type) {
      case 'rain':
        vx = -30 + Math.random() * -20;
        vy = 400 + Math.random() * 150;
        size = 1 + Math.random() * 1.5;
        break;
      case 'acid_rain':
        vx = -50 + Math.random() * -30;
        vy = 300 + Math.random() * 100;
        size = 1 + Math.random() * 2;
        break;
      case 'sandstorm':
        vx = -200 + Math.random() * -100;
        vy = 20 + Math.random() * 40;
        size = 2 + Math.random() * 3;
        break;
      case 'thunderstorm':
        vx = -40 + Math.random() * -30;
        vy = 450 + Math.random() * 150;
        size = 1.5 + Math.random() * 2;
        break;
      case 'snow':
        vx = -20 + Math.random() * 40;
        vy = 80 + Math.random() * 60;
        size = 2 + Math.random() * 3;
        break;
      case 'radiation':
        vx = -20 + Math.random() * -20;
        vy = 50 + Math.random() * 50;
        size = 3 + Math.random() * 3;
        break;
      case 'fog':
        vx = -15 + Math.random() * 10;
        vy = 10 + Math.random() * 20;
        size = 4 + Math.random() * 5;
        break;
      case 'heat_wave':
        vx = -10 + Math.random() * 20;
        vy = -30 + Math.random() * 20;
        size = 3 + Math.random() * 4;
        break;
    }

    this.weatherParticles.push({
      x: Math.random() * (canvasWidth + 100),
      y: Math.random() * canvasHeight,
      vx,
      vy,
      size,
      life: 3 + Math.random() * 2,
    });
  }

  private updateWeatherParticles(dt: number): void {
    const { canvasWidth, canvasHeight } = this.config;
    for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
      const p = this.weatherParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      // 粒子离开画面后在另一侧重新生成，确保持续覆盖整个画面
      if (p.y > canvasHeight) {
        p.y = -10;
        p.x = Math.random() * canvasWidth;
      }
      if (p.x < -50) {
        p.x = canvasWidth + Math.random() * 50;
        p.y = Math.random() * canvasHeight;
      }
      if (p.life <= 0) {
        this.weatherParticles.splice(i, 1);
      }
    }
  }

  private applyWeatherEffects(dt: number): void {
    const intensity = this.weather.intensity;
    
    switch (this.weather.type) {
      case 'rain': {
        const dmg = Math.min(1.5 * intensity * dt, this.player.health);
        this.player.health -= dmg;
        break;
      }
      case 'acid_rain': {
        const dmg = Math.min(2 * intensity * dt, this.player.health);
        this.player.health -= dmg;
        break;
      }
      case 'sandstorm':
        break;
      case 'thunderstorm':
        if (Math.random() < 0.002 * intensity * dt * 60) {
          const dmg = Math.min(8 * intensity, this.player.health);
          this.player.health -= dmg;
        }
        break;
      case 'snow':
        break;
      case 'radiation': {
        const dmg = Math.min(1 * intensity * dt, this.player.health);
        this.player.health -= dmg;
        break;
      }
      case 'heat_wave': {
        const dmg = Math.min(1 * intensity * dt, this.player.health);
        this.player.health -= dmg;
        break;
      }
      case 'fog':
        break;
    }
    // 血量监听统一在 update() 中处理，无需此处重复判断
  }

  private updateActiveSkills(dt: number): void {
    const dtMs = dt * 1000;
    for (const skill of this.activeSkills) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown = Math.max(0, skill.currentCooldown - dtMs);
      }
    }
    for (const key of Object.keys(this.itemCooldowns)) {
      this.itemCooldowns[key].remaining = Math.max(0, this.itemCooldowns[key].remaining - dtMs);
      if (this.itemCooldowns[key].remaining <= 0) {
        delete this.itemCooldowns[key];
      }
    }
    // 定时技能药水衰减：到时清除对应 active 状态
    if (this.timedPotionEffects.length > 0) {
      for (let i = this.timedPotionEffects.length - 1; i >= 0; i--) {
        const p = this.timedPotionEffects[i];
        p.remaining = Math.max(0, p.remaining - dtMs);
        if (p.remaining <= 0) {
          // 清除对应技能状态
          if (p.type === 'laser') {
            this.laserActive = false;
            this.laserDuration = 0;
          } else if (p.type === 'sweep') {
            this.sweepActive = false;
            this.sweepDuration = 0;
          }
          this.timedPotionEffects.splice(i, 1);
        }
      }
    }
  }

  private updateDodge(dt: number): void {
    if (this.player.isDodging) {
      this.player.dodgeTimer -= dt * 1000;
      this.player.x += 300 * dt;
      if (this.player.dodgeTimer <= 0) {
        this.player.isDodging = false;
        this.player.x = this.config.playerStartX;
      }
    }
    if (this.player.dodgeCooldown > 0) {
      this.player.dodgeCooldown -= dt * 1000;
    }
    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt * 1000;
    }
  }

  private droneY: number = 0;
  private droneX: number = 0;

  private updateDrone(dt: number): void {
    if (!this.droneActive) return;

    this.droneTimer -= dt * 1000;
    if (this.droneTimer <= 0) {
      this.droneActive = false;
      return;
    }

    this.droneX = this.player.x + 30;
    this.droneY = this.player.y - 30 + Math.sin(this.animFrame * 0.1) * 5;

    this.droneShootCooldown -= dt * 1000;
    if (this.droneShootCooldown <= 0) {
      const enemies = this.enemyPool.getActive();
      if (enemies.length > 0) {
        let closest = enemies[0];
        let minDist = Infinity;
        for (const e of enemies) {
          if (e.x > this.player.x) {
            const dist = e.x - this.player.x;
            if (dist < minDist) {
              minDist = dist;
              closest = e;
            }
          }
        }
        if (closest && closest.x > this.player.x) {
          const bullet = this.bulletPool.acquire(
            this.droneX,
            this.droneY,
            Math.floor(this.player.attack * 0.4)
          ) as Bullet;
          const targetY = closest.y + closest.height / 2;
          (bullet as any).angle = Math.atan2(targetY - this.droneY, closest.x - this.droneX);
          (bullet as any).droneBullet = true;
        }
      }
      this.droneShootCooldown = 600;
    }
  }

  private getCloneCount(): number {
    const cloneLvl = this.getSkillLevel('clone_1');
    const potionBonus = this.wavePotionClone.active ? this.wavePotionClone.level : 0;
    return Math.min(cloneLvl + potionBonus, 4);
  }

  private getClonePositions(): { x: number; y: number }[] {
    const count = this.getCloneCount();
    const positions: { x: number; y: number }[] = [];
    const centerX = this.player.x + this.player.width / 2;
    const centerY = this.player.y + this.player.height / 2;
    if (count >= 1) {
      positions.push({
        x: centerX + 20,
        y: centerY - 100,
      });
    }
    if (count >= 2) {
      positions.push({
        x: centerX + 20,
        y: centerY + 85,
      });
    }
    return positions;
  }

  private updateClones(dt: number): void {
    const cloneCount = this.getCloneCount();
    if (cloneCount <= 0) return;
    // 调试模式：禁止分身攻击时只移动不射击
    if (this.debugNoAttack) return;

    while (this.cloneShootTimers.length < cloneCount) {
      this.cloneShootTimers.push(0);
    }
    while (this.cloneShootTimers.length > cloneCount) {
      this.cloneShootTimers.pop();
    }
    while (this.cloneGrenadeCooldowns.length < cloneCount) {
      this.cloneGrenadeCooldowns.push(0);
    }
    while (this.cloneGrenadeCooldowns.length > cloneCount) {
      this.cloneGrenadeCooldowns.pop();
    }
    // 分身连发队列初始化
    while (this.cloneBurstRemaining.length < cloneCount) {
      this.cloneBurstRemaining.push(0);
      this.cloneBurstTimer.push(0);
      this.cloneBurstAngles.push([]);
      this.cloneShockCooldowns.push(0);
    }
    while (this.cloneBurstRemaining.length > cloneCount) {
      this.cloneBurstRemaining.pop();
      this.cloneBurstTimer.pop();
      this.cloneBurstAngles.pop();
      this.cloneShockCooldowns.pop();
    }

    const cloneBulletLvl = this.getSkillLevel('clone_bullet_1');
    const cloneSyncLvl = this.getSkillLevel('clone_sync_1');

    const attackSpeedBonus = this.getBuffValue('attack_speed') / 100;
    // 攻速统一概念：基础1.0=1000ms间隔，上限2.5=400ms最小间隔
    const effectiveSpeed = Math.max(400, this.player.attackSpeed * (1 - attackSpeedBonus));
    const cloneShootInterval = effectiveSpeed;

    const allRightEnemies = this.getSortedRightEnemies(this.player.x);
    // 分身射程与玩家统一：使用相同的 effectiveRange 过滤
    const weatherType = this.weather.type;
    let cloneWeatherRangeMult = 1;
    if (weatherType === 'sandstorm') cloneWeatherRangeMult = 2 / 3;
    else if (weatherType === 'fog') cloneWeatherRangeMult = 0.7;
    // 需求 #4：分身射程同样受最低25%战场宽度限制
    const cloneBattlefieldWidth = this.config.canvasWidth - this.config.playerStartX;
    const cloneMinRange = cloneBattlefieldWidth * 0.25;
    const cloneEffectiveRange = Math.max(cloneMinRange, this.player.range * cloneWeatherRangeMult);
    const sortedEnemies = allRightEnemies.filter(e => (e.x - this.player.x) <= cloneEffectiveRange);
    const positions = this.getClonePositions();

    const fxBombLvl = this.getSkillLevel('fx_bomb_1');
    const fxFreezeLvl = this.getSkillLevel('fx_freeze_1');
    const fxPoisonLvl = this.getSkillLevel('fx_poison_1');
    const fxCloneShockLvl = this.getSkillLevel('fx_clone_shock_1');

    const dtMs = dt * 1000;
    const cloneDamage = Math.floor(this.player.attack * 0.5);
    const baseSpeed = 500;
    const px = 1.5;
    const bulletOffsetX = 13.5 * px + 12 * px;
    const bulletOffsetY = 5.5 * px + 1 * px;

    const getCloneTargetAngle = (targetEnemy: Enemy | undefined, baseY: number, baseX: number): number => {
      if (!targetEnemy) return 0;
      const targetY = targetEnemy.y + targetEnemy.height / 2;
      return Math.atan2(targetY - baseY, targetEnemy.x - baseX);
    };

    // 分身特效子弹发射
    const fireCloneSpecialBullet = (type: 'freeze' | 'bomb' | 'poison' | 'shock', startX: number, startY: number, angle: number, cloneIdx: number) => {
      if (this.bulletPool.getActive().length >= 120) return;
      const bullet = this.bulletPool.acquire(startX, startY, cloneDamage) as Bullet;
      const bulletAny = bullet as any;
      bulletAny.angle = angle;
      bulletAny.cloneBullet = true;
      bulletAny.cloneIdx = cloneIdx;

      if (type === 'freeze') {
        bulletAny.freezeLvl = fxFreezeLvl;
        bulletAny.isFreezeBullet = true;
        bullet.speed = baseSpeed * 0.5;
      } else if (type === 'bomb') {
        bulletAny.hasBomb = true;
        bulletAny.bombLvl = fxBombLvl;
        bulletAny.bombBurnLvl = fxBombLvl; // 爆弹灼烧融合到发射爆弹
        bulletAny.isBombBullet = true;
        bullet.speed = baseSpeed / 3;
      } else if (type === 'poison') {
        bulletAny.poisonLvl = fxPoisonLvl;
        bulletAny.isPoisonBullet = true;
        bulletAny.poisonAoe = true;
        bullet.speed = baseSpeed / 4;
      } else if (type === 'shock') {
        bulletAny.waveLvl = fxCloneShockLvl;
        bulletAny.isWaveBullet = true;
        bulletAny.wavePhase = 0;
        bullet.width = 50;
      }
    };

    const tryFireCloneSpecialBullets = (startX: number, startY: number, angle: number, cloneIdx: number) => {
      // 冰冻弹/爆弹/毒气弹已改为纯主动技能，分身普通攻击不再被动触发
      // 仅保留分身电击弹（fx_clone_shock_1 独立技能）
      if (fxCloneShockLvl > 0) {
        // 分身电击弹CD：5秒，战术横扫期间1秒
        const shockCdMs = this.sweepActive ? 1000 : 5000;
        if (this.cloneShockCooldowns[cloneIdx] <= 0) {
          fireCloneSpecialBullet('shock', startX, startY, angle, cloneIdx);
          this.cloneShockCooldowns[cloneIdx] = shockCdMs;
        }
      }
    };

    for (let i = 0; i < cloneCount; i++) {
      const pos = positions[i];
      this.cloneShootTimers[i] -= dtMs;
      // 分身电击弹CD递减
      if (this.cloneShockCooldowns[i] > 0) this.cloneShockCooldowns[i] -= dtMs;

      // === 连发队列处理（每帧） ===
      if (this.cloneBurstRemaining[i] > 0) {
        this.cloneBurstTimer[i] -= dtMs;
        if (this.cloneBurstTimer[i] <= 0) {
          if (this.bulletPool.getActive().length < 120) {
            const bulletStartX = pos.x + bulletOffsetX;
            const bulletStartY = pos.y + bulletOffsetY;
            for (const angle of this.cloneBurstAngles[i]) {
              if (this.bulletPool.getActive().length >= 120) break;
              const bullet = this.bulletPool.acquire(bulletStartX, bulletStartY, cloneDamage) as Bullet;
              (bullet as any).angle = angle;
              (bullet as any).cloneBullet = true;
              (bullet as any).cloneIdx = i;
            }
            // 特效子弹：第i个分身锁定第i+1近的怪物
            if (this.cloneBurstAngles[i].length > 0 && sortedEnemies.length > 0) {
              const specialTargetIdx = Math.min(i + 1, sortedEnemies.length - 1);
              const specialTarget = sortedEnemies[specialTargetIdx];
              const mainAngle = getCloneTargetAngle(specialTarget, bulletStartY, bulletStartX);
              tryFireCloneSpecialBullets(bulletStartX, bulletStartY, mainAngle, i);
            }
          }
          this.cloneBurstRemaining[i]--;
          this.cloneBurstTimer[i] = 120;
        }
      }

      // === 主射击 ===
      if (this.cloneShootTimers[i] <= 0 && sortedEnemies.length > 0) {
        if (this.bulletPool.getActive().length >= 120) {
          this.cloneShootTimers[i] = cloneShootInterval;
          continue;
        }
        const bulletStartX = pos.x + bulletOffsetX;
        const bulletStartY = pos.y + bulletOffsetY;

        // 同步发射：根据 cloneSyncLvl 决定打几个目标（满级3个）
        // 第i个分身从第i个敌人开始锁定
        const targetCount = Math.min(1 + cloneSyncLvl, sortedEnemies.length);
        const targets: Enemy[] = [];
        for (let t = 0; t < targetCount; t++) {
          const enemyIdx = Math.min(i + t, sortedEnemies.length - 1);
          targets.push(sortedEnemies[enemyIdx]);
        }

        // 发射一轮（每个目标1颗）
        for (const target of targets) {
          if (this.bulletPool.getActive().length >= 120) break;
          const angle = getCloneTargetAngle(target, bulletStartY, bulletStartX);
          const bullet = this.bulletPool.acquire(bulletStartX, bulletStartY, cloneDamage) as Bullet;
          (bullet as any).angle = angle;
          (bullet as any).cloneBullet = true;
          (bullet as any).cloneIdx = i;  // 记录分身索引用于子弹颜色
        }
        // 特效子弹：第i个分身锁定第i+1近的怪物
        const specialTargetIdx = Math.min(i + 1, sortedEnemies.length - 1);
        const specialTarget = sortedEnemies[specialTargetIdx];
        const mainAngle = getCloneTargetAngle(specialTarget, bulletStartY, bulletStartX);
        tryFireCloneSpecialBullets(bulletStartX, bulletStartY, mainAngle, i);

        // 连发：剩余 burstShots 发，每隔0.1秒
        // 战术横扫：连发翻倍
        let burstShots = cloneBulletLvl;
        if (this.sweepActive) burstShots *= 2;
        if (burstShots > 0) {
          this.cloneBurstRemaining[i] = burstShots;
          this.cloneBurstTimer[i] = 120;
          // 第i个分身从第i个敌人开始锁定
          this.cloneBurstAngles[i] = targets.map(t => getCloneTargetAngle(t, bulletStartY, bulletStartX));
        }

        this.cloneShootTimers[i] = cloneShootInterval;
      }

      const cloneGrenadeLvl = this.getSkillLevel('fx_clone_grenade_1');
      if (cloneGrenadeLvl > 0 && sortedEnemies.length > 0) {
        this.cloneGrenadeCooldowns[i] -= dtMs;
        if (this.cloneGrenadeCooldowns[i] <= 0) {
          const gX = pos.x + 4.5 * px;
          const gY = pos.y + 5 * px;
          // 第i个分身从第i个敌人开始发射榴弹
          let count = cloneGrenadeLvl;
          if (this.sweepActive) count *= 2;
          for (let j = 0; j < count; j++) {
            const gIdx = j;
            this.trackTimer(setTimeout(() => {
              if (this.gameState.isRunning && !this.gameState.isPaused && !this.gameState.isGameOver) {
                this.fireGrenade(gX, gY, true, i, gIdx, i);
              }
            }, j * 120) as unknown as number);
          }
          this.cloneGrenadeCooldowns[i] = 1000;
        }
      }
    }
  }

  private updateBuffs(dt: number): void {
    const dtMs = dt * 1000;

    // 电击弹CD递减
    if (this.shockCooldown > 0) this.shockCooldown -= dtMs;

    const regenValue = this.getBuffValue('regen');
    if (regenValue > 0) {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + this.player.maxHealth * regenValue * dt / 100);
    }
    
    const invincibleValue = this.getBuffValue('invincible');
    this.shieldActive = invincibleValue > 0;

    this.buffs = this.buffs.filter(buff => {
      buff.duration -= dtMs;
      return buff.duration > 0;
    });

    if (this.multishotActive) {
      this.multishotDuration -= dtMs;
      if (this.multishotDuration <= 0) {
        this.multishotActive = false;
      }
    }
    if (this.laserActive) {
      this.laserDuration -= dtMs;
      this.laserDamageTimer -= dtMs;
      if (this.laserDamageTimer <= 0) {
        this.laserDamageReady = true;
        this.laserDamageTimer = 500;
      } else {
        this.laserDamageReady = false;
      }
      if (this.laserDuration <= 0) {
        this.laserActive = false;
      }
    }
    // laser 药水：通过 timedPotionEffects 维护，到时自动关闭 laserActive

    const cloneCount = this.getCloneCount();
    if (cloneCount > 0) {
      while (this.cloneLasersActive.length < cloneCount) {
        this.cloneLasersActive.push(false);
        this.cloneLaserDurations.push(0);
        this.cloneLaserDamageTimers.push(0);
        this.cloneLaserDamageReady.push(false);
      }
      for (let i = 0; i < cloneCount; i++) {
        if (this.cloneLasersActive[i]) {
          this.cloneLaserDurations[i] -= dtMs;
          this.cloneLaserDamageTimers[i] -= dtMs;
          if (this.cloneLaserDamageTimers[i] <= 0) {
            this.cloneLaserDamageReady[i] = true;
            this.cloneLaserDamageTimers[i] = 500;
          } else {
            this.cloneLaserDamageReady[i] = false;
          }
          if (this.cloneLaserDurations[i] <= 0) {
            this.cloneLasersActive[i] = false;
          }
        }
      }
    }
    if (this.flashLightningActive) {
      this.flashLightningTimer -= dtMs;
      if (this.flashLightningTimer <= 0) {
        this.flashLightningActive = false;
      }
    }
  }

  private getBuffValue(type: string): number {
    return this.buffs.filter(b => b.type === type).reduce((sum, b) => sum + b.value, 0);
  }

  private updateSkills(dt: number): void {
    const dtMs = dt * 1000;
    let changed = false;
    for (const skill of this.skills) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown = Math.max(0, skill.currentCooldown - dtMs);
        changed = true;
      }
    }
    if (changed && this.onSkillsChange) {
      this.onSkillsChange(this.skills);
    }
  }

  private updateWave(dt: number): void {
    const dtMs = dt * 1000;

    if (this.gameState.betweenWaves) {
      this.gameState.betweenWaveTimer -= dtMs;
      if (this.gameState.betweenWaveTimer <= 0) {
        this.startWave();
      }
      return;
    }

    if (this.gameState.showWaveNotice) {
      this.gameState.waveNoticeTimer -= dtMs;
      if (this.gameState.waveNoticeTimer <= 0) {
        this.gameState.showWaveNotice = false;
      }
    }

    if (this.gameState.showEliteBossNotice) {
      this.gameState.eliteBossNoticeTimer -= dtMs;
      if (this.gameState.eliteBossNoticeTimer <= 0) {
        this.gameState.showEliteBossNotice = false;
      }
    }

    const wave = this.gameState.currentWave;

    const waveEnemyCount = this.getWaveEnemyCount();

    if (this.gameState.waveEnemiesSpawned < waveEnemyCount) {
      this.gameState.waveSpawnTimer -= dtMs;
      if (this.gameState.waveSpawnTimer <= 0) {
        this.spawnEnemy();
        this.gameState.waveSpawnTimer = this.gameState.waveInterval;
      }
    }

    const activeEnemies = this.enemyPool.getActive().filter(e => !(e as any).isMonsterSandbag).length;
    if (
      this.gameState.waveEnemiesSpawned >= this.getWaveEnemyCount() &&
      activeEnemies === 0
    ) {
      this.endWave();
    }
  }

  private getWaveEnemyCount(): number {
    // 所有波次均为50只（精英/BOSS波中第50只为精英/BOSS，与普通怪同时在场）
    return 50;
  }

  // 获取当前波次总怪物数（精英/BOSS作为第50只与普通怪同时在场）
  private getWaveTotalCount(): number {
    return this.getWaveEnemyCount();
  }

  // 获取当前剩余怪物数
  private getWaveRemainingCount(): number {
    // 待生成的怪物 + 当前活动怪物（精英/BOSS已计入waveEnemiesSpawned）
    const unspawned = Math.max(0, this.getWaveEnemyCount() - this.gameState.waveEnemiesSpawned);
    const active = this.enemyPool.getActive().filter(e => e.active && !(e as any).isSandbag).length;
    return unspawned + active;
  }

  private startWave(): void {
    this.wavePotionEffects = {};
    this.wavePotionClone = { active: false, level: 0 };
    this.timedPotionEffects = [];
    this.laserActive = false;
    this.laserDuration = 0;
    this.sweepActive = false;
    this.sweepDuration = 0;
    this.calculatePlayerStats();
    this.gameState.currentWave++;
    this.gameState.waveEnemiesSpawned = 0;
    this.gameState.waveEnemiesRemaining = this.getWaveTotalCount();
    this.gameState.waveEnemiesTotal = this.getWaveTotalCount();
    this.gameState.waveSpawnTimer = 800;
    this.gameState.waveInterval = Math.max(800, 1200 - this.gameState.currentWave * 30);
    this.gameState.betweenWaves = false;
    this.gameState.showWaveNotice = true;
    this.gameState.waveNoticeTimer = 2000;

    this.waveKillCount = 0;
    this.eliteBossSpawnedThisWave = false;
    if (this.gameState.currentWave > this.highestWave) {
      this.highestWave = this.gameState.currentWave;
      this.checkAchievements();
    }

    if (this.onWaveChange) {
      this.onWaveChange(this.gameState.currentWave);
    }
  }

  private endWave(): void {
    this.gameState.betweenWaves = true;
    this.gameState.betweenWaveTimer = 5000;

    // 怪物沙袋存活时保留其BOSS血条状态
    const sandbag = this.enemyPool.getActive().find(e => (e as any).isMonsterSandbag);
    if (sandbag) {
      this.gameState.bossActive = true;
      this.gameState.bossHealth = sandbag.health;
      this.gameState.bossMaxHealth = sandbag.maxHealth;
      this.gameState.bossName = sandbag.name;
    } else {
      this.gameState.bossActive = false;
    }

    this.checkAchievements();
    
    const waveBonus = this.gameState.currentWave * 100;
    this.player.score += waveBonus;
    
    const highScore = parseInt(localStorage.getItem('shotsGameHighScore') || '0');
    if (this.player.score > highScore) {
      localStorage.setItem('shotsGameHighScore', this.player.score.toString());
    }
    
    if (this.onBossDefeat) {
      this.onBossDefeat();
    }
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }

    // 发送战斗邮件：本波次仓库满无法拾取的掉落物
    this.sendBattleMail();

    this.saveGame();
  }

  // 发送战斗邮件：仓库满时收集的掉落物
  private sendBattleMail(): void {
    const attachments = this.pendingMailDrops;
    const hasEquip = attachments.equipment && attachments.equipment.length > 0;
    const hasItems = attachments.items && attachments.items.length > 0;
    if (!hasEquip && !hasItems) return;

    const equipCount = attachments.equipment?.length || 0;
    const itemCount = attachments.items?.reduce((s, i) => s + i.count, 0) || 0;
    const total = equipCount + itemCount;
    if (total <= 0) return;

    const mail: Mail = {
      id: `mail_battle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'battle',
      title: this.gameMode === 'stage'
        ? `第${this.gameState.currentWave}波 战利品奖励`
        : `${GAME_MODE_CONFIGS[this.gameMode]?.name || '未知'} 战利品奖励`,
      body: `仓库已满，以下${total}件战利品暂存于邮件中，请及时领取。`,
      timestamp: Date.now(),
      read: false,
      claimed: false,
      attachments: { ...attachments },
    };

    // 按时间倒序插入（最新的在前）
    this.mails.unshift(mail);
    if (this.mails.length > 50) this.mails.length = 50;

    // 清空待发
    this.pendingMailDrops = {};

    if (this.onMailChange) {
      this.onMailChange([...this.mails]);
    }
  }

  // 领取邮件附件
  claimMailAttachments(mailId: string): { success: boolean; reason?: string } {
    const mail = this.mails.find(m => m.id === mailId);
    if (!mail) return { success: false, reason: '邮件不存在' };
    if (mail.claimed) return { success: false, reason: '已领取' };
    if (!mail.attachments) {
      mail.claimed = true;
      mail.read = true;
      if (this.onMailChange) this.onMailChange([...this.mails]);
      return { success: true };
    }

    const att = mail.attachments;
    // 装备：逐件放入仓库，满了的保留在邮件中
    if (att.equipment && att.equipment.length > 0) {
      const remaining: Equipment[] = [];
      for (const eq of att.equipment) {
        if (this.equipmentStorage.length < STORAGE_CAPACITY.equipment) {
          this.equipmentStorage.push(eq);
        } else {
          remaining.push(eq);
        }
      }
      if (remaining.length > 0) {
        att.equipment = remaining;
      } else {
        att.equipment = undefined;
      }
      if (this.onEquipmentStorageChange) this.onEquipmentStorageChange(this.equipmentStorage);
    }
    // 物品：逐组放入仓库
    if (att.items && att.items.length > 0) {
      const remainingItems: ItemStack[] = [];
      for (const it of att.items) {
        const existing = this.inventory.find(i => i.itemId === it.itemId);
        if (existing) {
          existing.count += it.count;
        } else if (this.inventory.length < STORAGE_CAPACITY.inventory) {
          this.inventory.push({ ...it });
        } else {
          remainingItems.push({ ...it });
        }
      }
      if (remainingItems.length > 0) {
        att.items = remainingItems;
      } else {
        att.items = undefined;
      }
      if (this.onInventoryChange) this.onInventoryChange(this.inventory);
    }
    // 金币
    if (att.gold && att.gold > 0) {
      this.player.score += att.gold;
      att.gold = undefined;
      if (this.onPlayerChange) this.onPlayerChange(this.player);
    }

    // 仅当所有附件都领取完才标记 claimed
    const stillHas = (att.equipment && att.equipment.length > 0) ||
      (att.items && att.items.length > 0) ||
      (att.gold && att.gold > 0);
    if (!stillHas) {
      mail.claimed = true;
      mail.read = true;
    }
    if (this.onMailChange) this.onMailChange([...this.mails]);
    return { success: true, reason: stillHas ? '仓库已满，部分附件未能领取' : undefined };
  }

  removeMail(mailId: string): void {
    const idx = this.mails.findIndex(m => m.id === mailId);
    if (idx === -1) return;
    const mail = this.mails[idx];
    // 未领取且有附件的不能删除
    if (!mail.claimed && mail.attachments) {
      const has = (mail.attachments.equipment?.length || 0) > 0 ||
        (mail.attachments.items?.length || 0) > 0 ||
        (mail.attachments.gold || 0) > 0;
      if (has) return;
    }
    this.mails.splice(idx, 1);
    if (this.onMailChange) this.onMailChange([...this.mails]);
  }

  markMailRead(mailId: string): void {
    const mail = this.mails.find(m => m.id === mailId);
    if (mail && !mail.read) {
      mail.read = true;
      if (this.onMailChange) this.onMailChange([...this.mails]);
    }
  }

  /** 一键标记指定类型的邮件为已读 */
  markAllMailsRead(mailType: 'system' | 'battle'): void {
    let changed = false;
    for (const mail of this.mails) {
      if (mail.type === mailType && !mail.read) {
        mail.read = true;
        changed = true;
      }
    }
    if (changed && this.onMailChange) this.onMailChange([...this.mails]);
  }

  /** 一键删除指定类型的已读邮件（未领取附件的邮件会被跳过）
   *  返回：{ removed, skipped } removed=已删除数, skipped=因附件未领取而跳过的数量
   */
  removeAllReadMails(mailType: 'system' | 'battle'): { removed: number; skipped: number } {
    let removed = 0;
    let skipped = 0;
    const remaining: Mail[] = [];
    for (const mail of this.mails) {
      if (mail.type !== mailType || !mail.read) {
        // 非目标类型或未读 → 保留
        remaining.push(mail);
        continue;
      }
      // 已读邮件：检查是否还有未领取附件
      const hasUnclaimedAttachment = !mail.claimed && mail.attachments &&
        ((mail.attachments.equipment?.length || 0) > 0 ||
         (mail.attachments.items?.length || 0) > 0 ||
         (mail.attachments.gold || 0) > 0);
      if (hasUnclaimedAttachment) {
        skipped++;
        remaining.push(mail);
      } else {
        removed++;
      }
    }
    this.mails = remaining;
    if (removed > 0 && this.onMailChange) this.onMailChange([...this.mails]);
    return { removed, skipped };
  }

  /** 一键领取指定类型邮件的所有附件（先检查仓库容量，不足则全部不领取） */
  claimAllMailAttachments(mailType: 'system' | 'battle'): { success: boolean; reason?: string; equipShortage?: number; itemShortage?: number } {
    // 统计所有未领取邮件的附件总量
    let totalEquip = 0;
    let totalNewItemSlots = 0; // 需要新占位的物品（已有物品叠放不占新格子）

    const unclaimedMails = this.mails.filter(m => m.type === mailType && !m.claimed && m.attachments);
    for (const mail of unclaimedMails) {
      const att = mail.attachments!;
      totalEquip += att.equipment?.length || 0;
      if (att.items) {
        for (const it of att.items) {
          const existing = this.inventory.find(i => i.itemId === it.itemId);
          if (!existing) totalNewItemSlots++;
        }
      }
    }

    // 检查仓库容量
    const equipSpace = STORAGE_CAPACITY.equipment - this.equipmentStorage.length;
    const itemSpace = STORAGE_CAPACITY.inventory - this.inventory.length;
    const equipShortage = totalEquip - equipSpace;
    const itemShortage = totalNewItemSlots - itemSpace;

    if (equipShortage > 0 || itemShortage > 0) {
      return { success: false, equipShortage, itemShortage };
    }

    // 容量充足，逐个领取
    for (const mail of unclaimedMails) {
      this.claimMailAttachments(mail.id);
    }

    return { success: true };
  }

  getMails(): Mail[] {
    return [...this.mails];
  }

  /** 获取炼狱模式奖励装备 */
  getPurgatoryRewards(): Equipment[] {
    return (this.modeData.purgatoryRewards as Equipment[]) || [];
  }

  /** 炼狱模式是否处于结算阶段（BOSS已被击败，应显示结算界面） */
  isPurgatorySettlementActive(): boolean {
    return this.gameMode === 'purgatory' && (this.modeData.purgatoryPhase as string) === 'settlement';
  }

  /** 退出炼狱结算：停止游戏、清除 isGameOver 与 purgatoryPhase，避免结算界面继续显示 */
  exitPurgatorySettlement(): void {
    this.stop();
    this.gameState.isGameOver = false;
    this.modeData.purgatoryPhase = null;
    if (this.onStateChange) {
      this.onStateChange(this.gameState, this.player);
    }
  }

  /** 领取炼狱奖励：直接加入装备仓库，仓库满则溢入战斗邮件 */
  claimPurgatoryRewards(): void {
    const rewards = (this.modeData.purgatoryRewards as Equipment[]) || [];
    if (rewards.length === 0) return;
    for (const equip of rewards) {
      this.addToStorage(equip); // 内部处理满溢 → pendingMailDrops
    }
    // 刷新满溢掉落为战斗邮件（炼狱无波次机制，需主动触发）
    this.sendBattleMail();
    this.modeData.purgatoryRewards = [];
  }

  /** 获取炼狱BOSS元素类型 */
  getPurgatoryBossElement(): ElementType | null {
    return (this.modeData.purgatoryBossElement as ElementType) || null;
  }

  /** 获取炼狱今日挑战次数 */
  getPurgatoryChallengeCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem('purgatory_challenge');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.date === today) return data.count || 0;
      } catch { /* ignore */ }
    }
    return 0;
  }

  /** 增加炼狱今日挑战次数 */
  incrementPurgatoryChallenge(): void {
    const today = new Date().toISOString().slice(0, 10);
    const count = this.getPurgatoryChallengeCount() + 1;
    localStorage.setItem('purgatory_challenge', JSON.stringify({ date: today, count }));
  }

  /** 获取材料副本奖励（ItemStack：宝石或强化道具） */
  getMaterialRewards(): ItemStack[] {
    return (this.modeData.materialRewards as ItemStack[]) || [];
  }

  /** 材料副本是否处于结算阶段（BOSS已被击败，应显示结算界面） */
  isMaterialSettlementActive(): boolean {
    return this.gameMode === 'material' && (this.modeData.materialPhase as string) === 'settlement';
  }

  /** 退出材料副本结算：停止游戏、清除 isGameOver 与 materialPhase，避免结算界面继续显示 */
  exitMaterialSettlement(): void {
    this.stop();
    this.gameState.isGameOver = false;
    this.modeData.materialPhase = null;
    if (this.onStateChange) {
      this.onStateChange(this.gameState, this.player);
    }
  }

  /** 领取材料副本奖励：宝石→gemInventory，强化道具→enhanceItemInventory，仓库满则溢入战斗邮件 */
  claimMaterialRewards(): void {
    const rewards = (this.modeData.materialRewards as ItemStack[]) || [];
    if (rewards.length === 0) return;

    let gemChanged = false;
    let enhanceChanged = false;

    for (const reward of rewards) {
      const isGem = reward.itemId.startsWith('gem_');
      if (isGem) {
        // 宝石 → gemInventory
        const existing = this.gemInventory.find(g => g.itemId === reward.itemId);
        if (existing) {
          this.gemInventory = this.gemInventory.map(g =>
            g.itemId === reward.itemId ? { ...g, count: g.count + reward.count } : g
          );
          gemChanged = true;
        } else if (this.gemInventory.length < STORAGE_CAPACITY.gem) {
          this.gemInventory = [...this.gemInventory, { itemId: reward.itemId, count: reward.count }];
          gemChanged = true;
        } else {
          // 仓库满 → pendingMailDrops
          if (!this.pendingMailDrops.items) this.pendingMailDrops.items = [];
          this.pendingMailDrops.items.push({ itemId: reward.itemId, count: reward.count });
        }
      } else {
        // 强化道具 → enhanceItemInventory
        const existing = this.enhanceItemInventory.find(i => i.itemId === reward.itemId);
        if (existing) {
          this.enhanceItemInventory = this.enhanceItemInventory.map(i =>
            i.itemId === reward.itemId ? { ...i, count: i.count + reward.count } : i
          );
          enhanceChanged = true;
        } else if (this.enhanceItemInventory.length < STORAGE_CAPACITY.enhance) {
          this.enhanceItemInventory = [...this.enhanceItemInventory, { itemId: reward.itemId, count: reward.count }];
          enhanceChanged = true;
        } else {
          // 仓库满 → pendingMailDrops
          if (!this.pendingMailDrops.items) this.pendingMailDrops.items = [];
          this.pendingMailDrops.items.push({ itemId: reward.itemId, count: reward.count });
        }
      }
    }

    if (gemChanged && this.onGemInventoryChange) this.onGemInventoryChange(this.gemInventory);
    if (enhanceChanged && this.onEnhanceItemInventoryChange) this.onEnhanceItemInventoryChange(this.enhanceItemInventory);

    // 刷新满溢掉落为战斗邮件（材料副本无波次机制，需主动触发）
    this.sendBattleMail();
    this.modeData.materialRewards = [];
  }

  /** 获取材料副本今日挑战次数 */
  getMaterialChallengeCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem('material_challenge');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.date === today) return data.count || 0;
      } catch { /* ignore */ }
    }
    return 0;
  }

  /** 增加材料副本今日挑战次数 */
  incrementMaterialChallenge(): void {
    const today = new Date().toISOString().slice(0, 10);
    const count = this.getMaterialChallengeCount() + 1;
    localStorage.setItem('material_challenge', JSON.stringify({ date: today, count }));
  }

  // ============ 日常挑战：结算相关 ============

  /** 获取日常挑战击杀统计 */
  getDailyKillStats(): { normal: number; elite: number; boss: number } {
    return {
      normal: (this.modeData.dailyNormalKills as number) || 0,
      elite: (this.modeData.dailyEliteKills as number) || 0,
      boss: (this.modeData.dailyBossKills as number) || 0,
    };
  }

  /** 获取日常挑战奖励 */
  getDailyRewards(): { gold: number; books: ItemStack[] } {
    return (this.modeData.dailyRewards as { gold: number; books: ItemStack[] }) || { gold: 0, books: [] };
  }

  /** 日常挑战是否处于结算阶段（玩家主动退出后显示结算界面） */
  isDailySettlementActive(): boolean {
    return this.gameMode === 'daily' && (this.modeData.dailyPhase as string) === 'settlement';
  }

  /** 玩家主动退出日常挑战：生成奖励、停止游戏、进入结算阶段 */
  exitDailyManually(): void {
    if (this.gameMode !== 'daily') return;
    if (this.modeData.dailyPhase === 'settlement') return;

    // 生成奖励
    this.generateDailyRewards();

    // 进入结算阶段
    this.modeData.dailyPhase = 'settlement';
    this.modeVictory = true;
    this.gameState.isGameOver = true;

    // 停止刷怪与战斗（保留敌人/子弹状态用于背景渲染）
    this.stop();

    // 立即同步状态到 React，绕过节流机制
    if (this.onStateChange) {
      this.onStateChange(this.gameState, this.player);
    }
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }
  }

  /** 退出日常挑战结算：清除 isGameOver 与 dailyPhase，避免结算界面继续显示 */
  exitDailySettlement(): void {
    this.gameState.isGameOver = false;
    this.modeData.dailyPhase = null;
    if (this.onStateChange) {
      this.onStateChange(this.gameState, this.player);
    }
  }

  /**
   * 生成日常挑战奖励：金币 + 经验书
   * 金币：普通怪 5+Lv*2 / 精英 50+Lv*10 / BOSS 200+Lv*50
   * 经验书：普通怪 25% 掉小书 / 精英必掉中书+30% 小书 / BOSS 必掉大书+2本中书
   */
  private generateDailyRewards(): void {
    const Lv = this.player.level;
    const normal = (this.modeData.dailyNormalKills as number) || 0;
    const elite = (this.modeData.dailyEliteKills as number) || 0;
    const boss = (this.modeData.dailyBossKills as number) || 0;

    // 金币（经验书已在打怪过程中掉落，结算只给金币）
    const goldFromNormal = normal * (5 + Lv * 2);
    const goldFromElite = elite * (50 + Lv * 10);
    const goldFromBoss = boss * (200 + Lv * 50);
    const totalGold = goldFromNormal + goldFromElite + goldFromBoss;

    this.modeData.dailyRewards = { gold: totalGold, books: [] };
  }

  /** 领取日常挑战奖励：金币→player.gold，经验书→inventory，仓库满则溢入战斗邮件 */
  claimDailyRewards(): void {
    const rewards = (this.modeData.dailyRewards as { gold: number; books: ItemStack[] }) || { gold: 0, books: [] };
    if (rewards.gold === 0 && rewards.books.length === 0) return;

    // 金币
    if (rewards.gold > 0) {
      this.player.gold += rewards.gold;
    }

    // 经验书 → inventory
    let inventoryChanged = false;
    for (const book of rewards.books) {
      const existing = this.inventory.find(i => i.itemId === book.itemId);
      if (existing) {
        this.inventory = this.inventory.map(i =>
          i.itemId === book.itemId ? { ...i, count: i.count + book.count } : i
        );
        inventoryChanged = true;
      } else if (this.inventory.length < STORAGE_CAPACITY.inventory) {
        this.inventory = [...this.inventory, { itemId: book.itemId, count: book.count }];
        inventoryChanged = true;
      } else {
        // 物品栏满 → pendingMailDrops
        if (!this.pendingMailDrops.items) this.pendingMailDrops.items = [];
        this.pendingMailDrops.items.push({ itemId: book.itemId, count: book.count });
      }
    }

    if (inventoryChanged && this.onInventoryChange) {
      this.onInventoryChange(this.inventory);
    }

    // 刷新满溢掉落为战斗邮件
    this.sendBattleMail();
    this.modeData.dailyRewards = { gold: 0, books: [] };
  }

  private spawnEnemy(): void {
    const wave = this.gameState.currentWave;
    const spawnIndex = this.gameState.waveEnemiesSpawned + 1; // 当前刷出的第几只（从1开始）
    const isEliteOrBossWave = wave % this.config.eliteWaveInterval === 0;
    const isBossWave = wave % this.config.bossWaveInterval === 0;

    // 精英/BOSS波第50只：生成精英或BOSS（与普通怪同时在场）
    if (isEliteOrBossWave && spawnIndex === 50) {
      if (isBossWave) {
        this.spawnBoss();
      } else {
        this.spawnElite();
      }
      // 出场时显示通知（持续2秒后自动消失）
      this.gameState.eliteBossNoticeType = isBossWave ? 'boss' : 'elite';
      this.gameState.showEliteBossNotice = true;
      this.gameState.eliteBossNoticeTimer = 2000;
      this.eliteBossSpawnedThisWave = true;
      this.gameState.waveEnemiesSpawned++;
      return;
    }

    // 第11波起，每波第24只刷高达，第29只刷异形
    if (wave >= 11) {
      if (spawnIndex === 24) {
        this.enemyPool.acquire('gundam', wave);
        this.gameState.waveEnemiesSpawned++;
        return;
      }
      if (spawnIndex === 29) {
        this.enemyPool.acquire('alien', wave);
        this.gameState.waveEnemiesSpawned++;
        return;
      }
    }

    // 基础怪物随波次解锁（前6种，2+wave/3）
    const baseTypes = NORMAL_ENEMY_TYPES.slice(0, Math.min(2 + Math.floor(wave / 3), 6));
    let pool = [...baseTypes];
    // 远程射手：wave >= 3 时仅1/3概率加入候选池（数量减少至1/3）
    if (wave >= 3 && Math.random() < 1 / 3) {
      pool.push('ranged_shooter');
    }
    // 刺客：wave >= 5 加入候选池
    if (wave >= 5) pool.push('assassin');
    const type = pool[randomInt(0, pool.length - 1)];
    this.enemyPool.acquire(type, wave);
    this.gameState.waveEnemiesSpawned++;
  }

  private spawnElite(): void {
    const wave = this.gameState.currentWave;
    const idx = Math.min(Math.floor(wave / 10), ELITE_ENEMY_TYPES.length - 1);
    const type = ELITE_ENEMY_TYPES[idx];
    this.enemyPool.acquire(type, wave);
    this.gameState.waveEnemiesSpawned++;
  }

  // 调试用：直接召唤精英怪（不影响波次计数）
  debugSpawnElite(): void {
    const wave = this.gameState.currentWave;
    const idx = Math.min(Math.floor(wave / 10), ELITE_ENEMY_TYPES.length - 1);
    const type = ELITE_ENEMY_TYPES[idx];
    this.enemyPool.acquire(type, wave);
    // 显示"精英来袭！"通知
    this.gameState.eliteBossNoticeType = 'elite';
    this.gameState.showEliteBossNotice = true;
    this.gameState.eliteBossNoticeTimer = 2000;
  }

  // 调试用：直接召唤BOSS
  debugSpawnBoss(): void {
    const wave = this.gameState.currentWave;
    const idx = Math.min(Math.floor(wave / 20), BOSS_ENEMY_TYPES.length - 1);
    const type = BOSS_ENEMY_TYPES[idx];
    const boss = this.enemyPool.acquire(type, wave) as Enemy;
    this.gameState.bossActive = true;
    this.gameState.bossHealth = boss.health;
    this.gameState.bossMaxHealth = boss.maxHealth;
    this.gameState.bossName = boss.name;
    // 显示"BOSS来袭！"通知
    this.gameState.eliteBossNoticeType = 'boss';
    this.gameState.showEliteBossNotice = true;
    this.gameState.eliteBossNoticeTimer = 2000;
    if (this.onBossSpawn) {
      this.onBossSpawn(boss.name, boss.health, boss.maxHealth);
    }
  }

  // 调试用：跳关（当前波+amount，并立即开始新一波）
  debugSkipWaves(amount: number): void {
    this.gameState.currentWave += amount;
    this.gameState.waveEnemiesSpawned = 0;
    this.gameState.waveEnemiesRemaining = this.getWaveTotalCount();
    this.gameState.waveEnemiesTotal = this.getWaveTotalCount();
    this.gameState.waveSpawnTimer = 800;
    this.gameState.waveInterval = Math.max(800, 1200 - this.gameState.currentWave * 30);
    this.gameState.betweenWaves = false;
    this.gameState.showWaveNotice = true;
    this.gameState.waveNoticeTimer = 2000;
    this.eliteBossSpawnedThisWave = false;
    // 清空当前场上所有非沙袋怪物
    const actives = this.enemyPool.getActive();
    for (const e of actives) {
      if (!(e as any).isSandbag && !(e as any).isMonsterSandbag) {
        this.enemyPool.release(e);
      }
    }
    if (this.onWaveChange) {
      this.onWaveChange(this.gameState.currentWave);
    }
  }

  // 调试用：调整所有活动怪物速度倍数
  debugMultiplyEnemySpeed(multiplier: number): void {
    const actives = this.enemyPool.getActive();
    for (const e of actives) {
      if ((e as any).isSandbag || (e as any).isMonsterSandbag) continue;
      e.speed = e.baseSpeed * multiplier;
    }
  }

  // 调试用：人物/分身停止或开始攻击
  debugSetAttacking(enabled: boolean): void {
    this.debugNoAttack = !enabled;
  }

  // 调试用：标记是否禁止人物/分身攻击
  private debugNoAttack: boolean = false;

  private spawnBoss(): void {
    const wave = this.gameState.currentWave;
    const idx = Math.min(Math.floor(wave / 20), BOSS_ENEMY_TYPES.length - 1);
    const type = BOSS_ENEMY_TYPES[idx];
    const boss = this.enemyPool.acquire(type, wave) as Enemy;
    this.gameState.bossActive = true;
    this.gameState.bossHealth = boss.health;
    this.gameState.bossMaxHealth = boss.maxHealth;
    this.gameState.bossName = boss.name;
    if (this.onBossSpawn) {
      this.onBossSpawn(boss.name, boss.health, boss.maxHealth);
    }
  }

  private updateShooting(dt: number): void {
    // 调试模式：禁止人物/分身攻击时直接跳过射击逻辑
    if (this.debugNoAttack) return;
    const dtMs = dt * 1000;
    const enemies = this.enemyPool.getActive();

    let weatherRangeMult = 1;
    let weatherAttackSpeedMult = 1;
    const intensity = this.weather.intensity;

    switch (this.weather.type) {
      case 'sandstorm':
        weatherRangeMult = 2 / 3;
        break;
      case 'snow':
        weatherAttackSpeedMult = 2 / 3;
        break;
      case 'fog':
        weatherRangeMult = 0.7;
        break;
      case 'heat_wave':
        weatherAttackSpeedMult = 0.85;
        break;
    }

    // 需求 #4：受debuff时射程最低值为战场25%宽度
    const battlefieldWidth = this.config.canvasWidth - this.config.playerStartX;
    const minRange = battlefieldWidth * 0.25;
    // 需求 #8：射程受debuff影响
    const rangeDebuffMult = this.getPlayerDebuffMultiplier('rangeDown');
    const effectiveRange = Math.max(minRange, this.player.range * weatherRangeMult * rangeDebuffMult);

    // 需求 #8：定身时无法射击
    const stunned = this.isPlayerStunned();
    const targetInRange = !stunned && enemies.some(e => {
      const dist = e.x - this.player.x;
      return dist > 0 && dist <= effectiveRange;
    });

    const attackSpeedBonus = this.getBuffValue('attack_speed') / 100;
    // 攻速统一概念：基础1.0=1000ms间隔，上限2.5=400ms最小间隔
    // 需求 #8：攻速受debuff影响（debuff降低攻速=增大间隔）
    const atkSpeedDebuffMult = this.getPlayerDebuffMultiplier('attackSpeedDown');
    let effectiveAutoSpeed = Math.max(400, this.player.attackSpeed * (1 - attackSpeedBonus) / weatherAttackSpeedMult / atkSpeedDebuffMult);
    let effectiveManualSpeed = Math.max(400, this.player.manualAttackSpeed * (1 - attackSpeedBonus) / weatherAttackSpeedMult / atkSpeedDebuffMult);

    // 战术横扫：持续时间递减（射速翻倍已取消，改为连发翻倍）
    if (this.sweepActive) {
      this.sweepDuration -= dtMs;
      if (this.sweepDuration <= 0) {
        this.sweepActive = false;
      }
    }
    // sweep 药水：通过 timedPotionEffects 维护，到时自动关闭 sweepActive

    // 准星存在时也自动射击（朝准星方向），否则需要敌人在射程内才自动射击
    if (targetInRange || this.hasAim) {
      this.autoShootTimer -= dtMs;
      if (this.autoShootTimer <= 0) {
        this.shoot();
        this.autoShootTimer = effectiveAutoSpeed;
      }
    }

    // 连发队列处理
    if (this.burstRemaining > 0) {
      this.burstTimer -= dtMs;
      if (this.burstTimer <= 0) {
        if (this.bulletPool.getActive().length < 120) {
          const attackBonus = this.getBuffValue('attack') / 100;
          const damage = Math.floor(this.player.attack * (1 + attackBonus));
          const px = 1.5;
          const bulletY = this.player.y + 5.5 * px + 1 * px;
          const bulletX = this.player.x + 13.5 * px + 16 * px;
          for (const angle of this.burstAngles) {
            if (this.bulletPool.getActive().length >= 120) break;
            const bullet = this.bulletPool.acquire(bulletX, bulletY, damage) as Bullet;
            (bullet as any).angle = angle;
          }
          // 特效子弹：冰冻弹/爆弹/毒气弹已改为纯主动技能，普通攻击不再被动触发
          // （战术横扫也不再100%发射这三类被动子弹，因主动释放时已有独立弹道）
        }
        this.burstRemaining--;
        this.burstTimer = 120;
      }
    }

    if (this.manualShootCooldown > 0) {
      this.manualShootCooldown -= dtMs;
    }

    const grenadeLvl = this.getSkillLevel('fx_grenade_1');
    if (grenadeLvl > 0 && targetInRange) {
      this.grenadeCooldown -= dtMs;
      if (this.grenadeCooldown <= 0) {
        const px = 1.5;
        const grenadeX = this.player.x + 4.5 * px;
        const grenadeY = this.player.y + 5 * px;
        let count = grenadeLvl;
        // 战术横扫：榴弹翻倍
        if (this.sweepActive) count *= 2;
        for (let i = 0; i < count; i++) {
          const gIdx = i;
          this.trackTimer(setTimeout(() => {
            if (this.gameState.isRunning && !this.gameState.isPaused && !this.gameState.isGameOver) {
              this.fireGrenade(grenadeX, grenadeY, false, 0, gIdx);
            }
          }, i * 150) as unknown as number);
        }
        this.grenadeCooldown = 1000;
      }
    }
  }

  setAimPosition(x: number, y: number): void {
    this.aimX = x;
    this.aimY = y;
    this.hasAim = true;
    this.aimExpireTimer = 1000; // 1秒后自动消失
  }

  manualShoot(): void {
    // 需求 #8：定身时无法手动射击
    if (this.isPlayerStunned()) return;
    if (this.manualShootCooldown <= 0) {
      const attackSpeedBonus = this.getBuffValue('attack_speed') / 100;
      let weatherAttackSpeedMult = 1;
      switch (this.weather.type) {
        case 'snow': weatherAttackSpeedMult = 2 / 3; break;
        case 'heat_wave': weatherAttackSpeedMult = 0.85; break;
      }
      // 需求 #8：攻速受debuff影响
      const atkSpeedDebuffMult = this.getPlayerDebuffMultiplier('attackSpeedDown');
      const effectiveManualSpeed = Math.max(400, this.player.manualAttackSpeed * (1 - attackSpeedBonus) / weatherAttackSpeedMult / atkSpeedDebuffMult);
      this.shoot(true); // true = 手动发射，使用准星瞄准
      this.manualShootCooldown = effectiveManualSpeed;
    }
  }

  private shoot(isManual: boolean = false): void {
    if (this.bulletPool.getActive().length >= 120) return;
    const attackBonus = this.getBuffValue('attack') / 100;
    const damage = Math.floor(this.player.attack * (1 + attackBonus));

    const px = 1.5;
    const bulletY = this.player.y + 5.5 * px + 1 * px;
    const bulletX = this.player.x + 13.5 * px + 16 * px;

    const fxBulletLvl = this.getSkillLevel('fx_bullet_1');
    const fxSyncLvl = this.getSkillLevel('fx_sync_1');
    const fxBombLvl = this.getSkillLevel('fx_bomb_1');
    const fxFreezeLvl = this.getSkillLevel('fx_freeze_1');
    const fxPoisonLvl = this.getSkillLevel('fx_poison_1');
    const fxShockLvl = this.getSkillLevel('fx_shock_1');

    const getTargetAngle = (targetEnemy: Enemy | undefined, baseY: number, baseX: number): number => {
      if (!targetEnemy) return 0;
      const targetY = targetEnemy.y + targetEnemy.height / 2;
      return Math.atan2(targetY - baseY, targetEnemy.x - baseX);
    };

    // 准星存在时：手动和自动攻击都朝准星位置发射
    // 准星消失后：自动攻击锁定最近的怪物
    let targets: Enemy[] = [];
    let aimAngle = 0;

    if (this.hasAim) {
      // 准星模式：朝着准星方向发射
      aimAngle = Math.atan2(this.aimY - bulletY, this.aimX - bulletX);
    } else {
      // 自动模式：锁定最近的敌人
      const sortedEnemies = this.getSortedRightEnemies(this.player.x);
      // 同步发射：满级3颗分别打最近3名敌人
      const targetCount = Math.min(1 + fxSyncLvl, sortedEnemies.length);
      for (let i = 0; i < targetCount; i++) {
        targets.push(sortedEnemies[i]);
      }
    }

    const baseSpeed = 500 * this.getPlayerDebuffMultiplier('bulletSpeedDown');
    const bulletAnyCtx = this;

    const fireSpecialBullet = (type: 'freeze' | 'bomb' | 'poison' | 'shock', angle: number, extraData?: any) => {
      if (bulletAnyCtx.bulletPool.getActive().length >= 120) return;
      const bullet = bulletAnyCtx.bulletPool.acquire(bulletX, bulletY, damage) as Bullet;
      const bulletAny = bullet as any;
      bulletAny.angle = angle;

      if (type === 'freeze') {
        bulletAny.freezeLvl = fxFreezeLvl;
        bulletAny.isFreezeBullet = true;
        bullet.speed = baseSpeed * 0.5;
      } else if (type === 'bomb') {
        bulletAny.hasBomb = true;
        bulletAny.bombLvl = fxBombLvl;
        bulletAny.bombBurnLvl = fxBombLvl; // 爆弹灼烧融合到发射爆弹
        bulletAny.isBombBullet = true;
        bullet.speed = baseSpeed / 3;
      } else if (type === 'poison') {
        bulletAny.poisonLvl = fxPoisonLvl;
        bulletAny.isPoisonBullet = true;
        bulletAny.poisonAoe = true;
        bullet.speed = baseSpeed / 4;
      } else if (type === 'shock') {
        bulletAny.waveLvl = fxShockLvl;
        bulletAny.isWaveBullet = true;
        bulletAny.wavePhase = 0;
        bullet.width = 50;
      }
    };

    const tryFireSpecialBullets = (angle: number) => {
      // 冰冻弹/爆弹/毒气弹/电击弹均已改为纯主动技能，普通攻击不再被动触发
      // 战术横扫也不再100%发射这些子弹，主动释放时已有独立弹道
    };

    // 发射一轮子弹（每个目标1颗，受multishot影响则散射多颗）
    const fireOneVolley = () => {
      const spreadPerTarget = this.multishotActive ?
        (this.skills.find(s => s.id === 'multishot_3')?.level ? 9 :
         this.skills.find(s => s.id === 'multishot_2')?.level ? 5 : 3) : 1;
      const spreadAngle = spreadPerTarget > 1 ? 0.12 : 0;
      const halfSpread = Math.floor(spreadPerTarget / 2);

      if (this.hasAim) {
        // 准星模式：朝着准星方向发射
        for (let s = -halfSpread; s <= halfSpread; s++) {
          if (bulletAnyCtx.bulletPool.getActive().length >= 120) break;
          const bullet = bulletAnyCtx.bulletPool.acquire(bulletX, bulletY + s * 3, damage) as Bullet;
          (bullet as any).angle = aimAngle + s * spreadAngle;
        }
        tryFireSpecialBullets(aimAngle);
      } else {
        // 自动模式：锁定敌人
        for (const target of targets) {
          if (bulletAnyCtx.bulletPool.getActive().length >= 120) break;
          const angle = getTargetAngle(target, bulletY, bulletX);
          for (let s = -halfSpread; s <= halfSpread; s++) {
            if (bulletAnyCtx.bulletPool.getActive().length >= 120) break;
            const bullet = bulletAnyCtx.bulletPool.acquire(bulletX, bulletY + s * 3, damage) as Bullet;
            (bullet as any).angle = angle + s * spreadAngle;
          }
        }
        // 特效子弹只跟随主目标角度
        const mainAngle = getTargetAngle(targets[0], bulletY, bulletX);
        tryFireSpecialBullets(mainAngle);
      }
    };

    // 第一轮立即发射
    fireOneVolley();

    // 连发：剩余 burstShots 发，每隔0.1秒
    // 战术横扫：连发翻倍（4连发*2=8）
    let burstShots = fxBulletLvl;
    if (this.sweepActive) burstShots *= 2;
    if (burstShots > 0) {
      this.burstRemaining = burstShots;
      this.burstTimer = 120;
      if (this.hasAim) {
        this.burstAngles = [aimAngle];
      } else {
        this.burstAngles = targets.map(t => getTargetAngle(t, bulletY, bulletX));
      }
    }

    this.screenShake = 2;
    this.muzzleFlashTimer = 3;
  }

  private updateBullets(dt: number): void {
    const bullets = this.bulletPool.getActive();
    for (const bullet of bullets) {
      const bulletAny = bullet as any;
      const angle = bulletAny.angle || 0;
      
      if (bulletAny.isParabolic) {
        // 远程射手抛物线子弹
        bulletAny.flightProgress = (bulletAny.flightProgress || 0) + dt;
        const ft = bulletAny.flightTime || 0.8;
        const t = Math.min(1, bulletAny.flightProgress / ft);
        bullet.x = bulletAny.startX + (bulletAny.targetX - bulletAny.startX) * t;
        bullet.y = bulletAny.startY + (bulletAny.targetY - bulletAny.startY) * t - (bulletAny.arcHeight || 80) * 4 * t * (1 - t);
        // 拖尾
        if (!bulletAny.trail) bulletAny.trail = [];
        bulletAny.trail.push({ x: bullet.x, y: bullet.y });
        if (bulletAny.trail.length > 8) bulletAny.trail.shift();
        // 落地：检测玩家碰撞
        if (t >= 1) {
          const px = this.player.x + this.player.width / 2;
          const py = this.player.y + this.player.height / 2;
          const dx = px - bulletAny.targetX;
          const dy = py - bulletAny.targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const playerInvincible = this.shieldActive || this.player.invincibleTimer > 0 || this.player.isDodging;
          if (dist <= 14 && !playerInvincible) {
            const defense = (this.player as any).defense || 0;
            const reducedDamage = Math.max(1, bullet.damage * (1 - defense / 100));
            const actualDamage = Math.min(reducedDamage, this.player.health);
            this.player.health -= actualDamage;
            // 血量监听统一在 update() 中处理，无需此处重复判断
          }
          // 落地粒子特效
          if (this.particlePool.canAcquire()) {
            for (let i = 0; i < 8; i++) {
              this.particlePool.acquire(bulletAny.targetX, bulletAny.targetY, i % 2 === 0 ? '#9B59B6' : '#C39BD3');
            }
          }
          this.bulletPool.release(bullet);
          continue;
        }
        continue;
      }

      if (bulletAny.isGrenade) {
        bullet.x += bulletAny.vx * dt;
        bullet.y += bulletAny.vy * dt;
        bulletAny.vy += bulletAny.gravity * dt;

        if (!bulletAny.trail) bulletAny.trail = [];
        bulletAny.trail.push({ x: bullet.x, y: bullet.y });
        if (bulletAny.trail.length > 20) bulletAny.trail.shift();

        if (bullet.y > this.config.canvasHeight - 20) {
          this.explodeGrenade(bullet);
          this.bulletPool.release(bullet);
          continue;
        }
      } else if (bulletAny.isNuke) {
        // 终极核弹抛物线运动
        bullet.x += bulletAny.vx * dt;
        bullet.y += bulletAny.vy * dt;
        bulletAny.vy += bulletAny.gravity * dt;

        if (!bulletAny.trail) bulletAny.trail = [];
        bulletAny.trail.push({ x: bullet.x, y: bullet.y });
        if (bulletAny.trail.length > 25) bulletAny.trail.shift();

        // 到达目标点附近或触地时爆炸
        const reachedTarget = bullet.x >= bulletAny.nukeTargetX;
        const hitGround = bullet.y > this.config.canvasHeight - 20;
        if (reachedTarget || hitGround) {
          this.explodeNuke(bullet);
          this.bulletPool.release(bullet);
          continue;
        }
      } else {
        bullet.x += bullet.speed * dt * Math.cos(angle);
        bullet.y += bullet.speed * dt * Math.sin(angle);
      }

      // 波浪子弹动画相位
      if (bulletAny.isWaveBullet) {
        bulletAny.wavePhase = (bulletAny.wavePhase || 0) + dt * 15;
      }

      if (bullet.x > this.config.canvasWidth + 50 || bullet.x < -50 ||
          bullet.y < -50 || bullet.y > this.config.canvasHeight + 50) {
        this.bulletPool.release(bullet);
      }
    }
  }

  private updateEnemies(dt: number): void {
    const enemies = this.enemyPool.getActive();
    const now = performance.now();
    const dtMs = dt * 1000;
    
    for (const enemy of enemies) {
      const isStunned = enemy.stunTimer > 0;
      if (isStunned) {
        enemy.stunTimer -= dtMs;
      }

      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dtMs;
        enemy.speed = enemy.baseSpeed * (1 - enemy.slowAmount);
        if (enemy.slowTimer <= 0) {
          enemy.speed = enemy.baseSpeed;
          enemy.slowAmount = 0;
        }
      }

      let speedMultiplier = 1;
      // 受击硬直：改为减速60%（从完全定身改为大幅减速，防止连续命中导致怪物永久卡住）
      const hitStun = (enemy as any).hitStunTimer || 0;
      if (hitStun > 0) {
        (enemy as any).hitStunTimer = Math.max(0, hitStun - dtMs);
        speedMultiplier *= 0.4;
      }
      let dotDamage = 0;
      const activeDebuffs: string[] = [];

      const debuffs = (enemy as any).debuffs || [];
      for (let i = debuffs.length - 1; i >= 0; i--) {
        const debuff = debuffs[i];
        const effect = this.debuffEffects[debuff.type];
        
        if (now - debuff.startTime >= debuff.duration) {
          debuffs.splice(i, 1);
        } else {
          if (effect) {
            activeDebuffs.push(debuff.type);
            dotDamage += debuff.damage || effect.damage;
            speedMultiplier *= effect.speedMultiplier;
          }
        }
      }

      if ((enemy as any).debuffs && (enemy as any).debuffs.length === 0) {
        delete (enemy as any).debuffs;
      }

      if (dotDamage > 0) {
        enemy.health -= dotDamage * dt;
        if (enemy.health <= 0) {
          if ((enemy as any).isSandbag && !(enemy as any).isMonsterSandbag) {
            enemy.health = enemy.maxHealth;
          } else {
            this.killEnemy(enemy);
            continue;
          }
        }
      }

      // 全屏闪光：每秒1%最大生命值伤害
      if ((enemy as any).flashBurnUntil && now < (enemy as any).flashBurnUntil) {
        const flashDmg = enemy.maxHealth * 0.01 * dt;
        enemy.health -= flashDmg;
        // 累计伤害，每秒显示一次伤害数字
        (enemy as any).flashBurnAccum = ((enemy as any).flashBurnAccum || 0) + flashDmg;
        (enemy as any).flashBurnTick = ((enemy as any).flashBurnTick || 0) + dtMs;
        if ((enemy as any).flashBurnTick >= 1000) {
          const accumDmg = Math.floor((enemy as any).flashBurnAccum);
          if (accumDmg > 0 && this.damageNumberPool.canAcquire()) {
            const dn = this.damageNumberPool.acquire(
              enemy.x + enemy.width / 2,
              enemy.y,
              accumDmg,
              '#FFD700'
            );
            if (dn) (dn as any).isCrit = false;
          }
          (enemy as any).flashBurnAccum = 0;
          (enemy as any).flashBurnTick = 0;
        }
        if (enemy.health <= 0) {
          if ((enemy as any).isSandbag && !(enemy as any).isMonsterSandbag) {
            enemy.health = enemy.maxHealth;
          } else {
            this.killEnemy(enemy);
            continue;
          }
        }
      }

      (enemy as any).cursed = activeDebuffs.includes('curse');

      const frozenUntil = (enemy as any).frozenUntil;
      const isFrozen = frozenUntil && now <= frozenUntil;

      // 远程射手怪物 - 行进至射击范围停下，远程抛物线攻击，前后摇不能移动
      // 刺客型怪物 - 进入玩家射程前正常直线移动，进入后朝玩家突进，贴近时爆炸
      const configKey = (enemy as any).configKey;
      const isRangedShooter = configKey === 'ranged_shooter';
      const isAssassin = configKey === 'assassin';

      if (!isFrozen && !isStunned && !(enemy as any).isSandbag) {
        // 炼狱枷锁：完全不动
        if ((enemy as any).isPurgatoryChains) {
          // 不做任何移动
        }
        // 炼狱BOSS：独立移动AI（朝玩家方向移动，保持一定距离）
        else if ((enemy as any).isPurgatoryBoss) {
          const dx = this.player.x + this.player.width / 2 - (enemy.x + enemy.width / 2);
          const dy = this.player.y + this.player.height / 2 - (enemy.y + enemy.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          const targetDist = 150; // 保持150px距离
          const effectiveSpeed = enemy.speed * speedMultiplier;
          if (dist > 0) {
            if (dist > targetDist + 30) {
              // 太远，靠近玩家
              enemy.x += (dx / dist) * effectiveSpeed * dt;
              enemy.y += (dy / dist) * effectiveSpeed * dt;
            } else if (dist < targetDist - 30) {
              // 太近，远离玩家
              enemy.x -= (dx / dist) * effectiveSpeed * dt;
              enemy.y -= (dy / dist) * effectiveSpeed * dt;
            } else {
              // 保持距离，侧向移动
              const sideAngle = Math.atan2(dy, dx) + Math.PI / 2;
              enemy.x += Math.cos(sideAngle) * effectiveSpeed * 0.5 * dt;
              enemy.y += Math.sin(sideAngle) * effectiveSpeed * 0.5 * dt;
            }
          }
          enemy.animFrame += effectiveSpeed * dt * 30;
        }
        else if (isRangedShooter) {
          const inAttackAnim = (enemy as any).attackWindup > 0 || (enemy as any).attackRecovery > 0;
          const playerDist = (enemy.x + enemy.width / 2) - (this.player.x + this.player.width / 2);
          // 弓箭手射程 = 玩家实际射程的75%
          const shooterRange = this.player.range * 0.75;
          const inRange = playerDist <= shooterRange && playerDist > 20;

          // 始终更新攻击计时器，防止玩家移出射程后弓箭手卡在攻击动画中
          this.updateRangedShooterAttack(enemy, dt, now);

          if (inAttackAnim) {
            enemy.animFrame += dt * 10;
          } else if (!inRange) {
            const effectiveSpeed = enemy.speed * speedMultiplier;
            enemy.x -= effectiveSpeed * dt;
            enemy.animFrame += effectiveSpeed * dt * 30;
          }
        } else if (isAssassin) {
          // 刺客：进入玩家射程前正常向左移动，进入射程后朝玩家突进
          const dx = this.player.x + this.player.width / 2 - (enemy.x + enemy.width / 2);
          const dy = this.player.y + this.player.height / 2 - (enemy.y + enemy.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          // 玩家射程边缘到刺客的距离，判断是否已进入玩家射程
          const inPlayerRange = Math.abs(dx) <= this.player.range;

          if (inPlayerRange) {
            // 进入玩家射程：朝玩家直线突进
            // 边距<10px时爆炸（边距 = 两矩形之间的间隙）
            const gap = dist - (enemy.width / 2 + this.player.width / 2);
            if (gap < 10) {
              this.explodeAssassin(enemy);
              this.killEnemy(enemy);
              continue;
            } else {
              const effectiveSpeed = enemy.speed * speedMultiplier;
              if (dist > 0) {
                enemy.x += (dx / dist) * effectiveSpeed * dt;
                enemy.y += (dy / dist) * effectiveSpeed * dt;
              }
              enemy.animFrame += effectiveSpeed * dt * 30;
            }
          } else {
            // 未进入玩家射程：和普通怪物一样直线向左移动
            const effectiveSpeed = enemy.speed * speedMultiplier;
            enemy.x -= effectiveSpeed * dt;
            enemy.animFrame += effectiveSpeed * dt * 30;
          }
        } else {
          // 普通怪物：朝玩家方向移动，进入攻击范围后使用普通攻击
          const dx = this.player.x + this.player.width / 2 - (enemy.x + enemy.width / 2);
          const dy = this.player.y + this.player.height / 2 - (enemy.y + enemy.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          // 攻击范围 = 怪物攻击范围 + 双方体型半径
          const attackRange = enemy.range + enemy.width / 2 + this.player.width / 2;
          const effectiveSpeed = enemy.speed * speedMultiplier;

          if (dist > attackRange) {
            // 朝玩家方向移动（含 Y 轴）
            if (dist > 0) {
              enemy.x += (dx / dist) * effectiveSpeed * dt;
              enemy.y += (dy / dist) * effectiveSpeed * dt;
            }
            enemy.animFrame += effectiveSpeed * dt * 30;
          } else {
            // 在攻击范围内：停止移动，按攻击间隔发动普通攻击
            (enemy as any).meleeAttackTimer = ((enemy as any).meleeAttackTimer || 0) - dtMs;
            if ((enemy as any).meleeAttackTimer <= 0) {
              this.enemyMeleeAttack(enemy);
              (enemy as any).meleeAttackTimer = enemy.attackSpeed;
            }
            enemy.animFrame += dt * 15;
          }
        }
      }

      if (Math.random() < 0.25) {
        for (const debuffType of activeDebuffs) {
          const effect = this.debuffEffects[debuffType];
          if (effect && effect.particleColor) {
            const particleCount = effect.particleCount || (isFrozen && debuffType === 'freeze' ? 2 : 1);
            if (this.particlePool.canAcquire()) {
              for (let p = 0; p < particleCount; p++) {
                this.particlePool.acquire(
                  enemy.x + enemy.width / 2 + randomRange(-8, 8),
                  enemy.y + randomRange(5, enemy.height - 5),
                  effect.particleColor
                );
              }
            }
          }
        }
      }

      if (enemy.hitFlash > 0) {
        enemy.hitFlash -= dt;
      }

      if (enemy.type === 'boss' && !(enemy as any).isPurgatoryBoss && !(enemy as any).isPurgatoryChains && !(enemy as any).isMaterialBoss) {
        this.updateBossSkills(enemy, dt);
      }

      const playerInvincible = this.shieldActive || this.player.invincibleTimer > 0 || this.player.isDodging;
      // 刺客碰到玩家时直接爆炸（不走普通碰撞伤害）
      if (isAssassin && checkCollision(enemy, this.player)) {
        this.explodeAssassin(enemy);
        this.killEnemy(enemy);
        continue;
      }
      // 普通怪物碰撞伤害已改为近战普通攻击（enemyMeleeAttack），不再持续扣血

      if (enemy.x < -100) {
        this.enemyPool.release(enemy);
      }

      if (this.gameState.bossActive && enemy.type === 'boss') {
        this.gameState.bossHealth = enemy.health;
      }
    }
  }

  private updateBossSkills(boss: Enemy, dt: number): void {
    const dtMs = dt * 1000;
    boss.bossSkillCooldown = (boss.bossSkillCooldown || 3000) - dtMs;

    const healthPercent = boss.health / boss.maxHealth;
    if (healthPercent < 0.3 && boss.bossPhase === 1) {
      boss.bossPhase = 2;
      boss.baseSpeed *= 1.3;
      boss.speed = boss.baseSpeed;
      this.screenShake = 8;
      this.addBossBuff('enrage_2', 9999999);
    } else if (healthPercent < 0.6 && boss.bossPhase === 1) {
      boss.bossPhase = 1.5;
      this.addBossBuff('enrage_1', 9999999);
    }

    this.updateBossStatusDisplay();

    if (boss.bossSkillCooldown <= 0) {
      this.bossUseSkill(boss);
      boss.bossSkillCooldown = boss.bossPhase === 2 ? 2500 : 4000;
    }
  }

  // 怪物近战普通攻击：有攻击间隔，造成 enemy.attack 伤害，考虑暴击/防御
  private enemyMeleeAttack(enemy: Enemy): void {
    const playerInvincible = this.shieldActive || this.player.invincibleTimer > 0 || this.player.isDodging;
    if (playerInvincible) return;

    // 计算伤害（考虑暴击）
    let damage = enemy.attack;
    const isCrit = Math.random() * 100 < (enemy.critRate || 0);
    if (isCrit) {
      damage = Math.floor(damage * (enemy.critDamage || 100) / 100);
    }
    // 受玩家防御减伤
    const defense = (this.player as any).defense || 0;
    const reducedDamage = Math.max(1, damage * (1 - defense / 100));
    const actualDamage = Math.min(reducedDamage, this.player.health);
    this.player.health -= actualDamage;

    // 显示伤害数字
    if (this.damageNumberPool.canAcquire()) {
      const dn = this.damageNumberPool.acquire(
        this.player.x + this.player.width / 2,
        this.player.y,
        Math.floor(actualDamage),
        isCrit ? '#FF0066' : '#FF6600'
      );
      if (dn && isCrit) (dn as any).isCrit = true;
    }

    // 精英/BOSS攻击玩家时施加debuff
    this.applyEliteBossDebuff(enemy);
  }

  // 需求 #6：远程射手怪物攻击 - 前摇→抛物线发射→后摇
  private updateRangedShooterAttack(enemy: Enemy, dt: number, now: number): void {
    const dtMs = dt * 1000;
    const windup = (enemy as any).attackWindup || 0;
    const recovery = (enemy as any).attackRecovery || 0;

    if (windup > 0) {
      (enemy as any).attackWindup = Math.max(0, windup - dtMs);
      if ((enemy as any).attackWindup <= 0) {
        // 只有在射程内才发射子弹，防止玩家移出射程后弓箭手在远处乱射
        const shooterRange = this.player.range * 0.75;
        const distToPlayer = (enemy.x + enemy.width / 2) - (this.player.x + this.player.width / 2);
        if (distToPlayer > 0 && distToPlayer <= shooterRange) {
          this.fireRangedShooterProjectile(enemy);
        }
        (enemy as any).attackRecovery = 600;
      }
      return;
    }

    if (recovery > 0) {
      (enemy as any).attackRecovery = Math.max(0, recovery - dtMs);
      return;
    }

    // 弓箭手射程 = 玩家实际射程的75%
    const shooterRange = this.player.range * 0.75;
    const distToPlayer = (enemy.x + enemy.width / 2) - (this.player.x + this.player.width / 2);
    if (distToPlayer > 0 && distToPlayer <= shooterRange) {
      (enemy as any).attackWindup = 400;
    }
  }

  // 远程射手抛物线子弹
  private fireRangedShooterProjectile(enemy: Enemy): void {
    // 性能保护：子弹池上限检查，避免无限扩容
    if (this.bulletPool.getActive().length >= 120) return;
    const startX = enemy.x + enemy.width / 2;
    const startY = enemy.y + enemy.height / 2;
    const targetX = this.player.x + this.player.width / 2;
    const targetY = this.player.y + this.player.height / 2;
    // 使用子弹对象记录抛物线参数（resetBullet 第4个参数为 damage）
    const bullet = this.bulletPool.acquire(startX, startY, enemy.damage);
    if (!bullet) return;
    const bulletAny = bullet as any;
    bulletAny.isEnemyProjectile = true;
    bulletAny.isParabolic = true;
    bulletAny.startX = startX;
    bulletAny.startY = startY;
    bulletAny.targetX = targetX;
    bulletAny.targetY = targetY;
    // 抛物线参数：飞行时间、最大高度
    bulletAny.flightTime = 0.8;
    bulletAny.flightProgress = 0;
    bulletAny.arcHeight = 80;
    bulletAny.shooter = enemy;
    bullet.speed = 0;
    bullet.width = 6;
    bullet.height = 6;
  }

  // 需求 #7：刺客爆炸
  // 刺客爆炸：伤害 = 同关卡弓箭手射击伤害 × 3
  private explodeAssassin(enemy: Enemy): void {
    const playerInvincible = this.shieldActive || this.player.invincibleTimer > 0 || this.player.isDodging;

    // 计算同关卡弓箭手射击伤害（弓箭手 baseDamage=6，按波次缩放）
    const wave = this.gameState.currentWave;
    const shooterBaseDamage = ENEMY_CONFIGS['ranged_shooter'].baseDamage;
    const damageMultiplier = Math.pow(1.014, wave - 1);
    const explosionDamage = Math.floor(shooterBaseDamage * damageMultiplier * 3);

    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height / 2;
    const dx = this.player.x + this.player.width / 2 - cx;
    const dy = this.player.y + this.player.height / 2 - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 爆炸范围50px
    if (dist <= 50 && !playerInvincible) {
      const defense = (this.player as any).defense || 0;
      const reducedDamage = Math.max(1, explosionDamage * (1 - defense / 100));
      const actualDamage = Math.min(reducedDamage, this.player.health);
      this.player.health -= actualDamage;
      // 显示爆炸伤害数字（实际扣血量，避免超过剩余血量）
      const dn = this.damageNumberPool.acquire(cx, cy - 10, Math.floor(actualDamage), '#FF0066');
      if (dn) (dn as any).isCrit = true;
      // 血量监听统一在 update() 中处理，无需此处重复判断
    }

    // === 爆炸特效 ===
    // 性能优化：池满时跳过新粒子，避免覆盖活跃对象
    if (this.particlePool.canAcquire()) {
      // 第一层：火球中心 - 大量橙红色火花
      for (let i = 0; i < 24; i++) {
        this.particlePool.acquire(cx, cy, i % 3 === 0 ? '#FFFFFF' : i % 3 === 1 ? '#FF6600' : '#FFAA00');
      }
      if (this.particlePool.canAcquire()) {
        // 第二层：冲击波 - 黄色高速粒子向外飞散
        for (let i = 0; i < 16; i++) {
          this.particlePool.acquire(cx, cy, '#FFDD44');
        }
      }
      if (this.particlePool.canAcquire()) {
        // 第三层：烟雾 - 暗红色慢速粒子
        for (let i = 0; i < 10; i++) {
          this.particlePool.acquire(cx, cy, '#CC2200');
        }
      }
    }

    // 强烈屏幕震动
    this.screenShake = Math.max(this.screenShake, 8);
  }

  private bossUseSkill(boss: Enemy): void {
    const skillType = randomInt(0, 2);

    switch (skillType) {
      case 0:
        for (let i = 0; i < 5; i++) {
          const spawnY = this.config.groundY + 20 + i * 30;
          const enemyType = this.gameState.currentWave > 10 ? 'raider' : 'mutant';
          const minion = this.enemyPool.acquire(enemyType, this.gameState.currentWave) as Enemy;
          minion.x = boss.x - 50;
          minion.y = Math.min(spawnY, this.config.canvasHeight - minion.height - 20);
        }
        this.addBossBuff('summon', 2000);
        break;
      case 1:
        const chargeSpeed = boss.baseSpeed * 2.5;
        boss.speed = chargeSpeed;
        this.addBossBuff('charge', 1500);
        this.trackTimer(setTimeout(() => {
          if (boss.active) {
            boss.speed = boss.baseSpeed;
          }
        }, 1500) as unknown as number);
        break;
      case 2:
        this.applyEnemyDebuff('poison', Math.floor(boss.damage * 0.3), 3000);
        break;
    }
  }

  private updateDrops(dt: number): void {
    const drops = this.dropPool.getActive();
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    const now = performance.now();

    for (const drop of drops) {
      const spawnTime = (drop as any).spawnTime || now;
      const elapsed = now - spawnTime;

      // 3秒后自动被角色吸引捡取
      if (elapsed >= 3000) {
        const dx = playerCenterX - drop.x;
        const dy = playerCenterY - drop.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) {
          this.pickupDrop(drop);
          this.dropPool.release(drop);
          continue;
        }

        // 吸向角色
        const speed = 400 + drop.magnetSpeed;
        drop.magnetSpeed += 500 * dt;
        drop.x += (dx / dist) * speed * dt;
        drop.y += (dy / dist) * speed * dt;
      }
    }
  }

  private pickupDrop(drop: DropItem): void {
    switch (drop.type) {
      case 'exp':
        this.addExp(drop.value);
        break;
      case 'health':
        this.player.health = Math.min(this.player.maxHealth, this.player.health + drop.value);
        break;
      case 'coin':
        this.player.score += drop.value;
        break;
      case 'item':
        this.addToInventory(drop.itemId!);
        break;
      case 'equipment':
        const equipId = (drop as any).equipmentId;
        if (equipId) {
          const equip = this.droppedEquipmentMap.get(equipId);
          if (equip) {
            this.addToStorage(equip);
            this.droppedEquipmentMap.delete(equipId);
          }
        }
        break;
    }
  }

  private addExp(amount: number): void {
    const expBonus = (this.player as any).expBonus || 0;
    const finalAmount = Math.floor(amount * (1 + expBonus));
    this.player.exp += finalAmount;
    
    while (this.player.exp >= this.player.expToNextLevel && this.player.level < 300) {
      this.player.exp -= this.player.expToNextLevel;
      this.player.level++;
      const lvl = this.player.level;
      this.player.expToNextLevel = this.calculateExpToNextLevel(lvl);
      this.player.skillPoints++;
      this.calculatePlayerStats();
      this.player.health = this.player.maxHealth;
      this.checkAchievements();

      // 升级悬浮提示
      this.showToast('⬆️', `等级提升至 Lv.${lvl}`, '#FFD60A');

      if (this.onPlayerChange) {
        this.onPlayerChange(this.player);
      }
    }
    
    if (this.player.level >= 300) {
      this.player.exp = 0;
      this.player.expToNextLevel = 0;
    }
  }

  // BALANCE v13 FINAL: Unified level growth curve (matches createPlayer formula)
  // Lv1→2: ~100exp, Lv50: ~52k, Lv100: ~380k, Lv200: ~3.8M, Lv300: ~13M
  private calculateExpToNextLevel(level: number): number {
    if (level >= 300) return 0;
    
    const baseExp = 80;
    const levelPower = Math.pow(level, 2.05) * 3.5;
    const levelLinear = level * 6;
    
    return Math.floor(baseExp + levelPower + levelLinear);
  }

  private addToInventory(itemId: string): void {
    const existing = this.inventory.find(i => i.itemId === itemId);
    if (existing) {
      existing.count++;
    } else if (this.inventory.length < STORAGE_CAPACITY.inventory) {
      this.inventory.push({ itemId, count: 1 });
    } else {
      // 仓库已满，无法拾取，收集到待发邮件
      if (!this.pendingMailDrops.items) this.pendingMailDrops.items = [];
      const exist = this.pendingMailDrops.items.find(i => i.itemId === itemId);
      if (exist) exist.count++;
      else this.pendingMailDrops.items.push({ itemId, count: 1 });
      return;
    }
    this.addItemObtained(itemId);
    if (this.onInventoryChange) {
      this.onInventoryChange(this.inventory);
    }
  }

  /** 查询物品栏中某物品的持有数量 */
  getItemCount(itemId: string): number {
    const stack = this.inventory.find(i => i.itemId === itemId);
    return stack ? stack.count : 0;
  }

  /** 消耗物品栏中指定数量的物品（不做容量校验，调用前需自行校验） */
  consumeItem(itemId: string, count: number): void {
    const stack = this.inventory.find(i => i.itemId === itemId);
    if (!stack) return;
    stack.count -= count;
    if (stack.count <= 0) {
      this.inventory = this.inventory.filter(i => i.itemId !== itemId);
    }
    if (this.onInventoryChange) {
      this.onInventoryChange(this.inventory);
    }
  }

  equipItem(equipment: Equipment): void {
    const existingIndex = this.equipment.findIndex(e => e.slot === equipment.slot);
    if (existingIndex !== -1) {
      const oldEquipment = this.equipment[existingIndex];
      if (this.equipmentStorage.length < STORAGE_CAPACITY.equipment) {
        this.equipmentStorage.push(oldEquipment);
        if (this.onEquipmentStorageChange) {
          this.onEquipmentStorageChange(this.equipmentStorage);
        }
      }
    }
    this.equipment = this.equipment.map(e => e.slot === equipment.slot ? equipment : e);
    this.calculatePlayerStats();
    if (this.onEquipmentChange) {
      this.onEquipmentChange(this.equipment);
    }
  }

  addToStorage(equipment: Equipment): void {
    if (this.equipmentStorage.length < STORAGE_CAPACITY.equipment) {
      this.equipmentStorage.push(equipment);
      this.addEquipmentObtained(equipment.rarity);
      this.checkAchievements();
      if (this.onEquipmentStorageChange) {
        this.onEquipmentStorageChange(this.equipmentStorage);
      }
    } else {
      // 装备仓库已满，无法拾取，收集到待发邮件
      if (!this.pendingMailDrops.equipment) this.pendingMailDrops.equipment = [];
      this.pendingMailDrops.equipment.push(equipment);
    }
  }

  removeFromStorage(index: number): void {
    const equipment = this.equipmentStorage[index];
    if (equipment) {
      this.equipmentStorage.splice(index, 1);
      if (this.onEquipmentStorageChange) {
        this.onEquipmentStorageChange(this.equipmentStorage);
      }
    }
  }

  removeFromInventory(index: number): void {
    if (index >= 0 && index < this.inventory.length) {
      this.inventory.splice(index, 1);
      if (this.onInventoryChange) {
        this.onInventoryChange(this.inventory);
      }
    }
  }

  decomposeEquipment(index: number): number {
    const equipment = this.equipmentStorage[index];
    if (!equipment) return 0;

    const rarityScrapMap: Record<EquipRarity, number> = {
      common: 5,
      advanced: 15,
      fine: 40,
      legendary: 100,
      epic: 250,
      mythic: 600,
    };
    const rarityScrap = rarityScrapMap[equipment.rarity] || 5;

    const goldGain = Math.floor(rarityScrap * (1 + equipment.level * 0.1));

    this.equipmentStorage.splice(index, 1);
    this.player.gold += goldGain;

    if (this.onEquipmentStorageChange) {
      this.onEquipmentStorageChange(this.equipmentStorage);
    }
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }

    return goldGain;
  }

  decomposeAllCommon(): number {
    let totalGold = 0;
    const indicesToRemove: number[] = [];

    for (let i = this.equipmentStorage.length - 1; i >= 0; i--) {
      const equip = this.equipmentStorage[i];
      if (equip.rarity === 'common' || equip.rarity === 'advanced') {
        indicesToRemove.push(i);
      }
    }

    for (const index of indicesToRemove.sort((a, b) => b - a)) {
      totalGold += this.decomposeEquipment(index);
    }

    return totalGold;
  }

  openShop(): void {
    this.shopItems = this.generateShopItems();
    this.shopOpen = true;
    if (this.onShopOpen) {
      this.onShopOpen([...this.shopItems]);
    }
  }

  closeShop(): void {
    this.shopOpen = false;
  }

  isShopOpen(): boolean {
    return this.shopOpen;
  }

  getShopItems(): ShopItem[] {
    return [...this.shopItems];
  }

  private generateShopItems(): ShopItem[] {
    const items: ShopItem[] = [];
    const wave = this.gameState.currentWave;

    items.push({
      id: 'shop_health',
      type: 'refill',
      price: 50 + wave * 5,
      sold: false,
    });

    items.push({
      id: 'shop_potion',
      type: 'item',
      itemId: 'health_potion',
      price: 30 + wave * 3,
      sold: false,
    });

    items.push({
      id: 'shop_bomb',
      type: 'item',
      itemId: 'bomb',
      price: 80 + wave * 8,
      sold: false,
    });

    const { rarities, weights } = getRarityDropWeights(this.player.level);
    const slots: ('weapon' | 'armor' | 'pants' | 'shoulder' | 'belt' | 'shoes' | 'earring' | 'ring' | 'necklace')[] = 
      ['weapon', 'armor', 'pants', 'shoulder', 'belt', 'shoes', 'earring', 'ring', 'necklace'];

    for (let i = 0; i < 3; i++) {
      const slot = slots[Math.floor(Math.random() * slots.length)];
      
      let rarity: EquipRarity = 'common';
      const roll = Math.random() * 100;
      let cumulative = 0;
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      for (let j = 0; j < rarities.length; j++) {
        cumulative += (weights[j] / totalWeight) * 100;
        if (roll < cumulative) {
          rarity = rarities[j];
          break;
        }
      }

      const level = Math.max(1, Math.floor(wave / 3) + Math.floor(Math.random() * 3));
      const equipment = createEquipment(slot, rarity, level);
      
      const priceMap = {
        common: 100,
        advanced: 300,
        fine: 800,
        legendary: 2000,
        epic: 5000,
        mythic: 12000,
      };
      const equipPrice = priceMap[rarity as keyof typeof priceMap] || 100;

      items.push({
        id: `shop_equip_${i}`,
        type: 'equipment',
        equipment,
        price: Math.floor(equipPrice * (1 + level * 0.2)),
        sold: false,
      });
    }

    return items;
  }

  buyShopItem(itemId: string): boolean {
    const shopItem = this.shopItems.find(i => i.id === itemId);
    if (!shopItem || shopItem.sold) return false;
    if (this.player.gold < shopItem.price) return false;

    this.player.gold -= shopItem.price;
    shopItem.sold = true;

    if (shopItem.type === 'refill') {
      this.player.health = this.player.maxHealth;
    } else if (shopItem.type === 'item' && shopItem.itemId) {
      const existing = this.inventory.find(i => i.itemId === shopItem.itemId);
      if (existing) {
        existing.count++;
      } else if (this.inventory.length < STORAGE_CAPACITY.inventory) {
        this.inventory.push({ itemId: shopItem.itemId, count: 1 });
      } else {
        // 物品栏已满，溢入待发邮件
        if (!this.pendingMailDrops.items) this.pendingMailDrops.items = [];
        const exist = this.pendingMailDrops.items.find(i => i.itemId === shopItem.itemId);
        if (exist) exist.count++;
        else this.pendingMailDrops.items.push({ itemId: shopItem.itemId, count: 1 });
      }
      if (this.onInventoryChange) {
        this.onInventoryChange(this.inventory);
      }
    } else if (shopItem.type === 'equipment' && shopItem.equipment) {
      this.addToStorage(shopItem.equipment);
    }

    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }
    if (this.onShopOpen) {
      this.onShopOpen([...this.shopItems]);
    }

    return true;
  }

  refreshShop(): boolean {
    const refreshCost = 50 + this.gameState.currentWave * 5;
    if (this.player.gold < refreshCost) return false;

    this.player.gold -= refreshCost;
    this.shopItems = this.generateShopItems();
    
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }
    if (this.onShopOpen) {
      this.onShopOpen([...this.shopItems]);
    }

    return true;
  }

  // ===== 装备商人系统 =====
  /** 获取商人状态：玩家等级、金币、可购买等级档位、各档位材料持有量 */
  getEquipmentMerchantStatus(): {
    playerLevel: number;
    gold: number;
    tiers: number[];
  } {
    return {
      playerLevel: this.player.level,
      gold: this.player.gold,
      tiers: getMerchantTiers(this.player.level),
    };
  }

  /** 获取某档位的可购买装备列表（9 件，普通-精致） */
  getMerchantEquipment(tierLevel: number): MerchantEquipment[] {
    let list = this.merchantEquipmentCache.get(tierLevel);
    if (!list) {
      list = generateMerchantEquipmentSet(tierLevel);
      this.merchantEquipmentCache.set(tierLevel, list);
    }
    return list;
  }

  /** 获取某档位的设计图列表（9 件，传说-史诗） */
  getMerchantBlueprints(tierLevel: number): Blueprint[] {
    let list = this.merchantBlueprintCache.get(tierLevel);
    if (!list) {
      list = generateBlueprintSet(tierLevel);
      this.merchantBlueprintCache.set(tierLevel, list);
    }
    // 刷新材料持有量
    for (const bp of list) {
      for (const m of bp.materials) {
        m.have = this.getItemCount(m.itemId);
      }
    }
    return list;
  }

  /** 购买装备（第一页，消耗金币，不限次购买） */
  buyMerchantEquipment(itemId: string): { success: boolean; msg?: string } {
    for (const [tier, list] of this.merchantEquipmentCache) {
      const item = list.find(i => i.id === itemId);
      if (!item) continue;
      if (this.player.gold < item.price) return { success: false, msg: '金币不足' };
      if (this.equipmentStorage.length >= STORAGE_CAPACITY.equipment) {
        return { success: false, msg: '装备仓库已满' };
      }
      this.player.gold -= item.price;
      // 每次购买生成新的装备实例（避免共享 id）
      const newEquip = createEquipment(item.equipment.slot, item.equipment.rarity, item.equipment.level);
      this.addToStorage(newEquip);
      if (this.onPlayerChange) this.onPlayerChange(this.player);
      return { success: true };
    }
    return { success: false, msg: '商品不存在' };
  }

  /** 购买设计图（第二页，消耗金币，设计图作为消耗品加入物品栏，不限次购买） */
  buyMerchantBlueprint(bpId: string): { success: boolean; msg?: string } {
    for (const [tier, list] of this.merchantBlueprintCache) {
      const bp = list.find(b => b.id === bpId);
      if (!bp) continue;
      if (this.player.gold < bp.price) return { success: false, msg: '金币不足' };
      // 校验物品栏容量（已存在同种设计图则可叠加，不算新增）
      const existing = this.inventory.find(s => s.itemId === bp.id);
      if (!existing && this.inventory.length >= STORAGE_CAPACITY.inventory) {
        return { success: false, msg: '物品栏已满' };
      }
      this.player.gold -= bp.price;
      // 设计图作为消耗品加入物品栏（itemId 即 bp.id，addToInventory 内部会推送 onInventoryChange）
      this.addToInventory(bp.id);
      if (this.onPlayerChange) this.onPlayerChange(this.player);
      return { success: true };
    }
    return { success: false, msg: '设计图不存在' };
  }

  /** 制作设计图装备：消耗材料+设计图+金币，产出装备 */
  craftBlueprint(bpId: string): { success: boolean; msg?: string; equipment?: Equipment } {
    // 设计图道具即 bpId（itemId === blueprint.id）
    const bpStack = this.inventory.find(i => i.itemId === bpId);
    if (!bpStack || bpStack.count <= 0) return { success: false, msg: '未持有该设计图' };
    // 反查 Blueprint 元数据
    const bp = getBlueprintDefFromItemId(bpId);
    if (!bp) return { success: false, msg: '设计图无效' };
    // 校验材料
    for (const m of bp.materials) {
      if (this.getItemCount(m.itemId) < m.count) return { success: false, msg: '材料不足' };
    }
    if (this.player.gold < bp.goldCost) return { success: false, msg: '金币不足' };
    if (this.equipmentStorage.length >= STORAGE_CAPACITY.equipment) {
      return { success: false, msg: '装备仓库已满' };
    }
    // 消耗材料
    for (const m of bp.materials) {
      this.consumeItem(m.itemId, m.count);
    }
    // 消耗设计图道具 ×1
    bpStack.count--;
    if (bpStack.count <= 0) {
      this.inventory = this.inventory.filter(i => i.itemId !== bpId);
    }
    this.player.gold -= bp.goldCost;
    // 生成装备
    const equip = createEquipment(bp.slot, bp.rarity, bp.level);
    this.addToStorage(equip);
    if (this.onPlayerChange) this.onPlayerChange(this.player);
    if (this.onInventoryChange) this.onInventoryChange(this.inventory);
    return { success: true, equipment: equip };
  }

  /** 清空商人缓存（关闭弹窗时调用） */
  clearMerchantCache(): void {
    this.merchantEquipmentCache.clear();
    this.merchantBlueprintCache.clear();
  }

  // ===== 装备属性调整/变化系统 =====
  /** 获取装备属性调整预览（显示阈值） */
  getStatRerollPreview(equipId: string): {
    stats: { type: string; label: string; current: number; min: number; max: number }[];
    equip: Equipment;
  } | null {
    const equip = this.equipmentStorage.find(e => e.id === equipId) || this.equipment.find(e => e.id === equipId);
    if (!equip) return null;
    const baseStats = getEquipmentBaseStats(equip);
    return {
      stats: baseStats.map(s => {
        const { min, max } = getStatThreshold(equip.rarity, equip.level, s.type);
        return { type: s.type, label: BASE_STAT_LABELS[s.type] || s.type, current: s.value, min, max };
      }),
      equip,
    };
  }

  /** 应用装备属性调整箱：消耗道具，在阈值内重摇数值（类型不变） */
  applyStatReroll(equipId: string): { success: boolean; msg?: string } {
    const boxStack = this.inventory.find(i => i.itemId === 'stat_reroll_box');
    if (!boxStack || boxStack.count <= 0) return { success: false, msg: '无调整箱' };
    const equip = this.equipmentStorage.find(e => e.id === equipId) || this.equipment.find(e => e.id === equipId);
    if (!equip) return { success: false, msg: '装备不存在' };
    const newEquip = rerollEquipmentStats(equip);
    // 替换原装备
    const sIdx = this.equipmentStorage.findIndex(e => e.id === equipId);
    if (sIdx !== -1) {
      this.equipmentStorage[sIdx] = newEquip;
      if (this.onEquipmentStorageChange) this.onEquipmentStorageChange(this.equipmentStorage);
    } else {
      const eIdx = this.equipment.findIndex(e => e.id === equipId);
      if (eIdx !== -1) {
        this.equipment[eIdx] = newEquip;
        this.calculatePlayerStats();
        if (this.onEquipmentChange) this.onEquipmentChange(this.equipment);
      }
    }
    // 消耗道具
    boxStack.count--;
    if (boxStack.count <= 0) this.inventory = this.inventory.filter(i => i.itemId !== 'stat_reroll_box');
    if (this.onInventoryChange) this.onInventoryChange(this.inventory);
    return { success: true };
  }

  /** 应用装备属性变化器：消耗道具，随机变更属性类型+数值 */
  applyStatTransform(equipId: string): { success: boolean; msg?: string; before?: string[]; after?: string[] } {
    const boxStack = this.inventory.find(i => i.itemId === 'stat_transformer');
    if (!boxStack || boxStack.count <= 0) return { success: false, msg: '无变化器' };
    const equip = this.equipmentStorage.find(e => e.id === equipId) || this.equipment.find(e => e.id === equipId);
    if (!equip) return { success: false, msg: '装备不存在' };
    const before = getEquipmentBaseStats(equip).map(s => `${BASE_STAT_LABELS[s.type]||s.type}+${s.value}`);
    const newEquip = transformEquipmentStats(equip);
    const after = getEquipmentBaseStats(newEquip).map(s => `${BASE_STAT_LABELS[s.type]||s.type}+${s.value}`);
    const sIdx = this.equipmentStorage.findIndex(e => e.id === equipId);
    if (sIdx !== -1) {
      this.equipmentStorage[sIdx] = newEquip;
      if (this.onEquipmentStorageChange) this.onEquipmentStorageChange(this.equipmentStorage);
    } else {
      const eIdx = this.equipment.findIndex(e => e.id === equipId);
      if (eIdx !== -1) {
        this.equipment[eIdx] = newEquip;
        this.calculatePlayerStats();
        if (this.onEquipmentChange) this.onEquipmentChange(this.equipment);
      }
    }
    boxStack.count--;
    if (boxStack.count <= 0) this.inventory = this.inventory.filter(i => i.itemId !== 'stat_transformer');
    if (this.onInventoryChange) this.onInventoryChange(this.inventory);
    return { success: true, before, after };
  }

  upgradeSkill(skillId: string): boolean {
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill) return false;
    if (skill.level >= skill.maxLevel) return false;
    if (this.player.skillPoints < skill.cost) return false;
    if (this.player.level < skill.requiredLevel) return false;
    if (skill.requiredSkills) {
      for (const reqId of skill.requiredSkills) {
        const reqSkill = this.skills.find(s => s.id === reqId);
        if (!reqSkill || reqSkill.level === 0) return false;
      }
    }
    this.player.skillPoints -= skill.cost;
    skill.level++;
    this.skillsDirty = true;
    this.calculatePlayerStats();
    if (this.onSkillsChange) {
      this.onSkillsChange(this.skills);
    }
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }
    return true;
  }

  // 获取技能等级（O(1) Map 查找，热路径专用）
  private getSkillLevel(id: string): number {
    if (this.skillsDirty) {
      this.skillLevels.clear();
      for (const s of this.skills) {
        this.skillLevels.set(s.id, s.level);
      }
      this.skillsDirty = false;
    }
    return this.skillLevels.get(id) || 0;
  }

  downgradeSkill(skillId: string): boolean {
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill) return false;
    if (skill.level <= 0) return false;
    // 不能降级被其他技能依赖的技能
    for (const other of this.skills) {
      if (other.id === skillId) continue;
      if (other.requiredSkills?.includes(skillId) && other.level > 0) {
        return false;
      }
    }
    skill.level--;
    this.player.skillPoints += skill.cost;
    this.skillsDirty = true;
    this.calculatePlayerStats();
    if (this.onSkillsChange) {
      this.onSkillsChange(this.skills);
    }
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }
    return true;
  }

  resetSkills(): void {
    let refunded = 0;
    for (const skill of this.skills) {
      if (skill.level > 0) {
        refunded += skill.cost * skill.level;
        skill.level = 0;
        skill.currentCooldown = 0;
      }
    }
    this.player.skillPoints += refunded;
    this.skillsDirty = true;
    this.calculatePlayerStats();
    if (this.onSkillsChange) {
      this.onSkillsChange(this.skills);
    }
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }
  }

  private updateParticles(dt: number): void {
    const particles = this.particlePool.getActive();
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt;
      if (p.life <= 0) {
        this.particlePool.release(p);
      }
    }
  }

  private updateDamageNumbers(dt: number): void {
    const numbers = this.damageNumberPool.getActive();
    for (const dn of numbers) {
      dn.y -= 50 * dt;
      dn.life -= dt;
      if (dn.life <= 0) {
        this.damageNumberPool.release(dn);
      }
    }
  }

  private updateScreenShake(dt: number): void {
    if (this.screenShake > 0) {
      this.screenShake -= dt * 20;
      if (this.screenShake < 0) this.screenShake = 0;
    }
    // 更新核弹冲击波环
    for (let i = this.nukeShockwaves.length - 1; i >= 0; i--) {
      const sw = this.nukeShockwaves[i];
      sw.radius += dt * 400; // 扩散速度
      sw.alpha -= dt * 1.5;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.nukeShockwaves.splice(i, 1);
      }
    }
  }

  private buildEnemyGrid(): void {
    this.enemyGrid.clear();
    const enemies = this.enemyPool.getActive();
    // 性能优化：将敌人加入所有重叠的网格单元，避免子弹穿过大体积敌人
    for (const enemy of enemies) {
      const minCx = Math.floor(enemy.x / this.gridCellSize);
      const maxCx = Math.floor((enemy.x + enemy.width) / this.gridCellSize);
      const minCy = Math.floor(enemy.y / this.gridCellSize);
      const maxCy = Math.floor((enemy.y + enemy.height) / this.gridCellSize);
      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cy = minCy; cy <= maxCy; cy++) {
          const key = cx * 10000 + cy;
          let cell = this.enemyGrid.get(key);
          if (!cell) {
            cell = [];
            this.enemyGrid.set(key, cell);
          }
          cell.push(enemy);
        }
      }
    }
  }

  private getNearbyEnemies(x: number, y: number, w: number, h: number): Enemy[] {
    // 性能优化：用版本号标志位代替 Set，避免每子弹 Set.has/add 开销
    const result = this._nearbyBuf;
    result.length = 0;
    const flag = ++this._nearbyFlag;
    const minCx = Math.floor(x / this.gridCellSize);
    const maxCx = Math.floor((x + w) / this.gridCellSize);
    const minCy = Math.floor(y / this.gridCellSize);
    const maxCy = Math.floor((y + h) / this.gridCellSize);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.enemyGrid.get(cx * 10000 + cy);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const e = cell[i];
            const ef = (e as any).__nearbyFlag as number | undefined;
            if (ef !== flag) {
              (e as any).__nearbyFlag = flag;
              result.push(e);
            }
          }
        }
      }
    }
    return result;
  }

  private checkCollisions(): void {
    const bullets = this.bulletPool.getActive();
    const enemies = this.enemyPool.getActive();
    const bulletPierceCount = (this.player as any).bulletPierceCount || 0;

    // 敌方子弹与玩家碰撞检测
    this.checkEnemyBulletCollisions();

    // 构建空间网格
    this.buildEnemyGrid();

    // 性能优化：复用 bulletBox 对象，避免每子弹分配
    const bulletBox = this._bulletBox;

    for (const bullet of bullets) {
      if (!bullet.active) continue;
      const bulletAny = bullet as any;
      // 敌方抛物线子弹不与敌人碰撞（只打玩家，碰撞在updateBullets中处理）
      if (bulletAny.isEnemyProjectile || bulletAny.isParabolic) continue;

      let hitCount = 0;
      const maxHits = bulletPierceCount + 1;
      let hitEnemy: Enemy | null = null;

      const bx = bullet.x - bullet.width / 2;
      const by = bullet.y - bullet.height / 2;
      // 复用 bulletBox，避免每子弹分配对象
      bulletBox.x = bx;
      bulletBox.y = by;
      bulletBox.width = bullet.width;
      bulletBox.height = bullet.height;

      // 只检查附近网格中的敌人
      const nearby = this.getNearbyEnemies(bx, by, bullet.width, bullet.height);
      for (const enemy of nearby) {
        if (!enemy.active) continue;

        // 内联 AABB 检测，避免函数调用开销
        if (bulletBox.x < enemy.x + enemy.width &&
            bulletBox.x + bulletBox.width > enemy.x &&
            bulletBox.y < enemy.y + enemy.height &&
            bulletBox.y + bulletBox.height > enemy.y) {
          this.damageEnemy(enemy, bullet.damage, undefined, false, bulletAny);
          hitEnemy = enemy;
          hitCount++;
          if (hitCount >= maxHits) {
            this.bulletPool.release(bullet);
            break;
          }
        }
      }

      if (hitEnemy && bulletAny.isBombBullet && bulletAny.hasBomb && bulletAny.bombLvl > 0) {
        const bombLvl = bulletAny.bombLvl;
        // 主动爆弹使用自定义半径和灼烧；被动使用原始公式
        const bombRadius = bulletAny.activeBomb ? bulletAny.activeBombRadius : 30 + 5 * (bombLvl - 1);
        const bombDamage = bulletAny.activeBomb ? this.player.attack : bombLvl * this.player.attack;
        const activeBurnDmg = bulletAny.activeBomb ? bulletAny.activeBombBurnDmg : 0;
        const bx = hitEnemy.x + hitEnemy.width / 2;
        const by = hitEnemy.y + hitEnemy.height / 2;

        // 直接命中的敌人施加灼烧
        if (bulletAny.bombBurnLvl > 0) {
          const burnDmg = 5 + bulletAny.bombBurnLvl * 5;
          this.applySingleEnemyDebuff(hitEnemy, 'burn', burnDmg, 3000);
        } else if (activeBurnDmg > 0) {
          this.applySingleEnemyDebuff(hitEnemy, 'burn', activeBurnDmg, 3000);
        }

        // 爆炸范围查询也使用网格
        const bombNearby = this.getNearbyEnemies(bx - bombRadius, by - bombRadius, bombRadius * 2, bombRadius * 2);
        for (const enemy of bombNearby) {
          if (!enemy.active || enemy === hitEnemy) continue;
          const ex = enemy.x + enemy.width / 2;
          const ey = enemy.y + enemy.height / 2;
          const distSq = (ex - bx) * (ex - bx) + (ey - by) * (ey - by);
          if (distSq <= bombRadius * bombRadius) {
            this.damageEnemy(enemy, bombDamage, undefined, true);
            if (bulletAny.bombBurnLvl > 0) {
              const burnDmg = 5 + bulletAny.bombBurnLvl * 5;
              this.applySingleEnemyDebuff(enemy, 'burn', burnDmg, 3000);
            } else if (activeBurnDmg > 0) {
              this.applySingleEnemyDebuff(enemy, 'burn', activeBurnDmg, 3000);
            }
          }
        }
      }

      // 电击弹：命中后连锁
      if (hitEnemy && bulletAny.isWaveBullet && bulletAny.waveLvl > 0) {
        const waveLvl = bulletAny.waveLvl;
        const hx = hitEnemy.x + hitEnemy.width / 2;
        const hy = hitEnemy.y + hitEnemy.height / 2;

        if (bulletAny.activeShock) {
          // 主动电击弹：目标受一次普攻伤害+感电5秒，连锁 activeShockChain 个身后敌人
          this.damageEnemy(hitEnemy, this.player.attack, undefined, true);
          this.applySingleEnemyDebuff(hitEnemy, 'lightning', 10, 5000);
          if (this.particlePool.canAcquire()) {
            for (let p = 0; p < 5; p++) {
              this.particlePool.acquire(hx + (Math.random() - 0.5) * 16, hy + (Math.random() - 0.5) * 16, '#FFFF88');
            }
          }
          const chainCount = bulletAny.activeShockChain || 0;
          if (chainCount > 0) {
            const chainRange = 200;
            const chainNearby = this.getNearbyEnemies(hx - chainRange, hy - chainRange, chainRange * 2, chainRange * 2);
            const candidates: { enemy: Enemy; distSq: number }[] = [];
            for (const enemy of chainNearby) {
              if (!enemy.active || enemy === hitEnemy) continue;
              const ex = enemy.x + enemy.width / 2;
              const ey = enemy.y + enemy.height / 2;
              const distSq = (ex - hx) * (ex - hx) + (ey - hy) * (ey - hy);
              if (distSq <= chainRange * chainRange) {
                candidates.push({ enemy, distSq });
              }
            }
            candidates.sort((a, b) => a.distSq - b.distSq);
            const chained = Math.min(chainCount, candidates.length);
            for (let i = 0; i < chained; i++) {
              this.damageEnemy(candidates[i].enemy, this.player.attack, undefined, true);
              this.applySingleEnemyDebuff(candidates[i].enemy, 'lightning', 10, 5000);
              const ce = candidates[i].enemy;
              if (this.particlePool.canAcquire()) {
                for (let p = 0; p < 5; p++) {
                  this.particlePool.acquire(ce.x + ce.width / 2 + (Math.random() - 0.5) * 16, ce.y + ce.height / 2 + (Math.random() - 0.5) * 16, '#FFFF88');
                }
              }
            }
          }
        } else {
          // 被动电击弹：连锁2个附近敌人
          const chainCount = 2;
          const chainRange = 80 + waveLvl * 10;
          const chainDamage = waveLvl * this.player.attack;

          // 查找附近敌人并按距离排序
          const chainNearby = this.getNearbyEnemies(hx - chainRange, hy - chainRange, chainRange * 2, chainRange * 2);
          const candidates: { enemy: Enemy; distSq: number }[] = [];
          for (const enemy of chainNearby) {
            if (!enemy.active || enemy === hitEnemy) continue;
            const ex = enemy.x + enemy.width / 2;
            const ey = enemy.y + enemy.height / 2;
            const distSq = (ex - hx) * (ex - hx) + (ey - hy) * (ey - hy);
            if (distSq <= chainRange * chainRange) {
              candidates.push({ enemy, distSq });
            }
          }
          candidates.sort((a, b) => a.distSq - b.distSq);

          // 连锁伤害
          const chained = Math.min(chainCount, candidates.length);
          for (let i = 0; i < chained; i++) {
            this.damageEnemy(candidates[i].enemy, chainDamage, undefined, true);
            // 电击视觉效果：感电粒子
            const ce = candidates[i].enemy;
            if (this.particlePool.canAcquire()) {
              for (let p = 0; p < 4; p++) {
                this.particlePool.acquire(
                  ce.x + ce.width / 2 + randomRange(-8, 8),
                  ce.y + ce.height / 2 + randomRange(-8, 8),
                  '#00DDFF'
                );
              }
            }
          }
        }
      }
    }

    if (this.laserActive && this.laserDamageReady) {
      const laserLvl = this.getSkillLevel('fx_laser_1') || 1;
      const enemies = this.enemyPool.getActive();
      for (const enemy of enemies) {
        if (enemy.x < this.config.canvasWidth && enemy.x > this.player.x) {
          this.damageEnemy(enemy, laserLvl * this.player.attack * 0.1);
        }
      }
    }

    const cloneCount = this.getCloneCount();
    if (cloneCount > 0) {
      while (this.cloneLasersActive.length < cloneCount) {
        this.cloneLasersActive.push(false);
        this.cloneLaserDurations.push(0);
        this.cloneLaserDamageTimers.push(0);
        this.cloneLaserDamageReady.push(false);
      }
      const laserLvl = this.getSkillLevel('fx_laser_1') || 1;
      const positions = this.getClonePositions();
      for (let i = 0; i < cloneCount; i++) {
        if (this.cloneLasersActive[i] && this.cloneLaserDamageReady[i]) {
          const pos = positions[i];
          const enemies = this.enemyPool.getActive();
          for (const enemy of enemies) {
            if (enemy.x < this.config.canvasWidth && enemy.x > pos.x) {
              this.damageEnemy(enemy, laserLvl * this.player.attack * 0.05);
            }
          }
        }
      }
    }
  }

  private checkEnemyBulletCollisions(): void {
    const bullets = this.bulletPool.getActive();
    const playerInvincible = this.shieldActive || this.player.invincibleTimer > 0 || this.player.isDodging;
    if (playerInvincible) return;

    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    for (const bullet of bullets) {
      if (!bullet.active) continue;
      const bulletAny = bullet as any;
      if (!bulletAny.isEnemyBullet && !bulletAny.isEnemyProjectile) continue;
      if (bulletAny.isTowerBullet) continue;

      const bx = bullet.x - bullet.width / 2;
      const by = bullet.y - bullet.height / 2;

      if (bx < px + pw && bx + bullet.width > px &&
          by < py + ph && by + bullet.height > py) {
        const defense = (this.player as any).defense || 0;
        const reducedDamage = Math.max(1, bullet.damage * (1 - defense / 100));
        this.player.health -= reducedDamage;
        this.bulletPool.release(bullet);

        this.screenShake = Math.max(this.screenShake, 3);
      }
    }
  }

  private damageEnemy(enemy: Enemy, damage: number, element?: ElementType, skipLightningChain = false, bulletFx?: any): void {
    const critRate = (this.player as any).critRate || 0;
    const critDamage = (this.player as any).critDamage || 50;
    const isCrit = Math.random() * 100 < critRate;
    let finalDamage = isCrit ? Math.floor(damage * (1 + critDamage / 100)) : damage;
    
    const debuffs = (enemy as any).debuffs || [];
    for (const debuff of debuffs) {
      const effect = this.debuffEffects[debuff.type];
      if (effect && effect.damageMultiplier) {
        finalDamage = Math.floor(finalDamage * effect.damageMultiplier);
      }
    }
    
    const physicalPenetration = (this.player as any).physicalPenetration || 0;
    const enemyDefense = Math.max(0, ((enemy as any).defense || 0) - physicalPenetration);
    finalDamage = Math.max(1, Math.floor(finalDamage * (1 - enemyDefense / 100)));
    
    enemy.health -= finalDamage;
    enemy.hitFlash = isCrit ? 0.15 : 0.08;
    (enemy as any).hitStunTimer = isCrit ? 120 : 60;

    const dn = this.damageNumberPool.acquire(
      enemy.x + enemy.width / 2, 
      enemy.y, 
      finalDamage, 
      isCrit ? '#FF3333' : '#FFDD44'
    );
    if (dn) {
      (dn as any).isCrit = isCrit;
      (dn as any).scale = isCrit ? 1.8 : 1;
    }

    const particleCount = isCrit ? 8 : 4;
    const particleColor = isCrit ? '#FF6644' : enemy.color;
    if (this.particlePool.canAcquire()) {
      for (let i = 0; i < particleCount; i++) {
        this.particlePool.acquire(
          enemy.x + enemy.width / 2 + randomRange(-10, 10),
          enemy.y + enemy.height / 2 + randomRange(-10, 10),
          particleColor
        );
      }
    }

    if (isCrit) {
      this.screenShake = Math.max(this.screenShake, 3);
    }

    const burnChance = (this.player as any).burnChance || 0;
    const burnDamage = (this.player as any).burnDamage || 0;
    const burnDuration = (this.player as any).burnDuration || 0;
    if (burnChance > 0 && burnDamage > 0 && Math.random() * 100 < burnChance) {
      this.applySingleEnemyDebuff(enemy, 'burn', burnDamage, burnDuration);
    }

    const poisonChance = (this.player as any).poisonChance || 0;
    const poisonDamage = (this.player as any).poisonDamage || 0;
    const poisonDuration = (this.player as any).poisonDuration || 0;
    if (poisonChance > 0 && poisonDamage > 0 && Math.random() * 100 < poisonChance) {
      this.applySingleEnemyDebuff(enemy, 'poison', poisonDamage, poisonDuration);
    }

    const freezeChance = (this.player as any).freezeChance || 0;
    const freezeSlowAmount = (this.player as any).freezeSlowAmount || 0;
    const freezeDuration = (this.player as any).freezeDuration || 0;
    if (freezeChance > 0 && freezeSlowAmount > 0 && Math.random() * 100 < freezeChance) {
      if (freezeSlowAmount >= 100) {
        (enemy as any).frozenUntil = performance.now() + freezeDuration;
      } else {
        this.applySingleEnemyDebuff(enemy, 'slow', freezeSlowAmount, freezeDuration);
      }
    }

    const lightningChance = (this.player as any).lightningChance || 0;
    const lightningChain = (this.player as any).lightningChain || 0;
    const lightningDamage = (this.player as any).lightningDamage || 0;
    if (!skipLightningChain && lightningChance > 0 && lightningChain > 0 && lightningDamage > 0 && Math.random() * 100 < lightningChance) {
      this.chainLightning(enemy, lightningDamage, lightningChain);
    }

    const lifestealPercent = (this.player as any).lifestealPercent || 0;
    const lifestealFlat = (this.player as any).lifestealFlat || 0;
    let healAmount = 0;
    if (lifestealPercent > 0) {
      healAmount += Math.floor(finalDamage * lifestealPercent / 100);
    }
    if (lifestealFlat > 0) {
      healAmount += lifestealFlat;
    }
    if (healAmount > 0) {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + healAmount);
    }

    if (bulletFx) {
      if (bulletFx.isFreezeBullet && bulletFx.freezeLvl > 0) {
        // 主动冰冻弹：100%冰冻目标，并连锁冰冻身后 activeFreezeCount-1 个敌人
        // 被动冰冻弹：按概率冰冻单个目标
        if (bulletFx.activeFreeze) {
          (enemy as any).frozenUntil = performance.now() + 3000;
          // 冰冻粒子
          if (this.particlePool.canAcquire()) {
            for (let p = 0; p < 6; p++) {
              this.particlePool.acquire(enemy.x + enemy.width / 2 + (Math.random() - 0.5) * 20, enemy.y + enemy.height / 2 + (Math.random() - 0.5) * 20, '#00CCFF');
            }
          }
          // 连锁冰冻身后敌人
          const extraCount = (bulletFx.activeFreezeCount || 1) - 1;
          if (extraCount > 0) {
            const ex = enemy.x + enemy.width / 2;
            const ey = enemy.y + enemy.height / 2;
            const chainRange = 150;
            const chainNearby = this.getNearbyEnemies(ex - chainRange, ey - chainRange, chainRange * 2, chainRange * 2);
            const candidates: { e: Enemy; d: number }[] = [];
            for (const e of chainNearby) {
              if (!e.active || e === enemy) continue;
              const eex = e.x + e.width / 2;
              const eey = e.y + e.height / 2;
              candidates.push({ e, d: (eex - ex) * (eex - ex) + (eey - ey) * (eey - ey) });
            }
            candidates.sort((a, b) => a.d - b.d);
            const chain = Math.min(extraCount, candidates.length);
            for (let i = 0; i < chain; i++) {
              (candidates[i].e as any).frozenUntil = performance.now() + 3000;
              if (this.particlePool.canAcquire()) {
                for (let p = 0; p < 4; p++) {
                  this.particlePool.acquire(candidates[i].e.x + candidates[i].e.width / 2 + (Math.random() - 0.5) * 16, candidates[i].e.y + candidates[i].e.height / 2 + (Math.random() - 0.5) * 16, '#00CCFF');
                }
              }
            }
          }
        } else {
          const chance = 1 + 1 * (bulletFx.freezeLvl - 1);
          if (Math.random() * 100 < chance) {
            (enemy as any).frozenUntil = performance.now() + 3000;
          }
        }
      }
      if (bulletFx.isPoisonBullet && bulletFx.poisonLvl > 0 && bulletFx.poisonAoe) {
        // 主动毒气弹使用自定义范围/持续/伤害；被动使用原始值
        const poisonDmg = bulletFx.activePoison ? bulletFx.activePoisonDmg : bulletFx.poisonLvl * this.player.attack;
        const aoeRadius = bulletFx.activePoison ? bulletFx.activePoisonRadius : 15;
        const poisonDuration = bulletFx.activePoison ? bulletFx.activePoisonDuration : 5000;
        const ex = enemy.x + enemy.width / 2;
        const ey = enemy.y + enemy.height / 2;
        const enemies = this.enemyPool.getActive();
        for (const e of enemies) {
          if (!e.active) continue;
          const eex = e.x + e.width / 2;
          const eey = e.y + e.height / 2;
          const distSq = (eex - ex) * (eex - ex) + (eey - ey) * (eey - ey);
          if (distSq <= aoeRadius * aoeRadius) {
            this.applySingleEnemyDebuff(e, 'poison', Math.max(poisonDmg, 1), poisonDuration);
          }
        }
      }
    }

    if (enemy.health <= 0) {
      if ((enemy as any).isSandbag && !(enemy as any).isMonsterSandbag) {
        enemy.health = enemy.maxHealth;
      } else {
        this.killEnemy(enemy);
      }
    }
  }

  private applySingleEnemyDebuff(enemy: Enemy, type: string, damage: number, duration: number): void {
    if (type === 'freeze' || type === 'slow') {
      (enemy as any).debuffs = (enemy as any).debuffs || [];
      const debuffs = (enemy as any).debuffs;
      const existing = debuffs.find((d: any) => d.type === type);
      if (existing) {
        existing.startTime = performance.now();
        existing.duration = duration;
        existing.damage = Math.max(existing.damage, damage);
      } else {
        debuffs.push({ type, damage, duration, startTime: performance.now() });
      }
    } else {
      (enemy as any).debuffs = (enemy as any).debuffs || [];
      const debuffs = (enemy as any).debuffs;
      const existing = debuffs.find((d: any) => d.type === type);
      if (existing) {
        existing.startTime = performance.now();
        existing.duration = duration;
        existing.damage = Math.max(existing.damage, damage);
      } else {
        debuffs.push({ type, damage, duration, startTime: performance.now() });
      }
    }
    // 若目标是 Boss，同步到 bossDebuffsList 供血条下方显示
    if ((enemy as any).isBoss || enemy === (this as any).currentBoss) {
      this.addBossDebuff(type, duration);
    }
  }

  // === Boss 增益/减益状态维护（血条下方一行显示） ===
  // 添加 Boss buff（增益）
  private addBossBuff(type: string, duration: number): void {
    const def = this.bossBuffDefs[type];
    if (!def) return;
    const now = performance.now();
    const existing = this.bossBuffsList.find(b => b.type === type);
    if (existing) {
      existing.startAt = now;
      existing.duration = duration;
    } else {
      this.bossBuffsList.push({
        type, name: def.name, icon: def.icon, color: def.color,
        remaining: duration, duration, startAt: now,
      });
    }
  }

  // 添加/刷新 Boss debuff（玩家施加）
  private addBossDebuff(type: string, duration: number): void {
    const def = this.debuffEffects[type];
    if (!def) return;
    const now = performance.now();
    const existing = this.bossDebuffsList.find(d => d.type === type);
    if (existing) {
      existing.startAt = now;
      existing.duration = duration;
    } else {
      this.bossDebuffsList.push({
        type, name: def.name, icon: type, color: def.color,
        remaining: duration, duration, startAt: now,
      });
    }
  }

  // 清空 Boss 状态列表（boss 死亡/消失时调用）
  private clearBossStatus(): void {
    this.bossBuffsList = [];
    this.bossDebuffsList = [];
    this.gameState.bossBuffs = [];
    this.gameState.bossDebuffs = [];
  }

  // Canvas 圆角矩形辅助方法
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // 每帧更新 Boss 状态 remaining 并同步到 gameState（仅当 boss 活跃时）
  private updateBossStatusDisplay(): void {
    if (!this.gameState.bossActive) return;
    const now = performance.now();
    // 清理过期 buff
    this.bossBuffsList = this.bossBuffsList.filter(b => {
      b.remaining = Math.max(0, b.duration - (now - b.startAt));
      return b.remaining > 0;
    });
    // 清理过期 debuff
    this.bossDebuffsList = this.bossDebuffsList.filter(d => {
      d.remaining = Math.max(0, d.duration - (now - d.startAt));
      return d.remaining > 0;
    });
    // 同步到 gameState（创建副本避免引用污染）
    this.gameState.bossBuffs = this.bossBuffsList.map(b => ({
      type: b.type, name: b.name, icon: b.icon, color: b.color,
      remaining: Math.ceil(b.remaining / 1000 * 10) / 10,
      duration: b.duration / 1000,
    }));
    this.gameState.bossDebuffs = this.bossDebuffsList.map(d => ({
      type: d.type, name: d.name, icon: d.icon, color: d.color,
      remaining: Math.ceil(d.remaining / 1000 * 10) / 10,
      duration: d.duration / 1000,
    }));
  }

  private chainLightning(sourceEnemy: Enemy, damage: number, chainCount: number): void {
    const enemies = this.enemyPool.getActive().filter(e => e.active && e !== sourceEnemy);
    const hitEnemies: Enemy[] = [sourceEnemy];
    let current = sourceEnemy;
    let remaining = chainCount;

    while (remaining > 0 && enemies.length > 0) {
      let closest: Enemy | null = null;
      let closestDist = Infinity;
      for (const e of enemies) {
        if (hitEnemies.includes(e)) continue;
        const dist = Math.abs(e.x - current.x) + Math.abs(e.y - current.y);
        if (dist < closestDist && dist < 200) {
          closestDist = dist;
          closest = e;
        }
      }
      if (!closest) break;
      
      this.damageEnemy(closest, damage, 'lightning', true);
      hitEnemies.push(closest);
      current = closest;
      remaining--;
    }
  }

  private killEnemy(enemy: Enemy): void {
    // 炼狱枷锁 / 炼狱BOSS：交由 updatePurgatoryMode 处理阶段切换与刷新，不在此释放
    if ((enemy as any).isPurgatoryChains || (enemy as any).isPurgatoryBoss) {
      return;
    }
    // 材料副本BOSS：交由 updateMaterialMode 处理结算，不在此释放
    if ((enemy as any).isMaterialBoss) {
      return;
    }
    // 怪物沙袋死亡不给予经验/金币/分数，并清理BOSS状态
    if ((enemy as any).isMonsterSandbag) {
      this.gameState.bossActive = false;
      this.gameState.bossHealth = 0;
      this.gameState.bossMaxHealth = 0;
      this.gameState.bossName = '';
      this.enemyPool.release(enemy);
      return;
    }
    this.enemyPool.release(enemy);

    // 普通BOSS死亡后，若怪物沙袋仍存活则恢复其BOSS血条
    // 安全修复：用 getAll() 遍历避免触发 _activeCache 重建（updateEnemies 可能正在迭代 _activeCache）
    if (enemy.isBoss) {
      const allEnemies = this.enemyPool.getAll();
      let sandbag: Enemy | undefined;
      for (let i = 0; i < allEnemies.length; i++) {
        const e = allEnemies[i];
        if (e.active && (e as any).isMonsterSandbag) {
          sandbag = e;
          break;
        }
      }
      if (sandbag) {
        this.gameState.bossActive = true;
        this.gameState.bossHealth = sandbag.health;
        this.gameState.bossMaxHealth = sandbag.maxHealth;
        this.gameState.bossName = sandbag.name;
      } else {
        this.gameState.bossActive = false;
        this.gameState.bossHealth = 0;
        this.gameState.bossMaxHealth = 0;
        this.gameState.bossName = '';
      }
    }

    // 基础经验-50%，基础金币-50%
    const baseExpGain = Math.floor(enemy.exp * 0.5);
    this.addExp(baseExpGain);
    const scoreGain = enemy.type === 'boss' ? baseExpGain * 100 : enemy.type === 'elite' ? baseExpGain * 30 : baseExpGain * 10;
    this.player.score += scoreGain;
    this.player.gold += Math.floor(baseExpGain * 2);

    this.totalKills++;
    this.waveKillCount++;
    this.discoverEnemy(enemy.name);
    this.addEnemyKill(enemy.name);
    this.checkAchievements();

    // 日常挑战：按怪物类型累计击杀数（用于结算奖励）
    if (this.gameMode === 'daily' && this.modeData.dailyPhase === 'fight') {
      if (enemy.isBoss) {
        this.modeData.dailyBossKills = (this.modeData.dailyBossKills || 0) + 1;
      } else if (enemy.isElite) {
        this.modeData.dailyEliteKills = (this.modeData.dailyEliteKills || 0) + 1;
      } else {
        this.modeData.dailyNormalKills = (this.modeData.dailyNormalKills || 0) + 1;
      }
    }

    const killHeal = this.talents.find(t => t.id === 'kill_heal');
    if (killHeal) {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + this.player.maxHealth * killHeal.value / 100);
    }

    if (this.particlePool.canAcquire()) {
      for (let i = 0; i < 10; i++) {
        this.particlePool.acquire(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
      }
    }

    const expValue = enemy.type === 'boss' ? baseExpGain : Math.floor(baseExpGain / 3);
    // 日常挑战：不掉落经验球，改为按概率掉落经验书道具
    if (this.gameMode === 'daily') {
      this.rollDailyExpBookDrop(enemy);
    } else {
      this.dropPool.acquire('exp', enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, expValue);
    }

    const dropBonus = (this.player as any).dropBonus || 0;
    const goldBonus = (this.player as any).goldBonus || 0;

    if (Math.random() < enemy.dropRate * (1 + dropBonus) * 0.25) {
      const rand = Math.random();
      if (rand < 0.2) {
        this.dropPool.acquire('health', enemy.x + enemy.width / 2 + 20, enemy.y + enemy.height / 2, 20);
      } else if (rand < 0.35) {
        const coinValue = Math.floor(baseExpGain * 5 * (1 + goldBonus));
        this.dropPool.acquire('coin', enemy.x + enemy.width / 2 - 20, enemy.y + enemy.height / 2, coinValue);
      } else if (this.gameMode !== 'daily') {
        // 日常挑战不爆道具（只掉金币和血瓶）
        const itemPool = this.getDropItemPool(enemy.type);
        let randomItem = itemPool[randomInt(0, itemPool.length - 1)];
        const baseItem = ITEMS[randomItem];
        if (baseItem && baseItem.effect === 'skill_potion') {
          randomItem = `${randomItem}_lv${this.player.level}`;
        }
        this.dropPool.acquire('item', enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 1, randomItem);
        // 高品质物品气泡提示（精致及以上）
        if (this.onRareDrop && baseItem) {
          const r = baseItem.rarity;
          if (r === 'fine' || r === 'legendary' || r === 'epic' || r === 'mythic') {
            const resolvedItem = getItemDef(randomItem);
            this.onRareDrop({
              id: ++this.rareDropIdCounter,
              rarity: r,
              name: resolvedItem?.name || baseItem.name,
              icon: baseItem.icon,
              kind: 'item',
            });
          }
        }
      }
    }

    // 需求 #10：装备独立掉率（每个品质独立判定）
    // 日常挑战不爆装备
    if (this.gameMode !== 'daily') {
      this.rollEquipmentDrops(enemy);
    }

    // 材料：所有非日常模式均掉落（精致及以下=小怪；传说-史诗=精英；史诗-神话=BOSS）
    if (this.gameMode !== 'daily') {
      this.rollMaterialDrops(enemy);
    }

    this.screenShake = enemy.type === 'boss' ? 10 : enemy.type === 'elite' ? 5 : 2;
  }

  // 需求 #10：按敌人类型独立判定各品质装备掉落
  private rollEquipmentDrops(enemy: Enemy): void {
    const slots: EquipSlot[] = ['weapon', 'armor', 'pants', 'shoulder', 'belt', 'shoes', 'earring', 'ring', 'necklace'];
    const dropX = enemy.x + enemy.width / 2;
    const dropY = enemy.y + enemy.height / 2;

    const playerLevel = this.player.level;
    const enemyType = enemy.type as 'normal' | 'elite' | 'boss';
    const dropLevel = enemy.type === 'boss' ? this.getBossDropLevel() : this.getDropLevel();

    let offsetIdx = 0;
    for (const rarityStr of ['common', 'advanced', 'fine', 'legendary', 'epic', 'mythic'] as EquipRarity[]) {
      const chance = getRarityDropChance(playerLevel, rarityStr, enemyType);
      if (!chance || chance <= 0) continue;
      if (Math.random() < chance) {
        const slot = slots[randomInt(0, slots.length - 1)];
        const equip = createEquipment(slot, rarityStr, dropLevel);
        this.droppedEquipmentMap.set(equip.id, equip);
        const ox = dropX + (offsetIdx % 3 - 1) * 18;
        const oy = dropY + Math.floor(offsetIdx / 3) * 14;
        this.dropPool.acquire('equipment', ox, oy, 0, undefined, equip.id);
        if (this.onRareDrop && (rarityStr === 'fine' || rarityStr === 'legendary' || rarityStr === 'epic' || rarityStr === 'mythic')) {
          const slotLabel = SLOT_LABELS[slot] || slot;
          const rarityName = RARITY_LABELS[rarityStr] || rarityStr;
          this.onRareDrop({
            id: ++this.rareDropIdCounter,
            rarity: rarityStr,
            name: `${rarityName}${slotLabel} Lv.${dropLevel}`,
            icon: this.getEquipSlotIcon(slot),
            kind: 'equipment',
          });
        }
        offsetIdx++;
      }
    }
  }

  // 材料掉落：精致及以下=小怪；传说-史诗=精英；史诗-神话=BOSS
  // 所有非日常模式均掉落；材料类型 4 选 1，品质按敌人类型与玩家等级决定
  private rollMaterialDrops(enemy: Enemy): void {
    const dropX = enemy.x + enemy.width / 2;
    const dropY = enemy.y + enemy.height / 2;
    const playerLevel = this.player.level;
    const enemyType = enemy.type as 'normal' | 'elite' | 'boss';

    // 1) 按敌人类型确定可掉品质池（沿用装备等级门槛）
    type RarityWeight = { rarity: EquipRarity; weight: number };
    let pool: RarityWeight[];
    let dropCount: number;
    if (enemyType === 'normal') {
      // 精致及以下：普通/高级/精致
      const fineGate = playerLevel >= 51;
      pool = [
        { rarity: 'common', weight: 55 },
        { rarity: 'advanced', weight: 30 },
        { rarity: 'fine', weight: fineGate ? 15 : 0 },
      ];
      dropCount = Math.random() < 0.35 ? 1 : 0;
    } else if (enemyType === 'elite') {
      // 传说-史诗
      pool = [
        { rarity: 'legendary', weight: playerLevel >= 100 ? 60 : 0 },
        { rarity: 'epic', weight: playerLevel >= 150 ? 40 : 0 },
      ];
      dropCount = 1 + (Math.random() < 0.4 ? 1 : 0);
    } else {
      // 史诗-神话
      pool = [
        { rarity: 'epic', weight: playerLevel >= 150 ? 65 : 0 },
        { rarity: 'mythic', weight: playerLevel >= 200 ? 35 : 0 },
      ];
      dropCount = 2 + (Math.random() < 0.6 ? 1 : 0);
    }

    const valid = pool.filter(p => p.weight > 0);
    if (valid.length === 0 || dropCount <= 0) return;
    const totalWeight = valid.reduce((s, p) => s + p.weight, 0);

    // 2) 材料类型 4 选 1（等权）
    const materialTypes = ['weapon_fragment', 'armor_cloth', 'armor_iron', 'jewelry_metal'];

    for (let i = 0; i < dropCount; i++) {
      // 抽品质
      let roll = Math.random() * totalWeight;
      let chosenRarity: EquipRarity = valid[0].rarity;
      for (const p of valid) {
        roll -= p.weight;
        if (roll <= 0) { chosenRarity = p.rarity; break; }
      }
      // 抽材料类型
      const matType = materialTypes[randomInt(0, materialTypes.length - 1)];
      const itemId = `${matType}_${chosenRarity}`;
      if (!ITEMS[itemId]) continue;

      const ox = dropX + (i % 3 - 1) * 16;
      const oy = dropY + Math.floor(i / 3) * 14 - 10;
      this.dropPool.acquire('item', ox, oy, 1, itemId);

      // 精致及以上气泡提示
      if (this.onRareDrop && (chosenRarity === 'fine' || chosenRarity === 'legendary' || chosenRarity === 'epic' || chosenRarity === 'mythic')) {
        const def = ITEMS[itemId];
        this.onRareDrop({
          id: ++this.rareDropIdCounter,
          rarity: chosenRarity,
          name: def.name,
          icon: def.icon,
          kind: 'item',
        });
      }
    }
  }

  /** 日常挑战：经验书掉落（替代经验球） */
  private rollDailyExpBookDrop(enemy: Enemy): void {
    const dropX = enemy.x + enemy.width / 2;
    const dropY = enemy.y + enemy.height / 2;
    const books: string[] = [];

    if (enemy.isBoss) {
      // BOSS：必掉1本大经验书 + 2本中经验书
      books.push('exp_book_large');
      books.push('exp_book_medium');
      books.push('exp_book_medium');
    } else if (enemy.isElite) {
      // 精英：必掉1本中经验书 + 30%概率掉1本小经验书
      books.push('exp_book_medium');
      if (Math.random() < 0.3) books.push('exp_book_small');
    } else {
      // 普通怪：25%概率掉1本小经验书
      if (Math.random() < 0.25) books.push('exp_book_small');
    }

    for (let i = 0; i < books.length; i++) {
      const ox = dropX + (i % 3 - 1) * 18;
      const oy = dropY + Math.floor(i / 3) * 14;
      this.dropPool.acquire('item', ox, oy, 1, books[i]);
    }
  }

  // 装备槽位 emoji 图标（用于气泡提示）
  private getEquipSlotIcon(slot: EquipSlot): string {
    const map: Record<EquipSlot, string> = {
      weapon: '⚔️',
      armor: '🛡️',
      pants: '👖',
      shoulder: '🪖',
      belt: '🔗',
      shoes: '👟',
      earring: '💎',
      ring: '💍',
      necklace: '📿',
    };
    return map[slot] || '📦';
  }

  private getDropItemPool(enemyType: EnemyType): string[] {
    const items = Object.entries(ITEMS);
    let pool: string[] = [];
    const potionEffects = new Set(['heal', 'regen', 'attack_boost', 'speed_boost', 'skill_potion']);
    for (const [id, item] of items) {
      // 材料走专用 rollMaterialDrops，不进入普通物品掉落池
      if (item.type === 'material') continue;
      let weight = this.getItemDropWeight(item.rarity, enemyType);
      if (potionEffects.has(item.effect || '')) {
        weight = Math.floor(weight * 2.5);
      }
      for (let i = 0; i < weight; i++) {
        pool.push(id);
      }
    }
    return pool;
  }

  private getItemDropWeight(rarity: string, enemyType: EnemyType): number {
    const baseWeights: Record<string, number> = {
      common: 50,
      advanced: 30,
      fine: 15,
      legendary: 4,
      epic: 1,
      mythic: 0.5,
    };
    const typeMultiplier: Record<EnemyType, number> = {
      normal: 0.5,
      elite: 1.5,
      boss: 3,
    };
    return Math.floor(baseWeights[rarity] * typeMultiplier[enemyType]);
  }

  private generateRandomEquipment(enemyType: EnemyType): Equipment | null {
    const dropLevel = this.getDropLevel();
    const slots: EquipSlot[] = ['weapon', 'armor', 'pants', 'shoulder', 'belt', 'shoes', 'earring', 'ring', 'necklace'];
    const slot = slots[randomInt(0, slots.length - 1)];
    const rarity = this.getDropRarity(enemyType);
    return createEquipment(slot, rarity, dropLevel);
  }

  // 需求 #9：装备每10级一档；Lv.1/10/20.../990/999，最低1最高999
  private getDropLevel(): number {
    const playerLevel = this.player.level;
    if (playerLevel < 10) return 1;
    return Math.min(990, Math.floor(playerLevel / 10) * 10);
  }

  // 需求 #10：BOSS爆高人物两档的装备（人物9级爆20级、Lv.116爆130级）
  private getBossDropLevel(): number {
    const playerLevel = this.player.level;
    const baseTier = Math.floor(playerLevel / 10) * 10;
    return Math.min(999, Math.max(1, baseTier + 20));
  }

  private getDropRarity(enemyType: EnemyType): EquipRarity {
    const rand = Math.random();
    const thresholds: Record<EnemyType, Record<EquipRarity, number>> = {
      normal: { common: 0.6, advanced: 0.85, fine: 0.98, legendary: 0.998, epic: 1, mythic: 1 },
      elite: { common: 0.3, advanced: 0.6, fine: 0.85, legendary: 0.96, epic: 0.995, mythic: 1 },
      boss: { common: 0, advanced: 0.2, fine: 0.5, legendary: 0.8, epic: 0.95, mythic: 1 },
    };
    const t = thresholds[enemyType];
    if (rand < t.common) return 'common';
    if (rand < t.advanced) return 'advanced';
    if (rand < t.fine) return 'fine';
    if (rand < t.legendary) return 'legendary';
    if (rand < t.epic) return 'epic';
    return 'mythic';
  }

  private getRarityColor(rarity: EquipRarity): string {
    const colors: Record<EquipRarity, string> = {
      common: '#9A9A9A',
      advanced: '#5BA3E0',
      fine: '#B060E0',
      legendary: '#E08030',
      epic: '#E0C040',
      mythic: '#E03030',
    };
    return colors[rarity];
  }

  private getRarityBgLight(rarity: EquipRarity): string {
    const colors: Record<EquipRarity, string> = {
      common: '#D4C8B0',
      advanced: '#A8C8E0',
      fine: '#C8A0E0',
      legendary: '#E0B070',
      epic: '#E0D070',
      mythic: '#E07070',
    };
    return colors[rarity];
  }

  private getRarityBgDark(rarity: EquipRarity): string {
    const colors: Record<EquipRarity, string> = {
      common: '#A89880',
      advanced: '#7090B0',
      fine: '#9070B0',
      legendary: '#B08050',
      epic: '#B0A050',
      mythic: '#B05050',
    };
    return colors[rarity];
  }

  useItem(itemId: string): boolean {
    const stack = this.inventory.find(i => i.itemId === itemId);
    if (!stack || stack.count <= 0) return false;

    const itemDef = getItemDef(itemId);
    if (!itemDef) return false;

    // 抽奖罐：由专用方法 openLotteryPot 处理（配合开罐动画弹窗），useItem 不直接消耗
    if (itemDef.effect === 'lottery_pot') return false;
    // 装备属性调整箱/变化器：由专用弹窗处理（选择装备后消耗），useItem 不直接消耗
    if (itemDef.effect === 'stat_reroll' || itemDef.effect === 'stat_transform') return false;
    // 设计图：由专用制作弹窗处理（消耗材料+设计图+金币），useItem 不直接消耗
    if (itemDef.effect === 'craft_blueprint') return false;

    // 分类限制：battle=仅战斗中可用，normal=仅主界面可用
    const category = itemDef.category || 'battle';
    const inBattle = this.gameState.isRunning && !this.gameState.isGameOver;
    if (category === 'battle' && !inBattle) return false;
    if (category === 'normal' && inBattle) return false;

    const cdKey = itemDef.effect;
    // 冷却检查：使用 itemDef.cooldown（持续时间<冷却时间，约3倍）
    if (itemDef.cooldown > 0 && this.itemCooldowns[cdKey]) {
      return false;
    }

    stack.count--;
    if (stack.count <= 0) {
      this.inventory = this.inventory.filter(i => i.itemId !== itemId);
    }

    switch (itemDef.effect) {
      case 'heal':
        const healAmount = Math.floor(this.player.maxHealth * (itemDef.value || 10) / 100);
        this.player.health = Math.min(this.player.maxHealth, this.player.health + healAmount);
        this.showToast(itemDef.icon, `恢复 ${healAmount} 生命`, '#FF6B9D');
        break;
      case 'regen':
        this.addPlayerBuff('regen', itemDef.duration || 10000, itemDef.value || 5);
        this.showToast(itemDef.icon, `持续恢复生命 ${((itemDef.duration || 10000) / 1000)}秒`, '#FF6B9D');
        break;
      case 'attack_boost':
        this.addPlayerBuff('attack', itemDef.duration || 10000, itemDef.value || 50);
        this.showToast(itemDef.icon, `攻击力 +${itemDef.value || 50}% ${((itemDef.duration || 10000) / 1000)}秒`, '#FFD60A');
        break;
      case 'speed_boost':
        this.addPlayerBuff('attack_speed', itemDef.duration || 8000, itemDef.value || 50);
        this.showToast(itemDef.icon, `攻速 +${itemDef.value || 50}% ${((itemDef.duration || 8000) / 1000)}秒`, '#FFD60A');
        break;
      case 'bomb':
        this.bombAllEnemies(itemDef.value || 200);
        this.showToast(itemDef.icon, `对全场造成 ${itemDef.value || 200} 伤害`, '#FF3B3B');
        break;
      case 'poison':
        this.applyEnemyDebuff('poison', itemDef.value || 10, itemDef.duration || 5000);
        this.showToast(itemDef.icon, `敌人中毒 ${((itemDef.duration || 5000) / 1000)}秒`, '#9B59B6');
        break;
      case 'freeze':
        this.applyEnemyDebuff('freeze', 0, itemDef.duration || 3000);
        this.showToast(itemDef.icon, `冻结敌人 ${((itemDef.duration || 3000) / 1000)}秒`, '#5BA3E0');
        break;
      case 'burn':
        this.applyEnemyDebuff('burn', itemDef.value || 20, itemDef.duration || 5000);
        this.showToast(itemDef.icon, `敌人燃烧 ${((itemDef.duration || 5000) / 1000)}秒`, '#FF6B3B');
        break;
      case 'invincible':
        this.addPlayerBuff('invincible', itemDef.duration || 5000, 1);
        this.showToast(itemDef.icon, `无敌 ${((itemDef.duration || 5000) / 1000)}秒`, '#FFD60A');
        break;
      case 'stun':
        this.stunAllEnemies(itemDef.duration || 2000);
        this.showToast(itemDef.icon, `眩晕敌人 ${((itemDef.duration || 2000) / 1000)}秒`, '#5BA3E0');
        break;
      case 'lightning':
        this.lightningStrikeAll(itemDef.value || 150, itemDef.duration || 3000);
        this.showToast(itemDef.icon, `雷电造成 ${itemDef.value || 150} 伤害`, '#FFD60A');
        break;
      case 'curse':
        this.applyEnemyDebuff('curse', itemDef.value || 25, itemDef.duration || 8000);
        this.showToast(itemDef.icon, `诅咒敌人 ${((itemDef.duration || 8000) / 1000)}秒`, '#9B59B6');
        break;
      case 'skill_potion':
        this.useSkillPotion(itemDef);
        this.showToast(itemDef.icon, `获得技能效果`, '#00F5D4');
        break;
      case 'exp_book':
        // 经验书：使用后直接获得对应经验值
        this.addExp(itemDef.value || 200);
        this.showToast(itemDef.icon, `获得 ${itemDef.value || 200} 经验`, '#FFD60A');
        break;
      case 'reward_pot':
        // 奖励罐子：随机获得 500~2000 金币
        {
          const gold = 500 + Math.floor(Math.random() * 1501);
          this.player.gold += gold;
          this.showToast(itemDef.icon, `获得 ${gold} 金币`, '#FFD60A');
        }
        break;
      case 'enhance':
        break;
    }

    // 设置冷却：使用 itemDef.cooldown（独立于持续时间）
    if (itemDef.cooldown > 0) {
      this.itemCooldowns[cdKey] = {
        remaining: itemDef.cooldown,
        duration: itemDef.cooldown,
        icon: itemDef.icon,
        name: itemDef.name,
        itemId: itemDef.id,
      };
    }

    if (this.onInventoryChange) {
      this.onInventoryChange(this.inventory);
    }

    // 同步 player 状态到 UI（金币、经验、等级等变化）
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }

    return true;
  }

  /** 批量使用道具（仅 normal 类）：一次使用指定数量 */
  useItemBatch(itemId: string, count: number): number {
    const stack = this.inventory.find(i => i.itemId === itemId);
    if (!stack || stack.count <= 0) return 0;

    const itemDef = getItemDef(itemId);
    if (!itemDef) return 0;

    // 仅允许 normal 类道具批量使用
    if (itemDef.category !== 'normal') return 0;

    // 战斗中禁止使用 normal 类道具
    const inBattle = this.gameState.isRunning && !this.gameState.isGameOver;
    if (inBattle) return 0;

    const actualCount = Math.min(count, stack.count);
    let usedCount = 0;

    for (let i = 0; i < actualCount; i++) {
      // 逐个使用（保持冷却检查一致性，但 normal 类道具通常无冷却）
      if (this.useItem(itemId)) {
        usedCount++;
      } else {
        break;
      }
    }

    return usedCount;
  }

  /**
   * 开启抽奖罐（DNF 土罐玩法）：消耗 1 个抽奖罐，按权重随机发放一件奖励
   * 由 LotteryPotOpenModal 弹窗在动画结束后调用
   * 返回奖励信息供 UI 展示；若无抽奖罐返回 null
   */
  openLotteryPot(): {
    type: 'gold' | 'exp' | 'item';
    icon: string;
    name: string;
    color: string;
    amount: number;
    itemId?: string;
  } | null {
    const stack = this.inventory.find(i => i.itemId === 'lottery_pot');
    if (!stack || stack.count <= 0) return null;

    // 消耗 1 个抽奖罐
    stack.count--;
    if (stack.count <= 0) {
      this.inventory = this.inventory.filter(i => i.itemId !== 'lottery_pot');
    }

    // 按权重随机选择奖励
    const pool = GameEngine.LOTTERY_POT_REWARDS;
    const totalWeight = pool.reduce((s, r) => s + r.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = pool[0];
    for (const r of pool) {
      roll -= r.weight;
      if (roll <= 0) { chosen = r; break; }
    }

    // 发放奖励
    let amount = 0;
    if (chosen.type === 'gold') {
      amount = (chosen.minGold || 0) + Math.floor(Math.random() * ((chosen.maxGold || 0) - (chosen.minGold || 0) + 1));
      this.player.gold += amount;
    } else if (chosen.type === 'exp') {
      amount = chosen.expValue || 0;
      this.addExp(amount);
    } else if (chosen.type === 'item' && chosen.itemId) {
      amount = chosen.itemCount || 1;
      for (let i = 0; i < amount; i++) {
        this.addToInventory(chosen.itemId!);
      }
    }

    if (this.onInventoryChange) this.onInventoryChange(this.inventory);
    if (this.onPlayerChange) this.onPlayerChange(this.player);
    this.saveGame();

    return {
      type: chosen.type,
      icon: chosen.icon,
      name: chosen.name,
      color: chosen.color,
      amount,
      itemId: chosen.itemId,
    };
  }

  /** 查询当前背包中抽奖罐数量（供 UI 判断是否可继续开启） */
  getLotteryPotCount(): number {
    const stack = this.inventory.find(i => i.itemId === 'lottery_pot');
    return stack ? stack.count : 0;
  }

  batchSellItems(itemIds: string[]): number {
    const sellPrices: Record<string, number> = {
      common: 10,
      advanced: 25,
      fine: 50,
      epic: 100,
      legendary: 200,
      mythic: 500,
    };

    let totalGold = 0;
    
    for (const itemId of itemIds) {
      const stack = this.inventory.find(i => i.itemId === itemId);
      if (!stack) continue;
      
      const itemDef = getItemDef(itemId);
      const price = sellPrices[itemDef?.rarity || 'common'] || 10;
      totalGold += price * stack.count;
      
      this.inventory = this.inventory.filter(i => i.itemId !== itemId);
    }
    
    if (totalGold > 0) {
      this.player.gold += totalGold;
      if (this.onInventoryChange) {
        this.onInventoryChange(this.inventory);
      }
    }

    return totalGold;
  }

  // 技能药水：使用后获得对应效果
  // - 属性类（attack/attackSpeed/maxHealth/critRate/defense/range）：整回合持续
  // - 特效/主动类（laser/sweep/clone）：按实际技能时长倒计时（laser 5s, sweep 10s, clone 整回合）
  // - flash：单次立即效果
  private useSkillPotion(itemDef: ItemDef): void {
    const potionType = (itemDef as any).potionType as string;
    if (!potionType) return;

    // 防重复：同类型药水已在生效中则跳过
    if (potionType !== 'flash') {
      if (this.wavePotionEffects[potionType] !== undefined) return;
      if (this.timedPotionEffects.some(p => p.type === potionType)) return;
    }

    const level = (itemDef as any).potionLevel || this.player.level;
    const icon = itemDef.icon;
    const name = itemDef.name;
    const itemId = itemDef.id;

    switch (potionType) {
      case 'attack': {
        this.wavePotionEffects['attack'] = level;
        break;
      }
      case 'attackSpeed': {
        this.wavePotionEffects['attackSpeed'] = level;
        break;
      }
      case 'maxHealth': {
        const hpBonus = level * 20;
        this.wavePotionEffects['maxHealth'] = hpBonus;
        this.player.health = Math.min(this.player.health + hpBonus, this.player.maxHealth + hpBonus);
        break;
      }
      case 'critRate': {
        this.wavePotionEffects['critRate'] = level;
        break;
      }
      case 'defense': {
        this.wavePotionEffects['defense'] = level;
        break;
      }
      case 'range': {
        this.wavePotionEffects['range'] = level * 5;
        break;
      }
      case 'laser': {
        // 激光炮：按实际技能时长 5 秒，与 fx_laser_1 技能一致
        this.timedPotionEffects.push({ type: 'laser', remaining: 5000, duration: 5000, icon, name, itemId });
        this.laserActive = true;
        this.laserDuration = 5000;
        break;
      }
      case 'flash': {
        this.stunAllEnemies(5000);
        break;
      }
      case 'sweep': {
        // 战术横扫：按实际技能时长 10 秒，与 clone_sweep 技能一致
        this.timedPotionEffects.push({ type: 'sweep', remaining: 10000, duration: 10000, icon, name, itemId });
        this.sweepActive = true;
        this.sweepDuration = 10000;
        break;
      }
      case 'clone': {
        // 分身：整回合持续（与原行为一致）
        this.wavePotionClone = { active: true, level: 1 };
        break;
      }
    }

    this.calculatePlayerStats();
  }

  // 出售装备获得金币（同步引擎 player.gold，避免被 onPlayerChange 覆盖）
  addGold(amount: number): void {
    if (amount <= 0) return;
    this.player.gold += amount;
    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }
  }

  // 同步装备状态到引擎（UI操作后调用，确保 calculatePlayerStats 生效）
  // 容量校验：超限的装备溢入待发邮件，防止 UI 写入超容数据
  syncEquipmentState(equipment: Equipment[], equipmentStorage: Equipment[]): void {
    this.equipment = equipment;
    const cap = STORAGE_CAPACITY.equipment;
    if (equipmentStorage.length <= cap) {
      this.equipmentStorage = equipmentStorage;
    } else {
      // 超容：保留前 cap 件，多余的溢入待发邮件
      this.equipmentStorage = equipmentStorage.slice(0, cap);
      if (!this.pendingMailDrops.equipment) this.pendingMailDrops.equipment = [];
      for (const e of equipmentStorage.slice(cap)) this.pendingMailDrops.equipment.push(e);
    }
    this.calculatePlayerStats();
    if (this.onEquipmentChange) this.onEquipmentChange(this.equipment);
    if (this.onEquipmentStorageChange) this.onEquipmentStorageChange(this.equipmentStorage);
    if (this.onPlayerChange) this.onPlayerChange(this.player);
  }

  // 同步宝石背包到引擎（容量校验：超限丢弃尾部）
  syncGemInventory(gems: ItemStack[]): void {
    this.gemInventory = gems.slice(0, STORAGE_CAPACITY.gem);
    if (this.onGemInventoryChange) this.onGemInventoryChange(this.gemInventory);
  }

  // 同步强化道具背包到引擎（容量校验：超限丢弃尾部）
  syncEnhanceItemInventory(items: ItemStack[]): void {
    this.enhanceItemInventory = items.slice(0, STORAGE_CAPACITY.enhance);
    if (this.onEnhanceItemInventoryChange) this.onEnhanceItemInventoryChange(this.enhanceItemInventory);
  }

  // 装备强化：返回结果供前端展示
  enhanceEquipment(
    equipmentId: string,
    source: 'equipped' | 'storage',
    mode: 'gold' | 'item',
    itemId?: string
  ): { success: boolean; reason?: string; newLevel: number; goldCost: number; failResult?: string } | null {
    // 找到装备
    const list = source === 'equipped' ? this.equipment : this.equipmentStorage;
    const eq = list.find(e => e.id === equipmentId);
    if (!eq) return null;
    const currentLevel = eq.enhanceLevel || 0;
    if (currentLevel >= MAX_ENHANCE_LEVEL) {
      return { success: false, reason: '已达最高强化等级', newLevel: currentLevel, goldCost: 0 };
    }

    let successBonus = 0;
    let goldCost = 0;

    if (mode === 'gold') {
      // 金币消耗
      goldCost = getEnhanceGoldCost(eq.level, eq.rarity, currentLevel);
      if (this.player.gold < goldCost) {
        return { success: false, reason: '金币不足', newLevel: currentLevel, goldCost };
      }
    } else {
      // 道具模式
      if (!itemId) return null;
      const def = ENHANCE_ITEMS[itemId as EnhanceItemId];
      if (!def) return null;
      // 检查库存
      const stack = this.enhanceItemInventory.find(s => s.itemId === itemId);
      if (!stack || stack.count <= 0) {
        return { success: false, reason: '道具不足', newLevel: currentLevel, goldCost: 0 };
      }
      // 卷轴模式：直接 +N，必须满足等级限制
      if (def.mode === 'scroll') {
        const limit = def.maxLevel || 99;
        if (currentLevel >= limit) {
          return { success: false, reason: `限${limit}以下使用`, newLevel: currentLevel, goldCost: 0 };
        }
        // 直接消耗道具并提升等级
        this.enhanceItemInventory = this.enhanceItemInventory
          .map(s => s.itemId === itemId ? { ...s, count: s.count - 1 } : s)
          .filter(s => s.count > 0);
        if (this.onEnhanceItemInventoryChange) this.onEnhanceItemInventoryChange(this.enhanceItemInventory);
        const newLevel = Math.min(currentLevel + (def.plusAmount || 1), MAX_ENHANCE_LEVEL);
        eq.enhanceLevel = newLevel;
        this.syncEquipmentState(this.equipment, this.equipmentStorage);
        return { success: true, newLevel, goldCost: 0 };
      }
      // 强化器模式：免费强化一次
      if (def.successBonus) successBonus = def.successBonus;
      // 消耗道具
      this.enhanceItemInventory = this.enhanceItemInventory
        .map(s => s.itemId === itemId ? { ...s, count: s.count - 1 } : s)
        .filter(s => s.count > 0);
      if (this.onEnhanceItemInventoryChange) this.onEnhanceItemInventoryChange(this.enhanceItemInventory);
    }

    // 金币或强化器：走正常强化流程
    if (mode === 'gold') {
      this.player.gold -= goldCost;
      if (this.onPlayerChange) this.onPlayerChange(this.player);
    }

    const baseRate = getEnhanceSuccessRate(currentLevel);
    const actualRate = Math.min(1, baseRate + successBonus);
    const isSuccess = Math.random() < actualRate;
    const failResultType = getEnhanceFailResult(currentLevel);

    let newLevel = currentLevel;
    let failResultStr: string | undefined;
    if (isSuccess) {
      newLevel = currentLevel + 1;
      eq.enhanceLevel = newLevel;
    } else {
      switch (failResultType) {
        case 'none':
          failResultStr = '无';
          break;
        case 'keep':
          failResultStr = '保留等级';
          break;
        case 'minus2':
          newLevel = Math.max(0, currentLevel - 2);
          eq.enhanceLevel = newLevel;
          failResultStr = '等级-2';
          break;
        case 'minus1':
          newLevel = Math.max(0, currentLevel - 1);
          eq.enhanceLevel = newLevel;
          failResultStr = '等级-1';
          break;
      }
    }
    this.syncEquipmentState(this.equipment, this.equipmentStorage);
    return { success: isSuccess, newLevel, goldCost, failResult: failResultStr };
  }

  syncEnchantItemInventory(items: ItemStack[]): void {
    this.enchantItemInventory = items.slice(0, STORAGE_CAPACITY.enchant);
    if (this.onEnchantItemInventoryChange) this.onEnchantItemInventoryChange(this.enchantItemInventory);
  }

  // 装备附魔：消耗 1 本附魔书，给装备附加或覆盖附魔效果
  enchantEquipment(
    equipmentId: string,
    source: 'equipped' | 'storage',
    itemId: string
  ): { success: boolean; reason?: string; stat?: EnchantStat; percent?: number } | null {
    const list = source === 'equipped' ? this.equipment : this.equipmentStorage;
    const eq = list.find(e => e.id === equipmentId);
    if (!eq) return null;

    const def = getEnchantItemDef(itemId);
    if (!def) return { success: false, reason: '无效的附魔书', stat: undefined, percent: undefined };

    // 检查库存
    const stack = this.enchantItemInventory.find(s => s.itemId === itemId);
    if (!stack || stack.count <= 0) {
      return { success: false, reason: '附魔书不足', stat: def.stat, percent: def.percent };
    }

    // 消耗 1 本附魔书
    this.enchantItemInventory = this.enchantItemInventory
      .map(s => s.itemId === itemId ? { ...s, count: s.count - 1 } : s)
      .filter(s => s.count > 0);
    if (this.onEnchantItemInventoryChange) this.onEnchantItemInventoryChange(this.enchantItemInventory);

    // 应用附魔（覆盖原有附魔）
    eq.enchantment = { stat: def.stat, rarity: def.rarity, percent: def.percent };
    this.syncEquipmentState(this.equipment, this.equipmentStorage);
    return { success: true, stat: def.stat, percent: def.percent };
  }

  // 合成附魔书：消耗 ENCHANT_SYNTH_COST 本相同 ID 的书，获得 1 本高一级品质的书
  synthEnchantItem(
    itemId: string
  ): { success: boolean; reason?: string; newItemId?: string } | null {
    const def = getEnchantItemDef(itemId);
    if (!def) return { success: false, reason: '无效的附魔书' };

    const upgradeId = getUpgradeEnchantId(def.id);
    if (!upgradeId) {
      return { success: false, reason: '已达最高品质，无法合成' };
    }

    // 检查库存
    const stack = this.enchantItemInventory.find(s => s.itemId === itemId);
    if (!stack || stack.count < ENCHANT_SYNTH_COST) {
      return { success: false, reason: `需要 ${ENCHANT_SYNTH_COST} 本相同品质的附魔书` };
    }

    // 消耗 ENCHANT_SYNTH_COST 本
    this.enchantItemInventory = this.enchantItemInventory
      .map(s => s.itemId === itemId ? { ...s, count: s.count - ENCHANT_SYNTH_COST } : s)
      .filter(s => s.count > 0);

    // 增加 1 本升级后的书
    const existing = this.enchantItemInventory.find(s => s.itemId === upgradeId);
    if (existing) {
      this.enchantItemInventory = this.enchantItemInventory
        .map(s => s.itemId === upgradeId ? { ...s, count: s.count + 1 } : s);
    } else {
      this.enchantItemInventory = [...this.enchantItemInventory, { itemId: upgradeId, count: 1 }];
    }

    if (this.onEnchantItemInventoryChange) this.onEnchantItemInventoryChange(this.enchantItemInventory);
    return { success: true, newItemId: upgradeId };
  }

  // 修理所有装备：恢复耐久度到最大值
  repairAllEquipment(): void {
    for (const eq of this.equipment) {
      if (eq.durability !== undefined && eq.maxDurability) {
        eq.durability = eq.maxDurability;
      }
    }
    for (const eq of this.equipmentStorage) {
      if (eq.durability !== undefined && eq.maxDurability) {
        eq.durability = eq.maxDurability;
      }
    }
    if (this.onEquipmentChange) this.onEquipmentChange(this.equipment);
    if (this.onEquipmentStorageChange) this.onEquipmentStorageChange(this.equipmentStorage);
  }

  // 宝石镶嵌：根据已镶嵌数量计算成功率与失败后果
  // 第1颗 100% 成功；第2-7颗 50% 成功，失败不归零；第8-15颗 50% 成功，失败全部碎裂
  socketGem(equipmentId: string, gemId: string, source: 'equipped' | 'storage'): {
    success: boolean;
    reset: boolean;
    reason?: string;
  } | null {
    const list = source === 'equipped' ? this.equipment : this.equipmentStorage;
    const idx = list.findIndex(e => e.id === equipmentId);
    if (idx === -1) return { success: false, reset: false, reason: '装备不存在' };

    const equip = list[idx];
    const currentGems = equip.socketedGems || [];
    if (currentGems.length >= MAX_GEM_SOCKETS) {
      return { success: false, reset: false, reason: '已满 15 颗' };
    }

    // 检查宝石背包是否有此宝石
    const gemStack = this.gemInventory.find(g => g.itemId === gemId);
    if (!gemStack || gemStack.count <= 0) {
      return { success: false, reset: false, reason: '宝石不足' };
    }

    const def = getGemDef(gemId);
    if (!def) return { success: false, reset: false, reason: '宝石定义不存在' };

    // 同类宝石锁定：若已镶嵌宝石，则仅允许同类宝石
    if (currentGems.length > 0 && currentGems[0].type !== def.type) {
      return { success: false, reset: false, reason: '只能镶嵌同类宝石' };
    }

    // 扣除 1 颗宝石（无论成功失败都消耗）
    this.gemInventory = this.gemInventory
      .map(g => g.itemId === gemId ? { ...g, count: g.count - 1 } : g)
      .filter(g => g.count > 0);
    if (this.onGemInventoryChange) this.onGemInventoryChange(this.gemInventory);

    // 计算成功率与失败后果
    const rate = getSocketSuccessRate(currentGems.length);
    const isSuccess = Math.random() < rate;

    if (isSuccess) {
      // 成功：追加到 socketedGems
      const newGem: SocketedGem = {
        gemId: def.id,
        type: def.type,
        rarity: def.rarity,
        value: def.value,
      };
      const updatedEquip: Equipment = {
        ...equip,
        socketedGems: [...currentGems, newGem],
      };
      list[idx] = updatedEquip;
      this.finishSocketUpdate(source);
      return { success: true, reset: false };
    } else {
      // 失败：根据当前数量决定是否归零
      const willReset = isFailResetToZero(currentGems.length);
      const updatedEquip: Equipment = willReset
        ? { ...equip, socketedGems: [] }
        : equip;  // 失败不归零，仅消耗宝石
      list[idx] = updatedEquip;
      this.finishSocketUpdate(source);
      return { success: false, reset: willReset };
    }
  }

  // 镶嵌完成后的统一同步逻辑
  private finishSocketUpdate(source: 'equipped' | 'storage'): void {
    this.calculatePlayerStats();
    if (source === 'equipped') {
      if (this.onEquipmentChange) this.onEquipmentChange(this.equipment);
    } else {
      if (this.onEquipmentStorageChange) this.onEquipmentStorageChange(this.equipmentStorage);
    }
    if (this.onPlayerChange) this.onPlayerChange(this.player);
  }

  spawnSandbags(): void {
    this.destroySandbags();
    const { canvasWidth, canvasHeight, playerStartX } = this.config;
    const baseRange = (canvasWidth - playerStartX) * 0.75;
    const rangeEndX = playerStartX + baseRange;
    const sandbagW = 44;
    const sandbagH = 63;
    const centerY = canvasHeight / 2;
    const offsetX = 70;
    const offsetY = 160;

    const positions = [
      { x: playerStartX + baseRange * (3 / 5) - sandbagW / 2 + offsetX, y: centerY - sandbagH / 2 + offsetY },
      { x: playerStartX + baseRange * (3 / 5) + 40 - sandbagW / 2 + offsetX, y: centerY - sandbagH / 2 - 50 + offsetY },
      { x: playerStartX + baseRange * (3 / 5) + 80 - sandbagW / 2 + offsetX, y: centerY - sandbagH / 2 + 50 + offsetY },
    ];

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const enemy = this.enemyPool.acquire('sandbag', 1);
      enemy.id = getNextId();
      enemy.type = 'normal';
      enemy.name = '沙袋';
      enemy.x = pos.x;
      enemy.y = pos.y;
      enemy.width = sandbagW;
      enemy.height = sandbagH;
      enemy.health = 999999999;
      enemy.maxHealth = 999999999;
      enemy.speed = 0;
      enemy.baseSpeed = 0;
      enemy.damage = 0;
      enemy.exp = 0;
      enemy.dropRate = 0;
      enemy.color = '#8B7355';
      enemy.element = null;
      enemy.isElite = false;
      enemy.isBoss = false;
      enemy.hitFlash = 0;
      enemy.stunTimer = 0;
      enemy.slowTimer = 0;
      enemy.slowAmount = 0;
      enemy.bossPhase = 0;
      enemy.bossSkillCooldown = 0;
      enemy.animFrame = 0;
      enemy.weakPoints = [];
      enemy.debuffs = [];
      (enemy as any).isSandbag = true;
      (enemy as any).sandbagIndex = i;
    }
    this._sortedEnemiesDirty = true;
  }

  destroySandbags(): void {
    const enemies = this.enemyPool.getActive();
    for (const enemy of enemies) {
      if ((enemy as any).isSandbag) {
        this.enemyPool.release(enemy);
      }
    }
    this._sortedEnemiesDirty = true;
  }

  spawnMonsterSandbag(): void {
    const { canvasWidth, canvasHeight, playerStartX } = this.config;
    const baseRange = (canvasWidth - playerStartX) * 0.75;
    const sandbagW = 44;
    const sandbagH = 63;
    const centerY = canvasHeight / 2;
    const offsetX = 70;
    const offsetY = 160;

    const enemy = this.enemyPool.acquire('monster_sandbag', 1);
    enemy.x = playerStartX + baseRange * (3 / 5) - sandbagW / 2 + offsetX;
    enemy.y = centerY - sandbagH / 2 + offsetY;
    (enemy as any).sandbagIndex = 0;
    // 设置BOSS状态用于显示血条
    this.gameState.bossActive = true;
    this.gameState.bossHealth = enemy.health;
    this.gameState.bossMaxHealth = enemy.maxHealth;
    this.gameState.bossName = enemy.name;
    if (this.onBossSpawn) {
      this.onBossSpawn(enemy.name, enemy.health, enemy.maxHealth);
    }
    this._sortedEnemiesDirty = true;
  }

  destroyMonsterSandbags(): void {
    const enemies = this.enemyPool.getActive();
    let hadMonsterSandbag = false;
    for (const enemy of enemies) {
      if ((enemy as any).isMonsterSandbag) {
        this.enemyPool.release(enemy);
        hadMonsterSandbag = true;
      }
    }
    if (hadMonsterSandbag) {
      this.gameState.bossActive = false;
      this.gameState.bossHealth = 0;
      this.gameState.bossMaxHealth = 0;
    }
    this._sortedEnemiesDirty = true;
  }

  resetSkillCooldowns(): void {
    for (const skill of this.skills) {
      skill.currentCooldown = 0;
    }
    this.grenadeCooldown = 0;
    this.cloneGrenadeCooldowns = this.cloneGrenadeCooldowns.map(() => 0);
    this.droneShootCooldown = 0;
    this.cloneShootTimers = this.cloneShootTimers.map(() => 0);
    if (this.onSkillsChange) this.onSkillsChange([...this.skills]);
  }

  private learnSkillsByFilter(filter: (id: string) => boolean): void {
    const backupSkillPoints = this.player.skillPoints;
    this.player.skillPoints = 99999;
    let changed = true;
    let safetyCounter = 0;
    while (changed && safetyCounter < 200) {
      changed = false;
      safetyCounter++;
      for (const s of this.skills) {
        if (!filter(s.id)) continue;
        if (s.level < s.maxLevel) {
          if (this.player.skillPoints >= s.cost &&
              this.player.level >= s.requiredLevel &&
              (!s.requiredSkills || s.requiredSkills.every(reqId => {
                const req = this.skills.find(sk => sk.id === reqId);
                return req && req.level > 0;
              }))) {
            this.player.skillPoints -= s.cost;
            s.level++;
            changed = true;
          }
        }
      }
    }
    this.player.skillPoints = backupSkillPoints;
    this.skillsDirty = true;
    this.calculatePlayerStats();
    if (this.onSkillsChange) this.onSkillsChange([...this.skills]);
  }

  learnAllSkills(): void {
    const backupSkillPoints = this.player.skillPoints;
    this.player.skillPoints = 99999;
    let changed = true;
    let safetyCounter = 0;
    while (changed && safetyCounter < 200) {
      changed = false;
      safetyCounter++;
      for (const s of this.skills) {
        if (s.level < s.maxLevel) {
          if (this.player.skillPoints >= s.cost &&
              this.player.level >= s.requiredLevel &&
              (!s.requiredSkills || s.requiredSkills.every(reqId => {
                const req = this.skills.find(sk => sk.id === reqId);
                return req && req.level > 0;
              }))) {
            this.player.skillPoints -= s.cost;
            s.level++;
            changed = true;
          }
        }
      }
    }
    this.player.skillPoints = backupSkillPoints;
    this.skillsDirty = true;
    this.calculatePlayerStats();
    if (this.onSkillsChange) this.onSkillsChange([...this.skills]);
  }

  learnAllFxSkills(): void {
    this.learnSkillsByFilter(id => id.startsWith('fx_'));
  }

  learnAllStatSkills(): void {
    this.learnSkillsByFilter(id =>
      id.startsWith('atk_') || id.startsWith('spd_') || id.startsWith('rng_') ||
      id.startsWith('crit_') || id.startsWith('cdmg_') || id.startsWith('hp_') ||
      id.startsWith('def_') || id.startsWith('regen_') ||
      id.startsWith('gold_') || id.startsWith('exp_') || id.startsWith('drop_') ||
      id.startsWith('burn_') || id.startsWith('poison_') || id.startsWith('freeze_') ||
      id.startsWith('lightning_') || id.startsWith('lifesteal_') || id.startsWith('piercing_')
    );
  }

  learnAllCloneSkills(): void {
    this.learnSkillsByFilter(id => id.startsWith('clone_'));
  }

  // ==================== 7日签到系统 ====================

  // 获取当前周的key（格式：年-周数）
  private getWeekKey(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-${weekNum}`;
  }

  // 获取今天是本周第几天（0=周一，6=周日）
  private getTodayDayIndex(): number {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // 转为周一=0，周日=6
  }

  // 检查并重置过期的签到数据
  private refreshCheckInWeek(): void {
    const currentWeek = this.getWeekKey();
    if (this.checkInWeekKey !== currentWeek) {
      this.checkInWeekKey = currentWeek;
      this.checkInDays = [];
    }
  }

  // 执行签到
  checkIn(): { success: boolean; day: number; rewards: { itemId: string; count: number; gold: number } } {
    this.refreshCheckInWeek();
    const today = this.getTodayDayIndex();
    if (this.checkInDays.includes(today)) {
      return { success: false, day: today, rewards: { itemId: '', count: 0, gold: 0 } };
    }
    this.checkInDays.push(today);
    const rewards = this.getCheckInRewards(today);
    // 发放奖励
    if (rewards.itemId) {
      for (let i = 0; i < rewards.count; i++) {
        this.addToInventory(rewards.itemId);
      }
    }
    if (rewards.gold > 0) {
      this.addGold(rewards.gold);
    }
    this.saveGame();
    return { success: true, day: today, rewards };
  }

  // 获取签到状态
  getCheckInStatus(): { days: number[]; todayChecked: boolean; weekKey: string } {
    this.refreshCheckInWeek();
    const today = this.getTodayDayIndex();
    return {
      days: [...this.checkInDays],
      todayChecked: this.checkInDays.includes(today),
      weekKey: this.checkInWeekKey,
    };
  }

  // 每日签到奖励配置
  private getCheckInRewards(day: number): { itemId: string; count: number; gold: number } {
    const rewardTable = [
      { itemId: 'health_potion', count: 5, gold: 200 },       // 第1天
      { itemId: 'attack_boost', count: 3, gold: 300 },        // 第2天
      { itemId: 'speed_boost', count: 3, gold: 300 },         // 第3天
      { itemId: 'bomb', count: 3, gold: 500 },                // 第4天
      { itemId: 'health_potion_advanced', count: 5, gold: 500 }, // 第5天
      { itemId: 'freeze_bomb', count: 2, gold: 800 },         // 第6天
      { itemId: 'health_potion_legendary', count: 3, gold: 1500 }, // 第7天（大奖）
    ];
    return rewardTable[day] || rewardTable[0];
  }

  // ==================== 在线奖励系统 ====================

  // 每秒更新在线时间（由独立 setInterval 调用，主界面也计时）
  private updateOnlineTime(dt: number): void {
    if (this.onlineRewardClaimed >= 4) return;

    this.onlineTimer += dt;
    if (this.onlineTimer >= 60000) { // 每60秒
      this.onlineTimer -= 60000;
      this.onlineMinutes++;
      // 每30分钟可领取一次
      if (this.onlineMinutes >= (this.onlineRewardClaimed + 1) * 30) {
        // 标记可领取（UI轮询获取状态）
      }
    }
  }

  // 领取在线奖励
  claimOnlineReward(): { success: boolean; tier: number; rewards: { itemId: string; count: number; gold: number } } {
    const nextTier = this.onlineRewardClaimed + 1;
    if (nextTier > 4) {
      return { success: false, tier: 0, rewards: { itemId: '', count: 0, gold: 0 } };
    }
    const requiredMinutes = nextTier * 30;
    if (this.onlineMinutes < requiredMinutes) {
      return { success: false, tier: 0, rewards: { itemId: '', count: 0, gold: 0 } };
    }
    this.onlineRewardClaimed = nextTier;
    const rewards = this.getOnlineReward(nextTier);
    if (rewards.itemId) {
      for (let i = 0; i < rewards.count; i++) {
        this.addToInventory(rewards.itemId);
      }
    }
    if (rewards.gold > 0) {
      this.addGold(rewards.gold);
    }
    this.saveGame();
    return { success: true, tier: nextTier, rewards };
  }

  // 获取在线奖励状态
  getOnlineRewardStatus(): { minutes: number; seconds: number; claimed: number; canClaim: boolean; nextClaimMinutes: number } {
    const nextTier = this.onlineRewardClaimed + 1;
    const nextClaimMinutes = nextTier <= 4 ? nextTier * 30 : 0;
    const canClaim = nextTier <= 4 && this.onlineMinutes >= nextClaimMinutes;
    return {
      minutes: this.onlineMinutes,
      seconds: Math.floor(this.onlineTimer / 1000),
      claimed: this.onlineRewardClaimed,
      canClaim,
      nextClaimMinutes,
    };
  }

  // 在线奖励配置
  private getOnlineReward(tier: number): { itemId: string; count: number; gold: number } {
    const rewardTable = [
      { itemId: 'health_potion', count: 5, gold: 300 },         // 第1次（30分钟）
      { itemId: 'attack_boost', count: 3, gold: 500 },          // 第2次（60分钟）
      { itemId: 'bomb', count: 3, gold: 800 },                  // 第3次（90分钟）
      { itemId: 'health_potion_fine', count: 5, gold: 1500 },   // 第4次（120分钟）
    ];
    return rewardTable[tier - 1] || rewardTable[0];
  }

  // ==================== 抽奖机系统 ====================
  // 每日发放 10 个【抽奖机硬币】，未用完的硬币次日不累积（每日重置为 10）
  // 抽奖一次消耗 1 个硬币，转动水果机格子，命中格子奖励 + 特殊组合奖励

  // 获取今日日期 key（YYYY-MM-DD）
  private getTodayDateKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ===== 抽奖机（跑马灯水果机）静态配置 =====
  // 24 格围成 7×7 方框跑马灯（中间 5×5 为显示区），从左上第 1 格顺时针排列
  // 大小规则：大水果 ×2 押注倍率计入，小水果 ×1（这里 odds 直接是单倍押注的赔付倍率）
  // weight：命中概率权重（赔率越高权重越低；Lucky 极低）
  // category：水果种类 id（押注按种类，停在任意同种类格子都算中奖）
  static readonly LOTTERY_ITEMS: { id: number; key: string; name: string; icon: string; odds: number; color: string; weight: number; size: 'big' | 'small' | 'special'; category: string }[] = [
    { id: 0,  key: 'big_orange',    name: '大橘子', icon: '🍊', odds: 10, color: '#FF8C42', weight: 10, size: 'big', category: 'orange' },
    { id: 1,  key: 'big_bell',      name: '大铃铛', icon: '🔔', odds: 10, color: '#FFD700', weight: 10, size: 'big', category: 'bell' },
    { id: 2,  key: 'small_bar',     name: '小BAR',  icon: 'BAR', odds: 50, color: '#00F5D4', weight: 3, size: 'small', category: 'bar' },
    { id: 3,  key: 'big_bar',       name: '大BAR',  icon: 'BAR', odds: 100, color: '#FF1493', weight: 1, size: 'big', category: 'bar' },
    { id: 4,  key: 'small_bar_2',   name: '小BAR',  icon: 'BAR', odds: 50, color: '#00F5D4', weight: 3, size: 'small', category: 'bar' },
    { id: 5,  key: 'big_apple',     name: '大苹果', icon: '🍎', odds: 5,  color: '#FF4757', weight: 18, size: 'big', category: 'apple' },
    { id: 6,  key: 'big_mango',     name: '大芒果', icon: '🥭', odds: 10, color: '#FFD93D', weight: 10, size: 'big', category: 'mango' },
    { id: 7,  key: 'big_watermelon',name: '大西瓜', icon: '🍉', odds: 20, color: '#2ECC71', weight: 7, size: 'big', category: 'watermelon' },
    { id: 8,  key: 'small_watermelon', name: '小西瓜', icon: '🍉', odds: 3, color: '#7BE495', weight: 22, size: 'small', category: 'watermelon' },
    { id: 9,  key: 'lucky_1',       name: 'Lucky',  icon: '🍀', odds: 0,  color: '#FF69B4', weight: 2, size: 'special', category: 'lucky' },
    { id: 10, key: 'big_apple_2',   name: '大苹果', icon: '🍎', odds: 5,  color: '#FF4757', weight: 18, size: 'big', category: 'apple' },
    { id: 11, key: 'small_orange',  name: '小橘子', icon: '🍊', odds: 3,  color: '#FFB07A', weight: 22, size: 'small', category: 'orange' },
    { id: 12, key: 'big_orange_2',  name: '大橘子', icon: '🍊', odds: 10, color: '#FF8C42', weight: 10, size: 'big', category: 'orange' },
    { id: 13, key: 'big_bell_2',    name: '大铃铛', icon: '🔔', odds: 20, color: '#FFD700', weight: 7, size: 'big', category: 'bell' },
    { id: 14, key: 'small_seven',   name: '小77',   icon: '7️⃣', odds: 3, color: '#FF80B0', weight: 22, size: 'small', category: 'seven' },
    { id: 15, key: 'big_seven',     name: '大77',   icon: '7️⃣', odds: 20, color: '#FF1493', weight: 7, size: 'big', category: 'seven' },
    { id: 16, key: 'big_apple_3',   name: '大苹果', icon: '🍎', odds: 5,  color: '#FF4757', weight: 18, size: 'big', category: 'apple' },
    { id: 17, key: 'small_mango',   name: '小芒果', icon: '🥭', odds: 3,  color: '#FFE066', weight: 22, size: 'small', category: 'mango' },
    { id: 18, key: 'big_mango_2',   name: '大芒果', icon: '🥭', odds: 10, color: '#FFD93D', weight: 10, size: 'big', category: 'mango' },
    { id: 19, key: 'big_star',      name: '大双星', icon: '✨', odds: 20, color: '#9B59B6', weight: 7, size: 'big', category: 'star' },
    { id: 20, key: 'small_star',    name: '小双星', icon: '✨', odds: 3,  color: '#C39BD3', weight: 22, size: 'small', category: 'star' },
    { id: 21, key: 'lucky_2',       name: 'Lucky',  icon: '🍀', odds: 0,  color: '#FF69B4', weight: 2, size: 'special', category: 'lucky' },
    { id: 22, key: 'big_apple_4',   name: '大苹果', icon: '🍎', odds: 5,  color: '#FF4757', weight: 18, size: 'big', category: 'apple' },
    { id: 23, key: 'small_bell',    name: '小铃铛', icon: '🔔', odds: 3,  color: '#FFE680', weight: 22, size: 'small', category: 'bell' },
  ];
  // 押注种类（水果种类）—— 玩家按种类押注，停在任意同种类格子都算中奖
  static readonly LOTTERY_CATEGORIES: { id: string; name: string; icon: string; color: string }[] = [
    { id: 'apple',      name: '苹果', icon: '🍎', color: '#FF4757' },
    { id: 'orange',     name: '橘子', icon: '🍊', color: '#FF8C42' },
    { id: 'mango',      name: '芒果', icon: '🥭', color: '#FFD93D' },
    { id: 'bell',       name: '铃铛', icon: '🔔', color: '#FFD700' },
    { id: 'watermelon', name: '西瓜', icon: '🍉', color: '#2ECC71' },
    { id: 'star',       name: '双星', icon: '✨', color: '#9B59B6' },
    { id: 'seven',      name: '77',   icon: '7️⃣', color: '#FF1493' },
    { id: 'bar',        name: 'BAR',  icon: 'BAR', color: '#00F5D4' },
  ];
  // 押注上限
  static readonly LOTTERY_BET_LIMIT = 999;
  // 历史记录长度（用于特殊奖励判定）
  static readonly LOTTERY_HISTORY_LEN = 3;
  // 跑马灯格子总数
  static readonly LOTTERY_CELL_COUNT = 24;
  // 每种水果对应的道具奖励
  static readonly LOTTERY_FRUIT_REWARDS: Record<string, { itemId: string; itemName: string; icon: string }> = {
    apple:      { itemId: 'health_potion',  itemName: '普通血瓶',  icon: '❤️' },
    orange:     { itemId: 'attack_boost',   itemName: '力量药水',  icon: '💪' },
    mango:      { itemId: 'speed_boost',    itemName: '敏捷药水',  icon: '👟' },
    bell:       { itemId: 'bomb',           itemName: '手榴弹',    icon: '💣' },
    watermelon: { itemId: 'poison_bomb',    itemName: '毒雾弹',    icon: '☠️' },
    star:       { itemId: 'stun_bomb',      itemName: '眩晕弹',    icon: '💫' },
    seven:      { itemId: 'freeze_bomb',    itemName: '冰冻弹',    icon: '❄️' },
    bar:        { itemId: 'fire_bomb',      itemName: '燃烧弹',    icon: '🔥' },
  };

  // ===== 抽奖罐（DNF 土罐玩法）静态奖励池 =====
  // 开启时按权重随机一件奖励，UI 端用此数组做图案滚动
  static readonly LOTTERY_POT_REWARDS: {
    type: 'gold' | 'exp' | 'item';
    icon: string;
    name: string;
    color: string;
    weight: number;
    minGold?: number;
    maxGold?: number;
    expValue?: number;
    itemId?: string;
    itemCount?: number;
  }[] = [
    { type: 'gold', icon: '💰', name: '金币', color: '#FFE600', weight: 28, minGold: 500, maxGold: 2000 },
    { type: 'gold', icon: '💰', name: '金币', color: '#FFE600', weight: 12, minGold: 2000, maxGold: 5000 },
    { type: 'exp', icon: '📖', name: '小型经验书', color: '#90EE90', weight: 15, expValue: 200 },
    { type: 'exp', icon: '📕', name: '中型经验书', color: '#5BA3E0', weight: 8, expValue: 1000 },
    { type: 'exp', icon: '📘', name: '大型经验书', color: '#B026FF', weight: 3, expValue: 5000 },
    { type: 'item', icon: '🧪', name: '生命药水', color: '#FF6B9D', weight: 12, itemId: 'health_potion', itemCount: 3 },
    { type: 'item', icon: '⚔️', name: '攻击药剂', color: '#FFD60A', weight: 8, itemId: 'attack_boost', itemCount: 2 },
    { type: 'item', icon: '💨', name: '速度药剂', color: '#00F5D4', weight: 6, itemId: 'speed_boost', itemCount: 2 },
    { type: 'item', icon: '💣', name: '炸弹', color: '#FF2D55', weight: 4, itemId: 'bomb', itemCount: 2 },
    { type: 'item', icon: '📜', name: '强化卷轴+1', color: '#FF8C00', weight: 2, itemId: 'enhance_scroll_plus1', itemCount: 3 },
    { type: 'item', icon: '💠', name: '攻击宝石(进阶)', color: '#00FF9D', weight: 1, itemId: 'gem_attack_advanced', itemCount: 2 },
    { type: 'item', icon: '💎', name: '生命宝石(进阶)', color: '#4FACFE', weight: 1, itemId: 'gem_health_advanced', itemCount: 2 },
  ];

  // 每日重置硬币 + 连续登录判定
  private refreshLotteryDaily(): void {
    const today = this.getTodayDateKey();
    if (this.lotteryCoinsDate !== today) {
      // 连续登录判定
      if (this.lotteryLastLoginDate) {
        const last = new Date(this.lotteryLastLoginDate);
        const diffDays = Math.round((new Date(today).getTime() - last.getTime()) / 86400000);
        if (diffDays === 1) {
          this.lotteryConsecutiveLogin = Math.min(this.lotteryConsecutiveLogin + 1, 30);
        } else if (diffDays > 1) {
          this.lotteryConsecutiveLogin = 1;
        }
      } else {
        this.lotteryConsecutiveLogin = 1;
      }
      this.lotteryLastLoginDate = today;
      // 每日发放 10 硬币 + 连续登录额外硬币（每连续3天+1，上限+5）
      const bonus = Math.min(Math.floor(this.lotteryConsecutiveLogin / 3), 5);
      this.lotteryCoins = 10 + bonus;
      this.lotteryCoinsDate = today;
      // 连续登录7天额外发金币
      if (this.lotteryConsecutiveLogin > 0 && this.lotteryConsecutiveLogin % 7 === 0) {
        this.addGold(500);
      }
      this.saveGame();
    }
  }

  // 获取抽奖机完整状态
  getLotteryStatus(): {
    coins: number;
    bets: Record<string, number>;
    freeSpins: number;
    consecutiveLogin: number;
    tournamentBest: number;
    history: number[];
  } {
    this.refreshLotteryDaily();
    return {
      coins: this.lotteryCoins,
      bets: { ...this.lotteryBets },
      freeSpins: this.lotteryFreeSpins,
      consecutiveLogin: this.lotteryConsecutiveLogin,
      tournamentBest: this.lotteryTournamentBest,
      history: [...this.lotteryHistory],
    };
  }

  // 设置押注（按水果种类；左键 +1 / 右键 -1，由 delta 控制；直接消耗硬币）
  setLotteryBet(categoryId: string, delta: number): { success: boolean; bets: Record<string, number>; coins: number; msg?: string } {
    const valid = GameEngine.LOTTERY_CATEGORIES.some(c => c.id === categoryId);
    if (!valid) {
      return { success: false, bets: { ...this.lotteryBets }, coins: this.lotteryCoins, msg: '种类无效' };
    }
    const current = this.lotteryBets[categoryId] || 0;
    const next = current + delta;
    if (next < 0) {
      return { success: false, bets: { ...this.lotteryBets }, coins: this.lotteryCoins, msg: '押注不能为负' };
    }
    if (next > GameEngine.LOTTERY_BET_LIMIT) {
      return { success: false, bets: { ...this.lotteryBets }, coins: this.lotteryCoins, msg: `押注上限 ${GameEngine.LOTTERY_BET_LIMIT}` };
    }
    // 增加押注需检查硬币
    if (delta > 0) {
      if (this.lotteryCoins < delta) {
        return { success: false, bets: { ...this.lotteryBets }, coins: this.lotteryCoins, msg: '硬币不足' };
      }
      this.lotteryCoins -= delta;
      this.lotteryBets[categoryId] = next;
    } else if (delta < 0) {
      // 减少押注，退还硬币
      this.lotteryCoins += -delta;
      this.lotteryBets[categoryId] = next;
      if (next === 0) delete this.lotteryBets[categoryId];
    }
    this.saveGame();
    return { success: true, bets: { ...this.lotteryBets }, coins: this.lotteryCoins };
  }

  // 清空押注（退还所有硬币）
  clearLotteryBets(): { coins: number } {
    let total = 0;
    Object.values(this.lotteryBets).forEach(b => total += b);
    this.lotteryCoins += total;
    this.lotteryBets = {};
    this.saveGame();
    return { coins: this.lotteryCoins };
  }

  // 增加水果机硬币（调试用）
  addLotteryCoins(amount: number): void {
    this.lotteryCoins += amount;
    this.saveGame();
  }

  // 跑马灯随机停下位置（按 weight 权重 + Lucky 保底累积机制）
  private rollLotteryCell(): number {
    const items = GameEngine.LOTTERY_ITEMS;
    const missCount = this.lotteryLuckyMissCounter;
    // 第 10 次未命中（missCount=9）：100% 必中 Lucky
    if (missCount >= 9) {
      const luckyCells = items.filter(it => it.size === 'special').map(it => it.id);
      return luckyCells[Math.floor(Math.random() * luckyCells.length)];
    }
    // 累积保底概率 = (missCount + 1) × 3%
    //   第 1 次(missCount=0) → 3%
    //   第 9 次(missCount=8) → 27%
    const luckyProb = (missCount + 1) * 0.03;
    if (Math.random() < luckyProb) {
      const luckyCells = items.filter(it => it.size === 'special').map(it => it.id);
      return luckyCells[Math.floor(Math.random() * luckyCells.length)];
    }
    // 基础权重随机
    const totalWeight = items.reduce((s, it) => s + it.weight, 0);
    let r = Math.random() * totalWeight;
    for (const it of items) {
      r -= it.weight;
      if (r <= 0) return it.id;
    }
    return 0;
  }

  // 获取所有"大水果"格子 id（用于 Lucky 子玩法）
  private getBigFruitCells(): number[] {
    return GameEngine.LOTTERY_ITEMS.filter(it => it.size === 'big').map(it => it.id);
  }
  // 获取指定 category 的所有格子 id
  private getCellsByCategory(category: string): number[] {
    return GameEngine.LOTTERY_ITEMS.filter(it => it.category === category).map(it => it.id);
  }
  // 按格子 id 计算中奖：用该格子对应 category 的押注 × 该格赔率
  private winForCells(cells: number[]): number {
    let total = 0;
    for (const c of cells) {
      const it = GameEngine.LOTTERY_ITEMS[c];
      const bet = this.lotteryBets[it.category] || 0;
      total += bet * it.odds;
    }
    return total;
  }
  // 收集中奖格子对应的道具奖励（按 category 分组）
  private collectItemRewards(cells: number[]): { itemId: string; itemName: string; icon: string; count: number; category: string }[] {
    const rewards: Record<string, { itemId: string; itemName: string; icon: string; count: number; category: string }> = {};
    for (const c of cells) {
      const it = GameEngine.LOTTERY_ITEMS[c];
      const bet = this.lotteryBets[it.category] || 0;
      if (bet <= 0) continue;
      const count = bet * it.odds;
      if (count <= 0) continue;
      const reward = GameEngine.LOTTERY_FRUIT_REWARDS[it.category];
      if (!reward) continue;
      if (!rewards[it.category]) {
        rewards[it.category] = { ...reward, count: 0, category: it.category };
      }
      rewards[it.category].count += count;
    }
    return Object.values(rewards);
  }

  // 执行一次跑马灯旋转
  spinLottery(): {
    success: boolean;
    stopCell: number;              // 跑马灯最终停下的格子（0-23）
    winningCells: number[];        // 所有中奖格子（普通单格 / Lucky 多格 / 大满贯全格）
    winningCategory: string | null;// 中奖水果种类（普通格 / Lucky 随机大水果）
    betOnStop: number;             // 玩家在停格对应种类的押注
    win: number;                   // 本次中奖道具总数（押注×赔率）
    rewardItems: { itemId: string; itemName: string; icon: string; count: number; category: string }[];
    special?: string;
    specialLabel?: string;
    luckyKind?: string;            // Lucky 子类型：random_big_fruit / all_big_apple / three_fruits_a / three_fruits_b / train / jackpot
    freeSpin?: boolean;            // 触发送灯免费旋转
    jackpot?: boolean;             // 触发爆机/大满贯
    luckyTrainStart?: number;       // Lucky 开火车：火车起点（Lucky 格子 id）
    luckyTrainStop?: number;        // Lucky 开火车：火车终点（实际中奖格子 id）
    trainLength?: number;           // Lucky 开火车：火车长度（连续高亮的格子数 = 火车走的步数 + 1）
    msg?: string;
  } {
    this.refreshLotteryDaily();
    const totalBet = Object.values(this.lotteryBets).reduce((s, b) => s + b, 0);

    // 免费旋转优先消耗
    const isFreeSpin = this.lotteryFreeSpins > 0;
    if (!isFreeSpin) {
      if (totalBet <= 0) {
        return { success: false, stopCell: 0, winningCells: [], winningCategory: null, betOnStop: 0, win: 0, rewardItems: [], msg: '请先押注' };
      }
      // 每次旋转扣除当前押注（保留投注不清空，玩家可连续使用上局投注）
      if (this.lotteryCoins < totalBet) {
        return { success: false, stopCell: 0, winningCells: [], winningCategory: null, betOnStop: 0, win: 0, rewardItems: [], msg: '硬币不足' };
      }
      this.lotteryCoins -= totalBet;
    } else {
      this.lotteryFreeSpins--;
    }

    // 跑马灯停下位置（按权重随机 + Lucky 保底累积）
    const stopCell = this.rollLotteryCell();
    const item = GameEngine.LOTTERY_ITEMS[stopCell];
    const isLucky = item.size === 'special' && (item.key === 'lucky_1' || item.key === 'lucky_2');
    // 更新 Lucky 保底累积：命中则重置，未命中则 +1
    if (isLucky) {
      this.lotteryLuckyMissCounter = 0;
    } else {
      this.lotteryLuckyMissCounter = Math.min(this.lotteryLuckyMissCounter + 1, 9);
    }
    let winningCells: number[] = [stopCell];
    let winningCategory: string | null = item.category;
    let win = 0;
    let special: string | undefined;
    let specialLabel: string | undefined;
    let luckyKind: string | undefined;
    let freeSpinBonus = false;
    let jackpot = false;
    let luckyTrainStart: number | undefined;
    let luckyTrainStop: number | undefined;
    let trainLength: number | undefined;

    // ===== Lucky 格子触发特殊玩法 =====
    if (item.size === 'special' && (item.key === 'lucky_1' || item.key === 'lucky_2')) {
      winningCategory = null; // Lucky 触发后中奖种类视子玩法而定
      // Lucky 子玩法按权重随机
      const luckyRoll = Math.random();
      if (luckyRoll < 0.45) {
        // 45%：随机打中某个大水果
        const bigs = this.getBigFruitCells();
        const luckyCell = bigs[Math.floor(Math.random() * bigs.length)];
        winningCells = [luckyCell];
        const luckyItem = GameEngine.LOTTERY_ITEMS[luckyCell];
        winningCategory = luckyItem.category;
        win += this.winForCells([luckyCell]);
        luckyKind = 'random_big_fruit';
        special = 'lucky';
        specialLabel = `Lucky·${luckyItem.name}`;
      } else if (luckyRoll < 0.60) {
        // 15%：打中所有大苹果
        const appleCells = this.getCellsByCategory('apple').filter(c => GameEngine.LOTTERY_ITEMS[c].size === 'big');
        winningCells = appleCells;
        win += this.winForCells(appleCells);
        luckyKind = 'all_big_apple';
        special = 'lucky';
        specialLabel = 'Lucky·大苹果雨';
      } else if (luckyRoll < 0.72) {
        // 12%：打中橘子/芒果/铃铛 3 种大水果
        const groupA: number[] = [];
        for (const cat of ['orange', 'mango', 'bell']) {
          groupA.push(...this.getCellsByCategory(cat).filter(c => GameEngine.LOTTERY_ITEMS[c].size === 'big'));
        }
        winningCells = groupA;
        win += this.winForCells(groupA);
        luckyKind = 'three_fruits_a';
        special = 'lucky';
        specialLabel = 'Lucky·橘芒铃';
      } else if (luckyRoll < 0.84) {
        // 12%：打中西瓜/双星/77 3 种大水果
        const groupB: number[] = [];
        for (const cat of ['watermelon', 'star', 'seven']) {
          groupB.push(...this.getCellsByCategory(cat).filter(c => GameEngine.LOTTERY_ITEMS[c].size === 'big'));
        }
        winningCells = groupB;
        win += this.winForCells(groupB);
        luckyKind = 'three_fruits_b';
        special = 'lucky';
        specialLabel = 'Lucky·瓜星柒';
      } else if (luckyRoll < 0.96) {
        // 12%：开火车 —— 从 Lucky 格子开始顺时针，火车停在随机格子，该格为中奖格
        const trainStart = stopCell; // Lucky 格子 id
        const trainSteps = 20 + Math.floor(Math.random() * 40); // 20..59 步（移动距离，保证3-6秒动画）
        const trainStopCell = (trainStart + trainSteps) % GameEngine.LOTTERY_CELL_COUNT;
        const trainItem = GameEngine.LOTTERY_ITEMS[trainStopCell];
        winningCells = [trainStopCell];
        winningCategory = trainItem.category;
        win = this.winForCells([trainStopCell]);
        luckyKind = 'train';
        special = 'train';
        specialLabel = `开火车·${trainItem.name}`;
        luckyTrainStart = trainStart;
        luckyTrainStop = trainStopCell;
        trainLength = 3 + Math.floor(Math.random() * 5); // 车厢长度 3..7 节
      } else {
        // 4%：大满贯 —— 全部 24 格全中（按押注×赔率累加）
        winningCells = GameEngine.LOTTERY_ITEMS.map(it => it.id);
        win += this.winForCells(winningCells);
        luckyKind = 'jackpot';
        special = 'jackpot';
        specialLabel = '大满贯';
        jackpot = true;
      }
    } else {
      // ===== 普通格子：按停格对应种类的押注 × 该格赔率结算 =====
      win = this.winForCells([stopCell]);
    }

    // 更新历史
    const newHistory = [...this.lotteryHistory, stopCell].slice(-GameEngine.LOTTERY_HISTORY_LEN);
    this.lotteryHistory = newHistory;

    // 单次停在 BAR → 送灯（小BAR/大BAR都送）
    if (item.category === 'bar') {
      if (!special) {
        special = 'send_light';
        specialLabel = '送灯';
        freeSpinBonus = true;
        this.lotteryFreeSpins += 1;
      }
    }

    const betOnStopRet = (winningCategory ? (this.lotteryBets[winningCategory] || 0) : 0);

    // 收集道具奖励并发放到背包
    const rewardItems = this.collectItemRewards(winningCells);
    for (const r of rewardItems) {
      for (let i = 0; i < r.count; i++) {
        this.addToInventory(r.itemId);
      }
    }
    if (this.onInventoryChange) this.onInventoryChange(this.inventory);

    this.saveGame();
    return {
      success: true,
      stopCell,
      winningCells,
      winningCategory,
      betOnStop: betOnStopRet,
      win,
      rewardItems,
      special,
      specialLabel,
      luckyKind,
      freeSpin: freeSpinBonus,
      jackpot,
      luckyTrainStart,
      luckyTrainStop,
      trainLength,
    };
  }

  levelUpTo100(): void {
    this.levelUpBy(100);
  }

  levelUpBy(amount: number): void {
    const target = Math.min(this.player.level + amount, 300);
    while (this.player.level < target) {
      this.player.level++;
      this.player.expToNextLevel = this.calculateExpToNextLevel(this.player.level);
    }
    this.player.exp = 0;
    this.calculatePlayerStats();
  }

  addSkillPoints(amount: number): void {
    this.player.skillPoints += amount;
  }

  getDebugConfig() {
    return {
      baseStats: { ...this.debugConfig.baseStats },
      powerWeights: { ...this.debugConfig.powerWeights },
      enemyPowerWeights: { ...this.debugConfig.enemyPowerWeights },
    };
  }

  saveGame(): void {
    const saveData = {
      player: {
        level: this.player.level,
        exp: this.player.exp,
        expToNextLevel: this.player.expToNextLevel,
        gold: this.player.gold,
        score: this.player.score,
        skillPoints: this.player.skillPoints,
        health: this.player.health,
        maxHealth: this.player.maxHealth,
        attack: this.player.attack,
        attackSpeed: this.player.attackSpeed,
        range: this.player.range,
      },
      gameState: {
        currentWave: this.gameState.currentWave,
      },
      equipment: this.equipment,
      equipmentStorage: this.equipmentStorage,
      inventory: this.inventory,
      gemInventory: this.gemInventory,
      skills: this.skills.map(s => ({ id: s.id, level: s.level })),
      talents: this.talents,
      highestWave: this.highestWave,
      codexEntries: this.codexEntries,
      achievements: this.achievements,
      mails: this.mails,
      savedAt: Date.now(),
      // 7日签到数据
      checkInDays: this.checkInDays,
      checkInWeekKey: this.checkInWeekKey,
      // 在线奖励数据
      onlineMinutes: this.onlineMinutes,
      onlineRewardClaimed: this.onlineRewardClaimed,
      // 抽奖机（跑马灯水果机）数据
      lotteryCoins: this.lotteryCoins,
      lotteryCoinsDate: this.lotteryCoinsDate,
      lotteryBets: this.lotteryBets,
      lotteryConsecutiveLogin: this.lotteryConsecutiveLogin,
      lotteryLastLoginDate: this.lotteryLastLoginDate,
      lotteryTournamentBest: this.lotteryTournamentBest,
      lotteryLastWin: this.lotteryLastWin,
      lotteryHistory: this.lotteryHistory,
      lotteryFreeSpins: this.lotteryFreeSpins,
      lotteryLuckyMissCounter: this.lotteryLuckyMissCounter,
    };
    try {
      localStorage.setItem('shotsGameSave', JSON.stringify(saveData));
    } catch (e) {
      console.warn('Failed to save game:', e);
    }
  }

  loadGame(): boolean {
    try {
      const saveStr = localStorage.getItem('shotsGameSave');
      if (!saveStr) return false;
      const saveData = JSON.parse(saveStr);
      
      if (saveData.player) {
        this.player.level = saveData.player.level || 1;
        this.player.exp = saveData.player.exp || 0;
        this.player.expToNextLevel = saveData.player.expToNextLevel || this.calculateExpToNextLevel(this.player.level);
        this.player.gold = saveData.player.gold || 0;
        this.player.score = saveData.player.score || 0;
        this.player.skillPoints = saveData.player.skillPoints || 0;
        this.player.health = saveData.player.health || this.player.maxHealth;
      }
      
      if (saveData.gameState) {
        this.gameState.currentWave = Math.max(1, saveData.gameState.currentWave || 1);
      }
      
      if (saveData.equipment) {
        this.equipment = saveData.equipment;
      }
      if (saveData.equipmentStorage) {
        // 容量校验：旧存档可能超容（曾用 200 上限），超限部分溢入待发邮件
        const arr = saveData.equipmentStorage;
        if (arr.length > STORAGE_CAPACITY.equipment) {
          this.equipmentStorage = arr.slice(0, STORAGE_CAPACITY.equipment);
          if (!this.pendingMailDrops.equipment) this.pendingMailDrops.equipment = [];
          for (const e of arr.slice(STORAGE_CAPACITY.equipment)) this.pendingMailDrops.equipment.push(e);
        } else {
          this.equipmentStorage = arr;
        }
      }
      if (saveData.inventory) {
        const arr = saveData.inventory;
        if (arr.length > STORAGE_CAPACITY.inventory) {
          this.inventory = arr.slice(0, STORAGE_CAPACITY.inventory);
          if (!this.pendingMailDrops.items) this.pendingMailDrops.items = [];
          for (const it of arr.slice(STORAGE_CAPACITY.inventory)) this.pendingMailDrops.items.push({ ...it });
        } else {
          this.inventory = arr;
        }
      }
      // 调试模式：确保抽奖罐存在（新道具上线补偿，背包无抽奖罐时补发 10 个）
      {
        const lp = this.inventory.find(i => i.itemId === 'lottery_pot');
        if (!lp && this.inventory.length < STORAGE_CAPACITY.inventory) {
          this.inventory.push({ itemId: 'lottery_pot', count: 10 });
        } else if (!lp) {
          // 仓库满则溢入待发邮件
          if (!this.pendingMailDrops.items) this.pendingMailDrops.items = [];
          this.pendingMailDrops.items.push({ itemId: 'lottery_pot', count: 10 });
        }
      }
      if (saveData.gemInventory) {
        // 调试模式：宝石始终重置为每种99颗
        const gemIds = [
          'gem_attack_common', 'gem_attack_advanced',
          'gem_health_common', 'gem_health_advanced',
          'gem_defense_common', 'gem_defense_advanced',
          'gem_critRate_common', 'gem_critRate_advanced',
          'gem_resistance_common', 'gem_resistance_advanced',
        ];
        this.gemInventory = gemIds.map(id => ({ itemId: id, count: 99 }));
      }
      // 调试模式：强化道具也始终重置为每种 99 个
      this.enhanceItemInventory = [
        { itemId: 'enhance_scroll_plus1', count: 99 },
        { itemId: 'enhance_scroll_plus2', count: 99 },
        { itemId: 'enhance_normal_booster', count: 99 },
        { itemId: 'enhance_ancient_booster', count: 99 },
      ];
      // 调试模式：附魔书也始终重置为初始库存
      this.enchantItemInventory = INITIAL_ENCHANT_INVENTORY.map(x => ({ ...x }));
      if (saveData.skills) {
        for (const savedSkill of saveData.skills) {
          const skill = this.skills.find(s => s.id === savedSkill.id);
          if (skill) {
            skill.level = savedSkill.level || 0;
          }
        }
      }
      // 老存档兼容：1级默认自带一级【冰冻弹】
      const fxFreezeLoaded = this.skills.find(s => s.id === 'fx_freeze_1');
      if (fxFreezeLoaded && fxFreezeLoaded.level < 1) fxFreezeLoaded.level = 1;
      if (saveData.talents) {
        this.talents = saveData.talents;
      }
      if (saveData.highestWave) {
        this.highestWave = saveData.highestWave;
      }
      if (saveData.codexEntries) {
        this.codexEntries = saveData.codexEntries;
      }
      if (saveData.achievements) {
        // 存档兼容：旧存档的成就可能没有 claimed / category 字段
        // 旧版本 unlocked=true 即代表已自动发奖，视为已领取
        this.achievements = saveData.achievements.map(saved => {
          const def = this.achievements.find(a => a.id === saved.id);
          return {
            ...saved,
            claimed: saved.claimed !== undefined ? saved.claimed : (saved.unlocked ? true : false),
            category: saved.category || (def?.category ?? 'system'),
          };
        });
      }
      if (saveData.mails) {
        this.mails = saveData.mails;
      }
      // 7日签到数据
      if (saveData.checkInDays) {
        this.checkInDays = saveData.checkInDays;
      }
      if (saveData.checkInWeekKey) {
        this.checkInWeekKey = saveData.checkInWeekKey;
      }
      // 在线奖励数据
      if (saveData.onlineMinutes !== undefined) {
        this.onlineMinutes = saveData.onlineMinutes;
      }
      if (saveData.onlineRewardClaimed !== undefined) {
        this.onlineRewardClaimed = saveData.onlineRewardClaimed;
      }
      // 抽奖机（跑马灯水果机）数据
      if (saveData.lotteryCoins !== undefined) {
        this.lotteryCoins = saveData.lotteryCoins;
      }
      if (saveData.lotteryCoinsDate !== undefined) {
        this.lotteryCoinsDate = saveData.lotteryCoinsDate;
      }
      if (saveData.lotteryBets !== undefined) {
        // 仅保留有效的水果种类 id 作为押注键（兼容旧的格子 id 押注存档）
        const validIds = new Set(GameEngine.LOTTERY_CATEGORIES.map(c => c.id));
        const cleaned: Record<string, number> = {};
        for (const [k, v] of Object.entries(saveData.lotteryBets)) {
          if (validIds.has(k)) cleaned[k] = v as number;
        }
        this.lotteryBets = cleaned;
      }
      if (saveData.lotteryConsecutiveLogin !== undefined) this.lotteryConsecutiveLogin = saveData.lotteryConsecutiveLogin;
      if (saveData.lotteryLastLoginDate !== undefined) this.lotteryLastLoginDate = saveData.lotteryLastLoginDate;
      if (saveData.lotteryTournamentBest !== undefined) this.lotteryTournamentBest = saveData.lotteryTournamentBest;
      if (saveData.lotteryLastWin !== undefined) this.lotteryLastWin = saveData.lotteryLastWin;
      if (saveData.lotteryHistory !== undefined) this.lotteryHistory = saveData.lotteryHistory;
      if (saveData.lotteryFreeSpins !== undefined) this.lotteryFreeSpins = saveData.lotteryFreeSpins;
      if (saveData.lotteryLuckyMissCounter !== undefined) this.lotteryLuckyMissCounter = saveData.lotteryLuckyMissCounter;

      this.calculatePlayerStats();
      this.initActiveSkills();
      // 旧存档超容截断后，将溢出的待发邮件刷新为战斗邮件发送给玩家
      if ((this.pendingMailDrops.equipment && this.pendingMailDrops.equipment.length > 0) ||
          (this.pendingMailDrops.items && this.pendingMailDrops.items.length > 0)) {
        this.sendBattleMail();
      }
      
      return true;
    } catch (e) {
      console.warn('Failed to load game:', e);
      return false;
    }
  }

  setBaseStats(stats: Partial<{ attack: number; attackSpeed: number; manualAttackSpeed: number; maxHealth: number; range: number; level: number }>): void {
    this.debugConfig.baseStats = { ...this.debugConfig.baseStats, ...stats };
    if (stats.level !== undefined) {
      this.player.level = Math.min(stats.level, 300);
      this.player.expToNextLevel = this.calculateExpToNextLevel(this.player.level);
    }
    if (stats.maxHealth !== undefined) {
      this.player.health = stats.maxHealth;
    }
    this.calculatePlayerStats();
    if (this.onPlayerChange) this.onPlayerChange({ ...this.player });
  }

  setPowerWeights(weights: Partial<{ attack: number; attackSpeed: number; maxHealth: number; critRate: number; critDamage: number; physicalPenetration: number; lifestealPercent: number; range: number; defense: number; burnChance: number; poisonChance: number; freezeChance: number; lightningChance: number }>): void {
    this.debugConfig.powerWeights = { ...this.debugConfig.powerWeights, ...weights };
  }

  setEnemyPowerWeights(weights: Partial<{ attack: number; attackSpeed: number; maxHealth: number; critRate: number; critDamage: number; physicalPenetration: number; lifestealPercent: number; range: number; defense: number; burnChance: number; poisonChance: number; freezeChance: number; lightningChance: number }>): void {
    this.debugConfig.enemyPowerWeights = { ...this.debugConfig.enemyPowerWeights, ...weights };
  }

  // 获取玩家所有属性（包括动态附加属性）
  getPlayerStats(): Record<string, number> {
    const p = this.player as any;
    const keys = [
      'level', 'exp', 'expToNextLevel', 'gold', 'score', 'skillPoints',
      'attack', 'attackSpeed', 'manualAttackSpeed', 'range', 'maxHealth', 'health',
      'critRate', 'critDamage', 'defense', 'regenPerSec',
      'goldBonus', 'expBonus', 'dropBonus',
      'burnChance', 'burnDamage', 'burnDuration',
      'poisonChance', 'poisonDamage', 'poisonDuration',
      'freezeChance', 'freezeSlowAmount', 'freezeDuration',
      'lightningChance', 'lightningChain', 'lightningDamage',
      'lifestealPercent', 'physicalPenetration', 'bulletPierceCount', 'resistance',
    ];
    const result: Record<string, number> = {};
    for (const k of keys) {
      result[k] = Number(p[k] ?? 0);
    }
    return result;
  }

  // 直接覆盖玩家属性
  setPlayerStats(stats: Record<string, number>): void {
    const p = this.player as any;
    for (const [k, v] of Object.entries(stats)) {
      if (v === undefined || v === null || isNaN(v)) continue;
      p[k] = v;
    }
    // 同步等级对应的经验上限
    if (stats.level !== undefined) {
      p.expToNextLevel = this.calculateExpToNextLevel(Math.min(stats.level, 300));
    }
    // 同步生命上限
    if (stats.maxHealth !== undefined && p.health > stats.maxHealth) {
      p.health = stats.maxHealth;
    }
    if (this.onPlayerChange) this.onPlayerChange({ ...this.player });
  }

  getGameMode(): string {
    return this.gameMode;
  }

  calcPower(): number {
    const p = this.player as any;
    const w = this.debugConfig.powerWeights;
    let power = 0;
    power += (p.attack || 0) * w.attack;
    power += (1000 / (p.attackSpeed || 1000)) * w.attackSpeed;
    power += (p.maxHealth || 0) * w.maxHealth;
    power += (p.critRate || 0) * w.critRate;
    power += ((p.critDamage || 0) - 100) * w.critDamage;
    power += (p.physicalPenetration || 0) * w.physicalPenetration;
    power += (p.lifestealPercent || 0) * w.lifestealPercent;
    power += (p.range || 0) * w.range;
    power += (p.defense || 0) * w.defense;
    power += (p.burnChance || 0) * w.burnChance;
    power += (p.poisonChance || 0) * w.poisonChance;
    power += (p.freezeChance || 0) * w.freezeChance;
    power += (p.lightningChance || 0) * w.lightningChance;
    return Math.round(power);
  }

  // 获取战斗力计算过程字符串
  getPowerCalcProcess(): string {
    const p = this.player as any;
    const w = this.debugConfig.powerWeights;
    const terms: string[] = [];
    const attrs = [
      { key: 'attack', label: '攻', val: p.attack || 0, w: w.attack },
      { key: 'attackSpeed', label: '速', val: 1000 / (p.attackSpeed || 1000), w: w.attackSpeed },
      { key: 'maxHealth', label: '血', val: p.maxHealth || 0, w: w.maxHealth },
      { key: 'critRate', label: '暴', val: p.critRate || 0, w: w.critRate },
      { key: 'critDamage', label: '暴伤', val: ((p.critDamage || 0) - 100), w: w.critDamage },
      { key: 'physicalPenetration', label: '穿', val: p.physicalPenetration || 0, w: w.physicalPenetration },
      { key: 'lifestealPercent', label: '吸', val: p.lifestealPercent || 0, w: w.lifestealPercent },
      { key: 'range', label: '程', val: p.range || 0, w: w.range },
      { key: 'defense', label: '防', val: p.defense || 0, w: w.defense },
      { key: 'burnChance', label: '燃', val: p.burnChance || 0, w: w.burnChance },
      { key: 'poisonChance', label: '毒', val: p.poisonChance || 0, w: w.poisonChance },
      { key: 'freezeChance', label: '冰', val: p.freezeChance || 0, w: w.freezeChance },
      { key: 'lightningChance', label: '雷', val: p.lightningChance || 0, w: w.lightningChance },
    ];
    for (const a of attrs) {
      const contribution = a.val * a.w;
      if (Math.abs(contribution) > 0.01) {
        const valStr = Number.isInteger(a.val) ? String(a.val) : a.val.toFixed(1);
        const wStr = Number.isInteger(a.w) ? String(a.w) : a.w.toFixed(1);
        terms.push(`${a.label}${valStr}*${wStr}`);
      }
    }
    return terms.join('+') + '=' + this.calcPower();
  }

  // 获取第一个活动怪物的属性
  getEnemyStats(): Record<string, number> {
    const enemies = this.enemyPool.getActive().filter(e => e.active && !(e as any).isSandbag);
    if (enemies.length === 0) return {};
    // 选择距离玩家最远的怪物
    const enemy = enemies.reduce((farthest, e) => {
      const dist = Math.abs(e.x - this.player.x);
      const farthestDist = Math.abs(farthest.x - this.player.x);
      return dist > farthestDist ? e : farthest;
    }, enemies[0]);
    const keys = [
      'maxHealth', 'health', 'damage', 'speed', 'attack', 'attackSpeed',
      'critRate', 'critDamage', 'pierceCount', 'lifestealPercent', 'range', 'defense',
      'burnChance', 'poisonChance', 'freezeChance', 'lightningChance',
    ];
    const result: Record<string, number> = {};
    for (const k of keys) {
      result[k] = Number((enemy as any)[k] ?? 0);
    }
    return result;
  }

  // 设置所有活动怪物的属性
  setEnemyStats(stats: Record<string, number>): void {
    const enemies = this.enemyPool.getActive();
    for (const enemy of enemies) {
      if (!enemy.active || (enemy as any).isSandbag) continue;
      for (const [k, v] of Object.entries(stats)) {
        if (v === undefined || v === null || isNaN(v)) continue;
        (enemy as any)[k] = v;
      }
      if (stats.maxHealth !== undefined && enemy.health > stats.maxHealth) {
        enemy.health = stats.maxHealth;
      }
    }
  }

  // 计算怪物战斗力（使用第一个活动怪物）
  calcEnemyPower(): number {
    const stats = this.getEnemyStats();
    if (Object.keys(stats).length === 0) return 0;
    const w = this.debugConfig.enemyPowerWeights;
    let power = 0;
    power += (stats.attack || 0) * w.attack;
    power += (1000 / (stats.attackSpeed || 1000)) * w.attackSpeed;
    power += (stats.maxHealth || 0) * w.maxHealth;
    power += (stats.critRate || 0) * w.critRate;
    power += ((stats.critDamage || 0) - 100) * w.critDamage;
    power += (stats.physicalPenetration || 0) * w.physicalPenetration;
    power += (stats.lifestealPercent || 0) * w.lifestealPercent;
    power += (stats.range || 0) * w.range;
    power += (stats.defense || 0) * w.defense;
    power += (stats.burnChance || 0) * w.burnChance;
    power += (stats.poisonChance || 0) * w.poisonChance;
    power += (stats.freezeChance || 0) * w.freezeChance;
    power += (stats.lightningChance || 0) * w.lightningChance;
    return Math.round(power);
  }

  // 获取怪物战斗力计算过程字符串
  getEnemyPowerCalcProcess(): string {
    const stats = this.getEnemyStats();
    if (Object.keys(stats).length === 0) return '无活动怪物';
    const w = this.debugConfig.enemyPowerWeights;
    const terms: string[] = [];
    const attrs = [
      { key: 'attack', label: '攻', val: stats.attack || 0, w: w.attack },
      { key: 'attackSpeed', label: '速', val: 1000 / (stats.attackSpeed || 1000), w: w.attackSpeed },
      { key: 'maxHealth', label: '血', val: stats.maxHealth || 0, w: w.maxHealth },
      { key: 'critRate', label: '暴', val: stats.critRate || 0, w: w.critRate },
      { key: 'critDamage', label: '暴伤', val: ((stats.critDamage || 0) - 100), w: w.critDamage },
      { key: 'physicalPenetration', label: '穿', val: stats.physicalPenetration || 0, w: w.physicalPenetration },
      { key: 'lifestealPercent', label: '吸', val: stats.lifestealPercent || 0, w: w.lifestealPercent },
      { key: 'range', label: '程', val: stats.range || 0, w: w.range },
      { key: 'defense', label: '防', val: stats.defense || 0, w: w.defense },
      { key: 'burnChance', label: '燃', val: stats.burnChance || 0, w: w.burnChance },
      { key: 'poisonChance', label: '毒', val: stats.poisonChance || 0, w: w.poisonChance },
      { key: 'freezeChance', label: '冰', val: stats.freezeChance || 0, w: w.freezeChance },
      { key: 'lightningChance', label: '雷', val: stats.lightningChance || 0, w: w.lightningChance },
    ];
    for (const a of attrs) {
      const contribution = a.val * a.w;
      if (Math.abs(contribution) > 0.01) {
        const valStr = Number.isInteger(a.val) ? String(a.val) : a.val.toFixed(1);
        const wStr = Number.isInteger(a.w) ? String(a.w) : a.w.toFixed(1);
        terms.push(`${a.label}${valStr}*${wStr}`);
      }
    }
    return terms.join('+') + '=' + this.calcEnemyPower();
  }

  private applyEnemyDebuff(type: string, damage: number, duration: number): void {
    const enemies = this.enemyPool.getActive();
    for (const enemy of enemies) {
      if (type === 'freeze') {
        (enemy as any).frozenUntil = performance.now() + duration;
      } else {
        (enemy as any).debuffs = (enemy as any).debuffs || [];
        (enemy as any).debuffs.push({ type, damage, duration, startTime: performance.now() });
      }
    }
  }

  private bombAllEnemies(damage: number): void {
    const enemies = this.enemyPool.getActive();
    for (const enemy of enemies) {
      this.damageEnemy(enemy, damage);
    }
    this.screenShake = 15;
  }

  private stunAllEnemies(duration: number): void {
    const enemies = this.enemyPool.getActive();
    for (const enemy of enemies) {
      enemy.stunTimer = Math.max(enemy.stunTimer, duration);
    }
    this.screenShake = 5;
  }

  private lightningStrikeAll(damage: number, duration: number): void {
    const enemies = this.enemyPool.getActive();
    for (const enemy of enemies) {
      this.damageEnemy(enemy, damage);
      this.applyEnemyDebuff('lightning', Math.floor(damage * 0.2), duration);
    }
    this.screenShake = 10;
  }

  useSkill(skillId: string): boolean {
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill || skill.level <= 0 || skill.currentCooldown > 0) return false;

    // 支持按等级冷却：若定义了 cooldowns 数组则按等级取值
    skill.currentCooldown = skill.cooldowns && skill.cooldowns.length > 0
      ? skill.cooldowns[Math.min(skill.level, skill.cooldowns.length) - 1]
      : skill.cooldown;

    switch (skillId) {
      case 'multishot_1':
      case 'multishot_2':
      case 'multishot_3':
        this.multishotActive = true;
        this.multishotDuration = skillId === 'multishot_1' ? 3000 : skillId === 'multishot_2' ? 4000 : 5000;
        break;
      case 'laser_1':
      case 'laser_2':
      case 'laser_3':
        this.laserActive = true;
        this.laserDuration = skillId === 'laser_1' ? 2000 : skillId === 'laser_2' ? 3000 : 4000;
        break;
      case 'shield_1':
      case 'shield_2':
      case 'shield_3':
        this.shieldActive = true;
        const shieldDuration = skillId === 'shield_1' ? 3000 : skillId === 'shield_2' ? 5000 : 8000;
        this.trackTimer(setTimeout(() => { this.shieldActive = false; }, shieldDuration) as unknown as number);
        break;
      case 'nuke_1':
        this.bombAllEnemies(300);
        break;
      case 'nuke_2':
        this.bombAllEnemies(750);
        break;
      case 'nuke_3':
        this.bombAllEnemies(2000);
        break;
      // === 左树特效技能（主动） ===
      case 'fx_laser_1': {
        const lvl = skill.level;
        this.laserActive = true;
        this.laserDuration = 5000;
        this.laserDamageTimer = 0;
        this.laserDamageReady = true;
        const cloneCount = this.getCloneCount();
        while (this.cloneLasersActive.length < cloneCount) {
          this.cloneLasersActive.push(false);
          this.cloneLaserDurations.push(0);
          this.cloneLaserDamageTimers.push(0);
          this.cloneLaserDamageReady.push(false);
        }
        for (let i = 0; i < cloneCount; i++) {
          this.cloneLasersActive[i] = true;
          this.cloneLaserDurations[i] = 5000;
          this.cloneLaserDamageTimers[i] = 0;
          this.cloneLaserDamageReady[i] = true;
        }
        break;
      }
      case 'fx_flash_1':
        this.stunAllEnemies(5000);
        this.flashLightningActive = true;
        this.flashLightningTimer = 1500;
        // 新增：每秒1%最大生命值伤害，持续5秒
        {
          const now = performance.now();
          for (const enemy of this.enemyPool.getActive()) {
            (enemy as any).flashBurnUntil = now + 5000;
          }
        }
        break;
      // === 冰冻弹（主动）：发射冰冻弹，命中后冰冻目标及身后lvl-1个敌人3秒 ===
      case 'fx_freeze_1': {
        const lvl = skill.level;
        const px = 1.5;
        const bulletX = this.player.x + 13.5 * px + 16 * px;
        const bulletY = this.player.y + 5.5 * px + 1 * px;
        // 锁定最近敌人作为弹道方向
        const target = this.enemyPool.getActive()
          .filter(e => e.active)
          .map(e => ({ e, d: (e.x - this.player.x) * (e.x - this.player.x) + (e.y - this.player.y) * (e.y - this.player.y) }))
          .sort((a, b) => a.d - b.d)[0];
        if (target) {
          if (this.bulletPool.getActive().length < 120) {
            const bullet = this.bulletPool.acquire(bulletX, bulletY, this.player.attack) as Bullet;
            const ba = bullet as any;
            ba.angle = Math.atan2((target.e.y + target.e.height / 2) - bulletY, (target.e.x + target.e.width / 2) - bulletX);
            ba.isFreezeBullet = true;
            ba.freezeLvl = lvl;
            ba.activeFreeze = true;      // 100%冰冻
            ba.activeFreezeCount = lvl;  // 命中后冰冻的敌人数（含目标）
            bullet.speed = 250;
          }
        }
        break;
      }
      // === 爆弹（主动）：发射爆弹，命中爆炸半径40+10*(lvl-1)，灼烧3秒 ===
      case 'fx_bomb_1': {
        const lvl = skill.level;
        const px = 1.5;
        const bulletX = this.player.x + 13.5 * px + 16 * px;
        const bulletY = this.player.y + 5.5 * px + 1 * px;
        const target = this.enemyPool.getActive()
          .filter(e => e.active)
          .map(e => ({ e, d: (e.x - this.player.x) * (e.x - this.player.x) + (e.y - this.player.y) * (e.y - this.player.y) }))
          .sort((a, b) => a.d - b.d)[0];
        if (target) {
          if (this.bulletPool.getActive().length < 120) {
            const bullet = this.bulletPool.acquire(bulletX, bulletY, this.player.attack) as Bullet;
            const ba = bullet as any;
            ba.angle = Math.atan2((target.e.y + target.e.height / 2) - bulletY, (target.e.x + target.e.width / 2) - bulletX);
            ba.hasBomb = true;
            ba.bombLvl = lvl;
            ba.isBombBullet = true;
            ba.activeBomb = true;
            ba.activeBombRadius = 40 + 10 * (lvl - 1);
            ba.activeBombBurnDmg = 10 + this.player.attack * 0.1;
            bullet.speed = 167;
          }
        }
        break;
      }
      // === 毒气弹（主动）：发射毒气弹，命中产生半径40+10*(lvl-1)毒气持续7+lvl-1秒 ===
      case 'fx_poison_1': {
        const lvl = skill.level;
        const px = 1.5;
        const bulletX = this.player.x + 13.5 * px + 16 * px;
        const bulletY = this.player.y + 5.5 * px + 1 * px;
        const target = this.enemyPool.getActive()
          .filter(e => e.active)
          .map(e => ({ e, d: (e.x - this.player.x) * (e.x - this.player.x) + (e.y - this.player.y) * (e.y - this.player.y) }))
          .sort((a, b) => a.d - b.d)[0];
        if (target) {
          if (this.bulletPool.getActive().length < 120) {
            const bullet = this.bulletPool.acquire(bulletX, bulletY, this.player.attack) as Bullet;
            const ba = bullet as any;
            ba.angle = Math.atan2((target.e.y + target.e.height / 2) - bulletY, (target.e.x + target.e.width / 2) - bulletX);
            ba.isPoisonBullet = true;
            ba.poisonLvl = lvl;
            ba.poisonAoe = true;
            ba.activePoison = true;
            ba.activePoisonRadius = 40 + 10 * (lvl - 1);
            ba.activePoisonDuration = (7 + lvl - 1) * 1000;
            ba.activePoisonDmg = 20 + this.player.attack * 0.5;
            bullet.speed = 125;
          }
        }
        break;
      }
      // === 电击弹（主动）：发射电击弹，命中后对目标及身后4+lvl-1个敌人连锁电击，感电5秒 ===
      case 'fx_shock_1': {
        const lvl = skill.level;
        const chainCount = 4 + (lvl - 1); // 命中后连锁的敌人数（不含目标）
        const px = 1.5;
        const bulletX = this.player.x + 13.5 * px + 16 * px;
        const bulletY = this.player.y + 5.5 * px + 1 * px;
        // 锁定最近敌人作为弹道方向
        const target = this.enemyPool.getActive()
          .filter(e => e.active)
          .map(e => ({ e, d: (e.x - this.player.x) * (e.x - this.player.x) + (e.y - this.player.y) * (e.y - this.player.y) }))
          .sort((a, b) => a.d - b.d)[0];
        if (target) {
          if (this.bulletPool.getActive().length < 120) {
            const bullet = this.bulletPool.acquire(bulletX, bulletY, this.player.attack) as Bullet;
            const ba = bullet as any;
            ba.angle = Math.atan2((target.e.y + target.e.height / 2) - bulletY, (target.e.x + target.e.width / 2) - bulletX);
            ba.isWaveBullet = true;
            ba.waveLvl = lvl;
            ba.activeShock = true;            // 标记主动电击弹
            ba.activeShockChain = chainCount; // 命中后连锁的敌人数
            ba.wavePhase = 0;
            bullet.width = 50;
            bullet.speed = 500;
          }
        }
        break;
      }
      // === 终极核弹（主动）：抛物线发射核弹到所有敌人中心，大范围爆炸 ===
      case 'fx_nuke_1': {
        const lvl = skill.level;
        const activeEnemies = this.enemyPool.getActive().filter(e => e.active);
        if (activeEnemies.length === 0) break;
        // 计算所有敌人的中心点
        let sumX = 0, sumY = 0;
        for (const e of activeEnemies) {
          sumX += e.x + e.width / 2;
          sumY += e.y + e.height / 2;
        }
        const centerX = sumX / activeEnemies.length;
        const centerY = sumY / activeEnemies.length;

        const px = 1.5;
        const fromX = this.player.x + 13.5 * px + 16 * px;
        const fromY = this.player.y + 5.5 * px + 1 * px;

        if (this.bulletPool.getActive().length < 120) {
          const dx = centerX - fromX;
          const dy = centerY - fromY;
          // 弹道速度-70%：flightTime = 0.8/0.3 ≈ 2.67
          // 抛物线高度+250%（当前64px→224px）：gravity = 8*224/2.67² ≈ 251
          const flightTime = 2.67;
          const gravity = 251;
          const vx = dx / flightTime;
          const vy = (dy - 0.5 * gravity * flightTime * flightTime) / flightTime;

          const damage = Math.floor(this.player.attack * (10 + 10 * (lvl - 1))); // 1000%/级
          const bullet = this.bulletPool.acquire(fromX, fromY, damage) as any;
          bullet.isNuke = true;
          bullet.vx = vx;
          bullet.vy = vy;
          bullet.gravity = gravity;
          bullet.trail = [];
          bullet.nukeTargetX = centerX;
          bullet.nukeTargetY = centerY;
          bullet.nukeRadius = 100 + 100 * (lvl - 1); // 每级+100px
          bullet.nukeDamage = damage;
          bullet.width = 14;
          bullet.height = 14;
          bullet.grenadeColor = '#00FF88';
        }
        break;
      }
      case 'clone_sweep':
        this.sweepActive = true;
        this.sweepDuration = 10000;
        // 重置所有分身相关冷却，确保两个分身都能立即生效
        this.cloneShockCooldowns = this.cloneShockCooldowns.map(() => 0);
        this.cloneGrenadeCooldowns = this.cloneGrenadeCooldowns.map(() => 0);
        this.cloneShootTimers = this.cloneShootTimers.map(() => 0);
        for (const s of this.skills) {
          if (s.id === 'fx_laser_1' || s.id === 'fx_flash_1') {
            s.currentCooldown = 0;
          }
        }
        break;
    }

    if (this.onSkillsChange) {
      this.onSkillsChange(this.skills);
    }

    return true;
  }

  useActiveSkill(skillId: string): boolean {
    const skill = this.activeSkills.find(s => s.id === skillId);
    if (!skill || skill.currentCooldown > 0) return false;

    skill.currentCooldown = skill.cooldown;

    switch (skillId) {
      case 'dodge':
        this.player.isDodging = true;
        this.player.dodgeTimer = 400;
        this.player.invincibleTimer = 500;
        break;
      case 'grenade':
        this.throwGrenade();
        break;
      case 'drone':
        this.activateDrone();
        break;
    }

    return true;
  }

  private throwGrenade(): void {
    const enemies = this.enemyPool.getActive();
    if (enemies.length === 0) return;

    let closest = enemies[0];
    let minDist = Infinity;
    for (const e of enemies) {
      if (e.x > this.player.x) {
        const dist = e.x - this.player.x;
        if (dist < minDist) {
          minDist = dist;
          closest = e;
        }
      }
    }

    const explosionX = closest.x + closest.width / 2;
    const explosionY = closest.y + closest.height / 2;
    const explosionRadius = 80;
    const explosionDamage = 100 + this.player.attack * 0.5;

    if (this.particlePool.canAcquire()) {
      for (let i = 0; i < 20; i++) {
        this.particlePool.acquire(
          explosionX + randomRange(-20, 20),
          explosionY + randomRange(-20, 20),
          i % 2 === 0 ? '#FF6600' : '#FFAA00'
        );
      }
    }

    for (const enemy of enemies) {
      const dx = (enemy.x + enemy.width / 2) - explosionX;
      const dy = (enemy.y + enemy.height / 2) - explosionY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < explosionRadius) {
        const dmgMultiplier = 1 - (dist / explosionRadius) * 0.5;
        this.damageEnemy(enemy, Math.floor(explosionDamage * dmgMultiplier));
      }
    }

    this.screenShake = 6;
  }

  private explodeGrenade(bullet: Bullet): void {
    const bulletAny = bullet as any;
    const enemies = this.enemyPool.getActive();
    const explosionX = bullet.x + bullet.width / 2;
    const explosionY = bullet.y + bullet.height / 2;
    const explosionRadius = bulletAny.explosionRadius || 60;
    const explosionDamage = bullet.damage * (bulletAny.explosionDamageMultiplier || 2);

    if (this.particlePool.canAcquire()) {
      for (let i = 0; i < 25; i++) {
        if (!this.particlePool.canAcquire()) break;
        const p = this.particlePool.acquire(
          explosionX + randomRange(-30, 30),
          explosionY + randomRange(-30, 30),
          i % 3 === 0 ? '#FF6600' : i % 3 === 1 ? '#FFAA00' : '#FF4400'
        );
        (p as any).vx = randomRange(-100, 100);
        (p as any).vy = randomRange(-120, 20);
        (p as any).life = 0.5 + Math.random() * 0.5;
        (p as any).maxLife = 1;
      }
    }

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = (enemy.x + enemy.width / 2) - explosionX;
      const dy = (enemy.y + enemy.height / 2) - explosionY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < explosionRadius) {
        const dmgMultiplier = 1 - (dist / explosionRadius) * 0.4;
        this.damageEnemy(enemy, Math.floor(explosionDamage * dmgMultiplier));
      }
    }

    this.screenShake = 4;
  }

  // 终极核弹爆炸：大范围高伤害 + 冲击波环 + 蘑菇云 + 闪光
  private explodeNuke(bullet: Bullet): void {
    const bulletAny = bullet as any;
    const enemies = this.enemyPool.getActive();
    const explosionX = bulletAny.nukeTargetX ?? (bullet.x + bullet.width / 2);
    const explosionY = bulletAny.nukeTargetY ?? (bullet.y + bullet.height / 2);
    const explosionRadius = bulletAny.nukeRadius || 100;
    const explosionDamage = bulletAny.nukeDamage || bullet.damage;

    // 1. 冲击波环（3层不同颜色扩散）
    this.nukeShockwaves.push(
      { x: explosionX, y: explosionY, radius: 10, maxRadius: explosionRadius * 1.3, alpha: 1, color: '#FFFFFF' },
      { x: explosionX, y: explosionY, radius: 5, maxRadius: explosionRadius * 1.1, alpha: 0.9, color: '#00FF88' },
      { x: explosionX, y: explosionY, radius: 0, maxRadius: explosionRadius * 0.8, alpha: 0.8, color: '#FFAA00' },
    );

    // 2. 蘑菇云粒子（向上喷射）
    if (this.particlePool.canAcquire()) {
      for (let i = 0; i < 40; i++) {
        if (!this.particlePool.canAcquire()) break;
        const p = this.particlePool.acquire(
          explosionX + randomRange(-40, 40),
          explosionY + randomRange(-10, 10),
          i % 2 === 0 ? '#00FF88' : '#FFAA00'
        );
        (p as any).vx = randomRange(-60, 60);
        (p as any).vy = randomRange(-300, -120); // 向上喷射
        (p as any).life = 1.2 + Math.random() * 0.8;
        (p as any).maxLife = 2;
      }
    }

    // 3. 爆炸碎片粒子（向外飞散）
    if (this.particlePool.canAcquire()) {
      for (let i = 0; i < 30; i++) {
        if (!this.particlePool.canAcquire()) break;
        const angle = (i / 30) * Math.PI * 2;
        const speed = randomRange(150, 250);
        const p = this.particlePool.acquire(
          explosionX, explosionY,
          i % 3 === 0 ? '#FF6600' : i % 3 === 1 ? '#FFAA00' : '#00FF88'
        );
        (p as any).vx = Math.cos(angle) * speed;
        (p as any).vy = Math.sin(angle) * speed;
        (p as any).life = 0.6 + Math.random() * 0.4;
        (p as any).maxLife = 1;
      }
    }

    // 4. 伤害结算
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = (enemy.x + enemy.width / 2) - explosionX;
      const dy = (enemy.y + enemy.height / 2) - explosionY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < explosionRadius) {
        const dmgMultiplier = 1 - (dist / explosionRadius) * 0.3;
        this.damageEnemy(enemy, Math.floor(explosionDamage * dmgMultiplier));
      }
    }

    // 5. 屏幕震动（强）
    this.screenShake = 20;
  }

  private fireGrenade(fromX: number, fromY: number, isClone: boolean = false, targetOffset: number = 0, grenadeIndex: number = 0, cloneIdx: number = -1): void {
    if (this.bulletPool.getActive().length >= 120) return;
    const sorted = this.getSortedRightEnemies(this.player.x);
    let target: Enemy | undefined;
    const targetIdx = targetOffset + grenadeIndex;
    
    // 先收集右侧敌人
    const rightEnemies: Enemy[] = [];
    for (const enemy of sorted) {
      if (enemy.x > fromX) {
        rightEnemies.push(enemy);
      }
    }
    
    // 如果目标索引超过范围，锁定最后一个敌人
    const finalTargetIdx = Math.min(targetIdx, rightEnemies.length - 1);
    if (rightEnemies.length > 0) {
      target = rightEnemies[finalTargetIdx];
    }
    if (!target) return;

    const targetX = target.x + target.width / 2;
    const targetY = target.y + target.height / 2;

    const dx = targetX - fromX;
    const dy = targetY - fromY;
    const flightTime = 0.8;
    const gravity = 400;

    const vx = dx / flightTime;
    const vy = (dy - 0.5 * gravity * flightTime * flightTime) / flightTime;

    const damage = Math.floor(this.player.attack * 1.2);
    const bullet = this.bulletPool.acquire(fromX, fromY, damage) as any;
    bullet.isGrenade = true;
    bullet.vx = vx;
    bullet.vy = vy;
    bullet.gravity = gravity;
    bullet.trail = [];
    bullet.width = 8;
    bullet.height = 8;
    bullet.cloneGrenade = isClone;
    if (cloneIdx === 1) {
      bullet.grenadeColor = '#FF0040';
    } else {
      bullet.grenadeColor = isClone ? '#FF8C00' : '#FFFFFF';
    }
  }

  private droneActive: boolean = false;
  private droneTimer: number = 0;
  private droneShootCooldown: number = 0;

  private cloneShootTimers: number[] = [];
  private grenadeCooldown: number = 0;
  private cloneGrenadeCooldowns: number[] = [];

  // === 性能优化：空间网格 ===
  private enemyGrid: Map<number, Enemy[]> = new Map();
  private gridCellSize: number = 80;
  private _sortedEnemiesCache: Enemy[] = [];
  private _sortedEnemiesDirty: boolean = true;
  private _sortedRefX: number = 0;

  // 性能优化：缓存按 X 距离玩家升序排序的右侧敌人，每帧复用，避免 shoot/updateClones 各自再 sort
  private getSortedRightEnemies(refX: number): Enemy[] {
    if (this._sortedEnemiesDirty || refX !== this._sortedRefX) {
      this._sortedRefX = refX;
      const enemies = this.enemyPool.getActive();
      this._sortedEnemiesCache.length = 0;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.active && e.x > refX) this._sortedEnemiesCache.push(e);
      }
      this._sortedEnemiesCache.sort((a, b) => (a.x - refX) - (b.x - refX));
      this._sortedEnemiesDirty = false;
    }
    return this._sortedEnemiesCache;
  }

  private activateDrone(): void {
    this.droneActive = true;
    this.droneTimer = 10000;
    this.droneShootCooldown = 0;
  }

  selectTalent(talentId: string): boolean {
    const talent = this.talentChoices.find(t => t.id === talentId);
    if (!talent) return false;

    this.talents.push(talent);
    this.showTalentSelection = false;
    this.talentChoices = [];
    this.calculatePlayerStats();

    if (this.onPlayerChange) {
      this.onPlayerChange(this.player);
    }

    return true;
  }

  private rollTalentChoices(): void {
    const allTalents = this.getAllTalents();
    const available = allTalents.filter(t => !this.talents.find(owned => owned.id === t.id));
    
    const choices: Talent[] = [];
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      choices.push(shuffled[i]);
    }

    this.talentChoices = choices;
    this.showTalentSelection = true;

    if (this.onTalentSelection) {
      this.onTalentSelection([...choices]);
    }
  }

  private getAllTalents(): Talent[] {
    return [
      { id: 'bullet_bounce', name: '子弹反弹', description: '子弹有20%几率在命中后反弹', icon: '🔄', rarity: 'rare', effect: 'bulletBounce', value: 20, stat: 'special' },
      { id: 'kill_heal', name: '击杀回血', description: '击杀敌人恢复2%生命', icon: '💖', rarity: 'common', effect: 'killHeal', value: 2, stat: 'special' },
      { id: 'atk_speed_up', name: '攻速提升', description: '攻击速度+15%', icon: '⚡', rarity: 'common', effect: 'attackSpeed', value: 15, stat: 'attackSpeed' },
      { id: 'atk_up', name: '攻击强化', description: '攻击力+25', icon: '💪', rarity: 'common', effect: 'attack', value: 25, stat: 'attack' },
      { id: 'crit_up', name: '暴击率提升', description: '暴击率+8%', icon: '💥', rarity: 'rare', effect: 'critRate', value: 8, stat: 'critRate' },
      { id: 'cdmg_up', name: '暴击伤害', description: '暴击伤害+30%', icon: '☠️', rarity: 'rare', effect: 'critDamage', value: 30, stat: 'critDamage' },
      { id: 'hp_up', name: '生命强化', description: '最大生命+50', icon: '❤️', rarity: 'common', effect: 'health', value: 50, stat: 'health' },
      { id: 'def_up', name: '护甲提升', description: '减伤+10%', icon: '🛡️', rarity: 'common', effect: 'defense', value: 10, stat: 'defense' },
      { id: 'range_up', name: '射程扩展', description: '射程+100', icon: '🎯', rarity: 'common', effect: 'range', value: 100, stat: 'range' },
      { id: 'gold_magnet', name: '财富磁铁', description: '金币掉落+50%', icon: '💰', rarity: 'rare', effect: 'goldBonus', value: 50, stat: 'goldBonus' },
      { id: 'exp_boost', name: '快速学习', description: '经验获取+30%', icon: '📚', rarity: 'rare', effect: 'expBonus', value: 30, stat: 'expBonus' },
      { id: 'regen_aura', name: '再生光环', description: '每秒恢复1%生命', icon: '🌿', rarity: 'legendary', effect: 'regenPerSec', value: 1, stat: 'regenPerSec' },
      { id: 'multishot_talent', name: '多重射击', description: '额外发射1发子弹', icon: '🎆', rarity: 'legendary', effect: 'multishot', value: 1, stat: 'special' },
      { id: 'piercing', name: '穿透射击', description: '子弹可穿透1个敌人', icon: '🏹', rarity: 'legendary', effect: 'pierce', value: 1, stat: 'special' },
    ];
  }

  getActiveSkills(): ActiveSkill[] {
    return [...this.activeSkills];
  }

  getItemCooldowns(): { key: string; remaining: number; duration: number; icon: string; name: string; itemId: string }[] {
    return Object.entries(this.itemCooldowns).map(([key, v]) => ({
      key,
      remaining: v.remaining,
      duration: v.duration,
      icon: v.icon,
      name: v.name,
      itemId: v.itemId,
    }));
  }

  // 获取当前生效中的药水/技能效果（用于左上角"持续时间倒计时栏"显示）
  // - 整回合属性药水：remaining=0 表示永久（直到回合结束），duration=0
  // - 定时药水（laser/sweep）：返回剩余持续时间与总时长
  // - 单次药水（flash）：不返回（已即时生效）
  getActivePotionEffects(): { key: string; remaining: number; duration: number; icon: string; name: string; itemId: string; isWave: boolean }[] {
    const result: { key: string; remaining: number; duration: number; icon: string; name: string; itemId: string; isWave: boolean }[] = [];
    // 整回合属性药水
    const waveIconMap: Record<string, { icon: string; name: string; itemId: string }> = {
      attack: { icon: '💪', name: '力量药水', itemId: 'potion_attack' },
      attackSpeed: { icon: '👟', name: '敏捷药水', itemId: 'potion_speed' },
      maxHealth: { icon: '❤️', name: '生命药水', itemId: 'potion_health' },
      critRate: { icon: '💥', name: '暴击药水', itemId: 'potion_crit' },
      defense: { icon: '🛡️', name: '防御药水', itemId: 'potion_defense' },
      range: { icon: '🦅', name: '射程药水', itemId: 'potion_range' },
    };
    for (const [type, value] of Object.entries(this.wavePotionEffects)) {
      if (value === undefined || value === 0) continue;
      const meta = waveIconMap[type];
      if (!meta) continue;
      result.push({
        key: `wave_${type}`,
        remaining: 0,
        duration: 0,
        icon: meta.icon,
        name: meta.name,
        itemId: meta.itemId,
        isWave: true,
      });
    }
    // 分身药水（整回合）
    if (this.wavePotionClone.active) {
      result.push({
        key: 'wave_clone',
        remaining: 0,
        duration: 0,
        icon: '👥',
        name: '分身药水',
        itemId: 'potion_clone',
        isWave: true,
      });
    }
    // 定时药水
    for (const p of this.timedPotionEffects) {
      result.push({
        key: `timed_${p.type}`,
        remaining: p.remaining,
        duration: p.duration,
        icon: p.icon,
        name: p.name,
        itemId: p.itemId,
        isWave: false,
      });
    }
    return result;
  }

  getTalentChoices(): Talent[] {
    return [...this.talentChoices];
  }

  isTalentSelectionOpen(): boolean {
    return this.showTalentSelection;
  }

  getWeather(): WeatherState {
    return { ...this.weather };
  }

  getBuffs(): Buff[] {
    return [...this.buffs];
  }

  getCodexEntries(): CodexEntry[] {
    return [...this.codexEntries];
  }

  getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  getStats(): { totalKills: number; highestWave: number } {
    return { totalKills: this.totalKills, highestWave: this.highestWave };
  }

  resize(width: number, height: number): void {
    const oldPlayerY = this.player.y;

    this.canvas.width = width;
    this.canvas.height = height;
    this.config.canvasWidth = width;
    this.config.canvasHeight = height;
    // 战场固定300px高度，不按比例，保证每个设备一致
    const ARENA_HEIGHT = 300;
    this.config.groundY = height - ARENA_HEIGHT;
    const arenaTop = this.config.groundY;
    const arenaBottom = height;
    const arenaCenter = arenaTop + (arenaBottom - arenaTop) * 0.5;
    this.player.y = arenaCenter - this.player.height / 2;
    this.initStars();
    this.initParallaxLayers();
    this.rebuildBackgroundCache();

    // 修复 resize bug：屏幕高度变化（如浏览器全屏切换）时，
    // 已存在的怪物 y 仍停留在旧战场范围，会挤出战场外；
    // 子弹的 y 也仍停留在旧位置，与重定位后的人物产生错位。
    // 处理：将活跃子弹按人物 y 偏移同步平移；将活跃怪物/掉落物 clamp 到新战场范围内。
    const playerDeltaY = this.player.y - oldPlayerY;

    // 子弹：同步平移 y 与抛物线 startY/targetY，保持与人物的相对位置
    for (const bullet of this.bulletPool.getAll()) {
      if (!bullet.active) continue;
      bullet.y += playerDeltaY;
      const b = bullet as any;
      if (b.startY !== undefined) b.startY += playerDeltaY;
      if (b.targetY !== undefined) b.targetY += playerDeltaY;
    }

    // 怪物：clamp 到新战场范围内（防止从上下两侧挤出）
    const enemyTopLimit = arenaTop + 10;
    const enemyBottomLimit = arenaBottom - 10;
    for (const enemy of this.enemyPool.getAll()) {
      if (!enemy.active) continue;
      // 旧战场无效的怪（y 在新 arena 之外）按比例映射或直接 clamp
      const maxY = enemyBottomLimit - enemy.height;
      if (enemy.y < enemyTopLimit) enemy.y = enemyTopLimit;
      else if (enemy.y > maxY) enemy.y = Math.max(enemyTopLimit, maxY);
    }

    // 掉落物：同样 clamp 到新战场范围
    const dropBottomLimit = arenaBottom - 10;
    for (const drop of this.dropPool.getAll()) {
      if (!drop.active) continue;
      const maxY = dropBottomLimit - drop.height;
      if (drop.y < arenaTop + 10) drop.y = arenaTop + 10;
      else if (drop.y > maxY) drop.y = Math.max(arenaTop + 10, maxY);
    }

    // 粒子和伤害数字：瞬时效果，resize 后位置已无意义，直接清理避免视觉残留
    for (const p of this.particlePool.getAll()) {
      if (p.active) this.particlePool.release(p);
    }
    for (const d of this.damageNumberPool.getAll()) {
      if (d.active) this.damageNumberPool.release(d);
    }
  }

  // 离屏 canvas 缓存静态背景
  private bgCacheCanvas: HTMLCanvasElement | null = null;
  private bgCacheCtx: CanvasRenderingContext2D | null = null;
  // 离屏 canvas 缓存分身静态身体（约150次fillRect合并为1次drawImage）
  private cloneSpriteCache: HTMLCanvasElement | null = null;
  private cloneSpriteOriginX: number = 0;
  private cloneSpriteOriginY: number = 0;

  private rebuildBackgroundCache(): void {
    const { canvasWidth, canvasHeight, groundY } = this.config;
    if (!this.bgCacheCanvas) {
      this.bgCacheCanvas = document.createElement('canvas');
      this.bgCacheCtx = this.bgCacheCanvas.getContext('2d');
    }
    this.bgCacheCanvas!.width = canvasWidth;
    this.bgCacheCanvas!.height = canvasHeight;
    const ctx = this.bgCacheCtx!;
    const px = 2;

    // 深紫黑天空 - 霓虹发光感
    const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGradient.addColorStop(0, '#0A0814');
    skyGradient.addColorStop(0.2, '#131025');
    skyGradient.addColorStop(0.5, '#1A1630');
    skyGradient.addColorStop(0.8, '#1E1A35');
    skyGradient.addColorStop(1, '#242040');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvasWidth, groundY);

    // 远处赛博城市远景：改用贴图渲染（与角色同思路：drawImage + 全息滤镜）
    this.renderCityBgTexture(ctx, canvasWidth, groundY);
    // 大气雾霭
    const hazeGradient = ctx.createLinearGradient(0, groundY - 60, 0, groundY);
    hazeGradient.addColorStop(0, 'rgba(30, 26, 53, 0)');
    hazeGradient.addColorStop(0.5, 'rgba(40, 30, 70, 0.3)');
    hazeGradient.addColorStop(1, 'rgba(60, 40, 90, 0.5)');
    ctx.fillStyle = hazeGradient;
    ctx.fillRect(0, groundY - 60, canvasWidth, 60);

    // 地平线霓虹分隔线
    const horizonGlow = ctx.createLinearGradient(0, groundY - 4, 0, groundY + 6);
    horizonGlow.addColorStop(0, 'rgba(176, 38, 255, 0)');
    horizonGlow.addColorStop(0.4, 'rgba(176, 38, 255, 0.5)');
    horizonGlow.addColorStop(0.5, 'rgba(0, 245, 212, 0.9)');
    horizonGlow.addColorStop(0.6, 'rgba(176, 38, 255, 0.5)');
    horizonGlow.addColorStop(1, 'rgba(176, 38, 255, 0)');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, groundY - 4, canvasWidth, 10);

    // 科技风格地面
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvasHeight);
    groundGradient.addColorStop(0, '#1E1A35');
    groundGradient.addColorStop(0.2, '#181530');
    groundGradient.addColorStop(0.5, '#131025');
    groundGradient.addColorStop(0.8, '#0D0B1A');
    groundGradient.addColorStop(1, '#0A0814');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, canvasWidth, canvasHeight - groundY);

    // 战斗场地平台边界（静态部分，脉冲线动态渲染）
    const platformTop = groundY + 2;
    const platformHeight = canvasHeight - platformTop;
    const edgeWidth = 24;

    ctx.fillStyle = 'rgba(20, 16, 42, 0.6)';
    ctx.fillRect(0, platformTop, canvasWidth, platformHeight);

    const edgeGrad = ctx.createLinearGradient(0, platformTop, 0, platformTop + 4);
    edgeGrad.addColorStop(0, 'rgba(0, 245, 212, 0.7)');
    edgeGrad.addColorStop(1, 'rgba(0, 245, 212, 0)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, platformTop, canvasWidth, 4);

    const leftEdgeGrad = ctx.createLinearGradient(0, platformTop, edgeWidth, platformTop);
    leftEdgeGrad.addColorStop(0, 'rgba(176, 38, 255, 0.5)');
    leftEdgeGrad.addColorStop(0.4, 'rgba(176, 38, 255, 0.2)');
    leftEdgeGrad.addColorStop(1, 'rgba(176, 38, 255, 0)');
    ctx.fillStyle = leftEdgeGrad;
    ctx.fillRect(0, platformTop, edgeWidth, platformHeight);

    const rightEdgeGrad = ctx.createLinearGradient(canvasWidth - edgeWidth, platformTop, canvasWidth, platformTop);
    rightEdgeGrad.addColorStop(0, 'rgba(176, 38, 255, 0)');
    rightEdgeGrad.addColorStop(0.6, 'rgba(176, 38, 255, 0.2)');
    rightEdgeGrad.addColorStop(1, 'rgba(176, 38, 255, 0.5)');
    ctx.fillStyle = rightEdgeGrad;
    ctx.fillRect(canvasWidth - edgeWidth, platformTop, edgeWidth, platformHeight);

    // 地面科技网格线
    this.renderTechGrid(ctx, canvasWidth, groundY, canvasHeight);
  }

  private render(): void {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.config;

    ctx.save();

    if (this.screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.screenShake * 2,
        (Math.random() - 0.5) * this.screenShake * 2
      );
    }

    this.renderBackground();
    this.renderWeatherParticles();
    this.renderRangeIndicator();
    this.renderDrops();
    this.renderPlayer();
    if (this.droneActive) {
      this.renderDrone();
    }
    if (this.getCloneCount() > 0) {
      this.renderClones();
    }
    this.renderBullets();
    this.renderEnemies();
    this.renderModeObjects();
    this.renderParticles();
    this.renderDamageNumbers();
    this.renderLaser();
    this.renderFlashLightning();
    this.renderCrosshair();

    if (this.shieldActive || this.player.invincibleTimer > 0) {
      this.renderShield();
    }

    this.renderWeatherOverlay();

    ctx.restore();
  }

  private renderBackground(): void {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight, groundY } = this.config;

    const px = 2;

    // 优先用离屏缓存（静态背景：天空/城市/雾霭/地平线/地面/平台/网格）
    if (this.bgCacheCanvas) {
      ctx.drawImage(this.bgCacheCanvas, 0, 0);
    } else {
      // 回退：重建缓存
      this.rebuildBackgroundCache();
      if (this.bgCacheCanvas) {
        ctx.drawImage(this.bgCacheCanvas, 0, 0);
      }
    }

    // 地平线脉冲扫描线（动态）
    const pulse = 0.4 + Math.sin(this.animFrame * 0.05) * 0.2;
    ctx.fillStyle = `rgba(0, 245, 212, ${pulse})`;
    ctx.fillRect(0, groundY, canvasWidth, 1);

    // 平台脉冲边缘线（动态，原 renderArenaPlatform 中的脉冲部分）
    const platformTop = groundY + 2;
    const platformPulse = 0.5 + Math.sin(this.animFrame * 0.08) * 0.3;
    ctx.fillStyle = `rgba(0, 245, 212, ${platformPulse})`;
    ctx.fillRect(0, platformTop, canvasWidth, 1);

    // 粒子光点效果
    this.renderTechParticles(ctx, canvasWidth, groundY);

    // 远处霓虹光柱
    this.renderNeonBeams(ctx, canvasWidth, groundY, px);

    // 视差滚动 - 科技废墟建筑（临时禁用，查看贴图背景效果）
    // this.renderParallaxBuildings();
  }

  private renderRuinedSkyline(ctx: CanvasRenderingContext2D, width: number, groundY: number, px: number): void {
    const skylineY = groundY - 40;

    // 远景暗色建筑轮廓
    ctx.fillStyle = '#3D2E20';
    const buildings = [
      { x: 30, w: 40, h: 70 },
      { x: 80, w: 25, h: 45 },
      { x: 115, w: 50, h: 90 },
      { x: 175, w: 30, h: 55 },
      { x: 220, w: 60, h: 100 },
      { x: 290, w: 35, h: 60 },
      { x: 340, w: 45, h: 80 },
      { x: 400, w: 55, h: 110 },
      { x: 470, w: 30, h: 50 },
      { x: 510, w: 65, h: 85 },
      { x: 590, w: 40, h: 65 },
      { x: 645, w: 50, h: 95 },
      { x: 710, w: 35, h: 55 },
      { x: 760, w: 55, h: 75 },
      { x: 830, w: 45, h: 90 },
      { x: 890, w: 60, h: 60 },
      { x: 960, w: 40, h: 80 },
    ];

    for (const b of buildings) {
      const bx = b.x % width;
      const by = skylineY - b.h;
      ctx.fillRect(bx, by, b.w, b.h + 40);

      // 破损效果 - 随机缺口
      ctx.fillStyle = '#8B5E3C';
      if (b.h > 60) {
        ctx.fillRect(bx + b.w * 0.3, by, b.w * 0.4, 10);
        ctx.fillRect(bx + b.w * 0.6, by + 15, b.w * 0.3, 8);
      }
      // 窗户（暗色空洞）
      ctx.fillStyle = '#1A1208';
      for (let wy = by + 8; wy < skylineY - 10; wy += 12) {
        for (let wx = bx + 4; wx < bx + b.w - 6; wx += 10) {
          if (Math.sin(wx * 7 + wy * 3) > 0) {
            ctx.fillRect(wx, wy, 5, 6);
          }
        }
      }
      ctx.fillStyle = '#3D2E20';
    }

    // 近景建筑废墟 - 更大更暗
    ctx.fillStyle = '#2A1F15';
    ctx.fillRect(60, skylineY - 30, 80, 70);
    ctx.fillRect(200, skylineY - 20, 60, 60);
    ctx.fillRect(500, skylineY - 35, 90, 75);
    ctx.fillRect(750, skylineY - 25, 70, 65);

    // 烟囱
    ctx.fillStyle = '#3D2E20';
    ctx.fillRect(140, skylineY - 80, 12, 80);
    ctx.fillRect(540, skylineY - 70, 14, 70);

    // 烟囱顶帽
    ctx.fillStyle = '#4A3520';
    ctx.fillRect(137, skylineY - 82, 18, 4);
    ctx.fillRect(537, skylineY - 72, 20, 4);
  }

  private renderGroundCracks(ctx: CanvasRenderingContext2D, width: number, groundY: number, canvasHeight: number, px: number): void {
    ctx.fillStyle = '#3D362C';
    const crackPattern = [
      { x: 50, y: 10, segs: [[0,0],[8,3],[15,1],[22,6],[28,2]] },
      { x: 180, y: 20, segs: [[0,0],[6,-2],[12,3],[20,1],[26,5]] },
      { x: 350, y: 5, segs: [[0,0],[5,4],[10,1],[18,5],[25,2]] },
      { x: 520, y: 15, segs: [[0,0],[7,2],[14,-1],[20,4],[30,1]] },
      { x: 700, y: 8, segs: [[0,0],[6,3],[11,-2],[18,4],[24,0]] },
      { x: 880, y: 12, segs: [[0,0],[8,1],[14,5],[22,2],[28,4]] },
    ];
    for (const crack of crackPattern) {
      const baseX = crack.x % width;
      const baseY = groundY + crack.y;
      for (const seg of crack.segs) {
        ctx.fillRect(baseX + seg[0], baseY + seg[1], px, px);
      }
    }
  }

  private renderGroundDebris(ctx: CanvasRenderingContext2D, width: number, groundY: number, canvasHeight: number, px: number): void {
    // 碎石
    ctx.fillStyle = '#5C5040';
    const stones = [
      { x: 30, y: 8, s: 3 }, { x: 120, y: 25, s: 2 }, { x: 250, y: 12, s: 4 },
      { x: 380, y: 30, s: 2 }, { x: 470, y: 18, s: 3 }, { x: 600, y: 35, s: 2 },
      { x: 720, y: 10, s: 3 }, { x: 850, y: 22, s: 4 }, { x: 950, y: 15, s: 2 },
    ];
    for (const s of stones) {
      const sx = s.x % width;
      const sy = groundY + s.y;
      ctx.fillRect(sx, sy, s.s * px, s.s * px);
      ctx.fillStyle = '#6B5D4A';
      ctx.fillRect(sx + px, sy, (s.s - 1) * px, (s.s - 1) * px);
      ctx.fillStyle = '#5C5040';
    }

    // 废弃轮胎
    ctx.fillStyle = '#2A1F15';
    ctx.fillRect(160, groundY + 20, 16, 16);
    ctx.fillStyle = '#1A1208';
    ctx.fillRect(164, groundY + 24, 8, 8);
    ctx.fillStyle = '#3D362C';
    ctx.fillRect(780, groundY + 40, 14, 14);
    ctx.fillStyle = '#2A1F15';
    ctx.fillRect(783, groundY + 43, 8, 8);

    // 弹壳
    ctx.fillStyle = '#B8860B';
    for (let i = 0; i < 8; i++) {
      const ex = (90 + i * 130) % width;
      const ey = groundY + 5 + (i * 7) % 30;
      ctx.fillRect(ex, ey, 4, 2);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(ex, ey, 2, 2);
      ctx.fillStyle = '#B8860B';
    }

    // 铁丝网
    ctx.fillStyle = '#6B6B6B';
    const wireY = groundY + 50;
    for (let wx = 0; wx < width; wx += 4) {
      const wy = wireY + Math.sin(wx * 0.1 + this.animFrame * 0.02) * 3;
      ctx.fillRect(wx, wy, 3, 1);
    }
    // 铁丝网柱子
    ctx.fillStyle = '#4A4A4A';
    for (let wx = 0; wx < width; wx += 80) {
      ctx.fillRect(wx, wireY - 10, 3, 20);
    }
  }

  private renderChimneySmoke(ctx: CanvasRenderingContext2D, width: number, groundY: number, px: number): void {
    const smokeAlpha = 0.3;
    const chimneyXs = [146, 547];
    for (const cx of chimneyXs) {
      for (let s = 0; s < 5; s++) {
        const offset = (this.animFrame * 0.5 + s * 12) % 60;
        const sx = cx + Math.sin(offset * 0.1 + s) * 8;
        const sy = groundY - 82 - offset;
        const size = 6 + s * 2;
        ctx.fillStyle = `rgba(60, 45, 30, ${smokeAlpha - s * 0.05})`;
        ctx.fillRect(sx, sy, size, size * 0.6);
      }
    }
  }

  private renderParallaxBuildings(): void {
    const ctx = this.ctx;
    const { canvasWidth, groundY } = this.config;
    // 霓虹紫主题色 - 远→近渐变（更深的紫黑，配合大气透视）
    // 远层最暗最朦胧，中层次之，近层最清晰
    const layerColors = ['#0F0A1F', '#170F2A', '#1F1538'];
    const layerAlphas = [0.55, 0.75, 0.95]; // 大气透视：远处更透明
    const windowColors = ['#B026FF', '#7A1FBF', '#9C27B0'];

    for (let layerIdx = this.parallaxLayers.length - 1; layerIdx >= 0; layerIdx--) {
      const layer = this.parallaxLayers[layerIdx];
      const color = layerColors[layerIdx];
      const alpha = layerAlphas[layerIdx];
      const winColor = windowColors[layerIdx];

      for (let pass = 0; pass < 3; pass++) {
        const passOffset = pass * canvasWidth * 2;
        for (const b of layer.buildings) {
          const bx = b.x - layer.offset + passOffset;
          if (bx > canvasWidth + 100 || bx + b.w < -100) continue;
          // 建筑底部不延伸到地面以下 - 保持城市与战场分离
          const by = groundY - b.h - (layerIdx * 6);
          const drawH = b.h;

          // 建筑主体 - 应用大气透视透明度
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.fillRect(bx, by, b.w, drawH);

          // 建筑顶部霓虹边缘光
          ctx.fillStyle = winColor;
          ctx.globalAlpha = alpha * 0.5;
          ctx.fillRect(bx, by, b.w, 1);

          // 霓虹窗户 - 远处更稀疏暗淡
          ctx.globalAlpha = alpha * 0.7;
          const winStep = layerIdx === 0 ? 8 : (layerIdx === 1 ? 7 : 6);
          for (let wy = by + 6; wy < by + drawH - 4; wy += winStep) {
            for (let wx = bx + 3; wx < bx + b.w - 3; wx += winStep - 1) {
              const flicker = Math.sin(this.animFrame * 0.04 + wx * 0.3 + wy * 0.2);
              if (flicker > -0.2) {
                const intensity = 0.3 + flicker * 0.3;
                ctx.globalAlpha = alpha * intensity;
                ctx.fillStyle = winColor;
                ctx.fillRect(wx, wy, 2, 3);
              }
            }
          }

          // 高层建筑添加天线（仅近层）
          if (layerIdx < 2 && b.h > 60) {
            ctx.globalAlpha = alpha * 0.6;
            ctx.strokeStyle = winColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx + b.w / 2, by);
            ctx.lineTo(bx + b.w / 2, by - 10 - layerIdx * 4);
            ctx.stroke();
            // 闪烁顶灯
            ctx.fillStyle = '#FF0080';
            ctx.globalAlpha = (0.5 + Math.sin(this.animFrame * 0.08 + bx) * 0.4) * alpha;
            ctx.fillRect(bx + b.w / 2 - 1, by - 12 - layerIdx * 4, 2, 2);
          }
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  private renderWeatherParticles(): void {
    if (this.weather.type === 'clear' || this.weatherParticles.length === 0) return;

    const ctx = this.ctx;
    const { canvasWidth, canvasHeight, groundY } = this.config;
    let color = '#ffffff';

    switch (this.weather.type) {
      case 'rain': color = '#87CEEB'; break;
      case 'acid_rain': color = '#7CFC00'; break;
      case 'sandstorm': color = '#D2B48C'; break;
      case 'thunderstorm': color = '#ADD8E6'; break;
      case 'snow': color = '#FFFFFF'; break;
      case 'radiation': color = '#9932CC'; break;
      case 'fog': color = '#C0C0C0'; break;
      case 'heat_wave': color = '#FF6347'; break;
    }

    ctx.fillStyle = color;
    ctx.globalAlpha = this.weather.intensity * 0.7;

    for (const p of this.weatherParticles) {
      if (this.weather.type === 'rain' || this.weather.type === 'acid_rain' || this.weather.type === 'thunderstorm') {
        ctx.fillRect(p.x, p.y, 1, p.size * 3);
      } else if (this.weather.type === 'snow') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.weather.type === 'fog') {
        ctx.globalAlpha = this.weather.intensity * 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = this.weather.intensity * 0.7;
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }

    const density = Math.floor(canvasWidth / 15);
    for (let i = 0; i < density; i++) {
      const x = (i * 23 + this.animFrame * 2) % canvasWidth;
      const y = (this.animFrame * 3 + i * 17) % canvasHeight;
      const alpha = 0.15 + Math.sin(this.animFrame * 0.05 + i) * 0.1;

      ctx.globalAlpha = this.weather.intensity * alpha;
      ctx.fillStyle = color;

      if (this.weather.type === 'rain' || this.weather.type === 'acid_rain' || this.weather.type === 'thunderstorm') {
        ctx.fillRect(x, y, 1, 4 + (i % 3));
      } else if (this.weather.type === 'sandstorm') {
        ctx.fillRect(x, y, 3 + (i % 4), 2);
      } else if (this.weather.type === 'snow') {
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      } else if (this.weather.type === 'fog') {
        ctx.globalAlpha = this.weather.intensity * alpha * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, 4 + (i % 5), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    if (this.weather.type === 'thunderstorm' && Math.random() < 0.003) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    ctx.globalAlpha = 1;
  }

  private renderWeatherOverlay(): void {
    if (this.weather.type === 'clear' || this.weather.intensity <= 0) return;

    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.config;
    let overlayColor = '';
    
    switch (this.weather.type) {
      case 'rain':
        overlayColor = `rgba(100, 149, 237, ${this.weather.intensity * 0.08})`;
        break;
      case 'acid_rain':
        overlayColor = `rgba(127, 255, 0, ${this.weather.intensity * 0.08})`;
        break;
      case 'sandstorm':
        overlayColor = `rgba(210, 180, 140, ${this.weather.intensity * 0.18})`;
        break;
      case 'thunderstorm':
        overlayColor = `rgba(50, 50, 100, ${this.weather.intensity * 0.12})`;
        break;
      case 'snow':
        overlayColor = `rgba(200, 220, 255, ${this.weather.intensity * 0.1})`;
        break;
      case 'radiation':
        overlayColor = `rgba(153, 50, 204, ${this.weather.intensity * 0.1})`;
        break;
      case 'fog':
        overlayColor = `rgba(180, 180, 180, ${this.weather.intensity * 0.2})`;
        break;
      case 'heat_wave':
        overlayColor = `rgba(255, 100, 50, ${this.weather.intensity * 0.08})`;
        break;
    }

    if (overlayColor) {
      ctx.fillStyle = overlayColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  }

  private renderRangeIndicator(): void {
    const ctx = this.ctx;
    let weatherRangeMult = 1;
    switch (this.weather.type) {
      case 'sandstorm': weatherRangeMult = 2 / 3; break;
      case 'fog': weatherRangeMult = 0.7; break;
    }
    // 需求 #4：受debuff时射程最低值为战场25%宽度
    const battlefieldWidthRender = this.config.canvasWidth - this.config.playerStartX;
    const minRangeRender = battlefieldWidthRender * 0.25;
    // 需求 #8：射程受debuff影响
    const rangeDebuffMultRender = this.getPlayerDebuffMultiplier('rangeDown');
    const effectiveRange = Math.max(minRangeRender, this.player.range * weatherRangeMult * rangeDebuffMultRender);
    ctx.strokeStyle = 'rgba(255, 100, 50, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(this.player.x + effectiveRange, this.config.groundY);
    ctx.lineTo(this.player.x + effectiveRange, this.config.canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private renderPlayer(): void {
    const ctx = this.ctx;
    const { x, y } = this.player;

    const isShooting = this.muzzleFlashTimer > 0;
    const recoil = isShooting ? -1.5 : 0;

    ctx.save();
    ctx.translate(x, y);

    // 上下漂浮效果（与主界面 hero-breathe 节奏一致）
    const floatOffset = Math.sin(this.animFrame * 0.06) * 1.5;
    ctx.translate(0, floatOffset);

    // 地面阴影
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(20, 32, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 底部能量投影（与主界面 hero-aura 一致）
    const auraPulse = 0.6 + Math.sin(this.animFrame * 0.08) * 0.25;
    const auraGrad = ctx.createRadialGradient(20, 30, 0, 20, 30, 30);
    auraGrad.addColorStop(0, `rgba(0, 245, 212, ${0.35 * auraPulse})`);
    auraGrad.addColorStop(0.4, `rgba(176, 38, 255, ${0.15 * auraPulse})`);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(-15, 15, 70, 30);

    // 战士海报绘制（与主界面同款图，已抠图透明背景）
    if (this.warriorHeroKnockout) {
      const imgW = 56;
      const imgH = 76;
      const imgX = 20 - imgW / 2;        // 水平居中于 x=20（与原像素人物中心一致）
      const imgY = 3 - imgH / 2 + recoil; // 垂直居中于 y=3，加射击后坐力

      // 全息发光底层（模糊+提亮，类似主界面发光强化层）— 水平翻转使人物朝向右前方
      ctx.save();
      ctx.filter = 'blur(3px) brightness(1.3)';
      ctx.globalAlpha = 0.4;
      ctx.scale(-1, 1);
      ctx.drawImage(this.warriorHeroKnockout, -imgX - imgW, imgY, imgW, imgH);
      ctx.restore();

      // 主体（带全息滤镜：亮度+饱和度+霓虹发光投影）— 水平翻转
      ctx.save();
      ctx.filter = 'brightness(1.08) saturate(1.12) drop-shadow(0 0 8px rgba(77, 122, 232, 0.5)) drop-shadow(0 0 14px rgba(176, 38, 255, 0.3))';
      ctx.globalAlpha = 0.95;
      ctx.scale(-1, 1);
      ctx.drawImage(this.warriorHeroKnockout, -imgX - imgW, imgY, imgW, imgH);
      ctx.restore();

      // 全息扫描线（椭圆形扫描，与人物轮廓弧度对应）
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(20, 3, imgW / 2, imgH / 2, 0, 0, Math.PI * 2);
      ctx.clip();
      const scanY = 3 - imgH / 2 + ((this.animFrame * 0.5) % (imgH + 30));
      const scanGrad = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
      scanGrad.addColorStop(0, 'rgba(0, 245, 212, 0)');
      scanGrad.addColorStop(0.5, 'rgba(0, 245, 212, 0.4)');
      scanGrad.addColorStop(1, 'rgba(0, 245, 212, 0)');
      ctx.fillStyle = scanGrad;
      // 沿椭圆宽度绘制扫描带：水平宽度随 y 位置变化（椭圆截面）
      {
        const cy = 3;
        const ry = imgH / 2;
        const rx = imgW / 2;
        // 当前 y 在椭圆内的水平半弦
        const dy = scanY - cy;
        const k = Math.max(0, 1 - (dy * dy) / (ry * ry));
        const halfW = rx * Math.sqrt(k);
        ctx.fillRect(20 - halfW, scanY - 12, halfW * 2, 24);
      }
      ctx.restore();

      // 全息网格叠加（横向细线，与主界面背景网格一致，沿椭圆裁剪）
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(20, 3, imgW / 2, imgH / 2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.08)';
      ctx.lineWidth = 0.4;
      for (let gy = 3 - imgH / 2; gy < 3 + imgH / 2; gy += 3) {
        ctx.beginPath();
        ctx.moveTo(imgX, gy);
        ctx.lineTo(imgX + imgW, gy);
        ctx.stroke();
      }
      ctx.restore();

      // 边缘发光脉冲（弱化：仅在人物轮廓内壁的柔和内发光，不画明显描边）
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const edgePulse = 0.5 + Math.sin(this.animFrame * 0.07) * 0.2;
      // 内发光：从椭圆边缘向内的径向渐变
      const edgeGrad = ctx.createRadialGradient(20, 3, Math.min(imgW, imgH) * 0.35, 20, 3, Math.max(imgW, imgH) * 0.55);
      edgeGrad.addColorStop(0, 'rgba(0, 245, 212, 0)');
      edgeGrad.addColorStop(0.7, `rgba(0, 245, 212, ${edgePulse * 0.08})`);
      edgeGrad.addColorStop(1, `rgba(176, 38, 255, ${edgePulse * 0.15})`);
      ctx.fillStyle = edgeGrad;
      ctx.beginPath();
      ctx.ellipse(20, 3, imgW / 2, imgH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // === 朝向前方（右）的能量武器 - 像素绘制 ===
      // 枪口位置与子弹生成点一致：(44, 10)
      this.drawEnergyWeapon(ctx, isShooting, recoil);
    } else {
      // 后备：图片未加载完成时使用原像素绘制
      this.drawFutureSoldierBody(ctx, recoil, isShooting);
    }

    // 枪口火焰（与子弹生成位置一致：player.x + 44.25, player.y + 9.75 → 此处坐标 (44, 10)）
    if (isShooting) {
      const flashX = 44;
      const flashY = 10;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      // 外层紫色光晕
      ctx.fillStyle = 'rgba(176, 38, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(flashX + 5, flashY, 9, 0, Math.PI * 2);
      ctx.fill();
      // 中层青色光晕
      ctx.fillStyle = 'rgba(0, 245, 212, 0.7)';
      ctx.beginPath();
      ctx.arc(flashX + 2, flashY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      // 内层金色核心
      ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.beginPath();
      ctx.arc(flashX, flashY, 3, 0, Math.PI * 2);
      ctx.fill();
      // 最内层白色高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(flashX, flashY, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // 横向能量射线
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(flashX + 2, flashY);
      ctx.lineTo(flashX + 12, flashY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // 朝向前方（右）的能量武器：从角色右侧伸出，枪口对准子弹生成点 (44, 10)
  // 像素风绘制，与主界面蓝金未来战士配色一致
  private drawEnergyWeapon(ctx: CanvasRenderingContext2D, isShooting: boolean, recoil: number): void {
    const px = 1.0;
    // 后坐力：射击时武器整体向左回缩
    const kickback = isShooting ? -1.5 : 0;

    ctx.save();
    ctx.translate(kickback, 0);

    // === 颜色常量（与 drawFutureSoldierBody 一致）===
    const C_DEEP_BLUE = '#0F1F4E';
    const C_COBALT = '#1A2A6E';
    const C_JEWEL = '#2A4ABE';
    const C_BRIGHT_BLUE = '#4D7AE8';
    const C_GOLD = '#FFD700';
    const C_GOLD_DARK = '#B8860B';
    const C_NEON_CYAN = '#00F5D4';
    const C_ELECTRIC = '#00B4FF';
    const C_SILVER = '#C0C0C0';
    const C_SILVER_DARK = '#707070';
    const C_PURPLE = '#B026FF';
    const C_WHITE = '#E0E0FF';
    const C_BLACK = '#10101E';
    const C_LEATHER = '#6B4423';

    // 武器锚点：从角色右手位置 (28, 9) 开始，向右延伸到枪口 (44, 10)
    const handX = 28 * px;
    const handY = 9 * px;
    const muzzleX = 44 * px;
    const muzzleY = 10 * px;

    // === 握把 + 手部 ===
    // 手部（露出握把的部分）
    ctx.fillStyle = C_LEATHER;
    ctx.fillRect(handX, handY + 1 * px, 3 * px, 3 * px);
    ctx.fillStyle = '#5A3818';
    ctx.fillRect(handX, handY + 1 * px, 3 * px, 0.5 * px);
    // 手指（金色机械手套）
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(handX + 0.5 * px, handY + 1.5 * px, 2.5 * px, 0.4 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(handX + 0.5 * px, handY + 1.5 * px, 2.5 * px, 0.15 * px);
    // 手腕装甲（钴蓝+金边）
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(handX - 1.5 * px, handY + 0.5 * px, 2 * px, 4 * px);
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(handX - 1.5 * px, handY + 0.5 * px, 0.5 * px, 4 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(handX - 1.5 * px, handY + 0.5 * px, 2 * px, 0.15 * px);
    // 手腕能量线（霓虹青）
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(handX - 1.2 * px, handY + 2 * px, 1.5 * px, 0.2 * px);
    ctx.globalAlpha = 1;

    // === 武器主体（能量步枪）===
    const bodyX = handX + 2 * px;
    const bodyY = handY - 0.5 * px;
    const bodyW = 12 * px;
    const bodyH = 3 * px;

    // 主体外壳（深蓝）
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
    // 主体上层（钴蓝）
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(bodyX, bodyY, bodyW, bodyH * 0.55);
    // 主体高光（宝石蓝）
    ctx.fillStyle = C_JEWEL;
    ctx.fillRect(bodyX, bodyY, bodyW, bodyH * 0.2);
    // 主体亮蓝边缘
    ctx.fillStyle = C_BRIGHT_BLUE;
    ctx.fillRect(bodyX, bodyY, bodyW, 0.15 * px);
    // 主体底部金边
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(bodyX, bodyY + bodyH - 0.15 * px, bodyW, 0.15 * px);

    // 能量核心（中央紫宝石+白点）
    const coreX = bodyX + bodyW * 0.45;
    const coreY = bodyY + bodyH * 0.35;
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(coreX, coreY, 1.5 * px, 1.5 * px);
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(coreX + 0.2 * px, coreY + 0.2 * px, 0.5 * px, 0.5 * px);
    // 核心两侧能量线（霓虹青）
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(bodyX + 0.5 * px, bodyY + bodyH * 0.55, bodyW * 0.35, 0.2 * px);
    ctx.fillRect(coreX + 2 * px, bodyY + bodyH * 0.55, bodyW * 0.35, 0.2 * px);
    ctx.globalAlpha = 1;

    // 武器分段金线（3道接缝）
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(bodyX + bodyW * 0.2, bodyY, 0.12 * px, bodyH);
    ctx.fillRect(bodyX + bodyW * 0.65, bodyY, 0.12 * px, bodyH);
    ctx.fillRect(bodyX + bodyW * 0.85, bodyY, 0.12 * px, bodyH);

    // 顶部瞄准镜（金色+紫水晶）
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(bodyX + bodyW * 0.55, bodyY - 1.5 * px, 2.5 * px, 1.5 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(bodyX + bodyW * 0.55, bodyY - 1.5 * px, 2.5 * px, 0.2 * px);
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(bodyX + bodyW * 0.6, bodyY - 1.2 * px, 1.5 * px, 0.9 * px);
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(bodyX + bodyW * 0.65, bodyY - 1.1 * px, 0.4 * px, 0.4 * px);
    // 瞄准镜顶部小红点（激光瞄准器）
    ctx.fillStyle = '#FF3B3B';
    ctx.globalAlpha = 0.6 + Math.sin(this.animFrame * 0.3) * 0.4;
    ctx.fillRect(bodyX + bodyW * 0.65, bodyY - 1.7 * px, 0.4 * px, 0.4 * px);
    ctx.globalAlpha = 1;

    // 底部弹夹（向下突出）
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(bodyX + bodyW * 0.25, bodyY + bodyH, 2.5 * px, 2 * px);
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(bodyX + bodyW * 0.25, bodyY + bodyH, 2.5 * px, 0.3 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(bodyX + bodyW * 0.25, bodyY + bodyH, 2.5 * px, 0.15 * px);
    // 弹夹能量指示条（霓虹青，满电状态）
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(bodyX + bodyW * 0.28, bodyY + bodyH + 0.5 * px, 0.4 * px, 1.2 * px);
    ctx.globalAlpha = 1;

    // === 枪管（向右延伸到枪口）===
    const barrelX = bodyX + bodyW;
    const barrelY = bodyY + bodyH * 0.3;
    const barrelW = (muzzleX - barrelX) + 1 * px;
    const barrelH = bodyH * 0.4;

    // 枪管主体（银色）
    ctx.fillStyle = C_SILVER_DARK;
    ctx.fillRect(barrelX, barrelY, barrelW, barrelH);
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(barrelX, barrelY, barrelW, barrelH * 0.4);
    // 枪管金边
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(barrelX, barrelY, barrelW, 0.1 * px);
    // 枪管散热孔（3道）
    ctx.fillStyle = C_BLACK;
    ctx.fillRect(barrelX + barrelW * 0.2, barrelY + barrelH * 0.3, 0.3 * px, barrelH * 0.4);
    ctx.fillRect(barrelX + barrelW * 0.5, barrelY + barrelH * 0.3, 0.3 * px, barrelH * 0.4);
    ctx.fillRect(barrelX + barrelW * 0.8, barrelY + barrelH * 0.3, 0.3 * px, barrelH * 0.4);
    // 枪管能量线（电光蓝）
    ctx.fillStyle = C_ELECTRIC;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(barrelX, barrelY + barrelH * 0.7, barrelW, 0.15 * px);
    ctx.globalAlpha = 1;

    // === 枪口（枪管末端，子弹发射点）===
    ctx.fillStyle = C_BLACK;
    ctx.fillRect(muzzleX, muzzleY - 1 * px, 1.5 * px, 2 * px);
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(muzzleX, muzzleY - 1 * px, 1.5 * px, 0.3 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(muzzleX, muzzleY - 1 * px, 1.5 * px, 0.15 * px);
    // 枪口内壁能量光辉（待发射状态）
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.5 + Math.sin(this.animFrame * 0.2) * 0.2;
    ctx.fillRect(muzzleX + 0.3 * px, muzzleY - 0.5 * px, 0.8 * px, 1 * px);
    ctx.globalAlpha = 1;

    // === 射击时的能量充能效果 ===
    if (isShooting) {
      // 枪管充能光辉
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(0, 245, 212, 0.4)`;
      ctx.fillRect(barrelX, barrelY - 0.5 * px, barrelW, barrelH + 1 * px);
      // 能量核心闪光
      ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
      ctx.fillRect(coreX - 0.5 * px, coreY - 0.5 * px, 2.5 * px, 2.5 * px);
      ctx.restore();
    }

    ctx.restore();
  }

  // 蓝金未来战士造型（v3 重新设计）：
  // 姿态：站立悬浮 + 上身略后仰 + 双手向前平举双枪（射击姿态）
  // 背部：喷气式设备（双涡轮引擎）代替翅膀
  // 主色：深海蓝主体 + 钴蓝装甲 + 金黄装饰 + 霓虹青能量线
  // px=2.25 像素单位；recoil=射击后坐力偏移；isShooting=是否射击中
  private drawFutureSoldierBody(ctx: CanvasRenderingContext2D, recoil: number, isShooting: boolean): void {
    const px = 2.25;

    // === 颜色常量（22 色保留） ===
    const C_DEEP_BLUE = '#0F1F4E';
    const C_COBALT = '#1A2A6E';
    const C_JEWEL = '#2A4ABE';
    const C_BRIGHT_BLUE = '#4D7AE8';
    const C_GOLD = '#FFD700';
    const C_GOLD_DARK = '#B8860B';
    const C_GOLD_LIGHT = '#FFE680';
    const C_BRONZE = '#8B6914';
    const C_NEON_CYAN = '#00F5D4';
    const C_ELECTRIC = '#00B4FF';
    const C_WHITE = '#E0E0FF';
    const C_SILVER = '#C0C0C0';
    const C_SILVER_DARK = '#707070';
    const C_PURPLE = '#B026FF';
    const C_DARK_PURPLE = '#6B3FAA';
    const C_RED = '#FF3B3B';
    const C_DARK_RED = '#8B1A1A';
    const C_GREEN = '#00FF7F';
    const C_ORANGE = '#FF8C00';
    const C_PINK = '#FF69B4';
    const C_LEATHER = '#6B4423';
    const C_LEATHER_DARK = '#3D2914';
    const C_BLACK = '#10101E';

    // === 整体姿态：悬浮站立射击姿态，上身略后仰 ===
    ctx.save();
    ctx.rotate(Math.PI / 60); // 后仰约3度，从容射击感

    // === 双腿（并列站立，略分腿，悬浮）===
    ctx.save();
    ctx.translate(0, recoil);
    ctx.translate(0, -1.2 * px); // 整体悬浮上移

    // === 左腿（后侧，略外撇）===
    ctx.save();
    ctx.translate(6.5 * px, 9.5 * px);
    ctx.rotate(-Math.PI / 36); // 外撇5度

    // 左腿大腿分段装甲（4段更明显）
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(0, 0, 3 * px, 5.5 * px);
    // 大腿暗部
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(0, 0.5 * px, 0.8 * px, 5 * px);
    // 大腿高光
    ctx.fillStyle = C_JEWEL;
    ctx.fillRect(2.2 * px, 0.5 * px, 0.8 * px, 5 * px);
    // 大腿亮蓝边缘
    ctx.fillStyle = C_BRIGHT_BLUE;
    ctx.fillRect(2.9 * px, 0.5 * px, 0.15 * px, 5 * px);
    // 大腿分段金边（3道接缝）
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(0, 1.5 * px, 3 * px, 0.15 * px);
    ctx.fillRect(0, 3 * px, 3 * px, 0.15 * px);
    ctx.fillRect(0, 4.3 * px, 3 * px, 0.15 * px);
    // 大腿绑带（皮革+金扣）
    ctx.fillStyle = C_LEATHER_DARK;
    ctx.fillRect(0, 0.8 * px, 3 * px, 0.4 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(2.5 * px, 0.85 * px, 0.4 * px, 0.3 * px);
    // 关节铆钉（×3）
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(0.3 * px, 1.55 * px, 0.3 * px, 0.3 * px);
    ctx.fillRect(0.3 * px, 3.05 * px, 0.3 * px, 0.3 * px);
    ctx.fillRect(0.3 * px, 4.35 * px, 0.3 * px, 0.3 * px);
    ctx.fillStyle = C_SILVER_DARK;
    ctx.fillRect(0.3 * px, 1.8 * px, 0.3 * px, 0.1 * px);
    ctx.fillRect(0.3 * px, 3.3 * px, 0.3 * px, 0.1 * px);
    ctx.fillRect(0.3 * px, 4.6 * px, 0.3 * px, 0.1 * px);

    // 左腿护膝（金色立体）
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(2.3 * px, 2.8 * px, 1.9 * px, 1.7 * px);
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(2.3 * px, 4.2 * px, 1.9 * px, 0.3 * px);
    ctx.fillStyle = C_GOLD_LIGHT;
    ctx.fillRect(2.4 * px, 2.9 * px, 0.5 * px, 0.4 * px);
    // 护膝中心紫宝石
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(2.9 * px, 3.1 * px, 0.7 * px, 0.7 * px);
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(2.95 * px, 3.15 * px, 0.2 * px, 0.2 * px);
    // 护膝侧边能量点（电光蓝）
    ctx.fillStyle = C_ELECTRIC;
    ctx.fillRect(3.7 * px, 3.3 * px, 0.3 * px, 0.3 * px);

    // === 左小腿护甲（独立分段，钴蓝+金边）===
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(0.5 * px, 5.5 * px, 3 * px, 2 * px);
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(0.5 * px, 5.7 * px, 0.6 * px, 1.8 * px);
    ctx.fillStyle = C_JEWEL;
    ctx.fillRect(3 * px, 5.7 * px, 0.5 * px, 1.8 * px);
    // 小腿金边分段
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(0.5 * px, 6.3 * px, 3 * px, 0.12 * px);
    // 小腿能量线（霓虹青）
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(1.2 * px, 5.8 * px, 1.5 * px, 0.2 * px);
    ctx.globalAlpha = 1;
    // 小腿护甲铆钉
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(0.8 * px, 6.6 * px, 0.25 * px, 0.25 * px);
    ctx.fillStyle = C_SILVER_DARK;
    ctx.fillRect(0.8 * px, 6.8 * px, 0.25 * px, 0.08 * px);

    // 左脚战术靴（增高鞋面，更立体）
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(-0.5 * px, 7.5 * px, 4.5 * px, 2 * px);
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(0, 5.5 * px, 3.5 * px, 2.2 * px);
    // 靴金边
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(0, 5.5 * px, 3.5 * px, 0.15 * px);
    ctx.fillRect(0, 6.7 * px, 3.5 * px, 0.12 * px);
    // 靴底发光（霓虹青，加宽）
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-0.5 * px, 9.3 * px, 4.5 * px, 0.4 * px);
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-0.5 * px, 9.7 * px, 4.5 * px, 0.6 * px);
    ctx.globalAlpha = 1;
    // 后跟
    ctx.fillStyle = C_BLACK;
    ctx.fillRect(-1 * px, 7.5 * px, 0.8 * px, 1.8 * px);
    // 靴面金线（2道）
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(0.5 * px, 6.1 * px, 2.5 * px, 0.18 * px);
    ctx.fillRect(0.5 * px, 7 * px, 2.5 * px, 0.12 * px);
    // 靴扣（银色 + 紫宝石装饰）
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(2.8 * px, 5.8 * px, 0.5 * px, 0.5 * px);
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(2.85 * px, 5.85 * px, 0.4 * px, 0.4 * px);
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(2.9 * px, 5.9 * px, 0.15 * px, 0.15 * px);

    ctx.restore();

    // === 右腿（前侧，略外撇）===
    ctx.save();
    ctx.translate(9 * px, 9.5 * px);
    ctx.rotate(Math.PI / 36); // 外撇5度

    // 右腿大腿分段装甲（4段）
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(0, 0, 3 * px, 5.5 * px);
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(0, 0.5 * px, 0.8 * px, 5 * px);
    ctx.fillStyle = C_JEWEL;
    ctx.fillRect(2.2 * px, 0.5 * px, 0.8 * px, 5 * px);
    ctx.fillStyle = C_BRIGHT_BLUE;
    ctx.fillRect(2.9 * px, 0.5 * px, 0.15 * px, 5 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(0, 1.5 * px, 3 * px, 0.15 * px);
    ctx.fillRect(0, 3 * px, 3 * px, 0.15 * px);
    ctx.fillRect(0, 4.3 * px, 3 * px, 0.15 * px);
    ctx.fillStyle = C_LEATHER_DARK;
    ctx.fillRect(0, 0.8 * px, 3 * px, 0.4 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(2.5 * px, 0.85 * px, 0.4 * px, 0.3 * px);
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(0.3 * px, 1.55 * px, 0.3 * px, 0.3 * px);
    ctx.fillRect(0.3 * px, 3.05 * px, 0.3 * px, 0.3 * px);
    ctx.fillRect(0.3 * px, 4.35 * px, 0.3 * px, 0.3 * px);
    ctx.fillStyle = C_SILVER_DARK;
    ctx.fillRect(0.3 * px, 1.8 * px, 0.3 * px, 0.1 * px);
    ctx.fillRect(0.3 * px, 3.3 * px, 0.3 * px, 0.1 * px);
    ctx.fillRect(0.3 * px, 4.6 * px, 0.3 * px, 0.1 * px);

    // 右腿护膝
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(2.3 * px, 2.8 * px, 1.9 * px, 1.7 * px);
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(2.3 * px, 4.2 * px, 1.9 * px, 0.3 * px);
    ctx.fillStyle = C_GOLD_LIGHT;
    ctx.fillRect(2.4 * px, 2.9 * px, 0.5 * px, 0.4 * px);
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(2.9 * px, 3.1 * px, 0.7 * px, 0.7 * px);
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(2.95 * px, 3.15 * px, 0.2 * px, 0.2 * px);
    ctx.fillStyle = C_ELECTRIC;
    ctx.fillRect(3.7 * px, 3.3 * px, 0.3 * px, 0.3 * px);

    // === 右小腿护甲（独立分段）===
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(0.5 * px, 5.5 * px, 3 * px, 2 * px);
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(0.5 * px, 5.7 * px, 0.6 * px, 1.8 * px);
    ctx.fillStyle = C_JEWEL;
    ctx.fillRect(3 * px, 5.7 * px, 0.5 * px, 1.8 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(0.5 * px, 6.3 * px, 3 * px, 0.12 * px);
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(1.2 * px, 5.8 * px, 1.5 * px, 0.2 * px);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(0.8 * px, 6.6 * px, 0.25 * px, 0.25 * px);
    ctx.fillStyle = C_SILVER_DARK;
    ctx.fillRect(0.8 * px, 6.8 * px, 0.25 * px, 0.08 * px);

    // 右脚战术靴
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(-0.5 * px, 7.5 * px, 4.5 * px, 2 * px);
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(0, 5.5 * px, 3.5 * px, 2.2 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(0, 5.5 * px, 3.5 * px, 0.15 * px);
    ctx.fillRect(0, 6.7 * px, 3.5 * px, 0.12 * px);
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-0.5 * px, 9.3 * px, 4.5 * px, 0.4 * px);
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-0.5 * px, 9.7 * px, 4.5 * px, 0.6 * px);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C_BLACK;
    ctx.fillRect(-1 * px, 7.5 * px, 0.8 * px, 1.8 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(0.5 * px, 6.1 * px, 2.5 * px, 0.18 * px);
    ctx.fillRect(0.5 * px, 7 * px, 2.5 * px, 0.12 * px);
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(2.8 * px, 5.8 * px, 0.5 * px, 0.5 * px);
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(2.85 * px, 5.85 * px, 0.4 * px, 0.4 * px);
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(2.9 * px, 5.9 * px, 0.15 * px, 0.15 * px);

    ctx.restore();

    // === 腰带（皮革+金色扣+2侧袋+2紫宝石）===
    ctx.fillStyle = C_LEATHER;
    ctx.fillRect(6 * px, 8.5 * px, 6 * px, 1.2 * px);
    ctx.fillStyle = C_LEATHER_DARK;
    ctx.fillRect(6 * px, 9.4 * px, 6 * px, 0.3 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(6 * px, 8.5 * px, 6 * px, 0.15 * px);
    // 腰带扣
    ctx.fillRect(8.5 * px, 8.3 * px, 1 * px, 1.6 * px);
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(8.5 * px, 9.7 * px, 1 * px, 0.2 * px);
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(8.7 * px, 8.6 * px, 0.6 * px, 0.7 * px);
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(8.8 * px, 8.7 * px, 0.2 * px, 0.2 * px);
    // 左侧袋
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(6 * px, 8.7 * px, 1.5 * px, 1 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(6 * px, 8.7 * px, 1.5 * px, 0.15 * px);
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(6.5 * px, 9 * px, 0.5 * px, 0.4 * px);
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(6.7 * px, 9.1 * px, 0.3 * px, 0.3 * px);
    // 右侧袋
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(10.5 * px, 8.7 * px, 1.5 * px, 1 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(10.5 * px, 8.7 * px, 1.5 * px, 0.15 * px);
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(11 * px, 9 * px, 0.5 * px, 0.4 * px);
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(11.2 * px, 9.1 * px, 0.3 * px, 0.3 * px);

    ctx.restore(); // 腿部recoil结束

    // === 上半身（射击时后坐力）===
    ctx.save();
    ctx.translate(0, recoil);

    // === 背部喷气式设备（双涡轮引擎，代替翅膀）===
    // 中央背板（深海蓝，承载双涡轮）
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(5 * px, 3 * px, 4 * px, 5 * px);
    // 背板金边
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(5 * px, 3 * px, 4 * px, 0.2 * px);
    ctx.fillRect(5 * px, 7.8 * px, 4 * px, 0.2 * px);
    // 背板分隔金线
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(6.9 * px, 3 * px, 0.2 * px, 5 * px);

    // === 左涡轮引擎 ===
    ctx.save();
    ctx.translate(5 * px, 5.5 * px); // 左涡轮中心

    // 引擎外壳（钴蓝）
    ctx.fillStyle = C_COBALT;
    ctx.beginPath();
    ctx.arc(0, 0, 1.8 * px, 0, Math.PI * 2);
    ctx.fill();
    // 引擎金边
    ctx.strokeStyle = C_GOLD;
    ctx.lineWidth = 0.25 * px;
    ctx.stroke();
    // 引擎内圈（深海蓝）
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.beginPath();
    ctx.arc(0, 0, 1.3 * px, 0, Math.PI * 2);
    ctx.fill();
    // 引擎涡轮叶片（电光蓝，6片旋转）
    ctx.fillStyle = C_ELECTRIC;
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + this.animFrame * 0.15;
      ctx.save();
      ctx.rotate(ang);
      ctx.fillRect(-0.1 * px, -1.2 * px, 0.2 * px, 1.2 * px);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // 引擎中心核心（银白发光）
    ctx.fillStyle = C_WHITE;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, 0.4 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // 引擎外发光晕（霓虹青）
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, 2.3 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();

    // === 右涡轮引擎 ===
    ctx.save();
    ctx.translate(9 * px, 5.5 * px);

    ctx.fillStyle = C_COBALT;
    ctx.beginPath();
    ctx.arc(0, 0, 1.8 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C_GOLD;
    ctx.lineWidth = 0.25 * px;
    ctx.stroke();
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.beginPath();
    ctx.arc(0, 0, 1.3 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C_ELECTRIC;
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + this.animFrame * 0.15;
      ctx.save();
      ctx.rotate(ang);
      ctx.fillRect(-0.1 * px, -1.2 * px, 0.2 * px, 1.2 * px);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = C_WHITE;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, 0.4 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, 2.3 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();

    // 引擎连接管道（金色，从涡轮到腰带）
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(4.7 * px, 7 * px, 0.6 * px, 1.5 * px);
    ctx.fillRect(8.7 * px, 7 * px, 0.6 * px, 1.5 * px);
    // 管道发光线（霓虹青）
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(4.8 * px, 7 * px, 0.4 * px, 1.5 * px);
    ctx.fillRect(8.8 * px, 7 * px, 0.4 * px, 1.5 * px);
    ctx.globalAlpha = 1;

    // === 战术胸甲 ===
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(5.5 * px, 4 * px, 7 * px, 4.5 * px);
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(7 * px, 4.2 * px, 4 * px, 4 * px);
    ctx.fillStyle = C_JEWEL;
    ctx.fillRect(10.5 * px, 4.2 * px, 1.2 * px, 4 * px);
    ctx.fillStyle = C_BRIGHT_BLUE;
    ctx.fillRect(11.5 * px, 4.5 * px, 0.4 * px, 3 * px);
    ctx.fillStyle = C_BLACK;
    ctx.fillRect(5.5 * px, 4 * px, 1.5 * px, 4.5 * px);
    // 胸甲金边接缝
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(7 * px, 4.2 * px, 4 * px, 0.15 * px);
    ctx.fillRect(7 * px, 6 * px, 4 * px, 0.15 * px);
    ctx.fillRect(7 * px, 7.5 * px, 4 * px, 0.15 * px);

    // === 胸甲十字能量纹 ===
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(8.7 * px, 4.5 * px, 0.6 * px, 3.5 * px);
    ctx.fillRect(7.5 * px, 5.8 * px, 3 * px, 0.6 * px);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C_WHITE;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(8.6 * px, 5.7 * px, 0.8 * px, 0.8 * px);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C_ELECTRIC;
    ctx.fillRect(8.85 * px, 4.4 * px, 0.3 * px, 0.3 * px);
    ctx.fillRect(8.85 * px, 8 * px, 0.3 * px, 0.3 * px);
    ctx.fillRect(7.3 * px, 5.85 * px, 0.3 * px, 0.3 * px);
    ctx.fillRect(10.4 * px, 5.85 * px, 0.3 * px, 0.3 * px);

    // 胸前能量核心徽章
    const coreGlow = 0.6 + Math.sin(this.animFrame * 0.15) * 0.4;
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(9.5 * px, 4.8 * px, 2 * px, 2 * px);
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(9.5 * px, 6.5 * px, 2 * px, 0.3 * px);
    ctx.fillStyle = C_GREEN;
    ctx.globalAlpha = coreGlow;
    ctx.fillRect(10 * px, 5.3 * px, 1 * px, 1 * px);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(10.1 * px, 5.4 * px, 0.3 * px, 0.3 * px);

    // 胸甲紫色能量纹
    ctx.fillStyle = C_DARK_PURPLE;
    ctx.fillRect(7.5 * px, 7.5 * px, 3 * px, 0.3 * px);

    // 红色警示灯
    ctx.fillStyle = C_RED;
    ctx.fillRect(6 * px, 4.5 * px, 0.6 * px, 0.6 * px);
    ctx.fillStyle = C_DARK_RED;
    ctx.fillRect(6 * px, 5 * px, 0.6 * px, 0.2 * px);

    // === 肩甲（蓝金 + 能量发光带）===
    // 后肩甲
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(4.5 * px, 3.5 * px, 2 * px, 1.5 * px);
    ctx.fillStyle = C_BRIGHT_BLUE;
    ctx.fillRect(4.5 * px, 3.5 * px, 0.4 * px, 1.5 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(5 * px, 3.8 * px, 1 * px, 0.3 * px);
    ctx.fillStyle = C_ORANGE;
    ctx.fillRect(5.2 * px, 4.2 * px, 0.6 * px, 0.3 * px);
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(5.5 * px, 3.6 * px, 0.3 * px, 0.3 * px);
    ctx.fillStyle = C_SILVER_DARK;
    ctx.fillRect(5.5 * px, 3.85 * px, 0.3 * px, 0.1 * px);
    // 后肩能量发光带
    ctx.fillStyle = C_ELECTRIC;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(4.7 * px, 3.7 * px, 0.2 * px, 1.2 * px);
    ctx.fillStyle = C_BRIGHT_BLUE;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(4.9 * px, 3.7 * px, 0.15 * px, 1.2 * px);
    ctx.globalAlpha = 1;

    // 前肩甲
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(11.5 * px, 3.8 * px, 1.5 * px, 1.5 * px);
    ctx.fillStyle = C_BRIGHT_BLUE;
    ctx.fillRect(12.6 * px, 3.8 * px, 0.4 * px, 1.5 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(11.8 * px, 4.2 * px, 0.8 * px, 0.3 * px);
    ctx.fillStyle = C_ORANGE;
    ctx.fillRect(12 * px, 4.6 * px, 0.5 * px, 0.3 * px);
    ctx.fillStyle = C_ELECTRIC;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(12.4 * px, 4 * px, 0.2 * px, 1.2 * px);
    ctx.fillStyle = C_BRIGHT_BLUE;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(12.2 * px, 4 * px, 0.15 * px, 1.2 * px);
    ctx.globalAlpha = 1;

    // === 后臂（左能量手枪 - 平举向身侧）===
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(4.8 * px, 5 * px, 1.5 * px, 3.5 * px);
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(4.8 * px, 5 * px, 0.4 * px, 3.5 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(4.8 * px, 6.5 * px, 1.5 * px, 0.15 * px);
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(4.85 * px, 6.55 * px, 0.3 * px, 0.3 * px);
    // 后臂护腕
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(4.5 * px, 7.5 * px, 2 * px, 1 * px);
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(4.5 * px, 8.3 * px, 2 * px, 0.2 * px);
    ctx.fillStyle = C_LEATHER;
    ctx.fillRect(4.8 * px, 8.5 * px, 1.5 * px, 0.8 * px);

    // === 左能量手枪（后手 - 平举向左）===
    const pistolBX = 2.5 * px;
    const pistolBY = 8.7 * px;
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(pistolBX, pistolBY, 2 * px, 1.8 * px);
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(pistolBX + 0.2 * px, pistolBY + 0.2 * px, 1.6 * px, 1.4 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(pistolBX, pistolBY, 2 * px, 0.2 * px);
    ctx.fillStyle = C_ELECTRIC;
    ctx.fillRect(pistolBX + 0.5 * px, pistolBY + 0.5 * px, 1 * px, 0.8 * px);
    // 左枪枪管（向左伸出）
    ctx.fillStyle = C_SILVER_DARK;
    ctx.fillRect(pistolBX - 1.5 * px, pistolBY + 0.5 * px, 1.5 * px, 0.8 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(pistolBX - 1.5 * px, pistolBY + 0.5 * px, 1.5 * px, 0.1 * px);
    ctx.fillStyle = C_NEON_CYAN;
    ctx.fillRect(pistolBX - 2 * px, pistolBY + 0.4 * px, 0.5 * px, 1 * px);

    // 左枪枪口火焰
    if (isShooting) {
      ctx.fillStyle = C_WHITE;
      ctx.fillRect(pistolBX - 3 * px, pistolBY + 0.3 * px, 1.2 * px, 1 * px);
      ctx.fillStyle = C_NEON_CYAN;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(pistolBX - 4 * px, pistolBY - 0.2 * px, 2 * px, 2 * px);
      ctx.fillStyle = C_PURPLE;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(pistolBX - 5 * px, pistolBY - 0.8 * px, 3 * px, 3 * px);
      ctx.globalAlpha = 1;
    }

    // === 前臂（右能量手枪 - 平举向前）===
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(11.5 * px, 4.5 * px, 2 * px, 2.5 * px);
    ctx.fillStyle = C_JEWEL;
    ctx.fillRect(13 * px, 4.7 * px, 0.4 * px, 2 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(11.5 * px, 5.5 * px, 2 * px, 0.15 * px);
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(11.55 * px, 5.55 * px, 0.3 * px, 0.3 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(11.5 * px, 5.5 * px, 2 * px, 1.2 * px);
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(11.5 * px, 6.5 * px, 2 * px, 0.2 * px);
    ctx.fillStyle = C_NEON_CYAN;
    ctx.fillRect(11.7 * px, 5.8 * px, 1.5 * px, 0.3 * px);
    ctx.fillStyle = C_LEATHER;
    ctx.fillRect(12 * px, 6.5 * px, 2 * px, 1.5 * px);
    ctx.fillStyle = C_LEATHER_DARK;
    ctx.fillRect(12.2 * px, 7.5 * px, 0.4 * px, 0.4 * px);
    ctx.fillRect(12.8 * px, 7.5 * px, 0.4 * px, 0.4 * px);

    // === 右能量手枪（前手 - 平举向前）===
    const pistolX = 13.5 * px;
    const pistolY = 6 * px;
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(pistolX, pistolY, 2.5 * px, 1.8 * px);
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(pistolX + 0.2 * px, pistolY + 0.2 * px, 2.1 * px, 1.4 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(pistolX, pistolY, 2.5 * px, 0.2 * px);
    ctx.fillRect(pistolX, pistolY + 1.6 * px, 2.5 * px, 0.15 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(pistolX + 0.8 * px, pistolY + 1.8 * px, 0.8 * px, 1.2 * px);
    ctx.fillStyle = C_ELECTRIC;
    ctx.fillRect(pistolX + 0.9 * px, pistolY + 1.9 * px, 0.6 * px, 1 * px);
    ctx.fillStyle = C_NEON_CYAN;
    ctx.fillRect(pistolX + 0.3 * px, pistolY + 0.8 * px, 2 * px, 0.2 * px);
    ctx.fillStyle = C_SILVER_DARK;
    ctx.fillRect(pistolX + 2.5 * px, pistolY + 0.3 * px, 2.5 * px, 1.2 * px);
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(pistolX + 2.5 * px, pistolY + 0.3 * px, 2.5 * px, 0.2 * px);
    ctx.fillStyle = C_NEON_CYAN;
    ctx.fillRect(pistolX + 4.8 * px, pistolY + 0.2 * px, 0.7 * px, 1.4 * px);

    // 右枪枪口火焰
    if (isShooting) {
      const flashX = pistolX + 5.5 * px;
      const flashY = pistolY;
      ctx.fillStyle = C_WHITE;
      ctx.fillRect(flashX, flashY + 0.3 * px, 2.5 * px, 1 * px);
      ctx.fillStyle = C_GOLD;
      ctx.fillRect(flashX - 0.5 * px, flashY - 0.2 * px, 3.5 * px, 2 * px);
      ctx.fillStyle = C_NEON_CYAN;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(flashX + 1.5 * px, flashY - 0.8 * px, 3.5 * px, 3 * px);
      ctx.globalAlpha = 1;
      ctx.fillStyle = C_PURPLE;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(flashX + 3 * px, flashY - 1.5 * px, 5 * px, 4.5 * px);
      ctx.globalAlpha = 1;
    }

    // === 脖子 ===
    ctx.fillStyle = '#C8B8D8';
    ctx.fillRect(8.5 * px, 2.5 * px, 3 * px, 1.8 * px);
    ctx.fillStyle = '#9A8AA8';
    ctx.fillRect(8.5 * px, 2.8 * px, 1 * px, 1.3 * px);

    // === 头盔主体（深海蓝）===
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(6.5 * px, -3.5 * px, 6 * px, 6 * px);

    // 头盔顶脊（多段渐层）
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(6.5 * px, -3.5 * px, 6 * px, 0.5 * px);
    ctx.fillStyle = C_JEWEL;
    ctx.fillRect(7 * px, -3.6 * px, 5 * px, 0.25 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(7.4 * px, -3.7 * px, 4.2 * px, 0.15 * px);
    ctx.fillStyle = C_GOLD_LIGHT;
    ctx.fillRect(9 * px, -3.75 * px, 1 * px, 0.15 * px);

    // === 顶部脊饰（前/中/后多段造型）===
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(6.8 * px, -4 * px, 0.9 * px, 0.5 * px); // 前段脊座
    ctx.fillRect(11.3 * px, -4 * px, 0.9 * px, 0.5 * px); // 后段脊座
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(6.9 * px, -4.2 * px, 0.5 * px, 0.25 * px); // 前段脊尖
    ctx.fillRect(11.5 * px, -4.2 * px, 0.5 * px, 0.25 * px); // 后段脊尖
    // 中段能量条
    ctx.fillStyle = C_NEON_CYAN;
    ctx.fillRect(7.9 * px, -4 * px, 3.2 * px, 0.4 * px);
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(8.8 * px, -4 * px, 1.4 * px, 0.4 * px); // 中央能量核心
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(7.5 * px, -4.5 * px, 4 * px, 0.5 * px); // 能量光晕
    ctx.globalAlpha = 1;

    // === 侧棱与后脑接缝 ===
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(7 * px, -3.3 * px, 5 * px, 0.25 * px); // 侧棱金线
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(6.5 * px, -2.5 * px, 0.4 * px, 4 * px); // 左侧棱
    ctx.fillRect(12.1 * px, -2.5 * px, 0.4 * px, 4 * px); // 右侧棱
    ctx.fillStyle = C_BLACK;
    ctx.fillRect(6.5 * px, -2 * px, 1 * px, 4 * px); // 后部

    // === 后脑能量节点（紫宝石链）===
    ctx.fillStyle = C_DARK_PURPLE;
    ctx.fillRect(6.55 * px, -1.8 * px, 0.3 * px, 0.35 * px);
    ctx.fillRect(6.55 * px, -0.5 * px, 0.3 * px, 0.35 * px);
    ctx.fillRect(6.55 * px, 0.8 * px, 0.3 * px, 0.35 * px);
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(6.6 * px, -1.7 * px, 0.2 * px, 0.2 * px);
    ctx.fillRect(6.6 * px, -0.4 * px, 0.2 * px, 0.2 * px);
    ctx.fillRect(6.6 * px, 0.9 * px, 0.2 * px, 0.2 * px);
    ctx.fillStyle = C_WHITE;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(6.65 * px, -1.65 * px, 0.1 * px, 0.1 * px);
    ctx.fillRect(6.65 * px, -0.35 * px, 0.1 * px, 0.1 * px);
    ctx.fillRect(6.65 * px, 0.95 * px, 0.1 * px, 0.1 * px);
    ctx.globalAlpha = 1;

    // === 侧翼耳甲（左右展开包裹耳部）===
    // 左耳甲
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(5.5 * px, -1.6 * px, 1 * px, 2.6 * px);
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(5.3 * px, -1 * px, 0.5 * px, 2 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(5.5 * px, -1.6 * px, 0.2 * px, 2.6 * px); // 前金边
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(5.7 * px, -1.6 * px, 0.1 * px, 2.6 * px); // 内框
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(5.85 * px, -0.5 * px, 0.45 * px, 0.7 * px); // 耳甲能量点
    ctx.globalAlpha = 1;
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(5.85 * px, 0.5 * px, 0.45 * px, 0.35 * px); // 通讯节点
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(5.6 * px, -1.5 * px, 0.3 * px, 0.15 * px); // 上铆钉
    // 右耳甲（镜像）
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(12.5 * px, -1.6 * px, 1 * px, 2.6 * px);
    ctx.fillStyle = C_DEEP_BLUE;
    ctx.fillRect(13.2 * px, -1 * px, 0.5 * px, 2 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(13.3 * px, -1.6 * px, 0.2 * px, 2.6 * px); // 后金边
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(13.1 * px, -1.6 * px, 0.1 * px, 2.6 * px);
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(12.7 * px, -0.5 * px, 0.45 * px, 0.7 * px);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C_PURPLE;
    ctx.fillRect(12.7 * px, 0.5 * px, 0.45 * px, 0.35 * px);
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(13.1 * px, -1.5 * px, 0.3 * px, 0.15 * px);

    // === 多节通讯天线（V字形 - 底座+主杆+关节+顶段+发光球）===
    // 左天线
    ctx.save();
    ctx.translate(7 * px, -3.2 * px);
    ctx.rotate(-Math.PI / 6);
    ctx.fillStyle = C_GOLD; // 底座
    ctx.fillRect(-0.3 * px, -0.2 * px, 0.6 * px, 0.5 * px);
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(-0.3 * px, 0.2 * px, 0.6 * px, 0.1 * px);
    ctx.fillStyle = C_GOLD_DARK; // 主杆
    ctx.fillRect(-0.08 * px, -1.2 * px, 0.16 * px, 1 * px);
    ctx.fillStyle = C_SILVER; // 中段关节
    ctx.beginPath();
    ctx.arc(0, -1.3 * px, 0.2 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(-0.07 * px, -1.4 * px, 0.12 * px, 0.12 * px);
    ctx.fillStyle = C_GOLD; // 顶段
    ctx.fillRect(-0.05 * px, -2 * px, 0.1 * px, 0.7 * px);
    ctx.fillStyle = C_ELECTRIC; // 顶端发光球
    ctx.beginPath();
    ctx.arc(0, -2.1 * px, 0.3 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, -2.1 * px, 0.42 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C_WHITE;
    ctx.beginPath();
    ctx.arc(-0.05 * px, -2.15 * px, 0.14 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, -2.1 * px, 0.75 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    // 右天线（镜像）
    ctx.save();
    ctx.translate(12 * px, -3.2 * px);
    ctx.rotate(Math.PI / 6);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(-0.3 * px, -0.2 * px, 0.6 * px, 0.5 * px);
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(-0.3 * px, 0.2 * px, 0.6 * px, 0.1 * px);
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(-0.08 * px, -1.2 * px, 0.16 * px, 1 * px);
    ctx.fillStyle = C_SILVER;
    ctx.beginPath();
    ctx.arc(0, -1.3 * px, 0.2 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C_WHITE;
    ctx.fillRect(-0.07 * px, -1.4 * px, 0.12 * px, 0.12 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(-0.05 * px, -2 * px, 0.1 * px, 0.7 * px);
    ctx.fillStyle = C_ELECTRIC;
    ctx.beginPath();
    ctx.arc(0, -2.1 * px, 0.3 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, -2.1 * px, 0.42 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C_WHITE;
    ctx.beginPath();
    ctx.arc(-0.05 * px, -2.15 * px, 0.14 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, -2.1 * px, 0.75 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // === 金色面甲（只覆盖上半脸 - 眼眉以上）===
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(7.5 * px, -2 * px, 4 * px, 1.5 * px);
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(7.5 * px, -0.6 * px, 4 * px, 0.15 * px); // 下沿
    ctx.fillStyle = C_GOLD_LIGHT;
    ctx.fillRect(7.6 * px, -1.9 * px, 0.3 * px, 1.3 * px); // 左高光
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(7.5 * px, -2 * px, 4 * px, 0.12 * px); // 上沿亮线
    // 面甲铆钉
    ctx.fillStyle = C_SILVER;
    ctx.fillRect(7.6 * px, -1.9 * px, 0.3 * px, 0.3 * px);
    ctx.fillRect(11.1 * px, -1.9 * px, 0.3 * px, 0.3 * px);
    ctx.fillStyle = C_SILVER_DARK;
    ctx.fillRect(7.6 * px, -1.7 * px, 0.3 * px, 0.1 * px);
    ctx.fillRect(11.1 * px, -1.7 * px, 0.3 * px, 0.1 * px);

    // === 精致目镜（横向分两眼+上下高光+两端收窄）===
    ctx.fillStyle = C_ELECTRIC;
    ctx.fillRect(7.7 * px, -1.2 * px, 3.6 * px, 0.6 * px); // 主体
    ctx.fillStyle = C_BLACK;
    ctx.fillRect(9.4 * px, -1.2 * px, 0.2 * px, 0.6 * px); // 中间分隔
    ctx.fillStyle = C_NEON_CYAN;
    ctx.fillRect(7.8 * px, -1.1 * px, 1.4 * px, 0.2 * px); // 左眼上高光
    ctx.fillRect(9.8 * px, -1.1 * px, 1.4 * px, 0.2 * px); // 右眼上高光
    ctx.fillStyle = C_WHITE; // 瞳光
    ctx.fillRect(8 * px, -1 * px, 0.5 * px, 0.1 * px);
    ctx.fillRect(10.2 * px, -1 * px, 0.5 * px, 0.1 * px);
    ctx.fillStyle = C_ELECTRIC;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(7.5 * px, -1.4 * px, 4 * px, 1 * px); // 发光晕
    ctx.globalAlpha = 1;

    // === 下半脸（面甲下方露出，肤色底+鼻+嘴+下颌）===
    ctx.fillStyle = '#D8C8E0'; // 肤色底（淡紫白）
    ctx.fillRect(7.8 * px, -0.4 * px, 3.4 * px, 2.6 * px);
    ctx.fillStyle = '#B8A8C8';
    ctx.fillRect(7.8 * px, 1.8 * px, 3.4 * px, 0.4 * px); // 下颌阴影
    ctx.fillStyle = '#E8D8F0'; // 颧骨高光
    ctx.fillRect(8 * px, -0.3 * px, 0.3 * px, 0.5 * px);
    ctx.fillRect(10.7 * px, -0.3 * px, 0.3 * px, 0.5 * px);
    // 鼻子（小三角+鼻孔）
    ctx.fillStyle = '#9A8AA8';
    ctx.beginPath();
    ctx.moveTo(9.5 * px, -0.3 * px);
    ctx.lineTo(9.3 * px, 0.5 * px);
    ctx.lineTo(9.7 * px, 0.5 * px);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7A6A88';
    ctx.fillRect(9.4 * px, 0.45 * px, 0.2 * px, 0.1 * px); // 鼻孔
    ctx.fillStyle = '#B89AB8';
    ctx.fillRect(9.55 * px, 0 * px, 0.1 * px, 0.4 * px); // 鼻梁高光
    // 嘴（深色横线+上唇线）
    ctx.fillStyle = '#5A3A48';
    ctx.fillRect(9 * px, 0.85 * px, 1 * px, 0.12 * px);
    ctx.fillStyle = '#8A5A6A';
    ctx.fillRect(9.1 * px, 0.75 * px, 0.8 * px, 0.1 * px);
    ctx.fillStyle = '#3A2A38';
    ctx.fillRect(9.4 * px, 0.85 * px, 0.2 * px, 0.12 * px); // 嘴角
    // 下颌线（金色勾勒）
    ctx.fillStyle = C_GOLD_DARK;
    ctx.fillRect(7.8 * px, 1.45 * px, 3.4 * px, 0.15 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(7.8 * px, 1.45 * px, 3.4 * px, 0.08 * px);
    ctx.fillStyle = C_GOLD_LIGHT;
    ctx.fillRect(8.5 * px, 1.5 * px, 2 * px, 0.06 * px); // 下颌高光

    // === 颈部护甲 ===
    ctx.fillStyle = C_COBALT;
    ctx.fillRect(7.5 * px, 3.5 * px, 4.5 * px, 1 * px);
    ctx.fillStyle = C_GOLD;
    ctx.fillRect(7.5 * px, 3.5 * px, 4.5 * px, 0.2 * px);
    ctx.fillStyle = C_NEON_CYAN;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(8.5 * px, 3.8 * px, 3 * px, 0.3 * px);
    ctx.globalAlpha = 1;

    ctx.restore(); // 上半身recoil
    ctx.restore(); // 整体姿态后仰
  }


  private renderDrone(): void {
    const ctx = this.ctx;
    const px = 2;
    const dx = this.droneX;
    const dy = this.droneY;

    ctx.save();
    ctx.translate(dx, dy);

    const hover = Math.sin(this.animFrame * 0.15) * 2;
    ctx.translate(0, hover);

    ctx.fillStyle = '#666';
    ctx.fillRect(-6 * px, -2 * px, 12 * px, 3 * px);

    ctx.fillStyle = '#888';
    ctx.fillRect(-3 * px, -1 * px, 6 * px, 4 * px);

    ctx.fillStyle = '#FF3333';
    ctx.fillRect(-1 * px, 1 * px, 2 * px, 1 * px);

    const propel = (this.animFrame % 4 < 2) ? 4 * px : 2 * px;
    ctx.fillStyle = 'rgba(200,200,200,0.6)';
    ctx.fillRect(-8 * px, -3 * px, propel, 1 * px);
    ctx.fillRect(8 * px - propel, -3 * px, propel, 1 * px);

    ctx.fillStyle = '#44FF44';
    ctx.fillRect(-1 * px, 3 * px, 2 * px, 2 * px);

    ctx.restore();
  }

  private renderClones(): void {
    const ctx = this.ctx;
    const positions = this.getClonePositions();

    // 分身颜色方案：主角为蓝金（冷色），分身为橙红紫（暖色），用 hue-rotate(180deg) 实现
    // 分身全息效果用橙红色 #FF6B3B（主角用青色 #00F5D4）
    const CLONE_HUE_ROTATE = 'hue-rotate(180deg) saturate(1.15)';

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const floatOffset = Math.sin(this.animFrame * 0.08 + i * 1.5) * 1.5;
      // 分身是否射击中：检查分身连发队列或射速计时器（近似判断）
      const isCloneShooting = this.cloneBurstRemaining[i] > 0;
      const recoil = isCloneShooting ? -1.5 : 0;

      ctx.save();
      // translate 到与 renderPlayer 一致的坐标系（中心点 (20, 3) 对应 pos）
      ctx.translate(pos.x - 20, pos.y - 3 + floatOffset);

      // 地面阴影
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(20, 32, 12, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 底部能量投影（橙红色调，与主角青色对应）
      const auraPulse = 0.6 + Math.sin(this.animFrame * 0.08 + i * 1.5) * 0.25;
      const auraGrad = ctx.createRadialGradient(20, 30, 0, 20, 30, 28);
      auraGrad.addColorStop(0, `rgba(255, 107, 59, ${0.3 * auraPulse})`);
      auraGrad.addColorStop(0.4, `rgba(176, 38, 255, ${0.12 * auraPulse})`);
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.fillRect(-15, 15, 70, 30);

      // 战士海报绘制（与主角同款图，hue-rotate 改色 + 水平翻转朝向右前方）
      if (this.warriorHeroKnockout) {
        const imgW = 56;
        const imgH = 76;
        const imgX = 20 - imgW / 2;
        const imgY = 3 - imgH / 2 + recoil;

        // 全息发光底层（模糊+提亮+hue-rotate）— 水平翻转
        ctx.save();
        ctx.filter = `blur(3px) brightness(1.3) ${CLONE_HUE_ROTATE}`;
        ctx.globalAlpha = 0.4;
        ctx.scale(-1, 1);
        ctx.drawImage(this.warriorHeroKnockout, -imgX - imgW, imgY, imgW, imgH);
        ctx.restore();

        // 主体（带全息滤镜：hue-rotate + 霓虹发光投影）— 水平翻转
        ctx.save();
        ctx.filter = `brightness(1.08) saturate(1.12) ${CLONE_HUE_ROTATE} drop-shadow(0 0 8px rgba(255, 107, 59, 0.5)) drop-shadow(0 0 14px rgba(176, 38, 255, 0.3))`;
        ctx.globalAlpha = 0.9; // 分身略透明，区分主体
        ctx.scale(-1, 1);
        ctx.drawImage(this.warriorHeroKnockout, -imgX - imgW, imgY, imgW, imgH);
        ctx.restore();

        // 全息扫描线（椭圆形扫描，橙红色，与主角青色对应）
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(20, 3, imgW / 2, imgH / 2, 0, 0, Math.PI * 2);
        ctx.clip();
        const scanY = 3 - imgH / 2 + ((this.animFrame * 0.5 + i * 20) % (imgH + 30));
        const scanGrad = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
        scanGrad.addColorStop(0, 'rgba(255, 107, 59, 0)');
        scanGrad.addColorStop(0.5, 'rgba(255, 107, 59, 0.4)');
        scanGrad.addColorStop(1, 'rgba(255, 107, 59, 0)');
        ctx.fillStyle = scanGrad;
        {
          const cy = 3;
          const ry = imgH / 2;
          const rx = imgW / 2;
          const dy = scanY - cy;
          const k = Math.max(0, 1 - (dy * dy) / (ry * ry));
          const halfW = rx * Math.sqrt(k);
          ctx.fillRect(20 - halfW, scanY - 12, halfW * 2, 24);
        }
        ctx.restore();

        // 全息网格叠加（橙红色细线，沿椭圆裁剪）
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(20, 3, imgW / 2, imgH / 2, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = 'rgba(255, 107, 59, 0.08)';
        ctx.lineWidth = 0.4;
        for (let gy = 3 - imgH / 2; gy < 3 + imgH / 2; gy += 3) {
          ctx.beginPath();
          ctx.moveTo(imgX, gy);
          ctx.lineTo(imgX + imgW, gy);
          ctx.stroke();
        }
        ctx.restore();

        // 边缘发光脉冲（橙红+紫色内发光，弱化不画描边）
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const edgePulse = 0.5 + Math.sin(this.animFrame * 0.07 + i * 1.5) * 0.2;
        const edgeGrad = ctx.createRadialGradient(20, 3, Math.min(imgW, imgH) * 0.35, 20, 3, Math.max(imgW, imgH) * 0.55);
        edgeGrad.addColorStop(0, 'rgba(255, 107, 59, 0)');
        edgeGrad.addColorStop(0.7, `rgba(255, 107, 59, ${edgePulse * 0.08})`);
        edgeGrad.addColorStop(1, `rgba(176, 38, 255, ${edgePulse * 0.15})`);
        ctx.fillStyle = edgeGrad;
        ctx.beginPath();
        ctx.ellipse(20, 3, imgW / 2, imgH / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // === 朝向前方（右）的能量武器 - 用 hue-rotate 改色后复用主角武器绘制 ===
        ctx.save();
        ctx.filter = CLONE_HUE_ROTATE;
        this.drawEnergyWeapon(ctx, isCloneShooting, recoil);
        ctx.restore();

        // 枪口火焰（橙红色调，与主角青色对应）
        if (isCloneShooting) {
          const flashX = 44;
          const flashY = 10;
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          // 外层紫色光晕
          ctx.fillStyle = 'rgba(176, 38, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(flashX + 5, flashY, 9, 0, Math.PI * 2);
          ctx.fill();
          // 中层橙红光晕
          ctx.fillStyle = 'rgba(255, 107, 59, 0.7)';
          ctx.beginPath();
          ctx.arc(flashX + 2, flashY, 5.5, 0, Math.PI * 2);
          ctx.fill();
          // 内层金色核心
          ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
          ctx.beginPath();
          ctx.arc(flashX, flashY, 3, 0, Math.PI * 2);
          ctx.fill();
          // 最内层白色高光
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.arc(flashX, flashY, 1.5, 0, Math.PI * 2);
          ctx.fill();
          // 横向能量射线
          ctx.strokeStyle = 'rgba(255, 107, 59, 0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(flashX + 2, flashY);
          ctx.lineTo(flashX + 12, flashY);
          ctx.stroke();
          ctx.restore();
        }
      } else {
        // 后备：图片未加载完成时使用原像素 sprite
        if (!this.cloneSpriteCache) this.rebuildCloneSprite();
        if (this.cloneSpriteCache) {
          const sprite = this.cloneSpriteCache;
          const ox = this.cloneSpriteOriginX;
          const oy = this.cloneSpriteOriginY;
          ctx.globalAlpha = 0.85;
          ctx.drawImage(sprite, -ox + 5, -oy + 3);
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
    }
  }

  // 离屏 canvas 预渲染分身静态身体：约 150 次 fillRect 合并为 1 次 drawImage
  // coreGlow 固定为中位值 0.6，丢失脉冲但保留发光质感
  private rebuildCloneSprite(): void {
    const px = 1.5;
    // 身体边界：x∈[-2, 40]，y∈[-7, 32]，留余量后 60x60，原点 (15, 15)
    const w = 60, h = 60;
    const originX = 15, originY = 15;

    if (!this.cloneSpriteCache) {
      this.cloneSpriteCache = document.createElement('canvas');
    }
    const sprite = this.cloneSpriteCache;
    sprite.width = w;
    sprite.height = h;
    const sctx = sprite.getContext('2d');
    if (!sctx) return;
    sctx.clearRect(0, 0, w, h);
    sctx.save();
    sctx.translate(originX, originY);

    const ctx = sctx;

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 29, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const armorColor = '#4A3A6A';
    const armorDark = '#2D2345';
    const armorLight = '#6B5AA0';
    const accentColor = '#FFE600';
    const accentColor2 = '#B026FF';

    // === 重力靴 (右脚直立) ===
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(8 * px, 17 * px, 4.8 * px, 3 * px);
    ctx.fillStyle = accentColor2;
    ctx.fillRect(8 * px, 19.5 * px, 4.8 * px, 0.5 * px);
    ctx.fillStyle = '#10101E';
    ctx.fillRect(7.5 * px, 17.5 * px, 0.8 * px, 2 * px);
    ctx.fillStyle = '#252540';
    ctx.fillRect(8.5 * px, 15 * px, 3.8 * px, 2 * px);
    ctx.fillStyle = accentColor2;
    ctx.fillRect(8.5 * px, 15.8 * px, 3.8 * px, 0.4 * px);

    // 右腿 (直立)
    ctx.fillStyle = armorDark;
    ctx.fillRect(8.5 * px, 9.5 * px, 3.2 * px, 5.5 * px);
    ctx.fillStyle = '#1A1028';
    ctx.fillRect(8.5 * px, 10 * px, 0.8 * px, 5 * px);
    ctx.fillStyle = armorColor;
    ctx.fillRect(10.9 * px, 10 * px, 0.8 * px, 5 * px);
    ctx.fillStyle = armorColor;
    ctx.fillRect(10.5 * px, 12 * px, 2 * px, 1.8 * px);
    ctx.fillStyle = accentColor;
    ctx.fillRect(11.1 * px, 12.5 * px, 0.7 * px, 0.9 * px);
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(8.5 * px, 10.5 * px, 3.2 * px, 0.4 * px);

    // === 战术裤 + 左脚靴 (左腿45度向前抬起，整体旋转) ===
    ctx.save();
    ctx.translate(7.5 * px, 9.5 * px);
    ctx.rotate(-Math.PI / 4);

    ctx.fillStyle = armorDark;
    ctx.fillRect(0, 0, 3 * px, 5.5 * px);
    ctx.fillStyle = '#1A1028';
    ctx.fillRect(0, 0.5 * px, 0.8 * px, 5 * px);
    ctx.fillStyle = armorColor;
    ctx.fillRect(2.3 * px, 0.5 * px, 0.7 * px, 5 * px);
    ctx.fillStyle = armorColor;
    ctx.fillRect(2.7 * px, 2.5 * px, 2 * px, 1.8 * px);
    ctx.fillStyle = accentColor;
    ctx.fillRect(3.3 * px, 3 * px, 0.7 * px, 0.9 * px);
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 1 * px, 3 * px, 0.4 * px);

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(-0.5 * px, 5.5 * px, 4.5 * px, 3 * px);
    ctx.fillStyle = accentColor2;
    ctx.fillRect(-0.5 * px, 8 * px, 4.5 * px, 0.5 * px);
    ctx.fillStyle = '#10101E';
    ctx.fillRect(-1 * px, 6 * px, 0.8 * px, 2 * px);
    ctx.fillStyle = '#252540';
    ctx.fillRect(0 * px, 3.5 * px, 3.5 * px, 2 * px);
    ctx.fillStyle = accentColor2;
    ctx.fillRect(0 * px, 4.3 * px, 3.5 * px, 0.4 * px);

    ctx.restore();

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(6 * px, 8.5 * px, 6 * px, 1.2 * px);
    ctx.fillStyle = accentColor;
    ctx.fillRect(6 * px, 8.9 * px, 6 * px, 0.3 * px);
    ctx.fillStyle = accentColor2;
    ctx.fillRect(11.5 * px, 8.3 * px, 1 * px, 1.6 * px);

    ctx.fillStyle = armorColor;
    ctx.fillRect(5.5 * px, 4 * px, 7 * px, 4.5 * px);
    ctx.fillStyle = armorDark;
    ctx.fillRect(5.5 * px, 4 * px, 1.5 * px, 4.5 * px);
    ctx.fillStyle = armorLight;
    ctx.fillRect(11 * px, 4.2 * px, 1.2 * px, 4 * px);

    // 核心发光（固定 alpha，原为脉冲）
    const coreGlow = 0.6;
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = coreGlow;
    ctx.fillRect(11 * px, 5 * px, 1.5 * px, 2 * px);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(11.3 * px, 5.5 * px, 1 * px, 1 * px);
    ctx.globalAlpha = coreGlow * 0.3;
    ctx.fillStyle = accentColor;
    ctx.fillRect(10.5 * px, 4.5 * px, 2.5 * px, 3 * px);
    ctx.globalAlpha = 1;

    ctx.fillStyle = accentColor2;
    ctx.fillRect(9 * px, 5 * px, 2 * px, 0.4 * px);
    ctx.fillRect(9 * px, 6.5 * px, 2 * px, 0.4 * px);

    ctx.fillStyle = armorLight;
    ctx.fillRect(4.5 * px, 3.5 * px, 1.5 * px, 3.5 * px);
    ctx.fillStyle = accentColor;
    ctx.fillRect(4.8 * px, 3.8 * px, 0.8 * px, 0.6 * px);
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(4.5 * px, 7 * px, 1.5 * px, 2 * px);
    ctx.globalAlpha = 0.3;
    ctx.fillRect(4.2 * px, 8 * px, 2 * px, 3 * px);
    ctx.globalAlpha = 1;

    ctx.fillStyle = armorDark;
    ctx.fillRect(4.8 * px, 5 * px, 1.5 * px, 3.5 * px);
    ctx.fillStyle = armorColor;
    ctx.fillRect(4.5 * px, 7.5 * px, 2 * px, 1 * px);

    ctx.fillStyle = armorColor;
    ctx.fillRect(11.5 * px, 4.5 * px, 2 * px, 2.5 * px);
    ctx.fillStyle = armorLight;
    ctx.fillRect(11.5 * px, 5.5 * px, 2 * px, 1.2 * px);
    ctx.fillStyle = accentColor;
    ctx.fillRect(11.7 * px, 5.8 * px, 1.5 * px, 0.4 * px);
    ctx.fillStyle = '#B0A8C8';
    ctx.fillRect(12 * px, 6.5 * px, 2 * px, 1.5 * px);

    const gunX = 13.5 * px;
    const gunY = 5.5 * px;
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(gunX - 2 * px, gunY + 0.3 * px, 2.5 * px, 1.5 * px);
    ctx.fillStyle = armorDark;
    ctx.fillRect(gunX + 0 * px, gunY, 9 * px, 2.2 * px);
    ctx.fillStyle = armorColor;
    ctx.fillRect(gunX + 1 * px, gunY - 0.6 * px, 6 * px, 0.6 * px);
    ctx.fillStyle = accentColor;
    ctx.fillRect(gunX + 2.5 * px, gunY + 2 * px, 2 * px, 2.5 * px);
    ctx.fillStyle = accentColor2;
    ctx.fillRect(gunX + 2.8 * px, gunY + 2.3 * px, 1.4 * px, 1.8 * px);
    ctx.fillStyle = armorColor;
    ctx.fillRect(gunX + 8 * px, gunY + 0.3 * px, 4 * px, 1.4 * px);
    ctx.fillStyle = accentColor;
    ctx.fillRect(gunX + 11 * px, gunY + 0.1 * px, 1.2 * px, 1.8 * px);

    ctx.fillStyle = '#C4B0D0';
    ctx.fillRect(8.5 * px, 2.5 * px, 3 * px, 1.8 * px);
    ctx.fillStyle = '#9A8AA8';
    ctx.fillRect(8.5 * px, 2.8 * px, 1 * px, 1.3 * px);

    // === 头部 ===
    ctx.fillStyle = '#3D2A50';
    ctx.fillRect(6.5 * px, -2 * px, 2.5 * px, 4.5 * px);
    ctx.fillRect(5.5 * px, -1 * px, 1.5 * px, 3 * px);
    ctx.fillStyle = '#5A4270';
    ctx.fillRect(6.5 * px, -3.5 * px, 5 * px, 1.5 * px);
    ctx.fillRect(7.5 * px, -4 * px, 3 * px, 0.5 * px);
    ctx.fillRect(8.5 * px, -4.3 * px, 1.5 * px, 0.4 * px);
    ctx.fillStyle = '#5A4270';
    ctx.fillRect(9.5 * px, -2.5 * px, 3 * px, 1.2 * px);
    ctx.fillRect(11 * px, -3 * px, 1.5 * px, 0.8 * px);
    ctx.fillStyle = '#7A5A90';
    ctx.fillRect(7 * px, -3 * px, 1.5 * px, 0.4 * px);
    ctx.fillRect(9 * px, -3.2 * px, 1 * px, 0.3 * px);

    ctx.fillStyle = '#E8C8A8';
    ctx.fillRect(8.5 * px, -2 * px, 4 * px, 4.5 * px);
    ctx.fillStyle = '#D4A888';
    ctx.fillRect(8.5 * px, -1.5 * px, 1 * px, 3.5 * px);
    ctx.fillStyle = '#F5D8B8';
    ctx.fillRect(11 * px, -1.8 * px, 1.5 * px, 2 * px);
    ctx.fillStyle = '#E8C8A8';
    ctx.fillRect(10 * px, -1.5 * px, 1 * px, 0.5 * px);

    ctx.fillStyle = '#3D2540';
    ctx.fillRect(10 * px, -0.8 * px, 1.8 * px, 0.4 * px);
    ctx.fillRect(10.5 * px, -1 * px, 1.3 * px, 0.3 * px);
    ctx.fillStyle = '#C49878';
    ctx.fillRect(10 * px, -0.5 * px, 1.8 * px, 0.2 * px);

    ctx.fillStyle = '#1A1228';
    ctx.fillRect(10.2 * px, -0.2 * px, 1.5 * px, 0.8 * px);
    ctx.fillStyle = accentColor;
    ctx.fillRect(10.8 * px, 0 * px, 0.6 * px, 0.5 * px);
    ctx.fillStyle = '#1A1228';
    ctx.fillRect(10.2 * px, -0.4 * px, 0.4 * px, 0.2 * px);

    ctx.fillStyle = '#D4A888';
    ctx.fillRect(11.5 * px, 0.3 * px, 1 * px, 1.5 * px);
    ctx.fillStyle = '#C49878';
    ctx.fillRect(12 * px, 1.5 * px, 0.6 * px, 0.4 * px);
    ctx.fillStyle = '#F5D8B8';
    ctx.fillRect(11.7 * px, 0.5 * px, 0.4 * px, 1 * px);

    ctx.fillStyle = '#B8786A';
    ctx.fillRect(10.5 * px, 1.6 * px, 1.5 * px, 0.35 * px);
    ctx.fillStyle = '#9A6858';
    ctx.fillRect(10.5 * px, 1.7 * px, 0.3 * px, 0.2 * px);

    ctx.fillStyle = '#D4A888';
    ctx.fillRect(10 * px, 2 * px, 2 * px, 0.5 * px);
    ctx.fillRect(10.5 * px, 2.3 * px, 1.5 * px, 0.4 * px);
    ctx.fillStyle = '#C49878';
    ctx.fillRect(9.5 * px, 1.5 * px, 0.5 * px, 1 * px);
    ctx.fillStyle = '#F5D8B8';
    ctx.fillRect(10.5 * px, 0.5 * px, 0.5 * px, 0.5 * px);

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(6.5 * px, -2.5 * px, 5.5 * px, 0.8 * px);
    ctx.fillStyle = accentColor;
    ctx.fillRect(7 * px, -2.3 * px, 4.5 * px, 0.3 * px);
    ctx.fillStyle = '#252540';
    ctx.fillRect(6 * px, -2 * px, 1.5 * px, 2.5 * px);
    ctx.fillStyle = accentColor;
    ctx.fillRect(6.3 * px, -0.8 * px, 0.8 * px, 0.8 * px);
    ctx.fillStyle = '#252540';
    ctx.fillRect(6.2 * px, 0.5 * px, 0.5 * px, 1.5 * px);
    ctx.fillStyle = accentColor2;
    ctx.fillRect(6 * px, 1.8 * px, 1 * px, 0.6 * px);

    ctx.fillStyle = armorLight;
    ctx.fillRect(7.5 * px, 3.5 * px, 4.5 * px, 1 * px);
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(8.5 * px, 3.8 * px, 3 * px, 0.3 * px);
    ctx.globalAlpha = 1;

    sctx.restore();
    this.cloneSpriteOriginX = originX;
    this.cloneSpriteOriginY = originY;
  }

  private renderBullets(): void {
    const ctx = this.ctx;
    const bullets = this.bulletPool.getActive();

    for (const bullet of bullets) {
      const bulletAny = bullet as any;
      if (bulletAny.isGrenade) continue;
      if (bulletAny.isParabolic) continue;
      if (bulletAny.isNuke) continue;

      const angle = bulletAny.angle || 0;
      const bw = bullet.width;
      const hasFreeze = bulletAny.isFreezeBullet && bulletAny.freezeLvl > 0;
      const hasBomb = bulletAny.isBombBullet && bulletAny.hasBomb && bulletAny.bombLvl > 0;
      const hasPoison = bulletAny.isPoisonBullet && bulletAny.poisonLvl > 0;
      const hasWave = bulletAny.isWaveBullet && bulletAny.waveLvl > 0;

      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      // 性能优化：绝大多数玩家子弹角度为0，跳过 rotate 调用
      if (angle !== 0) ctx.rotate(angle);

      if (hasWave) {
        this.renderWaveBullet(ctx, bw, bulletAny.wavePhase || 0, bulletAny.waveLvl || 1, bulletAny.cloneBullet ? bulletAny.cloneIdx : -1);
      } else if (hasFreeze) {
        this.renderFreezeBullet(ctx, bw);
      } else if (hasBomb) {
        this.renderBombBullet(ctx, bw);
      } else if (hasPoison) {
        this.renderPoisonBullet(ctx, bw);
      } else {
        this.renderNormalBullet(ctx, bw, bulletAny.cloneBullet ? bulletAny.cloneIdx : -1);
      }

      ctx.restore();
    }

    // === 榴弹 + 拖尾 ===
    ctx.save();
    for (const bullet of bullets) {
      const bulletAny = bullet as any;
      if (!bulletAny.isGrenade) continue;

      const trail = bulletAny.trail || [];
      const color = bulletAny.grenadeColor || '#FFFFFF';

      if (trail.length > 1) {
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        const step = Math.max(1, Math.floor(trail.length / 8));
        for (let i = 1; i < trail.length; i += step) {
          const alpha = i / trail.length;
          ctx.globalAlpha = alpha * 0.7;
          ctx.lineWidth = 1 + alpha * 2.5;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bulletAny.cloneGrenade ? '#FFD700' : '#CCCCCC';
      ctx.beginPath();
      ctx.arc(bullet.x - 1, bullet.y - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bulletAny.cloneGrenade ? '#FF4500' : '#888888';
      ctx.fillRect(bullet.x - 1, bullet.y - 6, 2, 3);
    }
    ctx.restore();

    // === 终极核弹 + 拖尾 ===
    ctx.save();
    for (const bullet of bullets) {
      const bulletAny = bullet as any;
      if (!bulletAny.isNuke) continue;

      const trail = bulletAny.trail || [];
      // 绿色能量拖尾
      if (trail.length > 1) {
        ctx.strokeStyle = '#00FF88';
        ctx.lineCap = 'round';
        const step = Math.max(1, Math.floor(trail.length / 10));
        for (let i = 1; i < trail.length; i += step) {
          const alpha = i / trail.length;
          ctx.globalAlpha = alpha * 0.8;
          ctx.lineWidth = 1.5 + alpha * 3.5;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // 核弹弹体：优先用贴图（跟随抛物线方向旋转），无贴图时回退到Canvas绘制
      const nukeSprite = this.sprites.nuke;
      if (nukeSprite) {
        const size = 28;
        // 辐射光晕
        ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 16, 0, Math.PI * 2);
        ctx.fill();
        // 根据抛物线速度方向旋转贴图
        const angle = Math.atan2(bulletAny.vy, bulletAny.vx);
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(angle);
        ctx.drawImage(nukeSprite, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else {
        // 回退：Canvas绘制绿色能量球
        const angle = Math.atan2(bulletAny.vy, bulletAny.vx);
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(0, 255, 136, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00FF88';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#AAFFCC';
        ctx.beginPath();
        ctx.arc(-1.5, -1.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#003311';
        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();

    // === 终极核弹冲击波环 ===
    ctx.save();
    for (const sw of this.nukeShockwaves) {
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      // 内层光晕
      ctx.globalAlpha = Math.max(0, sw.alpha * 0.3);
      ctx.lineWidth = 8;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // === 远程射手抛物线子弹 ===
    ctx.save();
    for (const bullet of bullets) {
      const bulletAny = bullet as any;
      if (!bulletAny.isParabolic) continue;

      // 拖尾
      const trail = bulletAny.trail || [];
      if (trail.length > 1) {
        ctx.strokeStyle = '#9B59B6';
        ctx.lineCap = 'round';
        for (let i = 1; i < trail.length; i++) {
          const alpha = i / trail.length;
          ctx.globalAlpha = alpha * 0.6;
          ctx.lineWidth = 0.8 + alpha * 1.8;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // 弹体：紫色能量球
      ctx.fillStyle = '#9B59B6';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#D7BDE2';
      ctx.beginPath();
      ctx.arc(bullet.x - 0.8, bullet.y - 0.8, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // 光晕
      ctx.fillStyle = 'rgba(155, 89, 182, 0.3)';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderNormalBullet(ctx: CanvasRenderingContext2D, bw: number, cloneIdx: number = -1): void {
    // 分身颜色方案：cloneIdx=0 淡蓝色，cloneIdx=1 金黄色，玩家（-1）橙色
    let mainColor: string, midColor: string, edgeColor: string, sparkColor: string, trail1: string, trail2: string, trail3: string;
    if (cloneIdx === 0) {
      // 第一个分身：淡蓝色
      mainColor = '#88BBFF';
      midColor = '#BBDDFF';
      edgeColor = '#4488DD';
      sparkColor = '#DDEEFF';
      trail1 = '#6699CC';
      trail2 = '#446688';
      trail3 = '#223344';
    } else if (cloneIdx === 1) {
      // 第二个分身：金黄色
      mainColor = '#FFCC33';
      midColor = '#FFEE88';
      edgeColor = '#CC9900';
      sparkColor = '#FFEE44';
      trail1 = '#CC8800';
      trail2 = '#884400';
      trail3 = '#332200';
    } else {
      // 玩家：橙色（原色）
      mainColor = '#FFAA33';
      midColor = '#FFDD88';
      edgeColor = '#FF6600';
      sparkColor = '#FFDD44';
      trail1 = '#FF8800';
      trail2 = '#CC5500';
      trail3 = '#552200';
    }

    ctx.fillStyle = mainColor;
    ctx.fillRect(-bw / 2, -3, bw, 6);

    ctx.fillStyle = midColor;
    ctx.fillRect(bw / 2 - 2, -1, 2, 2);

    ctx.fillStyle = edgeColor;
    ctx.fillRect(-bw / 2, -1, bw, 2);

    ctx.fillStyle = trail1;
    ctx.fillRect(-bw / 2 - 8, -1, 8, 2);
    ctx.fillStyle = trail2;
    ctx.fillRect(-bw / 2 - 16, -1, 8, 2);
    ctx.fillStyle = trail3;
    ctx.fillRect(-bw / 2 - 24, 0, 16, 1);

    if (this.animFrame % 2 === 0) {
      ctx.fillStyle = sparkColor;
      ctx.fillRect(-bw / 2 - 10, -2, 2, 1);
      ctx.fillRect(-bw / 2 - 12, 1, 2, 1);
    }
  }

  private renderFreezeBullet(ctx: CanvasRenderingContext2D, bw: number): void {
    const snowSize = 6;
    const cx = 0;
    const cy = 0;

    // 性能优化：去除 shadowBlur，用外圈半透明圆模拟发光
    ctx.fillStyle = 'rgba(136, 238, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#88EEFF';

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const lx = cx + Math.cos(angle) * snowSize;
      const ly = cy + Math.sin(angle) * snowSize;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(lx, ly);
      ctx.strokeStyle = '#88EEFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#CCFFFF';
      ctx.beginPath();
      ctx.arc(lx, ly, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#CCFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    const trailLen = 20;
    ctx.fillStyle = '#88EEFF';
    for (let i = 1; i <= 3; i++) {
      const alpha = 0.8 - i * 0.25;
      const len = trailLen * i;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-len - bw / 2, -1 - i * 0.5, len, 2 + i);
    }
    ctx.globalAlpha = 1;

    if (this.animFrame % 3 === 0) {
      ctx.fillStyle = '#88EEFF';
      for (let i = 0; i < 3; i++) {
        const px = -bw / 2 - 15 - i * 6;
        const py = Math.sin(this.animFrame * 0.3 + i) * 2;
        ctx.globalAlpha = 0.4 - i * 0.1;
        ctx.beginPath();
        ctx.arc(px, py, 1 + i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  private renderBombBullet(ctx: CanvasRenderingContext2D, bw: number): void {
    // 性能优化：去除 shadowBlur，用外圈半透明圆模拟发光
    ctx.fillStyle = 'rgba(255, 102, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF6600';

    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(3, -2);
    ctx.lineTo(3, 2);
    ctx.lineTo(0, 4);
    ctx.lineTo(-3, 2);
    ctx.lineTo(-3, -2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFAA00';
    ctx.beginPath();
    ctx.moveTo(0, -2.5);
    ctx.lineTo(1.5, -1);
    ctx.lineTo(1.5, 1);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-1.5, 1);
    ctx.lineTo(-1.5, -1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFDD88';
    ctx.beginPath();
    ctx.arc(0, -1, 1, 0, Math.PI * 2);
    ctx.fill();

    const trailLen = 25;
    ctx.fillStyle = '#FF6400';
    for (let i = 1; i <= 3; i++) {
      const alpha = 0.9 - i * 0.25;
      const len = trailLen * i;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-len - bw / 2, -1.5 - i * 0.5, len, 3 + i);
    }
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#FF3200';
    ctx.fillRect(-trailLen * 3 - bw / 2, -1, trailLen, 2);
    ctx.globalAlpha = 1;

    if (this.animFrame % 2 === 0) {
      for (let i = 0; i < 4; i++) {
        const px = -bw / 2 - 12 - i * 5;
        const py = (Math.random() - 0.5) * 4;
        ctx.fillStyle = `rgba(255, ${80 + i * 40}, 0, ${0.5 - i * 0.1})`;
        ctx.beginPath();
        ctx.arc(px, py, 1 + Math.random(), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderPoisonBullet(ctx: CanvasRenderingContext2D, bw: number): void {
    // 性能优化：去除 shadowBlur，用外圈半透明圆模拟发光
    ctx.fillStyle = 'rgba(102, 255, 102, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#66FF66';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#AAFFAA';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i + this.animFrame * 0.05;
      const l = 4 + Math.sin(this.animFrame * 0.2 + i) * 1.5;
      const px = Math.cos(angle) * l;
      const py = Math.sin(angle) * l;
      ctx.fillStyle = `rgba(100, 255, 100, ${0.4 + Math.sin(this.animFrame * 0.3 + i) * 0.2})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const trailLen = 18;
    ctx.fillStyle = '#64FF64';
    for (let i = 1; i <= 3; i++) {
      const alpha = 0.7 - i * 0.2;
      const len = trailLen * i;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-len - bw / 2, -1 - i * 0.5, len, 2 + i);
    }
    ctx.globalAlpha = 1;

    if (this.animFrame % 2 === 0) {
      ctx.fillStyle = '#64FF64';
      for (let i = 0; i < 3; i++) {
        const px = -bw / 2 - 10 - i * 7;
        const py = Math.sin(this.animFrame * 0.3 + i) * 3;
        const size = 1.5 + Math.sin(this.animFrame * 0.4 + i) * 0.5;
        ctx.globalAlpha = 0.3 - i * 0.08;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  private renderFireShotBullet(ctx: CanvasRenderingContext2D, bw: number): void {
    // 性能优化：去除 shadowBlur，用外圈半透明圆模拟发光
    ctx.fillStyle = 'rgba(255, 102, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF6600';
    ctx.beginPath();
    ctx.moveTo(2, -3);
    ctx.lineTo(3, -2);
    ctx.lineTo(3, 2);
    ctx.lineTo(2, 3);
    ctx.lineTo(-2, 2);
    ctx.lineTo(-3, -1);
    ctx.lineTo(-2, -3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFCC00';
    ctx.beginPath();
    ctx.moveTo(1, -2);
    ctx.lineTo(2, -1);
    ctx.lineTo(2, 1);
    ctx.lineTo(1, 2);
    ctx.lineTo(-1, 1);
    ctx.lineTo(-2, -1);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 / 4) * i + this.animFrame * 0.1;
      const l = 4 + Math.sin(this.animFrame * 0.3 + i) * 2;
      const px = Math.cos(angle) * l;
      const py = Math.sin(angle) * l;
      ctx.fillStyle = `rgba(255, 100, 0, ${0.5 + Math.sin(this.animFrame * 0.4 + i) * 0.3})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.5 + Math.sin(this.animFrame * 0.5 + i) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const trailLen = 20;
    ctx.fillStyle = '#FF6400';
    for (let i = 1; i <= 3; i++) {
      const alpha = 0.6 - i * 0.15;
      const len = trailLen * i;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-len - bw / 2, -1.5 - i * 0.5, len, 3 + i);
    }
    ctx.globalAlpha = 1;
  }

  private renderPoisonShotBullet(ctx: CanvasRenderingContext2D, bw: number): void {
    // 性能优化：去除 shadowBlur，用外圈半透明圆模拟发光
    ctx.fillStyle = 'rgba(68, 204, 68, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#44CC44';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#88EE88';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-1, -1, 0.8, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i + this.animFrame * 0.08;
      const l = 5 + Math.sin(this.animFrame * 0.25 + i) * 2;
      const px = Math.cos(angle) * l;
      const py = Math.sin(angle) * l;
      ctx.fillStyle = `rgba(68, 204, 68, ${0.4 + Math.sin(this.animFrame * 0.35 + i) * 0.25})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const trailLen = 16;
    ctx.fillStyle = '#44CC44';
    for (let i = 1; i <= 3; i++) {
      const alpha = 0.5 - i * 0.12;
      const len = trailLen * i;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-len - bw / 2, -1 - i * 0.4, len, 2 + i * 0.5);
    }
    ctx.globalAlpha = 1;
  }

  private renderIceShotBullet(ctx: CanvasRenderingContext2D, bw: number): void {
    // 性能优化：去除 shadowBlur，用外圈半透明圆模拟发光
    ctx.fillStyle = 'rgba(68, 170, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#44AAFF';
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(3, -2);
    ctx.lineTo(3, 2);
    ctx.lineTo(0, 4);
    ctx.lineTo(-3, 2);
    ctx.lineTo(-3, -2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#88EEFF';
    ctx.beginPath();
    ctx.moveTo(0, -2.5);
    ctx.lineTo(2, -1);
    ctx.lineTo(2, 1);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-2, 1);
    ctx.lineTo(-2, -1);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const l = 5;
      const px = Math.cos(angle) * l;
      const py = Math.sin(angle) * l;
      ctx.fillStyle = `rgba(68, 170, 255, ${0.3 + Math.sin(this.animFrame * 0.2 + i) * 0.2})`;
      ctx.beginPath();
      ctx.arc(px, py, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    const trailLen = 18;
    ctx.fillStyle = '#44AAFF';
    for (let i = 1; i <= 3; i++) {
      const alpha = 0.55 - i * 0.14;
      const len = trailLen * i;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-len - bw / 2, -1 - i * 0.5, len, 2 + i);
    }
    ctx.globalAlpha = 1;
  }

  // 波浪电击弹渲染：50px 正弦波，带流动动画和电光效果
  // cloneIdx: -1=玩家(青色)，0=第一个分身(黄色)，1=第二个分身(银白色)
  private renderWaveBullet(ctx: CanvasRenderingContext2D, bw: number, phase: number, lvl: number, cloneIdx: number = -1): void {
    const waveLen = bw; // 50px
    const amp = 4 + lvl * 0.5; // 波幅随等级增长
    const segments = 20;

    // 颜色方案：玩家青色，第一个分身黄色，第二个分身银白色
    let mainColor: string, innerColor: string, glowColor: string, sparkColor: string, headColor: string;
    if (cloneIdx === 0) {
      // 第一个分身：黄色
      mainColor = '#FFDD22';
      innerColor = '#FFFFAA';
      glowColor = '#FFAA00';
      sparkColor = 'rgba(255, 220, 80, ';
      headColor = '#FFFFEE';
    } else if (cloneIdx === 1) {
      // 第二个分身：银白色
      mainColor = '#DDDDDD';
      innerColor = '#FFFFFF';
      glowColor = '#AAAAAA';
      sparkColor = 'rgba(255, 255, 255, ';
      headColor = '#FFFFFF';
    } else {
      // 玩家：青色
      mainColor = '#00DDFF';
      innerColor = '#AAEEFF';
      glowColor = '#00DDFF';
      sparkColor = 'rgba(170, 238, 255, ';
      headColor = '#FFFFFF';
    }

    // 外层辉光（性能优化：去除 shadowBlur，改用双层 stroke 模拟发光）
    ctx.strokeStyle = glowColor;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -waveLen / 2 + t * waveLen;
      const y = Math.sin(t * Math.PI * 3 + phase) * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 主波浪线
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -waveLen / 2 + t * waveLen;
      const y = Math.sin(t * Math.PI * 3 + phase) * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 内层亮线
    ctx.strokeStyle = innerColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -waveLen / 2 + t * waveLen;
      const y = Math.sin(t * Math.PI * 3 + phase) * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 弹头亮点
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(waveLen / 2, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 电火花粒子
    if (this.animFrame % 2 === 0) {
      for (let i = 0; i < 3; i++) {
        const sparkX = -waveLen / 2 + Math.random() * waveLen;
        const sparkY = (Math.random() - 0.5) * amp * 2;
        ctx.fillStyle = `${sparkColor}${0.3 + Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 0.8 + Math.random(), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * 怪物体型 → 贴图 + 色相/亮度/发光参数映射
   * 20+ 种怪物按 4 种体型 + hue-rotate/brightness 改色区分
   */
  private monsterTextureProfile(name: string): {
    body: 'tall' | 'stout' | 'heavy' | 'boss';
    hueRotate: number;     // deg: hue-rotate
    brightness: number;    // 0.8-1.2
    saturate: number;      // 0.8-1.4
    glowColor: string;     // drop-shadow 外发光颜色
    glowAlpha: number;     // 0.2-0.6
    breatheAmp: number;    // 呼吸浮动幅度（像素）
    pulseAmp: number;      // 行走脉冲缩放幅度（0-0.1）
    walkSway: number;      // 移动左右晃动幅度（像素）
  } {
    switch (name) {
      // —— 瘦高 humanoid-tall：丧尸/掠夺者/感染者/刺客/远程射手 ——
      case '丧尸':
        return { body: 'tall', hueRotate: 0, brightness: 0.95, saturate: 1.0, glowColor: '176, 38, 255', glowAlpha: 0.3, breatheAmp: 0.8, pulseAmp: 0.02, walkSway: 0.6 };
      case '掠夺者':
        return { body: 'tall', hueRotate: 20, brightness: 1.05, saturate: 1.15, glowColor: '0, 245, 212', glowAlpha: 0.35, breatheAmp: 1.0, pulseAmp: 0.03, walkSway: 0.8 };
      case '感染者':
        return { body: 'tall', hueRotate: 60, brightness: 1.0, saturate: 1.25, glowColor: '255, 0, 128', glowAlpha: 0.4, breatheAmp: 1.2, pulseAmp: 0.035, walkSway: 0.9 };
      case '刺客':
        return { body: 'tall', hueRotate: 300, brightness: 1.1, saturate: 0.95, glowColor: '128, 90, 213', glowAlpha: 0.5, breatheAmp: 1.5, pulseAmp: 0.045, walkSway: 1.2 };
      case '远程射手':
        return { body: 'tall', hueRotate: 160, brightness: 1.0, saturate: 1.05, glowColor: '91, 163, 224', glowAlpha: 0.35, breatheAmp: 0.7, pulseAmp: 0.015, walkSway: 0.5 };

      // —— 矮胖 stout：变异体/巨型蜘蛛 ——
      case '变异体':
        return { body: 'stout', hueRotate: 340, brightness: 1.0, saturate: 1.1, glowColor: '255, 107, 59', glowAlpha: 0.4, breatheAmp: 1.0, pulseAmp: 0.03, walkSway: 0.8 };
      case '巨型蜘蛛':
        return { body: 'stout', hueRotate: 100, brightness: 1.05, saturate: 1.3, glowColor: '128, 224, 64', glowAlpha: 0.45, breatheAmp: 1.4, pulseAmp: 0.05, walkSway: 1.1 };

      // —— 重装 heavy：暴徒/重装兵/机甲兵/狙击机器人 ——
      case '暴徒':
        return { body: 'heavy', hueRotate: 15, brightness: 1.05, saturate: 1.0, glowColor: '255, 140, 0', glowAlpha: 0.4, breatheAmp: 0.7, pulseAmp: 0.015, walkSway: 0.5 };
      case '重装兵':
        return { body: 'heavy', hueRotate: 210, brightness: 1.0, saturate: 1.05, glowColor: '91, 163, 224', glowAlpha: 0.45, breatheAmp: 0.6, pulseAmp: 0.01, walkSway: 0.4 };
      case '机甲兵':
        return { body: 'heavy', hueRotate: 250, brightness: 1.1, saturate: 1.1, glowColor: '176, 38, 255', glowAlpha: 0.5, breatheAmp: 0.7, pulseAmp: 0.02, walkSway: 0.5 };
      case '狙击机器人':
        return { body: 'heavy', hueRotate: 180, brightness: 1.05, saturate: 1.0, glowColor: '0, 245, 212', glowAlpha: 0.4, breatheAmp: 0.5, pulseAmp: 0.01, walkSway: 0.3 };

      // —— BOSS 按小怪风格重制：分散到 tall/stout/heavy 三种体型，靠 hue/发光/幅度 区分 ——
      // 高达：重装机械人形 → heavy
      case '高达':
        return { body: 'heavy', hueRotate: 210, brightness: 1.15, saturate: 1.2, glowColor: '91, 163, 224', glowAlpha: 0.55, breatheAmp: 1.5, pulseAmp: 0.02, walkSway: 0.6 };
      // 异形：瘦高人形异星生物 → tall
      case '异形':
        return { body: 'tall', hueRotate: 120, brightness: 1.05, saturate: 1.35, glowColor: '128, 224, 64', glowAlpha: 0.6, breatheAmp: 1.8, pulseAmp: 0.03, walkSway: 0.8 };
      // 战争坦克：矮胖机械 → stout
      case '战争坦克':
        return { body: 'stout', hueRotate: 10, brightness: 1.1, saturate: 1.05, glowColor: '255, 140, 0', glowAlpha: 0.55, breatheAmp: 0.6, pulseAmp: 0.008, walkSway: 0.25 };
      // 异星母巢：矮胖有机体 → stout
      case '异星母巢':
        return { body: 'stout', hueRotate: 300, brightness: 1.05, saturate: 1.3, glowColor: '255, 0, 128', glowAlpha: 0.65, breatheAmp: 2.0, pulseAmp: 0.025, walkSway: 0.7 };
      // 机械巨龙：瘦长龙形 → tall
      case '机械巨龙':
        return { body: 'tall', hueRotate: 0, brightness: 1.2, saturate: 1.15, glowColor: '255, 230, 0', glowAlpha: 0.6, breatheAmp: 2.2, pulseAmp: 0.03, walkSway: 0.8 };
      // 炼狱枷锁：赛博枷锁（纯Canvas绘制，不走贴图）→ none 触发回退
      case '炼狱枷锁':
        return { body: 'none' as any, hueRotate: 330, brightness: 1.05, saturate: 1.15, glowColor: '255, 0, 80', glowAlpha: 0.55, breatheAmp: 1.6, pulseAmp: 0.02, walkSway: 0.6 };
      // 灼炎领主：瘦高人形火领主 → tall
      case '灼炎领主':
        return { body: 'tall', hueRotate: 20, brightness: 1.25, saturate: 1.35, glowColor: '255, 107, 59', glowAlpha: 0.7, breatheAmp: 1.8, pulseAmp: 0.03, walkSway: 0.7 };
      // 剧毒女王：瘦高人形女王 → tall
      case '剧毒女王':
        return { body: 'tall', hueRotate: 90, brightness: 1.1, saturate: 1.4, glowColor: '155, 89, 182', glowAlpha: 0.65, breatheAmp: 2.0, pulseAmp: 0.025, walkSway: 0.75 };
      // 极寒君王：重装冰甲君王 → heavy
      case '极寒君王':
        return { body: 'heavy', hueRotate: 190, brightness: 1.15, saturate: 1.25, glowColor: '91, 192, 235', glowAlpha: 0.65, breatheAmp: 1.4, pulseAmp: 0.02, walkSway: 0.6 };
      // 雷霆主宰：瘦高人形雷领主 → tall
      case '雷霆主宰':
        return { body: 'tall', hueRotate: 50, brightness: 1.2, saturate: 1.2, glowColor: '255, 215, 0', glowAlpha: 0.7, breatheAmp: 2.0, pulseAmp: 0.035, walkSway: 0.8 };
      // 晶石巨魔：矮胖巨魔 → stout
      case '晶石巨魔':
        return { body: 'stout', hueRotate: 150, brightness: 1.15, saturate: 1.25, glowColor: '0, 245, 212', glowAlpha: 0.6, breatheAmp: 1.5, pulseAmp: 0.02, walkSway: 0.6 };
      // 世界BOSS·毁灭者：重装机械毁灭者 → heavy
      case '世界BOSS·毁灭者':
        return { body: 'heavy', hueRotate: 0, brightness: 1.25, saturate: 1.3, glowColor: '231, 76, 60', glowAlpha: 0.75, breatheAmp: 2.4, pulseAmp: 0.035, walkSway: 0.9 };
      default:
        // 其余未显式映射：按矮胖默认兜底，回退原绘制由调用方判定
        return { body: 'stout', hueRotate: 0, brightness: 1.0, saturate: 1.0, glowColor: '176, 38, 255', glowAlpha: 0.4, breatheAmp: 1.0, pulseAmp: 0.02, walkSway: 0.6 };
    }
  }

  /**
   * 通用怪物贴图渲染
   * 与角色同思路：drawImage(knockout canvas) + 全息滤镜（hue-rotate/brightness/saturate + drop-shadow 霓虹发光）
   * 移动动画：①呼吸上下浮动（sin 波） ②行走缩放脉冲（sin 波，模拟步伐） ③左右轻微晃动（cos 波，模拟走路摇摆）
   * 命中闪白：在命中帧用 brightness(3) saturate(0) 叠加层
   * 未加载贴图或沙袋怪 → 返回 false，调用方回退原像素绘制
   */
  private renderMonsterTexture(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
  ): boolean {
    const name = enemy.name;
    // 沙袋怪不贴图（调试用）
    if ((enemy as any).isSandbag && !(enemy as any).isMonsterSandbag) return false;

    const prof = this.monsterTextureProfile(name);
    const ko = this.monsterKnockouts[prof.body];
    if (!ko) return false;

    const { x, y, width, height } = enemy;
    const animF = (enemy.animFrame || 0) + this.animFrame * 0.15;
    const isFlash = enemy.hitFlash > 0;

    // 呼吸浮动 + 行走脉冲 + 左右晃动（移动动画）
    const breatheY = Math.sin(animF * 0.12) * prof.breatheAmp;
    const pulseScale = 1 + Math.sin(animF * 0.18) * prof.pulseAmp;
    const swayX = Math.cos(animF * 0.15) * prof.walkSway;

    // 计算贴图绘制尺寸：按怪物 hitbox 高度匹配，宽度按贴图宽高比
    const koW = ko.width || 1;
    const koH = ko.height || 1;
    const drawH = height;
    const drawW = (koW / koH) * drawH;
    // 水平居中于 hitbox
    let drawX = x + (width - drawW) / 2 + swayX;
    let drawY = y - drawH + height + breatheY;  // 底部对齐 hitbox 底部

    ctx.save();
    // 中心缩放（模拟步伐脉冲）
    const cx = drawX + drawW / 2;
    const cy = drawY + drawH / 2;
    ctx.translate(cx, cy);
    ctx.scale(pulseScale, pulseScale);
    ctx.translate(-cx, -cy);

    // 全息滤镜：hue-rotate 改色 + 亮度/饱和 + 双层霓虹发光
    const filterStr = [
      `hue-rotate(${prof.hueRotate}deg)`,
      `brightness(${prof.brightness})`,
      `saturate(${prof.saturate})`,
      `drop-shadow(0 0 6px rgba(${prof.glowColor}, ${prof.glowAlpha}))`,
      `drop-shadow(0 0 12px rgba(${prof.glowColor}, ${prof.glowAlpha * 0.5}))`,
    ].join(' ');
    ctx.filter = filterStr;
    ctx.globalAlpha = 0.97;
    ctx.drawImage(ko, drawX, drawY, drawW, drawH);

    // 命中闪白叠加层：先还原原滤镜位置再叠加
    if (isFlash) {
      ctx.filter = `${filterStr} brightness(2.5) saturate(0.2)`;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(ko, drawX, drawY, drawW, drawH);
    }
    ctx.restore();

    // 怪物底部霓虹地面光晕（贴合 hitbox 位置，给怪物一点"站稳在地面"的感觉）
    ctx.save();
    const haloY = y + height - 1;
    const haloW = Math.max(width, drawW * 0.8);
    const haloGrad = ctx.createRadialGradient(
      x + width / 2, haloY, 0,
      x + width / 2, haloY, haloW * 0.6,
    );
    haloGrad.addColorStop(0, `rgba(${prof.glowColor}, ${0.25 + prof.glowAlpha * 0.2})`);
    haloGrad.addColorStop(1, `rgba(${prof.glowColor}, 0)`);
    ctx.fillStyle = haloGrad;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x + width / 2 - haloW * 0.6, haloY - 4, haloW * 1.2, 8);
    ctx.restore();

    return true;
  }

  private renderEnemies(): void {
    const ctx = this.ctx;
    const enemies = this.enemyPool.getActive();
    const px = 2;

    for (const enemy of enemies) {
      ctx.save();

      const { x, y, width, height } = enemy;
      const isFlash = enemy.hitFlash > 0;

      // 优先使用贴图渲染；未加载贴图或沙袋怪时回退原像素绘制
      const useTexture = this.renderMonsterTexture(ctx, enemy);
      if (!useTexture) {
        if (enemy.name === '变异体') {
          this.renderMutant(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '掠夺者') {
          this.renderRaider(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '感染者') {
          this.renderInfected(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '暴徒') {
          this.renderBrute(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '巨型蜘蛛') {
          this.renderSpider(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '丧尸') {
          this.renderZombie(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '重装兵') {
          this.renderHeavyTrooper(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '机甲兵') {
          this.renderMechSoldier(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '狙击机器人') {
          this.renderSniperBot(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '战争坦克') {
          this.renderWarTank(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '异星母巢') {
          this.renderAlienHive(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '机械巨龙') {
          this.renderCyberDragon(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '远程射手') {
          this.renderRangedShooter(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '刺客') {
          this.renderAssassin(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '高达') {
          this.renderGundam(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if (enemy.name === '异形') {
          this.renderAlien(ctx, x, y, width, height, px, isFlash, enemy.color, enemy.animFrame);
        } else if ((enemy as any).isSandbag) {
          this.renderSandbag(ctx, x, y, width, height, isFlash);
        } else if (enemy.name === '炼狱枷锁') {
          this.renderPurgatoryChains(ctx, x, y, width, height, px, isFlash, enemy.animFrame);
        } else if (enemy.name === '灼炎领主') {
          this.renderPurgatoryFireLord(ctx, x, y, width, height, px, isFlash, enemy.animFrame);
        } else if (enemy.name === '剧毒女王') {
          this.renderPurgatoryPoisonQueen(ctx, x, y, width, height, px, isFlash, enemy.animFrame);
        } else if (enemy.name === '极寒君王') {
          this.renderPurgatoryIceKing(ctx, x, y, width, height, px, isFlash, enemy.animFrame);
        } else if (enemy.name === '雷霆主宰') {
          this.renderPurgatoryLightningLord(ctx, x, y, width, height, px, isFlash, enemy.animFrame);
        } else if (enemy.name === '晶石巨魔') {
          this.renderMaterialBoss(ctx, x, y, width, height, px, isFlash, enemy.animFrame);
        } else {
          ctx.fillStyle = isFlash ? '#FFFFFF' : enemy.color;
          ctx.fillRect(x, y, width, height);
        }
      }

      if (!(enemy as any).isSandbag || (enemy as any).isMonsterSandbag) {
        this.renderEnemyHealthBar(ctx, enemy);
      }

      const debuffs = (enemy as any).debuffs || [];
      const frozenUntil = (enemy as any).frozenUntil;
      const now = performance.now();
      
      if (frozenUntil && now < frozenUntil) {
        const freezeProgress = (frozenUntil - now) / 3000;
        const ew = enemy.width;
        const eh = enemy.height;
        const ex = enemy.x;
        const ey = enemy.y;

        // 外层蓝色光晕
        ctx.shadowColor = '#00CCFF';
        ctx.shadowBlur = 16;
        // 冰蓝底色渐变
        const freezeGrad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
        freezeGrad.addColorStop(0, `rgba(100, 200, 255, ${0.3 + freezeProgress * 0.15})`);
        freezeGrad.addColorStop(0.5, `rgba(150, 220, 255, ${0.4 + freezeProgress * 0.2})`);
        freezeGrad.addColorStop(1, `rgba(80, 180, 240, ${0.35 + freezeProgress * 0.15})`);
        ctx.fillStyle = freezeGrad;
        ctx.fillRect(ex, ey, ew, eh);
        ctx.shadowBlur = 0;

        // 冰晶双层边框
        ctx.strokeStyle = '#AAEEFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(ex + 1, ey + 1, ew - 2, eh - 2);
        ctx.strokeStyle = 'rgba(200, 240, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(ex + 0.5, ey + 0.5, ew - 1, eh - 1);

        // 多层六角冰晶（大小渐变）
        const crystalSizes = [3, 2, 1.5];
        const crystalCounts = [3, 4, 5];
        for (let sz = 0; sz < 3; sz++) {
          ctx.fillStyle = sz === 0 ? '#E8F8FF' : sz === 1 ? '#C8EEFF' : 'rgba(200, 240, 255, 0.6)';
          ctx.strokeStyle = sz === 0 ? '#88DDFF' : sz === 1 ? 'rgba(136, 221, 255, 0.7)' : 'rgba(136, 221, 255, 0.4)';
          ctx.lineWidth = 0.8;
          for (let i = 0; i < crystalCounts[sz]; i++) {
            const offset = (sz * 0.15 + i * 0.2) % 1;
            const cx = ex + ew * (0.15 + offset * 0.7);
            const cy = ey + eh * (0.2 + ((i + sz) % 3) * 0.25);
            const r = crystalSizes[sz] + Math.sin(this.animFrame * 0.04 + i * 2 + sz) * 0.6;
            ctx.beginPath();
            for (let k = 0; k < 6; k++) {
              const ang = (Math.PI * 2 / 6) * k + this.animFrame * 0.015 * (sz % 2 === 0 ? 1 : -1);
              const px = cx + Math.cos(ang) * r;
              const py = cy + Math.sin(ang) * r;
              if (k === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }

        // 底部冰堆效果
        ctx.fillStyle = 'rgba(180, 230, 255, 0.7)';
        for (let i = 0; i < 4; i++) {
          const ix = ex + ew * (0.15 + i * 0.25);
          const ih = 3 + Math.sin(this.animFrame * 0.06 + i * 1.5) * 1;
          ctx.beginPath();
          ctx.moveTo(ix - 2.5, ey + eh);
          ctx.lineTo(ix, ey + eh + ih);
          ctx.lineTo(ix + 2.5, ey + eh);
          ctx.closePath();
          ctx.fill();
        }

        // 顶部冰刺
        ctx.fillStyle = 'rgba(170, 225, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
          const sx = ex + ew * (0.2 + i * 0.3);
          const sh = 4 + Math.sin(this.animFrame * 0.05 + i * 2) * 1.5;
          ctx.beginPath();
          ctx.moveTo(sx - 2, ey);
          ctx.lineTo(sx, ey - sh);
          ctx.lineTo(sx + 2, ey);
          ctx.closePath();
          ctx.fill();
        }

        // 飘散冰屑粒子
        if (this.animFrame % 2 === 0) {
          for (let i = 0; i < 4; i++) {
            const px = ex + Math.random() * ew;
            const py = ey + Math.random() * eh;
            const alpha = 0.5 + Math.random() * 0.4;
            ctx.fillStyle = `rgba(220, 245, 255, ${alpha})`;
            ctx.fillRect(px, py, 1.5, 1.5);
          }
        }
      }
      
      let debuffIconX = enemy.x;
      const debuffIconY = enemy.y - 6;
      const activeDebuffTypes: string[] = [];
      
      for (const debuff of debuffs) {
        if (!activeDebuffTypes.includes(debuff.type)) {
          activeDebuffTypes.push(debuff.type);
        }
      }
      
      if (enemy.stunTimer > 0) {
        activeDebuffTypes.push('stun');
      }
      
      for (const debuffType of activeDebuffTypes) {
        const effect = this.debuffEffects[debuffType];
        if (!effect) continue;
        
        if (effect.glowColor) {
          ctx.shadowColor = effect.glowColor;
          ctx.shadowBlur = 6;
        }
        
        switch (debuffType) {
          case 'curse':
            ctx.fillStyle = 'rgba(170, 0, 170, 0.3)';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            ctx.strokeStyle = '#AA00AA';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(enemy.x + 0.5, enemy.y + 0.5, enemy.width - 1, enemy.height - 1);
            ctx.setLineDash([]);
            
            if (this.animFrame % 8 < 4) {
              ctx.fillStyle = 'rgba(200, 50, 200, 0.4)';
              for (let i = 0; i < 3; i++) {
                const sx = enemy.x + enemy.width * (0.2 + i * 0.3);
                const sy = enemy.y + enemy.height * 0.3 + Math.sin(this.animFrame * 0.15 + i) * 3;
                ctx.beginPath();
                ctx.arc(sx, sy, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            break;
          case 'slow':
            ctx.fillStyle = 'rgba(136, 136, 255, 0.25)';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            ctx.fillStyle = 'rgba(150, 150, 255, 0.5)';
            for (let i = 0; i < 2; i++) {
              const sx = enemy.x + enemy.width * (0.3 + i * 0.4);
              const sy = enemy.y + enemy.height * 0.5 + Math.sin(this.animFrame * 0.1 + i * 2) * 2;
              ctx.fillRect(sx - 1, sy - 2, 2, 4);
            }
            break;
          case 'burn': {
            const ew = enemy.width;
            const eh = enemy.height;
            const ex = enemy.x;
            const ey = enemy.y;

            // 外层火焰光晕
            ctx.shadowColor = '#FF4400';
            ctx.shadowBlur = 14;
            const burnIntensity = 0.35 + Math.sin(this.animFrame * 0.3) * 0.1;
            const burnGrad = ctx.createLinearGradient(ex, ey + eh, ex, ey);
            burnGrad.addColorStop(0, `rgba(255, 60, 0, ${burnIntensity + 0.1})`);
            burnGrad.addColorStop(0.5, `rgba(255, 120, 0, ${burnIntensity})`);
            burnGrad.addColorStop(1, `rgba(255, 200, 50, ${burnIntensity - 0.1})`);
            ctx.fillStyle = burnGrad;
            ctx.fillRect(ex, ey, ew, eh);
            ctx.shadowBlur = 0;

            // 火焰边缘描边
            ctx.strokeStyle = '#FF5500';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(ex + 0.5, ey + 0.5, ew - 1, eh - 1);

            // 顶部跳动火焰群
            const flameCount = 5;
            for (let i = 0; i < flameCount; i++) {
              const fx = ex + ew * (0.1 + i * 0.2);
              const phase = this.animFrame * 0.25 + i * 1.2;
              const fh = 5 + Math.sin(phase) * 2.5;
              const fy = ey - fh + Math.sin(phase * 1.3) * 1.5;
              // 外焰（橙红）
              ctx.fillStyle = `rgba(255, 80, 0, ${0.75 + Math.sin(phase) * 0.15})`;
              ctx.beginPath();
              ctx.moveTo(fx - 2, ey);
              ctx.quadraticCurveTo(fx - 2.5, fy + fh * 0.3, fx, fy);
              ctx.quadraticCurveTo(fx + 2.5, fy + fh * 0.3, fx + 2, ey);
              ctx.closePath();
              ctx.fill();
              // 内焰（亮黄）
              ctx.fillStyle = `rgba(255, 230, 80, ${0.85 + Math.sin(phase * 1.5) * 0.1})`;
              ctx.beginPath();
              ctx.moveTo(fx - 1, ey);
              ctx.quadraticCurveTo(fx - 1.2, fy + fh * 0.4, fx, fy + fh * 0.15);
              ctx.quadraticCurveTo(fx + 1.2, fy + fh * 0.4, fx + 1, ey);
              ctx.closePath();
              ctx.fill();
            }

            // 上升火星粒子
            for (let i = 0; i < 5; i++) {
              const sx = ex + ew * (0.15 + i * 0.18 + Math.sin(this.animFrame * 0.2 + i * 1.3) * 0.05);
              const sy = ey - ((this.animFrame * 0.9 + i * 25) % 22);
              const alpha = 0.75 - ((this.animFrame * 0.9 + i * 25) % 22) / 28;
              const size = 1 + Math.sin(this.animFrame * 0.3 + i) * 0.5;
              ctx.fillStyle = `rgba(255, 180, 60, ${Math.max(0, alpha)})`;
              ctx.beginPath();
              ctx.arc(sx, sy, size, 0, Math.PI * 2);
              ctx.fill();
            }

            // 底部火焰舔舐
            for (let i = 0; i < 4; i++) {
              const fx = ex + ew * (0.15 + i * 0.25);
              const phase = this.animFrame * 0.2 + i * 1.5;
              const fh = 3 + Math.sin(phase) * 1.5;
              ctx.fillStyle = `rgba(255, 100, 0, ${0.5 + Math.sin(phase) * 0.2})`;
              ctx.beginPath();
              ctx.moveTo(fx - 1.5, ey + eh);
              ctx.quadraticCurveTo(fx, ey + eh - fh, fx + 1.5, ey + eh);
              ctx.closePath();
              ctx.fill();
            }
            break;
          }
          case 'poison': {
            const ew = enemy.width;
            const eh = enemy.height;
            const ex = enemy.x;
            const ey = enemy.y;

            // 毒雾光晕
            ctx.shadowColor = '#22DD22';
            ctx.shadowBlur = 10;
            const poisonIntensity = 0.2 + Math.sin(this.animFrame * 0.15 + 1) * 0.08;
            const poisonGrad = ctx.createRadialGradient(
              ex + ew / 2, ey + eh / 2, 0,
              ex + ew / 2, ey + eh / 2, Math.max(ew, eh) * 0.7
            );
            poisonGrad.addColorStop(0, `rgba(0, 255, 80, ${poisonIntensity + 0.1})`);
            poisonGrad.addColorStop(1, `rgba(0, 200, 50, ${poisonIntensity})`);
            ctx.fillStyle = poisonGrad;
            ctx.fillRect(ex, ey, ew, eh);
            ctx.shadowBlur = 0;

            // 毒液流动边框
            ctx.strokeStyle = '#00CC33';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 2]);
            ctx.lineDashOffset = -this.animFrame * 0.3;
            ctx.strokeRect(ex + 0.5, ey + 0.5, ew - 1, eh - 1);
            ctx.setLineDash([]);

            // 多个上下浮动的毒气泡
            const bubbleCount = 6;
            for (let i = 0; i < bubbleCount; i++) {
              const bx = ex + ew * (0.12 + (i % 4) * 0.25 + Math.sin(this.animFrame * 0.08 + i * 2) * 0.05);
              const by = ey + eh * (0.2 + Math.floor(i / 4) * 0.4) + Math.sin(this.animFrame * 0.1 + i * 1.5) * 3;
              const br = 2 + Math.sin(this.animFrame * 0.12 + i) * 0.5;
              // 气泡外层
              ctx.fillStyle = 'rgba(50, 255, 80, 0.35)';
              ctx.beginPath();
              ctx.arc(bx, by, br, 0, Math.PI * 2);
              ctx.fill();
              // 气泡内层高光
              ctx.fillStyle = 'rgba(150, 255, 150, 0.6)';
              ctx.beginPath();
              ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.4, 0, Math.PI * 2);
              ctx.fill();
            }

            // 滴落的毒液
            if (this.animFrame % 8 < 4) {
              ctx.fillStyle = 'rgba(0, 220, 50, 0.7)';
              for (let i = 0; i < 3; i++) {
                const dx = ex + ew * (0.2 + i * 0.35);
                const dropLen = 3 + Math.sin(this.animFrame * 0.1 + i * 2) * 1;
                ctx.beginPath();
                ctx.moveTo(dx - 1, ey + eh);
                ctx.lineTo(dx, ey + eh + dropLen);
                ctx.lineTo(dx + 1, ey + eh);
                ctx.closePath();
                ctx.fill();
              }
            }

            // 骷髅头毒气图标
            ctx.fillStyle = 'rgba(0, 200, 50, 0.8)';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            const skullY = ey - 4 + Math.sin(this.animFrame * 0.1) * 1;
            ctx.fillText('☠', ex + ew / 2, skullY);
            break;
          }
          case 'lightning': {
            const lightningIntensity = 0.2 + Math.sin(this.animFrame * 0.4) * 0.1;
            ctx.fillStyle = `rgba(255, 255, 0, ${lightningIntensity})`;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            if (this.animFrame % 6 < 2) {
              ctx.strokeStyle = '#FFFF88';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(enemy.x + enemy.width * 0.3, enemy.y);
              ctx.lineTo(enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.4);
              ctx.lineTo(enemy.x + enemy.width * 0.35, enemy.y + enemy.height * 0.7);
              ctx.lineTo(enemy.x + enemy.width * 0.6, enemy.y + enemy.height);
              ctx.stroke();
            }
            break;
          }
          case 'stun': {
            const stunIntensity = 0.15 + Math.sin(this.animFrame * 0.3) * 0.1;
            ctx.fillStyle = `rgba(255, 215, 0, ${stunIntensity})`;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            if (this.animFrame % 10 < 5) {
              ctx.fillStyle = '#FFD700';
              const starY = enemy.y - 4 + Math.sin(this.animFrame * 0.2) * 2;
              for (let i = 0; i < 3; i++) {
                const sx = enemy.x + enemy.width * (0.25 + i * 0.25);
                const sy = starY + Math.cos(this.animFrame * 0.15 + i) * 2;
                ctx.beginPath();
                ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            break;
          }
        }
        
        ctx.shadowBlur = 0;
      }
      
      if (activeDebuffTypes.length > 0) {
        // 头顶 debuff 图标条：精致贴图式（圆角方框 + 状态色边 + emoji + 倒计时数字）
        const maxIcons = Math.min(activeDebuffTypes.length, 5);
        const iconSize = 9;
        const iconGap = 1;
        const totalWidth = maxIcons * iconSize + (maxIcons - 1) * iconGap;
        const startX = enemy.x + enemy.width / 2 - totalWidth / 2;
        const iconY = enemy.y - iconSize - 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < maxIcons; i++) {
          const type = activeDebuffTypes[i];
          const effect = this.debuffEffects[type];
          if (!effect) continue;

          const ix = startX + i * (iconSize + iconGap);

          // 找到该 debuff 的剩余时间
          let remaining = 0;
          let duration = 0;
          if (type === 'stun' && enemy.stunTimer > 0) {
            remaining = enemy.stunTimer;
            duration = enemy.stunTimer;
          } else {
            const d = debuffs.find((dd: any) => dd.type === type);
            if (d) {
              const elapsed = performance.now() - d.startTime;
              remaining = Math.max(0, d.duration - elapsed);
              duration = d.duration;
            }
          }
          const remainSec = Math.ceil(remaining / 1000);

          // 背板：圆角方框 + 状态色描边
          ctx.fillStyle = 'rgba(20, 10, 30, 0.9)';
          this.roundRect(ctx, ix, iconY, iconSize, iconSize, 1.5);
          ctx.fill();
          ctx.strokeStyle = effect.color;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          // 内圈描边
          ctx.strokeStyle = effect.color;
          ctx.lineWidth = 0.3;
          ctx.globalAlpha = 0.5;
          this.roundRect(ctx, ix + 0.6, iconY + 0.6, iconSize - 1.2, iconSize - 1.2, 1);
          ctx.stroke();
          ctx.globalAlpha = 1;

          // emoji 图标（中央）
          ctx.font = '6px sans-serif';
          ctx.fillStyle = effect.color;
          ctx.fillText(effect.icon, ix + iconSize / 2, iconY + iconSize / 2 - 0.5);

          // 倒计时进度环（沿边框顶部画弧）
          if (duration > 0) {
            const progress = Math.max(0, Math.min(1, remaining / duration));
            const arcRadius = iconSize / 2 - 0.5;
            const cx = ix + iconSize / 2;
            const cy = iconY + iconSize / 2;
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.arc(cx, cy, arcRadius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            ctx.stroke();
          }

          // 倒计时数字（右下角小标）
          if (remainSec > 0) {
            ctx.font = '5px monospace';
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 0.5;
            const numText = remainSec > 99 ? '∞' : String(remainSec);
            // 描边数字
            ctx.strokeText(numText, ix + iconSize - 1, iconY + iconSize - 1);
            ctx.fillText(numText, ix + iconSize - 1, iconY + iconSize - 1);
          }
        }
        ctx.textBaseline = 'alphabetic';
      }

      ctx.restore();
    }
  }

  private renderMutant(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 8) % 4;
    const bodyOffset = walkCycle < 2 ? 1 * px : 0;
    const pulse = Math.sin(animFrame * 0.1) * 0.5;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    
    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    const bodyWidth = 6 * px + pulse;
    const bodyHeight = 8 * px + pulse;
    ctx.fillStyle = '#5D8B4A';
    ctx.fillRect(-bodyWidth / 2, -bodyHeight / 2 + bodyOffset, bodyWidth, bodyHeight);
    
    ctx.fillStyle = '#4A7A3A';
    ctx.fillRect(-bodyWidth / 2, -bodyHeight / 2 + bodyOffset + 2 * px, bodyWidth, bodyHeight - 2 * px);

    ctx.fillStyle = '#7A9B6A';
    ctx.beginPath();
    ctx.arc(-1 * px, -2 * px + bodyOffset, 1.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2 * px, -2 * px + bodyOffset, 1.5 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF5500';
    ctx.beginPath();
    ctx.arc(-1 * px, -2 * px + bodyOffset, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2 * px, -2 * px + bodyOffset, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3D5A2A';
    ctx.fillRect(-2 * px, 3 * px + bodyOffset, 1 * px, 2 * px);
    ctx.fillRect(1 * px, 3 * px + bodyOffset, 1 * px, 2 * px);

    ctx.restore();
  }
  private renderRaider(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 6) % 4;
    const legOffset = (walkCycle % 2 === 0 ? 1 : -1) * px;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    ctx.fillStyle = '#3D2914';
    ctx.fillRect(-2 * px, 8 * px + legOffset, 2 * px, 4 * px);
    ctx.fillRect(0, 8 * px - legOffset, 2 * px, 4 * px);

    ctx.fillStyle = '#8B6914';
    ctx.fillRect(-3 * px, 5 * px, 6 * px, 4 * px);

    ctx.fillStyle = '#6B4A08';
    ctx.fillRect(-2 * px, 4 * px, 4 * px, 2 * px);

    ctx.fillStyle = '#A07040';
    ctx.fillRect(-3 * px, -2 * px, 6 * px, 6 * px);

    ctx.fillStyle = '#7A5030';
    ctx.beginPath();
    ctx.arc(-3 * px, -1 * px, 1.5 * px, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3 * px, -1 * px, 1.5 * px, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#2A1A0D';
    ctx.beginPath();
    ctx.arc(-1 * px, -1 * px, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1 * px, -1 * px, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-0.5 * px, 1 * px, 1 * px, 2 * px);

    ctx.fillStyle = '#4A3728';
    ctx.fillRect(2 * px, 0, 3 * px, 1 * px);
    ctx.fillRect(3 * px, -1 * px, 2 * px, 3 * px);

    ctx.restore();
  }
  private renderInfected(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 7) % 4;
    const bodyOffset = (walkCycle % 2 === 0 ? 1 : -1) * px;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(-2 * px, 7 * px + bodyOffset, 2 * px, 4 * px);
    ctx.fillRect(0, 7 * px - bodyOffset, 2 * px, 4 * px);

    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(-3 * px, 3 * px, 6 * px, 5 * px);

    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(-2 * px, 2 * px, 4 * px, 2 * px);

    ctx.fillStyle = '#8B7A6A';
    ctx.fillRect(-3 * px, -2 * px, 6 * px, 5 * px);

    ctx.fillStyle = '#6B5B4B';
    ctx.fillRect(-3 * px, -1 * px, 2 * px, 4 * px);

    ctx.fillStyle = '#CC3333';
    ctx.beginPath();
    ctx.arc(-2 * px, 0, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1 * px, 0, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF5555';
    ctx.fillRect(-1 * px, 2 * px, 2 * px, 1 * px);

    ctx.fillStyle = '#4A3A3A';
    ctx.fillRect(-4 * px, 0, 2 * px, 3 * px);
    ctx.fillRect(2 * px, 0, 2 * px, 3 * px);

    ctx.fillStyle = '#7A2A2A';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-2 * px + i * 2, 4 * px, 0.5 * px, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderBrute(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 9) % 4;
    const legOffset = (walkCycle % 2 === 0 ? 1 : -1) * px;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    ctx.fillStyle = '#3D2914';
    ctx.fillRect(-3 * px, 9 * px + legOffset, 3 * px, 5 * px);
    ctx.fillRect(0, 9 * px - legOffset, 3 * px, 5 * px);

    ctx.fillStyle = '#5D4037';
    ctx.fillRect(-4 * px, 4 * px, 8 * px, 6 * px);

    ctx.fillStyle = '#4A3528';
    ctx.fillRect(-3 * px, 3 * px, 6 * px, 3 * px);

    ctx.fillStyle = '#8B694A';
    ctx.fillRect(-4 * px, -2 * px, 8 * px, 6 * px);

    ctx.fillStyle = '#6B4A30';
    ctx.fillRect(-4 * px, -1 * px, 2 * px, 5 * px);
    ctx.fillRect(2 * px, -1 * px, 2 * px, 5 * px);

    ctx.fillStyle = '#2A1A0D';
    ctx.beginPath();
    ctx.arc(-2 * px, 0, 0.8 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1 * px, 0, 0.8 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.moveTo(-0.5 * px, 2 * px);
    ctx.lineTo(0, 3 * px);
    ctx.lineTo(0.5 * px, 2 * px);
    ctx.fill();

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-5 * px, 1 * px, 3 * px, 4 * px);
    ctx.fillRect(2 * px, 1 * px, 3 * px, 4 * px);

    ctx.fillStyle = '#A06030';
    ctx.fillRect(-5 * px, 1 * px, 3 * px, 1 * px);
    ctx.fillRect(2 * px, 1 * px, 3 * px, 1 * px);

    ctx.restore();
  }

  private renderHeavyTrooper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 10) % 4;
    const legOffset = (walkCycle % 2 === 0 ? 1 : -1) * px;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    ctx.fillStyle = '#3D4A5A';
    ctx.fillRect(-3 * px, 10 * px + legOffset, 3 * px, 5 * px);
    ctx.fillRect(0, 10 * px - legOffset, 3 * px, 5 * px);

    ctx.fillStyle = '#4A5A6A';
    ctx.fillRect(-4 * px, 4 * px, 8 * px, 7 * px);

    ctx.fillStyle = '#5A6A7A';
    ctx.fillRect(-3 * px, 3 * px, 6 * px, 3 * px);

    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(-4 * px, -3 * px, 8 * px, 7 * px);

    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(-4 * px, -2 * px, 3 * px, 6 * px);
    ctx.fillRect(1 * px, -2 * px, 3 * px, 6 * px);

    ctx.fillStyle = '#FFCC00';
    ctx.fillRect(-2 * px, -1 * px, 4 * px, 2 * px);

    ctx.fillStyle = '#2A2A2A';
    ctx.beginPath();
    ctx.arc(-1 * px, 0, 0.6 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1 * px, 0, 0.6 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6A7A8A';
    ctx.fillRect(-2 * px, 1 * px, 1 * px, 3 * px);
    ctx.fillRect(1 * px, 1 * px, 1 * px, 3 * px);

    ctx.fillStyle = '#FF4400';
    ctx.fillRect(3 * px, -1 * px, 4 * px, 2 * px);

    ctx.fillStyle = '#FF6600';
    ctx.fillRect(6 * px, -1 * px, 1 * px, 2 * px);

    ctx.restore();
  }

  private renderMechSoldier(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 8) % 4;
    const legOffset = (walkCycle % 2 === 0 ? 1 : -1) * px;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    ctx.fillStyle = '#4A5568';
    ctx.fillRect(-3 * px, 11 * px + legOffset, 3 * px, 5 * px);
    ctx.fillRect(0, 11 * px - legOffset, 3 * px, 5 * px);

    ctx.fillStyle = '#5A6578';
    ctx.fillRect(-4 * px, 5 * px, 8 * px, 7 * px);

    ctx.fillStyle = '#6A7588';
    ctx.fillRect(-3 * px, 4 * px, 6 * px, 3 * px);

    ctx.fillStyle = '#2D3748';
    ctx.fillRect(-4 * px, -3 * px, 8 * px, 8 * px);

    ctx.fillStyle = '#4A5568';
    ctx.fillRect(-4 * px, -2 * px, 3 * px, 7 * px);
    ctx.fillRect(1 * px, -2 * px, 3 * px, 7 * px);

    ctx.fillStyle = '#63B3ED';
    ctx.fillRect(-2 * px, -1 * px, 4 * px, 2 * px);

    ctx.fillStyle = '#1A202C';
    ctx.beginPath();
    ctx.arc(-1 * px, 0, 0.6 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1 * px, 0, 0.6 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4FD1C5';
    ctx.fillRect(-2 * px, 2 * px, 1 * px, 3 * px);
    ctx.fillRect(1 * px, 2 * px, 1 * px, 3 * px);

    ctx.fillStyle = '#667EEA';
    ctx.fillRect(3 * px, -2 * px, 5 * px, 3 * px);
    ctx.fillRect(4 * px, -3 * px, 3 * px, 1 * px);

    ctx.fillStyle = '#F6AD55';
    ctx.fillRect(7 * px, -2 * px, 1 * px, 3 * px);

    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(8 * px, -0.5 * px, 0.8 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderWarTank(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const trackOffset = Math.floor(animFrame / 4) % 4;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(-10 * px, 4 * px, 4 * px, 6 * px);
    ctx.fillRect(6 * px, 4 * px, 4 * px, 6 * px);

    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = '#3A3A3A';
      ctx.fillRect(-10 * px, 5 * px + i * px + trackOffset % 2, 4 * px, 1 * px);
      ctx.fillRect(6 * px, 5 * px + i * px + trackOffset % 2, 4 * px, 1 * px);
    }

    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(-8 * px, -2 * px, 16 * px, 8 * px);

    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(-6 * px, -1 * px, 12 * px, 2 * px);

    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(-4 * px, -3 * px, 8 * px, 3 * px);

    ctx.fillStyle = '#FF4400';
    ctx.fillRect(6 * px, -4 * px, 8 * px, 3 * px);
    ctx.fillRect(13 * px, -5 * px, 2 * px, 5 * px);

    ctx.fillStyle = '#FF6600';
    ctx.fillRect(14 * px, -4 * px, 1 * px, 3 * px);

    ctx.fillStyle = '#FFCC00';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-4 * px + i * 3 * px, 1 * px, 1 * px, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#FF3300';
    ctx.beginPath();
    ctx.moveTo(-5 * px, 3 * px);
    ctx.lineTo(-4 * px, 4 * px);
    ctx.lineTo(-3 * px, 3 * px);
    ctx.fill();

    ctx.restore();
  }

  private renderAlienHive(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const pulse = Math.sin(animFrame * 0.08) * 1;
    const tentacleWave = Math.sin(animFrame * 0.1);

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    ctx.fillStyle = '#5D2D7A';
    ctx.beginPath();
    ctx.arc(0, 0, 8 * px + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4A1F6A';
    ctx.beginPath();
    ctx.arc(0, 0, 6 * px + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7A3A9A';
    ctx.beginPath();
    ctx.arc(-3 * px, -2 * px, 1.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2 * px, -3 * px, 1.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3 * px, 2 * px, 1.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2 * px, 3 * px, 1.5 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2A0F4A';
    ctx.beginPath();
    ctx.arc(-3 * px, -2 * px, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2 * px, -3 * px, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3 * px, 2 * px, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2 * px, 3 * px, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#9A4AAA';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const tx = Math.cos(angle) * 9 * px;
      const ty = Math.sin(angle) * 9 * px + tentacleWave * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(tx, ty);
      ctx.lineWidth = 2 * px;
      ctx.strokeStyle = '#8A3A9A';
      ctx.stroke();
    }

    ctx.fillStyle = '#FF00FF';
    ctx.beginPath();
    ctx.arc(0, 0, 1 * px + Math.sin(animFrame * 0.2) * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#AA00AA';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + animFrame * 0.05;
      const px2 = 5 * px + Math.sin(animFrame * 0.1 + i) * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * px2, Math.sin(angle) * px2, 0.5 * px, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
  private renderRangedShooter(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 8) % 4;
    const bodyOffset = walkCycle < 2 ? 1 * px : 0;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
      return;
    }

    // 身体（紫袍射手）
    ctx.fillStyle = '#7B3FA0';
    ctx.fillRect(-4 * px, -5 * px + bodyOffset, 8 * px, 10 * px);

    // 暗紫阴影
    ctx.fillStyle = '#5D2E7D';
    ctx.fillRect(-4 * px, -1 * px + bodyOffset, 8 * px, 6 * px);

    // 兜帽头部
    ctx.fillStyle = '#6B2FA0';
    ctx.beginPath();
    ctx.arc(0, -4 * px + bodyOffset, 3 * px, 0, Math.PI * 2);
    ctx.fill();

    // 脸部阴影
    ctx.fillStyle = '#3D1A52';
    ctx.beginPath();
    ctx.arc(0, -3 * px + bodyOffset, 1.8 * px, 0, Math.PI * 2);
    ctx.fill();

    // 发光眼睛
    ctx.fillStyle = '#E040FF';
    ctx.beginPath();
    ctx.arc(-1 * px, -3.5 * px + bodyOffset, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1 * px, -3.5 * px + bodyOffset, 0.5 * px, 0, Math.PI * 2);
    ctx.fill();

    // 弓（左侧持弓，弧形）
    ctx.strokeStyle = '#C0C0C0';
    ctx.lineWidth = 0.8 * px;
    ctx.beginPath();
    ctx.arc(-6 * px, 0 + bodyOffset, 5 * px, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    // 弓弦
    ctx.strokeStyle = '#E8E8E8';
    ctx.lineWidth = 0.3 * px;
    ctx.beginPath();
    ctx.moveTo(-6 * px + 3 * px, -3 * px + bodyOffset);
    ctx.lineTo(-6 * px + 3 * px, 3 * px + bodyOffset);
    ctx.stroke();

    // 腿
    ctx.fillStyle = '#4A1D6B';
    const legOffset = walkCycle < 2 ? 0.5 * px : -0.5 * px;
    ctx.fillRect(-2.5 * px, 5 * px + bodyOffset, 2 * px, 4 * px + legOffset);
    ctx.fillRect(0.5 * px, 5 * px + bodyOffset, 2 * px, 4 * px - legOffset);

    ctx.restore();
  }
  // 巨型蜘蛛渲染
  private renderSpider(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 5) % 4;
    const legOffset = (walkCycle % 2 === 0 ? 1 : -1) * px;
    const pulse = Math.sin(animFrame * 0.15) * 0.3;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // 8条腿（4对）
    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = 1 * px;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const legY = -3 * px + i * 2 * px;
      const legLen = 4 * px + pulse;
      ctx.moveTo(-1 * px, legY);
      ctx.lineTo(-legLen, legY + legOffset);
      ctx.moveTo(1 * px, legY);
      ctx.lineTo(legLen, legY - legOffset);
    }
    ctx.stroke();

    // 身体（椭圆）
    ctx.fillStyle = '#3D3D3D';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.5 * px + pulse, 2.5 * px + pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // 头部
    ctx.fillStyle = '#2A2A2A';
    ctx.beginPath();
    ctx.arc(0, -2 * px, 2 * px, 0, Math.PI * 2);
    ctx.fill();

    // 8只红色眼睛
    ctx.fillStyle = '#FF2200';
    for (let i = 0; i < 4; i++) {
      const ex = -1.5 * px + i * px;
      ctx.beginPath();
      ctx.arc(ex, -2.5 * px, 0.4 * px, 0, Math.PI * 2);
      ctx.fill();
    }

    // 毒牙
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(-0.5 * px, -1 * px);
    ctx.lineTo(-1 * px, 0.5 * px);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.5 * px, -1 * px);
    ctx.lineTo(1 * px, 0.5 * px);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 丧尸渲染
  private renderZombie(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 10) % 4;
    const bodySway = Math.sin(animFrame * 0.08) * 0.8 * px;
    const armSwing = Math.sin(animFrame * 0.1) * 2 * px;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // 双腿（拖沓）
    ctx.fillStyle = '#3A4A3A';
    ctx.fillRect(-2 * px, 3 * px, 1.5 * px, 5 * px);
    ctx.fillRect(0.5 * px, 3 * px, 1.5 * px, 5 * px + (walkCycle % 2 === 0 ? 1 : 0));

    // 身体（倾斜）
    ctx.save();
    ctx.rotate(bodySway * 0.05);
    ctx.fillStyle = '#5A6B5A';
    ctx.fillRect(-3 * px, -4 * px, 6 * px, 8 * px);

    // 破损衣服纹理
    ctx.fillStyle = '#3D4D3D';
    ctx.fillRect(-3 * px, 0, 6 * px, 1 * px);
    ctx.fillRect(-2 * px, 2 * px, 2 * px, 1 * px);

    // 双臂（前伸，僵尸特征）
    ctx.fillStyle = '#6A7B6A';
    ctx.fillRect(-4 * px, -3 * px, 1.5 * px, 5 * px + armSwing);
    ctx.fillRect(2.5 * px, -3 * px, 1.5 * px, 5 * px - armSwing);

    // 手（腐烂）
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(-4.5 * px, 2 * px + armSwing, 2 * px, 1.5 * px);
    ctx.fillRect(2.5 * px, 2 * px - armSwing, 2 * px, 1.5 * px);

    // 头部
    ctx.fillStyle = '#7A8B6A';
    ctx.beginPath();
    ctx.arc(0, -6 * px, 2.5 * px, 0, Math.PI * 2);
    ctx.fill();

    // 一只眼睛（另一只闭着/缺失）
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(-1 * px, -6.5 * px, 0.6 * px, 0, Math.PI * 2);
    ctx.fill();

    // 嘴（张开，流血）
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(-1 * px, -5 * px, 2 * px, 1.2 * px);
    ctx.restore();

    ctx.restore();
  }

  // 狙击机器人渲染
  private renderSniperBot(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 12) % 4;
    const legOffset = (walkCycle % 2 === 0 ? 1 : -1) * px;
    const scopeGlow = Math.sin(animFrame * 0.2) * 0.5 + 0.5;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // 双腿（机械）
    ctx.fillStyle = '#2A3A4A';
    ctx.fillRect(-2.5 * px, 3 * px, 2 * px, 6 * px + legOffset);
    ctx.fillRect(0.5 * px, 3 * px, 2 * px, 6 * px - legOffset);

    // 脚
    ctx.fillStyle = '#1A2A3A';
    ctx.fillRect(-3 * px, 8 * px + legOffset, 2.5 * px, 1.5 * px);
    ctx.fillRect(0.5 * px, 8 * px - legOffset, 2.5 * px, 1.5 * px);

    // 身体（装甲）
    ctx.fillStyle = '#4A90A4';
    ctx.fillRect(-3.5 * px, -4 * px, 7 * px, 8 * px);

    // 胸甲细节
    ctx.fillStyle = '#3A7084';
    ctx.fillRect(-3.5 * px, -4 * px, 7 * px, 2 * px);
    ctx.fillStyle = '#5AA0B4';
    ctx.fillRect(-2 * px, -2 * px, 4 * px, 1 * px);

    // 狙击枪（长管）
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(2 * px, -1 * px, 6 * px, 1.2 * px);
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(7 * px, -0.8 * px, 1.5 * px, 0.8 * px);

    // 瞄准镜
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(3 * px, -2 * px, 3 * px, 1 * px);
    // 瞄准镜红光（呼吸）
    ctx.fillStyle = `rgba(255, 50, 50, ${0.5 + scopeGlow * 0.5})`;
    ctx.beginPath();
    ctx.arc(4.5 * px, -1.5 * px, 0.6 * px, 0, Math.PI * 2);
    ctx.fill();

    // 头部（传感器）
    ctx.fillStyle = '#3A8094';
    ctx.beginPath();
    ctx.arc(0, -6 * px, 2.2 * px, 0, Math.PI * 2);
    ctx.fill();

    // 红色光学传感器（扫描线）
    ctx.fillStyle = '#FF3333';
    ctx.fillRect(-1.5 * px, -6.5 * px, 3 * px, 0.8 * px);
    // 扫描光点
    const scanX = -1.5 * px + (animFrame % 30) / 30 * 3 * px;
    ctx.fillStyle = '#FFAAAA';
    ctx.fillRect(scanX, -6.5 * px, 0.5 * px, 0.8 * px);

    // 天线
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 0.5 * px;
    ctx.beginPath();
    ctx.moveTo(1.5 * px, -7 * px);
    ctx.lineTo(2.5 * px, -9 * px);
    ctx.stroke();
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(2.5 * px, -9 * px, 0.4 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 机械巨龙渲染（BOSS）
  private renderCyberDragon(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const wingFlap = Math.sin(animFrame * 0.08) * 3 * px;
    const tailSway = Math.sin(animFrame * 0.06) * 2 * px;
    const eyeGlow = Math.sin(animFrame * 0.15) * 0.5 + 0.5;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // 翅膀（机械，后方）
    ctx.fillStyle = '#2A2A4E';
    ctx.beginPath();
    ctx.moveTo(-2 * px, -2 * px);
    ctx.lineTo(-12 * px, -8 * px - wingFlap);
    ctx.lineTo(-8 * px, 2 * px);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2 * px, -2 * px);
    ctx.lineTo(12 * px, -8 * px - wingFlap);
    ctx.lineTo(8 * px, 2 * px);
    ctx.closePath();
    ctx.fill();

    // 翅膀骨架
    ctx.strokeStyle = '#4A4A6E';
    ctx.lineWidth = 0.8 * px;
    ctx.beginPath();
    ctx.moveTo(-2 * px, -2 * px);
    ctx.lineTo(-10 * px, -6 * px - wingFlap);
    ctx.moveTo(2 * px, -2 * px);
    ctx.lineTo(10 * px, -6 * px - wingFlap);
    ctx.stroke();

    // 尾巴（机械节段）
    ctx.fillStyle = '#1A1A2E';
    for (let i = 0; i < 4; i++) {
      const tailX = -8 * px - i * 2 * px;
      const tailY = 2 * px + i * 0.5 * px + tailSway * (i / 4);
      ctx.fillRect(tailX, tailY, 2 * px, 1.5 * px);
    }
    // 尾刺
    ctx.fillStyle = '#FF3333';
    ctx.beginPath();
    ctx.moveTo(-16 * px, 4 * px + tailSway);
    ctx.lineTo(-18 * px, 5 * px + tailSway);
    ctx.lineTo(-16 * px, 6 * px + tailSway);
    ctx.closePath();
    ctx.fill();

    // 身体（机械装甲）
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(-6 * px, -5 * px, 12 * px, 10 * px);

    // 胸甲（冰蓝色能量核心）
    ctx.fillStyle = '#2A2A4E';
    ctx.fillRect(-5 * px, -4 * px, 10 * px, 8 * px);

    // 能量核心（发光）
    ctx.fillStyle = `rgba(0, 200, 255, ${0.6 + eyeGlow * 0.4})`;
    ctx.beginPath();
    ctx.arc(0, 0, 2 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(150, 230, 255, ${0.8 + eyeGlow * 0.2})`;
    ctx.beginPath();
    ctx.arc(0, 0, 1 * px, 0, Math.PI * 2);
    ctx.fill();

    // 装甲条纹
    ctx.fillStyle = '#3A3A5E';
    ctx.fillRect(-5 * px, -3 * px, 10 * px, 0.5 * px);
    ctx.fillRect(-5 * px, 2 * px, 10 * px, 0.5 * px);

    // 后腿
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(-4 * px, 5 * px, 2.5 * px, 4 * px);
    ctx.fillRect(1.5 * px, 5 * px, 2.5 * px, 4 * px);

    // 龙头（机械）
    ctx.fillStyle = '#2A2A4E';
    ctx.beginPath();
    ctx.moveTo(5 * px, -3 * px);
    ctx.lineTo(10 * px, -2 * px);
    ctx.lineTo(11 * px, 0);
    ctx.lineTo(10 * px, 2 * px);
    ctx.lineTo(5 * px, 3 * px);
    ctx.closePath();
    ctx.fill();

    // 角（机械尖刺）
    ctx.fillStyle = '#5A5A7E';
    ctx.beginPath();
    ctx.moveTo(7 * px, -3 * px);
    ctx.lineTo(8 * px, -6 * px);
    ctx.lineTo(9 * px, -3 * px);
    ctx.closePath();
    ctx.fill();

    // 眼睛（冰蓝色，发光）
    ctx.fillStyle = `rgba(0, 245, 255, ${0.7 + eyeGlow * 0.3})`;
    ctx.beginPath();
    ctx.arc(8 * px, -0.5 * px, 0.8 * px, 0, Math.PI * 2);
    ctx.fill();

    // 嘴/牙齿
    ctx.fillStyle = '#8888AA';
    ctx.fillRect(9 * px, 1 * px, 2 * px, 0.5 * px);
    ctx.fillStyle = '#FF3333';
    ctx.fillRect(9.5 * px, 1.5 * px, 0.4 * px, 0.8 * px);
    ctx.fillRect(10.2 * px, 1.5 * px, 0.4 * px, 0.8 * px);

    ctx.restore();
  }

  private renderAssassin(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 5) % 4;
    const bodyOffset = walkCycle < 2 ? 1.5 * px : 0;
    const bobOffset = Math.sin(animFrame * 0.2) * 0.5 * px;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2 + bobOffset);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
      return;
    }

    // 斗篷（暗红+黑）
    ctx.fillStyle = '#8B1A1A';
    ctx.beginPath();
    ctx.moveTo(-5 * px, -3 * px + bodyOffset);
    ctx.lineTo(-4 * px, 6 * px + bodyOffset);
    ctx.lineTo(4 * px, 6 * px + bodyOffset);
    ctx.lineTo(5 * px, -3 * px + bodyOffset);
    ctx.closePath();
    ctx.fill();

    // 斗篷内侧阴影
    ctx.fillStyle = '#5C0F0F';
    ctx.beginPath();
    ctx.moveTo(-3.5 * px, -1 * px + bodyOffset);
    ctx.lineTo(-3 * px, 5 * px + bodyOffset);
    ctx.lineTo(3 * px, 5 * px + bodyOffset);
    ctx.lineTo(3.5 * px, -1 * px + bodyOffset);
    ctx.closePath();
    ctx.fill();

    // 兜帽头
    ctx.fillStyle = '#7A1515';
    ctx.beginPath();
    ctx.arc(0, -4 * px + bodyOffset, 3 * px, 0, Math.PI * 2);
    ctx.fill();

    // 脸部暗影
    ctx.fillStyle = '#1A0505';
    ctx.beginPath();
    ctx.arc(0, -3 * px + bodyOffset, 1.8 * px, 0, Math.PI * 2);
    ctx.fill();

    // 发红光的眼睛
    ctx.fillStyle = '#FF4040';
    ctx.shadowColor = '#FF2020';
    ctx.shadowBlur = 2 * px;
    ctx.beginPath();
    ctx.arc(-1 * px, -3.5 * px + bodyOffset, 0.6 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1 * px, -3.5 * px + bodyOffset, 0.6 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 匕首（右手持）
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(4 * px, 1 * px + bodyOffset, 0.6 * px, 3 * px);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(3.8 * px, 3.8 * px + bodyOffset, 1 * px, 0.8 * px);

    ctx.restore();
  }
  // 高达渲染（大型机械装甲单位）
  private renderGundam(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 14) % 4;
    const legOffset = (walkCycle % 2 === 0 ? 1 : -1) * px;
    const eyeGlow = Math.sin(animFrame * 0.12) * 0.5 + 0.5;
    const reactorPulse = Math.sin(animFrame * 0.1) * 0.3 + 0.7;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // 双腿（重型机械腿）
    ctx.fillStyle = '#2A3A5A';
    ctx.fillRect(-8 * px, 8 * px + legOffset, 6 * px, 14 * px);
    ctx.fillRect(2 * px, 8 * px - legOffset, 6 * px, 14 * px);
    // 腿部装甲细节
    ctx.fillStyle = '#1A2A4A';
    ctx.fillRect(-8 * px, 12 * px + legOffset, 6 * px, 2 * px);
    ctx.fillRect(2 * px, 12 * px - legOffset, 6 * px, 2 * px);
    ctx.fillStyle = '#4A5A7A';
    ctx.fillRect(-7 * px, 16 * px + legOffset, 4 * px, 1 * px);
    ctx.fillRect(3 * px, 16 * px - legOffset, 4 * px, 1 * px);
    // 脚
    ctx.fillStyle = '#1A1A2A';
    ctx.fillRect(-9 * px, 21 * px + legOffset, 7 * px, 3 * px);
    ctx.fillRect(2 * px, 21 * px - legOffset, 7 * px, 3 * px);

    // 腰部
    ctx.fillStyle = '#3A4A6A';
    ctx.fillRect(-7 * px, 4 * px, 14 * px, 5 * px);
    ctx.fillStyle = '#2A3A5A';
    ctx.fillRect(-7 * px, 7 * px, 14 * px, 2 * px);

    // 主身体（胸甲，大型）
    ctx.fillStyle = '#3A4A6A';
    ctx.fillRect(-12 * px, -10 * px, 24 * px, 16 * px);
    // 胸甲左右分块
    ctx.fillStyle = '#2A3A5A';
    ctx.fillRect(-12 * px, -10 * px, 24 * px, 2 * px);
    ctx.fillRect(-1 * px, -10 * px, 2 * px, 16 * px);
    // 装甲条纹
    ctx.fillStyle = '#4A5A7A';
    ctx.fillRect(-11 * px, -7 * px, 9 * px, 1 * px);
    ctx.fillRect(2 * px, -7 * px, 9 * px, 1 * px);
    ctx.fillRect(-11 * px, -2 * px, 9 * px, 1 * px);
    ctx.fillRect(2 * px, -2 * px, 9 * px, 1 * px);

    // 核心反应堆（发光）
    ctx.fillStyle = `rgba(0, 200, 255, ${0.6 + reactorPulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(0, -2 * px, 2.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(180, 240, 255, ${0.8 + reactorPulse * 0.2})`;
    ctx.beginPath();
    ctx.arc(0, -2 * px, 1.2 * px, 0, Math.PI * 2);
    ctx.fill();

    // 双臂（重型机械臂）
    ctx.fillStyle = '#2A3A5A';
    ctx.fillRect(-16 * px, -8 * px, 5 * px, 14 * px);
    ctx.fillRect(11 * px, -8 * px, 5 * px, 14 * px);
    // 肩甲（带尖刺）
    ctx.fillStyle = '#4A5A7A';
    ctx.beginPath();
    ctx.moveTo(-16 * px, -10 * px);
    ctx.lineTo(-12 * px, -14 * px);
    ctx.lineTo(-8 * px, -10 * px);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16 * px, -10 * px);
    ctx.lineTo(12 * px, -14 * px);
    ctx.lineTo(8 * px, -10 * px);
    ctx.closePath();
    ctx.fill();
    // 手部（握盾/光剑）
    ctx.fillStyle = '#1A1A2A';
    ctx.fillRect(-17 * px, 5 * px, 6 * px, 4 * px);
    ctx.fillRect(11 * px, 5 * px, 6 * px, 4 * px);
    // 右手光剑（发光）
    ctx.fillStyle = `rgba(0, 245, 212, ${0.7 + eyeGlow * 0.3})`;
    ctx.fillRect(13.5 * px, -18 * px, 1.5 * px, 23 * px);
    ctx.fillStyle = `rgba(180, 255, 240, ${0.9})`;
    ctx.fillRect(13.8 * px, -18 * px, 0.8 * px, 23 * px);

    // 头部（机械，带V字天线）
    ctx.fillStyle = '#3A4A6A';
    ctx.beginPath();
    ctx.arc(0, -14 * px, 4 * px, 0, Math.PI * 2);
    ctx.fill();
    // 面甲
    ctx.fillStyle = '#1A1A2A';
    ctx.fillRect(-3 * px, -15 * px, 6 * px, 3 * px);
    // 双眼（发光传感器）
    ctx.fillStyle = `rgba(255, 50, 50, ${0.7 + eyeGlow * 0.3})`;
    ctx.fillRect(-2.5 * px, -14 * px, 1.8 * px, 1 * px);
    ctx.fillRect(0.7 * px, -14 * px, 1.8 * px, 1 * px);
    // V字天线
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.2 * px;
    ctx.beginPath();
    ctx.moveTo(-3 * px, -17 * px);
    ctx.lineTo(-5 * px, -21 * px);
    ctx.moveTo(3 * px, -17 * px);
    ctx.lineTo(5 * px, -21 * px);
    ctx.stroke();

    // 背部推进器（喷射火焰）
    ctx.fillStyle = `rgba(255, 150, 50, ${0.5 + reactorPulse * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(-8 * px, -8 * px);
    ctx.lineTo(-10 * px, -16 * px - reactorPulse * 4);
    ctx.lineTo(-6 * px, -8 * px);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8 * px, -8 * px);
    ctx.lineTo(10 * px, -16 * px - reactorPulse * 4);
    ctx.lineTo(6 * px, -8 * px);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 异形渲染（高攻击快速怪物）
  private renderAlien(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string, animFrame: number): void {
    const walkCycle = Math.floor(animFrame / 6) % 4;
    const bodyOffset = walkCycle < 2 ? 1 * px : 0;
    const tailSway = Math.sin(animFrame * 0.15) * 2 * px;
    const mouthOpen = Math.sin(animFrame * 0.2) * 0.5 + 0.5;
    const eyeGlow = Math.sin(animFrame * 0.18) * 0.4 + 0.6;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // 尾巴（长鞭状，带毒刺）
    ctx.strokeStyle = '#1A3A1A';
    ctx.lineWidth = 2 * px;
    ctx.beginPath();
    ctx.moveTo(-6 * px, 2 * px);
    ctx.quadraticCurveTo(-14 * px + tailSway, 4 * px, -20 * px + tailSway * 1.5, 10 * px);
    ctx.stroke();
    // 尾巴尖刺
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(-20 * px + tailSway * 1.5, 10 * px);
    ctx.lineTo(-23 * px + tailSway * 1.5, 8 * px);
    ctx.lineTo(-22 * px + tailSway * 1.5, 12 * px);
    ctx.closePath();
    ctx.fill();

    // 后腿（弯曲，兽性）
    ctx.fillStyle = '#2A4A2A';
    ctx.beginPath();
    ctx.moveTo(-7 * px, 6 * px + bodyOffset);
    ctx.lineTo(-9 * px, 14 * px + bodyOffset);
    ctx.lineTo(-4 * px, 18 * px + bodyOffset);
    ctx.lineTo(-2 * px, 10 * px + bodyOffset);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7 * px, 6 * px - bodyOffset);
    ctx.lineTo(9 * px, 14 * px - bodyOffset);
    ctx.lineTo(4 * px, 18 * px - bodyOffset);
    ctx.lineTo(2 * px, 10 * px - bodyOffset);
    ctx.closePath();
    ctx.fill();
    // 利爪脚
    ctx.fillStyle = '#1A1A0A';
    ctx.beginPath();
    ctx.moveTo(-5 * px, 18 * px + bodyOffset);
    ctx.lineTo(-7 * px, 21 * px + bodyOffset);
    ctx.lineTo(-3 * px, 21 * px + bodyOffset);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5 * px, 18 * px - bodyOffset);
    ctx.lineTo(7 * px, 21 * px - bodyOffset);
    ctx.lineTo(3 * px, 21 * px - bodyOffset);
    ctx.closePath();
    ctx.fill();

    // 主身体（流线型，带外骨骼）
    ctx.fillStyle = '#2A4A2A';
    ctx.beginPath();
    ctx.ellipse(0, 0 + bodyOffset, 11 * px, 8 * px, 0, 0, Math.PI * 2);
    ctx.fill();
    // 背部外骨骼脊（深色）
    ctx.fillStyle = '#1A3A1A';
    ctx.beginPath();
    ctx.ellipse(0, -2 * px + bodyOffset, 9 * px, 2 * px, 0, 0, Math.PI * 2);
    ctx.fill();
    // 背刺（多个尖刺）
    ctx.fillStyle = '#3A5A3A';
    for (let i = -2; i <= 2; i++) {
      const sx = i * 3 * px;
      ctx.beginPath();
      ctx.moveTo(sx - 1 * px, -3 * px + bodyOffset);
      ctx.lineTo(sx, -7 * px + bodyOffset);
      ctx.lineTo(sx + 1 * px, -3 * px + bodyOffset);
      ctx.closePath();
      ctx.fill();
    }

    // 前肢（长利爪，攻击姿态）
    ctx.fillStyle = '#2A4A2A';
    ctx.beginPath();
    ctx.moveTo(-8 * px, -2 * px + bodyOffset);
    ctx.lineTo(-14 * px, 2 * px + bodyOffset);
    ctx.lineTo(-13 * px, 6 * px + bodyOffset);
    ctx.lineTo(-7 * px, 4 * px + bodyOffset);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8 * px, -2 * px + bodyOffset);
    ctx.lineTo(14 * px, 2 * px + bodyOffset);
    ctx.lineTo(13 * px, 6 * px + bodyOffset);
    ctx.lineTo(7 * px, 4 * px + bodyOffset);
    ctx.closePath();
    ctx.fill();
    // 长利爪（4只）
    ctx.fillStyle = '#0A0A0A';
    for (let i = 0; i < 3; i++) {
      const cy = 3 * px + i * 1.5 * px + bodyOffset;
      ctx.beginPath();
      ctx.moveTo(-14 * px, cy);
      ctx.lineTo(-19 * px, cy + 1 * px);
      ctx.lineTo(-14 * px, cy + 2 * px);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(14 * px, cy);
      ctx.lineTo(19 * px, cy + 1 * px);
      ctx.lineTo(14 * px, cy + 2 * px);
      ctx.closePath();
      ctx.fill();
    }

    // 头部（延伸，带内巢嘴）
    ctx.fillStyle = '#2A4A2A';
    ctx.beginPath();
    ctx.ellipse(0, -10 * px + bodyOffset, 7 * px, 5 * px, 0, 0, Math.PI * 2);
    ctx.fill();
    // 头部脊骨
    ctx.fillStyle = '#1A3A1A';
    ctx.beginPath();
    ctx.ellipse(0, -12 * px + bodyOffset, 5 * px, 1.5 * px, 0, 0, Math.PI * 2);
    ctx.fill();

    // 嘴（内巢嘴，可张开）
    const mouthHeight = 1 * px + mouthOpen * 2 * px;
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(-3 * px, -8 * px + bodyOffset, 6 * px, mouthHeight);
    // 内巢牙齿（多圈）
    ctx.fillStyle = '#DDDDAA';
    for (let i = 0; i < 5; i++) {
      const tx = -2.5 * px + i * 1.2 * px;
      ctx.beginPath();
      ctx.moveTo(tx, -8 * px + bodyOffset);
      ctx.lineTo(tx + 0.4 * px, -8 * px + mouthHeight * 0.7 + bodyOffset);
      ctx.lineTo(tx + 0.8 * px, -8 * px + bodyOffset);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx, -8 * px + mouthHeight + bodyOffset);
      ctx.lineTo(tx + 0.4 * px, -8 * px + mouthHeight * 0.3 + bodyOffset);
      ctx.lineTo(tx + 0.8 * px, -8 * px + mouthHeight + bodyOffset);
      ctx.closePath();
      ctx.fill();
    }

    // 双眼（发光，嗜血）
    ctx.fillStyle = `rgba(255, 220, 0, ${0.7 + eyeGlow * 0.3})`;
    ctx.beginPath();
    ctx.arc(-3.5 * px, -11 * px + bodyOffset, 1 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3.5 * px, -11 * px + bodyOffset, 1 * px, 0, Math.PI * 2);
    ctx.fill();

    // 唾液（毒液滴）
    if (mouthOpen > 0.6) {
      ctx.fillStyle = `rgba(100, 200, 50, ${mouthOpen})`;
      ctx.beginPath();
      ctx.arc(0, -6 * px + bodyOffset, 0.6 * px, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderSandbag(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isFlash: boolean): void {
    const baseColor = isFlash ? '#FFFFFF' : '#A08060';
    const darkColor = isFlash ? '#DDDDDD' : '#7A5A3A';
    const lightColor = isFlash ? '#FFFFFF' : '#C0A080';
    const stitchColor = '#5A4028';

    // 沙袋主体
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, w, h);

    // 沙袋顶部收口
    ctx.fillStyle = darkColor;
    ctx.fillRect(x, y, w, 6);
    ctx.fillRect(x + 2, y + 6, w - 4, 2);

    // 沙袋底部收口
    ctx.fillRect(x, y + h - 6, w, 6);
    ctx.fillRect(x + 2, y + h - 8, w - 4, 2);

    // 竖向分段缝线（3道）
    ctx.fillStyle = stitchColor;
    const segW = w / 3;
    for (let i = 1; i < 3; i++) {
      const sx = x + segW * i;
      ctx.fillRect(sx - 1, y + 8, 2, h - 16);
    }

    // 横向缝线
    ctx.fillRect(x + 4, y + h * 0.3, w - 8, 1);
    ctx.fillRect(x + 4, y + h * 0.5, w - 8, 1);
    ctx.fillRect(x + 4, y + h * 0.7, w - 8, 1);

    // 左侧阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x, y + 6, 3, h - 12);

    // 右侧高光
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x + w - 3, y + 6, 3, h - 12);

    // 顶部绳索纹理
    ctx.fillStyle = '#4A3020';
    ctx.fillRect(x + 4, y + 1, w - 8, 1);
    ctx.fillRect(x + 4, y + 3, w - 8, 1);

    // 中心目标十字（便于瞄准）
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.fillRect(cx - 8, cy - 1, 16, 2);
    ctx.fillRect(cx - 1, cy - 8, 2, 16);
  }

  /** 炼狱枷锁：不规则扭曲锁链 — 混乱的束缚感 + 裂痕能量核 */
  private renderPurgatoryChains(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, animFrame: number): void {
    const t = animFrame;
    const pulse = Math.sin(t * 0.06) * 0.5 + 0.5;
    const breatheY = Math.sin(t * 0.04) * 2;
    const tremor = Math.sin(t * 0.12) * 1.5 + Math.sin(t * 0.07) * 1; // 不规则颤抖
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2 + breatheY);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // —— 地面混乱光晕（不规则椭圆）——
    const groundGlow = ctx.createRadialGradient(0, h / 2 - 4 * px, 0, 0, h / 2 - 4 * px, w * 0.55);
    groundGlow.addColorStop(0, `rgba(255, 0, 80, ${0.35 + pulse * 0.2})`);
    groundGlow.addColorStop(0.5, 'rgba(180, 30, 120, 0.15)');
    groundGlow.addColorStop(1, 'rgba(100, 10, 60, 0)');
    ctx.fillStyle = groundGlow;
    ctx.beginPath();
    ctx.ellipse(tremor * 0.3, h / 2 - 4 * px, w * 0.48 + tremor, 14 * px + tremor * 0.5, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // —— 外层破碎封印环（3段不连续）——
    ctx.save();
    ctx.rotate(t * 0.006 + tremor * 0.02);
    const ring1Angles = [0.2, 1.1, 2.3, 3.5, 4.8, 5.6]; // 3段弧
    ctx.strokeStyle = `rgba(160, 50, 180, ${0.5 + pulse * 0.3})`;
    ctx.lineWidth = 2.5 * px;
    for (let seg = 0; seg < ring1Angles.length - 1; seg += 2) {
      ctx.beginPath();
      ctx.arc(tremor * 0.2, tremor * 0.1, 38 * px + tremor * 0.3, ring1Angles[seg], ring1Angles[seg + 1]);
      ctx.stroke();
    }
    // 破碎铆钉（不规则位置）
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + tremor * 0.05;
      const r = 38 * px + (i % 3) * 2 + tremor * 0.3;
      const rx = Math.cos(ang) * r;
      const ry = Math.sin(ang) * r;
      ctx.fillStyle = '#2A1030';
      ctx.beginPath();
      ctx.arc(rx, ry, 1.2 * px, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 100, 255, ${0.6 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(rx, ry, 0.6 * px, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // —— 内层扭曲封印环（锯齿状）——
    ctx.save();
    ctx.rotate(-t * 0.01);
    ctx.strokeStyle = `rgba(255, 60, 100, ${0.4 + pulse * 0.3})`;
    ctx.lineWidth = 1.5 * px;
    ctx.beginPath();
    for (let i = 0; i <= 32; i++) {
      const ang = (i / 32) * Math.PI * 2;
      const r = 30 * px + Math.sin(ang * 5 + t * 0.05) * 3 + tremor;
      const px_ = Math.cos(ang) * r;
      const py_ = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px_, py_);
      else ctx.lineTo(px_, py_);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // —— 5条不规则扭曲锁链 ——
    const chainConfigs = [
      { angle: 0.3, length: 42, bend: 8, segments: 7 },
      { angle: 1.5, length: 38, bend: -6, segments: 6 },
      { angle: 2.8, length: 45, bend: 10, segments: 8 },
      { angle: 4.2, length: 35, bend: -8, segments: 5 },
      { angle: 5.5, length: 40, bend: 5, segments: 6 },
    ];

    for (let c = 0; c < chainConfigs.length; c++) {
      const cfg = chainConfigs[c];
      const baseAng = cfg.angle + tremor * 0.02;
      const bendDir = cfg.bend;
      const chainWave = Math.sin(t * 0.08 + c * 2.1) * 3;
      const innerR = 10 * px;
      const outerR = cfg.length * px;

      ctx.save();
      ctx.rotate(baseAng);

      // 不规则锁链路径（弯曲扭曲）
      const segCount = cfg.segments;
      for (let l = 0; l < segCount; l++) {
        const progress = l / (segCount - 1);
        const linkDist = innerR + progress * (outerR - innerR);
        // 沿路径弯曲
        const bendOffset = Math.sin(progress * Math.PI) * bendDir * px * 0.15;
        const waveOffset = Math.sin(progress * Math.PI * 2 + t * 0.1 + l) * chainWave;
        const twist = Math.sin(progress * 3 + t * 0.05) * 0.3;

        const lx = linkDist;
        const ly = bendOffset + waveOffset;

        // 不规则大小的链节
        const linkW = (3.5 + Math.sin(l * 1.3 + c) * 1.5) * px;
        const linkH = (2 + Math.sin(l * 0.8 + c * 0.5) * 0.8) * px;

        // 链节外层（暗金属）
        ctx.fillStyle = '#3A3545';
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(twist);
        ctx.beginPath();
        ctx.ellipse(0, 0, linkW, linkH, 0, 0, Math.PI * 2);
        ctx.fill();
        // 链节高光（不规则）
        ctx.fillStyle = '#5A5565';
        ctx.beginPath();
        ctx.ellipse(-linkW * 0.15, -linkH * 0.2, linkW * 0.7, linkH * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // 链节能量内核（脉冲）
        const linkGlow = 0.4 + Math.sin(t * 0.15 + l + c) * 0.4;
        ctx.fillStyle = `rgba(255, 80, 120, ${linkGlow})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, linkW * 0.5, linkH * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 断裂的连接线（有时断开）
        if (l < segCount - 1 && (l % 2 === 0 || Math.random() > 0.3)) {
          const nextProgress = (l + 1) / (segCount - 1);
          const nextDist = innerR + nextProgress * (outerR - innerR);
          const nextBend = Math.sin(nextProgress * Math.PI) * bendDir * px * 0.15;
          const nextWave = Math.sin(nextProgress * Math.PI * 2 + t * 0.1 + l + 1) * chainWave;

          ctx.strokeStyle = `rgba(74, 69, 85, ${0.6 + pulse * 0.3})`;
          ctx.lineWidth = 1.2 * px;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.quadraticCurveTo(
            (lx + nextDist) / 2 + Math.sin(t * 0.1 + l) * 2,
            (ly + nextBend + nextWave) / 2,
            nextDist, nextBend + nextWave
          );
          ctx.stroke();
        }
      }

      // 锁链末端破碎手铐
      const endX = outerR + tremor * 0.3;
      const endY = Math.sin(Math.PI) * bendDir * px * 0.15 + chainWave;
      // 不完整手铐弧
      ctx.strokeStyle = '#3A3545';
      ctx.lineWidth = 2.5 * px;
      ctx.beginPath();
      ctx.arc(endX, endY, 4 * px, Math.PI * 0.1 + tremor * 0.05, Math.PI * 0.75);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(endX, endY, 4 * px, Math.PI * 0.85, Math.PI * 1.2);
      ctx.stroke();
      // 发光边缘
      ctx.strokeStyle = `rgba(255, 60, 100, ${0.6 + pulse * 0.3})`;
      ctx.lineWidth = 1.2 * px;
      ctx.beginPath();
      ctx.arc(endX, endY, 4 * px, Math.PI * 0.1, Math.PI * 0.75);
      ctx.stroke();

      ctx.restore();
    }

    // —— 中央不规则能量核（带裂痕）——
    const coreR = 13 * px;
    // 不规则核心形状
    ctx.save();
    ctx.rotate(t * 0.02);
    const coreGrad = ctx.createRadialGradient(tremor * 0.3, tremor * 0.2, 0, 0, 0, coreR * 1.2);
    coreGrad.addColorStop(0, `rgba(255, 80, 100, ${0.9 + pulse * 0.1})`);
    coreGrad.addColorStop(0.4, `rgba(200, 40, 120, 0.85)`);
    coreGrad.addColorStop(0.8, `rgba(120, 20, 80, 0.9)`);
    coreGrad.addColorStop(1, 'rgba(50, 5, 40, 0.95)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const r = coreR + Math.sin(ang * 4 + t * 0.08) * 2 + tremor * 0.3;
      const cx = Math.cos(ang) * r;
      const cy = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 能量核裂痕（随机分布）
    ctx.strokeStyle = `rgba(255, 150, 180, ${0.6 + pulse * 0.3})`;
    ctx.lineWidth = 0.8 * px;
    const cracks = [
      [[0, -coreR * 0.8], [2, -coreR * 0.3], [-1, coreR * 0.2], [1, coreR * 0.6]],
      [[-coreR * 0.7, -2], [-coreR * 0.2, 1], [coreR * 0.3, -1]],
      [[coreR * 0.5, -3], [coreR * 0.1, 2], [-coreR * 0.2, 0]],
    ];
    for (const crack of cracks) {
      ctx.beginPath();
      ctx.moveTo(crack[0][0] + tremor * 0.2, crack[0][1]);
      for (let i = 1; i < crack.length; i++) {
        ctx.lineTo(crack[i][0] + tremor * 0.1, crack[i][1] + Math.sin(t * 0.1 + i) * 0.5);
      }
      ctx.stroke();
    }

    // 能量核内部混乱漩涡
    ctx.save();
    ctx.rotate(t * 0.04);
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 4 + tremor * 0.03);
      ctx.strokeStyle = `rgba(255, 150, 180, ${0.4 + pulse * 0.3})`;
      ctx.lineWidth = 0.8 * px;
      ctx.beginPath();
      ctx.arc(0, 0, coreR * 0.6, 0, Math.PI * (0.8 + Math.sin(t * 0.1 + i) * 0.3));
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // —— 漂浮的碎片粒子 ——
    for (let i = 0; i < 16; i++) {
      const pAng = (i / 16) * Math.PI * 2 + t * 0.02;
      const pDist = (15 + Math.sin(i * 1.5 + t * 0.05) * 10) * px;
      const pSize = (1 + Math.sin(i * 0.7) * 0.8) * px;
      const pAlpha = 0.5 + Math.sin(t * 0.1 + i) * 0.4;
      ctx.fillStyle = `rgba(255, 120, 160, ${pAlpha})`;
      ctx.save();
      ctx.translate(Math.cos(pAng) * pDist, Math.sin(pAng) * pDist);
      ctx.rotate(t * 0.05 + i);
      // 不规则碎片形状
      ctx.beginPath();
      ctx.moveTo(0, -pSize);
      ctx.lineTo(pSize * 0.7, pSize * 0.3);
      ctx.lineTo(-pSize * 0.5, pSize * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // —— 全息扫描线（斜向）——
    for (let i = 0; i < 4; i++) {
      const scanOffset = ((t * 3 + i * 50) % h) - h / 2;
      const scanAlpha = (1 - Math.abs(scanOffset) / (h / 2)) * 0.2;
      ctx.strokeStyle = `rgba(180, 100, 255, ${scanAlpha})`;
      ctx.lineWidth = 0.5 * px;
      ctx.beginPath();
      ctx.moveTo(-w / 2, scanOffset + tremor);
      ctx.lineTo(w / 2, scanOffset - tremor);
      ctx.stroke();
    }

    // —— 漂浮符文（不规则位置）——
    const runeChars = ['封', '禁', '锁', '印', '囚'];
    for (let i = 0; i < runeChars.length; i++) {
      const runeAng = t * 0.01 + (i / runeChars.length) * Math.PI * 2 + Math.sin(i * 1.2) * 0.5;
      const runeR = (42 + Math.sin(i * 0.8) * 6) * px;
      const rx = Math.cos(runeAng) * runeR + tremor * 0.3;
      const ry = Math.sin(runeAng) * runeR + tremor * 0.2;
      const runeAlpha = 0.4 + pulse * 0.3 + Math.sin(t * 0.08 + i) * 0.2;
      ctx.fillStyle = `rgba(255, 100, 180, ${runeAlpha})`;
      ctx.font = `bold ${(3.5 + Math.sin(i * 0.5)) * px}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(-runeAng + Math.sin(t * 0.1 + i) * 0.2);
      ctx.fillText(runeChars[i], 0, 0);
      ctx.restore();
    }

    // —— 顶部扭曲标题 ——
    ctx.fillStyle = `rgba(255, 80, 120, ${0.6 + pulse * 0.3})`;
    ctx.font = `bold ${4.5 * px}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(tremor * 0.3, -h / 2 + 14 * px);
    ctx.rotate(Math.sin(t * 0.05) * 0.03);
    ctx.shadowColor = 'rgba(255, 0, 80, 0.6)';
    ctx.shadowBlur = 6 * px;
    ctx.fillText('炼狱枷锁', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    // —— 底部破碎条纹 ——
    ctx.save();
    ctx.beginPath();
    ctx.rect(-w / 2, h / 2 - 10 * px, w, 8 * px);
    ctx.clip();
    for (let i = -w / 2 - 20; i < w / 2 + 20; i += 12) {
      const stripeW = 6 + Math.sin(i * 0.1 + t * 0.1) * 3;
      const stripeH = 6 + Math.sin(i * 0.15) * 2;
      ctx.fillStyle = `rgba(255, 0, 80, ${0.12 + pulse * 0.08})`;
      ctx.fillRect(i + (t * 2) % 12, h / 2 - 10 * px + tremor * 0.2, stripeW, stripeH);
    }
    ctx.restore();

    ctx.restore();
  }

  /** 灼炎领主：熔岩巨魔 + 火焰头发 + 燃烧火球 */
  private renderPurgatoryFireLord(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, animFrame: number): void {
    const flicker = Math.sin(animFrame * 0.2) * 2;
    const flameWave = Math.sin(animFrame * 0.15) * 1.5;
    const glow = Math.sin(animFrame * 0.1) * 0.3 + 0.7;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // 外层火焰光环
    const haloGrad = ctx.createRadialGradient(0, 0, 10 * px, 0, 0, 26 * px);
    haloGrad.addColorStop(0, `rgba(255, 100, 0, ${0.3 * glow})`);
    haloGrad.addColorStop(1, 'rgba(255, 60, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 26 * px, 0, Math.PI * 2);
    ctx.fill();

    // 火焰头发（3簇跳动）
    ctx.fillStyle = '#FF6600';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 4 * px, -10 * px);
      ctx.lineTo(i * 4 * px - 2 * px, -16 * px - flameWave - (i === 0 ? flicker : 0));
      ctx.lineTo(i * 4 * px + 2 * px, -16 * px - flameWave);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#FFCC00';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 4 * px, -10 * px);
      ctx.lineTo(i * 4 * px - 1 * px, -14 * px - flameWave);
      ctx.lineTo(i * 4 * px + 1 * px, -14 * px - flameWave);
      ctx.closePath();
      ctx.fill();
    }

    // 头部（熔岩石）
    ctx.fillStyle = '#5A1A1A';
    ctx.beginPath();
    ctx.arc(0, -6 * px, 6 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7A2A2A';
    ctx.beginPath();
    ctx.arc(0, -6 * px, 5 * px, 0, Math.PI * 2);
    ctx.fill();

    // 熔岩裂纹（发光）
    ctx.strokeStyle = `rgba(255, 100, 0, ${glow})`;
    ctx.lineWidth = 0.8 * px;
    ctx.beginPath();
    ctx.moveTo(-4 * px, -8 * px);
    ctx.lineTo(-2 * px, -5 * px);
    ctx.lineTo(2 * px, -7 * px);
    ctx.lineTo(4 * px, -4 * px);
    ctx.stroke();

    // 眼睛（炽热发光）
    ctx.fillStyle = `rgba(255, 220, 0, ${0.8 + glow * 0.2})`;
    ctx.beginPath();
    ctx.arc(-2 * px, -6 * px, 0.8 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2 * px, -6 * px, 0.8 * px, 0, Math.PI * 2);
    ctx.fill();

    // 躯干（熔岩装甲）
    ctx.fillStyle = '#5A1A1A';
    ctx.fillRect(-8 * px, 0, 16 * px, 12 * px);
    ctx.fillStyle = '#7A2A2A';
    ctx.fillRect(-7 * px, 1 * px, 14 * px, 10 * px);

    // 胸口熔岩核心（发光跳动）
    const coreGrad = ctx.createRadialGradient(0, 5 * px, 0, 0, 5 * px, 3 * px);
    coreGrad.addColorStop(0, `rgba(255, 220, 0, ${glow})`);
    coreGrad.addColorStop(0.6, `rgba(255, 100, 0, ${glow})`);
    coreGrad.addColorStop(1, 'rgba(150, 30, 0, 0.5)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 5 * px, 3 * px, 0, Math.PI * 2);
    ctx.fill();

    // 熔岩裂纹（全身）
    ctx.strokeStyle = `rgba(255, 120, 0, ${glow * 0.8})`;
    ctx.lineWidth = 0.6 * px;
    ctx.beginPath();
    ctx.moveTo(-6 * px, 2 * px);
    ctx.lineTo(-3 * px, 5 * px);
    ctx.lineTo(-5 * px, 9 * px);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5 * px, 3 * px);
    ctx.lineTo(3 * px, 7 * px);
    ctx.lineTo(6 * px, 10 * px);
    ctx.stroke();

    // 双手（燃烧火球）
    for (const side of [-1, 1]) {
      const sx = side * 9 * px;
      // 手臂
      ctx.fillStyle = '#5A1A1A';
      ctx.fillRect(sx - 1.5 * px, 1 * px, 3 * px, 5 * px);
      // 火球
      const fbGrad = ctx.createRadialGradient(sx, 7 * px, 0, sx, 7 * px, 3 * px);
      fbGrad.addColorStop(0, `rgba(255, 240, 100, ${glow})`);
      fbGrad.addColorStop(0.5, `rgba(255, 120, 0, ${glow})`);
      fbGrad.addColorStop(1, 'rgba(200, 50, 0, 0.3)');
      ctx.fillStyle = fbGrad;
      ctx.beginPath();
      ctx.arc(sx, 7 * px, 3 * px + flameWave * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 双腿（粗壮岩石腿）
    ctx.fillStyle = '#3A1010';
    ctx.fillRect(-5 * px, 12 * px, 4 * px, 6 * px);
    ctx.fillRect(1 * px, 12 * px, 4 * px, 6 * px);

    ctx.restore();
  }

  /** 剧毒女王：紫色蜘蛛女王 + 8条腿 + 多眼 + 毒液滴落 */
  private renderPurgatoryPoisonQueen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, animFrame: number): void {
    const legWave = Math.sin(animFrame * 0.1) * 1.5;
    const eyeBlink = Math.sin(animFrame * 0.15) * 0.5 + 0.5;
    const drip = (animFrame * 0.5) % 20;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // 毒雾光环
    const haloGrad = ctx.createRadialGradient(0, 0, 10 * px, 0, 0, 24 * px);
    haloGrad.addColorStop(0, 'rgba(123, 0, 255, 0.3)');
    haloGrad.addColorStop(1, 'rgba(80, 0, 180, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 24 * px, 0, Math.PI * 2);
    ctx.fill();

    // 8条蜘蛛腿（左右各4条）
    ctx.strokeStyle = '#4A0080';
    ctx.lineWidth = 1.5 * px;
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1;
      const idx = i % 4;
      const baseY = (idx - 1.5) * 3 * px;
      const legLen = 12 * px;
      const wave = legWave * (idx % 2 === 0 ? 1 : -1);
      ctx.beginPath();
      ctx.moveTo(side * 6 * px, baseY);
      ctx.lineTo(side * (10 * px + wave), baseY - 2 * px);
      ctx.lineTo(side * legLen, baseY + 2 * px + wave);
      ctx.stroke();
      // 腿尖爪
      ctx.fillStyle = '#7B00FF';
      ctx.beginPath();
      ctx.arc(side * legLen, baseY + 2 * px + wave, 0.6 * px, 0, Math.PI * 2);
      ctx.fill();
    }

    // 蜘蛛腹部（大圆球，紫色渐变）
    const bodyGrad = ctx.createRadialGradient(-2 * px, -2 * px, 0, 0, 0, 10 * px);
    bodyGrad.addColorStop(0, '#9B30FF');
    bodyGrad.addColorStop(0.6, '#5B00B0');
    bodyGrad.addColorStop(1, '#2A0050');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2 * px, 9 * px, 8 * px, 0, 0, Math.PI * 2);
    ctx.fill();

    // 腹部纹路（紫色甲壳条纹）
    ctx.strokeStyle = '#3A0070';
    ctx.lineWidth = 0.6 * px;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-7 * px, i * 2 * px + 2 * px);
      ctx.quadraticCurveTo(0, i * 2 * px + 4 * px, 7 * px, i * 2 * px + 2 * px);
      ctx.stroke();
    }

    // 毒液斑点（腹部）
    ctx.fillStyle = '#AA00FF';
    ctx.beginPath();
    ctx.arc(-3 * px, 0, 1 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3 * px, 4 * px, 1 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 6 * px, 0.8 * px, 0, Math.PI * 2);
    ctx.fill();

    // 头部（小，位于上方）
    ctx.fillStyle = '#4A0080';
    ctx.beginPath();
    ctx.arc(0, -8 * px, 4 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6B00A0';
    ctx.beginPath();
    ctx.arc(0, -8 * px, 3 * px, 0, Math.PI * 2);
    ctx.fill();

    // 多只眼睛（4只，紫色发光）
    const eyes = [
      { x: -2 * px, y: -9 * px },
      { x: 2 * px, y: -9 * px },
      { x: -1 * px, y: -7 * px },
      { x: 1 * px, y: -7 * px },
    ];
    for (const e of eyes) {
      ctx.fillStyle = `rgba(180, 0, 255, ${0.7 + eyeBlink * 0.3})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 0.7 * px, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF00FF';
      ctx.beginPath();
      ctx.arc(e.x, e.y, 0.3 * px, 0, Math.PI * 2);
      ctx.fill();
    }

    // 毒牙（2颗）
    ctx.fillStyle = '#AA00FF';
    ctx.beginPath();
    ctx.moveTo(-1.5 * px, -6 * px);
    ctx.lineTo(-1 * px, -4 * px);
    ctx.lineTo(-0.5 * px, -6 * px);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1.5 * px, -6 * px);
    ctx.lineTo(1 * px, -4 * px);
    ctx.lineTo(0.5 * px, -6 * px);
    ctx.closePath();
    ctx.fill();

    // 滴落毒液（腹部下方）
    ctx.fillStyle = 'rgba(123, 0, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-2 * px, 10 * px + drip * 0.3, 1 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2 * px, 11 * px + (drip * 0.5) % 15, 0.8 * px, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /** 极寒君王：冰晶王座 + 冰冠 + 冰柱权杖 */
  private renderPurgatoryIceKing(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, animFrame: number): void {
    const shimmer = Math.sin(animFrame * 0.08) * 0.3 + 0.7;
    const snowRot = animFrame * 0.02;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // 冰雪光环
    const haloGrad = ctx.createRadialGradient(0, 0, 10 * px, 0, 0, 26 * px);
    haloGrad.addColorStop(0, `rgba(0, 191, 255, ${0.3 * shimmer})`);
    haloGrad.addColorStop(1, 'rgba(0, 100, 200, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 26 * px, 0, Math.PI * 2);
    ctx.fill();

    // 环绕雪花（旋转）
    ctx.fillStyle = `rgba(200, 240, 255, ${shimmer})`;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + snowRot;
      const sx = Math.cos(angle) * 20 * px;
      const sy = Math.sin(angle) * 20 * px;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle * 2);
      ctx.fillRect(-0.5 * px, -1 * px, 1 * px, 2 * px);
      ctx.fillRect(-1 * px, -0.5 * px, 2 * px, 1 * px);
      ctx.restore();
    }

    // 王座（背后冰晶靠背）
    ctx.fillStyle = '#3A7AB0';
    ctx.beginPath();
    ctx.moveTo(-10 * px, 8 * px);
    ctx.lineTo(-8 * px, -6 * px);
    ctx.lineTo(-5 * px, -8 * px);
    ctx.lineTo(5 * px, -8 * px);
    ctx.lineTo(8 * px, -6 * px);
    ctx.lineTo(10 * px, 8 * px);
    ctx.closePath();
    ctx.fill();
    // 王座高光
    ctx.fillStyle = '#5AA0D0';
    ctx.beginPath();
    ctx.moveTo(-8 * px, 6 * px);
    ctx.lineTo(-6 * px, -4 * px);
    ctx.lineTo(-3 * px, -6 * px);
    ctx.lineTo(3 * px, -6 * px);
    ctx.lineTo(6 * px, -4 * px);
    ctx.lineTo(8 * px, 6 * px);
    ctx.closePath();
    ctx.fill();

    // 身体（冰晶躯干）
    const bodyGrad = ctx.createLinearGradient(0, -4 * px, 0, 10 * px);
    bodyGrad.addColorStop(0, '#80D0FF');
    bodyGrad.addColorStop(0.5, '#4A9AE0');
    bodyGrad.addColorStop(1, '#1A5A90');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(-6 * px, -2 * px, 12 * px, 12 * px);

    // 冰晶甲片（胸部）
    ctx.fillStyle = '#A0E0FF';
    ctx.beginPath();
    ctx.moveTo(-4 * px, 0);
    ctx.lineTo(0, -1 * px);
    ctx.lineTo(4 * px, 0);
    ctx.lineTo(2 * px, 3 * px);
    ctx.lineTo(0, 2 * px);
    ctx.lineTo(-2 * px, 3 * px);
    ctx.closePath();
    ctx.fill();

    // 胸口冰核（发光）
    ctx.fillStyle = `rgba(200, 240, 255, ${shimmer})`;
    ctx.beginPath();
    ctx.arc(0, 4 * px, 1.5 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 4 * px, 0.6 * px, 0, Math.PI * 2);
    ctx.fill();

    // 头部（冰蓝）
    ctx.fillStyle = '#5AA0D0';
    ctx.beginPath();
    ctx.arc(0, -6 * px, 4 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#80C0E0';
    ctx.beginPath();
    ctx.arc(0, -6 * px, 3 * px, 0, Math.PI * 2);
    ctx.fill();

    // 冰晶王冠（5个尖刺）
    ctx.fillStyle = '#A0E0FF';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 1.5 * px, -9 * px);
      ctx.lineTo(i * 1.5 * px - 0.8 * px, -11 * px - Math.abs(i) * 0.5 * px);
      ctx.lineTo(i * 1.5 * px + 0.8 * px, -11 * px - Math.abs(i) * 0.5 * px);
      ctx.closePath();
      ctx.fill();
    }
    // 王冠发光
    ctx.fillStyle = `rgba(255, 255, 255, ${shimmer * 0.6})`;
    ctx.fillRect(-3 * px, -9.5 * px, 6 * px, 0.5 * px);

    // 眼睛（冰蓝发光）
    ctx.fillStyle = `rgba(150, 230, 255, ${0.8 + shimmer * 0.2})`;
    ctx.beginPath();
    ctx.arc(-1.5 * px, -6 * px, 0.8 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1.5 * px, -6 * px, 0.8 * px, 0, Math.PI * 2);
    ctx.fill();

    // 双手（冰柱权杖）
    for (const side of [-1, 1]) {
      const sx = side * 8 * px;
      // 手臂
      ctx.fillStyle = '#4A9AE0';
      ctx.fillRect(sx - 1 * px, 0, 2 * px, 6 * px);
      // 权杖顶冰晶
      ctx.fillStyle = '#A0E0FF';
      ctx.beginPath();
      ctx.moveTo(sx, 8 * px);
      ctx.lineTo(sx - 1.5 * px, 11 * px);
      ctx.lineTo(sx, 14 * px);
      ctx.lineTo(sx + 1.5 * px, 11 * px);
      ctx.closePath();
      ctx.fill();
      // 杖顶发光
      ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
      ctx.beginPath();
      ctx.arc(sx, 11 * px, 0.6 * px, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /** 雷霆主宰：金色机械 + 电流头盔 + 闪电能量球 */
  private renderPurgatoryLightningLord(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, animFrame: number): void {
    const arcFlicker = Math.sin(animFrame * 0.3) * 0.5 + 0.5;
    const pulse = Math.sin(animFrame * 0.1) * 0.3 + 0.7;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // 电流场光环
    const haloGrad = ctx.createRadialGradient(0, 0, 8 * px, 0, 0, 26 * px);
    haloGrad.addColorStop(0, `rgba(255, 215, 0, ${0.4 * pulse})`);
    haloGrad.addColorStop(1, 'rgba(200, 150, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 26 * px, 0, Math.PI * 2);
    ctx.fill();

    // 环绕电弧（随机跳动的闪电）
    ctx.strokeStyle = `rgba(255, 240, 100, ${arcFlicker})`;
    ctx.lineWidth = 1 * px;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + animFrame * 0.03;
      const r1 = 16 * px;
      const r2 = 22 * px;
      const x1 = Math.cos(angle) * r1;
      const y1 = Math.sin(angle) * r1;
      const x2 = Math.cos(angle + 0.3) * r2;
      const y2 = Math.sin(angle + 0.3) * r2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      // 锯齿状闪电
      const segs = 3;
      for (let s = 1; s <= segs; s++) {
        const t = s / segs;
        const mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 3 * px;
        const my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 3 * px;
        ctx.lineTo(mx, my);
      }
      ctx.stroke();
    }

    // 身体（金色机械装甲）
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(-8 * px, -2 * px, 16 * px, 12 * px);
    ctx.fillStyle = '#B8901C';
    ctx.fillRect(-7 * px, -1 * px, 14 * px, 10 * px);
    // 高光
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-7 * px, -1 * px, 14 * px, 1 * px);

    // 装甲条纹
    ctx.fillStyle = '#5A4010';
    ctx.fillRect(-7 * px, 2 * px, 14 * px, 0.5 * px);
    ctx.fillRect(-7 * px, 6 * px, 14 * px, 0.5 * px);

    // 胸口能量核心（雷电球，跳动发光）
    const coreGrad = ctx.createRadialGradient(0, 4 * px, 0, 0, 4 * px, 3 * px);
    coreGrad.addColorStop(0, `rgba(255, 255, 200, ${pulse})`);
    coreGrad.addColorStop(0.5, `rgba(255, 215, 0, ${pulse})`);
    coreGrad.addColorStop(1, 'rgba(180, 120, 0, 0.5)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 4 * px, 3 * px, 0, Math.PI * 2);
    ctx.fill();
    // 核心内电弧
    ctx.strokeStyle = `rgba(255, 255, 255, ${arcFlicker})`;
    ctx.lineWidth = 0.5 * px;
    ctx.beginPath();
    ctx.moveTo(-2 * px, 4 * px);
    ctx.lineTo(0, 3 * px);
    ctx.lineTo(2 * px, 5 * px);
    ctx.stroke();

    // 头部（机械头盔）
    ctx.fillStyle = '#8B6914';
    ctx.beginPath();
    ctx.arc(0, -6 * px, 4 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#B8901C';
    ctx.beginPath();
    ctx.arc(0, -6 * px, 3 * px, 0, Math.PI * 2);
    ctx.fill();

    // 头盔尖角（4个金色尖刺）
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 4; i++) {
      const ang = -Math.PI / 2 + (i - 1.5) * 0.5;
      const r1 = 3 * px;
      const r2 = 6 * px;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang - 0.15) * r1, -6 * px + Math.sin(ang - 0.15) * r1);
      ctx.lineTo(Math.cos(ang) * r2, -6 * px + Math.sin(ang) * r2);
      ctx.lineTo(Math.cos(ang + 0.15) * r1, -6 * px + Math.sin(ang + 0.15) * r1);
      ctx.closePath();
      ctx.fill();
    }

    // 眼睛（电弧发光）
    ctx.fillStyle = `rgba(255, 255, 100, ${0.8 + arcFlicker * 0.2})`;
    ctx.fillRect(-2.5 * px, -6.5 * px, 1.5 * px, 1 * px);
    ctx.fillRect(1 * px, -6.5 * px, 1.5 * px, 1 * px);
    // 眼睛电弧
    ctx.strokeStyle = `rgba(255, 255, 255, ${arcFlicker})`;
    ctx.lineWidth = 0.4 * px;
    ctx.beginPath();
    ctx.moveTo(-2 * px, -6 * px);
    ctx.lineTo(-1 * px, -5.5 * px);
    ctx.stroke();

    // 双手（闪电能量球）
    for (const side of [-1, 1]) {
      const sx = side * 9 * px;
      // 机械手臂
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(sx - 1.5 * px, 0, 3 * px, 6 * px);
      ctx.fillStyle = '#B8901C';
      ctx.fillRect(sx - 1 * px, 1, 2 * px, 4 * px);
      // 能量球（金色发光）
      const eGrad = ctx.createRadialGradient(sx, 8 * px, 0, sx, 8 * px, 3 * px);
      eGrad.addColorStop(0, `rgba(255, 255, 200, ${pulse})`);
      eGrad.addColorStop(0.6, `rgba(255, 215, 0, ${pulse})`);
      eGrad.addColorStop(1, 'rgba(200, 100, 0, 0.3)');
      ctx.fillStyle = eGrad;
      ctx.beginPath();
      ctx.arc(sx, 8 * px, 2.5 * px, 0, Math.PI * 2);
      ctx.fill();
      // 能量球内电弧
      ctx.strokeStyle = `rgba(255, 255, 255, ${arcFlicker})`;
      ctx.lineWidth = 0.5 * px;
      ctx.beginPath();
      ctx.moveTo(sx - 1.5 * px, 8 * px);
      ctx.lineTo(sx, 7 * px);
      ctx.lineTo(sx + 1.5 * px, 9 * px);
      ctx.stroke();
    }

    // 双腿（机械腿）
    ctx.fillStyle = '#5A4010';
    ctx.fillRect(-5 * px, 10 * px, 4 * px, 6 * px);
    ctx.fillRect(1 * px, 10 * px, 4 * px, 6 * px);
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(-4.5 * px, 11 * px, 3 * px, 4 * px);
    ctx.fillRect(1.5 * px, 11 * px, 3 * px, 4 * px);

    ctx.restore();
  }

  /** 材料副本BOSS：晶石巨魔（紫色水晶巨魔，中央发光宝石核心，水晶尖刺） */
  private renderMaterialBoss(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, animFrame: number): void {
    ctx.save();
    // 中心点
    const cx = x + w / 2;
    const cy = y + h / 2;
    // 漂浮动画
    const float = Math.sin(animFrame * 0.05) * 2 * px;
    ctx.translate(0, float);

    const pulse = 0.6 + Math.sin(animFrame * 0.08) * 0.4;

    // 1. 外层光环（紫色发光）
    const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.6);
    auraGrad.addColorStop(0, `rgba(155, 89, 182, ${0.25 * pulse})`);
    auraGrad.addColorStop(0.6, 'rgba(155, 89, 182, 0.08)');
    auraGrad.addColorStop(1, 'rgba(155, 89, 182, 0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(x - w * 0.1, y - h * 0.1, w * 1.2, h * 1.2);

    if (flash) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
      return;
    }

    // 2. 主体：水晶身体（深紫→紫红渐变，多面体造型）
    const bodyGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    bodyGrad.addColorStop(0, '#4A1E5C');
    bodyGrad.addColorStop(0.5, '#7B2D8F');
    bodyGrad.addColorStop(1, '#3A1450');
    ctx.fillStyle = bodyGrad;
    // 八边形水晶主体
    ctx.beginPath();
    ctx.moveTo(cx, y);                          // 顶
    ctx.lineTo(x + w * 0.85, y + h * 0.2);     // 右上
    ctx.lineTo(x + w, y + h * 0.5);             // 右
    ctx.lineTo(x + w * 0.85, y + h * 0.8);     // 右下
    ctx.lineTo(cx, y + h);                       // 底
    ctx.lineTo(x + w * 0.15, y + h * 0.8);     // 左下
    ctx.lineTo(x, y + h * 0.5);                  // 左
    ctx.lineTo(x + w * 0.15, y + h * 0.2);     // 左上
    ctx.closePath();
    ctx.fill();

    // 3. 水晶面纹路（高光线条）
    ctx.strokeStyle = `rgba(200, 150, 255, ${0.4 + pulse * 0.3})`;
    ctx.lineWidth = 1 * px;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx, y + h);
    ctx.moveTo(x, y + h * 0.5);
    ctx.lineTo(x + w, y + h * 0.5);
    ctx.moveTo(x + w * 0.15, y + h * 0.2);
    ctx.lineTo(x + w * 0.85, y + h * 0.8);
    ctx.moveTo(x + w * 0.85, y + h * 0.2);
    ctx.lineTo(x + w * 0.15, y + h * 0.8);
    ctx.stroke();

    // 4. 中央宝石核心（青蓝色发光）
    const coreR = w * 0.18;
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * pulse})`);
    coreGrad.addColorStop(0.3, `rgba(0, 245, 212, ${0.8 * pulse})`);
    coreGrad.addColorStop(0.7, `rgba(0, 180, 220, ${0.5 * pulse})`);
    coreGrad.addColorStop(1, 'rgba(0, 100, 180, 0.2)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();

    // 核心内菱形（宝石切面）
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * pulse})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy - coreR * 0.5);
    ctx.lineTo(cx + coreR * 0.4, cy);
    ctx.lineTo(cx, cy + coreR * 0.5);
    ctx.lineTo(cx - coreR * 0.4, cy);
    ctx.closePath();
    ctx.fill();

    // 5. 双眼（橙红色发光）
    const eyeY = y + h * 0.35;
    const eyeOffset = w * 0.18;
    ctx.fillStyle = `rgba(255, 100, 50, ${0.8 + pulse * 0.2})`;
    ctx.beginPath();
    ctx.arc(cx - eyeOffset, eyeY, 3 * px, 0, Math.PI * 2);
    ctx.arc(cx + eyeOffset, eyeY, 3 * px, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛内白点
    ctx.fillStyle = `rgba(255, 220, 100, ${pulse})`;
    ctx.beginPath();
    ctx.arc(cx - eyeOffset, eyeY, 1.2 * px, 0, Math.PI * 2);
    ctx.arc(cx + eyeOffset, eyeY, 1.2 * px, 0, Math.PI * 2);
    ctx.fill();

    // 6. 顶部水晶尖刺（3根）
    ctx.fillStyle = '#9B59B6';
    for (let i = -1; i <= 1; i++) {
      const sx = cx + i * w * 0.2;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx - 4 * px, y - 10 * px);
      ctx.lineTo(sx + 4 * px, y - 10 * px);
      ctx.closePath();
      ctx.fill();
      // 尖刺高光
      ctx.fillStyle = `rgba(200, 150, 255, ${0.5 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx - 1 * px, y - 9 * px);
      ctx.lineTo(sx, y - 9 * px);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#9B59B6';
    }

    // 7. 两侧水晶尖刺
    for (const side of [-1, 1]) {
      const sx = cx + side * w * 0.5;
      const sy = cy;
      ctx.fillStyle = '#7B2D8F';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + side * 8 * px, sy - 5 * px);
      ctx.lineTo(sx + side * 8 * px, sy + 5 * px);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private renderEnemyHealthBar(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    const { x, y, width } = enemy;
    const healthPercent = enemy.health / enemy.maxHealth;
    const barWidth = width;
    const barHeight = 5;
    const barY = y - 10;

    // 血条背景
    ctx.fillStyle = '#1A1208';
    ctx.fillRect(x, barY, barWidth, barHeight);

    // 血条边框
    ctx.fillStyle = '#2D1F0E';
    ctx.fillRect(x, barY, barWidth, 1);
    ctx.fillRect(x, barY + barHeight - 1, barWidth, 1);
    ctx.fillRect(x, barY, 1, barHeight);
    ctx.fillRect(x + barWidth - 1, barY, 1, barHeight);

    // 血条
    let barColor: string;
    if (enemy.type === 'boss') {
      barColor = '#CC2200';
    } else if (enemy.type === 'elite') {
      barColor = '#AA44CC';
    } else if (healthPercent > 0.5) {
      barColor = '#44AA33';
    } else if (healthPercent > 0.25) {
      barColor = '#CCAA22';
    } else {
      barColor = '#CC3322';
    }
    ctx.fillStyle = barColor;
    ctx.fillRect(x + 1, barY + 1, (barWidth - 2) * healthPercent, barHeight - 2);

    // 血条高光
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x + 1, barY + 1, (barWidth - 2) * healthPercent, 1);
  }

  private renderDrops(): void {
    const ctx = this.ctx;
    const drops = this.dropPool.getActive();
    const px = 2;

    for (const drop of drops) {
      ctx.save();
      ctx.translate(drop.x, drop.y);

      // 闪烁动画
      const glow = 0.8 + Math.sin(this.animFrame * 0.1 + drop.x) * 0.2;
      ctx.globalAlpha = glow;

      switch (drop.type) {
        case 'exp':
          // 经验菱形 - 蓝色晶体
          ctx.fillStyle = '#3388FF';
          ctx.fillRect(-1 * px, -3 * px, 2 * px, 1 * px);
          ctx.fillRect(-2 * px, -2 * px, 4 * px, 1 * px);
          ctx.fillRect(-3 * px, -1 * px, 6 * px, 2 * px);
          ctx.fillRect(-2 * px, 1 * px, 4 * px, 1 * px);
          ctx.fillRect(-1 * px, 2 * px, 2 * px, 1 * px);
          // 高光
          ctx.fillStyle = '#88BBFF';
          ctx.fillRect(-1 * px, -2 * px, 2 * px, 2 * px);
          // 暗部
          ctx.fillStyle = '#2266CC';
          ctx.fillRect(1 * px, 0, 1 * px, 1 * px);
          break;

        case 'health':
          // 医疗包
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(-3 * px, -3 * px, 6 * px, 6 * px);
          // 红十字
          ctx.fillStyle = '#DD2222';
          ctx.fillRect(-1 * px, -3 * px, 2 * px, 6 * px);
          ctx.fillRect(-3 * px, -1 * px, 6 * px, 2 * px);
          // 边框
          ctx.fillStyle = '#AAAAAA';
          ctx.fillRect(-3 * px, -3 * px, 6 * px, 1 * px);
          ctx.fillRect(-3 * px, 2 * px, 6 * px, 1 * px);
          ctx.fillRect(-3 * px, -3 * px, 1 * px, 6 * px);
          ctx.fillRect(2 * px, -3 * px, 1 * px, 6 * px);
          break;

        case 'coin':
          // 金币
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(-3 * px, -3 * px, 6 * px, 6 * px);
          // 金币边框
          ctx.fillStyle = '#B8860B';
          ctx.fillRect(-3 * px, -3 * px, 6 * px, 1 * px);
          ctx.fillRect(-3 * px, 2 * px, 6 * px, 1 * px);
          ctx.fillRect(-3 * px, -3 * px, 1 * px, 6 * px);
          ctx.fillRect(2 * px, -3 * px, 1 * px, 6 * px);
          // $符号
          ctx.fillStyle = '#B8860B';
          ctx.fillRect(-1 * px, -2 * px, 2 * px, 1 * px);
          ctx.fillRect(-1 * px, 0, 2 * px, 1 * px);
          ctx.fillRect(-1 * px, 1 * px, 2 * px, 1 * px);
          ctx.fillRect(-1 * px, -1 * px, 1 * px, 1 * px);
          ctx.fillRect(0, 0, 1 * px, 1 * px);
          // 高光
          ctx.fillStyle = '#FFEE88';
          ctx.fillRect(-2 * px, -2 * px, 2 * px, 2 * px);
          break;

        case 'item':
          // 木箱
          ctx.fillStyle = '#8B6914';
          ctx.fillRect(-3 * px, -3 * px, 6 * px, 6 * px);
          // 木纹
          ctx.fillStyle = '#7A5A10';
          ctx.fillRect(-3 * px, -1 * px, 6 * px, 1 * px);
          ctx.fillRect(-3 * px, 1 * px, 6 * px, 1 * px);
          // 边框
          ctx.fillStyle = '#5D3A1A';
          ctx.fillRect(-3 * px, -3 * px, 6 * px, 1 * px);
          ctx.fillRect(-3 * px, 2 * px, 6 * px, 1 * px);
          ctx.fillRect(-3 * px, -3 * px, 1 * px, 6 * px);
          ctx.fillRect(2 * px, -3 * px, 1 * px, 6 * px);
          // 锁扣
          ctx.fillStyle = '#B8860B';
          ctx.fillRect(-1 * px, -1 * px, 2 * px, 2 * px);
          break;

        case 'equipment':
          const equipId = (drop as any).equipmentId;
          const equip = equipId ? this.droppedEquipmentMap.get(equipId) : null;
          const rarityColor = equip ? this.getRarityColor(equip.rarity) : '#9A9A9A';
          const rarityBgLight = equip ? this.getRarityBgLight(equip.rarity) : '#D4C8B0';
          const rarityBgDark = equip ? this.getRarityBgDark(equip.rarity) : '#A89880';
          
          // 装备宝箱背景
          ctx.fillStyle = rarityBgDark;
          ctx.fillRect(-4 * px, -4 * px, 8 * px, 8 * px);
          // 内部背景
          ctx.fillStyle = rarityBgLight;
          ctx.fillRect(-3 * px, -3 * px, 6 * px, 6 * px);
          // 边框高光
          ctx.fillStyle = rarityColor;
          ctx.fillRect(-4 * px, -4 * px, 8 * px, 1 * px);
          ctx.fillRect(-4 * px, -4 * px, 1 * px, 8 * px);
          // 边框暗部
          ctx.fillStyle = '#3D2914';
          ctx.fillRect(-4 * px, 3 * px, 8 * px, 1 * px);
          ctx.fillRect(3 * px, -4 * px, 1 * px, 8 * px);
          
          // 装备图标 - 根据槽位绘制简单形状
          if (equip) {
            ctx.fillStyle = rarityColor;
            switch (equip.slot) {
              case 'weapon':
                ctx.fillRect(-2 * px, -1 * px, 5 * px, 2 * px);
                ctx.fillRect(-1 * px, 1 * px, 2 * px, 2 * px);
                break;
              case 'armor':
                ctx.fillRect(-2 * px, -2 * px, 4 * px, 4 * px);
                ctx.fillRect(-3 * px, -1 * px, 1 * px, 2 * px);
                ctx.fillRect(2 * px, -1 * px, 1 * px, 2 * px);
                break;
              case 'pants':
                ctx.fillRect(-2 * px, -2 * px, 4 * px, 1 * px);
                ctx.fillRect(-2 * px, -1 * px, 2 * px, 3 * px);
                ctx.fillRect(0, -1 * px, 2 * px, 3 * px);
                break;
              case 'shoulder':
                ctx.fillRect(-2 * px, -2 * px, 4 * px, 2 * px);
                ctx.fillRect(-1 * px, 0, 2 * px, 2 * px);
                break;
              case 'belt':
                ctx.fillRect(-3 * px, -1 * px, 6 * px, 2 * px);
                ctx.fillRect(-1 * px, -2 * px, 2 * px, 4 * px);
                break;
              case 'shoes':
                ctx.fillRect(-2 * px, -1 * px, 2 * px, 3 * px);
                ctx.fillRect(0, -1 * px, 2 * px, 3 * px);
                ctx.fillRect(-2 * px, 2 * px, 3 * px, 1 * px);
                ctx.fillRect(0, 2 * px, 3 * px, 1 * px);
                break;
              case 'earring':
                ctx.fillRect(-1 * px, -2 * px, 2 * px, 1 * px);
                ctx.fillRect(-2 * px, -1 * px, 4 * px, 3 * px);
                ctx.fillRect(-1 * px, 2 * px, 2 * px, 1 * px);
                break;
              case 'ring':
                ctx.fillRect(-2 * px, -2 * px, 4 * px, 4 * px);
                ctx.fillStyle = rarityBgLight;
                ctx.fillRect(-1 * px, -1 * px, 2 * px, 2 * px);
                break;
              case 'necklace':
                ctx.fillRect(-2 * px, -2 * px, 1 * px, 1 * px);
                ctx.fillRect(1 * px, -2 * px, 1 * px, 1 * px);
                ctx.fillRect(-3 * px, -1 * px, 1 * px, 1 * px);
                ctx.fillRect(2 * px, -1 * px, 1 * px, 1 * px);
                ctx.fillRect(-2 * px, 0, 4 * px, 1 * px);
                ctx.fillRect(-1 * px, 1 * px, 2 * px, 2 * px);
                break;
            }
          }
          break;
      }

      ctx.restore();
    }
  }

  private renderParticles(): void {
    const ctx = this.ctx;
    const particles = this.particlePool.getActive();
    const px = 2;

    for (const p of particles) {
      ctx.save();
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      const size = Math.max(2, Math.floor(p.size * alpha));

      // 根据颜色决定粒子类型
      const isBlood = p.color.includes('8E') || p.color.includes('4E') || p.color === '#6B8E4E';
      const isSpark = p.color.includes('FF') || p.color.includes('AA') || p.color.includes('CC');

      if (isBlood) {
        // 血花粒子 - 不规则形状
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        ctx.fillStyle = '#CC2222';
        ctx.fillRect(p.x - size / 2 + 1, p.y - size / 2, size - 1, Math.max(1, size - 1));
        // 飞溅痕迹
        if (alpha < 0.5) {
          ctx.fillStyle = `rgba(139, 0, 0, ${alpha * 0.5})`;
          ctx.fillRect(p.x - 1, p.y - 1, size + 2, 1);
          ctx.fillRect(p.x, p.y + size / 2, 1, size);
        }
      } else if (isSpark) {
        // 火花粒子 - 亮点+尾迹
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        // 尾迹
        ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.5})`;
        ctx.fillRect(p.x - p.vx * 0.02, p.y - p.vy * 0.02, 2, 1);
      } else {
        // 碎片粒子
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        // 碎片暗部
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(p.x, p.y, size / 2, size / 2);
      }

      ctx.restore();
    }
  }

  private renderDamageNumbers(): void {
    const ctx = this.ctx;
    const numbers = this.damageNumberPool.getActive();

    for (const dn of numbers) {
      const isCrit = (dn as any).isCrit || false;
      const scale = (dn as any).scale || 1;
      const baseSize = 12;
      const fontSize = Math.floor(baseSize * scale);
      
      ctx.save();
      ctx.globalAlpha = dn.life / dn.maxLife;
      ctx.textAlign = 'center';
      
      if (isCrit) {
        ctx.fillStyle = '#1A0000';
        ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
        ctx.fillText(Math.floor(dn.value).toString(), dn.x + 2, dn.y + 2);
        ctx.fillStyle = '#FFDD00';
        ctx.fillText(Math.floor(dn.value).toString(), dn.x + 1, dn.y + 1);
        ctx.fillStyle = '#FF3300';
        ctx.fillText(Math.floor(dn.value).toString(), dn.x, dn.y);
        
        const flash = Math.sin(this.animFrame * 0.5) * 0.3 + 0.7;
        ctx.globalAlpha = (dn.life / dn.maxLife) * flash;
        ctx.fillStyle = '#FFFF88';
        ctx.font = `bold ${fontSize - 2}px "Press Start 2P", monospace`;
        ctx.fillText('!', dn.x + fontSize, dn.y - fontSize);
      } else {
        ctx.fillStyle = '#1A1208';
        ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
        ctx.fillText(Math.floor(dn.value).toString(), dn.x + 1, dn.y + 1);
        ctx.fillStyle = dn.color || '#FFCC00';
        ctx.fillText(Math.floor(dn.value).toString(), dn.x, dn.y);
      }
      
      ctx.restore();
    }
  }

  private renderLaser(): void {
    if (!this.laserActive) {
      const cloneCount = this.getCloneCount();
      let hasCloneLaser = false;
      for (let i = 0; i < cloneCount; i++) {
        if (this.cloneLasersActive[i]) {
          hasCloneLaser = true;
          break;
        }
      }
      if (!hasCloneLaser) return;
    }

    const ctx = this.ctx;
    const px = 2;
    const laserLvl = this.getSkillLevel('fx_laser_1') || 1;
    const widthMult = 1 + (laserLvl - 1) * 0.2;

    const drawLaser = (muzzleX: number, muzzleY: number, isWhite: boolean) => {
      const outerGlowH = 40 * widthMult;
      const mainBeamH = 20 * widthMult;
      const coreBeamH = 10 * widthMult;
      const centerH = 4 * widthMult;

      if (isWhite) {
        ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
        ctx.fillRect(muzzleX, muzzleY - outerGlowH / 2, this.config.canvasWidth - muzzleX, outerGlowH);

        ctx.fillStyle = '#CCDDFF';
        ctx.fillRect(muzzleX, muzzleY - mainBeamH / 2, this.config.canvasWidth - muzzleX, mainBeamH);

        ctx.fillStyle = '#EEF5FF';
        ctx.fillRect(muzzleX, muzzleY - coreBeamH / 2, this.config.canvasWidth - muzzleX, coreBeamH);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(muzzleX, muzzleY - centerH / 2, this.config.canvasWidth - muzzleX, centerH);
      } else {
        ctx.fillStyle = 'rgba(255, 50, 0, 0.3)';
        ctx.fillRect(muzzleX, muzzleY - outerGlowH / 2, this.config.canvasWidth - muzzleX, outerGlowH);

        ctx.fillStyle = '#FF3300';
        ctx.fillRect(muzzleX, muzzleY - mainBeamH / 2, this.config.canvasWidth - muzzleX, mainBeamH);

        ctx.fillStyle = '#FFAA00';
        ctx.fillRect(muzzleX, muzzleY - coreBeamH / 2, this.config.canvasWidth - muzzleX, coreBeamH);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(muzzleX, muzzleY - centerH / 2, this.config.canvasWidth - muzzleX, centerH);
      }

      for (let lx = muzzleX; lx < this.config.canvasWidth; lx += 8) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(lx, muzzleY - mainBeamH / 2, 2, mainBeamH);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(muzzleX - 8, muzzleY - 8, 12, 16);
      if (isWhite) {
        ctx.fillStyle = 'rgba(150, 180, 255, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
      }
      ctx.fillRect(muzzleX - 6, muzzleY - 14, 10, 28);
    };

    ctx.save();

    if (this.laserActive) {
      const muzzleX = this.player.x + 13.5 * px + 16 * px;
      const muzzleY = this.player.y + 5.5 * px;
      drawLaser(muzzleX, muzzleY, true);
    }

    const cloneCount = this.getCloneCount();
    if (cloneCount > 0) {
      const positions = this.getClonePositions();
      for (let i = 0; i < cloneCount; i++) {
        if (this.cloneLasersActive[i]) {
          const pos = positions[i];
          const muzzleX = pos.x + 13.5 * px + 12 * px;
          const muzzleY = pos.y + 5.5 * px;
          drawLaser(muzzleX, muzzleY, false);
        }
      }
    }

    ctx.restore();
  }

  private renderFlashLightning(): void {
    if (!this.flashLightningActive) return;

    const ctx = this.ctx;
    const enemies = this.enemyPool.getActive();
    const progress = this.flashLightningTimer / 1500;
    const lightningY = (1 - progress) * 50;

    for (const enemy of enemies) {
      const ex = enemy.x + enemy.width / 2;
      const startY = enemy.y - 50;
      const endY = enemy.y + lightningY;

      ctx.save();

      ctx.strokeStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(ex, startY);

      let px = ex;
      let py = startY;
      const segments = 5;
      const segmentHeight = (endY - startY) / segments;

      for (let i = 1; i <= segments; i++) {
        const nextPy = startY + segmentHeight * i;
        const wobble = Math.sin(this.animFrame * 0.5 + i + enemy.id) * 8;
        const nextPx = ex + wobble;
        ctx.lineTo(nextPx, nextPy);
        px = nextPx;
        py = nextPy;
      }

      ctx.stroke();

      ctx.strokeStyle = '#FFFF88';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex, startY);
      px = ex;
      py = startY;
      for (let i = 1; i <= segments; i++) {
        const nextPy = startY + segmentHeight * i;
        const wobble = Math.sin(this.animFrame * 0.5 + i + enemy.id + 0.5) * 5;
        const nextPx = ex + wobble;
        ctx.lineTo(nextPx, nextPy);
      }
      ctx.stroke();

      ctx.shadowBlur = 0;

      ctx.fillStyle = `rgba(255, 255, 255, ${0.8 - progress * 0.5})`;
      ctx.beginPath();
      ctx.arc(ex, enemy.y, 4 + progress * 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderCrosshair(): void {
    if (!this.hasAim) return;

    const ctx = this.ctx;
    const x = this.aimX;
    const y = this.aimY;
    const size = 18;
    const gap = 4;

    ctx.save();
    ctx.strokeStyle = '#00F5D4';
    ctx.shadowColor = '#00F5D4';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;

    // 十字准星
    ctx.beginPath();
    // 上
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y - gap);
    // 下
    ctx.moveTo(x, y + gap);
    ctx.lineTo(x, y + size);
    // 左
    ctx.moveTo(x - size, y);
    ctx.lineTo(x - gap, y);
    // 右
    ctx.moveTo(x + gap, y);
    ctx.lineTo(x + size, y);
    ctx.stroke();

    // 中心点
    ctx.fillStyle = '#00F5D4';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderModeObjects(): void {
    switch (this.gameMode) {
      case 'guard':
        this.renderGuardBase();
        break;
      case 'homedefense':
        this.renderHomeBase();
        this.renderHomeTowers();
        break;
      default:
        break;
    }
  }

  private renderGuardBase(): void {
    const ctx = this.ctx;
    const baseX = 10;
    const baseY = this.config.groundY - 10;
    const baseW = 40;
    const baseH = 280;

    ctx.save();

    const healthPercent = this.guardBaseHealth / this.guardBaseMaxHealth;
    const baseColor = healthPercent > 0.5 ? '#3498DB' : healthPercent > 0.25 ? '#F39C12' : '#E74C3C';

    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(baseX, baseY, baseW, baseH);

    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 8;
    ctx.strokeRect(baseX, baseY, baseW, baseH);

    ctx.fillStyle = baseColor;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('基地', baseX + baseW / 2, baseY + 20);

    const barW = 30;
    const barH = 4;
    const barX = baseX + (baseW - barW) / 2;
    const barY = baseY + 30;

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = baseColor;
    ctx.fillRect(barX, barY, barW * healthPercent, barH);

    ctx.restore();
  }

  private renderHomeBase(): void {
    const ctx = this.ctx;
    const baseX = 5;
    const baseY = this.config.groundY - 20;
    const baseW = 50;
    const baseH = 300;

    ctx.save();

    const healthPercent = this.homeBaseHealth / this.homeBaseMaxHealth;
    const baseColor = healthPercent > 0.5 ? '#2ECC71' : healthPercent > 0.25 ? '#F39C12' : '#E74C3C';

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(baseX, baseY, baseW, baseH);

    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 10;
    ctx.strokeRect(baseX, baseY, baseW, baseH);

    ctx.fillStyle = baseColor;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('家园', baseX + baseW / 2, baseY + 18);

    for (let i = 0; i < 5; i++) {
      const wy = baseY + 40 + i * 50;
      ctx.fillStyle = '#34495E';
      ctx.fillRect(baseX + 8, wy, 34, 35);
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = 0.5 + Math.sin(this.animFrame * 0.05 + i) * 0.3;
      ctx.fillRect(baseX + 12, wy + 5, 10, 10);
      ctx.fillRect(baseX + 28, wy + 5, 10, 10);
      ctx.globalAlpha = 1;
    }

    const barW = 40;
    const barH = 5;
    const barX = baseX + (baseW - barW) / 2;
    const barY = baseY + baseH - 15;

    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = baseColor;
    ctx.fillRect(barX, barY, barW * healthPercent, barH);

    ctx.restore();
  }

  private renderHomeTowers(): void {
    const ctx = this.ctx;
    for (const tower of this.homeTowers) {
      ctx.save();

      ctx.fillStyle = '#7F8C8D';
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderShield(): void {
    const ctx = this.ctx;
    const { x, y, width, height } = this.player;
    const px = 2;
    const radius = Math.max(width, height) * 0.8;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    ctx.save();

    // 护盾外框 - 军事风格
    const pulse = 0.8 + Math.sin(this.animFrame * 0.1) * 0.2;
    ctx.globalAlpha = pulse * 0.6;

    // 外框
    ctx.strokeStyle = '#44AAFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

    // 内部填充
    ctx.fillStyle = 'rgba(68, 170, 255, 0.15)';
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

    // 护盾角标
    ctx.fillStyle = '#44AAFF';
    const cs = 6;
    ctx.fillRect(centerX - radius, centerY - radius, cs, 2);
    ctx.fillRect(centerX - radius, centerY - radius, 2, cs);
    ctx.fillRect(centerX + radius - cs, centerY - radius, cs, 2);
    ctx.fillRect(centerX + radius - 2, centerY - radius, 2, cs);
    ctx.fillRect(centerX - radius, centerY + radius - 2, cs, 2);
    ctx.fillRect(centerX - radius, centerY + radius - cs, 2, cs);
    ctx.fillRect(centerX + radius - cs, centerY + radius - 2, cs, 2);
    ctx.fillRect(centerX + radius - 2, centerY + radius - cs, 2, cs);

    // 扫描线
    const scanY = centerY - radius + (this.animFrame * 2 % (radius * 2));
    ctx.fillStyle = 'rgba(68, 170, 255, 0.3)';
    ctx.fillRect(centerX - radius, scanY, radius * 2, 2);

    ctx.restore();
  }

  // ========== 末世科技风背景渲染方法 ==========

  private renderNeonCityline(ctx: CanvasRenderingContext2D, width: number, groundY: number): void {
    // 远处城市轮廓 - 位于地平线上方，不延伸到地面下方
    const skylineY = groundY;
    const buildings = [
      { x: 20, w: 35, h: 50, roof: 'flat' }, { x: 60, w: 25, h: 35, roof: 'antenna' },
      { x: 90, w: 45, h: 70, roof: 'antenna' }, { x: 140, w: 30, h: 45, roof: 'flat' },
      { x: 175, w: 55, h: 80, roof: 'spire' }, { x: 235, w: 40, h: 55, roof: 'flat' },
      { x: 280, w: 50, h: 75, roof: 'antenna' }, { x: 335, w: 35, h: 40, roof: 'flat' },
      { x: 375, w: 45, h: 65, roof: 'spire' }, { x: 425, w: 30, h: 50, roof: 'flat' },
    ];

    // 建筑轮廓 - 远处更暗淡，融入雾霭
    ctx.fillStyle = '#0D0820';
    for (const b of buildings) {
      // 建筑主体 - 不延伸到地平线下方
      ctx.fillRect(b.x, skylineY - b.h, b.w, b.h);
    }

    // 建筑顶部轮廓细节 - 不同屋顶形状增加真实感
    ctx.fillStyle = '#0D0820';
    for (const b of buildings) {
      const topY = skylineY - b.h;
      if (b.roof === 'spire') {
        // 尖顶
        ctx.beginPath();
        ctx.moveTo(b.x + b.w / 2, topY - 12);
        ctx.lineTo(b.x + b.w / 2 - 4, topY);
        ctx.lineTo(b.x + b.w / 2 + 4, topY);
        ctx.closePath();
        ctx.fill();
      } else if (b.roof === 'antenna') {
        // 天线基座
        ctx.fillRect(b.x + b.w / 2 - 2, topY - 4, 4, 4);
      }
    }

    // 霓虹窗户 - 多色随机闪烁，更逼真
    const neonColors = ['#B026FF', '#00F5D4', '#FF0080', '#4FACFE', '#FFE600'];
    for (const b of buildings) {
      // 每栋建筑有一个主色调
      const colorIdx = Math.floor((b.x / 50) % neonColors.length);
      const color = neonColors[colorIdx];
      const winColor2 = neonColors[(colorIdx + 2) % neonColors.length];

      for (let wy = skylineY - b.h + 6; wy < skylineY - 4; wy += 7) {
        for (let wx = b.x + 3; wx < b.x + b.w - 3; wx += 6) {
          // 用确定性算法而非随机，避免每帧闪烁
          const seed = (wx * 13 + wy * 7 + b.x) % 100;
          if (seed > 40) {
            // 主色窗户
            const flickerSpeed = 0.03 + (seed % 7) * 0.005;
            const intensity = 0.35 + Math.sin(this.animFrame * flickerSpeed + seed) * 0.25;
            ctx.fillStyle = seed > 70 ? winColor2 : color;
            ctx.globalAlpha = Math.max(0.15, intensity);
            ctx.fillRect(wx, wy, 3, 4);
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    // 顶部霓虹天线 - 仅高层建筑
    ctx.strokeStyle = 'rgba(176, 38, 255, 0.6)';
    ctx.lineWidth = 1;
    for (const b of buildings) {
      if (b.h > 50 && b.roof !== 'spire') {
        const tx = b.x + b.w / 2;
        const ty = skylineY - b.h - (b.roof === 'antenna' ? 4 : 0);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx, ty - 15);
        ctx.stroke();
        // 闪烁的顶灯 - 红色航空警示灯
        const blink = Math.sin(this.animFrame * 0.1 + tx * 0.5);
        if (blink > 0) {
          ctx.fillStyle = '#FF0080';
          ctx.globalAlpha = 0.6 + blink * 0.4;
          ctx.fillRect(tx - 1, ty - 16, 2, 2);
        }
      }
    }
    ctx.globalAlpha = 1;

    // 建筑底部发光 - 模拟城市地面的霓虹光晕
    const baseGlow = ctx.createLinearGradient(0, skylineY - 8, 0, skylineY);
    baseGlow.addColorStop(0, 'rgba(176, 38, 255, 0)');
    baseGlow.addColorStop(1, 'rgba(176, 38, 255, 0.25)');
    ctx.fillStyle = baseGlow;
    for (const b of buildings) {
      ctx.fillRect(b.x, skylineY - 8, b.w, 8);
    }

    // 建筑顶部 L 形 HUD 角标（参考弹窗 HUD 角标思路，为每栋建筑添加科技感装饰）
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.55)';
    ctx.lineWidth = 1;
    for (const b of buildings) {
      const topY = skylineY - b.h;
      // 左上角 L 标
      ctx.beginPath();
      ctx.moveTo(b.x, topY + 4);
      ctx.lineTo(b.x, topY);
      ctx.lineTo(b.x + 4, topY);
      ctx.stroke();
      // 右上角 L 标
      ctx.beginPath();
      ctx.moveTo(b.x + b.w - 4, topY);
      ctx.lineTo(b.x + b.w, topY);
      ctx.lineTo(b.x + b.w, topY + 4);
      ctx.stroke();
    }
  }

  /**
   * 赛博城市远景贴图渲染
   * 与角色同思路：drawImage + 全息滤镜（brightness/saturate/drop-shadow 霓虹发光）
   * 贴图横向铺满天空区域（0 ~ groundY），底部对齐地平线
   * 贴图未加载完成时回退到几何绘制（renderNeonCityline + renderCityHudOverlay）
   */
  private renderCityBgTexture(ctx: CanvasRenderingContext2D, width: number, groundY: number): void {
    const img = this.sprites.cityBg;
    if (!img) {
      // 回退：贴图未加载完成时用原几何绘制
      this.renderNeonCityline(ctx, width, groundY);
      this.renderCityHudOverlay(ctx, width, groundY);
      return;
    }

    const skyH = groundY;
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;

    // 按"覆盖天空区域 + 底部对齐地平线"策略缩放：以天空高度为基准等比缩放，横向居中裁剪/铺满
    // 战斗画布通常较宽较矮，贴图为 16:9，这里以高度填满 skyH，宽度按比例计算并居中
    const scale = skyH / imgH;
    const drawW = imgW * scale;
    const drawH = skyH;
    // 横向居中；若绘制宽度不足画布宽度，则平铺重复以铺满
    const drawX = (width - drawW) / 2;

    ctx.save();
    // 全息滤镜：轻微提亮 + 增强饱和 + 霓虹发光投影（与角色同思路，但更克制作为远景）
    ctx.filter = 'brightness(1.05) saturate(1.15) drop-shadow(0 0 10px rgba(176, 38, 255, 0.35)) drop-shadow(0 0 18px rgba(0, 245, 212, 0.18))';
    ctx.globalAlpha = 0.92;

    if (drawW >= width) {
      // 单张足够铺满，居中绘制
      ctx.drawImage(img, drawX, 0, drawW, drawH);
    } else {
      // 宽度不足，左右平铺重复以铺满画布
      // 先从 drawX 开始向右铺
      let x = drawX;
      while (x < width) {
        ctx.drawImage(img, 0, 0, imgW, imgH, x, 0, drawW, drawH);
        x += drawW;
      }
      // 再从 drawX 向左铺
      x = drawX - drawW;
      while (x > -drawW) {
        ctx.drawImage(img, 0, 0, imgW, imgH, x, 0, drawW, drawH);
        x -= drawW;
      }
    }
    ctx.restore();

    // 顶部渐隐：避免贴图顶部与天空渐变接缝生硬
    const topFade = ctx.createLinearGradient(0, 0, 0, skyH * 0.25);
    topFade.addColorStop(0, 'rgba(10, 8, 20, 0.55)');
    topFade.addColorStop(1, 'rgba(10, 8, 20, 0)');
    ctx.fillStyle = topFade;
    ctx.fillRect(0, 0, width, skyH * 0.25);

    // 底部融入雾霭：贴图底部与地平线雾霭过渡
    const bottomFade = ctx.createLinearGradient(0, skyH - 40, 0, skyH);
    bottomFade.addColorStop(0, 'rgba(30, 26, 53, 0)');
    bottomFade.addColorStop(1, 'rgba(30, 26, 53, 0.45)');
    ctx.fillStyle = bottomFade;
    ctx.fillRect(0, skyH - 40, width, 40);
  }

  /**
   * 城市上空 HUD 全息覆盖层
   * 参考弹窗 ModalHudBackground 思路：菱形网格 + 斜向数据流迹线 + 散落方块节点 +
   * 中心十字准星 + 横向装饰线 + 顶部高光扫描带
   * 全部极淡 alpha，作为远景融入天空，不抢前景戏
   */
  private renderCityHudOverlay(ctx: CanvasRenderingContext2D, width: number, groundY: number): void {
    // 只在地平线以上的天空区域绘制
    const skyH = groundY;

    // —— 层1：菱形网格（45° 旋转的方格，极淡紫色）——
    ctx.save();
    ctx.strokeStyle = 'rgba(176, 38, 255, 0.05)';
    ctx.lineWidth = 0.5;
    const diamondSize = 26;
    const diag = diamondSize * Math.SQRT2;
    for (let y = -diag; y < skyH + diag; y += diag) {
      for (let x = -diag; x < width + diag; x += diag) {
        // 菱形单元
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + diamondSize / 2, y + diamondSize / 2);
        ctx.lineTo(x, y + diamondSize);
        ctx.lineTo(x - diamondSize / 2, y + diamondSize / 2);
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.restore();

    // —— 层2：斜向数据流迹线（30° 倾斜的短迹线+方块节点+三角箭头，青色）——
    ctx.save();
    ctx.translate(width / 2, skyH / 2);
    ctx.rotate((30 * Math.PI) / 180);
    ctx.translate(-width / 2, -skyH / 2);
    // 扩大绘制范围以覆盖旋转后的天空区域
    const ext = Math.max(width, skyH);
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.10)';
    ctx.fillStyle = 'rgba(0, 245, 212, 0.20)';
    ctx.lineWidth = 0.6;
    const flowStep = 60; // 稀疏
    for (let y = -ext; y < ext * 2; y += flowStep) {
      // 主迹线（断续两段）
      ctx.beginPath();
      ctx.moveTo(-ext, y);
      ctx.lineTo(-ext + 22, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-ext + 28, y);
      ctx.lineTo(-ext + 50, y);
      ctx.stroke();
      // 中段方块节点
      ctx.fillRect(-ext + 24, y - 1.5, 3, 3);
      // 末端三角箭头
      ctx.beginPath();
      ctx.moveTo(-ext + 50, y - 2);
      ctx.lineTo(-ext + 54, y);
      ctx.lineTo(-ext + 50, y + 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // —— 层3：散落方块数据节点（确定性位置，固定 alpha 模拟呼吸后状态）——
    // 用确定性算法避免每帧闪烁，因背景是静态缓存
    const nodes = [
      { x: width * 0.12, y: skyH * 0.22, s: 3, c: 'rgba(0, 245, 212, 0.45)' },
      { x: width * 0.82, y: skyH * 0.18, s: 2.5, c: 'rgba(176, 38, 255, 0.45)' },
      { x: width * 0.28, y: skyH * 0.55, s: 2.5, c: 'rgba(255, 0, 128, 0.4)' },
      { x: width * 0.68, y: skyH * 0.48, s: 3, c: 'rgba(0, 245, 212, 0.4)' },
      { x: width * 0.45, y: skyH * 0.12, s: 2, c: 'rgba(176, 38, 255, 0.4)' },
      { x: width * 0.55, y: skyH * 0.68, s: 2, c: 'rgba(0, 245, 212, 0.35)' },
      { x: width * 0.92, y: skyH * 0.62, s: 2.5, c: 'rgba(176, 38, 255, 0.4)' },
      { x: width * 0.05, y: skyH * 0.45, s: 2, c: 'rgba(255, 230, 0, 0.35)' },
    ];
    for (const n of nodes) {
      ctx.fillStyle = n.c;
      ctx.fillRect(n.x - n.s / 2, n.y - n.s / 2, n.s, n.s);
      // 节点外发光晕（极淡）
      const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.s * 3);
      glow.addColorStop(0, n.c);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(n.x - n.s * 3, n.y - n.s * 3, n.s * 6, n.s * 6);
    }

    // —— 层4：天空中央十字准星（远景瞄准点，紫青双色）——
    const cx = width / 2;
    const cy = skyH * 0.35;
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.30)';
    ctx.lineWidth = 0.8;
    // 横线
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy);
    ctx.lineTo(cx - 3, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 3, cy);
    ctx.lineTo(cx + 14, cy);
    ctx.stroke();
    // 竖线
    ctx.strokeStyle = 'rgba(176, 38, 255, 0.30)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx, cy - 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 3);
    ctx.lineTo(cx, cy + 14);
    ctx.stroke();
    // 中心小点
    ctx.fillStyle = 'rgba(0, 245, 212, 0.5)';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);

    // —— 层5：地平线上方横向 HUD 装饰线（带刻度）——
    const decoY = skyH - 30;
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.18)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(width * 0.08, decoY);
    ctx.lineTo(width * 0.92, decoY);
    ctx.stroke();
    // 刻度
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.25)';
    for (let x = width * 0.1; x < width * 0.92; x += 20) {
      const tickH = (Math.floor(x / 60) % 3 === 0) ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(x, decoY);
      ctx.lineTo(x, decoY - tickH);
      ctx.stroke();
    }

    // —— 层6：顶部高光扫描带（天空顶部一道淡青色渐隐带）——
    const scanGrad = ctx.createLinearGradient(0, 0, 0, skyH * 0.12);
    scanGrad.addColorStop(0, 'rgba(0, 245, 212, 0.10)');
    scanGrad.addColorStop(1, 'rgba(0, 245, 212, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, 0, width, skyH * 0.12);

    // —— 层7：左右竖向 HUD 框线（极淡）——
    ctx.strokeStyle = 'rgba(176, 38, 255, 0.18)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(2, skyH * 0.15);
    ctx.lineTo(2, skyH * 0.85);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.18)';
    ctx.beginPath();
    ctx.moveTo(width - 2, skyH * 0.15);
    ctx.lineTo(width - 2, skyH * 0.85);
    ctx.stroke();
  }

  private renderArenaPlatform(ctx: CanvasRenderingContext2D, width: number, groundY: number, canvasHeight: number): void {
    const platformTop = groundY + 2;
    const platformHeight = canvasHeight - platformTop;
    const edgeWidth = 24;

    ctx.fillStyle = 'rgba(20, 16, 42, 0.6)';
    ctx.fillRect(0, platformTop, width, platformHeight);

    const edgeGrad = ctx.createLinearGradient(0, platformTop, 0, platformTop + 4);
    edgeGrad.addColorStop(0, 'rgba(0, 245, 212, 0.7)');
    edgeGrad.addColorStop(1, 'rgba(0, 245, 212, 0)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, platformTop, width, 4);

    const pulse = 0.5 + Math.sin(this.animFrame * 0.08) * 0.3;
    ctx.fillStyle = `rgba(0, 245, 212, ${pulse})`;
    ctx.fillRect(0, platformTop, width, 1);

    // 左侧能量场边界 - 从顶部延伸到底部，铺满左侧边缘
    const leftEdgeGrad = ctx.createLinearGradient(0, platformTop, edgeWidth, platformTop);
    leftEdgeGrad.addColorStop(0, 'rgba(176, 38, 255, 0.5)');
    leftEdgeGrad.addColorStop(0.4, 'rgba(176, 38, 255, 0.2)');
    leftEdgeGrad.addColorStop(1, 'rgba(176, 38, 255, 0)');
    ctx.fillStyle = leftEdgeGrad;
    ctx.fillRect(0, platformTop, edgeWidth, platformHeight);

    // 右侧能量场边界
    const rightEdgeGrad = ctx.createLinearGradient(width - edgeWidth, platformTop, width, platformTop);
    rightEdgeGrad.addColorStop(0, 'rgba(176, 38, 255, 0)');
    rightEdgeGrad.addColorStop(0.6, 'rgba(176, 38, 255, 0.2)');
    rightEdgeGrad.addColorStop(1, 'rgba(176, 38, 255, 0.5)');
    ctx.fillStyle = rightEdgeGrad;
    ctx.fillRect(width - edgeWidth, platformTop, edgeWidth, platformHeight);

    // 左右边缘垂直扫描线 - 强化边界感
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.3)';
    ctx.lineWidth = 1;
    const scanOffset = (this.animFrame * 1.5) % 30;
    for (let sy = platformTop + scanOffset; sy < canvasHeight; sy += 30) {
      ctx.globalAlpha = 0.4 + Math.sin(sy * 0.1) * 0.2;
      ctx.beginPath();
      ctx.moveTo(2, sy);
      ctx.lineTo(2, sy + 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width - 2, sy);
      ctx.lineTo(width - 2, sy + 12);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 边缘顶部发光节点
    const nodeGlow = 0.6 + Math.sin(this.animFrame * 0.1) * 0.3;
    ctx.fillStyle = `rgba(0, 245, 212, ${nodeGlow})`;
    ctx.fillRect(0, platformTop - 1, 6, 3);
    ctx.fillRect(width - 6, platformTop - 1, 6, 3);

    // 底部边缘光 - 战斗场地底部边界
    const bottomGlow = ctx.createLinearGradient(0, canvasHeight - 8, 0, canvasHeight);
    bottomGlow.addColorStop(0, 'rgba(0, 245, 212, 0)');
    bottomGlow.addColorStop(1, 'rgba(176, 38, 255, 0.3)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, canvasHeight - 8, width, 8);

    ctx.fillStyle = `rgba(176, 38, 255, ${0.3 + Math.sin(this.animFrame * 0.06) * 0.15})`;
    ctx.fillRect(0, canvasHeight - 1, width, 1);
  }

  private renderTechGrid(ctx: CanvasRenderingContext2D, width: number, groundY: number, canvasHeight: number): void {
    const gridColor = 'rgba(0, 245, 212, 0.06)';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;

    // 水平线
    for (let y = groundY + 10; y < canvasHeight; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 垂直线 - 透视效果
    const centerX = width / 2;
    for (let i = -15; i <= 15; i++) {
      const x = centerX + i * 25;
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(centerX + i * 40, canvasHeight);
      ctx.stroke();
    }

    // 发光网格交叉点
    ctx.fillStyle = 'rgba(0, 245, 212, 0.15)';
    for (let y = groundY + 10; y < canvasHeight; y += 24) {
      for (let x = 20; x < width; x += 40) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  private renderTechParticles(ctx: CanvasRenderingContext2D, width: number, groundY: number): void {
    // 漂浮的霓虹粒子
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const t = (this.animFrame * 0.02 + i * 0.3) % (Math.PI * 2);
      const x = (Math.sin(t * 1.3 + i) * 0.5 + 0.5) * width;
      const y = (Math.cos(t * 0.7 + i * 0.5) * 0.5 + 0.5) * groundY;
      const size = 1 + Math.sin(t * 2) * 0.5;
      const alpha = 0.2 + Math.sin(t * 3) * 0.15;

      const colors = ['#B026FF', '#00F5D4', '#FF0080', '#4FACFE'];
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 上升的微粒
    for (let i = 0; i < 15; i++) {
      const t = (this.animFrame * 0.015 + i * 0.4) % 1;
      const x = (i * 30 + Math.sin(this.animFrame * 0.02 + i) * 20) % width;
      const y = groundY - t * groundY * 0.8;
      const alpha = (1 - t) * 0.25;

      ctx.fillStyle = '#B026FF';
      ctx.globalAlpha = alpha;
      ctx.fillRect(x, y, 1, 2);
    }
    ctx.globalAlpha = 1;
  }

  private renderNeonBeams(ctx: CanvasRenderingContext2D, width: number, groundY: number, px: number): void {
    // 远处霓虹光柱
    const beams = [
      { x: 60, color: '#B026FF', width: 3 },
      { x: 180, color: '#00F5D4', width: 2 },
      { x: 300, color: '#FF0080', width: 4 },
      { x: 380, color: '#4FACFE', width: 2 },
    ];

    for (const beam of beams) {
      const pulse = 0.3 + Math.sin(this.animFrame * 0.03 + beam.x * 0.01) * 0.15;
      ctx.fillStyle = beam.color;
      ctx.globalAlpha = pulse;
      ctx.fillRect(beam.x - beam.width / 2, 0, beam.width, groundY - 20);

      // 光柱顶部发光
      ctx.globalAlpha = pulse * 0.5;
      ctx.fillRect(beam.x - beam.width, groundY - 25, beam.width * 2, 8);
    }
    ctx.globalAlpha = 1;
  }
}
