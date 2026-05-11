<template>
  <view
    class="ds-card"
    :class="[
      { 'ds-card--hover': hoverable, 'ds-card--elevated': elevated }
    ]"
    :hover-class="hoverable ? 'ds-card--active' : ''"
    @click="handleClick"
  >
    <slot></slot>
  </view>
</template>

<script setup>
const props = defineProps({
  hoverable: { type: Boolean, default: false },
  elevated: { type: Boolean, default: true }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  if (props.hoverable) {
    emit('click')
  }
}
</script>

<style lang="scss" scoped>
@import '@/design-system/index.scss';

.ds-card {
  background: var(--ds-bg-card);
  border-radius: var(--ds-radius-card);
  border: 1rpx solid var(--ds-border-subtle);
  overflow: hidden;
  position: relative;
  transition: all var(--ds-duration-normal) var(--ds-easing-standard);

  /* Glass Effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom, rgba(255,255,255,0.06), transparent);
    pointer-events: none;
    z-index: 1;
  }

  /* Shadow */
  box-shadow: var(--ds-shadow-md), var(--ds-shadow-inner-glass);

  /* Elevated Variant */
  &--elevated {
    box-shadow: var(--ds-shadow-lg), var(--ds-shadow-inner-glass);
  }

  /* Hoverable */
  &--hover {
    cursor: pointer;
  }

  &--active {
    transform: scale(0.985);
    filter: brightness(1.02);
  }
}
</style>