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
  console.log(`[BALANCE v6] Updated: ${filePath}`);
}

// ============================================
// 1. v6 怪物属性深度平衡
// ============================================
function v6OptimizeEnemyBalance() {
  const content = readFile(ENEMIES_FILE);
  
  // v6: 基于玩家完整成长曲线的终极平衡
  // 设计原则：
  // - 第1波：玩家基础DPS约8（攻击力8，攻速1000ms），普通怪生存2-3秒
  // - 第10波：玩家DPS约30-50，精英怪生存8-12秒
  // - 第20波：玩家DPS约100-150，BOSS生存20-30秒
  // - 第30波：玩家DPS约250-400，终极BOSS生存30-45秒
  // - HP/经验比：普通怪约5:1，精英怪约4:1，BOSS约3:1
  
  const enemyBalance = {
    // 普通怪 - 明确定位和梯度（v6微调）
    mutant: { 
      health: 15, speed: 3.8, damage: 2, exp: 3,
      note: '最基础敌人，新手训练，极低血量'
    },
    raider: { 
      health: 24, speed: 6.5, damage: 4, exp: 5,
      note: '快速敌人，第2波解锁，高移速低伤害'
    },
    spider: { 
      health: 18, speed: 8.5, damage: 3, exp: 4,
      note: '最高速敌人，第3波解锁，超脆皮'
    },
    infected: { 
      health: 48, speed: 4.8, damage: 8, exp: 10,
      note: '中等均衡敌人，第4波解锁，标准威胁'
    },
    zombie: { 
      health: 85, speed: 1.6, damage: 6, exp: 14,
      note: '慢速坦克，第5波解锁，血厚经验高'
    },
    brute: { 
      health: 120, speed: 3.2, damage: 16, exp: 25,
      note: '重装普通怪，第7波解锁，高威胁高经验'
    },
    // 精英怪 - 每5波出现，各有特色（v6增强特色）
    heavy_trooper: { 
      health: 280, speed: 3.0, damage: 22, exp: 65,
      note: '第5波精英，高防御高血量坦克型'
    },
    sniper_bot: { 
      health: 180, speed: 1.2, damage: 50, exp: 95,
      note: '第10波精英，远程高伤害脆皮'
    },
    mech_soldier: { 
      health: 480, speed: 4.8, damage: 36, exp: 125,
      note: '第15波精英，攻守兼备全能型'
    },
    // BOSS - 每10波出现，难度递增（v6大幅增强）
    war_tank: { 
      health: 1800, speed: 1.5, damage: 45, exp: 400,
      note: '第10波BOSS，火焰属性，入门级'
    },
    alien_hive: { 
      health: 3500, speed: 0.8, damage: 65, exp: 700,
      note: '第20波BOSS，毒属性，召唤流'
    },
    cyber_dragon: { 
      health: 6000, speed: 0.85, damage: 90, exp: 1800,
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
        console.log(`[BALANCE v6] ${enemy}: HP ${oldHealth}→${stats.health}, DMG ${oldDamage}→${stats.damage}, SPD ${oldSpeed}→${stats.speed}, EXP ${oldExp}→${stats.exp}`);
      }
    }
  }

  if (changed) {
    writeFile(ENEMIES_FILE, newContent);
    console.log('[BALANCE v6] Enemy balance v6 optimized');
  } else {
    console.log('[BALANCE v6] Enemy balance already v6 optimized');
  }
}

// ============================================
// 2. v6 技能数值深度平衡
// ============================================
function v6OptimizeSkillValues() {
  const content = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);

  // v6: 终极技能平衡 - 基于DPS贡献的精确数值
  // 设计原则：
  // - 每点技能点的DPS提升约3-5%（前期高，后期递减）
  // - 攻击技能：线性成长，但边际递减
  // - 攻速技能：更保守（乘算效应太强）
  // - 暴击技能：暴击率上限60%，暴伤高价值
  // - 生命/防御：生存向，前期效果明显
  
  const skillTargets = {
    // 攻击技能：每级提升递减，但总量可观
    'atk_1': { desc: '攻击力+4/级', engineVal: 4 },
    'atk_2': { desc: '攻击力+8/级', engineVal: 8 },
    'atk_3': { desc: '攻击力+15/级', engineVal: 15 },
    'atk_4': { desc: '攻击力+25/级', engineVal: 25 },
    'atk_5': { desc: '攻击力+38/级', engineVal: 38 },
    // 攻速技能：更保守（攻速是乘算，效应太强）
    'spd_1': { desc: '攻速+3%/级', engineVal: 0.03 },
    'spd_2': { desc: '攻速+5.5%/级', engineVal: 0.055 },
    'spd_3': { desc: '攻速+8%/级', engineVal: 0.08 },
    'spd_4': { desc: '攻速+12%/级', engineVal: 0.12 },
    'spd_5': { desc: '攻速+18%/级', engineVal: 0.18 },
    // 射程技能：前期价值高，后期递减
    'rng_1': { desc: '射程+25/级', engineVal: 25 },
    'rng_2': { desc: '射程+45/级', engineVal: 45 },
    'rng_3': { desc: '射程+70/级', engineVal: 70 },
    'rng_4': { desc: '射程+100/级', engineVal: 100 },
    // 暴击技能：暴击率有上限，数值更保守
    'crit_1': { desc: '暴击率+2%/级', engineVal: 2 },
    'crit_2': { desc: '暴击率+3.5%/级', engineVal: 3.5 },
    'crit_3': { desc: '暴击率+5.5%/级', engineVal: 5.5 },
    'crit_4': { desc: '暴击率+8%/级', engineVal: 8 },
    // 暴伤技能：数值可以更高（乘算区，但需要暴击率配合）
    'cdmg_1': { desc: '暴击伤害+15%/级', engineVal: 15 },
    'cdmg_2': { desc: '暴击伤害+30%/级', engineVal: 30 },
    'cdmg_3': { desc: '暴击伤害+50%/级', engineVal: 50 },
    // 生命技能：前期提升大，后期更需要百分比
    'hp_1': { desc: '最大生命+30/级', engineVal: 30 },
    'hp_2': { desc: '最大生命+60/级', engineVal: 60 },
    'hp_3': { desc: '最大生命+100/级', engineVal: 100 },
    'hp_4': { desc: '最大生命+170/级', engineVal: 170 },
    // 防御技能：减伤效果递减（边际效益）
    'def_1': { desc: '减伤+3%/级', engineVal: 3 },
    'def_2': { desc: '减伤+6%/级', engineVal: 6 },
    'def_3': { desc: '减伤+11%/级', engineVal: 11 },
    'def_4': { desc: '减伤+16%/级', engineVal: 16 },
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
      console.log(`[BALANCE v6] ${skillId} desc: "${match[2]}" → "${target.desc}"`);
    }
  }

  // 更新引擎中的技能数值
  const skillValuePatterns = [
    { id: 'atk_1', pattern: /case 'atk_1': attack \+= (\d+) \* lvl;/, val: 4, template: "case 'atk_1': attack += VAL * lvl;" },
    { id: 'atk_2', pattern: /case 'atk_2': attack \+= (\d+) \* lvl;/, val: 8, template: "case 'atk_2': attack += VAL * lvl;" },
    { id: 'atk_3', pattern: /case 'atk_3': attack \+= (\d+) \* lvl;/, val: 15, template: "case 'atk_3': attack += VAL * lvl;" },
    { id: 'atk_4', pattern: /case 'atk_4': attack \+= (\d+) \* lvl;/, val: 25, template: "case 'atk_4': attack += VAL * lvl;" },
    { id: 'atk_5', pattern: /case 'atk_5': attack \+= (\d+) \* lvl;/, val: 38, template: "case 'atk_5': attack += VAL * lvl;" },
    { id: 'spd_1', pattern: /case 'spd_1': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.03, template: "case 'spd_1': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_2', pattern: /case 'spd_2': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.055, template: "case 'spd_2': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_3', pattern: /case 'spd_3': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.08, template: "case 'spd_3': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_4', pattern: /case 'spd_4': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.12, template: "case 'spd_4': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_5', pattern: /case 'spd_5': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.18, template: "case 'spd_5': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'rng_1', pattern: /case 'rng_1': range \+= (\d+) \* lvl;/, val: 25, template: "case 'rng_1': range += VAL * lvl;" },
    { id: 'rng_2', pattern: /case 'rng_2': range \+= (\d+) \* lvl;/, val: 45, template: "case 'rng_2': range += VAL * lvl;" },
    { id: 'rng_3', pattern: /case 'rng_3': range \+= (\d+) \* lvl;/, val: 70, template: "case 'rng_3': range += VAL * lvl;" },
    { id: 'rng_4', pattern: /case 'rng_4': range \+= (\d+) \* lvl;/, val: 100, template: "case 'rng_4': range += VAL * lvl;" },
    { id: 'crit_1', pattern: /case 'crit_1': critRate \+= ([\d.]+) \* lvl;/, val: 2, template: "case 'crit_1': critRate += VAL * lvl;" },
    { id: 'crit_2', pattern: /case 'crit_2': critRate \+= ([\d.]+) \* lvl;/, val: 3.5, template: "case 'crit_2': critRate += VAL * lvl;" },
    { id: 'crit_3', pattern: /case 'crit_3': critRate \+= ([\d.]+) \* lvl;/, val: 5.5, template: "case 'crit_3': critRate += VAL * lvl;" },
    { id: 'crit_4', pattern: /case 'crit_4': critRate \+= ([\d.]+) \* lvl;/, val: 8, template: "case 'crit_4': critRate += VAL * lvl;" },
    { id: 'cdmg_1', pattern: /case 'cdmg_1': critDamage \+= (\d+) \* lvl;/, val: 15, template: "case 'cdmg_1': critDamage += VAL * lvl;" },
    { id: 'cdmg_2', pattern: /case 'cdmg_2': critDamage \+= (\d+) \* lvl;/, val: 30, template: "case 'cdmg_2': critDamage += VAL * lvl;" },
    { id: 'cdmg_3', pattern: /case 'cdmg_3': critDamage \+= (\d+) \* lvl;/, val: 50, template: "case 'cdmg_3': critDamage += VAL * lvl;" },
    { id: 'hp_1', pattern: /case 'hp_1': maxHealth \+= (\d+) \* lvl;/, val: 30, template: "case 'hp_1': maxHealth += VAL * lvl;" },
    { id: 'hp_2', pattern: /case 'hp_2': maxHealth \+= (\d+) \* lvl;/, val: 60, template: "case 'hp_2': maxHealth += VAL * lvl;" },
    { id: 'hp_3', pattern: /case 'hp_3': maxHealth \+= (\d+) \* lvl;/, val: 100, template: "case 'hp_3': maxHealth += VAL * lvl;" },
    { id: 'hp_4', pattern: /case 'hp_4': maxHealth \+= (\d+) \* lvl;/, val: 170, template: "case 'hp_4': maxHealth += VAL * lvl;" },
    { id: 'def_1', pattern: /case 'def_1': defense \+= (\d+) \* lvl;/, val: 3, template: "case 'def_1': defense += VAL * lvl;" },
    { id: 'def_2', pattern: /case 'def_2': defense \+= (\d+) \* lvl;/, val: 6, template: "case 'def_2': defense += VAL * lvl;" },
    { id: 'def_3', pattern: /case 'def_3': defense \+= (\d+) \* lvl;/, val: 11, template: "case 'def_3': defense += VAL * lvl;" },
    { id: 'def_4', pattern: /case 'def_4': defense \+= (\d+) \* lvl;/, val: 16, template: "case 'def_4': defense += VAL * lvl;" },
  ];

  for (const skill of skillValuePatterns) {
    const match = newEngineContent.match(skill.pattern);
    if (match && match[1] !== String(skill.val)) {
      const replacement = skill.template.replace('VAL', String(skill.val));
      newEngineContent = newEngineContent.replace(skill.pattern, replacement);
      engineChanged = true;
      console.log(`[BALANCE v6] ${skill.id} engine value: ${match[1]} → ${skill.val}`);
    }
  }

  if (skillsChanged) {
    writeFile(SKILLS_FILE, newSkillsContent);
    console.log('[BALANCE v6] Skill descriptions v6 optimized');
  } else {
    console.log('[BALANCE v6] Skill descriptions already v6 optimized');
  }

  if (engineChanged) {
    writeFile(ENGINE_FILE, newEngineContent);
    console.log('[BALANCE v6] Skill values in engine v6 optimized');
  } else {
    console.log('[BALANCE v6] Skill values in engine already v6 optimized');
  }
}

// ============================================
// 3. v6 元素技能数值深度平衡
// ============================================
function v6OptimizeElementalSkills() {
  const content = readFile(ENGINE_FILE);
  let newContent = content;
  let changed = false;

  // v6: 元素技能终极平衡
  // 设计原则：
  // - 灼烧：最高DOT伤害，主输出定位（约占总DPS的15-20%）
  // - 中毒：中DOT+减速，持续削弱定位
  // - 冰霜：控制为主，伤害极低（控制就是价值）
  // - 雷电：群体伤害，连锁效果（清小怪利器）
  // - 吸血：生存保障，数值保守（不能让玩家无敌）
  // - 穿透：清场能力，数值稳定

  // 灼烧技能：高概率高伤害（DOT主输出）
  const burn1Pattern = /case 'burn_1':\s*burnChance \+= (\d+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn1Match = newContent.match(burn1Pattern);
  if (burn1Match && (burn1Match[1] !== '4' || burn1Match[2] !== '6' || burn1Match[3] !== '2500')) {
    newContent = newContent.replace(
      burn1Pattern,
      `case 'burn_1':\n          burnChance += 4 * lvl;\n          burnDamage += 6 * lvl;\n          burnDuration = Math.max(burnDuration, 2500);`
    );
    changed = true;
    console.log('[BALANCE v6] burn_1 values optimized (4% chance, 6 dmg, 2.5s)');
  }

  const burn2Pattern = /case 'burn_2':\s*burnChance \+= (\d+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn2Match = newContent.match(burn2Pattern);
  if (burn2Match && (burn2Match[1] !== '7' || burn2Match[2] !== '15' || burn2Match[3] !== '4500')) {
    newContent = newContent.replace(
      burn2Pattern,
      `case 'burn_2':\n          burnChance += 7 * lvl;\n          burnDamage += 15 * lvl;\n          burnDuration = Math.max(burnDuration, 4500);`
    );
    changed = true;
    console.log('[BALANCE v6] burn_2 values optimized (7% chance, 15 dmg, 4.5s)');
  }

  // 毒素技能：中概率，持续时间长（DOT+减速）
  const poison1Pattern = /case 'poison_1':\s*poisonChance \+= (\d+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison1Match = newContent.match(poison1Pattern);
  if (poison1Match && (poison1Match[1] !== '4' || poison1Match[2] !== '5' || poison1Match[3] !== '3500')) {
    newContent = newContent.replace(
      poison1Pattern,
      `case 'poison_1':\n          poisonChance += 4 * lvl;\n          poisonDamage += 5 * lvl;\n          poisonDuration = Math.max(poisonDuration, 3500);`
    );
    changed = true;
    console.log('[BALANCE v6] poison_1 values optimized (4% chance, 5 dmg, 3.5s)');
  }

  const poison2Pattern = /case 'poison_2':\s*poisonChance \+= (\d+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison2Match = newContent.match(poison2Pattern);
  if (poison2Match && (poison2Match[1] !== '7' || poison2Match[2] !== '12' || poison2Match[3] !== '5500')) {
    newContent = newContent.replace(
      poison2Pattern,
      `case 'poison_2':\n          poisonChance += 7 * lvl;\n          poisonDamage += 12 * lvl;\n          poisonDuration = Math.max(poisonDuration, 5500);`
    );
    changed = true;
    console.log('[BALANCE v6] poison_2 values optimized (7% chance, 12 dmg, 5.5s)');
  }

  // 冰霜技能：低概率，控制强（控制定位）
  const freeze1Pattern = /case 'freeze_1':\s*freezeChance \+= (\d+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze1Match = newContent.match(freeze1Pattern);
  if (freeze1Match && (freeze1Match[1] !== '3' || freeze1Match[2] !== '40' || freeze1Match[3] !== '2000')) {
    newContent = newContent.replace(
      freeze1Pattern,
      `case 'freeze_1':\n          freezeChance += 3 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 40);\n          freezeDuration = Math.max(freezeDuration, 2000);`
    );
    changed = true;
    console.log('[BALANCE v6] freeze_1 values optimized (3% chance, 40% slow, 2s)');
  }

  const freeze2Pattern = /case 'freeze_2':\s*freezeChance \+= (\d+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze2Match = newContent.match(freeze2Pattern);
  if (freeze2Match && (freeze2Match[1] !== '5' || freeze2Match[2] !== '100' || freeze2Match[3] !== '1200')) {
    newContent = newContent.replace(
      freeze2Pattern,
      `case 'freeze_2':\n          freezeChance += 5 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 100);\n          freezeDuration = Math.max(freezeDuration, 1200);`
    );
    changed = true;
    console.log('[BALANCE v6] freeze_2 values optimized (5% chance, 100% freeze, 1.2s)');
  }

  // 雷电技能：中概率，连锁伤害（群体定位）
  const lightning1Pattern = /case 'lightning_1':\s*lightningChance \+= (\d+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning1Match = newContent.match(lightning1Pattern);
  if (lightning1Match && (lightning1Match[1] !== '4' || lightning1Match[2] !== '3' || lightning1Match[3] !== '8')) {
    newContent = newContent.replace(
      lightning1Pattern,
      `case 'lightning_1':\n          lightningChance += 4 * lvl;\n          lightningChain = Math.max(lightningChain, 3);\n          lightningDamage += 8 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v6] lightning_1 values optimized (4% chance, 3 chain, 8 dmg)');
  }

  const lightning2Pattern = /case 'lightning_2':\s*lightningChance \+= (\d+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning2Match = newContent.match(lightning2Pattern);
  if (lightning2Match && (lightning2Match[1] !== '6' || lightning2Match[2] !== '5' || lightning2Match[3] !== '16')) {
    newContent = newContent.replace(
      lightning2Pattern,
      `case 'lightning_2':\n          lightningChance += 6 * lvl;\n          lightningChain = Math.max(lightningChain, 5);\n          lightningDamage += 16 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v6] lightning_2 values optimized (6% chance, 5 chain, 16 dmg)');
  }

  // 吸血技能：数值保守（吸血过强会破坏平衡）
  const lifestealPattern = /case 'lifesteal_1':\s*lifestealPercent \+= ([\d.]+) \* lvl;/;
  const lifesteal1Match = newContent.match(lifestealPattern);
  if (lifesteal1Match && lifesteal1Match[1] !== '0.3') {
    newContent = newContent.replace(
      lifestealPattern,
      `case 'lifesteal_1':\n          lifestealPercent += 0.3 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v6] lifesteal_1 value optimized (0.3% per level)');
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
    console.log('[BALANCE v6] lifesteal_2 value optimized (1.0% per level)');
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v6] Elemental skill values v6 optimized');
  } else {
    console.log('[BALANCE v6] Elemental skill values already v6 optimized');
  }
}

// ============================================
// 4. v6 等级成长曲线和波次难度终极优化
// ============================================
function v6OptimizeLevelScaling() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // v6: 终极经验曲线 - 完美的游戏节奏
  // 1-10级：快速成长（新手期，约1-2分钟一级）
  // 10-30级：稳定增长（成长期，约3-5分钟一级）
  // 30-50级：显著放缓（成熟期，约8-12分钟一级）
  // 50级以上：极慢增长（终极期，约15-20分钟一级）
  // 新公式: 30 + Math.pow(lvl, 1.4) * 7 + lvl * 4
  const newExpFormula = '30 + Math.pow(lvl, 1.4) * 7 + lvl * 4';
  const expFormula = content.match(/this\.player\.expToNextLevel = Math\.floor\(([^;]+)\)/);
  if (expFormula) {
    const oldFormula = expFormula[1];
    if (oldFormula !== newExpFormula) {
      newContent = newContent.replace(
        /this\.player\.expToNextLevel = Math\.floor\([^;]+\)/,
        `this.player.expToNextLevel = Math.floor(${newExpFormula})`
      );
      changed = true;
      console.log(`[BALANCE v6] Exp formula: "${oldFormula}" → "${newExpFormula}"`);
    }
  }

  // 初始经验值（对应初始等级100级）
  const newInitialExp = 'expToNextLevel: Math.floor(30 + Math.pow(100, 1.4) * 7 + 100 * 4),';
  if (!content.includes(newInitialExp)) {
    const oldInitialExp = content.match(/expToNextLevel: Math\.floor\([^\n]+\),/);
    if (oldInitialExp) {
      newContent = newContent.replace(
        /expToNextLevel: Math\.floor\([^\n]+\),/,
        newInitialExp
      );
      changed = true;
      console.log('[BALANCE v6] Initial exp value updated');
    }
  }

  // 等级加成 - 每级提升全属性（进一步降低，防止后期过强）
  const levelBonus = newContent.match(/const levelBonus = Math\.max\(0, \(this\.player\.level - (\d+)\)\) \* ([\d.]+)/);
  if (levelBonus) {
    const newMult = '0.02';
    if (levelBonus[2] !== newMult) {
      newContent = newContent.replace(
        /const levelBonus = Math\.max\(0, \(this\.player\.level - \d+\)\) \* [\d.]+/,
        `const levelBonus = Math.max(0, (this.player.level - 1)) * ${newMult}`
      );
      changed = true;
      console.log(`[BALANCE v6] Level bonus multiplier: ${levelBonus[2]} → ${newMult}`);
    }
  }

  // 波次怪物属性增长 - 更平缓的曲线
  // 血量增长：1.035 → 1.032（更平缓）
  const healthMultiplier = newContent.match(/const healthMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (healthMultiplier) {
    const newPow = '1.032';
    if (healthMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const healthMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const healthMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v6] Wave health multiplier: ${healthMultiplier[1]} → ${newPow}`);
    }
  }

  // 伤害增长：1.022 → 1.02（更平缓，防止后期被秒）
  const damageMultiplier = newContent.match(/const damageMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (damageMultiplier) {
    const newPow = '1.02';
    if (damageMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const damageMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const damageMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v6] Wave damage multiplier: ${damageMultiplier[1]} → ${newPow}`);
    }
  }

  // 速度增长：0.3上限，0.003每波 → 0.25上限，0.0025每波（更可控）
  const speedMultiplier = newContent.match(/const speedMultiplier = 1 \+ Math\.min\(([\d.]+), \(wave - 1\) \* ([\d.]+)\)/);
  if (speedMultiplier) {
    const newMin = '0.25';
    const newMultVal = '0.0025';
    if (speedMultiplier[1] !== newMin || speedMultiplier[2] !== newMultVal) {
      newContent = newContent.replace(
        /const speedMultiplier = 1 \+ Math\.min\([\d.]+, \(wave - 1\) \* [\d.]+\)/,
        `const speedMultiplier = 1 + Math.min(${newMin}, (wave - 1) * ${newMultVal})`
      );
      changed = true;
      console.log(`[BALANCE v6] Wave speed multiplier: min=${speedMultiplier[1]}→${newMin}, perWave=${speedMultiplier[2]}→${newMultVal}`);
    }
  }

  // 经验增长：1.03 → 1.025（经验获取更稳定）
  const expMultiplier = newContent.match(/const expMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (expMultiplier) {
    const newPow = '1.025';
    if (expMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const expMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const expMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v6] Wave exp multiplier: ${expMultiplier[1]} → ${newPow}`);
    }
  }

  // 掉落率增长：0.008每波 → 0.006每波（更平衡）
  const dropRateIncrease = newContent.match(/config\.dropRate \+ \(wave - 1\) \* ([\d.]+)\)/);
  if (dropRateIncrease) {
    const newVal = '0.006';
    if (dropRateIncrease[1] !== newVal) {
      newContent = newContent.replace(
        /config\.dropRate \+ \(wave - 1\) \* [\d.]+\)/,
        `config.dropRate + (wave - 1) * ${newVal})`
      );
      changed = true;
      console.log(`[BALANCE v6] Drop rate per wave: ${dropRateIncrease[1]} → ${newVal}`);
    }
  }

  // 玩家基础攻击力微调
  const baseAttack = newContent.match(/attack: (\d+),/);
  if (baseAttack && baseAttack[1] !== '8') {
    newContent = newContent.replace(/attack: \d+,/, 'attack: 8,');
    changed = true;
    console.log(`[BALANCE v6] Base attack: ${baseAttack[1]} → 8`);
  }

  // 玩家基础生命值微调
  const baseMaxHealth = newContent.match(/maxHealth: (\d+),/);
  if (baseMaxHealth && baseMaxHealth[1] !== '100') {
    newContent = newContent.replace(/maxHealth: \d+,/, 'maxHealth: 100,');
    changed = true;
    console.log(`[BALANCE v6] Base maxHealth: ${baseMaxHealth[1]} → 100`);
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v6] Level scaling v6 optimized');
  } else {
    console.log('[BALANCE v6] Level scaling already v6 optimized');
  }
}

// ============================================
// 5. v6 装备数值深度平衡
// ============================================
function v6OptimizeEquipmentBalance() {
  const content = readFile(EQUIPMENT_FILE);
  
  let newContent = content;
  let changed = false;

  // 装备基础数值调整 - v6终极平衡
  const equipTemplates = [
    { slot: 'weapon', old: 'attack: 8, range: 20', new: 'attack: 6, range: 20' },
    { slot: 'armor', old: 'health: 45, defense: 4', new: 'health: 40, defense: 3' },
    { slot: 'pants', old: 'defense: 3, health: 18', new: 'defense: 2, health: 15' },
    { slot: 'shoulder', old: 'defense: 3, critRate: 1.0', new: 'defense: 2, critRate: 0.8' },
    { slot: 'belt', old: 'attackSpeed: -30, health: 15', new: 'attackSpeed: -25, health: 12' },
    { slot: 'shoes', old: 'defense: 2, attackSpeed: -6', new: 'defense: 1, attackSpeed: -5' },
    { slot: 'earring', old: 'attack: 4, critRate: 1.0', new: 'attack: 3, critRate: 0.8' },
    { slot: 'ring', old: 'attack: 5, critRate: 1.0', new: 'attack: 4, critRate: 0.8' },
    { slot: 'necklace', old: 'health: 25, critDamage: 3.0', new: 'health: 20, critDamage: 2.5' },
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
        console.log(`[BALANCE v6] ${template.slot} base stats adjusted`);
      }
    }
  }

  // 废土毁灭者套装数值平衡 - v6微调
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
      { pieces: 4, effect: '暴击伤害+40%', value: 40, stat: 'critDamage' },
      { pieces: 6, effect: '攻击附带灼烧伤害', value: 20, stat: 'burnDamage' },
    ],
  },`;
    
    if (destroyerMatch[0] !== newDestroyerSet) {
      newContent = newContent.replace(destroyerSetPattern, newDestroyerSet);
      changed = true;
      console.log('[BALANCE v6] 废土毁灭者套装数值平衡调整');
    }
  }

  // 词条基础数值调整 - v6平衡
  const affixBaseValues = [
    { type: 'attack', old: 'baseValue = isFineBonusAttack ? 3 : 6', new: 'baseValue = isFineBonusAttack ? 2 : 5' },
    { type: 'defense', old: 'baseValue = 4', new: 'baseValue = 3' },
    { type: 'health', old: 'baseValue = 25', new: 'baseValue = 20' },
    { type: 'critRate', old: 'baseValue = 2.5', new: 'baseValue = 2' },
    { type: 'critDamage', old: 'baseValue = 12', new: 'baseValue = 10' },
    { type: 'attackSpeed', old: 'baseValue = 10', new: 'baseValue = 8' },
  ];

  for (const affix of affixBaseValues) {
    if (newContent.includes(affix.old)) {
      newContent = newContent.replace(affix.old, affix.new);
      changed = true;
      console.log(`[BALANCE v6] ${affix.type} affix base value adjusted`);
    }
  }

  if (changed) {
    writeFile(EQUIPMENT_FILE, newContent);
    console.log('[BALANCE v6] Equipment balance v6 optimized');
  } else {
    console.log('[BALANCE v6] Equipment balance already v6 optimized');
  }
}

// ============================================
// 6. v6 异常状态特效系统平衡
// ============================================
function v6OptimizeDebuffEffects() {
  const content = readFile(ENGINE_FILE);
  let newContent = content;
  let changed = false;

  // v6: 异常状态数值终极平衡
  // 设计原则：
  // - DOT伤害基于攻击力百分比，确保前期有用后期不崩
  // - 控制效果有合理上限，避免无限控制
  // - 各状态有明确定位，差异化明显
  
  const debuffPattern = /private debuffEffects: Record<string, \{[^}]+\}> = \{[\s\S]*?\};/;
  const debuffMatch = newContent.match(debuffPattern);
  
  if (debuffMatch) {
    const newDebuffDef = `private debuffEffects: Record<string, { color: string; particleColor: string; damage: number; speedMultiplier: number; icon: string; name: string; description: string; damageMultiplier?: number; glowColor?: string }> = {
    burn: { color: '#FF6600', particleColor: '#FF4400', damage: 5, speedMultiplier: 1, icon: '🔥', name: '灼烧', description: '持续受到火焰伤害', glowColor: '#FF8800' },
    poison: { color: '#00FF00', particleColor: '#00CC00', damage: 4, speedMultiplier: 0.85, icon: '☠️', name: '中毒', description: '持续受到毒素伤害，移动速度降低', glowColor: '#00FF44' },
    freeze: { color: '#00CCFF', particleColor: '#0088FF', damage: 0, speedMultiplier: 0.15, icon: '❄️', name: '冰冻', description: '被冻结，几乎无法移动', glowColor: '#88EEFF' },
    lightning: { color: '#FFFF00', particleColor: '#FFFF88', damage: 6, speedMultiplier: 0.75, icon: '⚡', name: '感电', description: '持续受到雷电伤害，移动速度降低', glowColor: '#FFFFAA' },
    slow: { color: '#8888FF', particleColor: '#AAAAFF', damage: 0, speedMultiplier: 0.6, icon: '🐢', name: '减速', description: '移动速度大幅降低', glowColor: '#BBBBFF' },
    curse: { color: '#AA00AA', particleColor: '#CC00CC', damage: 2, speedMultiplier: 0.95, icon: '📜', name: '诅咒', description: '受到伤害增加25%', damageMultiplier: 1.25, glowColor: '#DD44DD' },
    stun: { color: '#FFD700', particleColor: '#FFEA00', damage: 0, speedMultiplier: 0, icon: '💫', name: '眩晕', description: '无法移动和攻击', glowColor: '#FFFF88' },
  };`;
    
    if (debuffMatch[0] !== newDebuffDef) {
      newContent = newContent.replace(debuffPattern, newDebuffDef);
      changed = true;
      console.log('[BALANCE v6] Debuff effects values optimized');
    }
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v6] Debuff effects v6 optimized');
  } else {
    console.log('[BALANCE v6] Debuff effects already v6 optimized');
  }
}

// ============================================
// 7. v6 验证所有内容完整性
// ============================================
function v6VerifyAllContent() {
  const equipContent = readFile(EQUIPMENT_FILE);
  const skillsContent = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);
  
  console.log('--- v6 验证所有内容完整性 ---');
  
  // 验证装备套装
  const hasDestroyerSet = equipContent.includes("wasteland_destroyer");
  console.log(`[v6 验证] 废土毁灭者套装: ${hasDestroyerSet ? '✓ 存在' : '✗ 缺失'}`);
  
  // 验证新道具
  const itemsToCheck = ['stun_bomb', 'lightning_bolt', 'curse_scroll'];
  for (const item of itemsToCheck) {
    const hasItem = equipContent.includes(item);
    console.log(`[v6 验证] ${item}: ${hasItem ? '✓ 定义存在' : '✗ 定义缺失'}`);
  }
  
  // 验证新技能
  const skillsToCheck = ['burn_1', 'poison_1', 'freeze_1', 'lightning_1', 'lifesteal_1', 'piercing_1'];
  for (const skill of skillsToCheck) {
    const hasSkill = skillsContent.includes(skill);
    const hasSkillImpl = engineContent.includes(`case '${skill}'`);
    console.log(`[v6 验证] ${skill}: ${hasSkill ? '✓ 定义存在' : '✗ 定义缺失'} | ${hasSkillImpl ? '✓ 实现存在' : '✗ 实现缺失'}`);
  }
  
  // 验证异常状态系统
  const debuffsToCheck = ['burn', 'poison', 'freeze', 'lightning', 'slow', 'curse', 'stun'];
  for (const debuff of debuffsToCheck) {
    const hasDebuffDef = engineContent.includes(`${debuff}: {`);
    console.log(`[v6 验证] ${debuff}状态: ${hasDebuffDef ? '✓ 定义存在' : '✗ 缺失'}`);
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
        console.log(`[v6 验证] ${slot}图标: ${icons.length}/10 ✗`);
        allSlotsGood = false;
      }
    }
  }
  if (allSlotsGood) {
    console.log('[v6 验证] 所有槽位图标: ✓ 10种以上');
  }
  
  // 输出平衡数值概览
  console.log('');
  console.log('--- v6 平衡数值概览 ---');
  
  // 计算各级经验需求
  const expLevels = [1, 5, 10, 20, 30, 50, 100];
  console.log('经验需求:');
  for (const lvl of expLevels) {
    const exp = Math.floor(30 + Math.pow(lvl, 1.4) * 7 + lvl * 4);
    console.log(`  Lv.${lvl}: ${exp} exp`);
  }
  
  // 波次怪物属性
  console.log('波次怪物属性倍率:');
  const waves = [1, 5, 10, 20, 30, 50];
  for (const wave of waves) {
    const hpMult = Math.pow(1.032, wave - 1).toFixed(2);
    const dmgMult = Math.pow(1.02, wave - 1).toFixed(2);
    const expMult = Math.pow(1.025, wave - 1).toFixed(2);
    console.log(`  第${wave}波: HP×${hpMult}, DMG×${dmgMult}, EXP×${expMult}`);
  }
  
  console.log('');
}

// ============================================
// 主函数
// ============================================
function runV6Optimization() {
  console.log('========================================');
  console.log('=== Game Balance Optimization v6 ===');
  console.log('=== 深度平衡终极优化 ===');
  console.log('========================================');
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('');
  
  try {
    console.log('--- 1. 怪物属性深度平衡 (v6) ---');
    v6OptimizeEnemyBalance();
    console.log('');
    
    console.log('--- 2. 技能数值深度平衡 (v6) ---');
    v6OptimizeSkillValues();
    console.log('');
    
    console.log('--- 3. 元素技能深度平衡 (v6) ---');
    v6OptimizeElementalSkills();
    console.log('');
    
    console.log('--- 4. 等级成长曲线终极优化 (v6) ---');
    v6OptimizeLevelScaling();
    console.log('');
    
    console.log('--- 5. 装备数值深度平衡 (v6) ---');
    v6OptimizeEquipmentBalance();
    console.log('');
    
    console.log('--- 6. 异常状态特效平衡 (v6) ---');
    v6OptimizeDebuffEffects();
    console.log('');
    
    console.log('--- 7. 验证所有内容 ---');
    v6VerifyAllContent();
    console.log('');
    
    console.log('========================================');
    console.log('=== v6 Optimization Completed ===');
    console.log('========================================');
  } catch (error) {
    console.error('========================================');
    console.error('=== Optimization Failed ===');
    console.error('========================================');
    console.error(error);
    throw error;
  }
}

if (require.main === module) {
  runV6Optimization();
}

module.exports = { runV6Optimization };
