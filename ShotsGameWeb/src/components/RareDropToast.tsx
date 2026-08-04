import { useEffect, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { RARITY_COLORS, RARITY_LABELS } from '../game/data/equipment';

const RARITY_GLOW: Record<string, string> = {
  fine: 'rgba(176, 38, 255, 0.5)',
  legendary: 'rgba(255, 140, 0, 0.6)',
  epic: 'rgba(255, 215, 0, 0.7)',
  mythic: 'rgba(255, 59, 59, 0.8)',
};

// 高品质掉落气泡提示：BOSS 血条下方水平居中堆叠显示，3 秒后自动消失
function RareDropToastImpl() {
  // 性能优化：已使用细粒度 selector
  const notifications = useGameStore(s => s.rareDropNotifications);
  const removeNotification = useGameStore(s => s.removeRareDropNotification);

  // 自动过期：每个通知 3 秒后清除
  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map(n => {
      return window.setTimeout(() => {
        removeNotification(n.id);
      }, 3000);
    });
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none z-20"
      style={{ top: '160px' }}
    >
      {notifications.map((n) => {
        const color = RARITY_COLORS[n.rarity as keyof typeof RARITY_COLORS] || '#FFFFFF';
        const glow = RARITY_GLOW[n.rarity] || 'rgba(255,255,255,0.4)';
        const rarityName = RARITY_LABELS[n.rarity as keyof typeof RARITY_LABELS] || n.rarity;
        return (
          <div
            key={n.id}
            className="flex items-center gap-2 px-3 py-1.5"
            style={{
              background: 'rgba(13, 11, 26, 0.92)',
              border: `1.5px solid ${color}`,
              borderRadius: '8px',
              boxShadow: `0 0 12px ${glow}, 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
              backdropFilter: 'blur(8px)',
              animation: 'rareDropIn 0.3s ease-out',
              minWidth: '180px',
              maxWidth: '300px',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                filter: `drop-shadow(0 0 4px ${glow})`,
              }}
            >
              {n.icon}
            </span>
            <div className="flex flex-col" style={{ minWidth: 0 }}>
              <span
                style={{
                  fontFamily: '"Rajdhani", "Orbitron", monospace',
                  fontSize: '9px',
                  color: color,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  textShadow: `0 0 4px ${glow}`,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {n.name}
              </span>
              <span
                style={{
                  fontFamily: '"Rajdhani", "Orbitron", monospace',
                  fontSize: '7px',
                  color: '#8B80A0',
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                }}
              >
                {rarityName} · {n.kind === 'equipment' ? '装备' : '物品'}
              </span>
            </div>
          </div>
        );
      })}
      {/* keyframes 已提取至 index.css */}
    </div>
  );
}

// 性能优化：memo 包装
export const RareDropToast = memo(RareDropToastImpl);
