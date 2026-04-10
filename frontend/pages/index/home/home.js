const api = require('../../../utils/api.js')

Page({
  data: {
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

    teamName: 'LeetCode 刷题战队',
    teamMemberCount: 0,
    teamMemberLimit: 50,
    rankList: [],
    loading: false
  },

  onLoad() {
    this.loadUserInfo()
    this.fetchLeaderboard()
  },

  onShow() {
    // 页面显示时刷新头像和用户信息
    this.loadUserInfo()
  },

  /**
   * 加载用户信息（从全局数据和本地存储）
   */
  loadUserInfo() {
    const app = getApp()
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFA116"/%3E%3Ccircle cx="50" cy="35" r="18" fill="white"/%3E%3Cpath d="M20 85 Q20 55 50 55 Q80 55 80 85 Z" fill="white"/%3E%3C/svg%3E'

    // 获取 lcId 和 openid
    const lcId = app.globalData.lcId || wx.getStorageSync('lcId') || 'Guest'
    const openid = app.globalData.openid || wx.getStorageSync('openid') || ''

    // 获取头像（优先从本地存储）
    const savedAvatar = wx.getStorageSync('userAvatar') || defaultAvatar

    this.setData({
      'myInfo.lcId': lcId,
      'myInfo.openid': openid,
      'myInfo.avatarUrl': savedAvatar
    })
  },


  /**
   * 获取排行榜数据 - 直接使用 wx.request 调用 Dennis 的接口
   */
  fetchLeaderboard() {
    this.setData({ loading: true })

    const app = getApp()
    const baseUrl = app.globalData.baseUrl || 'http://localhost:8080'
    const currentOpenid = app.globalData.openid || wx.getStorageSync('openid')

    wx.request({
      url: `${baseUrl}/api/ranking`,
      method: 'GET',
      data: { type: 'total' },
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.token || ''}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          // 适配后端返回格式
          const leaderboard = Array.isArray(res.data) ? res.data : (res.data.data || [])

          let myInfo = this.data.myInfo
          const myRankData = leaderboard.find(item => item.openid === currentOpenid)

          if (myRankData) {
            myInfo = {
              ...myInfo,
              nickname: myRankData.nickname || myInfo.lcId,
              rank: myRankData.rank || 0,
              dailySteps: myRankData.dailySteps || 0,
              totalSolved: myRankData.totalSolved || 0,
              rankTier: myRankData.rankTier || '-',
              avatarUrl: myRankData.avatarUrl || myInfo.avatarUrl
            }
          }

          this.setData({
            rankList: leaderboard.slice(0, 50),
            myInfo,
            teamMemberCount: Math.min(leaderboard.length, 50),
            loading: false
          })
        } else {
          console.error('获取排行榜失败:', res.statusCode, res.data)
          this.setData({
            rankList: [],
            teamMemberCount: 0,
            loading: false
          })
          wx.showToast({
            title: '加载失败',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (err) => {
        console.error('请求排行榜接口失败:', err)
        this.setData({
          rankList: [],
          teamMemberCount: 0,
          loading: false
        })
        wx.showToast({
          title: '网络异常',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.fetchLeaderboard().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 分享战绩
   */
  shareAchievement() {
    const { lcId, rank, totalSolved, dailySteps, rankTier } = this.data.myInfo

    // 生成分享文案
    const shareText = `我在「力了吗」已刷题 ${totalSolved} 道！\n当前排名：第 ${rank} 名\n段位等级：${rankTier}\n今日积分：${dailySteps}\n\n一起来卷 LeetCode 吧！`

    // 方式一：调用微信分享（需要用户主动触发分享按钮）
    // 这里我们弹出提示，让用户点击右上角分享
    wx.showModal({
      title: '分享战绩',
      content: '点击右上角「...」按钮，即可分享到微信好友或朋友圈！',
      showCancel: true,
      cancelText: '取消',
      confirmText: '复制文案',
      success: (res) => {
        if (res.confirm) {
          // 复制分享文案到剪贴板
          wx.setClipboardData({
            data: shareText,
            success: () => {
              wx.showToast({
                title: '文案已复制',
                icon: 'success',
                duration: 2000
              })
            }
          })
        }
      }
    })

    // 方式二：生成分享海报（需要后端支持）
    // this.generateSharePoster()
  },

  /**
   * 生成分享海报（可选功能）
   */
  generateSharePoster() {
    wx.showLoading({
      title: '生成海报中...',
      mask: true
    })

    // 获取 openid
    const app = getApp()
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    // 调用后端 API 生成海报
    api.getSharePoster(openid)
      .then(res => {
        wx.hideLoading()

        // 预览海报
        wx.previewImage({
          urls: [res.poster_url],
          current: res.poster_url
        })

        wx.showToast({
          title: '长按保存海报',
          icon: 'none',
          duration: 2000
        })
      })
      .catch(err => {
        console.error('生成海报失败:', err)
        wx.hideLoading()
        wx.showToast({
          title: '生成失败',
          icon: 'none',
          duration: 2000
        })
      })
  },

  /**
   * 页面分享配置（用户点击右上角分享时触发）
   */
  onShareAppMessage() {
    const { lcId, rank, totalSolved, rankTier } = this.data.myInfo

    return {
      title: `我在「力了吗」已刷题 ${totalSolved} 道！排名第 ${rank}，段位 ${rankTier}`,
      path: '/pages/index/home/home',
      imageUrl: '/static/images/share-cover.png' // 需要准备一张分享封面图
    }
  },

  /**
   * 分享到朋友圈（需要在 app.json 中配置）
   */
  onShareTimeline() {
    const { lcId, totalSolved, rankTier } = this.data.myInfo

    return {
      title: `我在「力了吗」已刷题 ${totalSolved} 道！段位 ${rankTier}，一起来卷吧！`,
      query: '',
      imageUrl: '/static/images/share-cover.png'
    }
  }
})
