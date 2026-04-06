# Li-Le-Me (力了么) 项目规范 v1.0

## 📁 目录结构规范 (Directory Structure)
为了保证明天（4.5）顺利合并，请全体组员严格遵守以下路径：

### 1. 后端 (Backend - Dennis & Andy)
请在 `backend/src/main/java/com/lilema/` 下按功能建包，严禁在根目录散落文件：
- **`controller/`**: 仅存放接口定义。内部需按业务分包：
  - `admin/`: 管理员高级权限接口。
  - `user/`: 用户基础接口（登录、绑定 LC）。
  - `squad/`: 战队逻辑接口。
  - `rank/`: 排行榜与趋势图接口 (@Weixin Team)。
- **`service/`**: 存放核心业务逻辑。所有的计算（如 1:2:3 权重算法）、数据库操作、爬虫引擎逻辑必须写在 Service 及其实现类中。
- **`entity/`**: 存放数据库模型。
  - `po/`: Persistent Object，直接对应数据库表字段。
  - `dto/`: Data Transfer Object，用于接收前端传来的参数。
  - `vo/`: View Object，用于返回给前端展示，需过滤敏感信息（如 OpenID）。
- **`common/`**: 存放全局通用的 Result 统一返回类、自定义异常处理及 JWT 工具类。
- **`sql/`**: 存放数据库初始化脚本 `init.sql` (@Greg0n)。
### 2. 前端 (Frontend - Andy & Cici)
请在 `frontend/` 下按以下规范放置小程序原始代码，严禁在根目录散落文件：

- `pages/`: 存放所有页面文件夹。
  - `pages/index/`: 首页排行榜。
  - `pages/admin/`: 管理员后台页面 (Wendy 专项)。
  - `pages/registration/`: 绑定 LeetCode 页面。
- `components/`: 存放可复用的 UI 组件（如自定义的排名卡片、ECharts 图表封装）。
- `static/images/`: 存放项目所有的本地图标 (Icons)、Logo 及背景图片。
- `utils/`: 存放全局工具类。
  - `utils/request.js`: 封装好的网络请求拦截器（负责带上 Token）。
  - `utils/validate.js`: 包含 LeetCode ID 3-30位等正则校验逻辑。
- `app.json`: 小程序全局配置（页面路径、窗口表现、Tab 栏设置）。
---

## 🛠️ 提交规范 (Git Rules) - 必读
1. **禁止直推**：严禁直接 Push 到 `main` 分支。
2. **分支命名**：功能开发请使用 `feat-xxx`，修复 Bug 请使用 `fix-xxx`。
3. **合并流程**：
   - 提交代码前，请先 `git pull origin dev` 解决本地冲突。
   - 发起 Pull Request (PR) 后，由 Wendy (@hm37-blip) 进行 Review 后合并。
4. **命名一致性**：接口名必须严格遵守[API_Contract.md]中的定义。
