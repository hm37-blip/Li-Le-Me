// components/loading/loading.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示加载组件
    show: {
      type: Boolean,
      value: false
    },
    // 加载文案
    text: {
      type: String,
      value: '加载中...'
    },
    // 提示文案（可选）
    hint: {
      type: String,
      value: ''
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

  }
})
