import { memo } from 'react';
import { useGameStore } from '../store/gameStore';

function WaveNoticeImpl() {
  // 性能优化：使用细粒度 selector
  const gameState = useGameStore(s => s.gameState);

  if (!gameState) return null;

  const showWave = gameState.showWaveNotice;
  const showEliteBoss = gameState.showEliteBossNotice;
  const noticeType = gameState.eliteBossNoticeType;

  if (!showWave && !showEliteBoss) return null;

  if (showEliteBoss && noticeType) {
    const isBoss = noticeType === 'boss';
    const title = isBoss ? 'BOSS来袭！' : '精英来袭！';
    const titleColor = isBoss ? '#FF3333' : '#FF6600';
    const subtitleColor = isBoss ? '#FF6666' : '#FF9933';
    const subtitle = isBoss ? '终极挑战' : '精英怪物';

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <div className="w-full text-center">
          <h2
            className="text-5xl font-bold"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              color: titleColor,
              textShadow: '4px 4px 0 #3D2914, 8px 8px 0 #1a1a1a',
              animation: 'pulse 0.5s ease-in-out infinite alternate',
            }}
          >
            {title}
          </h2>
          <p
            className="mt-4"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '12px',
              color: subtitleColor,
              textShadow: '2px 2px 0 #3D2914'
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <div className="w-full text-center">
        <h2
          className="text-5xl font-bold text-[#FFD700]"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            textShadow: '4px 4px 0 #3D2914, 8px 8px 0 #1a1a1a',
          }}
        >
          第 {gameState.currentWave} 波
        </h2>
        <p
          className="text-xl text-[#FFA500] mt-4"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            textShadow: '2px 2px 0 #3D2914'
          }}
        >
          敌人来袭！
        </p>
      </div>
    </div>
  );
}

// 性能优化：memo 包装
export const WaveNotice = memo(WaveNoticeImpl);
