import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { ITEMS, RARITY_COLORS, RARITY_BG, RARITY_BG_DARK, RARITY_LABELS, getItemDef } from '../game/data/equipment';
import type { ItemStack, ItemRarity, EquipRarity } from '../game/types/game';

const neonCyan = '#00F5D4';
const neonPurple = '#B026FF';
const neonPink = '#FF0080';
const neonYellow = '#FFE600';

interface GameEngineRef {
  current: {
    useItem: (itemId: string) => boolean;
    removeFromInventory: (index: number) => void;
    batchSellItems: (itemIds: string[]) => number;
    getItemCooldowns?: () => { key: string; remaining: number; duration: number; icon: string; name: string; itemId: string }[];
  } | null;
}

interface InventoryPanelProps {
  engineRef: GameEngineRef;
}

interface SelectedItem {
  index: number;
  stack: ItemStack;
  source: 'inventory' | 'hotbar';
}

const RARITY_ORDER: Record<string, number> = {
  mythic: 6,
  epic: 5,
  legendary: 4,
  fine: 3,
  advanced: 2,
  common: 1,
};

const raritySellMap: Record<string, number> = {
  common: 10,
  advanced: 25,
  fine: 50,
  legendary: 100,
  epic: 200,
  mythic: 500,
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const itemSlotStyle = (rarity?: string) => {
  const r = (rarity || 'common') as ItemRarity;
  const baseColor = RARITY_COLORS[r] || RARITY_COLORS.common;
  const borderAlpha: Record<string, number> = {
    common: 0.3, advanced: 0.4, fine: 0.5,
    legendary: 0.55, epic: 0.6, mythic: 0.65,
  };
  const glowBlur: Record<string, number> = {
    common: 0, advanced: 6, fine: 8,
    legendary: 10, epic: 12, mythic: 14,
  };
  const glowAlpha: Record<string, number> = {
    common: 0, advanced: 0.2, fine: 0.25,
    legendary: 0.3, epic: 0.35, mythic: 0.4,
  };
  const rarityGradient: Record<string, string> = {
    common: 'radial-gradient(circle at 50% 45%, #2A2540 0%, #1E1A35 55%, #15122A 100%)',
    advanced: 'radial-gradient(circle at 50% 45%, #253050 0%, #1A2540 55%, #101830 100%)',
    fine: 'radial-gradient(circle at 50% 45%, #3A2855 0%, #2A1C45 55%, #1E1035 100%)',
    legendary: 'radial-gradient(circle at 50% 40%, #8A4A2A 0%, #5A2A10 60%, #3A1A08 100%)',
    epic: 'radial-gradient(circle at 50% 40%, #7A6A20 0%, #4D4010 60%, #2F2808 100%)',
    mythic: 'radial-gradient(circle at 50% 40%, #8A2A3A 0%, #5A1A20 60%, #3A0A10 100%)',
  };
  const blur = glowBlur[r] || 0;
  const glow = blur > 0 ? `0 0 ${blur}px ${hexToRgba(baseColor, glowAlpha[r] || 0)}` : 'none';
  return {
    background: rarityGradient[r] || 'rgba(19, 16, 37, 0.6)',
    border: `2.5px solid ${hexToRgba(baseColor, borderAlpha[r] || 0.3)}`,
    borderRadius: '8px',
    boxShadow: glow,
  };
};

const emptySlotStyle = {
  background: 'rgba(19, 16, 37, 0.2)',
  border: '2.5px dashed rgba(100, 100, 130, 0.15)',
  borderRadius: '8px',
  opacity: 0.6,
};

const cardStyle = {
  background: 'rgba(19, 16, 37, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(176, 38, 255, 0.25)',
  borderRadius: '12px',
  boxShadow: '0 0 20px rgba(176, 38, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
};

export function InventoryPanel({ engineRef }: InventoryPanelProps) {
  const inventory = useGameStore(s => s.inventory);
  const potionHotbar = useGameStore(s => s.potionHotbar);
  const setPotionHotbar = useGameStore(s => s.setPotionHotbar);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [sortedInventory, setSortedInventory] = useState<ItemStack[] | null>(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [showSellPicker, setShowSellPicker] = useState(false);
  const [hotbarToast, setHotbarToast] = useState<string | null>(null);
  // 物品页签：消耗 / 材料 / 任务材料（按 ItemDef.type 过滤）
  const [inventoryTab, setInventoryTab] = useState<'consumable' | 'material' | 'quest'>('consumable');
  const [itemCooldowns, setItemCooldowns] = useState<Record<string, { remaining: number; duration: number }>>({});
  const [sellQualities, setSellQualities] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('batchSellItemQualities');
      if (saved) return new Set(JSON.parse(saved) as string[]);
    } catch {}
    return new Set<string>(['common', 'advanced']);
  });

  useEffect(() => {
    try {
      localStorage.setItem('batchSellItemQualities', JSON.stringify(Array.from(sellQualities)));
    } catch {}
  }, [sellQualities]);

  const prevCooldownsRef = useRef<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef.current?.getItemCooldowns) {
        const cds = engineRef.current.getItemCooldowns();
        // 无冷却时跳过更新
        if (cds.length === 0) {
          if (prevCooldownsRef.current !== '') {
            prevCooldownsRef.current = '';
            setItemCooldowns({});
          }
          return;
        }
        const map: Record<string, { remaining: number; duration: number }> = {};
        for (const cd of cds) {
          map[cd.key] = { remaining: cd.remaining, duration: cd.duration };
        }
        // 内容签名对比，避免无变化时触发重渲染
        const sig = JSON.stringify(map);
        if (sig !== prevCooldownsRef.current) {
          prevCooldownsRef.current = sig;
          setItemCooldowns(map);
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [engineRef]);

  const displaySlots = 200;
  // 按当前页签过滤物品（消耗=consumable，材料=material，任务材料=quest）
  // 注：当前 ITEMS 数据全部为 consumable，材料/任务材料页签为空，预留扩展
  const tabFilteredInventory = useMemo(() => {
    if (inventoryTab === 'consumable') return inventory;
    if (inventoryTab === 'material') {
      return inventory.filter(s => getItemDef(s.itemId)?.type === 'material');
    }
    // quest：暂用 'enhancement' 类型占位（任务材料系统未实现）
    return inventory.filter(s => getItemDef(s.itemId)?.type === 'enhancement');
  }, [inventory, inventoryTab]);
  const displayInventory = sortedInventory ?? tabFilteredInventory;
  const displayedItems = displayInventory.slice(0, displaySlots);

  const neonText = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 600,
    letterSpacing: '0.5px',
  };

  const handleItemClick = (index: number) => {
    const stack = displayInventory[index];
    if (stack) {
      const realIndex = inventory.indexOf(stack);
      setSelectedItem({ index: realIndex, stack, source: 'inventory' });
    }
  };

  const handleHotbarClick = (index: number) => {
    const stack = potionHotbar[index];
    if (stack) {
      setSelectedItem({ index, stack, source: 'hotbar' });
    }
  };

  // 设置快捷栏：找到第一个空位放入药水；满 4 格提示
  const handleSetToHotbar = () => {
    if (!selectedItem || selectedItem.source !== 'inventory') return;
    const itemDef = getItemDef(selectedItem.stack.itemId);
    if (!itemDef || itemDef.type !== 'consumable') return;
    const emptyIdx = potionHotbar.findIndex(s => s === null);
    if (emptyIdx === -1) {
      setHotbarToast('快捷栏已满');
      setTimeout(() => setHotbarToast(null), 1500);
      return;
    }
    const next = [...potionHotbar];
    next[emptyIdx] = { itemId: selectedItem.stack.itemId, count: selectedItem.stack.count };
    setPotionHotbar(next);
    setHotbarToast('已设置到快捷栏');
    setTimeout(() => setHotbarToast(null), 1200);
    setSelectedItem(null);
  };

  // 取出快捷栏：清空对应格子（物品仍在物品栏中）
  const handleRemoveFromHotbar = () => {
    if (!selectedItem || selectedItem.source !== 'hotbar') return;
    const next = [...potionHotbar];
    next[selectedItem.index] = null;
    setPotionHotbar(next);
    setSelectedItem(null);
  };

  // 点击快捷栏格子直接使用药水
  const handleHotbarUse = (index: number) => {
    const stack = potionHotbar[index];
    if (!stack || !engineRef.current) return;
    const itemDef = getItemDef(stack.itemId);
    if (!itemDef || itemDef.type !== 'consumable') return;
    engineRef.current.useItem(stack.itemId);
  };

  const handleUseItem = () => {
    if (selectedItem && engineRef.current) {
      const itemDef = getItemDef(selectedItem.stack.itemId);
      if (itemDef?.type === 'consumable') {
        engineRef.current.useItem(selectedItem.stack.itemId);
        setSortedInventory(null);
        setSelectedItem(null);
      }
    }
  };

  const handleDropItem = () => {
    if (selectedItem && engineRef.current) {
      engineRef.current.removeFromInventory(selectedItem.index);
      setSortedInventory(null);
      setSelectedItem(null);
    }
  };

  const handleSort = useCallback(() => {
    const sorted = [...inventory].sort((a, b) => {
      const ra = RARITY_ORDER[getItemDef(a.itemId)?.rarity || 'common'] || 0;
      const rb = RARITY_ORDER[getItemDef(b.itemId)?.rarity || 'common'] || 0;
      return sortDesc ? rb - ra : ra - rb;
    });
    setSortedInventory(sorted);
    setSortDesc(!sortDesc);
  }, [inventory, sortDesc]);

  const toggleSellQuality = useCallback((q: string) => {
    setSellQualities(prev => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q);
      else next.add(q);
      return next;
    });
  }, []);

  const sellPreview = useMemo(() => {
    const selected = Array.from(sellQualities);
    const toSell = inventory.filter(stack => {
      const itemDef = getItemDef(stack.itemId);
      return itemDef && selected.includes(itemDef.rarity);
    });
    const totalGold = toSell.reduce((sum, stack) => {
      const itemDef = getItemDef(stack.itemId);
      return sum + (raritySellMap[itemDef?.rarity || 'common'] || 0) * stack.count;
    }, 0);
    return { count: toSell.reduce((s, st) => s + st.count, 0), gold: totalGold };
  }, [inventory, sellQualities]);

  const handleBatchSell = useCallback(() => {
    if (!engineRef.current) return;
    const selected = Array.from(sellQualities);
    const toSellIds = inventory
      .filter(stack => {
        const itemDef = getItemDef(stack.itemId);
        return itemDef && selected.includes(itemDef.rarity);
      })
      .map(stack => stack.itemId);
    if (toSellIds.length > 0) {
      engineRef.current.batchSellItems(toSellIds);
      setSortedInventory(null);
    }
    setShowSellPicker(false);
  }, [inventory, sellQualities, engineRef]);

  const getEffectDescription = (itemDef: any): string => {
    switch (itemDef.effect) {
      case 'heal': return `恢复 ${itemDef.value}% 生命值`;
      case 'regen': return `${itemDef.duration / 1000}秒内每秒恢复 ${itemDef.value}% 生命`;
      case 'attack_boost': return `${itemDef.duration / 1000}秒内攻击力 +${itemDef.value}%`;
      case 'speed_boost': return `${itemDef.duration / 1000}秒内攻速 +${itemDef.value}%`;
      case 'bomb': return `对所有敌人造成 ${itemDef.value} 伤害`;
      case 'magnet': return `${itemDef.duration / 1000}秒内自动拾取掉落物`;
      case 'poison': return `敌人中毒 ${itemDef.duration / 1000}秒，每秒 ${itemDef.value} 伤害`;
      case 'freeze': return `冻结敌人 ${itemDef.duration / 1000}秒`;
      case 'burn': return `敌人燃烧 ${itemDef.duration / 1000}秒，每秒 ${itemDef.value} 伤害`;
      case 'invincible': return `${itemDef.duration / 1000}秒内无敌`;
      case 'enhance': return `强化装备材料`;
      default: return itemDef.description || '';
    }
  };

  return (
    <div className="h-full flex relative gap-2">
      {/* 左列：快捷栏；框水平垂直居中 */}
      <div className="w-1/3 flex items-center justify-center">
        <div
          className="flex flex-col gap-1.5 p-2"
          style={{
            background: 'rgba(13, 11, 26, 0.4)',
            borderRadius: '8px',
            border: '1px solid rgba(176, 38, 255, 0.1)',
          }}
        >
        <div style={{ ...neonText, fontSize: '9px', color: neonCyan, letterSpacing: '1px' }}>
          快捷栏
        </div>
        <div className="grid grid-cols-2 gap-1">
            {potionHotbar.map((stack, idx) => {
              const itemDef = stack ? getItemDef(stack.itemId) : null;
              const rarity = itemDef?.rarity as ItemRarity | undefined;
              return (
                <div
                  key={`hotbar-${idx}`}
                  className="flex items-center justify-center cursor-pointer relative overflow-hidden"
                  style={{
                    width: '36px',
                    height: '36px',
                    ...(itemDef ? itemSlotStyle(rarity) : emptySlotStyle),
                  }}
                  onClick={(e) => {
                    if (stack) {
                      e.stopPropagation();
                      handleHotbarClick(idx);
                    }
                  }}
                  onDoubleClick={(e) => {
                    if (stack) {
                      e.stopPropagation();
                      handleHotbarUse(idx);
                    }
                  }}
                  title={stack ? `${itemDef?.name} (双击使用)` : '空快捷栏'}
                >
                  {itemDef && (
                    <>
                      <span
                        className="text-base relative"
                        style={{
                          filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.35))',
                          zIndex: 2,
                        }}
                      >
                        {itemDef.icon}
                      </span>
                      {stack.count > 1 && (
                        <span
                          className="absolute bottom-0.5 right-0.5 text-[7px] px-1"
                          style={{
                            fontFamily: '"Rajdhani", "Orbitron", monospace',
                            color: '#0D0B1A',
                            backgroundColor: neonCyan,
                            borderRadius: '3px',
                            fontWeight: 700,
                            zIndex: 3,
                          }}
                        >
                          {stack.count}
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {hotbarToast && (
            <div
              style={{
                marginTop: '6px',
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '8px',
                color: hotbarToast.includes('满') ? '#FF6B6B' : neonCyan,
                textShadow: '0 0 4px rgba(0,0,0,0.6)',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {hotbarToast}
            </div>
          )}
        </div>
        </div>

        {/* 竖线分隔符（黄粉渐变，区别于装备栏的紫青配色） */}
        <div
          aria-hidden
          style={{
            width: '1px',
            alignSelf: 'stretch',
            background: 'linear-gradient(to bottom, rgba(255, 230, 0, 0.05), rgba(255, 230, 0, 0.5) 20%, rgba(255, 0, 128, 0.5) 80%, rgba(255, 0, 128, 0.05))',
            boxShadow: '0 0 4px rgba(255, 230, 0, 0.3)',
            margin: '0 -1px',
          }}
        />

        {/* 右列：页签 + 仓库 + 底部操作栏（与装备栏右列结构一致） */}
        <div className="flex-1 flex flex-col gap-1.5">
          {/* 物品页签栏：消耗品 / 材料 / 任务材料 */}
          <div className="flex gap-1">
            {([
              { id: 'consumable', label: '消耗品' },
              { id: 'material', label: '材料' },
              { id: 'quest', label: '任务材料' },
            ] as const).map(tab => {
              const isActive = inventoryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setInventoryTab(tab.id)}
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '8px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: isActive ? neonCyan : '#5A5A7A',
                    background: isActive ? 'rgba(0, 245, 212, 0.12)' : 'rgba(19, 16, 37, 0.5)',
                    border: `1px solid ${isActive ? 'rgba(0, 245, 212, 0.4)' : 'rgba(100, 100, 130, 0.2)'}`,
                    borderRadius: '6px 6px 0 0',
                    borderBottom: isActive ? 'none' : `1px solid rgba(100, 100, 130, 0.2)`,
                    boxShadow: isActive ? `0 0 6px rgba(0, 245, 212, 0.2)` : 'none',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    flex: 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 物品仓库 */}
          <div
            className="flex-1 overflow-y-auto p-1.5"
            style={{
              background: 'rgba(13, 11, 26, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(176, 38, 255, 0.1)',
            }}
          >
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: 'repeat(5, 36px)',
              rowGap: '1px',
              justifyContent: 'space-between',
            }}
          >
            {displayedItems.map((stack, index) => {
              const itemDef = getItemDef(stack.itemId);
              if (!itemDef) return null;
              const rarity = itemDef.rarity as ItemRarity;
              const cd = itemDef.duration && itemDef.duration > 0 ? itemCooldowns[itemDef.effect] : null;
              const cdPercent = cd ? 1 - cd.remaining / cd.duration : 0;
              const isOnCooldown = cd && cd.remaining > 0;

              return (
                <div
                  key={`${stack.itemId}-${index}`}
                  className={`flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${
                    selectedItem?.index === inventory.indexOf(stack) && selectedItem?.source === 'inventory' ? 'ring-2 ring-[#00F5D4]' : ''
                  }`}
                  style={{
                    width: '36px',
                    height: '36px',
                    ...itemSlotStyle(rarity),
                  }}
                  onClick={() => handleItemClick(index)}
                >
                  {isOnCooldown && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `conic-gradient(rgba(0,0,0,0.4) ${cdPercent * 360}deg, transparent 0deg)`,
                        zIndex: 1,
                      }}
                    />
                  )}
                  <span
                    className="text-base relative"
                    style={{
                      filter: isOnCooldown
                        ? `grayscale(${1 - cdPercent}) brightness(${0.4 + cdPercent * 0.6}) drop-shadow(0 0 4px rgba(255,255,255,0.2))`
                        : 'drop-shadow(0 0 4px rgba(255,255,255,0.35))',
                      zIndex: 2,
                    }}
                  >
                    {itemDef.icon}
                  </span>
                  {stack.count > 1 && (
                    <span
                      className="absolute bottom-0.5 right-0.5 text-[7px] px-1"
                      style={{
                        fontFamily: '"Rajdhani", "Orbitron", monospace',
                        color: '#0D0B1A',
                        backgroundColor: isOnCooldown ? '#8B80A0' : neonCyan,
                        borderRadius: '3px',
                        fontWeight: 700,
                        zIndex: 3,
                      }}
                    >
                      {stack.count}
                    </span>
                  )}
                  {isOnCooldown && (
                    <span
                      className="absolute"
                      style={{
                        fontFamily: '"Rajdhani", "Orbitron", monospace',
                        fontSize: '7px',
                        color: '#FFFFFF',
                        textShadow: '0 0 2px rgba(0,0,0,0.9)',
                        zIndex: 3,
                        lineHeight: 1,
                      }}
                    >
                      {(cd.remaining / 1000).toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })}
            {Array(Math.max(0, Math.ceil(displaySlots / 5) * 5 - displayedItems.length)).fill(null).map((_, index) => (
              <div
                key={`empty-${index}`}
                style={{
                  width: '36px',
                  height: '36px',
                  ...emptySlotStyle,
                }}
              />
            ))}
          </div>
        </div>

        {/* 底部操作栏：左计数 + 右按钮 */}
        <div className="flex justify-between items-center gap-2 pt-1" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}>
          {/* 左侧：仓库计数，垂直居中 */}
          <span
            style={{
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              fontSize: '9px',
              color: '#8B80A0',
              fontWeight: 600,
              letterSpacing: '0.5px',
              lineHeight: 1,
            }}
          >
            {inventory.length}/{displaySlots}
          </span>
          {/* 右侧：操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleSort}
              style={{
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '8px',
                fontWeight: 600,
                color: neonPurple,
                background: 'rgba(176, 38, 255, 0.1)',
                border: '1px solid rgba(176, 38, 255, 0.25)',
                borderRadius: '6px',
                boxShadow: '0 0 6px rgba(176, 38, 255, 0.1)',
                padding: '4px 8px',
                cursor: 'pointer',
                minWidth: '52px',
              }}
            >
              整理
            </button>
            <button
              onClick={() => setShowSellPicker(true)}
              style={{
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '8px',
                fontWeight: 600,
                color: '#FFD700',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                boxShadow: '0 0 6px rgba(255, 215, 0, 0.15)',
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              批量出售
            </button>
          </div>
        </div>
        </div>

      {/* 批量出售品质选择弹窗 */}
      {showSellPicker && (
        <div
          className="absolute inset-0 flex items-center justify-center z-30"
          style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSellPicker(false)}
        >
          <div
            className="p-4"
            style={{
              ...cardStyle,
              width: '260px',
              padding: '12px 14px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <span style={{ ...neonText, fontSize: '10px', color: neonYellow, fontWeight: 700 }}>
                批量出售 - 选择品质
              </span>
              <button
                onClick={() => setShowSellPicker(false)}
                style={{
                  background: 'rgba(255, 45, 85, 0.2)',
                  border: '1px solid rgba(255, 45, 85, 0.4)',
                  color: '#FF2D55',
                  width: '20px',
                  height: '20px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  borderRadius: '5px',
                }}
              >
                X
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {(['mythic', 'epic', 'legendary', 'fine', 'advanced', 'common'] as string[]).map(q => {
                const checked = sellQualities.has(q);
                const count = inventory.filter(stack => getItemDef(stack.itemId)?.rarity === q).reduce((s, st) => s + st.count, 0);
                const gold = count * (raritySellMap[q] || 0);
                return (
                  <label
                    key={q}
                    className="flex flex-col items-center cursor-pointer"
                    style={{
                      padding: '5px 4px',
                      background: checked ? 'rgba(255, 215, 0, 0.1)' : 'rgba(19, 16, 37, 0.5)',
                      border: `1px solid ${checked ? 'rgba(255, 215, 0, 0.4)' : 'rgba(176, 38, 255, 0.15)'}`,
                      borderRadius: '6px',
                    }}
                    onClick={() => toggleSellQuality(q)}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          border: `1.5px solid ${RARITY_COLORS[q as ItemRarity | EquipRarity]}`,
                          background: checked ? RARITY_COLORS[q as ItemRarity | EquipRarity] : 'transparent',
                          boxShadow: checked ? `0 0 4px ${RARITY_COLORS[q as ItemRarity | EquipRarity]}` : 'none',
                        }}
                      />
                      <span style={{ ...neonText, fontSize: '9px', color: RARITY_COLORS[q as ItemRarity | EquipRarity], fontWeight: 700 }}>
                        {RARITY_LABELS[q as ItemRarity | EquipRarity]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>
                        {count}件
                      </span>
                      <span style={{ ...neonText, fontSize: '7px', color: neonYellow }}>
                        {gold}金
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
            <div
              className="flex justify-between mb-3 pt-2"
              style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}
            >
              <span style={{ ...neonText, fontSize: '8px', color: '#8B80A0' }}>
                共 {sellPreview.count} 件
              </span>
              <span style={{ ...neonText, fontSize: '9px', color: neonYellow, fontWeight: 700 }}>
                {sellPreview.gold} 金币
              </span>
            </div>
            <button
              onClick={handleBatchSell}
              disabled={sellPreview.count === 0}
              style={{
                width: '100%',
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '9px',
                fontWeight: 700,
                color: '#0A0814',
                background: sellPreview.count > 0 ? neonYellow : 'rgba(100, 100, 130, 0.3)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 0',
                cursor: sellPreview.count > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              确认出售
            </button>
          </div>
        </div>
      )}

      {selectedItem && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative w-64 p-4"
            style={{
              ...cardStyle,
              padding: '16px 18px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center"
              style={{
                background: 'rgba(255, 45, 85, 0.2)',
                border: '1px solid rgba(255, 45, 85, 0.4)',
                borderRadius: '6px',
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#FF2D55',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedItem(null)}
            >
              X
            </button>

            <div className="flex items-center gap-3 mb-3 pr-8">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={itemSlotStyle(getItemDef(selectedItem.stack.itemId)?.rarity)}
              >
                <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.4))' }}>
                  {getItemDef(selectedItem.stack.itemId)?.icon}
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: RARITY_COLORS[getItemDef(selectedItem.stack.itemId)?.rarity as ItemRarity | EquipRarity] || neonCyan,
                    textShadow: `0 0 6px ${RARITY_COLORS[getItemDef(selectedItem.stack.itemId)?.rarity as ItemRarity | EquipRarity] || neonCyan}60`,
                  }}
                >
                  {getItemDef(selectedItem.stack.itemId)?.name}
                </div>
                <div
                  className="mt-1"
                  style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', color: '#8B80A0' }}
                >
                  {RARITY_LABELS[getItemDef(selectedItem.stack.itemId)?.rarity as ItemRarity | EquipRarity] || '普通'} · 数量 {selectedItem.stack.count}
                </div>
              </div>
            </div>

            <div
              className="pt-2 mb-3"
              style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}
            >
              <p
                style={{
                  fontFamily: '"Rajdhani", "Orbitron", monospace',
                  fontSize: '8px',
                  color: '#B0A8C8',
                  lineHeight: '1.5',
                }}
              >
                {getEffectDescription(getItemDef(selectedItem.stack.itemId))}
              </p>
            </div>

            <div className="flex gap-2 justify-end flex-wrap">
              {/* 仅药水（consumable）显示设置/取出快捷栏按钮 */}
              {getItemDef(selectedItem.stack.itemId)?.type === 'consumable' && (
                <button
                  className="px-3 py-1.5"
                  style={{
                    background: selectedItem.source === 'inventory'
                      ? 'rgba(255, 230, 0, 0.15)'
                      : 'rgba(255, 107, 107, 0.15)',
                    border: selectedItem.source === 'inventory'
                      ? '1px solid rgba(255, 230, 0, 0.4)'
                      : '1px solid rgba(255, 107, 107, 0.4)',
                    borderRadius: '6px',
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: selectedItem.source === 'inventory' ? neonYellow : '#FF6B6B',
                    boxShadow: '0 0 6px rgba(255, 230, 0, 0.1)',
                    cursor: 'pointer',
                  }}
                  onClick={selectedItem.source === 'inventory' ? handleSetToHotbar : handleRemoveFromHotbar}
                >
                  {selectedItem.source === 'inventory' ? '设置快捷栏' : '取出快捷栏'}
                </button>
              )}
              <button
                className="px-4 py-1.5"
                style={{
                  background: getItemDef(selectedItem.stack.itemId)?.type === 'consumable'
                    ? 'rgba(0, 245, 212, 0.15)'
                    : 'rgba(100, 100, 130, 0.1)',
                  border: getItemDef(selectedItem.stack.itemId)?.type === 'consumable'
                    ? '1px solid rgba(0, 245, 212, 0.3)'
                    : '1px solid rgba(100, 100, 130, 0.2)',
                  borderRadius: '6px',
                  fontFamily: '"Rajdhani", "Orbitron", monospace',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: getItemDef(selectedItem.stack.itemId)?.type === 'consumable' ? neonCyan : '#5A5A7A',
                  boxShadow: getItemDef(selectedItem.stack.itemId)?.type === 'consumable'
                    ? '0 0 8px rgba(0, 245, 212, 0.1)'
                    : 'none',
                  cursor: getItemDef(selectedItem.stack.itemId)?.type === 'consumable' ? 'pointer' : 'not-allowed',
                  opacity: getItemDef(selectedItem.stack.itemId)?.type === 'consumable' ? 1 : 0.5,
                }}
                onClick={handleUseItem}
                disabled={getItemDef(selectedItem.stack.itemId)?.type !== 'consumable'}
              >
                使用
              </button>
              {selectedItem.source === 'inventory' && (
                <button
                  className="px-4 py-1.5"
                  style={{
                    background: 'rgba(255, 45, 85, 0.15)',
                    border: '1px solid rgba(255, 45, 85, 0.3)',
                    borderRadius: '6px',
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#FF2D55',
                    boxShadow: '0 0 8px rgba(255, 45, 85, 0.1)',
                    cursor: 'pointer',
                  }}
                  onClick={handleDropItem}
                >
                  丢弃
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
