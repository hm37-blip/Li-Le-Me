# Token Authentication Guide

## Overview

A complete token authentication system has been implemented, covering:
- ✅ Automatic token injection into request headers
- ✅ Automatic token refresh on expiry
- ✅ Deduplication of concurrent refresh requests
- ✅ Auto-redirect to login page on refresh failure
- ✅ Local storage of user info

---

## Usage

### 1. Login and save token

```javascript
// pages/login/login.js
const api = require('../../utils/api.js')

Page({
  async handleLogin() {
    try {
      // Call login API (example)
      const res = await api.bindLeetCodeAccount(openid, lcId)

      // Expected backend response shape:
      // {
      //   token: 'eyJhbGciOiJIUzI1NiIs...',
      //   refreshToken: 'refresh_token_here',
      //   expiresIn: 7200,  // 2 hours
      //   userInfo: { lcId: 'xxx', ... }
      // }

      // Save token
      api.auth.setToken(res.token, res.refreshToken, res.expiresIn)

      // Save user info
      api.auth.setUserInfo(res.userInfo)

      // Navigate to home
      wx.switchTab({ url: '/pages/index/index' })

    } catch (err) {
      console.error('Login failed:', err)
      wx.showToast({ title: 'Login failed', icon: 'error' })
    }
  }
})
```

---

### 2. Send authenticated requests

```javascript
// pages/report/report.js
const api = require('../../utils/api.js')

Page({
  onLoad() {
    // All API calls automatically include the token.
    // If the token is expired, it will be refreshed and the request retried.

    api.getTrendData(openid, 7)
      .then(res => {
        console.log('Data loaded:', res)
      })
      .catch(err => {
        console.error('Failed to load data:', err)
        // On auth failure, the user is automatically redirected to the login page.
      })
  }
})
```

---

### 3. Check login status

```javascript
// app.js or any page
const api = require('./utils/api.js')

App({
  onLaunch() {
    if (api.auth.isLoggedIn()) {
      console.log('User is logged in')
      const userInfo = api.auth.getUserInfo()
      console.log('User info:', userInfo)
    } else {
      console.log('User is not logged in')
      wx.navigateTo({ url: '/pages/login/login' })
    }
  }
})
```

---

### 4. Logout

```javascript
// pages/profile/profile.js
const api = require('../../utils/api.js')

Page({
  handleLogout() {
    // Clear all auth state
    api.auth.clearAuth()

    wx.showToast({ title: 'Logged out', icon: 'success' })

    // Redirect to login page
    wx.reLaunch({ url: '/pages/login/login' })
  }
})
```

---

### 5. Unauthenticated requests (optional)

```javascript
// For public endpoints that don't require a token (e.g. public leaderboard)
api.getRankingList('total', false)  // Pass false as the 4th argument
```

---

## API Reference

### auth.js module

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setToken(token, refreshToken, expiresIn)` | token(String), refreshToken(String?), expiresIn(Number?) | void | Persist the access token |
| `getToken()` | — | String\|null | Retrieve the access token |
| `getRefreshToken()` | — | String\|null | Retrieve the refresh token |
| `isTokenExpired()` | — | Boolean | Check whether the token has expired |
| `clearAuth()` | — | void | Clear all auth state |
| `setUserInfo(userInfo)` | userInfo(Object) | void | Persist user info |
| `getUserInfo()` | — | Object\|null | Retrieve user info |
| `isLoggedIn()` | — | Boolean | Check whether the user is logged in |

---

## Token Refresh Flow

```
┌─────────────┐
│ Send request │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Inject token    │
└──────┬──────────┘
       │
       ▼
   ┌───────┐
   │ 401?  │─── No ──▶ Return data
   └───┬───┘
       │ Yes
       ▼
┌──────────────────┐
│ Refresh token    │
└──────┬───────────┘
       │
   ┌───▼────┐
   │Success?│─── Yes ──▶ Retry original request
   └───┬────┘
       │ No
       ▼
┌──────────────┐
│ Clear auth   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Redirect to  │
│ login page   │
└──────────────┘
```

---

## Backend API Spec

### Login endpoint response shape:
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

### Token refresh endpoint:
- **Path**: `/api/v1/auth/refresh`
- **Method**: `POST`
- **Request body**:
  ```json
  {
    "refreshToken": "refresh_token_here"
  }
  ```
- **Response**:
  ```json
  {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 7200
  }
  ```

### Auth header format:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Notes

1. **Token expiry**: Recommended TTL is 2 hours (7200s); refresh token TTL is 7 days.
2. **Proactive refresh**: Tokens are considered near-expiry 5 minutes before the deadline.
3. **Concurrent request protection**: Multiple simultaneous 401s trigger only one refresh cycle.
4. **Login page path**: Ensure `/pages/login/login` exists before deploying.
5. **Storage keys**: Do not manually modify `auth_token`, `refresh_token`, or related keys.

---

## Debugging

```javascript
// Inspect current token
console.log('Token:', api.auth.getToken())

// Check expiry status
console.log('Expired?', api.auth.isTokenExpired())

// Inspect user info
console.log('User info:', api.auth.getUserInfo())

// Manually clear token (for testing)
api.auth.clearAuth()
```
