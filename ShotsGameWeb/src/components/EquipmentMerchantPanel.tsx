import { useState, useEffect, useCallback } from 'react';
import { EquipmentIcon } from './EquipmentIcon';
import { ModalHudBackground } from './ModalHudBackground';
import { RARITY_COLORS, RARITY_LABELS, SLOT_LABELS } from '../game/data/equipment';
import type { Equipment, Blueprint, MerchantEquipment, EquipRarity } from '../game/types/game';
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonRed, neonOrange, neonText } from '../theme/colors';

interface EngineRef {
  current: {
    getEquipmentMerchantStatus: () => { playerLevel: number; gold: number; tiers: number[] };
    getMerchantEquipment: (tierLevel: number) => MerchantEquipment[];
    getMerchantBlueprints: (tierLevel: number) => Blueprint[];
    buyMerchantEquipment: (itemId: string) => { success: boolean; msg?: string };
    buyMerchantBlueprint: (bpId: string) => { success: boolean; msg?: string };
    clearMerchantCache: () => void;
  } | null;
}

interface EquipmentMerchantPanelProps {
  engineRef: EngineRef;
  isOpen: boolean;
  onClose: () => void;
}

export function EquipmentMerchantPanel({ engineRef, isOpen, onClose }: EquipmentMerchantPanelProps) {
  const [status, setStatus] = useState<{ playerLevel: number; gold: number; tiers: number[] } | null>(null);
  const [tab, setTab] = useState<'equipment' | 'blueprint'>('equipment');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [equipmentList, setEquipmentList] = useState<MerchantEquipment[]>([]);
  const [blueprintList, setBlueprintList] = useState<Blueprint[]>([]);
  const [toast, setToast] = useState<{ text: string; color: string } | null>(null);

  const showToast = (text: string, color: string = neonPink) => {
    setToast({ text, color });
    setTimeout(() => setToast(null), 1800);
  };

  const refresh = useCallback(() => {
    if (!engineRef.current) return;
    const s = engineRef.current.getEquipmentMerchantStatus();
    setStatus(s);
    const tier = selectedTier ?? s.tiers[0] ?? 10;
    if (selectedTier === null) setSelectedTier(tier);
    setEquipmentList(engineRef.current.getMerchantEquipment(tier));
    setBlueprintList(engineRef.current.getMerchantBlueprints(tier));
  }, [engineRef, selectedTier]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTier(null);
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 切换档位时刷新
  useEffect(() => {
    if (!isOpen || !engineRef.current || selectedTier === null) return;
    setEquipmentList(engineRef.current.getMerchantEquipment(selectedTier));
    setBlueprintList(engineRef.current.getMerchantBlueprints(selectedTier));
    const s = engineRef.current.getEquipmentMerchantStatus();
    setStatus(s);
  }, [selectedTier, isOpen, engineRef]);

  const handleClose = () => {
    engineRef.current?.clearMerchantCache();
    onClose();
  };

  const handleBuyEquipment = (itemId: string, price: number) => {
    if (!engineRef.current) return;
    const res = engineRef.current.buyMerchantEquipment(itemId);
    if (res.success) {
      showToast(`购买成功 -${price}金币`, neonGreen);
    } else {
      showToast(res.msg || '购买失败', neonRed);
    }
    refresh();
  };

  const handleBuyBlueprint = (bpId: string, price: number) => {
    if (!engineRef.current) return;
    const res = engineRef.current.buyMerchantBlueprint(bpId);
    if (res.success) {
      showToast(`设计图已入物品栏 -${price}金币`, neonGreen);
    } else {
      showToast(res.msg || '购买失败', neonRed);
    }
    refresh();
  };

  if (!isOpen) return null;

  const gold = status?.gold ?? 0;

  return (
    <div
      className="absolute inset-0 flex flex-col z-50"
      style={{ background: 'rgba(5, 3, 15, 0.88)', backdropFilter: 'blur(6px)' }}
      onClick={handleClose}
    >
      <div
        className="relative flex flex-col mx-auto"
        style={{
          width: '100%',
          maxWidth: '340px',
          height: '100%',
          maxHeight: '92vh',
          background: 'rgba(19, 16, 37, 0.95)',
          border: `1px solid ${neonPurple}40`,
          borderRadius: '14px',
          boxShadow: `0 0 30px ${neonPurple}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHudBackground accentColor={neonPurple} accentColor2={neonCyan} />

        <div className="relative flex flex-col flex-1 min-h-0" style={{ zIndex: 1, padding: '10px 10px' }}>
          {/* 头部 */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span style={{ ...neonText, fontSize: '13px', color: neonCyan, letterSpacing: '2px' }}>
              🛒 装备商人
            </span>
            <div className="flex items-center gap-1">
              <span style={{ ...neonText, fontSize: '9px', color: neonYellow, fontWeight: 700 }}>
                🪙 {gold}
              </span>
              <button
                onClick={handleClose}
                style={{ ...neonText, fontSize: '14px', color: '#8B80A0', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
              >✕</button>
            </div>
          </div>

          {/* 等级档位选择器 */}
          {status && (
            <div className="mb-2 shrink-0">
              <div style={{ ...neonText, fontSize: '7px', color: '#8B80A0', marginBottom: '4px', letterSpacing: '1px' }}>
                等级档位（Lv.{status.playerLevel} 可购至 Lv.{status.playerLevel + 50}）
              </div>
              <div className="flex gap-1 overflow-x-auto" style={{ paddingBottom: '2px' }}>
                {status.tiers.map(tier => {
                  const active = selectedTier === tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      style={{
                        padding: '4px 8px',
                        background: active ? `${neonCyan}25` : 'rgba(19,16,37,0.7)',
                        border: `1px solid ${active ? neonCyan : 'rgba(100,100,130,0.4)'}`,
                        borderRadius: '5px',
                        ...neonText, fontSize: '9px', color: active ? neonCyan : '#8B80A0',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        boxShadow: active ? `0 0 8px ${neonCyan}40` : 'none',
                      }}
                    >Lv.{tier}</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 页签 */}
          <div className="flex gap-1 mb-2 shrink-0">
            <button
              onClick={() => setTab('equipment')}
              style={{
                flex: 1, padding: '6px',
                background: tab === 'equipment' ? `${neonGreen}20` : 'rgba(19,16,37,0.6)',
                border: `1px solid ${tab === 'equipment' ? neonGreen : 'rgba(100,100,130,0.3)'}`,
                borderRadius: '5px',
                ...neonText, fontSize: '10px', color: tab === 'equipment' ? neonGreen : '#8B80A0',
                cursor: 'pointer',
              }}
            >装备（普通-精致）</button>
            <button
              onClick={() => setTab('blueprint')}
              style={{
                flex: 1, padding: '6px',
                background: tab === 'blueprint' ? `${neonOrange}20` : 'rgba(19,16,37,0.6)',
                border: `1px solid ${tab === 'blueprint' ? neonOrange : 'rgba(100,100,130,0.3)'}`,
                borderRadius: '5px',
                ...neonText, fontSize: '10px', color: tab === 'blueprint' ? neonOrange : '#8B80A0',
                cursor: 'pointer',
              }}
            >设计图（传说-史诗）</button>
          </div>

          {/* 内容区 */}
          <div className="flex-1 min-h-0 overflow-y-auto merchant-scroll" style={{ paddingRight: '2px' }}>
            {tab === 'equipment' ? (
              <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {equipmentList.map(item => (
                  <EquipmentCard
                    key={item.id}
                    item={item}
                    gold={gold}
                    onBuy={() => handleBuyEquipment(item.id, item.price)}
                  />
                ))}
              </div>
            ) : (
              <>
                <div style={{ ...neonText, fontSize: '8px', color: '#8B80A0', marginBottom: '4px', letterSpacing: '1px' }}>
                  ▸ 购买设计图（购买后存入物品栏·消耗品）
                </div>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {blueprintList.map(bp => (
                    <BlueprintCard
                      key={bp.id}
                      bp={bp}
                      gold={gold}
                      onBuy={() => handleBuyBlueprint(bp.id, bp.price)}
                    />
                  ))}
                </div>
                <div style={{ ...neonText, fontSize: '7px', color: '#5A5A7A', textAlign: 'center', padding: '8px 0 0', letterSpacing: '0.5px' }}>
                  购买后打开背包 → 消耗品 → 使用设计图即可制作装备
                </div>
              </>
            )}
          </div>

          {/* 底部提示 */}
          <div className="shrink-0 mt-2 text-center" style={{ ...neonText, fontSize: '7px', color: '#5A5A7A', letterSpacing: '0.5px' }}>
            装备每10级一档·5档可选·仅可购买自身等级+50以内的装备·不限次购买
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="absolute left-1/2"
            style={{
              top: '30%', transform: 'translateX(-50%)',
              padding: '6px 14px',
              background: `${toast.color}E0`,
              border: `1px solid ${toast.color}`,
              borderRadius: '6px',
              ...neonText, fontSize: '10px', color: '#FFFFFF',
              zIndex: 10, boxShadow: `0 0 14px ${toast.color}80`,
              pointerEvents: 'none', whiteSpace: 'nowrap',
            }}
          >{toast.text}</div>
        )}
      </div>

      <style>{`
        .merchant-scroll::-webkit-scrollbar { width: 3px; }
        .merchant-scroll::-webkit-scrollbar-track { background: rgba(100,100,130,0.1); }
        .merchant-scroll::-webkit-scrollbar-thumb { background: ${neonPurple}60; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ===== 装备卡片 =====
function EquipmentCard({ item, gold, onBuy }: { item: MerchantEquipment; gold: number; onBuy: () => void }) {
  const eq = item.equipment;
  const color = RARITY_COLORS[eq.rarity];
  const canAfford = gold >= item.price;

  // 属性摘要
  const statParts: string[] = [];
  if (eq.attack) statParts.push(`攻+${eq.attack}`);
  if (eq.health) statParts.push(`血+${eq.health}`);
  if (eq.defense) statParts.push(`防+${eq.defense}`);
  if (eq.range) statParts.push(`程+${eq.range}`);

  return (
    <div
      style={{
        background: `${color}10`,
        border: `1px solid ${color}50`,
        borderRadius: '6px',
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      <div style={{ position: 'relative' }}>
        <EquipmentIcon slot={eq.slot} rarity={eq.rarity} variant={eq.iconVariant} size={40} level={eq.level} />
      </div>
      <div style={{ ...neonText, fontSize: '6px', color: color, lineHeight: 1.1, textAlign: 'center' }}>
        {RARITY_LABELS[eq.rarity]}{SLOT_LABELS[eq.slot]}
      </div>
      <div style={{ ...neonText, fontSize: '6px', color: '#A0A0B8', lineHeight: 1.1, textAlign: 'center', minHeight: '12px' }}>
        {statParts.join(' ')}
      </div>
      <div style={{ ...neonText, fontSize: '7px', color: neonYellow, fontWeight: 700 }}>🪙{item.price}</div>
      <button
        onClick={onBuy}
        disabled={!canAfford}
        style={{
          width: '100%',
          padding: '3px 0',
          background: canAfford ? `${color}30` : 'rgba(100,100,130,0.2)',
          border: `1px solid ${canAfford ? color : '#5A5A7A'}`,
          borderRadius: '4px',
          ...neonText, fontSize: '8px',
          color: canAfford ? color : '#8B80A0',
          cursor: canAfford ? 'pointer' : 'not-allowed',
        }}
      >购买</button>
    </div>
  );
}

// ===== 设计图卡片（可购买，购买后入物品栏） =====
function BlueprintCard({ bp, gold, onBuy }: { bp: Blueprint; gold: number; onBuy: () => void }) {
  const color = RARITY_COLORS[bp.rarity];
  const canAfford = gold >= bp.price;

  return (
    <div
      style={{
        background: `${color}10`,
        border: `1px solid ${color}50`,
        borderRadius: '6px',
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      <div style={{ fontSize: '20px', lineHeight: 1 }}>{bp.icon}</div>
      <div style={{ ...neonText, fontSize: '6px', color: color, lineHeight: 1.1, textAlign: 'center' }}>
        {RARITY_LABELS[bp.rarity]}{SLOT_LABELS[bp.slot]}
      </div>
      <div style={{ ...neonText, fontSize: '6px', color: '#8B80A0' }}>Lv.{bp.level}设计图</div>
      <div style={{ ...neonText, fontSize: '7px', color: neonYellow, fontWeight: 700 }}>🪙{bp.price}</div>
      <button
        onClick={onBuy}
        disabled={!canAfford}
        style={{
          width: '100%',
          padding: '3px 0',
          background: canAfford ? `${color}30` : 'rgba(100,100,130,0.2)',
          border: `1px solid ${canAfford ? color : '#5A5A7A'}`,
          borderRadius: '4px',
          ...neonText, fontSize: '8px',
          color: canAfford ? color : '#8B80A0',
          cursor: canAfford ? 'pointer' : 'not-allowed',
        }}
      >购买</button>
    </div>
  );
}
