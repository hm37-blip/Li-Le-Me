/**
 * API接口封装
 * 用于与后端B提供的云函数接口通信
 */

// API基础URL - 需要根据后端B提供的实际地址修改
const BASE_URL = 'https://your-cloud-function-url.com'

/**
 * 通用请求封装
 * @param {String} url - 请求路径
 * @param {Object} data - 请求参数
 * @param {String} method - 请求方法
 * @returns {Promise}
 */
function request(url, data = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      data,
      method,
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`))
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
 *   totalSolved: Number,         // 总刷题数
 *   consecutiveDays: Number,     // 连续打卡天数
 *   difficulty: {
 *     easy: Number,
 *     medium: Number,
 *     hard: Number
 *   },
 *   historyLogs: [
 *     { date: String, count: Number },
 *     ...
 *   ]
 * }
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
 * Response格式:
 * {
 *   dates: String[],              // 日期数组，如 ['3/23', '3/24', '3/25', ...]
 *   daily_points_change: Number[] // 每日积分变化数组，如 [3, 5, 7, ...]
 * }
 */
function getTrendData(openid, rangeDays = 7) {
  return request('/api/trend/data', { openid, range_days: rangeDays }, 'GET')
}

/**
 * 获取难度分布数据
 * @param {String} openid - 微信用户唯一标识
 * @param {String} type - 统计类型: 'YEARLY'(当年总计) | 'MONTHLY'(本月新增)
 * @returns {Promise}
 *
 * Response格式:
 * {
 *   type: String,        // 'YEARLY' 或 'MONTHLY'
 *   easy: Number,        // 简单题数量
 *   medium: Number,      // 中等题数量
 *   hard: Number,        // 困难题数量
 *   total: Number        // 总题数
 * }
 */
function getDifficultyDistribution(openid, type = 'YEARLY') {
  return request('/api/difficulty/distribution', { openid, type }, 'GET')
}

module.exports = {
  getUserReport,
  validateLeetCodeId,
  getUserInfo,
  bindLeetCodeAccount,
  unbindLeetCodeAccount,
  getRankingList,
  getTrendData,
  getDifficultyDistribution
}
