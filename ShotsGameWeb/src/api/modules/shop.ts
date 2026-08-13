// 商店 API
import { http } from '../client';

export interface ShopItem {
  id: string;
  type: 'refill' | 'item' | 'equipment';
  price: number;
  sold: boolean;
  itemId?: string;
  equipment?: unknown;
}

export interface ShopOutput {
  items: ShopItem[];
  refreshCost: number;
  currentWave: number;
}

export interface BuyShopItemInput {
  itemId: string;
  currentWave?: number;
}

export interface ShopItemOutput {
  success: boolean;
  message: string | null;
  shop?: ShopOutput;
}

export interface RefreshShopOutput {
  items: ShopItem[];
  refreshCost: number;
  goldRemaining: number;
}

export const shopApi = {
  getShop: (currentWave = 1) => http.get<ShopOutput>('/shop', { query: { currentWave } }),
  buyItem: (input: BuyShopItemInput) => http.post<ShopItemOutput>('/shop/buy', input),
  refreshShop: (currentWave = 1) =>
    http.post<RefreshShopOutput>('/shop/refresh', undefined, { query: { currentWave } }),
};
