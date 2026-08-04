import { neonCyan, neonPurple, neonPink, neonYellow, neonBlue } from '../theme/colors';

interface ModalHudBackgroundProps {
  /** 主色调，默认 pink（与按钮区 purple/cyan 区分） */
  accentColor?: string;
  /** 辅助色 */
  accentColor2?: string;
  /** 透明度（整体叠加层不透明度，越大越明显） */
  opacity?: number;
}

/**
 * 弹窗共享 HUD 背景：纹路与按钮区不同
 * 按钮区：电路板细纹 + 六边形蜂窝 + 紫/青配色
 * 弹窗区：斜向数据流迹线 + 菱形网格 + 角标 + 扫描带 + 方块节点
 *
 * 设计要点：
 * - 使用 viewBox="0 0 100 100" 给 SVG 内在尺寸，避免 height:100% 在 flex 容器中解析失效
 * - preserveAspectRatio="xMidYMid slice"：等比缩放 + 裁剪超出，不拉伸变形
 * - pattern 用 userSpaceOnUse 按实际像素平铺（不受 viewBox 影响）
 * - 装饰元素用百分比定位 + viewBox 单位尺寸（100vbu ≈ 280px 宽弹窗的实际像素）
 *
 * 用法：放在弹窗主容器（position: relative）内作为第一个子元素，
 * 容器需 overflow: hidden + borderRadius 才能正确裁剪。
 * 推荐新弹窗直接使用 <ModalShell> 包裹，自动引入本背景。
 */
export function ModalHudBackground({
  accentColor = neonPink,
  accentColor2 = neonYellow,
  opacity = 0.32,
}: ModalHudBackgroundProps) {
  // 唯一 id，避免多实例冲突
  const uid = `${accentColor.slice(1)}_${accentColor2.slice(1)}`;
  const patternId = `modal-hud-grad-${uid}`;
  const flowId = `modal-flow-${uid}`;
  const diamondId = `modal-diamond-${uid}`;
  const scanId = `modal-scan-${uid}`;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ opacity, borderRadius: 'inherit', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* 斜向数据流迹线图案 —— userSpaceOnUse 按实际像素平铺，不受 viewBox 影响 */}
        <pattern
          id={flowId}
          x="0"
          y="0"
          width="34"
          height="34"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(30)"
        >
          {/* 主迹线：横向短线，模拟数据流向 */}
          <line x1="2" y1="17" x2="14" y2="17" stroke={accentColor} strokeWidth="0.45" opacity="0.7" />
          <line x1="18" y1="17" x2="32" y2="17" stroke={accentColor} strokeWidth="0.45" opacity="0.7" />
          {/* 节点方块（替代圆形） */}
          <rect x="15" y="15" width="4" height="4" fill={accentColor} opacity="0.8" />
          {/* 辅助垂直短迹线 */}
          <line x1="8" y1="4" x2="8" y2="11" stroke={accentColor} strokeWidth="0.32" opacity="0.45" />
          <line x1="26" y1="23" x2="26" y2="30" stroke={accentColor} strokeWidth="0.32" opacity="0.45" />
          {/* 末端小三角箭头（数据方向指示） */}
          <path d="M 30,15.5 L 32.5,17 L 30,18.5 Z" fill={accentColor} opacity="0.7" />
          <path d="M 13,15.5 L 15.5,17 L 13,18.5 Z" fill={accentColor} opacity="0.55" />
        </pattern>

        {/* 菱形网格图案 —— userSpaceOnUse 按实际像素平铺 */}
        <pattern
          id={diamondId}
          x="0"
          y="0"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect x="0" y="0" width="26" height="26" fill="none" stroke={accentColor2} strokeWidth="0.3" opacity="0.5" />
          <line x1="0" y1="0" x2="26" y2="26" stroke={accentColor2} strokeWidth="0.24" opacity="0.4" />
          <line x1="26" y1="0" x2="0" y2="26" stroke={accentColor2} strokeWidth="0.24" opacity="0.4" />
        </pattern>

        {/* 径向渐变底层 */}
        <radialGradient id={patternId} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.22" />
          <stop offset="50%" stopColor={accentColor2} stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* 顶部高光扫描带渐变 */}
        <linearGradient id={scanId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 层1：径向渐变底层 */}
      <rect x="0" y="0" width="100" height="100" fill={`url(#${patternId})`} />

      {/* 层2：数据流迹线 —— pattern 平铺 */}
      <rect x="0" y="0" width="100" height="100" fill={`url(#${flowId})`} />

      {/* 层3：菱形网格 —— pattern 平铺 */}
      <rect x="0" y="0" width="100" height="100" fill={`url(#${diamondId})`} />

      {/* 层4：顶部高光扫描带 */}
      <rect x="0" y="0" width="100" height="10" fill={`url(#${scanId})`} />

      {/* 层5：四角 L 形角标 —— 用 viewBox 单位（100vbu ≈ 280px） */}
      {/* 左上角 */}
      <rect x="2" y="2" width="4.3" height="0.5" fill={accentColor} opacity="0.75" />
      <rect x="2" y="2" width="0.5" height="4.3" fill={accentColor} opacity="0.75" />
      {/* 右上角 */}
      <rect x="93.7" y="2" width="4.3" height="0.5" fill={accentColor} opacity="0.75" />
      <rect x="97.5" y="2" width="0.5" height="4.3" fill={accentColor} opacity="0.75" />
      {/* 左下角 */}
      <rect x="2" y="97.5" width="4.3" height="0.5" fill={accentColor2} opacity="0.7" />
      <rect x="2" y="93.7" width="0.5" height="4.3" fill={accentColor2} opacity="0.7" />
      {/* 右下角 */}
      <rect x="93.7" y="97.5" width="4.3" height="0.5" fill={accentColor2} opacity="0.7" />
      <rect x="97.5" y="93.7" width="0.5" height="4.3" fill={accentColor2} opacity="0.7" />

      {/* 层6：散落方块节点 —— 百分比定位 + viewBox 单位尺寸 */}
      {[
        { x: 14, y: 24, s: 1.1, c: accentColor },
        { x: 84, y: 29, s: 0.9, c: accentColor2 },
        { x: 19, y: 74, s: 0.9, c: accentColor2 },
        { x: 79, y: 69, s: 1.1, c: accentColor },
        { x: 49, y: 14, s: 0.7, c: accentColor },
        { x: 49, y: 84, s: 0.7, c: accentColor2 },
        { x: 34, y: 49, s: 0.6, c: accentColor2 },
        { x: 64, y: 49, s: 0.6, c: accentColor },
      ].map((node, i) => (
        <rect
          key={i}
          x={node.x}
          y={node.y}
          width={node.s}
          height={node.s}
          fill={node.c}
          opacity="0.7"
          style={{ animation: `glow-pulse ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}

      {/* 层7：顶部/底部装饰线 */}
      <rect x="12" y="1" width="76" height="0.2" fill={accentColor} opacity="0.55" />
      <rect x="12" y="98.6" width="76" height="0.2" fill={accentColor2} opacity="0.45" />

      {/* 层8：左右竖向装饰线 */}
      <rect x="1" y="15" width="0.2" height="70" fill={accentColor} opacity="0.38" />
      <rect x="98.7" y="15" width="0.2" height="70" fill={accentColor2} opacity="0.32" />

      {/* 层9：中心十字准星 */}
      <rect x="48" y="49.5" width="2.1" height="0.2" fill={accentColor} opacity="0.45" />
      <rect x="49.5" y="48" width="0.2" height="2.1" fill={accentColor2} opacity="0.45" />
    </svg>
  );
}
