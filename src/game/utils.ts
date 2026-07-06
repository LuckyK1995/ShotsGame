import type { Bullet, Enemy, DropItem, Particle, DamageNumber } from './types/game';

let nextId = 1;
export const getNextId = () => nextId++;

export function checkCollision(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class ObjectPool<T extends { active: boolean }> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T, ...args: any[]) => void;
  private maxSize: number;
  private _activeCache: T[] = [];
  private _cacheDirty = true;

  constructor(createFn: () => T, resetFn: (obj: T, ...args: any[]) => void, maxSize = 200) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  acquire(...args: any[]): T {
    let obj = this.pool.find(o => !o.active);
    if (!obj) {
      if (this.pool.length >= this.maxSize) {
        // 安全修复：池满时不再复用活跃对象（pool[0] 可能正在场上飞行）
        // 改为扩容一次，避免破坏正在使用的对象状态
        // maxSize 是软上限，对象会通过 release 自然回收，不会无限增长
        obj = this.createFn();
        this.pool.push(obj);
      } else {
        obj = this.createFn();
        this.pool.push(obj);
      }
    }
    obj.active = true;
    this.resetFn(obj, ...args);
    this._cacheDirty = true;
    return obj;
  }

  // 是否还有 acquire 容量（调用方应在产生大量对象前检查）
  canAcquire(): boolean {
    return this.getActive().length < this.maxSize;
  }

  release(obj: T): void {
    obj.active = false;
    this._cacheDirty = true;
  }

  getActive(): T[] {
    if (this._cacheDirty) {
      this._activeCache.length = 0;
      for (let i = 0; i < this.pool.length; i++) {
        if (this.pool[i].active) {
          this._activeCache.push(this.pool[i]);
        }
      }
      this._cacheDirty = false;
    }
    return this._activeCache;
  }

  getAll(): T[] {
    return this.pool;
  }

  clear(): void {
    this.pool = [];
    this._activeCache = [];
    this._cacheDirty = true;
  }
}

export function createBullet(): Bullet {
  return {
    id: 0,
    x: 0,
    y: 0,
    width: 12,
    height: 6,
    speed: 500,
    damage: 10,
    active: false,
  };
}

export function resetBullet(bullet: Bullet, x: number, y: number, damage: number): void {
  bullet.id = getNextId();
  bullet.x = x;
  bullet.y = y;
  bullet.width = 12;
  bullet.height = 6;
  bullet.damage = damage;
  bullet.speed = 500;
  bullet.active = true;
  const b = bullet as any;
  b.angle = 0;
  b.isGrenade = false;
  b.isFreezeBullet = false;
  b.isBombBullet = false;
  b.isPoisonBullet = false;
  b.poisonAoe = false;
  b.hasBomb = false;
  b.bombLvl = 0;
  b.bombBurnLvl = 0;
  b.freezeLvl = 0;
  b.poisonLvl = 0;
  b.cloneBullet = false;
  b.trail = null;
  b.vx = 0;
  b.vy = 0;
  b.gravity = 0;
  b.isWaveBullet = false;
  b.waveLvl = 0;
  b.wavePhase = 0;
  b.cloneIdx = -1;
  // 清理敌方抛物线子弹相关字段（防止对象池复用时残留导致玩家自伤）
  b.isParabolic = false;
  b.isEnemyProjectile = false;
  b.startX = 0;
  b.startY = 0;
  b.targetX = 0;
  b.targetY = 0;
  b.flightProgress = 0;
  b.flightTime = 0;
  b.arcHeight = 0;
  b.shooter = null;
}

export function createEnemy(): Enemy {
  return {
    id: 0,
    type: 'normal',
    name: '',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    health: 0,
    maxHealth: 0,
    speed: 0,
    baseSpeed: 0,
    damage: 0,
    exp: 0,
    dropRate: 0,
    color: '#fff',
    active: false,
    hitFlash: 0,
    stunTimer: 0,
    slowTimer: 0,
    slowAmount: 0,
    debuffs: [],
    weakPoints: [],
    element: null,
    isElite: false,
    isBoss: false,
    bossPhase: 0,
    bossMaxPhase: 0,
    bossSkillCooldown: 0,
    animFrame: 0,
    attack: 0,
    attackSpeed: 0,
    critRate: 0,
    critDamage: 0,
    pierceCount: 0,
    lifestealPercent: 0,
    range: 0,
    defense: 0,
    burnChance: 0,
    poisonChance: 0,
    freezeChance: 0,
    lightningChance: 0,
  };
}

export function createDropItem(): DropItem {
  return {
    id: 0,
    type: 'exp',
    x: 0,
    y: 0,
    width: 16,
    height: 16,
    value: 0,
    active: false,
    magnetSpeed: 0,
  };
}

export function createParticle(): Particle {
  return {
    id: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 0,
    color: '#fff',
    size: 3,
    active: false,
  };
}

export function createDamageNumber(): DamageNumber {
  return {
    id: 0,
    x: 0,
    y: 0,
    value: 0,
    life: 0,
    maxLife: 0,
    color: '#fff',
    active: false,
  };
}
