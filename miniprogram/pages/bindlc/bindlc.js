const LC_USERNAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{1,29}$/;
const ADMIN_CODE = 'CESA技术部';

function computeRuleStatus(raw) {
  const v = (raw || '').trim();
  return {
    length: v.length >= 2 && v.length <= 30 ? 'pass' : '',
    start:  v.length > 0 && /^[a-zA-Z_]/.test(v) ? 'pass' : '',
    chars:  v.length > 0 && /^[a-zA-Z0-9_]+$/.test(v) ? 'pass' : ''
  };
}

Page({
  data: {
    leetcodeUsername: '',
    errorMessage: '',
    loading: false,
    ruleStatus: { length: '', start: '', chars: '' },

    showAdminModal: false,
    adminCode: '',
    adminVerifyFailed: false
  },

  onLoad() {
    const app = getApp();
    if (!app.globalData.openid) {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },

  onInputChange(e) {
    const value = e.detail.value || '';
    this.setData({
      leetcodeUsername: value,
      errorMessage: '',
      ruleStatus: computeRuleStatus(value)
    });
  },

  validateUsername(rawValue) {
    const value = (rawValue || '').trim();

    if (!value) return '请输入LeetCode用户名';
    if (value.length < 2) return '用户名至少需要2个字符';
    if (value.length > 30) return '用户名不能超过30个字符';
    if (/^[0-9]/.test(value)) return '用户名不能以数字开头';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return '用户名只能包含字母、数字和下划线';
    if (!LC_USERNAME_REGEX.test(value)) return '用户名格式不正确';

    return '';
  },

  // ── 管理员验证弹窗 ──────────────────────────────
  openAdminModal() {
    this.setData({ showAdminModal: true, adminCode: '', adminVerifyFailed: false });
  },

  onAdminCodeInput(e) {
    this.setData({ adminCode: e.detail.value });
  },

  handleAdminVerify() {
    if (this.data.adminCode === ADMIN_CODE) {
      this.setData({ showAdminModal: false });
      wx.navigateTo({ url: '/pages/admin/admin' });
    } else {
      this.setData({ adminVerifyFailed: true });
    }
  },

  closeAdminModal() {
    this.setData({ showAdminModal: false, adminCode: '', adminVerifyFailed: false });
  },

  // ── 绑定 LC ──────────────────────────────────────
  handleBind() {
    if (this.data.loading) return;

    const errorMessage = this.validateUsername(this.data.leetcodeUsername);
    if (errorMessage) {
      this.setData({ errorMessage });
      return;
    }

    const username = this.data.leetcodeUsername.trim().toLowerCase();
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

        if (res.statusCode !== 200 || data.LC_bind_success === false) {
          this.setData({
            errorMessage: data.error_message || data.error || '绑定失败，请检查用户名后重试'
          });
          return;
        }

        app.globalData.userInfo = {
          ...(app.globalData.userInfo || {}),
          leetcode_username: username
        };

        wx.setStorageSync('registration_status', 1);
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
