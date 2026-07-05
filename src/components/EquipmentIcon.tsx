import type { EquipSlot, EquipRarity } from '../game/types/game';

interface EquipmentIconProps {
  slot: EquipSlot;
  rarity: EquipRarity;
  variant: number;
  size?: number;
}

const RARITY_TINTS: Record<EquipRarity, string> = {
  common: '#9A9A9A',
  advanced: '#5BA3E0',
  fine: '#B060E0',
  legendary: '#E08030',
  epic: '#E0C040',
  mythic: '#E03030',
};

// 高级品质发光色（用于科技感发光）
const RARITY_GLOW: Record<EquipRarity, string> = {
  common: 'transparent',
  advanced: 'transparent',
  fine: 'transparent',
  legendary: '#FF8C00',
  epic: '#FFD700',
  mythic: '#FF3B3B',
};

function Pixel({ x, y, color, size = 1, width, height }: { x: number; y: number; color: string; size?: number; width?: number; height?: number }) {
  const w = width ?? size;
  const h = height ?? size;
  return <rect x={x} y={y} width={w} height={h} fill={color} />;
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// 通用色板（每个图标实际使用 10-15 种以上色彩）
const ACCENT = '#00E5FF';      // 霓虹青：科技点缀
const GOLD = '#FFD700';        // 金：扣/拉链
const GOLD_DARK = '#B8860B';   // 暗金
const SILVER = '#C0C0C0';      // 银：扣眼/铆钉
const SILVER_DARK = '#707070';  // 暗银
const STITCH = '#E8C879';      // 缝线
const LEATHER_DARK = '#3D2914'; // 深皮革
const LEATHER = '#6B4423';      // 皮革
const CUFF = '#3D3D5C';         // 袖口深色

// 武器：枪械侧面轮廓（枪管+枪身+弹夹+握把+瞄准镜）
function WeaponIcon({ variant, tint }: { variant: number; tint: string }) {
  const main = tint;
  const dark = adjustColor(tint, -40);
  const darker = adjustColor(tint, -65);
  const light = adjustColor(tint, 30);
  const highlight = adjustColor(tint, 55);
  const barrel = '#2A2A2A';
  const barrelDark = '#111111';
  const barrelLight = '#4A4A4A';
  const mag = GOLD;
  const magDark = GOLD_DARK;
  const magLight = '#FFE680';
  const sight = ACCENT;
  const sightDark = '#0099AA';
  const screw = SILVER;
  const screwDark = SILVER_DARK;
  const grip = LEATHER;
  const gripDark = LEATHER_DARK;
  const trigger = '#5D4037';
  const core = '#44CCFF';

  const patterns = [
    // 变体1：战术突击步枪（长枪管+弹夹+握把+瞄准镜）
    <>
      {/* 枪管 */}
      <Pixel x={2} y={7} color={barrelDark} size={2} />
      <Pixel x={2} y={8} color={barrel} size={2} />
      <Pixel x={4} y={7} color={barrelDark} />
      <Pixel x={4} y={8} color={barrel} />
      {/* 枪身主体 */}
      <Pixel x={5} y={6} color={dark} />
      <Pixel x={5} y={7} color={main} />
      <Pixel x={5} y={8} color={dark} />
      <Pixel x={6} y={6} color={light} />
      <Pixel x={6} y={7} color={main} size={2} />
      <Pixel x={6} y={9} color={dark} />
      <Pixel x={7} y={6} color={main} />
      <Pixel x={7} y={7} color={highlight} />
      <Pixel x={7} y={8} color={main} />
      <Pixel x={7} y={9} color={dark} />
      <Pixel x={8} y={6} color={main} />
      <Pixel x={8} y={7} color={main} />
      <Pixel x={8} y={8} color={light} />
      <Pixel x={8} y={9} color={dark} />
      <Pixel x={9} y={6} color={dark} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={9} y={9} color={dark} />
      {/* 枪口 */}
      <Pixel x={1} y={7} color={barrelDark} />
      <Pixel x={1} y={8} color={barrelDark} />
      {/* 瞄准镜 */}
      <Pixel x={7} y={4} color={sightDark} size={2} />
      <Pixel x={7} y={5} color={sight} />
      <Pixel x={8} y={5} color={sightDark} />
      <Pixel x={6} y={5} color={screwDark} />
      <Pixel x={9} y={5} color={screwDark} />
      {/* 弹夹（金色） */}
      <Pixel x={6} y={10} color={magDark} />
      <Pixel x={7} y={10} color={mag} />
      <Pixel x={8} y={10} color={magDark} />
      <Pixel x={6} y={11} color={mag} />
      <Pixel x={7} y={11} color={magLight} />
      <Pixel x={8} y={11} color={mag} />
      <Pixel x={7} y={12} color={magDark} />
      {/* 握把 */}
      <Pixel x={9} y={10} color={gripDark} />
      <Pixel x={10} y={10} color={grip} />
      <Pixel x={9} y={11} color={grip} />
      <Pixel x={10} y={11} color={gripDark} />
      <Pixel x={10} y={12} color={gripDark} />
      <Pixel x={11} y={11} color={gripDark} />
      {/* 扳机护圈 */}
      <Pixel x={9} y={9} color={screwDark} />
      <Pixel x={10} y={9} color={trigger} />
      {/* 装饰螺丝 */}
      <Pixel x={6} y={7} color={screw} />
      <Pixel x={8} y={7} color={screwDark} />
      {/* 枪尾 */}
      <Pixel x={10} y={6} color={dark} />
      <Pixel x={10} y={7} color={main} />
      <Pixel x={10} y={8} color={dark} />
      <Pixel x={11} y={7} color={darker} />
      {/* 能量条 */}
      <Pixel x={6} y={8} color={sight} />
      <Pixel x={7} y={8} color={core} />
    </>,
    // 变体2：精准狙击步枪（长枪管+大瞄准镜+长弹夹）
    <>
      <Pixel x={2} y={7} color={barrelDark} size={2} />
      <Pixel x={2} y={8} color={barrel} size={2} />
      <Pixel x={4} y={7} color={barrel} />
      <Pixel x={4} y={8} color={barrelDark} />
      <Pixel x={1} y={7} color={barrelDark} />
      <Pixel x={1} y={8} color={barrelDark} />
      {/* 枪身 */}
      <Pixel x={5} y={6} color={dark} size={2} />
      <Pixel x={5} y={8} color={dark} size={2} />
      <Pixel x={5} y={7} color={main} size={2} />
      <Pixel x={7} y={6} color={light} />
      <Pixel x={7} y={7} color={main} size={2} />
      <Pixel x={7} y={9} color={dark} />
      <Pixel x={8} y={6} color={main} />
      <Pixel x={8} y={7} color={highlight} />
      <Pixel x={8} y={8} color={main} />
      <Pixel x={8} y={9} color={dark} />
      <Pixel x={9} y={6} color={dark} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={9} y={9} color={dark} />
      {/* 大瞄准镜 */}
      <Pixel x={7} y={3} color={sightDark} size={2} />
      <Pixel x={7} y={4} color={sight} size={2} />
      <Pixel x={7} y={5} color={sightDark} />
      <Pixel x={8} y={5} color={screwDark} />
      <Pixel x={6} y={4} color={screw} />
      <Pixel x={6} y={5} color={screwDark} />
      {/* 镜片 */}
      <Pixel x={9} y={4} color={core} />
      <Pixel x={9} y={5} color={sightDark} />
      {/* 长弹夹 */}
      <Pixel x={7} y={10} color={magDark} />
      <Pixel x={8} y={10} color={mag} />
      <Pixel x={7} y={11} color={mag} />
      <Pixel x={8} y={11} color={magLight} />
      <Pixel x={7} y={12} color={magDark} />
      <Pixel x={8} y={12} color={mag} />
      <Pixel x={7} y={13} color={magDark} />
      {/* 握把 */}
      <Pixel x={9} y={10} color={gripDark} />
      <Pixel x={10} y={10} color={grip} />
      <Pixel x={9} y={11} color={grip} />
      <Pixel x={10} y={11} color={gripDark} />
      <Pixel x={10} y={12} color={gripDark} />
      {/* 扳机 */}
      <Pixel x={9} y={9} color={screwDark} />
      <Pixel x={10} y={9} color={trigger} />
      {/* 装饰 */}
      <Pixel x={6} y={7} color={screw} />
      <Pixel x={8} y={8} color={screwDark} />
      <Pixel x={10} y={6} color={darker} />
      <Pixel x={10} y={7} color={main} />
      <Pixel x={10} y={8} color={darker} />
      <Pixel x={6} y={8} color={sight} />
    </>,
    // 变体3：紧凑冲锋枪（短枪管+垂直握把）
    <>
      <Pixel x={3} y={7} color={barrelDark} size={2} />
      <Pixel x={3} y={8} color={barrel} size={2} />
      <Pixel x={2} y={7} color={barrelDark} />
      <Pixel x={2} y={8} color={barrelDark} />
      {/* 枪身 */}
      <Pixel x={5} y={6} color={dark} />
      <Pixel x={5} y={7} color={main} />
      <Pixel x={5} y={8} color={dark} />
      <Pixel x={6} y={6} color={light} />
      <Pixel x={6} y={7} color={main} size={2} />
      <Pixel x={6} y={9} color={dark} />
      <Pixel x={7} y={6} color={main} />
      <Pixel x={7} y={7} color={highlight} />
      <Pixel x={7} y={8} color={main} />
      <Pixel x={7} y={9} color={dark} />
      <Pixel x={8} y={6} color={main} />
      <Pixel x={8} y={7} color={main} />
      <Pixel x={8} y={8} color={light} />
      <Pixel x={8} y={9} color={dark} />
      <Pixel x={9} y={6} color={dark} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={9} y={9} color={dark} />
      <Pixel x={10} y={7} color={darker} />
      <Pixel x={10} y={8} color={darker} />
      {/* 瞄准镜（紧凑） */}
      <Pixel x={7} y={4} color={sightDark} />
      <Pixel x={7} y={5} color={sight} />
      <Pixel x={8} y={5} color={screwDark} />
      {/* 弹夹 */}
      <Pixel x={7} y={10} color={magDark} />
      <Pixel x={8} y={10} color={mag} />
      <Pixel x={7} y={11} color={mag} />
      <Pixel x={8} y={11} color={magLight} />
      <Pixel x={7} y={12} color={magDark} />
      {/* 垂直握把（前） */}
      <Pixel x={6} y={10} color={gripDark} />
      <Pixel x={6} y={11} color={grip} />
      <Pixel x={6} y={12} color={gripDark} />
      {/* 主握把（后） */}
      <Pixel x={9} y={10} color={gripDark} />
      <Pixel x={10} y={10} color={grip} />
      <Pixel x={9} y={11} color={grip} />
      <Pixel x={10} y={11} color={gripDark} />
      <Pixel x={10} y={12} color={gripDark} />
      {/* 扳机 */}
      <Pixel x={9} y={9} color={trigger} />
      {/* 装饰 */}
      <Pixel x={6} y={7} color={screw} />
      <Pixel x={8} y={7} color={screwDark} />
      <Pixel x={7} y={8} color={sight} />
      <Pixel x={8} y={8} color={core} />
      <Pixel x={6} y={8} color={screwDark} />
    </>,
    // 变体4：等离子能量枪（能量核心+双管）
    <>
      {/* 双管 */}
      <Pixel x={2} y={6} color={barrelDark} size={2} />
      <Pixel x={2} y={9} color={barrelDark} size={2} />
      <Pixel x={4} y={6} color={barrel} />
      <Pixel x={4} y={9} color={barrel} />
      <Pixel x={1} y={6} color={barrelDark} />
      <Pixel x={1} y={9} color={barrelDark} />
      {/* 枪身 */}
      <Pixel x={5} y={5} color={dark} size={2} />
      <Pixel x={5} y={8} color={dark} size={2} />
      <Pixel x={5} y={6} color={main} />
      <Pixel x={5} y={7} color={light} />
      <Pixel x={5} y={8} color={main} />
      <Pixel x={5} y={9} color={main} />
      <Pixel x={7} y={5} color={light} />
      <Pixel x={7} y={6} color={main} />
      <Pixel x={7} y={7} color={highlight} />
      <Pixel x={7} y={8} color={main} />
      <Pixel x={7} y={9} color={dark} />
      <Pixel x={8} y={5} color={main} />
      <Pixel x={8} y={6} color={main} />
      <Pixel x={8} y={7} color={light} />
      <Pixel x={8} y={8} color={main} />
      <Pixel x={8} y={9} color={dark} />
      <Pixel x={9} y={5} color={dark} />
      <Pixel x={9} y={6} color={main} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={9} y={9} color={dark} />
      {/* 能量核心（中央发光） */}
      <Pixel x={7} y={7} color={core} />
      <Pixel x={7} y={6} color={sight} />
      <Pixel x={8} y={7} color={sight} />
      {/* 能量管 */}
      <Pixel x={6} y={6} color={sight} />
      <Pixel x={6} y={8} color={sight} />
      {/* 顶部能量条 */}
      <Pixel x={7} y={3} color={sightDark} size={2} />
      <Pixel x={7} y={4} color={sight} size={2} />
      {/* 弹夹（能量包） */}
      <Pixel x={7} y={10} color={sightDark} />
      <Pixel x={8} y={10} color={sight} />
      <Pixel x={7} y={11} color={sight} />
      <Pixel x={8} y={11} color={core} />
      <Pixel x={7} y={12} color={sightDark} />
      {/* 握把 */}
      <Pixel x={9} y={10} color={gripDark} />
      <Pixel x={10} y={10} color={grip} />
      <Pixel x={9} y={11} color={grip} />
      <Pixel x={10} y={11} color={gripDark} />
      <Pixel x={10} y={12} color={gripDark} />
      {/* 扳机 */}
      <Pixel x={9} y={9} color={trigger} />
      {/* 装饰 */}
      <Pixel x={6} y={5} color={screw} />
      <Pixel x={9} y={5} color={screw} />
      <Pixel x={6} y={9} color={screwDark} />
      <Pixel x={9} y={9} color={screwDark} />
      <Pixel x={10} y={6} color={darker} />
      <Pixel x={10} y={7} color={main} />
      <Pixel x={10} y={8} color={darker} />
      <Pixel x={6} y={7} color={highlight} />
    </>,
    // 变体5：重型霰弹枪（粗枪管+大弹仓）
    <>
      {/* 粗枪管 */}
      <Pixel x={2} y={6} color={barrelDark} size={2} />
      <Pixel x={2} y={8} color={barrel} size={2} />
      <Pixel x={4} y={6} color={barrelDark} />
      <Pixel x={4} y={7} color={barrel} />
      <Pixel x={4} y={8} color={barrel} />
      <Pixel x={4} y={9} color={barrelDark} />
      <Pixel x={1} y={6} color={barrelDark} />
      <Pixel x={1} y={9} color={barrelDark} />
      {/* 枪身 */}
      <Pixel x={5} y={6} color={dark} size={2} />
      <Pixel x={5} y={8} color={dark} size={2} />
      <Pixel x={5} y={7} color={main} size={2} />
      <Pixel x={5} y={9} color={main} />
      <Pixel x={7} y={6} color={light} />
      <Pixel x={7} y={7} color={main} size={2} />
      <Pixel x={7} y={9} color={dark} />
      <Pixel x={8} y={6} color={main} />
      <Pixel x={8} y={7} color={highlight} />
      <Pixel x={8} y={8} color={main} />
      <Pixel x={8} y={9} color={dark} />
      <Pixel x={9} y={6} color={dark} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={9} y={9} color={dark} />
      <Pixel x={10} y={7} color={darker} />
      <Pixel x={10} y={8} color={darker} />
      {/* 顶部导轨 */}
      <Pixel x={6} y={5} color={screwDark} size={3} />
      <Pixel x={7} y={4} color={sight} />
      <Pixel x={8} y={5} color={screw} />
      {/* 大弹仓（管状） */}
      <Pixel x={5} y={10} color={barrelDark} />
      <Pixel x={6} y={10} color={barrel} />
      <Pixel x={7} y={10} color={barrelLight} />
      <Pixel x={8} y={10} color={barrel} />
      <Pixel x={9} y={10} color={barrelDark} />
      <Pixel x={5} y={11} color={barrelDark} />
      <Pixel x={6} y={11} color={barrel} />
      <Pixel x={7} y={11} color={barrelLight} />
      <Pixel x={8} y={11} color={barrel} />
      <Pixel x={9} y={11} color={barrelDark} />
      {/* 握把 */}
      <Pixel x={9} y={12} color={gripDark} />
      <Pixel x={10} y={12} color={grip} />
      <Pixel x={10} y={13} color={gripDark} />
      {/* 扳机护圈 */}
      <Pixel x={9} y={11} color={screwDark} />
      <Pixel x={10} y={11} color={trigger} />
      {/* 装饰 */}
      <Pixel x={6} y={7} color={screw} />
      <Pixel x={8} y={7} color={screwDark} />
      <Pixel x={7} y={8} color={sight} />
      <Pixel x={6} y={9} color={mag} />
      <Pixel x={7} y={9} color={magDark} />
    </>,
  ];
  
  return patterns[variant % 5];
}

// 上衣：战术外套正面视图（衣领+双肩+袖子+拉链+下摆）
function ArmorIcon({ variant, tint }: { variant: number; tint: string }) {
  const main = tint;
  const dark = adjustColor(tint, -40);
  const darker = adjustColor(tint, -65);
  const light = adjustColor(tint, 30);
  const highlight = adjustColor(tint, 55);
  const pocket = adjustColor(tint, -25);
  const lining = adjustColor(tint, 45);

  const patterns = [
    // 变体1：战术外套（V领+双袖+拉链）
    <>
      {/* 衣领尖端 */}
      <Pixel x={6} y={2} color={dark} />
      <Pixel x={9} y={2} color={dark} />
      <Pixel x={6} y={3} color={darker} />
      <Pixel x={7} y={3} color={dark} />
      <Pixel x={8} y={3} color={dark} />
      <Pixel x={9} y={3} color={darker} />
      {/* 肩部 */}
      <Pixel x={4} y={4} color={dark} />
      <Pixel x={5} y={4} color={main} />
      <Pixel x={10} y={4} color={main} />
      <Pixel x={11} y={4} color={dark} />
      <Pixel x={4} y={5} color={main} />
      <Pixel x={11} y={5} color={main} />
      {/* 左袖 */}
      <Pixel x={3} y={5} color={dark} />
      <Pixel x={3} y={6} color={main} />
      <Pixel x={3} y={7} color={dark} />
      <Pixel x={3} y={8} color={main} />
      <Pixel x={3} y={9} color={darker} />
      <Pixel x={4} y={6} color={light} />
      <Pixel x={4} y={7} color={main} />
      <Pixel x={4} y={8} color={dark} />
      <Pixel x={4} y={9} color={CUFF} />
      {/* 右袖 */}
      <Pixel x={12} y={5} color={dark} />
      <Pixel x={12} y={6} color={main} />
      <Pixel x={12} y={7} color={dark} />
      <Pixel x={12} y={8} color={main} />
      <Pixel x={12} y={9} color={darker} />
      <Pixel x={11} y={6} color={light} />
      <Pixel x={11} y={7} color={main} />
      <Pixel x={11} y={8} color={dark} />
      <Pixel x={11} y={9} color={CUFF} />
      {/* 身体主体 + 拉链 */}
      <Pixel x={5} y={5} color={main} />
      <Pixel x={5} y={6} color={light} />
      <Pixel x={9} y={6} color={main} />
      <Pixel x={5} y={7} color={main} />
      <Pixel x={6} y={7} color={GOLD} />
      <Pixel x={7} y={7} color={GOLD_DARK} />
      <Pixel x={8} y={7} color={main} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={5} y={8} color={dark} />
      <Pixel x={6} y={8} color={main} />
      <Pixel x={7} y={8} color={GOLD} />
      <Pixel x={8} y={8} color={main} />
      <Pixel x={9} y={8} color={dark} />
      <Pixel x={5} y={9} color={main} />
      <Pixel x={6} y={9} color={pocket} />
      <Pixel x={7} y={9} color={GOLD_DARK} />
      <Pixel x={8} y={9} color={pocket} />
      <Pixel x={9} y={9} color={main} />
      <Pixel x={5} y={10} color={light} />
      <Pixel x={6} y={10} color={pocket} />
      <Pixel x={7} y={10} color={STITCH} />
      <Pixel x={8} y={10} color={pocket} />
      <Pixel x={9} y={10} color={light} />
      {/* 下摆 */}
      <Pixel x={5} y={11} color={main} width={5} height={1} />
      <Pixel x={6} y={12} color={darker} />
      <Pixel x={8} y={12} color={darker} />
      {/* 装饰高光 */}
      <Pixel x={5} y={4} color={highlight} />
      <Pixel x={10} y={4} color={highlight} />
      <Pixel x={5} y={11} color={ACCENT} />
      <Pixel x={9} y={11} color={ACCENT} />
      <Pixel x={4} y={9} color={SILVER} />
      <Pixel x={11} y={9} color={SILVER} />
      <Pixel x={5} y={6} color={lining} />
      <Pixel x={10} y={6} color={lining} />
    </>,
    // 变体2：重甲胸甲（高领+宽肩）
    <>
      <Pixel x={5} y={2} color={dark} width={5} height={1} />
      <Pixel x={5} y={3} color={darker} />
      <Pixel x={9} y={3} color={darker} />
      <Pixel x={6} y={3} color={main} width={3} height={1} />
      <Pixel x={4} y={4} color={dark} />
      <Pixel x={5} y={4} color={main} width={6} height={1} />
      <Pixel x={11} y={4} color={dark} />
      <Pixel x={3} y={5} color={dark} />
      <Pixel x={4} y={5} color={main} />
      <Pixel x={11} y={5} color={main} />
      <Pixel x={12} y={5} color={dark} />
      <Pixel x={3} y={6} color={main} />
      <Pixel x={12} y={6} color={main} />
      <Pixel x={3} y={7} color={dark} />
      <Pixel x={4} y={7} color={light} />
      <Pixel x={11} y={7} color={light} />
      <Pixel x={12} y={7} color={dark} />
      <Pixel x={3} y={8} color={main} />
      <Pixel x={12} y={8} color={main} />
      <Pixel x={3} y={9} color={darker} />
      <Pixel x={12} y={9} color={darker} />
      <Pixel x={4} y={6} color={light} />
      <Pixel x={5} y={6} color={main} />
      <Pixel x={6} y={6} color={GOLD} />
      <Pixel x={7} y={6} color={GOLD_DARK} />
      <Pixel x={8} y={6} color={GOLD} />
      <Pixel x={9} y={6} color={main} />
      <Pixel x={10} y={6} color={light} />
      <Pixel x={5} y={8} color={main} />
      <Pixel x={6} y={8} color={pocket} />
      <Pixel x={7} y={8} color={STITCH} />
      <Pixel x={8} y={8} color={pocket} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={5} y={9} color={dark} width={5} height={1} />
      <Pixel x={5} y={10} color={darker} width={5} height={1} />
      <Pixel x={6} y={11} color={ACCENT} />
      <Pixel x={8} y={11} color={ACCENT} />
      <Pixel x={4} y={5} color={highlight} />
      <Pixel x={11} y={5} color={highlight} />
      <Pixel x={7} y={4} color={SILVER} />
      <Pixel x={7} y={5} color={SILVER_DARK} />
      <Pixel x={5} y={7} color={lining} />
      <Pixel x={9} y={7} color={lining} />
    </>,
    // 变体3：轻型护甲（无领+短袖）
    <>
      <Pixel x={5} y={3} color={dark} width={5} height={1} />
      <Pixel x={5} y={4} color={main} width={5} height={1} />
      <Pixel x={4} y={5} color={dark} />
      <Pixel x={5} y={5} color={light} width={5} height={1} />
      <Pixel x={10} y={5} color={dark} />
      <Pixel x={3} y={6} color={dark} />
      <Pixel x={4} y={6} color={main} />
      <Pixel x={11} y={6} color={main} />
      <Pixel x={12} y={6} color={dark} />
      <Pixel x={3} y={7} color={main} />
      <Pixel x={12} y={7} color={main} />
      <Pixel x={3} y={8} color={dark} />
      <Pixel x={12} y={8} color={dark} />
      <Pixel x={4} y={7} color={main} />
      <Pixel x={5} y={7} color={light} />
      <Pixel x={6} y={7} color={GOLD} />
      <Pixel x={7} y={7} color={GOLD_DARK} />
      <Pixel x={8} y={7} color={GOLD} />
      <Pixel x={9} y={7} color={light} />
      <Pixel x={10} y={7} color={main} />
      <Pixel x={4} y={8} color={pocket} />
      <Pixel x={5} y={8} color={main} />
      <Pixel x={6} y={8} color={STITCH} />
      <Pixel x={7} y={8} color={SILVER} />
      <Pixel x={8} y={8} color={STITCH} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={10} y={8} color={pocket} />
      <Pixel x={5} y={9} color={dark} width={5} height={1} />
      <Pixel x={5} y={10} color={main} width={5} height={1} />
      <Pixel x={5} y={11} color={darker} width={5} height={1} />
      <Pixel x={7} y={12} color={darker} />
      <Pixel x={5} y={4} color={highlight} />
      <Pixel x={9} y={4} color={highlight} />
      <Pixel x={6} y={10} color={ACCENT} />
      <Pixel x={8} y={10} color={ACCENT} />
      <Pixel x={6} y={5} color={lining} />
      <Pixel x={8} y={5} color={lining} />
    </>,
    // 变体4：能量护甲（V领+胸口核心）
    <>
      <Pixel x={6} y={2} color={dark} />
      <Pixel x={9} y={2} color={dark} />
      <Pixel x={5} y={3} color={darker} />
      <Pixel x={6} y={3} color={dark} />
      <Pixel x={9} y={3} color={dark} />
      <Pixel x={10} y={3} color={darker} />
      <Pixel x={4} y={4} color={dark} />
      <Pixel x={5} y={4} color={main} />
      <Pixel x={10} y={4} color={main} />
      <Pixel x={11} y={4} color={dark} />
      <Pixel x={3} y={5} color={dark} />
      <Pixel x={4} y={5} color={main} />
      <Pixel x={11} y={5} color={main} />
      <Pixel x={12} y={5} color={dark} />
      <Pixel x={3} y={6} color={main} />
      <Pixel x={12} y={6} color={main} />
      <Pixel x={3} y={7} color={dark} />
      <Pixel x={12} y={7} color={dark} />
      <Pixel x={3} y={8} color={main} />
      <Pixel x={12} y={8} color={main} />
      <Pixel x={3} y={9} color={darker} />
      <Pixel x={12} y={9} color={darker} />
      <Pixel x={5} y={5} color={light} />
      <Pixel x={6} y={5} color={main} />
      <Pixel x={9} y={5} color={main} />
      <Pixel x={10} y={5} color={light} />
      <Pixel x={5} y={6} color={main} />
      <Pixel x={6} y={6} color={ACCENT} />
      <Pixel x={9} y={6} color={ACCENT} />
      <Pixel x={10} y={6} color={main} />
      <Pixel x={5} y={7} color={main} />
      <Pixel x={6} y={7} color={ACCENT} />
      <Pixel x={7} y={7} color={SILVER} />
      <Pixel x={8} y={7} color={SILVER} />
      <Pixel x={9} y={7} color={ACCENT} />
      <Pixel x={10} y={7} color={main} />
      <Pixel x={5} y={8} color={pocket} />
      <Pixel x={6} y={8} color={main} />
      <Pixel x={7} y={8} color={STITCH} />
      <Pixel x={8} y={8} color={STITCH} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={10} y={8} color={pocket} />
      <Pixel x={5} y={9} color={dark} width={5} height={1} />
      <Pixel x={5} y={10} color={darker} width={5} height={1} />
      <Pixel x={6} y={11} color={ACCENT} />
      <Pixel x={8} y={11} color={ACCENT} />
      <Pixel x={4} y={4} color={highlight} />
      <Pixel x={11} y={4} color={highlight} />
      <Pixel x={5} y={6} color={lining} />
      <Pixel x={10} y={6} color={lining} />
    </>,
    // 变体5：无袖背心
    <>
      <Pixel x={6} y={2} color={dark} />
      <Pixel x={9} y={2} color={dark} />
      <Pixel x={5} y={3} color={darker} />
      <Pixel x={6} y={3} color={dark} />
      <Pixel x={9} y={3} color={dark} />
      <Pixel x={10} y={3} color={darker} />
      <Pixel x={5} y={4} color={dark} />
      <Pixel x={6} y={4} color={main} width={4} height={1} />
      <Pixel x={10} y={4} color={dark} />
      <Pixel x={5} y={5} color={main} />
      <Pixel x={6} y={5} color={light} width={4} height={1} />
      <Pixel x={10} y={5} color={main} />
      <Pixel x={5} y={6} color={main} />
      <Pixel x={6} y={6} color={main} />
      <Pixel x={7} y={6} color={GOLD} />
      <Pixel x={8} y={6} color={GOLD_DARK} />
      <Pixel x={9} y={6} color={main} />
      <Pixel x={10} y={6} color={main} />
      <Pixel x={5} y={7} color={dark} />
      <Pixel x={6} y={7} color={main} />
      <Pixel x={7} y={7} color={STITCH} />
      <Pixel x={8} y={7} color={STITCH} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={10} y={7} color={dark} />
      <Pixel x={5} y={8} color={main} />
      <Pixel x={6} y={8} color={pocket} />
      <Pixel x={7} y={8} color={SILVER} />
      <Pixel x={8} y={8} color={pocket} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={5} y={9} color={dark} />
      <Pixel x={6} y={9} color={main} width={4} height={1} />
      <Pixel x={9} y={9} color={dark} />
      <Pixel x={5} y={10} color={main} width={5} height={1} />
      <Pixel x={5} y={11} color={darker} width={5} height={1} />
      <Pixel x={6} y={12} color={ACCENT} />
      <Pixel x={8} y={12} color={ACCENT} />
      <Pixel x={6} y={4} color={highlight} />
      <Pixel x={9} y={4} color={highlight} />
      <Pixel x={6} y={5} color={lining} />
      <Pixel x={9} y={5} color={lining} />
    </>,
  ];
  
  return patterns[variant % 5];
}

// 下装：长裤正面视图（腰带+两条裤腿+中缝）
function PantsIcon({ variant, tint }: { variant: number; tint: string }) {
  const main = tint;
  const dark = adjustColor(tint, -40);
  const darker = adjustColor(tint, -65);
  const light = adjustColor(tint, 30);
  const highlight = adjustColor(tint, 55);
  const pocket = adjustColor(tint, -25);
  const loop = adjustColor(tint, -50);

  const patterns = [
    // 变体1：标准长裤
    <>
      {/* 腰带 */}
      <Pixel x={3} y={3} color={darker} size={3} />
      <Pixel x={10} y={3} color={darker} size={3} />
      <Pixel x={3} y={4} color={dark} size={3} />
      <Pixel x={10} y={4} color={dark} size={3} />
      <Pixel x={3} y={5} color={main} size={3} />
      <Pixel x={10} y={5} color={main} size={3} />
      {/* 腰带扣 */}
      <Pixel x={7} y={3} color={GOLD_DARK} size={2} />
      <Pixel x={7} y={4} color={GOLD} size={2} />
      <Pixel x={7} y={5} color={GOLD_DARK} />
      <Pixel x={8} y={5} color={GOLD_DARK} />
      {/* 腰带环 */}
      <Pixel x={5} y={3} color={loop} />
      <Pixel x={11} y={3} color={loop} />
      {/* 左腿 */}
      <Pixel x={3} y={6} color={main} />
      <Pixel x={4} y={6} color={light} />
      <Pixel x={3} y={7} color={dark} />
      <Pixel x={4} y={7} color={main} />
      <Pixel x={3} y={8} color={main} />
      <Pixel x={4} y={8} color={dark} />
      <Pixel x={3} y={9} color={dark} />
      <Pixel x={4} y={9} color={main} />
      <Pixel x={3} y={10} color={main} />
      <Pixel x={4} y={10} color={dark} />
      <Pixel x={3} y={11} color={darker} />
      <Pixel x={4} y={11} color={main} />
      <Pixel x={3} y={12} color={darker} />
      <Pixel x={4} y={12} color={darker} />
      {/* 右腿 */}
      <Pixel x={9} y={6} color={light} />
      <Pixel x={10} y={6} color={main} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={10} y={7} color={dark} />
      <Pixel x={9} y={8} color={dark} />
      <Pixel x={10} y={8} color={main} />
      <Pixel x={9} y={9} color={main} />
      <Pixel x={10} y={9} color={dark} />
      <Pixel x={9} y={10} color={dark} />
      <Pixel x={10} y={10} color={main} />
      <Pixel x={9} y={11} color={main} />
      <Pixel x={10} y={11} color={darker} />
      <Pixel x={9} y={12} color={darker} />
      <Pixel x={10} y={12} color={darker} />
      {/* 中缝（裤腿之间留空） */}
      <Pixel x={6} y={6} color={pocket} />
      <Pixel x={7} y={6} color={pocket} />
      <Pixel x={6} y={7} color={STITCH} />
      <Pixel x={7} y={7} color={STITCH} />
      {/* 口袋 */}
      <Pixel x={5} y={7} color={pocket} />
      <Pixel x={8} y={7} color={pocket} />
      {/* 装饰 */}
      <Pixel x={5} y={4} color={highlight} />
      <Pixel x={12} y={4} color={highlight} />
      <Pixel x={3} y={5} color={ACCENT} />
      <Pixel x={12} y={5} color={ACCENT} />
      <Pixel x={4} y={9} color={SILVER} />
      <Pixel x={9} y={9} color={SILVER} />
      <Pixel x={4} y={11} color={ACCENT} />
      <Pixel x={9} y={11} color={ACCENT} />
    </>,
    // 变体2：战术裤
    <>
      <Pixel x={3} y={3} color={dark} size={3} />
      <Pixel x={10} y={3} color={dark} size={3} />
      <Pixel x={3} y={4} color={main} size={3} />
      <Pixel x={10} y={4} color={main} size={3} />
      <Pixel x={3} y={5} color={light} size={3} />
      <Pixel x={10} y={5} color={light} size={3} />
      <Pixel x={7} y={3} color={GOLD_DARK} size={2} />
      <Pixel x={7} y={4} color={GOLD} size={2} />
      <Pixel x={5} y={3} color={loop} />
      <Pixel x={11} y={3} color={loop} />
      <Pixel x={3} y={6} color={main} />
      <Pixel x={4} y={6} color={dark} />
      <Pixel x={3} y={7} color={dark} />
      <Pixel x={4} y={7} color={main} />
      <Pixel x={3} y={8} color={main} />
      <Pixel x={4} y={8} color={ACCENT} />
      <Pixel x={3} y={9} color={dark} />
      <Pixel x={4} y={9} color={main} />
      <Pixel x={3} y={10} color={main} />
      <Pixel x={4} y={10} color={ACCENT} />
      <Pixel x={3} y={11} color={dark} />
      <Pixel x={4} y={11} color={main} />
      <Pixel x={3} y={12} color={darker} />
      <Pixel x={4} y={12} color={darker} />
      <Pixel x={9} y={6} color={dark} />
      <Pixel x={10} y={6} color={main} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={10} y={7} color={dark} />
      <Pixel x={9} y={8} color={ACCENT} />
      <Pixel x={10} y={8} color={main} />
      <Pixel x={9} y={9} color={main} />
      <Pixel x={10} y={9} color={dark} />
      <Pixel x={9} y={10} color={ACCENT} />
      <Pixel x={10} y={10} color={main} />
      <Pixel x={9} y={11} color={main} />
      <Pixel x={10} y={11} color={dark} />
      <Pixel x={9} y={12} color={darker} />
      <Pixel x={10} y={12} color={darker} />
      <Pixel x={6} y={6} color={pocket} size={2} />
      <Pixel x={6} y={7} color={STITCH} size={2} />
      <Pixel x={5} y={8} color={pocket} />
      <Pixel x={8} y={8} color={pocket} />
      <Pixel x={5} y={4} color={highlight} />
      <Pixel x={12} y={4} color={highlight} />
      <Pixel x={3} y={5} color={SILVER} />
      <Pixel x={12} y={5} color={SILVER} />
      <Pixel x={4} y={10} color={GOLD} />
      <Pixel x={9} y={10} color={GOLD} />
    </>,
    // 变体3：宽松工装裤
    <>
      <Pixel x={2} y={3} color={darker} size={4} />
      <Pixel x={10} y={3} color={darker} size={4} />
      <Pixel x={2} y={4} color={dark} size={4} />
      <Pixel x={10} y={4} color={dark} size={4} />
      <Pixel x={2} y={5} color={main} size={4} />
      <Pixel x={10} y={5} color={main} size={4} />
      <Pixel x={6} y={3} color={GOLD_DARK} size={2} />
      <Pixel x={8} y={3} color={GOLD_DARK} size={2} />
      <Pixel x={6} y={4} color={GOLD} size={2} />
      <Pixel x={8} y={4} color={GOLD} size={2} />
      <Pixel x={2} y={6} color={main} />
      <Pixel x={3} y={6} color={light} />
      <Pixel x={2} y={7} color={dark} />
      <Pixel x={3} y={7} color={main} />
      <Pixel x={2} y={8} color={main} />
      <Pixel x={3} y={8} color={dark} />
      <Pixel x={2} y={9} color={dark} />
      <Pixel x={3} y={9} color={main} />
      <Pixel x={2} y={10} color={main} />
      <Pixel x={3} y={10} color={dark} />
      <Pixel x={2} y={11} color={darker} />
      <Pixel x={3} y={11} color={main} />
      <Pixel x={2} y={12} color={darker} />
      <Pixel x={3} y={12} color={darker} />
      <Pixel x={11} y={6} color={light} />
      <Pixel x={12} y={6} color={main} />
      <Pixel x={11} y={7} color={main} />
      <Pixel x={12} y={7} color={dark} />
      <Pixel x={11} y={8} color={dark} />
      <Pixel x={12} y={8} color={main} />
      <Pixel x={11} y={9} color={main} />
      <Pixel x={12} y={9} color={dark} />
      <Pixel x={11} y={10} color={dark} />
      <Pixel x={12} y={10} color={main} />
      <Pixel x={11} y={11} color={main} />
      <Pixel x={12} y={11} color={darker} />
      <Pixel x={11} y={12} color={darker} />
      <Pixel x={12} y={12} color={darker} />
      <Pixel x={5} y={6} color={pocket} size={2} />
      <Pixel x={9} y={6} color={pocket} size={2} />
      <Pixel x={5} y={8} color={STITCH} />
      <Pixel x={9} y={8} color={STITCH} />
      <Pixel x={4} y={4} color={highlight} />
      <Pixel x={11} y={4} color={highlight} />
      <Pixel x={2} y={5} color={ACCENT} />
      <Pixel x={13} y={5} color={ACCENT} />
      <Pixel x={3} y={10} color={SILVER} />
      <Pixel x={11} y={10} color={SILVER} />
    </>,
    // 变体4：皮裤
    <>
      <Pixel x={3} y={3} color={darker} size={3} />
      <Pixel x={10} y={3} color={darker} size={3} />
      <Pixel x={3} y={4} color={dark} size={3} />
      <Pixel x={10} y={4} color={dark} size={3} />
      <Pixel x={3} y={5} color={main} size={3} />
      <Pixel x={10} y={5} color={main} size={3} />
      <Pixel x={7} y={3} color={GOLD_DARK} size={2} />
      <Pixel x={7} y={4} color={GOLD} size={2} />
      <Pixel x={5} y={3} color={loop} />
      <Pixel x={11} y={3} color={loop} />
      <Pixel x={3} y={6} color={dark} />
      <Pixel x={4} y={6} color={main} />
      <Pixel x={3} y={7} color={main} />
      <Pixel x={4} y={7} color={dark} />
      <Pixel x={3} y={8} color={dark} />
      <Pixel x={4} y={8} color={main} />
      <Pixel x={3} y={9} color={main} />
      <Pixel x={4} y={9} color={dark} />
      <Pixel x={3} y={10} color={dark} />
      <Pixel x={4} y={10} color={main} />
      <Pixel x={3} y={11} color={main} />
      <Pixel x={4} y={11} color={darker} />
      <Pixel x={3} y={12} color={darker} />
      <Pixel x={4} y={12} color={darker} />
      <Pixel x={9} y={6} color={main} />
      <Pixel x={10} y={6} color={dark} />
      <Pixel x={9} y={7} color={dark} />
      <Pixel x={10} y={7} color={main} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={10} y={8} color={dark} />
      <Pixel x={9} y={9} color={dark} />
      <Pixel x={10} y={9} color={main} />
      <Pixel x={9} y={10} color={main} />
      <Pixel x={10} y={10} color={dark} />
      <Pixel x={9} y={11} color={darker} />
      <Pixel x={10} y={11} color={main} />
      <Pixel x={9} y={12} color={darker} />
      <Pixel x={10} y={12} color={darker} />
      <Pixel x={6} y={6} color={pocket} size={2} />
      <Pixel x={6} y={7} color={STITCH} size={2} />
      <Pixel x={5} y={4} color={highlight} />
      <Pixel x={12} y={4} color={highlight} />
      <Pixel x={3} y={5} color={ACCENT} />
      <Pixel x={12} y={5} color={ACCENT} />
      <Pixel x={4} y={8} color={SILVER} />
      <Pixel x={9} y={8} color={SILVER} />
      <Pixel x={4} y={11} color={GOLD} />
      <Pixel x={9} y={11} color={GOLD} />
    </>,
    // 变体5：运动裤（侧条纹）
    <>
      <Pixel x={3} y={3} color={dark} size={3} />
      <Pixel x={10} y={3} color={dark} size={3} />
      <Pixel x={3} y={4} color={main} size={3} />
      <Pixel x={10} y={4} color={main} size={3} />
      <Pixel x={3} y={5} color={light} size={3} />
      <Pixel x={10} y={5} color={light} size={3} />
      <Pixel x={7} y={3} color={GOLD_DARK} size={2} />
      <Pixel x={7} y={4} color={GOLD} size={2} />
      <Pixel x={5} y={3} color={loop} />
      <Pixel x={11} y={3} color={loop} />
      <Pixel x={3} y={6} color={main} />
      <Pixel x={4} y={6} color={ACCENT} />
      <Pixel x={3} y={7} color={dark} />
      <Pixel x={4} y={7} color={ACCENT} />
      <Pixel x={3} y={8} color={main} />
      <Pixel x={4} y={8} color={ACCENT} />
      <Pixel x={3} y={9} color={dark} />
      <Pixel x={4} y={9} color={ACCENT} />
      <Pixel x={3} y={10} color={main} />
      <Pixel x={4} y={10} color={ACCENT} />
      <Pixel x={3} y={11} color={darker} />
      <Pixel x={4} y={11} color={main} />
      <Pixel x={3} y={12} color={darker} />
      <Pixel x={4} y={12} color={darker} />
      <Pixel x={9} y={6} color={ACCENT} />
      <Pixel x={10} y={6} color={main} />
      <Pixel x={9} y={7} color={ACCENT} />
      <Pixel x={10} y={7} color={dark} />
      <Pixel x={9} y={8} color={ACCENT} />
      <Pixel x={10} y={8} color={main} />
      <Pixel x={9} y={9} color={ACCENT} />
      <Pixel x={10} y={9} color={dark} />
      <Pixel x={9} y={10} color={ACCENT} />
      <Pixel x={10} y={10} color={main} />
      <Pixel x={9} y={11} color={main} />
      <Pixel x={10} y={11} color={darker} />
      <Pixel x={9} y={12} color={darker} />
      <Pixel x={10} y={12} color={darker} />
      <Pixel x={6} y={6} color={pocket} size={2} />
      <Pixel x={6} y={7} color={STITCH} size={2} />
      <Pixel x={5} y={4} color={highlight} />
      <Pixel x={12} y={4} color={highlight} />
      <Pixel x={3} y={5} color={SILVER} />
      <Pixel x={12} y={5} color={SILVER} />
      <Pixel x={4} y={10} color={GOLD} />
      <Pixel x={9} y={10} color={GOLD} />
    </>,
  ];
  
  return patterns[variant % 5];
}

// 护肩：单侧肩甲侧视图（弧形甲片+绑带+铆钉）
function ShoulderIcon({ variant, tint }: { variant: number; tint: string }) {
  const main = tint;
  const dark = adjustColor(tint, -40);
  const darker = adjustColor(tint, -65);
  const light = adjustColor(tint, 30);
  const highlight = adjustColor(tint, 55);
  const strap = LEATHER;
  const strapDark = LEATHER_DARK;
  const lining = adjustColor(tint, 45);

  const patterns = [
    // 变体1：战术肩甲
    <>
      {/* 弧形甲片顶部 */}
      <Pixel x={4} y={3} color={dark} size={2} />
      <Pixel x={6} y={3} color={dark} />
      <Pixel x={7} y={3} color={main} size={2} />
      <Pixel x={9} y={3} color={dark} size={2} />
      <Pixel x={4} y={4} color={main} size={2} />
      <Pixel x={6} y={4} color={light} />
      <Pixel x={7} y={4} color={highlight} />
      <Pixel x={8} y={4} color={main} />
      <Pixel x={9} y={4} color={main} size={2} />
      <Pixel x={4} y={5} color={main} size={2} />
      <Pixel x={6} y={5} color={main} />
      <Pixel x={7} y={5} color={dark} />
      <Pixel x={8} y={5} color={main} />
      <Pixel x={9} y={5} color={light} size={2} />
      {/* 底部边缘 */}
      <Pixel x={4} y={6} color={dark} size={2} />
      <Pixel x={6} y={6} color={dark} />
      <Pixel x={7} y={6} color={main} />
      <Pixel x={8} y={6} color={dark} />
      <Pixel x={9} y={6} color={dark} size={2} />
      {/* 绑带 */}
      <Pixel x={5} y={7} color={strapDark} />
      <Pixel x={6} y={7} color={strap} size={2} />
      <Pixel x={8} y={7} color={strapDark} />
      <Pixel x={5} y={8} color={strapDark} />
      <Pixel x={6} y={8} color={strap} />
      <Pixel x={7} y={8} color={strap} />
      <Pixel x={8} y={8} color={strapDark} />
      {/* 铆钉 */}
      <Pixel x={5} y={4} color={SILVER} />
      <Pixel x={10} y={4} color={SILVER} />
      <Pixel x={5} y={5} color={SILVER_DARK} />
      <Pixel x={10} y={5} color={SILVER_DARK} />
      <Pixel x={6} y={7} color={GOLD} />
      <Pixel x={7} y={7} color={GOLD} />
      {/* 装饰 */}
      <Pixel x={7} y={4} color={ACCENT} />
      <Pixel x={7} y={6} color={ACCENT} />
      <Pixel x={6} y={9} color={strapDark} />
      <Pixel x={7} y={9} color={strapDark} />
      <Pixel x={5} y={9} color={lining} />
    </>,
    // 变体2：圆形轻甲
    <>
      <Pixel x={6} y={2} color={dark} />
      <Pixel x={7} y={2} color={main} />
      <Pixel x={8} y={2} color={dark} />
      <Pixel x={5} y={3} color={dark} />
      <Pixel x={6} y={3} color={light} />
      <Pixel x={7} y={3} color={highlight} />
      <Pixel x={8} y={3} color={light} />
      <Pixel x={9} y={3} color={dark} />
      <Pixel x={4} y={4} color={dark} />
      <Pixel x={5} y={4} color={main} />
      <Pixel x={6} y={4} color={main} />
      <Pixel x={7} y={4} color={ACCENT} />
      <Pixel x={8} y={4} color={main} />
      <Pixel x={9} y={4} color={main} />
      <Pixel x={10} y={4} color={dark} />
      <Pixel x={4} y={5} color={main} />
      <Pixel x={5} y={5} color={dark} />
      <Pixel x={9} y={5} color={dark} />
      <Pixel x={10} y={5} color={main} />
      <Pixel x={5} y={6} color={dark} />
      <Pixel x={9} y={6} color={dark} />
      <Pixel x={6} y={6} color={main} />
      <Pixel x={7} y={6} color={main} />
      <Pixel x={8} y={6} color={main} />
      <Pixel x={6} y={7} color={dark} />
      <Pixel x={7} y={7} color={main} />
      <Pixel x={8} y={7} color={dark} />
      <Pixel x={7} y={8} color={strapDark} />
      <Pixel x={6} y={8} color={strap} />
      <Pixel x={8} y={8} color={strap} />
      <Pixel x={6} y={9} color={strapDark} />
      <Pixel x={7} y={9} color={strapDark} />
      <Pixel x={8} y={9} color={strapDark} />
      <Pixel x={6} y={3} color={SILVER} />
      <Pixel x={8} y={3} color={SILVER} />
      <Pixel x={5} y={4} color={SILVER_DARK} />
      <Pixel x={9} y={4} color={SILVER_DARK} />
      <Pixel x={7} y={5} color={GOLD} />
      <Pixel x={7} y={7} color={ACCENT} />
    </>,
    // 变体3：重甲肩甲
    <>
      <Pixel x={3} y={3} color={darker} />
      <Pixel x={4} y={3} color={dark} />
      <Pixel x={5} y={3} color={dark} size={2} />
      <Pixel x={7} y={3} color={main} size={2} />
      <Pixel x={9} y={3} color={dark} size={2} />
      <Pixel x={11} y={3} color={darker} />
      <Pixel x={3} y={4} color={dark} />
      <Pixel x={4} y={4} color={main} size={3} />
      <Pixel x={7} y={4} color={highlight} />
      <Pixel x={8} y={4} color={light} />
      <Pixel x={9} y={4} color={main} size={2} />
      <Pixel x={11} y={4} color={dark} />
      <Pixel x={3} y={5} color={main} />
      <Pixel x={4} y={5} color={light} />
      <Pixel x={5} y={5} color={main} />
      <Pixel x={6} y={5} color={dark} />
      <Pixel x={7} y={5} color={ACCENT} />
      <Pixel x={8} y={5} color={main} />
      <Pixel x={9} y={5} color={main} />
      <Pixel x={10} y={5} color={light} />
      <Pixel x={11} y={5} color={main} />
      <Pixel x={4} y={6} color={dark} />
      <Pixel x={5} y={6} color={main} />
      <Pixel x={6} y={6} color={main} />
      <Pixel x={7} y={6} color={main} />
      <Pixel x={8} y={6} color={dark} />
      <Pixel x={9} y={6} color={main} />
      <Pixel x={10} y={6} color={dark} />
      <Pixel x={5} y={7} color={dark} size={2} />
      <Pixel x={7} y={7} color={dark} />
      <Pixel x={8} y={7} color={dark} size={2} />
      <Pixel x={10} y={7} color={dark} />
      <Pixel x={6} y={8} color={strapDark} />
      <Pixel x={7} y={8} color={strap} />
      <Pixel x={8} y={8} color={strap} />
      <Pixel x={9} y={8} color={strapDark} />
      <Pixel x={4} y={4} color={SILVER} />
      <Pixel x={10} y={4} color={SILVER} />
      <Pixel x={5} y={5} color={SILVER_DARK} />
      <Pixel x={9} y={5} color={SILVER_DARK} />
      <Pixel x={6} y={4} color={GOLD} />
      <Pixel x={9} y={4} color={GOLD} />
      <Pixel x={7} y={6} color={ACCENT} />
      <Pixel x={6} y={9} color={strapDark} />
      <Pixel x={7} y={9} color={lining} />
      <Pixel x={8} y={9} color={lining} />
      <Pixel x={9} y={9} color={strapDark} />
    </>,
    // 变体4：尖刺肩甲
    <>
      <Pixel x={2} y={3} color={dark} />
      <Pixel x={3} y={2} color={main} />
      <Pixel x={4} y={3} color={dark} />
      <Pixel x={3} y={3} color={light} />
      <Pixel x={4} y={4} color={dark} />
      <Pixel x={5} y={3} color={dark} size={2} />
      <Pixel x={7} y={3} color={main} size={2} />
      <Pixel x={9} y={3} color={dark} size={2} />
      <Pixel x={4} y={4} color={main} />
      <Pixel x={5} y={4} color={light} />
      <Pixel x={6} y={4} color={highlight} />
      <Pixel x={7} y={4} color={main} />
      <Pixel x={8} y={4} color={main} />
      <Pixel x={9} y={4} color={light} />
      <Pixel x={10} y={4} color={main} />
      <Pixel x={5} y={5} color={main} />
      <Pixel x={6} y={5} color={dark} />
      <Pixel x={7} y={5} color={ACCENT} />
      <Pixel x={8} y={5} color={main} />
      <Pixel x={9} y={5} color={dark} />
      <Pixel x={10} y={5} color={main} />
      <Pixel x={5} y={6} color={dark} />
      <Pixel x={6} y={6} color={main} />
      <Pixel x={7} y={6} color={dark} />
      <Pixel x={8} y={6} color={main} />
      <Pixel x={9} y={6} color={dark} />
      <Pixel x={10} y={6} color={dark} />
      <Pixel x={6} y={7} color={strapDark} />
      <Pixel x={7} y={7} color={strap} />
      <Pixel x={8} y={7} color={strap} />
      <Pixel x={9} y={7} color={strapDark} />
      <Pixel x={3} y={4} color={SILVER} />
      <Pixel x={10} y={4} color={SILVER} />
      <Pixel x={3} y={5} color={GOLD} />
      <Pixel x={10} y={5} color={GOLD} />
      <Pixel x={7} y={4} color={SILVER_DARK} />
      <Pixel x={7} y={6} color={ACCENT} />
      <Pixel x={7} y={8} color={strapDark} />
      <Pixel x={6} y={8} color={lining} />
      <Pixel x={8} y={8} color={lining} />
    </>,
    // 变体5：轻型战术肩甲
    <>
      <Pixel x={4} y={3} color={dark} />
      <Pixel x={5} y={3} color={main} />
      <Pixel x={6} y={3} color={light} />
      <Pixel x={7} y={3} color={highlight} />
      <Pixel x={8} y={3} color={main} />
      <Pixel x={9} y={3} color={dark} />
      <Pixel x={4} y={4} color={main} />
      <Pixel x={5} y={4} color={light} />
      <Pixel x={6} y={4} color={main} />
      <Pixel x={7} y={4} color={ACCENT} />
      <Pixel x={8} y={4} color={main} />
      <Pixel x={9} y={4} color={light} />
      <Pixel x={10} y={4} color={main} />
      <Pixel x={4} y={5} color={dark} />
      <Pixel x={5} y={5} color={main} />
      <Pixel x={6} y={5} color={dark} />
      <Pixel x={7} y={5} color={main} />
      <Pixel x={8} y={5} color={dark} />
      <Pixel x={9} y={5} color={main} />
      <Pixel x={10} y={5} color={dark} />
      <Pixel x={5} y={6} color={dark} />
      <Pixel x={6} y={6} color={main} />
      <Pixel x={7} y={6} color={dark} />
      <Pixel x={8} y={6} color={main} />
      <Pixel x={9} y={6} color={dark} />
      <Pixel x={6} y={7} color={strapDark} />
      <Pixel x={7} y={7} color={strap} />
      <Pixel x={8} y={7} color={strapDark} />
      <Pixel x={4} y={4} color={SILVER} />
      <Pixel x={10} y={4} color={SILVER} />
      <Pixel x={5} y={5} color={SILVER_DARK} />
      <Pixel x={9} y={5} color={SILVER_DARK} />
      <Pixel x={6} y={4} color={GOLD} />
      <Pixel x={8} y={4} color={GOLD} />
      <Pixel x={7} y={3} color={ACCENT} />
      <Pixel x={7} y={6} color={ACCENT} />
      <Pixel x={7} y={8} color={strapDark} />
      <Pixel x={6} y={8} color={lining} />
      <Pixel x={8} y={8} color={lining} />
    </>,
  ];
  
  return patterns[variant % 5];
}

// 腰带：水平皮带+方框扣头（侧视）
function BeltIcon({ variant, tint }: { variant: number; tint: string }) {
  const main = tint;
  const dark = adjustColor(tint, -40);
  const darker = adjustColor(tint, -65);
  const light = adjustColor(tint, 30);
  const highlight = adjustColor(tint, 55);
  const hole = '#1A0A00';

  const patterns = [
    // 变体1：标准皮带
    <>
      {/* 皮带顶部边缘 */}
      <Pixel x={2} y={5} color={darker} width={12} height={1} />
      <Pixel x={2} y={6} color={dark} width={12} height={1} />
      {/* 皮带主体 */}
      <Pixel x={2} y={7} color={main} width={12} height={1} />
      <Pixel x={2} y={8} color={light} width={12} height={1} />
      <Pixel x={2} y={9} color={main} width={12} height={1} />
      {/* 底部边缘 */}
      <Pixel x={2} y={10} color={dark} width={12} height={1} />
      <Pixel x={2} y={11} color={darker} width={12} height={1} />
      {/* 扣头方框 */}
      <Pixel x={6} y={5} color={GOLD_DARK} />
      <Pixel x={7} y={5} color={GOLD_DARK} />
      <Pixel x={8} y={5} color={GOLD_DARK} />
      <Pixel x={9} y={5} color={GOLD_DARK} />
      <Pixel x={6} y={6} color={GOLD} />
      <Pixel x={7} y={6} color={dark} />
      <Pixel x={8} y={6} color={dark} />
      <Pixel x={9} y={6} color={GOLD} />
      <Pixel x={6} y={7} color={GOLD} />
      <Pixel x={7} y={7} color={highlight} />
      <Pixel x={8} y={7} color={GOLD_DARK} />
      <Pixel x={9} y={7} color={GOLD} />
      <Pixel x={6} y={8} color={GOLD} />
      <Pixel x={7} y={8} color={GOLD_DARK} />
      <Pixel x={8} y={8} color={highlight} />
      <Pixel x={9} y={8} color={GOLD} />
      <Pixel x={6} y={9} color={GOLD} />
      <Pixel x={7} y={9} color={dark} />
      <Pixel x={8} y={9} color={dark} />
      <Pixel x={9} y={9} color={GOLD} />
      <Pixel x={6} y={10} color={GOLD_DARK} size={4} />
      <Pixel x={6} y={11} color={GOLD_DARK} size={4} />
      {/* 扣针 */}
      <Pixel x={7} y={7} color={SILVER} />
      <Pixel x={7} y={8} color={SILVER_DARK} />
      {/* 皮带孔 */}
      <Pixel x={3} y={8} color={hole} />
      <Pixel x={12} y={8} color={hole} />
      <Pixel x={4} y={8} color={hole} />
      <Pixel x={11} y={8} color={hole} />
      {/* 缝线 */}
      <Pixel x={3} y={6} color={STITCH} />
      <Pixel x={5} y={6} color={STITCH} />
      <Pixel x={10} y={6} color={STITCH} />
      <Pixel x={12} y={6} color={STITCH} />
      <Pixel x={3} y={10} color={STITCH} />
      <Pixel x={5} y={10} color={STITCH} />
      <Pixel x={10} y={10} color={STITCH} />
      <Pixel x={12} y={10} color={STITCH} />
      {/* 装饰 */}
      <Pixel x={2} y={7} color={ACCENT} />
      <Pixel x={13} y={7} color={ACCENT} />
      <Pixel x={7} y={6} color={liningColor(light)} />
      <Pixel x={8} y={9} color={liningColor(light)} />
    </>,
    // 变体2：宽皮带
    <>
      <Pixel x={2} y={4} color={darker} width={12} height={1} />
      <Pixel x={2} y={5} color={dark} width={12} height={1} />
      <Pixel x={2} y={6} color={main} width={12} height={1} />
      <Pixel x={2} y={7} color={light} width={12} height={1} />
      <Pixel x={2} y={8} color={main} width={12} height={1} />
      <Pixel x={2} y={9} color={dark} width={12} height={1} />
      <Pixel x={2} y={10} color={darker} width={12} height={1} />
      <Pixel x={5} y={4} color={GOLD_DARK} size={6} />
      <Pixel x={5} y={5} color={GOLD} size={6} />
      <Pixel x={5} y={6} color={GOLD} />
      <Pixel x={6} y={6} color={dark} size={4} />
      <Pixel x={10} y={6} color={GOLD} />
      <Pixel x={5} y={7} color={GOLD} />
      <Pixel x={6} y={7} color={highlight} />
      <Pixel x={7} y={7} color={SILVER} />
      <Pixel x={8} y={7} color={GOLD_DARK} />
      <Pixel x={9} y={7} color={highlight} />
      <Pixel x={10} y={7} color={GOLD} />
      <Pixel x={5} y={8} color={GOLD} />
      <Pixel x={6} y={8} color={GOLD_DARK} />
      <Pixel x={7} y={8} color={SILVER_DARK} />
      <Pixel x={8} y={8} color={highlight} />
      <Pixel x={9} y={8} color={GOLD_DARK} />
      <Pixel x={10} y={8} color={GOLD} />
      <Pixel x={5} y={9} color={GOLD} size={6} />
      <Pixel x={5} y={10} color={GOLD_DARK} size={6} />
      <Pixel x={3} y={7} color={hole} />
      <Pixel x={12} y={7} color={hole} />
      <Pixel x={7} y={6} color={SILVER} />
      <Pixel x={8} y={7} color={ACCENT} />
      <Pixel x={3} y={5} color={STITCH} />
      <Pixel x={12} y={5} color={STITCH} />
      <Pixel x={3} y={9} color={STITCH} />
      <Pixel x={12} y={9} color={STITCH} />
      <Pixel x={2} y={6} color={ACCENT} />
      <Pixel x={13} y={6} color={ACCENT} />
      <Pixel x={6} y={5} color={liningColor(light)} />
    </>,
    // 变体3：战术腰带（多孔）
    <>
      <Pixel x={2} y={5} color={darker} width={12} height={1} />
      <Pixel x={2} y={6} color={dark} width={12} height={1} />
      <Pixel x={2} y={7} color={main} width={12} height={1} />
      <Pixel x={2} y={8} color={light} width={12} height={1} />
      <Pixel x={2} y={9} color={main} width={12} height={1} />
      <Pixel x={2} y={10} color={dark} width={12} height={1} />
      <Pixel x={2} y={11} color={darker} width={12} height={1} />
      <Pixel x={6} y={5} color={GOLD_DARK} size={4} />
      <Pixel x={6} y={6} color={GOLD} />
      <Pixel x={7} y={6} color={dark} size={2} />
      <Pixel x={9} y={6} color={GOLD} />
      <Pixel x={6} y={7} color={GOLD} />
      <Pixel x={7} y={7} color={highlight} />
      <Pixel x={8} y={7} color={GOLD_DARK} />
      <Pixel x={9} y={7} color={GOLD} />
      <Pixel x={6} y={8} color={GOLD} />
      <Pixel x={7} y={8} color={GOLD_DARK} />
      <Pixel x={8} y={8} color={highlight} />
      <Pixel x={9} y={8} color={GOLD} />
      <Pixel x={6} y={9} color={GOLD} />
      <Pixel x={7} y={9} color={dark} size={2} />
      <Pixel x={9} y={9} color={GOLD} />
      <Pixel x={6} y={10} color={GOLD_DARK} size={4} />
      <Pixel x={7} y={7} color={SILVER} />
      <Pixel x={3} y={7} color={hole} />
      <Pixel x={4} y={7} color={hole} />
      <Pixel x={5} y={7} color={hole} />
      <Pixel x={10} y={7} color={hole} />
      <Pixel x={11} y={7} color={hole} />
      <Pixel x={12} y={7} color={hole} />
      <Pixel x={3} y={8} color={SILVER} />
      <Pixel x={12} y={8} color={SILVER} />
      <Pixel x={3} y={6} color={STITCH} />
      <Pixel x={12} y={6} color={STITCH} />
      <Pixel x={3} y={10} color={STITCH} />
      <Pixel x={12} y={10} color={STITCH} />
      <Pixel x={2} y={7} color={ACCENT} />
      <Pixel x={13} y={7} color={ACCENT} />
      <Pixel x={7} y={6} color={liningColor(light)} />
      <Pixel x={8} y={9} color={liningColor(light)} />
    </>,
    // 变体4：能量腰带
    <>
      <Pixel x={2} y={5} color={dark} width={12} height={1} />
      <Pixel x={2} y={6} color={main} width={12} height={1} />
      <Pixel x={2} y={7} color={light} width={12} height={1} />
      <Pixel x={2} y={8} color={main} width={12} height={1} />
      <Pixel x={2} y={9} color={dark} width={12} height={1} />
      <Pixel x={6} y={5} color={GOLD_DARK} size={4} />
      <Pixel x={6} y={6} color={GOLD} />
      <Pixel x={7} y={6} color={ACCENT} size={2} />
      <Pixel x={9} y={6} color={GOLD} />
      <Pixel x={6} y={7} color={GOLD} />
      <Pixel x={7} y={7} color={ACCENT} />
      <Pixel x={8} y={7} color={SILVER} />
      <Pixel x={9} y={7} color={GOLD} />
      <Pixel x={6} y={8} color={GOLD} />
      <Pixel x={7} y={8} color={SILVER_DARK} />
      <Pixel x={8} y={8} color={ACCENT} />
      <Pixel x={9} y={8} color={GOLD} />
      <Pixel x={6} y={9} color={GOLD_DARK} size={4} />
      <Pixel x={3} y={6} color={ACCENT} />
      <Pixel x={5} y={6} color={ACCENT} />
      <Pixel x={10} y={6} color={ACCENT} />
      <Pixel x={12} y={6} color={ACCENT} />
      <Pixel x={3} y={8} color={ACCENT} />
      <Pixel x={5} y={8} color={ACCENT} />
      <Pixel x={10} y={8} color={ACCENT} />
      <Pixel x={12} y={8} color={ACCENT} />
      <Pixel x={3} y={7} color={highlight} />
      <Pixel x={12} y={7} color={highlight} />
      <Pixel x={7} y={7} color={liningColor(light)} />
    </>,
    // 变体5：皮革腰带
    <>
      <Pixel x={2} y={5} color={darker} width={12} height={1} />
      <Pixel x={2} y={6} color={dark} width={12} height={1} />
      <Pixel x={2} y={7} color={main} width={12} height={1} />
      <Pixel x={2} y={8} color={light} width={12} height={1} />
      <Pixel x={2} y={9} color={dark} width={12} height={1} />
      <Pixel x={2} y={10} color={darker} width={12} height={1} />
      <Pixel x={6} y={5} color={GOLD_DARK} size={4} />
      <Pixel x={6} y={6} color={GOLD} size={4} />
      <Pixel x={6} y={7} color={GOLD} />
      <Pixel x={7} y={7} color={highlight} />
      <Pixel x={8} y={7} color={GOLD_DARK} />
      <Pixel x={9} y={7} color={GOLD} />
      <Pixel x={6} y={8} color={GOLD} />
      <Pixel x={7} y={8} color={GOLD_DARK} />
      <Pixel x={8} y={8} color={highlight} />
      <Pixel x={9} y={8} color={GOLD} />
      <Pixel x={6} y={9} color={GOLD} size={4} />
      <Pixel x={6} y={10} color={GOLD_DARK} size={4} />
      <Pixel x={7} y={7} color={SILVER} />
      <Pixel x={8} y={8} color={SILVER_DARK} />
      <Pixel x={3} y={7} color={hole} />
      <Pixel x={5} y={7} color={hole} />
      <Pixel x={10} y={7} color={hole} />
      <Pixel x={12} y={7} color={hole} />
      <Pixel x={3} y={6} color={STITCH} />
      <Pixel x={5} y={6} color={STITCH} />
      <Pixel x={10} y={6} color={STITCH} />
      <Pixel x={12} y={6} color={STITCH} />
      <Pixel x={3} y={9} color={STITCH} />
      <Pixel x={5} y={9} color={STITCH} />
      <Pixel x={10} y={9} color={STITCH} />
      <Pixel x={12} y={9} color={STITCH} />
      <Pixel x={2} y={7} color={ACCENT} />
      <Pixel x={13} y={7} color={ACCENT} />
      <Pixel x={7} y={6} color={liningColor(light)} />
    </>,
  ];
  
  return patterns[variant % 5];
}

function liningColor(base: string) {
  return base;
}

// 鞋子：单只侧面轮廓（鞋底+鞋跟+鞋面+鞋带）
function ShoesIcon({ variant, tint }: { variant: number; tint: string }) {
  const main = tint;
  const dark = adjustColor(tint, -40);
  const darker = adjustColor(tint, -65);
  const light = adjustColor(tint, 30);
  const highlight = adjustColor(tint, 55);
  const sole = '#2A1A0A';
  const soleMid = '#5D4037';
  const lace = '#E8E8E8';

  const patterns = [
    // 变体1：运动鞋
    <>
      {/* 鞋面顶部 */}
      <Pixel x={6} y={4} color={dark} />
      <Pixel x={7} y={4} color={main} />
      <Pixel x={8} y={4} color={light} />
      <Pixel x={9} y={4} color={main} />
      <Pixel x={5} y={5} color={dark} />
      <Pixel x={6} y={5} color={main} />
      <Pixel x={7} y={5} color={light} />
      <Pixel x={8} y={5} color={highlight} />
      <Pixel x={9} y={5} color={main} />
      <Pixel x={10} y={5} color={dark} />
      {/* 鞋身主体 */}
      <Pixel x={4} y={6} color={dark} />
      <Pixel x={5} y={6} color={main} />
      <Pixel x={6} y={6} color={light} />
      <Pixel x={7} y={6} color={lace} />
      <Pixel x={8} y={6} color={main} />
      <Pixel x={9} y={6} color={dark} />
      <Pixel x={10} y={6} color={main} />
      <Pixel x={11} y={6} color={dark} />
      <Pixel x={4} y={7} color={main} />
      <Pixel x={5} y={7} color={dark} />
      <Pixel x={6} y={7} color={main} />
      <Pixel x={7} y={7} color={lace} />
      <Pixel x={8} y={7} color={dark} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={10} y={7} color={light} />
      <Pixel x={11} y={7} color={main} />
      {/* 鞋口（脚踝处） */}
      <Pixel x={4} y={8} color={dark} />
      <Pixel x={5} y={8} color={main} />
      <Pixel x={6} y={8} color={dark} />
      <Pixel x={7} y={8} color={darker} />
      <Pixel x={8} y={8} color={main} />
      <Pixel x={9} y={8} color={dark} />
      <Pixel x={10} y={8} color={main} />
      <Pixel x={11} y={8} color={dark} />
      {/* 鞋底中段 */}
      <Pixel x={4} y={9} color={soleMid} />
      <Pixel x={5} y={9} color={soleMid} />
      <Pixel x={6} y={9} color={soleMid} />
      <Pixel x={7} y={9} color={soleMid} />
      <Pixel x={8} y={9} color={soleMid} />
      <Pixel x={9} y={9} color={soleMid} />
      <Pixel x={10} y={9} color={soleMid} />
      <Pixel x={11} y={9} color={soleMid} />
      {/* 鞋底 */}
      <Pixel x={4} y={10} color={sole} />
      <Pixel x={5} y={10} color={sole} />
      <Pixel x={6} y={10} color={sole} />
      <Pixel x={7} y={10} color={sole} />
      <Pixel x={8} y={10} color={sole} />
      <Pixel x={9} y={10} color={sole} />
      <Pixel x={10} y={10} color={sole} />
      <Pixel x={11} y={10} color={sole} />
      <Pixel x={4} y={11} color={darker} width={8} height={1} />
      {/* 鞋头 */}
      <Pixel x={11} y={5} color={highlight} />
      <Pixel x={12} y={6} color={main} />
      <Pixel x={12} y={7} color={dark} />
      <Pixel x={12} y={8} color={main} />
      <Pixel x={12} y={9} color={soleMid} />
      <Pixel x={12} y={10} color={sole} />
      {/* 鞋带孔 */}
      <Pixel x={7} y={5} color={SILVER} />
      <Pixel x={7} y={6} color={SILVER_DARK} />
      <Pixel x={7} y={7} color={SILVER} />
      {/* 装饰 */}
      <Pixel x={6} y={7} color={ACCENT} />
      <Pixel x={9} y={6} color={ACCENT} />
      <Pixel x={5} y={9} color={STITCH} />
      <Pixel x={10} y={9} color={STITCH} />
    </>,
    // 变体2：高帮靴
    <>
      <Pixel x={5} y={3} color={dark} />
      <Pixel x={6} y={3} color={main} />
      <Pixel x={7} y={3} color={light} />
      <Pixel x={8} y={3} color={main} />
      <Pixel x={5} y={4} color={dark} />
      <Pixel x={6} y={4} color={main} />
      <Pixel x={7} y={4} color={highlight} />
      <Pixel x={8} y={4} color={main} />
      <Pixel x={9} y={4} color={dark} />
      <Pixel x={5} y={5} color={main} />
      <Pixel x={6} y={5} color={light} />
      <Pixel x={7} y={5} color={lace} />
      <Pixel x={8} y={5} color={main} />
      <Pixel x={9} y={5} color={dark} />
      <Pixel x={10} y={5} color={main} />
      <Pixel x={5} y={6} color={dark} />
      <Pixel x={6} y={6} color={main} />
      <Pixel x={7} y={6} color={lace} />
      <Pixel x={8} y={6} color={dark} />
      <Pixel x={9} y={6} color={main} />
      <Pixel x={10} y={6} color={light} />
      <Pixel x={11} y={6} color={dark} />
      <Pixel x={5} y={7} color={main} />
      <Pixel x={6} y={7} color={dark} />
      <Pixel x={7} y={7} color={lace} />
      <Pixel x={8} y={7} color={main} />
      <Pixel x={9} y={7} color={dark} />
      <Pixel x={10} y={7} color={main} />
      <Pixel x={11} y={7} color={main} />
      <Pixel x={5} y={8} color={dark} />
      <Pixel x={6} y={8} color={main} />
      <Pixel x={7} y={8} color={darker} />
      <Pixel x={8} y={8} color={dark} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={10} y={8} color={dark} />
      <Pixel x={11} y={8} color={main} />
      <Pixel x={5} y={9} color={soleMid} width={7} height={1} />
      <Pixel x={5} y={10} color={sole} width={7} height={1} />
      <Pixel x={5} y={11} color={darker} width={7} height={1} />
      <Pixel x={12} y={6} color={main} />
      <Pixel x={12} y={7} color={dark} />
      <Pixel x={12} y={8} color={main} />
      <Pixel x={12} y={9} color={soleMid} />
      <Pixel x={12} y={10} color={sole} />
      <Pixel x={7} y={4} color={SILVER} />
      <Pixel x={7} y={5} color={SILVER_DARK} />
      <Pixel x={7} y={6} color={SILVER} />
      <Pixel x={7} y={7} color={SILVER_DARK} />
      <Pixel x={6} y={5} color={ACCENT} />
      <Pixel x={9} y={6} color={ACCENT} />
      <Pixel x={6} y={9} color={STITCH} />
      <Pixel x={11} y={9} color={STITCH} />
      <Pixel x={11} y={5} color={highlight} />
    </>,
    // 变体3：战斗靴
    <>
      <Pixel x={6} y={4} color={dark} />
      <Pixel x={7} y={4} color={main} />
      <Pixel x={8} y={4} color={light} />
      <Pixel x={9} y={4} color={main} />
      <Pixel x={10} y={4} color={dark} />
      <Pixel x={5} y={5} color={dark} />
      <Pixel x={6} y={5} color={main} />
      <Pixel x={7} y={5} color={highlight} />
      <Pixel x={8} y={5} color={main} />
      <Pixel x={9} y={5} color={dark} />
      <Pixel x={10} y={5} color={main} />
      <Pixel x={11} y={5} color={dark} />
      <Pixel x={5} y={6} color={main} />
      <Pixel x={6} y={6} color={dark} />
      <Pixel x={7} y={6} color={lace} />
      <Pixel x={8} y={6} color={main} />
      <Pixel x={9} y={6} color={light} />
      <Pixel x={10} y={6} color={main} />
      <Pixel x={11} y={6} color={dark} />
      <Pixel x={5} y={7} color={dark} />
      <Pixel x={6} y={7} color={main} />
      <Pixel x={7} y={7} color={lace} />
      <Pixel x={8} y={7} color={dark} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={10} y={7} color={dark} />
      <Pixel x={11} y={7} color={main} />
      <Pixel x={5} y={8} color={main} />
      <Pixel x={6} y={8} color={dark} />
      <Pixel x={7} y={8} color={darker} />
      <Pixel x={8} y={8} color={main} />
      <Pixel x={9} y={8} color={dark} />
      <Pixel x={10} y={8} color={main} />
      <Pixel x={11} y={8} color={dark} />
      <Pixel x={5} y={9} color={soleMid} width={7} height={1} />
      <Pixel x={5} y={10} color={sole} width={7} height={1} />
      <Pixel x={5} y={11} color={darker} width={7} height={1} />
      <Pixel x={12} y={5} color={highlight} />
      <Pixel x={12} y={6} color={main} />
      <Pixel x={12} y={7} color={dark} />
      <Pixel x={12} y={8} color={main} />
      <Pixel x={12} y={9} color={soleMid} />
      <Pixel x={12} y={10} color={sole} />
      <Pixel x={7} y={5} color={SILVER} />
      <Pixel x={7} y={6} color={SILVER_DARK} />
      <Pixel x={7} y={7} color={SILVER} />
      <Pixel x={6} y={6} color={ACCENT} />
      <Pixel x={9} y={7} color={ACCENT} />
      <Pixel x={6} y={9} color={STITCH} />
      <Pixel x={11} y={9} color={STITCH} />
      <Pixel x={10} y={5} color={GOLD} />
    </>,
    // 变体4：轻甲靴
    <>
      <Pixel x={6} y={4} color={dark} />
      <Pixel x={7} y={4} color={main} />
      <Pixel x={8} y={4} color={light} />
      <Pixel x={9} y={4} color={main} />
      <Pixel x={5} y={5} color={dark} />
      <Pixel x={6} y={5} color={main} />
      <Pixel x={7} y={5} color={highlight} />
      <Pixel x={8} y={5} color={main} />
      <Pixel x={9} y={5} color={light} />
      <Pixel x={10} y={5} color={dark} />
      <Pixel x={5} y={6} color={main} />
      <Pixel x={6} y={6} color={light} />
      <Pixel x={7} y={6} color={lace} />
      <Pixel x={8} y={6} color={main} />
      <Pixel x={9} y={6} color={dark} />
      <Pixel x={10} y={6} color={main} />
      <Pixel x={11} y={6} color={dark} />
      <Pixel x={5} y={7} color={dark} />
      <Pixel x={6} y={7} color={main} />
      <Pixel x={7} y={7} color={lace} />
      <Pixel x={8} y={7} color={dark} />
      <Pixel x={9} y={7} color={main} />
      <Pixel x={10} y={7} color={light} />
      <Pixel x={11} y={7} color={main} />
      <Pixel x={5} y={8} color={main} />
      <Pixel x={6} y={8} color={dark} />
      <Pixel x={7} y={8} color={darker} />
      <Pixel x={8} y={8} color={main} />
      <Pixel x={9} y={8} color={dark} />
      <Pixel x={10} y={8} color={main} />
      <Pixel x={11} y={8} color={dark} />
      <Pixel x={5} y={9} color={soleMid} width={7} height={1} />
      <Pixel x={5} y={10} color={sole} width={7} height={1} />
      <Pixel x={5} y={11} color={darker} width={7} height={1} />
      <Pixel x={12} y={6} color={main} />
      <Pixel x={12} y={7} color={dark} />
      <Pixel x={12} y={8} color={main} />
      <Pixel x={12} y={9} color={soleMid} />
      <Pixel x={12} y={10} color={sole} />
      <Pixel x={7} y={5} color={SILVER} />
      <Pixel x={7} y={6} color={SILVER_DARK} />
      <Pixel x={7} y={7} color={SILVER} />
      <Pixel x={6} y={6} color={ACCENT} />
      <Pixel x={9} y={7} color={ACCENT} />
      <Pixel x={6} y={9} color={STITCH} />
      <Pixel x={11} y={9} color={STITCH} />
      <Pixel x={11} y={5} color={highlight} />
    </>,
    // 变体5：重装靴
    <>
      <Pixel x={5} y={3} color={darker} />
      <Pixel x={6} y={3} color={dark} />
      <Pixel x={7} y={3} color={main} />
      <Pixel x={8} y={3} color={light} />
      <Pixel x={9} y={3} color={main} />
      <Pixel x={10} y={3} color={dark} />
      <Pixel x={5} y={4} color={dark} />
      <Pixel x={6} y={4} color={main} />
      <Pixel x={7} y={4} color={highlight} />
      <Pixel x={8} y={4} color={main} />
      <Pixel x={9} y={4} color={light} />
      <Pixel x={10} y={4} color={main} />
      <Pixel x={11} y={4} color={dark} />
      <Pixel x={5} y={5} color={main} />
      <Pixel x={6} y={5} color={light} />
      <Pixel x={7} y={5} color={lace} />
      <Pixel x={8} y={5} color={main} />
      <Pixel x={9} y={5} color={dark} />
      <Pixel x={10} y={5} color={main} />
      <Pixel x={11} y={5} color={light} />
      <Pixel x={5} y={6} color={dark} />
      <Pixel x={6} y={6} color={main} />
      <Pixel x={7} y={6} color={lace} />
      <Pixel x={8} y={6} color={dark} />
      <Pixel x={9} y={6} color={main} />
      <Pixel x={10} y={6} color={dark} />
      <Pixel x={11} y={6} color={main} />
      <Pixel x={5} y={7} color={main} />
      <Pixel x={6} y={7} color={dark} />
      <Pixel x={7} y={7} color={lace} />
      <Pixel x={8} y={7} color={main} />
      <Pixel x={9} y={7} color={dark} />
      <Pixel x={10} y={7} color={main} />
      <Pixel x={11} y={7} color={dark} />
      <Pixel x={5} y={8} color={dark} />
      <Pixel x={6} y={8} color={main} />
      <Pixel x={7} y={8} color={darker} />
      <Pixel x={8} y={8} color={dark} />
      <Pixel x={9} y={8} color={main} />
      <Pixel x={10} y={8} color={dark} />
      <Pixel x={11} y={8} color={main} />
      <Pixel x={5} y={9} color={soleMid} width={7} height={1} />
      <Pixel x={5} y={10} color={sole} width={7} height={1} />
      <Pixel x={5} y={11} color={darker} width={7} height={1} />
      <Pixel x={12} y={5} color={main} />
      <Pixel x={12} y={6} color={dark} />
      <Pixel x={12} y={7} color={main} />
      <Pixel x={12} y={8} color={dark} />
      <Pixel x={12} y={9} color={soleMid} />
      <Pixel x={12} y={10} color={sole} />
      <Pixel x={7} y={4} color={SILVER} />
      <Pixel x={7} y={5} color={SILVER_DARK} />
      <Pixel x={7} y={6} color={SILVER} />
      <Pixel x={7} y={7} color={SILVER_DARK} />
      <Pixel x={6} y={5} color={ACCENT} />
      <Pixel x={9} y={6} color={ACCENT} />
      <Pixel x={6} y={9} color={STITCH} />
      <Pixel x={11} y={9} color={STITCH} />
      <Pixel x={8} y={5} color={GOLD} />
      <Pixel x={10} y={4} color={highlight} />
    </>,
  ];
  
  return patterns[variant % 5];
}

// 耳环：钩形挂耳+宝石坠饰
function EarringIcon({ variant, tint }: { variant: number; tint: string }) {
  const main = tint;
  const dark = adjustColor(tint, -40);
  const light = adjustColor(tint, 30);
  const highlight = adjustColor(tint, 55);
  const gem = '#FF44AA';
  const gemDark = '#8B0044';
  const gemLight = '#FFAADD';
  const wire = GOLD;
  const wireDark = GOLD_DARK;

  const patterns = [
    // 变体1：吊坠耳环
    <>
      {/* 挂钩 */}
      <Pixel x={7} y={2} color={wireDark} />
      <Pixel x={7} y={3} color={wire} />
      <Pixel x={6} y={3} color={wireDark} />
      <Pixel x={8} y={3} color={wireDark} />
      <Pixel x={7} y={4} color={wire} />
      {/* 连接环 */}
      <Pixel x={6} y={5} color={wireDark} />
      <Pixel x={7} y={5} color={wire} />
      <Pixel x={8} y={5} color={wireDark} />
      <Pixel x={7} y={6} color={wire} />
      {/* 宝石框 */}
      <Pixel x={6} y={7} color={wireDark} />
      <Pixel x={7} y={7} color={wire} />
      <Pixel x={8} y={7} color={wireDark} />
      <Pixel x={6} y={8} color={wire} />
      <Pixel x={7} y={8} color={gem} />
      <Pixel x={8} y={8} color={wire} />
      <Pixel x={6} y={9} color={wireDark} />
      <Pixel x={7} y={9} color={gemDark} />
      <Pixel x={8} y={9} color={wireDark} />
      <Pixel x={7} y={10} color={wire} />
      {/* 宝石高光 */}
      <Pixel x={7} y={8} color={gemLight} />
      <Pixel x={6} y={8} color={highlight} />
      {/* 装饰 */}
      <Pixel x={5} y={7} color={ACCENT} />
      <Pixel x={9} y={7} color={ACCENT} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={5} y={6} color={SILVER} />
      <Pixel x={9} y={6} color={SILVER} />
    </>,
    // 变体2：环形耳环
    <>
      <Pixel x={7} y={2} color={wireDark} />
      <Pixel x={6} y={3} color={wire} />
      <Pixel x={7} y={3} color={wire} />
      <Pixel x={8} y={3} color={wire} />
      <Pixel x={5} y={4} color={wire} />
      <Pixel x={9} y={4} color={wire} />
      <Pixel x={5} y={5} color={wireDark} />
      <Pixel x={9} y={5} color={wireDark} />
      <Pixel x={5} y={6} color={wire} />
      <Pixel x={6} y={6} color={highlight} />
      <Pixel x={8} y={6} color={highlight} />
      <Pixel x={9} y={6} color={wire} />
      <Pixel x={6} y={7} color={wire} />
      <Pixel x={7} y={7} color={gem} />
      <Pixel x={8} y={7} color={wire} />
      <Pixel x={7} y={8} color={wireDark} />
      <Pixel x={7} y={9} color={gemDark} />
      <Pixel x={7} y={10} color={wire} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={6} y={5} color={gemLight} />
      <Pixel x={8} y={5} color={gemLight} />
      <Pixel x={5} y={7} color={SILVER} />
      <Pixel x={9} y={7} color={SILVER} />
      <Pixel x={7} y={4} color={ACCENT} />
    </>,
    // 变体3：坠饰耳环
    <>
      <Pixel x={7} y={2} color={wireDark} />
      <Pixel x={7} y={3} color={wire} />
      <Pixel x={6} y={4} color={wireDark} />
      <Pixel x={7} y={4} color={wire} />
      <Pixel x={8} y={4} color={wireDark} />
      <Pixel x={6} y={5} color={wire} />
      <Pixel x={7} y={5} color={highlight} />
      <Pixel x={8} y={5} color={wire} />
      <Pixel x={6} y={6} color={wireDark} />
      <Pixel x={7} y={6} color={gem} />
      <Pixel x={8} y={6} color={wireDark} />
      <Pixel x={5} y={7} color={wireDark} />
      <Pixel x={6} y={7} color={gem} />
      <Pixel x={7} y={7} color={gemLight} />
      <Pixel x={8} y={7} color={gem} />
      <Pixel x={9} y={7} color={wireDark} />
      <Pixel x={6} y={8} color={gemDark} />
      <Pixel x={7} y={8} color={gem} />
      <Pixel x={8} y={8} color={gemDark} />
      <Pixel x={7} y={9} color={wireDark} />
      <Pixel x={7} y={10} color={wire} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={5} y={6} color={SILVER} />
      <Pixel x={9} y={6} color={SILVER} />
      <Pixel x={5} y={8} color={SILVER_DARK} />
      <Pixel x={9} y={8} color={SILVER_DARK} />
      <Pixel x={7} y={6} color={highlight} />
    </>,
    // 变体4：水滴耳环
    <>
      <Pixel x={7} y={2} color={wireDark} />
      <Pixel x={7} y={3} color={wire} />
      <Pixel x={6} y={4} color={wireDark} />
      <Pixel x={7} y={4} color={wire} />
      <Pixel x={8} y={4} color={wireDark} />
      <Pixel x={6} y={5} color={wire} />
      <Pixel x={7} y={5} color={highlight} />
      <Pixel x={8} y={5} color={wire} />
      <Pixel x={6} y={6} color={wireDark} />
      <Pixel x={7} y={6} color={wire} />
      <Pixel x={8} y={6} color={wireDark} />
      <Pixel x={6} y={7} color={gem} />
      <Pixel x={7} y={7} color={gemLight} />
      <Pixel x={8} y={7} color={gem} />
      <Pixel x={6} y={8} color={gemDark} />
      <Pixel x={7} y={8} color={gem} />
      <Pixel x={8} y={8} color={gemDark} />
      <Pixel x={7} y={9} color={gem} />
      <Pixel x={7} y={10} color={gemDark} />
      <Pixel x={7} y={11} color={wire} />
      <Pixel x={5} y={6} color={SILVER} />
      <Pixel x={9} y={6} color={SILVER} />
      <Pixel x={5} y={8} color={SILVER_DARK} />
      <Pixel x={9} y={8} color={SILVER_DARK} />
      <Pixel x={7} y={7} color={highlight} />
      <Pixel x={6} y={7} color={ACCENT} />
      <Pixel x={8} y={7} color={ACCENT} />
    </>,
    // 变体5：晶石耳环
    <>
      <Pixel x={7} y={2} color={wireDark} />
      <Pixel x={7} y={3} color={wire} />
      <Pixel x={6} y={4} color={wireDark} />
      <Pixel x={7} y={4} color={wire} />
      <Pixel x={8} y={4} color={wireDark} />
      <Pixel x={6} y={5} color={wire} />
      <Pixel x={7} y={5} color={highlight} />
      <Pixel x={8} y={5} color={wire} />
      <Pixel x={6} y={6} color={wireDark} />
      <Pixel x={7} y={6} color={ACCENT} />
      <Pixel x={8} y={6} color={wireDark} />
      <Pixel x={5} y={7} color={wireDark} />
      <Pixel x={6} y={7} color={wire} />
      <Pixel x={7} y={7} color={gemLight} />
      <Pixel x={8} y={7} color={wire} />
      <Pixel x={9} y={7} color={wireDark} />
      <Pixel x={5} y={8} color={gem} />
      <Pixel x={6} y={8} color={gemLight} />
      <Pixel x={7} y={8} color={gem} />
      <Pixel x={8} y={8} color={gemLight} />
      <Pixel x={9} y={8} color={gem} />
      <Pixel x={6} y={9} color={gemDark} />
      <Pixel x={7} y={9} color={gem} />
      <Pixel x={8} y={9} color={gemDark} />
      <Pixel x={7} y={10} color={wireDark} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={5} y={6} color={SILVER} />
      <Pixel x={9} y={6} color={SILVER} />
      <Pixel x={7} y={7} color={highlight} />
    </>,
  ];
  
  return patterns[variant % 5];
}

// 戒指：圆形戒环+顶部宝石镶嵌
function RingIcon({ variant, tint }: { variant: number; tint: string }) {
  const main = tint;
  const dark = adjustColor(tint, -40);
  const light = adjustColor(tint, 30);
  const highlight = adjustColor(tint, 55);
  const band = GOLD;
  const bandDark = GOLD_DARK;
  const gem = '#44AAFF';
  const gemDark = '#1A4488';
  const gemLight = '#AAEEFF';

  const patterns = [
    // 变体1：镶嵌戒指
    <>
      {/* 宝石座 */}
      <Pixel x={6} y={3} color={bandDark} />
      <Pixel x={7} y={3} color={band} />
      <Pixel x={8} y={3} color={bandDark} />
      <Pixel x={6} y={4} color={band} />
      <Pixel x={7} y={4} color={gem} />
      <Pixel x={8} y={4} color={band} />
      <Pixel x={6} y={5} color={bandDark} />
      <Pixel x={7} y={5} color={gemLight} />
      <Pixel x={8} y={5} color={bandDark} />
      {/* 戒环顶部 */}
      <Pixel x={5} y={6} color={bandDark} />
      <Pixel x={6} y={6} color={band} />
      <Pixel x={7} y={6} color={gemDark} />
      <Pixel x={8} y={6} color={band} />
      <Pixel x={9} y={6} color={bandDark} />
      {/* 戒环左侧 */}
      <Pixel x={4} y={7} color={bandDark} />
      <Pixel x={5} y={7} color={band} />
      <Pixel x={6} y={7} color={highlight} />
      <Pixel x={7} y={7} color={gem} />
      <Pixel x={8} y={7} color={band} />
      <Pixel x={9} y={7} color={highlight} />
      <Pixel x={10} y={7} color={bandDark} />
      {/* 戒环中部 */}
      <Pixel x={4} y={8} color={band} />
      <Pixel x={5} y={8} color={highlight} />
      <Pixel x={6} y={8} color={band} />
      <Pixel x={7} y={8} color={gemDark} />
      <Pixel x={8} y={8} color={band} />
      <Pixel x={9} y={8} color={highlight} />
      <Pixel x={10} y={8} color={band} />
      {/* 戒环底部 */}
      <Pixel x={5} y={9} color={bandDark} />
      <Pixel x={6} y={9} color={band} />
      <Pixel x={7} y={9} color={bandDark} />
      <Pixel x={8} y={9} color={band} />
      <Pixel x={9} y={9} color={bandDark} />
      <Pixel x={6} y={10} color={bandDark} />
      <Pixel x={7} y={10} color={band} />
      <Pixel x={8} y={10} color={bandDark} />
      {/* 装饰 */}
      <Pixel x={5} y={5} color={SILVER} />
      <Pixel x={9} y={5} color={SILVER} />
      <Pixel x={5} y={8} color={SILVER_DARK} />
      <Pixel x={9} y={8} color={SILVER_DARK} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={7} y={2} color={ACCENT} />
    </>,
    // 变体2：宽戒
    <>
      <Pixel x={6} y={3} color={bandDark} />
      <Pixel x={7} y={3} color={band} />
      <Pixel x={8} y={3} color={bandDark} />
      <Pixel x={6} y={4} color={band} />
      <Pixel x={7} y={4} color={gem} />
      <Pixel x={8} y={4} color={band} />
      <Pixel x={6} y={5} color={bandDark} />
      <Pixel x={7} y={5} color={gemLight} />
      <Pixel x={8} y={5} color={bandDark} />
      <Pixel x={4} y={6} color={bandDark} />
      <Pixel x={5} y={6} color={band} />
      <Pixel x={6} y={6} color={highlight} />
      <Pixel x={7} y={6} color={gemDark} />
      <Pixel x={8} y={6} color={highlight} />
      <Pixel x={9} y={6} color={band} />
      <Pixel x={10} y={6} color={bandDark} />
      <Pixel x={4} y={7} color={band} />
      <Pixel x={5} y={7} color={highlight} />
      <Pixel x={6} y={7} color={band} />
      <Pixel x={7} y={7} color={gem} />
      <Pixel x={8} y={7} color={band} />
      <Pixel x={9} y={7} color={highlight} />
      <Pixel x={10} y={7} color={band} />
      <Pixel x={4} y={8} color={band} />
      <Pixel x={5} y={8} color={band} />
      <Pixel x={6} y={8} color={highlight} />
      <Pixel x={7} y={8} color={gemDark} />
      <Pixel x={8} y={8} color={highlight} />
      <Pixel x={9} y={8} color={band} />
      <Pixel x={10} y={8} color={band} />
      <Pixel x={5} y={9} color={bandDark} />
      <Pixel x={6} y={9} color={band} />
      <Pixel x={7} y={9} color={band} />
      <Pixel x={8} y={9} color={band} />
      <Pixel x={9} y={9} color={bandDark} />
      <Pixel x={6} y={10} color={bandDark} />
      <Pixel x={7} y={10} color={band} />
      <Pixel x={8} y={10} color={bandDark} />
      <Pixel x={5} y={6} color={SILVER} />
      <Pixel x={9} y={6} color={SILVER} />
      <Pixel x={5} y={8} color={SILVER_DARK} />
      <Pixel x={9} y={8} color={SILVER_DARK} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={7} y={2} color={ACCENT} />
    </>,
    // 变体3：圆环戒指
    <>
      <Pixel x={6} y={3} color={bandDark} />
      <Pixel x={7} y={3} color={band} />
      <Pixel x={8} y={3} color={bandDark} />
      <Pixel x={6} y={4} color={band} />
      <Pixel x={7} y={4} color={gem} />
      <Pixel x={8} y={4} color={band} />
      <Pixel x={6} y={5} color={bandDark} />
      <Pixel x={7} y={5} color={gemDark} />
      <Pixel x={8} y={5} color={bandDark} />
      <Pixel x={5} y={6} color={bandDark} />
      <Pixel x={6} y={6} color={band} />
      <Pixel x={7} y={6} color={band} />
      <Pixel x={8} y={6} color={band} />
      <Pixel x={9} y={6} color={bandDark} />
      <Pixel x={4} y={7} color={bandDark} />
      <Pixel x={5} y={7} color={band} />
      <Pixel x={6} y={7} color={highlight} />
      <Pixel x={7} y={7} color={gemLight} />
      <Pixel x={8} y={7} color={highlight} />
      <Pixel x={9} y={7} color={band} />
      <Pixel x={10} y={7} color={bandDark} />
      <Pixel x={4} y={8} color={band} />
      <Pixel x={5} y={8} color={highlight} />
      <Pixel x={6} y={8} color={band} />
      <Pixel x={7} y={8} color={gem} />
      <Pixel x={8} y={8} color={band} />
      <Pixel x={9} y={8} color={highlight} />
      <Pixel x={10} y={8} color={band} />
      <Pixel x={5} y={9} color={bandDark} />
      <Pixel x={6} y={9} color={band} />
      <Pixel x={7} y={9} color={bandDark} />
      <Pixel x={8} y={9} color={band} />
      <Pixel x={9} y={9} color={bandDark} />
      <Pixel x={6} y={10} color={bandDark} />
      <Pixel x={7} y={10} color={band} />
      <Pixel x={8} y={10} color={bandDark} />
      <Pixel x={5} y={5} color={SILVER} />
      <Pixel x={9} y={5} color={SILVER} />
      <Pixel x={5} y={9} color={SILVER_DARK} />
      <Pixel x={9} y={9} color={SILVER_DARK} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={7} y={2} color={ACCENT} />
    </>,
    // 变体4：能量戒指
    <>
      <Pixel x={6} y={3} color={bandDark} />
      <Pixel x={7} y={3} color={ACCENT} />
      <Pixel x={8} y={3} color={bandDark} />
      <Pixel x={6} y={4} color={band} />
      <Pixel x={7} y={4} color={gemLight} />
      <Pixel x={8} y={4} color={band} />
      <Pixel x={6} y={5} color={bandDark} />
      <Pixel x={7} y={5} color={gem} />
      <Pixel x={8} y={5} color={bandDark} />
      <Pixel x={5} y={6} color={bandDark} />
      <Pixel x={6} y={6} color={band} />
      <Pixel x={7} y={6} color={ACCENT} />
      <Pixel x={8} y={6} color={band} />
      <Pixel x={9} y={6} color={bandDark} />
      <Pixel x={4} y={7} color={bandDark} />
      <Pixel x={5} y={7} color={band} />
      <Pixel x={6} y={7} color={highlight} />
      <Pixel x={7} y={7} color={gemLight} />
      <Pixel x={8} y={7} color={highlight} />
      <Pixel x={9} y={7} color={band} />
      <Pixel x={10} y={7} color={bandDark} />
      <Pixel x={4} y={8} color={band} />
      <Pixel x={5} y={8} color={highlight} />
      <Pixel x={6} y={8} color={band} />
      <Pixel x={7} y={8} color={gemDark} />
      <Pixel x={8} y={8} color={band} />
      <Pixel x={9} y={8} color={highlight} />
      <Pixel x={10} y={8} color={band} />
      <Pixel x={5} y={9} color={bandDark} />
      <Pixel x={6} y={9} color={band} />
      <Pixel x={7} y={9} color={bandDark} />
      <Pixel x={8} y={9} color={band} />
      <Pixel x={9} y={9} color={bandDark} />
      <Pixel x={6} y={10} color={bandDark} />
      <Pixel x={7} y={10} color={band} />
      <Pixel x={8} y={10} color={bandDark} />
      <Pixel x={5} y={5} color={SILVER} />
      <Pixel x={9} y={5} color={SILVER} />
      <Pixel x={5} y={9} color={SILVER_DARK} />
      <Pixel x={9} y={9} color={SILVER_DARK} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={7} y={2} color={ACCENT} />
    </>,
    // 变体5：金边戒指
    <>
      <Pixel x={6} y={3} color={bandDark} />
      <Pixel x={7} y={3} color={band} />
      <Pixel x={8} y={3} color={bandDark} />
      <Pixel x={6} y={4} color={band} />
      <Pixel x={7} y={4} color={gem} />
      <Pixel x={8} y={4} color={band} />
      <Pixel x={6} y={5} color={bandDark} />
      <Pixel x={7} y={5} color={gemLight} />
      <Pixel x={8} y={5} color={bandDark} />
      <Pixel x={5} y={6} color={bandDark} />
      <Pixel x={6} y={6} color={band} />
      <Pixel x={7} y={6} color={gemDark} />
      <Pixel x={8} y={6} color={band} />
      <Pixel x={9} y={6} color={bandDark} />
      <Pixel x={4} y={7} color={bandDark} />
      <Pixel x={5} y={7} color={band} />
      <Pixel x={6} y={7} color={highlight} />
      <Pixel x={7} y={7} color={gem} />
      <Pixel x={8} y={7} color={highlight} />
      <Pixel x={9} y={7} color={band} />
      <Pixel x={10} y={7} color={bandDark} />
      <Pixel x={4} y={8} color={band} />
      <Pixel x={5} y={8} color={bandDark} />
      <Pixel x={6} y={8} color={band} />
      <Pixel x={7} y={8} color={gemDark} />
      <Pixel x={8} y={8} color={band} />
      <Pixel x={9} y={8} color={bandDark} />
      <Pixel x={10} y={8} color={band} />
      <Pixel x={5} y={9} color={bandDark} />
      <Pixel x={6} y={9} color={band} />
      <Pixel x={7} y={9} color={bandDark} />
      <Pixel x={8} y={9} color={band} />
      <Pixel x={9} y={9} color={bandDark} />
      <Pixel x={6} y={10} color={bandDark} />
      <Pixel x={7} y={10} color={band} />
      <Pixel x={8} y={10} color={bandDark} />
      <Pixel x={5} y={5} color={SILVER} />
      <Pixel x={9} y={5} color={SILVER} />
      <Pixel x={5} y={9} color={SILVER_DARK} />
      <Pixel x={9} y={9} color={SILVER_DARK} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={7} y={2} color={ACCENT} />
    </>,
  ];
  
  return patterns[variant % 5];
}

// 项链：链条弧形+吊坠+宝石
function NecklaceIcon({ variant, tint }: { variant: number; tint: string }) {
  const main = tint;
  const dark = adjustColor(tint, -40);
  const light = adjustColor(tint, 30);
  const highlight = adjustColor(tint, 55);
  const chain = GOLD;
  const chainDark = GOLD_DARK;
  const pendant = '#9A6B3F';
  const pendantDark = '#5D4037';
  const gem = '#DC143C';
  const gemDark = '#8B0000';
  const gemLight = '#FF6688';

  const patterns = [
    // 变体1：宝石项链
    <>
      {/* 链条弧形 */}
      <Pixel x={3} y={3} color={chainDark} />
      <Pixel x={12} y={3} color={chainDark} />
      <Pixel x={4} y={3} color={chain} />
      <Pixel x={11} y={3} color={chain} />
      <Pixel x={4} y={4} color={chain} />
      <Pixel x={5} y={4} color={highlight} />
      <Pixel x={10} y={4} color={highlight} />
      <Pixel x={11} y={4} color={chain} />
      <Pixel x={5} y={5} color={chain} />
      <Pixel x={6} y={5} color={chain} />
      <Pixel x={9} y={5} color={chain} />
      <Pixel x={10} y={5} color={chain} />
      <Pixel x={6} y={6} color={chainDark} />
      <Pixel x={9} y={6} color={chainDark} />
      {/* 吊坠框 */}
      <Pixel x={6} y={6} color={chainDark} />
      <Pixel x={7} y={6} color={chain} />
      <Pixel x={8} y={6} color={chainDark} />
      <Pixel x={6} y={7} color={chain} />
      <Pixel x={7} y={7} color={gem} />
      <Pixel x={8} y={7} color={chain} />
      <Pixel x={6} y={8} color={chainDark} />
      <Pixel x={7} y={8} color={gemLight} />
      <Pixel x={8} y={8} color={chainDark} />
      <Pixel x={7} y={9} color={chain} />
      <Pixel x={7} y={10} color={chainDark} />
      {/* 装饰 */}
      <Pixel x={5} y={4} color={SILVER} />
      <Pixel x={10} y={4} color={SILVER} />
      <Pixel x={7} y={7} color={gemLight} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={3} y={3} color={SILVER_DARK} />
      <Pixel x={12} y={3} color={SILVER_DARK} />
    </>,
    // 变体2：圆环项链
    <>
      <Pixel x={3} y={3} color={chainDark} />
      <Pixel x={12} y={3} color={chainDark} />
      <Pixel x={4} y={3} color={chain} />
      <Pixel x={11} y={3} color={chain} />
      <Pixel x={4} y={4} color={chain} />
      <Pixel x={5} y={4} color={highlight} />
      <Pixel x={10} y={4} color={highlight} />
      <Pixel x={11} y={4} color={chain} />
      <Pixel x={5} y={5} color={chain} />
      <Pixel x={6} y={5} color={chain} />
      <Pixel x={9} y={5} color={chain} />
      <Pixel x={10} y={5} color={chain} />
      <Pixel x={6} y={6} color={chainDark} />
      <Pixel x={9} y={6} color={chainDark} />
      <Pixel x={6} y={7} color={chain} />
      <Pixel x={7} y={7} color={chain} />
      <Pixel x={8} y={7} color={chain} />
      <Pixel x={9} y={7} color={chain} />
      <Pixel x={6} y={8} color={chainDark} />
      <Pixel x={7} y={8} color={highlight} />
      <Pixel x={8} y={8} color={highlight} />
      <Pixel x={9} y={8} color={chainDark} />
      <Pixel x={7} y={9} color={chain} />
      <Pixel x={8} y={9} color={chain} />
      <Pixel x={7} y={10} color={chainDark} />
      <Pixel x={8} y={10} color={chainDark} />
      <Pixel x={5} y={4} color={SILVER} />
      <Pixel x={10} y={4} color={SILVER} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={8} y={11} color={ACCENT} />
      <Pixel x={3} y={3} color={SILVER_DARK} />
      <Pixel x={12} y={3} color={SILVER_DARK} />
    </>,
    // 变体3：能量项链
    <>
      <Pixel x={3} y={3} color={chainDark} />
      <Pixel x={12} y={3} color={chainDark} />
      <Pixel x={4} y={3} color={chain} />
      <Pixel x={11} y={3} color={chain} />
      <Pixel x={4} y={4} color={chain} />
      <Pixel x={5} y={4} color={ACCENT} />
      <Pixel x={10} y={4} color={ACCENT} />
      <Pixel x={11} y={4} color={chain} />
      <Pixel x={5} y={5} color={chain} />
      <Pixel x={6} y={5} color={ACCENT} />
      <Pixel x={9} y={5} color={ACCENT} />
      <Pixel x={10} y={5} color={chain} />
      <Pixel x={6} y={6} color={chainDark} />
      <Pixel x={9} y={6} color={chainDark} />
      <Pixel x={6} y={7} color={chain} />
      <Pixel x={7} y={7} color={gemLight} />
      <Pixel x={8} y={7} color={gemLight} />
      <Pixel x={9} y={7} color={chain} />
      <Pixel x={6} y={8} color={chainDark} />
      <Pixel x={7} y={8} color={gem} />
      <Pixel x={8} y={8} color={gem} />
      <Pixel x={9} y={8} color={chainDark} />
      <Pixel x={7} y={9} color={gemDark} />
      <Pixel x={8} y={9} color={gemDark} />
      <Pixel x={7} y={10} color={chainDark} />
      <Pixel x={8} y={10} color={chainDark} />
      <Pixel x={5} y={4} color={SILVER} />
      <Pixel x={10} y={4} color={SILVER} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={8} y={11} color={ACCENT} />
    </>,
    // 变体4：徽章项链
    <>
      <Pixel x={3} y={3} color={chainDark} />
      <Pixel x={12} y={3} color={chainDark} />
      <Pixel x={4} y={3} color={chain} />
      <Pixel x={11} y={3} color={chain} />
      <Pixel x={4} y={4} color={chain} />
      <Pixel x={5} y={4} color={highlight} />
      <Pixel x={10} y={4} color={highlight} />
      <Pixel x={11} y={4} color={chain} />
      <Pixel x={5} y={5} color={chain} />
      <Pixel x={6} y={5} color={chain} />
      <Pixel x={9} y={5} color={chain} />
      <Pixel x={10} y={5} color={chain} />
      <Pixel x={6} y={6} color={chainDark} />
      <Pixel x={9} y={6} color={chainDark} />
      <Pixel x={5} y={7} color={pendantDark} />
      <Pixel x={6} y={7} color={pendant} />
      <Pixel x={7} y={7} color={GOLD} />
      <Pixel x={8} y={7} color={GOLD} />
      <Pixel x={9} y={7} color={pendant} />
      <Pixel x={10} y={7} color={pendantDark} />
      <Pixel x={5} y={8} color={pendant} />
      <Pixel x={6} y={8} color={highlight} />
      <Pixel x={7} y={8} color={GOLD_DARK} />
      <Pixel x={8} y={8} color={GOLD_DARK} />
      <Pixel x={9} y={8} color={highlight} />
      <Pixel x={10} y={8} color={pendant} />
      <Pixel x={6} y={9} color={pendantDark} />
      <Pixel x={7} y={9} color={pendant} />
      <Pixel x={8} y={9} color={pendant} />
      <Pixel x={9} y={9} color={pendantDark} />
      <Pixel x={7} y={10} color={pendantDark} />
      <Pixel x={8} y={10} color={pendantDark} />
      <Pixel x={5} y={4} color={SILVER} />
      <Pixel x={10} y={4} color={SILVER} />
      <Pixel x={7} y={11} color={ACCENT} />
      <Pixel x={8} y={11} color={ACCENT} />
    </>,
    // 变体5：泪滴项链
    <>
      <Pixel x={3} y={3} color={chainDark} />
      <Pixel x={12} y={3} color={chainDark} />
      <Pixel x={4} y={3} color={chain} />
      <Pixel x={11} y={3} color={chain} />
      <Pixel x={4} y={4} color={chain} />
      <Pixel x={5} y={4} color={highlight} />
      <Pixel x={10} y={4} color={highlight} />
      <Pixel x={11} y={4} color={chain} />
      <Pixel x={5} y={5} color={chain} />
      <Pixel x={6} y={5} color={chain} />
      <Pixel x={9} y={5} color={chain} />
      <Pixel x={10} y={5} color={chain} />
      <Pixel x={6} y={6} color={chainDark} />
      <Pixel x={9} y={6} color={chainDark} />
      <Pixel x={6} y={7} color={chain} />
      <Pixel x={7} y={7} color={gemLight} />
      <Pixel x={8} y={7} color={gemLight} />
      <Pixel x={9} y={7} color={chain} />
      <Pixel x={6} y={8} color={chainDark} />
      <Pixel x={7} y={8} color={gem} />
      <Pixel x={8} y={8} color={gem} />
      <Pixel x={9} y={8} color={chainDark} />
      <Pixel x={7} y={9} color={gem} />
      <Pixel x={8} y={9} color={gem} />
      <Pixel x={7} y={10} color={gemDark} />
      <Pixel x={8} y={10} color={gemDark} />
      <Pixel x={7} y={11} color={chainDark} />
      <Pixel x={5} y={4} color={SILVER} />
      <Pixel x={10} y={4} color={SILVER} />
      <Pixel x={7} y={12} color={ACCENT} />
    </>,
  ];
  
  return patterns[variant % 5];
}

export function EquipmentIcon({ slot, rarity, variant, size = 32 }: EquipmentIconProps) {
  const tint = RARITY_TINTS[rarity];
  const glowColor = RARITY_GLOW[rarity];
  const isHighTier = rarity === 'legendary' || rarity === 'epic' || rarity === 'mythic';
  const isMythic = rarity === 'mythic';

  const renderIcon = () => {
    switch (slot) {
      case 'weapon': return <g transform="translate(2, -1)"><WeaponIcon variant={variant} tint={tint} /></g>;
      case 'armor': return <ArmorIcon variant={variant} tint={tint} />;
      case 'pants': return <PantsIcon variant={variant} tint={tint} />;
      case 'shoulder': return <g transform="translate(1.5, 2.5)"><ShoulderIcon variant={variant} tint={tint} /></g>;
      case 'belt': return <g transform="translate(0, -1.5)"><BeltIcon variant={variant} tint={tint} /></g>;
      case 'shoes': return <ShoesIcon variant={variant} tint={tint} />;
      case 'earring': return <g transform="translate(0.5, 1)"><EarringIcon variant={variant} tint={tint} /></g>;
      case 'ring': return <g transform="translate(0.5, 1)"><RingIcon variant={variant} tint={tint} /></g>;
      case 'necklace': return <NecklaceIcon variant={variant} tint={tint} />;
      default: return null;
    }
  };

  const star = (cx: number, cy: number, rx: number, ry: number) => {
    const qx = rx * 0.28;
    const qy = ry * 0.28;
    return `M${cx},${cy - ry} L${cx + qx},${cy - qy} L${cx + rx},${cy} L${cx + qx},${cy + qy} L${cx},${cy + ry} L${cx - qx},${cy + qy} L${cx - rx},${cy} L${cx - qx},${cy - qy} Z`;
  };

  return (
    <>
      {isMythic && (
        <style>{`
          @keyframes mythic-sparkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          .mythic-star {
            animation: mythic-sparkle 2.4s ease-in-out infinite;
          }
          .mythic-star-2 { animation-delay: 0.8s; }
          .mythic-star-3 { animation-delay: 1.6s; }
        `}</style>
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        overflow="visible"
        style={{
          imageRendering: 'pixelated',
          overflow: 'visible',
        }}
      >
        {renderIcon()}
        {isHighTier && (
          <>
            <rect x={0} y={0} width={1} height={1} fill={glowColor} opacity={0.9} />
            <rect x={15} y={0} width={1} height={1} fill={glowColor} opacity={0.9} />
            <rect x={0} y={15} width={1} height={1} fill={glowColor} opacity={0.9} />
            <rect x={15} y={15} width={1} height={1} fill={glowColor} opacity={0.9} />
          </>
        )}
        {isMythic && (
          <>
            <path d={star(3, 4, 2.2, 4.2)} fill="rgba(90, 156, 232, 0.25)" />
            <path
              d={star(3, 4, 1.3, 2.8)}
              fill="#5A9CE8"
              className="mythic-star mythic-star-1"
            />
            <path d={star(6, 14, 3.0, 3.0)} fill="rgba(90, 156, 232, 0.25)" />
            <path
              d={star(6, 14, 1.9, 1.9)}
              fill="#5A9CE8"
              className="mythic-star mythic-star-2"
            />
            <path d={star(14, 8, 4.0, 4.0)} fill="rgba(90, 156, 232, 0.25)" />
            <path
              d={star(14, 8, 2.6, 2.6)}
              fill="#5A9CE8"
              className="mythic-star mythic-star-3"
            />
          </>
        )}
      </svg>
    </>
  );
}