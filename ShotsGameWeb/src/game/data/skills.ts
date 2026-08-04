import type { Skill } from '../types/game';

function createSkill(
  id: string,
  name: string,
  icon: string,
  description: string,
  cost: number,
  requiredLevel: number,
  requiredSkills: string[] = [],
  maxLevel: number = 1,
  cooldown: number = 0,
  cooldowns?: number[],
): Skill {
  return {
    id,
    name,
    icon,
    description,
    cooldown,
    currentCooldown: 0,
    level: 0,
    maxLevel,
    cost,
    requiredLevel,
    requiredSkills,
    cooldowns,
  };
}

// 属性技能：每个技能合并为单一技能，通过 maxLevel 控制成长上限
export const SKILLS: Skill[] = [
  // ===== 基础属性（Lv1解锁，可长期成长） =====
  createSkill('atk', '力量训练', '💪', '攻击力+5/级', 1, 1, [], 20),
  createSkill('spd', '敏捷训练', '👟', '攻速+3%/级', 1, 1, [], 15),
  createSkill('hp', '生命强化', '❤️', '最大生命+40/级', 1, 1, [], 20),
  createSkill('crit', '暴击精通', '💥', '暴击率+1%/级', 1, 2, [], 15),
  createSkill('def', '防御训练', '🛡️', '减伤+1%/级', 1, 2, [], 15),

  // ===== 进阶属性（Lv20解锁，需前置技能） =====
  createSkill('cdmg', '暴击伤害', '⚔️', '暴击伤害+3%/级', 3, 20, ['crit'], 15),
  createSkill('regen', '生命恢复', '💚', '每秒恢复0.2%最大生命/级', 3, 20, ['hp'], 10),
  createSkill('lifesteal', '吸血打击', '🩸', '攻击回复2点生命/级', 3, 20, ['hp'], 10),

  // ===== 高级属性（Lv50解锁） =====
  createSkill('piercing', '穿透射击', '🌪️', '子弹穿透+1敌人/级', 5, 50, [], 2),

  // BALANCE v13: Optimized elemental skills - Lv × ATK formula enforced

  // ============ 左树：特效技能 ============
  createSkill('fx_bullet_1', '增加子弹数', '🔆', '连发效果，每级+1连发次数，满级连发3枪，每隔0.1秒发射一枪', 5, 30, [], 2, 0),
  createSkill('fx_sync_1', '同步发射', '🎯', '单次发射数增加，每级+1目标，满级单次3颗分别打最近3名敌人，受连发增益', 6, 40, ['fx_bullet_1'], 2, 0),
  // 爆弹：主动技能（保留战术横扫中的被动触发）；命中爆炸半径40px+灼烧3秒，每级+10px范围
  createSkill('fx_bomb_1', '发射爆弹', '☄️', '主动：发射爆弹，命中爆炸对半径40px内敌人造成伤害并灼烧3秒（每秒10+10%攻击力），每级+10px范围。被动：战术横扫中100%发射。冷却8/7/6/5/4秒', 6, 20, ['fx_bullet_1'], 5, 8000, [8000, 7000, 6000, 5000, 4000]),
  // 冰冻弹：主动技能（保留战术横扫中的被动触发）；命中冰冻3秒，每级+1目标
  createSkill('fx_freeze_1', '冰冻弹', '❄️', '主动：发射冰冻弹，命中冰冻3秒，每级+1攻击目标。被动：战术横扫中100%发射。冷却5/4.5/4/3.5/3秒', 6, 10, ['fx_bullet_1'], 5, 5000, [5000, 4500, 4000, 3500, 3000]),
  // 毒气弹：主动技能（保留战术横扫中的被动触发）；命中产生毒气持续7秒，每级+10px范围和1秒持续
  createSkill('fx_poison_1', '毒气弹', '☣️', '主动：发射毒气弹，命中产生半径40px毒气持续7秒（每秒20+50%攻击力），每级+10px范围和1秒持续。被动：战术横扫中100%发射。冷却10/9/8/7/6秒', 6, 30, ['fx_bullet_1'], 5, 10000, [10000, 9000, 8000, 7000, 6000]),
  // 电击弹：主动技能；连锁电击目标+4个敌人，感电5秒（受到伤害+20%），每级+1连锁
  createSkill('fx_shock_1', '电击弹', '⚡', '主动：对目标及身后4个敌人连锁电击，每个受一次普攻伤害并感电5秒（受伤+20%），每级+1连锁。冷却15/14/13/12/11秒', 6, 40, [], 5, 15000, [15000, 14000, 13000, 12000, 11000]),
  createSkill('fx_laser_1', '激光炮', '⚡', '发射持续5秒激光，对直线敌人造成10次伤害，总伤害为（Lv*攻击力），分身减半同步发射，每级+20%激光大小', 8, 60, ['fx_bullet_1'], 3, 30000),
  createSkill('fx_flash_1', '全屏闪光', '🌟', '使所有敌人眩晕5秒，并造成每秒1%最大生命值的伤害，持续5秒，冷却50秒', 15, 100, ['fx_laser_1'], 1, 50000),
  // 终极核弹：主动技能，抛物线发射核弹到敌人中心，大范围爆炸
  createSkill('fx_nuke_1', '终极核弹', '☢️', '主动：抛物线发射核弹至所有敌人中心，对半径100px圆内敌人造成1000%攻击力伤害，每级+100px半径和1000%伤害。冷却50/40秒', 20, 200, ['fx_flash_1'], 2, 50000, [50000, 40000]),
  createSkill('fx_grenade_1', '榴弹发射', '💣', '从后背发射榴弹，每级+1颗，每颗榴弹冷却1秒，抛物线轨迹', 8, 60, ['fx_bullet_1'], 3, 0),
  createSkill('fx_clone_grenade_1', '分身榴弹', '🧨', '分身同步发射榴弹，橙色拖尾，非前置技能', 12, 200, [], 3, 0),
  createSkill('fx_clone_shock_1', '分身电击', '🌩️', '分身同步发射电击弹，非前置技能', 12, 260, [], 3, 0),
  // 分身系列（独立树）
  createSkill('clone_1', '召唤分身', '👥', '在角色正上方和正下方召唤队友输出，每级召唤1个', 12, 160, [], 2, 0),
  createSkill('clone_bullet_1', '分身增弹', '💠', '分身连发效果，每级+1连发次数，满级2连发', 8, 180, ['clone_1'], 2, 0),
  createSkill('clone_sync_1', '分身同步', '💫', '分身单次发射数增加，每级+1目标，满级3颗分别打最近3名敌人，受连发增益', 10, 220, ['clone_bullet_1'], 2, 0),
  createSkill('clone_sweep', '战术横扫', '🌀', '10秒内连发翻倍（4*2=8），冰冻弹/爆弹/毒气弹100%发射，榴弹翻倍发射，分身也生效，冷却100秒', 20, 300, ['clone_sync_1', 'fx_flash_1'], 1, 100000),
];

// 右树：属性技能布局（合并后精简为3层）
export const SKILL_TREE_LAYERS = [
  ['atk', 'spd', 'hp', 'crit', 'def'],
  ['cdmg', 'regen', 'lifesteal'],
  ['piercing'],
];

// 左树：特效技能布局
export const FX_SKILL_TREE_LAYERS: string[][] = [
  ['fx_bullet_1'],
  ['fx_sync_1', 'fx_bomb_1', 'fx_freeze_1', 'fx_poison_1', 'fx_shock_1'],
  ['fx_laser_1', 'fx_grenade_1'],
  ['fx_flash_1'],
  ['fx_nuke_1'],
];

// 分身树布局（底部独立）
export const CLONE_SKILL_TREE_LAYERS: string[][] = [
  ['clone_1'],
  ['clone_bullet_1'],
  ['clone_sync_1', 'fx_clone_grenade_1', 'fx_clone_shock_1'],
  ['clone_sweep'],
];
