// 图鉴 API
import { http } from '../client';

export interface CodexEntry {
  id: string;
  type: 'enemy' | 'equipment' | 'item';
  name: string;
  discovered: boolean;
  kills?: number;
  obtained?: number;
  description: string;
}

export interface CodexOutput {
  entries: CodexEntry[];
  totalDiscovered: number;
  totalEntries: number;
}

export interface UpdateCodexInput {
  entryId: string;
  increment?: number;
  obtained?: number;
}

export interface CodexEntryOutput {
  entry: CodexEntry;
  message: string | null;
}

export const codexApi = {
  getAll: () => http.get<CodexOutput>('/codex/all'),
  update: (input: UpdateCodexInput) => http.post<CodexEntryOutput>('/codex/update', input),
};
