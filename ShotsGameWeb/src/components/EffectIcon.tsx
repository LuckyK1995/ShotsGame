// 状态效果贴图图标（SVG）—— 用于 Boss 血条下方显示 buff/debuff
// 末世科技风：圆角方框 + 状态对应主色 + 内部精致贴图图案 + 倒计时
// 用法：<EffectIcon type="burn" remaining={2.3} duration={3} kind="debuff" />

interface EffectIconProps {
  type: string;          // 效果类型，如 'burn'/'poison'/'freeze'/'lightning'/'slow'/'curse'/'stun'/'enrage_1'/'charge'/'summon'
  remaining: number;     // 剩余秒数（用于倒计时数字）
  duration: number;      // 总持续秒数（用于进度环）
  kind: 'buff' | 'debuff';
  size?: number;         // 图标尺寸，默认 22
}

// 颜色调色板（与 ButtonIcons 风格一致）
const C = {
  white: '#FFFFFF', gold: '#FFD700', dark: '#0A0814',
  red: '#FF4757', orange: '#FF8C42', yellow: '#FFD93D',
  green: '#2ECC71', cyan: '#00F5D4', blue: '#4FACFE',
  purple: '#9B59B6', deepPurple: '#8A2BE2', pink: '#FF69B4',
  hotPink: '#FF1493', silver: '#C0C0C0',
};

// 类型 → 主色映射
const TYPE_COLOR: Record<string, string> = {
  // debuff
  burn: C.orange, poison: C.green, freeze: C.cyan, lightning: C.yellow,
  slow: C.blue, curse: C.purple, stun: C.gold,
  // buff
  enrage_1: '#FF6B35', enrage_2: '#FF2200', enrage_3: '#FF0044',
  charge: C.gold, summon: C.purple,
};

// 内部贴图绘制（每种状态独立 SVG 子组件，末世科技风）
function EffectGlyph({ type, color }: { type: string; color: string }) {
  switch (type) {
    // ===== Debuff =====
    case 'burn':
      // 火焰：三层跳动火舌 + 内焰 + 火星
      return (
        <g>
          <path d="M12 4 C13 7 15 8 14.5 11 C16 10 16 7 16 7 C17 10 17 13 12 17 C7 13 7 10 8 7 C8 7 8 10 9.5 11 C9 8 11 7 12 4 Z" fill={color} opacity="0.85" />
          <path d="M12 8 C12.5 10 13.5 10.5 13 12 C14 11.5 14 10 14 10 C14.5 12 14 14 12 15 C10 14 9.5 12 10 10 C10 10 10 11.5 11 12 C10.5 10.5 11.5 10 12 8 Z" fill={C.yellow} opacity="0.95" />
          <circle cx="12" cy="12.5" r="1.2" fill={C.white} opacity="0.9" />
        </g>
      );
    case 'poison':
      // 毒 skull：圆头 + 两个眼眶 + 鼻孔 + 滴落毒液
      return (
        <g>
          <path d="M12 4 C8 4 6 7 6 11 C6 13 7 14.5 8 15.5 L8 18 L10 17 L10 18 L14 18 L14 17 L16 18 L16 15.5 C17 14.5 18 13 18 11 C18 7 16 4 12 4 Z" fill={color} opacity="0.85" stroke={C.dark} strokeWidth="0.4" />
          <ellipse cx="9.5" cy="11" rx="1.6" ry="1.8" fill={C.dark} />
          <ellipse cx="14.5" cy="11" rx="1.6" ry="1.8" fill={C.dark} />
          <path d="M11 14 L11 15.5 L13 15.5 L13 14 Z" fill={C.dark} />
          <circle cx="12" cy="20" r="0.8" fill={color} opacity="0.7" />
          <circle cx="9" cy="21" r="0.5" fill={color} opacity="0.5" />
          <circle cx="15" cy="21" r="0.5" fill={color} opacity="0.5" />
        </g>
      );
    case 'freeze':
      // 冰晶：六角雪花 + 中心光点 + 冰刺
      return (
        <g>
          <path d="M12 3 L12 21 M3 12 L21 12 M5.5 5.5 L18.5 18.5 M18.5 5.5 L5.5 18.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M12 3 L10 5.5 L14 5.5 Z M12 21 L10 18.5 L14 18.5 Z M3 12 L5.5 10 L5.5 14 Z M21 12 L18.5 10 L18.5 14 Z" fill={color} />
          <circle cx="12" cy="12" r="2" fill={C.white} opacity="0.95" />
          <circle cx="12" cy="12" r="1" fill={color} />
        </g>
      );
    case 'lightning':
      // 闪电：折线 + 主电量符号 + 火花
      return (
        <g>
          <path d="M13 2 L6 13 L11 13 L9 22 L18 9 L13 9 L15 2 Z" fill={color} stroke={C.dark} strokeWidth="0.5" strokeLinejoin="round" />
          <path d="M13 4 L8 12 L11 12 L10 19 L16 10 L13 10 L14 4 Z" fill={C.yellow} opacity="0.6" />
          <circle cx="5" cy="5" r="0.8" fill={color} />
          <circle cx="19" cy="19" r="0.8" fill={color} />
          <circle cx="19" cy="6" r="0.6" fill={C.yellow} />
        </g>
      );
    case 'slow':
      // 减速：蜗牛壳螺旋 + 时钟指针
      return (
        <g>
          <circle cx="12" cy="12" r="7" fill="none" stroke={color} strokeWidth="1.4" />
          <path d="M12 12 L12 7 M12 12 L15 14" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1" fill={color} />
          <path d="M9 9 C9 11 11 12 12 11 C13 10 13 8 11 8" fill="none" stroke={color} strokeWidth="0.8" opacity="0.7" />
          <circle cx="6" cy="6" r="0.8" fill={color} opacity="0.6" />
          <circle cx="18" cy="18" r="0.8" fill={color} opacity="0.6" />
        </g>
      );
    case 'curse':
      // 诅咒：古老符文卷轴 + 紫色符号
      return (
        <g>
          <rect x="6" y="4" width="12" height="16" rx="1" fill={color} opacity="0.85" stroke={C.dark} strokeWidth="0.5" />
          <path d="M9 8 L15 8 M9 11 L15 11 M9 14 L13 14" stroke={C.white} strokeWidth="0.8" opacity="0.9" />
          <path d="M12 6 L13 7 L12 8 L11 7 Z" fill={C.yellow} />
          <circle cx="12" cy="17" r="1.2" fill={C.white} opacity="0.8" />
          <path d="M11 17 L13 17 M12 16 L12 18" stroke={color} strokeWidth="0.5" />
        </g>
      );
    case 'stun':
      // 眩晕：3颗旋转星星 + 漩涡纹
      return (
        <g>
          <path d="M12 4 L13 7 L16 7.5 L13.5 9.5 L14 12.5 L12 11 L10 12.5 L10.5 9.5 L8 7.5 L11 7 Z" fill={color} stroke={C.dark} strokeWidth="0.4" />
          <circle cx="6" cy="7" r="1.2" fill={color} opacity="0.7" />
          <circle cx="18" cy="7" r="1.2" fill={color} opacity="0.7" />
          <circle cx="6" cy="17" r="1.2" fill={color} opacity="0.7" />
          <circle cx="18" cy="17" r="1.2" fill={color} opacity="0.7" />
          <path d="M9 16 Q12 18 15 16" stroke={color} strokeWidth="0.8" fill="none" opacity="0.6" />
        </g>
      );

    // ===== Buff =====
    case 'enrage_1':
    case 'enrage_2':
    case 'enrage_3': {
      // 狂暴：怒吼怪兽面具 + 红色能量
      const c = TYPE_COLOR[type] || color;
      return (
        <g>
          <path d="M12 3 L5 6 L5 12 C5 16 8 19 12 21 C16 19 19 16 19 12 L19 6 Z" fill={c} opacity="0.85" stroke={C.dark} strokeWidth="0.5" />
          <path d="M8 9 L10 11 L8 13 Z" fill={C.dark} />
          <path d="M16 9 L14 11 L16 13 Z" fill={C.dark} />
          <path d="M9 15 L12 17 L15 15 L14 16 L12 16.5 L10 16 Z" fill={C.dark} />
          <path d="M12 5 L12 8" stroke={C.yellow} strokeWidth="0.8" />
          <path d="M6 5 L4 3 M18 5 L20 3" stroke={c} strokeWidth="0.8" />
        </g>
      );
    }
    case 'charge':
      // 冲锋：箭头 + 速度线
      return (
        <g>
          <path d="M4 12 L14 12 L11 8 L20 12 L11 16 L14 12 Z" fill={color} stroke={C.dark} strokeWidth="0.5" strokeLinejoin="round" />
          <path d="M2 8 L5 8 M2 12 L4 12 M2 16 L5 16" stroke={color} strokeWidth="1" opacity="0.7" strokeLinecap="round" />
          <circle cx="14" cy="12" r="1.5" fill={C.white} opacity="0.8" />
        </g>
      );
    case 'summon':
      // 召唤：六芒星 + 中心能量核
      return (
        <g>
          <path d="M12 3 L20 18 L4 18 Z" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M12 21 L4 6 L20 6 Z" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="2.5" fill={color} opacity="0.9" />
          <circle cx="12" cy="12" r="1.2" fill={C.white} opacity="0.8" />
          <circle cx="12" cy="3" r="0.8" fill={color} />
          <circle cx="20" cy="18" r="0.8" fill={color} />
          <circle cx="4" cy="18" r="0.8" fill={color} />
        </g>
      );
    default:
      return <circle cx="12" cy="12" r="6" fill={color} opacity="0.7" />;
  }
}

export function EffectIcon({ type, remaining, duration, kind, size = 22 }: EffectIconProps) {
  const color = TYPE_COLOR[type] || (kind === 'buff' ? C.gold : C.pink);
  const isBuff = kind === 'buff';
  const borderColor = isBuff ? C.gold : color;
  const bgColor = isBuff ? 'rgba(60, 30, 10, 0.85)' : 'rgba(20, 10, 30, 0.85)';
  // 倒计时进度环
  const progress = duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 1;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      title={`${type} ${remaining.toFixed(1)}s`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* 背板：圆角方框 + 状态色边 */}
        <rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill={bgColor} stroke={borderColor} strokeWidth="1.2" />
        {/* 内圈描边 */}
        <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="2.8" fill="none" stroke={borderColor} strokeWidth="0.3" opacity="0.5" />

        {/* 贴图主体 */}
        <EffectGlyph type={type} color={color} />

        {/* 倒计时进度环（圆形，沿边框走） */}
        <circle
          cx="12" cy="12" r={radius}
          fill="none"
          stroke={borderColor}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 12 12)"
          opacity="0.95"
        />
      </svg>
      {/* 倒计时数字（叠在右下角） */}
      <span
        style={{
          position: 'absolute',
          right: '-1px',
          bottom: '-1px',
          fontSize: '8px',
          fontFamily: '"Rajdhani","Orbitron",monospace',
          fontWeight: 700,
          color: C.white,
          background: 'rgba(0,0,0,0.7)',
          padding: '0 2px',
          borderRadius: '2px',
          lineHeight: 1,
          textShadow: `0 0 2px ${color}`,
          pointerEvents: 'none',
        }}
      >
        {remaining > 99 ? '∞' : remaining.toFixed(1)}
      </span>
    </div>
  );
}
