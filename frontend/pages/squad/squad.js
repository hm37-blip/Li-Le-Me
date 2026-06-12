const api = require('../../utils/api.js');

Page({
  data: {
    inviteCode: '',
    errorMessage: '',
    loading: false
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
      app.globalData.inviteCode = code;
      app.globalData.squadName = data.squad_name || '';

      wx.redirectTo({ url: '/pages/user/user' });
    } catch (err) {
      this.setData({ errorMessage: err.message || '邀请码验证失败' });
    } finally {
      this.setData({ loading: false });
    }
  }
})
