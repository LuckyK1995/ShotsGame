const fs = require('fs');

const content = fs.readFileSync('src/game/GameEngine.ts', 'utf8');
const lines = content.split('\n');

// 找到renderPlayer的开始行
let startLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('private renderPlayer()')) {
    startLine = i;
    break;
  }
}

// 找到renderBullets的开始行（作为renderPlayer的结束）
let endLine = -1;
for (let i = startLine; i < lines.length; i++) {
  if (lines[i].includes('private renderBullets()')) {
    endLine = i;
    break;
  }
}

console.log(`Start line: ${startLine + 1}, End line: ${endLine + 1}`);

const newRenderPlayer = `  private renderPlayer(): void {
    const ctx = this.ctx;
    const { x, y } = this.player;
    const px = 2;

    const isShooting = this.muzzleFlashTimer > 0;
    const recoil = isShooting ? -2 * px : 0;

    ctx.save();
    ctx.translate(x, y);

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(2 * px, 27 * px, 16 * px, 2 * px);

    // === 军靴 ===
    ctx.fillStyle = '#2D1F0E';
    ctx.fillRect(3 * px, 25 * px, 4 * px, 3 * px);
    ctx.fillRect(11 * px, 25 * px, 4 * px, 3 * px);
    // 靴底
    ctx.fillStyle = '#1A1208';
    ctx.fillRect(3 * px, 27 * px, 5 * px, 1 * px);
    ctx.fillRect(10 * px, 27 * px, 5 * px, 1 * px);
    // 靴带
    ctx.fillStyle = '#3D2914';
    ctx.fillRect(4 * px, 25 * px, 2 * px, 1 * px);
    ctx.fillRect(12 * px, 25 * px, 2 * px, 1 * px);

    // === 军裤 ===
    ctx.fillStyle = '#3D6B3D';
    ctx.fillRect(4 * px, 18 * px, 4 * px, 7 * px);
    ctx.fillRect(10 * px, 18 * px, 4 * px, 7 * px);
    // 裤子褶皱
    ctx.fillStyle = '#2D5A2D';
    ctx.fillRect(4 * px, 20 * px, 1 * px, 3 * px);
    ctx.fillRect(13 * px, 19 * px, 1 * px, 4 * px);
    // 裤子高光
    ctx.fillStyle = '#4A7B4A';
    ctx.fillRect(6 * px, 19 * px, 1 * px, 3 * px);
    ctx.fillRect(11 * px, 19 * px, 1 * px, 3 * px);
    // 裤脚
    ctx.fillStyle = '#2D5A2D';
    ctx.fillRect(4 * px, 24 * px, 4 * px, 1 * px);
    ctx.fillRect(10 * px, 24 * px, 4 * px, 1 * px);

    // === 腰带 ===
    ctx.fillStyle = '#3D2914';
    ctx.fillRect(3 * px, 17 * px, 12 * px, 2 * px);
    // 腰带扣
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(8 * px, 17 * px, 2 * px, 2 * px);
    // 带孔
    ctx.fillStyle = '#2D1F0E';
    ctx.fillRect(5 * px, 17.5 * px, 1 * px, 1 * px);
    ctx.fillRect(11 * px, 17.5 * px, 1 * px, 1 * px);

    // 上半身（射击时后坐力）
    ctx.save();
    ctx.translate(0, recoil);

    // === 军绿色上衣 ===
    ctx.fillStyle = '#4A8B4A';
    ctx.fillRect(3 * px, 10 * px, 12 * px, 7 * px);
    // 衣服暗部
    ctx.fillStyle = '#3D7A3D';
    ctx.fillRect(3 * px, 12 * px, 2 * px, 4 * px);
    ctx.fillRect(13 * px, 11 * px, 2 * px, 5 * px);
    // 衣服高光
    ctx.fillStyle = '#5A9B5A';
    ctx.fillRect(5 * px, 10 * px, 3 * px, 2 * px);
    ctx.fillRect(10 * px, 10 * px, 3 * px, 2 * px);
    // 衣领
    ctx.fillStyle = '#3D7A3D';
    ctx.fillRect(6 * px, 10 * px, 2 * px, 2 * px);
    ctx.fillRect(9 * px, 10 * px, 2 * px, 2 * px);
    // 胸袋
    ctx.fillStyle = '#3D7A3D';
    ctx.fillRect(4 * px, 12 * px, 3 * px, 2 * px);
    ctx.fillRect(11 * px, 12 * px, 3 * px, 2 * px);
    // 胸袋盖
    ctx.fillStyle = '#4A8B4A';
    ctx.fillRect(4 * px, 11 * px, 3 * px, 1 * px);
    ctx.fillRect(11 * px, 11 * px, 3 * px, 1 * px);
    // 口袋扣
    ctx.fillStyle = '#8B7D3C';
    ctx.fillRect(5 * px, 12 * px, 1 * px, 1 * px);
    ctx.fillRect(12 * px, 12 * px, 1 * px, 1 * px);

    // === 左臂（垂在身侧） ===
    ctx.fillStyle = '#4A8B4A';
    ctx.fillRect(1 * px, 10 * px, 3 * px, 7 * px);
    // 手臂暗部
    ctx.fillStyle = '#3D7A3D';
    ctx.fillRect(1 * px, 12 * px, 1 * px, 4 * px);
    // 袖口
    ctx.fillStyle = '#3D7A3D';
    ctx.fillRect(1 * px, 16 * px, 3 * px, 1 * px);
    // 左手
    ctx.fillStyle = '#E0B888';
    ctx.fillRect(1 * px, 16 * px, 2 * px, 2 * px);
    // 手指
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(1 * px, 17 * px, 1 * px, 1 * px);

    // === 右臂（持枪）+ 枪 ===
    ctx.fillStyle = '#4A8B4A';
    ctx.fillRect(13 * px, 10 * px, 2 * px, 3 * px);
    // 袖口
    ctx.fillStyle = '#3D7A3D';
    ctx.fillRect(13 * px, 12 * px, 2 * px, 1 * px);
    // 右手
    ctx.fillStyle = '#E0B888';
    ctx.fillRect(14 * px, 12 * px, 2 * px, 2 * px);

    // === 步枪 ===
    const gunX = 14 * px;
    const gunY = 12 * px;
    // 枪身
    ctx.fillStyle = '#5D3A1A';
    ctx.fillRect(gunX, gunY + 1 * px, 3 * px, 2 * px);
    // 机匣
    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(gunX + 2 * px, gunY, 6 * px, 3 * px);
    // 机匣高光
    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(gunX + 2 * px, gunY, 6 * px, 1 * px);
    // 弹匣
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(gunX + 3 * px, gunY + 3 * px, 2 * px, 3 * px);
    // 枪管
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(gunX + 7 * px, gunY + 1 * px, 10 * px, 1 * px);
    // 枪管下护木
    ctx.fillStyle = '#5D3A1A';
    ctx.fillRect(gunX + 6 * px, gunY + 2 * px, 5 * px, 1 * px);
    // 枪口
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(gunX + 16 * px, gunY, 2 * px, 2 * px);
    // 准星
    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(gunX + 12 * px, gunY - 1 * px, 1 * px, 1 * px);

    // 枪口火焰
    if (isShooting) {
      const flashX = gunX + 17 * px;
      const flashY = gunY;
      ctx.fillStyle = '#FFDD44';
      ctx.fillRect(flashX, flashY - 1 * px, 4 * px, 4 * px);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(flashX + 1 * px, flashY, 2 * px, 2 * px);
      ctx.fillStyle = '#FF8800';
      ctx.fillRect(flashX + 3 * px, flashY - 2 * px, 3 * px, 6 * px);
      ctx.fillStyle = '#FF4400';
      ctx.fillRect(flashX + 4 * px, flashY - 1 * px, 2 * px, 4 * px);
      // 火花
      ctx.fillStyle = '#FFDD44';
      ctx.fillRect(flashX + 5 * px, flashY - 2 * px, 1 * px, 1 * px);
      ctx.fillRect(flashX + 5 * px, flashY + 3 * px, 1 * px, 1 * px);
      ctx.fillRect(flashX + 6 * px, flashY, 1 * px, 1 * px);
    }

    // === 脖子 ===
    ctx.fillStyle = '#E0B888';
    ctx.fillRect(7 * px, 8 * px, 3 * px, 2 * px);
    // 脖子暗部
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(7 * px, 9 * px, 1 * px, 1 * px);

    // === 头部 ===
    // 脸部
    ctx.fillStyle = '#E8C090';
    ctx.fillRect(5 * px, 3 * px, 7 * px, 6 * px);
    // 脸部暗侧
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(5 * px, 4 * px, 1 * px, 4 * px);
    // 脸部高光
    ctx.fillStyle = '#F0D0A0';
    ctx.fillRect(9 * px, 3 * px, 2 * px, 2 * px);

    // 眼睛
    ctx.fillStyle = '#1A1208';
    ctx.fillRect(6 * px, 5 * px, 2 * px, 1 * px);
    ctx.fillRect(9 * px, 5 * px, 2 * px, 1 * px);
    // 眼白高光
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(7 * px, 5 * px, 1 * px, 1 * px);
    ctx.fillRect(10 * px, 5 * px, 1 * px, 1 * px);

    // 眉毛
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(6 * px, 4 * px, 2 * px, 1 * px);
    ctx.fillRect(9 * px, 4 * px, 2 * px, 1 * px);

    // 鼻子
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(8 * px, 5 * px, 1 * px, 2 * px);
    ctx.fillStyle = '#C4956A';
    ctx.fillRect(8 * px, 6 * px, 1 * px, 1 * px);

    // 嘴
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(7 * px, 7 * px, 3 * px, 1 * px);

    // 下巴阴影
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(6 * px, 8 * px, 5 * px, 1 * px);

    // === 军帽（绿色贝雷帽风格） ===
    ctx.fillStyle = '#3D7A3D';
    ctx.fillRect(4 * px, 1 * px, 9 * px, 3 * px);
    // 帽顶
    ctx.fillStyle = '#4A8B4A';
    ctx.fillRect(5 * px, 0 * px, 7 * px, 2 * px);
    // 帽檐
    ctx.fillStyle = '#2D5A2D';
    ctx.fillRect(3 * px, 3 * px, 11 * px, 1 * px);
    // 帽徽
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(9 * px, 1 * px, 2 * px, 2 * px);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(9 * px, 1 * px, 1 * px, 1 * px);
    // 帽子暗部
    ctx.fillStyle = '#2D5A2D';
    ctx.fillRect(4 * px, 2 * px, 2 * px, 1 * px);

    ctx.restore(); // 上半身recoil
    ctx.restore();
  }

`;

const before = lines.slice(0, startLine).join('\n');
const after = lines.slice(endLine).join('\n');

const newContent = before + '\n' + newRenderPlayer + after;

fs.writeFileSync('src/game/GameEngine.ts', newContent, 'utf8');
console.log('Done! Replaced renderPlayer method.');
