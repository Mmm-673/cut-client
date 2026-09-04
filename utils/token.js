import { TIME_MS } from '@/constants/time'
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  EXPIRES_TIME_KEY,
  USER_ID_KEY,
  NICKNAME_KEY,
  AVATAR_KEY,
  MOBILE_KEY,
  LOGIN_TIME_KEY,
  REVIEW_ACCOUNT_PHONE_KEY,
} from '@/constants/storageKeys'

/**
 * Token 管理工具
 * 支持 accessToken 和 refreshToken 双令牌机制
 */

/**
 * 获取 accessToken
 */
export function getAccessToken() {
  try {
    return uni.getStorageSync(ACCESS_TOKEN_KEY) || ''
  } catch (e) {
    console.warn('获取 accessToken 失败:', e)
    return ''
  }
}

/**
 * 设置 accessToken
 */
export function setAccessToken(token) {
  try {
    return uni.setStorageSync(ACCESS_TOKEN_KEY, token)
  } catch (e) {
    console.warn('设置 accessToken 失败:', e)
    return false
  }
}

/**
 * 获取 refreshToken
 */
export function getRefreshToken() {
  try {
    return uni.getStorageSync(REFRESH_TOKEN_KEY) || ''
  } catch (e) {
    console.warn('获取 refreshToken 失败:', e)
    return ''
  }
}

/**
 * 设置 refreshToken
 */
export function setRefreshToken(token) {
  try {
    return uni.setStorageSync(REFRESH_TOKEN_KEY, token)
  } catch (e) {
    console.warn('设置 refreshToken 失败:', e)
    return false
  }
}

/**
 * 获取过期时间
 */
export function getExpiresTime() {
  try {
    const timeStr = uni.getStorageSync(EXPIRES_TIME_KEY)
    return timeStr ? new Date(timeStr) : null
  } catch (e) {
    console.warn('获取过期时间失败:', e)
    return null
  }
}

/**
 * 设置过期时间
 */
export function setExpiresTime(expiresTime) {
  try {
    const timeStr = expiresTime instanceof Date ? expiresTime.toISOString() : expiresTime
    return uni.setStorageSync(EXPIRES_TIME_KEY, timeStr)
  } catch (e) {
    console.warn('设置过期时间失败:', e)
    return false
  }
}

/**
 * 检查 accessToken 是否需要刷新（5分钟内过期）
 */
export function shouldRefreshToken() {
  const expiresTime = getExpiresTime()
  if (!expiresTime) return true

  const now = new Date()
  const loginTime = getLoginTime()

  // 刚登录1分钟内，强制不刷新
  if (loginTime && (now.getTime() - loginTime.getTime() < TIME_MS.MINUTE)) {
    return false
  }

  const fiveMinutesBeforeExpire = new Date(expiresTime.getTime() - TIME_MS.FIVE_MINUTES)
  return now >= fiveMinutesBeforeExpire
}

/**
 * 检查是否已登录（有有效的 accessToken）
 */
export function isLoggedIn() {
  const token = getAccessToken()
  if (!token) return false

  const expiresTime = getExpiresTime()
  if (!expiresTime) return false

  return new Date() < expiresTime
}

/**
 * 设置完整的登录信息
 */
export function setAuthInfo(data) {
  // 记录登录时间，用于防止刚登录就刷新token（持久化到本地）
  setLoginTime(new Date())

  setAccessToken(data.accessToken || '')
  setRefreshToken(data.refreshToken || '')
  if (data.expiresTime) {
    setExpiresTime(data.expiresTime)
  }
  if (data.userId !== undefined) {
    setUserId(data.userId)
  }
  if (data.nickname !== undefined) {
    setNickname(data.nickname)
  }
  if (data.avatar !== undefined) {
    setAvatar(data.avatar)
  }
  if (data.mobile !== undefined) {
    setMobile(data.mobile)
  }
}

/**
 * 清除所有认证信息
 */
export function clearAuthInfo() {
  try {
    uni.removeStorageSync(ACCESS_TOKEN_KEY)
    uni.removeStorageSync(REFRESH_TOKEN_KEY)
    uni.removeStorageSync(EXPIRES_TIME_KEY)
    uni.removeStorageSync(USER_ID_KEY)
    uni.removeStorageSync(NICKNAME_KEY)
    uni.removeStorageSync(AVATAR_KEY)
    uni.removeStorageSync(MOBILE_KEY)
    uni.removeStorageSync(LOGIN_TIME_KEY)
    uni.removeStorageSync(REVIEW_ACCOUNT_PHONE_KEY)
    return true
  } catch (e) {
    console.warn('清除认证信息失败:', e)
    return false
  }
}

/**
 * 获取用户ID
 */
export function getUserId() {
  try {
    return uni.getStorageSync(USER_ID_KEY) || ''
  } catch (e) {
    return ''
  }
}

/**
 * 设置用户ID
 */
export function setUserId(userId) {
  try {
    return uni.setStorageSync(USER_ID_KEY, userId)
  } catch (e) {
    return false
  }
}

/**
 * 获取昵称
 */
export function getNickname() {
  try {
    return uni.getStorageSync(NICKNAME_KEY) || ''
  } catch (e) {
    return ''
  }
}

/**
 * 设置昵称
 */
export function setNickname(nickname) {
  try {
    return uni.setStorageSync(NICKNAME_KEY, nickname)
  } catch (e) {
    return false
  }
}

/**
 * 获取头像
 */
export function getAvatar() {
  try {
    return uni.getStorageSync(AVATAR_KEY) || ''
  } catch (e) {
    return ''
  }
}

/**
 * 设置头像
 */
export function setAvatar(avatar) {
  try {
    return uni.setStorageSync(AVATAR_KEY, avatar)
  } catch (e) {
    return false
  }
}

/**
 * 获取手机号
 */
export function getMobile() {
  try {
    return uni.getStorageSync(MOBILE_KEY) || ''
  } catch (e) {
    return ''
  }
}

/**
 * 设置手机号
 */
export function setMobile(mobile) {
  try {
    return uni.setStorageSync(MOBILE_KEY, mobile)
  } catch (e) {
    return false
  }
}

/**
 * 获取登录时间
 */
export function getLoginTime() {
  try {
    const timeStr = uni.getStorageSync(LOGIN_TIME_KEY)
    return timeStr ? new Date(timeStr) : null
  } catch (e) {
    return null
  }
}

/**
 * 设置登录时间
 */
export function setLoginTime(time) {
  try {
    const timeStr = time instanceof Date ? time.toISOString() : time
    return uni.setStorageSync(LOGIN_TIME_KEY, timeStr)
  } catch (e) {
    return false
  }
}
