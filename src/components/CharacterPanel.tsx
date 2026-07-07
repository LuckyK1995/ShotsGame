import { useState, useEffect, memo } from 'react';
import { useGameStore } from '../store/gameStore';
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

function CharacterPanelImpl({ engineRef }: CharacterPanelProps) {
  // 性能优化：使用细粒度 selector
  const player = useGameStore(s => s.player);
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
    { label: '磁力范围', value: `+${p.magnetRangeBonus || 0}`, color: neonCyan },
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
        {/* 左侧：人物形象 + 等级 + 战斗力 */}
        <div
          className="flex flex-col items-center flex-shrink-0"
          style={{ width: '110px' }}
        >
          {/* 人物形象 */}
          <div
            className="flex items-center justify-center"
            style={{
              width: '90px',
              height: '120px',
              background: 'radial-gradient(circle at 50% 40%, rgba(0, 245, 212, 0.08) 0%, rgba(176, 38, 255, 0.04) 60%, transparent 100%)',
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <WarriorMini />
            {/* 背景光晕 */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 70%, rgba(79, 172, 254, 0.12), transparent 60%)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* 等级 */}
          <div
            className="flex items-center justify-center"
            style={{
              ...neonText,
              marginTop: '4px',
              padding: '2px 8px',
              background: 'linear-gradient(90deg, rgba(176, 38, 255, 0.25), rgba(79, 172, 254, 0.25))',
              border: `1px solid ${neonPurple}60`,
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              color: neonPurple,
              textShadow: `0 0 6px ${neonPurple}80`,
              letterSpacing: '0.5px',
            }}
          >
            Lv.{p.level}
          </div>

          {/* 经验条 */}
          <div
            style={{
              width: '90px',
              height: '6px',
              marginTop: '3px',
              background: 'rgba(13, 11, 26, 0.8)',
              border: '0.5px solid rgba(255, 230, 0, 0.3)',
              borderRadius: '3px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: `${expPercent}%`,
                background: 'linear-gradient(90deg, #FFD60A, #FFE600)',
                boxShadow: `0 0 4px ${neonYellow}80`,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <div style={{ ...neonText, fontSize: '6px', color: '#8B80A0', marginTop: '1px', lineHeight: 1 }}>
            {p.exp} / {p.expToNextLevel}
          </div>

          {/* 生命条 */}
          <div
            style={{
              width: '90px',
              height: '6px',
              marginTop: '3px',
              background: 'rgba(13, 11, 26, 0.8)',
              border: '0.5px solid rgba(255, 45, 85, 0.3)',
              borderRadius: '3px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: `${healthPercent}%`,
                background: 'linear-gradient(90deg, #FF2D55, #FF0080)',
                boxShadow: `0 0 4px ${neonPink}80`,
                transition: 'width 0.3s',
              }}
            />
          </div>

          {/* 战斗力 */}
          <div
            className="flex items-center justify-center gap-1"
            style={{
              marginTop: '4px',
              padding: '2px 8px',
              background: 'rgba(255, 230, 0, 0.12)',
              border: `1px solid ${neonYellow}50`,
              borderRadius: '4px',
            }}
          >
            <span style={{ fontSize: '8px', filter: `drop-shadow(0 0 2px ${neonYellow})` }}>⚡</span>
            <span style={{ ...neonText, fontSize: '10px', color: neonYellow, fontWeight: 700, textShadow: `0 0 4px ${neonYellow}80` }}>
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

// 迷你未来战士 SVG - 用于人物面板
function WarriorMini() {
  return (
    <svg
      width="78"
      height="108"
      viewBox="0 0 160 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: 'drop-shadow(0 0 6px rgba(79, 172, 254, 0.5))',
      }}
    >
      <defs>
        <linearGradient id="miniArmor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4FACFE" />
          <stop offset="50%" stopColor="#2E7BC8" />
          <stop offset="100%" stopColor="#1A4A8A" />
        </linearGradient>
        <linearGradient id="miniGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE600" />
          <stop offset="100%" stopColor="#C9A300" />
        </linearGradient>
        <radialGradient id="miniCore" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={neonCyan} />
          <stop offset="100%" stopColor={neonCyan} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 喷气背包 */}
      <path d="M55,100 L48,140 L52,210 L58,210 L62,140 Z" fill="url(#miniArmor)" stroke={neonBlue} strokeWidth="1" />
      <path d="M105,100 L112,140 L108,210 L102,210 L98,140 Z" fill="url(#miniArmor)" stroke={neonBlue} strokeWidth="1" />
      <ellipse cx="50" cy="200" rx="4" ry="10" fill={neonCyan} opacity="0.7" />
      <ellipse cx="110" cy="200" rx="4" ry="10" fill={neonCyan} opacity="0.7" />

      {/* 身体装甲 */}
      <path
        d="M58,95 Q55,90 60,85 L65,78 L72,76 L88,76 L95,78 L100,85 Q105,90 102,95 L100,130 Q98,140 90,142 L70,142 Q62,140 60,130 Z"
        fill="url(#miniArmor)"
        stroke={neonBlue}
        strokeWidth="1.2"
      />
      <path d="M68,90 L80,100 L92,90" stroke="url(#miniGold)" strokeWidth="1.5" fill="none" />
      <path d="M72,110 L88,110" stroke="url(#miniGold)" strokeWidth="1" fill="none" />

      {/* 能量核心 */}
      <circle cx="80" cy="108" r="5" fill="url(#miniCore)" />
      <circle cx="80" cy="108" r="2" fill={neonCyan} />

      {/* 肩甲 */}
      <ellipse cx="55" cy="92" rx="9" ry="7" fill="url(#miniArmor)" stroke={neonBlue} strokeWidth="1" />
      <ellipse cx="105" cy="92" rx="9" ry="7" fill="url(#miniArmor)" stroke={neonBlue} strokeWidth="1" />

      {/* 手臂 */}
      <path d="M50,96 L42,120 L40,138 L46,140 L50,120 Z" fill="url(#miniArmor)" stroke={neonBlue} strokeWidth="0.8" />
      <path d="M110,96 L118,120 L120,138 L114,140 L110,120 Z" fill="url(#miniArmor)" stroke={neonBlue} strokeWidth="0.8" />

      {/* 腰带 */}
      <rect x="64" y="138" width="32" height="5" fill="url(#miniGold)" stroke="#8B6A00" strokeWidth="0.5" />

      {/* 腿部 */}
      <path d="M65,143 L60,185 L58,210 L66,210 L72,185 L74,143 Z" fill="url(#miniArmor)" stroke={neonBlue} strokeWidth="0.8" />
      <path d="M86,143 L84,185 L88,210 L94,210 L95,185 Z" fill="url(#miniArmor)" stroke={neonBlue} strokeWidth="0.8" />

      {/* 头盔 */}
      <path
        d="M80,52 Q66,52 64,64 L64,78 Q64,88 72,94 L80,96 L88,94 Q96,88 96,78 L96,64 Q94,52 80,52 Z"
        fill="url(#miniArmor)"
        stroke={neonBlue}
        strokeWidth="1.2"
      />
      <path d="M68,58 Q80,54 92,58" stroke="url(#miniGold)" strokeWidth="1" fill="none" />
      <rect x="68" y="68" width="24" height="6" rx="1" fill="#0A0814" opacity="0.9" />
      <rect x="70" y="69" width="8" height="4" fill={neonCyan} opacity="0.85" />
      <rect x="82" y="69" width="8" height="4" fill={neonCyan} opacity="0.85" />
      <line x1="80" y1="52" x2="80" y2="46" stroke={neonCyan} strokeWidth="1" />
      <circle cx="80" cy="45" r="1.5" fill={neonCyan} />
    </svg>
  );
}

// 性能优化：memo 包装
export const CharacterPanel = memo(CharacterPanelImpl);
