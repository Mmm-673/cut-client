# H5 全面适配设计文档

> 日期：2026-08-21
> 状态：已评审
> 目标：让 H5 端在能力范围内与小程序/App 功能最大程度对齐，提供完整可用的移动端网页体验。

---

## 1. 背景与目标

### 1.1 背景

当前项目（初球 / 球了么）基于 UniApp + Vue 3 开发，已支持微信小程序和 App（iOS/Android）两端。
现需增加 H5 端支持，使得用户在手机浏览器中也能完成核心流程。

经过代码审计，H5 端主要存在以下缺口：

- **支付缺失**：仅钱包余额支付可用，微信/支付宝 H5 支付未实现
- **定位异常**：H5 端授权定位后获取失败/超时，缺少高德 H5 SDK 配置
- **状态栏**：自定义导航栏页面在 H5 端状态栏高度为 0，刘海屏内容偏移
- **扫码不完整**：相册扫码未实现，相机扫码兼容性不稳定
- **深度链接**：不支持通过 URL 直接打开指定页面
- **体验优化**：缺少移动端专属优化（PWA、错误边界、下载引导等）

### 1.2 目标

- H5 端核心业务流程（浏览裁教 → 下单 → 支付 → 查看订单）完整可用
- H5 端只展示 H5 支持的支付渠道，不出现小程序/App 专属渠道
- 原生环境独有功能（推送、小程序分享等）不强行实现，隐藏对应入口
- H5 体验达到移动端网页优秀水平（含 PWA 支持）
- **App 和小程序的功能完全不受影响**（所有 H5 代码通过条件编译隔离）

### 1.3 范围外

- 推送通知（JPush）—— App 专属，H5 不做
- 小程序原生分享（onShareAppMessage / onShareTimeline）—— H5 不做分享功能
- iOS 隐私弹窗 —— App 专属
- 原生扫码（plus.barcode）—— App 专属

---

## 2. 后端接口确认

支付相关后端接口已经齐备（基于 yudao-module-pay）：

| 渠道编码 | 名称 | H5 可用性 |
|---------|------|-----------|
| `wx_pub` | 微信 JSAPI 支付（公众号网页） | ✅ 微信内置浏览器 |
| `wx_wap` | 微信 Wap 网站支付（H5） | ✅ 普通手机浏览器 |
| `alipay_wap` | 支付宝 Wap 网站支付 | ✅ 所有 H5 浏览器 |
| `wallet` | 钱包支付 | ✅ 所有平台 |

关键接口：
- `POST /app-api/pay/order/submit` — 提交支付，支持 `returnUrl` 和 `displayMode`
- `GET /app-api/pay/order/get` — 查询支付单，支持 `sync=true` 主动同步渠道状态
- `GET /app-api/pay/channel/get-enable-code-list` — 获取已启用渠道列表

高德 H5 SDK Key：`f66420f63919c84eda1b14e1cf8db73e`

部署方式：单域名部署，后端已配置 CORS，前端无需代理。

---

## 3. 整体架构

按模块分 7 块，按依赖关系先后实施：

```
模块1：H5 支付系统适配（最核心）
  ↓
模块2：H5 定位修复
  ↓
模块3：状态栏高度适配
  ↓
模块4：扫码功能 H5 适配
  ↓
模块5：H5 深度链接支持
  ↓
模块6：H5 体验优化
  ↓
模块7：PWA 支持
```

---

## 4. 模块一：H5 支付系统适配

### 4.1 支付渠道展示

H5 端展示的支付渠道（与小程序/App 隔离，不混淆）：

| 支付方式 | 展示名称 | 内部渠道编码 | 触发条件 |
|---------|---------|------------|---------|
| 微信支付 | 微信支付 | `wx_pub` / `wx_wap`（自动选择） | H5 全部场景 |
| 支付宝 | 支付宝支付 | `alipay_wap` | H5 全部场景 |
| 钱包 | 钱包余额支付 | `wallet` | 所有平台 |

**渠道过滤规则：**
- 在 `ALL_PAY_CHANNELS` 中，`wechat` 和 `alipay` 的 `platforms` 增加 `'h5'`
- 在 `codeToChannel` 映射中，新增 `wx_pub`、`wx_wap` → `h5`、`alipay_wap` → `h5` 的映射
- `getPayChannelsByEnabled()` 会自动过滤出当前平台（h5）可用的渠道
- H5 端永远不会展示 `wx_lite`（小程序支付）或 `wx_app`/`alipay_app`（App支付）
- 使用 `addedValues` Set 去重，防止 `wx_pub` 和 `wx_wap` 同时启用时重复显示「微信支付」

### 4.2 环境检测工具

在 `utils/platform.js` 中新增：

```javascript
// H5 微信内置浏览器检测
export function isWechatBrowser() {
  // #ifdef H5
  return /MicroMessenger/i.test(navigator.userAgent)
  // #endif
  // #ifndef H5
  return false
  // #endif
}

// H5 支付宝内置浏览器检测
export function isAlipayBrowser() {
  // #ifdef H5
  return /AlipayClient/i.test(navigator.userAgent)
  // #endif
  // #ifndef H5
  return false
  // #endif
}
```

### 4.3 动态渠道编码选择

新增 `getWxChannelCode()` 函数，根据环境返回微信支付渠道编码：
- H5 + 微信浏览器 → `wx_pub`
- H5 + 非微信浏览器 → `wx_wap`
- 小程序 → `wx_pub`（已有逻辑，保持不变）
- App → `wx_app`（已有逻辑，保持不变）

新增 `getAlipayChannelCode()` 函数：
- H5 → `alipay_wap`
- App → `alipay_app`（已有逻辑，保持不变）

### 4.4 支付执行逻辑

在 `utils/payment.js` 的 `executePayment` 中新增 H5 分支：

```
用户选择微信支付（H5）：
  ├─ 微信浏览器内 → 渠道 wx_pub → JSAPI 调起 WeixinJSBridge.invoke
  └─ 普通浏览器   → 渠道 wx_wap  → displayMode=url → location.href 跳转

用户选择支付宝支付（H5）：
  └─ 所有浏览器 → 渠道 alipay_wap → displayMode=form/url → 跳转
```

**微信 JSAPI 支付实现要点：**
1. 提交支付时 `channelCode: 'wx_pub'`，`displayMode: 'app'`
2. 后端返回 `displayContent` JSON，包含 `appId/timeStamp/nonceStr/package/signType/paySign`
3. 调用 `WeixinJSBridge.invoke('getBrandWCPayRequest', params, callback)`
4. 成功回调 → 轮询确认支付状态
5. 失败/取消 → 提示用户

**微信 WAP 支付实现要点：**
1. 提交支付时 `channelCode: 'wx_wap'`，`displayMode: 'url'`
2. 后端返回 `displayContent` 为跳转 URL（微信中间页）
3. `location.href = url` 跳转到微信完成支付
4. 支付完成后由微信跳回 `returnUrl`
5. 跳回后解析参数、查询支付状态

**支付宝 WAP 支付实现要点：**
1. 提交支付时 `channelCode: 'alipay_wap'`，`displayMode: 'form'`（或 `url`，以实际返回为准）
2. 后端返回 HTML 表单或跳转 URL
3. 使用表单自动提交或 `location.href` 跳转
4. 支付完成后支付宝跳回 `returnUrl`
5. 跳回后解析参数、查询支付状态

### 4.5 returnUrl 构造

```
returnUrl = 当前域名 + '/#/pages/booking/pay-success' + '?payOrderId=' + payOrderId
```

在提交支付时通过 `returnUrl` 字段传给后端，后端在支付完成后跳回该地址。

**注意：** `returnUrl` 仅在 H5 平台下拼接和传递，App/小程序不传此参数。

### 4.6 支付结果回调处理

复用并增强 `subpkg/booking/pay-success.vue`：

- 支持从 URL 参数（`?payOrderId=xxx&source=callback`）读取支付订单号
- 页面加载时调用 `/pay/order/get?sync=true` 查询支付状态
- 支付成功 → 显示成功状态，提供"查看订单"按钮
- 支付失败 → 显示失败原因，提供"重新支付"按钮
- 支付中 → 显示"支付确认中"，启动轮询

### 4.7 轮询兜底机制

跳转回来后如果支付状态为 WAITING（0）：
- 每 2 秒调用一次 `/pay/order/get?sync=true`
- 最多轮询 10 次（共 20 秒）
- 支付成功 → 走成功流程
- 超时 → 提示"支付结果确认中，请稍后在订单列表查看"，跳转订单列表

### 4.8 打赏页面适配

打赏页面（`subpkg/coach/reward.vue`）H5 端已有页面结构，支付走同一套 `executePayment`，因此支付模块适配完成后打赏功能自动可用。

### 4.9 登录 platform 标识修复

`api/auth.js` 中 `smsLogin` 和 `passwordLogin` 的 `platform` 参数：
- APP-PLUS → `'app'`（保持不变）
- H5 → `'h5'`（新增，修复当前被标记为 `'miniapp'` 的问题）
- MP-WEIXIN → `'miniapp'`（保持不变，即默认值）

---

## 5. 模块二：H5 定位修复

### 5.1 问题诊断

用户反馈「授权了但获取失败/超时」，可能原因：
1. 缺少 H5 端高德定位 SDK 配置，`uni.getLocation` 走浏览器原生 Geolocation，稳定性差
2. H5 定位参数未优化（高精度、超时等）
3. 坐标体系不统一（浏览器 WGS84 vs 后端 GCJ02）

### 5.2 方案

**第一步：配置高德 H5 SDK**

在 `manifest.json` 的 `h5` 配置中添加：

```json
"h5": {
  "sdkConfigs": {
    "geolocation": {
      "type": "amap",
      "key": "f66420f63919c84eda1b14e1cf8db73e"
    }
  }
}
```

让 `uni.getLocation` 使用高德定位服务，坐标体系统一为 GCJ02，与后端逆地址解析一致。

**第二步：优化定位参数**

在 `utils/location.js` 中：
- H5 端 `uni.getLocation` 增加 `type: 'gcj02'`（火星坐标系，与高德一致）
- 增加 `isHighAccuracy: true`（高精度模式）
- 增加 `timeout: 10000`（10 秒超时）
- 增加失败重试机制（失败后再试 1 次，降级到低精度模式）

**第三步：完善错误提示**

H5 端定位失败时，除了 toast 提示，增加更明确的引导：
- HTTP 环境 → 提示"请使用 HTTPS 访问以启用定位"
- 用户拒绝 → 提示"请在浏览器设置中允许定位权限"
- 超时 → 提示"定位超时，请检查网络或移动到开阔地带"

### 5.3 兼容性说明

- `uni.getLocation` 的 `type: 'gcj02'` 在 H5 端配合高德 SDK 使用
- 高德 SDK 配置后，`uni.getLocation` 内部会调用高德定位 API
- 不影响 App 和小程序端的定位逻辑（各自走各自的定位服务）

---

## 6. 模块三：状态栏高度适配

### 6.1 问题

自定义导航栏页面（首页、登录页、我的页）依赖 `--status-bar-height` CSS 变量。
目前该变量仅在 App 端设置，H5 端始终为 0px，导致刘海屏手机浏览器中内容顶到状态栏。

### 6.2 方案

**不动现有的 App 端逻辑**（`setStatusBarHeight()` 仍保留在 `#ifdef APP-PLUS` 块内，避免影响 iOS 隐私弹窗等周边逻辑）。

在 `App.vue` 的 `onLaunch` 中**新增**一段 H5 专属逻辑（`#ifdef H5` 包裹）：

```javascript
// #ifdef H5
function setStatusBarHeightH5() {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 0
  uni.$statusBarHeight = statusBarHeight
  // 设置 CSS 变量供自定义导航栏使用
  if (statusBarHeight > 0) {
    document.documentElement.style.setProperty('--status-bar-height', statusBarHeight + 'px')
  }
  // 若无法获取，则依赖 CSS 的 env(safe-area-inset-top) 作为兜底
}
setStatusBarHeightH5()
// #endif
```

调用位置：放在 `initApp()` 中主题初始化之后，与 App 端的状态栏设置逻辑对应。

### 6.3 兼容性说明

- `uni.getSystemInfoSync()` 在 H5 端返回的 `statusBarHeight` 值因浏览器而异：
  - 移动端浏览器 + `viewport-fit=cover` 时，可能返回实际高度，也可能返回 0
  - 桌面浏览器通常返回 0
- 已有 `static/index.html` 配置了 `viewport-fit=cover`，配合 `env(safe-area-inset-top)` 可覆盖大多数刘海屏场景
- 双层保险：优先用 JS 动态设置的 `--status-bar-height`，CSS 中 fallback 到 `env(safe-area-inset-top)`

---

## 7. 模块四：扫码功能 H5 适配

### 7.1 技术选型

使用 `html5-qrcode` 库，理由：
- 支持相机实时扫码（调用 `getUserMedia`）
- 支持本地图片文件解码
- 轻量（~100KB），维护活跃
- 纯前端实现，无需后端

引入方式：npm 安装，H5 条件编译下动态 import（减小非 H5 包体积）。

### 7.2 相册扫码

替换现有 H5 "相册扫码功能开发中"提示：
- H5 端点击"相册扫码" → 使用原生 `<input type="file" accept="image/*">` 触发文件选择
- 获取图片文件后，使用 `Html5Qrcode` 类的 `scanFile()` 方法解码
- 解码成功 → 走 `processQrResult` 统一处理
- 解码失败 → 提示"未识别到二维码"

### 7.3 相机扫码

H5 端优先使用 `html5-qrcode` 实时扫码：
- 点击"点击扫码" → 检测浏览器是否支持 `getUserMedia`
- 支持 → 全屏 video 扫码界面，使用 `Html5QrcodeScanner` 实时识别
- 检测到二维码 → 停止扫描 → 震动提示 → 处理结果
- 浏览器不支持摄像头（或用户拒绝授权）→ 降级为相册扫码
- 提供切换前后置摄像头的按钮
- 提供关闭按钮返回扫码主页

### 7.4 文件变更

`pages/scan/index.vue`：
- 增加 H5 条件编译块，动态 import html5-qrcode
- 重写 `handleAlbumScan` 的 H5 实现
- 重写 `handleScan` 的 H5 实现（相机扫码）
- 新增扫码结果处理逻辑（与现有逻辑保持一致，复用 `processQrResult`）
- App 端的 `plus.barcode` 逻辑、小程序端的 `uni.scanCode` 逻辑**完全不动**

---

## 8. 模块五：H5 深度链接支持

### 8.1 目标

支持通过 URL 直接打开 App 内指定页面，用于：
- 推广链接（直接打开裁教详情页）
- 支付回调跳转
- 分享落地页（虽然 H5 不做主动分享，但外部链接进来要能处理）

### 8.2 支持的页面

| 页面 | 路径格式 | 示例 |
|------|---------|------|
| 裁教详情 | `/pages/coach/detail?id=xxx` | `https://m.example.com/#/pages/coach/detail?id=123` |
| 订单详情 | `/pages/order/detail?id=xxx` | `https://m.example.com/#/pages/order/detail?id=456` |
| 支付结果 | `/pages/booking/pay-success?payOrderId=xxx` | `https://m.example.com/#/pages/booking/pay-success?payOrderId=789` |
| 首页 | `/pages/home/index` | 默认落地页 |

### 8.3 实现方式

在 `App.vue` 的 `onLaunch` 中：
1. H5 端解析当前 URL 的 hash 部分，获取路径和查询参数
2. 如果路径不是首页（默认路径），且属于白名单页面，则：
   - 不需要登录的页面（如裁教详情）→ 直接 `uni.reLaunch` 到目标页
   - 需要登录的页面（如订单详情）→ 检查登录状态，已登录则跳转，未登录则先跳登录页，登录后再跳转目标页
3. 将目标路径存入 `uni.$deepLinkTarget`，供登录后跳转使用

**整个深度链接模块用 `// #ifdef H5` 完全隔离，App/小程序启动时不执行。**

### 8.4 登录后跳转

在 `store/modules/user.js` 的登录成功 action 中：
- 检查 `uni.$deepLinkTarget` 是否存在
- 存在 → 清除并跳转到目标页
- 不存在 → 跳首页

---

## 9. 模块六：H5 体验优化

### 9.1 100vh 问题修复

**问题：** 大量页面使用 `100vh`，在移动端浏览器地址栏收起/展开时高度跳动，iOS Safari 上 100vh 不包含底部工具栏。

**方案：** 用 CSS 变量 `--vh` 替代 `100vh`，JS 动态计算可视区高度。

```javascript
// #ifdef H5
function setVh() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}
window.addEventListener('resize', setVh)
setVh()
// #endif
```

需要替换的页面（高优）：
- `pages/scan/index.vue` — `height: 100vh`
- `pages/home/index.vue` — scroll-view 高度
- `subpkg/booking/hall.vue` — `height: 100vh`
- `App.vue` — `page { min-height: 100vh }`
- 其他使用 `100vh` 的页面统一替换

替换规则：`100vh` → `calc(var(--vh, 1vh) * 100)`

### 9.2 全局过渡性能优化

`App.vue` 中 `* { transition: background-color 0.3s, color 0.3s, border-color 0.3s }` 给所有元素加 transition，性能开销大。

**优化：** 缩小范围，只在主题切换时临时加过渡。使用一个 `.theme-transitioning` 类包裹，切换主题时加类，切换完成后移除。

### 9.3 TabBar 主题色同步

pages.json 中 tabBar 背景色硬编码为深色，浅色主题下不一致。

方案：使用 `uni.setTabBarStyle` API 在主题切换时动态更新 tabBar 样式。在 `utils/theme.js` 的 `applyThemeToPage` 或主题切换方法中增加 tabBar 样式更新逻辑。

### 9.4 移动端交互优化

- **禁用双击缩放**：在 `static/index.html` 的 viewport meta 中增加 `user-scalable=no`
- **点击延迟**：确保 `touch-action: manipulation` 生效
- **键盘适配**：输入框聚焦时，确保输入框滚动到可视区域（`scrollIntoView`）
- **iOS 底部安全区**：验证关键页面都有 `safe-area-bottom` 类应用

### 9.5 全局错误边界

- 增强 `App.vue` 的 `onError` 钩子，捕获全局错误
- 增加 `onUnhandledRejection` 处理（H5 特有）
- 统一错误提示：显示友好的错误信息
- 网络状态检测：监听 `online/offline` 事件，断网时提示用户

### 9.6 下载 App 引导

新增 `subpkg/common/download.vue` 页面：
- 展示 App 下载二维码和下载按钮
- 检测环境：
  - 微信浏览器内 → 提示"点击右上角，选择在浏览器中打开"
  - iOS Safari → 跳 App Store
  - Android 浏览器 → 直接下载 APK
- 在个人中心增加"下载 App"入口（H5 条件编译）

**pages.json 中该页面路由用 `// #ifdef H5` 条件编译，确保 App/小程序中不存在。**

---

## 10. 模块七：PWA 支持

### 10.1 功能清单

- 添加到主屏幕（Add to Home Screen）
- 启动画面（Splash Screen）
- Service Worker 静态资源缓存
- 离线访问已加载页面
- 应用图标（各尺寸）

### 10.2 配置

在 `manifest.json` 的 `h5` 配置中增加：

```json
"h5": {
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

### 10.3 图标

使用现有图标生成 PWA 所需的各尺寸图标：
- 192x192（Android 主屏）
- 512x512（Android 大屏）
- 180x180（iOS 主屏）
- 各尺寸放在 `static/icons/pwa/` 目录下

优先使用项目已有的 logo 图片，如 `static/images/logo.png`（如存在）。

### 10.4 注意事项

- Service Worker 仅在生产模式生效
- 更新策略：版本号变更时自动更新缓存
- 离线访问仅缓存静态资源，动态数据不缓存
- PWA 配置完全在 `manifest.json` 的 `h5` 节点下，不影响其他平台

---

## 11. 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `utils/payment.js` | 大幅修改 | 新增 H5 微信/支付宝支付实现，渠道过滤增加 h5 |
| `utils/platform.js` | 新增函数 | 增加 `isWechatBrowser()`、`isAlipayBrowser()` |
| `utils/location.js` | 修改 | H5 定位参数优化 + 高德 SDK 配合 + 重试机制 |
| `api/auth.js` | 修改 | 修复 H5 登录 platform 标识 |
| `App.vue` | 修改 | 状态栏高度 H5 适配、深度链接解析、100vh 修复、错误边界 |
| `pages/scan/index.vue` | 大幅修改 | H5 端使用 html5-qrcode 实现相册+相机扫码 |
| `subpkg/booking/pay-success.vue` | 修改 | 支持从 URL 参数读取支付订单并轮询确认 |
| `subpkg/common/download.vue` | 新增 | App 下载引导页（H5 专属） |
| `manifest.json` | 修改 | PWA 配置、高德 SDK 配置、h5 sdkConfigs |
| `static/index.html` | 修改 | viewport 优化 |
| `store/modules/user.js` | 修改 | 登录后深度链接跳转（H5 条件编译） |
| `utils/theme.js` | 修改 | TabBar 主题色同步 |
| `pages.json` | 修改 | 下载页路由（H5 条件编译） |
| `subpkg/mine/index.vue` | 修改 | H5 下载 App 入口 |
| `package.json` | 修改 | 新增 html5-qrcode 依赖 |
| `static/icons/pwa/*` | 新增 | PWA 各尺寸图标 |

---

## 12. 实施顺序

1. **支付模块适配** — 最高优先级，没有支付 H5 无法完成核心流程
2. **定位修复** — 影响球厅和裁教列表的核心体验
3. **状态栏适配** — 影响用户视觉体验，修复成本低
4. **扫码适配** — 功能型需求
5. **深度链接** — 运营推广需要，支付回调也依赖
6. **H5 体验优化** — 提升留存和口碑
7. **PWA 支持** — 锦上添花，最后做

---

## 13. 测试要点

| 测试项 | 测试场景 |
|-------|---------|
| 微信 JSAPI 支付 | 微信内置浏览器中下单 → 调起支付 → 成功/失败回调 |
| 微信 WAP 支付 | 普通手机浏览器下单 → 跳转微信 → 支付完成回跳 |
| 支付宝 WAP 支付 | 手机浏览器下单 → 跳转支付宝 → 支付完成回跳 |
| 钱包支付 | 验证 H5 端钱包支付不受影响 |
| 支付结果轮询 | 支付后状态未同步时轮询逻辑验证 |
| 渠道过滤 | H5 端不出现小程序/App 专属支付渠道 |
| H5 定位 | 球厅页/裁教列表页定位成功率，与 App 端对比精度 |
| 状态栏高度 | iPhone 刘海屏、Android 各类机型验证 |
| 扫码-相册 | 选择含二维码的图片 → 正确识别 |
| 扫码-相机 | 调用摄像头 → 实时识别二维码 |
| 深度链接 | 直接访问详情页 URL → 正确跳转 |
| 深度链接+登录 | 未登录访问受限页面 → 登录后正确跳转 |
| 100vh 修复 | iOS Safari 地址栏收起/展开时不跳动 |
| TabBar 主题切换 | 深浅主题切换时 tabBar 颜色同步变化 |
| PWA | 添加到主屏 → 离线访问静态内容 |
| 跨平台一致性 | 同一功能在 MP/H5/App 的表现对比 |
| **App 回归-支付** | App 端微信支付、支付宝支付正常使用，不受 H5 代码影响 |
| **小程序回归-支付** | 小程序端微信支付正常使用，不受 H5 代码影响 |
| **App 回归-扫码** | App 端原生扫码（plus.barcode）正常工作 |
| **小程序回归-扫码** | 小程序端 uni.scanCode 正常工作 |
| **App 回归-状态栏** | App 端自定义导航栏高度正常，无视觉变化 |
| **小程序回归-启动** | 小程序启动流程正常，无多余逻辑执行 |
| **App 回归-定位** | App 端定位功能正常，高德 SDK 配置不影响 App |

---

## 14. 风险与应对

### 14.1 功能风险

| 风险 | 影响 | 应对方案 |
|------|------|---------|
| 微信 JSAPI 需要 openid | 微信内支付需要用户授权获取 openid | 后端静默授权获取，前端透传 `channelExtras.openid` |
| 微信 WAP 支付需要真实域名备案 | 测试环境可能无法调通 | 测试环境用 mock 或钱包支付验证，生产环境验证 |
| html5-qrcode 包体积 | 增加 H5 包大小 | 动态 import，仅在扫码页面加载 |
| iOS Safari 安全区兼容 | 部分页面底部按钮被遮挡 | 全面验证 safe-area-bottom 应用情况 |
| 各浏览器兼容性 | 部分浏览器 API 支持不一致 | 做好降级方案（如相机扫码降级为相册扫码） |
| 高德 H5 SDK 配置有效性 | key 可能未开通对应服务 | 上线前验证定位功能是否正常 |

### 14.2 跨平台影响风险（重要：不得影响 App / 小程序）

**原则：所有 H5 新增代码必须通过条件编译完全隔离，App 和小程序的原有代码路径不做任何修改。**

| 模块 | 风险点 | 隔离方式 | 验证标准 |
|------|--------|---------|---------|
| 支付模块 | `WeixinJSBridge`、`location.href`、`document` 等浏览器 API 泄漏到 App/小程序 | 三个 H5 支付函数体整段用 `// #ifdef H5` / `// #ifndef H5` 包裹，非 H5 返回 Promise.reject | 小程序和 App 包中不包含任何 H5 支付相关代码字符串 |
| 支付模块 | `returnUrl` 参数传给后端时影响 App/小程序 | 仅在 H5 平台下拼接和传递 returnUrl，App/小程序不传 | App/小程序提交支付的请求体不含 returnUrl 字段 |
| 定位模块 | 高德 SDK 配置影响 App/小程序 | 配置在 `manifest.json` 的 `h5` 节点的 `sdkConfigs` 下，只影响 H5 构建 | App/小程序端定位逻辑和配置完全不变 |
| 定位模块 | H5 参数改动影响其他平台 | 参数修改放在 H5 条件编译块内，仅 H5 生效 | App/小程序的定位参数与修改前一致 |
| 扫码模块 | html5-qrcode 库增大 App/小程序包体积 | 仅在 H5 分支动态 import (`// #ifdef H5` 包裹 import 语句) | 小程序和 App 构建产物中不含 html5-qrcode 代码 |
| 扫码模块 | 扫码页面重写影响 App/小程序原生扫码路径 | App 端的 `plus.barcode` 逻辑、小程序端的 `uni.scanCode` 逻辑完全不动，只在 H5 分支新增实现 | 对比修改前后，App 和小程序的扫码行为完全一致 |
| 状态栏 | 移除 `#ifdef APP-PLUS` 影响 App 端 iOS 隐私弹窗 | **不做移除操作**，单独新增 H5 版本的状态栏设置函数，用 `// #ifdef H5` 完全隔离 | App 端 `initApp()` 中的 APP-PLUS 块原样保留 |
| 深度链接 | URL 解析逻辑影响 App/小程序启动流程 | 深度链接解析整个模块用 `// #ifdef H5` 包裹 | App/小程序启动时不执行任何深度链接相关代码 |
| PWA | Service Worker / manifest 影响其他平台 | 配置在 `manifest.json` 的 `h5` 节点下，只影响 H5 构建 | App/小程序构建产物不含 PWA 相关内容 |
| 下载引导页 | 下载页面出现在 App/小程序中 | 页面路由在 `pages.json` 中用 `// #ifdef H5` 条件编译，入口按钮也用条件编译隐藏 | App/小程序中看不到下载 App 入口和页面 |
| 主题/TabBar | 动态设置 TabBar 样式影响 App/小程序 | `uni.setTabBarStyle` 是通用 API 全平台可用，验证多端行为一致 | 三端 TabBar 样式切换都正常 |

**实施要求：每完成一个模块，都要同时验证三个平台（H5、小程序、App）的构建和核心功能，确保 App 和小程序的行为与修改前完全一致。**