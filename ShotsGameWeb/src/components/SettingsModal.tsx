import { useState, useEffect } from 'react';
import { neonCyan, neonPurple, neonPink, neonRed, neonGreen } from '../theme/colors';
import { ModalHudBackground } from './ModalHudBackground';
import { useAuthStore } from '../store/authStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const neonText: React.CSSProperties = {
  fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
  fontWeight: 700,
  letterSpacing: '1px',
};

const STORAGE_KEYS = {
  sfx: 'shots_sfx_enabled',
  music: 'shots_music_enabled',
  quality: 'shots_quality',
};

type Quality = 'high' | 'medium' | 'low';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const logout = useAuthStore(s => s.logout);
  const profile = useAuthStore(s => s.profile);
  const [sfxOn, setSfxOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [quality, setQuality] = useState<Quality>('high');
  const [confirmLogout, setConfirmLogout] = useState(false);

  // 加载本地设置
  useEffect(() => {
    const sfx = localStorage.getItem(STORAGE_KEYS.sfx);
    const music = localStorage.getItem(STORAGE_KEYS.music);
    const q = localStorage.getItem(STORAGE_KEYS.quality) as Quality | null;
    if (sfx !== null) setSfxOn(sfx === '1');
    if (music !== null) setMusicOn(music === '1');
    if (q) setQuality(q);
  }, []);

  const toggleSfx = () => {
    const v = !sfxOn;
    setSfxOn(v);
    localStorage.setItem(STORAGE_KEYS.sfx, v ? '1' : '0');
  };
  const toggleMusic = () => {
    const v = !musicOn;
    setMusicOn(v);
    localStorage.setItem(STORAGE_KEYS.music, v ? '1' : '0');
  };
  const changeQuality = (q: Quality) => {
    setQuality(q);
    localStorage.setItem(STORAGE_KEYS.quality, q);
  };

  const handleLogout = async () => {
    await logout();
    // logout 后 authStore.status 变为 unauthenticated，App 会自动切换到 AuthPanel
    onClose();
  };

  if (!isOpen) return null;

  // 退出登录二次确认
  if (confirmLogout) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center z-[95]"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={() => setConfirmLogout(false)}
      >
        <div
          className="relative p-5"
          style={{
            width: '260px',
            background: 'rgba(19, 16, 37, 0.95)',
            border: `1px solid ${neonRed}50`,
            borderRadius: '14px',
            boxShadow: `0 0 30px ${neonRed}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
            backdropFilter: 'blur(12px)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHudBackground accentColor={neonRed} accentColor2={neonPurple} />
          <div className="relative" style={{ zIndex: 1 }}>
            <div className="flex flex-col items-center mb-4">
              <div className="mb-2" style={{ filter: `drop-shadow(0 0 8px ${neonRed}80)`, fontSize: '28px', lineHeight: 1 }}>⏻</div>
              <h2 style={{ ...neonText, fontSize: '14px', color: neonRed, textShadow: `0 0 8px ${neonRed}60` }}>
                确认退出登录？
              </h2>
              <p style={{ ...neonText, fontSize: '8px', color: '#8B80A0', marginTop: '4px', letterSpacing: '0.5px' }}>
                将清除当前登录状态，需重新登录
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                style={{
                  flex: 1, background: 'rgba(255, 71, 87, 0.15)', border: `1px solid ${neonRed}50`,
                  borderRadius: '8px', ...neonText, fontSize: '11px', color: neonRed,
                  boxShadow: `0 0 10px ${neonRed}20`, padding: '8px 0', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 71, 87, 0.28)'; e.currentTarget.style.boxShadow = `0 0 16px ${neonRed}45`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 71, 87, 0.15)'; e.currentTarget.style.boxShadow = `0 0 10px ${neonRed}20`; }}
                onClick={handleLogout}
              >
                确认退出
              </button>
              <button
                style={{
                  flex: 1, background: 'rgba(100, 100, 130, 0.15)', border: '1px solid rgba(150, 150, 180, 0.35)',
                  borderRadius: '8px', ...neonText, fontSize: '11px', color: '#A0A0B8', padding: '8px 0', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(100, 100, 130, 0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(100, 100, 130, 0.15)'; }}
                onClick={() => setConfirmLogout(false)}
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 主设置面板
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-[90]"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative p-5"
        style={{
          width: '280px',
          background: 'rgba(19, 16, 37, 0.95)',
          border: `1px solid ${neonPurple}50`,
          borderRadius: '14px',
          boxShadow: `0 0 30px ${neonPurple}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHudBackground accentColor={neonPurple} accentColor2={neonCyan} />
        <div className="relative" style={{ zIndex: 1 }}>
          {/* 标题 */}
          <div className="flex flex-col items-center mb-4">
            <div className="mb-2" style={{ filter: `drop-shadow(0 0 8px ${neonPurple}80)`, fontSize: '24px', lineHeight: 1 }}>⚙</div>
            <h2 style={{ ...neonText, fontSize: '14px', color: neonCyan, textShadow: `0 0 8px ${neonCyan}60` }}>
              设置
            </h2>
            {profile && (
              <p style={{ ...neonText, fontSize: '8px', color: '#8B80A0', marginTop: '4px', letterSpacing: '0.5px' }}>
                ID: {profile.id.slice(0, 8)} · {profile.displayName}
              </p>
            )}
          </div>

          {/* 设置项列表 */}
          <div className="flex flex-col gap-3 mb-4">
            {/* 音效开关 */}
            <SettingRow label="音效" color={neonCyan}>
              <ToggleSwitch on={sfxOn} onChange={toggleSfx} color={neonCyan} />
            </SettingRow>

            {/* 背景音乐开关 */}
            <SettingRow label="背景音乐" color={neonPink}>
              <ToggleSwitch on={musicOn} onChange={toggleMusic} color={neonPink} />
            </SettingRow>

            {/* 画质选择 */}
            <SettingRow label="画面质量" color={neonGreen}>
              <div className="flex gap-1">
                {(['low', 'medium', 'high'] as Quality[]).map(q => (
                  <button
                    key={q}
                    onClick={() => changeQuality(q)}
                    style={{
                      padding: '3px 8px',
                      background: quality === q ? `${neonGreen}25` : 'rgba(100,100,130,0.12)',
                      border: `1px solid ${quality === q ? neonGreen + '60' : 'rgba(100,100,130,0.3)'}`,
                      borderRadius: '4px',
                      ...neonText,
                      fontSize: '9px',
                      color: quality === q ? neonGreen : '#8B80A0',
                      cursor: 'pointer',
                      boxShadow: quality === q ? `0 0 8px ${neonGreen}30` : 'none',
                    }}
                  >
                    {q === 'low' ? '低' : q === 'medium' ? '中' : '高'}
                  </button>
                ))}
              </div>
            </SettingRow>
          </div>

          {/* 分隔线 */}
          <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${neonPurple}40, transparent)`, marginBottom: '12px' }} />

          {/* 退出登录按钮 */}
          <button
            style={{
              width: '100%',
              background: 'rgba(255, 71, 87, 0.12)',
              border: `1px solid ${neonRed}40`,
              borderRadius: '8px',
              ...neonText,
              fontSize: '12px',
              color: neonRed,
              padding: '9px 0',
              cursor: 'pointer',
              boxShadow: `0 0 10px ${neonRed}15`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 71, 87, 0.22)'; e.currentTarget.style.boxShadow = `0 0 16px ${neonRed}35`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 71, 87, 0.12)'; e.currentTarget.style.boxShadow = `0 0 10px ${neonRed}15`; }}
            onClick={() => setConfirmLogout(true)}
          >
            ⏻ 退出登录
          </button>

          {/* 关闭按钮 */}
          <button
            style={{
              width: '100%',
              marginTop: '8px',
              background: 'rgba(100, 100, 130, 0.12)',
              border: '1px solid rgba(150, 150, 180, 0.3)',
              borderRadius: '8px',
              ...neonText,
              fontSize: '11px',
              color: '#A0A0B8',
              padding: '8px 0',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(100, 100, 130, 0.22)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(100, 100, 130, 0.12)'; }}
            onClick={onClose}
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '6px 8px', background: 'rgba(10, 8, 20, 0.5)', borderRadius: '6px', border: `1px solid ${color}20` }}>
      <span style={{ ...neonText, fontSize: '11px', color }}>{label}</span>
      {children}
    </div>
  );
}

function ToggleSwitch({ on, onChange, color }: { on: boolean; onChange: () => void; color: string }) {
  return (
    <button
      onClick={onChange}
      style={{
        position: 'relative',
        width: '36px',
        height: '18px',
        borderRadius: '9px',
        background: on ? `${color}30` : 'rgba(100,100,130,0.2)',
        border: `1px solid ${on ? color + '60' : 'rgba(100,100,130,0.4)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: on ? `0 0 8px ${color}40` : 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: on ? '20px' : '2px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: on ? color : '#8B80A0',
          transition: 'all 0.2s ease',
          boxShadow: on ? `0 0 6px ${color}80` : 'none',
        }}
      />
    </button>
  );
}
