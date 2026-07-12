// pages/profile/profile.js
const api = require('../../../utils/api.js')
const avatar = require('../../../utils/avatar.js')
const userInfoStore = require('../../../utils/user-info.js')

Page({
  data: {
    lcId: '',
    userAvatar: avatar.DEFAULT_AVATAR,
    openid: ''
  },

  onLoad(options) {
    // 从全局数据获取用户信息
    const app = getApp()
    const lcId = app.globalData.lcId || wx.getStorageSync('lcId') || ''
    const openid = app.globalData.openid || wx.getStorageSync('openid') || ''

    const savedAvatar = avatar.getProfileAvatar(app.globalData.userInfo || wx.getStorageSync('userInfo') || {})

    this.setData({
      lcId: lcId,
      openid: openid,
      userAvatar: wx.getStorageSync('userAvatar') || avatar.DEFAULT_AVATAR
    })
    avatar.resolveAvatarUrl(savedAvatar).then(userAvatar => this.setData({ userAvatar }))
  },

  onShow() {
    // 页面显示时刷新数据
    const app = getApp()
    if (app.globalData.lcId) {
      this.setData({
        lcId: app.globalData.lcId
      })
    }
    this.syncLatestUserInfo()
  },

  syncLatestUserInfo() {
    userInfoStore.syncUserInfo(api).then(userInfo => {
      if (!userInfo) return
      const source = avatar.getProfileAvatar(userInfo)
      avatar.resolveAvatarUrl(source).then(userAvatar => {
        this.setData({ userAvatar })
      })
    })
  },

  getOpenid() {
    const openid = this.data.openid || getApp().globalData.openid || wx.getStorageSync('openid') || ''
    if (openid && openid !== this.data.openid) {
      this.setData({ openid })
    }
    return openid
  },

  /**
   * 上传头像
   */
  uploadAvatar() {
    const openid = this.getOpenid()
    if (!openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]

        wx.showLoading({
          title: '上传中...',
          mask: true
        })

        avatar.uploadAvatar(tempFilePath, openid)
          .then(fileId => {
            return api.updateUserProfile(openid, { avatarUrl: fileId }).then(() => fileId)
          })
          .then(fileId => avatar.resolveAvatarUrl(fileId).then(displayUrl => ({ fileId, displayUrl })))
          .then(({ fileId, displayUrl }) => {
            avatar.saveAvatar(fileId, displayUrl)
            this.setData({
              userAvatar: displayUrl
            })

            const app = getApp()
            const userInfo = {
              ...(app.globalData.userInfo || wx.getStorageSync('userInfo') || {}),
              avatar_file_id: fileId,
              avatarUrl: displayUrl
            }
            app.globalData.userInfo = userInfo
            wx.setStorageSync('userInfo', userInfo)

            if (app.globalData) {
              app.globalData.userAvatar = displayUrl
            }

            wx.showToast({
              title: '头像上传成功',
              icon: 'success',
              duration: 2000
            })
          })
          .catch((err) => {
            console.error('头像保存失败:', err)
            wx.showToast({
              title: err.message || '头像保存失败',
              icon: 'none',
              duration: 2000
            })
          })
          .finally(() => {
            wx.hideLoading()
          })
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        wx.showToast({
          title: '选择图片失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 修改 LeetCode ID
   */
  editLcId() {
    const openid = this.getOpenid()
    if (!openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return
    }

    wx.showModal({
      title: '修改 LeetCode ID',
      editable: true,
      placeholderText: '请输入新的 LeetCode ID',
      content: this.data.lcId,
      success: async (res) => {
        if (res.confirm && res.content) {
          const newLcId = res.content.trim()

          if (!newLcId) {
            wx.showToast({
              title: 'ID 不能为空',
              icon: 'none',
              duration: 2000
            })
            return
          }

          // 显示加载提示
          wx.showLoading({
            title: '保存中...',
            mask: true
          })

          try {
            await api.bindLeetCodeAccount(openid, newLcId)

            this.setData({
              lcId: newLcId
            })

            getApp().globalData.lcId = newLcId

            wx.setStorageSync('lcId', newLcId)
            wx.setStorageSync('registration_status', 1)

            wx.hideLoading()
            wx.showToast({
              title: '修改成功',
              icon: 'success',
              duration: 2000
            })

          } catch (err) {
            wx.hideLoading()
            wx.showToast({
              title: err.message || 'ID 验证失败',
              icon: 'none',
              duration: 2000
            })
            console.error('绑定失败:', err)
          }
        }
      }
    })
  },

  /**
   * 注销账号
   */
  handleLogout() {
    const openid = this.getOpenid()
    if (!openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return
    }

    wx.showModal({
      title: '确认注销',
      content: '注销后将清除所有本地数据，确定要继续吗?',
      confirmText: '确认注销',
      confirmColor: '#ff4444',
      success: async (res) => {
        if (res.confirm) {
          // 显示加载提示
          wx.showLoading({
            title: '注销中...',
            mask: true
          })

          try {
            await api.deleteUserAccount(openid)

            wx.clearStorageSync()

            const app = getApp()
            app.globalData.lcId = ''
            app.globalData.openid = ''
            app.globalData.token = ''
            app.globalData.userInfo = null
            app.globalData.userAvatar = ''

            wx.hideLoading()
            wx.showToast({
              title: '注销成功',
              icon: 'success',
              duration: 2000
            })

            // 延迟返回登录页
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/login/login'
              })
            }, 2000)

          } catch (err) {
            wx.hideLoading()
            wx.showToast({
              title: '注销失败',
              icon: 'none',
              duration: 2000
            })
            console.error('注销失败:', err)
          }
        }
      }
    })
  }
})
