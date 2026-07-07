// 像素风圆形立体按钮 - 参考复古RPG游戏界面风格
// 圆形图标 + 下方文字标签，带立体高光阴影

import React, { memo } from 'react';

const neonTextStyle: React.CSSProperties = {
  fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
  fontWeight: 700,
  letterSpacing: '0.5px',
};

interface PixelButtonProps {
  iconElement: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}

function PixelButtonImpl({ iconElement, label, active = false, onClick, badge }: PixelButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
        padding: '2px 0',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const circle = e.currentTarget.querySelector('[data-circle]') as HTMLElement | null;
        if (circle && !active) {
          circle.style.transform = 'scale(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        const circle = e.currentTarget.querySelector('[data-circle]') as HTMLElement | null;
        if (circle) {
          circle.style.transform = 'scale(1)';
        }
      }}
    >
      {/* 圆形立体图标 */}
      <div
        data-circle
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease',
          background: active
            ? 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.4) 0%, rgba(0, 245, 212, 0.5) 35%, rgba(0, 200, 180, 0.4) 70%, rgba(0, 150, 130, 0.3) 100%)'
            : 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25) 0%, rgba(60, 50, 90, 0.6) 40%, rgba(30, 25, 55, 0.8) 75%, rgba(15, 12, 30, 0.9) 100%)',
          boxShadow: active
            ? `
              inset 2px 2px 4px rgba(255,255,255,0.3),
              inset -2px -2px 4px rgba(0,0,0,0.4),
              0 0 10px rgba(0, 245, 212, 0.6),
              0 0 18px rgba(0, 245, 212, 0.3)
            `
            : `
              inset 2px 2px 4px rgba(255,255,255,0.15),
              inset -2px -2px 4px rgba(0,0,0,0.5),
              0 2px 4px rgba(0,0,0,0.4),
              0 0 6px rgba(176, 38, 255, 0.2)
            `,
          border: active
            ? '1.5px solid rgba(0, 245, 212, 0.8)'
            : '1.5px solid rgba(100, 80, 140, 0.7)',
        }}
      >
        {/* 图标 */}
        <div style={{
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: active ? 'brightness(1.2)' : 'brightness(0.9)',
        }}>
          {iconElement}
        </div>

        {/* 角标 */}
        {badge !== undefined && badge > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              minWidth: '14px',
              height: '14px',
              padding: '0 3px',
              borderRadius: '7px',
              background: 'linear-gradient(180deg, #FF6B6B 0%, #FF2D55 100%)',
              color: '#FFFFFF',
              fontSize: '8px',
              fontWeight: 700,
              fontFamily: '"Rajdhani", monospace',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0,0,0,0.3)',
              boxShadow: '0 1px 3px rgba(255,45,85,0.5)',
              lineHeight: 1,
            }}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>

      {/* 文字标签 - 像素风金色带1px黑色描边 */}
      <span
        style={{
          ...neonTextStyle,
          fontSize: '8px',
          color: active ? '#00F5D4' : '#FFD700',
          textShadow: active
            ? '0 0 4px rgba(0, 245, 212, 0.9), 1px 1px 0 rgba(0,0,0,0.8)'
            : '1px 1px 0 rgba(0,0,0,0.85), 0 0 2px rgba(255, 215, 0, 0.3)',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </button>
  );
}

// 性能优化：memo 包装
export const PixelButton = memo(PixelButtonImpl);

// ===== 8个像素风底部按钮图标 =====

// 人物 - 像素风战士头像
export const PixelCharIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 头盔 - 蓝 */}
    <path d="M11 2 L6 4 L6 9 Q6 14 11 16 Q16 14 16 9 L16 4 Z" fill="#4FACFE" stroke="#1A4A8A" strokeWidth="0.8" />
    {/* 面罩 - 深 */}
    <rect x="7" y="7" width="8" height="3" rx="0.5" fill="#0A0814" />
    {/* 眼睛发光 - 青 */}
    <rect x="8" y="7.5" width="2.5" height="2" fill="#00F5D4" />
    <rect x="11.5" y="7.5" width="2.5" height="2" fill="#00F5D4" />
    {/* 金色装饰 */}
    <path d="M7.5 4 Q11 3 14.5 4" stroke="#FFE600" strokeWidth="0.8" fill="none" />
    {/* 顶饰 - 红 */}
    <rect x="10.5" y="0.5" width="1" height="2" fill="#FF2D55" />
    {/* 肩甲 */}
    <ellipse cx="4.5" cy="13" rx="2" ry="1.5" fill="#B026FF" />
    <ellipse cx="17.5" cy="13" rx="2" ry="1.5" fill="#B026FF" />
  </svg>
);

// 技能 - 像素风能量星
export const PixelSkillIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 1 L13 7 L19 6 L14.5 11 L20 13 L14.5 15 L19 20 L13 19 L11 21 L9 19 L3 20 L7.5 15 L2 13 L7.5 11 L3 6 L9 7 Z" fill="#B026FF" stroke="#5A0E80" strokeWidth="0.5" />
    <path d="M11 4 L12.5 8 L16.5 7.5 L13.5 11 L16 13 L13.5 15 L16.5 18.5 L12.5 18 L11 20 L9.5 18 L5.5 18.5 L8.5 15 L6 13 L8.5 11 L5.5 7.5 L9.5 8 Z" fill="#FF0080" />
    <circle cx="11" cy="11" r="2" fill="#FFE600" />
    <circle cx="11" cy="11" r="0.8" fill="#FFFFFF" />
  </svg>
);

// 成就 - 像素风勋章
export const PixelAchieveIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 绶带 */}
    <path d="M5 2 L3 2 L4.5 11 L7 9 Z" fill="#FF3B3B" stroke="#8B0000" strokeWidth="0.3" />
    <path d="M17 2 L19 2 L17.5 11 L15 9 Z" fill="#FF3B3B" stroke="#8B0000" strokeWidth="0.3" />
    <path d="M6 3 L4.5 3 L5.5 8 L7 7 Z" fill="#FFD700" />
    <path d="M16 3 L17.5 3 L16.5 8 L15 7 Z" fill="#FFD700" />
    {/* 勋章外圈 */}
    <circle cx="11" cy="12" r="5.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.6" />
    <circle cx="11" cy="12" r="4" fill="#FF8C00" stroke="#B85C00" strokeWidth="0.4" />
    <circle cx="11" cy="12" r="2.8" fill="#1A4A8A" />
    {/* 星 */}
    <path d="M11 9 L11.7 10.8 L13.6 10.8 L12.2 12 L12.8 13.8 L11 12.7 L9.2 13.8 L9.8 12 L8.4 10.8 L10.3 10.8 Z" fill="#FFFFFF" />
  </svg>
);

// 社交 - 像素风双人
export const PixelSocialIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 左人 */}
    <circle cx="7" cy="7" r="3" fill="#00FF9D" stroke="#006B40" strokeWidth="0.4" />
    <path d="M2 19 Q2 12 7 12 Q12 12 12 19 L12 20 L2 20 Z" fill="#00FF9D" stroke="#006B40" strokeWidth="0.4" />
    <rect x="5" y="13" width="4" height="0.8" fill="#FFE600" />
    {/* 右人 */}
    <circle cx="15" cy="7.5" r="2.5" fill="#FF8C00" stroke="#8B4500" strokeWidth="0.4" />
    <path d="M11 19 Q11 13 15 13 Q19 13 19 19 L19 20 L11 20 Z" fill="#FF8C00" stroke="#8B4500" strokeWidth="0.4" />
    <path d="M14.5 14 L15.5 14 L15.7 17 L15 18 L14.3 17 Z" fill="#FF2D55" />
    {/* 心形连接 */}
    <path d="M10 15.5 Q10 14.8 10.6 14.8 Q11 14.8 11 15.3 Q11 14.8 11.4 14.8 Q12 14.8 12 15.5 Q12 16.2 11 17 Q10 16.2 10 15.5 Z" fill="#FF0080" />
  </svg>
);

// 邮件 - 像素风信封
export const PixelMailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 信封底 */}
    <rect x="2" y="5" width="18" height="13" rx="1" fill="#00F5D4" stroke="#006B66" strokeWidth="0.6" />
    {/* 信封盖 */}
    <path d="M2 6 L11 12.5 L20 6 L20 5 Q20 4.5 19.5 4.5 L2.5 4.5 Q2 4.5 2 5 Z" fill="#4FACFE" stroke="#1A4A8A" strokeWidth="0.4" />
    <path d="M2 6 L11 12.5 L20 6" stroke="#1A4A8A" strokeWidth="0.6" fill="none" />
    {/* 火漆 */}
    <circle cx="11" cy="13" r="2" fill="#FFE600" stroke="#B8860B" strokeWidth="0.4" />
    <path d="M10 11.5 L11 12.5 L12 11.5 L12 10 L11 9.5 L10 10 Z" fill="#FF8C00" />
    {/* 送达绿点 */}
    <circle cx="18" cy="5.5" r="1.2" fill="#00FF9D" stroke="#006B40" strokeWidth="0.3" />
    <path d="M17.5 5.3 L18 5.8 L18.7 5" stroke="#FFFFFF" strokeWidth="0.4" fill="none" />
  </svg>
);

// 背包 - 像素风皮包
export const PixelBagIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 提手 */}
    <path d="M7 4 Q7 1.5 11 1.5 Q15 1.5 15 4 L15 5.5 L13 5.5 L13 4 Q13 2.5 11 2.5 Q9 2.5 9 4 L9 5.5 L7 5.5 Z" fill="#5C3A1A" stroke="#3D2611" strokeWidth="0.4" />
    {/* 包身 */}
    <rect x="4" y="5" width="14" height="15" rx="2" fill="#8B5A2B" stroke="#5C3A1A" strokeWidth="0.6" />
    {/* 高光 */}
    <rect x="5.5" y="6" width="2.5" height="13" rx="1" fill="#A0703D" opacity="0.6" />
    {/* 前袋 */}
    <rect x="7" y="9.5" width="8" height="5.5" rx="1" fill="#6B4520" stroke="#3D2611" strokeWidth="0.4" />
    {/* 金色拉链 */}
    <line x1="7.5" y1="12" x2="14.5" y2="12" stroke="#FFE600" strokeWidth="0.6" />
    <rect x="13" y="11.6" width="1.5" height="1" rx="0.2" fill="#C0C0D0" stroke="#5A5A6A" strokeWidth="0.2" />
    {/* 金扣 */}
    <rect x="9.5" y="5" width="3" height="1.2" rx="0.2" fill="#FFD700" stroke="#B8860B" strokeWidth="0.2" />
    {/* 红徽章 */}
    <circle cx="11" cy="7.8" r="1.2" fill="#FF2D55" stroke="#8B0000" strokeWidth="0.2" />
  </svg>
);

// 重开 - 像素风循环箭头
export const PixelRestartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 11 A8 8 0 1 1 11 3" stroke="#00FF9D" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M17 11 A6 6 0 1 1 11 5" stroke="#00F5D4" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.7" />
    {/* 箭头 */}
    <path d="M11 1 L11 6 L14 4 Z" fill="#4FACFE" stroke="#1A4A8A" strokeWidth="0.4" />
    <path d="M19 11 L21 8.5 L21 13.5 Z" fill="#B026FF" stroke="#5A0E80" strokeWidth="0.4" />
    <circle cx="11" cy="11" r="1.5" fill="#FF0080" />
    <circle cx="11" cy="11" r="0.6" fill="#FFFFFF" />
    {/* 装饰 */}
    <circle cx="15" cy="6" r="0.8" fill="#FFE600" />
    <circle cx="7" cy="16" r="0.6" fill="#FF8C00" />
  </svg>
);

// 主界面 - 像素风房屋
export const PixelHomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 屋顶 */}
    <path d="M2 10 L11 3 L20 10 L18 10 L11 4.5 L4 10 Z" fill="#B026FF" stroke="#5A0E80" strokeWidth="0.5" />
    <path d="M11 3 L14 5.5 L11 8 L8 5.5 Z" fill="#FF0080" opacity="0.8" />
    {/* 烟囱 */}
    <rect x="14" y="4" width="1.5" height="3" fill="#FF2D55" stroke="#8B0000" strokeWidth="0.2" />
    {/* 屋身 */}
    <rect x="4" y="9" width="14" height="11" rx="0.5" fill="#FF8C00" stroke="#8B4500" strokeWidth="0.5" />
    {/* 砖纹 */}
    <line x1="4" y1="12.5" x2="18" y2="12.5" stroke="#B85C00" strokeWidth="0.3" opacity="0.6" />
    <line x1="4" y1="15.5" x2="18" y2="15.5" stroke="#B85C00" strokeWidth="0.3" opacity="0.6" />
    <line x1="7.5" y1="9" x2="7.5" y2="12.5" stroke="#B85C00" strokeWidth="0.3" opacity="0.6" />
    <line x1="14.5" y1="9" x2="14.5" y2="12.5" stroke="#B85C00" strokeWidth="0.3" opacity="0.6" />
    {/* 门 */}
    <rect x="9.5" y="14" width="3.5" height="6" rx="0.4" fill="#8B5A2B" stroke="#3D2611" strokeWidth="0.3" />
    <circle cx="12.2" cy="17" r="0.35" fill="#FFE600" />
    {/* 左窗 */}
    <rect x="5.5" y="10" width="2.5" height="2.5" rx="0.2" fill="#FFE600" stroke="#B8860B" strokeWidth="0.2" />
    <line x1="6.75" y1="10" x2="6.75" y2="12.5" stroke="#B8860B" strokeWidth="0.2" />
    <line x1="5.5" y1="11.25" x2="8" y2="11.25" stroke="#B8860B" strokeWidth="0.2" />
    {/* 右窗 */}
    <rect x="14" y="10" width="2.5" height="2.5" rx="0.2" fill="#00F5D4" stroke="#006B66" strokeWidth="0.2" />
    <line x1="15.25" y1="10" x2="15.25" y2="12.5" stroke="#006B66" strokeWidth="0.2" />
    <line x1="14" y1="11.25" x2="16.5" y2="11.25" stroke="#006B66" strokeWidth="0.2" />
    {/* 地面 */}
    <rect x="2" y="19.5" width="18" height="1.2" fill="#00FF9D" stroke="#006B40" strokeWidth="0.2" />
  </svg>
);
