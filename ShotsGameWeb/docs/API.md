# ShotsGame 游戏系统 API 文档

> 供后端 API 接口开发参考。本文档覆盖游戏全部系统和玩法的数据结构、公式与业务逻辑。

---

## 目录

1. [玩家系统](#1-玩家系统)
2. [战斗系统](#2-战斗系统)
3. [怪物系统](#3-怪物系统)
4. [技能系统](#4-技能系统)
5. [天赋系统](#5-天赋系统)
6. [装备系统](#6-装备系统)
7. [强化系统](#7-强化系统)
8. [附魔系统](#8-附魔系统)
9. [宝石系统](#9-宝石系统)
10. [仓库系统](#10-仓库系统)
11. [商店系统](#11-商店系统)
12. [装备商人系统](#12-装备商人系统)
13. [邮件系统](#13-邮件系统)
14. [签到系统](#14-签到系统)
15. [在线奖励系统](#15-在线奖励系统)
16. [成就系统](#16-成就系统)
17. [图鉴系统](#17-图鉴系统)
18. [水果机系统](#18-水果机系统)
19. [抽奖罐系统](#19-抽奖罐系统)
20. [赛马系统](#20-赛马系统)
21. [答题系统](#21-答题系统)
22. [游戏模式](#22-游戏模式)
23. [存档系统](#23-存档系统)

---

## 1. 玩家系统

### 1.1 玩家数据结构

```typescript
interface Player {
  // 位置与碰撞
  x: number; y: number; width: number; height: number;  // 14×32

  // 生命
  health: number;
  maxHealth: number;

  // 等级与经验
  level: number;        // 上限 300
  exp: number;
  expToNextLevel: number;

  // 战斗属性
  attack: number;
  attackSpeed: number;          // ms，越小越快
  manualAttackSpeed: number;    // 手动射击间隔 ms
  range: number;                 // 攻击范围 px

  // 资源
  score: number;
  skillPoints: number;
  gold: number;

  // 闪避
  dodgeCooldown: number;
  dodgeTimer: number;
  invincibleTimer: number;

  // 状态
  isManualShooting: boolean;
  isDodging: boolean;
  manualShootTimer: number;
  autoShootTimer: number;
}
```

### 1.2 动态扩展属性（通过装备/宝石/附魔/技能/天赋累加）

| 属性 | 说明 |
|---|---|
| `critRate` | 暴击率 (%) |
| `critDamage` | 暴击伤害加成 (%) |
| `defense` | 减伤 (%)，上限 70% (普通) / 75% (BOSS) |
| `regenPerSec` | 每秒回血比例 |
| `goldBonus` | 金币掉落加成 (%) |
| `expBonus` | 经验获取加成 (%) |
| `burnChance` / `burnDamage` / `burnDuration` | 灼烧概率/伤害/持续时间 |
| `poisonChance` / `poisonDamage` / `poisonDuration` | 中毒概率/伤害/持续时间 |
| `freezeChance` / `freezeSlowAmount` / `freezeDuration` | 冰冻概率/减速量/持续时间 |
| `lightningChance` / `lightningChain` / `lightningDamage` | 雷电概率/连锁数/伤害 |
| `lifestealPercent` / `lifestealFlat` | 吸血百分比/固定值 |
| `physicalPenetration` | 物理穿透 |
| `bulletPierceCount` | 子弹穿透数 |
| `resistance` | 元素抗性 |
| `elementalDamageBonus` | 元素伤害加成 `{ fire, ice, lightning, poison }` |

### 1.3 基础属性默认值

| 属性 | 默认值 |
|---|---|
| attack | 8 |
| attackSpeed | 800 ms |
| manualAttackSpeed | 1000 ms |
| maxHealth | 100 |
| range | 200 px |
| level | 1 |

### 1.4 等级系统

**升级经验公式：**

```
expToNextLevel = floor(80 + level^2.05 * 3.5 + level * 6)
```

| 等级 | 所需经验 |
|---|---|
| 1→2 | ~100 |
| 50 | ~52,000 |
| 100 | ~380,000 |
| 200 | ~3,800,000 |
| 300 | ~13,000,000 |

**升级效果：**
- `skillPoints += 1`
- `health = maxHealth`（满血）
- 重新计算属性

**等级属性加成：**

```
levelBonus = (level - 1) * 0.015
attack *= (1 + levelBonus)         // 每级 +1.5%
maxHealth *= (1 + levelBonus * 1.2) // 每级 +1.8%
```

**最高等级：** 300

### 1.5 属性计算流程

`calculatePlayerStats()` 按以下顺序累加：

1. 基础属性 (baseStats)
2. 装备主属性 (attack/health/defense/critRate/critDamage/range/pierce)
3. 强化加成 (`getEnhanceAttackBonus(enhanceLevel)`)
4. 元素伤害激活 (需装备带 `elementalAttack` 词条，对应 `elementalDamage` 才生效)
5. 宝石镶嵌加成
6. 装备词条 affixes (15 种类型)
7. 附魔百分比加成 (attack/health/defense 百分比；critRate/resistance 固定值)
8. 品质套装加成 (3/6/9 件套效果)
9. 技能加成
10. 天赋加成
11. 药水效果 (本回合持续)
12. 等级加成
13. 射程限制 (战场宽度的 25%~95%)

### 1.6 金币系统

**双货币体系：**
- `player.gold`：通用金币，用于商店/强化/装备商人/赛马等
- `lotteryCoins`：水果机专用硬币，每日发放，仅用于水果机押注

**金币获取途径：**

| 途径 | 公式 |
|---|---|
| 战斗击杀 | 普通怪 `5+Lv*2`、精英 `50+Lv*10`、BOSS `200+Lv*50` |
| 签到奖励 | 每日 200~1500 金币 |
| 水果机连续登录 | 每 7 天 +500 金币 |
| 抽奖罐 | 500~5000 金币 |
| 赛马中奖 | `floor(下注额 * 赔率)` |
| 装备分解 | `floor(rarityScrap * (1 + level*0.1))` |
| 批量出售道具 | 按 rarity 单价 × 数量 |
| 成就奖励 | `achievement.rewardValue` |
| 答题奖励 | 按正确率 100~5000 金币 |
| 在线奖励 | 每档 300~1500 金币 |

**金币消耗途径：**

| 途径 | 公式 |
|---|---|
| 商店购买 | `shopItem.price` |
| 商店刷新 | `50 + currentWave * 5` |
| 装备商人购买装备 | `floor(base * (1 + tierLevel * 0.2))` |
| 装备商人购买设计图 | `floor(base * 0.3 * (1 + tierLevel * 0.15))` |
| 蓝图制作 | `floor(base * 0.7 * (1 + tierLevel * 0.2))` |
| 装备强化(金币模式) | `floor(100 * (1+level*0.5) * rarityMult * (1+enhance*0.3))` |
| 赛马下注 | 即时扣除 `player.gold -= delta` |

---

## 2. 战斗系统

### 2.1 波次系统

- **每波怪物数：** 固定 50 只
- **波次间隔：** 5 秒
- **怪物生成间隔：** `max(800, 1200 - currentWave * 30)` ms
- **精英波：** 每 5 波
- **BOSS 波：** 每 10 波

### 2.2 战斗力 (Power) 计算公式

```
power = attack * 10
      + (1000 / attackSpeed) * 15
      + maxHealth * 0.5
      + critRate * 8
      + (critDamage - 100) * 2
      + physicalPenetration * 30
      + lifestealPercent * 20
      + range * 0.3
      + defense * 5
      + burnChance * 3
      + poisonChance * 3
      + freezeChance * 3
      + lightningChance * 4
```

### 2.3 伤害计算

```
1. 暴击判定: isCrit = random() * 100 < critRate
   finalDamage = isCrit ? floor(damage * (1 + critDamage/100)) : damage

2. Debuff 倍率: 感电等 debuff 乘以 damageMultiplier

3. 防御减伤:
   enemyDefense = max(0, enemy.defense - physicalPenetration)
   finalDamage = max(1, floor(finalDamage * (1 - enemyDefense/100)))

4. 元素效果触发: burn/poison/freeze/lightning 按概率

5. 吸血: healAmount = floor(finalDamage * lifestealPercent/100) + lifestealFlat
```

### 2.4 BOSS 阶段机制

**普通 BOSS：**
| 血量阈值 | 阶段 | 效果 |
|---|---|---|
| < 60% | 狂暴I | 添加 `enrage_1` buff |
| < 30% | 狂暴II | 速度 ×1.3，技能冷却缩短 |

**世界 BOSS：**
| 血量阈值 | 阶段 | 效果 |
|---|---|---|
| ≤ 90% | phase 1 | 狂暴I |
| ≤ 66% | phase 2 | 攻速 ×0.75，速度 ×1.2 |
| ≤ 33% | phase 3 | 攻速 ×0.6，速度 ×1.5 |

**BOSS 技能（三选一随机）：**
- 召唤：生成 5 个小怪
- 冲锋：速度 ×2.5 持续 1.5s
- 毒雾：全体中毒 debuff

---

## 3. 怪物系统

### 3.1 普通怪物（8 种）

| ID | 名称 | 血量 | 速度 | 伤害 | 经验 | 特点 |
|---|---|---|---|---|---|---|
| mutant | 变异体 | 30 | 2.8 | 4 | 8 | 基础怪 |
| raider | 掠夺者 | 42 | 4.2 | 6 | 12 | 快速突袭 |
| infected | 感染者 | 75 | 3.0 | 8 | 20 | 2%吸血，18%中毒 |
| brute | 暴徒 | 200 | 1.8 | 22 | 55 | 高血量 |
| spider | 巨型蜘蛛 | 28 | 6.5 | 5 | 10 | 最快，22%中毒 |
| zombie | 丧尸 | 140 | 0.8 | 9 | 26 | 慢速，10%中毒 |
| ranged_shooter | 远程射手 | 85 | 2.6 | 11 | 25 | 远程攻击 |
| assassin | 刺客 | 48 | 5.5 | 35 | 28 | 接触爆炸，22%暴击 |

**特殊普通怪：**

| ID | 名称 | 血量 | 速度 | 伤害 | 经验 | 出现条件 |
|---|---|---|---|---|---|---|
| gundam | 高达 | 1300 | 2.0 | 70 | 290 | wave >= 11，第 24 只 |
| alien | 异形 | 580 | 5.8 | 150 | 250 | wave >= 11，第 29 只 |

### 3.2 精英怪（3 种，每 5 波出现）

| ID | 名称 | 血量 | 元素 | 特点 |
|---|---|---|---|---|
| heavy_trooper | 重装兵 | 550 | physical | 35%减伤，1穿透 |
| mech_soldier | 机甲兵 | 850 | lightning | 25%感电，远程 190px |
| sniper_bot | 狙击机器人 | 380 | physical | 32%暴击，2穿透，远程 380px |

### 3.3 BOSS（3 种，每 10 波出现）

| ID | 名称 | 血量 | 速度 | 伤害 | 元素 | 特点 |
|---|---|---|---|---|---|---|
| war_tank | 战争坦克 | 3500 | 0.55 | 78 | fire | 28%灼烧，45%减伤 |
| alien_hive | 异星母巢 | 7200 | 0.28 | 115 | poison | 38%中毒，10%吸血 |
| cyber_dragon | 机械巨龙 | 12500 | 0.38 | 150 | ice | 32%冰冻+20%感电，55%减伤 |

### 3.4 炼狱 BOSS（4 种）

| ID | 名称 | 血量 | 伤害 | 元素 | 特殊 |
|---|---|---|---|---|---|
| purgatory_fire | 灼炎领主 | 95000 | 140 | fire | 灼烧 100% |
| purgatory_poison | 剧毒女王 | 88000 | 115 | poison | 中毒 100% |
| purgatory_ice | 极寒君王 | 105000 | 105 | ice | 冰冻 100%，60%减伤 |
| purgatory_lightning | 雷霆主宰 | 82000 | 165 | lightning | 感电 100% |

### 3.5 怪物属性缩放公式

```typescript
healthMultiplier = 1 + (wave-1)*0.12 + Math.pow(1.010, wave-1)*0.4
damageMultiplier = 1 + (wave-1)*0.05 + Math.pow(1.006, wave-1)*0.25
speedMultiplier  = 1 + Math.min(0.35, (wave-1)*0.0035)  // 上限 +35%
expMultiplier    = 1 + (wave-1)*0.07 + Math.pow(1.008, wave-1)*0.35

// BOSS 额外血量
bossHpMultiplier = Math.min(45, 1 + Math.sqrt(wave)*9 + wave*0.3)
```

### 3.6 怪物品质掉落规则

**等级门槛：**
- 1~50 级：仅普通、高级
- 51+ 级：加入精致
- 100+ 级：加入传说
- 150+ 级：加入史诗
- 200+ 级：加入神话

**掉落概率：**

| 来源 | 普通 | 高级 | 精致 | 传说 | 史诗 | 神话 |
|---|---|---|---|---|---|---|
| 小怪 | 4% | 3% | 2% | 0.35% | 0.2% | 0.1% |
| 精英 | - | - | 30% | 10% | 7.5% | 4% |
| BOSS | - | - | - | 20% | 15% | 7.5% |

---

## 4. 技能系统

### 4.1 属性技能树（右树）

| ID | 名称 | 效果 | 解锁等级 | 消耗 | 满级 |
|---|---|---|---|---|---|
| atk | 力量训练 | 攻击力 +5/级 | 1 | 1 | 20 |
| spd | 敏捷训练 | 攻速 +3%/级 | 1 | 1 | 15 |
| hp | 生命强化 | 最大生命 +40/级 | 1 | 1 | 20 |
| crit | 暴击精通 | 暴击率 +1%/级 | 2 | 1 | 15 |
| def | 防御训练 | 减伤 +1%/级 | 2 | 1 | 15 |
| cdmg | 暴击伤害 | 暴击伤害 +3%/级（前置: crit） | 20 | 3 | 15 |
| regen | 生命恢复 | 每秒回 0.2% 生命/级（前置: hp） | 20 | 3 | 10 |
| lifesteal | 吸血打击 | 攻击回 2 点生命/级（前置: hp） | 20 | 3 | 10 |
| piercing | 穿透射击 | 子弹穿透 +1 敌人/级 | 50 | 5 | 2 |

### 4.2 特效技能树（左树）

| ID | 名称 | 效果 | 冷却 |
|---|---|---|---|
| fx_bullet_1 | 增加子弹数 | 连发 +1/级，满级 3 连发 | - |
| fx_sync_1 | 同步发射 | 单次 +1 目标（前置: bullet） | - |
| fx_bomb_1 | 发射爆弹 | 爆炸半径 40+10(lvl-1)px，灼烧 3s | 8/7/6/5/4s |
| fx_freeze_1 | 冰冻弹 | 冰冻 3s，每级 +1 目标 | 5/4.5/4/3.5/3s |
| fx_poison_1 | 毒气弹 | 半径 40+10(lvl-1)px，持续 7+lvl-1s | 10/9/8/7/6s |
| fx_shock_1 | 电击弹 | 连锁 4+lvl-1 个，感电 5s | 15/14/13/12/11s |
| fx_laser_1 | 激光炮 | 持续 5s，10 次伤害 | 30s |
| fx_flash_1 | 全屏闪光 | 眩晕 5s，每秒 1% 最大生命伤害 | 50s |
| fx_nuke_1 | 终极核弹 | 半径 100+100(lvl-1)px，1000%×攻击力/级 | 50/40s |
| fx_grenade_1 | 榴弹发射 | 每级 +1 颗，每颗冷却 1s | - |

### 4.3 分身技能树

| ID | 名称 | 效果 | 解锁等级 |
|---|---|---|---|
| clone_1 | 召唤分身 | 每级 +1 个分身 | 160 |
| clone_bullet_1 | 分身增弹 | 分身连发 +1/级 | 180 |
| clone_sync_1 | 分身同步 | 分身 +1 目标 | 220 |
| clone_sweep | 战术横扫 | 10s 连发翻倍 | 300 |

### 4.4 主动技能

| 快捷键 | ID | 名称 | 冷却 | 效果 |
|---|---|---|---|---|
| Q | dodge | 翻滚闪避 | 5s | 翻滚 400ms，无敌 500ms |
| E | grenade | 手雷投掷 | 8s | 半径 80px，伤害 100+50%攻击力 |
| R | drone | 攻击无人机 | 20s | 召唤无人机 10s |

### 4.5 技能伤害公式

```
激光炮:    每帧 = laserLvl * attack * 0.1 (分身 0.05)
全屏闪光:  每秒 = enemy.maxHealth * 0.01 * dt
终极核弹:  damage = floor(attack * (10 + 10*(lvl-1)))  // 1000%/级
           radius = 100 + 100*(lvl-1)
爆弹灼烧:  10 + attack * 0.1 每秒
毒气弹:    20 + attack * 0.5 每秒
手雷:      100 + attack * 0.5 (距离衰减)
```

### 4.6 技能升级规则

- 升级条件：`level < maxLevel` → `skillPoints >= cost` → `player.level >= requiredLevel` → `前置技能 level > 0`
- 可降级，返还全部消耗
- 不能降级被其他技能依赖的技能

---

## 5. 天赋系统

### 5.1 天赋列表

升级时从未拥有的天赋中三选一，选完不可重复。

| ID | 名称 | 稀有度 | 效果 |
|---|---|---|---|
| atk_up | 攻击强化 | common | 攻击力 +25 |
| atk_speed_up | 攻速提升 | common | 攻速 +15% |
| hp_up | 生命强化 | common | 最大生命 +50 |
| def_up | 护甲提升 | common | 减伤 +10% |
| range_up | 射程扩展 | common | 射程 +100 |
| crit_up | 暴击率提升 | rare | 暴击率 +8% |
| cdmg_up | 暴击伤害 | rare | 暴击伤害 +30% |
| gold_magnet | 财富磁铁 | rare | 金币掉落 +50% |
| exp_boost | 快速学习 | rare | 经验获取 +30% |
| regen_aura | 再生光环 | legendary | 每秒回 1% 生命 |
| bullet_bounce | 子弹反弹 | rare | 20% 几率反弹 |
| kill_heal | 击杀回血 | common | 击杀回 2% 生命 |
| multishot_talent | 多重射击 | legendary | 额外发射 1 发子弹 |
| piercing | 穿透射击 | legendary | 子弹穿透 1 个敌人 |

### 5.2 天赋数据结构

```typescript
interface Talent {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary';
  stat: string;      // 属性类型标识
  value: number;
  description: string;
}
```

---

## 6. 装备系统

### 6.1 装备品质

| 品质 | 中文名 | 稀有度倍率 | 边框色 |
|---|---|---|---|
| common | 普通 | 1.0 | #9A9A9A |
| advanced | 高级 | 1.4 | #5BA3E0 |
| fine | 精致 | 1.9 | #B060E0 |
| legendary | 传说 | 2.8 | #E08030 |
| epic | 史诗 | 4.0 | #E0C040 |
| mythic | 神话 | 5.5 | #E03030 |

### 6.2 装备部位（9 种）

`weapon`(武器) / `armor`(上衣) / `pants`(下装) / `shoulder`(护肩) / `belt`(腰带) / `shoes`(鞋子) / `earring`(耳环) / `ring`(戒指) / `necklace`(项链)

### 6.3 装备数据结构

```typescript
interface Equipment {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: EquipRarity;
  level: number;

  // 基础属性（可选）
  attack?: number;
  attackSpeed?: number;
  range?: number;
  health?: number;
  defense?: number;
  critRate?: number;
  critDamage?: number;
  pierce?: number;

  icon: string;
  iconVariant: number;
  description: string;
  setBonus?: SetBonusId;

  // 耐久度
  durability?: number;
  maxDurability?: number;

  // 词条
  affixes?: EquipmentAffix[];

  // 元素
  element?: ElementType;         // 'fire' | 'ice' | 'lightning' | 'poison' | 'physical'
  elementalDamage?: number;

  // 宝石镶嵌
  socketedGems?: SocketedGem[];   // 最多 15 颗

  // 强化
  enhanceLevel?: number;

  // 附魔
  enchantment?: Enchantment;
}

interface EquipmentAffix {
  id: string;
  name: string;
  value: number;
  type: string;       // 15 种类型
  element?: ElementType;
}

interface SocketedGem {
  gemId: string;
  type: GemType;      // 'attack' | 'health' | 'defense' | 'critRate' | 'resistance'
  rarity: GemRarity;  // 'common' | 'advanced'
  value: number;
}

interface Enchantment {
  stat: EnchantStat;   // 'attack' | 'health' | 'defense' | 'critRate' | 'resistance'
  rarity: ItemRarity;
  percent: number;
}
```

### 6.4 词条类型（17 种）

| 类型 | 说明 |
|---|---|
| attack | 攻击力 |
| attackSpeed | 攻击速度 (百分比减算) |
| critRate | 暴击率 |
| critDamage | 暴击伤害 |
| pierce | 物理穿透 |
| range | 射程 |
| defense | 防御 |
| lifesteal | 吸血 |
| statusBurn | 灼烧附魔 |
| statusPoison | 中毒附魔 |
| statusFreeze | 冰冻附魔 |
| statusLightning | 雷电附魔 |
| elementalDamage | 元素伤害增加 (火/冰/雷/毒) |
| elementalAttack | 属性攻击 (火/冰/雷/毒) |

### 6.5 品质配置

| 品质 | 基础属性数 | 词条范围 | 属性攻击概率 |
|---|---|---|---|
| 普通 | 1 | 0 | 0% |
| 高级 | 2 | 0 | 0% |
| 精致 | 3 | 0 | 30% |
| 传说 | 4 | 0~1 | 100% |
| 史诗 | 4 | 1~2 | 100% |
| 神话 | 5 | 2 | 100% |

### 6.6 属性伤害规则

- 装备必须带 `elementalAttack` 词条（火/冰/雷/毒属性攻击），对应的 `elementalDamage` 词条才能生效
- 传说、史诗、神话级武器必须带一个属性攻击词条
- 精致品质武器有 30% 概率拥有属性攻击词条
- 高级及以下品质武器无属性攻击词条

### 6.7 品质套装系统

同品质 + 同等级装备 3/6/9 件激活：

**传说套装：**
| 件数 | 效果 |
|---|---|
| 3 件 | 攻击 +15% |
| 6 件 | 生命 +25%，防御 +15% |
| 9 件 | 暴伤 +50%，攻速 +15% |

**史诗套装：**
| 件数 | 效果 |
|---|---|
| 3 件 | 攻击 +25% |
| 6 件 | 生命 +40%，防御 +25% |
| 9 件 | 暴击 +15%，暴伤 +80% |

**神话套装：**
| 件数 | 效果 |
|---|---|
| 3 件 | 攻击 +8%，攻速 +4% |
| 6 件 | 生命 +12%，防御 +8% |
| 9 件 | 全属性 +10%，每秒回 0.4% 生命 |

---

## 7. 强化系统

### 7.1 强化道具（4 种）

| ID | 名称 | 模式 | 效果 |
|---|---|---|---|
| enhance_scroll_plus1 | 强化等级+1卷 | scroll | +1，限强化 13 以下使用 |
| enhance_scroll_plus2 | 强化等级+2卷 | scroll | +2，限强化 9 以下使用 |
| enhance_normal_booster | 普通强化器 | booster | 免费强化一次 |
| enhance_ancient_booster | 远古强化器 | booster | 免费强化一次，成功率 +10% |

### 7.2 强化规则

- **最大强化等级：** 15
- **攻击加成公式：** `n*(n+1)/2 * 0.35`（如 +3 = 6 攻击力）

| 强化等级 | 成功率 | 失败结果 |
|---|---|---|
| 1-3 | 100% | 无 |
| 4-6 | 75% | 保留等级 |
| 7-9 | 50% | 等级 -2 |
| 10-12 | 30% | 等级 -2 |
| 13-15 | 10% | 等级 -1 |

**金币消耗：**

```
goldCost = floor(100 * (1 + equipLevel * 0.5) * rarityMult * (1 + enhanceLevel * 0.3))
```

品质倍率：common=1, advanced=1.4, fine=1.9, legendary=2.8, epic=4.0, mythic=5.5

---

## 8. 附魔系统

### 8.1 附魔书（5 种属性 × 6 种品质 = 30 种）

- ID 格式：`enchant_<stat>_<rarity>`
- 属性类型：attack / health / defense / critRate / resistance
- 品质百分比：普通 1% / 高级 2% / 精致 3% / 传说 4% / 史诗 5% / 神话 6%

### 8.2 合成规则

每 2 本相同品质合成 1 本高一级品质（神话为最高）

### 8.3 附魔效果

- attack / health / defense：**百分比加成**（在装备主属性累加后应用）
- critRate / resistance：**数值加成**

```
attack = floor(attack * (1 + enchantPercent / 100))
```

---

## 9. 宝石系统

### 9.1 宝石定义（5 种类型 × 2 种品质 = 10 种）

| 类型 | 说明 |
|---|---|
| attack | 攻击力 |
| health | 生命 |
| defense | 防御 |
| critRate | 暴击率 |
| resistance | 抗性 |

- 普通：1 点属性（掉落概率 70%）
- 高级：1 点属性（掉落概率 30%）

### 9.2 镶嵌规则

- **最大孔数：** 15
- **成功率：** 第 1 颗 100%，第 2-15 颗 50%
- **失败惩罚：**
  - 当前 0-6 颗（镶第 1-7 颗）：仅损失本次宝石
  - 当前 7-14 颗（镶第 8-15 颗）：**全部归零**

---

## 10. 仓库系统

### 10.1 容量上限

```typescript
const STORAGE_CAPACITY = {
  equipment: 100,    // 装备仓库
  inventory: 100,    // 道具背包
  gem: 50,           // 宝石背包
  enhance: 30,        // 强化道具背包
  enchant: 30,        // 附魔书背包
};
```

### 10.2 容量校验

所有写入仓库的入口都必须做容量校验：
- 超限装备溢入 `pendingMailDrops` 转 battleMail
- 超限物品同理
- UI 层在仓库满时拦截并 toast 提示

### 10.3 物品堆叠

```typescript
interface ItemStack {
  itemId: string;
  count: number;
}
```

同类物品可堆叠存储，宝石 ID 格式 `gem_<type>_<rarity>`，附魔书 ID 格式 `enchant_<stat>_<rarity>`。

---

## 11. 商店系统

### 11.1 商品结构

```typescript
interface ShopItem {
  id: string;
  type: 'refill' | 'item' | 'equipment';
  price: number;
  sold: boolean;
  itemId?: string;
  equipment?: Equipment;
}
```

### 11.2 商品列表（6 件，每次刷新重新生成）

| 商品 | 价格公式 |
|---|---|
| 完全恢复 (refill) | `50 + wave * 5` |
| 普通血瓶 (item) | `30 + wave * 3` |
| 手榴弹 (item) | `80 + wave * 8` |
| 随机装备 ×3 | `floor(equipPrice * (1 + level * 0.2))` |

### 11.3 刷新费用

```
refreshCost = 50 + currentWave * 5
```

---

## 12. 装备商人系统

### 12.1 等级档位

- 起始档 = `(floor(玩家等级/10) + 1) * 10`（最低 10）
- 上限 = 玩家等级 + 50
- 共 5 档，每 10 级一档

### 12.2 双页签结构

**第一页：装备（普通~精致）**
- 9 部位 × 3 品质 = 27 件
- 不限次购买

| 品质 | 基础价格 |
|---|---|
| common | 100 |
| advanced | 300 |
| fine | 800 |

价格公式：`floor(base * (1 + tierLevel * 0.2))`

**第二页：设计图（传说~史诗）**
- 9 部位 × 2 品质 = 18 件

| 品质 | 基础价格 |
|---|---|
| legendary | 2000 |
| epic | 5000 |

- 设计图购买价：`floor(base * 0.3 * (1 + tierLevel * 0.15))`
- 制作金币消耗：`floor(base * 0.7 * (1 + tierLevel * 0.2))`

### 12.3 蓝图制作

```typescript
interface Blueprint {
  id: string;              // bp_<slot>_<rarity>_<level>
  slot: EquipSlot;
  rarity: 'legendary' | 'epic';
  level: number;
  name: string;
  icon: string;
  materials: { itemId: string; name: string; icon: string; count: number; have: number }[];
  goldCost: number;
  price: number;
  sold: boolean;
  crafted: boolean;
}
```

制作材料数量：`1 + floor(level / 50)`

---

## 13. 邮件系统

### 13.1 邮件数据结构

```typescript
interface Mail {
  id: string;
  type: 'system' | 'battle';
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  claimed: boolean;
  attachments?: MailAttachments;
}

interface MailAttachments {
  equipment?: Equipment[];
  items?: ItemStack[];
  gold?: number;
}
```

### 13.2 邮件标题规则

- 关卡模式：`第{n}波 战利品奖励`
- 其他模式：`{模式名} 战利品奖励`（如 `炼狱 战利品奖励`、`世界BOSS 战利品奖励`）

### 13.3 邮件规则

- 最多保留 50 封
- 战斗邮件触发：仓库已满时掉落物自动发送
- 系统邮件：新手大礼包（金币 2000 + 生命药水 ×10 + 攻击药剂 ×5 + 炸弹 ×3）
- 附件领取：仓库已满的物品保留在邮件中
- 一键领取：先校验仓库总容量，不足则全部不领取

---

## 14. 签到系统

### 14.1 数据结构

```typescript
checkInDays: number[];      // 本周已签到的天数（0=周一，6=周日）
checkInWeekKey: string;     // 周标识（年-周数），跨周自动重置
```

### 14.2 签到奖励

| 日 | 物品 | 数量 | 金币 |
|---|---|---|---|
| 周一 | health_potion（生命药水） | 5 | 200 |
| 周二 | attack_boost（攻击药剂） | 3 | 300 |
| 周三 | speed_boost（速度药剂） | 3 | 300 |
| 周四 | bomb（炸弹） | 3 | 500 |
| 周五 | health_potion_advanced（高级生命药水） | 5 | 500 |
| 周六 | freeze_bomb（冰冻弹） | 2 | 800 |
| 周日 | health_potion_legendary（传说生命药水） | 3 | 1500 |

---

## 15. 在线奖励系统

### 15.1 奖励档位（共 4 档，每 30 分钟一档）

| 档 | 所需在线分钟 | 物品 | 数量 | 金币 |
|---|---|---|---|---|
| 1 | 30 | health_potion | 5 | 300 |
| 2 | 60 | attack_boost | 3 | 500 |
| 3 | 90 | bomb | 3 | 800 |
| 4 | 120 | health_potion_fine | 5 | 1500 |

### 15.2 数据结构

```typescript
onlineMinutes: number;          // 累计在线分钟数
onlineRewardClaimed: number;    // 已领取次数（0-4）
```

---

## 16. 成就系统

### 16.1 数据结构

```typescript
interface Achievement {
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
```

### 16.2 成就列表（31 个）

**系统成就（11 个）：**

| ID | 名称 | 目标 | 奖励 |
|---|---|---|---|
| first_blood | 初次击杀 | 击杀 1 | 金币 +100 |
| kill_10 | 小试牛刀 | 击杀 10 | 金币 +300 |
| kill_100 | 百人斩 | 击杀 100 | 金币 +1000 |
| kill_500 | 杀戮机器 | 击杀 500 | 金币 +3000 |
| wave_5 | 幸存者 | 存活到第 5 波 | 金币 +500 |
| wave_10 | 坚韧不拔 | 存活到第 10 波 | 金币 +2000 |
| wave_20 | 废土传说 | 存活到第 20 波 | 金币 +5000 |
| boss_slayer | Boss杀手 | 击败 1 Boss | 金币 +1500 |
| elite_hunter | 精英猎手 | 击杀 10 精英 | 金币 +800 |
| single_wave_50 | 清场专家 | 单波 50 杀 | 金币 +600 |
| equip_legendary_get | 传说降临 | 获得 1 传说装 | 金币 +500 |

**等级成就（20 个，10~200 级每 10 级一档）：**

| 等级 | 奖励 |
|---|---|
| 10 | 技能点 +3 |
| 20 | 技能点 +5 |
| 30 | 技能点 +8 |
| 40 | 技能点 +10 |
| 50 | 技能点 +12 |
| 60 | 技能点 +15 |
| 70 | 技能点 +18 |
| 80 | 技能点 +20 |
| 90 | 技能点 +25 |
| 100 | 技能点 +30 |
| 110 | 技能点 +35 |
| 120 | 技能点 +40 |
| 130 | 技能点 +45 |
| 140 | 技能点 +50 |
| 150 | 技能点 +60 |
| 160 | 技能点 +70 |
| 170 | 技能点 +80 |
| 180 | 技能点 +90 |
| 190 | 技能点 +100 |
| 200 | 技能点 +150 |

### 16.3 奖励领取

- 系统成就 → `player.gold += rewardValue`
- 等级成就 → `player.skillPoints += rewardValue`

---

## 17. 图鉴系统

### 17.1 数据结构

```typescript
interface CodexEntry {
  id: string;
  type: 'enemy' | 'equipment' | 'item';
  name: string;
  discovered: boolean;
  kills?: number;    // 敌人击杀数
  obtained?: number; // 装备/物品获得数
  description: string;
}
```

### 17.2 条目分类

- **敌人**：8 种（mutant/raider/infected/brute/heavy_trooper/mech_soldier/war_tank/alien_hive）
- **装备**：6 种按品质（common/advanced/fine/legendary/epic/mythic）
- **物品**：7 种（health_potion/attack_boost/speed_boost/bomb/stun_bomb/lightning_bolt/curse_scroll）

---

## 18. 水果机系统

### 18.1 跑马灯配置

- **格子总数：** 24 格（7×7 方框跑马灯）
- **押注种类：** 8 种（苹果/橘子/芒果/铃铛/西瓜/双星/77/BAR）
- **单种类押注上限：** 999
- **历史记录长度：** 3

### 18.2 硬币系统（独立于金币）

- 每日发放：10 硬币 + 连续登录加成（每连续 3 天 +1，上限 +5）
- 连续登录 7 天：额外 500 金币
- 押注扣除硬币，减注退还，清空全额退还

### 18.3 中奖结算

```
win = sum(bet[category] * odds)  // 累加所有中奖格
```

### 18.4 Lucky 保底机制

- 每未命中一次 `luckyMissCounter +1`（上限 9）
- 第 10 次必中 Lucky
- 累积保底概率 = `(missCount + 1) * 3%`

### 18.5 Lucky 子玩法

| 概率 | 子玩法 | 说明 |
|---|---|---|
| 45% | random_big_fruit | 随机打中某个大水果 |
| 15% | all_big_apple | 打中所有大苹果 |
| 12% | three_fruits_a | 打中橘子/芒果/铃铛大水果 |
| 12% | three_fruits_b | 打中西瓜/双星/77 大水果 |
| 12% | train | 开火车（3-7 格连续全中） |
| 4% | jackpot | 大满贯（全 24 格全中 + 5000 奖金） |

### 18.6 BAR 送灯

停在 BAR 格额外赠送 1 次免费旋转

---

## 19. 抽奖罐系统

### 19.1 奖励池（12 种，按 weight 随机）

| 类型 | weight | 内容 |
|---|---|---|
| gold | 28 | 500~2000 金币 |
| gold | 12 | 2000~5000 金币 |
| exp | 15 | 小型经验书 +200 |
| exp | 8 | 中型经验书 +1000 |
| exp | 3 | 大型经验书 +5000 |
| item | 12 | 生命药水 ×3 |
| item | 8 | 攻击药剂 ×2 |
| item | 6 | 速度药剂 ×2 |
| item | 4 | 炸弹 ×2 |
| item | 2 | 强化卷轴+1 ×3 |
| item | 1 | 攻击宝石(进阶) ×2 |
| item | 1 | 生命宝石(进阶) ×2 |

### 19.2 使用流程

1. 消耗 1 个 `lottery_pot` 道具
2. 按 weight 随机选择奖励
3. gold → 加金币，exp → 加经验，item → 入背包

---

## 20. 赛马系统

### 20.1 数据结构

```typescript
interface Horse {
  id: number;
  name: string;
  emoji: string;      // 已弃用，改用 SVG
  color: string;
  odds: number;        // 赔率 1.5~15
}

interface BetRecord {
  horseId: number;
  amount: number;
}

interface RaceRound {
  round: number;       // 1=8进4, 2=4进2, 3=2进1
  horses: Horse[];
  winners: Horse[];
  status: 'idle' | 'countdown' | 'racing' | 'highlight' | 'done';
  countdown: number;   // 默认 5
}

interface RaceSession {
  id: string;
  horses: Horse[];     // 8 匹
  rounds: RaceRound[]; // 3 轮
  bets: BetRecord[];
  totalBet: number;
  status: 'betting' | 'running' | 'finished';
  champion: Horse | null;
  goldWon: number;
}
```

### 20.2 赛马预设（8 匹）

| 名称 | 颜色 | 基础赔率 |
|---|---|---|
| 雷霆闪电 | #FF4757 | 2.0 |
| 疾风之影 | #FF8C42 | 3.0 |
| 赤焰流星 | #FF00FF | 4.5 |
| 幽冥暗影 | #9B59B6 | 6.5 |
| 冰霜骏马 | #00F5D4 | 8.5 |
| 黄金征途 | #FFD700 | 10.5 |
| 狂野风暴 | #2ECC71 | 12.5 |
| 深渊幻影 | #1E90FF | 14.5 |

### 20.3 赔率浮动

在基础值 ±25% 范围内随机，clamp 到 1.5~15

### 20.4 下注规则

- 预设金额：100 / 1000 / 10000
- 自定义上限：1000000
- 使用 `player.gold` 即时扣除
- 减注/清空退还

### 20.5 晋级算法

```
概率 ∝ 1/odds（归一化）
probA = (1/oddsA) / (1/oddsA + 1/oddsB)  // 二选一
```

### 20.6 中奖结算

- **只有押冠军才结算**
- 单注奖金 = `floor(amount * horse.odds)`

### 20.7 流程时序

```
betting → countdown(5s) → racing(1.5s) → highlight(3s/2.5s) → 下一轮 → ... → finished
```

---

## 21. 答题系统

### 21.1 题目数据结构

```typescript
interface Question {
  id: number;
  type: 'single' | 'multiple';
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
}
```

### 21.2 奖励规则

| 正确率 | 金币奖励 | 提示语 |
|---|---|---|
| ≥ 90% | 5000 | 完美！ |
| ≥ 70% | 3000 | 优秀！ |
| ≥ 50% | 1500 | 不错！ |
| ≥ 30% | 500 | 继续努力！ |
| < 30% | 100 | 再接再厉！ |

---

## 22. 游戏模式

### 22.1 模式列表（8 种）

| 模式 ID | 名称 | 解锁等级 | 限制 | 特点 |
|---|---|---|---|---|
| stage | 关卡挑战 | 1 | 无 | 经典闯关，每 5 波精英，每 10 波 BOSS |
| worldboss | 世界BOSS | 10 | 每日 3 次 | 限时 5 分钟，多阶段 |
| purgatory | 炼狱 | 15 | 无 | 只有 1 条命，伤害翻倍 |
| daily | 日常挑战 | 5 | 无 | 单波无限刷，速度 5x |
| material | 材料副本 | 8 | 每日 5 次 | 49 普通 + 1 BOSS |
| mirror | 镜像挑战 | 20 | 每日 5 次 | 1v1 镜像 AI，限时 3 分钟 |
| guard | 守卫战 | 12 | 无 | 保护基地（500+level*20 血） |
| homedefense | 家园守卫 | 25 | 无 | 多方向进攻，可放防御塔 |

### 22.2 难度系统

| 难度 | 敌人倍率 | 奖励倍率 |
|---|---|---|
| easy | 0.6 | 0.7 |
| normal | 1.0 | 1.0 |
| hard | 1.8 | 1.8 |
| nightmare | 3.0 | 3.0 |

### 22.3 材料副本类型（5 种）

| 类型 | 说明 |
|---|---|
| enhance | 强化石 |
| gem | 宝石矿洞 |
| enchant | 附魔秘境 |
| exp | 经验秘境 |
| gold | 金币矿洞 |

---

## 23. 存档系统

### 23.1 存储方式

- 使用浏览器 `localStorage`
- 存储 key：`shotsGameSave`
- 序列化为 JSON

### 23.2 存档数据结构

```typescript
interface SaveData {
  player: {
    level: number;
    exp: number;
    expToNextLevel: number;
    gold: number;
    score: number;
    skillPoints: number;
    health: number;
    maxHealth: number;
    attack: number;
    attackSpeed: number;
    range: number;
  };
  gameState: { currentWave: number };
  equipment: Equipment[];            // 已装备
  equipmentStorage: Equipment[];     // 装备仓库
  inventory: ItemStack[];            // 道具背包
  gemInventory: ItemStack[];         // 宝石背包
  skills: { id: string; level: number }[];
  talents: Talent[];
  highestWave: number;
  codexEntries: CodexEntry[];
  achievements: Achievement[];
  mails: Mail[];
  savedAt: number;

  // 签到
  checkInDays: number[];
  checkInWeekKey: string;

  // 在线奖励
  onlineMinutes: number;
  onlineRewardClaimed: number;

  // 水果机
  lotteryCoins: number;
  lotteryCoinsDate: string;
  lotteryBets: Record<string, number>;
  lotteryConsecutiveLogin: number;
  lotteryLastLoginDate: string;
  lotteryTournamentBest: number;
  lotteryLastWin: number;
  lotteryHistory: number[];
  lotteryFreeSpins: number;
  lotteryLuckyMissCounter: number;
}
```

### 23.3 状态管理 (Zustand Store)

`gameStore.ts` 作为 React 侧镜像层，通过回调从 `GameEngine` 同步状态：

**State 字段：** `gameState` / `player` / `inventory` / `skills` / `equipment` / `equipmentStorage` / `gemInventory` / `enhanceItemInventory` / `enchantItemInventory` / `buffs` / `activeSkills` / `talentChoices` / `showTalentSelection` / `weather` / `codexEntries` / `achievements` / `unlockedAchievement` / `potionHotbar` / `rareDropNotifications` / `gameToasts` / `mails`

**Action 列表：** `setGameState` / `setPlayer` / `setInventory` / `setSkills` / `setEquipment` / `setEquipmentStorage` / `setGemInventory` / `setEnhanceItemInventory` / `setEnchantItemInventory` / `setBuffs` / `setActiveSkills` / `setTalentChoices` / `setShowTalentSelection` / `setWeather` / `setCodexEntries` / `setAchievements` / `setUnlockedAchievement` / `setPotionHotbar` / `setMails` / `addGold` / `addRareDropNotification` / `removeRareDropNotification` / `addGameToast` / `removeGameToast`

---

## 附录：关键文件路径

| 文件 | 说明 |
|---|---|
| `src/game/GameEngine.ts` | 游戏核心引擎 |
| `src/game/types/game.ts` | TypeScript 类型定义 |
| `src/game/data/skills.ts` | 技能定义 |
| `src/game/data/enemies.ts` | 怪物配置 |
| `src/game/data/equipment.ts` | 装备数据与生成 |
| `src/game/data/gameModes.ts` | 游戏模式配置 |
| `src/game/data/storageCapacity.ts` | 仓库容量常量 |
| `src/game/data/enhanceItems.ts` | 强化道具 |
| `src/game/data/enchantItems.ts` | 附魔道具 |
| `src/game/data/gems.ts` | 宝石系统 |
| `src/game/data/horseRacing.ts` | 赛马数据层 |
| `src/store/gameStore.ts` | Zustand 状态管理 |
| `src/components/LotteryPanel.tsx` | 水果机面板 |
| `src/components/HorseRacingPanel.tsx` | 赛马面板 |
| `src/components/EquipmentMerchantPanel.tsx` | 装备商人面板 |
| `src/components/ShopPanel.tsx` | 商店面板 |
| `src/components/MailPanel.tsx` | 邮件面板 |
| `src/components/CheckInPanel.tsx` | 签到面板 |
| `src/components/OnlineRewardPanel.tsx` | 在线奖励面板 |
| `src/components/QuizModal.tsx` | 答题弹窗 |
| `src/components/CodexPanel.tsx` | 图鉴/成就面板 |
