import { useState, useRef } from 'react';
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

// 设计基准宽度（用于决定整体容器的最大宽度）
const DESIGN_WIDTH = 430;
// 底部控制区总高度
const BOTTOM_HEIGHT = 190;
const FUNC_PANEL_HEIGHT = 110; // 功能区（+10px，原100）
const BTN_PANEL_HEIGHT = 50;   // 按钮区
const BOTTOM_FOOTER_HEIGHT = 30; // 最底部占位框（抬高整体）
// 注：战场固定 300px 高度由 GameEngine 内部 ARENA_HEIGHT 控制，canvas 整体 flex-1
// 上方 0~groundY 绘制背景图（天空/霓虹城市/星星），下方 300px 是战场
// 背包浮层固定高度
const BAG_PANEL_HEIGHT = 266;
// 技能浮层固定高度
const SKILL_PANEL_HEIGHT = 600;
// 图鉴/成就浮层固定高度
const CODEX_PANEL_HEIGHT = 350;

function App() {
  const gameCanvasRef = useRef<GameCanvasHandle>(null);
  const [activeTab, setActiveTab] = useState('equipment');
  const [shopOpen, setShopOpen] = useState(false);
  const [showEquipStats, setShowEquipStats] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);

  // 背包页签：仅保留 装备/物品/调试
  const tabs = [
    { id: 'equipment', label: '装备', icon: '\u2694' },
    { id: 'inventory', label: '物品', icon: '\uD83C\uDF92' },
    { id: 'debug', label: '调试', icon: '\u2699' },
  ];

  const engineRef = {
    get current() {
      return gameCanvasRef.current?.engine || null;
    },
  };

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
        {/* 游戏区域：上方背景图区域动态高度 + 下方战场固定 300px
            canvas 整体 flex-1，GameEngine 内部 groundY = height - 300，
            上方 0~groundY 绘制天空/霓虹城市/星星等背景图，下方 300px 是战场 */}
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

        {/* 底部控制区：固定 150px = 100px 功能区 + 50px 按钮区 */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{
            height: BOTTOM_HEIGHT,
            background: 'linear-gradient(180deg, #131025 0%, #0D0B1A 100%)',
            borderTop: '1px solid rgba(176, 38, 255, 0.3)',
            boxShadow: 'inset 0 1px 0 rgba(0, 245, 212, 0.1)',
          }}
        >
          {/* 功能区：100px — 物品快捷栏(2行4列) + 技能快捷栏(2行4列) */}
          <div
            style={{
              height: FUNC_PANEL_HEIGHT,
              borderBottom: '1px solid rgba(176, 38, 255, 0.15)',
            }}
          >
            <QuickBars engineRef={engineRef as any} />
          </div>
          {/* 按钮区：50px，按顺序排列8个按钮 */}
          <div
            className="flex items-center justify-between gap-1"
            style={{
              height: BTN_PANEL_HEIGHT,
              padding: '0 8px',
            }}
          >
            {([
              { label: '人物', action: () => {}, active: false },
              { label: '技能', action: () => setSkillOpen((v) => !v), active: skillOpen },
              { label: '成就', action: () => setCodexOpen((v) => !v), active: codexOpen },
              { label: '社交', action: () => {}, active: false },
              { label: '邮件', action: () => {}, active: false },
              { label: '背包', action: () => setBagOpen((v) => !v), active: bagOpen },
              { label: '重开', action: () => engineRef.current?.restartCurrentWave(), active: false },
              { label: '主界面', action: () => {}, active: false },
            ] as const).map((btn) => {
              const active = btn.active;
              return (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  style={{
                    flex: '1 1 0',
                    minWidth: '0',
                    height: '34px',
                    padding: '0 4px',
                    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: active ? '#0A0814' : '#00F5D4',
                    background: active
                      ? 'linear-gradient(180deg, #00F5D4 0%, #4FACFE 100%)'
                      : 'rgba(19, 16, 37, 0.85)',
                    border: `1px solid ${active ? '#00F5D4' : 'rgba(0, 245, 212, 0.4)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: active
                      ? `0 0 12px rgba(0, 245, 212, 0.55)`
                      : `0 0 6px rgba(0, 245, 212, 0.18), inset 0 1px 0 rgba(255,255,255,0.05)`,
                    textShadow: active ? 'none' : '0 0 6px rgba(0, 245, 212, 0.5)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* 最底部占位框：30px，抬高功能区与按钮区，水平垂直居中显示︿ */}
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

        {/* 背包浮层：固定高度 266px，绝对定位 bottom=按钮区+底部占位框高度，
            打开时覆盖游戏区下方+整个功能区，只露出最下方按钮区一排 */}
        {bagOpen && (
          <div
            className="absolute left-0 right-0 z-40"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: BAG_PANEL_HEIGHT,
              background: 'rgba(10, 8, 20, 0.35)',
            }}
            onClick={() => setBagOpen(false)}
          >
            <div
              className="absolute inset-0"
              onClick={(e) => e.stopPropagation()}
            >
              <TabPanel
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onClose={() => setBagOpen(false)}
              >
                {activeTab === 'equipment' && (
                  <EquipmentPanel onTabChange={setActiveTab} activeTab={activeTab} engineRef={engineRef} onShowStats={() => setShowEquipStats(true)} />
                )}
                {activeTab === 'inventory' && (
                  <InventoryPanel engineRef={engineRef} />
                )}
                {activeTab === 'debug' && (
                  <DebugPanel engineRef={engineRef} />
                )}
              </TabPanel>
            </div>
          </div>
        )}

        {/* 技能浮层：固定高度 600px，绝对定位底部对齐按钮区顶部 */}
        {skillOpen && (
          <div
            className="absolute left-0 right-0 z-40"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: SKILL_PANEL_HEIGHT,
              background: 'rgba(10, 8, 20, 0.35)',
            }}
            onClick={() => setSkillOpen(false)}
          >
            <div
              className="absolute inset-0"
              onClick={(e) => e.stopPropagation()}
            >
              <TabPanel
                tabs={[{ id: 'skills', label: '技能', icon: '\u2728' }]}
                activeTab="skills"
                onTabChange={() => {}}
                onClose={() => setSkillOpen(false)}
              >
                <SkillTree engineRef={engineRef} />
              </TabPanel>
            </div>
          </div>
        )}

        {/* 成就/图鉴浮层：固定高度 350px，绝对定位底部对齐按钮区顶部 */}
        {codexOpen && (
          <div
            className="absolute left-0 right-0 z-40"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: CODEX_PANEL_HEIGHT,
              background: 'rgba(10, 8, 20, 0.35)',
            }}
            onClick={() => setCodexOpen(false)}
          >
            <div
              className="absolute inset-0"
              onClick={(e) => e.stopPropagation()}
            >
              <TabPanel
                tabs={[{ id: 'codex', label: '图鉴', icon: '\uD83D\uDCD6' }]}
                activeTab="codex"
                onTabChange={() => {}}
                onClose={() => setCodexOpen(false)}
              >
                <CodexPanel />
              </TabPanel>
            </div>
          </div>
        )}

        {/* 游戏结束弹窗：覆盖整个容器（含底部面板），阻止物品栏操作 */}
        <GameOverModal
          onRestart={() => {
            engineRef.current?.restartCurrentWave();
          }}
          onBackToMenu={() => {
            // 主界面逻辑待实现
          }}
        />
      </div>
    </div>
  );
}

export default App;
