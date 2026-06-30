<template>
  <view class="ds-coach-card" @click="handleClick">
    <view class="ds-coach-card__image-wrapper">
      <image
        class="ds-coach-card__image"
        :src="coach.avatar || 'https://picsum.photos/400/400'"
        mode="aspectFill"
      />
      <view v-if="coach.online" class="ds-coach-card__online-badge">
        <view class="ds-coach-card__online-dot"></view>
        <text>在线</text>
      </view>
      <view v-if="coach.isNew" class="ds-coach-card__new-badge">
        <text>NEW</text>
      </view>
    </view>

    <view class="ds-coach-card__content">
      <view class="ds-coach-card__header">
        <text class="ds-coach-card__name">{{ coach.name || '裁教' }}</text>
        <view class="ds-coach-card__rating">
          <text class="ds-coach-card__star">★</text>
          <text>{{ coach.score || '5.0' }}</text>
        </view>
      </view>

      <view class="ds-coach-card__stats">
        <view class="ds-coach-card__stat">
          <text class="ds-coach-card__stat-value">{{ coach.orderCount || 0 }}</text>
          <text class="ds-coach-card__stat-label">单</text>
        </view>
        <view class="ds-coach-card__stat">
          <text class="ds-coach-card__stat-value">{{ coach.price || 99 }}</text>
          <text class="ds-coach-card__stat-label">元/小时</text>
        </view>
      </view>

      <view v-if="coach.tags && coach.tags.length" class="ds-coach-card__tags">
        <text v-for="(tag, i) in coach.tags.slice(0, 3)" :key="i" class="ds-coach-card__tag">
          {{ tag }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  coach: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click', props.coach)
}
</script>

<style lang="scss" scoped>
@import '@/design-system/index.scss';

.ds-coach-card {
  width: 240rpx;
  background: var(--ds-bg-card);
  border-radius: var(--ds-radius-card);
  border: 1rpx solid var(--ds-border-subtle);
  overflow: hidden;
  box-shadow: var(--ds-shadow-lg), var(--ds-shadow-inner-glass);
  transition: all var(--ds-duration-normal) var(--ds-easing-standard);
  flex-shrink: 0;

  &:active {
    transform: scale(0.97);
  }

  &__image-wrapper {
    position: relative;
    width: 100%;
    height: 240rpx;
    overflow: hidden;
  }

  &__image {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #2A3338 0%, #1E252B 100%);
  }

  &__online-badge {
    position: absolute;
    top: 12rpx;
    left: 12rpx;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10rpx);
    padding: 4rpx 10rpx;
    border-radius: 50rpx;
    display: flex;
    align-items: center;
    gap: 6rpx;
    border: 1rpx solid rgba(0, 187, 136, 0.4);
    font-size: 16rpx;
    color: #fff;
  }

  &__online-dot {
    width: 8rpx;
    height: 8rpx;
    background: var(--ds-color-primary);
    border-radius: 50%;
    box-shadow: 0 0 10rpx var(--ds-color-primary);
    animation: ds-pulse-soft 2s ease-in-out infinite;
  }

  &__new-badge {
    position: absolute;
    top: 12rpx;
    right: 12rpx;
    background: linear-gradient(135deg, #FF4D4D, #F63B82);
    padding: 4rpx 10rpx;
    border-radius: 50rpx;
    font-size: 14rpx;
    font-weight: bold;
    color: #fff;
  }

  &__content {
    padding: 16rpx 16rpx 20rpx;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10rpx;
  }

  &__name {
    font-size: 24rpx;
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-text-primary);
    line-height: 1.2;
  }

  &__rating {
    display: flex;
    align-items: center;
    gap: 3rpx;
    background: rgba(251, 191, 36, 0.1);
    padding: 3rpx 8rpx;
    border-radius: 50rpx;
    font-size: 18rpx;
    color: #FBBF24;
  }

  &__star {
    font-size: 16rpx;
  }

  &__stats {
    display: flex;
    gap: 16rpx;
    margin-bottom: 12rpx;
  }

  &__stat {
    display: flex;
    align-items: baseline;
    gap: 3rpx;
  }

  &__stat-value {
    font-size: 22rpx;
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-text-primary);
  }

  &__stat-label {
    font-size: 16rpx;
    color: var(--ds-text-tertiary);
  }

  &__tags {
    display: flex;
    gap: 6rpx;
    flex-wrap: wrap;
  }

  &__tag {
    font-size: 14rpx;
    color: var(--ds-text-secondary);
    background: rgba(255, 255, 255, 0.06);
    padding: 3rpx 10rpx;
    border-radius: 50rpx;
    border: 1rpx solid rgba(255, 255, 255, 0.06);
  }
}
</style>