# 用户端 - 重大通知 API 文档

## 一、公共配置

### 测试环境

| 项目 | 值 |
|------|-----|
| HTTP BaseURL | `https://www.qiulem.com/test` |
| WebSocket | `wss://www.qiulem.com/test/infra/ws?token={accessToken}` |
| tenant-id | `122` |

### HTTP 请求头

```
Authorization: Bearer {accessToken}
tenant-id: 122
```

> 用户端使用用户 Token。WebSocket 地址与助教端相同，后端根据 Token 自动识别用户身份。

---

## 二、重大通知 WebSocket

### 1. 建立连接

```
wss://www.qiulem.com/test/infra/ws?token={用户AccessToken}
```

> 只有后台发布的"重大通知"会发送该消息，普通公告、活动通知、版本更新不会触发。

### 2. 消息格式

WebSocket 收到的第一层数据：

```json
{
  "type": "billiard_major_notification",
  "content": "{\"notificationId\":1001,\"notificationType\":1,\"title\":\"初球来电重大通知\",\"summary\":\"通知摘要\",\"coverUrl\":null,\"publishTime\":\"2026-08-28T10:30:00\",\"actionType\":1,\"actionValue\":null,\"actionParams\":null}"
}
```

> **注意：** `content` 是 JSON 字符串，需要再次解析。

**解析示例：**

```javascript
const message = JSON.parse(event.data)

if (message.type === 'billiard_major_notification') {
  const notification = JSON.parse(message.content)
  // 根据 notificationId 去重并展示重大通知
  console.log(notification)
}
```

### content 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| notificationId | Long | 通知ID，同时用于消息去重 |
| notificationType | Integer | 通知类型，重大通知固定为 `1` |
| title | String | 通知标题 |
| summary | String | 通知摘要 |
| coverUrl | String / null | 封面图片 |
| publishTime | String | 发布时间 |
| actionType | Integer | 点击行为类型 |
| actionValue | String / null | 跳转目标 |
| actionParams | String / null | 跳转参数，可能也是 JSON 字符串 |

### actionType 取值说明

| 值 | 含义 |
|----|------|
| 0 | 不跳转 |
| 1 | 打开通知详情 |
| 2 | 打开 App 内指定页面 |
| 3 | 打开 HTTPS 网页 |
| 4 | App 版本更新 |

### 3. 收到消息后的处理建议

1. 根据 `notificationId` 去重。
2. 展示 App 内通知提醒。
3. 点击后调用用户通知详情接口。
4. WebSocket 消息本身不会自动标记已读。
5. 断线重连后不会补发历史 WebSocket 消息，需要刷新未读数量或通知列表。

---

## 三、通知相关 HTTP 接口

### 1. 通知详情

**接口地址：** `GET /app-api/billiard/notification-center/get`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 通知ID |

**示例：**

```
GET /app-api/billiard/notification-center/get?id=1001
```

---

### 2. 未读数量

**接口地址：** `GET /app-api/billiard/notification-center/unread-count`

**请求参数：** 无

---

### 3. 标记已读

**接口地址：** `POST /app-api/billiard/notification-center/read`

**Content-Type：** `application/json`

**请求体：**

```json
{
  "id": 1001
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Long | 是 | 通知ID |

---

## 四、注意事项

- WebSocket 连接应在登录成功后建立。
- Token 刷新后需要断开旧连接并使用新 Token 重连。
- 断线建议按 **1、2、5、10、30 秒**递增重试。
- 如极光通知和 WebSocket 同时到达，使用 `notificationId` 去重。
