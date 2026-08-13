// PK 玩家选择弹窗：拉取在线玩家列表，选择对手发起挑战
import React, { useEffect, useState, useCallback } from 'react';
import { pkApi, OnlinePlayer } from '../api/modules/pk';
import { neonCyan, neonPurple, neonPink, neonGreen, neonText } from '../theme/colors';
import { ModalHudBackground } from './ModalHudBackground';
import { useAuthStore } from '../store/authStore';

interface PkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPk: (player: OnlinePlayer) => void;
}

const PkModal: React.FC<PkModalProps> = ({ isOpen, onClose, onStartPk }) => {
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // 当前玩家档案（用于排除自己）
  const profile = useAuthStore((s) => s.profile);

  // 拉取在线玩家列表
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await pkApi.getOnlinePlayers();
      setPlayers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取在线玩家失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 打开时拉取 + 5 秒自动刷新
  useEffect(() => {
    if (!isOpen) return;
    fetchPlayers();
    const timer = window.setInterval(fetchPlayers, 5000);
    return () => window.clearInterval(timer);
  }, [isOpen, fetchPlayers]);

  if (!isOpen) return null;

  // 排除当前玩家自己
  const myId = profile?.id;
  const visiblePlayers = players.filter((p) => p.playerId !== myId);

  // 点击挑战：回调父组件并关闭弹窗
  const handleChallenge = (player: OnlinePlayer) => {
    onStartPk(player);
    onClose();
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <ModalHudBackground accentColor={neonCyan} accentColor2={neonPurple} />

        {/* 头部：标题 + 关闭按钮 */}
        <div style={headerStyle}>
          <span style={{ ...neonText, color: neonCyan, fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>
            在线玩家
          </span>
          <button style={closeBtnStyle} onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        {/* 列表区域 */}
        <div style={listContainerStyle}>
          {loading && players.length === 0 && <div style={emptyStyle}>加载中...</div>}

          {error && !loading && <div style={errorStyle}>{error}</div>}

          {!loading && !error && visiblePlayers.length === 0 && (
            <div style={emptyStyle}>暂无在线玩家，稍后再试</div>
          )}

          {visiblePlayers.map((p) => (
            <div key={p.playerId} style={cardStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={nameRowStyle}>
                  {/* 在线绿点指示 */}
                  <span style={onlineDotStyle} />
                  <span
                    style={{
                      ...neonText,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.displayName}
                  </span>
                </div>
                <div style={statsStyle}>
                  <span style={{ ...statStyle, color: neonCyan }}>Lv.{p.level}</span>
                  <span style={statStyle}>战力 {p.power}</span>
                  <span style={{ ...statStyle, color: neonGreen }}>
                    胜率 {(p.pkWinRate * 100).toFixed(0)}%
                  </span>
                  <span style={statStyle}>
                    {p.pkWins}胜/{p.pkLosses}负
                  </span>
                </div>
              </div>

              {/* 挑战按钮 */}
              <button style={challengeBtnStyle} onClick={() => handleChallenge(p)}>
                挑战
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============ 样式定义 ============ */

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  backdropFilter: 'blur(2px)',
};

const modalStyle: React.CSSProperties = {
  position: 'relative',
  width: 320,
  maxHeight: 460,
  background: 'rgba(19, 16, 37, 0.96)',
  border: `1.5px solid ${neonCyan}`,
  borderRadius: 14,
  boxShadow: `0 0 24px ${neonCyan}55, inset 0 0 24px ${neonPurple}22`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  borderBottom: `1px solid ${neonCyan}33`,
  position: 'relative',
  zIndex: 1,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: neonCyan,
  fontSize: 18,
  cursor: 'pointer',
  lineHeight: 1,
  padding: 0,
};

const listContainerStyle: React.CSSProperties = {
  overflowY: 'auto',
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flex: 1,
  position: 'relative',
  zIndex: 1,
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  background: 'rgba(176, 38, 255, 0.08)',
  border: `1px solid ${neonPurple}44`,
  borderRadius: 10,
};

const nameRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const onlineDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: neonGreen,
  boxShadow: `0 0 8px ${neonGreen}`,
  flexShrink: 0,
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 4,
  fontSize: 11,
};

const statStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.7)',
};

const challengeBtnStyle: React.CSSProperties = {
  padding: '7px 14px',
  background: `linear-gradient(135deg, ${neonPink}, ${neonPurple})`,
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  boxShadow: `0 0 10px ${neonPink}66`,
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  color: 'rgba(255,255,255,0.5)',
  padding: '40px 0',
  fontSize: 13,
};

const errorStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#FF2D55',
  padding: '40px 12px',
  fontSize: 13,
};

export default PkModal;
