<template>
  <view class="info-card">
    <view class="card-title">
      <text class="title-icon">🖥</text>
      订单信息
    </view>

    <view class="info-row">
      <text class="label">服务时间</text>
      <text class="value">{{ formatDateTime ? formatDateTime(orderInfo.bookingTime) : (orderInfo.serviceTime || '') }}</text>
    </view>

    <view class="info-row" v-if="!isFixedOrder && orderInfo.serviceDuration">
      <text class="label">服务时长</text>
      <text class="value">{{ formatDuration ? formatDuration(orderInfo.serviceDuration) : (orderInfo.serviceDuration + '分钟') }}</text>
    </view>

    <view class="info-row">
      <text class="label">服务类型</text>
      <text class="value">{{ serviceTypeName }}</text>
    </view>

    <view class="info-row">
      <text class="label">下单时间</text>
      <text class="value">{{ formatDateTime ? formatDateTime(orderInfo.createTime) : (orderInfo.createTime || '') }}</text>
    </view>

    <view class="info-row" v-if="orderInfo.payMethod">
      <text class="label">支付方式</text>
      <text class="value">{{ orderInfo.payMethod }}</text>
    </view>

    <view class="info-row">
      <text class="label">订单金额</text>
      <text class="value price">¥{{ formatAmount(orderInfo.totalAmount) }}</text>
    </view>

    <view class="info-row" v-if="orderInfo.payAmount > 0">
      <text class="label">实际支付</text>
      <text class="value price">¥{{ formatAmount(orderInfo.payAmount) }}</text>
    </view>

    <view class="info-row" v-if="!isFixedOrder && orderInfo.extraPayAmount > 0">
      <text class="label">加钟支付</text>
      <text class="value price">¥{{ formatAmount(orderInfo.extraPayAmount) }}</text>
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
    default: '台球指导'
  },
  formatDateTime: {
    type: Function,
    default: null
  },
  formatDuration: {
    type: Function,
    default: null
  }
})

// 是否为固定价订单（pricingMode: 1=小时价 2=固定价）
const isFixedOrder = computed(() => {
  return props.orderInfo.pricingMode === 2
})

// 格式化金额：分转元，保留两位小数
const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00'
  const val = Number(amount)
  if (isNaN(val)) return '0.00'
  // 如果大于 100，认为是分，转换为元
  if (val >= 100 || (val > 0 && val < 1 && Number.isInteger(val * 100))) {
    return (val / 100).toFixed(2)
  }
  return val.toFixed(2)
}
</script>

<style lang="scss" scoped>
.info-card {
  margin: 30rpx;
  margin-top: 0;
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

/* 信息行 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  .label {
    color: var(--text-secondary);
    font-size: 28rpx;
  }

  .value {
    color: var(--text-primary);
    font-size: 28rpx;
    text-align: right;

    &.price {
      color: #00BB88;
      font-size: 36rpx;
      font-weight: bold;
    }
  }
}
</style>
