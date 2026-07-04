import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { RARITY_COLORS, ITEMS, getItemDef } from '../game/data/equipment';
import { EquipmentIcon } from './EquipmentIcon';
import type { ShopItem, EquipRarity } from '../game/types/game';

const neonCyan = '#00F5D4';
const neonPurple = '#B026FF';
const neonPink = '#FF0080';
const neonYellow = '#FFE600';

const rarityNames: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

interface EngineRef {
  current: {
    buyShopItem: (itemId: string) => boolean;
    refreshShop: () => boolean;
    getShopItems: () => ShopItem[];
    closeShop: () => void;
  } | null;
}

interface ShopPanelProps {
  engineRef: EngineRef;
  isOpen: boolean;
  onClose: () => void;
}

export function ShopPanel({ engineRef, isOpen, onClose }: ShopPanelProps) {
  const { player } = useGameStore();
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);

  useEffect(() => {
    if (isOpen && engineRef.current) {
      setShopItems([...engineRef.current.getShopItems()]);
    }
  }, [isOpen, engineRef]);

  if (!isOpen) return null;

  const handleBuy = (itemId: string) => {
    if (engineRef.current) {
      const success = engineRef.current.buyShopItem(itemId);
      if (success) {
        setShopItems([...engineRef.current.getShopItems()]);
      }
    }
  };

  const handleRefresh = () => {
    if (engineRef.current) {
      const success = engineRef.current.refreshShop();
      if (success) {
        setShopItems([...engineRef.current.getShopItems()]);
      }
    }
  };

  const neonText = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 600,
    letterSpacing: '0.5px',
  } as React.CSSProperties;

  const itemSlotStyle = (rarity?: string) => {
    const r = (rarity || 'common') as EquipRarity;
    const borderColor = RARITY_COLORS[r] || RARITY_COLORS.common;
    // 传说/史诗/神话使用渐变背景，与边框颜色区分
    const rarityGradient: Record<string, string> = {
      legendary: 'radial-gradient(circle at 50% 40%, #7A3A1A 0%, #3D1A08 60%, #1F0E04 100%)',
      epic: 'radial-gradient(circle at 50% 40%, #4A2A7A 0%, #1E0E3D 60%, #0E0620 100%)',
      mythic: 'radial-gradient(circle at 50% 40%, #7A1A2A 0%, #3D0A12 60%, #1F0508 100%)',
    };

    return {
      background: rarityGradient[r] || 'rgba(19, 16, 37, 0.6)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: '10px',
      boxShadow: `0 0 12px ${borderColor}30, inset 0 1px 0 rgba(255,255,255,0.05)`,
      backdropFilter: 'blur(4px)',
    };
  };

  const renderItem = (item: ShopItem) => {
    if (item.type === 'refill') {
      return (
        <div className="flex flex-col items-center">
          <span className="text-2xl mb-1" style={{ filter: 'drop-shadow(0 0 8px #FF2D5560)' }}>❤️</span>
          <span style={{ ...neonText, fontSize: '9px', color: '#FF2D55', fontWeight: 700 }}>
            完全恢复
          </span>
          <span className="mt-0.5" style={{ ...neonText, fontSize: '7px', color: '#B0A8C8' }}>
            恢复全部生命值
          </span>
        </div>
      );
    }

    if (item.type === 'item' && item.itemId) {
      const itemDef = getItemDef(item.itemId);
      return (
        <div className="flex flex-col items-center">
          <span className="text-2xl mb-1" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.3))' }}>
            {itemDef?.icon || '📦'}
          </span>
          <span style={{ ...neonText, fontSize: '9px', color: neonCyan, fontWeight: 700 }}>
            {itemDef?.name || item.itemId}
          </span>
          <span className="mt-0.5" style={{ ...neonText, fontSize: '7px', color: '#B0A8C8' }}>
            {itemDef?.description || ''}
          </span>
        </div>
      );
    }

    if (item.type === 'equipment' && item.equipment) {
      const equip = item.equipment;
      const rarityColor = RARITY_COLORS[equip.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF';
      return (
        <div className="flex flex-col items-center">
          <div
            className="w-10 h-10 flex items-center justify-center mb-1"
            style={itemSlotStyle(equip.rarity)}
          >
            <EquipmentIcon slot={equip.slot} rarity={equip.rarity} variant={equip.iconVariant} size={28} />
          </div>
          <span
            style={{
              ...neonText,
              fontSize: '8px',
              fontWeight: 700,
              color: rarityColor,
              textShadow: `0 0 6px ${rarityColor}50`,
            }}
          >
            {equip.name}
          </span>
          <span className="mt-0.5" style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>
            {rarityNames[equip.rarity] || '普通'} · Lv.{equip.level}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] p-4"
        style={{
          width: '340px',
          background: 'rgba(19, 16, 37, 0.95)',
          border: '1px solid rgba(176, 38, 255, 0.4)',
          borderRadius: '16px',
          boxShadow: `0 0 40px ${neonPurple}30, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pr-6">
          <h2
            className="text-xl"
            style={{
              ...neonText,
              fontSize: '14px',
              fontWeight: 700,
              color: neonYellow,
              letterSpacing: '1px',
              textShadow: `0 0 8px ${neonYellow}60`,
            }}
          >
            ⚡ 商 店
          </h2>
          <div
            style={{
              ...neonText,
              fontSize: '10px',
              fontWeight: 700,
              color: neonYellow,
              textShadow: `0 0 6px ${neonYellow}50`,
            }}
          >
            💰 {player?.gold?.toLocaleString() || 0}
          </div>
        </div>

        <button
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center cursor-pointer"
          style={{
            background: 'rgba(255, 45, 85, 0.15)',
            border: '1px solid rgba(255, 45, 85, 0.4)',
            borderRadius: '8px',
            ...neonText,
            fontSize: '12px',
            fontWeight: 700,
            color: '#FF2D55',
            boxShadow: '0 0 8px rgba(255, 45, 85, 0.2)',
          }}
          onClick={onClose}
        >
          ×
        </button>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {shopItems.map((item) => {
            const canAfford = (player?.gold || 0) >= item.price;
            const isEquipment = item.type === 'equipment' && item.equipment;
            const itemRarity = isEquipment ? item.equipment!.rarity : 'common';
            const borderColor = isEquipment
              ? RARITY_COLORS[itemRarity as keyof typeof RARITY_COLORS]
              : item.type === 'refill'
                ? '#FF2D55'
                : neonCyan;

            return (
              <div
                key={item.id}
                className={`p-2 flex flex-col items-center ${
                  item.sold || !canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } transition-all`}
                style={{
                  background: 'rgba(19, 16, 37, 0.7)',
                  border: `1px solid ${item.sold ? 'rgba(100,100,130,0.2)' : canAfford ? `${borderColor}50` : 'rgba(100,100,130,0.2)'}`,
                  borderRadius: '10px',
                  boxShadow: item.sold || !canAfford
                    ? 'none'
                    : `0 0 12px ${borderColor}20, inset 0 1px 0 rgba(255,255,255,0.05)`,
                  backdropFilter: 'blur(6px)',
                  transform: item.sold || !canAfford ? 'none' : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!item.sold && canAfford) {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = `0 0 20px ${borderColor}40`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.sold && canAfford) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = `0 0 12px ${borderColor}20, inset 0 1px 0 rgba(255,255,255,0.05)`;
                  }
                }}
                onClick={() => !item.sold && canAfford && handleBuy(item.id)}
              >
                {renderItem(item)}
                <div className="mt-2">
                  {item.sold ? (
                    <span style={{ ...neonText, fontSize: '10px', color: '#5A5A7A', fontWeight: 600 }}>
                      已售
                    </span>
                  ) : (
                    <span
                      style={{
                        ...neonText,
                        fontSize: '11px',
                        fontWeight: 700,
                        color: canAfford ? neonYellow : '#FF4444',
                        textShadow: canAfford ? `0 0 6px ${neonYellow}50` : 'none',
                      }}
                    >
                      💰 {item.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            className="px-4 py-2 cursor-pointer transition-all"
            style={{
              background: 'rgba(0, 245, 212, 0.15)',
              border: `1px solid ${neonCyan}50`,
              borderRadius: '8px',
              ...neonText,
              fontSize: '9px',
              fontWeight: 700,
              color: neonCyan,
              letterSpacing: '0.5px',
              boxShadow: `0 0 10px ${neonCyan}20`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 245, 212, 0.25)';
              e.currentTarget.style.boxShadow = `0 0 16px ${neonCyan}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 245, 212, 0.15)';
              e.currentTarget.style.boxShadow = `0 0 10px ${neonCyan}20`;
            }}
            onClick={handleRefresh}
          >
            ⟳ 刷新 (💰{50 + (player?.level || 1) * 5})
          </button>
        </div>
      </div>
    </div>
  );
}
