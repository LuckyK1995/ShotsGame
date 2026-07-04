const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const assetsDir = path.join(__dirname, 'public', 'assets', 'ui3');
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
    if (x % (2 + Math.floor(Math.random() * 4)) === 0) {
      topVal = Math.max(0, Math.min(edgeSize + 3, topVal + Math.floor(Math.random() * 5) - 2));
    }
    top[x] = Math.max(0, topVal + Math.floor(Math.random() * 2));
  }

  let botVal = edgeSize;
  for (let x = 0; x < width; x++) {
    if (x % (2 + Math.floor(Math.random() * 4)) === 0) {
      botVal = Math.max(0, Math.min(edgeSize + 3, botVal + Math.floor(Math.random() * 5) - 2));
    }
    bottom[x] = Math.max(0, botVal + Math.floor(Math.random() * 2));
  }

  let leftVal = edgeSize;
  for (let y = 0; y < height; y++) {
    if (y % (2 + Math.floor(Math.random() * 4)) === 0) {
      leftVal = Math.max(0, Math.min(edgeSize + 3, leftVal + Math.floor(Math.random() * 5) - 2));
    }
    left[y] = Math.max(0, leftVal + Math.floor(Math.random() * 2));
  }

  let rightVal = edgeSize;
  for (let y = 0; y < height; y++) {
    if (y % (2 + Math.floor(Math.random() * 4)) === 0) {
      rightVal = Math.max(0, Math.min(edgeSize + 3, rightVal + Math.floor(Math.random() * 5) - 2));
    }
    right[y] = Math.max(0, rightVal + Math.floor(Math.random() * 2));
  }

  return { top, bottom, left, right };
}

function drawRoughPanel(width, height, options = {}) {
  const {
    topColor = '#7A5A38',
    midColor = '#5A3E26',
    botColor = '#3D2A19',
    borderColor = '#2A1A0D',
    highlightColor = '#8B6940',
    shadowColor = '#1A0F05',
    edgeSize = 4,
    noiseLevel = 0.2,
  } = options;

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
  grad.addColorStop(0.3, midColor);
  grad.addColorStop(0.7, midColor);
  grad.addColorStop(1, botColor);
  ctx.fillStyle = grad;
  ctx.fillRect(innerX, innerY, innerW, innerH);

  for (let y = innerY; y < innerY + innerH; y++) {
    const leftW = edges.left[y];
    const rightW = edges.right[y];
    if (leftW < maxLeft) {
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, y, maxLeft - leftW, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(maxLeft - leftW, y, leftW, 1);
    }
    if (rightW < maxRight) {
      ctx.fillStyle = borderColor;
      ctx.fillRect(width - (maxRight - rightW), y, maxRight - rightW, 1);
    }
  }

  for (let x = innerX; x < innerX + innerW; x++) {
    const topH = edges.top[x];
    const botH = edges.bottom[x];
    if (topH < maxTop) {
      ctx.fillStyle = borderColor;
      ctx.fillRect(x, 0, 1, maxTop - topH);
    }
    if (botH < maxBot) {
      ctx.fillStyle = borderColor;
      ctx.fillRect(x, height - (maxBot - botH), 1, maxBot - botH);
    }
  }

  ctx.fillStyle = borderColor;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < edges.top[x]; y++) {
      if (Math.random() > 0.2) {
        px(ctx, x, y, 1 + Math.floor(Math.random() * 2), 1, borderColor);
      }
    }
    for (let y = height - edges.bottom[x]; y < height; y++) {
      if (Math.random() > 0.2) {
        px(ctx, x, y, 1 + Math.floor(Math.random() * 2), 1, borderColor);
      }
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < edges.left[y]; x++) {
      if (Math.random() > 0.2) {
        px(ctx, x, y, 1, 1 + Math.floor(Math.random() * 2), borderColor);
      }
    }
    for (let x = width - edges.right[y]; x < width; x++) {
      if (Math.random() > 0.2) {
        px(ctx, x, y, 1, 1 + Math.floor(Math.random() * 2), borderColor);
      }
    }
  }

  for (let i = 0; i < 30; i++) {
    const side = Math.floor(Math.random() * 4);
    if (side === 0) {
      const x = Math.floor(Math.random() * width);
      const y = edges.top[x];
      if (y > 0 && Math.random() > 0.5) {
        px(ctx, x, y - 1, 1, 1, borderColor);
      }
    } else if (side === 1) {
      const x = Math.floor(Math.random() * width);
      const y = height - edges.bottom[x];
      if (y < height - 1 && Math.random() > 0.5) {
        px(ctx, x, y, 1, 1, borderColor);
      }
    } else if (side === 2) {
      const y = Math.floor(Math.random() * height);
      const x = edges.left[y];
      if (x > 0 && Math.random() > 0.5) {
        px(ctx, x - 1, y, 1, 1, borderColor);
      }
    } else {
      const y = Math.floor(Math.random() * height);
      const x = width - edges.right[y];
      if (x < width - 1 && Math.random() > 0.5) {
        px(ctx, x, y, 1, 1, borderColor);
      }
    }
  }

  px(ctx, innerX, innerY, innerW, 2, highlightColor);
  px(ctx, innerX, innerY, 2, innerH, highlightColor);
  px(ctx, innerX + innerW - 2, innerY, 2, innerH, shadowColor);
  px(ctx, innerX, innerY + innerH - 2, innerW, 2, shadowColor);

  for (let i = 0; i < innerW * innerH * noiseLevel / 20; i++) {
    const rx = innerX + 4 + Math.floor(Math.random() * (innerW - 8));
    const ry = innerY + 4 + Math.floor(Math.random() * (innerH - 8));
    const v = Math.random();
    if (v > 0.65) {
      px(ctx, rx, ry, 1 + Math.floor(Math.random() * 2), 1 + Math.floor(Math.random() * 2), 'rgba(0,0,0,0.2)');
    } else if (v < 0.15) {
      px(ctx, rx, ry, 1, 1, 'rgba(255,255,255,0.06)');
    }
  }

  return { canvas, innerX, innerY, innerW, innerH };
}

function drawGoldPanel(width, height) {
  const result = drawRoughPanel(width, height, {
    topColor: '#E8C060',
    midColor: '#CD853F',
    botColor: '#8B6914',
    borderColor: '#3D2914',
    highlightColor: '#F0D080',
    shadowColor: '#6B4914',
    edgeSize: 3,
    noiseLevel: 0.15,
  });
  const { canvas, innerX, innerY, innerW, innerH } = result;
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < 12; i++) {
    px(
      ctx,
      innerX + 4 + Math.random() * (innerW - 8),
      innerY + 4 + Math.random() * (innerH / 2),
      1, 1,
      'rgba(255,240,180,0.4)'
    );
  }
  return canvas;
}

function drawDarkPanel(width, height) {
  const result = drawRoughPanel(width, height, {
    topColor: '#6A5A4A',
    midColor: '#4A3A2A',
    botColor: '#3A2A1A',
    borderColor: '#2A1A0D',
    highlightColor: '#7A6A5A',
    shadowColor: '#1A0F05',
    edgeSize: 3,
    noiseLevel: 0.18,
  });
  return result.canvas;
}

function drawStonePanel(width, height) {
  const result = drawRoughPanel(width, height, {
    topColor: '#6B4A2E',
    midColor: '#5A3E26',
    botColor: '#3D2A19',
    borderColor: '#2A1A0D',
    highlightColor: '#7A5A38',
    shadowColor: '#2A1A0D',
    edgeSize: 5,
    noiseLevel: 0.25,
  });
  const { canvas, innerX, innerY, innerW, innerH } = result;
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < 30; i++) {
    const rx = innerX + Math.floor(Math.random() * innerW);
    const ry = innerY + Math.floor(Math.random() * innerH);
    const rw = 3 + Math.floor(Math.random() * 10);
    const rh = 2 + Math.floor(Math.random() * 6);
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.03)';
    ctx.fillRect(rx, ry, rw, rh);
  }
  return canvas;
}

function drawInnerPanel(width, height) {
  const result = drawRoughPanel(width, height, {
    topColor: '#2D1F0E',
    midColor: '#1A0F05',
    botColor: '#0D0804',
    borderColor: '#2A1A0D',
    highlightColor: '#3D2914',
    shadowColor: '#050301',
    edgeSize: 4,
    noiseLevel: 0.1,
  });
  return result.canvas;
}

function drawItemSlot(width, height, rarity = 'common', empty = false) {
  const colors = {
    common: { top: '#F0D8A8', mid: '#D4B480', bot: '#A07848', border: '#6B4914', highlight: '#FFF0D0' },
    advanced: { top: '#A8E8A8', mid: '#50C850', bot: '#2A802A', border: '#1A501A', highlight: '#D0FFD0' },
    fine: { top: '#E8A8E8', mid: '#C850C8', bot: '#802A80', border: '#501A50', highlight: '#FFD0FF' },
    legendary: { top: '#A8D0E8', mid: '#5080C8', bot: '#2A4A80', border: '#1A3050', highlight: '#D0E8FF' },
    epic: { top: '#FFD870', mid: '#FF8C00', bot: '#B85C00', border: '#7A3A00', highlight: '#FFECB0' },
    mythic: { top: '#FF8080', mid: '#DC143C', bot: '#8B0000', border: '#5C0000', highlight: '#FFB0B0' },
  };

  if (empty) {
    const result = drawRoughPanel(width, height, {
      topColor: '#2D1F0E',
      midColor: '#1A0F05',
      botColor: '#0D0804',
      borderColor: '#2A1A0D',
      highlightColor: '#3D2914',
      shadowColor: '#050301',
      edgeSize: 3,
      noiseLevel: 0.08,
    });
    return result.canvas;
  }

  const c = colors[rarity] || colors.common;
  const result = drawRoughPanel(width, height, {
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

function drawBar(width, height) {
  const result = drawRoughPanel(width, height, {
    topColor: '#2D1F0E',
    midColor: '#1A0F05',
    botColor: '#0D0804',
    borderColor: '#2A1A0D',
    highlightColor: '#3D2914',
    shadowColor: '#050301',
    edgeSize: 2,
    noiseLevel: 0.05,
  });
  return result.canvas;
}

console.log('Generating v3 UI sprites (rough edges)...');

const stonePanel = drawStonePanel(800, 400);
fs.writeFileSync(path.join(assetsDir, 'panel_stone.png'), stonePanel.toBuffer());
console.log('Created: panel_stone.png');

const goldPanel = drawGoldPanel(240, 48);
fs.writeFileSync(path.join(assetsDir, 'panel_gold.png'), goldPanel.toBuffer());
console.log('Created: panel_gold.png');

const darkPanel = drawDarkPanel(140, 32);
fs.writeFileSync(path.join(assetsDir, 'panel_dark.png'), darkPanel.toBuffer());
console.log('Created: panel_dark.png');

const waveBtn = drawGoldPanel(90, 36);
fs.writeFileSync(path.join(assetsDir, 'btn_wave.png'), waveBtn.toBuffer());
console.log('Created: btn_wave.png');

const lvBtn = drawDarkPanel(80, 36);
fs.writeFileSync(path.join(assetsDir, 'btn_lv.png'), lvBtn.toBuffer());
console.log('Created: btn_lv.png');

const atkBtn = drawDarkPanel(90, 28);
fs.writeFileSync(path.join(assetsDir, 'btn_atk.png'), atkBtn.toBuffer());
console.log('Created: btn_atk.png');

const hpBar = drawBar(240, 22);
fs.writeFileSync(path.join(assetsDir, 'bar_bg.png'), hpBar.toBuffer());
console.log('Created: bar_bg.png');

const expBar = drawBar(240, 18);
fs.writeFileSync(path.join(assetsDir, 'bar_exp_bg.png'), expBar.toBuffer());
console.log('Created: bar_exp_bg.png');

const innerPanel = drawInnerPanel(500, 350);
fs.writeFileSync(path.join(assetsDir, 'panel_inner.png'), innerPanel.toBuffer());
console.log('Created: panel_inner.png');

const slotEmpty = drawItemSlot(56, 56, 'common', true);
fs.writeFileSync(path.join(assetsDir, 'slot_empty.png'), slotEmpty.toBuffer());
console.log('Created: slot_empty.png');

['common', 'advanced', 'fine', 'legendary', 'epic', 'mythic'].forEach(rarity => {
  const slot = drawItemSlot(56, 56, rarity, false);
  fs.writeFileSync(path.join(assetsDir, `slot_${rarity}.png`), slot.toBuffer());
  console.log(`Created: slot_${rarity}.png`);
});

const tabActive = drawGoldPanel(100, 34);
fs.writeFileSync(path.join(assetsDir, 'tab_active.png'), tabActive.toBuffer());
console.log('Created: tab_active.png');

console.log('All v3 UI sprites generated!');
