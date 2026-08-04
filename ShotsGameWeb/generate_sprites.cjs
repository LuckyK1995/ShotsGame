const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const assetsDir = path.join(__dirname, 'public', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// === 玩家贴图 - 绿色士兵，面朝右 ===
function createPlayerSprite() {
  const canvas = createCanvas(48, 80);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // 透明背景
  ctx.clearRect(0, 0, 48, 80);

  const px = 2;

  // === 军靴 ===
  ctx.fillStyle = '#2D1F0E';
  ctx.fillRect(7 * px, 35 * px, 4 * px, 4 * px);
  ctx.fillRect(13 * px, 35 * px, 4 * px, 4 * px);
  ctx.fillStyle = '#1A1208';
  ctx.fillRect(7 * px, 38 * px, 5 * px, 1 * px);
  ctx.fillRect(12 * px, 38 * px, 5 * px, 1 * px);
  ctx.fillStyle = '#3D2914';
  ctx.fillRect(8 * px, 35 * px, 2 * px, 1 * px);
  ctx.fillRect(14 * px, 35 * px, 2 * px, 1 * px);

  // === 军裤 ===
  ctx.fillStyle = '#3D6B3D';
  ctx.fillRect(7 * px, 26 * px, 4 * px, 9 * px);
  ctx.fillRect(13 * px, 26 * px, 4 * px, 9 * px);
  ctx.fillStyle = '#2D5A2D';
  ctx.fillRect(7 * px, 28 * px, 1 * px, 5 * px);
  ctx.fillRect(15 * px, 27 * px, 1 * px, 6 * px);
  ctx.fillStyle = '#4A7B4A';
  ctx.fillRect(9 * px, 27 * px, 1 * px, 4 * px);
  ctx.fillRect(13 * px, 27 * px, 1 * px, 4 * px);
  ctx.fillStyle = '#2D5A2D';
  ctx.fillRect(7 * px, 34 * px, 4 * px, 1 * px);
  ctx.fillRect(13 * px, 34 * px, 4 * px, 1 * px);

  // === 腰带 ===
  ctx.fillStyle = '#3D2914';
  ctx.fillRect(6 * px, 24 * px, 13 * px, 2 * px);
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(11 * px, 24 * px, 3 * px, 2 * px);

  // === 军绿色上衣 ===
  ctx.fillStyle = '#4A8B4A';
  ctx.fillRect(6 * px, 14 * px, 13 * px, 10 * px);
  ctx.fillStyle = '#3D7A3D';
  ctx.fillRect(6 * px, 16 * px, 2 * px, 6 * px);
  ctx.fillRect(17 * px, 15 * px, 2 * px, 7 * px);
  ctx.fillStyle = '#5A9B5A';
  ctx.fillRect(8 * px, 14 * px, 4 * px, 2 * px);
  ctx.fillRect(13 * px, 14 * px, 3 * px, 2 * px);
  // 衣领
  ctx.fillStyle = '#3D7A3D';
  ctx.fillRect(8 * px, 14 * px, 2 * px, 2 * px);
  ctx.fillRect(12 * px, 14 * px, 2 * px, 2 * px);
  // 胸袋
  ctx.fillStyle = '#3D7A3D';
  ctx.fillRect(7 * px, 17 * px, 3 * px, 3 * px);
  ctx.fillRect(14 * px, 17 * px, 3 * px, 3 * px);
  ctx.fillStyle = '#4A8B4A';
  ctx.fillRect(7 * px, 16 * px, 3 * px, 1 * px);
  ctx.fillRect(14 * px, 16 * px, 3 * px, 1 * px);

  // === 左臂 ===
  ctx.fillStyle = '#4A8B4A';
  ctx.fillRect(3 * px, 14 * px, 3 * px, 9 * px);
  ctx.fillStyle = '#3D7A3D';
  ctx.fillRect(3 * px, 16 * px, 1 * px, 5 * px);
  ctx.fillRect(3 * px, 22 * px, 3 * px, 1 * px);
  ctx.fillStyle = '#E0B888';
  ctx.fillRect(3 * px, 22 * px, 3 * px, 2 * px);

  // === 右臂 + 步枪 ===
  ctx.fillStyle = '#4A8B4A';
  ctx.fillRect(17 * px, 14 * px, 3 * px, 5 * px);
  ctx.fillStyle = '#3D7A3D';
  ctx.fillRect(17 * px, 16 * px, 2 * px, 3 * px);
  ctx.fillStyle = '#E0B888';
  ctx.fillRect(18 * px, 18 * px, 2 * px, 2 * px);

  // 步枪
  ctx.fillStyle = '#5D3A1A';
  ctx.fillRect(18 * px, 18 * px, 3 * px, 2 * px);
  ctx.fillStyle = '#3A3A3A';
  ctx.fillRect(20 * px, 17 * px, 7 * px, 3 * px);
  ctx.fillStyle = '#5A5A5A';
  ctx.fillRect(20 * px, 17 * px, 7 * px, 1 * px);
  ctx.fillStyle = '#2A2A2A';
  ctx.fillRect(21 * px, 20 * px, 2 * px, 3 * px);
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(26 * px, 18 * px, 10 * px, 1 * px);
  ctx.fillStyle = '#5D3A1A';
  ctx.fillRect(25 * px, 19 * px, 5 * px, 1 * px);
  ctx.fillStyle = '#2A2A2A';
  ctx.fillRect(35 * px, 17 * px, 2 * px, 2 * px);
  ctx.fillStyle = '#3A3A3A';
  ctx.fillRect(31 * px, 16 * px, 1 * px, 1 * px);

  // === 脖子 ===
  ctx.fillStyle = '#E0B888';
  ctx.fillRect(9 * px, 12 * px, 4 * px, 2 * px);
  ctx.fillStyle = '#D4A574';
  ctx.fillRect(9 * px, 13 * px, 1 * px, 1 * px);

  // === 头部 ===
  ctx.fillStyle = '#E8C090';
  ctx.fillRect(7 * px, 4 * px, 8 * px, 8 * px);
  ctx.fillStyle = '#D4A574';
  ctx.fillRect(7 * px, 5 * px, 1 * px, 6 * px);
  ctx.fillStyle = '#F0D0A0';
  ctx.fillRect(12 * px, 4 * px, 2 * px, 3 * px);
  // 眼睛
  ctx.fillStyle = '#1A1208';
  ctx.fillRect(8 * px, 7 * px, 2 * px, 1 * px);
  ctx.fillRect(12 * px, 7 * px, 2 * px, 1 * px);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(9 * px, 7 * px, 1 * px, 1 * px);
  ctx.fillRect(13 * px, 7 * px, 1 * px, 1 * px);
  // 眉毛
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(8 * px, 6 * px, 2 * px, 1 * px);
  ctx.fillRect(12 * px, 6 * px, 2 * px, 1 * px);
  // 鼻子
  ctx.fillStyle = '#D4A574';
  ctx.fillRect(10 * px, 7 * px, 1 * px, 2 * px);
  // 嘴
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(9 * px, 10 * px, 4 * px, 1 * px);
  // 下巴
  ctx.fillStyle = '#D4A574';
  ctx.fillRect(8 * px, 11 * px, 6 * px, 1 * px);

  // === 军帽 ===
  ctx.fillStyle = '#3D7A3D';
  ctx.fillRect(6 * px, 1 * px, 10 * px, 4 * px);
  ctx.fillStyle = '#4A8B4A';
  ctx.fillRect(7 * px, 0 * px, 8 * px, 2 * px);
  ctx.fillStyle = '#2D5A2D';
  ctx.fillRect(5 * px, 4 * px, 12 * px, 1 * px);
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(12 * px, 1 * px, 2 * px, 2 * px);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(12 * px, 1 * px, 1 * px, 1 * px);
  ctx.fillStyle = '#2D5A2D';
  ctx.fillRect(6 * px, 2 * px, 2 * px, 1 * px);

  return canvas;
}

// === 兽人怪物贴图 ===
function createOrcSprite(variant) {
  const canvas = createCanvas(60, 80);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 60, 80);

  const px = 2;
  const colors = [
    { body: '#5A8B3A', dark: '#4A7B2A', light: '#6B9B4A', skin: '#6B5B48' },
    { body: '#8B3A3A', dark: '#7B2A2A', light: '#9B4A4A', skin: '#6B5B48' },
    { body: '#3A5A8B', dark: '#2A4A7B', light: '#4A6A9B', skin: '#6B5B48' },
    { body: '#8B6B3A', dark: '#7B5B2A', light: '#9B7B4A', skin: '#6B5B48' },
  ];
  const c = colors[variant % colors.length];

  // === 腿 ===
  ctx.fillStyle = c.skin;
  ctx.fillRect(10 * px, 32 * px, 6 * px, 8 * px);
  ctx.fillRect(18 * px, 32 * px, 6 * px, 8 * px);
  ctx.fillStyle = '#4A3A28';
  ctx.fillRect(9 * px, 39 * px, 8 * px, 1 * px);
  ctx.fillRect(17 * px, 39 * px, 8 * px, 1 * px);
  ctx.fillStyle = c.dark;
  ctx.fillRect(10 * px, 33 * px, 6 * px, 6 * px);
  ctx.fillRect(18 * px, 33 * px, 6 * px, 6 * px);

  // === 腰带 ===
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(8 * px, 30 * px, 20 * px, 2 * px);
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(16 * px, 30 * px, 4 * px, 2 * px);

  // === 身体 ===
  ctx.fillStyle = c.body;
  ctx.fillRect(8 * px, 18 * px, 20 * px, 12 * px);
  ctx.fillStyle = c.dark;
  ctx.fillRect(8 * px, 20 * px, 4 * px, 8 * px);
  ctx.fillRect(24 * px, 19 * px, 4 * px, 9 * px);
  ctx.fillStyle = c.light;
  ctx.fillRect(12 * px, 18 * px, 6 * px, 2 * px);

  // === 左臂 ===
  ctx.fillStyle = c.body;
  ctx.fillRect(4 * px, 18 * px, 4 * px, 10 * px);
  ctx.fillStyle = c.dark;
  ctx.fillRect(4 * px, 20 * px, 2 * px, 6 * px);
  ctx.fillStyle = c.body;
  ctx.fillRect(4 * px, 28 * px, 4 * px, 2 * px);
  // 武器
  ctx.fillStyle = '#8B8B8B';
  ctx.fillRect(2 * px, 26 * px, 4 * px, 6 * px);
  ctx.fillStyle = '#A0A0A0';
  ctx.fillRect(2 * px, 26 * px, 4 * px, 1 * px);

  // === 右臂 ===
  ctx.fillStyle = c.body;
  ctx.fillRect(24 * px, 18 * px, 5 * px, 9 * px);
  ctx.fillStyle = c.dark;
  ctx.fillRect(27 * px, 19 * px, 2 * px, 7 * px);

  // === 头部 ===
  ctx.fillStyle = c.body;
  ctx.fillRect(10 * px, 6 * px, 16 * px, 12 * px);
  ctx.fillStyle = c.dark;
  ctx.fillRect(10 * px, 8 * px, 3 * px, 8 * px);
  ctx.fillStyle = c.light;
  ctx.fillRect(20 * px, 6 * px, 4 * px, 3 * px);

  // === 兽角 ===
  ctx.fillStyle = '#2D1F0E';
  ctx.fillRect(10 * px, 4 * px, 16 * px, 2 * px);
  ctx.fillStyle = '#4A3A28';
  ctx.fillRect(12 * px, 2 * px, 12 * px, 2 * px);
  ctx.fillStyle = '#6B5B48';
  ctx.fillRect(18 * px, 0 * px, 3 * px, 4 * px);

  // === 眼睛（发光） ===
  ctx.fillStyle = '#FF4400';
  ctx.fillRect(13 * px, 9 * px, 3 * px, 2 * px);
  ctx.fillRect(20 * px, 9 * px, 3 * px, 2 * px);
  ctx.fillStyle = '#FFFF00';
  ctx.fillRect(14 * px, 9 * px, 1 * px, 1 * px);
  ctx.fillRect(21 * px, 9 * px, 1 * px, 1 * px);

  // === 嘴 + 獠牙 ===
  ctx.fillStyle = '#2D1F0E';
  ctx.fillRect(12 * px, 13 * px, 12 * px, 2 * px);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(14 * px, 13 * px, 2 * px, 3 * px);
  ctx.fillRect(20 * px, 13 * px, 2 * px, 3 * px);

  // === 耳朵 ===
  ctx.fillStyle = c.dark;
  ctx.fillRect(7 * px, 10 * px, 3 * px, 3 * px);
  ctx.fillRect(26 * px, 10 * px, 3 * px, 3 * px);

  return canvas;
}

// === 史莱姆贴图 ===
function createSlimeSprite() {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 32, 32);

  const px = 2;

  // 主体
  ctx.fillStyle = '#5A8B3A';
  ctx.fillRect(3 * px, 5 * px, 10 * px, 10 * px);
  ctx.fillStyle = '#6B9B4A';
  ctx.fillRect(4 * px, 4 * px, 8 * px, 5 * px);
  ctx.fillStyle = '#7BBB5A';
  ctx.fillRect(5 * px, 4 * px, 4 * px, 2 * px);
  ctx.fillStyle = '#4A7B2A';
  ctx.fillRect(3 * px, 13 * px, 10 * px, 2 * px);
  ctx.fillStyle = '#3D6B22';
  ctx.fillRect(3 * px, 14 * px, 10 * px, 1 * px);

  // 眼睛
  ctx.fillStyle = '#FF4400';
  ctx.fillRect(5 * px, 8 * px, 2 * px, 2 * px);
  ctx.fillRect(9 * px, 8 * px, 2 * px, 2 * px);
  ctx.fillStyle = '#FFFF00';
  ctx.fillRect(5 * px, 8 * px, 1 * px, 1 * px);
  ctx.fillRect(9 * px, 8 * px, 1 * px, 1 * px);

  // 嘴
  ctx.fillStyle = '#2D1F0E';
  ctx.fillRect(6 * px, 11 * px, 4 * px, 1 * px);

  return canvas;
}

// === 背景贴图 ===
function createBackground() {
  const canvas = createCanvas(1200, 800);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // 天空渐变
  const skyGradient = ctx.createLinearGradient(0, 0, 0, 350);
  skyGradient.addColorStop(0, '#4A3520');
  skyGradient.addColorStop(0.3, '#8B5E3C');
  skyGradient.addColorStop(0.6, '#C4884D');
  skyGradient.addColorStop(0.85, '#D4A055');
  skyGradient.addColorStop(1, '#A07040');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, 1200, 350);

  // 太阳
  ctx.fillStyle = '#E8C040';
  ctx.beginPath();
  ctx.arc(900, 120, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 200, 80, 0.3)';
  ctx.beginPath();
  ctx.arc(900, 120, 60, 0, Math.PI * 2);
  ctx.fill();

  // 远处烟雾
  ctx.fillStyle = 'rgba(80, 60, 40, 0.3)';
  for (let i = 0; i < 1200; i += 80) {
    ctx.fillRect(i, 300, 60, 30);
  }

  // 废墟建筑天际线
  const buildings = [
    { x: 0, w: 80, h: 120 }, { x: 70, w: 50, h: 80 },
    { x: 120, w: 100, h: 150 }, { x: 220, w: 60, h: 100 },
    { x: 280, w: 120, h: 180 }, { x: 400, w: 70, h: 110 },
    { x: 470, w: 90, h: 140 }, { x: 560, w: 110, h: 200 },
    { x: 670, w: 60, h: 90 }, { x: 730, w: 130, h: 160 },
    { x: 860, w: 80, h: 120 }, { x: 940, w: 120, h: 170 },
    { x: 1060, w: 70, h: 100 }, { x: 1130, w: 70, h: 130 },
  ];

  for (const b of buildings) {
    const bx = b.x;
    const by = 350 - b.h;
    ctx.fillStyle = '#3D2E20';
    ctx.fillRect(bx, by, b.w, b.h);

    // 建筑损坏部分
    ctx.fillStyle = '#4A3520';
    if (b.h > 100) {
      ctx.fillRect(bx + b.w * 0.2, by, b.w * 0.5, 15);
      ctx.fillRect(bx + b.w * 0.5, by + 20, b.w * 0.4, 10);
    }

    // 窗户
    ctx.fillStyle = '#1A1208';
    for (let wy = by + 10; wy < 350 - 15; wy += 15) {
      for (let wx = bx + 5; wx < bx + b.w - 8; wx += 12) {
        if (Math.random() > 0.3) {
          ctx.fillRect(wx, wy, 6, 8);
        }
      }
    }
  }

  // 废弃车辆
  ctx.fillStyle = '#2A1F15';
  ctx.fillRect(100, 320, 150, 60);
  ctx.fillRect(350, 330, 120, 50);
  ctx.fillRect(700, 315, 180, 65);
  ctx.fillRect(950, 325, 140, 55);

  // 烟囱
  ctx.fillStyle = '#3D2E20';
  ctx.fillRect(240, 280, 20, 90);
  ctx.fillRect(780, 290, 24, 80);
  ctx.fillStyle = '#4A3520';
  ctx.fillRect(235, 277, 30, 5);
  ctx.fillRect(775, 287, 34, 5);

  // 地面渐变
  const groundGradient = ctx.createLinearGradient(0, 350, 0, 800);
  groundGradient.addColorStop(0, '#6B5D4A');
  groundGradient.addColorStop(0.2, '#5C5040');
  groundGradient.addColorStop(0.5, '#4A4235');
  groundGradient.addColorStop(0.8, '#3D362C');
  groundGradient.addColorStop(1, '#332C24');
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, 350, 1200, 450);

  // 地面裂纹
  ctx.fillStyle = '#3D362C';
  for (let x = 50; x < 1200; x += 150) {
    for (let i = 0; i < 5; i++) {
      const cx = x + i * 15;
      const cy = 360 + Math.random() * 20;
      ctx.fillRect(cx, cy, 2, 2);
    }
  }

  // 碎石
  ctx.fillStyle = '#5C5040';
  for (let i = 0; i < 15; i++) {
    const sx = Math.random() * 1200;
    const sy = 370 + Math.random() * 100;
    const s = 3 + Math.random() * 4;
    ctx.fillRect(sx, sy, s, s);
    ctx.fillStyle = '#6B5D4A';
    ctx.fillRect(sx + 1, sy, s - 1, s - 1);
    ctx.fillStyle = '#5C5040';
  }

  // 废弃轮胎
  ctx.fillStyle = '#2A1F15';
  ctx.fillRect(200, 420, 30, 30);
  ctx.fillStyle = '#1A1208';
  ctx.fillRect(206, 426, 18, 18);

  // 弹壳
  ctx.fillStyle = '#B8860B';
  for (let i = 0; i < 12; i++) {
    const ex = 100 + i * 100;
    const ey = 380 + (i * 10) % 50;
    ctx.fillRect(ex, ey, 6, 3);
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(ex, ey, 3, 3);
    ctx.fillStyle = '#B8860B';
  }

  // 铁丝网
  ctx.fillStyle = '#6B6B6B';
  const wireY = 450;
  for (let wx = 0; wx < 1200; wx += 6) {
    const wy = wireY + Math.sin(wx * 0.1) * 3;
    ctx.fillRect(wx, wy, 4, 1);
  }
  ctx.fillStyle = '#4A4A4A';
  for (let wx = 0; wx < 1200; wx += 100) {
    ctx.fillRect(wx, wireY - 15, 4, 25);
  }

  return canvas;
}

// === 生成所有贴图 ===
console.log('Generating sprites...');

const player = createPlayerSprite();
fs.writeFileSync(path.join(assetsDir, 'player.png'), player.toBuffer());
console.log('Created: player.png (' + player.width + 'x' + player.height + ')');

for (let i = 0; i < 4; i++) {
  const orc = createOrcSprite(i);
  fs.writeFileSync(path.join(assetsDir, 'monster_orc_' + i + '.png'), orc.toBuffer());
  console.log('Created: monster_orc_' + i + '.png (' + orc.width + 'x' + orc.height + ')');
}
// 默认orc
const orcDefault = createOrcSprite(0);
fs.writeFileSync(path.join(assetsDir, 'monster_orc.png'), orcDefault.toBuffer());
console.log('Created: monster_orc.png');

const slime = createSlimeSprite();
fs.writeFileSync(path.join(assetsDir, 'monster_slime.png'), slime.toBuffer());
console.log('Created: monster_slime.png (' + slime.width + 'x' + slime.height + ')');

const bg = createBackground();
fs.writeFileSync(path.join(assetsDir, 'background.png'), bg.toBuffer());
console.log('Created: background.png (' + bg.width + 'x' + bg.height + ')');

console.log('All sprites generated!');
