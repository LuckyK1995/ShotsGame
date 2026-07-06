import React from 'react';
import type { EnhanceItemId } from '../game/data/enhanceItems';

interface EnhanceItemIconProps {
  itemId: EnhanceItemId;
  size?: number;
}

function Pixel({ x, y, color, w = 1, h = 1 }: { x: number; y: number; color: string; w?: number; h?: number }) {
  return <rect x={x} y={y} width={w} height={h} fill={color} />;
}

// 通用色板
const GOLD = '#FFD700';
const GOLD_DARK = '#B8860B';
const GOLD_LIGHT = '#FFE680';
const SILVER = '#C0C0C0';
const SILVER_DARK = '#707070';
const WHITE = '#FFFFFF';

// +1卷（神话品质）：发光的红色卷轴 + 金色装饰
function ScrollPlus1Icon() {
  // 主色：神话红 + 金 + 暗红
  const scrollDark = '#5A0A0A';
  const scrollMid = '#8A1A1A';
  const scrollLight = '#E03030';
  const scrollHigh = '#FF6B6B';
  const rune = '#FFD700';
  const runeGlow = '#FFE680';
  const wax = '#B80000';
  const waxHigh = '#FF3B3B';
  const ribbon = '#FFD700';
  const ribbonDark = '#B8860B';
  const ink = '#3A0000';
  const tassel = '#FFA500';
  const tasselDark = '#CC6600';
  const gemCore = '#FF3030';
  const gemGlow = '#FF8080';
  const edgeGold = '#FFD700';

  return (
    <>
      {/* 卷轴顶部金边 */}
      <Pixel x={4} y={1} color={edgeGold} w={8} h={1} />
      <Pixel x={3} y={2} color={GOLD_DARK} w={10} h={1} />
      {/* 卷轴主体 */}
      <Pixel x={3} y={3} color={scrollDark} w={10} h={1} />
      <Pixel x={4} y={4} color={scrollMid} w={8} h={1} />
      <Pixel x={4} y={5} color={scrollLight} w={8} h={1} />
      {/* 中部符文 "1" 金色发光 */}
      <Pixel x={7} y={4} color={runeGlow} />
      <Pixel x={7} y={5} color={rune} />
      <Pixel x={7} y={6} color={rune} />
      <Pixel x={7} y={7} color={rune} />
      <Pixel x={6} y={8} color={runeGlow} w={3} h={1} />
      <Pixel x={4} y={6} color={scrollLight} w={3} h={1} />
      <Pixel x={9} y={6} color={scrollLight} w={3} h={1} />
      <Pixel x={4} y={7} color={scrollMid} w={3} h={1} />
      <Pixel x={9} y={7} color={scrollMid} w={3} h={1} />
      <Pixel x={4} y={8} color={scrollDark} w={3} h={1} />
      <Pixel x={9} y={8} color={scrollDark} w={3} h={1} />
      {/* 卷轴底部金边 */}
      <Pixel x={3} y={9} color={GOLD_DARK} w={10} h={1} />
      <Pixel x={4} y={10} color={edgeGold} w={8} h={1} />
      {/* 红色蜡封印 */}
      <Pixel x={7} y={11} color={wax} />
      <Pixel x={6} y={12} color={wax} w={3} h={1} />
      <Pixel x={7} y={13} color={waxHigh} />
      <Pixel x={7} y={12} color={gemGlow} />
      {/* 两侧流苏 */}
      <Pixel x={2} y={3} color={tasselDark} />
      <Pixel x={2} y={4} color={tassel} />
      <Pixel x={2} y={5} color={tasselDark} />
      <Pixel x={13} y={3} color={tasselDark} />
      <Pixel x={13} y={4} color={tassel} />
      <Pixel x={13} y={5} color={tasselDark} />
      {/* 顶部宝石装饰 */}
      <Pixel x={7} y={0} color={gemCore} w={2} h={1} />
      <Pixel x={8} y={0} color={gemGlow} />
      {/* 底部丝带 */}
      <Pixel x={5} y={14} color={ribbonDark} w={6} h={1} />
      <Pixel x={6} y={15} color={ribbon} w={4} h={1} />
    </>
  );
}

// +2卷（稀有品质/精致）：紫色卷轴 + 银色装饰
function ScrollPlus2Icon() {
  const scrollDark = '#3A0A4A';
  const scrollMid = '#5A1A7A';
  const scrollLight = '#9040C0';
  const scrollHigh = '#B060E0';
  const rune = '#E0C0FF';
  const runeGlow = '#FFFFFF';
  const wax = '#4A1A8A';
  const waxHigh = '#7030C0';
  const ribbon = '#C0C0C0';
  const ribbonDark = '#707070';
  const ink = '#1A0030';
  const tassel = '#A0C0E0';
  const tasselDark = '#5070A0';
  const gemCore = '#8030C0';
  const gemGlow = '#C0A0FF';
  const edgeSilver = '#E0E0E0';

  return (
    <>
      <Pixel x={4} y={1} color={edgeSilver} w={8} h={1} />
      <Pixel x={3} y={2} color={SILVER_DARK} w={10} h={1} />
      <Pixel x={3} y={3} color={scrollDark} w={10} h={1} />
      <Pixel x={4} y={4} color={scrollMid} w={8} h={1} />
      <Pixel x={4} y={5} color={scrollLight} w={8} h={1} />
      {/* 中部符文 "2" 紫色发光 */}
      <Pixel x={6} y={4} color={runeGlow} w={4} h={1} />
      <Pixel x={9} y={5} color={rune} />
      <Pixel x={6} y={6} color={rune} />
      <Pixel x={7} y={6} color={scrollLight} />
      <Pixel x={8} y={6} color={scrollLight} />
      <Pixel x={9} y={6} color={scrollLight} />
      <Pixel x={6} y={7} color={scrollLight} />
      <Pixel x={7} y={7} color={scrollLight} />
      <Pixel x={8} y={7} color={scrollLight} />
      <Pixel x={9} y={7} color={rune} />
      <Pixel x={6} y={8} color={runeGlow} w={4} h={1} />
      <Pixel x={4} y={6} color={scrollMid} w={2} h={1} />
      <Pixel x={10} y={6} color={scrollMid} w={2} h={1} />
      <Pixel x={4} y={7} color={scrollDark} w={2} h={1} />
      <Pixel x={10} y={7} color={scrollDark} w={2} h={1} />
      <Pixel x={4} y={8} color={scrollDark} w={2} h={1} />
      <Pixel x={10} y={8} color={scrollDark} w={2} h={1} />
      <Pixel x={3} y={9} color={SILVER_DARK} w={10} h={1} />
      <Pixel x={4} y={10} color={edgeSilver} w={8} h={1} />
      {/* 紫色蜡封印 */}
      <Pixel x={7} y={11} color={wax} />
      <Pixel x={6} y={12} color={wax} w={3} h={1} />
      <Pixel x={7} y={13} color={waxHigh} />
      <Pixel x={7} y={12} color={gemGlow} />
      {/* 两侧流苏 */}
      <Pixel x={2} y={3} color={tasselDark} />
      <Pixel x={2} y={4} color={tassel} />
      <Pixel x={2} y={5} color={tasselDark} />
      <Pixel x={13} y={3} color={tasselDark} />
      <Pixel x={13} y={4} color={tassel} />
      <Pixel x={13} y={5} color={tasselDark} />
      {/* 顶部宝石装饰 */}
      <Pixel x={7} y={0} color={gemCore} w={2} h={1} />
      <Pixel x={8} y={0} color={gemGlow} />
      <Pixel x={5} y={14} color={ribbonDark} w={6} h={1} />
      <Pixel x={6} y={15} color={ribbon} w={4} h={1} />
    </>
  );
}

// 普通强化器（普通品质）：灰色铁砧 + 锤子
function NormalBoosterIcon() {
  const ironDark = '#3A3A3A';
  const ironMid = '#5A5A5A';
  const ironLight = '#9A9A9A';
  const ironHigh = '#C0C0C0';
  const ironSpec = '#E0E0E0';
  const wood = '#6B4423';
  const woodDark = '#3D2914';
  const rust = '#8B4513';
  const rustDark = '#5A2D08';
  const screw = '#FFD700';
  const screwDark = '#B8860B';
  const hammerHead = '#4A4A4A';
  const hammerHeadLight = '#707070';
  const handle = '#8B5A2B';
  const handleDark = '#5A3A1A';
  const base = '#2A2A2A';

  return (
    <>
      {/* 锤子（顶部斜放） */}
      <Pixel x={9} y={1} color={handleDark} />
      <Pixel x={10} y={2} color={handle} />
      <Pixel x={11} y={3} color={handle} />
      <Pixel x={12} y={4} color={handleDark} />
      {/* 锤头 */}
      <Pixel x={6} y={0} color={hammerHead} w={4} h={1} />
      <Pixel x={6} y={1} color={hammerHeadLight} w={4} h={1} />
      <Pixel x={6} y={2} color={hammerHead} w={4} h={1} />
      <Pixel x={7} y={0} color={ironSpec} />
      {/* 铁砧顶部（圆弧） */}
      <Pixel x={4} y={5} color={ironLight} w={8} h={1} />
      <Pixel x={3} y={6} color={ironMid} w={10} h={1} />
      <Pixel x={3} y={7} color={ironDark} w={10} h={1} />
      {/* 铁砧主体 */}
      <Pixel x={4} y={8} color={ironMid} w={8} h={1} />
      <Pixel x={4} y={9} color={ironDark} w={8} h={1} />
      {/* 铁砧腰部 */}
      <Pixel x={5} y={10} color={ironDark} w={6} h={1} />
      {/* 铁砧底座 */}
      <Pixel x={3} y={11} color={base} w={10} h={1} />
      <Pixel x={2} y={12} color={woodDark} w={12} h={1} />
      <Pixel x={2} y={13} color={wood} w={12} h={1} />
      <Pixel x={2} y={14} color={woodDark} w={12} h={1} />
      <Pixel x={3} y={15} color={base} w={10} h={1} />
      {/* 高光 */}
      <Pixel x={5} y={5} color={ironSpec} />
      <Pixel x={9} y={5} color={ironHigh} />
      {/* 螺丝/铆钉 */}
      <Pixel x={4} y={8} color={screw} />
      <Pixel x={11} y={8} color={screw} />
      <Pixel x={4} y={8} color={screwDark} />
      <Pixel x={11} y={8} color={screwDark} />
      {/* 锈迹 */}
      <Pixel x={6} y={9} color={rust} />
      <Pixel x={9} y={9} color={rustDark} />
    </>
  );
}

// 远古强化器（史诗品质）：金色发光铁砧 + 能量符文
function AncientBoosterIcon() {
  const goldBright = '#FFEB80';
  const goldLight = '#FFD700';
  const goldMid = '#D4A020';
  const goldDark = '#8B6010';
  const goldDeep = '#5A3A08';
  const energyCore = '#FFE680';
  const energyGlow = '#FFFFFF';
  const runeColor = '#FF8C00';
  const runeGlow = '#FFC080';
  const gemRed = '#E03030';
  const gemRedGlow = '#FF6B6B';
  const ironDark = '#3A2A0A';
  const ironMid = '#5A4A1A';
  const wood = '#6B4423';
  const woodDark = '#3D2914';
  const aura = '#FFD700';

  return (
    <>
      {/* 顶部能量光环 */}
      <Pixel x={5} y={0} color={energyGlow} w={6} h={1} />
      <Pixel x={4} y={1} color={goldBright} w={8} h={1} />
      {/* 锤子（远古金色） */}
      <Pixel x={9} y={2} color={goldMid} />
      <Pixel x={10} y={3} color={goldLight} />
      <Pixel x={11} y={4} color={goldMid} />
      <Pixel x={12} y={5} color={goldDark} />
      {/* 锤头 */}
      <Pixel x={6} y={1} color={goldDark} w={4} h={1} />
      <Pixel x={6} y={2} color={goldLight} w={4} h={1} />
      <Pixel x={6} y={3} color={goldBright} w={4} h={1} />
      <Pixel x={6} y={4} color={goldLight} w={4} h={1} />
      <Pixel x={7} y={1} color={energyGlow} />
      {/* 铁砧顶部（金色圆弧） */}
      <Pixel x={4} y={5} color={goldLight} w={8} h={1} />
      <Pixel x={3} y={6} color={goldMid} w={10} h={1} />
      <Pixel x={3} y={7} color={goldDark} w={10} h={1} />
      {/* 铁砧主体 */}
      <Pixel x={4} y={8} color={goldMid} w={8} h={1} />
      <Pixel x={4} y={9} color={goldDark} w={8} h={1} />
      {/* 符文（顶部） */}
      <Pixel x={5} y={6} color={runeGlow} />
      <Pixel x={10} y={6} color={runeGlow} />
      <Pixel x={5} y={7} color={runeColor} />
      <Pixel x={10} y={7} color={runeColor} />
      {/* 中央宝石 */}
      <Pixel x={7} y={8} color={gemRed} w={2} h={1} />
      <Pixel x={7} y={9} color={gemRedGlow} w={2} h={1} />
      {/* 铁砧腰部 */}
      <Pixel x={5} y={10} color={goldDark} w={6} h={1} />
      {/* 底座 */}
      <Pixel x={3} y={11} color={ironDark} w={10} h={1} />
      <Pixel x={2} y={12} color={woodDark} w={12} h={1} />
      <Pixel x={2} y={13} color={wood} w={12} h={1} />
      <Pixel x={2} y={14} color={woodDark} w={12} h={1} />
      <Pixel x={3} y={15} color={ironDark} w={10} h={1} />
      {/* 能量光斑 */}
      <Pixel x={6} y={5} color={energyGlow} />
      <Pixel x={9} y={5} color={energyCore} />
      {/* 高光 */}
      <Pixel x={4} y={6} color={goldBright} />
      <Pixel x={11} y={6} color={goldBright} />
      <Pixel x={4} y={8} color={goldBright} />
      <Pixel x={11} y={8} color={goldBright} />
      {/* 能量光环（顶部、底部） */}
      <Pixel x={6} y={2} color={aura} />
      <Pixel x={9} y={2} color={aura} />
      <Pixel x={7} y={11} color={energyCore} />
      <Pixel x={8} y={11} color={energyGlow} />
    </>
  );
}

const ICON_MAP: Record<EnhanceItemId, React.FC> = {
  enhance_scroll_plus1: ScrollPlus1Icon,
  enhance_scroll_plus2: ScrollPlus2Icon,
  enhance_normal_booster: NormalBoosterIcon,
  enhance_ancient_booster: AncientBoosterIcon,
};

export const EnhanceItemIcon: React.FC<EnhanceItemIconProps> = React.memo(({ itemId, size = 28 }) => {
  const IconComp = ICON_MAP[itemId];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      overflow="visible"
      style={{ imageRendering: 'pixelated', overflow: 'visible' }}
    >
      {IconComp ? <IconComp /> : null}
    </svg>
  );
});
