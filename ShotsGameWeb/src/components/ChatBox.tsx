import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { chatApi } from '../api/modules/chat';
import {
  neonCyan, neonPurple, neonText,
} from '../theme/colors';

interface ChatBoxProps {
  onOpenModal: () => void;
  /** 放置在底部按钮面板内时启用：去掉 absolute 定位，改为 inline 布局 */
  inlineInPanel?: boolean;
}

// 聊天组合框：频道图标 + 输入框 + 发送按钮
export function ChatBox({ onOpenModal, inlineInPanel = false }: ChatBoxProps) {
  const profile = useAuthStore(s => s.profile);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // 直接从输入框发送（不打开弹窗）
  const handleQuickSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !profile) return;
    if (text.length > 200) {
      setHint('消息不能超过200字');
      setTimeout(() => setHint(null), 2000);
      return;
    }
    setSending(true);
    try {
      await chatApi.send({ channel: 'world', content: text });
      setInputText('');
    } catch (e: any) {
      setHint(e?.message ?? '发送失败');
      setTimeout(() => setHint(null), 2000);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickSend();
    }
  };

  return (
    <div
      style={
        inlineInPanel
          ? {
              width: '150px',
              zIndex: 20,
              position: 'relative',
            }
          : {
              position: 'absolute',
              left: '12px',
              bottom: '90px',
              width: '210px',
              zIndex: 20,
            }
      }
    >
      {/* 提示气泡 */}
      {hint && (
        <div
          style={{
            ...neonText,
            fontSize: '7px',
            color: neonCyan,
            textShadow: `0 0 4px ${neonCyan}80`,
            marginBottom: '2px',
            padding: '0 4px',
            opacity: 0.9,
          }}
        >
          {hint}
        </div>
      )}
      {/* 组合框 */}
      <div
        className="flex items-center gap-1"
        style={{
          background: 'rgba(19, 16, 37, 0.85)',
          border: `0.5px solid ${neonCyan}40`,
          borderRadius: inlineInPanel ? '6px' : '8px',
          padding: inlineInPanel ? '2px 3px' : '3px 4px',
          backdropFilter: 'blur(8px)',
          boxShadow: `0 0 10px ${neonPurple}20`,
        }}
      >
        {/* 左侧：频道图标（点击打开聊天弹窗） */}
        <button
          onClick={onOpenModal}
          title="打开聊天记录"
          style={{
            width: inlineInPanel ? '20px' : '24px',
            height: inlineInPanel ? '20px' : '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `rgba(0, 245, 212, 0.15)`,
            border: `0.5px solid ${neonCyan}50`,
            borderRadius: '5px',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 245, 212, 0.28)';
            e.currentTarget.style.boxShadow = `0 0 6px ${neonCyan}60`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 245, 212, 0.15)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg width={inlineInPanel ? '12' : '14'} height={inlineInPanel ? '12' : '14'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 频道气泡 */}
            <path
              d="M4 5 C4 4 5 3 6 3 L18 3 C19 3 20 4 20 5 L20 14 C20 15 19 16 18 16 L9 16 L5 19 L5 16 C4.5 16 4 15 4 14 Z"
              fill="none"
              stroke={neonCyan}
              strokeWidth="1.6"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 2px #00F5D4)"
            />
            <circle cx="9" cy="9.5" r="0.9" fill={neonCyan} />
            <circle cx="12" cy="9.5" r="0.9" fill={neonCyan} />
            <circle cx="15" cy="9.5" r="0.9" fill={neonCyan} />
          </svg>
        </button>

        {/* 中间：输入框 */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={200}
          placeholder="世界频道..."
          style={{
            flex: 1,
            minWidth: 0,
            ...neonText,
            fontSize: inlineInPanel ? '8px' : '9px',
            color: '#E0E0F0',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '0 3px',
          }}
        />

        {/* 右侧：发送按钮 */}
        <button
          onClick={handleQuickSend}
          disabled={sending || !inputText.trim()}
          title="发送"
          style={{
            width: inlineInPanel ? '20px' : '24px',
            height: inlineInPanel ? '20px' : '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: sending || !inputText.trim() ? 'rgba(100, 100, 130, 0.15)' : `rgba(176, 38, 255, 0.20)`,
            border: `0.5px solid ${neonPurple}50`,
            borderRadius: '5px',
            cursor: sending || !inputText.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            opacity: sending || !inputText.trim() ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!sending && inputText.trim()) {
              e.currentTarget.style.background = 'rgba(176, 38, 255, 0.35)';
              e.currentTarget.style.boxShadow = `0 0 6px ${neonPurple}60`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = sending || !inputText.trim() ? 'rgba(100, 100, 130, 0.15)' : `rgba(176, 38, 255, 0.20)`;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg width={inlineInPanel ? '10' : '12'} height={inlineInPanel ? '10' : '12'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 12 L21 4 L17 12 L21 20 Z"
              fill="none"
              stroke={neonPurple}
              strokeWidth="1.6"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 2px #B026FF)"
            />
            <path d="M17 12 L9 12" stroke={neonPurple} strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
