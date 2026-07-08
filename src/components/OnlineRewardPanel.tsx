import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getItemDef } from '../game/data/equipment';
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonText } from '../theme/colors';

interface EngineRef {
  current: {
    claimOnlineReward: () => { success: boolean; tier: number; rewards: { itemId: string; count: number; gold: number } };
    getOnlineRewardStatus: () => { minutes: number; claimed: number; canClaim: boolean; nextClaimMinutes: number };
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
  const [status, setStatus] = useState<{ minutes: number; claimed: number; canClaim: boolean; nextClaimMinutes: number }>({
    minutes: 0, claimed: 0, canClaim: false, nextClaimMinutes: 30,
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
      refreshStatus();
      timerRef.current = setInterval(refreshStatus, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, refreshStatus]);

  if (!isOpen) return null;

  const handleClaim = () => {
    if (!engineRef.current) return;
    const result = engineRef.current.claimOnlineReward();
    if (result.success) {
      const itemDef = getItemDef(result.rewards.itemId);
      const msg = result.rewards.gold > 0
        ? `领取成功！${itemDef?.name || result.rewards.itemId} x${result.rewards.count} + ${result.rewards.gold}金币`
        : `领取成功！${itemDef?.name || result.rewards.itemId} x${result.rewards.count}`;
      setToast(msg);
      setTimeout(() => setToast(null), 2000);
    } else {
      setToast('暂不可领取');
      setTimeout(() => setToast(null), 1500);
    }
    refreshStatus();
  };

  const formatMinutes = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}时${min > 0 ? min + '分' : ''}` : `${min}分钟`;
  };

  const progressPercent = status.nextClaimMinutes > 0
    ? Math.min(100, (status.minutes / status.nextClaimMinutes) * 100)
    : 100;

  return (
    <div
      className="absolute left-0 right-0 z-50 flex items-center justify-center"
      style={{
        top: 0,
        bottom: 0,
        background: 'rgba(5, 3, 15, 0.85)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center"
        style={{
          width: '90%',
          maxWidth: 380,
          background: 'linear-gradient(180deg, #1A1535 0%, #0D0B1A 100%)',
          border: `1.5px solid ${neonPurple}60`,
          borderRadius: 16,
          boxShadow: `0 0 30px ${neonPurple}30, 0 0 60px ${neonCyan}10`,
          padding: '20px 16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between w-full mb-4">
          <span style={{ ...neonText, fontSize: 16, color: neonCyan, fontWeight: 700 }}>
            ⏱️ 在线奖励
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: `1px solid ${neonPurple}50`,
              borderRadius: 6,
              color: '#8A7FA8',
              fontSize: 12,
              padding: '2px 8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ✕
          </button>
        </div>

        {/* 在线时间显示 */}
        <div className="w-full mb-4" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: '#8A7FA8', ...neonText }}>当前在线 </span>
          <span style={{ fontSize: 20, color: neonYellow, ...neonText, fontWeight: 700 }}>
            {formatMinutes(status.minutes)}
          </span>
        </div>

        {/* 4档奖励格子 */}
        <div className="grid grid-cols-2 gap-2 w-full mb-4">
          {ONLINE_REWARDS.map((reward) => {
            const isClaimed = status.claimed >= reward.tier;
            const isCurrent = status.claimed + 1 === reward.tier;
            const isLocked = status.claimed + 1 < reward.tier;
            const itemDef = getItemDef(reward.itemId);

            return (
              <div
                key={reward.tier}
                className="flex flex-col items-center"
                style={{
                  background: isClaimed
                    ? `linear-gradient(180deg, ${neonGreen}15 0%, ${neonGreen}08 100%)`
                    : isCurrent
                    ? `linear-gradient(180deg, ${neonPurple}20 0%, ${neonCyan}08 100%)`
                    : 'rgba(19, 16, 37, 0.6)',
                  border: `1.5px solid ${isClaimed ? neonGreen + '80' : isCurrent ? neonCyan + '60' : 'rgba(176, 38, 255, 0.15)'}`,
                  borderRadius: 10,
                  padding: '10px 6px',
                  opacity: isLocked ? 0.5 : 1,
                }}
              >
                <div style={{ fontSize: 9, color: '#8A7FA8', ...neonText, marginBottom: 2 }}>
                  第{reward.tier}档 · {formatMinutes(reward.requiredMinutes)}
                </div>
                <span style={{ fontSize: 24, filter: isClaimed ? 'grayscale(0.5)' : 'none' }}>
                  {isClaimed ? '✅' : reward.icon}
                </span>
                <span style={{ fontSize: 9, color: neonCyan, ...neonText, marginTop: 2, textAlign: 'center' }}>
                  {itemDef?.name || reward.itemId}
                </span>
                <span style={{ fontSize: 8, color: neonYellow, ...neonText }}>
                  x{reward.count} + {reward.gold}💰
                </span>
              </div>
            );
          })}
        </div>

        {/* 进度条 */}
        {status.claimed < 4 && (
          <div className="w-full mb-3">
            <div
              style={{
                width: '100%',
                height: 6,
                background: 'rgba(19, 16, 37, 0.8)',
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${neonPurple}30`,
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${neonPurple}, ${neonCyan})`,
                  borderRadius: 3,
                  boxShadow: `0 0 8px ${neonCyan}60`,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <div style={{ fontSize: 8, color: '#6A6480', ...neonText, marginTop: 2, textAlign: 'center' }}>
              距离下次领取还需 {Math.max(0, status.nextClaimMinutes - status.minutes)} 分钟
            </div>
          </div>
        )}

        {/* 领取按钮 */}
        <button
          onClick={handleClaim}
          disabled={!status.canClaim}
          style={{
            width: '100%',
            padding: '10px 0',
            background: status.canClaim
              ? `linear-gradient(135deg, ${neonPurple} 0%, ${neonCyan} 100%)`
              : status.claimed >= 4
              ? 'rgba(100, 90, 130, 0.3)'
              : 'rgba(60, 50, 90, 0.4)',
            border: `1.5px solid ${status.canClaim ? neonCyan : status.claimed >= 4 ? '#555' : 'rgba(176, 38, 255, 0.3)'}`,
            borderRadius: 10,
            color: status.canClaim ? '#fff' : '#777',
            fontSize: 14,
            fontWeight: 700,
            cursor: status.canClaim ? 'pointer' : 'default',
            fontFamily: '"Rajdhani", "Orbitron", monospace',
            letterSpacing: '1px',
            textShadow: status.canClaim ? `0 0 10px ${neonCyan}` : 'none',
            boxShadow: status.canClaim ? `0 0 20px ${neonPurple}40` : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {status.claimed >= 4 ? '✅ 已全部领取' : status.canClaim ? '🎁 领取奖励' : `⏳ 等待中 (${status.claimed}/4)`}
        </button>

        {/* 提示 */}
        <div style={{ marginTop: 8, fontSize: 10, color: '#6A6480', ...neonText }}>
          已领取 {status.claimed}/4 次 · 每局自动计时
        </div>

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: 'absolute',
              bottom: -30,
              left: '50%',
              transform: 'translateX(-50%)',
              background: `linear-gradient(135deg, ${neonPurple}CC, ${neonCyan}CC)`,
              color: '#fff',
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: `0 0 15px ${neonCyan}50`,
              ...neonText,
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
