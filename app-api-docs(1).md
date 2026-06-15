# 用户 App 端接口文档

> 本文档涵盖台球陪练平台用户 App 端（`/app-api/billiard/**`）的核心接口定义，包含助教、订单、支付、计时、钱包、异常订单等模块。

## 1. 助教模块

Controller 类：`AppCoachController`
建议包路径：`cn.iocoder.yudao.module.billiard.controller.app.coach.AppCoachController`
注解路由：`@RequestMapping("/billiard/coach")`

### 1.1 GET /app-api/billiard/coach/list — 在线助教分页列表

**功能**：返回当前 work_status=1（在线）的助教列表，支持关键词搜索（搜索助教艺名或球厅名称）、标签筛选、距离排序。

**请求参数：**


| 参数名         | 类型      | 必填  | 说明                       |
| ----------- | ------- | --- | ------------------------ |
| `pageNo`    | int     | 否   | 页码，默认 1                  |
| `pageSize`  | int     | 否   | 每页数量，默认 20               |
| `keyword`   | string  | 否   | 关键词，匹配艺名或球厅名称            |
| `city`      | string  | 否   | 城市筛选（如“杭州市”）             |
| `level`     | tinyint | 否   | 技术等级：0=初级 1=中级 2=高级      |
| `tag`       | string  | 否   | 标签筛选（如：新人、低碳出行），枚举值待运营确认 |
| `longitude` | decimal | 否   | 用户当前经度（用于距离排序）           |
| `latitude`  | decimal | 否   | 用户当前纬度（用于距离排序）           |


**响应字段（单条助教卡片）：**


| 字段             | 类型      | 必填  | 说明                       |
| -------------- | ------- | --- | ------------------------ |
| `id`           | bigint  | 是   | 助教ID                     |
| `stageName`    | string  | 是   | 艺名                       |
| `mainPhotoUrl` | string  | 否   | 主图 URL                   |
| `level`        | tinyint | 是   | 助教级别：0=初级 1=中级 2=高级      |
| `serviceCount` | int     | 是   | 累计服务次数                   |
| `overallScore` | decimal | 是   | 综合评分                     |
| `distance`     | decimal | 否   | 与用户的距离（km），未传经纬度时返回 null |
| `tags`         | string  | 否   | 标签列表（逗号分隔，如：新人、免费出行）     |
| `gender`       | tinyint | 否   | 性别（1=男 2=女 0=未知）         |
| `favorite`     | boolean | 是   | 当前用户是否已收藏该助教           |


**排序逻辑（ORDER BY 语义）：**

```sql
ORDER BY manual_rank ASC, overall_score DESC, distance ASC
```

- `manual_rank`：后台人工设置，优先级最高；默认 9999 排末位
- `overall_score`：综合评分，同 rank 时按评分降序
- `distance`：距离，同 rank 和 score 时按由近到远排列

距离计算：前端传入经纬度，后端在 SQL 中使用 MySQL 原生函数 `ST_Distance_Sphere` 计算（需 MySQL 5.7+）：

```sql
ST_Distance_Sphere(
    POINT(#{longitude}, #{latitude}),
    POINT(coach_longitude, coach_latitude)
) / 1000  AS distance_km
```

> 当前 `billiard_coach` 表暂未设计经纬度字段（助教无固定驻点），距离计算基于助教的 `contact_address` 解析出的坐标，或直接由前端标注位置后传参。**具体方案待确认（见第 7 节问题 1）**。

**固定过滤条件（强制）：**

```sql
WHERE bc.work_status = 1
  AND bc.status = 1
  AND bc.deleted = 0
```

---

### 1.2 GET /app-api/billiard/coach/new-list — 新人助教列表

**功能**：返回新人助教列表，按照助教注册时间（`create_time`）倒序排列。

**请求参数：**


| 参数名     | 类型  | 必填  | 说明         |
| ------- | --- | --- | ---------- |
| `limit` | int | 否   | 返回数量，默认 10 |


**响应字段（单条助教卡片）：**


| 字段             | 类型      | 必填  | 说明               |
| -------------- | ------- | --- | ---------------- |
| `id`           | bigint  | 是   | 助教ID             |
| `stageName`    | string  | 是   | 艺名               |
| `mainPhotoUrl` | string  | 否   | 主图 URL           |
| `gender`       | tinyint | 否   | 性别（1=男 2=女 0=未知） |
| `favorite`     | boolean | 是   | 当前用户是否已收藏该助教   |


**排序逻辑：**
按照 `create_time` 降序。

**固定过滤条件（强制）：**

```sql
WHERE bc.status = 1
  AND bc.deleted = 0
```

---

### 1.3 GET /app-api/billiard/coach/hot-list — 热门助教列表

**功能**：返回热门助教列表，按照助教接单数量（`service_count`）倒序排列。

**请求参数：**


| 参数名     | 类型  | 必填  | 说明         |
| ------- | --- | --- | ---------- |
| `limit` | int | 否   | 返回数量，默认 10 |


**响应字段（单条助教卡片）：**


| 字段             | 类型      | 必填  | 说明               |
| -------------- | ------- | --- | ---------------- |
| `id`           | bigint  | 是   | 助教ID             |
| `stageName`    | string  | 是   | 艺名               |
| `mainPhotoUrl` | string  | 否   | 主图 URL           |
| `gender`       | tinyint | 否   | 性别（1=男 2=女 0=未知） |
| `favorite`     | boolean | 是   | 当前用户是否已收藏该助教   |
| `serviceCount` | int     | 是   | 累计服务次数           |
| `overallScore` | decimal | 是   | 综合评分             |


**排序逻辑：**
按照 `service_count` 降序。

**固定过滤条件（强制）：**

```sql
WHERE bc.status = 1
  AND bc.deleted = 0
```

---

### 1.4 GET /app-api/billiard/coach/get?id={id} — 助教详情

**功能**：返回指定助教的完整个人信息，用于助教主页展示。

**请求参数：**


| 参数名  | 类型     | 必填  | 说明                       |
| ---- | ------ | --- | ------------------------ |
| `id` | bigint | 是   | 助教ID (billiard_coach.id) |


**q响应字段：**


| 字段                  | 类型      | 必填  | 说明                  |
| ------------------- | ------- | --- | ------------------- |
| `id`                | bigint  | 是   | 助教ID                |
| `stageName`         | string  | 是   | 艺名                  |
| `age`               | int     | 否   | 年龄                  |
| `constellation`     | string  | 否   | 星座                  |
| `height`            | int     | 否   | 身高（cm）              |
| `weight`            | decimal | 否   | 体重（kg）              |
| `profession`        | string  | 否   | 职业                  |
| `level`             | tinyint | 是   | 助教级别：0=初级 1=中级 2=高级 |
| `serviceCount`      | int     | 是   | 累计服务次数              |
| `overallScore`      | decimal | 是   | 综合评分                |
| `introduction`      | string  | 否   | 简介                  |
| `photos`            | array   | 否   | 照片列表（对象数组）          |
| `photos[].id`       | bigint  | 是   | 照片ID                |
| `photos[].photoUrl` | string  | 是   | 照片URL               |
| `photos[].sort`     | int     | 是   | 排序值                 |
| `photos[].isMain`   | boolean | 是   | 是否主图                |
| `favorite`          | boolean | 是   | 当前用户是否已收藏该助教       |
| `workStatus`        | tinyint | 是   | 在线状态：0=下线 1=在线       |
| `serviceStatus`     | tinyint | 是   | 接单状态：0=空闲 1=服务中（包含已接单/进行中） |
| `currentOrderExpectedEndTime` | long | 否 | 当前执行订单预计结束时间（毫秒时间戳）；`serviceStatus=1` 时返回，已接单未开始按 `bookingTime + serviceDuration` 计算，进行中优先按 `startTime + serviceDuration` 计算 |


**鉴权**：`@PermitAll` 或用户登录态均可访问（详情页不限制未登录用户浏览）

---

### 1.5 POST /app-api/billiard/coach/favorite — 收藏/取消收藏助教

**功能**：用户收藏或取消收藏指定的助教。若当前未收藏则新增收藏，若已收藏则取消收藏。

**请求体：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `coachId` | bigint | 是 | 助教ID |

**响应：**

返回布尔值，`true` 表示当前状态为已收藏，`false` 表示当前状态为未收藏。

**鉴权**：需要用户 App 登录态（`member_user` Token）

---

### 1.6 GET /app-api/billiard/coach/favorite-page — 用户收藏助教分页列表

**功能**：分页查询当前用户收藏的助教列表，按照收藏时间倒序排列。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pageNo` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页数量，默认 10 |

**响应字段（单条助教卡片）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 助教ID |
| `stageName` | string | 是 | 艺名 |
| `mainPhotoUrl` | string | 否 | 主图 URL |
| `gender` | tinyint | 否 | 性别（1=男 2=女 0=未知） |
| `level` | tinyint | 是 | 助教级别：0=初级 1=中级 2=高级 |
| `workStatus` | tinyint | 是 | 工作状态：0=下线 1=在线 |
| `serviceStatus` | tinyint | 是 | 服务状态：0=空闲 1=服务中 |
| `overallScore` | decimal | 是 | 综合评分 |
| `favoriteTime` | datetime | 是 | 收藏时间 |

**鉴权**：需要用户 App 登录态（`member_user` Token）

---

## 2. 订单模块

Controller 类：`AppOrderController`
建议包路径：`cn.iocoder.yudao.module.billiard.controller.app.order.AppOrderController`
注解路由：`@RequestMapping("/billiard/order")`
鉴权：所有接口均需用户 App 登录态（`member_user` Token）

### 2.1 POST /app-api/billiard/order/create — 创建订单

**功能**：用户提交订单，进入 PENDING_PAYMENT 状态，同步创建 pay 支付单。

**请求体（AppOrderCreateReqVO）：**


| 字段                | 类型      | 必填  | 说明                                 |
| ----------------- | ------- | --- | ---------------------------------- |
| `coachId`         | bigint  | 是   | 助教ID（billiard_coach.id），必须为在线状态    |
| `serviceType`     | tinyint | 是   | 服务类型：1=台球陪练 2=达人带路                   |
| `bookingTime`     | long    | 是   | 预约服务开始时间（毫秒时间戳，例如 `1774942453000`） |
| `serviceDuration` | int     | 是   | 预定时长（分钟），台球陪练 >= 120，达人带路 >= 300     |
| `quantity`        | int     | 是   | 份数或小时数，用于金额计算                      |
| `venueId`         | bigint  | 否   | 台球陪练可传合作球厅ID；达人带路不强制                 |
| `venueName`       | string  | 否   | 服务地址名称（球厅或达人带路约定地点）                  |
| `venueAddress`    | string  | 否   | 服务地址文本，达人带路场景可由前端约定地点回填              |
| `venueLongitude`  | decimal | 否   | 服务地址经度，用于导航与车费测算                   |
| `venueLatitude`   | decimal | 否   | 服务地址纬度，用于导航与车费测算                   |
| `couponId`        | bigint  | 否   | 使用的优惠券ID；不使用则不传                    |
| `remark`          | string  | 否   | 备注，最长 500 字符                       |


**业务校验（Service 层按序执行）：**

1. 助教存在且 `work_status=1`（在线）
2. 校验请求的 `serviceType` 是否包含在该助教的 `service_items` 中（不支持的服务项目拦截）
3. 助教当前无 `ACCEPTED` / `IN_SERVICE` 状态订单（已接单或进行中时拒绝新订单）
4. 地址校验：
  - `serviceType=台球陪练`：`venueId` 或 `venueName + venueAddress + 经纬度` 至少一套有效
  - `serviceType=达人带路`：允许不传合作球厅，使用约定地址（可为空，若为空则按城市默认车费兜底）
5. 若传 `venueId`，从 `billiard_venue` 取名称/地址/经纬度快照
6. 调用高德路径 API 计算驾车单程距离，往返距离 = 单程 × 2
7. 读取省市每公里单价（优先级：市 > 省 > 全国默认）
8. 计算费用：
  - `service_amount = unit_price × quantity`
  - `travel_amount = round(travel_round_distance_km × travel_unit_price)`
  - 若助教车费开关关闭：`travel_discount_amount = travel_amount`
  - `original_amount = service_amount + travel_amount`
  - `pay_amount = original_amount - travel_discount_amount`
9. 校验 `pay_amount > 0`

**创建流程（事务内）：**

1. 生成 `order_no`（yyyyMMddHHmmss + 6 位随机数）
2. 插入 `billiard_order`，状态 = PENDING_PAYMENT，`expire_time` = 当前时间 + 30 分钟
3. 调用 `PayOrderApi.createOrder(...)` 创建支付单，`merchantOrderId` = `ORDER_{id}`
4. 更新 `billiard_order.pay_order_id` = `ORDER_{id}`

**响应体（AppOrderCreateRespVO）：**


| 字段                     | 类型     | 必填  | 说明                                               |
| ---------------------- | ------ | --- | ------------------------------------------------ |
| `orderId`              | bigint | 是   | billiard_order.id                                |
| `orderNo`              | string | 是   | 订单号，展示用                                          |
| `payOrderId`           | bigint | 是   | pay_order.id（前端调用 /pay/order/submit 拉起支付时需要此 ID） |
| `expireTime`           | long   | 是   | 支付截止时间（毫秒时间戳），前端倒计时展示                            |
| `serviceAmount`        | int    | 是   | 服务时长费用（分）                                        |
| `travelAmount`         | int    | 是   | 车费原价（分）                                          |
| `travelDiscountAmount` | int    | 是   | 车费优惠（分，开关关闭时大于0）                                 |
| `payAmount`            | int    | 是   | 实际应付金额（分）                                        |


---

### 2.2 POST /app-api/billiard/order/pay — 发起支付

**功能**：用户选择支付渠道，调用 pay 模块提交支付。

> 说明：此接口实际上**直接复用** pay 模块的 `POST /pay/order/submit`，前端携带 `payOrderId`（即 pay_order.id）和 `channelCode` 调用即可，billiard 模块无需额外暴露接口。此节保留用于说明调用链路。

**调用链路：**

```
用户 App → POST /pay/order/submit（pay 模块）
               │ 拉起支付
               ▼
         支付渠道（微信/支付宝/钱包）
               │ 支付成功回调
               ▼
         pay 模块 → POST /app-api/billiard/pay/notify/order（business 回调）
               │
               ▼
         BilliardOrderService.handleOrderPaid(orderId)
```

---

### 2.3 POST /app-api/billiard/order/cancel — 取消订单

**功能**：用户主动取消订单，仅限特定状态。

**请求体（AppOrderCancelReqVO）：**


| 字段        | 类型     | 必填  | 说明                |
| --------- | ------ | --- | ----------------- |
| `orderId` | bigint | 是   | billiard_order.id |


**业务校验：**

- 订单归属当前登录用户
- 当前状态必须为 PENDING_PAYMENT / PENDING_ACCEPT / ACCEPTED（进行中 IN_SERVICE 不可取消）
- IN_SERVICE 状态返回业务异常：`"服务进行中，无法取消订单，如有纠纷请联系客服"`

**取消逻辑：**


| 当前状态            | 前置条件                                                        | 退款/扣费                                                                                                                                            | cancel_type |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| PENDING_PAYMENT | —                                                           | 无需退款（未付款）                                                                                                                                        | 1           |
| PENDING_ACCEPT  | —                                                           | 所有费用全额退还，`merchantRefundId=CANCEL_PENDING_{id}`                                                                                                  | 1           |
| ACCEPTED        | `departure_confirm_time IS NULL`                            | 所有费用全额退还，`merchantRefundId=CANCEL_ACCEPTED_{id}`                                                                                                 | 1           |
| ACCEPTED        | `departure_confirm_time IS NOT NULL AND start_time IS NULL` | 强制扣除往返车费作为退单费（即使助教车费开关关闭也要强制扣除）：`deduct=min(travel_amount, pay_amount)`，退款金额=`pay_amount-deduct`，记录 `forced_travel_deduct_amount/penalty_amount` | 1           |
| IN_SERVICE      | —                                                           | 不可取消（商户已到达服务地址并正常开始服务工作后无法取消），返回业务异常                                                                                                             | —           |


---

### 2.4 POST /app-api/billiard/order/add-time — 加钟

**功能**：进行中订单，用户申请延长服务时长并发起支付。

**请求体（AppOrderAddTimeReqVO）：**


| 字段           | 类型     | 必填  | 说明                |
| ------------ | ------ | --- | ----------------- |
| `orderId`    | bigint | 是   | billiard_order.id |
| `addMinutes` | int    | 是   | 加钟时长（分钟），必须为正整数   |


**业务校验：**

- 订单归属当前登录用户
- 订单状态必须为 IN_SERVICE
- `addMinutes` > 0

**加钟流程：**

1. 计算加钟金额 = `unit_price` × (`addMinutes` / 60)，加钟单价固定与基础小时单价一致
2. 调用 `PayOrderApi.createOrder(...)` 创建加钟支付单：
  - `merchantOrderId` = `ADD_TIME_{orderId}_{addMinutes}_{timestamp}`
  - `expireTime` = 当前时间 + 10 分钟
3. 返回加钟支付单 ID，前端调用 `/pay/order/submit` 拉起支付
4. 加钟支付成功回调（`handleAddTimePaid`）：
  - 更新 `billiard_order.service_duration` += `addMinutes`
  - 更新 `billiard_order.extra_pay_amount` += 加钟金额
  - 更新 `billiard_order.total_amount` = `pay_amount` + `extra_pay_amount`
  - 助教端剩余时长自动响应（通过 WebSocket 或轮询）

**响应体：**`addTimePayOrderId`（pay_order.id，前端用于拉起支付）

---

### 2.5 POST /app-api/billiard/order/delete — 删除订单

**功能**：用户主动删除已取消的订单（逻辑删除，仅对用户端隐藏）。

**请求体（AppOrderDeleteReqVO）：**


| 字段        | 类型     | 必填  | 说明                |
| --------- | ------ | --- | ----------------- |
| `orderId` | bigint | 是   | billiard_order.id |


**业务校验：**

- 订单归属当前登录用户
- 订单状态必须为 CANCELLED（70）

---

### 2.6 GET /app-api/billiard/order/page — 我的订单列表

**请求参数：**


| 参数         | 类型      | 必填  | 说明             |
| ---------- | ------- | --- | -------------- |
| `pageNo`   | int     | 否   | 页码，默认 1        |
| `pageSize` | int     | 否   | 每页数量，默认 10     |
| `status`   | tinyint | 否   | 状态筛选；不传则返回所有状态 |


**Tab 映射建议（前端分 Tab 展示）：**


| Tab  | status 值   | 说明              |
| ---- | ---------- | --------------- |
| 待付款  | 10         |                 |
| 进行中  | 20, 30, 40 | 待接单 + 已接单 + 进行中 |
| 待评价  | 50         |                 |
| 已完成  | 60         |                 |
| 已取消  | 70         |                 |
| 退款售后 | 70, 80     | 包含已取消退款、异常处理退款等 |


**固定过滤：** `user_id = 当前登录用户ID AND deleted = 0 AND user_deleted = 0`

**响应字段（单条）：**


| 字段                | 类型      | 必填  | 说明               |
| ----------------- | ------- | --- | ---------------- |
| `orderId`         | bigint  | 是   | 订单ID             |
| `orderNo`         | string  | 是   | 订单号              |
| `coachStageName`  | string  | 是   | 助教艺名             |
| `coachMainPhoto`  | string  | 否   | 助教主图 URL         |
| `serviceType`     | tinyint | 是   | 服务类型：1=台球陪练 2=达人带路 |
| `bookingTime`     | long    | 是   | 预约服务开始时间（毫秒时间戳）  |
| `serviceDuration` | int     | 是   | 预定总时长（分钟）        |
| `status`          | tinyint | 是   | 订单状态             |
| `totalAmount`     | int     | 是   | 订单总金额（分）         |
| `createTime`      | long    | 是   | 下单时间（毫秒时间戳）      |


---

### 2.6 GET /app-api/billiard/order/get?id={id} — 订单详情

**请求参数：**


| 参数名  | 类型     | 必填  | 说明                       |
| ---- | ------ | --- | ------------------------ |
| `id` | bigint | 是   | 订单ID (billiard_order.id) |


**业务校验：** 订单归属当前登录用户（防止越权访问）

**响应字段（全量）：**


| 字段                | 类型      | 必填  | 说明                                |
| ----------------- | ------- | --- | --------------------------------- |
| `id`              | bigint  | 是   | 订单ID                              |
| `orderNo`         | string  | 是   | 订单号                               |
| `coachId`         | bigint  | 是   | 助教ID                              |
| `coachStageName`  | string  | 是   | 助教艺名                              |
| `coachMainPhoto`  | string  | 否   | 助教主图 URL                          |
| `venueName`       | string  | 否   | 球厅名称                              |
| `venuePhotoUrl`   | string  | 否   | 球厅照片 URL，取球厅封面图一张                  |
| `venueAddress`    | string  | 否   | 球厅地址                              |
| `venueLongitude`  | decimal | 否   | 球厅经度                              |
| `venueLatitude`   | decimal | 否   | 球厅纬度                              |
| `serviceType`     | tinyint | 是   | 服务类型：1=台球陪练 2=达人带路                  |
| `bookingTime`     | long    | 是   | 预约服务开始时间（毫秒时间戳）                   |
| `serviceDuration` | int     | 是   | 预定总时长（分钟）                         |
| `status`          | tinyint | 是   | 订单状态                              |
| `payAmount`       | int     | 是   | 实际支付金额（分）                         |
| `extraPayAmount`  | int     | 是   | 加钟累计支付金额（分）                       |
| `totalAmount`     | int     | 是   | 订单总金额（分）                          |
| `createTime`      | long    | 是   | 下单时间（毫秒时间戳）                       |
| `payStatus`       | tinyint | 是   | 支付状态：0=未支付 10=支付成功 20=已退款 30=支付关闭 |


---

### 2.7 POST /app-api/billiard/reward/create — 一键打赏

**功能**：用户随时对助教发起打赏，生成打赏支付单。

**请求体（AppRewardCreateReqVO）：**


| 字段        | 类型     | 必填  | 说明                      |
| --------- | ------ | --- | ----------------------- |
| `coachId` | bigint | 是   | 助教ID（billiard_coach.id） |
| `amount`  | int    | 是   | 打赏金额（单位：分），必须大于 0       |


**操作：**

1. 调用 `PayOrderApi.createOrder(...)` 创建打赏支付单：
  - `merchantOrderId` = `TIP_{coachId}_{timestamp}`
  - `expireTime` = 当前时间 + 15 分钟
2. 返回打赏支付单 ID，前端调用 `/pay/order/submit` 拉起支付

**响应体：**`payOrderId`（pay_order.id，前端用于拉起支付）

### 2.8 POST /app-api/billiard/review/create — 提交评价

**功能**：用户对已完成的订单进行评价。

**请求体（AppReviewCreateReqVO）：**


| 字段            | 类型      | 必填  | 说明                 |
| ------------- | ------- | --- | ------------------ |
| `orderId`     | bigint  | 是   | billiard_order.id  |
| `star`        | int     | 是   | 星级评分（1~5）          |
| `content`     | string  | 否   | 评价文字描述             |
| `tags`        | string  | 否   | 预设标签（逗号分隔，如：专业,准时） |
| `images`      | array   | 否   | 图片 URL 数组（最多9张）    |
| `isAnonymous` | boolean | 否   | 是否匿名评价，默认 false    |


**业务校验：**

- 订单归属当前登录用户
- 订单状态必须为 PENDING_REVIEW（50）

**操作：**

1. 插入评价记录
2. 更新订单状态为 COMPLETED（60）

---

### 2.9 GET /app-api/billiard/review/coach-page — 助教主页评价列表

**功能**：用户端查看指定助教的公开评价列表，助教端历史评价接口返回内容参考本接口。

**请求参数（AppCoachReviewPageReqVO）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `coachId` | bigint | 是 | 助教ID（billiard_coach.id） |
| `pageNo` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页数量，默认 10，最大 20 |

**响应字段（分页 `list` 单条）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `reviewId` | bigint | 是 | 评价ID |
| `star` | int | 是 | 评价星级（1~5） |
| `content` | string | 否 | 评价内容 |
| `tags` | array | 是 | 标签列表 |
| `images` | array | 是 | 评价图片 URL 列表 |
| `userNickname` | string | 否 | 用户昵称；匿名评价为 `匿名用户`，非匿名评价按脱敏规则返回 |
| `userAvatar` | string | 否 | 用户头像 URL；匿名评价为 `null` |
| `isAnonymous` | boolean | 是 | 是否匿名评价 |
| `createTime` | long | 是 | 评价时间（毫秒时间戳） |

---

## 3. 支付与钱包模块

路由前缀：`/app-api`（以下均为 `yudao-module-pay` 原生路由）
鉴权：用户 App 登录态（`member_user` Token）

### 3.0 通用响应结构

所有接口统一返回 `CommonResult<T>`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `code` | int | 是 | 响应码，成功为 `0` |
| `msg` | string | 是 | 响应消息，成功通常为空字符串 |
| `data` | object/array/null | 是 | 业务数据 |

分页接口的 `data` 结构为 `PageResult<T>`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `total` | long | 是 | 总记录数 |
| `list` | array | 是 | 当前页数据列表 |

---

### 3.1 GET /app-api/pay/channel/get-enable-code-list?appId={appId} — 获取应用已开启支付渠道

**功能**：查询指定支付应用下已启用的支付渠道编码列表。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `appId` | bigint | 是 | 支付应用编号（`pay_app.id`） |

**响应字段：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `data` | array<string> | 是 | 支付渠道编码列表 |

**`data[]` 枚举值（`PayChannelEnum.code`，完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `wx_pub` | 微信 JSAPI 支付（公众号网页） |
| `wx_lite` | 微信小程序支付 |
| `wx_app` | 微信 App 支付 |
| `wx_native` | 微信 Native 支付 |
| `wx_wap` | 微信 Wap 网站支付（H5） |
| `wx_bar` | 微信付款码支付 |
| `alipay_pc` | 支付宝 PC 网站支付 |
| `alipay_wap` | 支付宝 Wap 网站支付 |
| `alipay_app` | 支付宝 App 支付 |
| `alipay_qr` | 支付宝扫码支付 |
| `alipay_bar` | 支付宝条码支付 |
| `mock` | 模拟支付 |
| `wallet` | 钱包支付 |

**HTTP 请求示例：**

```http
GET /app-api/pay/channel/get-enable-code-list?appId=1
Authorization: Bearer {member_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": [
    "wx_lite",
    "alipay_app",
    "wallet"
  ]
}
```

---

### 3.2 POST /app-api/pay/order/submit — 提交支付订单

**功能**：提交支付订单并获取拉起支付所需参数（如 prepay 信息、跳转链接、二维码内容等）。

**请求体（`AppPayOrderSubmitReqVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 支付单编号（`pay_order.id`） |
| `channelCode` | string | 是 | 支付渠道编码，枚举见下方 `PayChannelEnum` |
| `channelExtras` | map<string,string> | 否 | 渠道额外参数（如 openid） |
| `displayMode` | string | 否 | 展示模式，枚举见下方 `PayOrderDisplayModeEnum`；不传则走渠道默认模式 |
| `returnUrl` | string(URL) | 否 | 支付完成后回跳地址 |

**`channelCode` 枚举值（`PayChannelEnum.code`，完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `wx_pub` | 微信 JSAPI 支付（公众号网页） |
| `wx_lite` | 微信小程序支付 |
| `wx_app` | 微信 App 支付 |
| `wx_native` | 微信 Native 支付 |
| `wx_wap` | 微信 Wap 网站支付（H5） |
| `wx_bar` | 微信付款码支付 |
| `alipay_pc` | 支付宝 PC 网站支付 |
| `alipay_wap` | 支付宝 Wap 网站支付 |
| `alipay_app` | 支付宝 App 支付 |
| `alipay_qr` | 支付宝扫码支付 |
| `alipay_bar` | 支付宝条码支付 |
| `mock` | 模拟支付 |
| `wallet` | 钱包支付 |

**`displayMode` 枚举值（`PayOrderDisplayModeEnum.mode`，完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `url` | Redirect 跳转链接 |
| `iframe` | IFrame 内嵌链接 |
| `form` | HTML 表单提交 |
| `qr_code` | 二维码文本内容 |
| `qr_code_url` | 二维码图片链接 |
| `bar_code` | 条形码 |
| `app` | App/小程序/公众号等自定义拉起 |

**特殊说明：**
- 当 `channelCode=wallet` 时，后端会自动注入 `channelExtras.wallet_id`，前端无需手工传入。

**响应体（`AppPayOrderSubmitRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | int | 是 | 支付状态，枚举见下方 `PayOrderStatusEnum` |
| `displayMode` | string | 是 | 展示模式，枚举见上方 `PayOrderDisplayModeEnum` |
| `displayContent` | string | 是 | 展示内容（具体含义取决于 `displayMode`） |

**`status` 枚举值（`PayOrderStatusEnum.status`，完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `0` | 未支付（WAITING） |
| `10` | 支付成功（SUCCESS） |
| `20` | 已退款（REFUND） |
| `30` | 支付关闭（CLOSED） |

**HTTP 请求示例：**

```http
POST /app-api/pay/order/submit
Authorization: Bearer {member_token}
tenant-id: 122
Content-Type: application/json

{
  "id": 10001,
  "channelCode": "wx_lite",
  "channelExtras": {
    "openid": "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o"
  },
  "displayMode": "app",
  "returnUrl": "https://app.example.com/pay/callback"
}
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "status": 0,
    "displayMode": "app",
    "displayContent": "{\"timeStamp\":\"1710000000\",\"nonceStr\":\"abc123\",\"package\":\"prepay_id=wx201234567890\",\"signType\":\"RSA\",\"paySign\":\"xxx\"}"
  }
}
```

---

### 3.3 GET /app-api/pay/order/get?id={id}&no={no}&sync={sync} — 查询支付订单

**功能**：按支付单 ID 或支付单号查询支付订单详情。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 否 | 支付单编号（`pay_order.id`） |
| `no` | string | 否 | 支付订单号（`pay_order.no`） |
| `sync` | boolean | 否 | 是否同步渠道状态；当订单为 WAITING 时可触发主动同步 |

**业务说明：**
- `id` 与 `no` 至少传一个，若都传则优先按 `no` 查。
- 当 `sync=true` 且订单状态为 WAITING（`0`）时，会先调用渠道同步，再返回最新状态。

**响应体（`PayOrderRespVO`，完整字段）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 支付订单编号 |
| `appId` | bigint | 是 | 应用编号 |
| `channelId` | bigint | 否 | 渠道编号 |
| `channelCode` | string | 否 | 渠道编码（枚举见 `PayChannelEnum`） |
| `merchantOrderId` | string | 是 | 商户订单编号 |
| `subject` | string | 是 | 商品标题 |
| `body` | string | 是 | 商品描述 |
| `notifyUrl` | string | 是 | 异步通知地址 |
| `price` | long | 是 | 支付金额（分） |
| `channelFeeRate` | double | 否 | 渠道手续费率（百分比） |
| `channelFeePrice` | int | 否 | 渠道手续费金额（分） |
| `status` | int | 是 | 支付状态（`0/10/20/30`） |
| `userIp` | string | 是 | 用户 IP |
| `expireTime` | string(datetime) | 是 | 订单失效时间 |
| `successTime` | string(datetime) | 否 | 支付成功时间 |
| `extensionId` | bigint | 否 | 支付成功的订单拓展单编号 |
| `no` | string | 否 | 支付订单号 |
| `refundPrice` | long | 是 | 退款总金额（分） |
| `channelUserId` | string | 否 | 渠道用户编号 |
| `channelOrderNo` | string | 否 | 渠道订单号 |
| `createTime` | string(datetime) | 是 | 创建时间 |

**HTTP 请求示例：**

```http
GET /app-api/pay/order/get?id=10001&sync=true
Authorization: Bearer {member_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 10001,
    "appId": 1,
    "channelId": 11,
    "channelCode": "wx_lite",
    "merchantOrderId": "ORDER_9527",
    "subject": "助教服务订单",
    "body": "订单号：B202604200001",
    "notifyUrl": "https://api.example.com/pay/notify/order",
    "price": 19900,
    "channelFeeRate": 0.6,
    "channelFeePrice": 119,
    "status": 10,
    "userIp": "127.0.0.1",
    "expireTime": "2026-04-20 19:30:00",
    "successTime": "2026-04-20 19:02:35",
    "extensionId": 30001,
    "no": "P202604200000001",
    "refundPrice": 0,
    "channelUserId": "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o",
    "channelOrderNo": "4200002501202604201234567890",
    "createTime": "2026-04-20 19:00:01"
  }
}
```

---

### 3.4 GET /app-api/pay/wallet/get — 查询钱包

**功能**：获取当前登录用户的钱包余额与累计收支。

**请求参数：** 无

**响应体（`AppPayWalletRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `balance` | int | 是 | 钱包余额（分） |
| `totalExpense` | int | 是 | 累计支出（分） |
| `totalRecharge` | int | 是 | 累计充值（分） |

**HTTP 请求示例：**

```http
GET /app-api/pay/wallet/get
Authorization: Bearer {member_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "balance": 5680,
    "totalExpense": 124320,
    "totalRecharge": 130000
  }
}
```

---

### 3.5 GET /app-api/pay/wallet-transaction/page — 钱包流水分页

**功能**：分页查询钱包流水，支持按收支类型和时间范围过滤。

**请求参数（`AppPayWalletTransactionPageReqVO` + `PageParam`）：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pageNo` | int | 是 | 页码，从 1 开始，最小 1，默认 1 |
| `pageSize` | int | 是 | 每页条数，最小 1，最大 200，默认 10 |
| `type` | int | 否 | 流水类型：`1=收入`，`2=支出` |
| `createTime` | array<string(datetime)> | 否 | 创建时间区间，数组长度 2（开始时间、结束时间） |

**`type` 枚举值（完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `1` | 收入 |
| `2` | 支出 |

**响应体（分页 `list` 单条 `AppPayWalletTransactionRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `bizType` | int | 是 | 业务分类，枚举见下方 `PayWalletBizTypeEnum` |
| `price` | long | 是 | 交易金额（分） |
| `title` | string | 是 | 流水标题 |
| `createTime` | string(datetime) | 是 | 交易时间 |

**`bizType` 枚举值（`PayWalletBizTypeEnum.type`，完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `1` | 充值 |
| `2` | 充值退款 |
| `3` | 支付 |
| `4` | 支付退款 |
| `5` | 更新余额 |
| `6` | 转账 |

**HTTP 请求示例：**

```http
GET /app-api/pay/wallet-transaction/page?pageNo=1&pageSize=10&type=2&createTime=2026-04-01%2000:00:00&createTime=2026-04-30%2023:59:59
Authorization: Bearer {member_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "total": 2,
    "list": [
      {
        "bizType": 3,
        "price": 19900,
        "title": "支付",
        "createTime": "2026-04-20 19:02:35"
      },
      {
        "bizType": 3,
        "price": 9900,
        "title": "支付",
        "createTime": "2026-04-18 11:32:10"
      }
    ]
  }
}
```

---

### 3.6 GET /app-api/pay/wallet-transaction/get-summary?createTime={start}&createTime={end} — 钱包流水汇总

**功能**：统计指定时间区间内的钱包累计收入与累计支出。

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `createTime` | array<string(datetime)> | 是 | 时间区间，需传 2 个值（开始时间、结束时间） |

**响应体（`AppPayWalletTransactionSummaryRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `totalExpense` | int | 是 | 累计支出（分） |
| `totalIncome` | int | 是 | 累计收入（分） |

**HTTP 请求示例：**

```http
GET /app-api/pay/wallet-transaction/get-summary?createTime=2026-04-01%2000:00:00&createTime=2026-04-30%2023:59:59
Authorization: Bearer {member_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "totalExpense": 35200,
    "totalIncome": 50000
  }
}
```

---

### 3.7 GET /app-api/pay/wallet-recharge-package/list — 钱包充值套餐列表

**功能**：查询已启用充值套餐，后端按 `payPrice` 升序返回。

**请求参数：** 无

**响应字段（`data[]` 单条 `AppPayWalletPackageRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 套餐编号 |
| `name` | string | 是 | 套餐名 |
| `payPrice` | int | 是 | 支付金额（分） |
| `bonusPrice` | int | 是 | 赠送金额（分） |

**HTTP 请求示例：**

```http
GET /app-api/pay/wallet-recharge-package/list
Authorization: Bearer {member_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 1001,
      "name": "小套餐",
      "payPrice": 1000,
      "bonusPrice": 100
    },
    {
      "id": 1002,
      "name": "大套餐",
      "payPrice": 5000,
      "bonusPrice": 800
    }
  ]
}
```

---

### 3.8 POST /app-api/pay/wallet-recharge/create — 创建钱包充值记录

**功能**：发起钱包充值，返回钱包充值记录 ID 与支付订单 ID。

**请求体（`AppPayWalletRechargeCreateReqVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `payPrice` | int | 条件必填 | 自定义支付金额（分），最小值 `1` |
| `packageId` | bigint | 条件必填 | 充值套餐编号 |

**参数约束（完整）：**
- `payPrice` 与 `packageId` 不能同时为空（至少传一个）。

**响应体（`AppPayWalletRechargeCreateRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 钱包充值记录编号 |
| `payOrderId` | bigint | 是 | 支付订单编号（用于后续调用 `POST /pay/order/submit` 拉起支付） |

**HTTP 请求示例：**

```http
POST /app-api/pay/wallet-recharge/create
Authorization: Bearer {member_token}
tenant-id: 122
Content-Type: application/json

{
  "packageId": 1002
}
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "id": 90001,
    "payOrderId": 10021
  }
}
```

---

### 3.9 GET /app-api/pay/wallet-recharge/page — 钱包充值记录分页

**功能**：分页查询当前用户充值记录。

**请求参数（`PageParam`）：**

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pageNo` | int | 是 | 页码，从 1 开始，最小 1，默认 1 |
| `pageSize` | int | 是 | 每页条数，最小 1，最大 200，默认 10 |

**响应体（分页 `list` 单条 `AppPayWalletRechargeRespVO`）：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 充值记录编号 |
| `totalPrice` | int | 是 | 用户实际到账余额（分） |
| `payPrice` | int | 是 | 实际支付金额（分） |
| `bonusPrice` | int | 是 | 钱包赠送金额（分） |
| `payChannelCode` | string | 是 | 支付成功渠道编码，枚举见 `PayChannelEnum` |
| `payChannelName` | string | 否 | 支付渠道名称（字典解析） |
| `payOrderId` | bigint | 是 | 支付订单编号 |
| `payOrderChannelOrderNo` | string | 是 | 渠道外部订单号 |
| `payTime` | string(datetime) | 是 | 订单支付时间 |
| `refundStatus` | int | 是 | 退款状态，枚举见下方 `PayRefundStatusEnum` |

**`refundStatus` 枚举值（`PayRefundStatusEnum.status`，完整）：**

| 枚举值 | 说明 |
| --- | --- |
| `0` | 未退款 |
| `10` | 退款成功 |
| `20` | 退款失败 |

**HTTP 请求示例：**

```http
GET /app-api/pay/wallet-recharge/page?pageNo=1&pageSize=10
Authorization: Bearer {member_token}
tenant-id: 122
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "total": 1,
    "list": [
      {
        "id": 90001,
        "totalPrice": 5800,
        "payPrice": 5000,
        "bonusPrice": 800,
        "payChannelCode": "wx_lite",
        "payChannelName": "微信小程序支付",
        "payOrderId": 10021,
        "payOrderChannelOrderNo": "4200002501202604209876543210",
        "payTime": "2026-04-20 20:01:12",
        "refundStatus": 0
      }
    ]
  }
}
```


### 3.10 GET /app-api/billiard/wallet/withdrawable-balance — 查询可提现本金余额

**功能**：查询当前用户钱包余额、钱包冻结金额、可提现充值本金余额和提现冻结本金。

**响应字段**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `walletId` | bigint | 是 | 钱包编号 |
| `walletBalance` | int | 是 | 钱包可用余额（分） |
| `walletFreezePrice` | int | 是 | 钱包冻结金额（分） |
| `withdrawableAmount` | int | 是 | 可提现充值本金余额（分） |
| `frozenAmount` | int | 是 | 提现冻结本金（分） |
| `availableWithdrawAmount` | int | 是 | 当前可申请提现金额（分） |

**HTTP 请求示例：**

```http
GET /app-api/billiard/wallet/withdrawable-balance
Authorization: Bearer {member_token}
tenant-id: 122
```

### 3.11 POST /app-api/billiard/wallet/withdrawal/create — 创建用户余额提现

**功能**：当前用户发起余额提现，后端仅允许提现实际支付充值本金，并自动调用微信或支付宝转账。

**请求体**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `withdrawAmount` | int | 是 | 提现金额（分），必须大于 0 且不超过可申请提现金额 |
| `accountType` | int | 是 | 收款账号类型：`1=微信`，`2=支付宝` |
| `accountNo` | string | 是 | 微信 openid 或支付宝账号 |
| `realName` | string | 否 | 真实姓名；支付宝建议填写，微信小额转账可为空 |

**业务规则**

1. 同一用户同一时间只允许存在一笔处理中提现。
2. `withdrawAmount` 不能超过 `pay_wallet.balance - pay_wallet.freeze_price`。
3. `withdrawAmount` 不能超过 `billiard_member_withdrawable_account.withdrawable_amount`。
4. 提现创建成功后状态为 `PROCESSING(0)`，最终状态由 pay 转账通知更新为 `SUCCESS(1)` 或 `FAILED(2)`。

**HTTP 请求示例：**

```http
POST /app-api/billiard/wallet/withdrawal/create
Authorization: Bearer {member_token}
tenant-id: 122
Content-Type: application/json

{
  "withdrawAmount": 3000,
  "accountType": 2,
  "accountNo": "user@example.com",
  "realName": "张三"
}
```

**JSON 响应示例：**

```json
{
  "code": 0,
  "msg": "",
  "data": 90001
}
```

### 3.12 GET /app-api/billiard/wallet/withdrawal/page — 查询用户余额提现记录

**功能**：分页查询当前用户余额提现申请记录。

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pageNo` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页条数，默认 10 |
| `status` | int | 否 | 提现状态：`0=处理中`，`1=成功`，`2=失败` |

**响应字段**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | bigint | 是 | 提现申请编号 |
| `withdrawAmount` | int | 是 | 提现金额（分） |
| `accountType` | int | 是 | 收款账号类型 |
| `accountNo` | string | 是 | 脱敏后的收款账号 |
| `status` | int | 是 | 提现状态 |
| `statusName` | string | 是 | 状态名称 |
| `transferErrorMsg` | string | 否 | 失败原因 |
| `applyTime` | long | 是 | 申请时间，毫秒时间戳 |
| `payTime` | long | 否 | 到账时间，毫秒时间戳 |

**HTTP 请求示例：**

```http
GET /app-api/billiard/wallet/withdrawal/page?pageNo=1&pageSize=10
Authorization: Bearer {member_token}
tenant-id: 122
```

### 3.13 POST /app-api/billiard/wallet/withdrawal/update-transferred — 转账结果通知

**功能**：供 pay 模块 `PayNotifyJob` 回调业务系统，前端无需调用。

**请求体**

```json
{
  "merchantTransferId": "90001",
  "payTransferId": 80001
}
```

**响应示例**

```json
{
  "code": 0,
  "msg": "",
  "data": true
}
```


---

## 4. 计时模块

### 4.1 GET /app-api/billiard/timer/get-status?orderId={orderId} — 查询当前计时状态

**功能**：查询指定订单的实时计时状态。

**请求参数：**`orderId` = billiard_order.id

**业务校验：** 订单 `user_id` = 当前登录用户

**查询逻辑（BilliardTimerService.getTimerStatus）：**

```
1. 从 Redis 读取 billiard:timer:{orderId}
2. 若 Redis 存在：
   - elapsedSeconds = (System.currentTimeMillis() - startTime) / 1000
   - 若 status = ENDED：elapsedSeconds = actual_duration * 60（从 billiard_timer_record 读取）
3. 若 Redis 不存在（降级）：
   - 从 billiard_timer_record 读取 start_time, end_time, planned_duration, added_duration
   - 若 end_time 为空：elapsedSeconds = (当前时间 - start_time).toSeconds()
   - 若 end_time 不为空：elapsedSeconds = actual_duration * 60
4. 返回响应
```

**响应体（TimerStatusRespVO）：**


| 字段                 | 类型       | 说明                                                                         |
| ------------------ | -------- | -------------------------------------------------------------------------- |
| `orderId`          | bigint   | 订单ID                                                                       |
| `startTime`        | datetime | 服务开始时间（服务端时间）                                                              |
| `elapsedSeconds`   | long     | 已服务秒数（服务端实时计算：`now - startTime`，ENDED 状态返回 `actual_duration * 60`）         |
| `plannedDuration`  | int      | 预定总时长（分钟，含加钟）                                                              |
| `addedDuration`    | int      | 加钟累计时长（分钟）                                                                 |
| `remainingSeconds` | long     | 剩余秒数 = `(plannedDuration + addedDuration) * 60 - elapsedSeconds`；可为负数（超时时） |
| `status`           | string   | RUNNING / ENDED                                                            |


> **前端展示建议**：收到响应后直接替换本地显示值，无需与本地时钟做对账。对于断网重连场景，下次轮询成功即可获取最新 elapsedSeconds，正常显示。

---

## 5. 异常订单模块

Controller 类：`AppExceptionOrderController`
包路径：`cn.iocoder.yudao.module.billiard.controller.app.exception.AppExceptionOrderController`
路由前缀：`/app-api/billiard/exception`
鉴权：用户 App 登录态（`member_user` Token）

### 5.1 POST /app-api/billiard/exception/report — 用户报告异常

**功能**：用户在 App 端对已有订单发起异常申报。

**请求体（AppExceptionReportReqVO）：**


| 字段              | 类型      | 必填  | 说明                                      |
| --------------- | ------- | --- | --------------------------------------- |
| `orderId`       | bigint  | 是   | billiard_order.id，必须归属当前登录用户            |
| `exceptionType` | tinyint | 是   | 异常类型：1=用户投诉 2=助教超时 3=系统异常 4=其他          |
| `reason`        | string  | 是   | 异常说明，最长 500 字符                          |
| `evidenceUrls`  | string  | 否   | 证据 URL 数组字符串，例如 `["https://img/1.png"]` |


**业务校验：**

1. 订单存在且归属当前登录用户（防越权）
2. 订单状态不为 `PENDING_PAYMENT(10)`（待付款订单无法投诉，尚未发生服务）
3. 同一订单在 24 小时内不可重复提交同类型异常（防刷单）

**操作：**

1. 插入 `billiard_exception_order`（`status=PENDING`，`claimUserId=NULL`）
2. 更新 `billiard_order.is_abnormal = 1`
3. 推送站内通知给客服组：`"新异常订单待处理：订单 ${orderNo}，类型：${exceptionType}"`

**响应体：`**Long` (返回新创建的 exceptionOrderId)

---

## 6. 球厅模块

Controller 类：`AppVenueController`
包路径：`cn.iocoder.yudao.module.billiard.controller.app.venue.AppVenueController`
路由前缀：`/app-api/billiard/venue`
鉴权：用户 App 登录态（`member_user` Token）

---

### 6.1 GET /app-api/billiard/venue/list — 合作球厅列表（含附近搜索）

#### 6.1.1 接口说明

返回当前租户下处于"启用"状态（`status=1`）的球厅列表。一个接口同时承担下面三种前端场景：

1. **首页/无定位场景**：不传经纬度，按 id 升序返回最多 25 条启用球厅，可做全局关键词搜索。
2. **附近球厅**：传 `longitude + latitude` 后走 Haversine 距离算法，带 `radius` 做半径过滤，默认按距离升序返回；并会在后台异步调用高德周边搜索 API，把新发现的台球场所写入本地库（异步写入，下一次调用才能查到）。
3. **地图页/筛选页**：支持 `sortType`、`features`（设施标签）等组合条件。

返回结果同时包含：

- **`source=0` 自维护球厅**：运营后台录入，数据丰富（封面、价格、促销、设施标签等）。
- **`source=1` 高德同步球厅**：通过高德 POI 自动同步的基础数据（只有名称、地址、经纬度、电话）。

前端不需要区分 `source`，只需注意高德同步记录没有价格/封面/标签这些运营字段，需要在 UI 上做空值兜底即可。

#### 6.1.2 请求

**URL**

```
GET /app-api/billiard/venue/list
```

**请求头**

| Header          | 必填 | 说明                                                                           |
| --------------- | ---- | ------------------------------------------------------------------------------ |
| `Authorization` | 是   | 格式 `Bearer {accessToken}`，用户 App 登录态；本地联调可用 `Bearer test{memberUserId}` |
| `tenant-id`     | 是   | 租户编号。App 端统一使用运营侧分配的租户 id（本地联调用 `122`）                      |
| `Content-Type`  | 否   | GET 请求无 body，可不传                                                        |

> 未传 `Authorization` 返回 `401 账号未登录`；未传 `tenant-id` 返回 `400 请求的租户标识未传递`。

**Query 参数**

| 参数         | 类型    | 必填 | 默认值 | 取值范围 / 说明                                                                    |
| ------------ | ------- | ---- | ------ | ---------------------------------------------------------------------------------- |
| `keyword`    | string  | 否   | -      | 球厅名称模糊搜索，SQL 层为 `name LIKE '%keyword%'`，前后空格不做 trim               |
| `longitude`  | decimal | 条件 | -      | 用户当前经度，WGS-84，范围 -180 ~ 180。必须与 `latitude` **同时传或同时不传**       |
| `latitude`   | decimal | 条件 | -      | 用户当前纬度，WGS-84，范围 -90 ~ 90。必须与 `longitude` **同时传或同时不传**        |
| `radius`     | int     | 否   | 5      | 搜索半径，单位 km，范围 **1~50**；仅在同时传了经纬度时生效                           |
| `sortType`   | int     | 否   | 见下表 | 排序类型：`1` 距离最近 / `2` 价格最低 / `3` 评分最高                                |
| `features`   | string  | 否   | -      | 设施标签筛选，多个用英文逗号分隔，例如 `24小时营业,免费停车`。多标签间为 **AND** 关系 |
| `limit`      | int     | 否   | 25     | 返回条数上限，范围 **1~100**。自维护 + 高德同步共享这个上限                         |

**默认排序规则**

| 场景                              | 默认 `sortType` | 实际排序                                     |
| --------------------------------- | --------------- | -------------------------------------------- |
| 同时传了经纬度（附近模式）        | `1`（距离最近） | 距离升序                                     |
| `sortType=2`（有或无坐标）        | `2`             | 有坐标：价格升序 → 距离升序；无坐标：价格升序 |
| `sortType=3`（有或无坐标）        | `3`             | 有坐标：评分降序 → 距离升序；无坐标：评分降序 |
| 不传经纬度且不传 `sortType`       | -               | id 升序（近似按录入时间顺序）                 |

#### 6.1.3 请求示例

**示例 1：首页无定位**

```bash
curl 'http://host/app-api/billiard/venue/list' \
  -H 'Authorization: Bearer {token}' \
  -H 'tenant-id: 122'
```

**示例 2：附近 3 公里、按距离排序、取 10 条**

```bash
curl 'http://host/app-api/billiard/venue/list?longitude=121.473701&latitude=31.230416&radius=3&limit=10' \
  -H 'Authorization: Bearer {token}' \
  -H 'tenant-id: 122'
```

**示例 3：关键词 + 附近 + 最多返回 5 条**

```bash
curl 'http://host/app-api/billiard/venue/list?keyword=%E5%8F%B0%E7%90%83&longitude=121.473701&latitude=31.230416&radius=5&limit=5' \
  -H 'Authorization: Bearer {token}' \
  -H 'tenant-id: 122'
```

**示例 4：筛选设施 + 按评分排序（无定位）**

```bash
curl 'http://host/app-api/billiard/venue/list?features=24%E5%B0%8F%E6%97%B6%E8%90%A5%E4%B8%9A,%E5%85%8D%E8%B4%B9%E5%81%9C%E8%BD%A6&sortType=3' \
  -H 'Authorization: Bearer {token}' \
  -H 'tenant-id: 122'
```

#### 6.1.4 响应

**顶层结构**

```json
{
  "code": 0,
  "msg": "",
  "data": [ /* VenueItem 数组 */ ]
}
```

- `code = 0` 成功；其它值表示失败，详见 6.1.6。
- `data` 可能为空数组；**不分页**，直接用 `limit` 截断。

**`VenueItem` 字段**

| 字段              | 类型    | 可空 | 说明                                                                 |
| ----------------- | ------- | ---- | -------------------------------------------------------------------- |
| `id`              | bigint  | 否   | 球厅 ID，下单、收藏等后续接口的唯一标识                             |
| `name`            | string  | 否   | 球厅名称                                                             |
| `address`         | string  | 否   | 详细地址（`source=1` 的可能为空字符串）                              |
| `longitude`       | decimal | 否   | 经度（WGS-84，用于地图标注和导航）                                  |
| `latitude`        | decimal | 否   | 纬度（WGS-84，用于地图标注和导航）                                  |
| `advantage`       | string  | 是   | 门店优势说明（`source=1` 通常为 null）                               |
| `coverImageUrl`   | string  | 是   | 封面图 URL（`source=1` 通常为 null）                                 |
| `price`           | int     | 否   | 起价，单位 **分/小时**（`source=1` 默认 0，前端需做"暂无报价"兜底） |
| `score`           | decimal | 否   | 评分，0.00~5.00（`source=1` 默认 5.00）                               |
| `reviewCount`     | int     | 否   | 评价数（`source=1` 默认 0）                                          |
| `tags`            | string  | 是   | 标签，逗号分隔（`source=1` 通常为 null）                             |
| `facilityTags`    | string  | 是   | 设施标签，逗号分隔（`source=1` 通常为 null）                         |
| `promotionText`   | string  | 是   | 促销文案（`source=1` 通常为 null）                                   |
| `phone`           | string  | 是   | 联系电话                                                             |
| `distance`        | decimal | 是   | 距离，单位 **km**，保留两位小数；**仅当传入经纬度时返回**，否则为 null |
| `source`          | int     | 否   | 数据来源：`0` 平台自维护 / `1` 高德自动同步                         |

#### 6.1.5 响应示例

**示例 A：附近 3 公里、`limit=3`，同时返回自维护和高德数据**

请求：
```
GET /app-api/billiard/venue/list?longitude=121.473701&latitude=31.230416&radius=3&limit=3
```

响应：
```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 9,
      "name": "星际台球会所（徐汇旗舰店）",
      "address": "上海市徐汇区XX路 1 号",
      "longitude": 121.473701,
      "latitude": 31.230416,
      "advantage": "老牌品牌，包厢齐全",
      "coverImageUrl": "https://cdn.example.com/venue/9/cover.jpg",
      "price": 5000,
      "score": 4.80,
      "reviewCount": 128,
      "tags": "推荐,资质认证",
      "facilityTags": "24小时营业,免费停车,包厢,WIFI",
      "promotionText": "新用户首单立减 20",
      "phone": "021-12345678",
      "distance": 0.00,
      "source": 0
    },
    {
      "id": 25,
      "name": "风云再起(上海人民广场店)",
      "address": "上海市黄浦区南京东路...",
      "longitude": 121.473024,
      "latitude": 31.228048,
      "advantage": null,
      "coverImageUrl": null,
      "price": 0,
      "score": 5.00,
      "reviewCount": 0,
      "tags": null,
      "facilityTags": null,
      "promotionText": null,
      "phone": "021-63XXXXXX",
      "distance": 0.29,
      "source": 1
    },
    {
      "id": 16,
      "name": "PARTY KING·PK保龄球·台球·团建",
      "address": "上海市黄浦区...",
      "longitude": 121.474130,
      "latitude": 31.227658,
      "advantage": null,
      "coverImageUrl": null,
      "price": 0,
      "score": 5.00,
      "reviewCount": 0,
      "tags": null,
      "facilityTags": null,
      "promotionText": null,
      "phone": null,
      "distance": 0.34,
      "source": 1
    }
  ]
}
```

**示例 B：无定位，首页默认 25 条**

请求：
```
GET /app-api/billiard/venue/list
```

响应（节选）：
```json
{
  "code": 0,
  "msg": "",
  "data": [
    {
      "id": 9,
      "name": "星际台球会所（徐汇旗舰店）",
      "distance": null,
      "source": 0,
      "...": "其余字段省略"
    }
  ]
}
```

此时所有条目的 `distance` 字段都是 `null`，前端不要展示距离标签。

**示例 C：经纬度只传一个 → 400**

```json
{
  "code": 400,
  "msg": "请求参数不正确:经度和纬度必须同时传或同时不传",
  "data": null
}
```

#### 6.1.6 错误码

| HTTP / code | 触发条件                                   | msg                                             |
| ----------- | ------------------------------------------ | ----------------------------------------------- |
| `400`       | `longitude` / `latitude` 只传了一个         | `请求参数不正确:经度和纬度必须同时传或同时不传` |
| `400`       | `radius < 1`                               | `请求参数不正确:搜索半径最小 1km`               |
| `400`       | `radius > 50`                              | `请求参数不正确:搜索半径最大 50km`              |
| `400`       | `limit < 1`                                | `请求参数不正确:返回条数最小 1`                 |
| `400`       | `limit > 100`                              | `请求参数不正确:返回条数最大 100`               |
| `400`       | 未传 `tenant-id`                           | `请求的租户标识未传递，请进行排查`              |
| `401`       | 未传 `Authorization` 或 token 无效          | `账号未登录`                                    |

其它 5xx 按通用错误格式返回（`code != 0`，`msg` 带具体原因），前端统一 toast 兜底。

#### 6.1.7 业务规则与对接要点

1. **坐标系**
   - 后端 Haversine 直接用传入的经纬度计算距离，不做坐标系转换。
   - 前端小程序建议使用 **GCJ-02**（火星坐标系）；浏览器/H5 的 `navigator.geolocation` 默认 **WGS-84**，两者互传有 50~500m 偏差。km 级附近搜索可接受；如果后续要精细导航请和后端约定统一坐标系。

2. **单位**
   - `price` 单位 **分**，UI 展示时除以 100 并保留 2 位小数（例：`5000` 显示为 `¥50.00`）。
   - `distance` 单位 **km**，保留两位小数。`0.00` 可以显示为 `<100m`。

3. **空值策略**
   - `source=1` 的记录只来自高德 POI，**没有** 封面图、价格、评分、评价、标签、促销文案。前端需要对这些字段做默认值/占位。
   - 建议 UI 对 `source=1` 记录显示一个"高德数据"之类的小标签，方便用户区分。

4. **分页**
   - 当前 **不支持分页**，只用 `limit` 控制单次返回条数（默认 25，最大 100）。
   - 如果后续要下拉加载，会单独实现 `pageNo`/`pageSize` 或 `cursor` 接口，本接口不会变。

5. **异步高德同步**
   - 只要请求**带坐标**，后台就会异步调高德 POI 搜索接口，把新发现的台球场所写入本地库（关键词：`台球|台球厅|台球馆|桌球|斯诺克|billiard|snooker`）。
   - **当次请求不会看到新同步的数据**，下一次请求（几百毫秒后）才能查到。前端想"拉到最新"可以做一次下拉刷新。
   - 运营已录入的球厅（`source=0`）**永远不会**被高德数据覆盖。

6. **多租户**
   - 接口自动按 `tenant-id` 过滤，不同租户数据完全隔离。前端只要正确透传 `tenant-id` 请求头即可。

7. **关键词匹配范围**
   - `keyword` 仅匹配 `name`，不匹配地址 / 标签 / 电话。
   - 附近模式下 `keyword` 在半径过滤之前生效，不会把半径外的同名球厅带进来。

8. **幂等性**
   - 纯查询接口，前端重试安全；后台异步同步通过唯一索引 `uk_poi_id` 去重，连续打同一个坐标不会产生重复数据。


