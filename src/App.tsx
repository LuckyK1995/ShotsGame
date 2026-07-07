import { useState, useRef, useMemo, useCallback } from 'react';
import { GameCanvas, type GameCanvasHandle } from './components/GameCanvas';
import { StatusBar } from './components/StatusBar';
import { BossHealthBar } from './components/BossHealthBar';
import { RareDropToast } from './components/RareDropToast';
import { WaveNotice } from './components/WaveNotice';
import { TabPanel } from './components/TabPanel';
import { EquipmentPanel } from './components/EquipmentPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { SkillTree } from './components/SkillTree';
import { CodexPanel } from './components/CodexPanel';
import { DebugPanel } from './components/DebugPanel';
import { ShopPanel } from './components/ShopPanel';
import { AchievementNotification } from './components/AchievementNotification';
import { GameOverModal } from './components/GameOverModal';
import { EquipmentStatsModal } from './components/EquipmentStatsModal';
import { QuickBars } from './components/QuickBars';
import { MailPanel } from './components/MailPanel';
import { RestartConfirmModal } from './components/RestartConfirmModal';
import { MainMenu } from './components/MainMenu';
import { CharacterPanel } from './components/CharacterPanel';
import {
  PixelButton,
  PixelCharIcon, PixelSkillIcon, PixelAchieveIcon, PixelSocialIcon,
  PixelMailIcon, PixelBagIcon, PixelRestartIcon, PixelHomeIcon,
} from './components/PixelButton';

// 设计基准宽度（用于决定整体容器的最大宽度）
const DESIGN_WIDTH = 430;
// 底部控制区总高度
const BOTTOM_HEIGHT = 190;
const FUNC_PANEL_HEIGHT = 110; // 功能区（+10px，原100）
const BTN_PANEL_HEIGHT = 50;   // 按钮区
const BOTTOM_FOOTER_HEIGHT = 30; // 最底部占位框（抬高整体）
// 浮层固定高度
const BAG_PANEL_HEIGHT = 266;
const SKILL_PANEL_HEIGHT = 600;
const CODEX_PANEL_HEIGHT = 350;
const MAIL_PANEL_HEIGHT = 266;
const CHAR_PANEL_HEIGHT = 266;

type View = 'menu' | 'battle';
// 单例浮层：仅允许打开一个
type ActivePanel = 'character' | 'bag' | 'skill' | 'codex' | 'mail' | null;
type BagTab = 'equipment' | 'inventory' | 'debug';

// 按钮 ID → 对应的 ActivePanel（模块级常量，避免每次 render 重建）
const BUTTON_PANEL_MAP: Record<string, ActivePanel> = {
  character: 'character',
  skill: 'skill',
  achievement: 'codex',
  mail: 'mail',
  bag: 'bag',
};

// 背包页签：模块级常量
const BAG_TABS = [
  { id: 'equipment', label: '装备', icon: '\u2694' },
  { id: 'inventory', label: '物品', icon: '\uD83C\uDF92' },
  { id: 'debug', label: '调试', icon: '\u2699' },
];

function App() {
  const gameCanvasRef = useRef<GameCanvasHandle>(null);
  const [view, setView] = useState<View>('battle');
  const [shopOpen, setShopOpen] = useState(false);
  const [showEquipStats, setShowEquipStats] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [bagTab, setBagTab] = useState<BagTab>('equipment');
  const [restartConfirm, setRestartConfirm] = useState(false);
  const [socialToast, setSocialToast] = useState(false);

  // 背包页签：仅保留 装备/物品/调试（模块级常量，避免每次 render 重建）
  // engineRef 稳定引用（避免每次 render 创建新对象导致子组件 memo 失效）
  const engineRef = useMemo(() => ({
    get current() {
      return gameCanvasRef.current?.engine || null;
    },
  }), []);

  // 切换浮层：点击当前已打开的按钮则关闭，否则切换到新浮层（自动关闭其他）
  const togglePanel = useCallback((panel: Exclude<ActivePanel, null>) => {
    setActivePanel(prev => (prev === panel ? null : panel));
  }, []);

  // 关闭所有浮层（切到主界面前调用）
  const closeAllPanels = useCallback(() => {
    setActivePanel(null);
    setRestartConfirm(false);
    setShopOpen(false);
    setShowEquipStats(false);
  }, []);

  const handleBackToMenu = useCallback(() => {
    closeAllPanels();
    engineRef.current?.saveGame();
    setView('menu');
  }, [closeAllPanels]);

  const handleEnterStage = useCallback((mode: string) => {
    if (gameCanvasRef.current?.engine) {
      gameCanvasRef.current.engine.restartWithMode(mode as any);
    }
    setView('battle');
  }, []);

  // 社交按钮：临时提示
  const handleSocial = useCallback(() => {
    setSocialToast(true);
    window.setTimeout(() => setSocialToast(false), 1500);
  }, []);

  // 底部按钮配置 - 性能优化：useMemo 不依赖 activePanel，action 函数引用稳定
  // active 状态在 render 时单独计算，仅影响对应按钮
  const buttons = useMemo<Array<{
    id: string;
    label: string;
    iconElement: React.ReactNode;
    action: () => void;
    badge?: number;
  }>>(() => [
    { id: 'character', label: '人物', iconElement: <PixelCharIcon />, action: () => togglePanel('character') },
    { id: 'skill', label: '技能', iconElement: <PixelSkillIcon />, action: () => togglePanel('skill') },
    { id: 'achievement', label: '成就', iconElement: <PixelAchieveIcon />, action: () => togglePanel('codex') },
    { id: 'social', label: '社交', iconElement: <PixelSocialIcon />, action: handleSocial },
    { id: 'mail', label: '邮件', iconElement: <PixelMailIcon />, action: () => togglePanel('mail') },
    { id: 'bag', label: '背包', iconElement: <PixelBagIcon />, action: () => togglePanel('bag') },
    { id: 'restart', label: '重开', iconElement: <PixelRestartIcon />, action: () => setRestartConfirm(true) },
    { id: 'home', label: '主界面', iconElement: <PixelHomeIcon />, action: handleBackToMenu },
  ], [togglePanel, handleSocial, handleBackToMenu]);

  return (
    <div
      className="w-screen h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#0A0814' }}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: '100%',
          maxWidth: DESIGN_WIDTH,
          height: '100vh',
          maxHeight: '100vh',
          boxShadow: '0 0 40px rgba(176, 38, 255, 0.15), 0 0 80px rgba(0, 245, 212, 0.08)',
        }}
      >
        {/* 游戏区域：上方背景图区域动态高度 + 下方战场固定 300px */}
        <div
          className="relative flex-1 min-h-0 overflow-hidden"
          style={{ width: '100%' }}
        >
          <GameCanvas ref={gameCanvasRef} />
          <StatusBar onOpenShop={() => { setShopOpen(true); engineRef.current?.openShop(); }} engineRef={engineRef} />
          <BossHealthBar />
          <RareDropToast />
          <WaveNotice />
          <AchievementNotification />
          <ShopPanel
            engineRef={engineRef}
            isOpen={shopOpen}
            onClose={() => {
              setShopOpen(false);
              engineRef.current?.closeShop();
            }}
          />
          {showEquipStats && <EquipmentStatsModal onClose={() => setShowEquipStats(false)} />}
        </div>

        {/* 底部控制区：固定 190px = 110 功能区 + 50 按钮区 + 30 占位框 */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{
            height: BOTTOM_HEIGHT,
            background: 'linear-gradient(180deg, #131025 0%, #0D0B1A 100%)',
            borderTop: '1px solid rgba(176, 38, 255, 0.3)',
            boxShadow: 'inset 0 1px 0 rgba(0, 245, 212, 0.1)',
          }}
        >
          {/* 功能区：110px */}
          <div
            style={{
              height: FUNC_PANEL_HEIGHT,
              borderBottom: '1px solid rgba(176, 38, 255, 0.15)',
            }}
          >
            <QuickBars engineRef={engineRef as any} />
          </div>
          {/* 按钮区：50px，圆形立体按钮，靠右对齐，左右边距-10px */}
          <div
            className="flex items-end justify-end gap-1"
            style={{
              height: BTN_PANEL_HEIGHT,
              padding: '2px 0px 0px',
            }}
          >
            {buttons.map((btn) => {
              const panelId = BUTTON_PANEL_MAP[btn.id];
              const active = panelId != null && activePanel === panelId;
              return (
                <PixelButton
                  key={btn.id}
                  iconElement={btn.iconElement}
                  label={btn.label}
                  active={active}
                  onClick={btn.action}
                  badge={btn.badge}
                />
              );
            })}
          </div>

          {/* 最底部占位框：30px */}
          <div
            className="flex items-center justify-center"
            style={{
              height: BOTTOM_FOOTER_HEIGHT,
              color: '#5A5A6A',
              fontSize: '14px',
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              letterSpacing: '2px',
              userSelect: 'none',
            }}
          >
            ︿
          </div>
        </div>

        {/* 人物面板浮层：固定高度 266px */}
        {activePanel === 'character' && (
          <div
            className="absolute left-0 right-0 z-40"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: CHAR_PANEL_HEIGHT,
              background: 'rgba(10, 8, 20, 0.35)',
            }}
            onClick={() => setActivePanel(null)}
          >
            <div
              className="absolute inset-0"
              onClick={(e) => e.stopPropagation()}
            >
              <TabPanel
                tabs={[{ id: 'character', label: '人物', icon: '\uD83E\uDD77' }]}
                activeTab="character"
                onTabChange={() => {}}
                onClose={() => setActivePanel(null)}
              >
                <CharacterPanel engineRef={engineRef as any} />
              </TabPanel>
            </div>
          </div>
        )}

        {/* 背包浮层：固定高度 266px */}
        {activePanel === 'bag' && (
          <div
            className="absolute left-0 right-0 z-40"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: BAG_PANEL_HEIGHT,
              background: 'rgba(10, 8, 20, 0.35)',
            }}
            onClick={() => setActivePanel(null)}
          >
            <div
              className="absolute inset-0"
              onClick={(e) => e.stopPropagation()}
            >
              <TabPanel
                tabs={BAG_TABS}
                activeTab={bagTab}
                onTabChange={(t) => setBagTab(t as BagTab)}
                onClose={() => setActivePanel(null)}
              >
                {bagTab === 'equipment' && (
                  <EquipmentPanel onTabChange={(t) => setBagTab(t as BagTab)} activeTab={bagTab as 'equipment' | 'inventory'} engineRef={engineRef} onShowStats={() => setShowEquipStats(true)} />
                )}
                {bagTab === 'inventory' && (
                  <InventoryPanel engineRef={engineRef} />
                )}
                {bagTab === 'debug' && (
                  <DebugPanel engineRef={engineRef} />
                )}
              </TabPanel>
            </div>
          </div>
        )}

        {/* 技能浮层：固定高度 600px */}
        {activePanel === 'skill' && (
          <div
            className="absolute left-0 right-0 z-40"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: SKILL_PANEL_HEIGHT,
              background: 'rgba(10, 8, 20, 0.35)',
            }}
            onClick={() => setActivePanel(null)}
          >
            <div
              className="absolute inset-0"
              onClick={(e) => e.stopPropagation()}
            >
              <TabPanel
                tabs={[{ id: 'skills', label: '技能', icon: '\u2728' }]}
                activeTab="skills"
                onTabChange={() => {}}
                onClose={() => setActivePanel(null)}
              >
                <SkillTree engineRef={engineRef} />
              </TabPanel>
            </div>
          </div>
        )}

        {/* 成就/图鉴浮层：固定高度 350px */}
        {activePanel === 'codex' && (
          <div
            className="absolute left-0 right-0 z-40"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: CODEX_PANEL_HEIGHT,
              background: 'rgba(10, 8, 20, 0.35)',
            }}
            onClick={() => setActivePanel(null)}
          >
            <div
              className="absolute inset-0"
              onClick={(e) => e.stopPropagation()}
            >
              <TabPanel
                tabs={[{ id: 'codex', label: '图鉴', icon: '\uD83D\uDCD6' }]}
                activeTab="codex"
                onTabChange={() => {}}
                onClose={() => setActivePanel(null)}
              >
                <CodexPanel />
              </TabPanel>
            </div>
          </div>
        )}

        {/* 邮件浮层：固定高度 266px */}
        {activePanel === 'mail' && (
          <div
            className="absolute left-0 right-0 z-40"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: MAIL_PANEL_HEIGHT,
              background: 'rgba(10, 8, 20, 0.35)',
            }}
            onClick={() => setActivePanel(null)}
          >
            <div
              className="absolute inset-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MailPanel
                engineRef={engineRef as any}
                onClose={() => setActivePanel(null)}
              />
            </div>
          </div>
        )}

        {/* 重开确认弹窗 */}
        {restartConfirm && (
          <RestartConfirmModal
            onConfirm={() => {
              engineRef.current?.restartCurrentWave();
              setRestartConfirm(false);
            }}
            onCancel={() => setRestartConfirm(false)}
          />
        )}

        {/* 社交功能未开放提示 */}
        {socialToast && (
          <div
            className="absolute left-1/2 z-[80]"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT + 10,
              transform: 'translateX(-50%)',
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              fontSize: '10px',
              fontWeight: 700,
              color: '#FFE600',
              padding: '6px 14px',
              background: 'rgba(10, 8, 20, 0.92)',
              border: '1px solid rgba(255, 230, 0, 0.4)',
              borderRadius: '6px',
              boxShadow: '0 0 16px rgba(255, 230, 0, 0.3)',
              textShadow: '0 0 6px rgba(255, 230, 0, 0.6)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            【社交】即将开放，敬请期待
          </div>
        )}

        {/* 游戏结束弹窗 */}
        <GameOverModal
          onRestart={() => {
            engineRef.current?.restartCurrentWave();
          }}
          onBackToMenu={handleBackToMenu}
        />

        {/* 主界面：覆盖整个容器 */}
        {view === 'menu' && (
          <MainMenu onEnterStage={handleEnterStage} />
        )}
      </div>
    </div>
  );
}

export default App;
