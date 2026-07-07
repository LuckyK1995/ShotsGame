import { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { EquipmentIcon } from './EquipmentIcon';
import { getItemDef } from '../game/data/equipment';
import { RARITY_COLORS, RARITY_LABELS } from '../game/data/equipment';
import type { Mail, Equipment, ItemStack } from '../game/types/game';
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonBlue, neonText } from '../theme/colors';
import { hexToRgba } from '../utils/styles';

// hexToRgba/neonText 已移至 theme/colors 和 utils/styles（共享版本）

interface GameEngineRef {
  current: {
    claimMailAttachments: (mailId: string) => { success: boolean; reason?: string } | null;
    removeMail: (mailId: string) => void;
    markMailRead: (mailId: string) => void;
  } | null;
}

interface MailPanelProps {
  engineRef: GameEngineRef;
  onClose: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${m}-${day} ${h}:${min}`;
}

export function MailPanel({ engineRef, onClose }: MailPanelProps) {
  const mails = useGameStore(s => s.mails);
  const [mailTab, setMailTab] = useState<'battle' | 'system'>('battle');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ success: boolean; message: string } | null>(null);

  // 按类型筛选
  const filteredMails = useMemo(() => {
    return mails.filter(m => m.type === mailTab);
  }, [mails, mailTab]);

  // 未读数量
  const battleUnread = useMemo(() => mails.filter(m => m.type === 'battle' && !m.read).length, [mails]);
  const systemUnread = useMemo(() => mails.filter(m => m.type === 'system' && !m.read).length, [mails]);

  const selectedMail = selectedId ? mails.find(m => m.id === selectedId) : null;

  const showToast = (success: boolean, message: string) => {
    setToast({ success, message });
    setTimeout(() => setToast(null), 1500);
  };

  const handleSelectMail = (mail: Mail) => {
    setSelectedId(mail.id);
    if (!mail.read) {
      engineRef.current?.markMailRead(mail.id);
    }
  };

  const handleClaim = () => {
    if (!selectedMail) return;
    const ret = engineRef.current?.claimMailAttachments(selectedMail.id);
    if (!ret) {
      showToast(false, '引擎未就绪');
      return;
    }
    if (ret.success) {
      showToast(true, ret.reason ? `✦ ${ret.reason} ✦` : '✦ 附件已领取 ✦');
    } else {
      showToast(false, ret.reason || '领取失败');
    }
  };

  const handleDelete = () => {
    if (!selectedMail) return;
    if (!selectedMail.claimed && selectedMail.attachments) {
      const has = (selectedMail.attachments.equipment?.length || 0) > 0 ||
        (selectedMail.attachments.items?.length || 0) > 0 ||
        (selectedMail.attachments.gold || 0) > 0;
      if (has) {
        showToast(false, '请先领取附件');
        return;
      }
    }
    engineRef.current?.removeMail(selectedMail.id);
    setSelectedId(null);
    showToast(true, '已删除');
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* 右上角关闭按钮 */}
      <button
        onClick={onClose}
        aria-label="关闭邮件"
        style={{
          position: 'absolute',
          top: '4px',
          right: '6px',
          zIndex: 30,
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(19, 16, 37, 0.85)',
          color: neonCyan,
          fontSize: '20px',
          lineHeight: 1,
          cursor: 'pointer',
          borderRadius: '6px',
          border: `1px solid ${neonCyan}50`,
          boxShadow: `0 0 8px ${neonCyan}30`,
          textShadow: `0 0 6px ${neonCyan}80`,
          fontFamily: '"Rajdhani", "Orbitron", monospace',
          padding: 0,
          paddingBottom: '2px',
        }}
      >
        ﹀
      </button>

      {/* 标签栏：系统邮件 / 战斗邮件 */}
      <div className="flex gap-1.5 pl-1 pr-9 pt-1 relative z-10">
        {([
          { id: 'battle', label: '战斗邮件', icon: '⚔', count: battleUnread },
          { id: 'system', label: '系统邮件', icon: '✉', count: systemUnread },
        ] as const).map((tab) => {
          const isActive = mailTab === tab.id;
          const color = tab.id === 'battle' ? neonPink : neonBlue;
          return (
            <button
              key={tab.id}
              className="flex items-center justify-center gap-1 px-2 py-1.5 relative"
              style={{
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '8px',
                fontWeight: isActive ? 700 : 500,
                background: isActive ? 'rgba(19, 16, 37, 0.9)' : 'rgba(13, 11, 26, 0.6)',
                color: isActive ? color : '#5A5A7A',
                textShadow: isActive ? `0 0 8px ${color}80` : 'none',
                marginBottom: '-4px',
                zIndex: isActive ? 3 : 1,
                minWidth: '70px',
                height: '30px',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                borderRadius: '8px 8px 0 0',
                border: isActive ? `1px solid ${color}60` : '1px solid rgba(100,100,130,0.15)',
                borderBottom: isActive ? 'none' : '1px solid rgba(100,100,130,0.15)',
                boxShadow: isActive ? `0 0 12px ${color}30, inset 0 1px 0 rgba(255,255,255,0.08)` : 'none',
              }}
              onClick={() => { setMailTab(tab.id); setSelectedId(null); }}
            >
              <span style={{ fontSize: '10px', filter: isActive ? `drop-shadow(0 0 4px ${color}80)` : 'none' }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: neonPink,
                    color: '#0A0814',
                    fontSize: '7px',
                    fontWeight: 700,
                    minWidth: '12px',
                    height: '12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    boxShadow: `0 0 6px ${neonPink}`,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 主体：左右分栏 - 邮件列表 + 邮件详情 */}
      <div
        className="flex-1 overflow-hidden m-0.5 mt-0 p-1.5 flex gap-1.5"
        style={{
          background: 'rgba(19, 16, 37, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(176, 38, 255, 0.2)',
          borderRadius: '0 10px 10px 10px',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3), 0 0 20px rgba(176, 38, 255, 0.08)',
        }}
      >
        {/* 左侧：邮件列表 */}
        <div
          className="flex flex-col overflow-y-auto"
          style={{ width: '120px', flexShrink: 0, gap: '3px' }}
        >
          {filteredMails.length === 0 && (
            <div
              className="flex items-center justify-center"
              style={{ ...neonText, fontSize: '8px', color: '#5A5A7A', height: '40px' }}
            >
              暂无邮件
            </div>
          )}
          {filteredMails.map((mail) => {
            const isSelected = selectedId === mail.id;
            const hasUnclaimed = !mail.claimed && mail.attachments &&
              ((mail.attachments.equipment?.length || 0) > 0 ||
               (mail.attachments.items?.length || 0) > 0 ||
               (mail.attachments.gold || 0) > 0);
            return (
              <button
                key={mail.id}
                onClick={() => handleSelectMail(mail)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '1px',
                  padding: '3px 5px',
                  background: isSelected
                    ? 'linear-gradient(90deg, rgba(176, 38, 255, 0.25), rgba(176, 38, 255, 0.08))'
                    : 'rgba(13, 11, 26, 0.6)',
                  border: `1px solid ${isSelected ? neonPurple : 'rgba(100,100,130,0.2)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                }}
              >
                {/* 未读圆点 */}
                {!mail.read && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '4px',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: neonPink,
                      boxShadow: `0 0 4px ${neonPink}`,
                    }}
                  />
                )}
                {/* 附件标识 */}
                {hasUnclaimed && (
                  <span style={{ ...neonText, fontSize: '6px', color: neonYellow, lineHeight: 1 }}>
                    📦 附件
                  </span>
                )}
                <span
                  style={{
                    ...neonText,
                    fontSize: '7.5px',
                    fontWeight: 700,
                    color: isSelected ? neonCyan : (mail.read ? '#9A9AB0' : '#E0E0F0'),
                    lineHeight: 1.2,
                    wordBreak: 'break-all',
                  }}
                >
                  {mail.title}
                </span>
                <span style={{ ...neonText, fontSize: '6px', color: '#6A6A80', lineHeight: 1 }}>
                  {formatTime(mail.timestamp)}
                </span>
              </button>
            );
          })}
        </div>

        {/* 竖线分隔符 */}
        <div
          aria-hidden
          style={{
            width: '1px',
            background: 'linear-gradient(to bottom, rgba(176, 38, 255, 0.05), rgba(176, 38, 255, 0.5) 20%, rgba(0, 245, 212, 0.4) 80%, rgba(0, 245, 212, 0.05))',
            flexShrink: 0,
          }}
        />

        {/* 右侧：邮件详情 */}
        <div className="flex flex-col flex-1 min-w-0 overflow-y-auto" style={{ gap: '4px' }}>
          {!selectedMail ? (
            <div
              className="flex items-center justify-center"
              style={{ ...neonText, fontSize: '8px', color: '#5A5A7A', flex: 1 }}
            >
              请选择一封邮件查看
            </div>
          ) : (
            <>
              {/* 邮件标题 */}
              <div style={{ ...neonText, fontSize: '9px', fontWeight: 700, color: neonCyan, lineHeight: 1.2, wordBreak: 'break-all' }}>
                {selectedMail.title}
              </div>
              <div style={{ ...neonText, fontSize: '6.5px', color: '#6A6A80' }}>
                {formatTime(selectedMail.timestamp)}
              </div>

              {/* 邮件正文 */}
              <div
                style={{
                  ...neonText,
                  fontSize: '7.5px',
                  color: '#C0C0D0',
                  lineHeight: 1.4,
                  padding: '4px 5px',
                  background: 'rgba(13, 11, 26, 0.5)',
                  border: '1px solid rgba(100,100,130,0.15)',
                  borderRadius: '4px',
                }}
              >
                {selectedMail.body}
              </div>

              {/* 附件 */}
              {selectedMail.attachments && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ ...neonText, fontSize: '7px', color: neonYellow, letterSpacing: '1px' }}>
                    ✦ 附件
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '3px',
                      padding: '4px',
                      background: 'rgba(13, 11, 26, 0.5)',
                      border: `1px solid ${hexToRgba(neonYellow, 0.25)}`,
                      borderRadius: '4px',
                    }}
                  >
                    {selectedMail.attachments.equipment?.map((eq, i) => (
                      <AttachmentEquipment key={`eq${i}`} equipment={eq} />
                    ))}
                    {selectedMail.attachments.items?.map((it, i) => (
                      <AttachmentItem key={`it${i}`} stack={it} />
                    ))}
                    {selectedMail.attachments.gold ? (
                      <div style={{
                        ...neonText, fontSize: '7px', color: neonYellow,
                        display: 'flex', alignItems: 'center', gap: '2px',
                      }}>
                        💰 金币 ×{selectedMail.attachments.gold}
                      </div>
                    ) : null}
                    {(!selectedMail.attachments.equipment?.length &&
                      !selectedMail.attachments.items?.length &&
                      !selectedMail.attachments.gold) && (
                      <div style={{ ...neonText, fontSize: '7px', color: '#5A5A7A' }}>无附件</div>
                    )}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-1.5" style={{ marginTop: 'auto' }}>
                {selectedMail.attachments && !selectedMail.claimed && (
                  <button
                    onClick={handleClaim}
                    style={{
                      ...neonText,
                      flex: 1,
                      padding: '4px 6px',
                      fontSize: '8px',
                      fontWeight: 700,
                      color: '#0A0814',
                      background: 'linear-gradient(180deg, #00F5D4 0%, #4FACFE 100%)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 0 8px rgba(0, 245, 212, 0.4)',
                    }}
                  >
                    {selectedMail.claimed ? '已领取' : '领取附件'}
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  style={{
                    ...neonText,
                    padding: '4px 8px',
                    fontSize: '8px',
                    fontWeight: 700,
                    color: '#FF2D55',
                    background: 'rgba(255, 45, 85, 0.15)',
                    border: '1px solid rgba(255, 45, 85, 0.4)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  删除
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 浮动提示 */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            ...neonText,
            fontSize: '10px',
            fontWeight: 700,
            color: toast.success ? neonGreen : neonPink,
            padding: '6px 14px',
            background: 'rgba(10, 8, 20, 0.92)',
            border: `1px solid ${toast.success ? neonGreen : neonPink}`,
            borderRadius: '6px',
            boxShadow: `0 0 16px ${toast.success ? neonGreen : neonPink}80`,
            textShadow: `0 0 8px ${toast.success ? neonGreen : neonPink}`,
            pointerEvents: 'none',
            zIndex: 40,
            whiteSpace: 'nowrap',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

// 附件装备图标
function AttachmentEquipment({ equipment }: { equipment: Equipment }) {
  const rarityColor = RARITY_COLORS[equipment.rarity] || '#9A9A9A';
  return (
    <div
      title={`${equipment.name} (Lv.${equipment.level} ${RARITY_LABELS[equipment.rarity]})`}
      className="flex items-center justify-center relative"
      style={{
        width: '24px',
        height: '24px',
        background: 'radial-gradient(circle at 50% 40%, #2A2540 0%, #1E1A35 55%, #15122A 100%)',
        border: `1.5px solid ${hexToRgba(rarityColor, 0.5)}`,
        borderRadius: '5px',
        flexShrink: 0,
      }}
    >
      <EquipmentIcon slot={equipment.slot} rarity={equipment.rarity} variant={equipment.iconVariant} size={18} gemCount={equipment.socketedGems?.length || 0} enhanceLevel={equipment.enhanceLevel || 0} level={equipment.level} />
    </div>
  );
}

// 附件物品
function AttachmentItem({ stack }: { stack: ItemStack }) {
  const def = getItemDef(stack.itemId);
  if (!def) return null;
  const rarityColor = RARITY_COLORS[def.rarity] || '#9A9A9A';
  return (
    <div
      title={`${def.name} ×${stack.count}`}
      className="flex items-center justify-center relative"
      style={{
        width: '24px',
        height: '24px',
        background: 'radial-gradient(circle at 50% 40%, #2A2540 0%, #1E1A35 55%, #15122A 100%)',
        border: `1.5px solid ${hexToRgba(rarityColor, 0.5)}`,
        borderRadius: '5px',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '12px' }}>{def.icon}</span>
      <span
        style={{
          position: 'absolute',
          right: '1px',
          bottom: '0px',
          fontFamily: '"Rajdhani", monospace',
          fontSize: '7px',
          fontWeight: 700,
          color: '#FFFFFF',
          textShadow: '0 0 3px #000, 0 0 2px #000',
        }}
      >
        {stack.count}
      </span>
    </div>
  );
}
