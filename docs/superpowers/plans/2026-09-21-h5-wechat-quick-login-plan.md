# H5 微信快捷登录 + 预约手机号绑定 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WeChat quick login on H5 WeChat browser + mobile binding popup during booking for users without a phone number.

**Architecture:**
- `utils/wechatAuth.js` encapsulates WeChat OAuth flow (launch + callback), consistent with existing `payment.js` pattern
- Login page gains a WeChat quick-login button (H5 WeChat browser only)
- `App.vue` onLaunch handles OAuth callback alongside existing pay-bind callback
- `components/MobileBindPopup/` is a reusable bottom-sheet popup for phone binding
- Booking confirm page checks `userStore.mobile` before submitting; shows popup if empty

**Tech Stack:** UniApp (Vue 3 + Pinia), SCSS, conditional compilation for H5

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `api/auth.js` | Modify | Add `socialLogin()` API |
| `api/billiard/user.js` | Modify | Verify `getUserInfo`, `sendUpdateMobileSms`, `updateMobile` exist (already present) |
| `utils/wechatAuth.js` | Create | WeChat OAuth launch + callback handling |
| `store/modules/user.js` | Modify | Add `socialLogin`, `fetchUserInfo`, `sendUpdateMobileSms`, `bindMobile` actions |
| `pages/login/index.vue` | Modify | Add WeChat quick-login button (H5 WeChat only) |
| `App.vue` | Modify | Call `handleWxLoginCallback` in onLaunch H5 branch |
| `components/MobileBindPopup/index.vue` | Create | Reusable bottom-sheet phone binding popup |
| `subpkg/booking/confirm.vue` | Modify | Check mobile before submit, integrate MobileBindPopup |

---

### Task 1: Add socialLogin API to api/auth.js

**Files:**
- Modify: `api/auth.js`

- [ ] **Step 1: Add socialLogin function at end of api/auth.js**

Insert after the existing `updateMobile` export (after line 158):

```javascript
/**
 * 社交账号快捷登录（微信公众号授权码换登录 Token）
 * @param {Object} data - 请求参数
 * @param {number} data.type - 社交平台类型（微信公众号=31）
 * @param {string} data.code - 微信授权返回的 code
 * @param {string} data.state - 授权时生成的 state
 * @returns {Promise<Object>} 返回登录信息（accessToken, refreshToken, userId, nickname, avatar, mobile 等）
 */
export function socialLogin(data) {
  return request({
    url: '/app-api/member/auth/social-login',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}
```

- [ ] **Step 2: Verify file structure**

Confirm the export is at file top level and follows existing patterns (JSDoc + `request({...})` with `isToken: false`).

---

### Task 2: Create utils/wechatAuth.js — WeChat OAuth utility

**Files:**
- Create: `utils/wechatAuth.js`

- [ ] **Step 1: Create the utility module**

```javascript
/**
 * 微信公众号网页授权登录工具
 * 用于 H5 微信浏览器内的快捷登录
 */

// #ifdef H5
import { isWechatBrowser } from '@/utils/platform'
import { getSocialAuthRedirect, socialLogin as socialLoginApi } from '@/api/auth'
import { useUserStore } from '@/store/modules/user'

// 社交平台类型：微信公众号（后端 JustAuth 的 WECHAT_MP）
const SOCIAL_TYPE_WECHAT_MP = 31
// 微信登录上下文缓存 key
const WX_LOGIN_CONTEXT_KEY = 'wx_login_context'

/**
 * 生成随机 state 字符串（防 CSRF）
 * @param {number} length - 长度，默认 16
 * @returns {string}
 */
function generateState(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 从 location.search 读取指定 URL 参数
 * @param {string} name
 * @returns {string|null}
 */
function getSearchParam(name) {
  try {
    const search = window.location.search || ''
    const matched = new RegExp('[?&]' + name + '=([^&]+)').exec(search)
    return matched ? decodeURIComponent(matched[1]) : null
  } catch (e) {
    return null
  }
}

/**
 * 清除 URL 上的 code/state 参数，避免刷新页面时重复处理
 */
function cleanWxAuthParamsFromUrl() {
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    window.history.replaceState(null, '', url.toString())
  } catch (e) {
    console.warn('[wechatAuth] 清理 URL 参数失败:', e)
  }
}

/**
 * 保存登录上下文
 * @param {Object} ctx - { state, redirectUrl }
 */
function saveLoginContext(ctx) {
  try {
    uni.setStorageSync(WX_LOGIN_CONTEXT_KEY, ctx)
  } catch (e) {
    console.warn('[wechatAuth] 保存登录上下文失败:', e)
  }
}

/**
 * 读取登录上下文
 * @returns {Object|null}
 */
function getLoginContext() {
  try {
    return uni.getStorageSync(WX_LOGIN_CONTEXT_KEY) || null
  } catch (e) {
    return null
  }
}

/**
 * 清除登录上下文
 */
function clearLoginContext() {
  try {
    uni.removeStorageSync(WX_LOGIN_CONTEXT_KEY)
  } catch (e) {
    console.warn('[wechatAuth] 清除登录上下文失败:', e)
  }
}

/**
 * 发起微信公众号授权登录
 * 跳转到微信授权页，授权完成后微信回跳 redirectUri 并携带 code + state
 * @param {string} [redirectUri] - 授权回跳地址，默认当前页面 origin + pathname
 * @param {string} [redirectUrl] - 登录成功后跳转的目标页（站内路径），默认首页
 * @returns {Promise<void>} 页面会跳转，不会 resolve
 */
export async function launchWechatLogin(redirectUri, redirectUrl) {
  if (!isWechatBrowser()) {
    uni.showToast({ title: '请在微信浏览器中打开', icon: 'none' })
    return
  }

  // 回跳地址：默认当前页面（去掉 hash 和 query）
  const finalRedirectUri = redirectUri || (window.location.origin + window.location.pathname)
  // 登录成功后跳转目标：默认首页
  const finalRedirectUrl = redirectUrl || '/pages/home/index'

  // 生成 state 并缓存上下文
  const state = generateState()
  saveLoginContext({
    state,
    redirectUrl: finalRedirectUrl,
    ts: Date.now()
  })

  try {
    uni.showLoading({ title: '跳转中...', mask: true })
    const res = await getSocialAuthRedirect({
      type: SOCIAL_TYPE_WECHAT_MP,
      redirectUri: finalRedirectUri
    })
    uni.hideLoading()
    const authUrl = res.data
    if (!authUrl) {
      clearLoginContext()
      throw new Error('获取微信授权链接失败')
    }
    window.location.href = authUrl
  } catch (error) {
    uni.hideLoading()
    clearLoginContext()
    const msg = (error && error.message) || '获取微信授权失败'
    uni.showToast({ title: msg, icon: 'none' })
    throw error
  }
}

/**
 * 检测并处理微信登录回调
 * 在 App.vue onLaunch 中调用。若检测到 code + 登录上下文，则完成登录并跳转。
 * @returns {Promise<boolean>} 是否处理了登录回调
 */
export async function handleWxLoginCallback() {
  if (!isWechatBrowser()) return false

  const code = getSearchParam('code')
  const state = getSearchParam('state')
  if (!code) return false

  const context = getLoginContext()
  // 仅当存在本模块写入的登录上下文时才处理，避免与其它 OAuth 流程冲突
  if (!context || !context.state) {
    return false
  }

  // 先清理，避免刷新/重复触发
  clearLoginContext()
  cleanWxAuthParamsFromUrl()

  // 校验 state
  if (state !== context.state) {
    uni.showToast({ title: '授权状态异常，请重试', icon: 'none' })
    return false
  }

  try {
    uni.showLoading({ title: '登录中...', mask: true })
    const userStore = useUserStore()
    await userStore.socialLogin({
      type: SOCIAL_TYPE_WECHAT_MP,
      code,
      state
    })
    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })

    // 登录成功后跳转
    const target = context.redirectUrl || '/pages/home/index'
    setTimeout(() => {
      // 判断是否是 tabbar 页面
      const tabBarPages = ['pages/home/index', 'pages/coach/list', 'pages/order/list', 'pages/mine/index']
      const cleanTarget = target.replace(/^\//, '')
      if (tabBarPages.includes(cleanTarget)) {
        uni.switchTab({ url: '/' + cleanTarget })
      } else {
        uni.reLaunch({ url: target })
      }
    }, 500)

    return true
  } catch (error) {
    uni.hideLoading()
    const msg = (error && error.message) || '微信登录失败'
    uni.showToast({ title: msg, icon: 'none' })
    return false
  }
}

export default {
  launchWechatLogin,
  handleWxLoginCallback,
  SOCIAL_TYPE_WECHAT_MP
}
// #endif

// #ifndef H5
// 非 H5 平台导出空实现，避免编译错误
export function launchWechatLogin() {
  return Promise.reject(new Error('仅 H5 平台支持微信快捷登录'))
}
export function handleWxLoginCallback() {
  return Promise.resolve(false)
}
export default {
  launchWechatLogin,
  handleWxLoginCallback
}
// #endif
```

- [ ] **Step 2: Verify conditional compilation structure**

The file uses `#ifdef H5` / `#ifndef H5` blocks to provide platform-appropriate exports. Both blocks export `launchWechatLogin`, `handleWxLoginCallback`, and a default export so other files can import without error on all platforms.

---

### Task 3: Add new actions to store/modules/user.js

**Files:**
- Modify: `store/modules/user.js`

- [ ] **Step 1: Add imports at top of file**

Update the import block (around line 16-25). Add `socialLogin as socialLoginApi` to the auth imports, and add new user API imports:

```javascript
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
```

Note: `updateMobile` already exists in `api/auth.js` (pointing to `/app-api/billiard/user/update-mobile`). `api/billiard/user.js` also has an identical `updateMobile`. We import the billiard one as `updateMobileFromUserApi` and use it for the new `bindMobile` action for semantic clarity (it lives in the user domain).

- [ ] **Step 2: Add socialLogin action**

Insert after `passwordLoginAction` (around line 114):

```javascript
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
```

- [ ] **Step 3: Add fetchUserInfo action**

Insert after `socialLoginAction`:

```javascript
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
```

- [ ] **Step 4: Add sendUpdateMobileSms action**

Insert after `fetchUserInfoAction`:

```javascript
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
```

- [ ] **Step 5: Add bindMobile action**

Insert after `sendUpdateMobileSmsAction`:

```javascript
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
```

- [ ] **Step 6: Add new actions to the return object**

Update the return block (around line 214-235):

```javascript
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
```

---

### Task 4: Add WeChat login button to pages/login/index.vue

**Files:**
- Modify: `pages/login/index.vue`

- [ ] **Step 1: Add imports in script setup**

Add after the existing imports (around line 143), inside conditional compilation:

```javascript
// #ifdef H5
import { isWechatBrowser } from '@/utils/platform'
import { launchWechatLogin } from '@/utils/wechatAuth'
// #endif
```

- [ ] **Step 2: Add reactive state**

Add after `isSubmitting` ref (around line 193):

```javascript
// 微信登录 loading
const wechatLoading = ref(false)

// #ifdef H5
// 是否显示微信登录按钮
const showWechatLogin = computed(() => isWechatBrowser())
// #endif
// #ifndef H5
const showWechatLogin = computed(() => false)
// #endif
```

- [ ] **Step 3: Add wechat login button in template**

Insert between the submit buttons (after the password login button at line 98, before the "返回首页" button at line 101):

```html
      <!-- 微信快捷登录按钮（H5 微信浏览器） -->
      <!-- #ifdef H5 -->
      <button
        v-if="showWechatLogin"
        class="btn-wechat-login"
        @click="handleWechatLogin"
        :disabled="wechatLoading"
      >
        <text class="wechat-icon">💬</text>
        <text class="wechat-text">{{ wechatLoading ? '登录中...' : '微信快捷登录' }}</text>
      </button>
      <!-- #endif -->
```

- [ ] **Step 4: Add handleWechatLogin method**

Add after `handleSubmit` function (around line 326):

```javascript
// 微信快捷登录
const handleWechatLogin = async () => {
  // #ifdef H5
  if (!agree.value) {
    uni.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
    return
  }
  if (wechatLoading.value) return

  try {
    wechatLoading.value = true
    // 保存当前登录跳转目标，登录成功后跳回
    const redirectPage = uni.getStorageSync('loginRedirectPage')
    let redirectUrl = '/pages/home/index'
    if (redirectPage) {
      const redirectParams = uni.getStorageSync('loginRedirectParams')
      let url = '/' + redirectPage
      if (redirectParams) {
        const params = Object.keys(redirectParams)
          .map(key => `${key}=${encodeURIComponent(redirectParams[key])}`)
          .join('&')
        url += '?' + params
      }
      redirectUrl = url
    }
    await launchWechatLogin(undefined, redirectUrl)
  } catch (error) {
    console.error('微信登录失败:', error)
  } finally {
    wechatLoading.value = false
  }
  // #endif
}
```

- [ ] **Step 5: Add button styles**

Add in the `<style>` block, inside `.form-section` (after `.btn-back-home` styles, around line 553):

```scss
  /* 微信快捷登录按钮 */
  .btn-wechat-login {
    width: 100%;
    height: 96rpx;
    line-height: 96rpx;
    background: #07C160;
    color: #fff;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 32rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    &::after { border: none; }
    &[disabled] {
      opacity: 0.6;
    }
  }
  .wechat-icon {
    font-size: 36rpx;
  }
  .wechat-text {
    color: #fff;
  }
```

---

### Task 5: Wire handleWxLoginCallback in App.vue

**Files:**
- Modify: `App.vue`

- [ ] **Step 1: Add import alongside pay bind callback**

Update the H5 import block (around line 22-24):

```javascript
// #ifdef H5
import { handleWxPayBindCallback } from '@/utils/payment'
import { handleWxLoginCallback } from '@/utils/wechatAuth'
// #endif
```

- [ ] **Step 2: Add callback call in onLaunch**

In the H5 block of `onLaunch`, after the existing `handleWxPayBindCallback()` setTimeout block (around line 61), add:

```javascript
  // 微信快捷登录回跳处理
  setTimeout(() => {
    try {
      handleWxLoginCallback()
    } catch (e) {
      console.warn('[App] 微信登录回跳处理失败:', e)
    }
  }, 300)
```

Note: The pay-bind callback checks for `wx_pay_bind_context`, and the login callback checks for `wx_login_context`. They have different context keys, so the one without matching context returns false immediately. Order doesn't matter; pay-bind comes first to preserve existing behavior.

---

### Task 6: Create MobileBindPopup component

**Files:**
- Create: `components/MobileBindPopup/index.vue`

- [ ] **Step 1: Create the component file**

```vue
<template>
  <!-- 遮罩层 -->
  <view v-if="visible" class="bind-popup-mask" @click="handleClose">
    <!-- 弹层内容（阻止冒泡） -->
    <view class="bind-popup-wrapper" @click.stop>
      <!-- 顶部栏 -->
      <view class="popup-header">
        <text class="popup-title">{{ title }}</text>
        <view class="popup-close" @click="handleClose">
          <uni-icons type="close" size="20" color="#999" />
        </view>
      </view>

      <!-- 提示文案 -->
      <view class="popup-tip">{{ tip }}</view>

      <!-- 手机号输入 -->
      <view class="input-group">
        <uni-icons type="phone" size="20" color="#00BB88" class="input-icon" />
        <input
          class="input"
          v-model="mobile"
          placeholder="请输入手机号"
          placeholder-class="placeholder"
          maxlength="11"
          type="number"
        />
      </view>

      <!-- 验证码输入 + 获取按钮 -->
      <view class="input-group input-group-row">
        <view class="input-wrap">
          <uni-icons type="locked" size="20" color="#00BB88" class="input-icon" />
          <input
            class="input"
            v-model="code"
            placeholder="请输入验证码"
            placeholder-class="placeholder"
            maxlength="6"
            type="number"
          />
        </view>
        <button
          class="btn-code"
          :class="{ 'btn-code-disabled': codeCountdown > 0 }"
          @click="handleSendCode"
          :disabled="codeCountdown > 0 || isSending"
        >
          {{ codeCountdown > 0 ? `${codeCountdown}s重新获取` : (isSending ? '发送中...' : '获取验证码') }}
        </button>
      </view>

      <!-- 确认按钮 -->
      <button class="btn-submit" @click="handleSubmit" :disabled="isSubmitting">
        {{ isSubmitting ? '绑定中...' : submitText }}
      </button>

      <!-- 底部安全区 -->
      <view class="safe-bottom"></view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/store/modules/user'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '绑定手机号'
  },
  tip: {
    type: String,
    default: '预约需要验证手机号，请先绑定'
  },
  submitText: {
    type: String,
    default: '确认绑定'
  }
})

const emit = defineEmits(['close', 'success', 'update:visible'])

const userStore = useUserStore()

const mobile = ref('')
const code = ref('')
const codeCountdown = ref(0)
const isSending = ref(false)
const isSubmitting = ref(false)
let countdownTimer = null

// 显示时重置表单
watch(() => props.visible, (val) => {
  if (val) {
    mobile.value = ''
    code.value = ''
    codeCountdown.value = 0
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }
})

// 手机号格式校验
const isValidMobile = computed(() => {
  return /^1[3-9]\d{9}$/.test(mobile.value)
})

// 关闭弹框
function handleClose() {
  if (isSubmitting.value) return
  emit('close')
  emit('update:visible', false)
}

// 发送验证码
async function handleSendCode() {
  if (!mobile.value) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!isValidMobile.value) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }
  if (codeCountdown.value > 0 || isSending.value) return

  try {
    isSending.value = true
    uni.showLoading({ title: '发送中...' })
    await userStore.sendUpdateMobileSms(mobile.value)
    uni.hideLoading()
    uni.showToast({ title: '验证码已发送', icon: 'success' })

    // 开始倒计时
    codeCountdown.value = 60
    countdownTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    const msg = (error && error.message) || '发送验证码失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    isSending.value = false
  }
}

// 提交绑定
async function handleSubmit() {
  if (!mobile.value) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!isValidMobile.value) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }
  if (!code.value) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  if (isSubmitting.value) return

  try {
    isSubmitting.value = true
    uni.showLoading({ title: '绑定中...', mask: true })
    await userStore.bindMobile({
      mobile: mobile.value,
      code: code.value
    })
    uni.hideLoading()
    uni.showToast({ title: '绑定成功', icon: 'success' })

    // 刷新用户信息
    try {
      await userStore.fetchUserInfo()
    } catch (e) {
      console.warn('[MobileBindPopup] 刷新用户信息失败:', e)
    }

    // 延迟关闭，让用户看到成功提示
    setTimeout(() => {
      emit('success', { mobile: mobile.value })
      emit('update:visible', false)
    }, 1200)
  } catch (error) {
    uni.hideLoading()
    const msg = (error && error.message) || '绑定失败，请重试'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.bind-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bind-popup-wrapper {
  width: 100%;
  background: var(--bg-card);
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx 48rpx 32rpx;
  box-sizing: border-box;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;

  .popup-title {
    font-size: 36rpx;
    font-weight: bold;
    color: var(--text-primary);
  }

  .popup-close {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.popup-tip {
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-bottom: 32rpx;
  line-height: 1.5;
}

.input-group {
  width: 100%;
  height: 96rpx;
  background: var(--bg-secondary);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  padding: 0 0 0 32rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
  position: relative;

  .input-icon {
    margin-right: 16rpx;
  }

  .input {
    flex: 1;
    font-size: 32rpx;
    color: var(--text-primary);
    line-height: 1;
  }

  .placeholder {
    color: var(--text-secondary);
  }
}

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

.btn-submit {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: #00BB88;
  color: #fff;
  border-radius: 48rpx;
  font-size: 36rpx;
  font-weight: bold;
  margin-top: 16rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(0, 187, 136, 0.3);
  &::after { border: none; }
  &[disabled] {
    opacity: 0.6;
  }
}

.safe-bottom {
  height: env(safe-area-inset-bottom);
}
</style>
```

---

### Task 7: Integrate MobileBindPopup in booking confirm page

**Files:**
- Modify: `subpkg/booking/confirm.vue`

- [ ] **Step 1: Add imports in script setup**

Find the script setup section and add:

```javascript
import { useUserStore } from '@/store/modules/user'
import MobileBindPopup from '@/components/MobileBindPopup/index.vue'
```

Then find where reactive state is declared (look for `const isSubmitting = ref(...)`) and add:

```javascript
const userStore = useUserStore()

// 手机号绑定弹框
const showMobileBind = ref(false)
```

- [ ] **Step 2: Add MobileBindPopup to template**

Add at the end of the template, before the closing tag of the root wrapper (after all existing pickers/popups):

```html
    <!-- 手机号绑定弹框 -->
    <MobileBindPopup
      v-model:visible="showMobileBind"
      title="绑定手机号"
      tip="预约需要验证手机号，请先绑定"
      @success="onMobileBindSuccess"
    />
```

- [ ] **Step 3: Add mobile check at start of handleAction**

Find `const handleAction = async () => {` and add the mobile check at the very beginning, before the userAgree check:

```javascript
const handleAction = async () => {
  // 校验手机号（未绑定则弹框）
  if (!userStore.mobile) {
    showMobileBind.value = true
    return
  }

  if (!userAgree.value) {
    uni.showToast({ title: '请先阅读并同意服务协议和退款规则', icon: 'none' })
    return
  }
  // ... rest of existing code stays unchanged
```

- [ ] **Step 4: Add onMobileBindSuccess handler**

Add after `handleAction`:

```javascript
// 手机号绑定成功回调
function onMobileBindSuccess() {
  // 绑定成功后自动继续下单
  handleAction()
}
```

---

### Task 8: End-to-end manual verification

No automated test framework for this UniApp project. Manual verification checklist:

- [ ] **Step 1: Verify no build errors**
  Run `npm run dev:h5` and confirm the page compiles without errors.

- [ ] **Step 2: WeChat button visibility**
  - In regular browser: open login page, confirm no WeChat button
  - In WeChat browser (or UA spoof): confirm WeChat green button shows below login button, above "返回首页"

- [ ] **Step 3: Login flow (simulated)**
  - Clicking WeChat login without agreement: shows toast about agreement
  - With agreement: shows "跳转中..." loading, then redirects to WeChat auth URL

- [ ] **Step 4: Callback handling (requires live WeChat auth)**
  - After successful WeChat auth: returns to app, shows "登录成功", redirects to home
  - State mismatch: shows "授权状态异常，请重试"
  - After login, user info (nickname, avatar) shows correctly on "我的" page

- [ ] **Step 5: Mobile bind popup**
  - User without mobile goes to booking confirm page
  - Tapping "创建订单": opens mobile bind popup (bottom sheet)
  - Enter invalid phone: shows format error
  - Tap "获取验证码" with valid phone: sends code, starts 60s countdown
  - Enter wrong code: shows error toast
  - Enter correct code: shows "绑定成功", closes popup, auto-submits order

- [ ] **Step 6: Existing pay-bind flow not broken**
  - WeChat pay in H5 WeChat browser still works for already-bound users
  - "Bind WeChat then pay" flow still works (triggers pay-bind callback, not login callback)

---

## Notes

- **No git operations.** Save files locally only; user will commit after review.
- **Conditional compilation**: All H5-only code uses `#ifdef H5` / `#ifndef H5` blocks to avoid breaking other platforms (mp-weixin, app-plus).
- **Existing patterns followed**: Same `setLoginInfo`, same `sendCode` countdown pattern, same button styles as login page and payment module.
- **State management**: New actions follow the existing Promise-wrapping pattern in `user.js`.
- **Component pattern**: MobileBindPopup uses `v-model:visible` for two-way binding, emits `success` event with result — same pattern as existing pickers in confirm.vue.