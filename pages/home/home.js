const api = require('../../utils/api.js')

Page({
  data: {
    myInfo: {
      nickname: 'E',
      lcId: 'user_e',
      openid: 'wx_test_001',
      rank: 5,
      dailySteps: 8,
      totalSolved: 256,
      rankTier: '人上人',
      avatarUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFA116"/%3E%3Ccircle cx="50" cy="35" r="18" fill="white"/%3E%3Cpath d="M20 85 Q20 55 50 55 Q80 55 80 85 Z" fill="white"/%3E%3C/svg%3E'
    },

    teamName: 'LeetCode 刷题战队',  // 战队名称
    teamMemberCount: 30,             // 当前战队人数
    teamMemberLimit: 50,            // 战队人数上限
    rankList: [],
    loading: false
  },

  onLoad() {
    this.loadUserInfo()
    this.loadStaticTestData()  // 加载静态测试数据
    // this.fetchLeaderboard()  // 真实API调用（暂时注释）
  },

  onShow() {
    // 页面显示时刷新头像和用户信息
    this.loadUserInfo()
  },

  /**
   * 加载静态测试数据
   */
  loadStaticTestData() {
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFA116"/%3E%3Ccircle cx="50" cy="35" r="18" fill="white"/%3E%3Cpath d="M20 85 Q20 55 50 55 Q80 55 80 85 Z" fill="white"/%3E%3C/svg%3E'

    // 生成30个测试用户数据
    const testUsers = [
      { rank: 1, openid: 'wx_001', nickname: 'A', lcId: 'user_a', totalSolved: 1024, dailySteps: 25, rankTier: '夯', avatarUrl: defaultAvatar },
      { rank: 2, openid: 'wx_002', nickname: 'B', lcId: 'user_b', totalSolved: 856, dailySteps: 20, rankTier: '夯', avatarUrl: defaultAvatar },
      { rank: 3, openid: 'wx_003', nickname: 'C', lcId: 'user_c', totalSolved: 742, dailySteps: 18, rankTier: '夯', avatarUrl: defaultAvatar },
      { rank: 4, openid: 'wx_004', nickname: 'D', lcId: 'user_d', totalSolved: 658, dailySteps: 15, rankTier: '夯', avatarUrl: defaultAvatar },
      { rank: 5, openid: 'wx_test_001', nickname: 'E', lcId: 'user_e', totalSolved: 256, dailySteps: 8, rankTier: '人上人', avatarUrl: defaultAvatar },
      { rank: 6, openid: 'wx_006', nickname: 'F', lcId: 'user_f', totalSolved: 512, dailySteps: 12, rankTier: '顶级', avatarUrl: defaultAvatar },
      { rank: 7, openid: 'wx_007', nickname: 'G', lcId: 'user_g', totalSolved: 487, dailySteps: 11, rankTier: '顶级', avatarUrl: defaultAvatar },
      { rank: 8, openid: 'wx_008', nickname: 'H', lcId: 'user_h', totalSolved: 445, dailySteps: 10, rankTier: '顶级', avatarUrl: defaultAvatar },
      { rank: 9, openid: 'wx_009', nickname: 'I', lcId: 'user_i', totalSolved: 398, dailySteps: 9, rankTier: '顶级', avatarUrl: defaultAvatar },
      { rank: 10, openid: 'wx_010', nickname: 'J', lcId: 'user_j', totalSolved: 356, dailySteps: 8, rankTier: '顶级', avatarUrl: defaultAvatar },
      { rank: 11, openid: 'wx_011', nickname: 'K', lcId: 'user_k', totalSolved: 312, dailySteps: 7, rankTier: '顶级', avatarUrl: defaultAvatar },
      { rank: 12, openid: 'wx_012', nickname: 'L', lcId: 'user_l', totalSolved: 289, dailySteps: 7, rankTier: '人上人', avatarUrl: defaultAvatar },
      { rank: 13, openid: 'wx_013', nickname: 'M', lcId: 'user_m', totalSolved: 267, dailySteps: 6, rankTier: '人上人', avatarUrl: defaultAvatar },
      { rank: 14, openid: 'wx_014', nickname: 'N', lcId: 'user_n', totalSolved: 245, dailySteps: 6, rankTier: '人上人', avatarUrl: defaultAvatar },
      { rank: 15, openid: 'wx_015', nickname: 'O', lcId: 'user_o', totalSolved: 223, dailySteps: 5, rankTier: '人上人', avatarUrl: defaultAvatar },
      { rank: 16, openid: 'wx_016', nickname: 'P', lcId: 'user_p', totalSolved: 201, dailySteps: 5, rankTier: '人上人', avatarUrl: defaultAvatar },
      { rank: 17, openid: 'wx_017', nickname: 'Q', lcId: 'user_q', totalSolved: 189, dailySteps: 4, rankTier: '人上人', avatarUrl: defaultAvatar },
      { rank: 18, openid: 'wx_018', nickname: 'R', lcId: 'user_r', totalSolved: 167, dailySteps: 4, rankTier: '人上人', avatarUrl: defaultAvatar },
      { rank: 19, openid: 'wx_019', nickname: 'S', lcId: 'user_s', totalSolved: 156, dailySteps: 4, rankTier: '人上人', avatarUrl: defaultAvatar },
      { rank: 20, openid: 'wx_020', nickname: 'T', lcId: 'user_t', totalSolved: 145, dailySteps: 3, rankTier: 'NPC', avatarUrl: defaultAvatar },
      { rank: 21, openid: 'wx_021', nickname: 'U', lcId: 'user_u', totalSolved: 134, dailySteps: 3, rankTier: 'NPC', avatarUrl: defaultAvatar },
      { rank: 22, openid: 'wx_022', nickname: 'V', lcId: 'user_v', totalSolved: 123, dailySteps: 3, rankTier: 'NPC', avatarUrl: defaultAvatar },
      { rank: 23, openid: 'wx_023', nickname: 'W', lcId: 'user_w', totalSolved: 112, dailySteps: 2, rankTier: 'NPC', avatarUrl: defaultAvatar },
      { rank: 24, openid: 'wx_024', nickname: 'X', lcId: 'user_x', totalSolved: 101, dailySteps: 2, rankTier: 'NPC', avatarUrl: defaultAvatar },
      { rank: 25, openid: 'wx_025', nickname: 'Y', lcId: 'user_y', totalSolved: 89, dailySteps: 2, rankTier: 'NPC', avatarUrl: defaultAvatar },
      { rank: 26, openid: 'wx_026', nickname: 'Z', lcId: 'user_z', totalSolved: 78, dailySteps: 2, rankTier: 'NPC', avatarUrl: defaultAvatar },
      { rank: 27, openid: 'wx_027', nickname: 'AA', lcId: 'user_aa', totalSolved: 67, dailySteps: 1, rankTier: 'NPC', avatarUrl: defaultAvatar },
      { rank: 28, openid: 'wx_028', nickname: 'AB', lcId: 'user_ab', totalSolved: 56, dailySteps: 1, rankTier: 'NPC', avatarUrl: defaultAvatar },
      { rank: 29, openid: 'wx_029', nickname: 'AC', lcId: 'user_ac', totalSolved: 45, dailySteps: 1, rankTier: '拉完了', avatarUrl: defaultAvatar },
      { rank: 30, openid: 'wx_030', nickname: 'AD', lcId: 'user_ad', totalSolved: 34, dailySteps: 1, rankTier: '拉完了', avatarUrl: defaultAvatar }
    ]

    // 查找当前用户数据
    const myRankData = testUsers.find(item => item.openid === this.data.myInfo.openid)

    let myInfo = this.data.myInfo
    if (myRankData) {
      myInfo = {
        ...myInfo,
        nickname: myRankData.nickname,
        lcId: myRankData.lcId,
        rank: myRankData.rank,
        dailySteps: myRankData.dailySteps,
        totalSolved: myRankData.totalSolved,
        rankTier: myRankData.rankTier,
        avatarUrl: myRankData.avatarUrl
      }
    }

    this.setData({
      rankList: testUsers,
      myInfo: myInfo,
      teamMemberCount: testUsers.length,
      loading: false
    })
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
   * 获取排行榜数据
   */
  async fetchLeaderboard() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })

    try {
      // 调用排行榜 API
      const data = await api.getRankingList('total')

      // 获取当前用户的 openid
      const app = getApp()
      const currentOpenid = app.globalData.openid || wx.getStorageSync('openid')

      // 查找当前用户在排行榜中的位置
      let myInfo = this.data.myInfo
      const myRankData = data.find(item => item.openid === currentOpenid)

      if (myRankData) {
        myInfo = {
          ...myInfo,
          nickname: myRankData.nickname || myInfo.lcId,
          rank: myRankData.rank,
          dailySteps: myRankData.dailySteps,
          totalSolved: myRankData.totalSolved || 0,
          rankTier: myRankData.rankTier || '-',  // 直接使用后端返回的 rank_tier
          avatarUrl: myRankData.avatarUrl || myInfo.avatarUrl
        }
      }

      // 计算战队人数（最多显示50人）
      const teamMemberCount = Math.min(data.length, 50)

      this.setData({
        rankList: data.slice(0, 50),  // 只显示前50人
        myInfo: myInfo,
        teamMemberCount: teamMemberCount,
        loading: false
      })

      wx.hideLoading()

    } catch (error) {
      console.error('获取排行榜失败:', error)

      wx.hideLoading()
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      })

      // 加载失败时使用默认数据
      this.setData({
        loading: false
      })
    }
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

    // 调用后端 API 生成海报
    api.getSharePoster()
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
      path: '/pages/home/home',
      imageUrl: '/images/share-cover.png' // 需要准备一张分享封面图
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
      imageUrl: '/images/share-cover.png'
    }
  }
})
