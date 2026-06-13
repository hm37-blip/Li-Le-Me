# ECharts 组件

这个目录包含微信小程序版本的 ECharts 图表组件。

## 当前状态

`echarts.min.js` 已经包含在当前仓库中，路径为：

```text
frontend/components/ec-canvas/echarts.min.js
```

不需要再手动下载。当前文件大小约 1MB，对应 ECharts 5.x。

## 文件说明

| 文件 | 说明 |
|------|------|
| `ec-canvas.js` | ECharts 小程序组件逻辑 |
| `ec-canvas.json` | 组件配置 |
| `ec-canvas.wxml` | 组件模板 |
| `ec-canvas.wxss` | 组件样式 |
| `echarts.min.js` | ECharts 核心库 |
| `README.md` | 本说明文档 |

## 使用方法

页面 JSON 中引用组件：

```json
{
  "usingComponents": {
    "ec-canvas": "/components/ec-canvas/ec-canvas"
  }
}
```

WXML 中使用：

```html
<ec-canvas id="myChart" canvas-id="myChart" ec="{{ ec }}"></ec-canvas>
```

当前战报页已经使用该组件：

```text
frontend/pages/index/report/
```

## 常见问题

### 图表不显示

检查：

- 微信开发者工具打开的是 `frontend/` 目录
- 基础库版本 >= 2.9.0
- 页面 JSON 中组件路径为 `/components/ec-canvas/ec-canvas`
- 控制台没有 canvas 或 ECharts 初始化错误

### 可以替换 ECharts 版本吗

可以，但建议保持 ECharts 5.x。替换后需要重新验证折线图、饼图和触摸交互。

## 参考链接

- [ECharts 官网](https://echarts.apache.org/zh/index.html)
- [ECharts for 微信小程序](https://github.com/ecomfe/echarts-for-weixin)
- [微信小程序 Canvas 2D 文档](https://developers.weixin.qq.com/miniprogram/dev/component/canvas.html)
