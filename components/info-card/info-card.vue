<template>
  <view class="info-card" :class="cardClass">
    <view class="card-title" v-if="title || $slots.title">
      <slot name="title">
        <text class="title-icon" v-if="titleIcon">{{ titleIcon }}</text>
        <text class="title-text">{{ title }}</text>
      </slot>
    </view>
    <view class="card-content">
      <slot></slot>
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  titleIcon: {
    type: String,
    default: ''
  },
  cardClass: {
    type: String,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
.info-card {
  background: var(--bg-card);
  border-radius: 24rpx;
  margin: 0 30rpx 24rpx;
  padding: 30rpx;

  .card-title {
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 24rpx;

    .title-icon {
      font-size: 28rpx;
    }

    .title-text {
      flex: 1;
    }
  }

  .card-content {
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
        font-size: 28rpx;
        color: var(--text-secondary);
        flex-shrink: 0;
      }

      .value {
        font-size: 28rpx;
        color: var(--text-primary);
        text-align: right;
        flex: 1;
        margin-left: 20rpx;
        word-break: break-all;

        &.price {
          color: #ff6b35;
          font-weight: 600;
        }
      }
    }
  }
}
</style>
