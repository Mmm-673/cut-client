---
name: 登录模块重构设计文档
description: 台球约项目登录模块彻底重构，对接新的认证接口
type: design
---

# 登录模块重构设计文档

**日期：** 2026-03-31  
**项目：** 台球约 (cut-client)

## 一、概述

### 1.1 设计目标
彻底替换现有的若依框架登录逻辑，对接新的台球约认证接口，实现统一登录页面，支持短信验证码登录和账号密码登录Tab切换，自动注册机制，以及Token自动刷新功能。

### 1.2 接口信息
- **服务器地址：** `http://114.67.69.228`
- **租户 Header：** `tenant-id: 122`
- **测试验证码：** `9999`

---

## 二、整体架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    统一登录页 (index.vue)                     │
│              [ Tab1: 短信登录 | Tab2: 密码登录 ]              │
│                    [ 忘记密码链接 ]                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Store 层 (user.js - 全新)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ smsLogin() │ passwordLogin() │ refreshToken()         │  │
│  │ logout() │ resetPassword() │ updatePassword()         │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   API 层 (auth.js - 全新)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ sendSmsCode() │ smsLogin() │ passwordLogin()         │  │
│  │ refreshToken() │ logout() │ resetPassword()          │  │
│  │ updatePassword() │ updateMobile()                     │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              请求工具层 (request.js - 改造)                    │
│         (自动 tenant-id / Token刷新 / 错误处理)               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 登录流程

#### 短信验证码登录流程
1. 用户输入手机号
2. 点击"获取验证码"（scene=1）
3. 输入验证码（9999）
4. 点击登录
5. 接口返回 userId、accessToken、refreshToken、expiresTime
6. 存储Token信息，跳转首页

#### 账号密码登录流程
1. 用户输入手机号和密码
2. 点击登录
3. 接口返回 userId、accessToken、refreshToken、expiresTime
4. 存储Token信息，跳转首页

#### Token 刷新流程
1. 请求拦截器检查 accessToken 是否在5分钟内过期
2. 是则调用刷新接口
3. 更新 accessToken 和 refreshToken
4. 继续原请求

---

## 三、数据结构设计

### 3.1 Store 状态结构

```javascript
{
  accessToken: string,      // 访问令牌（30分钟有效期）
  refreshToken: string,     // 刷新令牌（30天有效期）
  expiresTime: Date,        // accessToken 过期时间
  userId: number,           // 用户ID
  nickname: string,         // 昵称
  avatar: string,           // 头像
  mobile: string            // 绑定手机号
}
```

### 3.2 本地存储 Key

| Key | 说明 |
|-----|------|
| `auth_access_token` | accessToken |
| `auth_refresh_token` | refreshToken |
| `auth_expires_time` | expiresTime（ISO字符串） |
| `auth_user_id` | 用户ID |
| `auth_nickname` | 昵称 |
| `auth_avatar` | 头像 |
| `auth_mobile` | 手机号 |

---

## 四、错误码映射

| 错误码 | 友好提示 |
|--------|----------|
| 0 | 成功 |
| 401 | 登录已过期，请重新登录 |
| 429 | 请求过于频繁，请稍后再试 |
| 1002004000 | 用户不存在 |
| 1002004001 | 账号已被禁用 |
| 1002004003 | 密码错误 |
| 1002004010 | 验证码不存在或已过期 |
| 1002004011 | 验证码错误 |

---

## 五、文件改动清单

### 5.1 删除文件（旧的若依逻辑）

| 文件路径 | 说明 |
|---------|------|
| `api/login.js` | 旧登录API |
| `utils/auth.js` | 旧Token工具 |
| `utils/errorCode.js` | 旧错误码 |
| `pages/login/account-login.vue` | 旧账号密码登录页 |
| `pages/login/register.vue` | 旧注册页 |

### 5.2 新建文件

| 文件路径 | 说明 |
|---------|------|
| `api/auth.js` | 新认证API（12个接口） |
| `utils/token.js` | 新Token管理（accessToken + refreshToken） |
| `utils/error-messages.js` | 新错误码映射 |

### 5.3 修改文件

| 文件路径 | 说明 |
|---------|------|
| `config.js` | 更新 baseUrl 为 `http://114.67.69.228` |
| `utils/request.js` | 重写请求拦截器（自动tenant-id、Token刷新） |
| `store/modules/user.js` | 重写用户Store |
| `pages/login/index.vue` | 重写统一登录页（Tab切换） |
| `permission.js` | 更新权限控制逻辑 |
| `pages.json` | 移除不需要的页面路由 |

---

## 六、统一登录页 UI 设计

### 6.1 布局结构

```
┌─────────────────────────────────┐
│  [Logo + 台球约]                 │
│                                 │
│  [ Tab 短信登录 ] [ Tab 密码登录 ] │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 手机号输入框             │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────┐ [获取]   │  ← 短信登录Tab显示
│  │ 验证码输入框    │ [验证码] │
│  └─────────────────┘          │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 密码输入框              │   │  ← 密码登录Tab显示
│  └─────────────────────────┘   │
│              [忘记密码？]        │
│                                 │
│        [ 登录 / 注册 ]          │
│                                 │
│  ─────── 其他登录方式 ───────   │
│                                 │
│      [ 微信一键登录按钮 ]        │
│                                 │
│  [勾选] 我已阅读用户协议...     │
└─────────────────────────────────┘
```

### 6.2 交互细节

- Tab切换时清空表单
- 短信登录Tab：显示手机号+验证码
- 密码登录Tab：显示手机号+密码 + 忘记密码链接
- 手机号未注册时自动注册（接口2特性）
- 倒计时60秒获取验证码
- 协议勾选默认选中

---

## 七、API 接口清单

### 7.1 认证接口

| # | 接口 | 方法 | URL | 说明 |
|---|------|------|-----|------|
| 1 | 发送短信验证码 | POST | `/app-api/member/auth/send-sms-code` | scene=1登录 |
| 2 | 短信验证码登录 | POST | `/app-api/member/auth/sms-login` | 自动注册 |
| 3 | 账号密码登录 | POST | `/app-api/member/auth/login` | |
| 4 | 校验短信验证码 | POST | `/app-api/member/auth/validate-sms-code` | |
| 5 | 刷新令牌 | POST | `/app-api/member/auth/refresh-token` | Query参数 |
| 6 | 退出登录 | POST | `/app-api/member/auth/logout` | 需要Authorization |
| 7 | 重置密码 | POST | `/app-api/billiard/user/reset-password` | 忘记密码 |
| 8 | 修改密码 | POST | `/app-api/billiard/user/update-password` | 已登录 |
| 9 | 修改绑定手机号 | POST | `/app-api/billiard/user/update-mobile` | 已登录 |

---

## 八、Token 管理策略

### 8.1 Token 有效期
- **accessToken：** 30分钟
- **refreshToken：** 30天

### 8.2 自动刷新策略
- accessToken 快过期前5分钟自动刷新
- 刷新失败时（refreshToken也过期）跳转登录页
- 所有请求携带 `tenant-id: 122` Header
- 登录后请求携带 `Authorization: Bearer {accessToken}`

### 8.3 刷新时机
- 请求发起前检查 accessToken 是否在5分钟内过期
- 是则先刷新Token再继续请求
- 刷新期间其他请求排队等待

---

## 九、权限控制

### 9.1 页面白名单

```javascript
const whiteList = [
  '/pages/login/index',
  '/pages/common/webview/index',
  '/pages/common/textview/index'
]
```

### 9.2 拦截逻辑
- 有 Token 且访问登录页 → 重定向到首页
- 无 Token 且不在白名单 → 重定向到登录页

---

## 十、验收标准

- [ ] 配置文件已更新为正确的服务器地址
- [ ] 短信验证码发送成功
- [ ] 短信验证码登录成功
- [ ] 账号密码登录成功
- [ ] Token自动刷新功能正常
- [ ] 退出登录功能正常
- [ ] 错误提示友好准确
- [ ] 统一登录页Tab切换正常
- [ ] 自动注册功能正常（未注册手机号）
