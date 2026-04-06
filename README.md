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

## 二、后端数据库结构

### users 表
```json
{
  "id": "BIGINT (PK, AUTO_INCREMENT)",
  "openid": "VARCHAR(128) UNIQUE - 微信用户唯一标识",
  "lc_id": "VARCHAR(64) - LeetCode 账号名",
  "total_solved": "INT - 截止目前的总刷题数",
  "daily_steps": "INT - 今日新增题数",
  "last_update": "DATETIME - 上次抓取数据的时间"
}
```

### daily_logs 表
```json
{
  "id": "BIGINT (PK, AUTO_INCREMENT)",
  "openid": "VARCHAR(128) - 关联用户",
  "log_date": "DATE - 记录日期",
  "total_solved": "INT - 当日截止总题数",
  "daily_steps": "INT - 当日新增题数",
  "easy_count": "INT - 简单题累计数",
  "medium_count": "INT - 中等题累计数",
  "hard_count": "INT - 困难题累计数",
  "daily_points": "INT - 当日加权积分 (easy×1 + medium×2 + hard×3)",
  "created_at": "DATETIME - 记录创建时间",
  "rank_tier": "VARCHAR(16) - 等级标签"
}
```

**注意**: 后端**不会**在用户接口中返回 history_logs 数组。历史数据通过独立的趋势数据接口获取。

---

## 三、接口设计

### 主要接口

| 接口 | 路径 | 用途 |
|------|------|------|
| 趋势数据 | `/api/v1/stats/trend` | 获取7天或30天累计积分增长趋势（折线图数据） |
| 难度分布 | `/api/v1/stats/distribution` | 获取难度分布（饼图数据，TOTAL=累计/MONTHLY=本月） |
| 分享海报 | `/api/v1/stats/poster` | 获取分享海报完整JSON数据 |

### 1. 趋势数据接口 (GetTrendData)

**路径**: `/api/v1/stats/trend`
**方法**: `GET`
**描述**: 检索 7 天或 30 天的累计点数增长趋势

**请求参数**:
- `openid` (String): 微信用户唯一标识
- `range_days` (Int): 时间范围天数，默认 7

**请求示例**: `GET /api/v1/stats/trend?openid=xxx&range_days=7`

**返回格式**:
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
- `dates`: X轴日期数组，格式 "MM-DD"
- `daily_points`: Y轴每日加权积分（必须应用 1:2:3 权重）
- `average_line`: 期间每日平均分数（用于绘制基线）

### 2. 难度分布接口 (GetDifficultyDistribution)

**路径**: `/api/v1/stats/distribution`
**方法**: `GET`
**描述**: 检索练习题的难度分布（饼图数据）

**请求参数**:
- `openid` (String): 微信用户唯一标识
- `type` (String): `TOTAL`(累计总题数) 或 `MONTHLY`(本月新增题数)

**请求示例**: `GET /api/v1/stats/distribution?openid=xxx&type=TOTAL`

**返回格式**:
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
- `easy`: 简单题数量
- `medium`: 中等题数量
- `hard`: 困难题数量

### 3. 分享海报接口 (GetSharePoster)

**路径**: `/api/v1/stats/poster`
**方法**: `GET`
**描述**: 返回生成海报所需的完整 JSON 数据

**请求参数**:
- `openid` (String): 微信用户唯一标识

**请求示例**: `GET /api/v1/stats/poster?openid=xxx`

**返回格式**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "poster_url": "cloud://xxx.png",
    "rank_tier": "Top Tier",
    "motto": "Stay hungry, Stay foolish"
  }
}
```

**字段说明**:
- `poster_url`: 预生成海报图像的云端路径
- `rank_tier`: 等级标签 (Hardcore/Top Tier/Elite/NPC/Completed)
- `motto`: 随机励志名言

---

## 四、前端实现

### ECharts 图表
- **折线图**: 使用 `/api/v1/stats/trend` 返回的 dates 和 daily_points
- **饼图**: 使用 `/api/v1/stats/distribution` 返回的 easy/medium/hard

### 数据计算
- **总题数**: 从 `/api/v1/stats/distribution?type=TOTAL` 计算 easy + medium + hard
- **连续天数**: 前端基于 `/api/v1/stats/trend?range_days=365` 返回的 daily_points 计算连续天数
- **本周/本月积分**: 对 daily_points 数组求和

---

## 六、总结

统计模块 = 后端数据库 (users + daily_logs) → API 接口 → 前端可视化

---

## 七、项目文档索引

### 📚 开发文档

#### 1. [API接口文档](docs/API接口文档.md)
- **用途**: 后端 API 接口完整定义
- **内容**:
  - 接口地址和请求方式
  - 请求参数和响应格式
  - 数据处理要求（日期连续性、格式等）
  - 测试用例
  - 前后端协作流程
- **适用人群**: 后端开发者 (Dennis)、前端对接开发者

#### 2. [快速上手指南](docs/快速上手指南.md)
- **用途**: 开发者快速启动项目
- **内容**:
  - ECharts 下载和配置步骤
  - 微信开发者工具设置
  - 代码结构说明
  - 图表配置详解
  - API 对接步骤
  - 常见问题和调试技巧
- **适用人群**: 新加入的开发者、需要了解项目的团队成员

#### 3. [项目交付文档](docs/项目交付文档.md)
- **用途**: 项目交付说明和验收标准
- **内容**:
  - 交付内容清单（页面、组件、工具函数）
  - 文件清单和代码统计
  - 技术实现细节（ECharts 配置）
  - API 对接状态
  - 测试清单
  - 已知问题和后续工作
- **适用人群**: 项目经理 (Wendy, KJ)、验收人员

#### 4. [Token 鉴权使用指南](utils/auth-usage-example.md)
- **用途**: Token 认证体系使用说明
- **内容**:
  - 登录和保存 Token
  - 发送认证请求
  - 检查登录状态
  - Token 刷新流程
  - 后端 API 规范
  - 调试技巧
- **适用人群**: 所有开发者

#### 5. [图表组件问题排查指南](TROUBLESHOOTING.md)
- **用途**: 常见问题诊断和解决
- **内容**:
  - 组件未注入问题
  - 图表不显示问题
  - Canvas 相关问题
  - 清除缓存步骤
  - 进阶调试技巧
- **适用人群**: 遇到问题的开发者

---

## 八、当前开发状态

### API 调用情况检查 (截至最新)

| 模块 | 文件路径 | API引入 | API使用 | 状态 | 说明 |
|------|----------|---------|---------|------|------|
| **Home** | `pages/home/home.js` | ❌ | ❌ | 使用静态数据 | 有预留的 `fetchLeaderboard()` 方法但未实现 |
| **Profile** | `pages/profile/profile.js` | ✅ | ❌ | 本地存储 | 引入了 api.js 但所有功能都是本地实现 |
| **Report** | `pages/report/report.js` | ✅ | ⚠️ | Mock 模式 | API 逻辑已就绪，`USE_MOCK_DATA = true` |

### Report 模块 API 集成详情

**已集成的 API 调用**:
- `api.getTrendData()` - 获取趋势数据 (report.js:443, 485, 527)
- `api.getDifficultyDistribution()` - 获取难度分布 (report.js:563, 602)

**切换到真实 API 的步骤**:
1. 修改 `utils/api.js` 第 9 行的 `BASE_URL` 为实际后端地址
2. 修改 `pages/report/report.js` 第 6 行：`const USE_MOCK_DATA = false`

### Profile 模块待实现的 API

**需要取消注释的 API 调用**:
- `api.validateLeetCodeId()` - 验证 LeetCode ID (profile.js:114)
- `api.bindLeetCodeAccount()` - 绑定账号 (profile.js:115)
- `api.unbindLeetCodeAccount()` - 解绑账号 (profile.js:167)

### Home 模块待实现的功能

**需要实现**:
- `fetchLeaderboard()` 方法 (home.js:56-59)
- 调用 `api.getRankingList()` 获取排行榜数据

---

## 九、下一步工作

### 短期任务
1. [ ] 配置后端 API 地址（`utils/api.js` BASE_URL）
2. [ ] Report 模块切换到真实 API（`USE_MOCK_DATA = false`）
3. [ ] 实现 Profile 模块的 API 调用
4. [ ] 实现 Home 模块的排行榜 API 调用
5. [ ] 真机测试

### 中期任务
1. [ ] 完善错误处理和加载状态
2. [ ] 添加数据缓存策略
3. [ ] 优化性能和用户体验
4. [ ] 补充单元测试

---

## 十、快速参考

### 启动项目
```bash
# 1. 下载 ECharts
cd components/ec-canvas
curl -L -o echarts.min.js https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js

# 2. 在微信开发者工具中打开项目
# 3. 编译运行
```

### 配置 API
```javascript
// utils/api.js
const BASE_URL = 'https://your-backend-url.com'  // 修改这里

// pages/report/report.js
const USE_MOCK_DATA = false  // 切换到真实 API
```

### 检查 Token
```javascript
const api = require('../../utils/api.js')
console.log('Token:', api.auth.getToken())
console.log('已登录?', api.auth.isLoggedIn())
console.log('Token过期?', api.auth.isTokenExpired())
```


