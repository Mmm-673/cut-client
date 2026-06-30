# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**初球** - 基于 UniApp + Vue 3 的台球预约应用，支持 APP、小程序、H5 多端运行。基于 RuoYi-App 框架改造。

- 对接台球爱好者与专业裁教/裁判教练
- 支持在线预约台球陪练与教学服务
- 裁教线上接单获取收益
- 平台统一管理账号、订单、财务结算及客服售后

## 技术栈

- **框架**: UniApp (Vue 3 Composition API)
- **状态管理**: Pinia
- **UI 组件**: uni-ui
- **样式**: SCSS
- **支持平台**: 微信小程序、App (iOS/Android)、H5、鸿蒙 (HarmonyOS)

## 常用命令

项目使用 HBuilderX 或 CLI 进行开发：

- **微信小程序开发**: 运行 `dev:mp-weixin`，使用微信开发者工具导入 `dist/dev/mp-weixin`
- **H5 开发**: 运行 `dev:h5`，访问 http://localhost:9090
- **App 开发**: 使用 HBuilderX 连接真机或模拟器运行
- **生产构建**: `build:%PLATFORM%`

## 核心架构

### 项目结构

```
├── App.vue              # 应用入口 - 初始化、登录检查
├── main.js              # Vue 实例初始化
├── config.js            # 应用全局配置 (API 地址、应用信息)
├── pages.json           # 页面路由和 TabBar 配置
├── manifest.json        # 应用 manifest 配置 - 各平台设置
├── permission.js        # 路由权限拦截
├── api/                 # API 接口层
│   ├── auth.js          # 认证相关 API
│   └── billiard/        # 台球业务模块 API
│       ├── coach.js     # 裁教相关
│       ├── venue.js     # 球馆相关
│       ├── order.js     # 订单相关
│       ├── pay.js       # 支付相关
│       └── wallet.js    # 钱包相关
├── pages/               # 主包页面
│   ├── login/           # 登录注册
│   ├── home/            # 首页
│   ├── coach/list       # 裁教列表（预约 Tab）
│   ├── order/list       # 订单列表
│   └── mine/            # 我的
├── subpkg/              # 分包页面
│   ├── coach/           # 裁教详情、打赏、评价
│   ├── booking/         # 球厅选择、预约确认、支付成功
│   ├── order/           # 订单详情
│   ├── mine/            # 个人信息、收藏、设置、钱包、充值等
│   └── common/          # 通用页面（webview、textview）
├── store/               # Pinia Store
│   └── modules/
│       ├── user.js      # 用户模块
│       ├── config.js    # 配置模块
│       └── dict.js      # 字典模块
├── utils/               # 工具函数
│   ├── request.js       # 请求封装 - 拦截器、token、刷新机制
│   ├── token.js         # token 管理 - 双令牌机制
│   ├── payment.js       # 支付封装 - 多端支付支持
│   ├── platform.js      # 平台判断工具
│   └── ...              # 其他工具
├── static/              # 静态资源
└── uni_modules/         # uni-ui 组件
```

### 主题色 (深色主题)

| 用途 | 色值 |
|------|------|
| 主背景 | `#121619` |
| 卡片/组件背景 | `#1E252B`、`#2a2a2a`、`#2d2d2d` |
| 页面背景 (部分) | `#2a3338` |
| 浅色背景 | `#ffffff`、`#f5f6f7` |
| 主按钮渐变 | `linear-gradient(135deg, #10b981 0%, #059669 100%)` |
| 主按钮/品牌绿 | `#00BB88`、`#00d4aa` |
| 强调按钮 | `#f5a623` (橙色) |
| 图标色 | `#007AFF` (蓝色) |
| 主要文字 | `#333333` |
| 次要文字 | `#888888`、`#999999` |
| TabBar 选中 | `#00BB88` |
| TabBar 未选中 | `#666666` |

## 核心模块说明

### 认证体系 (utils/token.js + utils/request.js)

- **双令牌机制**: Access Token + Refresh Token
- **自动刷新**: Token 过期前 5 分钟自动刷新
- **请求拦截**: 自动添加 Authorization header 和 tenant-id: 122
- **并发刷新**: 防止多个请求同时刷新 Token
- **登录检查**: App.vue 启动时检查，无效则跳转登录页

### 支付系统 (utils/payment.js)

支持多端支付渠道：

- **微信小程序支付**: `wx_pub` - `uni.requestPayment`
- **App 微信支付**: `wx_app` - `uni.requestPayment`
- **App 支付宝支付**: `alipay_app` - `uni.requestPayment`
- **钱包余额支付**: `wallet` - 直接后端扣款

支付流程：
1. 调用 `submitPayOrder()` 获取支付参数
2. 根据平台和渠道调用对应支付 SDK
3. 成功后跳转支付成功页或订单详情

### 平台适配 (utils/platform.js)

使用 UniApp 条件编译实现多端兼容：

```javascript
isH5()          // H5 平台
isMP()          // 任意小程序
isMPWeixin()    // 微信小程序
isApp()         // App (iOS/Android)
isHarmony()     // 鸿蒙
isIOS()         // iOS
isAndroid()     // Android
```

### 路由权限 (permission.js)

- 白名单页面无需登录：登录页、重置密码、webview、textview
- 已登录用户访问登录页自动跳转首页
- 未登录用户访问受保护页面自动跳转登录页

## API 模块

### api/auth.js - 认证接口

- `sendSmsCode()` - 发送短信验证码
- `smsLogin()` - 短信验证码登录
- `passwordLogin()` - 密码登录
- `validateSmsCode()` - 校验验证码
- `refreshToken()` - 刷新令牌
- `logout()` - 退出登录
- `resetPassword()` - 重置密码（忘记密码）
- `updatePassword()` - 修改密码（已登录）
- `updateMobile()` - 修改手机号

### api/billiard/ - 业务接口

- `coach.js` - 裁教列表、详情等
- `venue.js` - 球馆列表、详情等
- `order.js` - 订单创建、列表、详情等
- `pay.js` - 支付渠道、提交支付等
- `wallet.js` - 钱包余额、充值、提现等

## Store 模块

### store/modules/user.js

State:
- `accessToken`、`refreshToken`、`expiresTime`
- `userId`、`nickname`、`avatar`、`mobile`

Actions:
- `smsLogin()` - 短信登录
- `passwordLogin()` - 密码登录
- `logOut()` - 退出登录
- `resetPassword()` - 重置密码
- `updatePassword()` - 修改密码
- `updateMobile()` - 修改手机号
- `checkLoggedIn()` - 检查登录状态

## 页面路由

### TabBar 4 个标签页

| 索引 | 页面 | 路径 |
|------|------|------|
| 0 | 首页 | `/pages/home/index` |
| 1 | 预约（裁教列表） | `/pages/coach/list` |
| 2 | 订单 | `/pages/order/list` |
| 3 | 我的 | `/pages/mine/index` |

### 主要页面路径

- 登录: `/pages/login/index`
- 重置密码: `/pages/login/resetPassword`
- 裁教详情: `/subpkg/coach/detail`
- 打赏裁教: `/subpkg/coach/reward`
- 评价: `/subpkg/coach/evaluate`
- 选择球厅: `/subpkg/booking/hall`
- 确认订单: `/subpkg/booking/confirm`
- 支付成功: `/subpkg/booking/pay-success`
- 订单详情: `/subpkg/order/detail`
- 钱包: `/subpkg/mine/wallet`
- 充值: `/subpkg/mine/recharge`
- 提现: `/subpkg/mine/withdraw`

## 开发规范

### 条件编译

使用 UniApp 条件编译处理平台差异：

```javascript
// #ifdef MP-WEIXIN
// 微信小程序特有代码
// #endif

// #ifdef APP-PLUS
// App 特有代码
// #endif

// #ifdef H5
// H5 特有代码
// #endif
```

### 安全区域适配

```css
.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 请求使用

```javascript
import request from '@/utils/request'

// GET 请求
request({
  url: '/api/path',
  method: 'get',
  params: { key: value }
})

// POST 请求
request({
  url: '/api/path',
  method: 'post',
  data: { key: value }
})

// 不需要 token 的请求
request({
  url: '/api/path',
  method: 'post',
  headers: { isToken: false },
  data: data
})
```

## 全局样式

- `uni.scss` - uni-app 内置变量
- `static/scss/index.scss` - 全局样式
- App.vue 中引入全局样式并设置安全区域

## 配置

- **API 地址**: `config.js` - `baseUrl: 'http://114.67.69.228'`
- **租户 ID**: `utils/request.js` - `tenant-id: '122'`
- **微信小程序 AppID**: `manifest.json` - `mp-weixin.appid`
- **Android 包名**: `manifest.json` - `app-plus.android.packageName`
- **iOS 包名**: `manifest.json` - `app-plus.ios.bundleId`