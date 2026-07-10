const auth = require('../../utils/auth.js');
const api = require('../../utils/api.js');

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
        // 游客模式 / 测试号下 wx.login 可能拿不到 code（err 41002），后端 mock 不校验 code，用兜底值
        this.sendLogin(loginRes.code || 'dev_mock_code', deviceId);
      },
      fail: () => {
        // 游客模式下 wx.login 直接失败，仍走 mock 登录（后端按 device_id 生成 openid）
        this.sendLogin('dev_mock_code', deviceId);
      }
    });
  },

  sendLogin(jsCode, deviceId) {
    const app = getApp();
    api.login(jsCode, deviceId)
      .then(data => {
        if (!data.openid) {
          throw new Error(data.error_message || '登录失败，请稍后重试');
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
      })
      .catch(err => {
        console.error('[LOGIN_FAIL]', err);
        wx.showToast({ title: err.message || err.errMsg || '网络异常，请检查后端服务', icon: 'none' });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  }
})
