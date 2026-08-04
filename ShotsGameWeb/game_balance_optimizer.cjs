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
  console.log(`[BALANCE] Updated: ${filePath}`);
}

function optimizeEnemyBalance() {
  const content = readFile(ENEMIES_FILE);
  
  const enemyBalance = {
    mutant: { health: 25, speed: 5.0, damage: 4, exp: 4 },
    raider: { health: 40, speed: 6.5, damage: 7, exp: 8 },
    infected: { health: 60, speed: 5.8, damage: 10, exp: 12 },
    brute: { health: 100, speed: 4.5, damage: 16, exp: 20 },
    spider: { health: 30, speed: 7.5, damage: 6, exp: 10 },
    zombie: { health: 80, speed: 2.5, damage: 8, exp: 14 },
    heavy_trooper: { health: 350, speed: 4.2, damage: 28, exp: 80 },
    mech_soldier: { health: 550, speed: 6.0, damage: 42, exp: 150 },
    sniper_bot: { health: 220, speed: 2.2, damage: 45, exp: 125 },
    war_tank: { health: 2200, speed: 2.2, damage: 55, exp: 480 },
    alien_hive: { health: 3800, speed: 1.4, damage: 75, exp: 820 },
    cyber_dragon: { health: 6500, speed: 1.3, damage: 105, exp: 2200 },
  };

  let newContent = content;
  let changed = false;
  
  for (const [enemy, stats] of Object.entries(enemyBalance)) {
    const enemyPattern = new RegExp(`${enemy}:\\s*\\{[\\s\\S]*?\\}`);
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
      }
    }
  }

  if (changed) {
    writeFile(ENEMIES_FILE, newContent);
    console.log('[BALANCE] Enemy balance optimized (v2)');
  } else {
    console.log('[BALANCE] Enemy balance already optimized (v2)');
  }
}

function optimizeSkills() {
  const content = readFile(SKILLS_FILE);

  const skillTargets = {
    'atk_1': '攻击力+10/级', 'atk_2': '攻击力+16/级', 'atk_3': '攻击力+25/级',
    'atk_4': '攻击力+38/级', 'atk_5': '攻击力+55/级',
    'spd_1': '攻速+9%/级', 'spd_2': '攻速+14%/级', 'spd_3': '攻速+20%/级',
    'spd_4': '攻速+28%/级', 'spd_5': '攻速+38%/级',
    'rng_1': '射程+50/级', 'rng_2': '射程+80/级', 'rng_3': '射程+120/级', 'rng_4': '射程+160/级',
    'crit_1': '暴击率+5%/级', 'crit_2': '暴击率+8%/级', 'crit_3': '暴击率+11%/级', 'crit_4': '暴击率+14%/级',
    'cdmg_1': '暴击伤害+25%/级', 'cdmg_2': '暴击伤害+40%/级', 'cdmg_3': '暴击伤害+60%/级',
    'hp_1': '最大生命+55/级', 'hp_2': '最大生命+110/级', 'hp_3': '最大生命+170/级', 'hp_4': '最大生命+300/级',
    'def_1': '减伤+7%/级', 'def_2': '减伤+14%/级', 'def_3': '减伤+21%/级', 'def_4': '减伤+28%/级',
  };

  let newContent = content;
  let changed = false;

  for (const [skillId, targetDesc] of Object.entries(skillTargets)) {
    const regex = new RegExp(`(createSkill\\('${skillId}',[^,]+,[^,]+,\\s*')([^']+)(')`);
    const match = newContent.match(regex);
    if (match && match[2] !== targetDesc) {
      newContent = newContent.replace(match[0], match[1] + targetDesc + match[3]);
      changed = true;
    }
  }

  if (changed) {
    writeFile(SKILLS_FILE, newContent);
    console.log('[BALANCE] Skill descriptions optimized (v2)');
  } else {
    console.log('[BALANCE] Skill descriptions already optimized (v2)');
  }
}

function optimizeSkillValuesInEngine() {
  const content = readFile(ENGINE_FILE);
  
  const skillValuePatterns = [
    { id: 'atk_1', pattern: /case 'atk_1': attack \+= (\d+) \* lvl;/, value: 10, template: "case 'atk_1': attack += VAL * lvl;" },
    { id: 'atk_2', pattern: /case 'atk_2': attack \+= (\d+) \* lvl;/, value: 16, template: "case 'atk_2': attack += VAL * lvl;" },
    { id: 'atk_3', pattern: /case 'atk_3': attack \+= (\d+) \* lvl;/, value: 25, template: "case 'atk_3': attack += VAL * lvl;" },
    { id: 'atk_4', pattern: /case 'atk_4': attack \+= (\d+) \* lvl;/, value: 38, template: "case 'atk_4': attack += VAL * lvl;" },
    { id: 'atk_5', pattern: /case 'atk_5': attack \+= (\d+) \* lvl;/, value: 55, template: "case 'atk_5': attack += VAL * lvl;" },
    { id: 'spd_1', pattern: /case 'spd_1': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, value: 0.09, template: "case 'spd_1': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_2', pattern: /case 'spd_2': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, value: 0.14, template: "case 'spd_2': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_3', pattern: /case 'spd_3': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, value: 0.20, template: "case 'spd_3': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_4', pattern: /case 'spd_4': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, value: 0.28, template: "case 'spd_4': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'spd_5', pattern: /case 'spd_5': attackSpeed = Math\.floor\(attackSpeed \* \(1 - ([\d.]+) \* lvl\)\);/, value: 0.38, template: "case 'spd_5': attackSpeed = Math.floor(attackSpeed * (1 - VAL * lvl));" },
    { id: 'rng_1', pattern: /case 'rng_1': range \+= (\d+) \* lvl;/, value: 50, template: "case 'rng_1': range += VAL * lvl;" },
    { id: 'rng_2', pattern: /case 'rng_2': range \+= (\d+) \* lvl;/, value: 80, template: "case 'rng_2': range += VAL * lvl;" },
    { id: 'rng_3', pattern: /case 'rng_3': range \+= (\d+) \* lvl;/, value: 120, template: "case 'rng_3': range += VAL * lvl;" },
    { id: 'rng_4', pattern: /case 'rng_4': range \+= (\d+) \* lvl;/, value: 160, template: "case 'rng_4': range += VAL * lvl;" },
    { id: 'crit_1', pattern: /case 'crit_1': critRate \+= (\d+) \* lvl;/, value: 5, template: "case 'crit_1': critRate += VAL * lvl;" },
    { id: 'crit_2', pattern: /case 'crit_2': critRate \+= (\d+) \* lvl;/, value: 8, template: "case 'crit_2': critRate += VAL * lvl;" },
    { id: 'crit_3', pattern: /case 'crit_3': critRate \+= (\d+) \* lvl;/, value: 11, template: "case 'crit_3': critRate += VAL * lvl;" },
    { id: 'crit_4', pattern: /case 'crit_4': critRate \+= (\d+) \* lvl;/, value: 14, template: "case 'crit_4': critRate += VAL * lvl;" },
    { id: 'cdmg_1', pattern: /case 'cdmg_1': critDamage \+= (\d+) \* lvl;/, value: 25, template: "case 'cdmg_1': critDamage += VAL * lvl;" },
    { id: 'cdmg_2', pattern: /case 'cdmg_2': critDamage \+= (\d+) \* lvl;/, value: 40, template: "case 'cdmg_2': critDamage += VAL * lvl;" },
    { id: 'cdmg_3', pattern: /case 'cdmg_3': critDamage \+= (\d+) \* lvl;/, value: 60, template: "case 'cdmg_3': critDamage += VAL * lvl;" },
    { id: 'hp_1', pattern: /case 'hp_1': maxHealth \+= (\d+) \* lvl;/, value: 55, template: "case 'hp_1': maxHealth += VAL * lvl;" },
    { id: 'hp_2', pattern: /case 'hp_2': maxHealth \+= (\d+) \* lvl;/, value: 110, template: "case 'hp_2': maxHealth += VAL * lvl;" },
    { id: 'hp_3', pattern: /case 'hp_3': maxHealth \+= (\d+) \* lvl;/, value: 170, template: "case 'hp_3': maxHealth += VAL * lvl;" },
    { id: 'hp_4', pattern: /case 'hp_4': maxHealth \+= (\d+) \* lvl;/, value: 300, template: "case 'hp_4': maxHealth += VAL * lvl;" },
    { id: 'def_1', pattern: /case 'def_1': defense \+= (\d+) \* lvl;/, value: 7, template: "case 'def_1': defense += VAL * lvl;" },
    { id: 'def_2', pattern: /case 'def_2': defense \+= (\d+) \* lvl;/, value: 14, template: "case 'def_2': defense += VAL * lvl;" },
    { id: 'def_3', pattern: /case 'def_3': defense \+= (\d+) \* lvl;/, value: 21, template: "case 'def_3': defense += VAL * lvl;" },
    { id: 'def_4', pattern: /case 'def_4': defense \+= (\d+) \* lvl;/, value: 28, template: "case 'def_4': defense += VAL * lvl;" },
  ];

  let newContent = content;
  let changed = false;

  for (const skill of skillValuePatterns) {
    const match = newContent.match(skill.pattern);
    if (match && match[1] !== String(skill.value)) {
      const replacement = skill.template.replace('VAL', String(skill.value));
      newContent = newContent.replace(skill.pattern, replacement);
      changed = true;
    }
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE] Skill values in engine optimized (v2)');
  } else {
    console.log('[BALANCE] Skill values in engine already optimized (v2)');
  }
}

function optimizeLevelScaling() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  const expFormula = content.match(/this\.player\.expToNextLevel = Math\.floor\(([^;]+)\)/);
  if (expFormula) {
    const oldFormula = expFormula[1];
    const newFormula = '45 + Math.pow(lvl, 1.55) * 8 + lvl * 10';
    if (oldFormula !== newFormula) {
      newContent = newContent.replace(
        /this\.player\.expToNextLevel = Math\.floor\([^;]+\)/,
        `this.player.expToNextLevel = Math.floor(${newFormula})`
      );
      changed = true;
    }
  }

  const targetInitialExp = 'expToNextLevel: Math.floor(45 + Math.pow(100, 1.55) * 8 + 100 * 10),';
  if (!content.includes(targetInitialExp)) {
    newContent = newContent.replace(
      /expToNextLevel: Math\.floor\([^\n]+\),/,
      targetInitialExp
    );
    changed = true;
  }

  const levelBonus = content.match(/const levelBonus = Math\.max\(0, \(this\.player\.level - (\d+)\)\) \* ([\d.]+)/);
  if (levelBonus) {
    const oldStart = levelBonus[1];
    const oldMult = levelBonus[2];
    const newStart = '1';
    const newMult = '0.045';
    if (oldStart !== newStart || oldMult !== newMult) {
      newContent = newContent.replace(
        /const levelBonus = Math\.max\(0, \(this\.player\.level - \d+\)\) \* [\d.]+/,
        `const levelBonus = Math.max(0, (this.player.level - ${newStart})) * ${newMult}`
      );
      changed = true;
    }
  }

  const healthBonusMult = content.match(/maxHealth = Math\.floor\(maxHealth \* \(1 \+ levelBonus \* ([\d.]+)\)\)/);
  if (healthBonusMult) {
    const oldMult = healthBonusMult[1];
    const newMult = '1.1';
    if (oldMult !== newMult) {
      newContent = newContent.replace(
        /maxHealth = Math\.floor\(maxHealth \* \(1 \+ levelBonus \* [\d.]+\)\)/,
        `maxHealth = Math.floor(maxHealth * (1 + levelBonus * ${newMult}))`
      );
      changed = true;
    }
  }

  const healthMultiplier = content.match(/const healthMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (healthMultiplier) {
    const oldPow = healthMultiplier[1];
    const newPow = '1.05';
    if (oldPow !== newPow) {
      newContent = newContent.replace(
        /const healthMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const healthMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
    }
  }

  const damageMultiplier = content.match(/const damageMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (damageMultiplier) {
    const oldPow = damageMultiplier[1];
    const newPow = '1.035';
    if (oldPow !== newPow) {
      newContent = newContent.replace(
        /const damageMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const damageMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
    }
  }

  const speedMultiplier = content.match(/const speedMultiplier = 1 \+ Math\.min\(([\d.]+), \(wave - 1\) \* ([\d.]+)\)/);
  if (speedMultiplier) {
    const oldMin = speedMultiplier[1];
    const oldMult = speedMultiplier[2];
    const newMin = '0.5';
    const newMultVal = '0.006';
    if (oldMin !== newMin || oldMult !== newMultVal) {
      newContent = newContent.replace(
        /const speedMultiplier = 1 \+ Math\.min\([\d.]+, \(wave - 1\) \* [\d.]+\)/,
        `const speedMultiplier = 1 + Math.min(${newMin}, (wave - 1) * ${newMultVal})`
      );
      changed = true;
    }
  }

  const expMultiplier = content.match(/const expMultiplier = Math\.pow\(([\d.]+), wave - 1\)/);
  if (expMultiplier) {
    const oldPow = expMultiplier[1];
    const newPow = '1.05';
    if (oldPow !== newPow) {
      newContent = newContent.replace(
        /const expMultiplier = Math\.pow\([\d.]+, wave - 1\)/,
        `const expMultiplier = Math.pow(${newPow}, wave - 1)`
      );
      changed = true;
    }
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE] Level scaling optimized (v2)');
  } else {
    console.log('[BALANCE] Level scaling already optimized (v2)');
  }
}

function enhanceEquipmentIcons() {
  const content = readFile(EQUIPMENT_FILE);
  
  if (content.includes('const SLOT_ICONS: Record<EquipSlot, string[]>')) {
    console.log('[BALANCE] Equipment icons already enhanced with 10 variants per slot');
    return;
  }

  if (content.includes('const SLOT_ICONS: Record<EquipSlot, string>')) {
    const newIcons = `const SLOT_ICONS: Record<EquipSlot, string[]> = {
  weapon: ['🔫', '⚔️', '🏹', '🗡️', '💣', '🎯', '🔪', '🪓', '⚙️', '🔧'],
  armor: ['🛡️', '🦺', '👕', '🦾', '🔰', '🏋️', '🧥', '🪖', '💠', '⚙️'],
  pants: ['👖', '🩳', '🦵', '🎽', '🩱', '🦸', '🦹', '⚔️', '🛡️', '💎'],
  shoulder: ['🦴', '💀', '🪖', '🎩', '⛑️', '🔔', '🎭', '🦾', '⚙️', '💠'],
  belt: ['💼', '👜', '🎒', '📦', '🗝️', '🔑', '⛓️', '🔗', '⚙️', '💎'],
  shoes: ['👢', '👟', '🥾', '🥿', '🚀', '⚡', '🔥', '💨', '🦶', '👠'],
  earring: ['🎧', '💎', '🔔', '🎵', '🎶', '🪈', '🔊', '🎙️', '🎚️', '🎛️'],
  ring: ['💍', '🪙', '⭕', '🔘', '⚫', '🔴', '🟡', '🟢', '🔵', '🟣'],
  necklace: ['📿', '⛓️', '🪢', '💠', '🔮', '🎀', '🎗️', '🏷️', '💝', '💞'],
};`;

    let updatedContent = content.replace(
      /const SLOT_ICONS: Record<EquipSlot, string> = \{[\s\S]*?\};/,
      newIcons
    );

    updatedContent = updatedContent.replace(
      /icon: SLOT_ICONS\[slot\],/,
      `const icons = SLOT_ICONS[slot];
    const iconIndex = Math.floor(Math.random() * icons.length);
    icon: icons[iconIndex],
    iconVariant: iconIndex,`
    );

    writeFile(EQUIPMENT_FILE, updatedContent);
    console.log('[BALANCE] Enhanced equipment icons with multiple variants');
  } else {
    console.log('[BALANCE] Equipment icons already enhanced');
  }
}

function addNewEquipment() {
  const content = readFile(EQUIPMENT_FILE);
  
  if (content.includes('wasteland_destroyer')) {
    console.log('[BALANCE] Equipment set "废土毁灭者" already exists');
    return;
  }

  const newSet = `
  wasteland_destroyer: {
    id: 'wasteland_destroyer',
    name: '废土毁灭者',
    description: '传说中毁灭一切的武器套装',
    pieces: 6,
    icon: '☠️',
    effects: [
      { pieces: 2, effect: '攻击力+20%', value: 20, stat: 'attack' },
      { pieces: 4, effect: '暴击伤害+40%', value: 40, stat: 'critDamage' },
      { pieces: 6, effect: '攻击附带灼烧伤害', value: 15, stat: 'burnDamage' },
    ],
  },`;

  const updatedContent = content.replace(
    /raider:\s*\{[\s\S]*?\},\s*\}/,
    `raider: {
    id: 'raider',
    name: '掠夺者',
    description: '凶狠掠夺者的战斗装备',
    pieces: 6,
    icon: '💀',
    effects: [
      { pieces: 2, effect: '攻击速度+10%', value: 10, stat: 'attackSpeed' },
      { pieces: 4, effect: '攻击力+15%', value: 15, stat: 'attack' },
      { pieces: 6, effect: '吸血+10%', value: 10, stat: 'lifesteal' },
    ],
  },
  ${newSet}
}`
  );

  writeFile(EQUIPMENT_FILE, updatedContent);
  console.log('[BALANCE] Added new equipment set: 废土毁灭者');
}

function addNewItems() {
  const content = readFile(EQUIPMENT_FILE);
  
  if (content.includes('stun_bomb')) {
    console.log('[BALANCE] New items (眩晕弹, 闪电箭, 诅咒卷轴) already exist');
    return;
  }

  const newItems = `
  stun_bomb: {
    id: 'stun_bomb',
    name: '眩晕弹',
    type: 'consumable',
    rarity: 'fine',
    effect: 'stun',
    duration: 2500,
    icon: '💫',
    description: '使所有敌人眩晕2.5秒',
    cooldown: 0,
  },
  lightning_bolt: {
    id: 'lightning_bolt',
    name: '闪电箭',
    type: 'consumable',
    rarity: 'legendary',
    effect: 'lightning',
    value: 120,
    duration: 4000,
    icon: '⚡',
    description: '对所有敌人造成120伤害并感电4秒',
    cooldown: 0,
  },
  curse_scroll: {
    id: 'curse_scroll',
    name: '诅咒卷轴',
    type: 'consumable',
    rarity: 'epic',
    effect: 'curse',
    value: 25,
    duration: 10000,
    icon: '📜',
    description: '敌人受到伤害+25%，持续10秒',
    cooldown: 0,
  },`;

  const updatedContent = content.replace(
    /invincibility_mythic:\s*\{[\s\S]*?\},\s*\n\s*\}/,
    `invincibility_mythic: {
    id: 'invincibility_mythic',
    name: '神话无敌',
    type: 'consumable',
    rarity: 'mythic',
    effect: 'invincible',
    duration: 10000,
    icon: '🌟',
    description: '10秒内无敌',
    cooldown: 0,
  },
  ${newItems}
}`
  );

  writeFile(EQUIPMENT_FILE, updatedContent);
  console.log('[BALANCE] Added new items: 眩晕弹, 闪电箭, 诅咒卷轴');
}

function addNewSkills() {
  const content = readFile(SKILLS_FILE);
  
  if (content.includes('burn_1')) {
    console.log('[BALANCE] New skills already exist');
    return;
  }

  const newSkills = `
  createSkill('burn_1', '烈焰弹', '🔥', '攻击有6%概率使敌人灼烧3秒', 2, 5, ['atk_1'], 5),
  createSkill('burn_2', '烈焰风暴', '🌋', '攻击有10%概率使敌人灼烧5秒，伤害翻倍', 4, 10, ['burn_1', 'atk_2'], 5),
  
  createSkill('poison_1', '毒素射击', '☠️', '攻击有6%概率使敌人中毒3秒', 2, 5, ['atk_1'], 5),
  createSkill('poison_2', '致命毒素', '💀', '攻击有10%概率使敌人中毒5秒，伤害翻倍', 4, 10, ['poison_1', 'atk_2'], 5),
  
  createSkill('freeze_1', '冰霜弹', '❄️', '攻击有5%概率减缓敌人40%速度3秒', 2, 6, ['rng_1'], 5),
  createSkill('freeze_2', '绝对零度', '🧊', '攻击有8%概率冻结敌人2秒', 4, 11, ['freeze_1', 'rng_2'], 5),
  
  createSkill('lightning_1', '雷霆射击', '⚡', '攻击有6%概率触发感电，伤害链3个敌人', 3, 7, ['spd_1'], 5),
  createSkill('lightning_2', '万雷天牢', '🌩️', '攻击有10%概率触发感电，伤害链5个敌人', 5, 12, ['lightning_1', 'spd_2'], 5),
  
  createSkill('lifesteal_1', '吸血打击', '🩸', '攻击回复0.5%最大生命', 2, 6, ['hp_1'], 5),
  createSkill('lifesteal_2', '嗜血狂魔', '🔮', '攻击回复1.5%最大生命', 4, 11, ['lifesteal_1', 'hp_2'], 5),
  
  createSkill('piercing_1', '穿透射击', '🏹', '子弹穿透2个敌人', 2, 5, ['rng_1'], 5),
  createSkill('piercing_2', '穿云箭', '🌪️', '子弹穿透4个敌人', 4, 10, ['piercing_1', 'rng_2'], 5),`;

  const updatedContent = content.replace(
    /createSkill\('ultimate',/g,
    `${newSkills}

  createSkill('ultimate',`
  );

  writeFile(SKILLS_FILE, updatedContent);
  console.log('[BALANCE] Added new skills: 烈焰弹, 毒素射击, 冰霜弹, 雷霆射击, 吸血打击, 穿透射击');
}

function addDebuffEffectsToEngine() {
  const content = readFile(ENGINE_FILE);
  
  if (content.includes('debuffEffects')) {
    console.log('[BALANCE] Debuff effects system already exists');
    return;
  }

  const debuffEffects = `
  private debuffEffects: Record<string, { color: string; particleColor: string; damage: number; speedMultiplier: number; icon: string; name: string; description: string; damageMultiplier?: number; glowColor?: string }> = {
    burn: { color: '#FF6600', particleColor: '#FF4400', damage: 8, speedMultiplier: 1, icon: '🔥', name: '灼烧', description: '持续受到火焰伤害', glowColor: '#FF8800' },
    poison: { color: '#00FF00', particleColor: '#00CC00', damage: 6, speedMultiplier: 0.75, icon: '☠️', name: '中毒', description: '持续受到毒素伤害，移动速度降低', glowColor: '#00FF44' },
    freeze: { color: '#00CCFF', particleColor: '#0088FF', damage: 0, speedMultiplier: 0.05, icon: '❄️', name: '冰冻', description: '被冻结，几乎无法移动', glowColor: '#88EEFF' },
    lightning: { color: '#FFFF00', particleColor: '#FFFF88', damage: 8, speedMultiplier: 0.65, icon: '⚡', name: '感电', description: '持续受到雷电伤害，移动速度降低', glowColor: '#FFFFAA' },
    slow: { color: '#8888FF', particleColor: '#AAAAFF', damage: 0, speedMultiplier: 0.5, icon: '🐢', name: '减速', description: '移动速度大幅降低', glowColor: '#BBBBFF' },
    curse: { color: '#AA00AA', particleColor: '#CC00CC', damage: 3, speedMultiplier: 0.85, icon: '📜', name: '诅咒', description: '受到伤害增加25%', damageMultiplier: 1.25, glowColor: '#DD44DD' },
  };`;

  const updatedContent = content.replace(
    /private buffs: Buff\[\] = \[\];/,
    `private buffs: Buff[] = [];
  ${debuffEffects}`
  );

  writeFile(ENGINE_FILE, updatedContent);
  console.log('[BALANCE] Added debuff effects system to GameEngine');
}

function enhanceDamageEnemyWithElements() {
  const content = readFile(ENGINE_FILE);
  
  if (content.includes('applyEnemyDebuff')) {
    console.log('[BALANCE] applyEnemyDebuff method already exists');
    return;
  }

  const applyDebuffMethod = `
  private applyEnemyDebuff(type: string, damage: number, duration: number): void {
    const enemies = this.enemyPool.getActive();
    const effect = this.debuffEffects[type];
    if (!effect) return;
    
    for (const enemy of enemies) {
      const debuffs = (enemy as any).debuffs || [];
      const existingDebuff = debuffs.find((d: any) => d.type === type);
      
      if (existingDebuff) {
        existingDebuff.startTime = performance.now();
        existingDebuff.duration = duration;
        existingDebuff.damage = Math.max(existingDebuff.damage, damage);
        if (type === 'burn' || type === 'poison') {
          existingDebuff.stacks = (existingDebuff.stacks || 0) + 1;
        }
      } else {
        debuffs.push({
          type,
          damage,
          duration,
          startTime: performance.now(),
          stacks: type === 'burn' || type === 'poison' ? 1 : 0,
        });
      }
      (enemy as any).debuffs = debuffs;
    }
  }`;

  const updatedContent = content.replace(
    /private bossUseSkill/,
    `${applyDebuffMethod}

  private bossUseSkill`
  );

  writeFile(ENGINE_FILE, updatedContent);
  console.log('[BALANCE] Added applyEnemyDebuff method');
}

function optimizePlayerBaseStats() {
  const content = readFile(ENGINE_FILE);
  
  let newContent = content;
  let changed = false;

  const baseAttack = content.match(/attack: (\d+),/);
  if (baseAttack && baseAttack[1] !== '10') {
    newContent = newContent.replace(/attack: \d+,/, 'attack: 10,');
    changed = true;
  }

  const baseMaxHealth = content.match(/maxHealth: (\d+),/);
  if (baseMaxHealth && baseMaxHealth[1] !== '100') {
    newContent = newContent.replace(/maxHealth: \d+,/, 'maxHealth: 100,');
    changed = true;
  }

  if (changed) {
    writeFile(ENGINE_FILE, newContent);
    console.log('[BALANCE] Player base stats optimized');
  } else {
    console.log('[BALANCE] Player base stats already optimized');
  }
}

function runOptimization() {
  console.log('========================================');
  console.log('=== Game Balance Optimization v2 ===');
  console.log('========================================');
  console.log(`Time: ${new Date().toLocaleString()}`);
  
  try {
    optimizeEnemyBalance();
    optimizeSkills();
    optimizeSkillValuesInEngine();
    optimizeLevelScaling();
    optimizePlayerBaseStats();
    enhanceEquipmentIcons();
    addNewEquipment();
    addNewItems();
    addNewSkills();
    addDebuffEffectsToEngine();
    enhanceDamageEnemyWithElements();
    
    console.log('========================================');
    console.log('=== Optimization Completed Successfully ===');
    console.log('========================================');
  } catch (error) {
    console.error('========================================');
    console.error('=== Optimization Failed ===');
    console.error('========================================');
    console.error(error);
  }
}

if (require.main === module) {
  runOptimization();
}

module.exports = { runOptimization };
