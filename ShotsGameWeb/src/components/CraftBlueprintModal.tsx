import { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { EquipmentIcon } from './EquipmentIcon';
import { RARITY_COLORS, SLOT_LABELS, getRarityName, getBlueprintDefFromItemId } from '../game/data/equipment';
import type { Blueprint } from '../game/types/game';
import { neonCyan, neonPurple, neonYellow, neonRed, neonGreen } from '../theme/colors';
import { hexToRgba } from '../utils/styles';
import { ModalShell } from './ModalShell';
import { itemSlotStyle } from './EquipmentDetailModal';

interface GameEngineRef {
  current: {
    craftBlueprint?: (bpId: string) => { success: boolean; msg?: string };
    getItemCount?: (itemId: string) => number;
  } | null;
}

interface CraftBlueprintModalProps {
  engineRef: GameEngineRef;
  /** 设计图道具 ID（即 Blueprint.id） */
  blueprintItemId: string;
  onClose: () => void;
}

export function CraftBlueprintModal({ engineRef, blueprintItemId, onClose }: CraftBlueprintModalProps) {
  const playerGold = useGameStore(s => s.player?.gold ?? 0);
  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);
  // 版本号：每次制作后递增，强制重新计算材料持有量
  const [version, setVersion] = useState(0);

  // 反查 Blueprint 元数据
  const bp = useMemo<Blueprint | null>(() => {
    return getBlueprintDefFromItemId(blueprintItemId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprintItemId, version]);

  // 实时获取材料持有量
  const materialStatus = useMemo(() => {
    if (!bp) return [];
    return bp.materials.map(m => ({
      ...m,
      have: engineRef.current?.getItemCount?.(m.itemId) ?? 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bp, engineRef, version]);

  if (!bp) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-[300]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <ModalShell accentColor={neonRed} accentColor2={neonPurple} width={260} onClick={(e) => e.stopPropagation()}>
          <div className="p-5 text-center">
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>❓</div>
            <div
              style={{
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '11px',
                color: neonRed,
                fontWeight: 700,
              }}
            >
              设计图无效
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '6px 0',
                background: 'rgba(100,100,130,0.15)',
                border: '1px solid rgba(150,150,180,0.35)',
                borderRadius: '8px',
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '10px',
                color: '#A0A0B8',
                cursor: 'pointer',
              }}
            >
              关闭
            </button>
          </div>
        </ModalShell>
      </div>
    );
  }

  const rarityColor = RARITY_COLORS[bp.rarity];
  const accent = bp.rarity === 'legendary' ? neonYellow : neonPurple;
  const matsOk = materialStatus.every(m => m.have >= m.count);
  const goldOk = playerGold >= bp.goldCost;
  const canCraft = matsOk && goldOk;

  const handleCraft = () => {
    if (!engineRef.current?.craftBlueprint) return;
    const ret = engineRef.current.craftBlueprint(bp.id);
    if (ret.success) {
      setResultMsg({ success: true, text: '制作成功！装备已入仓' });
      setVersion(v => v + 1);
    } else {
      setResultMsg({ success: false, text: ret.msg || '制作失败' });
    }
  };

  const handleClose = () => {
    setResultMsg(null);
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
        accentColor={accent}
        accentColor2={rarityColor}
        width={280}
        borderRadius={14}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          {/* 头部：设计图图标 + 名称 */}
          <div className="flex flex-col items-center mb-3">
            <div
              className="flex items-center justify-center mb-1.5"
              style={{
                width: '40px',
                height: '40px',
                ...itemSlotStyle(bp.rarity),
              }}
            >
              <EquipmentIcon slot={bp.slot} rarity={bp.rarity} variant={1} size={32} level={bp.level} />
            </div>
            <h2
              style={{
                fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                fontWeight: 700,
                letterSpacing: '1px',
                fontSize: '12px',
                color: accent,
                textShadow: `0 0 8px ${accent}60`,
              }}
            >
              {bp.name}
            </h2>
            <p
              style={{
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '8px',
                color: '#8B80A0',
                marginTop: '2px',
                letterSpacing: '0.5px',
              }}
            >
              使用后制作 {getRarityName(bp.rarity)} Lv.{bp.level} {SLOT_LABELS[bp.slot as keyof typeof SLOT_LABELS]}
            </p>
          </div>

          {/* 材料需求 */}
          <div
            style={{
              background: 'rgba(10, 8, 20, 0.5)',
              border: `1px solid ${hexToRgba(accent, 0.2)}`,
              borderRadius: '8px',
              padding: '6px 8px',
            }}
          >
            <div
              style={{
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '8px',
                color: '#8B80A0',
                marginBottom: '5px',
                letterSpacing: '1px',
                fontWeight: 700,
              }}
            >
              ▸ 制作材料
            </div>
            {materialStatus.map((m, idx) => {
              const ok = m.have >= m.count;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between"
                  style={{ padding: '3px 0', borderBottom: idx < materialStatus.length - 1 ? `1px solid ${hexToRgba(accent, 0.08)}` : 'none' }}
                >
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: '14px' }}>{m.icon}</span>
                    <span
                      style={{
                        fontFamily: '"Rajdhani", "Orbitron", monospace',
                        fontSize: '9px',
                        color: '#A0A0B8',
                      }}
                    >
                      {m.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: ok ? neonGreen : neonRed,
                    }}
                  >
                    {m.have}/{m.count}
                  </span>
                </div>
              );
            })}
            {/* 金币消耗 */}
            <div
              className="flex items-center justify-between"
              style={{ padding: '5px 0 0', marginTop: '4px', borderTop: `1px solid ${hexToRgba(accent, 0.15)}` }}
            >
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: '13px' }}>🪙</span>
                <span
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '9px',
                    color: '#A0A0B8',
                  }}
                >
                  制作金币
                </span>
              </div>
              <span
                style={{
                  fontFamily: '"Rajdhani", "Orbitron", monospace',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: goldOk ? neonGreen : neonRed,
                }}
              >
                {playerGold}/{bp.goldCost}
              </span>
            </div>
          </div>

          {/* 结果提示 */}
          {resultMsg && (
            <div
              className="mt-2"
              style={{
                padding: '6px 8px',
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
                background: canCraft ? hexToRgba(accent, 0.15) : 'rgba(100,100,130,0.1)',
                border: `1px solid ${canCraft ? hexToRgba(accent, 0.5) : 'rgba(100,100,130,0.2)'}`,
                borderRadius: '8px',
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '10px',
                fontWeight: 700,
                color: canCraft ? accent : '#5A5A7A',
                boxShadow: canCraft ? `0 0 10px ${hexToRgba(accent, 0.2)}` : 'none',
                padding: '7px 0',
                cursor: canCraft ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => {
                if (canCraft) {
                  e.currentTarget.style.background = hexToRgba(accent, 0.28);
                  e.currentTarget.style.boxShadow = `0 0 16px ${hexToRgba(accent, 0.45)}`;
                }
              }}
              onMouseLeave={(e) => {
                if (canCraft) {
                  e.currentTarget.style.background = hexToRgba(accent, 0.15);
                  e.currentTarget.style.boxShadow = `0 0 10px ${hexToRgba(accent, 0.2)}`;
                }
              }}
              onClick={handleCraft}
              disabled={!canCraft}
            >
              制作装备
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
      </ModalShell>
    </div>
  );
}
