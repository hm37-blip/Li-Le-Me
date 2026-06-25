# Li-Le-Me 全量代码审查报告 (master-dev)

> 2026-06-25 · 多 agent 审查(13 个审查切片 + 对抗验证)。13 个审查 agent 全部完成,产出 90 条原始发现;其中 **21 条经双重对抗验证确认**,其余因触发账号会话上限(5:30am 重置)未能跑完验证,标为"待验证"(reviewer 已标记,可信度高但未二次核验)。本报告由主控直接从已恢复数据汇总去重。

## 执行摘要
集成功能整体可用,但**鉴权/授权是系统性缺口**:项目没有任何 Spring Security / 过滤器 / 拦截器,所有写接口都直接信任请求体里的 `openid`,且 `/api/admin/*` 完全无鉴权,管理员入口仅靠前端硬编码口令 `xyz123`。其次是**数据一致性**:`member_count` 存储列在 join/删除路径上不维护、会漂移甚至变负;每日结算 job 非幂等会重复累加 `total_points`。还发现一处与已修复 bug 同源的排序错误(已在本次修掉)。前端有几处真实交互 bug(401 刷新死循环、下拉刷新失效、连续天数算错、管理操作把业务失败当成功)。

---

## 🔴 Critical

### C1. 用户写接口全部信任请求体 openid → 越权/冒充 (IDOR) 【已确认】
`UserAccountController`(profile/account delete)、`LeetCodeBindController`(bind)、`JoinSquadController`(squad/join)、`SquadController`(squad/create)都直接从 body 取 `openid` 操作,**完全不校验 Authorization**。任意客户端传别人的 openid 即可:删除他人账号(级联删 daily_logs、改 squad、删用户、吊销其 refresh token)、改他人昵称/头像、把他人绑到某 LeetCode 账号、把他人塞进战队、以他人为 admin 建战队。
- 文件:`controller/user/UserAccountController.java:27-63`、`LeetCodeBindController.java:41-68`、`JoinSquadController.java:38-70`、`controller/squad/SquadController.java:38-56`;`service/UserService.java:206-232`
- 修复:所有写接口从校验过的 Bearer access token 推导 openid(`AuthTokenService.findUserByAccessToken`),token 缺失/无效返回 401;统一加一个拦截器,而不是各控制器各自为政。

### C2. `/api/admin/*` 零鉴权,管理员入口仅靠前端硬编码口令 【待验证 · 高可信】
整个 admin 接口(列出/建/改/删战队、列成员含原始 openid、踢人)无任何鉴权(项目无 spring-security)。前端 `pages/admin/admin.js` 的请求也不带 Authorization;管理员页面进入仅靠 `registration.js` 里 `ADMIN_CODE='xyz123'` 的**纯前端**比较——任何人读 bundle 或直接打接口即可全量管理所有战队、拿到所有用户 openid(配合 C1 即可冒充任意用户)。
- 文件:`controller/admin/AdminController.java:18-129`、`frontend/pages/admin/admin.js`、`frontend/pages/registration/registration.js:3,63-70`
- 修复:admin 接口加服务端鉴权(管理员角色),前端口令改为服务端校验;成员列表不返回原始 openid。

### C3. 每日结算 job 非幂等,重复运行会重复累加 total_points 【待验证 · 高可信】
`DailySettleJob.settle()` 的 daily_log 是 upsert(幂等),但 `user.total_points` 是无条件 `+= dailyPoints`(line 104)。调度补偿/手动触发/重启导致 job 当天跑两次,积分翻倍,污染所有排行与历史。
- 文件:`service/DailySettleJob.java:78-106`
- 修复:total_points 用"当日重算覆盖"而非累加,或加当日已结算标记保证幂等。

---

## 🟠 High

### H1. `squads.member_count` 存储列会漂移/变负 【已确认 + 待验证】
- 线上 join 路径 `JoinSquadController.joinSquad` 只设 `squad_id`,**从不 +1**(容量判断用实时 count,所以"满"判断正确,但持久化列不涨)。
- `UserService.deleteAccount` 会 `-1`;`AdminService.deleteSquad/removeMemberFromSquad` 又**从不 -1**。
- 结果:计数只减不增 → 漂移、变负 → 触发 `member_count==0 → is_active=false` 误关战队。正确实现 `SquadService.verifyInviteCode` 是死代码,没被调用。
- 文件:`JoinSquadController.java:57-70`、`service/UserService.java:218-226`、`service/AdminService.java:76-102`
- 修复:**二选一**——彻底改成 `COUNT(users)` 派生(AdminController 已这么做),或在 join/删除的同一事务里原子增减且加 `member_count>0` 守卫。统一一个数据源。

### H2. `UserReportController.calculateSquadRanking` 排序升序(最差排第一) 【已确认 · ✅ 本次已修】
与已修的 `LeaderboardService` 同源 bug:`comparingInt(dailyPoints).reversed()....reversed()` 两次 reverse 抵消 → 按今日积分**升序**。`/api/user/info` 的 `ranking` 字段因此把最少分的排第 1。
- 文件:`controller/user/UserReportController.java:170-177` → 已去掉内层 `.reversed()`。

### H3. 排行榜读接口 IDOR 【待验证】
`GET /api/v1/rank/daily` 的 `squad_id`/`openid` 是裸 query 参数,无鉴权、不校验归属——可任意读他人 mySummary、枚举战队。
- 文件:`controller/rank/LeaderboardController.java:33-54`
- 修复:openid 取自 token,校验其属于该 squad。

### H4. 前端 401 刷新死循环 + 队列请求级联失败 【待验证】
`utils/api.js` 收到 401 → 刷新 token → 重试原请求,但重试再 401 时无重试深度上限 → 死循环;刷新失败的 `.catch` 里把排队请求重新 `request(...)` 而非 reject → 级联失败、反复跳登录。
- 文件:`frontend/utils/api.js:77-117`
- 修复:加重试深度标记(只重试一次);刷新失败时 reject 所有排队请求并清登录态。

### H5. 管理端把 HTTP 200 的业务失败当成功 【待验证】
`admin.js` 的删除战队/踢人只判 `statusCode===200`,但后端业务失败也是 200 + `{success:false,...}`,导致弹"成功"并照常刷新。
- 文件:`frontend/pages/admin/admin.js:234-241,264-271`
- 修复:判 `res.data.success` 而非 statusCode。

### H6. 首页下拉刷新失效 【待验证】
`home.json` 开了 `enablePullDownRefresh` 且实现了 `onPullDownRefresh`,但整页被 `<scroll-view scroll-y>` 包成根元素,吞掉了原生页面级下拉手势。
- 文件:`frontend/pages/index/home/home.wxml:2-77`
- 修复:去掉外层 scroll-view 用页面原生滚动,或改用 scroll-view 自身的 refresher。

### H7. 连续打卡天数算错(用月度数据当日度) 【待验证】
`report.js` 调 `getTrendData(openid, 365)` 喂给 `calculateConsecutiveDays`,但后端 `range_days>=365` 返回的是**月度聚合**,不是日度,连续天数完全错。
- 文件:`frontend/pages/index/report/report.js:475-505`
- 修复:连续天数用日度趋势(小 range)或后端单独算。

### H8. JWT 签名密钥硬编码默认值 【已确认】
`auth.jwt-secret` 未设环境变量时回退到源码里的 `li-le-me-dev-secret-change-me`,谁都能伪造任意 openid 的 access token。
- 文件:`service/AuthTokenService.java:30-31`、`application.yml:30`
- 修复:生产环境无 JWT_SECRET 直接启动失败,去掉不安全默认值。

---

## 🟡 Medium

- **M1 战队容量 TOCTOU 竞态**【已确认】:`selectCount` 判满与写入分离、无锁/无原子守卫,并发 join 可超员。`JoinSquadController.java:57-70`。修复:事务内锁 squad 行或条件 UPDATE。
- **M2** 同 H8(another reviewer 标 medium)。

---

## 🟢 Low / 质量

- joinSquad 缺"已在战队"校验,可反复换队、遗留旧队计数不一致(`JoinSquadController.java:44-70`)【已确认】
- 无 refresh token 重用/被盗检测,失窃 token 可静默续期(`AuthTokenService.java:72-93`)【已确认】
- CORS `allowedOriginPatterns("*")` 对所有接口(含带 token 的)开放(`CorsConfig.java:11-17`)【已确认】
- WeChat `session_key` 等在 DEBUG 日志中输出;密钥明文在 `application.yml`(`UserService.java:70-75`)【已确认】
- WeChat 登录把内部异常 message 透传给客户端且用 500 表示 4xx 类错误(`WechatLoginController.java:41-45`)【已确认】
- 首登发 token 的 check-then-insert 对 `UNIQUE(openid)` 有竞态,可能 500(`AuthTokenService.java:49-67`)【已确认】
- 死代码/重复:`SquadService.verifyInviteCode` 未被调用且与线上 join 行为分叉;`buildUserInfo` 在 `UserService` 与 `LeetCodeBindController` 重复;`UserService.bindLeetCode` 里 `fetchStats` 结果未用(`SquadService.java:67-106`、`UserService.java:129-154`)【已确认】
- `report()` 吞异常不记日志、`info()` 完全无异常处理,失败面不一致(`UserReportController.java:68-95`)【已确认】
- bind 未对 body `openid` 判空,`dup.getOpenid().equals(...)` 可能 NPE(`LeetCodeBindController.java:43-53`)【争议】

---

## 备注
- 还有 ~46 条 medium/low 级"待验证"发现因会话上限未跑完二次验证(分布:leaderboard-settle 8、concurrency 6、index-tabs 5、admin-infra/core-util/security 各 4 等),多为上述主题的细化/重复。会话上限 5:30am(Asia/Shanghai)重置后可重跑验证补全。
- 已知/有意为之(未计入发现):mock 微信登录、`/debug/*` 演示接口、游客模式登录兜底。
