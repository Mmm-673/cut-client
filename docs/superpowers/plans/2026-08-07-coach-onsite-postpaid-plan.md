# 助教现场开单与后付费（会员端）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有"初球"UniApp 项目中新增独立的"助教现场开单、服务结束后付款"会员端功能，包括现场订单列表、详情页、支付流程，完全不影响现有预约订单功能。

**Architecture:** 采用完全独立的轻量架构——新增独立的 API 模块、独立的列表页和详情页，支付流程通过新增包装函数复用底层支付能力，零侵入现有订单和支付核心代码。

**Tech Stack:** UniApp + Vue 3 Composition API (`<script setup>`) + Pinia + SCSS + uni-ui + JSDoc 注释

## 全局约束

- 所有金额单位：后端返回整数"分"，前端展示除以 100 转元，`.toFixed(2)` 格式化
- 深色主题：背景 `#121619`，卡片 `#1E252B`，主色 `#00BB88`
- 请求头已携带 `client-version: 1.0.1`（`utils/request.js`），满足 > 1.0.0 要求
- 所有页面 `onLoad` 必须调用 `guardReviewEntry()` 审核模式守卫
- 服务类型名称：1-台球指导，2-潮玩领航，3-酒艺品鉴，4-影视赏析
- 不修改 `api/billiard/order.js`、`api/billiard/pay.js`、`pages/order/list.vue`、`subpkg/order/detail.vue`
- 不修改 `utils/payment.js` 中的现有函数，只在末尾追加

---

## Task 1: 新增现场订单 API 模块

**Files:**
- Create: `api/billiard/onsiteOrder.js`

**Interfaces:**
- Produces: `getOnsiteOrderPage(params)`, `getOnsiteOrderDetail(id)`

- [ ] **Step 1: 创建 `api/billiard/onsiteOrder.js`**

参照 `api/billiard/order.js` 的 JSDoc 风格，写入以下内容：

```javascript
import request from '@/utils/request'

/**
 * 会员现场订单分页列表
 * @description 只返回当前会员绑定的、已开始服务的现场订单
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码，默认 1
 * @param {number} [params.pageSize=10] - 每页数量，默认 10，范围 1～200
 * @returns {Promise<Object>} 返回分页数据
 * @returns {Array} returns.data.list - 现场订单列表
 * @returns {number} returns.data.total - 总记录数
 * @returns {number} returns.data.list[].id - 订单ID
 * @returns {string} returns.data.list[].orderNo - 订单号
 * @returns {number} returns.data.list[].coachId - 助教ID
 * @returns {number} returns.data.list[].customerType - 客户类型：1=会员 2=散客
 * @returns {number} returns.data.list[].serviceType - 服务类型：1=台球指导 2=潮玩领航 3=酒艺品鉴 4=影视赏析
 * @returns {number} returns.data.list[].status - 订单状态：40=进行中 45=现场待付款 50=待评价 60=已完成
 * @returns {number} returns.data.list[].unitPrice - 小时单价（分/小时）
 * @returns {number} [returns.data.list[].billingMinutes] - 计费分钟数（结束锁价后返回）
 * @returns {number} [returns.data.list[].actualDurationSeconds] - 实际服务秒数（结束锁价后返回）
 * @returns {number} returns.data.list[].returnTravelAmount - 返程车费（分）
 * @returns {number} [returns.data.list[].payAmount] - 最终应付金额（分，结束锁价后返回）
 * @returns {number} returns.data.list[].paymentStatus - 支付主状态：0=未支付 10=已支付 20=支付异常
 * @returns {number} returns.data.list[].settlementStatus - 结算状态：0=未开始 10=处理中 20=成功 30=失败待重试
 * @returns {string} [returns.data.list[].startTime] - 服务端开始时间
 * @returns {string} [returns.data.list[].endTime] - 服务端结束时间
 */
export function getOnsiteOrderPage(params) {
  return request({
    url: '/app-api/billiard/onsite-order/page',
    method: 'get',
    params
  })
}

/**
 * 会员现场订单详情
 * @param {number|string} id - 订单ID
 * @returns {Promise<Object>} 返回订单详情 OnsiteOrderRespVO
 * @returns {number} returns.data.id - 订单ID
 * @returns {string} returns.data.orderNo - 订单号
 * @returns {number} returns.data.coachId - 助教ID
 * @returns {string} [returns.data.coachStageName] - 助教艺名
 * @returns {string} [returns.data.coachMainPhoto] - 助教头像URL
 * @returns {number} returns.data.customerType - 客户类型
 * @returns {number} returns.data.serviceType - 服务类型
 * @returns {number} returns.data.status - 订单状态
 * @returns {number} returns.data.unitPrice - 小时单价（分）
 * @returns {number} [returns.data.billingMinutes] - 计费分钟数
 * @returns {number} [returns.data.actualDurationSeconds] - 实际服务秒数
 * @returns {number} returns.data.returnTravelAmount - 返程车费（分）
 * @returns {number} [returns.data.payAmount] - 最终应付金额（分）
 * @returns {number} returns.data.paymentStatus - 支付主状态
 * @returns {number} returns.data.settlementStatus - 结算状态
 * @returns {string} [returns.data.startTime] - 服务开始时间
 * @returns {string} [returns.data.endTime] - 服务结束时间
 */
export function getOnsiteOrderDetail(id) {
  return request({
    url: '/app-api/billiard/onsite-order/get',
    method: 'get',
    params: { id }
  })
}

export default {
  getOnsiteOrderPage,
  getOnsiteOrderDetail
}
```

- [ ] **Step 2: 确认文件路径和导出方式与现有 API 模块一致**

检查 `api/billiard/` 目录下其他文件的命名和导出风格，确认 `onsiteOrder.js` 遵循相同模式（命名导出 + default 对象导出）。

---

## Task 2: 新增现场支付 API 模块

**Files:**
- Create: `api/billiard/onsitePay.js`

**Interfaces:**
- Produces: `createOnsitePayment(data)`, `getOnsitePaymentStatus(orderId)`
- Consumes: `@/utils/request`

- [ ] **Step 1: 创建 `api/billiard/onsitePay.js`**

参照 `api/billiard/pay.js` 的 JSDoc 风格，写入以下内容：

```javascript
import request from '@/utils/request'

/**
 * 创建现场支付尝试（会员App支付）
 * @description 只创建支付单，不拉起App支付。成功后使用响应中的 payOrderId 调用现有支付提交接口
 * @param {Object} data - 请求参数
 * @param {number} data.orderId - 现场订单ID
 * @param {string} data.channelCode - 支付渠道编码：wx_app / alipay_app
 * @returns {Promise<Object>} 返回支付尝试信息 OnsitePaymentRespVO
 * @returns {number} returns.data.paymentId - 现场支付聚合ID
 * @returns {number} returns.data.attemptId - 本次支付尝试ID
 * @returns {number} returns.data.payOrderId - pay模块支付单ID
 * @returns {number} returns.data.orderId - 现场订单ID
 * @returns {string} returns.data.merchantOrderNo - 商户支付单号
 * @returns {number} returns.data.amount - 固定支付金额（分）
 * @returns {number} returns.data.paymentStatus - 支付主状态
 * @returns {number} returns.data.attemptStatus - 本次尝试状态
 * @returns {number} returns.data.settlementStatus - 结算状态
 * @returns {string} returns.data.channelCode - 本次固定支付渠道
 */
export function createOnsitePayment(data) {
  return request({
    url: '/app-api/billiard/onsite-payment/create',
    method: 'post',
    data
  })
}

/**
 * 查询现场支付和结算状态（会员端）
 * @param {number} orderId - 现场订单ID
 * @returns {Promise<Object>} 返回支付状态 OnsitePaymentRespVO
 * @returns {number} returns.data.paymentId - 现场支付聚合ID
 * @returns {number} returns.data.orderId - 现场订单ID
 * @returns {number} returns.data.amount - 固定支付金额（分）
 * @returns {number} returns.data.paymentStatus - 支付主状态：0=未支付 10=已支付 20=支付异常
 * @returns {number} returns.data.settlementStatus - 结算状态：0=未开始 10=处理中 20=成功 30=失败待重试
 * @returns {string} [returns.data.channelCode] - 支付渠道编码
 */
export function getOnsitePaymentStatus(orderId) {
  return request({
    url: '/app-api/billiard/onsite-payment/status',
    method: 'get',
    params: { orderId }
  })
}

export default {
  createOnsitePayment,
  getOnsitePaymentStatus
}
```

- [ ] **Step 2: 确认命名风格一致**

确认 `onsitePay.js` 的命名风格与 `pay.js`、`order.js` 等现有文件一致。

---

## Task 3: 新增错误码映射

**Files:**
- Modify: `utils/error-messages.js`

**Interfaces:**
- Consumes: `errorMessages` 对象
- Produces: 新增 4 个现场订单相关错误码

- [ ] **Step 1: 在 `utils/error-messages.js` 中新增错误码**

在 `errorMessages` 对象中，`default` 之前插入以下错误码：

```javascript
  // 现场订单相关
  1010000337: '请升级客户端后使用现场开单',
  1010000338: '当前现场订单状态不允许该操作',
  1010000341: '现场订单尚未结束或金额未锁定',
  1010000342: '现场订单已支付',
```

注意保持与现有代码风格一致，不要改动其他错误码。

---

## Task 4: 新增现场订单列表页

**Files:**
- Create: `pages/onsite/list.vue`

**Interfaces:**
- Consumes: `getOnsiteOrderPage(params)` from `@/api/billiard/onsiteOrder`
- Consumes: `guardReviewEntry()` from `@/utils/review`
- Produces: 现场订单列表页面，点击跳转到 `/subpkg/onsite/detail?id=xxx`

- [ ] **Step 1: 创建 `pages/onsite/list.vue` 模板部分**

参照 `pages/order/list.vue` 的深色主题风格，使用 `<script setup>` + Composition API。

```vue
<template>
  <view class="onsite-list-wrapper" :class="themeClass">
    <!-- 订单列表 -->
    <scroll-view
      class="order-scroll"
      scroll-y="true"
      :style="{ height: scrollHeight + 'px' }"
      refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <view class="order-container">
        <view
          class="order-card"
          v-for="order in orderList"
          :key="order.id"
          @click="goDetail(order.id)"
        >
          <!-- 订单头部 -->
          <view class="order-header">
            <view class="order-type">
              <text class="type-icon">{{ getServiceIcon(order.serviceType) }}</text>
              <text class="type-name">{{ getServiceTypeName(order.serviceType) }}</text>
            </view>
            <view class="order-status" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status, order.paymentStatus) }}
            </view>
          </view>

          <!-- 助教信息 -->
          <view class="coach-row">
            <image class="coach-avatar" :src="order.coachMainPhoto || '/static/default-avatar.png'" mode="aspectFill" />
            <text class="coach-name">{{ order.coachStageName || '助教' }}</text>
          </view>

          <!-- 时间/金额信息 -->
          <view class="order-info">
            <view class="info-item" v-if="order.status === 40">
              <text class="info-label">开始时间</text>
              <text class="info-value">{{ formatTime(order.startTime) }}</text>
            </view>
            <view class="info-item" v-if="order.status !== 40 && order.billingMinutes">
              <text class="info-label">服务时长</text>
              <text class="info-value">{{ formatDuration(order.billingMinutes) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">单价</text>
              <text class="info-value">¥{{ formatAmount(order.unitPrice) }}/小时</text>
            </view>
            <view class="info-item" v-if="order.status !== 40 && order.payAmount">
              <text class="info-label">实付金额</text>
              <text class="info-value amount">¥{{ formatAmount(order.payAmount) }}</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view class="empty-state" v-if="!loading && orderList.length === 0">
          <text class="empty-icon">📋</text>
          <text class="empty-text">暂无现场订单</text>
        </view>

        <!-- 加载更多 -->
        <view class="load-more" v-if="orderList.length > 0">
          <uni-load-more :status="loadMoreStatus" />
        </view>
      </view>
    </scroll-view>
  </view>
</template>
```

- [ ] **Step 2: 写入 script 部分**

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { getOnsiteOrderPage } from '@/api/billiard/onsiteOrder'
import { useThemeStore } from '@/store'
import { usePageTheme } from '@/composables/usePageTheme'
import { guardReviewEntry } from '@/utils/review'

usePageTheme()
const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 服务类型名称
const SERVICE_TYPE_NAMES = {
  1: '台球指导',
  2: '潮玩领航',
  3: '酒艺品鉴',
  4: '影视赏析'
}

// 服务类型图标（emoji）
const SERVICE_TYPE_ICONS = {
  1: '🎱',
  2: '🌟',
  3: '🍷',
  4: '🎬'
}

// 状态文本
const STATUS_TEXT = {
  40: '进行中',
  45: '待付款',
  50: '待评价',
  60: '已完成'
}

// 状态样式类
const STATUS_CLASS = {
  40: 'status-progress',
  45: 'status-pending-pay',
  50: 'status-review',
  60: 'status-completed'
}

// 分页参数
const pageNo = ref(1)
const pageSize = 10
const orderList = ref([])
const total = ref(0)
const refreshing = ref(false)
const loading = ref(false)
const loadMoreStatus = ref('more') // more / loading / noMore
const scrollHeight = ref(0)

// 已加载的订单ID集合，用于去重
const loadedIds = new Set()

const getServiceTypeName = (type) => SERVICE_TYPE_NAMES[type] || '服务'
const getServiceIcon = (type) => SERVICE_TYPE_ICONS[type] || '🎯'

const getStatusText = (status, paymentStatus) => {
  // 45状态且已支付，显示结算中
  if (status === 45 && paymentStatus === 10) {
    return '结算中'
  }
  return STATUS_TEXT[status] || '未知'
}

const getStatusClass = (status) => STATUS_CLASS[status] || ''

// 格式化金额（分转元）
const formatAmount = (cents) => {
  if (cents === null || cents === undefined) return '0.00'
  return (cents / 100).toFixed(2)
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

// 格式化时长（分钟转中文）
const formatDuration = (minutes) => {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) {
    return `${hours}小时${mins}分钟`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    return `${mins}分钟`
  }
}

// 加载列表
const loadList = async (isRefresh = false) => {
  if (loading.value) return

  if (isRefresh) {
    pageNo.value = 1
    orderList.value = []
    loadedIds.clear()
    loadMoreStatus.value = 'more'
  }

  if (loadMoreStatus.value === 'noMore') return

  loading.value = true

  try {
    const res = await getOnsiteOrderPage({
      pageNo: pageNo.value,
      pageSize
    })
    const data = res.data || {}
    const list = data.list || []
    const totalCount = data.total || 0

    total.value = totalCount

    // 去重追加
    const newItems = list.filter(item => !loadedIds.has(item.id))
    newItems.forEach(item => loadedIds.add(item.id))
    orderList.value = [...orderList.value, ...newItems]

    if (orderList.value.length >= totalCount || list.length < pageSize) {
      loadMoreStatus.value = 'noMore'
    } else {
      pageNo.value++
      loadMoreStatus.value = 'more'
    }
  } catch (error) {
    console.error('加载现场订单列表失败:', error)
    loadMoreStatus.value = 'more'
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  await loadList(true)
}

// 上拉加载更多
const loadMore = () => {
  if (loadMoreStatus.value === 'more' && !loading.value) {
    loadList(false)
  }
}

// 跳转到详情
const goDetail = (id) => {
  uni.navigateTo({ url: `/subpkg/onsite/detail?id=${id}` })
}

// 计算滚动区域高度
const calcScrollHeight = () => {
  const systemInfo = uni.getSystemInfoSync()
  scrollHeight.value = systemInfo.windowHeight
}

onLoad(() => {
  // 审核模式守卫
  if (!guardReviewEntry()) return
  calcScrollHeight()
})

onMounted(() => {
  loadList(true)
})

onShow(() => {
  // 每次回到页面刷新第一页（支付后状态可能变化）
  if (orderList.value.length > 0) {
    loadList(true)
  }
})
</script>
```

- [ ] **Step 3: 写入样式部分**

参照 `pages/order/list.vue` 的深色主题卡片风格：

```vue
<style lang="scss" scoped>
.onsite-list-wrapper {
  width: 100%;
  height: 100vh;
  background: var(--bg-page, #121619);
}

.order-scroll {
  width: 100%;
}

.order-container {
  padding: 24rpx;
  padding-bottom: 60rpx;
}

.order-card {
  background: var(--bg-card, #1E252B);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .order-type {
      display: flex;
      align-items: center;
      gap: 10rpx;

      .type-icon {
        font-size: 32rpx;
      }

      .type-name {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--text-primary, #fff);
      }
    }

    .order-status {
      font-size: 24rpx;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;

      &.status-progress {
        color: #3B82F6;
        background: rgba(59, 130, 246, 0.15);
      }

      &.status-pending-pay {
        color: #F59E0B;
        background: rgba(245, 158, 11, 0.15);
      }

      &.status-review {
        color: #00BB88;
        background: rgba(0, 187, 136, 0.15);
      }

      &.status-completed {
        color: #6B7280;
        background: rgba(107, 114, 128, 0.15);
      }
    }
  }

  .coach-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;

    .coach-avatar {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      background: #333;
    }

    .coach-name {
      font-size: 28rpx;
      color: var(--text-primary, #fff);
    }
  }

  .order-info {
    border-top: 1rpx solid var(--border-color, rgba(255, 255, 255, 0.06));
    padding-top: 20rpx;

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        font-size: 26rpx;
        color: var(--text-secondary, #9CA3AF);
      }

      .info-value {
        font-size: 26rpx;
        color: var(--text-primary, #fff);

        &.amount {
          color: #F59E0B;
          font-weight: 600;
          font-size: 30rpx;
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .empty-icon {
    font-size: 100rpx;
    margin-bottom: 24rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: var(--text-secondary, #9CA3AF);
  }
}

.load-more {
  padding: 30rpx 0;
}
</style>
```

- [ ] **Step 4: 检查 guardReviewEntry 导入路径是否正确**

确认 `@/utils/review` 中导出了 `guardReviewEntry` 函数。如果路径不同，调整为正确路径。

---

## Task 5: 新增现场支付包装函数

**Files:**
- Modify: `utils/payment.js`（仅在末尾追加，不改动现有函数）

**Interfaces:**
- Consumes: `createOnsitePayment`, `getOnsitePaymentStatus` from `@/api/billiard/onsitePay`
- Consumes: `executePayment` (existing)
- Produces: `executeOnsitePayment(options)` 新函数

- [ ] **Step 1: 在 `utils/payment.js` 顶部 import 区域添加现场支付 API**

在现有 import 语句下方添加：

```javascript
import { createOnsitePayment, getOnsitePaymentStatus } from '@/api/billiard/onsitePay'
```

- [ ] **Step 2: 在文件末尾、`export default` 之前添加现场支付函数**

在文件末尾的 `export default` 之前，添加以下代码（不要改动任何现有函数）：

```javascript
/**
 * ========================================
 * 现场订单支付（新增，不影响现有支付逻辑）
 * ========================================
 */

/**
 * 创建轮询器（用于现场支付状态轮询）
 * @param {Object} options
 * @param {Function} options.fn - 轮询执行的异步函数
 * @param {Function} options.check - 检查是否停止的函数，返回 true 则停止并 resolve
 * @param {number} [options.interval=2500] - 轮询间隔（毫秒）
 * @param {number} [options.maxAttempts=30] - 最大轮询次数
 * @returns {Object} 轮询器对象 { start(), stop(), pause(), resume() }
 */
function createPoller({ fn, check, interval = 2500, maxAttempts = 30 }) {
  let timer = null
  let attempts = 0
  let stopped = false
  let paused = false
  let resolvePromise = null
  let rejectPromise = null

  const run = async () => {
    if (stopped || paused) return

    attempts++
    try {
      const result = await fn()

      if (check(result)) {
        stopped = true
        if (resolvePromise) resolvePromise(result)
        return
      }

      if (attempts >= maxAttempts) {
        stopped = true
        const timeoutError = new Error('轮询超时')
        timeoutError.timeout = true
        timeoutError.lastResult = result
        if (resolvePromise) resolvePromise(result) // 超时时返回最后结果，由调用方处理
        return
      }

      timer = setTimeout(run, interval)
    } catch (error) {
      stopped = true
      if (rejectPromise) rejectPromise(error)
    }
  }

  return {
    start() {
      return new Promise((resolve, reject) => {
        resolvePromise = resolve
        rejectPromise = reject
        stopped = false
        paused = false
        attempts = 0
        run()
      })
    },
    stop() {
      stopped = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
    pause() {
      paused = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
    resume() {
      if (stopped) return
      paused = false
      run()
    }
  }
}

/**
 * 执行现场订单支付
 * @description 先创建现场支付尝试，再调用现有 executePayment 执行支付，最后轮询结算状态
 * @param {Object} options - 支付选项
 * @param {number} options.orderId - 现场订单ID
 * @param {string} options.payValue - 支付方式值（wechat / alipay）
 * @param {string} [options.channelCode] - 支付渠道编码，优先使用
 * @param {Function} [options.onPaymentSuccess] - 原生支付成功回调（通知页面隐藏支付按钮）
 * @param {Function} [options.onSettlementSuccess] - 结算成功回调
 * @param {Function} [options.onCancel] - 支付取消回调
 * @param {Function} [options.onError] - 支付失败回调
 * @returns {Object} { payResult, poller } - 支付结果和轮询器实例
 */
export async function executeOnsitePayment(options) {
  const {
    orderId,
    payValue,
    channelCode,
    onPaymentSuccess,
    onSettlementSuccess,
    onCancel,
    onError
  } = options

  let poller = null

  try {
    if (!orderId) {
      throw new Error('订单信息缺失')
    }

    // 1. 确定渠道编码
    const finalChannelCode = channelCode || getChannelCode(payValue)
    if (!finalChannelCode) {
      throw new Error('不支持的支付方式')
    }

    // 2. 创建现场支付尝试
    const createRes = await createOnsitePayment({
      orderId,
      channelCode: finalChannelCode
    })
    const paymentData = createRes.data || {}
    const payOrderId = paymentData.payOrderId

    if (!payOrderId) {
      throw new Error('支付单创建失败')
    }

    // 3. 调用现有支付执行（复用 executePayment）
    const payResult = await executePayment({
      payOrderId,
      payValue,
      channelCode: finalChannelCode,
      orderId,
      onCancel: (err) => {
        if (onCancel && typeof onCancel === 'function') {
          onCancel(err)
        }
      },
      onError: (err) => {
        if (onError && typeof onError === 'function') {
          onError(err)
        }
      }
    })

    // 4. 原生支付成功，通知页面
    if (onPaymentSuccess && typeof onPaymentSuccess === 'function') {
      onPaymentSuccess(paymentData)
    }

    // 5. 启动结算状态轮询
    poller = createPoller({
      fn: () => getOnsitePaymentStatus(orderId).then(res => res.data),
      check: (data) => {
        // 结算成功则停止
        return data && data.settlementStatus === 20
      },
      interval: 2500,
      maxAttempts: 30
    })

    poller.start().then((finalStatus) => {
      if (finalStatus && finalStatus.settlementStatus === 20) {
        if (onSettlementSuccess && typeof onSettlementSuccess === 'function') {
          onSettlementSuccess(finalStatus)
        }
      }
    }).catch((err) => {
      console.error('现场支付结算轮询异常:', err)
    })

    return { payResult, poller, paymentData }
  } catch (error) {
    console.error('现场支付失败:', error)

    // 支付取消（不触发 onError）
    if (error.canceled) {
      throw error
    }

    if (onError && typeof onError === 'function') {
      onError(error)
    }
    throw error
  }
}

/**
 * 获取现场订单可用的支付渠道（仅微信+支付宝App支付）
 * @param {Array<string>} [enabledCodes] - 后端返回的启用渠道编码
 * @returns {Array} 可用支付渠道列表
 */
export function getOnsitePayChannels(enabledCodes) {
  // 现场订单只支持 wx_app 和 alipay_app
  const onsiteSupported = ['wx_app', 'alipay_app']
  const allChannels = enabledCodes ? getPayChannelsByEnabled(enabledCodes) : getAvailablePayChannels()
  return allChannels.filter(ch => onsiteSupported.includes(ch.channelCode))
}
```

- [ ] **Step 3: 在 export default 中导出新函数**

在 `export default` 对象中追加：

```javascript
  executeOnsitePayment,
  getOnsitePayChannels,
  createPoller,
```

保持与现有导出风格一致。

- [ ] **Step 4: 验证不影响现有功能**

确认所有现有函数（`executePayment`、`pollPayStatus`、`getAvailablePayChannels` 等）的代码完全没有改动。

---

## Task 6: 新增现场订单详情页

**Files:**
- Create: `subpkg/onsite/detail.vue`

**Interfaces:**
- Consumes: `getOnsiteOrderDetail(id)` from `@/api/billiard/onsiteOrder`
- Consumes: `executeOnsitePayment`, `getOnsitePayChannels` from `@/utils/payment`
- Consumes: `guardReviewEntry()` from `@/utils/review`
- Produces: 现场订单详情页（多状态：进行中/待付款/待评价/已完成）

- [ ] **Step 1: 创建 `subpkg/onsite/detail.vue` 模板部分**

```vue
<template>
  <view class="onsite-detail-wrapper" :class="themeClass">
    <scroll-view class="detail-scroll" scroll-y="true">
      <view class="detail-container">
        <!-- 顶部状态卡片 -->
        <view class="status-card" :class="statusCardClass">
          <text class="status-icon">{{ statusIcon }}</text>
          <text class="status-title">{{ statusTitle }}</text>
          <text class="status-subtitle" v-if="statusSubtitle">{{ statusSubtitle }}</text>
          <!-- 进行中显示实时计时 -->
          <view class="timer-display" v-if="orderDetail.status === 40">
            <text class="timer-text">{{ timerDisplay }}</text>
          </view>
          <!-- 待付款显示金额 -->
          <view class="amount-display" v-if="showPayAmount">
            <text class="amount-label">应付金额</text>
            <text class="amount-value">¥{{ formatAmount(orderDetail.payAmount) }}</text>
          </view>
        </view>

        <!-- 服务信息卡片 -->
        <view class="info-card">
          <view class="card-title">服务信息</view>
          <view class="info-row">
            <text class="info-label">服务类型</text>
            <text class="info-value">{{ getServiceTypeName(orderDetail.serviceType) }}</text>
          </view>
          <view class="info-row" v-if="orderDetail.startTime">
            <text class="info-label">开始时间</text>
            <text class="info-value">{{ formatFullTime(orderDetail.startTime) }}</text>
          </view>
          <view class="info-row" v-if="orderDetail.endTime">
            <text class="info-label">结束时间</text>
            <text class="info-value">{{ formatFullTime(orderDetail.endTime) }}</text>
          </view>
          <view class="info-row" v-if="orderDetail.billingMinutes">
            <text class="info-label">计费时长</text>
            <text class="info-value">{{ formatDuration(orderDetail.billingMinutes) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">小时单价</text>
            <text class="info-value">¥{{ formatAmount(orderDetail.unitPrice) }}/小时</text>
          </view>
          <view class="info-row">
            <text class="info-label">返程车费</text>
            <text class="info-value">¥{{ formatAmount(orderDetail.returnTravelAmount) }}</text>
          </view>
          <view class="info-row total-row" v-if="orderDetail.payAmount">
            <text class="info-label">实付金额</text>
            <text class="info-value total-amount">¥{{ formatAmount(orderDetail.payAmount) }}</text>
          </view>
        </view>

        <!-- 助教信息卡片 -->
        <view class="info-card">
          <view class="card-title">助教信息</view>
          <view class="coach-info">
            <image class="coach-avatar" :src="orderDetail.coachMainPhoto || '/static/default-avatar.png'" mode="aspectFill" />
            <view class="coach-detail">
              <text class="coach-name">{{ orderDetail.coachStageName || '助教' }}</text>
            </view>
          </view>
        </view>

        <!-- 订单信息 -->
        <view class="info-card">
          <view class="card-title">订单信息</view>
          <view class="info-row">
            <text class="info-label">订单编号</text>
            <text class="info-value order-no">{{ orderDetail.orderNo }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="showBottomBar">
      <!-- 待付款 & 未支付 -->
      <view class="bar-pay" v-if="orderDetail.status === 45 && orderDetail.paymentStatus === 0">
        <button class="btn-primary" @click="openPayPopup" :loading="payLoading">
          去支付
        </button>
      </view>

      <!-- 待付款 & 已支付结算中 -->
      <view class="bar-settling" v-else-if="orderDetail.status === 45 && orderDetail.paymentStatus === 10">
        <view class="settling-tip">
          <text class="settling-icon">⏳</text>
          <text class="settling-text">支付成功，订单处理中...</text>
        </view>
      </view>

      <!-- 待评价 -->
      <view class="bar-review" v-else-if="orderDetail.status === 50">
        <button class="btn-primary" @click="goEvaluate">
          去评价
        </button>
      </view>
    </view>

    <!-- 支付弹窗 -->
    <view class="pay-popup-mask" v-if="showPayPopup" @click="closePayPopup">
      <view class="pay-popup" @click.stop>
        <view class="popup-header">
          <text class="popup-title">选择支付方式</text>
          <text class="popup-close" @click="closePayPopup">✕</text>
        </view>
        <view class="popup-amount">
          <text class="amount-label">支付金额</text>
          <text class="amount-value">¥{{ formatAmount(orderDetail.payAmount) }}</text>
        </view>
        <view class="pay-channel-list">
          <view
            class="pay-channel-item"
            v-for="channel in payChannels"
            :key="channel.channelCode"
            :class="{ active: selectedChannel === channel.channelCode }"
            @click="selectChannel(channel.channelCode)"
          >
            <view class="channel-icon" :style="{ background: channel.bgColor }">
              <image v-if="channel.icon && channel.icon.startsWith('/')" :src="channel.icon" mode="aspectFit" />
              <text v-else class="channel-emoji">{{ getChannelEmoji(channel.channelCode) }}</text>
            </view>
            <text class="channel-name">{{ channel.label }}</text>
            <view class="channel-radio">
              <view class="radio-inner" v-if="selectedChannel === channel.channelCode"></view>
            </view>
          </view>
        </view>
        <button
          class="btn-confirm-pay"
          :loading="payLoading"
          :disabled="!selectedChannel || payLoading"
          @click="confirmPay"
        >
          确认支付
        </button>
      </view>
    </view>

    <!-- 安全区域 -->
    <view class="safe-area-bottom"></view>
  </view>
</template>
```

- [ ] **Step 2: 写入 script 部分**

```vue
<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad, onShow, onHide } from '@dcloudio/uni-app'
import { getOnsiteOrderDetail } from '@/api/billiard/onsiteOrder'
import { executeOnsitePayment, getOnsitePayChannels } from '@/utils/payment'
import { useThemeStore } from '@/store'
import { usePageTheme } from '@/composables/usePageTheme'
import { guardReviewEntry } from '@/utils/review'

usePageTheme()
const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 服务类型名称
const SERVICE_TYPE_NAMES = {
  1: '台球指导',
  2: '潮玩领航',
  3: '酒艺品鉴',
  4: '影视赏析'
}

// 状态
const orderId = ref('')
const orderDetail = ref({})
const loading = ref(false)

// 支付相关
const showPayPopup = ref(false)
const payLoading = ref(false)
const selectedChannel = ref('')
const payChannels = ref([])
let payPoller = null

// 计时相关
let timerInterval = null
let pollingTimer = null // 详情校准轮询
const timerDisplay = ref('00:00:00')

// 计算属性
const showBottomBar = computed(() => {
  const status = orderDetail.value.status
  return status === 45 || status === 50
})

const showPayAmount = computed(() => {
  const status = orderDetail.value.status
  return (status === 45 || status === 50 || status === 60) && orderDetail.value.payAmount
})

const statusIcon = computed(() => {
  const s = orderDetail.value.status
  if (s === 40) return '🔵'
  if (s === 45) {
    return orderDetail.value.paymentStatus === 10 ? '⏳' : '🟠'
  }
  if (s === 50) return '🟢'
  if (s === 60) return '✅'
  return '📋'
})

const statusTitle = computed(() => {
  const s = orderDetail.value.status
  if (s === 40) return '服务进行中'
  if (s === 45) {
    return orderDetail.value.paymentStatus === 10 ? '支付处理中' : '待支付'
  }
  if (s === 50) return '待评价'
  if (s === 60) return '已完成'
  return ''
})

const statusSubtitle = computed(() => {
  const s = orderDetail.value.status
  if (s === 40) return '请享受服务时光'
  if (s === 45 && orderDetail.value.paymentStatus === 10) return '订单结算中，请稍候...'
  if (s === 50) return '对本次服务满意吗？去评价吧'
  if (s === 60) return '感谢您的使用'
  return ''
})

const statusCardClass = computed(() => {
  const s = orderDetail.value.status
  if (s === 40) return 'status-card-progress'
  if (s === 45) return 'status-card-pending'
  if (s === 50) return 'status-card-review'
  if (s === 60) return 'status-card-completed'
  return ''
})

// 方法
const getServiceTypeName = (type) => SERVICE_TYPE_NAMES[type] || '服务'

const formatAmount = (cents) => {
  if (cents === null || cents === undefined) return '0.00'
  return (cents / 100).toFixed(2)
}

const formatFullTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

const formatDuration = (minutes) => {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) return `${hours}小时${mins}分钟`
  if (hours > 0) return `${hours}小时`
  return `${mins}分钟`
}

const getChannelEmoji = (code) => {
  if (code === 'wx_app') return '💚'
  if (code === 'alipay_app') return '💙'
  return '💰'
}

// 加载详情
const loadDetail = async () => {
  if (!orderId.value) return
  try {
    const res = await getOnsiteOrderDetail(orderId.value)
    orderDetail.value = res.data || {}
  } catch (error) {
    console.error('加载现场订单详情失败:', error)
  }
}

// ---- 计时相关（状态40）----
const startTimer = () => {
  if (orderDetail.value.status !== 40) return
  if (!orderDetail.value.startTime) return

  updateTimerDisplay()
  timerInterval = setInterval(() => {
    updateTimerDisplay()
  }, 1000)

  // 30秒校准一次
  startDetailPolling()
}

const updateTimerDisplay = () => {
  const startTime = new Date(orderDetail.value.startTime).getTime()
  const now = Date.now()
  let diff = Math.floor((now - startTime) / 1000)
  if (diff < 0) diff = 0

  const h = String(Math.floor(diff / 3600)).padStart(2, '0')
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
  const s = String(diff % 60).padStart(2, '0')
  timerDisplay.value = `${h}:${m}:${s}`
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  stopDetailPolling()
}

// 详情校准轮询（30秒一次，检测服务是否结束）
const startDetailPolling = () => {
  stopDetailPolling()
  pollingTimer = setInterval(async () => {
    await loadDetail()
    // 如果状态从40变成45，停止计时
    if (orderDetail.value.status === 45) {
      stopTimer()
    }
  }, 30000)
}

const stopDetailPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// ---- 支付相关 ----
const openPayPopup = async () => {
  // 初始化支付渠道（现场订单只有微信和支付宝）
  payChannels.value = getOnsitePayChannels()
  if (payChannels.value.length > 0) {
    selectedChannel.value = payChannels.value[0].channelCode
  }
  showPayPopup.value = true
}

const closePayPopup = () => {
  if (payLoading.value) return // 支付中不能关闭
  showPayPopup.value = false
}

const selectChannel = (code) => {
  selectedChannel.value = code
}

const confirmPay = async () => {
  if (!selectedChannel.value || payLoading.value) return

  payLoading.value = true
  try {
    const { poller } = await executeOnsitePayment({
      orderId: orderId.value,
      payValue: getPayValueByCode(selectedChannel.value),
      channelCode: selectedChannel.value,
      onPaymentSuccess: () => {
        // 原生支付成功，关闭弹窗，隐藏支付按钮
        showPayPopup.value = false
        // 刷新详情确认状态
        loadDetail()
      },
      onSettlementSuccess: () => {
        // 结算成功，刷新详情
        loadDetail()
      },
      onCancel: () => {
        uni.showToast({ title: '支付已取消', icon: 'none' })
      },
      onError: (err) => {
        // 业务错误处理
        const msg = err?.message || '支付失败'
        // 针对特定错误码的处理
        if (msg.includes('已支付')) {
          loadDetail() // 刷新状态
        }
        uni.showToast({ title: msg, icon: 'none' })
      }
    })

    payPoller = poller
  } catch (error) {
    if (!error.canceled) {
      console.error('支付失败:', error)
    }
  } finally {
    payLoading.value = false
  }
}

const getPayValueByCode = (code) => {
  if (code === 'wx_app') return 'wechat'
  if (code === 'alipay_app') return 'alipay'
  return ''
}

// ---- 评价 ----
const goEvaluate = () => {
  uni.navigateTo({
    url: `/subpkg/coach/evaluate?orderId=${orderId.value}&coachId=${orderDetail.value.coachId}`
  })
}

// ---- 生命周期 ----
onLoad((options) => {
  if (!guardReviewEntry()) return
  orderId.value = options.id
  loadDetail()
})

onShow(() => {
  // 回到页面刷新详情
  if (orderId.value) {
    loadDetail()
  }
  // 如果是进行中状态，恢复计时
  if (orderDetail.value.status === 40) {
    startTimer()
  }
  // 恢复支付轮询（如果有的话）
  if (payPoller) {
    payPoller.resume()
  }
})

onHide(() => {
  // 离开页面暂停计时
  stopTimer()
  // 暂停支付轮询
  if (payPoller) {
    payPoller.pause()
  }
})

onUnmounted(() => {
  stopTimer()
  if (payPoller) {
    payPoller.stop()
    payPoller = null
  }
})
</script>
```

- [ ] **Step 3: 写入样式部分**

```vue
<style lang="scss" scoped>
.onsite-detail-wrapper {
  min-height: 100vh;
  background: var(--bg-page, #121619);
  padding-bottom: 140rpx;
}

.detail-scroll {
  height: 100vh;
}

.detail-container {
  padding: 24rpx;
}

/* 状态卡片 */
.status-card {
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  margin-bottom: 24rpx;
  text-align: center;

  &.status-card-progress {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%);
  }

  &.status-card-pending {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%);
  }

  &.status-card-review {
    background: linear-gradient(135deg, rgba(0, 187, 136, 0.2) 0%, rgba(0, 187, 136, 0.05) 100%);
  }

  &.status-card-completed {
    background: linear-gradient(135deg, rgba(107, 114, 128, 0.2) 0%, rgba(107, 114, 128, 0.05) 100%);
  }

  .status-icon {
    font-size: 64rpx;
    display: block;
    margin-bottom: 16rpx;
  }

  .status-title {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--text-primary, #fff);
    display: block;
    margin-bottom: 8rpx;
  }

  .status-subtitle {
    font-size: 26rpx;
    color: var(--text-secondary, #9CA3AF);
    display: block;
  }

  .timer-display {
    margin-top: 24rpx;

    .timer-text {
      font-size: 56rpx;
      font-weight: 700;
      color: #3B82F6;
      font-family: 'Courier New', monospace;
    }
  }

  .amount-display {
    margin-top: 24rpx;

    .amount-label {
      font-size: 26rpx;
      color: var(--text-secondary, #9CA3AF);
      display: block;
      margin-bottom: 8rpx;
    }

    .amount-value {
      font-size: 56rpx;
      font-weight: 700;
      color: #F59E0B;
    }
  }
}

/* 信息卡片 */
.info-card {
  background: var(--bg-card, #1E252B);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;

  .card-title {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--text-primary, #fff);
    margin-bottom: 24rpx;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    &:last-child {
      margin-bottom: 0;
    }

    &.total-row {
      padding-top: 20rpx;
      border-top: 1rpx solid var(--border-color, rgba(255, 255, 255, 0.06));
      margin-top: 8rpx;
    }

    .info-label {
      font-size: 28rpx;
      color: var(--text-secondary, #9CA3AF);
    }

    .info-value {
      font-size: 28rpx;
      color: var(--text-primary, #fff);

      &.order-no {
        font-size: 26rpx;
      }

      &.total-amount {
        color: #F59E0B;
        font-weight: 600;
        font-size: 32rpx;
      }
    }
  }
}

/* 助教信息 */
.coach-info {
  display: flex;
  align-items: center;
  gap: 20rpx;

  .coach-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: #333;
  }

  .coach-detail {
    flex: 1;

    .coach-name {
      font-size: 30rpx;
      font-weight: 500;
      color: var(--text-primary, #fff);
    }
  }
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-card, #1E252B);
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--border-color, rgba(255, 255, 255, 0.06));

  .btn-primary {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: 600;
    border: none;

    &:disabled {
      opacity: 0.5;
    }
  }

  .settling-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 20rpx 0;

    .settling-icon {
      font-size: 32rpx;
    }

    .settling-text {
      font-size: 28rpx;
      color: var(--text-secondary, #9CA3AF);
    }
  }
}

/* 支付弹窗 */
.pay-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.pay-popup {
  width: 100%;
  background: var(--bg-card, #1E252B);
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx 24rpx;
  padding-bottom: calc(32rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;

    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-primary, #fff);
    }

    .popup-close {
      font-size: 36rpx;
      color: var(--text-secondary, #9CA3AF);
      padding: 10rpx;
    }
  }

  .popup-amount {
    text-align: center;
    margin-bottom: 32rpx;

    .amount-label {
      font-size: 26rpx;
      color: var(--text-secondary, #9CA3AF);
      display: block;
      margin-bottom: 8rpx;
    }

    .amount-value {
      font-size: 48rpx;
      font-weight: 700;
      color: #F59E0B;
    }
  }

  .pay-channel-list {
    margin-bottom: 32rpx;

    .pay-channel-item {
      display: flex;
      align-items: center;
      padding: 24rpx;
      border-radius: 16rpx;
      background: var(--bg-page, #121619);
      margin-bottom: 16rpx;

      &.active {
        background: rgba(0, 187, 136, 0.1);
        border: 1rpx solid #00BB88;
      }

      &:last-child {
        margin-bottom: 0;
      }

      .channel-icon {
        width: 64rpx;
        height: 64rpx;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;

        image {
          width: 40rpx;
          height: 40rpx;
        }

        .channel-emoji {
          font-size: 36rpx;
        }
      }

      .channel-name {
        flex: 1;
        font-size: 30rpx;
        color: var(--text-primary, #fff);
      }

      .channel-radio {
        width: 36rpx;
        height: 36rpx;
        border-radius: 50%;
        border: 2rpx solid var(--text-secondary, #9CA3AF);
        display: flex;
        align-items: center;
        justify-content: center;

        .radio-inner {
          width: 20rpx;
          height: 20rpx;
          border-radius: 50%;
          background: #00BB88;
        }
      }
    }
  }

  .btn-confirm-pay {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: 600;
    border: none;

    &:disabled {
      opacity: 0.5;
    }
  }
}

.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}
</style>
```

- [ ] **Step 4: 确认评价页参数兼容**

确认现有评价页 `subpkg/coach/evaluate` 可以接收 `orderId` 和 `coachId` 参数并正常工作。

---

## Task 7: 配置路由和分包

**Files:**
- Modify: `pages.json`

**Interfaces:**
- Produces: 主包路由 `pages/onsite/list` + 分包 `subpkg/onsite` + 预加载规则

- [ ] **Step 1: 在 `pages` 数组中新增主包页面**

在 `pages` 数组中，`pages/order/list` 之后添加：

```json
{
  "path": "pages/onsite/list",
  "style": {
    "navigationBarTitleText": "现场订单",
    "navigationBarBackgroundColor": "#121619",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#121619"
  }
}
```

注意保持与其他页面配置风格一致。

- [ ] **Step 2: 在 `subPackages` 数组中新增分包**

在 `subPackages` 数组中添加：

```json
{
  "root": "subpkg/onsite",
  "pages": [
    {
      "path": "detail",
      "style": {
        "navigationBarTitleText": "订单详情",
        "navigationBarBackgroundColor": "#121619",
        "navigationBarTextStyle": "white",
        "backgroundColor": "#121619"
      }
    }
  ]
}
```

- [ ] **Step 3: 在 `preloadRule` 中新增预加载规则**

在 `preloadRule` 中添加：

```json
"pages/onsite/list": {
  "network": "all",
  "packages": ["subpkg/onsite"]
}
```

参考 `pages/order/list` 的预加载配置方式。

---

## Task 8: "我的"页面增加现场订单入口

**Files:**
- Modify: `pages/mine/index.vue`

**Interfaces:**
- Consumes: `menuList` 数组
- Produces: 新菜单项"现场订单"

- [ ] **Step 1: 在 menuList 中新增"现场订单"菜单项**

在 `menuList` 数组中，第一个位置（收支统计之前）添加：

```javascript
  { key: 'onsite', title: '现场订单', icon: 'location', bgColor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', path: '/pages/onsite/list' },
```

放在第一个位置，让用户更容易找到。

- [ ] **Step 2: 审核模式下隐藏现场订单入口**

在 `visibleMenuList` 的 computed 中，审核模式下需要过滤掉现场订单。确认现有过滤逻辑：

```javascript
const visibleMenuList = computed(() => {
  if (!reviewMode.value) return menuList.value
  return menuList.value.filter(item => !['wallet', 'collection'].includes(item.key))
})
```

需要把 `onsite` 也加入过滤列表：

```javascript
  return menuList.value.filter(item => !['wallet', 'collection', 'onsite'].includes(item.key))
```

---

## Task 9: 整体验证和联调检查

**Files:**
- 验证所有新增/修改文件

- [ ] **Step 1: 编译检查**

运行 H5 或小程序开发命令，检查是否有编译错误：

```bash
# 如果用 CLI
npm run dev:h5
# 或
npm run dev:mp-weixin
```

如果使用 HBuilderX，直接运行到对应平台检查控制台。

- [ ] **Step 2: 功能检查清单**

对照设计文档第 11 节的联调检查清单，逐项验证：

- [ ] 列表页：只显示已开始服务的现场订单
- [ ] 列表页：进行中订单不显示最终金额
- [ ] 列表页：下拉刷新、上拉加载更多正常
- [ ] 详情页：进行中只读、实时计时正确
- [ ] 详情页：待付款显示应付金额、支付按钮
- [ ] 详情页：支付后隐藏支付按钮，显示处理中
- [ ] 详情页：待评价跳转评价页正常
- [ ] 支付：微信/支付宝支付正常
- [ ] 支付：防重复点击生效
- [ ] 错误：1010000342 时关闭支付入口
- [ ] 现有功能：预约订单列表正常
- [ ] 现有功能：预约订单详情正常
- [ ] 现有功能：预约订单支付正常
- [ ] 我的页面：审核模式下隐藏现场订单入口

- [ ] **Step 3: 验证不影响现有功能**

手动测试现有预约订单的完整流程（列表→详情→支付），确认完全不受影响。
