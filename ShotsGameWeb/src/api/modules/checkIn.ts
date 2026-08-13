// 签到 API
import { http } from '../client';

export interface CheckInOutput {
  checkInDays: number[];
  weekKey: string;
  consecutiveDays: number;
  hasCheckedToday: boolean;
  todayIndex: number;
}

export interface WeekRewardsOutput {
  rewards: Array<{ day: number; itemId: string; itemName: string; count: number; gold: number }>;
}

export interface DoCheckInOutput {
  success: boolean;
  day: number;
  reward: { itemId: string; count: number; gold: number };
  consecutiveDays: number;
  message: string | null;
}

export const checkInApi = {
  getStatus: () => http.get<CheckInOutput>('/checkin/status'),
  getWeekRewards: () => http.get<WeekRewardsOutput>('/checkin/week-rewards'),
  doCheckIn: () => http.post<DoCheckInOutput>('/checkin/check'),
};
