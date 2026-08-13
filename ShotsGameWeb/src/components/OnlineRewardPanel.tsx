import { useState, useEffect, useCallback, useRef } from 'react';
import { getItemDef } from '../game/data/equipment';
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonText } from '../theme/colors';
import { ModalHudBackground } from './ModalHudBackground';

interface EngineRef {
  current: {
    claimOnlineReward: () => Promise<{ success: boolean; tier: number; rewards: { itemId: string; count: number; gold: number } }>;
    getOnlineRewardStatus: () => { minutes: number; seconds: number; claimed: number; canClaim: boolean; nextClaimMinutes: number };
    refreshOnlineRewardFromServer?: () => Promise<void>;
  } | null;
}

interface OnlineRewardPanelProps {
  engineRef: EngineRef;
  isOpen: boolean;
  onClose: () => void;
}

const ONLINE_REWARDS = [
  { tier: 1, itemId: 'health_potion', count: 5, gold: 300, icon: '❤️', requiredMinutes: 30 },
  { tier: 2, itemId: 'attack_boost', count: 3, gold: 500, icon: '💪', requiredMinutes: 60 },
  { tier: 3, itemId: 'bomb', count: 3, gold: 800, icon: '💣', requiredMinutes: 90 },
  { tier: 4, itemId: 'health_potion_fine', count: 5, gold: 1500, icon: '💛', requiredMinutes: 120 },
];

export function OnlineRewardPanel({ engineRef, isOpen, onClose }: OnlineRewardPanelProps) {
  const [status, setStatus] = useState<{ minutes: number; seconds: number; claimed: number; canClaim: boolean; nextClaimMinutes: number }>({
    minutes: 0, seconds: 0, claimed: 0, canClaim: false, nextClaimMinutes: 30,
  });
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshStatus = useCallback(() => {
    if (engineRef.current) {
      setStatus(engineRef.current.getOnlineRewardStatus());
    }
  }, [engineRef]);

  useEffect(() => {
    if (isOpen) {
      void engineRef.current?.refreshOnlineRewardFromServer?.().then(() => refreshStatus());
      timerRef.current = setInterval(refreshStatus, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, refreshStatus, engineRef]);

  if (!isOpen) return null;

  const handleClaim = async () => {
    if (!engineRef.current) return;
    try {
      const result = await engineRef.current.claimOnlineReward();
      if (result.success) {
        const itemDef = getItemDef(result.rewards.itemId);
        const parts: string[] = [];
        if (result.rewards.itemId && result.rewards.count > 0) {
          parts.push(`${itemDef?.name || result.rewards.itemId} x${result.rewards.count}`);
        }
        if (result.rewards.gold > 0) parts.push(`${result.rewards.gold}金币`);
        setToast(parts.length > 0 ? `奖励已发送至邮箱：${parts.join('、')}` : '奖励已发送至邮箱');
        setTimeout(() => setToast(null), 2200);
      } else {
        setToast('暂不可领取');
        setTimeout(() => setToast(null), 1500);
      }
      refreshStatus();
    } catch (e) {
      setToast('领取失败，请重试');
      setTimeout(() => setToast(null), 1500);
      refreshStatus();
    }
  };

  const formatMinutes = (m: number, s: number = 0) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h > 0) return `${h}时${min}分${s}秒`;
    return `${min}分${s}秒`;
  };

  const progressPercent = status.nextClaimMinutes > 0
    ? Math.min(100, ((status.minutes * 60 + status.seconds) / (status.nextClaimMinutes * 60)) * 100)
    : 100;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(5, 3, 15, 0.88)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col mx-auto"
        style={{
          width: '300px',
          height: '440px',
          background: 'rgba(19, 16, 37, 0.95)',
          border: `1px solid ${neonCyan}50`,
          borderRadius: '14px',
          boxShadow: `0 0 30px ${neonCyan}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHudBackground accentColor={neonCyan} accentColor2={neonYellow} />

        <div className="relative flex flex-col flex-1 min-h-0" style={{ zIndex: 1, padding: '10px 10px' }}>
          {/* 头部 */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span style={{ ...neonText, fontSize: '13px', color: neonCyan, letterSpacing: '2px' }}>
              ⏱️ 在线奖励
            </span>
            <button
              onClick={onClose}
              style={{ ...neonText, fontSize: '14px', color: '#8B80A0', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
            >✕</button>
          </div>

          {/* 在线时间 + 进度 */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-1">
              <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>在线</span>
              <span style={{ ...neonText, fontSize: '11px', color: neonYellow, fontWeight: 700 }}>
                {formatMinutes(status.minutes, status.seconds)}
              </span>
            </div>
            <span style={{ ...neonText, fontSize: '7px', color: neonPurple }}>
              已领 {status.claimed}/4
            </span>
          </div>

          {/* 进度条 */}
          {status.claimed < 4 && (
            <div className="mb-2 shrink-0">
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(19, 16, 37, 0.8)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  border: `1px solid ${neonPurple}30`,
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${neonPurple}, ${neonCyan})`,
                    borderRadius: '2px',
                    boxShadow: `0 0 6px ${neonCyan}60`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div style={{ ...neonText, fontSize: '6px', color: '#5A5A7A', marginTop: '2px', textAlign: 'center' }}>
                距下次领取 {Math.max(0, status.nextClaimMinutes - status.minutes - 1)}分{60 - status.seconds}秒
              </div>
            </div>
          )}

          {/* 4档奖励列表 */}
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <div style={{ ...neonText, fontSize: '7px', color: '#5A5A7A', marginBottom: '4px', letterSpacing: '1px' }}>
              ▸ 在线时长奖励
            </div>
            <div className="flex flex-col gap-1.5">
              {ONLINE_REWARDS.map((reward) => {
                const isClaimed = status.claimed >= reward.tier;
                const isCurrent = status.claimed + 1 === reward.tier;
                const itemDef = getItemDef(reward.itemId);
                return (
                  <div
                    key={reward.tier}
                    className="flex items-center gap-2"
                    style={{
                      padding: '6px 8px',
                      background: isClaimed
                        ? `${neonGreen}10`
                        : isCurrent
                        ? `${neonCyan}15`
                        : 'rgba(13, 11, 26, 0.5)',
                      border: `1px solid ${isClaimed ? neonGreen + '50' : isCurrent ? neonCyan + '60' : 'rgba(100,100,130,0.2)'}`,
                      borderRadius: '6px',
                      opacity: isClaimed ? 0.5 : 1,
                    }}
                  >
                    <span style={{ fontSize: '16px', width: '18px', textAlign: 'center', filter: isClaimed ? 'grayscale(0.6)' : 'none' }}>
                      {isClaimed ? '✓' : reward.icon}
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>第{reward.tier}档</span>
                        <span style={{ ...neonText, fontSize: '7px', color: neonYellow }}>{formatMinutes(reward.requiredMinutes)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span style={{ ...neonText, fontSize: '8px', color: '#E0E0F0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {itemDef?.name || reward.itemId}
                        </span>
                        <span style={{ ...neonText, fontSize: '7px', color: neonCyan }}>x{reward.count}</span>
                        <span style={{ ...neonText, fontSize: '7px', color: neonYellow }}>+{reward.gold}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 领取按钮 */}
          <button
            onClick={handleClaim}
            disabled={!status.canClaim}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '7px 0',
              background: status.canClaim
                ? `${neonCyan}30`
                : status.claimed >= 4
                ? 'rgba(100,100,130,0.2)'
                : 'rgba(60,50,90,0.3)',
              border: `1px solid ${status.canClaim ? neonCyan : status.claimed >= 4 ? '#5A5A7A' : 'rgba(176,38,255,0.3)'}`,
              borderRadius: '6px',
              ...neonText, fontSize: '10px',
              color: status.canClaim ? neonCyan : '#8B80A0',
              cursor: status.canClaim ? 'pointer' : 'default',
              letterSpacing: '1px',
              boxShadow: status.canClaim ? `0 0 10px ${neonCyan}30` : 'none',
            }}
          >
            {status.claimed >= 4 ? '✓ 已全部领取' : status.canClaim ? '🎁 领取奖励' : `⏳ ${status.claimed}/4`}
          </button>

          <div className="text-center mt-1" style={{ ...neonText, fontSize: '6px', color: '#5A5A7A', letterSpacing: '0.5px' }}>
            每30分钟一档·奖励发送至邮箱领取
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="absolute left-1/2"
            style={{
              top: '30%', transform: 'translateX(-50%)',
              padding: '6px 14px',
              background: `${neonCyan}E0`,
              border: `1px solid ${neonCyan}`,
              borderRadius: '6px',
              ...neonText, fontSize: '9px', color: '#FFFFFF',
              zIndex: 10, boxShadow: `0 0 14px ${neonCyan}80`,
              pointerEvents: 'none', whiteSpace: 'nowrap', maxWidth: '280px',
            }}
          >{toast}</div>
        )}
      </div>
    </div>
  );
}
