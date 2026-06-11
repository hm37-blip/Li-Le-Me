/**
 * API接口封装
 * 用于与后端B提供的云函数接口通信
 */

const auth = require('./auth.js')

// API基础URL - 指向本地 Java 后端(master-dev 集成)
const BASE_URL = 'http://localhost:8080'

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
  return request('/api/v1/stats/trend', { openid, range_days: rangeDays }, 'GET').then(res => {
    // 适配后端返回格式，确保返回 data 字段内容
    return res.data || res
  })
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
  return request('/api/v1/stats/distribution', { openid, type }, 'GET').then(res => {
    // 适配后端返回格式，确保返回 data 字段内容
    return res.data || res
  })
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
function getSharePoster(openid) {
  return request('/api/v1/stats/poster', { openid }, 'GET').then(res => {
    // 适配后端返回格式，确保返回 data 字段内容
    return res.data || res
  })
}

/**
 * 获取战队每日排行榜
 * @param {Number|String} squadId - 战队 ID
 * @param {String} openid - 当前用户 openid
 * @param {String} date - 可选，yyyy-MM-dd
 * @returns {Promise}
 */
function getDailyLeaderboard(squadId, openid, date = '') {
  const data = {
    squad_id: squadId,
    openid
  }
  if (date) {
    data.date = date
  }

  return request('/api/v1/rank/daily', data, 'GET', false).then(res => {
    if (res.code && res.code !== 200) {
      throw new Error(res.msg || '获取排行榜失败')
    }
    return res.data || res
  })
}

module.exports = {
  getTrendData,
  getDifficultyDistribution,
  getSharePoster,
  getDailyLeaderboard,
  auth // 导出 auth 模块，方便其他文件使用
}
