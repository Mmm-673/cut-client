# 助教现场开单与后付费客户端接入文档（用户/会员端）

## 1. 文档说明

- 适用客户端：
  - 用户 App（平台会员）。
- 适用服务类型：
  - `1`：台球陪练；
  - `2`：达人带路；
  - `3`：酒文化讲解；
  - `4`：影视讲解分享。
- 新功能版本条件：请求头 `client-version` **严格大于** `1.0.0`。
- 测试环境统一使用：`tenant-id: 122`。
- 金额单位：除非字段另有说明，所有金额均为整数分。
- 时间来源：服务开始时间、结束时间和计费时长均以服务端为准。

本次新增的是独立的"助教现场开单、服务结束后付款"流程，不替换现有"用户预约、服务前付款"流程。

现场订单的核心特点：

1. 订单由助教创建，只能由创建助教本人履约；
2. 创建时不填写预约时间和预约时长；
3. 服务开始前不创建支付单；
4. 服务结束后，服务端按实际服务时长锁定金额；
5. 支持会员 App 内微信/支付宝支付；
6. 第一笔有效支付成功后才进入结算；
7. 现场订单不支持加钟、开始后取消或常规退款；
8. 本期现场订单不发送开始、结束或支付成功通知，客户端必须主动刷新状态。

> 说明：无会员/散客订单通过助教 App 展示的微信或支付宝原生二维码完成支付，不在用户 App 中体现。

---

## 2. 客户端版本兼容规则

后端通过请求头 `client-version` 判断是否开放现场订单接口。

| `client-version` | 行为 |
|---|---|
| 缺失 | 不开放现场订单 |
| 格式非法，例如 `v1.0.1`、`1.0` | 不开放现场订单 |
| 小于 `1.0.0` | 不开放现场订单 |
| 等于 `1.0.0` | 不开放现场订单 |
| 大于 `1.0.0`，例如 `1.0.1` | 开放现场订单 |

新版本客户端每次请求应统一携带：

```http
tenant-id: 122
Authorization: Bearer {accessToken}
client-platform: android
client-version: 1.0.1
```

`client-version` 必须使用三段式数字版本：

```text
主版本号.次版本号.修订版本号
```

版本不满足时，服务端返回：

```json
{
  "code": 1010000337,
  "data": null,
  "msg": "请升级客户端后使用现场开单"
}
```

客户端处理要求：

1. 旧版本客户端不展示现场订单入口；
2. 收到 `1010000337` 后停止重试；
3. 提示用户升级客户端；
4. 订单创建成功后，后续流程以订单来源和订单状态为准，不再根据客户端版本推断业务规则。

匿名收银台状态接口不要求登录，也不检查 `client-version`。

---

## 3. 通用响应结构

所有接口统一返回：

```json
{
  "code": 0,
  "data": {},
  "msg": ""
}
```

客户端必须判断响应体中的 `code`，不能只判断 HTTP 状态码。

分页接口的 `data` 结构：

```json
{
  "list": [],
  "total": 0
}
```

分页参数：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---:|---:|---|
| `pageNo` | int | 否 | `1` | 最小值为 1 |
| `pageSize` | int | 否 | `10` | 范围为 1～200 |

---

## 4. 状态枚举

### 4.1 现场订单状态 `status`

| 值 | 名称 | 现场订单含义 |
|---:|---|---|
| `15` | 待开始 | 助教已创建，可修改返程车费、取消或开始服务（会员端不可见） |
| `40` | 进行中 | 服务正在计时，会员端只读 |
| `45` | 现场待付款 | 服务已结束，时长和金额已锁定，可以发起支付 |
| `50` | 待评价 | 会员订单已支付并结算成功，等待评价 |
| `60` | 已完成 | 散客订单支付结算成功，或会员订单完成评价 |
| `70` | 已取消 | 助教在开始服务前取消（会员端不可见） |

完整流转（会员视角）：

```text
40 进行中（服务开始后会员端才可见）
→ 45 现场待付款
→ 50 待评价
→ 60 已完成
```

开始前取消（会员端不可见）：

```text
15 待开始
→ 70 已取消
```

### 4.2 支付主状态 `paymentStatus`

| 值 | 名称 | 客户端处理 |
|---:|---|---|
| `0` | 未支付 | 可以创建支付尝试 |
| `10` | 已支付 | 禁止再次支付，继续等待或查询结算结果 |
| `20` | 支付异常 | 停止支付并提示联系客服 |

### 4.3 支付尝试状态 `attemptStatus`

| 值 | 名称 | 说明 |
|---:|---|---|
| `0` | 等待支付 | 支付单已创建，尚未收到成功回调 |
| `10` | 支付成功 | 当前尝试是订单第一笔有效支付 |
| `20` | 失败 | 创建支付单失败 |
| `30` | 已过期 | 支付尝试已过期 |
| `40` | 重复支付成功 | 订单已有其他有效支付，本次属于重复扣款异常 |
| `50` | 金额不一致 | 渠道实付金额与订单锁定金额不一致 |

### 4.4 结算状态 `settlementStatus`

| 值 | 名称 | 客户端处理 |
|---:|---|---|
| `0` | 未开始 | 尚未认定有效支付 |
| `10` | 处理中 | 已支付，正在结算；禁止再次支付 |
| `20` | 成功 | 支付和结算均成功 |
| `30` | 失败待重试 | 已支付，后台会自动补偿；禁止再次支付 |

关键判断：

```text
paymentStatus = 0
→ 尚未支付，可以展示支付入口

paymentStatus = 10 且 settlementStatus = 10
→ 支付成功，结算处理中

paymentStatus = 10 且 settlementStatus = 20
→ 支付和结算成功

paymentStatus = 10 且 settlementStatus = 30
→ 支付成功，后台补偿处理中
```

只要 `paymentStatus = 10`，客户端就必须关闭所有支付按钮，即使订单暂时仍是 `status = 45`。

---

## 5. 客户类型与服务类型

### 5.1 客户类型 `customerType`

| 值 | 类型 | 说明 |
|---:|---|---|
| `1` | 平台会员 | 用户 App 中展示的现场订单均为此类型 |
| `2` | 无会员/散客 | 不在用户 App 中展示 |

### 5.2 服务类型 `serviceType`

| 值 | 名称 |
|---:|---|
| `1` | 台球陪练 |
| `2` | 达人带路 |
| `3` | 酒文化讲解 |
| `4` | 影视讲解分享 |

现场订单不需要用户端操作：

- 服务地点；
- 预约时间；
- 预约时长；
- 确认出发；
- 确认到达；
- 加钟。

---

## 6. 会员端完整流程

```text
助教创建有会员现场订单
→ 开始服务前，会员 App 不可见
→ 助教开始服务
→ 会员 App 现场订单列表出现该订单
→ 服务中只读查看
→ 助教结束服务
→ 会员 App 显示最终金额和支付入口
→ 会员选择微信 App 或支付宝 App 支付
→ 支付结算成功后进入待评价
```

会员不能：

- 取消现场订单；
- 开始或结束服务；
- 修改返程车费；
- 修改服务时长；
- 修改支付金额；
- 加钟。

无会员/散客订单永远不会出现在会员 App。

---

## 7. 现场订单响应字段

`OnsiteOrderRespVO`：

| 字段 | 类型 | 可空 | 说明 |
|---|---|---:|---|
| `id` | long | 否 | 订单 ID |
| `orderNo` | string | 否 | 展示订单号 |
| `userId` | long | 是 | 会员 ID；散客为空 |
| `coachId` | long | 否 | 助教 ID |
| `customerType` | int | 否 | `1` 会员，`2` 无会员 |
| `serviceType` | int | 否 | 服务类型 1～4 |
| `status` | int | 否 | 订单状态 |
| `unitPrice` | int | 否 | 小时单价，单位分/小时 |
| `billingMinutes` | int | 是 | 计费分钟数，结束锁价后返回 |
| `actualDurationSeconds` | long | 是 | 实际服务秒数，结束锁价后返回 |
| `returnTravelAmount` | int | 否 | 返程车费，单位分 |
| `payAmount` | int | 是 | 最终应付金额，结束锁价后返回 |
| `paymentStatus` | int | 否 | 支付主状态 |
| `settlementStatus` | int | 否 | 结算状态 |
| `startTime` | datetime | 是 | 服务端开始时间 |
| `endTime` | datetime | 是 | 服务端结束时间 |

只有以下状态返回最终计费字段：

- `45` 现场待付款；
- `50` 待评价；
- `60` 已完成。

在 `40` 状态中：

```text
billingMinutes = null
actualDurationSeconds = null
payAmount = null
```

`returnTravelAmount` 始终返回。

---

## 8. 订单列表和详情

### 8.1 分页

```http
GET /app-api/billiard/onsite-order/page?pageNo=1&pageSize=10
```

只返回：

- 当前会员绑定的现场订单；
- 已经开始服务的现场订单。

### 8.2 详情

```http
GET /app-api/billiard/onsite-order/get?id={orderId}
```

进行中页面：

- 展示服务类型；
- 展示助教；
- 展示开始时间；
- 展示实时服务时长；
- 展示小时单价；
- 展示返程车费；
- 不展示最终应付金额；
- 不展示支付按钮。

服务结束待支付页面：

- 展示开始、结束时间；
- 展示实际秒数和计费分钟；
- 展示小时单价；
- 展示返程车费；
- 展示最终应付金额；
- 展示微信、支付宝 App 支付入口。

---

## 9. 支付方式总览

| 场景 | 接口 | 推荐渠道 | 客户端后续动作 |
|---|---|---|---|
| 会员 App 支付 | `/app-api/billiard/onsite-payment/create` | `wx_app`、`alipay_app` | 使用返回的 `payOrderId` 调用现有支付提交接口 |

现场订单不支持：

- 钱包支付；
- 现金确认；
- 手工确认已付款；
- 客户修改支付金额；
- 聚合支付二维码。

> 散客通过助教 App 展示的微信 Native / 支付宝扫码二维码完成支付，不经过用户 App。

---

## 10. 会员端 App 支付

### 10.1 创建支付尝试

```http
POST /app-api/billiard/onsite-payment/create
```

请求：

```json
{
  "orderId": 30001,
  "channelCode": "alipay_app"
}
```

规则：

- 当前会员必须是订单绑定会员；
- 订单必须已结束并锁价；
- 散客订单不能调用；
- 推荐使用 `wx_app` 或 `alipay_app`。

成功后，使用响应中的 `payOrderId` 调用现有支付提交接口：

```http
POST /app-api/pay/order/submit
```

调用过程与当前用户 App 已有支付接入保持一致。

响应示例：

```json
{
  "code": 0,
  "data": {
    "paymentId": 50001,
    "attemptId": 51001,
    "payOrderId": 60001,
    "orderId": 30001,
    "merchantOrderNo": "ONSITE_30001_51001",
    "amount": 13600,
    "paymentStatus": 0,
    "attemptStatus": 0,
    "settlementStatus": 0,
    "channelCode": "alipay_app",
    "displayMode": null,
    "displayContent": null,
    "cashierToken": null,
    "cashierExpireTime": null
  },
  "msg": ""
}
```

该接口只创建支付单，不拉起 App 支付。

调用时必须使用现场支付创建响应中的：

- `payOrderId` 作为 `id`；
- 原 `channelCode`；
- 不传金额。

注意：

- 每次调用 `/create` 都会创建新的支付尝试；
- 客户端必须防重复点击；
- 支付结果不确定时先查询状态，不要立即创建新尝试；
- 第一笔有效支付成功后，其他支付入口全部关闭。

---

## 11. 支付响应字段

`OnsitePaymentRespVO`：

| 字段 | 类型 | 可空 | 说明 |
|---|---|---:|---|
| `paymentId` | long | 否 | 现场支付聚合 ID |
| `attemptId` | long | 是 | 本次支付尝试 ID |
| `payOrderId` | long | 是 | pay 模块支付单 ID |
| `orderId` | long | 否 | 现场订单 ID |
| `merchantOrderNo` | string | 是 | 商户支付单号 |
| `amount` | int | 否 | 固定支付金额，单位分 |
| `paymentStatus` | int | 否 | 支付主状态 |
| `attemptStatus` | int | 是 | 本次尝试状态 |
| `settlementStatus` | int | 否 | 结算状态 |
| `channelCode` | string | 是 | 本次固定支付渠道 |
| `displayMode` | string | 是 | 二维码成功时为 `qr_code`（会员端 App 支付不使用） |
| `displayContent` | string | 是 | 渠道原生二维码正文（会员端 App 支付不使用） |
| `cashierToken` | string | 是 | 匿名只读状态查询凭证（会员端 App 支付不使用） |
| `cashierExpireTime` | datetime | 是 | 匿名查询凭证和二维码页面有效期（会员端 App 支付不使用） |

---

## 12. 支付状态查询和轮询

### 12.1 会员端查询

```http
GET /app-api/billiard/onsite-payment/status?orderId={orderId}
```

响应示例：

```json
{
  "code": 0,
  "data": {
    "paymentId": 50001,
    "attemptId": null,
    "payOrderId": null,
    "orderId": 30001,
    "merchantOrderNo": null,
    "amount": 13600,
    "paymentStatus": 10,
    "attemptStatus": null,
    "settlementStatus": 20,
    "channelCode": null,
    "displayMode": null,
    "displayContent": null,
    "cashierToken": null,
    "cashierExpireTime": null
  },
  "msg": ""
}
```

建议轮询策略：

1. 支付拉起后，每 2～3 秒查询一次；
2. 页面进入后台时暂停轮询；
3. 页面回到前台时立即查询一次；
4. 连续轮询建议设置上限，避免永久请求；
5. `paymentStatus = 10` 后停止支付轮询；
6. 若 `settlementStatus = 10/30`，可以降低频率继续查询订单详情；
7. 不要因为结算尚未成功而重新发起支付。

### 12.2 支付后的页面处理

```text
拉起支付
→ 会员完成支付
→ 会员 App 轮询支付状态
→ paymentStatus 变为 10
→ 立即隐藏所有支付按钮
→ settlementStatus 为 10 时显示"支付成功，订单处理中"
→ settlementStatus 为 20 时显示"支付成功"
→ 刷新订单详情
→ 进入待评价状态
```

---

## 13. 匿名收银台状态查询（了解即可）

匿名状态查询不是支付提交接口，只用于受控查询某个二维码支付尝试。

会员端通常不需要调用这些接口，这里列出仅供了解散客扫码支付的查询机制。

### 13.1 获取状态

```http
POST /app-api/billiard/onsite-cashier/get
Content-Type: application/json
```

请求：

```json
{
  "token": "{cashierToken}"
}
```

### 13.2 轮询状态

```http
POST /app-api/billiard/onsite-cashier/status
Content-Type: application/json
```

请求体相同。

两个接口当前均为只读查询。

注意：

- 没有 `/app-api/billiard/onsite-cashier/submit` 接口；
- 匿名客户不需要调用平台接口发起支付；
- 客户直接扫描微信/支付宝原生二维码；
- 匿名接口不会重新返回 `displayContent`；
- 每个 IP 每分钟最多调用 30 次；
- Token 过期后返回 `1010000343`。

---

## 14. 客户端按钮状态建议

| 订单状态 | 显示按钮 |
|---:|---|
| `40` 进行中 | 只读，无操作按钮 |
| `45` 未支付 | 微信支付、支付宝支付 |
| `45` 已支付、结算处理中 | 无支付按钮，显示处理中 |
| `50` 待评价 | 评价 |
| `60` 已完成 | 查看详情 |

客户端不能只看 `status` 判断是否允许再次支付，还必须同时检查 `paymentStatus`。

---

## 15. 幂等和重复点击处理

| 操作 | 幂等性 | 客户端要求 |
|---|---|---|
| 创建 App 支付 | 每次新建尝试 | 防重复点击 |
| 支付回调 | 服务端幂等 | 客户端无需处理回调重试 |
| 状态查询 | 幂等 | 可以安全轮询 |

---

## 16. 主要错误码

| 错误码 | 消息 | 客户端处理 |
|---:|---|---|
| `1010000337` | 请升级客户端后使用现场开单 | 停止重试，引导升级 |
| `1010000338` | 当前现场订单状态不允许该操作 | 刷新订单详情和按钮 |
| `1010000341` | 现场订单尚未结束或金额未锁定 | 刷新订单，等待结束锁价 |
| `1010000342` | 现场订单已支付 | 关闭支付入口，查询状态 |
| `1010000343` | 收银台凭证无效或已过期 | 停止使用旧 Token |

还可能返回：

| 错误码常量 | 消息 | 场景 |
|---|---|---|
| `ORDER_NOT_BELONG_TO_USER` | 订单不属于当前用户 | 会员越权访问 |

Bean Validation 参数错误会返回通用参数错误。客户端应直接展示服务端 `msg`，并针对上述业务码做页面状态修正。

---

## 17. 页面恢复与状态同步

本期现场订单不发送通知，因此客户端必须做好主动恢复：

### 17.1 用户 App

进入订单中心时：

```text
请求现场订单列表
→ 服务进行中显示实时计时
→ 待支付显示支付入口
→ 已支付处理中关闭支付入口
```

---

## 18. 客户端本地数据建议

客户端可以临时保存：

- 当前现场订单 ID；
- 当前支付响应中的：
  - `attemptId`；
  - `payOrderId`；
  - `channelCode`。

不要长期缓存：

- 支付状态；
- 结算状态；
- 最终订单状态。

支付和订单状态必须以服务端查询结果为准。

---

## 19. 联调检查清单

### 19.1 通用

- [ ] 所有登录态请求携带 `tenant-id: 122`
- [ ] 所有现场登录态接口携带 `client-version > 1.0.0`
- [ ] 客户端正确处理 `CommonResult.code`
- [ ] 金额全部按"分"处理
- [ ] 不使用浮点数累加金额

### 19.2 会员端

- [ ] 开始前不展示现场订单
- [ ] 进行中订单只读
- [ ] 进行中不展示最终金额和支付按钮
- [ ] 服务结束后展示固定金额支付入口
- [ ] 散客订单不会进入会员 App
- [ ] 支付后按绑定会员提供评价入口

### 19.3 支付状态

- [ ] 支付中每 2～3 秒查询一次
- [ ] App 进入后台时暂停轮询
- [ ] App 回前台时立即查询
- [ ] `paymentStatus = 10` 后关闭所有支付入口
- [ ] `settlementStatus = 10/30` 时不允许再次支付
- [ ] 支付成功后刷新订单详情

---

## 20. 接口汇总

### 20.1 会员端

| 方法 | 接口 | 说明 |
|---|---|---|
| GET | `/app-api/billiard/onsite-order/page` | 会员现场订单分页 |
| GET | `/app-api/billiard/onsite-order/get` | 会员现场订单详情 |
| POST | `/app-api/billiard/onsite-payment/create` | 创建会员 App 支付尝试 |
| GET | `/app-api/billiard/onsite-payment/status` | 查询支付和结算状态 |

### 20.2 匿名状态查询（了解即可）

| 方法 | 接口 | 说明 |
|---|---|---|
| POST | `/app-api/billiard/onsite-cashier/get` | Token 查询支付摘要 |
| POST | `/app-api/billiard/onsite-cashier/status` | Token 轮询支付状态 |

不存在以下接口：

```http
POST /app-api/billiard/onsite-cashier/submit
```

客户通过微信或支付宝扫描原生渠道二维码完成支付，不调用平台匿名提交接口。

---

## 21. 测试请求头

会员端：

```http
tenant-id: 122
Authorization: Bearer {memberTestAccessToken}
client-platform: android
client-version: 1.0.1
```

匿名状态查询：

```http
tenant-id: 122
Content-Type: application/json
```

---

## 22. 最终客户端实现要点

1. 现场订单是独立流程，不复用预约订单的相关页面；
2. 服务计时以服务端 `startTime` 为准，仅用于展示；
3. 最终金额只能使用服务端返回的 `payAmount`；
4. 会员端支付使用 `wx_app` 或 `alipay_app`；
5. 支付金额已经锁定，客户端不提供修改金额能力；
6. 支付状态必须主动轮询；
7. `paymentStatus = 10` 后绝不能再次支付；
8. 现场订单本期没有消息通知，页面恢复必须主动查询；
9. 只有已开始服务的有会员订单才出现在用户 App 中；
10. 所有联调先在测试环境和租户 `122` 完成。
