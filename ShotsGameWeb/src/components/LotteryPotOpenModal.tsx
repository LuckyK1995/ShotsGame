import { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { neonPink, neonYellow, neonText } from '../theme/colors';
import { ModalShell } from './ModalShell';

interface EngineRef {
  current: {
    openLotteryPot: () => Promise<{
      type: 'gold' | 'exp' | 'item';
      icon: string;
      name: string;
      color: string;
      amount: number;
      itemId?: string;
    } | null>;
    getLotteryPotCount: () => number;
  } | null;
}

interface LotteryPotOpenModalProps {
  engineRef: EngineRef;
  isOpen: boolean;
  onClose: () => void;
}

const REWARDS = GameEngine.LOTTERY_POT_REWARDS;

type Reward = Awaited<ReturnType<NonNullable<EngineRef['current']>['openLotteryPot']>>;

const MAX_RETRY_MS = 5000;
const RETRY_INTERVAL_MS = 100;

export function LotteryPotOpenModal({ engineRef, isOpen, onClose }: LotteryPotOpenModalProps) {
  const [phase, setPhase] = useState<'opening' | 'revealed'>('opening');
  const [progress, setProgress] = useState(0);
  const [cyclingIdx, setCyclingIdx] = useState(0);
  const [reward, setReward] = useState<Reward>(null);
  const [potCount, setPotCount] = useState(0);

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iconTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOpenRef = useRef(isOpen);
  const phaseRef = useRef(phase);
  const onCloseRef = useRef(onClose);

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const clearTimers = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (iconTimerRef.current) {
      clearInterval(iconTimerRef.current);
      iconTimerRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const startOpening = useCallback(() => {
    if (!isOpenRef.current) return;

    if (!engineRef.current) {
      const startTs = Date.now();
      const tryEngine = () => {
        if (!isOpenRef.current) return;
        if (engineRef.current) {
          startOpening();
        } else if (Date.now() - startTs < MAX_RETRY_MS) {
          retryTimerRef.current = setTimeout(tryEngine, RETRY_INTERVAL_MS);
        } else {
          onCloseRef.current();
        }
      };
      retryTimerRef.current = setTimeout(tryEngine, RETRY_INTERVAL_MS);
      return;
    }

    if (engineRef.current.getLotteryPotCount() <= 0) {
      onCloseRef.current();
      return;
    }

    clearTimers();
    setPhase('opening');
    setProgress(0);
    setReward(null);

    let prog = 0;
    let safetyMs = 0;
    let resolving = false; // 防止 progress 到 100 后多次触发异步领取
    progressTimerRef.current = setInterval(() => {
      if (!resolving) {
        prog += 2;
        safetyMs += 50;
      }
      if (!resolving && (prog >= 100 || safetyMs >= 15000)) {
        prog = 100;
        resolving = true;
        setProgress(100);
        // 停止进度推进，但保留 icon 循环动画，等待异步结果返回
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
        // 异步调用 openLotteryPot，结果到达后揭晓
        void (async () => {
          let result: Reward = null;
          try {
            if (engineRef.current) result = await engineRef.current.openLotteryPot();
          } catch (e) { /* engine error: still reveal fallback */ }
          if (!isOpenRef.current) return;
          setReward(result);
          setPotCount(engineRef.current ? engineRef.current.getLotteryPotCount() : 0);
          setPhase('revealed');
          // 异步结果返回后再清理 icon 循环动画
          if (iconTimerRef.current) {
            clearInterval(iconTimerRef.current);
            iconTimerRef.current = null;
          }
        })();
      }
      if (!resolving) setProgress(prog);
    }, 50);

    let lastIdx = Math.floor(Math.random() * REWARDS.length);
    setCyclingIdx(lastIdx);
    iconTimerRef.current = setInterval(() => {
      let next = lastIdx;
      while (next === lastIdx && REWARDS.length > 1) {
        next = Math.floor(Math.random() * REWARDS.length);
      }
      lastIdx = next;
      setCyclingIdx(next);
    }, 80);
  }, [engineRef, clearTimers]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      if (engineRef.current) setPotCount(engineRef.current.getLotteryPotCount());
      startOpening();
    } else {
      clearTimers();
    }
    return () => clearTimers();
  }, [isOpen, startOpening, clearTimers, engineRef]);

  if (!isOpen) return null;

  const cycling = REWARDS[cyclingIdx];

  const rewardAmountText = reward
    ? reward.type === 'gold'
      ? `+${reward.amount}`
      : reward.type === 'exp'
        ? `+${reward.amount} 经验`
        : `x${reward.amount}`
    : '';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-[90]"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={() => { if (phase === 'revealed') onClose(); }}
    >
      <ModalShell
        accentColor={neonYellow}
        accentColor2={neonPink}
        width={260}
        style={{ padding: '20px' }}
      >
        <div className="flex flex-col items-center mb-3">
          <h2 style={{ ...neonText, fontSize: '14px', color: neonYellow, textShadow: `0 0 8px ${neonYellow}60` }}>
            🫙 抽奖罐
          </h2>
          <p style={{ ...neonText, fontSize: '8px', color: '#8B80A0', marginTop: '4px', letterSpacing: '0.5px' }}>
            {phase === 'opening' ? '开启中...' : `剩余 ${potCount} 个`}
          </p>
        </div>

        <div className="flex flex-col items-center mb-3" style={{ minHeight: '120px' }}>
          {phase === 'opening' ? (
            <>
              <div
                style={{
                  fontSize: '36px',
                  lineHeight: 1,
                  filter: `drop-shadow(0 0 12px ${neonYellow}80)`,
                  animation: 'lottery-pot-shake 0.18s infinite',
                  marginBottom: '8px',
                }}
              >🫙</div>
              <div
                style={{
                  width: '130px',
                  height: '64px',
                  background: 'rgba(10, 8, 20, 0.85)',
                  border: `1.5px solid ${cycling.color}80`,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 14px ${cycling.color}40, inset 0 0 10px ${cycling.color}20`,
                  transition: 'border-color 0.05s, box-shadow 0.05s',
                }}
              >
                <div style={{ fontSize: '24px', lineHeight: 1, color: cycling.color, textShadow: `0 0 8px ${cycling.color}` }}>
                  {cycling.icon}
                </div>
                <div style={{ ...neonText, fontSize: '7px', color: cycling.color, marginTop: '3px', fontWeight: 700 }}>
                  {cycling.name}
                </div>
              </div>
            </>
          ) : (
            reward ? (
              <div style={{ animation: 'lottery-pot-reveal 0.5s ease-out' }}>
                <div
                  style={{
                    width: '130px',
                    height: '90px',
                    background: `linear-gradient(180deg, ${reward.color}25, ${reward.color}08)`,
                    border: `1.5px solid ${reward.color}`,
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 20px ${reward.color}80, inset 0 0 12px ${reward.color}40`,
                  }}
                >
                  <div style={{ fontSize: '30px', lineHeight: 1, filter: `drop-shadow(0 0 10px ${reward.color})`, color: reward.color }}>
                    {reward.icon}
                  </div>
                  <div style={{ ...neonText, fontSize: '8px', color: reward.color, marginTop: '4px', fontWeight: 700, textShadow: `0 0 6px ${reward.color}` }}>
                    {reward.name}
                  </div>
                  <div style={{ ...neonText, fontSize: '11px', color: '#FFFFFF', marginTop: '2px', fontWeight: 700, textShadow: `0 0 6px ${reward.color}` }}>
                    {rewardAmountText}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ ...neonText, fontSize: '10px', color: '#FF6B6B', textAlign: 'center', lineHeight: 2 }}>
                没有抽奖罐了
              </div>
            )
          )}
        </div>

        {phase === 'opening' && (
          <div className="mb-3" style={{ width: '100%' }}>
            <div
              style={{
                height: '8px',
                background: 'rgba(10, 8, 20, 0.8)',
                border: `1px solid ${neonYellow}40`,
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${neonYellow}, ${neonPink})`,
                  boxShadow: `0 0 8px ${neonYellow}80`,
                  transition: 'width 0.05s linear',
                }}
              />
            </div>
          </div>
        )}

        {phase === 'revealed' && (
          <div className="flex gap-2.5">
            {potCount > 0 && (
              <button
                style={{
                  flex: 1,
                  background: 'rgba(255, 230, 0, 0.15)',
                  border: `1px solid ${neonYellow}50`,
                  borderRadius: '8px',
                  ...neonText,
                  fontSize: '11px',
                  color: neonYellow,
                  boxShadow: `0 0 10px ${neonYellow}20`,
                  padding: '8px 0',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 230, 0, 0.28)';
                  e.currentTarget.style.boxShadow = `0 0 16px ${neonYellow}45`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 230, 0, 0.15)';
                  e.currentTarget.style.boxShadow = `0 0 10px ${neonYellow}20`;
                }}
                onClick={startOpening}
              >再开一个</button>
            )}
            <button
              style={{
                flex: 1,
                background: 'rgba(100, 100, 130, 0.15)',
                border: '1px solid rgba(150, 150, 180, 0.35)',
                borderRadius: '8px',
                ...neonText,
                fontSize: '11px',
                color: '#A0A0B8',
                padding: '8px 0',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(100, 100, 130, 0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(100, 100, 130, 0.15)'; }}
              onClick={onClose}
            >关闭</button>
          </div>
        )}

        <style>{`
          @keyframes lottery-pot-shake {
            0% { transform: rotate(-3deg) scale(1); }
            25% { transform: rotate(3deg) scale(1.02); }
            50% { transform: rotate(-2deg) scale(0.98); }
            75% { transform: rotate(2deg) scale(1.01); }
            100% { transform: rotate(-3deg) scale(1); }
          }
          @keyframes lottery-pot-reveal {
            0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
            60% { transform: scale(1.15) rotate(2deg); opacity: 1; }
            100% { transform: scale(1) rotate(0); opacity: 1; }
          }
        `}</style>
      </ModalShell>
    </div>
  );
}
