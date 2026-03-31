/**
 * 模拟数据生成工具
 * 用于在后端API未就绪时测试前端图表功能
 */

/**
 * 生成趋势数据（折线图用）
 * @param {Number} days - 天数
 * @returns {Object} { dates: [], daily_points_change: [] }
 */
function generateTrendData(days = 7) {
  const dates = []
  const daily_points_change = []

  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // 格式化日期为 "M/D"
    const month = date.getMonth() + 1
    const day = date.getDate()
    dates.push(`${month}/${day}`)

    // 生成随机积分 (1-10)
    const points = Math.floor(Math.random() * 10) + 1
    daily_points_change.push(points)
  }

  return {
    dates,
    daily_points_change
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
  const daily_points_change = []

  for (let i = 0; i < allData.dates.length; i += 2) {
    dates.push(allData.dates[i])
    daily_points_change.push(allData.daily_points_change[i])
  }

  return {
    dates,
    daily_points_change
  }
}

/**
 * 生成年趋势数据（12个月）
 */
function generateYearTrendData() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const daily_points_change = []

  // 生成递增趋势的月积分数据 (40-150)
  let basePoints = 40
  for (let i = 0; i < 12; i++) {
    const randomIncrease = Math.floor(Math.random() * 20) - 5 // -5 到 15 的随机增长
    basePoints += randomIncrease
    basePoints = Math.max(40, basePoints) // 最小40分
    daily_points_change.push(basePoints)
  }

  return {
    dates: months,
    daily_points_change
  }
}

/**
 * 生成难度分布数据（饼图用）
 * @param {String} type - 'MONTHLY' 或 'YEARLY'
 * @returns {Object} { type, easy, medium, hard, total }
 */
function generateDifficultyDistribution(type = 'YEARLY') {
  let easy, medium, hard

  if (type === 'MONTHLY') {
    // 月数据：较小的数量
    easy = Math.floor(Math.random() * 20) + 10    // 10-30
    medium = Math.floor(Math.random() * 15) + 5   // 5-20
    hard = Math.floor(Math.random() * 10) + 2     // 2-12
  } else {
    // 年数据：较大的数量
    easy = Math.floor(Math.random() * 100) + 80    // 80-180
    medium = Math.floor(Math.random() * 80) + 60   // 60-140
    hard = Math.floor(Math.random() * 50) + 20     // 20-70
  }

  const total = easy + medium + hard

  return {
    type,
    easy,
    medium,
    hard,
    total
  }
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
  return generateDifficultyDistribution('YEARLY')
}

/**
 * 生成完整的用户报告数据（用于测试）
 */
function generateFullReportData() {
  return {
    // 用户基本信息
    openid: 'mock_openid_123456',
    lcId: 'demo_user',
    totalSolved: 256,
    consecutiveDays: 12,

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
