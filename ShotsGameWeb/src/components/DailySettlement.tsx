import { memo, useState } from 'react';
import type { ItemStack, ItemRarity } from '../game/types/game';
import { RARITY_COLORS, RARITY_LABELS, getItemDef } from '../game/data/equipment';
import { itemSlotStyle } from './EquipmentDetailModal';
import { neonYellow, neonCyan, neonText } from '../theme/colors';
import { hexToRgba } from '../utils/styles';
import { ModalHudBackground } from './ModalHudBackground';

interface DailySettlementProps {
  isOpen: boolean;
  killStats: { normal: number; elite: number; boss: number };
  rewards: { gold: number; books: ItemStack[] };
  onRestart: () => void;
  onBackToMenu: () => void;
}

interface BookDisplayInfo {
  itemId: string;
  name: string;
  icon: string;
  rarity: ItemRarity;
  description: string;
  value: number;
  count: number;
}

/** 将经验书 ItemStack 解析为展示信息 */
function parseBook(stack: ItemStack): BookDisplayInfo | null {
  const def = getItemDef(stack.itemId);
  if (!def) return null;
  return {
    itemId: stack.itemId,
    name: def.name,
    icon: def.icon,
    rarity: def.rarity,
    description: def.description,
    value: def.value || 0,
    count: stack.count,
  };
}

function DailySettlementImpl({
  isOpen,
  killStats,
  rewards,
  onRestart,
  onBackToMenu,
}: DailySettlementProps) {
  const [selectedBook, setSelectedBook] = useState<BookDisplayInfo | null>(null);

  if (!isOpen) return null;

  const bookInfos = rewards.books.map(parseBook).filter(Boolean) as BookDisplayInfo[];
  const totalBookCount = bookInfos.reduce((s, b) => s + b.count, 0);
  const totalKills = killStats.normal + killStats.elite + killStats.boss;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[200]"
      style={{
        background:
          'radial-gradient(circle at 50% 38%, rgba(80, 60, 20, 0.55) 0%, rgba(0, 0, 0, 0.92) 70%)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={() => setSelectedBook(null)}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: '420px',
          maxWidth: '94vw',
          maxHeight: '92vh',
          padding: '20px 24px',
          background: 'rgba(19, 16, 37, 0.95)',
          border: `1px solid ${hexToRgba(neonYellow, 0.5)}`,
          borderRadius: '16px',
          boxShadow: `0 0 50px ${hexToRgba(neonYellow, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHudBackground accentColor={neonYellow} accentColor2={neonCyan} />
        <div className="relative" style={{ zIndex: 1 }}>
        {/* 标题区 */}
        <div className="flex flex-col items-center mb-4">
          <div
            className="mb-1"
            style={{
              fontSize: '26px',
              lineHeight: 1,
              filter: `drop-shadow(0 0 12px ${hexToRgba(neonYellow, 0.8)})`,
            }}
          >
            🏆
          </div>
          <h2
            style={{
              fontFamily: '"Press Start 2P", "Rajdhani", monospace',
              fontWeight: 700,
              letterSpacing: '1px',
              fontSize: '22px',
              color: neonYellow,
              textShadow: `0 0 14px ${hexToRgba(neonYellow, 0.7)}`,
            }}
          >
            日常征讨
          </h2>
          <div
            className="mt-2 px-3 py-1"
            style={{
              ...neonText,
              fontSize: '11px',
              fontWeight: 700,
              color: neonYellow,
              background: hexToRgba(neonYellow, 0.12),
              border: `1px solid ${hexToRgba(neonYellow, 0.5)}`,
              borderRadius: '999px',
              textShadow: `0 0 8px ${hexToRgba(neonYellow, 0.6)}`,
              boxShadow: `0 0 14px ${hexToRgba(neonYellow, 0.25)}`,
            }}
          >
            总击杀 {totalKills} 只
          </div>
        </div>

        {/* 击杀统计区 */}
        <div
          className="grid grid-cols-3 gap-2 mb-3"
          style={{
            background: 'rgba(13, 11, 26, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 217, 61, 0.15)',
            padding: '8px 6px',
          }}
        >
          <div className="flex flex-col items-center">
            <span style={{ ...neonText, fontSize: '8px', color: '#8B80A0' }}>普通怪</span>
            <span style={{ ...neonText, fontSize: '14px', fontWeight: 700, color: '#C0C0C8' }}>{killStats.normal}</span>
          </div>
          <div className="flex flex-col items-center" style={{ borderLeft: '1px solid rgba(255,217,61,0.15)', borderRight: '1px solid rgba(255,217,61,0.15)' }}>
            <span style={{ ...neonText, fontSize: '8px', color: '#8B80A0' }}>精英怪</span>
            <span style={{ ...neonText, fontSize: '14px', fontWeight: 700, color: '#5BA3E0' }}>{killStats.elite}</span>
          </div>
          <div className="flex flex-col items-center">
            <span style={{ ...neonText, fontSize: '8px', color: '#8B80A0' }}>BOSS</span>
            <span style={{ ...neonText, fontSize: '14px', fontWeight: 700, color: '#E03030' }}>{killStats.boss}</span>
          </div>
        </div>

        {/* 奖励区 */}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{
            background: 'rgba(13, 11, 26, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 217, 61, 0.1)',
            padding: '6px',
          }}
        >
          {/* 金币奖励 */}
          <div
            className="flex items-center justify-between mb-2"
            style={{
              padding: '6px 10px',
              background: hexToRgba(neonYellow, 0.08),
              border: `1px solid ${hexToRgba(neonYellow, 0.3)}`,
              borderRadius: '6px',
            }}
          >
            <span style={{ ...neonText, fontSize: '11px', fontWeight: 700, color: neonYellow }}>
              💰 金币奖励
            </span>
            <span style={{ ...neonText, fontSize: '14px', fontWeight: 700, color: '#FFD700', textShadow: `0 0 6px ${hexToRgba(neonYellow, 0.6)}` }}>
              +{rewards.gold.toLocaleString()}
            </span>
          </div>

          {/* 经验书标题 */}
          <div
            style={{
              ...neonText,
              fontSize: '9px',
              fontWeight: 700,
              color: neonYellow,
              marginBottom: '4px',
              textShadow: `0 0 6px ${hexToRgba(neonYellow, 0.5)}`,
            }}
          >
            获取的经验书：
          </div>

          {bookInfos.length === 0 ? (
            <div style={{ ...neonText, fontSize: '9px', color: '#6B6880', textAlign: 'center', padding: '12px 0' }}>
              本次未获得经验书
            </div>
          ) : (
            <div
              className="grid"
              style={{
                gridTemplateColumns: 'repeat(5, 36px)',
                columnGap: '2px',
                rowGap: '1px',
                justifyContent: 'center',
              }}
            >
              {bookInfos.map((book, idx) => {
                const rarityColor = RARITY_COLORS[book.rarity] || '#9A9A9A';
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center cursor-pointer relative"
                    style={{
                      width: '36px',
                      height: '36px',
                      ...itemSlotStyle(book.rarity),
                    }}
                    title={book.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBook(book);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '18px',
                        filter: `drop-shadow(0 0 4px ${hexToRgba(rarityColor, 0.6)})`,
                        lineHeight: 1,
                      }}
                    >
                      {book.icon}
                    </span>
                    {book.count > 1 && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '1px',
                          right: '2px',
                          fontSize: '8px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          background: hexToRgba(rarityColor, 0.85),
                          borderRadius: '4px',
                          padding: '0 3px',
                          lineHeight: 1.3,
                          textShadow: '0 0 2px rgba(0,0,0,0.8)',
                        }}
                      >
                        ×{book.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 奖励计数 */}
        <div
          className="flex justify-end mt-2"
          style={{ ...neonText, fontSize: '9px', color: '#8B80A0' }}
        >
          共 {totalBookCount} 本经验书
        </div>

        {/* 按钮区 */}
        <div className="flex gap-3 mt-4">
          <button
            style={{
              flex: 1,
              background: hexToRgba(neonYellow, 0.18),
              border: `1px solid ${hexToRgba(neonYellow, 0.55)}`,
              borderRadius: '10px',
              ...neonText,
              fontSize: '12px',
              fontWeight: 700,
              color: neonYellow,
              boxShadow: `0 0 14px ${hexToRgba(neonYellow, 0.25)}`,
              padding: '11px 0',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = hexToRgba(neonYellow, 0.3);
              e.currentTarget.style.boxShadow = `0 0 20px ${hexToRgba(neonYellow, 0.45)}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = hexToRgba(neonYellow, 0.18);
              e.currentTarget.style.boxShadow = `0 0 14px ${hexToRgba(neonYellow, 0.25)}`;
            }}
            onClick={onRestart}
          >
            ⟳ 再次挑战
          </button>
          <button
            style={{
              flex: 1,
              background: 'rgba(100, 100, 130, 0.15)',
              border: '1px solid rgba(150, 150, 180, 0.35)',
              borderRadius: '10px',
              ...neonText,
              fontSize: '12px',
              fontWeight: 700,
              color: '#A0A0B8',
              padding: '11px 0',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(100, 100, 130, 0.28)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(100, 100, 130, 0.15)';
            }}
            onClick={onBackToMenu}
          >
            ⌂ 返回主界面
          </button>
        </div>
        </div>
      </div>

      {/* 经验书详情弹窗 */}
      {selectedBook && (
        <div
          onClick={() => setSelectedBook(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 210,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
            style={{
              minWidth: '160px',
              maxWidth: '220px',
              background: 'rgba(13, 11, 26, 0.97)',
              border: `1px solid ${hexToRgba(RARITY_COLORS[selectedBook.rarity], 0.5)}`,
              borderRadius: '8px',
              padding: '8px 10px',
              boxShadow: `0 0 16px ${hexToRgba(RARITY_COLORS[selectedBook.rarity], 0.3)}`,
              cursor: 'default',
              overflow: 'hidden',
            }}
          >
            {/* HUD 背景：与按钮区不同纹路/颜色（按稀有度着色） */}
            <ModalHudBackground
              accentColor={RARITY_COLORS[selectedBook.rarity]}
              accentColor2={neonCyan}
            />
            <div className="relative" style={{ zIndex: 1 }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  style={{
                    fontSize: '20px',
                    filter: `drop-shadow(0 0 4px ${hexToRgba(RARITY_COLORS[selectedBook.rarity], 0.6)})`,
                  }}
                >
                  {selectedBook.icon}
                </span>
                <div className="flex flex-col">
                  <span
                    style={{
                      ...neonText,
                      fontSize: '10px',
                      fontWeight: 700,
                      color: RARITY_COLORS[selectedBook.rarity],
                      textShadow: `0 0 6px ${hexToRgba(RARITY_COLORS[selectedBook.rarity], 0.5)}`,
                    }}
                  >
                    {selectedBook.name}
                  </span>
                  <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>
                    {RARITY_LABELS[selectedBook.rarity]} · ×{selectedBook.count}
                  </span>
                </div>
              </div>
              <div
                style={{
                  ...neonText,
                  fontSize: '8px',
                  color: '#B0B0C8',
                  lineHeight: 1.4,
                  padding: '4px 6px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  border: '1px solid rgba(100,100,130,0.2)',
                }}
              >
                {selectedBook.description}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const DailySettlement = memo(DailySettlementImpl);
