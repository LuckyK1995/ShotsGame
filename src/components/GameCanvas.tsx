import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { GameEngine } from '../game/GameEngine';
import { useGameStore } from '../store/gameStore';

export interface GameCanvasHandle {
  engine: GameEngine | null;
}

export const GameCanvas = forwardRef<GameCanvasHandle>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  // 性能优化：使用细粒度 selector 订阅各 action（actions 在 zustand 中引用稳定）
  const setGameState = useGameStore(s => s.setGameState);
  const setPlayer = useGameStore(s => s.setPlayer);
  const setInventory = useGameStore(s => s.setInventory);
  const setSkills = useGameStore(s => s.setSkills);
  const setEquipment = useGameStore(s => s.setEquipment);
  const setEquipmentStorage = useGameStore(s => s.setEquipmentStorage);
  const setBuffs = useGameStore(s => s.setBuffs);
  const setActiveSkills = useGameStore(s => s.setActiveSkills);
  const setTalentChoices = useGameStore(s => s.setTalentChoices);
  const setWeather = useGameStore(s => s.setWeather);
  const setShowTalentSelection = useGameStore(s => s.setShowTalentSelection);
  const setCodexEntries = useGameStore(s => s.setCodexEntries);
  const setAchievements = useGameStore(s => s.setAchievements);
  const setUnlockedAchievement = useGameStore(s => s.setUnlockedAchievement);
  const setGemInventory = useGameStore(s => s.setGemInventory);
  const setEnhanceItemInventory = useGameStore(s => s.setEnhanceItemInventory);
  const setEnchantItemInventory = useGameStore(s => s.setEnchantItemInventory);
  const addRareDropNotification = useGameStore(s => s.addRareDropNotification);
  const setMails = useGameStore(s => s.setMails);

  // 将所有 action 收集到一个稳定引用中（zustand 的 actions 引用稳定）
  const actionsRef = useRef({
    setGameState, setPlayer, setInventory, setSkills,
    setEquipment, setEquipmentStorage, setBuffs,
    setActiveSkills, setTalentChoices, setWeather,
    setShowTalentSelection, setCodexEntries, setAchievements,
    setUnlockedAchievement, setGemInventory,
    setEnhanceItemInventory, setEnchantItemInventory,
    addRareDropNotification, setMails,
  });

  useImperativeHandle(ref, () => ({
    get engine() {
      return engineRef.current;
    },
  }));

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // 初始尺寸：取容器实际大小，最小回退到 430x600
    const initWidth = Math.max(container.clientWidth || 430, 1);
    const initHeight = Math.max(container.clientHeight || 600, 1);
    canvas.width = initWidth;
    canvas.height = initHeight;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    const A = actionsRef.current;

    engine.onStateChange = (state, player) => {
      A.setGameState({ ...state }, { ...player });
    };

    engine.onPlayerChange = (player) => {
      A.setPlayer({ ...player });
    };

    engine.onInventoryChange = (inventory) => {
      A.setInventory([...inventory]);
    };

    engine.onGemInventoryChange = (gems) => {
      A.setGemInventory([...gems]);
    };

    engine.onEnhanceItemInventoryChange = (items) => {
      A.setEnhanceItemInventory([...items]);
    };

    engine.onEnchantItemInventoryChange = (items) => {
      A.setEnchantItemInventory([...items]);
    };

    engine.onSkillsChange = (skills) => {
      A.setSkills([...skills]);
    };

    engine.onEquipmentChange = (equipment) => {
      A.setEquipment([...equipment]);
    };

    engine.onEquipmentStorageChange = (storage) => {
      A.setEquipmentStorage([...storage]);
    };

    engine.onBuffsChange = (buffs) => {
      A.setBuffs([...buffs]);
    };

    engine.onTalentSelection = (choices) => {
      A.setTalentChoices([...choices]);
      A.setShowTalentSelection(true);
    };

    engine.onWeatherChange = (weather) => {
      A.setWeather({ ...weather });
    };

    engine.onCodexChange = (entries) => {
      A.setCodexEntries([...entries]);
    };

    engine.onAchievementsChange = (achievements) => {
      A.setAchievements([...achievements]);
    };

    engine.onAchievementUnlock = (achievement) => {
      A.setUnlockedAchievement({ ...achievement });
    };

    engine.onRareDrop = (info) => {
      A.addRareDropNotification(info);
    };

    engine.onMailChange = (mails) => {
      A.setMails([...mails]);
    };

    A.setInventory([...engine.inventory]);
    A.setSkills([...engine.skills]);
    A.setEquipment([...engine.equipment]);
    A.setEquipmentStorage([...engine.equipmentStorage]);
    A.setGemInventory([...engine.gemInventory]);
    A.setEnhanceItemInventory([...engine.enhanceItemInventory]);
    A.setEnchantItemInventory([...engine.enchantItemInventory]);
    A.setActiveSkills([...engine.getActiveSkills()]);
    A.setWeather({ ...engine.getWeather() });
    A.setCodexEntries([...engine.getCodexEntries()]);
    A.setAchievements([...engine.getAchievements()]);
    A.setMails([...engine.getMails()]);

    engine.start();

    // 监听容器大小变化，自适应画布
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && engineRef.current) {
          engineRef.current.resize(Math.floor(width), Math.floor(height));
        }
      }
    });
    resizeObserver.observe(container);

    const handleClick = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (engineRef.current && !engineRef.current.gameState.isPaused) {
        engineRef.current.manualShoot();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const key = e.key.toUpperCase();
      if (key === 'Q') engineRef.current.useActiveSkill('dodge');
      if (key === 'E') engineRef.current.useActiveSkill('grenade');
      if (key === 'R') engineRef.current.useActiveSkill('drone');
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      engine.stop();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'crosshair',
          display: 'block',
        }}
      />
    </div>
  );
});

GameCanvas.displayName = 'GameCanvas';
