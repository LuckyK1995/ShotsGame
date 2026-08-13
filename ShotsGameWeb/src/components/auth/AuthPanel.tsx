import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../store/authStore';
import { ModalHudBackground } from '../ModalHudBackground';
import { neonCyan, neonPurple, neonPink, neonYellow } from '../../theme/colors';

type Mode = 'login' | 'register';

const neonText: React.CSSProperties = {
  fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
  fontWeight: 700,
  letterSpacing: '1px',
};

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'rgba(10, 8, 20, 0.7)',
  border: '1px solid rgba(176, 38, 255, 0.3)',
  borderRadius: '6px',
  padding: '8px 10px',
  color: '#E8E0F5',
  fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
  fontWeight: 600,
  fontSize: '12px',
  letterSpacing: '0.5px',
  outline: 'none',
};

export function AuthPanel() {
  const { login, register, error, clearError } = useAuthStore();
  const [mode, setMode] = useState<Mode>('login');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(true);

  // register fields
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const displayError = localError ?? error;

  const switchMode = (m: Mode) => {
    setMode(m);
    setLocalError(null);
    clearError();
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!username.trim() || !password) {
      setLocalError('请输入账号和密码');
      return;
    }
    setSubmitting(true);
    try {
      await login({ username: username.trim(), password, autoLogin });
    } catch (err: any) {
      setLocalError(err?.message ?? '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!regUsername.trim() || !regPassword) {
      setLocalError('请输入账号和密码');
      return;
    }
    if (regPassword.length < 6) {
      setLocalError('密码至少 6 位');
      return;
    }
    if (regPassword !== regConfirm) {
      setLocalError('两次密码输入不一致');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('邮箱格式不正确');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        username: regUsername.trim(),
        password: regPassword,
        displayName: displayName.trim() || undefined,
        email: email.trim() || undefined,
      });
      // 注册成功后忽略 avatarUrl（后端 RegisterInput 暂未支持，提示用户登录后到个人中心设置）
      if (avatarUrl.trim()) {
        // 提示：注册接口暂未支持头像，可登录后通过 PUT /api/player/profile 更新
        console.warn('注册接口暂未支持 AvatarUrl，请登录后到个人中心更新头像');
      }
    } catch (err: any) {
      setLocalError(err?.message ?? '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="w-screen h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#0A0814' }}
    >
      <div
        className="relative"
        style={{
          width: '320px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(19, 16, 37, 0.95)',
          border: `1px solid ${neonPurple}40`,
          borderRadius: '14px',
          boxShadow: `0 0 40px ${neonPurple}25, 0 0 80px ${neonCyan}10, inset 0 1px 0 rgba(255,255,255,0.05)`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <ModalHudBackground accentColor={neonPurple} accentColor2={neonCyan} opacity={0.25} />

        <div className="relative p-5" style={{ zIndex: 1 }}>
          {/* 顶部 LOGO + 标题 */}
          <div className="flex flex-col items-center mb-4">
            <div
              style={{
                fontSize: '32px',
                lineHeight: 1,
                filter: `drop-shadow(0 0 12px ${neonPurple}90)`,
                marginBottom: '6px',
              }}
            >
              <span style={{ color: neonCyan }}>⬢</span>
              <span style={{ color: neonPink }}>⬡</span>
            </div>
            <h1
              style={{
                ...neonText,
                fontSize: '16px',
                color: neonCyan,
                textShadow: `0 0 10px ${neonCyan}80`,
                letterSpacing: '2px',
              }}
            >
              末世突围
            </h1>
            <p style={{ ...neonText, fontSize: '8px', color: '#8B80A0', marginTop: '4px', letterSpacing: '1px' }}>
              SHOTS GAME · WASTELAND
            </p>
          </div>

          {/* 模式切换 Tab */}
          <div className="flex mb-4" style={{ background: 'rgba(10, 8, 20, 0.6)', borderRadius: '8px', padding: '2px' }}>
            {(['login', 'register'] as Mode[]).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    background: active
                      ? `linear-gradient(135deg, ${neonPurple}40, ${neonCyan}25)`
                      : 'transparent',
                    border: `1px solid ${active ? `${neonCyan}80` : 'transparent'}`,
                    borderRadius: '6px',
                    padding: '6px 0',
                    ...neonText,
                    fontSize: '11px',
                    color: active ? neonCyan : '#8B80A0',
                    textShadow: active ? `0 0 6px ${neonCyan}80` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {m === 'login' ? '登录' : '注册'}
                </button>
              );
            })}
          </div>

          {/* 错误提示 */}
          {displayError && (
            <div
              style={{
                marginBottom: '10px',
                padding: '6px 10px',
                background: 'rgba(255, 45, 85, 0.12)',
                border: '1px solid rgba(255, 45, 85, 0.45)',
                borderRadius: '6px',
                ...neonText,
                fontSize: '10px',
                color: '#FF6B85',
                textAlign: 'center',
              }}
            >
              {displayError}
            </div>
          )}

          {/* 登录表单 */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <Field label="账号">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入账号"
                  autoComplete="username"
                  style={inputBase}
                  disabled={submitting}
                />
              </Field>
              <Field label="密码">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  style={inputBase}
                  disabled={submitting}
                />
              </Field>
              <label
                className="flex items-center gap-2"
                style={{ ...neonText, fontSize: '10px', color: '#A0A0B8', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={autoLogin}
                  onChange={(e) => setAutoLogin(e.target.checked)}
                  style={{ accentColor: neonCyan }}
                  disabled={submitting}
                />
                记住登录状态（30天内自动登录）
              </label>
              <SubmitButton
                label="登 录"
                loading={submitting}
                accentColor={neonCyan}
                accentColor2={neonPurple}
              />
            </form>
          )}

          {/* 注册表单 */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-2.5">
              <Field label="账号 *">
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="3-20 位字母/数字/下划线"
                  autoComplete="username"
                  style={inputBase}
                  disabled={submitting}
                />
              </Field>
              <Field label="密码 *">
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="至少 6 位"
                  autoComplete="new-password"
                  style={inputBase}
                  disabled={submitting}
                />
              </Field>
              <Field label="确认密码 *">
                <input
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="再次输入密码"
                  autoComplete="new-password"
                  style={inputBase}
                  disabled={submitting}
                />
              </Field>
              <Field label="昵称">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="留空将自动生成（如：突围者12345）"
                  style={inputBase}
                  disabled={submitting}
                />
              </Field>
              <Field label="邮箱">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="可选，用于找回密码"
                  autoComplete="email"
                  style={inputBase}
                  disabled={submitting}
                />
              </Field>
              <Field label="头像 URL">
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="可选，登录后也可在个人中心设置"
                  style={inputBase}
                  disabled={submitting}
                />
              </Field>
              <p style={{ ...neonText, fontSize: '8px', color: '#6B6580', marginTop: '-2px' }}>
                带 * 为必填项；注册成功后将自动登录
              </p>
              <SubmitButton
                label="注 册"
                loading={submitting}
                accentColor={neonPurple}
                accentColor2={neonCyan}
              />
            </form>
          )}

          {/* 底部版本号 */}
          <div
            className="flex items-center justify-center mt-4"
            style={{ ...neonText, fontSize: '8px', color: '#5A5A6A', letterSpacing: '2px' }}
          >
            <span style={{ color: neonYellow, marginRight: '4px' }}>●</span>
            v2.4.7 · ONLINE
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label style={{ ...neonText, fontSize: '10px', color: '#A0A0B8', letterSpacing: '1px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SubmitButton({
  label,
  loading,
  accentColor,
  accentColor2,
}: {
  label: string;
  loading: boolean;
  accentColor: string;
  accentColor2: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        marginTop: '6px',
        width: '100%',
        background: `linear-gradient(135deg, ${accentColor}30, ${accentColor2}25)`,
        border: `1px solid ${accentColor}80`,
        borderRadius: '8px',
        padding: '10px 0',
        ...neonText,
        fontSize: '13px',
        letterSpacing: '4px',
        color: accentColor,
        textShadow: `0 0 8px ${accentColor}80`,
        boxShadow: `0 0 16px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.08)`,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.boxShadow = `0 0 24px ${accentColor}50, inset 0 1px 0 rgba(255,255,255,0.12)`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 16px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.08)`;
      }}
    >
      {loading ? '处理中...' : label}
    </button>
  );
}
