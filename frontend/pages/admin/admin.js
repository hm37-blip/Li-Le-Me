// 名称规则：3-30个汉字/数字/英文字母
const NAME_REGEX = /^[\u4e00-\u9fa50-9a-zA-Z]{3,30}$/;
const TIMEOUT = 10000;

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

Page({
  data: {
    squads: [],
    loadingSquads: false,
    fetchError: '',

    showCreateModal: false,
    form: { name: '', code: '', max: '50' },
    formError: '',
    submittingForm: false,

    showEditModal: false,
    editingSquadId: null,
    editForm: { name: '', code: '', max: '50' },
    editFormError: '',
    submittingEdit: false,
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
      timeout: TIMEOUT,
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const squads = res.data.map(s => ({
            ...s,
            id: Number(s.id),
            members: [],
            membersPreview: [],
            membersLoaded: false,
            showAll: false,
          }));
          this.setData({ squads });
          squads.forEach((sq, idx) => this.fetchMembersForSquad(idx, sq.id));
        } else {
          this.setData({ fetchError: `加载失败（${res.statusCode}）` });
        }
      },
      fail: () => {
        this.setData({ fetchError: '连接失败，请确认后端服务已启动' });
      },
      complete: () => {
        this.setData({ loadingSquads: false });
        if (callback) callback();
      }
    });
  },

  fetchMembersForSquad(idx, squadId) {
    const app = getApp();
    wx.request({
      url: `${app.globalData.baseUrl}/api/admin/squads/${squadId}/members`,
      method: 'GET',
      timeout: TIMEOUT,
      success: (res) => {
        if (res.statusCode === 200) {
          const members = (res.data || []).map(m => ({
            ...m,
            avatarChar: (m.nickname || '?').charAt(0)
          }));
          this.setData({
            [`squads[${idx}].members`]: members,
            [`squads[${idx}].membersPreview`]: members.slice(0, 3),
            [`squads[${idx}].membersLoaded`]: true,
          });
        } else {
          this.setData({ [`squads[${idx}].membersLoaded`]: true });
        }
      },
      fail: () => {
        this.setData({ [`squads[${idx}].membersLoaded`]: true });
      }
    });
  },

  // ── 表单校验 ─────────────────────────────────────────
  validateForm(form, excludeId = null) {
    const name = (form.name || '').trim();
    const code = (form.code || '').trim();
    const max  = parseInt(form.max, 10);
    const exId = excludeId !== null ? Number(excludeId) : null;

    if (!name) return '请输入战队名称';
    if (!NAME_REGEX.test(name)) return '名称须为3-30个汉字、数字或英文字母，不含空格';
    if (!code) return '请输入邀请码';
    if (isNaN(max) || max < 5 || max > 50) return '人数上限须在5到50之间';

    for (const sq of this.data.squads) {
      if (exId !== null && sq.id === exId) continue;
      if (sq.squad_name === name) return '战队名称已存在，请换一个';
      if (sq.invite_code === code) return '邀请码已存在，请换一个';
    }
    return '';
  },

  // ── 创建战队 ──────────────────────────────────────────
  openCreateModal() {
    this.setData({
      showCreateModal: true,
      form: { name: '', code: generateInviteCode(), max: '50' },
      formError: '',
    });
  },

  closeCreateModal() {
    this.setData({ showCreateModal: false });
  },

  onFormNameInput(e) { this.setData({ 'form.name': e.detail.value, formError: '' }); },
  onFormCodeInput(e) { this.setData({ 'form.code': e.detail.value, formError: '' }); },
  onFormMaxInput(e)  { this.setData({ 'form.max':  e.detail.value, formError: '' }); },

  handleCreateSquad() {
    if (this.data.submittingForm) return;
    const err = this.validateForm(this.data.form);
    if (err) { this.setData({ formError: err }); return; }

    const { name, code, max } = this.data.form;
    const app = getApp();
    this.setData({ submittingForm: true, formError: '' });
    wx.request({
      url: `${app.globalData.baseUrl}/api/admin/squads`,
      method: 'POST',
      timeout: TIMEOUT,
      data: { squad_name: name.trim(), invite_code: code.trim(), max_members: parseInt(max, 10) },
      success: (res) => {
        const data = res.data || {};
        if (res.statusCode !== 200 || !data.success) {
          this.setData({ formError: data.error_message || data.error || '创建失败' });
          return;
        }
        this.setData({ showCreateModal: false });
        this.fetchSquads();
      },
      fail: () => { this.setData({ formError: '网络异常，请检查后端服务' }); },
      complete: () => { this.setData({ submittingForm: false }); }
    });
  },

  // ── 修改战队 ──────────────────────────────────────────
  openEditModal(e) {
    const { id, name, code, max } = e.currentTarget.dataset;
    this.setData({
      showEditModal: true,
      editingSquadId: Number(id),
      editForm: { name, code, max: String(max) },
      editFormError: '',
    });
  },

  closeEditModal() {
    this.setData({ showEditModal: false, editingSquadId: null });
  },

  onEditFormNameInput(e) { this.setData({ 'editForm.name': e.detail.value, editFormError: '' }); },
  onEditFormCodeInput(e) { this.setData({ 'editForm.code': e.detail.value, editFormError: '' }); },
  onEditFormMaxInput(e)  { this.setData({ 'editForm.max':  e.detail.value, editFormError: '' }); },

  handleEditSquad() {
    if (this.data.submittingEdit) return;
    const err = this.validateForm(this.data.editForm, this.data.editingSquadId);
    if (err) { this.setData({ editFormError: err }); return; }

    const { name, code, max } = this.data.editForm;
    const id = this.data.editingSquadId;
    const app = getApp();
    this.setData({ submittingEdit: true, editFormError: '' });
    wx.request({
      url: `${app.globalData.baseUrl}/api/admin/squads/${id}`,
      method: 'PUT',
      timeout: TIMEOUT,
      data: { squad_name: name.trim(), invite_code: code.trim(), max_members: parseInt(max, 10) },
      success: (res) => {
        const data = res.data || {};
        if (res.statusCode !== 200 || !data.success) {
          this.setData({ editFormError: data.error_message || data.error || '修改失败' });
          return;
        }
        this.setData({ showEditModal: false, editingSquadId: null });
        this.fetchSquads();
      },
      fail: () => { this.setData({ editFormError: '网络异常，请检查后端服务' }); },
      complete: () => { this.setData({ submittingEdit: false }); }
    });
  },

  // ── 展开/收起全部成员 ─────────────────────────────────
  toggleShowAll(e) {
    const id = Number(e.currentTarget.dataset.id);
    const idx = this.data.squads.findIndex(s => s.id === id);
    if (idx < 0) return;
    this.setData({ [`squads[${idx}].showAll`]: !this.data.squads[idx].showAll });
  },

  // ── 删除战队 ──────────────────────────────────────────
  deleteSquad(e) {
    const id   = e.currentTarget.dataset.id;
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
          timeout: TIMEOUT,
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

  // ── 踢除成员 ──────────────────────────────────────────
  removeMember(e) {
    const squadId = e.currentTarget.dataset.squadId;
    const userId  = e.currentTarget.dataset.userId;
    const name    = e.currentTarget.dataset.name || '该成员';
    wx.showModal({
      title: '确认踢除',
      content: `确定将「${name}」踢出战队？`,
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (!res.confirm) return;
        const app = getApp();
        wx.request({
          url: `${app.globalData.baseUrl}/api/admin/squads/${squadId}/members/${userId}`,
          method: 'DELETE',
          timeout: TIMEOUT,
          success: (r) => {
            if (r.statusCode === 200) {
              wx.showToast({ title: '已踢除', icon: 'success' });
              this.fetchSquads();
            } else {
              wx.showToast({ title: `踢除失败（${r.statusCode}）`, icon: 'none' });
            }
          },
          fail: () => { wx.showToast({ title: '网络异常', icon: 'none' }); }
        });
      }
    });
  },

  // 阻止弹窗内部点击冒泡到遮罩层
  noop() {},

  // ── 退出 ──────────────────────────────────────────────
  handleLogout() {
    wx.clearStorageSync();
    const app = getApp();
    app.globalData.openid = '';
    app.globalData.token  = '';
    app.globalData.userInfo = null;
    wx.reLaunch({ url: '/pages/login/login' });
  }
});
