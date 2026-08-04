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
  console.log(`[BALANCE v5] Updated: ${filePath}`);
}

// ============================================
// 1. v5 怪物属性深度平衡
// ============================================
function v5OptimizeEnemyBalance() {
  const content = readFile(ENEMIES_FILE);
  
  // v5: 基于玩家成长曲线的精细平衡
  // 设计原则：
  // - 普通怪：生存时间约2-4秒（基于玩家基础DPS）
  // - 精英怪：生存时间约8-12秒，数值约为同波普通怪的6-10倍
  // - BOSS：生存时间约20-30秒，数值约为同波精英怪的4-6倍
  // - 经验效率：HP/EXP 比例保持在合理范围
  const enemyBalance = {
    // 普通怪 - 明确的定位和梯度
    mutant: { 
      health: 18, speed: 4.2, damage: 2, exp: 2,
      note: '最基础敌人，新手训练，低血量低伤害'
    },
    raider: { 
      health: 28, speed: 6.8, damage: 5, exp: 6,
      note: '快速敌人，第2波解锁，高移速中等伤害'
    },
    spider: { 
      health: 22, speed: 8.2, damage: 4, exp: 7,
      note: '最高速敌人，第4波解锁，脆皮但难以命中'
    },
    infected: { 
      health: 55, speed: 5.0, damage: 9, exp: 11,
      note: '中等均衡敌人，第3波解锁，标准威胁'
    },
    zombie: { 
      health: 95, speed: 1.8, damage: 7, exp: 12,
      note: '慢速坦克，第5波解锁，血厚经验效率中等'
    },
    brute: { 
      health: 130, speed: 3.5, damage: 18, exp: 28,
      note: '重装普通怪，第7波解锁，高威胁高经验'
    },
    // 精英怪 - 每5波出现，各有特色
    heavy_trooper: { 
      health: 320, speed: 3.2, damage: 25, exp: 75,
      note: '第5/15/25波精英，高防御高血量坦克型'
    },
    sniper_bot: { 
      health: 200, speed: 1.5, damage: 55, exp: 110,
      note: '第10/20/30波精英，远程高伤害脆皮'
    },
    mech_soldier: { 
      health: 520, speed: 5.0, damage: 40, exp: 140,
      note: '第15/25/35波精英，攻守兼备全能型'
    },
    // BOSS - 每10波出现，难度递增
    war_tank: { 
      health: 2000, speed: 1.6, damage: 50, exp: 450,
      note: '第10波BOSS，火焰属性，入门级'
    },
    alien_hive: { 
      health: 3800, speed: 0.9, damage: 70, exp: 750,
      note: '第20波BOSS，毒属性，召唤流'
    },
    cyber_dragon: { 
      health: 6500, speed: 0.9, damage: 95, exp: 2000,
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
        console.log(`[BALANCE v5] ${enemy}: HP ${oldHealth}→${stats.health}, DMG ${oldDamage}→${stats.damage}, SPD ${oldSpeed}→${stats.speed}, EXP ${oldExp}→${stats.exp}`);
      }
    }
  }

  if (changed) {
    writeFile(ENEMIES_FILE, newContent);
    console.log('[BALANCE v5] Enemy balance v5 optimized');
  } else {
    console.log('[BALANCE v5] Enemy balance already v5 optimized');
  }
}

// ============================================
// 2. v5 技能数值精细平衡
// ============================================
function v5OptimizeSkillValues() {
  const content = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);

  // v5: 基于性价比曲线的精细平衡
  // 设计原则：
  // - 低级技能：高性价比，快速见效
  // - 高级技能：低边际效益，但总量高
  // - 攻速/暴击：数值更保守（乘算效应）
  // - 生命/防御：前期效果明显，后期衰减
  // - 元素技能：概率适中，DOT伤害基于玩家攻击力
  const skillTargets = {
    // 攻击技能：每级提升递减，但总量可观
    'atk_1': { desc: '攻击力+5/级', engineVal: 5 },
    'atk_2': { desc: '攻击力+10/级', engineVal: 10 },
    'atk_3': { desc: '攻击力+18/级', engineVal: 18 },
    'atk_4': { desc: '攻击力+28/级', engineVal: 28 },
    'atk_5': { desc: '攻击力+42/级', engineVal: 42 },
    // 攻速技能：更保守（攻速是乘算，效应太强）
    'spd_1': { desc: '攻速+4%/级', engineVal: 0.04 },
    'spd_2': { desc: '攻速+7%/级', engineVal: 0.07 },
    'spd_3': { desc: '攻速+10%/级', engineVal: 0.10 },
    'spd_4': { desc: '攻速+15%/级', engineVal: 0.15 },
    'spd_5': { desc: '攻速+22%/级', engineVal: 0.22 },
    // 射程技能：前期价值高，后期递减
    'rng_1': { desc: '射程+30/级', engineVal: 30 },
    'rng_2': { desc: '射程+55/级', engineVal: 55 },
    'rng_3': { desc: '射程+85/级', engineVal: 85 },
    'rng_4': { desc: '射程+120/级', engineVal: 120 },
    // 暴击技能：暴击率有上限，数值更保守
    'crit_1': { desc: '暴击率+2.5%/级', engineVal: 2.5 },
    'crit_2': { desc: '暴击率+4.5%/级', engineVal: 4.5 },
    'crit_3': { desc: '暴击率+7%/级', engineVal: 7 },
    'crit_4': { desc: '暴击率+10%/级', engineVal: 10 },
    // 暴伤技能：数值可以更高（乘算区，但需要暴击率配合）
    'cdmg_1': { desc: '暴击伤害+20%/级', engineVal: 20 },
    'cdmg_2': { desc: '暴击伤害+40%/级', engineVal: 40 },
    'cdmg_3': { desc: '暴击伤害+65%/级', engineVal: 65 },
    // 生命技能：前期提升大，后期更需要百分比
    'hp_1': { desc: '最大生命+35/级', engineVal: 35 },
    'hp_2': { desc: '最大生命+70/级', engineVal: 70 },
    'hp_3': { desc: '最大生命+120/级', engineVal: 120 },
    'hp_4': { desc: '最大生命+200/级', engineVal: 200 },
    // 防御技能：减伤效果递减（边际效益）
    'def_1': { desc: '减伤+4%/级', engineVal: 4 },
    'def_2': { desc: '减伤+8%/级', engineVal: 8 },
    'def_3': { desc: '减伤+14%/级', engineVal: 14 },
    'def_4': { desc: '减伤+20%/级', engineVal: 20 },
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
      console.log(`[BALANCE v5] ${skillId} desc: "${match[2]}" → "${target.desc}"`);
    }
  }

  // 更新引擎中的技能数值
  const skillValuePatterns = [
    { id: 'atk_1', pattern: /case 'atk_1': attack \+= (\d+) \* lvl;/, val: 5, template: "case 'atk_1': attack += VAL * lvl;" },
    { id: 'atk_2', pattern: /case 'atk_2': attack \+= (\d+) \* lvl;/, val: 10, template: "case 'atk_2': attack += VAL * lvl;" },
    { id: 'atk_3', pattern: /case 'atk_3': attack \+= (\d+) \* lvl;/, val: 18, template: "case 'atk_3': attack += VAL * lvl;" },
    { id: 'atk_4', pattern: /case 'atk_4': attack \+= (\d+) \* lvl;/, val: 28, template: "case 'atk_4': attack += VAL * lvl;" },
    { id: 'atk_5', pattern: /case 'atk_5': attack \+= (\d+) \* lvl;/, val: 42, template: "case 'atk_5': attack += VAL * lvl;" },
    { id: 'spd_1', pattern: /case 'spd_1': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.04, template: "case 'spd_1': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_2', pattern: /case 'spd_2': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.07, template: "case 'spd_2': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_3', pattern: /case 'spd_3': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.10, template: "case 'spd_3': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_4', pattern: /case 'spd_4': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.15, template: "case 'spd_4': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_5', pattern: /case 'spd_5': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.22, template: "case 'spd_5': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'rng_1', pattern: /case 'rng_1': range \+= (\d+) \* lvl;/, val: 30, template: "case 'rng_1': range += VAL * lvl;" },
    { id: 'rng_2', pattern: /case 'rng_2': range \+= (\d+) \* lvl;/, val: 55, template: "case 'rng_2': range += VAL * lvl;" },
    { id: 'rng_3', pattern: /case 'rng_3': range \+= (\d+) \* lvl;/, val: 85, template: "case 'rng_3': range += VAL * lvl;" },
    { id: 'rng_4', pattern: /case 'rng_4': range \+= (\d+) \* lvl;/, val: 120, template: "case 'rng_4': range += VAL * lvl;" },
    { id: 'crit_1', pattern: /case 'crit_1': critRate \+= ([\d.]+) \* lvl;/, val: 2.5, template: "case 'crit_1': critRate += VAL * lvl;" },
    { id: 'crit_2', pattern: /case 'crit_2': critRate \+= ([\d.]+) \* lvl;/, val: 4.5, template: "case 'crit_2': critRate += VAL * lvl;" },
    { id: 'crit_3', pattern: /case 'crit_3': critRate \+= ([\d.]+) \* lvl;/, val: 7, template: "case 'crit_3': critRate += VAL * lvl;" },
    { id: 'crit_4', pattern: /case 'crit_4': critRate \+= ([\d.]+) \* lvl;/, val: 10, template: "case 'crit_4': critRate += VAL * lvl;" },
    { id: 'cdmg_1', pattern: /case 'cdmg_1': critDamage \+= (\d+) \* lvl;/, val: 20, template: "case 'cdmg_1': critDamage += VAL * lvl;" },
    { id: 'cdmg_2', pattern: /case 'cdmg_2': critDamage \+= (\d+) \* lvl;/, val: 40, template: "case 'cdmg_2': critDamage += VAL * lvl;" },
    { id: 'cdmg_3', pattern: /case 'cdmg_3': critDamage \+= (\d+) \* lvl;/, val: 65, template: "case 'cdmg_3': critDamage += VAL * lvl;" },
    { id: 'hp_1', pattern: /case 'hp_1': maxHealth \+= (\d+) \* lvl;/, val: 35, template: "case 'hp_1': maxHealth += VAL * lvl;" },
    { id: 'hp_2', pattern: /case 'hp_2': maxHealth \+= (\d+) \* lvl;/, val: 70, template: "case 'hp_2': maxHealth += VAL * lvl;" },
    { id: 'hp_3', pattern: /case 'hp_3': maxHealth \+= (\d+) \* lvl;/, val: 120, template: "case 'hp_3': maxHealth += VAL * lvl;" },
    { id: 'hp_4', pattern: /case 'hp_4': maxHealth \+= (\d+) \* lvl;/, val: 200, template: "case 'hp_4': maxHealth += VAL * lvl;" },
    { id: 'def_1', pattern: /case 'def_1': defense \+= (\d+) \* lvl;/, val: 4, template: "case 'def_1': defense += VAL * lvl;" },
    { id: 'def_2', pattern: /case 'def_2': defense \+= (\d+) \* lvl;/, val: 8, template: "case 'def_2': defense += VAL * lvl;" },
    { id: 'def_3', pattern: /case 'def_3': defense \+= (\d+) \* lvl;/, val: 14, template: "case 'def_3': defense += VAL * lvl;" },
    { id: 'def_4', pattern: /case 'def_4': defense \+= (\d+) \* lvl;/, val: 20, template: "case 'def_4': defense += VAL * lvl;" },
  ];

  for (const skill of skillValuePatterns) {
    const match = newEngineContent.match(skill.pattern);
    if (match && match[1] !== String(skill.val)) {
      const replacement = skill.template.replace('VAL', String(skill.val));
      newEngineContent = newEngineContent.replace(skill.pattern, replacement);
      engineChanged = true;
      console.log(`[BALANCE v5] ${skill.id} engine value: ${match[1]} → ${skill.val}`);
    }
  }

  if (skillsChanged) {
    writeFile(SKILLS_FILE, newSkillsContent);
    console.log('[BALANCE v5] Skill descriptions v5 optimized');
  } else {
    console.log('[BALANCE v5] Skill descriptions already v5 optimized');
  }

  if (engineChanged) {
    writeFile(ENGINE_FILE, newEngineContent);
    console.log('[BALANCE v5] Skill values in engine v5 optimized');
  } else {
    console.log('[BALANCE v5] Skill values in engine already v5 optimized');
  }
}

// ============================================
// 3. v5 元素技能数值精细平衡
// ============================================
function v5OptimizeElementalSkills() {
  const content = readFile(ENGINE_FILE);
  let newContent = content;
  let changed = false;

  // v5: 元素技能精细平衡
  // 设计原则：
  // - 触发概率：保持在合理范围（避免元素过于强势）
  // - DOT伤害：基于玩家攻击力百分比，确保后期有用
  // - 控制效果：有上限，避免无限控制
  // - 各元素有明确定位：
  //   - 灼烧：高DOT伤害，持续输出
  //   - 中毒：中DOT伤害+减速，持续削弱
  //   - 冰霜：控制为主，伤害较低
  //   - 雷电：群体伤害，连锁效果
  //   - 吸血：生存保障，数值保守
  //   - 穿透：清场能力，数值稳定

  // 灼烧技能：高概率高伤害（DOT主输出）
  const burn1Pattern = /case 'burn_1':\s*burnChance \+= (\d+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn1Match = newContent.match(burn1Pattern);
  if (burn1Match && (burn1Match[1] !== '5' || burn1Match[2] !== '8' || burn1Match[3] !== '3000')) {
    newContent = newContent.replace(
      burn1Pattern,
      `case 'burn_1':\n          burnChance += 5 * lvl;\n          burnDamage += 8 * lvl;\n          burnDuration = Math.max(burnDuration, 3000);`
    );
    changed = true;
    console.log('[BALANCE v5] burn_1 values optimized (5% chance, 8 dmg, 3s)');
  }

  const burn2Pattern = /case 'burn_2':\s*burnChance \+= (\d+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn2Match = newContent.match(burn2Pattern);
  if (burn2Match && (burn2Match[1] !== '8' || burn2Match[2] !== '18' || burn2Match[3] !== '5000')) {
    newContent = newContent.replace(
      burn2Pattern,
      `case 'burn_2':\n          burnChance += 8 * lvl;\n          burnDamage += 18 * lvl;\n          burnDuration = Math.max(burnDuration, 5000);`
    );
    changed = true;
    console.log('[BALANCE v5] burn_2 values optimized (8% chance, 18 dmg, 5s)');
  }

  // 毒素技能：中概率，持续时间长（DOT+减速）
  const poison1Pattern = /case 'poison_1':\s*poisonChance \+= (\d+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison1Match = newContent.match(poison1Pattern);
  if (poison1Match && (poison1Match[1] !== '5' || poison1Match[2] !== '6' || poison1Match[3] !== '4000')) {
    newContent = newContent.replace(
      poison1Pattern,
      `case 'poison_1':\n          poisonChance += 5 * lvl;\n          poisonDamage += 6 * lvl;\n          poisonDuration = Math.max(poisonDuration, 4000);`
    );
    changed = true;
    console.log('[BALANCE v5] poison_1 values optimized (5% chance, 6 dmg, 4s)');
  }

  const poison2Pattern = /case 'poison_2':\s*poisonChance \+= (\d+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison2Match = newContent.match(poison2Pattern);
  if (poison2Match && (poison2Match[1] !== '8' || poison2Match[2] !== '14' || poison2Match[3] !== '6000')) {
    newContent = newContent.replace(
      poison2Pattern,
      `case 'poison_2':\n          poisonChance += 8 * lvl;\n          poisonDamage += 14 * lvl;\n          poisonDuration = Math.max(poisonDuration, 6000);`
    );
    changed = true;
    console.log('[BALANCE v5] poison_2 values optimized (8% chance, 14 dmg, 6s)');
  }

  // 冰霜技能：低概率，控制强（控制定位）
  const freeze1Pattern = /case 'freeze_1':\s*freezeChance \+= (\d+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze1Match = newContent.match(freeze1Pattern);
  if (freeze1Match && (freeze1Match[1] !== '4' || freeze1Match[2] !== '45' || freeze1Match[3] !== '2500')) {
    newContent = newContent.replace(
      freeze1Pattern,
      `case 'freeze_1':\n          freezeChance += 4 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 45);\n          freezeDuration = Math.max(freezeDuration, 2500);`
    );
    changed = true;
    console.log('[BALANCE v5] freeze_1 values optimized (4% chance, 45% slow, 2.5s)');
  }

  const freeze2Pattern = /case 'freeze_2':\s*freezeChance \+= (\d+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze2Match = newContent.match(freeze2Pattern);
  if (freeze2Match && (freeze2Match[1] !== '6' || freeze2Match[2] !== '100' || freeze2Match[3] !== '1500')) {
    newContent = newContent.replace(
      freeze2Pattern,
      `case 'freeze_2':\n          freezeChance += 6 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 100);\n          freezeDuration = Math.max(freezeDuration, 1500);`
    );
    changed = true;
    console.log('[BALANCE v5] freeze_2 values optimized (6% chance, 100% freeze, 1.5s)');
  }

  // 雷电技能：中概率，连锁伤害（群体定位）
  const lightning1Pattern = /case 'lightning_1':\s*lightningChance \+= (\d+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning1Match = newContent.match(lightning1Pattern);
  if (lightning1Match && (lightning1Match[1] !== '5' || lightning1Match[2] !== '3' || lightning1Match[3] !== '10')) {
    newContent = newContent.replace(
      lightning1Pattern,
      `case 'lightning_1':\n          lightningChance += 5 * lvl;\n          lightningChain = Math.max(lightningChain, 3);\n          lightningDamage += 10 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v5] lightning_1 values optimized (5% chance, 3 chain, 10 dmg)');
  }

  const lightning2Pattern = /case 'lightning_2':\s*lightningChance \+= (\d+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning2Match = newContent.match(lightning2Pattern);
  if (lightning2Match && (lightning2Match[1] !== '7' || lightning2Match[2] !== '5' || lightning2Match[3] !== '20')) {
    newContent = newContent.replace(
      lightning2Pattern,
      `case 'lightning_2':\n          lightningChance += 7 * lvl;\n          lightningChain = Math.max(lightningChain, 5);\n          lightningDamage += 20 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v5] lightning_2 values optimized (7% chance, 5 chain, 20 dmg)');
  }

  // 吸血技能：数值保守（吸血过强会破坏平衡）
  const lifestealPattern = /case 'lifesteal_1':\s*lifestealPercent \+= ([\d.]+) \* lvl;/;
  const lifesteal1Match = newContent.match(lifestealPattern);
  if (lifesteal1Match && lifesteal1Match[1] !== '0.4') {
    newContent = newContent.replace(
      lifestealPattern,
      `case 'lifesteal_1':\n          lifestealPercent += 0.4 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v5] lifesteal_1 value optimized (0.4% per level)');
  }

  // lifesteal_2：需要精确匹配第二个
  const allLifestealMatches = [...newContent.matchAll(/case 'lifesteal_(\d+)':\s*lifestealPercent \+= ([\d.]+) \* lvl;/g)];
  if (allLifestealMatches.length >= 2 && allLifestealMatches[1][2] !== '1.2') {
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
    console.log('[BALANCE v5] lifesteal_2 value optimized (1.2% per level)');
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v5] Elemental skill values v5 optimized');
  } else {
    console.log('[BALANCE v5] Elemental skill values already v5 optimized');
  }
}

// ============================================
// 4. v5 等级成长曲线和波次难度优化
// ============================================
function v5OptimizeLevelScaling() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // v5: 更平滑的经验曲线 - 改进的S型增长
  // 1-10级：快速成长（新手期）
  // 10-30级：稳定增长（成长期）
  // 30级以上：显著放缓（成熟期）
  // 新公式: 35 + Math.pow(lvl, 1.35) * 8 + lvl * 5
  const newExpFormula = '35 + Math.pow(lvl, 1.35) * 8 + lvl * 5';
  const expFormula = content.match(/this\.player\.expToNextLevel = Math\.floor\(([^;]+)\)/);
  if (expFormula) {
    const oldFormula = expFormula[1];
    if (oldFormula !== newExpFormula) {
      newContent = newContent.replace(
        /this\.player\.expToNextLevel = Math\.floor\([^;]+\)/,
        `this.player.expToNextLevel = Math.floor(${newExpFormula})`
      );
      changed = true;
      console.log(`[BALANCE v5] Exp formula: "${oldFormula}" → "${newExpFormula}"`);
    }
  }

  // 初始经验值（对应初始等级100级）
  const newInitialExp = 'expToNextLevel: Math.floor(35 + Math.pow(100, 1.35) * 8 + 100 * 5),';
  if (!content.includes(newInitialExp)) {
    const oldInitialExp = content.match(/expToNextLevel: Math\.floor\([^\n]+\),/);
    if (oldInitialExp) {
      newContent = newContent.replace(
        /expToNextLevel: Math\.floor\([^\n]+\),/,
        newInitialExp
      );
      changed = true;
      console.log('[BALANCE v5] Initial exp value updated');
    }
  }

  // 等级加成 - 每级提升全属性（进一步降低，防止后期过强）
  const levelBonus = newContent.match(/const levelBonus = Math\.max\(0, \(this\.player\.level - (\d+)\)\) \* ([\d.]+)/);
  if (levelBonus) {
    const newMult = '0.025';
    if (levelBonus[2] !== newMult) {
      newContent = newContent.replace(
        /const levelBonus = Math\.max\(0, \(this\.player\.level - \d+\)\) \* [\d.]+/,
        `const levelBonus = Math.max(0, (this.player.level - 1)) * ${newMult}`
      );
      changed = true;
      console.log(`[BALANCE v5] Level bonus multiplier: ${levelBonus[2]} → ${newMult}`);
    }
  }

  // 波次怪物属性增长 - 更平缓的曲线
  // 血量增长：1.04 → 1.035（更平缓）
  const healthMultiplier = newContent.match(/const healthMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (healthMultiplier) {
    const newPow = '1.035';
    if (healthMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const healthMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const healthMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v5] Wave health multiplier: ${healthMultiplier[1]} → ${newPow}`);
    }
  }

  // 伤害增长：1.025 → 1.022（更平缓，防止后期被秒）
  const damageMultiplier = newContent.match(/const damageMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (damageMultiplier) {
    const newPow = '1.022';
    if (damageMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const damageMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const damageMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v5] Wave damage multiplier: ${damageMultiplier[1]} → ${newPow}`);
    }
  }

  // 速度增长：0.35上限，0.004每波 → 0.3上限，0.003每波（更可控）
  const speedMultiplier = newContent.match(/const speedMultiplier = 1 \+ Math\.min\(([\d.]+), \(wave - 1\) \* ([\d.]+)\)/);
  if (speedMultiplier) {
    const newMin = '0.3';
    const newMultVal = '0.003';
    if (speedMultiplier[1] !== newMin || speedMultiplier[2] !== newMultVal) {
      newContent = newContent.replace(
        /const speedMultiplier = 1 \+ Math\.min\([\d.]+, \(wave - 1\) \* [\d.]+\)/,
        `const speedMultiplier = 1 + Math.min(${newMin}, (wave - 1) * ${newMultVal})`
      );
      changed = true;
      console.log(`[BALANCE v5] Wave speed multiplier: min=${speedMultiplier[1]}→${newMin}, perWave=${speedMultiplier[2]}→${newMultVal}`);
    }
  }

  // 经验增长：1.035 → 1.03（经验获取更稳定）
  const expMultiplier = newContent.match(/const expMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (expMultiplier) {
    const newPow = '1.03';
    if (expMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const expMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const expMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v5] Wave exp multiplier: ${expMultiplier[1]} → ${newPow}`);
    }
  }

  // 掉落率增长：0.01每波 → 0.008每波（更平衡）
  const dropRateIncrease = newContent.match(/config\.dropRate \+ \(wave - 1\) \* ([\d.]+)\)/);
  if (dropRateIncrease) {
    const newVal = '0.008';
    if (dropRateIncrease[1] !== newVal) {
      newContent = newContent.replace(
        /config\.dropRate \+ \(wave - 1\) \* [\d.]+\)/,
        `config.dropRate + (wave - 1) * ${newVal})`
      );
      changed = true;
      console.log(`[BALANCE v5] Drop rate per wave: ${dropRateIncrease[1]} → ${newVal}`);
    }
  }

  // 玩家基础攻击力微调
  const baseAttack = newContent.match(/attack: (\d+),/);
  if (baseAttack && baseAttack[1] !== '8') {
    newContent = newContent.replace(/attack: \d+,/, 'attack: 8,');
    changed = true;
    console.log(`[BALANCE v5] Base attack: ${baseAttack[1]} → 8`);
  }

  // 玩家基础生命值微调
  const baseMaxHealth = newContent.match(/maxHealth: (\d+),/);
  if (baseMaxHealth && baseMaxHealth[1] !== '80') {
    newContent = newContent.replace(/maxHealth: \d+,/, 'maxHealth: 80,');
    changed = true;
    console.log(`[BALANCE v5] Base maxHealth: ${baseMaxHealth[1]} → 80`);
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v5] Level scaling v5 optimized');
  } else {
    console.log('[BALANCE v5] Level scaling already v5 optimized');
  }
}

// ============================================
// 5. v5 装备数值精细平衡
// ============================================
function v5OptimizeEquipmentBalance() {
  const content = readFile(EQUIPMENT_FILE);
  
  let newContent = content;
  let changed = false;

  // 装备基础数值调整 - v5精细平衡
  const equipTemplates = [
    { slot: 'weapon', old: 'attack: 10, range: 20', new: 'attack: 8, range: 20' },
    { slot: 'armor', old: 'health: 50, defense: 5', new: 'health: 45, defense: 4' },
    { slot: 'pants', old: 'defense: 3, health: 20', new: 'defense: 3, health: 18' },
    { slot: 'shoulder', old: 'defense: 4, critRate: 1.2', new: 'defense: 3, critRate: 1.0' },
    { slot: 'belt', old: 'attackSpeed: -35, health: 18', new: 'attackSpeed: -30, health: 15' },
    { slot: 'shoes', old: 'defense: 2, attackSpeed: -8', new: 'defense: 2, attackSpeed: -6' },
    { slot: 'earring', old: 'attack: 5, critRate: 1.2', new: 'attack: 4, critRate: 1.0' },
    { slot: 'ring', old: 'attack: 6, critRate: 1.2', new: 'attack: 5, critRate: 1.0' },
    { slot: 'necklace', old: 'health: 30, critDamage: 3.5', new: 'health: 25, critDamage: 3.0' },
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
        console.log(`[BALANCE v5] ${template.slot} base stats adjusted`);
      }
    }
  }

  // 废土毁灭者套装数值平衡 - v5微调
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
      { pieces: 2, effect: '攻击力+12%', value: 12, stat: 'attack' },
      { pieces: 4, effect: '暴击伤害+30%', value: 30, stat: 'critDamage' },
      { pieces: 6, effect: '攻击附带灼烧伤害', value: 15, stat: 'burnDamage' },
    ],
  },`;
    
    if (destroyerMatch[0] !== newDestroyerSet) {
      newContent = newContent.replace(destroyerSetPattern, newDestroyerSet);
      changed = true;
      console.log('[BALANCE v5] 废土毁灭者套装数值平衡调整');
    }
  }

  if (changed) {
    writeFile(EQUIPMENT_FILE, newContent);
    console.log('[BALANCE v5] Equipment balance v5 optimized');
  } else {
    console.log('[BALANCE v5] Equipment balance already v5 optimized');
  }
}

// ============================================
// 6. v5 验证所有新增内容完整性
// ============================================
function v5VerifyNewContent() {
  const equipContent = readFile(EQUIPMENT_FILE);
  const skillsContent = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);
  
  console.log('--- 验证新增内容完整性 ---');
  
  // 验证装备套装
  const hasDestroyerSet = equipContent.includes("wasteland_destroyer");
  console.log(`[v5 验证] 废土毁灭者套装: ${hasDestroyerSet ? '✓ 存在' : '✗ 缺失'}`);
  
  // 验证新道具
  const itemsToCheck = ['stun_bomb', 'lightning_bolt', 'curse_scroll'];
  for (const item of itemsToCheck) {
    const hasItem = equipContent.includes(item);
    const hasItemEffect = engineContent.includes(`case '${item === 'stun_bomb' ? 'stun' : item === 'lightning_bolt' ? 'lightning' : 'curse'}'`);
    console.log(`[v5 验证] ${item}: ${hasItem ? '✓ 定义存在' : '✗ 定义缺失'} | ${hasItemEffect ? '✓ 效果实现' : '✗ 效果缺失'}`);
  }
  
  // 验证新技能
  const skillsToCheck = ['burn_1', 'poison_1', 'freeze_1', 'lightning_1', 'lifesteal_1', 'piercing_1'];
  for (const skill of skillsToCheck) {
    const hasSkill = skillsContent.includes(skill);
    const hasSkillImpl = engineContent.includes(`case '${skill}'`);
    console.log(`[v5 验证] ${skill}: ${hasSkill ? '✓ 定义存在' : '✗ 定义缺失'} | ${hasSkillImpl ? '✓ 实现存在' : '✗ 实现缺失'}`);
  }
  
  // 验证异常状态系统
  const debuffsToCheck = ['burn', 'poison', 'freeze', 'lightning', 'slow', 'curse', 'stun'];
  for (const debuff of debuffsToCheck) {
    const hasDebuffDef = engineContent.includes(`${debuff}: {`);
    console.log(`[v5 验证] ${debuff}状态: ${hasDebuffDef ? '✓ 定义存在' : '✗ 定义缺失'}`);
  }
  
  // 验证装备图标多样化
  const slots = ['weapon', 'armor', 'pants', 'shoulder', 'belt', 'shoes', 'earring', 'ring', 'necklace'];
  let allSlotsGood = true;
  for (const slot of slots) {
    const slotPattern = new RegExp(`${slot}: \\[([^\\]]+)\\]`);
    const slotMatch = equipContent.match(slotPattern);
    if (slotMatch) {
      const icons = slotMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (icons.length < 10) {
        console.log(`[v5 验证] ${slot}图标: ${icons.length}/10 ✗`);
        allSlotsGood = false;
      }
    }
  }
  if (allSlotsGood) {
    console.log('[v5 验证] 所有槽位图标: ✓ 10种以上');
  }
  
  console.log('');
}

// ============================================
// 主函数
// ============================================
function runV5Optimization() {
  console.log('========================================');
  console.log('=== Game Balance Optimization v5 ===');
  console.log('========================================');
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('');
  
  try {
    console.log('--- 1. 怪物属性精细平衡 (v5) ---');
    v5OptimizeEnemyBalance();
    console.log('');
    
    console.log('--- 2. 技能数值精细平衡 (v5) ---');
    v5OptimizeSkillValues();
    console.log('');
    
    console.log('--- 3. 元素技能精细平衡 (v5) ---');
    v5OptimizeElementalSkills();
    console.log('');
    
    console.log('--- 4. 等级成长曲线优化 (v5) ---');
    v5OptimizeLevelScaling();
    console.log('');
    
    console.log('--- 5. 装备数值精细平衡 (v5) ---');
    v5OptimizeEquipmentBalance();
    console.log('');
    
    console.log('--- 6. 验证所有新增内容 ---');
    v5VerifyNewContent();
    console.log('');
    
    console.log('========================================');
    console.log('=== v5 Optimization Completed ===');
    console.log('========================================');
  } catch (error) {
    console.error('========================================');
    console.error('=== Optimization Failed ===');
    console.error('========================================');
    console.error(error);
  }
}

if (require.main === module) {
  runV5Optimization();
}

module.exports = { runV5Optimization };
