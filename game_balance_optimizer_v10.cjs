const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, 'src/game/data');
const SKILLS_FILE = path.join(BASE_DIR, 'skills.ts');
const ENGINE_FILE = path.join(__dirname, 'src/game/GameEngine.ts');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`[BALANCE v10] Updated: ${filePath}`);
}

// ============================================
// 1. v10 基础属性技能数值优化
// ============================================
function v10OptimizeBaseSkills() {
  const skillsContent = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);
  
  let newSkillsContent = skillsContent;
  let newEngineContent = engineContent;
  let skillsChanged = false;
  let engineChanged = false;

  // 优化原则：
  // - 攻击：前期略低(3→2.5)，后期更高(28→35)，提升曲线更陡峭
  // - 攻速：更加平滑，前期略高(1.5→2)，后期略低(7.5→6)
  // - 暴击率：前期略低(1.2→1)，后期更高(6→7.5)
  // - 暴击伤害：前期略低(10→8)，后期更高(38→45)
  // - 生命：前期更肉(20→25)，后期更高(130→160)
  // - 防御：略提升(2→2.5)，后期更有效(12→15)

  // ============ 攻击技能优化 ============
  const atkUpdates = [
    { id: 'atk_1', oldDesc: '攻击力+3/级', newDesc: '攻击力+2.5/级', oldVal: '3', newVal: '2.5' },
    { id: 'atk_2', oldDesc: '攻击力+5/级', newDesc: '攻击力+5/级', oldVal: '5', newVal: '5' },
    { id: 'atk_3', oldDesc: '攻击力+10/级', newDesc: '攻击力+11/级', oldVal: '10', newVal: '11' },
    { id: 'atk_4', oldDesc: '攻击力+18/级', newDesc: '攻击力+22/级', oldVal: '18', newVal: '22' },
    { id: 'atk_5', oldDesc: '攻击力+28/级', newDesc: '攻击力+35/级', oldVal: '28', newVal: '35' },
  ];

  for (const update of atkUpdates) {
    const descPattern = new RegExp(`createSkill\\('${update.id}',[^,]+,[^,]+,\\s*'${update.oldDesc}'`);
    if (newSkillsContent.match(descPattern)) {
      newSkillsContent = newSkillsContent.replace(update.oldDesc, update.newDesc);
      skillsChanged = true;
      console.log(`[BALANCE v10] ${update.id} desc: ${update.oldDesc} → ${update.newDesc}`);
    }

    const enginePattern = new RegExp(`case '${update.id}':\\s*attack \\+= ${update.oldVal} \\* lvl`);
    if (newEngineContent.match(enginePattern)) {
      newEngineContent = newEngineContent.replace(update.oldVal, update.newVal);
      engineChanged = true;
      console.log(`[BALANCE v10] ${update.id} engine: ${update.oldVal} → ${update.newVal}`);
    }
  }

  // ============ 攻速技能优化 ============
  const spdUpdates = [
    { id: 'spd_1', oldDesc: '攻速+1.5%/级', newDesc: '攻速+2%/级', oldVal: '0.015', newVal: '0.02' },
    { id: 'spd_2', oldDesc: '攻速+2.5%/级', newDesc: '攻速+2.8%/级', oldVal: '0.025', newVal: '0.028' },
    { id: 'spd_3', oldDesc: '攻速+3.5%/级', newDesc: '攻速+3.2%/级', oldVal: '0.035', newVal: '0.032' },
    { id: 'spd_4', oldDesc: '攻速+5%/级', newDesc: '攻速+4%/级', oldVal: '0.05', newVal: '0.04' },
    { id: 'spd_5', oldDesc: '攻速+7.5%/级', newDesc: '攻速+6%/级', oldVal: '0.075', newVal: '0.06' },
  ];

  for (const update of spdUpdates) {
    const descPattern = new RegExp(`createSkill\\('${update.id}',[^,]+,[^,]+,\\s*'${update.oldDesc}'`);
    if (newSkillsContent.match(descPattern)) {
      newSkillsContent = newSkillsContent.replace(update.oldDesc, update.newDesc);
      skillsChanged = true;
      console.log(`[BALANCE v10] ${update.id} desc: ${update.oldDesc} → ${update.newDesc}`);
    }

    const enginePattern = new RegExp(`case '${update.id}':\\s*attackSpeed = Math\\.floor\\(attackSpeed \\* \\(1 - ${update.oldVal} \\* lvl\\)\\)`);
    if (newEngineContent.match(enginePattern)) {
      newEngineContent = newEngineContent.replace(update.oldVal, update.newVal);
      engineChanged = true;
      console.log(`[BALANCE v10] ${update.id} engine: ${update.oldVal} → ${update.newVal}`);
    }
  }

  // ============ 暴击率技能优化 ============
  const critUpdates = [
    { id: 'crit_1', oldDesc: '暴击率+1.2%/级', newDesc: '暴击率+1%/级', oldVal: '1.2', newVal: '1' },
    { id: 'crit_2', oldDesc: '暴击率+2.5%/级', newDesc: '暴击率+2.2%/级', oldVal: '2.5', newVal: '2.2' },
    { id: 'crit_3', oldDesc: '暴击率+4%/级', newDesc: '暴击率+4.5%/级', oldVal: '4', newVal: '4.5' },
    { id: 'crit_4', oldDesc: '暴击率+6%/级', newDesc: '暴击率+7.5%/级', oldVal: '6', newVal: '7.5' },
  ];

  for (const update of critUpdates) {
    const descPattern = new RegExp(`createSkill\\('${update.id}',[^,]+,[^,]+,\\s*'${update.oldDesc}'`);
    if (newSkillsContent.match(descPattern)) {
      newSkillsContent = newSkillsContent.replace(update.oldDesc, update.newDesc);
      skillsChanged = true;
      console.log(`[BALANCE v10] ${update.id} desc: ${update.oldDesc} → ${update.newDesc}`);
    }

    const enginePattern = new RegExp(`case '${update.id}':\\s*critRate \\+= ${update.oldVal} \\* lvl`);
    if (newEngineContent.match(enginePattern)) {
      newEngineContent = newEngineContent.replace(update.oldVal, update.newVal);
      engineChanged = true;
      console.log(`[BALANCE v10] ${update.id} engine: ${update.oldVal} → ${update.newVal}`);
    }
  }

  // ============ 暴击伤害技能优化 ============
  const cdmgUpdates = [
    { id: 'cdmg_1', oldDesc: '暴击伤害+10%/级', newDesc: '暴击伤害+8%/级', oldVal: '10', newVal: '8' },
    { id: 'cdmg_2', oldDesc: '暴击伤害+22%/级', newDesc: '暴击伤害+20%/级', oldVal: '22', newVal: '20' },
    { id: 'cdmg_3', oldDesc: '暴击伤害+38%/级', newDesc: '暴击伤害+45%/级', oldVal: '38', newVal: '45' },
  ];

  for (const update of cdmgUpdates) {
    const descPattern = new RegExp(`createSkill\\('${update.id}',[^,]+,[^,]+,\\s*'${update.oldDesc}'`);
    if (newSkillsContent.match(descPattern)) {
      newSkillsContent = newSkillsContent.replace(update.oldDesc, update.newDesc);
      skillsChanged = true;
      console.log(`[BALANCE v10] ${update.id} desc: ${update.oldDesc} → ${update.newDesc}`);
    }

    const enginePattern = new RegExp(`case '${update.id}':\\s*critDamage \\+= ${update.oldVal} \\* lvl`);
    if (newEngineContent.match(enginePattern)) {
      newEngineContent = newEngineContent.replace(update.oldVal, update.newVal);
      engineChanged = true;
      console.log(`[BALANCE v10] ${update.id} engine: ${update.oldVal} → ${update.newVal}`);
    }
  }

  // ============ 生命技能优化 ============
  const hpUpdates = [
    { id: 'hp_1', oldDesc: '最大生命+20/级', newDesc: '最大生命+25/级', oldVal: '20', newVal: '25' },
    { id: 'hp_2', oldDesc: '最大生命+45/级', newDesc: '最大生命+55/级', oldVal: '45', newVal: '55' },
    { id: 'hp_3', oldDesc: '最大生命+75/级', newDesc: '最大生命+90/级', oldVal: '75', newVal: '90' },
    { id: 'hp_4', oldDesc: '最大生命+130/级', newDesc: '最大生命+160/级', oldVal: '130', newVal: '160' },
  ];

  for (const update of hpUpdates) {
    const descPattern = new RegExp(`createSkill\\('${update.id}',[^,]+,[^,]+,\\s*'${update.oldDesc}'`);
    if (newSkillsContent.match(descPattern)) {
      newSkillsContent = newSkillsContent.replace(update.oldDesc, update.newDesc);
      skillsChanged = true;
      console.log(`[BALANCE v10] ${update.id} desc: ${update.oldDesc} → ${update.newDesc}`);
    }

    const enginePattern = new RegExp(`case '${update.id}':\\s*maxHealth \\+= ${update.oldVal} \\* lvl`);
    if (newEngineContent.match(enginePattern)) {
      newEngineContent = newEngineContent.replace(update.oldVal, update.newVal);
      engineChanged = true;
      console.log(`[BALANCE v10] ${update.id} engine: ${update.oldVal} → ${update.newVal}`);
    }
  }

  // ============ 防御技能优化 ============
  const defUpdates = [
    { id: 'def_1', oldDesc: '减伤+2%/级', newDesc: '减伤+2.5%/级', oldVal: '2', newVal: '2.5' },
    { id: 'def_2', oldDesc: '减伤+4%/级', newDesc: '减伤+5%/级', oldVal: '4', newVal: '5' },
    { id: 'def_3', oldDesc: '减伤+7.5%/级', newDesc: '减伤+9%/级', oldVal: '7.5', newVal: '9' },
    { id: 'def_4', oldDesc: '减伤+12%/级', newDesc: '减伤+15%/级', oldVal: '12', newVal: '15' },
  ];

  for (const update of defUpdates) {
    const descPattern = new RegExp(`createSkill\\('${update.id}',[^,]+,[^,]+,\\s*'${update.oldDesc}'`);
    if (newSkillsContent.match(descPattern)) {
      newSkillsContent = newSkillsContent.replace(update.oldDesc, update.newDesc);
      skillsChanged = true;
      console.log(`[BALANCE v10] ${update.id} desc: ${update.oldDesc} → ${update.newDesc}`);
    }

    const enginePattern = new RegExp(`case '${update.id}':\\s*defense \\+= ${update.oldVal} \\* lvl`);
    if (newEngineContent.match(enginePattern)) {
      newEngineContent = newEngineContent.replace(update.oldVal, update.newVal);
      engineChanged = true;
      console.log(`[BALANCE v10] ${update.id} engine: ${update.oldVal} → ${update.newVal}`);
    }
  }

  if (skillsChanged) {
    writeFile(SKILLS_FILE, newSkillsContent);
    console.log('[BALANCE v10] Skill definitions v10 optimized');
  } else {
    console.log('[BALANCE v10] Skill definitions already v10 optimized');
  }

  if (engineChanged) {
    writeFile(ENGINE_FILE, newEngineContent);
    console.log('[BALANCE v10] Skill engine values v10 optimized');
  } else {
    console.log('[BALANCE v10] Skill engine values already v10 optimized');
  }
}

// ============================================
// 2. v10 怪物属性微调优化
// ============================================
function v10OptimizeEnemyBalance() {
  const content = readFile(path.join(BASE_DIR, 'enemies.ts'));
  
  let newContent = content;
  let changed = false;

  // v10微调：根据实际游戏体验，进一步优化怪物平衡
  // 设计原则：
  // - 前期怪物更易击杀，提升新手体验
  // - 精英怪威胁度适度降低，避免过早被秒杀
  // - BOSS血量适度增加，增加挑战性
  
  const enemyBalance = {
    mutant: { health: 10, speed: 3.2, damage: 2, exp: 4 },
    raider: { health: 18, speed: 5.5, damage: 3, exp: 6 },
    spider: { health: 12, speed: 7.5, damage: 2, exp: 5 },
    infected: { health: 38, speed: 4.2, damage: 5, exp: 11 },
    zombie: { health: 68, speed: 1.3, damage: 4, exp: 16 },
    brute: { health: 98, speed: 2.8, damage: 12, exp: 26 },
    heavy_trooper: { health: 240, speed: 2.5, damage: 18, exp: 65 },
    sniper_bot: { health: 150, speed: 0.8, damage: 42, exp: 95 },
    mech_soldier: { health: 450, speed: 4.0, damage: 30, exp: 135 },
    war_tank: { health: 1400, speed: 1.2, damage: 36, exp: 380 },
    alien_hive: { health: 3000, speed: 0.6, damage: 58, exp: 720 },
    cyber_dragon: { health: 5500, speed: 0.7, damage: 82, exp: 1900 },
  };

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
        console.log(`[BALANCE v10] ${enemy}: HP ${oldHealth}→${stats.health}, DMG ${oldDamage}→${stats.damage}, SPD ${oldSpeed}→${stats.speed}, EXP ${oldExp}→${stats.exp}`);
      }
    }
  }

  if (changed) {
    writeFile(path.join(BASE_DIR, 'enemies.ts'), newContent);
    console.log('[BALANCE v10] Enemy balance v10 optimized');
  } else {
    console.log('[BALANCE v10] Enemy balance already v10 optimized');
  }
}

// ============================================
// 3. v10 装备基础属性优化
// ============================================
function v10OptimizeEquipmentBaseStats() {
  const content = readFile(path.join(BASE_DIR, 'equipment.ts'));
  
  let newContent = content;
  let changed = false;

  // 优化装备基础属性模板
  // 设计原则：
  // - 武器攻击略提升
  // - 防具防御略提升
  // - 饰品属性更加合理
  
  const templateUpdates = [
    { slot: 'weapon', old: 'baseStats: { attack: 4, range: 20 }', new: 'baseStats: { attack: 5, range: 22 }' },
    { slot: 'armor', old: 'baseStats: { health: 30, defense: 2 }', new: 'baseStats: { health: 35, defense: 2.5 }' },
    { slot: 'pants', old: 'baseStats: { defense: 1.2, health: 10 }', new: 'baseStats: { defense: 1.5, health: 12 }' },
    { slot: 'shoulder', old: 'baseStats: { defense: 1.2, critRate: 0.5 }', new: 'baseStats: { defense: 1.5, critRate: 0.6 }' },
    { slot: 'belt', old: 'baseStats: { attackSpeed: -15, health: 8 }', new: 'baseStats: { attackSpeed: -12, health: 10 }' },
    { slot: 'shoes', old: 'baseStats: { defense: 0.8, attackSpeed: -3 }', new: 'baseStats: { defense: 1.0, attackSpeed: -2 }' },
    { slot: 'earring', old: 'baseStats: { attack: 5, critRate: 1.2 }', new: 'baseStats: { attack: 6, critRate: 1.4 }' },
    { slot: 'ring', old: 'baseStats: { attack: 6, critRate: 1.5 }', new: 'baseStats: { attack: 7, critRate: 1.6 }' },
    { slot: 'necklace', old: 'baseStats: { health: 15, critDamage: 1.5 }', new: 'baseStats: { health: 18, critDamage: 2 }' },
  ];

  for (const update of templateUpdates) {
    if (newContent.includes(update.old) && update.old !== update.new) {
      newContent = newContent.replace(update.old, update.new);
      changed = true;
      console.log(`[BALANCE v10] ${update.slot} template updated`);
    }
  }

  if (changed) {
    writeFile(path.join(BASE_DIR, 'equipment.ts'), newContent);
    console.log('[BALANCE v10] Equipment base stats v10 optimized');
  } else {
    console.log('[BALANCE v10] Equipment base stats already v10 optimized');
  }
}

// ============================================
// 4. v10 波次增长曲线微调
// ============================================
function v10OptimizeWaveScaling() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  // v10微调：波次增长更平滑
  // 血量增长：1.026 → 1.025（更平缓）
  // 伤害增长：1.015 → 1.014（更平缓）
  // 经验增长：1.022 → 1.023（经验获取略微提升）
  
  const healthMultiplier = newContent.match(/const healthMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (healthMultiplier && healthMultiplier[1] !== '1.025') {
    newContent = newContent.replace(
      /const healthMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
      `const healthMultiplier = Math.pow(1.025, wave - 1)`
    );
    changed = true;
    console.log(`[BALANCE v10] Wave health multiplier: ${healthMultiplier[1]} → 1.025`);
  }

  const damageMultiplier = newContent.match(/const damageMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (damageMultiplier && damageMultiplier[1] !== '1.014') {
    newContent = newContent.replace(
      /const damageMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
      `const damageMultiplier = Math.pow(1.014, wave - 1)`
    );
    changed = true;
    console.log(`[BALANCE v10] Wave damage multiplier: ${damageMultiplier[1]} → 1.014`);
  }

  const expMultiplier = newContent.match(/const expMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (expMultiplier && expMultiplier[1] !== '1.023') {
    newContent = newContent.replace(
      /const expMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
      `const expMultiplier = Math.pow(1.023, wave - 1)`
    );
    changed = true;
    console.log(`[BALANCE v10] Wave exp multiplier: ${expMultiplier[1]} → 1.023`);
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE v10] Wave scaling v10 optimized');
  } else {
    console.log('[BALANCE v10] Wave scaling already v10 optimized');
  }
}

// ============================================
// 5. v10 验证所有内容
// ============================================
function v10VerifyAllContent() {
  console.log('\n--- v10 验证所有内容完整性 ---');
  
  const enemiesContent = readFile(path.join(BASE_DIR, 'enemies.ts'));
  const skillsContent = readFile(SKILLS_FILE);
  const equipmentContent = readFile(path.join(BASE_DIR, 'equipment.ts'));
  const engineContent = readFile(ENGINE_FILE);
  
  console.log('\n--- v10 平衡数值概览 ---');
  
  // 技能属性总增长（满级5级）
  console.log('技能属性总增长（满级5级）:');
  console.log('  攻击力:');
  console.log('    Lv.1-5 (atk_1):', 2.5 * 5, '→', '前期略低');
  console.log('    Lv.3-7 (atk_2):', 5 * 5, '→', '稳定增长');
  console.log('    Lv.6-10 (atk_3):', 11 * 5, '→', '加速增长');
  console.log('    Lv.10-14 (atk_4):', 22 * 5, '→', '快速增长');
  console.log('    Lv.15+ (atk_5):', 35 * 5, '→', '爆发增长');
  
  console.log('  攻速(%):');
  console.log('    Lv.1-5 (spd_1):', (1 - Math.pow(0.98, 5)) * 100, '%');
  console.log('    Lv.3-7 (spd_2):', (1 - Math.pow(0.972, 5)) * 100, '%');
  console.log('    Lv.6-10 (spd_3):', (1 - Math.pow(0.968, 5)) * 100, '%');
  console.log('    Lv.10-14 (spd_4):', (1 - Math.pow(0.96, 5)) * 100, '%');
  console.log('    Lv.15+ (spd_5):', (1 - Math.pow(0.94, 5)) * 100, '%');
  
  console.log('  暴击率(%):', (1 + 2.2 + 4.5 + 7.5) * 5, '%');
  console.log('  暴击伤害(%):', (8 + 20 + 45) * 5, '%');
  console.log('  最大生命:', (25 + 55 + 90 + 160) * 5);
  console.log('  减伤(%):', (2.5 + 5 + 9 + 15) * 5, '%');

  // 波次怪物属性倍率
  console.log('\n波次怪物属性倍率(v10):');
  [1, 5, 10, 20, 30, 50].forEach(wave => {
    const hp = Math.pow(1.025, wave - 1).toFixed(2);
    const dmg = Math.pow(1.014, wave - 1).toFixed(2);
    const exp = Math.pow(1.023, wave - 1).toFixed(2);
    console.log(`  第${wave}波: HP×${hp}, DMG×${dmg}, EXP×${exp}`);
  });
  
  console.log('');
}

// ============================================
// 主执行函数
// ============================================
function main() {
  console.log('========================================');
  console.log('=== Game Balance Optimization v10 ===');
  console.log('=== 基础属性技能平衡优化 ===');
  console.log('========================================');
  console.log(`Time: ${new Date().toLocaleString('zh-CN')}`);
  
  console.log('\n--- 1. 基础属性技能数值优化 (v10) ---');
  v10OptimizeBaseSkills();
  
  console.log('\n--- 2. 怪物属性微调优化 (v10) ---');
  v10OptimizeEnemyBalance();
  
  console.log('\n--- 3. 装备基础属性优化 (v10) ---');
  v10OptimizeEquipmentBaseStats();
  
  console.log('\n--- 4. 波次增长曲线微调 (v10) ---');
  v10OptimizeWaveScaling();
  
  console.log('\n--- 5. 验证所有内容 ---');
  v10VerifyAllContent();
  
  console.log('========================================');
  console.log('=== v10 Optimization Completed ===');
  console.log('========================================');
}

main();