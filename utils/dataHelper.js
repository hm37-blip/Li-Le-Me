/**
 * 数据处理工具函数
 * 用于处理LeetCode报告相关的数据计算
 */

/**
 * 计算连续打卡天数
 * @param {Array} historyLogs - 历史记录数组，格式：[{ date, count }, ...]
 * @returns {Number} 连续打卡天数
 */
function calculateConsecutiveDays(historyLogs) {
  if (!historyLogs || historyLogs.length === 0) {
    return 0
  }

  // 按日期降序排序
  const sortedLogs = [...historyLogs].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  )

  let consecutiveDays = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].date)
    logDate.setHours(0, 0, 0, 0)

    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)

    // 检查是否连续
    if (logDate.getTime() === expectedDate.getTime() && sortedLogs[i].count > 0) {
      consecutiveDays++
    } else {
      break
    }
  }

  return consecutiveDays
}

/**
 * 格式化日期显示
 * @param {String} dateString - 日期字符串，格式：YYYY-MM-DD
 * @param {String} format - 格式类型：'short' | 'full'
 * @returns {String} 格式化后的日期
 */
function formatDate(dateString, format = 'short') {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (format === 'short') {
    return `${month}/${day}`
  } else {
    const year = date.getFullYear()
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
}

/**
 * 生成日期范围数组
 * @param {Number} days - 天数
 * @returns {Array} 日期数组
 */
function generateDateRange(days) {
  const dates = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }

  return dates
}

/**
 * 填充缺失的历史数据
 * @param {Array} historyLogs - 原始历史记录
 * @param {Number} days - 需要的天数
 * @returns {Array} 填充后的数据
 */
function fillMissingDates(historyLogs, days) {
  const dateRange = generateDateRange(days)
  const logMap = new Map(historyLogs.map(log => [log.date, log.count]))

  return dateRange.map(date => ({
    date,
    count: logMap.get(date) || 0
  }))
}

/**
 * 计算增长率
 * @param {Number} current - 当前值
 * @param {Number} previous - 之前的值
 * @returns {String} 增长率百分比
 */
function calculateGrowthRate(current, previous) {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%'
  }

  const rate = ((current - previous) / previous * 100).toFixed(1)
  return rate >= 0 ? `+${rate}%` : `${rate}%`
}

/**
 * 计算平均值
 * @param {Array} data - 数据数组
 * @returns {Number} 平均值
 */
function calculateAverage(data) {
  if (!data || data.length === 0) {
    return 0
  }

  const sum = data.reduce((acc, val) => acc + val, 0)
  return (sum / data.length).toFixed(1)
}

module.exports = {
  calculateConsecutiveDays,
  formatDate,
  generateDateRange,
  fillMissingDates,
  calculateGrowthRate,
  calculateAverage
}
