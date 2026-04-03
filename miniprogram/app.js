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
    const status = wx.getStorageSync('registration_status');

    if (openid && token) {
      this.globalData.openid = openid;
      this.globalData.token = token;

      const s = Number(status);
      if (s === 1) {
        wx.redirectTo({ url: '/pages/invite/invite' });
      } else if (s === 2) {
        wx.redirectTo({ url: '/pages/home/home' });
      }
      // status 0 or unknown: stay on login page, which will auto-login
    }
  }
})
