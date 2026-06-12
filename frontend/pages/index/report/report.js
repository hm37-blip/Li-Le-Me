// pages/report/report.js
const api = require('../../../utils/api.js')
const mockData = require('../../../utils/mockData.js')

// 测试模式开关：true 使用模拟数据，false 使用真实API
const USE_MOCK_DATA = false

let weekChart = null
let monthChart = null
let yearChart = null
let monthPieChart = null
let yearPieChart = null

Page({
  data: {
    // 用户信息（动态加载）
    lcId: '',
    openid: '',
    userAvatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFA116"/%3E%3Ccircle cx="50" cy="35" r="18" fill="white"/%3E%3Cpath d="M20 85 Q20 55 50 55 Q80 55 80 85 Z" fill="white"/%3E%3C/svg%3E',
    totalSolved: 0,
    consecutiveDays: 0,
    weekPoints: 0,
    monthPoints: 0,

    // 难度统计（总计）- 从 API 加载
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    // 本周难度统计 - 暂未实现
    weekEasyCount: 0,
    weekMediumCount: 0,
    weekHardCount: 0,
    // 本月难度统计 - 从 API 加载
    monthEasyCount: 0,
    monthMediumCount: 0,
    monthHardCount: 0,

    // ECharts配置 - 周积分趋势
    ecWeek: {
      onInit: function (canvas, width, height, dpr) {
        const echarts = require('../../../components/ec-canvas/echarts.min.js')

        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        })
        canvas.setChart(chart)
        weekChart = chart

        // 根据 USE_MOCK_DATA 决定初始数据
        const mockWeekData = USE_MOCK_DATA ? mockData.generateWeekTrendData() : { dates: [], daily_points: [] }

        chart.setOption({
          animation: false,
          backgroundColor: '#f8f8f8',
          color: ['#FFA116'],
          grid: {
            top: 40,
            bottom: 20,
            left: 10,
            right: 10,
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: mockWeekData.dates,
            axisLine: { lineStyle: { color: '#999' } },
            axisLabel: { fontSize: 9, color: '#666', rotate: 0 }
          },
          yAxis: {
            type: 'value',
            name: '积分',
            nameTextStyle: { fontSize: 9, color: '#666' },
            minInterval: 1,
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e5e5' } },
            axisLine: { show: false },
            axisLabel: { fontSize: 9, color: '#666' }
          },
          series: [{
            type: 'line',
            name: '每日积分',
            data: mockWeekData.daily_points,
            smooth: false,
            symbolSize: 5,
            lineStyle: { width: 2.5 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(255, 161, 22, 0.3)' },
                  { offset: 1, color: 'rgba(255, 161, 22, 0.05)' }
                ]
              }
            }
          }]
        })

        return chart
      }
    },
    // ECharts配置 - 月积分趋势
    ecMonth: {
      onInit: function (canvas, width, height, dpr) {
        const echarts = require('../../../components/ec-canvas/echarts.min.js')
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        })
        canvas.setChart(chart)
        monthChart = chart

        // 根据 USE_MOCK_DATA 决定初始数据
        const mockMonthData = USE_MOCK_DATA ? mockData.generateMonthTrendData() : { dates: [], daily_points: [] }

        chart.setOption({
          animation: false,
          backgroundColor: '#f8f8f8',
          color: ['#FFA116'],
          grid: {
            top: 40,
            bottom: 20,
            left: 10,
            right: 10,
            containLabel: true
          },
          tooltip: {
            show: false
          },
          xAxis: {
            type: 'category',
            data: mockMonthData.dates,
            axisLine: { lineStyle: { color: '#999' } },
            axisLabel: { fontSize: 8, color: '#666', rotate: 45 }
          },
          yAxis: {
            type: 'value',
            name: '积分',
            nameTextStyle: { fontSize: 9, color: '#666' },
            minInterval: 1,
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e5e5' } },
            axisLine: { show: false },
            axisLabel: { fontSize: 9, color: '#666' }
          },
          series: [{
            type: 'line',
            name: '每日积分',
            data: mockMonthData.daily_points,
            smooth: false,
            symbolSize: 3,
            lineStyle: { width: 2 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(255, 161, 22, 0.3)' },
                  { offset: 1, color: 'rgba(255, 161, 22, 0.05)' }
                ]
              }
            }
          }]
        })

        return chart
      }
    },
    // ECharts配置 - 年积分趋势
    ecYear: {
      onInit: function (canvas, width, height, dpr) {
        const echarts = require('../../../components/ec-canvas/echarts.min.js')
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        })
        canvas.setChart(chart)
        yearChart = chart

        // 根据 USE_MOCK_DATA 决定初始数据
        const mockYearData = USE_MOCK_DATA ? mockData.generateYearTrendData() : { dates: [], daily_points: [] }

        chart.setOption({
          animation: false,
          backgroundColor: '#f8f8f8',
          color: ['#FFA116'],
          grid: {
            top: 40,
            bottom: 20,
            left: 10,
            right: 10,
            containLabel: true
          },
          tooltip: {
            show: false
          },
          xAxis: {
            type: 'category',
            data: mockYearData.dates,
            axisLine: { lineStyle: { color: '#999' } },
            axisLabel: { fontSize: 9, color: '#666', rotate: 0 }
          },
          yAxis: {
            type: 'value',
            name: '积分',
            nameTextStyle: { fontSize: 9, color: '#666' },
            minInterval: 10,
            splitLine: { lineStyle: { type: 'dashed', color: '#e5e5e5' } },
            axisLine: { show: false },
            axisLabel: { fontSize: 9, color: '#666' }
          },
          series: [{
            type: 'line',
            name: '月累计积分',
            data: mockYearData.daily_points,
            smooth: true,
            symbolSize: 5,
            lineStyle: { width: 2.5 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(255, 161, 22, 0.3)' },
                  { offset: 1, color: 'rgba(255, 161, 22, 0.05)' }
                ]
              }
            }
          }]
        })

        return chart
      }
    },
    // ECharts配置 - 月难度分布饼图
    ecMonthPie: {
      onInit: function (canvas, width, height, dpr) {
        const echarts = require('../../../components/ec-canvas/echarts.min.js')
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        })
        canvas.setChart(chart)
        monthPieChart = chart

        // 根据 USE_MOCK_DATA 决定初始数据
        const mockMonthDiff = USE_MOCK_DATA ? mockData.generateMonthDifficultyDistribution() : { easy: 0, medium: 0, hard: 0 }

        chart.setOption({
          animation: false,
          backgroundColor: '#f8f8f8',
          color: ['#999999', '#FFA116', '#666666'],
          legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: { fontSize: 12, color: '#666' },
            selectedMode: false,
            formatter: function(name) {
              const values = { '简单': mockMonthDiff.easy, '中等': mockMonthDiff.medium, '困难': mockMonthDiff.hard }
              const total = mockMonthDiff.easy + mockMonthDiff.medium + mockMonthDiff.hard
              const value = values[name]
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0
              return `${name} ${percent}%`
            }
          },
          series: [{
            type: 'pie',
            radius: ['45%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: { show: false },
            data: [
              { value: mockMonthDiff.easy, name: '简单' },
              { value: mockMonthDiff.medium, name: '中等' },
              { value: mockMonthDiff.hard, name: '困难' }
            ]
          }]
        })

        return chart
      }
    },
    // ECharts配置 - 年难度分布饼图
    ecYearPie: {
      onInit: function (canvas, width, height, dpr) {
        const echarts = require('../../../components/ec-canvas/echarts.min.js')
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        })
        canvas.setChart(chart)
        yearPieChart = chart

        // 根据 USE_MOCK_DATA 决定初始数据
        const mockYearDiff = USE_MOCK_DATA ? mockData.generateYearDifficultyDistribution() : { easy: 0, medium: 0, hard: 0 }

        chart.setOption({
          animation: false,
          backgroundColor: '#f8f8f8',
          color: ['#999999', '#FFA116', '#666666'],
          legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: { fontSize: 12, color: '#666' },
            selectedMode: false,
            formatter: function(name) {
              const values = { '简单': mockYearDiff.easy, '中等': mockYearDiff.medium, '困难': mockYearDiff.hard }
              const total = mockYearDiff.easy + mockYearDiff.medium + mockYearDiff.hard
              const value = values[name]
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0
              return `${name} ${percent}%`
            }
          },
          series: [{
            type: 'pie',
            radius: ['45%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: { show: false },
            data: [
              { value: mockYearDiff.easy, name: '简单' },
              { value: mockYearDiff.medium, name: '中等' },
              { value: mockYearDiff.hard, name: '困难' }
            ]
          }]
        })

        return chart
      }
    }
  },

  onLoad(options) {
    // 从路由参数获取用户ID，或从全局状态获取
    const app = getApp()
    const lcId = options.lcId || app.globalData.lcId || wx.getStorageSync('lcId') || 'demo_user'

    // 获取 openid（从微信登录信息或全局状态获取）
    const openid = app.globalData.openid || wx.getStorageSync('openid') || ''

    // 获取头像
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFA116"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="40" font-weight="bold" font-family="Arial"%3ELC%3C/text%3E%3C/svg%3E'
    const userAvatar = wx.getStorageSync('userAvatar') || defaultAvatar

    // 设置初始数据
    this.setData({
      lcId: lcId,
      openid: openid,
      userAvatar: userAvatar,
      totalSolved: 0,
      consecutiveDays: 0,
      easyCount: 0,
      mediumCount: 0,
      hardCount: 0,
      weekPoints: 0,
      monthPoints: 0
    })

    // 如果 openid 未加载，尝试获取（仅在非测试模式）
    if (!openid && !USE_MOCK_DATA) {
      this.getUserOpenId()
    }
  },

  onShow() {
    // 页面显示时刷新头像和用户信息
    const app = getApp()
    const lcId = app.globalData.lcId || wx.getStorageSync('lcId') || this.data.lcId
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFA116"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="40" font-weight="bold" font-family="Arial"%3ELC%3C/text%3E%3C/svg%3E'
    const userAvatar = wx.getStorageSync('userAvatar') || defaultAvatar

    if (lcId !== this.data.lcId || userAvatar !== this.data.userAvatar) {
      this.setData({
        lcId: lcId,
        userAvatar: userAvatar
      })
    }

    // 调整图表尺寸（处理从其他页面返回的情况）
    setTimeout(() => {
      this.resizeAllCharts()
    }, 150)
  },

  onReady() {
    // 页面渲染完成后，先调整图表尺寸，再加载数据
    setTimeout(() => {
      this.resizeAllCharts()

      // 图表初始化完成后再加载数据
      const openid = this.data.openid
      if (USE_MOCK_DATA || (openid && openid !== '' && openid !== 'loading...')) {
        this.loadChartData(openid)
      }
    }, 300)
  },

  /**
   * 调整所有图表尺寸
   */
  resizeAllCharts() {
    try {
      if (weekChart) {
        weekChart.resize()
      }
      if (monthChart) {
        monthChart.resize()
      }
      if (yearChart) {
        yearChart.resize()
      }
      if (monthPieChart) {
        monthPieChart.resize()
      }
      if (yearPieChart) {
        yearPieChart.resize()
      }
    } catch (e) {
      console.error('调整图表尺寸失败:', e)
    }
  },

  /**
   * 加载图表数据
   */
  loadChartData(openid) {
    // 加载用户基本信息（总题数、连续天数）
    this.loadUserBasicInfo()
    // 加载周趋势数据
    this.loadWeekTrend(openid)
    // 加载月趋势数据
    this.loadMonthTrend(openid)
    // 加载年趋势数据
    this.loadYearTrend(openid)
    // 加载月难度分布数据
    this.loadMonthDifficultyDistribution(openid)
    // 加载年难度分布数据
    this.loadYearDifficultyDistribution(openid)
  },

  /**
   * 加载用户基本信息
   * 注意：totalSolved 会在 loadYearDifficultyDistribution 中计算
   * consecutiveDays 需要基于 trend 数据计算（暂未实现）
   */
  loadUserBasicInfo() {
    // 使用模拟数据或真实API
    if (USE_MOCK_DATA) {
      // Mock模式：使用当前页面数据即可
      console.log('使用Mock数据，用户基本信息已在data中初始化')
      return
    }

    // 真实API模式：totalSolved 会在 loadYearDifficultyDistribution 中从 TOTAL 数据计算得出
    // consecutiveDays 需要基于 getTrendData 返回的历史数据计算连续天数
    // 这里可以调用 getTrendData 来计算连续天数
    const openid = this.data.openid

    api.getTrendData(openid, 365)
      .then(res => {
        // 计算连续打卡天数
        const consecutiveDays = this.calculateConsecutiveDays(res.daily_points)
        this.setData({ consecutiveDays })
        console.log('连续打卡天数:', consecutiveDays)
      })
      .catch(err => {
        console.error('计算连续天数失败:', err)
        this.setData({ consecutiveDays: 0 })
      })
  },

  /**
   * 计算连续打卡天数
   * @param {Array} dailyPoints - 每日积分数组
   * @returns {Number} 连续天数
   */
  calculateConsecutiveDays(dailyPoints) {
    if (!dailyPoints || dailyPoints.length === 0) return 0

    let consecutive = 0
    // 从最新的一天（数组末尾）往前计算
    for (let i = dailyPoints.length - 1; i >= 0; i--) {
      if (dailyPoints[i] > 0) {
        consecutive++
      } else {
        break
      }
    }
    return consecutive
  },

  /**
   * 填充缺失日期（Zero-Filling Logic）
   * 如果后端没有返回完整的日期范围，前端需要填充0
   * @param {Array} dates - 后端返回的日期数组
   * @param {Array} dailyPoints - 后端返回的积分数组
   * @param {Number} expectedDays - 期望的天数
   * @returns {Object} { dates: Array, daily_points: Array }
   */
  fillMissingDates(dates, dailyPoints, expectedDays) {
    // 如果后端已经返回了完整的天数，直接返回
    if (dates && dates.length === expectedDays) {
      return { dates, daily_points: dailyPoints }
    }

    // 生成完整的日期范围
    const today = new Date()
    const fullDates = []
    for (let i = expectedDays - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      fullDates.push(`${month}-${day}`)
    }

    // 创建日期到积分的映射
    const pointsMap = new Map()
    if (dates && dailyPoints) {
      dates.forEach((date, index) => {
        pointsMap.set(date, dailyPoints[index])
      })
    }

    // 填充完整数据，缺失的日期填充0
    const fullPoints = fullDates.map(date => pointsMap.get(date) || 0)

    return {
      dates: fullDates,
      daily_points: fullPoints
    }
  },

  /**
   * 加载周趋势数据
   */
  loadWeekTrend(openid) {
    // 使用模拟数据或真实API
    const dataPromise = USE_MOCK_DATA
      ? Promise.resolve(mockData.generateWeekTrendData())
      : api.getTrendData(openid, 7)

    dataPromise.then(res => {
      // Zero-Filling: 填充缺失日期
      const filledData = this.fillMissingDates(res.dates, res.daily_points, 7)

      // 计算本周积分
      const weekPoints = filledData.daily_points.reduce((sum, val) => sum + val, 0)
      this.setData({ weekPoints })

      // 更新图表
      if (weekChart) {
        weekChart.setOption({
          grid: {
            top: 30,
            bottom: 25,
            left: 10,
            right: 10,
            containLabel: true
          },
          xAxis: {
            data: filledData.dates,
            axisLabel: { fontSize: 9, color: '#666', rotate: 0 }
          },
          yAxis: {
            axisLabel: { fontSize: 9, color: '#666' },
            nameTextStyle: { fontSize: 9, color: '#666' }
          },
          series: [{ data: filledData.daily_points }]
        })
      }
    }).catch(err => {
      console.error('加载周趋势失败:', err)
      // 使用默认数据
      this.setData({ weekPoints: 0 })
    })
  },

  /**
   * 加载月趋势数据
   */
  loadMonthTrend(openid) {
    // 使用模拟数据或真实API
    const dataPromise = USE_MOCK_DATA
      ? Promise.resolve(mockData.generateMonthTrendData())
      : api.getTrendData(openid, 30)

    dataPromise.then(res => {
      // Zero-Filling: 填充缺失日期
      const filledData = this.fillMissingDates(res.dates, res.daily_points, 30)

      // 计算本月积分
      const monthPoints = filledData.daily_points.reduce((sum, val) => sum + val, 0)
      this.setData({ monthPoints })

      // 更新图表
      if (monthChart) {
        monthChart.setOption({
          grid: {
            top: 30,
            bottom: 25,
            left: 10,
            right: 10,
            containLabel: true
          },
          xAxis: {
            data: filledData.dates,
            axisLabel: { fontSize: 8, color: '#666', rotate: 45 }
          },
          yAxis: {
            axisLabel: { fontSize: 9, color: '#666' },
            nameTextStyle: { fontSize: 9, color: '#666' }
          },
          series: [{ data: filledData.daily_points }]
        })
      }
    }).catch(err => {
      console.error('加载月趋势失败:', err)
      // 使用默认数据
      this.setData({ monthPoints: 0 })
    })
  },

  /**
   * 加载年趋势数据
   */
  loadYearTrend(openid) {
    // 使用模拟数据或真实API
    const dataPromise = USE_MOCK_DATA
      ? Promise.resolve(mockData.generateYearTrendData())
      : api.getTrendData(openid, 365)

    dataPromise.then(res => {
      // 后端年趋势按月汇总时返回 12 个点；旧日级数据才需要前端补齐
      const isMonthlySummary = res.dates && res.dates.length === 12 && res.dates[0].includes('月')
      const filledData = isMonthlySummary
        ? { dates: res.dates, daily_points: res.daily_points }
        : this.fillMissingDates(res.dates, res.daily_points, 365)

      // 更新图表
      if (yearChart) {
        yearChart.setOption({
          grid: {
            top: 30,
            bottom: 25,
            left: 10,
            right: 10,
            containLabel: true
          },
          xAxis: {
            data: filledData.dates,
            axisLabel: { fontSize: 9, color: '#666', rotate: 0 }
          },
          yAxis: {
            axisLabel: { fontSize: 9, color: '#666' },
            nameTextStyle: { fontSize: 9, color: '#666' }
          },
          series: [{ data: filledData.daily_points }]
        })
      }
    }).catch(err => {
      console.error('加载年趋势失败:', err)
    })
  },

  /**
   * 加载月难度分布数据
   */
  loadMonthDifficultyDistribution(openid) {
    // 使用模拟数据或真实API
    const dataPromise = USE_MOCK_DATA
      ? Promise.resolve(mockData.generateMonthDifficultyDistribution())
      : api.getDifficultyDistribution(openid, 'MONTHLY')

    dataPromise.then(res => {
      // 计算总数（API不返回total字段，需要前端计算）
      const total = res.easy + res.medium + res.hard

      // 更新页面数据（本月新增题数）
      this.setData({
        monthEasyCount: res.easy,
        monthMediumCount: res.medium,
        monthHardCount: res.hard
      })

      // 更新月饼图
      if (monthPieChart) {
        monthPieChart.setOption({
          legend: {
            formatter: function(name) {
              const values = {
                '简单': res.easy,
                '中等': res.medium,
                '困难': res.hard
              }
              const value = values[name]
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0
              return `${name} ${percent}%`
            }
          },
          series: [{
            data: [
              { value: res.easy, name: '简单' },
              { value: res.medium, name: '中等' },
              { value: res.hard, name: '困难' }
            ]
          }]
        })
      }
    }).catch(err => {
      console.error('加载月难度分布失败:', err)
    })
  },

  /**
   * 加载年难度分布数据
   */
  loadYearDifficultyDistribution(openid) {
    // 使用模拟数据或真实API
    const dataPromise = USE_MOCK_DATA
      ? Promise.resolve(mockData.generateYearDifficultyDistribution())
      : api.getDifficultyDistribution(openid, 'TOTAL')

    dataPromise.then(res => {
      // 计算总数（API不返回total字段，需要前端计算）
      const total = res.easy + res.medium + res.hard

      // 更新页面数据（累计总数）
      this.setData({
        easyCount: res.easy,
        mediumCount: res.medium,
        hardCount: res.hard,
        totalSolved: total  // 使用计算得到的总数
      })

      // 更新年饼图
      if (yearPieChart) {
        yearPieChart.setOption({
          legend: {
            formatter: function(name) {
              const values = {
                '简单': res.easy,
                '中等': res.medium,
                '困难': res.hard
              }
              const value = values[name]
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0
              return `${name} ${percent}%`
            }
          },
          series: [{
            data: [
              { value: res.easy, name: '简单' },
              { value: res.medium, name: '中等' },
              { value: res.hard, name: '困难' }
            ]
          }]
        })
      }
    }).catch(err => {
      console.error('加载年难度分布失败:', err)
      // 使用默认数据
      this.setData({
        easyCount: 120,
        mediumCount: 100,
        hardCount: 36,
        totalSolved: 256
      })
    })
  },

  // 获取用户 openid
  getUserOpenId() {
    // 添加超时保护
    const timeout = setTimeout(() => {
      console.warn('获取 openid 超时，使用模拟数据')
      this.setData({
        openid: 'mock_openid_for_test'
      })
    }, 3000) // 3秒超时

    wx.cloud.callFunction({
      name: 'login',
      timeout: 5000, // 5秒超时
      success: res => {
        clearTimeout(timeout)
        getApp().globalData.openid = res.result.openid
        this.setData({
          openid: res.result.openid
        })
      },
      fail: err => {
        clearTimeout(timeout)
        console.error('获取 openid 失败:', err)
        this.setData({
          openid: 'mock_openid_for_test'
        })
      }
    })
  }
})
