// 在线奖励 API
import { http } from '../client';

export interface OnlineRewardTier {
  tier: number;
  requiredMinutes: number;
  itemId: string;
  itemName: string;
  count: number;
  gold: number;
  claimed: boolean;
}

export interface OnlineRewardOutput {
  onlineMinutes: number;
  claimedLevel: number;
  tiers: OnlineRewardTier[];
  nextTierMinutes: number | null;
  allClaimed: boolean;
}

export interface ClaimOnlineRewardOutput {
  success: boolean;
  tier: number;
  reward: { itemId: string; count: number; gold: number };
  message: string | null;
}

export const onlineRewardApi = {
  getStatus: (minutes = 0) =>
    http.get<OnlineRewardOutput>('/online-reward/status', { query: { minutes } }),
  claim: (tier: number) => http.post<ClaimOnlineRewardOutput>(`/online-reward/claim/${tier}`),
};
