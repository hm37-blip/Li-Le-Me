const api = require('./utils/api.js');
const env = require('./config/env.js');
const userInfoStore = require('./utils/user-info.js');

App({
  globalData: {
    apiMode: env.mode,
    openid: '',
    token: '',
    userInfo: null,
    inviteCode: '',
    squadName: '',
    lcId: null // lcId 加这里了
  },

  async onLaunch() {
    if (env.mode === 'cloud' && wx.cloud) {
      wx.cloud.init({
        env: env.cloudEnv,
        traceUser: true
      });
    }

    const openid = wx.getStorageSync('openid');
    const token = api.auth.getToken() || wx.getStorageSync('token');

    if (openid && token) {
      this.globalData.openid = openid;
      this.globalData.token = token;

      try {
        const data = await api.getUserStatus();
        this.globalData.token = api.auth.getToken() || token;
        userInfoStore.saveUserInfo(data.user_info || null);
        const status = Number(data.registration_status);
        wx.setStorageSync('registration_status', status);

        if (status === 0) {
          wx.redirectTo({ url: '/pages/registration/registration' });
        } else if (status === 1) {
          wx.redirectTo({ url: '/pages/squad/squad' });
        } else if (status >= 2) {
          wx.redirectTo({ url: '/pages/home/home' });
        }
      } catch (err) {
        console.error('无法获取用户状态，强制进入登录流程', err);
        wx.redirectTo({
          url: '/pages/login/login',
          fail: (navErr) => {
            console.error('跳转登录页失败，请检查 app.json 里的路径', navErr);
          }
        });
      }
    } else {
      // 如果本地连 openid 都没有，直接去登录页
      wx.redirectTo({ url: '/pages/login/login' });
    }
  }
})
