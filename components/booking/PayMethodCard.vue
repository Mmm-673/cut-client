<template>
  <view class="info-card">
    <view class="card-title">支付方式</view>

    <view
        class="pay-item"
        :class="{active: modelValue === item.value}"
        v-for="item in payList"
        :key="item.value"
        @click="$emit('update:modelValue', item.value)"
    >
      <view class="pay-left">
        <view class="pay-icon" :style="{background: item.icon && item.icon.startsWith('/') ? 'transparent' : item.bgColor}">
          <image v-if="item.icon && item.icon.startsWith('/')" :src="item.icon" class="pay-icon-img" mode="aspectFit" />
          <uni-icons v-else :type="item.icon" size="24" color="#fff" />
        </view>
        <text class="pay-name">{{ item.label }}</text>
        <text class="pay-balance" v-if="item.balance !== undefined">（可用余额：¥{{ item.balance }}）</text>
      </view>
      <view class="pay-radio">
        <view class="radio-dot" v-if="modelValue === item.value"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  payList: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])
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

.pay-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border-color);
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .pay-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    .pay-icon {
      width: 70rpx;
      height: 70rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .pay-icon-img {
        width: 56rpx;
        height: 56rpx;
      }
    }
    .pay-name {
      color: var(--text-primary);
      font-size: 30rpx;
      font-weight: 500;
    }
    .pay-balance {
      color: var(--text-secondary);
      font-size: 24rpx;
    }
  }
  .pay-radio {
    width: 40rpx;
    height: 40rpx;
    border: 3rpx solid var(--bg-secondary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &.active {
    .pay-radio {
      border-color: #00BB88;
      .radio-dot {
        width: 20rpx;
        height: 20rpx;
        border-radius: 50%;
        background: #00BB88;
      }
    }
  }
}
</style>
