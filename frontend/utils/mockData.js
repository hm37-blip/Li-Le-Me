/**
 * 模拟数据生成工具
 * 用于在后端API未就绪时测试前端图表功能
 */

/**
 * 生成趋势数据（折线图用）
 * @param {Number} days - 天数
 * @returns {Object} { dates: [], daily_points: [], average_line: Number }
 */
function generateTrendData(days = 7) {
  const dates = []
  const daily_points = []

  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // 格式化日期为 "MM-DD"（符合 Module 4 规范）
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    dates.push(`${month}-${day}`)

    // 稳健上升趋势（去随机，便于 demo 录制）
    const position = (days - 1) - i // 0=最早, days-1=今天
    const ramp = days <= 1 ? 7 : 3 + (position / (days - 1)) * 7 // 3 → 10
    const wiggle = position % 4 === 2 ? 1 : (position % 4 === 0 ? -1 : 0)
    const points = Math.max(1, Math.round(ramp + wiggle))
    daily_points.push(points)
  }

  // 计算平均线（符合 Module 4 规范）
  const totalPoints = daily_points.reduce((sum, val) => sum + val, 0)
  const average_line = parseFloat((totalPoints / days).toFixed(2))

  return {
    dates,
    daily_points,
    average_line
  }
}

/**
 * 生成周趋势数据（7天）
 */
function generateWeekTrendData() {
  return generateTrendData(7)
}

/**
 * 生成月趋势数据（30天，采样15个点）
 */
function generateMonthTrendData() {
  const allData = generateTrendData(30)

  // 采样：每2天取一个点
  const dates = []
  const daily_points = []

  for (let i = 0; i < allData.dates.length; i += 2) {
    dates.push(allData.dates[i])
    daily_points.push(allData.daily_points[i])
  }

  // 重新计算平均线
  const totalPoints = daily_points.reduce((sum, val) => sum + val, 0)
  const average_line = parseFloat((totalPoints / daily_points.length).toFixed(2))

  return {
    dates,
    daily_points,
    average_line
  }
}

/**
 * 生成年趋势数据（12个月）
 */
function generateYearTrendData() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  // 固定的稳健上升曲线（去随机，便于 demo 录制）
  const daily_points = [40, 48, 55, 63, 72, 80, 90, 99, 110, 122, 135, 150]

  // 计算平均线
  const totalPoints = daily_points.reduce((sum, val) => sum + val, 0)
  const average_line = parseFloat((totalPoints / 12).toFixed(2))

  return {
    dates: months,
    daily_points,
    average_line
  }
}

/**
 * 生成难度分布数据（饼图用）
 * @param {String} type - 'MONTHLY' 或 'TOTAL'
 * @returns {Object} { easy, medium, hard } （符合 Module 4 规范）
 */
function generateDifficultyDistribution(type = 'TOTAL') {
  // 固定数值（稳健选手人设，去随机，便于 demo 录制）
  if (type === 'MONTHLY') {
    // 本月新增：30 道
    return { easy: 18, medium: 9, hard: 3 }
  }
  // 累计：150 道（简单 90 / 中等 45 / 困难 15）
  return { easy: 90, medium: 45, hard: 15 }
}

/**
 * 生成月难度分布数据
 */
function generateMonthDifficultyDistribution() {
  return generateDifficultyDistribution('MONTHLY')
}

/**
 * 生成年难度分布数据
 */
function generateYearDifficultyDistribution() {
  return generateDifficultyDistribution('TOTAL')
}

/**
 * 生成完整的用户报告数据（用于测试）
 */
function generateFullReportData() {
  return {
    // 用户基本信息
    openid: 'mock_openid_123456',
    lcId: 'steady_coder',
    totalSolved: 150,
    consecutiveDays: 7,

    // 周积分和月积分
    weekTrend: generateWeekTrendData(),
    monthTrend: generateMonthTrendData(),
    yearTrend: generateYearTrendData(),

    // 难度分布
    monthDifficulty: generateMonthDifficultyDistribution(),
    yearDifficulty: generateYearDifficultyDistribution()
  }
}

/**
 * 计算积分
 * @param {Number} easy - 简单题数量
 * @param {Number} medium - 中等题数量
 * @param {Number} hard - 困难题数量
 * @returns {Number} 总积分
 */
function calculatePoints(easy, medium, hard) {
  return easy * 1 + medium * 2 + hard * 3
}

module.exports = {
  generateTrendData,
  generateWeekTrendData,
  generateMonthTrendData,
  generateYearTrendData,
  generateDifficultyDistribution,
  generateMonthDifficultyDistribution,
  generateYearDifficultyDistribution,
  generateFullReportData,
  calculatePoints
}
