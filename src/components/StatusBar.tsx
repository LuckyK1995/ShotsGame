import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

interface StatusBarProps {
  onOpenShop?: () => void;
  engineRef?: {
    current: {
      getItemCooldowns?: () => { key: string; remaining: number; duration: number; icon: string; name: string; itemId: string }[];
      calcPower?: () => number;
    } | null;
  };
}

export function StatusBar({ onOpenShop, engineRef }: StatusBarProps) {
  const { gameState, player } = useGameStore();
  const [showStats, setShowStats] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [itemCooldowns, setItemCooldowns] = useState<{ key: string; remaining: number; duration: number; icon: string; name: string; itemId: string }[]>([]);
  const flashRef = useRef<Record<string, boolean>>({});

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

  const neonCyan = '#00F5D4';
  const neonPurple = '#B026FF';
  const neonPink = '#FF0080';
  const neonYellow = '#FFE600';

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
              const isEliteOrBossWave = gameState.currentWave % 5 === 0;
              const isBossWave = gameState.currentWave % 8 === 0;
              // 精英/BOSS已生成且只剩1只时显示来袭文字
              if (isEliteOrBossWave && remaining === 1) {
                return (
                  <span style={{ ...neonText, fontSize: '8px', color: isBossWave ? '#FF3B3B' : '#FFE600', fontWeight: 700, textShadow: `0 0 4px ${isBossWave ? '#FF3B3B' : '#FFE600'}80` }}>
                    {isBossWave ? 'BOSS来袭！' : '精英来袭！'}
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

          {/* 物品冷却状态栏 */}
          <div className="flex gap-1.5" style={{ minHeight: '22px' }}>
            {itemCooldowns.map((item) => {
              const cdPercent = 1 - item.remaining / item.duration;
              return (
                <div
                  key={item.key}
                  className="relative flex items-center justify-center flex-shrink-0"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: 'rgba(19, 16, 37, 0.9)',
                    border: '1px solid rgba(255, 230, 0, 0.4)',
                    boxShadow: flashRef.current[item.key]
                      ? `0 0 8px ${neonYellow}, 0 0 15px ${neonYellow}80`
                      : `0 0 3px ${neonYellow}30`,
                    transition: 'box-shadow 0.15s ease-out',
                    overflow: 'hidden',
                  }}
                  title={`${item.name} (${(item.remaining / 1000).toFixed(1)}s)`}
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
                      filter: `grayscale(${1 - cdPercent}) brightness(${0.3 + cdPercent * 0.7})`,
                      transition: 'filter 0.1s linear',
                    }}
                  >
                    <span style={{ fontSize: '10px' }}>{item.icon}</span>
                  </div>
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
                </div>
              );
            })}
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
