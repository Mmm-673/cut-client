# H5 全面适配实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 UniApp 台球预约应用增加完整的 H5 端支持，包括支付、定位、状态栏、扫码、深度链接、体验优化和 PWA，确保不影响 App 和小程序的现有功能。

**Architecture:** 所有 H5 新增代码通过 UniApp 条件编译（`#ifdef H5` / `#ifndef H5`）完全隔离。7 个模块按依赖顺序实施：支付 → 定位 → 状态栏 → 扫码 → 深度链接 → 体验优化 → PWA。每个模块独立可测试。

**Tech Stack:** UniApp (Vue 3) + Pinia + SCSS + jsQR + html5-qrcode + PWA (manifest.json sdkConfigs)

**Spec:** `docs/superpowers/specs/2026-08-21-h5-adaptation-design.md`

## Global Constraints

- **跨平台隔离原则**：所有 H5 新增代码必须用 `// #ifdef H5` / `// #endif` 包裹，App/小程序代码路径不做修改（只增不改）
- **支付渠道**：H5 端使用 `wx_pub`（微信内）、`wx_wap`（微信外）、`alipay_wap`、`wallet`
- **高德 H5 Key**：`f66420f63919c84eda1b14e1cf8db73e`
- **坐标系**：统一使用 GCJ-02（火星坐标系），与后端一致
- **代码风格**：遵循现有代码风格（Composition API、SCSS、条件编译模式）
- **jsqr 已安装**：`package.json` 中已有 `jsqr@^1.4.0` 依赖

---

## 任务分组说明

共 7 个模块，20 个任务。每个任务独立可测，任务间有明确依赖。

**模块 1：支付**（任务 1-5）— 最核心，H5 支付从无到有
**模块 2：定位**（任务 6-7）— 修复定位失败/超时问题
**模块 3：状态栏**（任务 8）— 自定义导航栏 H5 适配
**模块 4：扫码**（任务 9-10）— H5 相册扫码 + 相机扫码
**模块 5：深度链接**（任务 11-12）— URL 直接打开页面
**模块 6：体验优化**（任务 13-17）— 100vh、TabBar、错误边界等
**模块 7：PWA**（任务 18-20）— 添加到主屏 + 离线缓存

---

### Task 1: 环境检测工具函数

**Files:**
- Modify: `utils/platform.js`

**Interfaces:**
- Produces: `isWechatBrowser(): boolean` — H5 下检测是否微信内置浏览器
- Produces: `isAlipayBrowser(): boolean` — H5 下检测是否支付宝内置浏览器

- [ ] **Step 1: 在 utils/platform.js 末尾添加两个函数**

在 `export default {` 之前添加：

```javascript
/**
 * 是否为微信内置浏览器（仅 H5 有效）
 */
export function isWechatBrowser() {
  // #ifdef H5
  try {
    return /MicroMessenger/i.test(navigator.userAgent)
  } catch (e) {
    return false
  }
  // #endif
  // #ifndef H5
  return false
  // #endif
}

/**
 * 是否为支付宝内置浏览器（仅 H5 有效）
 */
export function isAlipayBrowser() {
  // #ifdef H5
  try {
    return /AlipayClient/i.test(navigator.userAgent)
  } catch (e) {
    return false
  }
  // #endif
  // #ifndef H5
  return false
  // #endif
}
```

- [ ] **Step 2: 更新 default export**

在 `export default` 对象中添加 `isWechatBrowser, isAlipayBrowser`：

```javascript
export default {
  isH5,
  openPermissionSettings,
  isMP,
  isMPWeixin,
  isMPAlipay,
  isApp,
  isHarmony,
  isHarmonyNext,
  isIOS,
  isAndroid,
  getPlatformName,
  getSafeArea,
  getStatusBarHeight,
  openMapNavigation,
  isWechatBrowser,
  isAlipayBrowser
}
```

- [ ] **Step 3: 验证非 H5 平台不包含浏览器检测代码**

检查 MP-WEIXIN 和 APP-PLUS 条件编译下，两个函数都直接返回 `false`，不会执行 `navigator` 相关代码。

---

### Task 2: 支付渠道配置改造（增加 H5 渠道）

**Files:**
- Modify: `utils/payment.js`

**Interfaces:**
- Consumes: `isWechatBrowser()` from `utils/platform.js`
- Produces: `ALL_PAY_CHANNELS` 更新 — wechat/alipay 增加 h5 平台
- Produces: `codeToChannel` 更新 — 增加 wx_pub/wx_wap/alipay_wap 的 h5 映射
- Produces: `resolvePlatformChannelCode()` 更新 — H5 端动态选择渠道编码

- [ ] **Step 1: 更新 import 语句**

在 `utils/payment.js` 顶部 import 中增加：

```javascript
import { isMPWeixin, isApp, isH5, isWechatBrowser } from '@/utils/platform'
```

- [ ] **Step 2: 新增 PAY_CHANNEL 常量**

在 `PAY_CHANNEL` 对象中增加：

```javascript
// 微信WAP支付（H5）
WX_WAP: 'wx_wap',
// 支付宝WAP支付（H5）
ALIPAY_WAP: 'alipay_wap',
```

最终 PAY_CHANNEL 完整对象：
```javascript
export const PAY_CHANNEL = {
  WX_MINIPROGRAM: 'wx_pub',
  WX_APP: 'wx_app',
  WX_WAP: 'wx_wap',
  ALIPAY_APP: 'alipay_app',
  ALIPAY_WAP: 'alipay_wap',
  WALLET: 'wallet'
}
```

- [ ] **Step 3: 更新 ALL_PAY_CHANNELS 的 platforms**

微信支付 platforms 增加 `'h5'`，支付宝 platforms 增加 `'h5'`：

```javascript
{
  value: 'wechat',
  label: '微信支付',
  channelCode: PAY_CHANNEL.WX_MINIPROGRAM,
  icon: '/static/images/pay/wechat.png',
  bgColor: '#07C160',
  platforms: ['mp-weixin', 'app-plus', 'h5']
},
{
  value: 'alipay',
  label: '支付宝',
  channelCode: PAY_CHANNEL.ALIPAY_APP,
  icon: '/static/images/pay/alipay.png',
  bgColor: '#1677FF',
  platforms: ['app-plus', 'h5']
},
```

- [ ] **Step 4: 更新 resolvePlatformChannelCode 函数**

重写该函数，增加 H5 平台的动态渠道选择：

```javascript
function resolvePlatformChannelCode(payValue) {
  const platform = getCurrentPlatform()

  if (payValue === 'wechat') {
    if (platform === 'app-plus') {
      return PAY_CHANNEL.WX_APP
    }
    if (platform === 'h5') {
      // H5 微信浏览器用 JSAPI，普通浏览器用 WAP
      return isWechatBrowser() ? PAY_CHANNEL.WX_MINIPROGRAM : PAY_CHANNEL.WX_WAP
    }
    // mp-weixin 默认
    return PAY_CHANNEL.WX_MINIPROGRAM
  }

  if (payValue === 'alipay') {
    if (platform === 'h5') {
      return PAY_CHANNEL.ALIPAY_WAP
    }
    return PAY_CHANNEL.ALIPAY_APP
  }

  const channel = ALL_PAY_CHANNELS.find(item => item.value === payValue)
  return channel ? channel.channelCode : null
}
```

- [ ] **Step 5: 更新 codeToChannel 映射**

在 `getPayChannelsByEnabled` 函数的 `codeToChannel` 对象中增加：

```javascript
'wx_pub': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: 'wx_pub', platforms: ['mp-weixin', 'h5'] },
'wx_wap': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: 'wx_wap', platforms: ['h5'] },
'wx_lite': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: 'wx_lite', platforms: ['mp-weixin'] },
'wx_app': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: PAY_CHANNEL.WX_APP, platforms: ['app-plus'] },
'alipay_wap': { value: 'alipay', label: '支付宝', icon: '/static/images/pay/alipay.png', bgColor: '#1677FF', channelCode: PAY_CHANNEL.ALIPAY_WAP, platforms: ['h5'] },
'alipay_app': { value: 'alipay', label: '支付宝', icon: '/static/images/pay/alipay.png', bgColor: '#1677FF', channelCode: PAY_CHANNEL.ALIPAY_APP, platforms: ['app-plus'] },
```

注意：`wx_pub` 的 platforms 从 `['mp-weixin']` 改为 `['mp-weixin', 'h5']`（公众号 H5 也用 wx_pub）。
`addedValues` Set 去重机制确保 wx_pub 和 wx_wap 同时启用时不会显示两条「微信支付」。

- [ ] **Step 6: 验证渠道过滤逻辑**

确认在 H5 平台下：
- 后端返回 `wx_pub` → 匹配，显示微信支付
- 后端返回 `wx_wap` → 匹配，显示微信支付（与 wx_pub 去重）
- 后端返回 `alipay_wap` → 匹配，显示支付宝
- 后端返回 `wx_app` / `alipay_app` / `wx_lite` → 不匹配，不显示
- wallet → 匹配，显示钱包支付

---

### Task 3: H5 支付执行函数（跳转式支付）

**Files:**
- Modify: `utils/payment.js`

**Interfaces:**
- Produces: `wechatJsapiPay(payParams): Promise` — 微信公众号 JSAPI 支付
- Produces: `h5WapPay(payUrl): Promise` — WAP 跳转支付（微信 WAP / 支付宝 WAP 通用）
- Produces: `getReturnUrl(payOrderId): string` — 构造支付回跳 URL

- [ ] **Step 1: 新增 getReturnUrl 函数**

在 `walletPay` 函数之前添加：

```javascript
/**
 * 构造 H5 支付回跳地址
 * @param {number} payOrderId - 支付单ID
 * @returns {string} 完整的回跳 URL
 */
function getReturnUrl(payOrderId) {
  // #ifdef H5
  try {
    const baseUrl = window.location.origin + window.location.pathname
    const hash = `#/pages/booking/pay-success`
    const query = `?payOrderId=${payOrderId}&source=callback`
    return baseUrl + hash + query
  } catch (e) {
    return ''
  }
  // #endif
  // #ifndef H5
  return ''
  // #endif
}
```

- [ ] **Step 2: 新增微信 JSAPI 支付函数**

在 `alipayAppPay` 函数之后、`walletPay` 函数之前添加：

```javascript
/**
 * H5 微信 JSAPI 支付（公众号内）
 * @param {Object} payParams - 支付参数
 * @param {string} payParams.appId - 公众号ID
 * @param {string} payParams.timeStamp - 时间戳
 * @param {string} payParams.nonceStr - 随机字符串
 * @param {string} payParams.package - 统一下单 prepay_id
 * @param {string} payParams.signType - 签名方式
 * @param {string} payParams.paySign - 签名
 * @returns {Promise} 支付结果
 */
function wechatJsapiPay(payParams) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    if (typeof WeixinJSBridge === 'undefined') {
      reject({ success: false, message: '请在微信浏览器中打开后再支付' })
      return
    }

    WeixinJSBridge.invoke(
      'getBrandWCPayRequest',
      {
        appId: payParams.appId,
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.packageValue || payParams.package,
        signType: payParams.signType || 'RSA',
        paySign: payParams.paySign
      },
      (res) => {
        if (res.err_msg === 'get_brand_wcpay_request:ok') {
          resolve({ success: true, ...res })
        } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
          reject({ success: false, canceled: true, message: '支付已取消', ...res })
        } else {
          reject({ success: false, message: res.err_msg || '支付失败', ...res })
        }
      }
    )
    // #endif

    // #ifndef H5
    reject({ success: false, message: '非H5环境不支持微信JSAPI支付' })
    // #endif
  })
}
```

- [ ] **Step 3: 新增 H5 WAP 跳转支付函数**

在 `wechatJsapiPay` 之后添加：

```javascript
/**
 * H5 WAP 跳转支付（微信 WAP / 支付宝 WAP 通用）
 * 跳转到第三方支付页面，支付完成后通过 returnUrl 跳回
 * @param {string} payUrl - 支付跳转链接
 * @returns {Promise} 永远不会 resolve，因为页面会跳转
 */
function h5WapPay(payUrl) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    if (!payUrl) {
      reject({ success: false, message: '支付链接无效' })
      return
    }
    // 标记支付中状态，用于回跳后的状态恢复
    try {
      uni.setStorageSync('h5_pay_pending', '1')
    } catch (e) {}
    // 跳转到支付页面
    window.location.href = payUrl
    // 不 resolve，等待页面跳转
    // #endif

    // #ifndef H5
    reject({ success: false, message: '非H5环境不支持WAP支付' })
    // #endif
  })
}
```

---

### Task 4: executePayment 增加 H5 分支 + returnUrl

**Files:**
- Modify: `utils/payment.js`

**Interfaces:**
- Consumes: `wechatJsapiPay()`, `h5WapPay()`, `getReturnUrl()`
- Modifies: `executePayment()` — 增加 H5 支付分支
- Modifies: `submitPayOrder` 调用 — H5 下携带 returnUrl

- [ ] **Step 1: 修改 submitPayOrder 调用，H5 下增加 returnUrl**

在 `executePayment` 函数中，找到 `submitPayOrder` 调用处（约第 444-448 行），修改为：

```javascript
    // 3. 调用后端接口提交支付，获取支付参数
    const submitParams = {
      id: payOrderId,
      channelCode: channelCode,
      displayMode: payValue === 'alipay' ? (isH5() ? undefined : 'app') : undefined
    }

    // H5 下传递 returnUrl，用于支付完成后回跳
    if (isH5()) {
      submitParams.returnUrl = getReturnUrl(payOrderId)
    }

    const submitRes = await submitPayOrder(submitParams)
```

- [ ] **Step 2: 增加 H5 支付分支**

在 `executePayment` 的支付执行分支处（原第 481-490 行），修改为：

```javascript
    // 5. 根据支付方式和平台执行支付
    if (isMPWeixin() && payValue === 'wechat') {
      await wechatMiniProgramPay(payParams)
    } else if (isApp() && payValue === 'wechat') {
      await wechatAppPay(payParams)
    } else if (isApp() && payValue === 'alipay') {
      await alipayAppPay(payParams)
    } else if (isH5() && payValue === 'wechat') {
      // H5 微信支付：微信内用 JSAPI，微信外用 WAP 跳转
      if (isWechatBrowser()) {
        await wechatJsapiPay(payParams)
      } else {
        // WAP 支付：displayContent 是跳转 URL
        const payUrl = typeof payParams === 'string' ? payParams : (payParams.url || payParams.mwebUrl || '')
        await h5WapPay(payUrl)
      }
    } else if (isH5() && payValue === 'alipay') {
      // H5 支付宝 WAP 支付
      const payUrl = typeof payParams === 'string' ? payParams : (payParams.url || '')
      // 如果返回的是 HTML 表单（displayMode=form），直接写入文档
      if (resultData.displayMode === 'form' && typeof displayContent === 'string' && displayContent.includes('<form')) {
        // #ifdef H5
        const div = document.createElement('div')
        div.innerHTML = displayContent
        document.body.appendChild(div)
        const form = div.querySelector('form')
        if (form) {
          form.submit()
        } else {
          await h5WapPay(payUrl)
        }
        // WAP 跳转后页面会离开，不会执行到这里
        // #endif
      } else {
        await h5WapPay(payUrl)
      }
    } else {
      throw new Error('不支持的支付方式或平台')
    }
```

注意：WAP 支付跳转后页面会离开，`confirmPayOrderPaid` 不会被执行。支付结果确认在回跳后的支付成功页中进行。因此 H5 WAP 支付场景下需要特殊处理：跳转后不会执行到第 6 步的 `confirmPayOrderPaid`。

- [ ] **Step 3: 处理 H5 WAP 支付后的返回值**

WAP 支付跳转会让页面离开，不需要 `confirmPayOrderPaid`。需要在 H5 WAP 支付分支后添加提前返回：

在 H5 微信 WAP 和支付宝 WAP 支付的 `h5WapPay` 调用后，添加：

```javascript
      // WAP 支付跳转会离开页面，不执行后续查单
      return { pending: true, message: '正在跳转支付...' }
```

但更稳妥的方式是在 `h5WapPay` 函数之后不继续执行。由于 `h5WapPay` 不会 resolve（页面跳转了），可以把它放在 try 块的末尾，后面的代码不会执行。

简化处理：WAP 支付分支调用 `h5WapPay` 后，直接 throw 一个特殊错误或 return，避免走到 confirmPayOrderPaid。

修改方式：

```javascript
    } else if (isH5() && payValue === 'wechat') {
      if (isWechatBrowser()) {
        await wechatJsapiPay(payParams)
      } else {
        const payUrl = typeof payParams === 'string' ? payParams : (payParams.url || payParams.mwebUrl || '')
        await h5WapPay(payUrl)
        // 不会执行到这里（页面跳转）
        return { pending: true }
      }
    } else if (isH5() && payValue === 'alipay') {
      const payUrl = typeof payParams === 'string' ? payParams : (payParams.url || '')
      if (resultData.displayMode === 'form' && typeof displayContent === 'string' && displayContent.includes('<form')) {
        // #ifdef H5
        const div = document.createElement('div')
        div.innerHTML = displayContent
        document.body.appendChild(div)
        const form = div.querySelector('form')
        if (form) {
          form.submit()
          return { pending: true }
        }
        // #endif
      }
      await h5WapPay(payUrl)
      return { pending: true }
    }
```

- [ ] **Step 4: 验证 App/小程序支付逻辑未被修改**

确认：
- `isMPWeixin() && payValue === 'wechat'` 分支不变
- `isApp() && payValue === 'wechat'` 分支不变
- `isApp() && payValue === 'alipay'` 分支不变
- wallet 支付分支不变

---

### Task 5: 支付成功页增强（支持回跳查单）

**Files:**
- Modify: `subpkg/booking/pay-success.vue`

**Interfaces:**
- Consumes: `getPayOrder` from `api/billiard/pay`
- Modifies: `pay-success.vue` onLoad — 支持 payOrderId 参数 + 轮询确认

- [ ] **Step 1: 修改 import，增加支付单查询 API**

在 script setup 的 import 部分增加：

```javascript
import { getPayOrder } from '@/api/billiard/pay'
```

- [ ] **Step 2: 增加支付状态相关状态变量**

在 `orderId` 和 `orderDetail` 声明后增加：

```javascript
const payOrderId = ref(null)
const payStatus = ref(null) // 0=待支付 10=成功 20=已退款 30=关闭
const isPolling = ref(false)
const statusText = ref('')
```

- [ ] **Step 3: 增加轮询查单函数**

在 `loadOrderDetail` 函数之前增加：

```javascript
// 查询支付单状态
const checkPayStatus = async () => {
  if (!payOrderId.value) return false
  try {
    const res = await getPayOrder({ id: payOrderId.value, sync: true })
    const data = res.data || {}
    payStatus.value = data.status
    return Number(data.status) === 10 // 10=支付成功
  } catch (error) {
    console.error('查询支付状态失败:', error)
    return false
  }
}

// 轮询支付状态
const pollPayStatus = () => {
  let attempts = 0
  const maxAttempts = 10
  const interval = 2000

  isPolling.value = true
  statusText.value = '支付结果确认中...'

  const poll = async () => {
    attempts++
    const success = await checkPayStatus()

    if (success) {
      isPolling.value = false
      statusText.value = '支付成功'
      payStatus.value = 10
      // 支付成功后加载订单详情
      if (orderId.value) {
        loadOrderDetail()
      }
      return
    }

    if (attempts >= maxAttempts) {
      isPolling.value = false
      statusText.value = '支付结果确认中，请稍后在订单列表查看'
      return
    }

    setTimeout(poll, interval)
  }

  poll()
}
```

- [ ] **Step 4: 修改 onLoad，支持 payOrderId 参数**

重写 onLoad：

```javascript
onLoad((options) => {
  // 审核模式入口守卫
  if (guardReviewEntry()) return

  // 优先使用 orderId（原逻辑）
  if (options.orderId) {
    orderId.value = Number(options.orderId)
    payStatus.value = 10 // 从订单进入默认成功
  }
  // H5 支付回跳：使用 payOrderId 查询支付状态
  else if (options.payOrderId) {
    payOrderId.value = Number(options.payOrderId)
    // 立即查一次
    checkPayStatus().then((success) => {
      if (success) {
        payStatus.value = 10
        // 支付成功，尝试获取关联的订单信息
        // 从 merchantOrderId 中提取 orderId（格式：ORDER_{id}）
        getPayOrder({ id: payOrderId.value }).then((res) => {
          const data = res.data || {}
          const merchantOrderId = data.merchantOrderId || ''
          const match = merchantOrderId.match(/ORDER_(\d+)/)
          if (match && match[1]) {
            orderId.value = Number(match[1])
            loadOrderDetail()
          }
        })
      } else {
        // 未成功，启动轮询
        pollPayStatus()
      }
    })
  } else {
    uni.showToast({ title: '订单信息缺失', icon: 'none' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/home/index' })
    }, 1500)
  }
})
```

- [ ] **Step 5: 在模板中增加支付状态展示**

在模板的成功图标和标题部分，增加 v-if 分支处理不同状态：

找到模板中的 `<!-- 成功图标 -->` 部分，修改为：

```html
      <!-- 状态图标 -->
      <view class="icon-wrapper">
        <uni-icons
          v-if="payStatus === 10 || !payOrderId"
          type="checkmarkempty"
          size="120"
          color="#00BB88"
        />
        <uni-icons
          v-else-if="isPolling"
          type="spinner-cycle"
          size="120"
          color="#00BB88"
        />
        <uni-icons
          v-else
          type="info"
          size="120"
          color="#FBBF24"
        />
      </view>

      <!-- 标题 -->
      <view class="title">
        {{ payStatus === 10 || !payOrderId ? '支付成功' : (isPolling ? '支付确认中' : '支付处理中') }}
      </view>
      <view class="subtitle">
        {{ payStatus === 10 || !payOrderId ? '您的预约已提交，等待裁教确认' : statusText }}
      </view>
```

- [ ] **Step 6: 验证小程序/App 端不受影响**

支付成功页在小程序和 App 端通过 `orderId` 参数进入，原有逻辑完全保留。`payOrderId` 是新增参数，只有 H5 支付回跳时才会携带。

---

### Task 6: 高德 H5 SDK 配置 + 定位参数优化

**Files:**
- Modify: `manifest.json`
- Modify: `utils/location.js`

**Interfaces:**
- Produces: H5 高德定位 SDK 配置
- Modifies: `fetchCoordinates()` — H5 下增加高精度 + 超时 + 重试

- [ ] **Step 1: 在 manifest.json 的 h5 配置中增加 sdkConfigs**

找到 `manifest.json` 中的 `h5` 配置段（约第 360-371 行），增加 `sdkConfigs`：

```json
"h5" : {
    "template" : "static/index.html",
    "devServer" : {
        "port" : 9090,
        "https" : false
    },
    "title" : "球了么",
    "router" : {
        "mode" : "hash",
        "base" : "./"
    },
    "sdkConfigs" : {
        "geolocation" : {
            "type" : "amap",
            "key" : "f66420f63919c84eda1b14e1cf8db73e"
        },
        "maps" : {
            "type" : "amap",
            "key" : "f66420f63919c84eda1b14e1cf8db73e"
        }
    }
}
```

注意：geolocation 配置用于 uni.getLocation 使用高德定位，maps 配置用于 uni.openLocation 使用高德地图。

- [ ] **Step 2: 优化 H5 定位参数 + 增加重试机制**

在 `utils/location.js` 的 `doLocate` 函数中，为 H5 端增加参数优化和重试：

将 `doLocate` 函数修改为：

```javascript
    const doLocate = (retryCount = 0) => {
      const locationOptions = {
        type,
        altitude: false,
        success: (res) => {
          finish({
            longitude: res.longitude,
            latitude: res.latitude
          })
        },
        fail: (err) => {
          // #ifdef H5
          // H5 端：失败后重试一次（降级高精度模式）
          if (retryCount < 1 && !err.errMsg?.includes('auth deny') && !err.errMsg?.includes('denied')) {
            console.log('[定位] H5 首次失败，重试一次:', err?.errMsg)
            setTimeout(() => doLocate(retryCount + 1), 500)
            return
          }
          // #endif

          if (err && err.errMsg && (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize') || err.errMsg.includes('denied'))) {
            fail(new Error('permission_denied'))
          } else {
            fail(err)
          }
        }
      }

      // #ifdef H5
      // H5 端增加高精度和超时参数
      locationOptions.isHighAccuracy = true
      locationOptions.timeout = 10000
      locationOptions.maximumAge = 0
      // #endif

      uni.getLocation(locationOptions)
    }
```

- [ ] **Step 3: 优化 H5 权限被拒的提示**

在 `showPermissionModal` 函数的 H5 分支中，增加更详细的错误提示：

```javascript
  // #ifdef H5
  // 区分是 HTTP 环境还是真的权限问题
  try {
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      uni.showModal({
        title: '无法获取定位',
        content: '当前为 HTTP 环境，浏览器禁止获取位置信息。请使用 HTTPS 访问后再试。',
        showCancel: false,
        confirmText: '知道了'
      })
    } else {
      uni.showToast({ title: '定位失败，请检查浏览器定位权限', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '定位失败，请检查浏览器定位权限', icon: 'none' })
  }
  // #endif
```

替换原来的简单 toast。

- [ ] **Step 4: 验证 App/小程序定位逻辑不变**

确认：
- APP-PLUS 下的原生权限请求逻辑不变
- MP-WEIXIN 下的权限引导逻辑不变
- 定位超时时间（15秒）在非 H5 平台不变
- `type: 'gcj02'` 参数三个平台都适用（已有）

---

### Task 7: 登录 platform 标识修复

**Files:**
- Modify: `api/auth.js`

**Interfaces:**
- Modifies: `smsLogin()` — H5 下 platform = 'h5'
- Modifies: `passwordLogin()` — H5 下 platform = 'h5'

- [ ] **Step 1: 修改 smsLogin 的 platform 判断**

将 `smsLogin` 函数中的 platform 赋值部分修改为：

```javascript
  let platform = 'miniapp'
  // #ifdef APP-PLUS
  platform = 'app'
  // #endif
  // #ifdef H5
  platform = 'h5'
  // #endif
```

- [ ] **Step 2: 修改 passwordLogin 的 platform 判断**

同样修改 `passwordLogin` 函数：

```javascript
  let platform = 'miniapp'
  // #ifdef APP-PLUS
  platform = 'app'
  // #endif
  // #ifdef H5
  platform = 'h5'
  // #endif
```

- [ ] **Step 3: 验证各平台 platform 值**

确认：
- APP-PLUS → 'app'（不变）
- MP-WEIXIN → 'miniapp'（不变，默认值）
- H5 → 'h5'（新增，之前是 'miniapp'）

---

### Task 8: 状态栏高度 H5 适配

**Files:**
- Modify: `App.vue`

**Interfaces:**
- Produces: `setStatusBarHeightH5()` — H5 端设置状态栏高度 CSS 变量
- Modifies: `initApp()` — H5 端调用状态栏设置

- [ ] **Step 1: 在 App.vue 中增加 H5 状态栏设置函数**

在 `setStatusBarHeight` 函数之后（约第 204 行之后）添加：

```javascript
function setStatusBarHeightH5() {
  // #ifdef H5
  try {
    const systemInfo = uni.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    uni.$statusBarHeight = statusBarHeight

    if (statusBarHeight > 0 && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--status-bar-height', statusBarHeight + 'px')
    } else {
      // 兜底：使用 safe-area-inset-top
      document.documentElement.style.setProperty('--status-bar-height', 'env(safe-area-inset-top)')
    }
  } catch (e) {
    console.warn('[App] H5 状态栏高度设置失败:', e)
  }
  // #endif
}
```

- [ ] **Step 2: 在 initApp 中调用 H5 状态栏设置**

在 `initApp` 函数中，`// #endif`（APP-PLUS 块结束，约第 177 行）之后、`continueAppInit()` 之前添加：

```javascript
  // #ifdef H5
  setStatusBarHeightH5()
  // #endif
```

放置在 `applyThemeToPage` 调用之后，`continueAppInit` 之前。

- [ ] **Step 3: 验证 App 端逻辑不变**

确认：
- APP-PLUS 下的 `setStatusBarHeight()` 调用不变
- `shouldShowIosPrivacy()` 判断逻辑不变
- 小程序端不执行任何新代码

---

### Task 9: H5 相册扫码实现

**Files:**
- Modify: `pages/scan/index.vue`

**Interfaces:**
- Consumes: `jsqr` (已安装)
- Modifies: `decodeImage()` — H5 端使用 jsQR 解码

- [ ] **Step 1: 替换 H5 decodeImage 实现**

找到 `decodeImage` 函数中的 `// #ifdef H5` 块（第 162-170 行），替换为：

```javascript
    // #ifdef H5
    // H5 平台：使用 jsQR 解码
    loading.value = true
    console.log('[相册扫码-H5] 路径:', filePath)

    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0, img.width, img.height)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          // 动态 import jsQR，避免非 H5 打包
          import('jsqr').then(({ default: jsQR }) => {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            })

            loading.value = false
            if (code && code.data) {
              console.log('[相册扫码-H5] 解码成功:', code.data)
              processQrResult(code.data)
            } else {
              uni.showToast({ title: '未识别到二维码，请选择清晰的二维码图片', icon: 'none' })
            }
          }).catch((err) => {
            loading.value = false
            console.error('[相册扫码-H5] jsQR 加载失败:', err)
            uni.showToast({ title: '解码库加载失败', icon: 'none' })
          })
        } catch (err) {
          loading.value = false
          console.error('[相册扫码-H5] 解码异常:', err)
          uni.showToast({ title: '未识别到二维码，请选择清晰的二维码图片', icon: 'none' })
        }
      }
      img.onerror = () => {
        loading.value = false
        uni.showToast({ title: '图片加载失败', icon: 'none' })
      }
      img.src = filePath
    } catch (err) {
      loading.value = false
      console.error('[相册扫码-H5] 异常:', err)
      uni.showToast({ title: '未识别到二维码，请选择清晰的二维码图片', icon: 'none' })
    }
    // #endif
```

- [ ] **Step 2: 验证 App/小程序相册扫码逻辑不变**

确认：
- APP-PLUS 下的 `plus.barcode.scan` 逻辑不变
- MP-WEIXIN 下的 `uni.scanCode` 相册逻辑不变
- `handleAlbumScan` 中非 MP-WEIXIN 分支（含 H5）的 `uni.chooseImage` 调用不变

---

### Task 10: H5 相机扫码优化

**Files:**
- Modify: `pages/scan/index.vue`

**Interfaces:**
- Modifies: `handleScan()` — H5 端优化扫码体验

- [ ] **Step 1: 为 H5 相机扫码增加降级提示**

`uni.scanCode` 在 H5 端是 uni-app 内置实现，依赖浏览器能力。增加 H5 端的失败降级引导：

在 `handleScan` 函数的 fail 回调中，增加 H5 专属处理。找到 fail 处理块，修改为：

```javascript
      fail: (err) => {
        console.error('扫码失败:', err)
        if (err.errMsg && err.errMsg.includes('cancel')) {
          // 用户取消
        } else if (err.errMsg && (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize') || err.errMsg.includes('denied') || err.errMsg.includes('fail'))) {
          // 权限拒绝，显示引导弹窗
          showCameraPermissionModal()
          // #ifdef H5
          // H5 端额外提示：可以使用相册扫码作为替代
          setTimeout(() => {
            uni.showToast({ title: '相机不可用，可尝试从相册选择二维码', icon: 'none', duration: 2500 })
          }, 500)
          // #endif
        } else {
          uni.showToast({
            title: '扫码失败，请重试',
            icon: 'none',
            duration: 1500
          })
        }
      }
```

- [ ] **Step 2: H5 扫码页 100vh 修复**

将 `.scan-wrapper` 的 `height: 100vh` 改为：

```css
.scan-wrapper {
  height: calc(var(--vh, 1vh) * 100);
  background-color: var(--bg-page);
}
```

配合 Task 14 的 `--vh` 全局变量。（如果 Task 14 尚未执行，先保留 100vh，待 Task 14 统一修复）

- [ ] **Step 3: 验证 App/小程序扫码逻辑不变**

确认 `uni.scanCode` 调用参数 `onlyFromCamera: true` 在三个平台都生效，H5 端只是在失败时增加了额外提示。

---

### Task 11: 深度链接解析（H5 URL 路由）

**Files:**
- Modify: `App.vue`

**Interfaces:**
- Produces: `handleDeepLink()` — H5 端解析 URL hash 并跳转
- Modifies: `onLaunch` — H5 端调用深度链接解析

- [ ] **Step 1: 在 App.vue 中增加深度链接处理函数**

在 `handleLaunchOptions` 函数之后添加：

```javascript
// H5 深度链接白名单（不需要登录的页面）
const DEEPLINK_PUBLIC_PAGES = [
  '/pages/home/index',
  '/subpkg/coach/detail',
  '/pages/coach/list',
  '/subpkg/booking/pay-success',
]

// H5 深度链接需要登录的页面
const DEEPLINK_PRIVATE_PAGES = [
  '/subpkg/order/detail',
  '/pages/order/list',
  '/pages/mine/index',
]

function handleDeepLink() {
  // #ifdef H5
  try {
    const hash = window.location.hash || ''
    // hash 格式: #/path?query=value
    if (!hash || hash === '#' || hash === '#/') {
      return
    }

    // 解析路径和查询参数
    const hashPath = hash.replace(/^#/, '')
    const [path, queryStr] = hashPath.split('?')

    // 检查是否是有效页面路径
    const isPublicPage = DEEPLINK_PUBLIC_PAGES.some(p => path.startsWith(p))
    const isPrivatePage = DEEPLINK_PRIVATE_PAGES.some(p => path.startsWith(p))

    if (!isPublicPage && !isPrivatePage) {
      return // 不是深度链接白名单页面，走正常流程
    }

    const token = getAccessToken()
    const hasValidToken = token && getExpiresTime() && new Date() < getExpiresTime()

    if (isPrivatePage && !hasValidToken) {
      // 需要登录但未登录，保存目标路径，跳登录页
      uni.setStorageSync('deep_link_target', hashPath)
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/login/index' })
      }, 100)
      return
    }

    // 已登录或公开页面，直接跳转
    // 延迟执行，确保 App 初始化完成
    setTimeout(() => {
      uni.reLaunch({ url: hashPath })
    }, 300)
  } catch (e) {
    console.warn('[App] 深度链接解析失败:', e)
  }
  // #endif
}
```

- [ ] **Step 2: 在 onLaunch 中调用深度链接解析**

在 `onLaunch` 函数中，`handleLaunchOptions(options)` 调用之后添加：

```javascript
  // #ifdef H5
  handleDeepLink()
  // #endif
```

确保在 `checkLogin` 之后或 `initApp` 之后调用。放在 `handleLaunchOptions(options)` 同级别即可。

- [ ] **Step 3: 验证非 H5 平台不执行深度链接**

整个 `handleDeepLink` 函数体和调用处都用 `// #ifdef H5` 包裹，App/小程序不会执行。

---

### Task 12: 登录后跳转深链目标

**Files:**
- Modify: `store/modules/user.js`

**Interfaces:**
- Consumes: deep link target from storage
- Modifies: login success action — 登录成功后检查并跳转到深链目标

- [ ] **Step 1: 在 user store 中增加深链跳转逻辑**

找到 `smsLogin` 或 `setLoginInfo` 相关的 action，在登录成功后增加深链跳转。

先读取 user.js 中登录相关的完整代码，找到 `smsLogin` action：

在 `setLoginInfo` 函数之后，添加一个辅助函数：

```javascript
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
```

在登录成功的 action 中（如 `smsLogin`），调用 `setLoginInfo` 之后，增加：

```javascript
    // H5 深链跳转
    redirectAfterLogin()
```

注意：需要先确认 user store 中 `smsLogin` action 的具体实现位置和格式。实际修改时在登录成功的位置插入 `redirectAfterLogin()` 调用即可。

- [ ] **Step 2: 验证 App/小程序登录逻辑不变**

`redirectAfterLogin` 函数体用 `// #ifdef H5` 包裹，非 H5 平台直接返回 `false`，不影响登录流程。

---

### Task 13: 100vh 全局修复（--vh CSS 变量）

**Files:**
- Modify: `App.vue`

**Interfaces:**
- Produces: `--vh` CSS 变量 — 动态计算的可视区高度
- Produces: `setVh()` 函数 — H5 端设置视口高度变量

- [ ] **Step 1: 在 App.vue 中增加 setVh 函数**

在 `setStatusBarHeightH5` 函数之后添加：

```javascript
function setVh() {
  // #ifdef H5
  try {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  } catch (e) {
    console.warn('[App] setVh 失败:', e)
  }
  // #endif
}
```

- [ ] **Step 2: 在 initApp 中调用并监听 resize**

在 `initApp` 函数的 H5 状态栏设置之后添加：

```javascript
  // #ifdef H5
  setStatusBarHeightH5()
  setVh()
  window.addEventListener('resize', setVh)
  // 移动端地址栏收起/展开时也会触发 resize，自动更新 --vh
  // #endif
```

- [ ] **Step 3: 修改全局 page 样式的 min-height**

在 App.vue 的 style 中，将 `page { min-height: 100vh }` 修改为：

```css
page {
  min-height: calc(var(--vh, 1vh) * 100);
  background: var(--bg-page);
  transition: background-color 0.3s ease;
}
```

- [ ] **Step 4: 验证非 H5 平台不受影响**

`setVh` 函数和 `window.addEventListener` 都在 H5 条件编译内。`--vh` CSS 变量在非 H5 平台上未定义，`calc(var(--vh, 1vh) * 100)` 会 fallback 到 `1vh * 100 = 100vh`，与原有行为一致。

---

### Task 14: 关键页面 100vh 替换

**Files:**
- Modify: `pages/scan/index.vue`
- Modify: `pages/home/index.vue`
- Modify: `subpkg/booking/hall.vue`

**Interfaces:**
- Consumes: `--vh` CSS 变量 from Task 13

- [ ] **Step 1: pages/scan/index.vue**

将 `.scan-wrapper { height: 100vh; }` 替换为：
```css
.scan-wrapper {
  height: calc(var(--vh, 1vh) * 100);
  background-color: var(--bg-page);
}
```

- [ ] **Step 2: pages/home/index.vue**

找到首页中使用 100vh 的地方（scroll-view 高度等），替换为 `calc(var(--vh, 1vh) * 100)`。

注意：首页有自定义 tabBar，scroll-view 高度需要减去 tabBar 高度（约 50px/100rpx）。如果已有减去 tabBar 的计算，保持相同的计算方式，只把 `100vh` 替换掉。

例如：
```css
/* 从 */
height: calc(100vh - 100rpx);
/* 改为 */
height: calc(var(--vh, 1vh) * 100 - 100rpx);
```

- [ ] **Step 3: subpkg/booking/hall.vue**

同样将 `min-height: 100vh; height: 100vh` 替换：
```css
min-height: calc(var(--vh, 1vh) * 100);
height: calc(var(--vh, 1vh) * 100);
```

- [ ] **Step 4: 其他使用 100vh 的页面批量替换**

搜索项目中 `100vh` 的使用（排除 uni_modules），将所有页面级别的 `height: 100vh` 和 `min-height: 100vh` 替换为 CSS 变量形式。

替换规则：
- `height: 100vh` → `height: calc(var(--vh, 1vh) * 100)`
- `min-height: 100vh` → `min-height: calc(var(--vh, 1vh) * 100)`
- `calc(100vh - xxx)` → `calc(var(--vh, 1vh) * 100 - xxx)`

注意：只替换页面/组件样式中的 `100vh`，不要替换 `line-height: 100vh` 或其他不相关的属性。

---

### Task 15: TabBar 主题同步验证 + 优化

**Files:**
- Review: `utils/theme.js`
- Modify: `App.vue` (if needed)

**Interfaces:**
- Consumes: `updateTabBarStyle()` from `utils/theme.js`

**说明：** `utils/theme.js` 中已有 `updateTabBarStyle` 函数，且 `applyThemeToPage` 中已调用。需要验证在 H5 端是否生效。

- [ ] **Step 1: 验证 TabBar 主题切换在 H5 端是否正常**

检查 `applyThemeToPage` 函数中 `updateTabBarStyle(theme)` 的调用。`uni.setTabBarStyle` 是 uni-app 通用 API，在 H5 端应该生效。

如果 H5 端 tabBar 样式不随主题切换，需要确保在 `onShow` 时也调用（已在 App.vue 的 onShow 中调用了 `applyThemeToPage`）。

- [ ] **Step 2: 确认 pages.json 中的初始 tabBar 配置**

检查 pages.json 中的 tabBar 配置，确保背景色和深色主题一致（`#1E252B`）。

- [ ] **Step 3: H5 TabBar 安全区适配**

H5 端原生 tabBar 可能没有底部安全区 padding。如果发现 iOS Safari 中 tabBar 与 Home Indicator 重叠，可以通过 CSS 补充。但由于 uni-app H5 的 tabBar 是渲染在 shadow DOM 中的，直接 CSS 可能无效。

替代方案：通过 `uni.setTabBarStyle` 动态调整。但这个 API 不支持 padding。

结论：如果 tabBar 安全区有问题，后续考虑自定义 tabBar。本次先验证现有表现，如果正常则不改动。

---

### Task 16: 全局过渡性能优化

**Files:**
- Modify: `App.vue`

**Interfaces:**
- Modifies: 全局 `* { transition: ... }` — 缩小范围或优化

**说明：** 当前 H5 端给所有元素（`*`）加了 transition，性能开销大。优化方案：只在主题切换时临时加过渡类。

- [ ] **Step 1: 修改 H5 全局过渡样式**

将 App.vue style 中的：

```css
/* #ifdef H5 */
* {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease,
              box-shadow 0.3s ease;
}
/* #endif */
```

替换为：

```css
/* #ifdef H5 */
.theme-transitioning *,
.theme-transitioning *::before,
.theme-transitioning *::after {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease,
              box-shadow 0.3s ease;
}
/* #endif */
```

- [ ] **Step 2: 在主题切换时临时添加过渡类**

在 `utils/theme.js` 的 `applyThemeToPage` 函数中，H5 分支增加过渡类管理：

```javascript
  // #ifdef H5
  try {
    // 添加过渡类
    document.documentElement.classList.add('theme-transitioning')

    if (theme === 'light') {
      document.documentElement.classList.remove('theme-dark')
      document.documentElement.classList.add('theme-light')
      document.body.classList.remove('theme-dark')
      document.body.classList.add('theme-light')
    } else {
      document.documentElement.classList.remove('theme-light')
      document.documentElement.classList.add('theme-dark')
      document.body.classList.remove('theme-light')
      document.body.classList.add('theme-dark')
    }

    // 过渡结束后移除过渡类
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
    }, 350)
  } catch (e) {
    console.warn('[Theme] H5 主题类名应用失败:', e)
  }
  // #endif
```

- [ ] **Step 3: 验证非 H5 平台不受影响**

过渡样式修改在 H5 条件编译内。`applyThemeToPage` 的 H5 分支修改不影响 MP-WEIXIN 和 APP-PLUS。

---

### Task 17: 下载 App 引导页

**Files:**
- Create: `subpkg/common/download.vue`
- Modify: `pages.json` — 增加路由（H5 条件编译）
- Modify: `subpkg/mine/index.vue` — 增加入口（H5 条件编译）

- [ ] **Step 1: 创建下载引导页**

创建 `subpkg/common/download.vue`：

```vue
<template>
  <view class="download-wrapper" :class="themeClass">
    <view class="download-content">
      <!-- Logo -->
      <view class="logo-box">
        <image src="/static/images/logo.png" class="logo" mode="aspectFit" />
      </view>

      <!-- 标题 -->
      <text class="title">球了么</text>
      <text class="subtitle">台球陪练预约平台</text>

      <!-- 微信内打开：提示右上角 -->
      <view v-if="isWechat" class="wechat-tip">
        <uni-icons type="info" size="20" color="#FBBF24" />
        <text class="tip-text">请点击右上角 ···，选择「在浏览器打开」</text>
      </view>

      <!-- 下载按钮 -->
      <view class="btn-group">
        <view v-if="isIOS" class="btn primary" @click="openAppStore">
          <uni-icons type="apple" size="24" color="#fff" />
          <text>App Store 下载</text>
        </view>
        <view v-else-if="isAndroid" class="btn primary" @click="downloadApk">
          <uni-icons type="download" size="24" color="#fff" />
          <text>下载 Android 版</text>
        </view>
        <view v-else class="btn primary" @click="downloadApk">
          <uni-icons type="download" size="24" color="#fff" />
          <text>下载 App</text>
        </view>
      </view>

      <!-- 返回首页 -->
      <view class="back-home" @click="goHome">
        <text>继续浏览网页版</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useThemeStore } from '@/store'
import { isWechatBrowser } from '@/utils/platform'

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

const isWechat = ref(false)
const isIOS = ref(false)
const isAndroid = ref(false)

// #ifdef H5
isWechat.value = isWechatBrowser()
const ua = navigator.userAgent.toLowerCase()
isIOS.value = /iphone|ipad|ipod/.test(ua)
isAndroid.value = /android/.test(ua)
// #endif

const openAppStore = () => {
  // TODO: 替换为实际的 App Store 链接
  uni.showToast({ title: 'App Store 链接待配置', icon: 'none' })
}

const downloadApk = () => {
  // TODO: 替换为实际的 APK 下载链接
  uni.showToast({ title: '下载链接待配置', icon: 'none' })
}

const goHome = () => {
  uni.switchTab({ url: '/pages/home/index' })
}
</script>

<style lang="scss" scoped>
.download-wrapper {
  min-height: calc(var(--vh, 1vh) * 100);
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  box-sizing: border-box;
}

.download-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-box {
  width: 180rpx;
  height: 180rpx;
  border-radius: 40rpx;
  overflow: hidden;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);

  .logo {
    width: 100%;
    height: 100%;
  }
}

.title {
  font-size: 44rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-bottom: 80rpx;
}

.wechat-tip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: rgba(251, 191, 36, 0.1);
  border: 1rpx solid rgba(251, 191, 36, 0.3);
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  margin-bottom: 60rpx;

  .tip-text {
    color: #FBBF24;
    font-size: 26rpx;
  }
}

.btn-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 40rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 96rpx;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;

  &.primary {
    background: linear-gradient(135deg, #00BB88 0%, #059669 100%);
    color: #fff;
  }
}

.back-home {
  padding: 20rpx 40rpx;

  text {
    color: var(--text-secondary);
    font-size: 28rpx;
    text-decoration: underline;
  }
}
</style>
```

注意：Logo 图片路径需确认项目中是否存在 `/static/images/logo.png`，如不存在则使用现有图标替代。

- [ ] **Step 2: 在 pages.json 中添加路由（H5 条件编译）**

在 pages.json 的 pages 数组中，用条件编译添加下载页路由：

```json
// #ifdef H5
{
  "path": "subpkg/common/download",
  "style": {
    "navigationBarTitleText": "下载App",
    "navigationBarBackgroundColor": "#121619",
    "navigationBarTextStyle": "white"
  }
}
// #endif
```

放置在 pages 数组的最后。

- [ ] **Step 3: 在我的页面添加入口**

在 `subpkg/mine/index.vue` 中，用 H5 条件编译添加「下载 App」菜单项。

找到我的页面的设置/工具区列表，在合适的位置添加：

```html
<!-- #ifdef H5 -->
<view class="setting-item" @click="goToDownload">
  <text class="setting-text">下载 App</text>
  <uni-icons type="download" size="18" color="#999" />
</view>
<!-- #endif -->
```

并在 script 中添加跳转方法：

```javascript
const goToDownload = () => {
  uni.navigateTo({ url: '/subpkg/common/download' })
}
```

- [ ] **Step 4: 验证 App/小程序中不显示下载入口**

下载页路由和入口都在 H5 条件编译内，App/小程序端不会出现。

---

### Task 18: PWA 配置

**Files:**
- Modify: `manifest.json`

**Interfaces:**
- Produces: PWA manifest 和 Service Worker 配置

- [ ] **Step 1: 在 manifest.json 的 h5 配置中增加 pwa**

在 `h5` 配置中增加 `pwa` 节点：

```json
"h5": {
    "template": "static/index.html",
    "devServer": {
        "port": 9090,
        "https": false
    },
    "title": "球了么",
    "router": {
        "mode": "hash",
        "base": "./"
    },
    "sdkConfigs": {
        "geolocation": {
            "type": "amap",
            "key": "f66420f63919c84eda1b14e1cf8db73e"
        },
        "maps": {
            "type": "amap",
            "key": "f66420f63919c84eda1b14e1cf8db73e"
        }
    },
    "pwa": {
        "enabled": true,
        "manifest": {
            "name": "球了么",
            "short_name": "球了么",
            "description": "台球陪练预约平台",
            "theme_color": "#00BB88",
            "background_color": "#121619",
            "display": "standalone",
            "orientation": "portrait"
        },
        "serviceworker": {
            "enabled": true
        }
    }
}
```

- [ ] **Step 2: 验证 PWA 配置只影响 H5**

PWA 配置在 `manifest.json` 的 `h5` 节点内，只影响 H5 构建，不影响 App 和小程序。

---

### Task 19: PWA 图标准备

**Files:**
- Create: `static/icons/pwa/` 目录 + 图标文件

**Interfaces:**
- Produces: PWA 应用图标（192x192, 512x512）

- [ ] **Step 1: 检查现有 logo 资源**

检查 `static/images/` 目录下是否有 logo.png 或 app 图标文件。

- [ ] **Step 2: 生成 PWA 图标**

使用现有 logo 生成 PWA 所需尺寸的图标：
- 192x192 像素（Android 主屏图标）
- 512x512 像素（Android 启动画面/大图标）
- 格式：PNG，透明背景

放置在 `static/icons/pwa/` 目录下：
- `static/icons/pwa/icon-192x192.png`
- `static/icons/pwa/icon-512x512.png`

如果暂时没有合适的 logo，可以先用项目现有图标临时替换，或跳过图标配置（uni-app 会使用默认图标）。

- [ ] **Step 3: 在 manifest.json 的 pwa.manifest 中配置图标路径**

如果图标已准备好，在 `pwa.manifest` 中增加：

```json
"icons": [
    {
        "src": "./static/icons/pwa/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
    },
    {
        "src": "./static/icons/pwa/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
    }
]
```

---

### Task 20: 全局验证 + 跨平台回归检查

**Files:**
- All modified files

**Interfaces:**
- 验证所有模块在三端的表现

- [ ] **Step 1: H5 构建验证**

运行 H5 开发构建，确认没有编译错误：
```bash
# 如果项目有 dev:h5 命令
npm run dev:h5
```

检查：
- 没有编译错误
- 没有条件编译语法错误
- H5 页面能正常打开

- [ ] **Step 2: App 端回归验证**

确认 App 端以下功能正常：
- 微信支付正常（`wx_app`）
- 支付宝支付正常（`alipay_app`）
- 原生扫码正常（`plus.barcode`）
- 状态栏高度正常（自定义导航栏）
- 定位功能正常
- 推送功能正常
- iOS 隐私弹窗正常

- [ ] **Step 3: 小程序端回归验证**

确认微信小程序端以下功能正常：
- 微信支付正常（`wx_pub` / `wx_lite`）
- `uni.scanCode` 扫码正常
- 定位功能正常
- 分享功能正常
- 小程序启动参数解析正常

- [ ] **Step 4: H5 端功能验证**

确认 H5 端以下功能正常：
- 微信浏览器内微信 JSAPI 支付
- 普通浏览器微信 WAP 支付
- 支付宝 WAP 支付
- 钱包支付
- 定位功能（高德 SDK）
- 相册扫码（jsQR）
- 相机扫码
- 状态栏高度
- 深度链接
- TabBar 主题切换
- 100vh 不跳动

---

## 实施顺序

按以下顺序执行（前面的任务是后面的依赖）：

1. Task 1: 环境检测工具函数（isWechatBrowser / isAlipayBrowser）
2. Task 2: 支付渠道配置改造
3. Task 3: H5 支付执行函数
4. Task 4: executePayment 增加 H5 分支
5. Task 5: 支付成功页增强
6. Task 6: 高德 SDK 配置 + 定位优化
7. Task 7: 登录 platform 修复
8. Task 8: 状态栏 H5 适配
9. Task 9: H5 相册扫码
10. Task 10: H5 相机扫码优化
11. Task 11: 深度链接解析
12. Task 12: 登录后深链跳转
13. Task 13: 100vh 全局修复
14. Task 14: 关键页面 100vh 替换
15. Task 15: TabBar 主题验证
16. Task 16: 全局过渡性能优化
17. Task 17: 下载 App 引导页
18. Task 18: PWA 配置
19. Task 19: PWA 图标
20. Task 20: 全局验证 + 回归检查