App({
  // 1. 整合了 Andy 的 lcId 和 Cici 的业务字段
  globalData: {
    baseUrl: 'http://localhost:8080',
    openid: '',
    token: '',
    userInfo: null,
    lcId: null,       // 保留 Andy 之后要用的标定字段
    inviteCode: '',   // 保留 Cici 的组队邀请码
    squadName: ''     // 保留 Cici 的战队名称
  },

  onLaunch() {
    // 2. 保留 Andy 的云开发初始化
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true });
    }

    // 3. 保留 Cici 的自动登录、状态校验与第二版的完整异常拦截
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

            // 根据注册状态自动重定向页面
            if (status === 0) {
              wx.redirectTo({ url: '/pages/registration/registration' });
            } else if (status === 1) {
              wx.redirectTo({ url: '/pages/squad/squad' });
            } else if (status >= 2) {
              // 注意：如果 home 是底部的 TabBar 页面，必须使用 switchTab 才能跳转成功
              wx.switchTab({ url: '/pages/home/home' });
            }
          } else {
            // 如果后端返回错误（如 401 鉴权失败），跳回登录页
            wx.redirectTo({ url: '/pages/login/login' });
          }
        },
        // 情况 B：连不上后端（网络断了或服务器没开）
        fail: () => {
          console.error('无法连接服务器，强制进入登录流程');
          wx.redirectTo({
            url: '/pages/login/login',
            fail: (err) => {
              console.error('跳转登录页失败，请检查 app.json 里的路径配置', err);
            }
          });
        }
      });
    } else {
      // 如果本地连 openid 或 token 都没有，直接去登录页
      wx.redirectTo({ url: '/pages/login/login' });
    }
  }
})