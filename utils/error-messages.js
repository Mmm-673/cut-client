/**
 * 错误码友好提示映射
 */
export default {
  0: '成功',
  401: '登录已过期，请重新登录',
  429: '请求过于频繁，请稍后再试',
  1002004000: '用户不存在',
  1002004001: '账号已被禁用',
  1002004003: '密码错误',
  1002004010: '验证码不存在或已过期',
  1002004011: '验证码错误',
  default: '操作失败，请稍后重试'
}

/**
 * 获取友好的错误提示
 * @param {number} code - 错误码
 * @param {string} defaultMsg - 默认消息
 * @returns {string} 友好提示
 */
export function getErrorMessage(code, defaultMsg = '') {
  const message = errorMessages[code] || defaultMsg || errorMessages.default
  return message
}
