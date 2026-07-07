import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { EquipmentIcon } from './EquipmentIcon';
import { GemEmbedModal } from './GemEmbedModal';
import { EnhanceModal } from './EnhanceModal';
import { EnhanceItemIcon } from './EnhanceItemIcon';
import { EnchantModal } from './EnchantModal';
import { EnchantItemIcon } from './EnchantItemIcon';
import { Equipment, EquipSlot, EquipRarity, SocketedGem, ItemStack } from '../game/types/game';
import { getEquipmentBonus, getRarityName, RARITY_COLORS, EQUIP_SLOTS, SLOT_LABELS, isEquipmentInActiveSet, getQualitySetGroups, RARITY_LABELS, createEquipment } from '../game/data/equipment';
import { GEM_TYPE_INFO, GEM_RARITY_LABELS, GEM_RARITY_BG, GEM_RARITY_BORDER, getGemDef, MAX_GEM_SOCKETS, GEMS } from '../game/data/gems';
import { ENHANCE_ITEMS, getEnhanceItemDef, getEnhanceAttackBonus } from '../game/data/enhanceItems';
import type { EnhanceItemId } from '../game/data/enhanceItems';
import { ENCHANT_ITEMS, ENCHANT_STAT_INFO, getEnchantItemDef } from '../game/data/enchantItems';
import type { EnchantItemId, EnchantStat } from '../game/data/enchantItems';
import { neonCyan, neonPurple, neonPink, neonYellow, neonText } from '../theme/colors';
import { hexToRgba } from '../utils/styles';

// 出售价格表（按品质）
const raritySellMap: Record<EquipRarity, number> = {
  common: 10,
  advanced: 25,
  fine: 50,
  legendary: 100,
  epic: 200,
  mythic: 500,
};

// hexToRgba 已移至 utils/styles.ts
// 装备格子样式：保留本地版本（带 marquee 跑马灯支持 + 无 glow 风格）
// 性能优化：把内部 Record 提到模块顶层，避免每次调用重新创建
const BORDER_ALPHA: Record<EquipRarity, number> = {
  common: 0.3, advanced: 0.4, fine: 0.5,
  legendary: 0.55, epic: 0.6, mythic: 0.65,
};
const RARITY_GRADIENT: Record<string, string> = {
  common: 'radial-gradient(circle at 50% 45%, #2A2540 0%, #1E1A35 55%, #15122A 100%)',
  advanced: 'radial-gradient(circle at 50% 45%, #253050 0%, #1A2540 55%, #101830 100%)',
  fine: 'radial-gradient(circle at 50% 45%, #3A2855 0%, #2A1C45 55%, #1E1035 100%)',
  legendary: 'radial-gradient(circle at 50% 40%, #8A4A2A 0%, #5A2A10 60%, #3A1A08 100%)',
  epic: 'radial-gradient(circle at 50% 40%, #7A6A20 0%, #4D4010 60%, #2F2808 100%)',
  mythic: 'radial-gradient(circle at 50% 40%, #8A2A3A 0%, #5A1A20 60%, #3A0A10 100%)',
};

const itemSlotStyle = (rarity: EquipRarity, marqueeColor?: string) => {
  const baseColor = RARITY_COLORS[rarity] || RARITY_COLORS.common;

  if (marqueeColor) {
    return {
      background: RARITY_GRADIENT[rarity],
      border: '2.5px solid transparent',
      borderRadius: '8px',
      boxShadow: 'none',
      cursor: 'pointer',
      ['--mc' as any]: marqueeColor,
      position: 'relative' as const,
      overflow: 'visible' as const,
    };
  }

  return {
    background: RARITY_GRADIENT[rarity],
    border: `2.5px solid ${hexToRgba(baseColor, BORDER_ALPHA[rarity] || 0.3)}`,
    borderRadius: '8px',
    boxShadow: 'none',
    cursor: 'pointer',
  };
};

const emptySlotStyle = {
  background: 'rgba(19, 16, 37, 0.3)',
  border: '2.5px dashed rgba(100, 100, 130, 0.2)',
  borderRadius: '8px',
  opacity: 0.8,
};

const storageEmptyStyle = {
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

type TabType = 'equipment' | 'inventory';

interface GameEngineRef {
  current: {
    addGold: (amount: number) => void;
    syncEquipmentState: (equipment: Equipment[], equipmentStorage: Equipment[]) => void;
    socketGem: (equipmentId: string, gemId: string, source: 'equipped' | 'storage') => {
      success: boolean;
      reset: boolean;
      reason?: string;
    } | null;
    enhanceEquipment: (
      equipmentId: string,
      source: 'equipped' | 'storage',
      mode: 'gold' | 'item',
      itemId?: string
    ) => { success: boolean; reason?: string; newLevel: number; goldCost: number; failResult?: string } | null;
    enchantEquipment: (
      equipmentId: string,
      source: 'equipped' | 'storage',
      itemId: string
    ) => { success: boolean; reason?: string; stat?: EnchantStat; percent?: number } | null;
    synthEnchantItem: (
      itemId: string
    ) => { success: boolean; reason?: string; newItemId?: string } | null;
    syncGemInventory?: (gems: ItemStack[]) => void;
    syncEnhanceItemInventory?: (items: ItemStack[]) => void;
    syncEnchantItemInventory?: (items: ItemStack[]) => void;
  } | null;
}

interface EquipmentPanelProps {
  onTabChange: (tab: TabType) => void;
  activeTab: TabType;
  engineRef?: GameEngineRef;
  onShowStats?: () => void;
}

const EquipmentPanelImpl: React.FC<EquipmentPanelProps> = ({ onTabChange, engineRef, onShowStats }) => {
  // 用 selector 订阅，避免无关字段变化（玩家坐标/buff/天气）触发整面板重渲染
  const equipment = useGameStore(s => s.equipment);
  const equipmentStorage = useGameStore(s => s.equipmentStorage);
  const gemInventory = useGameStore(s => s.gemInventory);
  const enhanceItemInventory = useGameStore(s => s.enhanceItemInventory);
  const enchantItemInventory = useGameStore(s => s.enchantItemInventory);
  const playerLevel = useGameStore(s => s.player?.level ?? 0);
  const setEquipment = useGameStore(s => s.setEquipment);
  const setEquipmentStorage = useGameStore(s => s.setEquipmentStorage);
  const setGemInventory = useGameStore(s => s.setGemInventory);
  const setEnhanceItemInventory = useGameStore(s => s.setEnhanceItemInventory);
  const setEnchantItemInventory = useGameStore(s => s.setEnchantItemInventory);
  const player = { level: playerLevel } as const;
  // 仓库页签：装备 / 宝石 / 强化 / 附魔
  const [storageTab, setStorageTab] = useState<'equipment' | 'gem' | 'enhance' | 'enchant'>('equipment');

  // 各仓库容量上限
  const STORAGE_CAPACITY = {
    equipment: 100,
    gem: 50,
    enhance: 30,
    enchant: 30,
  } as const;
  const [selectedItem, setSelectedItem] = useState<
    { equipment: Equipment; source: 'equipped' | 'storage' } | null
  >(null);
  // 宝石详情弹窗：点击宝石仓库中的宝石格子时弹出
  const [selectedGem, setSelectedGem] = useState<{ gemId: string; count: number } | null>(null);
  // 强化道具详情弹窗：点击强化仓库中的道具格子时弹出
  const [selectedEnhanceItem, setSelectedEnhanceItem] = useState<{ itemId: EnhanceItemId; count: number } | null>(null);
  // 附魔书详情弹窗：点击附魔仓库中的书格子时弹出
  const [selectedEnchantItem, setSelectedEnchantItem] = useState<{ itemId: EnchantItemId; count: number } | null>(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  const [showEnchantModal, setShowEnchantModal] = useState(false);
  const [sortDesc, setSortDesc] = useState(true); // true=由高到低，false=由低到高
  const [showSellPicker, setShowSellPicker] = useState(false);
  // 装备锁定：lockMode 表示当前处于锁定模式（点击格子切换锁定）；lockedEquipIds 存储已锁定装备 id
  const [lockMode, setLockMode] = useState(false);
  const [lockToast, setLockToast] = useState<string | null>(null);
  const [lockedEquipIds, setLockedEquipIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lockedEquipmentIds');
      if (saved) return new Set(JSON.parse(saved) as string[]);
    } catch {}
    return new Set<string>();
  });

  // 持久化锁定装备
  useEffect(() => {
    try {
      localStorage.setItem('lockedEquipmentIds', JSON.stringify(Array.from(lockedEquipIds)));
    } catch {}
  }, [lockedEquipIds]);

  // 切换装备锁定状态
  const toggleEquipLock = useCallback((id: string) => {
    setLockedEquipIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 锁定提示 toast
  useEffect(() => {
    if (!lockToast) return;
    const id = setTimeout(() => setLockToast(null), 1200);
    return () => clearTimeout(id);
  }, [lockToast]);
  // 缓存勾选的品质（localStorage），避免重复操作
  const [sellQualities, setSellQualities] = useState<Set<EquipRarity>>(() => {
    try {
      const saved = localStorage.getItem('batchSellQualities');
      if (saved) return new Set(JSON.parse(saved) as EquipRarity[]);
    } catch {}
    return new Set<EquipRarity>(['common', 'advanced']);
  });

  // 持久化勾选品质
  useEffect(() => {
    try {
      localStorage.setItem('batchSellQualities', JSON.stringify(Array.from(sellQualities)));
    } catch {}
  }, [sellQualities]);

  // 已装备的成套分组（用于跑马灯）
  const setGroups = useMemo(() => getQualitySetGroups(equipment), [equipment]);

  // 判断某件装备是否属于成套（用于跑马灯特效）
  const isSetMember = useCallback((equip: Equipment) => {
    return isEquipmentInActiveSet(equip, equipment);
  }, [equipment]);

  // 获取装备对应套装颜色（成套时）
  const getSetMarqueeColor = useCallback((equip: Equipment): string | null => {
    if (!isSetMember(equip)) return null;
    const colorMap: Record<string, string> = {
      legendary: '#FF8C00',
      epic: '#FFD700',
      mythic: '#FF3B3B',
    };
    return colorMap[equip.rarity] || null;
  }, [isSetMember]);

  const getEquipForSlot = (slot: EquipSlot): Equipment | undefined => {
    return equipment.find((e) => e.slot === slot);
  };

  const handleEquippedClick = useCallback(
    (equip: Equipment) => {
      setSelectedItem({ equipment: equip, source: 'equipped' });
    },
    []
  );

  const handleStorageClick = useCallback(
    (equip: Equipment) => {
      setSelectedItem({ equipment: equip, source: 'storage' });
    },
    []
  );

  // 统一同步函数：更新 Zustand + 同步到引擎（重算属性）
  const syncBoth = useCallback((newEquip: Equipment[], newStorage: Equipment[]) => {
    setEquipment(newEquip);
    setEquipmentStorage(newStorage);
    if (engineRef?.current?.syncEquipmentState) {
      engineRef.current.syncEquipmentState(newEquip, newStorage);
    }
  }, [setEquipment, setEquipmentStorage, engineRef]);

  const handleClose = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleDrop = useCallback(() => {
    if (!selectedItem) return;
    if (selectedItem.source === 'equipped') {
      syncBoth(equipment.filter((e) => e.id !== selectedItem.equipment.id), equipmentStorage);
    } else {
      syncBoth(equipment, equipmentStorage.filter((e) => e.id !== selectedItem.equipment.id));
    }
    setSelectedItem(null);
  }, [selectedItem, equipment, equipmentStorage, syncBoth]);

  const handleEquip = useCallback(() => {
    if (!selectedItem || selectedItem.source !== 'storage') return;
    const newEquipment = [...equipment];
    const existingIndex = newEquipment.findIndex((e) => e.slot === selectedItem.equipment.slot);
    let newStorage: Equipment[];
    if (existingIndex >= 0) {
      newStorage = [...equipmentStorage, newEquipment[existingIndex]];
      newEquipment[existingIndex] = selectedItem.equipment;
    } else {
      newEquipment.push(selectedItem.equipment);
      newStorage = equipmentStorage;
    }
    newStorage = newStorage.filter((e) => e.id !== selectedItem.equipment.id);
    syncBoth(newEquipment, newStorage);
    setSelectedItem(null);
  }, [selectedItem, equipment, equipmentStorage, syncBoth]);

  const handleUnequip = useCallback(() => {
    if (!selectedItem || selectedItem.source !== 'equipped') return;
    syncBoth(equipment.filter((e) => e.id !== selectedItem.equipment.id), [...equipmentStorage, selectedItem.equipment]);
    setSelectedItem(null);
  }, [selectedItem, equipment, equipmentStorage, syncBoth]);

  const handleScrap = useCallback(() => {
    if (!selectedItem) return;
    if (lockedEquipIds.has(selectedItem.equipment.id)) {
      setLockToast('该装备已锁定，无法出售');
      return;
    }
    const gold = raritySellMap[selectedItem.equipment.rarity] || 0;
    if (gold > 0 && engineRef?.current) {
      engineRef.current.addGold(gold);
    }
    if (selectedItem.source === 'equipped') {
      syncBoth(equipment.filter((e) => e.id !== selectedItem.equipment.id), equipmentStorage);
    } else {
      syncBoth(equipment, equipmentStorage.filter((e) => e.id !== selectedItem.equipment.id));
    }
    setSelectedItem(null);
  }, [selectedItem, equipment, equipmentStorage, syncBoth, engineRef, lockedEquipIds, setLockToast]);

  const handleSortStorage = useCallback(() => {
    const order = sortDesc
      ? ['mythic', 'epic', 'legendary', 'fine', 'advanced', 'common']
      : ['common', 'advanced', 'fine', 'legendary', 'epic', 'mythic'];
    // 锁定的装备保持在原 index，未锁定的排序后填入其余位置
    const unlocked = equipmentStorage
      .map((e, i) => ({ e, i, locked: lockedEquipIds.has(e.id) }))
      .filter(x => !x.locked)
      .map(x => x.e)
      .sort((a, b) => {
        const ra = order.indexOf(a.rarity);
        const rb = order.indexOf(b.rarity);
        if (ra !== rb) return ra - rb;
        return b.level - a.level;
      });
    const result: Equipment[] = [];
    let unlockedIdx = 0;
    for (let i = 0; i < equipmentStorage.length; i++) {
      if (lockedEquipIds.has(equipmentStorage[i].id)) {
        result.push(equipmentStorage[i]);
      } else {
        if (unlockedIdx < unlocked.length) {
          result.push(unlocked[unlockedIdx++]);
        }
      }
    }
    while (unlockedIdx < unlocked.length) {
      result.push(unlocked[unlockedIdx++]);
    }
    syncBoth(equipment, result);
    setSortDesc(!sortDesc);
  }, [equipmentStorage, equipment, syncBoth, sortDesc, lockedEquipIds]);

  const handleBatchSell = useCallback(() => {
    const selected = Array.from(sellQualities);
    if (selected.length === 0) return;
    // 过滤掉锁定的装备
    const toSell = equipmentStorage.filter(e => selected.includes(e.rarity) && !lockedEquipIds.has(e.id));
    if (toSell.length === 0) {
      setShowSellPicker(false);
      return;
    }
    const totalGold = toSell.reduce((sum, e) => sum + (raritySellMap[e.rarity] || 0), 0);
    if (totalGold > 0 && engineRef?.current) {
      engineRef.current.addGold(totalGold);
    }
    // 锁定装备保持原 index，未出售的未锁定装备在其余位置按原顺序填入
    const keepUnlocked = equipmentStorage.filter(e => !(selected.includes(e.rarity) && !lockedEquipIds.has(e.id)) && !lockedEquipIds.has(e.id));
    const result: Equipment[] = [];
    let kuIdx = 0;
    for (let i = 0; i < equipmentStorage.length; i++) {
      const cur = equipmentStorage[i];
      if (lockedEquipIds.has(cur.id)) {
        result.push(cur);
      } else if (selected.includes(cur.rarity)) {
        // 被出售，跳过
      } else {
        if (kuIdx < keepUnlocked.length) {
          result.push(keepUnlocked[kuIdx++]);
        }
      }
    }
    while (kuIdx < keepUnlocked.length) {
      result.push(keepUnlocked[kuIdx++]);
    }
    syncBoth(equipment, result);
    setShowSellPicker(false);
  }, [equipmentStorage, equipment, sellQualities, syncBoth, engineRef, lockedEquipIds]);

  const toggleSellQuality = useCallback((q: EquipRarity) => {
    setSellQualities(prev => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q);
      else next.add(q);
      return next;
    });
  }, []);

  // 预览：当前勾选品质可出售的件数与总价
  const sellPreview = useMemo(() => {
    const selected = Array.from(sellQualities);
    if (storageTab === 'equipment') {
      const toSell = equipmentStorage.filter(e => selected.includes(e.rarity));
      const totalGold = toSell.reduce((sum, e) => sum + (raritySellMap[e.rarity] || 0), 0);
      return { count: toSell.length, gold: totalGold };
    }
    // 宝石/强化/附魔仓库：按当前页签库存计算
    const inv = storageTab === 'gem' ? gemInventory
      : storageTab === 'enhance' ? enhanceItemInventory
      : enchantItemInventory;
    let count = 0;
    let gold = 0;
    for (const stack of inv) {
      let rarity: EquipRarity | undefined;
      if (storageTab === 'gem') rarity = GEMS[stack.itemId]?.rarity as EquipRarity | undefined;
      else if (storageTab === 'enhance') rarity = ENHANCE_ITEMS[stack.itemId as EnhanceItemId]?.rarity as EquipRarity | undefined;
      else rarity = ENCHANT_ITEMS[stack.itemId as EnchantItemId]?.rarity as EquipRarity | undefined;
      if (!rarity || !selected.includes(rarity)) continue;
      count += stack.count;
      gold += (raritySellMap[rarity] || 0) * stack.count;
    }
    return { count, gold };
  }, [storageTab, equipmentStorage, gemInventory, enhanceItemInventory, enchantItemInventory, sellQualities]);

  // 仓库整理（宝石/强化/附魔）：按品质降序→数量降序排列，同步到 store + 引擎
  const handleStorageSort = useCallback(() => {
    const order = sortDesc
      ? ['mythic', 'epic', 'legendary', 'fine', 'advanced', 'common']
      : ['common', 'advanced', 'fine', 'legendary', 'epic', 'mythic'];
    const getRarity = (itemId: string): EquipRarity => {
      if (storageTab === 'gem') return (GEMS[itemId]?.rarity || 'common') as EquipRarity;
      if (storageTab === 'enhance') return (ENHANCE_ITEMS[itemId as EnhanceItemId]?.rarity || 'common') as EquipRarity;
      return (ENCHANT_ITEMS[itemId as EnchantItemId]?.rarity || 'common') as EquipRarity;
    };
    const inv = storageTab === 'gem' ? gemInventory
      : storageTab === 'enhance' ? enhanceItemInventory
      : enchantItemInventory;
    const sorted = [...inv].sort((a, b) => {
      const ra = order.indexOf(getRarity(a.itemId));
      const rb = order.indexOf(getRarity(b.itemId));
      if (ra !== rb) return ra - rb;
      return b.count - a.count;
    });
    if (storageTab === 'gem') {
      setGemInventory(sorted);
      engineRef?.current?.syncGemInventory?.(sorted);
    } else if (storageTab === 'enhance') {
      setEnhanceItemInventory(sorted);
      engineRef?.current?.syncEnhanceItemInventory?.(sorted);
    } else {
      setEnchantItemInventory(sorted);
      engineRef?.current?.syncEnchantItemInventory?.(sorted);
    }
    setSortDesc(!sortDesc);
  }, [storageTab, sortDesc, gemInventory, enhanceItemInventory, enchantItemInventory, setGemInventory, setEnhanceItemInventory, setEnchantItemInventory, engineRef]);

  // 仓库批量出售（宝石/强化/附魔）：按勾选品质出售全部对应库存
  const handleStorageBatchSell = useCallback(() => {
    const selected = Array.from(sellQualities);
    if (selected.length === 0) {
      setShowSellPicker(false);
      return;
    }
    const isTarget = (itemId: string): boolean => {
      let rarity: EquipRarity | undefined;
      if (storageTab === 'gem') rarity = GEMS[itemId]?.rarity as EquipRarity | undefined;
      else if (storageTab === 'enhance') rarity = ENHANCE_ITEMS[itemId as EnhanceItemId]?.rarity as EquipRarity | undefined;
      else rarity = ENCHANT_ITEMS[itemId as EnchantItemId]?.rarity as EquipRarity | undefined;
      return !!rarity && selected.includes(rarity);
    };
    const inv = storageTab === 'gem' ? gemInventory
      : storageTab === 'enhance' ? enhanceItemInventory
      : enchantItemInventory;
    const toSell = inv.filter(s => isTarget(s.itemId));
    if (toSell.length === 0) {
      setShowSellPicker(false);
      return;
    }
    const totalGold = toSell.reduce((sum, s) => {
      let rarity: EquipRarity = 'common';
      if (storageTab === 'gem') rarity = (GEMS[s.itemId]?.rarity || 'common') as EquipRarity;
      else if (storageTab === 'enhance') rarity = (ENHANCE_ITEMS[s.itemId as EnhanceItemId]?.rarity || 'common') as EquipRarity;
      else rarity = (ENCHANT_ITEMS[s.itemId as EnchantItemId]?.rarity || 'common') as EquipRarity;
      return sum + (raritySellMap[rarity] || 0) * s.count;
    }, 0);
    const remaining = inv.filter(s => !isTarget(s.itemId));
    if (storageTab === 'gem') {
      setGemInventory(remaining);
      engineRef?.current?.syncGemInventory?.(remaining);
    } else if (storageTab === 'enhance') {
      setEnhanceItemInventory(remaining);
      engineRef?.current?.syncEnhanceItemInventory?.(remaining);
    } else {
      setEnchantItemInventory(remaining);
      engineRef?.current?.syncEnchantItemInventory?.(remaining);
    }
    if (totalGold > 0 && engineRef?.current) {
      engineRef.current.addGold(totalGold);
    }
    setShowSellPicker(false);
  }, [storageTab, sellQualities, gemInventory, enhanceItemInventory, enchantItemInventory, setGemInventory, setEnhanceItemInventory, setEnchantItemInventory, engineRef]);

  // 统一批量出售入口：装备仓库走原 handleBatchSell，其余走 handleStorageBatchSell
  const onBatchSellClick = useCallback(() => {
    if (storageTab === 'equipment') handleBatchSell();
    else handleStorageBatchSell();
  }, [storageTab, handleBatchSell, handleStorageBatchSell]);

  // 统一整理入口：装备仓库走原 handleSortStorage，其余走 handleStorageSort
  const onSortClick = useCallback(() => {
    if (storageTab === 'equipment') handleSortStorage();
    else handleStorageSort();
  }, [storageTab, handleSortStorage, handleStorageSort]);

  // 出售品质选择弹窗：按当前仓库页签统计各品质件数与金币
  const qualityStats = useMemo(() => {
    const stats: Record<string, { count: number; gold: number }> = {};
    (['mythic', 'epic', 'legendary', 'fine', 'advanced', 'common'] as EquipRarity[]).forEach(q => {
      stats[q] = { count: 0, gold: 0 };
    });
    if (storageTab === 'equipment') {
      for (const e of equipmentStorage) {
        if (!stats[e.rarity]) continue;
        stats[e.rarity].count += 1;
        stats[e.rarity].gold += raritySellMap[e.rarity] || 0;
      }
    } else {
      const inv = storageTab === 'gem' ? gemInventory
        : storageTab === 'enhance' ? enhanceItemInventory
        : enchantItemInventory;
      for (const stack of inv) {
        let rarity: EquipRarity | undefined;
        if (storageTab === 'gem') rarity = GEMS[stack.itemId]?.rarity as EquipRarity | undefined;
        else if (storageTab === 'enhance') rarity = ENHANCE_ITEMS[stack.itemId as EnhanceItemId]?.rarity as EquipRarity | undefined;
        else rarity = ENCHANT_ITEMS[stack.itemId as EnchantItemId]?.rarity as EquipRarity | undefined;
        if (!rarity || !stats[rarity]) continue;
        stats[rarity].count += stack.count;
        stats[rarity].gold += (raritySellMap[rarity] || 0) * stack.count;
      }
    }
    return stats;
  }, [storageTab, equipmentStorage, gemInventory, enhanceItemInventory, enchantItemInventory]);

  return (
    <div
      className="h-full flex relative gap-2"
      style={{ color: '#E0E0FF', ...(lockMode ? { cursor: 'cell' } : {}) }}
      onClick={() => { if (lockMode) setLockMode(false); }}
    >
      {/* 跑马灯样式：keyframes 已提取至 index.css */}
      <div className="w-1/3 flex flex-col gap-1.5">
        <div
          style={{ ...neonText, fontSize: '9px', color: neonCyan, letterSpacing: '1px' }}
        >
          已装备 ({equipment.length}/9)
        </div>
        <div className="grid grid-cols-3 gap-1 place-items-center mx-auto">
          {EQUIP_SLOTS.map((slot) => {
            const equip = getEquipForSlot(slot);
            const marqueeColor = equip ? getSetMarqueeColor(equip) : null;
            return (
              <div
                key={slot}
                className={`flex flex-col items-center justify-center cursor-pointer relative ${marqueeColor ? 'marquee-slot' : ''}`}
                style={{ width: '36px', height: '36px', ...(equip ? itemSlotStyle(equip.rarity, marqueeColor) : emptySlotStyle), ...(marqueeColor ? { ['--mc' as any]: marqueeColor } : {}) }}
                onClick={() => equip && handleEquippedClick(equip)}
              >
                {marqueeColor && (
                  <svg className="marquee-border" viewBox="0 0 36 36">
                    <rect x="1.25" y="1.25" width="33.5" height="33.5" rx="8" ry="8" />
                  </svg>
                )}
                {equip ? (
                  <>
                    <EquipmentIcon slot={equip.slot} rarity={equip.rarity} variant={equip.iconVariant} size={28} gemCount={equip.socketedGems?.length || 0} enhanceLevel={equip.enhanceLevel || 0} level={equip.level} />
                  </>
                ) : (
                  <span
                    className="text-center px-1"
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '6px',
                      color: 'rgba(150,150,180,0.4)',
                    }}
                  >
                    {SLOT_LABELS[slot as keyof typeof SLOT_LABELS]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 查看属性按钮 */}
        <button
          onClick={() => onShowStats?.()}
          style={{
            fontFamily: '"Rajdhani", "Orbitron", monospace',
            fontSize: '8px',
            fontWeight: 600,
            color: neonCyan,
            background: 'rgba(0, 245, 212, 0.1)',
            border: '1px solid rgba(0, 245, 212, 0.3)',
            borderRadius: '6px',
            boxShadow: '0 0 6px rgba(0, 245, 212, 0.1)',
            padding: '4px 0',
            cursor: 'pointer',
            width: '100%',
            marginTop: '2px',
          }}
        >
          查看属性
        </button>
        {/* 修理装备按钮 */}
        <button
          onClick={() => {
            if (engineRef?.current) {
              (engineRef.current as any).repairAllEquipment?.();
            }
          }}
          style={{
            fontFamily: '"Rajdhani", "Orbitron", monospace',
            fontSize: '8px',
            fontWeight: 600,
            color: '#FF6B35',
            background: 'rgba(255, 107, 53, 0.1)',
            border: '1px solid rgba(255, 107, 53, 0.3)',
            borderRadius: '6px',
            boxShadow: '0 0 6px rgba(255, 107, 53, 0.1)',
            padding: '4px 0',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          修理装备
        </button>
      </div>

      {/* 竖线分隔符 */}
      <div
        aria-hidden
        style={{
          width: '1px',
          alignSelf: 'stretch',
          background: 'linear-gradient(to bottom, rgba(176, 38, 255, 0.05), rgba(176, 38, 255, 0.5) 20%, rgba(0, 245, 212, 0.4) 80%, rgba(0, 245, 212, 0.05))',
          boxShadow: '0 0 4px rgba(176, 38, 255, 0.3)',
          margin: '0 -1px',
        }}
      />

      <div className="flex-1 flex flex-col gap-1.5">
        {/* 仓库页签栏：装备 / 宝石 / 强化 / 附魔 */}
        <div className="flex gap-1">
          {([
            { id: 'equipment', label: '装备' },
            { id: 'gem', label: '宝石' },
            { id: 'enhance', label: '强化' },
            { id: 'enchant', label: '附魔' },
          ] as const).map(tab => {
            const isActive = storageTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStorageTab(tab.id)}
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

        {storageTab === 'equipment' ? (
          <>
            <div
              className="flex-1 overflow-y-auto p-1.5"
              style={{
                background: 'rgba(13, 11, 26, 0.4)',
                borderRadius: '8px',
                border: '1px solid rgba(176, 38, 255, 0.1)',
              }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: 'repeat(5, 36px)',
                  rowGap: '1px',
                  justifyContent: 'space-between',
                }}
              >
                {Array.from({ length: Math.max(equipmentStorage.length, STORAGE_CAPACITY.equipment) }).map((_, index) => {
                  const item = equipmentStorage[index];
                  const isLocked = item ? lockedEquipIds.has(item.id) : false;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center justify-center cursor-pointer relative"
                      style={{
                        width: '36px',
                        height: '36px',
                        marginBottom: '1px',
                        ...(item ? itemSlotStyle(item.rarity) : storageEmptyStyle),
                        ...(lockMode ? { cursor: isLocked ? 'pointer' : 'cell' } : {}),
                      }}
                      onClick={(e) => {
                        if (!item) return;
                        if (lockMode) {
                          e.stopPropagation();
                          toggleEquipLock(item.id);
                        } else {
                          handleStorageClick(item);
                        }
                      }}
                    >
                      {item ? (
                        <>
                          <EquipmentIcon slot={item.slot} rarity={item.rarity} variant={item.iconVariant} size={28} gemCount={item.socketedGems?.length || 0} enhanceLevel={item.enhanceLevel || 0} level={item.level} />
                          {isLocked && (
                            <span
                              className="absolute"
                              style={{
                                left: '-2px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '11px',
                                color: neonYellow,
                                textShadow: `0 0 4px ${hexToRgba(neonYellow, 0.7)}`,
                                zIndex: 5,
                                pointerEvents: 'none',
                                lineHeight: 1,
                              }}
                            >
                              🔒
                            </span>
                          )}
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

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
                {equipmentStorage.length}/{STORAGE_CAPACITY.equipment}
              </span>
              {/* 右侧：操作按钮 */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={(e) => { e.stopPropagation(); setLockMode(m => !m); }}
                  title={lockMode ? '点击仓库格子切换锁定，点击空白处解除' : '进入锁定模式'}
                  style={{
                    fontSize: '11px',
                    color: lockMode ? neonPink : (lockedEquipIds.size > 0 ? neonYellow : '#8B80A0'),
                    background: lockMode ? 'rgba(255, 0, 128, 0.15)' : (lockedEquipIds.size > 0 ? 'rgba(255, 230, 0, 0.1)' : 'rgba(19, 16, 37, 0.5)'),
                    border: `1px solid ${lockMode ? 'rgba(255, 0, 128, 0.5)' : (lockedEquipIds.size > 0 ? 'rgba(255, 230, 0, 0.3)' : 'rgba(100, 100, 130, 0.2)')}`,
                    borderRadius: '6px',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    lineHeight: 1,
                    boxShadow: lockMode ? `0 0 8px rgba(255, 0, 128, 0.3)` : 'none',
                  }}
                >
                  {lockMode ? '✕' : '🔒'}
                </button>
                <button
                  onClick={handleSortStorage}
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '8px',
                    fontWeight: 600,
                    color: neonCyan,
                    background: 'rgba(0, 245, 212, 0.1)',
                    border: '1px solid rgba(0, 245, 212, 0.3)',
                    borderRadius: '6px',
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
          </>
        ) : storageTab === 'gem' ? (
          <>
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
                {gemInventory.map(stack => {
                  const gem = GEMS[stack.itemId];
                  if (!gem) return null;
                  const count = stack.count;
                  const info = GEM_TYPE_INFO[gem.type];
                  const isSelected = selectedGem?.gemId === gem.id;
                  return (
                    <div
                      key={gem.id}
                      className={`flex flex-col items-center justify-center relative overflow-hidden cursor-pointer ${
                        isSelected ? 'ring-2 ring-[#00F5D4]' : ''
                      }`}
                      style={{
                        width: '36px',
                        height: '36px',
                        marginBottom: '1px',
                        background: GEM_RARITY_BG[gem.rarity],
                        border: `2.5px solid ${GEM_RARITY_BORDER[gem.rarity]}`,
                        borderRadius: '8px',
                      }}
                      title={`${gem.name} ×${count}`}
                      onClick={() => count > 0 && setSelectedGem({ gemId: gem.id, count })}
                    >
                      <span style={{ fontSize: '16px', filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.3))' }}>
                        {gem.icon}
                      </span>
                      {/* 左下角：宝石类型首字标识 */}
                      <span
                        className="absolute bottom-0.5 left-1"
                        style={{
                          fontFamily: '"Rajdhani", "Orbitron", monospace',
                          fontSize: '8px',
                          color: info.color,
                          fontWeight: 700,
                          textShadow: '0 0 3px rgba(0,0,0,0.8)',
                        }}
                      >
                        {info.short}
                      </span>
                      {/* 右下角：数量 */}
                      {count > 0 && (
                        <span
                          className="absolute bottom-0.5 right-0.5 text-[7px] px-1"
                          style={{
                            fontFamily: '"Rajdhani", "Orbitron", monospace',
                            color: '#0D0B1A',
                            backgroundColor: neonCyan,
                            borderRadius: '3px',
                            fontWeight: 700,
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
                {/* 空格子占位填充：仅填充至容量上限 */}
                {Array(Math.max(0, STORAGE_CAPACITY.gem - gemInventory.length)).fill(null).map((_, index) => (
                  <div
                    key={`gem-empty-${index}`}
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'rgba(19, 16, 37, 0.2)',
                      border: '2.5px solid rgba(100, 100, 130, 0.15)',
                      borderRadius: '8px',
                      opacity: 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center gap-2 pt-1" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}>
              <span style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '9px', color: '#8B80A0', fontWeight: 600, letterSpacing: '0.5px', lineHeight: 1 }}>
                {gemInventory.length}/{STORAGE_CAPACITY.gem}
              </span>
              <div className="flex gap-2">
                <button onClick={onSortClick} style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', fontWeight: 600, color: neonCyan, background: 'rgba(0, 245, 212, 0.1)', border: '1px solid rgba(0, 245, 212, 0.3)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', minWidth: '52px' }}>
                  整理
                </button>
                <button onClick={() => setShowSellPicker(true)} style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', fontWeight: 600, color: neonYellow, background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                  批量出售
                </button>
              </div>
            </div>
          </>
        ) : storageTab === 'enhance' ? (
          <>
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
                {enhanceItemInventory.map(stack => {
                  const id = stack.itemId as EnhanceItemId;
                  const def = ENHANCE_ITEMS[id];
                  if (!def) return null;
                  const count = stack.count;
                  const rarityColor = RARITY_COLORS[def.rarity] || '#9A9A9A';
                  return (
                    <div
                      key={id}
                      className="flex flex-col items-center justify-center relative cursor-pointer"
                      style={{
                        width: '36px',
                        height: '36px',
                        marginBottom: '1px',
                        background: `radial-gradient(circle at 50% 40%, ${rarityColor}33 0%, ${rarityColor}11 55%, #15122A 100%)`,
                        border: `2.5px solid ${rarityColor}`,
                        borderRadius: '8px',
                      }}
                      title={`${def.name} ×${count}\n${def.description}`}
                      onClick={() => count > 0 && setSelectedEnhanceItem({ itemId: id, count })}
                    >
                      <EnhanceItemIcon itemId={id} size={28} />
                      {/* 右下角：数量 */}
                      {count > 0 && (
                        <span
                          className="absolute bottom-0.5 right-0.5"
                          style={{
                            fontFamily: '"Rajdhani", "Orbitron", monospace',
                            fontSize: '7px',
                            color: '#0D0B1A',
                            backgroundColor: neonCyan,
                            borderRadius: '3px',
                            fontWeight: 700,
                            padding: '0 3px',
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
                {/* 空格子占位填充：仅填充至容量上限 */}
                {Array(Math.max(0, STORAGE_CAPACITY.enhance - enhanceItemInventory.length)).fill(null).map((_, index) => (
                  <div
                    key={`enhance-empty-${index}`}
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'rgba(19, 16, 37, 0.2)',
                      border: '2.5px solid rgba(100, 100, 130, 0.15)',
                      borderRadius: '8px',
                      opacity: 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center gap-2 pt-1" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}>
              <span style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '9px', color: '#8B80A0', fontWeight: 600, letterSpacing: '0.5px', lineHeight: 1 }}>
                {enhanceItemInventory.length}/{STORAGE_CAPACITY.enhance}
              </span>
              <div className="flex gap-2">
                <button onClick={onSortClick} style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', fontWeight: 600, color: neonCyan, background: 'rgba(0, 245, 212, 0.1)', border: '1px solid rgba(0, 245, 212, 0.3)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', minWidth: '52px' }}>
                  整理
                </button>
                <button onClick={() => setShowSellPicker(true)} style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', fontWeight: 600, color: neonYellow, background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                  批量出售
                </button>
              </div>
            </div>
          </>
        ) : storageTab === 'enchant' ? (
          <>
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
                {enchantItemInventory.map(stack => {
                  const id = stack.itemId as EnchantItemId;
                  const def = ENCHANT_ITEMS[id];
                  if (!def) return null;
                  const count = stack.count;
                  const rarityColor = RARITY_COLORS[def.rarity] || '#9A9A9A';
                  const statColor = ENCHANT_STAT_INFO[def.stat].color;
                  return (
                    <div
                      key={id}
                      className="flex flex-col items-center justify-center relative cursor-pointer"
                      style={{
                        width: '36px',
                        height: '36px',
                        marginBottom: '1px',
                        background: `radial-gradient(circle at 50% 40%, ${rarityColor}33 0%, ${rarityColor}11 55%, #15122A 100%)`,
                        border: `2.5px solid ${rarityColor}`,
                        borderRadius: '8px',
                      }}
                      title={`${def.name} ×${count}\n${def.description}`}
                      onClick={() => count > 0 && setSelectedEnchantItem({ itemId: id, count })}
                    >
                      <EnchantItemIcon itemId={id} size={28} />
                      {/* 左下角：属性首字标识 */}
                      <span
                        className="absolute bottom-0.5 left-0.5"
                        style={{
                          fontFamily: '"Rajdhani", "Orbitron", monospace',
                          fontSize: '7px',
                          color: statColor,
                          fontWeight: 700,
                          textShadow: '0 0 3px rgba(0,0,0,0.8)',
                        }}
                      >
                        {ENCHANT_STAT_INFO[def.stat].label}
                      </span>
                      {/* 右下角：数量 */}
                      {count > 0 && (
                        <span
                          className="absolute bottom-0.5 right-0.5"
                          style={{
                            fontFamily: '"Rajdhani", "Orbitron", monospace',
                            fontSize: '7px',
                            color: '#0D0B1A',
                            backgroundColor: neonCyan,
                            borderRadius: '3px',
                            fontWeight: 700,
                            padding: '0 3px',
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
                {/* 空格子占位填充：仅填充至容量上限 */}
                {Array(Math.max(0, STORAGE_CAPACITY.enchant - enchantItemInventory.length)).fill(null).map((_, index) => (
                  <div
                    key={`enchant-empty-${index}`}
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'rgba(19, 16, 37, 0.2)',
                      border: '2.5px solid rgba(100, 100, 130, 0.15)',
                      borderRadius: '8px',
                      opacity: 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center gap-2 pt-1" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}>
              <span style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '9px', color: '#8B80A0', fontWeight: 600, letterSpacing: '0.5px', lineHeight: 1 }}>
                {enchantItemInventory.length}/{STORAGE_CAPACITY.enchant}
              </span>
              <div className="flex gap-2">
                <button onClick={onSortClick} style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', fontWeight: 600, color: neonCyan, background: 'rgba(0, 245, 212, 0.1)', border: '1px solid rgba(0, 245, 212, 0.3)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', minWidth: '52px' }}>
                  整理
                </button>
                <button onClick={() => setShowSellPicker(true)} style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', fontWeight: 600, color: neonYellow, background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                  批量出售
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* 选中物品弹窗 */}
      {selectedItem && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={handleClose}
        >
          <div
            className="w-72 flex flex-col"
            style={{
              ...cardStyle,
              padding: '12px 14px',
              height: '230px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center relative flex-shrink-0"
                  style={{ width: '36px', height: '36px', ...itemSlotStyle(selectedItem.equipment.rarity) }}
                >
                  <EquipmentIcon slot={selectedItem.equipment.slot} rarity={selectedItem.equipment.rarity} variant={selectedItem.equipment.iconVariant} size={28} gemCount={selectedItem.equipment.socketedGems?.length || 0} enhanceLevel={selectedItem.equipment.enhanceLevel || 0} level={selectedItem.equipment.level} />
                </div>
                <div className="min-w-0">
                  <div
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: RARITY_COLORS[selectedItem.equipment.rarity as keyof typeof RARITY_COLORS] || neonCyan,
                      textShadow: `0 0 6px ${RARITY_COLORS[selectedItem.equipment.rarity as keyof typeof RARITY_COLORS] || neonCyan}60`,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {getRarityName(selectedItem.equipment.rarity)} {selectedItem.equipment.name}
                  </div>
                  <div
                    className="flex items-center gap-1.5"
                    style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '7px', color: '#8B80A0', marginTop: '1px' }}
                  >
                    <span>{SLOT_LABELS[selectedItem.equipment.slot as keyof typeof SLOT_LABELS]}</span>
                    <span style={{ color: neonYellow, fontWeight: 700 }}>Lv.{selectedItem.equipment.level}</span>
                  </div>
                </div>
              </div>
              {/* 右上角：关闭按钮 + 售价 + 耐久度（售价与耐久度紧贴） */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
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
                  onClick={handleClose}
                >
                  ×
                </button>
                <div className="flex flex-col items-end" style={{ gap: '1px' }}>
                  {selectedItem.source === 'storage' && (
                    <div className="flex justify-between gap-2" style={{ minWidth: '80px' }}>
                      <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>售价</span>
                      <span style={{ ...neonText, fontSize: '7px', color: '#FFD700', fontWeight: 700 }}>
                        {raritySellMap[selectedItem.equipment.rarity]}金币
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between gap-2" style={{ minWidth: '80px' }}>
                    <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>耐久度</span>
                    <span
                      style={{
                        ...neonText,
                        fontSize: '7px',
                        color: selectedItem.equipment.durability > (selectedItem.equipment.maxDurability || 100) * 0.3 ? neonCyan : '#FF2D55',
                      }}
                    >
                      {selectedItem.equipment.durability}/{selectedItem.equipment.maxDurability || 100}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 主属性 + 词条：三列紧凑布局 */}
            <div
              className="flex-1 overflow-y-auto pt-2"
              style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}
            >
              <div className="grid grid-cols-3 gap-x-2 gap-y-0.5">
                {selectedItem.equipment.attack && selectedItem.equipment.attack > 0 && (
                  <EquipStatRow label="攻击" value={`+${selectedItem.equipment.attack}`} color={neonPink} />
                )}
                {selectedItem.equipment.health && selectedItem.equipment.health > 0 && (
                  <EquipStatRow label="生命" value={`+${selectedItem.equipment.health}`} color="#34C759" />
                )}
                {selectedItem.equipment.defense && selectedItem.equipment.defense > 0 && (
                  <EquipStatRow label="防御" value={`+${selectedItem.equipment.defense}`} color="#5BA3E0" />
                )}
                {selectedItem.equipment.attackSpeed && selectedItem.equipment.attackSpeed !== 0 && (
                  <EquipStatRow label="攻速" value={`${selectedItem.equipment.attackSpeed > 0 ? '+' : ''}${selectedItem.equipment.attackSpeed}%`} color={neonCyan} />
                )}
                {selectedItem.equipment.critRate && selectedItem.equipment.critRate > 0 && (
                  <EquipStatRow label="暴击" value={`+${selectedItem.equipment.critRate}%`} color={neonPurple} />
                )}
                {selectedItem.equipment.critDamage && selectedItem.equipment.critDamage > 0 && (
                  <EquipStatRow label="暴伤" value={`+${selectedItem.equipment.critDamage}%`} color={neonPurple} />
                )}
                {selectedItem.equipment.range && selectedItem.equipment.range > 0 && (
                  <EquipStatRow label="射程" value={`+${selectedItem.equipment.range}`} color="#34C759" />
                )}
                {selectedItem.equipment.element && selectedItem.equipment.elementalDamage ? (
                  <EquipStatRow
                    label={`${selectedItem.equipment.element === 'fire' ? '火' : selectedItem.equipment.element === 'ice' ? '冰' : selectedItem.equipment.element === 'lightning' ? '雷' : '毒'}属性`}
                    value={`+${selectedItem.equipment.elementalDamage}`}
                    color={selectedItem.equipment.element === 'fire' ? '#FF6B35' : selectedItem.equipment.element === 'ice' ? '#5BC0EB' : selectedItem.equipment.element === 'lightning' ? '#FFD700' : '#9B59B6'}
                  />
                ) : null}
              </div>

              {/* 词条 */}
              {selectedItem.equipment.affixes && selectedItem.equipment.affixes.length > 0 && (
                <div className="mt-1.5 pt-1 grid grid-cols-3 gap-x-2 gap-y-0.5" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.1)' }}>
                  {selectedItem.equipment.affixes.map((a, i) => {
                    const getColor = () => {
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
                          return a.element === 'fire' ? '#FF6B35' : a.element === 'ice' ? '#5BC0EB' : a.element === 'lightning' ? '#FFD700' : '#9B59B6';
                        case 'elementalDamage':
                          return a.element === 'fire' ? '#FF6B35' : a.element === 'ice' ? '#5BC0EB' : a.element === 'lightning' ? '#FFD700' : '#9B59B6';
                        case 'statusFreeze': return '#5BC0EB';
                        case 'statusPoison': return '#9B59B6';
                        case 'statusBurn': return '#FF6B35';
                        default: return '#E0E0FF';
                      }
                    };
                    const getLabel = () => {
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
                        case 'elementalAttack': return `${a.element === 'fire' ? '火攻' : a.element === 'ice' ? '冰攻' : a.element === 'lightning' ? '雷攻' : '毒攻'}`;
                        case 'elementalDamage': return `${a.element === 'fire' ? '火伤' : a.element === 'ice' ? '冰伤' : a.element === 'lightning' ? '雷伤' : '毒伤'}`;
                        case 'statusFreeze': return '冰冻';
                        case 'statusPoison': return '中毒';
                        case 'statusBurn': return '灼烧';
                        default: return a.type;
                      }
                    };
                    const isPercent = a.type === 'critRate' || a.type === 'critDamage' || a.type === 'attackSpeed' || a.type === 'statusFreeze' || a.type === 'statusPoison' || a.type === 'statusBurn';
                    return (
                      <div key={i} className="flex justify-between min-w-0">
                        <span
                          className="truncate"
                          style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '6.5px', color: getColor() }}
                        >
                          {getLabel()}
                        </span>
                        <span
                          style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '6.5px', color: '#FFFFFF', flexShrink: 0, marginLeft: '4px' }}
                        >
                          +{a.value}{isPercent ? '%' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 强化 / 宝石 / 附魔：3 panel 对齐，与上方属性行布局一致 */}
            {(() => {
              const gems = selectedItem.equipment.socketedGems || [];
              const cnt = gems.length;
              const stats = { attack: 0, health: 0, defense: 0, critRate: 0, resistance: 0 };
              for (const g of gems) stats[g.type] += g.value;
              const hasGem = cnt > 0;
              const enhanceLevel = selectedItem.equipment.enhanceLevel || 0;
              const enhanceBonus = getEnhanceAttackBonus(enhanceLevel);
              const hasEnhance = enhanceLevel > 0;
              const ench = selectedItem.equipment.enchantment;
              return (
                <div className="grid grid-cols-3 gap-x-2 mt-1" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)', paddingTop: '4px' }}>
                  {/* 强化 */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between min-w-0">
                      <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>强化</span>
                      {hasEnhance && (
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
                      {hasGem && (
                        <span style={{ ...neonText, fontSize: '7px', lineHeight: 1.2, marginLeft: '4px' }}>
                          {stats.attack > 0 && <span style={{ color: neonPink }}>攻击+{stats.attack} </span>}
                          {stats.health > 0 && <span style={{ color: '#FF2D55' }}>生命+{stats.health} </span>}
                          {stats.defense > 0 && <span style={{ color: '#5BA3E0' }}>防御+{stats.defense} </span>}
                          {stats.critRate > 0 && <span style={{ color: neonPurple }}>暴击率+{stats.critRate}% </span>}
                          {stats.resistance > 0 && <span style={{ color: '#5BA3E0' }}>抗性+{stats.resistance}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 附魔 */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between min-w-0">
                      <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>附魔</span>
                      {ench && (
                        <span style={{ ...neonText, fontSize: '7px', marginLeft: '4px' }}>
                          <span style={{ color: ENCHANT_STAT_INFO[ench.stat].color }}>
                            {ENCHANT_STAT_INFO[ench.stat].name}
                          </span>
                          <span style={{ color: '#FFFFFF' }}>+{ench.percent}%</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 操作按钮 */}
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.1)' }}>
              <div className="flex justify-between gap-1.5">
                {selectedItem.source === 'storage' && (
                  <button
                    className="flex-1 px-2 py-1.5"
                    style={{
                      background: 'rgba(0, 245, 212, 0.15)',
                      border: '1px solid rgba(0, 245, 212, 0.3)',
                      borderRadius: '6px',
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '8px',
                      fontWeight: 600,
                      color: neonCyan,
                      boxShadow: '0 0 8px rgba(0, 245, 212, 0.1)',
                      cursor: 'pointer',
                    }}
                    onClick={handleEquip}
                  >
                    装备
                  </button>
                )}
                <button
                  className="flex-1 px-2 py-1.5"
                  style={{
                    background: 'rgba(0, 255, 157, 0.15)',
                    border: '1px solid rgba(0, 255, 157, 0.4)',
                    borderRadius: '6px',
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '8px',
                    fontWeight: 600,
                    color: '#00FF9D',
                    boxShadow: '0 0 8px rgba(0, 255, 157, 0.15)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowEmbedModal(true)}
                >
                  镶嵌
                </button>
                <button
                  className="flex-1 px-2 py-1.5"
                  style={{
                    background: 'rgba(255, 215, 0, 0.15)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '6px',
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '8px',
                    fontWeight: 600,
                    color: '#FFD700',
                    boxShadow: '0 0 8px rgba(255, 215, 0, 0.1)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowEnhanceModal(true)}
                >
                  强化
                </button>
                <button
                  className="flex-1 px-2 py-1.5"
                  style={{
                    background: 'rgba(176, 38, 255, 0.15)',
                    border: '1px solid rgba(176, 38, 255, 0.3)',
                    borderRadius: '6px',
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '8px',
                    fontWeight: 600,
                    color: '#B026FF',
                    boxShadow: '0 0 8px rgba(176, 38, 255, 0.1)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowEnchantModal(true)}
                >
                  附魔
                </button>
                {selectedItem.source === 'equipped' && (
                  <button
                    className="flex-1 px-2 py-1.5"
                    style={{
                      background: 'rgba(255, 0, 128, 0.15)',
                      border: '1px solid rgba(255, 0, 128, 0.3)',
                      borderRadius: '6px',
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '8px',
                      fontWeight: 600,
                      color: neonPink,
                      boxShadow: '0 0 8px rgba(255, 0, 128, 0.1)',
                      cursor: 'pointer',
                    }}
                    onClick={handleUnequip}
                  >
                    卸下
                  </button>
                )}
                {selectedItem.source === 'storage' && (
                  <button
                    className="flex-1 px-2 py-1.5"
                    style={{
                      background: 'rgba(255, 215, 0, 0.15)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '6px',
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '8px',
                      fontWeight: 600,
                      color: '#FFD700',
                      boxShadow: '0 0 8px rgba(255, 215, 0, 0.1)',
                      cursor: 'pointer',
                    }}
                    onClick={handleScrap}
                  >
                    出售
                  </button>
                )}
              </div>
              {selectedItem.source === 'storage' && player && player.level < selectedItem.equipment.level && (
                <div className="text-right mt-2">
                  <span style={{ ...neonText, fontSize: '8px', color: '#FF2D55' }}>
                    需要 Lv.{selectedItem.equipment.level}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 锁定提示 toast */}
      {lockToast && (
        <div
          className="absolute left-1/2 top-2 z-40"
          style={{
            transform: 'translateX(-50%)',
            fontFamily: '"Rajdhani", "Orbitron", monospace',
            fontSize: '10px',
            fontWeight: 600,
            color: neonPink,
            background: 'rgba(40, 10, 25, 0.9)',
            border: `1px solid ${hexToRgba(neonPink, 0.5)}`,
            borderRadius: '6px',
            padding: '4px 10px',
            boxShadow: `0 0 10px ${hexToRgba(neonPink, 0.3)}`,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {lockToast}
        </div>
      )}

      {/* 锁定模式遮罩提示 */}
      {lockMode && (
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255, 0, 128, 0.04) 8px, rgba(255, 0, 128, 0.04) 16px)',
            borderRadius: '12px',
          }}
        />
      )}

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
              {(['mythic', 'epic', 'legendary', 'fine', 'advanced', 'common'] as EquipRarity[]).map(q => {
                const checked = sellQualities.has(q);
                const stat = qualityStats[q] || { count: 0, gold: 0 };
                const count = stat.count;
                const gold = stat.gold;
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
                          border: `1.5px solid ${RARITY_COLORS[q]}`,
                          background: checked ? RARITY_COLORS[q] : 'transparent',
                          boxShadow: checked ? `0 0 4px ${RARITY_COLORS[q]}` : 'none',
                        }}
                      />
                      <span style={{ ...neonText, fontSize: '9px', color: RARITY_COLORS[q], fontWeight: 700 }}>
                        {RARITY_LABELS[q]}
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
              onClick={onBatchSellClick}
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
                boxShadow: sellPreview.count > 0 ? `0 0 8px ${neonYellow}66` : 'none',
              }}
            >
              确认出售
            </button>
          </div>
        </div>
      )}

      {/* 宝石镶嵌弹窗 */}
      {showEmbedModal && selectedItem && (
        <GemEmbedModal
          equipmentId={selectedItem.equipment.id}
          source={selectedItem.source}
          onClose={() => setShowEmbedModal(false)}
          engineRef={engineRef as GameEngineRef}
        />
      )}

      {/* 装备强化弹窗 */}
      {showEnhanceModal && selectedItem && (
        <EnhanceModal
          equipmentId={selectedItem.equipment.id}
          source={selectedItem.source}
          onClose={() => setShowEnhanceModal(false)}
          engineRef={engineRef as GameEngineRef}
        />
      )}

      {/* 装备附魔弹窗 */}
      {showEnchantModal && selectedItem && (
        <EnchantModal
          equipmentId={selectedItem.equipment.id}
          source={selectedItem.source}
          onClose={() => setShowEnchantModal(false)}
          engineRef={engineRef as GameEngineRef}
        />
      )}

      {/* 宝石详情弹窗（与物品栏弹窗一致的结构） */}
      {selectedGem && (() => {
        const def = getGemDef(selectedGem.gemId);
        if (!def) return null;
        const info = GEM_TYPE_INFO[def.type];
        return (
          <div
            className="absolute inset-0 flex items-center justify-center z-20"
            style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedGem(null)}
          >
            <div
              className="relative w-64 p-4"
              style={{
                background: 'rgba(19, 16, 37, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(176, 38, 255, 0.25)',
                borderRadius: '12px',
                boxShadow: '0 0 20px rgba(176, 38, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
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
                onClick={() => setSelectedGem(null)}
              >
                X
              </button>

              {/* 图标 + 名称 + 品质/数量 */}
              <div className="flex items-center gap-3 mb-3 pr-8">
                <div
                  className="w-12 h-12 flex items-center justify-center relative"
                  style={{
                    background: GEM_RARITY_BG[def.rarity],
                    border: `2.5px solid ${GEM_RARITY_BORDER[def.rarity]}`,
                    borderRadius: '8px',
                  }}
                >
                  <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.4))' }}>
                    {def.icon}
                  </span>
                  {/* 左下角首字标识 */}
                  <span
                    className="absolute bottom-0.5 left-1"
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '9px',
                      color: info.color,
                      fontWeight: 700,
                      textShadow: '0 0 3px rgba(0,0,0,0.8)',
                    }}
                  >
                    {info.short}
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: GEM_RARITY_BORDER[def.rarity],
                      textShadow: `0 0 6px ${GEM_RARITY_BORDER[def.rarity]}60`,
                    }}
                  >
                    {def.name}
                  </div>
                  <div
                    className="mt-1"
                    style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', color: '#8B80A0' }}
                  >
                    {GEM_RARITY_LABELS[def.rarity]} · 数量 {selectedGem.count}
                  </div>
                </div>
              </div>

              {/* 描述 */}
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
                  {def.description}
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '7.5px',
                    color: info.color,
                    lineHeight: '1.5',
                  }}
                >
                  类型：{info.name} · 可镶嵌至装备的宝石槽中
                </p>
              </div>

              {/* 操作按钮：丢弃 */}
              <div className="flex gap-2 justify-end flex-wrap">
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
                  onClick={() => {
                    // 丢弃：从宝石背包中扣除 1 颗
                    const next = gemInventory
                      .map(g => g.itemId === selectedGem.gemId ? { ...g, count: g.count - 1 } : g)
                      .filter(g => g.count > 0);
                    setGemInventory(next);
                    if (engineRef?.current) {
                      // 同步到引擎
                      (engineRef.current as any).syncGemInventory?.(next);
                    }
                    setSelectedGem(null);
                  }}
                >
                  丢弃
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 强化道具详情弹窗（与宝石详情弹窗结构一致） */}
      {selectedEnhanceItem && (() => {
        const def = getEnhanceItemDef(selectedEnhanceItem.itemId);
        if (!def) return null;
        const rarityColor = RARITY_COLORS[def.rarity] || '#9A9A9A';
        const rarityLabel = RARITY_LABELS[def.rarity] || '普通';
        return (
          <div
            className="absolute inset-0 flex items-center justify-center z-20"
            style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedEnhanceItem(null)}
          >
            <div
              className="relative w-64 p-4"
              style={{
                background: 'rgba(19, 16, 37, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(176, 38, 255, 0.25)',
                borderRadius: '12px',
                boxShadow: '0 0 20px rgba(176, 38, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
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
                onClick={() => setSelectedEnhanceItem(null)}
              >
                X
              </button>

              {/* 图标 + 名称 + 品质/数量 */}
              <div className="flex items-center gap-3 mb-3 pr-8">
                <div
                  className="w-12 h-12 flex items-center justify-center relative"
                  style={{
                    background: `radial-gradient(circle at 50% 40%, ${rarityColor}33 0%, ${rarityColor}11 55%, #15122A 100%)`,
                    border: `2.5px solid ${rarityColor}`,
                    borderRadius: '8px',
                  }}
                >
                  <EnhanceItemIcon itemId={def.id} size={32} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: rarityColor,
                      textShadow: `0 0 6px ${rarityColor}60`,
                    }}
                  >
                    {def.name}
                  </div>
                  <div
                    className="mt-1"
                    style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', color: '#8B80A0' }}
                  >
                    {rarityLabel} · 数量 {selectedEnhanceItem.count}
                  </div>
                </div>
              </div>

              {/* 描述 */}
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
                  {def.description}
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '7.5px',
                    color: neonYellow,
                    lineHeight: '1.5',
                  }}
                >
                  类型：{def.mode === 'scroll' ? '强化卷轴' : '强化器'} · 可在装备强化界面使用
                </p>
              </div>

              {/* 操作按钮：丢弃 */}
              <div className="flex gap-2 justify-end flex-wrap">
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
                  onClick={() => {
                    // 丢弃：从强化道具背包中扣除 1 个
                    const next = enhanceItemInventory
                      .map(s => s.itemId === selectedEnhanceItem.itemId ? { ...s, count: s.count - 1 } : s)
                      .filter(s => s.count > 0);
                    useGameStore.setState({ enhanceItemInventory: next });
                    if (engineRef?.current) {
                      (engineRef.current as any).syncEnhanceItemInventory?.(next);
                    }
                    setSelectedEnhanceItem(null);
                  }}
                >
                  丢弃
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 附魔书详情弹窗（与强化道具详情弹窗结构一致） */}
      {selectedEnchantItem && (() => {
        const def = getEnchantItemDef(selectedEnchantItem.itemId);
        if (!def) return null;
        const rarityColor = RARITY_COLORS[def.rarity] || '#9A9A9A';
        const rarityLabel = RARITY_LABELS[def.rarity] || '普通';
        const statName = ENCHANT_STAT_INFO[def.stat].name;
        const statColor = ENCHANT_STAT_INFO[def.stat].color;
        return (
          <div
            className="absolute inset-0 flex items-center justify-center z-20"
            style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedEnchantItem(null)}
          >
            <div
              className="relative w-64 p-4"
              style={{
                background: 'rgba(19, 16, 37, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(176, 38, 255, 0.25)',
                borderRadius: '12px',
                boxShadow: '0 0 20px rgba(176, 38, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
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
                onClick={() => setSelectedEnchantItem(null)}
              >
                X
              </button>

              {/* 图标 + 名称 + 品质/数量 */}
              <div className="flex items-center gap-3 mb-3 pr-8">
                <div
                  className="w-12 h-12 flex items-center justify-center relative"
                  style={{
                    background: `radial-gradient(circle at 50% 40%, ${rarityColor}33 0%, ${rarityColor}11 55%, #15122A 100%)`,
                    border: `2.5px solid ${rarityColor}`,
                    borderRadius: '8px',
                  }}
                >
                  <EnchantItemIcon itemId={def.id} size={32} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: rarityColor,
                      textShadow: `0 0 6px ${rarityColor}60`,
                    }}
                  >
                    {def.name}
                  </div>
                  <div
                    className="mt-1"
                    style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', color: '#8B80A0' }}
                  >
                    {rarityLabel} · 数量 {selectedEnchantItem.count}
                  </div>
                </div>
              </div>

              {/* 属性加成 */}
              <div
                className="pt-2 mb-3"
                style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}
              >
                <div className="flex justify-between items-center">
                  <span style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '8px', color: statColor, fontWeight: 700 }}>
                    {statName}
                  </span>
                  <span style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '9px', color: '#FFFFFF', fontWeight: 700 }}>
                    +{def.percent}%
                  </span>
                </div>
                <p
                  className="mt-2"
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '7.5px',
                    color: '#B0A8C8',
                    lineHeight: '1.5',
                  }}
                >
                  {def.description}
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '7.5px',
                    color: neonYellow,
                    lineHeight: '1.5',
                  }}
                >
                  可在装备附魔界面使用 · 2 本可合成 1 本高一级品质
                </p>
              </div>

              {/* 操作按钮：丢弃 */}
              <div className="flex gap-2 justify-end flex-wrap">
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
                  onClick={() => {
                    // 丢弃：从附魔书背包中扣除 1 本
                    const next = enchantItemInventory
                      .map(s => s.itemId === selectedEnchantItem.itemId ? { ...s, count: s.count - 1 } : s)
                      .filter(s => s.count > 0);
                    useGameStore.setState({ enchantItemInventory: next });
                    if (engineRef?.current) {
                      (engineRef.current as any).syncEnchantItemInventory?.(next);
                    }
                    setSelectedEnchantItem(null);
                  }}
                >
                  丢弃
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// 性能优化：memo 包装
const EquipmentPanel = React.memo(EquipmentPanelImpl);
export { EquipmentPanel };

function EquipStatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between min-w-0">
      <span className="truncate" style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '7px', color }}>{label}</span>
      <span style={{ fontFamily: '"Rajdhani", "Orbitron", monospace', fontSize: '7px', color: '#FFFFFF', flexShrink: 0, marginLeft: '4px' }}>{value}</span>
    </div>
  );
}
