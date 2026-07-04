import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RARITY_COLORS, RARITY_BG, RARITY_BG_DARK } from '../game/data/equipment';
import { EquipmentIcon } from './EquipmentIcon';
import type { Equipment, EquipRarity } from '../game/types/game';

const rarityColors: Record<string, string> = {
  common: 'border-[#9A9A9A]',
  advanced: 'border-[#5BA3E0]',
  fine: 'border-[#B060E0]',
  legendary: 'border-[#E08030]',
  epic: 'border-[#E0C040]',
  mythic: 'border-[#E03030]',
};

const rarityBg: Record<string, string> = {
  common: 'bg-[#D4C8B0]',
  advanced: 'bg-[#A8C8E0]',
  fine: 'bg-[#C8A0E0]',
  // 传说/史诗/神话：改用深色底，通过 style 设置渐变背景
  legendary: '',
  epic: '',
  mythic: '',
};

// 高品级装备的渐变背景（中心亮色+边缘暗色，与边框区分明显）
const rarityGradient: Record<string, string> = {
  // 传说：暖棕红中心→深棕边缘，衬托橙色边框
  legendary: 'radial-gradient(circle at 50% 40%, #7A3A1A 0%, #3D1A08 60%, #1F0E04 100%)',
  // 史诗：深紫中心→暗紫边缘，衬托金色边框
  epic: 'radial-gradient(circle at 50% 40%, #4A2A7A 0%, #1E0E3D 60%, #0E0620 100%)',
  // 神话：深红中心→暗红边缘，衬托红色边框
  mythic: 'radial-gradient(circle at 50% 40%, #7A1A2A 0%, #3D0A12 60%, #1F0508 100%)',
};

const rarityText: Record<string, string> = {
  common: 'text-[#6A6A6A]',
  advanced: 'text-[#4080C0]',
  fine: 'text-[#9040C0]',
  legendary: 'text-[#C06020]',
  epic: 'text-[#C0A020]',
  mythic: 'text-[#C02020]',
};

const slotLabels: Record<string, string> = {
  weapon: 'WEAPON',
  armor: 'ARMOR',
  accessory: 'ACC',
};

export function EquipmentBar() {
  const { equipment } = useGameStore();
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const slots = ['weapon', 'armor', 'accessory'];

  const getEquipForSlot = (slot: string): Equipment | undefined => {
    return equipment.find(e => e.slot === slot);
  };

  return (
    <div className="bg-[#654321] border-2 border-[#3D2914]" style={{ boxShadow: '4px 4px 0 #3D2914' }}>
      <div className="p-3 border-b-2 border-[#3D2914] bg-[#5D4037]">
        <h3 className="text-[#FFD700] font-bold text-xs flex items-center gap-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          <span>⚔️</span>
          <span>EQUIP</span>
        </h3>
      </div>
      <div className="p-3 flex gap-3">
        {slots.map((slot, index) => {
          const equip = getEquipForSlot(slot);
          return (
            <div
              key={slot}
              className="relative"
              onMouseEnter={() => setHoveredSlot(index)}
              onMouseLeave={() => setHoveredSlot(null)}
            >
              <div
                className={`w-14 h-14 border-2 flex items-center justify-center ${
                  equip ? rarityColors[equip.rarity] : 'border-[#6A6050]'
                } ${equip ? rarityBg[equip.rarity] : 'bg-[#4A3F30]'}`}
                style={{
                  // 传说/史诗/神话使用渐变背景，其他用纯色
                  background: equip ? rarityGradient[equip.rarity] || undefined : undefined,
                  boxShadow: equip
                    ? `inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3), 2px 2px 0 #3D2914`
                    : 'inset 2px 2px 0 rgba(0,0,0,0.2), inset -2px -2px 0 rgba(255,255,255,0.1), 2px 2px 0 #3D2914',
                }}
              >
                {equip ? (
                  <EquipmentIcon slot={equip.slot} rarity={equip.rarity} variant={equip.iconVariant} size={36} />
                ) : (
                  <span className="text-[#7D6D5D] text-xs" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '6px' }}>
                    {slotLabels[slot]}
                  </span>
                )}
              </div>
              <div className="text-center mt-1 text-xs text-[#DEB887]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '6px' }}>
                {slotLabels[slot]}
              </div>

              {hoveredSlot === index && equip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-[#3D2914] border-2 border-[#1a1a1a] z-50" style={{ boxShadow: '3px 3px 0 #1a1a1a' }}>
                  <div className={`p-2 border-b border-[#5D4037] ${rarityText[equip.rarity]} font-bold text-xs`} style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                    {equip.name}
                  </div>
                  <div className="p-2 text-xs text-[#DEB887] text-center" style={{ fontFamily: '"VT323", monospace' }}>
                    {equip.description}
                  </div>
                  <div className="p-2 space-y-1">
                    {equip.attack && (
                      <div className="text-xs text-[#FF6B6B]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '6px' }}>
                        ATK +{equip.attack}
                      </div>
                    )}
                    {equip.attackSpeed && (
                      <div className="text-xs text-[#87CEEB]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '6px' }}>
                        SPD {equip.attackSpeed > 0 ? '+' : ''}{equip.attackSpeed}ms
                      </div>
                    )}
                    {equip.range && (
                      <div className="text-xs text-[#32CD32]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '6px' }}>
                        RNG +{equip.range}
                      </div>
                    )}
                    {equip.health && (
                      <div className="text-xs text-[#DC143C]" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '6px' }}>
                        HP +{equip.health}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
