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
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {}

    // 获取头像（优先从本地存储）
    const savedAvatar = userInfo.avatar_file_id || userInfo.avatarUrl || wx.getStorageSync('userAvatar') || defaultAvatar

    this.setData({
      'myInfo.lcId': userInfo.leetcode_username || lcId,
      'myInfo.nickname': userInfo.nickname || userInfo.user_nickname || this.data.myInfo.nickname,
      'myInfo.openid': openid,
      'myInfo.avatarUrl': savedAvatar,
      teamName: userInfo.squad_name || this.data.teamName
    })
  },


  /**
   * 获取排行榜数据
   */
  async fetchLeaderboard() {
    const app = getApp()
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    if (!openid) {
      this.setData({ rankList: [], loading: false })
      return
    }

    this.setData({ loading: true })

    try {
      const userInfo = await this.ensureUserInfo()
      const squadId = userInfo.squad_id || userInfo.squadId

      if (!squadId) {
        this.setData({
          rankList: [],
          teamMemberCount: 0,
          loading: false
        })
        return
      }

      const data = await api.getDailyLeaderboard(squadId, openid)
      const rankList = this.normalizeRankList(data.rankList || [])
      const mySummary = data.mySummary || {}
      const myRankData = rankList.find(item => item.openid === openid)

      this.setData({
        rankList,
        teamName: data.squadName || userInfo.squad_name || this.data.teamName,
        teamMemberCount: data.totalMembers || rankList.length,
        teamMemberLimit: userInfo.max_members || this.data.teamMemberLimit,
        myInfo: {
          ...this.data.myInfo,
          nickname: (myRankData && myRankData.nickname) || this.data.myInfo.nickname,
          rank: mySummary.myRank || (myRankData && myRankData.rank) || 0,
          dailySteps: mySummary.myDailySteps || (myRankData && myRankData.dailySteps) || 0,
          totalSolved: (myRankData && myRankData.totalSolved) || this.data.myInfo.totalSolved || 0,
          rankTier: (myRankData && myRankData.rankTier) || this.data.myInfo.rankTier || '-',
          avatarUrl: (myRankData && myRankData.avatarUrl) || this.data.myInfo.avatarUrl
        },
        loading: false
      })
    } catch (error) {
      console.error('获取排行榜失败:', error)
      this.setData({
        rankList: [],
        teamMemberCount: 0,
        loading: false
      })
      wx.showToast({
        title: '排行榜加载失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  async ensureUserInfo() {
    const app = getApp()
    const cached = app.globalData.userInfo || wx.getStorageSync('userInfo') || {}
    if (cached.squad_id || cached.squadId) {
      return cached
    }

    const token = api.auth.getToken() || app.globalData.token || wx.getStorageSync('token')
    if (!token) {
      return cached
    }

    try {
      const data = await api.getUserStatus()
      const userInfo = data.user_info || {}
      app.globalData.token = api.auth.getToken() || token
      app.globalData.userInfo = userInfo
      wx.setStorageSync('userInfo', userInfo)
      this.loadUserInfo()
      return userInfo
    } catch (err) {
      console.error('获取用户状态失败:', err)
      return cached
    }
  },

  normalizeRankList(rankList) {
    return rankList.map(item => ({
      rank: item.rank,
      openid: item.openid,
      nickname: item.nickname || item.openid || '匿名用户',
      lcId: item.lcId || item.leetcode_username || item.openid || '-',
      totalSolved: item.totalSolved || item.totalPoints || 0,
      dailySteps: item.dailySteps || item.dailyPoints || 0,
      rankTier: item.rankTier || '-',
      avatarUrl: item.avatarUrl || this.data.myInfo.avatarUrl
    }))
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    Promise.resolve(this.fetchLeaderboard()).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 分享战绩
   */
  shareAchievement() {
    const { rank, totalSolved, dailySteps, rankTier } = this.data.myInfo

    const shareText = `我在「力了吗」已刷题 ${totalSolved} 道！\n当前排名：第 ${rank} 名\n段位等级：${rankTier}\n今日积分：${dailySteps}\n\n一起来卷 LeetCode 吧！`

    wx.showActionSheet({
      itemList: ['生成分享海报', '复制分享文案'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.generateSharePoster()
          return
        }

        if (res.tapIndex === 1) {
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
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('cancel')) {
          return
        }
        console.error('打开分享菜单失败:', err)
      }
    })
  },

  /**
   * 生成分享海报（可选功能）
   */
  generateSharePoster() {
    const app = getApp()
    const openid = app.globalData.openid || wx.getStorageSync('openid')

    if (!openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return
    }

    wx.showLoading({
      title: '生成海报中...',
      mask: true
    })

    api.getSharePoster(openid)
      .then(res => {
        const posterUrl = res.poster_url || res.posterUrl
        if (!posterUrl) {
          throw new Error('海报地址为空')
        }

        return this.previewPoster(posterUrl)
      })
      .then(() => {
        wx.showToast({
          title: '长按保存海报',
          icon: 'none',
          duration: 2000
        })
      })
      .catch(err => {
        console.error('生成海报失败:', err)
        wx.showToast({
          title: err.message || '生成失败',
          icon: 'none',
          duration: 2000
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  previewPoster(posterUrl) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: posterUrl,
        success: (downloadRes) => {
          const imagePath = downloadRes.statusCode === 200 && downloadRes.tempFilePath
            ? downloadRes.tempFilePath
            : posterUrl
          this.openPosterPreview(imagePath, posterUrl, resolve, reject)
        },
        fail: () => {
          this.openPosterPreview(posterUrl, posterUrl, resolve, reject)
        }
      })
    })
  },

  openPosterPreview(imagePath, fallbackUrl, resolve, reject) {
    wx.previewImage({
      urls: [imagePath],
      current: imagePath,
      success: resolve,
      fail: (err) => {
        if (imagePath === fallbackUrl) {
          reject(err)
          return
        }
        wx.previewImage({
          urls: [fallbackUrl],
          current: fallbackUrl,
          success: resolve,
          fail: reject
        })
      }
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
