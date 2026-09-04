<template>
  <view class="home-skeleton">
    <view class="skeleton-card" v-for="i in count" :key="i">
      <view class="skeleton-line title"></view>
      <view class="skeleton-line"></view>
      <view class="skeleton-line short"></view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 3
  }
})
</script>

<style lang="scss" scoped>
.home-skeleton {
  padding: 0 30rpx 40rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .skeleton-card {
    background: var(--bg-card);
    border: 1rpx solid var(--border-color);
    border-radius: 24rpx;
    padding: 28rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    box-shadow: var(--card-shadow);
    animation: skeletonPulse 1.4s ease-in-out infinite;

    .skeleton-line {
      height: 24rpx;
      border-radius: 12rpx;
      background: var(--bg-secondary);

      &.title {
        width: 50%;
        height: 30rpx;
      }

      &.short {
        width: 70%;
      }
    }
  }
}

@keyframes skeletonPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
</style>
