# 图表组件问题排查指南

## 问题：组件没有注入

### ✅ 已确认的配置

1. **pages/report/report.json** - 组件已注册
```json
{
  "usingComponents": {
    "ec-canvas": "/components/ec-canvas/ec-canvas"
  }
}
```

2. **组件文件完整性** - 所有文件都存在
- ✅ ec-canvas.js
- ✅ ec-canvas.json
- ✅ ec-canvas.wxml
- ✅ ec-canvas.wxss
- ✅ echarts.min.js

### 🔧 解决步骤

#### 步骤 1：清除缓存并重新编译
1. 在微信开发者工具中，点击菜单栏 **"工具"** → **"清除缓存"**
2. 选择 **"清除全部缓存"**
3. 关闭微信开发者工具
4. 重新打开项目

#### 步骤 2：检查基础库版本
1. 在微信开发者工具右上角，点击 **"详情"**
2. 在 **"本地设置"** 中，检查 **"调试基础库"** 版本
3. 建议使用 **2.9.0** 或更高版本
4. 如果版本过低，切换到更高版本

#### 步骤 3：检查编译模式
1. 点击工具栏的 **"编译"** 按钮旁边的下拉箭头
2. 确认使用 **"普通编译"** 模式
3. 不要使用 "真机调试" 或其他特殊模式

#### 步骤 4：检查控制台错误
打开 **"调试器"** → **"Console"** 标签页，查看是否有以下错误：

**可能的错误 1：Component is not found**
```
Error: Component is not found in path "components/ec-canvas/ec-canvas"
```
**解决方案**：检查组件路径是否正确，应该是 `/components/ec-canvas/ec-canvas`

**可能的错误 2：echarts is not defined**
```
ReferenceError: echarts is not defined
```
**解决方案**：确认 echarts.min.js 文件存在且大小正常（约1MB）

**可能的错误 3：canvas-id 重复**
```
Error: Duplicate canvas-id
```
**解决方案**：检查每个 ec-canvas 的 canvas-id 是否唯一

#### 步骤 5：验证数据加载
在控制台应该看到以下输出：
```
=== 页面 onLoad ===
=== 周折线图 onInit 被调用 ===
=== 月折线图 onInit 被调用 ===
=== 年折线图 onInit 被调用 ===
=== 月饼图 onInit 被调用 ===
=== 年饼图 onInit 被调用 ===
周趋势数据: {dates: Array(7), daily_points_change: Array(7)}
月趋势数据: {dates: Array(15), daily_points_change: Array(15)}
年趋势数据: {dates: Array(12), daily_points_change: Array(12)}
```

### 🚀 快速测试

#### 测试 1：验证组件是否加载
在 `pages/report/report.js` 的 `onLoad` 方法最后添加：
```javascript
console.log('测试：组件配置', this.data.ecWeek ? '✅ 周折线图配置存在' : '❌ 周折线图配置缺失')
```

#### 测试 2：验证模拟数据
在控制台执行：
```javascript
const mockData = require('../../utils/mockData.js')
console.log('测试数据:', mockData.generateWeekTrendData())
```

### 📋 当前页面中的图表列表

| 图表ID | canvas-id | 类型 | 数据源 |
|--------|-----------|------|--------|
| weekChart | weekChart | 折线图 | 周积分趋势（7天） |
| monthChart | monthChart | 折线图 | 月积分趋势（30天） |
| yearChart | yearChart | 折线图 | 年积分趋势（12月） |
| monthPieChart | monthPieChart | 饼图 | 本月难度分布 |
| yearPieChart | yearPieChart | 饼图 | 年度难度分布 |

### ⚠️ 常见问题

#### Q1: 图表显示空白
**原因**：Canvas尺寸为0或数据未加载
**解决**：
- 检查 `.chart-container` 样式中的 `height: 400rpx` 是否生效
- 确认数据已成功加载（查看控制台日志）

#### Q2: 图表显示但没有数据
**原因**：图表实例为 null 或数据格式不正确
**解决**：
- 检查 `USE_MOCK_DATA` 是否为 `true`
- 确认模拟数据生成函数正常工作

#### Q3: 某个图表不显示，其他正常
**原因**：特定图表的 onInit 未被调用
**解决**：
- 检查 WXML 中对应的 `<ec-canvas>` 标签是否存在
- 确认 canvas-id 和数据绑定是否正确

### 🔍 进阶调试

如果以上步骤都无效，执行以下诊断：

1. **检查组件注册**
   在 `pages/report/report.js` 开头添加：
   ```javascript
   console.log('当前页面:', getCurrentPages()[getCurrentPages().length - 1].route)
   ```

2. **检查 ECharts 版本**
   在控制台执行：
   ```javascript
   const echarts = require('../../components/ec-canvas/echarts.min.js')
   console.log('ECharts版本:', echarts.version)
   ```

3. **检查 Canvas API 支持**
   在 `ec-canvas.js` 的 `attached` 方法中添加：
   ```javascript
   console.log('Canvas 2D API 支持:', !!wx.createSelectorQuery)
   ```

### 📞 如果问题仍未解决

请提供以下信息：
1. 微信开发者工具版本号
2. 调试基础库版本号
3. 控制台完整错误日志
4. 是否所有图表都不显示，还是只有部分不显示
