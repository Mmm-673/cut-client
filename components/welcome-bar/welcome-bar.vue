<template>
  <view class="welcome-section">
    <view class="welcome-left">
      <text class="greeting">{{ greeting }}</text>
      <text class="welcome-text">{{ welcomeText }}</text>
    </view>
    <view class="welcome-right" v-if="showScan">
      <view class="scan-btn" @click="handleScanClick">
        <uni-icons type="scan" size="24" color="#00BB88" />
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  greeting: {
    type: String,
    default: '你好 👋'
  },
  welcomeText: {
    type: String,
    default: '欢迎使用'
  },
  showScan: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['scanClick'])

const handleScanClick = () => {
  emit('scanClick')
}
</script>

<style lang="scss" scoped>
.welcome-section {
  padding: 0 30rpx 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: var(--bg-page);
  z-index: 99;
  padding-top: 20rpx;

  .welcome-left {
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .greeting {
      color: var(--text-secondary);
      font-size: 26rpx;
      font-weight: 500;
    }

    .welcome-text {
      color: var(--text-primary);
      font-size: 36rpx;
      font-weight: 700;
      letter-spacing: -1rpx;
    }
  }

  .welcome-right {
    .scan-btn {
      width: 60rpx;
      height: 60rpx;
      background: var(--brand-light-bg);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1rpx solid rgba(0, 187, 136, 0.3);
      transition: all 0.3s ease;

      &:active {
        background: rgba(0, 187, 136, 0.3);
        transform: scale(0.95);
      }
    }
  }
}
</style>
