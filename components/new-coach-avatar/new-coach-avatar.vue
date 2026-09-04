<template>
  <view class="new-avatar-item" @click="handleClick">
    <view class="new-img-wrap">
      <view class="avatar-ring"></view>
      <image class="new-img" :src="coach.avatar" mode="aspectFill" lazy-load></image>
      <view class="new-label">
        <text>NEW</text>
      </view>
      <view class="shine-overlay"></view>
      <view class="new-online-status" v-if="coach.online">
        <view class="online-dot"></view>
      </view>
    </view>
    <text class="new-name">{{ coach.name }}</text>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

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
.new-avatar-item {
  margin-right: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
  }

  &:last-child {
    margin-right: 0;
  }

  .new-img-wrap {
    position: relative;
    width: 140rpx;
    height: 140rpx;
    padding: 6rpx;
    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #3B82F6 100%);
    border-radius: 50%;
    margin-bottom: 14rpx;
    overflow: hidden;
    animation: rotateGradient 8s linear infinite;

    .avatar-ring {
      position: absolute;
      top: 4rpx;
      left: 4rpx;
      right: 4rpx;
      bottom: 4rpx;
      border-radius: 50%;
      border: 2rpx dashed rgba(255, 255, 255, 0.3);
      animation: rotateReverse 12s linear infinite;
    }

    .new-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 4rpx solid var(--bg-page);
      object-fit: cover;
      position: relative;
      z-index: 1;
    }

    .new-label {
      position: absolute;
      bottom: 4rpx;
      right: -4rpx;
      background: linear-gradient(90deg, #FF4D4D, #F63B82);
      color: #fff;
      font-size: 16rpx;
      font-weight: 800;
      padding: 5rpx 12rpx;
      border-radius: 50rpx;
      border: 2rpx solid var(--bg-page);
      line-height: 1.2;
      z-index: 2;
      box-shadow: 0 4rpx 12rpx rgba(246, 59, 130, 0.4);
    }

    .shine-overlay {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255, 255, 255, 0.2) 50%,
        transparent 70%
      );
      animation: shine 3s ease-in-out infinite;
      z-index: 3;
    }

    .new-online-status {
      position: absolute;
      bottom: 8rpx;
      left: 50%;
      transform: translateX(-50%);
      z-index: 4;
    }

    .online-dot {
      width: 16rpx;
      height: 16rpx;
      background: #00BB88;
      border-radius: 50%;
      border: 1rpx solid var(--bg-page);
      box-shadow: 0 0 8rpx rgba(0, 187, 136, 0.6);
    }
  }

  .new-name {
    color: var(--text-primary);
    font-size: 28rpx;
    font-weight: 600;
    max-width: 140rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
    margin-bottom: 6rpx;
  }
}

@keyframes rotateGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes rotateReverse {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}
</style>
