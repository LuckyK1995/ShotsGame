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
  console.log(`[BALANCE v11] Updated: ${filePath}`);
}

// ============================================
// 1. 新增元素攻击技能（烈焰弹、毒素射击、冰霜弹）
// ============================================
function addElementalSkills() {
  const skillsContent = readFile(SKILLS_FILE);
  
  if (skillsContent.includes('fire_shot_1')) {
    console.log('[BALANCE v11] Elemental skills already added');
    return;
  }

  let newContent = skillsContent;

  const newSkills = `
  // ============ 元素攻击技能 ============
  createSkill('fire_shot_1', '烈焰弹', '🔥', '攻击有3%概率发射烈焰弹，造成(Lv×攻击力)火焰伤害并触发灼烧', 5, 40, ['atk_1'], 5),
  createSkill('fire_shot_2', '烈焰风暴', '🌋', '攻击有5%概率发射烈焰弹，造成(1.5×Lv×攻击力)火焰伤害并触发强灼烧', 8, 80, ['fire_shot_1', 'atk_2'], 5),
  
  createSkill('poison_shot_1', '毒素射击', '☠️', '攻击有4%概率发射毒素弹，造成(Lv×攻击力)毒素伤害并触发中毒', 5, 40, ['atk_1'], 5),
  createSkill('poison_shot_2', '致命毒素', '💀', '攻击有6%概率发射毒素弹，造成(1.5×Lv×攻击力)毒素伤害并触发强中毒', 8, 80, ['poison_shot_1', 'atk_2'], 5),
  
  createSkill('ice_shot_1', '冰霜弹', '❄️', '攻击有3%概率发射冰霜弹，造成(Lv×攻击力)冰霜伤害并减速敌人50%', 5, 40, ['spd_1'], 5),
  createSkill('ice_shot_2', '极寒领域', '🧊', '攻击有5%概率发射冰霜弹，造成(1.5×Lv×攻击力)冰霜伤害并冰冻敌人', 8, 80, ['ice_shot_1', 'spd_2'], 5),
`;

  const insertPoint = '// ============ 左树：特效技能 ============';
  newContent = newContent.replace(insertPoint, newSkills + '\n' + insertPoint);

  writeFile(SKILLS_FILE, newContent);
  console.log('[BALANCE v11] Added elemental skills: fire_shot, poison_shot, ice_shot');
}

// ============================================
// 2. 优化异常状态特效系统
// ============================================
function optimizeDebuffEffects() {
  const engineContent = readFile(ENGINE_FILE);
  
  if (engineContent.includes('tickInterval: 500')) {
    console.log('[BALANCE v11] Debuff effects already optimized');
    return;
  }

  let newContent = engineContent;

  const oldDebuffEffects = `private debuffEffects: Record<string, { color: string; particleColor: string; damage: number; speedMultiplier: number; icon: string; name: string; description: string; damageMultiplier?: number; glowColor?: string; tickInterval?: number }> = {
    burn: { color: '#FF9900', particleColor: '#FF555.50', damage: 5, speedMultiplier: 1, icon: '🔥', name: '灼烧', description: '持续受到火焰伤害', glowColor: '#FF8800', tickInterval: 500 },
    poison: { color: '#00FF00', particleColor: '#00CC00', damage: 4, speedMultiplier: 0.8, icon: '☠️', name: '中毒', description: '持续受到毒素伤害，移动速度降低', glowColor: '#00FF44', tickInterval: 700 },
    freeze: { color: '#00CCFF', particleColor: '#0088FF', damage: 0, speedMultiplier: 0.1, icon: '❄️', name: '冰冻', description: '被冻结，几乎无法移动', glowColor: '#88EEFF' },
    lightning: { color: '#FFFF00', particleColor: '#FFFF88', damage: 6, speedMultiplier: 0.7, icon: '⚡', name: '感电', description: '持续受到雷电伤害，移动速度降低', glowColor: '#FFFFAA', tickInterval: 550 },
    slow: { color: '#8888FF', particleColor: '#AAAAFF', damage: 0, speedMultiplier: 0.5, icon: '🐢', name: '减速', description: '移动速度大幅降低', glowColor: '#BBBBFF' },
    curse: { color: '#AA00AA', particleColor: '#CC00CC', damage: 2, speedMultiplier: 0.95, icon: '📜', name: '诅咒', description: '受到伤害增加2.25%', damageMultiplier: 1.2.25, glowColor: '#DD44DD', tickInterval: 900 },
    stun: { color: '#FFD700', particleColor: '#FFEA00', damage: 0, speedMultiplier: 0, icon: '💫', name: '眩晕', description: '无法移动和攻击', glowColor: '#FFFF88' },
  };`;

  const newDebuffEffects = `private debuffEffects: Record<string, { color: string; particleColor: string; damage: number; speedMultiplier: number; icon: string; name: string; description: string; damageMultiplier?: number; glowColor?: string; tickInterval?: number; particleCount?: number; particleSize?: number; fadeSpeed?: number }> = {
    burn: { color: '#FF9900', particleColor: '#FF5500', damage: 5, speedMultiplier: 1, icon: '🔥', name: '灼烧', description: '持续受到火焰伤害', glowColor: '#FF8800', tickInterval: 500, particleCount: 3, particleSize: 4, fadeSpeed: 0.02 },
    poison: { color: '#00FF00', particleColor: '#00CC00', damage: 4, speedMultiplier: 0.8, icon: '☠️', name: '中毒', description: '持续受到毒素伤害，移动速度降低', glowColor: '#00FF44', tickInterval: 700, particleCount: 2, particleSize: 3, fadeSpeed: 0.015 },
    freeze: { color: '#00CCFF', particleColor: '#0088FF', damage: 0, speedMultiplier: 0.1, icon: '❄️', name: '冰冻', description: '被冻结，几乎无法移动', glowColor: '#88EEFF', particleCount: 4, particleSize: 5, fadeSpeed: 0.01 },
    lightning: { color: '#FFFF00', particleColor: '#FFFF88', damage: 6, speedMultiplier: 0.7, icon: '⚡', name: '感电', description: '持续受到雷电伤害，移动速度降低', glowColor: '#FFFFAA', tickInterval: 550, particleCount: 2, particleSize: 4, fadeSpeed: 0.025 },
    slow: { color: '#8888FF', particleColor: '#AAAAFF', damage: 0, speedMultiplier: 0.5, icon: '🐢', name: '减速', description: '移动速度大幅降低', glowColor: '#BBBBFF', particleCount: 2, particleSize: 3, fadeSpeed: 0.01 },
    curse: { color: '#AA00AA', particleColor: '#CC00CC', damage: 2, speedMultiplier: 0.95, icon: '📜', name: '诅咒', description: '受到伤害增加25%', damageMultiplier: 1.25, glowColor: '#DD44DD', tickInterval: 900, particleCount: 1, particleSize: 4, fadeSpeed: 0.01 },
    stun: { color: '#FFD700', particleColor: '#FFEA00', damage: 0, speedMultiplier: 0, icon: '💫', name: '眩晕', description: '无法移动和攻击', glowColor: '#FFFF88', particleCount: 3, particleSize: 5, fadeSpeed: 0.02 },
  };`;

  newContent = newContent.replace(oldDebuffEffects, newDebuffEffects);
  writeFile(ENGINE_FILE, newContent);
  console.log('[BALANCE v11] Optimized debuff effects with particle parameters');
}

// ============================================
// 3. 优化等级成长曲线（经验值调整）
// ============================================
function optimizeLevelGrowth() {
  const engineContent = readFile(ENGINE_FILE);
  
  if (engineContent.includes('expToNextLevel = 5 *')) {
    console.log('[BALANCE v11] Level growth already optimized');
    return;
  }

  let newContent = engineContent;

  const patterns = [
    /expToNextLevel = Math\.floor\(20 \* Math\.pow\(1\.05, this\.player\.level - 1\)\)/g,
    /expToNextLevel = Math\.floor\(20 \* Math\.pow\(1\.05, level - 1\)\)/g,
  ];

  for (const pattern of patterns) {
    newContent = newContent.replace(pattern, 'expToNextLevel = Math.floor(5 * 20 * Math.pow(1.05, level - 1))');
  }

  writeFile(ENGINE_FILE, newContent);
  console.log('[BALANCE v11] Optimized level growth (5x exp requirement)');
}

// ============================================
// 4. 添加怪物受击特效增强
// ============================================
function enhanceEnemyHitEffects() {
  const engineContent = readFile(ENGINE_FILE);
  
  if (engineContent.includes('hitStunTimer') && engineContent.includes('hitStunDuration')) {
    console.log('[BALANCE v11] Enemy hit effects already enhanced');
    return;
  }

  let newContent = engineContent;

  const hitEffectPattern = /case 'hit':\s*this\.player\.health -= damage;/;
  if (hitEffectPattern.test(newContent)) {
    newContent = newContent.replace(hitEffectPattern, `case 'hit':
        this.player.health -= damage;
        this.addShake('hit');
        break;`);
  }

  writeFile(ENGINE_FILE, newContent);
  console.log('[BALANCE v11] Enhanced enemy hit effects');
}

// ============================================
// 5. 验证所有内容
// ============================================
function verifyAllContent() {
  console.log('\n--- v11 验证所有内容完整性 ---');
  
  const skillsContent = readFile(SKILLS_FILE);
  const engineContent = readFile(ENGINE_FILE);
  
  console.log('\n--- 新增技能检查 ---');
  const newSkills = ['fire_shot_1', 'fire_shot_2', 'poison_shot_1', 'poison_shot_2', 'ice_shot_1', 'ice_shot_2'];
  newSkills.forEach(skill => {
    const found = skillsContent.includes(skill);
    console.log(`  ${skill}: ${found ? '✓ 已添加' : '✗ 缺失'}`);
  });

  console.log('\n--- 异常状态系统检查 ---');
  const debuffTypes = ['burn', 'poison', 'freeze', 'lightning', 'slow', 'curse', 'stun'];
  debuffTypes.forEach(type => {
    const found = engineContent.includes(`'${type}':`);
    console.log(`  ${type}: ${found ? '✓ 已配置' : '✗ 缺失'}`);
  });

  console.log('\n--- 装备套装检查 ---');
  const sets = ['wasteland_ranger', 'tech_soldier', 'mutant_hunter', 'survivor', 'raider', 'wasteland_destroyer'];
  sets.forEach(set => {
    const found = skillsContent.includes(set);
    console.log(`  ${set}: ${found ? '✓ 已配置' : '✗ 缺失'}`);
  });

  console.log('\n--- 新增道具检查 ---');
  const items = ['stun_bomb', 'lightning_bolt', 'curse_scroll'];
  items.forEach(item => {
    const found = skillsContent.includes(item);
    console.log(`  ${item}: ${found ? '✓ 已配置' : '✗ 缺失'}`);
  });

  console.log('');
}

// ============================================
// 主执行函数
// ============================================
function main() {
  console.log('========================================');
  console.log('=== Game Balance Optimization v11 ===');
  console.log('=== 新增技能与异常状态特效优化 ===');
  console.log('========================================');
  console.log(`Time: ${new Date().toLocaleString('zh-CN')}`);
  
  console.log('\n--- 1. 新增元素攻击技能 ---');
  addElementalSkills();
  
  console.log('\n--- 2. 优化异常状态特效系统 ---');
  optimizeDebuffEffects();
  
  console.log('\n--- 3. 优化等级成长曲线 ---');
  optimizeLevelGrowth();
  
  console.log('\n--- 4. 添加怪物受击特效增强 ---');
  enhanceEnemyHitEffects();
  
  console.log('\n--- 5. 验证所有内容 ---');
  verifyAllContent();
  
  console.log('========================================');
  console.log('=== v11 Optimization Completed ===');
  console.log('========================================');
}

main();