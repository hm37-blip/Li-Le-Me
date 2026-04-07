const echarts = require('./echarts.min.js')

let ctx

Component({
  properties: {
    canvasId: {
      type: String,
      value: 'ec-canvas'
    },
    ec: {
      type: Object
    },
    forceUseOldCanvas: {
      type: Boolean,
      value: false
    }
  },

  data: {
    isUseNewCanvas: false
  },

  // 用于判断是否是滚动操作
  _startX: 0,
  _startY: 0,
  _isScrolling: false,

  ready() {
    if (!this.data.ec) {
      console.warn('组件需要传入 ec 参数进行初始化')
      return
    }

    if (!this.data.ec.lazyLoad) {
      this.init()
    }
  },

  methods: {
    init(callback) {
      const version = wx.getSystemInfoSync().SDKVersion

      const canUseNewCanvas = compareVersion(version, '2.9.0') >= 0
      const forceUseOldCanvas = this.data.forceUseOldCanvas
      const isUseNewCanvas = canUseNewCanvas && !forceUseOldCanvas
      this.setData({ isUseNewCanvas })

      if (forceUseOldCanvas && canUseNewCanvas) {
        console.warn('开发者强制使用旧canvas，但建议使用新canvas提升性能')
      }

      if (isUseNewCanvas) {
        this.initByNewWay(callback)
      } else {
        const isValid = compareVersion(version, '1.9.91') >= 0
        if (!isValid) {
          console.error('微信基础库版本过低，需要 >= 1.9.91')
          return
        }
        this.initByOldWay(callback)
      }
    },

    initByOldWay(callback) {
      ctx = wx.createCanvasContext(this.data.canvasId, this)
      const canvas = new WxCanvas(ctx, this.data.canvasId, false)

      echarts.setCanvasCreator(() => {
        return canvas
      })

      const query = wx.createSelectorQuery().in(this)
      query.select('.ec-canvas').boundingClientRect(res => {
        // 设置 canvas 尺寸
        canvas.width = res.width
        canvas.height = res.height

        if (typeof callback === 'function') {
          this.chart = callback(canvas, res.width, res.height, wx.getSystemInfoSync().pixelRatio)
        } else if (this.data.ec && typeof this.data.ec.onInit === 'function') {
          this.chart = this.data.ec.onInit(canvas, res.width, res.height, wx.getSystemInfoSync().pixelRatio)
        } else {
          this.triggerEvent('init', {
            canvas: canvas,
            width: res.width,
            height: res.height,
            pixelRatio: wx.getSystemInfoSync().pixelRatio
          })
        }
      }).exec()
    },

    initByNewWay(callback) {
      const query = wx.createSelectorQuery().in(this)
      query
        .select('.ec-canvas')
        .fields({ node: true, size: true })
        .exec(res => {
          if (!res || !res[0]) {
            console.error('无法获取 canvas 节点')
            return
          }

          const canvasNode = res[0].node
          this.canvasNode = canvasNode

          const canvasDpr = wx.getSystemInfoSync().pixelRatio
          const canvasWidth = res[0].width
          const canvasHeight = res[0].height

          // 设置 canvas 节点的实际像素尺寸
          canvasNode.width = canvasWidth * canvasDpr
          canvasNode.height = canvasHeight * canvasDpr

          const ctx = canvasNode.getContext('2d')
          ctx.scale(canvasDpr, canvasDpr)

          const canvas = new WxCanvas(ctx, this.data.canvasId, true, canvasNode)

          // 设置 canvas 尺寸属性
          canvas.width = canvasWidth
          canvas.height = canvasHeight

          echarts.setCanvasCreator(() => {
            return canvas
          })

          if (typeof callback === 'function') {
            this.chart = callback(canvas, canvasWidth, canvasHeight, canvasDpr)
          } else if (this.data.ec && typeof this.data.ec.onInit === 'function') {
            this.chart = this.data.ec.onInit(canvas, canvasWidth, canvasHeight, canvasDpr)
          } else {
            this.triggerEvent('init', {
              canvas: canvas,
              width: canvasWidth,
              height: canvasHeight,
              dpr: canvasDpr
            })
          }
        })
    },

    canvasToTempFilePath(opt) {
      if (this.data.isUseNewCanvas) {
        const query = wx.createSelectorQuery().in(this)
        query
          .select('.ec-canvas')
          .fields({ node: true, size: true })
          .exec(res => {
            const canvasNode = res[0].node
            opt.canvas = canvasNode
            wx.canvasToTempFilePath(opt)
          })
      } else {
        if (!opt.canvasId) {
          opt.canvasId = this.data.canvasId
        }
        ctx.draw(true, () => {
          wx.canvasToTempFilePath(opt, this)
        })
      }
    },

    touchStart(e) {
      if (!this.chart || !e.touches.length) return

      const touch = e.touches[0]
      this._startX = touch.x
      this._startY = touch.y
      this._isScrolling = false

      const handler = this.chart.getZr().handler
      handler.dispatch('mousedown', {
        zrX: touch.x,
        zrY: touch.y
      })
      handler.dispatch('mousemove', {
        zrX: touch.x,
        zrY: touch.y
      })
      handler.processGesture(wrapTouch(e), 'start')
    },

    touchMove(e) {
      if (!this.chart || !e.touches.length) return

      const touch = e.touches[0]

      // 判断是否是滚动操作（垂直移动距离 > 水平移动距离）
      if (!this._isScrolling) {
        const deltaX = Math.abs(touch.x - this._startX)
        const deltaY = Math.abs(touch.y - this._startY)

        // 如果移动距离超过阈值，判断滚动方向
        if (deltaX > 5 || deltaY > 5) {
          this._isScrolling = deltaY > deltaX
        }
      }

      // 如果是垂直滚动，不处理图表交互，让页面正常滚动
      if (this._isScrolling) {
        return
      }

      // 水平滑动或点击时才处理图表交互
      const handler = this.chart.getZr().handler
      handler.dispatch('mousemove', {
        zrX: touch.x,
        zrY: touch.y
      })
      handler.processGesture(wrapTouch(e), 'change')
    },

    touchEnd(e) {
      if (!this.chart) return

      this._isScrolling = false

      const touch = e.changedTouches ? e.changedTouches[0] : {}
      const handler = this.chart.getZr().handler
      handler.dispatch('mouseup', {
        zrX: touch.x,
        zrY: touch.y
      })
      handler.dispatch('click', {
        zrX: touch.x,
        zrY: touch.y
      })
      handler.processGesture(wrapTouch(e), 'end')
    }
  }
})

function wrapTouch(event) {
  for (let i = 0; i < event.touches.length; ++i) {
    const touch = event.touches[i]
    touch.offsetX = touch.x
    touch.offsetY = touch.y
  }
  return event
}

function WxCanvas(ctx, canvasId, isNew, canvasNode) {
  this.ctx = ctx
  this.canvasId = canvasId
  this.chart = null
  this.isNew = isNew
  if (isNew) {
    this.canvasNode = canvasNode
  } else {
    this._initStyle(ctx)
  }

  this._initEvent()
}

WxCanvas.prototype._initStyle = function(ctx) {
  ctx.createRadialGradient = () => {
    return ctx.createCircularGradient(arguments)
  }
}

WxCanvas.prototype._initEvent = function() {
  this.event = {}
  const eventNames = ['touchStart', 'touchMove', 'touchEnd']
  eventNames.forEach(name => {
    this.event[name] = []
  })
}

WxCanvas.prototype.set = function(key, val) {
  this[key] = val
}

WxCanvas.prototype.attachEvent = function(eventName, callback) {
  if (!this.event[eventName]) {
    this.event[eventName] = []
  }
  this.event[eventName].push(callback)
}

WxCanvas.prototype.detachEvent = function(eventName) {
  if (this.event[eventName]) {
    this.event[eventName] = []
  }
}

WxCanvas.prototype.getContext = function(contextType) {
  if (contextType === '2d') {
    return this.ctx
  }
}

WxCanvas.prototype.setChart = function(chart) {
  this.chart = chart
}

// 添加 ECharts 需要的 DOM API 适配
WxCanvas.prototype.addEventListener = function(eventName, callback) {
  this.attachEvent(eventName, callback)
}

WxCanvas.prototype.removeEventListener = function(eventName) {
  this.detachEvent(eventName)
}

WxCanvas.prototype.dispatchEvent = function(event) {
  // 微信小程序不需要实现
}

// 添加 getBoundingClientRect 方法
WxCanvas.prototype.getBoundingClientRect = function() {
  return {
    top: 0,
    left: 0,
    width: this.width || 300,
    height: this.height || 150,
    right: this.width || 300,
    bottom: this.height || 150
  }
}

// 添加其他必要的属性
WxCanvas.prototype.style = {}
WxCanvas.prototype.setAttribute = function(name, value) {
  this[name] = value
}
WxCanvas.prototype.getAttribute = function(name) {
  return this[name]
}

function compareVersion(v1, v2) {
  v1 = v1.split('.')
  v2 = v2.split('.')
  const len = Math.max(v1.length, v2.length)

  while (v1.length < len) {
    v1.push('0')
  }
  while (v2.length < len) {
    v2.push('0')
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i])
    const num2 = parseInt(v2[i])

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }

  return 0
}
