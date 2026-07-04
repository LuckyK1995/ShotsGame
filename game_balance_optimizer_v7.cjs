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
  console.log(`[BALANCE v7] Updated: ${filePath}`);
}

// ============================================
// 1. v7 怪物属性终极平衡
// ============================================
function v7OptimizeEnemyBalance() {
  const content = readFile(ENEMIES_FILE);
  
  // v7: 基于玩家完整成长曲线的终极平衡
  // 设计原则：
  // - 第1波：玩家基础DPS约8（攻击8，攻速1000ms），普通怪生存2-3秒
  // - 第5波：玩家DPS约15-25，精英怪生存6-10秒
  // - 第10波：玩家DPS约35-60，BOSS生存15-25秒
  // - 第20波：玩家DPS约120-200，BOSS生存20-30秒
  // - 第30波：玩家DPS约300-500，终极BOSS生存25-40秒
  // - HP/经验比：普通怪约4.5:1，精英怪约3.5:1，BOSS约2.8:1
  // - 波次增长系数已在引擎中调优，这里调整基础值
  
  const enemyBalance = {
    // 普通怪 - 明确定位和梯度（v7微调）
    mutant: { 
      health: 12, speed: 3.5, damage: 2, exp: 3,
      note: '最基础敌人，新手训练，极低血量，第1波出现'
    },
    raider: { 
      health: 20, speed: 6.0, damage: 3, exp: 5,
      note: '快速敌人，第2波解锁，高移速低伤害'
    },
    spider: { 
      health: 15, speed: 8.0, damage: 2, exp: 4,
      note: '最高速敌人，第3波解锁，超脆皮，骚扰型'
    },
    infected: { 
      health: 42, speed: 4.5, damage: 6, exp: 10,
      note: '中等均衡敌人，第4波解锁，标准威胁'
    },
    zombie: { 
      health: 75, speed: 1.5, damage: 5, exp: 14,
      note: '慢速坦克，第5波解锁，血厚经验高，推进慢'
    },
    brute: { 
      health: 110, speed: 3.0, damage: 14, exp: 25,
      note: '重装普通怪，第7波解锁，高威胁高经验'
    },
    // 精英怪 - 每5波出现，各有特色（v7增强特色差异化）
    heavy_trooper: { 
      health: 250, speed: 2.8, damage: 20, exp: 60,
      note: '第5波精英，高防御高血量坦克型，移动慢'
    },
    sniper_bot: { 
      health: 160, speed: 1.0, damage: 45, exp: 90,
      note: '第10波精英，远程高伤害脆皮，几乎不动'
    },
    mech_soldier: { 
      health: 450, speed: 4.5, damage: 32, exp: 120,
      note: '第15波精英，攻守兼备全能型，综合威胁最高'
    },
    // BOSS - 每10波出现，难度递增（v7大幅调整节奏）
    war_tank: { 
      health: 1500, speed: 1.4, damage: 40, exp: 350,
      note: '第10波BOSS，火焰属性，入门级，血量适中'
    },
    alien_hive: { 
      health: 3200, speed: 0.7, damage: 60, exp: 650,
      note: '第20波BOSS，毒属性，召唤流，血厚伤害中'
    },
    cyber_dragon: { 
      health: 5500, speed: 0.8, damage: 85, exp: 1700,
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
        console.log(`[BALANCE v7] ${enemy}: HP ${oldHealth}→${stats.health}, DMG ${oldDamage}→${stats.damage}, SPD ${oldSpeed}→${stats.speed}, EXP ${oldExp}→${stats.exp}`);
      }
    }
  }

  if (changed) {
    writeFile(ENEMIES_FILE, newContent);
    console.log('[BALANCE v7] Enemy balance v7 optimized');
  } else {
    console.log('[BALANCE v7] Enemy balance already v7 optimized');
  }
}

// ============================================
// 2. v7 技能数值终极平衡 - 属性技能
// ============================================
function v7OptimizeSkillValues() {
  const content = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);

  // v7: 终极技能平衡 - 基于DPS贡献的精确数值
  // 设计原则：
  // - 每点技能点的DPS提升约2.5-4%（前期高，后期递减）
  // - 攻击技能：线性成长，但边际递减（加法区）
  // - 攻速技能：更保守（乘算效应太强，5级总提升不超过30%）
  // - 暴击技能：暴击率软上限60%，暴伤高价值但需要暴击率配合
  // - 生命/防御：生存向，前期效果明显，后期保值
  
  const skillTargets = {
    // 攻击技能：每级提升递减，但总量可观（v7微调降低）
    'atk_1': { desc: '攻击力+3/级', engineVal: 3 },
    'atk_2': { desc: '攻击力+6/级', engineVal: 6 },
    'atk_3': { desc: '攻击力+12/级', engineVal: 12 },
    'atk_4': { desc: '攻击力+20/级', engineVal: 20 },
    'atk_5': { desc: '攻击力+32/级', engineVal: 32 },
    // 攻速技能：更保守（攻速是乘算，效应太强）v7再降
    'spd_1': { desc: '攻速+2.5%/级', engineVal: 0.025 },
    'spd_2': { desc: '攻速+4.5%/级', engineVal: 0.045 },
    'spd_3': { desc: '攻速+6.5%/级', engineVal: 0.065 },
    'spd_4': { desc: '攻速+10%/级', engineVal: 0.10 },
    'spd_5': { desc: '攻速+15%/级', engineVal: 0.15 },
    // 射程技能：前期价值高，后期递减（v7微调）
    'rng_1': { desc: '射程+20/级', engineVal: 20 },
    'rng_2': { desc: '射程+35/级', engineVal: 35 },
    'rng_3': { desc: '射程+55/级', engineVal: 55 },
    'rng_4': { desc: '射程+85/级', engineVal: 85 },
    // 暴击技能：暴击率有上限，数值更保守（v7降低）
    'crit_1': { desc: '暴击率+1.5%/级', engineVal: 1.5 },
    'crit_2': { desc: '暴击率+3%/级', engineVal: 3 },
    'crit_3': { desc: '暴击率+4.5%/级', engineVal: 4.5 },
    'crit_4': { desc: '暴击率+7%/级', engineVal: 7 },
    // 暴伤技能：数值可以更高（乘算区，但需要暴击率配合）v7微调
    'cdmg_1': { desc: '暴击伤害+12%/级', engineVal: 12 },
    'cdmg_2': { desc: '暴击伤害+25%/级', engineVal: 25 },
    'cdmg_3': { desc: '暴击伤害+42%/级', engineVal: 42 },
    // 生命技能：前期提升大，后期更需要百分比（v7降低）
    'hp_1': { desc: '最大生命+25/级', engineVal: 25 },
    'hp_2': { desc: '最大生命+50/级', engineVal: 50 },
    'hp_3': { desc: '最大生命+85/级', engineVal: 85 },
    'hp_4': { desc: '最大生命+145/级', engineVal: 145 },
    // 防御技能：减伤效果递减（边际效益）v7微调
    'def_1': { desc: '减伤+2.5%/级', engineVal: 2.5 },
    'def_2': { desc: '减伤+5%/级', engineVal: 5 },
    'def_3': { desc: '减伤+9%/级', engineVal: 9 },
    'def_4': { desc: '减伤+14%/级', engineVal: 14 },
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
      console.log(`[BALANCE v7] ${skillId} desc: "${match[2]}" → "${target.desc}"`);
    }
  }

  // 更新引擎中的技能数值
  const skillValuePatterns = [
    { id: 'atk_1', pattern: /case 'atk_1': attack \+= (\d+) \* lvl;/, val: 3, template: "case 'atk_1': attack += VAL * lvl;" },
    { id: 'atk_2', pattern: /case 'atk_2': attack \+= (\d+) \* lvl;/, val: 6, template: "case 'atk_2': attack += VAL * lvl;" },
    { id: 'atk_3', pattern: /case 'atk_3': attack \+= (\d+) \* lvl;/, val: 12, template: "case 'atk_3': attack += VAL * lvl;" },
    { id: 'atk_4', pattern: /case 'atk_4': attack \+= (\d+) \* lvl;/, val: 20, template: "case 'atk_4': attack += VAL * lvl;" },
    { id: 'atk_5', pattern: /case 'atk_5': attack \+= (\d+) \* lvl;/, val: 32, template: "case 'atk_5': attack += VAL * lvl;" },
    { id: 'spd_1', pattern: /case 'spd_1': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.025, template: "case 'spd_1': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_2', pattern: /case 'spd_2': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.045, template: "case 'spd_2': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_3', pattern: /case 'spd_3': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.065, template: "case 'spd_3': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_4', pattern: /case 'spd_4': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.10, template: "case 'spd_4': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_5', pattern: /case 'spd_5': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.15, template: "case 'spd_5': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'rng_1', pattern: /case 'rng_1': range \+= (\d+) \* lvl;/, val: 20, template: "case 'rng_1': range += VAL * lvl;" },
    { id: 'rng_2', pattern: /case 'rng_2': range \+= (\d+) \* lvl;/, val: 35, template: "case 'rng_2': range += VAL * lvl;" },
    { id: 'rng_3', pattern: /case 'rng_3': range \+= (\d+) \* lvl;/, val: 55, template: "case 'rng_3': range += VAL * lvl;" },
    { id: 'rng_4', pattern: /case 'rng_4': range \+= (\d+) \* lvl;/, val: 85, template: "case 'rng_4': range += VAL * lvl;" },
    { id: 'crit_1', pattern: /case 'crit_1': critRate \+= ([\d.]+) \* lvl;/, val: 1.5, template: "case 'crit_1': critRate += VAL * lvl;" },
    { id: 'crit_2', pattern: /case 'crit_2': critRate \+= ([\d.]+) \* lvl;/, val: 3, template: "case 'crit_2': critRate += VAL * lvl;" },
    { id: 'crit_3', pattern: /case 'crit_3': critRate \+= ([\d.]+) \* lvl;/, val: 4.5, template: "case 'crit_3': critRate += VAL * lvl;" },
    { id: 'crit_4', pattern: /case 'crit_4': critRate \+= ([\d.]+) \* lvl;/, val: 7, template: "case 'crit_4': critRate += VAL * lvl;" },
    { id: 'cdmg_1', pattern: /case 'cdmg_1': critDamage \+= (\d+) \* lvl;/, val: 12, template: "case 'cdmg_1': critDamage += VAL * lvl;" },
    { id: 'cdmg_2', pattern: /case 'cdmg_2': critDamage \+= (\d+) \* lvl;/, val: 25, template: "case 'cdmg_2': critDamage += VAL * lvl;" },
    { id: 'cdmg_3', pattern: /case 'cdmg_3': critDamage \+= (\d+) \* lvl;/, val: 42, template: "case 'cdmg_3': critDamage += VAL * lvl;" },
    { id: 'hp_1', pattern: /case 'hp_1': maxHealth \+= (\d+) \* lvl;/, val: 25, template: "case 'hp_1': maxHealth += VAL * lvl;" },
    { id: 'hp_2', pattern: /case 'hp_2': maxHealth \+= (\d+) \* lvl;/, val: 50, template: "case 'hp_2': maxHealth += VAL * lvl;" },
    { id: 'hp_3', pattern: /case 'hp_3': maxHealth \+= (\d+) \* lvl;/, val: 85, template: "case 'hp_3': maxHealth += VAL * lvl;" },
    { id: 'hp_4', pattern: /case 'hp_4': maxHealth \+= (\d+) \* lvl;/, val: 145, template: "case 'hp_4': maxHealth += VAL * lvl;" },
    { id: 'def_1', pattern: /case 'def_1': defense \+= ([\d.]+) \* lvl;/, val: 2.5, template: "case 'def_1': defense += VAL * lvl;" },
    { id: 'def_2', pattern: /case 'def_2': defense \+= ([\d.]+) \* lvl;/, val: 5, template: "case 'def_2': defense += VAL * lvl;" },
    { id: 'def_3', pattern: /case 'def_3': defense \+= ([\d.]+) \* lvl;/, val: 9, template: "case 'def_3': defense += VAL * lvl;" },
    { id: 'def_4', pattern: /case 'def_4': defense \+= ([\d.]+) \* lvl;/, val: 14, template: "case 'def_4': defense += VAL * lvl;" },
  ];

  for (const skill of skillValuePatterns) {
    const match = newEngineContent.match(skill.pattern);
    if (match && match[1] !== String(skill.val)) {
      const replacement = skill.template.replace('VAL', String(skill.val));
      newEngineContent = newEngineContent.replace(skill.pattern, replacement);
      engineChanged = true;
      console.log(`[BALANCE v7] ${skill.id} engine value: ${match[1]} → ${skill.val}`);
    }
  }

  if (skillsChanged) {
    writeFile(SKILLS_FILE, newSkillsContent);
    console.log('[BALANCE v7] Skill descriptions v7 optimized');
  } else {
    console.log('[BALANCE v7] Skill descriptions already v7 optimized');
  }

  if (engineChanged) {
    writeFile(ENGINE_FILE, newEngineContent);
    console.log('[BALANCE v7] Skill values in engine v7 optimized');
  } else {
    console.log('[BALANCE v7] Skill values in engine already v7 optimized');
  }
}

// ============================================
// 3. v7 元素/异常技能数值终极平衡
// ============================================
function v7OptimizeElementalSkills() {
  const content = readFile(ENGINE_FILE);
  let newContent = content;
  let changed = false;

  // v7: 元素技能终极平衡
  // 设计原则：
  // - 灼烧：主DOT输出（占总DPS的12-18%），高概率中伤害
  // - 中毒：DOT+减速，持续削弱，中概率低伤害但持续久
  // - 冰霜：控制为主，伤害极低（控制就是价值），低概率高控制
  // - 雷电：群体伤害，连锁效果（清小怪利器），中概率中伤害
  // - 吸血：生存保障，数值保守（不能让玩家无敌）
  // - 穿透：清场能力，数值稳定

  // 灼烧技能：v7微调 - 降低概率提升伤害，保持总DPS不变但更稳定
  const burn1Pattern = /case 'burn_1':\s*burnChance \+= (\d+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn1Match = newContent.match(burn1Pattern);
  if (burn1Match && (burn1Match[1] !== '3' || burn1Match[2] !== '8' || burn1Match[3] !== '3000')) {
    newContent = newContent.replace(
      burn1Pattern,
      `case 'burn_1':\n          burnChance += 3 * lvl;\n          burnDamage += 8 * lvl;\n          burnDuration = Math.max(burnDuration, 3000);`
    );
    changed = true;
    console.log('[BALANCE v7] burn_1 values optimized (3% chance, 8 dmg, 3s)');
  }

  const burn2Pattern = /case 'burn_2':\s*burnChance \+= (\d+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn2Match = newContent.match(burn2Pattern);
  if (burn2Match && (burn2Match[1] !== '5' || burn2Match[2] !== '20' || burn2Match[3] !== '5000')) {
    newContent = newContent.replace(
      burn2Pattern,
      `case 'burn_2':\n          burnChance += 5 * lvl;\n          burnDamage += 20 * lvl;\n          burnDuration = Math.max(burnDuration, 5000);`
    );
    changed = true;
    console.log('[BALANCE v7] burn_2 values optimized (5% chance, 20 dmg, 5s)');
  }

  // 毒素技能：v7微调 - 增加持续时间，降低瞬时伤害
  const poison1Pattern = /case 'poison_1':\s*poisonChance \+= (\d+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison1Match = newContent.match(poison1Pattern);
  if (poison1Match && (poison1Match[1] !== '3' || poison1Match[2] !== '6' || poison1Match[3] !== '4000')) {
    newContent = newContent.replace(
      poison1Pattern,
      `case 'poison_1':\n          poisonChance += 3 * lvl;\n          poisonDamage += 6 * lvl;\n          poisonDuration = Math.max(poisonDuration, 4000);`
    );
    changed = true;
    console.log('[BALANCE v7] poison_1 values optimized (3% chance, 6 dmg, 4s)');
  }

  const poison2Pattern = /case 'poison_2':\s*poisonChance \+= (\d+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison2Match = newContent.match(poison2Pattern);
  if (poison2Match && (poison2Match[1] !== '5' || poison2Match[2] !== '15' || poison2Match[3] !== '6000')) {
    newContent = newContent.replace(
      poison2Pattern,
      `case 'poison_2':\n          poisonChance += 5 * lvl;\n          poisonDamage += 15 * lvl;\n          poisonDuration = Math.max(poisonDuration, 6000);`
    );
    changed = true;
    console.log('[BALANCE v7] poison_2 values optimized (5% chance, 15 dmg, 6s)');
  }

  // 冰霜技能：v7微调 - 降低概率，提升控制强度
  const freeze1Pattern = /case 'freeze_1':\s*freezeChance \+= (\d+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze1Match = newContent.match(freeze1Pattern);
  if (freeze1Match && (freeze1Match[1] !== '2.5' || freeze1Match[2] !== '50' || freeze1Match[3] !== '2500')) {
    newContent = newContent.replace(
      freeze1Pattern,
      `case 'freeze_1':\n          freezeChance += 2.5 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 50);\n          freezeDuration = Math.max(freezeDuration, 2500);`
    );
    changed = true;
    console.log('[BALANCE v7] freeze_1 values optimized (2.5% chance, 50% slow, 2.5s)');
  }

  const freeze2Pattern = /case 'freeze_2':\s*freezeChance \+= (\d+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze2Match = newContent.match(freeze2Pattern);
  if (freeze2Match && (freeze2Match[1] !== '4' || freeze2Match[2] !== '100' || freeze2Match[3] !== '1500')) {
    newContent = newContent.replace(
      freeze2Pattern,
      `case 'freeze_2':\n          freezeChance += 4 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 100);\n          freezeDuration = Math.max(freezeDuration, 1500);`
    );
    changed = true;
    console.log('[BALANCE v7] freeze_2 values optimized (4% chance, 100% freeze, 1.5s)');
  }

  // 雷电技能：v7微调 - 降低连锁数量，提升单次伤害
  const lightning1Pattern = /case 'lightning_1':\s*lightningChance \+= (\d+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning1Match = newContent.match(lightning1Pattern);
  if (lightning1Match && (lightning1Match[1] !== '3' || lightning1Match[2] !== '2' || lightning1Match[3] !== '12')) {
    newContent = newContent.replace(
      lightning1Pattern,
      `case 'lightning_1':\n          lightningChance += 3 * lvl;\n          lightningChain = Math.max(lightningChain, 2);\n          lightningDamage += 12 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v7] lightning_1 values optimized (3% chance, 2 chain, 12 dmg)');
  }

  const lightning2Pattern = /case 'lightning_2':\s*lightningChance \+= (\d+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning2Match = newContent.match(lightning2Pattern);
  if (lightning2Match && (lightning2Match[1] !== '5' || lightning2Match[2] !== '4' || lightning2Match[3] !== '22')) {
    newContent = newContent.replace(
      lightning2Pattern,
      `case 'lightning_2':\n          lightningChance += 5 * lvl;\n          lightningChain = Math.max(lightningChain, 4);\n          lightningDamage += 22 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v7] lightning_2 values optimized (5% chance, 4 chain, 22 dmg)');
  }

  // 吸血技能：v7再降 - 吸血过强会破坏平衡
  const lifestealPattern = /case 'lifesteal_1':\s*lifestealPercent \+= ([\d.]+) \* lvl;/;
  const lifesteal1Match = newContent.match(lifestealPattern);
  if (lifesteal1Match && lifesteal1Match[1] !== '0.25') {
    newContent = newContent.replace(
      lifestealPattern,
      `case 'lifesteal_1':\n          lifestealPercent += 0.25 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v7] lifesteal_1 value optimized (0.25% per level)');
  }

  // lifesteal_2：需要精确匹配第二个
  const allLifestealMatches = [...newContent.matchAll(/case 'lifesteal_(\d+)':\s*lifestealPercent \+= ([\d.]+) \* lvl;/g)];
  if (allLifestealMatches.length >= 2 && allLifestealMatches[1][2] !== '0.8') {
    let count = 0;
    newContent = newContent.replace(
      /case 'lifesteal_\d+':\s*lifestealPercent \+= [\d.]+ \* lvl;/g,
      (match) => {
        count++;
        if (count === 2) {
          return `case 'lifesteal_2':\n          lifestealPercent += 0.8 * lvl;`;
        }
        return match;
      }
    );
    changed = true;
    console.log('[BALANCE v7] lifesteal_2 value optimized (0.8% per level)');
  }

  // 更新技能描述中的数值同步
  const skillsContent = readFile(SKILLS_FILE);
  let newSkillsContent = skillsContent;
  let skillsChanged = false;

  const skillDescUpdates = {
    'burn_1': '攻击有3%概率使敌人灼烧3秒',
    'burn_2': '攻击有5%概率使敌人灼烧5秒，伤害翻倍',
    'poison_1': '攻击有3%概率使敌人中毒4秒',
    'poison_2': '攻击有5%概率使敌人中毒6秒，伤害翻倍',
    'freeze_1': '攻击有2.5%概率减缓敌人50%速度2.5秒',
    'freeze_2': '攻击有4%概率冻结敌人1.5秒',
    'lightning_1': '攻击有3%概率触发感电，伤害链2个敌人',
    'lightning_2': '攻击有5%概率触发感电，伤害链4个敌人',
    'lifesteal_1': '攻击回复0.25%最大生命',
    'lifesteal_2': '攻击回复0.8%最大生命',
  };

  for (const [skillId, newDesc] of Object.entries(skillDescUpdates)) {
    const regex = new RegExp(`(createSkill\\('${skillId}',[^,]+,[^,]+,\\s*')([^']+)(')`);
    const match = newSkillsContent.match(regex);
    if (match && match[2] !== newDesc) {
      newSkillsContent = newSkillsContent.replace(match[0], match[1] + newDesc + match[3]);
      skillsChanged = true;
      console.log(`[BALANCE v7] ${skillId} desc updated`);
    }
  }

  if (skillsChanged) {
    writeFile(SKILLS_FILE, newSkillsContent);
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v7] Elemental skill values v7 optimized');
  } else {
    console.log('[BALANCE v7] Elemental skill values already v7 optimized');
  }
}

// ============================================
// 4. v7 等级成长曲线和波次难度终极优化
// ============================================
function v7OptimizeLevelScaling() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // v7: 终极经验曲线 - 更平滑的游戏节奏
  // 1-10级：快速成长（新手期，约1-2分钟一级）
  // 10-25级：稳定增长（成长期，约3-5分钟一级）
  // 25-50级：显著放缓（成熟期，约8-12分钟一级）
  // 50级以上：极慢增长（终极期，约15-20分钟一级）
  // 新公式: 25 + Math.pow(lvl, 1.45) * 6 + lvl * 3
  const newExpFormula = '25 + Math.pow(lvl, 1.45) * 6 + lvl * 3';
  const expFormula = content.match(/this\.player\.expToNextLevel = Math\.floor\(([^;]+)\)/);
  if (expFormula) {
    const oldFormula = expFormula[1];
    if (oldFormula !== newExpFormula) {
      newContent = newContent.replace(
        /this\.player\.expToNextLevel = Math\.floor\([^;]+\)/,
        `this.player.expToNextLevel = Math.floor(${newExpFormula})`
      );
      changed = true;
      console.log(`[BALANCE v7] Exp formula: "${oldFormula}" → "${newExpFormula}"`);
    }
  }

  // 初始经验值（对应初始等级100级）
  const newInitialExp = 'expToNextLevel: Math.floor(25 + Math.pow(100, 1.45) * 6 + 100 * 3),';
  if (!content.includes(newInitialExp)) {
    const oldInitialExp = content.match(/expToNextLevel: Math\.floor\([^\n]+\),/);
    if (oldInitialExp) {
      newContent = newContent.replace(
        /expToNextLevel: Math\.floor\([^\n]+\),/,
        newInitialExp
      );
      changed = true;
      console.log('[BALANCE v7] Initial exp value updated');
    }
  }

  // 等级加成 - 每级提升全属性（v7再降低，防止后期过强）
  const levelBonus = newContent.match(/const levelBonus = Math\.max\(0, \(this\.player\.level - (\d+)\)\) \* ([\d.]+)/);
  if (levelBonus) {
    const newMult = '0.015';
    if (levelBonus[2] !== newMult) {
      newContent = newContent.replace(
        /const levelBonus = Math\.max\(0, \(this\.player\.level - \d+\)\) \* [\d.]+/,
        `const levelBonus = Math.max(0, (this.player.level - 1)) * ${newMult}`
      );
      changed = true;
      console.log(`[BALANCE v7] Level bonus multiplier: ${levelBonus[2]} → ${newMult}`);
    }
  }

  // 波次怪物属性增长 - 更平缓的曲线（v7微调）
  // 血量增长：1.032 → 1.03（更平缓）
  const healthMultiplier = newContent.match(/const healthMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (healthMultiplier) {
    const newPow = '1.03';
    if (healthMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const healthMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const healthMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v7] Wave health multiplier: ${healthMultiplier[1]} → ${newPow}`);
    }
  }

  // 伤害增长：1.02 → 1.018（更平缓，防止后期被秒）
  const damageMultiplier = newContent.match(/const damageMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (damageMultiplier) {
    const newPow = '1.018';
    if (damageMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const damageMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const damageMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v7] Wave damage multiplier: ${damageMultiplier[1]} → ${newPow}`);
    }
  }

  // 速度增长：0.25上限，0.0025每波 → 0.2上限，0.002每波（更可控）
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
      console.log(`[BALANCE v7] Wave speed multiplier: min=${speedMultiplier[1]}→${newMin}, perWave=${speedMultiplier[2]}→${newMultVal}`);
    }
  }

  // 经验增长：1.025 → 1.022（经验获取更稳定）
  const expMultiplier = newContent.match(/const expMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (expMultiplier) {
    const newPow = '1.022';
    if (expMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const expMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const expMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v7] Wave exp multiplier: ${expMultiplier[1]} → ${newPow}`);
    }
  }

  // 掉落率增长：0.006每波 → 0.005每波（更平衡）
  const dropRateIncrease = newContent.match(/config\.dropRate \+ \(wave - 1\) \* ([\d.]+)\)/);
  if (dropRateIncrease) {
    const newVal = '0.005';
    if (dropRateIncrease[1] !== newVal) {
      newContent = newContent.replace(
        /config\.dropRate \+ \(wave - 1\) \* [\d.]+\)/,
        `config.dropRate + (wave - 1) * ${newVal})`
      );
      changed = true;
      console.log(`[BALANCE v7] Drop rate per wave: ${dropRateIncrease[1]} → ${newVal}`);
    }
  }

  // 玩家基础攻击力微调
  const baseAttack = newContent.match(/attack: (\d+),/);
  if (baseAttack && baseAttack[1] !== '8') {
    newContent = newContent.replace(/attack: \d+,/, 'attack: 8,');
    changed = true;
    console.log(`[BALANCE v7] Base attack: ${baseAttack[1]} → 8`);
  }

  // 玩家基础生命值微调
  const baseMaxHealth = newContent.match(/maxHealth: (\d+),/);
  if (baseMaxHealth && baseMaxHealth[1] !== '100') {
    newContent = newContent.replace(/maxHealth: \d+,/, 'maxHealth: 100,');
    changed = true;
    console.log(`[BALANCE v7] Base maxHealth: ${baseMaxHealth[1]} → 100`);
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v7] Level scaling v7 optimized');
  } else {
    console.log('[BALANCE v7] Level scaling already v7 optimized');
  }
}

// ============================================
// 5. v7 装备数值终极平衡
// ============================================
function v7OptimizeEquipmentBalance() {
  const content = readFile(EQUIPMENT_FILE);
  
  let newContent = content;
  let changed = false;

  // 装备基础数值调整 - v7终极平衡（整体下调，让技能更重要）
  const equipTemplates = [
    { slot: 'weapon', old: 'attack: 6, range: 20', new: 'attack: 5, range: 20' },
    { slot: 'armor', old: 'health: 40, defense: 3', new: 'health: 35, defense: 2.5' },
    { slot: 'pants', old: 'defense: 2, health: 15', new: 'defense: 1.5, health: 12' },
    { slot: 'shoulder', old: 'defense: 2, critRate: 0.8', new: 'defense: 1.5, critRate: 0.6' },
    { slot: 'belt', old: 'attackSpeed: -25, health: 12', new: 'attackSpeed: -20, health: 10' },
    { slot: 'shoes', old: 'defense: 1, attackSpeed: -5', new: 'defense: 1, attackSpeed: -4' },
    { slot: 'earring', old: 'attack: 4, critRate: 0.8', new: 'attack: 3, critRate: 0.6' },
    { slot: 'ring', old: 'attack: 6, critRate: 1.5', new: 'attack: 5, critRate: 1.2' },
    { slot: 'necklace', old: 'health: 20, critDamage: 2.5', new: 'health: 18, critDamage: 2' },
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
        console.log(`[BALANCE v7] ${template.slot} base stats adjusted`);
      }
    }
  }

  // 词条基础数值调整 - v7平衡（整体下调15-20%）
  const affixBaseValues = [
    { type: 'attack', old: 'baseValue = isFineBonusAttack ? 2 : 5', new: 'baseValue = isFineBonusAttack ? 1.5 : 4' },
    { type: 'defense', old: 'baseValue = 3', new: 'baseValue = 2.5' },
    { type: 'health', old: 'baseValue = 20', new: 'baseValue = 16' },
    { type: 'critRate', old: 'baseValue = 2', new: 'baseValue = 1.5' },
    { type: 'critDamage', old: 'baseValue = 8', new: 'baseValue = 6' },
    { type: 'attackSpeed', old: 'baseValue = 10', new: 'baseValue = 7' },
    { type: 'range', old: 'baseValue = 12', new: 'baseValue = 10' },
    { type: 'elementalDamage', old: 'baseValue = 18', new: 'baseValue = 14' },
  ];

  for (const affix of affixBaseValues) {
    if (newContent.includes(affix.old)) {
      newContent = newContent.replace(affix.old, affix.new);
      changed = true;
      console.log(`[BALANCE v7] ${affix.type} affix base value adjusted`);
    }
  }

  if (changed) {
    writeFile(EQUIPMENT_FILE, newContent);
    console.log('[BALANCE v7] Equipment balance v7 optimized');
  } else {
    console.log('[BALANCE v7] Equipment balance already v7 optimized');
  }
}

// ============================================
// 6. v7 异常状态特效系统平衡
// ============================================
function v7OptimizeDebuffEffects() {
  const content = readFile(ENGINE_FILE);
  let newContent = content;
  let changed = false;

  // v7: 异常状态数值终极平衡
  // 设计原则：
  // - DOT伤害基于基础值，实际伤害由技能/装备加成决定
  // - 控制效果有合理上限，避免无限控制
  // - 各状态有明确定位，差异化明显
  // - 基础值是基准，技能和装备提供加成
  
  const debuffPattern = /private debuffEffects: Record<string, \{[^}]+\}> = \{[\s\S]*?\};/;
  const debuffMatch = newContent.match(debuffPattern);
  
  if (debuffMatch) {
    const newDebuffDef = `private debuffEffects: Record<string, { color: string; particleColor: string; damage: number; speedMultiplier: number; icon: string; name: string; description: string; damageMultiplier?: number; glowColor?: string; tickInterval?: number }> = {
    burn: { color: '#FF6600', particleColor: '#FF4400', damage: 5, speedMultiplier: 1, icon: '🔥', name: '灼烧', description: '持续受到火焰伤害', glowColor: '#FF8800', tickInterval: 500 },
    poison: { color: '#00FF00', particleColor: '#00CC00', damage: 4, speedMultiplier: 0.8, icon: '☠️', name: '中毒', description: '持续受到毒素伤害，移动速度降低', glowColor: '#00FF44', tickInterval: 600 },
    freeze: { color: '#00CCFF', particleColor: '#0088FF', damage: 0, speedMultiplier: 0.1, icon: '❄️', name: '冰冻', description: '被冻结，几乎无法移动', glowColor: '#88EEFF' },
    lightning: { color: '#FFFF00', particleColor: '#FFFF88', damage: 6, speedMultiplier: 0.7, icon: '⚡', name: '感电', description: '持续受到雷电伤害，移动速度降低', glowColor: '#FFFFAA', tickInterval: 400 },
    slow: { color: '#8888FF', particleColor: '#AAAAFF', damage: 0, speedMultiplier: 0.5, icon: '🐢', name: '减速', description: '移动速度大幅降低', glowColor: '#BBBBFF' },
    curse: { color: '#AA00AA', particleColor: '#CC00CC', damage: 2, speedMultiplier: 0.95, icon: '📜', name: '诅咒', description: '受到伤害增加30%', damageMultiplier: 1.3, glowColor: '#DD44DD', tickInterval: 800 },
    stun: { color: '#FFD700', particleColor: '#FFEA00', damage: 0, speedMultiplier: 0, icon: '💫', name: '眩晕', description: '无法移动和攻击', glowColor: '#FFFF88' },
  };`;
    
    if (debuffMatch[0] !== newDebuffDef) {
      newContent = newContent.replace(debuffPattern, newDebuffDef);
      changed = true;
      console.log('[BALANCE v7] Debuff effects values optimized');
    }
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v7] Debuff effects v7 optimized');
  } else {
    console.log('[BALANCE v7] Debuff effects already v7 optimized');
  }
}

// ============================================
// 7. v7 验证所有内容完整性
// ============================================
function v7VerifyAllContent() {
  const equipContent = readFile(EQUIPMENT_FILE);
  const skillsContent = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);
  
  console.log('');
  console.log('--- v7 验证所有内容完整性 ---');
  
  // 验证装备套装
  const hasDestroyerSet = equipContent.includes("wasteland_destroyer");
  console.log(`[v7 验证] 废土毁灭者套装: ${hasDestroyerSet ? '✓ 存在' : '✗ 缺失'}`);
  
  // 验证新道具
  const itemsToCheck = ['stun_bomb', 'lightning_bolt', 'curse_scroll'];
  for (const item of itemsToCheck) {
    const hasItem = equipContent.includes(item);
    console.log(`[v7 验证] ${item}: ${hasItem ? '✓ 定义存在' : '✗ 定义缺失'}`);
  }
  
  // 验证新技能
  const skillsToCheck = ['burn_1', 'poison_1', 'freeze_1', 'lightning_1', 'lifesteal_1', 'piercing_1'];
  for (const skill of skillsToCheck) {
    const hasSkill = skillsContent.includes(skill);
    const hasSkillImpl = engineContent.includes(`case '${skill}'`);
    console.log(`[v7 验证] ${skill}: ${hasSkill ? '✓ 定义存在' : '✗ 定义缺失'} | ${hasSkillImpl ? '✓ 实现存在' : '✗ 实现缺失'}`);
  }
  
  // 验证异常状态系统
  const debuffsToCheck = ['burn', 'poison', 'freeze', 'lightning', 'slow', 'curse', 'stun'];
  for (const debuff of debuffsToCheck) {
    const hasDebuffDef = engineContent.includes(`${debuff}: {`);
    console.log(`[v7 验证] ${debuff}状态: ${hasDebuffDef ? '✓ 定义存在' : '✗ 缺失'}`);
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
        console.log(`[v7 验证] ${slot}图标: ${icons.length}/10 ✗`);
        allSlotsGood = false;
      }
    }
  }
  if (allSlotsGood) {
    console.log('[v7 验证] 所有槽位图标: ✓ 10种以上');
  }
  
  // 输出v7平衡数值概览
  console.log('');
  console.log('--- v7 平衡数值概览 ---');
  
  // 计算各级经验需求
  const expLevels = [1, 5, 10, 20, 30, 50, 100];
  console.log('经验需求:');
  for (const lvl of expLevels) {
    const exp = Math.floor(25 + Math.pow(lvl, 1.45) * 6 + lvl * 3);
    console.log(`  Lv.${lvl}: ${exp} exp`);
  }
  
  // 波次怪物属性
  console.log('波次怪物属性倍率:');
  const waves = [1, 5, 10, 20, 30, 50];
  for (const wave of waves) {
    const hpMult = Math.pow(1.03, wave - 1).toFixed(2);
    const dmgMult = Math.pow(1.018, wave - 1).toFixed(2);
    const expMult = Math.pow(1.022, wave - 1).toFixed(2);
    console.log(`  第${wave}波: HP×${hpMult}, DMG×${dmgMult}, EXP×${expMult}`);
  }
  
  // 5级满技能玩家属性估算
  console.log('');
  console.log('满5级基础技能玩家属性估算（不含装备）:');
  const atkTotal = 8 + (3+6+12+20+32)*5; // 基础8 + 各技能5级
  const spdTotal = Math.floor(1000 * (1 - (0.025+0.045+0.065+0.10+0.15)*5));
  const hpTotal = 100 + (25+50+85+145)*5;
  const critTotal = (1.5+3+4.5+7)*5;
  console.log(`  攻击力: ${atkTotal} (基础8 + 技能${(3+6+12+20+32)*5})`);
  console.log(`  攻击间隔: ${spdTotal}ms`);
  console.log(`  最大生命: ${hpTotal}`);
  console.log(`  暴击率: ${critTotal.toFixed(1)}%`);
  
  console.log('');
}

// ============================================
// 主函数
// ============================================
function runV7Optimization() {
  console.log('========================================');
  console.log('=== Game Balance Optimization v7 ===');
  console.log('=== 终极平衡深度优化 ===');
  console.log('========================================');
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('');
  
  try {
    console.log('--- 1. 怪物属性终极平衡 (v7) ---');
    v7OptimizeEnemyBalance();
    console.log('');
    
    console.log('--- 2. 属性技能数值终极平衡 (v7) ---');
    v7OptimizeSkillValues();
    console.log('');
    
    console.log('--- 3. 元素技能终极平衡 (v7) ---');
    v7OptimizeElementalSkills();
    console.log('');
    
    console.log('--- 4. 等级成长曲线终极优化 (v7) ---');
    v7OptimizeLevelScaling();
    console.log('');
    
    console.log('--- 5. 装备数值终极平衡 (v7) ---');
    v7OptimizeEquipmentBalance();
    console.log('');
    
    console.log('--- 6. 异常状态特效平衡 (v7) ---');
    v7OptimizeDebuffEffects();
    console.log('');
    
    console.log('--- 7. 验证所有内容 ---');
    v7VerifyAllContent();
    
    console.log('========================================');
    console.log('=== v7 Optimization Completed ===');
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
  runV7Optimization();
}

module.exports = { runV7Optimization };
