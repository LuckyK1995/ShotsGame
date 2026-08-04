# ShotsGame 项目重制文档

> 本文档基于现有代码逆向梳理，覆盖项目所有核心系统与机制，供后续重制参考。

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈与构建配置](#2-技术栈与构建配置)
3. [目录结构](#3-目录结构)
4. [核心架构](#4-核心架构)
5. [状态管理（Zustand Store）](#5-状态管理zustand-store)
6. [游戏模式系统](#6-游戏模式系统)
7. [战斗系统](#7-战斗系统)
8. [装备系统](#8-装备系统)
9. [宝石镶嵌系统](#9-宝石镶嵌系统)
10. [强化系统](#10-强化系统)
11. [附魔系统](#11-附魔系统)
12. [物品系统](#12-物品系统)
13. [技能系统](#13-技能系统)
14. [敌人系统](#14-敌人系统)
15. [波次与刷新机制](#15-波次与刷新机制)
16. [BOSS 机制](#16-boss-机制)
17. [炼狱模式](#17-炼狱模式)
18. [邮件系统](#18-邮件系统)
19. [商店系统](#19-商店系统)
20. [成就系统](#20-成就系统)
21. [图鉴系统](#21-图鉴系统)
22. [签到与在线奖励](#22-签到与在线奖励)
23. [掉落系统](#23-掉落系统)
24. [仓库系统](#24-仓库系统)
25. [UI 系统](#25-ui-系统)
26. [存档系统](#26-存档系统)
27. [硬性约束与规范](#27-硬性约束与规范)

---

## 1. 项目概览

- **项目名称**：ShotsGame（末日突围）
- **类型**：末世科技风 2D 射击闯关游戏
- **视觉风格**：深紫黑底 + 霓虹发光 + 圆角卡片 + 像素 RPG 图标
- **平台**：移动端竖屏优先（设计基准宽度 430px），同时适配桌面浏览器
- **核心玩法**：8 种游戏模式、装备养成（强化/镶嵌/附魔）、波次闯关、BOSS 战、技能树

---

## 2. 技术栈与构建配置

### 2.1 依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| react | ^18.3.1 | UI 框架 |
| react-dom | ^18.3.1 | React DOM |
| react-router-dom | ^7.3.0 | 路由 |
| zustand | ^5.0.3 | 状态管理 |
| clsx | ^2.1.1 | className 拼接 |
| tailwind-merge | ^3.0.2 | Tailwind 合并 |
| lucide-react | ^0.511.0 | 图标库 |
| vite | ^6.3.5 | 构建工具 |
| typescript | ~5.8.3 | TS |
| tailwindcss | ^3.4.17 | 原子化 CSS |

### 2.2 Vite 配置要点

- `strictPort: true` 锁定 5173 端口
- `open: true` 启动自动打开浏览器
- `base` 开发环境 `/`，生产构建 `/ShotsGame/`（GitHub Pages）
- `allowedHosts: true` 允许局域网访问
- 已关闭隧道访问（仅本地 + 局域网）

### 2.3 TS 配置

- `strict: false`（未开启严格模式）
- 路径别名 `@/*` → `./src/*`
- `target: ES2020`, `jsx: react-jsx`

### 2.4 NPM 脚本

- `dev`: `vite`
- `build`: `tsc -b && vite build`
- `check`: `tsc -b --noEmit`

---

## 3. 目录结构

```
src/
├── components/          # 36 个 React 组件
│   ├── AchievementNotification.tsx   # 成就解锁横幅
│   ├── ActiveSkillBar.tsx
│   ├── BossHealthBar.tsx             # BOSS 血条
│   ├── ButtonIcons.tsx               # 主界面模式图标
│   ├── CharacterPanel.tsx            # 人物面板
│   ├── CheckInPanel.tsx              # 签到面板
│   ├── CodexPanel.tsx                # 图鉴/成就面板
│   ├── DebugPanel.tsx                # 调试面板
│   ├── EnchantItemIcon.tsx
│   ├── EnchantModal.tsx              # 附魔弹窗
│   ├── EnhanceItemIcon.tsx
│   ├── EnhanceModal.tsx              # 强化弹窗
│   ├── EquipmentDetailModal.tsx      # 共享装备详情弹窗
│   ├── EquipmentIcon.tsx             # 装备像素图标
│   ├── EquipmentPanel.tsx            # 装备栏主面板
│   ├── EquipmentStatsModal.tsx       # 战力属性总览
│   ├── GameCanvas.tsx                # Canvas + 引擎桥接
│   ├── GameOverModal.tsx             # 游戏结束弹窗
│   ├── GemEmbedModal.tsx             # 宝石镶嵌弹窗
│   ├── InventoryPanel.tsx            # 物品栏
│   ├── MailPanel.tsx                 # 邮件面板
│   ├── MainMenu.tsx                  # 主界面
│   ├── OfflineRewardModal.tsx
│   ├── OnlineRewardPanel.tsx         # 在线奖励
│   ├── PixelButton.tsx               # 像素风按钮 + 10 个内置图标
│   ├── PurgatorySettlement.tsx       # 炼狱结算
│   ├── QuickBars.tsx                 # 底部快捷栏
│   ├── QuizModal.tsx                 # 答题弹窗
│   ├── RareDropToast.tsx             # 稀有掉落气泡
│   ├── RestartConfirmModal.tsx       # 弹窗基准模板
│   ├── ShopPanel.tsx                 # 商店
│   ├── SkillTree.tsx                 # 技能树
│   ├── StatusBar.tsx                 # 顶部状态栏
│   ├── TabPanel.tsx                  # 页签容器
│   └── WaveNotice.tsx                # 波次提示
├── game/
│   ├── data/           # 静态配置数据
│   │   ├── enchantItems.ts           # 附魔书（5属性×6品质=30种）
│   │   ├── enemies.ts                # 敌人配置（8普通+3精英+3BOSS+4炼狱）
│   │   ├── enhanceItems.ts           # 强化道具（4种）
│   │   ├── equipment.ts              # 装备、词条、套装、掉率
│   │   ├── gameModes.ts              # 8种游戏模式配置
│   │   ├── gems.ts                   # 宝石（5类型×2品质=10种）
│   │   ├── skills.ts                 # 技能树（50+技能）
│   │   └── storageCapacity.ts        # 仓库容量共享常量
│   ├── types/
│   │   └── game.ts                   # 全局类型定义
│   ├── GameEngine.ts                 # 核心引擎（~13000行）
│   └── utils.ts
├── store/
│   └── gameStore.ts                  # Zustand 全局状态
├── theme/
│   └── colors.ts                     # 霓虹色 + 字体常量
├── utils/
│   └── styles.ts                     # hexToRgba、itemSlotStyle 等工具
├── App.tsx                           # 根组件
├── index.css
└── main.tsx
```

---

## 4. 核心架构

### 4.1 分层架构

| 层 | 职责 | 技术 |
|----|------|------|
| 引擎层 | 游戏循环、物理、AI、战斗、掉落、技能、装备、邮件、商店 | 单类 `GameEngine.ts`，Canvas 2D，对象池优化 |
| 桥接层 | 引擎 ↔ React 状态同步 | `GameCanvas.tsx`（forwardRef）+ 21 个 onXxx 回调 |
| 状态层 | UI 共享状态 | Zustand store（纯同步 set） |
| 视图层 | UI 渲染、面板/浮层管理 | React 18 + 36 个组件 |
| 样式层 | 视觉 | Tailwind CSS 3 + 内联样式 |

### 4.2 数据流

```
用户操作 → React 组件 → engineRef.current.xxx() → GameEngine 修改内部状态
→ 触发 onXxxChange 回调 → useGameStore.set* → React 重渲染
```

### 4.3 GameEngine 关键属性

| 属性 | 类型 | 说明 |
|------|------|------|
| canvas / ctx | HTMLCanvasElement / Context | 画布与 2D 上下文 |
| player | Player | 玩家对象 |
| gameState | GameState | 游戏状态 |
| gameMode | GameMode | 当前模式（8种之一） |
| equipment / equipmentStorage | Equipment[] / Equipment[] | 已装备 / 仓库 |
| inventory | ItemStack[] | 物品栏 |
| gemInventory / enhanceItemInventory / enchantItemInventory | ItemStack[] | 三类材料背包 |
| skills | Skill[] | 技能列表 |
| activeSkills | ActiveSkill[] | 主动技能（dodge/grenade/drone） |
| buffs / playerDebuffs | Buff[] / Debuff[] | 增益/减益 |
| mails | Mail[] | 邮件列表 |
| pendingMailDrops | MailAttachments | 仓库满时的待发邮件缓存 |
| codexEntries | CodexEntry[] | 图鉴 |
| achievements | Achievement[] | 成就 |
| bulletPool / enemyPool / dropPool / particlePool / damageNumberPool | ObjectPool | 五个对象池 |

### 4.4 引擎回调钩子（共 21 个）

所有钩子为可选公开属性，由 React 层赋值：

| 钩子 | 触发场景 |
|------|---------|
| onStateChange | 游戏状态/玩家同步（节流） |
| onWaveChange | 进入新一波 |
| onBossSpawn / onBossDefeat | BOSS 出生/击败 |
| onInventoryChange | 物品栏变化 |
| onGemInventoryChange | 宝石背包变化 |
| onEnhanceItemInventoryChange | 强化道具变化 |
| onEnchantItemInventoryChange | 附魔书变化 |
| onSkillsChange | 技能变化 |
| onEquipmentChange | 已装备槽位变化 |
| onEquipmentStorageChange | 装备仓库变化 |
| onPlayerChange | 玩家属性变化 |
| onMailChange | 邮件列表变化 |
| onWeatherChange | 天气切换 |
| onBuffsChange | Buff 列表变化 |
| onTalentSelection | 触发天赋选择 |
| onShopOpen | 商店打开 |
| onCodexChange | 图鉴更新 |
| onAchievementUnlock | 单个成就解锁（弹通知） |
| onAchievementsChange | 成就列表更新 |
| onRareDrop | 高品质掉落气泡 |

### 4.5 引擎公开方法（按职责分组）

**生命周期**：`start()` / `stop()` / `pause()` / `resume()` / `restartCurrentWave()` / `setGameMode()` / `restartWithMode()` / `saveGame()` / `loadGame()` / `resize()`

**炼狱**：`getPurgatoryRewards()` / `isPurgatorySettlementActive()` / `exitPurgatorySettlement()` / `claimPurgatoryRewards()` / `getPurgatoryBossElement()` / `getPurgatoryChallengeCount()` / `incrementPurgatoryChallenge()`

**邮件**：`claimMailAttachments()` / `removeMail()` / `markMailRead()` / `markAllMailsRead()` / `removeAllReadMails()` / `claimAllMailAttachments()` / `getMails()`

**装备/物品**：`equipItem()` / `addToStorage()` / `removeFromStorage()` / `removeFromInventory()` / `decomposeEquipment()` / `decomposeAllCommon()` / `useItem()` / `batchSellItems()` / `addGold()` / `syncEquipmentState()` / `syncGemInventory()` / `syncEnhanceItemInventory()` / `syncEnchantItemInventory()` / `repairAllEquipment()` / `socketGem()` / `enhanceEquipment()` / `enchantEquipment()` / `synthEnchantItem()`

**商店**：`openShop()` / `closeShop()` / `isShopOpen()` / `getShopItems()` / `buyShopItem()` / `refreshShop()`

**技能/天赋**：`upgradeSkill()` / `downgradeSkill()` / `resetSkills()` / `useSkill()` / `useActiveSkill()` / `selectTalent()` / `getActiveSkills()` / `getTalentChoices()`

**查询**：`getPlayerStats()` / `getEnemyStats()` / `calcPower()` / `getGameMode()` / `getItemCooldowns()` / `getActivePotionEffects()` / `getWeather()` / `getBuffs()` / `getCodexEntries()` / `getAchievements()` / `getStats()` / `claimAchievement()`

**签到/在线**：`checkIn()` / `getCheckInStatus()` / `claimOnlineReward()` / `getOnlineRewardStatus()`

**输入**：`setAimPosition()` / `manualShoot()`

**调试**：`debugSpawnElite()` / `debugSpawnBoss()` / `debugSkipWaves()` / `levelUpBy()` / `addSkillPoints()` / `learnAllSkills()` 等

---

## 5. 状态管理（Zustand Store）

### 5.1 Store 结构

```ts
interface GameStore {
  gameState: GameState | null;
  player: Player | null;
  inventory: ItemStack[];
  skills: Skill[];
  equipment: Equipment[];
  equipmentStorage: Equipment[];
  gemInventory: ItemStack[];
  enhanceItemInventory: ItemStack[];
  enchantItemInventory: ItemStack[];
  buffs: Buff[];
  activeSkills: ActiveSkill[];
  talentChoices: Talent[];
  showTalentSelection: boolean;
  weather: WeatherState;
  codexEntries: CodexEntry[];
  achievements: Achievement[];
  unlockedAchievement: Achievement | null;
  potionHotbar: (ItemStack | null)[];  // 8格药水快捷栏
  rareDropNotifications: {id, rarity, name, icon, kind}[];  // 最多5条
  mails: Mail[];
  // ... setters
}
```

### 5.2 特点

- 纯同步 store，无 reducer，无异步中间件
- 使用细粒度 selector 订阅（`useGameStore(s => s.xxx)`）避免无关重渲染
- 通知和金币使用函数式 `set((state) => ...)`
- `addGold(amount)` 直接累加 `player.gold`

---

## 6. 游戏模式系统

### 6.1 模式列表

| 模式 | 名称 | 解锁等级 | 每日次数 | 难度选择 | 核心机制 |
|------|------|----------|----------|----------|----------|
| stage | 关卡挑战 | 1 | 无 | 否 | 经典闯关，波次系统，击杀 BOSS |
| worldboss | 世界BOSS | 10 | 3 | 是 | 限时 5 分钟，3 阶段形态 |
| purgatory | 炼狱 | 15 | 5 | 否 | 1 条命，枷锁→BOSS→结算 |
| daily | 日常挑战 | 5 | 3 | 否 | 限时 3 分钟，杀 50 怪 |
| material | 材料副本 | 8 | 5 | 是 | 限时 2 分钟，5 种副本类型 |
| mirror | 镜像挑战 | 20 | 5 | 是 | 1v1 公平对决，限时 3 分钟 |
| guard | 守卫战 | 12 | 无 | 否 | 守护左侧基地 |
| homedefense | 家园守卫 | 25 | 无 | 否 | 多方向进攻，可放置防御塔 |

### 6.2 难度系统

| 难度 | 敌人倍率 | 奖励倍率 |
|------|----------|----------|
| easy | 0.6 | 0.7 |
| normal | 1.0 | 1.0 |
| hard | 1.8 | 1.8 |
| nightmare | 3.0 | 3.0 |

### 6.3 材料副本类型

- `enhance`：强化石副本（强化卷/强化器）
- `gem`：宝石矿洞
- `enchant`：附魔秘境
- `exp`：经验秘境
- `gold`：金币矿洞

### 6.4 模式调度

```
restartWithMode(mode) → setGameMode() → resetGameForMode() → start() → initMode()
initMode() 按模式分派到 initXxxMode()
update() 每帧调用 updateMode() → 按模式分派到 updateXxxMode()
```

### 6.5 超时处理

- worldboss / mirror：超时 = 失败
- daily / material：超时 = 成功结算

---

## 7. 战斗系统

### 7.1 伤害计算流程（damageEnemy）

```
1. 暴击判定：isCrit = random*100 < player.critRate
2. finalDamage = isCrit ? floor(damage * (1 + critDamage/100)) : damage
3. Debuff 增伤：遍历 enemy.debuffs，乘以 damageMultiplier
4. 防御计算：
   enemyDefense = max(0, enemy.defense - player.physicalPenetration)
   finalDamage = max(1, floor(finalDamage * (1 - enemyDefense/100)))
5. 扣血（actualDamage = min(damage, health) 防止超额）
6. 触发属性（每次命中独立掷骰）：
   - burn：burnChance% → applySingleEnemyDebuff('burn', burnDamage, burnDuration)
   - poison：poisonChance% → applySingleEnemyDebuff('poison', ...)
   - freeze：freezeChance% → 完全冻结或减速
   - lightning：lightningChance% → chainLightning 连锁
7. 吸血：heal = floor(finalDamage * lifestealPercent/100)
8. 特殊子弹效果（bulletFx）
9. health ≤ 0 → killEnemy
```

### 7.2 防御与穿透

- 防御公式：`finalDamage = floor(damage * (1 - max(0, defense - physicalPenetration)/100))`，最低 1 伤害
- 防御上限：普通敌人 70，BOSS 75
- 物理穿透：减少敌人防御（穿透3、防御5 → 按2算），与技能穿透敌人数量区分

### 7.3 暴击

- 暴击率：critRate%（直接百分比）
- 暴击伤害：`finalDamage = floor(damage * (1 + critDamage/100))`
- 默认 critDamage = 50（即 +50%）

### 7.4 属性伤害激活规则

**必须装备带【火/冰/雷/毒属性攻击 elementalAttack】词条，对应的【属性伤害增加 elementalDamage】才生效。**

品质规则：
- 传说/史诗/神话武器：必须带一个属性攻击词条
- 精致武器：30% 概率拥有属性攻击词条
- 高级及以下：无属性攻击词条
- 灼烧/中毒/冰冻/雷电伤害词条只出现在精致品质以上装备

### 7.5 Debuff 效果表

| type | 颜色 | 伤害/tick | 速度乘数 | tick间隔 | 说明 |
|------|------|-----------|----------|----------|------|
| burn 灼烧 | #FF9900 | 6 | 1.0 | 450ms | 持续火焰伤害 |
| poison 中毒 | #00FF00 | 5 | 0.75 | 600ms | 持续伤害+减速 |
| freeze 冰冻 | #00CCFF | 0 | 0.05 | 1000ms | 几乎冻结 |
| lightning 感电 | #FFFF00 | 7 | 0.65 | 500ms | 持续雷伤+减速 |
| slow 减速 | #8888FF | 0 | 0.4 | 1000ms | 大幅减速 |
| stun 眩晕 | #FFD700 | 0 | 0 | 1000ms | 完全定身 |

### 7.6 连锁闪电（chainLightning）

从源敌人出发，每次找最近敌人（曼哈顿距离 <200），伤害传导，`chainCount` 次后停止，每跳调用 `damageEnemy` 但 `skipLightningChain=true` 防止递归。

### 7.7 玩家受伤来源

| 来源 | 公式 |
|------|------|
| 敌人近战碰撞 | `enemy.damage * (1 - defense/100) * dt` |
| 远程射手抛物线 | `bullet.damage * (1 - defense/100)`，14px 范围 |
| 刺客爆炸 | `shooterBaseDamage * 1.014^(wave-1) * 3 * (1 - defense/100)`，范围 50px |
| 天气伤害 | rain 1.5/s, acid_rain 2/s, thunderstorm 概率8, radiation 1/s, heat_wave 1/s |
| DoT | `maxHealth * value * 0.005`，每 500ms 一跳 |

所有伤害 clamp 到 `min(damage, player.health)`。无敌条件：`shieldActive || invincibleTimer>0 || isDodging`。

### 7.8 精英/BOSS 对玩家施加 debuff

- 仅 elite/boss 触发；BOSS 几率 35%，精英 15%
- 6 种随机：burn、poison、attackSpeedDown、bulletSpeedDown、rangeDown、stun
- BOSS：DoT 3-5% maxHP/s，攻速 -50%，射速 -40%，射程 -40%，stun 1.5-2.5s
- 精英：DoT 2-3% maxHP/s，攻速 -30%，射速 -25%，射程 -25%，stun 1-1.5s

---

## 8. 装备系统

### 8.1 装备槽位（9 个）

`weapon`（武器）/ `armor`（护甲）/ `pants`（裤子）/ `shoulder`（护肩）/ `belt`（腰带）/ `shoes`（鞋子）/ `earring`（耳环）/ `ring`（戒指）/ `necklace`（项链）

### 8.2 品质（6 阶）

| 品质 | 中文名 | 颜色 | 等级解锁 |
|------|--------|------|----------|
| common | 普通 | #A0A0B0 | 1 |
| advanced | 高级 | #4FC3F7 | 1 |
| fine | 精致 | #BA68C8 | 51 |
| legendary | 传说 | #FF8C00 | 100 |
| epic | 史诗 | #FFD700 | 150 |
| mythic | 神话 | #FF3B3B | 200 |

### 8.3 装备属性生成

**基础属性数**：common=1, advanced=2, fine=3, legendary=4, epic=4, mythic=5

**基础属性值**：
- attack=1.35, health=40, defense=4, critRate=1.5, range=6, pierce=1
- 品质倍率：common=1, advanced=1.4, fine=1.9, legendary=2.8, epic=4.0, mythic=5.5
- 等级成长：`levelMult = 1 + (level - 1) * 0.13`
- 公式：`value = floor(baseValue * rarityMult * levelMult * (0.8~0.85 + random*0.3~0.4))`

**射程上限**：common=20, advanced=35, fine=50, legendary=70, epic=85, mythic=100

**装备等级分档**：每 10 级一档（Lv.1/10/20.../990/999），最低 1 级，最高 300 级

### 8.4 词条系统（16 种 type）

`attack | defense | health | critRate | critDamage | attackSpeed | range | elementalDamage | elementalAttack | pierce | resistance | lifesteal | statusFreeze | statusPoison | statusBurn | statusLightning`

**词条数配置**：

| 品质 | 词条数 | 属性攻击概率 |
|------|--------|-------------|
| common | 0 | 0 |
| advanced | 0 | 0 |
| fine | 0 | 0.3 |
| legendary | 0-1 | 1 |
| epic | 1-2 | 1 |
| mythic | 2-2 | 1 |

### 8.5 套装系统

**品质套装（3/6/9 件套，仅 legendary/epic/mythic）**：

| tier | 3件 | 6件 | 9件 |
|------|-----|-----|-----|
| legendary | 攻+15% | 生+25%防+15% | 暴伤+50%攻速+15% |
| epic | 攻+25% | 生+40%防+25% | 暴率+15%暴伤+80% |
| mythic | 攻+8%攻速+4% | 生+12%防+8% | 全属性+10% 每秒回0.4%生命 |

> 神话套装数值为原数值的 20%（平衡调整）

**命名套装（2/4/6 件套，仅 common/advanced/fine）**：

| ID | 名称 | 2件 | 4件 | 6件 |
|----|------|-----|-----|-----|
| wasteland_ranger | 废土游侠 | 攻+10% | 暴率+5% | 攻速+20% |
| tech_soldier | 科技战士 | 防+15% | 生+20% | 护盾再生 |
| mutant_hunter | 变异猎人 | 精英伤+20% | 暴伤+30% | 击杀回血 |
| survivor | 幸存者 | 金币+15% | 金币+30% | 经验+25% |
| raider | 掠夺者 | 攻速+10% | 攻+15% | 吸血+10% |
| wasteland_destroyer | 废土毁灭者 | 攻+20% | 暴伤+50% | 灼烧+攻速15% |

- 同等级传说/史诗/神话品质装备才能构成套装
- 成套装备显示彩色边框跑马灯（legendary=橙、epic=金、mythic=红）

### 8.6 装备耐久度

common=100, advanced=200, fine=300, legendary=400, epic=500, mythic=500

### 8.7 装备锁定

- `lockedEquipIds`：Set<string>，localStorage 持久化（key: `lockedEquipmentIds`）
- 出售时提示已锁定、批量出售自动忽略锁定物品
- 排序和批量出售操作均不改变锁定物品的格子位置

### 8.8 出售价格表

common=10, advanced=25, fine=50, legendary=100, epic=200, mythic=500

### 8.9 属性计算顺序（calculatePlayerStats）

```
基础属性 → +装备主属性 → +强化加成 → +宝石加成 → +词条加成 → ×附魔百分比(attack/health/defense)
→ +附魔flat(critRate/resistance) → +品质套装加成 → +技能加成
```

---

## 9. 宝石镶嵌系统

### 9.1 宝石类型（5 种 × 2 品质 = 10 种）

| 类型 | 中文名 | 图标 | 颜色 |
|------|--------|------|------|
| attack | 攻 | 💎 | #FF6B8A |
| health | 生 | 💚 | #34C759 |
| defense | 防 | 🔷 | #5BA3E0 |
| critRate | 暴 | 🌟 | #B026FF |
| resistance | 抗 | 🔮 | #00F5D4 |

品质：common（值=1） / advanced（值=1，原为2已削弱）

### 9.2 镶嵌规则

- 每件装备最多 15 颗宝石（`MAX_GEM_SOCKETS = 15`）
- **同类宝石锁定**：已镶嵌宝石后，仅允许同类型宝石
- **成功率**：
  - 第 1 颗：100%
  - 第 2-7 颗：50%（失败仅消耗宝石不归零）
  - 第 8-15 颗：50%（失败归零，`isFailResetToZero` 在 currentCount ≥ 7 时为 true）
- 无论成功失败都消耗宝石

### 9.3 宝石掉落

- 普通 70% / 高级 30%

---

## 10. 强化系统

### 10.1 强化规则

- 最高强化等级：15（`MAX_ENHANCE_LEVEL`）
- 攻击加成：`getEnhanceAttackBonus(level) = floor(level*(level+1)/2 * 0.35)`
- 强化消耗金币，随装备等级/品质/强化数值三个权重变化
  - `base(100) * (1+level*0.5) * rarityMult * (1+enhance*0.3)`
  - rarityMult: common=1, advanced=1.5, fine=2, legendary=3, epic=4, mythic=5

### 10.2 成功率与失败

| 等级 | 成功率 | 失败结果 |
|------|--------|----------|
| 1-3 | 100% | 无 |
| 4-6 | 75% | 保留等级 |
| 7-9 | 50% | 等级-2 |
| 10-12 | 30% | 等级-2 |
| 13-15 | 10% | 等级-1 |

### 10.3 强化道具（4 种）

| ID | 名称 | 品质 | 效果 |
|----|------|------|------|
| enhance_scroll_plus1 | 强化等级+1卷 | mythic | +1，限强化13以下使用 |
| enhance_scroll_plus2 | 强化等级+2卷 | fine | +2，限强化9以下使用 |
| enhance_normal_booster | 普通强化器 | common | 免费强化一次 |
| enhance_ancient_booster | 远古强化器 | epic | 免费强化一次，成功率+10% |

---

## 11. 附魔系统

### 11.1 附魔书（5 属性 × 6 品质 = 30 种）

属性：attack / health / defense / critRate / resistance

| 品质 | 百分比 |
|------|--------|
| common | 1% |
| advanced | 2% |
| fine | 3% |
| legendary | 4% |
| epic | 5% |
| mythic | 6% |

### 11.2 附魔效果应用

- attack/health/defense：装备累加值的百分比加成（在装备+词条累加后、套装加成前应用）
  - `value = floor(value * (1 + percent/100))`
- critRate/resistance：直接累加百分比（flat 加成）

### 11.3 合成

- 每 2 本相同附魔书合成 1 本高一级品质（`ENCHANT_SYNTH_COST = 2`）
- 神话品质不可合成
- 初始库存：普通/高级/精致品质各属性各 50 本

### 11.4 覆盖机制

每件装备只能保留 1 条附魔，新附魔直接覆盖旧附魔。

---

## 12. 物品系统

### 12.1 物品类型

`consumable`（消耗品）/ `material`（材料）/ `enhancement`（强化）

### 12.2 消耗品列表（32 种）

- 6 阶血瓶：health_potion / _advanced / _fine / _legendary / _epic / _mythic
- 再生药水：regen_potion
- 增益药水：attack_boost / speed_boost
- 炸弹类：bomb / freeze_bomb / stun_bomb
- 状态弹：lightning_bolt / curse_scroll
- 技能药水（8 种）：potion_attack / _speed / _health / _crit / _defense / _range / _laser / _flash / _sweep / _clone

### 12.3 技能药水

- 名称格式：【[技能名称]技能药水 - Lv.[人物实际等级]】
- 不同等级同类型药水可在物品栏共存
- 药水掉率提升 150%（所有药水类物品掉落权重 ×2.5）

### 12.4 药水效果分类

- **本回合生效**（wavePotionEffects）：波次内持续
- **定时生效**（timedPotionEffects）：倒计时结束消失
- **冷却**（itemCooldowns）：使用后进入冷却

### 12.5 快捷栏

8 格药水快捷栏（potionHotbar），2行×4列，36×36 格子

---

## 13. 技能系统

### 13.1 技能树结构

三棵树，50+ 技能，`maxLevel=5`：

**右树（属性技能，6 层）**：

| 层级 | 解锁等级 | 技能 |
|------|----------|------|
| L1 | Lv.1 | atk_1, spd_1, hp_1, crit_1 |
| L2 | Lv.20 | atk_2, spd_2, hp_2, crit_2, def_1, gold_1 |
| L3 | Lv.50 | atk_3, spd_3, hp_3, crit_3, def_2, regen_1, gold_2, exp_1, drop_1, lifesteal_1, lightning_1, rng_4, piercing_2 |
| L4 | Lv.80 | atk_4, spd_5, hp_4, crit_4, def_3, regen_2, exp_2, drop_2, cdmg_1, lightning_2, lifesteal_2 |
| L5 | Lv.120 | atk_5, cdmg_2, regen_3 |
| L6 | Lv.150 | cdmg_3（毁天灭地） |

**左树（特效技能，4 层）**：

| 层级 | 解锁等级 | 技能 |
|------|----------|------|
| L1 | Lv.30 | fx_bullet_1（增加子弹数） |
| L2 | Lv.40 | fx_sync_1, fx_bomb_1, fx_freeze_1, fx_poison_1, fx_shock_1 |
| L3 | Lv.60-80 | fx_burn_1, fx_laser_1（激光炮 CD 30s）, fx_grenade_1, fire_shot_1, poison_shot_1, ice_shot_1 |
| L4 | Lv.80-100 | fx_flash_1（全屏闪光 CD 50s）, fire_shot_2, poison_shot_2, ice_shot_2 |

**分身树（4 层）**：

| 层级 | 解锁等级 | 技能 |
|------|----------|------|
| L1 | Lv.160 | clone_1（召唤分身） |
| L2 | Lv.180 | clone_bullet_1（分身增弹） |
| L3 | Lv.200-220 | clone_sync_1, fx_clone_grenade_1, fx_clone_shock_1 |
| L4 | Lv.300 | clone_sweep（战术横扫 CD 100s） |

### 13.2 主动技能（3 个，独立于技能树）

| ID | 名称 | 图标 | 冷却 | 效果 |
|----|------|------|------|------|
| dodge | 翻滚闪避 | 🌀 | 5000ms | 无敌 500ms，位移 400ms |
| grenade | 手雷投掷 | 💣 | 8000ms | 爆炸半径 80px，伤害 100+attack*0.5 |
| drone | 攻击无人机 | 🛸 | 20000ms | 召唤无人机协助 10 秒 |

### 13.3 技能升级规则

- 消耗技能点（`skill.cost`）
- 需达到 `requiredLevel`
- 需所有 `requiredSkills` 中每个前置技能 `level > 0`
- 降级时不能降被其他技能依赖的技能

### 13.4 技能栏显示规则

技能栏显示 SkillTree 中已学习的主动技能（`level > 0 && cooldown > 0`），按 cooldown 升序排列，取前 8 个。

### 13.5 分身位置

以玩家中心为基准上下对称分布：上分身 y 偏移 -100px，下分身 y 偏移 +85px。

### 13.6 战术横扫（clone_sweep）

10 秒内连发翻倍（4×2=8），冰冻弹/爆弹/毒气弹 100% 发射，CD 100s。

---

## 14. 敌人系统

### 14.1 普通怪（8 种）

| id | 名称 | 血 | 速 | 伤 | 经验 | 特点 |
|----|------|----|----|----|----|------|
| mutant | 变异体 | 25 | 3 | 5 | 10 | 入门杂兵 |
| raider | 掠夺者 | 30 | 4.5 | 6 | 12 | 较快 |
| infected | 感染者 | 55 | 3.2 | 7 | 18 | 2%吸血、20%中毒 |
| brute | 暴徒 | 160 | 2 | 18 | 45 | 14%减伤、10%暴击 |
| spider | 巨型蜘蛛 | 22 | 7 | 5 | 11 | 最快、14%暴击、25%中毒 |
| zombie | 丧尸 | 110 | 0.9 | 7 | 22 | 慢但血厚 |
| ranged_shooter | 远程射手 | 65 | 2.8 | 9 | 22 | 250射程远程攻击 |
| assassin | 刺客 | 38 | 5.8 | 40 | 24 | 25%暴击，接触自爆 |

### 14.2 精英怪（3 种）

| id | 名称 | 血 | 速 | 伤 | 元素 | 天气 | 特点 |
|----|------|----|----|----|------|------|------|
| heavy_trooper | 重装兵 | 450 | 1.8 | 32 | physical | sandstorm | 38%减伤 |
| mech_soldier | 机甲兵 | 700 | 2.8 | 50 | lightning | thunderstorm | 28%感电、200射程 |
| sniper_bot | 狙击机器人 | 300 | 0.35 | 70 | physical | fog | 400射程、35%暴击 |

### 14.3 BOSS（3 种）

| id | 名称 | 血 | 速 | 伤 | 元素 | 天气 | 特点 |
|----|------|----|----|----|------|------|------|
| war_tank | 战争坦克 | 2800 | 0.6 | 65 | fire | heat_wave | 48%减伤、32%灼烧 |
| alien_hive | 异星母巢 | 6000 | 0.3 | 100 | poison | acid_rain | 12%吸血、42%中毒 |
| cyber_dragon | 机械巨龙 | 10000 | 0.4 | 130 | ice | snow | 58%减伤、35%冰冻 |

### 14.4 特殊敌人（11 波后刷出）

| id | 名称 | 血 | 速 | 伤 | 特点 |
|----|------|----|----|----|------|
| gundam | 高达 | 1100 | 2.2 | 60 | 62%减伤、55×66 大体型 |
| alien | 异形 | 480 | 6 | 135 | 35%暴击、32%中毒、2穿透 |

### 14.5 敌人 AI 行为

**弓箭手**：
- 数量为原数量的 1/3
- 射程为玩家当前射程的 75%
- 进入射击范围后停止移动并攻击
- 玩家后退超出射程时继续追击
- 无论是否在射程内，`updateRangedShooterAttack` 必须始终调用

**刺客**：
- 进入玩家射程前直线向左移动（正常移速）
- 进入射程后朝玩家直线突进（追踪移动）
- 与玩家边距 <10px 时触发爆炸

### 14.6 敌人数值缩放（resetEnemy）

```
healthMult  = 1 + (wave-1)*0.12 + 1.010^(wave-1) * 0.4
damageMult  = 1 + (wave-1)*0.05 + 1.006^(wave-1) * 0.25
speedMult   = 1 + min(0.35, (wave-1)*0.0035)
expMult     = 1 + (wave-1)*0.07 + 1.008^(wave-1) * 0.35
bossHpMult  = boss ? min(45, 1 + sqrt(wave)*9 + wave*0.3) : 1
defense     = min(defCap, baseDefense + (wave-1)*0.25)  // defCap: 普通70, BOSS75
dropRate    = min(1, baseDropRate + (wave-1)*0.0045)
```

精英/BOSS 体型统一为 90×100。

---

## 15. 波次与刷新机制

### 15.1 波次参数

- 每波敌人数量：50 只（固定）
- 波间间隔：5000ms
- 刷新间隔：`max(800, 1200 - wave*30)` ms

### 15.2 刷新规则（spawnEnemy）

```
1. 精英波（wave % 5 = 0）→ 刷精英
2. BOSS波（wave % 10 = 0）→ 刷BOSS
3. wave ≥ 11：第24只 → 高达；第29只 → 异形
4. 普通怪池：NORMAL_ENEMY_TYPES 前 min(2+wave/3, 6) 种
   - wave ≥ 3：1/3 概率加入 ranged_shooter
   - wave ≥ 5：加入 assassin
5. 从池中随机选一只刷出
```

### 15.3 精英/BOSS 刷新

```
spawnElite: idx = min(floor(wave/10), 2); type = ELITE_ENEMY_TYPES[idx]
spawnBoss:  idx = min(floor(wave/20), 2); type = BOSS_ENEMY_TYPES[idx]
```

### 15.4 波次流程

```
startWave() → currentWave++ → 重置spawn计数 → 通知onWaveChange
  ↓ 刷新50只敌人
endWave() → betweenWaves=true → betweenWaveTimer=5000 → 加分 → 发战斗邮件
  ↓ 5秒后
startWave() → 下一波
```

---

## 16. BOSS 机制

### 16.1 普通关卡 BOSS

- 3 阶段：phase 1 → (血<60%) phase 1.5 → (血<30%) phase 2
- phase 2：速度 ×1.3，屏震 8，技能 CD 由 4000ms → 2500ms
- 3 种技能随机：
  - 召唤 5 个小怪
  - 冲刺：速度 ×2.5，1.5s
  - 对玩家施加 poison debuff

### 16.2 世界 BOSS

- 体型 200×220，血量 `5e7 * 1.15^level * diffMult`
- 3 阶段（按血量）：
  - ≤90% → phase 1
  - ≤66% → phase 2，攻速 ×0.75，速度 ×1.2
  - ≤33% → phase 3，攻速 ×0.6，速度 ×1.5
- 3 种攻击：
  - 扇形子弹（3/5发）
  - 环形弹幕（12+phase*4发）
  - Y轴冲锋

### 16.3 镜像 BOSS

- 体型 24×48，属性完全克隆玩家
- damage = `player.attack * 0.3 * diffMult`
- AI：维持 180px 距离，Y轴跟随，按 attackSpeed 射击

---

## 17. 炼狱模式

### 17.1 三阶段流程

```
阶段1：炼狱枷锁（chains）
  - 200×200，50000血（×(1+level*0.1)*diffMult），0速度，30减伤
  - 不会移动，仅受玩家攻击
  - 击败后 → 阶段2

阶段2：属性BOSS（boss）
  - 随机刷新一只属性BOSS
  - 200×200，固定移速23（约刺客2倍）
  - 拥有3个属性技能
  - 血量<30% → phase 2，技能CD 3500→2500ms
  - 击败后 → 阶段3

阶段3：结算（settlement）
  - isGameOver=true，显示结算界面
  - 随机获得5件装备
  - 提供【再次挑战】和【返回主界面】选项
```

### 17.2 四只炼狱 BOSS

| bossType | 名称 | 血量 | 伤害 | 防御 | 元素 | 100%触发属性 |
|----------|------|------|------|------|------|-------------|
| purgatory_fire | 灼炎领主 | 80000 | 120 | 40 | fire | burn |
| purgatory_poison | 剧毒女王 | 75000 | 100 | 35 | poison | poison |
| purgatory_ice | 极寒君王 | 90000 | 90 | 55 | ice | freeze |
| purgatory_lightning | 雷霆主宰 | 70000 | 140 | 30 | lightning | lightning |

### 17.3 BOSS 技能（每只3个，随机使用）

| BOSS | 技能0 | 技能1 | 技能2 |
|------|-------|-------|-------|
| 灼炎领主 | 火焰风暴(16发环形) | 烈焰冲击(5发扇形) | 陨石坠落(3点延迟落火) |
| 剧毒女王 | 毒雾蔓延(6发随机) | 毒刺弹幕(8发密集) | 腐蚀之雨(5团毒云) |
| 极寒君王 | 冰锥突刺(10发上冲) | 冰晶散射(12发环形) | 冰冻射线(3发大冰弹) |
| 雷霆主宰 | 雷击(4处延迟雷劈) | 电磁脉冲(10发环形) | 连锁闪电(3发快速) |

### 17.4 BOSS AI

```
距离玩家 > 180  → 朝玩家靠近
距离玩家 < 120  → 远离玩家
中间区域        → 侧向移动（保持150px目标距离）
```

### 17.5 奖励规则

- 每日可挑战 5 次（localStorage 按日期存储）
- 击败后随机获得 5 件装备
- 其中 1 件为玩家同等级、精致品质以上且带 BOSS 同种属性词条
- 奖励入仓，仓库满时溢入战斗邮件

### 17.6 BOSS 血条

- top 值：140px（较原位置下移 40px）
- 血段切换时用 `key={currentSegment}` 强制 remount，避免 0→100% 填充动画
- 段内保留 `transition: width 150ms linear` 平滑减少

---

## 18. 邮件系统

### 18.1 邮件结构

```ts
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

### 18.2 战斗邮件发送（sendBattleMail）

调用时机：每波 endWave()、炼狱奖励领取、游戏开始时清空遗留

- 标题：关卡显示【第n波 战利品奖励】，其他模式显示【模式名 战利品奖励】
- 正文："仓库已满，以下{N}件战利品暂存于邮件中，请及时领取。"
- `mails.unshift(mail)`，最多保留 50 封

### 18.3 领取逻辑

**单封领取**（claimMailAttachments）：逐件入仓，部分成功也允许

**一键领取**（claimAllMailAttachments）：
1. 预检装备栏和物品栏仓库容量
2. 统计所有未领邮件附件总量
3. 任一不足 → 全部不领取，返回具体差值
4. 容量充足 → 逐封领取

### 18.4 一键已读/删除

- 未读邮件 > 0：显示【一键已读】（蓝色）
- 未读邮件 = 0：切换为【一键删除】（红色）
- 删除时仅处理已读邮件，跳过有未领取附件的邮件
- 一键删除需弹出确认弹窗（RestartConfirmModal 模板，neonRed 配色）

### 18.5 附件展示

- 装备/物品/金币统一 36×36 图标格子
- 金币作为图标格子（💰+数量角标）固定显示在附件最后位置
- 附件区域固定在邮件详情下方（flexShrink:0），不随正文滚动
- 点击装备/物品附件弹出详情弹窗（复用 EquipmentDetailModal）

### 18.6 新手大礼包

系统默认发送【新手大礼包】邮件，附件包含：金币×2000、生命药水×10、攻击药剂×5、炸弹×3。已领取过则不再重复发送。

---

## 19. 商店系统

### 19.1 商品列表（5 件）

| 商品 | 类型 | 价格 |
|------|------|------|
| 完全恢复生命 | refill | 50 + wave*5 |
| 生命药水 | item | 30 + wave*3 |
| 炸弹 | item | 80 + wave*8 |
| 随机装备×3 | equipment | 按品质+等级 |

### 19.2 装备价格

common=100, advanced=300, fine=800, legendary=2000, epic=5000, mythic=12000
`finalPrice = floor(equipPrice * (1 + level * 0.2))`

### 19.3 刷新

消耗 `50 + currentWave*5` 金币重新生成商品

---

## 20. 成就系统

### 20.1 数据结构

```ts
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

### 20.2 系统成就（11 个）

| ID | 名称 | 目标 | 奖励 |
|----|------|------|------|
| first_blood | 初次击杀 | 击杀1 | 金币+100 |
| kill_10 | 小试牛刀 | 击杀10 | 金币+300 |
| kill_100 | 百人斩 | 击杀100 | 金币+1000 |
| kill_500 | 杀戮机器 | 击杀500 | 金币+3000 |
| wave_5 | 幸存者 | 第5波 | 金币+500 |
| wave_10 | 坚韧不拔 | 第10波 | 金币+2000 |
| wave_20 | 废土传说 | 第20波 | 金币+5000 |
| boss_slayer | Boss杀手 | 击败1Boss | 金币+1500 |
| elite_hunter | 精英猎手 | 杀10精英 | 金币+800 |
| single_wave_50 | 清场专家 | 单波50杀 | 金币+600 |
| equip_legendary_get | 传说降临 | 获得1传说 | 金币+500 |

### 20.3 等级成就（20 个，Lv.10-200 每10级）

奖励为递增的技能点（+3 ~ +150）。

### 20.4 解锁与领取

- **解锁**：`checkAchievements()` 检测进度，满足条件时 `unlocked=true`（不自动发奖）
- **领取**：`claimAchievement(id)` 校验 `unlocked && !claimed`，系统成就给金币，等级成就给技能点
- **红点**：成就按钮右上角显示可领取数（`unlocked && !claimed` 的数量）

### 20.5 进度检测

- kill 类 → `totalKills`
- wave 类 → `highestWave`
- boss_slayer → 图鉴中 war_tank/alien_hive 的 kills
- elite_hunter → heavy_trooper + mech_soldier 的 kills
- single_wave_50 → 历史最高单波击杀
- equip_legendary_get → 图鉴中 equip_legendary.obtained
- level_* → `player.level`

---

## 21. 图鉴系统

### 21.1 数据结构

```ts
interface CodexEntry {
  id: string;
  type: 'enemy' | 'equipment' | 'item';
  name: string;
  discovered: boolean;
  kills?: number;      // 仅 enemy
  obtained?: number;   // 仅 equipment/item
  description: string;
}
```

### 21.2 条目

- **敌人**：8 种（mutant/raider/infected/brute/heavy_trooper/mech_soldier/war_tank/alien_hive）
- **装备**：6 种品质
- **物品**：7 种

### 21.3 记录逻辑

- `discoverEnemy(name)`：杀敌时调用
- `addEnemyKill(name)`：kills++
- `addEquipmentObtained(rarity)`：装备入仓时调用
- `addItemObtained(itemId)`：物品入仓时调用

---

## 22. 签到与在线奖励

### 22.1 签到（每周7天）

| 日 | 物品 | 数量 | 金币 |
|----|------|------|------|
| 周一 | health_potion | 5 | 200 |
| 周二 | attack_boost | 3 | 300 |
| 周三 | speed_boost | 3 | 300 |
| 周四 | bomb | 3 | 500 |
| 周五 | health_potion_advanced | 5 | 500 |
| 周六 | freeze_bomb | 2 | 800 |
| 周日 | health_potion_legendary | 3 | 1500 |

- 周标识：`${year}-${weekNum}`
- 跨周自动重置

### 22.2 在线奖励（4 档）

| 档位 | 时间 | 物品 | 数量 | 金币 |
|------|------|------|------|------|
| 1 | 30分钟 | health_potion | 5 | 300 |
| 2 | 60分钟 | attack_boost | 3 | 500 |
| 3 | 90分钟 | bomb | 3 | 800 |
| 4 | 120分钟 | health_potion_fine | 5 | 1500 |

---

## 23. 掉落系统

### 23.1 击杀掉落流程

```
1. 经验：floor(enemy.exp * 0.5)（降50%）
2. 金币：floor(baseExpGain * 2)
3. 分数：baseExpGain * 10/30/100（普通/精英/Boss）
4. 普通掉落（单次判定）：
   if random < dropRate * (1 + dropBonus) * 0.25:
     - 20% → 血瓶+20
     - 15% → 金币
     - 65% → 随机物品
5. 装备掉落（独立判定，每个品质独立）
```

### 23.2 装备掉率

| 品质 | normal | elite | boss |
|------|--------|-------|------|
| common | 4% | 0 | 0 |
| advanced | 3% | 0 | 0 |
| fine | 2% | 30% | 0 |
| legendary | 0.35% | 10% | 20% |
| epic | 0.2% | 7.5% | 15% |
| mythic | 0.1% | 4% | 7.5% |

> 传说/史诗/神话概率减半（`highTierMultiplier = 0.5`）

### 23.3 物品掉落权重

- 基础权重：common=50, advanced=30, fine=15, legendary=4, epic=1, mythic=0.5
- 敌人类型倍率：normal×0.5, elite×1.5, boss×3
- 药水类权重 ×2.5

### 23.4 装备掉落等级

- 玩家 < 10 级：装备 Lv.1
- 否则：`min(990, floor(playerLevel / 10) * 10)`（每10级一档）
- Boss 掉落：`min(999, baseTier + 20)`（高两档）

### 23.5 掉落物品自动捡取

掉落物品 3 秒后自动被角色吸引捡取。

---

## 24. 仓库系统

### 24.1 容量（共享常量）

```ts
STORAGE_CAPACITY = {
  equipment: 100,
  inventory: 100,
  gem: 50,
  enhance: 30,
  enchant: 30,
}
```

### 24.2 溢出处理

所有写入仓库的入口都必须做容量校验：
- 超限装备 → 溢入 `pendingMailDrops.equipment`
- 超限物品 → 溢入 `pendingMailDrops.items`
- `sendBattleMail()` 将 pendingMailDrops 转为战斗邮件

### 24.3 容量校验入口

`addToStorage` / `addToInventory` / `claimMailAttachments` / `claimAllMailAttachments预检` / `equipItem` / `buyShopItem` / `syncEquipmentState` / `syncGemInventory` / `syncEnhanceItemInventory` / `syncEnchantItemInventory` / `loadGame加载`

### 24.4 UI 层拦截

`handleEquip` / `handleUnequip` 在仓库满时拦截并 toast 提示。

---

## 25. UI 系统

### 25.1 主题配色

```ts
neonCyan   = '#00F5D4'  // 主青色
neonPurple = '#B026FF'  // 紫色
neonPink   = '#FF0080'  // 粉色（攻击属性）
neonYellow = '#FFE600'  // 黄色（金币、强调）
neonGreen  = '#00FF9D'  // 绿色（生命、领取成功）
neonBlue   = '#4FACFE'  // 蓝色（技能栏）
neonRed    = '#FF2D55'  // 红色（生命、删除）
neonOrange = '#FF8C00'  // 橙色（炼狱）
```

> UI 颜色亮度为当前值的一半

### 25.2 字体

- `neonText`: Rajdhani/Orbitron/Courier New/monospace, fontWeight 600, letterSpacing 0.5px
- `pixelText`: Press Start 2P/monospace
- 所有界面文字使用中文，除 'Lv.' 保持不变

### 25.3 界面布局

```
┌─────────────────────────────┐
│  顶部状态栏（动态高度）        │  StatusBar: 血条/经验/等级/战力/金币/波次
├─────────────────────────────┤
│                             │
│  战场区域（固定 300px）       │  GameCanvas
│                             │
├─────────────────────────────┤
│  功能区（110px）             │  QuickBars: 物品快捷栏 + 技能栏
├─────────────────────────────┤
│  按钮区（50px）              │  8个圆形按钮
├─────────────────────────────┤
│  占位框（30px）              │  ︿
└─────────────────────────────┘
```

主界面时：隐藏功能区，按钮区隐藏重开/主界面按钮，高度 80px（50+30）。

### 25.4 底部按钮（8 个）

【人物】【技能】【成就】【社交】【邮件】【背包】【重开】【主界面】

- 等宽分布，圆形立体按钮（30×30 圆形图标 + 8px 文字标签）
- active 态：青色径向渐变 + 双层青色外发光
- 角标：邮件显示未读数，成就显示可领取数

### 25.5 弹窗规范

**基准模板**：`RestartConfirmModal.tsx`
- 260px 宽卡片
- 14px 圆角
- `blur(12px)` 背景
- 顶部图标+标题+副说明
- 底部确定/返回按钮带 hover 效果
- 仅配色按操作语义区分

**点击外部关闭**：所有弹窗必须支持
- 遮罩层 `onClick={onClose}`
- 内容容器 `onClick={(e) => e.stopPropagation()}`

**弹窗结构**（推荐兄弟元素结构）：
```tsx
<div className="absolute left-0 right-0 z-[60]" style={{...}}>
  <div className="absolute inset-0" onClick={onClose} />  {/* 遮罩 */}
  <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
    {/* 内容 */}
  </div>
</div>
```

**z-index 层级**：
- 主界面：z-50
- 面板浮层：z-[60]
- 装备详情：z-[300]
- 确认弹窗：z-[90]

### 25.6 装备格子规范

所有装备图标格子统一：
- 36×36px
- 2.5px 边框
- 8px 圆角
- 稀有度径向渐变背景
- 统一使用 `EquipmentDetailModal.tsx` 导出的 `itemSlotStyle` 函数
- 空格子使用 2.5px 实线边框（不用虚线）

### 25.7 装备详情弹窗

全量复用共享组件 `EquipmentDetailModal.tsx`，禁止新建重复的装备详情弹窗。物品详情弹窗暂保留各处本地实现。

### 25.8 面板浮层高度

| 面板 | 高度 |
|------|------|
| 人物面板 | 266px |
| 背包面板 | 266px |
| 技能面板 | 600px |
| 成就/图鉴面板 | 350px |
| 邮件面板 | 266px |

### 25.9 战场提示文字

精英来袭、BOSS来袭等必须水平居中显示。

---

## 26. 存档系统

### 26.1 存档结构

存档为 JSON 对象，包含：
- player（玩家数据）
- gameState（游戏状态）
- equipment / equipmentStorage / inventory
- gemInventory / enhanceItemInventory / enchantItemInventory
- skills / activeSkills / talentChoices
- buffs / codexEntries / achievements
- mails
- checkInDays / checkInWeekKey
- onlineMinutes / onlineRewardClaimed
- lockedEquipmentIds（UI 层 localStorage）
- batchSellQualities（UI 层 localStorage）
- purgatory_challenge（每日挑战次数，按日期）

### 26.2 存档兼容

- 旧存档成就可能没有 `claimed` / `category` 字段
- 旧版本 `unlocked=true` 即代表已自动发奖，视为 `claimed=true`
- 旧存档仓库超容数据截断 + 溢入 pendingMailDrops

### 26.3 存档时机

- `saveGame()`：返回主界面、签到、领取在线奖励时调用
- `loadGame()`：引擎构造时调用

---

## 27. 硬性约束与规范

### 27.1 代码规范

- 所有代码修改完成后，100% 必须直接启动项目供用户快速调试
- 访问方式固定两种：本地 `http://localhost:5173/`；局域网 `http://192.168.1.5:5173/`
- 所有新建弹窗默认以 `RestartConfirmModal.tsx` 为模板
- 所有弹窗必须支持点击弹窗外任意位置关闭
- 所有装备图标格子统一为装备栏格子大小（36×36px）
- 装备详情弹窗全量复用 `EquipmentDetailModal.tsx`
- 仓库容量统一使用共享常量 `STORAGE_CAPACITY`

### 27.2 游戏机制约束

- 所有技能百分比伤害替换为 `Lv.等级 × 攻击力` 公式
- 属性伤害生效需装备带对应属性攻击词条
- 传说/史诗/神话武器必须带属性攻击词条
- 神话品质装备射程不能超过 100 点
- 人物最大射程为战场 95% 宽度，debuff 时最低 25%
- 神话套装属性数值为原数值的 20%
- 装备等级最高 300 级，每 10 级一档
- 同等级传说/史诗/神话品质才能构成套装
- 药水掉率提升 150%
- 掉落物品 3 秒后自动捡取

### 27.3 战场约束

- 战场高度固定 300px
- 底部装备栏区域固定 190px（110+50+30）
- 所有扣血点必须 `actualDamage = Math.min(damage, health)`
- 人物血量≤0 时强制设为 0 并触发游戏结束
- `triggerGameOver()` 必须立即同步调用 onStateChange 和 onPlayerChange

### 27.4 弹窗返回规范

弹窗返回主界面时，需在返回主界面成功后关闭弹窗自身。

### 27.5 准星功能

- 点击屏幕后 1 秒自动消失或点击其他位置时消失
- 准星存在时，自动攻击和点击攻击均朝准星位置发射
- 准星消失后，角色恢复自动攻击

---

## 附录：关键文件路径

| 文件 | 说明 |
|------|------|
| `src/App.tsx` | 根组件，视图切换 |
| `src/game/GameEngine.ts` | 核心引擎（~13000行） |
| `src/game/types/game.ts` | 全局类型定义 |
| `src/game/data/equipment.ts` | 装备、词条、套装、掉率 |
| `src/game/data/enemies.ts` | 敌人配置 |
| `src/game/data/skills.ts` | 技能树 |
| `src/game/data/gems.ts` | 宝石 |
| `src/game/data/enhanceItems.ts` | 强化道具 |
| `src/game/data/enchantItems.ts` | 附魔书 |
| `src/game/data/gameModes.ts` | 游戏模式 |
| `src/game/data/storageCapacity.ts` | 仓库容量常量 |
| `src/store/gameStore.ts` | Zustand 状态 |
| `src/theme/colors.ts` | 主题配色 |
| `src/utils/styles.ts` | 样式工具 |
| `src/components/RestartConfirmModal.tsx` | 弹窗基准模板 |
| `src/components/EquipmentDetailModal.tsx` | 共享装备详情弹窗 |
| `src/components/PixelButton.tsx` | 像素风按钮 |
| `src/components/EquipmentPanel.tsx` | 装备栏主面板 |
| `src/components/MainMenu.tsx` | 主界面 |
| `src/components/CodexPanel.tsx` | 图鉴/成就面板 |
| `src/components/MailPanel.tsx` | 邮件面板 |
| `src/components/StatusBar.tsx` | 顶部状态栏 |
| `src/components/QuickBars.tsx` | 底部快捷栏 |

---

*文档生成时间：2026-07-09*
*基于代码库当前状态逆向梳理*
