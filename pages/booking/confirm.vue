<template>
  <view class="confirm-order-wrapper">
    <scroll-view
        scroll-y
        class="order-scroll"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
    >

      <!-- 教练信息 -->
      <view class="coach-card" v-if="orderData.coachInfo">
        <image class="coach-avatar" :src="orderData.coachInfo.avatar" mode="aspectFill"></image>
        <view class="coach-info">
          <view class="coach-name-row">
            <text class="coach-name">{{ orderData.coachInfo.stageName || orderData.coachInfo.name }}</text>
            <view class="coach-badge" :style="{background: 'rgba(0, 187, 136, 0.2)'}">{{ orderData.coachInfo.levelText || '初级教练' }}</view>
          </view>
          <text class="coach-desc">{{ orderData.coachInfo.intro || '专业台球陪练，耐心教学' }}</text>
          <view class="coach-meta">
            <view class="meta-item">
              <uni-icons type="star-filled" size="14" color="#FBBF24" />
              <text>{{ orderData.coachInfo.overallScore || orderData.coachInfo.rating || 5.0 }}分</text>
            </view>
            <text class="meta-divider">|</text>
            <text class="meta-item">已接单{{ orderData.coachInfo.serviceCount || orderData.coachInfo.orderCount || 0 }}次</text>
            <text class="meta-divider" v-if="orderData.coachInfo.distance">|</text>
            <text class="meta-item" v-if="orderData.coachInfo.distance">{{ orderData.coachInfo.distance }}</text>
          </view>
        </view>
        <view class="coach-score">
          <uni-icons type="star-filled" size="16" color="#FBBF24" />
          <text>{{ orderData.coachInfo.overallScore || orderData.coachInfo.rating || 5.0 }}</text>
        </view>
      </view>

      <!-- 服务信息 -->
      <view class="info-card">
        <view class="card-title">服务信息</view>

        <view class="info-row">
          <text class="label">服务项目</text>
          <text class="value">台球陪练</text>
        </view>

        <view class="info-row">
          <text class="label">服务时长</text>
          <text class="value">{{ (orderData.serviceDuration / 60) || 2 }}小时</text>
        </view>

        <view class="info-row">
          <text class="label">服务时间</text>
          <text class="value">{{ orderData.timeText || formatTime(orderData.bookingTime) }}</text>
        </view>

        <view class="info-row venue-row" @click="reselectHall">
          <text class="label">服务地点</text>
          <view class="value-wrap venue-wrap">
            <view class="venue-info">
              <text class="value venue-name">{{ orderData.hallInfo?.name || orderData.venueName || '请选择服务地点' }}</text>
              <text class="venue-address" v-if="orderData.hallInfo?.address || orderData.venueAddress">{{ orderData.hallInfo?.address || orderData.venueAddress }}</text>
            </view>
            <uni-icons type="right" size="18" color="#9CA3AF" />
          </view>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="info-card" v-if="orderData.orderNo">
        <view class="card-title">订单信息</view>

        <view class="info-row">
          <text class="label">订单号</text>
          <text class="value">{{ orderData.orderNo }}</text>
        </view>

        <view class="info-row" v-if="orderData.orderId">
          <text class="label">订单ID</text>
          <text class="value">{{ orderData.orderId }}</text>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="info-card">
        <view class="card-title">费用明细</view>

        <view class="fee-row">
          <text class="fee-label">台球陪练 x{{ orderData.quantity || 2 }}小时</text>
          <text class="fee-value">¥{{ (orderData.serviceAmount / 100).toFixed(2) }}</text>
        </view>

        <view class="fee-row" v-if="orderData.travelAmount > 0">
          <text class="fee-label">车费</text>
          <text class="fee-value">¥{{ (orderData.travelAmount / 100).toFixed(2) }}</text>
        </view>

        <view class="fee-row" v-if="orderData.travelDiscountAmount > 0">
          <text class="fee-label">车费优惠</text>
          <text class="fee-value" style="color: #EF4444;">-¥{{ (orderData.travelDiscountAmount / 100).toFixed(2) }}</text>
        </view>

        <view class="fee-total">
          <text class="total-label">实付金额</text>
          <text class="total-value">¥{{ (orderData.payAmount / 100).toFixed(2) }}</text>
        </view>
      </view>

      <!-- 支付倒计时 -->
      <view class="countdown-card" v-if="orderData.expireTime">
        <uni-icons type="time" size="18" color="#FBBF24" />
        <text class="countdown-text">请在 <text class="countdown-time">{{ countdownText }}</text> 内完成支付</text>
      </view>

      <!-- 支付方式 -->
      <view class="info-card">
        <view class="card-title">支付方式</view>

        <view
            class="pay-item"
            :class="{active: selectedPay === item.value}"
            v-for="item in payList"
            :key="item.value"
            @click="selectPay(item.value)"
        >
          <view class="pay-left">
            <view class="pay-icon" :style="{background: item.bgColor}">
              <uni-icons :type="item.icon" size="24" color="#fff" />
            </view>
            <text class="pay-name">{{ item.label }}</text>
            <text class="pay-balance" v-if="item.balance">（可用余额：¥{{ item.balance }}）</text>
          </view>
          <view class="pay-radio">
            <view class="radio-dot" v-if="selectedPay === item.value"></view>
          </view>
        </view>
      </view>

      <!-- 协议 -->
      <view class="agreement-section">
        <view class="agreement-row" @click="userAgree = !userAgree">
          <view class="checkbox-box" :class="{checked: userAgree}">
            <uni-icons v-if="userAgree" type="checkmarkempty" size="18" color="#fff" />
          </view>
          <text class="agreement-text">我已阅读并同意</text>
          <text class="agreement-link" @click.stop="toAgreement('service')">《服务协议》</text>
          <text class="agreement-text">和</text>
          <text class="agreement-link" @click.stop="toAgreement('refund')">《退款规则》</text>
        </view>
        <text class="agreement-tip">，付款后30分钟内未接单自动取消</text>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 底部支付栏 -->
    <view class="bottom-bar">
      <view class="total-info">
        <text class="total-label">总计：</text>
        <text class="total-price">¥{{ (orderData.payAmount / 100).toFixed(2) }}</text>
      </view>
      <button
          class="pay-btn"
          :class="{disabled: !canPay}"
          :disabled="!canPay"
          @click="submitPayment"
      >
        {{ isSubmitting ? '支付中...' : '立即支付' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getAvailablePayChannels, executePayment } from '@/utils/payment'

// ---------------------- 状态定义 ----------------------
const refreshing = ref(false)
const isSubmitting = ref(false)
const userAgree = ref(true)
const selectedPay = ref('wechat')

// 订单数据
const orderData = ref({})

// 支付倒计时
const countdownTimer = ref(null)
const countdownText = ref('')

// 教练信息显示用
const coachInfo = ref({
  badgeBg: 'rgba(0, 187, 136, 0.2)'
})

// 支付方式列表
const payList = computed(() => {
  const channels = getAvailablePayChannels()
  if (channels.length > 0 && !selectedPay.value) {
    selectedPay.value = channels[0].value
  }
  return channels
})

// ---------------------- 计算属性 ----------------------
// 是否可以支付
const canPay = computed(() => {
  return userAgree.value &&
         !isSubmitting.value &&
         orderData.value.payOrderId
})

// ---------------------- 方法 ----------------------
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

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  setTimeout(() => {
    refreshing.value = false
    uni.showToast({ title: '刷新成功', icon: 'success' })
  }, 1000)
}

// 重新选择球厅
const reselectHall = () => {
  // 保存当前订单的基本参数，方便回去重新选择
  const reselectParams = {
    coachInfo: orderData.value.coachInfo,
    serviceDuration: orderData.value.serviceDuration,
    quantity: orderData.value.quantity,
    bookingTime: orderData.value.bookingTime,
    timeText: orderData.value.timeText,
    isReselect: true
  }
  uni.setStorageSync('reselectParams', reselectParams)
  uni.redirectTo({ url: '/pages/booking/hall' })
}

// 选择支付方式
const selectPay = (val) => {
  selectedPay.value = val
}

// 查看协议
const toAgreement = (type) => {
  uni.showToast({
    title: type === 'service' ? '服务协议功能开发中' : '退款规则功能开发中',
    icon: 'none'
  })
}

// 提交支付
const submitPayment = async () => {
  if (!canPay.value || !orderData.value.payOrderId) return

  isSubmitting.value = true
  try {
    await executePayment({
      payOrderId: orderData.value.payOrderId,
      orderId: orderData.value.orderId,
      payValue: selectedPay.value,
      onSuccess: (payResult) => {
        uni.showToast({ title: '支付成功', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/order/list' })
        }, 1500)
      },
      onCancel: () => {
        uni.showToast({ title: '支付已取消', icon: 'none' })
      },
      onError: (error) => {
        uni.showToast({
          title: error.message || '支付失败，请重试',
          icon: 'none'
        })
      }
    })
  } catch (error) {
    console.error('支付失败:', error)
    uni.showToast({
      title: error.message || '支付失败，请重试',
      icon: 'none'
    })
  } finally {
    isSubmitting.value = false
  }
}

// 支付倒计时
const startCountdown = () => {
  if (!orderData.value || !orderData.value.expireTime) return

  const updateCountdown = () => {
    const now = Date.now()
    const diff = orderData.value.expireTime - now

    if (diff <= 0) {
      countdownText.value = '00:00'
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
      }
      uni.showToast({ title: '订单已过期，请重新下单', icon: 'none' })
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/coach/list' })
      }, 1500)
      return
    }

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    countdownText.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  updateCountdown()
  countdownTimer.value = setInterval(updateCountdown, 1000)
}

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  // 从 storage 获取已创建的订单数据
  const createdOrder = uni.getStorageSync('createdOrderData')
  if (createdOrder) {
    orderData.value = createdOrder
    uni.removeStorageSync('createdOrderData')
    startCountdown()
  } else {
    uni.showToast({ title: '订单数据缺失，请重新下单', icon: 'none' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/coach/list' })
    }, 1500)
  }
})

onUnmounted(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
})
</script>

<style lang="scss" scoped>
.confirm-order-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
  position: relative;
}

.order-scroll {
  flex: 1;
  width: 100%;
  padding-bottom: 200rpx;
  box-sizing: border-box;
}

/* 教练信息 */
.coach-card {
  margin: 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  .coach-avatar {
    width: 140rpx;
    height: 140rpx;
    border-radius: 20rpx;
    flex-shrink: 0;
  }
  .coach-info {
    flex: 1;
    min-width: 0;
    .coach-name-row {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 8rpx;
      flex-wrap: wrap;
      .coach-name {
        color: #fff;
        font-size: 32rpx;
        font-weight: 700;
      }
      .coach-badge {
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        font-size: 22rpx;
        color: #00BB88;
        flex-shrink: 0;
      }
    }
    .coach-desc {
      color: #9CA3AF;
      font-size: 24rpx;
      margin-bottom: 10rpx;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .coach-meta {
      display: flex;
      align-items: center;
      gap: 8rpx;
      flex-wrap: wrap;
      .meta-item {
        color: #9CA3AF;
        font-size: 24rpx;
        display: flex;
        align-items: center;
        gap: 4rpx;
      }
      .meta-divider {
        color: #2a3338;
      }
    }
  }
  .coach-score {
    display: flex;
    align-items: center;
    gap: 4rpx;
    color: #FBBF24;
    font-size: 28rpx;
    font-weight: 700;
    flex-shrink: 0;
  }
}

/* 通用卡片 */
.info-card {
  margin: 0 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  .card-title {
    color: #fff;
    font-size: 32rpx;
    font-weight: 700;
    margin-bottom: 24rpx;
  }
}

/* 信息行 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .label {
    color: #9CA3AF;
    font-size: 28rpx;
  }
  .value-wrap {
    display: flex;
    align-items: center;
    gap: 12rpx;
    .value {
      color: #fff;
      font-size: 28rpx;
    }
  }
  .value {
    color: #fff;
    font-size: 28rpx;
  }
}

/* 球厅信息特殊样式 */
.venue-row {
  align-items: flex-start;
  .venue-wrap {
    align-items: flex-start;
    .venue-info {
      flex: 1;
      text-align: right;
      .venue-name {
        color: #fff;
        font-size: 28rpx;
        display: block;
        margin-bottom: 6rpx;
      }
      .venue-address {
        color: #9CA3AF;
        font-size: 24rpx;
        display: block;
        line-height: 1.4;
      }
    }
  }
}

/* 费用明细 */
.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  .fee-label {
    color: #9CA3AF;
    font-size: 28rpx;
  }
  .fee-value {
    color: #fff;
    font-size: 28rpx;
  }
}
.fee-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255,255,255,0.05);
  .total-label {
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
  }
  .total-value {
    color: #00BB88;
    font-size: 40rpx;
    font-weight: 700;
  }
}

/* 支付倒计时 */
.countdown-card {
  margin: 0 30rpx 30rpx;
  background: rgba(251, 191, 36, 0.1);
  border: 1rpx solid rgba(251, 191, 36, 0.3);
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  .countdown-text {
    color: #FBBF24;
    font-size: 26rpx;
  }
  .countdown-time {
    font-weight: 700;
    font-size: 28rpx;
  }
}

/* 支付方式 */
.pay-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .pay-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    .pay-icon {
      width: 70rpx;
      height: 70rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .pay-name {
      color: #fff;
      font-size: 30rpx;
      font-weight: 500;
    }
    .pay-balance {
      color: #9CA3AF;
      font-size: 24rpx;
    }
  }
  .pay-radio {
    width: 40rpx;
    height: 40rpx;
    border: 3rpx solid #2a3338;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &.active {
    .pay-radio {
      border-color: #00BB88;
      .radio-dot {
        width: 20rpx;
        height: 20rpx;
        border-radius: 50%;
        background: #00BB88;
      }
    }
  }
}

/* 协议 */
.agreement-section {
  padding: 0 30rpx 30rpx;
  .agreement-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6rpx;
    margin-bottom: 8rpx;
    .checkbox-box {
      width: 32rpx;
      height: 32rpx;
      border: 2rpx solid #9CA3AF;
      border-radius: 6rpx;
      margin-right: 8rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      &.checked {
        background: #00BB88;
        border-color: #00BB88;
      }
    }
    .agreement-text {
      color: #9CA3AF;
      font-size: 24rpx;
    }
    .agreement-link {
      color: #00BB88;
      font-size: 24rpx;
    }
  }
  .agreement-tip {
    display: block;
    color: #6B7280;
    font-size: 24rpx;
    padding-left: 48rpx;
  }
}

/* 底部支付栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #1E252B;
  border-top: 1rpx solid rgba(255,255,255,0.05);
  padding: 12rpx 24rpx;
  padding-bottom: calc(12rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.3);
  .total-info {
    flex: 1;
    .total-label {
      color: #fff;
      font-size: 24rpx;
    }
    .total-price {
      color: #00BB88;
      font-size: 36rpx;
      font-weight: 700;
    }
  }
  .pay-btn {
    background: #00BB88;
    color: #fff;
    border-radius: 36rpx;
    padding: 14rpx 44rpx;
    font-size: 28rpx;
    font-weight: 700;
    border: none;
    &::after {
      border: none;
    }
    &.disabled {
      background: rgba(0, 187, 136, 0.3);
      color: rgba(255,255,255,0.5);
      pointer-events: none;
    }
  }
}

/* 底部安全区域 */
.safe-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>
