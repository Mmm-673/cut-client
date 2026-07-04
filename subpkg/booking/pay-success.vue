<template>
  <view class="pay-success-wrapper">
    <view class="success-content">
      <!-- 成功图标 -->
      <view class="icon-wrapper">
        <uni-icons type="checkmarkempty" size="120" color="#00BB88" />
      </view>

      <!-- 标题 -->
      <view class="title">支付成功</view>
      <view class="subtitle">您的预约已提交，等待裁教确认</view>

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
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getOrderDetail } from '@/api/billiard/order'

const orderId = ref(null)
const orderDetail = ref(null)

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
  if (options.orderId) {
    orderId.value = Number(options.orderId)
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
  min-height: 100vh;
  background: #121619;
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
  color: #fff;
  margin-bottom: 16rpx;
}

.subtitle {
  text-align: center;
  font-size: 28rpx;
  color: #9CA3AF;
  margin-bottom: 60rpx;
}

.info-card {
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .label {
    color: #9CA3AF;
    font-size: 28rpx;
  }
  .value {
    color: #fff;
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
    color: #fff;
  }
  &.secondary {
    background: #2a3338;
    color: #fff;
  }
}
</style>