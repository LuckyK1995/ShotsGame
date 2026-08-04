const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const WIDTH = 420;
const HEIGHT = 900;
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGlowCircle(x, y, r, color) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// ===== 背景 - 末世城市 =====
const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.6);
skyGrad.addColorStop(0, '#0a0a1a');
skyGrad.addColorStop(0.3, '#1a1030');
skyGrad.addColorStop(0.6, '#2d1b3d');
skyGrad.addColorStop(1, '#4a2c4a');
ctx.fillStyle = skyGrad;
ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.6);

// 远景建筑剪影
ctx.fillStyle = '#0d0d1a';
const buildings = [
  { x: 0, w: 50, h: 180 },
  { x: 45, w: 70, h: 250 },
  { x: 110, w: 45, h: 160 },
  { x: 150, w: 80, h: 280 },
  { x: 225, w: 55, h: 190 },
  { x: 275, w: 65, h: 230 },
  { x: 335, w: 50, h: 170 },
  { x: 380, w: 40, h: 200 },
];
buildings.forEach(b => {
  ctx.fillRect(b.x, HEIGHT * 0.6 - b.h, b.w, b.h);
  // 窗户
  ctx.fillStyle = '#1a1a3a';
  for (let row = 0; row < Math.floor(b.h / 25); row++) {
    for (let col = 0; col < Math.floor(b.w / 15); col++) {
      if (Math.random() > 0.3) {
        ctx.fillRect(b.x + 5 + col * 15, HEIGHT * 0.6 - b.h + 10 + row * 25, 8, 12);
      }
    }
  }
  ctx.fillStyle = '#0d0d1a';
});

// 地面
const groundGrad = ctx.createLinearGradient(0, HEIGHT * 0.6, 0, HEIGHT);
groundGrad.addColorStop(0, '#2a1f2a');
groundGrad.addColorStop(0.3, '#1f1a25');
groundGrad.addColorStop(1, '#15101a');
ctx.fillStyle = groundGrad;
ctx.fillRect(0, HEIGHT * 0.6, WIDTH, HEIGHT * 0.4);

// 地面纹理线
ctx.strokeStyle = 'rgba(100, 80, 120, 0.15)';
ctx.lineWidth = 1;
for (let i = 0; i < 8; i++) {
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT * 0.65 + i * 25);
  ctx.lineTo(WIDTH, HEIGHT * 0.62 + i * 25);
  ctx.stroke();
}

// ===== 玩家炮台 =====
const turretX = 60;
const turretY = HEIGHT * 0.62;

// 底座光晕
drawGlowCircle(turretX, turretY + 15, 40, 'rgba(74, 144, 217, 0.3)');

// 底座
ctx.fillStyle = '#2c3e50';
roundRect(turretX - 25, turretY, 50, 30, 8);
ctx.fill();

// 炮身
ctx.fillStyle = '#3498db';
roundRect(turretX - 18, turretY - 25, 36, 30, 6);
ctx.fill();

// 炮管
ctx.fillStyle = '#2980b9';
ctx.fillRect(turretX + 5, turretY - 35, 35, 12);
ctx.fillStyle = '#1abc9c';
ctx.beginPath();
ctx.arc(turretX + 40, turretY - 29, 6, 0, Math.PI * 2);
ctx.fill();

// 枪口火焰
ctx.fillStyle = '#ff6b35';
ctx.beginPath();
ctx.moveTo(turretX + 45, turretY - 35);
ctx.lineTo(turretX + 60, turretY - 29);
ctx.lineTo(turretX + 45, turretY - 23);
ctx.closePath();
ctx.fill();

// ===== 僵尸们 =====
const zombies = [
  { x: 320, y: HEIGHT * 0.6, type: 'normal', hp: 1 },
  { x: 360, y: HEIGHT * 0.62, type: 'fast', hp: 0.7 },
  { x: 280, y: HEIGHT * 0.59, type: 'tank', hp: 1 },
  { x: 390, y: HEIGHT * 0.61, type: 'normal', hp: 0.5 },
  { x: 250, y: HEIGHT * 0.63, type: 'normal', hp: 0.8 },
];

zombies.forEach((z, idx) => {
  const colors = {
    normal: { body: '#7cb342', dark: '#558b2f', eye: '#ff0000' },
    fast: { body: '#ffb74d', dark: '#f57c00', eye: '#ff3d00' },
    tank: { body: '#78909c', dark: '#455a64', eye: '#d32f2f' },
  };
  const c = colors[z.type] || colors.normal;
  
  // 身体
  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.arc(z.x, z.y - 20, 18, 0, Math.PI * 2);
  ctx.fill();
  
  // 身体下半
  ctx.fillStyle = c.dark;
  ctx.beginPath();
  ctx.arc(z.x, z.y - 15, 15, 0, Math.PI);
  ctx.fill();
  
  // 眼睛
  ctx.fillStyle = c.eye;
  ctx.beginPath();
  ctx.arc(z.x - 6, z.y - 24, 4, 0, Math.PI * 2);
  ctx.arc(z.x + 6, z.y - 24, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // 血条
  const hpW = 30;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(z.x - hpW/2, z.y - 42, hpW, 4);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(z.x - hpW/2, z.y - 42, hpW * z.hp, 4);
});

// ===== 子弹特效 =====
ctx.fillStyle = '#ffeb3b';
ctx.shadowColor = '#ff9800';
ctx.shadowBlur = 10;
for (let i = 0; i < 3; i++) {
  const bx = 100 + i * 70;
  const by = HEIGHT * 0.58 - i * 5;
  ctx.beginPath();
  ctx.arc(bx, by, 4, 0, Math.PI * 2);
  ctx.fill();
}
ctx.shadowBlur = 0;

// ===== 顶部状态栏 =====
// 背景
ctx.fillStyle = 'rgba(10, 10, 30, 0.7)';
roundRect(0, 0, WIDTH, 90, 0);
ctx.fill();

// 波次
ctx.fillStyle = '#ff6b35';
ctx.font = 'bold 20px Arial';
ctx.textAlign = 'left';
ctx.fillText('WAVE 1', 15, 32);

// 分数
ctx.fillStyle = '#ffd700';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.fillText(String.fromCharCode(9733) + ' 0', WIDTH / 2, 35);

// 暂停按钮
ctx.fillStyle = 'rgba(255,255,255,0.15)';
ctx.beginPath();
ctx.arc(WIDTH - 35, 30, 22, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#fff';
ctx.font = '18px Arial';
ctx.textAlign = 'center';
ctx.fillText('\u23F8', WIDTH - 35, 36);

// 血条
ctx.fillStyle = 'rgba(0,0,0,0.4)';
roundRect(15, 48, 150, 20, 10);
ctx.fill();

const hpGrad = ctx.createLinearGradient(15, 48, 15, 68);
hpGrad.addColorStop(0, '#ff6b6b');
hpGrad.addColorStop(0.5, '#e74c3c');
hpGrad.addColorStop(1, '#c0392b');
ctx.fillStyle = hpGrad;
roundRect(15, 48, 120, 20, 10);
ctx.fill();

ctx.fillStyle = '#fff';
ctx.font = 'bold 12px Arial';
ctx.textAlign = 'center';
ctx.fillText('100 / 100', 90, 63);

// 经验/能量条
ctx.fillStyle = 'rgba(0,0,0,0.4)';
roundRect(175, 50, 120, 16, 8);
ctx.fill();

const energyGrad = ctx.createLinearGradient(175, 50, 175, 66);
energyGrad.addColorStop(0, '#5dade2');
energyGrad.addColorStop(0.5, '#3498db');
energyGrad.addColorStop(1, '#2980b9');
ctx.fillStyle = energyGrad;
roundRect(175, 50, 90, 16, 8);
ctx.fill();

ctx.fillStyle = '#fff';
ctx.font = '10px Arial';
ctx.fillText('EXP', 235, 62);

// 金币
ctx.fillStyle = '#ffd700';
ctx.font = 'bold 16px Arial';
ctx.textAlign = 'right';
ctx.fillText(String.fromCharCode(128176) + ' 1,280', WIDTH - 15, 68);

// ===== BOSS血条 =====
const bossX = WIDTH / 2;
const bossY = HEIGHT * 0.52;

ctx.fillStyle = 'rgba(0,0,0,0.6)';
roundRect(bossX - 100, bossY, 200, 26, 13);
ctx.fill();

ctx.strokeStyle = '#e74c3c';
ctx.lineWidth = 2;
roundRect(bossX - 100, bossY, 200, 26, 13);
ctx.stroke();

const bossHpGrad = ctx.createLinearGradient(bossX - 100, bossY, bossX - 100, bossY + 26);
bossHpGrad.addColorStop(0, '#ff6b6b');
bossHpGrad.addColorStop(0.5, '#e74c3c');
bossHpGrad.addColorStop(1, '#c0392b');
ctx.fillStyle = bossHpGrad;
roundRect(bossX - 97, bossY + 3, 130, 20, 10);
ctx.fill();

ctx.fillStyle = '#fff';
ctx.font = 'bold 12px Arial';
ctx.textAlign = 'center';
ctx.fillText('BOSS - 深渊领主', bossX, bossY + 18);

// ===== 底部技能面板 =====
const panelY = HEIGHT - 300;

// 面板背景
ctx.fillStyle = 'rgba(20, 20, 45, 0.92)';
roundRect(10, panelY, WIDTH - 20, 290, 20);
ctx.fill();

// 面板边框光效
ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
ctx.lineWidth = 2;
roundRect(10, panelY, WIDTH - 20, 290, 20);
ctx.stroke();

// 标签栏
const tabs = [
  { name: '技能', color: '#ff6b35', icon: '\u26A1' },
  { name: '装备', color: '#3498db', icon: '\u2694' },
  { name: '防线', color: '#2ecc71', icon: '\u{1F6E1}' },
  { name: '佣兵', color: '#9b59b6', icon: '\u{1F464}' },
];

tabs.forEach((tab, i) => {
  const tabX = 25 + i * 95;
  const isActive = i === 0;
  
  if (isActive) {
    const tabGrad = ctx.createLinearGradient(tabX, panelY + 15, tabX, panelY + 50);
    tabGrad.addColorStop(0, tab.color);
    tabGrad.addColorStop(1, tab.color + 'aa');
    ctx.fillStyle = tabGrad;
    roundRect(tabX, panelY + 15, 85, 36, 18);
    ctx.fill();
  }
  
  ctx.fillStyle = isActive ? '#fff' : '#888';
  ctx.font = isActive ? 'bold 14px Arial' : '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(tab.icon + ' ' + tab.name, tabX + 42, panelY + 39);
});

// 技能卡片区域
const skills = [
  { name: '温压弹', color: '#ff6b35', level: 3, icon: '\u{1F525}', desc: '范围爆炸' },
  { name: '干冰弹', color: '#3498db', level: 2, icon: '\u2744', desc: '减速冻结' },
  { name: '电磁炮', color: '#9b59b6', level: 5, icon: '\u26A1', desc: '穿透连锁' },
  { name: '装甲车', color: '#2ecc71', level: 1, icon: '\u{1F697}', desc: '召唤聚怪' },
];

skills.forEach((s, i) => {
  const cardX = 20 + i * 95;
  const cardY = panelY + 65;
  
  // 卡片背景
  ctx.fillStyle = 'rgba(30, 30, 55, 0.95)';
  roundRect(cardX, cardY, 85, 110, 14);
  ctx.fill();
  
  // 卡片边框（稀有度色）
  ctx.strokeStyle = s.color;
  ctx.lineWidth = 2;
  roundRect(cardX, cardY, 85, 110, 14);
  ctx.stroke();
  
  // 图标背景
  const iconY = cardY + 25;
  drawGlowCircle(cardX + 42, iconY, 30, s.color + '40');
  
  ctx.fillStyle = s.color + '30';
  ctx.beginPath();
  ctx.arc(cardX + 42, iconY, 28, 0, Math.PI * 2);
  ctx.fill();
  
  // 图标
  ctx.fillStyle = '#fff';
  ctx.font = '28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(s.icon, cardX + 42, iconY + 10);
  
  // 名称
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Arial';
  ctx.fillText(s.name, cardX + 42, cardY + 70);
  
  // 等级
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 11px Arial';
  ctx.fillText('Lv.' + s.level, cardX + 42, cardY + 88);
  
  // 描述
  ctx.fillStyle = '#888';
  ctx.font = '10px Arial';
  ctx.fillText(s.desc, cardX + 42, cardY + 104);
});

// ===== 底部快捷技能栏 =====
const quickY = HEIGHT - 95;

const quickSkills = [
  { icon: '\u{1F4A3}', color: '#ff6b35', cd: 0 },
  { icon: '\u2744', color: '#3498db', cd: 0 },
  { icon: '\u26A1', color: '#9b59b6', cd: 0.4 },
  { icon: '\u{1F697}', color: '#2ecc71', cd: 1 },
];

quickSkills.forEach((s, i) => {
  const sx = 30 + i * 95;
  const sy = quickY;
  
  // 外发光
  drawGlowCircle(sx + 35, sy + 35, 45, s.color + '30');
  
  // 底座
  ctx.fillStyle = 'rgba(20, 20, 45, 0.9)';
  ctx.beginPath();
  ctx.arc(sx + 35, sy + 35, 35, 0, Math.PI * 2);
  ctx.fill();
  
  // 边框
  ctx.strokeStyle = s.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx + 35, sy + 35, 35, 0, Math.PI * 2);
  ctx.stroke();
  
  // CD蒙层
  if (s.cd > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.moveTo(sx + 35, sy + 35);
    ctx.arc(sx + 35, sy + 35, 35, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * s.cd);
    ctx.closePath();
    ctx.fill();
  }
  
  // 图标
  ctx.fillStyle = '#fff';
  ctx.font = '28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(s.icon, sx + 35, sy + 45);
  
  // 快捷键
  ctx.fillStyle = s.color;
  ctx.font = 'bold 10px Arial';
  ctx.fillText((i + 1) + '', sx + 35, sy + 65);
});

// ===== 飘字伤害 =====
ctx.fillStyle = '#ffeb3b';
ctx.font = 'bold 18px Arial';
ctx.textAlign = 'center';
ctx.fillText('-128', 300, HEIGHT * 0.5);

ctx.fillStyle = '#ff6b35';
ctx.font = 'bold 14px Arial';
ctx.fillText('-56', 350, HEIGHT * 0.52);

ctx.fillStyle = '#3498db';
ctx.font = 'bold 12px Arial';
ctx.fillText('暴击!', 270, HEIGHT * 0.48);

// 保存
const outputPath = path.join(__dirname, 'game_ui_preview.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);
console.log('Preview saved to:', outputPath);
