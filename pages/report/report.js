// pages/report/report.js
const api = require('../../utils/api.js')
const dataHelper = require('../../utils/dataHelper.js')
const mockData = require('../../utils/mockData.js')

// 测试模式开关：true 使用模拟数据，false 使用真实API
const USE_MOCK_DATA = true

let weekChart = null
let monthChart = null
let yearChart = null
let monthPieChart = null
let yearPieChart = null

Page({
  data: {
    // 用户信息
    lcId: 'example_user',
    openid: '',
    userAvatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FFA116"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="40" font-weight="bold" font-family="Arial"%3ELC%3C/text%3E%3C/svg%3E',
    totalSolved: 0,
    consecutiveDays: 0,
    weekPoints: 0,
    monthPoints: 0,

    // 难度统计
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    // 本周难度统计
    weekEasyCount: 0,
    weekMediumCount: 0,
    weekHardCount: 0,
    // 本月难度统计
    monthEasyCount: 0,
    monthMediumCount: 0,
    monthHardCount: 0,

    // ECharts配置 - 周积分趋势
    ecWeek: {
      onInit: function (canvas, width, height, dpr) {
        console.log('=== 折线图 onInit 被调用 ===')
        console.log('canvas:', canvas)
        console.log('width:', width, 'height:', height, 'dpr:', dpr)

        const echarts = require('../../components/ec-canvas/echarts.min.js')
        console.log('echarts loaded:', !!echarts)

        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        })
        canvas.setChart(chart)
        weekChart = chart

        console.log('周折线图实例已创建:', !!weekChart)

        // 设置测试数据 - 积分趋势
        chart.setOption({
          backgroundColor: '#f8f8f8',
          color: ['#FFA116'],
          grid: {
            top: 30,
            bottom: 25,
            left: 10,
            right: 10,
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 积分'
          },
          xAxis: {
            type: 'category',
            data: ['3/23', '3/24', '3/25', '3/26', '3/27', '3/28', '3/29'],
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
            data: [3, 5, 7, 4, 9, 5, 6],
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

        console.log('周折线图配置已设置')
        return chart
      }
    },
    // ECharts配置 - 月积分趋势
    ecMonth: {
      onInit: function (canvas, width, height, dpr) {
        console.log('=== 月折线图 onInit 被调用 ===')

        const echarts = require('../../components/ec-canvas/echarts.min.js')
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        })
        canvas.setChart(chart)
        monthChart = chart

        console.log('月折线图实例已创建:', !!monthChart)

        // 设置测试数据 - 月积分趋势（30天数据）
        const monthDates = ['3/1', '3/3', '3/5', '3/7', '3/9', '3/11', '3/13', '3/15', '3/17', '3/19', '3/21', '3/23', '3/25', '3/27', '3/29']
        const monthData = [4, 6, 5, 8, 7, 5, 9, 6, 7, 8, 5, 7, 6, 8, 7]

        chart.setOption({
          backgroundColor: '#f8f8f8',
          color: ['#FFA116'],
          grid: {
            top: 30,
            bottom: 25,
            left: 10,
            right: 10,
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 积分'
          },
          xAxis: {
            type: 'category',
            data: monthDates,
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
            data: monthData,
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

        console.log('月折线图配置已设置')
        return chart
      }
    },
    // ECharts配置 - 年积分趋势
    ecYear: {
      onInit: function (canvas, width, height, dpr) {
        console.log('=== 年折线图 onInit 被调用 ===')

        const echarts = require('../../components/ec-canvas/echarts.min.js')
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        })
        canvas.setChart(chart)
        yearChart = chart

        console.log('年折线图实例已创建:', !!yearChart)

        // 设置测试数据 - 年积分趋势（12个月数据）
        const yearMonths = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        const yearData = [45, 52, 68, 71, 89, 95, 105, 98, 112, 125, 118, 130]

        chart.setOption({
          backgroundColor: '#f8f8f8',
          color: ['#FFA116'],
          grid: {
            top: 30,
            bottom: 25,
            left: 10,
            right: 10,
            containLabel: true
          },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 积分'
          },
          xAxis: {
            type: 'category',
            data: yearMonths,
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
            data: yearData,
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

        console.log('年折线图配置已设置')
        return chart
      }
    },
    // ECharts配置 - 月难度分布饼图
    ecMonthPie: {
      onInit: function (canvas, width, height, dpr) {
        console.log('=== 月饼图 onInit 被调用 ===')

        const echarts = require('../../components/ec-canvas/echarts.min.js')
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        })
        canvas.setChart(chart)
        monthPieChart = chart

        console.log('月饼图实例已创建:', !!monthPieChart)

        // 设置测试数据
        chart.setOption({
          backgroundColor: '#f8f8f8',
          color: ['#999999', '#FFA116', '#666666'],
          legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: { fontSize: 12, color: '#666' },
            formatter: function(name) {
              const values = { '简单': 120, '中等': 100, '困难': 36 }
              const total = 256
              const value = values[name]
              const percent = ((value / total) * 100).toFixed(1)
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
              { value: 120, name: '简单' },
              { value: 100, name: '中等' },
              { value: 36, name: '困难' }
            ]
          }]
        })

        console.log('月饼图配置已设置')
        return chart
      }
    },
    // ECharts配置 - 年难度分布饼图
    ecYearPie: {
      onInit: function (canvas, width, height, dpr) {
        console.log('=== 年饼图 onInit 被调用 ===')

        const echarts = require('../../components/ec-canvas/echarts.min.js')
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        })
        canvas.setChart(chart)
        yearPieChart = chart

        console.log('年饼图实例已创建:', !!yearPieChart)

        // 设置测试数据
        chart.setOption({
          backgroundColor: '#f8f8f8',
          color: ['#999999', '#FFA116', '#666666'],
          legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: { fontSize: 12, color: '#666' },
            formatter: function(name) {
              const values = { '简单': 120, '中等': 100, '困难': 36 }
              const total = 256
              const value = values[name]
              const percent = ((value / total) * 100).toFixed(1)
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
              { value: 120, name: '简单' },
              { value: 100, name: '中等' },
              { value: 36, name: '困难' }
            ]
          }]
        })

        console.log('年饼图配置已设置')
        return chart
      }
    }
  },

  onLoad(options) {
    console.log('=== 页面 onLoad ===')
    // 从路由参数获取用户ID，或从全局状态获取
    const lcId = options.lcId || getApp().globalData.lcId || 'demo_user'

    // 获取 openid（从微信登录信息或全局状态获取）
    const openid = getApp().globalData.openid || 'loading...'

    // 设置初始数据
    this.setData({
      lcId: lcId,
      openid: openid,
      totalSolved: 256,
      consecutiveDays: 12,
      easyCount: 120,
      mediumCount: 100,
      hardCount: 36,
      weekPoints: 0,
      monthPoints: 0
    })

    console.log('页面数据已设置')

    // 如果 openid 未加载，尝试获取（仅在非测试模式）
    if (!getApp().globalData.openid && !USE_MOCK_DATA) {
      this.getUserOpenId()
    }

    // 加载图表数据（测试模式下始终加载）
    if (USE_MOCK_DATA || (openid && openid !== 'loading...')) {
      this.loadChartData(openid)
    }
  },

  /**
   * 加载图表数据
   */
  loadChartData(openid) {
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
   * 加载周趋势数据
   */
  loadWeekTrend(openid) {
    // 使用模拟数据或真实API
    const dataPromise = USE_MOCK_DATA
      ? Promise.resolve(mockData.generateWeekTrendData())
      : api.getTrendData(openid, 7)

    dataPromise.then(res => {
      console.log('周趋势数据:', res)

      // 计算本周积分
      const weekPoints = res.daily_points_change.reduce((sum, val) => sum + val, 0)
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
            data: res.dates,
            axisLabel: { fontSize: 9, color: '#666', rotate: 0 }
          },
          yAxis: {
            axisLabel: { fontSize: 9, color: '#666' },
            nameTextStyle: { fontSize: 9, color: '#666' }
          },
          series: [{ data: res.daily_points_change }]
        })
      }
    }).catch(err => {
      console.error('加载周趋势失败:', err)
      // 使用默认数据
      this.setData({ weekPoints: 17 })
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
      console.log('月趋势数据:', res)

      // 计算本月积分
      const monthPoints = res.daily_points_change.reduce((sum, val) => sum + val, 0)
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
            data: res.dates,
            axisLabel: { fontSize: 8, color: '#666', rotate: 45 }
          },
          yAxis: {
            axisLabel: { fontSize: 9, color: '#666' },
            nameTextStyle: { fontSize: 9, color: '#666' }
          },
          series: [{ data: res.daily_points_change }]
        })
      }
    }).catch(err => {
      console.error('加载月趋势失败:', err)
      // 使用默认数据
      this.setData({ monthPoints: 74 })
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
      console.log('年趋势数据:', res)

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
            data: res.dates,
            axisLabel: { fontSize: 9, color: '#666', rotate: 0 }
          },
          yAxis: {
            axisLabel: { fontSize: 9, color: '#666' },
            nameTextStyle: { fontSize: 9, color: '#666' }
          },
          series: [{ data: res.daily_points_change }]
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
      console.log('月难度分布数据:', res)

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
              const percent = res.total > 0 ? ((value / res.total) * 100).toFixed(1) : 0
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
      : api.getDifficultyDistribution(openid, 'YEARLY')

    dataPromise.then(res => {
      console.log('年难度分布数据:', res)

      // 更新页面数据
      this.setData({
        easyCount: res.easy,
        mediumCount: res.medium,
        hardCount: res.hard,
        totalSolved: res.total
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
              const percent = res.total > 0 ? ((value / res.total) * 100).toFixed(1) : 0
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

  // 计算积分：easy:1, medium:2, hard:3
  calculatePoints(easy, medium, hard) {
    return easy * 1 + medium * 2 + hard * 3
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
        console.log('获取 openid 成功:', res.result.openid)
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
