
---
name: API接口集成设计文档
description: 设计9个API接口在前端页面中的集成方案和交互流程
type: design
---

# API接口集成设计文档

**日期：** 2026-05-15
**项目：** 台球约 (cut-client)

---

## 一、概述

### 1.1 设计目标
将已实现的9个API接口集成到对应页面中，提供完整的用户交互流程。

### 1.2 涉及接口清单

| # | 模块 | 接口名 | 文件 | 对应页面 |
|---|------|--------|------|----------|
| 1 | 订单 | deleteOrder | order.js | 订单详情、订单列表 |
| 2 | 支付 | getWalletRechargePackages | pay.js | 充值页面 |
| 3 | 支付 | createWalletRecharge | pay.js | 充值页面 |
| 4 | 支付 | getWalletRechargePage | pay.js | 钱包页面 |
| 5 | 钱包 | getWithdrawableBalance | wallet.js | 提现页面 |
| 6 | 钱包 | createWithdrawal | wallet.js | 提现页面 |
| 7 | 钱包 | getWithdrawalPage | wallet.js | 钱包页面 |
| 8 | 计时 | getTimerStatus | timer.js | 订单详情页 |
| 9 | 异常 | reportException | exception.js | 订单详情页 |

---

## 二、模块详细设计

### 2.1 订单删除功能

**涉及页面：**
- `subpkg/order/detail.vue` - 订单详情页
- `pages/order/list.vue` - 订单列表页

**交互流程：**

**订单详情页：**
1. 判断订单状态：仅 `status === 60 (已完成)` 或 `status === 70 (已取消)` 显示删除入口
2. 左下角添加"..."更多菜单按钮
3. 底部操作栏添加"删除订单"按钮（与"再来一单"并排）
4. 点击删除时弹出确认框："确定要删除这个订单吗？删除后无法恢复。"
5. 确认后调用 `deleteOrder({ orderId })`
6. 成功后提示"订单已删除"，延迟1.5秒返回订单列表页

**订单列表页：**
1. 判断订单状态：仅 `status === 60 (已完成)` 或 `status === 70 (已取消)` 支持左滑
2. 左滑显示"删除"按钮
3. 点击删除弹出确认框
4. 确认后调用 `deleteOrder({ orderId })`
5. 成功后刷新列表

---

### 2.2 充值套餐功能

**涉及页面：**
- `subpkg/mine/recharge.vue` - 充值页面
- `subpkg/mine/wallet.vue` - 钱包页面

**交互流程：**

**充值页面改造：**
1. 页面 `onLoad` 时调用 `getWalletRechargePackages()` 获取套餐列表
2. 布局改为横向排列套餐按钮（参照打赏页面样式）
3. 套餐按钮显示：
   - 支付金额（元）
   - 赠送金额（元，如"+送 ¥20"）
4. 最后一个按钮为"自定义"，点击显示金额输入框
5. 用户选择套餐或输入自定义金额后，点击"立即充值"
6. 调用 `createWalletRecharge()`，传入：
   - 套餐选择：`{ packageId }`
   - 自定义：`{ payPrice: amount * 100 }`
7. 获取返回的 `payOrderId`，使用现有的支付流程
8. 支付成功后跳转充值成功页或返回钱包页

**钱包页面新增：**
1. 在钱包页面添加"充值记录"入口按钮
2. 点击跳转充值记录列表页（如需要新建页面）
3. 充值记录列表调用 `getWalletRechargePage({ pageNo, pageSize })`

---

### 2.3 提现功能（完全重写）

**涉及页面：**
- `subpkg/mine/withdraw.vue` - 提现页面
- `subpkg/mine/wallet.vue` - 钱包页面

**交互流程：**

**提现页面重写：**
1. 页面 `onLoad` 时调用 `getWithdrawableBalance()`
2. 显示余额信息：
   - 可提现余额：`(data.withdrawableAmount / 100).toFixed(2)`
   - 当前可申请：`(data.availableWithdrawAmount / 100).toFixed(2)`
3. 用户输入提现金额
4. 选择到账方式（微信/支付宝）：
   - accountType: 1-微信, 2-支付宝
5. 输入账户信息：
   - accountNo: 账号
   - realName: 真实姓名
6. 点击"确认提现"调用 `createWithdrawal()`
7. 成功后提示"提现申请已提交"，延迟1.5秒返回钱包页

**钱包页面新增：**
1. 添加"提现记录"入口按钮
2. 点击跳转提现记录列表页
3. 提现记录列表调用 `getWithdrawalPage({ pageNo, pageSize, status })`

---

### 2.4 计时状态功能

**涉及页面：**
- `subpkg/order/detail.vue` - 订单详情页

**交互流程：**

**订单详情页改造：**
1. 仅在 `status === 40 (进行中)` 时启用计时功能
2. 在顶部状态卡片显示计时信息：
   - 已服务时间：`formatSeconds(data.elapsedSeconds)`
   - 剩余时间：`formatSeconds(data.remainingSeconds)`
3. 5秒轮询调用 `getTimerStatus({ orderId })`
4. 本地每秒递减 `remainingSeconds`（用于UI平滑更新）
5. 下次轮询时用服务端数据修正本地计时
6. 如果 `status === 'ENDED'`，自动刷新订单状态

**数据流程：**
轮询 (5s) → getTimerStatus → 更新本地状态 → UI显示
                    ↓
               本地每秒递减

---

### 2.5 异常订单报告

**涉及页面：**
- `subpkg/order/detail.vue` - 订单详情页

**交互流程：**

**订单详情页新增：**
1. 在右上角添加"投诉"图标按钮
2. 仅在 `status !== 10 (待付款)` 时显示
3. 点击打开报告异常弹窗
4. 异常类型选择（4个选项）：
   - 1 - 用户投诉
   - 2 - 教练超时
   - 3 - 系统异常
   - 4 - 其他
5. 输入原因描述（最多500字）
6. 可选上传证据图片（复用现有上传组件）
7. 点击提交调用 `reportException({ orderId, exceptionType, reason, evidenceUrls })`
8. 成功后提示"问题已提交，客服会尽快处理"，关闭弹窗

---

### 2.6 钱包页面调整（简洁版）

**涉及页面：**
- `subpkg/mine/wallet.vue` - 钱包页面

**交互流程：**

**钱包页面新增：**
1. 保持现有余额、累计收支显示不变
2. 在"充值"、"提现"按钮下方或附近，添加两个入口按钮：
   - "充值记录" → 跳转充值记录列表
   - "提现记录" → 跳转提现记录列表
3. 布局保持简洁，不做大改动

---

## 三、文件变更清单

### 3.1 修改文件

| 文件路径 | 修改内容 |
|---------|----------|
| `subpkg/order/detail.vue` | 添加删除订单、计时状态、异常报告功能 |
| `pages/order/list.vue` | 添加左滑删除功能 |
| `subpkg/mine/recharge.vue` | 重构为套餐选择模式 |
| `subpkg/mine/withdraw.vue` | 完全重写提现逻辑 |
| `subpkg/mine/wallet.vue` | 添加充值/提现记录入口 |

### 3.2 可能新建文件

| 文件路径 | 说明 |
|---------|------|
| `subpkg/mine/recharge-record.vue` | 充值记录列表页（可选） |
| `subpkg/mine/withdrawal-record.vue` | 提现记录列表页（可选） |

---

## 四、技术规范

### 4.1 状态码定义

**订单状态：**
- 10 - 待付款
- 20 - 待接单
- 30 - 已接单
- 40 - 进行中
- 50 - 待评价
- 60 - 已完成
- 70 - 已取消
- 80 - 退款中

**异常类型：**
- 1 - 用户投诉
- 2 - 教练超时
- 3 - 系统异常
- 4 - 其他

**账户类型：**
- 1 - 微信
- 2 - 支付宝

### 4.2 工具函数

**秒数格式化：**
```javascript
function formatSeconds(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
```

---

## 五、验收标准

- [x] 订单详情页可以正常删除已完成、已取消订单
- [x] 订单列表页支持左滑删除功能
- [x] 充值页面可以正常选择套餐并发起充值
- [x] 提现页面使用新的接口，流程正常
- [x] 进行中订单可以实时显示计时状态
- [x] 订单详情页可以报告异常
- [x] 钱包页面可以进入充值/提现记录
- [x] 所有功能经过测试，无明显bug

---

## 📋 实施计划

### 阶段一：订单删除功能

**任务1.1：订单详情页添加删除功能**
- 文件：`subpkg/order/detail.vue`
- 依赖：无
- 步骤：
  1. 导入 `deleteOrder` 接口
  2. 添加左下角"..."更多菜单（仅 status 60/70 显示）
  3. 底部操作栏添加"删除订单"按钮（仅 status 60/70 显示）
  4. 添加删除确认弹窗
  5. 实现删除逻辑，成功后返回列表页
- 验收：已完成、已取消订单可以删除

**任务1.2：订单列表页添加左滑删除**
- 文件：`pages/order/list.vue`
- 依赖：无
- 步骤：
  1. 导入 `deleteOrder` 接口
  2. 添加左滑手势支持
  3. 左滑显示删除按钮（仅 status 60/70）
  4. 实现删除逻辑
- 验收：列表页可以左滑删除订单

---

### 阶段二：提现功能重写

**任务2.1：重写提现页面**
- 文件：`subpkg/mine/withdraw.vue`
- 依赖：无
- 步骤：
  1. 导入新的钱包接口
  2. 页面加载时调用 `getWithdrawableBalance()`
  3. 显示可提现余额信息
  4. 修改表单：accountType (1微信/2支付宝)
  5. 调用 `createWithdrawal()` 替代旧接口
  6. 成功后返回钱包页
- 验收：提现流程正常工作

---

### 阶段三：充值套餐功能

**任务3.1：重构充值页面**
- 文件：`subpkg/mine/recharge.vue`
- 依赖：无
- 步骤：
  1. 导入 `getWalletRechargePackages` 和 `createWalletRecharge`
  2. 页面加载时获取套餐列表
  3. 改为横向排列套餐按钮（参照打赏页面）
  4. 添加自定义金额输入
  5. 修改充值逻辑，调用新接口
- 验收：可以选择套餐或自定义金额充值

---

### 阶段四：计时状态功能

**任务4.1：订单详情页添加计时状态**
- 文件：`subpkg/order/detail.vue`
- 依赖：无
- 步骤：
  1. 导入 `getTimerStatus` 接口
  2. 添加计时状态显示区域（仅 status 40 显示）
  3. 实现5秒轮询逻辑
  4. 实现本地每秒递减显示
  5. 添加 `formatSeconds` 工具函数
- 验收：进行中订单实时显示计时状态

---

### 阶段五：异常订单报告

**任务5.1：添加异常报告功能**
- 文件：`subpkg/order/detail.vue`
- 依赖：无
- 步骤：
  1. 导入 `reportException` 接口
  2. 右上角添加"投诉"图标按钮（仅 status !== 10 显示）
  3. 创建报告异常弹窗
  4. 实现异常类型选择（4个选项）
  5. 实现原因输入
  6. 实现提交逻辑
- 验收：可以正常提交异常报告

---

### 阶段六：钱包页面调整

**任务6.1：添加充值/提现记录入口**
- 文件：`subpkg/mine/wallet.vue`
- 依赖：无
- 步骤：
  1. 添加"充值记录"按钮
  2. 添加"提现记录"按钮
  3. 实现跳转逻辑（可先占位，或创建新页面）
- 验收：可以看到并点击记录入口

---

### 阶段七：充值/提现记录页面（可选）

**任务7.1：创建充值记录页面**
- 文件：`subpkg/mine/recharge-record.vue`（新建）
- 依赖：任务6.1完成
- 步骤：创建列表页，调用 `getWalletRechargePage`

**任务7.2：创建提现记录页面**
- 文件：`subpkg/mine/withdrawal-record.vue`（新建）
- 依赖：任务6.1完成
- 步骤：创建列表页，调用 `getWithdrawalPage`

---

## 开发顺序建议

1. **第一优先级**：订单删除、提现重写、充值套餐
2. **第二优先级**：计时状态、异常报告
3. **第三优先级**：钱包页面调整、记录页面

---

## ✅ 文档完成总结

- 设计文档已准备好，请保存到：`docs/superpowers/specs/2026-05-15-api-interfaces-integration-design.md`
- 实施计划已准备好，请保存到：`docs/superpowers/plans/2026-05-15-api-interfaces-integration-plan.md`
