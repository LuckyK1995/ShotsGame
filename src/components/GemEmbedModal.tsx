import { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { ItemStack } from '../game/types/game';
import { EquipmentIcon } from './EquipmentIcon';
import {
  GEM_TYPE_INFO,
  GEM_RARITY_LABELS,
  GEM_RARITY_BG,
  GEM_RARITY_BORDER,
  getGemDef,
  MAX_GEM_SOCKETS,
  GemType,
} from '../game/data/gems';
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
    socketGem: (equipmentId: string, gemId: string, source: 'equipped' | 'storage') => {
      success: boolean;
      reset: boolean;
      reason?: string;
    } | null;
  } | null;
}

interface GemEmbedModalProps {
  equipmentId: string;
  source: 'equipped' | 'storage';
  onClose: () => void;
  engineRef: GameEngineRef;
}

export function GemEmbedModal({ equipmentId, source, onClose, engineRef }: GemEmbedModalProps) {
  const gemInventory = useGameStore(s => s.gemInventory);
  const equipmentFromStore = useGameStore(s =>
    source === 'equipped'
      ? s.equipment.find(e => e.id === equipmentId)
      : s.equipmentStorage.find(e => e.id === equipmentId)
  );
  const [selectedGemId, setSelectedGemId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // 悬浮提示：1 秒后自动消失
  const [floatToast, setFloatToast] = useState<{ success: boolean; message: string } | null>(null);

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

  const socketedGems = equipment.socketedGems || [];
  const socketCount = socketedGems.length;
  const isFull = socketCount >= MAX_GEM_SOCKETS;

  // 同类宝石锁定逻辑：首颗镶嵌后，仅允许同类不同品质的宝石；归零后才能换其他类型
  const lockedType: GemType | null = socketCount > 0 ? socketedGems[0].type : null;

  // 计算已镶嵌宝石的属性总和
  const gemStats = useMemo(() => {
    const stats = { attack: 0, health: 0, defense: 0, critRate: 0, resistance: 0 };
    for (const g of socketedGems) {
      stats[g.type] += g.value;
    }
    return stats;
  }, [socketedGems]);

  // 宝石列表：已锁定类型时仅显示同类，未锁定时显示全部
  const visibleGems = useMemo(() => {
    const groups: { type: string; gems: { stack: ItemStack; def: NonNullable<ReturnType<typeof getGemDef>> }[] }[] = [];
    const typeMap = new Map<string, typeof groups[number]>();
    for (const stack of gemInventory) {
      const def = getGemDef(stack.itemId);
      if (!def) continue;
      // 锁定类型过滤
      if (lockedType && def.type !== lockedType) continue;
      if (!typeMap.has(def.type)) {
        const g = { type: def.type, gems: [] };
        typeMap.set(def.type, g);
        groups.push(g);
      }
      typeMap.get(def.type)!.gems.push({ stack, def });
    }
    for (const g of groups) {
      g.gems.sort((a, b) => (a.def.rarity === 'advanced' ? -1 : 1) - (b.def.rarity === 'advanced' ? -1 : 1));
    }
    return groups;
  }, [gemInventory, lockedType]);

  const handleEmbed = () => {
    if (!selectedGemId || isProcessing || isFull) return;
    setIsProcessing(true);
    setTimeout(() => {
      const ret = engineRef.current?.socketGem(equipment.id, selectedGemId, source);
      if (!ret) {
        setFloatToast({ success: false, message: '引擎未就绪' });
      } else if (ret.success) {
        setFloatToast({
          success: true,
          message: `✦ 镶嵌成功！${getGemDef(selectedGemId)?.name ?? ''} ✦`,
        });
      } else {
        setFloatToast({
          success: false,
          message: ret.reset
            ? '镶嵌失败！宝石全部碎裂！'
            : '镶嵌失败！宝石已消耗',
        });
      }
      setSelectedGemId(null);
      setIsProcessing(false);
    }, 300);
  };

  const selectedDef = selectedGemId ? getGemDef(selectedGemId) : null;
  // 宝石格子尺寸：原来的 1/3（原 20x20 → 现 7x7，但需保留首字显示，用 8x8）
  const GEM_CELL = 8;

  // 悬浮提示 1 秒后自动消失
  useEffect(() => {
    if (!floatToast) return;
    const id = setTimeout(() => setFloatToast(null), 1000);
    return () => clearTimeout(id);
  }, [floatToast]);

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
          width: '320px',
          padding: '8px 10px',
          maxHeight: '90%',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-1.5" style={{ flexShrink: 0 }}>
          <span style={{ ...neonText, fontSize: '11px', color: neonGreen, fontWeight: 700, letterSpacing: '1px' }}>
            ✦ 宝石镶嵌
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
          {/* 左侧：装备图标 + 镶嵌加成 + 15 个宝石格子 */}
          <div className="flex flex-col gap-1.5" style={{ width: '140px', flexShrink: 0 }}>
            {/* 装备图标 + 镶嵌加成（水平排列） */}
            <div className="flex gap-1.5 items-start">
              <div
                className="flex items-center justify-center relative flex-shrink-0"
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'radial-gradient(circle at 50% 40%, #2A2540 0%, #1E1A35 55%, #15122A 100%)',
                  border: `2.5px solid ${hexToRgba(RARITY_COLORS[equipment.rarity] || '#9A9A9A', 0.5)}`,
                  borderRadius: '8px',
                }}
              >
                <EquipmentIcon slot={equipment.slot} rarity={equipment.rarity} variant={equipment.iconVariant} size={28} />
              </div>
              {/* 镶嵌加成显示在装备图标右侧 */}
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    ...neonText,
                    fontSize: '6.5px',
                    color: neonGreen,
                    marginBottom: '1px',
                    letterSpacing: '0.5px',
                  }}
                >
                  镶嵌加成 {socketCount}/{MAX_GEM_SOCKETS}
                </div>
                <div className="flex flex-col gap-0">
                  {([
                    { key: 'attack', label: '攻', color: neonPink },
                    { key: 'health', label: '生', color: '#34C759' },
                    { key: 'defense', label: '防', color: '#5BA3E0' },
                    { key: 'critRate', label: '暴', color: neonPurple },
                    { key: 'resistance', label: '抗', color: neonCyan },
                  ] as const).map(({ key, label, color }) => {
                    const v = gemStats[key];
                    if (v <= 0) return null;
                    return (
                      <div key={key} className="flex justify-between" style={{ lineHeight: 1.1 }}>
                        <span style={{ ...neonText, fontSize: '7px', color }}>{label}</span>
                        <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF' }}>
                          +{v}{key === 'critRate' ? '%' : ''}
                        </span>
                      </div>
                    );
                  })}
                  {socketCount === 0 && (
                    <div style={{ ...neonText, fontSize: '7px', color: '#5A5A7A' }}>
                      尚未镶嵌
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 锁定类型提示 */}
            {lockedType && (
              <div
                style={{
                  ...neonText,
                  fontSize: '7px',
                  color: GEM_TYPE_INFO[lockedType].color,
                  textAlign: 'center',
                  padding: '1px 0',
                  background: hexToRgba(GEM_TYPE_INFO[lockedType].color, 0.1),
                  borderRadius: '3px',
                  border: `1px solid ${hexToRgba(GEM_TYPE_INFO[lockedType].color, 0.3)}`,
                }}
              >
                仅可镶嵌 {GEM_TYPE_INFO[lockedType].name}
              </div>
            )}

            {/* 15 个宝石格子（5×3 网格，每个 8x8） */}
            <div className="flex justify-center">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(5, ${GEM_CELL}px)`,
                  gridTemplateRows: `repeat(3, ${GEM_CELL}px)`,
                  gap: '2px',
                }}
              >
                {Array.from({ length: MAX_GEM_SOCKETS }).map((_, i) => {
                  const g = socketedGems[i];
                  const info = g ? GEM_TYPE_INFO[g.type] : null;
                  return (
                    <div
                      key={i}
                      style={{
                        borderRadius: '2px',
                        background: g
                          ? GEM_RARITY_BG[g.rarity]
                          : 'rgba(19, 16, 37, 0.5)',
                        border: `0.5px solid ${g ? GEM_RARITY_BORDER[g.rarity] : 'rgba(100, 100, 130, 0.25)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '5px',
                        color: info?.color || '#5A5A7A',
                        fontFamily: '"Rajdhani", monospace',
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                      title={g ? `${GEM_RARITY_LABELS[g.rarity]}${info?.name}` : '空槽位'}
                    >
                      {info?.short || ''}
                    </div>
                  );
                })}
              </div>
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

          {/* 右侧：宝石列表（每行一个） */}
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
              {lockedType ? `${GEM_TYPE_INFO[lockedType].name}列表` : '选择宝石'}
            </div>
            <div
              className="flex flex-col gap-1 overflow-y-auto"
              style={{ flex: 1, minHeight: 0, paddingRight: '2px' }}
            >
              {visibleGems.length === 0 ? (
                <div
                  style={{
                    ...neonText,
                    fontSize: '8px',
                    color: '#5A5A7A',
                    textAlign: 'center',
                    padding: '20px 0',
                  }}
                >
                  {lockedType ? '无同类宝石' : '背包没有宝石'}
                </div>
              ) : (
                visibleGems.map(group => (
                  <div key={group.type} className="flex flex-col gap-1">
                    {group.gems.map(({ stack, def }) => {
                      const isSelected = selectedGemId === stack.itemId;
                      const info = GEM_TYPE_INFO[def.type];
                      return (
                        <button
                          key={stack.itemId}
                          onClick={() => setSelectedGemId(stack.itemId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 4px',
                            background: isSelected
                              ? `linear-gradient(90deg, ${hexToRgba(info.color, 0.25)} 0%, ${hexToRgba(info.color, 0.08)} 100%)`
                              : 'rgba(19, 16, 37, 0.6)',
                            border: `1px solid ${isSelected ? info.color : 'rgba(100, 100, 130, 0.25)'}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            boxShadow: isSelected ? `0 0 4px ${hexToRgba(info.color, 0.3)}` : 'none',
                          }}
                        >
                          <span style={{ fontSize: '10px', flexShrink: 0 }}>{def.icon}</span>
                          <span
                            style={{
                              ...neonText,
                              fontSize: '7.5px',
                              color: isSelected ? '#FFFFFF' : '#C0C0E0',
                              fontWeight: 700,
                              flex: 1,
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {def.name}
                          </span>
                          <span
                            style={{
                              ...neonText,
                              fontSize: '6.5px',
                              color: GEM_RARITY_BORDER[def.rarity],
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            +{def.value}
                          </span>
                          <span
                            style={{
                              ...neonText,
                              fontSize: '6.5px',
                              color: neonYellow,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            ×{stack.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 概率提示 */}
        <div
          className="mt-1.5 pt-1.5 flex justify-between items-center"
          style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)', flexShrink: 0 }}
        >
          <div style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>
            {socketCount === 0 ? (
              <span style={{ color: neonGreen }}>首颗 100% 成功</span>
            ) : socketCount < 7 ? (
              <span style={{ color: neonYellow }}>50% · 失败保留</span>
            ) : (
              <span style={{ color: '#FF6B35' }}>50% · 失败全部碎裂</span>
            )}
          </div>
          {selectedDef && (
            <div style={{ ...neonText, fontSize: '7px', color: neonCyan, textAlign: 'right' }}>
              只能镶嵌同一属性宝石，已选：{selectedDef.name}
            </div>
          )}
        </div>

        {/* 底部按钮区（自动镶嵌在左，镶嵌在右） */}
        <div
          className="flex gap-1.5 mt-1.5 pt-1.5"
          style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)', flexShrink: 0 }}
        >
          <button
            disabled
            title="暂未实现"
            style={{
              flex: 1,
              padding: '5px 0',
              background: 'rgba(100, 100, 130, 0.15)',
              border: '1px solid rgba(100, 100, 130, 0.25)',
              borderRadius: '5px',
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              fontSize: '10px',
              fontWeight: 700,
              color: '#5A5A7A',
              cursor: 'not-allowed',
            }}
          >
            自动镶嵌
          </button>
          <button
            onClick={handleEmbed}
            disabled={!selectedGemId || isProcessing || isFull}
            style={{
              flex: 1,
              padding: '5px 0',
              background: !selectedGemId || isFull
                ? 'rgba(100, 100, 130, 0.25)'
                : `linear-gradient(180deg, ${neonGreen} 0%, ${neonCyan} 100%)`,
              border: 'none',
              borderRadius: '5px',
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              fontSize: '10px',
              fontWeight: 700,
              color: !selectedGemId || isFull ? '#5A5A7A' : '#0A0814',
              cursor: !selectedGemId || isFull || isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: !selectedGemId || isFull ? 'none' : `0 0 6px ${hexToRgba(neonGreen, 0.4)}`,
            }}
          >
            {isFull ? '已满 15/15' : isProcessing ? '镶嵌中...' : '镶嵌'}
          </button>
        </div>
      </div>

      {/* 悬浮提示：1 秒后自动消失，成功有变大变小特效 */}
      {floatToast && (
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${
            floatToast.success ? 'gem-embed-success-toast' : 'gem-embed-fail-toast'
          }`}
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: floatToast.success
                ? 'rgba(0, 255, 157, 0.25)'
                : 'rgba(255, 45, 85, 0.25)',
              border: `2px solid ${floatToast.success ? neonGreen : '#FF2D55'}`,
              boxShadow: `0 0 20px ${floatToast.success ? hexToRgba(neonGreen, 0.6) : 'rgba(255, 45, 85, 0.5)'}`,
              ...neonText,
              fontSize: floatToast.success ? '14px' : '10px',
              fontWeight: 700,
              color: floatToast.success ? neonGreen : '#FF2D55',
              textShadow: `0 0 8px ${floatToast.success ? hexToRgba(neonGreen, 0.8) : 'rgba(255, 45, 85, 0.8)'}`,
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            {floatToast.message}
          </div>
        </div>
      )}
    </div>
  );
}
