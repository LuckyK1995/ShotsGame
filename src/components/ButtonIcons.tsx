// 末世科技风 SVG 图标组件 - 霓虹发光风格
// 用于底部操作按钮(34×34)和主界面模式按钮

interface IconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

const defaultColor = '#00F5D4';

function SvgWrap({ size = 26, color = defaultColor, active = false, children }: IconProps & { children: React.ReactNode }) {
  const filterId = `glow-${color.replace('#', '')}-${active ? 'a' : 'n'}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}
    >
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${filterId})`} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {children}
      </g>
    </svg>
  );
}

// ===== 底部操作按钮图标 =====

// 人物 - 未来战士头盔剪影
export function CharacterIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      {/* 头盔外轮廓 */}
      <path d="M12 3 L7 5 L7 11 C7 15 9 18 12 20 C15 18 17 15 17 11 L17 5 Z" />
      {/* 面罩横纹 */}
      <path d="M8.5 10 L15.5 10" />
      {/* 中央光带 */}
      <path d="M12 5 L12 9" strokeWidth="2" />
      {/* 颈部 */}
      <path d="M9.5 18 L9.5 21 L14.5 21 L14.5 18" />
    </SvgWrap>
  );
}

// 技能 - 能量星爆
export function SkillIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <path d="M12 2 L13.5 9 L20 7 L15 12 L20 17 L13.5 15 L12 22 L10.5 15 L4 17 L9 12 L4 7 L10.5 9 Z" />
      <circle cx="12" cy="12" r="1.8" fill={color} stroke="none" />
    </SvgWrap>
  );
}

// 成就 - 勋章
export function AchievementIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      {/* 勋章主体 */}
      <circle cx="12" cy="14" r="5" />
      {/* 内圈星 */}
      <path d="M12 11 L12.8 13 L14.8 13 L13.2 14.2 L13.8 16.2 L12 15 L10.2 16.2 L10.8 14.2 L9.2 13 L11.2 13 Z" fill={color} stroke="none" />
      {/* 绶带 */}
      <path d="M9 9 L7 3 L10 5 L12 4 L14 5 L17 3 L15 9" />
    </SvgWrap>
  );
}

// 社交 - 双人
export function SocialIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M3 20 C3 16 5 13 8 13 C11 13 13 16 13 20" />
      <path d="M14 20 C14 17 15 14.5 16 14.5 C18 14.5 21 17 21 20" />
    </SvgWrap>
  );
}

// 邮件 - 信封
export function MailIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <rect x="3" y="6" width="18" height="13" rx="1.5" />
      <path d="M3 7 L12 14 L21 7" />
    </SvgWrap>
  );
}

// 背包 - 双肩背包
export function BagIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      {/* 背包主体 */}
      <rect x="6" y="5" width="12" height="16" rx="2.5" />
      {/* 顶部提手 */}
      <path d="M9 5 C9 3 10 2.5 12 2.5 C14 2.5 15 3 15 5" />
      {/* 前袋 */}
      <rect x="8" y="11" width="8" height="5" rx="1" />
      {/* 拉链 */}
      <path d="M8 13.5 L16 13.5" strokeWidth="1" />
    </SvgWrap>
  );
}

// 重开 - 循环箭头
export function RestartIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <path d="M20 12 A8 8 0 1 1 12 4" />
      <path d="M12 4 L12 7 L15 5.5" />
      <path d="M20 12 L20 9 L17 10.5" />
    </SvgWrap>
  );
}

// 主界面 - 房屋/基地
export function HomeIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <path d="M4 11 L12 4 L20 11" />
      <path d="M6 10 L6 20 L18 20 L18 10" />
      <path d="M10 20 L10 15 L14 15 L14 20" />
    </SvgWrap>
  );
}

// ===== 主界面游戏模式按钮图标 =====

// 关卡挑战 - 旗帜+山峰
export function StageIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <path d="M4 20 L9 9 L13 14 L17 7 L20 20 Z" />
      <path d="M9 9 L11 6 L13 9" />
      <path d="M4 20 L20 20" />
    </SvgWrap>
  );
}

// 世界BOSS - 骷髅
export function WorldBossIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <path d="M12 3 C7 3 4 6 4 11 C4 14 6 16 7 17 L7 20 L9 19 L9 20 L15 20 L15 19 L17 20 L17 17 C18 16 20 14 20 11 C20 6 17 3 12 3 Z" />
      <circle cx="9" cy="11" r="1.5" fill={color} stroke="none" />
      <circle cx="15" cy="11" r="1.5" fill={color} stroke="none" />
      <path d="M10 15 L12 14 L14 15" />
    </SvgWrap>
  );
}

// 炼狱 - 火焰
export function PurgatoryIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <path d="M12 3 C10 6 8 8 8 13 C8 17 10 21 12 21 C14 21 16 17 16 13 C16 8 14 6 12 3 Z" />
      <path d="M12 8 C11 10 10 11 10 14 C10 16 11 18 12 18 C13 18 14 16 14 14 C14 11 13 10 12 8 Z" fill={color} stroke="none" opacity="0.6" />
    </SvgWrap>
  );
}

// 日常挑战 - 日历+对勾
export function DailyIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <rect x="4" y="6" width="16" height="15" rx="1.5" />
      <path d="M4 10 L20 10" />
      <path d="M8 3 L8 7" />
      <path d="M16 3 L16 7" />
      <path d="M8 15 L11 18 L16 13" strokeWidth="2" />
    </SvgWrap>
  );
}

// 材料副本 - 水晶/矿石
export function MaterialIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <path d="M12 3 L6 10 L12 21 L18 10 Z" />
      <path d="M6 10 L18 10" />
      <path d="M12 3 L12 21" />
      <path d="M9 6.5 L15 6.5" strokeWidth="1" />
    </SvgWrap>
  );
}

// 镜像挑战 - 镜面反射
export function MirrorIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M12 3 L12 21" strokeDasharray="2 1.5" />
      {/* 左侧人物 */}
      <circle cx="9" cy="9" r="1.5" />
      <path d="M7.5 14 C7.5 12 8 11 9 11 C10 11 10.5 12 10.5 14" />
      {/* 右侧镜像(虚化) */}
      <circle cx="15" cy="9" r="1.5" opacity="0.5" />
      <path d="M13.5 14 C13.5 12 14 11 15 11 C16 11 16.5 12 16.5 14" opacity="0.5" />
    </SvgWrap>
  );
}

// 守卫战 - 盾牌
export function GuardIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      <path d="M12 3 L5 5 L5 12 C5 16 8 19 12 21 C16 19 19 16 19 12 L19 5 Z" />
      <path d="M12 7 L12 15" />
      <path d="M9 11 L15 11" />
    </SvgWrap>
  );
}

// 家园守卫 - 房屋+盾牌
export function HomeDefenseIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      {/* 房屋外轮廓 */}
      <path d="M3 11 L12 4 L21 11 L21 12 L12 5 L3 12 Z" fill={color} stroke="none" opacity="0.4" />
      <path d="M5 11 L12 5 L19 11 L19 20 L5 20 Z" />
      {/* 中央盾牌 */}
      <path d="M12 9 L8 10.5 L8 14 C8 16 10 17.5 12 18.5 C14 17.5 16 16 16 14 L16 10.5 Z" fill="rgba(10,8,20,0.6)" strokeWidth="1.4" />
      <path d="M10.5 13.5 L11.5 14.5 L13.5 12" strokeWidth="1.4" />
    </SvgWrap>
  );
}
