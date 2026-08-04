import { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonBlue, neonOrange, neonRed, neonText } from '../theme/colors';
import { ModalHudBackground } from './ModalHudBackground';
import { LotteryRulesModal } from './LotteryRulesModal';

interface EngineRef {
  current: {
    getLotteryStatus: () => {
      coins: number;
      bets: Record<string, number>;
      freeSpins: number;
      consecutiveLogin: number;
      tournamentBest: number;
      history: number[];
    };
    setLotteryBet: (categoryId: string, delta: number) => { success: boolean; bets: Record<string, number>; coins: number; msg?: string };
    clearLotteryBets: () => { coins: number };
    spinLottery: () => {
      success: boolean;
      stopCell: number;
      winningCells: number[];
      winningCategory: string | null;
      betOnStop: number;
      win: number;
      rewardItems: { itemId: string; itemName: string; icon: string; count: number; category: string }[];
      special?: string;
      specialLabel?: string;
      luckyKind?: string;
      freeSpin?: boolean;
      jackpot?: boolean;
      luckyTrainStart?: number;
      luckyTrainStop?: number;
      trainLength?: number;
      msg?: string;
    };
  } | null;
}

interface LotteryPanelProps {
  engineRef: EngineRef;
  isOpen: boolean;
  onClose: () => void;
}

// 物品配置（与 GameEngine.LOTTERY_ITEMS 同步）
const ITEMS = GameEngine.LOTTERY_ITEMS;
const CATEGORIES = GameEngine.LOTTERY_CATEGORIES;
const CELL_COUNT = GameEngine.LOTTERY_CELL_COUNT; // 24

// 24 格围成 7×7 方框跑马灯，从左上第 1 格顺时针排列
// 布局（数字为顺时针索引 0-23）：
//  [ 0][ 1][ 2][ 3][ 4][ 5][ 6]
//  [23][              ][ 7]
//  [22][   中心显示区  ][ 8]
//  [21][              ][ 9]
//  [20][              ][10]
//  [19][              ][11]
//  [18][17][16][15][14][13][12]
// 顺时针索引 → 7×7 网格坐标
const CELL_POS: { row: number; col: number }[] = [
  { row: 0, col: 0 },  // 0  大橘子（左上）
  { row: 0, col: 1 },  // 1  大铃铛
  { row: 0, col: 2 },  // 2  小BAR
  { row: 0, col: 3 },  // 3  大BAR
  { row: 0, col: 4 },  // 4  小BAR
  { row: 0, col: 5 },  // 5  大苹果
  { row: 0, col: 6 },  // 6  大芒果
  { row: 1, col: 6 },  // 7  大西瓜
  { row: 2, col: 6 },  // 8  小西瓜
  { row: 3, col: 6 },  // 9  Lucky
  { row: 4, col: 6 },  // 10 大苹果
  { row: 5, col: 6 },  // 11 小橘子
  { row: 6, col: 6 },  // 12 大橘子
  { row: 6, col: 5 },  // 13 大铃铛
  { row: 6, col: 4 },  // 14 小77
  { row: 6, col: 3 },  // 15 大77
  { row: 6, col: 2 },  // 16 大苹果
  { row: 6, col: 1 },  // 17 小芒果
  { row: 6, col: 0 },  // 18 大芒果
  { row: 5, col: 0 },  // 19 大双星
  { row: 4, col: 0 },  // 20 小双星
  { row: 3, col: 0 },  // 21 Lucky
  { row: 2, col: 0 },  // 22 大苹果
  { row: 1, col: 0 },  // 23 小铃铛
];

// 特殊奖励说明（与 GameEngine spinLottery 返回的 special 对应）
const SPECIAL_INFO: Record<string, { label: string; color: string }> = {
  lucky: { label: 'Lucky', color: neonPink },
  train: { label: '开火车', color: neonOrange },
  jackpot: { label: '大满贯', color: neonYellow },
  send_light: { label: '送灯', color: neonCyan },
};

// 格子尺寸
const CELL_SIZE = 32;
const CELL_GAP = 2;
const GRID_SIZE = CELL_SIZE * 7 + CELL_GAP * 6; // 224px

export function LotteryPanel({ engineRef, isOpen, onClose }: LotteryPanelProps) {
  const [status, setStatus] = useState<ReturnType<NonNullable<EngineRef['current']>['getLotteryStatus']> | null>(null);
  const [spinning, setSpinning] = useState(false);
  // 当前跑马灯亮起的格子索引（旋转中）
  const [litCell, setLitCell] = useState<number>(-1);
  // 最终停下的格子（Lucky 格 或 普通格）
  const [stopCell, setStopCell] = useState<number | null>(null);
  // 所有中奖格子（普通单格 / Lucky 多格 / 大满贯全格）
  const [winningCells, setWinningCells] = useState<number[]>([]);
  // 中奖水果种类（普通格 / Lucky 随机大水果）
  const [winningCategory, setWinningCategory] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    win: number;
    rewardItems: { itemId: string; itemName: string; icon: string; count: number; category: string }[];
    special?: string;
    specialLabel?: string;
    luckyKind?: string;
    freeSpin?: boolean;
    jackpot?: boolean;
    luckyTrainStart?: number;
    luckyTrainStop?: number;
    trainLength?: number;
  } | null>(null);
  const [toast, setToast] = useState<{ text: string; color: string } | null>(null);
  // 火车动画中当前亮起的格子（火车头）
  const [trainCell, setTrainCell] = useState<number>(-1);
  // 当前火车长度（连续高亮的格子数）
  const [trainLen, setTrainLen] = useState<number>(0);
  // Lucky 命中特效阶段：跑马灯停在Lucky后，展示2秒闪耀特效
  const [luckyFxPhase, setLuckyFxPhase] = useState(false);
  const luckyFxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 规则弹窗
  const [showRules, setShowRules] = useState(false);

  const spinTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshStatus = useCallback(() => {
    if (engineRef.current) {
      setStatus(engineRef.current.getLotteryStatus());
    }
  }, [engineRef]);

  useEffect(() => {
    if (isOpen) {
      // 打开面板时自动清空上次残留的押注，避免存档恢复导致自动押注
      if (engineRef.current) {
        engineRef.current.clearLotteryBets();
      }
      refreshStatus();
    }
  }, [isOpen, refreshStatus, engineRef]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearInterval(spinTimerRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (luckyFxTimerRef.current) clearTimeout(luckyFxTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (text: string, color: string = neonPink) => {
    setToast({ text, color });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  };

  // 总押注
  const totalBet = status ? Object.values(status.bets).reduce((s, b) => s + b, 0) : 0;

  // 押注操作（按水果种类；通过 -/+ 按钮调整）
  const handleBet = (categoryId: string, delta: number) => {
    if (spinning) return;
    if (!engineRef.current) return;
    const res = engineRef.current.setLotteryBet(categoryId, delta);
    if (!res.success && res.msg) {
      showToast(res.msg, neonRed);
    }
    refreshStatus();
  };

  // 清空押注
  const handleClearBets = () => {
    if (spinning) return;
    if (!engineRef.current) return;
    engineRef.current.clearLotteryBets();
    refreshStatus();
  };

  // 开始旋转
  const handleSpin = () => {
    if (spinning) return;
    if (!engineRef.current) return;
    const hasFreeSpin = status && status.freeSpins > 0;
    if (!hasFreeSpin && totalBet <= 0) {
      showToast('请先押注', neonRed);
      return;
    }

    setSpinning(true);
    setStopCell(null);
    setWinningCells([]);
    setWinningCategory(null);
    setTrainCell(-1);
    setTrainLen(0);
    setLuckyFxPhase(false);

    // 先获取最终结果
    const result = engineRef.current.spinLottery();
    if (!result.success) {
      showToast(result.msg || '无法旋转', neonRed);
      setSpinning(false);
      refreshStatus();
      return;
    }

    refreshStatus();

    // 跑马灯动画：先快速跑动，再逐步减速，最终停在 stopCell
    const finalCell = result.stopCell;
    let currentCell = 0;
    let speed = 50; // 初始速度 50ms
    let totalElapsed = 0;
    const TARGET_TOTAL = 600; // 总时长 ~0.6s（缩短2秒）

    setLitCell(currentCell);

    const runStep = () => {
      currentCell = (currentCell + 1) % CELL_COUNT;
      setLitCell(currentCell);
      // 减速：速度随时间增加
      totalElapsed += speed;
      const progress = totalElapsed / TARGET_TOTAL;
      speed = Math.floor(50 + progress * progress * 240); // 50ms → 290ms
      if (totalElapsed >= TARGET_TOTAL) {
        // 即将停止：确保停在 finalCell
        if (currentCell === finalCell) {
          finishSpin();
        } else {
          // 继续跑到 finalCell
          const remain = (finalCell - currentCell + CELL_COUNT) % CELL_COUNT;
          let stepCount = 0;
          const finishTimer = setInterval(() => {
            currentCell = (currentCell + 1) % CELL_COUNT;
            setLitCell(currentCell);
            stepCount++;
            if (currentCell === finalCell && stepCount >= remain) {
              clearInterval(finishTimer);
              finishSpin();
            }
          }, 200);
          spinTimerRef.current = finishTimer as any;
        }
        return;
      }
      stopTimerRef.current = setTimeout(runStep, speed);
    };
    stopTimerRef.current = setTimeout(runStep, speed);

    // 展示最终结果
    const showResult = () => {
      setWinningCells(result.winningCells);
      setWinningCategory(result.winningCategory);
      setLastResult({
        win: result.win,
        rewardItems: result.rewardItems,
        special: result.special,
        specialLabel: result.specialLabel,
        luckyKind: result.luckyKind,
        freeSpin: result.freeSpin,
        jackpot: result.jackpot,
        luckyTrainStart: result.luckyTrainStart,
        luckyTrainStop: result.luckyTrainStop,
        trainLength: result.trainLength,
      });
      setSpinning(false);
      setLuckyFxPhase(false);
      refreshStatus();
      if (result.rewardItems.length > 0) {
        const itemText = result.rewardItems.map(r => `${r.icon}${r.itemName}×${r.count}`).join(' ');
        const label = result.specialLabel ? `🎉 ${result.specialLabel} 🎉 ${itemText}` : `中奖 ${itemText}`;
        showToast(label, result.special ? (SPECIAL_INFO[result.special]?.color || neonYellow) : neonYellow);
      } else if (result.freeSpin) {
        showToast('🎉 送灯！免费旋转1次', neonCyan);
      }
    };

    // Lucky 开火车动画：从 Lucky 格子开始顺时针跑，车头带动车尾长度连续高亮
    const startTrainAnimation = (trainStart: number, trainStop: number, length: number) => {
      let tc = trainStart;
      const safeLen = Math.min(Math.max(length, 2), CELL_COUNT);
      setTrainLen(safeLen);
      setTrainCell(tc);
      let trainSpeed = 45;
      let trainElapsed = 0;
      // 开火车总时长随机：3.0~6.0秒
      const TRAIN_TOTAL = 3000 + Math.floor(Math.random() * 3000);

      const runTrain = () => {
        tc = (tc + 1) % CELL_COUNT;
        setTrainCell(tc);
        trainElapsed += trainSpeed;
        const progress = Math.min(trainElapsed / TRAIN_TOTAL, 1);
        // 速度曲线：前段匀速，后段指数级减速
        if (progress < 0.55) {
          trainSpeed = 45;
        } else {
          const p = (progress - 0.55) / 0.45;
          trainSpeed = Math.floor(45 + p * p * 260); // 45ms → 305ms
        }
        if (trainElapsed >= TRAIN_TOTAL) {
          if (tc === trainStop) {
            finishTrain();
          } else {
            const remain = (trainStop - tc + CELL_COUNT) % CELL_COUNT;
            let stepCount = 0;
            const finishTimer = setInterval(() => {
              tc = (tc + 1) % CELL_COUNT;
              setTrainCell(tc);
              stepCount++;
              if (tc === trainStop && stepCount >= remain) {
                clearInterval(finishTimer);
                spinTimerRef.current = null;
                finishTrain();
              }
            }, 220);
            spinTimerRef.current = finishTimer as any;
          }
          return;
        }
        stopTimerRef.current = setTimeout(runTrain, trainSpeed);
      };
      stopTimerRef.current = setTimeout(runTrain, trainSpeed);
    };

    const finishTrain = () => {
      setTrainCell(-1);
      setTrainLen(0);
      setStopCell(result.luckyTrainStop!);
      showResult();
    };

    // 跑马灯停在 Lucky 格子 → 播放 2 秒 Lucky 命中特效 → 进入子流程
    const afterLuckyFx = () => {
      setLuckyFxPhase(false);
      if (result.luckyTrainStart !== undefined && result.luckyTrainStop !== undefined) {
        startTrainAnimation(result.luckyTrainStart, result.luckyTrainStop, result.trainLength || 8);
      } else {
        // 非开火车子玩法：特效后直接展示中奖结果
        showResult();
      }
    };

    const finishSpin = () => {
      if (spinTimerRef.current) {
        clearInterval(spinTimerRef.current);
        spinTimerRef.current = null;
      }
      setLitCell(-1);
      setStopCell(finalCell);

      const finalItem = ITEMS[finalCell];
      const isLuckyFinal = finalItem.size === 'special' && (finalItem.key === 'lucky_1' || finalItem.key === 'lucky_2');
      if (isLuckyFinal) {
        // 命中 Lucky：播放 2 秒特效动画
        setLuckyFxPhase(true);
        if (luckyFxTimerRef.current) clearTimeout(luckyFxTimerRef.current);
        luckyFxTimerRef.current = setTimeout(afterLuckyFx, 2000);
        return;
      }

      showResult();
    };
  };

  // 判断格子是否在中奖列表中（不含 stopCell，stopCell 单独处理）
  // 同时，若该格子属于 winningCategory，也算中奖（同种类全中）
  const isWinningCell = (cellIdx: number) => {
    if (cellIdx === stopCell) return false;
    if (winningCells.includes(cellIdx)) return true;
    if (winningCategory && ITEMS[cellIdx].category === winningCategory) return true;
    return false;
  };

  // 判断该种类是否被押注
  const isCategoryBet = (categoryId: string) => {
    return (status?.bets[categoryId] || 0) > 0;
  };

  // 判断该格子是否在火车尾高亮范围内（返回 0..1 的车尾渐暗系数，-1 表示不在火车上）
  const getTrainTailFactor = (cellIdx: number): number => {
    if (trainCell === -1 || trainLen <= 0) return -1;
    // 火车范围：[trainCell - (trainLen - 1), trainCell]，顺时针
    const dist = (trainCell - cellIdx + CELL_COUNT) % CELL_COUNT;
    if (dist >= trainLen) return -1;
    // 车头(dist=0) 最亮，车尾(dist=trainLen-1)最暗，线性衰减
    return 1 - dist / trainLen;
  };

  // 渲染跑马灯格子（仅展示，不可押注）
  const renderCell = (cellIdx: number) => {
    const item = ITEMS[cellIdx];
    const isLit = litCell === cellIdx;
    const isStop = stopCell === cellIdx;
    const isWin = isWinningCell(cellIdx);
    const isBetOnThisCategory = isCategoryBet(item.category);
    const isLuckyCell = item.size === 'special';
    const isTrainHead = trainCell === cellIdx;
    const tailFactor = getTrainTailFactor(cellIdx);
    const isInTrain = tailFactor >= 0;
    const isLuckyFx = luckyFxPhase && isLuckyCell && isStop;

    // 基础背景
    let bg = 'rgba(19, 16, 37, 0.7)';
    if (isStop) {
      bg = `radial-gradient(circle, ${item.color}90, ${item.color}40)`;
    } else if (isWin) {
      bg = `radial-gradient(circle, ${neonYellow}60, ${item.color}30)`;
    } else if (isLit) {
      bg = `radial-gradient(circle, ${item.color}A0, ${item.color}40)`;
    } else if (isBetOnThisCategory) {
      // 该种类被押注，所有同种类格子轻微高亮
      bg = `linear-gradient(180deg, ${item.color}22, ${item.color}06)`;
    }

    // 边框
    let borderColor = 'rgba(100, 100, 130, 0.4)';
    if (isStop) borderColor = item.color;
    else if (isWin) borderColor = neonYellow;
    else if (isLit) borderColor = item.color;
    else if (isBetOnThisCategory) borderColor = `${item.color}70`;

    // 阴影
    let shadow = 'inset 0 0 4px rgba(0,0,0,0.5)';
    if (isStop) shadow = `0 0 14px ${item.color}, inset 0 0 8px ${item.color}80`;
    else if (isWin) shadow = `0 0 12px ${neonYellow}, inset 0 0 6px ${neonYellow}60`;
    else if (isLit) shadow = `0 0 10px ${item.color}A0, inset 0 0 6px ${item.color}60`;
    else if (isBetOnThisCategory) shadow = `0 0 4px ${item.color}30`;

    // 边框宽度（火车格子加粗）
    let borderWidth = 1.5;
    // 火车光效：边框高亮 + 外发光，车头最亮 → 车尾渐暗但保持可见（不遮挡格子内容）
    if (isInTrain) {
      const f = Math.max(0.4, tailFactor); // 车尾最低 40%，保证整列火车轮廓清晰
      const hex = (v: number) => Math.round(Math.max(0, Math.min(255, v * 255))).toString(16).padStart(2, '0');
      // 背景不覆盖：保留原格子内容，仅叠加极淡橙色色调
      bg = `${neonOrange}${hex(f * 0.15)}`;
      // 边框加粗高亮：车头 2.5px，车尾 2px
      borderWidth = isTrainHead ? 2.5 : 2;
      borderColor = `${neonOrange}${hex(f * 0.85 + 0.15)}`;
      // 双层外发光 + 轻微内发光，确保整列火车轮廓清晰可见
      const glowInner = Math.round(4 + f * 5);
      const glowOuter = Math.round(9 + f * 6);
      shadow = `0 0 ${glowInner}px ${neonOrange}${hex(f * 0.9)}, 0 0 ${glowOuter}px ${neonOrange}${hex(f * 0.45)}, inset 0 0 3px ${neonOrange}${hex(f * 0.3)}`;
    }

    // Lucky 命中特效（2秒闪耀）：在 Lucky 命中时覆盖最强光效
    let animName: string = 'none';
    if (isLuckyFx) {
      animName = 'lottery-lucky-burst';
    } else if (isInTrain) {
      animName = isTrainHead ? 'lottery-train-move 0.12s linear' : 'lottery-train-tail 0.15s linear';
    } else if (isStop) {
      animName = 'lottery-stop-pulse 0.6s ease-out';
    } else if (isWin) {
      animName = 'lottery-win-pulse 0.8s ease-in-out infinite';
    } else if (isLit) {
      animName = 'lottery-cell-blink 0.1s linear';
    } else if (isLuckyCell) {
      animName = 'lottery-lucky-idle 2.4s ease-in-out infinite';
    }

    return (
      <div
        key={cellIdx}
        style={{
          width: `${CELL_SIZE}px`,
          height: `${CELL_SIZE}px`,
          background: bg,
          border: `${borderWidth}px solid ${borderColor}`,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: shadow,
          transition: isLit || isInTrain ? 'none' : 'all 0.2s ease',
          position: 'relative',
          animation: animName,
          gridRow: CELL_POS[cellIdx].row + 1,
          gridColumn: CELL_POS[cellIdx].col + 1,
        }}
      >
        {/* Lucky 特效阶段的额外 overlay */}
        {isLuckyFx && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '6px',
              background: `linear-gradient(135deg, rgba(255,105,180,0.35), rgba(176,38,255,0.28), rgba(0,245,212,0.3))`,
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          />
        )}
        {/* 图标 */}
        <div
          style={{
            fontSize: item.icon === 'BAR' ? '9px' : (item.icon === '7️⃣' ? '13px' : '15px'),
            fontWeight: item.icon === 'BAR' ? 900 : 700,
            lineHeight: 1,
            color: item.color,
            textShadow: (isStop || isLit || isWin || isBetOnThisCategory || isInTrain) ? `0 0 6px ${item.color}` : 'none',
            fontFamily: item.icon === 'BAR' ? '"Rajdhani","Orbitron",monospace' : undefined,
            transform: isLuckyFx ? 'scale(1.35)' : isStop ? 'scale(1.15)' : isTrainHead ? 'scale(1.12)' : 'scale(1)',
            transition: 'transform 0.15s',
            zIndex: 1,
          }}
        >
          {item.icon}
        </div>
        {/* 赔率 Xn（右下角） */}
        <div
          style={{
            position: 'absolute',
            bottom: '0px',
            right: '1px',
            ...neonText,
            fontSize: '6px',
            color: isStop || isLit || isWin || isInTrain ? item.color : '#7A7090',
            fontWeight: 700,
            letterSpacing: '0.2px',
            textShadow: (isStop || isWin) ? `0 0 3px ${item.color}` : 'none',
            lineHeight: 1,
          }}
        >X{item.odds}</div>
      </div>
    );
  };

  // 构建 7×7 网格（中心 5×5 为显示区）
  // 使用 CSS Grid 布局，24 个格子按 gridRow/gridColumn 定位，中心区域单独渲染
  const renderGrid = () => {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(7, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
          gap: `${CELL_GAP}px`,
          width: `${GRID_SIZE}px`,
          height: `${GRID_SIZE}px`,
          position: 'relative',
        }}
      >
        {/* 24 个跑马灯格子 */}
        {Array.from({ length: CELL_COUNT }, (_, i) => renderCell(i))}

        {/* 中心 5×5 显示区（gridRow 2-6, gridColumn 2-6） */}
        <div
          style={{
            gridRow: '2 / 7',
            gridColumn: '2 / 7',
            margin: '2px',
            background: stopCell !== null
              ? `radial-gradient(circle, ${ITEMS[stopCell].color}20, rgba(19,16,37,0.9))`
              : 'rgba(19, 16, 37, 0.9)',
            border: `1.5px solid ${stopCell !== null ? ITEMS[stopCell].color + '80' : neonPurple + '40'}`,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            boxShadow: stopCell !== null ? `inset 0 0 10px ${ITEMS[stopCell].color}30` : 'inset 0 0 6px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}
        >
          {spinning ? (
            luckyFxPhase ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '22px', animation: 'lottery-lucky-burst 0.55s ease-in-out infinite' }}>🍀</div>
                <div style={{ ...neonText, fontSize: '9px', color: neonPink, fontWeight: 900, letterSpacing: '2px', textShadow: `0 0 8px ${neonPink}CC`, animation: 'lottery-spin-text 0.4s linear infinite' }}>
                  LUCKY!
                </div>
                <div style={{ ...neonText, fontSize: '7px', color: neonCyan, letterSpacing: '0.5px' }}>
                  子玩法判定中…
                </div>
              </div>
            ) : trainCell !== -1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '20px', animation: 'lottery-spin-icon 0.4s linear infinite' }}>🚂</div>
                <div style={{ ...neonText, fontSize: '8px', color: neonOrange, animation: 'lottery-spin-text 0.5s linear infinite', letterSpacing: '1px' }}>
                  开火车中
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '20px', animation: 'lottery-spin-icon 0.6s linear infinite' }}>🎰</div>
                <div style={{ ...neonText, fontSize: '8px', color: neonCyan, animation: 'lottery-spin-text 0.6s linear infinite', letterSpacing: '1px' }}>
                  跑马灯中
                </div>
              </div>
            )
          ) : stopCell !== null && lastResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', width: '100%' }}>
              {/* 中奖图标展示 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {/* 若多个中奖格子，展示前几个不同图标 */}
                {Array.from(new Set(winningCells.map(c => ITEMS[c].icon))).slice(0, 4).map((icon, idx) => {
                  const cellIdx = winningCells.find(c => ITEMS[c].icon === icon)!;
                  const item = ITEMS[cellIdx];
                  return (
                    <div key={idx} style={{
                      fontSize: item.icon === 'BAR' ? '10px' : '18px',
                      fontWeight: 700,
                      color: item.color,
                      lineHeight: 1,
                      textShadow: `0 0 6px ${item.color}`,
                      animation: 'lottery-result-pop 0.5s ease-out',
                    }}>
                      {item.icon}
                    </div>
                  );
                })}
              </div>
              {/* 特殊奖励标签 */}
              {lastResult.special && lastResult.specialLabel && (
                <div style={{
                  ...neonText,
                  fontSize: '10px',
                  color: SPECIAL_INFO[lastResult.special]?.color || neonPink,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textShadow: `0 0 6px ${SPECIAL_INFO[lastResult.special]?.color || neonPink}80`,
                  textAlign: 'center',
                  animation: 'lottery-result-pop 0.4s ease-out',
                }}>
                  {lastResult.specialLabel}
                </div>
              )}
              {/* 中奖道具展示 */}
              <div style={{
                ...neonText,
                fontSize: '10px',
                color: lastResult.win > 0 ? neonYellow : '#8B80A0',
                fontWeight: 700,
                textShadow: lastResult.win > 0 ? `0 0 8px ${neonYellow}80` : 'none',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                {lastResult.win > 0 ? (
                  lastResult.rewardItems.map((r, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', animation: 'lottery-result-pop 0.5s ease-out' }}>
                      <span style={{ fontSize: '14px' }}>{r.icon}</span>
                      <span style={{ fontSize: '8px' }}>×{r.count}</span>
                    </div>
                  ))
                ) : '未中奖'}
              </div>
              {lastResult.freeSpin && (
                <div style={{ ...neonText, fontSize: '8px', color: neonCyan }}>+1免费旋转</div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <div style={{ ...neonText, fontSize: '8px', color: '#6B6B85', textAlign: 'center', letterSpacing: '1px' }}>
                跑马灯水果机
              </div>
              <div style={{ ...neonText, fontSize: '7px', color: '#5A5A7A', textAlign: 'center', marginTop: '2px' }}>
                点击 +/- 下注
              </div>
              {status && status.history.length > 0 && (
                <div style={{ ...neonText, fontSize: '7px', color: '#8B80A0', textAlign: 'center', marginTop: '4px' }}>
                  历史
                </div>
              )}
              {status && status.history.length > 0 && (
                <div style={{ display: 'flex', gap: '2px', marginTop: '1px' }}>
                  {status.history.map((h, i) => (
                    <span key={i} style={{ fontSize: '11px', color: ITEMS[h].color }}>{ITEMS[h].icon}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="absolute left-0 right-0 z-50 flex items-center justify-center"
      style={{
        top: 0,
        bottom: 0,
        background: isOpen ? 'rgba(5, 3, 15, 0.85)' : 'transparent',
        backdropFilter: isOpen ? 'blur(6px)' : 'none',
        overflow: 'auto',
        display: isOpen ? 'flex' : 'none',
      }}
      onClick={onClose}
    >
      <div
        className="relative"
        style={{
          width: '300px',
          maxHeight: '94vh',
          background: 'linear-gradient(180deg, #1A1535 0%, #0D0B1A 100%)',
          border: `1px solid ${neonPurple}50`,
          borderRadius: '14px',
          boxShadow: `0 0 30px ${neonPurple}40, 0 0 60px ${neonCyan}20`,
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHudBackground accentColor={neonPurple} accentColor2={neonPink} />

        <div className="relative" style={{ zIndex: 1, padding: '10px 12px' }}>
          {/* 头部 */}
          <div className="flex items-center justify-between mb-2">
            <span style={{ ...neonText, fontSize: '13px', color: neonPink, letterSpacing: '2px' }}>
              🎰 跑马灯水果机
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowRules(true)}
                style={{
                  ...neonText,
                  fontSize: '8px',
                  color: '#8B80A0',
                  background: 'none',
                  border: `1px solid #5A5A7A`,
                  borderRadius: '3px',
                  padding: '1px 4px',
                  cursor: 'pointer',
                }}
              >规则</button>
              <button
                onClick={onClose}
                style={{
                  ...neonText,
                  fontSize: '14px',
                  color: '#8B80A0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >✕</button>
            </div>
          </div>

          {/* 跑马灯主体：7×7 方框 */}
          <div
            className="mb-2 flex justify-center"
            style={{
              padding: '8px',
              background: 'rgba(10, 8, 20, 0.8)',
              border: `1px solid ${neonPurple}40`,
              borderRadius: '10px',
              position: 'relative',
            }}
          >
            {renderGrid()}
          </div>

          {/* 押注区：按水果种类押注 */}
          {status && (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1 px-1">
                <span style={{ ...neonText, fontSize: '8px', color: '#8B80A0', letterSpacing: '0.5px' }}>
                  选择水果下注
                </span>
                <span style={{ ...neonText, fontSize: '9px', color: neonCyan, fontWeight: 700 }}>
                  总押: {totalBet}
                </span>
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {CATEGORIES.map(cat => {
                  const bet = status.bets[cat.id] || 0;
                  const isBet = bet > 0;
                  return (
                    <div
                      key={cat.id}
                      style={{
                        padding: '3px 2px',
                        background: isBet ? `linear-gradient(180deg, ${cat.color}30, ${cat.color}10)` : 'rgba(19, 16, 37, 0.6)',
                        border: `1px solid ${isBet ? cat.color : 'rgba(100, 100, 130, 0.4)'}`,
                        borderRadius: '5px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        boxShadow: isBet ? `0 0 8px ${cat.color}60` : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: cat.icon === 'BAR' ? '9px' : '15px', fontWeight: cat.icon === 'BAR' ? 900 : 700, color: cat.color, lineHeight: 1, fontFamily: cat.icon === 'BAR' ? '"Rajdhani",monospace' : undefined }}>
                        {cat.icon}
                      </div>
                      <div style={{ ...neonText, fontSize: '6px', color: cat.color }}>{cat.name}</div>
                      {/* -/+ 按钮行 */}
                      <div className="flex items-center" style={{ gap: '2px', marginTop: '1px' }}>
                        <button
                          onClick={() => handleBet(cat.id, -1)}
                          disabled={spinning || bet <= 0}
                          style={{
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: spinning || bet <= 0 ? 'rgba(100,100,130,0.15)' : 'rgba(255,45,85,0.2)',
                            border: `1px solid ${spinning || bet <= 0 ? '#5A5A7A' : neonRed + '60'}`,
                            borderRadius: '3px',
                            ...neonText,
                            fontSize: '10px',
                            color: spinning || bet <= 0 ? '#8B80A0' : neonRed,
                            cursor: spinning || bet <= 0 ? 'not-allowed' : 'pointer',
                            padding: 0,
                            lineHeight: 1,
                          }}
                        >-</button>
                        <div
                          style={{
                            minWidth: '20px',
                            textAlign: 'center',
                            ...neonText,
                            fontSize: '8px',
                            color: isBet ? neonYellow : '#6B6B85',
                            fontWeight: 700,
                          }}
                        >
                          {bet}
                        </div>
                        <button
                          onClick={() => handleBet(cat.id, 1)}
                          disabled={spinning}
                          style={{
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: spinning ? 'rgba(100,100,130,0.15)' : 'rgba(0,245,212,0.2)',
                            border: `1px solid ${spinning ? '#5A5A7A' : neonCyan + '60'}`,
                            borderRadius: '3px',
                            ...neonText,
                            fontSize: '10px',
                            color: spinning ? '#8B80A0' : neonCyan,
                            cursor: spinning ? 'not-allowed' : 'pointer',
                            padding: 0,
                            lineHeight: 1,
                          }}
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 主操作按钮 */}
          <div className="flex gap-1 mb-1">
            <button
              onClick={handleClearBets}
              disabled={spinning || totalBet <= 0}
              style={{
                padding: '7px 10px',
                background: spinning || totalBet <= 0 ? 'rgba(100,100,130,0.2)' : 'rgba(255, 45, 85, 0.2)',
                border: `1px solid ${spinning || totalBet <= 0 ? '#5A5A7A' : neonRed + '60'}`,
                borderRadius: '5px',
                ...neonText, fontSize: '9px', color: spinning || totalBet <= 0 ? '#8B80A0' : neonRed,
                cursor: spinning || totalBet <= 0 ? 'not-allowed' : 'pointer',
              }}
            >清空</button>
            <button
              onClick={handleSpin}
              disabled={spinning}
              style={{
                flex: 1, padding: '7px',
                background: spinning
                  ? 'rgba(100,100,130,0.3)'
                  : `linear-gradient(180deg, ${neonPink}, #8B0050)`,
                border: spinning ? '1px solid rgba(100,100,130,0.3)' : `1px solid ${neonPink}`,
                borderRadius: '5px',
                ...neonText, fontSize: '12px', color: '#FFFFFF', fontWeight: 700,
                letterSpacing: '2px',
                cursor: spinning ? 'not-allowed' : 'pointer',
                boxShadow: spinning ? 'none' : `0 0 14px ${neonPink}60`,
              }}
            >
              {spinning ? '跑马灯...' : (status && status.freeSpins > 0) ? '🎁 免费旋转' : '🎰 开始'}
            </button>
          </div>

          {/* 底部状态栏：硬币 + 每日提示 */}
          <div className="flex items-center justify-between mt-1 px-1">
            {status && (
              <div className="flex items-center gap-2">
                <span style={{ ...neonText, fontSize: '9px', color: neonYellow, fontWeight: 700 }}>
                  🪙 {status.coins}
                </span>
                {status.freeSpins > 0 && (
                  <span style={{ ...neonText, fontSize: '8px', color: neonCyan }}>
                    🎁{status.freeSpins}
                  </span>
                )}
                <span style={{ ...neonText, fontSize: '8px', color: neonOrange }}>
                  🔥{status.consecutiveLogin}天
                </span>
              </div>
            )}
            <span style={{ ...neonText, fontSize: '7px', color: '#6B6B85', letterSpacing: '0.5px' }}>
              每日发放硬币+连续登录加成
            </span>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="absolute left-1/2"
            style={{
              top: '38%',
              transform: 'translateX(-50%)',
              padding: '6px 14px',
              background: `${toast.color}E0`,
              border: `1px solid ${toast.color}`,
              borderRadius: '6px',
              ...neonText, fontSize: '10px', color: '#FFFFFF',
              zIndex: 10,
              boxShadow: `0 0 14px ${toast.color}80`,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              animation: 'lottery-result-pop-card 0.3s ease-out',
            }}
          >
            {toast.text}
          </div>
        )}

        {/* 规则弹窗 */}
        <LotteryRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      </div>

      <style>{`
        @keyframes lottery-cell-blink {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes lottery-stop-pulse {
          0% { transform: scale(1.18); }
          50% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        @keyframes lottery-win-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.08); filter: brightness(1.3); }
        }
        @keyframes lottery-lucky-idle {
          0%, 100% { filter: brightness(0.9); }
          50% { filter: brightness(1.25); }
        }
        @keyframes lottery-spin-text {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes lottery-spin-icon {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes lottery-result-pop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes lottery-result-pop-card {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes lottery-train-move {
          0% { transform: scale(1.15); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1.15); }
        }
        @keyframes lottery-train-tail {
          0%, 100% { filter: brightness(1.05); }
          50% { filter: brightness(1.25); }
        }
        @keyframes lottery-lucky-burst {
          0%   { transform: scale(1) rotate(-4deg); filter: brightness(1); }
          20%  { transform: scale(1.3) rotate(6deg);  filter: brightness(1.5) drop-shadow(0 0 8px #FF69B4); }
          40%  { transform: scale(0.92) rotate(-5deg); filter: brightness(0.9); }
          60%  { transform: scale(1.22) rotate(4deg);  filter: brightness(1.4) drop-shadow(0 0 12px #B026FF); }
          80%  { transform: scale(0.97) rotate(-2deg); filter: brightness(1.1); }
          100% { transform: scale(1) rotate(0deg);     filter: brightness(1); }
        }
      `}</style>
    </div>
  );
}
