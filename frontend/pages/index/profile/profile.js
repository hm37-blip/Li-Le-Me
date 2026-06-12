// pages/profile/profile.js
const api = require('../../../utils/api.js')

Page({
  data: {
    lcId: '',
    userAvatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFA116"/%3E%3Ccircle cx="50" cy="35" r="18" fill="white"/%3E%3Cpath d="M20 85 Q20 55 50 55 Q80 55 80 85 Z" fill="white"/%3E%3C/svg%3E',
    openid: ''
  },

  onLoad(options) {
    // 从全局数据获取用户信息
    const app = getApp()
    const lcId = app.globalData.lcId || wx.getStorageSync('lcId') || ''
    const openid = app.globalData.openid || wx.getStorageSync('openid') || ''

    // 从本地存储获取头像
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFA116"/%3E%3Ccircle cx="50" cy="35" r="18" fill="white"/%3E%3Cpath d="M20 85 Q20 55 50 55 Q80 55 80 85 Z" fill="white"/%3E%3C/svg%3E'
    const savedAvatar = wx.getStorageSync('userAvatar') || defaultAvatar

    this.setData({
      lcId: lcId,
      openid: openid,
      userAvatar: savedAvatar
    })
  },

  onShow() {
    // 页面显示时刷新数据
    const app = getApp()
    if (app.globalData.lcId) {
      this.setData({
        lcId: app.globalData.lcId
      })
    }
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

        api.updateUserProfile(openid, { avatarUrl: tempFilePath })
          .then(() => {
            this.setData({
              userAvatar: tempFilePath
            })

            wx.setStorageSync('userAvatar', tempFilePath)

            const app = getApp()
            if (app.globalData) {
              app.globalData.userAvatar = tempFilePath
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
