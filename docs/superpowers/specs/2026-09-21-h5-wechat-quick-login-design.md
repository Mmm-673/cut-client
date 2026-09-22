# H5 微信快捷登录 + 预约手机号绑定设计文档

## 背景

当前项目（初球 H5）登录页仅支持手机号验证码登录和密码登录两种方式。为了提升微信浏览器内用户的登录转化率，需要新增「微信快捷登录」功能，用户在微信内打开 H5 页面时，可一键通过微信公众号授权完成登录。

同时，由于微信快捷登录的新用户可能没有手机号，需要在预约下单环节校验并引导绑定手机号，保证订单能正常联系到用户。

后端接口已就绪：
- `GET /app-api/member/auth/social-auth-redirect` — 获取微信公众号授权跳转 URL（`type=31` 对应微信公众号 H5）
**- `POST /app-api/member/auth/social-login` — 用微信返回的 code 换取登录 token**
- `GET /app-api/billiard/user/get` — 获取当前用户信息（含 mobile）
- `POST /app-api/billiard/user/send-update-mobile-sms` — 发送绑定/修改手机号验证码
- `POST /app-api/billiard/user/update-mobile` — 绑定/修改手机号

## 目标

- H5 微信浏览器内的登录页展示「微信快捷登录」按钮
- 用户点击后跳转微信公众号授权页，授权完成后自动登录并进入首页
- 已绑定微信的用户直接登录；未绑定的用户自动创建新账号（无手机号）
- 微信登录不强制绑定手机号，用户可直接浏览
- 预约下单时校验手机号，无手机号则弹出绑定弹框，绑完自动继续下单
- 与现有的「支付场景微信绑定」逻辑解耦，互不干扰

## 非目标

- 微信小程序端微信登录（本次不做）
- App 端微信登录（本次不做）
- 登录后立即强制绑定手机号（在预约环节才校验）
- 账号合并（手机号已被其他账号绑定时拒绝绑定，不做合并）

---

## 整体架构

```
┌─────────────────┐     点击微信登录      ┌─────────────────────┐
│  pages/login    │ ───────────────────▶ │ utils/wechatAuth.js │
│  /index.vue     │ ◀─────────────────── │  - launchWechatLogin│
│  (微信按钮)      │     跳转授权URL        │  - handleWxLoginCallback│
└─────────────────┘                      └──────────┬──────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │ api/auth.js  │
                                              │  + socialLogin│
                                              └──────┬───────┘
                                                     │
                                                     ▼
                                              后端 /social-login
                                                     │
                        ┌────────────────────────────┘
                        │ 返回 token
                        ▼
              ┌───────────────────┐
              │ store/user.js     │
              │  + socialLogin    │
              │  + fetchUserInfo  │
              │  + updateMobile   │
              └───────────────────┘

┌────────────────────────────┐
│ 预约确认页                   │
│  (点击确认下单时)             │
│   判断 mobile 为空？         │
│        │                    │
│        ▼                    │
│  ┌──────────────────┐      │
│  │  绑定手机号弹框     │      │
│  │  (底部半屏弹层)    │      │
│  └──────────────────┘      │
│        │ 绑定成功           │
│        ▼                    │
│   自动继续提交订单           │
└────────────────────────────┘
```

---

## 模块一：微信快捷登录

### 1.1 数据流程

#### 流程 1：发起授权

1. 用户在 H5 微信浏览器内打开登录页
2. 登录页检测到 `isWechatBrowser()` → 渲染微信快捷登录按钮
3. 用户点击按钮 → 校验是否勾选用户协议
4. 调用 `wechatAuth.launchWechatLogin(redirectUri)`：
   - 生成随机 `state`（防 CSRF，16 位随机字符串）
   - 从 URL 参数或 storage 读取登录后跳转目标 `redirectUrl`
   - 将 `{ state, redirectUrl }` 存入 `uni.setStorageSync('wx_login_context')`
   - 调用 `getSocialAuthRedirect({ type: 31, redirectUri })` 获取微信授权 URL
   - `window.location.href` 跳转到微信授权页
5. 用户在微信授权页点击「同意」

#### 流程 2：回调登录

微信回调到 `redirectUri`（登录页），URL 格式：`?code=CODE&state=STATE`

在 `App.vue` 的 `onLaunch` 中（H5 环境）：
1. 解析 URL 查询参数，获取 `code` 和 `state`
2. 从 storage 读取 `wx_login_context`
3. 校验 `state` 是否一致，不一致则清除 context 并提示「授权状态异常，请重试」
4. 调用 `userStore.socialLogin({ type: 31, code, state })`
5. Store 调用 `socialLogin` API → 后端返回 `{ accessToken, refreshToken, ...userInfo }`
6. `setLoginInfo(data)` 写入登录态（Pinia + 本地存储）
7. 清除 `wx_login_context`
8. 读取 context 中的 `redirectUrl`，有则跳转，无则跳首页
9. 登录后后置处理：绑定推送别名、深链跳转等（复用现有逻辑）

#### 流程 3：与支付绑定回调的区分

`App.vue` 中已有 `handleWxPayBindCallback`（支付场景微信绑定）。新增登录回调后，检测逻辑：

```
URL 中有 code + state？
  ├─ 有 wx_pay_bind_context → 走支付绑定续付流程
  ├─ 有 wx_login_context    → 走微信快捷登录流程
  └─ 都没有                 → 不处理
```

两个 context key 不同，不会混淆。

### 1.2 模块变更明细

#### 新增 `api/auth.js` 接口

```javascript
// 微信快捷登录（code 换 token）
export function socialLogin(data) {
  return request({
    url: '/app-api/member/auth/social-login',
    method: 'post',
    headers: { isToken: false },
    data: data
  })
}
```

#### 新增 `api/billiard/user.js` 接口（已有则复用）

- `getUserInfo()` — `GET /app-api/billiard/user/get`，获取当前用户信息
- `sendUpdateMobileSms(mobile)` — `POST /app-api/billiard/user/send-update-mobile-sms`，发送绑定手机号验证码
- `updateMobile({ mobile, code })` — `POST /app-api/billiard/user/update-mobile`，绑定/修改手机号

> 以上三个接口都需要 token（携带 Authorization header）。

#### 新增 `utils/wechatAuth.js` 模块

```javascript
const WX_LOGIN_CONTEXT_KEY = 'wx_login_context'
const SOCIAL_TYPE_WECHAT_H5 = 31

// 发起微信公众号授权登录
export function launchWechatLogin(redirectUri)

// 检测并处理微信登录回调（App.vue onLaunch 调用）
export function handleWxLoginCallback()

// 内部工具
function generateState()          // 生成 16 位随机字符串
function saveLoginContext(ctx)    // 存入 storage
function getLoginContext()        // 从 storage 读取
function clearLoginContext()      // 清除
```

#### 新增 `store/modules/user.js` action

| action | 说明 |
|--------|------|
| `socialLogin(loginData)` | 微信快捷登录：调用 socialLogin API，setLoginInfo，绑定推送 |
| `fetchUserInfo()` | 获取用户信息：调用 getUserInfo，更新 state 中的 nickname/avatar/mobile |
| `sendUpdateMobileSms(mobile)` | 发送绑定手机号验证码 |
| `updateMobile({ mobile, code })` | 绑定手机号：调用 API，成功后更新 state.mobile |

> 注意：`fetchUserInfo` 可用于登录后补充用户信息，以及绑定手机号后刷新用户信息。

#### 修改 `pages/login/index.vue`

- 引入 `isWechatBrowser` 和 `launchWechatLogin`
- 在登录按钮下方、游客模式上方，条件渲染微信快捷登录按钮
  - 条件：`#ifdef H5` 且 `isWechatBrowser()`
- 按钮样式：微信绿（`#07C160`）背景 + 微信图标 + 白色文字
- 点击逻辑：先校验是否勾选协议 → 调用 `launchWechatLogin`
- 按钮 loading 状态防止重复点击

#### 修改 `App.vue`

- 引入 `handleWxLoginCallback`
- 在 `onLaunch` 的 H5 分支中，`handleWxPayBindCallback` 之后调用 `handleWxLoginCallback`
- 两个回调内部自行判断是否匹配，互不干扰

### 1.3 UI 设计

登录页新增按钮位置：

```
┌─────────────────────────────┐
│         Logo + slogan        │
├─────────────────────────────┤
│  [验证码登录]  [密码登录]    │
│                              │
│  手机号: [____________]     │
│  验证码: [______] [获取]    │
│                              │
│      [ 登  录 ]             │
│                              │
│   🟢  微信快捷登录           │  ← 新增
│                              │
│  游客模式 / 返回首页         │
│                              │
│  ☐ 我已阅读并同意...         │
└─────────────────────────────┘
```

### 1.4 错误处理（登录模块）

| 场景 | 处理方式 |
|------|---------|
| 用户微信授权页点「取消」 | 微信回调带 `errcode` 或无 `code`，检测到后 toast「已取消授权」，清除 context |
| state 校验不匹配 | 清除 context，toast「授权状态异常，请重试」 |
| `/social-login` 返回业务错误 | toast 错误消息，清除 context，停留在登录页 |
| code 已过期 / 无效 | toast「授权已过期，请重新登录」，清除 context |
| 网络错误 | toast「网络异常，请重试」，清除 context |
| 未勾选协议就点微信登录 | toast「请先阅读并同意用户协议和隐私政策」 |

---

## 模块二：预约下单手机号绑定弹框

### 2.1 触发时机

用户在**预约确认页**点击「确认下单 / 立即预约」按钮时：
1. 先检查 `userStore.mobile` 是否为空
2. 为空 → 弹出绑定手机号弹框，不提交订单
3. 不为空 → 正常提交订单

### 2.2 弹框设计

底部半屏弹层（从底部滑入），包含：

```
┌─────────────────────────────┐
│        绑定手机号             │
│                              │
│  预约需要验证手机号           │
│                              │
│  手机号  [____________]     │
│                              │
│  验证码  [______] [获取]    │
│                              │
│      [ 确认绑定 ]            │
│                              │
│          ✕ 关闭              │
└─────────────────────────────┘
```

- 标题：「绑定手机号」
- 副标题/提示：「预约需要验证手机号，请先绑定」
- 手机号输入框（11 位，带格式校验）
- 验证码输入框 + 获取验证码按钮（60 秒倒计时）
- 确认绑定按钮
- 关闭按钮（右上角或底部，用户可主动关闭）

### 2.3 绑定流程

1. 用户输入手机号 → 前端校验格式
2. 点击「获取验证码」→ 调用 `sendUpdateMobileSms(mobile)` → 60 秒倒计时
3. 用户输入验证码 → 点击「确认绑定」
4. 调用 `updateMobile({ mobile, code })`
5. 成功后：
   - toast「绑定成功」
   - 调用 `fetchUserInfo()` 刷新用户信息（mobile 字段更新）
   - 弹框 1.5 秒后自动关闭
   - 自动触发订单提交（继续用户未完成的下单操作）
6. 失败（如手机号已被绑定）：toast 错误消息，停留在弹框内，用户可换号重试

### 2.4 弹框组件设计

新增一个可复用组件 `components/MobileBindPopup/index.vue`：

- Props：
  - `visible` — 是否显示
  - `title` — 标题（默认「绑定手机号」）
  - `tip` — 提示文案（默认「预约需要验证手机号，请先绑定」）
- Emits：
  - `close` — 关闭弹框
  - `success` — 绑定成功（携带 mobile）
- 内部逻辑：
  - 手机号输入、格式校验
  - 获取验证码（调用 store action）
  - 提交绑定（调用 store action）
  - 倒计时状态管理

### 2.5 预约确认页集成

在 `subpkg/booking/confirm.vue`（或对应确认页）中：

- 引入 `MobileBindPopup` 组件
- 点击「确认下单」时：
  ```javascript
  async function handleSubmit() {
    if (!userStore.mobile) {
      showBindPopup = true
      return
    }
    await submitOrder()
  }
  ```
- 监听弹框 `success` 事件：
  ```javascript
  function onBindSuccess() {
    // 绑定成功后自动提交订单
    submitOrder()
  }
  ```

### 2.6 错误处理（绑定弹框）

| 场景 | 处理方式 |
|------|---------|
| 手机号格式错误 | 按钮禁用或点击时 toast「请输入正确的手机号」 |
| 获取验证码失败 | toast 错误消息，倒计时不启动 |
| 验证码错误 | toast「验证码错误，请重新输入」 |
| 手机号已被其他账号绑定 | toast「该手机号已被其他账号绑定，请更换」 |
| 网络错误 | toast「网络异常，请重试」 |
| 用户主动关闭弹框 | 关闭弹框，不提交订单，停留在确认页 |

---

## 平台适配

| 平台 | 微信登录按钮 | 手机号绑定弹框 | 说明 |
|------|------------|--------------|------|
| H5 + 微信浏览器 | ✅ 显示 | ✅ 生效 | 完整功能 |
| H5 + 普通浏览器 | ❌ 不显示 | ✅ 生效 | 手机号弹框对所有登录方式生效 |
| 微信小程序 | ❌ 不显示 | ✅ 生效 | 小程序有自己的登录方式，绑定弹框通用 |
| App | ❌ 不显示 | ✅ 生效 | App 有自己的微信 SDK 登录，绑定弹框通用 |

> 手机号绑定弹框是通用组件，对所有登录方式（手机号登录、微信登录、游客模式升级）都适用。

---

## 安全考量

- `state` 参数随机生成并存入本地，回调时校验一致性，防止 CSRF 攻击
- 授权 URL 从后端接口获取，不前端拼接，避免 appid 泄露和拼接错误
- 登录 token 写入现有安全存储机制，和手机号登录一致
- 回调处理完成后立即清除 context，避免重复使用
- 手机号验证码走后端短信通道，有频控和过期机制
- 绑定手机号接口需要登录 token，确保是本人操作

---

## 验收标准

### 微信快捷登录

1. H5 微信浏览器内打开登录页，能看到绿色「微信快捷登录」按钮
2. H5 普通浏览器内打开登录页，看不到该按钮
3. 点击按钮跳转到微信授权页，同意后自动回到应用并完成登录
4. 已绑定微信的账号：直接登录成功，进入首页
5. 未绑定微信的新用户：自动创建账号并登录，进入首页（无手机号也能登录）
6. 登录成功后，「我的」页面显示正确的用户信息
7. 退出登录后，可再次使用微信登录
8. 支付场景的微信绑定流程不受影响
9. state 不匹配时拒绝登录并提示错误
10. 用户取消授权后返回登录页，可重新发起

### 预约手机号绑定弹框

11. 有手机号的用户点击「确认下单」，直接提交，不弹框
12. 无手机号的用户（如微信快捷登录的新用户）点击「确认下单」，弹出绑定弹框
13. 弹框可正常获取验证码、输入、提交
14. 绑定成功后自动刷新用户信息，mobile 字段有值
15. 绑定成功后自动继续提交订单
16. 手机号已被其他账号绑定时，提示错误，不合并账号
17. 用户可主动关闭弹框，停留在确认页
18. 弹框在多个场景（如确认页、其他需要手机号的页面）可复用

---

## 后续可扩展（本次不做）

- 微信小程序端微信一键登录
- App 端微信 SDK 登录
- 登录后新人引导（含绑定手机号引导）
- 个人中心页微信绑定 / 解绑入口
- 手机号已被绑定场景的账号合并流程