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
  };
}

// BALANCE v13: Optimized skill values - smoother progression curve
export const SKILLS: Skill[] = [
  createSkill('atk_1', '力量训练I', '💪', '攻击力+4/级', 1, 1, [], 5),
  createSkill('atk_2', '力量训练II', '💪', '攻击力+8/级', 3, 20, ['atk_1'], 5),
  createSkill('atk_3', '力量训练III', '💪', '攻击力+14/级', 5, 50, ['atk_2'], 5),
  createSkill('atk_4', '狂暴之力', '🔥', '攻击力+24/级', 8, 80, ['atk_3'], 5),
  createSkill('atk_5', '战神附体', '⚔️', '攻击力+40/级', 12, 120, ['atk_4'], 5),

  createSkill('spd_1', '敏捷训练I', '👟', '攻速+2.5%/级', 1, 1, [], 5),
  createSkill('spd_2', '敏捷训练II', '👟', '攻速+3.5%/级', 3, 20, ['spd_1'], 5),
  createSkill('spd_3', '疾风步', '💨', '攻速+4.5%/级', 5, 50, ['spd_2'], 5),
  createSkill('spd_5', '时间加速', '⏱️', '攻速+6%/级', 8, 80, ['spd_3'], 5),

  createSkill('rng_4', '鹰眼视野', '🦅', '射程+80/级', 5, 50, [], 5),

  createSkill('crit_1', '暴击入门I', '💥', '暴击率+1.2%/级', 1, 2, [], 5),
  createSkill('crit_2', '暴击入门II', '💥', '暴击率+2.5%/级', 3, 20, ['crit_1'], 5),
  createSkill('crit_3', '致命一击', '☠️', '暴击率+4%/级', 5, 50, ['crit_2'], 5),
  createSkill('crit_4', '死神之触', '💀', '暴击率+6.5%/级', 8, 80, ['crit_3'], 5),

  createSkill('cdmg_1', '暴击伤害I', '⚔️', '暴击伤害+10%/级', 3, 20, ['crit_1'], 5),
  createSkill('cdmg_2', '暴击伤害II', '⚔️', '暴击伤害+20%/级', 5, 50, ['cdmg_1', 'crit_2'], 5),
  createSkill('cdmg_3', '毁天灭地', '💫', '暴击伤害+40%/级', 10, 150, ['cdmg_2', 'crit_3'], 5),

  createSkill('hp_1', '生命强化I', '❤️', '最大生命+30/级', 1, 1, [], 5),
  createSkill('hp_2', '生命强化II', '❤️', '最大生命+60/级', 3, 20, ['hp_1'], 5),
  createSkill('hp_3', '生命强化III', '❤️', '最大生命+100/级', 5, 50, ['hp_2'], 5),
  createSkill('hp_4', '不灭之躯', '💖', '最大生命+160/级', 8, 80, ['hp_3'], 5),

  createSkill('def_1', '防御训练I', '🛡️', '减伤+3%/级', 1, 2, [], 5),
  createSkill('def_2', '防御训练II', '🛡️', '减伤+5.5%/级', 3, 20, ['def_1'], 5),
  createSkill('def_3', '铁壁', '🏰', '减伤+9%/级', 5, 50, ['def_2'], 5),
  createSkill('def_4', '金刚不坏', '🔷', '减伤+14%/级', 8, 80, ['def_3'], 5),

  createSkill('regen_1', '生命恢复I', '💚', '每秒恢复1%生命', 3, 20, ['hp_1'], 5),
  createSkill('regen_2', '生命恢复II', '💚', '每秒恢复1.8%生命', 5, 50, ['regen_1', 'hp_2'], 5),
  createSkill('regen_3', '生命涌动', '🌿', '每秒恢复2.8%生命', 8, 80, ['regen_2', 'hp_3'], 5),

  createSkill('magnet_1', '磁力装置', '🧲', '拾取范围+150', 1, 2, [], 5),

  createSkill('gold_1', '财富嗅觉', '💰', '金币掉落+30%', 3, 20, [], 5),
  createSkill('gold_2', '寻宝达人', '💎', '金币掉落+70%', 5, 50, ['gold_1'], 5),

  createSkill('exp_1', '学习能力', '📚', '经验获取+20%', 3, 20, [], 5),
  createSkill('exp_2', '学霸', '🎓', '经验获取+45%', 5, 50, ['exp_1'], 5),

  createSkill('drop_1', '幸运儿', '🍀', '物品掉率+15%', 3, 20, [], 5),
  createSkill('drop_2', '欧皇附体', '👑', '物品掉率+35%', 5, 50, ['drop_1'], 5),

  createSkill('lightning_1', '雷霆射击', '⚡', '攻击有2.5%概率触发感电，伤害链2个敌人', 5, 50, ['spd_1'], 5),
  createSkill('lightning_2', '万雷天牢', '🌩️', '攻击有4%概率触发感电，伤害链3个敌人', 8, 80, ['lightning_1', 'spd_2'], 5),

  createSkill('lifesteal_1', '吸血打击', '🩸', '攻击回复0.4%最大生命', 3, 20, ['hp_1'], 5),
  createSkill('lifesteal_2', '嗜血狂魔', '🔮', '攻击回复0.9%最大生命', 5, 50, ['lifesteal_1', 'hp_2'], 5),

  createSkill('piercing_2', '穿云箭', '🌪️', '子弹穿透6个敌人', 5, 50, [], 5),

  
  // BALANCE v12: Optimized elemental skills - better percentages and damage scaling
// ============ 元素攻击技能 ============
  createSkill('fire_shot_1', '烈焰弹', '🔥', '攻击有3%概率发射烈焰弹，造成(Lv×攻击力)火焰伤害并触发灼烧', 5, 40, ['atk_1'], 5),
  createSkill('fire_shot_2', '烈焰风暴', '🌋', '攻击有5%概率发射烈焰弹，造成(1.5×Lv×攻击力)火焰伤害并触发强灼烧', 8, 80, ['fire_shot_1', 'atk_2'], 5),
  
  createSkill('poison_shot_1', '毒素射击', '☠️', '攻击有4%概率发射毒素弹，造成(Lv×攻击力)毒素伤害并触发中毒', 5, 40, ['atk_1'], 5),
  createSkill('poison_shot_2', '致命毒素', '💀', '攻击有6%概率发射毒素弹，造成(1.5×Lv×攻击力)毒素伤害并触发强中毒', 8, 80, ['poison_shot_1', 'atk_2'], 5),
  
  createSkill('ice_shot_1', '冰霜弹', '❄️', '攻击有3%概率发射冰霜弹，造成(Lv×攻击力)冰霜伤害并减速敌人50%', 5, 40, ['spd_1'], 5),
  createSkill('ice_shot_2', '极寒领域', '🧊', '攻击有5%概率发射冰霜弹，造成(1.5×Lv×攻击力)冰霜伤害并冰冻敌人', 8, 80, ['ice_shot_1', 'spd_2'], 5),

// ============ 左树：特效技能 ============
  createSkill('fx_bullet_1', '增加子弹数', '🔆', '连发效果，每级+1连发次数，满级连发3枪，每隔0.1秒发射一枪', 5, 30, [], 2, 0),
  createSkill('fx_sync_1', '同步发射', '🎯', '单次发射数增加，每级+1目标，满级单次3颗分别打最近3名敌人，受连发增益', 6, 40, ['fx_bullet_1'], 2, 0),
  createSkill('fx_bomb_1', '发射爆弹', '☄️', '每次普通攻击2%几率发射爆弹，弹道速度为普攻1/3，命中时对直径内敌人造成（Lv*攻击力）伤害，每级+5px范围', 6, 40, ['fx_bullet_1'], 5, 0),
  createSkill('fx_burn_1', '爆弹灼烧', '🔥', '需学习发射爆弹。对爆弹命中敌人造成固定灼烧伤害，每级提升伤害', 8, 60, ['fx_bomb_1'], 5, 0),
  createSkill('fx_freeze_1', '冰冻弹', '❄️', '每次普通攻击2%几率发射冰冻弹，弹道速度为普攻1/2，命中时1%几率冰冻3秒，每级+2%发射几率和1%冰冻几率', 6, 40, ['fx_bullet_1'], 5, 0),
  createSkill('fx_poison_1', '毒气弹', '☣️', '每次普通攻击10%几率发射毒气弹，弹道速度为普攻1/4，命中时使30px范围内敌人中毒，每秒造成（Lv*攻击力）伤害，每级提升伤害', 6, 40, ['fx_bullet_1'], 5, 0),
  createSkill('fx_shock_1', '电击弹', '⚡', '每次普通攻击5%几率发射50px波浪线电击弹（内置5秒CD），命中后连锁2个敌人造成（Lv*攻击力）伤害，每级+5%几率和连锁范围', 6, 40, [], 5, 0),
  createSkill('fx_laser_1', '激光炮', '⚡', '发射持续5秒激光，对直线敌人造成10次伤害，总伤害为（Lv*攻击力），分身减半同步发射，每级+20%激光大小', 8, 60, ['fx_bullet_1'], 3, 30000),
  createSkill('fx_flash_1', '全屏闪光', '🌟', '使所有敌人眩晕5秒，冷却50秒', 15, 100, ['fx_laser_1'], 1, 50000),
  createSkill('fx_grenade_1', '榴弹发射', '💣', '从后背发射榴弹，每级+1颗，每颗榴弹冷却1秒，抛物线轨迹', 8, 60, ['fx_bullet_1'], 3, 0),
  createSkill('fx_clone_grenade_1', '分身榴弹', '🧨', '分身同步发射榴弹，橙色拖尾，非前置技能', 12, 200, [], 3, 0),
  createSkill('fx_clone_shock_1', '分身电击', '🌩️', '分身同步发射电击弹，非前置技能', 12, 260, [], 3, 0),
  // 分身系列（独立树）
  createSkill('clone_1', '召唤分身', '👥', '在角色正上方和正下方召唤队友输出，每级召唤1个', 12, 160, [], 2, 0),
  createSkill('clone_bullet_1', '分身增弹', '💠', '分身连发效果，每级+1连发次数，满级2连发', 8, 180, ['clone_1'], 2, 0),
  createSkill('clone_sync_1', '分身同步', '💫', '分身单次发射数增加，每级+1目标，满级3颗分别打最近3名敌人，受连发增益', 10, 220, ['clone_bullet_1'], 2, 0),
  createSkill('clone_sweep', '战术横扫', '🌀', '10秒内连发翻倍（4*2=8），冰冻弹/爆弹/毒气弹100%发射，榴弹翻倍发射，分身也生效，冷却100秒', 20, 300, ['clone_sync_1', 'fx_flash_1'], 1, 100000),
];

// 右树：属性技能布局（保持现有）
export const SKILL_TREE_LAYERS = [
  ['atk_1', 'spd_1', 'hp_1', 'crit_1'],
  ['atk_2', 'spd_2', 'hp_2', 'crit_2', 'def_1', 'magnet_1', 'gold_1'],
  ['atk_3', 'spd_3', 'hp_3', 'crit_3', 'def_2', 'regen_1', 'gold_2', 'exp_1', 'drop_1', 'lifesteal_1', 'lightning_1', 'rng_4', 'piercing_2'],
  ['atk_4', 'spd_5', 'hp_4', 'crit_4', 'def_3', 'regen_2', 'exp_2', 'drop_2', 'cdmg_1', 'lightning_2', 'lifesteal_2'],
  ['atk_5', 'cdmg_2', 'regen_3'],
  ['cdmg_3'],
];

// 左树：特效技能布局
export const FX_SKILL_TREE_LAYERS: string[][] = [
  ['fx_bullet_1'],
  ['fx_sync_1', 'fx_bomb_1', 'fx_freeze_1', 'fx_poison_1', 'fx_shock_1'],
  ['fx_burn_1', 'fx_laser_1', 'fx_grenade_1', 'fire_shot_1', 'poison_shot_1', 'ice_shot_1'],
  ['fx_flash_1', 'fire_shot_2', 'poison_shot_2', 'ice_shot_2'],
];

// 分身树布局（底部独立）
export const CLONE_SKILL_TREE_LAYERS: string[][] = [
  ['clone_1'],
  ['clone_bullet_1'],
  ['clone_sync_1', 'fx_clone_grenade_1', 'fx_clone_shock_1'],
  ['clone_sweep'],
];
