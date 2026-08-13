import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  type Horse,
  type BetRecord,
  type RaceSession,
  HORSE_PRESETS,
  BET_PRESETS,
  BET_MAX,
  generateRaceSession,
  calcWinnings,
} from '../game/data/horseRacing';
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonRed, neonOrange } from '../theme/colors';
import { ModalHudBackground } from './ModalHudBackground';

const neonText: React.CSSProperties = {
  fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
  fontWeight: 700,
  letterSpacing: '0.5px',
};

interface EngineRef {
  current: {
    createHorseRaceSession?: () => Promise<{
      sessionId: string;
      horses: Array<{ id: number; name: string; color: string; odds: number }>;
    } | null>;
    placeHorseBet?: (horseId: number, amount: number) => Promise<boolean>;
    cancelHorseBet?: (horseId: number) => Promise<boolean>;
    startHorseRace?: () => Promise<{ success: boolean; countdown: number } | null>;
    getHorseRaceResult?: () => Promise<{
      champion: { id: number; name: string; color: string; odds: number } | null;
      goldWon: number;
      rounds: Array<{ round: number; horses: any[]; winners: any[]; status: string }>;
    } | null>;
  } | null;
}

interface HorseRacingPanelProps {
  engineRef: EngineRef;
  isOpen: boolean;
  onClose: () => void;
}

type Phase = 'betting' | 'countdown' | 'racing' | 'highlight' | 'finished';

const ROUND_LABELS: Record<number, string> = { 1: '8进4', 2: '4进2', 3: '决赛' };

export function HorseRacingPanel({ engineRef, isOpen, onClose }: HorseRacingPanelProps) {
  const playerGold = useGameStore(s => s.player?.gold ?? 0);
  const addGold = useGameStore(s => s.addGold);

  // 核心状态保存在 ref 中，即使 UI 不渲染也能持续运行
  const sessionRef = useRef<RaceSession>(generateRaceSession());
  const phaseRef = useRef<Phase>('betting');
  const currentRoundRef = useRef<number>(0);
  const countdownRef = useRef<number>(5);
  const betsRef = useRef<Record<number, number>>({});
  const totalBetRef = useRef<number>(0);
  const goldWonRef = useRef<number>(0);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI 显示状态
  const [uiTick, setUiTick] = useState(0); // 强制刷新 UI
  const [phaseState, setPhaseState] = useState<Phase>('betting'); // 镜像 phase 用于触发 effect

  const [toast, setToast] = useState<{ text: string; color: string } | null>(null);
  const [selectedHorse, setSelectedHorse] = useState<number | null>(null);

  const showToast = (text: string, color: string = neonCyan) => {
    setToast({ text, color });
    setTimeout(() => setToast(null), 2000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const forceUpdate = () => {
    setUiTick(t => t + 1);
    setPhaseState(phaseRef.current);
  };

  const resetRace = () => {
    clearTimer();
    // 立即重置为本地会话（保证 UI 即时响应）
    sessionRef.current = generateRaceSession();
    phaseRef.current = 'betting';
    currentRoundRef.current = 0;
    countdownRef.current = 5;
    betsRef.current = {};
    totalBetRef.current = 0;
    goldWonRef.current = 0;
    setSelectedHorse(null);
    forceUpdate();
    // 尝试创建服务端会话；成功则用服务端马匹覆盖本地
    void (async () => {
      try {
        const result = await engineRef.current?.createHorseRaceSession?.();
        if (result && result.horses && result.horses.length > 0) {
          const serverHorses: Horse[] = result.horses.map(h => ({ ...h, emoji: '' }));
          sessionRef.current = {
            ...sessionRef.current,
            horses: serverHorses,
            rounds: [
              { ...sessionRef.current.rounds[0], horses: [...serverHorses], winners: [], status: 'idle' },
              { ...sessionRef.current.rounds[1], horses: [], winners: [], status: 'idle' },
              { ...sessionRef.current.rounds[2], horses: [], winners: [], status: 'idle' },
            ],
            champion: null,
            goldWon: 0,
          };
          forceUpdate();
        }
      } catch (e) {
        // 保持本地会话
      }
    })();
  };

  // 根据当前状态启动下一轮
  const startCountdown = () => {
    phaseRef.current = 'countdown';
    countdownRef.current = 5;
    forceUpdate();
    
    clearTimer();
    timerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      if (countdownRef.current <= 0) {
        clearTimer();
        startRacing();
      }
      forceUpdate();
    }, 1000);
  };

  // 模拟比赛并决定胜者
  const startRacing = () => {
    phaseRef.current = 'racing';
    forceUpdate();

    // 第一轮开始时通知服务端开始比赛（fire-and-forget）
    if (currentRoundRef.current === 0) {
      void engineRef.current?.startHorseRace?.().catch(() => {});
    }

    timeoutRef.current = setTimeout(() => {
      // 获取当前轮的马匹
      const roundIdx = currentRoundRef.current;
      const round = sessionRef.current.rounds[roundIdx];
      const horses = round.horses;

      // 严格二叉树对阵（本地模拟，用于二叉树可视化）
      const winners: Horse[] = [];
      for (let i = 0; i < horses.length; i += 2) {
        const a = horses[i];
        const b = horses[i + 1];
        // 根据赔率计算获胜概率（赔率低者获胜概率高）
        const probA = 1 / a.odds;
        const probB = 1 / b.odds;
        const total = probA + probB;
        const winA = probA / total;
        const r = Math.random();
        winners.push(r < winA ? a : b);
      }

      // 更新回合胜者
      sessionRef.current.rounds[roundIdx] = {
        ...round,
        winners,
        status: 'done'
      };

      // 如果是最后一轮（决赛），尝试从服务端获取结果
      if (roundIdx === 2) {
        // 保持 'racing' 阶段直到服务端结果返回，避免空冠军闪现
        void (async () => {
          let champion: Horse | null = null;
          let won = 0;
          let serverResultUsed = false;

          try {
            const result = await engineRef.current?.getHorseRaceResult?.();
            if (result && result.champion) {
              champion = { ...result.champion, emoji: '' };
              won = result.goldWon || 0;
              serverResultUsed = true;
              // 用服务端冠军覆盖本地决赛胜者，保持二叉树一致
              sessionRef.current.rounds[2] = {
                ...sessionRef.current.rounds[2],
                winners: [champion],
              };
            }
          } catch (e) {
            // 回退到本地
          }

          if (!serverResultUsed) {
            // 回退：使用本地模拟的冠军与奖金
            champion = winners[0];
            const betRecords: BetRecord[] = Object.entries(betsRef.current).map(([horseId, amount]) => ({
              horseId: parseInt(horseId),
              amount,
            }));
            const { goldWon: localWon } = calcWinnings(betRecords, champion.id, sessionRef.current.horses);
            won = localWon;
            if (won > 0) {
              addGold(won);
            }
          }
          // 服务端结果：GameEngine.getHorseRaceResult() 内部已调用 addGold，不再重复发放

          sessionRef.current.champion = champion;
          goldWonRef.current = won;
          phaseRef.current = 'finished';
          forceUpdate();
        })();
      } else {
        // 将胜者填入下一轮
        const nextIdx = roundIdx + 1;
        sessionRef.current.rounds[nextIdx] = {
          ...sessionRef.current.rounds[nextIdx],
          horses: winners,
        };
        phaseRef.current = 'highlight';
        forceUpdate();
      }
    }, 1500);
  };

  // highlight 阶段结束后（除决赛外），进入下一轮倒计时
  useEffect(() => {
    if (phaseState === 'highlight') {
      timeoutRef.current = setTimeout(() => {
        currentRoundRef.current += 1;
        startCountdown();
      }, 2500);
      return () => clearTimeout(timeoutRef.current!);
    }
  }, [phaseState]); // 仅在 phase 变化时触发

  // 清理定时器
  useEffect(() => {
    return () => clearTimer();
  }, []);

  // 面板打开时尝试创建服务端会话；失败则保持已有本地会话
  useEffect(() => {
    if (!isOpen) return;
    if (phaseRef.current !== 'betting') return; // 比赛中不重置
    void (async () => {
      try {
        const result = await engineRef.current?.createHorseRaceSession?.();
        if (result && result.horses && result.horses.length > 0) {
          const serverHorses: Horse[] = result.horses.map(h => ({ ...h, emoji: '' }));
          sessionRef.current = {
            ...sessionRef.current,
            horses: serverHorses,
            rounds: [
              { ...sessionRef.current.rounds[0], horses: [...serverHorses], winners: [], status: 'idle' },
              { ...sessionRef.current.rounds[1], horses: [], winners: [], status: 'idle' },
              { ...sessionRef.current.rounds[2], horses: [], winners: [], status: 'idle' },
            ],
            champion: null,
            goldWon: 0,
          };
          forceUpdate();
        }
      } catch (e) {
        // 保持本地会话
      }
    })();
  }, [isOpen, engineRef]);

  // 下注逻辑：优先调用服务端 placeHorseBet；失败则回退到本地 addGold 扣/退金币
  const handlePresetBet = async (horseId: number, delta: number) => {
    const currentBet = betsRef.current[horseId] || 0;
    const newAmount = Math.max(0, currentBet + delta);
    const actualDelta = newAmount - currentBet; // 正=加注扣金币，负=减注退金币

    if (actualDelta > 0) {
      // 加注：检查金币是否充足
      if (playerGold < actualDelta) {
        showToast('金币不足', neonRed);
        return;
      }
      if (newAmount > BET_MAX) {
        showToast(`单匹最高下注 ${BET_MAX}`, neonRed);
        return;
      }
    }

    if (actualDelta !== 0) {
      // 尝试服务端下注（delta 为变化量）
      let serverOk = false;
      try {
        serverOk = !!(await engineRef.current?.placeHorseBet?.(horseId, delta));
      } catch (e) {
        serverOk = false;
      }
      // 服务端失败：回退到本地金币处理
      if (!serverOk) {
        if (actualDelta > 0) {
          addGold(-actualDelta);
        } else if (actualDelta < 0) {
          addGold(-actualDelta);
        }
      }
    }

    if (newAmount === 0) {
      delete betsRef.current[horseId];
    } else {
      betsRef.current[horseId] = newAmount;
    }

    // 重新计算总下注
    totalBetRef.current = Object.values(betsRef.current).reduce((s, b) => s + b, 0);
    forceUpdate();
  };

  const handleClearBets = async () => {
    if (totalBetRef.current <= 0) return;
    // 逐个尝试服务端取消押注；失败的押注本地退还金币
    const entries = Object.entries(betsRef.current);
    for (const [horseIdStr, amount] of entries) {
      const horseId = parseInt(horseIdStr);
      let serverOk = false;
      try {
        serverOk = !!(await engineRef.current?.cancelHorseBet?.(horseId));
      } catch (e) {
        serverOk = false;
      }
      if (!serverOk) {
        // 服务端取消失败：本地退还该笔押注金币
        addGold(amount);
      }
    }
    betsRef.current = {};
    totalBetRef.current = 0;
    forceUpdate();
  };

  const handleStartRace = () => {
    if (totalBetRef.current <= 0) {
      showToast('请至少下注一匹马', neonRed);
      return;
    }
    // 金币已在下注时扣除，此处无需再次扣除
    currentRoundRef.current = 0;
    startCountdown();
  };

  // ============ 渲染部分 ============

  const session = sessionRef.current;
  const phase = phaseRef.current;
  const currentRound = currentRoundRef.current;
  const countdown = countdownRef.current;
  const bets = betsRef.current;
  const totalBet = totalBetRef.current;
  const goldWon = goldWonRef.current;

  const playerBetHorseIds = Object.keys(bets).map(id => parseInt(id));
  const hasBets = playerBetHorseIds.length > 0;

  // 状态框：晋级情况与倒计时文案 + 特效（根据玩家是否押中晋级马匹切换）
  let statusText = '';
  let statusColor = neonCyan;
  let statusGlow = false;
  let statusAnim = '';
  if (phase === 'betting') {
    statusText = hasBets ? '▸ 已下注 · 待开始' : '▸ 下注阶段 · 选择马匹';
    statusColor = neonCyan;
  } else if (phase === 'countdown') {
    statusText = `${ROUND_LABELS[currentRound + 1]} 即将开始 · ${countdown}s`;
    statusColor = neonPink;
    statusGlow = true;
    statusAnim = 'race-countdown-tick 1s ease-in-out infinite';
  } else if (phase === 'racing') {
    statusText = `${ROUND_LABELS[currentRound + 1]} 比赛进行中...`;
    statusColor = neonOrange;
    statusGlow = true;
    statusAnim = 'race-spin-text 0.8s ease-in-out infinite';
  } else if (phase === 'highlight') {
    const winners = session.rounds[currentRound].winners;
    const betOnAdvancer = playerBetHorseIds.some(id => winners.some(w => w.id === id));
    if (hasBets && betOnAdvancer) {
      statusText = '🎉 押中晋级！';
      statusColor = neonGreen;
      statusGlow = true;
      statusAnim = 'race-win-pulse 0.8s ease-in-out infinite';
    } else if (hasBets) {
      statusText = '✗ 押注未晋级';
      statusColor = neonRed;
    } else {
      statusText = `${ROUND_LABELS[currentRound]} 胜出者揭晓`;
      statusColor = neonYellow;
    }
  } else if (phase === 'finished') {
    const champion = session.champion;
    const championName = champion ? champion.name : '';
    if (goldWon > 0) {
      statusText = `🏆 冠军·${championName} 押中！`;
      statusColor = champion ? champion.color : neonYellow;
      statusGlow = true;
      statusAnim = 'race-win-pulse 1s ease-in-out infinite';
    } else {
      statusText = champion ? `🏁 比赛结束 · 冠军 ${championName}` : '比赛结束';
      statusColor = champion ? champion.color : '#8B80A0';
      statusGlow = !!champion;
    }
  }

  if (!isOpen) return null;

  const quarterfinalHorses = session.rounds[0].horses;

  return (
    <div
      className="absolute inset-0 z-[90] flex items-center justify-center"
      style={{ background: 'rgba(5, 3, 15, 0.88)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative"
        style={{
          width: '360px',
          maxHeight: '95vh',
          background: 'linear-gradient(180deg, #1A1535 0%, #0D0B1A 100%)',
          border: `1px solid ${neonPurple}60`,
          borderRadius: '14px',
          boxShadow: `0 0 30px ${neonPurple}40, 0 0 60px ${neonCyan}20, inset 0 0 20px ${neonPurple}15`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHudBackground accentColor={neonPurple} accentColor2={neonPink} />

        <div className="relative" style={{ zIndex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* 顶部状态栏 */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span style={{ ...neonText, fontSize: '12px', color: neonCyan, letterSpacing: '2px', textShadow: `0 0 8px ${neonCyan}, 0 0 16px ${neonCyan}40` }}>
              🏇 末日赛马
            </span>
            <div className="flex items-center gap-2">
              <span style={{ ...neonText, fontSize: '9px', color: neonYellow, fontWeight: 700, textShadow: `0 0 6px ${neonYellow}80` }}>
                🪙 {playerGold}
              </span>
              <button
                onClick={onClose}
                style={{ ...neonText, fontSize: '13px', color: '#8B80A0', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = neonRed; e.currentTarget.style.textShadow = `0 0 6px ${neonRed}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#8B80A0'; e.currentTarget.style.textShadow = 'none'; }}
              >✕</button>
            </div>
          </div>

          {/* 固定状态框：晋级情况 + 倒计时 + 押中特效文字 */}
          <div
            className="shrink-0 mb-2"
            style={{
              background: 'linear-gradient(90deg, rgba(10,8,20,0.9), rgba(26,21,53,0.85), rgba(10,8,20,0.9))',
              border: `1px solid ${statusColor}40`,
              borderRadius: '8px',
              padding: '6px 10px',
              boxShadow: statusGlow
                ? `0 0 14px ${statusColor}35, inset 0 0 10px ${statusColor}12`
                : `inset 0 0 6px ${neonCyan}08`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              transition: 'all 0.3s ease',
            }}
          >
            {/* 轮次进度指示（晋级情况） */}
            <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
              {[1, 2, 3].map(r => {
                const isDone = currentRound > r - 1 || (phase === 'finished');
                const isCurrent = (phase === 'countdown' || phase === 'racing') && currentRound + 1 === r;
                const isHighlight = phase === 'highlight' && currentRound === r - 1;
                const active = isCurrent || isHighlight || (r === 3 && phase === 'finished');
                return (
                  <span
                    key={r}
                    style={{
                      ...neonText,
                      fontSize: '7px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      color: active ? neonYellow : isDone ? neonGreen : '#5A5A7A',
                      background: active ? `${neonYellow}20` : isDone ? `${neonGreen}10` : 'transparent',
                      border: `1px solid ${active ? `${neonYellow}60` : isDone ? `${neonGreen}40` : '#3A3A4A'}`,
                      textShadow: active ? `0 0 4px ${neonYellow}` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >{ROUND_LABELS[r]}</span>
                );
              })}
            </div>
            {/* 状态文案（押中晋级/未晋级特效） */}
            <span
              style={{
                ...neonText,
                fontSize: '10px',
                fontWeight: 700,
                color: statusColor,
                textShadow: statusGlow ? `0 0 8px ${statusColor}` : 'none',
                animation: statusAnim || 'none',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
              }}
            >{statusText}</span>
          </div>

          {/* 上方比赛区域：二叉树可视化 */}
          <div
            className="shrink-0 mb-2 relative"
            style={{
              background: 'linear-gradient(180deg, rgba(10,8,20,0.9), rgba(26,21,53,0.7))',
              border: `1px solid ${neonCyan}40`,
              borderRadius: '10px',
              padding: '12px',
              height: '260px',
              overflow: 'visible',
              boxShadow: `0 0 20px ${neonCyan}15, inset 0 0 14px ${neonPurple}12`,
            }}
          >
            {/* 四角科技装饰 */}
            <span style={{ position: 'absolute', top: '2px', left: '2px', width: '8px', height: '8px', borderTop: `1.5px solid ${neonCyan}`, borderLeft: `1.5px solid ${neonCyan}`, opacity: 0.7, pointerEvents: 'none' }} />
            <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderTop: `1.5px solid ${neonCyan}`, borderRight: `1.5px solid ${neonCyan}`, opacity: 0.7, pointerEvents: 'none' }} />
            <span style={{ position: 'absolute', bottom: '2px', left: '2px', width: '8px', height: '8px', borderBottom: `1.5px solid ${neonCyan}`, borderLeft: `1.5px solid ${neonCyan}`, opacity: 0.7, pointerEvents: 'none' }} />
            <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '8px', height: '8px', borderBottom: `1.5px solid ${neonCyan}`, borderRight: `1.5px solid ${neonCyan}`, opacity: 0.7, pointerEvents: 'none' }} />
            <BracketTree
              session={session}
              phase={phase}
              currentRound={currentRound}
            />
          </div>

          {/* 下方内容区 - 始终显示下注情况 */}
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingRight: '2px', paddingTop: '8px' }}>
              <div>
                {/* 下注区：单行不换行 */}
                <div className="mb-2">
                  <div style={{ ...neonText, fontSize: '8px', color: '#8B80A0', marginBottom: '4px', letterSpacing: '1px' }}>
                    ▸ 下注区（点击选中，下方加注）
                  </div>
                  <div className="flex" style={{ gap: '1px', flexWrap: 'nowrap', overflowX: 'auto', justifyContent: 'center' }}>
                    {quarterfinalHorses.map(horse => {
                      const bet = bets[horse.id] || 0;
                      const isSelected = selectedHorse === horse.id;
                      const canBet = phase === 'betting' || phase === 'finished';
                      return (
                        <button
                          key={horse.id}
                          onClick={() => canBet && setSelectedHorse(isSelected ? null : horse.id)}
                          style={{
                            flex: '0 0 auto',
                            width: '40px',
                            padding: '1px 0',
                            background: isSelected ? `${horse.color}30` : bet > 0 ? `${horse.color}15` : 'rgba(19, 16, 37, 0.6)',
                            border: `1px solid ${isSelected ? horse.color : bet > 0 ? `${horse.color}60` : 'rgba(100,100,130,0.3)'}`,
                            borderRadius: '5px',
                            cursor: canBet ? 'pointer' : 'default',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0',
                            boxShadow: isSelected ? `0 0 10px ${horse.color}80` : bet > 0 ? `0 0 6px ${horse.color}40` : 'none',
                            transition: 'all 0.15s ease',
                            opacity: 1,
                          }}
                        >
                          <CyberHorseIcon variant={horse.id} color={horse.color} size={24} />
                          <span style={{ ...neonText, fontSize: '5.5px', color: horse.color, lineHeight: 1, marginTop: '1px' }}>{horse.name.slice(0, 4)}</span>
                          <span style={{ ...neonText, fontSize: '5px', color: '#8B80A0', lineHeight: 1 }}>X{horse.odds}</span>
                          <span style={{ ...neonText, fontSize: '6px', color: neonYellow, fontWeight: 700, lineHeight: 1 }}>
                            {bet}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 加注按钮（一组，作用于选中马匹） */}
                <div
                  className="mb-2 p-2"
                  style={{
                    background: 'rgba(10, 8, 20, 0.6)',
                    border: `1px solid ${neonPurple}40`,
                    borderRadius: '8px',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ ...neonText, fontSize: '8px', color: neonPurple }}>
                      {selectedHorse !== null
                        ? `加注：${HORSE_PRESETS[selectedHorse]?.name}`
                        : '请先选择一匹马'}
                    </span>
                    <span style={{ ...neonText, fontSize: '8px', color: '#8B80A0' }}>
                      单匹最高 {BET_MAX}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {BET_PRESETS.map(amt => {
                      const horse = selectedHorse !== null ? HORSE_PRESETS[selectedHorse] : null;
                      const currentBet = selectedHorse !== null ? (bets[selectedHorse] || 0) : 0;
                      const themeColor = horse?.color || neonPurple;
                      const addDisabled = selectedHorse === null || phase !== 'betting' || playerGold < currentBet + amt;
                      const subDisabled = selectedHorse === null || phase !== 'betting' || currentBet <= 0;
                      const label = amt >= 1000 ? `${amt / 1000}k` : amt;
                      return (
                        <React.Fragment key={amt}>
                          <button
                            onClick={() => selectedHorse !== null && handlePresetBet(selectedHorse, amt)}
                            disabled={addDisabled}
                            style={{
                              flex: 1,
                              padding: '4px 0',
                              background: addDisabled ? 'rgba(100,100,130,0.15)' : `${themeColor}20`,
                              border: `1px solid ${addDisabled ? 'rgba(100,100,130,0.3)' : `${themeColor}60`}`,
                              borderRadius: '4px',
                              ...neonText,
                              fontSize: '9px',
                              color: addDisabled ? '#5A5A7A' : themeColor,
                              cursor: addDisabled ? 'not-allowed' : 'pointer',
                              fontWeight: 700,
                            }}
                          >
                            +{label}
                          </button>
                          <button
                            onClick={() => selectedHorse !== null && handlePresetBet(selectedHorse, -amt)}
                            disabled={subDisabled}
                            style={{
                              width: '24px',
                              padding: '4px 0',
                              background: subDisabled ? 'rgba(100,100,130,0.1)' : `${neonRed}20`,
                              border: `1px solid ${subDisabled ? 'rgba(100,100,130,0.25)' : `${neonRed}60`}`,
                              borderRadius: '4px',
                              ...neonText,
                              fontSize: '9px',
                              color: subDisabled ? '#4A4A6A' : neonRed,
                              cursor: subDisabled ? 'not-allowed' : 'pointer',
                              fontWeight: 700,
                            }}
                          >
                            -{label}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* 下注统计 + 开始/清空按钮 */}
                <div
                  className="p-2"
                  style={{
                    background: 'linear-gradient(180deg, rgba(10,8,20,0.7), rgba(26,21,53,0.5))',
                    border: `1px solid ${neonCyan}35`,
                    borderRadius: '8px',
                    boxShadow: `inset 0 0 10px ${neonCyan}10`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ ...neonText, fontSize: '9px', color: '#8B80A0' }}>总下注</span>
                    <span style={{ ...neonText, fontSize: '11px', color: neonYellow, fontWeight: 700, textShadow: `0 0 6px ${neonYellow}80` }}>
                      🪙 {totalBet}
                    </span>
                  </div>
                  {/* 中奖情况 */}
                  <div
                    className="flex items-center justify-between mb-2"
                    style={{
                      padding: '4px 8px',
                      background: phase === 'finished'
                        ? (goldWon > 0 ? `${neonYellow}18` : `${neonRed}12`)
                        : 'rgba(10,8,20,0.4)',
                      border: `1px solid ${phase === 'finished' ? (goldWon > 0 ? `${neonYellow}50` : `${neonRed}40`) : `${neonCyan}20`}`,
                      borderRadius: '5px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <span style={{ ...neonText, fontSize: '9px', color: '#8B80A0' }}>中奖情况</span>
                    <span
                      style={{
                        ...neonText,
                        fontSize: '10px',
                        fontWeight: 700,
                        color: phase === 'finished'
                          ? (goldWon > 0 ? neonYellow : neonRed)
                          : neonCyan,
                        textShadow: phase === 'finished' && goldWon > 0 ? `0 0 8px ${neonYellow}` : 'none',
                        animation: phase === 'finished' && goldWon > 0 ? 'race-result-pop 0.5s ease-out' : 'none',
                      }}
                    >
                      {phase !== 'finished'
                        ? '比赛中'
                        : goldWon > 0
                          ? `中奖 🪙 ${goldWon}`
                          : '未中奖'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={handleClearBets}
                      disabled={phase !== 'betting' || totalBet <= 0}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        background: phase === 'betting' && totalBet > 0 ? `${neonRed}15` : 'rgba(100,100,130,0.15)',
                        border: `1px solid ${phase === 'betting' && totalBet > 0 ? neonRed + '60' : '#5A5A7A'}`,
                        borderRadius: '5px',
                        ...neonText,
                        fontSize: '10px',
                        fontWeight: 700,
                        color: phase === 'betting' && totalBet > 0 ? neonRed : '#8B80A0',
                        cursor: phase === 'betting' && totalBet > 0 ? 'pointer' : 'not-allowed',
                      }}
                    >
                      清空
                    </button>
                    {phase === 'finished' ? (
                      <button
                        onClick={resetRace}
                        style={{
                          flex: 2,
                          padding: '6px 0',
                          background: `linear-gradient(180deg, ${neonCyan}28, ${neonCyan}10)`,
                          border: `1px solid ${neonCyan}80`,
                          borderRadius: '5px',
                          ...neonText,
                          fontSize: '11px',
                          fontWeight: 700,
                          color: neonCyan,
                          cursor: 'pointer',
                          boxShadow: `0 0 14px ${neonCyan}50, inset 0 0 8px ${neonCyan}20`,
                          textShadow: `0 0 6px ${neonCyan}`,
                        }}
                      >
                        再来一局
                      </button>
                    ) : (
                      <button
                        onClick={handleStartRace}
                        disabled={phase !== 'betting' || totalBet <= 0}
                        style={{
                          flex: 2,
                          padding: '6px 0',
                          background: phase === 'betting' && totalBet > 0
                            ? `linear-gradient(180deg, ${neonCyan}28, ${neonCyan}10)`
                            : 'rgba(100,100,130,0.15)',
                          border: `1px solid ${phase === 'betting' && totalBet > 0 ? neonCyan : '#5A5A7A'}`,
                          borderRadius: '5px',
                          ...neonText,
                          fontSize: '11px',
                          fontWeight: 700,
                          color: phase === 'betting' && totalBet > 0 ? neonCyan : '#8B80A0',
                          cursor: phase === 'betting' && totalBet > 0 ? 'pointer' : 'not-allowed',
                          boxShadow: phase === 'betting' && totalBet > 0 ? `0 0 14px ${neonCyan}50, inset 0 0 8px ${neonCyan}20` : 'none',
                          textShadow: phase === 'betting' && totalBet > 0 ? `0 0 6px ${neonCyan}` : 'none',
                        }}
                      >
                        {phase === 'betting' ? '开始赛马' : '比赛中...'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="absolute left-1/2"
            style={{
              top: '40%', transform: 'translateX(-50%)',
              padding: '6px 14px',
              background: `${toast.color}E0`,
              border: `1px solid ${toast.color}`,
              borderRadius: '6px',
              ...neonText, fontSize: '10px', color: '#FFFFFF',
              zIndex: 10, boxShadow: `0 0 14px ${toast.color}80`,
              pointerEvents: 'none', whiteSpace: 'nowrap',
            }}
          >{toast.text}</div>
        )}
      </div>

      <style>{`
        @keyframes horse-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes race-countdown-tick {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes race-spin-text {
          0% { opacity: 0.45; }
          50% { opacity: 1; }
          100% { opacity: 0.45; }
        }
        @keyframes race-win-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.08); filter: brightness(1.4); }
        }
        @keyframes race-result-pop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes race-champion-shine {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 8px currentColor); }
          50% { filter: brightness(1.4) drop-shadow(0 0 16px currentColor); }
        }
      `}</style>
    </div>
  );
}

// ===== 二叉树可视化 =====
function BracketTree({
  session,
  phase,
  currentRound,
}: {
  session: RaceSession;
  phase: Phase;
  currentRound: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const [lineSolid, setLineSolid] = useState<boolean[]>([]);

  const r1 = session.rounds[0]; // 8进4
  const r2 = session.rounds[1]; // 4进2
  const r3 = session.rounds[2]; // 决赛

  const registerBoxRef = (key: string) => (el: HTMLDivElement | null) => {
    if (el) {
      boxRefs.current.set(key, el);
    } else {
      boxRefs.current.delete(key);
    }
  };

  // 计算连接线的路径（决赛r3在上，4进2 r2在中，8进4 r1在下；从下往上连线 r1→r2→r3）
  useEffect(() => {
    const calculatePaths = () => {
      const paths: { d: string; solid: boolean; childRound: number; childIdx: number }[] = [];
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();

      // 辅助：判断某轮某马是否晋级（胜者）
      const isAdvanced = (round: number, horse: Horse | undefined): boolean => {
        if (!horse) return false;
        return session.rounds[round].winners.some(w => w.id === horse.id);
      };

      // 连接 r3 -> champion（决赛胜者连到冠军）
      for (let i = 0; i < 2; i++) {
        const childKey = `r3-${i}`;
        const parentKey = `champion-0`;
        const childEl = boxRefs.current.get(childKey);
        const parentEl = boxRefs.current.get(parentKey);
        
        if (childEl && parentEl) {
          const cRect = childEl.getBoundingClientRect();
          const pRect = parentEl.getBoundingClientRect();
          
          const cX = cRect.left - containerRect.left + cRect.width / 2;
          const cY = cRect.top - containerRect.top;       // 子节点（r3）的顶部
          const pX = pRect.left - containerRect.left + pRect.width / 2;
          const pY = pRect.bottom - containerRect.top;    // 父节点（champion）的底部
          
          const midY = (cY + pY) / 2;
          const childHorse = r3.horses[i];
          const solid = isAdvanced(2, childHorse);
          paths.push({ d: `M ${cX} ${cY} L ${cX} ${midY} L ${pX} ${midY} L ${pX} ${pY}`, solid, childRound: 2, childIdx: i });
        }
      }

      // 连接 r2 -> r3（r2顶部 连到 r3底部，r3在r2上方）
      for (let i = 0; i < 4; i++) {
        const childKey = `r2-${i}`;
        const parentIdx = Math.floor(i / 2);
        const parentKey = `r3-${parentIdx}`;
        const childEl = boxRefs.current.get(childKey);
        const parentEl = boxRefs.current.get(parentKey);
        
        if (childEl && parentEl) {
          const cRect = childEl.getBoundingClientRect();
          const pRect = parentEl.getBoundingClientRect();
          
          const cX = cRect.left - containerRect.left + cRect.width / 2;
          const cY = cRect.top - containerRect.top;       // 子节点（r2）的顶部
          const pX = pRect.left - containerRect.left + pRect.width / 2;
          const pY = pRect.bottom - containerRect.top;    // 父节点（r3）的底部（r3在r2上方）
          
          const midY = (cY + pY) / 2;
          const childHorse = r2.horses[i];
          const solid = isAdvanced(1, childHorse);
          paths.push({ d: `M ${cX} ${cY} L ${cX} ${midY} L ${pX} ${midY} L ${pX} ${pY}`, solid, childRound: 1, childIdx: i });
        }
      }

      // 连接 r1 -> r2（r1顶部 连到 r2底部，r2在r1上方）
      for (let i = 0; i < 8; i++) {
        const childKey = `r1-${i}`;
        const parentIdx = Math.floor(i / 2);
        const parentKey = `r2-${parentIdx}`;
        const childEl = boxRefs.current.get(childKey);
        const parentEl = boxRefs.current.get(parentKey);
        
        if (childEl && parentEl) {
          const cRect = childEl.getBoundingClientRect();
          const pRect = parentEl.getBoundingClientRect();
          
          const cX = cRect.left - containerRect.left + cRect.width / 2;
          const cY = cRect.top - containerRect.top;       // 子节点（r1）的顶部
          const pX = pRect.left - containerRect.left + pRect.width / 2;
          const pY = pRect.bottom - containerRect.top;    // 父节点（r2）的底部（r2在r1上方）
          
          const midY = (cY + pY) / 2;
          const childHorse = r1.horses[i];
          const solid = isAdvanced(0, childHorse);
          paths.push({ d: `M ${cX} ${cY} L ${cX} ${midY} L ${pX} ${midY} L ${pX} ${pY}`, solid, childRound: 0, childIdx: i });
        }
      }

      setSvgPaths(paths.map(p => p.d));
      setLineSolid(paths.map(p => p.solid));
    };

    requestAnimationFrame(calculatePaths);
    window.addEventListener('resize', calculatePaths);
    return () => window.removeEventListener('resize', calculatePaths);
  }, [session, phase]);

  const getBoxState = (round: number, horseId: number) => {
    const winners = session.rounds[round].winners.map(w => w.id);
    const isWinner = winners.includes(horseId);
    const roundDone = session.rounds[round].status === 'done';
    // 如果当前正在进行该轮，那么该轮的马匹正在比赛
    const isCurrent = phase === 'racing' && currentRound === round;
    const isHighlight = phase === 'highlight' && currentRound === round;
    
    return {
      isWinner,
      isLoser: roundDone && !isWinner,
      isHighlight: isHighlight && isWinner,
      isCurrent,
    };
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
      {/* SVG 连接线（z-index高于盒子，确保可见） */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 5 }}
      >
        <defs>
          <filter id="race-line-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {svgPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={lineSolid[i] ? neonCyan : neonPurple}
            strokeWidth={lineSolid[i] ? '1.8' : '1'}
            opacity={lineSolid[i] ? '0.95' : '0.45'}
            strokeDasharray={lineSolid[i] ? 'none' : '3,3'}
            filter="url(#race-line-glow)"
            style={{ transition: 'all 0.4s ease' }}
          />
        ))}
      </svg>

      {/* 冠军层（最顶层，单格） */}
      <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <div ref={registerBoxRef('champion-0')} style={{ display: 'flex', justifyContent: 'center' }}>
          <HorseBox 
            horse={session.champion}
            isWinner={!!session.champion}
            isLoser={false}
            isHighlight={phase === 'finished'}
            isCurrent={false}
            size="champion"
            isChampion
          />
        </div>
      </div>

      {/* 决赛层（第2层） */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '124px', position: 'relative', zIndex: 1 }}>
        {Array.from({ length: 2 }, (_, idx) => {
          const horse = r3.horses[idx];
          const state = horse ? getBoxState(2, horse.id) : { isWinner: false, isLoser: false, isHighlight: false, isCurrent: false };
          return (
            <div ref={registerBoxRef(`r3-${idx}`)} key={`r3-${idx}`} style={{ display: 'flex', justifyContent: 'center' }}>
              <HorseBox 
                horse={horse} 
                {...state}
                size="large"
              />
            </div>
          );
        })}
      </div>

      {/* 4进2 层（中间层） */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', position: 'relative', zIndex: 1 }}>
        {Array.from({ length: 4 }, (_, idx) => {
          const horse = r2.horses[idx];
          const state = horse ? getBoxState(1, horse.id) : { isWinner: false, isLoser: false, isHighlight: false, isCurrent: false };
          return (
            <div ref={registerBoxRef(`r2-${idx}`)} key={`r2-${idx}`} style={{ display: 'flex', justifyContent: 'center' }}>
              <HorseBox 
                horse={horse} 
                {...state}
                size="medium"
              />
            </div>
          );
        })}
      </div>

      {/* 8进4 层（最底层，贴底部） */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
        {r1.horses.map((horse, idx) => {
          const state = horse ? getBoxState(0, horse.id) : { isWinner: false, isLoser: false, isHighlight: false, isCurrent: false };
          return (
            <div ref={registerBoxRef(`r1-${idx}`)} key={`r1-${idx}`} style={{ display: 'flex', justifyContent: 'center' }}>
              <HorseBox 
                horse={horse} 
                {...state}
                size="small"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== 赛博马匹 AI 贴图 =====
function CyberHorseIcon({ variant, color, size }: { variant: number; color: string; size: number }) {
  return (
    <img
      src={`/images/horse-${variant}.png`}
      alt={`马匹${variant}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'cover',
        objectPosition: 'center top',
        borderRadius: '4px',
        filter: `drop-shadow(0 0 3px ${color})`,
        display: 'block',
      }}
    />
  );
}

function HorseBox({ 
  horse, 
  isWinner = false,
  isLoser = false,
  isHighlight = false,
  isCurrent = false,
  size = 'small',
  isChampion = false,
}: {
  horse: Horse | undefined;
  isWinner?: boolean;
  isLoser?: boolean;
  isHighlight?: boolean;
  isCurrent?: boolean;
  size?: 'small' | 'medium' | 'large' | 'champion';
  isChampion?: boolean;
}) {
  const sizeMap = {
    small: { w: 30, h: 30, font: 13, nameLen: 2, nameFont: 6 },
    medium: { w: 30, h: 30, font: 12, nameLen: 3, nameFont: 5.5 },
    large: { w: 36, h: 36, font: 14, nameLen: 4, nameFont: 6 },
    champion: { w: 44, h: 44, font: 16, nameLen: 5, nameFont: 7 },
  };
  const s = sizeMap[size];

  if (!horse) {
    return (
      <div
        style={{
          width: `${s.w}px`,
          height: `${s.h}px`,
          background: 'radial-gradient(circle, rgba(30, 25, 55, 0.8), rgba(10, 8, 20, 0.6))',
          border: '1px dashed rgba(140, 130, 170, 0.4)',
          borderRadius: '5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6,
          boxShadow: 'inset 0 0 6px rgba(100,100,130,0.12)',
        }}
      >
        <span style={{ fontSize: '8px', opacity: 0.5, color: '#8B80A0' }}>?</span>
      </div>
    );
  }

  const glow = isHighlight;
  const hasResult = isWinner || isLoser;

  // 径向渐变背景（参考水果机格子）
  let bgColor = 'radial-gradient(circle, rgba(19, 16, 37, 0.7), rgba(10, 8, 20, 0.5))';
  if (isChampion && horse) bgColor = `radial-gradient(circle, ${horse.color}70, ${horse.color}25)`;
  else if (glow) bgColor = `radial-gradient(circle, ${horse.color}60, ${horse.color}20)`;
  else if (isWinner) bgColor = `radial-gradient(circle, ${horse.color}35, ${horse.color}10)`;
  else if (isLoser) bgColor = 'radial-gradient(circle, rgba(20, 15, 30, 0.95), rgba(10, 8, 20, 0.9))';

  let borderColor = 'rgba(100,100,130,0.3)';
  if (isChampion && horse) borderColor = horse.color;
  else if (glow) borderColor = horse.color;
  else if (isWinner) borderColor = `${horse.color}90`;
  else if (isLoser) borderColor = 'rgba(60, 50, 80, 0.4)';
  else if (isCurrent) borderColor = `${neonPink}70`;

  let opacity = 1;
  if (isLoser) opacity = 0.3;
  else if (isWinner || isHighlight) opacity = 1;

  return (
    <div
      className="flex flex-col items-center justify-center relative"
      style={{
        width: `${s.w}px`,
        height: `${s.h}px`,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        opacity,
        transition: 'all 0.4s ease',
        boxShadow: isChampion && horse
          ? `0 0 22px ${horse.color}, 0 0 44px ${horse.color}70, inset 0 0 14px ${horse.color}60`
          : glow
          ? `0 0 16px ${horse.color}, 0 0 28px ${horse.color}50, inset 0 0 10px ${horse.color}40`
          : isWinner
            ? `0 0 10px ${horse.color}70, inset 0 0 6px ${horse.color}25`
            : isCurrent
              ? `0 0 8px ${neonPink}50`
              : 'none',
        padding: '1px',
        animation: isChampion && glow ? 'race-champion-shine 2s ease-in-out infinite' : 'none',
      }}
      title={horse.name}
    >
      <CyberHorseIcon variant={horse.id} color={horse.color} size={s.font + 4} />
      {size === 'champion' && (
        <span style={{
          ...neonText,
          fontSize: `${s.nameFont}px`,
          color: horse.color,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          marginTop: '1px',
          textShadow: (isWinner || glow || isChampion) ? `0 0 5px ${horse.color}` : 'none',
        }}>
          {horse.name.slice(0, s.nameLen)}
        </span>
      )}
      {glow && (
        <div
          className="absolute inset-0"
          style={{
            borderRadius: '6px',
            border: `2px solid ${horse.color}`,
            animation: 'horse-pulse 0.8s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
      {isCurrent && !hasResult && (
        <div
          className="absolute inset-0"
          style={{
            borderRadius: '6px',
            border: `1px dashed ${neonPink}90`,
            animation: 'horse-pulse 1s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
