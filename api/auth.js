import request from '@/utils/request'

/**
 * 发送短信验证码
 * @param {Object} data - 请求参数
 * @param {string} data.mobile - 手机号
 * @param {number} data.scene - 场景（1=登录，2=修改手机号，3=修改密码，4=重置密码）
 */
export function sendSmsCode(data) {
  return request({
    url: '/app-api/member/auth/send-sms-code',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

/**
 * 手机号 + 验证码登录
 * @param {Object} data - 请求参数
 * @param {string} data.mobile - 手机号
 * @param {string} data.code - 验证码
 */
export function smsLogin(data) {
  return request({
    url: '/app-api/member/auth/sms-login',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

/**
 * 手机号 + 密码登录
 * @param {Object} data - 请求参数
 * @param {string} data.mobile - 手机号
 * @param {string} data.password - 密码
 */
export function passwordLogin(data) {
  return request({
    url: '/app-api/member/auth/login',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

/**
 * 校验短信验证码
 * @param {Object} data - 请求参数
 * @param {string} data.mobile - 手机号
 * @param {string} data.code - 验证码
 * @param {number} data.scene - 场景
 */
export function validateSmsCode(data) {
  return request({
    url: '/app-api/member/auth/validate-sms-code',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

/**
 * 刷新令牌
 * @param {string} refreshToken - 刷新令牌
 */
export function refreshToken(refreshToken) {
  return request({
    url: '/app-api/member/auth/refresh-token',
    headers: {
      isToken: false
    },
    method: 'post',
    params: { refreshToken }
  })
}

/**
 * 退出登录
 */
export function logout() {
  return request({
    url: '/app-api/member/auth/logout',
    method: 'post'
  })
}

/**
 * 重置密码（忘记密码）
 * @param {Object} data - 请求参数
 * @param {string} data.mobile - 手机号
 * @param {string} data.code - 验证码
 * @param {string} data.password - 新密码
 */
export function resetPassword(data) {
  return request({
    url: '/app-api/billiard/user/reset-password',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

/**
 * 修改密码（已登录）
 * @param {Object} data - 请求参数
 * @param {string} data.code - 验证码
 * @param {string} data.password - 新密码
 */
export function updatePassword(data) {
  return request({
    url: '/app-api/billiard/user/update-password',
    method: 'post',
    data: data
  })
}

/**
 * 修改绑定手机号（已登录）
 * @param {Object} data - 请求参数
 * @param {string} data.mobile - 新手机号
 * @param {string} data.code - 新手机号验证码
 * @param {string} data.oldCode - 原手机号验证码
 */
export function updateMobile(data) {
  return request({
    url: '/app-api/billiard/user/update-mobile',
    method: 'post',
    data: data
  })
}
