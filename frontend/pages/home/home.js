Page({
  data: {
    nickname: '',
    leetcodeUsername: '',
    squadName: '',
    members: [],
    loadingMembers: false
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.token) return;

    wx.request({
      url: `${app.globalData.baseUrl}/api/user/status`,
      method: 'GET',
      header: { Authorization: `Bearer ${app.globalData.token}` },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const info = res.data.user_info || {};
          app.globalData.userInfo = info;
          this.setData({
            nickname: info.user_nickname || info.nickname || '',
            leetcodeUsername: info.leetcode_username || '',
            squadName: info.squad_name || ''
          });
        }
      }
    });

    this.fetchMembers();
  },

  fetchMembers() {
    const app = getApp();
    if (!app.globalData.token) return;
    this.setData({ loadingMembers: true });
    wx.request({
      url: `${app.globalData.baseUrl}/api/user/squad-members`,
      method: 'GET',
      header: { Authorization: `Bearer ${app.globalData.token}` },
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          this.setData({ members: res.data });
        }
      },
      complete: () => {
        this.setData({ loadingMembers: false });
      }
    });
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
