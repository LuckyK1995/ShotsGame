import React from 'react';
import type { EnchantItemId, EnchantStat } from '../game/data/enchantItems';
import { ENCHANT_ITEMS, ENCHANT_STAT_INFO } from '../game/data/enchantItems';
import type { ItemRarity } from '../game/types/game';

interface EnchantItemIconProps {
  itemId: EnchantItemId;
  size?: number;
}

function Pixel({ x, y, color, w = 1, h = 1, opacity = 1 }: { x: number; y: number; color: string; w?: number; h?: number; opacity?: number }) {
  return <rect x={x} y={y} width={w} height={h} fill={color} opacity={opacity} />;
}

// 品质色板（与装备品质色一致）
const RARITY_COLORS: Record<ItemRarity, { cover: string; coverDark: string; coverLight: string; spine: string; spineDark: string; glow: string; rune: string }> = {
  common: {
    cover: '#4A4A55', coverDark: '#2A2A35', coverLight: '#6A6A75',
    spine: '#3A3A45', spineDark: '#1A1A25', glow: '#7A7A85', rune: '#C0C0C0',
  },
  advanced: {
    cover: '#2A5A3A', coverDark: '#1A3A2A', coverLight: '#4A7A5A',
    spine: '#1A4A2A', spineDark: '#0A2A1A', glow: '#5BC07A', rune: '#7AFF9D',
  },
  fine: {
    cover: '#2A3A8A', coverDark: '#1A2A6A', coverLight: '#4A5AAA',
    spine: '#1A2A7A', spineDark: '#0A1A5A', glow: '#5B7AE0', rune: '#7AB0FF',
  },
  legendary: {
    cover: '#8A4A2A', coverDark: '#5A2A10', coverLight: '#AA6A4A',
    spine: '#6A3A1A', spineDark: '#3A1A00', glow: '#FF8C00', rune: '#FFB840',
  },
  epic: {
    cover: '#7A6A20', coverDark: '#4D4010', coverLight: '#9A8A40',
    spine: '#5A4A10', spineDark: '#3A2A00', glow: '#FFD700', rune: '#FFE680',
  },
  mythic: {
    cover: '#8A2A3A', coverDark: '#5A1A20', coverLight: '#AA4A5A',
    spine: '#6A1A2A', spineDark: '#3A0A10', glow: '#FF3B3B', rune: '#FF8080',
  },
};

// 各属性的中央符文图案（16x16 像素艺术）
// 剑（攻击）、心（生命）、盾（防御）、星（暴击）、菱晶（抗性）
function StatRune({ stat, rune, glow }: { stat: EnchantStat; rune: string; glow: string }) {
  switch (stat) {
    case 'attack':
      // 剑形：竖直剑身 + 横向护手 + 剑尖
      return (
        <>
          <Pixel x={7} y={4} color={rune} />
          <Pixel x={7} y={5} color={rune} />
          <Pixel x={7} y={6} color={rune} />
          <Pixel x={5} y={7} color={rune} w={5} h={1} />
          <Pixel x={7} y={8} color={rune} />
          <Pixel x={7} y={9} color={rune} />
          <Pixel x={7} y={10} color={rune} />
          <Pixel x={7} y={11} color={rune} />
          <Pixel x={7} y={12} color={glow} />
          <Pixel x={6} y={7} color={glow} />
          <Pixel x={8} y={7} color={glow} />
        </>
      );
    case 'health':
      // 心形
      return (
        <>
          <Pixel x={5} y={5} color={rune} />
          <Pixel x={6} y={5} color={glow} />
          <Pixel x={9} y={5} color={rune} />
          <Pixel x={10} y={5} color={glow} />
          <Pixel x={4} y={6} color={rune} />
          <Pixel x={5} y={6} color={glow} />
          <Pixel x={6} y={6} color={rune} />
          <Pixel x={7} y={6} color={rune} />
          <Pixel x={8} y={6} color={rune} />
          <Pixel x={9} y={6} color={rune} />
          <Pixel x={10} y={6} color={glow} />
          <Pixel x={11} y={6} color={rune} />
          <Pixel x={5} y={7} color={rune} />
          <Pixel x={6} y={7} color={rune} />
          <Pixel x={7} y={7} color={glow} />
          <Pixel x={8} y={7} color={rune} />
          <Pixel x={9} y={7} color={rune} />
          <Pixel x={10} y={7} color={rune} />
          <Pixel x={6} y={8} color={rune} />
          <Pixel x={7} y={8} color={rune} />
          <Pixel x={8} y={8} color={rune} />
          <Pixel x={9} y={8} color={rune} />
          <Pixel x={7} y={9} color={rune} />
          <Pixel x={8} y={9} color={rune} />
          <Pixel x={7} y={10} color={glow} />
        </>
      );
    case 'defense':
      // 盾形
      return (
        <>
          <Pixel x={4} y={4} color={rune} w={8} h={1} />
          <Pixel x={4} y={5} color={rune} />
          <Pixel x={11} y={5} color={rune} />
          <Pixel x={4} y={6} color={rune} />
          <Pixel x={11} y={6} color={rune} />
          <Pixel x={4} y={7} color={rune} />
          <Pixel x={11} y={7} color={rune} />
          <Pixel x={5} y={8} color={rune} />
          <Pixel x={10} y={8} color={rune} />
          <Pixel x={6} y={9} color={rune} />
          <Pixel x={9} y={9} color={rune} />
          <Pixel x={7} y={10} color={rune} />
          <Pixel x={8} y={10} color={rune} />
          <Pixel x={7} y={11} color={glow} />
          <Pixel x={6} y={6} color={glow} />
          <Pixel x={7} y={6} color={glow} />
          <Pixel x={8} y={6} color={glow} />
          <Pixel x={9} y={6} color={glow} />
        </>
      );
    case 'critRate':
      // 四角星
      return (
        <>
          <Pixel x={7} y={3} color={glow} />
          <Pixel x={7} y={4} color={rune} />
          <Pixel x={6} y={5} color={rune} />
          <Pixel x={7} y={5} color={rune} />
          <Pixel x={8} y={5} color={rune} />
          <Pixel x={3} y={6} color={rune} />
          <Pixel x={4} y={6} color={rune} />
          <Pixel x={5} y={6} color={rune} />
          <Pixel x={6} y={6} color={rune} />
          <Pixel x={7} y={6} color={glow} />
          <Pixel x={8} y={6} color={rune} />
          <Pixel x={9} y={6} color={rune} />
          <Pixel x={10} y={6} color={rune} />
          <Pixel x={11} y={6} color={rune} />
          <Pixel x={12} y={6} color={rune} />
          <Pixel x={6} y={7} color={rune} />
          <Pixel x={7} y={7} color={rune} />
          <Pixel x={8} y={7} color={rune} />
          <Pixel x={9} y={7} color={rune} />
          <Pixel x={6} y={8} color={rune} />
          <Pixel x={7} y={8} color={rune} />
          <Pixel x={8} y={8} color={rune} />
          <Pixel x={9} y={8} color={rune} />
          <Pixel x={5} y={9} color={rune} />
          <Pixel x={6} y={9} color={rune} />
          <Pixel x={7} y={9} color={glow} />
          <Pixel x={8} y={9} color={rune} />
          <Pixel x={9} y={9} color={rune} />
          <Pixel x={4} y={10} color={rune} />
          <Pixel x={5} y={10} color={rune} />
          <Pixel x={7} y={10} color={rune} />
          <Pixel x={8} y={10} color={rune} />
          <Pixel x={10} y={10} color={rune} />
          <Pixel x={11} y={10} color={rune} />
          <Pixel x={7} y={11} color={rune} />
          <Pixel x={7} y={12} color={glow} />
        </>
      );
    case 'resistance':
      // 菱形宝石
      return (
        <>
          <Pixel x={7} y={3} color={glow} />
          <Pixel x={6} y={4} color={rune} />
          <Pixel x={7} y={4} color={glow} />
          <Pixel x={8} y={4} color={rune} />
          <Pixel x={5} y={5} color={rune} />
          <Pixel x={6} y={5} color={glow} />
          <Pixel x={7} y={5} color={rune} />
          <Pixel x={8} y={5} color={glow} />
          <Pixel x={9} y={5} color={rune} />
          <Pixel x={4} y={6} color={rune} />
          <Pixel x={5} y={6} color={rune} />
          <Pixel x={6} y={6} color={rune} />
          <Pixel x={7} y={6} color={glow} />
          <Pixel x={8} y={6} color={rune} />
          <Pixel x={9} y={6} color={rune} />
          <Pixel x={10} y={6} color={rune} />
          <Pixel x={4} y={7} color={rune} />
          <Pixel x={5} y={7} color={rune} />
          <Pixel x={6} y={7} color={rune} />
          <Pixel x={7} y={7} color={rune} />
          <Pixel x={8} y={7} color={rune} />
          <Pixel x={9} y={7} color={rune} />
          <Pixel x={10} y={7} color={rune} />
          <Pixel x={5} y={8} color={rune} />
          <Pixel x={6} y={8} color={rune} />
          <Pixel x={7} y={8} color={glow} />
          <Pixel x={8} y={8} color={rune} />
          <Pixel x={9} y={8} color={rune} />
          <Pixel x={6} y={9} color={rune} />
          <Pixel x={7} y={9} color={rune} />
          <Pixel x={8} y={9} color={rune} />
          <Pixel x={7} y={10} color={rune} />
          <Pixel x={7} y={11} color={glow} />
        </>
      );
  }
}

export const EnchantItemIcon: React.FC<EnchantItemIconProps> = React.memo(({ itemId, size = 28 }) => {
  const def = ENCHANT_ITEMS[itemId];
  if (!def) return null;
  const palette = RARITY_COLORS[def.rarity];
  const stat = def.stat;
  const statColor = ENCHANT_STAT_INFO[stat].color;

  // 高品质发光（传说及以上）
  const hasGlow = def.rarity === 'legendary' || def.rarity === 'epic' || def.rarity === 'mythic';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      overflow="visible"
      style={{ imageRendering: 'pixelated', overflow: 'visible' }}
    >
      {/* 书本阴影底 */}
      <Pixel x={3} y={14} color="#000000" w={10} h={1} opacity={0.4} />
      {/* 书脊（左侧深色竖条） */}
      <Pixel x={3} y={3} color={palette.spineDark} w={1} h={10} />
      <Pixel x={4} y={3} color={palette.spine} w={1} h={10} />
      {/* 书脊金线装饰 */}
      <Pixel x={4} y={4} color={palette.rune} />
      <Pixel x={4} y={8} color={palette.rune} />
      <Pixel x={4} y={12} color={palette.rune} />
      {/* 书本封面 */}
      <Pixel x={5} y={3} color={palette.coverDark} w={8} h={1} />
      <Pixel x={5} y={4} color={palette.coverDark} w={8} h={1} />
      <Pixel x={5} y={5} color={palette.cover} w={8} h={6} />
      <Pixel x={5} y={11} color={palette.coverDark} w={8} h={1} />
      <Pixel x={5} y={12} color={palette.coverDark} w={8} h={1} />
      {/* 封面亮边 */}
      <Pixel x={5} y={5} color={palette.coverLight} w={8} h={1} />
      <Pixel x={5} y={10} color={palette.coverDark} w={8} h={1} />
      {/* 右侧页面边 */}
      <Pixel x={13} y={3} color="#FFFFFF" w={1} h={10} />
      <Pixel x={14} y={3} color="#E0E0E0" w={1} h={10} />
      {/* 书页顶部 */}
      <Pixel x={3} y={2} color="#FFFFFF" w={11} h={1} />
      <Pixel x={3} y={1} color="#E0E0E0" w={11} h={1} />
      {/* 高品质外发光 */}
      {hasGlow && (
        <>
          <Pixel x={2} y={3} color={palette.glow} opacity={0.5} />
          <Pixel x={2} y={7} color={palette.glow} opacity={0.4} />
          <Pixel x={2} y={11} color={palette.glow} opacity={0.5} />
          <Pixel x={13} y={2} color={palette.glow} opacity={0.5} />
          <Pixel x={13} y={13} color={palette.glow} opacity={0.5} />
        </>
      )}
      {/* 中央属性符文 */}
      <StatRune stat={stat} rune={palette.rune} glow={statColor} />
      {/* 顶部页脚金边 */}
      <Pixel x={4} y={3} color={palette.rune} />
      <Pixel x={11} y={3} color={palette.rune} />
    </svg>
  );
});
