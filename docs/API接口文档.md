# API接口文档 - F4个人报告功能

## 基础信息
- **接口协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

---

## 接口列表

### 1. 获取用户报告数据
**用途**: 获取用户在指定时间范围内的刷题统计数据，用于图表展示

**接口地址**: `/api/user/report`

**请求方式**: `GET`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| lcId | String | 是 | LeetCode账号ID |
| range | String | 否 | 时间范围，可选值：`week`(默认)、`month`、`year` |



**成功响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "totalSolved": 256,
    "consecutiveDays": 12,
    "difficulty": {
      "easy": 120,
      "medium": 100,
      "hard": 36
    }
  }
}
```

**字段说明**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| totalSolved | Number | 截止目前的总刷题数 (对应 users.total_solved) |
| consecutiveDays | Number | 连续打卡天数（前端根据 daily_logs 表数据计算） |
| difficulty.easy | Number | 简单题累计数 (对应 daily_logs.easy_count 最新记录) |
| difficulty.medium | Number | 中等题累计数 (对应 daily_logs.medium_count 最新记录) |
| difficulty.hard | Number | 困难题累计数 (对应 daily_logs.hard_count 最新记录) |

**数据来源说明**:
- `totalSolved`: 从 `users` 表获取
- `difficulty` 各字段: 从 `daily_logs` 表的最新记录获取（按 log_date 降序取第一条）
- `consecutiveDays`: 前端基于历史趋势数据自行计算
- 历史趋势数据通过单独的 `/api/v1/stats/trend` 接口获取（见下文）

**错误响应** (400):
```json
{
  "code": -1,
  "message": "用户不存在"
}
```

**错误响应** (500):
```json
{
  "code": -1,
  "message": "服务器错误"
}
```

---

### 2. 获取用户基本信息（可选）
**用途**: 获取用户头像、昵称等基本信息

**接口地址**: `/api/user/info`

**请求方式**: `GET`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| lcId | String | 是 | LeetCode账号ID |

**请求示例**:
```http
GET /api/user/info?lcId=example_user
```

**成功响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "lcId": "example_user",
    "avatar": "https://leetcode.com/avatar.png",
    "totalSolved": 256,
    "ranking": 12345
  }
}
```

---

### 3. 获取趋势数据（历史刷题记录）
**用途**: 获取用户历史刷题趋势，用于图表展示和连续天数计算

**接口地址**: `/api/v1/stats/trend`

**请求方式**: `GET`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| openid | String | 是 | 微信用户唯一标识 |
| range_days | Number | 否 | 时间范围（天数），默认7，可选值：7、30、365 |

**请求示例**:
```http
GET /api/v1/stats/trend?openid=oABC123&range_days=7
```

**成功响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "dates": ["03-22", "03-23", "03-24", "03-25", "03-26", "03-27", "03-28"],
    "daily_points": [2, 5, 1, 4, 3, 6, 2],
    "average_line": 3.29
  }
}
```

**字段说明**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| dates | Array<String> | 日期数组，格式：MM-DD |
| daily_points | Array<Number> | 每日加权积分（easy=1, medium=2, hard=3） |
| average_line | Number | 平均积分，用于图表中的平均线 |

**数据来源**:
- 从 `daily_logs` 表查询指定时间范围内的记录
- `daily_points` 字段直接对应 `daily_logs.daily_points`
- `dates` 从 `daily_logs.log_date` 格式化而来
- `average_line` = sum(daily_points) / range_days

**数据要求**:
- **日期连续性**: 必须确保日期连续，缺失日期的 daily_points 填充为 0
- **日期格式**:
  - `range_days=7` 或 `30`: 使用 `MM-DD` 格式（如 "03-22"）
  - `range_days=365`: 使用月份格式（如 "1月", "2月", ... "12月"）
- **排序**: 按日期升序排列（从早到晚）
- **数组长度**:
  - `range_days=7`: 返回 7 个数据点（每日数据）
  - `range_days=30`: 返回 30 个数据点（每日数据）
  - `range_days=365`: 返回 12 个数据点（**按月汇总**，提升性能和可读性）

**示例**:
```javascript
// 周报示例 (range_days=7) - 日期连续，包含0值
{
  "dates": ["03-21", "03-22", "03-23", "03-24", "03-25", "03-26", "03-27"],
  "daily_points": [2, 0, 3, 5, 1, 4, 2],  // 03-22 没刷题，填充0
  "average_line": 2.43
}

// 年报示例 (range_days=365) - 按月汇总
{
  "dates": ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  "daily_points": [45, 52, 38, 67, 71, 58, 64, 72, 69, 75, 80, 88],
  "average_line": 64.92
}

// ❌ 错误示例 - 日期不连续
{
  "dates": ["03-21", "03-23"],  // ❌ 缺少 03-22
  "daily_points": [2, 3]
}
```

**年报特殊处理说明**:
- 当 `range_days=365` 时，后端应按月汇总数据，而不是返回365条每日记录
- 计算方式：每个月的 daily_points = 该月所有 daily_logs 的 daily_points 之和
- 如果某月没有记录，该月的 daily_points 填充为 0

---

### 4. 获取难度分布数据
**用途**: 获取用户刷题难度分布，用于饼图展示

**接口地址**: `/api/v1/stats/distribution`

**请求方式**: `GET`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| openid | String | 是 | 微信用户唯一标识 |
| type | String | 否 | 统计类型，`MONTHLY`(本月新增) 或 `TOTAL`(累计)，默认TOTAL |

**请求示例**:
```http
GET /api/v1/stats/distribution?openid=oABC123&type=TOTAL
```

**成功响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "easy": 120,
    "medium": 100,
    "hard": 36
  }
}
```

**字段说明**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| easy | Number | 简单题数量 |
| medium | Number | 中等题数量 |
| hard | Number | 困难题数量 |

**数据来源**:
- `type=TOTAL`: 从 `daily_logs` 表最新记录获取 easy_count、medium_count、hard_count
- `type=MONTHLY`: 计算本月第一天和最新一天的 count 差值

---

## 数据处理说明

### 1. 时间范围参数对应关系

| range/range_days参数 | 说明 | 返回数据量 |
|-----------|------|---------------------|
| week / 7 | 过去7天 | 7条记录 |
| month / 30 | 过去30天 | 30条记录 |
| year / 365 | 过去365天 | 365条记录（或12条月度汇总） |

### 2. 难度统计说明

`difficulty` 对象中的数值根据 `type` 参数而定：

- `type=TOTAL`: 返回**累计总题数**（从 daily_logs 最新记录获取）
- `type=MONTHLY`: 返回**本月新增题数**（本月第一天和最新一天的差值）

---

## 前后端协作流程

### 阶段一：接口定义（第1-5天）
- [x] 前端C（Andy）：定义接口需求
- [ ] 后端B（Dennis）：确认接口可行性
- [ ] 双方：确认接口格式

### 阶段二：并行开发（第5-15天）
- [ ] 前端C：使用模拟数据开发页面
- [ ] 后端B：实现云函数接口

### 阶段三：联调测试（第15-20天）
1. 后端B提供测试环境地址
2. 前端C修改 `utils/api.js` 中的 `BASE_URL`
3. 前端C在 `pages/report/report.js` 中取消真实API调用的注释
4. 双方联调测试，修复问题

---

## 测试用例

### 测试场景1: 正常用户
**用户报告接口** (`/api/user/report`):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "totalSolved": 150,
    "consecutiveDays": 5,
    "difficulty": { "easy": 80, "medium": 50, "hard": 20 }
  }
}
```

**趋势数据接口** (`/api/v1/stats/trend?range_days=7`):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "dates": ["03-22", "03-23", "03-24", "03-25", "03-26", "03-27", "03-28"],
    "daily_points": [2, 3, 5, 4, 6, 3, 2],
    "average_line": 3.57
  }
}
```

### 测试场景2: 新用户（无历史）
**用户报告接口**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "totalSolved": 0,
    "consecutiveDays": 0,
    "difficulty": { "easy": 0, "medium": 0, "hard": 0 }
  }
}
```

**趋势数据接口**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "dates": ["03-22", "03-23", "03-24", "03-25", "03-26", "03-27", "03-28"],
    "daily_points": [0, 0, 0, 0, 0, 0, 0],
    "average_line": 0
  }
}
```

### 测试场景3: 断签用户
**用户报告接口**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "totalSolved": 200,
    "consecutiveDays": 2,
    "difficulty": { "easy": 100, "medium": 80, "hard": 20 }
  }
}
```

**趋势数据接口** (前5天有数据，中断3天后又刷了2天):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "dates": ["03-15", "03-16", "03-17", "03-18", "03-19", "03-20", "03-21"],
    "daily_points": [3, 2, 4, 5, 3, 0, 0],  // 03-20和03-21断签，填充0
    "average_line": 2.43
  }
}
```

---

## 常见问题

### Q1: 如果用户某天没刷题，daily_logs表需要插入记录吗？
**A**: 不需要。daily_logs 表只记录有刷题的日期。但是 `/api/v1/stats/trend` 接口返回时，需要填充缺失日期，将 daily_points 设为 0。

### Q2: consecutiveDays后端算还是前端算？
**A**: 建议后端计算并返回（基于 daily_logs 表），前端也有计算逻辑作为备用（在 `utils/dataHelper.js` 中）。

### Q3: 年报的趋势数据返回365条记录会不会太大？
**A**: 可以考虑按周或月汇总。具体方案可以讨论调整。建议：
- 7天：返回每日数据
- 30天：返回每日数据
- 365天：返回每周或每月汇总（12-15个数据点）

### Q4: LeetCode API有访问频率限制吗？
**A**: 有的，建议后端做缓存，避免频繁调用LeetCode官方API。

### Q5: 用户报告接口和趋势数据接口有什么区别？
**A**:
- `/api/user/report`: 返回用户基本统计信息（总题数、连续天数、难度分布），**不包含历史数据**
- `/api/v1/stats/trend`: 返回历史趋势数据（日期数组 + 积分数组），用于图表展示和连续天数计算

### Q6: 后端数据库结构是什么？
**A**:
- `users` 表：存储用户基本信息（openid, lc_id, total_solved, daily_steps, last_update）
- `daily_logs` 表：存储每日刷题记录（openid, log_date, total_solved, daily_steps, easy_count, medium_count, hard_count, daily_points, rank_tier）
- **不存在** `history_logs` 字段或数组

### Q7: daily_points 如何计算？
**A**: daily_points = (当日新增简单题 × 1) + (当日新增中等题 × 2) + (当日新增困难题 × 3)

