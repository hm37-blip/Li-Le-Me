Page({
  data: {
    squads: [],
    loadingSquads: false,
    fetchError: '',
    showForm: false,
    newSquadName: '',
    newInviteCode: '',
    newMaxMembers: '50',
    formError: '',
    submitting: false
  },

  onLoad() {
    this.fetchSquads();
  },

  onPullDownRefresh() {
    this.fetchSquads(() => wx.stopPullDownRefresh());
  },

  fetchSquads(callback) {
    const app = getApp();
    this.setData({ loadingSquads: true, fetchError: '' });
    wx.request({
      url: `${app.globalData.baseUrl}/api/admin/squads`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          this.setData({ squads: res.data });
        } else {
          this.setData({ fetchError: `加载失败（${res.statusCode}）：${res.data && res.data.error || '未知错误'}` });
        }
      },
      fail: () => {
        this.setData({ fetchError: '网络异常，请检查后端服务是否启动' });
      },
      complete: () => {
        this.setData({ loadingSquads: false });
        if (callback) callback();
      }
    });
  },

  handleBack() {
    wx.navigateBack();
  },

  handleLogout() {
    wx.clearStorageSync();
    const app = getApp();
    app.globalData.openid = '';
    app.globalData.token = '';
    app.globalData.userInfo = null;
    wx.reLaunch({ url: '/pages/login/login' });
  },

  toggleForm() {
    this.setData({
      showForm: !this.data.showForm,
      formError: '',
      newSquadName: '',
      newInviteCode: '',
      newMaxMembers: '50'
    });
  },

  onSquadNameInput(e) {
    this.setData({ newSquadName: e.detail.value, formError: '' });
  },

  onInviteCodeInput(e) {
    this.setData({ newInviteCode: e.detail.value, formError: '' });
  },

  onMaxMembersInput(e) {
    this.setData({ newMaxMembers: e.detail.value, formError: '' });
  },

  handleCreateSquad() {
    if (this.data.submitting) return;

    const name = this.data.newSquadName.trim();
    const code = this.data.newInviteCode.trim();
    const max = parseInt(this.data.newMaxMembers, 10);

    if (!name) { this.setData({ formError: '请输入战队名称' }); return; }
    if (!code) { this.setData({ formError: '请输入邀请码' }); return; }
    if (!max || max < 1 || max > 500) { this.setData({ formError: '人数上限请填 1–500' }); return; }

    const app = getApp();
    this.setData({ submitting: true, formError: '' });

    wx.request({
      url: `${app.globalData.baseUrl}/api/admin/squads`,
      method: 'POST',
      data: { squad_name: name, invite_code: code, max_members: max },
      success: (res) => {
        const data = res.data || {};
        if (res.statusCode !== 200 || !data.success) {
          this.setData({ formError: data.error_message || data.error || '创建失败' });
          return;
        }
        this.setData({ showForm: false });
        this.fetchSquads();
      },
      fail: () => {
        this.setData({ formError: '网络异常' });
      },
      complete: () => {
        this.setData({ submitting: false });
      }
    });
  }
})
