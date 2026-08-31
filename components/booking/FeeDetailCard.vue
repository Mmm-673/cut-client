<template>
  <view class="info-card">
    <view class="card-title">费用明细</view>

    <view class="fee-row">
      <text class="fee-label">{{ serviceTypeName }} {{ serviceFeeQuantityText }}</text>
      <text class="fee-value">¥{{ (orderData.serviceAmount / 100).toFixed(2) }}</text>
    </view>

    <view class="fee-row" v-if="orderData.travelAmount > 0">
      <text class="fee-label">车费</text>
      <text class="fee-value">¥{{ (orderData.travelAmount / 100).toFixed(2) }}</text>
    </view>

    <view class="fee-row" v-if="orderData.travelDiscountAmount > 0">
      <text class="fee-label">车费优惠</text>
      <text class="fee-value" style="color: #EF4444;">-¥{{ (orderData.travelDiscountAmount / 100).toFixed(2) }}</text>
    </view>

    <view class="fee-total">
      <text class="total-label">实付金额</text>
      <text class="total-value">¥{{ (orderData.payAmount / 100).toFixed(2) }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  orderData: {
    type: Object,
    default: () => ({})
  },
  serviceTypeName: {
    type: String,
    default: ''
  },
  serviceFeeQuantityText: {
    type: String,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
.info-card {
  margin: 0 30rpx 30rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;
  .card-title {
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 700;
    margin-bottom: 24rpx;
  }
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  .fee-label {
    color: var(--text-secondary);
    font-size: 28rpx;
  }
  .fee-value {
    color: var(--text-primary);
    font-size: 28rpx;
  }
}

.fee-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid var(--border-color);
  .total-label {
    color: var(--text-primary);
    font-size: 30rpx;
    font-weight: 600;
  }
  .total-value {
    color: #00BB88;
    font-size: 40rpx;
    font-weight: 700;
  }
}
</style>
