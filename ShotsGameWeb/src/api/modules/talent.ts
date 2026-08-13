// 天赋 API
import { http } from '../client';

export interface Talent {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary';
  stat: string;
  value: number;
  description: string;
}

export interface TalentChoicesOutput {
  choices: Talent[];
  hasPendingChoice: boolean;
}

export interface ChooseTalentInput {
  talentId: string;
}

export const talentApi = {
  getChoices: () => http.get<TalentChoicesOutput>('/talent/choices'),
  getOwned: () => http.get<Talent[]>('/talent/owned'),
  choose: (input: ChooseTalentInput) => http.post<Talent>('/talent/choose', input),
};
