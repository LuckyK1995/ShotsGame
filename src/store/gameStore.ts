import { create } from 'zustand';
import type { Player, GameState, ItemStack, Skill, Equipment, Buff, Talent, ActiveSkill, WeatherState, CodexEntry, Achievement } from '../game/types/game';

interface GameStore {
  gameState: GameState | null;
  player: Player | null;
  inventory: ItemStack[];
  skills: Skill[];
  equipment: Equipment[];
  equipmentStorage: Equipment[];
  buffs: Buff[];
  activeSkills: ActiveSkill[];
  talentChoices: Talent[];
  showTalentSelection: boolean;
  weather: WeatherState;
  codexEntries: CodexEntry[];
  achievements: Achievement[];
  unlockedAchievement: Achievement | null;
  
  setGameState: (state: GameState, player: Player) => void;
  setPlayer: (player: Player) => void;
  setInventory: (inventory: ItemStack[]) => void;
  setSkills: (skills: Skill[]) => void;
  setEquipment: (equipment: Equipment[]) => void;
  setEquipmentStorage: (storage: Equipment[]) => void;
  setBuffs: (buffs: Buff[]) => void;
  setActiveSkills: (skills: ActiveSkill[]) => void;
  setTalentChoices: (choices: Talent[]) => void;
  setShowTalentSelection: (show: boolean) => void;
  setWeather: (weather: WeatherState) => void;
  setCodexEntries: (entries: CodexEntry[]) => void;
  setAchievements: (achievements: Achievement[]) => void;
  setUnlockedAchievement: (achievement: Achievement | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  player: null,
  inventory: [],
  skills: [],
  equipment: [],
  equipmentStorage: [],
  buffs: [],
  activeSkills: [],
  talentChoices: [],
  showTalentSelection: false,
  weather: { type: 'clear', duration: 0, intensity: 0, transitionTimer: 0 },
  codexEntries: [],
  achievements: [],
  unlockedAchievement: null,
  
  setGameState: (gameState, player) => set({ gameState, player }),
  setPlayer: (player) => set({ player }),
  setInventory: (inventory) => set({ inventory }),
  setSkills: (skills) => set({ skills }),
  setEquipment: (equipment) => set({ equipment }),
  setEquipmentStorage: (storage) => set({ equipmentStorage: storage }),
  setBuffs: (buffs) => set({ buffs }),
  setActiveSkills: (activeSkills) => set({ activeSkills }),
  setTalentChoices: (talentChoices) => set({ talentChoices }),
  setShowTalentSelection: (showTalentSelection) => set({ showTalentSelection }),
  setWeather: (weather) => set({ weather }),
  setCodexEntries: (codexEntries) => set({ codexEntries }),
  setAchievements: (achievements) => set({ achievements }),
  setUnlockedAchievement: (unlockedAchievement) => set({ unlockedAchievement }),
}));
