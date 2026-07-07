import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getItemDef, getPotionEffectText } from '../game/data/equipment';
import { neonCyan, neonPurple, neonPink, neonYellow } from '../theme/colors';
import { memo } from 'react';

interface StatusBarProps {
  onOpenShop?: () => void;
  engineRef?: {
    current: {
      getItemCooldowns?: () => { key: string; remaining: number; duration: number; icon: string; name: string; itemId: string }[];
      getActivePotionEffects?: () => { key: string; remaining: number; duration: number; icon: string; name: string; itemId: string; isWave: boolean }[];
      calcPower?: () => number;
    } | null;
  };
}

function StatusBarImpl({ onOpenShop, engineRef }: StatusBarProps) {
  // 性能优化：使用细粒度 selector 订阅，避免任意 state 变化触发重渲染
  const gameState = useGameStore(s => s.gameState);
  const player = useGameStore(s => s.player);
  const [showStats, setShowStats] = useState(false);
  const [highScore, setHighScore] = useState(0);
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
    }, 50);
    return () => clearInterval(interval);
  }, [engineRef, itemCooldowns]);

  if (!gameState || !player) return null;

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
    <div className="absolute top-0 left-0 right-0 p-2 z-10 pointer-events-none select-none">
      <div className="flex items-start gap-2">
        {/* 左侧：波次/等级/属性 */}
        <div className="flex flex-col gap-1.5 pointer-events-auto" style={{ width: '130px' }}>

          {/* 关卡框 */}
          <div
            className="flex flex-col items-center justify-center"
            style={{ ...cardStyle, width: '80px', height: '50px', padding: '2px 0' }}
          >
            <span style={{ ...neonText, fontSize: '11px', color: neonCyan, letterSpacing: '0.5px' }}>
              第{gameState.currentWave}波
            </span>
            {(() => {
              const remaining = gameState.waveEnemiesRemaining;
              const total = gameState.waveEnemiesTotal || 50;
              // 精英/BOSS出场时（showEliteBossNotice）显示来袭文字
              if (gameState.showEliteBossNotice) {
                const isBoss = gameState.eliteBossNoticeType === 'boss';
                return (
                  <span style={{ ...neonText, fontSize: '8px', color: isBoss ? '#FF3B3B' : '#FFE600', fontWeight: 700, textShadow: `0 0 4px ${isBoss ? '#FF3B3B' : '#FFE600'}80` }}>
                    {isBoss ? 'BOSS来袭！' : '精英来袭！'}
                  </span>
                );
              }
              return (
                <span style={{ ...neonText, fontSize: '8px', color: '#8B80A0' }}>
                  {remaining}/{total}
                </span>
              );
            })()}
          </div>

          {/* 等级 + 属性 */}
          <div className="flex gap-1.5" style={{ marginTop: '10px' }}>
            <div
              className="flex items-center justify-center flex-1"
              style={{ ...cardStyle, height: '22px' }}
            >
              <span style={{ ...neonText, fontSize: '9px', color: neonPurple, fontWeight: 700 }}>
                Lv.{player.level}
              </span>
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center justify-center gap-1 cursor-pointer flex-1"
              style={{
                ...cardStyle,
                height: '22px',
                background: showStats ? 'rgba(255, 230, 0, 0.15)' : cardStyle.background,
                border: `1px solid ${showStats ? neonYellow : 'rgba(176, 38, 255, 0.25)'}`,
                boxShadow: showStats ? `0 0 8px ${neonYellow}50` : cardStyle.boxShadow,
              }}
            >
              <span style={{ fontSize: '9px', filter: `drop-shadow(0 0 2px ${neonYellow}80)` }}>⚡</span>
              <span style={{ ...neonText, fontSize: '9px', color: neonYellow, fontWeight: 700 }}>
                {power}
              </span>
            </button>
          </div>

          {/* HP Bar */}
          <div
            style={{
              ...cardStyle,
              height: '16px',
              position: 'relative',
              padding: '2px',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '2px',
                top: '2px',
                width: `calc(${healthPercent}% - 4px)`,
                height: '12px',
                background: `linear-gradient(90deg, #FF2D55 0%, ${neonPink} 100%)`,
                borderRadius: '6px',
                boxShadow: `0 0 6px ${neonPink}60`,
                transition: 'width 0.25s ease-out',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <span style={{ ...neonText, fontSize: '7px', color: '#FF2D55', fontWeight: 700 }}>生命</span>
              <span style={{ ...neonText, fontSize: '6px', color: '#FFFFFF', opacity: 0.9 }}>
                {Math.ceil(player.health)}/{player.maxHealth}
              </span>
            </div>
          </div>

          {/* EXP Bar */}
          <div
            style={{
              ...cardStyle,
              height: '12px',
              position: 'relative',
              padding: '2px',
              borderRadius: '6px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '2px',
                top: '2px',
                width: `calc(${expPercent}% - 4px)`,
                height: '8px',
                background: `linear-gradient(90deg, #FFD60A 0%, ${neonYellow} 100%)`,
                borderRadius: '4px',
                boxShadow: `0 0 4px ${neonYellow}50`,
                transition: 'width 0.35s ease-out',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <span style={{ ...neonText, fontSize: '6px', color: '#FFD60A', fontWeight: 700 }}>经验</span>
              <span style={{ ...neonText, fontSize: '5px', color: '#FFFFFF', opacity: 0.8 }}>
                {player.exp}/{player.expToNextLevel}
              </span>
            </div>
          </div>

          {/* 药水/技能持续时间倒计时栏（优先显示生效中，其次显示冷却中） */}
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
                  background: 'rgba(13, 11, 26, 0.95)',
                  border: `1px solid ${potionInfo.isWave ? 'rgba(0, 245, 212, 0.5)' : 'rgba(255, 230, 0, 0.5)'}`,
                  borderRadius: '8px',
                  boxShadow: `0 0 12px ${potionInfo.isWave ? 'rgba(0, 245, 212, 0.3)' : 'rgba(255, 230, 0, 0.3)'}, 0 4px 12px rgba(0,0,0,0.5)`,
                  backdropFilter: 'blur(8px)',
                  padding: '8px 10px',
                  minWidth: '180px',
                  maxWidth: '240px',
                  animation: 'potionInfoIn 0.15s ease-out',
                  pointerEvents: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
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
                {/* keyframes 已提取至 index.css */}
              </div>
            )}
          </div>

          {/* 属性面板 - 显示人物所有属性 */}
          {showStats && (
            <div
              style={{
                ...cardStyle,
                minWidth: '240px',
                maxWidth: '280px',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '8px 10px',
                marginTop: '4px',
              }}
            >
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
          )}
        </div>

        {/* 中间占位 */}
        <div className="flex-1" />

        {/* 右侧：分数 + 金币 */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* 分数框 - 上下布局，上当前分，下历史最高 */}
          <div
            className="flex flex-col items-center justify-center"
            style={{
              ...cardStyle,
              width: '100px',
              height: '44px',
              border: `1px solid ${neonPurple}40`,
              boxShadow: `0 0 10px ${neonPurple}20, inset 0 1px 0 rgba(255,255,255,0.05)`,
              gap: '2px',
              padding: '4px 0',
            }}
          >
            <span
              style={{
                ...neonText,
                fontSize: '11px',
                color: neonYellow,
                letterSpacing: '0.5px',
                textShadow: `0 0 6px ${neonYellow}60`,
                lineHeight: 1,
              }}
            >
              {player.score.toLocaleString()}
            </span>
            <span style={{ ...neonText, fontSize: '6px', color: '#8B80A0', lineHeight: 1 }}>
              最高 {highScore.toLocaleString()}
            </span>
          </div>

          {/* 金币按钮 - 正方形，上icon下数字，点击打开商店 */}
          <button
            onClick={onOpenShop}
            className="flex flex-col items-center justify-center cursor-pointer"
            style={{
              ...cardStyle,
              width: '40px',
              height: '40px',
              border: `1px solid ${neonYellow}50`,
              boxShadow: `0 0 8px ${neonYellow}20`,
              background: 'rgba(19, 16, 37, 0.9)',
              gap: '2px',
            }}
          >
            <span style={{ fontSize: '14px', filter: 'drop-shadow(0 0 4px #FFD70090)' }}>💰</span>
            <span style={{ ...neonText, fontSize: '7px', color: neonYellow, lineHeight: 1 }}>
              {player.gold?.toLocaleString() || 0}
            </span>
          </button>
        </div>
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
