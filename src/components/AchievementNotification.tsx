import { useEffect, useState, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Achievement } from '../game/types/game';

function AchievementNotificationImpl() {
  // 性能优化：使用细粒度 selector
  const unlockedAchievement = useGameStore(s => s.unlockedAchievement);
  const setUnlockedAchievement = useGameStore(s => s.setUnlockedAchievement);
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (unlockedAchievement) {
      setQueue(prev => [...prev, unlockedAchievement]);
      setUnlockedAchievement(null);
    }
  }, [unlockedAchievement, setUnlockedAchievement]);

  useEffect(() => {
    if (queue.length > 0 && currentIndex < queue.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 3500);

      return () => clearTimeout(timer);
    } else if (currentIndex >= queue.length && queue.length > 0) {
      const timer = setTimeout(() => {
        setQueue([]);
        setCurrentIndex(0);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [queue, currentIndex]);

  const current = queue[currentIndex];
  if (!current) return null;

  const isVisible = currentIndex < queue.length;

  return (
    <div
      className="absolute top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-500"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(-50%, 0)' : 'translate(-50%, -20px)',
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: 'linear-gradient(180deg, #8B6914 0%, #5D4037 50%, #3D2914 100%)',
          border: '3px solid #FFE066',
          borderRadius: '12px',
          boxShadow: 'inset 2px 2px 0 #DEB887, inset -2px -2px 0 #2D1F0E, 0 0 20px rgba(255,224,102,0.5)',
          minWidth: '280px',
        }}
      >
        <div
          className="w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: 'rgba(255,224,102,0.2)',
            border: '3px solid #FFE066',
            boxShadow: '0 0 10px rgba(255,224,102,0.5)',
          }}
        >
          {current.icon}
        </div>
        <div className="flex-1">
          <div
            className="text-[8px] mb-1"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              color: '#FFE066',
              textShadow: '1px 1px 0 #3D2914',
            }}
          >
            🏆 成就解锁!
          </div>
          <div
            className="text-xs font-bold mb-1"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              color: '#FFE066',
              fontSize: '9px',
              textShadow: '1px 1px 0 #3D2914',
            }}
          >
            {current.name}
          </div>
          <div className="text-[8px]" style={{ color: '#DEB887' }}>
            {current.reward}
          </div>
        </div>
      </div>
    </div>
  );
}

// 性能优化：memo 包装
export const AchievementNotification = memo(AchievementNotificationImpl);
