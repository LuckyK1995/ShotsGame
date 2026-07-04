import { useGameStore } from '../store/gameStore';

export function BossHealthBar() {
  const { gameState } = useGameStore();

  if (!gameState || !gameState.bossActive) return null;

  const healthPercent = (gameState.bossHealth / gameState.bossMaxHealth) * 100;

  return (
    <div className="absolute top-[100px] left-1/2 -translate-x-1/2 w-80 pointer-events-none z-20">
      <div className="text-center mb-2">
        <span
          className="text-[#FF4500] font-bold text-lg"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            textShadow: '2px 2px 0 #000000'
          }}
        >
          首领：{gameState.bossName}
        </span>
      </div>
      <div 
        className="h-6 bg-[#3D2914] border-2 border-[#1a1a1a] rounded-lg overflow-hidden" 
        style={{ 
          boxShadow: 'inset 2px 2px 0 #5D4037, 3px 3px 0 #1a1a1a'
        }}
      >
        <div
          className="h-full bg-[#FF4500]"
          style={{ 
            width: `${healthPercent}%`,
            boxShadow: 'inset -2px 0 0 #8B0000, inset 2px 0 0 #FF6B6B',
            borderRadius: '6px',
          }}
        />
      </div>
      <div className="text-center mt-1">
        <span 
          className="text-[#FFFFFF] text-xs" 
          style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
        >
          {Math.ceil(gameState.bossHealth)} / {gameState.bossMaxHealth}
        </span>
      </div>
    </div>
  );
}
