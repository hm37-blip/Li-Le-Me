App({
  // 1.保留了 Andy 的 lcId和 Cici 的业务字段
  globalData: {
    baseUrl: 'http://localhost:8080',
    openid: '',
    token: '',
    userInfo: null,
    lcId: null,      // 保留 Andy 之后要用的 LC ID 字段
    inviteCode: '',
    squadName: ''
  },

  onLaunch() {
    // 2. 保留 Andy 的云开发初始化
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true });
    }

    // 3. 保留 Cici 的自动登录和状态校验
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

            // 根据注册状态自动重定向页面
            if (status === 0) {
              wx.redirectTo({ url: '/pages/registration/registration' });
            } else if (status === 1) {
              wx.redirectTo({ url: '/pages/squad/squad' });
            } else if (status >= 2) {
              wx.redirectTo({ url: '/pages/home/home' });
            }
          }
        }
      });
    }
  }
})