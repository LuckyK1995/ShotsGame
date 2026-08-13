// 技能 API
import { http } from '../client';

export interface Skill {
  id: string;
  level: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  requiredLevel: number;
  cost: number;
  category: string;
  prerequisite?: string;
}

export interface SkillTreeOutput {
  learned: Skill[];
  definitions: SkillDefinition[];
  skillPoints: number;
}

export interface UpgradeSkillInput {
  skillId: string;
}

export interface DowngradeSkillInput {
  skillId: string;
}

export interface SkillOutput {
  skill: Skill;
  skillPoints: number;
  message: string | null;
}

export const skillApi = {
  getTree: () => http.get<SkillTreeOutput>('/skill/tree'),
  upgrade: (input: UpgradeSkillInput) => http.post<SkillOutput>('/skill/upgrade', input),
  downgrade: (input: DowngradeSkillInput) => http.post<SkillOutput>('/skill/downgrade', input),
};
