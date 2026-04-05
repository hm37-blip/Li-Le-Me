App({
  onLaunch() {
    // 初始化云开发（如果可用）
    if (wx.cloud) {
      wx.cloud.init({
        // env: 'your-env-id', // 云开发环境ID，正式使用时需要配置
        traceUser: true
      })
    } else {
      console.warn('云开发不可用，使用模拟数据')
    }
  },

  globalData: {
    userInfo: null,
    lcId: null,
    openid: null
  }
})
