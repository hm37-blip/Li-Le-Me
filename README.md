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

---

## 八、项目文档索引

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

## 九、当前开发状态

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

## 十、下一步工作

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

## 十一、快速参考

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


