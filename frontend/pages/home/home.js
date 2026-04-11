#home.js
/**
 * home.js - Lileme
 * Logic: Includes user status validation, retrieving team members, sharing, and logout functionality
 */
/**
 * home.js - E-PickUp & 力了么 核心首页
 * 整合：Wendy (Product Lead)
 * 逻辑：包含用户状态校验、战队成员拉取、分享及注销功能
 */
const api = require('../../../utils/api.js')

Page({
  data: {
    // 基础用户信息（整合 Cici 的精细结构）
    myInfo: {
      nickname: '',
      lcId: '',
      openid: '',
      rank: 0,
      dailySteps: 0,
      totalSolved: 0,
      rankTier: '-',
      avatarUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFA116"/%3E%3Ccircle cx="50" cy="35" r="18" fill="white"/%3E%3Cpath d="M20 85 Q20 55 50 55 Q80 55 80 85 Z" fill="white"/%3E%3C/svg%3E'
    },
    
    // 战队数据（整合 Andy 的接口需求）
    squadName: 'LeetCode 刷题战队',
    members: [],
    loadingMembers: false,
    teamMemberLimit: 50
  },

  onLoad() {
    // 初始加载
    this.refreshPageData();
  },

  onShow() {
    // 页面回显时刷新，确保状态同步
    this.refreshPageData();
  },

  /**
   * 核心：刷新页面数据（整合 Andy 的 Token 校验逻辑）
   */
  refreshPageData() {
    const app = getApp();
    
    // 1. 防御性编程：如果没有 Token，强制跳转登录页
    if (!app.globalData.token) {
      console.warn('未检测到登录凭证，正在跳转...');
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }

    // 2. 拉取用户信息（Andy 的接口逻辑）
    this.fetchUserStatus();

    // 3. 拉取战队成员（Andy 的接口逻辑）
    this.fetchMembers();
  },

  /**
   * 获取用户实时状态（Andy 的 /api/user/status）
   */
  fetchUserStatus() {
    const app = getApp();
    wx.request({
      url: `${app.globalData.baseUrl}/api/user/status`,
      method: 'GET',
      header: { Authorization: `Bearer ${app.globalData.token}` },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const info = res.data.user_info || {};
          app.globalData.userInfo = info;
          
          this.setData({
            'myInfo.nickname': info.user_nickname || info.nickname || '未命名',
            'myInfo.lcId': info.leetcode_username || 'Guest',
            'squadName': info.squad_name || '我的战队'
          });
        }
      }
    });
  },

  /**
   * 获取战队成员列表（Andy 的 /api/user/squad-members）
   */
  fetchMembers() {
    const app = getApp();
    this.setData({ loadingMembers: true });
    
    wx.request({
      url: `${app.globalData.baseUrl}/api/user/squad-members`,
      method: 'GET',
      header: { Authorization: `Bearer ${app.globalData.token}` },
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          this.setData({ members: res.data });
        }
      },
      complete: () => {
        this.setData({ loadingMembers: false });
      }
    });
  },

  /**
   * 下拉刷新（采用 Cici 的用户体验逻辑）
   */
  onPullDownRefresh() {
    this.refreshPageData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 分享战绩（采用 Cici 的分享文案逻辑）
   */
  onShareAppMessage() {
    const { lcId, totalSolved } = this.data.myInfo;
    return {
      title: `我在「力了吗」已刷题 ${totalSolved} 道！`,
      path: '/frontend/pages/home/home',
      imageUrl: '/frontend/static/images/share-cover.png'
    };
  },

  /**
   * 退出登录（采用 Andy 的缓存清理逻辑）
   */
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const deviceId = wx.getStorageSync('device_id');
          wx.clearStorageSync();
          if (deviceId) {
            wx.setStorageSync('device_id', deviceId);
          }
          const app = getApp();
          app.globalData.token = '';
          app.globalData.userInfo = null;
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
})
