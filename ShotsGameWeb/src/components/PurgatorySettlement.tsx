import { memo, useState } from 'react';
import type { Equipment, EquipRarity } from '../game/types/game';
import { RARITY_COLORS } from '../game/data/equipment';
import { EquipmentIcon } from './EquipmentIcon';
import { EquipmentDetailModal, itemSlotStyle } from './EquipmentDetailModal';
import { neonRed, neonOrange, neonText } from '../theme/colors';
import { hexToRgba } from '../utils/styles';
import { ModalHudBackground } from './ModalHudBackground';

interface PurgatorySettlementProps {
  isOpen: boolean;
  rewards: Equipment[];
  bossElement: string | null;
  remainingChallenges: number;
  maxChallenges: number;
  onRestart: () => void;
  onBackToMenu: () => void;
}

// BOSS 元素信息：标签文案 + 对应颜色
const BOSS_ELEMENT_INFO: Record<string, { label: string; color: string }> = {
  fire: { label: '灼炎领主已被击败', color: '#FF4500' },
  poison: { label: '剧毒领主已被击败', color: '#7B00FF' },
  ice: { label: '寒冰领主已被击败', color: '#00BFFF' },
  lightning: { label: '雷霆领主已被击败', color: '#FFD700' },
};

function PurgatorySettlementImpl({
  isOpen,
  rewards,
  bossElement,
  remainingChallenges,
  maxChallenges,
  onRestart,
  onBackToMenu,
}: PurgatorySettlementProps) {
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);

  if (!isOpen) return null;

  const bossInfo = bossElement ? BOSS_ELEMENT_INFO[bossElement] : null;
  const canRestart = remainingChallenges > 0;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[200]"
      style={{
        background:
          'radial-gradient(circle at 50% 38%, rgba(60, 30, 0, 0.55) 0%, rgba(0, 0, 0, 0.92) 70%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: '420px',
          maxWidth: '94vw',
          maxHeight: '92vh',
          padding: '20px 24px',
          background: 'rgba(19, 16, 37, 0.95)',
          border: `1px solid ${hexToRgba(neonOrange, 0.5)}`,
          borderRadius: '16px',
          boxShadow: `0 0 50px ${hexToRgba(neonOrange, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}
      >
        <ModalHudBackground accentColor={neonRed} accentColor2={neonOrange} />
        <div className="relative" style={{ zIndex: 1 }}>
        {/* 标题区 */}
        <div className="flex flex-col items-center mb-4">
          <div
            className="mb-1"
            style={{
              fontSize: '26px',
              lineHeight: 1,
              filter: `drop-shadow(0 0 12px ${hexToRgba(neonOrange, 0.8)})`,
            }}
          >
            🔥
          </div>
          <h2
            style={{
              fontFamily: '"Press Start 2P", "Rajdhani", monospace',
              fontWeight: 700,
              letterSpacing: '1px',
              fontSize: '22px',
              color: neonOrange,
              textShadow: `0 0 14px ${hexToRgba(neonOrange, 0.7)}`,
            }}
          >
            炼狱征服
          </h2>
          {bossInfo && (
            <div
              className="mt-2 px-3 py-1"
              style={{
                ...neonText,
                fontSize: '11px',
                fontWeight: 700,
                color: bossInfo.color,
                background: hexToRgba(bossInfo.color, 0.12),
                border: `1px solid ${hexToRgba(bossInfo.color, 0.5)}`,
                borderRadius: '999px',
                textShadow: `0 0 8px ${hexToRgba(bossInfo.color, 0.6)}`,
                boxShadow: `0 0 14px ${hexToRgba(bossInfo.color, 0.25)}`,
              }}
            >
              {bossInfo.label}
            </div>
          )}
        </div>

        {/* 装备奖励网格：5列，与装备栏格子样式完全一致 */}
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
              color: neonOrange,
              marginBottom: '4px',
              textShadow: `0 0 6px ${hexToRgba(neonOrange, 0.5)}`,
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
            {rewards.map((equip) => (
              <div
                key={equip.id}
                className="flex flex-col items-center justify-center cursor-pointer relative"
                style={{
                  width: '36px',
                  height: '36px',
                  ...itemSlotStyle(equip.rarity),
                }}
                title={equip.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEquip(equip);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <EquipmentIcon
                  slot={equip.slot}
                  rarity={equip.rarity}
                  variant={equip.iconVariant}
                  size={28}
                  gemCount={equip.socketedGems?.length || 0}
                  enhanceLevel={equip.enhanceLevel || 0}
                  level={equip.level}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 装备计数 */}
        <div
          className="flex justify-end mt-2"
          style={{ ...neonText, fontSize: '9px', color: '#8B80A0' }}
        >
          共 {rewards.length} 件装备
        </div>

        {/* 按钮区 */}
        <div className="flex gap-3 mt-4">
          <button
            style={{
              flex: 1,
              background: canRestart ? hexToRgba(neonOrange, 0.18) : 'rgba(60, 60, 80, 0.15)',
              border: `1px solid ${canRestart ? hexToRgba(neonOrange, 0.55) : 'rgba(100, 100, 130, 0.3)'}`,
              borderRadius: '10px',
              ...neonText,
              fontSize: '12px',
              fontWeight: 700,
              color: canRestart ? neonOrange : '#6B6880',
              boxShadow: canRestart ? `0 0 14px ${hexToRgba(neonOrange, 0.25)}` : 'none',
              padding: '11px 0',
              cursor: canRestart ? 'pointer' : 'not-allowed',
              opacity: canRestart ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (!canRestart) return;
              e.currentTarget.style.background = hexToRgba(neonOrange, 0.3);
              e.currentTarget.style.boxShadow = `0 0 20px ${hexToRgba(neonOrange, 0.45)}`;
            }}
            onMouseLeave={(e) => {
              if (!canRestart) return;
              e.currentTarget.style.background = hexToRgba(neonOrange, 0.18);
              e.currentTarget.style.boxShadow = `0 0 14px ${hexToRgba(neonOrange, 0.25)}`;
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

      {/* 装备详情弹窗 */}
      {selectedEquip && (
        <EquipmentDetailModal
          equipment={selectedEquip}
          onClose={() => setSelectedEquip(null)}
        />
      )}
    </div>
  );
}

export const PurgatorySettlement = memo(PurgatorySettlementImpl);
