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
  validateSmsCode,
  socialLogin as socialLoginApi
} from '@/api/auth'
import {
  getUserInfo,
  sendUpdateMobileSms as sendUpdateMobileSmsApi,
  updateMobile as updateMobileFromUserApi
} from '@/api/billiard/user'
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
  const sendCodeAction = (mobile, scene = 1, options = {}) => {
    return new Promise((resolve, reject) => {
      sendSmsCode({ mobile, scene, ...options }).then(res => {
        resolve(res.data)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 短信验证码登录 先去校验 然后再去登录
  const smsLoginAction = (loginData) => {
    return new Promise((resolve, reject) => {
      validateSmsCode({...loginData, scene: 1}).then(resp=>{
        smsLogin(loginData).then(res => {
          const data = res.data
          setLoginInfo({
            ...data,
            userId: data.userId,
            mobile: loginData.mobile
          })
          bindPushAfterLogin(data.userId)
          // H5 深链跳转
          redirectAfterLogin()
          resolve(data)
        }).catch(error => {
          reject(error)
        })
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 账号密码登录
  const passwordLoginAction = (loginData) => {
    return new Promise((resolve, reject) => {
      passwordLogin(loginData).then(res => {
        const data = res.data
        setLoginInfo({
          ...data,
          userId: data.userId,
          mobile: loginData.mobile
        })
        bindPushAfterLogin(data.userId)
        // H5 深链跳转
        redirectAfterLogin()
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 微信快捷登录
  const socialLoginAction = (loginData) => {
    return new Promise((resolve, reject) => {
      socialLoginApi(loginData).then(res => {
        const data = res.data
        setLoginInfo({
          ...data,
          userId: data.userId
        })
        bindPushAfterLogin(data.userId)
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 获取用户信息（用于登录后补充信息或绑定手机号后刷新）
  const fetchUserInfoAction = () => {
    return new Promise((resolve, reject) => {
      getUserInfo().then(res => {
        const data = res.data
        if (data) {
          if (data.nickname !== undefined) {
            nickname.value = data.nickname
          }
          if (data.avatar !== undefined) {
            avatar.value = data.avatar || defAva
          }
          if (data.mobile !== undefined) {
            mobile.value = data.mobile
          }
          // 同步到本地存储
          setAuthInfo({
            accessToken: accessToken.value,
            refreshToken: refreshToken.value,
            expiresTime: expiresTime.value,
            userId: userId.value,
            nickname: nickname.value,
            avatar: avatar.value,
            mobile: mobile.value
          })
        }
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 发送绑定/修改手机号验证码
  const sendUpdateMobileSmsAction = (mobile) => {
    return new Promise((resolve, reject) => {
      sendUpdateMobileSmsApi({ mobile }).then(res => {
        resolve(res.data)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 绑定/修改手机号
  const bindMobileAction = (data) => {
    return new Promise((resolve, reject) => {
      updateMobileFromUserApi(data).then(res => {
        // 成功后更新本地 mobile
        if (data.mobile) {
          mobile.value = data.mobile
          // 同步到本地存储
          setAuthInfo({
            accessToken: accessToken.value,
            refreshToken: refreshToken.value,
            expiresTime: expiresTime.value,
            userId: userId.value,
            nickname: nickname.value,
            avatar: avatar.value,
            mobile: data.mobile
          })
        }
        resolve(res.data)
      }).catch(error => {
        reject(error)
      })
    })
  }

  const bindPushAfterLogin = (id) => {
    // #ifdef APP-PLUS
    const userId = id
    if (userId) {
      syncPushForUser(userId)
    }
    // #endif
  }

  // 登录后跳转到深链目标（H5 专属）
  const redirectAfterLogin = () => {
    // #ifdef H5
    try {
      const target = uni.getStorageSync('deep_link_target')
      if (target) {
        uni.removeStorageSync('deep_link_target')
        setTimeout(() => {
          uni.reLaunch({ url: target })
        }, 500)
        return true
      }
    } catch (e) {
      console.warn('[UserStore] 深链跳转失败:', e)
    }
    // #endif
    return false
  }

  // 退出登录
  const logOutAction = () => {
    return new Promise((resolve, reject) => {
      logoutApi().then(() => {
        clearLoginInfo()
        resolve()
      }).catch(error => {
        // 即使退出接口失败，也要清除本地数据
        clearLoginInfo()
        reject(error)
      })
    })
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
  const resetPasswordAction = (data) => {
    return new Promise((resolve, reject) => {
      resetPassword(data).then(res => {
        resolve(res.data)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 修改密码
  const updatePasswordAction = (data) => {
    return new Promise((resolve, reject) => {
      updatePassword(data).then(res => {
        resolve(res.data)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 修改手机号
  const updateMobileAction = (data) => {
    return new Promise((resolve, reject) => {
      updateMobile(data).then(res => {
        if (data.mobile) {
          mobile.value = data.mobile
        }
        resolve(res.data)
      }).catch(error => {
        reject(error)
      })
    })
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
    socialLogin: socialLoginAction,
    fetchUserInfo: fetchUserInfoAction,
    sendUpdateMobileSms: sendUpdateMobileSmsAction,
    bindMobile: bindMobileAction,
    logOut: logOutAction,
    logout: logOutAction,
    clearLoginInfo,
    resetPassword: resetPasswordAction,
    updatePassword: updatePasswordAction,
    updateMobile: updateMobileAction,
    checkLoggedIn
  }
})
