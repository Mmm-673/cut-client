<template>
  <!-- 待支付 -->
  <view class="bottom-bar" v-if="status === ORDER_STATUS.PENDING_PAYMENT">
    <button class="action-btn cancel" @click="$emit('cancel')">取消订单</button>
    <button class="action-btn pay" @click="$emit('pay')">去支付</button>
  </view>

  <!-- 待接单 -->
  <view class="bottom-bar" v-else-if="status === ORDER_STATUS.PENDING_ACCEPT">
    <button class="action-btn cancel" @click="$emit('cancel')">取消订单</button>
  </view>

  <!-- 已接单 -->
  <view class="bottom-bar" v-else-if="status === ORDER_STATUS.ACCEPTED">
    <button class="action-btn cancel" @click="$emit('cancel')">取消订单</button>
    <button class="action-btn contact-coach" @click="$emit('contact')">
      <uni-icons type="phone" size="18" color="#00BB88" />
      联系教练
    </button>
  </view>

  <!-- 进行中（非固定价显示加钟） -->
  <view class="bottom-bar" v-else-if="status === ORDER_STATUS.IN_SERVICE && !isFixedOrder">
    <button class="action-btn add-time" @click="$emit('add-time')">加钟</button>
  </view>

  <!-- 待评价 -->
  <view class="bottom-bar" v-else-if="status === ORDER_STATUS.PENDING_REVIEW">
    <!-- #ifndef MP-WEIXIN -->
    <button class="action-btn reward" v-if="showReward" @click="$emit('reward')">
      <uni-icons type="gift" size="18" color="#FF9500" />
      心意表示
    </button>
    <!-- #endif -->
    <button class="action-btn review" @click="$emit('review')">去评价</button>
  </view>

  <!-- 已完成 -->
  <view class="bottom-bar" v-else-if="status === ORDER_STATUS.COMPLETED">
    <button class="action-btn book-again" @click="$emit('book-again')">再来一单</button>
  </view>

  <!-- 已取消 -->
  <view class="bottom-bar" v-else-if="status === ORDER_STATUS.CANCELLED">
    <button class="action-btn delete-order" @click="$emit('delete')">删除订单</button>
    <button class="action-btn book-again" @click="$emit('book-again')">再来一单</button>
  </view>
</template>

<script setup>
import { ORDER_STATUS } from '@/constants/orderStatus'

defineProps({
  status: {
    type: [Number, String],
    required: true
  },
  isFixedOrder: {
    type: Boolean,
    default: false
  },
  showReward: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'cancel',
  'pay',
  'contact',
  'add-time',
  'reward',
  'review',
  'book-again',
  'delete'
])
</script>

<style lang="scss" scoped>
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--bg-card);
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  z-index: 100;

  .action-btn {
    flex: 1;
    height: 72rpx;
    line-height: 72rpx;
    border-radius: 36rpx;
    font-size: 26rpx;
    font-weight: 500;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;

    &::after {
      border: none;
    }

    &.cancel {
      background: rgba(107, 114, 128, 0.2);
      color: var(--text-secondary);
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

    &.contact-coach {
      background: rgba(0, 187, 136, 0.2);
      color: #00BB88;
    }

    &.add-time {
      background: #00BB88;
      color: #fff;
    }

    &.reward {
      background: rgba(255, 149, 0, 0.2);
      color: #FF9500;
    }

    &.delete-order {
      background: rgba(239, 68, 68, 0.2);
      color: #EF4444;
    }
  }
}
</style>
