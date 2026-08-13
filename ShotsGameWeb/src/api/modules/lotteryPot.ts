// 抽奖罐 API
import { http } from '../client';

export interface LotteryPotOutput {
  potCount: number;
  rewards: Array<{ type: string; itemId?: string; gold?: number; exp?: number; count: number; name: string }>;
}

export interface UseLotteryPotInput {
  count?: number;
}

export interface UseLotteryPotOutput {
  success: boolean;
  rewards: Array<{ type: string; itemId?: string; gold?: number; exp?: number; count: number; name: string }>;
  potRemaining: number;
  goldGained: number;
  expGained: number;
}

export const lotteryPotApi = {
  getStatus: () => http.get<LotteryPotOutput>('/lottery-pot/status'),
  use: (input: UseLotteryPotInput) => http.post<UseLotteryPotOutput>('/lottery-pot/use', input),
};
