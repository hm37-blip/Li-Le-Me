const api = require('../../utils/api.js');
const avatar = require('../../utils/avatar.js');
const DEFAULT_AVATAR = avatar.DEFAULT_AVATAR;
const NICKNAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9]{2,20}$/;

function generateRandomName() {
  const adjectives = ['快乐', '勤奋', '聪明', '努力', '坚持', '无敌', '厉害', '元气'];
  const nouns = ['刷题人', '码农', '选手', '学霸', '战士', '小将', '达人', '高手'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return adj + noun + num;
}

Page({
  data: {
    avatarUrl: DEFAULT_AVATAR,
    nickname: '',
    nicknameError: '',
    squadName: '',
    loading: false
  },

  onLoad() {
    const app = getApp();
    this.setData({
      nickname: generateRandomName(),
      squadName: app.globalData.squadName || ''
    });
  },

  onChooseAvatar(e) {
    const url = e.detail.avatarUrl;
    if (url) {
      this.setData({ avatarUrl: url });
    }
  },

  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value || '',
      nicknameError: ''
    });
  },

  validateNickname(value) {
    const v = (value || '').trim();
    if (!v) return '请输入昵称';
    if (v.length < 2) return '昵称至少需要2个字符';
    if (v.length > 20) return '昵称不能超过20个字符';
    if (!NICKNAME_REGEX.test(v)) return '昵称只能包含中文、英文和数字';
    return '';
  },

  async handleJoin() {
    if (this.data.loading) return;

    const nicknameError = this.validateNickname(this.data.nickname);
    if (nicknameError) {
      this.setData({ nicknameError });
      return;
    }

    const app = getApp();
    const nickname = this.data.nickname.trim();
    const selectedAvatar = this.data.avatarUrl;
    const inviteCode = app.globalData.inviteCode || '';
    const openid = app.globalData.openid || wx.getStorageSync('openid');

    if (!inviteCode) {
      wx.showToast({ title: '邀请码丢失，请返回重新输入', icon: 'none' });
      return;
    }
    if (!openid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true, nicknameError: '' });

    try {
      const avatarFileId = await avatar.uploadAvatar(selectedAvatar, openid);
      const data = await api.joinUserSquad(openid, inviteCode, nickname, avatarFileId);
      const displayAvatar = await avatar.resolveAvatarUrl(avatarFileId);
      avatar.saveAvatar(avatarFileId, displayAvatar);

      app.globalData.openid = openid;
      app.globalData.token = api.auth.getToken() || app.globalData.token;
      app.globalData.userInfo = {
        ...(app.globalData.userInfo || {}),
        user_nickname: nickname,
        avatar_file_id: avatarFileId,
        avatarUrl: displayAvatar,
        squad_name: data.squad_name || ''
      };
      wx.setStorageSync('userInfo', app.globalData.userInfo);

      wx.setStorageSync('registration_status', 2);
      wx.redirectTo({ url: '/pages/home/home' });
    } catch (err) {
      wx.showToast({ title: err.message || '加入失败，请重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
})
