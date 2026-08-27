<template>
  <view class="pay-success-wrapper" :class="themeClass">
    <view class="success-content">
      <!-- 状态图标 -->
      <view class="icon-wrapper">
        <uni-icons
          v-if="payStatus === 10 || !payOrderId"
          type="checkmarkempty"
          size="120"
          color="#00BB88"
        />
        <uni-icons
          v-else-if="isPolling"
          type="spinner-cycle"
          size="120"
          color="#00BB88"
        />
        <uni-icons
          v-else
          type="info"
          size="120"
          color="#FBBF24"
        />
      </view>

      <!-- 标题 -->
      <view class="title">
        {{ payStatus === 10 || !payOrderId ? '支付成功' : (isPolling ? '支付确认中' : '支付处理中') }}
      </view>
      <view class="subtitle">
        {{ payStatus === 10 || !payOrderId ? '您的预约已提交，等待裁教确认' : statusText }}
      </view>

      <!-- 订单信息 -->
      <view class="info-card" v-if="orderDetail">
        <view class="info-row">
          <text class="label">订单编号</text>
          <text class="value">{{ orderDetail.orderNo || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="label">支付金额</text>
          <text class="value price">¥{{ formatPrice(orderDetail.payAmount) }}</text>
        </view>
        <view class="info-row" v-if="orderDetail.coachStageName">
          <text class="label">裁教</text>
          <text class="value">{{ orderDetail.coachStageName }}</text>
        </view>
        <view class="info-row" v-if="orderDetail.bookingTime">
          <text class="label">预约时间</text>
          <text class="value">{{ formatTime(orderDetail.bookingTime) }}</text>
        </view>
      </view>

      <!-- 提示 -->
      <view class="tip-wrapper">
        <uni-icons type="info" size="18" color="#FBBF24" />
        <text class="tip-text">请保持电话畅通，裁教将尽快联系您</text>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <view class="btn secondary" @click="goToOrderList">查看订单</view>
      <view class="btn primary" @click="goToHome">返回首页</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useThemeStore } from '@/store'
import { getOrderDetail } from '@/api/billiard/order'
import { getPayOrder } from '@/api/billiard/pay'
import { guardReviewEntry } from '@/utils/review'

// 主题相关
const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

const orderId = ref(null)
const orderDetail = ref(null)
const payOrderId = ref(null)
const payStatus = ref(null) // 0=待支付 10=成功 20=已退款 30=关闭
const isPolling = ref(false)
const statusText = ref('')
let pollTimer = null

// 格式化价格
const formatPrice = (price) => {
  if (price === null || price === undefined) return '0.00'
  return (price / 100).toFixed(2)
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}.${day} ${hour}:${minute}`
}

// 缓存最近一次支付单数据，避免重复请求
let lastPayOrderData = null

// 查询支付单状态
const checkPayStatus = async () => {
  if (!payOrderId.value) return false
  try {
    const res = await getPayOrder({ id: payOrderId.value, sync: true })
    const data = res.data || {}
    lastPayOrderData = data
    payStatus.value = data.status
    return Number(data.status) === 10 // 10=支付成功
  } catch (error) {
    console.error('查询支付状态失败:', error)
    return false
  }
}

// 轮询支付状态
const pollPayStatus = () => {
  let attempts = 0
  const maxAttempts = 10
  const interval = 2000

  isPolling.value = true
  statusText.value = '支付结果确认中...'

  const poll = async () => {
    attempts++
    const success = await checkPayStatus()

    if (success) {
      isPolling.value = false
      statusText.value = '支付成功'
      payStatus.value = 10
      pollTimer = null
      // 支付成功后加载订单详情
      if (orderId.value) {
        loadOrderDetail()
      }
      return
    }

    if (attempts >= maxAttempts) {
      isPolling.value = false
      statusText.value = '支付结果确认中，请稍后在订单列表查看'
      pollTimer = null
      return
    }

    pollTimer = setTimeout(poll, interval)
  }

  poll()
}

// 清除轮询定时器
const clearPollTimer = () => {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

onUnmounted(() => {
  clearPollTimer()
})

// 加载订单详情
const loadOrderDetail = async () => {
  if (!orderId.value) return
  try {
    const res = await getOrderDetail({ id: orderId.value })
    orderDetail.value = res.data || {}
  } catch (error) {
    console.error('加载订单详情失败:', error)
  }
}

// 跳转到订单列表
const goToOrderList = () => {
  uni.navigateTo({ url: '/pages/order/list' })
}

// 返回首页
const goToHome = () => {
  uni.switchTab({ url: '/pages/home/index' })
}

onLoad((options) => {
  // 审核模式入口守卫
  if (guardReviewEntry()) return

  // 优先使用 orderId（原逻辑）
  if (options.orderId) {
    orderId.value = Number(options.orderId)
    payStatus.value = 10 // 从订单进入默认成功
  }
  // H5 支付回跳：使用 payOrderId 查询支付状态
  else if (options.payOrderId) {
    payOrderId.value = Number(options.payOrderId)
    // 立即查一次
    checkPayStatus().then((success) => {
      if (success) {
        payStatus.value = 10
        // 支付成功，尝试获取关联的订单信息
        // 从 merchantOrderId 中提取 orderId（格式：ORDER_{id}）
        const merchantOrderId = (lastPayOrderData && lastPayOrderData.merchantOrderId) || ''
        const match = merchantOrderId.match(/ORDER_(\d+)/)
        if (match && match[1]) {
          orderId.value = Number(match[1])
          loadOrderDetail()
        }
      } else {
        // 未成功，启动轮询
        pollPayStatus()
      }
    })
  } else {
    uni.showToast({ title: '订单信息缺失', icon: 'none' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/home/index' })
    }, 1500)
  }
})

onMounted(() => {
  if (orderId.value) {
    loadOrderDetail()
  }
})
</script>

<style lang="scss" scoped>
.pay-success-wrapper {
  min-height: calc(var(--vh, 1vh) * 100);
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
  padding: 120rpx 30rpx 0;
  box-sizing: border-box;
}

.success-content {
  flex: 1;
}

.icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
}

.title {
  text-align: center;
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16rpx;
}

.subtitle {
  text-align: center;
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-bottom: 60rpx;
}

.info-card {
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border-color);
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .label {
    color: var(--text-secondary);
    font-size: 28rpx;
  }
  .value {
    color: var(--text-primary);
    font-size: 28rpx;
    &.price {
      color: #00BB88;
      font-weight: 700;
      font-size: 32rpx;
    }
  }
}

.tip-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: rgba(251, 191, 36, 0.1);
  border: 1rpx solid rgba(251, 191, 36, 0.3);
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  .tip-text {
    color: #FBBF24;
    font-size: 26rpx;
  }
}

.bottom-bar {
  display: flex;
  gap: 20rpx;
  margin-top: 80rpx;
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
  &.primary {
    background: #00BB88;
    color: var(--text-primary);
  }
  &.secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
}
</style>