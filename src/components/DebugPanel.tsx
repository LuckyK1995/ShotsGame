import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store/gameStore';
import { Equipment, EquipSlot } from '../game/types/game';
import { EQUIP_SLOTS, createEquipment } from '../game/data/equipment';

type PowerWeights = { attack: number; attackSpeed: number; maxHealth: number; critRate: number; critDamage: number; physicalPenetration: number; lifestealPercent: number; range: number; defense: number; burnChance: number; poisonChance: number; freezeChance: number; lightningChance: number };

interface GameEngineRef {
  current: {
    spawnSandbags: () => void;
    destroySandbags: () => void;
    spawnMonsterSandbag: () => void;
    destroyMonsterSandbags: () => void;
    resetSkillCooldowns: () => void;
    syncEquipmentState: (equipment: Equipment[], equipmentStorage: Equipment[]) => void;
    learnAllSkills: () => void;
    learnAllFxSkills: () => void;
    learnAllStatSkills: () => void;
    learnAllCloneSkills: () => void;
    levelUpTo100: () => void;
    levelUpBy: (amount: number) => void;
    debugSkipWaves: (amount: number) => void;
    debugMultiplyEnemySpeed: (multiplier: number) => void;
    debugSpawnElite: () => void;
    debugSpawnBoss: () => void;
    debugSetAttacking: (enabled: boolean) => void;
    addSkillPoints: (amount: number) => void;
    getDebugConfig: () => {
      baseStats: { attack: number; attackSpeed: number; manualAttackSpeed: number; maxHealth: number; range: number; level: number };
      powerWeights: PowerWeights;
      enemyPowerWeights: PowerWeights;
    };
    setBaseStats: (stats: Partial<{ attack: number; attackSpeed: number; manualAttackSpeed: number; maxHealth: number; range: number; level: number }>) => void;
    setPowerWeights: (weights: Partial<PowerWeights>) => void;
    setEnemyPowerWeights: (weights: Partial<PowerWeights>) => void;
    getPlayerStats: () => Record<string, number>;
    setPlayerStats: (stats: Record<string, number>) => void;
    getEnemyStats: () => Record<string, number>;
    setEnemyStats: (stats: Record<string, number>) => void;
    getPowerCalcProcess: () => string;
    getEnemyPowerCalcProcess: () => string;
  } | null;
}

interface DebugPanelProps {
  engineRef?: GameEngineRef;
}

const baseStatFields: { key: string; label: string; step: number }[] = [
  { key: 'attack', label: '攻击力', step: 1 },
  { key: 'attackSpeed', label: '攻击间隔(ms)', step: 10 },
  { key: 'manualAttackSpeed', label: '手动攻击间隔(ms)', step: 10 },
  { key: 'maxHealth', label: '最大生命', step: 10 },
  { key: 'range', label: '射程', step: 10 },
  { key: 'level', label: '等级', step: 1 },
];

const powerWeightFields: { key: string; label: string; step: number }[] = [
  { key: 'attack', label: '攻击', step: 0.5 },
  { key: 'attackSpeed', label: '攻速', step: 0.5 },
  { key: 'maxHealth', label: '生命', step: 0.1 },
  { key: 'critRate', label: '暴击率', step: 0.5 },
  { key: 'critDamage', label: '暴击伤害', step: 0.5 },
  { key: 'physicalPenetration', label: '物理穿透', step: 1 },
  { key: 'lifestealPercent', label: '吸血', step: 1 },
  { key: 'range', label: '射程', step: 0.1 },
  { key: 'defense', label: '防御', step: 0.5 },
  { key: 'burnChance', label: '灼烧几率', step: 0.5 },
  { key: 'poisonChance', label: '中毒几率', step: 0.5 },
  { key: 'freezeChance', label: '冰冻几率', step: 0.5 },
  { key: 'lightningChance', label: '雷电几率', step: 0.5 },
];

// 玩家当前属性分组
const playerStatGroups: { title: string; fields: { key: string; label: string; step: number }[] }[] = [
  {
    title: '基础',
    fields: [
      { key: 'level', label: '等级', step: 1 },
      { key: 'exp', label: '经验', step: 1 },
      { key: 'expToNextLevel', label: '升级所需经验', step: 1 },
      { key: 'gold', label: '金币', step: 10 },
      { key: 'score', label: '分数', step: 10 },
      { key: 'skillPoints', label: '技能点', step: 1 },
    ],
  },
  {
    title: '生命/防御',
    fields: [
      { key: 'health', label: '当前生命', step: 1 },
      { key: 'maxHealth', label: '最大生命', step: 10 },
      { key: 'defense', label: '防御', step: 1 },
      { key: 'regenPerSec', label: '每秒回血', step: 0.1 },
      { key: 'resistance', label: '抗性', step: 1 },
    ],
  },
  {
    title: '攻击',
    fields: [
      { key: 'attack', label: '攻击力', step: 1 },
      { key: 'attackSpeed', label: '攻击间隔(ms)', step: 10 },
      { key: 'manualAttackSpeed', label: '手动攻击间隔(ms)', step: 10 },
      { key: 'range', label: '射程', step: 10 },
      { key: 'critRate', label: '暴击率(%)', step: 0.5 },
      { key: 'critDamage', label: '暴击伤害(%)', step: 1 },
      { key: 'physicalPenetration', label: '物理穿透', step: 1 },
      { key: 'bulletPierceCount', label: '子弹穿透数', step: 1 },
      { key: 'lifestealPercent', label: '吸血(%)', step: 0.1 },
    ],
  },
  {
    title: '元素几率',
    fields: [
      { key: 'burnChance', label: '灼烧几率', step: 0.5 },
      { key: 'poisonChance', label: '中毒几率', step: 0.5 },
      { key: 'freezeChance', label: '冰冻几率', step: 0.5 },
      { key: 'lightningChance', label: '雷电几率', step: 0.5 },
    ],
  },
  {
    title: '元素伤害/持续',
    fields: [
      { key: 'burnDamage', label: '灼烧伤害', step: 1 },
      { key: 'burnDuration', label: '灼烧时长(ms)', step: 100 },
      { key: 'poisonDamage', label: '中毒伤害', step: 1 },
      { key: 'poisonDuration', label: '中毒时长(ms)', step: 100 },
      { key: 'freezeSlowAmount', label: '冰冻减速(%)', step: 1 },
      { key: 'freezeDuration', label: '冰冻时长(ms)', step: 100 },
      { key: 'lightningChain', label: '雷电连锁数', step: 1 },
      { key: 'lightningDamage', label: '雷电伤害', step: 1 },
    ],
  },
  {
    title: '加成',
    fields: [
      { key: 'magnetRangeBonus', label: '拾取范围加成', step: 10 },
      { key: 'goldBonus', label: '金币加成(%)', step: 1 },
      { key: 'expBonus', label: '经验加成(%)', step: 1 },
      { key: 'dropBonus', label: '掉落加成(%)', step: 1 },
    ],
  },
];

// 怪物当前属性分组
const enemyStatGroups: { title: string; fields: { key: string; label: string; step: number }[] }[] = [
  {
    title: '基础',
    fields: [
      { key: 'maxHealth', label: '最大生命', step: 10 },
      { key: 'health', label: '当前生命', step: 1 },
      { key: 'damage', label: '伤害', step: 1 },
      { key: 'speed', label: '速度', step: 0.1 },
      { key: 'attack', label: '攻击力', step: 1 },
      { key: 'attackSpeed', label: '攻击间隔(ms)', step: 10 },
    ],
  },
  {
    title: '攻击',
    fields: [
      { key: 'critRate', label: '暴击率(%)', step: 0.5 },
      { key: 'critDamage', label: '暴击伤害(%)', step: 1 },
      { key: 'pierceCount', label: '穿透数', step: 1 },
      { key: 'lifestealPercent', label: '吸血(%)', step: 0.1 },
      { key: 'range', label: '攻击范围', step: 10 },
      { key: 'defense', label: '防御(%)', step: 0.5 },
    ],
  },
  {
    title: '元素几率',
    fields: [
      { key: 'burnChance', label: '灼烧几率', step: 0.5 },
      { key: 'poisonChance', label: '中毒几率', step: 0.5 },
      { key: 'freezeChance', label: '冰冻几率', step: 0.5 },
      { key: 'lightningChance', label: '雷电几率', step: 0.5 },
    ],
  },
];

// 构建战斗力计算过程字符串
function buildPowerProcess(stats: Record<string, number>, weights: Record<string, number>, isPlayer: boolean): string {
  const attrs = [
    { label: '攻', val: stats.attack || 0, w: weights.attack || 0 },
    { label: '速', val: stats.attackSpeed ? 1000 / stats.attackSpeed : 0, w: weights.attackSpeed || 0 },
    { label: '血', val: stats.maxHealth || 0, w: weights.maxHealth || 0 },
    { label: '暴', val: stats.critRate || 0, w: weights.critRate || 0 },
    { label: '暴伤', val: (stats.critDamage || 0) - 100, w: weights.critDamage || 0 },
    { label: '穿', val: isPlayer ? (stats.physicalPenetration || 0) : (stats.pierceCount || 0), w: isPlayer ? (weights.physicalPenetration || 0) : (weights.pierceCount || 0) },
    { label: '吸', val: stats.lifestealPercent || 0, w: weights.lifestealPercent || 0 },
    { label: '程', val: stats.range || 0, w: weights.range || 0 },
    { label: '防', val: stats.defense || 0, w: weights.defense || 0 },
    { label: '燃', val: stats.burnChance || 0, w: weights.burnChance || 0 },
    { label: '毒', val: stats.poisonChance || 0, w: weights.poisonChance || 0 },
    { label: '冰', val: stats.freezeChance || 0, w: weights.freezeChance || 0 },
    { label: '雷', val: stats.lightningChance || 0, w: weights.lightningChance || 0 },
  ];
  const terms: string[] = [];
  let total = 0;
  for (const a of attrs) {
    const contribution = a.val * a.w;
    total += contribution;
    if (Math.abs(contribution) > 0.01) {
      const valStr = Number.isInteger(a.val) ? String(a.val) : a.val.toFixed(1);
      const wStr = Number.isInteger(a.w) ? String(a.w) : a.w.toFixed(1);
      terms.push(`${a.label}${valStr}*${wStr}`);
    }
  }
  return terms.join('+') + '=' + Math.round(total);
}

const DebugPanel: React.FC<DebugPanelProps> = ({ engineRef }) => {
  const { equipment, equipmentStorage, setEquipment, setEquipmentStorage } = useGameStore();

  const [showBaseStats, setShowBaseStats] = useState(false);
  const [showPowerWeights, setShowPowerWeights] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [baseStatsForm, setBaseStatsForm] = useState<Record<string, number>>({});
  const [powerWeightsForm, setPowerWeightsForm] = useState<Record<string, number>>({});
  const [enemyPowerWeightsForm, setEnemyPowerWeightsForm] = useState<Record<string, number>>({});
  const [playerStatsForm, setPlayerStatsForm] = useState<Record<string, number>>({});
  const [enemyStatsForm, setEnemyStatsForm] = useState<Record<string, number>>({});
  const [powerTab, setPowerTab] = useState<'player' | 'enemy'>('player');
  const [statsTab, setStatsTab] = useState<'player' | 'enemy'>('player');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [cachedPlayerStats, setCachedPlayerStats] = useState<Record<string, number>>({});
  const [cachedEnemyStats, setCachedEnemyStats] = useState<Record<string, number>>({});

  useEffect(() => {
    if (showBaseStats && engineRef?.current) {
      const cfg = engineRef.current.getDebugConfig();
      setBaseStatsForm({ ...cfg.baseStats });
    }
  }, [showBaseStats, engineRef]);

  useEffect(() => {
    if (showPowerWeights && engineRef?.current) {
      const cfg = engineRef.current.getDebugConfig();
      setPowerWeightsForm({ ...cfg.powerWeights });
      setEnemyPowerWeightsForm({ ...cfg.enemyPowerWeights });
      setCachedPlayerStats(engineRef.current.getPlayerStats());
      setCachedEnemyStats(engineRef.current.getEnemyStats());
    }
  }, [showPowerWeights, engineRef]);

  useEffect(() => {
    if (showPlayerStats && engineRef?.current) {
      setPlayerStatsForm({ ...engineRef.current.getPlayerStats() });
      setEnemyStatsForm({ ...engineRef.current.getEnemyStats() });
    }
  }, [showPlayerStats, engineRef]);

  const syncBoth = (newEquipped: Equipment[], newStorage: Equipment[]) => {
    setEquipment(newEquipped);
    setEquipmentStorage(newStorage);
    engineRef?.current?.syncEquipmentState(newEquipped, newStorage);
  };

  // 调试面板内使用与全局主题不同的颜色（仅限调试用途）
  const neonRed = '#FF3B3B';
  const neonYellow = '#FFE600';
  const neonCyan = '#00F5D4';
  const neonPurple = '#B026FF';
  const neonPink = '#FF0080';
  const neonBlue = '#00B4FF';
  const neonGreen = '#00FF7F';

  const btnStyle = (color: string) => ({
    fontFamily: '"Rajdhani", "Orbitron", monospace',
    fontSize: '10px',
    fontWeight: 600,
    color: color,
    background: `${color}10`,
    border: `1px solid ${color}40`,
    borderRadius: '8px',
    boxShadow: `0 0 8px ${color}20`,
    padding: '8px 12px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'all 0.15s',
  });

  const sectionTitle = {
    fontFamily: '"Rajdhani", "Orbitron", monospace',
    fontSize: '11px',
    fontWeight: 700,
    color: neonPurple,
    letterSpacing: '1px',
    textShadow: `0 0 8px ${neonPurple}60`,
    marginBottom: '8px',
  };

  // 全屏弹窗 - 参考装备栏查看属性，整个游戏画面显示
  const modalOverlay: React.CSSProperties = {
    position: 'fixed',
    top: '50px', left: '50px', right: '50px', bottom: '50px',
    background: 'rgba(0,0,0,0.85)',
    zIndex: 1000,
    borderRadius: '12px',
    overflow: 'hidden',
  };

  const modalBox: React.CSSProperties = {
    background: 'rgba(19, 16, 37, 0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(176, 38, 255, 0.4)',
    boxShadow: '0 0 30px rgba(176, 38, 255, 0.25)',
    borderRadius: '12px',
    width: '100%',
    height: '100%',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  const modalTitle = (color: string, text: string): React.CSSProperties => ({
    fontFamily: '"Rajdhani", "Orbitron", monospace',
    fontSize: '14px',
    fontWeight: 700,
    color: color,
    textShadow: `0 0 8px ${color}60`,
    marginBottom: '10px',
    letterSpacing: '1px',
    textAlign: 'center',
  });

  // 网格字段样式
  const gridFieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const gridLabelStyle = (color: string): React.CSSProperties => ({
    fontSize: '9px',
    color: color,
    opacity: 0.8,
    fontFamily: '"Rajdhani", "Orbitron", monospace',
    letterSpacing: '0.3px',
  });

  const gridInputStyle: React.CSSProperties = {
    background: 'rgba(176, 38, 255, 0.08)',
    border: '1px solid rgba(176, 38, 255, 0.3)',
    borderRadius: '6px',
    color: '#fff',
    padding: '5px 6px',
    fontSize: '10px',
    fontFamily: '"Rajdhani", "Orbitron", monospace',
    outline: 'none',
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
  };

  const groupTitleStyle = (color: string): React.CSSProperties => ({
    fontFamily: '"Rajdhani", "Orbitron", monospace',
    fontSize: '11px',
    fontWeight: 700,
    color: color,
    textShadow: `0 0 6px ${color}50`,
    margin: '10px 0 6px',
    paddingBottom: '4px',
    borderBottom: `1px solid ${color}30`,
    letterSpacing: '1px',
  });

  const tabBtnStyle = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1,
    padding: '7px 12px',
    fontSize: '11px',
    fontWeight: 700,
    fontFamily: '"Rajdhani", "Orbitron", monospace',
    color: active ? color : '#666',
    background: active ? `${color}15` : 'transparent',
    border: `1px solid ${active ? color : '#333'}`,
    borderRadius: '8px',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all 0.15s',
  });

  const handleSaveBaseStats = () => {
    if (!engineRef?.current) return;
    const stats: Record<string, number> = {};
    for (const f of baseStatFields) {
      const v = parseFloat(baseStatsForm[f.key] as any);
      if (!isNaN(v)) stats[f.key] = v;
    }
    engineRef.current.setBaseStats(stats as any);
    setShowBaseStats(false);
  };

  const handleSavePowerWeights = () => {
    if (!engineRef?.current) return;
    const weights: Record<string, number> = {};
    for (const f of powerWeightFields) {
      const v = parseFloat(powerWeightsForm[f.key] as any);
      if (!isNaN(v)) weights[f.key] = v;
    }
    engineRef.current.setPowerWeights(weights as any);

    const enemyWeights: Record<string, number> = {};
    for (const f of powerWeightFields) {
      const v = parseFloat(enemyPowerWeightsForm[f.key] as any);
      if (!isNaN(v)) enemyWeights[f.key] = v;
    }
    engineRef.current.setEnemyPowerWeights(enemyWeights as any);
    setShowPowerWeights(false);
  };

  const handleSavePlayerStats = () => {
    if (!engineRef?.current) return;
    const stats: Record<string, number> = {};
    for (const group of playerStatGroups) {
      for (const f of group.fields) {
        const v = parseFloat(playerStatsForm[f.key] as any);
        if (!isNaN(v)) stats[f.key] = v;
      }
    }
    engineRef.current.setPlayerStats(stats);

    const eStats: Record<string, number> = {};
    for (const group of enemyStatGroups) {
      for (const f of group.fields) {
        const v = parseFloat(enemyStatsForm[f.key] as any);
        if (!isNaN(v)) eStats[f.key] = v;
      }
    }
    engineRef.current.setEnemyStats(eStats);
    setShowPlayerStats(false);
  };

  // 渲染网格字段
  const renderGridFields = (
    fields: { key: string; label: string; step: number }[],
    formState: Record<string, number>,
    setFormState: React.Dispatch<React.SetStateAction<Record<string, number>>>,
    color: string,
    columns: number,
  ) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '6px 8px',
    }}>
      {fields.map(f => (
        <div key={f.key} style={gridFieldStyle}>
          <span style={gridLabelStyle(color)}>{f.label}</span>
          <input
            type="number"
            step={f.step}
            value={formState[f.key] ?? 0}
            onChange={(e) => setFormState(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
            style={gridInputStyle}
          />
        </div>
      ))}
    </div>
  );

  // 渲染分组网格字段
  const renderGroupedFields = (
    groups: { title: string; fields: { key: string; label: string; step: number }[] }[],
    formState: Record<string, number>,
    setFormState: React.Dispatch<React.SetStateAction<Record<string, number>>>,
    color: string,
    columns: number,
  ) => (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {groups.map(group => (
        <div key={group.title}>
          <div style={groupTitleStyle(color)}>{group.title}</div>
          {renderGridFields(group.fields, formState, setFormState, color, columns)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto relative">
      <div style={{ padding: '4px 2px 8px' }}>
        <div style={{ ...sectionTitle, color: neonRed, textShadow: `0 0 8px ${neonRed}60` }}>
          ⚙ 调试面板
        </div>

        {/* 配置调试 */}
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionTitle}>配置调试</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => setShowBaseStats(true)}
              style={{ ...btnStyle(neonCyan), width: '100%' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonCyan}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonCyan}10`; }}
            >
              📊 基础属性配置
            </button>
            <button
              onClick={() => { setShowPowerWeights(true); setPowerTab('player'); }}
              style={{ ...btnStyle(neonYellow), width: '100%' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonYellow}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonYellow}10`; }}
            >
              ⚡ 战斗力权重
            </button>
            <button
              onClick={() => { setShowPlayerStats(true); setStatsTab('player'); }}
              style={{ ...btnStyle(neonPink), width: '100%' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonPink}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonPink}10`; }}
            >
              📋 当前属性配置
            </button>
          </div>
        </div>

        {/* 装备生成 */}
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionTitle}>装备生成</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => {
                const mythicSet = EQUIP_SLOTS.map(slot => createEquipment(slot, 'mythic', 1));
                syncBoth(mythicSet, equipmentStorage);
              }}
              style={btnStyle(neonRed)}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonRed}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonRed}10`; }}
            >
              生成神话9件套 (Lv.1)
            </button>
            <button
              onClick={() => {
                const epicSet = EQUIP_SLOTS.map(slot => createEquipment(slot, 'epic', 1));
                syncBoth(epicSet, equipmentStorage);
              }}
              style={btnStyle('#FFD700')}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FFD70020'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFD70010'; }}
            >
              生成史诗9件套 (Lv.1)
            </button>
            <button
              onClick={() => {
                const legendarySet = EQUIP_SLOTS.map(slot => createEquipment(slot, 'legendary', 1));
                syncBoth(legendarySet, equipmentStorage);
              }}
              style={btnStyle('#FF8C00')}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FF8C0020'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FF8C0010'; }}
            >
              生成传说9件套 (Lv.1)
            </button>
          </div>
        </div>

        {/* 沙袋控制 */}
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionTitle}>沙袋测试</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => engineRef?.current?.spawnSandbags()}
              style={{ ...btnStyle(neonYellow), flex: 1, minWidth: '100px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonYellow}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonYellow}10`; }}
            >
              生成沙袋 (×3)
            </button>
            <button
              onClick={() => engineRef?.current?.destroySandbags()}
              style={{ ...btnStyle(neonRed), flex: 1, minWidth: '100px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonRed}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonRed}10`; }}
            >
              销毁沙袋
            </button>
          </div>
          <div style={{
            fontFamily: '"Rajdhani", "Orbitron", monospace',
            fontSize: '8px',
            color: '#8A7A9A',
            marginTop: '6px',
            lineHeight: '1.5',
          }}>
            无限血量 · 显示受击特效 · 可触发异常状态
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button
              onClick={() => engineRef?.current?.spawnMonsterSandbag()}
              style={{ ...btnStyle('#FF6EC7'), flex: 1, minWidth: '100px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FF6EC720'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FF6EC710'; }}
            >
              生成怪物沙袋 (×1)
            </button>
            <button
              onClick={() => engineRef?.current?.destroyMonsterSandbags()}
              style={{ ...btnStyle('#FF3B3B'), flex: 1, minWidth: '100px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FF3B3B20'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FF3B3B10'; }}
            >
              销毁怪物沙袋
            </button>
          </div>
          <div style={{
            fontFamily: '"Rajdhani", "Orbitron", monospace',
            fontSize: '8px',
            color: '#8A7A9A',
            marginTop: '4px',
            lineHeight: '1.5',
          }}>
            血量1000万 · 其他属性10 · 可击杀测试伤害
          </div>
        </div>

        {/* 技能学习 */}
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionTitle}>技能学习</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => engineRef?.current?.learnAllSkills()}
              style={btnStyle(neonPurple)}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonPurple}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonPurple}10`; }}
            >
              📖 学习全部技能
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => engineRef?.current?.learnAllFxSkills()}
                style={{ ...btnStyle(neonCyan), flex: 1, minWidth: '80px' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${neonCyan}20`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${neonCyan}10`; }}
              >
                全部特效技能
              </button>
              <button
                onClick={() => engineRef?.current?.learnAllStatSkills()}
                style={{ ...btnStyle(neonYellow), flex: 1, minWidth: '80px' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${neonYellow}20`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${neonYellow}10`; }}
              >
                全部属性技能
              </button>
            </div>
            <button
              onClick={() => engineRef?.current?.learnAllCloneSkills()}
              style={btnStyle('#FF6EC7')}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FF6EC720'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FF6EC710'; }}
            >
              👥 学习全部分身技能
            </button>
          </div>
        </div>

        {/* 等级与技能点 */}
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionTitle}>等级 / 技能点</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => engineRef?.current?.levelUpBy(100)}
              style={{ ...btnStyle(neonYellow), flex: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonYellow}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonYellow}10`; }}
            >
              ⬆ 等级 +100
            </button>
            <button
              onClick={() => engineRef?.current?.addSkillPoints(200)}
              style={{ ...btnStyle(neonPurple), flex: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonPurple}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonPurple}10`; }}
            >
              +200 技能点
            </button>
          </div>
        </div>

        {/* 技能冷却 */}
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionTitle}>技能冷却</div>
          <button
            onClick={() => engineRef?.current?.resetSkillCooldowns()}
            style={{ ...btnStyle(neonCyan), width: '100%' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${neonCyan}20`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${neonCyan}10`; }}
          >
            ⟳ 重置全部技能冷却
          </button>
        </div>

        {/* 调试：跳关 / 召唤 / 速度 / 攻击开关 */}
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionTitle}>调试指令</div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <button
              onClick={() => engineRef?.current?.debugSkipWaves(100)}
              style={{ ...btnStyle(neonYellow), flex: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonYellow}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonYellow}10`; }}
            >
              ⏭ 跳100关
            </button>
            <button
              onClick={() => engineRef?.current?.debugSpawnElite()}
              style={{ ...btnStyle(neonPurple), flex: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonPurple}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonPurple}10`; }}
            >
              👹 召唤精英
            </button>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <button
              onClick={() => engineRef?.current?.debugSpawnBoss()}
              style={{ ...btnStyle(neonPink), flex: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonPink}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonPink}10`; }}
            >
              💀 召唤BOSS
            </button>
            <button
              onClick={() => engineRef?.current?.debugMultiplyEnemySpeed(5)}
              style={{ ...btnStyle(neonBlue), flex: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonBlue}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonBlue}10`; }}
            >
              ⏩ 速度×5
            </button>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <button
              onClick={() => engineRef?.current?.debugMultiplyEnemySpeed(20)}
              style={{ ...btnStyle(neonRed), flex: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonRed}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonRed}10`; }}
            >
              ⏩ 速度×20
            </button>
            <button
              onClick={() => engineRef?.current?.debugMultiplyEnemySpeed(1)}
              style={{ ...btnStyle(neonGreen), flex: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonGreen}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonGreen}10`; }}
            >
              ✅ 速度恢复
            </button>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => engineRef?.current?.debugSetAttacking(false)}
              style={{ ...btnStyle('#FF6B6B'), flex: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `#FF6B6B20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `#FF6B6B10`; }}
            >
              ⏸ 停止攻击
            </button>
            <button
              onClick={() => engineRef?.current?.debugSetAttacking(true)}
              style={{ ...btnStyle(neonGreen), flex: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${neonGreen}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${neonGreen}10`; }}
            >
              ▶ 开始攻击
            </button>
          </div>
        </div>

        {/* 重置游戏 */}
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionTitle}>重置游戏</div>
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{ ...btnStyle(neonRed), width: '100%' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${neonRed}20`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${neonRed}10`; }}
          >
            🔄 重置游戏
          </button>
        </div>

        {/* 说明 */}
        <div style={{
          marginTop: '16px',
          padding: '10px',
          background: 'rgba(176, 38, 255, 0.08)',
          border: '1px solid rgba(176, 38, 255, 0.2)',
          borderRadius: '8px',
        }}>
          <div style={{
            fontFamily: '"Rajdhani", "Orbitron", monospace',
            fontSize: '9px',
            fontWeight: 600,
            color: neonPurple,
            marginBottom: '6px',
            letterSpacing: '0.5px',
          }}>
            沙袋位置说明
          </div>
          <div style={{
            fontFamily: '"Rajdhani", "Orbitron", monospace',
            fontSize: '8px',
            color: '#9A8AAA',
            lineHeight: '1.8',
          }}>
            第1个：射击范围 3/5 处，垂直居中<br />
            第2个：略微靠右上方<br />
            第3个：略微靠右下方
          </div>
        </div>
      </div>

      {/* 基础属性配置弹窗 - 每行2个属性 */}
      {showBaseStats && createPortal(
        <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowBaseStats(false); }}>
          <div style={modalBox}>
            <div style={modalTitle(neonCyan, '📊 基础属性配置')}>📊 基础属性配置</div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {renderGridFields(baseStatFields, baseStatsForm, setBaseStatsForm, neonCyan, 2)}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={() => setShowBaseStats(false)}
                style={{ ...btnStyle('#888'), flex: 1, borderColor: '#555', color: '#aaa' }}
              >
                取消
              </button>
              <button
                onClick={handleSaveBaseStats}
                style={{ ...btnStyle(neonCyan), flex: 1 }}
              >
                保存
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 战斗力权重配置弹窗 - 角色/怪物双页，每行3个属性，显示计算过程 */}
      {showPowerWeights && createPortal(
        <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowPowerWeights(false); }}>
          <div style={modalBox}>
            <div style={modalTitle(neonYellow, '⚡ 战斗力权重')}>⚡ 战斗力权重</div>
            {/* Tab 切换 */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <button
                style={tabBtnStyle(powerTab === 'player', neonYellow)}
                onClick={() => setPowerTab('player')}
              >
                角色
              </button>
              <button
                style={tabBtnStyle(powerTab === 'enemy', neonYellow)}
                onClick={() => setPowerTab('enemy')}
              >
                怪物
              </button>
            </div>
            {/* 字段区域 */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {powerTab === 'player'
                ? renderGridFields(powerWeightFields, powerWeightsForm, setPowerWeightsForm, neonYellow, 3)
                : renderGridFields(powerWeightFields, enemyPowerWeightsForm, setEnemyPowerWeightsForm, neonYellow, 3)
              }
            </div>
            {/* 战斗力计算过程 */}
            <div style={{
              padding: '8px 10px',
              background: 'rgba(255, 230, 0, 0.08)',
              border: '1px solid rgba(255, 230, 0, 0.3)',
              borderRadius: '6px',
              marginBottom: '8px',
              fontSize: '9px',
              color: neonYellow,
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              wordBreak: 'break-all',
              lineHeight: 1.6,
              textShadow: `0 0 4px ${neonYellow}40`,
            }}>
              {powerTab === 'player'
                ? buildPowerProcess(cachedPlayerStats, powerWeightsForm, true)
                : (Object.keys(cachedEnemyStats).length > 0
                  ? buildPowerProcess(cachedEnemyStats, enemyPowerWeightsForm, false)
                  : '无活动怪物')
              }
            </div>
            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowPowerWeights(false)}
                style={{ ...btnStyle('#888'), flex: 1, borderColor: '#555', color: '#aaa' }}
              >
                取消
              </button>
              <button
                onClick={handleSavePowerWeights}
                style={{ ...btnStyle(neonYellow), flex: 1 }}
              >
                保存
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 当前属性配置弹窗 - 角色/怪物双页，每行3个属性 */}
      {showPlayerStats && createPortal(
        <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowPlayerStats(false); }}>
          <div style={modalBox}>
            <div style={modalTitle(neonYellow, '📋 当前属性配置')}>📋 当前属性配置</div>
            {/* Tab 切换 */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <button
                style={tabBtnStyle(statsTab === 'player', neonYellow)}
                onClick={() => setStatsTab('player')}
              >
                角色
              </button>
              <button
                style={tabBtnStyle(statsTab === 'enemy', neonYellow)}
                onClick={() => setStatsTab('enemy')}
              >
                怪物
              </button>
            </div>
            {/* 字段区域 */}
            {statsTab === 'player'
              ? renderGroupedFields(playerStatGroups, playerStatsForm, setPlayerStatsForm, neonYellow, 3)
              : (Object.keys(enemyStatsForm).length > 0
                ? renderGroupedFields(enemyStatGroups, enemyStatsForm, setEnemyStatsForm, neonYellow, 3)
                : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '11px' }}>无活动怪物</div>
              )
            }
            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={() => setShowPlayerStats(false)}
                style={{ ...btnStyle('#888'), flex: 1, borderColor: '#555', color: '#aaa' }}
              >
                取消
              </button>
              <button
                onClick={handleSavePlayerStats}
                style={{ ...btnStyle(neonYellow), flex: 1 }}
              >
                保存
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 重置游戏确认弹窗 */}
      {showResetConfirm && createPortal(
        <div
          style={{ ...modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetConfirm(false); }}
        >
          <div style={{ ...modalBox, width: '280px', height: 'auto', padding: '16px' }}>
            <div style={modalTitle(neonRed, '⚠ 重置游戏')}>
              ⚠ 重置游戏
            </div>
            <div style={{
              fontFamily: '"Rajdhani", "Orbitron", monospace',
              fontSize: '11px',
              color: '#E0E0FF',
              textAlign: 'center',
              marginBottom: '14px',
              lineHeight: '1.6',
            }}>
              将清除所有本地缓存（存档、最高分、<br />
              离线奖励、批量出售设置等），<br />
              从头开始游戏。<br />
              <span style={{ color: neonRed }}>此操作不可撤销！</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{ ...btnStyle('#888'), flex: 1, borderColor: '#555', color: '#aaa' }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  // 清除所有游戏相关缓存
                  localStorage.removeItem('shotsGameSave');
                  localStorage.removeItem('shotsGameHighScore');
                  localStorage.removeItem('batchSellQualities');
                  localStorage.removeItem('batchSellItemQualities');
                  localStorage.removeItem('shotsGame_lastOnline');
                  window.location.reload();
                }}
                style={{ ...btnStyle(neonRed), flex: 1 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${neonRed}20`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${neonRed}10`; }}
              >
                确认重置
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export { DebugPanel };
