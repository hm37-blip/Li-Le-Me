# 力了么 — 统计与分析模块（Data Analytics Module）

## 1. 模块定位
统计与分析模块的核心目标是：
让用户“看到自己的努力”

提供：
- 刷题趋势
- 难度分布
- 连续打卡
- 周/月/年报告

---

## 二、核心数据结构

```json
{
  "openid": "...",
  "lc_id": "...",
  "total_solved": 150,
  "daily_steps": 5,
  "history_logs": [...],
  "last_update": "2026-03-28"
}
```

---

## 三、history_logs设计

```json
[
  {
    "date": "2026-03-25",
    "total": 100,
    "daily_steps": 5
  }
]
```

---

## 四、接口设计

### 1. GetTrendData

请求：
```json
{
  "openid": "user_001",
  "range_days": 7
}
```

返回：
```json
{
  "code": 200,
  "data": {
    "dates": ["03-22","03-23"],
    "daily_steps": [2,5]
  }
}
```

用途：
1. 用于EChart
2. X轴：日期
3. y轴：每日刷题数

### 2. GetDifficultyDistribution

请求：
```json
{
  "openid": "user_001",
  "type": "MONTHLY"
}
```

返回：
```json
{
  "code": 200,
  "data": {
    "easy": 20,
    "medium": 35,
    "hard": 10
  }
}
```
| 功能 | 函数名 | 输入 (Input) | 输出 (Output) |
|------|--------|-------------|--------------|
| 趋势图表数据 | GetTrendData | openid (String), range_days (Int，默认7) | JSON（包含 dates[] + daily_points_change[]，用于折线图） |
| 难度分布数据 | GetDifficultyDistribution | openid (String) | JSON（包含 type：YEARLY（当年总计）或 MONTHLY（本月新增），以及难度分布数据） |

---

## 五、后端逻辑

趋势：
1. 查dates[]和daily_points_change[]
2. 截取N天
3. 查dates[]缺失天数，再daily_points_change[]中填入0防止折线图数据出错
4. 拆成数组

难度：
1. 调LeetCode
2. 统计easy/medium/hard

---

## 六、前端实现

使用 ECharts：

- 折线图：daily_steps
- 饼图：难度分布

---

## 七、总结

统计模块 = 数据 → 可视化
