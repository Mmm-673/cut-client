<template>
  <view class="order-detail-wrapper">
    <scroll-view
        scroll-y
        class="detail-scroll"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
    >
      <!-- 顶部状态卡片 - 适配设计图的即将开始倒计时结构 -->
      <view class="status-card">
        <view class="status-header">
          <view class="status-left">
            <text class="status-dot"></text>
            <text class="status-text">{{ orderInfo.statusText }}</text>
          </view>
          <text class="order-no">订单号: {{ orderInfo.orderNo }}</text>
        </view>

        <!-- 倒计时: 仅即将开始(待服务)状态显示 -->
        <view class="count-down-box" v-if="orderInfo.status === 0">
          <view class="count-item">
            <text class="count-num">{{ countDown.h }}</text>
            <text class="count-label">小时</text>
          </view>
          <text class="count-colon">:</text>
          <view class="count-item">
            <text class="count-num">{{ countDown.m }}</text>
            <text class="count-label">分钟</text>
          </view>
          <text class="count-colon">:</text>
          <view class="count-item">
            <text class="count-num">{{ countDown.s }}</text>
            <text class="count-label">秒</text>
          </view>

          <text class="status-desc" v-if="orderInfo.statusDesc">
            {{ orderInfo.statusDesc }}
          </text>
        </view>

        <!-- 订单信息卡片 - 对应设计图结构 -->
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
            <text class="value">{{ orderInfo.duration }}小时</text>
          </view>

          <view class="info-row">
            <text class="label">下单时间</text>
            <text class="value">{{ orderInfo.createTime }}</text>
          </view>

          <view class="info-row">
            <text class="label">支付方式</text>
            <text class="value">{{ orderInfo.payType }}</text>
          </view>

          <view class="info-row">
            <text class="label">订单金额</text>
            <text class="value price">¥{{ orderInfo.price.toFixed(2) }}</text>
          </view>
        </view>

        <!-- 陪练教练卡片 - 对应设计图结构 -->
        <view class="info-card">
          <view class="card-title">
            <text class="title-icon">👤</text>
            陪练教练
            <text class="view-more" @click="goToCoachDetail">查看主页 <uni-icons type="right" size="16" color="#00BB88" /></text>
          </view>

          <view class="coach-info">
            <image class="coach-avatar" :src="orderInfo.coachAvatar || '/static/default-avatar.png'" mode="aspectFill"></image>
            <view class="coach-info-right">
              <view class="coach-name-row">
                <text class="coach-name">{{ orderInfo.coachName }}</text>
                <text class="coach-level" v-if="orderInfo.coachLevel">{{ orderInfo.coachLevel }}</text>
              </view>
              <view class="coach-meta-row">
                <text class="coach-score">⭐ {{ orderInfo.coachScore || 0 }}</text>
                <text class="coach-finish">🗃 已完成{{ orderInfo.coachFinishCount || 0 }}单</text>
              </view>
              <view class="coach-tags">
                <text class="tag" v-for="tag in orderInfo.coachSkills" :key="tag">{{ tag }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 球厅信息卡片 - 对应设计图结构 -->
        <view class="info-card">
          <view class="card-title">
            <text class="title-icon">📍</text>
            球厅信息
            <button class="nav-btn" @click="openHallNavigate">
              <uni-icons type="navigation" size="16" color="#fff" />
              导航
            </button>
          </view>

          <text class="hall-name">{{ orderInfo.hallName }}</text>
          <view class="hall-address">
            <uni-icons type="location" size="18" color="#9CA3AF" />
            <text>{{ orderInfo.hallAddress }}</text>
          </view>
          <image class="hall-image" :src="orderInfo.hallImage || '/static/default-hall.jpg'" mode="aspectFill"></image>
        </view>

        <!-- 备注信息卡片 - 对应设计图结构 -->
        <view class="info-card" v-if="orderInfo.remark">
          <view class="card-title">
            <text class="title-icon">📄</text>
            备注信息
          </view>
          <view class="remark-content">
            {{ orderInfo.remark }}
          </view>
        </view>

        <!-- 已完成状态保留费用明细 -->
        <view class="info-card" v-if="orderInfo.status === 1">
          <view class="card-title">费用明细</view>

          <view class="fee-row">
            <text class="fee-label">{{ orderInfo.serviceName }} x{{ orderInfo.duration }}小时</text>
            <text class="fee-value">¥{{ (orderInfo.servicePrice || orderInfo.price) * orderInfo.duration }}</text>
          </view>

          <view class="fee-row" v-if="orderInfo.couponDiscount > 0">
            <text class="fee-label">优惠券</text>
            <text class="fee-value minus">-¥{{ orderInfo.couponDiscount }}</text>
          </view>

          <view class="divider"></view>

          <view class="fee-row total">
            <text class="fee-label">实付金额</text>
            <text class="fee-value total-price">¥{{ orderInfo.price }}</text>
          </view>
        </view>

        <!-- 底部安全区域 -->
        <view class="safe-area-bottom"></view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 - 待服务(即将开始)对齐设计图顺序颜色 -->
    <view class="bottom-bar" v-if="orderInfo.status === 0">
      <button class="action-btn contact" @click="contactCoach">联系教练</button>
      <button class="action-btn cancel" @click="cancelOrder">取消订单</button>
    </view>

    <view class="bottom-bar" v-if="orderInfo.status === 1">
      <button class="action-btn reward" @click="goToReward">打赏教练</button>
      <button v-if="!orderInfo.isReviewed" class="action-btn review" @click="goToReview">去评价</button>
      <button class="action-btn book-again" @click="bookAgain">再约一次</button>
    </view>

    <view class="bottom-bar" v-if="orderInfo.status === 2">
      <button class="action-btn book-again" @click="bookAgain">返回首页</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from  "@dcloudio/uni-app"
import { getOrderDetail } from '@/api/billiard/order'

// 订单ID
const orderId = ref(null)
// 刷新状态
const refreshing = ref(false)
// 加载状态
const loading = ref(false)
// 倒计时数据
const countDown = ref({ h: 0, m: 0, s: 0 })
// 倒计时定时器
let countDownTimer = null

// 订单信息 - 补充设计图需要的字段
const orderInfo = ref({
  id: null,
  orderNo: '',
  serviceName: '',
  servicePrice: 0,
  serviceTime: '', // 服务时间范围字符串 如:2026-04-01 17:30-19:30
  serviceStartTimeStamp: 0, // 服务开始时间戳(用于倒计时)
  coachName: '',
  coachAvatar: '',
  coachId: null,
  coachLevel: '', // 教练等级 如:金牌教练
  coachScore: 0, // 教练评分
  coachFinishCount: 0, // 已完成订单数
  coachSkills: [], // 教练擅长标签 如:['斯诺克','中式八球']
  date: '',
  time: '',
  duration: 0,
  hallName: '', // 球厅名称
  hallAddress: '', // 球厅地址
  hallImage: '', // 球厅展示图
  price: 0,
  couponDiscount: 0,
  status: 0,
  statusText: '',
  statusDesc: '',
  createTime: '',
  payType: '',
  remark: '',
  isReviewed: false
})

// 状态映射
const statusMap = {
  0: { text: '即将开始', desc: '请提前到达球厅，教练已在准备'},
  1: { text: '已完成', desc: '服务已完成'},
  2: { text: '已取消', desc: '订单已取消'}
}

// 启动倒计时
const startCountDown = () => {
  // 清除已有定时器
  if (countDownTimer) clearInterval(countDownTimer)

  // 已经过了开始时间直接不倒计时
  if (orderInfo.value.serviceStartTimeStamp <= Date.now()) {
    countDown.value = { h: 0, m: 0, s: 0 }
    return
  }

  countDownTimer = setInterval(() => {
    updateCountDown()
  }, 1000)
}

// 更新倒计时
const updateCountDown = () => {
  const diff = orderInfo.value.serviceStartTimeStamp - Date.now()
  if (diff <= 0) {
    clearInterval(countDownTimer)
    countDown.value = { h: 0, m: 0, s: 0 }
    // 时间到后可以刷新订单状态
    loadOrderDetail()
    return
  }

  // 计算时分秒
  const h = Math.floor(diff / (1000 * 60 * 60))
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const s = Math.floor((diff % (1000 * 60)) / 1000)

  // 补零，和设计图显示一致
  countDown.value = {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0')
  }
}

// 打开球厅导航
const openHallNavigate = () => {
  if (!orderInfo.value.hallAddress) {
    uni.showToast({ title: '球厅地址不存在', icon: 'none' })
    return
  }
  uni.openLocation({
    name: orderInfo.value.hallName,
    address: orderInfo.value.hallAddress,
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

    // 更新订单信息
    Object.assign(orderInfo.value, {
      id: data.id,
      orderNo: data.orderNo,
      serviceName: data.serviceName,
      servicePrice: data.servicePrice || data.price,
      serviceTime: data.serviceTime,
      serviceStartTimeStamp: data.serviceStartTimeStamp,
      coachName: data.coachName,
      coachAvatar: data.coachAvatar,
      coachId: data.coachId,
      coachLevel: data.coachLevel,
      coachScore: data.coachScore,
      coachFinishCount: data.coachFinishCount,
      coachSkills: data.coachSkills || [],
      date: data.date,
      time: data.time,
      duration: data.duration,
      hallName: data.hallName,
      hallAddress: data.hallAddress,
      hallImage: data.hallImage,
      price: data.price,
      couponDiscount: data.couponDiscount || 0,
      status: data.status,
      statusText: statusMap[data.status]?.text || '未知',
      statusDesc: statusMap[data.status]?.desc || '',
      createTime: data.createTime,
      payType: data.payType || '微信支付',
      remark: data.remark,
      isReviewed: data.isReviewed || false
    })

    // 待服务状态启动倒计时
    if (orderInfo.value.status === 0) {
      startCountDown()
    }
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
        orderInfo.value.status = 2
        orderInfo.value.statusText = '已取消'
        orderInfo.value.statusDesc = '订单已取消'
        if (countDownTimer) clearInterval(countDownTimer)
        uni.showToast({ title: '订单已取消', icon: 'success' })
      }
    }
  })
}

// 联系教练
const contactCoach = () => {
  uni.showToast({ title: '联系教练功能开发中', icon: 'none' })
}

// 去打赏
const goToReward = () => {
  uni.navigateTo({
    url: `/pages/coach/reward?coachId=${orderInfo.value.coachId || orderInfo.value.id}&coachName=${orderInfo.value.coachName}`
  })
}

// 去评价
const goToReview = () => {
  uni.showToast({ title: '评价功能开发中', icon: 'none' })
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

// 页面卸载清除定时器，防止内存泄漏
onUnmounted(() => {
  if (countDownTimer) clearInterval(countDownTimer)
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

/* 顶部状态卡片 对齐设计图 */
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
  .count-down-box {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    margin-bottom: 24rpx;
    .count-item {
      background: #2a3338;
      padding: 16rpx 32rpx;
      border-radius: 16rpx;
      text-align: center;
      min-width: 100rpx;
      .count-num {
        display: block;
        color: #00BB88;
        font-size: 60rpx;
        font-weight: bold;
        line-height: 1;
      }
      .count-label {
        display: block;
        color: #9CA3AF;
        font-size: 24rpx;
        margin-top: 4rpx;
      }
    }
    .count-colon {
      color: #fff;
      font-size: 40rpx;
      font-weight: bold;
    }
  }
  .status-desc {
    color: rgba(255,255,255,0.7);
    font-size: 28rpx;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    &::before {
      content: '🕒';
    }
  }
}

/* 通用信息卡片 */
.info-card {
  margin: 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
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
      .coach-level {
        background: rgba(0, 187, 136, 0.2);
        color: #00BB88;
        padding: 4rpx 16rpx;
        border-radius: 8rpx;
        font-size: 24rpx;
      }
    }
    .coach-meta-row {
      display: flex;
      gap: 24rpx;
      margin-bottom: 16rpx;
      color: #9CA3AF;
      font-size: 28rpx;
    }
    .coach-tags {
      display: flex;
      gap: 16rpx;
      .tag {
        background: #2a3338;
        color: #ddd;
        padding: 6rpx 20rpx;
        border-radius: 8rpx;
        font-size: 26rpx;
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
.hall-image {
  width: 100%;
  height: 280rpx;
  border-radius: 16rpx;
}

/* 备注信息 */
.remark-content {
  background: #2a3338;
  padding: 20rpx;
  border-radius: 12rpx;
  color: #fff;
  font-size: 28rpx;
  line-height: 1.6;
}

/* 费用行 */
.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  .fee-label {
    color: #9CA3AF;
    font-size: 28rpx;
  }
  .fee-value {
    color: #fff;
    font-size: 28rpx;
    &.minus {
      color: #EF4444;
    }
  }
  &.total {
    .fee-label {
      color: #fff;
      font-size: 32rpx;
      font-weight: 600;
    }
    .total-price {
      color: #00BB88;
      font-size: 40rpx;
      font-weight: bold;
    }
  }
}
.divider {
  height: 1rpx;
  background: rgba(255,255,255,0.1);
  margin: 12rpx 0;
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
      background: rgba(239, 68, 68, 0.15);
      color: #EF4444;
    }
    &.contact {
      background: rgba(0, 187, 136, 0.15);
      color: #00BB88;
    }
    &.reward {
      background: rgba(236, 72, 153, 0.2);
      color: #EC4899;
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