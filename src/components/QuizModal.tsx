import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { neonCyan, neonPurple, neonPink, neonYellow, neonGreen, neonRed, neonText } from '../theme/colors';

interface Question {
  id: number;
  type: 'single' | 'multiple';
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    type: 'single',
    question: '在末日突围中，玩家角色的武器射程最高可达战场宽度的多少？',
    options: ['75%', '85%', '90%', '95%'],
    correct: [3],
    explanation: '人物最大射程为战场的95%宽度，受到debuff时最低值为25%宽度',
  },
  {
    id: 2,
    type: 'single',
    question: '装备品质从低到高排列正确的是？',
    options: ['普通→稀有→史诗→传说→神话', '普通→高级→精致→传说→史诗→神话', '普通→稀有→精致→史诗→神话', '普通→高级→稀有→史诗→传说'],
    correct: [1],
    explanation: '品质等级：普通→高级→精致→传说→史诗→神话，共6个等级',
  },
  {
    id: 3,
    type: 'single',
    question: '强化装备时，强化等级7-9的成功率是多少？',
    options: ['100%', '75%', '50%', '30%'],
    correct: [2],
    explanation: '强化成功率：1-3:100%，4-6:75%，7-9:50%，10-12:30%，13-15:10%',
  },
  {
    id: 4,
    type: 'single',
    question: '以下哪种品质的装备必定带有属性攻击词条？',
    options: ['精致', '传说', '史诗', '神话'],
    correct: [1],
    explanation: '传说、史诗、神话级武器必须带一个【火/冰/雷/毒属性攻击】词条',
  },
  {
    id: 5,
    type: 'single',
    question: '技能"毁天灭地"需要多少级才能学习？',
    options: ['100级', '150级', '160级', '200级'],
    correct: [1],
    explanation: '【毁天灭地】150级；【召唤分身】160级、200级；【战术横扫】300级',
  },
  {
    id: 6,
    type: 'multiple',
    question: '以下哪些是装备的属性类型？（多选）',
    options: ['攻击力', '生命值', '暴击率', '防御力', '金币加成'],
    correct: [0, 1, 2, 3],
    explanation: '装备基础属性包括：攻击力、生命、防御、暴击率、抗性等',
  },
  {
    id: 7,
    type: 'multiple',
    question: '以下哪些是有效的属性攻击类型？（多选）',
    options: ['火属性攻击', '冰属性攻击', '雷属性攻击', '毒属性攻击', '风属性攻击'],
    correct: [0, 1, 2, 3],
    explanation: '游戏中有四种属性攻击：火、冰、雷、毒，没有风属性',
  },
  {
    id: 8,
    type: 'multiple',
    question: '强化失败时可能的结果有？（多选）',
    options: ['等级不变', '等级-1', '等级-2', '装备损坏', '消耗全部金币'],
    correct: [0, 1, 2],
    explanation: '失败结果：1-3无损失，4-6保留等级，7-12等级-2，13-15等级-1',
  },
  {
    id: 9,
    type: 'multiple',
    question: '以下哪些属于游戏中的怪物类型？（多选）',
    options: ['变异体', '掠夺者', '感染者', '重装战士', '机甲士兵'],
    correct: [0, 1, 2, 3, 4],
    explanation: '这些都是游戏中出现的怪物类型',
  },
  {
    id: 10,
    type: 'multiple',
    question: '以下哪些是游戏的功能模块？（多选）',
    options: ['装备强化', '宝石镶嵌', '附魔系统', '邮件系统', '社交系统'],
    correct: [0, 1, 2, 3, 4],
    explanation: '游戏包含装备强化、宝石镶嵌、附魔、邮件、社交等功能模块',
  },
];

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function QuizModalImpl({ isOpen, onClose }: QuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const addGold = useGameStore(s => s.addGold);

  const currentQuestion = QUESTIONS[currentIndex];
  const correctCount = answers.filter((ans, idx) => {
    const q = QUESTIONS[idx];
    if (ans.length !== q.correct.length) return false;
    return ans.every(a => q.correct.includes(a));
  }).length;

  const handleSelect = useCallback((index: number) => {
    if (answered) return;
    if (currentQuestion.type === 'single') {
      setSelected([index]);
    } else {
      setSelected(prev => {
        if (prev.includes(index)) {
          return prev.filter(i => i !== index);
        }
        return [...prev, index].sort();
      });
    }
  }, [currentQuestion.type, answered]);

  const handleSubmit = useCallback(() => {
    if (selected.length === 0) return;
    setAnswers(prev => [...prev, [...selected]]);
    setAnswered(true);
    setShowExplanation(true);
  }, [selected]);

  const handleNext = useCallback(() => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelected([]);
      setAnswered(false);
      setShowExplanation(false);
    } else {
      setShowResult(true);
    }
  }, [currentIndex]);

  const handleClaimReward = useCallback(() => {
    const accuracy = correctCount / QUESTIONS.length;
    let goldReward = 0;
    let message = '';
    
    if (accuracy >= 0.9) {
      goldReward = 5000;
      message = '完美！获得5000金币奖励';
    } else if (accuracy >= 0.7) {
      goldReward = 3000;
      message = '优秀！获得3000金币奖励';
    } else if (accuracy >= 0.5) {
      goldReward = 1500;
      message = '不错！获得1500金币奖励';
    } else if (accuracy >= 0.3) {
      goldReward = 500;
      message = '继续努力！获得500金币奖励';
    } else {
      goldReward = 100;
      message = '再接再厉！获得100金币奖励';
    }
    
    addGold(goldReward);
    alert(message);
    onClose();
  }, [correctCount, addGold, onClose]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers([]);
    setShowResult(false);
    setSelected([]);
    setAnswered(false);
    setShowExplanation(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[360px]"
        style={{
          background: 'linear-gradient(180deg, #1A1535 0%, #0D0B1A 100%)',
          border: `1px solid ${neonPurple}50`,
          borderRadius: '12px',
          boxShadow: `0 0 30px ${neonPurple}30, 0 0 60px ${neonCyan}15`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: `1px solid ${neonPurple}30`,
          }}
        >
          <div style={{ ...neonText, fontSize: '12px', color: neonCyan, letterSpacing: '2px' }}>
            🎮 趣味答题
          </div>
          <button
            onClick={onClose}
            style={{
              ...neonText,
              fontSize: '14px',
              color: '#8B80A0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* 进度条 */}
        <div className="px-4 py-2">
          <div className="flex justify-between mb-1" style={{ ...neonText, fontSize: '8px', color: '#8B80A0' }}>
            <span>{currentIndex + 1}/{QUESTIONS.length}</span>
            <span>{currentQuestion.type === 'single' ? '单选题' : '多选题'}</span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(100, 100, 130, 0.2)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%`,
                background: `linear-gradient(90deg, ${neonCyan}, ${neonPurple})`,
              }}
            />
          </div>
        </div>

        {!showResult ? (
          /* 答题界面 */
          <>
            {/* 题目 */}
            <div className="px-4 py-3">
              <div
                style={{
                  ...neonText,
                  fontSize: '10px',
                  color: '#E0E0FF',
                  lineHeight: 1.5,
                  minHeight: '40px',
                }}
              >
                {currentQuestion.question}
              </div>
            </div>

            {/* 选项 */}
            <div className="px-4 pb-3 space-y-2">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selected.includes(index);
                const isCorrect = currentQuestion.correct.includes(index);
                let bgColor = 'rgba(30, 25, 55, 0.6)';
                let borderColor = 'rgba(100, 100, 130, 0.3)';
                let textColor = '#C0C0E0';
                
                if (answered) {
                  if (isCorrect) {
                    bgColor = `${neonGreen}20`;
                    borderColor = neonGreen;
                    textColor = neonGreen;
                  } else if (isSelected && !isCorrect) {
                    bgColor = `${neonRed}20`;
                    borderColor = neonRed;
                    textColor = neonRed;
                  }
                } else if (isSelected) {
                  bgColor = `${neonCyan}20`;
                  borderColor = neonCyan;
                  textColor = neonCyan;
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleSelect(index)}
                    disabled={answered}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: bgColor,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '6px',
                      cursor: answered ? 'default' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        ...neonText,
                        fontSize: '9px',
                        color: textColor,
                        fontWeight: 700,
                        minWidth: '16px',
                      }}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span
                      style={{
                        ...neonText,
                        fontSize: '9px',
                        color: textColor,
                        flex: 1,
                      }}
                    >
                      {option}
                    </span>
                    {isSelected && (
                      <span style={{ color: textColor, fontSize: '10px' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 解析 */}
            {showExplanation && (
              <div
                className="px-4 pb-3"
                style={{
                  background: `${neonPurple}10`,
                  border: `1px solid ${neonPurple}30`,
                  borderRadius: '6px',
                  padding: '8px 10px',
                }}
              >
                <div
                  style={{
                    ...neonText,
                    fontSize: '8px',
                    color: neonPurple,
                    marginBottom: '2px',
                  }}
                >
                  💡 解析：
                </div>
                <div
                  style={{
                    ...neonText,
                    fontSize: '8px',
                    color: '#A0A0C0',
                    lineHeight: 1.4,
                  }}
                >
                  {currentQuestion.explanation}
                </div>
              </div>
            )}

            {/* 按钮 */}
            <div className="px-4 pb-4">
              {!answered ? (
                <button
                  onClick={handleSubmit}
                  disabled={selected.length === 0}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: selected.length > 0
                      ? `linear-gradient(180deg, ${neonPurple}, #8B15C0)`
                      : 'rgba(100, 100, 130, 0.3)',
                    border: selected.length > 0
                      ? `1px solid ${neonPurple}`
                      : '1px solid rgba(100, 100, 130, 0.3)',
                    borderRadius: '6px',
                    ...neonText,
                    fontSize: '10px',
                    color: selected.length > 0 ? '#FFFFFF' : '#8B80A0',
                    cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: selected.length > 0 ? `0 0 12px ${neonPurple}40` : 'none',
                  }}
                >
                  确认答案
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: `linear-gradient(180deg, ${neonCyan}, #00A080)`,
                    border: `1px solid ${neonCyan}`,
                    borderRadius: '6px',
                    ...neonText,
                    fontSize: '10px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: `0 0 12px ${neonCyan}40`,
                  }}
                >
                  {currentIndex < QUESTIONS.length - 1 ? '下一题' : '查看结果'}
                </button>
              )}
            </div>
          </>
        ) : (
          /* 结果界面 */
          <div className="px-4 py-6 text-center">
            <div
              style={{
                ...neonText,
                fontSize: '24px',
                color: neonYellow,
                marginBottom: '8px',
                textShadow: `0 0 12px ${neonYellow}80`,
              }}
            >
              🎉 答题完成！
            </div>
            
            <div
              style={{
                ...neonText,
                fontSize: '12px',
                color: '#8B80A0',
                marginBottom: '16px',
              }}
            >
              答对 {correctCount} / {QUESTIONS.length} 题
            </div>

            <div
              className="mx-auto mb-4"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `conic-gradient(${neonCyan} ${(correctCount / QUESTIONS.length) * 360}deg, rgba(100, 100, 130, 0.3) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                className="absolute inset-2 rounded-full"
                style={{ background: '#0D0B1A' }}
              />
              <div
                className="relative z-10"
                style={{
                  ...neonText,
                  fontSize: '20px',
                  color: neonCyan,
                  fontWeight: 700,
                }}
              >
                {Math.round((correctCount / QUESTIONS.length) * 100)}%
              </div>
            </div>

            <div
              style={{
                ...neonText,
                fontSize: '9px',
                color: '#A0A0C0',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              {correctCount >= 9 && '🏆 完美答题！知识渊博的末日战士！'}
              {correctCount >= 7 && correctCount < 9 && '⭐ 优秀！继续保持！'}
              {correctCount >= 5 && correctCount < 7 && '👍 不错！还有提升空间！'}
              {correctCount >= 3 && correctCount < 5 && '💪 继续努力！'}
              {correctCount < 3 && '📖 多了解游戏知识吧！'}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: 'rgba(100, 100, 130, 0.2)',
                  border: '1px solid rgba(100, 100, 130, 0.4)',
                  borderRadius: '6px',
                  ...neonText,
                  fontSize: '10px',
                  color: '#C0C0E0',
                  cursor: 'pointer',
                }}
              >
                再答一次
              </button>
              <button
                onClick={handleClaimReward}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: `linear-gradient(180deg, ${neonYellow}, #C9A300)`,
                  border: `1px solid ${neonYellow}`,
                  borderRadius: '6px',
                  ...neonText,
                  fontSize: '10px',
                  color: '#1A1535',
                  cursor: 'pointer',
                  boxShadow: `0 0 12px ${neonYellow}40`,
                }}
              >
                领取奖励
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const QuizModal = QuizModalImpl;
