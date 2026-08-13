// 装备 API
import { http } from '../client';

export interface EquipmentAffix {
  id: string;
  name: string;
  value: number;
  type: string;
  element?: string;
}

export interface SocketedGem {
  gemId: string;
  type: string;
  rarity: string;
  value: number;
}

export interface Enchantment {
  stat: string;
  rarity: string;
  percent: number;
}

export interface Equipment {
  id: string;
  name: string;
  slot: string;
  rarity: string;
  level: number;
  attack?: number;
  attackSpeed?: number;
  range?: number;
  health?: number;
  defense?: number;
  critRate?: number;
  critDamage?: number;
  pierce?: number;
  icon: string;
  iconVariant: number;
  description: string;
  setBonus?: string;
  durability?: number;
  maxDurability?: number;
  affixes?: EquipmentAffix[];
  element?: string;
  elementalDamage?: number;
  socketedGems?: SocketedGem[];
  enhanceLevel?: number;
  enchantment?: Enchantment;
}

export interface EquipItemInput {
  equipmentId: string;
}

export interface UnequipItemInput {
  slot: string;
}

export interface GenerateEquipmentInput {
  slot?: string;
  rarity?: string;
  level?: number;
  enemyType?: string;
}

export interface EnhanceEquipmentInput {
  equipmentId: string;
  mode?: string;
  enhanceItemId?: string;
}

export interface EnhanceResultOutput {
  success: boolean;
  equipment: Equipment;
  newLevel: number;
  goldCost: number;
  message: string | null;
}

export interface EnchantEquipmentInput {
  equipmentId: string;
  enchantItemId: string;
}

export interface EnchantResultOutput {
  success: boolean;
  equipment: Equipment;
  message: string | null;
}

export interface SocketGemInput {
  equipmentId: string;
  gemId: string;
}

export interface GemSocketResultOutput {
  success: boolean;
  equipment: Equipment;
  gemsRemaining: number;
  message: string | null;
}

export interface DecomposeEquipmentInput {
  equipmentIds: string[];
}

export interface DecomposeOutput {
  goldGained: number;
  goldRemaining: number;
  message: string | null;
}

export interface TransferEnhanceInput {
  sourceEquipmentId: string;
  targetEquipmentId: string;
}

export const equipmentApi = {
  getEquipped: () => http.get<Equipment[]>('/equipment/equipped'),
  getStorage: () => http.get<Equipment[]>('/equipment/storage'),
  get: (id: string) => http.get<Equipment>(`/equipment/${id}`),
  equip: (input: EquipItemInput) => http.post<Equipment>('/equipment/equip', input),
  unequip: (input: UnequipItemInput) => http.post<Equipment>('/equipment/unequip', input),
  generate: (input: GenerateEquipmentInput) => http.post<Equipment>('/equipment/generate', input),
  enhance: (input: EnhanceEquipmentInput) => http.post<EnhanceResultOutput>('/equipment/enhance', input),
  enchant: (input: EnchantEquipmentInput) => http.post<EnchantResultOutput>('/equipment/enchant', input),
  socketGem: (input: SocketGemInput) => http.post<GemSocketResultOutput>('/equipment/socket-gem', input),
  decompose: (input: DecomposeEquipmentInput) => http.post<DecomposeOutput>('/equipment/decompose', input),
  transferEnhance: (input: TransferEnhanceInput) =>
    http.post<EnhanceResultOutput>('/equipment/transfer-enhance', input),
};
