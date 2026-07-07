import { useState } from 'react';
import {
  StageIcon, WorldBossIcon, PurgatoryIcon, DailyIcon,
  MaterialIcon, MirrorIcon, GuardIcon, HomeDefenseIcon,
} from './ButtonIcons';
import {
  neonCyan, neonPurple, neonPink, neonYellow,
  neonGreen, neonBlue, neonOrange, neonRed
} from '../theme/colors';

interface MainMenuProps {
  onEnterStage: () => void;
}

interface ModeButton {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; color?: string; active?: boolean }>;
  color: string;
  unlocked: boolean;
}

const MODES: ModeButton[] = [
  { id: 'stage', label: '关卡挑战', desc: '挑战无尽波次', icon: StageIcon, color: neonGreen, unlocked: true },
  { id: 'worldboss', label: '世界BOSS', desc: '集结讨伐强敌', icon: WorldBossIcon, color: neonRed, unlocked: false },
  { id: 'purgatory', label: '炼狱', desc: '极限生存挑战', icon: PurgatoryIcon, color: neonOrange, unlocked: false },
  { id: 'daily', label: '日常挑战', desc: '每日限定任务', icon: DailyIcon, color: neonYellow, unlocked: false },
  { id: 'material', label: '材料副本', desc: '收集稀有材料', icon: MaterialIcon, color: neonPurple, unlocked: false },
  { id: 'mirror', label: '镜像挑战', desc: '挑战自我镜像', icon: MirrorIcon, color: neonBlue, unlocked: false },
  { id: 'guard', label: '守卫战', desc: '坚守阵地', icon: GuardIcon, color: neonCyan, unlocked: false },
  { id: 'homedefense', label: '家园守卫', desc: '守护最后家园', icon: HomeDefenseIcon, color: neonGreen, unlocked: false },
];

export function MainMenu({ onEnterStage }: MainMenuProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const neonText: React.CSSProperties = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 700,
    letterSpacing: '1px',
  };

  const handleModeClick = (mode: ModeButton) => {
    if (mode.unlocked) {
      onEnterStage();
    } else {
      setToast(`【${mode.label}】即将开放，敬请期待`);
      setTimeout(() => setToast(null), 1800);
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0A0814 0%, #13102A 40%, #1A0E2E 70%, #0D0B1A 100%)',
      }}
    >
      {/* 背景星空 */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.7 }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const x = (i * 37 + 13) % 100;
          const y = (i * 23 + 7) % 70;
          const size = (i % 3) * 0.8 + 0.6;
          const opacity = (i % 5) * 0.15 + 0.25;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: i % 4 === 0 ? neonCyan : i % 4 === 1 ? neonPurple : '#FFFFFF',
                opacity,
                boxShadow: `0 0 ${size * 2}px currentColor`,
                animation: `twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* 背景城市剪影 */}
      <svg
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{ height: '32%', opacity: 0.5 }}
        viewBox="0 0 430 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={neonPurple} stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0A0814" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path
          d="M0,200 L0,140 L20,140 L20,100 L40,100 L40,130 L60,130 L60,80 L75,80 L75,60 L85,60 L85,80 L100,80 L100,110 L120,110 L120,70 L135,70 L135,90 L150,90 L150,50 L165,50 L165,75 L180,75 L180,100 L200,100 L200,65 L215,65 L215,40 L225,40 L225,65 L240,65 L240,95 L260,95 L260,55 L275,55 L275,85 L295,85 L295,110 L315,110 L315,70 L330,70 L330,95 L350,95 L350,60 L365,60 L365,85 L380,85 L380,115 L400,115 L400,90 L415,90 L415,130 L430,130 L430,200 Z"
          fill="url(#cityGrad)"
        />
        {/* 窗户灯光 */}
        <g fill={neonCyan} opacity="0.5">
          {Array.from({ length: 30 }).map((_, i) => {
            const x = (i * 43 + 11) % 425 + 5;
            const y = ((i * 17 + 5) % 60) + 70;
            return <rect key={i} x={x} y={y} width="1.5" height="1.5" />;
          })}
        </g>
        <g fill={neonPink} opacity="0.35">
          {Array.from({ length: 12 }).map((_, i) => {
            const x = (i * 61 + 23) % 425 + 5;
            const y = ((i * 29 + 11) % 50) + 80;
            return <rect key={i} x={x} y={y} width="1.5" height="1.5" />;
          })}
        </g>
      </svg>

      {/* 顶部标题 */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{ top: '5%' }}
      >
        <div
          style={{
            ...neonText,
            fontSize: '11px',
            color: neonPurple,
            letterSpacing: '8px',
            marginBottom: '2px',
            textShadow: `0 0 8px ${neonPurple}80`,
            opacity: 0.85,
          }}
        >
          WASTELAND
        </div>
        <div
          style={{
            ...neonText,
            fontSize: '32px',
            color: neonCyan,
            letterSpacing: '4px',
            textShadow: `0 0 12px ${neonCyan}80, 0 0 24px ${neonCyan}40`,
            lineHeight: 1,
          }}
        >
          末日突围
        </div>
        <div
          style={{
            ...neonText,
            fontSize: '7px',
            color: '#8B80A0',
            letterSpacing: '3px',
            marginTop: '3px',
          }}
        >
          ── SHOTS GAME ──
        </div>
      </div>

      {/* 中央人物形象 - 未来战士 */}
      <div
        className="absolute left-1/2 pointer-events-none"
        style={{
          top: '20%',
          transform: 'translateX(-50%)',
          width: '160px',
          height: '240px',
        }}
      >
        <WarriorSilhouette />
      </div>

      {/* 底部模式按钮区 */}
      <div
        className="absolute left-0 right-0"
        style={{ bottom: '4%' }}
      >
        <div
          className="grid mx-auto"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            padding: '0 12px',
            maxWidth: '430px',
          }}
        >
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isHover = hoverId === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeClick(mode)}
                onMouseEnter={() => setHoverId(mode.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '8px 4px 6px',
                  background: isHover && mode.unlocked
                    ? `linear-gradient(180deg, ${mode.color}25, ${mode.color}08)`
                    : 'rgba(19, 16, 37, 0.7)',
                  border: `1px solid ${isHover && mode.unlocked ? mode.color : 'rgba(100,100,130,0.25)'}`,
                  borderRadius: '8px',
                  cursor: mode.unlocked ? 'pointer' : 'not-allowed',
                  position: 'relative',
                  opacity: mode.unlocked ? 1 : 0.5,
                  boxShadow: isHover && mode.unlocked ? `0 0 14px ${mode.color}40` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ opacity: mode.unlocked ? 1 : 0.6 }}>
                  <Icon size={26} color={mode.color} active={isHover} />
                </div>
                <div
                  style={{
                    ...neonText,
                    fontSize: '8px',
                    color: mode.unlocked ? mode.color : '#6A6A80',
                    textShadow: isHover && mode.unlocked ? `0 0 6px ${mode.color}80` : 'none',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                  }}
                >
                  {mode.label}
                </div>
                {!mode.unlocked && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '3px',
                      fontSize: '8px',
                      opacity: 0.8,
                    }}
                  >
                    🔒
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 提示 toast */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            ...neonText,
            fontSize: '11px',
            color: neonYellow,
            padding: '8px 18px',
            background: 'rgba(10, 8, 20, 0.92)',
            border: `1px solid ${neonYellow}50`,
            borderRadius: '8px',
            boxShadow: `0 0 20px ${neonYellow}40`,
            textShadow: `0 0 8px ${neonYellow}`,
            pointerEvents: 'none',
            zIndex: 60,
            whiteSpace: 'nowrap',
          }}
        >
          {toast}
        </div>
      )}

      {/* 闪烁动画样式：keyframes 已提取至 index.css */}
    </div>
  );
}

// 未来战士剪影 - 蓝金色，带喷气式背包
function WarriorSilhouette() {
  return (
    <svg
      width="160"
      height="240"
      viewBox="0 0 160 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        animation: 'float 3.5s ease-in-out infinite',
        filter: `drop-shadow(0 0 12px ${neonBlue}60) drop-shadow(0 0 20px ${neonPurple}40)`,
      }}
    >
      <defs>
        <linearGradient id="armorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4FACFE" />
          <stop offset="50%" stopColor="#2E7BC8" />
          <stop offset="100%" stopColor="#1A4A8A" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE600" />
          <stop offset="100%" stopColor="#C9A300" />
        </linearGradient>
        <linearGradient id="jetGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={neonCyan} />
          <stop offset="60%" stopColor={neonBlue} />
          <stop offset="100%" stopColor={neonPurple} stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="coreGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={neonCyan} stopOpacity="1" />
          <stop offset="100%" stopColor={neonCyan} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 喷气尾焰 */}
      <ellipse cx="45" cy="220" rx="14" ry="22" fill="url(#jetGrad)" opacity="0.6" style={{ animation: 'glow-pulse 0.8s ease-in-out infinite' }} />
      <ellipse cx="115" cy="220" rx="14" ry="22" fill="url(#jetGrad)" opacity="0.6" style={{ animation: 'glow-pulse 0.8s ease-in-out infinite 0.4s' }} />
      <ellipse cx="45" cy="215" rx="6" ry="14" fill={neonCyan} opacity="0.85" />
      <ellipse cx="115" cy="215" rx="6" ry="14" fill={neonCyan} opacity="0.85" />

      {/* 喷气背包 */}
      <path d="M55,100 L48,140 L52,210 L58,210 L62,140 Z" fill="url(#armorGrad)" stroke={neonBlue} strokeWidth="1" />
      <path d="M105,100 L112,140 L108,210 L102,210 L98,140 Z" fill="url(#armorGrad)" stroke={neonBlue} strokeWidth="1" />
      {/* 背包能量管 */}
      <line x1="50" y1="115" x2="50" y2="180" stroke={neonCyan} strokeWidth="1.2" opacity="0.9" />
      <line x1="110" y1="115" x2="110" y2="180" stroke={neonCyan} strokeWidth="1.2" opacity="0.9" />

      {/* 身体装甲 */}
      <path
        d="M58,95 Q55,90 60,85 L65,78 L72,76 L88,76 L95,78 L100,85 Q105,90 102,95 L100,130 Q98,140 90,142 L70,142 Q62,140 60,130 Z"
        fill="url(#armorGrad)"
        stroke={neonBlue}
        strokeWidth="1.2"
      />
      {/* 胸甲金色线条 */}
      <path d="M68,90 L80,100 L92,90" stroke="url(#goldGrad)" strokeWidth="1.5" fill="none" />
      <path d="M72,110 L88,110" stroke="url(#goldGrad)" strokeWidth="1" fill="none" />
      <path d="M74,120 L86,120" stroke="url(#goldGrad)" strokeWidth="0.8" fill="none" opacity="0.7" />

      {/* 胸口能量核心 */}
      <circle cx="80" cy="108" r="6" fill="url(#coreGlow)" />
      <circle cx="80" cy="108" r="2.5" fill={neonCyan} style={{ animation: 'glow-pulse 1.2s ease-in-out infinite' }} />

      {/* 肩甲 */}
      <ellipse cx="55" cy="92" rx="9" ry="7" fill="url(#armorGrad)" stroke={neonBlue} strokeWidth="1" />
      <ellipse cx="105" cy="92" rx="9" ry="7" fill="url(#armorGrad)" stroke={neonBlue} strokeWidth="1" />
      {/* 肩甲金边 */}
      <path d="M48,90 Q55,86 62,90" stroke="url(#goldGrad)" strokeWidth="1" fill="none" />
      <path d="M98,90 Q105,86 112,90" stroke="url(#goldGrad)" strokeWidth="1" fill="none" />

      {/* 手臂 */}
      <path d="M50,96 L42,120 L40,138 L46,140 L50,120 Z" fill="url(#armorGrad)" stroke={neonBlue} strokeWidth="0.8" />
      <path d="M110,96 L118,120 L120,138 L114,140 L110,120 Z" fill="url(#armorGrad)" stroke={neonBlue} strokeWidth="0.8" />
      {/* 手套金色 */}
      <rect x="40" y="138" width="8" height="6" rx="1" fill="url(#goldGrad)" />
      <rect x="112" y="138" width="8" height="6" rx="1" fill="url(#goldGrad)" />

      {/* 腰带 */}
      <rect x="64" y="138" width="32" height="5" fill="url(#goldGrad)" stroke="#8B6A00" strokeWidth="0.5" />
      <circle cx="80" cy="140.5" r="1.5" fill={neonCyan} />

      {/* 腿部 */}
      <path d="M65,143 L60,185 L58,210 L66,210 L72,185 L74,143 Z" fill="url(#armorGrad)" stroke={neonBlue} strokeWidth="0.8" />
      <path d="M86,143 L84,185 L88,210 L94,210 L95,185 Z" fill="url(#armorGrad)" stroke={neonBlue} strokeWidth="0.8" />
      {/* 腿甲金线 */}
      <line x1="68" y1="155" x2="68" y2="180" stroke="url(#goldGrad)" strokeWidth="0.8" opacity="0.7" />
      <line x1="90" y1="155" x2="90" y2="180" stroke="url(#goldGrad)" strokeWidth="0.8" opacity="0.7" />

      {/* 靴子 */}
      <rect x="56" y="208" width="14" height="6" rx="1.5" fill="url(#goldGrad)" stroke="#8B6A00" strokeWidth="0.5" />
      <rect x="88" y="208" width="14" height="6" rx="1.5" fill="url(#goldGrad)" stroke="#8B6A00" strokeWidth="0.5" />

      {/* 头盔 */}
      <path
        d="M80,52 Q66,52 64,64 L64,78 Q64,88 72,94 L80,96 L88,94 Q96,88 96,78 L96,64 Q94,52 80,52 Z"
        fill="url(#armorGrad)"
        stroke={neonBlue}
        strokeWidth="1.2"
      />
      {/* 头盔金线 */}
      <path d="M68,58 Q80,54 92,58" stroke="url(#goldGrad)" strokeWidth="1" fill="none" />
      <path d="M66,70 L94,70" stroke="url(#goldGrad)" strokeWidth="0.6" fill="none" opacity="0.5" />
      {/* 面罩 */}
      <rect x="68" y="68" width="24" height="6" rx="1" fill="#0A0814" opacity="0.9" />
      <rect x="70" y="69" width="8" height="4" fill={neonCyan} opacity="0.85" style={{ animation: 'glow-pulse 1.5s ease-in-out infinite' }} />
      <rect x="82" y="69" width="8" height="4" fill={neonCyan} opacity="0.85" style={{ animation: 'glow-pulse 1.5s ease-in-out infinite 0.7s' }} />
      {/* 头盔顶天线 */}
      <line x1="80" y1="52" x2="80" y2="46" stroke={neonCyan} strokeWidth="1" />
      <circle cx="80" cy="45" r="1.5" fill={neonCyan} style={{ animation: 'glow-pulse 1s ease-in-out infinite' }} />

      {/* 能量光晕 */}
      <ellipse cx="80" cy="108" rx="35" ry="50" fill={neonCyan} opacity="0.04" />
    </svg>
  );
}
