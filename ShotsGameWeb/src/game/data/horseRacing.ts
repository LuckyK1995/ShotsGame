// 赛马玩法数据层

export interface Horse {
  id: number;
  name: string;
  emoji: string;
  color: string;
  odds: number; // 赔率
}

export interface BetRecord {
  horseId: number;
  amount: number;
}

export interface RaceRound {
  round: number; // 1=8进4, 2=4进2, 3=2进1
  horses: Horse[];
  winners: Horse[];
  status: 'idle' | 'countdown' | 'racing' | 'highlight' | 'done';
  countdown: number;
}

export interface RaceSession {
  id: string;
  horses: Horse[];
  rounds: RaceRound[];
  bets: BetRecord[];
  totalBet: number;
  status: 'betting' | 'running' | 'finished';
  champion: Horse | null;
  goldWon: number;
}

// 8匹预设赛马（基础赔率 1.5 ~ 15，每匹马保留实力档位特征）
// 每匹马用自定义SVG贴图渲染，不再使用emoji
// 实际开局时赔率会在基础值 ±25% 范围内随机浮动（clamp 到 1.5-15）
export const HORSE_PRESETS: Omit<Horse, 'id'>[] = [
  { name: '雷霆闪电', emoji: '', color: '#FF4757', odds: 2.0 },
  { name: '疾风之影', emoji: '', color: '#FF8C42', odds: 3.0 },
  { name: '赤焰流星', emoji: '', color: '#FF00FF', odds: 4.5 },
  { name: '幽冥暗影', emoji: '', color: '#9B59B6', odds: 6.5 },
  { name: '冰霜骏马', emoji: '', color: '#00F5D4', odds: 8.5 },
  { name: '黄金征途', emoji: '', color: '#FFD700', odds: 10.5 },
  { name: '狂野风暴', emoji: '', color: '#2ECC71', odds: 12.5 },
  { name: '深渊幻影', emoji: '', color: '#1E90FF', odds: 14.5 },
];

// 下注金额预设
export const BET_PRESETS = [100, 1000, 10000];
export const BET_MAX = 1000000;

// 在基础赔率 ±25% 范围内随机浮动，并 clamp 到 1.5-15
function floatOdds(baseOdds: number): number {
  const factor = 0.75 + Math.random() * 0.5; // 0.75 ~ 1.25
  const floated = baseOdds * factor;
  return Math.max(1.5, Math.min(15, +floated.toFixed(1)));
}

// 生成一轮赛马
export function generateRaceSession(): RaceSession {
  // 先生成马匹（带浮动赔率），再随机打乱顺序
  const horses: Horse[] = HORSE_PRESETS.map((h, i) => ({ ...h, id: i, odds: floatOdds(h.odds) }));
  // Fisher-Yates 洗牌
  for (let i = horses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [horses[i], horses[j]] = [horses[j], horses[i]];
  }
  // 重新分配 id（按打乱后的位置）
  horses.forEach((h, i) => { h.id = i; });
  return {
    id: `race_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    horses,
    rounds: [
      { round: 1, horses: [...horses], winners: [], status: 'idle', countdown: 5 },
      { round: 2, horses: [], winners: [], status: 'idle', countdown: 5 },
      { round: 3, horses: [], winners: [], status: 'idle', countdown: 5 },
    ],
    bets: [],
    totalBet: 0,
    status: 'betting',
    champion: null,
    goldWon: 0,
  };
}

// 根据赔率计算晋级概率（归一化）
// 概率 ∝ 1/odds，赔率越低概率越高
export function calcWinProbs(horses: Horse[]): number[] {
  const raw = horses.map(h => 1 / h.odds);
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map(v => v / sum);
}

// 从一组马中按概率抽取指定数量的胜者（不重复）
export function pickWinners(horses: Horse[], count: number): Horse[] {
  if (horses.length <= count) return [...horses];
  const probs = calcWinProbs(horses);
  const pool = horses.map((h, i) => ({ horse: h, prob: probs[i], idx: i }));
  const winners: Horse[] = [];
  const used = new Set<number>();

  for (let c = 0; c < count; c++) {
    const remaining = pool.filter(p => !used.has(p.idx));
    const total = remaining.reduce((s, p) => s + p.prob, 0);
    let r = Math.random() * total;
    for (const p of remaining) {
      r -= p.prob;
      if (r <= 0) {
        winners.push(p.horse);
        used.add(p.idx);
        break;
      }
    }
  }
  return winners;
}

// 运行一轮比赛
export function runRound(round: RaceRound): RaceRound {
  const winners = pickWinners(round.horses, round.horses.length === 8 ? 4 : round.horses.length === 4 ? 2 : 1);
  return { ...round, winners, status: 'done' };
}

// 计算总奖金（只对冠军下注有效）
// 优先使用 session 中的浮动赔率，回退到 HORSE_PRESETS 基础赔率
export function calcWinnings(bets: BetRecord[], championId: number, sessionHorses?: Horse[]): { goldWon: number; winningBets: BetRecord[] } {
  const winningBets = bets.filter(b => b.horseId === championId);
  const goldWon = winningBets.reduce((sum, b) => {
    const horse = sessionHorses?.find(h => h.id === b.horseId)
      || HORSE_PRESETS.find((_, i) => i === b.horseId);
    return sum + Math.floor(b.amount * (horse?.odds || 1));
  }, 0);
  return { goldWon, winningBets };
}

// 获取马匹名称
export function getHorseName(id: number): string {
  return HORSE_PRESETS[id]?.name || '未知';
}

export function getHorseById(id: number): Horse | undefined {
  return HORSE_PRESETS[id] ? { ...HORSE_PRESETS[id], id } : undefined;
}
