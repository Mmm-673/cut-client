<template>
  <view class="coach-book-bar">
    <view class="price-info">
      <text class="price-symbol">¥</text>
      <text class="price">{{ displayPrice }}</text>
      <text class="price-unit">/{{ priceUnit }}{{ showQi ? '起' : '' }}</text>
    </view>
    <view class="book-btn" :class="{ disabled: !canBook }" @click="handleBook">
      {{ buttonText }}
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { formatPrice } from '@/utils/common'

const props = defineProps({
  price: {
    type: [Number, String],
    default: 0
  },
  priceUnit: {
    type: String,
    default: '小时'
  },
  showQi: {
    type: Boolean,
    default: false
  },
  canBook: {
    type: Boolean,
    default: true
  },
  buttonText: {
    type: String,
    default: '立即预约'
  }
})

const emit = defineEmits(['book'])

const displayPrice = computed(() => formatPrice(props.price))

function handleBook() {
  if (!props.canBook) return
  emit('book')
}
</script>

<style lang="scss" scoped>
.coach-book-bar {
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
  z-index: 100;

  .price-info {
    display: flex;
    align-items: baseline;

    .price-symbol {
      font-size: 28rpx;
      color: #00c896;
      font-weight: 600;
    }

    .price {
      font-size: 44rpx;
      color: #00c896;
      font-weight: 700;
    }

    .price-unit {
      font-size: 24rpx;
      color: var(--text-tertiary);
    }
  }

  .book-btn {
    padding: 20rpx 56rpx;
    background: linear-gradient(135deg, #00c896 0%, #00a87a 100%);
    color: #fff;
    font-size: 28rpx;
    font-weight: 600;
    border-radius: 44rpx;
    box-shadow: 0 8rpx 30rpx rgba(0, 200, 150, 0.3);

    &.disabled {
      background: #666;
      box-shadow: none;
      opacity: 0.6;
    }
  }
}
</style>
