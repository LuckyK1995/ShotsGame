import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getItemDef, getPotionEffectText } from '../game/data/equipment';
import { neonCyan, neonPurple, neonPink, neonYellow } from '../theme/colors';
import { memo } from 'react';
import { ModalHudBackground } from './ModalHudBackground';

interface StatusBarProps {
  onOpenShop?: () => void;
  view?: 'menu' | 'battle';
  engineRef?: {
    current: {
      getItemCooldowns?: () => { key: string; remaining: number; duration: number; icon: string; name: string; itemId: string }[];
      getActivePotionEffects?: () => { key: string; remaining: number; duration: number; icon: string; name: string; itemId: string; isWave: boolean }[];
      calcPower?: () => number;
      getGameMode?: () => string;
    } | null;
  };
}

function StatusBarImpl({ onOpenShop, view = 'battle', engineRef }: StatusBarProps) {
  // 性能优化：使用细粒度 selector 订阅，避免任意 state 变化触发重渲染
  const gameState = useGameStore(s => s.gameState);
  const player = useGameStore(s => s.player);
  const [showStats, setShowStats] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [gameMode, setGameMode] = useState<string>('stage');
  const [itemCooldowns, setItemCooldowns] = useState<{ key: string; remaining: number; duration: number; icon: string; name: string; itemId: string }[]>([]);
  const [activePotions, setActivePotions] = useState<{ key: string; remaining: number; duration: number; icon: string; name: string; itemId: string; isWave: boolean }[]>([]);
  const flashRef = useRef<Record<string, boolean>>({});
  // 点击倒计时栏图标后的药水效果弹框
  const [potionInfo, setPotionInfo] = useState<{ icon: string; name: string; description: string; remaining?: number; duration?: number; isWave: boolean } | null>(null);

  // 点击倒计时栏图标：显示药水效果弹框
  const handlePotionClick = (item: { key: string; remaining: number; duration: number; icon: string; name: string; itemId: string; isWave: boolean }) => {
    const itemDef = getItemDef(item.itemId);
    let description = '';
    if (itemDef) {
      if (itemDef.effect === 'skill_potion' && itemDef.potionType) {
        description = getPotionEffectText(itemDef.potionType, (itemDef as any).potionLevel || player?.level || 1);
        // 修正定时药水的描述（实际为定时，不是整回合）
        if (itemDef.potionType === 'laser') description = '获得激光炮效果，持续5秒';
        if (itemDef.potionType === 'sweep') description = '获得战术横扫效果，持续10秒';
      } else {
        // 普通药水使用 ItemDef.description
        description = itemDef.description || '';
      }
    }
    setPotionInfo({
      icon: item.icon,
      name: item.name,
      description,
      remaining: item.isWave ? undefined : item.remaining,
      duration: item.isWave ? undefined : item.duration,
      isWave: item.isWave,
    });
  };

  // 点击屏幕任意位置关闭药水弹框
  useEffect(() => {
    if (!potionInfo) return;
    const handler = () => setPotionInfo(null);
    // 延迟一帧绑定，避免本次 click 立即触发
    const id = window.setTimeout(() => {
      window.addEventListener('click', handler);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('click', handler);
    };
  }, [potionInfo]);

  useEffect(() => {
    const saved = localStorage.getItem('shotsGameHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (player?.score !== undefined && player.score > highScore) {
      setHighScore(player.score);
    }
  }, [player?.score, highScore]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef?.current?.getItemCooldowns) {
        const cds = engineRef.current.getItemCooldowns();
        const prevKeys = new Set(itemCooldowns.map(c => c.key));
        const currKeys = new Set(cds.map(c => c.key));
        for (const c of itemCooldowns) {
          if (!currKeys.has(c.key) && prevKeys.has(c.key)) {
            flashRef.current[c.key] = true;
            setTimeout(() => {
              flashRef.current[c.key] = false;
            }, 300);
          }
        }
        setItemCooldowns(cds);
      }
      if (engineRef?.current?.getActivePotionEffects) {
        setActivePotions(engineRef.current.getActivePotionEffects());
      }
      if (engineRef?.current?.getGameMode) {
        setGameMode(engineRef.current.getGameMode());
      }
    }, 50);
    return () => clearInterval(interval);
  }, [engineRef, itemCooldowns]);

  if (!player) return null;
  // 战斗视图需要 gameState；主界面视图只需要 player
  if (view === 'battle' && !gameState) return null;

  const healthPercent = (player.health / player.maxHealth) * 100;
  const expPercent = (player.exp / player.expToNextLevel) * 100;

  // 战斗力计算：优先使用引擎配置的权重
  const calcPower = (): number => {
    if (engineRef?.current?.calcPower) {
      return engineRef.current.calcPower();
    }
    const p = player as any;
    let power = 0;
    power += (p.attack || 0) * 10;
    power += (1000 / (p.attackSpeed || 1000)) * 15;
    power += (p.maxHealth || 0) * 0.5;
    power += (p.critRate || 0) * 8;
    power += ((p.critDamage || 0) - 100) * 2;
    power += (p.pierceCount || 0) * 30;
    power += (p.lifestealPercent || 0) * 20;
    power += (p.range || 0) * 0.3;
    power += (p.defense || 0) * 5;
    power += (p.burnChance || 0) * 3;
    power += (p.poisonChance || 0) * 3;
    power += (p.freezeChance || 0) * 3;
    power += (p.lightningChance || 0) * 4;
    return Math.round(power);
  };
  const power = calcPower();

  const neonText = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 600,
    letterSpacing: '0.3px',
  } as React.CSSProperties;

  const cardStyle = {
    background: 'rgba(19, 16, 37, 0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(176, 38, 255, 0.25)',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(176, 38, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
  };

  // 顶部属性条使用的颜色已移至 theme/colors 顶部 import

  return (
    <div
      className="absolute top-0 left-0 right-0 p-2 pointer-events-none select-none"
      style={{
        zIndex: view === 'menu' ? 60 : 10,
        bottom: view === 'menu' ? '0' : undefined,
      }}
    >
      <div className="flex items-start gap-2">
        {/* 左侧：波次/等级/属性 —— 主界面时定位在 8 个模式按钮上方，战斗时保持左上角 */}
        <div
          className="flex flex-col gap-1.5 pointer-events-auto"
          style={
            view === 'menu'
              ? {
                  width: '130px',
                  position: 'absolute',
                  left: '50%',
                  bottom: '265px',
                  transform: 'translateX(-50%)',
                }
              : { width: '130px' }
          }
        >

          {/* 关卡框（仅战斗时显示）- 全息 HUD 风格 */}
          {view === 'battle' && gameState && (() => {
            // 无波次模式：直接显示模式名称（颜色与主界面按钮一致）
            const nonWaveModes: Record<string, { label: string; color: string }> = {
              worldboss: { label: '世界BOSS', color: '#FF3B3B' },
              purgatory: { label: '炼狱', color: '#FF8C00' },
              mirror: { label: '镜像挑战', color: '#00F5D4' },
              daily: { label: '日常挑战', color: '#FFD93D' },
              material: { label: '材料副本', color: '#9B59B6' },
            };
            const nw = nonWaveModes[gameMode];
            // 关卡挑战用青色，其他无波次模式用各自颜色
            const waveColor = nw ? nw.color : neonCyan;
            return (
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  position: 'relative',
                  width: '90px',
                  height: '52px',
                  padding: '2px 0',
                  background: `linear-gradient(180deg, ${waveColor}22, ${waveColor}08)`,
                  border: `1px solid ${waveColor}60`,
                  borderRadius: '4px',
                  boxShadow: `0 0 10px ${waveColor}30, inset 0 0 8px ${waveColor}15`,
                  clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                  overflow: 'hidden',
                }}
              >
                {/* 四角 HUD 角标 */}
                <span style={{ position: 'absolute', top: '1px', left: '1px', width: '5px', height: '5px', borderTop: `1px solid ${waveColor}`, borderLeft: `1px solid ${waveColor}`, opacity: 0.8 }} />
                <span style={{ position: 'absolute', top: '1px', right: '1px', width: '5px', height: '5px', borderTop: `1px solid ${waveColor}`, borderRight: `1px solid ${waveColor}`, opacity: 0.8 }} />
                <span style={{ position: 'absolute', bottom: '1px', left: '1px', width: '5px', height: '5px', borderBottom: `1px solid ${waveColor}`, borderLeft: `1px solid ${waveColor}`, opacity: 0.8 }} />
                <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '5px', height: '5px', borderBottom: `1px solid ${waveColor}`, borderRight: `1px solid ${waveColor}`, opacity: 0.8 }} />
                {/* 扫描线 */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    height: '16px',
                    background: `linear-gradient(180deg, transparent, ${waveColor}30, transparent)`,
                    animation: 'hud-scan 3s linear infinite',
                    pointerEvents: 'none',
                  }}
                />
                {/* 能量核心 */}
                <div
                  style={{
                    position: 'absolute',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${waveColor}40 0%, transparent 70%)`,
                    animation: 'btn-core-pulse 2.5s ease-in-out infinite',
                    pointerEvents: 'none',
                  }}
                />
                {nw ? (
                  <>
                    <span
                      style={{
                        ...neonText,
                        position: 'relative',
                        zIndex: 1,
                        fontSize: '11px',
                        color: nw.color,
                        letterSpacing: '0.5px',
                        fontWeight: 700,
                        textShadow: `0 0 6px ${nw.color}, 0 0 12px ${nw.color}80`,
                        animation: 'hud-level-flicker 4s linear infinite, glow-pulse 1.2s ease-in-out infinite',
                      }}
                    >
                      {nw.label}
                    </span>
                    <span style={{ ...neonText, position: 'relative', zIndex: 1, fontSize: '8px', color: nw.color, opacity: 0.85, textShadow: `0 0 4px ${nw.color}60` }}>
                      挑战中
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ ...neonText, position: 'relative', zIndex: 1, fontSize: '12px', color: neonCyan, letterSpacing: '0.5px', fontWeight: 700, textShadow: `0 0 6px ${neonCyan}A0`, animation: 'hud-level-flicker 4s linear infinite' }}>
                      第{gameState.currentWave}波
                    </span>
                    {(() => {
                      const remaining = gameState.waveEnemiesRemaining;
                      const total = gameState.waveEnemiesTotal || 50;
                      // 精英/BOSS出场时（showEliteBossNotice）显示来袭文字
                      if (gameState.showEliteBossNotice) {
                        const nt = gameState.eliteBossNoticeType;
                        const isPurgatory = nt === 'purgatory';
                        const isBoss = nt === 'boss';
                        const color = isPurgatory ? '#B026FF' : (isBoss ? '#FF3B3B' : '#FFE600');
                        const text = isPurgatory ? '击败炼狱BOSS吧！' : (isBoss ? 'BOSS来袭！' : '精英来袭！');
                        return (
                          <span style={{ ...neonText, position: 'relative', zIndex: 1, fontSize: '8px', color, fontWeight: 700, textShadow: `0 0 4px ${color}`, animation: 'glow-pulse 1s ease-in-out infinite' }}>
                            {text}
                          </span>
                        );
                      }
                      return (
                        <span style={{ ...neonText, position: 'relative', zIndex: 1, fontSize: '8px', color: '#8B80A0' }}>
                          {remaining}/{total}
                        </span>
                      );
                    })()}
                  </>
                )}
              </div>
            );
          })()}

          {/* 等级 + 属性 */}
          <div className="flex gap-1.5" style={{ marginTop: view === 'battle' ? '10px' : '0' }}>
            {/* 等级 - 全息 HUD 风格（主界面 + 战斗界面统一） */}
            <div
              style={{
                position: 'relative',
                flex: 1,
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(180deg, ${neonPurple}22, ${neonPurple}08)`,
                border: `1px solid ${neonPurple}60`,
                borderRadius: '4px',
                boxShadow: `0 0 10px ${neonPurple}30, inset 0 0 8px ${neonPurple}15`,
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                overflow: 'hidden',
              }}
            >
              {/* 角标 */}
              <span style={{ position: 'absolute', top: '1px', left: '1px', width: '4px', height: '4px', borderTop: `1px solid ${neonPurple}`, borderLeft: `1px solid ${neonPurple}`, opacity: 0.8 }} />
              <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '4px', height: '4px', borderBottom: `1px solid ${neonPurple}`, borderRight: `1px solid ${neonPurple}`, opacity: 0.8 }} />
              {/* 扫描线 */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: '12px',
                  background: `linear-gradient(180deg, transparent, ${neonPurple}30, transparent)`,
                  animation: 'hud-scan 3s linear infinite',
                  pointerEvents: 'none',
                }}
              />
              {/* 能量核心 */}
              <div
                style={{
                  position: 'absolute',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${neonPurple}40 0%, transparent 70%)`,
                  animation: 'btn-core-pulse 2.5s ease-in-out infinite',
                  pointerEvents: 'none',
                }}
              />
              <span
                style={{
                  ...neonText,
                  position: 'relative',
                  zIndex: 1,
                  fontSize: '11px',
                  color: neonPurple,
                  fontWeight: 700,
                  textShadow: `0 0 6px ${neonPurple}A0, 0 0 12px ${neonPurple}60`,
                  animation: 'hud-level-flicker 4s linear infinite',
                  letterSpacing: '0.5px',
                }}
              >
                Lv.{player.level}
              </span>
            </div>

            {/* 战斗力 - 全息 HUD 风格（主界面 + 战斗界面统一） */}
            <button
              onClick={() => setShowStats(!showStats)}
              style={{
                position: 'relative',
                flex: 1,
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                cursor: 'pointer',
                background: showStats
                  ? `linear-gradient(180deg, ${neonYellow}30, ${neonYellow}08)`
                  : `linear-gradient(180deg, ${neonYellow}22, ${neonYellow}06)`,
                border: `1px solid ${showStats ? neonYellow : `${neonYellow}80`}`,
                borderRadius: '4px',
                boxShadow: showStats
                  ? `0 0 14px ${neonYellow}60, inset 0 0 10px ${neonYellow}25`
                  : `0 0 10px ${neonYellow}30, inset 0 0 8px ${neonYellow}15`,
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              {/* 角标 */}
              <span style={{ position: 'absolute', top: '1px', left: '1px', width: '4px', height: '4px', borderTop: `1px solid ${neonYellow}`, borderLeft: `1px solid ${neonYellow}`, opacity: 0.8 }} />
              <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '4px', height: '4px', borderBottom: `1px solid ${neonYellow}`, borderRight: `1px solid ${neonYellow}`, opacity: 0.8 }} />
              {/* 扫描线 */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: '12px',
                  background: `linear-gradient(180deg, transparent, ${neonYellow}30, transparent)`,
                  animation: 'hud-scan 3.5s linear infinite',
                  pointerEvents: 'none',
                }}
              />
              <span style={{ position: 'relative', zIndex: 1, fontSize: '10px', filter: `drop-shadow(0 0 3px ${neonYellow}A0)`, animation: 'btn-icon-breathe 2s ease-in-out infinite' }}>⚡</span>
              <span
                style={{
                  ...neonText,
                  position: 'relative',
                  zIndex: 1,
                  fontSize: '11px',
                  color: neonYellow,
                  fontWeight: 700,
                  textShadow: `0 0 6px ${neonYellow}A0`,
                  animation: 'hud-power-pulse 2s ease-in-out infinite',
                  letterSpacing: '0.5px',
                }}
              >
                {power}
              </span>
            </button>
          </div>

          {/* HP Bar - 全息 HUD 风格（主界面 + 战斗界面统一） */}
          <div
            style={{
              position: 'relative',
              height: '18px',
              background: `linear-gradient(180deg, rgba(19,16,37,0.9), rgba(10,8,20,0.95))`,
              border: `1px solid rgba(255,45,85,0.5)`,
              borderRadius: '4px',
              boxShadow: `0 0 8px rgba(255,45,85,0.2), inset 0 1px 0 rgba(255,255,255,0.04)`,
              clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
              overflow: 'hidden',
            }}
          >
            {/* 角标 */}
            <span style={{ position: 'absolute', top: '1px', left: '1px', width: '3px', height: '3px', borderTop: `1px solid ${neonPink}`, borderLeft: `1px solid ${neonPink}`, opacity: 0.7, zIndex: 2 }} />
            <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '3px', height: '3px', borderBottom: `1px solid ${neonPink}`, borderRight: `1px solid ${neonPink}`, opacity: 0.7, zIndex: 2 }} />
            {/* HP 填充 */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${healthPercent}%`,
                background: `linear-gradient(90deg, #FF2D55 0%, ${neonPink} 100%)`,
                boxShadow: `0 0 8px ${neonPink}80, inset 0 0 4px rgba(255,255,255,0.2)`,
                transition: 'width 0.25s ease-out',
                animation: 'hud-bar-pulse 2s ease-in-out infinite',
              }}
            >
              {/* 流光 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                  width: '40%',
                  animation: 'hud-bar-flow 2.5s linear infinite',
                }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-between px-2" style={{ zIndex: 1 }}>
              <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF', fontWeight: 700, textShadow: `0 0 3px rgba(0,0,0,0.8)` }}>HP</span>
              <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF', opacity: 0.95, textShadow: `0 0 3px rgba(0,0,0,0.8)`, fontWeight: 700 }}>
                {Math.ceil(player.health)}/{player.maxHealth}
              </span>
            </div>
          </div>

          {/* EXP Bar - 全息 HUD 风格（主界面 + 战斗界面统一） */}
          <div
            style={{
              position: 'relative',
              height: '14px',
              background: `linear-gradient(180deg, rgba(19,16,37,0.9), rgba(10,8,20,0.95))`,
              border: `1px solid rgba(255,214,10,0.5)`,
              borderRadius: '4px',
              boxShadow: `0 0 8px rgba(255,214,10,0.2), inset 0 1px 0 rgba(255,255,255,0.04)`,
              clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)',
              overflow: 'hidden',
            }}
          >
            {/* 角标 */}
            <span style={{ position: 'absolute', top: '1px', left: '1px', width: '3px', height: '3px', borderTop: `1px solid ${neonYellow}`, borderLeft: `1px solid ${neonYellow}`, opacity: 0.7, zIndex: 2 }} />
            <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '3px', height: '3px', borderBottom: `1px solid ${neonYellow}`, borderRight: `1px solid ${neonYellow}`, opacity: 0.7, zIndex: 2 }} />
            {/* EXP 填充 */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${expPercent}%`,
                background: `linear-gradient(90deg, #FFD60A 0%, ${neonYellow} 100%)`,
                boxShadow: `0 0 8px ${neonYellow}80, inset 0 0 4px rgba(255,255,255,0.2)`,
                transition: 'width 0.35s ease-out',
                animation: 'hud-bar-pulse 2.5s ease-in-out infinite',
              }}
            >
              {/* 流光 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                  width: '40%',
                  animation: 'hud-bar-flow 3s linear infinite',
                }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-between px-2" style={{ zIndex: 1 }}>
              <span style={{ ...neonText, fontSize: '6px', color: '#FFFFFF', fontWeight: 700, textShadow: `0 0 3px rgba(0,0,0,0.8)` }}>EXP</span>
              <span style={{ ...neonText, fontSize: '6px', color: '#FFFFFF', opacity: 0.9, textShadow: `0 0 3px rgba(0,0,0,0.8)`, fontWeight: 700 }}>
                {player.exp}/{player.expToNextLevel}
              </span>
            </div>
          </div>

          {/* 药水/技能持续时间倒计时栏（仅战斗时显示，优先显示生效中，其次显示冷却中） */}
          {view === 'battle' && (
          <div className="flex gap-1.5 flex-wrap relative" style={{ minHeight: '22px' }}>
            {/* 生效中药水（属性药水整回合显示 + 定时药水显示剩余持续时间） */}
            {activePotions.map((item) => {
              const isWave = item.isWave;
              const cdPercent = isWave ? 0 : (item.duration > 0 ? 1 - item.remaining / item.duration : 0);
              return (
                <div
                  key={item.key}
                  className="relative flex items-center justify-center flex-shrink-0 cursor-pointer"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: 'rgba(19, 16, 37, 0.9)',
                    border: `1px solid ${isWave ? 'rgba(0, 245, 212, 0.6)' : 'rgba(255, 230, 0, 0.6)'}`,
                    boxShadow: isWave
                      ? `0 0 6px ${neonCyan}80, inset 0 0 4px ${neonCyan}40`
                      : `0 0 5px ${neonYellow}80`,
                    transition: 'box-shadow 0.15s ease-out',
                    overflow: 'hidden',
                  }}
                  title={`${item.name} (点击查看效果)`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePotionClick(item);
                  }}
                >
                  {!isWave && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `conic-gradient(rgba(255,255,255,0.15) ${cdPercent * 360}deg, transparent 0deg)`,
                      }}
                    />
                  )}
                  {isWave && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${neonCyan}20 0%, transparent 70%)`,
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      filter: isWave
                        ? 'drop-shadow(0 0 2px rgba(0,245,212,0.6))'
                        : `grayscale(${1 - cdPercent}) brightness(${0.3 + cdPercent * 0.7})`,
                    }}
                  >
                    <span style={{ fontSize: '10px' }}>{item.icon}</span>
                  </div>
                  {!isWave && (
                    <span
                      style={{
                        ...neonText,
                        fontSize: '5px',
                        color: '#FFFFFF',
                        position: 'absolute',
                        bottom: '0.5px',
                        textShadow: '0 0 2px rgba(0,0,0,0.8)',
                        lineHeight: 1,
                      }}
                    >
                      {(item.remaining / 1000).toFixed(1)}
                    </span>
                  )}
                  {isWave && (
                    <span
                      style={{
                        fontSize: '7px',
                        color: neonCyan,
                        position: 'absolute',
                        top: '0.5px',
                        right: '0.5px',
                        textShadow: '0 0 2px rgba(0,0,0,0.8)',
                        lineHeight: 1,
                        fontWeight: 700,
                      }}
                    >
                      ∞
                    </span>
                  )}
                </div>
              );
            })}
            {/* 冷却中药水（弱化显示） */}
            {itemCooldowns.map((item) => {
              const cdPercent = 1 - item.remaining / item.duration;
              return (
                <div
                  key={item.key}
                  className="relative flex items-center justify-center flex-shrink-0 cursor-pointer"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: 'rgba(19, 16, 37, 0.6)',
                    border: '1px solid rgba(100, 100, 130, 0.3)',
                    boxShadow: flashRef.current[item.key]
                      ? `0 0 8px ${neonYellow}, 0 0 15px ${neonYellow}80`
                      : 'none',
                    transition: 'box-shadow 0.15s ease-out',
                    overflow: 'hidden',
                    opacity: 0.55,
                  }}
                  title={`${item.name} 冷却 (${(item.remaining / 1000).toFixed(1)}s)`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePotionClick({ ...item, isWave: false });
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `conic-gradient(rgba(255,255,255,0.15) ${cdPercent * 360}deg, transparent 0deg)`,
                    }}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      filter: `grayscale(1) brightness(${0.3 + cdPercent * 0.4})`,
                    }}
                  >
                    <span style={{ fontSize: '10px' }}>{item.icon}</span>
                  </div>
                  <span
                    style={{
                      ...neonText,
                      fontSize: '5px',
                      color: '#8B80A0',
                      position: 'absolute',
                      bottom: '0.5px',
                      textShadow: '0 0 2px rgba(0,0,0,0.8)',
                      lineHeight: 1,
                    }}
                  >
                    {(item.remaining / 1000).toFixed(1)}
                  </span>
                </div>
              );
            })}
            {/* 点击倒计时栏图标后的药水效果弹框（栏下方） */}
            {potionInfo && (
              <div
                className="absolute z-30"
                style={{
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  minWidth: '180px',
                  maxWidth: '240px',
                  animation: 'potionInfoIn 0.15s ease-out',
                  pointerEvents: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="relative"
                  style={{
                    background: 'rgba(13, 11, 26, 0.95)',
                    border: `1px solid ${potionInfo.isWave ? 'rgba(0, 245, 212, 0.5)' : 'rgba(255, 230, 0, 0.5)'}`,
                    borderRadius: '8px',
                    boxShadow: `0 0 12px ${potionInfo.isWave ? 'rgba(0, 245, 212, 0.3)' : 'rgba(255, 230, 0, 0.3)'}, 0 4px 12px rgba(0,0,0,0.5)`,
                    backdropFilter: 'blur(8px)',
                    padding: '8px 10px',
                    overflow: 'hidden',
                  }}
                >
                  {/* HUD 背景：与按钮区不同纹路/颜色 */}
                  <ModalHudBackground
                    accentColor={potionInfo.isWave ? neonCyan : neonYellow}
                    accentColor2={neonPurple}
                  />
                  <div className="relative" style={{ zIndex: 1 }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        style={{
                          fontSize: '18px',
                          filter: `drop-shadow(0 0 4px ${potionInfo.isWave ? neonCyan : neonYellow}80)`,
                        }}
                      >
                        {potionInfo.icon}
                      </span>
                      <span
                        style={{
                          ...neonText,
                          fontSize: '11px',
                          fontWeight: 700,
                          color: potionInfo.isWave ? neonCyan : neonYellow,
                          letterSpacing: '0.5px',
                          textShadow: `0 0 4px ${potionInfo.isWave ? 'rgba(0,245,212,0.4)' : 'rgba(255,230,0,0.4)'}`,
                        }}
                      >
                        {potionInfo.name}
                      </span>
                    </div>
                    {potionInfo.description && (
                      <div
                        style={{
                          fontFamily: '"Rajdhani", "Orbitron", monospace',
                          fontSize: '10px',
                          color: '#E0E0FF',
                          lineHeight: 1.4,
                          marginBottom: potionInfo.isWave || potionInfo.remaining !== undefined ? '4px' : 0,
                        }}
                      >
                        {potionInfo.description}
                      </div>
                    )}
                    {potionInfo.isWave ? (
                      <div
                        style={{
                          fontFamily: '"Rajdhani", "Orbitron", monospace',
                          fontSize: '9px',
                          color: neonCyan,
                          fontWeight: 600,
                        }}
                      >
                        ∞ 整回合持续
                      </div>
                    ) : potionInfo.remaining !== undefined && potionInfo.duration !== undefined ? (
                      <div
                        style={{
                          fontFamily: '"Rajdhani", "Orbitron", monospace',
                          fontSize: '9px',
                          color: '#8B80A0',
                          fontWeight: 600,
                        }}
                      >
                        剩余 {(potionInfo.remaining / 1000).toFixed(1)}秒 / {(potionInfo.duration / 1000).toFixed(1)}秒
                      </div>
                    ) : null}
                    <div
                      style={{
                        fontFamily: '"Rajdhani", "Orbitron", monospace',
                        fontSize: '7px',
                        color: '#5A5A7A',
                        marginTop: '4px',
                        textAlign: 'right',
                      }}
                    >
                      点击空白关闭
                    </div>
                  </div>
                  {/* keyframes 已提取至 index.css */}
                </div>
              </div>
            )}
          </div>
          )}

          {/* 属性面板 - 显示人物所有属性（向上弹出） */}
          {showStats && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 4px)',
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: '240px',
                maxWidth: '280px',
              }}
            >
              <div
                style={{
                  ...cardStyle,
                  position: 'relative',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  padding: '8px 10px',
                  overflowX: 'hidden',
                }}
              >
                {/* HUD 背景：与按钮区不同纹路/颜色 */}
                <ModalHudBackground accentColor={neonYellow} accentColor2={neonPurple} />
                <div className="relative" style={{ zIndex: 1 }}>
                  <div className="grid grid-cols-4 gap-x-2 gap-y-0.5">
                    <StatRow label="生命" value={`${Math.ceil(player.health)}/${player.maxHealth}`} color="#FF2D55" />
                    <StatRow label="攻击" value={`${player.attack}`} color={neonPink} />
                    <StatRow label="攻速" value={`${player.attackSpeed}ms`} color={neonCyan} />
                    <StatRow label="射程" value={`${player.range}`} color="#34C759" />
                    <StatRow label="暴击率" value={`${((player as any).critRate || 0).toFixed(1)}%`} color={neonPurple} />
                    <StatRow label="暴击伤害" value={`${((player as any).critDamage || 0).toFixed(0)}%`} color={neonPurple} />
                    <StatRow label="防御" value={`${(player as any).defense || 0}`} color="#5BA3E0" />
                    <StatRow label="抗性" value={`${(player as any).resistance || 0}`} color="#5BA3E0" />
                    <StatRow label="物理穿透" value={`${(player as any).physicalPenetration || 0}`} color={neonYellow} />
                    <StatRow label="吸血" value={`${((player as any).lifestealPercent || 0).toFixed(1)}%`} color="#FF6B9D" />
                    <StatRow label="每秒回血" value={`${(((player as any).regenPerSec || 0) * 100).toFixed(1)}%`} color="#34C759" />
                    <StatRow label="金币加成" value={`+${(((player as any).goldBonus || 0) * 100).toFixed(0)}%`} color={neonYellow} />
                    <StatRow label="经验加成" value={`+${(((player as any).expBonus || 0) * 100).toFixed(0)}%`} color={neonYellow} />
                    <StatRow label="掉落加成" value={`+${(((player as any).dropBonus || 0) * 100).toFixed(0)}%`} color={neonYellow} />
                    {(player as any).burnChance > 0 && <StatRow label="灼烧概率" value={`${(player as any).burnChance.toFixed(0)}%`} color="#FF6B35" />}
                    {(player as any).poisonChance > 0 && <StatRow label="中毒概率" value={`${(player as any).poisonChance.toFixed(0)}%`} color="#9B59B6" />}
                    {(player as any).freezeChance > 0 && <StatRow label="冰冻概率" value={`${(player as any).freezeChance.toFixed(0)}%`} color="#5BC0EB" />}
                    {(player as any).lightningChance > 0 && <StatRow label="雷电概率" value={`${(player as any).lightningChance.toFixed(0)}%`} color="#FFD700" />}
                  </div>
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(176, 38, 255, 0.2)',
                    textAlign: 'right',
                  }}>
                    <span style={{
                      ...neonText,
                      fontSize: '11px',
                      color: neonYellow,
                      fontWeight: 700,
                      textShadow: `0 0 6px ${neonYellow}80`,
                      letterSpacing: '0.5px',
                    }}>
                      战斗力: {power}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 中间占位 */}
        <div className="flex-1" />

        {/* 右侧：分数 + 金币（仅战斗时显示）- 全息 HUD 风格 */}
        {view === 'battle' && (
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* 分数框 - 上下布局，上当前分，下历史最高 */}
          <div
            className="flex flex-col items-center justify-center"
            style={{
              position: 'relative',
              width: '100px',
              height: '44px',
              gap: '2px',
              padding: '4px 0',
              background: `linear-gradient(180deg, ${neonPurple}22, ${neonPurple}08)`,
              border: `1px solid ${neonPurple}60`,
              borderRadius: '4px',
              boxShadow: `0 0 10px ${neonPurple}30, inset 0 0 8px ${neonPurple}15`,
              clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
              overflow: 'hidden',
            }}
          >
            {/* 四角 HUD 角标 */}
            <span style={{ position: 'absolute', top: '1px', left: '1px', width: '5px', height: '5px', borderTop: `1px solid ${neonPurple}`, borderLeft: `1px solid ${neonPurple}`, opacity: 0.8 }} />
            <span style={{ position: 'absolute', top: '1px', right: '1px', width: '5px', height: '5px', borderTop: `1px solid ${neonPurple}`, borderRight: `1px solid ${neonPurple}`, opacity: 0.8 }} />
            <span style={{ position: 'absolute', bottom: '1px', left: '1px', width: '5px', height: '5px', borderBottom: `1px solid ${neonPurple}`, borderLeft: `1px solid ${neonPurple}`, opacity: 0.8 }} />
            <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '5px', height: '5px', borderBottom: `1px solid ${neonPurple}`, borderRight: `1px solid ${neonPurple}`, opacity: 0.8 }} />
            {/* 扫描线 */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: '14px',
                background: `linear-gradient(180deg, transparent, ${neonPurple}30, transparent)`,
                animation: 'hud-scan 3.5s linear infinite',
                pointerEvents: 'none',
              }}
            />
            {/* 能量核心 */}
            <div
              style={{
                position: 'absolute',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${neonYellow}30 0%, transparent 70%)`,
                animation: 'btn-core-pulse 2.8s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
            <span
              style={{
                ...neonText,
                position: 'relative',
                zIndex: 1,
                fontSize: '12px',
                color: neonYellow,
                letterSpacing: '0.5px',
                fontWeight: 700,
                textShadow: `0 0 6px ${neonYellow}A0, 0 0 12px ${neonYellow}50`,
                lineHeight: 1,
                animation: 'hud-power-pulse 2.5s ease-in-out infinite',
              }}
            >
              {player.score.toLocaleString()}
            </span>
            <span style={{ ...neonText, position: 'relative', zIndex: 1, fontSize: '6px', color: '#8B80A0', lineHeight: 1, letterSpacing: '0.3px' }}>
              最高 {highScore.toLocaleString()}
            </span>
          </div>

          {/* 金币按钮 - 全息 HUD 风格，上icon下数字，点击打开商店 */}
          <button
            onClick={onOpenShop}
            className="flex flex-col items-center justify-center cursor-pointer"
            style={{
              position: 'relative',
              width: '44px',
              height: '44px',
              gap: '2px',
              background: `linear-gradient(180deg, ${neonYellow}22, ${neonYellow}06)`,
              border: `1px solid ${neonYellow}80`,
              borderRadius: '4px',
              boxShadow: `0 0 10px ${neonYellow}30, inset 0 0 8px ${neonYellow}15`,
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}
          >
            {/* 四角 HUD 角标 */}
            <span style={{ position: 'absolute', top: '1px', left: '1px', width: '4px', height: '4px', borderTop: `1px solid ${neonYellow}`, borderLeft: `1px solid ${neonYellow}`, opacity: 0.8 }} />
            <span style={{ position: 'absolute', top: '1px', right: '1px', width: '4px', height: '4px', borderTop: `1px solid ${neonYellow}`, borderRight: `1px solid ${neonYellow}`, opacity: 0.8 }} />
            <span style={{ position: 'absolute', bottom: '1px', left: '1px', width: '4px', height: '4px', borderBottom: `1px solid ${neonYellow}`, borderLeft: `1px solid ${neonYellow}`, opacity: 0.8 }} />
            <span style={{ position: 'absolute', bottom: '1px', right: '1px', width: '4px', height: '4px', borderBottom: `1px solid ${neonYellow}`, borderRight: `1px solid ${neonYellow}`, opacity: 0.8 }} />
            {/* 扫描线 */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: '14px',
                background: `linear-gradient(180deg, transparent, ${neonYellow}30, transparent)`,
                animation: 'hud-scan 3s linear infinite',
                pointerEvents: 'none',
              }}
            />
            {/* 能量核心 */}
            <div
              style={{
                position: 'absolute',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${neonYellow}40 0%, transparent 70%)`,
                animation: 'btn-core-pulse 2.2s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
            <span style={{ position: 'relative', zIndex: 1, fontSize: '15px', filter: `drop-shadow(0 0 4px ${neonYellow}A0)`, animation: 'btn-icon-breathe 2s ease-in-out infinite', lineHeight: 1 }}>💰</span>
            <span style={{ ...neonText, position: 'relative', zIndex: 1, fontSize: '7px', color: neonYellow, lineHeight: 1, fontWeight: 700, textShadow: `0 0 4px ${neonYellow}80` }}>
              {player.gold?.toLocaleString() || 0}
            </span>
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  const neonText: React.CSSProperties = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 600,
    letterSpacing: '0.3px',
  };
  return (
    <>
      <div style={{ ...neonText, fontSize: '7px', color }}>{label}</div>
      <div style={{ ...neonText, fontSize: '7px', color: '#FFFFFF', textAlign: 'right', opacity: 0.9 }}>
        {value}
      </div>
    </>
  );
}

// 性能优化：使用 React.memo 包装，避免 props 引用变化时不必要的重渲染
export const StatusBar = memo(StatusBarImpl);
