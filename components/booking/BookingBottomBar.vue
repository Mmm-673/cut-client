<template>
  <view class="bottom-bar" v-if="show">
    <view class="total-info" v-if="isOrderCreated">
      <text class="total-label">总计：</text>
      <text class="total-price">¥{{ ((payAmount || 0) / 100).toFixed(2) }}</text>
    </view>
    <button
        class="pay-btn"
        :class="{disabled: !canAction, fullWidth: !isOrderCreated}"
        :disabled="!canAction"
        @click="$emit('action')"
    >
      {{ isSubmitting ? '处理中...' : (isOrderCreated ? '立即支付' : '创建订单') }}
    </button>
  </view>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: true
  },
  isOrderCreated: {
    type: Boolean,
    default: false
  },
  payAmount: {
    type: Number,
    default: 0
  },
  canAction: {
    type: Boolean,
    default: false
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

defineEmits(['action'])
</script>

<style lang="scss" scoped>
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 999;
  background: var(--bg-card);
  border-top: 1rpx solid var(--border-color);
  padding: 12rpx 24rpx;
  padding-bottom: calc(12rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.3);
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  .total-info {
    flex: 1;
    .total-label {
      color: var(--text-primary);
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
    color: var(--text-primary);
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
    }
    &.fullWidth {
      padding: 18rpx 0;
      font-size: 32rpx;
      width: 100%;
    }
  }
}
</style>
