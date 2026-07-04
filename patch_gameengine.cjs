const fs = require('fs');

const content = fs.readFileSync('src/game/GameEngine.ts', 'utf8');
const lines = content.split('\n');

let newContent = content;

const imageLoadingCode = `  private sprites: {
    player: HTMLImageElement | null = null;
    monsterOrc: HTMLImageElement | null = null;
    monsterSlime: HTMLImageElement | null = null;
    background: HTMLImageElement | null = null;
  } = {};

  private spriteLoaded: Promise<void> | null = null;`;

const spriteLoadingPromise = `    this.initSprites();`;

const initSpritesMethod = `  private initSprites(): void {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(\`Failed to load image: \${src}\`));
        img.src = src;
      });
    };

    this.spriteLoaded = Promise.all([
      loadImage('/assets/player.png').then(img => { this.sprites.player = img; }),
      loadImage('/assets/monster_orc.png').then(img => { this.sprites.monsterOrc = img; }),
      loadImage('/assets/monster_slime.png').then(img => { this.sprites.monsterSlime = img; }),
      loadImage('/assets/background.png').then(img => { this.sprites.background = img; }),
    ]).then(() => {}).catch(err => {
      console.warn('Failed to load sprites:', err);
    });
  }`;

const newRenderBackground = `  private renderBackground(): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    if (this.sprites.background) {
      const bgWidth = this.sprites.background.width;
      const bgHeight = this.sprites.background.height;
      const scale = Math.max(width / bgWidth, height / bgHeight);
      const drawWidth = bgWidth * scale;
      const drawHeight = bgHeight * scale;
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;
      ctx.drawImage(this.sprites.background, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.45);
      skyGradient.addColorStop(0, '#4A3520');
      skyGradient.addColorStop(0.3, '#8B5E3C');
      skyGradient.addColorStop(0.6, '#C4884D');
      skyGradient.addColorStop(0.85, '#D4A055');
      skyGradient.addColorStop(1, '#A07040');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height * 0.45);

      ctx.fillStyle = '#3D2E20';
      const buildingWidths = [0.06, 0.04, 0.08, 0.05, 0.1, 0.06, 0.08, 0.09, 0.05, 0.1, 0.07, 0.1, 0.06, 0.06];
      let bx = 0;
      for (const bw of buildingWidths) {
        const bh = 0.08 + Math.random() * 0.12;
        ctx.fillRect(bx * width, (0.45 - bh) * height, bw * width, bh * height);
        bx += bw + 0.01;
      }

      const groundGradient = ctx.createLinearGradient(0, height * 0.45, 0, height);
      groundGradient.addColorStop(0, '#6B5D4A');
      groundGradient.addColorStop(0.5, '#4A4235');
      groundGradient.addColorStop(1, '#332C24');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, height * 0.45, width, height * 0.55);
    }
  }`;

const newRenderPlayer = `  private renderPlayer(): void {
    const ctx = this.ctx;
    const { x, y } = this.player;

    if (this.sprites.player) {
      const isShooting = this.muzzleFlashTimer > 0;
      const recoil = isShooting ? -4 : 0;

      ctx.save();
      ctx.translate(x, y + recoil);
      ctx.drawImage(this.sprites.player, -16, -32, 32, 64);

      if (isShooting) {
        ctx.fillStyle = 'rgba(255, 200, 50, 0.7)';
        ctx.fillRect(16, -20, 8, 4);
        ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
        ctx.fillRect(20, -18, 4, 2);
      }

      ctx.restore();
    } else {
      const px = 2;
      const isShooting = this.muzzleFlashTimer > 0;
      const recoil = isShooting ? -2 * px : 0;

      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = '#3D7A3D';
      ctx.fillRect(6 * px, 30 * px, 4 * px, 10 * px);
      ctx.fillRect(14 * px, 30 * px, 4 * px, 10 * px);

      ctx.fillStyle = '#2D1F0E';
      ctx.fillRect(6 * px, 39 * px, 5 * px, 2 * px);
      ctx.fillRect(14 * px, 39 * px, 5 * px, 2 * px);

      ctx.save();
      ctx.translate(0, recoil);

      ctx.fillStyle = '#4A8B4A';
      ctx.fillRect(6 * px, 16 * px, 16 * px, 10 * px);

      ctx.fillStyle = '#4A8B4A';
      ctx.fillRect(2 * px, 16 * px, 4 * px, 8 * px);

      ctx.fillStyle = '#3A3A3A';
      ctx.fillRect(26 * px, 19 * px, 8 * px, 3 * px);
      ctx.fillStyle = '#5A5A5A';
      ctx.fillRect(26 * px, 19 * px, 8 * px, 1 * px);

      ctx.restore();

      ctx.fillStyle = '#E8C090';
      ctx.fillRect(8 * px, 6 * px, 8 * px, 6 * px);

      ctx.fillStyle = '#3D7A3D';
      ctx.fillRect(6 * px, 3 * px, 14 * px, 4 * px);

      ctx.restore();
    }
  }`;

const newRenderMutant = `  private renderMutant(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    if (this.sprites.monsterSlime) {
      if (flash) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, w, h);
      }
      ctx.drawImage(this.sprites.monsterSlime, x, y, w, h);
    } else {
      const walkCycle = Math.floor(this.animFrame / 12) % 2;
      const legOffset = walkCycle === 0 ? 1 * px : 0;

      ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
      ctx.fillRect(x + 2 * px, y + 4 * px, 8 * px, 8 * px);

      ctx.fillStyle = flash ? '#FFFFFF' : '#6B9B4A';
      ctx.fillRect(x + 3 * px, y + 3 * px, 6 * px, 4 * px);

      ctx.fillStyle = flash ? '#FFFFFF' : '#FF4400';
      ctx.fillRect(x + 3 * px, y + 6 * px, 1 * px, 1 * px);
      ctx.fillRect(x + 6 * px, y + 6 * px, 1 * px, 1 * px);
    }
  }`;

const newRenderRaider = `  private renderRaider(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    if (this.sprites.monsterOrc) {
      if (flash) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, w, h);
      }
      ctx.drawImage(this.sprites.monsterOrc, x, y, w, h);
    } else {
      const walkCycle = Math.floor(this.animFrame / 10) % 2;
      const legOffset = walkCycle === 0 ? 1 * px : 0;

      ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
      ctx.fillRect(x + 6 * px, y + 24 * px + legOffset, 5 * px, 6 * px);
      ctx.fillRect(x + 14 * px, y + 24 * px - legOffset, 5 * px, 6 * px);

      ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
      ctx.fillRect(x + 4 * px, y + 12 * px, 16 * px, 12 * px);

      ctx.fillStyle = flash ? '#FFFFFF' : '#5A8B3A';
      ctx.fillRect(x + 6 * px, y + 4 * px, 12 * px, 8 * px);

      ctx.fillStyle = flash ? '#FFFFFF' : '#FF4400';
      ctx.fillRect(x + 9 * px, y + 6 * px, 2 * px, 2 * px);
      ctx.fillRect(x + 14 * px, y + 6 * px, 2 * px, 2 * px);
    }
  }`;

const newRenderOthers = `  private renderInfected(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    if (this.sprites.monsterOrc) {
      if (flash) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, w, h);
      }
      ctx.drawImage(this.sprites.monsterOrc, x, y, w, h);
    } else {
      this.renderMutant(ctx, x, y, w, h, px, flash, color);
    }
  }

  private renderBrute(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    if (this.sprites.monsterOrc) {
      if (flash) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, w, h);
      }
      ctx.drawImage(this.sprites.monsterOrc, x, y, w, h);
    } else {
      this.renderRaider(ctx, x, y, w, h, px, flash, color);
    }
  }

  private renderHeavyTrooper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    if (this.sprites.monsterOrc) {
      if (flash) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, w, h);
      }
      ctx.drawImage(this.sprites.monsterOrc, x, y, w, h);
    } else {
      this.renderRaider(ctx, x, y, w, h, px, flash, color);
    }
  }

  private renderMechSoldier(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    if (this.sprites.monsterOrc) {
      if (flash) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, w, h);
      }
      ctx.drawImage(this.sprites.monsterOrc, x, y, w, h);
    } else {
      this.renderBrute(ctx, x, y, w, h, px, flash, color);
    }
  }

  private renderWarTank(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    if (this.sprites.monsterOrc) {
      if (flash) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, w, h);
      }
      ctx.drawImage(this.sprites.monsterOrc, x, y, w * 1.5, h * 1.5);
    } else {
      this.renderBrute(ctx, x, y, w, h, px, flash, color);
    }
  }

  private renderAlienHive(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, px: number, flash: boolean, color: string): void {
    if (this.sprites.monsterOrc) {
      if (flash) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, w, h);
      }
      ctx.drawImage(this.sprites.monsterOrc, x, y, w * 1.8, h * 1.5);
    } else {
      this.renderBrute(ctx, x, y, w, h, px, flash, color);
    }
  }`;

newContent = newContent.replace(
  '  private animFrame: number = 0;',
  imageLoadingCode + '\n\n  private animFrame: number = 0;'
);

newContent = newContent.replace(
  '    this.initWeather();',
  '    this.initWeather();\n' + spriteLoadingPromise
);

newContent = newContent.replace(
  '  private initWeather(): void {',
  initSpritesMethod + '\n\n  private initWeather(): void {'
);

let startLine = -1;
let endLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('private renderBackground(): void {')) {
    startLine = i;
  }
  if (startLine > 0 && lines[i].includes('private renderStars(): void {')) {
    endLine = i;
    break;
  }
}

if (startLine > 0 && endLine > 0) {
  const before = newContent.split('\n').slice(0, startLine).join('\n');
  const after = newContent.split('\n').slice(endLine).join('\n');
  newContent = before + '\n' + newRenderBackground + '\n' + after;
}

const lines2 = newContent.split('\n');
startLine = -1;
endLine = -1;
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('private renderPlayer(): void {')) {
    startLine = i;
  }
  if (startLine > 0 && lines2[i].includes('private renderEnemy(')) {
    endLine = i;
    break;
  }
}

if (startLine > 0 && endLine > 0) {
  const before = lines2.slice(0, startLine).join('\n');
  const after = lines2.slice(endLine).join('\n');
  newContent = before + '\n' + newRenderPlayer + '\n' + after;
}

const lines3 = newContent.split('\n');
let mutantStart = -1;
let orcEnd = -1;
for (let i = 0; i < lines3.length; i++) {
  if (lines3[i].includes('private renderMutant(')) {
    mutantStart = i;
  }
  if (mutantStart > 0 && lines3[i].includes('private renderEnemyHealthBar(')) {
    orcEnd = i;
    break;
  }
}

if (mutantStart > 0 && orcEnd > 0) {
  const before = lines3.slice(0, mutantStart).join('\n');
  const after = lines3.slice(orcEnd).join('\n');
  newContent = before + '\n' + newRenderMutant + '\n' + newRenderRaider + '\n' + newRenderOthers + '\n' + after;
}

fs.writeFileSync('src/game/GameEngine.ts', newContent, 'utf8');
console.log('GameEngine.ts patched successfully!');
