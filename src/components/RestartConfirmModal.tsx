import { neonCyan, neonPurple, neonRed } from '../theme/colors';

interface RestartConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function RestartConfirmModal({ onConfirm, onCancel }: RestartConfirmModalProps) {
  const neonText: React.CSSProperties = {
    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
    fontWeight: 700,
    letterSpacing: '1px',
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-[90]"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="relative p-5"
        style={{
          width: '260px',
          background: 'rgba(19, 16, 37, 0.95)',
          border: `1px solid ${neonCyan}40`,
          borderRadius: '14px',
          boxShadow: `0 0 30px ${neonCyan}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 图标 */}
        <div className="flex flex-col items-center mb-4">
          <div
            className="mb-2"
            style={{
              filter: `drop-shadow(0 0 8px ${neonCyan}80)`,
              fontSize: '28px',
              lineHeight: 1,
            }}
          >
            ⟳
          </div>
          <h2
            style={{
              ...neonText,
              fontSize: '14px',
              color: neonCyan,
              textShadow: `0 0 8px ${neonCyan}60`,
            }}
          >
            是否重新挑战？
          </h2>
          <p style={{ ...neonText, fontSize: '8px', color: '#8B80A0', marginTop: '4px', letterSpacing: '0.5px' }}>
            将重置当前波次，保留所有装备与等级
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex gap-2.5">
          <button
            style={{
              flex: 1,
              background: 'rgba(0, 245, 212, 0.15)',
              border: `1px solid ${neonCyan}50`,
              borderRadius: '8px',
              ...neonText,
              fontSize: '11px',
              color: neonCyan,
              boxShadow: `0 0 10px ${neonCyan}20`,
              padding: '8px 0',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 245, 212, 0.28)';
              e.currentTarget.style.boxShadow = `0 0 16px ${neonCyan}45`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 245, 212, 0.15)';
              e.currentTarget.style.boxShadow = `0 0 10px ${neonCyan}20`;
            }}
            onClick={onConfirm}
          >
            确定
          </button>
          <button
            style={{
              flex: 1,
              background: 'rgba(100, 100, 130, 0.15)',
              border: `1px solid rgba(150, 150, 180, 0.35)`,
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
  );
}
