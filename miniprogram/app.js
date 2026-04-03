App({
  globalData: {
    baseUrl: 'http://localhost:8080',
    openid: '',
    token: '',
    userInfo: null,
    inviteCode: '',
    squadName: ''
  },

  onLaunch() {
    const openid = wx.getStorageSync('openid');
    const token = wx.getStorageSync('token');
    if (openid && token) {
      this.globalData.openid = openid;
      this.globalData.token = token;
    }
  }
})
