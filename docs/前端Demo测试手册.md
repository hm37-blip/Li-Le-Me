# 前端 Demo 测试手册

本文用于验证小程序前端能通过已部署后端跑通主要页面流程。

## 1. 当前联调方式

前端当前使用公网 HTTPS 域名访问后端，配置文件为：

```text
frontend/config/env.js
```

关键配置：

```js
mode: 'domain',
serverDomain: 'https://springboot-oaqh-276913-9-1449352769.sh.run.tcloudbase.com'
```

这套配置用于 demo 联调。云托管默认域名仅适合测试，不建议作为正式上线方案。

## 2. 微信开发者工具设置

打开微信开发者工具后：

1. 导入项目目录：

```text
frontend/
```

2. 点击右上角 `详情`。
3. 进入 `本地设置`。
4. 勾选：

```text
不校验合法域名、web-view、TLS版本以及HTTPS证书
```

5. 点击 `编译`。

说明：当前后端域名是云托管测试域名，demo 阶段建议用开发者工具关闭域名校验来测试。真机体验版或正式版仍需要配置合法 request 域名或改用正式域名。

## 3. 测试前清理状态

为了避免旧 token、旧 openid 影响测试，建议先清理缓存：

1. 微信开发者工具顶部菜单选择 `清缓存`。
2. 选择：

```text
清除数据缓存
```

3. 重新编译小程序。

## 4. 普通用户主流程

### 4.1 登录

入口页面：

```text
pages/login/login
```

操作：

1. 点击微信登录按钮。
2. 预期进入注册流程页面。

预期结果：

- 登录请求成功。
- 本地 storage 中写入：
  - `openid`
  - `auth_token`
  - `refresh_token`
  - `registration_status`

如果登录失败：

- 看控制台是否有网络请求错误。
- 确认后端域名能访问。
- 确认微信开发者工具已勾选“不校验合法域名”。

### 4.2 绑定 LeetCode

页面：

```text
pages/registration/registration
```

操作：

1. 输入一个真实存在的 LeetCode 用户名。
2. 点击绑定。

预期结果：

- 绑定成功。
- `registration_status` 更新为 `1`。
- 页面跳转到加入战队流程。

如果绑定失败：

- 用户名必须满足后端格式规则：3 到 30 位，以字母或下划线开头，只能包含字母、数字、下划线。
- LeetCode 接口偶尔会超时或被限流，可以换账号或稍后重试。

### 4.3 加入战队

页面：

```text
pages/squad/squad
```

操作：

1. 输入邀请码。
2. 验证邀请码。
3. 填写昵称和头像信息。
4. 加入战队。

可先用后端初始化数据里的测试邀请码：

```text
TEST2024
CESA666
```

预期结果：

- 加入成功。
- `registration_status` 更新为 `2`。
- 页面跳转到首页。

### 4.4 首页

页面：

```text
pages/home/home
```

或：

```text
pages/index/home/home
```

检查点：

- 能正常读取用户状态。
- 能展示战队成员。
- 能展示排行榜数据。
- 没有重新跳回登录页。

如果首页为空：

- 先确认当前账号已加入战队。
- 确认本地 storage 中有 `openid` 和 `auth_token`。
- 控制台查看 `/api/v1/user/status`、`/api/v1/user/squad-members`、`/api/v1/rank/daily` 是否成功。

### 4.5 报告页

页面：

```text
pages/index/report/report
```

检查点：

- 不再调用旧云函数 `login`。
- 使用本地保存的 `openid` 加载图表数据。
- 趋势图和难度分布能正常显示。

如果图表没有数据：

- 可能该用户还没有结算日志。
- 后端会对难度分布尝试实时拉取 LeetCode 数据，但趋势图依赖 `daily_logs`。
- 这不一定是前端错误。

## 5. Token 刷新测试

普通接口会自动带：

```text
Authorization: Bearer <token>
```

当后端返回 `401` 时，前端会调用：

```text
POST /api/v1/auth/refresh
```

测试方法：

1. 登录后打开 storage。
2. 手动把 `auth_token` 改成无效值。
3. 刷新页面或进入首页。

预期结果：

- 前端尝试刷新 token。
- 刷新成功后原请求重试。
- 如果 refresh token 也失效，则清除登录状态并跳回登录页。

## 6. 后台管理页面测试

页面：

```text
pages/admin/admin
```

首次进入会弹出后台管理令牌输入框。

输入内容：

```text
云托管环境变量 ADMIN_TOKEN 的值
```

说明：

- token 只保存在当前微信开发者工具的本地 storage。
- storage key 为：

```text
admin_token
```

不会写入代码仓库。

检查点：

1. 输入正确 token 后，能加载战队列表。
2. 能创建战队。
3. 能修改战队。
4. 能删除战队。
5. 能踢除成员。

如果返回 `403`：

- `ADMIN_TOKEN` 输入错误。
- 后端生产模式下 `/api/admin/*` 要求请求头：

```text
X-Admin-Token: <ADMIN_TOKEN>
```

可以点击页面顶部 `令牌` 按钮重新输入。

## 7. 常见问题

### 7.1 request:fail url not in domain list

原因：开发者工具或真机校验了 request 合法域名。

解决：

- 开发者工具中勾选“不校验合法域名”。
- 真机/体验版需要在微信公众平台配置合法 request 域名。

### 7.2 登录后又回到登录页

可能原因：

- `/api/v1/user/status` 返回 401。
- token 没有保存成功。
- refresh token 失效。

排查：

- 查看 storage 是否有 `auth_token`、`refresh_token`、`openid`。
- 查看控制台网络请求状态码。

### 7.3 绑定 LeetCode 失败

可能原因：

- 用户名格式不符合后端校验。
- LeetCode 用户不存在。
- 后端访问 LeetCode 超时或失败。

### 7.4 报告页图表为空

可能原因：

- 当前用户没有 `daily_logs`。
- 定时结算任务还没跑。
- 这是数据问题，不一定是页面问题。

### 7.5 后台页面一直 403

原因：`admin_token` 不正确或未保存。

解决：

1. 点击后台页面顶部 `令牌`。
2. 重新输入云托管环境变量 `ADMIN_TOKEN` 的值。
3. 确认后刷新页面。

## 8. 最小验收标准

demo 视为跑通，需要满足：

1. 能登录并拿到 openid。
2. 能绑定 LeetCode。
3. 能加入战队。
4. 首页能加载用户状态和战队数据。
5. 报告页不再调用旧云函数。
6. 后台页输入正确 `ADMIN_TOKEN` 后能加载战队列表。

## 9. 建议测试顺序

按下面顺序测试最省时间：

1. 清缓存。
2. 登录。
3. 绑定 LeetCode。
4. 加入 `TEST2024` 或 `CESA666`。
5. 进入首页。
6. 进入报告页。
7. 进入后台页，输入 `ADMIN_TOKEN`。
8. 创建一个测试战队。
9. 修改测试战队。
10. 删除测试战队。
