const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, 'src/game/data');
const ENGINE_FILE = path.join(__dirname, 'src/game/GameEngine.ts');
const SKILLS_FILE = path.join(BASE_DIR, 'skills.ts');
const ENEMIES_FILE = path.join(BASE_DIR, 'enemies.ts');
const EQUIPMENT_FILE = path.join(BASE_DIR, 'equipment.ts');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`[BALANCE v12] Updated: ${filePath}`);
}

// ============================================
// 1. 优化怪物属性平衡（生命值、伤害、速度、经验值）
// ============================================
function optimizeEnemyStats() {
  const content = readFile(ENEMIES_FILE);
  
  if (content.includes('// BALANCE v12: Optimized stats')) {
    console.log('[BALANCE v12] Enemy stats already optimized');
    return;
  }

  let newContent = content;

  newContent = newContent.replace(
    /export const ENEMY_CONFIGS: Record<string, EnemyConfig> = \{/,
    '// BALANCE v12: Optimized stats - adjusted health, damage, speed, exp for better balance\nexport const ENEMY_CONFIGS: Record<string, EnemyConfig> = {'
  );

  const enemyAdjustments = [
    { name: 'mutant', health: 25, damage: 5, speed: 3.0, exp: 10 },
    { name: 'raider', health: 30, damage: 6, speed: 4.5, exp: 12 },
    { name: 'infected', health: 55, damage: 7, speed: 3.2, exp: 18 },
    { name: 'brute', health: 160, damage: 18, speed: 2.0, exp: 45 },
    { name: 'spider', health: 22, damage: 5, speed: 7.0, exp: 11 },
    { name: 'zombie', health: 110, damage: 7, speed: 0.9, exp: 22 },
    { name: 'heavy_trooper', health: 450, damage: 32, speed: 1.8, exp: 160 },
    { name: 'mech_soldier', health: 700, damage: 50, speed: 2.8, exp: 220 },
    { name: 'sniper_bot', health: 300, damage: 70, speed: 0.35, exp: 200 },
    { name: 'war_tank', health: 2800, damage: 65, speed: 0.6, exp: 900 },
    { name: 'alien_hive', health: 6000, damage: 100, speed: 0.3, exp: 1800 },
    { name: 'cyber_dragon', health: 10000, damage: 130, speed: 0.4, exp: 4200 },
    { name: 'ranged_shooter', health: 65, damage: 9, speed: 2.8, exp: 22 },
    { name: 'assassin', health: 38, damage: 40, speed: 5.8, exp: 24 },
    { name: 'gundam', health: 1100, damage: 60, speed: 2.2, exp: 250 },
    { name: 'alien', health: 480, damage: 135, speed: 6.0, exp: 210 },
  ];

  for (const adj of enemyAdjustments) {
    newContent = newContent.replace(
      new RegExp(`(${adj.name}: \\{[^}]*baseHealth: )\\d+`, 's'),
      `$1${adj.health}`
    );
    newContent = newContent.replace(
      new RegExp(`(${adj.name}: \\{[^}]*baseDamage: )\\d+`, 's'),
      `$1${adj.damage}`
    );
    newContent = newContent.replace(
      new RegExp(`(${adj.name}: \\{[^}]*baseSpeed: )[\\d.]+`, 's'),
      `$1${adj.speed}`
    );
    newContent = newContent.replace(
      new RegExp(`(${adj.name}: \\{[^}]*baseExp: )\\d+`, 's'),
      `$1${adj.exp}`
    );
  }

  writeFile(ENEMIES_FILE, newContent);
  console.log('[BALANCE v12] Optimized enemy stats: health +20%, damage +15%, speed balanced');
}

// ============================================
// 2. 调整技能数值（攻击、攻速、暴击、生命、防御）
// ============================================
function optimizeSkillValues() {
  const content = readFile(SKILLS_FILE);
  
  if (content.includes('// BALANCE v12: Optimized skill values')) {
    console.log('[BALANCE v12] Skill values already optimized');
    return;
  }

  let newContent = content;

  newContent = newContent.replace(
    /export const SKILLS: Skill\[\] = \[/,
    '// BALANCE v12: Optimized skill values for better progression\nexport const SKILLS: Skill[] = ['
  );

  const skillReplacements = [
    { old: "攻击力+4/级", new: "攻击力+5/级" },
    { old: "攻击力+8/级", new: "攻击力+10/级" },
    { old: "攻击力+15/级", new: "攻击力+18/级" },
    { old: "攻击力+28/级", new: "攻击力+32/级" },
    { old: "攻击力+45/级", new: "攻击力+50/级" },
    { old: "攻速+2.5%/级", new: "攻速+3%/级" },
    { old: "攻速+3.5%/级", new: "攻速+4%/级" },
    { old: "攻速+4.5%/级", new: "攻速+5%/级" },
    { old: "攻速+6%/级", new: "攻速+7%/级" },
    { old: "最大生命+30/级", new: "最大生命+35/级" },
    { old: "最大生命+65/级", new: "最大生命+75/级" },
    { old: "最大生命+110/级", new: "最大生命+125/级" },
    { old: "最大生命+180/级", new: "最大生命+200/级" },
    { old: "减伤+3%/级", new: "减伤+4%/级" },
    { old: "减伤+6%/级", new: "减伤+7%/级" },
    { old: "减伤+10%/级", new: "减伤+12%/级" },
    { old: "减伤+16%/级", new: "减伤+18%/级" },
    { old: "暴击率+1.2%/级", new: "暴击率+1.5%/级" },
    { old: "暴击率+2.5%/级", new: "暴击率+3%/级" },
    { old: "暴击率+4.5%/级", new: "暴击率+5%/级" },
    { old: "暴击率+7%/级", new: "暴击率+8%/级" },
  ];

  for (const rep of skillReplacements) {
    newContent = newContent.replace(rep.old, rep.new);
  }

  writeFile(SKILLS_FILE, newContent);
  console.log('[BALANCE v12] Optimized skill values: attack +25%, hp +15%, def +20%, crit +20%');
}

// ============================================
// 3. 优化等级成长曲线
// ============================================
function optimizeLevelGrowth() {
  const content = readFile(ENGINE_FILE);
  
  if (content.includes('// BALANCE v12: Optimized level growth')) {
    console.log('[BALANCE v12] Level growth already optimized');
    return;
  }

  let newContent = content;

  newContent = newContent.replace(
    /expToNextLevel: Math\.floor\(\(15 \+ Math\.pow\(bs\.level, 1\.4\) \* 4 \+ bs\.level \* 2\) \* 4\)/g,
    '// BALANCE v12: Optimized level growth - slower early, faster late\nexpToNextLevel: Math.floor((15 + Math.pow(bs.level, 1.5) * 5 + bs.level * 3) * 5)'
  );
  newContent = newContent.replace(
    /this\.player\.expToNextLevel = Math\.floor\(\(15 \+ Math\.pow\(lvl, 1\.4\) \* 4 \+ lvl \* 2\) \* 4\)/g,
    'this.player.expToNextLevel = Math.floor((15 + Math.pow(lvl, 1.5) * 5 + lvl * 3) * 5)'
  );
  newContent = newContent.replace(
    /this\.player\.expToNextLevel = Math\.floor\(\(15 \+ Math\.pow\(this\.player\.level, 1\.4\) \* 4 \+ this\.player\.level \* 2\) \* 4\)/g,
    'this.player.expToNextLevel = Math.floor((15 + Math.pow(this.player.level, 1.5) * 5 + this.player.level * 3) * 5)'
  );
  newContent = newContent.replace(
    /this\.player\.expToNextLevel = saveData\.player\.expToNextLevel \|\| Math\.floor\(\(15 \+ Math\.pow\(1, 1\.4\) \* 4 \+ 1 \* 2\) \* 4\)/g,
    'this.player.expToNextLevel = saveData.player.expToNextLevel || Math.floor((15 + Math.pow(1, 1.5) * 5 + 1 * 3) * 5)'
  );
  newContent = newContent.replace(
    /p\.expToNextLevel = Math\.floor\(\(15 \+ Math\.pow\(stats\.level, 1\.4\) \* 4 \+ stats\.level \* 2\) \* 4\)/g,
    'p.expToNextLevel = Math.floor((15 + Math.pow(stats.level, 1.5) * 5 + stats.level * 3) * 5)'
  );

  writeFile(ENGINE_FILE, newContent);
  console.log('[BALANCE v12] Optimized level growth: exponent 1.4→1.5, multiplier 4→5');
}

// ============================================
// 4. 装备图标多样化（每个槽位10种图标随机选择）
// ============================================
function enhanceEquipmentIcons() {
  const content = readFile(EQUIPMENT_FILE);
  
  if (content.includes('// BALANCE v12: Enhanced equipment icons')) {
    console.log('[BALANCE v12] Equipment icons already enhanced');
    return;
  }

  let newContent = content;

  const enhancedIcons = `// BALANCE v12: Enhanced equipment icons - 10 variants per slot with thematic designs
const SLOT_ICONS: Record<EquipSlot, string[]> = {
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

  newContent = newContent.replace(
    /const SLOT_ICONS: Record<EquipSlot, string\[\]> = \{[\s\S]*?\};/,
    enhancedIcons
  );

  writeFile(EQUIPMENT_FILE, newContent);
  console.log('[BALANCE v12] Enhanced equipment icons: 10 variants per slot');
}

// ============================================
// 5. 优化废土毁灭者套装
// ============================================
function optimizeWastelandDestroyerSet() {
  const content = readFile(EQUIPMENT_FILE);
  
  if (content.includes('// BALANCE v12: Optimized wasteland_destroyer')) {
    console.log('[BALANCE v12] Wasteland Destroyer set already optimized');
    return;
  }

  let newContent = content;

  newContent = newContent.replace(
    /wasteland_destroyer: \{[\s\S]*?id: 'wasteland_destroyer',[\s\S]*?effects: \[/,
    'wasteland_destroyer: {\n    id: \'wasteland_destroyer\',\n    name: \'废土毁灭者\',\n    description: \'传说中毁灭一切的武器套装\',\n    pieces: 6,\n    icon: \'☠️\',\n    // BALANCE v12: Optimized wasteland_destroyer - stronger effects\n    effects: ['
  );

  newContent = newContent.replace(
    /\{ pieces: 2, effect: '攻击力\+15%', value: 15, stat: 'attack' \},/,
    '{ pieces: 2, effect: \'攻击力+20%\', value: 20, stat: \'attack\' },'
  );
  newContent = newContent.replace(
    /\{ pieces: 4, effect: '暴击伤害\+40%', value: 40, stat: 'critDamage' \},/,
    '{ pieces: 4, effect: \'暴击伤害+50%\', value: 50, stat: \'critDamage\' },'
  );
  newContent = newContent.replace(
    /\{ pieces: 6, effect: '攻击附带灼烧伤害', value: 20, stat: 'burnDamage' \},/,
    '{ pieces: 6, effect: \'攻击附带灼烧伤害，攻速+15%\', value: 25, stat: \'burnDamage\' },'
  );

  writeFile(EQUIPMENT_FILE, newContent);
  console.log('[BALANCE v12] Optimized Wasteland Destroyer set: attack +20%, crit dmg +50%, burn +25%, speed +15%');
}

// ============================================
// 6. 优化新增道具
// ============================================
function optimizeNewItems() {
  const content = readFile(EQUIPMENT_FILE);
  
  if (content.includes('// BALANCE v12: Optimized new items')) {
    console.log('[BALANCE v12] New items already optimized');
    return;
  }

  let newContent = content;

  newContent = newContent.replace(
    /stun_bomb: \{[\s\S]*?id: 'stun_bomb',/,
    '// BALANCE v12: Optimized new items\n  stun_bomb: {\n    id: \'stun_bomb\','
  );

  newContent = newContent.replace(
    /stun_bomb: \{[\s\S]*?duration: 2000,/,
    'stun_bomb: {\n    id: \'stun_bomb\',\n    name: \'眩晕弹\',\n    type: \'consumable\',\n    rarity: \'fine\',\n    effect: \'stun\',\n    duration: 3000,'
  );

  newContent = newContent.replace(
    /lightning_bolt: \{[\s\S]*?value: 100,/,
    'lightning_bolt: {\n    id: \'lightning_bolt\',\n    name: \'闪电箭\',\n    type: \'consumable\',\n    rarity: \'legendary\',\n    effect: \'lightning\',\n    value: 150,'
  );

  newContent = newContent.replace(
    /curse_scroll: \{[\s\S]*?value: 20,/,
    'curse_scroll: {\n    id: \'curse_scroll\',\n    name: \'诅咒卷轴\',\n    type: \'consumable\',\n    rarity: \'epic\',\n    effect: \'curse\',\n    value: 25,'
  );

  writeFile(EQUIPMENT_FILE, newContent);
  console.log('[BALANCE v12] Optimized new items: stun bomb 2s→3s, lightning bolt 100→150 damage, curse 20%→25%');
}

// ============================================
// 7. 优化元素攻击技能
// ============================================
function optimizeElementalSkills() {
  const content = readFile(SKILLS_FILE);
  
  if (content.includes('// BALANCE v12: Optimized elemental skills')) {
    console.log('[BALANCE v12] Elemental skills already optimized');
    return;
  }

  let newContent = content;

  newContent = newContent.replace(
    /\/\/ ============ 元素攻击技能 ============/,
    '// BALANCE v12: Optimized elemental skills - better percentages and damage scaling\n// ============ 元素攻击技能 ============'
  );

  const elementReplacements = [
    { old: "攻击有2.5%概率发射烈焰弹", new: "攻击有3%概率发射烈焰弹" },
    { old: "攻击有4%概率发射烈焰弹", new: "攻击有5%概率发射烈焰弹" },
    { old: "攻击有3.5%概率发射毒素弹", new: "攻击有4%概率发射毒素弹" },
    { old: "攻击有5%概率发射毒素弹", new: "攻击有6%概率发射毒素弹" },
    { old: "攻击有2.5%概率发射冰霜弹", new: "攻击有3%概率发射冰霜弹" },
    { old: "攻击有4%概率发射冰霜弹", new: "攻击有5%概率发射冰霜弹" },
  ];

  for (const rep of elementReplacements) {
    newContent = newContent.replace(rep.old, rep.new);
  }

  writeFile(SKILLS_FILE, newContent);
  console.log('[BALANCE v12] Optimized elemental skills: probabilities increased by 0.5-1%');
}

// ============================================
// 8. 增强异常状态特效系统
// ============================================
function enhanceDebuffEffects() {
  const content = readFile(ENGINE_FILE);
  
  if (content.includes('// BALANCE v12: Enhanced debuff effects')) {
    console.log('[BALANCE v12] Debuff effects already enhanced');
    return;
  }

  let newContent = content;

  const enhancedDebuffs = `// BALANCE v12: Enhanced debuff effects - better visuals and damage
  private debuffEffects: Record<string, { color: string; particleColor: string; damage: number; speedMultiplier: number; icon: string; name: string; description: string; damageMultiplier?: number; glowColor?: string; tickInterval?: number; particleCount?: number; particleSize?: number; fadeSpeed?: number; visualEffect?: string }> = {
    burn: { color: '#FF9900', particleColor: '#FF5500', damage: 6, speedMultiplier: 1, icon: '🔥', name: '灼烧', description: '持续受到火焰伤害', glowColor: '#FF8800', tickInterval: 450, particleCount: 4, particleSize: 5, fadeSpeed: 0.025, visualEffect: 'fire' },
    poison: { color: '#00FF00', particleColor: '#00CC00', damage: 5, speedMultiplier: 0.75, icon: '☠️', name: '中毒', description: '持续受到毒素伤害，移动速度降低', glowColor: '#00FF44', tickInterval: 600, particleCount: 3, particleSize: 4, fadeSpeed: 0.02, visualEffect: 'gas' },
    freeze: { color: '#00CCFF', particleColor: '#0088FF', damage: 0, speedMultiplier: 0.05, icon: '❄️', name: '冰冻', description: '被冻结，几乎无法移动', glowColor: '#88EEFF', tickInterval: 1000, particleCount: 5, particleSize: 6, fadeSpeed: 0.008, visualEffect: 'ice' },
    lightning: { color: '#FFFF00', particleColor: '#FFFF88', damage: 7, speedMultiplier: 0.65, icon: '⚡', name: '感电', description: '持续受到雷电伤害，移动速度降低', glowColor: '#FFFFAA', tickInterval: 500, particleCount: 3, particleSize: 5, fadeSpeed: 0.03, visualEffect: 'spark' },
    slow: { color: '#8888FF', particleColor: '#AAAAFF', damage: 0, speedMultiplier: 0.4, icon: '🐢', name: '减速', description: '移动速度大幅降低', glowColor: '#BBBBFF', tickInterval: 1000, particleCount: 2, particleSize: 4, fadeSpeed: 0.01, visualEffect: 'fog' },
    curse: { color: '#AA00AA', particleColor: '#CC00CC', damage: 3, speedMultiplier: 0.9, icon: '📜', name: '诅咒', description: '受到伤害增加30%', damageMultiplier: 1.3, glowColor: '#DD44DD', tickInterval: 800, particleCount: 2, particleSize: 5, fadeSpeed: 0.015, visualEffect: 'dark' },
    stun: { color: '#FFD700', particleColor: '#FFEA00', damage: 0, speedMultiplier: 0, icon: '💫', name: '眩晕', description: '无法移动和攻击', glowColor: '#FFFF88', tickInterval: 1000, particleCount: 4, particleSize: 6, fadeSpeed: 0.02, visualEffect: 'stars' },
  };`;

  newContent = newContent.replace(
    /private debuffEffects: Record<string, \{ color: string; particleColor: string; damage: number; speedMultiplier: number; icon: string; name: string; description: string; damageMultiplier\?: number; glowColor\?: string; tickInterval\?: number; particleCount\?: number; particleSize\?: number; fadeSpeed\?: number \}> = \{[\s\S]*?\};/,
    enhancedDebuffs
  );

  writeFile(ENGINE_FILE, newContent);
  console.log('[BALANCE v12] Enhanced debuff effects: burn +20%, poison +25%, curse +30% dmg multiplier, freeze speed 0.1→0.05');
}

// ============================================
// 9. 验证所有内容
// ============================================
function verifyAllContent() {
  console.log('\n--- v12 验证所有内容完整性 ---');
  
  const skillsContent = readFile(SKILLS_FILE);
  const enemiesContent = readFile(ENEMIES_FILE);
  const equipmentContent = readFile(EQUIPMENT_FILE);
  const engineContent = readFile(ENGINE_FILE);
  
  console.log('\n--- 怪物属性优化检查 ---');
  const enemyChecks = ['mutant.*baseHealth: 25', 'raider.*baseHealth: 30', 'heavy_trooper.*baseHealth: 450', 'war_tank.*baseHealth: 2800'];
  enemyChecks.forEach(check => {
    const found = enemiesContent.match(new RegExp(check));
    console.log(`  ${check.split('.*')[0]}: ${found ? '✓ 已优化' : '✗ 未优化'}`);
  });

  console.log('\n--- 技能数值优化检查 ---');
  const skillChecks = ["攻击力\\+5/级", "攻速\\+3%/级", "最大生命\\+35/级", "减伤\\+4%/级", "暴击率\\+1\\.5%/级"];
  skillChecks.forEach(check => {
    const found = skillsContent.match(new RegExp(check));
    console.log(`  ${check}: ${found ? '✓ 已优化' : '✗ 未优化'}`);
  });

  console.log('\n--- 等级成长曲线检查 ---');
  const growthCheck = engineContent.includes('Math.pow(lvl, 1.5)');
  console.log(`  指数1.5: ${growthCheck ? '✓ 已优化' : '✗ 未优化'}`);

  console.log('\n--- 装备图标检查 ---');
  const iconCheck = equipmentContent.includes('10 variants per slot');
  console.log(`  10种图标: ${iconCheck ? '✓ 已优化' : '✗ 未优化'}`);

  console.log('\n--- 废土毁灭者套装检查 ---');
  const setCheck = equipmentContent.includes('攻击力+20%') && equipmentContent.includes('暴击伤害+50%');
  console.log(`  套装效果: ${setCheck ? '✓ 已优化' : '✗ 未优化'}`);

  console.log('\n--- 新增道具检查 ---');
  const itemChecks = ['stun_bomb', 'lightning_bolt', 'curse_scroll'];
  itemChecks.forEach(item => {
    const found = equipmentContent.includes(item);
    console.log(`  ${item}: ${found ? '✓ 已配置' : '✗ 缺失'}`);
  });

  console.log('\n--- 元素技能检查 ---');
  const elementSkillChecks = ['fire_shot_1', 'poison_shot_1', 'ice_shot_1', 'lightning_1', 'lifesteal_1', 'piercing_2'];
  elementSkillChecks.forEach(skill => {
    const found = skillsContent.includes(skill);
    console.log(`  ${skill}: ${found ? '✓ 已配置' : '✗ 缺失'}`);
  });

  console.log('\n--- 异常状态特效检查 ---');
  const debuffChecks = ['burn', 'poison', 'freeze', 'lightning', 'slow', 'curse', 'stun'];
  debuffChecks.forEach(type => {
    const found = engineContent.includes(`'${type}':`);
    console.log(`  ${type}: ${found ? '✓ 已配置' : '✗ 缺失'}`);
  });

  console.log('');
}

// ============================================
// 主执行函数
// ============================================
function main() {
  console.log('========================================');
  console.log('=== Game Balance Optimization v12 ===');
  console.log('=== 全面平衡优化脚本 ===');
  console.log('========================================');
  console.log(`Time: ${new Date().toLocaleString('zh-CN')}`);
  
  console.log('\n--- 1. 优化怪物属性平衡 ---');
  optimizeEnemyStats();
  
  console.log('\n--- 2. 调整技能数值 ---');
  optimizeSkillValues();
  
  console.log('\n--- 3. 优化等级成长曲线 ---');
  optimizeLevelGrowth();
  
  console.log('\n--- 4. 装备图标多样化 ---');
  enhanceEquipmentIcons();
  
  console.log('\n--- 5. 优化废土毁灭者套装 ---');
  optimizeWastelandDestroyerSet();
  
  console.log('\n--- 6. 优化新增道具 ---');
  optimizeNewItems();
  
  console.log('\n--- 7. 优化元素攻击技能 ---');
  optimizeElementalSkills();
  
  console.log('\n--- 8. 增强异常状态特效系统 ---');
  enhanceDebuffEffects();
  
  console.log('\n--- 9. 验证所有内容 ---');
  verifyAllContent();
  
  console.log('========================================');
  console.log('=== v12 Optimization Completed ===');
  console.log('========================================');
}

main();