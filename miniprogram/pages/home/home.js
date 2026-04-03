Page({
  data: {
    nickname: '',
    leetcodeUsername: ''
  },

  onShow() {
    const app = getApp();
    const userInfo = app.globalData.userInfo || {};
    this.setData({
      nickname: userInfo.user_nickname || userInfo.nickname || '',
      leetcodeUsername: userInfo.leetcode_username || ''
    });
  },

  handleLogout() {
    wx.clearStorageSync();
    const app = getApp();
    app.globalData.openid = '';
    app.globalData.token = '';
    app.globalData.userInfo = null;
    wx.reLaunch({ url: '/pages/login/login' });
  }
})
