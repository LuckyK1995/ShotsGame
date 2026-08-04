// 像素风圆形立体按钮 - 参考复古RPG游戏界面风格
// 圆形图标 + 下方文字标签，带立体高光阴影

import React, { memo } from 'react';

const neonTextStyle: React.CSSProperties = {
  fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
  fontWeight: 700,
  letterSpacing: '0.5px',
};

// 全息无框风格 - 与右上角功能按钮统一
const btnBaseStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0px',
  padding: '2px 0',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0,
};

const circleBaseStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.15s ease',
  background: 'transparent',
  border: 'none',
};

const iconWrapStyle: React.CSSProperties = {
  width: '26px',
  height: '26px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'btn-icon-breathe 2.2s ease-in-out infinite',
};

// 底部按钮PNG图标放大显示
const pngIconStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  objectFit: 'contain',
  objectPosition: 'center',
};

// active / inactive 图标发光样式
const circleActiveStyle: React.CSSProperties = {
  ...circleBaseStyle,
};

const circleInactiveStyle: React.CSSProperties = {
  ...circleBaseStyle,
};

const iconActiveStyle: React.CSSProperties = {
  ...iconWrapStyle,
  filter: 'drop-shadow(0 0 5px #00F5D4) drop-shadow(0 0 10px #00F5D460) brightness(1.25)',
};

const iconInactiveStyle: React.CSSProperties = {
  ...iconWrapStyle,
  filter: 'drop-shadow(0 0 3px #B026FF80) drop-shadow(0 0 6px #B026FF40) brightness(0.95)',
};

const labelActiveStyle: React.CSSProperties = {
  ...neonTextStyle,
  fontSize: '7px',
  color: '#00F5D4',
  textShadow: '0 0 4px #00F5D4A0, 1px 1px 0 rgba(0,0,0,0.8)',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  marginTop: '1px',
};

const labelInactiveStyle: React.CSSProperties = {
  ...neonTextStyle,
  fontSize: '7px',
  color: '#C0C0D0',
  textShadow: '0 0 3px #8B80A060, 1px 1px 0 rgba(0,0,0,0.8)',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  marginTop: '1px',
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
      style={btnBaseStyle}
      onMouseEnter={(e) => {
        const circle = e.currentTarget.querySelector('[data-circle]') as HTMLElement | null;
        if (circle && !active) {
          circle.style.transform = 'scale(1.12)';
          circle.style.filter = 'drop-shadow(0 0 6px #00F5D4) drop-shadow(0 0 12px #00F5D480) brightness(1.15)';
        }
      }}
      onMouseLeave={(e) => {
        const circle = e.currentTarget.querySelector('[data-circle]') as HTMLElement | null;
        if (circle) {
          circle.style.transform = 'scale(1)';
          circle.style.filter = '';
        }
      }}
    >
      {/* 圆形立体图标 */}
      <div
        data-circle
        style={active ? circleActiveStyle : circleInactiveStyle}
      >
        {/* 图标 */}
        <div style={active ? iconActiveStyle : iconInactiveStyle}>
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
      <span style={active ? labelActiveStyle : labelInactiveStyle}>
        {label}
      </span>
    </button>
  );
}

// 性能优化：memo 包装，配合 App.tsx 中稳定 props 仅 active 变化时重渲染
export const PixelButton = memo(PixelButtonImpl);

// ===== 8个底部按钮图标 - PNG贴图版（末世科技风，亮色系，背景透明） =====

// 人物
export const PixelCharIcon = () => (
  <img src="/images/btn-character.png" alt="人物" style={pngIconStyle} />
);

// 技能
export const PixelSkillIcon = () => (
  <img src="/images/btn-skill.png" alt="技能" style={pngIconStyle} />
);

// 成就
export const PixelAchieveIcon = () => (
  <img src="/images/btn-achievement.png" alt="成就" style={pngIconStyle} />
);

// 社交
export const PixelSocialIcon = () => (
  <img src="/images/btn-social.png" alt="社交" style={pngIconStyle} />
);

// 邮件
export const PixelMailIcon = () => (
  <img src="/images/btn-mail.png" alt="邮件" style={pngIconStyle} />
);

// 背包
export const PixelBagIcon = () => (
  <img src="/images/btn-bag.png" alt="背包" style={pngIconStyle} />
);

// 重开
export const PixelRestartIcon = () => (
  <img src="/images/btn-restart.png" alt="重开" style={pngIconStyle} />
);

// 主界面
export const PixelHomeIcon = () => (
  <img src="/images/btn-home.png" alt="主界面" style={pngIconStyle} />
);

export const PixelCheckInIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 日历主体 */}
    <rect x="2" y="4" width="18" height="16" rx="1.5" fill="#B026FF" stroke="#5A0E80" strokeWidth="0.5" />
    {/* 日历顶部横条 */}
    <rect x="2" y="4" width="18" height="5" rx="1.5" fill="#FF0080" stroke="#8B0050" strokeWidth="0.3" />
    {/* 挂钩 */}
    <rect x="6" y="2" width="2" height="4" rx="0.5" fill="#FFE600" stroke="#B8860B" strokeWidth="0.2" />
    <rect x="14" y="2" width="2" height="4" rx="0.5" fill="#FFE600" stroke="#B8860B" strokeWidth="0.2" />
    {/* 日期格子 */}
    <rect x="4" y="11" width="3" height="2.5" rx="0.3" fill="#00F5D4" opacity="0.7" />
    <rect x="9.5" y="11" width="3" height="2.5" rx="0.3" fill="#00F5D4" opacity="0.7" />
    <rect x="15" y="11" width="3" height="2.5" rx="0.3" fill="#FFE600" opacity="0.7" />
    <rect x="4" y="15.5" width="3" height="2.5" rx="0.3" fill="#00F5D4" opacity="0.5" />
    <rect x="9.5" y="15.5" width="3" height="2.5" rx="0.3" fill="#00F5D4" opacity="0.5" />
    <rect x="15" y="15.5" width="3" height="2.5" rx="0.3" fill="#00F5D4" opacity="0.5" />
    {/* 勾选标记 */}
    <path d="M5 12.5 L6 14 L8 11" stroke="#00FF9D" strokeWidth="1" strokeLinecap="round" fill="none" />
  </svg>
);

export const PixelOnlineIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 时钟外圈 */}
    <circle cx="11" cy="11" r="9" fill="#B026FF" stroke="#5A0E80" strokeWidth="0.5" />
    <circle cx="11" cy="11" r="7.5" fill="#1A1535" stroke="#FF0080" strokeWidth="0.3" />
    {/* 时针 */}
    <line x1="11" y1="11" x2="11" y2="5.5" stroke="#00F5D4" strokeWidth="1.2" strokeLinecap="round" />
    {/* 分针 */}
    <line x1="11" y1="11" x2="15.5" y2="9" stroke="#FFE600" strokeWidth="0.8" strokeLinecap="round" />
    {/* 中心点 */}
    <circle cx="11" cy="11" r="1" fill="#FF0080" />
    {/* 刻度 */}
    <line x1="11" y1="3.5" x2="11" y2="4.5" stroke="#00F5D4" strokeWidth="0.5" />
    <line x1="11" y1="17.5" x2="11" y2="18.5" stroke="#00F5D4" strokeWidth="0.5" />
    <line x1="3.5" y1="11" x2="4.5" y2="11" stroke="#00F5D4" strokeWidth="0.5" />
    <line x1="17.5" y1="11" x2="18.5" y2="11" stroke="#00F5D4" strokeWidth="0.5" />
    {/* 礼物标记 */}
    <rect x="15" y="1" width="5" height="5" rx="1" fill="#FFE600" stroke="#B8860B" strokeWidth="0.3" />
    <line x1="17.5" y1="1" x2="17.5" y2="6" stroke="#FF0080" strokeWidth="0.5" />
    <path d="M16 1 Q16 0 17 0.5 Q18 0 18 1" fill="#FF0080" />
  </svg>
);
