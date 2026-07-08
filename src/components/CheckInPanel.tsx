import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { ITEMS, getItemDef } from '../game/data/equipment';
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonText } from '../theme/colors';

interface EngineRef {
  current: {
    checkIn: () => { success: boolean; day: number; rewards: { itemId: string; count: number; gold: number } };
    getCheckInStatus: () => { days: number[]; todayChecked: boolean; weekKey: string };
  } | null;
}

interface CheckInPanelProps {
  engineRef: EngineRef;
  isOpen: boolean;
  onClose: () => void;
}

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const CHECK_IN_REWARDS = [
  { itemId: 'health_potion', count: 5, gold: 200, icon: '❤️' },
  { itemId: 'attack_boost', count: 3, gold: 300, icon: '💪' },
  { itemId: 'speed_boost', count: 3, gold: 300, icon: '👟' },
  { itemId: 'bomb', count: 3, gold: 500, icon: '💣' },
  { itemId: 'health_potion_advanced', count: 5, gold: 500, icon: '🧡' },
  { itemId: 'freeze_bomb', count: 2, gold: 800, icon: '❄️' },
  { itemId: 'health_potion_legendary', count: 3, gold: 1500, icon: '💚' },
];

export function CheckInPanel({ engineRef, isOpen, onClose }: CheckInPanelProps) {
  const [status, setStatus] = useState<{ days: number[]; todayChecked: boolean; weekKey: string }>({ days: [], todayChecked: false, weekKey: '' });
  const [toast, setToast] = useState<string | null>(null);

  const refreshStatus = useCallback(() => {
    if (engineRef.current) {
      setStatus(engineRef.current.getCheckInStatus());
    }
  }, [engineRef]);

  useEffect(() => {
    if (isOpen) refreshStatus();
  }, [isOpen, refreshStatus]);

  if (!isOpen) return null;

  const handleCheckIn = () => {
    if (!engineRef.current) return;
    const result = engineRef.current.checkIn();
    if (result.success) {
      const itemDef = getItemDef(result.rewards.itemId);
      const msg = result.rewards.gold > 0
        ? `签到成功！获得 ${itemDef?.name || result.rewards.itemId} x${result.rewards.count} + ${result.rewards.gold}金币`
        : `签到成功！获得 ${itemDef?.name || result.rewards.itemId} x${result.rewards.count}`;
      setToast(msg);
      setTimeout(() => setToast(null), 2000);
    } else {
      setToast('今日已签到');
      setTimeout(() => setToast(null), 1500);
    }
    refreshStatus();
  };

  const todayIndex = (() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  })();

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
            📅 7日签到
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

        {/* 7天签到格子 */}
        <div className="grid grid-cols-4 gap-2 w-full mb-4">
          {CHECK_IN_REWARDS.map((reward, idx) => {
            const checked = status.days.includes(idx);
            const isToday = idx === todayIndex;
            const itemDef = getItemDef(reward.itemId);

            return (
              <div
                key={idx}
                className="flex flex-col items-center"
                style={{
                  background: checked
                    ? `linear-gradient(180deg, ${neonGreen}15 0%, ${neonGreen}08 100%)`
                    : isToday
                    ? `linear-gradient(180deg, ${neonPurple}20 0%, ${neonCyan}08 100%)`
                    : 'rgba(19, 16, 37, 0.6)',
                  border: `1.5px solid ${checked ? neonGreen + '80' : isToday ? neonCyan + '60' : 'rgba(176, 38, 255, 0.2)'}`,
                  borderRadius: 10,
                  padding: '8px 4px',
                  opacity: checked ? 0.7 : 1,
                }}
              >
                <span style={{ fontSize: 10, color: '#8A7FA8', ...neonText, marginBottom: 2 }}>
                  {DAY_LABELS[idx]}
                </span>
                <span style={{ fontSize: 20, filter: checked ? 'grayscale(0.5)' : 'none' }}>
                  {checked ? '✅' : reward.icon}
                </span>
                <span style={{ fontSize: 8, color: neonCyan, ...neonText, marginTop: 2, textAlign: 'center' }}>
                  {itemDef?.name?.slice(0, 4) || reward.itemId.slice(0, 4)}
                </span>
                <span style={{ fontSize: 7, color: neonYellow, ...neonText }}>
                  x{reward.count}
                </span>
                {reward.gold > 0 && (
                  <span style={{ fontSize: 7, color: neonYellow, ...neonText }}>
                    +{reward.gold}💰
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 签到按钮 */}
        <button
          onClick={handleCheckIn}
          disabled={status.todayChecked}
          style={{
            width: '100%',
            padding: '10px 0',
            background: status.todayChecked
              ? 'rgba(100, 90, 130, 0.3)'
              : `linear-gradient(135deg, ${neonPurple} 0%, ${neonCyan} 100%)`,
            border: `1.5px solid ${status.todayChecked ? '#555' : neonCyan}`,
            borderRadius: 10,
            color: status.todayChecked ? '#777' : '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: status.todayChecked ? 'default' : 'pointer',
            fontFamily: '"Rajdhani", "Orbitron", monospace',
            letterSpacing: '1px',
            textShadow: status.todayChecked ? 'none' : `0 0 10px ${neonCyan}`,
            boxShadow: status.todayChecked ? 'none' : `0 0 20px ${neonPurple}40`,
            transition: 'all 0.2s ease',
          }}
        >
          {status.todayChecked ? '✅ 今日已签到' : '📝 立即签到'}
        </button>

        {/* 已签天数提示 */}
        <div style={{ marginTop: 8, fontSize: 10, color: '#6A6480', ...neonText }}>
          本周已签到 {status.days.length}/7 天
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
