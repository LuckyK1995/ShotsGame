import { memo, useState } from 'react';
import type { ItemStack, ItemRarity } from '../game/types/game';
import { RARITY_COLORS, RARITY_LABELS } from '../game/data/equipment';
import { GEMS, GEM_TYPE_INFO } from '../game/data/gems';
import { ENHANCE_ITEMS } from '../game/data/enhanceItems';
import { itemSlotStyle } from './EquipmentDetailModal';
import { neonPurple, neonCyan, neonText } from '../theme/colors';
import { hexToRgba } from '../utils/styles';
import { ModalHudBackground } from './ModalHudBackground';

interface MaterialSettlementProps {
  isOpen: boolean;
  rewards: ItemStack[];
  remainingChallenges: number;
  maxChallenges: number;
  onRestart: () => void;
  onBackToMenu: () => void;
}

interface RewardDisplayInfo {
  name: string;
  icon: string;
  rarity: ItemRarity;
  description: string;
  count: number;
}

/** 将奖励 ItemStack 解析为展示信息 */
function parseReward(stack: ItemStack): RewardDisplayInfo | null {
  const isGem = stack.itemId.startsWith('gem_');
  if (isGem) {
    const gemDef = GEMS[stack.itemId];
    if (!gemDef) return null;
    return {
      name: gemDef.name,
      icon: gemDef.icon,
      rarity: gemDef.rarity as ItemRarity,
      description: gemDef.description,
      count: stack.count,
    };
  }
  // 强化道具
  const enhanceDef = ENHANCE_ITEMS[stack.itemId as keyof typeof ENHANCE_ITEMS];
  if (!enhanceDef) return null;
  return {
    name: enhanceDef.name,
    icon: enhanceDef.icon,
    rarity: enhanceDef.rarity,
    description: enhanceDef.description,
    count: stack.count,
  };
}

function MaterialSettlementImpl({
  isOpen,
  rewards,
  remainingChallenges,
  maxChallenges,
  onRestart,
  onBackToMenu,
}: MaterialSettlementProps) {
  const [selectedReward, setSelectedReward] = useState<RewardDisplayInfo | null>(null);

  if (!isOpen) return null;

  const canRestart = remainingChallenges > 0;
  const rewardInfos = rewards.map(parseReward).filter(Boolean) as RewardDisplayInfo[];
  const totalCount = rewardInfos.reduce((s, r) => s + r.count, 0);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[200]"
      style={{
        background:
          'radial-gradient(circle at 50% 38%, rgba(60, 20, 80, 0.55) 0%, rgba(0, 0, 0, 0.92) 70%)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={() => setSelectedReward(null)}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: '420px',
          maxWidth: '94vw',
          maxHeight: '92vh',
          padding: '20px 24px',
          background: 'rgba(19, 16, 37, 0.95)',
          border: `1px solid ${hexToRgba(neonPurple, 0.5)}`,
          borderRadius: '16px',
          boxShadow: `0 0 50px ${hexToRgba(neonPurple, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHudBackground accentColor={neonPurple} accentColor2={neonCyan} />
        <div className="relative" style={{ zIndex: 1 }}>
        {/* 标题区 */}
        <div className="flex flex-col items-center mb-4">
          <div
            className="mb-1"
            style={{
              fontSize: '26px',
              lineHeight: 1,
              filter: `drop-shadow(0 0 12px ${hexToRgba(neonPurple, 0.8)})`,
            }}
          >
            💎
          </div>
          <h2
            style={{
              fontFamily: '"Press Start 2P", "Rajdhani", monospace',
              fontWeight: 700,
              letterSpacing: '1px',
              fontSize: '22px',
              color: neonPurple,
              textShadow: `0 0 14px ${hexToRgba(neonPurple, 0.7)}`,
            }}
          >
            材料征服
          </h2>
          <div
            className="mt-2 px-3 py-1"
            style={{
              ...neonText,
              fontSize: '11px',
              fontWeight: 700,
              color: neonPurple,
              background: hexToRgba(neonPurple, 0.12),
              border: `1px solid ${hexToRgba(neonPurple, 0.5)}`,
              borderRadius: '999px',
              textShadow: `0 0 8px ${hexToRgba(neonPurple, 0.6)}`,
              boxShadow: `0 0 14px ${hexToRgba(neonPurple, 0.25)}`,
            }}
          >
            晶石巨魔已被击败
          </div>
        </div>

        {/* 奖励网格：5列，与装备栏格子样式一致 */}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{
            background: 'rgba(13, 11, 26, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(176, 38, 255, 0.1)',
            padding: '6px',
          }}
        >
          {/* 标题文字 */}
          <div
            style={{
              ...neonText,
              fontSize: '9px',
              fontWeight: 700,
              color: neonPurple,
              marginBottom: '4px',
              textShadow: `0 0 6px ${hexToRgba(neonPurple, 0.5)}`,
            }}
          >
            获取的奖励：
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(5, 36px)',
              columnGap: '2px',
              rowGap: '1px',
              justifyContent: 'center',
            }}
          >
            {rewardInfos.map((reward, idx) => {
              const rarityColor = RARITY_COLORS[reward.rarity] || '#9A9A9A';
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center cursor-pointer relative"
                  style={{
                    width: '36px',
                    height: '36px',
                    ...itemSlotStyle(reward.rarity),
                  }}
                  title={reward.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReward(reward);
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
                    {reward.icon}
                  </span>
                  {reward.count > 1 && (
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
                      ×{reward.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 奖励计数 */}
        <div
          className="flex justify-end mt-2"
          style={{ ...neonText, fontSize: '9px', color: '#8B80A0' }}
        >
          共 {totalCount} 件材料
        </div>

        {/* 按钮区 */}
        <div className="flex gap-3 mt-4">
          <button
            style={{
              flex: 1,
              background: canRestart ? hexToRgba(neonPurple, 0.18) : 'rgba(60, 60, 80, 0.15)',
              border: `1px solid ${canRestart ? hexToRgba(neonPurple, 0.55) : 'rgba(100, 100, 130, 0.3)'}`,
              borderRadius: '10px',
              ...neonText,
              fontSize: '12px',
              fontWeight: 700,
              color: canRestart ? neonPurple : '#6B6880',
              boxShadow: canRestart ? `0 0 14px ${hexToRgba(neonPurple, 0.25)}` : 'none',
              padding: '11px 0',
              cursor: canRestart ? 'pointer' : 'not-allowed',
              opacity: canRestart ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (!canRestart) return;
              e.currentTarget.style.background = hexToRgba(neonPurple, 0.3);
              e.currentTarget.style.boxShadow = `0 0 20px ${hexToRgba(neonPurple, 0.45)}`;
            }}
            onMouseLeave={(e) => {
              if (!canRestart) return;
              e.currentTarget.style.background = hexToRgba(neonPurple, 0.18);
              e.currentTarget.style.boxShadow = `0 0 14px ${hexToRgba(neonPurple, 0.25)}`;
            }}
            onClick={canRestart ? onRestart : undefined}
            disabled={!canRestart}
          >
            ⟳ 再次挑战 ({remainingChallenges}/{maxChallenges})
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

      {/* 奖励详情弹窗 */}
      {selectedReward && (
        <div
          onClick={() => setSelectedReward(null)}
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
            onClick={(e) => e.stopPropagation()}
            style={{
              minWidth: '160px',
              maxWidth: '220px',
              background: 'rgba(13, 11, 26, 0.97)',
              border: `1px solid ${hexToRgba(RARITY_COLORS[selectedReward.rarity], 0.5)}`,
              borderRadius: '8px',
              padding: '8px 10px',
              boxShadow: `0 0 16px ${hexToRgba(RARITY_COLORS[selectedReward.rarity], 0.3)}`,
              cursor: 'default',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                style={{
                  fontSize: '20px',
                  filter: `drop-shadow(0 0 4px ${hexToRgba(RARITY_COLORS[selectedReward.rarity], 0.6)})`,
                }}
              >
                {selectedReward.icon}
              </span>
              <div className="flex flex-col">
                <span
                  style={{
                    ...neonText,
                    fontSize: '10px',
                    fontWeight: 700,
                    color: RARITY_COLORS[selectedReward.rarity],
                    textShadow: `0 0 6px ${hexToRgba(RARITY_COLORS[selectedReward.rarity], 0.5)}`,
                  }}
                >
                  {selectedReward.name}
                </span>
                <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>
                  {RARITY_LABELS[selectedReward.rarity]} · ×{selectedReward.count}
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
              {selectedReward.description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const MaterialSettlement = memo(MaterialSettlementImpl);
