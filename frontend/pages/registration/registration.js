const api = require('../../utils/api.js');
const LC_USERNAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{2,29}$/;
const ADMIN_CODE = 'xyz123'; // TODO: [Security] Move to backend before Product launch

function computeRuleStatus(raw) {
  const v = (raw || '').trim();
  return {
    length: v.length >= 3 && v.length <= 30 ? 'pass' : '',
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
    // DEV: 正式上线前取消注释下面两行
    // const app = getApp();
    // if (!app.globalData.openid) wx.redirectTo({ url: '/pages/login/login' });
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
    if (value.length < 3) return '用户名至少需要3个字符';
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
  async handleBind() {
    if (this.data.loading) return;

    const errorMessage = this.validateUsername(this.data.leetcodeUsername);
    if (errorMessage) {
      this.setData({ errorMessage });
      return;
    }

    const username = this.data.leetcodeUsername.trim().toLowerCase();
    const app = getApp();
    const openid = app.globalData.openid || wx.getStorageSync('openid');

    if (!openid) {
      this.setData({ errorMessage: '请先登录' });
      return;
    }

    this.setData({ loading: true, errorMessage: '' });

    try {
      await api.bindLeetCodeAccount(openid, username);

      app.globalData.userInfo = {
        ...(app.globalData.userInfo || {}),
        leetcode_username: username
      };

      app.globalData.openid = openid;
      app.globalData.token = api.auth.getToken() || app.globalData.token;
      app.globalData.lcId = username;
      wx.setStorageSync('lcId', username);
      wx.setStorageSync('registration_status', 1);
      wx.redirectTo({ url: '/pages/squad/squad' });
    } catch (err) {
      this.setData({
        errorMessage: err.message || '绑定失败，请检查用户名后重试'
      });
    } finally {
      this.setData({ loading: false });
    }
  }
})
