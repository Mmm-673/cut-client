import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getAccessToken,
  getRefreshToken,
  getExpiresTime,
  getUserId,
  getNickname,
  getAvatar,
  getMobile,
  setAuthInfo,
  clearAuthInfo,
  isLoggedIn
} from '@/utils/token'
import wsManager from '@/utils/websocket'
import {
  sendSmsCode,
  smsLogin,
  passwordLogin,
  logout as logoutApi,
  resetPassword,
  updatePassword,
  updateMobile,
  validateSmsCode
} from '@/api/auth'
import defAva from '@/static/images/profile.jpg'
import { syncPushForUser } from '@/utils/jpush'
import {clearPushAlias} from "../../utils/jpush.js";

export const useUserStore = defineStore('user', () => {
  // 状态
  const accessToken = ref(getAccessToken())
  const refreshToken = ref(getRefreshToken())
  const expiresTime = ref(getExpiresTime())
  const userId = ref(getUserId())
  const nickname = ref(getNickname())
  const avatar = ref(getAvatar() || defAva)
  const mobile = ref(getMobile())

  // 设置登录信息
  const setLoginInfo = (data) => {
    accessToken.value = data.accessToken || ''
    refreshToken.value = data.refreshToken || ''
    expiresTime.value = data.expiresTime ? new Date(data.expiresTime) : null
    userId.value = data.userId || ''
    nickname.value = data.nickname || ''
    avatar.value = data.avatar || defAva
    mobile.value = data.mobile || ''

    setAuthInfo({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresTime: data.expiresTime,
      userId: data.userId,
      nickname: data.nickname,
      avatar: data.avatar,
      mobile: data.mobile
    })
  }

  // 发送短信验证码
  const sendCodeAction = async (mobile, scene = 1, options = {}) => {
    const res = await sendSmsCode({ mobile, scene, ...options })
    return res.data
  }

  // 短信验证码登录 先去校验 然后再去登录
  const smsLoginAction = async (loginData) => {
    // 1. 校验验证码
    await validateSmsCode({ ...loginData, scene: 1 })
    // 2. 登录
    const res = await smsLogin(loginData)
    const data = res.data
    setLoginInfo({
      ...data,
      userId: data.userId,
      mobile: loginData.mobile
    })
    bindPushAfterLogin(data.userId)
    return data
  }

  // 账号密码登录
  const passwordLoginAction = async (loginData) => {
    const res = await passwordLogin(loginData)
    const data = res.data
    setLoginInfo({
      ...data,
      userId: data.userId,
      mobile: loginData.mobile
    })
    bindPushAfterLogin(data.userId)
    return data
  }

  const bindPushAfterLogin = (id) => {
    // #ifdef APP-PLUS
    const userId = id
    if (userId) {
      syncPushForUser(userId)
    }
    // #endif
  }

  // 退出登录
  const logOutAction = async () => {
    try {
      await logoutApi()
    } catch (error) {
      // 即使退出接口失败，也要清除本地数据
      clearLoginInfo()
      throw error
    }
    clearLoginInfo()
  }

  // 清除登录信息
  const clearLoginInfo = () => {
    accessToken.value = ''
    refreshToken.value = ''
    expiresTime.value = null
    userId.value = ''
    nickname.value = ''
    avatar.value = defAva
    mobile.value = ''
    clearAuthInfo()
    clearPushAlias()
    // 断开 WebSocket
    wsManager.disconnect()
  }

  // 重置密码
  const resetPasswordAction = async (data) => {
    const res = await resetPassword(data)
    return res.data
  }

  // 修改密码
  const updatePasswordAction = async (data) => {
    const res = await updatePassword(data)
    return res.data
  }

  // 修改手机号
  const updateMobileAction = async (data) => {
    const res = await updateMobile(data)
    if (data.mobile) {
      mobile.value = data.mobile
    }
    return res.data
  }

  // 从本地存储恢复用户状态（App启动时调用，替代直接修改state）
  const restoreFromStorage = () => {
    accessToken.value = getAccessToken()
    refreshToken.value = getRefreshToken()
    expiresTime.value = getExpiresTime()
    userId.value = getUserId() || ''
    nickname.value = getNickname() || ''
    avatar.value = getAvatar() || defAva
    mobile.value = getMobile() || ''
  }

  // 检查是否已登录
  const checkLoggedIn = () => {
    return isLoggedIn()
  }

  return {
    // 状态
    accessToken,
    refreshToken,
    expiresTime,
    userId,
    nickname,
    avatar,
    mobile,
    // 方法
    setLoginInfo,
    sendCode: sendCodeAction,
    smsLogin: smsLoginAction,
    passwordLogin: passwordLoginAction,
    logOut: logOutAction,
    logout: logOutAction,
    clearLoginInfo,
    resetPassword: resetPasswordAction,
    updatePassword: updatePasswordAction,
    updateMobile: updateMobileAction,
    checkLoggedIn,
    restoreFromStorage
  }
})
