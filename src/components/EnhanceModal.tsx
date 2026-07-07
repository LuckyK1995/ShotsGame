import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { EquipmentIcon } from './EquipmentIcon';
import { EnhanceItemIcon } from './EnhanceItemIcon';
import {
  ENHANCE_ITEMS,
  getEnhanceSuccessRate,
  getEnhanceFailResult,
  getEnhanceGoldCost,
  MAX_ENHANCE_LEVEL,
} from '../game/data/enhanceItems';
import type { EnhanceItemId } from '../game/data/enhanceItems';
import { RARITY_COLORS } from '../game/data/equipment';
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonText } from '../theme/colors';
import { hexToRgba } from '../utils/styles';

// hexToRgba 已移至 utils/styles.ts（共享版本）

const cardStyle = {
  background: 'rgba(19, 16, 37, 0.95)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(176, 38, 255, 0.35)',
  borderRadius: '12px',
  boxShadow: '0 0 24px rgba(176, 38, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
};

interface GameEngineRef {
  current: {
    enhanceEquipment: (
      equipmentId: string,
      source: 'equipped' | 'storage',
      mode: 'gold' | 'item',
      itemId?: string
    ) => { success: boolean; reason?: string; newLevel: number; goldCost: number; failResult?: string } | null;
  } | null;
}

interface EnhanceModalProps {
  equipmentId: string;
  source: 'equipped' | 'storage';
  onClose: () => void;
  engineRef: GameEngineRef;
}

export function EnhanceModal({ equipmentId, source, onClose, engineRef }: EnhanceModalProps) {
  const enhanceItemInventory = useGameStore(s => s.enhanceItemInventory);
  const equipmentFromStore = useGameStore(s =>
    source === 'equipped'
      ? s.equipment.find(e => e.id === equipmentId)
      : s.equipmentStorage.find(e => e.id === equipmentId)
  );
  const playerGold = useGameStore(s => s.player?.gold ?? 0);
  const [selectedItemId, setSelectedItemId] = useState<EnhanceItemId | null>(null);
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

  const currentLevel = equipment.enhanceLevel || 0;
  const isMax = currentLevel >= MAX_ENHANCE_LEVEL;

  // 计算强化成功率与失败结果
  const baseRate = getEnhanceSuccessRate(currentLevel);
  const failResult = getEnhanceFailResult(currentLevel);

  // 道具列表：按仓库中 enhanceItemInventory 的顺序显示
  const items = enhanceItemInventory
    .map(stack => {
      const id = stack.itemId as EnhanceItemId;
      const def = ENHANCE_ITEMS[id];
      if (!def) return null;
      return { def, count: stack.count };
    })
    .filter((x): x is { def: NonNullable<typeof ENHANCE_ITEMS[EnhanceItemId]>; count: number } => x !== null);

  // 金币消耗
  const goldCost = getEnhanceGoldCost(equipment.level, equipment.rarity, currentLevel);

  const handleEnhanceGold = () => {
    if (isProcessing || isMax) return;
    setIsProcessing(true);
    setTimeout(() => {
      const ret = engineRef.current?.enhanceEquipment(equipment.id, source, 'gold');
      handleResult(ret);
    }, 300);
  };

  const handleEnhanceItem = () => {
    if (isProcessing || isMax || !selectedItemId) return;
    setIsProcessing(true);
    setTimeout(() => {
      const ret = engineRef.current?.enhanceEquipment(equipment.id, source, 'item', selectedItemId);
      handleResult(ret);
    }, 300);
  };

  const handleResult = (ret: ReturnType<NonNullable<GameEngineRef['current']>['enhanceEquipment']>) => {
    setIsProcessing(false);
    if (!ret) {
      setToastKey(k => k + 1);
      setFloatToast({ success: false, message: '引擎未就绪' });
      return;
    }
    if (ret.success) {
      setToastKey(k => k + 1);
      setFloatToast({ success: true, message: `✦ 强化成功 +${ret.newLevel} ✦` });
    } else {
      // 失败但有金币不足/已达上限等失败原因
      if (ret.reason) {
        setToastKey(k => k + 1);
        setFloatToast({ success: false, message: ret.reason! });
      } else {
        setToastKey(k => k + 1);
        setFloatToast({
          success: false,
          message: ret.failResult ? `强化失败 ${ret.failResult}` : '强化失败',
        });
      }
    }
  };

  useEffect(() => {
    if (!floatToast) return;
    const duration = floatToast.success ? 1100 : 1000;
    const id = setTimeout(() => setFloatToast(null), duration);
    return () => clearTimeout(id);
  }, [floatToast]);

  // 装备品质颜色（用于强化等级显示）
  const rarityColor = RARITY_COLORS[equipment.rarity] || '#9A9A9A';

  // 选中远古强化器时，成功率 +10%
  const selectedItem = selectedItemId ? ENHANCE_ITEMS[selectedItemId] : null;
  const hasBonus = selectedItem?.mode === 'booster' && !!selectedItem.successBonus;
  const bonusPercent = hasBonus ? Math.round((selectedItem!.successBonus as number) * 100) : 0;
  const basePercent = Math.round(baseRate * 100);
  const displayRatePercent = hasBonus
    ? Math.min(100, Math.round((baseRate + (selectedItem!.successBonus as number)) * 100))
    : basePercent;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-30"
      style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* 强化成功特效：keyframes 已提取至 index.css */}
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
          <span style={{ ...neonText, fontSize: '11px', color: neonYellow, fontWeight: 700, letterSpacing: '1px' }}>
            ⚒ 装备强化
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
          {/* 左侧：装备图标 + 强化名称 */}
          <div className="flex flex-col gap-1.5" style={{ width: '140px', flexShrink: 0 }}>
            {/* 装备图标 + 强化名称 */}
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
                <EquipmentIcon slot={equipment.slot} rarity={equipment.rarity} variant={equipment.iconVariant} size={28} gemCount={equipment.socketedGems?.length || 0} enhanceLevel={currentLevel} level={equipment.level} />
              </div>
              {/* 强化名称 + 强化属性 */}
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
                  {currentLevel > 0 ? `+${currentLevel} ` : ''}{equipment.name}
                </div>
                {(() => {
                  const bonus = currentLevel > 0 ? (currentLevel * (currentLevel + 1)) / 2 : 0;
                  if (currentLevel <= 0) {
                    return (
                      <div style={{ ...neonText, fontSize: '7px', color: '#5A5A7A', lineHeight: 1.2 }}>
                        未强化
                      </div>
                    );
                  }
                  return (
                    <div className="flex justify-between" style={{ lineHeight: 1.2 }}>
                      <span style={{ ...neonText, fontSize: '7px', color: neonPink }}>攻击</span>
                      <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF' }}>+{bonus}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 装饰框 - 与镶嵌界面"仅可镶嵌 XX宝石"框位置一致，强化界面作纯装饰 */}
            <div
              style={{
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '0 6px',
                background: `linear-gradient(90deg, ${hexToRgba(neonYellow, 0.05)} 0%, ${hexToRgba(neonCyan, 0.12)} 50%, ${hexToRgba(neonYellow, 0.05)} 100%)`,
                borderRadius: '3px',
                border: `1px solid ${hexToRgba(neonCyan, 0.3)}`,
                boxShadow: `inset 0 0 8px ${hexToRgba(neonCyan, 0.08)}`,
              }}
            >
              {/* 左侧装饰点 */}
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: neonCyan, boxShadow: `0 0 4px ${neonCyan}` }} />
              {/* 中央分隔线 */}
              <span style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${hexToRgba(neonCyan, 0.4)}, ${hexToRgba(neonYellow, 0.4)}, ${hexToRgba(neonCyan, 0.4)})` }} />
              {/* 中央菱形装饰 */}
              <span style={{
                width: '4px',
                height: '4px',
                background: neonYellow,
                transform: 'rotate(45deg)',
                boxShadow: `0 0 4px ${hexToRgba(neonYellow, 0.6)}`,
              }} />
              {/* 中央分隔线 */}
              <span style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${hexToRgba(neonCyan, 0.4)}, ${hexToRgba(neonYellow, 0.4)}, ${hexToRgba(neonCyan, 0.4)})` }} />
              {/* 右侧装饰点 */}
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: neonCyan, boxShadow: `0 0 4px ${neonCyan}` }} />
            </div>

            {/* 强化结果展示（5×3 格子，可视化等级进度） */}
            <div
              className="flex gap-1 items-center flex-row"
              style={{ marginTop: '4px' }}
            >
              {/* 15 个等级格子（5×3 网格） */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(5, 8px)`,
                  gridTemplateRows: `repeat(3, 8px)`,
                  gap: '2px',
                  flexShrink: 0,
                }}
              >
                {Array.from({ length: MAX_ENHANCE_LEVEL }).map((_, i) => {
                  const filled = i < currentLevel;
                  return (
                    <div
                      key={i}
                      style={{
                        borderRadius: '2px',
                        background: filled
                          ? `linear-gradient(135deg, ${rarityColor}, ${hexToRgba(rarityColor, 0.5)})`
                          : 'rgba(19, 16, 37, 0.5)',
                        border: `0.5px solid ${filled ? rarityColor : 'rgba(100, 100, 130, 0.25)'}`,
                        boxShadow: filled ? `0 0 3px ${hexToRgba(rarityColor, 0.4)}` : 'none',
                      }}
                      title={`+${i + 1}`}
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
                  background: 'linear-gradient(to bottom, rgba(255, 230, 0, 0.05), rgba(255, 230, 0, 0.5) 20%, rgba(0, 245, 212, 0.4) 80%, rgba(0, 245, 212, 0.05))',
                  flexShrink: 0,
                }}
              />

              {/* 概率信息：4 行 */}
              <div className="flex flex-col" style={{ ...neonText, fontSize: '6px', lineHeight: 1.4, flex: 1, minWidth: 0 }}>
                <div style={{ color: '#8B80A0' }}>成功概率：</div>
                <div style={{ color: isMax ? '#5A5A7A' : (displayRatePercent === 100 ? neonGreen : displayRatePercent >= 50 ? neonYellow : '#FF6B35') }}>
                  {isMax ? '已达上限' : hasBonus
                    ? `${basePercent}%+${bonusPercent}%=${displayRatePercent}%`
                    : `${displayRatePercent}%`}
                </div>
                <div style={{ color: '#8B80A0' }}>失败结果：</div>
                <div style={{ wordBreak: 'break-all' }}>
                  {failResult === 'none' && <span style={{ color: neonGreen }}>无</span>}
                  {failResult === 'keep' && <span style={{ color: neonYellow }}>保留等级</span>}
                  {failResult === 'minus2' && <span style={{ color: '#FF6B35' }}>等级-2</span>}
                  {failResult === 'minus1' && <span style={{ color: '#FF2D55' }}>等级-1</span>}
                </div>
              </div>
            </div>

            {/* 金币消耗（左侧 panel 底部） */}
            <div className="flex justify-between items-center" style={{ marginTop: '4px', lineHeight: 1 }}>
              <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>金币消耗</span>
              <span
                style={{
                  ...neonText,
                  fontSize: '8px',
                  color: playerGold < goldCost ? '#FF2D55' : '#FFD700',
                  fontWeight: 700,
                }}
              >
                {goldCost}
              </span>
            </div>
          </div>

          {/* 竖线分隔符 */}
          <div
            aria-hidden
            style={{
              width: '1px',
              alignSelf: 'stretch',
              background: 'linear-gradient(to bottom, rgba(255, 230, 0, 0.05), rgba(255, 230, 0, 0.5) 20%, rgba(0, 245, 212, 0.4) 80%, rgba(0, 245, 212, 0.05))',
              boxShadow: '0 0 4px rgba(255, 230, 0, 0.3)',
              flexShrink: 0,
            }}
          />

          {/* 右侧：强化道具列表 */}
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
              强化道具
            </div>
            <div
              className="flex flex-col gap-1 overflow-y-auto"
              style={{ flex: 1, minHeight: 0, paddingRight: '2px' }}
            >
              {items.map(({ def, count }) => {
                const isSelected = selectedItemId === def.id;
                const itemRarityColor = RARITY_COLORS[def.rarity] || '#9A9A9A';
                // 卷轴限等级使用检查
                let usable = true;
                let unusableReason = '';
                if (def.mode === 'scroll' && def.maxLevel) {
                  if (currentLevel >= def.maxLevel) {
                    usable = false;
                    unusableReason = `限${def.maxLevel}以下`;
                  }
                }
                if (count <= 0) {
                  usable = false;
                  unusableReason = '库存不足';
                }
                if (isMax) {
                  usable = false;
                  unusableReason = '已达上限';
                }
                return (
                  <button
                    key={def.id}
                    onClick={() => usable && setSelectedItemId(def.id)}
                    disabled={!usable}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 4px',
                      background: isSelected
                        ? `linear-gradient(90deg, ${hexToRgba(itemRarityColor, 0.25)} 0%, ${hexToRgba(itemRarityColor, 0.08)} 100%)`
                        : 'rgba(19, 16, 37, 0.6)',
                      border: `1px solid ${isSelected ? itemRarityColor : 'rgba(100, 100, 130, 0.25)'}`,
                      borderRadius: '4px',
                      cursor: usable ? 'pointer' : 'not-allowed',
                      width: '100%',
                      textAlign: 'left',
                      opacity: usable ? 1 : 0.5,
                      boxShadow: isSelected ? `0 0 4px ${hexToRgba(itemRarityColor, 0.3)}` : 'none',
                    }}
                    title={def.description}
                  >
                    {/* Panel 1: 图标 + 名称 */}
                    <div className="flex items-center gap-1" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ width: '16px', height: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <EnhanceItemIcon itemId={def.id} size={16} />
                      </div>
                      <span
                        style={{
                          ...neonText,
                          fontSize: '7px',
                          color: isSelected ? '#FFFFFF' : itemRarityColor,
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
                    {/* Panel 2: 数量 + 状态 */}
                    <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                      {usable ? (
                        <span style={{ ...neonText, fontSize: '6.5px', color: neonYellow, fontWeight: 700 }}>×{count}</span>
                      ) : (
                        <span style={{ ...neonText, fontSize: '6px', color: '#FF2D55', fontWeight: 700 }}>{unusableReason}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部按钮区：自动强化 / 强化 / 使用 */}
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
            自动强化
          </button>
          <button
            onClick={handleEnhanceGold}
            disabled={isProcessing || isMax || playerGold < goldCost}
            style={{
              flex: 1,
              padding: '5px 0',
              background: isMax || playerGold < goldCost
                ? 'rgba(100, 100, 130, 0.25)'
                : `linear-gradient(180deg, ${neonYellow} 0%, #FF8C00 100%)`,
              border: 'none',
              borderRadius: '5px',
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              fontSize: '10px',
              fontWeight: 700,
              color: isMax || playerGold < goldCost ? '#5A5A7A' : '#0A0814',
              cursor: isMax || playerGold < goldCost || isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: isMax || playerGold < goldCost ? 'none' : `0 0 6px ${hexToRgba(neonYellow, 0.4)}`,
            }}
          >
            {isMax ? '已满级' : isProcessing ? '强化中...' : '强化'}
          </button>
          <button
            onClick={handleEnhanceItem}
            disabled={isProcessing || isMax || !selectedItemId}
            style={{
              flex: 1,
              padding: '5px 0',
              background: !selectedItemId || isMax
                ? 'rgba(100, 100, 130, 0.25)'
                : `linear-gradient(180deg, ${neonGreen} 0%, ${neonCyan} 100%)`,
              border: 'none',
              borderRadius: '5px',
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              fontSize: '10px',
              fontWeight: 700,
              color: !selectedItemId || isMax ? '#5A5A7A' : '#0A0814',
              cursor: !selectedItemId || isMax || isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: !selectedItemId || isMax ? 'none' : `0 0 6px ${hexToRgba(neonGreen, 0.4)}`,
            }}
          >
            使用
          </button>
        </div>
      </div>

      {/* 悬浮提示 */}
      {floatToast && (
        <div
          key={toastKey}
          className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${
            floatToast.success ? 'enhance-success-toast' : 'gem-embed-fail-toast'
          }`}
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div
            style={{
              ...neonText,
              fontSize: floatToast.success ? '14px' : '12px',
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
