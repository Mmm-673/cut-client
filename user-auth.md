# 用户端 - 认证接口文档

## 环境信息

| 项目 | 值 |
|------|-----|
| 服务器地址 | `http://114.67.69.228` |
| 租户 Header | `tenant-id: 122` |

> 所有请求必须携带 `tenant-id: 122` Header

---

## 测试说明

| 场景 | 说明 |
|------|------|
| 短信验证码 | 测试环境验证码固定为 `9999`，不会真实发送短信 |
| 微信登录 | 需真实微信配置，测试阶段暂不可用 |

## 短信验证码 scene 值说明

发送验证码时 `scene` 字段必须与业务场景对应，否则后续接口会报"验证码不存在"：

| scene | 用途 | 对应接口 |
|-------|------|---------|
| 1 | 手机号登录 | 接口 1 → 接口 2 |
| 2 | 修改绑定手机号 | 接口 1 → 接口 9 |
| 3 | 修改密码 | 接口 1 → 接口 8 |
| 4 | 忘记密码 / 重置密码 | 接口 1 → 接口 7 |

---

## 接口列表

> 🟢 可联调 &nbsp;&nbsp; 🔴 不可联调（需真实微信配置）

| # | 接口 | 状态 |
|---|------|------|
| 1 | 发送短信验证码 | 🟢 |
| 2 | 手机号 + 验证码登录 | 🟢 |
| 3 | 手机号 + 密码登录 | 🟢 |
| 4 | 校验短信验证码 | 🟢 |
| 5 | 刷新令牌 | 🟢 |
| 6 | 退出登录 | 🟢 |
| 7 | 重置密码（忘记密码） | 🟢 |
| 8 | 修改密码（已登录） | 🟢 |
| 9 | 修改绑定手机号（已登录） | 🟢 |
| 10 | 微信小程序一键登录 | 🔴 |
| 11 | 社交登录（微信公众号等） | 🔴 |
| 12 | 获取社交授权跳转 URL | 🔴 |

---

### 1. 发送短信验证码

```
POST /app-api/member/auth/send-sms-code
```

**Headers：**
```
Content-Type: application/json
tenant-id: 122
```

**Request Body：**
```json
{
  "mobile": "13800138001",
  "scene": 1
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mobile | String | ❌ | 手机号（11位国内号码） |
| scene | Integer | ✅ | 发送场景，见上方「scene 值说明」表 |

**Response：**
```json
{
  "code": 0,
  "msg": "",
  "data": true
}
```

> 限制：同一手机号 60 秒内只能发一次，每日最多 10 次

---

### 2. 手机号 + 验证码登录

```
POST /app-api/member/auth/sms-login
```

**Headers：**
```
Content-Type: application/json
tenant-id: 122
```

**Request Body：**
```json
{
  "mobile": "13800138001",
  "code": "9999"
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mobile | String | ✅ | 手机号 |
| code | String | ✅ | 短信验证码，4-6位纯数字 |
| socialType | Integer | ❌ | 社交平台类型，同步绑定社交账号时传 |
| socialCode | String | ❌ | 社交授权码，socialType 有值时必填 |
| socialState | String | ❌ | 社交 state，socialType 有值时必填 |

> 手机号未注册时自动创建账号，注册与登录合一

**Response：**
```json
{
  "code": 0,
  "msg": "",
  "data": {
    "userId": 1024,
    "accessToken": "c4f7acf73b014e39810c0ff4d229c37a",
    "refreshToken": "5715f92fc62d4cb0bbc2663670446f95",
    "expiresTime": "2026-04-01T10:00:00"
  }
}
```

---

### 3. 手机号 + 密码登录

```
POST /app-api/member/auth/login
```

**Headers：**
```
Content-Type: application/json
tenant-id: 122
```

**Request Body：**
```json
{
  "mobile": "13800138001",
  "password": "abc123"
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mobile | String | ✅ | 手机号 |
| password | String | ✅ | 密码，4-16位 |
| socialType | Integer | ❌ | 社交平台类型，同步绑定时传 |
| socialCode | String | ❌ | 社交授权码，socialType 有值时必填 |
| socialState | String | ❌ | 社交 state，socialType 有值时必填 |

> 需先通过接口 6 或接口 7 设置密码后才可使用

**Response：** 格式同接口 2

---

### 4. 校验短信验证码

```
POST /app-api/member/auth/validate-sms-code
```

**Headers：**
```
Content-Type: application/json
tenant-id: 122
```

**Request Body：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mobile | String | ✅ | 手机号 |
| code | String | ✅ | 短信验证码 |
| scene | Integer | ✅ | 发送场景，需与发送时一致 |

**Response：**
```json
{
  "code": 0,
  "msg": "",
  "data": true
}
```

---

### 5. 刷新令牌

```
POST /app-api/member/auth/refresh-token?refreshToken={refreshToken}
```

**Headers：**
```
tenant-id: 122
```

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refreshToken | String | ✅ | 登录时返回的 refreshToken |

**Response：** 返回新的 accessToken 和 refreshToken，格式同登录接口

---

### 6. 退出登录

```
POST /app-api/member/auth/logout
```

**Headers：**
```
tenant-id: 122
Authorization: Bearer {accessToken}
```

**Response：**
```json
{
  "code": 0,
  "msg": "",
  "data": true
}
```

---

### 7. 重置密码（忘记密码）

```
POST /app-api/billiard/user/reset-password
```

**Headers：**
```
Content-Type: application/json
tenant-id: 122
```

**Request Body：**
```json
{
  "mobile": "13800138001",
  "code": "9999",
  "password": "abc123"
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mobile | String | ✅ | 手机号 |
| code | String | ✅ | 短信验证码，4-6位纯数字 |
| password | String | ✅ | 新密码，4-16位 |

**Response：**
```json
{
  "code": 0,
  "msg": "",
  "data": true
}
```

---

### 8. 修改密码（已登录）

```
POST /app-api/billiard/user/update-password
```

**Headers：**
```
Content-Type: application/json
tenant-id: 122
Authorization: Bearer {accessToken}
```

**Request Body：**
```json
{
  "code": "9999",
  "password": "newpassword"
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | String | ✅ | 发到当前账号绑定手机的验证码，4-6位纯数字 |
| password | String | ✅ | 新密码，4-16位 |

**Response：**
```json
{
  "code": 0,
  "msg": "",
  "data": true
}
```

---

### 9. 修改绑定手机号（已登录）

```
POST /app-api/billiard/user/update-mobile
```

**Headers：**
```
Content-Type: application/json
tenant-id: 122
Authorization: Bearer {accessToken}
```

**Request Body：**
```json
{
  "mobile": "13900139001",
  "code": "9999",
  "oldCode": "9999"
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mobile | String | ✅ | 新手机号 |
| code | String | ✅ | 新手机号收到的验证码，4-6位纯数字 |
| oldCode | String | ✅ | 原手机号收到的验证码，4-6位纯数字 |

**Response：**
```json
{
  "code": 0,
  "msg": "",
  "data": true
}
```

---

### 10. 微信小程序一键登录

```
POST /app-api/member/auth/weixin-mini-app-login
```

> ⚠️ 需要真实微信小程序配置，测试阶段暂不可用

**Request Body：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | String | ✅ | 微信小程序 wx.login() 返回的 code |
| state | String | ❌ | 状态值 |
| socialType | Integer | ❌ | 社交平台类型 |
| socialCode | String | ❌ | 社交授权码 |
| socialState | String | ❌ | 社交 state |

**Response：** 格式同接口 2

---

### 11. 社交登录（微信公众号等）

```
POST /app-api/member/auth/social-login
```

> ⚠️ 需要真实社交平台配置，测试阶段暂不可用

**Request Body：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | Integer | ✅ | 社交平台类型（微信公众号=31） |
| code | String | ✅ | OAuth 授权码 |
| state | String | ✅ | 授权 state |

**Response：** 格式同接口 2

---

### 12. 获取社交授权跳转 URL

```
GET /app-api/member/auth/social-auth-redirect?type={type}&redirectUri={redirectUri}
```

> ⚠️ 需要真实社交平台配置，测试阶段暂不可用

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | Integer | ✅ | 社交平台类型 |
| redirectUri | String | ❌ | 授权后回调地址 |

**Response：**
```json
{
  "code": 0,
  "msg": "",
  "data": "https://open.weixin.qq.com/connect/oauth2/authorize?..."
}
```

---

## Token 说明

| 项目 | 值 |
|------|-----|
| accessToken 有效期 | 30 分钟 |
| refreshToken 有效期 | 30 天 |
| 登录后请求 Header | `Authorization: Bearer {accessToken}` |

---

## 通用错误码

| code | 说明 |
|------|------|
| 0 | 成功 |
| 401 | 未登录 / Token 过期 |
| 429 | 请求过于频繁（触发限流） |
| 1002004000 | 用户不存在 |
| 1002004001 | 账号被禁用 |
| 1002004003 | 密码错误 |
| 1002004010 | 验证码不存在或已过期 |
| 1002004011 | 验证码错误 |
