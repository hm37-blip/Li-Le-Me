function saveUserInfo(userInfo) {
  if (!userInfo) return null
  const app = getApp()
  app.globalData.userInfo = userInfo
  wx.setStorageSync('userInfo', userInfo)
  return userInfo
}

function syncUserInfo(api) {
  const token = api.auth.getToken() || wx.getStorageSync('token')
  if (!token) {
    return Promise.resolve(wx.getStorageSync('userInfo') || null)
  }

  return api.getUserStatus()
    .then(data => {
      if (typeof data.registration_status !== 'undefined') {
        wx.setStorageSync('registration_status', Number(data.registration_status))
      }
      return saveUserInfo(data.user_info || null)
    })
    .catch(err => {
      console.warn('[USER_INFO_SYNC_FAIL]', err)
      return wx.getStorageSync('userInfo') || null
    })
}

module.exports = {
  saveUserInfo,
  syncUserInfo
}
