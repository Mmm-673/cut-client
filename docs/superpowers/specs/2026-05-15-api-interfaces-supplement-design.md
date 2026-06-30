---
name: API接口补充设计文档
description: 台球约项目补充9个未对接的API接口，包括订单删除、充值套餐、钱包提现、计时状态、异常订单等模块
type: design
---

# API接口补充设计文档

**日期：** 2026-05-15
**项目：** 台球约 (cut-client)

## 一、概述

### 1.1 设计目标
补充9个未对接的API接口，按现有业务模块组织，保持代码风格一致，确保API调用方式与项目现有模式统一。

### 1.2 接口清单

| # | 模块 | 接口名 | 方法 | URL | 状态 |
|---|------|--------|------|-----|------|
| 1 | 订单 | 删除订单 | POST | `/app-api/billiard/order/delete` | ❌ 未对接 |
| 2 | 支付 | 充值套餐列表 | GET | `/app-api/pay/wallet-recharge-package/list` | ❌ 未对接 |
| 3 | 支付 | 创建充值 | POST | `/app-api/pay/wallet-recharge/create` | ❌ 未对接 |
| 4 | 支付 | 充值记录分页 | GET | `/app-api/pay/wallet-recharge/page` | ❌ 未对接 |
| 5 | 钱包 | 可提现余额 | GET | `/app-api/billiard/wallet/withdrawable-balance` | ❌ 未对接 |
| 6 | 钱包 | 创建提现 | POST | `/app-api/billiard/wallet/withdrawal/create` | ❌ 未对接 |
| 7 | 钱包 | 提现记录分页 | GET | `/app-api/billiard/wallet/withdrawal/page` | ❌ 未对接 |
| 8 | 计时 | 查询计时状态 | GET | `/app-api/billiard/timer/get-status` | ❌ 未对接 |
| 9 | 异常 | 用户报告异常 | POST | `/app-api/billiard/exception/report` | ❌ 未对接 |

---

## 二、整体架构

### 2.1 文件组织策略

采用**方案一：按现有文件扩展**

```
api/
└── billiard/
    ├── order.js          ← 修改：新增 deleteOrder()
    ├── pay.js            ← 修改：新增3个充值接口
    ├── wallet.js         ← 修改：新增3个提现接口
    ├── timer.js          ← 新建：计时模块接口
    └── exception.js      ← 新建：异常订单模块接口
```

### 2.2 设计原则

1. **保持一致性** - 完全遵循现有 `api/billiard/coach.js` 的代码风格
2. **最小改动** - 只修改必要的文件，不改动现有接口
3. **完整注释** - 每个接口都有完整的 JSDoc，包括业务规则说明
4. **按需新建** - 只有全新模块才新建文件

---

## 三、接口详细设计

### 3.1 订单模块 - order.js

**文件路径：** `api/billiard/order.js`

**新增接口：**

```javascript
/**
 * 删除订单
 * @param {Object} data - 请求参数
 * @param {number} data.orderId - 订单ID (billiard_order.id)
 *
 * 业务校验：
 * - 订单归属当前登录用户
 * - 订单状态必须为 CANCELLED (70)
 *
 * @returns {Promise<Object>} 返回删除结果
 */
export function deleteOrder(data) {
  return request({
    url: '/app-api/billiard/order/delete',
    method: 'post',
    data
  })
}
```

---

### 3.2 支付模块 - pay.js

**文件路径：** `api/billiard/pay.js`

**新增接口：**

```javascript
/**
 * 获取钱包充值套餐列表
 * @returns {Promise<Object>} 返回套餐列表
 * @returns {Array} returns.data - 套餐数组
 * @returns {number} returns.data[].id - 套餐编号
 * @returns {string} returns.data[].name - 套餐名
 * @returns {number} returns.data[].payPrice - 支付金额（分）
 * @returns {number} returns.data[].bonusPrice - 赠送金额（分）
 */
export function getWalletRechargePackages() {
  return request({
    url: '/app-api/pay/wallet-recharge-package/list',
    method: 'get'
  })
}

/**
 * 创建钱包充值记录
 * @param {Object} data - 请求参数
 * @param {number} [data.payPrice] - 自定义支付金额（分），与packageId二选一
 * @param {number} [data.packageId] - 充值套餐编号，与payPrice二选一
 *
 * 参数约束（完整）：
 * - payPrice 与 packageId 不能同时为空（至少传一个）
 *
 * @returns {Promise<Object>} 返回创建结果
 * @returns {number} returns.data.id - 钱包充值记录编号
 * @returns {number} returns.data.payOrderId - 支付订单编号（用于后续调用 /app-api/pay/order/submit 拉起支付）
 */
export function createWalletRecharge(data) {
  return request({
    url: '/app-api/pay/wallet-recharge/create',
    method: 'post',
    data
  })
}

/**
 * 钱包充值记录分页
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码，从1开始，最小1
 * @param {number} [params.pageSize=10] - 每页条数，最小1，最大200
 *
 * @returns {Promise<Object>} 返回充值记录列表
 * @returns {number} returns.data.total - 总记录数
 * @returns {Array} returns.data.list - 充值记录数组
 * @returns {number} returns.data.list[].id - 充值记录编号
 * @returns {number} returns.data.list[].totalPrice - 用户实际到账余额（分）
 * @returns {number} returns.data.list[].payPrice - 实际支付金额（分）
 * @returns {number} returns.data.list[].bonusPrice - 钱包赠送金额（分）
 * @returns {string} returns.data.list[].payChannelCode - 支付成功渠道编码
 * @returns {string} returns.data.list[].payChannelName - 支付渠道名称
 * @returns {number} returns.data.list[].payOrderId - 支付订单编号
 * @returns {string} returns.data.list[].payOrderChannelOrderNo - 渠道外部订单号
 * @returns {string} returns.data.list[].payTime - 订单支付时间
 * @returns {number} returns.data.list[].refundStatus - 退款状态：0=未退款，10=退款成功，20=退款失败
 */
export function getWalletRechargePage(params) {
  return request({
    url: '/app-api/pay/wallet-recharge/page',
    method: 'get',
    params
  })
}
```

---

### 3.3 钱包模块 - wallet.js

**文件路径：** `api/billiard/wallet.js`

**说明：** 现有 `wallet.js` 需要重构，替换为正确的接口

**新增接口：**

```javascript
import request from '@/utils/request'

/**
 * 查询可提现本金余额
 * @returns {Promise<Object>} 返回余额信息
 * @returns {number} returns.data.walletId - 钱包编号
 * @returns {number} returns.data.walletBalance - 钱包可用余额（分）
 * @returns {number} returns.data.walletFreezePrice - 钱包冻结金额（分）
 * @returns {number} returns.data.withdrawableAmount - 可提现充值本金余额（分）
 * @returns {number} returns.data.frozenAmount - 提现冻结本金（分）
 * @returns {number} returns.data.availableWithdrawAmount - 当前可申请提现金额（分）
 */
export function getWithdrawableBalance() {
  return request({
    url: '/app-api/billiard/wallet/withdrawable-balance',
    method: 'get'
  })
}

/**
 * 创建用户余额提现
 * @param {Object} data - 请求参数
 * @param {number} data.withdrawAmount - 提现金额（分），必须大于0且不超过可申请提现金额
 * @param {number} data.accountType - 收款账号类型：1=微信，2=支付宝
 * @param {string} data.accountNo - 微信openid或支付宝账号
 * @param {string} [data.realName] - 真实姓名；支付宝建议填写，微信小额转账可为空
 *
 * 业务规则：
 * - 同一用户同一时间只允许存在一笔处理中提现
 * - withdrawAmount 不能超过 walletBalance - walletFreezePrice
 * - withdrawAmount 不能超过 withdrawableAmount
 * - 提现创建成功后状态为 PROCESSING (0)，最终状态由 pay 转账通知更新为 SUCCESS (1) 或 FAILED (2)
 *
 * @returns {Promise<Object>} 返回提现申请ID
 * @returns {number} returns.data - 提现申请编号
 */
export function createWithdrawal(data) {
  return request({
    url: '/app-api/billiard/wallet/withdrawal/create',
    method: 'post',
    data
  })
}

/**
 * 查询用户余额提现记录
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码，默认1
 * @param {number} [params.pageSize=10] - 每页条数，默认10
 * @param {number} [params.status] - 提现状态：0=处理中，1=成功，2=失败
 *
 * @returns {Promise<Object>} 返回提现记录列表
 * @returns {number} returns.data.total - 总记录数
 * @returns {Array} returns.data.list - 提现记录数组
 * @returns {number} returns.data.list[].id - 提现申请编号
 * @returns {number} returns.data.list[].withdrawAmount - 提现金额（分）
 * @returns {number} returns.data.list[].accountType - 收款账号类型
 * @returns {string} returns.data.list[].accountNo - 脱敏后的收款账号
 * @returns {number} returns.data.list[].status - 提现状态
 * @returns {string} returns.data.list[].statusName - 状态名称
 * @returns {string} returns.data.list[].transferErrorMsg - 失败原因
 * @returns {number} returns.data.list[].applyTime - 申请时间，毫秒时间戳
 * @returns {number} returns.data.list[].payTime - 到账时间，毫秒时间戳
 */
export function getWithdrawalPage(params) {
  return request({
    url: '/app-api/billiard/wallet/withdrawal/page',
    method: 'get',
    params
  })
}

export default {
  getWithdrawableBalance,
  createWithdrawal,
  getWithdrawalPage
}
```

---

### 3.4 计时模块 - timer.js（新建）

**文件路径：** `api/billiard/timer.js`

**新增文件内容：**

```javascript
import request from '@/utils/request'

/**
 * 查询当前计时状态
 * @param {Object} params - 请求参数
 * @param {number} params.orderId - billiard_order.id
 *
 * 业务校验：订单归属当前登录用户
 *
 * 查询逻辑（BilliardTimerService.getTimerStatus）：
 * 1. 从 Redis 读取 billiard:timer:{orderId}
 * 2. 若 Redis 存在：
 *    - elapsedSeconds = (System.currentTimeMillis() - startTime) / 1000
 *    - 若 status = ENDED：elapsedSeconds = actualDuration * 60（从 billiard_timer_record 读取）
 * 3. 若 Redis 不存在（降级）：
 *    - 从 billiard_timer_record 读取 start_time, end_time, planned_duration, added_duration
 *    - 若 end_time 为空：elapsedSeconds = (当前时间 - start_time).toSeconds()
 *    - 若 end_time 不为空：elapsedSeconds = actualDuration * 60
 *
 * @returns {Promise<Object>} 返回计时状态
 * @returns {number} returns.data.orderId - 订单ID
 * @returns {string} returns.data.startTime - 服务开始时间（服务端时间）
 * @returns {number} returns.data.elapsedSeconds - 已服务秒数（服务端实时计算：now - startTime，ENDED 状态返回 actualDuration * 60）
 * @returns {number} returns.data.plannedDuration - 预定总时长（分钟，含加钟）
 * @returns {number} returns.data.addedDuration - 加钟累计时长（分钟）
 * @returns {number} returns.data.remainingSeconds - 剩余秒数 = (plannedDuration + addedDuration) * 60 - elapsedSeconds；可为负数（超时时）
 * @returns {string} returns.data.status - RUNNING / ENDED
 *
 * 前端展示建议：收到响应后直接替换本地显示值，无需与本地时钟做对账。
 * 对于断网重连场景，下次轮询成功即可获取最新 elapsedSeconds，正常显示。
 */
export function getTimerStatus(params) {
  return request({
    url: '/app-api/billiard/timer/get-status',
    method: 'get',
    params
  })
}

export default {
  getTimerStatus
}
```

---

### 3.5 异常订单模块 - exception.js（新建）

**文件路径：** `api/billiard/exception.js`

**新增文件内容：**

```javascript
import request from '@/utils/request'

/**
 * 用户报告异常
 * @param {Object} data - 请求参数
 * @param {number} data.orderId - billiard_order.id，必须归属当前登录用户
 * @param {number} data.exceptionType - 异常类型：1=用户投诉 2=裁教超时 3=系统异常 4=其他
 * @param {string} data.reason - 异常说明，最长500字符
 * @param {Array<string>} [data.evidenceUrls] - 证据URL数组
 *
 * 业务校验：
 * - 订单存在且归属当前登录用户（防越权）
 * - 订单状态不为 PENDING_PAYMENT (10)（待付款订单无法投诉，尚未发生服务）
 * - 同一订单在24小时内不可重复提交同类型异常（防刷单）
 *
 * 操作：
 * - 插入 billiard_exception_order（status=PENDING，claimUserId=NULL）
 * - 更新 billiard_order.is_abnormal = 1
 * - 推送站内通知给客服组："新异常订单待处理：订单 {orderNo}，类型：{exceptionType}"
 *
 * @returns {Promise<Object>} 返回异常订单ID
 * @returns {number} returns.data - 新创建的exceptionOrderId
 */
export function reportException(data) {
  return request({
    url: '/app-api/billiard/exception/report',
    method: 'post',
    data
  })
}

export default {
  reportException
}
```

---

## 四、文件变更清单

### 4.1 修改文件

| 文件路径 | 修改内容 |
|---------|---------|
| `api/billiard/order.js` | 新增 `deleteOrder()` 函数 |
| `api/billiard/pay.js` | 新增 3 个充值相关函数 |
| `api/billiard/wallet.js` | **完全重写**，替换为 3 个提现相关函数 |

### 4.2 新建文件

| 文件路径 | 说明 |
|---------|------|
| `api/billiard/timer.js` | 计时模块API，包含 `getTimerStatus()` |
| `api/billiard/exception.js` | 异常订单模块API，包含 `reportException()` |

---

## 五、代码风格规范

### 5.1 统一遵循的规范

所有新增接口严格遵循项目现有代码风格：

1. **导入语句** - 统一使用 `import request from '@/utils/request'`
2. **JSDoc 注释** - 包含完整的 `@param`、`@returns`、业务规则说明
3. **函数命名** - 小驼峰命名，动词开头
4. **返回值说明** - 详细列出返回对象的每个字段及其类型
5. **默认导出** - 每个文件末尾都有 `export default { ... }`

### 5.2 参考模板

以 `api/billiard/coach.js` 为参考模板，确保风格一致。

---

## 六、验收标准

- [ ] `api/billiard/order.js` 已新增 `deleteOrder()` 接口
- [ ] `api/billiard/pay.js` 已新增3个充值接口
- [ ] `api/billiard/wallet.js` 已重写为3个提现接口
- [ ] `api/billiard/timer.js` 新建文件已创建
- [ ] `api/billiard/exception.js` 新建文件已创建
- [ ] 所有接口都有完整的JSDoc注释
- [ ] 代码风格与项目现有模式一致
- [ ] 所有文件都有正确的 `export default`
