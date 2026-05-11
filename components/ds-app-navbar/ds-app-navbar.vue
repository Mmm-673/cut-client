<template>
  <view class="ds-app-navbar" :style="{ paddingTop: safeAreaTop + 'px' }">
    <view class="ds-app-navbar__content">
      <view class="ds-app-navbar__left">
        <slot name="left">
          <view v-if="showBack" class="ds-app-navbar__back-btn" @click="handleBack">
            <text class="ds-app-navbar__back-icon">‹</text>
          </view>
        </slot>
      </view>

      <view class="ds-app-navbar__center">
        <slot name="center">
          <view v-if="title" class="ds-app-navbar__title">{{ title }}</view>
        </slot>
      </view>

      <view class="ds-app-navbar__right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  transparent: { type: Boolean, default: false }
})

const emit = defineEmits(['back'])
const safeAreaTop = ref(0)

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  safeAreaTop.value = systemInfo.statusBarHeight || 44
})

const handleBack = () => {
  emit('back')
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
@import '@/design-system/index.scss';

.ds-app-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: rgba(18, 22, 25, 0.85);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 88rpx;
    padding: 0 var(--ds-layout-screen-padding);
  }

  &__left, &__right {
    display: flex;
    align-items: center;
    min-width: 80rpx;
  }

  &__right {
    justify-content: flex-end;
  }

  &__center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    font-size: var(--ds-font-size-title-3);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-text-primary);
    line-height: 1;
  }

  &__back-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 50%;
    border: 1rpx solid rgba(255, 255, 255, 0.08);
  }

  &__back-icon {
    font-size: 48rpx;
    color: var(--ds-text-primary);
    font-weight: 300;
    line-height: 1;
    margin-left: -4rpx;
  }
}
</style>