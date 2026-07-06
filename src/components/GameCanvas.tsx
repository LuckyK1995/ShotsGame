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
  const {
    setGameState, setPlayer, setInventory, setSkills,
    setEquipment, setEquipmentStorage, setBuffs,
    setActiveSkills, setTalentChoices, setWeather,
    setShowTalentSelection,
    setCodexEntries, setAchievements, setUnlockedAchievement,
    addRareDropNotification
  } = useGameStore();

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

    engine.onStateChange = (state, player) => {
      setGameState({ ...state }, { ...player });
    };

    engine.onPlayerChange = (player) => {
      setPlayer({ ...player });
    };

    engine.onInventoryChange = (inventory) => {
      setInventory([...inventory]);
    };

    engine.onSkillsChange = (skills) => {
      setSkills([...skills]);
    };

    engine.onEquipmentChange = (equipment) => {
      setEquipment([...equipment]);
    };

    engine.onEquipmentStorageChange = (storage) => {
      setEquipmentStorage([...storage]);
    };

    engine.onBuffsChange = (buffs) => {
      setBuffs([...buffs]);
    };

    engine.onTalentSelection = (choices) => {
      setTalentChoices([...choices]);
      setShowTalentSelection(true);
    };

    engine.onWeatherChange = (weather) => {
      setWeather({ ...weather });
    };

    engine.onCodexChange = (entries) => {
      setCodexEntries([...entries]);
    };

    engine.onAchievementsChange = (achievements) => {
      setAchievements([...achievements]);
    };

    engine.onAchievementUnlock = (achievement) => {
      setUnlockedAchievement({ ...achievement });
    };

    engine.onRareDrop = (info) => {
      addRareDropNotification(info);
    };

    setInventory([...engine.inventory]);
    setSkills([...engine.skills]);
    setEquipment([...engine.equipment]);
    setEquipmentStorage([...engine.equipmentStorage]);
    setActiveSkills([...engine.getActiveSkills()]);
    setWeather({ ...engine.getWeather() });
    setCodexEntries([...engine.getCodexEntries()]);
    setAchievements([...engine.getAchievements()]);

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
  }, [setGameState, setPlayer, setInventory, setSkills,
      setEquipment, setEquipmentStorage, setBuffs,
      setActiveSkills, setTalentChoices, setWeather,
      setShowTalentSelection,
      setCodexEntries, setAchievements, setUnlockedAchievement,
      addRareDropNotification]);

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
