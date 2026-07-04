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

function Pixel({ x, y, color, size = 1 }: { x: number; y: number; color: string; size?: number }) {
  return <rect x={x} y={y} width={size} height={size} fill={color} />;
}

function WeaponIcon({ variant, tint }: { variant: number; tint: string }) {
  const darkTint = adjustColor(tint, -40);
  const lightTint = adjustColor(tint, 30);
  
  const patterns = [
    <>
      <Pixel x={2} y={7} color={darkTint} size={2} />
      <Pixel x={4} y={7} color={tint} size={6} />
      <Pixel x={10} y={6} color={tint} size={3} />
      <Pixel x={13} y={7} color={tint} size={2} />
      <Pixel x={6} y={9} color={darkTint} size={2} />
      <Pixel x={5} y={10} color={darkTint} />
      <Pixel x={6} y={11} color="#5D4037" size={2} />
      <Pixel x={4} y={13} color="#5D4037" size={4} />
      <Pixel x={3} y={8} color={lightTint} />
    </>,
    <>
      <Pixel x={3} y={8} color={darkTint} size={2} />
      <Pixel x={5} y={7} color={tint} size={7} />
      <Pixel x={12} y={6} color={tint} size={2} />
      <Pixel x={12} y={8} color={tint} size={2} />
      <Pixel x={11} y={9} color={darkTint} />
      <Pixel x={7} y={10} color={darkTint} size={2} />
      <Pixel x={6} y={11} color="#5D4037" size={3} />
      <Pixel x={5} y={12} color="#5D4037" size={3} />
      <Pixel x={6} y={8} color={lightTint} />
    </>,
    <>
      <Pixel x={2} y={9} color={darkTint} />
      <Pixel x={3} y={8} color={tint} size={2} />
      <Pixel x={5} y={7} color={tint} size={8} />
      <Pixel x={13} y={6} color={tint} />
      <Pixel x={13} y={8} color={darkTint} />
      <Pixel x={8} y={9} color={darkTint} size={2} />
      <Pixel x={7} y={11} color="#5D4037" size={2} />
      <Pixel x={6} y={12} color="#5D4037" size={3} />
      <Pixel x={4} y={9} color={lightTint} />
    </>,
    <>
      <Pixel x={4} y={6} color={darkTint} />
      <Pixel x={3} y={7} color={tint} size={2} />
      <Pixel x={5} y={8} color={tint} size={6} />
      <Pixel x={11} y={7} color={tint} size={3} />
      <Pixel x={14} y={8} color={darkTint} />
      <Pixel x={7} y={10} color={darkTint} />
      <Pixel x={6} y={11} color="#5D4037" size={2} />
      <Pixel x={5} y={12} color="#5D4037" size={3} />
      <Pixel x={6} y={9} color={lightTint} />
    </>,
    <>
      <Pixel x={3} y={7} color={darkTint} size={2} />
      <Pixel x={5} y={6} color={tint} size={2} />
      <Pixel x={7} y={7} color={tint} size={6} />
      <Pixel x={13} y={6} color={darkTint} />
      <Pixel x={12} y={8} color={tint} />
      <Pixel x={9} y={9} color={darkTint} size={2} />
      <Pixel x={8} y={11} color="#5D4037" size={2} />
      <Pixel x={7} y={12} color="#5D4037" size={3} />
      <Pixel x={8} y={8} color={lightTint} />
    </>,
  ];
  
  return patterns[variant % 5];
}

function ArmorIcon({ variant, tint }: { variant: number; tint: string }) {
  const darkTint = adjustColor(tint, -40);
  const lightTint = adjustColor(tint, 30);
  const shadow = adjustColor(tint, -60);
  
  const patterns = [
    <>
      <Pixel x={5} y={3} color={darkTint} size={6} />
      <Pixel x={4} y={4} color={tint} size={8} />
      <Pixel x={3} y={5} color={tint} size={10} />
      <Pixel x={3} y={6} color={tint} size={10} />
      <Pixel x={4} y={7} color={tint} size={8} />
      <Pixel x={5} y={8} color={tint} size={6} />
      <Pixel x={6} y={9} color={darkTint} size={4} />
      <Pixel x={7} y={4} color={lightTint} size={2} />
      <Pixel x={5} y={5} color={shadow} size={2} />
      <Pixel x={9} y={5} color={shadow} size={2} />
    </>,
    <>
      <Pixel x={6} y={2} color={darkTint} size={4} />
      <Pixel x={5} y={3} color={tint} size={6} />
      <Pixel x={4} y={4} color={tint} size={8} />
      <Pixel x={3} y={5} color={tint} size={10} />
      <Pixel x={4} y={6} color={tint} size={8} />
      <Pixel x={5} y={7} color={tint} size={6} />
      <Pixel x={6} y={8} color={darkTint} size={4} />
      <Pixel x={7} y={3} color={lightTint} size={2} />
      <Pixel x={6} y={5} color={shadow} size={4} />
    </>,
    <>
      <Pixel x={5} y={3} color={tint} size={6} />
      <Pixel x={4} y={4} color={tint} size={8} />
      <Pixel x={3} y={5} color={darkTint} size={2} />
      <Pixel x={5} y={5} color={tint} size={6} />
      <Pixel x={11} y={5} color={darkTint} size={2} />
      <Pixel x={4} y={6} color={tint} size={8} />
      <Pixel x={5} y={7} color={tint} size={6} />
      <Pixel x={6} y={8} color={darkTint} size={4} />
      <Pixel x={6} y={4} color={lightTint} size={2} />
      <Pixel x={7} y={6} color={shadow} size={2} />
    </>,
    <>
      <Pixel x={6} y={2} color={tint} size={4} />
      <Pixel x={5} y={3} color={tint} size={6} />
      <Pixel x={4} y={4} color={darkTint} size={2} />
      <Pixel x={6} y={4} color={tint} size={4} />
      <Pixel x={10} y={4} color={darkTint} size={2} />
      <Pixel x={4} y={5} color={tint} size={8} />
      <Pixel x={5} y={6} color={tint} size={6} />
      <Pixel x={6} y={7} color={darkTint} size={4} />
      <Pixel x={7} y={3} color={lightTint} />
      <Pixel x={8} y={5} color={shadow} size={2} />
    </>,
    <>
      <Pixel x={5} y={3} color={darkTint} size={6} />
      <Pixel x={4} y={4} color={tint} size={8} />
      <Pixel x={3} y={5} color={tint} size={10} />
      <Pixel x={4} y={6} color={darkTint} size={8} />
      <Pixel x={5} y={7} color={tint} size={6} />
      <Pixel x={6} y={8} color={darkTint} size={4} />
      <Pixel x={7} y={4} color={lightTint} size={2} />
      <Pixel x={8} y={5} color={shadow} />
      <Pixel x={5} y={6} color={shadow} size={2} />
    </>,
  ];
  
  return patterns[variant % 5];
}

function PantsIcon({ variant, tint }: { variant: number; tint: string }) {
  const darkTint = adjustColor(tint, -40);
  const lightTint = adjustColor(tint, 30);
  
  const patterns = [
    <>
      <Pixel x={5} y={3} color={tint} size={6} />
      <Pixel x={4} y={4} color={tint} size={8} />
      <Pixel x={4} y={5} color={tint} size={8} />
      <Pixel x={4} y={6} color={darkTint} size={3} />
      <Pixel x={9} y={6} color={darkTint} size={3} />
      <Pixel x={4} y={7} color={tint} size={3} />
      <Pixel x={9} y={7} color={tint} size={3} />
      <Pixel x={4} y={8} color={tint} size={3} />
      <Pixel x={9} y={8} color={tint} size={3} />
      <Pixel x={4} y={9} color={darkTint} size={3} />
      <Pixel x={9} y={9} color={darkTint} size={3} />
      <Pixel x={6} y={4} color={lightTint} size={2} />
    </>,
    <>
      <Pixel x={5} y={3} color={darkTint} size={6} />
      <Pixel x={4} y={4} color={tint} size={8} />
      <Pixel x={4} y={5} color={tint} size={8} />
      <Pixel x={5} y={6} color={tint} size={2} />
      <Pixel x={9} y={6} color={tint} size={2} />
      <Pixel x={5} y={7} color={tint} size={2} />
      <Pixel x={9} y={7} color={tint} size={2} />
      <Pixel x={5} y={8} color={darkTint} size={2} />
      <Pixel x={9} y={8} color={darkTint} size={2} />
      <Pixel x={7} y={4} color={lightTint} />
    </>,
    <>
      <Pixel x={5} y={2} color={tint} size={6} />
      <Pixel x={4} y={3} color={tint} size={8} />
      <Pixel x={4} y={4} color={darkTint} size={8} />
      <Pixel x={4} y={5} color={tint} size={3} />
      <Pixel x={9} y={5} color={tint} size={3} />
      <Pixel x={4} y={6} color={tint} size={3} />
      <Pixel x={9} y={6} color={tint} size={3} />
      <Pixel x={4} y={7} color={darkTint} size={3} />
      <Pixel x={9} y={7} color={darkTint} size={3} />
      <Pixel x={6} y={3} color={lightTint} size={2} />
    </>,
    <>
      <Pixel x={6} y={3} color={tint} size={4} />
      <Pixel x={5} y={4} color={tint} size={6} />
      <Pixel x={4} y={5} color={tint} size={8} />
      <Pixel x={4} y={6} color={darkTint} size={3} />
      <Pixel x={9} y={6} color={darkTint} size={3} />
      <Pixel x={4} y={7} color={tint} size={3} />
      <Pixel x={9} y={7} color={tint} size={3} />
      <Pixel x={5} y={8} color={darkTint} size={2} />
      <Pixel x={9} y={8} color={darkTint} size={2} />
      <Pixel x={7} y={4} color={lightTint} />
    </>,
    <>
      <Pixel x={5} y={3} color={tint} size={6} />
      <Pixel x={4} y={4} color={darkTint} size={8} />
      <Pixel x={4} y={5} color={tint} size={8} />
      <Pixel x={5} y={6} color={tint} size={2} />
      <Pixel x={9} y={6} color={tint} size={2} />
      <Pixel x={5} y={7} color={darkTint} size={2} />
      <Pixel x={9} y={7} color={darkTint} size={2} />
      <Pixel x={5} y={8} color={tint} size={2} />
      <Pixel x={9} y={8} color={tint} size={2} />
      <Pixel x={7} y={5} color={lightTint} />
    </>,
  ];
  
  return patterns[variant % 5];
}

function ShoulderIcon({ variant, tint }: { variant: number; tint: string }) {
  const darkTint = adjustColor(tint, -40);
  const lightTint = adjustColor(tint, 30);
  
  const patterns = [
    <>
      <Pixel x={6} y={4} color={tint} size={4} />
      <Pixel x={5} y={5} color={tint} size={6} />
      <Pixel x={4} y={6} color={tint} size={8} />
      <Pixel x={4} y={7} color={darkTint} size={8} />
      <Pixel x={5} y={8} color={darkTint} size={6} />
      <Pixel x={7} y={5} color={lightTint} size={2} />
    </>,
    <>
      <Pixel x={7} y={3} color={darkTint} size={2} />
      <Pixel x={6} y={4} color={tint} size={4} />
      <Pixel x={5} y={5} color={tint} size={6} />
      <Pixel x={4} y={6} color={tint} size={8} />
      <Pixel x={5} y={7} color={darkTint} size={6} />
      <Pixel x={6} y={8} color={darkTint} size={4} />
      <Pixel x={7} y={4} color={lightTint} />
    </>,
    <>
      <Pixel x={5} y={4} color={darkTint} size={6} />
      <Pixel x={4} y={5} color={tint} size={8} />
      <Pixel x={4} y={6} color={tint} size={8} />
      <Pixel x={5} y={7} color={darkTint} size={6} />
      <Pixel x={6} y={8} color={darkTint} size={4} />
      <Pixel x={7} y={5} color={lightTint} />
    </>,
    <>
      <Pixel x={6} y={3} color={tint} size={4} />
      <Pixel x={5} y={4} color={tint} size={6} />
      <Pixel x={4} y={5} color={darkTint} size={2} />
      <Pixel x={6} y={5} color={tint} size={4} />
      <Pixel x={10} y={5} color={darkTint} size={2} />
      <Pixel x={5} y={6} color={tint} size={6} />
      <Pixel x={6} y={7} color={darkTint} size={4} />
      <Pixel x={7} y={4} color={lightTint} size={2} />
    </>,
    <>
      <Pixel x={7} y={4} color={tint} size={2} />
      <Pixel x={6} y={5} color={tint} size={4} />
      <Pixel x={5} y={6} color={tint} size={6} />
      <Pixel x={4} y={7} color={darkTint} size={8} />
      <Pixel x={5} y={8} color={darkTint} size={6} />
      <Pixel x={7} y={5} color={lightTint} />
    </>,
  ];
  
  return patterns[variant % 5];
}

function BeltIcon({ variant, tint }: { variant: number; tint: string }) {
  const darkTint = adjustColor(tint, -40);
  const lightTint = adjustColor(tint, 30);
  const buckle = '#DAA520';
  const buckleDark = '#B8860B';
  
  const patterns = [
    <>
      <Pixel x={3} y={6} color={darkTint} size={10} />
      <Pixel x={3} y={7} color={tint} size={10} />
      <Pixel x={3} y={8} color={darkTint} size={10} />
      <Pixel x={7} y={5} color={buckleDark} size={2} />
      <Pixel x={6} y={6} color={buckle} size={4} />
      <Pixel x={6} y={7} color={buckle} size={4} />
      <Pixel x={7} y={8} color={buckleDark} size={2} />
      <Pixel x={7} y={7} color={lightTint} />
    </>,
    <>
      <Pixel x={3} y={6} color={tint} size={10} />
      <Pixel x={3} y={7} color={darkTint} size={10} />
      <Pixel x={3} y={8} color={tint} size={10} />
      <Pixel x={6} y={5} color={buckle} size={4} />
      <Pixel x={5} y={6} color={buckleDark} size={6} />
      <Pixel x={6} y={7} color={buckle} size={4} />
      <Pixel x={7} y={6} color={lightTint} size={2} />
    </>,
    <>
      <Pixel x={4} y={6} color={darkTint} size={8} />
      <Pixel x={3} y={7} color={tint} size={10} />
      <Pixel x={4} y={8} color={darkTint} size={8} />
      <Pixel x={8} y={5} color={buckle} size={2} />
      <Pixel x={7} y={6} color={buckle} size={4} />
      <Pixel x={8} y={7} color={buckleDark} size={2} />
      <Pixel x={9} y={6} color={lightTint} />
    </>,
    <>
      <Pixel x={3} y={5} color={tint} size={10} />
      <Pixel x={3} y={6} color={darkTint} size={10} />
      <Pixel x={3} y={7} color={tint} size={10} />
      <Pixel x={3} y={8} color={darkTint} size={10} />
      <Pixel x={6} y={4} color={buckleDark} size={4} />
      <Pixel x={5} y={5} color={buckle} size={6} />
      <Pixel x={6} y={6} color={buckleDark} size={4} />
      <Pixel x={7} y={5} color={lightTint} size={2} />
    </>,
    <>
      <Pixel x={4} y={6} color={tint} size={8} />
      <Pixel x={3} y={7} color={darkTint} size={10} />
      <Pixel x={4} y={8} color={tint} size={8} />
      <Pixel x={5} y={5} color={buckleDark} size={6} />
      <Pixel x={4} y={6} color={buckle} size={8} />
      <Pixel x={5} y={7} color={buckleDark} size={6} />
      <Pixel x={7} y={6} color={lightTint} size={2} />
    </>,
  ];
  
  return patterns[variant % 5];
}

function ShoesIcon({ variant, tint }: { variant: number; tint: string }) {
  const darkTint = adjustColor(tint, -40);
  const lightTint = adjustColor(tint, 30);
  const sole = '#3D2914';
  
  const patterns = [
    <>
      <Pixel x={4} y={5} color={tint} size={3} />
      <Pixel x={9} y={5} color={tint} size={3} />
      <Pixel x={4} y={6} color={tint} size={3} />
      <Pixel x={9} y={6} color={tint} size={3} />
      <Pixel x={4} y={7} color={darkTint} size={3} />
      <Pixel x={9} y={7} color={darkTint} size={3} />
      <Pixel x={3} y={8} color={sole} size={5} />
      <Pixel x={8} y={8} color={sole} size={5} />
      <Pixel x={5} y={5} color={lightTint} />
      <Pixel x={10} y={5} color={lightTint} />
    </>,
    <>
      <Pixel x={5} y={4} color={darkTint} size={2} />
      <Pixel x={9} y={4} color={darkTint} size={2} />
      <Pixel x={4} y={5} color={tint} size={4} />
      <Pixel x={8} y={5} color={tint} size={4} />
      <Pixel x={4} y={6} color={tint} size={4} />
      <Pixel x={8} y={6} color={tint} size={4} />
      <Pixel x={4} y={7} color={darkTint} size={4} />
      <Pixel x={8} y={7} color={darkTint} size={4} />
      <Pixel x={3} y={8} color={sole} size={6} />
      <Pixel x={7} y={8} color={sole} size={6} />
      <Pixel x={5} y={5} color={lightTint} />
      <Pixel x={9} y={5} color={lightTint} />
    </>,
    <>
      <Pixel x={4} y={5} color={darkTint} size={3} />
      <Pixel x={9} y={5} color={darkTint} size={3} />
      <Pixel x={3} y={6} color={tint} size={5} />
      <Pixel x={8} y={6} color={tint} size={5} />
      <Pixel x={4} y={7} color={tint} size={4} />
      <Pixel x={9} y={7} color={tint} size={4} />
      <Pixel x={3} y={8} color={sole} size={6} />
      <Pixel x={8} y={8} color={sole} size={6} />
      <Pixel x={4} y={6} color={lightTint} />
      <Pixel x={9} y={6} color={lightTint} />
    </>,
    <>
      <Pixel x={5} y={3} color={tint} size={2} />
      <Pixel x={9} y={3} color={tint} size={2} />
      <Pixel x={4} y={4} color={tint} size={4} />
      <Pixel x={8} y={4} color={tint} size={4} />
      <Pixel x={4} y={5} color={darkTint} size={4} />
      <Pixel x={8} y={5} color={darkTint} size={4} />
      <Pixel x={4} y={6} color={tint} size={4} />
      <Pixel x={8} y={6} color={tint} size={4} />
      <Pixel x={4} y={7} color={darkTint} size={4} />
      <Pixel x={8} y={7} color={darkTint} size={4} />
      <Pixel x={3} y={8} color={sole} size={6} />
      <Pixel x={7} y={8} color={sole} size={6} />
      <Pixel x={5} y={4} color={lightTint} />
    </>,
    <>
      <Pixel x={4} y={4} color={tint} size={3} />
      <Pixel x={9} y={4} color={tint} size={3} />
      <Pixel x={3} y={5} color={darkTint} size={5} />
      <Pixel x={8} y={5} color={darkTint} size={5} />
      <Pixel x={4} y={6} color={tint} size={4} />
      <Pixel x={9} y={6} color={tint} size={4} />
      <Pixel x={4} y={7} color={darkTint} size={4} />
      <Pixel x={9} y={7} color={darkTint} size={4} />
      <Pixel x={3} y={8} color={sole} size={6} />
      <Pixel x={8} y={8} color={sole} size={6} />
      <Pixel x={5} y={5} color={lightTint} />
    </>,
  ];
  
  return patterns[variant % 5];
}

function EarringIcon({ variant, tint }: { variant: number; tint: string }) {
  const darkTint = adjustColor(tint, -40);
  const lightTint = adjustColor(tint, 30);
  const gem = '#87CEEB';
  const gemDark = '#4682B4';
  
  const patterns = [
    <>
      <Pixel x={7} y={3} color={tint} size={2} />
      <Pixel x={6} y={4} color={darkTint} />
      <Pixel x={9} y={4} color={darkTint} />
      <Pixel x={5} y={5} color={tint} />
      <Pixel x={10} y={5} color={tint} />
      <Pixel x={5} y={6} color={tint} />
      <Pixel x={10} y={6} color={tint} />
      <Pixel x={6} y={7} color={darkTint} />
      <Pixel x={9} y={7} color={darkTint} />
      <Pixel x={7} y={8} color={darkTint} size={2} />
      <Pixel x={7} y={5} color={gem} size={2} />
      <Pixel x={7} y={6} color={gemDark} size={2} />
      <Pixel x={7} y={4} color={lightTint} />
    </>,
    <>
      <Pixel x={6} y={3} color={darkTint} size={4} />
      <Pixel x={5} y={4} color={tint} size={6} />
      <Pixel x={5} y={5} color={tint} size={6} />
      <Pixel x={6} y={6} color={darkTint} size={4} />
      <Pixel x={7} y={7} color={darkTint} size={2} />
      <Pixel x={7} y={4} color={gem} size={2} />
      <Pixel x={7} y={5} color={gemDark} size={2} />
      <Pixel x={7} y={3} color={lightTint} />
    </>,
    <>
      <Pixel x={7} y={2} color={tint} size={2} />
      <Pixel x={6} y={3} color={tint} size={4} />
      <Pixel x={5} y={4} color={darkTint} size={6} />
      <Pixel x={6} y={5} color={tint} size={4} />
      <Pixel x={7} y={6} color={darkTint} size={2} />
      <Pixel x={7} y={3} color={gem} size={2} />
      <Pixel x={7} y={4} color={gemDark} size={2} />
      <Pixel x={8} y={3} color={lightTint} />
    </>,
    <>
      <Pixel x={7} y={4} color={tint} size={2} />
      <Pixel x={6} y={5} color={darkTint} size={4} />
      <Pixel x={5} y={6} color={tint} size={6} />
      <Pixel x={6} y={7} color={darkTint} size={4} />
      <Pixel x={7} y={8} color={darkTint} size={2} />
      <Pixel x={7} y={6} color={gem} size={2} />
      <Pixel x={7} y={5} color={lightTint} />
    </>,
    <>
      <Pixel x={5} y={3} color={tint} size={6} />
      <Pixel x={4} y={4} color={tint} size={8} />
      <Pixel x={5} y={5} color={darkTint} size={6} />
      <Pixel x={6} y={6} color={darkTint} size={4} />
      <Pixel x={7} y={7} color={darkTint} size={2} />
      <Pixel x={7} y={4} color={gem} size={2} />
      <Pixel x={8} y={3} color={lightTint} />
    </>,
  ];
  
  return patterns[variant % 5];
}

function RingIcon({ variant, tint }: { variant: number; tint: string }) {
  const darkTint = adjustColor(tint, -40);
  const lightTint = adjustColor(tint, 30);
  const gem = '#FFD700';
  const gemDark = '#B8860B';
  
  const patterns = [
    <>
      <Pixel x={5} y={6} color={darkTint} size={6} />
      <Pixel x={4} y={7} color={tint} size={8} />
      <Pixel x={5} y={8} color={darkTint} size={6} />
      <Pixel x={6} y={4} color={gemDark} size={4} />
      <Pixel x={5} y={5} color={gem} size={6} />
      <Pixel x={7} y={5} color={lightTint} size={2} />
      <Pixel x={7} y={7} color={lightTint} />
    </>,
    <>
      <Pixel x={6} y={5} color={darkTint} size={4} />
      <Pixel x={5} y={6} color={tint} size={6} />
      <Pixel x={4} y={7} color={tint} size={8} />
      <Pixel x={5} y={8} color={darkTint} size={6} />
      <Pixel x={7} y={3} color={gem} size={2} />
      <Pixel x={6} y={4} color={gem} size={4} />
      <Pixel x={7} y={5} color={gemDark} size={2} />
      <Pixel x={7} y={4} color={lightTint} />
    </>,
    <>
      <Pixel x={4} y={6} color={tint} size={8} />
      <Pixel x={4} y={7} color={darkTint} size={8} />
      <Pixel x={5} y={8} color={tint} size={6} />
      <Pixel x={7} y={4} color={gem} size={2} />
      <Pixel x={6} y={5} color={gemDark} size={4} />
      <Pixel x={7} y={6} color={gem} size={2} />
      <Pixel x={5} y={7} color={lightTint} />
    </>,
    <>
      <Pixel x={5} y={5} color={darkTint} size={6} />
      <Pixel x={4} y={6} color={tint} size={8} />
      <Pixel x={5} y={7} color={tint} size={6} />
      <Pixel x={6} y={8} color={darkTint} size={4} />
      <Pixel x={6} y={3} color={gemDark} size={4} />
      <Pixel x={5} y={4} color={gem} size={6} />
      <Pixel x={7} y={5} color={lightTint} />
      <Pixel x={8} y={6} color={lightTint} />
    </>,
    <>
      <Pixel x={6} y={6} color={tint} size={4} />
      <Pixel x={5} y={7} color={darkTint} size={6} />
      <Pixel x={6} y={8} color={tint} size={4} />
      <Pixel x={7} y={4} color={gemDark} size={2} />
      <Pixel x={6} y={5} color={gem} size={4} />
      <Pixel x={7} y={6} color={gem} size={2} />
      <Pixel x={7} y={5} color={lightTint} />
    </>,
  ];
  
  return patterns[variant % 5];
}

function NecklaceIcon({ variant, tint }: { variant: number; tint: string }) {
  const darkTint = adjustColor(tint, -40);
  const lightTint = adjustColor(tint, 30);
  const gem = '#DC143C';
  const gemDark = '#8B0000';
  
  const patterns = [
    <>
      <Pixel x={5} y={2} color={tint} />
      <Pixel x={10} y={2} color={tint} />
      <Pixel x={4} y={3} color={tint} />
      <Pixel x={11} y={3} color={tint} />
      <Pixel x={4} y={4} color={darkTint} />
      <Pixel x={11} y={4} color={darkTint} />
      <Pixel x={5} y={5} color={tint} />
      <Pixel x={10} y={5} color={tint} />
      <Pixel x={6} y={6} color={darkTint} />
      <Pixel x={9} y={6} color={darkTint} />
      <Pixel x={7} y={7} color={gemDark} size={2} />
      <Pixel x={6} y={8} color={gem} size={4} />
      <Pixel x={7} y={9} color={gemDark} size={2} />
      <Pixel x={6} y={3} color={lightTint} />
    </>,
    <>
      <Pixel x={6} y={2} color={darkTint} size={4} />
      <Pixel x={5} y={3} color={tint} size={6} />
      <Pixel x={4} y={4} color={tint} size={8} />
      <Pixel x={5} y={5} color={darkTint} size={6} />
      <Pixel x={6} y={6} color={tint} size={4} />
      <Pixel x={7} y={7} color={gem} size={2} />
      <Pixel x={6} y={8} color={gemDark} size={4} />
      <Pixel x={7} y={9} color={gem} size={2} />
      <Pixel x={7} y={3} color={lightTint} size={2} />
    </>,
    <>
      <Pixel x={7} y={1} color={tint} size={2} />
      <Pixel x={6} y={2} color={tint} size={4} />
      <Pixel x={5} y={3} color={darkTint} size={6} />
      <Pixel x={6} y={4} color={tint} size={4} />
      <Pixel x={7} y={5} color={darkTint} size={2} />
      <Pixel x={6} y={6} color={gem} size={4} />
      <Pixel x={5} y={7} color={gemDark} size={6} />
      <Pixel x={6} y={8} color={gem} size={4} />
      <Pixel x={7} y={9} color={gemDark} size={2} />
      <Pixel x={7} y={2} color={lightTint} />
    </>,
    <>
      <Pixel x={5} y={3} color={tint} size={6} />
      <Pixel x={4} y={4} color={darkTint} size={8} />
      <Pixel x={5} y={5} color={tint} size={6} />
      <Pixel x={6} y={6} color={darkTint} size={4} />
      <Pixel x={7} y={7} color={gem} size={2} />
      <Pixel x={6} y={8} color={gemDark} size={4} />
      <Pixel x={7} y={9} color={gem} size={2} />
      <Pixel x={7} y={4} color={lightTint} size={2} />
    </>,
    <>
      <Pixel x={6} y={2} color={tint} size={4} />
      <Pixel x={5} y={3} color={darkTint} size={6} />
      <Pixel x={4} y={4} color={tint} size={8} />
      <Pixel x={5} y={5} color={tint} size={6} />
      <Pixel x={6} y={6} color={darkTint} size={4} />
      <Pixel x={7} y={7} color={gemDark} size={2} />
      <Pixel x={6} y={8} color={gem} size={4} />
      <Pixel x={7} y={3} color={lightTint} />
    </>,
  ];
  
  return patterns[variant % 5];
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function EquipmentIcon({ slot, rarity, variant, size = 32 }: EquipmentIconProps) {
  const tint = RARITY_TINTS[rarity];
  const glowColor = RARITY_GLOW[rarity];
  const isHighTier = rarity === 'legendary' || rarity === 'epic' || rarity === 'mythic';
  const isMythic = rarity === 'mythic';
  const filterId = `glow-${rarity}-${slot}-${variant}`;
  const sparkleId = `sparkle-${slot}-${variant}`;

  const renderIcon = () => {
    switch (slot) {
      case 'weapon': return <WeaponIcon variant={variant} tint={tint} />;
      case 'armor': return <ArmorIcon variant={variant} tint={tint} />;
      case 'pants': return <PantsIcon variant={variant} tint={tint} />;
      case 'shoulder': return <ShoulderIcon variant={variant} tint={tint} />;
      case 'belt': return <BeltIcon variant={variant} tint={tint} />;
      case 'shoes': return <ShoesIcon variant={variant} tint={tint} />;
      case 'earring': return <EarringIcon variant={variant} tint={tint} />;
      case 'ring': return <RingIcon variant={variant} tint={tint} />;
      case 'necklace': return <NecklaceIcon variant={variant} tint={tint} />;
      default: return null;
    }
  };

  // 四角星路径（银蓝色）：cx,cy 中心；rx,ry 水平/垂直半径
  const star = (cx: number, cy: number, rx: number, ry: number) => {
    const qx = rx * 0.28;
    const qy = ry * 0.28;
    return `M${cx},${cy - ry} L${cx + qx},${cy - qy} L${cx + rx},${cy} L${cx + qx},${cy + qy} L${cx},${cy + ry} L${cx - qx},${cy + qy} L${cx - rx},${cy} L${cx - qx},${cy - qy} Z`;
  };

  return (
    <>
      {isHighTier && (
        <style>{`
          @keyframes eq-glow-pulse-${filterId.replace(/[^a-zA-Z0-9-]/g, '')} {
            0%, 100% { filter: drop-shadow(0 0 2px ${glowColor}cc) drop-shadow(0 0 4px ${glowColor}66); }
            50% { filter: drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 8px ${glowColor}aa); }
          }
        `}</style>
      )}
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
          animation: isHighTier ? `eq-glow-pulse-${filterId.replace(/[^a-zA-Z0-9-]/g, '')} 1.8s ease-in-out infinite` : undefined,
        }}
      >
        {renderIcon()}
        {isHighTier && (
          <>
            {/* 科技感装饰：四角光点 */}
            <rect x={0} y={0} width={1} height={1} fill={glowColor} opacity={0.9} />
            <rect x={15} y={0} width={1} height={1} fill={glowColor} opacity={0.9} />
            <rect x={0} y={15} width={1} height={1} fill={glowColor} opacity={0.9} />
            <rect x={15} y={15} width={1} height={1} fill={glowColor} opacity={0.9} />
          </>
        )}
        {isMythic && (
          <>
            {/* 神话专属：三颗银蓝色四角星环绕图标 — 双层path模拟发光（无filter，性能好） */}
            {/* 左上：偏长（纵向更长）— 左上边距 +5px（左边距再 -1px） */}
            <path d={star(3, 4, 2.2, 4.2)} fill="rgba(90, 156, 232, 0.25)" />
            <path
              d={star(3, 4, 1.3, 2.8)}
              fill="#5A9CE8"
              className="mythic-star mythic-star-1"
            />
            {/* 左下：宽高一致 — 左边距 +5px（再 +2px）、下边距 +3px */}
            <path d={star(6, 14, 3.0, 3.0)} fill="rgba(90, 156, 232, 0.25)" />
            <path
              d={star(6, 14, 1.9, 1.9)}
              fill="#5A9CE8"
              className="mythic-star mythic-star-2"
            />
            {/* 右侧：偏大 — 右边距 +4px */}
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
