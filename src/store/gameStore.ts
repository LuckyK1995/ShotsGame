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
  // 药水快捷栏：固定 4 格，存放药水 ItemStack（仅引用，物品栏内仍保留原物品）
  potionHotbar: (ItemStack | null)[];
  // 高品质掉落气泡通知（自动过期）
  rareDropNotifications: { id: number; rarity: string; name: string; icon: string; kind: 'equipment' | 'item' }[];
  
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
  setPotionHotbar: (hotbar: (ItemStack | null)[]) => void;
  addRareDropNotification: (info: { id: number; rarity: string; name: string; icon: string; kind: 'equipment' | 'item' }) => void;
  removeRareDropNotification: (id: number) => void;
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
  potionHotbar: [null, null, null, null],
  rareDropNotifications: [],
  
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
  setPotionHotbar: (potionHotbar) => set({ potionHotbar }),
  addRareDropNotification: (info) => set((state) => ({
    rareDropNotifications: [...state.rareDropNotifications, info].slice(-5),
  })),
  removeRareDropNotification: (id) => set((state) => ({
    rareDropNotifications: state.rareDropNotifications.filter(n => n.id !== id),
  })),
}));
