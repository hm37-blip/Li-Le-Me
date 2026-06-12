const api = require('../../utils/api.js');

Page({
  data: {
    nickname: '',
    leetcodeUsername: '',
    squadName: '',
    members: [],
    loadingMembers: false
  },

  async onShow() {
    const app = getApp();
    const token = api.auth.getToken() || app.globalData.token;
    if (!token) return;

    try {
      const data = await api.getUserStatus();
      const info = data.user_info || {};
      app.globalData.token = api.auth.getToken() || token;
      app.globalData.userInfo = info;
      this.setData({
        nickname: info.user_nickname || info.nickname || '',
        leetcodeUsername: info.leetcode_username || '',
        squadName: info.squad_name || ''
      });
    } catch (err) {
      console.error('获取用户状态失败:', err);
    }

    this.fetchMembers();
  },

  async fetchMembers() {
    const app = getApp();
    const token = api.auth.getToken() || app.globalData.token;
    if (!token) return;
    this.setData({ loadingMembers: true });
    try {
      const members = await api.getSquadMembers();
      if (Array.isArray(members)) {
        this.setData({ members });
      }
    } catch (err) {
      console.error('获取战队成员失败:', err);
    } finally {
      this.setData({ loadingMembers: false });
    }
  },

  goReport() {
    wx.navigateTo({ url: '/pages/index/report/report' });
  },

  handleLogout() {
    const deviceId = wx.getStorageSync('device_id');
    wx.clearStorageSync();
    if (deviceId) {
      wx.setStorageSync('device_id', deviceId);
    }
    const app = getApp();
    app.globalData.openid = '';
    app.globalData.token = '';
    app.globalData.userInfo = null;
    wx.reLaunch({ url: '/pages/login/login' });
  }
})
