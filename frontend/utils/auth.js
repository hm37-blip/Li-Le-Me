/**
 * 认证管理工具
 * 用于管理用户登录状态、token存储和刷新
 */

// Storage Key 常量
const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const TOKEN_EXPIRE_TIME = 'token_expire_time'
const USER_INFO_KEY = 'user_info'

/**
 * 保存 token
 * @param {String} token - 访问令牌
 * @param {String} refreshToken - 刷新令牌（可选）
 * @param {Number} expiresIn - 过期时间（秒，可选）
 */
function setToken(token, refreshToken = null, expiresIn = null) {
  try {
    wx.setStorageSync(TOKEN_KEY, token)
    wx.setStorageSync('token', token)

    if (refreshToken) {
      wx.setStorageSync(REFRESH_TOKEN_KEY, refreshToken)
    }

    if (expiresIn) {
      // 计算过期时间戳（当前时间 + 过期秒数）
      const expireTime = Date.now() + expiresIn * 1000
      wx.setStorageSync(TOKEN_EXPIRE_TIME, expireTime)
    }
  } catch (e) {
    console.error('保存 Token 失败:', e)
  }
}

/**
 * 获取 token
 * @returns {String|null} token 或 null
 */
function getToken() {
  try {
    const token = wx.getStorageSync(TOKEN_KEY)
    return token || null
  } catch (e) {
    console.error('获取 Token 失败:', e)
    return null
  }
}

/**
 * 获取刷新 token
 * @returns {String|null}
 */
function getRefreshToken() {
  try {
    const refreshToken = wx.getStorageSync(REFRESH_TOKEN_KEY)
    return refreshToken || null
  } catch (e) {
    console.error('获取 Refresh Token 失败:', e)
    return null
  }
}

/**
 * 检查 token 是否过期
 * @returns {Boolean} true 表示已过期或即将过期（5分钟内）
 */
function isTokenExpired() {
  try {
    const expireTime = wx.getStorageSync(TOKEN_EXPIRE_TIME)
    if (!expireTime) {
      return false // 如果没有设置过期时间，默认未过期
    }

    // 提前5分钟判定为即将过期
    const bufferTime = 5 * 60 * 1000
    return Date.now() + bufferTime >= expireTime
  } catch (e) {
    console.error('检查 Token 过期失败:', e)
    return true // 出错时默认为过期
  }
}

/**
 * 清除所有认证信息
 */
function clearAuth() {
  try {
    wx.removeStorageSync(TOKEN_KEY)
    wx.removeStorageSync(REFRESH_TOKEN_KEY)
    wx.removeStorageSync(TOKEN_EXPIRE_TIME)
    wx.removeStorageSync(USER_INFO_KEY)
    wx.removeStorageSync('token')
  } catch (e) {
    console.error('清除认证信息失败:', e)
  }
}

/**
 * 保存用户信息
 * @param {Object} userInfo - 用户信息对象
 */
function setUserInfo(userInfo) {
  try {
    wx.setStorageSync(USER_INFO_KEY, userInfo)
  } catch (e) {
    console.error('保存用户信息失败:', e)
  }
}

/**
 * 获取用户信息
 * @returns {Object|null}
 */
function getUserInfo() {
  try {
    const userInfo = wx.getStorageSync(USER_INFO_KEY)
    return userInfo || null
  } catch (e) {
    console.error('获取用户信息失败:', e)
    return null
  }
}

/**
 * 检查用户是否已登录
 * @returns {Boolean}
 */
function isLoggedIn() {
  const token = getToken()
  return !!token && !isTokenExpired()
}

/**
 * 刷新 token
 * @param {Function} refreshAPI - 刷新 token 的 API 函数
 * @returns {Promise<String>} 返回新的 token
 */
function refreshAuthToken(refreshAPI) {
  return new Promise((resolve, reject) => {
    const refreshToken = getRefreshToken()

    if (!refreshToken) {
      reject(new Error('没有 Refresh Token'))
      return
    }

    refreshAPI(refreshToken)
      .then(res => {
        if (res.token) {
          setToken(res.token, res.refreshToken, res.expiresIn)
          resolve(res.token)
        } else {
          reject(new Error('刷新 Token 失败'))
        }
      })
      .catch(err => {
        console.error('刷新 Token 失败:', err)
        clearAuth() // 刷新失败，清除所有认证信息
        reject(err)
      })
  })
}

module.exports = {
  setToken,
  getToken,
  getRefreshToken,
  isTokenExpired,
  clearAuth,
  setUserInfo,
  getUserInfo,
  isLoggedIn,
  refreshAuthToken
}
