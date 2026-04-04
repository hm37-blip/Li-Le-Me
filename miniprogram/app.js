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

      wx.request({
        url: `${this.globalData.baseUrl}/api/user/status`,
        method: 'GET',
        header: { Authorization: `Bearer ${token}` },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            const data = res.data;
            this.globalData.userInfo = data.user_info || null;
            const status = Number(data.registration_status);
            wx.setStorageSync('registration_status', status);

            if (status === 0) {
              wx.redirectTo({ url: '/pages/bindlc/bindlc' });
            } else if (status === 1) {
              wx.redirectTo({ url: '/pages/invite/invite' });
            } else if (status >= 2) {
              wx.redirectTo({ url: '/pages/home/home' });
            }
          }
        }
      });
    }
  }
})
