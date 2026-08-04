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
  console.log(`[BALANCE v4] Updated: ${filePath}`);
}

// ============================================
// 1. v4 深度优化怪物属性平衡
// ============================================
function v4OptimizeEnemyBalance() {
  const content = readFile(ENEMIES_FILE);
  
  // v4: 基于DPS和生存能力的精细平衡
  // 设计原则：
  // - 普通怪：每波难度递增，各类型有明确定位
  // - 精英怪：每5波出现，数值约为同波普通怪的8-12倍
  // - BOSS：每10波出现，数值约为同波精英怪的5-8倍
  const enemyBalance = {
    // 普通怪 - 前3波只出现mutant，逐步解锁
    mutant: { 
      health: 20, speed: 4.5, damage: 2, exp: 2,
      note: '最基础敌人，新手训练用，低威胁'
    },
    raider: { 
      health: 30, speed: 6.5, damage: 5, exp: 6,
      note: '快速敌人，第3波解锁，考验攻速和射程'
    },
    spider: { 
      health: 24, speed: 7.8, damage: 4, exp: 7,
      note: '最高速敌人，第5波解锁，脆皮但烦人'
    },
    infected: { 
      health: 50, speed: 5.2, damage: 8, exp: 10,
      note: '中等均衡敌人，第4波解锁'
    },
    zombie: { 
      health: 85, speed: 2.0, damage: 6, exp: 10,
      note: '慢速坦克，第6波解锁，血厚经验效率低'
    },
    brute: { 
      health: 110, speed: 3.8, damage: 16, exp: 22,
      note: '重装精英级普通怪，第8波解锁，高威胁'
    },
    // 精英怪 - 每5波出现
    heavy_trooper: { 
      health: 280, speed: 3.5, damage: 22, exp: 60,
      note: '第5/15/25波精英，高防御高血量'
    },
    sniper_bot: { 
      health: 180, speed: 1.8, damage: 45, exp: 95,
      note: '第10/20/30波精英，远程高伤脆皮'
    },
    mech_soldier: { 
      health: 450, speed: 5.2, damage: 35, exp: 115,
      note: '第15/25/35波精英，高攻速高伤害'
    },
    // BOSS - 每10波出现
    war_tank: { 
      health: 1800, speed: 1.8, damage: 45, exp: 400,
      note: '第10波BOSS，火焰属性，入门级'
    },
    alien_hive: { 
      health: 3200, speed: 1.0, damage: 60, exp: 650,
      note: '第20波BOSS，毒属性，召唤流'
    },
    cyber_dragon: { 
      health: 5500, speed: 1.0, damage: 85, exp: 1800,
      note: '第30波BOSS，冰属性，多阶段最终'
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
        console.log(`[BALANCE v4] ${enemy}: HP ${oldHealth}→${stats.health}, DMG ${oldDamage}→${stats.damage}, SPD ${oldSpeed}→${stats.speed}, EXP ${oldExp}→${stats.exp}`);
      }
    }
  }

  if (changed) {
    writeFile(ENEMIES_FILE, newContent);
    console.log('[BALANCE v4] Enemy balance v4 optimized');
  } else {
    console.log('[BALANCE v4] Enemy balance already v4 optimized');
  }
}

// ============================================
// 2. v4 深度调整技能数值
// ============================================
function v4OptimizeSkillValues() {
  const content = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);

  // v4: 更平衡的技能性价比曲线
  // 设计原则：
  // - 低级技能：高性价比，快速提升
  // - 高级技能：低性价比，但总量高
  // - 攻速/暴击：增长更保守（指数效应太强）
  // - 生命/防御：前期提升明显，后期衰减
  const skillTargets = {
    // 攻击技能：每级提升递减，但总量可观
    'atk_1': { desc: '攻击力+6/级', engineVal: 6 },
    'atk_2': { desc: '攻击力+12/级', engineVal: 12 },
    'atk_3': { desc: '攻击力+20/级', engineVal: 20 },
    'atk_4': { desc: '攻击力+30/级', engineVal: 30 },
    'atk_5': { desc: '攻击力+45/级', engineVal: 45 },
    // 攻速技能：更保守（攻速是乘算，效应太强）
    'spd_1': { desc: '攻速+5%/级', engineVal: 0.05 },
    'spd_2': { desc: '攻速+8%/级', engineVal: 0.08 },
    'spd_3': { desc: '攻速+12%/级', engineVal: 0.12 },
    'spd_4': { desc: '攻速+18%/级', engineVal: 0.18 },
    'spd_5': { desc: '攻速+25%/级', engineVal: 0.25 },
    // 射程技能：前期价值高，后期递减
    'rng_1': { desc: '射程+35/级', engineVal: 35 },
    'rng_2': { desc: '射程+60/级', engineVal: 60 },
    'rng_3': { desc: '射程+90/级', engineVal: 90 },
    'rng_4': { desc: '射程+130/级', engineVal: 130 },
    // 暴击技能：暴击率有上限，数值更保守
    'crit_1': { desc: '暴击率+3%/级', engineVal: 3 },
    'crit_2': { desc: '暴击率+5%/级', engineVal: 5 },
    'crit_3': { desc: '暴击率+8%/级', engineVal: 8 },
    'crit_4': { desc: '暴击率+11%/级', engineVal: 11 },
    // 暴伤技能：数值可以更高（乘算区，但需要暴击率配合）
    'cdmg_1': { desc: '暴击伤害+25%/级', engineVal: 25 },
    'cdmg_2': { desc: '暴击伤害+45%/级', engineVal: 45 },
    'cdmg_3': { desc: '暴击伤害+70%/级', engineVal: 70 },
    // 生命技能：前期提升大，后期更需要百分比
    'hp_1': { desc: '最大生命+40/级', engineVal: 40 },
    'hp_2': { desc: '最大生命+80/级', engineVal: 80 },
    'hp_3': { desc: '最大生命+140/级', engineVal: 140 },
    'hp_4': { desc: '最大生命+240/级', engineVal: 240 },
    // 防御技能：减伤效果递减（边际效益）
    'def_1': { desc: '减伤+5%/级', engineVal: 5 },
    'def_2': { desc: '减伤+10%/级', engineVal: 10 },
    'def_3': { desc: '减伤+16%/级', engineVal: 16 },
    'def_4': { desc: '减伤+22%/级', engineVal: 22 },
  };

  let newSkillsContent = content;
  let newEngineContent = engineContent;
  let skillsChanged = false;
  let engineChanged = false;

  // 更新技能描述
  for (const [skillId, target] of Object.entries(skillTargets)) {
    const regex = new RegExp(`(createSkill\\('${skillId}',[^,]+,[^,]+,\\s*')([^']+)(')`);
    const match = newSkillsContent.match(regex);
    if (match && match[2] !== target.desc) {
      newSkillsContent = newSkillsContent.replace(match[0], match[1] + target.desc + match[3]);
      skillsChanged = true;
      console.log(`[BALANCE v4] ${skillId} desc: "${match[2]}" → "${target.desc}"`);
    }
  }

  // 更新引擎中的技能数值
  const skillValuePatterns = [
    { id: 'atk_1', pattern: /case 'atk_1': attack \+= (\d+) \* lvl;/, val: 6, template: "case 'atk_1': attack += VAL * lvl;" },
    { id: 'atk_2', pattern: /case 'atk_2': attack \+= (\d+) \* lvl;/, val: 12, template: "case 'atk_2': attack += VAL * lvl;" },
    { id: 'atk_3', pattern: /case 'atk_3': attack \+= (\d+) \* lvl;/, val: 20, template: "case 'atk_3': attack += VAL * lvl;" },
    { id: 'atk_4', pattern: /case 'atk_4': attack \+= (\d+) \* lvl;/, val: 30, template: "case 'atk_4': attack += VAL * lvl;" },
    { id: 'atk_5', pattern: /case 'atk_5': attack \+= (\d+) \* lvl;/, val: 45, template: "case 'atk_5': attack += VAL * lvl;" },
    { id: 'spd_1', pattern: /case 'spd_1': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.05, template: "case 'spd_1': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_2', pattern: /case 'spd_2': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.08, template: "case 'spd_2': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_3', pattern: /case 'spd_3': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.12, template: "case 'spd_3': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_4', pattern: /case 'spd_4': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.18, template: "case 'spd_4': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_5', pattern: /case 'spd_5': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.25, template: "case 'spd_5': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'rng_1', pattern: /case 'rng_1': range \+= (\d+) \* lvl;/, val: 35, template: "case 'rng_1': range += VAL * lvl;" },
    { id: 'rng_2', pattern: /case 'rng_2': range \+= (\d+) \* lvl;/, val: 60, template: "case 'rng_2': range += VAL * lvl;" },
    { id: 'rng_3', pattern: /case 'rng_3': range \+= (\d+) \* lvl;/, val: 90, template: "case 'rng_3': range += VAL * lvl;" },
    { id: 'rng_4', pattern: /case 'rng_4': range \+= (\d+) \* lvl;/, val: 130, template: "case 'rng_4': range += VAL * lvl;" },
    { id: 'crit_1', pattern: /case 'crit_1': critRate \+= (\d+) \* lvl;/, val: 3, template: "case 'crit_1': critRate += VAL * lvl;" },
    { id: 'crit_2', pattern: /case 'crit_2': critRate \+= (\d+) \* lvl;/, val: 5, template: "case 'crit_2': critRate += VAL * lvl;" },
    { id: 'crit_3', pattern: /case 'crit_3': critRate \+= (\d+) \* lvl;/, val: 8, template: "case 'crit_3': critRate += VAL * lvl;" },
    { id: 'crit_4', pattern: /case 'crit_4': critRate \+= (\d+) \* lvl;/, val: 11, template: "case 'crit_4': critRate += VAL * lvl;" },
    { id: 'cdmg_1', pattern: /case 'cdmg_1': critDamage \+= (\d+) \* lvl;/, val: 25, template: "case 'cdmg_1': critDamage += VAL * lvl;" },
    { id: 'cdmg_2', pattern: /case 'cdmg_2': critDamage \+= (\d+) \* lvl;/, val: 45, template: "case 'cdmg_2': critDamage += VAL * lvl;" },
    { id: 'cdmg_3', pattern: /case 'cdmg_3': critDamage \+= (\d+) \* lvl;/, val: 70, template: "case 'cdmg_3': critDamage += VAL * lvl;" },
    { id: 'hp_1', pattern: /case 'hp_1': maxHealth \+= (\d+) \* lvl;/, val: 40, template: "case 'hp_1': maxHealth += VAL * lvl;" },
    { id: 'hp_2', pattern: /case 'hp_2': maxHealth \+= (\d+) \* lvl;/, val: 80, template: "case 'hp_2': maxHealth += VAL * lvl;" },
    { id: 'hp_3', pattern: /case 'hp_3': maxHealth \+= (\d+) \* lvl;/, val: 140, template: "case 'hp_3': maxHealth += VAL * lvl;" },
    { id: 'hp_4', pattern: /case 'hp_4': maxHealth \+= (\d+) \* lvl;/, val: 240, template: "case 'hp_4': maxHealth += VAL * lvl;" },
    { id: 'def_1', pattern: /case 'def_1': defense \+= (\d+) \* lvl;/, val: 5, template: "case 'def_1': defense += VAL * lvl;" },
    { id: 'def_2', pattern: /case 'def_2': defense \+= (\d+) \* lvl;/, val: 10, template: "case 'def_2': defense += VAL * lvl;" },
    { id: 'def_3', pattern: /case 'def_3': defense \+= (\d+) \* lvl;/, val: 16, template: "case 'def_3': defense += VAL * lvl;" },
    { id: 'def_4', pattern: /case 'def_4': defense \+= (\d+) \* lvl;/, val: 22, template: "case 'def_4': defense += VAL * lvl;" },
  ];

  for (const skill of skillValuePatterns) {
    const match = newEngineContent.match(skill.pattern);
    if (match && match[1] !== String(skill.val)) {
      const replacement = skill.template.replace('VAL', String(skill.val));
      newEngineContent = newEngineContent.replace(skill.pattern, replacement);
      engineChanged = true;
      console.log(`[BALANCE v4] ${skill.id} engine value: ${match[1]} → ${skill.val}`);
    }
  }

  if (skillsChanged) {
    writeFile(SKILLS_FILE, newSkillsContent);
    console.log('[BALANCE v4] Skill descriptions v4 optimized');
  } else {
    console.log('[BALANCE v4] Skill descriptions already v4 optimized');
  }

  if (engineChanged) {
    writeFile(ENGINE_FILE, newEngineContent);
    console.log('[BALANCE v4] Skill values in engine v4 optimized');
  } else {
    console.log('[BALANCE v4] Skill values in engine already v4 optimized');
  }
}

// ============================================
// 3. v4 深度优化等级成长曲线
// ============================================
function v4OptimizeLevelScaling() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // v4: 更平滑的经验曲线 - S型增长
  // 1-10级：快速成长（新手期）
  // 10-30级：稳定增长（成长期）
  // 30级以上：显著放缓（成熟期）
  // 新公式: 40 + Math.pow(lvl, 1.4) * 10 + lvl * 6
  const newExpFormula = '40 + Math.pow(lvl, 1.4) * 10 + lvl * 6';
  const expFormula = content.match(/this\.player\.expToNextLevel = Math\.floor\(([^;]+)\)/);
  if (expFormula) {
    const oldFormula = expFormula[1];
    if (oldFormula !== newExpFormula) {
      newContent = newContent.replace(
        /this\.player\.expToNextLevel = Math\.floor\([^;]+\)/,
        `this.player.expToNextLevel = Math.floor(${newExpFormula})`
      );
      changed = true;
      console.log(`[BALANCE v4] Exp formula: "${oldFormula}" → "${newExpFormula}"`);
    }
  }

  // 初始经验值（对应初始等级100级）
  const newInitialExp = 'expToNextLevel: Math.floor(40 + Math.pow(100, 1.4) * 10 + 100 * 6),';
  if (!content.includes(newInitialExp)) {
    const oldInitialExp = content.match(/expToNextLevel: Math\.floor\([^\n]+\),/);
    if (oldInitialExp) {
      newContent = newContent.replace(
        /expToNextLevel: Math\.floor\([^\n]+\),/,
        newInitialExp
      );
      changed = true;
      console.log('[BALANCE v4] Initial exp value updated');
    }
  }

  // 等级加成 - 每级提升全属性（再略微降低，防止后期过强）
  const levelBonus = newContent.match(/const levelBonus = Math\.max\(0, \(this\.player\.level - (\d+)\)\) \* ([\d.]+)/);
  if (levelBonus) {
    const newMult = '0.03';
    if (levelBonus[2] !== newMult) {
      newContent = newContent.replace(
        /const levelBonus = Math\.max\(0, \(this\.player\.level - \d+\)\) \* [\d.]+/,
        `const levelBonus = Math.max(0, (this.player.level - 1)) * ${newMult}`
      );
      changed = true;
      console.log(`[BALANCE v4] Level bonus multiplier: ${levelBonus[2]} → ${newMult}`);
    }
  }

  // 生命加成倍数（略微降低，避免血量膨胀）
  const healthBonusMult = newContent.match(/maxHealth = Math\.floor\(maxHealth \* \(1 \+ levelBonus \* ([\d.]+)\)\)/);
  if (healthBonusMult) {
    const newMult = '1.0';
    if (healthBonusMult[1] !== newMult) {
      newContent = newContent.replace(
        /maxHealth = Math\.floor\(maxHealth \* \(1 \+ levelBonus \* [\d.]+\)\)/,
        `maxHealth = Math.floor(maxHealth * (1 + levelBonus * ${newMult}))`
      );
      changed = true;
      console.log(`[BALANCE v4] Health bonus multiplier: ${healthBonusMult[1]} → ${newMult}`);
    }
  }

  // 波次怪物属性增长 - 更平缓的曲线
  // 血量增长：1.045 → 1.04（更平缓）
  const healthMultiplier = newContent.match(/const healthMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (healthMultiplier) {
    const newPow = '1.04';
    if (healthMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const healthMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const healthMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v4] Wave health multiplier: ${healthMultiplier[1]} → ${newPow}`);
    }
  }

  // 伤害增长：1.03 → 1.025（更平缓，防止后期被秒）
  const damageMultiplier = newContent.match(/const damageMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (damageMultiplier) {
    const newPow = '1.025';
    if (damageMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const damageMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const damageMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v4] Wave damage multiplier: ${damageMultiplier[1]} → ${newPow}`);
    }
  }

  // 速度增长：0.4上限，0.005每波 → 0.35上限，0.004每波（更可控）
  const speedMultiplier = newContent.match(/const speedMultiplier = 1 \+ Math\.min\(([\d.]+), \(wave - 1\) \* ([\d.]+)\)/);
  if (speedMultiplier) {
    const newMin = '0.35';
    const newMultVal = '0.004';
    if (speedMultiplier[1] !== newMin || speedMultiplier[2] !== newMultVal) {
      newContent = newContent.replace(
        /const speedMultiplier = 1 \+ Math\.min\([\d.]+, \(wave - 1\) \* [\d.]+\)/,
        `const speedMultiplier = 1 + Math.min(${newMin}, (wave - 1) * ${newMultVal})`
      );
      changed = true;
      console.log(`[BALANCE v4] Wave speed multiplier: min=${speedMultiplier[1]}→${newMin}, perWave=${speedMultiplier[2]}→${newMultVal}`);
    }
  }

  // 经验增长：1.04 → 1.035（经验获取更稳定）
  const expMultiplier = newContent.match(/const expMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (expMultiplier) {
    const newPow = '1.035';
    if (expMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const expMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const expMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v4] Wave exp multiplier: ${expMultiplier[1]} → ${newPow}`);
    }
  }

  // 掉落率增长：0.012每波 → 0.01每波（更平衡）
  const dropRateIncrease = newContent.match(/config\.dropRate \+ \(wave - 1\) \* ([\d.]+)\)/);
  if (dropRateIncrease) {
    const newVal = '0.01';
    if (dropRateIncrease[1] !== newVal) {
      newContent = newContent.replace(
        /config\.dropRate \+ \(wave - 1\) \* [\d.]+\)/,
        `config.dropRate + (wave - 1) * ${newVal})`
      );
      changed = true;
      console.log(`[BALANCE v4] Drop rate per wave: ${dropRateIncrease[1]} → ${newVal}`);
    }
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v4] Level scaling v4 optimized');
  } else {
    console.log('[BALANCE v4] Level scaling already v4 optimized');
  }
}

// ============================================
// 4. v4 优化元素技能数值
// ============================================
function v4OptimizeElementalSkills() {
  const content = readFile(ENGINE_FILE);
  let newContent = content;
  let changed = false;

  // v4: 元素技能平衡调整
  // 设计原则：
  // - 触发概率更保守（避免元素过于强势）
  // - 持续伤害更合理（基于玩家攻击力百分比）
  // - 控制效果有上限（避免无限控制）

  // 灼烧技能：概率降低，伤害提升（DOT定位）
  const burn1Pattern = /case 'burn_1':\s*burnChance \+= (\d+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn1Match = newContent.match(burn1Pattern);
  if (burn1Match && (burn1Match[1] !== '4' || burn1Match[2] !== '10' || burn1Match[3] !== '3000')) {
    newContent = newContent.replace(
      burn1Pattern,
      `case 'burn_1':\n          burnChance += 4 * lvl;\n          burnDamage += 10 * lvl;\n          burnDuration = Math.max(burnDuration, 3000);`
    );
    changed = true;
    console.log('[BALANCE v4] burn_1 values optimized (4% chance, 10 dmg, 3s)');
  }

  const burn2Pattern = /case 'burn_2':\s*burnChance \+= (\d+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn2Match = newContent.match(burn2Pattern);
  if (burn2Match && (burn2Match[1] !== '6' || burn2Match[2] !== '20' || burn2Match[3] !== '5000')) {
    newContent = newContent.replace(
      burn2Pattern,
      `case 'burn_2':\n          burnChance += 6 * lvl;\n          burnDamage += 20 * lvl;\n          burnDuration = Math.max(burnDuration, 5000);`
    );
    changed = true;
    console.log('[BALANCE v4] burn_2 values optimized (6% chance, 20 dmg, 5s)');
  }

  // 毒素技能：概率降低，持续时间长（持续掉血+减速定位）
  const poison1Pattern = /case 'poison_1':\s*poisonChance \+= (\d+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison1Match = newContent.match(poison1Pattern);
  if (poison1Match && (poison1Match[1] !== '4' || poison1Match[2] !== '8' || poison1Match[3] !== '4000')) {
    newContent = newContent.replace(
      poison1Pattern,
      `case 'poison_1':\n          poisonChance += 4 * lvl;\n          poisonDamage += 8 * lvl;\n          poisonDuration = Math.max(poisonDuration, 4000);`
    );
    changed = true;
    console.log('[BALANCE v4] poison_1 values optimized (4% chance, 8 dmg, 4s)');
  }

  const poison2Pattern = /case 'poison_2':\s*poisonChance \+= (\d+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison2Match = newContent.match(poison2Pattern);
  if (poison2Match && (poison2Match[1] !== '6' || poison2Match[2] !== '16' || poison2Match[3] !== '6000')) {
    newContent = newContent.replace(
      poison2Pattern,
      `case 'poison_2':\n          poisonChance += 6 * lvl;\n          poisonDamage += 16 * lvl;\n          poisonDuration = Math.max(poisonDuration, 6000);`
    );
    changed = true;
    console.log('[BALANCE v4] poison_2 values optimized (6% chance, 16 dmg, 6s)');
  }

  // 冰霜技能：概率更低，控制有上限（控制定位）
  const freeze1Pattern = /case 'freeze_1':\s*freezeChance \+= (\d+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze1Match = newContent.match(freeze1Pattern);
  if (freeze1Match && (freeze1Match[1] !== '3' || freeze1Match[2] !== '40' || freeze1Match[3] !== '2000')) {
    newContent = newContent.replace(
      freeze1Pattern,
      `case 'freeze_1':\n          freezeChance += 3 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 40);\n          freezeDuration = Math.max(freezeDuration, 2000);`
    );
    changed = true;
    console.log('[BALANCE v4] freeze_1 values optimized (3% chance, 40% slow, 2s)');
  }

  const freeze2Pattern = /case 'freeze_2':\s*freezeChance \+= (\d+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze2Match = newContent.match(freeze2Pattern);
  if (freeze2Match && (freeze2Match[1] !== '5' || freeze2Match[2] !== '100' || freeze2Match[3] !== '1200')) {
    newContent = newContent.replace(
      freeze2Pattern,
      `case 'freeze_2':\n          freezeChance += 5 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 100);\n          freezeDuration = Math.max(freezeDuration, 1200);`
    );
    changed = true;
    console.log('[BALANCE v4] freeze_2 values optimized (5% chance, 100% freeze, 1.2s)');
  }

  // 雷电技能：概率适中，连锁伤害（群体定位）
  const lightning1Pattern = /case 'lightning_1':\s*lightningChance \+= (\d+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning1Match = newContent.match(lightning1Pattern);
  if (lightning1Match && (lightning1Match[1] !== '4' || lightning1Match[2] !== '3' || lightning1Match[3] !== '12')) {
    newContent = newContent.replace(
      lightning1Pattern,
      `case 'lightning_1':\n          lightningChance += 4 * lvl;\n          lightningChain = Math.max(lightningChain, 3);\n          lightningDamage += 12 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v4] lightning_1 values optimized (4% chance, 3 chain, 12 dmg)');
  }

  const lightning2Pattern = /case 'lightning_2':\s*lightningChance \+= (\d+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning2Match = newContent.match(lightning2Pattern);
  if (lightning2Match && (lightning2Match[1] !== '6' || lightning2Match[2] !== '5' || lightning2Match[3] !== '22')) {
    newContent = newContent.replace(
      lightning2Pattern,
      `case 'lightning_2':\n          lightningChance += 6 * lvl;\n          lightningChain = Math.max(lightningChain, 5);\n          lightningDamage += 22 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v4] lightning_2 values optimized (6% chance, 5 chain, 22 dmg)');
  }

  // 吸血技能：数值更保守（吸血过强会破坏平衡）
  const lifestealPattern = /case 'lifesteal_1':\s*lifestealPercent \+= ([\d.]+) \* lvl;/;
  const lifesteal1Match = newContent.match(lifestealPattern);
  if (lifesteal1Match && lifesteal1Match[1] !== '0.3') {
    newContent = newContent.replace(
      lifestealPattern,
      `case 'lifesteal_1':\n          lifestealPercent += 0.3 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v4] lifesteal_1 value optimized (0.3% per level)');
  }

  // lifesteal_2：需要精确匹配第二个
  const allLifestealMatches = [...newContent.matchAll(/case 'lifesteal_(\d+)':\s*lifestealPercent \+= ([\d.]+) \* lvl;/g)];
  if (allLifestealMatches.length >= 2 && allLifestealMatches[1][2] !== '1.0') {
    let count = 0;
    newContent = newContent.replace(
      /case 'lifesteal_\d+':\s*lifestealPercent \+= [\d.]+ \* lvl;/g,
      (match) => {
        count++;
        if (count === 2) {
          return `case 'lifesteal_2':\n          lifestealPercent += 1.0 * lvl;`;
        }
        return match;
      }
    );
    changed = true;
    console.log('[BALANCE v4] lifesteal_2 value optimized (1.0% per level)');
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v4] Elemental skill values v4 optimized');
  } else {
    console.log('[BALANCE v4] Elemental skill values already v4 optimized');
  }
}

// ============================================
// 5. v4 优化玩家基础属性
// ============================================
function v4OptimizePlayerBaseStats() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // 基础攻击力: 8 → 6（更依赖技能和装备成长）
  const baseAttack = newContent.match(/attack: (\d+),/);
  if (baseAttack && baseAttack[1] !== '6') {
    newContent = newContent.replace(/attack: \d+,/, 'attack: 6,');
    changed = true;
    console.log(`[BALANCE v4] Base attack: ${baseAttack[1]} → 6`);
  }

  // 基础生命值: 80 → 60（更依赖技能和装备成长）
  const baseMaxHealth = newContent.match(/maxHealth: (\d+),/);
  if (baseMaxHealth && baseMaxHealth[1] !== '60') {
    newContent = newContent.replace(/maxHealth: \d+,/, 'maxHealth: 60,');
    changed = true;
    console.log(`[BALANCE v4] Base maxHealth: ${baseMaxHealth[1]} → 60`);
  }

  // 基础射程: 450 → 400（让射程技能更有价值）
  const baseRange = newContent.match(/range: (\d+),/);
  if (baseRange && baseRange[1] !== '400') {
    newContent = newContent.replace(/range: \d+,/, 'range: 400,');
    changed = true;
    console.log(`[BALANCE v4] Base range: ${baseRange[1]} → 400`);
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v4] Player base stats v4 optimized');
  } else {
    console.log('[BALANCE v4] Player base stats already v4 optimized');
  }
}

// ============================================
// 6. v4 优化装备数值平衡
// ============================================
function v4OptimizeEquipmentBalance() {
  const content = readFile(EQUIPMENT_FILE);
  
  let newContent = content;
  let changed = false;

  // 装备基础数值调整 - 让成长更平滑
  // 稀有度倍数调整：降低高稀有度的数值膨胀
  const rarityMultPattern = /const rarityMultiplier = \{[^}]+\}/;
  const rarityMultMatch = newContent.match(rarityMultPattern);
  const newRarityMult = `const rarityMultiplier = {
    common: 1,
    advanced: 1.4,
    fine: 1.9,
    legendary: 2.8,
    epic: 4.0,
    mythic: 5.5,
  }`;
  
  if (rarityMultMatch && rarityMultMatch[0] !== newRarityMult) {
    newContent = newContent.replace(rarityMultPattern, newRarityMult);
    changed = true;
    console.log('[BALANCE v4] Rarity multiplier adjusted (lower high-end)');
  }

  // 等级成长系数：0.12 → 0.10（降低等级的影响）
  const levelMultPattern = /const levelMultiplier = 1 \+ \(level - 1\) \* ([\d.]+)/;
  const levelMultMatch = newContent.match(levelMultPattern);
  if (levelMultMatch && levelMultMatch[1] !== '0.10') {
    newContent = newContent.replace(
      /const levelMultiplier = 1 \+ \(level - 1\) \* [\d.]+/,
      'const levelMultiplier = 1 + (level - 1) * 0.10'
    );
    changed = true;
    console.log(`[BALANCE v4] Equipment level multiplier: ${levelMultMatch[1]} → 0.10`);
  }

  // 装备基础数值调整
  const equipTemplates = [
    { slot: 'weapon', old: 'attack: 12, range: 25', new: 'attack: 10, range: 20' },
    { slot: 'armor', old: 'health: 60, defense: 6', new: 'health: 50, defense: 5' },
    { slot: 'pants', old: 'defense: 4, health: 25', new: 'defense: 3, health: 20' },
    { slot: 'shoulder', old: 'defense: 5, critRate: 1.5', new: 'defense: 4, critRate: 1.2' },
    { slot: 'belt', old: 'attackSpeed: -40, health: 20', new: 'attackSpeed: -35, health: 18' },
    { slot: 'shoes', old: 'defense: 3, attackSpeed: -10', new: 'defense: 2, attackSpeed: -8' },
    { slot: 'earring', old: 'critRate: 2.5, critDamage: 6', new: 'critRate: 2.0, critDamage: 5' },
    { slot: 'ring', old: 'attack: 6, critRate: 1.5', new: 'attack: 5, critRate: 1.2' },
    { slot: 'necklace', old: 'health: 35, critDamage: 4', new: 'health: 30, critDamage: 3.5' },
  ];

  for (const template of equipTemplates) {
    const slotPattern = new RegExp(`${template.slot}: \\{ name: '[^']+', baseStats: \\{[^}]+\\} \\}`);
    const slotMatch = newContent.match(slotPattern);
    if (slotMatch) {
      const oldStats = slotMatch[0].match(/baseStats: \{([^}]+)\}/)?.[1]?.trim();
      if (oldStats && oldStats !== template.new) {
        const newSlotEntry = slotMatch[0].replace(/baseStats: \{[^}]+\}/, `baseStats: { ${template.new} }`);
        newContent = newContent.replace(slotPattern, newSlotEntry);
        changed = true;
        console.log(`[BALANCE v4] ${template.slot} base stats adjusted`);
      }
    }
  }

  // 废土毁灭者套装数值平衡 - 调整为更合理的强度
  const destroyerSetPattern = /wasteland_destroyer: \{[\s\S]*?\},/;
  const destroyerMatch = newContent.match(destroyerSetPattern);
  if (destroyerMatch) {
    const newDestroyerSet = `wasteland_destroyer: {
    id: 'wasteland_destroyer',
    name: '废土毁灭者',
    description: '传说中毁灭一切的武器套装',
    pieces: 6,
    icon: '☠️',
    effects: [
      { pieces: 2, effect: '攻击力+15%', value: 15, stat: 'attack' },
      { pieces: 4, effect: '暴击伤害+35%', value: 35, stat: 'critDamage' },
      { pieces: 6, effect: '攻击附带灼烧伤害', value: 12, stat: 'burnDamage' },
    ],
  },`;
    
    if (destroyerMatch[0] !== newDestroyerSet) {
      newContent = newContent.replace(destroyerSetPattern, newDestroyerSet);
      changed = true;
      console.log('[BALANCE v4] 废土毁灭者套装数值平衡调整');
    }
  }

  if (changed) {
    writeFile(EQUIPMENT_FILE, newContent);
    console.log('[BALANCE v4] Equipment balance v4 optimized');
  } else {
    console.log('[BALANCE v4] Equipment balance already v4 optimized');
  }
}

// ============================================
// 7. v4 优化道具数值平衡
// ============================================
function v4OptimizeItemBalance() {
  const content = readFile(EQUIPMENT_FILE);
  
  let newContent = content;
  let changed = false;

  // 检查并确保三个新道具存在且数值平衡
  const itemsToCheck = [
    {
      id: 'stun_bomb',
      name: '眩晕弹',
      rarity: 'fine',
      effect: 'stun',
      duration: 2000,
      icon: '💫',
      description: '使所有敌人眩晕2秒',
      value: undefined,
    },
    {
      id: 'lightning_bolt',
      name: '闪电箭',
      rarity: 'legendary',
      effect: 'lightning',
      value: 100,
      duration: 3000,
      icon: '⚡',
      description: '对所有敌人造成100伤害并感电3秒',
    },
    {
      id: 'curse_scroll',
      name: '诅咒卷轴',
      rarity: 'epic',
      effect: 'curse',
      value: 20,
      duration: 8000,
      icon: '📜',
      description: '敌人受到伤害+20%，持续8秒',
    },
  ];

  for (const item of itemsToCheck) {
    const itemPattern = new RegExp(`${item.id}:\\s*\\{[\\s\\S]*?\\},`);
    const match = newContent.match(itemPattern);
    
    if (match) {
      // 检查数值是否需要调整
      const durationMatch = match[0].match(/duration: (\d+)/);
      const valueMatch = match[0].match(/value: (\d+)/);
      
      let needsUpdate = false;
      
      if (item.duration !== undefined && durationMatch && durationMatch[1] !== String(item.duration)) {
        needsUpdate = true;
      }
      if (item.value !== undefined && valueMatch && valueMatch[1] !== String(item.value)) {
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        let newItemDef = match[0];
        if (item.value !== undefined) {
          newItemDef = newItemDef.replace(/value: \d+/, `value: ${item.value}`);
        }
        if (item.duration !== undefined) {
          newItemDef = newItemDef.replace(/duration: \d+/, `duration: ${item.duration}`);
        }
        newItemDef = newItemDef.replace(/description: '[^']*'/, `description: '${item.description}'`);
        
        newContent = newContent.replace(itemPattern, newItemDef);
        changed = true;
        console.log(`[BALANCE v4] ${item.name} 数值平衡调整`);
      }
    } else {
      console.log(`[BALANCE v4] ${item.name} 不存在，跳过（已在其他地方添加）`);
    }
  }

  if (changed) {
    writeFile(EQUIPMENT_FILE, newContent);
    console.log('[BALANCE v4] Item balance v4 optimized');
  } else {
    console.log('[BALANCE v4] Item balance already v4 optimized');
  }
}

// ============================================
// 8. v4 优化异常状态系统数值
// ============================================
function v4OptimizeDebuffSystem() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // 异常状态效果数值平衡
  const debuffPattern = /private debuffEffects: Record<string, \{[\s\S]*?\}> = \{[\s\S]*?\};/;
  const debuffMatch = newContent.match(debuffPattern);
  
  if (debuffMatch) {
    const newDebuffEffects = `private debuffEffects: Record<string, { color: string; particleColor: string; damage: number; speedMultiplier: number; icon: string; name: string; description: string; damageMultiplier?: number; glowColor?: string }> = {
    burn: { color: '#FF6600', particleColor: '#FF4400', damage: 6, speedMultiplier: 1, icon: '🔥', name: '灼烧', description: '持续受到火焰伤害', glowColor: '#FF8800' },
    poison: { color: '#00FF00', particleColor: '#00CC00', damage: 5, speedMultiplier: 0.8, icon: '☠️', name: '中毒', description: '持续受到毒素伤害，移动速度降低', glowColor: '#00FF44' },
    freeze: { color: '#00CCFF', particleColor: '#0088FF', damage: 0, speedMultiplier: 0.1, icon: '❄️', name: '冰冻', description: '被冻结，几乎无法移动', glowColor: '#88EEFF' },
    lightning: { color: '#FFFF00', particleColor: '#FFFF88', damage: 7, speedMultiplier: 0.7, icon: '⚡', name: '感电', description: '持续受到雷电伤害，移动速度降低', glowColor: '#FFFFAA' },
    slow: { color: '#8888FF', particleColor: '#AAAAFF', damage: 0, speedMultiplier: 0.55, icon: '🐢', name: '减速', description: '移动速度大幅降低', glowColor: '#BBBBFF' },
    curse: { color: '#AA00AA', particleColor: '#CC00CC', damage: 2, speedMultiplier: 0.9, icon: '📜', name: '诅咒', description: '受到伤害增加20%', damageMultiplier: 1.2, glowColor: '#DD44DD' },
    stun: { color: '#FFD700', particleColor: '#FFEA00', damage: 0, speedMultiplier: 0, icon: '💫', name: '眩晕', description: '无法移动和攻击', glowColor: '#FFFF88' },
  };`;
    
    if (debuffMatch[0] !== newDebuffEffects) {
      newContent = newContent.replace(debuffPattern, newDebuffEffects);
      changed = true;
      console.log('[BALANCE v4] 异常状态系统数值平衡调整（增加眩晕状态）');
    }
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v4] Debuff system v4 optimized');
  } else {
    console.log('[BALANCE v4] Debuff system already v4 optimized');
  }
}

// ============================================
// 9. v4 确认装备图标多样化
// ============================================
function v4VerifyEquipmentIcons() {
  const content = readFile(EQUIPMENT_FILE);
  
  // 检查每个槽位是否有10种图标
  const slotPattern = /const SLOT_ICONS: Record<EquipSlot, string\[\]> = \{([\s\S]*?)\};/;
  const match = content.match(slotPattern);
  
  if (match) {
    const slotsContent = match[1];
    const slots = ['weapon', 'armor', 'pants', 'shoulder', 'belt', 'shoes', 'earring', 'ring', 'necklace'];
    let allGood = true;
    
    for (const slot of slots) {
      const slotIconsPattern = new RegExp(`${slot}: \\[([^\\]]+)\\]`);
      const slotMatch = slotsContent.match(slotIconsPattern);
      if (slotMatch) {
        const icons = slotMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (icons.length < 10) {
          console.log(`[BALANCE v4] ⚠️  ${slot} 只有 ${icons.length} 种图标，需要补充到10种`);
          allGood = false;
        } else {
          console.log(`[BALANCE v4] ✓ ${slot} 有 ${icons.length} 种图标`);
        }
      }
    }
    
    if (allGood) {
      console.log('[BALANCE v4] 装备图标多样化已满足（每槽位10种）');
    }
  }
}

// ============================================
// 主函数
// ============================================
function runV4Optimization() {
  console.log('========================================');
  console.log('=== Game Balance Optimization v4 ===');
  console.log('========================================');
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('');
  
  try {
    console.log('--- 1. 怪物属性平衡 (v4) ---');
    v4OptimizeEnemyBalance();
    console.log('');
    
    console.log('--- 2. 技能数值调整 (v4) ---');
    v4OptimizeSkillValues();
    console.log('');
    
    console.log('--- 3. 等级成长曲线 (v4) ---');
    v4OptimizeLevelScaling();
    console.log('');
    
    console.log('--- 4. 元素技能平衡 (v4) ---');
    v4OptimizeElementalSkills();
    console.log('');
    
    console.log('--- 5. 玩家基础属性 (v4) ---');
    v4OptimizePlayerBaseStats();
    console.log('');
    
    console.log('--- 6. 装备数值平衡 (v4) ---');
    v4OptimizeEquipmentBalance();
    console.log('');
    
    console.log('--- 7. 道具数值平衡 (v4) ---');
    v4OptimizeItemBalance();
    console.log('');
    
    console.log('--- 8. 异常状态系统 (v4) ---');
    v4OptimizeDebuffSystem();
    console.log('');
    
    console.log('--- 9. 装备图标多样化检查 ---');
    v4VerifyEquipmentIcons();
    console.log('');
    
    console.log('========================================');
    console.log('=== v4 Optimization Completed ===');
    console.log('========================================');
  } catch (error) {
    console.error('========================================');
    console.error('=== Optimization Failed ===');
    console.error('========================================');
    console.error(error);
  }
}

if (require.main === module) {
  runV4Optimization();
}

module.exports = { runV4Optimization };
