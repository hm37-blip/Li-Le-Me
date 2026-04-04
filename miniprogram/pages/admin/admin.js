Page({
  data: {
    squads: [],
    loadingSquads: false,
    fetchError: '',

    expandedSquadId: null,
    squadMembers: {},

    showNewSquadForm: false,
    newSquadName: '',
    newInviteCode: '',
    newMaxMembers: '50',
    squadFormError: '',
    submittingSquad: false,


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

  // ── 查看 / 收起成员 ──────────────────────────
  toggleMembers(e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.expandedSquadId === id) {
      this.setData({ expandedSquadId: null });
      return;
    }
    const app = getApp();
    wx.request({
      url: `${app.globalData.baseUrl}/api/admin/squads/${id}/members`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ [`squadMembers.${id}`]: res.data || [], expandedSquadId: id });
        } else {
          wx.showToast({ title: '加载成员失败', icon: 'none' });
        }
      },
      fail: () => { wx.showToast({ title: '网络异常', icon: 'none' }); }
    });
  },

  // ── 删除战队 ──────────────────────────────────
  deleteSquad(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    wx.showModal({
      title: '确认删除',
      content: `删除「${name}」后，该战队所有成员将被踢出，此操作不可恢复。`,
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (!res.confirm) return;
        const app = getApp();
        wx.request({
          url: `${app.globalData.baseUrl}/api/admin/squads/${id}`,
          method: 'DELETE',
          success: (r) => {
            if (r.statusCode === 200) {
              wx.showToast({ title: '已删除', icon: 'success' });
              this.fetchSquads();
            } else {
              wx.showToast({ title: `删除失败（${r.statusCode}）`, icon: 'none' });
            }
          },
          fail: () => { wx.showToast({ title: '网络异常，删除失败', icon: 'none' }); }
        });
      }
    });
  },

  // ── 新建战队表单 ──────────────────────────────
  toggleNewSquadForm() {
    this.setData({ showNewSquadForm: !this.data.showNewSquadForm, squadFormError: '' });
  },

  onSquadNameInput(e) { this.setData({ newSquadName: e.detail.value, squadFormError: '' }); },
  onInviteCodeInput(e) { this.setData({ newInviteCode: e.detail.value, squadFormError: '' }); },
  onMaxMembersInput(e) { this.setData({ newMaxMembers: e.detail.value, squadFormError: '' }); },

  handleCreateSquad() {
    if (this.data.submittingSquad) return;
    const name = this.data.newSquadName.trim();
    const code = this.data.newInviteCode.trim();
    const max = parseInt(this.data.newMaxMembers, 10);
    if (!name) { this.setData({ squadFormError: '请输入战队名称' }); return; }
    if (!code) { this.setData({ squadFormError: '请输入邀请码' }); return; }
    if (!max || max < 1 || max > 500) { this.setData({ squadFormError: '人数上限请填 1–500' }); return; }

    const app = getApp();
    this.setData({ submittingSquad: true, squadFormError: '' });
    wx.request({
      url: `${app.globalData.baseUrl}/api/admin/squads`,
      method: 'POST',
      data: { squad_name: name, invite_code: code, max_members: max },
      success: (res) => {
        const data = res.data || {};
        if (res.statusCode !== 200 || !data.success) {
          this.setData({ squadFormError: data.error_message || data.error || '创建失败' });
          return;
        }
        this.setData({ showNewSquadForm: false, newSquadName: '', newInviteCode: '', newMaxMembers: '50' });
        this.fetchSquads();
      },
      fail: () => { this.setData({ squadFormError: '网络异常' }); },
      complete: () => { this.setData({ submittingSquad: false }); }
    });
  },

  removeMember(e) {
    const squadId = e.currentTarget.dataset.squadId;
    const userId = e.currentTarget.dataset.userId;
    const name = e.currentTarget.dataset.name || '该成员';
    wx.showModal({
      title: '确认移除',
      content: `确定将「${name}」从战队中移除？`,
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (!res.confirm) return;
        const app = getApp();
        wx.request({
          url: `${app.globalData.baseUrl}/api/admin/squads/${squadId}/members/${userId}`,
          method: 'DELETE',
          success: (r) => {
            if (r.statusCode === 200) {
              wx.showToast({ title: '已移除', icon: 'success' });
              this.toggleMembers({ currentTarget: { dataset: { id: squadId } } });
              this.fetchSquads();
            } else {
              wx.showToast({ title: `移除失败（${r.statusCode}）`, icon: 'none' });
            }
          },
          fail: () => { wx.showToast({ title: '网络异常', icon: 'none' }); }
        });
      }
    });
  },

  // ── 通用 ──────────────────────────────────────
  handleBack() { wx.navigateBack(); },

  handleLogout() {
    wx.clearStorageSync();
    const app = getApp();
    app.globalData.openid = '';
    app.globalData.token = '';
    app.globalData.userInfo = null;
    wx.reLaunch({ url: '/pages/login/login' });
  }
})
