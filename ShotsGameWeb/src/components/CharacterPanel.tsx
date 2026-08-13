import { useState, useEffect, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import {
  neonCyan, neonPurple, neonPink, neonYellow, neonGreen,
  neonBlue, neonRed, neonOrange, neonText
} from '../theme/colors';

interface GameEngineRef {
  current: {
    calcPower?: () => number;
  } | null;
}

interface CharacterPanelProps {
  engineRef: GameEngineRef;
}

interface StatItem {
  label: string;
  value: string;
  color: string;
}

// 贴图文件已在素材层面完成背景透明化与边缘羽化，此处直接返回原图
function useKnockoutImage(src: string) {
  const [out, setOut] = useState<string | null>(null);
  useEffect(() => {
    setOut(src);
  }, [src]);
  return out;
}

// 人物形象组件：沿用主界面的 warrior-hero.png 抠图 + 全息效果
function WarriorHeroMini() {
  const knockedOut = useKnockoutImage('/images/warrior-hero.png');

  return (
    <div
      style={{
        position: 'relative',
        width: '78px',
        height: '108px',
        animation: 'hero-breathe 4s ease-in-out infinite',
      }}
    >
      {/* 底部能量投影 */}
      <div
        style={{
          position: 'absolute',
          bottom: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60px',
          height: '14px',
          background: `radial-gradient(ellipse, ${neonCyan}55 0%, ${neonPurple}25 40%, transparent 70%)`,
          filter: 'blur(6px)',
          animation: 'hero-aura 3s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* 能量波纹 */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40px',
          height: '10px',
          borderRadius: '50%',
          border: `1px solid ${neonCyan}`,
          animation: 'energy-ripple 2.5s ease-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {/* 角色容器：径向遮罩 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          WebkitMaskImage: 'radial-gradient(ellipse 52% 82% at 50% 55%, #000 35%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.1) 90%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 52% 82% at 50% 55%, #000 35%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.1) 90%, transparent 100%)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            animation: 'hologram-glitch 8s steps(1) infinite',
          }}
        >
          {knockedOut && (
            <>
              <img
                src={knockedOut}
                alt="未来战士"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center bottom',
                  filter: `brightness(1.08) saturate(1.12) drop-shadow(0 0 8px ${neonBlue}80) drop-shadow(0 0 14px ${neonPurple}50)`,
                  opacity: 0.95,
                }}
              />
              {/* 发光强化层 */}
              <img
                src={knockedOut}
                alt=""
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center bottom',
                  filter: 'brightness(1.3) blur(2px)',
                  opacity: 0.4,
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
        </div>
        {/* 全息扫描线 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '15%',
              right: '15%',
              height: '24px',
              background: `linear-gradient(180deg, transparent, ${neonCyan}30 40%, ${neonCyan}50 50%, ${neonCyan}30 60%, transparent)`,
              animation: 'hero-scan 4s linear infinite',
            }}
          />
        </div>
        {/* 全息网格叠加 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: `linear-gradient(0deg, ${neonCyan}08 1px, transparent 1px)`,
            backgroundSize: '100% 3px',
            mixBlendMode: 'screen',
            opacity: 0.4,
          }}
        />
        {/* 边缘发光脉冲 */}
        <div
          style={{
            position: 'absolute',
            inset: '10px 14px',
            borderRadius: '50%',
            boxShadow: `0 0 16px ${neonCyan}40, inset 0 0 16px ${neonPurple}30`,
            animation: 'aura-pulse 3.5s ease-in-out infinite',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        />
      </div>
      {/* 顶部能量粒子 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
        {Array.from({ length: 4 }).map((_, i) => {
          const left = 25 + i * 22;
          const delay = (i * 0.7) % 3;
          const duration = 3.5 + (i % 3);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${left}%`,
                bottom: '15%',
                width: '1.5px',
                height: '1.5px',
                borderRadius: '50%',
                background: i % 2 === 0 ? neonCyan : neonPink,
                boxShadow: `0 0 3px currentColor`,
                animation: `particle-rise ${duration}s ease-out ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function CharacterPanelImpl({ engineRef }: CharacterPanelProps) {
  // 性能优化：使用细粒度 selector
  const player = useGameStore(s => s.player);
  const profile = useAuthStore(s => s.profile);
  const [power, setPower] = useState(0);

  useEffect(() => {
    const update = () => {
      if (engineRef.current?.calcPower) {
        setPower(engineRef.current.calcPower());
      } else if (player) {
        const p = player as any;
        let v = 0;
        v += (p.attack || 0) * 10;
        v += (1000 / (p.attackSpeed || 1000)) * 15;
        v += (p.maxHealth || 0) * 0.5;
        v += (p.critRate || 0) * 8;
        v += ((p.critDamage || 0) - 100) * 2;
        v += (p.pierceCount || 0) * 30;
        v += (p.lifestealPercent || 0) * 20;
        v += (p.range || 0) * 0.3;
        v += (p.defense || 0) * 5;
        setPower(Math.round(v));
      }
    };
    update();
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, [player, engineRef]);

  if (!player) {
    return (
      <div className="h-full flex items-center justify-center" style={{ ...neonText, color: '#5A5A7A', fontSize: '10px' }}>
        未加载玩家数据
      </div>
    );
  }

  const p = player as any;
  const expPercent = (p.exp / p.expToNextLevel) * 100;
  const healthPercent = (p.health / p.maxHealth) * 100;

  // 属性分组
  const baseStats: StatItem[] = [
    { label: '生命', value: `${Math.ceil(p.health)}/${p.maxHealth}`, color: neonRed },
    { label: '攻击', value: `${p.attack}`, color: neonPink },
    { label: '攻速', value: `${p.attackSpeed}ms`, color: neonCyan },
    { label: '射程', value: `${p.range}`, color: neonGreen },
    { label: '防御', value: `${p.defense || 0}`, color: neonBlue },
    { label: '抗性', value: `${p.resistance || 0}`, color: neonBlue },
  ];

  const critStats: StatItem[] = [
    { label: '暴击率', value: `${(p.critRate || 0).toFixed(1)}%`, color: neonPurple },
    { label: '暴击伤害', value: `${(p.critDamage || 0).toFixed(0)}%`, color: neonPurple },
    { label: '物理穿透', value: `${p.physicalPenetration || 0}`, color: neonYellow },
    { label: '吸血', value: `${(p.lifestealPercent || 0).toFixed(1)}%`, color: '#FF6B9D' },
    { label: '每秒回血', value: `${((p.regenPerSec || 0) * 100).toFixed(1)}%`, color: neonGreen },
    { label: '连发', value: `${p.bulletPierceCount || 0}`, color: neonCyan },
  ];

  const bonusStats: StatItem[] = [
    { label: '金币加成', value: `+${((p.goldBonus || 0) * 100).toFixed(0)}%`, color: neonYellow },
    { label: '经验加成', value: `+${((p.expBonus || 0) * 100).toFixed(0)}%`, color: neonYellow },
    { label: '掉落加成', value: `+${((p.dropBonus || 0) * 100).toFixed(0)}%`, color: neonYellow },
  ];

  const elementStats: StatItem[] = [
    { label: '灼烧', value: `${(p.burnChance || 0).toFixed(0)}%`, color: '#FF6B35' },
    { label: '中毒', value: `${(p.poisonChance || 0).toFixed(0)}%`, color: '#9B59B6' },
    { label: '冰冻', value: `${(p.freezeChance || 0).toFixed(0)}%`, color: '#5BC0EB' },
    { label: '雷电', value: `${(p.lightningChance || 0).toFixed(0)}%`, color: '#FFD700' },
  ];

  return (
    <div
      className="h-full flex flex-col"
      style={{
        padding: '4px 6px',
      }}
    >
      {/* 主体：左右分栏 */}
      <div className="flex gap-2 flex-1 min-h-0">
        {/* 左侧：人物形象 + 等级 + 血量 + 经验 + 战斗力（全息HUD风格） */}
        <div
          className="flex flex-col items-center flex-shrink-0"
          style={{ width: '110px' }}
        >
          {/* 人物形象容器：全息 HUD 切角风格 */}
          <div
            style={{
              width: '90px',
              height: '116px',
              position: 'relative',
              background: 'radial-gradient(ellipse at 50% 40%, rgba(0, 245, 212, 0.06) 0%, rgba(176, 38, 255, 0.03) 60%, transparent 100%)',
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              overflow: 'hidden',
            }}
          >
            <WarriorHeroMini />
            {/* 四角 HUD 标记 */}
            {[
              { top: 0, left: 0, bt: '2px solid', br: 'none', bb: 'none', bl: '2px solid' },
              { top: 0, right: 0, bt: '2px solid', br: '2px solid', bb: 'none', bl: 'none' },
              { bottom: 0, left: 0, bt: 'none', br: 'none', bb: '2px solid', bl: '2px solid' },
              { bottom: 0, right: 0, bt: 'none', br: '2px solid', bb: '2px solid', bl: 'none' },
            ].map((c, i) => (
              <div key={i} style={{
                position: 'absolute', width: '6px', height: '6px',
                top: c.top, left: c.left, right: c.right, bottom: c.bottom,
                borderTop: c.bt as any, borderRight: c.br as any,
                borderBottom: c.bb as any, borderLeft: c.bl as any,
                borderColor: neonCyan + '60',
                pointerEvents: 'none',
              }} />
            ))}
          </div>

          {/* 玩家身份信息：昵称 + ID */}
          {profile && (
            <div
              className="flex flex-col items-center"
              style={{
                width: '90px',
                marginTop: '4px',
                padding: '2px 4px',
                background: 'linear-gradient(135deg, rgba(176, 38, 255, 0.12), rgba(0, 245, 212, 0.08))',
                border: `0.5px solid ${neonPurple}40`,
                borderRadius: '4px',
                clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
                gap: '1px',
              }}
            >
              <span
                style={{
                  ...neonText,
                  fontSize: '9px',
                  fontWeight: 700,
                  color: neonCyan,
                  textShadow: `0 0 4px ${neonCyan}80`,
                  letterSpacing: '0.5px',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={profile.displayName}
              >
                {profile.displayName}
              </span>
              <span
                style={{
                  ...neonText,
                  fontSize: '6px',
                  color: '#8B80A0',
                  letterSpacing: '0.5px',
                }}
              >
                ID {profile.id.slice(0, 8)}
              </span>
            </div>
          )}

          {/* 等级：全息 HUD 标签 */}
          <div
            style={{
              ...neonText,
              marginTop: '4px',
              padding: '2px 10px',
              background: 'linear-gradient(135deg, rgba(176, 38, 255, 0.2), rgba(0, 245, 212, 0.15))',
              border: `1px solid ${neonPurple}50`,
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              color: neonCyan,
              textShadow: `0 0 6px ${neonCyan}80`,
              letterSpacing: '1px',
              clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
              position: 'relative',
            }}
          >
            Lv.{p.level}
          </div>

          {/* 生命条：全息 HUD 风格 */}
          <div style={{ width: '90px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
              <span style={{ ...neonText, fontSize: '6px', color: neonPink, letterSpacing: '1px' }}>HP</span>
              <span style={{ ...neonText, fontSize: '6px', color: '#8B80A0' }}>{Math.ceil(p.health)}/{p.maxHealth}</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '5px',
                background: 'rgba(13, 11, 26, 0.9)',
                border: `0.5px solid ${neonPink}40`,
                borderRadius: '2px',
                position: 'relative',
                overflow: 'hidden',
                clipPath: 'polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${healthPercent}%`,
                  background: `linear-gradient(90deg, ${neonPink}, ${neonRed})`,
                  boxShadow: `0 0 4px ${neonPink}80`,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>

          {/* 经验条：全息 HUD 风格 */}
          <div style={{ width: '90px', marginTop: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
              <span style={{ ...neonText, fontSize: '6px', color: neonYellow, letterSpacing: '1px' }}>EXP</span>
              <span style={{ ...neonText, fontSize: '6px', color: '#8B80A0' }}>{p.exp}/{p.expToNextLevel}</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '5px',
                background: 'rgba(13, 11, 26, 0.9)',
                border: `0.5px solid ${neonYellow}40`,
                borderRadius: '2px',
                position: 'relative',
                overflow: 'hidden',
                clipPath: 'polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${expPercent}%`,
                  background: `linear-gradient(90deg, ${neonYellow}, #FFE600)`,
                  boxShadow: `0 0 4px ${neonYellow}80`,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>

          {/* 战斗力：全息 HUD 风格 */}
          <div
            style={{
              marginTop: '5px',
              padding: '2px 10px',
              background: 'linear-gradient(135deg, rgba(255, 230, 0, 0.15), rgba(0, 245, 212, 0.1))',
              border: `1px solid ${neonYellow}50`,
              borderRadius: '4px',
              clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <span style={{ fontSize: '7px', filter: `drop-shadow(0 0 2px ${neonYellow})` }}>⚡</span>
            <span style={{ ...neonText, fontSize: '9px', color: neonYellow, fontWeight: 700, textShadow: `0 0 4px ${neonYellow}80`, letterSpacing: '0.5px' }}>
              {power}
            </span>
          </div>
        </div>

        {/* 竖线分隔符 */}
        <div
          aria-hidden
          style={{
            width: '1px',
            background: 'linear-gradient(to bottom, rgba(176, 38, 255, 0.05), rgba(176, 38, 255, 0.5) 20%, rgba(0, 245, 212, 0.4) 80%, rgba(0, 245, 212, 0.05))',
            flexShrink: 0,
          }}
        />

        {/* 右侧：属性列表 */}
        <div className="flex flex-col flex-1 min-w-0 overflow-y-auto" style={{ gap: '4px', paddingRight: '2px' }}>
          <StatSection title="基础属性" color={neonCyan} stats={baseStats} />
          <StatSection title="战斗属性" color={neonPink} stats={critStats} />
          <StatSection title="元素属性" color={neonOrange} stats={elementStats} />
          <StatSection title="加成属性" color={neonYellow} stats={bonusStats} />
        </div>
      </div>
    </div>
  );
}

function StatSection({ title, color, stats }: { title: string; color: string; stats: StatItem[] }) {
  return (
    <div
      style={{
        padding: '3px 5px',
        background: 'rgba(13, 11, 26, 0.5)',
        border: `1px solid ${color}25`,
        borderRadius: '4px',
      }}
    >
      <div
        style={{
          ...neonText,
          fontSize: '7px',
          color,
          fontWeight: 700,
          letterSpacing: '1px',
          marginBottom: '2px',
          textShadow: `0 0 4px ${color}60`,
        }}
      >
        ✦ {title}
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {stats.map((s) => (
          <div key={s.label} className="flex justify-between" style={{ lineHeight: 1.2 }}>
            <span style={{ ...neonText, fontSize: '7px', color: s.color }}>{s.label}</span>
            <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF', opacity: 0.9 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 性能优化：memo 包装
export const CharacterPanel = memo(CharacterPanelImpl);
