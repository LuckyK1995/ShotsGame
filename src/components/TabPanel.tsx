interface Tab {
  id: string;
  icon: string;
  label: string;
}

interface TabPanelProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onClose?: () => void;
  children: React.ReactNode;
}

export function TabPanel({ tabs, activeTab, onTabChange, onClose, children }: TabPanelProps) {
  const neonCyan = '#00F5D4';
  const neonPurple = '#B026FF';
  const neonPink = '#FF0080';
  const neonBlue = '#4FACFE';
  const neonRed = '#FF3B3B';

  const tabColors: Record<string, { active: string; inactive: string; icon: string }> = {
    equipment: { active: neonCyan, inactive: '#5A5A7A', icon: neonCyan },
    inventory: { active: neonPink, inactive: '#7A5A6A', icon: neonPink },
    skills: { active: neonBlue, inactive: '#4A5A7A', icon: neonBlue },
    codex: { active: neonPurple, inactive: '#5A4A7A', icon: neonPurple },
    debug: { active: neonRed, inactive: '#7A5A5A', icon: neonRed },
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* 右上角关闭按钮 */}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="关闭背包"
          style={{
            position: 'absolute',
            top: '4px',
            right: '6px',
            zIndex: 30,
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(19, 16, 37, 0.85)',
            color: neonCyan,
            fontSize: '20px',
            lineHeight: 1,
            cursor: 'pointer',
            borderRadius: '6px',
            border: `1px solid ${neonCyan}50`,
            boxShadow: `0 0 8px ${neonCyan}30`,
            textShadow: `0 0 6px ${neonCyan}80`,
            fontFamily: '"Rajdhani", "Orbitron", monospace',
            padding: 0,
            paddingBottom: '2px',
          }}
        >
          ﹀
        </button>
      )}

      <div className="flex gap-1.5 pl-1 pr-9 pt-1 relative z-10">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const tc = tabColors[tab.id] || tabColors.equipment;

          return (
            <button
              key={tab.id}
              className="flex items-center justify-center gap-1 px-2 py-1.5"
              style={{
                fontFamily: '"Rajdhani", "Orbitron", monospace',
                fontSize: '8px',
                fontWeight: isActive ? 700 : 500,
                background: isActive
                  ? 'rgba(19, 16, 37, 0.9)'
                  : 'rgba(13, 11, 26, 0.6)',
                color: isActive ? tc.active : tc.inactive,
                textShadow: isActive
                  ? `0 0 8px ${tc.active}80`
                  : 'none',
                marginBottom: '-4px',
                position: 'relative',
                zIndex: isActive ? 3 : 1,
                minWidth: '52px',
                height: '30px',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                borderRadius: '8px 8px 0 0',
                border: isActive
                  ? `1px solid ${tc.active}60`
                  : '1px solid rgba(100,100,130,0.15)',
                borderBottom: isActive ? 'none' : '1px solid rgba(100,100,130,0.15)',
                boxShadow: isActive
                  ? `0 0 12px ${tc.active}30, inset 0 1px 0 rgba(255,255,255,0.08)`
                  : 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
              onClick={() => onTabChange(tab.id)}
            >
              <span style={{ fontSize: '10px', filter: isActive ? `drop-shadow(0 0 4px ${tc.active}80)` : 'none' }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="flex-1 overflow-hidden m-0.5 mt-0 p-2"
        style={{
          background: 'rgba(19, 16, 37, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(176, 38, 255, 0.2)',
          borderRadius: '0 10px 10px 10px',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3), 0 0 20px rgba(176, 38, 255, 0.08)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
