<template>
  <view class="popup-mask" v-if="visible" @click="handleClose">
    <view class="popup-wrapper" @click.stop>
      <!-- 头部 -->
      <view class="popup-header">
        <text class="close-btn" @click="handleClose">取消</text>
        <text class="popup-title">选择加钟时长</text>
        <text class="confirm-btn" :class="{ disabled: isAdding }" @click="handleConfirm">
          {{ isAdding ? '处理中...' : '确认' }}
        </text>
      </view>

      <!-- 内容 -->
      <view class="popup-content">
        <view class="tip-text">请选择需要延长的服务时长</view>
        <view class="limit-tip">最少加10分钟</view>

        <view class="options-grid">
          <view
            v-for="option in addTimeOptions"
            :key="option.value"
            class="option-item"
            :class="{ active: isOptionActive(option) }"
            @click="handleOptionSelect(option)"
          >
            <text class="option-label">{{ option.label }}</text>
          </view>
        </view>

        <!-- 自定义输入 -->
        <view class="custom-input-wrapper" v-if="showCustomInput">
          <view class="custom-input-row">
            <input
              class="custom-input"
              type="number"
              v-model="customMinutes"
              placeholder="最少10分钟"
              placeholder-class="input-placeholder"
              @input="handleCustomInput"
              @blur="handleCustomBlur"
            />
            <text class="custom-unit">分钟</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: [String, Number],
    default: ''
  },
  isAdding: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'close'])

const MIN_ADD_MINUTES = 10

const selectedAddMinutes = ref(MIN_ADD_MINUTES)
const showCustomInput = ref(false)
const customMinutes = ref('')

const addTimeOptions = ref([
  { label: '10分钟', value: 10 },
  { label: '30分钟', value: 30 },
  { label: '60分钟', value: 60 },
  { label: '自定义', value: 'custom' }
])

const isOptionActive = (option) => {
  if (option.value === 'custom') {
    return showCustomInput.value
  }
  return selectedAddMinutes.value === option.value && !showCustomInput.value
}

const handleOptionSelect = (option) => {
  if (option.value === 'custom') {
    showCustomInput.value = true
    customMinutes.value = String(MIN_ADD_MINUTES)
    selectedAddMinutes.value = MIN_ADD_MINUTES
  } else {
    showCustomInput.value = false
    selectedAddMinutes.value = option.value
  }
}

const handleCustomInput = () => {
  const val = parseInt(customMinutes.value)
  if (!isNaN(val)) {
    selectedAddMinutes.value = val
  }
}

const handleCustomBlur = () => {
  const val = parseInt(customMinutes.value)
  if (isNaN(val) || val < MIN_ADD_MINUTES) {
    customMinutes.value = String(MIN_ADD_MINUTES)
    selectedAddMinutes.value = MIN_ADD_MINUTES
  }
}

const handleClose = () => {
  emit('close')
  emit('update:visible', false)
}

const handleConfirm = () => {
  if (props.isAdding) return

  if (selectedAddMinutes.value < MIN_ADD_MINUTES) {
    uni.showToast({
      title: '最少加10分钟',
      icon: 'none'
    })
    return
  }

  emit('confirm', {
    minutes: selectedAddMinutes.value,
    orderId: props.orderId
  })
}

// 打开弹窗时重置状态
watch(() => props.visible, (val) => {
  if (val) {
    selectedAddMinutes.value = MIN_ADD_MINUTES
    showCustomInput.value = false
    customMinutes.value = ''
  }
})
</script>

<style lang="scss" scoped>
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.popup-wrapper {
  background: var(--bg-card);
  border-radius: 24rpx 24rpx 0 0;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid var(--border-color);

  .close-btn {
    color: var(--text-secondary);
    font-size: 30rpx;
  }

  .popup-title {
    color: var(--text-primary);
    font-size: 36rpx;
    font-weight: 600;
  }

  .confirm-btn {
    color: #00BB88;
    font-size: 30rpx;
    font-weight: 600;

    &.disabled {
      color: rgba(0, 187, 136, 0.5);
      pointer-events: none;
    }
  }
}

.popup-content {
  padding: 60rpx 40rpx;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
  padding-bottom: calc(60rpx + constant(safe-area-inset-bottom));

  .tip-text {
    color: var(--text-secondary);
    font-size: 28rpx;
    margin-bottom: 40rpx;
    text-align: center;
  }

  .limit-tip {
    color: #F59E0B;
    font-size: 24rpx;
    margin-bottom: 40rpx;
    text-align: center;
  }
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;

  .option-item {
    background: var(--bg-secondary);
    border-radius: 16rpx;
    padding: 50rpx 20rpx;
    text-align: center;
    border: 2rpx solid transparent;
    transition: all 0.2s ease;

    .option-label {
      color: var(--text-primary);
      font-size: 32rpx;
      font-weight: 500;
    }

    &.active {
      border-color: #00BB88;
      background: rgba(0, 187, 136, 0.1);

      .option-label {
        color: #00BB88;
      }
    }
  }
}

.custom-input-wrapper {
  margin-top: 40rpx;

  .custom-input-row {
    display: flex;
    align-items: center;
    gap: 20rpx;
    background: var(--bg-secondary);
    border-radius: 16rpx;
    padding: 30rpx;
    border: 2rpx solid #00BB88;

    .custom-input {
      flex: 1;
      color: var(--text-primary);
      font-size: 32rpx;
    }

    .custom-unit {
      color: var(--text-secondary);
      font-size: 28rpx;
    }
  }
}

.input-placeholder {
  color: var(--text-tertiary);
}
</style>
