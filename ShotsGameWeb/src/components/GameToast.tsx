import { useEffect, memo } from 'react';
import { useGameStore } from '../store/gameStore';

// 游戏内悬浮提示：道具使用、升级等，2.5 秒后自动消失
// 显示位置：屏幕中央偏上（避开 BOSS 血条和 RareDropToast）
function GameToastImpl() {
  const toasts = useGameStore(s => s.gameToasts);
  const removeToast = useGameStore(s => s.removeGameToast);

  // 自动过期：每个提示 2.5 秒后清除
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map(t => {
      return window.setTimeout(() => {
        removeToast(t.id);
      }, 2500);
    });
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none z-[70]"
      style={{ top: '110px' }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 px-3 py-1.5"
          style={{
            background: 'rgba(13, 11, 26, 0.92)',
            border: `1.5px solid ${t.color}`,
            borderRadius: '8px',
            boxShadow: `0 0 12px ${t.color}80, 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
            backdropFilter: 'blur(8px)',
            animation: 'rareDropIn 0.3s ease-out',
            minWidth: '160px',
            maxWidth: '280px',
          }}
        >
          <span
            style={{
              fontSize: '16px',
              filter: `drop-shadow(0 0 4px ${t.color}80)`,
              lineHeight: 1,
            }}
          >
            {t.icon}
          </span>
          <span
            style={{
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              fontSize: '10px',
              color: t.color,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textShadow: `0 0 4px ${t.color}60`,
              whiteSpace: 'nowrap',
            }}
          >
            {t.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export const GameToast = memo(GameToastImpl);
