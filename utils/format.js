/**
 * 格式化工具函数
 * 统一金额、时间、时长、距离等格式化逻辑，避免各页面重复定义
 */

/**
 * 格式化金额（分 → 元，保留 2 位小数）
 * @param {number|null|undefined} cents - 金额（分）
 * @returns {string} 格式化后的金额字符串
 */
export function formatAmount(cents) {
  if (cents === null || cents === undefined) return '0.00'
  return (Number(cents) / 100).toFixed(2)
}

/**
 * 格式化价格（分 → 元）
 * 与 formatAmount 逻辑一致，别名方便语义化使用
 * @param {number|null|undefined} cents - 价格（分）
 * @param {boolean} [keepDecimal=true] - 是否保留小数位
 * @returns {string}
 */
export function formatPrice(cents, keepDecimal = true) {
  if (cents === null || cents === undefined) return keepDecimal ? '0.00' : '0'
  const yuan = Number(cents) / 100
  if (keepDecimal) return yuan.toFixed(2)
  return yuan.toString()
}

/**
 * 格式化秒数为 HH:mm:ss 或 mm:ss
 * @param {number} seconds - 秒数
 * @returns {string}
 */
export function formatSeconds(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) {
    return `${h}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

/**
 * 格式化时长（分钟 → 小时+分钟 文本）
 * @param {number} minutes - 分钟数
 * @returns {string} 如 "2小时30分钟"、"45分钟"
 */
export function formatDuration(minutes) {
  if (!minutes) return '0分钟'
  const m = Number(minutes)
  if (m < 60) return `${m}分钟`
  const hours = Math.floor(m / 60)
  const mins = m % 60
  if (mins === 0) return `${hours}小时`
  return `${hours}小时${mins}分钟`
}

/**
 * 格式化距离（米 → 米/公里）
 * @param {number|string} distance - 距离（米）
 * @returns {string} 如 "500米"、"2.3公里"
 */
export function formatDistance(distance) {
  if (distance === null || distance === undefined || distance === '') return ''
  const meters = Number(distance)
  if (isNaN(meters)) return ''
  if (meters < 1000) return `${Math.round(meters)}米`
  return `${(meters / 1000).toFixed(1)}公里`
}

/**
 * 格式化时间戳为日期时间字符串
 * @param {number|string|Date} timestamp - 时间戳或日期
 * @param {string} [separator=' '] - 日期和时间之间的分隔符
 * @returns {string} 如 "2024-01-15 14:30"
 */
export function formatDateTime(timestamp, separator = ' ') {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}${separator}${hour}:${minute}`
}

/**
 * 格式化时间戳为日期字符串
 * @param {number|string|Date} timestamp
 * @returns {string} 如 "2024-01-15"
 */
export function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化时间戳为短时间（仅月日时分）
 * @param {number|string|Date} timestamp
 * @returns {string} 如 "01-15 14:30"
 */
export function formatShortTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}
