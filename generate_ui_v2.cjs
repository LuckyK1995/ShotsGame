const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const assetsDir = path.join(__dirname, 'public', 'assets', 'ui2');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawStoneNoise(ctx, x, y, w, h, baseColor, intensity = 0.15) {
  for (let i = 0; i < w * h * intensity / 3; i++) {
    const rx = x + Math.floor(Math.random() * w);
    const ry = y + Math.floor(Math.random() * h);
    const v = Math.random();
    if (v > 0.6) {
      px(ctx, rx, ry, 1, 1, 'rgba(0,0,0,0.25)');
    } else if (v < 0.2) {
      px(ctx, rx, ry, 1, 1, 'rgba(255,255,255,0.08)');
    }
  }
}

function createStonePanel(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#6B4A2E');
  grad.addColorStop(0.1, '#5A3E26');
  grad.addColorStop(0.5, '#4A3320');
  grad.addColorStop(0.9, '#3D2A19');
  grad.addColorStop(1, '#332214');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 50; i++) {
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);
    const rw = 4 + Math.floor(Math.random() * 15);
    const rh = 3 + Math.floor(Math.random() * 10);
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(rx, ry, rw, rh);
  }

  for (let x = 0; x < width; x += 3) {
    const edgeNoise = Math.floor(Math.random() * 3) - 1;
    px(ctx, x, 0, 2, 2 + edgeNoise, '#2A1A0D');
    px(ctx, x, height - 2 - edgeNoise, 2, 2 + edgeNoise, '#2A1A0D');
  }
  for (let y = 0; y < height; y += 3) {
    const edgeNoise = Math.floor(Math.random() * 3) - 1;
    px(ctx, 0, y, 2 + edgeNoise, 2, '#2A1A0D');
    px(ctx, width - 2 - edgeNoise, y, 2 + edgeNoise, 2, '#2A1A0D');
  }

  drawStoneNoise(ctx, 4, 4, width - 8, height - 8, '#4A3320', 0.2);

  return canvas;
}

function createGoldTab(width, height, active = true) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (active) {
    const grad = ctx.createLinearGradient(0, 2, 0, height - 4);
    grad.addColorStop(0, '#DAA520');
    grad.addColorStop(0.3, '#CD853F');
    grad.addColorStop(0.7, '#B8860B');
    grad.addColorStop(1, '#8B6914');
    ctx.fillStyle = grad;
    ctx.fillRect(1, 1, width - 2, height - 2);

    px(ctx, 2, 2, width - 4, 2, '#F0D070');
    px(ctx, 2, 2, 2, height - 4, '#DAA520');
    px(ctx, width - 4, 2, 2, height - 4, '#6B4914');
    px(ctx, 2, height - 4, width - 4, 2, '#5D4037');

    px(ctx, 0, 0, width, 1, '#3D2914');
    px(ctx, 0, height - 1, width, 1, '#3D2914');
    px(ctx, 0, 0, 1, height, '#3D2914');
    px(ctx, width - 1, 0, 1, height, '#3D2914');

    for (let i = 0; i < 8; i++) {
      px(ctx, 4 + Math.random() * (width - 8), 4 + Math.random() * (height - 8), 1, 1, 'rgba(255,255,200,0.4)');
    }
  } else {
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);
  }

  return canvas;
}

function createItemSlot(width, height, rarity = 'common', empty = false) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (empty) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#2D1F0E');
    grad.addColorStop(1, '#1A0F05');
    ctx.fillStyle = grad;
    ctx.fillRect(3, 3, width - 6, height - 6);

    px(ctx, 2, 2, width - 4, 1, '#3D2914');
    px(ctx, 2, height - 3, width - 4, 1, '#0A0500');
    px(ctx, 2, 2, 1, height - 4, '#3D2914');
    px(ctx, width - 3, 2, 1, height - 4, '#0A0500');

    px(ctx, 0, 0, width, 2, '#2A1A0D');
    px(ctx, 0, height - 2, width, 2, '#2A1A0D');
    px(ctx, 0, 0, 2, height, '#2A1A0D');
    px(ctx, width - 2, 0, 2, height, '#2A1A0D');
  } else {
    const colors = {
      common: { top: '#F0D8A8', mid: '#D4B480', bot: '#A07848', border: '#7A5A28', highlight: '#FFF0D0' },
      advanced: { top: '#90EE90', mid: '#32CD32', bot: '#228B22', border: '#006400', highlight: '#B0FFB0' },
      fine: { top: '#EE82EE', mid: '#DA70D6', bot: '#9932CC', border: '#6A0DAD', highlight: '#FFB0FF' },
      legendary: { top: '#87CEEB', mid: '#4169E1', bot: '#0000CD', border: '#00008B', highlight: '#B0E0E6' },
      epic: { top: '#FFD700', mid: '#FF8C00', bot: '#CC5500', border: '#8B4513', highlight: '#FFEC8B' },
      mythic: { top: '#FF6B6B', mid: '#DC143C', bot: '#8B0000', border: '#5C0000', highlight: '#FFB0B0' },
    };
    const c = colors[rarity] || colors.common;

    const grad = ctx.createLinearGradient(0, 2, 0, height - 4);
    grad.addColorStop(0, c.top);
    grad.addColorStop(0.4, c.mid);
    grad.addColorStop(1, c.bot);
    ctx.fillStyle = grad;
    ctx.fillRect(2, 2, width - 4, height - 4);

    px(ctx, 3, 3, width - 6, 2, c.highlight);
    px(ctx, 3, 3, 2, height - 6, c.highlight);
    px(ctx, width - 5, 3, 2, height - 6, c.border);
    px(ctx, 3, height - 5, width - 6, 2, c.border);

    px(ctx, 0, 0, width, 2, c.border);
    px(ctx, 0, height - 2, width, 2, c.border);
    px(ctx, 0, 0, 2, height, c.border);
    px(ctx, width - 2, 0, 2, height, c.border);

    for (let i = 0; i < 5; i++) {
      px(ctx, 4 + Math.random() * (width - 8), 4 + Math.random() * (height - 8), 1, 1, 'rgba(255,255,255,0.3)');
    }
  }

  return canvas;
}

function createTopBarPanel(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#5A3E26');
  grad.addColorStop(0.5, '#4A3320');
  grad.addColorStop(1, '#3D2A19');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  px(ctx, 0, 0, width, 2, '#7A5A38');
  px(ctx, 0, height - 2, width, 2, '#2A1A0D');
  px(ctx, 0, 0, 2, height, '#6A4A28');
  px(ctx, width - 2, 0, 2, height, '#2A1A0D');

  drawStoneNoise(ctx, 2, 2, width - 4, height - 4, '#4A3320', 0.1);

  return canvas;
}

function createGoldScorePanel(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 2, 0, height - 4);
  grad.addColorStop(0, '#DAA520');
  grad.addColorStop(0.3, '#CD853F');
  grad.addColorStop(0.7, '#B8860B');
  grad.addColorStop(1, '#8B6914');
  ctx.fillStyle = grad;
  ctx.fillRect(1, 1, width - 2, height - 2);

  px(ctx, 2, 2, width - 4, 2, '#F0D070');
  px(ctx, 2, 2, 2, height - 4, '#DAA520');
  px(ctx, width - 4, 2, 2, height - 4, '#6B4914');
  px(ctx, 2, height - 4, width - 4, 2, '#5D4037');

  px(ctx, 0, 0, width, 1, '#3D2914');
  px(ctx, 0, height - 1, width, 1, '#3D2914');
  px(ctx, 0, 0, 1, height, '#3D2914');
  px(ctx, width - 1, 0, 1, height, '#3D2914');

  return canvas;
}

function createDarkSmallPanel(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 2, 0, height - 4);
  grad.addColorStop(0, '#5A4A3A');
  grad.addColorStop(0.5, '#4A3A2A');
  grad.addColorStop(1, '#3A2A1A');
  ctx.fillStyle = grad;
  ctx.fillRect(1, 1, width - 2, height - 2);

  px(ctx, 2, 2, width - 4, 1, '#6A5A4A');
  px(ctx, 2, 2, 1, height - 4, '#5A4A3A');
  px(ctx, width - 3, 2, 1, height - 4, '#2A1A0A');
  px(ctx, 2, height - 3, width - 4, 1, '#2A1A0A');

  px(ctx, 0, 0, width, 1, '#2A1A0D');
  px(ctx, 0, height - 1, width, 1, '#2A1A0D');
  px(ctx, 0, 0, 1, height, '#2A1A0D');
  px(ctx, width - 1, 0, 1, height, '#2A1A0D');

  return canvas;
}

function createHpBar(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1A0F05';
  ctx.fillRect(2, 2, width - 4, height - 4);
  px(ctx, 0, 0, width, 2, '#3D2914');
  px(ctx, 0, height - 2, width, 2, '#3D2914');
  px(ctx, 0, 0, 2, height, '#3D2914');
  px(ctx, width - 2, 0, 2, height, '#3D2914');
  px(ctx, 3, 3, width - 6, 1, '#0A0500');
  px(ctx, 3, 3, 1, height - 6, '#0A0500');

  return canvas;
}

console.log('Generating v2 UI sprites...');

const bottomPanel = createStonePanel(800, 400);
fs.writeFileSync(path.join(assetsDir, 'panel_stone.png'), bottomPanel.toBuffer());
console.log('Created: panel_stone.png');

const topBar = createTopBarPanel(800, 140);
fs.writeFileSync(path.join(assetsDir, 'panel_topbar.png'), topBar.toBuffer());
console.log('Created: panel_topbar.png');

const scorePanel = createGoldScorePanel(240, 48);
fs.writeFileSync(path.join(assetsDir, 'panel_gold.png'), scorePanel.toBuffer());
console.log('Created: panel_gold.png');

const darkPanel = createDarkSmallPanel(140, 32);
fs.writeFileSync(path.join(assetsDir, 'panel_dark.png'), darkPanel.toBuffer());
console.log('Created: panel_dark.png');

const waveBtn = createGoldScorePanel(90, 36);
fs.writeFileSync(path.join(assetsDir, 'btn_wave.png'), waveBtn.toBuffer());
console.log('Created: btn_wave.png');

const lvBtn = createDarkSmallPanel(80, 36);
fs.writeFileSync(path.join(assetsDir, 'btn_lv.png'), lvBtn.toBuffer());
console.log('Created: btn_lv.png');

const atkBtn = createDarkSmallPanel(90, 32);
fs.writeFileSync(path.join(assetsDir, 'btn_atk.png'), atkBtn.toBuffer());
console.log('Created: btn_atk.png');

const hpBarBg = createHpBar(240, 22);
fs.writeFileSync(path.join(assetsDir, 'bar_hp_bg.png'), hpBarBg.toBuffer());
console.log('Created: bar_hp_bg.png');

const expBarBg = createHpBar(240, 18);
fs.writeFileSync(path.join(assetsDir, 'bar_exp_bg.png'), expBarBg.toBuffer());
console.log('Created: bar_exp_bg.png');

const slotEmpty = createItemSlot(56, 56, 'common', true);
fs.writeFileSync(path.join(assetsDir, 'slot_empty.png'), slotEmpty.toBuffer());
console.log('Created: slot_empty.png');

['common', 'advanced', 'fine', 'legendary', 'epic', 'mythic'].forEach(rarity => {
  const slot = createItemSlot(56, 56, rarity, false);
  fs.writeFileSync(path.join(assetsDir, `slot_${rarity}.png`), slot.toBuffer());
  console.log(`Created: slot_${rarity}.png`);
});

const innerPanel = createStonePanel(500, 350);
fs.writeFileSync(path.join(assetsDir, 'panel_inner.png'), innerPanel.toBuffer());
console.log('Created: panel_inner.png');

console.log('All v2 UI sprites generated!');
