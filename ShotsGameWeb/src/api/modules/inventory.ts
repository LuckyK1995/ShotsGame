// 背包 API
import { http } from '../client';

export interface ItemStack {
  itemId: string;
  count: number;
}

export interface InventoryOutput {
  items: ItemStack[];
  gemInventory: ItemStack[];
  enhanceItemInventory: ItemStack[];
  enchantItemInventory: ItemStack[];
  capacity: {
    equipment: number;
    inventory: number;
    gem: number;
    enhance: number;
    enchant: number;
  };
}

export interface AddItemInput {
  itemId: string;
  count: number;
}

export interface RemoveItemInput {
  itemId: string;
  count: number;
}

export interface SellItemsInput {
  itemIds: string[];
  counts?: Record<string, number>;
}

export interface SellItemsOutput {
  goldGained: number;
  goldRemaining: number;
  message: string | null;
}

export const inventoryApi = {
  getAll: () => http.get<InventoryOutput>('/inventory/all'),
  add: (input: AddItemInput) => http.post<ItemStack>('/inventory/add', input),
  remove: (input: RemoveItemInput) => http.post<ItemStack>('/inventory/remove', input),
  sell: (input: SellItemsInput) => http.post<SellItemsOutput>('/inventory/sell', input),
};
