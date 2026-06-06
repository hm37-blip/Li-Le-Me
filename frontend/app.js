App({
  globalData: {
    baseUrl: 'http://localhost:8080',
    openid: '',
    token: '',
    userInfo: null,
    inviteCode: '',
    squadName: '',
    lcId: null // lcId 加这里了
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
        header: {
          Authorization: `Bearer ${token}`
        },
        // 情况 A：成功连上后端
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            const data = res.data;
            this.globalData.userInfo = data.user_info || null;
            const status = Number(data.registration_status);
            wx.setStorageSync('registration_status', status);

            if (status === 0) {
              wx.redirectTo({ url: '/pages/registration/registration' });
            } else if (status === 1) {
              wx.redirectTo({ url: '/pages/squad/squad' });
            } else if (status >= 2) {
              wx.redirectTo({ url: '/pages/home/home' });
            }
          } else {
            // 如果后端返回错误（如 401），也跳回登录页
            wx.redirectTo({ url: '/pages/login/login' });
          }
        },
        // 情况 B：连不上后端（网络断了或服务器没开）
        fail: () => {
          console.error('无法连接服务器，强制进入登录流程');
          wx.redirectTo({
            url: '/pages/login/login',
            fail: (err) => {
              console.error('跳转登录页失败，请检查 app.json 里的路径', err);
            }
          });
        }
      });
    } else {
      // 如果本地连 openid 都没有，直接去登录页
      wx.redirectTo({ url: '/pages/login/login' });
    }
  }
})

