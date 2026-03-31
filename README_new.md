# LeetCode步数 - 个人报告功能 (F4)

## 项目简介
这是一个微信小程序，用于展示LeetCode刷题的个人报告，包括：
- 7天刷题增量折线图
- 题目难度分布饼图
- 连续打卡天数显示

## 技术栈
- 微信小程序原生框架
- ECharts 图表库（echarts-for-weixin）

## 快速开始

### 1. 安装 ECharts 图表库

**重要**：需要手动下载 `echarts.min.js` 文件

1. 访问 [ECharts for 微信小程序 GitHub](https://github.com/ecomfe/echarts-for-weixin)
2. 下载最新版本的 `echarts.min.js` 文件
3. 将文件放置到 `/components/ec-canvas/echarts.min.js`

**或者直接下载（推荐）**：
```bash
cd components/ec-canvas
wget https://github.com/apache/echarts/releases/download/5.4.3/echarts.min.js
```

### 2. 目录结构
```
├── app.js                      # 小程序入口文件
├── app.json                    # 小程序配置
├── app.wxss                    # 全局样式
├── sitemap.json               # 站点地图配置
├── package.json               # 项目配置
├── components/                 # 组件目录
│   └── ec-canvas/             # ECharts图表组件
│       ├── ec-canvas.js       # 组件逻辑
│       ├── ec-canvas.json     # 组件配置
│       ├── ec-canvas.wxml     # 组件结构
│       ├── ec-canvas.wxss     # 组件样式
│       └── echarts.min.js     # ECharts核心库（需要手动下载）
├── utils/                      # 工具函数目录
│   ├── api.js                 # API接口封装
│   └── dataHelper.js          # 数据处理工具
├── docs/                       # 文档目录
│   └── API接口文档.md         # API接口文档
└── pages/
    └── report/                # 个人报告页面
        ├── report.js          # 页面逻辑
        ├── report.json        # 页面配置
        ├── report.wxml        # 页面结构
        └── report.wxss        # 页面样式
```

### 3. 配置说明

#### 颜色规范
- LeetCode橙：`#FFA116`
- 深灰：`#282828`
- 简单题绿：`#91CB74`
- 中等题橙：`#FFA116`
- 困难题红：`#EF4743`

#### 字体规范
- 标题：16px
- 正文：14px
- 标注：12px

## 核心功能实现

### 1. 折线图 - 刷题趋势
使用 ECharts 折线图（带面积填充）显示过去7天/30天/一年的每日新增题目数。

**ECharts配置特性：**
- 渐变色面积填充
- 数据点高亮显示
- 触摸交互支持
- 虚线网格背景

**数据格式：**
```javascript
// 传入 updateLineChart 方法的格式
historyLogs = [
  { date: '2026-03-21', count: 2 },
  { date: '2026-03-22', count: 3 },
  ...
]
```

### 2. 饼图（环形图）- 难度分布
使用 ECharts 环形图显示不同难度题目的占比。

**ECharts配置特性：**
- 环形图展示（中空设计）
- 右侧图例带百分比
- 触摸高亮效果
- 三种难度不同配色

**数据格式：**
```javascript
// 传入 updatePieChart 方法的格式
difficulty = {
  easy: 120,
  medium: 100,
  hard: 36
}
```

### 3. 连续打卡天数
显示用户连续刷题的天数。

## API接口对接

### 所需接口（由后端B提供）

#### 1. 获取用户报告数据
```
GET /api/user/report?lcId={lcId}&range={week|month|year}

Response:
{
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
    ...
  ]
}
```

### 数据对接步骤
1. 等待B在第5天前提供API接口文档
2. 在 `pages/report/report.js` 的 `loadUserData()` 方法中：
   - 替换 `getMockData()` 为真实的 `wx.request()` 调用
   - 根据B提供的接口格式调整数据处理逻辑

## 开发进度

- [x] 创建小程序基础结构
- [x] 设计个人报告页面布局
- [x] 集成 ECharts 图表组件
- [x] 实现折线图（带渐变面积填充）
- [x] 实现环形饼图（难度分布）
- [x] 实现连续打卡显示
- [x] 实现时间维度切换（周/月/年）
- [x] 创建数据处理工具函数
- [x] 创建API接口封装
- [ ] 下载 echarts.min.js 文件
- [ ] API接口对接（等待B提供接口）
- [ ] 真实数据测试

## 注意事项

1. **ECharts核心文件必须手动下载**：
   - 下载 `echarts.min.js` 并放到 `/components/ec-canvas/echarts.min.js`
   - 否则图表无法正常显示
   - 下载链接：https://github.com/apache/echarts/releases

2. **模拟数据**：
   - 当前使用模拟数据进行开发
   - 等待后端B提供API接口后进行对接
   - API对接代码已准备好，只需取消注释

3. **Canvas 2D**：
   - 使用了新版Canvas 2D渲染，性能更好
   - 要求微信基础库 >= 2.9.0
   - 自动降级到旧版Canvas（基础库 >= 1.9.91）

4. **时间维度切换**：
   - 支持周报（7天）、月报（30天）、年报（365天）
   - 需要后端API支持对应的时间范围参数

5. **图表交互**：
   - 支持触摸查看详细数据（Tooltip）
   - 饼图点击可高亮选中项
   - 响应式设计，自适应屏幕尺寸

## 测试方法

1. **下载 ECharts 核心文件**（必须完成）：
   ```bash
   cd components/ec-canvas
   # 方式1: 使用 wget
   wget https://github.com/apache/echarts/releases/download/5.4.3/echarts.min.js

   # 方式2: 使用 curl
   curl -L -o echarts.min.js https://github.com/apache/echarts/releases/download/5.4.3/echarts.min.js
   ```

2. 在微信开发者工具中打开项目

3. 确保基础库版本 >= 2.9.0（在右上角"详情" -> "本地设置"中查看）

4. 直接预览 `pages/report/report` 页面

5. 测试功能：
   - 查看折线图和饼图是否正常渲染
   - 触摸图表查看 Tooltip
   - 切换时间维度（周/月/年）
   - 查看连续打卡天数显示

## 下一步工作

### 立即需要做的：
1. ✅ 下载 echarts.min.js 文件到正确位置
2. ✅ 在微信开发者工具中预览效果
3. ✅ 调整图表样式（如有需要）

### 等待B提供API后：
4. 修改 `utils/api.js` 中的 `BASE_URL`
5. 在 `pages/report/report.js` 中取消真实API调用的注释
6. 注释掉模拟数据部分
7. 进行联调测试

### 测试边界情况：
- 无数据情况（新用户）
- 数据量大情况（刷题很多的用户）
- 断签情况（中间有几天没刷题）
- 时间维度切换是否流畅
