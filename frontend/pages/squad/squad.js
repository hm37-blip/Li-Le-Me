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

  handleVerify() {
    if (this.data.loading) return;

    const code = (this.data.inviteCode || '').trim();
    if (!code) {
      this.setData({ errorMessage: '请输入邀请码' });
      return;
    }

    const app = getApp();
    this.setData({ loading: true, errorMessage: '' });

    wx.request({
      url: `${app.globalData.baseUrl}/api/v1/squad/verify`,
      method: 'POST',
      data: { invite_code: code },
      success: (res) => {
        const data = res.data || {};
        if (res.statusCode !== 200 || !data.valid) {
          this.setData({ errorMessage: data.error_msg || '邀请码验证失败' });
          return;
        }

        app.globalData.inviteCode = code;
        app.globalData.squadName = data.squad_name || '';

        wx.redirectTo({ url: '/pages/user/user' });
      },
      fail: () => {
        this.setData({ errorMessage: '网络异常，请检查后端服务' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  }
})
