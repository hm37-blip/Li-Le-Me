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

    showAddPlayerForm: false,
    playerOpenid: '',
    playerNickname: '',
    playerLC: '',
    playerFormError: '',
    submittingPlayer: false
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

  // ── 添加玩家表单 ──────────────────────────────
  toggleAddPlayerForm() {
    this.setData({ showAddPlayerForm: !this.data.showAddPlayerForm, playerFormError: '' });
  },

  onPlayerOpenidInput(e) { this.setData({ playerOpenid: e.detail.value, playerFormError: '' }); },
  onPlayerNicknameInput(e) { this.setData({ playerNickname: e.detail.value, playerFormError: '' }); },
  onPlayerLCInput(e) { this.setData({ playerLC: e.detail.value, playerFormError: '' }); },

  handleAddPlayer() {
    if (this.data.submittingPlayer) return;
    const openid = this.data.playerOpenid.trim();
    const nickname = this.data.playerNickname.trim();
    const lc = this.data.playerLC.trim();
    if (!openid) { this.setData({ playerFormError: '请输入玩家 openid' }); return; }
    if (!nickname) { this.setData({ playerFormError: '请输入昵称' }); return; }
    if (!lc) { this.setData({ playerFormError: '请输入 LeetCode 用户名' }); return; }

    const app = getApp();
    this.setData({ submittingPlayer: true, playerFormError: '' });
    wx.request({
      url: `${app.globalData.baseUrl}/api/admin/users`,
      method: 'POST',
      data: { openid, nickname, leetcode_username: lc },
      success: (res) => {
        const data = res.data || {};
        if (res.statusCode !== 200 || !data.success) {
          this.setData({ playerFormError: data.error_message || data.error || '添加失败' });
          return;
        }
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.setData({ showAddPlayerForm: false, playerOpenid: '', playerNickname: '', playerLC: '' });
        this.fetchSquads();
      },
      fail: () => { this.setData({ playerFormError: '网络异常' }); },
      complete: () => { this.setData({ submittingPlayer: false }); }
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
