/**
 * 时间常量
 * 统一时间单位换算，避免散落的魔法数字
 */

// 毫秒级时间常量
export const TIME_MS = {
  // 1 秒 = 1000 毫秒
  SECOND: 1000,

  // 1 分钟 = 60 秒
  MINUTE: 60 * 1000,

  // 5 分钟（token 刷新提前量等）
  FIVE_MINUTES: 5 * 60 * 1000,

  // 半小时
  HALF_HOUR: 30 * 60 * 1000,

  // 1 小时
  HOUR: 60 * 60 * 1000,

  // 1 天
  DAY: 24 * 60 * 60 * 1000,

  // 1 周
  WEEK: 7 * 24 * 60 * 60 * 1000,
}

// 秒级时间常量
export const TIME_SEC = {
  // 1 分钟
  MINUTE: 60,

  // 1 小时
  HOUR: 3600,

  // 1 天
  DAY: 86400,

  // 1 周
  WEEK: 604800,
}

// 轮询间隔（毫秒）
export const POLL_INTERVAL = {
  // 快速轮询（支付状态等）
  FAST: 3000,

  // 普通轮询
  NORMAL: 5000,

  // 慢速轮询
  SLOW: 10000,
}
