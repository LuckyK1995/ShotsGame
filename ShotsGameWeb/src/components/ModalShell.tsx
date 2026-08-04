import type { CSSProperties, ReactNode } from 'react';
import { neonCyan } from '../theme/colors';
import { ModalHudBackground } from './ModalHudBackground';

interface ModalShellProps {
  children: ReactNode;
  /** HUD 主色（默认青色） */
  accentColor?: string;
  /** HUD 辅色（默认紫色） */
  accentColor2?: string;
  /** HUD 背景不透明度 */
  hudOpacity?: number;
  /** 弹窗宽度（px 或字符串，默认 260） */
  width?: number | string;
  /** 圆角（默认 14） */
  borderRadius?: number;
  /** 自定义容器 className */
  className?: string;
  /** 自定义容器内联样式（会与默认样式合并） */
  style?: CSSProperties;
  /** 点击事件（默认 stopPropagation，便于弹窗外点击关闭） */
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * 弹窗标准外壳：自动引入 HUD 背景。
 *
 * 新建弹窗必须使用本组件包裹内容，无需再手动添加 ModalHudBackground。
 * 自动包含：relative 容器、overflow hidden、HUD 背景、zIndex 内容层。
 *
 * 用法：
 *   <ModalShell accentColor={neonCyan} accentColor2={neonPurple} width={280}>
 *     <h2>标题</h2>
 *     <p>内容</p>
 *   </ModalShell>
 *
 * 若需自定义外层定位（如 fixed 居中），在外部再包一层定位 div。
 */
export function ModalShell({
  children,
  accentColor = neonCyan,
  accentColor2,
  hudOpacity,
  width = 260,
  borderRadius = 14,
  className = '',
  style,
  onClick,
}: ModalShellProps) {
  const mergedStyle: CSSProperties = {
    width,
    background: 'rgba(19, 16, 37, 0.95)',
    border: `1px solid ${accentColor}40`,
    borderRadius,
    boxShadow: `0 0 30px ${accentColor}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
    backdropFilter: 'blur(12px)',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div
      className={`relative ${className}`}
      style={mergedStyle}
      onClick={onClick ?? ((e) => e.stopPropagation())}
    >
      <ModalHudBackground
        accentColor={accentColor}
        accentColor2={accentColor2}
        opacity={hudOpacity}
      />
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
