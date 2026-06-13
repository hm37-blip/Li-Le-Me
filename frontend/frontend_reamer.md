# 📂 力了么 (Li-Le-Me) 前端目录结构规范

为了保证小程序性能和多人协作的开发效率，请前端开发人员（@Aandy, @Cici）严格遵守以下目录规范。

## 🌲 目录树结构

```text
frontend/
├── app.js                   # 小程序逻辑 (全局生命周期、openid 获取)
├── app.json                 # 小程序公共配置 (页面路径、Tab栏设置)
├── app.wxss                 # 全局样式表 (定义主题色、通用 Margin/Padding)
├── project.config.json      # 项目配置文件 (个人开发者设置请勿上传)
├── sitemap.json             # 页面收录配置
├── components/              # 自定义组件 (可复用的 UI 模块)
│   ├── rank-item/           # 排行榜单行组件
│   └── ec-canvas/           # ECharts 图表组件库
├── pages/                   # 页面文件夹 (每个页面一个文件夹)
│   ├── index/               # 首页：排行榜预览 (@Andy)
│   ├── login/               # 登录/启动页 (@Cici)
│   ├── registration/        # 绑定 LeetCode 页面 (@Cici)
│   ├── squad/               # 战队/邀请码页面
│   ├── admin/               # 管理员后台 (Week 2 重点)
│   └── user/                # 个人中心 & 趋势图展示
├── static/                  # 静态资源 (禁止散落在 pages 文件夹)
│   ├── images/              # 图标、背景图、Logo
│   └── styles/              # 外部引入的 CSS 库
└── utils/                   # 工具类 (逻辑封装)
    ├── api.js               # 统一 API 封装、Token 刷新和重试
    ├── auth.js              # 登录态、access token 和 refresh token 存储
    └── mockData.js          # 本地演示/兜底数据
