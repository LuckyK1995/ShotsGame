import type { CSSProperties } from 'react';
import { RARITY_COLORS } from '../game/data/equipment';
import type { ItemRarity, EquipRarity } from '../game/types/game';

/**
 * 16进制颜色转 rgba 字符串
 * 取代 6 个组件中的重复定义
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 品质框线透明度
const BORDER_ALPHA: Record<string, number> = {
  common: 0.3, advanced: 0.4, fine: 0.5,
  legendary: 0.55, epic: 0.6, mythic: 0.65,
};

// 品质发光模糊半径
const GLOW_BLUR: Record<string, number> = {
  common: 0, advanced: 6, fine: 8,
  legendary: 10, epic: 12, mythic: 14,
};

// 品质发光透明度
const GLOW_ALPHA: Record<string, number> = {
  common: 0, advanced: 0.2, fine: 0.25,
  legendary: 0.3, epic: 0.35, mythic: 0.4,
};

// 品质径向渐变背景
const RARITY_GRADIENT: Record<string, string> = {
  common: 'radial-gradient(circle at 50% 45%, #2A2540 0%, #1E1A35 55%, #15122A 100%)',
  advanced: 'radial-gradient(circle at 50% 45%, #253050 0%, #1A2540 55%, #101830 100%)',
  fine: 'radial-gradient(circle at 50% 45%, #3A2855 0%, #2A1C45 55%, #1E1035 100%)',
  legendary: 'radial-gradient(circle at 50% 40%, #8A4A2A 0%, #5A2A10 60%, #3A1A08 100%)',
  epic: 'radial-gradient(circle at 50% 40%, #7A6A20 0%, #4D4010 60%, #2F2808 100%)',
  mythic: 'radial-gradient(circle at 50% 40%, #8A2A3A 0%, #5A1A20 60%, #3A0A10 100%)',
};

/**
 * 通用物品格子样式（36x36，2.5px 实线边框，8px 圆角，稀有度径向渐变 + 发光）
 */
export function itemSlotStyle(rarity?: string, marqueeColor?: string): CSSProperties {
  const r = (rarity || 'common') as ItemRarity;
  const baseColor = RARITY_COLORS[r] || RARITY_COLORS.common;
  const blur = GLOW_BLUR[r] || 0;
  const glow = blur > 0 ? `0 0 ${blur}px ${hexToRgba(baseColor, GLOW_ALPHA[r] || 0)}` : 'none';

  if (marqueeColor) {
    return {
      background: RARITY_GRADIENT[r],
      border: '2.5px solid transparent',
      borderRadius: '8px',
      boxShadow: 'none',
      cursor: 'pointer',
      ['--mc' as any]: marqueeColor,
      position: 'relative',
      overflow: 'visible',
    };
  }

  return {
    background: RARITY_GRADIENT[r],
    border: `2.5px solid ${hexToRgba(baseColor, BORDER_ALPHA[r] || 0.3)}`,
    borderRadius: '8px',
    boxShadow: glow,
    cursor: 'pointer',
  };
}

/**
 * 装备格子样式（EquipRarity 版本，与 itemSlotStyle 保持一致）
 */
export function equipSlotStyle(rarity: EquipRarity, marqueeColor?: string): CSSProperties {
  return itemSlotStyle(rarity, marqueeColor);
}

/**
 * 空格子样式（统一：深色背景 + 实线边框 + 半透明）
 */
export const emptySlotStyle: CSSProperties = {
  background: 'rgba(19, 16, 37, 0.2)',
  border: '2.5px solid rgba(100, 100, 130, 0.15)',
  borderRadius: '8px',
  opacity: 0.6,
};
