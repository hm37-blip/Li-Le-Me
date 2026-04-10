// components/empty/empty.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示空状态组件
    show: {
      type: Boolean,
      value: false
    },
    // 图标（Emoji 或特殊符号）
    icon: {
      type: String,
      value: '📭'
    },
    // 图片路径（优先于 icon）
    image: {
      type: String,
      value: ''
    },
    // 主文案
    text: {
      type: String,
      value: '暂无数据'
    },
    // 描述文案（可选）
    description: {
      type: String,
      value: ''
    },
    // 是否显示按钮
    showButton: {
      type: Boolean,
      value: false
    },
    // 按钮文案
    buttonText: {
      type: String,
      value: '刷新'
    },
    // 按钮类型：primary / secondary
    buttonType: {
      type: String,
      value: 'primary'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 按钮点击事件
    handleAction() {
      this.triggerEvent('action')
    }
  }
})
