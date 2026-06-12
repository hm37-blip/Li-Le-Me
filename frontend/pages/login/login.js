const auth = require('../../utils/auth.js');

Page({
  data: {
    loading: false
  },

  onLoad() {
  },

  handleWechatLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const app = getApp();

    // 生成稳定的设备标识，每个虚拟账号有独立 localStorage，所以 device_id 天然不同
    let deviceId = wx.getStorageSync('device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
      wx.setStorageSync('device_id', deviceId);
    }

    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.showToast({ title: '未获取到登录凭证，请重试', icon: 'none' });
          this.setData({ loading: false });
          return;
        }
        wx.request({
          url: `${app.globalData.baseUrl}/api/v1/user/login`,
          method: 'POST',
          data: { js_code: loginRes.code, device_id: deviceId },
          success: (res) => {
            const data = res.data || {};
            if (res.statusCode !== 200 || !data.openid) {
              wx.showToast({ title: data.error_message || '登录失败，请稍后重试', icon: 'none' });
              return;
            }

            app.globalData.openid = data.openid;
            app.globalData.token = data.token || '';
            app.globalData.userInfo = data.user_info || null;
            wx.setStorageSync('openid', data.openid);
            auth.setToken(data.token || '', data.refreshToken, data.expiresIn);
            wx.setStorageSync('registration_status', data.registration_status ?? 0);

            const status = Number(data.registration_status);
            if (status === 0) {
              wx.redirectTo({ url: '/pages/registration/registration' });
            } else if (status === 1) {
              wx.redirectTo({ url: '/pages/squad/squad' });
            } else {
              wx.redirectTo({ url: '/pages/home/home' });
            }
          },
          fail: () => { wx.showToast({ title: '网络异常，请检查后端服务是否启动', icon: 'none' }); },
          complete: () => { this.setData({ loading: false }); }
        });
      },
      fail: () => {
        wx.showToast({ title: '微信登录失败，请稍后重试', icon: 'none' });
        this.setData({ loading: false });
      }
    });
  }
})
