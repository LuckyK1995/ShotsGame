import { useState, useEffect, useCallback } from 'react';
import { getItemDef } from '../game/data/equipment';
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonText } from '../theme/colors';
import { ModalHudBackground } from './ModalHudBackground';

interface EngineRef {
  current: {
    checkIn: () => Promise<{ success: boolean; day: number; rewards: { itemId: string; count: number; gold: number } }>;
    getCheckInStatus: () => { days: number[]; todayChecked: boolean; weekKey: string };
    refreshCheckInFromServer?: () => Promise<void>;
  } | null;
}

interface CheckInPanelProps {
  engineRef: EngineRef;
  isOpen: boolean;
  onClose: () => void;
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

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
    if (isOpen) {
      void engineRef.current?.refreshCheckInFromServer?.().then(() => refreshStatus());
    }
  }, [isOpen, refreshStatus, engineRef]);

  if (!isOpen) return null;

  const handleCheckIn = async () => {
    if (!engineRef.current) return;
    try {
      const result = await engineRef.current.checkIn();
      if (result.success) {
        const itemDef = getItemDef(result.rewards.itemId);
        const parts: string[] = [];
        if (result.rewards.itemId && result.rewards.count > 0) {
          parts.push(`${itemDef?.name || result.rewards.itemId} x${result.rewards.count}`);
        }
        if (result.rewards.gold > 0) parts.push(`${result.rewards.gold}金币`);
        setToast(parts.length > 0 ? `奖励已发送至邮箱：${parts.join('、')}` : '签到成功，奖励已发送至邮箱');
        setTimeout(() => setToast(null), 2200);
      } else {
        setToast('今日已签到');
        setTimeout(() => setToast(null), 1500);
      }
      refreshStatus();
    } catch (e) {
      setToast('签到失败，请重试');
      setTimeout(() => setToast(null), 1500);
      refreshStatus();
    }
  };

  const todayIndex = (() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  })();

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
          border: `1px solid ${neonPurple}50`,
          borderRadius: '14px',
          boxShadow: `0 0 30px ${neonPurple}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHudBackground accentColor={neonPurple} accentColor2={neonCyan} />

        <div className="relative flex flex-col flex-1 min-h-0" style={{ zIndex: 1, padding: '10px 10px' }}>
          {/* 头部 */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span style={{ ...neonText, fontSize: '13px', color: neonCyan, letterSpacing: '2px' }}>
              📅 连续签到
            </span>
            <button
              onClick={onClose}
              style={{ ...neonText, fontSize: '14px', color: '#8B80A0', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
            >✕</button>
          </div>

          {/* 本周进度 */}
          <div className="flex items-center justify-between mb-2 shrink-0" style={{ ...neonText, fontSize: '8px' }}>
            <span style={{ color: '#8B80A0' }}>本周已签 {status.days.length}/7 天</span>
            <span style={{ color: neonYellow }}>奖励发送至邮箱</span>
          </div>

          {/* 7天签到格子（7列紧凑布局） */}
          <div className="grid gap-1 mb-2 shrink-0" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {CHECK_IN_REWARDS.map((reward, idx) => {
              const checked = status.days.includes(idx);
              const isToday = idx === todayIndex;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center"
                  style={{
                    background: checked
                      ? `${neonGreen}12`
                      : isToday
                      ? `${neonPurple}20`
                      : 'rgba(13, 11, 26, 0.6)',
                    border: `1px solid ${checked ? neonGreen + '60' : isToday ? neonCyan + '50' : 'rgba(100,100,130,0.25)'}`,
                    borderRadius: '5px',
                    padding: '3px 1px',
                    opacity: checked ? 0.65 : 1,
                  }}
                >
                  <span style={{ ...neonText, fontSize: '6px', color: '#8B80A0' }}>{DAY_LABELS[idx]}</span>
                  <span style={{ fontSize: '11px', filter: checked ? 'grayscale(0.6)' : 'none' }}>
                    {checked ? '✓' : reward.icon}
                  </span>
                  <span style={{ ...neonText, fontSize: '5px', color: neonYellow, fontWeight: 700 }}>
                    x{reward.count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 奖励详情列表 */}
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <div style={{ ...neonText, fontSize: '7px', color: '#5A5A7A', marginBottom: '4px', letterSpacing: '1px' }}>
              ▸ 每日奖励明细
            </div>
            <div className="flex flex-col gap-1">
              {CHECK_IN_REWARDS.map((reward, idx) => {
                const checked = status.days.includes(idx);
                const isToday = idx === todayIndex;
                const itemDef = getItemDef(reward.itemId);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5"
                    style={{
                      padding: '4px 5px',
                      background: isToday ? `${neonCyan}10` : 'rgba(13, 11, 26, 0.5)',
                      border: `1px solid ${isToday ? neonCyan + '40' : 'rgba(100,100,130,0.2)'}`,
                      borderRadius: '5px',
                      opacity: checked ? 0.5 : 1,
                    }}
                  >
                    <span style={{ fontSize: '12px', width: '14px', textAlign: 'center' }}>{reward.icon}</span>
                    <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0', width: '18px' }}>周{DAY_LABELS[idx]}</span>
                    <span style={{ ...neonText, fontSize: '8px', color: '#E0E0F0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {itemDef?.name || reward.itemId}
                    </span>
                    <span style={{ ...neonText, fontSize: '7px', color: neonCyan }}>x{reward.count}</span>
                    {reward.gold > 0 && (
                      <span style={{ ...neonText, fontSize: '7px', color: neonYellow }}>+{reward.gold}</span>
                    )}
                    {checked && (
                      <span style={{ ...neonText, fontSize: '7px', color: neonGreen }}>✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 签到按钮 */}
          <button
            onClick={handleCheckIn}
            disabled={status.todayChecked}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '7px 0',
              background: status.todayChecked
                ? 'rgba(100,100,130,0.2)'
                : `${neonPurple}30`,
              border: `1px solid ${status.todayChecked ? '#5A5A7A' : neonCyan}`,
              borderRadius: '6px',
              ...neonText, fontSize: '10px',
              color: status.todayChecked ? '#8B80A0' : neonCyan,
              cursor: status.todayChecked ? 'default' : 'pointer',
              letterSpacing: '1px',
              boxShadow: status.todayChecked ? 'none' : `0 0 10px ${neonPurple}30`,
            }}
          >
            {status.todayChecked ? '✓ 今日已签到' : '📝 立即签到'}
          </button>

          <div className="text-center mt-1" style={{ ...neonText, fontSize: '6px', color: '#5A5A7A', letterSpacing: '0.5px' }}>
            签到后奖励自动发送至邮箱·请在邮箱领取
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
