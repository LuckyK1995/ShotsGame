import { useState, useMemo, memo } from 'react';
import { useGameStore } from '../store/gameStore';
import { EquipmentIcon } from './EquipmentIcon';
import { EquipmentDetailModal, itemSlotStyle } from './EquipmentDetailModal';
import { getItemDef } from '../game/data/equipment';
import { RARITY_COLORS, RARITY_LABELS } from '../game/data/equipment';
import type { Mail, Equipment, ItemStack } from '../game/types/game';
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonBlue, neonText, neonRed } from '../theme/colors';
import { hexToRgba } from '../utils/styles';
import { ModalHudBackground } from './ModalHudBackground';

interface GameEngineRef {
  current: {
    claimMailAttachments: (mailId: string) => { success: boolean; reason?: string } | null;
    removeMail: (mailId: string) => void;
    markMailRead: (mailId: string) => void;
    markAllMailsRead: (mailType: 'system' | 'battle') => void;
    removeAllReadMails: (mailType: 'system' | 'battle') => { removed: number; skipped: number };
    claimAllMailAttachments: (mailType: 'system' | 'battle') => { success: boolean; equipShortage?: number; itemShortage?: number };
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

function MailPanelImpl({ engineRef, onClose }: MailPanelProps) {
  const mails = useGameStore(s => s.mails);
  const [mailTab, setMailTab] = useState<'battle' | 'system'>('battle');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ success: boolean; message: string } | null>(null);
  const [detailItem, setDetailItem] = useState<{ type: 'equipment' | 'item'; equipment?: Equipment; itemStack?: ItemStack } | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const filteredMails = useMemo(() => mails.filter(m => m.type === mailTab), [mails, mailTab]);

  const battleUnread = useMemo(() => mails.filter(m => m.type === 'battle' && !m.read).length, [mails]);
  const systemUnread = useMemo(() => mails.filter(m => m.type === 'system' && !m.read).length, [mails]);
  // 当前标签下未读邮件数（为0时按钮切换为一键删除）
  const currentUnread = mailTab === 'battle' ? battleUnread : systemUnread;

  const selectedMail = selectedId ? mails.find(m => m.id === selectedId) : null;

  const showToast = (success: boolean, message: string) => {
    setToast({ success, message });
    setTimeout(() => setToast(null), 2000);
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

  const handleMarkAllRead = () => {
    engineRef.current?.markAllMailsRead(mailTab);
    showToast(true, '已全部标记为已读');
  };

  const handleRemoveAllRead = () => {
    const ret = engineRef.current?.removeAllReadMails(mailTab);
    if (!ret) {
      showToast(false, '引擎未就绪');
      return;
    }
    if (ret.skipped > 0) {
      showToast(false, `${ret.removed > 0 ? `已删除${ret.removed}封，` : ''}${ret.skipped}封有未领取附件无法删除`);
    } else {
      showToast(true, `已删除${ret.removed}封邮件`);
    }
    setSelectedId(null);
  };

  const handleClaimAll = () => {
    const ret = engineRef.current?.claimAllMailAttachments(mailTab);
    if (!ret) {
      showToast(false, '引擎未就绪');
      return;
    }
    if (ret.success) {
      showToast(true, '✦ 全部领取成功 ✦');
    } else {
      const parts: string[] = [];
      if (ret.equipShortage && ret.equipShortage > 0) parts.push(`装备栏格子不足【-${ret.equipShortage}】`);
      if (ret.itemShortage && ret.itemShortage > 0) parts.push(`物品栏格子不足【-${ret.itemShortage}】`);
      showToast(false, parts.join('、'));
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* 装备详情弹窗：复用共享 EquipmentDetailModal */}
      {detailItem?.type === 'equipment' && detailItem.equipment && (
        <EquipmentDetailModal equipment={detailItem.equipment} onClose={() => setDetailItem(null)} />
      )}
      {/* 物品详情弹窗：沿用本地 ItemDetail */}
      {detailItem?.type === 'item' && detailItem.itemStack && (
        <div
          onClick={() => setDetailItem(null)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '180px',
              minWidth: '120px',
              background: 'rgba(13, 11, 26, 0.97)',
              border: `1px solid ${hexToRgba(neonCyan, 0.4)}`,
              borderRadius: '8px',
              padding: '6px 8px',
              boxShadow: `0 0 16px ${hexToRgba(neonCyan, 0.3)}`,
              cursor: 'default',
            }}
          >
            <ItemDetail stack={detailItem.itemStack} />
          </div>
        </div>
      )}

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

      {/* 标签栏 */}
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

      {/* 主体：左右分栏 */}
      <div
        className="flex-1 overflow-hidden m-0.5 mt-0 p-1.5 flex gap-1.5"
        style={{
          position: 'relative',
          background: 'rgba(19, 16, 37, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(176, 38, 255, 0.2)',
          borderRadius: '0 10px 10px 10px',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3), 0 0 20px rgba(176, 38, 255, 0.08)',
        }}
      >
        {/* HUD 背景：与按钮区不同纹路/颜色（按当前邮件标签着色） */}
        <ModalHudBackground
          accentColor={mailTab === 'battle' ? neonPink : neonBlue}
          accentColor2={neonPurple}
        />
        <div className="relative flex gap-1.5" style={{ zIndex: 1, flex: 1, minHeight: 0 }}>
        {/* 左侧：邮件列表 + 一键操作panel（垂直堆叠，宽度与列表对齐120px） */}
        <div
          className="flex flex-col"
          style={{ width: '120px', flexShrink: 0, gap: '3px', minHeight: 0 }}
        >
          <div className="flex flex-col overflow-y-auto" style={{ gap: '3px', flex: 1, minHeight: 0, padding: '3px', border: `1px solid ${hexToRgba(neonPurple, 0.25)}`, borderRadius: '5px' }}>
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

          {/* 一键操作panel：上下堆叠，无边框，宽度与邮件列表对齐 */}
          <div
            className="flex flex-col gap-1"
            style={{
              flexShrink: 0,
            }}
          >
            <button
              onClick={currentUnread === 0 ? () => setConfirmDeleteAll(true) : handleMarkAllRead}
              style={{
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '8px',
                fontWeight: 600,
                color: currentUnread === 0 ? neonRed : neonBlue,
                background: currentUnread === 0 ? 'rgba(255, 45, 85, 0.1)' : 'rgba(79, 172, 254, 0.1)',
                border: currentUnread === 0 ? '1px solid rgba(255, 45, 85, 0.3)' : '1px solid rgba(79, 172, 254, 0.3)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              {currentUnread === 0 ? '一键删除' : '一键已读'}
            </button>
            <button
              onClick={handleClaimAll}
              style={{
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '8px',
                fontWeight: 600,
                color: neonGreen,
                background: 'rgba(0, 255, 157, 0.1)',
                border: '1px solid rgba(0, 255, 157, 0.3)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              一键领取
            </button>
          </div>
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
        <div className="flex flex-col flex-1 min-w-0" style={{ gap: '4px', minHeight: 0 }}>
          {!selectedMail ? (
            <div
              className="flex items-center justify-center"
              style={{ ...neonText, fontSize: '8px', color: '#5A5A7A', flex: 1 }}
            >
              请选择一封邮件查看
            </div>
          ) : (
            <>
              {/* 可滚动内容区：标题、时间、正文 */}
              <div className="flex flex-col overflow-y-auto" style={{ gap: '4px', flex: 1, minHeight: 0 }}>
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
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedMail.body}
              </div>
              </div>

              {/* 固定附件区：物品栏 + 金币固定在下方，金币作为图标格子放在最后 */}
              {selectedMail.attachments && (() => {
                const hasEquip = (selectedMail.attachments.equipment?.length || 0) > 0;
                const hasItems = (selectedMail.attachments.items?.length || 0) > 0;
                const hasGold = (selectedMail.attachments.gold || 0) > 0;
                const hasAnyAttachment = hasEquip || hasItems || hasGold;
                if (!hasAnyAttachment) return null;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
                    <div style={{ ...neonText, fontSize: '7px', color: neonYellow, letterSpacing: '1px' }}>
                      ✦ 附件
                    </div>
                    {/* 物品、装备、金币统一格子区（金币固定在最后） */}
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
                        <AttachmentEquipment
                          key={`eq${i}`}
                          equipment={eq}
                          onClick={() => setDetailItem({ type: 'equipment', equipment: eq })}
                        />
                      ))}
                      {selectedMail.attachments.items?.map((it, i) => (
                        <AttachmentItem
                          key={`it${i}`}
                          stack={it}
                          onClick={() => setDetailItem({ type: 'item', itemStack: it })}
                        />
                      ))}
                      {hasGold && (
                        <AttachmentGold gold={selectedMail.attachments.gold || 0} />
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 固定操作栏：始终显示在底部，靠右对齐 */}
              <div className="flex gap-1.5 items-center justify-end" style={{ flexShrink: 0, paddingTop: '2px' }}>
                {selectedMail.attachments && !selectedMail.claimed && (
                  <button
                    onClick={handleClaim}
                    style={{
                      fontFamily: '"Rajdhani", "Orbitron", monospace',
                      fontSize: '8px',
                      fontWeight: 600,
                      color: neonGreen,
                      background: 'rgba(0, 255, 157, 0.1)',
                      border: '1px solid rgba(0, 255, 157, 0.3)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      width: '90px',
                    }}
                  >
                    领取附件
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", monospace',
                    fontSize: '8px',
                    fontWeight: 600,
                    color: neonRed,
                    background: 'rgba(255, 45, 85, 0.1)',
                    border: '1px solid rgba(255, 45, 85, 0.3)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    width: '60px',
                  }}
                >
                  删除
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* 一键删除确认弹窗（样式与重开按钮弹窗一致） */}
      {confirmDeleteAll && (
        <div
          className="absolute inset-0 flex items-center justify-center z-[90]"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmDeleteAll(false)}
        >
          <div
            className="relative p-5"
            style={{
              width: '260px',
              background: 'rgba(19, 16, 37, 0.95)',
              border: `1px solid ${neonRed}40`,
              borderRadius: '14px',
              boxShadow: `0 0 30px ${neonRed}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
              backdropFilter: 'blur(12px)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHudBackground accentColor={neonCyan} accentColor2={neonPurple} />
            <div className="relative" style={{ zIndex: 1 }}>
            {/* 图标 */}
            <div className="flex flex-col items-center mb-4">
              <div
                className="mb-2"
                style={{
                  filter: `drop-shadow(0 0 8px ${neonRed}80)`,
                  fontSize: '28px',
                  lineHeight: 1,
                }}
              >
                ✕
              </div>
              <h2
                style={{
                  ...neonText,
                  fontSize: '14px',
                  color: neonRed,
                  textShadow: `0 0 8px ${neonRed}60`,
                }}
              >
                确认删除全部{mailTab === 'battle' ? '战斗' : '系统'}邮件？
              </h2>
              <p style={{ ...neonText, fontSize: '8px', color: '#8B80A0', marginTop: '4px', letterSpacing: '0.5px' }}>
                有未领取附件的邮件将保留
              </p>
            </div>

            {/* 按钮 */}
            <div className="flex gap-2.5">
              <button
                style={{
                  flex: 1,
                  background: 'rgba(255, 45, 85, 0.15)',
                  border: `1px solid ${neonRed}50`,
                  borderRadius: '8px',
                  ...neonText,
                  fontSize: '11px',
                  color: neonRed,
                  boxShadow: `0 0 10px ${neonRed}20`,
                  padding: '8px 0',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 45, 85, 0.28)';
                  e.currentTarget.style.boxShadow = `0 0 16px ${neonRed}45`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 45, 85, 0.15)';
                  e.currentTarget.style.boxShadow = `0 0 10px ${neonRed}20`;
                }}
                onClick={() => {
                  setConfirmDeleteAll(false);
                  handleRemoveAllRead();
                }}
              >
                确定
              </button>
              <button
                style={{
                  flex: 1,
                  background: 'rgba(100, 100, 130, 0.15)',
                  border: `1px solid rgba(150, 150, 180, 0.35)`,
                  borderRadius: '8px',
                  ...neonText,
                  fontSize: '11px',
                  color: '#A0A0B8',
                  padding: '8px 0',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 100, 130, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 100, 130, 0.15)';
                }}
                onClick={() => setConfirmDeleteAll(false)}
              >
                返回
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* 浮动提示 */}
      {toast && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            ...neonText,
            fontSize: '9px',
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
            maxWidth: '90%',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

// 附件装备图标（可点击查看详情，与装备栏格子统一 36×36）
function AttachmentEquipment({ equipment, onClick }: { equipment: Equipment; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={`${equipment.name} (点击查看详情)`}
      className="flex items-center justify-center relative"
      style={{
        width: '36px',
        height: '36px',
        ...itemSlotStyle(equipment.rarity),
        flexShrink: 0,
        padding: 0,
      }}
    >
      <EquipmentIcon slot={equipment.slot} rarity={equipment.rarity} variant={equipment.iconVariant} size={28} gemCount={equipment.socketedGems?.length || 0} enhanceLevel={equipment.enhanceLevel || 0} level={equipment.level} />
    </button>
  );
}

// 附件物品（可点击查看详情，与装备栏格子统一 36×36）
function AttachmentItem({ stack, onClick }: { stack: ItemStack; onClick: () => void }) {
  const def = getItemDef(stack.itemId);
  if (!def) return null;
  return (
    <button
      onClick={onClick}
      title={`${def.name} ×${stack.count} (点击查看详情)`}
      className="flex items-center justify-center relative"
      style={{
        width: '36px',
        height: '36px',
        ...itemSlotStyle(def.rarity),
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span style={{ fontSize: '18px' }}>{def.icon}</span>
      <span
        style={{
          position: 'absolute',
          right: '2px',
          bottom: '1px',
          fontFamily: '"Rajdhani", monospace',
          fontSize: '9px',
          fontWeight: 700,
          color: '#FFFFFF',
          textShadow: '0 0 3px #000, 0 0 2px #000',
        }}
      >
        {stack.count}
      </span>
    </button>
  );
}

// 附件金币（与装备/物品格子统一 36×36，固定显示在附件最后位置）
function AttachmentGold({ gold }: { gold: number }) {
  return (
    <div
      title={`金币 ×${gold}`}
      className="flex items-center justify-center relative"
      style={{
        width: '36px',
        height: '36px',
        background: 'radial-gradient(circle at 50% 45%, #6A5A20 0%, #4A3A10 55%, #2F2808 100%)',
        border: '2.5px solid rgba(255, 215, 0, 0.55)',
        borderRadius: '8px',
        boxShadow: '0 0 6px rgba(255, 215, 0, 0.2)',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span style={{ fontSize: '18px', filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.6))' }}>💰</span>
      <span
        style={{
          position: 'absolute',
          right: '2px',
          bottom: '1px',
          fontFamily: '"Rajdhani", monospace',
          fontSize: '9px',
          fontWeight: 700,
          color: '#FFE066',
          textShadow: '0 0 3px #000, 0 0 2px #000',
        }}
      >
        {gold}
      </span>
    </div>
  );
}

// 物品详情弹窗内容
function ItemDetail({ stack }: { stack: ItemStack }) {
  const def = getItemDef(stack.itemId);
  if (!def) return <div style={{ ...neonText, fontSize: '7px', color: '#9A9AB0' }}>未知物品</div>;
  const rarityColor = RARITY_COLORS[def.rarity] || '#9A9A9A';
  const rarityLabel = RARITY_LABELS[def.rarity] || '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{
        ...neonText,
        fontSize: '9px',
        fontWeight: 700,
        color: rarityColor,
        textShadow: `0 0 4px ${hexToRgba(rarityColor, 0.5)}`,
      }}>
        {def.icon} {def.name}
      </div>
      <div style={{ ...neonText, fontSize: '7px', color: '#9A9AB0' }}>
        {rarityLabel} ×{stack.count}
      </div>
      {def.description && (
        <div style={{ ...neonText, fontSize: '6.5px', color: '#C0C0D0', lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
          {def.description}
        </div>
      )}
    </div>
  );
}

export const MailPanel = memo(MailPanelImpl);
