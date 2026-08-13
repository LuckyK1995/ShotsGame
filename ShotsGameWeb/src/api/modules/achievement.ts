// 成就 API
import { http } from '../client';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  claimed: boolean;
  category: 'system' | 'level';
  progress: number;
  target: number;
  reward: string;
  rewardValue: number;
}

export interface AchievementListOutput {
  achievements: Achievement[];
  totalUnlocked: number;
  totalClaimed: number;
  claimableCount: number;
}

export interface ClaimAchievementInput {
  achievementId: string;
}

export interface ClaimAchievementOutput {
  success: boolean;
  achievement: Achievement;
  rewardType: 'gold' | 'skillPoints';
  rewardValue: number;
  goldRemaining: number;
  skillPointsRemaining: number;
  message: string | null;
}

export const achievementApi = {
  getList: () => http.get<AchievementListOutput>('/achievement/list'),
  claim: (input: ClaimAchievementInput) =>
    http.post<ClaimAchievementOutput>('/achievement/claim', input),
  updateProgress: (achievementId: string, increment: number) =>
    http.post('/achievement/update-progress', undefined, {
      query: { achievementId, increment },
    }),
};
