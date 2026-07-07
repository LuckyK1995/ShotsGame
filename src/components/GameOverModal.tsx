import { memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { neonPurple, neonCyan, neonRed, neonYellow } from '../theme/colors';

interface GameOverModalProps {
  onRestart: () => void;
  onBackToMenu: () => void;
}

function GameOverModalImpl({ onRestart, onBackToMenu }: GameOverModalProps) {
  // 性能优化：使用细粒度 selector
  const gameState = useGameStore(s => s.gameState);
  const player = useGameStore(s => s.player);

  if (!gameState?.isGameOver) return null;

  // 本地样式 - 字体粗细/字间距与全局 neonText 不同，保留本地
  const neonText = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 700,
    letterSpacing: '1px',
  } as React.CSSProperties;

  const wave = gameState.currentWave;
  const score = player?.score || 0;
  const gold = player?.gold || 0;
  const level = player?.level || 1;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-[100]"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative p-6"
        style={{
          width: '300px',
          background: 'rgba(19, 16, 37, 0.95)',
          border: `1px solid ${neonRed}40`,
          borderRadius: '16px',
          boxShadow: `0 0 40px ${neonRed}30, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex flex-col items-center mb-5">
          <div
            className="text-4xl mb-2"
            style={{
              filter: `drop-shadow(0 0 12px ${neonRed}80)`,
            }}
          >
            💀
          </div>
          <h2
            style={{
              ...neonText,
              fontSize: '20px',
              color: neonRed,
              textShadow: `0 0 10px ${neonRed}60`,
            }}
          >
            游戏结束
          </h2>
        </div>

        <div
          className="mb-5 p-3"
          style={{
            background: 'rgba(13, 11, 26, 0.6)',
            borderRadius: '10px',
            border: '1px solid rgba(176, 38, 255, 0.15)',
          }}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span style={{ ...neonText, fontSize: '10px', color: '#8B80A0' }}>关卡</span>
              <span style={{ ...neonText, fontSize: '12px', color: neonCyan, textShadow: `0 0 6px ${neonCyan}40` }}>
                第 {wave} 波
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ ...neonText, fontSize: '10px', color: '#8B80A0' }}>等级</span>
              <span style={{ ...neonText, fontSize: '12px', color: neonYellow, textShadow: `0 0 6px ${neonYellow}40` }}>
                Lv.{level}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ ...neonText, fontSize: '10px', color: '#8B80A0' }}>分数</span>
              <span style={{ ...neonText, fontSize: '12px', color: '#FFFFFF' }}>
                {score.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ ...neonText, fontSize: '10px', color: '#8B80A0' }}>金币</span>
              <span style={{ ...neonText, fontSize: '12px', color: neonYellow }}>
                💰 {gold.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            style={{
              background: 'rgba(0, 245, 212, 0.15)',
              border: `1px solid ${neonCyan}50`,
              borderRadius: '10px',
              ...neonText,
              fontSize: '12px',
              color: neonCyan,
              boxShadow: `0 0 12px ${neonCyan}20`,
              padding: '10px 0',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 245, 212, 0.25)';
              e.currentTarget.style.boxShadow = `0 0 18px ${neonCyan}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 245, 212, 0.15)';
              e.currentTarget.style.boxShadow = `0 0 12px ${neonCyan}20`;
            }}
            onClick={onRestart}
          >
            ⟳ 继续挑战
          </button>
          <button
            style={{
              background: 'rgba(176, 38, 255, 0.15)',
              border: `1px solid ${neonPurple}50`,
              borderRadius: '10px',
              ...neonText,
              fontSize: '12px',
              color: neonPurple,
              boxShadow: `0 0 12px ${neonPurple}20`,
              padding: '10px 0',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(176, 38, 255, 0.25)';
              e.currentTarget.style.boxShadow = `0 0 18px ${neonPurple}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
              e.currentTarget.style.boxShadow = `0 0 12px ${neonPurple}20`;
            }}
            onClick={onBackToMenu}
          >
            ⌂ 返回主界面
          </button>
        </div>

        <div className="mt-4 text-center">
          <p style={{ ...neonText, fontSize: '8px', color: '#5A5A7A' }}>
            继续挑战将保留所有装备与数据，从第 {wave} 波重新开始
          </p>
        </div>
      </div>
    </div>
  );
}

// 性能优化：memo 包装
export const GameOverModal = memo(GameOverModalImpl);
