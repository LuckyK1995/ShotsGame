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

// ===== 主界面游戏模式按钮图标（多色炫酷版，每图标使用多种颜色点缀） =====

// 调色板：超过20种颜色用于点缀各图标
const C = {
  white: '#FFFFFF',
  gold: '#FFD700',
  silver: '#C0C0C0',
  cyan: '#00F5D4',
  blue: '#3498DB',
  deepBlue: '#1E90FF',
  skyBlue: '#87CEEB',
  purple: '#9B59B6',
  deepPurple: '#8A2BE2',
  magenta: '#FF00FF',
  orchid: '#DA70D6',
  red: '#FF4757',
  crimson: '#DC143C',
  tomato: '#FF6347',
  orange: '#FF8C42',
  yellow: '#FFD93D',
  amber: '#FFA500',
  green: '#2ECC71',
  springGreen: '#00FF7F',
  lime: '#ADFF2F',
  teal: '#40E0D0',
  pink: '#FF69B4',
  hotPink: '#FF1493',
  snow: '#FFFAFA',
  steel: '#4682B4',
  dark: '#0A0814',
};

// 关卡挑战 - 多色山峰旗帜（雪顶+绿坡+红旗+金星）
export function StageIcon({ size, color, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}>
      {/* 远山（紫蓝渐变） */}
      <path d="M2 20 L7 12 L11 16 L14 11 L18 15 L22 20 Z" fill={C.deepPurple} opacity="0.35" stroke={C.deepPurple} strokeWidth="0.6" strokeLinejoin="round" />
      {/* 主山（绿色坡） */}
      <path d="M4 20 L9 9 L13 14 L17 7 L20 20 Z" fill={C.green} opacity="0.5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* 雪顶（白色） */}
      <path d="M9 9 L10.5 6.5 L12 9 L13 14 L11.5 13 Z" fill={C.white} opacity="0.85" stroke={C.silver} strokeWidth="0.4" strokeLinejoin="round" />
      <path d="M17 7 L18 5 L19 7 L20 20 L18 16 Z" fill={C.white} opacity="0.7" stroke={C.silver} strokeWidth="0.4" strokeLinejoin="round" />
      {/* 旗杆 */}
      <path d="M9 9 L9 3" stroke={C.silver} strokeWidth="0.8" strokeLinecap="round" />
      {/* 旗帜（红色） */}
      <path d="M9 3 L14 4 L12.5 6 L14 8 L9 7 Z" fill={C.red} opacity="0.85" stroke={C.crimson} strokeWidth="0.5" strokeLinejoin="round" />
      {/* 金星装饰 */}
      <circle cx="11.5" cy="5.5" r="0.6" fill={C.gold} stroke="none" />
      {/* 地平线 */}
      <path d="M3 20 L21 20" stroke={C.gold} strokeWidth="0.6" opacity="0.6" />
      {/* 光点 */}
      <circle cx="7" cy="15" r="0.5" fill={C.cyan} opacity="0.8" />
      <circle cx="15" cy="17" r="0.4" fill={C.pink} opacity="0.8" />
    </svg>
  );
}

// 世界BOSS - 多色骷髅（红眼+白骨+紫裂纹+金牙）
export function WorldBossIcon({ size, color, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}>
      {/* 骷髅主体（灰白渐变） */}
      <path d="M12 3 C7 3 4 6 4 11 C4 14 6 16 7 17 L7 20 L9 19 L9 20 L15 20 L15 19 L17 20 L17 17 C18 16 20 14 20 11 C20 6 17 3 12 3 Z" fill={C.snow} opacity="0.85" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      {/* 头顶紫色裂纹 */}
      <path d="M10 4 L10.5 6 L10 7" stroke={C.deepPurple} strokeWidth="0.5" opacity="0.7" />
      <path d="M14 4 L13.5 5.5 L14 6.5" stroke={C.deepPurple} strokeWidth="0.5" opacity="0.7" />
      {/* 左眼眶（深红） */}
      <circle cx="9" cy="11" r="2.2" fill={C.dark} stroke={C.crimson} strokeWidth="0.6" />
      {/* 左眼火焰（红橙渐变） */}
      <circle cx="9" cy="11" r="1.5" fill={C.red} />
      <circle cx="9" cy="11" r="0.9" fill={C.orange} />
      <circle cx="9" cy="11" r="0.4" fill={C.yellow} />
      {/* 右眼眶（深红） */}
      <circle cx="15" cy="11" r="2.2" fill={C.dark} stroke={C.crimson} strokeWidth="0.6" />
      {/* 右眼火焰 */}
      <circle cx="15" cy="11" r="1.5" fill={C.red} />
      <circle cx="15" cy="11" r="0.9" fill={C.orange} />
      <circle cx="15" cy="11" r="0.4" fill={C.yellow} />
      {/* 鼻孔（黑色） */}
      <path d="M11.5 14 L12 15 L12.5 14" fill={C.dark} stroke="none" />
      {/* 金牙 */}
      <rect x="9.5" y="16.5" width="1" height="1.5" fill={C.gold} stroke={C.amber} strokeWidth="0.2" />
      <rect x="11" y="16.8" width="1" height="1.3" fill={C.silver} stroke="none" />
      <rect x="12.5" y="16.5" width="1" height="1.5" fill={C.gold} stroke={C.amber} strokeWidth="0.2" />
      <rect x="14" y="16.8" width="1" height="1.3" fill={C.silver} stroke="none" />
      {/* 额头宝石（紫） */}
      <circle cx="12" cy="6.5" r="0.8" fill={C.magenta} stroke={C.deepPurple} strokeWidth="0.3" />
    </svg>
  );
}

// 炼狱 - 多层火焰（外橙+中黄+内白+红火心+紫地裂）
export function PurgatoryIcon({ size, color, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}>
      {/* 地面裂纹（紫色） */}
      <path d="M3 21 L7 19 L10 21 L14 19 L17 21 L21 19" stroke={C.deepPurple} strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
      <path d="M6 21 L8 20" stroke={C.magenta} strokeWidth="0.4" opacity="0.5" />
      <path d="M15 21 L17 20" stroke={C.magenta} strokeWidth="0.4" opacity="0.5" />
      {/* 外焰（橙红） */}
      <path d="M12 3 C9 6 7 9 7 14 C7 18 9 21 12 21 C15 21 17 18 17 14 C17 9 15 6 12 3 Z" fill={C.red} opacity="0.5" stroke={C.crimson} strokeWidth="1.2" strokeLinejoin="round" />
      {/* 中焰（橙） */}
      <path d="M12 6 C10 8 9 11 9 14 C9 17 10 19 12 19 C14 19 15 17 15 14 C15 11 14 8 12 6 Z" fill={C.orange} opacity="0.8" stroke={C.tomato} strokeWidth="0.6" strokeLinejoin="round" />
      {/* 内焰（黄） */}
      <path d="M12 9 C11 10.5 10.5 12 10.5 14 C10.5 16 11 17.5 12 17.5 C13 17.5 13.5 16 13.5 14 C13.5 12 13 10.5 12 9 Z" fill={C.yellow} opacity="0.85" stroke="none" />
      {/* 核心（白色） */}
      <path d="M12 11 C11.5 12 11.3 13 11.3 14 C11.3 15 11.6 15.5 12 15.5 C12.4 15.5 12.7 15 12.7 14 C12.7 13 12.5 12 12 11 Z" fill={C.white} opacity="0.9" stroke="none" />
      {/* 火星（多色点） */}
      <circle cx="8" cy="8" r="0.5" fill={C.gold} opacity="0.9" />
      <circle cx="16" cy="7" r="0.4" fill={C.pink} opacity="0.9" />
      <circle cx="6" cy="12" r="0.4" fill={C.cyan} opacity="0.8" />
      <circle cx="18" cy="11" r="0.5" fill={C.lime} opacity="0.9" />
      <circle cx="9" cy="5" r="0.3" fill={C.magenta} opacity="0.8" />
      <circle cx="15" cy="4" r="0.3" fill={C.skyBlue} opacity="0.8" />
    </svg>
  );
}

// 日常挑战 - 多色日历（青框+紫条+白格+绿勾+金星）
export function DailyIcon({ size, color, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}>
      {/* 日历主体（深底） */}
      <rect x="4" y="6" width="16" height="15" rx="1.5" fill={C.dark} opacity="0.7" stroke={color} strokeWidth="1.4" />
      {/* 顶部条（紫色） */}
      <path d="M4 7.5 C4 6.7 4.7 6 5.5 6 L18.5 6 C19.3 6 20 6.7 20 7.5 L20 10 L4 10 Z" fill={C.purple} opacity="0.75" stroke="none" />
      {/* 挂耳（银色） */}
      <path d="M8 6 L8 3" stroke={C.silver} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 6 L16 3" stroke={C.silver} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="3" r="0.8" fill={C.gold} stroke="none" />
      <circle cx="16" cy="3" r="0.8" fill={C.gold} stroke="none" />
      {/* 分隔线（金） */}
      <path d="M4 10 L20 10" stroke={C.gold} strokeWidth="0.5" opacity="0.6" />
      {/* 日期格（白色细线） */}
      <path d="M9 11 L9 20" stroke={C.white} strokeWidth="0.3" opacity="0.4" />
      <path d="M15 11 L15 20" stroke={C.white} strokeWidth="0.3" opacity="0.4" />
      <path d="M5 14.5 L19 14.5" stroke={C.white} strokeWidth="0.3" opacity="0.4" />
      <path d="M5 17.5 L19 17.5" stroke={C.white} strokeWidth="0.3" opacity="0.4" />
      {/* 已完成日期（绿色块） */}
      <rect x="5.5" y="11.5" width="2.8" height="2.5" fill={C.green} opacity="0.5" rx="0.3" stroke="none" />
      <rect x="9.3" y="11.5" width="2.8" height="2.5" fill={C.green} opacity="0.5" rx="0.3" stroke="none" />
      {/* 今日（金色高亮） */}
      <rect x="13.1" y="11.5" width="2.8" height="2.5" fill={C.gold} opacity="0.6" rx="0.3" stroke={C.amber} strokeWidth="0.4" />
      {/* 对勾（亮绿） */}
      <path d="M13.5 18 L15 19.5 L18 16" stroke={C.springGreen} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* 装饰星 */}
      <circle cx="6.5" cy="18.5" r="0.4" fill={C.cyan} opacity="0.8" />
      <circle cx="18" cy="13" r="0.3" fill={C.pink} opacity="0.8" />
    </svg>
  );
}

// 材料副本 - 多色水晶（紫晶+蓝面+白光+金座+粉点）
export function MaterialIcon({ size, color, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}>
      {/* 底座（金色） */}
      <path d="M5 19 L19 19 L17 21 L7 21 Z" fill={C.gold} opacity="0.6" stroke={C.amber} strokeWidth="0.6" strokeLinejoin="round" />
      {/* 水晶左面（深紫） */}
      <path d="M12 3 L6 10 L9 19 L12 12 Z" fill={C.deepPurple} opacity="0.7" stroke={color} strokeWidth="1" strokeLinejoin="round" />
      {/* 水晶右面（紫） */}
      <path d="M12 3 L18 10 L15 19 L12 12 Z" fill={C.purple} opacity="0.6" stroke={color} strokeWidth="1" strokeLinejoin="round" />
      {/* 水晶高光面（蓝） */}
      <path d="M12 3 L9 6 L8 10 L12 12 Z" fill={C.blue} opacity="0.5" stroke={C.deepBlue} strokeWidth="0.4" strokeLinejoin="round" />
      <path d="M12 3 L15 6 L16 10 L12 12 Z" fill={C.skyBlue} opacity="0.4" stroke={C.deepBlue} strokeWidth="0.4" strokeLinejoin="round" />
      {/* 顶部白光 */}
      <path d="M12 3 L11.5 5 L12 7 L12.5 5 Z" fill={C.white} opacity="0.9" stroke="none" />
      {/* 内部切面线 */}
      <path d="M12 3 L12 12" stroke={C.white} strokeWidth="0.4" opacity="0.5" />
      <path d="M6 10 L18 10" stroke={C.cyan} strokeWidth="0.4" opacity="0.5" />
      <path d="M8 14 L16 14" stroke={C.teal} strokeWidth="0.3" opacity="0.4" />
      {/* 光点装饰 */}
      <circle cx="9" cy="8" r="0.4" fill={C.cyan} opacity="0.9" />
      <circle cx="15" cy="9" r="0.4" fill={C.pink} opacity="0.9" />
      <circle cx="10" cy="16" r="0.3" fill={C.gold} opacity="0.8" />
      <circle cx="14" cy="17" r="0.3" fill={C.lime} opacity="0.8" />
      {/* 底座宝石 */}
      <circle cx="12" cy="20" r="0.6" fill={C.magenta} opacity="0.9" />
    </svg>
  );
}

// 镜像挑战 - 多色镜面（蓝框+青人+粉像+金线+白光）
export function MirrorIcon({ size, color, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}>
      {/* 镜框（蓝色） */}
      <rect x="3" y="3" width="18" height="18" rx="1.5" fill={C.dark} opacity="0.6" stroke={color} strokeWidth="1.4" />
      {/* 镜框角标（银） */}
      <path d="M3 6 L3 3 L6 3" stroke={C.silver} strokeWidth="0.6" fill="none" />
      <path d="M21 6 L21 3 L18 3" stroke={C.silver} strokeWidth="0.6" fill="none" />
      <path d="M3 18 L3 21 L6 21" stroke={C.silver} strokeWidth="0.6" fill="none" />
      <path d="M21 18 L21 21 L18 21" stroke={C.silver} strokeWidth="0.6" fill="none" />
      {/* 中央分界线（金色虚线） */}
      <path d="M12 4 L12 20" stroke={C.gold} strokeWidth="0.6" strokeDasharray="2 1.5" opacity="0.7" />
      {/* 左侧人物（青色） */}
      <circle cx="8.5" cy="9" r="1.8" fill={C.cyan} opacity="0.4" stroke={C.cyan} strokeWidth="0.8" />
      <path d="M6.5 15 C6.5 12.5 7.2 11.2 8.5 11.2 C9.8 11.2 10.5 12.5 10.5 15 L10.5 17 L9 17 L9 19 L8 19 L8 17 L6.5 17 Z" fill={C.cyan} opacity="0.35" stroke={C.cyan} strokeWidth="0.7" strokeLinejoin="round" />
      {/* 右侧镜像（粉色虚化） */}
      <circle cx="15.5" cy="9" r="1.8" fill={C.pink} opacity="0.25" stroke={C.pink} strokeWidth="0.8" strokeDasharray="1 0.5" />
      <path d="M13.5 15 C13.5 12.5 14.2 11.2 15.5 11.2 C16.8 11.2 17.5 12.5 17.5 15 L17.5 17 L16 17 L16 19 L15 19 L15 17 L13.5 17 Z" fill={C.pink} opacity="0.2" stroke={C.pink} strokeWidth="0.7" strokeDasharray="1 0.5" strokeLinejoin="round" />
      {/* 反射光带（白色） */}
      <path d="M4 5 L6 5" stroke={C.white} strokeWidth="0.6" opacity="0.6" />
      <path d="M4 7 L5 7" stroke={C.white} strokeWidth="0.4" opacity="0.5" />
      {/* 镜面光晕 */}
      <circle cx="12" cy="12" r="0.5" fill={C.white} opacity="0.9" />
      <circle cx="10" cy="14" r="0.3" fill={C.gold} opacity="0.7" />
      <circle cx="14" cy="14" r="0.3" fill={C.magenta} opacity="0.7" />
    </svg>
  );
}

// 守卫战 - 多色盾牌（青盾+金十字+银边+红宝石+白光）
export function GuardIcon({ size, color, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}>
      {/* 盾牌主体（青色渐变） */}
      <path d="M12 3 L5 5 L5 12 C5 16 8 19 12 21 C16 19 19 16 19 12 L19 5 Z" fill={C.teal} opacity="0.35" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* 盾牌内层（深色） */}
      <path d="M12 5 L7 6.5 L7 12 C7 15 9 17.5 12 19 C15 17.5 17 15 17 12 L17 6.5 Z" fill={C.dark} opacity="0.5" stroke={C.silver} strokeWidth="0.5" strokeLinejoin="round" />
      {/* 金色十字 */}
      <path d="M12 7 L12 16" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 11.5 L15 11.5" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" />
      {/* 十字高光（白） */}
      <path d="M12 7 L12 11" stroke={C.white} strokeWidth="0.5" strokeLinecap="round" opacity="0.7" />
      {/* 顶部红宝石 */}
      <circle cx="12" cy="5.5" r="1" fill={C.red} stroke={C.crimson} strokeWidth="0.4" />
      <circle cx="12" cy="5.5" r="0.4" fill={C.white} opacity="0.8" />
      {/* 底部装饰宝石（紫） */}
      <circle cx="12" cy="18" r="0.7" fill={C.magenta} opacity="0.9" />
      {/* 盾牌边角钉（金） */}
      <circle cx="6" cy="6.5" r="0.4" fill={C.gold} opacity="0.8" />
      <circle cx="18" cy="6.5" r="0.4" fill={C.gold} opacity="0.8" />
      {/* 光泽线 */}
      <path d="M7 8 L7 13" stroke={C.white} strokeWidth="0.3" opacity="0.4" />
      <path d="M17 8 L17 13" stroke={C.white} strokeWidth="0.3" opacity="0.4" />
      {/* 光点 */}
      <circle cx="9" cy="10" r="0.3" fill={C.cyan} opacity="0.8" />
      <circle cx="15" cy="10" r="0.3" fill={C.lime} opacity="0.8" />
    </svg>
  );
}

// 家园守卫 - 多色房屋（绿墙+红顶+黄窗+金盾+白勾）
export function HomeDefenseIcon({ size, color, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}>
      {/* 屋顶（红色） */}
      <path d="M3 11 L12 4 L21 11 L19 11 L12 5 L5 11 Z" fill={C.red} opacity="0.55" stroke={C.crimson} strokeWidth="0.8" strokeLinejoin="round" />
      {/* 房屋主体（绿色） */}
      <path d="M5 11 L19 11 L19 20 L5 20 Z" fill={C.green} opacity="0.3" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      {/* 墙体细节（深绿线） */}
      <path d="M5 14 L19 14" stroke={C.springGreen} strokeWidth="0.3" opacity="0.4" />
      <path d="M5 17 L19 17" stroke={C.springGreen} strokeWidth="0.3" opacity="0.4" />
      {/* 烟囱（银色） */}
      <rect x="15" y="5.5" width="1.5" height="3" fill={C.silver} opacity="0.6" stroke={C.steel} strokeWidth="0.3" />
      {/* 烟（灰） */}
      <circle cx="15.7" cy="4.5" r="0.5" fill={C.white} opacity="0.4" />
      <circle cx="16.2" cy="3.5" r="0.4" fill={C.white} opacity="0.3" />
      {/* 左窗（黄光） */}
      <rect x="6.5" y="12.5" width="2.5" height="2.5" fill={C.yellow} opacity="0.8" stroke={C.amber} strokeWidth="0.4" rx="0.3" />
      <path d="M7.75 12.5 L7.75 15" stroke={C.amber} strokeWidth="0.2" />
      <path d="M6.5 13.75 L9 13.75" stroke={C.amber} strokeWidth="0.2" />
      {/* 右窗（黄光） */}
      <rect x="15" y="12.5" width="2.5" height="2.5" fill={C.yellow} opacity="0.8" stroke={C.amber} strokeWidth="0.4" rx="0.3" />
      <path d="M16.25 12.5 L16.25 15" stroke={C.amber} strokeWidth="0.2" />
      <path d="M15 13.75 L17.5 13.75" stroke={C.amber} strokeWidth="0.2" />
      {/* 中央盾牌（金色） */}
      <path d="M12 14.5 L9 15.5 L9 17.5 C9 18.8 10 19.7 12 20.3 C14 19.7 15 18.8 15 17.5 L15 15.5 Z" fill={C.gold} opacity="0.75" stroke={C.amber} strokeWidth="0.8" strokeLinejoin="round" />
      {/* 盾牌勾（白色） */}
      <path d="M10.8 17.5 L11.6 18.3 L13.3 16.5" stroke={C.white} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* 门（深色） */}
      <rect x="11" y="17.5" width="2" height="2.5" fill={C.dark} opacity="0.6" stroke={C.amber} strokeWidth="0.3" rx="0.2" />
      {/* 装饰光点 */}
      <circle cx="12" cy="7" r="0.4" fill={C.cyan} opacity="0.8" />
      <circle cx="8" cy="8" r="0.3" fill={C.pink} opacity="0.7" />
      <circle cx="16" cy="8" r="0.3" fill={C.pink} opacity="0.7" />
      {/* 地面线 */}
      <path d="M3 20 L21 20" stroke={C.gold} strokeWidth="0.4" opacity="0.5" />
    </svg>
  );
}

// 趣味答题 - 问号/试卷
export function QuizIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      {/* 试卷 */}
      <rect x="5" y="5" width="14" height="15" rx="1" />
      <path d="M5 9 L19 9" />
      <path d="M7 13 L17 13" />
      <path d="M7 16 L15 16" />
      <path d="M7 19 L13 19" />
      {/* 问号 */}
      <path d="M15 7 L15 12" />
      <path d="M13 10.5 C13 10 13.5 9.5 15 9.5 C16.5 9.5 17 10 17 10.5" />
      <circle cx="15" cy="13" r="0.8" fill={color} stroke="none" />
    </SvgWrap>
  );
}

// 连续签到 - 日历+勾选
export function CheckInIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      {/* 日历外框 */}
      <rect x="5" y="6" width="14" height="14" rx="1" />
      {/* 日历顶部条 */}
      <rect x="5" y="6" width="14" height="3" fill={color} opacity="0.3" />
      {/* 挂耳 */}
      <path d="M8 6 L8 4" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 6 L16 4" strokeWidth="1.5" strokeLinecap="round" />
      {/* 日期格子 */}
      <path d="M5 11 L19 11" />
      <path d="M9 6 L9 20" />
      <path d="M15 6 L15 20" />
      {/* 勾选 */}
      <path d="M10 14.5 L11.5 16 L15 12.5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </SvgWrap>
  );
}

// 在线奖励 - 时钟+礼物
export function OnlineRewardIcon({ size, color, active }: IconProps) {
  return (
    <SvgWrap size={size} color={color} active={active}>
      {/* 时钟外圆 */}
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="8" fill={color} opacity="0.15" />
      {/* 时钟刻度 */}
      <path d="M12 4.5 L12 6" strokeLinecap="round" />
      <path d="M12 18 L12 19.5" strokeLinecap="round" />
      <path d="M4.5 12 L6 12" strokeLinecap="round" />
      <path d="M18 12 L19.5 12" strokeLinecap="round" />
      {/* 时钟指针 */}
      <path d="M12 12 L12 8" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 12 L15 12" strokeWidth="1.6" strokeLinecap="round" />
      {/* 中心 */}
      <circle cx="12" cy="12" r="1" fill={color} stroke="none" />
    </SvgWrap>
  );
}

// ===========================================================================
// === V2 像素艺术风模式图标（参考强化/附魔道具设计思路）===================
// 16×16 像素网格，多层明暗渐变 + 大量颜色点缀 + 凹凸质感
// 保留 V1 SVG 版本（上方 StageIcon 等），如需回退改回 V1 import 即可
// ====================================================================================

function Pixel({ x, y, color, w = 1, h = 1 }: { x: number; y: number; color: string; w?: number; h?: number }) {
  return <rect x={x} y={y} width={w} height={h} fill={color} shapeRendering="crispEdges" />;
}

// 调色板：超过 20 种颜色用于点缀各 V2 图标
const P = {
  white: '#FFFFFF',
  snow: '#FFFAFA',
  gold: '#FFD700',
  goldDark: '#B8860B',
  goldLight: '#FFE680',
  amber: '#FFA500',
  silver: '#C0C0C0',
  silverDark: '#707070',
  silverLight: '#E0E0E0',
  cyan: '#00F5D4',
  cyanDark: '#00897B',
  cyanLight: '#80FFEF',
  blue: '#3498DB',
  blueDark: '#1A5276',
  blueLight: '#85C1E9',
  deepBlue: '#1E90FF',
  skyBlue: '#87CEEB',
  purple: '#9B59B6',
  purpleDark: '#5B2C6F',
  purpleLight: '#D2B4DE',
  deepPurple: '#6C3483',
  magenta: '#FF00FF',
  orchid: '#DA70D6',
  red: '#E74C3C',
  redDark: '#922B21',
  redLight: '#F5B7B1',
  crimson: '#DC143C',
  tomato: '#FF6347',
  orange: '#FF8C42',
  orangeDark: '#CA6F1E',
  yellow: '#F7DC6F',
  yellowLight: '#FCF3CF',
  green: '#2ECC71',
  greenDark: '#1E8449',
  greenLight: '#ABEBC6',
  springGreen: '#00FF7F',
  lime: '#ADFF2F',
  teal: '#40E0D0',
  tealDark: '#16A085',
  pink: '#FF69B4',
  hotPink: '#FF1493',
  pinkLight: '#FADBD8',
  brown: '#8B5A2B',
  brownDark: '#5A3A1A',
  dark: '#0A0814',
  darkMid: '#1E1A35',
};

function PixelSvg({ size = 26, color, active, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      overflow="visible"
      style={{
        display: 'block',
        imageRendering: 'pixelated',
        filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})`,
      }}
    >
      {children}
    </svg>
  );
}

// 关卡挑战 V2 - 像素山峰 + 旗帜 + 雪顶 + 金星（绿主色 + 多色点缀）
export function StageIconV2({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 天空背景小星点 */}
      <Pixel x={1} y={1} color={P.white} />
      <Pixel x={14} y={2} color={P.cyanLight} />
      <Pixel x={3} y={2} color={P.pinkLight} />
      {/* 远山（紫蓝渐变） */}
      <Pixel x={0} y={12} color={P.deepPurple} w={16} h={1} />
      <Pixel x={1} y={11} color={P.purpleDark} w={3} h={1} />
      <Pixel x={12} y={11} color={P.purpleDark} w={3} h={1} />
      <Pixel x={2} y={10} color={P.purple} />
      <Pixel x={13} y={10} color={P.purple} />
      {/* 主山左峰（绿坡渐变） */}
      <Pixel x={2} y={13} color={P.greenDark} w={3} h={1} />
      <Pixel x={3} y={12} color={P.greenDark} w={2} h={1} />
      <Pixel x={4} y={11} color={P.green} />
      <Pixel x={4} y={10} color={P.green} />
      <Pixel x={5} y={9} color={P.greenLight} />
      <Pixel x={5} y={8} color={P.greenLight} />
      <Pixel x={6} y={7} color={P.snow} />
      <Pixel x={6} y={6} color={P.white} />
      <Pixel x={5} y={7} color={P.snow} />
      {/* 主山中峰（最高峰，雪顶） */}
      <Pixel x={7} y={5} color={P.white} />
      <Pixel x={8} y={4} color={P.white} />
      <Pixel x={7} y={6} color={P.snow} />
      <Pixel x={8} y={5} color={P.snow} />
      <Pixel x={8} y={6} color={P.snow} />
      <Pixel x={7} y={7} color={P.greenLight} />
      <Pixel x={8} y={7} color={P.greenLight} />
      <Pixel x={7} y={8} color={P.green} />
      <Pixel x={8} y={8} color={P.green} />
      <Pixel x={6} y={9} color={P.green} w={3} h={1} />
      <Pixel x={6} y={10} color={P.greenDark} w={3} h={1} />
      {/* 主山右峰（绿坡） */}
      <Pixel x={9} y={8} color={P.greenLight} />
      <Pixel x={10} y={7} color={P.snow} />
      <Pixel x={10} y={8} color={P.greenLight} />
      <Pixel x={11} y={9} color={P.green} />
      <Pixel x={11} y={10} color={P.green} />
      <Pixel x={11} y={11} color={P.greenDark} />
      <Pixel x={12} y={12} color={P.greenDark} />
      <Pixel x={12} y={13} color={P.greenDark} w={2} h={1} />
      {/* 旗杆 */}
      <Pixel x={8} y={0} color={P.silver} />
      <Pixel x={8} y={1} color={P.silver} />
      <Pixel x={8} y={2} color={P.silverDark} />
      <Pixel x={8} y={3} color={P.silverDark} />
      {/* 旗帜（红） */}
      <Pixel x={9} y={0} color={P.red} w={3} h={1} />
      <Pixel x={9} y={1} color={P.redLight} w={3} h={1} />
      <Pixel x={9} y={2} color={P.red} w={3} h={1} />
      <Pixel x={12} y={0} color={P.crimson} />
      <Pixel x={12} y={1} color={P.red} />
      <Pixel x={12} y={2} color={P.crimson} />
      {/* 金星装饰 */}
      <Pixel x={10} y={1} color={P.gold} />
      {/* 地面 */}
      <Pixel x={0} y={14} color={P.brownDark} w={16} h={1} />
      <Pixel x={0} y={15} color={P.brown} w={16} h={1} />
      {/* 地面光点 */}
      <Pixel x={2} y={14} color={P.gold} />
      <Pixel x={13} y={14} color={P.cyan} />
    </PixelSvg>
  );
}

// 世界BOSS V2 - 像素骷髅 + 火焰眼 + 紫裂纹 + 金牙（白骨 + 多色）
export function WorldBossIconV2({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 头顶紫色裂纹 */}
      <Pixel x={7} y={1} color={P.deepPurple} />
      <Pixel x={8} y={2} color={P.purple} />
      <Pixel x={7} y={3} color={P.deepPurple} />
      {/* 骷髅顶（白色高光） */}
      <Pixel x={5} y={2} color={P.snow} w={6} h={1} />
      <Pixel x={4} y={3} color={P.white} w={8} h={1} />
      <Pixel x={3} y={4} color={P.snow} w={10} h={1} />
      {/* 额头宝石（紫） */}
      <Pixel x={7} y={3} color={P.magenta} />
      <Pixel x={8} y={3} color={P.orchid} />
      {/* 头部主体 */}
      <Pixel x={3} y={5} color={P.snow} w={10} h={1} />
      <Pixel x={3} y={6} color={P.white} w={10} h={1} />
      <Pixel x={3} y={7} color={P.silver} w={10} h={1} />
      {/* 左眼眶（深红） */}
      <Pixel x={4} y={6} color={P.dark} w={3} h={1} />
      <Pixel x={4} y={7} color={P.redDark} w={3} h={1} />
      <Pixel x={4} y={8} color={P.dark} w={3} h={1} />
      {/* 左眼火焰（红→橙→黄→白） */}
      <Pixel x={5} y={6} color={P.red} />
      <Pixel x={5} y={7} color={P.orange} />
      <Pixel x={5} y={8} color={P.yellow} />
      <Pixel x={5} y={7} color={P.white} />
      {/* 右眼眶 */}
      <Pixel x={9} y={6} color={P.dark} w={3} h={1} />
      <Pixel x={9} y={7} color={P.redDark} w={3} h={1} />
      <Pixel x={9} y={8} color={P.dark} w={3} h={1} />
      {/* 右眼火焰 */}
      <Pixel x={10} y={6} color={P.red} />
      <Pixel x={10} y={7} color={P.orange} />
      <Pixel x={10} y={8} color={P.yellow} />
      <Pixel x={10} y={7} color={P.white} />
      {/* 鼻孔 */}
      <Pixel x={7} y={9} color={P.dark} />
      <Pixel x={8} y={9} color={P.dark} />
      <Pixel x={7} y={10} color={P.darkMid} />
      <Pixel x={8} y={10} color={P.darkMid} />
      {/* 上颚 */}
      <Pixel x={4} y={10} color={P.silver} w={8} h={1} />
      <Pixel x={4} y={11} color={P.white} w={8} h={1} />
      {/* 牙齿（金/银交替） */}
      <Pixel x={4} y={12} color={P.gold} />
      <Pixel x={5} y={12} color={P.goldLight} />
      <Pixel x={6} y={12} color={P.silver} />
      <Pixel x={7} y={12} color={P.gold} />
      <Pixel x={8} y={12} color={P.goldLight} />
      <Pixel x={9} y={12} color={P.silver} />
      <Pixel x={10} y={12} color={P.gold} />
      <Pixel x={11} y={12} color={P.goldLight} />
      {/* 下颚 */}
      <Pixel x={5} y={13} color={P.silver} w={6} h={1} />
      <Pixel x={6} y={14} color={P.silverDark} w={4} h={1} />
      {/* 颊侧紫光 */}
      <Pixel x={3} y={6} color={P.purpleLight} />
      <Pixel x={12} y={6} color={P.purpleLight} />
      {/* 顶部光晕 */}
      <Pixel x={7} y={0} color={P.goldLight} />
      <Pixel x={8} y={0} color={P.gold} />
    </PixelSvg>
  );
}

// 炼狱 V2 - 像素多层火焰 + 地裂 + 火星（红橙黄白 + 紫地裂）
export function PurgatoryIconV2({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 火焰顶部尖（白） */}
      <Pixel x={7} y={0} color={P.white} />
      <Pixel x={8} y={1} color={P.snow} />
      {/* 外焰（红） */}
      <Pixel x={6} y={2} color={P.crimson} w={4} h={1} />
      <Pixel x={5} y={3} color={P.redDark} w={6} h={1} />
      <Pixel x={4} y={4} color={P.red} w={8} h={1} />
      <Pixel x={4} y={5} color={P.red} w={8} h={1} />
      <Pixel x={3} y={6} color={P.redDark} w={10} h={1} />
      <Pixel x={3} y={7} color={P.red} w={10} h={1} />
      <Pixel x={3} y={8} color={P.redDark} w={10} h={1} />
      <Pixel x={4} y={9} color={P.crimson} w={8} h={1} />
      {/* 中焰（橙） */}
      <Pixel x={7} y={2} color={P.yellowLight} />
      <Pixel x={6} y={3} color={P.amber} w={4} h={1} />
      <Pixel x={5} y={4} color={P.orange} w={6} h={1} />
      <Pixel x={5} y={5} color={P.orangeDark} w={6} h={1} />
      <Pixel x={5} y={6} color={P.orange} w={6} h={1} />
      <Pixel x={5} y={7} color={P.amber} w={6} h={1} />
      <Pixel x={5} y={8} color={P.orange} w={6} h={1} />
      <Pixel x={6} y={9} color={P.amber} w={4} h={1} />
      {/* 内焰（黄） */}
      <Pixel x={7} y={3} color={P.white} />
      <Pixel x={7} y={4} color={P.yellowLight} />
      <Pixel x={6} y={5} color={P.yellow} w={4} h={1} />
      <Pixel x={6} y={6} color={P.yellowLight} w={4} h={1} />
      <Pixel x={7} y={7} color={P.yellow} w={2} h={1} />
      {/* 核心（白） */}
      <Pixel x={7} y={5} color={P.white} w={2} h={1} />
      <Pixel x={7} y={6} color={P.snow} w={2} h={1} />
      {/* 地面裂纹（紫） */}
      <Pixel x={1} y={11} color={P.deepPurple} />
      <Pixel x={2} y={12} color={P.purple} />
      <Pixel x={3} y={11} color={P.deepPurple} />
      <Pixel x={12} y={11} color={P.deepPurple} />
      <Pixel x={13} y={12} color={P.purple} />
      <Pixel x={14} y={11} color={P.deepPurple} />
      <Pixel x={7} y={11} color={P.magenta} />
      <Pixel x={8} y={11} color={P.orchid} />
      {/* 地面 */}
      <Pixel x={0} y={12} color={P.purpleDark} w={16} h={1} />
      <Pixel x={0} y={13} color={P.darkMid} w={16} h={1} />
      <Pixel x={0} y={14} color={P.dark} w={16} h={1} />
      <Pixel x={0} y={15} color={P.dark} w={16} h={1} />
      {/* 火星（多色点） */}
      <Pixel x={2} y={3} color={P.gold} />
      <Pixel x={13} y={4} color={P.pink} />
      <Pixel x={1} y={6} color={P.cyan} />
      <Pixel x={14} y={7} color={P.lime} />
      <Pixel x={2} y={8} color={P.skyBlue} />
      <Pixel x={13} y={9} color={P.magenta} />
      <Pixel x={0} y={5} color={P.goldLight} />
      <Pixel x={15} y={5} color={P.springGreen} />
    </PixelSvg>
  );
}

// 日常挑战 V2 - 像素日历 + 紫顶 + 金挂耳 + 绿格 + 金今日 + 绿勾
export function DailyIconV2({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 挂耳（银+金扣） */}
      <Pixel x={4} y={0} color={P.silverDark} />
      <Pixel x={4} y={1} color={P.silver} />
      <Pixel x={4} y={2} color={P.silverLight} />
      <Pixel x={3} y={0} color={P.gold} />
      <Pixel x={11} y={0} color={P.gold} />
      <Pixel x={11} y={1} color={P.silver} />
      <Pixel x={11} y={2} color={P.silverLight} />
      <Pixel x={11} y={0} color={P.silverDark} />
      {/* 顶部条（紫色渐变） */}
      <Pixel x={2} y={3} color={P.purpleDark} w={12} h={1} />
      <Pixel x={2} y={4} color={P.purple} w={12} h={1} />
      <Pixel x={2} y={5} color={P.purpleLight} w={12} h={1} />
      {/* 顶部金边 */}
      <Pixel x={2} y={6} color={P.gold} w={12} h={1} />
      {/* 日历主体（深底） */}
      <Pixel x={2} y={7} color={P.darkMid} w={12} h={1} />
      <Pixel x={2} y={8} color={P.dark} w={12} h={1} />
      <Pixel x={2} y={9} color={P.darkMid} w={12} h={1} />
      <Pixel x={2} y={10} color={P.dark} w={12} h={1} />
      <Pixel x={2} y={11} color={P.darkMid} w={12} h={1} />
      <Pixel x={2} y={12} color={P.dark} w={12} h={1} />
      <Pixel x={2} y={13} color={P.darkMid} w={12} h={1} />
      {/* 外框（青色） */}
      <Pixel x={1} y={3} color={P.cyanDark} w={1} h={11} />
      <Pixel x={14} y={3} color={P.cyanDark} w={1} h={11} />
      <Pixel x={1} y={14} color={P.cyanDark} w={14} h={1} />
      {/* 格线 */}
      <Pixel x={6} y={7} color={P.silverDark} w={1} h={7} />
      <Pixel x={10} y={7} color={P.silverDark} w={1} h={7} />
      <Pixel x={2} y={10} color={P.silverDark} w={12} h={1} />
      {/* 已完成格（绿） */}
      <Pixel x={3} y={8} color={P.greenDark} w={3} h={2} />
      <Pixel x={3} y={8} color={P.green} />
      <Pixel x={4} y={8} color={P.greenLight} />
      <Pixel x={7} y={8} color={P.greenDark} w={3} h={2} />
      <Pixel x={7} y={8} color={P.green} />
      <Pixel x={8} y={8} color={P.greenLight} />
      {/* 今日格（金高亮） */}
      <Pixel x={11} y={8} color={P.goldDark} w={3} h={2} />
      <Pixel x={11} y={8} color={P.gold} />
      <Pixel x={12} y={8} color={P.goldLight} />
      <Pixel x={11} y={9} color={P.goldLight} />
      {/* 对勾（亮绿） */}
      <Pixel x={3} y={12} color={P.springGreen} />
      <Pixel x={4} y={13} color={P.springGreen} />
      <Pixel x={5} y={12} color={P.springGreen} />
      <Pixel x={6} y={11} color={P.springGreen} />
      <Pixel x={7} y={12} color={P.springGreen} />
      {/* 底部光点 */}
      <Pixel x={11} y={12} color={P.pink} />
      <Pixel x={12} y={13} color={P.cyan} />
      <Pixel x={13} y={12} color={P.gold} />
    </PixelSvg>
  );
}

// 材料副本 V2 - 像素水晶 + 金座 + 多色光点（紫晶 + 蓝面 + 白光）
export function MaterialIconV2({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 水晶顶点（白光） */}
      <Pixel x={7} y={0} color={P.white} />
      <Pixel x={8} y={0} color={P.snow} />
      {/* 水晶左上斜面（深紫） */}
      <Pixel x={6} y={1} color={P.deepPurple} w={2} h={1} />
      <Pixel x={8} y={1} color={P.purple} w={2} h={1} />
      <Pixel x={5} y={2} color={P.deepPurple} w={2} h={1} />
      <Pixel x={9} y={2} color={P.purple} w={2} h={1} />
      {/* 水晶中部（紫+蓝高光） */}
      <Pixel x={4} y={3} color={P.purpleDark} w={3} h={1} />
      <Pixel x={9} y={3} color={P.purpleDark} w={3} h={1} />
      <Pixel x={7} y={3} color={P.purpleLight} w={2} h={1} />
      <Pixel x={3} y={4} color={P.purpleDark} w={3} h={1} />
      <Pixel x={10} y={4} color={P.purpleDark} w={3} h={1} />
      <Pixel x={6} y={4} color={P.purple} w={4} h={1} />
      {/* 蓝色高光面 */}
      <Pixel x={6} y={5} color={P.blueLight} w={2} h={1} />
      <Pixel x={8} y={5} color={P.skyBlue} w={2} h={1} />
      <Pixel x={3} y={5} color={P.deepPurple} w={3} h={1} />
      <Pixel x={10} y={5} color={P.deepPurple} w={3} h={1} />
      {/* 下部（深紫渐变） */}
      <Pixel x={4} y={6} color={P.purple} w={3} h={1} />
      <Pixel x={7} y={6} color={P.cyan} w={2} h={1} />
      <Pixel x={9} y={6} color={P.purple} w={3} h={1} />
      <Pixel x={5} y={7} color={P.purpleDark} w={6} h={1} />
      <Pixel x={5} y={7} color={P.purpleLight} />
      <Pixel x={10} y={7} color={P.purpleLight} />
      <Pixel x={6} y={8} color={P.deepPurple} w={4} h={1} />
      <Pixel x={7} y={8} color={P.magenta} w={2} h={1} />
      <Pixel x={7} y={9} color={P.orchid} w={2} h={1} />
      {/* 内部光点 */}
      <Pixel x={7} y={3} color={P.white} />
      <Pixel x={8} y={4} color={P.goldLight} />
      <Pixel x={6} y={6} color={P.cyanLight} />
      <Pixel x={9} y={6} color={P.pink} />
      {/* 金色底座 */}
      <Pixel x={4} y={10} color={P.goldDark} w={8} h={1} />
      <Pixel x={3} y={11} color={P.goldDark} w={10} h={1} />
      <Pixel x={4} y={11} color={P.gold} w={8} h={1} />
      <Pixel x={5} y={11} color={P.goldLight} />
      <Pixel x={10} y={11} color={P.goldLight} />
      <Pixel x={3} y={12} color={P.brownDark} w={10} h={1} />
      <Pixel x={4} y={13} color={P.brown} w={8} h={1} />
      <Pixel x={5} y={14} color={P.brownDark} w={6} h={1} />
      {/* 底座宝石 */}
      <Pixel x={7} y={12} color={P.magenta} w={2} h={1} />
      <Pixel x={7} y={13} color={P.orchid} w={2} h={1} />
      {/* 底部光点 */}
      <Pixel x={2} y={13} color={P.cyan} />
      <Pixel x={13} y={13} color={P.cyan} />
      <Pixel x={3} y={15} color={P.gold} />
      <Pixel x={12} y={15} color={P.gold} />
    </PixelSvg>
  );
}

// 镜像挑战 V2 - 像素镜框 + 左青人物 + 右粉镜像 + 金分界
export function MirrorIconV2({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 镜框（蓝色） */}
      <Pixel x={0} y={0} color={P.blueDark} w={16} h={1} />
      <Pixel x={0} y={1} color={P.blue} w={16} h={1} />
      <Pixel x={0} y={2} color={P.blueLight} w={16} h={1} />
      <Pixel x={0} y={13} color={P.blueDark} w={16} h={1} />
      <Pixel x={0} y={14} color={P.blue} w={16} h={1} />
      <Pixel x={0} y={15} color={P.blueDark} w={16} h={1} />
      <Pixel x={0} y={3} color={P.blueDark} w={1} h={10} />
      <Pixel x={15} y={3} color={P.blueDark} w={1} h={10} />
      {/* 银色角标 */}
      <Pixel x={1} y={1} color={P.silverLight} />
      <Pixel x={14} y={1} color={P.silverLight} />
      <Pixel x={1} y={14} color={P.silverLight} />
      <Pixel x={14} y={14} color={P.silverLight} />
      {/* 中央分界线（金） */}
      <Pixel x={8} y={3} color={P.gold} w={1} h={10} />
      <Pixel x={7} y={3} color={P.goldDark} w={1} h={10} />
      {/* 左侧人物头（青） */}
      <Pixel x={4} y={4} color={P.cyanDark} w={2} h={1} />
      <Pixel x={3} y={5} color={P.cyan} w={4} h={1} />
      <Pixel x={3} y={6} color={P.cyanLight} w={4} h={1} />
      <Pixel x={3} y={7} color={P.cyan} w={4} h={1} />
      <Pixel x={4} y={8} color={P.cyanDark} w={2} h={1} />
      {/* 左侧人物身（青） */}
      <Pixel x={3} y={9} color={P.cyanDark} w={5} h={1} />
      <Pixel x={3} y={10} color={P.cyan} w={5} h={1} />
      <Pixel x={4} y={11} color={P.cyanDark} w={3} h={1} />
      <Pixel x={5} y={12} color={P.cyanDark} w={1} h={1} />
      {/* 右侧镜像头（粉，虚化感） */}
      <Pixel x={10} y={4} color={P.hotPink} w={2} h={1} />
      <Pixel x={9} y={5} color={P.pink} w={4} h={1} />
      <Pixel x={9} y={6} color={P.pinkLight} w={4} h={1} />
      <Pixel x={9} y={7} color={P.pink} w={4} h={1} />
      <Pixel x={10} y={8} color={P.hotPink} w={2} h={1} />
      {/* 右侧镜像身（粉） */}
      <Pixel x={8} y={9} color={P.hotPink} w={5} h={1} />
      <Pixel x={8} y={10} color={P.pink} w={5} h={1} />
      <Pixel x={9} y={11} color={P.hotPink} w={3} h={1} />
      <Pixel x={10} y={12} color={P.hotPink} w={1} h={1} />
      {/* 反射光（白） */}
      <Pixel x={2} y={3} color={P.white} w={2} h={1} />
      <Pixel x={2} y={4} color={P.silverLight} />
      <Pixel x={12} y={3} color={P.silverLight} w={2} h={1} />
      {/* 中央光晕 */}
      <Pixel x={8} y={7} color={P.white} />
      <Pixel x={7} y={8} color={P.goldLight} />
      {/* 装饰光点 */}
      <Pixel x={2} y={11} color={P.gold} />
      <Pixel x={13} y={11} color={P.gold} />
      <Pixel x={4} y={12} color={P.magenta} />
      <Pixel x={11} y={12} color={P.magenta} />
    </PixelSvg>
  );
}

// 守卫战 V2 - 像素盾牌 + 金十字 + 红宝石 + 银边（青盾 + 多色）
export function GuardIconV2({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 盾牌外框（银边） */}
      <Pixel x={4} y={0} color={P.silverDark} w={8} h={1} />
      <Pixel x={3} y={1} color={P.silver} w={10} h={1} />
      <Pixel x={2} y={2} color={P.silverLight} w={12} h={1} />
      <Pixel x={2} y={3} color={P.silver} w={12} h={1} />
      <Pixel x={1} y={4} color={P.silverDark} w={14} h={1} />
      <Pixel x={1} y={5} color={P.silver} w={14} h={1} />
      <Pixel x={1} y={6} color={P.silverDark} w={14} h={1} />
      <Pixel x={2} y={7} color={P.silver} w={12} h={1} />
      <Pixel x={2} y={8} color={P.silverDark} w={12} h={1} />
      <Pixel x={3} y={9} color={P.silver} w={10} h={1} />
      <Pixel x={3} y={10} color={P.silverDark} w={10} h={1} />
      <Pixel x={4} y={11} color={P.silver} w={8} h={1} />
      <Pixel x={5} y={12} color={P.silverDark} w={6} h={1} />
      <Pixel x={6} y={13} color={P.silver} w={4} h={1} />
      <Pixel x={7} y={14} color={P.silverDark} w={2} h={1} />
      {/* 盾牌主体（青色渐变） */}
      <Pixel x={5} y={2} color={P.cyanDark} w={6} h={1} />
      <Pixel x={4} y={3} color={P.cyanDark} w={8} h={1} />
      <Pixel x={3} y={4} color={P.cyanDark} w={10} h={1} />
      <Pixel x={3} y={5} color={P.cyan} w={10} h={1} />
      <Pixel x={3} y={6} color={P.cyanLight} w={10} h={1} />
      <Pixel x={3} y={7} color={P.cyan} w={10} h={1} />
      <Pixel x={4} y={8} color={P.cyanDark} w={8} h={1} />
      <Pixel x={4} y={9} color={P.cyan} w={8} h={1} />
      <Pixel x={5} y={10} color={P.cyanDark} w={6} h={1} />
      <Pixel x={6} y={11} color={P.cyanDark} w={4} h={1} />
      {/* 金色十字（竖） */}
      <Pixel x={7} y={3} color={P.goldDark} w={2} h={1} />
      <Pixel x={7} y={4} color={P.gold} w={2} h={1} />
      <Pixel x={7} y={5} color={P.goldLight} w={2} h={1} />
      <Pixel x={7} y={6} color={P.gold} w={2} h={1} />
      <Pixel x={7} y={7} color={P.gold} w={2} h={1} />
      <Pixel x={7} y={8} color={P.goldDark} w={2} h={1} />
      <Pixel x={7} y={9} color={P.gold} w={2} h={1} />
      <Pixel x={7} y={10} color={P.goldDark} w={2} h={1} />
      {/* 金色十字（横） */}
      <Pixel x={5} y={5} color={P.goldDark} />
      <Pixel x={6} y={5} color={P.gold} />
      <Pixel x={9} y={5} color={P.goldDark} />
      <Pixel x={10} y={5} color={P.gold} />
      <Pixel x={5} y={6} color={P.gold} />
      <Pixel x={6} y={6} color={P.goldLight} />
      <Pixel x={9} y={6} color={P.gold} />
      <Pixel x={10} y={6} color={P.gold} />
      {/* 顶部红宝石 */}
      <Pixel x={7} y={0} color={P.redDark} w={2} h={1} />
      <Pixel x={7} y={1} color={P.red} w={2} h={1} />
      <Pixel x={7} y={1} color={P.redLight} />
      <Pixel x={8} y={1} color={P.white} />
      {/* 底部紫宝石 */}
      <Pixel x={7} y={12} color={P.purpleDark} w={2} h={1} />
      <Pixel x={7} y={13} color={P.magenta} w={2} h={1} />
      {/* 边角钉（金） */}
      <Pixel x={3} y={4} color={P.gold} />
      <Pixel x={12} y={4} color={P.gold} />
      <Pixel x={3} y={7} color={P.gold} />
      <Pixel x={12} y={7} color={P.gold} />
      {/* 高光点 */}
      <Pixel x={4} y={3} color={P.white} />
      <Pixel x={11} y={3} color={P.cyanLight} />
    </PixelSvg>
  );
}

// 家园守卫 V2 - 像素房屋 + 黄窗 + 金盾 + 白勾（绿墙红顶 + 多色）
export function HomeDefenseIconV2({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 烟囱（银） */}
      <Pixel x={11} y={0} color={P.silverDark} w={2} h={1} />
      <Pixel x={11} y={1} color={P.silver} w={2} h={1} />
      <Pixel x={11} y={2} color={P.silverLight} w={2} h={1} />
      <Pixel x={11} y={3} color={P.silver} w={2} h={1} />
      {/* 烟（白） */}
      <Pixel x={12} y={0} color={P.white} />
      <Pixel x={13} y={1} color={P.silverLight} />
      <Pixel x={14} y={0} color={P.snow} />
      {/* 屋顶（红色渐变） */}
      <Pixel x={2} y={4} color={P.redDark} w={12} h={1} />
      <Pixel x={1} y={3} color={P.redDark} w={2} h={1} />
      <Pixel x={13} y={3} color={P.redDark} w={2} h={1} />
      <Pixel x={3} y={2} color={P.crimson} w={2} h={1} />
      <Pixel x={11} y={2} color={P.crimson} w={2} h={1} />
      <Pixel x={5} y={1} color={P.red} w={6} h={1} />
      <Pixel x={7} y={0} color={P.redLight} w={2} h={1} />
      {/* 屋顶金边 */}
      <Pixel x={2} y={5} color={P.gold} w={12} h={1} />
      {/* 房屋主体（绿色渐变） */}
      <Pixel x={2} y={6} color={P.greenDark} w={12} h={1} />
      <Pixel x={2} y={7} color={P.green} w={12} h={1} />
      <Pixel x={2} y={8} color={P.greenLight} w={12} h={1} />
      <Pixel x={2} y={9} color={P.green} w={12} h={1} />
      <Pixel x={2} y={10} color={P.greenDark} w={12} h={1} />
      <Pixel x={2} y={11} color={P.green} w={12} h={1} />
      <Pixel x={2} y={12} color={P.greenDark} w={12} h={1} />
      {/* 左窗（黄光） */}
      <Pixel x={3} y={7} color={P.amber} w={3} h={1} />
      <Pixel x={3} y={8} color={P.yellow} w={3} h={1} />
      <Pixel x={3} y={9} color={P.amber} w={3} h={1} />
      <Pixel x={3} y={7} color={P.yellowLight} />
      <Pixel x={4} y={8} color={P.white} />
      {/* 右窗（黄光） */}
      <Pixel x={10} y={7} color={P.amber} w={3} h={1} />
      <Pixel x={10} y={8} color={P.yellow} w={3} h={1} />
      <Pixel x={10} y={9} color={P.amber} w={3} h={1} />
      <Pixel x={10} y={7} color={P.yellowLight} />
      <Pixel x={11} y={8} color={P.white} />
      {/* 中央盾牌（金） */}
      <Pixel x={7} y={7} color={P.goldDark} w={2} h={1} />
      <Pixel x={6} y={8} color={P.goldDark} w={4} h={1} />
      <Pixel x={6} y={9} color={P.gold} w={4} h={1} />
      <Pixel x={6} y={10} color={P.goldLight} w={4} h={1} />
      <Pixel x={7} y={11} color={P.gold} w={2} h={1} />
      {/* 盾牌勾（白） */}
      <Pixel x={7} y={9} color={P.white} />
      <Pixel x={8} y={10} color={P.white} />
      <Pixel x={9} y={9} color={P.white} />
      {/* 门（深棕） */}
      <Pixel x={7} y={12} color={P.brownDark} w={2} h={1} />
      <Pixel x={7} y={13} color={P.brown} w={2} h={1} />
      <Pixel x={7} y={14} color={P.brownDark} w={2} h={1} />
      <Pixel x={7} y={13} color={P.gold} />
      {/* 地面 */}
      <Pixel x={0} y={15} color={P.brownDark} w={16} h={1} />
      {/* 装饰光点 */}
      <Pixel x={7} y={0} color={P.goldLight} />
      <Pixel x={0} y={6} color={P.cyan} />
      <Pixel x={15} y={6} color={P.cyan} />
      <Pixel x={1} y={13} color={P.magenta} />
      <Pixel x={14} y={13} color={P.magenta} />
      <Pixel x={0} y={15} color={P.gold} />
      <Pixel x={15} y={15} color={P.gold} />
    </PixelSvg>
  );
}

// ===========================================================================
// === V3 像素艺术风模式图标（重新设计：世界BOSS / 炼狱 / 材料副本）=========
// 保留 V2 版本，如需回退改回 V2 import 即可
// ====================================================================================

// 世界BOSS V3 - 远古恶魔巨龙头（正脸），犄角 + 火焰眼 + 獠牙 + 紫黑甲胄
export function WorldBossIconV3({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 顶部犄角左（金棕渐变） */}
      <Pixel x={2} y={1} color={P.brownDark} />
      <Pixel x={3} y={0} color={P.brown} />
      <Pixel x={3} y={1} color={P.amber} />
      <Pixel x={4} y={2} color={P.gold} />
      <Pixel x={2} y={2} color={P.brownDark} />
      {/* 顶部犄角右 */}
      <Pixel x={13} y={1} color={P.brownDark} />
      <Pixel x={12} y={0} color={P.brown} />
      <Pixel x={12} y={1} color={P.amber} />
      <Pixel x={11} y={2} color={P.gold} />
      <Pixel x={13} y={2} color={P.brownDark} />
      {/* 头顶甲胄（深紫渐变） */}
      <Pixel x={5} y={2} color={P.purpleDark} w={6} h={1} />
      <Pixel x={4} y={3} color={P.deepPurple} w={8} h={1} />
      <Pixel x={5} y={3} color={P.magenta} />
      <Pixel x={10} y={3} color={P.magenta} />
      {/* 额头中央宝石（红） */}
      <Pixel x={7} y={3} color={P.redDark} w={2} h={1} />
      <Pixel x={7} y={4} color={P.red} w={2} h={1} />
      <Pixel x={7} y={4} color={P.redLight} />
      <Pixel x={8} y={4} color={P.white} />
      {/* 头部主体（深紫黑甲胄） */}
      <Pixel x={3} y={4} color={P.purpleDark} w={10} h={1} />
      <Pixel x={3} y={5} color={P.deepPurple} w={10} h={1} />
      <Pixel x={3} y={6} color={P.purpleDark} w={10} h={1} />
      <Pixel x={3} y={7} color={P.deepPurple} w={10} h={1} />
      {/* 眉骨（金） */}
      <Pixel x={3} y={5} color={P.goldDark} />
      <Pixel x={4} y={5} color={P.gold} />
      <Pixel x={11} y={5} color={P.goldDark} />
      <Pixel x={12} y={5} color={P.gold} />
      {/* 左眼眶（深红） */}
      <Pixel x={4} y={6} color={P.dark} w={3} h={1} />
      <Pixel x={4} y={7} color={P.redDark} w={3} h={1} />
      {/* 左眼火焰（红橙黄白） */}
      <Pixel x={5} y={6} color={P.red} />
      <Pixel x={5} y={7} color={P.orange} />
      <Pixel x={5} y={6} color={P.yellow} />
      <Pixel x={5} y={7} color={P.white} />
      {/* 右眼框 */}
      <Pixel x={9} y={6} color={P.dark} w={3} h={1} />
      <Pixel x={9} y={7} color={P.redDark} w={3} h={1} />
      {/* 右眼火焰 */}
      <Pixel x={10} y={6} color={P.red} />
      <Pixel x={10} y={7} color={P.orange} />
      <Pixel x={10} y={6} color={P.yellow} />
      <Pixel x={10} y={7} color={P.white} />
      {/* 鼻孔（黑） */}
      <Pixel x={7} y={8} color={P.dark} />
      <Pixel x={8} y={8} color={P.dark} />
      <Pixel x={7} y={9} color={P.darkMid} />
      <Pixel x={8} y={9} color={P.darkMid} />
      {/* 嘴部（深红） */}
      <Pixel x={4} y={9} color={P.redDark} w={8} h={1} />
      <Pixel x={4} y={10} color={P.dark} w={8} h={1} />
      {/* 獠牙左上（白） */}
      <Pixel x={4} y={10} color={P.white} />
      <Pixel x={4} y={11} color={P.snow} />
      <Pixel x={5} y={10} color={P.silver} />
      {/* 獠牙右上 */}
      <Pixel x={11} y={10} color={P.white} />
      <Pixel x={11} y={11} color={P.snow} />
      <Pixel x={10} y={10} color={P.silver} />
      {/* 獠牙左下（金） */}
      <Pixel x={5} y={11} color={P.gold} />
      <Pixel x={5} y={12} color={P.goldLight} />
      {/* 獠牙右下 */}
      <Pixel x={10} y={11} color={P.gold} />
      <Pixel x={10} y={12} color={P.goldLight} />
      {/* 下颚（紫黑） */}
      <Pixel x={5} y={12} color={P.purpleDark} w={6} h={1} />
      <Pixel x={6} y={13} color={P.deepPurple} w={4} h={1} />
      <Pixel x={7} y={14} color={P.purpleDark} w={2} h={1} />
      {/* 颊侧紫光 */}
      <Pixel x={2} y={5} color={P.purpleLight} />
      <Pixel x={13} y={5} color={P.purpleLight} />
      <Pixel x={2} y={7} color={P.orchid} />
      <Pixel x={13} y={7} color={P.orchid} />
      {/* 顶部能量光点 */}
      <Pixel x={7} y={1} color={P.cyanLight} />
      <Pixel x={8} y={1} color={P.cyan} />
    </PixelSvg>
  );
}

// 炼狱 V3 - 地狱之门（熔岩深渊），黑曜石门框 + 熔岩流 + 火焰 + 符文
export function PurgatoryIconV3({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 门拱外框（黑曜石深紫） */}
      <Pixel x={5} y={0} color={P.dark} w={6} h={1} />
      <Pixel x={4} y={1} color={P.darkMid} w={1} h={1} />
      <Pixel x={11} y={1} color={P.darkMid} w={1} h={1} />
      <Pixel x={3} y={2} color={P.dark} w={1} h={1} />
      <Pixel x={12} y={2} color={P.dark} w={1} h={1} />
      <Pixel x={2} y={3} color={P.darkMid} w={1} h={10} />
      <Pixel x={13} y={3} color={P.darkMid} w={1} h={10} />
      <Pixel x={2} y={13} color={P.dark} w={12} h={1} />
      {/* 门拱内圈（深红） */}
      <Pixel x={5} y={1} color={P.redDark} w={6} h={1} />
      <Pixel x={4} y={2} color={P.redDark} w={1} h={1} />
      <Pixel x={11} y={2} color={P.redDark} w={1} h={1} />
      <Pixel x={3} y={3} color={P.redDark} w={1} h={10} />
      <Pixel x={12} y={3} color={P.redDark} w={1} h={10} />
      <Pixel x={3} y={13} color={P.redDark} w={10} h={1} />
      {/* 门内熔岩（橙红渐变） */}
      <Pixel x={4} y={3} color={P.crimson} w={8} h={1} />
      <Pixel x={4} y={4} color={P.red} w={8} h={1} />
      <Pixel x={4} y={5} color={P.orange} w={8} h={1} />
      <Pixel x={4} y={6} color={P.orangeDark} w={8} h={1} />
      <Pixel x={4} y={7} color={P.red} w={8} h={1} />
      <Pixel x={4} y={8} color={P.crimson} w={8} h={1} />
      <Pixel x={4} y={9} color={P.redDark} w={8} h={1} />
      <Pixel x={4} y={10} color={P.red} w={8} h={1} />
      <Pixel x={4} y={11} color={P.orange} w={8} h={1} />
      <Pixel x={4} y={12} color={P.yellow} w={8} h={1} />
      {/* 熔岩高光（黄白） */}
      <Pixel x={6} y={5} color={P.yellowLight} />
      <Pixel x={9} y={5} color={P.yellowLight} />
      <Pixel x={7} y={8} color={P.yellow} />
      <Pixel x={8} y={8} color={P.yellowLight} />
      <Pixel x={6} y={11} color={P.white} />
      <Pixel x={9} y={11} color={P.white} />
      <Pixel x={7} y={12} color={P.snow} />
      <Pixel x={8} y={12} color={P.snow} />
      {/* 中央熔岩裂缝（白热） */}
      <Pixel x={7} y={3} color={P.white} />
      <Pixel x={8} y={4} color={P.snow} />
      <Pixel x={7} y={6} color={P.yellowLight} />
      <Pixel x={8} y={7} color={P.white} />
      <Pixel x={7} y={9} color={P.yellow} />
      <Pixel x={8} y={10} color={P.yellowLight} />
      {/* 顶部符文（紫） */}
      <Pixel x={7} y={0} color={P.magenta} />
      <Pixel x={8} y={0} color={P.orchid} />
      {/* 两侧符文（金） */}
      <Pixel x={1} y={5} color={P.gold} />
      <Pixel x={14} y={5} color={P.gold} />
      <Pixel x={1} y={9} color={P.goldLight} />
      <Pixel x={14} y={9} color={P.goldLight} />
      {/* 顶部火焰喷射（橙黄） */}
      <Pixel x={6} y={0} color={P.orange} />
      <Pixel x={9} y={0} color={P.amber} />
      {/* 底部熔岩溅射 */}
      <Pixel x={0} y={12} color={P.orange} />
      <Pixel x={15} y={12} color={P.orange} />
      <Pixel x={1} y={13} color={P.red} />
      <Pixel x={14} y={13} color={P.red} />
      <Pixel x={0} y={14} color={P.redDark} />
      <Pixel x={15} y={14} color={P.redDark} />
      {/* 地面 */}
      <Pixel x={0} y={15} color={P.dark} w={16} h={1} />
      <Pixel x={3} y={15} color={P.red} />
      <Pixel x={12} y={15} color={P.red} />
      <Pixel x={7} y={15} color={P.gold} />
      <Pixel x={8} y={15} color={P.goldLight} />
    </PixelSvg>
  );
}

// 材料副本 V3 - 远古魔法宝箱（开启状），金边 + 宝石 + 符文 + 光芒
export function MaterialIconV3({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 顶部光芒（白黄） */}
      <Pixel x={7} y={0} color={P.white} />
      <Pixel x={8} y={0} color={P.snow} />
      <Pixel x={6} y={1} color={P.yellowLight} />
      <Pixel x={9} y={1} color={P.yellowLight} />
      <Pixel x={5} y={2} color={P.goldLight} />
      <Pixel x={10} y={2} color={P.goldLight} />
      {/* 宝箱盖外框（金） */}
      <Pixel x={3} y={3} color={P.goldDark} w={10} h={1} />
      <Pixel x={2} y={4} color={P.gold} w={12} h={1} />
      <Pixel x={2} y={5} color={P.goldLight} w={12} h={1} />
      <Pixel x={2} y={6} color={P.gold} w={12} h={1} />
      {/* 盖内宝石（多色） */}
      <Pixel x={4} y={4} color={P.red} />
      <Pixel x={5} y={4} color={P.redLight} />
      <Pixel x={6} y={4} color={P.orange} />
      <Pixel x={7} y={4} color={P.yellow} />
      <Pixel x={8} y={4} color={P.green} />
      <Pixel x={9} y={4} color={P.cyan} />
      <Pixel x={10} y={4} color={P.blue} />
      <Pixel x={11} y={4} color={P.purple} />
      <Pixel x={4} y={5} color={P.magenta} />
      <Pixel x={5} y={5} color={P.pink} />
      <Pixel x={6} y={5} color={P.gold} />
      <Pixel x={7} y={5} color={P.white} />
      <Pixel x={8} y={5} color={P.snow} />
      <Pixel x={9} y={5} color={P.springGreen} />
      <Pixel x={10} y={5} color={P.lime} />
      <Pixel x={11} y={5} color={P.orchid} />
      {/* 盖下沿（深金） */}
      <Pixel x={2} y={6} color={P.goldDark} w={12} h={1} />
      {/* 锁扣（金+宝石） */}
      <Pixel x={7} y={6} color={P.goldDark} w={2} h={1} />
      <Pixel x={7} y={7} color={P.gold} w={2} h={1} />
      <Pixel x={7} y={7} color={P.red} />
      <Pixel x={8} y={7} color={P.redLight} />
      {/* 宝箱主体外框（金边） */}
      <Pixel x={3} y={7} color={P.goldDark} w={10} h={1} />
      <Pixel x={2} y={8} color={P.gold} w={12} h={1} />
      <Pixel x={2} y={9} color={P.goldLight} w={12} h={1} />
      <Pixel x={2} y={10} color={P.gold} w={12} h={1} />
      <Pixel x={2} y={11} color={P.goldDark} w={12} h={1} />
      {/* 主体内（深棕木纹） */}
      <Pixel x={3} y={8} color={P.brownDark} w={2} h={1} />
      <Pixel x={11} y={8} color={P.brownDark} w={2} h={1} />
      <Pixel x={3} y={9} color={P.brown} w={2} h={1} />
      <Pixel x={11} y={9} color={P.brown} w={2} h={1} />
      <Pixel x={3} y={10} color={P.brownDark} w={2} h={1} />
      <Pixel x={11} y={10} color={P.brownDark} w={2} h={1} />
      {/* 中央符文（紫） */}
      <Pixel x={6} y={9} color={P.purpleDark} />
      <Pixel x={7} y={9} color={P.magenta} />
      <Pixel x={8} y={9} color={P.orchid} />
      <Pixel x={9} y={9} color={P.purpleDark} />
      <Pixel x={7} y={10} color={P.purpleLight} />
      <Pixel x={8} y={10} color={P.purpleLight} />
      {/* 侧面钉（银） */}
      <Pixel x={3} y={8} color={P.silver} />
      <Pixel x={12} y={8} color={P.silver} />
      <Pixel x={3} y={10} color={P.silverDark} />
      <Pixel x={12} y={10} color={P.silverDark} />
      {/* 底座（深棕） */}
      <Pixel x={3} y={12} color={P.brownDark} w={10} h={1} />
      <Pixel x={4} y={13} color={P.brown} w={8} h={1} />
      <Pixel x={5} y={14} color={P.brownDark} w={6} h={1} />
      {/* 底部光点 */}
      <Pixel x={3} y={13} color={P.gold} />
      <Pixel x={12} y={13} color={P.gold} />
      <Pixel x={2} y={14} color={P.cyan} />
      <Pixel x={13} y={14} color={P.cyan} />
      <Pixel x={7} y={15} color={P.magenta} />
      <Pixel x={8} y={15} color={P.orchid} />
      {/* 顶部光点（光芒延伸） */}
      <Pixel x={4} y={1} color={P.cyan} />
      <Pixel x={11} y={1} color={P.pink} />
      <Pixel x={3} y={2} color={P.springGreen} />
      <Pixel x={12} y={2} color={P.lime} />
    </PixelSvg>
  );
}

// ====================================================================================
// === V2 像素艺术风：连续签到 / 在线奖励 / 趣味答题 ===================================
// 保留 V1 SVG 版本，如需回退改回 V1 import 即可
// ====================================================================================

// 趣味答题 V2 - 像素羊皮卷轴 + 金边 + 紫符文 + 红蜡封 + 鹅毛笔
export function QuizIconV2({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 顶部金边 */}
      <Pixel x={3} y={1} color={P.goldDark} w={10} h={1} />
      <Pixel x={2} y={2} color={P.gold} w={12} h={1} />
      <Pixel x={3} y={2} color={P.goldLight} />
      <Pixel x={10} y={2} color={P.goldLight} />
      {/* 卷轴主体（羊皮纸渐变） */}
      <Pixel x={3} y={3} color={P.yellowLight} w={10} h={1} />
      <Pixel x={3} y={4} color={P.yellow} w={10} h={1} />
      <Pixel x={3} y={5} color={P.yellowLight} w={10} h={1} />
      <Pixel x={3} y={6} color={P.yellow} w={10} h={1} />
      <Pixel x={3} y={7} color={P.yellowLight} w={10} h={1} />
      <Pixel x={3} y={8} color={P.yellow} w={10} h={1} />
      <Pixel x={3} y={9} color={P.yellowLight} w={10} h={1} />
      <Pixel x={3} y={10} color={P.yellow} w={10} h={1} />
      <Pixel x={3} y={11} color={P.yellowLight} w={10} h={1} />
      {/* 文字线（棕色墨迹） */}
      <Pixel x={4} y={4} color={P.brownDark} w={4} h={1} />
      <Pixel x={4} y={6} color={P.brownDark} w={6} h={1} />
      <Pixel x={4} y={8} color={P.brownDark} w={3} h={1} />
      <Pixel x={9} y={8} color={P.brownDark} w={2} h={1} />
      <Pixel x={4} y={10} color={P.brownDark} w={5} h={1} />
      {/* 中央问号符文（紫） */}
      <Pixel x={7} y={5} color={P.purpleDark} w={2} h={1} />
      <Pixel x={9} y={5} color={P.magenta} />
      <Pixel x={9} y={6} color={P.orchid} />
      <Pixel x={7} y={6} color={P.purpleLight} />
      <Pixel x={7} y={7} color={P.magenta} w={2} h={1} />
      {/* 底部金边 */}
      <Pixel x={2} y={12} color={P.gold} w={12} h={1} />
      <Pixel x={3} y={12} color={P.goldLight} />
      <Pixel x={10} y={12} color={P.goldLight} />
      <Pixel x={3} y={13} color={P.goldDark} w={10} h={1} />
      {/* 红色蜡封印（中央底部） */}
      <Pixel x={7} y={13} color={P.redDark} w={2} h={1} />
      <Pixel x={6} y={14} color={P.red} w={4} h={1} />
      <Pixel x={7} y={14} color={P.redLight} />
      <Pixel x={8} y={14} color={P.white} />
      <Pixel x={7} y={15} color={P.crimson} w={2} h={1} />
      {/* 鹅毛笔（右上斜放） */}
      <Pixel x={13} y={0} color={P.white} />
      <Pixel x={14} y={1} color={P.silverLight} />
      <Pixel x={15} y={2} color={P.silver} />
      <Pixel x={14} y={2} color={P.silverDark} />
      <Pixel x={12} y={1} color={P.brown} />
      <Pixel x={11} y={2} color={P.brownDark} />
      {/* 两侧流苏（金） */}
      <Pixel x={1} y={4} color={P.goldDark} />
      <Pixel x={1} y={5} color={P.gold} />
      <Pixel x={1} y={6} color={P.goldLight} />
      <Pixel x={1} y={7} color={P.gold} />
      <Pixel x={1} y={8} color={P.goldDark} />
      <Pixel x={14} y={4} color={P.goldDark} />
      <Pixel x={14} y={5} color={P.gold} />
      <Pixel x={14} y={6} color={P.goldLight} />
      <Pixel x={14} y={7} color={P.gold} />
      <Pixel x={14} y={8} color={P.goldDark} />
      {/* 顶部装饰光点 */}
      <Pixel x={5} y={0} color={P.cyan} />
      <Pixel x={10} y={0} color={P.pink} />
      <Pixel x={7} y={0} color={P.gold} />
      <Pixel x={8} y={0} color={P.goldLight} />
    </PixelSvg>
  );
}

// 连续签到 V2 - 像素签到卡 + 金边 + 火焰连击 + 勾选 + 多色日期
export function CheckInIconV2({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 顶部连击火焰（红橙黄） */}
      <Pixel x={6} y={0} color={P.red} />
      <Pixel x={7} y={0} color={P.orange} />
      <Pixel x={8} y={0} color={P.yellow} />
      <Pixel x={9} y={0} color={P.orange} />
      <Pixel x={7} y={1} color={P.yellowLight} />
      <Pixel x={8} y={1} color={P.white} />
      {/* 卡片外框（金） */}
      <Pixel x={2} y={2} color={P.goldDark} w={12} h={1} />
      <Pixel x={2} y={3} color={P.gold} w={12} h={1} />
      <Pixel x={1} y={4} color={P.goldDark} w={1} h={9} />
      <Pixel x={14} y={4} color={P.goldDark} w={1} h={9} />
      <Pixel x={2} y={13} color={P.gold} w={12} h={1} />
      <Pixel x={2} y={14} color={P.goldDark} w={12} h={1} />
      {/* 卡片顶部条（紫渐变） */}
      <Pixel x={2} y={4} color={P.purpleDark} w={12} h={1} />
      <Pixel x={2} y={5} color={P.purple} w={12} h={1} />
      <Pixel x={2} y={6} color={P.purpleLight} w={12} h={1} />
      {/* 标题文字 "签到"（金） */}
      <Pixel x={5} y={5} color={P.gold} />
      <Pixel x={6} y={5} color={P.goldLight} />
      <Pixel x={9} y={5} color={P.gold} />
      <Pixel x={10} y={5} color={P.goldLight} />
      {/* 卡片底色（深） */}
      <Pixel x={2} y={7} color={P.darkMid} w={12} h={1} />
      <Pixel x={2} y={8} color={P.dark} w={12} h={1} />
      <Pixel x={2} y={9} color={P.darkMid} w={12} h={1} />
      <Pixel x={2} y={10} color={P.dark} w={12} h={1} />
      <Pixel x={2} y={11} color={P.darkMid} w={12} h={1} />
      <Pixel x={2} y={12} color={P.dark} w={12} h={1} />
      {/* 7 天日期格（多色） */}
      {/* 第1天 - 已签灰 */}
      <Pixel x={3} y={8} color={P.silverDark} w={2} h={2} />
      <Pixel x={3} y={8} color={P.silver} />
      {/* 第2天 - 已签灰 */}
      <Pixel x={6} y={8} color={P.silverDark} w={2} h={2} />
      <Pixel x={6} y={8} color={P.silver} />
      {/* 第3天 - 今日金高亮 + 勾 */}
      <Pixel x={9} y={8} color={P.goldDark} w={2} h={2} />
      <Pixel x={9} y={8} color={P.gold} />
      <Pixel x={10} y={8} color={P.goldLight} />
      <Pixel x={9} y={9} color={P.goldLight} />
      {/* 第4-7天小格（未来） */}
      <Pixel x={3} y={11} color={P.purpleDark} w={2} h={1} />
      <Pixel x={6} y={11} color={P.purpleDark} w={2} h={1} />
      <Pixel x={9} y={11} color={P.purpleDark} w={2} h={1} />
      <Pixel x={12} y={11} color={P.purpleDark} w={1} h={1} />
      {/* 数字（白） */}
      <Pixel x={3} y={8} color={P.white} />
      <Pixel x={6} y={8} color={P.white} />
      <Pixel x={9} y={8} color={P.red} />
      {/* 今日勾选（亮绿） */}
      <Pixel x={9} y={9} color={P.springGreen} />
      <Pixel x={10} y={10} color={P.springGreen} />
      <Pixel x={11} y={9} color={P.springGreen} />
      {/* 格线 */}
      <Pixel x={5} y={7} color={P.silverDark} w={1} h={6} />
      <Pixel x={8} y={7} color={P.silverDark} w={1} h={6} />
      <Pixel x={11} y={7} color={P.silverDark} w={1} h={6} />
      {/* 底部奖励宝石（多色） */}
      <Pixel x={3} y={12} color={P.cyan} />
      <Pixel x={5} y={12} color={P.magenta} />
      <Pixel x={7} y={12} color={P.lime} />
      <Pixel x={9} y={12} color={P.pink} />
      <Pixel x={11} y={12} color={P.gold} />
      {/* 装饰光点 */}
      <Pixel x={0} y={7} color={P.cyanLight} />
      <Pixel x={15} y={7} color={P.cyanLight} />
      <Pixel x={0} y={11} color={P.goldLight} />
      <Pixel x={15} y={11} color={P.goldLight} />
      {/* 顶部火焰火星 */}
      <Pixel x={4} y={1} color={P.amber} />
      <Pixel x={11} y={1} color={P.tomato} />
      <Pixel x={5} y={2} color={P.redLight} />
      <Pixel x={10} y={2} color={P.orange} />
    </PixelSvg>
  );
}

// 在线奖励 V2 - 像素沙漏 + 金边 + 流沙 + 宝石 + 符文
export function OnlineRewardIconV2({ size, color, active }: IconProps) {
  return (
    <PixelSvg size={size} color={color} active={active}>
      {/* 顶部装饰光点 */}
      <Pixel x={6} y={0} color={P.cyan} />
      <Pixel x={9} y={0} color={P.pink} />
      <Pixel x={7} y={0} color={P.gold} />
      <Pixel x={8} y={0} color={P.goldLight} />
      {/* 沙漏顶框（金） */}
      <Pixel x={3} y={1} color={P.goldDark} w={10} h={1} />
      <Pixel x={3} y={2} color={P.gold} w={10} h={1} />
      <Pixel x={4} y={2} color={P.goldLight} />
      <Pixel x={11} y={2} color={P.goldLight} />
      {/* 玻璃上沿（银） */}
      <Pixel x={4} y={3} color={P.silverDark} w={8} h={1} />
      <Pixel x={4} y={3} color={P.silver} />
      <Pixel x={11} y={3} color={P.silver} />
      {/* 上部沙子（黄橙渐变，堆积状） */}
      <Pixel x={5} y={4} color={P.silverLight} w={6} h={1} />
      <Pixel x={5} y={4} color={P.white} />
      <Pixel x={10} y={4} color={P.white} />
      <Pixel x={5} y={5} color={P.yellow} w={6} h={1} />
      <Pixel x={6} y={5} color={P.yellowLight} />
      <Pixel x={9} y={5} color={P.yellowLight} />
      <Pixel x={6} y={6} color={P.amber} w={4} h={1} />
      <Pixel x={7} y={6} color={P.orange} />
      <Pixel x={8} y={6} color={P.orange} />
      {/* 中部细颈（深） */}
      <Pixel x={7} y={7} color={P.darkMid} />
      <Pixel x={8} y={7} color={P.darkMid} />
      <Pixel x={7} y={8} color={P.dark} />
      <Pixel x={8} y={8} color={P.dark} />
      {/* 流沙（金色，下垂） */}
      <Pixel x={7} y={9} color={P.gold} />
      <Pixel x={8} y={9} color={P.goldLight} />
      {/* 下部沙堆（橙黄渐变） */}
      <Pixel x={6} y={9} color={P.orange} />
      <Pixel x={9} y={9} color={P.orange} />
      <Pixel x={5} y={10} color={P.amber} w={6} h={1} />
      <Pixel x={6} y={10} color={P.yellow} />
      <Pixel x={9} y={10} color={P.yellow} />
      <Pixel x={4} y={11} color={P.yellowLight} w={8} h={1} />
      <Pixel x={5} y={11} color={P.white} />
      <Pixel x={10} y={11} color={P.white} />
      {/* 玻璃下沿（银） */}
      <Pixel x={4} y={12} color={P.silverDark} w={8} h={1} />
      <Pixel x={4} y={12} color={P.silver} />
      <Pixel x={11} y={12} color={P.silver} />
      {/* 沙漏底框（金） */}
      <Pixel x={3} y={13} color={P.gold} w={10} h={1} />
      <Pixel x={4} y={13} color={P.goldLight} />
      <Pixel x={11} y={13} color={P.goldLight} />
      <Pixel x={3} y={14} color={P.goldDark} w={10} h={1} />
      {/* 底座宝石（紫） */}
      <Pixel x={7} y={14} color={P.purpleDark} w={2} h={1} />
      <Pixel x={7} y={14} color={P.magenta} />
      <Pixel x={8} y={14} color={P.orchid} />
      {/* 两侧符文装饰（青） */}
      <Pixel x={1} y={5} color={P.cyan} />
      <Pixel x={1} y={9} color={P.cyanLight} />
      <Pixel x={14} y={5} color={P.cyan} />
      <Pixel x={14} y={9} color={P.cyanLight} />
      {/* 两侧能量流（紫粉） */}
      <Pixel x={0} y={7} color={P.purple} />
      <Pixel x={15} y={7} color={P.pink} />
      {/* 底部光点 */}
      <Pixel x={2} y={15} color={P.gold} />
      <Pixel x={13} y={15} color={P.gold} />
      <Pixel x={7} y={15} color={P.cyan} />
      <Pixel x={8} y={15} color={P.pink} />
      {/* 顶部边角钉 */}
      <Pixel x={3} y={1} color={P.silver} />
      <Pixel x={12} y={1} color={P.silver} />
    </PixelSvg>
  );
}

// 抽奖机 - 跑马灯水果机贴图（突出水果图标 + 跑马灯灯光圈 + 机台，一眼可识别为水果机）
export function LotteryIconV2({ size, color, active }: IconProps) {
  // 8 格水果围圈（顺时针），每格用对应水果 emoji + 颜色，一眼识别
  const cells = [
    { x: 12,   y: 4.5,  emoji: '🍎', c: C.red },        // 0 苹果（上中）
    { x: 17.8, y: 7.0,  emoji: '🍊', c: C.orange },     // 1 橙子（右上）
    { x: 19.5, y: 12,   emoji: '🔔', c: C.gold },       // 2 铃铛（右中）
    { x: 17.8, y: 17.0, emoji: '🍉', c: C.green },      // 3 西瓜（右下）
    { x: 12,   y: 19.5, emoji: '✨', c: C.purple },     // 4 双星（下中）
    { x: 6.2,  y: 17.0, emoji: '7',  c: C.hotPink },    // 5 77（左下）
    { x: 4.5,  y: 12,   emoji: 'BAR',c: C.cyan },       // 6 BAR（左中）
    { x: 6.2,  y: 7.0,  emoji: '🥭', c: C.yellow },     // 7 芒果（左上）
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}>
      {/* ===== 机台外框（深紫黑圆角，带霓虹边） ===== */}
      <rect x="1.5" y="1.5" width="21" height="21" rx="3" fill={C.dark} opacity="0.88" stroke={C.deepPurple} strokeWidth="0.8" />
      {/* 内圈描边 */}
      <rect x="2.5" y="2.5" width="19" height="19" rx="2.4" fill="none" stroke={C.purple} strokeWidth="0.3" opacity="0.6" />

      {/* ===== 顶部机台标识条 ===== */}
      <rect x="1.5" y="1.5" width="21" height="2.2" rx="1.1" fill={C.deepPurple} opacity="0.75" />
      {/* 顶部三盏跑马灯（左中右，模拟机台顶部灯） */}
      <circle cx="5" cy="2.6" r="0.5" fill={C.cyan} opacity="0.95" />
      <circle cx="12" cy="2.6" r="0.6" fill={C.pink} opacity="0.95" />
      <circle cx="19" cy="2.6" r="0.5" fill={C.cyan} opacity="0.95" />

      {/* ===== 跑马灯灯光轨迹圆环（虚线，暗示跑动方向） ===== */}
      <circle cx="12" cy="12" r="8" fill="none" stroke={C.cyan} strokeWidth="0.5" strokeDasharray="1 1.4" opacity="0.6" />
      {/* 外圈光晕 */}
      <circle cx="12" cy="12" r="8" fill="none" stroke={C.cyan} strokeWidth="1.5" opacity="0.15" />

      {/* ===== 8 格水果围圈（每格：彩色圆底 + 水果 emoji，一眼识别水果机） ===== */}
      {cells.map((cell, i) => {
        // 模拟跑马灯：第 2 格（西瓜）高亮发光
        const isLit = i === 3;
        return (
          <g key={i}>
            {/* 彩色圆底 */}
            <circle
              cx={cell.x} cy={cell.y} r="2"
              fill={cell.c}
              opacity={isLit ? 0.95 : 0.55}
              stroke={isLit ? C.white : cell.c}
              strokeWidth={isLit ? 0.5 : 0.2}
            />
            {/* 高亮格光晕 */}
            {isLit && (
              <circle cx={cell.x} cy={cell.y} r="2.8" fill="none" stroke={cell.c} strokeWidth="0.4" opacity="0.85" />
            )}
            {/* 水果 emoji */}
            <text
              x={cell.x} y={cell.y + 0.7}
              fontSize={cell.emoji === 'BAR' ? '1.6' : cell.emoji === '7' ? '2' : '2'}
              fill={cell.emoji === 'BAR' ? C.dark : cell.emoji === '7' ? C.dark : C.white}
              stroke="none"
              textAnchor="middle"
              fontFamily={cell.emoji === 'BAR' || cell.emoji === '7' ? 'monospace' : undefined}
              fontWeight="900"
            >{cell.emoji}</text>
          </g>
        );
      })}

      {/* ===== 中央显示区：中奖标记（金色星形） ===== */}
      <circle cx="12" cy="12" r="2.4" fill={C.dark} stroke={C.gold} strokeWidth="0.6" />
      <path
        d="M12 10.2 L12.5 11.4 L13.8 11.5 L12.8 12.3 L13.1 13.6 L12 12.9 L10.9 13.6 L11.2 12.3 L10.2 11.5 L11.5 11.4 Z"
        fill={C.gold}
        stroke="none"
      />

      {/* ===== 四角霓虹装饰点 ===== */}
      <circle cx="3" cy="3" r="0.4" fill={C.pink} opacity="0.9" />
      <circle cx="21" cy="3" r="0.4" fill={C.cyan} opacity="0.9" />
      <circle cx="3" cy="21" r="0.4" fill={C.cyan} opacity="0.9" />
      <circle cx="21" cy="21" r="0.4" fill={C.pink} opacity="0.9" />
    </svg>
  );
}

// 赛马 - 末世科技风马头（真实马头轮廓：长脸、大眼、尖耳、飘逸鬃毛）
export function HorseRacingIconV2({ size, color, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}>
      <defs>
        <linearGradient id="hr-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="50%" stopColor={C.deepPurple} stopOpacity="0.75" />
          <stop offset="100%" stopColor={C.dark} stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* ===== 马鬃毛（在头部后方，先画） ===== */}
      <path d="M7 7 Q5 5 4 8 Q3 11 5 13 Q3 14 4 16 Q5 17 6 16" fill="none" stroke={C.pink} strokeWidth="0.8" opacity="0.85" strokeLinecap="round" />
      <path d="M8 6 Q6 4 5 7 Q4 10 6 12" fill="none" stroke={C.purple} strokeWidth="0.6" opacity="0.7" strokeLinecap="round" />
      <path d="M9 5.5 Q7.5 4 7 6" fill="none" stroke={C.cyan} strokeWidth="0.45" opacity="0.55" strokeLinecap="round" />

      {/* ===== 马头主体（面朝右，长脸特征） ===== */}
      <path
        d="M8 6 Q6 7 6 10 L6 13 Q6 15 8 16 Q11 17 14 17 L17 17 Q19 16 20 14 Q21 12 20 10 Q19 7 17 6 L14 5 Q11 4 8 6 Z"
        fill="url(#hr-head)"
        stroke={color}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* ===== 鼻部（长脸下半部分，向前延伸） ===== */}
      <path
        d="M14 13 Q17 13 19 14 Q20 15 19 16 Q17 17 14 16 Z"
        fill={C.dark}
        stroke={color}
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* 鼻孔 */}
      <ellipse cx="17.5" cy="15" rx="0.4" ry="0.6" fill={C.pink} opacity="0.85" />

      {/* ===== 马耳（尖耳，竖起） ===== */}
      <path d="M8 6 L7 3 L9.5 5 Z" fill="url(#hr-head)" stroke={color} strokeWidth="0.5" strokeLinejoin="round" />
      {/* 耳内（深色） */}
      <path d="M8 5.5 L7.8 4 L9 4.8 Z" fill={C.dark} opacity="0.8" />

      {/* ===== 马眼（大而明亮） ===== */}
      <ellipse cx="13" cy="9" rx="1" ry="0.8" fill={C.cyan} opacity="0.95" />
      <ellipse cx="13.2" cy="8.8" rx="0.4" ry="0.35" fill={C.white} opacity="0.9" />
      <circle cx="13" cy="9" r="0.3" fill={C.dark} />

      {/* ===== 面部能量纹路（科技装饰） ===== */}
      <path d="M9 10 L12 11" fill="none" stroke={C.cyan} strokeWidth="0.3" opacity="0.5" strokeLinecap="round" />
      <path d="M9 12 L13 12.5" fill="none" stroke={C.purple} strokeWidth="0.25" opacity="0.4" strokeLinecap="round" />

      {/* ===== 底座光晕 ===== */}
      <ellipse cx="13" cy="19" rx="6" ry="0.8" fill={color} opacity="0.15" />
    </svg>
  );
}

export function MerchantIconV2({ size, color, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', filter: `drop-shadow(0 0 ${active ? 4 : 2}px ${color})` }}>
      {/* ===== 背板：六边形科技底板（深紫黑） ===== */}
      <path
        d="M12 1.5 L21 6.5 L21 17.5 L12 22.5 L3 17.5 L3 6.5 Z"
        fill={C.dark}
        opacity="0.9"
        stroke={C.deepPurple}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* 底板内圈描边（霓虹紫） */}
      <path
        d="M12 3 L19.5 7.2 L19.5 16.8 L12 21 L4.5 16.8 L4.5 7.2 Z"
        fill="none"
        stroke={C.purple}
        strokeWidth="0.4"
        opacity="0.7"
      />

      {/* ===== 商人头盔（未来战士风格，流线型深紫黑盔体） ===== */}
      {/* 头盔外轮廓（流线型） */}
      <path
        d="M12 4.5 L8 6 L8 10.5 C8 13 9.5 14.8 12 15.8 C14.5 14.8 16 13 16 10.5 L16 6 Z"
        fill={C.dark}
        stroke={C.cyan}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* 头盔顶部金色中分线 */}
      <path d="M12 4.5 L12 9" stroke={C.gold} strokeWidth="0.6" opacity="0.9" />
      {/* 双能量天线（左右斜上） */}
      <line x1="9" y1="5" x2="7.5" y2="3" stroke={C.cyan} strokeWidth="0.5" />
      <circle cx="7.5" cy="3" r="0.5" fill={C.cyan} stroke="none" />
      <line x1="15" y1="5" x2="16.5" y2="3" stroke={C.pink} strokeWidth="0.5" />
      <circle cx="16.5" cy="3" r="0.5" fill={C.pink} stroke="none" />
      {/* V形全息 visor（青色发光） */}
      <path d="M9 9.5 L12 11 L15 9.5" fill="none" stroke={C.cyan} strokeWidth="0.7" opacity="0.95" />
      {/* V形倾斜发光眼（粉色） */}
      <path d="M9.8 10 L11 10.5 L10.2 10.8 Z" fill={C.pink} stroke="none" />
      <path d="M14.2 10 L13 10.5 L13.8 10.8 Z" fill={C.pink} stroke="none" />
      {/* 散热栅格嘴部（金色横纹） */}
      <line x1="11" y1="13" x2="13" y2="13" stroke={C.gold} strokeWidth="0.4" opacity="0.8" />
      <line x1="10.8" y1="13.6" x2="13.2" y2="13.6" stroke={C.gold} strokeWidth="0.4" opacity="0.6" />
      {/* 面颊能量纹路（紫色） */}
      <path d="M8.5 11 L9 12.5" stroke={C.purple} strokeWidth="0.4" opacity="0.7" />
      <path d="M15.5 11 L15 12.5" stroke={C.purple} strokeWidth="0.4" opacity="0.7" />

      {/* ===== 颈部 + 装备展示台 ===== */}
      <path d="M10.5 15.8 L10.5 17 L13.5 17 L13.5 15.8" fill={C.dark} stroke={C.purple} strokeWidth="0.4" />

      {/* 装备展示台（科技底座，金色边） */}
      <rect x="6" y="17" width="12" height="3.2" rx="0.6" fill={C.deepPurple} opacity="0.6" stroke={C.gold} strokeWidth="0.5" />
      {/* 底座散热栅格 */}
      <line x1="7" y1="18" x2="17" y2="18" stroke={C.cyan} strokeWidth="0.3" opacity="0.5" />
      <line x1="7" y1="18.8" x2="17" y2="18.8" stroke={C.cyan} strokeWidth="0.3" opacity="0.4" />

      {/* ===== 展示装备：中央悬浮武器（青色能量剑） ===== */}
      {/* 剑柄 */}
      <rect x="11.6" y="13.5" width="0.8" height="2" fill={C.gold} />
      {/* 剑格 */}
      <line x1="10.8" y1="13.8" x2="13.2" y2="13.8" stroke={C.gold} strokeWidth="0.5" />
      {/* 剑刃（青色发光，双刃流线型） */}
      <path
        d="M12 8 L12.5 9 L12.3 13.5 L11.7 13.5 L11.5 9 Z"
        fill={C.cyan}
        opacity="0.95"
        stroke={C.white}
        strokeWidth="0.2"
      />
      {/* 剑刃能量光晕 */}
      <path d="M12 8 L12 13.5" stroke={C.cyan} strokeWidth="1.5" opacity="0.25" />

      {/* ===== 左侧悬浮装备：护肩（紫粉色） ===== */}
      <g>
        {/* 护肩主体（单侧流线型） */}
        <path
          d="M5 11 Q4.5 12.5 5.5 14 L7 14 L7 12 Z"
          fill={C.deepPurple}
          opacity="0.85"
          stroke={C.purple}
          strokeWidth="0.4"
        />
        {/* 护肩能量纹 */}
        <line x1="5.2" y1="12" x2="6.8" y2="12" stroke={C.pink} strokeWidth="0.3" opacity="0.9" />
        <line x1="5.4" y1="13" x2="6.8" y2="13" stroke={C.cyan} strokeWidth="0.3" opacity="0.7" />
      </g>

      {/* ===== 右侧悬浮装备：头盔/盾（粉色，对称呼应） ===== */}
      <g>
        <path
          d="M19 11 Q19.5 12.5 18.5 14 L17 14 L17 12 Z"
          fill={C.deepPurple}
          opacity="0.85"
          stroke={C.pink}
          strokeWidth="0.4"
        />
        <line x1="17.2" y1="12" x2="18.8" y2="12" stroke={C.cyan} strokeWidth="0.3" opacity="0.9" />
        <line x1="17.2" y1="13" x2="18.6" y2="13" stroke={C.gold} strokeWidth="0.3" opacity="0.7" />
      </g>

      {/* ===== 金币装饰（左右底座角，呼应"商人"身份） ===== */}
      {/* 左金币 */}
      <circle cx="7" cy="20.2" r="1.1" fill={C.gold} opacity="0.95" stroke={C.amber} strokeWidth="0.3" />
      <text x="7" y="20.7" fontSize="1.4" fill={C.dark} stroke="none" textAnchor="middle" fontFamily="monospace" fontWeight="900">$</text>
      {/* 右金币 */}
      <circle cx="17" cy="20.2" r="1.1" fill={C.gold} opacity="0.95" stroke={C.amber} strokeWidth="0.3" />
      <text x="17" y="20.7" fontSize="1.4" fill={C.dark} stroke="none" textAnchor="middle" fontFamily="monospace" fontWeight="900">$</text>

      {/* ===== 全息扫描线（背景科技纹，非常淡） ===== */}
      <line x1="4.5" y1="7" x2="19.5" y2="7" stroke={C.cyan} strokeWidth="0.2" opacity="0.3" strokeDasharray="2 3" />
      <line x1="4.5" y1="19" x2="19.5" y2="19" stroke={C.pink} strokeWidth="0.2" opacity="0.3" strokeDasharray="2 3" />

      {/* 四角霓虹装饰点 */}
      <circle cx="4.2" cy="6.8" r="0.4" fill={C.cyan} opacity="0.9" />
      <circle cx="19.8" cy="6.8" r="0.4" fill={C.pink} opacity="0.9" />
      <circle cx="4.2" cy="17.2" r="0.4" fill={C.pink} opacity="0.9" />
      <circle cx="19.8" cy="17.2" r="0.4" fill={C.cyan} opacity="0.9" />
    </svg>
  );
}
