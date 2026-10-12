# 📂 力了么 (Li-Le-Me) 后端目录结构规范

为了保持代码的整洁、可可读性和稳定性，请所有后端开发人员遵守以下目录结构进行上传。禁止在根目录下随意创建文件夹。

## 🌲 目录树结构

```text
backend/
├── pom.xml                  # Maven 项目配置文件 (定义依赖和版本)
├── sql/                     # 存放数据库初始化脚本
│   └── init.sql             # 数据库表结构及初始数据 (Dennis 提供)
└── src/
    └── main/
        ├── java/com/lilema/  # Java 源代码根目录
        │   ├── common/      # 公共模块 (跨领域复用)
        │   │   ├── config/  # 全局配置类 (如 Swagger, MVC, Redis)
        │   │   ├── exception/# 全局异常处理 (GlobalExceptionHandler)
        │   │   ├── result/  # 统一返回结果封装 (Result.java, CodeEnum.java)
        │   │   └── utils/   # 工具类 (JwtUtils, RedisUtils, RegExUtils)
        │   ├── controller/  # 控制层 (接收请求，参数校验，不写业务逻辑)
        │   │   ├── admin/   # 管理员相关接口
        │   │   ├── rank/    # 排行榜与趋势图接口 (@Andy)
        │   │   ├── squad/   # 战队相关接口
        │   │   └── user/    # 用户基础接口 (登录、绑定 LC)
        │   ├── entity/      # 数据模型层
        │   │   ├── dto/     # Data Transfer Object (接收前端参数用)
        │   │   ├── po/      # Persistent Object (与数据库表一一对应)
        │   │   └── vo/      # View Object (返回给前端展示用，隔离敏感数据)
        │   ├── mapper/      # DAO层 (MyBatis Mapper 接口，负责数据库交互)
        │   ├── service/     # 业务逻辑层 (核心计算、事务管理均在此处)
        │   │   ├── impl/    # Service 接口实现类
        │   │   └── IUserService.java # Service 接口定义
        │   └── job/         # 定时任务层 (LeetCode 数据抓取引擎 @Dennis)
        └── resources/       # 资源配置文件
            ├── application.yml      # 主配置文件
            ├── application-dev.yml  # 本地开发环境配置 (Git已忽略)
            └── mapper/              # MyBatis XML 映射文件

### 自有服务器头像上传

`POST /api/user/avatar` 接收 multipart 字段 `file` 和 `openid`，使用 Bearer Token 鉴权，返回 `data.avatar_url`。前端随后使用资料/入队接口保存该 URL。图片通过 `/uploads/avatars/**` 公开访问，支持 PNG/JPG，上传限制 5MB。

部署时将 `AVATAR_UPLOAD_DIR` 设置为持久化可写目录；容器需挂载数据卷。反向代理需将 `/api/` 与 `/uploads/avatars/` 转发至后端，并允许至少 6MB 的请求体。微信公众平台 uploadFile 合法域名需加入 `https://www.uiuccesa.com`。
