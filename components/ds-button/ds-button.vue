<template>
  <view
    class="ds-button"
    :class="[
      `ds-button--${type}`,
      `ds-button--${size}`,
      { 'ds-button--disabled': disabled, 'ds-button--loading': loading }
    ]"
    :disabled="disabled || loading"
    :hover-class="disabled || loading ? '' : 'ds-button--hover'"
    @click="handleClick"
  >
    <view v-if="loading" class="ds-button__loading">
      <view class="ds-spinner"></view>
    </view>
    <view v-else-if="icon" class="ds-button__icon">
      <text>{{ icon }}</text>
    </view>
    <text class="ds-button__text">{{ text }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  type: { type: String, default: 'primary', validator: (v) => ['primary', 'secondary', 'ghost', 'text'].includes(v) },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  icon: { type: String, default: '' }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  if (!props.disabled && !props.loading) {
    emit('click')
  }
}
</script>

<style lang="scss" scoped>
@import '@/design-system/index.scss';

.ds-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-family: var(--ds-font-family-base);
  font-weight: var(--ds-font-weight-semibold);
  text-align: center;
  border: none;
  outline: none;
  background: transparent;
  transition: all var(--ds-duration-fast) var(--ds-easing-standard);
  user-select: none;
  position: relative;
  overflow: hidden;

  /* Size Variants */
  &--sm {
    height: 64rpx;
    padding: 0 24rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
  }

  &--md {
    height: 88rpx;
    padding: 0 32rpx;
    border-radius: var(--ds-radius-button);
    font-size: 28rpx;
  }

  &--lg {
    height: 104rpx;
    padding: 0 40rpx;
    border-radius: 28rpx;
    font-size: 32rpx;
  }

  /* Type Variants */
  &--primary {
    background: var(--ds-gradient-primary);
    color: #FFFFFF;
    box-shadow: 0 8rpx 24rpx rgba(0, 187, 136, 0.3), var(--ds-shadow-inner-glass);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(to bottom, rgba(255,255,255,0.15), transparent);
      border-radius: var(--ds-radius-button) var(--ds-radius-button) 50% 50%;
      pointer-events: none;
    }
  }

  &--secondary {
    background: var(--ds-bg-card);
    color: var(--ds-text-primary);
    border: 1rpx solid var(--ds-border-subtle);
    box-shadow: var(--ds-shadow-sm), var(--ds-shadow-inner-glass);
  }

  &--ghost {
    background: rgba(255, 255, 255, 0.06);
    color: var(--ds-text-primary);
    border: 1rpx solid rgba(255, 255, 255, 0.08);
  }

  &--text {
    background: transparent;
    color: var(--ds-color-primary);
    padding: 0 12rpx;
    height: auto;
    min-height: 64rpx;
  }

  /* States */
  &--hover {
    filter: brightness(1.05);
  }

  &:active {
    transform: scale(0.97);
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &--loading {
    pointer-events: none;
  }

  /* Loading Spinner */
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ds-spinner {
    width: 32rpx;
    height: 32rpx;
    border: 3rpx solid rgba(255,255,255,0.3);
    border-top-color: #FFFFFF;
    border-radius: 50%;
    animation: ds-rotate 0.8s linear infinite;
  }

  &__text {
    position: relative;
    z-index: 1;
  }
}
</style>