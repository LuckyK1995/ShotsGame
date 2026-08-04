import { GAME_MODE_CONFIGS, type GameMode } from '../game/data/gameModes';
import { ModalHudBackground } from './ModalHudBackground';
import { neonCyan } from '../theme/colors';

interface ModeIntroModalProps {
  mode: GameMode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ModeIntroModal({ mode, onConfirm, onCancel }: ModeIntroModalProps) {
  const config = GAME_MODE_CONFIGS[mode];
  if (!config) return null;

  const color = config.color;

  const neonText: React.CSSProperties = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 700,
    letterSpacing: '1px',
  };

  // 模式图标 emoji 映射
  const iconMap: Record<string, string> = {
    worldboss: '👹',
    purgatory: '🔥',
    daily: '📋',
    material: '⛏️',
    mirror: '🪞',
    guard: '🛡️',
    homedefense: '🏰',
  };
  const emoji = iconMap[mode] || '⚔️';

  // 附加信息（每日次数、难度等）
  const extras: string[] = [];
  if (config.dailyLimit) {
    extras.push(`每日 ${config.dailyLimit} 次挑战机会`);
  }
  if (config.hasDifficulty) {
    extras.push('可选难度：简单/普通/困难/噩梦');
  }

  return (
    <>
      {/* 外层定位容器 */}
      <div className="absolute inset-0 z-[90]" />
      {/* 遮罩层：点击关闭 */}
      <div
        className="absolute inset-0 flex items-center justify-center z-[90]"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onCancel}
      >
        {/* 内容容器：阻止冒泡 */}
        <div
          className="relative p-5"
          style={{
            width: '260px',
            background: 'rgba(19, 16, 37, 0.95)',
            border: `1px solid ${color}40`,
            borderRadius: '14px',
            boxShadow: `0 0 30px ${color}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
            backdropFilter: 'blur(12px)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HUD 背景：纹路与颜色与按钮区不同 */}
          <ModalHudBackground accentColor={color} accentColor2={neonCyan} />
          <div className="relative" style={{ zIndex: 1 }}>
            {/* 图标 + 标题 */}
            <div className="flex flex-col items-center mb-3">
              <div
                className="mb-2"
                style={{
                  filter: `drop-shadow(0 0 8px ${color}80)`,
                  fontSize: '32px',
                  lineHeight: 1,
                }}
              >
                {emoji}
              </div>
              <h2
                style={{
                  ...neonText,
                  fontSize: '15px',
                  color,
                  textShadow: `0 0 8px ${color}60`,
                }}
              >
                {config.name}
              </h2>
              <p style={{ ...neonText, fontSize: '8px', color: '#8B80A0', marginTop: '4px', letterSpacing: '0.5px' }}>
                {config.description}
              </p>
            </div>

            {/* 分隔线 */}
            <div
              style={{
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
                margin: '0 0 12px',
              }}
            />

            {/* 模式介绍 */}
            <div
              style={{
                ...neonText,
                fontSize: '9px',
                color: '#C0C0D0',
                lineHeight: 1.6,
                letterSpacing: '0.3px',
                fontWeight: 500,
                marginBottom: extras.length > 0 ? '10px' : '16px',
                textAlign: 'left',
              }}
            >
              {config.fullDescription}
            </div>

            {/* 附加信息 */}
            {extras.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                {extras.map((info, i) => (
                  <div
                    key={i}
                    style={{
                      ...neonText,
                      fontSize: '8px',
                      color: color,
                      background: `${color}12`,
                      border: `1px solid ${color}30`,
                      borderRadius: '4px',
                      padding: '3px 8px',
                      marginBottom: '4px',
                      textAlign: 'center',
                    }}
                  >
                    {info}
                  </div>
                ))}
              </div>
            )}

            {/* 按钮 */}
            <div className="flex gap-2.5">
              <button
                style={{
                  flex: 1,
                  background: `${color}26`,
                  border: `1px solid ${color}80`,
                  borderRadius: '8px',
                  ...neonText,
                  fontSize: '11px',
                  color,
                  boxShadow: `0 0 10px ${color}33`,
                  padding: '8px 0',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${color}47`;
                  e.currentTarget.style.boxShadow = `0 0 16px ${color}73`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${color}26`;
                  e.currentTarget.style.boxShadow = `0 0 10px ${color}33`;
                }}
                onClick={onConfirm}
              >
                进入
              </button>
              <button
                style={{
                  flex: 1,
                  background: 'rgba(100, 100, 130, 0.15)',
                  border: '1px solid rgba(150, 150, 180, 0.35)',
                  borderRadius: '8px',
                  ...neonText,
                  fontSize: '11px',
                  color: '#A0A0B8',
                  padding: '8px 0',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 100, 130, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 100, 130, 0.15)';
                }}
                onClick={onCancel}
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
