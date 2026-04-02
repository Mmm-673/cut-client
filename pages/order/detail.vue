<template>
  <view class="order-detail-wrapper">
    <!-- 状态卡片 -->
    <view class="status-card">
      <text class="status-icon">{{ statusIcon }}</text>
      <text class="status-text">{{ orderInfo.statusText }}</text>
      <text class="status-desc" v-if="orderInfo.statusDesc">{{ orderInfo.statusDesc }}</text>
    </view>

    <!-- 预约信息 -->
    <view class="info-card">
      <view class="card-title">预约信息</view>

      <view class="info-row">
        <text class="label">服务</text>
        <text class="value">{{ orderInfo.serviceName }}</text>
      </view>

      <view class="info-row">
        <text class="label">助教</text>
        <view class="coach-row" @click="goToCoachDetail">
          <image class="coach-avatar" :src="orderInfo.coachAvatar" mode="aspectFill"></image>
          <text class="coach-name">{{ orderInfo.coachName }}</text>
          <uni-icons type="right" size="20" color="#9CA3AF" />
        </view>
      </view>

      <view class="info-row">
        <text class="label">时间</text>
        <text class="value">{{ orderInfo.date }} {{ orderInfo.time }}</text>
      </view>

      <view class="info-row">
        <text class="label">时长</text>
        <text class="value">{{ orderInfo.duration }}小时</text>
      </view>

      <view class="info-row">
        <text class="label">球厅</text>
        <text class="value">{{ orderInfo.hallName }}</text>
      </view>

      <view class="info-row" v-if="orderInfo.remark">
        <text class="label">备注</text>
        <text class="value">{{ orderInfo.remark }}</text>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="info-card">
      <view class="card-title">订单信息</view>

      <view class="info-row">
        <text class="label">订单编号</text>
        <text class="value">{{ orderInfo.orderNo }}</text>
      </view>

      <view class="info-row">
        <text class="label">下单时间</text>
        <text class="value">{{ orderInfo.createTime }}</text>
      </view>

      <view class="info-row">
        <text class="label">支付方式</text>
        <text class="value">{{ orderInfo.payType }}</text>
      </view>
    </view>

    <!-- 费用明细 -->
    <view class="info-card">
      <view class="card-title">费用明细</view>

      <view class="fee-row">
        <text class="fee-label">{{ orderInfo.serviceName }} x{{ orderInfo.duration }}小时</text>
        <text class="fee-value">¥{{ orderInfo.servicePrice * orderInfo.duration }}</text>
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

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="orderInfo.status === 'pending'">
      <button class="action-btn cancel" @click="cancelOrder">取消订单</button>
      <button class="action-btn contact" @click="contactCoach">联系助教</button>
    </view>

    <view class="bottom-bar" v-if="orderInfo.status === 'completed'">
      <button class="action-btn reward" @click="goToReward">打赏教练</button>
      <button v-if="!orderInfo.isReviewed" class="action-btn review" @click="goToReview">去评价</button>
      <button class="action-btn book-again" @click="bookAgain">再约一次</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 订单信息
const orderInfo = ref({
  id: 1,
  orderNo: 'DD202403310001',
  serviceName: '台球陪练',
  servicePrice: 99,
  coachName: '小雯',
  coachAvatar: 'https://picsum.photos/id/65/200/200',
  date: '03月31日 今天',
  time: '14:00',
  duration: 2,
  hallName: '星空台球俱乐部（朝阳店）',
  price: 198,
  couponDiscount: 0,
  status: 'pending',
  statusText: '待服务',
  statusDesc: '请准时到达球厅',
  createTime: '2024-03-31 10:30:25',
  payType: '微信支付',
  remark: '希望能多指导一下走位',
  isReviewed: false
})

// 状态图标
const statusIcon = computed(() => {
  const icons = {
    pending: '⏰',
    completed: '✅',
    cancelled: '❌'
  }
  return icons[orderInfo.value.status] || '📋'
})

// 跳转教练详情
const goToCoachDetail = () => {
  uni.navigateTo({
    url: `/pages/coach/detail?id=${orderInfo.value.id}`
  })
}

// 取消订单
const cancelOrder = () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消这个订单吗？',
    success: (res) => {
      if (res.confirm) {
        orderInfo.value.status = 'cancelled'
        orderInfo.value.statusText = '已取消'
        orderInfo.value.statusDesc = '订单已取消'
        uni.showToast({ title: '订单已取消', icon: 'success' })
      }
    }
  })
}

// 联系助教
const contactCoach = () => {
  uni.showToast({ title: '联系助教功能开发中', icon: 'none' })
}

// 去打赏
const goToReward = () => {
  uni.navigateTo({
    url: `/pages/coach/reward?coachId=${orderInfo.value.id}&coachName=${orderInfo.value.coachName}`
  })
}

// 去评价
const goToReview = () => {
  uni.showToast({ title: '评价功能开发中', icon: 'none' })
}

// 再约一次
const bookAgain = () => {
  uni.switchTab({
    url: '/pages/home/index'
  })
}

onLoad((options) => {
  if (options.id) {
    // 根据订单ID获取订单详情
  }
})
</script>

<style lang="scss" scoped>
.order-detail-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-bottom: 140rpx;
}

/* 状态卡片 */
.status-card {
  background: linear-gradient(135deg, #00BB88 0%, #008866 100%);
  padding: 60rpx 30rpx 40rpx;
  text-align: center;
  .status-icon {
    font-size: 80rpx;
    display: block;
    margin-bottom: 16rpx;
  }
  .status-text {
    color: #fff;
    font-size: 36rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 12rpx;
  }
  .status-desc {
    color: rgba(255,255,255,0.8);
    font-size: 26rpx;
  }
}

/* 信息卡片 */
.info-card {
  margin: 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  .card-title {
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 24rpx;
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
  }
  .coach-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    .coach-avatar {
      width: 60rpx;
      height: 60rpx;
      border-radius: 12rpx;
    }
    .coach-name {
      color: #fff;
      font-size: 28rpx;
    }
  }
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

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1E252B;
  padding: 30rpx 30rpx;

  box-sizing: border-box;
  display: flex;
  gap: 16rpx;
  .action-btn {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 500;
    border: none;
    &::after { border: none; }
    &.cancel {
      background: rgba(107, 114, 128, 0.2);
      color: #9CA3AF;
    }
    &.contact {
      background: rgba(59, 130, 246, 0.2);
      color: #3B82F6;
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
