# 初球项目代码优化实施计划

> 基于全面代码审查的整改方案
> 优化包数量：19 个
> 总预估工时：约 49.5 小时
> 实施原则：不操作 git，不改坏现有功能，每个优化包独立验证

---

## 目录

- [一、安全加固（2 个）](#一安全加固2-个)
  - [S4 - rich-text XSS 内容过滤](#s4---rich-text-xss-内容过滤)
  - [S6 - 生产环境清除敏感日志](#s6---生产环境清除敏感日志)
- [二、支付 & 业务正确性（4 个）](#二支付--业务正确性4-个)
  - [P1 - 支付重复提交防护修复](#p1---支付重复提交防护修复)
  - [P2 - 钱包支付假实现清理](#p2---钱包支付假实现清理)
  - [P3 - 上传文件 JSON.parse 容错](#p3---上传文件-jsonparse-容错)
  - [P4 - 请求 URL 拼接逻辑修复](#p4---请求-url-拼接逻辑修复)
- [三、Vue & 状态管理（5 个）](#三vue--状态管理5-个)
  - [V1 - isShowingNotification 未定义 bug 修复](#v1---isshowingnotification-未定义-bug-修复)
  - [V2 - Pinia state 禁止直接修改](#v2---pinia-state-禁止直接修改)
  - [V3 - v-for key 替换为业务 ID](#v3---v-for-key-替换为业务-id)
  - [V4 - Store action 去 Promise 包装](#v4---store-action-去-promise-包装)
  - [V5 - 用 Pinia 替代 Storage 跨页传参](#v5---用-pinia-替代-storage-跨页传参)
- [四、代码质量 & 可维护性（4 个）](#四代码质量--可维护性4-个)
  - [Q1 - 定时器/事件监听器统一管理](#q1---定时器事件监听器统一管理)
  - [Q2 - 统一工具函数（时间/金额/距离格式化）](#q2---统一工具函数时间金额距离格式化)
  - [Q3 - 重复代码消除（权限弹窗 + openAppSetting）](#q3---重复代码消除权限弹窗--openappsetting)
  - [Q4 - 魔法数字提取为常量](#q4---魔法数字提取为常量)
- [五、性能优化（4 个）](#五性能优化4-个)
  - [Perf1 - 删除死代码 + 无用依赖](#perf1---删除死代码--无用依赖)
  - [Perf2 - 图片优化（压缩 + 懒加载）](#perf2---图片优化压缩--懒加载)
  - [Perf4 - 教练详情页重复请求修复](#perf4---教练详情页重复请求修复)
  - [Perf5 - "我的"页面订单加载优化](#perf5---我的页面订单加载优化)
- [六、大组件重构（3 个）](#六大组件重构3-个)
  - [R1 - confirm.vue 拆分](#r1---confirmvue-拆分)
  - [R2 - order/detail.vue 拆分](#r2---orderdetailvue-拆分)
  - [R3 - payment.js 拆分](#r3---paymentjs-拆分)
- [实施总览](#实施总览)

---

# 一、安全加固（2 个）

---

## S4 - rich-text XSS 内容过滤

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **风险等级** | 低（纯新增工具，侵入性小） |

### 问题
通知详情页使用 `<rich-text :nodes="detail.content">` 直接渲染后端返回的 HTML 内容，未进行任何过滤。后端被攻破时存在存储型 XSS 风险。

### 设计方案

#### 1. 新增 `utils/html-sanitizer.js`

实现一个轻量的 HTML 白名单过滤器，不引入第三方依赖。

**白名单标签：**
```
p, span, br, img, a, ul, ol, li, strong, em, b, i,
h1, h2, h3, h4, h5, h6, blockquote, code, pre, hr, table, tr, td, th
```

**白名单属性：**
- `img`: `src`, `alt`, `width`, `height`, `style`
- `a`: `href`(必须 http/https), `target`, `title`
- 通用: `style`(仅允许 color, font-size, text-align 等安全属性)
- 其他标签不允许属性（或仅允许 `style`）

**过滤策略：**
1. 解析 HTML 字符串（用正则方式，小程序端没有 DOM API）
2. 遍历所有标签，不在白名单中的标签移除（保留内容）
3. 遍历所有属性，不在白名单中的属性移除
4. `a` 标签的 `href` 必须是 http/https 协议
5. `img` 标签的 `src` 必须是 http/https 或 data:image 协议
6. `style` 属性值中禁止 expression、javascript、url() 等危险内容

#### 2. 使用位置改造

改造 `subpkg/mine/notification/detail.vue`：
```javascript
import { sanitizeHtml } from '@/utils/html-sanitizer'

// 获取详情后过滤
const loadDetail = async () => {
  const res = await getNotificationDetail(id)
  if (isRichText.value) {
    detail.content = sanitizeHtml(detail.content)
  }
}
```

#### 3. 全局检查

搜索项目中所有 `rich-text` 和 `v-html` 的使用点，统一加上过滤。

### 影响文件
- 新增 `utils/html-sanitizer.js`
- 修改 `subpkg/mine/notification/detail.vue`
- （可选）其他使用 rich-text 的页面

### 验证方式
1. 构造包含 `<script>alert(1)</script>` 的内容，验证被过滤
2. 构造包含 `<img src=x onerror=alert(1)>` 的内容，验证 onerror 属性被移除
3. 正常富文本内容（段落、图片、链接）验证正常显示

---

## S6 - 生产环境清除敏感日志

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 1h |
| **风险等级** | 中（修改面广，但都是删除/替换日志） |

### 问题
项目中约 333 处 console.log/warn/error，包含敏感信息（token、用户信息、支付参数等）打印到控制台。

### 设计方案

#### 1. 新增 `utils/logger.js`

统一的日志工具，支持级别控制：

```javascript
const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
}

// 根据环境设置日志级别
// #ifdef DEVELOPMENT
const currentLevel = LOG_LEVEL.DEBUG
// #else
const currentLevel = LOG_LEVEL.ERROR  // 生产环境只输出 error
// #endif

export const logger = {
  debug: (...args) => currentLevel <= LOG_LEVEL.DEBUG && console.log(...args),
  info: (...args) => currentLevel <= LOG_LEVEL.INFO && console.log(...args),
  warn: (...args) => currentLevel <= LOG_LEVEL.WARN && console.warn(...args),
  error: (...args) => currentLevel <= LOG_LEVEL.ERROR && console.error(...args),
}
```

#### 2. 敏感日志删除策略

**必须删除的（绝对不能打印）：**
- token / accessToken / refreshToken 及其状态
- 密码 / 验证码
- 支付参数 / 签名
- 手机号（完整手机号）
- 身份证等证件信息

**可以保留但用 logger 替换的：**
- 普通 API 响应（不含敏感字段）
- 页面生命周期日志
- 调试信息

#### 3. 实施步骤
1. 新增 `utils/logger.js`
2. 全局搜索包含 `token`、`password`、`smsCode`、`payParam`、`mobile` 等关键词的 console.log，直接删除
3. 其他调试日志逐步替换为 `logger.debug` 或 `logger.info`
4. `App.vue`、`payment.js`、`websocket.js` 等重灾区优先处理

### 影响文件
- 新增 `utils/logger.js`
- 修改所有含 console 的文件（重点：App.vue、payment.js、websocket.js、login 页、首页等）

### 验证方式
1. 开发环境验证：日志正常输出
2. 搜索验证：确认没有打印敏感关键词的 console.log
3. 生产构建验证：确认生产环境 debug/info 级别不输出

---

# 二、支付 & 业务正确性（4 个）

---

## P1 - 支付重复提交防护修复

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 1h |
| **风险等级** | 中（核心支付逻辑，需谨慎） |

### 问题
`utils/payment.js:421` 防重复提交时间只有 2 秒（注释说是 5 分钟），用户拉起支付后 2 秒再点即可绕过。

### 设计方案

#### 当前逻辑问题
```javascript
// 注释：5分钟内阻止重复提交
// 实际：只有 2 秒
if (currentState && currentState.status === PAY_REQUEST_STATUS.PENDING && (now - currentState.timestamp < 2 * 1000)) {
  throw new Error('支付请求处理中，请稍后再试')
}
```

#### 修复方案
改为**支付全流程 pending**策略：

1. 调用 `submitPayOrder` 成功后设为 PENDING，记录时间戳和订单号
2. 调用支付 SDK（微信/支付宝）期间保持 PENDING
3. 支付结果返回（成功/失败/取消）后，立即清除 PENDING 状态
4. 设置最大超时兜底（5 分钟），防止异常情况导致永久 pending

**状态流转：**
```
IDLE → submitPayOrder → PENDING → 支付SDK调用 → 结果返回 → IDLE
                         ↑                                 ↓
                         └──── 5分钟超时自动清除 ←───────────┘
```

#### 关键代码结构
```javascript
function setPayPending(payOrderId) {
  payRequestState.value = {
    status: PAY_REQUEST_STATUS.PENDING,
    payOrderId,
    timestamp: Date.now(),
  }
}

function clearPayPending() {
  payRequestState.value = null
}

// 在 executePayment 中
async function executePayment(options) {
  // 防重复提交检查
  checkAndSetPending(payOrderId, channelCode)
  
  try {
    // 1. 提交支付订单
    const payResult = await submitPayOrder(...)
    
    // 2. 调用支付 SDK
    await invokePaymentSDK(payValue, payParams)
    
    // 3. 确认支付（如果需要）
    // ...
    
    return result
  } finally {
    // 无论成功失败都清除 pending
    clearPayPending()
  }
}
```

### 影响文件
- 修改 `utils/payment.js`

### 验证方式
1. 快速连续点击支付按钮，验证第二次被拦截
2. 拉起微信/支付宝支付后，返回 APP 再点击支付，验证 pending 状态已清除（可以再次支付）
3. 模拟支付 SDK 异常（如 reject），验证 pending 状态被清除

---

## P2 - 钱包支付假实现清理

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 0.5h |
| **风险等级** | 低（纯删除，确认无引用即可） |

### 问题
`utils/payment.js:323-330` 的 `walletPay` 函数是假实现，直接 resolve 成功。实际钱包支付走后端确认逻辑，不经过此函数。保留可能导致未来误用。

### 设计方案
1. 全局搜索 `walletPay`，确认没有被调用
2. 删除 `walletPay` 函数
3. 在文件顶部或相关位置添加注释，说明钱包支付的真实流程：
   ```
   钱包支付流程说明：
   钱包支付不需要前端调用第三方SDK
   1. 调用 submitPayOrder 提交支付订单（渠道为 wallet）
   2. 后端直接从用户钱包扣款
   3. 前端轮询或调用 confirmPayOrderPaid 确认支付状态
   ```

### 影响文件
- 修改 `utils/payment.js`

### 验证方式
1. 全局搜索确认 `walletPay` 无引用
2. 测试钱包支付流程正常（创建订单 → 扣款 → 支付成功）

---

## P3 - 上传文件 JSON.parse 容错

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 0.5h |
| **风险等级** | 低（增加 try-catch，不改变正常流程） |

### 问题
`utils/upload.js:45` 直接 `JSON.parse(res.data)`，无 try-catch。上传接口返回非 JSON 时会导致页面崩溃。

### 设计方案

在 `success` 回调中增加 try-catch：

```javascript
success: (res) => {
  let result
  try {
    result = JSON.parse(res.data)
  } catch (e) {
    const msg = '上传响应解析失败'
    toast(msg)
    reject(msg)
    return
  }
  // 原有逻辑继续...
  const code = result.code || 0
  // ...
}
```

参照 `request.js` 的错误处理模式，保持一致性。

### 影响文件
- 修改 `utils/upload.js`

### 验证方式
1. 正常上传流程验证不受影响
2. （模拟）后端返回非 JSON 响应时，页面不崩溃，显示友好错误提示

---

## P4 - 请求 URL 拼接逻辑修复

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 0.5h |
| **风险等级** | 低（当前没有调用方传 baseUrl，不影响现有逻辑） |

### 问题
`utils/request.js:141`：
```javascript
url: config.baseUrl || baseUrl + config.url,
```
由于 `||` 优先级高于 `+`，`config.baseUrl` 存在时直接作为完整 URL 使用，忽略 `config.url`。

用户确认：设计意图就是**传了 `config.baseUrl` 就直接用，不再拼接**。

### 设计方案
添加括号明确表达意图，增加可读性：

```javascript
url: config.baseUrl || (baseUrl + config.url),
```

即：
- 如果调用方传了 `config.baseUrl` → 直接使用（作为完整 URL）
- 如果没传 → 使用默认 baseUrl + config.url 拼接

同时检查 `utils/upload.js:39` 的 URL 拼接逻辑是否一致：
```javascript
url: baseUrl + config.url,  // upload.js 中
```
upload.js 目前不支持自定义 baseUrl，如果需要保持一致也可以加上，但当前没有调用方需要，保持现状即可。

### 影响文件
- 修改 `utils/request.js`

### 验证方式
1. 现有所有 API 调用正常（不传 baseUrl 的走默认逻辑，不受影响）
2. 代码可读性提升，意图明确

---

# 三、Vue & 状态管理（5 个）

---

## V1 - isShowingNotification 未定义 bug 修复

| 属性 | 值 |
|------|-----|
| **严重度** | 🔴 CRITICAL |
| **预估工时** | 0.5h |
| **风险等级** | 极低（一行代码修复） |

### 问题
`pages/home/index.vue:606` 使用了 `isShowingNotification.value`，但该变量从未定义。实际控制弹窗的 ref 是 `showNotifyModal`。

### 设计方案
将第 606 行的 `isShowingNotification.value` 改为 `showNotifyModal.value`：

```javascript
// 修改前
if (notificationQueue.value.length > 0 && !isShowingNotification.value) {

// 修改后
if (notificationQueue.value.length > 0 && !showNotifyModal.value) {
```

### 影响文件
- 修改 `pages/home/index.vue`

### 验证方式
1. 首页加载后有通知推送时，验证弹窗正常弹出
2. 控制台无报错

---

## V2 - Pinia state 禁止直接修改

| 属性 | 值 |
|------|-----|
| **严重度** | 🔴 CRITICAL |
| **预估工时** | 2h |
| **风险等级** | 低（功能不变，只改写法） |

### 问题
`App.vue:310-316` 的 `restoreUserState()` 直接给 Pinia store 的 ref 赋值，违反单向数据流原则。

### 设计方案

#### 1. user store 新增 `restoreFromStorage` action

在 `store/modules/user.js` 中添加：

```javascript
const restoreFromStorage = () => {
  accessToken.value = getAccessToken()
  refreshToken.value = getRefreshToken()
  expiresTime.value = getExpiresTime()
  userId.value = uni.getStorageSync('auth_user_id') || ''
  nickname.value = uni.getStorageSync('auth_nickname') || ''
  avatar.value = uni.getStorageSync('auth_avatar') || ''
  mobile.value = uni.getStorageSync('auth_mobile') || ''
}
```

#### 2. App.vue 中调用 action

```javascript
// 修改前
const restoreUserState = () => {
  userStore.accessToken = getAccessToken()
  userStore.refreshToken = getRefreshToken()
  // ...
}

// 修改后
const restoreUserState = () => {
  userStore.restoreFromStorage()
}
```

#### 3. 全局检查
搜索项目中其他直接修改 store state 的地方（`userStore.xxx =`、`configStore.xxx =` 等），统一改为 action。

### 影响文件
- 修改 `store/modules/user.js`
- 修改 `App.vue`
- （可能）其他直接修改 store state 的文件

### 验证方式
1. APP 启动后用户状态正常恢复
2. 登录/退出功能正常
3. Vue DevTools（H5端）中可追踪到 action 调用

---

## V3 - v-for key 替换为业务 ID

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **风险等级** | 低（只改 key，不影响逻辑） |

### 问题
多处 v-for 使用 index 作为 key，列表变化时可能导致 DOM 复用错误。

### 设计方案

#### 替换策略

| 场景 | 替换方案 |
|------|---------|
| 有 id 字段的列表项（教练、订单、评价等） | 使用 `item.id` 或 `item.coachId`、`item.orderId` 等业务 ID |
| 简单标签列表（tags 数组） | 使用标签内容本身 `tag` |
| banner/silder 轮播项 | 使用 `item.id`，没有 id 可用 `item.imageUrl` |
| 时间选择器列、选项列等静态数据 | 保留 index 但加注释说明（数据固定不变，不会有问题） |

#### 没有 id 时的处理
对于接口返回的数据，优先检查以下字段作为 key：
- `id` / `Id` / `ID`
- `coachId` / `orderId` / `userId` / `venueId` 等业务 ID
- 以上都没有时，用 `index` + 注释说明（仅适用于静态列表）

#### 需检查的文件清单
- `pages/home/index.vue` — bannerList
- `subpkg/coach/detail.vue` — tags, services, reviewList
- `subpkg/order/detail.vue` — tags
- `pages/coach/list.vue` — 教练列表
- `pages/order/list.vue` — 订单列表
- `pages/mine/index.vue` — 订单预览列表
- `subpkg/mine/wallet.vue` — 交易记录
- 其他含 v-for 的文件

### 实施步骤
1. 全局搜索所有 `:key="index"` / `:key="i"` / `:key="idx"`
2. 逐个查看数据结构，选择合适的业务字段
3. 替换并验证

### 影响文件
- 多个 Vue 文件（预计 10-15 个）

### 验证方式
1. 列表正常渲染
2. 排序/增删后列表表现正确（如有相关功能）
3. 控制台无 Vue 警告

---

## V4 - Store action 去 Promise 包装

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **风险等级** | 中（改所有 action，需保持接口一致） |

### 问题
`store/modules/user.js` 中所有 action 都用 `new Promise` 包装已有的 Promise 调用（Promise constructor anti-pattern），且存在深层嵌套。

### 设计方案

全部改为 `async/await` 写法。

**修改前示例：**
```javascript
const sendCodeAction = (mobile, scene = 1, options = {}) => {
  return new Promise((resolve, reject) => {
    sendSmsCode({ mobile, scene, ...options }).then(res => {
      resolve(res.data)
    }).catch(error => {
      reject(error)
    })
  })
}
```

**修改后：**
```javascript
const sendCodeAction = async (mobile, scene = 1, options = {}) => {
  const res = await sendSmsCode({ mobile, scene, ...options })
  return res.data
}
```

**smsLoginAction 嵌套改平：**
```javascript
const smsLoginAction = async (loginData) => {
  // 1. 校验验证码
  await validateSmsCode({ ...loginData, scene: 1 })
  // 2. 登录
  const res = await smsLogin(loginData)
  // 3. 存储 token
  setAccessToken(res.data.accessToken)
  setRefreshToken(res.data.refreshToken)
  setExpiresTime(res.data.expiresTime)
  accessToken.value = res.data.accessToken
  refreshToken.value = res.data.refreshToken
  expiresTime.value = res.data.expiresTime
  // ...
  return res.data
}
```

#### 影响的 action 列表
- `sendCodeAction`
- `smsLoginAction`
- `passwordLoginAction`
- `logOutAction`
- `resetPasswordAction`
- `updatePasswordAction`
- `updateMobileAction`
- 其他 action

### 影响文件
- 修改 `store/modules/user.js`
- 可能检查 `store/modules/config.js`、`store/modules/dict.js`

### 验证方式
1. 登录（验证码登录 + 密码登录）正常
2. 退出登录正常
3. 修改密码、修改手机号等功能正常
4. 错误提示正常显示（网络错误、业务错误等）

---

## V5 - 用 Pinia 替代 Storage 跨页传参

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 4h |
| **风险等级** | 中（涉及预约全流程，需充分测试） |

### 问题
项目使用 `uni.setStorageSync` 在页面间传递大型对象（教练信息、订单数据等），数据流不清晰，进程被杀后可能读到旧数据。

### 设计方案

#### 1. 新增 `store/modules/booking.js`

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBookingStore = defineStore('booking', () => {
  // 选中的教练信息
  const selectedCoach = ref(null)
  // 选中的球厅信息
  const selectedVenue = ref(null)
  // 选中的球桌
  const selectedTable = ref(null)
  // 预约参数（时间、时长、服务等）
  const bookingParams = ref(null)
  // 刚创建的订单（支付成功页用）
  const createdOrder = ref(null)

  // 设置教练
  const setSelectedCoach = (coach) => {
    selectedCoach.value = coach
    // 同时存入 Storage 作为兜底（刷新/杀进程后恢复）
    if (coach) {
      uni.setStorageSync('booking_selected_coach', coach)
    } else {
      uni.removeStorageSync('booking_selected_coach')
    }
  }

  // 从 Storage 恢复（APP启动/页面刷新时调用）
  const restoreFromStorage = () => {
    const coach = uni.getStorageSync('booking_selected_coach')
    if (coach) selectedCoach.value = coach
    // ... 其他字段同理
  }

  // 清空所有数据（预约完成后调用）
  const clearAll = () => {
    selectedCoach.value = null
    selectedVenue.value = null
    selectedTable.value = null
    bookingParams.value = null
    createdOrder.value = null
    uni.removeStorageSync('booking_selected_coach')
    // ...
  }

  return {
    selectedCoach,
    selectedVenue,
    selectedTable,
    bookingParams,
    createdOrder,
    setSelectedCoach,
    restoreFromStorage,
    clearAll,
  }
})
```

#### 兜底策略
- **Store 为主**：正常流程使用 Pinia store，数据流清晰
- **Storage 兜底**：每次 set 数据时同步存入 Storage，store 初始化时从 Storage 恢复
- **为什么需要兜底**：H5 页面刷新、小程序冷启动恢复、App 被杀进程后重新进入等场景，store 在内存中会丢失，需要从 Storage 恢复

#### 涉及页面改造

| 页面 | 改动 |
|------|------|
| `pages/coach/list.vue` | 点击教练 → `bookingStore.setSelectedCoach(coach)` |
| `subpkg/coach/detail.vue` | 读取 `bookingStore.selectedCoach`；下单时设置 bookingParams |
| `subpkg/booking/hall.vue` | 设置/读取 `selectedVenue`、`selectedTable` |
| `subpkg/booking/confirm.vue` | 读取所有数据；订单创建成功后设置 `createdOrder` |
| `subpkg/booking/pay-success.vue` | 读取 `createdOrder` 展示 |
| `App.vue` | 启动时调用 `bookingStore.restoreFromStorage()` |

### 影响文件
- 新增 `store/modules/booking.js`
- 修改 `pages/coach/list.vue`
- 修改 `subpkg/coach/detail.vue`
- 修改 `subpkg/booking/hall.vue`
- 修改 `subpkg/booking/confirm.vue`
- 修改 `subpkg/booking/pay-success.vue`
- 修改 `App.vue`（恢复兜底数据）

### 验证方式
1. 完整预约流程测试：教练列表 → 教练详情 → 选择球厅 → 确认订单 → 支付成功
2. 杀进程/刷新后重新进入，验证数据能从 Storage 恢复
3. 预约完成后数据被清空，不残留
4. 现场订单等其他流程不受影响

---

# 四、代码质量 & 可维护性（4 个）

---

## Q1 - 定时器/事件监听器统一管理

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 3h |
| **风险等级** | 中（涉及定时器较多的页面，需谨慎） |

### 问题
多处定时器和事件监听器管理混乱，容易泄漏：
- 订单详情页：5+ 个定时器分散管理
- 登录/重置密码页：倒计时定时器可能泄漏
- 订单列表页：`uni.$on('orderEvaluated')` 未清理
- 首页：WebSocket 订阅未取消

### 设计方案

#### 1. 新增 `composables/useInterval.js`

自动清理的定时器 composable，基于 UniApp 生命周期：

```javascript
import { ref, onUnmounted } from 'vue'
// UniApp 页面生命周期
import { onUnload } from '@dcloudio/uni-app'

/**
 * 自动清理的定时器
 * @param {Function} callback - 回调函数
 * @param {number} delay - 间隔（毫秒）
 * @returns {{ start: Function, stop: Function, isRunning: Ref<boolean> }}
 */
export function useInterval(callback, delay) {
  let timer = null
  const isRunning = ref(false)

  const start = () => {
    if (timer) return
    isRunning.value = true
    timer = setInterval(callback, delay)
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isRunning.value = false
  }

  // 页面卸载时自动清理
  const cleanup = () => stop()
  try { onUnload(cleanup) } catch (e) {}
  try { onUnmounted(cleanup) } catch (e) {}

  return { start, stop, isRunning }
}

/**
 * 自动清理的 setTimeout
 */
export function useTimeout(callback, delay) {
  let timer = null

  const start = () => {
    stop()
    timer = setTimeout(() => {
      timer = null
      callback()
    }, delay)
  }

  const stop = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const cleanup = () => stop()
  try { onUnload(cleanup) } catch (e) {}
  try { onUnmounted(cleanup) } catch (e) {}

  return { start, stop }
}
```

#### 2. 新增 `composables/useGlobalEvent.js`

自动清理的全局事件监听器：

```javascript
import { onUnmounted } from 'vue'
import { onUnload } from '@dcloudio/uni-app'

export function useGlobalEvent(eventName, handler) {
  uni.$on(eventName, handler)

  const cleanup = () => {
    uni.$off(eventName, handler)
  }

  try { onUnload(cleanup) } catch (e) {}
  try { onUnmounted(cleanup) } catch (e) {}

  return { off: cleanup }
}
```

#### 3. 各页面改造

**订单详情页**：
- 现有 5 个定时器（支付倒计时、加时倒计时、状态轮询、计时轮询、本地计时）
- 逐步替换为 `useInterval`，确保 onUnload 时全部清理
- 集中管理，建立 timers 数组统一清理

**订单列表页**：
- `uni.$on('orderEvaluated')` 改为 `useGlobalEvent`
- 或手动添加 `onUnload(() => uni.$off('orderEvaluated'))`

**首页**：
- WebSocket 订阅的取消函数在 onUnload 中调用

**登录页/重置密码页**：
- 倒计时改为 `useInterval`

### 影响文件
- 新增 `composables/useInterval.js`
- 新增 `composables/useGlobalEvent.js`
- 修改 `subpkg/order/detail.vue`
- 修改 `pages/order/list.vue`
- 修改 `pages/home/index.vue`
- 修改 `pages/login/index.vue`
- 修改 `pages/login/resetPassword.vue`

### 验证方式
1. 订单详情页进入后退出，验证定时器停止（网络请求不再发送）
2. 订单列表页多次进出，验证 `orderEvaluated` 不会被多次触发
3. 登录页倒计时过程中退出页面，验证定时器停止

---

## Q2 - 统一工具函数（时间/金额/距离格式化）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 3h |
| **风险等级** | 低（提取公共函数，逐个页面替换） |

### 问题
时间、金额、距离等格式化函数在多个页面重复定义，格式不一致，维护成本高。

### 设计方案

#### 新增 `utils/format.js`

收集项目中所有格式化函数，统一实现：

```javascript
/**
 * 日期格式化
 * @param {Date|string|number} date - 日期
 * @param {string} format - 格式，默认 'YYYY-MM-DD'
 * @returns {string}
 */
export function formatDate(date, format = 'YYYY-MM-DD') { ... }

/**
 * 日期时间格式化
 * @returns {string} 'YYYY-MM-DD HH:mm'
 */
export function formatDateTime(date) { ... }

/**
 * 时间格式化
 * @returns {string} 'HH:mm'
 */
export function formatTime(date) { ... }

/**
 * 倒计时格式化
 * @param {number} seconds - 秒数
 * @returns {string} 'HH:mm:ss' 或 'mm:ss'
 */
export function formatCountdown(seconds) { ... }

/**
 * 金额格式化
 * @param {number} amount - 金额
 * @param {number} decimals - 小数位数，默认 2
 * @returns {string}
 */
export function formatAmount(amount, decimals = 2) { ... }

/**
 * 距离格式化
 * @param {number} meters - 米
 * @returns {string} '< 1km 显示米，>=1km 显示 km（1位小数）'
 */
export function formatDistance(meters) { ... }

/**
 * 时长格式化
 * @param {number} minutes - 分钟
 * @returns {string} 'X小时Y分钟' 或 'X分钟'
 */
export function formatDuration(minutes) { ... }
```

#### 实施步骤
1. 收集所有页面中的格式化函数，梳理格式差异
2. 统一实现到 `utils/format.js`，通过参数支持不同格式变体
3. 逐个页面替换，删除本地定义
4. 每个页面替换后验证显示一致

### 注意事项
- 替换前确认每个页面的格式需求，避免替换后显示格式变化
- 有的页面可能有特殊格式需求，保留在本地或通过参数支持
- 金额单位要确认清楚（是分还是元）

### 影响文件
- 新增 `utils/format.js`
- 修改多个页面（教练列表、订单列表、订单详情、钱包、首页等）

### 验证方式
1. 各页面时间/金额/距离显示与修改前一致
2. 边界值验证（0、负数、极大值等）

---

## Q3 - 重复代码消除（权限弹窗 + openAppSetting）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 2h |
| **风险等级** | 中（涉及权限逻辑，需确保各权限行为不变） |

### 问题
1. **权限用途说明弹窗**在 `location.js`、`photo.js`、`call.js` 中几乎相同的实现
2. **打开应用设置页面**在三个文件中重复实现

### 设计方案

#### 1. 统一权限用途说明弹窗

提取到 `utils/platform.js` 中：

```javascript
/**
 * 显示权限用途说明弹窗
 * @param {string} storageKey - 同意状态存储的 key
 * @param {Object} config - 弹窗配置
 * @param {string} config.title - 标题
 * @param {string} config.content - 内容
 * @param {string} [config.confirmText='我知道了'] - 确认按钮文字
 * @returns {Promise<boolean>} - 用户是否点击了确认
 */
export function showPermissionPurposeModal(storageKey, config) {
  return new Promise((resolve) => {
    // 如果已经同意过，直接返回
    if (uni.getStorageSync(storageKey)) {
      resolve(true)
      return
    }
    uni.showModal({
      title: config.title,
      content: config.content,
      showCancel: false,
      confirmText: config.confirmText || '我知道了',
      success: (res) => {
        if (res.confirm) {
          uni.setStorageSync(storageKey, true)
          resolve(true)
        }
      },
    })
  })
}
```

#### 2. 统一 openPermissionSettings

保留 `utils/platform.js` 中的 `openPermissionSettings` 作为唯一实现，删除 `location.js` 和 `photo.js` 中的重复实现，改为引用 platform.js 中的函数。

#### 3. 各模块改造

| 文件 | 改动 |
|------|------|
| `utils/platform.js` | 新增 `showPermissionPurposeModal`；确认 `openPermissionSettings` 实现完整 |
| `utils/location.js` | 权限说明弹窗改用通用函数；openAppSetting 改用 platform.js |
| `utils/photo.js` | 相机+相册两个权限说明弹窗改用通用函数；openAppSetting 改用 platform.js |
| `utils/call.js` | 权限说明弹窗改用通用函数 |

### 注意事项
- 每个权限的弹窗文案不同（定位、相机、相册、电话），通过 config 参数传入
- 每个权限的 storage key 不同，通过参数传入
- openAppSetting 的实现要覆盖所有平台（App、小程序、H5）

### 影响文件
- 修改 `utils/platform.js`
- 修改 `utils/location.js`
- 修改 `utils/photo.js`
- 修改 `utils/call.js`

### 验证方式
1. 首次使用定位/相机/相册/电话时，权限说明弹窗正常显示
2. 点击确认后，下次不再弹出
3. 打开应用设置功能正常（各平台）

---

## Q4 - 魔法数字提取为常量

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 2h |
| **风险等级** | 低（只改命名，不改逻辑） |

### 问题
大量魔法数字散布在代码中，没有命名和注释说明含义。

### 设计方案

#### 1. 新增 `utils/constants.js`

存放通用常量：

```javascript
// ===== 时间常量（毫秒） =====
export const TIME_ONE_SECOND = 1000
export const TIME_ONE_MINUTE = 60 * 1000
export const TIME_FIVE_MINUTES = 5 * 60 * 1000
export const TIME_ONE_HOUR = 60 * 60 * 1000
export const TIME_ONE_DAY = 24 * 60 * 60 * 1000

// ===== 分页默认值 =====
export const DEFAULT_PAGE_SIZE = 20
export const DEFAULT_PAGE_NO = 1

// ===== 存储 key 前缀 =====
export const STORAGE_PREFIX = 'cut_app_'
```

#### 2. 模块内常量

各模块的魔法数字提取到文件顶部，添加注释：

**payment.js：**
```javascript
// 支付请求超时时间（毫秒）
const PAY_REQUEST_TIMEOUT = 5 * 60 * 1000

// 支付状态轮询 - 默认配置
const POLL_DEFAULT_MAX_ATTEMPTS = 30
const POLL_DEFAULT_INTERVAL = 2500
```

**websocket.js：**
```javascript
// 心跳间隔（毫秒）
const HEARTBEAT_INTERVAL = 30000

// 重连延迟（秒）
const RECONNECT_DELAYS = [1, 2, 5, 10, 30]
```

**location.js：**
```javascript
// 定位超时时间（毫秒）
const LOCATION_TIMEOUT = 15000
```

**order/detail.vue：**
```javascript
// 订单状态轮询间隔（毫秒）
const POLLING_INTERVAL = 8000
```

#### 实施步骤
1. 新增 `utils/constants.js`，放入跨模块通用的常量
2. 各模块提取本地常量到文件顶部，添加 JSDoc 注释
3. 替换所有魔法数字为命名常量

### 影响文件
- 新增 `utils/constants.js`
- 修改 `utils/payment.js`
- 修改 `utils/websocket.js`
- 修改 `utils/location.js`
- 修改 `utils/jpush.js`
- 修改 `subpkg/order/detail.vue`
- 修改 `App.vue`
- 其他含魔法数字的文件

### 验证方式
1. 功能行为与修改前完全一致
2. 代码可读性提升，常量名清晰表达含义

---

# 五、性能优化（4 个）

---

## Perf1 - 删除死代码 + 无用依赖

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **风险等级** | 中（删除前必须确认无引用） |

### 问题
项目中存在未使用的样式库、组件、注释代码、图片等，增加包体积。

### 设计方案

#### 确认要删除的内容

| 内容 | 位置 | 状态 |
|------|------|------|
| ColorUI 样式库 | `static/scss/colorui.css` + `index.scss` 引入 | ✅ 确认无引用，删除 |
| `qrImage.png` | `static/images/qrImage.png` | ✅ 确认无引用，删除 |
| 注释代码块 | 多个 Vue 文件 | ✅ 逐文件确认后删除 |
| 未使用的 uni-ui 组件 | `uni_modules/` | ⚠️ 需逐个确认（见下方） |
| `utils/storage.js` | `utils/storage.js` | ⚠️ 需确认是否被引用 |
| `ScreenShot_2026-08-29_104127_023.png` | `static/images/` | ❌ 保留（客服二维码，在 help.vue 中使用） |

#### uni-ui 组件清理策略
**重要：删除前必须全局搜索确认组件名无引用**

已知实际使用的组件（保留）：
- `uni-icons`
- `uni-load-more`
- `uni-data-picker`
- `uni-popup`
- `uni-section`
- `uni-card`
- `uni-badge`

未使用的候选（需验证后删除）：
- `uni-calendar`, `uni-collapse`, `uni-combox`, `uni-countdown`
- `uni-data-checkbox`, `uni-data-select`, `uni-datetime-picker`
- `uni-drawer`, `uni-easyinput`, `uni-fab`, `uni-fav`
- `uni-file-picker`, `uni-forms`, `uni-goods-nav`, `uni-grid`
- `uni-group`, `uni-indexed-list`, `uni-link`, `uni-list`
- `uni-nav-bar`, `uni-notice-bar`, `uni-number-box`
- `uni-pagination`, `uni-rate`, `uni-row`, `uni-scss`
- `uni-search-bar`, `uni-segmented-control`, `uni-steps`
- `uni-swipe-action`, `uni-swiper-dot`, `uni-table`
- `uni-tag`, `uni-title`, `uni-tooltip`, `uni-transition`

#### 注释代码清理
- 逐文件检查被注释的代码块
- 确认是废弃功能后删除
- Git 历史中有记录，不用担心找不回

### 实施步骤
1. 删除 ColorUI 引入和文件
2. 删除 qrImage.png
3. 清理注释代码（逐文件）
4. 逐个确认未使用的 uni-ui 组件并删除（保守操作，不确定的保留）
5. 确认 utils/storage.js 等未使用模块

### 影响文件
- 删除 `static/scss/colorui.css`
- 修改 `static/scss/index.scss`
- 删除 `static/images/qrImage.png`
- 修改多个 Vue 文件（删除注释代码）
- 删除部分 `uni_modules/` 下的组件（确认无引用的）

### 验证方式
1. 各页面正常渲染，样式无异常
2. 构建无报错
3. 包体积对比（可选）

---

## Perf2 - 图片优化（压缩 + 懒加载）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 3h |
| **风险等级** | 低（不改变功能逻辑） |

### 问题
1. 大尺寸图片未压缩（banner、profile.jpg 等）
2. 长列表图片无懒加载

用户确认：picsum.photos 占位图保留、qrImage.png 删除（见 Perf1）、profile.jpg 保留并压缩。

### 设计方案

#### 1. 图片压缩

需要压缩的图片：
| 图片 | 当前大小 | 目标大小 | 工具 |
|------|---------|---------|------|
| `static/images/profile.jpg` | ~80KB | ~30KB | tinypng / 手动压缩 |
| `static/images/banner/banner01.jpg` | ~128KB | ~50-60KB | tinypng / 手动压缩 |
| `static/images/banner/banner02.jpg` | ~148KB | ~50-60KB | tinypng / 手动压缩 |
| `static/images/banner/default-cover.jpg` | ~132KB | ~50-60KB | tinypng / 手动压缩 |
| `static/images/banner/billiards_2.jpg` | ~120KB | ~50-60KB | tinypng / 手动压缩 |
| 其他 PNG 图片 | | 按需压缩 | tinypng |

**操作方式**：使用 https://tinypng.com/ 或本地工具手动压缩图片，不使用脚本批量处理。

#### 2. 图片懒加载

在列表页的 `<image>` 标签添加 `lazy-load` 属性（小程序支持，App/H5 也有对应支持）。

涉及页面：
- `pages/coach/list.vue` — 教练列表头像
- `pages/order/list.vue` — 订单列表头像
- `subpkg/coach/detail.vue` — 评价列表头像
- `subpkg/mine/wallet.vue` — （如有图片列表）
- 其他长列表页面

```html
<!-- 修改前 -->
<image :src="coach.avatar" mode="aspectFill"></image>

<!-- 修改后 -->
<image :src="coach.avatar" mode="aspectFill" lazy-load></image>
```

### 影响文件
- `static/images/` 下多个图片文件（压缩替换）
- `pages/coach/list.vue`
- `pages/order/list.vue`
- `subpkg/coach/detail.vue`
- 其他列表页面

### 验证方式
1. 图片压缩后视觉质量可接受
2. 列表图片正常加载
3. 小程序端 lazy-load 属性生效（向下滚动时图片才加载）

---

## Perf4 - 教练详情页重复请求修复

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 1h |
| **风险等级** | 低 |

### 问题
教练详情页中，`onLoad` 和 `onMounted` 都会调用 `loadCoachData()`，首次进入页面时会发出两次重复请求。

```
onLoad → 解析参数 → loadCoachData()
onMounted → 判断 → loadCoachData()
```

实际上 `onLoad` 中已经加载了数据，`onMounted` 中的加载是多余的。

### 设计方案

**方案：移除 onMounted 中的全量加载，onShow 中只刷新状态类数据**

具体改动：
1. `onMounted` 中移除 `loadCoachData()` 调用，保留系统信息获取等初始化逻辑
2. `onShow` 中的 `loadCoachData()` 改为只刷新轻量数据：
   - 收藏状态（`loadFavorStatus` 或类似）
   - 在线状态
   - 不重新加载教练完整信息
3. 如果教练 ID 变化（如从一个教练详情跳到另一个），需要重新加载

```javascript
// 修改后逻辑
onLoad((options) => {
  coachId.value = options.id
  loadCoachData()  // 首次加载完整数据
})

onMounted(() => {
  if (isReviewMode()) return
  // 系统信息获取等一次性初始化
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
  // 不调用 loadCoachData()，因为 onLoad 已经加载了
})

onShow(() => {
  isUserLoggedIn.value = isLoggedIn()
  // 只刷新状态类数据，不全量加载
  if (coachId.value) {
    refreshLightWeightData()  // 收藏状态、在线状态等
  }
  loadCountdownEnabled()
})
```

### 影响文件
- 修改 `subpkg/coach/detail.vue`

### 验证方式
1. 首次进入教练详情页，Network 中只看到一次教练详情请求
2. 从其他页面返回教练详情页，状态数据正常刷新
3. 从教练 A 详情跳到教练 B 详情，数据正确切换

---

## Perf5 - "我的"页面订单加载优化

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **风险等级** | 低 |

### 问题
`pages/mine/index.vue` 的 `loadOrders` 函数一次性并行请求 5 个状态的订单列表，每个请求 `pageSize: 100` 条，但页面上每个 tab 只显示 **前 3 条**。

### 设计方案
将 `pageSize` 从 100 改为 5（足够展示，且留一点余量）。

```javascript
// 修改前
const res = await getOrderList({ status, pageNo: 1, pageSize: 100 })

// 修改后
const res = await getOrderList({ status, pageNo: 1, pageSize: 5 })
```

同时调整 `showOrders` 中的 slice（当前是 `.slice(0, 3)`），保持显示 3 条不变。

### 为什么是 5 条而不是 3 条
- 预留缓冲：如果某状态下有不同类型的订单（普通/现场），需要更多数据来保证能展示 3 条
- 如果接口过滤逻辑有不确定性，多取 2 条更保险
- 数据量仍然很小，对性能影响微乎其微

### 影响文件
- 修改 `pages/mine/index.vue`

### 验证方式
1. "我的"页面每个状态 tab 都能正常显示订单（至少 3 条）
2. 网络请求数据量减少
3. 点击"查看全部"跳转到订单列表页正常（不受影响）

---

# 六、大组件重构（3 个）

---

## R1 - confirm.vue 拆分（1955 行）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 6h |
| **风险等级** | 中高（预约核心页面，必须保证流程不受影响） |

### 问题
`subpkg/booking/confirm.vue` 单文件 1955 行，包含订单确认、时间选择器、城市选择器、地点搜索、支付方式选择等过多职责。

### 设计方案

#### 拆分策略
**原则：先拆弹窗组件（独立、边界清晰），再抽 composable，最后清理主文件**

#### 1. 拆分子组件

| 组件 | 内容 | 预计行数 |
|------|------|---------|
| `components/booking/TimePickerPopup.vue` | 时间选择器弹窗（picker-view 实现） | ~300 行 |
| `components/booking/CityPickerPopup.vue` | 城市选择器弹窗（两级联动） | ~250 行 |
| `components/booking/PlaceSearchPopup.vue` | 地点搜索选择弹窗 | ~250 行 |
| `components/booking/PaymentMethodPicker.vue` | 支付方式选择弹窗/底部栏 | ~150 行 |
| `components/booking/ServiceItemCard.vue` | 服务项目卡片 | ~80 行 |

#### 2. 提取 composables

| composable | 内容 | 预计行数 |
|------------|------|---------|
| `composables/useOrderCreate.js` | 订单创建逻辑、参数校验 | ~200 行 |
| `composables/useBookingTime.js` | 预约时间选择、时长计算 | ~150 行 |
| `composables/usePayment.js` | 支付逻辑、支付渠道选择 | ~150 行 |
| `composables/useVenueSelector.js` | 球厅/球桌选择逻辑 | ~100 行 |

#### 3. 主文件保留

主文件 `confirm.vue` 精简后预计 ~500-600 行，负责：
- 页面整体布局和数据流
- 组件组合和状态协调
- 页面生命周期管理

#### 实施顺序（确保每步都可独立验证）
1. **Step 1**: 提取 `TimePickerPopup` 组件 → 测试时间选择功能
2. **Step 2**: 提取 `CityPickerPopup` 组件 → 测试城市选择功能
3. **Step 3**: 提取 `PlaceSearchPopup` 组件 → 测试地点搜索功能
4. **Step 4**: 提取 `PaymentMethodPicker` 组件 → 测试支付方式选择
5. **Step 5**: 提取 `useOrderCreate` composable → 测试订单创建
6. **Step 6**: 提取 `useBookingTime` composable → 测试时间逻辑
7. **Step 7**: 清理主文件，最终验证完整流程

### 影响文件
- 新增 `components/booking/` 目录及 5 个组件
- 新增 4 个 composables
- 精简 `subpkg/booking/confirm.vue`

### 验证方式
- 完整预约流程测试（选教练 → 选时间 → 选球厅 → 确认订单 → 支付）
- 每个组件提取后单独测试功能
- 边缘场景：修改时间、切换球厅、切换支付方式等

---

## R2 - order/detail.vue 拆分（2442 行）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 8h |
| **风险等级** | 中高（订单核心页面，功能复杂） |

### 问题
订单详情页 2442 行，是项目最大的文件。包含订单状态、服务信息、费用明细、倒计时、轮询、加时、评价、联系教练等众多功能。

### 设计方案

#### 1. 拆分子组件

| 组件 | 内容 | 预计行数 |
|------|------|---------|
| `components/order/OrderStatusHeader.vue` | 订单状态头部（状态文字、倒计时、图标） | ~150 行 |
| `components/order/OrderServiceInfo.vue` | 服务信息（教练、球厅、时间、时长） | ~200 行 |
| `components/order/OrderFeeDetail.vue` | 费用明细（原价、优惠、实付等） | ~150 行 |
| `components/order/OrderCoachCard.vue` | 教练信息卡片（头像、昵称、等级、联系按钮） | ~120 行 |
| `components/order/OrderActionBar.vue` | 底部操作栏（取消订单、联系教练、评价等） | ~200 行 |
| `components/order/OrderAddTimePopup.vue` | 加时弹窗 | ~200 行 |
| `components/order/OrderCountdownTimer.vue` | 倒计时组件 | ~100 行 |

#### 2. 提取 composables

| composable | 内容 | 预计行数 |
|------------|------|---------|
| `composables/useOrderDetail.js` | 订单详情加载、状态管理 | ~200 行 |
| `composables/useOrderPolling.js` | 订单状态轮询 + 计时状态轮询 | ~150 行 |
| `composables/useCountdown.js` | 倒计时管理（支付倒计时、加时倒计时） | ~100 行 |
| `composables/useAddTime.js` | 加时逻辑 | ~100 行 |

#### 3. 主文件保留
主文件精简后预计 ~600-700 行。

#### 实施顺序
1. 先拆独立的展示组件（Header、ServiceInfo、FeeDetail、CoachCard）
2. 再拆交互组件（ActionBar、AddTimePopup、CountdownTimer）
3. 最后抽 composable，清理主文件

### 影响文件
- 新增 `components/order/` 目录及 7 个组件
- 新增 4 个 composables
- 精简 `subpkg/order/detail.vue`

### 验证方式
1. 完整订单流程测试（待支付 → 已接单 → 进行中 → 已完成 → 已评价）
2. 倒计时功能正常
3. 加时功能正常
4. 各状态下操作按钮显示正确
5. 轮询功能正常（状态变化时自动更新）

---

## R3 - payment.js 拆分（803 行）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 4h |
| **风险等级** | 中（支付核心模块，需确保行为一致） |

### 问题
`utils/payment.js` 803 行，包含支付常量、各渠道支付函数、轮询器、防重复提交、现场支付等过多职责。

### 设计方案

#### 目录结构
```
utils/payment/
├── index.js          # 主入口，导出 executePayment 等公共 API
├── constants.js      # 常量（支付渠道、状态、超时时间）
├── channels.js       # 各平台支付函数（微信小程序、微信App、支付宝App、钱包）
├── poller.js         # 支付状态轮询器（createPoller）
├── guard.js          # 防重复提交逻辑
└── onsite.js         # 现场订单支付
```

#### 各文件职责

**constants.js：**
- 支付渠道常量（`PAY_CHANNELS`）
- 支付状态常量（`PAY_STATUS`）
- 支付请求状态常量（`PAY_REQUEST_STATUS`）
- 超时时间、轮询配置等

**channels.js：**
- `wxMpPay()` — 微信小程序支付
- `wxAppPay()` — App 微信支付
- `alipayAppPay()` — App 支付宝支付
- `getPaymentChannel()` — 获取当前平台可用的支付渠道

**poller.js：**
- `createPoller()` — 创建轮询器
- 轮询状态机管理

**guard.js：**
- 防重复提交状态管理
- `checkPayPending()`、`setPayPending()`、`clearPayPending()`

**onsite.js：**
- `executeOnsitePayment()` — 现场订单支付
- 现场订单的特殊轮询逻辑

**index.js：**
- `executePayment()` — 主支付函数（编排各模块）
- 导出所有公共 API

### 实施顺序
1. 先抽 constants.js → 替换引用 → 测试
2. 再抽 guard.js → 替换引用 → 测试
3. 再抽 channels.js → 替换引用 → 测试
4. 再抽 poller.js → 替换引用 → 测试
5. 再抽 onsite.js → 替换引用 → 测试
6. 最后清理 index.js

### 影响文件
- 新增 `utils/payment/` 目录及 6 个文件
- 删除原 `utils/payment.js`
- 所有引用 `utils/payment.js` 的地方需要调整 import 路径（改为 `utils/payment`）

### 验证方式
1. 微信小程序支付正常
2. App 微信支付正常
3. App 支付宝支付正常
4. 钱包支付正常
5. 防重复提交正常
6. 支付状态轮询正常
7. 现场订单支付正常
8. 取消支付、支付失败等异常场景正常

---

# 实施总览

## 实施顺序建议

按风险从低到高、改动从小到大排列：

| 批次 | 优化包 | 工时 | 风险 | 特点 |
|------|--------|------|------|------|
| **第一批** | V1 + P2 + P3 + P4 + Perf4 + Perf5 | ~3.5h | 极低 | Bug修复、小改动、快速见效 |
| **第二批** | S4 + S6 + P1 + Perf2 + Perf1 | ~9h | 低~中 | 安全加固 + 支付修复 + 性能优化 |
| **第三批** | V2 + V3 + V4 + Q4 | ~6.5h | 低~中 | 规范类修复，不改变功能 |
| **第四批** | V5 + Q1 + Q2 + Q3 | ~12h | 中 | 架构调整，涉及页面较多 |
| **第五批** | R1 + R2 + R3 | ~18h | 中高 | 大重构，必须充分测试 |

## 验证原则
- 每个优化包独立修改、独立验证
- 不使用脚本批量修改，逐文件手动修改
- 不操作 git，全部改完后人工检查再提交
- 核心流程（登录、预约、支付、订单）每个批次都要回归测试
