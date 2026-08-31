<template>
  <view class="delete-popup-mask" v-if="visible" @click="handleCancel">
    <view class="delete-popup-wrapper" @click.stop>
      <view class="delete-popup-content">
        <view class="delete-popup-title">确认删除</view>
        <view class="delete-popup-text">确定要删除这个订单吗？删除后无法恢复。</view>
        <view class="delete-popup-buttons">
          <button class="delete-popup-btn cancel" @click="handleCancel">取消</button>
          <button class="delete-popup-btn confirm" @click="handleConfirm">确认删除</button>
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
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

/** 取消删除 */
const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

/** 确认删除 */
const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.delete-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-popup-wrapper {
  width: 560rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.delete-popup-content {
  padding: 48rpx 40rpx 40rpx;

  .delete-popup-title {
    color: var(--text-primary);
    font-size: 36rpx;
    font-weight: 600;
    text-align: center;
    margin-bottom: 16rpx;
  }

  .delete-popup-text {
    color: var(--text-secondary);
    font-size: 28rpx;
    text-align: center;
    line-height: 1.6;
    margin-bottom: 40rpx;
  }

  .delete-popup-buttons {
    display: flex;
    gap: 20rpx;

    .delete-popup-btn {
      flex: 1;
      height: 80rpx;
      line-height: 80rpx;
      border-radius: 40rpx;
      font-size: 30rpx;
      font-weight: 500;
      border: none;

      &::after {
        border: none;
      }

      &.cancel {
        background: rgba(107, 114, 128, 0.2);
        color: var(--text-secondary);
      }

      &.confirm {
        background: #EF4444;
        color: #fff;
      }
    }
  }
}
</style>
