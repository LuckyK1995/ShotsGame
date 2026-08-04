import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonBlue, neonOrange, neonRed } from '../theme/colors';
import { ModalHudBackground } from './ModalHudBackground';

interface LotteryRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 24 格物品赔率表（与 GameEngine.LOTTERY_ITEMS 同步，按品种合并展示）
const ODDS_TABLE: { icon: string; name: string; bigOdds: number; smallOdds: number; color: string; count: number }[] = [
  { icon: '🍎', name: '苹果',   bigOdds: 5,   smallOdds: 0,  color: '#FF4757', count: 4 },
  { icon: '🍊', name: '橘子',   bigOdds: 10,  smallOdds: 3,  color: '#FF8C42', count: 3 },
  { icon: '🥭', name: '芒果',   bigOdds: 10,  smallOdds: 3,  color: '#FFD93D', count: 3 },
  { icon: '🔔', name: '铃铛',   bigOdds: 10,  smallOdds: 3,  color: '#FFD700', count: 4 },
  { icon: '🍉', name: '西瓜',   bigOdds: 20,  smallOdds: 3,  color: '#2ECC71', count: 2 },
  { icon: '✨', name: '双星',   bigOdds: 20,  smallOdds: 3,  color: '#9B59B6', count: 2 },
  { icon: '7️⃣', name: '77',    bigOdds: 20,  smallOdds: 3,  color: '#FF1493', count: 2 },
  { icon: 'BAR', name: 'BAR',  bigOdds: 100, smallOdds: 50, color: '#00F5D4', count: 3 },
];

// Lucky 子玩法
const LUCKY_KINDS: { label: string; desc: string; color: string }[] = [
  { label: '随机大水果', desc: '随机打中某一个大水果格，按该格赔率结算', color: neonPink },
  { label: '大苹果雨', desc: '打中所有大苹果格（共 4 格），累加结算', color: neonRed },
  { label: '橘芒铃', desc: '打中橘子/芒果/铃铛三种大水果格，累加结算', color: neonOrange },
  { label: '瓜星柒', desc: '打中西瓜/双星/77三种大水果格，累加结算', color: neonPurple },
  { label: '开火车', desc: '顺时针随机长度 3-7 格连续全中，累加结算', color: neonYellow },
  { label: '大满贯', desc: '全部 24 格全中，累加结算所有道具奖励', color: neonGreen },
];

export function LotteryRulesModal({ isOpen, onClose }: LotteryRulesModalProps) {
  if (!isOpen) return null;

  const neonText: React.CSSProperties = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 700,
    letterSpacing: '1px',
  };

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: '100%',
          height: '100%',
          background: 'rgba(19, 16, 37, 0.95)',
          border: `1px solid ${neonPurple}40`,
          borderRadius: '14px',
          boxShadow: `0 0 30px ${neonPurple}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHudBackground accentColor={neonPurple} accentColor2={neonPink} />

        <div className="relative flex flex-col flex-1 min-h-0" style={{ zIndex: 1, padding: '12px 12px' }}>
          {/* 头部：图标 + 标题 + 副标题 */}
          <div className="flex flex-col items-center mb-2 shrink-0">
            <div
              className="mb-1"
              style={{
                filter: `drop-shadow(0 0 8px ${neonPurple}80)`,
                fontSize: '22px',
                lineHeight: 1,
              }}
            >
              🎰
            </div>
            <h2
              style={{
                ...neonText,
                fontSize: '12px',
                color: neonPink,
                textShadow: `0 0 8px ${neonPink}60`,
                letterSpacing: '2px',
              }}
            >
              跑马灯水果机
            </h2>
            <p style={{ ...neonText, fontSize: '7px', color: '#8B80A0', marginTop: '2px', letterSpacing: '0.5px' }}>
              24 格跑马灯玩法规则
            </p>
          </div>

          {/* 可滚动规则内容（填充剩余空间） */}
          <div
            className="flex-1 min-h-0 overflow-y-auto rules-scroll"
            style={{ paddingRight: '2px' }}
          >
            {/* 1. 基本玩法 */}
            <SectionTitle index="01" title="基本玩法" color={neonCyan} />
            <p style={{ ...neonText, fontSize: '8.5px', color: '#C0C0D8', lineHeight: 1.7, marginBottom: '6px' }}>
              跑马灯由 <span style={{ color: neonYellow }}>24 个图案格</span>围成 7×7 方框，灯光从左上第 1 格起按<span style={{ color: neonCyan }}>顺时针</span>跑动，逐步减速最终停在某格。押注某水果种类，停在任意该种类格子都算中奖。
            </p>
            <p style={{ ...neonText, fontSize: '8px', color: '#8B80A0', lineHeight: 1.6, marginBottom: '6px' }}>
              命中概率与赔率挂钩：赔率越高的格子权重越低，越难命中。
            </p>

            {/* 2. 押注 */}
            <SectionTitle index="02" title="押注方式" color={neonGreen} />
            <p style={{ ...neonText, fontSize: '8.5px', color: '#C0C0D8', lineHeight: 1.7, marginBottom: '4px' }}>
              押注按<span style={{ color: neonGreen }}>水果种类</span>（苹果/橘子/芒果/铃铛/西瓜/双星/77/BAR），<span style={{ color: neonGreen }}>左键</span> +1 押注，<span style={{ color: neonRed }}>右键</span> -1 退注。直接消耗硬币，押注上限 999。
            </p>
            <p style={{ ...neonText, fontSize: '8.5px', color: '#C0C0D8', lineHeight: 1.7, marginBottom: '6px' }}>
              例：押苹果，跑马灯停在 4 个大苹果任意一个都按该格赔率中奖。免费旋转时无需押注即可开始。
            </p>

            {/* 3. 赔率表 */}
            <SectionTitle index="03" title="物品赔率" color={neonYellow} />
            <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {ODDS_TABLE.map(item => (
                <div
                  key={item.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '3px 6px',
                    background: `${item.color}12`,
                    border: `1px solid ${item.color}40`,
                    borderRadius: '4px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: item.color, fontWeight: 700, fontFamily: item.name === 'BAR' ? '"Rajdhani",monospace' : undefined }}>
                    {item.icon}
                  </span>
                  <span style={{ ...neonText, fontSize: '7.5px', color: '#C0C0D8' }}>{item.name}×{item.count}</span>
                  <span style={{ ...neonText, fontSize: '7.5px', color: item.color, fontWeight: 700 }}>
                    大{item.bigOdds}x{item.smallOdds > 0 ? ` 小${item.smallOdds}x` : ''}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ ...neonText, fontSize: '7.5px', color: '#8B80A0', lineHeight: 1.5, marginBottom: '6px' }}>
              注：苹果无小格；BAR 大 BAR X100，小 BAR X50。中奖按停格的实际赔率结算。
            </p>

            {/* 4. Lucky 特殊玩法 */}
            <SectionTitle index="04" title="Lucky 特殊玩法" color={neonPink} />
            <p style={{ ...neonText, fontSize: '8px', color: '#8B80A0', marginBottom: '4px' }}>
              跑马灯停在 <span style={{ color: neonPink }}>🍀 Lucky 格</span>（共 2 个）时触发，随机一种：
            </p>
            <div className="flex flex-col gap-1 mb-2">
              {LUCKY_KINDS.map(r => (
                <div
                  key={r.label}
                  style={{
                    padding: '4px 6px',
                    background: `${r.color}10`,
                    border: `1px solid ${r.color}40`,
                    borderLeft: `2px solid ${r.color}`,
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ ...neonText, fontSize: '9px', color: r.color, fontWeight: 700, marginBottom: '1px' }}>
                    {r.label}
                  </div>
                  <div style={{ ...neonText, fontSize: '7.5px', color: '#C0C0D8', lineHeight: 1.4 }}>
                    {r.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* 5. 送灯 */}
            <SectionTitle index="05" title="送灯免费旋转" color={neonCyan} />
            <p style={{ ...neonText, fontSize: '8.5px', color: '#C0C0D8', lineHeight: 1.7, marginBottom: '6px' }}>
              跑马灯停在 <span style={{ color: neonCyan }}>BAR 格</span>（大/小 BAR 均可）时，获得 <span style={{ color: neonCyan }}>1 次免费旋转</span>，无需押注即可再转一次。
            </p>

            {/* 6. 硬币获取 */}
            <SectionTitle index="06" title="硬币获取" color={neonOrange} />
            <p style={{ ...neonText, fontSize: '8.5px', color: '#C0C0D8', lineHeight: 1.7, marginBottom: '2px' }}>
              · 每日发放 <span style={{ color: neonYellow }}>10 个硬币</span>
            </p>
            <p style={{ ...neonText, fontSize: '8.5px', color: '#C0C0D8', lineHeight: 1.7, marginBottom: '2px' }}>
              · 连续登录每 3 天 <span style={{ color: neonOrange }}>+1 硬币</span>（上限 +5）
            </p>
            <p style={{ ...neonText, fontSize: '8.5px', color: '#C0C0D8', lineHeight: 1.7, marginBottom: '6px' }}>
              · 连续登录每 7 天额外 <span style={{ color: neonYellow }}>+500 金币</span>
            </p>

            {/* 7. 中奖结算 */}
            <SectionTitle index="07" title="中奖结算" color={neonPurple} />
            <p style={{ ...neonText, fontSize: '8.5px', color: '#C0C0D8', lineHeight: 1.7, marginBottom: '8px' }}>
              中奖奖励 = <span style={{ color: neonYellow }}>押注 × 赔率</span>对应水果的道具，多格中奖累加发放。每种水果对应不同道具，旋转后清空押注，需重新下注。
            </p>
          </div>

          {/* 底部返回按钮 */}
          <button
            className="shrink-0 mt-2"
            style={{
              width: '100%',
              background: 'rgba(155, 89, 182, 0.15)',
              border: `1px solid ${neonPurple}50`,
              borderRadius: '8px',
              ...neonText,
              fontSize: '11px',
              color: neonPurple,
              boxShadow: `0 0 10px ${neonPurple}20`,
              padding: '8px 0',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(155, 89, 182, 0.28)';
              e.currentTarget.style.boxShadow = `0 0 16px ${neonPurple}45`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(155, 89, 182, 0.15)';
              e.currentTarget.style.boxShadow = `0 0 10px ${neonPurple}20`;
            }}
            onClick={onClose}
          >
            返回
          </button>
        </div>
      </div>

      <style>{`
        .rules-scroll::-webkit-scrollbar { width: 3px; }
        .rules-scroll::-webkit-scrollbar-track { background: rgba(100,100,130,0.1); }
        .rules-scroll::-webkit-scrollbar-thumb { background: ${neonPurple}60; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// 小节标题组件
function SectionTitle({ index, title, color }: { index: string; title: string; color: string }) {
  const neonText: React.CSSProperties = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 700,
    letterSpacing: '1px',
  };
  return (
    <div className="flex items-center gap-1.5 mb-1.5 mt-1">
      <span
        style={{
          ...neonText,
          fontSize: '7px',
          color,
          opacity: 0.6,
          border: `1px solid ${color}40`,
          borderRadius: '2px',
          padding: '1px 3px',
        }}
      >
        {index}
      </span>
      <span style={{ ...neonText, fontSize: '10px', color, textShadow: `0 0 6px ${color}60` }}>
        {title}
      </span>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${color}40, transparent)` }} />
    </div>
  );
}
