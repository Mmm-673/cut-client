/**
 * 错误码友好提示映射
 */
// 1. 这里不要写 export default，直接定义常量
const errorMessages = {
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
 */
const getErrorMessage = (code, defaultMsg = '') => {
  console.log(code, defaultMsg, '==========defaultMsg')

  // 关键点：确保 code 能匹配上 key（强制转成数字或字符串试试）
  const message = errorMessages[code] || defaultMsg || errorMessages.default
  return message
}

// 2. 只保留这一个默认导出
export default getErrorMessage

// // 3. 如果你其他地方还需要用到 errorMessages 对象，可以这样命名导出：
// export { errorMessages }