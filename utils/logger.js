/**
 * 统一日志工具
 * 开发环境输出所有级别，生产环境只输出 error
 * 禁止直接使用 console.log 打印敏感信息（token、密码、手机号、支付参数等）
 */

const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
}

// 根据环境设置日志级别
// #ifdef DEVELOPMENT
const currentLevel = LOG_LEVEL.DEBUG
// #else
const currentLevel = LOG_LEVEL.ERROR
// #endif

/**
 * 判断是否应该输出该级别日志
 */
function shouldLog(level) {
  return level >= currentLevel
}

export const logger = {
  /**
   * 调试日志 - 生产环境不输出
   * 禁止打印敏感信息（token、密码、手机号、支付参数等）
   */
  debug: (...args) => {
    if (shouldLog(LOG_LEVEL.DEBUG)) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * 信息日志 - 生产环境不输出
   */
  info: (...args) => {
    if (shouldLog(LOG_LEVEL.INFO)) {
      console.log('[INFO]', ...args)
    }
  },

  /**
   * 警告日志 - 生产环境不输出
   */
  warn: (...args) => {
    if (shouldLog(LOG_LEVEL.WARN)) {
      console.warn('[WARN]', ...args)
    }
  },

  /**
   * 错误日志 - 生产环境也输出
   * 注意：不要在 error 中打印敏感数据
   */
  error: (...args) => {
    if (shouldLog(LOG_LEVEL.ERROR)) {
      console.error('[ERROR]', ...args)
    }
  },
}

export default logger
