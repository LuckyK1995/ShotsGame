import { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { EquipmentIcon } from './EquipmentIcon';
import { RARITY_COLORS, SLOT_LABELS, getRarityName } from '../game/data/equipment';
import type { Equipment } from '../game/types/game';
import { neonCyan, neonPurple, neonPink, neonYellow, neonRed, neonGreen } from '../theme/colors';
import { hexToRgba } from '../utils/styles';
import { ModalShell } from './ModalShell';
import { itemSlotStyle } from './EquipmentDetailModal';

// 道具类型：调整箱 / 变化器
type Mode = 'reroll' | 'transform';

interface GameEngineRef {
  current: {
    getStatRerollPreview?: (equipId: string) => {
      stats: { type: string; label: string; current: number; min: number; max: number }[];
      equip: Equipment;
    } | null;
    applyStatReroll?: (equipId: string) => { success: boolean; msg?: string };
    applyStatTransform?: (equipId: string) => {
      success: boolean;
      msg?: string;
      before?: string[];
      after?: string[];
    };
  } | null;
}

interface StatAdjustModalProps {
  engineRef: GameEngineRef;
  mode: Mode;
  onClose: () => void;
}

const MODE_CONFIG: Record<Mode, { title: string; subtitle: string; icon: string; accent: string; btn: string }> = {
  reroll: {
    title: '装备属性调整箱',
    subtitle: '在阈值范围内重摇属性数值（类型不变）',
    icon: '🎲',
    accent: neonCyan,
    btn: '使用调整箱',
  },
  transform: {
    title: '装备属性变化器',
    subtitle: '随机变更属性类型并重新赋予数值',
    icon: '🔀',
    accent: neonPurple,
    btn: '使用变化器',
  },
};

export function StatAdjustModal({ engineRef, mode, onClose }: StatAdjustModalProps) {
  const equipment = useGameStore(s => s.equipment);
  const equipmentStorage = useGameStore(s => s.equipmentStorage);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [transformResult, setTransformResult] = useState<{ before: string[]; after: string[] } | null>(null);
  // 版本号：每次应用后递增，强制重新计算预览
  const [version, setVersion] = useState(0);

  const cfg = MODE_CONFIG[mode];

  // 合并已装备 + 仓库中的装备
  const allEquip = useMemo(() => [...equipment, ...equipmentStorage], [equipment, equipmentStorage]);

  const selected = selectedId ? allEquip.find(e => e.id === selectedId) : null;
  const isInBattle = selectedId ? equipment.some(e => e.id === selectedId) : false;

  // 预览：调整箱模式显示阈值；变化器模式仅显示当前属性（类型会变）
  const preview = useMemo(() => {
    if (!selected || !engineRef.current?.getStatRerollPreview) return null;
    return engineRef.current.getStatRerollPreview(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, engineRef, version]);

  const handleConfirm = () => {
    if (!selected || !engineRef.current) return;
    setResultMsg(null);
    setTransformResult(null);

    if (mode === 'reroll') {
      const ret = engineRef.current.applyStatReroll?.(selected.id);
      if (ret?.success) {
        setResultMsg({ success: true, text: '属性已重新随机调整' });
        setVersion(v => v + 1);
      } else {
        setResultMsg({ success: false, text: ret?.msg || '使用失败' });
      }
    } else {
      const ret = engineRef.current.applyStatTransform?.(selected.id);
      if (ret?.success) {
        setResultMsg({ success: true, text: '属性已随机变更' });
        if (ret.before && ret.after) {
          setTransformResult({ before: ret.before, after: ret.after });
        }
        setVersion(v => v + 1);
      } else {
        setResultMsg({ success: false, text: ret?.msg || '使用失败' });
      }
    }
  };

  const handleClose = () => {
    setResultMsg(null);
    setTransformResult(null);
    setSelectedId(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[300]"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <ModalShell
        accentColor={cfg.accent}
        accentColor2={mode === 'reroll' ? neonPurple : neonPink}
        width={300}
        borderRadius={14}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          {/* 头部：图标 + 标题 + 副标题 */}
          <div className="flex flex-col items-center mb-3">
            <div
              className="mb-1.5"
              style={{
                fontSize: '24px',
                lineHeight: 1,
                filter: `drop-shadow(0 0 8px ${cfg.accent}80)`,
              }}
            >
              {cfg.icon}
            </div>
            <h2
              style={{
                fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                fontWeight: 700,
                letterSpacing: '1px',
                fontSize: '13px',
                color: cfg.accent,
                textShadow: `0 0 8px ${cfg.accent}60`,
              }}
            >
              {cfg.title}
            </h2>
            <p
              style={{
                fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                fontSize: '8px',
                color: '#8B80A0',
                marginTop: '3px',
                letterSpacing: '0.5px',
                textAlign: 'center',
              }}
            >
              {cfg.subtitle}
            </p>
          </div>

          {/* 装备选择网格 */}
          {!selected && (
            <div>
              <div
                style={{
                  fontFamily: '"Rajdhani", "Orbitron", monospace',
                  fontSize: '9px',
                  color: '#8B80A0',
                  marginBottom: '6px',
                  letterSpacing: '0.5px',
                }}
              >
                选择要调整的装备（已装备 + 仓库）：
              </div>
              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  padding: '4px',
                  background: 'rgba(10, 8, 20, 0.5)',
                  border: `1px solid ${hexToRgba(cfg.accent, 0.2)}`,
                  borderRadius: '8px',
                }}
              >
                {allEquip.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '20px 0',
                      fontSize: '9px',
                      color: '#5A5A7A',
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                    }}
                  >
                    暂无装备
                  </div>
                ) : (
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: 'repeat(5, 36px)',
                      gap: '4px',
                      justifyContent: 'center',
                    }}
                  >
                    {allEquip.map((e) => (
                      <EquipSelectTile
                        key={e.id}
                        equip={e}
                        onClick={() => {
                          setSelectedId(e.id);
                          setResultMsg(null);
                          setTransformResult(null);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 已选装备预览 */}
          {selected && preview && (
            <div>
              {/* 装备信息条 */}
              <div
                className="flex items-center gap-2 p-2 mb-2"
                style={{
                  background: 'rgba(10, 8, 20, 0.5)',
                  border: `1px solid ${hexToRgba(RARITY_COLORS[selected.rarity], 0.4)}`,
                  borderRadius: '8px',
                }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: '36px', height: '36px', ...itemSlotStyle(selected.rarity) }}
                >
                  <EquipmentIcon
                    slot={selected.slot}
                    rarity={selected.rarity}
                    variant={selected.iconVariant}
                    size={28}
                    gemCount={selected.socketedGems?.length || 0}
                    enhanceLevel={selected.enhanceLevel || 0}
                    level={selected.level}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: RARITY_COLORS[selected.rarity],
                      textShadow: `0 0 4px ${hexToRgba(RARITY_COLORS[selected.rarity], 0.5)}`,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getRarityName(selected.rarity)} {selected.name}
                  </div>
                  <div
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '7px',
                      color: '#8B80A0',
                      marginTop: '1px',
                    }}
                  >
                    {SLOT_LABELS[selected.slot as keyof typeof SLOT_LABELS]} · Lv.{selected.level}
                    {isInBattle && (
                      <span style={{ color: neonYellow, marginLeft: '4px' }}>· 已装备</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setResultMsg(null);
                    setTransformResult(null);
                  }}
                  style={{
                    background: 'rgba(100, 100, 130, 0.15)',
                    border: '1px solid rgba(150, 150, 180, 0.3)',
                    color: '#A0A0B8',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    borderRadius: '4px',
                    lineHeight: 1,
                  }}
                  title="重新选择"
                >
                  ↺
                </button>
              </div>

              {/* 属性列表：调整箱模式显示当前值+阈值；变化器模式仅显示当前值（类型会变） */}
              <div
                style={{
                  background: 'rgba(10, 8, 20, 0.5)',
                  border: `1px solid ${hexToRgba(cfg.accent, 0.2)}`,
                  borderRadius: '8px',
                  padding: '6px 8px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: mode === 'reroll' ? '1fr 50px 70px' : '1fr 60px',
                    gap: '4px 6px',
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '9px',
                    color: '#8B80A0',
                    marginBottom: '4px',
                    paddingBottom: '4px',
                    borderBottom: `1px solid ${hexToRgba(cfg.accent, 0.15)}`,
                  }}
                >
                  <div>属性</div>
                  <div style={{ textAlign: 'center' }}>当前</div>
                  {mode === 'reroll' && <div style={{ textAlign: 'center' }}>阈值范围</div>}
                </div>

                {preview.stats.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '12px 0',
                      fontSize: '9px',
                      color: '#5A5A7A',
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                    }}
                  >
                    该装备无基础属性
                  </div>
                ) : (
                  preview.stats.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: mode === 'reroll' ? '1fr 50px 70px' : '1fr 60px',
                        gap: '4px 6px',
                        fontSize: '10px',
                        fontFamily: '"Rajdhani", "Orbitron", monospace',
                        fontWeight: 700,
                        padding: '2px 0',
                      }}
                    >
                      <div style={{ color: STAT_COLOR[s.type] || '#E0E0FF' }}>{s.label}</div>
                      <div style={{ textAlign: 'center', color: STAT_COLOR[s.type] || '#E0E0FF' }}>
                        +{s.current}
                      </div>
                      {mode === 'reroll' && (
                        <div
                          style={{
                            textAlign: 'center',
                            color: '#A0A0B8',
                            fontSize: '8px',
                            fontWeight: 600,
                          }}
                        >
                          {s.min} ~ {s.max}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 变化器结果对比 */}
              {transformResult && (
                <div
                  className="mt-2"
                  style={{
                    background: 'rgba(155, 89, 182, 0.1)',
                    border: `1px solid ${hexToRgba(neonPurple, 0.4)}`,
                    borderRadius: '8px',
                    padding: '6px 8px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '8px',
                      color: neonPurple,
                      marginBottom: '4px',
                      letterSpacing: '0.5px',
                      fontWeight: 700,
                    }}
                  >
                    属性变化对比：
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '7px', color: '#8B80A0', marginBottom: '2px' }}>变更前</div>
                      {transformResult.before.map((s, i) => (
                        <div key={i} style={{ fontSize: '9px', color: '#A0A0B8', fontFamily: '"Rajdhani", monospace' }}>
                          {s}
                        </div>
                      ))}
                    </div>
                    <div style={{ color: neonPurple, fontSize: '12px' }}>→</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '7px', color: neonGreen, marginBottom: '2px' }}>变更后</div>
                      {transformResult.after.map((s, i) => (
                        <div key={i} style={{ fontSize: '9px', color: neonCyan, fontFamily: '"Rajdhani", monospace', fontWeight: 700 }}>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 结果提示 */}
              {resultMsg && (
                <div
                  className="mt-2"
                  style={{
                    padding: '5px 8px',
                    background: resultMsg.success
                      ? 'rgba(46, 204, 113, 0.1)'
                      : 'rgba(255, 45, 85, 0.1)',
                    border: `1px solid ${resultMsg.success ? hexToRgba(neonGreen, 0.4) : hexToRgba(neonRed, 0.4)}`,
                    borderRadius: '6px',
                    fontSize: '9px',
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontWeight: 700,
                    color: resultMsg.success ? neonGreen : neonRed,
                    textAlign: 'center',
                  }}
                >
                  {resultMsg.text}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 mt-3">
                <button
                  style={{
                    flex: 1,
                    background: hexToRgba(cfg.accent, 0.15),
                    border: `1px solid ${hexToRgba(cfg.accent, 0.5)}`,
                    borderRadius: '8px',
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: cfg.accent,
                    boxShadow: `0 0 10px ${hexToRgba(cfg.accent, 0.2)}`,
                    padding: '7px 0',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = hexToRgba(cfg.accent, 0.28);
                    e.currentTarget.style.boxShadow = `0 0 16px ${hexToRgba(cfg.accent, 0.45)}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = hexToRgba(cfg.accent, 0.15);
                    e.currentTarget.style.boxShadow = `0 0 10px ${hexToRgba(cfg.accent, 0.2)}`;
                  }}
                  onClick={handleConfirm}
                >
                  {cfg.btn}
                </button>
                <button
                  style={{
                    flex: 1,
                    background: 'rgba(100, 100, 130, 0.15)',
                    border: '1px solid rgba(150, 150, 180, 0.35)',
                    borderRadius: '8px',
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '10px',
                    color: '#A0A0B8',
                    padding: '7px 0',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(100, 100, 130, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(100, 100, 130, 0.15)';
                  }}
                  onClick={handleClose}
                >
                  关闭
                </button>
              </div>
            </div>
          )}

          {/* 未选装备时的关闭按钮 */}
          {!selected && (
            <div className="flex gap-2 mt-3">
              <button
                style={{
                  flex: 1,
                  background: 'rgba(100, 100, 130, 0.15)',
                  border: '1px solid rgba(150, 150, 180, 0.35)',
                  borderRadius: '8px',
                  fontFamily: '"Rajdhani", "Orbitron", monospace',
                  fontSize: '10px',
                  color: '#A0A0B8',
                  padding: '7px 0',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 100, 130, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 100, 130, 0.15)';
                }}
                onClick={handleClose}
              >
                关闭
              </button>
            </div>
          )}
        </div>
      </ModalShell>
    </div>
  );
}

// 属性类型 → 颜色
const STAT_COLOR: Record<string, string> = {
  attack: neonPink,
  health: '#34C759',
  defense: '#5BA3E0',
  critRate: neonPurple,
  range: '#34C759',
  pierce: neonYellow,
};

// 装备选择格子
function EquipSelectTile({ equip, onClick }: { equip: Equipment; onClick: () => void }) {
  const rarityColor = RARITY_COLORS[equip.rarity];
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center justify-center cursor-pointer relative"
      style={{
        width: '36px',
        height: '36px',
        ...itemSlotStyle(equip.rarity),
      }}
      title={`${getRarityName(equip.rarity)} ${equip.name} Lv.${equip.level}`}
    >
      <EquipmentIcon
        slot={equip.slot}
        rarity={equip.rarity}
        variant={equip.iconVariant}
        size={28}
        gemCount={equip.socketedGems?.length || 0}
        enhanceLevel={equip.enhanceLevel || 0}
        level={equip.level}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-1px',
          right: '0px',
          fontSize: '6px',
          fontFamily: '"Rajdhani", "Orbitron", monospace',
          fontWeight: 700,
          color: neonYellow,
          textShadow: '0 0 2px rgba(0,0,0,0.8)',
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        {equip.level}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `1px solid ${hexToRgba(rarityColor, 0.6)}`,
          borderRadius: '8px',
          opacity: 0,
          transition: 'opacity 0.15s',
          pointerEvents: 'none',
        }}
        className="hover-border"
      />
    </div>
  );
}
