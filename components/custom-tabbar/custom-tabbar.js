// components/custom-tabbar/custom-tabbar.js
Component({
  properties: {
    current: {
      type: Number,
      value: 0
    }
  },

  data: {
    list: [
      {
        pagePath: '/pages/home/home',
        text: '主页'
      },
      {
        pagePath: '/pages/report/report',
        text: '趋势'
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const url = this.data.list[index].pagePath

      console.warn('[TabBar] 点击索引:', index, '路径:', url)

      // 如果点击的是当前页面，不做任何操作
      if (index === this.properties.current) {
        console.warn('[TabBar] 已经在当前页面，不跳转')
        return
      }

      // 使用 redirectTo 跳转（不保留当前页面）
      wx.redirectTo({
        url: url,
        success: () => {
          console.warn('[TabBar] 跳转成功:', url)
        },
        fail: (err) => {
          console.error('[TabBar] 页面跳转失败:', err)
          // 如果 redirectTo 失败，尝试使用 navigateTo
          wx.navigateTo({
            url: url,
            fail: (err2) => {
              console.error('[TabBar] navigateTo 也失败:', err2)
            }
          })
        }
      })
    }
  }
})
