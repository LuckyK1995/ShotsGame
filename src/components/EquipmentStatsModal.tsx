import { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { Equipment, EquipRarity, ElementType } from '../game/types/game';
import { EquipmentIcon } from './EquipmentIcon';
import {
  RARITY_COLORS,
  RARITY_LABELS,
  SLOT_LABELS,
  EQUIP_SLOTS,
  getQualitySetGroups,
  QUALITY_SETS,
} from '../game/data/equipment';

interface EquipmentStatsModalProps {
  onClose: () => void;
}

const neonCyan = '#00F5D4';
const neonPurple = '#B026FF';
const neonPink = '#FF0080';
const neonYellow = '#FFE600';

const ELEMENT_LABELS: Record<ElementType, string> = {
  fire: '火',
  ice: '冰',
  lightning: '雷',
  poison: '毒',
  physical: '物理',
};

const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#FF6B35',
  ice: '#5BC0EB',
  lightning: '#FFD700',
  poison: '#9B59B6',
  physical: '#FFFFFF',
};

function affixLabel(type: string, value: number, element?: ElementType): string {
  switch (type) {
    case 'attack': return `+${value} 攻击`;
    case 'defense': return `+${value} 防御`;
    case 'resistance': return `+${value} 抗性`;
    case 'health': return `+${value} 生命`;
    case 'critRate': return `+${value}% 暴击`;
    case 'critDamage': return `+${value}% 暴伤`;
    case 'attackSpeed': return `+${value}% 攻速`;
    case 'range': return `+${value} 射程`;
    case 'pierce': return `+${value} 穿透`;
    case 'elementalDamage': return `+${value} ${element ? ELEMENT_LABELS[element] : ''}属性伤害`;
    case 'statusFreeze': return `+${value}% 冰冻附魔`;
    case 'statusPoison': return `+${value}% 中毒附魔`;
    case 'statusBurn': return `+${value}% 灼烧附魔`;
    default: return `+${value}`;
  }
}

function getStatColor(statName: string): string {
  if (statName.includes('攻击') && !statName.includes('攻速') && !statName.includes('速度')) return neonPink;
  if (statName.includes('防御')) return '#5BA3E0';
  if (statName.includes('抗性')) return '#5BA3E0';
  if (statName.includes('生命') || statName.includes('血量')) return '#34C759';
  if (statName.includes('暴击') && !statName.includes('暴伤')) return neonPurple;
  if (statName.includes('暴伤')) return neonPurple;
  if (statName.includes('攻速') || statName.includes('攻击速度')) return neonCyan;
  if (statName.includes('射程')) return '#34C759';
  if (statName.includes('穿透')) return neonYellow;
  if (statName.includes('全属性')) return neonYellow;
  return '#FFFFFF';
}

function renderSetEffectDescription(description: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = description;
  let key = 0;
  
  const patterns = [
    { regex: /攻击力/, name: '攻击力' },
    { regex: /攻击速度/, name: '攻击速度' },
    { regex: /攻速/, name: '攻速' },
    { regex: /暴击伤害/, name: '暴击伤害' },
    { regex: /暴伤/, name: '暴伤' },
    { regex: /暴击率/, name: '暴击率' },
    { regex: /暴击/, name: '暴击' },
    { regex: /防御力/, name: '防御力' },
    { regex: /防御/, name: '防御' },
    { regex: /抗性/, name: '抗性' },
    { regex: /生命值/, name: '生命值' },
    { regex: /生命/, name: '生命' },
    { regex: /射程/, name: '射程' },
    { regex: /穿透/, name: '穿透' },
    { regex: /全属性/, name: '全属性' },
  ];
  
  while (remaining.length > 0) {
    let earliestIdx = -1;
    let earliestMatch = '';
    let earliestName = '';
    
    for (const p of patterns) {
      const idx = remaining.search(p.regex);
      if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
        earliestIdx = idx;
        earliestMatch = remaining.match(p.regex)![0];
        earliestName = p.name;
      }
    }
    
    if (earliestIdx === -1) {
      parts.push(<span key={key++} style={{ color: '#FFFFFF' }}>{remaining}</span>);
      break;
    }
    
    if (earliestIdx > 0) {
      parts.push(<span key={key++} style={{ color: '#FFFFFF' }}>{remaining.slice(0, earliestIdx)}</span>);
    }
    
    parts.push(<span key={key++} style={{ color: getStatColor(earliestName) }}>{earliestMatch}</span>);
    remaining = remaining.slice(earliestIdx + earliestMatch.length);
  }
  
  return parts;
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(19, 16, 37, 0.92)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(176, 38, 255, 0.3)',
  borderRadius: '12px',
  boxShadow: '0 0 30px rgba(176, 38, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const panelStyle: React.CSSProperties = {
  background: 'rgba(13, 11, 26, 0.5)',
  border: '1px solid rgba(176, 38, 255, 0.15)',
  borderRadius: '8px',
};

const neonText: React.CSSProperties = {
  fontFamily: '"Rajdhani", "Orbitron", "Courier New", monospace',
  fontWeight: 600,
  letterSpacing: '0.3px',
};

const navBtnStyle: React.CSSProperties = {
  fontFamily: '"Rajdhani", "Orbitron", monospace',
  fontSize: '11px',
  fontWeight: 700,
  color: neonCyan,
  background: 'rgba(0, 245, 212, 0.1)',
  border: '1px solid rgba(0, 245, 212, 0.3)',
  borderRadius: '6px',
  padding: '2px 8px',
  cursor: 'pointer',
  minWidth: '24px',
};

interface EquipStats {
  attack: number;
  defense: number;
  resistance: number;
  health: number;
  critRate: number;
  critDamage: number;
  attackSpeed: number;
  range: number;
  pierce: number;
  elementalDamage: Record<ElementType, number>;
  statusFreeze: number;
  statusPoison: number;
  statusBurn: number;
}

function calcEquipTotalStats(equipment: Equipment[]): EquipStats {
  const stats: EquipStats = {
    attack: 0,
    defense: 0,
    resistance: 0,
    health: 0,
    critRate: 0,
    critDamage: 0,
    attackSpeed: 0,
    range: 0,
    pierce: 0,
    elementalDamage: { fire: 0, ice: 0, lightning: 0, poison: 0, physical: 0 },
    statusFreeze: 0,
    statusPoison: 0,
    statusBurn: 0,
  };
  for (const e of equipment) {
    if (e.attack) stats.attack += e.attack;
    if (e.defense) stats.defense += e.defense;
    if (e.health) stats.health += e.health;
    if (e.attackSpeed) stats.attackSpeed += e.attackSpeed;
    if (e.range) stats.range += e.range;
    if (e.critRate) stats.critRate += e.critRate;
    if (e.critDamage) stats.critDamage += e.critDamage;
    if (e.element && e.elementalDamage) {
      stats.elementalDamage[e.element] += e.elementalDamage;
    }
    if (e.affixes) {
      for (const a of e.affixes) {
        switch (a.type) {
          case 'attack': stats.attack += a.value; break;
          case 'defense': stats.defense += a.value; break;
          case 'resistance': stats.resistance += a.value; break;
          case 'health': stats.health += a.value; break;
          case 'critRate': stats.critRate += a.value; break;
          case 'critDamage': stats.critDamage += a.value; break;
          case 'attackSpeed': stats.attackSpeed += a.value; break;
          case 'range': stats.range += a.value; break;
          case 'pierce': stats.pierce += a.value; break;
          case 'elementalDamage':
            if (a.element) stats.elementalDamage[a.element] += a.value;
            break;
          case 'statusFreeze': stats.statusFreeze += a.value; break;
          case 'statusPoison': stats.statusPoison += a.value; break;
          case 'statusBurn': stats.statusBurn += a.value; break;
        }
      }
    }
  }
  return stats;
}

export function EquipmentStatsModal({ onClose }: EquipmentStatsModalProps) {
  const { equipment } = useGameStore();
  const [equipIndex, setEquipIndex] = useState(0);
  const [rightPage, setRightPage] = useState(0);

  const equippedList = useMemo(() => {
    return EQUIP_SLOTS.map(slot => equipment.find(e => e.slot === slot)).filter(Boolean) as Equipment[];
  }, [equipment]);

  const setGroups = useMemo(() => getQualitySetGroups(equipment), [equipment]);
  const currentEquip = equippedList[equipIndex] || null;
  const totalStats = useMemo(() => calcEquipTotalStats(equipment), [equipment]);

  const rightPages = useMemo(() => {
    const pages: { label: string; value: string; color: string }[][] = [];
    const page1: { label: string; value: string; color: string }[] = [];

    if (totalStats.attack > 0) page1.push({ label: '攻击力', value: `+${totalStats.attack}`, color: neonPink });
    if (totalStats.defense > 0) page1.push({ label: '防御', value: `+${totalStats.defense}`, color: '#5BA3E0' });
    if (totalStats.resistance > 0) page1.push({ label: '抗性', value: `+${totalStats.resistance}`, color: '#5BA3E0' });
    if (totalStats.health > 0) page1.push({ label: '生命值', value: `+${totalStats.health}`, color: '#34C759' });
    if (totalStats.critRate > 0) page1.push({ label: '暴击率', value: `+${totalStats.critRate}%`, color: neonPurple });
    if (totalStats.critDamage > 0) page1.push({ label: '暴击伤害', value: `+${totalStats.critDamage}%`, color: neonPurple });
    if (totalStats.attackSpeed > 0) page1.push({ label: '攻击速度', value: `+${totalStats.attackSpeed}%`, color: neonCyan });
    if (totalStats.range > 0) page1.push({ label: '射程', value: `+${totalStats.range}`, color: '#34C759' });
    if (totalStats.pierce > 0) page1.push({ label: '穿透', value: `+${totalStats.pierce}`, color: neonYellow });

    (['fire', 'ice', 'lightning', 'poison'] as ElementType[]).forEach(el => {
      const v = totalStats.elementalDamage[el];
      if (v > 0) page1.push({ label: `${ELEMENT_LABELS[el]}属性伤害`, value: `+${v}`, color: ELEMENT_COLORS[el] });
    });
    if (totalStats.statusFreeze > 0) page1.push({ label: '冰冻附魔', value: `+${totalStats.statusFreeze}%`, color: '#5BC0EB' });
    if (totalStats.statusPoison > 0) page1.push({ label: '中毒附魔', value: `+${totalStats.statusPoison}%`, color: '#9B59B6' });
    if (totalStats.statusBurn > 0) page1.push({ label: '灼烧附魔', value: `+${totalStats.statusBurn}%`, color: '#FF6B35' });

    if (page1.length > 0) pages.push(page1);
    return pages;
  }, [totalStats]);

  const currentRightPage = rightPages[rightPage] || [];

  const navEquip = (dir: number) => {
    if (equippedList.length === 0) return;
    setEquipIndex((prev) => (prev + dir + equippedList.length) % equippedList.length);
  };
  const navRightPage = (dir: number) => {
    if (rightPages.length === 0) return;
    setRightPage((prev) => (prev + dir + rightPages.length) % rightPages.length);
  };

  return (
    <div
      className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none"
      style={{ bottom: '4px' }}
    >
      <div
        className="relative flex flex-col pointer-events-auto"
        style={{ ...cardStyle, width: '400px', maxWidth: '94vw', padding: '12px 14px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <span style={{ ...neonText, fontSize: '12px', color: neonCyan, fontWeight: 700 }}>
            装备属性总览
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 45, 85, 0.2)',
              border: '1px solid rgba(255, 45, 85, 0.4)',
              color: '#FF2D55',
              width: '22px',
              height: '22px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '6px',
            }}
          >
            X
          </button>
        </div>

        <div className="flex gap-2" style={{ height: '240px' }}>
          {/* 左侧：上装备属性 + 下套装属性 */}
          <div className="flex flex-col gap-2" style={{ width: '55%' }}>
            {/* 左上：单件装备属性（占2/3高度） */}
            <div className="flex flex-col" style={{ ...panelStyle, height: '66%', padding: '6px 8px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ ...neonText, fontSize: '8px', color: neonPurple }}>装备属性</span>
                <div className="flex gap-1">
                  <button style={navBtnStyle} onClick={() => navEquip(-1)}>←</button>
                  <span style={{ ...neonText, fontSize: '8px', color: '#8B80A0', alignSelf: 'center' }}>
                    {equippedList.length > 0 ? `${equipIndex + 1}/${equippedList.length}` : '0/0'}
                  </span>
                  <button style={navBtnStyle} onClick={() => navEquip(1)}>→</button>
                </div>
              </div>
              {currentEquip ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: '32px', height: '32px',
                        border: `1.5px solid ${RARITY_COLORS[currentEquip.rarity as keyof typeof RARITY_COLORS] || neonCyan}`,
                        borderRadius: '6px',
                        background: 'rgba(19, 16, 37, 0.6)',
                      }}
                    >
                      <EquipmentIcon slot={currentEquip.slot} rarity={currentEquip.rarity} variant={currentEquip.iconVariant} size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          ...neonText, fontSize: '9px', fontWeight: 700,
                          color: RARITY_COLORS[currentEquip.rarity as keyof typeof RARITY_COLORS] || neonCyan,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {RARITY_LABELS[currentEquip.rarity]} {currentEquip.name}
                      </div>
                      <div style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>
                        {SLOT_LABELS[currentEquip.slot]} · Lv.{currentEquip.level}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {currentEquip.attack ? <StatRow label="攻击" value={`+${currentEquip.attack}`} color={neonPink} /> : null}
                    {currentEquip.health ? <StatRow label="生命" value={`+${currentEquip.health}`} color="#34C759" /> : null}
                    {currentEquip.defense ? <StatRow label="防御" value={`+${currentEquip.defense}`} color="#5BA3E0" /> : null}
                    {currentEquip.attackSpeed ? <StatRow label="攻速" value={`${currentEquip.attackSpeed > 0 ? '+' : ''}${currentEquip.attackSpeed}%`} color={neonCyan} /> : null}
                    {currentEquip.range ? <StatRow label="射程" value={`+${currentEquip.range}`} color="#34C759" /> : null}
                    {currentEquip.critRate ? <StatRow label="暴击" value={`+${currentEquip.critRate}%`} color={neonPurple} /> : null}
                    {currentEquip.critDamage ? <StatRow label="暴伤" value={`+${currentEquip.critDamage}%`} color={neonPurple} /> : null}
                    {currentEquip.element && currentEquip.elementalDamage ? (
                      <StatRow label={`${ELEMENT_LABELS[currentEquip.element]}属性`} value={`+${currentEquip.elementalDamage}`} color={ELEMENT_COLORS[currentEquip.element]} />
                    ) : null}
                  </div>
                  {currentEquip.affixes && currentEquip.affixes.length > 0 && (
                    <div className="mt-1.5 pt-1" style={{ borderTop: '1px solid rgba(176, 38, 255, 0.15)' }}>
                      <div style={{ ...neonText, fontSize: '7px', color: neonYellow, marginBottom: '2px' }}>词条</div>
                      <div className="space-y-0.5">
                        {currentEquip.affixes.map((a, i) => {
                          let color = '#E0E0FF';
                          switch (a.type) {
                            case 'attack': color = neonPink; break;
                            case 'defense': color = '#5BA3E0'; break;
                            case 'resistance': color = '#5BA3E0'; break;
                            case 'health': color = '#34C759'; break;
                            case 'critRate': color = neonPurple; break;
                            case 'critDamage': color = neonPurple; break;
                            case 'attackSpeed': color = neonCyan; break;
                            case 'range': color = '#34C759'; break;
                            case 'pierce': color = neonYellow; break;
                            case 'elementalDamage':
                              color = a.element ? ELEMENT_COLORS[a.element] : '#E0E0FF';
                              break;
                            case 'statusFreeze': color = '#5BC0EB'; break;
                            case 'statusPoison': color = '#9B59B6'; break;
                            case 'statusBurn': color = '#FF6B35'; break;
                          }
                          return (
                            <div key={i} className="flex justify-between">
                              <span style={{ ...neonText, fontSize: '7px', color }}>
                                {affixLabel(a.type, a.value, a.element).split(' ').slice(1).join(' ')}
                              </span>
                              <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF' }}>
                                +{a.value}{(a.type === 'critRate' || a.type === 'critDamage' || a.type === 'attackSpeed' || a.type === 'statusFreeze' || a.type === 'statusPoison' || a.type === 'statusBurn') ? '%' : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <span style={{ ...neonText, fontSize: '8px', color: '#8B80A0' }}>暂无装备</span>
                </div>
              )}
            </div>

            {/* 左下：套装属性（占1/3高度） */}
            <div className="flex flex-col" style={{ ...panelStyle, height: '34%', padding: '6px 8px' }}>
              <span style={{ ...neonText, fontSize: '8px', color: neonPurple, marginBottom: '4px' }}>套装属性</span>
              <div className="flex-1 overflow-y-auto space-y-1">
                {setGroups.length === 0 ? (
                  <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>未激活任何套装</span>
                ) : (
                  setGroups.map((g, i) => (
                    <div key={i} className="flex flex-col" style={{ borderBottom: i < setGroups.length - 1 ? '1px solid rgba(176, 38, 255, 0.1)' : 'none', paddingBottom: '2px' }}>
                      <div className="flex justify-between">
                        <span style={{ ...neonText, fontSize: '7px', fontWeight: 700, color: RARITY_COLORS[g.tier as EquipRarity] || neonYellow }}>
                          {g.set.name} Lv.{g.level} ({g.count}件)
                        </span>
                        <span style={{ ...neonText, fontSize: '6px', color: neonYellow }}>
                          {g.pieces}件套
                        </span>
                      </div>
                      {g.set.effects.filter(e => g.count >= e.pieces).map((e, j) => (
                        <div key={j} style={{ ...neonText, fontSize: '6px' }}>
                          <span style={{ color: '#FFFFFF' }}>{e.pieces}件: </span>
                          {renderSetEffectDescription(e.description)}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 右侧：装备带来的属性加成 + 特殊效果 */}
          <div className="flex flex-col" style={{ ...panelStyle, width: '45%', padding: '6px 8px' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ ...neonText, fontSize: '8px', color: neonPurple }}>装备加成</span>
              {rightPages.length > 1 && (
                <div className="flex gap-1">
                  <button style={navBtnStyle} onClick={() => navRightPage(-1)}>←</button>
                  <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0', alignSelf: 'center' }}>
                    {rightPage + 1}/{rightPages.length}
                  </span>
                  <button style={navBtnStyle} onClick={() => navRightPage(1)}>→</button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-0.5">
              {currentRightPage.map((row, i) => (
                <div key={i} className="flex justify-between">
                  <span style={{ ...neonText, fontSize: '7px', color: row.color }}>{row.label}</span>
                  <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
              {currentRightPage.length === 0 && (
                <span style={{ ...neonText, fontSize: '7px', color: '#8B80A0' }}>暂无装备加成</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ ...neonText, fontSize: '7px', color }}>{label}</span>
      <span style={{ ...neonText, fontSize: '7px', color: '#FFFFFF' }}>{value}</span>
    </div>
  );
}
