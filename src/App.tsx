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

// 设计基准宽度（用于决定整体容器的最大宽度）
const DESIGN_WIDTH = 430;
// 底部面板固定高度
const BOTTOM_PANEL_HEIGHT = 290;

function App() {
  const gameCanvasRef = useRef<GameCanvasHandle>(null);
  const [activeTab, setActiveTab] = useState('equipment');
  const [shopOpen, setShopOpen] = useState(false);
  const [showEquipStats, setShowEquipStats] = useState(false);

  const tabs = [
    { id: 'equipment', label: '装备', icon: '\u2694' },
    { id: 'inventory', label: '物品', icon: '\uD83C\uDF92' },
    { id: 'skills', label: '技能', icon: '\u2728' },
    { id: 'codex', label: '图鉴', icon: '\uD83D\uDCD6' },
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
        {/* 游戏区域：占据剩余空间，与底部面板上下相对布局 */}
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

        {/* 底部面板：固定高度，与游戏区域上下相对布局 */}
        <div
          className="flex-shrink-0"
          style={{
            height: BOTTOM_PANEL_HEIGHT,
            background: 'linear-gradient(180deg, #131025 0%, #0D0B1A 100%)',
            borderTop: '1px solid rgba(176, 38, 255, 0.3)',
            boxShadow: 'inset 0 1px 0 rgba(0, 245, 212, 0.1)',
          }}
        >
          <div className="h-full px-3 py-2">
            <TabPanel
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            >
              {activeTab === 'equipment' && (
                <EquipmentPanel onTabChange={setActiveTab} activeTab={activeTab} engineRef={engineRef} onShowStats={() => setShowEquipStats(true)} />
              )}
              {activeTab === 'inventory' && (
                <InventoryPanel engineRef={engineRef} />
              )}
              {activeTab === 'skills' && (
                <SkillTree engineRef={engineRef} />
              )}
              {activeTab === 'codex' && (
                <CodexPanel />
              )}
              {activeTab === 'debug' && (
                <DebugPanel engineRef={engineRef} />
              )}
            </TabPanel>
          </div>
        </div>

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
