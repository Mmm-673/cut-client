<template>
  <view class="confirm-wrapper">
    <!-- 预约信息卡片 -->
    <view class="info-card">
      <view class="card-title">预约信息</view>

      <!-- 助教信息 -->
      <view class="info-row">
        <text class="label">助教</text>
        <view class="coach-info">
          <image class="coach-avatar" :src="bookingInfo.coachAvatar" mode="aspectFill"></image>
          <view class="coach-detail">
            <text class="coach-name">{{ bookingInfo.coachName }}</text>
            <text class="coach-service">{{ bookingInfo.serviceName }}</text>
          </view>
        </view>
      </view>

      <!-- 时间 -->
      <view class="info-row">
        <text class="label">时间</text>
        <text class="value">{{ bookingInfo.date }} {{ bookingInfo.time }}</text>
      </view>

      <!-- 时长 -->
      <view class="info-row">
        <text class="label">时长</text>
        <view class="duration-selector">
          <view
            class="duration-btn"
            :class="{ active: bookingInfo.duration === 1 }"
            @click="bookingInfo.duration = 1"
          >
            1小时
          </view>
          <view
            class="duration-btn"
            :class="{ active: bookingInfo.duration === 2 }"
            @click="bookingInfo.duration = 2"
          >
            2小时
          </view>
          <view
            class="duration-btn"
            :class="{ active: bookingInfo.duration === 3 }"
            @click="bookingInfo.duration = 3"
          >
            3小时
          </view>
        </view>
      </view>

      <!-- 球厅 -->
      <view class="info-row">
        <text class="label">球厅</text>
        <text class="value">{{ bookingInfo.hallName }}</text>
      </view>

      <!-- 备注 -->
      <view class="info-row" v-if="bookingInfo.remark">
        <text class="label">备注</text>
        <text class="value">{{ bookingInfo.remark }}</text>
      </view>
    </view>

    <!-- 费用明细 -->
    <view class="fee-card">
      <view class="card-title">费用明细</view>
      <view class="fee-row">
        <text class="fee-label">{{ bookingInfo.serviceName }} x{{ bookingInfo.duration }}小时</text>
        <text class="fee-value">¥{{ bookingInfo.servicePrice * bookingInfo.duration }}</text>
      </view>
      <view class="fee-row" v-if="bookingInfo.couponDiscount > 0">
        <text class="fee-label">优惠券</text>
        <text class="fee-value minus">-¥{{ bookingInfo.couponDiscount }}</text>
      </view>
      <view class="divider"></view>
      <view class="fee-row total">
        <text class="fee-label">合计</text>
        <text class="fee-value total-price">¥{{ totalPrice }}</text>
      </view>
    </view>

    <!-- 优惠券 -->
    <view class="coupon-card" @click="selectCoupon">
      <view class="coupon-left">
        <uni-icons type="gift" size="24" color="#00BB88" />
        <text class="coupon-text">{{ bookingInfo.couponId ? '已选择1张优惠券' : '选择优惠券' }}</text>
      </view>
      <view class="coupon-right">
        <text v-if="bookingInfo.couponDiscount > 0" class="coupon-discount">-¥{{ bookingInfo.couponDiscount }}</text>
        <uni-icons type="right" size="20" color="#9CA3AF" />
      </view>
    </view>

    <!-- 支付方式 -->
    <view class="pay-card">
      <view class="card-title">支付方式</view>
      <view
        class="pay-item"
        :class="{ active: bookingInfo.payType === 'wechat' }"
        @click="bookingInfo.payType = 'wechat'"
      >
        <view class="pay-left">
          <text class="pay-icon">💬</text>
          <text class="pay-name">微信支付</text>
        </view>
        <view v-if="bookingInfo.payType === 'wechat'" class="pay-check">
          <uni-icons type="checkmarkempty" size="24" color="#00BB88" />
        </view>
      </view>
      <view
        class="pay-item"
        :class="{ active: bookingInfo.payType === 'alipay' }"
        @click="bookingInfo.payType = 'alipay'"
      >
        <view class="pay-left">
          <text class="pay-icon">💰</text>
          <text class="pay-name">支付宝</text>
        </view>
        <view v-if="bookingInfo.payType === 'alipay'" class="pay-check">
          <uni-icons type="checkmarkempty" size="24" color="#00BB88" />
        </view>
      </view>
    </view>

    <!-- 协议 -->
    <view class="agreement-section">
      <view class="checkbox" :class="{ checked: agreeProtocol }" @click="agreeProtocol = !agreeProtocol">
        <uni-icons v-if="agreeProtocol" type="check" size="16" color="#fff" />
      </view>
      <text class="agreement-text">
        我已阅读并同意
        <text class="link">《预约服务协议》</text>
      </text>
    </view>

    <!-- 底部支付栏 -->
    <view class="bottom-bar">
      <view class="price-info">
        <text class="price-label">实付</text>
        <text class="price-unit">¥</text>
        <text class="price-num">{{ totalPrice }}</text>
      </view>
      <button class="pay-btn" @click="submitOrder" :disabled="!agreeProtocol">确认支付</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 预约信息
const bookingInfo = ref({
  coachName: '小雯',
  coachAvatar: 'https://picsum.photos/id/65/200/200',
  serviceName: '台球陪练',
  servicePrice: 99,
  date: '03月31日 今天',
  time: '14:00',
  duration: 1,
  hallName: '星空台球俱乐部（朝阳店）',
  remark: '',
  couponId: null,
  couponDiscount: 0,
  payType: 'wechat'
})

// 是否同意协议
const agreeProtocol = ref(true)

// 总价
const totalPrice = computed(() => {
  return bookingInfo.value.servicePrice * bookingInfo.value.duration - bookingInfo.value.couponDiscount
})

// 选择优惠券
const selectCoupon = () => {
  uni.showToast({ title: '选择优惠券功能开发中', icon: 'none' })
}

// 提交订单
const submitOrder = () => {
  if (!agreeProtocol.value) {
    uni.showToast({ title: '请先阅读并同意协议', icon: 'none' })
    return
  }
  uni.showLoading({ title: '提交中...' })
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '预约成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/order/list' })
    }, 1500)
  }, 1500)
}

onLoad((options) => {
  if (options.coachId) {
    // 根据教练ID获取教练信息
  }
})
</script>

<style lang="scss" scoped>
.confirm-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-bottom: 140rpx;
}

/* 通用卡片 */
.info-card, .fee-card, .coupon-card, .pay-card {
  margin: 20rpx 30rpx;
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
  align-items: flex-start;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  &:last-child {
    border-bottom: none;
  }
  .label {
    width: 140rpx;
    color: #9CA3AF;
    font-size: 28rpx;
    flex-shrink: 0;
  }
  .value {
    flex: 1;
    color: #fff;
    font-size: 28rpx;
    text-align: right;
  }
  .coach-info {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    .coach-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 12rpx;
      margin-left: 16rpx;
    }
    .coach-detail {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-left: 12rpx;
      .coach-name {
        color: #fff;
        font-size: 28rpx;
      }
      .coach-service {
        color: #9CA3AF;
        font-size: 24rpx;
      }
    }
  }
}

/* 时长选择 */
.duration-selector {
  flex: 1;
  display: flex;
  gap: 12rpx;
  justify-content: flex-end;
  .duration-btn {
    padding: 12rpx 24rpx;
    background: #2A3138;
    color: #9CA3AF;
    font-size: 24rpx;
    border-radius: 24rpx;
    border: 2rpx solid transparent;
    &.active {
      background: rgba(0, 187, 136, 0.15);
      color: #00BB88;
      border-color: #00BB88;
    }
  }
}

/* 费用明细 */
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

/* 优惠券 */
.coupon-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .coupon-left {
    display: flex;
    align-items: center;
    gap: 12rpx;
    .coupon-text {
      color: #fff;
      font-size: 28rpx;
    }
  }
  .coupon-right {
    display: flex;
    align-items: center;
    gap: 8rpx;
    .coupon-discount {
      color: #EF4444;
      font-size: 28rpx;
      font-weight: bold;
    }
  }
}

/* 支付方式 */
.pay-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  &:last-child {
    border-bottom: none;
  }
  .pay-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    .pay-icon {
      font-size: 40rpx;
    }
    .pay-name {
      color: #fff;
      font-size: 28rpx;
    }
  }
  .pay-check {
    width: 40rpx;
    height: 40rpx;
    background: #00BB88;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* 协议 */
.agreement-section {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  gap: 12rpx;
  .checkbox {
    width: 36rpx;
    height: 36rpx;
    border: 2rpx solid #00BB88;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    &.checked {
      background: #00BB88;
    }
  }
  .agreement-text {
    color: #9CA3AF;
    font-size: 24rpx;
    .link {
      color: #00BB88;
    }
  }
}

/* 底部支付栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1E252B;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  .price-info {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
    .price-label {
      color: #fff;
      font-size: 28rpx;
    }
    .price-unit {
      color: #00BB88;
      font-size: 28rpx;
    }
    .price-num {
      color: #00BB88;
      font-size: 44rpx;
      font-weight: bold;
    }
  }
  .pay-btn {
    padding: 0 60rpx;
    height: 88rpx;
    line-height: 88rpx;
    background: #00BB88;
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: bold;
    border: none;
    &::after { border: none; }
    &[disabled] {
      opacity: 0.5;
    }
  }
}
</style>
