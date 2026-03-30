# 力了么 — 后端服务模块

---

## 项目简介

「力了么」是一款微信小程序，通过社交排行榜和每日"LeetCode 步数"推送，激励学生会成员保持算法练习习惯。本文档覆盖项目的**数据层**与**后端引擎**部分，包括 LeetCode 数据抓取、定时结算、排行榜接口，以及供前端调用的 RESTful API。

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

- **后端框架**：Spring Boot (Java)
- **数据库**：MySQL
- **ORM**：MyBatis / MyBatis-Plus（或 Spring Data JPA，视团队习惯而定）
- **定时任务**：Spring `@Scheduled` / Quartz
- **HTTP 客户端**：RestTemplate / WebClient（用于调用 LeetCode GraphQL API）
- **数据源**：LeetCode GraphQL API (`https://leetcode.com/graphql`)
- **前端框架**：微信小程序原生 + WeUI

---

## 数据库设计 (Data Schema)

### `users` 表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | BIGINT (PK, AUTO_INCREMENT) | 主键 |
| `openid` | VARCHAR(128) UNIQUE | 微信用户唯一标识 |
| `lc_id` | VARCHAR(64) | LeetCode 账号名 |
| `total_solved` | INT | 截止目前的总刷题数 |
| `daily_steps` | INT | 今日新增题数 (今日 total − 昨日 total) |
| `last_update` | DATETIME | 上次抓取数据的时间 |

### `daily_logs` 表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | BIGINT (PK, AUTO_INCREMENT) | 主键 |
| `openid` | VARCHAR(128) | 关联用户 |
| `log_date` | DATE | 记录日期 |
| `total_solved` | INT | 当日截止总题数 |
| `daily_steps` | INT | 当日新增题数 |
| `easy_count` | INT | 简单题累计数 |
| `medium_count` | INT | 中等题累计数 |
| `hard_count` | INT | 困难题累计数 |
| `daily_points` | INT | 当日加权积分 |
| `created_at` | DATETIME | 记录创建时间 |
| `rank_tier` | VARCHAR(16) | 等级标签（夯 / 顶级 / 人上人 / NPC / 拉完了） |

> **注意**：原文档中的 `history_logs` (Array) 在关系型数据库中拆分为独立的 `daily_logs` 表，每天一条记录，便于前端图表查询。Schema 可根据开发需要调整，但须同步通知前端开发成员（A 和 C）。

---

## 核心 RESTful API 接口

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

`DeleteUserAccount` 级联逻辑：删号时须同步执行以下操作：① 删除该用户在 `daily_logs` 表中的所有历史记录；② 将该用户所属战队的 `member_count` 减 1；③ 若战队人数降至 0，则将战队状态标记为 `is_active = false`。以上操作应在同一事务中完成。

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
`rank_change` 计算逻辑：对比 T-1（昨日）与 T-2（前日）的排名快照。若 T-1 排名 < T-2 排名则为 `"up"`，T-1 > T-2 则为 `"down"`，相等则为 `"keep"`。用户首次结算（无 T-2 数据）时默认返回 `"keep"`
**排名同分处理**：当日积分相同时，按历史总积分 (`total_points`) 降序排名。

### 3. 数据处理中心 (Backend Engine)

| 功能 | 接口/服务 | 触发方式 | 说明 |
|------|-----------|----------|------|
| GraphQL 抓取引擎 | `LcEngineService` | 即时调用 | 输入 `leetcode_username`，返回 `totalSolved` 及难度分布 |
| 定时结算任务 | `DailySettleJob` | 每天 22:00 `@Scheduled` 触发 | 全员扫描 → 计算差值 → 写入快照 → 更新数据库 |

**Cron Job 执行逻辑**：

1. 遍历所有用户的 `lc_id`
2. 调用 `LcEngineService` 抓取最新 `total_solved`
3. 计算步数：`今日步数 = 最新总数 − 数据库昨日总数`
4. 计算加权分数（按 easy/medium/hard 权重）
5. 存入历史：将结果写入 `daily_logs` 表
6. 计算等级：根据战队内当日积分百分位排名，写入 `rank_tier`（夯 / 顶级 / 人上人 / NPC / 拉完了）
7. 更新状态：把最新总数覆盖写入数据库

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

```java
// GraphQL 请求体 — 校验用户是否存在
String validateQuery = """
    {
      "query": "query getUserProfile($username: String!) { matchedUser(username: $username) { username } }",
      "variables": { "username": "%s" }
    }
    """.formatted(leetcodeUsername);

// GraphQL 请求体 — 获取刷题数据
String statsQuery = """
    {
      "query": "query getUserStats($username: String!) { matchedUser(username: $username) { submitStats { acSubmissionNum { difficulty count } } } }",
      "variables": { "username": "%s" }
    }
    """.formatted(leetcodeUsername);

// 使用 RestTemplate 发送请求
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_JSON);

HttpEntity<String> request = new HttpEntity<>(statsQuery, headers);
ResponseEntity<String> response = restTemplate.postForEntity(
    "https://leetcode.com/graphql", request, String.class
);
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

# 3. 配置数据库（修改 application.yml 中的 MySQL 连接信息）
#    spring.datasource.url=jdbc:mysql://localhost:3306/lilema
#    spring.datasource.username=root
#    spring.datasource.password=<your_password>

# 4. 初始化数据库
mysql -u root -p < sql/init.sql

# 5. 启动后端服务
mvn spring-boot:run

# 6. 微信小程序前端
# 安装微信开发者工具，导入前端项目目录，配置后端 API 地址
```

---

## UI 设计规范 (参考)

- 主色调：LeetCode 橙 `#FFA116`，深灰 `#282828`
- 字体大小：标题 16px / 正文 14px / 标注 12px
- 组件库：WeUI
