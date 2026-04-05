# Li-Le-Me (力了么) 项目规范 v1.0

## 📁 目录结构规范 (Directory Structure)
为了保证明天（4.5）顺利合并，请全体组员严格遵守以下路径：

### 1. 后端 (Backend - Dennis & Andy)
请在 `backend/src/main/java/com/lilema/` 下按功能建包：
- `controller/`: 仅存放接口定义 (分 admin/user/squad/rank 子包)
- `service/`: 存放核心业务逻辑 (所有的计算和数据库操作)
- `entity/`: 存放数据库模型 (DTO/VO)
- `common/`: 存放 Result 统一返回类和工具类

### 2. 前端 (Frontend - Cici)
请在 `frontend/` 下放置小程序原始代码：
- `pages/admin/`: 专门存放管理后台页面
- `utils/`: 存放封装好的请求拦截器

---

## 🛠️ 提交规范 (Git Rules) - 必读
1. **禁止直推**：严禁直接 Push 到 `main` 分支。
2. **分支命名**：功能开发请使用 `feat-xxx`，修复 Bug 请使用 `fix-xxx`。
3. **合并流程**：
   - 提交代码前，请先 `git pull origin dev` 解决本地冲突。
   - 发起 Pull Request (PR) 后，由 Wendy (@hm37-blip) 进行 Review 后合并。
4. **命名一致性**：接口名必须严格遵守[API_Contract.md]中的定义。
