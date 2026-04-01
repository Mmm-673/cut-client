# 登录模块重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 彻底重构登录模块，对接新的台球约认证接口，实现统一登录页、Tab切换、Token自动刷新等功能

**Architecture:** 分阶段重构：先更新配置和工具层，然后重写API层和Store层，最后重写登录页面

**Tech Stack:** Vue 3 + Pinia + UniApp

---

## 文件结构总览

| 操作 | 文件路径 | 说明 |
|-----|---------|------|
| 修改 | `config.js` | 更新 baseUrl |
| 新建 | `utils/error-messages.js` | 错误码映射 |
| 新建 | `utils/token.js` | Token管理工具 |
| 修改 | `utils/request.js` | 重写请求拦截器 |
| 新建 | `api/auth.js` | 新认证API |
| 删除 | `api/login.js` | 旧登录API |
| 修改 | `store/modules/user.js` | 重写用户Store |
| 修改 | `pages/login/index.vue` | 重写统一登录页 |
| 删除 | `pages/login/account-login.vue` | 旧账号密码登录页 |
| 删除 | `pages/login/register.vue` | 旧注册页 |
| 修改 | `permission.js` | 更新权限控制 |
| 修改 | `pages.json` | 移除不需要的路由 |
| 删除 | `utils/auth.js` | 旧Token工具 |
| 删除 | `utils/errorCode.js` | 旧错误码 |

---

### Task 1: 更新配置文件

**Files:**
- Modify: `config.js`

- [ ] **Step 1: 修改 config.js 更新 baseUrl**

```javascript
// 应用全局配置
export default {
  baseUrl: 'http://114.67.69.228',
  // 应用信息
  appInfo: {
    // 应用名称
    name: "台球约",
    // 应用版本
    version: "1.0.0",
    // 应用logo
    logo: "/static/logo.png",
    // 官方网站
    site_url: "http://114.67.69.228",
    // 政策协议
    agreements: [{
        title: "隐私政策",
        url: "/pages/common/textview/index?type=privacy"
      },
      {
        title: "用户服务协议",
        url: "/pages/common/textview/index?type=user"
      }
    ]
  }
}
```

- [ ] **Step 2: 提交更改**

```bash
git add config.js
git commit -m "feat: 更新配置文件为台球约服务器地址"
```

---

### Task 2: 新建错误码映射

**Files:**
- Create: `utils/error-messages.js`

- [ ] **Step 1: 创建错误码映射文件**

```javascript
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
```

- [ ] **Step 2: 提交更改**

```bash
git add utils/error-messages.js
git commit -m "feat: 添加新的错误码映射文件"
```

---

### Task 3: 新建 Token 管理工具

**Files:**
- Create: `utils/token.js`

- [ ] **Step 1: 创建 Token 管理工具文件**

```javascript
/**
 * Token 管理工具
 * 支持 accessToken 和 refreshToken 双令牌机制
 */

const ACCESS_TOKEN_KEY = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const EXPIRES_TIME_KEY = 'auth_expires_time'
const USER_ID_KEY = 'auth_user_id'
const NICKNAME_KEY = 'auth_nickname'
const AVATAR_KEY = 'auth_avatar'
const MOBILE_KEY = 'auth_mobile'

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
  const fiveMinutesBeforeExpire = new Date(expiresTime.getTime() - 5 * 60 * 1000)
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
```

- [ ] **Step 2: 提交更改**

```bash
git add utils/token.js
git commit -m "feat: 添加新的Token管理工具"
```

---

### Task 4: 重写请求拦截器

**Files:**
- Modify: `utils/request.js`

- [ ] **Step 1: 完全重写 request.js**

```javascript
import config from '@/config'
import { getAccessToken, getRefreshToken, shouldRefreshToken, setAuthInfo, clearAuthInfo, isLoggedIn } from '@/utils/token'
import { getErrorMessage } from '@/utils/error-messages'
import { toast } from '@/utils/common'
import { isMP, isHarmony } from '@/utils/platform'

let timeout = 10000
const baseUrl = config.baseUrl

// 刷新Token锁，防止并发刷新
let isRefreshing = false
// 等待刷新的请求队列
let refreshSubscribers = []

// 订阅等待刷新的请求
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

// 通知所有等待的请求
function onTokenRefreshed() {
  refreshSubscribers.forEach(callback => callback())
  refreshSubscribers = []
}

/**
 * 刷新Token
 */
async function refreshTokenRequest() {
  return new Promise((resolve, reject) => {
    uni.request({
      method: 'POST',
      timeout: timeout,
      url: baseUrl + '/app-api/member/auth/refresh-token',
      data: {},
      header: {
        'Content-Type': 'application/json',
        'tenant-id': '122'
      },
      dataType: 'json'
    }).then(response => {
      const res = response
      const code = res.data.code || 0
      if (code === 0 && res.data.data) {
        const data = res.data.data
        setAuthInfo(data)
        resolve(data.accessToken)
      } else {
        reject(res.data)
      }
    }).catch(error => {
      reject(error)
    })
  })
}

const request = async config => {
  // 是否需要设置 token
  const isToken = (config.headers || {}).isToken === false
  config.header = config.header || {}

  // 平台特定请求头处理
  if (isMP()) {
    config.header['X-Platform'] = 'miniprogram'
  } else if (isHarmony()) {
    config.header['X-Platform'] = 'harmony'
  }

  // 添加 tenant-id
  config.header['tenant-id'] = '122'

  // 添加 Authorization header
  const accessToken = getAccessToken()
  if (accessToken && !isToken) {
    config.header['Authorization'] = 'Bearer ' + accessToken
  }

  // 检查是否需要刷新Token（非登录接口）
  const needRefresh = !isToken && accessToken && shouldRefreshToken() && !config.url.includes('/refresh-token')

  if (needRefresh) {
    if (isRefreshing) {
      // 正在刷新，加入等待队列
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(() => {
          // 刷新完成，重新发送请求
          request(config).then(resolve).catch(reject)
        })
      })
    }

    isRefreshing = true

    try {
      await refreshTokenRequest()
      onTokenRefreshed()
    } catch (error) {
      // 刷新失败，清除登录信息
      clearAuthInfo()
      uni.reLaunch({ url: '/pages/login/index' })
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }

    // 更新新的token
    const newToken = getAccessToken()
    if (newToken) {
      config.header['Authorization'] = 'Bearer ' + newToken
    }
  }

  // get请求映射params参数
  if (config.params) {
    let url = config.url + '?'
    for (const propName of Object.keys(config.params)) {
      const value = config.params[propName]
      const part = encodeURIComponent(propName) + '='
      if (value !== null && value !== '' && typeof value !== 'undefined') {
        if (typeof value === 'object') {
          for (const key of Object.keys(value)) {
            const params = propName + '[' + key + ']'
            const subPart = encodeURIComponent(params) + '='
            url += subPart + encodeURIComponent(value[key]) + '&'
          }
        } else {
          url += part + encodeURIComponent(value) + '&'
        }
      }
    }
    url = url.slice(0, -1)
    config.url = url
  }

  return new Promise((resolve, reject) => {
    uni.request({
      method: config.method || 'get',
      timeout: config.timeout || timeout,
      url: config.baseUrl || baseUrl + config.url,
      data: config.data,
      header: config.header,
      dataType: 'json',
      // #ifdef MP-ALIPAY
      enableCookie: true,
      // #endif
      // #ifdef MP-WEIXIN
      enableHttp2: false,
      enableQuic: false,
      enableCache: true,
      // #endif
    }).then(response => {
      const res = response
      const code = res.data.code || 0
      const msg = getErrorMessage(code, res.data.msg)

      if (code === 401) {
        clearAuthInfo()
        uni.reLaunch({ url: '/pages/login/index' })
        reject(msg || '无效的会话，或者会话已过期，请重新登录。')
      } else if (code !== 0) {
        toast(msg)
        reject(code)
      }
      resolve(res.data)
    })
    .catch(error => {
      let { message } = error
      if (message === 'Network Error') {
        message = '后端接口连接异常'
      } else if (message.includes('timeout')) {
        message = '系统接口请求超时'
      } else if (message.includes('Request failed with status code')) {
        message = '系统接口' + message.slice(-3) + '异常'
      }
      toast(message)
      reject(error)
    })
  })
}

export default request
```

- [ ] **Step 2: 提交更改**

```bash
git add utils/request.js
git commit -m "feat: 重写请求拦截器，支持tenant-id和Token自动刷新"
```

---

### Task 5: 新建认证 API

**Files:**
- Create: `api/auth.js`

- [ ] **Step 1: 创建 auth.js API 文件**

```javascript
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
```

- [ ] **Step 2: 删除旧的 login.js 文件**

```bash
git rm api/login.js
git add api/auth.js
git commit -m "feat: 添加新的认证API，删除旧登录API"
```

---

### Task 6: 重写用户 Store

**Files:**
- Modify: `store/modules/user.js`

- [ ] **Step 1: 完全重写 user.js**

```javascript
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
  updateMobile
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

  // 短信验证码登录
  const smsLoginAction = (loginData) => {
    return new Promise((resolve, reject) => {
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
```

- [ ] **Step 2: 提交更改**

```bash
git add store/modules/user.js
git commit -m "feat: 重写用户Store，适配新的认证接口"
```

---

### Task 7: 重写统一登录页

**Files:**
- Modify: `pages/login/index.vue`

- [ ] **Step 1: 完全重写 index.vue**

```html
<template>
  <view class="login-wrapper">
    <!-- 顶部Logo区域 -->
    <view class="logo-section">
      <view class="logo-circle">
        <text class="logo-text">⑧</text>
      </view>
      <text class="app-name">台球约</text>
      <text class="app-desc">专业台球陪练平台</text>
    </view>

    <!-- Tab切换 -->
    <view class="tab-section">
      <view
        class="tab-item"
        :class="{ 'tab-active': activeTab === 'sms' }"
        @click="switchTab('sms')"
      >
        验证码登录
      </view>
      <view
        class="tab-item"
        :class="{ 'tab-active': activeTab === 'password' }"
        @click="switchTab('password')"
      >
        密码登录
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="form-section">
      <!-- 手机号输入 -->
      <view class="input-group">
        <uni-icons type="phone" size="20" color="#00BB88" class="input-icon" />
        <input
          class="input"
          v-model="form.mobile"
          placeholder="请输入手机号"
          placeholder-class="placeholder"
          maxlength="11"
          type="number"
        />
      </view>

      <!-- 验证码输入 + 获取按钮（短信登录Tab） -->
      <view v-if="activeTab === 'sms'" class="input-group input-group-row">
        <view class="input-wrap">
          <uni-icons type="locked" size="20" color="#00BB88" class="input-icon" />
          <input
            class="input"
            v-model="form.code"
            placeholder="请输入验证码"
            placeholder-class="placeholder"
            maxlength="6"
            type="number"
          />
        </view>
        <button
          class="btn-code"
          :class="{ 'btn-code-disabled': codeCountdown > 0 }"
          @click="getCode"
          :disabled="codeCountdown > 0"
        >{{ codeCountdown > 0 ? `${codeCountdown}s重新获取` : '获取验证码' }}</button>
      </view>

      <!-- 密码输入（密码登录Tab） -->
      <view v-if="activeTab === 'password'" class="input-group">
        <uni-icons type="locked" size="20" color="#00BB88" class="input-icon" />
        <input
          class="input"
          v-model="form.password"
          :password="!showPassword"
          placeholder="请输入密码"
          placeholder-class="placeholder"
          maxlength="16"
        />
        <uni-icons
          :type="showPassword ? 'eye' : 'eye-slash'"
          size="20"
          color="#9CA3AF"
          class="password-eye"
          @click="showPassword = !showPassword"
        />
      </view>

      <!-- 忘记密码（密码登录Tab） -->
      <view v-if="activeTab === 'password'" class="forgot-password">
        <text class="forgot-text" @click="goToForgotPassword">忘记密码？</text>
      </view>

      <!-- 登录按钮 -->
      <button class="btn-submit" @click="handleSubmit" :disabled="isSubmitting">
        {{ isSubmitting ? '登录中...' : '登录 / 注册' }}
      </button>

      <!-- 其他登录方式分割线 -->
      <view class="divider">
        <text class="divider-text">其他登录方式</text>
      </view>

      <!-- 微信一键登录 -->
      <view class="wechat-login" @click="wechatLogin">
        <view class="wechat-circle">
          <text class="wechat-icon">💬</text>
        </view>
        <text class="wechat-text">微信一键登录</text>
      </view>
    </view>

    <!-- 底部协议 -->
    <view class="agreement">
      <view
        class="checkbox"
        :class="{ 'checkbox-checked': agree }"
        @click="agree = !agree"
      >
        <uni-icons v-if="agree" type="check" size="16" color="#fff" />
      </view>
      <text class="agreement-text">
        我已阅读并同意
        <text class="link" @click="goToAgree('user')">《用户协议》</text>
        和
        <text class="link" @click="goToAgree('privacy')">《隐私政策》</text>
      </text>
    </view>
  </view>
</template>

<script setup>
import { ref, onUnload } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

// 当前Tab
const activeTab = ref('sms')

// 表单数据
const form = ref({
  mobile: '',
  code: '',
  password: ''
})

// 验证码倒计时
const codeCountdown = ref(0)
let countdownTimer = null

// 协议勾选
const agree = ref(true)

// 显示密码
const showPassword = ref(false)

// 提交中状态
const isSubmitting = ref(false)

// 切换Tab
const switchTab = (tab) => {
  activeTab.value = tab
  form.value.code = ''
  form.value.password = ''
}

// 验证手机号
const checkPhone = () => {
  const phoneReg = /^1[3-9]\d{9}$/
  if (!form.value.mobile) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return false
  }
  if (!phoneReg.test(form.value.mobile)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return false
  }
  if (!agree.value) {
    uni.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })
    return false
  }
  return true
}

// 获取验证码
const getCode = async () => {
  if (!checkPhone()) return
  if (codeCountdown.value > 0) return

  try {
    uni.showLoading({ title: '发送中...' })
    await userStore.sendCode(form.value.mobile, 1)
    uni.hideLoading()
    uni.showToast({ title: '验证码已发送', icon: 'success' })

    // 开始倒计时
    codeCountdown.value = 60
    countdownTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        clearInterval(countdownTimer)
      }
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    console.error('发送验证码失败:', error)
  }
}

// 提交登录
const handleSubmit = async () => {
  if (!checkPhone()) return
  if (activeTab.value === 'sms' && !form.value.code) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  if (activeTab.value === 'password' && !form.value.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }

  try {
    isSubmitting.value = true
    uni.showLoading({ title: '登录中...' })

    if (activeTab.value === 'sms') {
      await userStore.smsLogin({
        mobile: form.value.mobile,
        code: form.value.code
      })
    } else {
      await userStore.passwordLogin({
        mobile: form.value.mobile,
        password: form.value.password
      })
    }

    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })

    // 登录成功跳首页
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    console.error('登录失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

// 跳转到忘记密码
const goToForgotPassword = () => {
  uni.showToast({ title: '忘记密码功能开发中', icon: 'none' })
}

// 微信一键登录
const wechatLogin = () => {
  if (!agree.value) {
    uni.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })
    return
  }

  // #ifdef MP-WEIXIN
  uni.login({
    success: (res) => {
      console.log('微信登录code', res.code)
      uni.showToast({ title: '微信登录开发中', icon: 'none' })
    },
    fail: () => {
      uni.showToast({ title: '微信登录失败', icon: 'none' })
    }
  })
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({ title: '微信登录暂不可用', icon: 'none' })
  // #endif
}

// 跳转用户协议/隐私政策
const goToAgree = (type) => {
  uni.navigateTo({
    url: type === 'user'
      ? '/pages/common/textview/index?type=user'
      : '/pages/common/textview/index?type=privacy'
  })
}

// 页面卸载清除计时器
onUnload(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style lang="scss" scoped>
.login-wrapper {
  min-height: 100vh;
  background: #1E252B;
  padding: 100rpx 48rpx 40rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: calc(120rpx + var(--status-bar-height));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  position: relative;
}

/* Logo区域 */
.logo-section {
  text-align: center;
  margin-bottom: 60rpx;
  .logo-circle {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: #00BB88;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 32rpx;
  }
  .logo-text {
    font-size: 64rpx;
    color: #fff;
    font-weight: bold;
    border: 6rpx solid #fff;
    width: 50rpx;
    height: 50rpx;
    line-height: 50rpx;
    text-align: center;
    border-radius: 50%;
  }
  .app-name {
    display: block;
    font-size: 64rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 16rpx;
  }
  .app-desc {
    display: block;
    font-size: 32rpx;
    color: #9CA3AF;
  }
}

/* Tab切换 */
.tab-section {
  display: flex;
  width: 100%;
  background: #2A3138;
  border-radius: 48rpx;
  padding: 8rpx;
  margin-bottom: 40rpx;
  box-sizing: border-box;
}
.tab-item {
  flex: 1;
  text-align: center;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  color: #9CA3AF;
  border-radius: 40rpx;
  transition: all 0.3s;
}
.tab-active {
  background: #00BB88;
  color: #fff;
  font-weight: bold;
}

/* 表单区域 */
.form-section {
  width: 100%;
  .input-group {
    width: 100%;
    height: 96rpx;
    background: #2A3138;
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    margin-bottom: 32rpx;
    box-sizing: border-box;
    position: relative;
    .input-icon {
      margin-right: 16rpx;
    }
    .input {
      flex: 1;
      font-size: 32rpx;
      color: #fff;
      line-height: 1;
    }
    .placeholder {
      color: #9CA3AF;
    }
    .password-eye {
      margin-left: 16rpx;
    }
  }
  /* 行内输入（验证码+按钮） */
  .input-group-row {
    display: flex;
    gap: 16rpx;
    .input-wrap {
      flex: 1;
      display: flex;
      align-items: center;
    }
  }
  .btn-code {
    padding: 0 32rpx;
    height: 96rpx;
    line-height: 96rpx;
    background: #00BB88;
    color: #fff;
    border-radius: 48rpx;
    font-size: 28rpx;
    white-space: nowrap;
    border: none;
    &::after { border: none; }
  }
  .btn-code-disabled {
    background: #00BB8880 !important;
    color: #ccc !important;
  }

  /* 忘记密码 */
  .forgot-password {
    text-align: right;
    margin-bottom: 24rpx;
    .forgot-text {
      font-size: 26rpx;
      color: #00BB88;
    }
  }

  /* 提交按钮 */
  .btn-submit {
    width: 100%;
    height: 96rpx;
    line-height: 96rpx;
    background: #00BB88;
    color: #fff;
    border-radius: 48rpx;
    font-size: 36rpx;
    font-weight: bold;
    margin: 16rpx 0 48rpx;
    border: none;
    box-shadow: 0 8rpx 24rpx rgba(0, 187, 136, 0.3);
    &::after { border: none; }
    &[disabled] {
      opacity: 0.6;
    }
  }

  /* 分割线 */
  .divider {
    position: relative;
    text-align: center;
    margin-bottom: 40rpx;
    &::before, &::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 40%;
      height: 1rpx;
      background: #2A3138;
    }
    &::before { left: 0; }
    &::after { right: 0; }
    .divider-text {
      font-size: 28rpx;
      color: #9CA3AF;
      padding: 0 16rpx;
      background: #1E252B;
    }
  }

  /* 微信登录 */
  .wechat-login {
    text-align: center;
    .wechat-circle {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16rpx;
    }
    .wechat-icon {
      font-size: 52rpx;
      color: #07C160;
    }
    .wechat-text {
      font-size: 28rpx;
      color: #9CA3AF;
    }
  }
}

/* 底部协议 */
.agreement {
  position: absolute;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: 48rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  .checkbox {
    width: 32rpx;
    height: 32rpx;
    border: 2rpx solid #00BB88;
    border-radius: 6rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .checkbox-checked {
    background: #00BB88;
  }
  .agreement-text {
    font-size: 26rpx;
    color: #9CA3AF;
    line-height: 1.4;
  }
  .link {
    color: #00BB88;
  }
}

/* 覆盖uni-icons默认边距 */
:deep(.uni-icons) {
  margin-right: 0 !important;
}
</style>
```

- [ ] **Step 2: 删除旧的登录页面**

```bash
git rm pages/login/account-login.vue
git rm pages/login/register.vue
git add pages/login/index.vue
git commit -m "feat: 重写统一登录页，支持Tab切换"
```

---

### Task 8: 更新权限控制

**Files:**
- Modify: `permission.js`

- [ ] **Step 1: 读取并更新 permission.js**

```javascript
import { useUserStore } from '@/store/modules/user'
import { isLoggedIn } from '@/utils/token'

const whiteList = [
  '/pages/login/index',
  '/pages/common/webview/index',
  '/pages/common/textview/index'
]

// 拦截路由跳转
const list = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']
list.forEach(item => {
  uni.addInterceptor(item, {
    invoke(e) {
      const userStore = useUserStore()
      const url = e.url.split('?')[0]

      if (isLoggedIn()) {
        if (url === '/pages/login/index') {
          uni.switchTab({ url: '/pages/index/index' })
          return false
        }
        return true
      } else {
        if (whiteList.includes(url)) {
          return true
        }
        uni.redirectTo({ url: '/pages/login/index' })
        return false
      }
    },
    fail(err) {
      console.log(err)
    }
  })
})
```

- [ ] **Step 2: 提交更改**

```bash
git add permission.js
git commit -m "feat: 更新权限控制逻辑"
```

---

### Task 9: 更新页面路由配置

**Files:**
- Modify: `pages.json`
- Read first, then edit to remove account-login and register routes

- [ ] **Step 1: 读取 pages.json**
- [ ] **Step 2: 移除不需要的页面路由**
- [ ] **Step 3: 提交更改**

```bash
git add pages.json
git commit -m "feat: 更新pages.json，移除不需要的路由"
```

---

### Task 10: 清理旧文件

**Files:**
- Delete: `utils/auth.js`
- Delete: `utils/errorCode.js`

- [ ] **Step 1: 删除旧文件**

```bash
git rm utils/auth.js
git rm utils/errorCode.js
git commit -m "feat: 删除旧的认证工具和错误码文件"
```

---

## 计划自我检查

✅ **Spec coverage:** 所有设计文档中的要求都有对应的任务实现  
✅ **Placeholder scan:** 没有 TBD/TODO，所有代码都完整  
✅ **Type consistency:** 所有函数名、变量名前后一致，接口匹配设计文档

---

## 验收清单

- [ ] 配置文件已更新为 `http://114.67.69.228`
- [ ] 短信验证码发送成功（scene=1）
- [ ] 短信验证码登录成功
- [ ] 账号密码登录成功
- [ ] Token自动刷新功能正常
- [ ] 退出登录功能正常
- [ ] 错误提示友好准确
- [ ] 统一登录页Tab切换正常
- [ ] 旧文件已删除清理
