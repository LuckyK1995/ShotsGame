const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const assetsDir = path.join(__dirname, 'public', 'assets', 'ui');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function drawPixelRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function createPanel(width, height, options = {}) {
  const {
    baseColor = '#5D4037',
    borderColor = '#3D2914',
    highlightColor = '#8B7355',
    shadowColor = '#2D1F0E',
    topHighlight = '#6B5344',
    bottomShadow = '#4A3728',
  } = options;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawPixelRect(ctx, 0, 0, width, height, borderColor);
  drawPixelRect(ctx, 2, 2, width - 4, height - 4, baseColor);
  drawPixelRect(ctx, 2, 2, width - 4, 2, topHighlight);
  drawPixelRect(ctx, 2, height - 4, width - 4, 2, bottomShadow);
  drawPixelRect(ctx, 2, 2, 2, height - 4, highlightColor);
  drawPixelRect(ctx, width - 4, 2, 2, height - 4, shadowColor);

  for (let i = 0; i < width * height / 40; i++) {
    const px = 4 + Math.floor(Math.random() * (width - 8));
    const py = 4 + Math.floor(Math.random() * (height - 8));
    const noiseColor = Math.random() > 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)';
    drawPixelRect(ctx, px, py, 1, 1, noiseColor);
  }

  return canvas;
}

function createGoldButton(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawPixelRect(ctx, 0, 0, width, height, '#3D2914');
  const grad = ctx.createLinearGradient(0, 2, 0, height - 4);
  grad.addColorStop(0, '#CD853F');
  grad.addColorStop(0.5, '#B8860B');
  grad.addColorStop(1, '#8B6914');
  ctx.fillStyle = grad;
  ctx.fillRect(2, 2, width - 4, height - 4);

  drawPixelRect(ctx, 2, 2, width - 4, 2, '#DEB887');
  drawPixelRect(ctx, 2, 2, 2, height - 4, '#DAA520');
  drawPixelRect(ctx, width - 4, 2, 2, height - 4, '#6B4914');
  drawPixelRect(ctx, 2, height - 4, width - 4, 2, '#5D4037');

  for (let i = 0; i < 8; i++) {
    const px = 4 + Math.floor(Math.random() * (width - 8));
    const py = 4 + Math.floor(Math.random() * (height - 8));
    drawPixelRect(ctx, px, py, 1, 1, 'rgba(255,215,0,0.3)');
  }

  return canvas;
}

function createDarkButton(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawPixelRect(ctx, 0, 0, width, height, '#3D2914');
  const grad = ctx.createLinearGradient(0, 2, 0, height - 4);
  grad.addColorStop(0, '#6B5344');
  grad.addColorStop(0.5, '#5D4037');
  grad.addColorStop(1, '#4A3728');
  ctx.fillStyle = grad;
  ctx.fillRect(2, 2, width - 4, height - 4);

  drawPixelRect(ctx, 2, 2, width - 4, 2, '#8B7355');
  drawPixelRect(ctx, 2, 2, 2, height - 4, '#6B5344');
  drawPixelRect(ctx, width - 4, 2, 2, height - 4, '#3D2914');
  drawPixelRect(ctx, 2, height - 4, width - 4, 2, '#2D1F0E');

  return canvas;
}

function createItemSlot(width, height, rarity = 'common') {
  const colors = {
    common: { bg: '#5D4037', border: '#3D2914', glow: '#DEB887', inner: '#4A3728' },
    advanced: { bg: '#2E7D32', border: '#1B5E20', glow: '#4CAF50', inner: '#1B5E20' },
    fine: { bg: '#7B1FA2', border: '#4A148C', glow: '#9C27B0', inner: '#4A148C' },
    legendary: { bg: '#1565C0', border: '#0D47A1', glow: '#2196F3', inner: '#0D47A1' },
    epic: { bg: '#E65100', border: '#BF360C', glow: '#FF7043', inner: '#BF360C' },
    mythic: { bg: '#DC143C', border: '#8B0000', glow: '#FF6B6B', inner: '#8B0000' },
  };
  const c = colors[rarity] || colors.common;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawPixelRect(ctx, 0, 0, width, height, c.border);
  const grad = ctx.createLinearGradient(0, 2, 0, height - 4);
  grad.addColorStop(0, c.bg);
  grad.addColorStop(1, c.inner);
  ctx.fillStyle = grad;
  ctx.fillRect(2, 2, width - 4, height - 4);

  drawPixelRect(ctx, 2, 2, width - 4, 1, c.glow);
  drawPixelRect(ctx, 2, 2, 1, height - 4, c.glow);
  drawPixelRect(ctx, width - 3, 2, 1, height - 4, c.border);
  drawPixelRect(ctx, 2, height - 3, width - 4, 1, c.border);

  return canvas;
}

function createHealthBar(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawPixelRect(ctx, 0, 0, width, height, '#3D2914');
  drawPixelRect(ctx, 2, 2, width - 4, height - 4, '#2D1F0E');
  drawPixelRect(ctx, 2, 2, width - 4, 1, '#1A0F05');
  drawPixelRect(ctx, 2, 2, 1, height - 4, '#1A0F05');

  const fillGrad = ctx.createLinearGradient(0, 3, 0, height - 6);
  fillGrad.addColorStop(0, '#FF6B6B');
  fillGrad.addColorStop(0.5, '#DC143C');
  fillGrad.addColorStop(1, '#8B0000');
  ctx.fillStyle = fillGrad;
  ctx.fillRect(3, 3, Math.floor((width - 6) * 0.6), height - 6);

  drawPixelRect(ctx, 3, 3, Math.floor((width - 6) * 0.6), 1, '#FF8888');

  return canvas;
}

function createExpBar(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawPixelRect(ctx, 0, 0, width, height, '#3D2914');
  drawPixelRect(ctx, 2, 2, width - 4, height - 4, '#2D1F0E');
  drawPixelRect(ctx, 2, 2, width - 4, 1, '#1A0F05');
  drawPixelRect(ctx, 2, 2, 1, height - 4, '#1A0F05');

  const fillGrad = ctx.createLinearGradient(0, 3, 0, height - 6);
  fillGrad.addColorStop(0, '#DAA520');
  fillGrad.addColorStop(0.5, '#B8860B');
  fillGrad.addColorStop(1, '#8B6914');
  ctx.fillStyle = fillGrad;
  ctx.fillRect(3, 3, Math.floor((width - 6) * 0.3), height - 6);

  drawPixelRect(ctx, 3, 3, Math.floor((width - 6) * 0.3), 1, '#FFD700');

  return canvas;
}

function createBottomPanel(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#6B5344');
  grad.addColorStop(0.1, '#5D4037');
  grad.addColorStop(1, '#4A3728');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  drawPixelRect(ctx, 0, 0, width, 4, '#8B7355');
  drawPixelRect(ctx, 0, 0, 4, height, '#6B5344');
  drawPixelRect(ctx, width - 4, 0, 4, height, '#3D2914');
  drawPixelRect(ctx, 0, height - 4, width, 4, '#2D1F0E');

  for (let i = 0; i < width * height / 30; i++) {
    const px = Math.floor(Math.random() * width);
    const py = Math.floor(Math.random() * height);
    const noise = Math.random();
    if (noise > 0.7) {
      drawPixelRect(ctx, px, py, 1, 1, 'rgba(0,0,0,0.15)');
    } else if (noise < 0.1) {
      drawPixelRect(ctx, px, py, 1, 1, 'rgba(255,255,255,0.03)');
    }
  }

  return canvas;
}

function createInnerPanel(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawPixelRect(ctx, 0, 0, width, height, '#3D2914');
  drawPixelRect(ctx, 2, 2, width - 4, height - 4, '#2D1F0E');
  drawPixelRect(ctx, 2, 2, width - 4, 1, '#1A0F05');
  drawPixelRect(ctx, 2, 2, 1, height - 4, '#1A0F05');
  drawPixelRect(ctx, width - 3, 2, 1, height - 4, '#3D2914');
  drawPixelRect(ctx, 2, height - 3, width - 4, 1, '#3D2914');

  return canvas;
}

function createEquipmentIcon(slot, size = 48) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 16;

  const icons = {
    weapon: [
      '....XXXXXX......',
      '...X......X.....',
      '..X........X....',
      '.X..........X...',
      'X............X..',
      '.X..........X...',
      '..X........X....',
      '...X......X.....',
      '....XXXXXX......',
      '.......X........',
      '.......X........',
      '......XXX.......',
      '.....XXXXX......',
      '......XXX.......',
      '.......X........',
      '.......X........',
    ],
    armor: [
      '...XXXXXXXX.....',
      '..X........X....',
      '.X..........X...',
      'X....XXXX....X..',
      'X...X....X...X..',
      'X..X......X..X..',
      'X..X......X..X..',
      'X..X......X..X..',
      'X...X....X...X..',
      'X....XXXX....X..',
      '.X..........X...',
      '..X........X....',
      '...XXXXXXXX.....',
      '.................',
      '.................',
      '.................',
    ],
    helmet: [
      '....XXXXXXXX....',
      '...X........X...',
      '..X..........X..',
      '.X............X.',
      'X..............X',
      'X..X........X..X',
      'X..X........X..X',
      'X..............X',
      '.X............X.',
      '..X..........X..',
      '...X........X...',
      '....XXXXXXXX....',
      '.................',
      '.................',
      '.................',
      '.................',
    ],
    boots: [
      '.................',
      '.................',
      '.................',
      '......XXX........',
      '.....X...X.......',
      '....X.....X......',
      '....X.....X......',
      '....X.....X......',
      '....X.....X......',
      '....XXXXXXX......',
      '....X.....X......',
      '...XX.....XX.....',
      '..XXX.....XXX....',
      '.XXXX.....XXXX...',
      '.................',
      '.................',
    ],
    ring: [
      '.................',
      '.....XXXXX.......',
      '....X.....X......',
      '...X.......X.....',
      '..X.........X....',
      '..X.........X....',
      '..X.........X....',
      '..X.........X....',
      '..X.........X....',
      '...X.......X.....',
      '....X.....X......',
      '.....XXXXX.......',
      '.................',
      '.................',
      '.................',
      '.................',
    ],
    amulet: [
      '........X........',
      '.......X.X.......',
      '......X...X......',
      '.....X.....X.....',
      '....X.......X....',
      '...X.........X...',
      '..X...........X..',
      '..X....XXX....X..',
      '...X..X...X..X...',
      '....X.X...X.X....',
      '.....XX...XX.....',
      '......XXXXX......',
      '.......XXX.......',
      '........X........',
      '.................',
      '.................',
    ],
    gloves: [
      '...XXX...XXX.....',
      '..X...X.X...X....',
      '..X...X.X...X....',
      '..X...X.X...X....',
      '..X...X.X...X....',
      '..X...X.X...X....',
      '..X...X.X...X....',
      '..XXXXXXXXX......',
      '..X.......X......',
      '..X.......X......',
      '...X.....X.......',
      '....X...X........',
      '.....XXX.........',
      '.................',
      '.................',
      '.................',
    ],
    belt: [
      '.................',
      '.................',
      '.................',
      'XXXXXXXXXXXXXXXXX',
      'X...............X',
      'X..XXX...XXX....X',
      'X..X.X...X.X....X',
      'X..XXX...XXX....X',
      'X...............X',
      'XXXXXXXXXXXXXXXXX',
      '.................',
      '.................',
      '.................',
      '.................',
      '.................',
      '.................',
    ],
    necklace: [
      '........X........',
      '.......X.X.......',
      '......X...X......',
      '.....X.....X.....',
      '....X.......X....',
      '...X.........X...',
      '..X...........X..',
      '...X.........X...',
      '....X.......X....',
      '.....X..X..X.....',
      '......X.X.X......',
      '.......XXX.......',
      '........X........',
      '.................',
      '.................',
      '.................',
    ],
  };

  const icon = icons[slot] || icons.weapon;
  const colors = {
    outline: '#3D2914',
    main: '#C0C0C0',
    highlight: '#E8E8E8',
    shadow: '#808080',
    gem: '#FFD700',
  };

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (icon[y][x] === 'X') {
        const isEdge = y === 0 || icon[y - 1][x] !== 'X' ||
          y === 15 || icon[y + 1][x] !== 'X' ||
          x === 0 || icon[y][x - 1] !== 'X' ||
          x === 15 || icon[y][x + 1] !== 'X';

        if (isEdge) {
          drawPixelRect(ctx, x * s, y * s, s, s, colors.outline);
        } else {
          const isHighlight = y > 0 && icon[y - 1][x] !== 'X';
          drawPixelRect(ctx, x * s, y * s, s, s, isHighlight ? colors.highlight : colors.main);
        }
      }
    }
  }

  return canvas;
}

console.log('Generating UI sprites...');

const waveBtn = createGoldButton(100, 40);
fs.writeFileSync(path.join(assetsDir, 'btn_wave.png'), waveBtn.toBuffer());
console.log('Created: btn_wave.png');

const lvBtn = createDarkButton(90, 40);
fs.writeFileSync(path.join(assetsDir, 'btn_lv.png'), lvBtn.toBuffer());
console.log('Created: btn_lv.png');

const scorePanel = createGoldButton(250, 50);
fs.writeFileSync(path.join(assetsDir, 'panel_score.png'), scorePanel.toBuffer());
console.log('Created: panel_score.png');

const hiPanel = createDarkButton(160, 35);
fs.writeFileSync(path.join(assetsDir, 'panel_hi.png'), hiPanel.toBuffer());
console.log('Created: panel_hi.png');

const atkPanel = createDarkButton(100, 35);
fs.writeFileSync(path.join(assetsDir, 'panel_atk.png'), atkPanel.toBuffer());
console.log('Created: panel_atk.png');

const hpBar = createHealthBar(250, 20);
fs.writeFileSync(path.join(assetsDir, 'bar_hp.png'), hpBar.toBuffer());
console.log('Created: bar_hp.png');

const expBar = createExpBar(250, 16);
fs.writeFileSync(path.join(assetsDir, 'bar_exp.png'), expBar.toBuffer());
console.log('Created: bar_exp.png');

const equipTab = createGoldButton(100, 36);
fs.writeFileSync(path.join(assetsDir, 'tab_equip_active.png'), equipTab.toBuffer());
console.log('Created: tab_equip_active.png');

const itemTab = createDarkButton(100, 36);
fs.writeFileSync(path.join(assetsDir, 'tab_item.png'), itemTab.toBuffer());
console.log('Created: tab_item.png');

const skillTab = createDarkButton(100, 36);
fs.writeFileSync(path.join(assetsDir, 'tab_skill.png'), skillTab.toBuffer());
console.log('Created: tab_skill.png');

const itemSlotCommon = createItemSlot(56, 56, 'common');
fs.writeFileSync(path.join(assetsDir, 'slot_common.png'), itemSlotCommon.toBuffer());
console.log('Created: slot_common.png');

const itemSlotEmpty = createItemSlot(56, 56, 'common');
fs.writeFileSync(path.join(assetsDir, 'slot_empty.png'), itemSlotEmpty.toBuffer());
console.log('Created: slot_empty.png');

const innerPanel = createInnerPanel(400, 300);
fs.writeFileSync(path.join(assetsDir, 'panel_inner.png'), innerPanel.toBuffer());
console.log('Created: panel_inner.png');

const bottomPanel = createBottomPanel(800, 300);
fs.writeFileSync(path.join(assetsDir, 'panel_bottom.png'), bottomPanel.toBuffer());
console.log('Created: panel_bottom.png');

const slots = ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet', 'gloves', 'belt', 'necklace'];
slots.forEach(slot => {
  const icon = createEquipmentIcon(slot, 32);
  fs.writeFileSync(path.join(assetsDir, `icon_${slot}.png`), icon.toBuffer());
  console.log(`Created: icon_${slot}.png`);
});

console.log('All UI sprites generated successfully!');
