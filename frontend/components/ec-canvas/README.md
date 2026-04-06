# ECharts 组件

这个目录包含了微信小程序版本的 ECharts 图表组件。

## ⚠️ 重要：下载 echarts.min.js

**echarts.min.js 文件由于太大（约800KB），未包含在Git仓库中。**

你需要手动下载这个文件才能使用图表功能。

### 下载方法

#### 方式一：使用命令行（推荐）

在项目根目录执行：

```bash
cd components/ec-canvas

# 使用 curl 下载
curl -L -o echarts.min.js https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js

# 或使用 wget
wget -O echarts.min.js https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js
```

#### 方式二：手动下载

1. 访问 ECharts 官方 GitHub：
   https://github.com/apache/echarts/releases

2. 下载最新版本的 `echarts.min.js`

3. 将文件放到当前目录（`components/ec-canvas/`）

#### 方式三：使用 CDN 链接（备选）

如果上面的方法都不行，可以访问：
- https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js
- 在浏览器中打开，复制全部内容
- 创建 `echarts.min.js` 文件并粘贴内容

### 验证下载成功

确保文件存在：
```
components/ec-canvas/echarts.min.js
```

文件大小应该在 **800KB - 1MB** 左右。

### 文件说明

| 文件 | 说明 | 是否需要下载 |
|------|------|--------------|
| ec-canvas.js | ECharts 组件逻辑 | ❌ 已包含 |
| ec-canvas.json | 组件配置 | ❌ 已包含 |
| ec-canvas.wxml | 组件模板 | ❌ 已包含 |
| ec-canvas.wxss | 组件样式 | ❌ 已包含 |
| echarts.min.js | ECharts 核心库 | ✅ **需要下载** |
| README.md | 本说明文档 | ❌ 已包含 |

## 使用方法

下载完成后，在页面中引用组件：

```json
{
  "usingComponents": {
    "ec-canvas": "/components/ec-canvas/ec-canvas"
  }
}
```

然后在 WXML 中使用：

```html
<ec-canvas id="myChart" canvas-id="myChart" ec="{{ ec }}"></ec-canvas>
```

详细使用方法请参考项目根目录的 `README.md` 和 `docs/快速上手指南.md`。

## 常见问题

### Q: 为什么不把 echarts.min.js 放在 Git 里？

A: 因为文件太大（~1MB），会让 Git 仓库变得很臃肿。而且这个文件是第三方库，通常不应该提交到版本控制中。

### Q: 下载后还是报错？

A: 检查：
1. 文件路径是否正确：`components/ec-canvas/echarts.min.js`
2. 文件大小是否正常（不应该是0KB）
3. 微信开发者工具的基础库版本是否 >= 2.9.0

### Q: 可以使用其他版本的 ECharts 吗？

A: 可以，但建议使用 5.x 版本。如果使用其他版本，可能需要调整部分配置。

## 版本信息

- **推荐 ECharts 版本**: 5.4.3
- **支持的微信基础库**: >= 2.9.0（推荐）或 >= 1.9.91（兼容模式）

## 参考链接

- [ECharts 官网](https://echarts.apache.org/zh/index.html)
- [ECharts for 微信小程序](https://github.com/ecomfe/echarts-for-weixin)
- [微信小程序 Canvas 2D 文档](https://developers.weixin.qq.com/miniprogram/dev/component/canvas.html)
