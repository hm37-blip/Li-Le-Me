/**
 * API接口封装
 * 用于与后端B提供的云函数接口通信
 */

const auth = require('./auth.js')

// API基础URL - 需要根据后端B提供的实际地址修改
const BASE_URL = 'https://your-cloud-function-url.com'

// Token 刷新标记（防止并发刷新）
let isRefreshing = false
let refreshSubscribers = []

/**
 * 通用请求封装（带 Token 鉴权）
 * @param {String} url - 请求路径
 * @param {Object} data - 请求参数
 * @param {String} method - 请求方法
 * @param {Boolean} needAuth - 是否需要认证（默认 true）
 * @returns {Promise}
 */
function request(url, data = {}, method = 'GET', needAuth = true) {
  return new Promise((resolve, reject) => {
    // 构建请求头
    const header = {
      'content-type': 'application/json'
    }

    // 如果需要认证，添加 Token
    if (needAuth) {
      const token = auth.getToken()
      if (token) {
        header['Authorization'] = `Bearer ${token}`
      } else {
        console.warn('请求需要认证但未找到 Token')
      }
    }

    wx.request({
      url: `${BASE_URL}${url}`,
      data,
      method,
      header,
      success(res) {
        // 处理成功响应
        if (res.statusCode === 200) {
          resolve(res.data)
        }
        // 处理 401 未授权（Token 过期或无效）
        else if (res.statusCode === 401) {
          console.warn('Token 无效或已过期，尝试刷新')
          handleTokenExpired(url, data, method, needAuth, resolve, reject)
        }
        // 处理其他错误状态码
        else {
          const message = (res.data && res.data.message) || '未知错误'
          reject(new Error(`请求失败: ${res.statusCode} - ${message}`))
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

/**
 * 处理 Token 过期
 * @param {String} url - 原请求路径
 * @param {Object} data - 原请求参数
 * @param {String} method - 原请求方法
 * @param {Boolean} needAuth - 是否需要认证
 * @param {Function} resolve - Promise resolve
 * @param {Function} reject - Promise reject
 */
function handleTokenExpired(url, data, method, needAuth, resolve, reject) {
  // 如果正在刷新 Token，将请求加入队列
  if (isRefreshing) {
    refreshSubscribers.push(() => {
      request(url, data, method, needAuth).then(resolve).catch(reject)
    })
    return
  }

  isRefreshing = true

  // 调用刷新 Token 的 API
  refreshToken()
    .then(() => {
      // 刷新成功，重试原请求
      request(url, data, method, needAuth).then(resolve).catch(reject)

      // 执行队列中的请求
      refreshSubscribers.forEach(callback => callback())
      refreshSubscribers = []
    })
    .catch(err => {
      console.error('刷新 Token 失败:', err)

      // 清除认证信息
      auth.clearAuth()

      // 拒绝原请求和队列中的请求
      reject(new Error('Token 已过期，请重新登录'))
      refreshSubscribers.forEach(callback => callback())
      refreshSubscribers = []

      // 跳转到登录页面（可选）
      wx.navigateTo({
        url: '/pages/login/login'
      })
    })
    .finally(() => {
      isRefreshing = false
    })
}

/**
 * 刷新 Token
 * @returns {Promise}
 */
function refreshToken() {
  const refreshToken = auth.getRefreshToken()

  if (!refreshToken) {
    return Promise.reject(new Error('没有 Refresh Token'))
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/api/v1/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        if (res.statusCode === 200 && res.data.token) {
          // 保存新的 Token
          auth.setToken(
            res.data.token,
            res.data.refreshToken,
            res.data.expiresIn
          )
          resolve(res.data)
        } else {
          reject(new Error('刷新 Token 失败'))
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

/**
 * 获取用户报告数据
 * @param {String} lcId - LeetCode账号ID
 * @param {String} range - 时间范围: 'week' | 'month' | 'year'
 * @returns {Promise}
 *
 * Response格式:
 * {
 *   totalSolved: Number,         // 总刷题数 (来自 users 表)
 *   consecutiveDays: Number,     // 连续打卡天数 (后端计算或前端自行计算)
 *   difficulty: {
 *     easy: Number,              // 简单题累计数 (来自 daily_logs 表最新记录)
 *     medium: Number,            // 中等题累计数
 *     hard: Number               // 困难题累计数
 *   }
 * }
 *
 * 注意: 此接口不返回 historyLogs 数组。历史趋势数据请使用 getTrendData() 接口获取。
 */
function getUserReport(lcId, range = 'week') {
  return request('/api/user/report', { lcId, range }, 'GET')
}

/**
 * 验证LeetCode ID是否存在
 * @param {String} lcId - LeetCode账号ID
 * @returns {Promise<Boolean>}
 */
function validateLeetCodeId(lcId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://leetcode.com/graphql',
      method: 'POST',
      data: {
        query: `query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }`,
        variables: { username: lcId }
      },
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        if (res.statusCode === 200 && res.data.data.matchedUser) {
          resolve(true)
        } else {
          resolve(false)
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

/**
 * 获取用户基本信息
 * @param {String} lcId - LeetCode账号ID
 * @returns {Promise}
 *
 * Response格式:
 * {
 *   username: String,
 *   avatar: String,
 *   totalSolved: Number,
 *   ranking: Number
 * }
 */
function getUserInfo(lcId) {
  return request('/api/user/info', { lcId }, 'GET')
}

/**
 * 绑定LeetCode账号
 * @param {String} openid - 微信用户唯一标识
 * @param {String} lcId - LeetCode账号ID
 * @returns {Promise}
 */
function bindLeetCodeAccount(openid, lcId) {
  return request('/api/user/bind', { openid, lcId }, 'POST')
}

/**
 * 解绑LeetCode账号
 * @param {String} openid - 微信用户唯一标识
 * @returns {Promise}
 */
function unbindLeetCodeAccount(openid) {
  return request('/api/user/unbind', { openid }, 'POST')
}

/**
 * 获取排行榜数据
 * @param {String} sortBy - 排序方式: 'total' | 'weekly'
 * @returns {Promise}
 *
 * Response格式:
 * [
 *   {
 *     rank: Number,
 *     lcId: String,
 *     avatar: String,
 *     totalSolved: Number,
 *     dailySteps: Number
 *   },
 *   ...
 * ]
 */
function getRankingList(sortBy = 'total') {
  return request('/api/ranking/list', { sortBy }, 'GET')
}

/**
 * 获取趋势图表数据
 * @param {String} openid - 微信用户唯一标识
 * @param {Number} rangeDays - 时间范围天数，默认7天
 * @returns {Promise}
 *
 * Response格式 (符合 Module 4 规范):
 * {
 *   dates: String[],         // 日期数组，如 ['03-22', '03-23', '03-24']
 *   daily_points: Number[],  // 每日加权积分数组 (1:2:3权重)，如 [3, 5, 7]
 *   average_line: Number     // 期间每日平均分数，用于绘制基准线
 * }
 */
function getTrendData(openid, rangeDays = 7) {
  return request('/api/v1/stats/trend', { openid, range_days: rangeDays }, 'GET')
}

/**
 * 获取难度分布数据
 * @param {String} openid - 微信用户唯一标识
 * @param {String} type - 统计类型: 'TOTAL'(总计) | 'MONTHLY'(本月新增)
 * @returns {Promise}
 *
 * Response格式 (符合 Module 4 规范):
 * {
 *   easy: Number,        // 简单题数量
 *   medium: Number,      // 中等题数量
 *   hard: Number         // 困难题数量
 * }
 */
function getDifficultyDistribution(openid, type = 'TOTAL') {
  return request('/api/v1/stats/distribution', { openid, type }, 'GET')
}

/**
 * 获取分享海报数据
 * @returns {Promise}
 *
 * Response格式 (符合 Module 4 规范):
 * {
 *   poster_url: String,   // 云存储路径，指向预生成的海报图片
 *   rank_tier: String,    // 等级标签: Hardcore/Top Tier/Elite/NPC/Completed
 *   motto: String         // 随机励志语录，如 "Stay hungry, Stay foolish"
 * }
 */
function getSharePoster() {
  return request('/api/v1/stats/poster', {}, 'GET')
}

module.exports = {
  getUserReport,
  validateLeetCodeId,
  getUserInfo,
  bindLeetCodeAccount,
  unbindLeetCodeAccount,
  getRankingList,
  getTrendData,
  getDifficultyDistribution,
  getSharePoster,
  auth // 导出 auth 模块，方便其他文件使用
}
