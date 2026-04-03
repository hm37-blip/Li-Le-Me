const LC_USERNAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{1,29}$/;

Page({
  data: {
    leetcodeUsername: '',
    errorMessage: '',
    loading: false
  },

  onInputChange(e) {
    this.setData({
      leetcodeUsername: e.detail.value || '',
      errorMessage: ''
    });
  },

  validateUsername(rawValue) {
    const value = (rawValue || '').trim();

    if (!value) {
      return '请输入LeetCode用户名';
    }
    if (value.length < 2) {
      return '用户名至少需要2个字符';
    }
    if (value.length > 30) {
      return '用户名不能超过30个字符';
    }
    if (/^[0-9]/.test(value)) {
      return '用户名不能以数字开头';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return '用户名只能包含字母、数字和下划线';
    }
    if (!LC_USERNAME_REGEX.test(value)) {
      return '用户名格式不正确';
    }

    return '';
  },

  handleBind() {
    if (this.data.loading) return;

    const errorMessage = this.validateUsername(this.data.leetcodeUsername);
    if (errorMessage) {
      this.setData({ errorMessage });
      return;
    }

    const username = this.data.leetcodeUsername.trim();
    const app = getApp();

    this.setData({ loading: true, errorMessage: '' });

    wx.request({
      url: `${app.globalData.baseUrl}/api/user/bindlc`,
      method: 'POST',
      data: {
        openid: app.globalData.openid,
        leetcode_username: username
      },
      header: {
        Authorization: app.globalData.token ? `Bearer ${app.globalData.token}` : ''
      },
      success: (res) => {
        const data = res.data || {};
        const bindSuccess = data.LC_bind_success !== false;

        if (res.statusCode !== 200 || !bindSuccess) {
          const serverErrorMessage = data.error_message || '';
          this.setData({
            errorMessage: serverErrorMessage.includes('已存在')
              ? serverErrorMessage
              : serverErrorMessage || '绑定失败，请检查用户名后重试'
          });
          return;
        }

        app.globalData.userInfo = {
          ...(app.globalData.userInfo || {}),
          leetcode_username: username
        };

        wx.redirectTo({ url: '/pages/invite/invite' });
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
