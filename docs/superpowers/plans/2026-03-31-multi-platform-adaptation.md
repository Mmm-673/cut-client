# 多端适配实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 cut-client 项目添加小程序、iOS、鸿蒙、安卓的完整多端适配，确保所有平台都能正常运行。

**Architecture:** 采用 UniApp 条件编译 + 平台兼容层的双轨架构，分模块逐步适配。

**Tech Stack:** Vue 3 + Pinia + UniApp + uni-ui

---

## 文件变更清单

### 新建文件
- `utils/platform.js` - 平台判断工具库

### 修改文件
- `manifest.json` - 添加各平台配置
- `pages.json` - 调整导航栏配置
- `App.vue` - 移除 H5 独占逻辑
- `permission.js` - 全平台权限拦截
- `utils/request.js` - 适配各平台请求
- `utils/auth.js` - 适配各平台存储
- `utils/common.js` - 添加平台兼容工具
- `pages/login.vue` - 登录页适配
- `pages/index.vue` - 首页适配
- `store/modules/user.js` - 用户存储适配

---

## 任务分解

### Task 1: 配置模块 - manifest.json 多平台配置

**Files:**
- Modify: `manifest.json`

**Goal:** 补充完整的各平台配置，包括小程序、iOS、Android、鸿蒙

- [ ] **Step 1: 备份现有 manifest.json**

读取当前内容作为备份。

- [ ] **Step 2: 添加小程序平台配置**

在 `manifest.json` 中添加以下配置：

```json
{
  "mp-alipay": {
    "appid": "",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true,
      "postcss": true
    },
    "usingComponents": true
  },
  "mp-baidu": {
    "appid": "",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true,
      "postcss": true
    },
    "usingComponents": true
  },
  "mp-toutiao": {
    "appid": "",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true,
      "postcss": true
    },
    "usingComponents": true
  },
  "mp-xhs": {
    "appid": "",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true,
      "postcss": true
    },
    "usingComponents": true
  },
  "mp-kuaishou": {
    "appid": "",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true,
      "postcss": true
    },
    "usingComponents": true
  },
  "mp-lark": {
    "appid": "",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true,
      "postcss": true
    },
    "usingComponents": true
  },
  "mp-jd": {
    "appid": "",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true,
      "postcss": true
    },
    "usingComponents": true
  }
}
```

- [ ] **Step 3: 添加鸿蒙平台配置**

在 `manifest.json` 中添加：

```json
{
  "harmony": {
    "appid": "",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "minified": true,
      "postcss": true
    },
    "usingComponents": true
  }
}
```

- [ ] **Step 4: 优化 app-plus 配置**

更新 `app-plus` 配置，添加 iOS 特有配置：

```json
{
  "app-plus": {
    "usingComponents": true,
    "nvueCompiler": "uni-app",
    "splashscreen": {
      "alwaysShowBeforeRender": true,
      "waiting": true,
      "autoclose": true,
      "delay": 0
    },
    "modules": {},
    "distribute": {
      "android": {
        "permissions": [
          "<uses-permission android:name=\"android.permission.CHANGE_NETWORK_STATE\"/>",
          "<uses-permission android:name=\"android.permission.MOUNT_UNMOUNT_FILESYSTEMS\"/>",
          "<uses-permission android:name=\"android.permission.VIBRATE\"/>",
          "<uses-permission android:name=\"android.permission.READ_LOGS\"/>",
          "<uses-permission android:name=\"android.permission.ACCESS_WIFI_STATE\"/>",
          "<uses-feature android:name=\"android.hardware.camera.autofocus\"/>",
          "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\"/>",
          "<uses-permission android:name=\"android.permission.CAMERA\"/>",
          "<uses-permission android:name=\"android.permission.GET_ACCOUNTS\"/>",
          "<uses-permission android:name=\"android.permission.READ_PHONE_STATE\"/>",
          "<uses-permission android:name=\"android.permission.CHANGE_WIFI_STATE\"/>",
          "<uses-permission android:name=\"android.permission.WAKE_LOCK\"/>",
          "<uses-permission android:name=\"android.permission.FLASHLIGHT\"/>",
          "<uses-feature android:name=\"android.hardware.camera\"/>",
          "<uses-permission android:name=\"android.permission.WRITE_SETTINGS\"/>"
        ]
      },
      "ios": {
        "dSYMs": false,
        "plist": {
          "NSCameraUsageDescription": "需要访问您的相机进行拍照",
          "NSPhotoLibraryUsageDescription": "需要访问您的相册选择图片",
          "NSPhotoLibraryAddUsageDescription": "需要保存图片到您的相册"
        },
        "entitlements": {
          "com.apple.security.application-groups": []
        }
      },
      "sdkConfigs": {}
    }
  }
}
```

---

### Task 2: 配置模块 - pages.json 导航栏适配

**Files:**
- Modify: `pages.json`

**Goal:** 确保导航栏样式在各平台一致

- [ ] **Step 1: 优化 globalStyle 配置**

更新 `pages.json` 的 `globalStyle`，添加平台兼容配置：

```json
{
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "RuoYi",
    "navigationBarBackgroundColor": "#FFFFFF",
    "backgroundColor": "#F8F8F8",
    "enablePullDownRefresh": false,
    "backgroundColorTop": "#FFFFFF",
    "backgroundColorBottom": "#F8F8F8"
  }
}
```

- [ ] **Step 2: 确保所有页面都有完整的 style 配置**

检查并确保每个页面的 style 配置包含平台兼容属性。

---

### Task 3: 核心模块 - 新增 platform.js 平台判断工具

**Files:**
- Create: `utils/platform.js`

**Goal:** 提供统一的平台判断 API

- [ ] **Step 1: 创建 platform.js 文件**

```javascript
/**
 * 平台判断工具库
 * 提供统一的平台检测 API
 */

/**
 * 是否为 H5 平台
 */
export function isH5() {
  // #ifdef H5
  return true
  // #endif
  return false
}

/**
 * 是否为小程序平台（任意小程序）
 */
export function isMP() {
  // #ifdef MP
  return true
  // #endif
  return false
}

/**
 * 是否为微信小程序
 */
export function isMPWeixin() {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  return false
}

/**
 * 是否为支付宝小程序
 */
export function isMPAlipay() {
  // #ifdef MP-ALIPAY
  return true
  // #endif
  return false
}

/**
 * 是否为 App 平台
 */
export function isApp() {
  // #ifdef APP-PLUS
  return true
  // #endif
  return false
}

/**
 * 是否为鸿蒙平台
 */
export function isHarmony() {
  // #ifdef HARMONY
  return true
  // #endif
  return false
}

/**
 * 是否为 iOS 平台
 */
export function isIOS() {
  // #ifdef APP-PLUS
  try {
    const systemInfo = uni.getSystemInfoSync()
    return systemInfo.platform === 'ios'
  } catch (e) {
    return false
  }
  // #endif
  return false
}

/**
 * 是否为 Android 平台
 */
export function isAndroid() {
  // #ifdef APP-PLUS
  try {
    const systemInfo = uni.getSystemInfoSync()
    return systemInfo.platform === 'android'
  } catch (e) {
    return false
  }
  // #endif
  return false
}

/**
 * 获取当前平台名称
 */
export function getPlatformName() {
  if (isH5()) return 'H5'
  if (isMPWeixin()) return '微信小程序'
  if (isMPAlipay()) return '支付宝小程序'
  if (isMP()) return '小程序'
  if (isHarmony()) return '鸿蒙'
  if (isIOS()) return 'iOS'
  if (isAndroid()) return 'Android'
  if (isApp()) return 'App'
  return '未知'
}

/**
 * 获取安全区域信息
 */
export function getSafeArea() {
  try {
    const systemInfo = uni.getSystemInfoSync()
    return systemInfo.safeArea || {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  } catch (e) {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  }
}

/**
 * 获取状态栏高度
 */
export function getStatusBarHeight() {
  try {
    const systemInfo = uni.getSystemInfoSync()
    return systemInfo.statusBarHeight || 0
  } catch (e) {
    return 0
  }
}

export default {
  isH5,
  isMP,
  isMPWeixin,
  isMPAlipay,
  isApp,
  isHarmony,
  isIOS,
  isAndroid,
  getPlatformName,
  getSafeArea,
  getStatusBarHeight
}
```

---

### Task 4: 核心模块 - request.js 请求适配

**Files:**
- Modify: `utils/request.js`

**Goal:** 确保请求在各平台正常工作

- [ ] **Step 1: 修改 request.js，添加平台兼容处理**

完整的 request.js 内容：

```javascript
import config from '@/config'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { useUserStore } from '@/store/modules/user'
import { toast, showConfirm, tansParams } from '@/utils/common'
import { isMP, isHarmony } from '@/utils/platform'

let timeout = 10000
const baseUrl = config.baseUrl

const request = config => {
  // 是否需要设置 token
  const isToken = (config.headers || {}).isToken === false
  config.header = config.header || {}
  
  // 平台特定请求头处理
  if (isMP()) {
    // 小程序平台添加标识
    config.header['X-Platform'] = 'miniprogram'
  } else if (isHarmony()) {
    // 鸿蒙平台添加标识
    config.header['X-Platform'] = 'harmony'
  }
  
  if (getToken() && !isToken) {
    config.header['Authorization'] = 'Bearer ' + getToken()
  }
  
  // get请求映射params参数
  if (config.params) {
    let url = config.url + '?' + tansParams(config.params)
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
      // 支付宝小程序特有的配置
      enableCookie: true,
      // #endif
      // #ifdef MP-WEIXIN
      // 微信小程序特有的配置
      enableHttp2: false,
      enableQuic: false,
      enableCache: true,
      // #endif
    }).then(response => {
      const res = response
      const code = res.data.code || 200
      const msg = errorCode[code] || res.data.msg || errorCode['default']
      
      if (code === 401) {
        showConfirm('登录状态已过期，您可以继续留在该页面，或者重新登录?').then(res => {
          if (res.confirm) {
            useUserStore().logOut().then(() => {
              uni.reLaunch({ url: '/pages/login' })
            })
          }
        })
        reject('无效的会话，或者会话已过期，请重新登录。')
      } else if (code === 500) {
        toast(msg)
        reject('500')
      } else if (code !== 200) {
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

---

### Task 5: 核心模块 - auth.js 和 storage.js 存储适配

**Files:**
- Modify: `utils/auth.js`
- Read: `utils/storage.js`

**Goal:** 确保存储在各平台正常工作

- [ ] **Step 1: 读取 utils/storage.js 查看当前实现**

- [ ] **Step 2: 更新 utils/auth.js，添加平台兼容说明**

```javascript
const TokenKey = 'App-Token'

/**
 * 获取 Token
 * 兼容各平台存储方式
 */
export function getToken() {
  try {
    return uni.getStorageSync(TokenKey)
  } catch (e) {
    console.warn('获取 Token 失败:', e)
    return null
  }
}

/**
 * 设置 Token
 * 兼容各平台存储方式
 */
export function setToken(token) {
  try {
    return uni.setStorageSync(TokenKey, token)
  } catch (e) {
    console.warn('设置 Token 失败:', e)
    return false
  }
}

/**
 * 移除 Token
 * 兼容各平台存储方式
 */
export function removeToken() {
  try {
    return uni.removeStorageSync(TokenKey)
  } catch (e) {
    console.warn('移除 Token 失败:', e)
    return false
  }
}
```

---

### Task 6: 核心模块 - common.js 添加平台工具

**Files:**
- Modify: `utils/common.js`

**Goal:** 添加更多平台兼容的工具函数

- [ ] **Step 1: 更新 utils/common.js**

```javascript
/**
 * 显示消息提示框
 * @param content 提示的标题
 */
export function toast(content) {
  uni.showToast({
    icon: 'none',
    title: content,
    duration: 2000
  })
}

/**
 * 显示模态弹窗
 * @param content 提示的标题
 */
export function showConfirm(content) {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: '提示',
      content: content,
      cancelText: '取消',
      confirmText: '确定',
      success: function(res) {
        resolve(res)
      },
      fail: function(err) {
        reject(err)
      }
    })
  })
}

/**
 * 显示加载提示
 * @param title 加载提示文字
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({
    title: title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
export function hideLoading() {
  uni.hideLoading()
}

/**
 * 参数处理
 * @param params 参数
 */
export function tansParams(params) {
  let result = ''
  for (const propName of Object.keys(params)) {
    const value = params[propName]
    var part = encodeURIComponent(propName) + "="
    if (value !== null && value !== "" && typeof (value) !== "undefined") {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== "" && typeof (value[key]) !== 'undefined') {
            let params = propName + '[' + key + ']'
            var subPart = encodeURIComponent(params) + "="
            result += subPart + encodeURIComponent(value[key]) + "&"
          }
        }
      } else {
        result += part + encodeURIComponent(value) + "&"
      }
    }
  }
  return result
}

/**
 * 获取系统信息（安全封装）
 */
export function getSystemInfo() {
  try {
    return uni.getSystemInfoSync()
  } catch (e) {
    console.warn('获取系统信息失败:', e)
    return {
      platform: 'unknown',
      windowWidth: 375,
      windowHeight: 667,
      statusBarHeight: 0
    }
  }
}
```

---

### Task 7: 核心模块 - permission.js 全平台权限拦截

**Files:**
- Modify: `permission.js`

**Goal:** 移除 H5 独占逻辑，支持全平台

- [ ] **Step 1: 更新 permission.js**

```javascript
import { getToken } from '@/utils/auth'

// 登录页面
const loginPage = "/pages/login"
  
// 页面白名单
const whiteList = [
  '/pages/login', '/pages/register', '/pages/common/webview/index'
]

// 检查地址白名单
function checkWhite(url) {
  const path = url.split('?')[0]
  return whiteList.indexOf(path) !== -1
}

// 页面跳转验证拦截器
let list = ["navigateTo", "redirectTo", "reLaunch", "switchTab"]
list.forEach(item => {
  uni.addInterceptor(item, {
    invoke(to) {
      if (getToken()) {
        if (to.url === loginPage) {
          uni.reLaunch({ url: "/" })
          return false
        }
        return true
      } else {
        if (checkWhite(to.url)) {
          return true
        }
        uni.reLaunch({ url: loginPage })
        return false
      }
    },
    fail(err) {
      console.log('路由拦截失败:', err)
    }
  })
})
```

---

### Task 8: 核心模块 - App.vue 移除 H5 独占逻辑

**Files:**
- Modify: `App.vue`

**Goal:** 让 App.vue 支持全平台初始化

- [ ] **Step 1: 更新 App.vue**

```html
<script setup>
  import config from './config'
  import { getToken } from '@/utils/auth'
  import { useConfigStore } from '@/store'
  import { getCurrentInstance } from "vue"
  import { onLaunch } from '@dcloudio/uni-app'

  const { proxy } = getCurrentInstance()

  onLaunch(() => {
    initApp()
  })

  // 初始化应用
  function initApp() {
    // 初始化应用配置
    initConfig()
    // 检查用户登录状态（全平台）
    checkLogin()
  }

  function initConfig() {
    useConfigStore().setConfig(config)
  }

  function checkLogin() {
    // 全平台都检查登录状态
    if (!getToken()) {
      // 避免在页面未加载时跳转
      setTimeout(() => {
        proxy.$tab.reLaunch('/pages/login')
      }, 100)
    }
  }
</script>

<style lang="scss">
  @import '@/static/scss/index.scss';
  
  /* 全局样式 - 安全区域适配 */
  page {
    /* 适配底部安全区域 */
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  /* 顶部安全区域适配 */
  .safe-area-top {
    padding-top: constant(safe-area-inset-top);
    padding-top: env(safe-area-inset-top);
  }
  
  /* 底部安全区域适配 */
  .safe-area-bottom {
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }
</style>
```

---

### Task 9: 页面适配 - login.vue 登录页全平台适配

**Files:**
- Modify: `pages/login.vue`

**Goal:** 确保登录页在各平台正常显示和工作

- [ ] **Step 1: 更新 pages/login.vue**

```html
<template>
  <view class="normal-login-container">
    <view class="logo-content align-center justify-center flex">
      <image style="width: 100rpx;height: 100rpx;" :src="globalConfig.appInfo.logo" mode="aspectFit">
      </image>
      <text class="title">若依移动端登录</text>
    </view>
    <view class="login-form-content">
      <view class="input-item flex align-center">
        <view class="iconfont icon-user icon"></view>
        <input v-model="loginForm.username" class="input" type="text" placeholder="请输入账号" maxlength="30" 
          :adjust-position="true" :cursor-spacing="20" />
      </view>
      <view class="input-item flex align-center">
        <view class="iconfont icon-password icon"></view>
        <input v-model="loginForm.password" type="password" class="input" placeholder="请输入密码" maxlength="20"
          :adjust-position="true" :cursor-spacing="20" />
      </view>
      <view class="input-item flex align-center" style="width: 60%;margin: 0px;" v-if="captchaEnabled">
        <view class="iconfont icon-code icon"></view>
        <input v-model="loginForm.code" type="number" class="input" placeholder="请输入验证码" maxlength="4"
          :adjust-position="true" :cursor-spacing="20" />
        <view class="login-code"> 
          <image :src="codeUrl" @click="getCode" class="login-code-img" mode="aspectFill"
            :lazy-load="true"></image>
        </view>
      </view>
      <view class="action-btn">
        <button @click="handleLogin" class="login-btn cu-btn block bg-blue lg round" :loading="isLoading">
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </view>
      <view class="reg text-center" v-if="register">
        <text class="text-grey1">没有账号？</text>
        <text @click="handleUserRegister" class="text-blue">立即注册</text>
      </view>
      <view class="xieyi text-center">
        <text class="text-grey1">登录即代表同意</text>
        <text @click="handleUserAgrement" class="text-blue">《用户协议》</text>
        <text @click="handlePrivacy" class="text-blue">《隐私协议》</text>
      </view>
    </view>
     
  </view>
</template>

<script setup>
  import { ref, getCurrentInstance } from "vue"
  import { onLoad } from  "@dcloudio/uni-app"
  import { getToken } from '@/utils/auth'
  import { getCodeImg } from '@/api/login'
  import { useConfigStore, useUserStore } from '@/store'

  const { proxy } = getCurrentInstance()
  const globalConfig = useConfigStore().config
  const codeUrl = ref("")
  const isLoading = ref(false)
  // 验证码开关
  const captchaEnabled = ref(true)
  // 用户注册开关
  const register = ref(false)
  const loginForm = ref({
    username: "admin",
    password: "admin123",
    code: "",
    uuid: ""
  })

  // 用户注册
  function handleUserRegister() {
    proxy.$tab.redirectTo(`/pages/register`)
  }

  // 隐私协议
  function handlePrivacy() {
    let site = globalConfig.appInfo.agreements[0]
    proxy.$tab.navigateTo(`/pages/common/webview/index?title=${site.title}&url=${site.url}`)
  }

  // 用户协议
  function handleUserAgrement() {
    let site = globalConfig.appInfo.agreements[1]
    proxy.$tab.navigateTo(`/pages/common/webview/index?title=${site.title}&url=${site.url}`)
  }

  // 获取图形验证码
  function getCode() {
    getCodeImg().then(res => {
      captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
        if (captchaEnabled.value) {
          codeUrl.value = 'data:image/gif;base64,' + res.img
          loginForm.value.uuid = res.uuid
        }
    }).catch(err => {
      console.error('获取验证码失败:', err)
    })
  }

  // 登录方法
  async function handleLogin() {
    if (loginForm.value.username === "") {
      proxy.$modal.msgError("请输入账号")
    } else if (loginForm.value.password === "") {
      proxy.$modal.msgError("请输入密码")
    } else if (loginForm.value.code === "" && captchaEnabled.value) {
      proxy.$modal.msgError("请输入验证码")
    } else {
      isLoading.value = true
      proxy.$modal.loading("登录中，请耐心等待...")
      try {
        await pwdLogin()
      } finally {
        isLoading.value = false
      }
    }
  }

  // 密码登录
  async function pwdLogin() {
    return useUserStore().login(loginForm.value).then(() => {
      proxy.$modal.closeLoading()
      loginSuccess()
    }).catch(() => {
      proxy.$modal.closeLoading()
      if (captchaEnabled.value) {
        getCode()
      }
    })
  }

  // 登录成功后，处理函数
  function loginSuccess() {
    // 设置用户信息
    useUserStore().getInfo().then(() => {
      proxy.$tab.reLaunch('/pages/index')
    }).catch(err => {
      console.error('获取用户信息失败:', err)
      proxy.$tab.reLaunch('/pages/index')
    })
  }

  onLoad(() => {
    // 全平台检查登录状态
    if (getToken()) {
      proxy.$tab.reLaunch('/pages/index')
    }
  })

  getCode()
</script>

<style lang="scss" scoped>
  page {
    background-color: #ffffff;
    /* 禁止页面长按选择 */
    -webkit-user-select: none;
    user-select: none;
  }

  .normal-login-container {
    width: 100%;
    min-height: 100vh;
    box-sizing: border-box;

    .logo-content {
      width: 100%;
      font-size: 21px;
      text-align: center;
      padding-top: 15%;
      box-sizing: border-box;

      image {
        border-radius: 4px;
      }

      .title {
        margin-left: 10px;
        /* 防止文字换行 */
        white-space: nowrap;
      }
    }

    .login-form-content {
      text-align: center;
      margin: 20px auto;
      margin-top: 15%;
      width: 80%;
      box-sizing: border-box;

      .input-item {
        margin: 20px auto;
        background-color: #f5f6f7;
        height: 45px;
        border-radius: 20px;
        box-sizing: border-box;

        .icon {
          font-size: 38rpx;
          margin-left: 10px;
          color: #999;
          /* 防止图标缩放 */
          flex-shrink: 0;
        }

        .input {
          width: 100%;
          font-size: 14px;
          line-height: 20px;
          text-align: left;
          padding-left: 15px;
          box-sizing: border-box;
        }

      }

      .login-btn {
        margin-top: 40px;
        height: 45px;
      }
      
      .reg {
        margin-top: 15px;
      }
      
      .xieyi {
        color: #333;
        margin-top: 20px;
        font-size: 13px;
      }
      
      .login-code {
        height: 38px;
        float: right;
        display: flex;
        align-items: center;
      
        .login-code-img {
          height: 38px;
          width: 200rpx;
          border-radius: 4px;
        }
      }
    }
  }
</style>
```

---

### Task 10: 页面适配 - index.vue 首页全平台适配

**Files:**
- Modify: `pages/index.vue`

**Goal:** 让首页更完善，支持全平台

- [ ] **Step 1: 更新 pages/index.vue，添加实际内容**

```html
<template>
  <view class="home-container">
    <!-- 顶部 banner -->
    <view class="banner-section">
      <swiper class="banner-swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500">
        <swiper-item v-for="(item, index) in bannerList" :key="index">
          <image :src="item" class="banner-image" mode="aspectFill" :lazy-load="true"></image>
        </swiper-item>
      </swiper>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-nav-section">
      <view class="nav-grid">
        <view class="nav-item" v-for="(item, index) in navList" :key="index" @click="handleNavClick(item)">
          <view class="nav-icon" :style="{ backgroundColor: item.bgColor }">
            <text class="iconfont" :class="item.icon"></text>
          </view>
          <text class="nav-text">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <!-- 欢迎信息 -->
    <view class="welcome-section">
      <view class="welcome-card">
        <text class="welcome-title">欢迎使用 RuoYi</text>
        <text class="welcome-desc">基于 UniApp 的轻量级移动端框架</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store'

const userName = ref('')
const bannerList = ref([
  '/static/images/banner/banner01.jpg',
  '/static/images/banner/banner02.jpg',
  '/static/images/banner/banner03.jpg'
])

const navList = ref([
  { name: '工作台', icon: 'icon-service', bgColor: '#3c96f3', path: '/pages/work/index' },
  { name: '个人信息', icon: 'icon-user', bgColor: '#19be6b', path: '/pages/mine/info/index' },
  { name: '修改密码', icon: 'icon-password', bgColor: '#ff9900', path: '/pages/mine/pwd/index' },
  { name: '应用设置', icon: 'icon-setting', bgColor: '#ed4014', path: '/pages/mine/setting/index' }
])

function handleNavClick(item) {
  if (item.path) {
    uni.switchTab({
      url: item.path,
      fail: () => {
        uni.navigateTo({
          url: item.path
        })
      }
    })
  }
}

onMounted(() => {
  const userStore = useUserStore()
  userName.value = userStore.name || '用户'
})
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  background-color: #f5f6f7;
  box-sizing: border-box;
}

.banner-section {
  width: 100%;
  height: 350rpx;
  
  .banner-swiper {
    width: 100%;
    height: 100%;
    
    .banner-image {
      width: 100%;
      height: 100%;
    }
  }
}

.quick-nav-section {
  padding: 30rpx;
  background-color: #ffffff;
  margin: 20rpx 30rpx;
  border-radius: 16rpx;
  
  .nav-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 30rpx;
  }
  
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .nav-icon {
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16rpx;
      
      .iconfont {
        font-size: 48rpx;
        color: #ffffff;
      }
    }
    
    .nav-text {
      font-size: 26rpx;
      color: #333333;
    }
  }
}

.welcome-section {
  padding: 0 30rpx;
  
  .welcome-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16rpx;
    padding: 40rpx;
    display: flex;
    flex-direction: column;
    
    .welcome-title {
      font-size: 36rpx;
      color: #ffffff;
      font-weight: bold;
      margin-bottom: 12rpx;
    }
    
    .welcome-desc {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }
}
</style>
```

---

### Task 11: 页面适配 - mine/index.vue "我的"页面优化

**Files:**
- Modify: `pages/mine/index.vue`

**Goal:** 优化个人中心页面，添加安全区域适配

- [ ] **Step 1: 更新 pages/mine/index.vue，添加安全区域适配**

```html
<template>
  <view class="mine-container" :style="{minHeight: `${windowHeight}px`}">
    <!--顶部个人信息栏-->
    <view class="header-section safe-area-top">
      <view class="flex padding justify-between">
        <view class="flex align-center">
          <view v-if="!avatar" class="cu-avatar xl round bg-white">
            <view class="iconfont icon-people text-gray icon"></view>
          </view>
          <image v-if="avatar" @click="handleToAvatar" :src="avatar" class="cu-avatar xl round" mode="aspectFill">
          </image>
          <view v-if="!name" @click="handleToLogin" class="login-tip">
            点击登录
          </view>
          <view v-if="name" @click="handleToInfo" class="user-info">
            <view class="u_title">
              用户名：{{ name }}
            </view>
          </view>
        </view>
        <view @click="handleToInfo" class="flex align-center">
          <text>个人信息</text>
          <view class="iconfont icon-right"></view>
        </view>
      </view>
    </view>

    <view class="content-section">
      <view class="mine-actions grid col-4 text-center">
        <view class="action-item" @click="handleJiaoLiuQun">
          <view class="iconfont icon-friendfill text-pink icon"></view>
          <text class="text">交流群</text>
        </view>
        <view class="action-item" @click="handleBuilding">
          <view class="iconfont icon-service text-blue icon"></view>
          <text class="text">在线客服</text>
        </view>
        <view class="action-item" @click="handleBuilding">
          <view class="iconfont icon-community text-mauve icon"></view>
          <text class="text">反馈社区</text>
        </view>
        <view class="action-item" @click="handleBuilding">
          <view class="iconfont icon-dianzan text-green icon"></view>
          <text class="text">点赞我们</text>
        </view>
      </view>

      <view class="menu-list">
        <view class="list-cell list-cell-arrow" @click="handleToEditInfo">
          <view class="menu-item-box">
            <view class="iconfont icon-user menu-icon"></view>
            <view>编辑资料</view>
          </view>
        </view>
        <view class="list-cell list-cell-arrow" @click="handleHelp">
          <view class="menu-item-box">
            <view class="iconfont icon-help menu-icon"></view>
            <view>常见问题</view>
          </view>
        </view>
        <view class="list-cell list-cell-arrow" @click="handleAbout">
          <view class="menu-item-box">
            <view class="iconfont icon-aixin menu-icon"></view>
            <view>关于我们</view>
          </view>
        </view>
        <view class="list-cell list-cell-arrow" @click="handleToSetting">
          <view class="menu-item-box">
            <view class="iconfont icon-setting menu-icon"></view>
            <view>应用设置</view>
          </view>
        </view>
      </view>

    </view>
    
    <!-- 底部安全区域占位 -->
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup>
  import { useUserStore } from '@/store'
  import { computed, getCurrentInstance, onMounted, ref } from "vue"
  import { getStatusBarHeight } from '@/utils/platform'

  const { proxy } = getCurrentInstance()
  const name = useUserStore().name
  const avatar = computed(() => useUserStore().avatar)
  const windowHeight = ref(0)

  onMounted(() => {
    try {
      const systemInfo = uni.getSystemInfoSync()
      windowHeight.value = systemInfo.windowHeight
    } catch (e) {
      windowHeight.value = 667
    }
  })

  function handleToInfo() {
    proxy.$tab.navigateTo('/pages/mine/info/index')
  }

  function handleToEditInfo() {
    proxy.$tab.navigateTo('/pages/mine/info/edit')
  }

  function handleToSetting() {
    proxy.$tab.navigateTo('/pages/mine/setting/index')
  }

  function handleToLogin() {
    proxy.$tab.reLaunch('/pages/login')
  }

  function handleToAvatar() {
    proxy.$tab.navigateTo('/pages/mine/avatar/index')
  }
      
  function handleHelp() {
    proxy.$tab.navigateTo('/pages/mine/help/index')
  }
      
  function handleAbout() {
    proxy.$tab.navigateTo('/pages/mine/about/index')
  }
      
  function handleJiaoLiuQun() {
    proxy.$modal.showToast('QQ群：①133713780(满)、②146013835(满)、③189091635')
  }
      
  function handleBuilding() {
    proxy.$modal.showToast('模块建设中~')
  }
</script>

<style lang="scss" scoped>
  page {
    background-color: #f5f6f7;
  }

  .mine-container {
    width: 100%;
    min-height: 100vh;
    box-sizing: border-box;
  }

  .safe-area-top {
    padding-top: constant(safe-area-inset-top);
    padding-top: env(safe-area-inset-top);
  }

  .safe-area-bottom {
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .header-section {
    padding: 15px 15px 45px 15px;
    background-color: #3c96f3;
    color: white;
    box-sizing: border-box;

    .login-tip {
      font-size: 18px;
      margin-left: 10px;
    }

    .cu-avatar {
      border: 2px solid #eaeaea;
      flex-shrink: 0;

      .icon {
        font-size: 40px;
      }
    }

    .user-info {
      margin-left: 15px;

      .u_title {
        font-size: 18px;
        line-height: 30px;
      }
    }
  }

  .content-section {
    position: relative;
    top: -50px;

    .mine-actions {
      margin: 15px 15px;
      padding: 20px 0px;
      border-radius: 8px;
      background-color: white;

      .action-item {
        .icon {
          font-size: 28px;
        }

        .text {
          display: block;
          font-size: 13px;
          margin: 8px 0px;
        }
      }
    }
  }
</style>
```

---

### Task 12: Store 适配 - user.js 用户模块优化

**Files:**
- Modify: `store/modules/user.js`

**Goal:** 优化用户存储，确保全平台兼容

- [ ] **Step 1: 更新 store/modules/user.js**

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import config from '@/config'
import storage from '@/utils/storage'
import constant from '@/utils/constant'
import { isHttp, isEmpty } from "@/utils/validate"
import { getInfo, login, logout } from '@/api/login'
import { getToken, removeToken, setToken } from '@/utils/auth'
import defAva from '@/static/images/profile.jpg'

const baseUrl = config.baseUrl

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const id = ref(storage.get(constant.id))
  const name = ref(storage.get(constant.name))
  const avatar = ref(storage.get(constant.avatar))
  const roles = ref(storage.get(constant.roles))
  const permissions = ref(storage.get(constant.permissions))

  const SET_TOKEN = (val) => {
    token.value = val
  }
  const SET_ID = (val) => {
    id.value = val
    storage.set(constant.id, val)
  }
  const SET_NAME = (val) => {
    name.value = val
    storage.set(constant.name, val)
  }
  const SET_AVATAR = (val) => {
    avatar.value = val
    storage.set(constant.avatar, val)
  }
  const SET_ROLES = (val) => {
    roles.value = val
    storage.set(constant.roles, val)
  }
  const SET_PERMISSIONS = (val) => {
    permissions.value = val
    storage.set(constant.permissions, val)
  }

  // 登录
  const loginAction = (userInfo) => {
    const username = userInfo.username.trim()
    const password = userInfo.password
    const code = userInfo.code
    const uuid = userInfo.uuid
    return new Promise((resolve, reject) => {
      login(username, password, code, uuid).then(res => {
        setToken(res.token)
        SET_TOKEN(res.token)
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 获取用户信息
  const getInfoAction = () => {
    return new Promise((resolve, reject) => {
      getInfo().then(res => {
        const user = res.user
        let avatarUrl = user.avatar || ""
        if (!isHttp(avatarUrl)) {
          avatarUrl = (isEmpty(avatarUrl)) ? defAva : baseUrl + avatarUrl
        }
        const userid = (isEmpty(user) || isEmpty(user.userId)) ? "" : user.userId
        const username = (isEmpty(user) || isEmpty(user.userName)) ? "" : user.userName
        if (res.roles && res.roles.length > 0) {
          SET_ROLES(res.roles)
          SET_PERMISSIONS(res.permissions)
        } else {
          SET_ROLES(['ROLE_DEFAULT'])
        }
        SET_ID(userid)
        SET_NAME(username)
        SET_AVATAR(avatarUrl)
        resolve(res)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 退出系统
  const logOutAction = () => {
    return new Promise((resolve, reject) => {
      logout(token.value).then(() => {
        SET_TOKEN('')
        SET_ROLES([])
        SET_PERMISSIONS([])
        SET_ID('')
        SET_NAME('')
        SET_AVATAR('')
        removeToken()
        storage.clean()
        resolve()
      }).catch(error => {
        // 即使退出接口失败，也要清除本地数据
        SET_TOKEN('')
        SET_ROLES([])
        SET_PERMISSIONS([])
        SET_ID('')
        SET_NAME('')
        SET_AVATAR('')
        removeToken()
        storage.clean()
        reject(error)
      })
    })
  }

  return {
    token,
    id,
    name,
    avatar,
    roles,
    permissions,
    SET_AVATAR,
    login: loginAction,
    getInfo: getInfoAction,
    logOut: logOutAction
  }
})
```

---

### Task 13: 全局样式适配 - 安全区域和平台样式

**Files:**
- Read: `static/scss/index.scss`
- Modify: `App.vue` (已在 Task 8 中完成)

**Goal:** 添加全局安全区域适配样式

- [ ] **Step 1: 检查 static/scss/index.scss**

如果需要，添加安全区域相关样式。

---

### Task 14: 导入 platform.js 到 main.js

**Files:**
- Modify: `main.js`

**Goal:** 注册平台工具到全局属性

- [ ] **Step 1: 更新 main.js**

```javascript
import { createSSRApp } from 'vue'
import App from './App'
import store from './store'
import { install } from './plugins'
import './permission'
import { useDict } from '@/utils/dict'
import platform from '@/utils/platform'

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.config.globalProperties.useDict = useDict
  app.config.globalProperties.$platform = platform
  install(app)
  return {
    app
  }
}
```

---

## 验证清单

完成所有任务后，请验证：

- [ ] 所有新建/修改文件已保存
- [ ] manifest.json 包含完整的各平台配置
- [ ] utils/platform.js 已创建并包含所有平台判断函数
- [ ] 登录页可以在各平台正常显示和输入
- [ ] App.vue 移除了 H5 独占的 checkLogin 逻辑
- [ ] 图片使用了正确的 mode 属性
- [ ] input 添加了 adjust-position 属性
- [ ] 安全区域样式已添加
- [ ] 所有条件编译语法正确
