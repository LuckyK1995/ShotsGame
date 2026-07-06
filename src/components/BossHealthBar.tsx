import { useGameStore } from '../store/gameStore';

// 14条血颜色：红橙黄绿青蓝紫 × 2
// 索引0=满血(第14条,紫)，索引13=最后一条(第1条,红)
const BOSS_BLOOD_COLORS = [
  '#B026FF', // 紫 (14/14 满血)
  '#4FACFE', // 蓝 (13/14)
  '#00F5D4', // 青 (12/14)
  '#00FF66', // 绿 (11/14)
  '#FFE600', // 黄 (10/14)
  '#FF8C00', // 橙 (9/14)
  '#FF3333', // 红 (8/14)
  '#B026FF', // 紫 (7/14)
  '#4FACFE', // 蓝 (6/14)
  '#00F5D4', // 青 (5/14)
  '#00FF66', // 绿 (4/14)
  '#FFE600', // 黄 (3/14)
  '#FF8C00', // 橙 (2/14)
  '#FF3333', // 红 (1/14 最后一条)
];

export function BossHealthBar() {
  const { gameState } = useGameStore();

  if (!gameState || !gameState.bossActive) return null;

  // 总血量拆成14段，每段 = 总血量 / 14
  const segmentMax = gameState.bossMaxHealth / 14;
  // 当前段号 1-14（14=满血第14段，1=最后一段）
  // 用 bossHealth / segmentMax 向上取整，但 bossHealth=0 时段号为1（最后一段已空）
  const currentSegment = gameState.bossHealth <= 0 ? 1 : Math.min(14, Math.ceil(gameState.bossHealth / segmentMax));
  // 颜色索引 0-13（0=满血紫色，13=最后一条红色）
  const colorIndex = 14 - currentSegment;
  // 前景色：当前血条的颜色
  const foregroundColor = BOSS_BLOOD_COLORS[colorIndex];
  // 背景色：下一条血的颜色；若已是最后一条(红色)，底色为黑色
  const backgroundColor = currentSegment > 1 ? BOSS_BLOOD_COLORS[colorIndex + 1] : '#000000';

  // 当前段内血量 = 总血量 - 之前所有段的总和
  const prevSegmentsTotal = (currentSegment - 1) * segmentMax;
  const currentSegmentHealth = Math.max(0, gameState.bossHealth - prevSegmentsTotal);
  // 当前段内进度（0-100%）：满段显示满，打完后切换到下一段并重新满
  const healthPercent = (currentSegmentHealth / segmentMax) * 100;

  // 段号进度（用于边框发光强度）
  const segmentProgress = currentSegment / 14;

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
      {/* 双层边框：外层暗金描边 + 内层暗紫描边 */}
      <div
        className="h-6 rounded-lg overflow-hidden"
        style={{
          background: backgroundColor,
          border: '2px solid #8B6914',
          boxShadow: `
            0 0 0 1px rgba(80, 20, 100, 0.5),
            0 0 6px rgba(140, 105, 20, 0.25),
            0 0 10px rgba(180, 50, 0, ${0.15 + (1 - segmentProgress) * 0.15}),
            inset 0 0 0 1px rgba(0, 0, 0, 0.5),
            inset 2px 2px 4px rgba(0, 0, 0, 0.4),
            inset -2px -2px 4px rgba(0, 0, 0, 0.6)
          `,
          padding: '1px',
        }}
      >
        <div
          className="h-full transition-all duration-150"
          style={{
            width: `${healthPercent}%`,
            background: foregroundColor,
            boxShadow: `
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.4),
              0 0 4px ${foregroundColor}40
            `,
            borderRadius: '4px',
          }}
        />
      </div>
      <div className="text-center mt-1">
        <span
          className="text-[#FFFFFF] text-xs"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            textShadow: '0 0 2px rgba(140, 105, 20, 0.4), 1px 1px 0 #000000',
          }}
        >
          {Math.ceil(gameState.bossHealth)} / {gameState.bossMaxHealth}
        </span>
      </div>
    </div>
  );
}
