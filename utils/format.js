/**
 * 通用格式化工具函数
 *
 * 统一管理时间、金额、距离、时长等格式化逻辑，避免各页面重复定义。
 *
 * 使用方式：
 *   import { formatDate, formatAmount, formatDistance } from '@/utils/format'
 */

// ==================== 日期/时间格式化 ====================

/**
 * 日期格式化
 * @param {Date|string|number} date - 日期（时间戳/字符串/Date 对象）
 * @param {string} format - 格式，默认 'YYYY-MM-DD'
 *   支持的占位符：YYYY(年) MM(月) DD(日) HH(时) mm(分) ss(秒)
 * @returns {string} 格式化后的日期字符串
 *
 * @example
 * formatDate(1693574400000)           // '2023-09-01'
 * formatDate(Date.now(), 'MM/DD')    // '09/01'
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (date === null || date === undefined || date === '') return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return String(date)

  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours()
  const minute = d.getMinutes()
  const second = d.getSeconds()

  return format
    .replace('YYYY', year)
    .replace('MM', String(month).padStart(2, '0'))
    .replace('DD', String(day).padStart(2, '0'))
    .replace('HH', String(hour).padStart(2, '0'))
    .replace('mm', String(minute).padStart(2, '0'))
    .replace('ss', String(second).padStart(2, '0'))
}

/**
 * 日期时间格式化（快捷方式）
 * @param {Date|string|number} date - 日期
 * @returns {string} 'YYYY-MM-DD HH:mm'
 */
export function formatDateTime(date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm')
}

/**
 * 时间格式化（快捷方式）
 * @param {Date|string|number} date - 日期
 * @returns {string} 'HH:mm'
 */
export function formatTime(date) {
  return formatDate(date, 'HH:mm')
}

/**
 * 倒计时格式化
 * @param {number} seconds - 剩余秒数
 * @returns {string} 大于等于1小时返回 'HH:mm:ss'，否则返回 'mm:ss'
 *
 * @example
 * formatCountdown(3661)  // '01:01:01'
 * formatCountdown(61)    // '01:01'
 * formatCountdown(5)     // '00:05'
 */
export function formatCountdown(seconds) {
  if (!seconds || seconds <= 0) return '00:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')

  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

// ==================== 金额格式化 ====================

/**
 * 金额格式化（分转元）
 * @param {number} amount - 金额（单位：分）
 * @param {number} decimals - 小数位数，默认 2
 * @returns {string} 格式化后的金额字符串（单位：元）
 *
 * @example
 * formatAmount(1234)      // '12.34'
 * formatAmount(0)         // '0.00'
 * formatAmount(null)      // '0.00'
 * formatAmount(1234, 1)   // '12.3'
 */
export function formatAmount(amount, decimals = 2) {
  if (amount === null || amount === undefined || amount === '') {
    return '0.00'
  }
  const num = Number(amount)
  if (isNaN(num)) return '0.00'
  return (num / 100).toFixed(decimals)
}

// ==================== 距离格式化 ====================

/**
 * 距离格式化
 * @param {number} meters - 距离（单位：米）
 * @returns {string} 小于 1km 显示米，大于等于 1km 显示 km（保留1位小数）
 *
 * @example
 * formatDistance(500)    // '500m'
 * formatDistance(1500)   // '1.5km'
 * formatDistance(0)      // '0m'
 */
export function formatDistance(meters) {
  if (meters === null || meters === undefined || meters === '') return ''
  const d = Number(meters)
  if (isNaN(d)) return ''

  if (d < 1000) {
    return `${Math.round(d)}m`
  }
  return `${(d / 1000).toFixed(1)}km`
}

// ==================== 时长格式化 ====================

/**
 * 时长格式化（分钟转中文描述）
 * @param {number} minutes - 时长（单位：分钟）
 * @returns {string} 中文时长描述
 *
 * @example
 * formatDuration(30)    // '30分钟'
 * formatDuration(60)    // '1小时'
 * formatDuration(90)    // '1小时30分钟'
 * formatDuration(0)     // '0分钟'
 */
export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined || isNaN(Number(minutes))) {
    return ''
  }
  const mins = Number(minutes)
  const hours = Math.floor(mins / 60)
  const remain = mins % 60

  if (hours > 0 && remain > 0) {
    return `${hours}小时${remain}分钟`
  }
  if (hours > 0) {
    return `${hours}小时`
  }
  return `${remain}分钟`
}
