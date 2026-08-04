const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, 'src/game/data');
const ENEMIES_FILE = path.join(BASE_DIR, 'enemies.ts');
const EQUIPMENT_FILE = path.join(BASE_DIR, 'equipment.ts');
const SKILLS_FILE = path.join(BASE_DIR, 'skills.ts');
const ENGINE_FILE = path.join(__dirname, 'src/game/GameEngine.ts');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`[BALANCE v3] Updated: ${filePath}`);
}

// ============================================
// 1. 深度优化怪物属性平衡 (v3)
// ============================================
function deepOptimizeEnemyBalance() {
  const content = readFile(ENEMIES_FILE);
  
  // v3: 更精细的怪物平衡 - 考虑DPS、生存能力、经验效率
  const enemyBalance = {
    // 普通怪（前10波主力）
    mutant: { 
      health: 22, speed: 4.8, damage: 3, exp: 3,
      note: '最基础敌人，低血低伤，经验效率中等'
    },
    raider: { 
      health: 35, speed: 6.2, damage: 6, exp: 7,
      note: '快速敌人，威胁在于速度，需要高攻速应对'
    },
    infected: { 
      health: 55, speed: 5.5, damage: 9, exp: 11,
      note: '中等敌人，各项属性均衡'
    },
    brute: { 
      health: 120, speed: 4.0, damage: 18, exp: 25,
      note: '重装敌人，高血高伤但慢，是前期boss级威胁'
    },
    spider: { 
      health: 28, speed: 7.2, damage: 5, exp: 9,
      note: '高速低血，考验玩家射程和攻速'
    },
    zombie: { 
      health: 90, speed: 2.2, damage: 7, exp: 12,
      note: '慢速高血，经验效率低但血厚烦人'
    },
    // 精英怪（每5波出现）
    heavy_trooper: { 
      health: 320, speed: 3.8, damage: 25, exp: 70,
      note: '第一个精英，高防御高血量'
    },
    mech_soldier: { 
      health: 500, speed: 5.5, damage: 38, exp: 130,
      note: '中期精英，高攻速高伤害'
    },
    sniper_bot: { 
      health: 200, speed: 2.0, damage: 50, exp: 110,
      note: '远程高伤，威胁极大但脆皮'
    },
    // BOSS（每10波出现）
    war_tank: { 
      health: 2000, speed: 2.0, damage: 50, exp: 450,
      note: '第一个BOSS，火焰属性，中等难度'
    },
    alien_hive: { 
      health: 3500, speed: 1.2, damage: 68, exp: 750,
      note: '第二个BOSS，毒属性，召唤小怪'
    },
    cyber_dragon: { 
      health: 6000, speed: 1.1, damage: 95, exp: 2000,
      note: '最终BOSS，冰属性，多阶段'
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
        console.log(`[BALANCE v3] ${enemy}: HP ${oldHealth}→${stats.health}, DMG ${oldDamage}→${stats.damage}, SPD ${oldSpeed}→${stats.speed}, EXP ${oldExp}→${stats.exp}`);
      }
    }
  }

  if (changed) {
    writeFile(ENEMIES_FILE, newContent);
    console.log('[BALANCE v3] Enemy balance deep optimized');
  } else {
    console.log('[BALANCE v3] Enemy balance already deep optimized');
  }
}

// ============================================
// 2. 深度调整技能数值 (v3)
// ============================================
function deepOptimizeSkillValues() {
  const content = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);

  // v3: 更平衡的技能数值 - 考虑技能点性价比
  const skillTargets = {
    // 攻击技能：每级提升应该递减，但保持吸引力
    'atk_1': { desc: '攻击力+8/级', engineVal: 8 },
    'atk_2': { desc: '攻击力+14/级', engineVal: 14 },
    'atk_3': { desc: '攻击力+22/级', engineVal: 22 },
    'atk_4': { desc: '攻击力+32/级', engineVal: 32 },
    'atk_5': { desc: '攻击力+48/级', engineVal: 48 },
    // 攻速技能：攻速提升应该更保守（指数增长太强）
    'spd_1': { desc: '攻速+7%/级', engineVal: 0.07 },
    'spd_2': { desc: '攻速+11%/级', engineVal: 0.11 },
    'spd_3': { desc: '攻速+16%/级', engineVal: 0.16 },
    'spd_4': { desc: '攻速+22%/级', engineVal: 0.22 },
    'spd_5': { desc: '攻速+30%/级', engineVal: 0.30 },
    // 射程技能：前期价值高，后期递减
    'rng_1': { desc: '射程+40/级', engineVal: 40 },
    'rng_2': { desc: '射程+65/级', engineVal: 65 },
    'rng_3': { desc: '射程+100/级', engineVal: 100 },
    'rng_4': { desc: '射程+140/级', engineVal: 140 },
    // 暴击技能：暴击率有上限，数值应保守
    'crit_1': { desc: '暴击率+4%/级', engineVal: 4 },
    'crit_2': { desc: '暴击率+6%/级', engineVal: 6 },
    'crit_3': { desc: '暴击率+9%/级', engineVal: 9 },
    'crit_4': { desc: '暴击率+12%/级', engineVal: 12 },
    // 暴伤技能：数值可以更高（乘算区）
    'cdmg_1': { desc: '暴击伤害+30%/级', engineVal: 30 },
    'cdmg_2': { desc: '暴击伤害+50%/级', engineVal: 50 },
    'cdmg_3': { desc: '暴击伤害+75%/级', engineVal: 75 },
    // 生命技能：前期提升大，后期更需要百分比
    'hp_1': { desc: '最大生命+45/级', engineVal: 45 },
    'hp_2': { desc: '最大生命+90/级', engineVal: 90 },
    'hp_3': { desc: '最大生命+150/级', engineVal: 150 },
    'hp_4': { desc: '最大生命+260/级', engineVal: 260 },
    // 防御技能：减伤效果应递减
    'def_1': { desc: '减伤+6%/级', engineVal: 6 },
    'def_2': { desc: '减伤+12%/级', engineVal: 12 },
    'def_3': { desc: '减伤+18%/级', engineVal: 18 },
    'def_4': { desc: '减伤+24%/级', engineVal: 24 },
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
      console.log(`[BALANCE v3] ${skillId} desc: "${match[2]}" → "${target.desc}"`);
    }
  }

  // 更新引擎中的技能数值
  const skillValuePatterns = [
    { id: 'atk_1', pattern: /case 'atk_1': attack \+= (\d+) \* lvl;/, val: 8, template: "case 'atk_1': attack += VAL * lvl;" },
    { id: 'atk_2', pattern: /case 'atk_2': attack \+= (\d+) \* lvl;/, val: 14, template: "case 'atk_2': attack += VAL * lvl;" },
    { id: 'atk_3', pattern: /case 'atk_3': attack \+= (\d+) \* lvl;/, val: 22, template: "case 'atk_3': attack += VAL * lvl;" },
    { id: 'atk_4', pattern: /case 'atk_4': attack \+= (\d+) \* lvl;/, val: 32, template: "case 'atk_4': attack += VAL * lvl;" },
    { id: 'atk_5', pattern: /case 'atk_5': attack \+= (\d+) \* lvl;/, val: 48, template: "case 'atk_5': attack += VAL * lvl;" },
    { id: 'spd_1', pattern: /case 'spd_1': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.07, template: "case 'spd_1': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_2', pattern: /case 'spd_2': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.11, template: "case 'spd_2': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_3', pattern: /case 'spd_3': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.16, template: "case 'spd_3': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_4', pattern: /case 'spd_4': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.22, template: "case 'spd_4': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_5', pattern: /case 'spd_5': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.30, template: "case 'spd_5': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'rng_1', pattern: /case 'rng_1': range \+= (\d+) \* lvl;/, val: 40, template: "case 'rng_1': range += VAL * lvl;" },
    { id: 'rng_2', pattern: /case 'rng_2': range \+= (\d+) \* lvl;/, val: 65, template: "case 'rng_2': range += VAL * lvl;" },
    { id: 'rng_3', pattern: /case 'rng_3': range \+= (\d+) \* lvl;/, val: 100, template: "case 'rng_3': range += VAL * lvl;" },
    { id: 'rng_4', pattern: /case 'rng_4': range \+= (\d+) \* lvl;/, val: 140, template: "case 'rng_4': range += VAL * lvl;" },
    { id: 'crit_1', pattern: /case 'crit_1': critRate \+= (\d+) \* lvl;/, val: 4, template: "case 'crit_1': critRate += VAL * lvl;" },
    { id: 'crit_2', pattern: /case 'crit_2': critRate \+= (\d+) \* lvl;/, val: 6, template: "case 'crit_2': critRate += VAL * lvl;" },
    { id: 'crit_3', pattern: /case 'crit_3': critRate \+= (\d+) \* lvl;/, val: 9, template: "case 'crit_3': critRate += VAL * lvl;" },
    { id: 'crit_4', pattern: /case 'crit_4': critRate \+= (\d+) \* lvl;/, val: 12, template: "case 'crit_4': critRate += VAL * lvl;" },
    { id: 'cdmg_1', pattern: /case 'cdmg_1': critDamage \+= (\d+) \* lvl;/, val: 30, template: "case 'cdmg_1': critDamage += VAL * lvl;" },
    { id: 'cdmg_2', pattern: /case 'cdmg_2': critDamage \+= (\d+) \* lvl;/, val: 50, template: "case 'cdmg_2': critDamage += VAL * lvl;" },
    { id: 'cdmg_3', pattern: /case 'cdmg_3': critDamage \+= (\d+) \* lvl;/, val: 75, template: "case 'cdmg_3': critDamage += VAL * lvl;" },
    { id: 'hp_1', pattern: /case 'hp_1': maxHealth \+= (\d+) \* lvl;/, val: 45, template: "case 'hp_1': maxHealth += VAL * lvl;" },
    { id: 'hp_2', pattern: /case 'hp_2': maxHealth \+= (\d+) \* lvl;/, val: 90, template: "case 'hp_2': maxHealth += VAL * lvl;" },
    { id: 'hp_3', pattern: /case 'hp_3': maxHealth \+= (\d+) \* lvl;/, val: 150, template: "case 'hp_3': maxHealth += VAL * lvl;" },
    { id: 'hp_4', pattern: /case 'hp_4': maxHealth \+= (\d+) \* lvl;/, val: 260, template: "case 'hp_4': maxHealth += VAL * lvl;" },
    { id: 'def_1', pattern: /case 'def_1': defense \+= (\d+) \* lvl;/, val: 6, template: "case 'def_1': defense += VAL * lvl;" },
    { id: 'def_2', pattern: /case 'def_2': defense \+= (\d+) \* lvl;/, val: 12, template: "case 'def_2': defense += VAL * lvl;" },
    { id: 'def_3', pattern: /case 'def_3': defense \+= (\d+) \* lvl;/, val: 18, template: "case 'def_3': defense += VAL * lvl;" },
    { id: 'def_4', pattern: /case 'def_4': defense \+= (\d+) \* lvl;/, val: 24, template: "case 'def_4': defense += VAL * lvl;" },
  ];

  for (const skill of skillValuePatterns) {
    const match = newEngineContent.match(skill.pattern);
    if (match && match[1] !== String(skill.val)) {
      const replacement = skill.template.replace('VAL', String(skill.val));
      newEngineContent = newEngineContent.replace(skill.pattern, replacement);
      engineChanged = true;
      console.log(`[BALANCE v3] ${skill.id} engine value: ${match[1]} → ${skill.val}`);
    }
  }

  if (skillsChanged) {
    writeFile(SKILLS_FILE, newSkillsContent);
    console.log('[BALANCE v3] Skill descriptions deep optimized');
  } else {
    console.log('[BALANCE v3] Skill descriptions already deep optimized');
  }

  if (engineChanged) {
    writeFile(ENGINE_FILE, newEngineContent);
    console.log('[BALANCE v3] Skill values in engine deep optimized');
  } else {
    console.log('[BALANCE v3] Skill values in engine already deep optimized');
  }
}

// ============================================
// 3. 深度优化等级成长曲线 (v3)
// ============================================
function deepOptimizeLevelScaling() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // v3: 更平滑的经验曲线 - 前期快后期慢，鼓励探索
  // 旧公式: 45 + Math.pow(lvl, 1.55) * 8 + lvl * 10
  // 新公式: 50 + Math.pow(lvl, 1.45) * 12 + lvl * 8
  // 特点：1-10级较快，10-30级适中，30级以上显著变慢
  const newExpFormula = '50 + Math.pow(lvl, 1.45) * 12 + lvl * 8';
  const expFormula = content.match(/this\.player\.expToNextLevel = Math\.floor\(([^;]+)\)/);
  if (expFormula) {
    const oldFormula = expFormula[1];
    if (oldFormula !== newExpFormula) {
      newContent = newContent.replace(
        /this\.player\.expToNextLevel = Math\.floor\([^;]+\)/,
        `this.player.expToNextLevel = Math.floor(${newExpFormula})`
      );
      changed = true;
      console.log(`[BALANCE v3] Exp formula: "${oldFormula}" → "${newExpFormula}"`);
    }
  }

  // 初始经验值（对应初始等级）
  const newInitialExp = 'expToNextLevel: Math.floor(50 + Math.pow(100, 1.45) * 12 + 100 * 8),';
  if (!content.includes(newInitialExp)) {
    newContent = newContent.replace(
      /expToNextLevel: Math\.floor\([^\n]+\),/,
      newInitialExp
    );
    changed = true;
    console.log('[BALANCE v3] Initial exp value updated');
  }

  // 等级加成 - 每级提升全属性
  // 旧值: 从1级开始，每级+4.5%
  // 新值: 从1级开始，每级+3.5%（衰减，防止后期过强）
  const levelBonus = newContent.match(/const levelBonus = Math\.max\(0, \(this\.player\.level - (\d+)\)\) \* ([\d.]+)/);
  if (levelBonus) {
    const newMult = '0.035';
    if (levelBonus[2] !== newMult) {
      newContent = newContent.replace(
        /const levelBonus = Math\.max\(0, \(this\.player\.level - \d+\)\) \* [\d.]+/,
        `const levelBonus = Math.max(0, (this.player.level - 1)) * ${newMult}`
      );
      changed = true;
      console.log(`[BALANCE v3] Level bonus multiplier: ${levelBonus[2]} → ${newMult}`);
    }
  }

  // 生命加成倍数
  const healthBonusMult = newContent.match(/maxHealth = Math\.floor\(maxHealth \* \(1 \+ levelBonus \* ([\d.]+)\)\)/);
  if (healthBonusMult) {
    const newMult = '1.2';
    if (healthBonusMult[1] !== newMult) {
      newContent = newContent.replace(
        /maxHealth = Math\.floor\(maxHealth \* \(1 \+ levelBonus \* [\d.]+\)\)/,
        `maxHealth = Math.floor(maxHealth * (1 + levelBonus * ${newMult}))`
      );
      changed = true;
      console.log(`[BALANCE v3] Health bonus multiplier: ${healthBonusMult[1]} → ${newMult}`);
    }
  }

  // 波次怪物属性增长
  // 血量增长：1.05 → 1.045（更平缓）
  const healthMultiplier = newContent.match(/const healthMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (healthMultiplier) {
    const newPow = '1.045';
    if (healthMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const healthMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const healthMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v3] Wave health multiplier: ${healthMultiplier[1]} → ${newPow}`);
    }
  }

  // 伤害增长：1.035 → 1.03（更平缓，防止后期被秒）
  const damageMultiplier = newContent.match(/const damageMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (damageMultiplier) {
    const newPow = '1.03';
    if (damageMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const damageMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const damageMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v3] Wave damage multiplier: ${damageMultiplier[1]} → ${newPow}`);
    }
  }

  // 速度增长：0.5上限，0.006每波 → 0.4上限，0.005每波
  const speedMultiplier = newContent.match(/const speedMultiplier = 1 \+ Math\.min\(([\d.]+), \(wave - 1\) \* ([\d.]+)\)/);
  if (speedMultiplier) {
    const newMin = '0.4';
    const newMultVal = '0.005';
    if (speedMultiplier[1] !== newMin || speedMultiplier[2] !== newMultVal) {
      newContent = newContent.replace(
        /const speedMultiplier = 1 \+ Math\.min\([\d.]+, \(wave - 1\) \* [\d.]+\)/,
        `const speedMultiplier = 1 + Math.min(${newMin}, (wave - 1) * ${newMultVal})`
      );
      changed = true;
      console.log(`[BALANCE v3] Wave speed multiplier: min=${speedMultiplier[1]}→${newMin}, perWave=${speedMultiplier[2]}→${newMultVal}`);
    }
  }

  // 经验增长：1.05 → 1.04（经验获取更稳定）
  const expMultiplier = newContent.match(/const expMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (expMultiplier) {
    const newPow = '1.04';
    if (expMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const expMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const expMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v3] Wave exp multiplier: ${expMultiplier[1]} → ${newPow}`);
    }
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v3] Level scaling deep optimized');
  } else {
    console.log('[BALANCE v3] Level scaling already deep optimized');
  }
}

// ============================================
// 4. 优化元素技能数值 (v3)
// ============================================
function optimizeElementalSkillValues() {
  const content = readFile(ENGINE_FILE);
  let newContent = content;
  let changed = false;

  // 灼烧技能数值
  const burn1Pattern = /case 'burn_1':\s*burnChance \+= (\d+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn1Match = newContent.match(burn1Pattern);
  if (burn1Match && (burn1Match[1] !== '5' || burn1Match[2] !== '8' || burn1Match[3] !== '2500')) {
    newContent = newContent.replace(
      burn1Pattern,
      `case 'burn_1':\n          burnChance += 5 * lvl;\n          burnDamage += 8 * lvl;\n          burnDuration = Math.max(burnDuration, 2500);`
    );
    changed = true;
    console.log('[BALANCE v3] burn_1 values optimized');
  }

  const burn2Pattern = /case 'burn_2':\s*burnChance \+= (\d+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn2Match = newContent.match(burn2Pattern);
  if (burn2Match && (burn2Match[1] !== '8' || burn2Match[2] !== '16' || burn2Match[3] !== '4000')) {
    newContent = newContent.replace(
      burn2Pattern,
      `case 'burn_2':\n          burnChance += 8 * lvl;\n          burnDamage += 16 * lvl;\n          burnDuration = Math.max(burnDuration, 4000);`
    );
    changed = true;
    console.log('[BALANCE v3] burn_2 values optimized');
  }

  // 毒素技能数值
  const poison1Pattern = /case 'poison_1':\s*poisonChance \+= (\d+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison1Match = newContent.match(poison1Pattern);
  if (poison1Match && (poison1Match[1] !== '5' || poison1Match[2] !== '6' || poison1Match[3] !== '2500')) {
    newContent = newContent.replace(
      poison1Pattern,
      `case 'poison_1':\n          poisonChance += 5 * lvl;\n          poisonDamage += 6 * lvl;\n          poisonDuration = Math.max(poisonDuration, 2500);`
    );
    changed = true;
    console.log('[BALANCE v3] poison_1 values optimized');
  }

  const poison2Pattern = /case 'poison_2':\s*poisonChance \+= (\d+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison2Match = newContent.match(poison2Pattern);
  if (poison2Match && (poison2Match[1] !== '8' || poison2Match[2] !== '12' || poison2Match[3] !== '4000')) {
    newContent = newContent.replace(
      poison2Pattern,
      `case 'poison_2':\n          poisonChance += 8 * lvl;\n          poisonDamage += 12 * lvl;\n          poisonDuration = Math.max(poisonDuration, 4000);`
    );
    changed = true;
    console.log('[BALANCE v3] poison_2 values optimized');
  }

  // 冰霜技能数值
  const freeze1Pattern = /case 'freeze_1':\s*freezeChance \+= (\d+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze1Match = newContent.match(freeze1Pattern);
  if (freeze1Match && (freeze1Match[1] !== '4' || freeze1Match[2] !== '35' || freeze1Match[3] !== '2500')) {
    newContent = newContent.replace(
      freeze1Pattern,
      `case 'freeze_1':\n          freezeChance += 4 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 35);\n          freezeDuration = Math.max(freezeDuration, 2500);`
    );
    changed = true;
    console.log('[BALANCE v3] freeze_1 values optimized');
  }

  const freeze2Pattern = /case 'freeze_2':\s*freezeChance \+= (\d+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze2Match = newContent.match(freeze2Pattern);
  if (freeze2Match && (freeze2Match[1] !== '6' || freeze2Match[2] !== '100' || freeze2Match[3] !== '1500')) {
    newContent = newContent.replace(
      freeze2Pattern,
      `case 'freeze_2':\n          freezeChance += 6 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 100);\n          freezeDuration = Math.max(freezeDuration, 1500);`
    );
    changed = true;
    console.log('[BALANCE v3] freeze_2 values optimized');
  }

  // 雷电技能数值
  const lightning1Pattern = /case 'lightning_1':\s*lightningChance \+= (\d+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning1Match = newContent.match(lightning1Pattern);
  if (lightning1Match && (lightning1Match[1] !== '5' || lightning1Match[2] !== '3' || lightning1Match[3] !== '10')) {
    newContent = newContent.replace(
      lightning1Pattern,
      `case 'lightning_1':\n          lightningChance += 5 * lvl;\n          lightningChain = Math.max(lightningChain, 3);\n          lightningDamage += 10 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v3] lightning_1 values optimized');
  }

  const lightning2Pattern = /case 'lightning_2':\s*lightningChance \+= (\d+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning2Match = newContent.match(lightning2Pattern);
  if (lightning2Match && (lightning2Match[1] !== '8' || lightning2Match[2] !== '5' || lightning2Match[3] !== '18')) {
    newContent = newContent.replace(
      lightning2Pattern,
      `case 'lightning_2':\n          lightningChance += 8 * lvl;\n          lightningChain = Math.max(lightningChain, 5);\n          lightningDamage += 18 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v3] lightning_2 values optimized');
  }

  // 吸血技能数值
  const lifesteal1Pattern = /case 'lifesteal_1':\s*lifestealPercent \+= ([\d.]+) \* lvl;/;
  const lifesteal1Match = newContent.match(lifesteal1Pattern);
  if (lifesteal1Match && lifesteal1Match[1] !== '0.4') {
    newContent = newContent.replace(
      lifesteal1Pattern,
      `case 'lifesteal_1':\n          lifestealPercent += 0.4 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v3] lifesteal_1 value optimized');
  }

  const lifesteal2Pattern = /case 'lifesteal_2':\s*lifestealPercent \+= ([\d.]+) \* lvl;/;
  const lifesteal2Match = newContent.match(lifesteal2Pattern);
  if (lifesteal2Match && lifesteal2Match[2] !== '1.2') {
    // 注意：lifesteal_2 是第二个 lifesteal 匹配
    const allMatches = [...newContent.matchAll(/case 'lifesteal_(\d+)':\s*lifestealPercent \+= ([\d.]+) \* lvl;/g)];
    if (allMatches.length >= 2 && allMatches[1][2] !== '1.2') {
      // 需要更精确地替换第二个
      let count = 0;
      newContent = newContent.replace(
        /case 'lifesteal_\d+':\s*lifestealPercent \+= [\d.]+ \* lvl;/g,
        (match) => {
          count++;
          if (count === 2) {
            return `case 'lifesteal_2':\n          lifestealPercent += 1.2 * lvl;`;
          }
          return match;
        }
      );
      changed = true;
      console.log('[BALANCE v3] lifesteal_2 value optimized');
    }
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v3] Elemental skill values deep optimized');
  } else {
    console.log('[BALANCE v3] Elemental skill values already deep optimized');
  }
}

// ============================================
// 5. 优化玩家基础属性 (v3)
// ============================================
function optimizePlayerBaseStats() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // 基础攻击力: 10 → 8（更依赖技能和装备）
  const baseAttack = newContent.match(/attack: (\d+),/);
  if (baseAttack && baseAttack[1] !== '8') {
    newContent = newContent.replace(/attack: \d+,/, 'attack: 8,');
    changed = true;
    console.log(`[BALANCE v3] Base attack: ${baseAttack[1]} → 8`);
  }

  // 基础生命值: 100 → 80（更依赖技能和装备）
  const baseMaxHealth = newContent.match(/maxHealth: (\d+),/);
  if (baseMaxHealth && baseMaxHealth[1] !== '80') {
    newContent = newContent.replace(/maxHealth: \d+,/, 'maxHealth: 80,');
    changed = true;
    console.log(`[BALANCE v3] Base maxHealth: ${baseMaxHealth[1]} → 80`);
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v3] Player base stats optimized');
  } else {
    console.log('[BALANCE v3] Player base stats already optimized');
  }
}

// ============================================
// 主函数
// ============================================
function runDeepOptimization() {
  console.log('========================================');
  console.log('=== Game Balance Deep Optimization v3 ===');
  console.log('========================================');
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('');
  
  try {
    console.log('--- 1. Enemy Balance ---');
    deepOptimizeEnemyBalance();
    console.log('');
    
    console.log('--- 2. Skill Values ---');
    deepOptimizeSkillValues();
    console.log('');
    
    console.log('--- 3. Level Scaling ---');
    deepOptimizeLevelScaling();
    console.log('');
    
    console.log('--- 4. Elemental Skills ---');
    optimizeElementalSkillValues();
    console.log('');
    
    console.log('--- 5. Player Base Stats ---');
    optimizePlayerBaseStats();
    console.log('');
    
    console.log('========================================');
    console.log('=== Deep Optimization Completed ===');
    console.log('========================================');
  } catch (error) {
    console.error('========================================');
    console.error('=== Optimization Failed ===');
    console.error('========================================');
    console.error(error);
  }
}

if (require.main === module) {
  runDeepOptimization();
}

module.exports = { runDeepOptimization };
