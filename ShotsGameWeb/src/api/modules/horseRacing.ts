// 赛马 API
import { http } from '../client';

export interface Horse {
  id: number;
  name: string;
  color: string;
  odds: number;
}

export interface RaceRound {
  round: number;
  horses: Horse[];
  winners: Horse[];
  status: 'idle' | 'countdown' | 'racing' | 'highlight' | 'done';
  countdown: number;
}

export interface RaceSession {
  id: string;
  horses: Horse[];
  rounds: RaceRound[];
  bets: Array<{ horseId: number; amount: number }>;
  totalBet: number;
  status: 'betting' | 'running' | 'finished';
  champion: Horse | null;
  goldWon: number;
}

export interface PlaceHorseBetInput {
  horseId: number;
  amount: number;
}

export interface CancelHorseBetInput {
  horseId: number;
}

export interface StartRaceOutput {
  success: boolean;
  message: string | null;
}

export interface RaceResultOutput {
  champion: Horse | null;
  goldWon: number;
  rounds: RaceRound[];
}

export const horseRacingApi = {
  createSession: () => http.post<RaceSession>('/horse-racing/create-session'),
  getSession: (sessionId: string) => http.get<RaceSession>(`/horse-racing/session/${sessionId}`),
  placeBet: (sessionId: string, input: PlaceHorseBetInput) =>
    http.post<RaceSession>(`/horse-racing/session/${sessionId}/bet`, input),
  cancelBet: (sessionId: string, input: CancelHorseBetInput) =>
    http.post<RaceSession>(`/horse-racing/session/${sessionId}/cancel-bet`, input),
  startRace: (sessionId: string) =>
    http.post<StartRaceOutput>(`/horse-racing/session/${sessionId}/start`),
  getResult: (sessionId: string) =>
    http.get<RaceResultOutput>(`/horse-racing/session/${sessionId}/result`),
};
