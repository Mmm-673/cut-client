<template>
  <view class="order-fee-detail">
    <view class="card-title">
      <text class="title-icon">💰</text>
      费用明细
    </view>

    <!-- 服务费 -->
    <view class="fee-row">
      <view class="fee-left">
        <text class="fee-label">{{ serviceTypeName }}</text>
        <text class="fee-qty">{{ quantityText }}</text>
      </view>
      <text class="fee-value">¥{{ formatAmount(serviceAmount) }}</text>
    </view>

    <!-- 出行费 -->
    <view class="fee-row" v-if="travelAmount > 0">
      <text class="fee-label">出行费</text>
      <text class="fee-value">¥{{ formatAmount(travelAmount) }}</text>
    </view>

    <!-- 出行优惠 -->
    <view class="fee-row discount" v-if="travelDiscountAmount > 0">
      <text class="fee-label">出行优惠</text>
      <text class="fee-value">-¥{{ formatAmount(travelDiscountAmount) }}</text>
    </view>

    <!-- 实付金额 -->
    <view class="fee-row total">
      <text class="fee-label">实付金额</text>
      <text class="fee-value">¥{{ formatAmount(payAmount) }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  orderInfo: {
    type: Object,
    default: () => ({})
  },
  serviceTypeName: {
    type: String,
    default: '服务费用'
  },
  quantityText: {
    type: String,
    default: ''
  }
})

const serviceAmount = computed(() => props.orderInfo.serviceAmount || props.orderInfo.totalAmount || 0)
const travelAmount = computed(() => props.orderInfo.travelAmount || 0)
const travelDiscountAmount = computed(() => props.orderInfo.travelDiscountAmount || 0)
const payAmount = computed(() => props.orderInfo.payAmount || props.orderInfo.totalAmount || 0)

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return (Number(amount) / 100).toFixed(2)
}
</script>

<style lang="scss" scoped>
.order-fee-detail {
  margin: 20rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;

  .card-title {
    display: flex;
    align-items: center;
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 24rpx;

    .title-icon {
      margin-right: 12rpx;
    }
  }
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  .fee-left {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .fee-label {
    color: var(--text-secondary);
    font-size: 28rpx;
  }

  .fee-qty {
    color: var(--text-secondary);
    font-size: 24rpx;
  }

  .fee-value {
    color: var(--text-primary);
    font-size: 28rpx;
  }

  &.discount {
    .fee-value {
      color: #00BB88;
    }
  }

  &.total {
    padding-top: 24rpx;
    border-bottom: none;

    .fee-label {
      color: var(--text-primary);
      font-weight: 500;
      font-size: 30rpx;
    }

    .fee-value {
      color: #00BB88;
      font-size: 40rpx;
      font-weight: 700;
    }
  }
}
</style>
