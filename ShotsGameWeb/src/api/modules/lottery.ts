// 水果机 API（跑马灯）
import { http } from '../client';

export interface LotteryOutput {
  lotteryCoins: number;
  bets: Record<string, number>;
  freeSpins: number;
  consecutiveLoginDays: number;
  luckyMissCounter: number;
  lastWin: number;
  history: number[];
  dailyCoinsClaimed: boolean;
}

export interface GiveDailyCoinsOutput {
  lotteryCoins: number;
  goldBonus: number;
  consecutiveLoginDays: number;
}

export interface PlaceBetInput {
  categoryId: string;
  amount: number;
}

export interface PlaceBetsBatchInput {
  bets: Record<string, number>;
}

export interface CancelBetInput {
  categoryId: string;
}

export interface ClearBetsOutput {
  refundedCoins: number;
  lotteryCoins: number;
}

export interface SpinOutput {
  cellIndex: number;
  winAmount: number;
  lotteryCoins: number;
  isLucky: boolean;
  luckyType: string | null;
  freeSpinEarned: number;
  rewards: Array<{ itemId?: string; gold?: number; count: number }>;
  history: number[];
  lastWin: number;
}

export const lotteryApi = {
  getStatus: () => http.get<LotteryOutput>('/lottery/status'),
  giveDailyCoins: () => http.post<GiveDailyCoinsOutput>('/lottery/give-daily-coins'),
  placeBet: (input: PlaceBetInput) => http.post<LotteryOutput>('/lottery/place-bet', input),
  placeBetsBatch: (input: PlaceBetsBatchInput) =>
    http.post<LotteryOutput>('/lottery/place-bets-batch', input),
  cancelBet: (input: CancelBetInput) => http.post<LotteryOutput>('/lottery/cancel-bet', input),
  clearBets: () => http.post<ClearBetsOutput>('/lottery/clear-bets'),
  spin: () => http.post<SpinOutput>('/lottery/spin'),
};
