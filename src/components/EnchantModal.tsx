import { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { EquipmentIcon } from './EquipmentIcon';
import { EnchantItemIcon } from './EnchantItemIcon';
import {
  ENCHANT_ITEMS,
  ENCHANT_ITEM_ORDER,
  ENCHANT_STAT_INFO,
  ENCHANT_STAT_ORDER,
  ENCHANT_RARITY_LABELS,
  RARITY_PERCENT,
  getEnchantItemDef,
  getUpgradeEnchantId,
  ENCHANT_SYNTH_COST,
} from '../game/data/enchantItems';
import type { EnchantItemId, EnchantStat } from '../game/data/enchantItems';
import { RARITY_COLORS } from '../game/data/equipment';

const neonCyan = '#00F5D4';
const neonPurple = '#B026FF';
const neonPink = '#FF0080';
const neonYellow = '#FFE600';
const neonGreen = '#00FF9D';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const cardStyle = {
  background: 'rgba(19, 16, 37, 0.95)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(176, 38, 255, 0.35)',
  borderRadius: '12px',
  boxShadow: '0 0 24px rgba(176, 38, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const neonText: React.CSSProperties = {
  fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
  fontWeight: 600,
  letterSpacing: '0.5px',
};

interface GameEngineRef {
  current: {
    enchantEquipment: (
      equipmentId: string,
      source: 'equipped' | 'storage',
      itemId: string
    ) => { success: boolean; reason?: string; stat?: EnchantStat; percent?: number } | null;
    synthEnchantItem: (
      itemId: string
    ) => { success: boolean; reason?: string; newItemId?: string } | null;
  } | null;
}

interface EnchantModalProps {
  equipmentId: string;
  source: 'equipped' | 'storage';
  onClose: () => void;
  engineRef: GameEngineRef;
}

export function EnchantModal({ equipmentId, source, onClose, engineRef }: EnchantModalProps) {
  const enchantItemInventory = useGameStore(s => s.enchantItemInventory);
  const equipmentFromStore = useGameStore(s =>
    source === 'equipped'
      ? s.equipment.find(e => e.id === equipmentId)
      : s.equipmentStorage.find(e => e.id === equipmentId)
  );
  const [selectedItemId, setSelectedItemId] = useState<EnchantItemId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [floatToast, setFloatToast] = useState<{ success: boolean; message: string } | null>(null);
  const [toastKey, setToastKey] = useState(0);

  const equipment = equipmentFromStore;
  if (!equipment) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center z-30"
        style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
    );
  }

  const currentEnchant = equipment.enchantment;

  // 按属性分组：每种属性下 6 个品质的库存
  const groupedItems = useMemo(() => {
    return ENCHANT_STAT_ORDER.map(stat => {
      const stacks = ENCHANT_ITEM_ORDER
        .filter(id => {
          const def = ENCHANT_ITEMS[id];
          return def.stat === stat;
        })
        .map(id => {
          const def = ENCHANT_ITEMS[id];
          const stack = enchantItemInventory.find(s => s.itemId === id);
          return { def, count: stack?.count ?? 0 };
        })
        .filter(x => x.count > 0);
      return { stat, stacks };
    }).filter(g => g.stacks.length > 0);
  }, [enchantItemInventory]);

  // 选中道具
  const selectedItem = selectedItemId ? ENCHANT_ITEMS[selectedItemId] : null;
  const selectedItemCount = selectedItem
    ? (enchantItemInventory.find(s => s.itemId === selectedItem.id)?.count ?? 0)
    : 0;
  const canSynth = selectedItem ? selectedItemCount >= ENCHANT_SYNTH_COST && !!getUpgradeEnchantId(selectedItem.id) : false;

  const handleEnchant = () => {
    if (isProcessing || !selectedItemId) return;
    setIsProcessing(true);
    setTimeout(() => {
      const ret = engineRef.current?.enchantEquipment(equipment.id, source, selectedItemId);
      setIsProcessing(false);
      if (!ret) {
        setToastKey(k => k + 1);
        setFloatToast({ success: false, message: '引擎未就绪' });
        return;
      }
      if (ret.success) {
        const statName = ret.stat ? ENCHANT_STAT_INFO[ret.stat].name : '';
        setToastKey(k => k + 1);
        setFloatToast({ success: true, message: `✦ 附魔成功 ${statName}+${ret.percent}% ✦` });
      } else {
        setToastKey(k => k + 1);
        setFloatToast({ success: false, message: ret.reason || '附魔失败' });
      }
    }, 300);
  };

  const handleSynth = () => {
    if (isProcessing || !selectedItemId || !canSynth) return;
    setIsProcessing(true);
    setTimeout(() => {
      const ret = engineRef.current?.synthEnchantItem(selectedItemId);
      setIsProcessing(false);
      if (!ret) {
        setToastKey(k => k + 1);
        setFloatToast({ success: false, message: '引擎未就绪' });
        return;
      }
      if (ret.success) {
        setToastKey(k => k + 1);
        setFloatToast({ success: true, message: `✦ 合成成功 ✦` });
      } else {
        setToastKey(k => k + 1);
        setFloatToast({ success: false, message: ret.reason || '合成失败' });
      }
    }, 300);
  };

  useEffect(() => {
    if (!floatToast) return;
    const duration = floatToast.success ? 1100 : 1000;
    const id = setTimeout(() => setFloatToast(null), duration);
    return () => clearTimeout(id);
  }, [floatToast]);

  const rarityColor = RARITY_COLORS[equipment.rarity] || '#9A9A9A';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-30"
      style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col"
        style={{
          ...cardStyle,
          width: '340px',
          padding: '8px 10px',
          maxHeight: '90%',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-1.5" style={{ flexShrink: 0 }}>
          <span style={{ ...neonText, fontSize: '11px', color: neonPurple, fontWeight: 700, letterSpacing: '1px' }}>
            ✦ 装备附魔
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 45, 85, 0.2)',
              border: '1px solid rgba(255, 45, 85, 0.4)',
              color: '#FF2D55',
              width: '18px',
              height: '18px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '4px',
              fontFamily: '"Rajdhani", "Orbitron", monospace',
            }}
          >
            ×
          </button>
        </div>

        {/* 主体：左右分栏 */}
        <div className="flex gap-2" style={{ flex: 1, minHeight: 0 }}>
          {/* 左侧：装备图标 + 附魔名称 + 装饰框 */}
          <div className="flex flex-col gap-1.5" style={{ width: '140px', flexShrink: 0 }}>
            <div className="flex gap-1.5 items-start">
              <div
                className="flex items-center justify-center relative flex-shrink-0"
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'radial-gradient(circle at 50% 40%, #2A2540 0%, #1E1A35 55%, #15122A 100%)',
                  border: `2.5px solid ${hexToRgba(rarityColor, 0.5)}`,
                  borderRadius: '8px',
                }}
              >
                <EquipmentIcon slot={equipment.slot} rarity={equipment.rarity} variant={equipment.iconVariant} size={28} gemCount={equipment.socketedGems?.length || 0} enhanceLevel={equipment.enhanceLevel || 0} level={equipment.level} />
              </div>
              {/* 装备名 + 当前附魔 */}
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    ...neonText,
                    fontSize: '7px',
                    color: rarityColor,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    wordBreak: 'break-all',
                    marginBottom: '1px',
                  }}
                >
                  {equipment.name}
                </div>
                {(() => {
                  if (!currentEnchant) {
                    return (
                      <div style={{ ...neonText, fontSize: '7px', color: '#5A5A7A', lineHeight: 1.2 }}>
                        未附魔
                      </div>
                    );
                  }
                  const statName = ENCHANT_STAT_INFO[currentEnchant.stat].name;
                  const statColor = ENCHANT_STAT_INFO[currentEnchant.stat].color;
                  return (
                    <div className="flex justify-between" style={{ lineHeight: 1.2 }}>
                      <span style={{ ...neonText, fontSize: '7px', color: statColor }}>{statName}</span>
                      <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF' }}>+{currentEnchant.percent}%</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 装饰框 - 与镶嵌/强化界面位置一致 */}
            <div
              style={{
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '0 6px',
                background: `linear-gradient(90deg, ${hexToRgba(neonPurple, 0.05)} 0%, ${hexToRgba(neonCyan, 0.12)} 50%, ${hexToRgba(neonPurple, 0.05)} 100%)`,
                borderRadius: '3px',
                border: `1px solid ${hexToRgba(neonPurple, 0.3)}`,
                boxShadow: `inset 0 0 8px ${hexToRgba(neonPurple, 0.08)}`,
              }}
            >
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: neonPurple, boxShadow: `0 0 4px ${neonPurple}` }} />
              <span style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${hexToRgba(neonPurple, 0.4)}, ${hexToRgba(neonCyan, 0.4)}, ${hexToRgba(neonPurple, 0.4)})` }} />
              <span style={{
                width: '4px',
                height: '4px',
                background: neonCyan,
                transform: 'rotate(45deg)',
                boxShadow: `0 0 4px ${hexToRgba(neonCyan, 0.6)}`,
              }} />
              <span style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${hexToRgba(neonPurple, 0.4)}, ${hexToRgba(neonCyan, 0.4)}, ${hexToRgba(neonPurple, 0.4)})` }} />
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: neonPurple, boxShadow: `0 0 4px ${neonPurple}` }} />
            </div>

            {/* 选中附魔书信息 */}
            <div
              style={{
                padding: '4px 6px',
                background: 'rgba(19, 16, 37, 0.5)',
                border: '1px solid rgba(100, 100, 130, 0.2)',
                borderRadius: '4px',
                minHeight: '36px',
              }}
            >
              {selectedItem ? (
                <>
                  <div style={{ ...neonText, fontSize: '7px', color: RARITY_COLORS[selectedItem.rarity], fontWeight: 700, lineHeight: 1.2, marginBottom: '2px', wordBreak: 'break-all' }}>
                    {selectedItem.name}
                  </div>
                  <div className="flex justify-between" style={{ lineHeight: 1.2 }}>
                    <span style={{ ...neonText, fontSize: '7px', color: ENCHANT_STAT_INFO[selectedItem.stat].color }}>
                      {ENCHANT_STAT_INFO[selectedItem.stat].name}
                    </span>
                    <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF' }}>+{selectedItem.percent}%</span>
                  </div>
                  <div className="flex justify-between mt-0.5" style={{ lineHeight: 1.2 }}>
                    <span style={{ ...neonText, fontSize: '6.5px', color: '#8B80A0' }}>持有</span>
                    <span style={{ ...neonText, fontSize: '6.5px', color: neonYellow, fontWeight: 700 }}>×{selectedItemCount}</span>
                  </div>
                </>
              ) : (
                <div style={{ ...neonText, fontSize: '7px', color: '#5A5A7A', textAlign: 'center', lineHeight: '36px' }}>
                  请选择附魔书
                </div>
              )}
            </div>
          </div>

          {/* 竖线分隔符 */}
          <div
            aria-hidden
            style={{
              width: '1px',
              alignSelf: 'stretch',
              background: 'linear-gradient(to bottom, rgba(176, 38, 255, 0.05), rgba(176, 38, 255, 0.5) 20%, rgba(0, 245, 212, 0.4) 80%, rgba(0, 245, 212, 0.05))',
              boxShadow: '0 0 4px rgba(176, 38, 255, 0.3)',
              flexShrink: 0,
            }}
          />

          {/* 右侧：附魔书列表（按属性分组） */}
          <div className="flex flex-col flex-1 min-w-0" style={{ minWidth: 0 }}>
            <div
              style={{
                ...neonText,
                fontSize: '7px',
                color: neonCyan,
                marginBottom: '3px',
                letterSpacing: '1px',
                flexShrink: 0,
              }}
            >
              附魔书
            </div>
            <div
              className="flex flex-col gap-1.5 overflow-y-auto"
              style={{ flex: 1, minHeight: 0, paddingRight: '2px' }}
            >
              {groupedItems.length === 0 && (
                <div style={{ ...neonText, fontSize: '7px', color: '#5A5A7A', textAlign: 'center', padding: '8px 0' }}>
                  暂无附魔书
                </div>
              )}
              {groupedItems.map(group => (
                <div key={group.stat} className="flex flex-col gap-0.5">
                  {/* 属性标题 */}
                  <div style={{ ...neonText, fontSize: '6.5px', color: ENCHANT_STAT_INFO[group.stat].color, fontWeight: 700, letterSpacing: '0.5px' }}>
                    {ENCHANT_STAT_INFO[group.stat].name}
                  </div>
                  {/* 该属性下各品质附魔书 */}
                  {group.stacks.map(({ def, count }) => {
                    const isSelected = selectedItemId === def.id;
                    const itemRarityColor = RARITY_COLORS[def.rarity] || '#9A9A9A';
                    return (
                      <button
                        key={def.id}
                        onClick={() => count > 0 && setSelectedItemId(def.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 4px',
                          background: isSelected
                            ? `linear-gradient(90deg, ${hexToRgba(itemRarityColor, 0.25)} 0%, ${hexToRgba(itemRarityColor, 0.08)} 100%)`
                            : 'rgba(19, 16, 37, 0.6)',
                          border: `1px solid ${isSelected ? itemRarityColor : 'rgba(100, 100, 130, 0.25)'}`,
                          borderRadius: '4px',
                          cursor: count > 0 ? 'pointer' : 'not-allowed',
                          width: '100%',
                          textAlign: 'left',
                          opacity: count > 0 ? 1 : 0.5,
                          boxShadow: isSelected ? `0 0 4px ${hexToRgba(itemRarityColor, 0.3)}` : 'none',
                        }}
                        title={def.description}
                      >
                        <div style={{ width: '14px', height: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <EnchantItemIcon itemId={def.id} size={14} />
                        </div>
                        <span
                          style={{
                            ...neonText,
                            fontSize: '6.5px',
                            color: isSelected ? '#FFFFFF' : itemRarityColor,
                            fontWeight: 700,
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ENCHANT_RARITY_LABELS[def.rarity]}
                        </span>
                        <span style={{ ...neonText, fontSize: '6.5px', color: neonYellow, fontWeight: 700, flexShrink: 0 }}>
                          ×{count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部按钮区：附魔 / 合成 */}
        <div
          className="flex gap-1.5 mt-1.5 pt-1.5"
          style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)', flexShrink: 0 }}
        >
          <button
            onClick={handleEnchant}
            disabled={isProcessing || !selectedItem}
            style={{
              flex: 1,
              padding: '5px 0',
              background: !selectedItem
                ? 'rgba(100, 100, 130, 0.25)'
                : `linear-gradient(180deg, ${neonPurple} 0%, #FF2D55 100%)`,
              border: 'none',
              borderRadius: '5px',
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              fontSize: '10px',
              fontWeight: 700,
              color: !selectedItem ? '#5A5A7A' : '#FFFFFF',
              cursor: !selectedItem || isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: !selectedItem ? 'none' : `0 0 6px ${hexToRgba(neonPurple, 0.4)}`,
            }}
          >
            {isProcessing ? '附魔中...' : '附魔'}
          </button>
          <button
            onClick={handleSynth}
            disabled={isProcessing || !canSynth}
            style={{
              flex: 1,
              padding: '5px 0',
              background: !canSynth
                ? 'rgba(100, 100, 130, 0.25)'
                : `linear-gradient(180deg, ${neonGreen} 0%, ${neonCyan} 100%)`,
              border: 'none',
              borderRadius: '5px',
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              fontSize: '10px',
              fontWeight: 700,
              color: !canSynth ? '#5A5A7A' : '#0A0814',
              cursor: !canSynth || isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: !canSynth ? 'none' : `0 0 6px ${hexToRgba(neonGreen, 0.4)}`,
            }}
          >
            {isProcessing ? '合成中...' : `合成 ×${ENCHANT_SYNTH_COST}`}
          </button>
        </div>
      </div>

      {/* 悬浮提示 */}
      {floatToast && (
        <div
          key={toastKey}
          className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${
            floatToast.success ? 'gem-embed-success-toast' : 'gem-embed-fail-toast'
          }`}
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div
            style={{
              ...neonText,
              fontSize: floatToast.success ? '18px' : '12px',
              fontWeight: 700,
              color: floatToast.success ? neonGreen : '#FF2D55',
              textShadow: `0 0 12px ${floatToast.success ? hexToRgba(neonGreen, 0.9) : 'rgba(255, 45, 85, 0.9)'}, 0 0 24px ${floatToast.success ? hexToRgba(neonGreen, 0.5) : 'rgba(255, 45, 85, 0.5)'}`,
              textAlign: 'center',
            }}
          >
            {floatToast.message}
          </div>
        </div>
      )}
    </div>
  );
}
