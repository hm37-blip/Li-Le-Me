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
  }
})
