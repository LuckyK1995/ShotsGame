import { createPortal } from 'react-dom';
import type { Equipment, EquipmentAffix, EquipRarity } from '../game/types/game';
import { RARITY_COLORS, getRarityName, SLOT_LABELS } from '../game/data/equipment';
import { getEnhanceAttackBonus } from '../game/data/enhanceItems';
import { EquipmentIcon } from './EquipmentIcon';
import { neonCyan, neonPurple, neonPink, neonYellow, neonText } from '../theme/colors';
import { hexToRgba } from '../utils/styles';
import { ModalHudBackground } from './ModalHudBackground';

// ===== 装备格子统一样式（模板：36×36、2.5px边框、8px圆角、稀有度径向渐变）=====
export const BORDER_ALPHA: Record<EquipRarity, number> = {
  common: 0.3, advanced: 0.4, fine: 0.5,
  legendary: 0.55, epic: 0.6, mythic: 0.65,
};
export const RARITY_GRADIENT: Record<string, string> = {
  common: 'radial-gradient(circle at 50% 45%, #2A2540 0%, #1E1A35 55%, #15122A 100%)',
  advanced: 'radial-gradient(circle at 50% 45%, #253050 0%, #1A2540 55%, #101830 100%)',
  fine: 'radial-gradient(circle at 50% 45%, #3A2855 0%, #2A1C45 55%, #1E1035 100%)',
  legendary: 'radial-gradient(circle at 50% 40%, #8A4A2A 0%, #5A2A10 60%, #3A1A08 100%)',
  epic: 'radial-gradient(circle at 50% 40%, #7A6A20 0%, #4D4010 60%, #2F2808 100%)',
  mythic: 'radial-gradient(circle at 50% 40%, #8A2A3A 0%, #5A1A20 60%, #3A0A10 100%)',
};
export const itemSlotStyle = (rarity: EquipRarity) => {
  const baseColor = RARITY_COLORS[rarity] || RARITY_COLORS.common;
  return {
    background: RARITY_GRADIENT[rarity],
    border: `2.5px solid ${hexToRgba(baseColor, BORDER_ALPHA[rarity] || 0.3)}`,
    borderRadius: '8px',
    boxShadow: 'none',
    cursor: 'pointer',
  };
};

// ===== 共享装备详情弹窗（点击弹窗外任意位置关闭）=====
interface EquipmentDetailModalProps {
  equipment: Equipment;
  onClose: () => void;
}

export function EquipmentDetailModal({ equipment, onClose }: EquipmentDetailModalProps) {
  const rarityColor = RARITY_COLORS[equipment.rarity];
  const gems = equipment.socketedGems || [];
  const enhanceLevel = equipment.enhanceLevel || 0;
  const enhanceBonus = getEnhanceAttackBonus(enhanceLevel);

  const statRows: Array<{ label: string; value: string; color: string }> = [];
  if (equipment.attack && equipment.attack > 0) statRows.push({ label: '攻击', value: `+${equipment.attack}`, color: neonPink });
  if (equipment.health && equipment.health > 0) statRows.push({ label: '生命', value: `+${equipment.health}`, color: '#34C759' });
  if (equipment.defense && equipment.defense > 0) statRows.push({ label: '防御', value: `+${equipment.defense}`, color: '#5BA3E0' });
  if (equipment.attackSpeed && equipment.attackSpeed !== 0) statRows.push({ label: '攻速', value: `${equipment.attackSpeed > 0 ? '+' : ''}${equipment.attackSpeed}%`, color: neonCyan });
  if (equipment.critRate && equipment.critRate > 0) statRows.push({ label: '暴击', value: `+${equipment.critRate}%`, color: neonPurple });
  if (equipment.critDamage && equipment.critDamage > 0) statRows.push({ label: '暴伤', value: `+${equipment.critDamage}%`, color: neonPurple });
  if (equipment.range && equipment.range > 0) statRows.push({ label: '射程', value: `+${equipment.range}`, color: '#34C759' });
  if (equipment.element && equipment.elementalDamage) {
    const elemLabel = equipment.element === 'fire' ? '火' : equipment.element === 'ice' ? '冰' : equipment.element === 'lightning' ? '雷' : '毒';
    const elemColor = equipment.element === 'fire' ? '#FF6B35' : equipment.element === 'ice' ? '#5BC0EB' : equipment.element === 'lightning' ? '#FFD700' : '#9B59B6';
    statRows.push({ label: `${elemLabel}属性`, value: `+${equipment.elementalDamage}`, color: elemColor });
  }

  const getAffixLabel = (a: EquipmentAffix) => {
    switch (a.type) {
      case 'attack': return '攻击';
      case 'defense': return '防御';
      case 'resistance': return '抗性';
      case 'health': return '生命';
      case 'critRate': return '暴击';
      case 'critDamage': return '暴伤';
      case 'attackSpeed': return '攻速';
      case 'range': return '射程';
      case 'pierce': return '穿透';
      case 'elementalAttack':
        return `${a.element === 'fire' ? '火攻' : a.element === 'ice' ? '冰攻' : a.element === 'lightning' ? '雷攻' : '毒攻'}`;
      case 'elementalDamage':
        return `${a.element === 'fire' ? '火伤' : a.element === 'ice' ? '冰伤' : a.element === 'lightning' ? '雷伤' : '毒伤'}`;
      case 'statusFreeze': return '冰冻';
      case 'statusPoison': return '中毒';
      case 'statusBurn': return '灼烧';
      default: return a.type;
    }
  };
  const getAffixColor = (a: EquipmentAffix) => {
    switch (a.type) {
      case 'attack': return neonPink;
      case 'defense': return '#5BA3E0';
      case 'resistance': return '#5BA3E0';
      case 'health': return '#34C759';
      case 'critRate': return neonPurple;
      case 'critDamage': return neonPurple;
      case 'attackSpeed': return neonCyan;
      case 'range': return '#34C759';
      case 'pierce': return neonYellow;
      case 'elementalAttack':
      case 'elementalDamage':
        return a.element === 'fire' ? '#FF6B35' : a.element === 'ice' ? '#5BC0EB' : a.element === 'lightning' ? '#FFD700' : '#9B59B6';
      case 'statusFreeze': return '#5BC0EB';
      case 'statusPoison': return '#9B59B6';
      case 'statusBurn': return '#FF6B35';
      default: return '#E0E0FF';
    }
  };
  const isPercentAffix = (a: EquipmentAffix) =>
    a.type === 'critRate' || a.type === 'critDamage' || a.type === 'attackSpeed' ||
    a.type === 'statusFreeze' || a.type === 'statusPoison' || a.type === 'statusBurn';

  return createPortal(
    <div
      data-role="detail-mask"
      className="fixed inset-0 flex items-center justify-center z-[300]"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: '280px',
          height: '440px',
          padding: '12px 14px',
          background: 'rgba(19, 16, 37, 0.95)',
          border: `1px solid ${hexToRgba(rarityColor, 0.5)}`,
          borderRadius: '10px',
          boxShadow: `0 0 24px ${hexToRgba(rarityColor, 0.3)}`,
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD 背景：与按钮区不同纹路/颜色（按稀有度着色） */}
        <ModalHudBackground accentColor={rarityColor} accentColor2={neonCyan} />
        <div className="relative flex flex-col min-h-0" style={{ zIndex: 1, flex: 1 }}>
          {/* 头部：图标 + 装备名 + 关闭按钮 */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center relative flex-shrink-0"
                style={{ width: '36px', height: '36px', ...itemSlotStyle(equipment.rarity) }}
              >
                <EquipmentIcon slot={equipment.slot} rarity={equipment.rarity} variant={equipment.iconVariant} size={28} gemCount={gems.length} enhanceLevel={enhanceLevel} level={equipment.level} />
              </div>
              <div className="min-w-0">
                <div
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: rarityColor,
                    textShadow: `0 0 6px ${hexToRgba(rarityColor, 0.5)}`,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {getRarityName(equipment.rarity)} {equipment.name}
                </div>
                <div
                  className="flex items-center gap-1.5"
                  style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '7px', color: '#8B80A0', marginTop: '1px' }}
                >
                  <span>{SLOT_LABELS[equipment.slot as keyof typeof SLOT_LABELS]}</span>
                  <span style={{ color: neonYellow, fontWeight: 700 }}>Lv.{equipment.level}</span>
                </div>
              </div>
            </div>
            <button
              style={{
                background: 'rgba(255, 45, 85, 0.2)',
                border: '1px solid rgba(255, 45, 85, 0.4)',
                color: '#FF2D55',
                width: '20px',
                height: '20px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                borderRadius: '5px',
              }}
              onClick={onClose}
            >
              ×
            </button>
          </div>

          {/* 主属性 + 词条 */}
          <div
            className="overflow-y-auto pt-2 flex-1 min-h-0"
            style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}
          >
            <div className="grid grid-cols-3 gap-x-2 gap-y-0.5">
              {statRows.map((row, i) => (
                <div key={i} className="flex justify-between min-w-0">
                  <span style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '6.5px', color: row.color }}>{row.label}</span>
                  <span style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '6.5px', color: '#FFFFFF', flexShrink: 0, marginLeft: '4px' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* 词条 */}
            {equipment.affixes && equipment.affixes.length > 0 && (
              <div className="mt-1.5 pt-1 grid grid-cols-3 gap-x-2 gap-y-0.5" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.1)' }}>
                {equipment.affixes.map((a, i) => (
                  <div key={i} className="flex justify-between min-w-0">
                    <span
                      className="truncate"
                      style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '6.5px', color: getAffixColor(a) }}
                    >
                      {getAffixLabel(a)}
                    </span>
                    <span
                      style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '6.5px', color: '#FFFFFF', flexShrink: 0, marginLeft: '4px' }}
                    >
                      +{a.value}{isPercentAffix(a) ? '%' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 强化 / 宝石 / 附魔 */}
          <div className="grid grid-cols-3 gap-x-2 mt-1" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)', paddingTop: '4px' }}>
            {/* 强化 */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between min-w-0">
                <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>强化</span>
                {enhanceLevel > 0 && (
                  <span style={{ ...neonText, fontSize: '7px', color: neonPink, marginLeft: '4px', flexShrink: 0 }}>
                    攻击+{enhanceBonus}
                  </span>
                )}
              </div>
            </div>
            {/* 宝石 */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between min-w-0">
                <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>宝石</span>
                {gems.length > 0 && (
                  <span style={{ ...neonText, fontSize: '7px', color: neonCyan, marginLeft: '4px', flexShrink: 0 }}>
                    {gems.length}颗
                  </span>
                )}
              </div>
            </div>
            {/* 附魔 */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between min-w-0">
                <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>附魔</span>
                {equipment.enchantment && (
                  <span style={{ ...neonText, fontSize: '7px', color: neonPurple, marginLeft: '4px', flexShrink: 0 }}>
                    已附魔
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
