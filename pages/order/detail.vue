<template>
  <view class="order-detail-wrapper">
    <scroll-view
        scroll-y
        class="detail-scroll"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
    >
      <!-- 顶部状态卡片 -->
      <view class="status-card">
        <view class="status-header">
          <view class="status-left">
            <text class="status-dot"></text>
            <text class="status-text">{{ orderInfo.statusText }}</text>
          </view>
          <text class="order-no">订单号: {{ orderInfo.orderNo }}</text>
        </view>

        <!-- 订单信息卡片 -->
        <view class="info-card">
          <view class="card-title">
            <text class="title-icon">🖥</text>
            订单信息
          </view>

          <view class="info-row">
            <text class="label">服务时间</text>
            <text class="value">{{ orderInfo.serviceTime }}</text>
          </view>

          <view class="info-row">
            <text class="label">服务时长</text>
            <text class="value">{{ orderInfo.serviceDuration }}分钟</text>
          </view>

          <view class="info-row">
            <text class="label">服务类型</text>
            <text class="value">{{ getServiceTypeName(orderInfo.serviceType) }}</text>
          </view>

          <view class="info-row">
            <text class="label">下单时间</text>
            <text class="value">{{ orderInfo.createTime }}</text>
          </view>

          <view class="info-row">
            <text class="label">支付状态</text>
            <text class="value">{{ getPayStatusText(orderInfo.payStatus) }}</text>
          </view>

          <view class="info-row">
            <text class="label">订单金额</text>
            <text class="value price">¥{{ formatAmount(orderInfo.totalAmount) }}</text>
          </view>

          <view class="info-row" v-if="orderInfo.payAmount > 0">
            <text class="label">实际支付</text>
            <text class="value price">¥{{ formatAmount(orderInfo.payAmount) }}</text>
          </view>

          <view class="info-row" v-if="orderInfo.extraPayAmount > 0">
            <text class="label">加钟支付</text>
            <text class="value price">¥{{ formatAmount(orderInfo.extraPayAmount) }}</text>
          </view>
        </view>

        <!-- 陪练教练卡片 -->
        <view class="info-card">
          <view class="card-title">
            <text class="title-icon">👤</text>
            陪练教练
            <text class="view-more" @click="goToCoachDetail">查看主页 <uni-icons type="right" size="16" color="#00BB88" /></text>
          </view>

          <view class="coach-info">
            <image class="coach-avatar" :src="orderInfo.coachMainPhoto || '/static/default-avatar.png'" mode="aspectFill"></image>
            <view class="coach-info-right">
              <view class="coach-name-row">
                <text class="coach-name">{{ orderInfo.coachStageName }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 球厅信息卡片 -->
        <view class="info-card" v-if="orderInfo.venueName">
          <view class="card-title">
            <text class="title-icon">📍</text>
            球厅信息
            <button class="nav-btn" @click="openHallNavigate" v-if="orderInfo.venueLongitude && orderInfo.venueLatitude">
              <uni-icons type="navigation" size="16" color="#fff" />
              导航
            </button>
          </view>

          <text class="hall-name">{{ orderInfo.venueName }}</text>
          <view class="hall-address" v-if="orderInfo.venueAddress">
            <uni-icons type="location" size="18" color="#9CA3AF" />
            <text>{{ orderInfo.venueAddress }}</text>
          </view>
        </view>

        <!-- 底部安全区域 -->
        <view class="safe-area-bottom"></view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="orderInfo.status === 10">
      <button class="action-btn cancel" @click="cancelOrder">取消订单</button>
      <button class="action-btn pay" @click="payOrder">去支付</button>
    </view>

    <view class="bottom-bar" v-if="orderInfo.status === 50">
      <button class="action-btn review" @click="goToReview">去评价</button>
    </view>

    <view class="bottom-bar" v-if="orderInfo.status === 60">
      <button class="action-btn book-again" @click="bookAgain">再约一次</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onLoad } from  "@dcloudio/uni-app"
import { getOrderDetail } from '@/api/billiard/order'

// 订单ID
const orderId = ref(null)
// 刷新状态
const refreshing = ref(false)
// 加载状态
const loading = ref(false)

/**
 * 订单信息 - 根据API文档定义完整字段
 */
const orderInfo = ref({
  id: null,
  orderNo: '',
  coachId: null,
  coachStageName: '',
  coachMainPhoto: '',
  venueName: '',
  venueAddress: '',
  venueLongitude: null,
  venueLatitude: null,
  serviceType: 1,
  bookingTime: 0,
  serviceDuration: 0,
  status: 0,
  payAmount: 0,
  extraPayAmount: 0,
  totalAmount: 0,
  createTime: 0,
  payStatus: 0,
  statusText: '',
  serviceTime: ''
})

/**
 * 状态映射 - 根据API文档
 */
const statusMap = {
  10: { text: '待付款' },
  20: { text: '待接单' },
  30: { text: '已接单' },
  40: { text: '进行中' },
  50: { text: '待评价' },
  60: { text: '已完成' },
  70: { text: '已取消' },
  80: { text: '退款中' }
}

/**
 * 支付状态映射
 */
const payStatusMap = {
  0: '未支付',
  10: '支付成功',
  20: '已退款',
  30: '支付关闭'
}

// 获取服务类型名称
const getServiceTypeName = (type) => {
  if (type === 1) return '台球陪练'
  if (type === 2) return '陪游'
  return '台球陪练'
}

// 获取支付状态文本
const getPayStatusText = (status) => {
  return payStatusMap[status] || '未知'
}

// 格式化预约时间
const formatBookingTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 格式化下单时间
const formatCreateTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 格式化金额（分转元）
const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00'
  return (amount / 100).toFixed(2)
}

// 打开球厅导航
const openHallNavigate = () => {
  if (!orderInfo.value.venueAddress) {
    uni.showToast({ title: '球厅地址不存在', icon: 'none' })
    return
  }
  const params = {
    name: orderInfo.value.venueName,
    address: orderInfo.value.venueAddress
  }
  if (orderInfo.value.venueLongitude && orderInfo.value.venueLatitude) {
    params.longitude = orderInfo.value.venueLongitude
    params.latitude = orderInfo.value.venueLatitude
  }
  uni.openLocation({
    ...params,
    fail: () => uni.showToast({ title: '打开地图失败', icon: 'none' })
  })
}

// 加载订单详情
const loadOrderDetail = async () => {
  if (!orderId.value) return

  loading.value = true
  try {
    const res = await getOrderDetail({ id: orderId.value })
    const data = res.data || {}

    // 更新订单信息 - 完全按API文档字段处理
    Object.assign(orderInfo.value, {
      id: data.id,
      orderNo: data.orderNo,
      coachId: data.coachId,
      coachStageName: data.coachStageName,
      coachMainPhoto: data.coachMainPhoto,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      venueLongitude: data.venueLongitude,
      venueLatitude: data.venueLatitude,
      serviceType: data.serviceType,
      bookingTime: data.bookingTime,
      serviceDuration: data.serviceDuration,
      status: data.status,
      payAmount: data.payAmount,
      extraPayAmount: data.extraPayAmount,
      totalAmount: data.totalAmount,
      createTime: data.createTime,
      payStatus: data.payStatus,
      statusText: statusMap[data.status]?.text || '未知',
      serviceTime: formatBookingTime(data.bookingTime),
      createTime: formatCreateTime(data.createTime)
    })
  } catch (error) {
    console.error('加载订单详情失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadOrderDetail()
}

// 跳转教练详情
const goToCoachDetail = () => {
  if (orderInfo.value.coachId) {
    uni.navigateTo({
      url: `/pages/coach/detail?id=${orderInfo.value.coachId}`
    })
  }
}

// 取消订单
const cancelOrder = () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消这个订单吗？',
    success: (res) => {
      if (res.confirm) {
        // TODO: 调用取消订单接口
        uni.showToast({ title: '订单已取消', icon: 'success' })
      }
    }
  })
}

// 去支付
const payOrder = () => {
  uni.showToast({ title: '支付功能开发中', icon: 'none' })
}

// 去评价
const goToReview = () => {
  uni.navigateTo({
    url: `/pages/evaluate/index?orderId=${orderInfo.value.id}`
  })
}

// 再约一次/返回首页
const bookAgain = () => {
  uni.switchTab({
    url: '/pages/home/index'
  })
}

onLoad((options) => {
  if (options.id) {
    orderId.value = parseInt(options.id)
  }
})

onMounted(() => {
  // 加载数据
  if (orderId.value) {
    loadOrderDetail()
  }
})
</script>

<style lang="scss" scoped>
.order-detail-wrapper {
  min-height: 100vh;
  background: #121619;
  position: relative;
  display: flex;
  flex-direction: column;
}

.detail-scroll {
  flex: 1;
  padding-bottom: 140rpx;
}

/* 顶部状态卡片 */
.status-card {
  margin: 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    .status-left {
      display: flex;
      align-items: center;
      gap: 12rpx;
      .status-dot {
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
        background: #00BB88;
      }
      .status-text {
        color: #00BB88;
        font-size: 32rpx;
        font-weight: 600;
      }
    }
    .order-no {
      color: #9CA3AF;
      font-size: 28rpx;
    }
  }
}

/* 通用信息卡片 */
.info-card {
  margin: 30rpx 0;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  &:first-child {
    margin-top: 0;
  }
  .card-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 24rpx;
    .title-icon {
      margin-right: 12rpx;
    }
    .view-more {
      color: #00BB88;
      font-size: 28rpx;
      font-weight: normal;
      display: flex;
      align-items: center;
      gap: 4rpx;
    }
    .nav-btn {
      background: #00BB88;
      color: #fff;
      border-radius: 12rpx;
      padding: 10rpx 30rpx;
      font-size: 28rpx;
      line-height: normal;
      border: none;
      display: flex;
      align-items: center;
      gap: 6rpx;
      &::after {
        border: none;
      }
    }
  }
}

/* 信息行 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  &:last-child {
    border-bottom: none;
  }
  .label {
    color: #9CA3AF;
    font-size: 28rpx;
  }
  .value {
    color: #fff;
    font-size: 28rpx;
    text-align: right;
    &.price {
      color: #00BB88;
      font-size: 36rpx;
      font-weight: bold;
    }
  }
}

/* 教练信息 */
.coach-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  .coach-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
  }
  .coach-info-right {
    flex: 1;
    .coach-name-row {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 12rpx;
      .coach-name {
        color: #fff;
        font-size: 36rpx;
        font-weight: 600;
      }
    }
  }
}

/* 球厅信息 */
.hall-name {
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
}
.hall-address {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  color: #9CA3AF;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1E252B;
  padding: 16rpx 20rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: flex;
  gap: 12rpx;
  .action-btn {
    flex: 1;
    height: 72rpx;
    line-height: 72rpx;
    border-radius: 36rpx;
    font-size: 26rpx;
    font-weight: 500;
    border: none;
    &::after { border: none; }
    &.cancel {
      background: rgba(107, 114, 128, 0.2);
      color: #9CA3AF;
    }
    &.pay {
      background: #00BB88;
      color: #fff;
    }
    &.review {
      background: rgba(245, 158, 11, 0.2);
      color: #F59E0B;
    }
    &.book-again {
      background: #00BB88;
      color: #fff;
    }
  }
}
</style>
