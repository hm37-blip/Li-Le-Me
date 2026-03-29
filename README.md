# 力了么 — 后端服务模块

---

## 项目简介

「力了么」是一款微信小程序，通过社交排行榜和每日"LeetCode 步数"推送，激励学生会成员保持算法练习习惯。本文档覆盖项目的**数据层**与**后端引擎**部分，包括 LeetCode 数据抓取、定时结算、排行榜接口，以及供前端调用的云函数 API。

---

## 模块职责概览

| 模块 | 说明 |
|------|------|
| LeetCode GraphQL 抓取引擎 | 稳定获取海外版 LC 的 `totalSolved` 及难度分布 |
| 22:00 定时结算 Cron Job | 全员数据扫描、差值计算、历史快照写入 |
| 排行榜首页前端 | 长列表展示、下拉刷新、排名逻辑 |
| 数据库设计 & 接口文档 | Day 5 前交付，供前端成员并行开发 |
| 并发与性能保障 | 确保用户量增长后抓取与查询性能稳定 |

---

## 技术栈

- **运行环境**：微信云开发 (WeChat Cloud Development)
- **云函数**：Node.js
- **数据库**：云开发内置 NoSQL (MongoDB-like)
- **数据源**：LeetCode GraphQL API (`https://leetcode.com/graphql`)
- **定时触发**：云函数定时触发器 (Cron)
- **前端框架**：微信小程序原生 + WeUI

---

## 数据库设计 (Data Schema)

### `users` 集合

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `openid` | String | 微信用户唯一标识 |
| `lc_id` | String | LeetCode 账号名 |
| `total_solved` | Number | 截止目前的总刷题数 |
| `daily_steps` | Number | 今日新增题数 (今日 total − 昨日 total) |
| `history_logs` | Array | 每日数值快照数组，供前端图表渲染使用 |
| `last_update` | Timestamp | 上次抓取数据的时间 |

> **注意**：此 Schema 可根据开发需要调整，但须同步通知前端开发成员（A 和 C）。

---

## 核心云函数 / API 接口

### 1. 账号与社交模块

| 功能 | 函数名 | 输入 | 输出 |
|------|--------|------|------|
| 微信授权登录 | `WechatLogin` | `js_code` | `openid`, `is_new_user`, `token`, `registration_status` (0=新用户 / 1=未绑LC / 2=完整用户) |
| 上传头像和昵称 | `UpdateUserProfile` | `openid`, `user_nickname`, `avatar_file_id` | `profile_update_success` (Boolean) |
| LeetCode ID 绑定 | `LeetCodeBind` | `openid`, `leetcode_username` | `lc_bind_success` (Boolean), `error_message` |
| 战队生成 | `SquadGenerate` | `squad_name`, `invite_code`, `admin_id`, `max_members` (默认50) | `squad_id`, `created_at`, `is_active` |
| 战队加入 | `VerifyInviteCode` | `openid`, `invite_code` | `squad_join_success`, `squad_name`, `error_msg` |
| 分享裂变 | `ShareInviteID` | `invite_code`, `user_nickname` | `invite_code`（新用户确认后触发 `VerifyInviteCode`） |
| 更换头像 | `UpdateUserAvatar` | `openid`, `new_avatar_file_id` | `update_avatar_success` (Boolean) |
| 销号 | `DeleteUserAccount` | `openid` | `delete_user_success` (Boolean) |

### 2. 排行榜模块

| 功能 | 函数名 | 输入 | 输出 |
|------|--------|------|------|
| 每日排名 | `GetDailyLeaderboard` | `squad_id`, `date` | 排行榜 JSON（见下方定义） |
| 每日步数统计 | `DailyPointsAdd` | JSON (GET) | JSON (POST) |

**积分规则**：`easy : medium : hard = 1 : 2 : 3`

**排行榜返回 JSON 结构**：

```json
{
  "code": 200,
  "msg": "获取战报成功",
  "data": {
    "squad_name": "CESA战队",
    "settle_time": "2026-03-27 22:00",
    "total_members": 50,
    "my_summary": {
      "my_rank": 5,
      "my_daily_steps": 10,
      "rank_change": "up"
    },
    "rank_list": [
      {
        "rank": 1,
        "openid": "user_001",
        "nickname": "示例用户",
        "avatar_url": "https://...",
        "daily_points": 25,
        "details": {
          "easy_added": 1,
          "medium_added": 2,
          "hard_added": 3
        },
        "total_points": 1200,
        "is_top_three": true
      }
    ]
  }
}
```

**排名同分处理**：当日积分相同时，按历史总积分 (`total_points`) 降序排名。

### 3. 数据处理中心 (Backend Engine)

| 功能 | 函数名 | 触发方式 | 说明 |
|------|--------|----------|------|
| GraphQL 抓取引擎 | `LcEngine` | 即时调用 | 输入 `leetcode_username`，返回 `totalSolved` 及难度分布 |
| 定时结算任务 | `DailySettleJob` | 每天 22:00 自动触发 | 全员扫描 → 计算差值 → 写入快照 → 更新数据库 |

**Cron Job 执行逻辑**：

1. 遍历所有用户的 `lc_id`
2. 调用 `LcEngine` 抓取最新 `total_solved`
3. 计算步数：`今日步数 = 最新总数 − 数据库昨日总数`
4. 计算加权分数（按 easy/medium/hard 权重）
5. 存入历史：将结果写入 `history_logs` 数组
6. 更新状态：把最新总数覆盖写入数据库

> ⚠️ **频率控制**：抓取请求间隔至少 0.5 秒，避免被 LeetCode 限流。

### 4. 统计与分析模块

| 功能 | 函数名 | 输入 | 输出 |
|------|--------|------|------|
| 趋势图表数据 | `GetTrendData` | `openid`, `range_days` (默认7) | JSON（`dates[]` + `daily_points_change[]`） |
| 难度分布数据 | `GetDifficultyDistribution` | `openid` | JSON，type 为 `YEARLY`(当年总计) 或 `MONTHLY`(本月新增) |

### 5. 分享与激励模块

| 功能 | 函数名 | 输入 | 输出 |
|------|--------|------|------|
| 海报数据接口 | `GetSharePoster` | `openid`, `squad_id` | JSON（海报所需的排名、步数、等级信息） |

**等级判定表**（按战队百分位排名）：

| 百分位 | 等级 | 视觉标识 |
|--------|------|----------|
| Top 0%–20% | 夯 (Hāng) | 金色 / 皇冠图标 |
| 21%–40% | 顶级 | 银色 / 闪光图标 |
| 41%–60% | 人上人 | 蓝色 / 上升图标 |
| 61%–80% | NPC | 绿色 / 路人图标 |
| 81%–100% | 拉完了 | 灰色 / 乌云图标 |

> 少于 5 人的战队自动评判为"拉完了"；全战队 0 人刷题也是"拉完了"。

---

## LeetCode GraphQL 抓取方法

```javascript
// 校验用户是否存在
const query = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
    }
  }
`;

// 获取刷题数据
const statsQuery = `
  query getUserStats($username: String!) {
    matchedUser(username: $username) {
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;

// 请求示例
const response = await fetch("https://leetcode.com/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: statsQuery,
    variables: { username: "example_user" }
  })
});
```

---

## 开发时间线（后端相关）

| 阶段 | 时间 | 交付物 |
|------|------|--------|
| **D0** | Day 0 | 参与低保真原型评审 |
| **基建期** | Day 1–7 | 跑通 LeetCode 爬虫；**Day 5 前交付接口文档** |
| **MVP 期** | Day 8–15 | 排行榜上线，数据每天准时更新 |
| **进阶期** | Day 16–23 | 趋势数据接口、难度分布接口、海报数据接口 |
| **交付期** | Day 24–30 | 性能优化、Bug 修复、Demo Day 准备 |

---

## 协作约定

- **代码托管**：GitHub，主分支 `main`，开发分支 `dev`
- **接口文档**：Day 5 前提供，前端成员根据文档先行开发
- **每周同步**：每周日晚 7 点微信群汇报 — Done / Blocked
- **并发注意**：压力测试目标 50 人同时在线

---

## 本地开发

```bash
# 1. 克隆仓库
git clone <repo-url>
cd lilema

# 2. 切换到开发分支
git checkout dev

# 3. 安装微信开发者工具并导入项目

# 4. 云函数本地调试
# 在微信开发者工具中右键云函数目录 → 本地调试
```

---

## UI 设计规范 (参考)

- 主色调：LeetCode 橙 `#FFA116`，深灰 `#282828`
- 字体大小：标题 16px / 正文 14px / 标注 12px
- 组件库：WeUI
