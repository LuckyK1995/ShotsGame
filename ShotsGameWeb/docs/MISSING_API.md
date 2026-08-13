# 缺失接口清单

> 本文档基于对 `D:\ShotsGame\ShotsGameWebApi` 后端项目（22 个 Controller）与前端 `src/api/modules` 的全量比对整理。
> 前端已对齐的模块：auth / player / saveData / shop / lottery / lotteryPot / horseRacing / checkIn / onlineReward / mail / equipment / inventory / skill / talent / achievement / codex / quiz / gameMode / battle / calculate / enhance。
> 以下为后端**暂不支持**或**未找到对应接口**的能力，以及需要 WebSocket 等其他技术的场景。

---

## 一、需要 WebSocket / SignalR 等实时通信技术的场景

后端 `Program.cs` 当前仅注册 REST + JWT，**未启用 WebSocket / SignalR**。以下场景目前均为前端本地模拟或无实现：

| # | 场景 | 现状 | 期望能力 |
|---|---|---|---|
| W1 | **世界 BOSS 共享血量** | 前端 `initWorldBossMode` 本地生成 BOSS，玩家各自打各自的 | 多玩家同时攻击同一只世界 BOSS，血量实时同步；BOSS 死亡后按贡献分配奖励 |
| W2 | **镜像挑战 1v1 PvP** | `initMirrorMode` 本地生成"镜像战士"AI，并非真实对手 | 匹配真实玩家，实时同步双方位置/射击/技能/血量 |
| W3 | **在线时长精准统计** | 前端用 `localStorage.lastOnline` 客户端时间戳累计，存在改本地时间作弊空间 | 服务端通过心跳/WebSocket 维护会话在线状态，作为在线奖励权威依据 |
| W4 | **邮件/系统公告实时推送** | 邮件面板打开时才 `refreshMailsFromServer` 拉取 | 服务端有新邮件时主动推送，前端即时刷新未读角标 |
| W5 | **玩家在线状态 / 好友列表** | 无好友系统，无在线状态 | 好友上下线通知、在线名单查询 |
| W6 | **跨玩家聊天** | 无 | 世界频道/私聊/公会频道实时消息 |
| W7 | **拍卖行 / 玩家交易** | 无 | 实时挂单、竞价、成交通知 |
| W8 | **赛马实时观战** | 赛马为单玩家回合制（create→bet→start→result），无多玩家同场 | 多玩家同场下注、实时观看赛马过程 |

> 实现建议：后端引入 `Microsoft.AspNetCore.SignalR`，按业务域拆分 Hub（`WorldBossHub` / `PvpHub` / `NotificationHub` / `ChatHub`），JWT 通过 `OnConnectedAsync` 绑定 playerId。

---

## 二、缺失的 REST 接口（后端无对应 Controller / Action）

### 2.1 装备商人系统（完全缺失）

后端无 `EquipmentMerchantController`。前端 [GameEngine.ts](file:///d:/ShotsGame/ShotsGameWeb/src/game/GameEngine.ts) 的 `getEquipmentMerchantStatus` / `getMerchantEquipment` / `getMerchantBlueprints` / `buyMerchantEquipment` / `buyMerchantBlueprint` / `craftBlueprint` 全部本地模拟（`generateMerchantEquipmentSet` / `generateBlueprintSet`）。

| 期望接口 | 方法 | 说明 |
|---|---|---|
| `/api/equipment-merchant/tiers` | GET | 获取玩家可购买等级档位列表 |
| `/api/equipment-merchant/equipment` | GET | 按 tierLevel 获取 9 件普通~精致装备列表 |
| `/api/equipment-merchant/blueprints` | GET | 按 tierLevel 获取 18 件传说~史诗设计图列表 |
| `/api/equipment-merchant/buy-equipment` | POST | 购买装备（扣金币、入仓库、校验容量） |
| `/api/equipment-merchant/buy-blueprint` | POST | 购买设计图（扣金币、入背包） |
| `/api/equipment-merchant/craft` | POST | 制作设计图装备（消耗材料+设计图+金币→装备） |

---

### 2.2 装备属性调整/变化系统（缺失）

前端 [GameEngine.ts](file:///d:/ShotsGame/ShotsGameWeb/src/game/GameEngine.ts) 有 `getStatRerollPreview` / `applyStatReroll` / `applyStatTransform`，消耗 `stat_reroll_box` / `stat_transformer` 道具，但后端 `EquipmentController` 无对应 Action。

| 期望接口 | 方法 | 说明 |
|---|---|---|
| `/api/equipment/reroll-stats` | POST | 消耗调整箱，在阈值内重摇基础属性数值 |
| `/api/equipment/transform-stats` | POST | 消耗变化器，随机变更属性类型+数值 |
| `/api/equipment/stat-thresholds` | GET | 查询属性阈值表（按稀有度/等级） |

---

### 2.3 玩家档案字段缺失

后端 `RegisterInput` / `UpdatePlayerInput` 字段不全，无法满足"正常社交资料"需求：

| 字段 | RegisterInput | UpdatePlayerInput | 说明 |
|---|---|---|---|
| `username` | ✅ | — | 登录账号 |
| `password` | ✅ | — | 密码 |
| `displayName` | ✅ | ✅ | 昵称 |
| `email` | ✅ | ❌ **缺失** | 邮箱（注册可填，但无法修改） |
| `avatarUrl` | ❌ **缺失** | ✅ | 头像 URL（注册时无法设置，用户要求注册即含社交资料） |
| `phone` | ❌ | ❌ | 手机号 |
| `gender` | ❌ | ❌ | 性别 |
| `birthday` | ❌ | ❌ | 生日 |
| `region` | ❌ | ❌ | 地区 |
| `bio` / `signature` | ❌ | ❌ | 个人签名 |
| `socialLinks` | ❌ | ❌ | 第三方社交账号链接 |

---

### 2.4 头像文件上传（缺失）

`UpdatePlayerInput.avatarUrl` 仅接受 URL 字符串，无文件上传接口。玩家无法上传本地图片作为头像。

| 期望接口 | 方法 | 说明 |
|---|---|---|
| `/api/player/upload-avatar` | POST | multipart/form-data 上传头像图片，返回 CDN URL |

---

### 2.5 账号安全相关（缺失）

| 期望接口 | 方法 | 说明 |
|---|---|---|
| `/api/auth/forgot-password` | POST | 忘记密码（发送重置链接到邮箱） |
| `/api/auth/reset-password` | POST | 重置密码（凭重置 token） |
| `/api/auth/change-password` | POST | 修改密码（凭旧密码） |
| `/api/player/account` | DELETE | 注销账号（GDPR 合规） |

---

### 2.6 第三方 OAuth 登录（缺失）

| 期望接口 | 方法 | 说明 |
|---|---|---|
| `/api/auth/login/wechat` | POST | 微信登录 |
| `/api/auth/login/qq` | POST | QQ 登录 |
| `/api/auth/login/apple` | POST | Apple 登录 |
| `/api/auth/bind-oauth` | POST | 绑定第三方账号到已有账号 |

---

### 2.7 好友系统（完全缺失）

无 `FriendController`，无好友数据表。

| 期望接口 | 方法 | 说明 |
|---|---|---|
| `/api/friends/list` | GET | 好友列表（含在线状态） |
| `/api/friends/requests` | GET | 待处理好友请求 |
| `/api/friends/request` | POST | 发送好友请求 |
| `/api/friends/accept` | POST | 接受好友请求 |
| `/api/friends/reject` | POST | 拒绝好友请求 |
| `/api/friends/remove` | POST | 删除好友 |
| `/api/friends/search` | GET | 按 username/displayName 搜索玩家 |

---

### 2.8 排行榜变体（部分缺失）

后端仅 `GET /api/player/leaderboard?top=50` 一种全局榜，缺少分时段榜单：

| 期望接口 | 方法 | 说明 |
|---|---|---|
| `/api/player/leaderboard/daily` | GET | 日榜（每日 0 点重置） |
| `/api/player/leaderboard/weekly` | GET | 周榜（每周一重置） |
| `/api/player/leaderboard/friends` | GET | 好友榜（依赖好友系统） |

---

### 2.9 每日挑战次数查询（缺失）

当前每日剩余次数只能通过 `POST /api/game-mode/start` 的响应获取，无法在不开始游戏的前提下查询。

| 期望接口 | 方法 | 说明 |
|---|---|---|
| `/api/game-mode/daily-status` | GET | 查询所有受限模式（purgatory/material/mirror/worldboss）的今日剩余次数 |

---

### 2.10 水果机历史记录查询（缺失）

后端 `LotteryController` 仅有 `spin` 返回当次结果，无历史记录查询接口。前端 `lotteryHistory` 仅本地缓存最近 3 条。

| 期望接口 | 方法 | 说明 |
|---|---|---|
| `/api/lottery/history` | GET | 查询最近 N 次开奖记录 |

---

### 2.11 服务端时间（缺失）

离线奖励计算依赖 `LastActiveAt`，但前端无统一获取服务端时间的入口，跨设备同步时存在时钟漂移风险。

| 期望接口 | 方法 | 说明 |
|---|---|---|
| `/api/server/time` | GET | 返回服务端当前时间（用于校准客户端时钟） |

---

### 2.12 公会 / 战队系统（完全缺失）

无 `GuildController`。如需公会战、公会 boss 等玩法，需新增：

| 期望接口 | 方法 | 说明 |
|---|---|---|
| `/api/guild/create` | POST | 创建公会 |
| `/api/guild/info` | GET | 公会信息 |
| `/api/guild/members` | GET | 成员列表 |
| `/api/guild/join` | POST | 申请加入 |
| `/api/guild/leave` | POST | 离开公会 |
| `/api/guild/boss` | GET/POST | 公会 BOSS |

---

## 三、前端仍使用本地模拟但后端已有接口的场景

以下场景后端接口已存在，但前端 `GameEngine` 仍走本地逻辑（仅通过 `saveData` 全量存档同步）。属于设计选择（降低战斗内 API 调用频率），非严格缺失，但如需服务端权威性可改为实时调用：

| 场景 | 后端接口 | 前端现状 |
|---|---|---|
| 技能升级/降级 | `POST /api/skill/upgrade` / `downgrade` | 本地 `upgradeSkill` / `downgradeSkill`，仅 saveData 同步 |
| 天赋选择 | `POST /api/talent/choose` | 本地 `selectTalent` + `rollTalentChoices`，仅 saveData 同步 |
| 装备穿戴/卸下 | `POST /api/equipment/equip` / `unequip` | 本地 `equip` / `unequip`，仅 saveData 同步 |
| 装备强化/附魔/镶嵌 | `POST /api/equipment/enhance` / `enchant` / `socket-gem` | 本地实现，仅 saveData 同步 |
| 装备分解 | `POST /api/equipment/decompose` | 本地 `decomposeEquipment`，仅 saveData 同步 |
| 强化等级转移 | `POST /api/equipment/transfer-enhance` | 本地实现，仅 saveData 同步 |
| 战斗历史查询 | `GET /api/battle/history` | 前端未接入 |

> 说明：战斗内高频操作保留本地模拟可降低延迟与 API 压力，结算时通过 `battle/submit` + `saveData/save` 落库。是否改为实时调用取决于反作弊与数据一致性要求。

---

## 四、字段命名差异（需注意）

以下字段前后端命名不一致，前端已通过 `http` 客户端的 camelCase 转换处理，新增接口时需保持一致：

| 后端字段 (PascalCase) | 前端字段 (camelCase) | 接口 |
|---|---|---|
| `FromEquipmentId` / `ToEquipmentId` | `sourceEquipmentId` / `targetEquipmentId` | transfer-enhance |
| `GemItemId` | `gemId` | socket-gem |
| `EnchantItemId` | `enchantItemId` | enchant |
| `IsRead` / `IsClaimed` | `read` / `claimed` | mail |
| `AttachmentsJson` (string) | `attachments` (object) | mail（前端做 JSON.parse） |

---

## 五、优先级建议

| 优先级 | 项 | 理由 |
|---|---|---|
| P0 | 2.3 玩家档案字段补全 | 用户明确要求注册含社交资料 |
| P0 | 2.1 装备商人系统 | 核心玩法，当前完全本地 |
| P1 | 2.2 装备属性调整/变化 | 道具已存在但无服务端校验 |
| P1 | W3 在线时长心跳 | 防作弊 |
| P1 | 2.5 账号安全 | 必要功能 |
| P2 | W1 世界 BOSS 共享血量 | 玩法升级 |
| P2 | 2.7 好友系统 | 社交基础 |
| P2 | W2 镜像 PvP | 玩法升级 |
| P3 | 其余项 | 长期规划 |
