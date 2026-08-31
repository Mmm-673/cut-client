# 初球项目代码审查优化方案总览

> 审查维度：安全 | Vue代码质量 | JS/TS代码质量 | 性能优化
> 优化包总数：28 个（6 大领域）
> 总预估工时：约 63.5 小时

---

## 目录

- [🔴 领域一：安全加固（7 个）](#-领域一安全加固7-个)
- [🟠 领域二：支付 & 核心业务正确性（4 个）](#-领域二支付--核心业务正确性4-个)
- [🟢 领域三：Vue & 状态管理规范（5 个）](#-领域三vue--状态管理规范5-个)
- [🔵 领域四：代码质量 & 可维护性（4 个）](#-领域四代码质量--可维护性4-个)
- [🟡 领域五：性能优化（5 个）](#-领域五性能优化5-个)
- [⚪ 领域六：大组件重构（3 个，可选）](#-领域六大组件重构3-个可选)

---

# 🔴 领域一：安全加固（7 个）

---

## S1 - 路由权限拦截修复

| 属性 | 值 |
|------|-----|
| **严重度** | 🔴 CRITICAL |
| **预估工时** | 0.5h |
| **影响文件** | `permission.js`、`pages/login/index.vue` |

### 问题
`permission.js` 中 `whiteList` 定义了但从未使用。未登录用户可以直接访问订单、钱包、个人中心、充值、提现等所有敏感页面，门户大开。

### 修改方案
建立白名单机制：白名单内页面无需登录，白名单外必须登录。未登录访问受保护页面时跳转登录页并携带 `redirect` 参数。

**白名单（公开页面）：**
- `/pages/login/index` — 登录页
- `/pages/login/resetPassword` — 重置密码
- `/pages/home/index` — 首页（TabBar）
- `/pages/coach/list` — 裁教列表（TabBar）
- `/subpkg/coach/detail` — 裁教详情
- `/subpkg/booking/hall` — 选择球厅
- `/subpkg/common/webview` — WebView
- `/subpkg/common/textview` — 文本展示

**需登录页面（列举主要）：**
- `/pages/order/list`、`/pages/mine/index`（TabBar）
- `/subpkg/booking/confirm`、`/subpkg/booking/pay-success`
- `/subpkg/order/detail`
- `/subpkg/coach/reward`、`/subpkg/coach/evaluate`
- `/subpkg/mine/*`（钱包、充值、提现、收藏、个人信息、设置等）
- 其余所有分包页面

### 核心改动
1. 重写 `permission.js` 拦截逻辑
2. 登录页增加 `redirect` 参数回跳支持（登录成功后返回原页面）

### 注意事项
- TabBar 页面必须用 `switchTab` 跳转，拦截时需区分处理
- 白名单包含首页和裁教列表，普通浏览用户不受影响

---

## S2 - Token 加密存储

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **影响文件** | `utils/token.js`、`utils/`（新增加密工具） |

### 问题
Access Token、Refresh Token、用户 ID、手机号等敏感信息全部明文存储在 `uni.setStorageSync` 中。
- H5 平台对应 localStorage，易被 XSS 攻击窃取
- App 端设备被 root/越狱后可直接读取

### 修改方案
对敏感数据进行 AES 加密后再存入 Storage。加密密钥使用设备相关信息派生（App端）或存储在内存中（H5端）。

**加密范围：**
- `auth_access_token`
- `auth_refresh_token`
- `auth_expires_time`
- `auth_mobile`

**不加密（非敏感或需明文）：**
- `auth_user_id`、`auth_nickname`、`auth_avatar`（公开信息）
- 非敏感业务数据

### 核心改动
1. 新增 `utils/crypto.js` — 封装 AES 加密/解密方法
2. 改造 `utils/token.js` — 存之前加密，取之后解密
3. 提供迁移逻辑 — 首次读取时如果是明文则加密后重新存储

### 注意事项
- 密钥管理：使用固定密钥 + 设备信息混淆，避免纯明文密钥
- H5 端无法做到绝对安全（代码在浏览器中），加密主要提高窃取门槛
- 需要兼容旧数据（升级后首次启动时自动迁移）

---

## S3 - Token 传递方式优化

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 1h |
| **影响文件** | `api/auth.js`、`utils/websocket.js` |

### 问题
1. **Refresh Token 通过 URL 参数传递**（`api/auth.js:84-93`）— 可能出现在服务器日志、代理日志中
2. **WebSocket Token 通过 URL query 传递**（`utils/websocket.js:50`）— 同上

### 修改方案
1. **Refresh Token**：从 `params`（GET query）改为 `data`（POST body）传递
2. **WebSocket Token**：改为 Sec-WebSocket-Protocol 子协议传递，或连接建立后第一条消息发送认证信息（需后端配合）

**如果后端暂不支持 WebSocket 子协议**：至少确保服务端不记录完整 URL 到日志（此条需后端配合）。

### 核心改动
1. `api/auth.js` — `refreshToken` 函数参数从 `params` 改为 `data`
2. `utils/websocket.js` — 连接 URL 不再携带 token，改为子协议或消息认证（需确认后端方案）

### 注意事项
- WebSocket 方案需要后端配合，需与后端确认支持哪种方式
- 如果后端暂不改，前端至少先把 Refresh Token 的传递方式改了

---

## S4 - rich-text XSS 内容过滤

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **影响文件** | `subpkg/mine/notification/detail.vue`、`utils/`（新增过滤工具） |

### 问题
通知详情页使用 `<rich-text :nodes="detail.content">` 直接渲染后端返回的 HTML 内容，未进行任何过滤。如果后端被攻破或存在存储型 XSS，恶意 HTML/JS 将在用户端执行。

### 修改方案
前端增加 HTML 白名单过滤，只允许安全标签和属性。

**方案选择：**
- **方案 A（推荐）**：实现一个轻量的白名单过滤器（只保留 p、span、img、a、br、ul、ol、li 等安全标签）
- **方案 B**：引入 DOMPurify 库（~15KB gzipped），功能完善但增加包体积

建议使用方案 A，因为富文本场景简单（主要是通知、协议等），不需要完整的 DOMPurify。

**白名单标签：** `p`, `span`, `br`, `img`, `a`, `ul`, `ol`, `li`, `strong`, `em`, `h1`~`h6`, `blockquote`, `code`, `pre`

**白名单属性：** `src`(img), `alt`(img), `href`(a), `target`(a), `style`(有限制)

### 核心改动
1. 新增 `utils/html-sanitizer.js` — HTML 白名单过滤工具
2. 改造 `subpkg/mine/notification/detail.vue` — 渲染前调用过滤
3. 检查项目中其他使用 `rich-text` 或 `v-html` 的地方，统一处理

### 注意事项
- 前端过滤是第二道防线，后端必须也做过滤（前端过滤防后端被攻破后的兜底）
- rich-text 在小程序端支持的标签有限，需要验证兼容性

---

## S5 - 审核白名单移至服务端

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **影响文件** | `utils/review.js`、`App.vue`、各使用审核模式的页面 |

### 问题
审核白名单手机号 `18500776411` 硬编码在 `utils/review.js:4` 中，可通过反编译获取。攻击者可以使用该手机号尝试登录或绕过审核限制。

### 修改方案
移除前端硬编码的白名单判断逻辑，改为完全依赖服务端下发的审核标识。

**具体方案：**
- 用户登录后，服务端在用户信息中返回 `isReviewAccount` 字段
- 前端读取该字段判断是否为审核账号
- 删除 `REVIEW_ACCOUNT_PHONE` 常量和本地判断逻辑

### 核心改动
1. 删除 `utils/review.js` 中的手机号白名单常量和本地判断函数
2. 修改审核模式判断逻辑：改为从用户信息中读取服务端返回的标识
3. 审核模式的开关配置继续保留远程配置方式（因为是全局开关）

### 注意事项
- 需要后端配合：在用户信息接口中增加 `isReviewAccount` 字段
- 审核模式的远程开关（`reviewModeEnabled`）保留不变，只是白名单判断移至服务端

---

## S6 - 生产环境清除敏感日志

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 1h |
| **影响文件** | 所有含 console 的 JS/Vue 文件、`utils/`（新增日志工具） |

### 问题
项目中约 **333 处** `console.log/warn/error`，其中包含大量敏感信息打印：
- `App.vue` — 打印用户 ID、昵称、手机号、token 状态
- `payment.js` — 打印支付参数
- `utils/websocket.js` — 打印消息内容
- 等等...

**风险：**
- H5 端任何人可通过开发者工具查看
- App 端可通过调试工具查看
- 影响性能（频繁的对象打印）

### 修改方案
1. 建立统一的日志工具 `utils/logger.js`，支持级别控制
2. 生产环境禁用 `log` 和 `warn` 级别，只保留 `error`
3. **所有打印敏感信息的语句必须删除**（不能只靠禁用，因为代码中还能看到）
4. 非敏感调试日志改用 `logger.debug()`，生产环境自动静默

### 核心改动
1. 新增 `utils/logger.js` — 统一日志工具
2. 全局搜索并删除/替换敏感信息的 console.log
3. 普通调试日志替换为 logger 调用

### 注意事项
- 敏感信息（token、密码、手机号、支付参数）**绝对不能打印**，即使是开发环境
- `console.error` 建议保留用于错误追踪，但注意不要在 error 中打印敏感数据

---

## S7 - WebView URL 白名单校验

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 1h |
| **影响文件** | `subpkg/common/webview.vue` |

### 问题
WebView 页面接收外部传入的 URL 参数并直接加载（`<web-view :src="params.url">`）。
- 小程序端有域名白名单限制（微信后台配置），相对安全
- H5 和 App 端如果没有校验，可能被用于加载恶意网站进行钓鱼

### 修改方案
增加 URL 白名单校验：
1. **协议校验**：只允许 `https://`（开发环境可加 http 例外）
2. **域名白名单**：只允许加载本站域名和可信第三方域名
3. **禁止 file:// 和 javascript:** 等危险协议

**白名单域名（示例）：**
- `qiulem.com`（本站所有子域名）
- 其他后端配置的可信第三方域名

### 核心改动
1. `subpkg/common/webview.vue` — onLoad 时校验 URL，不通过则显示错误提示
2. 白名单域名可配置化（从 config 或远程配置读取）

### 注意事项
- 小程序端 web-view 本身受微信域名白名单限制，前端校验是双保险
- H5 端 iframe 加载第三方页面需要注意安全

---

# 🟠 领域二：支付 & 核心业务正确性（4 个）

---

## P1 - 支付重复提交防护修复

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 1h |
| **影响文件** | `utils/payment.js` |

### 问题
`executePayment` 函数中的防重复提交逻辑（`payment.js:421`）：
```javascript
if (currentState && currentState.status === PAY_REQUEST_STATUS.PENDING && (now - currentState.timestamp < 2 * 1000))
```
注释说"5 分钟内阻止重复提交"，但实际代码只有 **2 秒**。用户拉起微信支付后 2 秒再点一次就可以绕过防护，可能导致重复支付请求。

### 修改方案
将 2 秒调整为更合理的时间，且改为**支付 SDK 调用期间一直保持 pending 状态**，直到支付结果返回或超时。

**具体策略：**
1. 提交支付请求后设为 PENDING
2. 调用支付 SDK（微信/支付宝）期间保持 PENDING
3. 支付结果返回（成功/失败/取消）后清除 PENDING 状态
4. 设置最大超时时间 5 分钟（兜底）

### 核心改动
1. `payment.js` — 修复防重复提交时间窗口
2. 在支付 SDK 调用的 resolve/reject 中统一清理 pending 状态

### 注意事项
- 钱包支付走后端确认，不存在 SDK 调用超时问题，但也应有防重复
- 用户点取消支付后应立即清除 pending 状态

---

## P2 - 钱包支付假实现清理

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 0.5h |
| **影响文件** | `utils/payment.js` |

### 问题
`walletPay` 函数（`payment.js:323-330`）是一个假实现，直接 `resolve({ success: true })`。虽然实际钱包支付走的是后端确认逻辑（不经过这个函数），但保留此函数可能导致未来开发者误用。

### 修改方案
删除 `walletPay` 函数。钱包支付的真实流程是：`submitPayOrder` → 后端直接扣款 → `confirmPayOrderPaid` 确认状态，完全不依赖前端 SDK 调用。

### 核心改动
1. 删除 `walletPay` 函数
2. 在注释中明确说明钱包支付的完整流程（给后续维护者看）

### 注意事项
- 确认 `executePayment` 中确实没有调用 `walletPay`，删除后不影响现有逻辑

---

## P3 - 上传文件 JSON.parse 容错

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 0.5h |
| **影响文件** | `utils/upload.js` |

### 问题
`upload.js:45` 中直接 `JSON.parse(res.data)`，没有 try-catch。如果上传接口返回非 JSON（如 502 错误页面、纯文本错误信息），会抛出未捕获的异常，导致页面崩溃。

### 修改方案
用 try-catch 包裹 JSON.parse，解析失败时 reject 友好的错误信息。

同时参照 `request.js` 的错误处理模式，保持一致性。

### 核心改动
1. `upload.js` success 回调中增加 try-catch
2. 解析失败时返回结构化错误 `{ code: -1, msg: '上传响应解析失败' }`

---

## P4 - 请求 URL 拼接逻辑修复

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 0.5h |
| **影响文件** | `utils/request.js` |

### 问题
`request.js:141`：
```javascript
url: config.baseUrl || baseUrl + config.url,
```
由于 `||` 运算符优先级高于 `+`，实际等价于：
```javascript
url: config.baseUrl || (baseUrl + config.url)
```

**两种可能的设计意图：**
- A：`config.baseUrl` 存在时，完全忽略 `baseUrl` 和 `config.url`，直接使用 `config.baseUrl` 作为完整 URL
- B：`config.baseUrl` 存在时覆盖默认 `baseUrl`，但仍然拼接 `config.url`，即 `(config.baseUrl || baseUrl) + config.url`

需要确认哪种是正确的。从语义看，**方案 B 更合理**（覆盖 baseUrl 而不是整个 URL）。

### 修改方案
1. 确认设计意图（大概率是方案 B）
2. 添加括号明确优先级：`url: (config.baseUrl || baseUrl) + config.url`
3. 检查所有调用方是否有传 `config.baseUrl` 的场景，确认修改不影响现有逻辑

### 核心改动
1. `request.js` — 修复 URL 拼接表达式，加括号明确意图

---

# 🟢 领域三：Vue & 状态管理规范（5 个）

---

## V1 - 修复 isShowingNotification 未定义 bug

| 属性 | 值 |
|------|-----|
| **严重度** | 🔴 CRITICAL |
| **预估工时** | 0.5h |
| **影响文件** | `pages/home/index.vue` |

### 问题
`pages/home/index.vue:606` 使用了 `isShowingNotification.value`，但这个变量在 script 中**从未定义**。访问 `.value` 会抛出运行时错误，导致首页通知弹窗功能崩溃。

实际控制弹窗显示的 ref 是 `showNotifyModal`。

### 修改方案
将 `isShowingNotification.value` 改为 `showNotifyModal.value`。

### 核心改动
1. `pages/home/index.vue` — 第 606 行变量名修正

---

## V2 - Pinia state 禁止直接修改

| 属性 | 值 |
|------|-----|
| **严重度** | 🔴 CRITICAL |
| **预估工时** | 2h |
| **影响文件** | `App.vue`、`store/modules/user.js` |

### 问题
`App.vue:310-316` 的 `restoreUserState()` 函数直接给 Pinia store 的 ref 赋值：
```javascript
userStore.accessToken = getAccessToken()
userStore.refreshToken = getRefreshToken()
userStore.expiresTime = getExpiresTime()
userStore.userId = uni.getStorageSync('auth_user_id') || ''
// ...
```

虽然 Pinia 允许直接修改 state，但这违反了单向数据流原则，状态变更不可追踪，devtools 中无法记录变更历史。

### 修改方案
在 user store 中添加 `restoreFromStorage()` action，集中处理从本地存储恢复状态的逻辑。App.vue 中只调用这个 action。

同时检查项目中其他直接修改 store state 的地方，统一改为通过 action 修改。

### 核心改动
1. `store/modules/user.js` — 新增 `restoreFromStorage` action
2. `App.vue` — `restoreUserState()` 改为调用 `userStore.restoreFromStorage()`
3. 全局检查其他直接修改 store state 的地方

### 注意事项
- Pinia 的设计理念其实支持直接修改 state（与 Vuex 不同），但在团队项目中通过 action 更规范
- 此条主要是规范性修复，不影响功能运行

---

## V3 - v-for key 全部替换为业务 ID

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **影响文件** | 多个 Vue 文件 |

### 问题
多处 `v-for` 使用数组索引 `index` 作为 `:key`：
- `pages/home/index.vue:30` — bannerList
- `subpkg/coach/detail.vue:42` — tags
- `subpkg/coach/detail.vue:62` — services
- `subpkg/coach/detail.vue:167,206` — reviewList
- `subpkg/order/detail.vue:145` — tags
- 其他页面...

当列表数据发生变化（排序、插入、删除）时，使用 index 作为 key 会导致 Vue 错误地复用 DOM 元素，造成状态错乱和性能问题。

### 修改方案
使用数据的唯一 ID 作为 key：
- 有 id 字段的用 `:key="item.id"`
- 没有 id 的简单标签列表，用内容本身 `:key="tag"`
- 实在没有唯一标识的（如时间选择器的列），保留 index 但加注释说明

### 核心改动
1. 全局搜索 `v-for.*:key="index"` 或 `:key="i"`
2. 逐个替换为业务 ID 或内容值

---

## V4 - Store action 去 Promise 包装

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **影响文件** | `store/modules/user.js` |

### 问题
`store/modules/user.js` 中所有 action 都用 `new Promise` 包裹已有的 Promise 调用，这是标准的反模式（Promise constructor anti-pattern）。

示例：
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

完全等价于：
```javascript
const sendCodeAction = (mobile, scene = 1, options = {}) => {
  return sendSmsCode({ mobile, scene, ...options }).then(res => res.data)
}
```

**影响的 action：** `sendCodeAction`、`smsLoginAction`、`passwordLoginAction`、`logOutAction`、`resetPasswordAction`、`updatePasswordAction`、`updateMobileAction` 等全部。

### 修改方案
全部改用 `async/await` 写法，代码更清晰且错误处理更一致。

同时修复 `smsLoginAction` 中的深层 Promise 嵌套（先 `validateSmsCode` 再 `smsLogin` 的嵌套结构）。

### 核心改动
1. `store/modules/user.js` — 所有 action 改为 async/await
2. 保持调用签名和返回值不变（向后兼容）

---

## V5 - 用 Pinia 替代 Storage 跨页传参

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 4h |
| **影响文件** | 新增 `store/modules/booking.js`、多个预约流程页面 |

### 问题
项目使用 `uni.setStorageSync` 在页面之间传递大型对象（教练信息、订单数据、球厅信息等）：
- `selectedCoach` — 教练列表 → 教练详情 → 预约确认
- `createdOrderData` — 预约确认 → 支付成功
- `reselectParams` — 球厅选择回传
- 等等...

**问题：**
1. 数据流不清晰，不符合单向数据流
2. 进程被杀后下次启动可能读到旧数据，导致 bug
3. Storage 有大小限制
4. `createdOrderData` 存完立即 remove，但如果页面中间崩溃会残留

### 修改方案
创建 `bookingStore`（Pinia）管理预约流程中的所有临时数据。

**Store 数据结构：**
```javascript
{
  selectedCoach: null,     // 选中的教练信息
  selectedVenue: null,     // 选中的球厅信息
  selectedTable: null,     // 选中的球桌
  createdOrder: null,      // 刚创建的订单（支付成功页用）
  bookingParams: null,     // 预约参数（时间、时长等）
}
```

**涉及的页面改造：**
- `pages/coach/list.vue` — 存入 selectedCoach
- `subpkg/coach/detail.vue` — 读取/更新 selectedCoach
- `subpkg/booking/hall.vue` — 存入 selectedVenue
- `subpkg/booking/confirm.vue` — 读取所有数据，存入 createdOrder
- `subpkg/booking/pay-success.vue` — 读取 createdOrder

### 核心改动
1. 新增 `store/modules/booking.js` — 预约流程状态管理
2. 预约流程相关页面：Storage 读写改为 store 读写
3. 保留 Storage 作为降级方案（如刷新页面后 store 丢失时从 Storage 恢复）

### 注意事项
- 改动涉及页面较多，需要仔细测试完整的预约流程
- 建议保留 Storage 作为兜底（store 初始化时从 Storage 恢复），防止页面刷新丢失数据

---

# 🔵 领域四：代码质量 & 可维护性（4 个）

---

## Q1 - 定时器/事件监听器统一管理

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 3h |
| **影响文件** | 新增 composables、订单详情页、登录页等 |

### 问题
多处定时器和事件监听器管理混乱，容易泄漏：

1. **订单详情页**（`subpkg/order/detail.vue`）— 至少 5 个定时器分散管理：
   - 支付倒计时
   - 加时倒计时
   - 状态轮询
   - 计时状态轮询
   - 本地计时更新

2. **登录/重置密码页** — 倒计时定时器在页面隐藏时不清除

3. **订单列表页**（`pages/order/list.vue:654-656`）— `uni.$on('orderEvaluated')` 未在 `onUnload` 中移除

4. **首页** — WebSocket 订阅未在卸载时取消

### 修改方案
1. **新增 `composables/useInterval.js`** — 自动清理的定时器 composable（在 `onUnmounted`/`onUnload` 时自动清除）
2. **新增 `composables/useGlobalEvent.js`** — 自动清理的全局事件监听器（`uni.$on`/`uni.$off`）
3. 订单详情页：建立 timers 数组统一清理，或改用 useInterval
4. 订单列表页：添加 `uni.$off` 清理
5. 首页：添加 WebSocket 订阅取消

### 核心改动
1. 新增 `composables/useInterval.js`
2. 新增 `composables/useGlobalEvent.js`
3. 各页面逐步替换为统一管理方式

---

## Q2 - 统一工具函数（时间/金额/距离格式化）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 3h |
| **影响文件** | 新增 `utils/format.js`、多个页面 |

### 问题
时间格式化、金额格式化、距离格式化等工具函数在多个页面中重复定义，逻辑略有差异：

- `formatTime` / `formatDate` — 至少在 4+ 个页面重复定义
- `formatAmount` / `formatPrice` — 金额格式化
- `formatDistance` — 距离格式化
- `formatDuration` — 时长格式化
- 等等...

**问题：**
1. 维护成本高：修改一个格式要改多处
2. 容易不一致：有的用 `年-月-日`，有的用 `月-日`
3. 没有集中测试

### 修改方案
建立统一的 `utils/format.js`，所有页面引用：

**函数清单（暂定）：**
- `formatDate(date, format = 'YYYY-MM-DD')` — 日期格式化
- `formatDateTime(date)` — 日期时间格式化 `YYYY-MM-DD HH:mm`
- `formatTime(date)` — 时间格式化 `HH:mm`
- `formatCountdown(seconds)` — 倒计时格式化 `HH:mm:ss`
- `formatAmount(amount, decimals = 2)` — 金额格式化
- `formatDistance(meters)` — 距离格式化（<1km 显示米，>=1km 显示 km）
- `formatDuration(minutes)` — 时长格式化

### 核心改动
1. 新增 `utils/format.js` — 收集并统一所有格式化函数
2. 逐个页面替换：把本地定义的格式化函数改为引用 `utils/format.js`
3. 删除重复的本地定义

### 注意事项
- 需要仔细核对每个页面的格式要求是否一致，避免替换后显示格式变了
- 有的页面可能有特殊格式需求，应保留在本地或通过参数支持

---

## Q3 - 重复代码消除（权限弹窗 + openAppSetting）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 2h |
| **影响文件** | `utils/location.js`、`utils/photo.js`、`utils/call.js`、`utils/platform.js` |

### 问题
1. **权限用途说明弹窗**在三个文件中几乎相同的实现：
   - `utils/location.js:17-53` — 定位权限
   - `utils/photo.js:9-52, 57-99` — 相机/相册权限
   - `utils/call.js:10-46` — 电话权限
   
   都是：检查 storage 中的同意标记 → 显示 showModal → 存储同意状态。只有文案和 storage key 不同。

2. **打开应用设置页面**在三个地方重复实现：
   - `utils/location.js:65-99`
   - `utils/photo.js:259-292`
   - `utils/platform.js:157-188`（`openPermissionSettings`）

### 修改方案
1. **提取 `showPurposeModal(key, config)`** — 通用的权限用途说明弹窗
2. **统一使用 `utils/platform.js` 中的 `openPermissionSettings`**，删除其他两处重复实现

### 核心改动
1. `utils/platform.js` — 新增 `showPermissionPurposeModal` 通用函数
2. `utils/location.js` — 改用通用函数
3. `utils/photo.js` — 改用通用函数 + 统一 openPermissionSettings
4. `utils/call.js` — 改用通用函数

---

## Q4 - 魔法数字提取为常量

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 2h |
| **影响文件** | 多个文件 |

### 问题
大量魔法数字散布在代码中，没有命名和注释说明含义：

| 数字 | 位置 | 含义（推测） |
|------|------|-------------|
| `24 * 60 * 60 * 1000` | payment.js:39 | 24 小时 |
| `2 * 1000` | payment.js:421 | 2 秒（防重复提交，应该是 2 分钟以上） |
| `30 * 1000` | payment.js:426 | 30 秒 |
| `maxAttempts = 10, interval = 2000` | payment.js:554 | 轮询参数 |
| `interval = 2500, maxAttempts = 30` | payment.js:605 | 轮询参数 |
| `maxAttempts = 5, intervalMs = 3000` | jpush.js:134 | 推送初始化重试 |
| `timeout = 15000` | location.js:161 | 定位超时 |
| `heartbeatInterval = 30000` | websocket.js:22 | WebSocket 心跳间隔 |
| `reconnectDelays = [1, 2, 5, 10, 30]` | websocket.js:12 | 重连延迟（秒） |
| `POLLING_INTERVAL = 8000` | order/detail.vue | 订单状态轮询间隔 |
| `3000` / `500` | App.vue:133,153 | 去抖/延迟时间 |

### 修改方案
1. 将时间间隔、超时时间、重试参数等提取为命名常量
2. 放在文件顶部或单独的 constants 文件中
3. 添加注释说明数值的业务含义

**建议：**
- 通用常量放 `utils/constants.js`
- 模块内常量放各自文件顶部

### 核心改动
1. 新增 `utils/constants.js` — 通用常量
2. 各模块提取本地常量到文件顶部

---

# 🟡 领域五：性能优化（5 个）

---

## Perf1 - 删除死代码 + 无用依赖

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **收益** | 包体积减少 ~200KB+ |
| **影响文件** | static/scss/、uni_modules/、多个 Vue 文件 |

### 问题
1. **ColorUI 样式库未使用**（`static/scss/colorui.css` — 5142 行，约 136KB）— 全局引入但项目中完全没有使用
2. **大量未使用的 uni-ui 组件**（43 个组件中实际只用了约 7-8 个）
3. **注释掉的代码块**（多处 Vue 文件中整块 HTML/JS 被注释）
4. **开发截图残留**（`static/images/ScreenShot_2026-08-29_104127_023.png` — 72KB）
5. **未使用的工具模块**（`utils/storage.js` 等）

### 修改方案
1. **删除 ColorUI**：移除 `index.scss` 中的引入 + 删除 `colorui.css` 文件
2. **清理未使用的 uni-ui 组件**：删除 30+ 个未使用的组件，保留实际使用的（uni-icons、uni-load-more、uni-data-picker、uni-popup、uni-section、uni-card、uni-badge 等）
3. **删除注释代码**：清理所有被注释掉的代码块（Git 历史中有记录）
4. **删除开发截图**：删除 `ScreenShot_2026-08-29_104127_023.png`
5. **清理未使用模块**：确认并删除 `utils/storage.js`、`validate.js` 中的 `validUsername` 等遗留代码

### 核心改动
1. `static/scss/index.scss` — 移除 colorui 引入
2. 删除 `static/scss/colorui.css`
3. 删除未使用的 uni_modules 组件（需逐个确认）
4. 删除 `static/images/ScreenShot_*.png`
5. 各页面删除注释代码块

### 注意事项
- 删除 uni-ui 组件前务必确认没有被引用（全局搜索组件名）
- 有些组件可能通过组件自动引入方式使用，需要仔细确认

---

## Perf2 - 图片优化（压缩 + 占位图替换 + 懒加载）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 3h |
| **收益** | 包体积减少 ~500KB，图片加载加速 |
| **影响文件** | static/images/、多个 Vue 文件 |

### 问题
1. **大尺寸图片未压缩**：
   - `qrImage.png` — 232KB
   - banner 图片 — 120-150KB/张
   - `profile.jpg` — 80KB

2. **使用外部占位图服务 picsum.photos**：
   - 首页、教练卡片、教练详情、我的页面等多处
   - 加载慢、不稳定、有安全风险

3. **图片无懒加载**：长列表中屏幕外的图片也立即加载

### 修改方案
1. **图片压缩**：
   - 用 tinypng 或类似工具压缩所有 PNG/JPG
   - 目标：banner 图 50-80KB，二维码 < 50KB，头像 < 30KB
   - 考虑转换为 WebP 格式（小程序和 App 均支持）

2. **替换占位图**：
   - 所有 `picsum.photos` 和 `via.placeholder.com` 替换为本地默认图
   - 头像用 `/static/default-avatar.png`
   - 其他场景用合适的本地占位图

3. **图片懒加载**：
   - 列表页的 `<image>` 添加 `lazy-load` 属性（小程序支持）
   - 长列表图片延迟加载

### 核心改动
1. 压缩 `static/images/` 下所有大图
2. 全局搜索 `picsum.photos` / `via.placeholder.com` 替换为本地默认图
3. 列表页面图片添加 `lazy-load` 属性

---

## Perf3 - GET 请求缓存机制

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 3h |
| **收益** | 重复请求减少 50%+ |
| **影响文件** | `utils/request.js` |

### 问题
请求封装中完全没有客户端缓存策略。相同的 GET 请求（如获取教练列表、获取配置、获取字典数据）每次都会重新发送。

虽然小程序端启用了 `enableCache: true`（HTTP 缓存），但这只是浏览器/小程序的 HTTP 缓存，对于 POST 请求和更细粒度的缓存控制完全缺失。

### 修改方案
在 `request.js` 中添加内存缓存机制：

**缓存策略：**
- 只缓存 GET 请求（POST 不缓存）
- 默认缓存时间 5 分钟
- 通过 `config.cache = false` 可以单独禁用某个请求的缓存
- 缓存 key = URL + 排序后的 params JSON

**缓存管理：**
- 使用 Map 存储（内存缓存，页面刷新后清空）
- 设置最大缓存条目数（如 100 条），防止内存泄漏
- 提供 `clearCache()` 方法（如退出登录时清空）

### 核心改动
1. `utils/request.js` — 添加缓存逻辑（请求前查缓存，响应后存缓存）
2. 暴露 `clearRequestCache()` 方法（登出时调用）

### 注意事项
- 缓存只适合不频繁变化的数据（配置、字典、列表等）
- 对于用户特定的数据（如订单列表），需要考虑缓存 key 中包含用户标识
- 数据更新后需要考虑缓存失效策略（主动清除 or 依赖 TTL）

---

## Perf4 - onShow 重复加载优化

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 3h |
| **收益** | 减少不必要的网络请求，用户体验更流畅 |
| **影响文件** | `pages/home/index.vue`、`subpkg/coach/detail.vue`、`pages/mine/index.vue` |

### 问题
多个页面在 `onShow` 中无条件重新加载全部数据：
- **首页**（`pages/home/index.vue:593-609`）：每次显示都重新加载 banner + 热门教练 + 新人教练
- **教练详情页**（`subpkg/coach/detail.vue:910-914`）：onShow 和 onMounted 都会调用 `loadCoachData()`，首次进入会请求两次
- **我的页面**（`pages/mine/index.vue:546-548`）：每次显示都加载用户信息 + 订单 + 通知未读数

**问题：**
1. 用户体验差：每次返回都看到加载闪烁
2. 浪费流量和服务器资源
3. coach/detail 首次进入请求两次（重复请求）

### 修改方案
1. **增加缓存机制**：设置数据缓存时间（如 5 分钟），缓存有效期内不重新请求
2. **分级刷新**：
   - onLoad / onMounted：加载全部数据
   - onShow：只刷新状态类数据（如收藏状态、未读数），不刷新列表
3. **教练详情页**：移除 onShow 中的全量加载，改为只刷新收藏状态等轻量数据

### 核心改动
1. 首页：onShow 中增加缓存时间判断，或只刷新关键数据
2. 教练详情页：onShow 中只刷新收藏/在线状态，不重新加载全部教练数据
3. 我的页面：onShow 中只刷新用户信息和未读数，订单列表改为下拉刷新时才加载

---

## Perf5 - "我的"页面订单加载优化

| 属性 | 值 |
|------|-----|
| **严重度** | 🟠 HIGH |
| **预估工时** | 2h |
| **收益** | 减少 5-7 个并发请求 |
| **影响文件** | `pages/mine/index.vue` |

### 问题
`pages/mine/index.vue:373-397` 的 `loadOrders` 函数一次性并行请求 5 个状态的订单列表，每个状态请求 100 条：
```javascript
const promises = Object.keys(TAB_TO_STATUSES).map(async (tab) => {
  const statuses = TAB_TO_STATUSES[tab]
  const list = []
  for (const status of statuses) {
    const res = await getOrderList({ status, pageNo: 1, pageSize: 100 })
    // ...
  }
})
await Promise.all(promises)
```

但实际上每个 tab 只显示**前 3 条**，请求 100 条完全没必要。

### 修改方案
1. **减少请求数量**：每个 tab 只请求 3-5 条（足够展示）
2. **或者懒加载**：只加载当前显示的 tab，点击其他 tab 时才加载对应状态
3. **或者复用订单列表页的缓存**（如果实现了 Perf3 请求缓存）

推荐方案：pageSize 改为 5，既满足展示需求，又大幅减少数据传输量。

### 核心改动
1. `pages/mine/index.vue` — `loadOrders` 中 pageSize 从 100 改为 5
2. 如果接口不支持每页 3 条这样的小数，用 10 条也比 100 条好很多

---

# ⚪ 领域六：大组件重构（3 个，可选）

---

## R1 - confirm.vue 拆分（1955 行）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 6h |
| **影响文件** | `subpkg/booking/confirm.vue` |

### 问题
`subpkg/booking/confirm.vue` 单文件 1955 行，包含了：
- 订单确认主逻辑
- 时间选择器（手动实现 picker-view）
- 城市选择器（两级联动）
- 地点搜索选择器
- 支付方式选择
- 倒计时逻辑
- 钱包余额查询

职责过多，可读性差，维护成本高。

### 修改方案
拆分为以下组件和 composables：

**子组件：**
- `TimePickerPopup.vue` — 时间选择器弹窗
- `CityPickerPopup.vue` — 城市选择器弹窗
- `PlaceSearchPopup.vue` — 地点搜索弹窗
- `PaymentMethodPicker.vue` — 支付方式选择
- `BookingServiceCard.vue` — 服务项目卡片

**Composables：**
- `useOrderCreate.js` — 订单创建逻辑
- `useBookingTime.js` — 预约时间选择逻辑
- `usePayment.js` — 支付逻辑

**目标：** 主文件 `confirm.vue` < 600 行

### 注意事项
- 重构风险较高（涉及完整预约流程），需要充分测试
- 建议拆一个测试一个，逐步推进
- 拆分出的组件可复用于其他页面（如现场订单等）

---

## R2 - order/detail.vue 拆分（2442 行）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 8h |
| **影响文件** | `subpkg/order/detail.vue` |

### 问题
订单详情页 2442 行，是项目中最大的文件。包含订单状态展示、服务信息、费用明细、倒计时、轮询、加时、评价入口、联系教练等众多功能。

### 修改方案
按功能模块拆分：

**子组件：**
- `OrderHeader.vue` — 订单状态头部（状态、倒计时）
- `OrderServiceInfo.vue` — 服务信息（教练、球厅、时间）
- `OrderFeeDetail.vue` — 费用明细
- `OrderCoachCard.vue` — 教练信息卡片
- `OrderActionBar.vue` — 底部操作栏
- `OrderAddTimePopup.vue` — 加时弹窗

**Composables：**
- `useOrderDetail.js` — 订单详情加载和状态管理
- `useOrderPolling.js` — 订单状态轮询
- `useCountdown.js` — 倒计时管理
- `useAddTime.js` — 加时逻辑

**目标：** 主文件 < 700 行

---

## R3 - payment.js 拆分（803 行）

| 属性 | 值 |
|------|-----|
| **严重度** | 🟡 MEDIUM |
| **预估工时** | 4h |
| **影响文件** | `utils/payment.js` |

### 问题
`utils/payment.js` 803 行，包含了支付的所有逻辑，职责过多。

### 修改方案
拆分为以下模块：

```
utils/payment/
├── index.js          # 主入口，导出 executePayment
├── constants.js      # 常量（支付渠道、状态、超时时间）
├── channels.js       # 各平台支付函数（微信、支付宝、钱包）
├── poller.js         # 支付状态轮询器
├── onsite.js         # 现场订单支付
└── guard.js          # 防重复提交逻辑
```

**目标：** 每个文件 < 300 行，职责单一清晰。

---

# 总览汇总表

| 编号 | 优化包 | 严重度 | 工时 | 领域 |
|-----|--------|--------|------|------|
| S1 | 路由权限拦截修复 | 🔴 CRITICAL | 0.5h | 安全 |
| S2 | Token 加密存储 | 🟠 HIGH | 2h | 安全 |
| S3 | Token 传递方式优化 | 🟠 HIGH | 1h | 安全 |
| S4 | rich-text XSS 过滤 | 🟠 HIGH | 2h | 安全 |
| S5 | 审核白名单移至服务端 | 🟠 HIGH | 2h | 安全 |
| S6 | 生产环境清除敏感日志 | 🟠 HIGH | 1h | 安全 |
| S7 | WebView URL 白名单校验 | 🟡 MEDIUM | 1h | 安全 |
| P1 | 支付重复提交防护修复 | 🟠 HIGH | 1h | 支付 |
| P2 | 钱包支付假实现清理 | 🟡 MEDIUM | 0.5h | 支付 |
| P3 | 上传文件 JSON.parse 容错 | 🟠 HIGH | 0.5h | 支付 |
| P4 | 请求 URL 拼接逻辑修复 | 🟠 HIGH | 0.5h | 支付 |
| V1 | 修复 isShowingNotification 未定义 bug | 🔴 CRITICAL | 0.5h | Vue |
| V2 | Pinia state 禁止直接修改 | 🔴 CRITICAL | 2h | Vue |
| V3 | v-for key 全部替换为业务 ID | 🟠 HIGH | 2h | Vue |
| V4 | Store action 去 Promise 包装 | 🟠 HIGH | 2h | Vue |
| V5 | 用 Pinia 替代 Storage 跨页传参 | 🟠 HIGH | 4h | Vue |
| Q1 | 定时器/事件监听器统一管理 | 🟠 HIGH | 3h | 质量 |
| Q2 | 统一工具函数（时间/金额/距离） | 🟡 MEDIUM | 3h | 质量 |
| Q3 | 重复代码消除（权限弹窗 + openAppSetting） | 🟡 MEDIUM | 2h | 质量 |
| Q4 | 魔法数字提取为常量 | 🟡 MEDIUM | 2h | 质量 |
| Perf1 | 删除死代码 + 无用依赖 | 🟠 HIGH | 2h | 性能 |
| Perf2 | 图片优化（压缩 + 占位图 + 懒加载） | 🟠 HIGH | 3h | 性能 |
| Perf3 | GET 请求缓存机制 | 🟡 MEDIUM | 3h | 性能 |
| Perf4 | onShow 重复加载优化 | 🟡 MEDIUM | 3h | 性能 |
| Perf5 | "我的"页面订单加载优化 | 🟠 HIGH | 2h | 性能 |
| R1 | confirm.vue 拆分（1955 行） | 🟡 MEDIUM | 6h | 重构 |
| R2 | order/detail.vue 拆分（2442 行） | 🟡 MEDIUM | 8h | 重构 |
| R3 | payment.js 拆分（803 行） | 🟡 MEDIUM | 4h | 重构 |
| **合计** | | | **63.5h** | |

---

> 请逐个或批量告诉我哪些要做、哪些不做，确认后我再开始实施。
