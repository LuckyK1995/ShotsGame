import { useEffect, useState } from 'react';
import {
  QuizIconV2 as QuizIcon,
  CheckInIconV2 as CheckInIcon, OnlineRewardIconV2 as OnlineRewardIcon,
  LotteryIconV2 as LotteryIcon,
  MerchantIconV2 as MerchantIcon,
} from './ButtonIcons';
import { QuizModal } from './QuizModal';
import { CheckInPanel } from './CheckInPanel';
import { OnlineRewardPanel } from './OnlineRewardPanel';
import { LotteryPanel } from './LotteryPanel';
import { EquipmentMerchantPanel } from './EquipmentMerchantPanel';
import { HorseRacingPanel } from './HorseRacingPanel';
import { ModeIntroModal } from './ModeIntroModal';
import { LeaderboardModal } from './LeaderboardModal';
import PkModal from './PkModal';
import type { OnlinePlayer } from '../api/modules/pk';
import type { GameMode } from '../game/data/gameModes';
import { GAME_MODE_CONFIGS } from '../game/data/gameModes';
import { useGameStore } from '../store/gameStore';
import {
  neonCyan, neonPurple, neonPink, neonYellow,
  neonGreen, neonBlue, neonOrange, neonRed
} from '../theme/colors';

interface EngineRef {
  current: {
    checkIn?: () => any;
    getCheckInStatus?: () => any;
    claimOnlineReward?: () => any;
    getOnlineRewardStatus?: () => any;
    getLotteryStatus?: () => any;
    spinLottery?: () => any;
    setLotteryBet?: (categoryId: string, delta: number) => any;
    clearLotteryBets?: () => any;
    getEquipmentMerchantStatus?: () => any;
    getMerchantEquipment?: (tierLevel: number) => any;
    getMerchantBlueprints?: (tierLevel: number) => any;
    buyMerchantEquipment?: (itemId: string) => any;
    buyMerchantBlueprint?: (bpId: string) => any;
    clearMerchantCache?: () => void;
  } | null;
}

interface MainMenuProps {
  onEnterStage: (mode: string) => void;
  engineRef?: EngineRef;
  bottomInset?: number;
  onModalOpenChange?: (hasOpen: boolean) => void;
  onStartPk?: (player: OnlinePlayer) => void;
}

interface ModeButton {
  id: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockLevel: number;
}

// 模式按钮统一从 GAME_MODE_CONFIGS 派生（单一数据源），按 unlockLevel 升序排列
// 解锁状态在组件内根据玩家等级动态计算
const MODE_ORDER: GameMode[] = (Object.keys(GAME_MODE_CONFIGS) as GameMode[])
  .sort((a, b) => GAME_MODE_CONFIGS[a].unlockLevel - GAME_MODE_CONFIGS[b].unlockLevel);

function buildModes(playerLevel: number): ModeButton[] {
  return MODE_ORDER.map(id => {
    const cfg = GAME_MODE_CONFIGS[id];
    return {
      id: cfg.id,
      label: cfg.name,
      desc: cfg.description,
      icon: `/images/mode-${cfg.id}.png`,
      color: cfg.color,
      unlocked: playerLevel >= cfg.unlockLevel,
      unlockLevel: cfg.unlockLevel,
    };
  });
}

export function MainMenu({ onEnterStage, engineRef, bottomInset = 0, onModalOpenChange, onStartPk }: MainMenuProps) {
  const playerLevel = useGameStore(s => s.player?.level ?? 1);
  const modes = buildModes(playerLevel);
  const [toast, setToast] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [onlineRewardOpen, setOnlineRewardOpen] = useState(false);
  const [lotteryOpen, setLotteryOpen] = useState(false);
  const [merchantOpen, setMerchantOpen] = useState(false);
  const [horseRacingOpen, setHorseRacingOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [pkOpen, setPkOpen] = useState(false);
  // 模式介绍弹窗：非关卡模式点击后先弹出介绍
  const [introMode, setIntroMode] = useState<GameMode | null>(null);

  // 通知父组件：当前是否有任意弹窗打开
  useEffect(() => {
    const hasOpen = quizModalOpen || checkInOpen || onlineRewardOpen || lotteryOpen || merchantOpen || horseRacingOpen || leaderboardOpen || pkOpen || introMode !== null;
    onModalOpenChange?.(hasOpen);
  }, [quizModalOpen, checkInOpen, onlineRewardOpen, lotteryOpen, merchantOpen, horseRacingOpen, leaderboardOpen, pkOpen, introMode, onModalOpenChange]);

  const neonText: React.CSSProperties = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 700,
    letterSpacing: '1px',
  };

  const handleModeClick = (mode: ModeButton) => {
    if (!mode.unlocked) {
      setToast(`【${mode.label}】Lv.${mode.unlockLevel} 解锁`);
      setTimeout(() => setToast(null), 1800);
      return;
    }
    // 关卡挑战直接进入；其他模式先弹出介绍弹窗
    if (mode.id === 'stage') {
      onEnterStage(mode.id);
    } else {
      setIntroMode(mode.id as GameMode);
    }
  };

  return (
    <>
      <div
        className="absolute left-0 right-0 top-0 z-50 overflow-hidden"
        style={{
          bottom: `${bottomInset}px`,
          background: 'radial-gradient(ellipse at 50% 30%, #1A0E2E 0%, #13102A 40%, #0A0814 75%, #050308 100%)',
        }}
      >
      {/* 层 1：深色六边形网格背景 */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.18 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hexgrid" x="0" y="0" width="40" height="34.64" patternUnits="userSpaceOnUse">
            <polygon
              points="20,0 40,11.55 40,23.09 20,34.64 0,23.09 0,11.55"
              fill="none"
              stroke={neonPurple}
              strokeWidth="0.4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexgrid)" />
      </svg>

      {/* 层 2：星空（保留并增强） */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.85 }}>
        {Array.from({ length: 60 }).map((_, i) => {
          const x = (i * 37 + 13) % 100;
          const y = (i * 23 + 7) % 80;
          const size = (i % 4) * 0.7 + 0.5;
          const opacity = (i % 5) * 0.15 + 0.3;
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
                background: i % 5 === 0 ? neonCyan : i % 5 === 1 ? neonPink : i % 5 === 2 ? neonPurple : '#FFFFFF',
                opacity,
                boxShadow: `0 0 ${size * 3}px currentColor`,
                animation: `twinkle ${2 + (i % 4)}s ease-in-out ${i * 0.08}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* 层 3：数据流雨（左右两列） */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.35 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const left = 4 + i * 12 + (i % 2) * 3;
          const delay = (i * 0.7) % 4;
          const duration = 4 + (i % 3);
          const chars = '01010110100111010100';
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: 0,
                fontFamily: 'monospace',
                fontSize: '9px',
                color: i % 2 === 0 ? neonCyan : neonGreen,
                textShadow: `0 0 6px currentColor`,
                writingMode: 'vertical-rl',
                animation: `data-rain ${duration}s linear ${delay}s infinite`,
                whiteSpace: 'nowrap',
                letterSpacing: '2px',
              }}
            >
              {chars}
            </div>
          );
        })}
      </div>

      {/* 层 4：扫描线（横向贯穿） */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          height: '60px',
          background: `linear-gradient(180deg, transparent, ${neonCyan}15 40%, ${neonCyan}30 50%, ${neonCyan}15 60%, transparent)`,
          animation: 'scanline 7s linear infinite',
          zIndex: 1,
        }}
      />

      {/* 层 5：背景城市剪影（保留，加深氛围） */}
      <svg
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{ height: '28%', opacity: 0.55 }}
        viewBox="0 0 430 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={neonPurple} stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0A0814" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path
          d="M0,200 L0,140 L20,140 L20,100 L40,100 L40,130 L60,130 L60,80 L75,80 L75,60 L85,60 L85,80 L100,80 L100,110 L120,110 L120,70 L135,70 L135,90 L150,90 L150,50 L165,50 L165,75 L180,75 L180,100 L200,100 L200,65 L215,65 L215,40 L225,40 L225,65 L240,65 L240,95 L260,95 L260,55 L275,55 L275,85 L295,85 L295,110 L315,110 L315,70 L330,70 L330,95 L350,95 L350,60 L365,60 L365,85 L380,85 L380,115 L400,115 L400,90 L415,90 L415,130 L430,130 L430,200 Z"
          fill="url(#cityGrad)"
        />
        {/* 窗户灯光 */}
        <g fill={neonCyan} opacity="0.6">
          {Array.from({ length: 36 }).map((_, i) => {
            const x = (i * 43 + 11) % 425 + 5;
            const y = ((i * 17 + 5) % 60) + 70;
            return <rect key={i} x={x} y={y} width="1.5" height="1.5" style={{ animation: `glow-pulse ${2 + i % 3}s ease-in-out ${i * 0.1}s infinite` }} />;
          })}
        </g>
        <g fill={neonPink} opacity="0.4">
          {Array.from({ length: 14 }).map((_, i) => {
            const x = (i * 61 + 23) % 425 + 5;
            const y = ((i * 29 + 11) % 50) + 80;
            return <rect key={i} x={x} y={y} width="1.5" height="1.5" />;
          })}
        </g>
        {/* 城市上方红色警示灯 */}
        <g>
          <circle cx="85" cy="58" r="2" fill={neonRed} style={{ animation: 'glow-pulse 1.5s ease-in-out infinite' }} />
          <circle cx="225" cy="38" r="2" fill={neonRed} style={{ animation: 'glow-pulse 1.5s ease-in-out 0.7s infinite' }} />
          <circle cx="365" cy="58" r="2" fill={neonRed} style={{ animation: 'glow-pulse 1.5s ease-in-out 1.2s infinite' }} />
        </g>
      </svg>

      {/* 层 6：中央能量地面投影 */}
      <div
        className="absolute left-1/2 pointer-events-none"
        style={{
          bottom: '20%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '40px',
          background: `radial-gradient(ellipse, ${neonCyan}30 0%, ${neonPurple}15 40%, transparent 70%)`,
          filter: 'blur(8px)',
          animation: 'aura-pulse 3s ease-in-out infinite',
        }}
      />

      {/* 顶部标题区 - 全新霓虹设计 */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{ top: '4%' }}
      >
        {/* 顶部装饰线 + 系统标识 */}
        <div
          className="flex items-center gap-2 mb-1"
          style={{
            ...neonText,
            fontSize: '7px',
            color: neonPurple,
            letterSpacing: '4px',
            opacity: 0.7,
            animation: 'subtitle-in 1.2s ease-out',
          }}
        >
          <span style={{ width: '24px', height: '1px', background: `linear-gradient(90deg, transparent, ${neonPurple})` }} />
          <span>SYS_2099</span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: neonGreen, boxShadow: `0 0 6px ${neonGreen}`, animation: 'glow-pulse 1.5s ease-in-out infinite' }} />
          <span>ONLINE</span>
          <span style={{ width: '24px', height: '1px', background: `linear-gradient(90deg, ${neonPurple}, transparent)` }} />
        </div>

        {/* WASTELAND 副标题 */}
        <div
          style={{
            ...neonText,
            fontSize: '10px',
            color: neonPink,
            letterSpacing: '10px',
            marginBottom: '2px',
            textShadow: `0 0 8px ${neonPink}80, 0 0 16px ${neonPink}40`,
            opacity: 0,
            animation: 'subtitle-in 1s ease-out 0.2s forwards',
          }}
        >
          WASTELAND
        </div>

        {/* 主标题：末日突围 */}
        <div
          style={{
            ...neonText,
            fontSize: '34px',
            color: neonCyan,
            letterSpacing: '4px',
            textShadow: `0 0 10px ${neonCyan}A0, 0 0 24px ${neonCyan}60, 0 0 40px ${neonCyan}30`,
            lineHeight: 1,
            position: 'relative',
            animation: 'title-in 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s both, title-flicker 6s linear 2s infinite',
          }}
        >
          末日突围
          {/* 标题下扫描光带 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: '-4px',
              height: '2px',
              overflow: 'hidden',
              borderRadius: '1px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, transparent, ${neonCyan}, transparent)`,
                animation: 'hex-sweep 3s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* 底部分隔标识 */}
        <div
          className="flex items-center gap-2 mt-2"
          style={{
            ...neonText,
            fontSize: '7px',
            color: '#8B80A0',
            letterSpacing: '3px',
            opacity: 0,
            animation: 'subtitle-in 1s ease-out 0.8s forwards',
          }}
        >
          <span style={{ width: '20px', height: '1px', background: '#5A5A7A' }} />
          <span>SHOTS GAME</span>
          <span style={{ width: '20px', height: '1px', background: '#5A5A7A' }} />
        </div>
      </div>

      {/* 中央人物形象 - 未来战士 + 科技光环 */}
      <div
        className="absolute left-1/2 pointer-events-none"
        style={{
          top: '14%',
          transform: 'translateX(-50%)',
          width: '220px',
          height: '300px',
        }}
      >
        {/* 旋转能量环（后层） */}
        <svg
          className="absolute"
          style={{
            left: '50%',
            top: '52%',
            transform: 'translate(-50%, -50%)',
            animation: 'spin-slow 14s linear infinite',
            opacity: 0.6,
          }}
          width="220" height="220" viewBox="0 0 220 220" fill="none"
        >
          <circle cx="110" cy="110" r="98" fill="none" stroke={neonCyan} strokeWidth="0.6" strokeDasharray="3 6" />
          <circle cx="110" cy="110" r="92" fill="none" stroke={neonPurple} strokeWidth="0.4" strokeDasharray="1 8" />
        </svg>
        {/* 旋转能量环（前层反向） */}
        <svg
          className="absolute"
          style={{
            left: '50%',
            top: '52%',
            transform: 'translate(-50%, -50%)',
            animation: 'spin-reverse-slow 20s linear infinite',
            opacity: 0.5,
          }}
          width="200" height="200" viewBox="0 0 200 200" fill="none"
        >
          <circle cx="100" cy="100" r="88" fill="none" stroke={neonPink} strokeWidth="0.5" strokeDasharray="8 4" />
          {/* 四角科技标记 */}
          {[0, 90, 180, 270].map(deg => (
            <g key={deg} transform={`rotate(${deg} 100 100)`}>
              <path d="M100 8 L96 16 L104 16 Z" fill={neonCyan} />
            </g>
          ))}
        </svg>
        {/* 光晕呼吸 */}
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '52%',
            transform: 'translate(-50%, -50%)',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${neonCyan}20 0%, ${neonPurple}10 40%, transparent 70%)`,
            filter: 'blur(12px)',
            animation: 'aura-pulse 3.5s ease-in-out infinite',
          }}
        />
        {/* 上升粒子 */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => {
            const left = 20 + i * 22;
            const delay = (i * 0.6) % 3;
            const duration = 3 + (i % 3);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  bottom: '10%',
                  width: '2px',
                  height: '2px',
                  borderRadius: '50%',
                  background: i % 2 === 0 ? neonCyan : neonPink,
                  boxShadow: `0 0 4px currentColor`,
                  animation: `particle-rise ${duration}s ease-out ${delay}s infinite`,
                }}
              />
            );
          })}
        </div>
        {/* 战士本体 */}
        <div style={{ position: 'absolute', left: '50%', top: '0', transform: 'translateX(-50%)' }}>
          <WarriorSilhouette />
        </div>
      </div>

      {/* 右侧功能按钮 - 垂直排列，手指易触碰位置 */}
      <div
        className="absolute right-3 flex flex-col gap-4 z-20"
        style={{ top: '12%' }}
      >
        {/* 连续签到 */}
        {(() => {
          const c = neonYellow;
          const isHover = hoverId === 'checkin';
          return (
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <button
                onClick={() => setCheckInOpen(true)}
                onMouseEnter={() => setHoverId('checkin')}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  filter: isHover ? `drop-shadow(0 0 8px ${c}80)` : `drop-shadow(0 0 4px ${c}40)`,
                }}
              >
                <div style={{ animation: 'btn-icon-breathe 2s ease-in-out infinite', transform: isHover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                  <img src="/images/btn-checkin.png" alt="连续签到" style={{ width: '34px', height: '34px', objectFit: 'contain', objectPosition: 'center' }} />
                </div>
              </button>
              <div style={{ ...neonText, fontSize: '7px', color: c, textShadow: `0 0 4px ${c}80`, letterSpacing: '0.5px', lineHeight: 1, opacity: isHover ? 1 : 0.8, marginTop: '-2px' }}>连续签到</div>
            </div>
          );
        })()}

        {/* 在线奖励 */}
        {(() => {
          const c = neonCyan;
          const isHover = hoverId === 'online';
          return (
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <button
                onClick={() => setOnlineRewardOpen(true)}
                onMouseEnter={() => setHoverId('online')}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  filter: isHover ? `drop-shadow(0 0 8px ${c}80)` : `drop-shadow(0 0 4px ${c}40)`,
                }}
              >
                <div style={{ animation: 'btn-icon-breathe 2.2s ease-in-out infinite', transform: isHover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                  <img src="/images/btn-online.png" alt="在线奖励" style={{ width: '34px', height: '34px', objectFit: 'contain', objectPosition: 'center' }} />
                </div>
              </button>
              <div style={{ ...neonText, fontSize: '7px', color: c, textShadow: `0 0 4px ${c}80`, letterSpacing: '0.5px', lineHeight: 1, opacity: isHover ? 1 : 0.8, marginTop: '-2px' }}>在线奖励</div>
            </div>
          );
        })()}

        {/* 趣味答题 */}
        {(() => {
          const c = neonPink;
          const isHover = hoverId === 'quiz';
          return (
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <button
                onClick={() => setQuizModalOpen(true)}
                onMouseEnter={() => setHoverId('quiz')}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  filter: isHover ? `drop-shadow(0 0 8px ${c}80)` : `drop-shadow(0 0 4px ${c}40)`,
                }}
              >
                <div style={{ animation: 'btn-icon-breathe 2.4s ease-in-out infinite', transform: isHover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                  <img src="/images/btn-quiz.png" alt="趣味答题" style={{ width: '34px', height: '34px', objectFit: 'contain', objectPosition: 'center' }} />
                </div>
              </button>
              <div style={{ ...neonText, fontSize: '7px', color: c, textShadow: `0 0 4px ${c}80`, letterSpacing: '0.5px', lineHeight: 1, opacity: isHover ? 1 : 0.8, marginTop: '-2px' }}>趣味答题</div>
            </div>
          );
        })()}
      </div>

      {/* 左侧功能按钮 - 排行榜 + PK + 赛马 + 抽奖机 + 装备商人 */}
      <div
        className="absolute flex flex-col gap-4 z-20"
        style={{ left: '12px', top: '12%' }}
      >
        {/* 排行榜按钮 */}
        {(() => {
          const c = neonCyan;
          const isHover = hoverId === 'leaderboard';
          return (
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <button
                onClick={() => setLeaderboardOpen(true)}
                onMouseEnter={() => setHoverId('leaderboard')}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  filter: isHover ? `drop-shadow(0 0 8px ${c}80)` : `drop-shadow(0 0 4px ${c}40)`,
                }}
              >
                <div style={{ animation: 'btn-icon-breathe 2s ease-in-out infinite', transform: isHover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                  <img src="/images/btn-leaderboard.png" alt="排行榜" style={{ width: '34px', height: '34px', objectFit: 'contain', objectPosition: 'center' }} />
                </div>
              </button>
              <div style={{ ...neonText, fontSize: '7px', color: c, textShadow: `0 0 4px ${c}80`, letterSpacing: '0.5px', lineHeight: 1, opacity: isHover ? 1 : 0.8, marginTop: '-2px' }}>排行榜</div>
            </div>
          );
        })()}
        {/* PK挑战按钮 */}
        {(() => {
          const c = neonPink;
          const isHover = hoverId === 'pk';
          return (
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <button
                onClick={() => setPkOpen(true)}
                onMouseEnter={() => setHoverId('pk')}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  filter: isHover ? `drop-shadow(0 0 8px ${c}80)` : `drop-shadow(0 0 4px ${c}40)`,
                }}
              >
                <div style={{ animation: 'btn-icon-breathe 2.2s ease-in-out infinite', transform: isHover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                  <img src="/images/btn-pk.png" alt="PK挑战" style={{ width: '34px', height: '34px', objectFit: 'contain', objectPosition: 'center' }} />
                </div>
              </button>
              <div style={{ ...neonText, fontSize: '7px', color: c, textShadow: `0 0 4px ${c}80`, letterSpacing: '0.5px', lineHeight: 1, opacity: isHover ? 1 : 0.8, marginTop: '-2px' }}>PK挑战</div>
            </div>
          );
        })()}
        {/* 赛马按钮（放在抽奖机上方） */}
        {(() => {
          const c = neonPurple;
          const isHover = hoverId === 'horseRacing';
          return (
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <button
                onClick={() => setHorseRacingOpen(true)}
                onMouseEnter={() => setHoverId('horseRacing')}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  filter: isHover ? `drop-shadow(0 0 8px ${c}80)` : `drop-shadow(0 0 4px ${c}40)`,
                }}
              >
                <div style={{ animation: 'btn-icon-breathe 2.4s ease-in-out infinite', transform: isHover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease', width: '34px', height: '34px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', filter: isHover ? `drop-shadow(0 0 6px ${c})` : `drop-shadow(0 0 3px ${c}80)` }}>
                  <img src="/images/horse-icon.png" alt="赛马" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
                </div>
              </button>
              <div style={{ ...neonText, fontSize: '7px', color: c, textShadow: `0 0 4px ${c}80`, letterSpacing: '0.5px', lineHeight: 1, opacity: isHover ? 1 : 0.8, marginTop: '-2px' }}>赛马</div>
            </div>
          );
        })()}
        {(() => {
          const c = neonPink;
          const isHover = hoverId === 'lottery';
          return (
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <button
                onClick={() => setLotteryOpen(true)}
                onMouseEnter={() => setHoverId('lottery')}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  filter: isHover ? `drop-shadow(0 0 8px ${c}80)` : `drop-shadow(0 0 4px ${c}40)`,
                }}
              >
                <div style={{ animation: 'btn-icon-breathe 2.6s ease-in-out infinite', transform: isHover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                  <img src="/images/btn-lottery.png" alt="抽奖机" style={{ width: '34px', height: '34px', objectFit: 'contain', objectPosition: 'center' }} />
                </div>
              </button>
              <div style={{ ...neonText, fontSize: '7px', color: c, textShadow: `0 0 4px ${c}80`, letterSpacing: '0.5px', lineHeight: 1, opacity: isHover ? 1 : 0.8, marginTop: '-2px' }}>抽奖机</div>
            </div>
          );
        })()}
        {(() => {
          const c = neonCyan;
          const isHover = hoverId === 'merchant';
          return (
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <button
                onClick={() => setMerchantOpen(true)}
                onMouseEnter={() => setHoverId('merchant')}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  position: 'relative',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  filter: isHover ? `drop-shadow(0 0 8px ${c}80)` : `drop-shadow(0 0 4px ${c}40)`,
                }}
              >
                <div style={{ animation: 'btn-icon-breathe 2.8s ease-in-out infinite', transform: isHover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                  <img src="/images/btn-merchant.png" alt="装备商人" style={{ width: '34px', height: '34px', objectFit: 'contain', objectPosition: 'center' }} />
                </div>
              </button>
              <div style={{ ...neonText, fontSize: '7px', color: c, textShadow: `0 0 4px ${c}80`, letterSpacing: '0.5px', lineHeight: 1, opacity: isHover ? 1 : 0.8, marginTop: '-2px' }}>装备商人</div>
            </div>
          );
        })()}
      </div>

      {/* 左侧 HUD 装饰条 */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '8px',
          top: '40%',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          opacity: 0.5,
        }}
      >
        {['POWER', 'SHIELD', 'CORE'].map((label, i) => (
          <div
            key={label}
            style={{
              ...neonText,
              fontSize: '6px',
              color: i === 0 ? neonCyan : i === 1 ? neonGreen : neonPink,
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 4px currentColor', animation: `glow-pulse ${1.5 + i * 0.3}s ease-in-out infinite` }} />
            {label}
            <span style={{ width: '20px', height: '2px', background: 'linear-gradient(90deg, currentColor, transparent)' }} />
          </div>
        ))}
      </div>

      {/* 底部模式按钮区 - 全息 HUD 风格 */}
      <div
        className="absolute left-0 right-0"
        style={{ bottom: '4%' }}
      >
        {/* 按钮区顶部装饰线 + 标识 */}
        <div
          className="mx-auto"
          style={{
            width: '85%',
            maxWidth: '360px',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${neonPurple}60, ${neonCyan}60, ${neonPurple}60, transparent)`,
            marginBottom: '6px',
          }}
        />
        <div
          className="flex justify-center items-center gap-2 mb-2"
          style={{
            ...neonText,
            fontSize: '7px',
            color: '#8B80A0',
            letterSpacing: '6px',
            opacity: 0.7,
          }}
        >
          <span style={{ width: '16px', height: '1px', background: '#5A5A7A' }} />
          <span>SELECT MODE</span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: neonGreen, boxShadow: `0 0 5px ${neonGreen}`, animation: 'glow-pulse 1.5s ease-in-out infinite' }} />
          <span style={{ width: '16px', height: '1px', background: '#5A5A7A' }} />
        </div>
        <div
          className="grid mx-auto"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            padding: '0 12px',
            maxWidth: '430px',
          }}
        >
          {modes.map((mode, idx) => {
            const isHover = hoverId === mode.id;
            const num = String(idx + 1).padStart(2, '0');
            return (
              <button
                key={mode.id}
                onClick={() => handleModeClick(mode)}
                onMouseEnter={() => setHoverId(mode.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '9px 4px 6px',
                  background: isHover && mode.unlocked
                    ? `linear-gradient(180deg, ${mode.color}28, ${mode.color}06 60%, ${mode.color}10)`
                    : `linear-gradient(180deg, rgba(19,16,37,0.85), rgba(10,8,20,0.9))`,
                  border: `1px solid ${isHover && mode.unlocked ? mode.color : 'rgba(100,100,130,0.28)'}`,
                  borderRadius: '6px',
                  cursor: mode.unlocked ? 'pointer' : 'not-allowed',
                  opacity: mode.unlocked ? 1 : 0.5,
                  boxShadow: isHover && mode.unlocked
                    ? `0 0 16px ${mode.color}55, 0 0 30px ${mode.color}25, inset 0 0 12px ${mode.color}20`
                    : `inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.4)`,
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  animation: `mode-in 0.5s ease-out ${0.1 + idx * 0.05}s both`,
                  clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                }}
              >
                {/* HUD 角标（四角） */}
                <span style={{ position: 'absolute', top: '2px', left: '2px', width: '5px', height: '5px', borderTop: `1px solid ${mode.color}`, borderLeft: `1px solid ${mode.color}`, opacity: 0.7, pointerEvents: 'none' }} />
                <span style={{ position: 'absolute', top: '2px', right: '2px', width: '5px', height: '5px', borderTop: `1px solid ${mode.color}`, borderRight: `1px solid ${mode.color}`, opacity: 0.7, pointerEvents: 'none' }} />
                <span style={{ position: 'absolute', bottom: '2px', left: '2px', width: '5px', height: '5px', borderBottom: `1px solid ${mode.color}`, borderLeft: `1px solid ${mode.color}`, opacity: 0.7, pointerEvents: 'none' }} />
                <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '5px', height: '5px', borderBottom: `1px solid ${mode.color}`, borderRight: `1px solid ${mode.color}`, opacity: 0.7, pointerEvents: 'none' }} />

                {/* 持续扫描线（hover 时增强） */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    height: '20px',
                    background: `linear-gradient(180deg, transparent, ${mode.color}25, transparent)`,
                    animation: `btn-scan ${isHover ? '2.5s' : '4s'} linear infinite`,
                    pointerEvents: 'none',
                    opacity: isHover ? 1 : 0.4,
                  }}
                />

                {/* hover 全息扫光 */}
                {isHover && mode.unlocked && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: '40%',
                      background: `linear-gradient(90deg, transparent, ${mode.color}40, transparent)`,
                      animation: 'btn-holo-sweep 1.8s ease-in-out infinite',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* hover 数据粒子 */}
                {isHover && mode.unlocked && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {Array.from({ length: 3 }).map((_, p) => (
                      <div
                        key={p}
                        style={{
                          position: 'absolute',
                          left: `${30 + p * 25}%`,
                          bottom: '30%',
                          width: '1.5px',
                          height: '1.5px',
                          borderRadius: '50%',
                          background: mode.color,
                          boxShadow: `0 0 3px currentColor`,
                          animation: `btn-particle ${1.5 + p * 0.4}s ease-out ${p * 0.3}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* 序号标识（左上） */}
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: '7px',
                    ...neonText,
                    fontSize: '5px',
                    color: mode.color,
                    opacity: 0.6,
                    letterSpacing: '0.5px',
                    pointerEvents: 'none',
                  }}
                >
                  {num}
                </span>

                {/* 图标 + 能量核心 */}
                <div style={{ position: 'relative', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* 能量核心（图标背后径向光晕） */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-4px',
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${mode.color}50 0%, transparent 70%)`,
                      animation: 'btn-core-pulse 2.5s ease-in-out infinite',
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 1, opacity: mode.unlocked ? 1 : 0.6, animation: `btn-icon-breathe ${2 + idx * 0.2}s ease-in-out infinite`, width: '26px', height: '26px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    <img
                      src={mode.icon}
                      alt={mode.label}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'contain',
                        objectPosition: 'center',
                      }}
                    />
                  </div>
                </div>

                {/* 模式名称 */}
                <div
                  style={{
                    ...neonText,
                    fontSize: '8px',
                    color: mode.unlocked ? mode.color : '#6A6A80',
                    textShadow: isHover && mode.unlocked ? `0 0 6px ${mode.color}A0` : 'none',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {mode.label}
                </div>

                {/* 底部能量条 */}
                <div
                  style={{
                    position: 'relative',
                    width: '70%',
                    height: '1.5px',
                    marginTop: '2px',
                    background: `rgba(255,255,255,0.06)`,
                    overflow: 'hidden',
                    borderRadius: '1px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(90deg, transparent, ${mode.color}, transparent)`,
                      width: '50%',
                      animation: `btn-energy-flow ${isHover ? '1.5s' : '3s'} linear infinite`,
                    }}
                  />
                </div>

                {/* 底部能量条容器框 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '14px',
                    height: '3px',
                    border: `0.5px solid ${mode.color}50`,
                    borderRadius: '1px',
                    opacity: isHover ? 0.9 : 0.4,
                    pointerEvents: 'none',
                  }}
                />

                {!mode.unlocked && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '4px',
                      ...neonText,
                      fontSize: '7px',
                      color: neonYellow,
                      textShadow: `0 0 4px ${neonYellow}80`,
                      opacity: 0.95,
                      letterSpacing: '0.3px',
                      pointerEvents: 'none',
                    }}
                  >
                    Lv.{mode.unlockLevel}
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

      <QuizModal isOpen={quizModalOpen} onClose={() => setQuizModalOpen(false)} />
      {engineRef && (
        <>
          <CheckInPanel engineRef={engineRef as any} isOpen={checkInOpen} onClose={() => setCheckInOpen(false)} />
          <OnlineRewardPanel engineRef={engineRef as any} isOpen={onlineRewardOpen} onClose={() => setOnlineRewardOpen(false)} />
          <LotteryPanel engineRef={engineRef as any} isOpen={lotteryOpen} onClose={() => setLotteryOpen(false)} />
          <EquipmentMerchantPanel engineRef={engineRef as any} isOpen={merchantOpen} onClose={() => setMerchantOpen(false)} />
          <HorseRacingPanel engineRef={engineRef as any} isOpen={horseRacingOpen} onClose={() => setHorseRacingOpen(false)} />
        </>
      )}

      {/* 排行榜弹窗 */}
      <LeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
      {/* PK挑战弹窗 */}
      <PkModal
        isOpen={pkOpen}
        onClose={() => setPkOpen(false)}
        onStartPk={(player) => {
          setPkOpen(false);
          onStartPk?.(player);
        }}
      />

      {/* 模式介绍弹窗：点击进入后开始游戏 */}
      {introMode && (
        <ModeIntroModal
          mode={introMode}
          onConfirm={() => {
            const m = introMode;
            setIntroMode(null);
            onEnterStage(m);
          }}
          onCancel={() => setIntroMode(null)}
        />
      )}
    </>
  );
}

// 未来战士 - 人类男性主角（动态全息版）
// 贴图文件已在素材层面完成背景透明化与边缘羽化，此处直接返回原图
function useKnockoutImage(src: string) {
  const [out, setOut] = useState<string | null>(null);
  useEffect(() => {
    setOut(src);
  }, [src]);
  return out;
}

function WarriorSilhouette() {
  // 抠图后的透明背景图（处理完成前为 null）
  const knockedOut = useKnockoutImage('/images/warrior-hero.png');

  return (
    <div
      style={{
        position: 'relative',
        width: '220px',
        height: '300px',
        animation: 'hero-breathe 4s ease-in-out infinite',
      }}
    >
      {/* 底部地面能量投影（脉冲） */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '150px',
          height: '32px',
          background: `radial-gradient(ellipse, ${neonCyan}55 0%, ${neonPurple}25 40%, transparent 70%)`,
          filter: 'blur(10px)',
          animation: 'hero-aura 3s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 能量波纹扩散（底部） */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80px',
          height: '20px',
          borderRadius: '50%',
          border: `1.5px solid ${neonCyan}`,
          animation: 'energy-ripple 2.5s ease-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80px',
          height: '20px',
          borderRadius: '50%',
          border: `1px solid ${neonPurple}`,
          animation: 'energy-ripple 2.5s ease-out 1.25s infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* 角色容器：整体径向遮罩（柔和边缘） */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          WebkitMaskImage: 'radial-gradient(ellipse 52% 82% at 50% 55%, #000 35%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.1) 90%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 52% 82% at 50% 55%, #000 35%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.1) 90%, transparent 100%)',
        }}
      >
        {/* 角色图片：真正透明背景 PNG，无需 mix-blend-mode */}
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
                  filter: `brightness(1.08) saturate(1.12) drop-shadow(0 0 14px ${neonBlue}80) drop-shadow(0 0 24px ${neonPurple}50)`,
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
                  filter: `brightness(1.3) blur(3px)`,
                  opacity: 0.4,
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
        </div>

        {/* 全息扫描线（覆盖在角色上滚动） */}
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
              height: '40px',
              background: `linear-gradient(180deg, transparent, ${neonCyan}30 40%, ${neonCyan}50 50%, ${neonCyan}30 60%, transparent)`,
              animation: 'hero-scan 4s linear infinite',
            }}
          />
        </div>

        {/* 全息网格叠加（轻微） */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: `linear-gradient(0deg, ${neonCyan}08 1px, transparent 1px)`,
            backgroundSize: '100% 4px',
            mixBlendMode: 'screen',
            opacity: 0.4,
          }}
        />

        {/* 边缘发光脉冲 */}
        <div
          style={{
            position: 'absolute',
            inset: '15px 20px',
            borderRadius: '50%',
            boxShadow: `0 0 24px ${neonCyan}40, inset 0 0 24px ${neonPurple}30`,
            animation: 'aura-pulse 3.5s ease-in-out infinite',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* 顶部能量粒子上升 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const left = 25 + i * 18;
          const delay = (i * 0.7) % 3;
          const duration = 3.5 + (i % 3);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${left}%`,
                bottom: '15%',
                width: '2px',
                height: '2px',
                borderRadius: '50%',
                background: i % 2 === 0 ? neonCyan : neonPink,
                boxShadow: `0 0 4px currentColor`,
                animation: `particle-rise ${duration}s ease-out ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

