<template>
  <view class="hot-coach-card" @click="handleClick">
    <view class="hot-img-box">
      <image class="hot-avatar" :src="coach.avatar" mode="aspectFill" lazy-load></image>
      <view v-if="coach.online" class="online-status">
        <view class="dot-pulse">
          <view class="dot"></view>
          <view class="dot-ring"></view>
        </view>
        <text>在线</text>
      </view>
      <view class="score-tag">
        <uni-icons type="star-filled" size="10" color="#FFB800" />
        <text>{{ coach.score }}</text>
      </view>
    </view>
    <view class="hot-info">
      <text class="hot-name">{{ coach.name }}</text>
      <view class="hot-stats">
        <text class="stat-count">已接{{ coach.orderCount }}单</text>
        <view class="order-icon">
          <uni-icons type="checkbox-filled" size="12" color="#00BB88" />
        </view>
      </view>
      <view class="price-info" v-if="coach.displayPrice">
        <text class="price-text">¥{{ coach.displayPrice }}</text>
        <text class="price-unit">/{{ coach.priceUnit }}起</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  coach: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click', props.coach)
}
</script>

<style lang="scss" scoped>
.hot-coach-card {
  width: 320rpx;
  margin-right: 24rpx;
  background: var(--bg-card);
  border-radius: 32rpx;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: var(--card-shadow);
  border: 1rpx solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &:active {
    transform: translateY(6rpx) scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
  }

  &:last-child {
    margin-right: 0;
  }

  .hot-img-box {
    position: relative;
    width: 100%;
    height: 320rpx;
    overflow: hidden;

    .hot-avatar {
      width: 100%;
      height: 100%;
      background-color: var(--bg-secondary);
      transition: transform 0.4s ease;
    }

    &:active .hot-avatar {
      transform: scale(1.08);
    }

    .online-status {
      position: absolute;
      top: 16rpx;
      left: 16rpx;
      background: var(--online-bg);
      backdrop-filter: blur(10rpx);
      padding: 6rpx 14rpx;
      border-radius: 50rpx;
      display: flex;
      align-items: center;
      gap: 8rpx;
      border: 1rpx solid rgba(0, 187, 136, 0.3);

      .dot-pulse {
        position: relative;

        .dot {
          width: 10rpx;
          height: 10rpx;
          background: var(--online-dot);
          border-radius: 50%;
          position: relative;
          z-index: 1;
        }

        .dot-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10rpx;
          height: 10rpx;
          background: rgba(0, 187, 136, 0.3);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: pulseRing 2s ease-out infinite;
        }
      }

      text {
        color: var(--text-primary);
        font-size: 20rpx;
        font-weight: 600;
      }
    }

    .score-tag {
      position: absolute;
      bottom: 16rpx;
      right: 16rpx;
      background: var(--online-bg);
      backdrop-filter: blur(10rpx);
      padding: 6rpx 12rpx;
      border-radius: 50rpx;
      display: flex;
      align-items: center;
      gap: 6rpx;
      border: 1rpx solid rgba(255, 184, 0, 0.25);

      text {
        color: var(--star-color);
        font-size: 22rpx;
        font-weight: 700;
      }
    }
  }

  .hot-info {
    padding: 24rpx;

    .hot-name {
      color: var(--text-primary);
      font-size: 32rpx;
      font-weight: 700;
      margin-bottom: 8rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    .hot-stats {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12rpx;

      .stat-count {
        color: var(--text-secondary);
        font-size: 22rpx;
        font-weight: 500;
      }

      .order-icon {
        width: 36rpx;
        height: 36rpx;
        background: var(--brand-light-bg);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .price-info {
      display: flex;
      align-items: baseline;
      gap: 4rpx;

      .price-text {
        color: var(--brand-primary);
        font-size: 36rpx;
        font-weight: 800;
      }

      .price-unit {
        color: var(--text-secondary);
        font-size: 22rpx;
        font-weight: 500;
      }
    }
  }
}

@keyframes pulseRing {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}
</style>
