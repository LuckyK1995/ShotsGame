const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const assetsDir = path.join(__dirname, 'public', 'assets', 'ui_final');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function generateRoughEdge(width, height, edgeSize = 4) {
  const top = new Array(width).fill(edgeSize);
  const bottom = new Array(width).fill(edgeSize);
  const left = new Array(height).fill(edgeSize);
  const right = new Array(height).fill(edgeSize);

  let topVal = edgeSize;
  for (let x = 0; x < width; x++) {
    if (x % (3 + Math.floor(Math.random() * 5)) === 0) {
      topVal = Math.max(0, Math.min(edgeSize + 4, topVal + Math.floor(Math.random() * 5) - 2));
    }
    top[x] = Math.max(0, topVal + Math.floor(Math.random() * 2));
  }
  let botVal = edgeSize;
  for (let x = 0; x < width; x++) {
    if (x % (3 + Math.floor(Math.random() * 5)) === 0) {
      botVal = Math.max(0, Math.min(edgeSize + 4, botVal + Math.floor(Math.random() * 5) - 2));
    }
    bottom[x] = Math.max(0, botVal + Math.floor(Math.random() * 2));
  }
  let leftVal = edgeSize;
  for (let y = 0; y < height; y++) {
    if (y % (3 + Math.floor(Math.random() * 5)) === 0) {
      leftVal = Math.max(0, Math.min(edgeSize + 4, leftVal + Math.floor(Math.random() * 5) - 2));
    }
    left[y] = Math.max(0, leftVal + Math.floor(Math.random() * 2));
  }
  let rightVal = edgeSize;
  for (let y = 0; y < height; y++) {
    if (y % (3 + Math.floor(Math.random() * 5)) === 0) {
      rightVal = Math.max(0, Math.min(edgeSize + 4, rightVal + Math.floor(Math.random() * 5) - 2));
    }
    right[y] = Math.max(0, rightVal + Math.floor(Math.random() * 2));
  }
  return { top, bottom, left, right };
}

function drawPanel(width, height, palette) {
  const { topColor, midColor, botColor, borderColor, highlightColor, shadowColor, edgeSize = 5, noiseLevel = 0.25 } = palette;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const edges = generateRoughEdge(width, height, edgeSize);

  const maxTop = Math.max(...edges.top);
  const maxBot = Math.max(...edges.bottom);
  const maxLeft = Math.max(...edges.left);
  const maxRight = Math.max(...edges.right);
  const innerX = maxLeft;
  const innerY = maxTop;
  const innerW = width - maxLeft - maxRight;
  const innerH = height - maxTop - maxBot;

  const grad = ctx.createLinearGradient(0, innerY, 0, innerY + innerH);
  grad.addColorStop(0, topColor);
  grad.addColorStop(0.35, midColor);
  grad.addColorStop(0.7, midColor);
  grad.addColorStop(1, botColor);
  ctx.fillStyle = grad;
  ctx.fillRect(innerX, innerY, innerW, innerH);

  for (let y = innerY; y < innerY + innerH; y++) {
    const lw = edges.left[y];
    const rw = edges.right[y];
    if (lw < maxLeft) { px(ctx, 0, y, maxLeft - lw, 1, borderColor); }
    if (rw < maxRight) { px(ctx, width - (maxRight - rw), y, maxRight - rw, 1, borderColor); }
  }
  for (let x = innerX; x < innerX + innerW; x++) {
    const th = edges.top[x];
    const bh = edges.bottom[x];
    if (th < maxTop) { px(ctx, x, 0, 1, maxTop - th, borderColor); }
    if (bh < maxBot) { px(ctx, x, height - (maxBot - bh), 1, maxBot - bh, borderColor); }
  }

  ctx.fillStyle = borderColor;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < edges.top[x]; y++) { if (Math.random() > 0.15) px(ctx, x, y, 1 + Math.floor(Math.random()*2), 1, borderColor); }
    for (let y = height - edges.bottom[x]; y < height; y++) { if (Math.random() > 0.15) px(ctx, x, y, 1 + Math.floor(Math.random()*2), 1, borderColor); }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < edges.left[y]; x++) { if (Math.random() > 0.15) px(ctx, x, y, 1, 1 + Math.floor(Math.random()*2), borderColor); }
    for (let x = width - edges.right[y]; x < width; x++) { if (Math.random() > 0.15) px(ctx, x, y, 1, 1 + Math.floor(Math.random()*2), borderColor); }
  }

  for (let i = 0; i < 40; i++) {
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { const x = Math.floor(Math.random()*width); const y = edges.top[x]; if (y>0 && Math.random()>0.4) px(ctx, x, y-1, 1, 1, borderColor); }
    else if (side === 1) { const x = Math.floor(Math.random()*width); const y = height - edges.bottom[x]; if (y<height-1 && Math.random()>0.4) px(ctx, x, y, 1, 1, borderColor); }
    else if (side === 2) { const y = Math.floor(Math.random()*height); const x = edges.left[y]; if (x>0 && Math.random()>0.4) px(ctx, x-1, y, 1, 1, borderColor); }
    else { const y = Math.floor(Math.random()*height); const x = width - edges.right[y]; if (x<width-1 && Math.random()>0.4) px(ctx, x, y, 1, 1, borderColor); }
  }

  px(ctx, innerX, innerY, innerW, 3, highlightColor);
  px(ctx, innerX, innerY, 3, innerH, highlightColor);
  px(ctx, innerX + innerW - 3, innerY, 3, innerH, shadowColor);
  px(ctx, innerX, innerY + innerH - 3, innerW, 3, shadowColor);

  for (let i = 0; i < innerW * innerH * noiseLevel / 25; i++) {
    const rx = innerX + 4 + Math.floor(Math.random() * (innerW - 8));
    const ry = innerY + 4 + Math.floor(Math.random() * (innerH - 8));
    const v = Math.random();
    if (v > 0.65) px(ctx, rx, ry, 1+Math.floor(Math.random()*2), 1+Math.floor(Math.random()*2), 'rgba(0,0,0,0.18)');
    else if (v < 0.15) px(ctx, rx, ry, 1, 1, 'rgba(255,255,255,0.07)');
  }

  for (let i = 0; i < 20; i++) {
    const rx = innerX + Math.floor(Math.random() * innerW);
    const ry = innerY + Math.floor(Math.random() * innerH);
    const rw = 2 + Math.floor(Math.random() * 12);
    const rh = 2 + Math.floor(Math.random() * 6);
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.025)';
    ctx.fillRect(rx, ry, rw, rh);
  }

  return { canvas, innerX, innerY, innerW, innerH };
}

const stonePalette = {
  topColor: '#7A5A38',
  midColor: '#5A3E26',
  botColor: '#3D2A19',
  borderColor: '#1A0F05',
  highlightColor: '#8B6940',
  shadowColor: '#2A1A0D',
  edgeSize: 5,
  noiseLevel: 0.3,
};

const goldPalette = {
  topColor: '#E8C060',
  midColor: '#CD853F',
  botColor: '#8B6914',
  borderColor: '#3D2914',
  highlightColor: '#F0D080',
  shadowColor: '#6B4914',
  edgeSize: 3,
  noiseLevel: 0.15,
};

const darkPalette = {
  topColor: '#6A5A4A',
  midColor: '#4A3A2A',
  botColor: '#3A2A1A',
  borderColor: '#1A0F05',
  highlightColor: '#7A6A5A',
  shadowColor: '#2A1A0D',
  edgeSize: 3,
  noiseLevel: 0.2,
};

const deepPalette = {
  topColor: '#3D2A19',
  midColor: '#2D1F0E',
  botColor: '#1A0F05',
  borderColor: '#0D0804',
  highlightColor: '#4A3728',
  shadowColor: '#050301',
  edgeSize: 4,
  noiseLevel: 0.12,
};

console.log('Generating final UI sprites...');

const panelStone = drawPanel(800, 380, stonePalette);
fs.writeFileSync(path.join(assetsDir, 'panel_stone.png'), panelStone.canvas.toBuffer());
console.log('panel_stone.png ✓');

const panelInner = drawPanel(500, 300, deepPalette);
fs.writeFileSync(path.join(assetsDir, 'panel_inner.png'), panelInner.canvas.toBuffer());
console.log('panel_inner.png ✓');

const panelGold = drawPanel(280, 52, goldPalette);
fs.writeFileSync(path.join(assetsDir, 'panel_gold.png'), panelGold.canvas.toBuffer());
console.log('panel_gold.png ✓');

const panelDark = drawPanel(160, 36, darkPalette);
fs.writeFileSync(path.join(assetsDir, 'panel_dark.png'), panelDark.canvas.toBuffer());
console.log('panel_dark.png ✓');

const btnWave = drawPanel(100, 40, goldPalette);
fs.writeFileSync(path.join(assetsDir, 'btn_gold.png'), btnWave.canvas.toBuffer());
console.log('btn_gold.png ✓');

const btnDark = drawPanel(90, 36, darkPalette);
fs.writeFileSync(path.join(assetsDir, 'btn_dark.png'), btnDark.canvas.toBuffer());
console.log('btn_dark.png ✓');

const barBg = drawPanel(260, 26, deepPalette);
fs.writeFileSync(path.join(assetsDir, 'bar_bg.png'), barBg.canvas.toBuffer());
console.log('bar_bg.png ✓');

const expBarBg = drawPanel(260, 20, deepPalette);
fs.writeFileSync(path.join(assetsDir, 'bar_exp_bg.png'), expBarBg.canvas.toBuffer());
console.log('bar_exp_bg.png ✓');

function drawItemSlot(size, rarity = 'common', empty = false) {
  const rarityPalettes = {
    common: { top: '#E8D0A0', mid: '#C4A070', bot: '#8B6914', border: '#5D4037', highlight: '#F8E8C0', glow: '#FFE066' },
    advanced: { top: '#A8E8A8', mid: '#50C050', bot: '#2A702A', border: '#1A501A', highlight: '#D0FFD0', glow: '#00FF00' },
    fine: { top: '#E8A8E8', mid: '#C050C0', bot: '#702A70', border: '#501A50', highlight: '#FFD0FF', glow: '#FF00FF' },
    legendary: { top: '#A8D0F0', mid: '#5080D0', bot: '#2A4A80', border: '#1A3060', highlight: '#D0E8FF', glow: '#00BFFF' },
    epic: { top: '#FFD870', mid: '#FF8C00', bot: '#B05000', border: '#703000', highlight: '#FFECB0', glow: '#FFA500' },
    mythic: { top: '#FF8080', mid: '#DC143C', bot: '#8B0000', border: '#500000', highlight: '#FFB0B0', glow: '#FF0000' },
  };

  if (empty) {
    return drawPanel(size, size, deepPalette).canvas;
  }
  const c = rarityPalettes[rarity] || rarityPalettes.common;
  const result = drawPanel(size, size, {
    topColor: c.top,
    midColor: c.mid,
    botColor: c.bot,
    borderColor: c.border,
    highlightColor: c.highlight,
    shadowColor: c.border,
    edgeSize: 3,
    noiseLevel: 0.1,
  });
  return result.canvas;
}

const slotEmpty = drawItemSlot(60, 'common', true);
fs.writeFileSync(path.join(assetsDir, 'slot_empty.png'), slotEmpty.toBuffer());
console.log('slot_empty.png ✓');

['common', 'advanced', 'fine', 'legendary', 'epic', 'mythic'].forEach(r => {
  const slot = drawItemSlot(60, r, false);
  fs.writeFileSync(path.join(assetsDir, `slot_${r}.png`), slot.toBuffer());
  console.log(`slot_${r}.png ✓`);
});

const tabActive = drawPanel(110, 38, goldPalette);
fs.writeFileSync(path.join(assetsDir, 'tab_active.png'), tabActive.canvas.toBuffer());
console.log('tab_active.png ✓');

console.log('\nAll final UI sprites generated!');
