const api = require('../../utils/api.js');

Page({
  data: {
    inviteCode: '',
    errorMessage: '',
    loading: false
  },

  onUnload() {
    this.leaving = true;
  },

  handleRebind() {
    this.leaving = true;
    const app = getApp();
    app.globalData.inviteCode = '';
    app.globalData.squadName = '';
    wx.redirectTo({
      url: '/pages/registration/registration',
      fail: () => {
        this.leaving = false;
        this.setData({ errorMessage: '返回失败，请重试' });
      }
    });
  },

  onInputChange(e) {
    this.setData({
      inviteCode: e.detail.value || '',
      errorMessage: ''
    });
  },

  async handleVerify() {
    if (this.data.loading) return;

    const code = (this.data.inviteCode || '').trim();
    if (!code) {
      this.setData({ errorMessage: '请输入邀请码' });
      return;
    }

    const app = getApp();
    this.setData({ loading: true, errorMessage: '' });

    try {
      const data = await api.verifySquadInvite(code);
      if (this.leaving) return;
      app.globalData.inviteCode = code;
      app.globalData.squadName = data.squad_name || '';

      wx.redirectTo({ url: '/pages/user/user' });
    } catch (err) {
      if (this.leaving) return;
      this.setData({ errorMessage: err.message || '邀请码验证失败' });
    } finally {
      if (!this.leaving) this.setData({ loading: false });
    }
  }
})
