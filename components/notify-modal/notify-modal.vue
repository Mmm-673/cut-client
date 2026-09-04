<template>
  <view class="notify-modal" v-if="visible" @click="handleMaskClick">
    <view class="notify-modal-content" @click.stop>
      <!-- 顶部装饰 -->
      <view class="notify-modal-header">
        <view class="notify-modal-icon">
          <uni-icons type="sound" size="28" color="#fff" />
        </view>
        <text class="notify-modal-badge">{{ badge }}</text>
      </view>

      <!-- 内容区 -->
      <view class="notify-modal-body">
        <text class="notify-modal-title">{{ title }}</text>
        <text class="notify-modal-desc">{{ description }}</text>
      </view>

      <!-- 按钮区 -->
      <view class="notify-modal-footer">
        <view class="notify-btn notify-btn-cancel" @click="handleCancel">
          <text>{{ cancelText }}</text>
        </view>
        <view class="notify-btn notify-btn-confirm" @click="handleConfirm">
          <text>{{ confirmText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  cancelText: {
    type: String,
    default: '我知道了'
  },
  confirmText: {
    type: String,
    default: '查看详情'
  },
  badge: {
    type: String,
    default: '重大通知'
  }
})

const emit = defineEmits(['cancel', 'confirm', 'update:visible'])

const handleMaskClick = () => {
  emit('update:visible', false)
  emit('cancel')
}

const handleCancel = () => {
  emit('update:visible', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('update:visible', false)
  emit('confirm')
}
</script>

<style lang="scss" scoped>
.notify-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: notifyFadeIn 0.3s ease;

  .notify-modal-content {
    width: 600rpx;
    background: linear-gradient(180deg, #1e252b 0%, #1a2025 100%);
    border-radius: 32rpx;
    overflow: hidden;
    position: relative;
    animation: notifySlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

    .notify-modal-header {
      height: 160rpx;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: -60rpx;
        right: -40rpx;
        width: 200rpx;
        height: 200rpx;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 50%;
      }

      &::after {
        content: '';
        position: absolute;
        bottom: -30rpx;
        left: -20rpx;
        width: 100rpx;
        height: 100rpx;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 50%;
      }

      .notify-modal-icon {
        width: 80rpx;
        height: 80rpx;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12rpx;
        z-index: 1;
        animation: notifyBellShake 2s ease-in-out infinite;
      }

      .notify-modal-badge {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
        z-index: 1;
        letter-spacing: 4rpx;
      }
    }

    .notify-modal-body {
      padding: 48rpx 40rpx 40rpx;
      text-align: center;

      .notify-modal-title {
        font-size: 34rpx;
        font-weight: 600;
        color: #fff;
        line-height: 1.4;
        display: block;
        margin-bottom: 20rpx;
      }

      .notify-modal-desc {
        font-size: 26rpx;
        color: #999;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .notify-modal-footer {
      display: flex;
      padding: 0 30rpx 40rpx;
      gap: 20rpx;

      .notify-btn {
        flex: 1;
        height: 88rpx;
        border-radius: 44rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28rpx;

        &.notify-btn-cancel {
          background: rgba(255, 255, 255, 0.08);
          color: #999;
        }

        &.notify-btn-confirm {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
          font-weight: 500;
        }
      }
    }
  }
}

@keyframes notifyFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes notifySlideUp {
  from {
    opacity: 0;
    transform: translateY(40rpx) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes notifyBellShake {
  0%, 100% { transform: rotate(0); }
  10% { transform: rotate(-10deg); }
  20% { transform: rotate(10deg); }
  30% { transform: rotate(-10deg); }
  40% { transform: rotate(10deg); }
  50% { transform: rotate(0); }
}
</style>
