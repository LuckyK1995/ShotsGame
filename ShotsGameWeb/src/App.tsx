import { useState, useRef, useMemo, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { GameCanvas, type GameCanvasHandle } from './components/GameCanvas';
import { StatusBar } from './components/StatusBar';
import { BossHealthBar } from './components/BossHealthBar';
import { RareDropToast } from './components/RareDropToast';
import { GameToast } from './components/GameToast';
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
import { PurgatorySettlement } from './components/PurgatorySettlement';
import { MaterialSettlement } from './components/MaterialSettlement';
import { DailySettlement } from './components/DailySettlement';
import { EquipmentStatsModal } from './components/EquipmentStatsModal';
import { QuickBars } from './components/QuickBars';
import { MailPanel } from './components/MailPanel';
import { RestartConfirmModal } from './components/RestartConfirmModal';
import { ModalHudBackground } from './components/ModalHudBackground';
import { neonYellow, neonPurple, neonCyan } from './theme/colors';
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
const SKILL_PANEL_HEIGHT = 400;
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
  const [view, setView] = useState<View>('menu');
  const [shopOpen, setShopOpen] = useState(false);
  const [showEquipStats, setShowEquipStats] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [bagTab, setBagTab] = useState<BagTab>('equipment');
  const [restartConfirm, setRestartConfirm] = useState(false);
  // 战斗界面点击【主界面】时的返回确认
  const [backToMenuConfirm, setBackToMenuConfirm] = useState(false);
  const [socialToast, setSocialToast] = useState(false);
  // 主界面 MainMenu 内任意弹窗打开时为 true（用于隐藏 StatusBar）
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  // 日常挑战：点击主界面时弹出的结算确认
  const [dailySettleConfirm, setDailySettleConfirm] = useState(false);

  // 订阅游戏结束状态：用于在炼狱模式胜利时显示结算界面（替代普通GameOverModal）
  const isGameOver = useGameStore(s => s.gameState?.isGameOver ?? false);

  // 订阅邮件列表：用于邮件按钮未读角标
  const mails = useGameStore(s => s.mails);
  const mailUnread = useMemo(() => mails.filter(m => !m.read).length, [mails]);

  // 订阅成就列表：用于成就按钮可领取红点
  const achievements = useGameStore(s => s.achievements);
  const claimableAchievements = useMemo(() => achievements.filter(a => a.unlocked && !a.claimed).length, [achievements]);

  // 背包页签：仅保留 装备/物品/调试（模块级常量，避免每次 render 重建）
  // engineRef 稳定引用（避免每次 render 创建新对象导致子组件 memo 失效）
  const engineRef = useMemo(() => ({
    get current() {
      return gameCanvasRef.current?.engine || null;
    },
  }), []);

  // 炼狱模式BOSS击败后处于结算阶段时显示结算界面
  const isPurgatorySettlement = isGameOver && !!engineRef.current?.isPurgatorySettlementActive();

  // 材料副本BOSS击败后处于结算阶段时显示结算界面
  const isMaterialSettlement = isGameOver && !!engineRef.current?.isMaterialSettlementActive();

  // 日常挑战玩家主动退出后处于结算阶段时显示结算界面
  const isDailySettlement = isGameOver && !!engineRef.current?.isDailySettlementActive();

  // 切换浮层：点击当前已打开的按钮则关闭，否则切换到新浮层（自动关闭其他）
  const togglePanel = useCallback((panel: Exclude<ActivePanel, null>) => {
    setActivePanel(prev => (prev === panel ? null : panel));
  }, []);

  // 关闭所有浮层（切到主界面前调用）
  const closeAllPanels = useCallback(() => {
    setActivePanel(null);
    setRestartConfirm(false);
    setBackToMenuConfirm(false);
    setShopOpen(false);
    setShowEquipStats(false);
    setDailySettleConfirm(false);
  }, []);

  const handleBackToMenu = useCallback(() => {
    closeAllPanels();
    try {
      engineRef.current?.saveGame();
      engineRef.current?.resetPlayerForMenu();
    } catch (e) {
      // 即使引擎调用出错，也要确保返回主界面
      console.error('handleBackToMenu engine error:', e);
      engineRef.current?.stop();
    } finally {
      setView('menu');
    }
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
    { id: 'achievement', label: '成就', iconElement: <PixelAchieveIcon />, action: () => togglePanel('codex'), badge: claimableAchievements },
    { id: 'social', label: '社交', iconElement: <PixelSocialIcon />, action: handleSocial },
    { id: 'mail', label: '邮件', iconElement: <PixelMailIcon />, action: () => togglePanel('mail'), badge: mailUnread },
    { id: 'bag', label: '背包', iconElement: <PixelBagIcon />, action: () => togglePanel('bag') },
    {
      id: 'restart',
      label: '重开',
      iconElement: <PixelRestartIcon />,
      action: () => {
        // 日常挑战：点击【重开】直接触发主动结算（不弹出 RestartConfirmModal）
        const engine = engineRef.current;
        if (engine && engine.gameMode === 'daily' && !engine.isDailySettlementActive()) {
          engine.exitDailyManually();
        } else {
          setRestartConfirm(true);
        }
      },
    },
    {
      id: 'home',
      label: '主界面',
      iconElement: <PixelHomeIcon />,
      action: () => {
        const engine = engineRef.current;
        // 日常挑战：点击【主界面】弹出结算确认弹窗
        if (engine && engine.gameMode === 'daily' && !engine.isDailySettlementActive()) {
          setDailySettleConfirm(true);
        } else {
          // 其他模式：弹出返回主界面确认弹窗
          setBackToMenuConfirm(true);
        }
      },
    },
  ], [togglePanel, handleSocial, handleBackToMenu, mailUnread, claimableAchievements]);

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

        {/* 底部控制区：战斗时 190px = 110 功能区 + 50 按钮区 + 30 占位框；主界面 80px = 按钮区 + 占位框（不显示功能区、不显示重开/主界面按钮） */}
        <div
          className="flex-shrink-0 flex flex-col relative"
          style={{
            height: view === 'menu' ? BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT : BOTTOM_HEIGHT,
            background: 'linear-gradient(180deg, #131025 0%, #0D0B1A 100%)',
            borderTop: '1px solid rgba(176, 38, 255, 0.3)',
            boxShadow: 'inset 0 1px 0 rgba(0, 245, 212, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* 静态背景层：末世科技HUD面板 */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.85, zIndex: 0 }}
            viewBox="0 0 430 190"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* 主背景径向渐变 - 中心紫光 */}
              <radialGradient id="bgRadial" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#2D1B4E" stopOpacity="0.6" />
                <stop offset="40%" stopColor="#1A0E2E" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0A0814" stopOpacity="0.2" />
              </radialGradient>

              {/* 六边形蜂窝网格 */}
              <pattern id="hexPattern" x="0" y="0" width="28" height="24.25" patternUnits="userSpaceOnUse">
                <polygon
                  points="14,0 28,7 28,17 14,24.25 0,17 0,7"
                  fill="none"
                  stroke="#B026FF"
                  strokeWidth="0.35"
                  opacity="0.35"
                />
                <circle cx="14" cy="12" r="0.4" fill="#9B59B6" opacity="0.4" />
              </pattern>

              {/* 电路板细纹 - 斜向不规则 */}
              <pattern id="circuitPattern" x="0" y="0" width="110" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                {/* 主走线 - 横向（曲折不规则） */}
                <path d="M0 55 L18 55 L28 42 L46 42 L52 55 L70 55 L78 48 L92 48 L100 62 L110 62" stroke="#00F5D4" strokeWidth="0.6" fill="none" opacity="0.5" />
                {/* 主走线 - 纵向（曲折不规则） */}
                <path d="M55 0 L55 22 L66 32 L66 50 L55 60 L48 72 L48 90 L60 100 L60 120" stroke="#00F5D4" strokeWidth="0.6" fill="none" opacity="0.5" />
                {/* 次级走线 - 短斜线 */}
                <path d="M10 10 L24 24" stroke="#00F5D4" strokeWidth="0.5" fill="none" opacity="0.4" />
                <path d="M86 88 L100 102" stroke="#00F5D4" strokeWidth="0.5" fill="none" opacity="0.4" />
                <path d="M88 16 L74 30" stroke="#9B59B6" strokeWidth="0.5" fill="none" opacity="0.4" />
                <path d="M16 86 L30 72" stroke="#9B59B6" strokeWidth="0.5" fill="none" opacity="0.4" />
                {/* 节点 - 大小不一 */}
                <circle cx="28" cy="42" r="1.6" fill="#00F5D4" opacity="0.75" />
                <circle cx="66" cy="32" r="1.2" fill="#00F5D4" opacity="0.7" />
                <circle cx="55" cy="55" r="1.4" fill="#FFD700" opacity="0.65" />
                <circle cx="100" cy="62" r="1" fill="#00F5D4" opacity="0.6" />
                <circle cx="60" cy="100" r="1.3" fill="#FFD700" opacity="0.65" />
                {/* 焊盘 - 不对称分布 */}
                <rect x="20" y="50" width="5" height="5" fill="none" stroke="#00F5D4" strokeWidth="0.4" opacity="0.55" />
                <rect x="76" y="44" width="6" height="6" fill="none" stroke="#00F5D4" strokeWidth="0.4" opacity="0.55" />
                <rect x="51" y="14" width="4" height="4" fill="none" stroke="#00F5D4" strokeWidth="0.4" opacity="0.55" />
                <rect x="44" y="86" width="6" height="6" fill="none" stroke="#00F5D4" strokeWidth="0.4" opacity="0.55" />
                {/* 圆形焊盘 - 异形 */}
                <circle cx="14" cy="14" r="2.5" fill="none" stroke="#00F5D4" strokeWidth="0.4" opacity="0.5" />
                <circle cx="14" cy="14" r="1" fill="#FF0080" opacity="0.6" />
                <circle cx="96" cy="106" r="2.5" fill="none" stroke="#00F5D4" strokeWidth="0.4" opacity="0.5" />
                <circle cx="96" cy="106" r="1" fill="#00FF9D" opacity="0.6" />
                {/* 微型支线 - 不规则方向 */}
                <path d="M36 55 L36 70" stroke="#9B59B6" strokeWidth="0.4" opacity="0.45" />
                <path d="M82 55 L82 42" stroke="#9B59B6" strokeWidth="0.4" opacity="0.45" />
                <path d="M55 38 L66 38" stroke="#9B59B6" strokeWidth="0.4" opacity="0.45" />
                <path d="M55 80 L48 80" stroke="#9B59B6" strokeWidth="0.4" opacity="0.45" />
                <path d="M28 42 L28 30" stroke="#9B59B6" strokeWidth="0.4" opacity="0.4" />
                <path d="M92 48 L92 36" stroke="#9B59B6" strokeWidth="0.4" opacity="0.4" />
                {/* 装饰小方块 - 散落不规则 */}
                <rect x="36" y="20" width="3" height="3" fill="#FF0080" opacity="0.55" />
                <rect x="78" y="72" width="3" height="3" fill="#00FF9D" opacity="0.55" />
                <rect x="20" y="98" width="3" height="3" fill="#FFD700" opacity="0.55" />
                <rect x="100" y="20" width="3" height="3" fill="#9B59B6" opacity="0.55" />
                {/* 微小光点 */}
                <circle cx="40" cy="30" r="0.5" fill="#FFE600" opacity="0.6" />
                <circle cx="72" cy="64" r="0.5" fill="#FF8C00" opacity="0.6" />
                <circle cx="88" cy="34" r="0.5" fill="#00F5D4" opacity="0.6" />
                <circle cx="34" cy="92" r="0.5" fill="#FF2D55" opacity="0.6" />
              </pattern>

              {/* 顶部HUD光带 */}
              <linearGradient id="topHudBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B026FF" stopOpacity="0.5" />
                <stop offset="30%" stopColor="#9B59B6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#9B59B6" stopOpacity="0" />
              </linearGradient>

              {/* 底部HUD光带 */}
              <linearGradient id="bottomHudBand" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#00F5D4" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#00F5D4" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#00F5D4" stopOpacity="0" />
              </linearGradient>

              {/* 左侧光柱 */}
              <linearGradient id="leftBeam" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF0080" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FF0080" stopOpacity="0" />
              </linearGradient>
              {/* 右侧光柱 */}
              <linearGradient id="rightBeam" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#00FF9D" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00FF9D" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* === 底层填充 === */}
            <rect width="430" height="190" fill="url(#bgRadial)" />
            <rect width="430" height="190" fill="url(#circuitPattern)" />
            <rect width="430" height="190" fill="url(#hexPattern)" />

            {/* === 顶部HUD光带 === */}
            <rect width="430" height="50" fill="url(#topHudBand)" />
            {/* 顶部主分隔线 - 紫色霓虹 */}
            <line x1="0" y1="2" x2="430" y2="2" stroke="#B026FF" strokeWidth="1" opacity="0.8" />
            <line x1="0" y1="3.5" x2="430" y2="3.5" stroke="#B026FF" strokeWidth="0.3" opacity="0.5" />
            {/* 顶部数据流虚线 */}
            <line x1="0" y1="8" x2="430" y2="8" stroke="#9B59B6" strokeWidth="0.3" strokeDasharray="6,4,2,4" opacity="0.6" />

            {/* === 底部HUD光带 === */}
            <rect y="140" width="430" height="50" fill="url(#bottomHudBand)" />
            {/* 底部主分隔线 - 青色霓虹 */}
            <line x1="0" y1="187" x2="430" y2="187" stroke="#00F5D4" strokeWidth="1" opacity="0.8" />
            <line x1="0" y1="185.5" x2="430" y2="185.5" stroke="#00F5D4" strokeWidth="0.3" opacity="0.5" />
            <line x1="0" y1="182" x2="430" y2="182" stroke="#00F5D4" strokeWidth="0.3" strokeDasharray="3,3,6,3" opacity="0.6" />

            {/* === 左右光柱 === */}
            <rect width="60" height="190" fill="url(#leftBeam)" />
            <rect x="370" width="60" height="190" fill="url(#rightBeam)" />

            {/* === HUD 角标装饰（四角）=== */}
            {/* 左上角 L 形角标 */}
            <path d="M4 4 L4 18 M4 4 L18 4" stroke="#FF0080" strokeWidth="1" fill="none" opacity="0.8" />
            <path d="M4 4 L4 10 M4 4 L10 4" stroke="#FFFFFF" strokeWidth="0.4" fill="none" opacity="0.6" />
            <circle cx="4" cy="4" r="1" fill="#FF0080" />
            <circle cx="4" cy="4" r="0.4" fill="#FFFFFF" />
            {/* 右上角 L 形角标 */}
            <path d="M426 4 L426 18 M426 4 L412 4" stroke="#00FF9D" strokeWidth="1" fill="none" opacity="0.8" />
            <path d="M426 4 L426 10 M426 4 L420 4" stroke="#FFFFFF" strokeWidth="0.4" fill="none" opacity="0.6" />
            <circle cx="426" cy="4" r="1" fill="#00FF9D" />
            <circle cx="426" cy="4" r="0.4" fill="#FFFFFF" />
            {/* 左下角 L 形角标 */}
            <path d="M4 186 L4 172 M4 186 L18 186" stroke="#FFD700" strokeWidth="1" fill="none" opacity="0.8" />
            <path d="M4 186 L4 180 M4 186 L10 186" stroke="#FFFFFF" strokeWidth="0.4" fill="none" opacity="0.6" />
            <circle cx="4" cy="186" r="1" fill="#FFD700" />
            <circle cx="4" cy="186" r="0.4" fill="#FFFFFF" />
            {/* 右下角 L 形角标 */}
            <path d="M426 186 L426 172 M426 186 L412 186" stroke="#00F5D4" strokeWidth="1" fill="none" opacity="0.8" />
            <path d="M426 186 L426 180 M426 186 L420 186" stroke="#FFFFFF" strokeWidth="0.4" fill="none" opacity="0.6" />
            <circle cx="426" cy="186" r="1" fill="#00F5D4" />
            <circle cx="426" cy="186" r="0.4" fill="#FFFFFF" />

            {/* === 中央 HUD 装饰组 === */}
            {/* 顶部状态条 */}
            <g opacity="0.7">
              <rect x="180" y="6" width="70" height="4" rx="1" fill="none" stroke="#9B59B6" strokeWidth="0.4" />
              <rect x="182" y="7.5" width="40" height="1" fill="#B026FF" opacity="0.8" />
              <circle cx="225" cy="8" r="0.8" fill="#FFD700" />
              <text x="215" y="11" fontSize="3" fill="#9B59B6" fontFamily="monospace" opacity="0.6">SYS.READY</text>
            </g>

            {/* 左侧数据柱 */}
            <g opacity="0.5">
              <rect x="10" y="60" width="3" height="60" fill="#1A0E2E" stroke="#9B59B6" strokeWidth="0.3" />
              <rect x="11" y="62" width="1" height="15" fill="#FF0080" opacity="0.8" />
              <rect x="11" y="80" width="1" height="20" fill="#FFD700" opacity="0.8" />
              <rect x="11" y="103" width="1" height="12" fill="#00F5D4" opacity="0.8" />
              <text x="16" y="68" fontSize="2.5" fill="#9B59B6" fontFamily="monospace">PWR</text>
              <text x="16" y="86" fontSize="2.5" fill="#9B59B6" fontFamily="monospace">SYS</text>
              <text x="16" y="108" fontSize="2.5" fill="#9B59B6" fontFamily="monospace">NET</text>
            </g>

            {/* 右侧数据柱 */}
            <g opacity="0.5">
              <rect x="417" y="60" width="3" height="60" fill="#1A0E2E" stroke="#9B59B6" strokeWidth="0.3" />
              <rect x="418" y="64" width="1" height="18" fill="#00FF9D" opacity="0.8" />
              <rect x="418" y="85" width="1" height="22" fill="#00F5D4" opacity="0.8" />
              <rect x="418" y="110" width="1" height="8" fill="#FF8C00" opacity="0.8" />
              <text x="408" y="70" fontSize="2.5" fill="#9B59B6" fontFamily="monospace" textAnchor="end">CPU</text>
              <text x="408" y="92" fontSize="2.5" fill="#9B59B6" fontFamily="monospace" textAnchor="end">MEM</text>
              <text x="408" y="113" fontSize="2.5" fill="#9B59B6" fontFamily="monospace" textAnchor="end">GPU</text>
            </g>

            {/* === 中央十字准星装饰（功能区下方）=== */}
            <g opacity="0.45" transform="translate(215, 95)">
              {/* 外环 */}
              <circle cx="0" cy="0" r="18" fill="none" stroke="#9B59B6" strokeWidth="0.4" strokeDasharray="3,2" />
              <circle cx="0" cy="0" r="12" fill="none" stroke="#B026FF" strokeWidth="0.3" />
              {/* 十字 */}
              <line x1="-22" y1="0" x2="-8" y2="0" stroke="#00F5D4" strokeWidth="0.4" />
              <line x1="8" y1="0" x2="22" y2="0" stroke="#00F5D4" strokeWidth="0.4" />
              <line x1="0" y1="-22" x2="0" y2="-8" stroke="#00F5D4" strokeWidth="0.4" />
              <line x1="0" y1="8" x2="0" y2="22" stroke="#00F5D4" strokeWidth="0.4" />
              {/* 中心点 */}
              <circle cx="0" cy="0" r="1.5" fill="#FFD700" />
              <circle cx="0" cy="0" r="0.6" fill="#FFFFFF" />
              {/* 四角小三角 */}
              <path d="M-14 -14 L-10 -14 L-14 -10 Z" fill="#FF0080" opacity="0.6" />
              <path d="M14 -14 L10 -14 L14 -10 Z" fill="#00FF9D" opacity="0.6" />
              <path d="M-14 14 L-10 14 L-14 10 Z" fill="#FFD700" opacity="0.6" />
              <path d="M14 14 L10 14 L14 10 Z" fill="#00F5D4" opacity="0.6" />
            </g>

            {/* === 散落数据节点 === */}
            <g opacity="0.7">
              {/* 左侧散点 */}
              <circle cx="35" cy="25" r="1" fill="#FF0080" />
              <circle cx="35" cy="25" r="0.4" fill="#FFFFFF" />
              <circle cx="55" cy="55" r="0.7" fill="#FFD700" />
              <circle cx="75" cy="30" r="0.5" fill="#00F5D4" />
              <circle cx="95" cy="70" r="0.8" fill="#9B59B6" />
              <circle cx="115" cy="40" r="0.6" fill="#FFE600" />
              <circle cx="135" cy="80" r="0.5" fill="#FF8C00" />

              {/* 右侧散点 */}
              <circle cx="395" cy="25" r="1" fill="#00FF9D" />
              <circle cx="395" cy="25" r="0.4" fill="#FFFFFF" />
              <circle cx="375" cy="55" r="0.7" fill="#00F5D4" />
              <circle cx="355" cy="30" r="0.5" fill="#FFD700" />
              <circle cx="335" cy="70" r="0.8" fill="#FF0080" />
              <circle cx="315" cy="40" r="0.6" fill="#9B59B6" />
              <circle cx="295" cy="80" r="0.5" fill="#FFE600" />

              {/* 底部散点 */}
              <circle cx="40" cy="160" r="0.8" fill="#FF2D55" />
              <circle cx="90" cy="175" r="0.6" fill="#00F5D4" />
              <circle cx="150" cy="165" r="0.7" fill="#FFD700" />
              <circle cx="280" cy="165" r="0.7" fill="#00FF9D" />
              <circle cx="340" cy="175" r="0.6" fill="#9B59B6" />
              <circle cx="390" cy="160" r="0.8" fill="#FF8C00" />
            </g>

            {/* === 连接线段（装饰）=== */}
            <g opacity="0.4" stroke="#00F5D4" strokeWidth="0.25" fill="none">
              <path d="M35 25 L55 55 L75 30" />
              <path d="M395 25 L375 55 L355 30" />
              <path d="M40 160 L90 175 L150 165" />
              <path d="M280 165 L340 175 L390 160" />
            </g>

            {/* === 顶部状态指示器 === */}
            <g opacity="0.6">
              <circle cx="60" cy="8" r="1" fill="#00FF9D" />
              <text x="64" y="10" fontSize="3" fill="#00FF9D" fontFamily="monospace">ONLINE</text>

              <circle cx="335" cy="8" r="1" fill="#FFD700" />
              <text x="339" y="10" fontSize="3" fill="#FFD700" fontFamily="monospace">v2.4.7</text>
            </g>
          </svg>

          {/* 内容层 */}
          <div className="relative w-full h-full flex flex-col" style={{ zIndex: 1 }}>
            {/* 功能区：110px（仅战斗时显示） */}
            {view !== 'menu' && (
              <div
                style={{
                  height: FUNC_PANEL_HEIGHT,
                  borderBottom: '1px solid rgba(176, 38, 255, 0.15)',
                }}
              >
                <QuickBars engineRef={engineRef as any} />
              </div>
            )}
            {/* 按钮区：50px，圆形立体按钮，靠右对齐，左右边距-10px */}
            <div
              className="flex items-end justify-end gap-1"
              style={{
                height: BTN_PANEL_HEIGHT,
                padding: '2px 10px 0px 0px',
              }}
            >
              {buttons.filter(btn => view !== 'menu' || (btn.id !== 'restart' && btn.id !== 'home')).map((btn) => {
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
        </div>

        {/* 人物面板浮层：固定高度 266px */}
        {activePanel === 'character' && (
          <div
            className="absolute left-0 right-0 z-[60]"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: CHAR_PANEL_HEIGHT,
            }}
          >
            {/* 遮罩层：点击关闭 */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(10, 8, 20, 0.35)' }}
              onClick={() => setActivePanel(null)}
            />
            {/* 内容容器：阻止冒泡 */}
            <div
              className="relative w-full h-full"
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
            className="absolute left-0 right-0 z-[60]"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: BAG_PANEL_HEIGHT,
            }}
          >
            {/* 遮罩层：点击关闭 */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(10, 8, 20, 0.35)' }}
              onClick={() => setActivePanel(null)}
            />
            {/* 内容容器：阻止冒泡 */}
            <div
              className="relative w-full h-full"
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
                  <InventoryPanel engineRef={engineRef} view={view} />
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
            className="absolute left-0 right-0 z-[60]"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: SKILL_PANEL_HEIGHT,
            }}
          >
            {/* 遮罩层：点击关闭 */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(10, 8, 20, 0.35)' }}
              onClick={() => setActivePanel(null)}
            />
            {/* 内容容器：阻止冒泡 */}
            <div
              className="relative w-full h-full"
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
            className="absolute left-0 right-0 z-[60]"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: CODEX_PANEL_HEIGHT,
            }}
          >
            {/* 遮罩层：点击关闭 */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(10, 8, 20, 0.35)' }}
              onClick={() => setActivePanel(null)}
            />
            {/* 内容容器：阻止冒泡 */}
            <div
              className="relative w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <TabPanel
                tabs={[{ id: 'codex', label: '图鉴', icon: '\uD83D\uDCD6' }]}
                activeTab="codex"
                onTabChange={() => {}}
                onClose={() => setActivePanel(null)}
              >
                <CodexPanel engineRef={engineRef as any} />
              </TabPanel>
            </div>
          </div>
        )}

        {/* 邮件浮层：固定高度 266px */}
        {activePanel === 'mail' && (
          <div
            className="absolute left-0 right-0 z-[60]"
            style={{
              bottom: BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT,
              height: MAIL_PANEL_HEIGHT,
            }}
          >
            {/* 遮罩层：点击关闭 */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(10, 8, 20, 0.35)' }}
              onClick={() => setActivePanel(null)}
            />
            {/* 内容容器：阻止冒泡 */}
            <div
              className="relative w-full h-full"
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

        {/* 返回主界面确认弹窗（按 RestartConfirmModal 模板，neonPurple 配色） */}
        {backToMenuConfirm && (
          <div
            className="absolute inset-0 flex items-center justify-center z-[90]"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setBackToMenuConfirm(false)}
          >
            <div
              className="relative p-5"
              style={{
                width: '260px',
                background: 'rgba(19, 16, 37, 0.95)',
                border: `1px solid ${neonPurple}40`,
                borderRadius: '14px',
                boxShadow: `0 0 30px ${neonPurple}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
                backdropFilter: 'blur(12px)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* HUD 背景：与按钮区不同纹路/颜色 */}
              <ModalHudBackground accentColor={neonPurple} accentColor2={neonCyan} />
              <div className="relative" style={{ zIndex: 1 }}>
              {/* 图标 */}
              <div className="flex flex-col items-center mb-4">
                <div
                  className="mb-2"
                  style={{
                    filter: `drop-shadow(0 0 8px ${neonPurple}80)`,
                    fontSize: '28px',
                    lineHeight: 1,
                  }}
                >
                  ⌂
                </div>
                <h2
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    fontSize: '14px',
                    color: neonPurple,
                    textShadow: `0 0 8px ${neonPurple}60`,
                  }}
                >
                  是否返回主界面？
                </h2>
                <p style={{
                  fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  fontSize: '8px',
                  color: '#8B80A0',
                  marginTop: '4px',
                }}>
                  当前战斗进度将丢失，装备与等级会保留
                </p>
              </div>

              {/* 按钮 */}
              <div className="flex gap-2.5">
                <button
                  style={{
                    flex: 1,
                    background: 'rgba(176, 38, 255, 0.15)',
                    border: `1px solid ${neonPurple}50`,
                    borderRadius: '8px',
                    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    fontSize: '11px',
                    color: neonPurple,
                    boxShadow: `0 0 10px ${neonPurple}20`,
                    padding: '8px 0',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(176, 38, 255, 0.28)';
                    e.currentTarget.style.boxShadow = `0 0 16px ${neonPurple}45`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(176, 38, 255, 0.15)';
                    e.currentTarget.style.boxShadow = `0 0 10px ${neonPurple}20`;
                  }}
                  onClick={() => {
                    handleBackToMenu();
                    setBackToMenuConfirm(false);
                  }}
                >
                  确定
                </button>
                <button
                  style={{
                    flex: 1,
                    background: 'rgba(100, 100, 130, 0.15)',
                    border: `1px solid rgba(150, 150, 180, 0.35)`,
                    borderRadius: '8px',
                    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                    fontWeight: 700,
                    letterSpacing: '1px',
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
                  onClick={() => setBackToMenuConfirm(false)}
                >
                  返回
                </button>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* 日常挑战：点击主界面时的结算确认弹窗（按 RestartConfirmModal 模板，neonYellow 配色） */}
        {dailySettleConfirm && (
          <div
            className="absolute inset-0 flex items-center justify-center z-[90]"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setDailySettleConfirm(false)}
          >
            <div
              className="relative p-5"
              style={{
                width: '260px',
                background: 'rgba(19, 16, 37, 0.95)',
                border: `1px solid ${neonYellow}40`,
                borderRadius: '14px',
                boxShadow: `0 0 30px ${neonYellow}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
                backdropFilter: 'blur(12px)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* HUD 背景：与按钮区不同纹路/颜色 */}
              <ModalHudBackground accentColor={neonYellow} accentColor2={neonPurple} />
              <div className="relative" style={{ zIndex: 1 }}>
              <div className="flex flex-col items-center mb-4">
                <div
                  className="mb-2"
                  style={{
                    filter: `drop-shadow(0 0 8px ${neonYellow}80)`,
                    fontSize: '28px',
                    lineHeight: 1,
                  }}
                >
                  🏆
                </div>
                <h2
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    fontSize: '14px',
                    color: neonYellow,
                    textShadow: `0 0 8px ${neonYellow}60`,
                  }}
                >
                  是否结算退出？
                </h2>
                <p
                  style={{
                    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    fontSize: '8px',
                    color: '#8B80A0',
                    marginTop: '4px',
                  }}
                >
                  将根据击杀数结算金币与经验书奖励
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  style={{
                    flex: 1,
                    background: 'rgba(255, 217, 61, 0.15)',
                    border: `1px solid ${neonYellow}50`,
                    borderRadius: '8px',
                    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    fontSize: '11px',
                    color: neonYellow,
                    boxShadow: `0 0 10px ${neonYellow}20`,
                    padding: '8px 0',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 217, 61, 0.28)';
                    e.currentTarget.style.boxShadow = `0 0 16px ${neonYellow}45`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 217, 61, 0.15)';
                    e.currentTarget.style.boxShadow = `0 0 10px ${neonYellow}20`;
                  }}
                  onClick={() => {
                    setDailySettleConfirm(false);
                    engineRef.current?.exitDailyManually();
                  }}
                >
                  结算
                </button>
                <button
                  style={{
                    flex: 1,
                    background: 'rgba(100, 100, 130, 0.15)',
                    border: '1px solid rgba(150, 150, 180, 0.35)',
                    borderRadius: '8px',
                    fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
                    fontWeight: 700,
                    letterSpacing: '1px',
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
                  onClick={() => setDailySettleConfirm(false)}
                >
                  返回
                </button>
              </div>
              </div>
            </div>
          </div>
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

        {/* 游戏结束弹窗：炼狱/材料副本胜利时显示结算界面，否则显示普通GameOverModal（仅在 battle 视图显示） */}
        {view === 'battle' && (isPurgatorySettlement ? (
          <PurgatorySettlement
            isOpen={true}
            rewards={engineRef.current?.getPurgatoryRewards() ?? []}
            bossElement={engineRef.current?.getPurgatoryBossElement() ?? null}
            remainingChallenges={Math.max(0, (engineRef.current?.PURGATORY_DAILY_LIMIT ?? 5) - (engineRef.current?.getPurgatoryChallengeCount() ?? 0))}
            maxChallenges={engineRef.current?.PURGATORY_DAILY_LIMIT ?? 5}
            onRestart={() => {
              engineRef.current?.claimPurgatoryRewards();
              engineRef.current?.restartWithMode('purgatory' as any);
            }}
            onBackToMenu={() => {
              engineRef.current?.claimPurgatoryRewards();
              engineRef.current?.exitPurgatorySettlement();
              handleBackToMenu();
            }}
          />
        ) : isMaterialSettlement ? (
          <MaterialSettlement
            isOpen={true}
            rewards={engineRef.current?.getMaterialRewards() ?? []}
            remainingChallenges={Math.max(0, (engineRef.current?.MATERIAL_DAILY_LIMIT ?? 5) - (engineRef.current?.getMaterialChallengeCount() ?? 0))}
            maxChallenges={engineRef.current?.MATERIAL_DAILY_LIMIT ?? 5}
            onRestart={() => {
              engineRef.current?.claimMaterialRewards();
              engineRef.current?.restartWithMode('material' as any);
            }}
            onBackToMenu={() => {
              engineRef.current?.claimMaterialRewards();
              engineRef.current?.exitMaterialSettlement();
              handleBackToMenu();
            }}
          />
        ) : isDailySettlement ? (
          <DailySettlement
            isOpen={true}
            killStats={engineRef.current?.getDailyKillStats() ?? { normal: 0, elite: 0, boss: 0 }}
            rewards={engineRef.current?.getDailyRewards() ?? { gold: 0, books: [] }}
            onRestart={() => {
              engineRef.current?.claimDailyRewards();
              engineRef.current?.restartWithMode('daily' as any);
            }}
            onBackToMenu={() => {
              engineRef.current?.claimDailyRewards();
              engineRef.current?.exitDailySettlement();
              handleBackToMenu();
            }}
          />
        ) : (
          <GameOverModal
            onRestart={() => {
              engineRef.current?.restartCurrentWave();
            }}
            onBackToMenu={handleBackToMenu}
          />
        ))}

        {/* 主界面：覆盖上方区域，底部留出按钮区+占位框空间 */}
        {view === 'menu' && (
          <MainMenu onEnterStage={handleEnterStage} engineRef={engineRef} bottomInset={BTN_PANEL_HEIGHT + BOTTOM_FOOTER_HEIGHT} onModalOpenChange={setMenuModalOpen} />
        )}

        {/* 主界面状态栏：仅显示等级/战斗力/血量/经验条，位于主界面之上 */}
        {view === 'menu' && activePanel === null && !menuModalOpen && (
          <StatusBar engineRef={engineRef} view="menu" />
        )}

        {/* 游戏内悬浮提示：道具使用、升级等，跨视图显示 */}
        <GameToast />
      </div>
    </div>
  );
}

export default App;
