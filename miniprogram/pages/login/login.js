Page({
  data: {
    loading: false,
    notAuthorized: false,
    myOpenid: ''
  },

  onLoad() {
    const app = getApp();
    if (app.globalData.openid && app.globalData.token) {
      const status = Number(wx.getStorageSync('registration_status'));
      if (status === 1) {
        wx.redirectTo({ url: '/pages/invite/invite' });
        return;
      } else if (status === 2) {
        wx.redirectTo({ url: '/pages/home/home' });
        return;
      }
    }
    this.handleWechatLogin();
  },

  handleWechatLogin() {
    if (this.data.loading) return;

    this.setData({ loading: true });
    const app = getApp();

    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          this.handleLoginFail('未获取到登录凭证，请重试');
          return;
        }

        wx.request({
          url: `${app.globalData.baseUrl}/api/wechat/login`,
          method: 'POST',
          data: {
            js_code: loginRes.code
          },
          success: (res) => {
            const data = res.data || {};
            if (res.statusCode !== 200 || !data.openid) {
              this.handleLoginFail(data.error_message || '登录失败，请稍后重试');
              return;
            }

            app.globalData.openid = data.openid || '';
            app.globalData.token = data.token || '';
            app.globalData.userInfo = data.user_info || null;

            wx.setStorageSync('openid', data.openid || '');
            wx.setStorageSync('token', data.token || '');
            wx.setStorageSync('registration_status', data.registration_status ?? '');

            const status = Number(data.registration_status);
            if (status === -1) {
              this.setData({ notAuthorized: true, myOpenid: data.openid || '' });
              return;
            } else if (status === 0) {
              wx.redirectTo({ url: '/pages/bindlc/bindlc' });
            } else if (status === 1) {
              wx.redirectTo({ url: '/pages/invite/invite' });
            } else {
              wx.redirectTo({ url: '/pages/home/home' });
            }
          },
          fail: () => {
            this.handleLoginFail('网络异常，请检查后端服务是否启动');
          },
          complete: () => {
            this.setData({ loading: false });
          }
        });
      },
      fail: () => {
        this.handleLoginFail('微信登录失败，请稍后重试');
        this.setData({ loading: false });
      }
    });
  },

  handleLoginFail(message) {
    wx.showToast({
      title: message,
      icon: 'none'
    });
  }
})
