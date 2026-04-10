/**
 * 全局请求封装
 * 统一处理：Base URL 拼接、Loading 动画、错误拦截
 */

/**
 * 发起网络请求
 * @param {Object} options 请求配置
 * @param {String} options.url - API 路径（相对路径，如 '/api/ranking'）
 * @param {String} options.method - 请求方法（GET/POST/PUT/DELETE），默认 GET
 * @param {Object} options.data - 请求参数
 * @param {Object} options.header - 额外的请求头
 * @param {Boolean} options.showLoading - 是否显示 Loading 动画，默认 true
 * @param {String} options.loadingText - Loading 文案，默认 "加载中..."
 * @param {Boolean} options.showError - 是否显示错误提示，默认 true
 * @returns {Promise}
 */
function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    showLoading = true,
    loadingText = '加载中...',
    showError = true
  } = options

  // 1. 自动拼接 Base URL
  const app = getApp()
  const baseUrl = (app && app.globalData && app.globalData.baseUrl) || 'http://localhost:8080'
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`

  // 2. 显示 Loading 动画
  if (showLoading) {
    wx.showLoading({
      title: loadingText,
      mask: true
    })
  }

  return new Promise((resolve, reject) => {
    // 3. 构建请求头（自动添加 token）
    const requestHeader = {
      'content-type': 'application/json',
      ...header
    }

    // 自动添加 Authorization Token
    if (app && app.globalData && app.globalData.token) {
      requestHeader['Authorization'] = `Bearer ${app.globalData.token}`
    }

    // 4. 发起请求
    wx.request({
      url: fullUrl,
      method,
      data,
      header: requestHeader,
      success(res) {
        // 隐藏 Loading
        if (showLoading) {
          wx.hideLoading()
        }

        // 处理响应状态码
        if (res.statusCode === 200) {
          // 成功：返回数据
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // 未授权：提示并跳转登录
          if (showError) {
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none',
              duration: 2000
            })
          }
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/login/login' })
          }, 2000)
          reject(new Error('未授权'))
        } else if (res.statusCode === 404) {
          // 接口不存在
          if (showError) {
            wx.showToast({
              title: '接口不存在',
              icon: 'none',
              duration: 2000
            })
          }
          console.error('[Request Error 404]', fullUrl, res)
          reject(new Error(`接口不存在: ${res.statusCode}`))
        } else if (res.statusCode >= 500) {
          // 服务器错误
          if (showError) {
            wx.showToast({
              title: '服务器错误，请稍后重试',
              icon: 'none',
              duration: 2000
            })
          }
          console.error('[Request Error 500+]', fullUrl, res)
          reject(new Error(`服务器错误: ${res.statusCode}`))
        } else {
          // 其他错误
          const errorMsg = (res.data && res.data.message) || `请求失败 (${res.statusCode})`
          if (showError) {
            wx.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            })
          }
          console.error('[Request Error]', fullUrl, res)
          reject(new Error(errorMsg))
        }
      },
      fail(err) {
        // 隐藏 Loading
        if (showLoading) {
          wx.hideLoading()
        }

        // 网络异常
        if (showError) {
          wx.showToast({
            title: '网络异常，请检查网络连接',
            icon: 'none',
            duration: 2000
          })
        }
        console.error('[Request Fail]', fullUrl, err)
        reject(err)
      }
    })
  })
}

/**
 * GET 请求快捷方法
 * @param {String} url - API 路径
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置（showLoading, header 等）
 * @returns {Promise}
 */
function get(url, data = {}, options = {}) {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  })
}

/**
 * POST 请求快捷方法
 * @param {String} url - API 路径
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置（showLoading, header 等）
 * @returns {Promise}
 */
function post(url, data = {}, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT 请求快捷方法
 * @param {String} url - API 路径
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置（showLoading, header 等）
 * @returns {Promise}
 */
function put(url, data = {}, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE 请求快捷方法
 * @param {String} url - API 路径
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他配置（showLoading, header 等）
 * @returns {Promise}
 */
function del(url, data = {}, options = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

module.exports = {
  request,
  get,
  post,
  put,
  del
}
