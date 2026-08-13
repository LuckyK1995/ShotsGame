import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi, type ChatMessage } from '../api/modules/chat';
import { useAuthStore } from '../store/authStore';
import {
  neonCyan, neonPurple, neonPink, neonText,
} from '../theme/colors';
import { ModalHudBackground } from './ModalHudBackground';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 聊天弹窗：显示世界频道消息记录
export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const profile = useAuthStore(s => s.profile);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<number | null>(null);

  // 加载消息
  const loadMessages = useCallback(async () => {
    try {
      setError(null);
      const list = await chatApi.getMessages('world', 50);
      setMessages(list);
    } catch (e: any) {
      setError(e?.message ?? '加载失败');
    }
  }, []);

  // 初始加载 + 轮询
  useEffect(() => {
    if (!isOpen) return;
    loadMessages();
    // 每 5 秒轮询新消息
    pollTimerRef.current = window.setInterval(loadMessages, 5000);
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isOpen, loadMessages]);

  // 滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    if (text.length > 200) {
      setError('消息不能超过200字');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const msg = await chatApi.send({ channel: 'world', content: text });
      setMessages(prev => [...prev, msg]);
      setInputText('');
    } catch (e: any) {
      setError(e?.message ?? '发送失败');
    } finally {
      setSending(false);
    }
  };

  // 回车发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
          height: '440px',
          background: 'rgba(19, 16, 37, 0.96)',
          border: `1px solid ${neonCyan}50`,
          borderRadius: '14px',
          boxShadow: `0 0 30px ${neonCyan}30, inset 0 1px 0 rgba(255,255,255,0.05)`,
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
          style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${neonCyan}30`,
            zIndex: 1,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: neonCyan,
                boxShadow: `0 0 6px ${neonCyan}`,
                animation: 'glow-pulse 1.5s ease-in-out infinite',
              }}
            />
            <span style={{ ...neonText, fontSize: '12px', color: neonCyan, textShadow: `0 0 6px ${neonCyan}80` }}>
              世界频道
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8B80A0',
              fontSize: '16px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = neonPink; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8B80A0'; }}
          >
            ×
          </button>
        </div>

        {/* 消息列表 */}
        <div
          ref={listRef}
          className="relative flex-1 overflow-y-auto"
          style={{
            padding: '8px 12px',
            zIndex: 1,
            scrollbarWidth: 'thin',
          }}
        >
          {loading && messages.length === 0 && (
            <div style={{ ...neonText, fontSize: '9px', color: '#5A5A7A', textAlign: 'center', padding: '20px 0' }}>
              加载中...
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div style={{ ...neonText, fontSize: '9px', color: '#5A5A7A', textAlign: 'center', padding: '20px 0' }}>
              暂无消息，发送第一条吧
            </div>
          )}
          {messages.map((msg) => {
            const isMine = msg.playerId === profile?.id;
            const time = new Date(msg.sentAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={msg.id}
                style={{
                  marginBottom: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMine ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <span style={{ ...neonText, fontSize: '7px', color: isMine ? neonPink : neonCyan, letterSpacing: '0.3px' }}>
                    {msg.displayName || '匿名'}
                  </span>
                  <span style={{ fontSize: '6px', color: '#5A5A7A' }}>{time}</span>
                </div>
                <div
                  style={{
                    ...neonText,
                    fontSize: '9px',
                    lineHeight: 1.4,
                    padding: '5px 9px',
                    background: isMine ? `rgba(255, 0, 128, 0.12)` : `rgba(0, 245, 212, 0.10)`,
                    border: `0.5px solid ${isMine ? neonPink + '40' : neonCyan + '40'}`,
                    borderRadius: '8px',
                    color: '#E0E0F0',
                    maxWidth: '80%',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          {error && (
            <div style={{ ...neonText, fontSize: '8px', color: neonPink, textAlign: 'center', padding: '6px 0' }}>
              {error}
            </div>
          )}
        </div>

        {/* 输入区 */}
        <div
          className="relative flex items-center gap-2"
          style={{
            padding: '8px 10px',
            borderTop: `1px solid ${neonCyan}30`,
            zIndex: 1,
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={200}
            placeholder="输入消息..."
            style={{
              flex: 1,
              ...neonText,
              fontSize: '10px',
              color: '#E0E0F0',
              background: 'rgba(13, 11, 26, 0.8)',
              border: `0.5px solid ${neonCyan}40`,
              borderRadius: '6px',
              padding: '6px 10px',
              outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = neonCyan + '80'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = neonCyan + '40'; }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !inputText.trim()}
            style={{
              ...neonText,
              fontSize: '10px',
              color: sending || !inputText.trim() ? '#5A5A7A' : neonCyan,
              background: sending || !inputText.trim() ? 'rgba(100, 100, 130, 0.15)' : `rgba(0, 245, 212, 0.20)`,
              border: `0.5px solid ${neonCyan}50`,
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: sending || !inputText.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
