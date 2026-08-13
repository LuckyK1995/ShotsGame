import { useState, useEffect, useCallback } from 'react';
import { playerApi, type LeaderboardEntry } from '../api/modules/player';
import { useAuthStore } from '../store/authStore';
import {
  neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonText,
} from '../theme/colors';
import { ModalHudBackground } from './ModalHudBackground';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 排行榜弹窗：按 战力>积分>等级 排序，单列表同时显示三项指标
export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const profile = useAuthStore(s => s.profile);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载排行榜
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await playerApi.getLeaderboard(50, 'power');
      setEntries(list);
    } catch (e: any) {
      setError(e?.message ?? '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-[100]"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative"
        style={{
          width: '320px',
          maxHeight: '460px',
          background: 'rgba(19, 16, 37, 0.96)',
          border: `1px solid ${neonCyan}50`,
          borderRadius: '14px',
          boxShadow: `0 0 30px ${neonCyan}30`,
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHudBackground accentColor={neonCyan} accentColor2={neonPurple} />

        {/* 头部 */}
        <div
          className="relative flex items-center justify-between"
          style={{ padding: '10px 14px', borderBottom: `1px solid ${neonCyan}30`, zIndex: 1 }}
        >
          <span style={{ ...neonText, fontSize: '12px', color: neonCyan, textShadow: `0 0 6px ${neonCyan}80` }}>
            排行榜
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: '#8B80A0',
              fontSize: '16px', cursor: 'pointer', lineHeight: 1, padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = neonPink; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8B80A0'; }}
          >
            ×
          </button>
        </div>

        {/* 表头 */}
        <div
          className="relative flex items-center"
          style={{
            padding: '4px 6px',
            borderBottom: `1px solid ${neonCyan}20`,
            zIndex: 1,
            ...neonText,
            fontSize: '7px',
            color: '#5A5A7A',
            letterSpacing: '0.5px',
            gap: '6px',
          }}
        >
          <span style={{ width: '22px', textAlign: 'center' }}>排名</span>
          <span style={{ width: '32px', textAlign: 'center' }}>状态</span>
          <span style={{ width: '40px' }}>ID</span>
          <span style={{ flex: 1 }}>玩家</span>
          <span style={{ width: '42px', textAlign: 'right', color: neonCyan }}>战力</span>
          <span style={{ width: '42px', textAlign: 'right', color: neonPurple }}>积分</span>
          <span style={{ width: '28px', textAlign: 'right', color: neonYellow }}>等级</span>
        </div>

        {/* 列表 */}
        <div
          className="relative flex-1 overflow-y-auto"
          style={{ padding: '6px 6px', zIndex: 1, scrollbarWidth: 'thin' }}
        >
          {loading && (
            <div style={{ ...neonText, fontSize: '9px', color: '#5A5A7A', textAlign: 'center', padding: '20px 0' }}>
              加载中...
            </div>
          )}
          {!loading && error && (
            <div style={{ ...neonText, fontSize: '9px', color: neonPink, textAlign: 'center', padding: '20px 0' }}>
              {error}
            </div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div style={{ ...neonText, fontSize: '9px', color: '#5A5A7A', textAlign: 'center', padding: '20px 0' }}>
              暂无数据
            </div>
          )}
          {entries.map((e) => {
            const isMe = e.playerId === profile?.id;
            const rankColor = e.rank === 1 ? neonYellow : e.rank === 2 ? neonCyan : e.rank === 3 ? neonPink : '#8B80A0';
            return (
              <div
                key={e.playerId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 6px',
                  marginBottom: '3px',
                  background: isMe ? `rgba(0, 245, 212, 0.10)` : 'rgba(13, 11, 26, 0.6)',
                  border: `0.5px solid ${isMe ? neonCyan + '50' : 'rgba(150, 150, 180, 0.15)'}`,
                  borderRadius: '5px',
                }}
              >
                {/* 排名 */}
                <span
                  style={{
                    ...neonText,
                    fontSize: '10px',
                    color: rankColor,
                    width: '22px',
                    textAlign: 'center',
                    fontWeight: 700,
                    textShadow: e.rank <= 3 ? `0 0 4px ${rankColor}80` : 'none',
                  }}
                >
                  {e.rank}
                </span>
                {/* 状态 */}
                <span
                  style={{
                    ...neonText,
                    fontSize: '7px',
                    width: '32px',
                    textAlign: 'center',
                    color: e.isOnline ? neonGreen : '#5A5A7A',
                    textShadow: e.isOnline ? `0 0 4px ${neonGreen}80` : 'none',
                    flexShrink: 0,
                  }}
                >
                  {e.isOnline ? '在线' : '离线'}
                </span>
                {/* ID */}
                <span
                  style={{
                    ...neonText,
                    fontSize: '7px',
                    color: '#8B80A0',
                    width: '40px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {e.playerId.slice(0, 8)}
                </span>
                {/* 昵称 */}
                <span
                  style={{
                    ...neonText,
                    fontSize: '9px',
                    color: isMe ? neonCyan : '#E0E0F0',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {e.displayName}
                </span>
                {/* 战斗力 */}
                <span style={{ ...neonText, fontSize: '8px', color: neonCyan, width: '42px', textAlign: 'right' }}>
                  {e.power}
                </span>
                {/* 积分 */}
                <span style={{ ...neonText, fontSize: '8px', color: neonPurple, width: '42px', textAlign: 'right' }}>
                  {e.score}
                </span>
                {/* 等级 */}
                <span style={{ ...neonText, fontSize: '8px', color: neonYellow, width: '28px', textAlign: 'right' }}>
                  {e.level}
                </span>
              </div>
            );
          })}
        </div>

        {/* 底部说明 */}
        <div
          className="relative"
          style={{
            padding: '4px 10px',
            borderTop: `1px solid ${neonCyan}20`,
            zIndex: 1,
            ...neonText,
            fontSize: '6px',
            color: '#5A5A7A',
            textAlign: 'center',
            letterSpacing: '0.5px',
          }}
        >
          按战斗力·积分·等级从高到低排序
        </div>
      </div>
    </div>
  );
}
