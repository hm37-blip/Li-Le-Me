# Token 鉴权使用指南

## 📚 功能说明

已实现完整的 Token 鉴权体系，包括：
- ✅ Token 自动添加到请求头
- ✅ Token 过期自动刷新
- ✅ 并发请求时防止重复刷新
- ✅ 刷新失败自动跳转登录页
- ✅ 用户信息本地存储

---

## 🔐 使用方法

### 1. 登录并保存 Token

```javascript
// pages/login/login.js
const api = require('../../utils/api.js')

Page({
  async handleLogin() {
    try {
      // 调用登录 API（示例）
      const res = await api.bindLeetCodeAccount(openid, lcId)

      // 假设后端返回：
      // {
      //   token: 'eyJhbGciOiJIUzI1NiIs...',
      //   refreshToken: 'refresh_token_here',
      //   expiresIn: 7200,  // 2小时
      //   userInfo: { lcId: 'xxx', ... }
      // }

      // 保存 Token
      api.auth.setToken(res.token, res.refreshToken, res.expiresIn)

      // 保存用户信息
      api.auth.setUserInfo(res.userInfo)

      // 跳转到主页
      wx.switchTab({ url: '/pages/index/index' })

    } catch (err) {
      console.error('登录失败:', err)
      wx.showToast({ title: '登录失败', icon: 'error' })
    }
  }
})
```

---

### 2. 发送需要认证的请求

```javascript
// pages/report/report.js
const api = require('../../utils/api.js')

Page({
  onLoad() {
    // 所有 API 请求都会自动添加 Token
    // 如果 Token 过期，会自动刷新后重试

    api.getTrendData(openid, 7)
      .then(res => {
        console.log('数据加载成功:', res)
      })
      .catch(err => {
        console.error('数据加载失败:', err)
        // 如果是认证失败，会自动跳转登录页
      })
  }
})
```

---

### 3. 检查登录状态

```javascript
// app.js 或任何页面
const api = require('./utils/api.js')

App({
  onLaunch() {
    // 检查用户是否已登录
    if (api.auth.isLoggedIn()) {
      console.log('用户已登录')
      const userInfo = api.auth.getUserInfo()
      console.log('用户信息:', userInfo)
    } else {
      console.log('用户未登录')
      wx.navigateTo({ url: '/pages/login/login' })
    }
  }
})
```

---

### 4. 退出登录

```javascript
// pages/profile/profile.js
const api = require('../../utils/api.js')

Page({
  handleLogout() {
    // 清除所有认证信息
    api.auth.clearAuth()

    wx.showToast({ title: '已退出登录', icon: 'success' })

    // 跳转到登录页
    wx.reLaunch({ url: '/pages/login/login' })
  }
})
```

---

### 5. 发送不需要认证的请求（可选）

```javascript
// 如果某个接口不需要 Token（如公开的排行榜）
api.getRankingList('total', false)  // 第4个参数设为 false
```

---

## 🛠️ API 文档

### auth.js 模块

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `setToken(token, refreshToken, expiresIn)` | token(String), refreshToken(String?), expiresIn(Number?) | void | 保存访问令牌 |
| `getToken()` | - | String\|null | 获取访问令牌 |
| `getRefreshToken()` | - | String\|null | 获取刷新令牌 |
| `isTokenExpired()` | - | Boolean | 检查 Token 是否过期 |
| `clearAuth()` | - | void | 清除所有认证信息 |
| `setUserInfo(userInfo)` | userInfo(Object) | void | 保存用户信息 |
| `getUserInfo()` | - | Object\|null | 获取用户信息 |
| `isLoggedIn()` | - | Boolean | 检查用户是否已登录 |

---

## 🔄 Token 刷新流程

```
┌─────────────┐
│  发起请求    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ 自动添加 Token  │
└──────┬──────────┘
       │
       ▼
   ┌───────┐
   │ 401？ │─── No ──▶ 返回数据
   └───┬───┘
       │ Yes
       ▼
┌──────────────────┐
│ 调用刷新 Token   │
└──────┬───────────┘
       │
   ┌───▼────┐
   │ 成功？ │─── Yes ──▶ 重试原请求
   └───┬────┘
       │ No
       ▼
┌──────────────┐
│ 清除认证信息 │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 跳转登录页   │
└──────────────┘
```

---

## 📝 后端 API 规范

### 登录接口应返回：
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresIn": 7200,
  "userInfo": {
    "lcId": "user123",
    "openid": "wx_openid_xxx"
  }
}
```

### 刷新 Token 接口：
- **路径**: `/api/v1/auth/refresh`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "refreshToken": "refresh_token_here"
  }
  ```
- **响应**:
  ```json
  {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 7200
  }
  ```

### 认证请求头格式：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚠️ 注意事项

1. **Token 过期时间**：建议设置为 2小时（7200秒），刷新令牌设置为 7天
2. **自动刷新触发时机**：提前 5 分钟判定为即将过期
3. **并发请求保护**：多个请求同时遇到 401 时，只会触发一次刷新
4. **登录页路径**：需要确保 `/pages/login/login` 页面存在
5. **Storage Key**：不要手动修改 `auth_token`、`refresh_token` 等 key

---

## 🔍 调试技巧

```javascript
// 查看当前 Token
console.log('Token:', api.auth.getToken())

// 查看 Token 是否过期
console.log('已过期?', api.auth.isTokenExpired())

// 查看用户信息
console.log('用户信息:', api.auth.getUserInfo())

// 手动清除 Token（测试用）
api.auth.clearAuth()
```
