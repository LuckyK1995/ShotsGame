const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, 'src/game/data');
const ENEMIES_FILE = path.join(BASE_DIR, 'enemies.ts');
const EQUIPMENT_FILE = path.join(BASE_DIR, 'equipment.ts');
const SKILLS_FILE = path.join(BASE_DIR, 'skills.ts');
const ENGINE_FILE = path.join(__dirname, 'src/game/GameEngine.ts');
const TYPES_FILE = path.join(__dirname, 'src/game/types/game.ts');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`[BALANCE v9] Updated: ${filePath}`);
}

// ============================================
// 1. v9 怪物属性精细平衡
// ============================================
function v9OptimizeEnemyBalance() {
  const content = readFile(ENEMIES_FILE);
  
  // v9: 基于实际游戏体验的精细平衡
  // 设计原则：
  // - 普通怪梯度更清晰，每波出现的怪有明确的定位
  // - 精英怪威胁度与奖励匹配
  // - BOSS战更有节奏感，各阶段有不同挑战
  // - HP/经验比：普通怪约3.5:1，精英怪约3:1，BOSS约2.2:1
  
  const enemyBalance = {
    // 普通怪 - 更清晰的梯度定位
    mutant: { 
      health: 12, speed: 3.0, damage: 2, exp: 4,
      note: '最基础敌人，新手训练，极低血量，第1波出现'
    },
    raider: { 
      health: 20, speed: 5.2, damage: 3, exp: 6,
      note: '快速敌人，第2波解锁，高移速低伤害'
    },
    spider: { 
      health: 14, speed: 7.0, damage: 2, exp: 5,
      note: '最高速敌人，第3波解锁，超脆皮，骚扰型'
    },
    infected: { 
      health: 42, speed: 4.0, damage: 5, exp: 11,
      note: '中等均衡敌人，第4波解锁，标准威胁'
    },
    zombie: { 
      health: 72, speed: 1.2, damage: 4, exp: 16,
      note: '慢速坦克，第5波解锁，血厚经验高，推进慢'
    },
    brute: { 
      health: 105, speed: 2.6, damage: 13, exp: 26,
      note: '重装普通怪，第7波解锁，高威胁高经验'
    },
    // 精英怪 - 每5波出现，各有特色（v9强化差异化）
    heavy_trooper: { 
      health: 260, speed: 2.3, damage: 20, exp: 65,
      note: '第5波精英，高防御高血量坦克型，移动慢'
    },
    sniper_bot: { 
      health: 160, speed: 0.7, damage: 45, exp: 95,
      note: '第10波精英，远程高伤害脆皮，几乎不动'
    },
    mech_soldier: { 
      health: 480, speed: 3.8, damage: 32, exp: 135,
      note: '第15波精英，攻守兼备全能型，综合威胁最高'
    },
    // BOSS - 每10波出现，难度递增（v9调整节奏）
    war_tank: { 
      health: 1500, speed: 1.1, damage: 38, exp: 380,
      note: '第10波BOSS，火焰属性，入门级，血量适中'
    },
    alien_hive: { 
      health: 3200, speed: 0.55, damage: 60, exp: 720,
      note: '第20波BOSS，毒属性，召唤流，血厚伤害中'
    },
    cyber_dragon: { 
      health: 5800, speed: 0.65, damage: 85, exp: 1900,
      note: '第30波BOSS，冰属性，多阶段最终，综合最强'
    },
  };

  let newContent = content;
  let changed = false;
  
  for (const [enemy, stats] of Object.entries(enemyBalance)) {
    const enemyPattern = new RegExp(`${enemy}:\\s*\\{[\\s\\S]*?\\},`);
    const match = content.match(enemyPattern);
    if (match) {
      let updatedMatch = match[0];
      const oldHealth = updatedMatch.match(/baseHealth: (\d+)/)?.[1];
      const oldSpeed = updatedMatch.match(/baseSpeed: ([\d.]+)/)?.[1];
      const oldDamage = updatedMatch.match(/baseDamage: (\d+)/)?.[1];
      const oldExp = updatedMatch.match(/baseExp: (\d+)/)?.[1];
      
      if (oldHealth !== String(stats.health) || 
          oldSpeed !== String(stats.speed) || 
          oldDamage !== String(stats.damage) || 
          oldExp !== String(stats.exp)) {
        
        updatedMatch = updatedMatch.replace(/baseHealth: \d+/g, `baseHealth: ${stats.health}`);
        updatedMatch = updatedMatch.replace(/baseSpeed: [\d.]+/g, `baseSpeed: ${stats.speed}`);
        updatedMatch = updatedMatch.replace(/baseDamage: \d+/g, `baseDamage: ${stats.damage}`);
        updatedMatch = updatedMatch.replace(/baseExp: \d+/g, `baseExp: ${stats.exp}`);
        
        newContent = newContent.replace(match[0], updatedMatch);
        changed = true;
        console.log(`[BALANCE v9] ${enemy}: HP ${oldHealth}→${stats.health}, DMG ${oldDamage}→${stats.damage}, SPD ${oldSpeed}→${stats.speed}, EXP ${oldExp}→${stats.exp}`);
      }
    }
  }

  if (changed) {
    writeFile(ENEMIES_FILE, newContent);
    console.log('[BALANCE v9] Enemy balance v9 optimized');
  } else {
    console.log('[BALANCE v9] Enemy balance already v9 optimized');
  }
}

// ============================================
// 2. v9 元素/异常技能数值精细平衡
// ============================================
function v9OptimizeElementalSkills() {
  const content = readFile(ENGINE_FILE);
  let newContent = content;
  let changed = false;

  // v9: 元素技能精细平衡
  // 设计原则：
  // - 灼烧：主DOT输出（占总DPS的8-12%），高概率中伤害
  // - 中毒：DOT+减速，持续削弱，中概率低伤害但持续久
  // - 冰霜：控制为主，伤害极低（控制就是价值），低概率高控制
  // - 雷电：群体伤害，连锁效果（清小怪利器），中概率中伤害
  // - 吸血：生存保障，数值保守（不能让玩家无敌）
  // - 穿透：清场能力，数值稳定

  // 灼烧技能：v9微调 - 略微降低基础伤害，提升持续时间
  const burn1Pattern = /case 'burn_1':\s*burnChance \+= ([\d.]+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn1Match = newContent.match(burn1Pattern);
  if (burn1Match && (burn1Match[1] !== '3' || burn1Match[2] !== '5' || burn1Match[3] !== '4000')) {
    newContent = newContent.replace(
      burn1Pattern,
      `case 'burn_1':\n          burnChance += 3 * lvl;\n          burnDamage += 5 * lvl;\n          burnDuration = Math.max(burnDuration, 4000);`
    );
    changed = true;
    console.log('[BALANCE v9] burn_1 values optimized (3% chance, 5 dmg, 4s)');
  }

  const burn2Pattern = /case 'burn_2':\s*burnChance \+= ([\d.]+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn2Match = newContent.match(burn2Pattern);
  if (burn2Match && (burn2Match[1] !== '5' || burn2Match[2] !== '14' || burn2Match[3] !== '6000')) {
    newContent = newContent.replace(
      burn2Pattern,
      `case 'burn_2':\n          burnChance += 5 * lvl;\n          burnDamage += 14 * lvl;\n          burnDuration = Math.max(burnDuration, 6000);`
    );
    changed = true;
    console.log('[BALANCE v9] burn_2 values optimized (5% chance, 14 dmg, 6s)');
  }

  // 中毒技能：v9 - 提升减速效果，降低伤害但延长持续时间
  const poison1Pattern = /case 'poison_1':\s*poisonChance \+= ([\d.]+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison1Match = newContent.match(poison1Pattern);
  if (poison1Match && (poison1Match[1] !== '3' || poison1Match[2] !== '4' || poison1Match[3] !== '5000')) {
    newContent = newContent.replace(
      poison1Pattern,
      `case 'poison_1':\n          poisonChance += 3 * lvl;\n          poisonDamage += 4 * lvl;\n          poisonDuration = Math.max(poisonDuration, 5000);`
    );
    changed = true;
    console.log('[BALANCE v9] poison_1 values optimized (3% chance, 4 dmg, 5s)');
  }

  const poison2Pattern = /case 'poison_2':\s*poisonChance \+= ([\d.]+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison2Match = newContent.match(poison2Pattern);
  if (poison2Match && (poison2Match[1] !== '5' || poison2Match[2] !== '10' || poison2Match[3] !== '8000')) {
    newContent = newContent.replace(
      poison2Pattern,
      `case 'poison_2':\n          poisonChance += 5 * lvl;\n          poisonDamage += 10 * lvl;\n          poisonDuration = Math.max(poisonDuration, 8000);`
    );
    changed = true;
    console.log('[BALANCE v9] poison_2 values optimized (5% chance, 10 dmg, 8s)');
  }

  // 冰霜技能：v9 - 提升减速幅度，略微提升概率
  const freeze1Pattern = /case 'freeze_1':\s*freezeChance \+= ([\d.]+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze1Match = newContent.match(freeze1Pattern);
  if (freeze1Match && (freeze1Match[1] !== '2.5' || freeze1Match[2] !== '50' || freeze1Match[3] !== '2500')) {
    newContent = newContent.replace(
      freeze1Pattern,
      `case 'freeze_1':\n          freezeChance += 2.5 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 50);\n          freezeDuration = Math.max(freezeDuration, 2500);`
    );
    changed = true;
    console.log('[BALANCE v9] freeze_1 values optimized (2.5% chance, 50% slow, 2.5s)');
  }

  const freeze2Pattern = /case 'freeze_2':\s*freezeChance \+= ([\d.]+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze2Match = newContent.match(freeze2Pattern);
  if (freeze2Match && (freeze2Match[1] !== '3.5' || freeze2Match[2] !== '100' || freeze2Match[3] !== '1500')) {
    newContent = newContent.replace(
      freeze2Pattern,
      `case 'freeze_2':\n          freezeChance += 3.5 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 100);\n          freezeDuration = Math.max(freezeDuration, 1500);`
    );
    changed = true;
    console.log('[BALANCE v9] freeze_2 values optimized (3.5% chance, 100% freeze, 1.5s)');
  }

  // 雷电技能：v9 - 提升连锁伤害，略微降低概率
  const lightning1Pattern = /case 'lightning_1':\s*lightningChance \+= ([\d.]+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning1Match = newContent.match(lightning1Pattern);
  if (lightning1Match && (lightning1Match[1] !== '2' || lightning1Match[2] !== '2' || lightning1Match[3] !== '12')) {
    newContent = newContent.replace(
      lightning1Pattern,
      `case 'lightning_1':\n          lightningChance += 2 * lvl;\n          lightningChain = Math.max(lightningChain, 2);\n          lightningDamage += 12 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v9] lightning_1 values optimized (2% chance, chain 2, 12 dmg)');
  }

  const lightning2Pattern = /case 'lightning_2':\s*lightningChance \+= ([\d.]+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning2Match = newContent.match(lightning2Pattern);
  if (lightning2Match && (lightning2Match[1] !== '3.5' || lightning2Match[2] !== '3' || lightning2Match[3] !== '22')) {
    newContent = newContent.replace(
      lightning2Pattern,
      `case 'lightning_2':\n          lightningChance += 3.5 * lvl;\n          lightningChain = Math.max(lightningChain, 3);\n          lightningDamage += 22 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v9] lightning_2 values optimized (3.5% chance, chain 3, 22 dmg)');
  }

  // 吸血技能：v9 - 略微提升，但仍保持保守
  const lifesteal1Pattern = /case 'lifesteal_1':\s*lifestealPercent \+= ([\d.]+) \* lvl;/;
  const lifesteal1Match = newContent.match(lifesteal1Pattern);
  if (lifesteal1Match && lifesteal1Match[1] !== '0.3') {
    newContent = newContent.replace(
      lifesteal1Pattern,
      `case 'lifesteal_1':\n          lifestealPercent += 0.3 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v9] lifesteal_1 values optimized (0.3% per level)');
  }

  const lifesteal2Pattern = /case 'lifesteal_2':\s*lifestealPercent \+= ([\d.]+) \* lvl;/;
  const lifesteal2Match = newContent.match(lifesteal2Pattern);
  if (lifesteal2Match && lifesteal2Match[1] !== '0.8') {
    newContent = newContent.replace(
      lifesteal2Pattern,
      `case 'lifesteal_2':\n          lifestealPercent += 0.8 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v9] lifesteal_2 values optimized (0.8% per level)');
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v9] Elemental skill values v9 optimized');
  } else {
    console.log('[BALANCE v9] Elemental skill values already v9 optimized');
  }
}

// ============================================
// 3. v9 技能描述同步更新
// ============================================
function v9UpdateSkillDescriptions() {
  const content = readFile(SKILLS_FILE);
  let newContent = content;
  let changed = false;

  const skillUpdates = {
    'burn_1': { old: '攻击有2.5%概率使敌人灼烧3秒', new: '攻击有3%概率使敌人灼烧4秒' },
    'burn_2': { old: '攻击有4%概率使敌人灼烧5秒，伤害翻倍', new: '攻击有5%概率使敌人灼烧6秒，伤害大幅提升' },
    'poison_1': { old: '攻击有2.5%概率使敌人中毒4秒', new: '攻击有3%概率使敌人中毒5秒' },
    'poison_2': { old: '攻击有4%概率使敌人中毒6秒，伤害翻倍', new: '攻击有5%概率使敌人中毒8秒，伤害大幅提升' },
    'freeze_1': { old: '攻击有2%概率减缓敌人40%速度2秒', new: '攻击有2.5%概率减缓敌人50%速度2.5秒' },
    'freeze_2': { old: '攻击有3%概率冻结敌人1.2秒', new: '攻击有3.5%概率冻结敌人1.5秒' },
    'lightning_1': { old: '攻击有2.5%概率触发感电，伤害链2个敌人', new: '攻击有2%概率触发感电，伤害链2个敌人' },
    'lightning_2': { old: '攻击有4%概率触发感电，伤害链3个敌人', new: '攻击有3.5%概率触发感电，伤害链3个敌人' },
    'lifesteal_1': { old: '攻击回复0.2%最大生命', new: '攻击回复0.3%最大生命' },
    'lifesteal_2': { old: '攻击回复0.6%最大生命', new: '攻击回复0.8%最大生命' },
  };

  for (const [skillId, update] of Object.entries(skillUpdates)) {
    const regex = new RegExp(`(createSkill\\('${skillId}',[^,]+,[^,]+,\\s*')${update.old}(')`);
    const match = newContent.match(regex);
    if (match) {
      newContent = newContent.replace(regex, `$1${update.new}$2`);
      changed = true;
      console.log(`[BALANCE v9] ${skillId} desc updated`);
    }
  }

  if (changed) {
    writeFile(SKILLS_FILE, newContent);
    console.log('[BALANCE v9] Skill descriptions v9 updated');
  } else {
    console.log('[BALANCE v9] Skill descriptions already v9 updated');
  }
}

// ============================================
// 4. v9 等级成长曲线精细优化
// ============================================
function v9OptimizeLevelScaling() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // v9: 经验曲线微调 - 更平滑的游戏节奏
  // 1-10级：快速成长（新手期，约1-2分钟一级）
  // 10-25级：稳定增长（成长期，约3-5分钟一级）
  // 25-50级：显著放缓（成熟期，约8-12分钟一级）
  // 50级以上：极慢增长（终极期，约15-20分钟一级）
  // 新公式: 25 + Math.pow(lvl, 1.45) * 5.5 + lvl * 3.5
  const newExpFormula = '25 + Math.pow(lvl, 1.45) * 5.5 + lvl * 3.5';
  const expFormula = content.match(/this\.player\.expToNextLevel = Math\.floor\(([^;]+)\)/);
  if (expFormula) {
    const oldFormula = expFormula[1];
    if (oldFormula !== newExpFormula) {
      newContent = newContent.replace(
        /this\.player\.expToNextLevel = Math\.floor\([^;]+\)/g,
        `this.player.expToNextLevel = Math.floor(${newExpFormula})`
      );
      changed = true;
      console.log(`[BALANCE v9] Exp formula: "${oldFormula}" → "${newExpFormula}"`);
    }
  }

  // 初始经验值（对应初始等级100级）
  const newInitialExp = 'expToNextLevel: Math.floor(25 + Math.pow(100, 1.45) * 5.5 + 100 * 3.5),';
  if (!content.includes(newInitialExp)) {
    const oldInitialExp = content.match(/expToNextLevel: Math\.floor\([^\n]+\),/);
    if (oldInitialExp) {
      newContent = newContent.replace(
        /expToNextLevel: Math\.floor\([^\n]+\),/,
        newInitialExp
      );
      changed = true;
      console.log('[BALANCE v9] Initial exp value updated');
    }
  }

  // 波次怪物属性增长 - 更平缓的曲线（v9微调）
  // 血量增长：1.028 → 1.026（更平缓）
  const healthMultiplier = newContent.match(/const healthMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (healthMultiplier) {
    const newPow = '1.026';
    if (healthMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const healthMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const healthMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v9] Wave health multiplier: ${healthMultiplier[1]} → ${newPow}`);
    }
  }

  // 伤害增长：1.016 → 1.015（更平缓，防止后期被秒）
  const damageMultiplier = newContent.match(/const damageMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (damageMultiplier) {
    const newPow = '1.015';
    if (damageMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const damageMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const damageMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v9] Wave damage multiplier: ${damageMultiplier[1]} → ${newPow}`);
    }
  }

  // 速度增长：0.18上限，0.0018每波 → 0.2上限，0.002每波（略微提升）
  const speedMultiplier = newContent.match(/const speedMultiplier = 1 \+ Math\.min\(([\d.]+), \(wave - 1\) \* ([\d.]+)\)/);
  if (speedMultiplier) {
    const newMin = '0.2';
    const newMultVal = '0.002';
    if (speedMultiplier[1] !== newMin || speedMultiplier[2] !== newMultVal) {
      newContent = newContent.replace(
        /const speedMultiplier = 1 \+ Math\.min\([\d.]+, \(wave - 1\) \* [\d.]+\)/,
        `const speedMultiplier = 1 + Math.min(${newMin}, (wave - 1) * ${newMultVal})`
      );
      changed = true;
      console.log(`[BALANCE v9] Wave speed multiplier: min=${speedMultiplier[1]}→${newMin}, perWave=${speedMultiplier[2]}→${newMultVal}`);
    }
  }

  // 经验增长：1.02 → 1.022（经验获取略微提升）
  const expMultiplier = newContent.match(/const expMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (expMultiplier) {
    const newPow = '1.022';
    if (expMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const expMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const expMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v9] Wave exp multiplier: ${expMultiplier[1]} → ${newPow}`);
    }
  }

  // 掉落率增长：0.004每波 → 0.0045每波（略微提升）
  const dropRateIncrease = newContent.match(/config\.dropRate \+ \(wave - 1\) \* ([\d.]+)\)/);
  if (dropRateIncrease) {
    const newVal = '0.0045';
    if (dropRateIncrease[1] !== newVal) {
      newContent = newContent.replace(
        /config\.dropRate \+ \(wave - 1\) \* [\d.]+\)/,
        `config.dropRate + (wave - 1) * ${newVal})`
      );
      changed = true;
      console.log(`[BALANCE v9] Drop rate per wave: ${dropRateIncrease[1]} → ${newVal}`);
    }
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v9] Level scaling v9 optimized');
  } else {
    console.log('[BALANCE v9] Level scaling already v9 optimized');
  }
}

// ============================================
// 5. v9 异常状态特效数值平衡
// ============================================
function v9OptimizeDebuffEffects() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // v9: 异常状态数值精细平衡
  // 设计原则：
  // - 各debuff有明确的定位和价值
  // - DOT类：灼烧(高频率中伤害)、中毒(低频率高伤害+减速)
  // - 控制类：冰冻(强控制短时间)、减速(弱控制长时间)、眩晕(最强控制最短时间)
  // - 增伤类：诅咒(增伤+弱DOT)、感电(DOT+减速)
  
  const debuffPattern = /private debuffEffects: Record<string, \{[^}]+\}> = \{[\s\S]*?\n  \};/;
  const match = newContent.match(debuffPattern);
  
  if (match) {
    const newDebuffConfig = `private debuffEffects: Record<string, { color: string; particleColor: string; damage: number; speedMultiplier: number; icon: string; name: string; description: string; damageMultiplier?: number; glowColor?: string; tickInterval?: number }> = {
    burn: { color: '#FF6600', particleColor: '#FF4400', damage: 5, speedMultiplier: 1, icon: '🔥', name: '灼烧', description: '持续受到火焰伤害', glowColor: '#FF8800', tickInterval: 500 },
    poison: { color: '#00FF00', particleColor: '#00CC00', damage: 4, speedMultiplier: 0.8, icon: '☠️', name: '中毒', description: '持续受到毒素伤害，移动速度降低', glowColor: '#00FF44', tickInterval: 700 },
    freeze: { color: '#00CCFF', particleColor: '#0088FF', damage: 0, speedMultiplier: 0.1, icon: '❄️', name: '冰冻', description: '被冻结，几乎无法移动', glowColor: '#88EEFF' },
    lightning: { color: '#FFFF00', particleColor: '#FFFF88', damage: 6, speedMultiplier: 0.7, icon: '⚡', name: '感电', description: '持续受到雷电伤害，移动速度降低', glowColor: '#FFFFAA', tickInterval: 450 },
    slow: { color: '#8888FF', particleColor: '#AAAAFF', damage: 0, speedMultiplier: 0.5, icon: '🐢', name: '减速', description: '移动速度大幅降低', glowColor: '#BBBBFF' },
    curse: { color: '#AA00AA', particleColor: '#CC00CC', damage: 2, speedMultiplier: 0.95, icon: '📜', name: '诅咒', description: '受到伤害增加35%', damageMultiplier: 1.35, glowColor: '#DD44DD', tickInterval: 900 },
    stun: { color: '#FFD700', particleColor: '#FFEA00', damage: 0, speedMultiplier: 0, icon: '💫', name: '眩晕', description: '无法移动和攻击', glowColor: '#FFFF88' },
  };`;
    
    if (match[0] !== newDebuffConfig) {
      newContent = newContent.replace(debuffPattern, newDebuffConfig);
      changed = true;
      console.log('[BALANCE v9] Debuff effects values optimized');
      console.log('  - 灼烧: 伤害4→5, 间隔500ms');
      console.log('  - 中毒: 伤害3→4, 减速15%→20%, 间隔600→700ms');
      console.log('  - 冰冻: 减速85%→90%');
      console.log('  - 感电: 伤害5→6, 减速25%→30%, 间隔400→450ms');
      console.log('  - 减速: 减速45%→50%');
      console.log('  - 诅咒: 伤害1.5→2, 增伤30%→35%, 间隔800→900ms');
    }
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v9] Debuff effects v9 optimized');
  } else {
    console.log('[BALANCE v9] Debuff effects already v9 optimized');
  }
}

// ============================================
// 6. v9 装备词条数值精细平衡
// ============================================
function v9OptimizeEquipmentBalance() {
  const content = readFile(EQUIPMENT_FILE);
  
  let newContent = content;
  let changed = false;

  // v9: 装备词条数值微调 - 更平衡的属性分布
  const affixUpdates = [
    { type: 'attack', old: 'baseValue = isFineBonusAttack ? 1.2 : 3.5', new: 'baseValue = isFineBonusAttack ? 1.2 : 3.8' },
    { type: 'defense', old: 'baseValue = 1.5', new: 'baseValue = 1.8' },
    { type: 'health', old: 'baseValue = 12', new: 'baseValue = 14' },
    { type: 'critRate', old: 'baseValue = 1.5', new: 'baseValue = 1.2' },
    { type: 'critDamage', old: 'baseValue = 5', new: 'baseValue = 6' },
    { type: 'attackSpeed', old: 'baseValue = 5', new: 'baseValue = 4' },
    { type: 'elementalDamage', old: 'baseValue = 14', new: 'baseValue = 16' },
  ];

  for (const update of affixUpdates) {
    if (newContent.includes(update.old) && update.old !== update.new) {
      newContent = newContent.replace(update.old, update.new);
      changed = true;
      console.log(`[BALANCE v9] ${update.type} affix base value adjusted`);
    }
  }

  if (changed) {
    writeFile(EQUIPMENT_FILE, newContent);
    console.log('[BALANCE v9] Equipment balance v9 optimized');
  } else {
    console.log('[BALANCE v9] Equipment balance already v9 optimized');
  }
}

// ============================================
// 7. v9 验证所有内容
// ============================================
function v9VerifyAllContent() {
  console.log('\n--- v9 验证所有内容完整性 ---');
  
  const enemiesContent = readFile(ENEMIES_FILE);
  const skillsContent = readFile(SKILLS_FILE);
  const equipmentContent = readFile(EQUIPMENT_FILE);
  const engineContent = readFile(ENGINE_FILE);
  
  // 验证套装
  const setChecks = ['wasteland_destroyer'];
  for (const set of setChecks) {
    const exists = equipmentContent.includes(`'${set}'`);
    console.log(`[v9 验证] ${set}套装: ${exists ? '✓ 存在' : '✗ 缺失'}`);
  }
  
  // 验证道具
  const itemChecks = ['stun_bomb', 'lightning_bolt', 'curse_scroll'];
  for (const item of itemChecks) {
    const exists = equipmentContent.includes(`${item}:`);
    console.log(`[v9 验证] ${item}: ${exists ? '✓ 定义存在' : '✗ 缺失'}`);
  }
  
  // 验证技能
  const skillChecks = ['burn_1', 'poison_1', 'freeze_1', 'lightning_1', 'lifesteal_1', 'piercing_1'];
  for (const skill of skillChecks) {
    const defined = skillsContent.includes(`'${skill}'`);
    const implemented = engineContent.includes(`case '${skill}':`);
    console.log(`[v9 验证] ${skill}: ${defined ? '✓ 定义存在' : '✗ 定义缺失'} | ${implemented ? '✓ 实现存在' : '✗ 实现缺失'}`);
  }
  
  // 验证异常状态
  const debuffChecks = ['burn', 'poison', 'freeze', 'lightning', 'slow', 'curse', 'stun'];
  for (const debuff of debuffChecks) {
    const exists = engineContent.includes(`${debuff}: {`);
    console.log(`[v9 验证] ${debuff}状态: ${exists ? '✓ 定义存在' : '✗ 缺失'}`);
  }
  
  // 验证装备图标
  const slots = ['weapon', 'armor', 'pants', 'shoulder', 'belt', 'shoes', 'earring', 'ring', 'necklace'];
  let allSlotsOk = true;
  for (const slot of slots) {
    const slotPattern = new RegExp(`${slot}: \\[([^\\]]+)\\]`);
    const match = equipmentContent.match(slotPattern);
    if (match) {
      const icons = match[1].split(',').filter(i => i.trim());
      if (icons.length < 10) {
        console.log(`[v9 验证] ${slot}图标: ✗ 只有${icons.length}种`);
        allSlotsOk = false;
      }
    }
  }
  if (allSlotsOk) {
    console.log('[v9 验证] 所有槽位图标: ✓ 10种以上');
  }
  
  // 输出平衡数值概览
  console.log('\n--- v9 平衡数值概览 ---');
  
  // 计算经验需求
  function calcExp(lvl) {
    return Math.floor(25 + Math.pow(lvl, 1.45) * 5.5 + lvl * 3.5);
  }
  console.log('经验需求:');
  [1, 5, 10, 20, 30, 50, 100].forEach(lvl => {
    console.log(`  Lv.${lvl}: ${calcExp(lvl)} exp`);
  });
  
  // 波次怪物属性倍率
  console.log('波次怪物属性倍率:');
  [1, 5, 10, 20, 30, 50].forEach(wave => {
    const hp = Math.pow(1.026, wave - 1).toFixed(2);
    const dmg = Math.pow(1.015, wave - 1).toFixed(2);
    const exp = Math.pow(1.022, wave - 1).toFixed(2);
    console.log(`  第${wave}波: HP×${hp}, DMG×${dmg}, EXP×${exp}`);
  });
  
  console.log('');
}

// ============================================
// 主执行函数
// ============================================
function main() {
  console.log('========================================');
  console.log('=== Game Balance Optimization v9 ===');
  console.log('=== 精细平衡终极优化 ===');
  console.log('========================================');
  console.log(`Time: ${new Date().toLocaleString('zh-CN')}`);
  
  console.log('\n--- 1. 怪物属性精细平衡 (v9) ---');
  v9OptimizeEnemyBalance();
  
  console.log('\n--- 2. 元素技能数值精细平衡 (v9) ---');
  v9OptimizeElementalSkills();
  
  console.log('\n--- 3. 技能描述同步更新 (v9) ---');
  v9UpdateSkillDescriptions();
  
  console.log('\n--- 4. 等级成长曲线精细优化 (v9) ---');
  v9OptimizeLevelScaling();
  
  console.log('\n--- 5. 异常状态特效数值平衡 (v9) ---');
  v9OptimizeDebuffEffects();
  
  console.log('\n--- 6. 装备词条数值精细平衡 (v9) ---');
  v9OptimizeEquipmentBalance();
  
  console.log('\n--- 7. 验证所有内容 ---');
  v9VerifyAllContent();
  
  console.log('========================================');
  console.log('=== v9 Optimization Completed ===');
  console.log('========================================');
}

main();
