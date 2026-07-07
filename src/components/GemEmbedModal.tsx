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
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen } from '../theme/colors';
import { hexToRgba } from '../utils/styles';

// hexToRgba 已移至 utils/styles.ts（共享版本）

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
  // 按仓库中 gemInventory 的顺序显示，不再按 type 分组、不重排
  const visibleGems = useMemo(() => {
    const list: { stack: ItemStack; def: NonNullable<ReturnType<typeof getGemDef>> }[] = [];
    for (const stack of gemInventory) {
      const def = getGemDef(stack.itemId);
      if (!def) continue;
      if (lockedType && def.type !== lockedType) continue;
      list.push({ stack, def });
    }
    return list;
  }, [gemInventory, lockedType]);

  const handleEmbed = () => {
    if (!selectedGemId || isProcessing || isFull) return;
    setIsProcessing(true);
    setTimeout(() => {
      const ret = engineRef.current?.socketGem(equipment.id, selectedGemId, source);
      if (!ret) {
        setToastKey(k => k + 1);
        setFloatToast({ success: false, message: '引擎未就绪' });
      } else if (ret.success) {
        setToastKey(k => k + 1);
        setFloatToast({
          success: true,
          message: `✦ 镶嵌成功 ✦`,
        });
      } else {
        setToastKey(k => k + 1);
        setFloatToast({
          success: false,
          message: ret.reset
            ? '镶嵌失败！宝石全部碎裂！'
            : '镶嵌失败！宝石已消耗',
        });
      }
      setTimeout(() => setIsProcessing(false), 200);
    }, 300);
  };

  // 宝石格子尺寸：原来的 1/3
  const GEM_CELL = 8;

  // 悬浮提示自动消失（匹配动画时长）
  useEffect(() => {
    if (!floatToast) return;
    const duration = floatToast.success ? 1100 : 1000;
    const id = setTimeout(() => setFloatToast(null), duration);
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
          width: '340px',
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
                <EquipmentIcon slot={equipment.slot} rarity={equipment.rarity} variant={equipment.iconVariant} size={28} gemCount={socketCount} enhanceLevel={equipment.enhanceLevel || 0} level={equipment.level} />
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
                    { key: 'attack', label: '攻击力', color: neonPink },
                    { key: 'health', label: '生命', color: '#FF2D55' },
                    { key: 'defense', label: '防御', color: '#5BA3E0' },
                    { key: 'critRate', label: '暴击率', color: neonPurple },
                    { key: 'resistance', label: '抗性', color: '#5BA3E0' },
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

            {/* 锁定类型提示 - 永久显示 */}
            <div
              style={{
                ...neonText,
                fontSize: '7px',
                color: lockedType ? GEM_TYPE_INFO[lockedType].color : neonCyan,
                textAlign: 'center',
                padding: '1px 0',
                background: hexToRgba(lockedType ? GEM_TYPE_INFO[lockedType].color : neonCyan, 0.1),
                borderRadius: '3px',
                border: `1px solid ${hexToRgba(lockedType ? GEM_TYPE_INFO[lockedType].color : neonCyan, 0.3)}`,
              }}
            >
              {lockedType ? `仅可镶嵌 ${GEM_TYPE_INFO[lockedType].name}` : '只能镶嵌同一属性宝石'}
            </div>

            {/* 15 个宝石格子（靠左） + 竖线 + 概率信息（右侧） */}
            <div className="flex gap-1 items-center flex-row">
              {/* 15 个宝石格子（5×3 网格，无文字） */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(5, ${GEM_CELL}px)`,
                  gridTemplateRows: `repeat(3, ${GEM_CELL}px)`,
                  gap: '2px',
                  flexShrink: 0,
                }}
              >
                {Array.from({ length: MAX_GEM_SOCKETS }).map((_, i) => {
                  const g = socketedGems[i];
                  return (
                    <div
                      key={i}
                      style={{
                        borderRadius: '2px',
                        background: g
                          ? GEM_RARITY_BG[g.rarity]
                          : 'rgba(19, 16, 37, 0.5)',
                        border: `0.5px solid ${g ? GEM_RARITY_BORDER[g.rarity] : 'rgba(100, 100, 130, 0.25)'}`,
                      }}
                      title={g ? `${GEM_RARITY_LABELS[g.rarity]}${GEM_TYPE_INFO[g.type].name}` : '空槽位'}
                    />
                  );
                })}
              </div>

              {/* 竖线 */}
              <div
                aria-hidden
                style={{
                  width: '1px',
                  alignSelf: 'stretch',
                  background: 'linear-gradient(to bottom, rgba(176, 38, 255, 0.05), rgba(176, 38, 255, 0.5) 20%, rgba(0, 245, 212, 0.4) 80%, rgba(0, 245, 212, 0.05))',
                  flexShrink: 0,
                }}
              />

              {/* 概率信息：4 行 */}
              <div className="flex flex-col" style={{ ...neonText, fontSize: '6px', lineHeight: 1.4, flex: 1, minWidth: 0 }}>
                <div style={{ color: '#8B80A0' }}>成功概率：</div>
                <div>
                  <span style={{ color: socketCount === 0 ? neonGreen : '#5A5A7A' }}>100%</span>
                  <span style={{ color: '#5A5A7A' }}>/</span>
                  <span style={{ color: socketCount > 0 ? neonYellow : '#5A5A7A' }}>50%</span>
                </div>
                <div style={{ color: '#8B80A0' }}>失败结果：</div>
                <div style={{ wordBreak: 'break-all' }}>
                  <span style={{ color: socketCount === 0 ? neonGreen : '#5A5A7A' }}>无</span>
                  <span style={{ color: '#5A5A7A' }}>/</span>
                  <span style={{ color: socketCount > 0 && socketCount < 7 ? neonYellow : '#5A5A7A' }}>保留宝石</span>
                  <span style={{ color: '#5A5A7A' }}>/</span>
                  <span style={{ color: socketCount >= 7 ? '#FF6B35' : '#5A5A7A' }}>损毁所有宝石</span>
                </div>
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
                visibleGems.map(({ stack, def }) => {
                  const isSelected = selectedGemId === stack.itemId;
                  const info = GEM_TYPE_INFO[def.type];
                  const statName = info.name.replace('宝石', '');
                  // 宝石名称颜色对应品质颜色
                  const rarityColor = GEM_RARITY_BORDER[def.rarity];
                  // 宝石属性颜色对应战斗力面板的颜色
                  const combatColor: Record<GemType, string> = {
                    attack: neonPink,
                    health: '#FF2D55',
                    defense: '#5BA3E0',
                    critRate: neonPurple,
                    resistance: '#5BA3E0',
                  };
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
                          ? `linear-gradient(90deg, ${hexToRgba(rarityColor, 0.25)} 0%, ${hexToRgba(rarityColor, 0.08)} 100%)`
                          : 'rgba(19, 16, 37, 0.6)',
                        border: `1px solid ${isSelected ? rarityColor : 'rgba(100, 100, 130, 0.25)'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        boxShadow: isSelected ? `0 0 4px ${hexToRgba(rarityColor, 0.3)}` : 'none',
                      }}
                    >
                      {/* Panel 1: 图标 + 名称 */}
                      <div className="flex items-center gap-1" style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '10px', flexShrink: 0 }}>{def.icon}</span>
                        <span
                          style={{
                            ...neonText,
                            fontSize: '7.5px',
                            color: isSelected ? '#FFFFFF' : rarityColor,
                            fontWeight: 700,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {def.name}
                        </span>
                      </div>
                      {/* Panel 2: 属性+值 ×数量 */}
                      <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                        <span
                          style={{
                            ...neonText,
                            fontSize: '6.5px',
                            color: combatColor[def.type],
                            fontWeight: 700,
                          }}
                        >
                          {statName}+{def.value}
                        </span>
                        <span
                          style={{
                            ...neonText,
                            fontSize: '6.5px',
                            color: neonYellow,
                            fontWeight: 700,
                          }}
                        >
                          ×{stack.count}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
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

      {/* 悬浮提示：无框纯文字，每次点击重新触发动画 */}
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
