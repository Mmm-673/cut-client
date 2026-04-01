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
  const sendCodeAction = (mobile, scene = 1) => {
    return new Promise((resolve, reject) => {
      sendSmsCode({ mobile, scene }).then(res => {
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
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
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
    logOut: logOutAction,
    clearLoginInfo,
    resetPassword: resetPasswordAction,
    updatePassword: updatePasswordAction,
    updateMobile: updateMobileAction,
    checkLoggedIn
  }
})
