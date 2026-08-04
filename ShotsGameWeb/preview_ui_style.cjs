const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// 创建竖屏手机尺寸预览图 (华为P70比例 约 9:19.5)
const WIDTH = 390;
const HEIGHT = 844;
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');

// ========== 背景 - 末世工厂场景 ==========
// 深色天空渐变
const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.55);
skyGrad.addColorStop(0, '#1a0f2e');
skyGrad.addColorStop(0.4, '#2d1b4e');
skyGrad.addColorStop(1, '#4a2c6a');
ctx.fillStyle = skyGrad;
ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.55);

// 地面
ctx.fillStyle = '#2a1f1a';
ctx.fillRect(0, HEIGHT * 0.55, WIDTH, HEIGHT * 0.45);

// 工厂建筑剪影
ctx.fillStyle = '#0d0d1a';
for (let i = 0; i < 8; i++) {
  const w = 30 + Math.random() * 50;
  const h = 80 + Math.random() * 150;
  const x = i * 55 + Math.random() * 20;
  ctx.fillRect(x, HEIGHT * 0.55 - h, w, h);
  // 窗户
  ctx.fillStyle = '#1a1a2e';
  for (let j = 0; j < 3; j++) {
    ctx.fillRect(x + 5, HEIGHT * 0.55 - h + 15 + j * 25, w - 10, 12);
  }
  ctx.fillStyle = '#0d0d1a';
}

// 铁丝网
ctx.strokeStyle = '#3a3a4a';
ctx.lineWidth = 1.5;
for (let x = 0; x < WIDTH; x += 20) {
  ctx.beginPath();
  ctx.moveTo(x, HEIGHT * 0.55);
  ctx.lineTo(x + 10, HEIGHT * 0.55 - 15);
  ctx.lineTo(x + 20, HEIGHT * 0.55);
  ctx.stroke();
}

// ========== 顶部状态栏 - 简洁现代风格 ==========
// 顶部半透明背景
ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
ctx.fillRect(0, 0, WIDTH, 70);

// 波次
ctx.fillStyle = '#ff6b35';
ctx.font = 'bold 16px Arial';
ctx.fillText('WAVE 1', 15, 28);

// 分数 - 大字体居中
ctx.fillStyle = '#ffd700';
ctx.font = 'bold 22px Arial';
ctx.textAlign = 'center';
ctx.fillText('SCORE 0', WIDTH / 2, 30);
ctx.textAlign = 'left';

// 设置按钮
ctx.fillStyle = 'rgba(255,255,255,0.3)';
ctx.beginPath();
ctx.arc(WIDTH - 30, 25, 18, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#fff';
ctx.font = '14px Arial';
ctx.fillText('⚙', WIDTH - 35, 30);

// 血条背景
ctx.fillStyle = 'rgba(0,0,0,0.5)';
ctx.roundRect(15, 42, 120, 18, 9);
ctx.fill();
// 血条
ctx.fillStyle = '#e74c3c';
ctx.roundRect(15, 42, 100, 18, 9);
ctx.fill();
// 血条文字
ctx.fillStyle = '#fff';
ctx.font = 'bold 11px Arial';
ctx.fillText('100/100', 50, 55);

// 能量条
ctx.fillStyle = 'rgba(0,0,0,0.5)';
ctx.roundRect(15, 64, 100, 12, 6);
ctx.fill();
ctx.fillStyle = '#3498db';
ctx.roundRect(15, 64, 80, 12, 6);
ctx.fill();

// ========== 战斗区域 ==========
// 炮台（玩家角色）
ctx.fillStyle = '#4a90d9';
ctx.beginPath();
ctx.arc(60, HEIGHT * 0.55 - 30, 20, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#2c5aa0';
ctx.fillRect(55, HEIGHT * 0.55 - 50, 10, 25);
// 炮口
ctx.fillStyle = '#ff6b35';
ctx.beginPath();
ctx.arc(80, HEIGHT * 0.55 - 40, 4, 0, Math.PI * 2);
ctx.fill();

// 僵尸
const zombieColors = ['#7cb342', '#8bc34a', '#689f38'];
for (let i = 0; i < 4; i++) {
  const x = 250 + i * 35;
  const y = HEIGHT * 0.55 - 25;
  ctx.fillStyle = zombieColors[i % 3];
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
  // 眼睛
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(x - 5, y - 3, 3, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 3, 3, 0, Math.PI * 2);
  ctx.fill();
}

// BOSS血条
ctx.fillStyle = 'rgba(0,0,0,0.6)';
ctx.roundRect(WIDTH / 2 - 80, HEIGHT * 0.55 - 120, 160, 22, 11);
ctx.fill();
ctx.fillStyle = '#e74c3c';
ctx.roundRect(WIDTH / 2 - 80, HEIGHT * 0.55 - 120, 120, 22, 11);
ctx.fill();
ctx.fillStyle = '#fff';
ctx.font = 'bold 12px Arial';
ctx.textAlign = 'center';
ctx.fillText('BOSS', WIDTH / 2, HEIGHT * 0.55 - 105);
ctx.textAlign = 'left';

// ========== 底部功能面板 - 现代简洁风格 ==========
const panelY = HEIGHT - 280;

// 面板背景 - 圆角卡片
ctx.fillStyle = 'rgba(20, 20, 35, 0.95)';
ctx.roundRect(10, panelY, WIDTH - 20, 270, 16);
ctx.fill();

// 面板顶部标签栏
const tabs = ['技能', '装备', '防线', '佣兵'];
const tabColors = ['#ff6b35', '#4a90d9', '#7cb342', '#9b59b6'];
for (let i = 0; i < tabs.length; i++) {
  const tabX = 20 + i * 92;
  const isActive = i === 0;
  
  if (isActive) {
    ctx.fillStyle = tabColors[i];
    ctx.roundRect(tabX, panelY + 10, 80, 32, 16);
    ctx.fill();
  }
  
  ctx.fillStyle = isActive ? '#fff' : '#888';
  ctx.font = isActive ? 'bold 14px Arial' : '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(tabs[i], tabX + 40, panelY + 32);
}
ctx.textAlign = 'left';

// 技能卡片区域
const skills = [
  { name: '温压弹', color: '#ff6b35', icon: '🔥' },
  { name: '干冰弹', color: '#3498db', icon: '❄️' },
  { name: '电磁', color: '#9b59b6', icon: '⚡' },
  { name: '装甲车', color: '#7cb342', icon: '🚗' },
];

for (let i = 0; i < skills.length; i++) {
  const cardX = 20 + i * 92;
  const cardY = panelY + 55;
  
  // 卡片背景
  ctx.fillStyle = 'rgba(40, 40, 60, 0.9)';
  ctx.roundRect(cardX, cardY, 82, 100, 12);
  ctx.fill();
  
  // 卡片边框
  ctx.strokeStyle = skills[i].color;
  ctx.lineWidth = 2;
  ctx.roundRect(cardX, cardY, 82, 100, 12);
  ctx.stroke();
  
  // 图标区域
  ctx.fillStyle = skills[i].color + '40';
  ctx.beginPath();
  ctx.arc(cardX + 41, cardY + 35, 25, 0, Math.PI * 2);
  ctx.fill();
  
  // 图标
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(skills[i].icon, cardX + 41, cardY + 45);
  
  // 名称
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Arial';
  ctx.fillText(skills[i].name, cardX + 41, cardY + 78);
  
  // 等级
  ctx.fillStyle = '#888';
  ctx.font = '10px Arial';
  ctx.fillText('Lv.1', cardX + 41, cardY + 95);
}
ctx.textAlign = 'left';

// 底部快捷栏
const quickSlots = ['💣', '❄️', '⚡', '🚗'];
for (let i = 0; i < quickSlots.length; i++) {
  const slotX = 30 + i * 85;
  const slotY = HEIGHT - 70;
  
  ctx.fillStyle = 'rgba(40, 40, 60, 0.9)';
  ctx.beginPath();
  ctx.arc(slotX + 30, slotY + 30, 30, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(slotX + 30, slotY + 30, 30, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(quickSlots[i], slotX + 30, slotY + 40);
}
ctx.textAlign = 'left';

// 金币显示
ctx.fillStyle = '#ffd700';
ctx.font = 'bold 16px Arial';
ctx.fillText('💰 0', WIDTH - 80, HEIGHT - 40);

// 保存图片
const outputPath = path.join(__dirname, 'ui_preview_style.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);
console.log('Preview saved to:', outputPath);
