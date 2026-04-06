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

  /**
   * 上传头像
   */
  uploadAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]

        // 显示加载提示
        wx.showLoading({
          title: '上传中...',
          mask: true
        })

        // 上传到云存储或本地使用
        // 这里先使用本地临时路径
        this.setData({
          userAvatar: tempFilePath
        })

        // 保存到本地存储（所有页面都会读取这个）
        wx.setStorageSync('userAvatar', tempFilePath)

        // 更新全局数据（可选，用于其他页面实时获取）
        const app = getApp()
        if (app.globalData) {
          app.globalData.userAvatar = tempFilePath
        }

        wx.hideLoading()
        wx.showToast({
          title: '头像上传成功',
          icon: 'success',
          duration: 2000
        })

        // TODO: 如果需要上传到云端，可以调用云函数
        // this.uploadToCloud(tempFilePath)
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
            // TODO: 后端实现后，调用验证和绑定接口
            // const isValid = await api.validateLeetCodeId(newLcId)
            // if (!isValid) { ... }
            // await api.bindLeetCodeAccount(this.data.openid, newLcId)

            // 更新本地数据
            this.setData({
              lcId: newLcId
            })

            // 更新全局数据
            getApp().globalData.lcId = newLcId

            // 保存到本地存储
            wx.setStorageSync('lcId', newLcId)

            wx.hideLoading()
            wx.showToast({
              title: '修改成功',
              icon: 'success',
              duration: 2000
            })

          } catch (err) {
            wx.hideLoading()
            wx.showToast({
              title: 'ID 验证失败',
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
            // TODO: 后端实现后，调用解绑接口
            // await api.unbindLeetCodeAccount(this.data.openid)

            // 清除本地存储
            wx.clearStorageSync()

            // 清除全局数据
            const app = getApp()
            app.globalData.lcId = ''
            app.globalData.openid = ''

            wx.hideLoading()
            wx.showToast({
              title: '注销成功',
              icon: 'success',
              duration: 2000
            })

            // 延迟返回首页
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/index/home/home'
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
