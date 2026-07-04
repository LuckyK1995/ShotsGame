const fs = require('fs');

const content = fs.readFileSync('src/game/GameEngine.ts', 'utf8');
const lines = content.split('\n');

// 找到第一个怪物渲染方法的开始行
let startLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('private renderMutant(')) {
    startLine = i;
    break;
  }
}

// 找到renderEnemyHealthBar的开始行（作为所有怪物方法的结束）
let endLine = -1;
for (let i = startLine; i < lines.length; i++) {
  if (lines[i].includes('private renderEnemyHealthBar(')) {
    endLine = i;
    break;
  }
}

console.log(`Start line: ${startLine + 1}, End line: ${endLine + 1}`);

const newMonsterMethods = `  private renderMutant(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    const walkCycle = Math.floor(this.animFrame / 10) % 2;
    const legOffset = walkCycle === 0 ? 1 * px : 0;
    const bodyBob = walkCycle === 0 ? 0 : -0.5 * px;

    ctx.save();
    ctx.translate(0, bodyBob);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 2 * px, y + h - px - bodyBob, w - 4 * px, px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D5A2D';
    ctx.fillRect(x + 5 * px, y + 20 * px + legOffset, 3 * px, 4 * px - Math.abs(legOffset));
    ctx.fillRect(x + 9 * px, y + 20 * px - legOffset, 3 * px, 4 * px - Math.abs(-legOffset));

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D1F0E';
    ctx.fillRect(x + 4 * px, y + 23 * px + legOffset, 4 * px, 1 * px);
    ctx.fillRect(x + 9 * px, y + 23 * px - legOffset, 4 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
    ctx.fillRect(x + 3 * px, y + 10 * px, 10 * px, 10 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A7B2A';
    ctx.fillRect(x + 3 * px, y + 12 * px, 2 * px, 6 * px);
    ctx.fillRect(x + 11 * px, y + 11 * px, 2 * px, 7 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B9B4A';
    ctx.fillRect(x + 5 * px, y + 10 * px, 3 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#8B4513';
    ctx.fillRect(x + 3 * px, y + 13 * px, 10 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#6B3410';
    ctx.fillRect(x + 7 * px, y + 13 * px, 2 * px, 2 * px);

    const armSwing = walkCycle * 1 * px;
    ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
    ctx.fillRect(x + 1 * px, y + 10 * px + armSwing, 2 * px, 6 * px);
    ctx.fillRect(x + 13 * px, y + 10 * px - armSwing, 2 * px, 5 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A7B2A';
    ctx.fillRect(x + 1 * px, y + 15 * px + armSwing, 2 * px, 2 * px);
    ctx.fillRect(x + 13 * px, y + 14 * px - armSwing, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
    ctx.fillRect(x + 4 * px, y + 3 * px, 8 * px, 7 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A7B2A';
    ctx.fillRect(x + 4 * px, y + 5 * px, 1 * px, 4 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B9B4A';
    ctx.fillRect(x + 9 * px, y + 3 * px, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D2914';
    ctx.fillRect(x + 5 * px, y + 5 * px, 2 * px, 2 * px);
    ctx.fillRect(x + 9 * px, y + 5 * px, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#FF4444';
    ctx.fillRect(x + 6 * px, y + 5 * px, 1 * px, 1 * px);
    ctx.fillRect(x + 10 * px, y + 5 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D1F0E';
    ctx.fillRect(x + 5 * px, y + 8 * px, 5 * px, 1 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FFFFFF';
    ctx.fillRect(x + 6 * px, y + 8 * px, 1 * px, 1 * px);
    ctx.fillRect(x + 9 * px, y + 8 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A7B2A';
    ctx.fillRect(x + 3 * px, y + 2 * px, 2 * px, 2 * px);
    ctx.fillRect(x + 11 * px, y + 2 * px, 2 * px, 2 * px);

    ctx.restore();
  }

  private renderRaider(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    const walkCycle = Math.floor(this.animFrame / 10) % 2;
    const legOffset = walkCycle === 0 ? 1 * px : 0;
    const bodyBob = walkCycle === 0 ? 0 : -0.5 * px;

    ctx.save();
    ctx.translate(0, bodyBob);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 2 * px, y + h - px - bodyBob, w - 4 * px, px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A3728';
    ctx.fillRect(x + 5 * px, y + 22 * px + legOffset, 4 * px, 5 * px - Math.abs(legOffset));
    ctx.fillRect(x + 10 * px, y + 22 * px - legOffset, 4 * px, 5 * px - Math.abs(-legOffset));

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D1F0E';
    ctx.fillRect(x + 4 * px, y + 26 * px + legOffset, 5 * px, 1 * px);
    ctx.fillRect(x + 10 * px, y + 26 * px - legOffset, 5 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B8B4A';
    ctx.fillRect(x + 3 * px, y + 12 * px, 12 * px, 10 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A7B3A';
    ctx.fillRect(x + 3 * px, y + 14 * px, 2 * px, 6 * px);
    ctx.fillRect(x + 13 * px, y + 13 * px, 2 * px, 7 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#7B9B5A';
    ctx.fillRect(x + 5 * px, y + 12 * px, 4 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5D4037';
    ctx.fillRect(x + 3 * px, y + 15 * px, 12 * px, 3 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#8B6914';
    ctx.fillRect(x + 8 * px, y + 15 * px, 2 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A3728';
    ctx.fillRect(x + 5 * px, y + 18 * px, 2 * px, 2 * px);
    ctx.fillRect(x + 11 * px, y + 18 * px, 2 * px, 2 * px);

    const armSwing = walkCycle * 1.5 * px;
    ctx.fillStyle = flash ? '#FFFFFF' : '#6B8B4A';
    ctx.fillRect(x + 0 * px, y + 12 * px + armSwing, 3 * px, 7 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#5A7B3A';
    ctx.fillRect(x + 0 * px, y + 18 * px + armSwing, 3 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B8B4A';
    ctx.fillRect(x + 14 * px, y + 12 * px - armSwing, 3 * px, 6 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5D4037';
    ctx.fillRect(x + 15 * px, y + 8 * px - armSwing, 2 * px, 8 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#8B8B8B';
    ctx.fillRect(x + 14 * px, y + 6 * px - armSwing, 4 * px, 3 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#A0A0A0';
    ctx.fillRect(x + 14 * px, y + 5 * px - armSwing, 4 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B8B4A';
    ctx.fillRect(x + 4 * px, y + 4 * px, 10 * px, 8 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A7B3A';
    ctx.fillRect(x + 4 * px, y + 6 * px, 1 * px, 5 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#7B9B5A';
    ctx.fillRect(x + 11 * px, y + 4 * px, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D2914';
    ctx.fillRect(x + 3 * px, y + 3 * px, 12 * px, 3 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#5D4037';
    ctx.fillRect(x + 4 * px, y + 2 * px, 10 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#8B6914';
    ctx.fillRect(x + 8 * px, y + 1 * px, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D1F0E';
    ctx.fillRect(x + 6 * px, y + 6 * px, 2 * px, 2 * px);
    ctx.fillRect(x + 10 * px, y + 6 * px, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#FF6600';
    ctx.fillRect(x + 7 * px, y + 6 * px, 1 * px, 1 * px);
    ctx.fillRect(x + 11 * px, y + 6 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D1F0E';
    ctx.fillRect(x + 5 * px, y + 9 * px, 7 * px, 1 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FFFFFF';
    ctx.fillRect(x + 7 * px, y + 9 * px, 1 * px, 1 * px);
    ctx.fillRect(x + 10 * px, y + 9 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A7B3A';
    ctx.fillRect(x + 2 * px, y + 5 * px, 2 * px, 3 * px);
    ctx.fillRect(x + 14 * px, y + 5 * px, 2 * px, 3 * px);

    ctx.restore();
  }

  private renderInfected(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    const walkCycle = Math.floor(this.animFrame / 12) % 2;
    const legOffset = walkCycle === 0 ? 1 * px : 0;
    const bodyBob = walkCycle === 0 ? 0 : -0.5 * px;
    const floatPhase = (this.animFrame % 30) / 30;
    const magicFloat = Math.sin(floatPhase * Math.PI * 2) * 1 * px;

    ctx.save();
    ctx.translate(0, bodyBob);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 2 * px, y + h - px - bodyBob, w - 4 * px, px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A3A6B';
    ctx.fillRect(x + 5 * px, y + 22 * px + legOffset, 3 * px, 5 * px - Math.abs(legOffset));
    ctx.fillRect(x + 10 * px, y + 22 * px - legOffset, 3 * px, 5 * px - Math.abs(-legOffset));

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D2914';
    ctx.fillRect(x + 4 * px, y + 26 * px + legOffset, 4 * px, 1 * px);
    ctx.fillRect(x + 10 * px, y + 26 * px - legOffset, 4 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#7B5A8B';
    ctx.fillRect(x + 3 * px, y + 12 * px, 12 * px, 10 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B4A7B';
    ctx.fillRect(x + 3 * px, y + 14 * px, 2 * px, 6 * px);
    ctx.fillRect(x + 13 * px, y + 13 * px, 2 * px, 7 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#8B6B9B';
    ctx.fillRect(x + 5 * px, y + 12 * px, 4 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A2D5A';
    ctx.fillRect(x + 3 * px, y + 16 * px, 12 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#9B7BAB';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x + (5 + i * 3) * px, y + 16 * px, 1 * px, 2 * px);
    }

    ctx.fillStyle = flash ? '#FFFFFF' : '#7B5A8B';
    ctx.fillRect(x + 0 * px, y + 12 * px, 3 * px, 8 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#6B4A7B';
    ctx.fillRect(x + 0 * px, y + 19 * px, 3 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5D4037';
    ctx.fillRect(x + -1 * px, y + 13 * px + magicFloat, 2 * px, 10 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#8B6914';
    ctx.fillRect(x + -2 * px, y + 11 * px + magicFloat, 4 * px, 3 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#9B7BAB';
    const orbSize = 2 + Math.sin(floatPhase * Math.PI * 4) * 0.5;
    ctx.fillRect(x + -1 * px, y + (9 + magicFloat / 2) * px, orbSize * px, orbSize * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#DDAADD';
    ctx.fillRect(x + -0.5 * px, y + (9.5 + magicFloat / 2) * px, (orbSize - 1) * px, (orbSize - 1) * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#7B5A8B';
    ctx.fillRect(x + 14 * px, y + 12 * px, 3 * px, 7 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#7B5A8B';
    ctx.fillRect(x + 4 * px, y + 4 * px, 10 * px, 8 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B4A7B';
    ctx.fillRect(x + 4 * px, y + 6 * px, 1 * px, 5 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#8B6B9B';
    ctx.fillRect(x + 11 * px, y + 4 * px, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A2D5A';
    ctx.fillRect(x + 3 * px, y + 3 * px, 12 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#5A3D6A';
    ctx.fillRect(x + 5 * px, y + 1 * px, 8 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D1D4A';
    ctx.fillRect(x + 9 * px, y + 0 * px, 2 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D1F0E';
    ctx.fillRect(x + 6 * px, y + 6 * px, 2 * px, 2 * px);
    ctx.fillRect(x + 10 * px, y + 6 * px, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#AAFFAA';
    ctx.fillRect(x + 7 * px, y + 6 * px, 1 * px, 1 * px);
    ctx.fillRect(x + 11 * px, y + 6 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D1D4A';
    ctx.fillRect(x + 5 * px, y + 9 * px, 7 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#9B7BAB';
    ctx.fillRect(x + 7 * px, y + 10 * px, 1 * px, 1 * px);
    ctx.fillRect(x + 10 * px, y + 10 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B4A7B';
    ctx.fillRect(x + 2 * px, y + 5 * px, 2 * px, 3 * px);
    ctx.fillRect(x + 14 * px, y + 5 * px, 2 * px, 3 * px);

    ctx.restore();
  }

  private renderBrute(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    const walkCycle = Math.floor(this.animFrame / 8) % 2;
    const legOffset = walkCycle === 0 ? 1.5 * px : 0;
    const bodyBob = walkCycle === 0 ? 0 : -1 * px;

    ctx.save();
    ctx.translate(0, bodyBob);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x + 2 * px, y + h - px - bodyBob, w - 4 * px, px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D5A2D';
    ctx.fillRect(x + 6 * px, y + 24 * px + legOffset, 5 * px, 6 * px - Math.abs(legOffset));
    ctx.fillRect(x + 13 * px, y + 24 * px - legOffset, 5 * px, 6 * px - Math.abs(-legOffset));

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D1F0E';
    ctx.fillRect(x + 5 * px, y + 29 * px + legOffset, 6 * px, 1 * px);
    ctx.fillRect(x + 13 * px, y + 29 * px - legOffset, 6 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
    ctx.fillRect(x + 3 * px, y + 12 * px, 18 * px, 12 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A7B2A';
    ctx.fillRect(x + 3 * px, y + 15 * px, 3 * px, 8 * px);
    ctx.fillRect(x + 18 * px, y + 14 * px, 3 * px, 9 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B9B4A';
    ctx.fillRect(x + 6 * px, y + 12 * px, 6 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5D4037';
    ctx.fillRect(x + 3 * px, y + 17 * px, 18 * px, 3 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#8B6914';
    ctx.fillRect(x + 10 * px, y + 17 * px, 3 * px, 3 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#B8860B';
    ctx.fillRect(x + 11 * px, y + 17.5 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A3728';
    ctx.fillRect(x + 6 * px, y + 20 * px, 3 * px, 3 * px);
    ctx.fillRect(x + 15 * px, y + 20 * px, 3 * px, 3 * px);

    const armSwing = walkCycle * 2 * px;
    ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
    ctx.fillRect(x + -2 * px, y + 12 * px + armSwing, 5 * px, 9 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#4A7B2A';
    ctx.fillRect(x + -2 * px, y + 20 * px + armSwing, 5 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
    ctx.fillRect(x + 19 * px, y + 12 * px - armSwing, 5 * px, 8 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5D4037';
    ctx.fillRect(x + 20 * px, y + 6 * px - armSwing, 3 * px, 10 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#8B8B8B';
    ctx.fillRect(x + 18 * px, y + 3 * px - armSwing, 7 * px, 4 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#A0A0A0';
    ctx.fillRect(x + 18 * px, y + 2 * px - armSwing, 7 * px, 1 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#6B6B6B';
    ctx.fillRect(x + 19 * px, y + 6 * px - armSwing, 5 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
    ctx.fillRect(x + 5 * px, y + 3 * px, 14 * px, 9 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A7B2A';
    ctx.fillRect(x + 5 * px, y + 5 * px, 2 * px, 6 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B9B4A';
    ctx.fillRect(x + 15 * px, y + 3 * px, 3 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D2914';
    ctx.fillRect(x + 4 * px, y + 2 * px, 16 * px, 3 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#5D4037';
    ctx.fillRect(x + 6 * px, y + 0 * px, 12 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#8B6914';
    ctx.fillRect(x + 11 * px, y + -1 * px, 3 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D1F0E';
    ctx.fillRect(x + 8 * px, y + 5 * px, 3 * px, 3 * px);
    ctx.fillRect(x + 13 * px, y + 5 * px, 3 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#FF4400';
    ctx.fillRect(x + 9 * px, y + 5 * px, 2 * px, 2 * px);
    ctx.fillRect(x + 14 * px, y + 5 * px, 2 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FFFF00';
    ctx.fillRect(x + 10 * px, y + 5 * px, 1 * px, 1 * px);
    ctx.fillRect(x + 15 * px, y + 5 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D1F0E';
    ctx.fillRect(x + 7 * px, y + 9 * px, 10 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FFFFFF';
    ctx.fillRect(x + 9 * px, y + 9 * px, 2 * px, 2 * px);
    ctx.fillRect(x + 13 * px, y + 9 * px, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A7B2A';
    ctx.fillRect(x + 2 * px, y + 4 * px, 3 * px, 4 * px);
    ctx.fillRect(x + 19 * px, y + 4 * px, 3 * px, 4 * px);

    ctx.restore();
  }

  private renderHeavyTrooper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    const walkCycle = Math.floor(this.animFrame / 12) % 2;
    const legOffset = walkCycle === 0 ? 1 * px : 0;
    const bodyBob = walkCycle === 0 ? 0 : -0.5 * px;

    ctx.save();
    ctx.translate(0, bodyBob);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x + 2 * px, y + h - px - bodyBob, w - 4 * px, px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A5568';
    ctx.fillRect(x + 6 * px, y + 26 * px + legOffset, 5 * px, 6 * px - Math.abs(legOffset));
    ctx.fillRect(x + 13 * px, y + 26 * px - legOffset, 5 * px, 6 * px - Math.abs(-legOffset));

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D3748';
    ctx.fillRect(x + 5 * px, y + 31 * px + legOffset, 6 * px, 1 * px);
    ctx.fillRect(x + 13 * px, y + 31 * px - legOffset, 6 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D5A2D';
    ctx.fillRect(x + 4 * px, y + 14 * px, 16 * px, 12 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A6B7A';
    ctx.fillRect(x + 4 * px, y + 14 * px, 16 * px, 8 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A5B6A';
    ctx.fillRect(x + 4 * px, y + 16 * px, 3 * px, 5 * px);
    ctx.fillRect(x + 17 * px, y + 15 * px, 3 * px, 6 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B7C8A';
    ctx.fillRect(x + 7 * px, y + 14 * px, 5 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#8B6914';
    ctx.fillRect(x + 4 * px, y + 19 * px, 16 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#B8860B';
    ctx.fillRect(x + 11 * px, y + 19 * px, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D3748';
    ctx.fillRect(x + 7 * px, y + 22 * px, 3 * px, 3 * px);
    ctx.fillRect(x + 14 * px, y + 22 * px, 3 * px, 3 * px);

    const armSwing = walkCycle * 1 * px;
    ctx.fillStyle = flash ? '#FFFFFF' : '#5A6B7A';
    ctx.fillRect(x + 0 * px, y + 14 * px + armSwing, 4 * px, 9 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#4A5B6A';
    ctx.fillRect(x + 0 * px, y + 22 * px + armSwing, 4 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A6B7A';
    ctx.fillRect(x + 20 * px, y + 14 * px - armSwing, 4 * px, 8 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A5568';
    ctx.fillRect(x + 21 * px, y + 10 * px - armSwing, 2 * px, 8 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#8B8B8B';
    ctx.fillRect(x + 19 * px, y + 6 * px - armSwing, 6 * px, 5 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#A0A0A0';
    ctx.fillRect(x + 19 * px, y + 5 * px - armSwing, 6 * px, 1 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#6B6B6B';
    ctx.fillRect(x + 20 * px, y + 10 * px - armSwing, 4 * px, 1 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#4A4A4A';
    ctx.fillRect(x + 23 * px, y + 4 * px - armSwing, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D5A2D';
    ctx.fillRect(x + 6 * px, y + 4 * px, 12 * px, 10 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A6B7A';
    ctx.fillRect(x + 5 * px, y + 3 * px, 14 * px, 4 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#4A5B6A';
    ctx.fillRect(x + 7 * px, y + 1 * px, 10 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#8B6914';
    ctx.fillRect(x + 11 * px, y + 0 * px, 3 * px, 3 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FFD700';
    ctx.fillRect(x + 11.5 * px, y + 0.5 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D3748';
    ctx.fillRect(x + 8 * px, y + 6 * px, 3 * px, 2 * px);
    ctx.fillRect(x + 13 * px, y + 6 * px, 3 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#FF4444';
    ctx.fillRect(x + 9 * px, y + 6 * px, 1 * px, 1 * px);
    ctx.fillRect(x + 14 * px, y + 6 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D3748';
    ctx.fillRect(x + 7 * px, y + 9 * px, 1 * px, 2 * px);
    ctx.fillRect(x + 16 * px, y + 9 * px, 1 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A7B2A';
    ctx.fillRect(x + 3 * px, y + 5 * px, 2 * px, 3 * px);
    ctx.fillRect(x + 19 * px, y + 5 * px, 2 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#CC44FF';
    ctx.fillRect(x + 4 * px, y + 2 * px, 16 * px, 1 * px);

    ctx.restore();
  }

  private renderMechSoldier(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    const walkCycle = Math.floor(this.animFrame / 10) % 2;
    const legOffset = walkCycle === 0 ? 1.5 * px : 0;
    const bodyBob = walkCycle === 0 ? 0 : -1 * px;

    ctx.save();
    ctx.translate(0, bodyBob);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x + 2 * px, y + h - px - bodyBob, w - 4 * px, px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A3728';
    ctx.fillRect(x + 6 * px, y + 26 * px + legOffset, 5 * px, 8 * px - Math.abs(legOffset));
    ctx.fillRect(x + 15 * px, y + 26 * px - legOffset, 5 * px, 8 * px - Math.abs(-legOffset));

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D1F0E';
    ctx.fillRect(x + 5 * px, y + 33 * px + legOffset, 6 * px, 1 * px);
    ctx.fillRect(x + 15 * px, y + 33 * px - legOffset, 6 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B8B4A';
    ctx.fillRect(x + 4 * px, y + 14 * px, 18 * px, 12 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#8B4513';
    ctx.fillRect(x + 4 * px, y + 14 * px, 18 * px, 10 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#A0522D';
    ctx.fillRect(x + 6 * px, y + 15 * px, 6 * px, 3 * px);
    ctx.fillRect(x + 14 * px, y + 15 * px, 6 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5D4037';
    ctx.fillRect(x + 4 * px, y + 18 * px, 18 * px, 3 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#B8860B';
    ctx.fillRect(x + 12 * px, y + 18 * px, 2 * px, 3 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FFD700';
    ctx.fillRect(x + 12.5 * px, y + 18.5 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5D4037';
    ctx.fillRect(x + 7 * px, y + 21 * px, 3 * px, 4 * px);
    ctx.fillRect(x + 16 * px, y + 21 * px, 3 * px, 4 * px);

    const armSwing = walkCycle * 1.5 * px;
    ctx.fillStyle = flash ? '#FFFFFF' : '#8B4513';
    ctx.fillRect(x + -1 * px, y + 14 * px + armSwing, 5 * px, 10 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#6B3410';
    ctx.fillRect(x + -1 * px, y + 23 * px + armSwing, 5 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5D4037';
    ctx.fillRect(x + 0 * px, y + 9 * px + armSwing, 3 * px, 7 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#8B8B8B';
    ctx.fillRect(x + -2 * px, y + 5 * px + armSwing, 7 * px, 5 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#A0A0A0';
    ctx.fillRect(x + -2 * px, y + 4 * px + armSwing, 7 * px, 1 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#6B6B6B';
    ctx.fillRect(x + 0 * px, y + 9 * px + armSwing, 3 * px, 1 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#4A4A4A';
    ctx.fillRect(x + -3 * px, y + 7 * px + armSwing, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#8B4513';
    ctx.fillRect(x + 22 * px, y + 14 * px - armSwing, 5 * px, 9 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5D4037';
    ctx.fillRect(x + 23 * px, y + 9 * px - armSwing, 3 * px, 7 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#8B8B8B';
    ctx.fillRect(x + 21 * px, y + 5 * px - armSwing, 7 * px, 5 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#A0A0A0';
    ctx.fillRect(x + 21 * px, y + 4 * px - armSwing, 7 * px, 1 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#6B6B6B';
    ctx.fillRect(x + 23 * px, y + 9 * px - armSwing, 3 * px, 1 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#4A4A4A';
    ctx.fillRect(x + 26 * px, y + 7 * px - armSwing, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B8B4A';
    ctx.fillRect(x + 6 * px, y + 4 * px, 14 * px, 10 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#8B4513';
    ctx.fillRect(x + 5 * px, y + 3 * px, 16 * px, 4 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#A0522D';
    ctx.fillRect(x + 7 * px, y + 1 * px, 12 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#B8860B';
    ctx.fillRect(x + 12 * px, y + -1 * px, 4 * px, 4 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FFD700';
    ctx.fillRect(x + 12.5 * px, y + -0.5 * px, 2 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FF4444';
    ctx.fillRect(x + 13 * px, y + 0 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D2914';
    ctx.fillRect(x + 9 * px, y + 6 * px, 3 * px, 2 * px);
    ctx.fillRect(x + 14 * px, y + 6 * px, 3 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#FF6600';
    ctx.fillRect(x + 10 * px, y + 6 * px, 1 * px, 1 * px);
    ctx.fillRect(x + 15 * px, y + 6 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D2914';
    ctx.fillRect(x + 8 * px, y + 10 * px, 10 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FFFFFF';
    ctx.fillRect(x + 10 * px, y + 10 * px, 2 * px, 2 * px);
    ctx.fillRect(x + 14 * px, y + 10 * px, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A7B3A';
    ctx.fillRect(x + 3 * px, y + 5 * px, 2 * px, 4 * px);
    ctx.fillRect(x + 21 * px, y + 5 * px, 2 * px, 4 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#FF44FF';
    ctx.fillRect(x + 4 * px, y + 2 * px, 18 * px, 1 * px);

    ctx.restore();
  }

  private renderWarTank(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    const walkCycle = Math.floor(this.animFrame / 15) % 2;
    const legOffset = walkCycle === 0 ? 2 * px : 0;
    const bodyBob = walkCycle === 0 ? 0 : -1 * px;

    ctx.save();
    ctx.translate(0, bodyBob);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x + 4 * px, y + h - px - bodyBob, w - 8 * px, px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D5A2D';
    ctx.fillRect(x + 10 * px, y + 32 * px + legOffset, 8 * px, 8 * px - Math.abs(legOffset));
    ctx.fillRect(x + 42 * px, y + 32 * px - legOffset, 8 * px, 8 * px - Math.abs(-legOffset));

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D1F0E';
    ctx.fillRect(x + 8 * px, y + 39 * px + legOffset, 10 * px, 1 * px);
    ctx.fillRect(x + 42 * px, y + 39 * px - legOffset, 10 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
    ctx.fillRect(x + 6 * px, y + 16 * px, 48 * px, 16 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A5568';
    ctx.fillRect(x + 6 * px, y + 16 * px, 48 * px, 12 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D4550';
    ctx.fillRect(x + 6 * px, y + 19 * px, 6 * px, 8 * px);
    ctx.fillRect(x + 48 * px, y + 18 * px, 6 * px, 9 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A6B7A';
    ctx.fillRect(x + 12 * px, y + 16 * px, 12 * px, 4 * px);
    ctx.fillRect(x + 36 * px, y + 16 * px, 12 * px, 4 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#8B6914';
    ctx.fillRect(x + 6 * px, y + 24 * px, 48 * px, 4 * px);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = flash ? '#FFFFFF' : '#B8860B';
      ctx.fillRect(x + (10 + i * 8) * px, y + 24 * px, 2 * px, 4 * px);
    }

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D3748';
    ctx.fillRect(x + 14 * px, y + 28 * px, 6 * px, 4 * px);
    ctx.fillRect(x + 40 * px, y + 28 * px, 6 * px, 4 * px);

    const armSwing = walkCycle * 2 * px;
    ctx.fillStyle = flash ? '#FFFFFF' : '#4A5568';
    ctx.fillRect(x + -2 * px, y + 16 * px + armSwing, 8 * px, 12 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#3D4550';
    ctx.fillRect(x + -2 * px, y + 27 * px + armSwing, 8 * px, 4 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D3748';
    ctx.fillRect(x + 0 * px, y + 10 * px + armSwing, 4 * px, 8 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#8B8B8B';
    ctx.fillRect(x + -4 * px, y + 4 * px + armSwing, 12 * px, 8 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#A0A0A0';
    ctx.fillRect(x + -4 * px, y + 3 * px + armSwing, 12 * px, 1 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#6B6B6B';
    ctx.fillRect(x + 0 * px, y + 11 * px + armSwing, 4 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#4A4A4A';
    ctx.fillRect(x + -6 * px, y + 6 * px + armSwing, 4 * px, 4 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#2A2A2A';
    ctx.fillRect(x + -8 * px, y + 7 * px + armSwing, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A5568';
    ctx.fillRect(x + 54 * px, y + 16 * px - armSwing, 8 * px, 11 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D3748';
    ctx.fillRect(x + 56 * px, y + 10 * px - armSwing, 4 * px, 8 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#8B8B8B';
    ctx.fillRect(x + 52 * px, y + 4 * px - armSwing, 12 * px, 8 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#A0A0A0';
    ctx.fillRect(x + 52 * px, y + 3 * px - armSwing, 12 * px, 1 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#6B6B6B';
    ctx.fillRect(x + 56 * px, y + 11 * px - armSwing, 4 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#4A4A4A';
    ctx.fillRect(x + 60 * px, y + 6 * px - armSwing, 4 * px, 4 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#2A2A2A';
    ctx.fillRect(x + 62 * px, y + 7 * px - armSwing, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
    ctx.fillRect(x + 12 * px, y + 4 * px, 36 * px, 12 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A5568';
    ctx.fillRect(x + 10 * px, y + 3 * px, 40 * px, 5 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#3D4550';
    ctx.fillRect(x + 14 * px, y + 0 * px, 32 * px, 4 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#B8860B';
    ctx.fillRect(x + 28 * px, y + -3 * px, 6 * px, 6 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FFD700';
    ctx.fillRect(x + 29 * px, y + -2 * px, 4 * px, 4 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FF4444';
    ctx.fillRect(x + 30 * px, y + -1 * px, 2 * px, 2 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D3748';
    ctx.fillRect(x + 18 * px, y + 7 * px, 6 * px, 4 * px);
    ctx.fillRect(x + 36 * px, y + 7 * px, 6 * px, 4 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#FF2200';
    ctx.fillRect(x + 20 * px, y + 7 * px, 2 * px, 2 * px);
    ctx.fillRect(x + 38 * px, y + 7 * px, 2 * px, 2 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FFFF00';
    ctx.fillRect(x + 21 * px, y + 7 * px, 1 * px, 1 * px);
    ctx.fillRect(x + 39 * px, y + 7 * px, 1 * px, 1 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#3D2914';
    ctx.fillRect(x + 16 * px, y + 12 * px, 28 * px, 3 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : '#FFFFFF';
    ctx.fillRect(x + 20 * px, y + 12 * px, 4 * px, 3 * px);
    ctx.fillRect(x + 36 * px, y + 12 * px, 4 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#4A7B2A';
    ctx.fillRect(x + 6 * px, y + 6 * px, 4 * px, 5 * px);
    ctx.fillRect(x + 50 * px, y + 6 * px, 4 * px, 5 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#FF3300';
    ctx.fillRect(x + 6 * px, y + 2 * px, 48 * px, 2 * px);

    ctx.restore();
  }

  private renderAlienHive(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    const floatPhase = (this.animFrame % 40) / 40;
    const bodyFloat = Math.sin(floatPhase * Math.PI * 2) * 2 * px;
    const pulsePhase = (this.animFrame % 30) / 30;
    const pulseScale = 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.05;

    ctx.save();
    ctx.translate(0, bodyFloat);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x + 4 * px, y + h - px - bodyFloat, w - 8 * px, px);

    const centerX = x + w / 2;
    const centerY = y + h / 2;

    ctx.fillStyle = flash ? '#FFFFFF' : '#5A1D6B';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, (w / 2 - 2 * px) * pulseScale, (h / 2 - 4 * px) * pulseScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = flash ? '#FFFFFF' : '#7B2D8B';
    ctx.beginPath();
    ctx.ellipse(centerX - 2 * px, centerY - 4 * px, (w / 3) * pulseScale, (h / 3) * pulseScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = flash ? '#FFFFFF' : '#9B3DAB';
    ctx.beginPath();
    ctx.ellipse(centerX - 4 * px, centerY - 6 * px, (w / 6) * pulseScale, (h / 6) * pulseScale, 0, 0, Math.PI * 2);
    ctx.fill();

    const eyeGlow = 0.7 + Math.sin(pulsePhase * Math.PI * 2) * 0.3;
    ctx.fillStyle = flash ? '#FFFFFF' : 'rgba(255, 100, 255, ' + eyeGlow + ')';
    ctx.beginPath();
    ctx.ellipse(centerX - 8 * px, centerY - 4 * px, 4 * px, 5 * px, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 8 * px, centerY - 4 * px, 4 * px, 5 * px, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = flash ? '#FFFFFF' : '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(centerX - 8 * px, centerY - 5 * px, 2 * px, 2 * px, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 8 * px, centerY - 5 * px, 2 * px, 2 * px, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = flash ? '#FFFFFF' : '#2D0A3D';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 6 * px, 10 * px, 6 * px, 0, 0, Math.PI * 2);
    ctx.fill();

    const mouthPhase = (this.animFrame % 25) / 25;
    const mouthOpen = 2 + Math.sin(mouthPhase * Math.PI * 2) * 2;
    ctx.fillStyle = flash ? '#FFFFFF' : '#1A052A';
    ctx.fillRect(centerX - 8 * px, centerY + 4 * px, 16 * px, mouthOpen * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#E0D0FF';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(centerX - 7 * px + i * 5 * px, centerY + 4 * px, 2 * px, 2 * px);
    }
    if (mouthOpen > 3) {
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(centerX - 6 * px + i * 5 * px, centerY + (4 + mouthOpen - 1) * px, 2 * px, 2 * px);
      }
    }

    const tentaclePhase = (this.animFrame % 35) / 35;
    const tentacleWave1 = Math.sin(tentaclePhase * Math.PI * 2) * 3 * px;
    const tentacleWave2 = Math.sin(tentaclePhase * Math.PI * 2 + Math.PI / 2) * 3 * px;
    const tentacleWave3 = Math.sin(tentaclePhase * Math.PI * 2 + Math.PI) * 3 * px;

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B2DAA';
    ctx.fillRect(x + 2 * px, y + h / 2 + tentacleWave1, 8 * px, 4 * px);
    ctx.fillRect(x + 0 * px, y + h / 2 + 8 * px + tentacleWave2, 6 * px, 4 * px);
    ctx.fillRect(x + 4 * px, y + h / 2 + 16 * px + tentacleWave3, 7 * px, 4 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5C2D91';
    ctx.fillRect(x + 0 * px, y + h / 2 + 4 * px + tentacleWave1, 3 * px, 3 * px);
    ctx.fillRect(x + 1 * px, y + h / 2 + 12 * px + tentacleWave2, 3 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B2DAA';
    ctx.fillRect(x + w - 10 * px, y + h / 2 - tentacleWave1, 8 * px, 4 * px);
    ctx.fillRect(x + w - 6 * px, y + h / 2 + 6 * px - tentacleWave2, 6 * px, 4 * px);
    ctx.fillRect(x + w - 11 * px, y + h / 2 + 14 * px - tentacleWave3, 7 * px, 4 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#5C2D91';
    ctx.fillRect(x + w - 3 * px, y + h / 2 + 2 * px - tentacleWave1, 3 * px, 3 * px);
    ctx.fillRect(x + w - 4 * px, y + h / 2 + 10 * px - tentacleWave2, 3 * px, 3 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#6B2DAA';
    ctx.fillRect(x + w / 2 - 12 * px, y + h - 10 * px + tentacleWave1 * 0.5, 4 * px, 6 * px);
    ctx.fillRect(x + w / 2 - 2 * px, y + h - 8 * px - tentacleWave2 * 0.5, 4 * px, 5 * px);
    ctx.fillRect(x + w / 2 + 8 * px, y + h - 10 * px + tentacleWave3 * 0.5, 4 * px, 6 * px);

    const sporePhase1 = (this.animFrame % 50) / 50;
    const sporePhase2 = (this.animFrame % 60 + 20) / 60;
    const sporePhase3 = (this.animFrame % 45 + 30) / 45;
    const sporeFloat1 = sporePhase1 * 20 * px;
    const sporeFloat2 = sporePhase2 * 18 * px;
    const sporeFloat3 = sporePhase3 * 22 * px;

    ctx.fillStyle = flash ? '#FFFFFF' : '#DD88FF';
    ctx.globalAlpha = 0.7 + Math.sin(sporePhase1 * Math.PI * 2) * 0.3;
    ctx.fillRect(x + 8 * px, y + 10 * px - sporeFloat1, 5 * px, 5 * px);
    ctx.globalAlpha = 0.7 + Math.sin(sporePhase2 * Math.PI * 2) * 0.3;
    ctx.fillRect(x + w - 12 * px, y + 5 * px - sporeFloat2, 4 * px, 4 * px);
    ctx.globalAlpha = 0.7 + Math.sin(sporePhase3 * Math.PI * 2) * 0.3;
    ctx.fillRect(x + w / 2, y + 2 * px - sporeFloat3, 5 * px, 4 * px);
    ctx.globalAlpha = 1;

    ctx.fillStyle = flash ? '#FFFFFF' : '#FFAAFF';
    ctx.globalAlpha = 0.5 + Math.sin(sporePhase1 * Math.PI * 4) * 0.5;
    ctx.fillRect(x + 9 * px, y + 11 * px - sporeFloat1, 2 * px, 2 * px);
    ctx.globalAlpha = 0.5 + Math.sin(sporePhase2 * Math.PI * 4) * 0.5;
    ctx.fillRect(x + w - 11 * px, y + 6 * px - sporeFloat2, 2 * px, 2 * px);
    ctx.globalAlpha = 0.5 + Math.sin(sporePhase3 * Math.PI * 4) * 0.5;
    ctx.fillRect(x + w / 2 + 1 * px, y + 3 * px - sporeFloat3, 2 * px, 2 * px);
    ctx.globalAlpha = 1;

    const hornGlow = 0.6 + Math.sin(pulsePhase * Math.PI * 3) * 0.4;
    ctx.fillStyle = flash ? '#FFFFFF' : '#3D0A4A';
    ctx.fillRect(x + w / 2 - 10 * px, y + 4 * px, 3 * px, 6 * px);
    ctx.fillRect(x + w / 2 + 7 * px, y + 4 * px, 3 * px, 6 * px);
    ctx.fillStyle = flash ? '#FFFFFF' : 'rgba(255, 50, 255, ' + hornGlow + ')';
    ctx.fillRect(x + w / 2 - 9 * px, y + 2 * px, 2 * px, 4 * px);
    ctx.fillRect(x + w / 2 + 8 * px, y + 2 * px, 2 * px, 4 * px);

    ctx.fillStyle = flash ? '#FFFFFF' : '#FF33FF';
    ctx.fillRect(x + 2 * px, y + 2 * px, w - 4 * px, 2 * px);

    ctx.restore();
  }

`;

const before = lines.slice(0, startLine).join('\n');
const after = lines.slice(endLine).join('\n');

const newContent = before + '\n' + newMonsterMethods + after;

fs.writeFileSync('src/game/GameEngine.ts', newContent, 'utf8');
console.log('Done! Replaced all monster render methods.');
