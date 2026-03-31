# API接口文档 - F4个人报告功能

## 概述
本文档定义F4个人报告功能需要的API接口。由后端B（杜雨泽Dennis）负责实现。

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

**请求示例**:
```http
GET /api/user/report?lcId=example_user&range=week
```

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
    },
    "historyLogs": [
      { "date": "2026-03-21", "count": 2 },
      { "date": "2026-03-22", "count": 3 },
      { "date": "2026-03-23", "count": 1 },
      { "date": "2026-03-24", "count": 5 },
      { "date": "2026-03-25", "count": 2 },
      { "date": "2026-03-26", "count": 4 },
      { "date": "2026-03-27", "count": 3 }
    ]
  }
}
```

**字段说明**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| totalSolved | Number | 截止目前的总刷题数 |
| consecutiveDays | Number | 连续打卡天数（可选，前端也会计算） |
| difficulty.easy | Number | 简单题数量 |
| difficulty.medium | Number | 中等题数量 |
| difficulty.hard | Number | 困难题数量 |
| historyLogs | Array | 历史记录数组 |
| historyLogs[].date | String | 日期，格式：YYYY-MM-DD |
| historyLogs[].count | Number | 当日新增题数 |

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

## 数据处理说明

### 1. 时间范围参数对应关系

| range参数 | 说明 | historyLogs数组长度 |
|-----------|------|---------------------|
| week | 过去7天 | 7条记录 |
| month | 过去30天 | 30条记录 |
| year | 过去365天 | 365条记录（或12条月度汇总） |

### 2. historyLogs数据要求

- **日期连续性**: 请确保日期是连续的，即使某天count为0也要包含该日期
- **日期格式**: 统一使用 `YYYY-MM-DD` 格式
- **排序**: 按日期升序排列（从早到晚）
- **count计算**: count表示当日新增题数，即 `当日总数 - 前一日总数`

**示例**:
```javascript
// 正确示例 - 日期连续
[
  { "date": "2026-03-21", "count": 2 },
  { "date": "2026-03-22", "count": 0 },  // 没刷题也要有记录
  { "date": "2026-03-23", "count": 3 }
]

// 错误示例 - 日期不连续
[
  { "date": "2026-03-21", "count": 2 },
  // 缺少 03-22
  { "date": "2026-03-23", "count": 3 }
]
```

### 3. 难度统计说明

`difficulty` 对象中的数值应该是**该时间范围内完成的题目统计**，不是总题数。

例如：
- `range=week` 时，返回过去7天完成的简单/中等/困难题数
- `range=year` 时，返回过去一年完成的简单/中等/困难题数

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

### 测试数据1: 正常用户
```json
{
  "lcId": "test_user_1",
  "totalSolved": 150,
  "consecutiveDays": 5,
  "difficulty": { "easy": 80, "medium": 50, "hard": 20 },
  "historyLogs": [/* 7天连续数据 */]
}
```

### 测试数据2: 新用户（无历史）
```json
{
  "lcId": "test_user_new",
  "totalSolved": 0,
  "consecutiveDays": 0,
  "difficulty": { "easy": 0, "medium": 0, "hard": 0 },
  "historyLogs": []
}
```

### 测试数据3: 断签用户
```json
{
  "lcId": "test_user_break",
  "totalSolved": 200,
  "consecutiveDays": 2,  // 前5天有数据，中断3天后又刷了2天
  "difficulty": { "easy": 100, "medium": 80, "hard": 20 },
  "historyLogs": [/* 包含count为0的日期 */]
}
```

---

## 常见问题

### Q1: 如果用户某天没刷题，historyLogs要不要包含这一天？
**A**: 要包含，count设为0。这样前端图表才能正确显示。

### Q2: consecutiveDays后端算还是前端算？
**A**: 建议后端计算并返回，前端也有计算逻辑作为备用（在 `utils/dataHelper.js` 中）。

### Q3: 年报的historyLogs返回365条记录会不会太大？
**A**: 可以考虑按周或月汇总。具体方案可以讨论调整。

### Q4: LeetCode API有访问频率限制吗？
**A**: 有的，建议后端做缓存，避免频繁调用LeetCode官方API。

---

## 联系方式

- **前端负责人**: 姜灵晔 Andy (C)
- **后端负责人**: 杜雨泽 Dennis (B)
- **项目经理**: Wendy (Product Lead), KJ (Tech Lead)

**每周日晚7点**: 微信群同步进度
