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
  console.log(`[BALANCE v8] Updated: ${filePath}`);
}

// ============================================
// 1. v8 怪物属性深度平衡
// ============================================
function v8OptimizeEnemyBalance() {
  const content = readFile(ENEMIES_FILE);
  
  // v8: 基于实际游戏节奏的深度平衡
  // 设计原则：
  // - 前期（1-10波）：让玩家体验成长，难度温和递增
  // - 中期（11-25波）：难度显著提升，需要装备和技能配合
  // - 后期（26-50波）：高难度，需要完整build
  // - 精英/BOSS：有明显的挑战性，但可战胜
  // - HP/经验比：普通怪约4:1，精英怪约3.2:1，BOSS约2.5:1
  
  const enemyBalance = {
    // 普通怪 - 更清晰的定位和梯度
    mutant: { 
      health: 10, speed: 3.2, damage: 2, exp: 3,
      note: '最基础敌人，新手训练，极低血量，第1波出现'
    },
    raider: { 
      health: 18, speed: 5.5, damage: 3, exp: 5,
      note: '快速敌人，第2波解锁，高移速低伤害'
    },
    spider: { 
      health: 12, speed: 7.5, damage: 2, exp: 4,
      note: '最高速敌人，第3波解锁，超脆皮，骚扰型'
    },
    infected: { 
      health: 38, speed: 4.2, damage: 5, exp: 9,
      note: '中等均衡敌人，第4波解锁，标准威胁'
    },
    zombie: { 
      health: 65, speed: 1.3, damage: 4, exp: 13,
      note: '慢速坦克，第5波解锁，血厚经验高，推进慢'
    },
    brute: { 
      health: 95, speed: 2.8, damage: 12, exp: 22,
      note: '重装普通怪，第7波解锁，高威胁高经验'
    },
    // 精英怪 - 每5波出现，各有特色（v8增强特色差异化）
    heavy_trooper: { 
      health: 220, speed: 2.5, damage: 18, exp: 55,
      note: '第5波精英，高防御高血量坦克型，移动慢'
    },
    sniper_bot: { 
      health: 140, speed: 0.8, damage: 40, exp: 80,
      note: '第10波精英，远程高伤害脆皮，几乎不动'
    },
    mech_soldier: { 
      health: 400, speed: 4.0, damage: 28, exp: 110,
      note: '第15波精英，攻守兼备全能型，综合威胁最高'
    },
    // BOSS - 每10波出现，难度递增（v8大幅调整节奏）
    war_tank: { 
      health: 1300, speed: 1.2, damage: 35, exp: 320,
      note: '第10波BOSS，火焰属性，入门级，血量适中'
    },
    alien_hive: { 
      health: 2800, speed: 0.6, damage: 55, exp: 600,
      note: '第20波BOSS，毒属性，召唤流，血厚伤害中'
    },
    cyber_dragon: { 
      health: 5000, speed: 0.7, damage: 75, exp: 1600,
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
        console.log(`[BALANCE v8] ${enemy}: HP ${oldHealth}→${stats.health}, DMG ${oldDamage}→${stats.damage}, SPD ${oldSpeed}→${stats.speed}, EXP ${oldExp}→${stats.exp}`);
      }
    }
  }

  if (changed) {
    writeFile(ENEMIES_FILE, newContent);
    console.log('[BALANCE v8] Enemy balance v8 optimized');
  } else {
    console.log('[BALANCE v8] Enemy balance already v8 optimized');
  }
}

// ============================================
// 2. v8 属性技能数值深度平衡
// ============================================
function v8OptimizeSkillValues() {
  const content = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);

  // v8: 深度技能平衡 - 基于DPS贡献的精确数值
  // 设计原则：
  // - 攻速技能：大幅降低（连续乘算效应太强）
  //   5级全满时总攻速提升约50-60%（间隔从1000ms降到400-500ms）
  // - 攻击技能：保持线性，但数值更合理
  // - 暴击率：软上限60%
  // - 生命/防御：生存向，前期效果明显
  
  const skillTargets = {
    // 攻击技能：每级提升递减，但总量可观
    'atk_1': { desc: '攻击力+3/级', engineVal: 3 },
    'atk_2': { desc: '攻击力+5/级', engineVal: 5 },
    'atk_3': { desc: '攻击力+10/级', engineVal: 10 },
    'atk_4': { desc: '攻击力+18/级', engineVal: 18 },
    'atk_5': { desc: '攻击力+28/级', engineVal: 28 },
    // 攻速技能：大幅降低（连续乘算效应太强）
    // 5级全满：spd1=7.5% + spd2=12.5% + spd3=17.5% + spd4=25% + spd5=35%
    // 实际乘算：0.925^5 × 0.875^5 × 0.825^5 × 0.75^5 × 0.65^5... 不对，每个技能是乘(1-val*lvl)
    // 重新计算：spd1(5级)=1-0.015*5=0.925, spd2=0.875, spd3=0.825, spd4=0.75, spd5=0.65
    // 总乘数: 0.925 × 0.875 × 0.825 × 0.75 × 0.65 ≈ 0.325 (攻速提升约3倍)
    // 还是太高了... 再降：spd1=1%/级(总5%), spd2=2%/级(总10%), spd3=3%/级(总15%), spd4=4.5%/级(总22.5%), spd5=7%/级(总35%)
    // 总乘数: 0.95 × 0.90 × 0.85 × 0.775 × 0.65 ≈ 0.366
    // 嗯，还是3倍左右攻速。考虑到这是终极build（需要大量技能点），这个数值其实可以接受
    // 但前期不能太强。让我们更保守一些：
    'spd_1': { desc: '攻速+1.5%/级', engineVal: 0.015 },
    'spd_2': { desc: '攻速+2.5%/级', engineVal: 0.025 },
    'spd_3': { desc: '攻速+3.5%/级', engineVal: 0.035 },
    'spd_4': { desc: '攻速+5%/级', engineVal: 0.05 },
    'spd_5': { desc: '攻速+7.5%/级', engineVal: 0.075 },
    // 射程技能：前期价值高，后期递减
    'rng_1': { desc: '射程+15/级', engineVal: 15 },
    'rng_2': { desc: '射程+30/级', engineVal: 30 },
    'rng_3': { desc: '射程+50/级', engineVal: 50 },
    'rng_4': { desc: '射程+80/级', engineVal: 80 },
    // 暴击技能：暴击率有上限，数值更保守
    'crit_1': { desc: '暴击率+1.2%/级', engineVal: 1.2 },
    'crit_2': { desc: '暴击率+2.5%/级', engineVal: 2.5 },
    'crit_3': { desc: '暴击率+4%/级', engineVal: 4 },
    'crit_4': { desc: '暴击率+6%/级', engineVal: 6 },
    // 暴伤技能：数值可以更高（乘算区，但需要暴击率配合）
    'cdmg_1': { desc: '暴击伤害+10%/级', engineVal: 10 },
    'cdmg_2': { desc: '暴击伤害+22%/级', engineVal: 22 },
    'cdmg_3': { desc: '暴击伤害+38%/级', engineVal: 38 },
    // 生命技能：前期提升大，后期更需要百分比
    'hp_1': { desc: '最大生命+20/级', engineVal: 20 },
    'hp_2': { desc: '最大生命+45/级', engineVal: 45 },
    'hp_3': { desc: '最大生命+75/级', engineVal: 75 },
    'hp_4': { desc: '最大生命+130/级', engineVal: 130 },
    // 防御技能：减伤效果递减（边际效益）
    'def_1': { desc: '减伤+2%/级', engineVal: 2 },
    'def_2': { desc: '减伤+4%/级', engineVal: 4 },
    'def_3': { desc: '减伤+7.5%/级', engineVal: 7.5 },
    'def_4': { desc: '减伤+12%/级', engineVal: 12 },
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
      console.log(`[BALANCE v8] ${skillId} desc: "${match[2]}" → "${target.desc}"`);
    }
  }

  // 更新引擎中的技能数值
  const skillValuePatterns = [
    { id: 'atk_1', pattern: /case 'atk_1': attack \+= (\d+) \* lvl;/, val: 3, template: "case 'atk_1': attack += VAL * lvl;" },
    { id: 'atk_2', pattern: /case 'atk_2': attack \+= (\d+) \* lvl;/, val: 5, template: "case 'atk_2': attack += VAL * lvl;" },
    { id: 'atk_3', pattern: /case 'atk_3': attack \+= (\d+) \* lvl;/, val: 10, template: "case 'atk_3': attack += VAL * lvl;" },
    { id: 'atk_4', pattern: /case 'atk_4': attack \+= (\d+) \* lvl;/, val: 18, template: "case 'atk_4': attack += VAL * lvl;" },
    { id: 'atk_5', pattern: /case 'atk_5': attack \+= (\d+) \* lvl;/, val: 28, template: "case 'atk_5': attack += VAL * lvl;" },
    { id: 'spd_1', pattern: /case 'spd_1': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.015, template: "case 'spd_1': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_2', pattern: /case 'spd_2': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.025, template: "case 'spd_2': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_3', pattern: /case 'spd_3': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.035, template: "case 'spd_3': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_4', pattern: /case 'spd_4': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.05, template: "case 'spd_4': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_5', pattern: /case 'spd_5': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, val: 0.075, template: "case 'spd_5': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'rng_1', pattern: /case 'rng_1': range \+= (\d+) \* lvl;/, val: 15, template: "case 'rng_1': range += VAL * lvl;" },
    { id: 'rng_2', pattern: /case 'rng_2': range \+= (\d+) \* lvl;/, val: 30, template: "case 'rng_2': range += VAL * lvl;" },
    { id: 'rng_3', pattern: /case 'rng_3': range \+= (\d+) \* lvl;/, val: 50, template: "case 'rng_3': range += VAL * lvl;" },
    { id: 'rng_4', pattern: /case 'rng_4': range \+= (\d+) \* lvl;/, val: 80, template: "case 'rng_4': range += VAL * lvl;" },
    { id: 'crit_1', pattern: /case 'crit_1': critRate \+= ([\d.]+) \* lvl;/, val: 1.2, template: "case 'crit_1': critRate += VAL * lvl;" },
    { id: 'crit_2', pattern: /case 'crit_2': critRate \+= ([\d.]+) \* lvl;/, val: 2.5, template: "case 'crit_2': critRate += VAL * lvl;" },
    { id: 'crit_3', pattern: /case 'crit_3': critRate \+= ([\d.]+) \* lvl;/, val: 4, template: "case 'crit_3': critRate += VAL * lvl;" },
    { id: 'crit_4', pattern: /case 'crit_4': critRate \+= ([\d.]+) \* lvl;/, val: 6, template: "case 'crit_4': critRate += VAL * lvl;" },
    { id: 'cdmg_1', pattern: /case 'cdmg_1': critDamage \+= (\d+) \* lvl;/, val: 10, template: "case 'cdmg_1': critDamage += VAL * lvl;" },
    { id: 'cdmg_2', pattern: /case 'cdmg_2': critDamage \+= (\d+) \* lvl;/, val: 22, template: "case 'cdmg_2': critDamage += VAL * lvl;" },
    { id: 'cdmg_3', pattern: /case 'cdmg_3': critDamage \+= (\d+) \* lvl;/, val: 38, template: "case 'cdmg_3': critDamage += VAL * lvl;" },
    { id: 'hp_1', pattern: /case 'hp_1': maxHealth \+= (\d+) \* lvl;/, val: 20, template: "case 'hp_1': maxHealth += VAL * lvl;" },
    { id: 'hp_2', pattern: /case 'hp_2': maxHealth \+= (\d+) \* lvl;/, val: 45, template: "case 'hp_2': maxHealth += VAL * lvl;" },
    { id: 'hp_3', pattern: /case 'hp_3': maxHealth \+= (\d+) \* lvl;/, val: 75, template: "case 'hp_3': maxHealth += VAL * lvl;" },
    { id: 'hp_4', pattern: /case 'hp_4': maxHealth \+= (\d+) \* lvl;/, val: 130, template: "case 'hp_4': maxHealth += VAL * lvl;" },
    { id: 'def_1', pattern: /case 'def_1': defense \+= ([\d.]+) \* lvl;/, val: 2, template: "case 'def_1': defense += VAL * lvl;" },
    { id: 'def_2', pattern: /case 'def_2': defense \+= ([\d.]+) \* lvl;/, val: 4, template: "case 'def_2': defense += VAL * lvl;" },
    { id: 'def_3', pattern: /case 'def_3': defense \+= ([\d.]+) \* lvl;/, val: 7.5, template: "case 'def_3': defense += VAL * lvl;" },
    { id: 'def_4', pattern: /case 'def_4': defense \+= ([\d.]+) \* lvl;/, val: 12, template: "case 'def_4': defense += VAL * lvl;" },
  ];

  for (const skill of skillValuePatterns) {
    const match = newEngineContent.match(skill.pattern);
    if (match && match[1] !== String(skill.val)) {
      const replacement = skill.template.replace('VAL', String(skill.val));
      newEngineContent = newEngineContent.replace(skill.pattern, replacement);
      engineChanged = true;
      console.log(`[BALANCE v8] ${skill.id} engine value: ${match[1]} → ${skill.val}`);
    }
  }

  if (skillsChanged) {
    writeFile(SKILLS_FILE, newSkillsContent);
    console.log('[BALANCE v8] Skill descriptions v8 optimized');
  } else {
    console.log('[BALANCE v8] Skill descriptions already v8 optimized');
  }

  if (engineChanged) {
    writeFile(ENGINE_FILE, newEngineContent);
    console.log('[BALANCE v8] Skill values in engine v8 optimized');
  } else {
    console.log('[BALANCE v8] Skill values in engine already v8 optimized');
  }
}

// ============================================
// 3. v8 元素/异常技能数值深度平衡
// ============================================
function v8OptimizeElementalSkills() {
  const content = readFile(ENGINE_FILE);
  let newContent = content;
  let changed = false;

  // v8: 元素技能深度平衡
  // 设计原则：
  // - 灼烧：主DOT输出（占总DPS的10-15%），高概率中伤害
  // - 中毒：DOT+减速，持续削弱，中概率低伤害但持续久
  // - 冰霜：控制为主，伤害极低（控制就是价值），低概率高控制
  // - 雷电：群体伤害，连锁效果（清小怪利器），中概率中伤害
  // - 吸血：生存保障，数值保守（不能让玩家无敌）
  // - 穿透：清场能力，数值稳定

  // 灼烧技能：v8微调 - 降低概率提升伤害，保持总DPS不变但更稳定
  const burn1Pattern = /case 'burn_1':\s*burnChance \+= ([\d.]+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn1Match = newContent.match(burn1Pattern);
  if (burn1Match && (burn1Match[1] !== '2.5' || burn1Match[2] !== '6' || burn1Match[3] !== '3000')) {
    newContent = newContent.replace(
      burn1Pattern,
      `case 'burn_1':\n          burnChance += 2.5 * lvl;\n          burnDamage += 6 * lvl;\n          burnDuration = Math.max(burnDuration, 3000);`
    );
    changed = true;
    console.log('[BALANCE v8] burn_1 values optimized (2.5% chance, 6 dmg, 3s)');
  }

  const burn2Pattern = /case 'burn_2':\s*burnChance \+= ([\d.]+) \* lvl;\s*burnDamage \+= (\d+) \* lvl;\s*burnDuration = Math\.max\(burnDuration, (\d+)\);/;
  const burn2Match = newContent.match(burn2Pattern);
  if (burn2Match && (burn2Match[1] !== '4' || burn2Match[2] !== '16' || burn2Match[3] !== '5000')) {
    newContent = newContent.replace(
      burn2Pattern,
      `case 'burn_2':\n          burnChance += 4 * lvl;\n          burnDamage += 16 * lvl;\n          burnDuration = Math.max(burnDuration, 5000);`
    );
    changed = true;
    console.log('[BALANCE v8] burn_2 values optimized (4% chance, 16 dmg, 5s)');
  }

  // 毒素技能：v8微调 - 增加持续时间，降低瞬时伤害
  const poison1Pattern = /case 'poison_1':\s*poisonChance \+= ([\d.]+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison1Match = newContent.match(poison1Pattern);
  if (poison1Match && (poison1Match[1] !== '2.5' || poison1Match[2] !== '5' || poison1Match[3] !== '4000')) {
    newContent = newContent.replace(
      poison1Pattern,
      `case 'poison_1':\n          poisonChance += 2.5 * lvl;\n          poisonDamage += 5 * lvl;\n          poisonDuration = Math.max(poisonDuration, 4000);`
    );
    changed = true;
    console.log('[BALANCE v8] poison_1 values optimized (2.5% chance, 5 dmg, 4s)');
  }

  const poison2Pattern = /case 'poison_2':\s*poisonChance \+= ([\d.]+) \* lvl;\s*poisonDamage \+= (\d+) \* lvl;\s*poisonDuration = Math\.max\(poisonDuration, (\d+)\);/;
  const poison2Match = newContent.match(poison2Pattern);
  if (poison2Match && (poison2Match[1] !== '4' || poison2Match[2] !== '12' || poison2Match[3] !== '6000')) {
    newContent = newContent.replace(
      poison2Pattern,
      `case 'poison_2':\n          poisonChance += 4 * lvl;\n          poisonDamage += 12 * lvl;\n          poisonDuration = Math.max(poisonDuration, 6000);`
    );
    changed = true;
    console.log('[BALANCE v8] poison_2 values optimized (4% chance, 12 dmg, 6s)');
  }

  // 冰霜技能：v8微调 - 降低概率，提升控制强度
  const freeze1Pattern = /case 'freeze_1':\s*freezeChance \+= ([\d.]+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze1Match = newContent.match(freeze1Pattern);
  if (freeze1Match && (freeze1Match[1] !== '2' || freeze1Match[2] !== '40' || freeze1Match[3] !== '2000')) {
    newContent = newContent.replace(
      freeze1Pattern,
      `case 'freeze_1':\n          freezeChance += 2 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 40);\n          freezeDuration = Math.max(freezeDuration, 2000);`
    );
    changed = true;
    console.log('[BALANCE v8] freeze_1 values optimized (2% chance, 40% slow, 2s)');
  }

  const freeze2Pattern = /case 'freeze_2':\s*freezeChance \+= ([\d.]+) \* lvl;\s*freezeSlowAmount = Math\.max\(freezeSlowAmount, (\d+)\);\s*freezeDuration = Math\.max\(freezeDuration, (\d+)\);/;
  const freeze2Match = newContent.match(freeze2Pattern);
  if (freeze2Match && (freeze2Match[1] !== '3' || freeze2Match[2] !== '100' || freeze2Match[3] !== '1200')) {
    newContent = newContent.replace(
      freeze2Pattern,
      `case 'freeze_2':\n          freezeChance += 3 * lvl;\n          freezeSlowAmount = Math.max(freezeSlowAmount, 100);\n          freezeDuration = Math.max(freezeDuration, 1200);`
    );
    changed = true;
    console.log('[BALANCE v8] freeze_2 values optimized (3% chance, 100% freeze, 1.2s)');
  }

  // 雷电技能：v8微调 - 降低连锁数量，提升单次伤害
  const lightning1Pattern = /case 'lightning_1':\s*lightningChance \+= ([\d.]+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning1Match = newContent.match(lightning1Pattern);
  if (lightning1Match && (lightning1Match[1] !== '2.5' || lightning1Match[2] !== '2' || lightning1Match[3] !== '10')) {
    newContent = newContent.replace(
      lightning1Pattern,
      `case 'lightning_1':\n          lightningChance += 2.5 * lvl;\n          lightningChain = Math.max(lightningChain, 2);\n          lightningDamage += 10 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v8] lightning_1 values optimized (2.5% chance, 2 chain, 10 dmg)');
  }

  const lightning2Pattern = /case 'lightning_2':\s*lightningChance \+= ([\d.]+) \* lvl;\s*lightningChain = Math\.max\(lightningChain, (\d+)\);\s*lightningDamage \+= (\d+) \* lvl;/;
  const lightning2Match = newContent.match(lightning2Pattern);
  if (lightning2Match && (lightning2Match[1] !== '4' || lightning2Match[2] !== '3' || lightning2Match[3] !== '18')) {
    newContent = newContent.replace(
      lightning2Pattern,
      `case 'lightning_2':\n          lightningChance += 4 * lvl;\n          lightningChain = Math.max(lightningChain, 3);\n          lightningDamage += 18 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v8] lightning_2 values optimized (4% chance, 3 chain, 18 dmg)');
  }

  // 吸血技能：v8再降 - 吸血过强会破坏平衡
  const lifestealPattern = /case 'lifesteal_1':\s*lifestealPercent \+= ([\d.]+) \* lvl;/;
  const lifesteal1Match = newContent.match(lifestealPattern);
  if (lifesteal1Match && lifesteal1Match[1] !== '0.2') {
    newContent = newContent.replace(
      lifestealPattern,
      `case 'lifesteal_1':\n          lifestealPercent += 0.2 * lvl;`
    );
    changed = true;
    console.log('[BALANCE v8] lifesteal_1 value optimized (0.2% per level)');
  }

  // lifesteal_2：需要精确匹配第二个
  const allLifestealMatches = [...newContent.matchAll(/case 'lifesteal_(\d+)':\s*lifestealPercent \+= ([\d.]+) \* lvl;/g)];
  if (allLifestealMatches.length >= 2 && allLifestealMatches[1][2] !== '0.6') {
    let count = 0;
    newContent = newContent.replace(
      /case 'lifesteal_\d+':\s*lifestealPercent \+= [\d.]+ \* lvl;/g,
      (match) => {
        count++;
        if (count === 2) {
          return `case 'lifesteal_2':\n          lifestealPercent += 0.6 * lvl;`;
        }
        return match;
      }
    );
    changed = true;
    console.log('[BALANCE v8] lifesteal_2 value optimized (0.6% per level)');
  }

  // 更新技能描述中的数值同步
  const skillsContent = readFile(SKILLS_FILE);
  let newSkillsContent = skillsContent;
  let skillsChanged = false;

  const skillDescUpdates = {
    'burn_1': '攻击有2.5%概率使敌人灼烧3秒',
    'burn_2': '攻击有4%概率使敌人灼烧5秒，伤害翻倍',
    'poison_1': '攻击有2.5%概率使敌人中毒4秒',
    'poison_2': '攻击有4%概率使敌人中毒6秒，伤害翻倍',
    'freeze_1': '攻击有2%概率减缓敌人40%速度2秒',
    'freeze_2': '攻击有3%概率冻结敌人1.2秒',
    'lightning_1': '攻击有2.5%概率触发感电，伤害链2个敌人',
    'lightning_2': '攻击有4%概率触发感电，伤害链3个敌人',
    'lifesteal_1': '攻击回复0.2%最大生命',
    'lifesteal_2': '攻击回复0.6%最大生命',
  };

  for (const [skillId, newDesc] of Object.entries(skillDescUpdates)) {
    const regex = new RegExp(`(createSkill\\('${skillId}',[^,]+,[^,]+,\\s*')([^']+)(')`);
    const match = newSkillsContent.match(regex);
    if (match && match[2] !== newDesc) {
      newSkillsContent = newSkillsContent.replace(match[0], match[1] + newDesc + match[3]);
      skillsChanged = true;
      console.log(`[BALANCE v8] ${skillId} desc updated`);
    }
  }

  if (skillsChanged) {
    writeFile(SKILLS_FILE, newSkillsContent);
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v8] Elemental skill values v8 optimized');
  } else {
    console.log('[BALANCE v8] Elemental skill values already v8 optimized');
  }
}

// ============================================
// 4. v8 等级成长曲线和波次难度深度优化
// ============================================
function v8OptimizeLevelScaling() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // v8: 深度经验曲线 - 更平滑的游戏节奏
  // 1-10级：快速成长（新手期，约1-2分钟一级）
  // 10-25级：稳定增长（成长期，约3-5分钟一级）
  // 25-50级：显著放缓（成熟期，约8-12分钟一级）
  // 50级以上：极慢增长（终极期，约15-20分钟一级）
  // 新公式: 20 + Math.pow(lvl, 1.5) * 5 + lvl * 4
  const newExpFormula = '20 + Math.pow(lvl, 1.5) * 5 + lvl * 4';
  const expFormula = content.match(/this\.player\.expToNextLevel = Math\.floor\(([^;]+)\)/);
  if (expFormula) {
    const oldFormula = expFormula[1];
    if (oldFormula !== newExpFormula) {
      newContent = newContent.replace(
        /this\.player\.expToNextLevel = Math\.floor\([^;]+\)/,
        `this.player.expToNextLevel = Math.floor(${newExpFormula})`
      );
      changed = true;
      console.log(`[BALANCE v8] Exp formula: "${oldFormula}" → "${newExpFormula}"`);
    }
  }

  // 初始经验值（对应初始等级100级）
  const newInitialExp = 'expToNextLevel: Math.floor(20 + Math.pow(100, 1.5) * 5 + 100 * 4),';
  if (!content.includes(newInitialExp)) {
    const oldInitialExp = content.match(/expToNextLevel: Math\.floor\([^\n]+\),/);
    if (oldInitialExp) {
      newContent = newContent.replace(
        /expToNextLevel: Math\.floor\([^\n]+\),/,
        newInitialExp
      );
      changed = true;
      console.log('[BALANCE v8] Initial exp value updated');
    }
  }

  // 等级加成 - 每级提升全属性（v8再降低，防止后期过强）
  const levelBonus = newContent.match(/const levelBonus = Math\.max\(0, \(this\.player\.level - (\d+)\)\) \* ([\d.]+)/);
  if (levelBonus) {
    const newMult = '0.012';
    if (levelBonus[2] !== newMult) {
      newContent = newContent.replace(
        /const levelBonus = Math\.max\(0, \(this\.player\.level - \d+\)\) \* [\d.]+/,
        `const levelBonus = Math.max(0, (this.player.level - 1)) * ${newMult}`
      );
      changed = true;
      console.log(`[BALANCE v8] Level bonus multiplier: ${levelBonus[2]} → ${newMult}`);
    }
  }

  // 波次怪物属性增长 - 更平缓的曲线（v8微调）
  // 血量增长：1.03 → 1.028（更平缓）
  const healthMultiplier = newContent.match(/const healthMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (healthMultiplier) {
    const newPow = '1.028';
    if (healthMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const healthMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const healthMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v8] Wave health multiplier: ${healthMultiplier[1]} → ${newPow}`);
    }
  }

  // 伤害增长：1.018 → 1.016（更平缓，防止后期被秒）
  const damageMultiplier = newContent.match(/const damageMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (damageMultiplier) {
    const newPow = '1.016';
    if (damageMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const damageMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const damageMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v8] Wave damage multiplier: ${damageMultiplier[1]} → ${newPow}`);
    }
  }

  // 速度增长：0.2上限，0.002每波 → 0.18上限，0.0018每波（更可控）
  const speedMultiplier = newContent.match(/const speedMultiplier = 1 \+ Math\.min\(([\d.]+), \(wave - 1\) \* ([\d.]+)\)/);
  if (speedMultiplier) {
    const newMin = '0.18';
    const newMultVal = '0.0018';
    if (speedMultiplier[1] !== newMin || speedMultiplier[2] !== newMultVal) {
      newContent = newContent.replace(
        /const speedMultiplier = 1 \+ Math\.min\([\d.]+, \(wave - 1\) \* [\d.]+\)/,
        `const speedMultiplier = 1 + Math.min(${newMin}, (wave - 1) * ${newMultVal})`
      );
      changed = true;
      console.log(`[BALANCE v8] Wave speed multiplier: min=${speedMultiplier[1]}→${newMin}, perWave=${speedMultiplier[2]}→${newMultVal}`);
    }
  }

  // 经验增长：1.022 → 1.02（经验获取更稳定）
  const expMultiplier = newContent.match(/const expMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (expMultiplier) {
    const newPow = '1.02';
    if (expMultiplier[1] !== newPow) {
      newContent = newContent.replace(
        /const expMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const expMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
      console.log(`[BALANCE v8] Wave exp multiplier: ${expMultiplier[1]} → ${newPow}`);
    }
  }

  // 掉落率增长：0.005每波 → 0.004每波（更平衡）
  const dropRateIncrease = newContent.match(/config\.dropRate \+ \(wave - 1\) \* ([\d.]+)\)/);
  if (dropRateIncrease) {
    const newVal = '0.004';
    if (dropRateIncrease[1] !== newVal) {
      newContent = newContent.replace(
        /config\.dropRate \+ \(wave - 1\) \* [\d.]+\)/,
        `config.dropRate + (wave - 1) * ${newVal})`
      );
      changed = true;
      console.log(`[BALANCE v8] Drop rate per wave: ${dropRateIncrease[1]} → ${newVal}`);
    }
  }

  // 玩家基础攻击力微调
  const baseAttack = newContent.match(/attack: (\d+),/);
  if (baseAttack && baseAttack[1] !== '8') {
    newContent = newContent.replace(/attack: \d+,/, 'attack: 8,');
    changed = true;
    console.log(`[BALANCE v8] Base attack: ${baseAttack[1]} → 8`);
  }

  // 玩家基础生命值微调
  const baseMaxHealth = newContent.match(/maxHealth: (\d+),/);
  if (baseMaxHealth && baseMaxHealth[1] !== '100') {
    newContent = newContent.replace(/maxHealth: \d+,/, 'maxHealth: 100,');
    changed = true;
    console.log(`[BALANCE v8] Base maxHealth: ${baseMaxHealth[1]} → 100`);
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v8] Level scaling v8 optimized');
  } else {
    console.log('[BALANCE v8] Level scaling already v8 optimized');
  }
}

// ============================================
// 5. v8 装备数值深度平衡
// ============================================
function v8OptimizeEquipmentBalance() {
  const content = readFile(EQUIPMENT_FILE);
  
  let newContent = content;
  let changed = false;

  // 装备基础数值调整 - v8深度平衡（整体微调，让技能更重要）
  const equipTemplates = [
    { slot: 'weapon', old: 'attack: 5, range: 20', new: 'attack: 4, range: 20' },
    { slot: 'armor', old: 'health: 35, defense: 2.5', new: 'health: 30, defense: 2' },
    { slot: 'pants', old: 'defense: 1.5, health: 12', new: 'defense: 1.2, health: 10' },
    { slot: 'shoulder', old: 'defense: 1.5, critRate: 0.6', new: 'defense: 1.2, critRate: 0.5' },
    { slot: 'belt', old: 'attackSpeed: -20, health: 10', new: 'attackSpeed: -15, health: 8' },
    { slot: 'shoes', old: 'defense: 1, attackSpeed: -4', new: 'defense: 0.8, attackSpeed: -3' },
    { slot: 'earring', old: 'attack: 5, critRate: 1.2', new: 'attack: 4, critRate: 1' },
    { slot: 'ring', old: 'attack: 6, critRate: 1.5', new: 'attack: 5, critRate: 1.2' },
    { slot: 'necklace', old: 'health: 18, critDamage: 2', new: 'health: 15, critDamage: 1.5' },
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
        console.log(`[BALANCE v8] ${template.slot} base stats adjusted`);
      }
    }
  }

  // 词条基础数值调整 - v8平衡（整体下调10-15%）
  const affixBaseValues = [
    { type: 'attack', old: 'baseValue = isFineBonusAttack ? 1.5 : 4', new: 'baseValue = isFineBonusAttack ? 1.2 : 3.5' },
    { type: 'defense', old: 'baseValue = 2.5', new: 'baseValue = 2' },
    { type: 'health', old: 'baseValue = 16', new: 'baseValue = 14' },
    { type: 'critRate', old: 'baseValue = 2', new: 'baseValue = 1.5' },
    { type: 'critDamage', old: 'baseValue = 6', new: 'baseValue = 5' },
    { type: 'attackSpeed', old: 'baseValue = 7', new: 'baseValue = 5' },
    { type: 'range', old: 'baseValue = 10', new: 'baseValue = 8' },
    { type: 'elementalDamage', old: 'baseValue = 14', new: 'baseValue = 12' },
  ];

  for (const affix of affixBaseValues) {
    if (newContent.includes(affix.old)) {
      newContent = newContent.replace(affix.old, affix.new);
      changed = true;
      console.log(`[BALANCE v8] ${affix.type} affix base value adjusted`);
    }
  }

  if (changed) {
    writeFile(EQUIPMENT_FILE, newContent);
    console.log('[BALANCE v8] Equipment balance v8 optimized');
  } else {
    console.log('[BALANCE v8] Equipment balance already v8 optimized');
  }
}

// ============================================
// 6. v8 异常状态特效系统深度平衡
// ============================================
function v8OptimizeDebuffEffects() {
  const content = readFile(ENGINE_FILE);
  let newContent = content;
  let changed = false;

  // v8: 异常状态数值深度平衡
  // 设计原则：
  // - DOT伤害基于基础值，实际伤害由技能/装备加成决定
  // - 控制效果有合理上限，避免无限控制
  // - 各状态有明确定位，差异化明显
  // - 基础值是基准，技能和装备提供加成
  
  const debuffPattern = /private debuffEffects: Record<string, \{[^}]+\}> = \{[\s\S]*?\};/;
  const debuffMatch = newContent.match(debuffPattern);
  
  if (debuffMatch) {
    const newDebuffDef = `private debuffEffects: Record<string, { color: string; particleColor: string; damage: number; speedMultiplier: number; icon: string; name: string; description: string; damageMultiplier?: number; glowColor?: string; tickInterval?: number }> = {
    burn: { color: '#FF6600', particleColor: '#FF4400', damage: 4, speedMultiplier: 1, icon: '🔥', name: '灼烧', description: '持续受到火焰伤害', glowColor: '#FF8800', tickInterval: 500 },
    poison: { color: '#00FF00', particleColor: '#00CC00', damage: 3, speedMultiplier: 0.85, icon: '☠️', name: '中毒', description: '持续受到毒素伤害，移动速度降低', glowColor: '#00FF44', tickInterval: 600 },
    freeze: { color: '#00CCFF', particleColor: '#0088FF', damage: 0, speedMultiplier: 0.15, icon: '❄️', name: '冰冻', description: '被冻结，几乎无法移动', glowColor: '#88EEFF' },
    lightning: { color: '#FFFF00', particleColor: '#FFFF88', damage: 5, speedMultiplier: 0.75, icon: '⚡', name: '感电', description: '持续受到雷电伤害，移动速度降低', glowColor: '#FFFFAA', tickInterval: 400 },
    slow: { color: '#8888FF', particleColor: '#AAAAFF', damage: 0, speedMultiplier: 0.55, icon: '🐢', name: '减速', description: '移动速度大幅降低', glowColor: '#BBBBFF' },
    curse: { color: '#AA00AA', particleColor: '#CC00CC', damage: 1.5, speedMultiplier: 0.97, icon: '📜', name: '诅咒', description: '受到伤害增加30%', damageMultiplier: 1.3, glowColor: '#DD44DD', tickInterval: 800 },
    stun: { color: '#FFD700', particleColor: '#FFEA00', damage: 0, speedMultiplier: 0, icon: '💫', name: '眩晕', description: '无法移动和攻击', glowColor: '#FFFF88' },
  };`;
    
    if (debuffMatch[0] !== newDebuffDef) {
      newContent = newContent.replace(debuffPattern, newDebuffDef);
      changed = true;
      console.log('[BALANCE v8] Debuff effects values optimized');
    }
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v8] Debuff effects v8 optimized');
  } else {
    console.log('[BALANCE v8] Debuff effects already v8 optimized');
  }
}

// ============================================
// 7. v8 验证所有内容完整性
// ============================================
function v8VerifyAllContent() {
  const equipContent = readFile(EQUIPMENT_FILE);
  const skillsContent = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);
  
  console.log('');
  console.log('--- v8 验证所有内容完整性 ---');
  
  // 验证装备套装
  const hasDestroyerSet = equipContent.includes("wasteland_destroyer");
  console.log(`[v8 验证] 废土毁灭者套装: ${hasDestroyerSet ? '✓ 存在' : '✗ 缺失'}`);
  
  // 验证新道具
  const itemsToCheck = ['stun_bomb', 'lightning_bolt', 'curse_scroll'];
  for (const item of itemsToCheck) {
    const hasItem = equipContent.includes(item);
    console.log(`[v8 验证] ${item}: ${hasItem ? '✓ 定义存在' : '✗ 定义缺失'}`);
  }
  
  // 验证新技能
  const skillsToCheck = ['burn_1', 'poison_1', 'freeze_1', 'lightning_1', 'lifesteal_1', 'piercing_1'];
  for (const skill of skillsToCheck) {
    const hasSkill = skillsContent.includes(skill);
    const hasSkillImpl = engineContent.includes(`case '${skill}'`);
    console.log(`[v8 验证] ${skill}: ${hasSkill ? '✓ 定义存在' : '✗ 定义缺失'} | ${hasSkillImpl ? '✓ 实现存在' : '✗ 实现缺失'}`);
  }
  
  // 验证异常状态系统
  const debuffsToCheck = ['burn', 'poison', 'freeze', 'lightning', 'slow', 'curse', 'stun'];
  for (const debuff of debuffsToCheck) {
    const hasDebuffDef = engineContent.includes(`${debuff}: {`);
    console.log(`[v8 验证] ${debuff}状态: ${hasDebuffDef ? '✓ 定义存在' : '✗ 缺失'}`);
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
        console.log(`[v8 验证] ${slot}图标: ${icons.length}/10 ✗`);
        allSlotsGood = false;
      }
    }
  }
  if (allSlotsGood) {
    console.log('[v8 验证] 所有槽位图标: ✓ 10种以上');
  }
  
  // 输出v8平衡数值概览
  console.log('');
  console.log('--- v8 平衡数值概览 ---');
  
  // 计算各级经验需求
  const expLevels = [1, 5, 10, 20, 30, 50, 100];
  console.log('经验需求:');
  for (const lvl of expLevels) {
    const exp = Math.floor(20 + Math.pow(lvl, 1.5) * 5 + lvl * 4);
    console.log(`  Lv.${lvl}: ${exp} exp`);
  }
  
  // 波次怪物属性
  console.log('波次怪物属性倍率:');
  const waves = [1, 5, 10, 20, 30, 50];
  for (const wave of waves) {
    const hpMult = Math.pow(1.028, wave - 1).toFixed(2);
    const dmgMult = Math.pow(1.016, wave - 1).toFixed(2);
    const expMult = Math.pow(1.02, wave - 1).toFixed(2);
    console.log(`  第${wave}波: HP×${hpMult}, DMG×${dmgMult}, EXP×${expMult}`);
  }
  
  // 5级满技能玩家属性估算（使用正确的连续乘算）
  console.log('');
  console.log('满5级基础技能玩家属性估算（不含装备，连续乘算）:');
  const atkTotal = 8 + (3+5+10+18+28)*5;
  // 攻速：连续乘法
  let spdMult = 1;
  spdMult *= (1 - 0.015 * 5); // spd1
  spdMult *= (1 - 0.025 * 5); // spd2
  spdMult *= (1 - 0.035 * 5); // spd3
  spdMult *= (1 - 0.05 * 5);  // spd4
  spdMult *= (1 - 0.075 * 5); // spd5
  const spdTotal = Math.floor(1000 * spdMult);
  const hpTotal = 100 + (20+45+75+130)*5;
  const critTotal = (1.2+2.5+4+6)*5;
  const cdmgTotal = 50 + (10+22+38)*5;
  console.log(`  攻击力: ${atkTotal} (基础8 + 技能${(3+5+10+18+28)*5})`);
  console.log(`  攻击间隔: ${spdTotal}ms (基础1000ms × ${spdMult.toFixed(3)})`);
  console.log(`  最大生命: ${hpTotal}`);
  console.log(`  暴击率: ${critTotal.toFixed(1)}%`);
  console.log(`  暴击伤害: ${cdmgTotal}% (基础50% + 技能${(10+22+38)*5}%)`);
  
  console.log('');
}

// ============================================
// 主函数
// ============================================
function runV8Optimization() {
  console.log('========================================');
  console.log('=== Game Balance Optimization v8 ===');
  console.log('=== 深度平衡精细优化 ===');
  console.log('========================================');
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('');
  
  try {
    console.log('--- 1. 怪物属性深度平衡 (v8) ---');
    v8OptimizeEnemyBalance();
    console.log('');
    
    console.log('--- 2. 属性技能数值深度平衡 (v8) ---');
    v8OptimizeSkillValues();
    console.log('');
    
    console.log('--- 3. 元素技能深度平衡 (v8) ---');
    v8OptimizeElementalSkills();
    console.log('');
    
    console.log('--- 4. 等级成长曲线深度优化 (v8) ---');
    v8OptimizeLevelScaling();
    console.log('');
    
    console.log('--- 5. 装备数值深度平衡 (v8) ---');
    v8OptimizeEquipmentBalance();
    console.log('');
    
    console.log('--- 6. 异常状态特效深度平衡 (v8) ---');
    v8OptimizeDebuffEffects();
    console.log('');
    
    console.log('--- 7. 验证所有内容 ---');
    v8VerifyAllContent();
    
    console.log('========================================');
    console.log('=== v8 Optimization Completed ===');
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
  runV8Optimization();
}

module.exports = { runV8Optimization };
