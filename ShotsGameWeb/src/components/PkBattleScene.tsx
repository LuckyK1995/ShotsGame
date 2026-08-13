// PK 战斗场景：全屏自动对战，双方按攻速自动攻击，子弹飞行 + 受击特效 + 伤害飘字
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { OnlinePlayer, pkApi, type OpponentBattleStats } from '../api/modules/pk';
import { neonCyan, neonPurple, neonPink, neonGreen, neonRed, neonYellow, neonText } from '../theme/colors';

/** 战斗属性（我方与对手共用同一结构；口径与 OpponentBattleStats 对齐）
 *  attackSpeed = 每秒攻击次数
 *  critRate = 0~1 小数
 *  critDamage = 倍率（如 1.5）
 *  resistance / fireResistance / … = 百分数
 */
interface BattleStats {
  attack: number;
  attackSpeed: number;
  maxHealth: number;
  critRate: number;
  critDamage: number;
  defense: number;
  range: number;
  physicalPenetration: number;
  resistance: number;

  fireDamageBonus: number;
  iceDamageBonus: number;
  lightningDamageBonus: number;
  poisonDamageBonus: number;

  fireResistance: number;
  iceResistance: number;
  lightningResistance: number;
  poisonResistance: number;
}

interface PkBattleSceneProps {
  opponent: OnlinePlayer;
  myProfile: { id: string; displayName: string; level: number; power: number };
  myStats: BattleStats;
  onFinish: (result: { isWin: boolean; durationSeconds: number }) => void;
  onClose: () => void;
}

/** 子弹飞行特效 */
interface BulletEffect {
  id: number;
  fromPlayer1: boolean; // true=我方→对手（左→右）
  spawnTime: number;
  travelTime: number;
  damage: number;
  isCrit: boolean;
  landed: boolean;
}

/** 伤害飘字 */
interface DamageNumber {
  id: number;
  value: number;
  isCrit: boolean;
  targetIsPlayer1: boolean;
  spawnTime: number;
}

const TRAVEL_TIME = 180;
const OVERLAY_DURATION = 3000;
const DAMAGE_NUMBER_LIFE = 800;

/** 仅在接口失败/无存档的 fallback 场景使用（power+level 估算），补齐新属性默认 0 */
function deriveOpponentStats(power: number, level: number): BattleStats {
  return {
    attack: Math.round(power * 0.05 + level * 2 + 10),
    attackSpeed: Math.min(2.5, 0.8 + level * 0.03),
    maxHealth: Math.round(power * 0.1 + level * 20 + 100),
    critRate: Math.min(0.5, 0.1 + level * 0.005),
    critDamage: 1.5 + level * 0.02,
    defense: Math.round(power * 0.02 + level * 1 + 5),
    range: 1,
    physicalPenetration: 0,
    resistance: 0,
    fireDamageBonus: 0,
    iceDamageBonus: 0,
    lightningDamageBonus: 0,
    poisonDamageBonus: 0,
    fireResistance: 0,
    iceResistance: 0,
    lightningResistance: 0,
    poisonResistance: 0,
  };
}

/** 完整设计版伤害公式（与 GameEngine.damageEnemy / applyDamageToPlayer 对齐）
 * 物理部分：基础 attack 先扣除「defense - physicalPenetration」后的百分比减伤
 * 属性伤害部分：4 种属性伤害加成各扣对方对应抗性
 * 最后整体通用抗性层：1 / (1 + resistance/100)，并对暴击做倍率
 */
function calcDamageFull(args: {
  attacker: BattleStats;
  defender: BattleStats;
}): { damage: number; isCrit: boolean } {
  const { attacker, defender } = args;

  // 1) 物理部分：攻击按 (1 - (防御 - 穿透)/100) 比例减伤，至少 10% 保底
  const physPen = Math.max(0, attacker.physicalPenetration || 0);
  const effDef = Math.max(0, (defender.defense || 0) - physPen);
  const physActual = Math.max(attacker.attack * 0.1, attacker.attack * (1 - effDef / 100));

  // 2) 4 种属性伤害加成（每条元素伤害扣对方对应抗性）
  const clampRes = (r: number) => Math.max(0, Math.min(100, r ?? 0));
  const fireActual    = (attacker.fireDamageBonus      || 0) * (1 - clampRes(defender.fireResistance)      / 100);
  const iceActual     = (attacker.iceDamageBonus       || 0) * (1 - clampRes(defender.iceResistance)       / 100);
  const lightningActual = (attacker.lightningDamageBonus || 0) * (1 - clampRes(defender.lightningResistance) / 100);
  const poisonActual  = (attacker.poisonDamageBonus    || 0) * (1 - clampRes(defender.poisonResistance)    / 100);
  const elementalTotal = Math.max(0, fireActual + iceActual + lightningActual + poisonActual);

  // 3) 基础合计
  let base = physActual + elementalTotal;

  // 4) 通用抗性层：减伤 1 / (1 + res/100)
  const genRes = Math.max(0, defender.resistance || 0);
  base = base / (1 + genRes / 100);

  // 5) 暴击
  const critRate = Math.max(0, Math.min(0.95, attacker.critRate || 0));
  const critDamage = Math.max(1, attacker.critDamage || 1.5);
  const isCrit = Math.random() < critRate;
  const finalDamage = Math.max(1, Math.round(isCrit ? base * critDamage : base));
  return { damage: finalDamage, isCrit };
}

/** 关键帧动画 */
const KEYFRAMES = `
@keyframes pkBulletRight {
  0%   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translate(calc(-50% + 60vw), -50%) scale(0.6); opacity: 0.7; }
}
@keyframes pkBulletLeft {
  0%   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translate(calc(-50% - 60vw), -50%) scale(0.6); opacity: 0.7; }
}
@keyframes pkHurt {
  0%   { filter: brightness(1);   transform: translateX(0); }
  15%  { filter: brightness(2.4); transform: translateX(-5px); }
  30%  { filter: brightness(2);   transform: translateX(5px); }
  50%  { filter: brightness(1.5); transform: translateX(-3px); }
  70%  { filter: brightness(1.2); transform: translateX(3px); }
  100% { filter: brightness(1);   transform: translateX(0); }
}
@keyframes pkFloatUp {
  0%   { transform: translate(-50%, 0) scale(1);   opacity: 1; }
  100% { transform: translate(-50%, -50px) scale(1.2); opacity: 0; }
}
@keyframes pkAuraPulse {
  0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
  50%      { opacity: 0.9;  transform: translate(-50%, -50%) scale(1.12); }
}
@keyframes pkFadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes pkResultPop {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes pkSpin {
  to { transform: rotate(360deg); }
}
`;

/** 把后端 OpponentBattleStats 转成 BattleStats（字段一致，只是去掉非战斗字段） */
function fromOpponentStats(o: OpponentBattleStats): BattleStats {
  return {
    attack: o.attack,
    attackSpeed: o.attackSpeed,
    maxHealth: o.maxHealth,
    critRate: o.critRate,
    critDamage: o.critDamage,
    defense: o.defense,
    range: o.range,
    physicalPenetration: o.physicalPenetration,
    resistance: o.resistance,
    fireDamageBonus: o.fireDamageBonus,
    iceDamageBonus: o.iceDamageBonus,
    lightningDamageBonus: o.lightningDamageBonus,
    poisonDamageBonus: o.poisonDamageBonus,
    fireResistance: o.fireResistance,
    iceResistance: o.iceResistance,
    lightningResistance: o.lightningResistance,
    poisonResistance: o.poisonResistance,
  };
}

const PkBattleScene: React.FC<PkBattleSceneProps> = ({ opponent, myProfile, myStats, onFinish, onClose }) => {
  // 对手战斗属性：先从 power/level 估算，再异步拉真实快照（若成功则覆盖）
  const fallback = useMemo<BattleStats>(
    () => deriveOpponentStats(opponent.power, opponent.level),
    [opponent.power, opponent.level]
  );
  const [oppStats, setOppStats] = useState<BattleStats>(fallback);
  const [oppSource, setOppSource] = useState<'real' | 'fallback'>('fallback');
  const [loadingOpp, setLoadingOpp] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 异步取对手真实属性
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await pkApi.getOpponentStats(opponent.playerId);
        if (cancelled) return;
        setOppStats(fromOpponentStats(data));
        setOppSource(data.source === 'real' ? 'real' : 'fallback');
        setFetchError(null);
      } catch (e: any) {
        if (cancelled) return;
        // 失败则保留 fallback 对手（deriveOpponentStats），不阻断战斗
        setOppSource('fallback');
        setFetchError(e?.message ?? '获取对手属性失败，使用估算');
      } finally {
        if (!cancelled) setLoadingOpp(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [opponent.playerId]);

  // 血量放大 10 倍（避免互秒）：用最新的 oppStats 重算 maxHp
  const maxHp1 = myStats.maxHealth * 10;
  const maxHp2 = oppStats.maxHealth * 10;

  // —— 战斗状态 ref ——
  const hp1Ref = useRef<number>(maxHp1);
  const hp2Ref = useRef<number>(maxHp2);
  const lastAttack1Ref = useRef<number>(0);
  const lastAttack2Ref = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const bulletsRef = useRef<BulletEffect[]>([]);
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const nextIdRef = useRef<number>(1);
  const isFinishedRef = useRef<boolean>(false);
  const isWinRef = useRef<boolean>(false);
  const onFinishCalledRef = useRef<boolean>(false);
  const rafRef = useRef<number>(0);
  const overlayTimerRef = useRef<number>(0);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  // —— UI 状态 ——
  const [hp1, setHp1] = useState<number>(maxHp1);
  const [hp2, setHp2] = useState<number>(maxHp2);
  const [bullets, setBullets] = useState<BulletEffect[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [hurtKey1, setHurtKey1] = useState<number>(0);
  const [hurtKey2, setHurtKey2] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isWin, setIsWin] = useState<boolean>(false);
  const [showReturn, setShowReturn] = useState<boolean>(false);

  // 攻击间隔（ms）
  const interval1 = 1000 / Math.max(0.1, myStats.attackSpeed);
  const interval2 = 1000 / Math.max(0.1, oppStats.attackSpeed);

  // 当对手属性异步拉取完成后，把 hp2 的上限同步一下（避免 fallback 最大值 10 倍与真实快照不一致）
  useEffect(() => {
    if (loadingOpp) return;
    // 真实快照下重新校准最大血量与当前血量比例
    const newMax = oppStats.maxHealth * 10;
    const ratio = Math.max(0, Math.min(1, hp2Ref.current / (maxHp2 || 1)));
    hp2Ref.current = Math.round(newMax * ratio);
    setHp2(hp2Ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingOpp, oppStats.maxHealth]);

  // 主循环：oppStats 变化时重启（保证新口径的 interval2 生效）
  useEffect(() => {
    const now0 = performance.now();
    startTimeRef.current = now0;
    lastAttack1Ref.current = now0;
    lastAttack2Ref.current = now0;

    const spawnBullet = (fromPlayer1: boolean, now: number) => {
      const dmg = fromPlayer1
        ? calcDamageFull({ attacker: myStats, defender: oppStats })
        : calcDamageFull({ attacker: oppStats, defender: myStats });
      bulletsRef.current.push({
        id: nextIdRef.current++,
        fromPlayer1,
        spawnTime: now,
        travelTime: TRAVEL_TIME,
        damage: dmg.damage,
        isCrit: dmg.isCrit,
        landed: false,
      });
    };

    const loop = () => {
      const now = performance.now();
      let changed = false;

      for (const b of bulletsRef.current) {
        if (!b.landed && now >= b.spawnTime + b.travelTime) {
          b.landed = true;
          if (b.fromPlayer1) {
            hp2Ref.current = Math.max(0, hp2Ref.current - b.damage);
            setHurtKey2((k) => k + 1);
          } else {
            hp1Ref.current = Math.max(0, hp1Ref.current - b.damage);
            setHurtKey1((k) => k + 1);
          }
          damageNumbersRef.current.push({
            id: nextIdRef.current++,
            value: b.damage,
            isCrit: b.isCrit,
            targetIsPlayer1: !b.fromPlayer1,
            spawnTime: now,
          });
          changed = true;
        }
      }

      const aliveBullets = bulletsRef.current.filter((b) => now < b.spawnTime + b.travelTime + 60);
      if (aliveBullets.length !== bulletsRef.current.length) {
        bulletsRef.current = aliveBullets;
        changed = true;
      }
      const aliveNumbers = damageNumbersRef.current.filter((d) => now < d.spawnTime + DAMAGE_NUMBER_LIFE);
      if (aliveNumbers.length !== damageNumbersRef.current.length) {
        damageNumbersRef.current = aliveNumbers;
        changed = true;
      }

      if (!isFinishedRef.current) {
        if (now - lastAttack1Ref.current >= interval1) {
          lastAttack1Ref.current = now;
          spawnBullet(true, now);
          changed = true;
        }
        if (now - lastAttack2Ref.current >= interval2) {
          lastAttack2Ref.current = now;
          spawnBullet(false, now);
          changed = true;
        }
      }

      if (!isFinishedRef.current && (hp1Ref.current <= 0 || hp2Ref.current <= 0)) {
        isFinishedRef.current = true;
        const win = hp2Ref.current <= 0 && hp1Ref.current > 0;
        isWinRef.current = win;
        setIsFinished(true);
        setIsWin(win);
        const durationSeconds = Math.round(((now - startTimeRef.current) / 1000) * 10) / 10;
        overlayTimerRef.current = window.setTimeout(() => {
          if (!onFinishCalledRef.current) {
            onFinishCalledRef.current = true;
            onFinishRef.current({ isWin: win, durationSeconds });
          }
          setShowReturn(true);
        }, OVERLAY_DURATION);
      }

      if (changed) {
        setHp1(hp1Ref.current);
        setHp2(hp2Ref.current);
        setBullets([...bulletsRef.current]);
        setDamageNumbers([...damageNumbersRef.current]);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current);
    };
  }, [interval1, interval2, myStats, oppStats]);

  const hp1Percent = Math.max(0, (hp1 / maxHp1) * 100);
  const hp2Percent = Math.max(0, (hp2 / maxHp2) * 100);

  return (
    <div style={sceneStyle}>
      <style>{KEYFRAMES}</style>

      <div style={gridFloorStyle} />

      {/* 顶部双方血条 */}
      <div style={topBarStyle}>
        <div style={hpBlockStyle}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <div style={{ ...neonText, color: neonCyan, fontSize: 13, fontWeight: 700 }}>
              {myProfile.displayName}
            </div>
            <div style={{ ...neonText, color: '#fff', fontSize: 10, opacity: 0.6 }}>真实属性</div>
          </div>
          <div style={hpTrackStyle}>
            <div style={{ ...hpFillMyStyle, width: `${hp1Percent}%` }} />
          </div>
        </div>

        <div style={{ ...neonText, color: '#fff', fontSize: 18, fontWeight: 900, opacity: 0.8 }}>VS</div>

        <div style={{ ...hpBlockStyle, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <div style={{ ...neonText, color: oppSource === 'real' ? neonPink : '#bbb', fontSize: 10, opacity: 0.75 }}>
              {oppSource === 'real' ? '真实属性' : '估算属性'}
            </div>
            <div style={{ ...neonText, color: neonPink, fontSize: 13, fontWeight: 700 }}>
              {opponent.displayName}
            </div>
          </div>
          <div style={hpTrackEnemyStyle}>
            <div style={{ ...hpFillEnemyStyle, width: `${hp2Percent}%` }} />
          </div>
        </div>
      </div>

      {/* 战斗区域 */}
      <div style={battleAreaStyle}>
        <div style={{ ...charPosStyle, left: '20%' }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ ...auraStyle, color: neonCyan }} />
            <div key={hurtKey1} style={hurtKey1 > 0 ? hurtAnimStyle : charBodyStyle}>
              <span style={emojiStyle}>🤖</span>
            </div>
          </div>
          <div style={{ ...neonText, color: neonCyan, fontSize: 11, marginTop: 6 }}>Lv.{myProfile.level}</div>
        </div>

        <div style={{ ...charPosStyle, left: '80%' }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ ...auraStyle, color: neonPink }} />
            <div key={hurtKey2} style={hurtKey2 > 0 ? hurtAnimStyle : charBodyStyle}>
              <span style={{ ...emojiStyle, transform: 'scaleX(-1)' }}>🤖</span>
            </div>
          </div>
          <div style={{ ...neonText, color: neonPink, fontSize: 11, marginTop: 6 }}>Lv.{opponent.level}</div>
        </div>

        {bullets.map((b) => {
          const color = b.fromPlayer1 ? neonCyan : neonPink;
          return (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                top: '50%',
                left: b.fromPlayer1 ? '20%' : '80%',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
                animation: `${b.fromPlayer1 ? 'pkBulletRight' : 'pkBulletLeft'} ${b.travelTime}ms linear forwards`,
                pointerEvents: 'none',
                zIndex: 4,
              }}
            />
          );
        })}

        {damageNumbers.map((d) => (
          <div
            key={d.id}
            style={{
              ...neonText,
              position: 'absolute',
              top: '38%',
              left: d.targetIsPlayer1 ? '20%' : '80%',
              color: d.isCrit ? neonYellow : '#fff',
              fontSize: d.isCrit ? 22 : 16,
              fontWeight: 900,
              textShadow: `0 0 8px ${d.isCrit ? neonYellow : neonRed}`,
              animation: `pkFloatUp ${DAMAGE_NUMBER_LIFE}ms ease-out forwards`,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            {d.isCrit ? `${d.value}!` : d.value}
          </div>
        ))}
      </div>

      {/* 拉取对手属性 loading 遮罩（1.5 秒内拉到则不显示） */}
      {loadingOpp && (
        <div style={loadingOverlayStyle}>
          <div
            style={{
              width: 40,
              height: 40,
              border: `3px solid ${neonPurple}44`,
              borderTopColor: neonCyan,
              borderRadius: '50%',
              animation: 'pkSpin 0.8s linear infinite',
            }}
          />
          <div style={{ ...neonText, color: '#fff', fontSize: 14, marginTop: 16, opacity: 0.85 }}>
            正在同步对手战斗属性…
          </div>
        </div>
      )}
      {fetchError && !loadingOpp && (
        <div style={errorTipStyle}>
          {fetchError}
        </div>
      )}

      {isFinished && (
        <div style={overlayStyle}>
          <div
            style={{
              ...neonText,
              fontSize: 56,
              fontWeight: 900,
              color: isWin ? neonGreen : neonRed,
              textShadow: `0 0 24px ${isWin ? neonGreen : neonRed}, 0 0 48px ${isWin ? neonGreen : neonRed}`,
              letterSpacing: 8,
              animation: 'pkResultPop 0.5s ease-out',
            }}
          >
            {isWin ? '胜利' : '失败'}
          </div>
        </div>
      )}

      {showReturn && (
        <button style={returnBtnStyle} onClick={onClose}>
          返回
        </button>
      )}
    </div>
  );
};

/* ============ 样式定义 ============ */

const sceneStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  background: 'linear-gradient(180deg, #0a0420 0%, #1a0a3a 50%, #0a0420 100%)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  ...neonText,
};

const gridFloorStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '45%',
  backgroundImage: `linear-gradient(${neonPurple}22 1px, transparent 1px), linear-gradient(90deg, ${neonPurple}22 1px, transparent 1px)`,
  backgroundSize: '40px 40px',
  transform: 'perspective(300px) rotateX(60deg)',
  transformOrigin: 'bottom',
  opacity: 0.5,
  pointerEvents: 'none',
  maskImage: 'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))',
  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))',
};

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '20px 24px 12px',
  zIndex: 3,
};

const hpBlockStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const hpTrackStyle: React.CSSProperties = {
  width: '100%',
  height: 14,
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 7,
  overflow: 'hidden',
};

const hpTrackEnemyStyle: React.CSSProperties = {
  ...hpTrackStyle,
  display: 'flex',
  justifyContent: 'flex-end',
};

const hpFillMyStyle: React.CSSProperties = {
  height: '100%',
  background: `linear-gradient(90deg, ${neonGreen}, ${neonCyan})`,
  boxShadow: `0 0 10px ${neonGreen}`,
  transition: 'width 0.15s linear',
  borderRadius: 7,
};

const hpFillEnemyStyle: React.CSSProperties = {
  height: '100%',
  background: `linear-gradient(90deg, ${neonRed}, ${neonPink})`,
  boxShadow: `0 0 10px ${neonRed}`,
  transition: 'width 0.15s linear',
  borderRadius: 7,
};

const battleAreaStyle: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  overflow: 'hidden',
};

const charPosStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 2,
};

const auraStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: 110,
  height: 110,
  borderRadius: '50%',
  background: 'radial-gradient(circle, currentColor 0%, transparent 70%)',
  animation: 'pkAuraPulse 2s ease-in-out infinite',
  pointerEvents: 'none',
  zIndex: 1,
};

const charBodyStyle: React.CSSProperties = { position: 'relative', zIndex: 2 };

const hurtAnimStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  animation: 'pkHurt 0.3s ease',
};

const emojiStyle: React.CSSProperties = {
  fontSize: 64,
  display: 'block',
  filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))',
};

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
  animation: 'pkFadeIn 0.3s ease',
};

const loadingOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(10,4,32,0.6)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9,
};

const errorTipStyle: React.CSSProperties = {
  position: 'absolute',
  top: 120,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '6px 14px',
  borderRadius: 8,
  background: `${neonRed}22`,
  border: `1px solid ${neonRed}66`,
  ...neonText,
  color: neonRed,
  fontSize: 12,
  zIndex: 8,
};

const returnBtnStyle: React.CSSProperties = {
  ...neonText,
  position: 'absolute',
  bottom: 40,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '10px 32px',
  background: `linear-gradient(135deg, ${neonCyan}, ${neonPurple})`,
  border: 'none',
  borderRadius: 10,
  color: '#fff',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  boxShadow: `0 0 16px ${neonCyan}88`,
  zIndex: 11,
};

export default PkBattleScene;
