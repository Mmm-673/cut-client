<template>
  <view class="ds-skeleton">
    <view v-if="avatar" class="ds-skeleton__avatar"></view>
    <view class="ds-skeleton__content">
      <view
        v-for="i in lines"
        :key="i"
        class="ds-skeleton__line"
        :style="{ width: getLineWidth(i) }"
      ></view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  avatar: { type: Boolean, default: true },
  lines: { type: Number, default: 3 }
})

const getLineWidth = (index) => {
  const widths = ['100%', '80%', '60%']
  return widths[(index - 1) % widths.length]
}
</script>

<style lang="scss" scoped>
@import '@/design-system/index.scss';

.ds-skeleton {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
  padding: 20rpx 0;

  &__avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: var(--ds-bg-secondary);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--ds-gradient-shimmer);
      animation: ds-shimmer 1.5s infinite;
    }
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  &__line {
    height: 24rpx;
    border-radius: 8rpx;
    background: var(--ds-bg-secondary);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--ds-gradient-shimmer);
      animation: ds-shimmer 1.5s infinite;
    }
  }
}
</style>