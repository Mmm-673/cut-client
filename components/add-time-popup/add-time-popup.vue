<template>
  <view class="add-time-popup-mask" v-if="visible" @click="handleClose">
    <view class="add-time-popup-wrapper" @click.stop>
      <!-- 头部 -->
      <view class="add-time-popup-header">
        <text class="close-btn" @click="handleClose">取消</text>
        <text class="add-time-popup-title">{{ title }}</text>
        <text class="confirm-btn" :class="{ disabled: loading || !canConfirm }" @click="handleConfirm">
          {{ loading ? '处理中...' : '确认' }}
        </text>
      </view>
      <!-- 时长选择 -->
      <view class="add-time-popup-content">
        <view class="add-time-tip">{{ tip }}</view>
        <view class="add-time-limit-tip" v-if="minMinutes > 0">
          最少加{{ minMinutes }}分钟
        </view>
        <view class="add-time-options">
          <view
              v-for="option in options"
              :key="option.value"
              class="add-time-option"
              :class="{ active: selectedValue === option.value || (option.value === 'custom' && showCustomInput) }"
              @click="handleOptionSelect(option)">
            <text class="option-label">{{ option.label }}</text>
          </view>
        </view>
        <!-- 自定义输入框 -->
        <view class="custom-input-wrapper" v-if="showCustomInput">
          <view class="custom-input-row">
            <input
                class="custom-input"
                type="number"
                :value="customValue"
                :placeholder="placeholder"
                placeholder-class="input-placeholder"
                @input="handleCustomInput"
                @blur="handleCustomBlur" />
            <text class="custom-unit">{{ unit }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '选择加钟时长'
  },
  tip: {
    type: String,
    default: '请选择需要延长的服务时长'
  },
  placeholder: {
    type: String,
    default: '最少10分钟'
  },
  unit: {
    type: String,
    default: '分钟'
  },
  minMinutes: {
    type: Number,
    default: 10
  },
  options: {
    type: Array,
    default: () => [
      { label: '30分钟', value: 30 },
      { label: '60分钟', value: 60 },
      { label: '90分钟', value: 90 },
      { label: '自定义', value: 'custom' }
    ]
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm'])

const selectedValue = ref(null)
const showCustomInput = ref(false)
const customValue = ref('')

const canConfirm = computed(() => {
  if (showCustomInput.value) {
    const num = parseInt(customValue.value)
    return !isNaN(num) && num >= props.minMinutes
  }
  return selectedValue.value !== null && selectedValue.value !== 'custom'
})

const finalMinutes = computed(() => {
  if (showCustomInput.value) {
    return parseInt(customValue.value) || 0
  }
  return typeof selectedValue.value === 'number' ? selectedValue.value : 0
})

function handleOptionSelect(option) {
  if (option.value === 'custom') {
    showCustomInput.value = true
    selectedValue.value = 'custom'
  } else {
    showCustomInput.value = false
    selectedValue.value = option.value
    customValue.value = ''
  }
}

function handleCustomInput(e) {
  customValue.value = e.detail.value
}

function handleCustomBlur() {
  const num = parseInt(customValue.value)
  if (!isNaN(num) && num < props.minMinutes) {
    customValue.value = String(props.minMinutes)
  }
}

function handleClose() {
  if (props.loading) return
  emit('close')
}

function handleConfirm() {
  if (props.loading || !canConfirm.value) return
  emit('confirm', {
    minutes: finalMinutes.value
  })
}

// 重置状态
function reset() {
  selectedValue.value = null
  showCustomInput.value = false
  customValue.value = ''
}

// 关闭时重置
watch(() => props.visible, (val) => {
  if (!val) {
    reset()
  }
})

defineExpose({ reset })
</script>

<style lang="scss" scoped>
.add-time-popup-mask {
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

.add-time-popup-wrapper {
  background: var(--bg-card);
  border-radius: 32rpx 32rpx 0 0;
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

.add-time-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 40rpx;
  border-bottom: 1rpx solid var(--border-color);

  .close-btn {
    font-size: 28rpx;
    color: var(--text-tertiary);
  }

  .add-time-popup-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
  }

  .confirm-btn {
    font-size: 28rpx;
    font-weight: 600;
    color: #00BB88;

    &.disabled {
      color: #999;
    }
  }
}

.add-time-popup-content {
  padding: 40rpx;
}

.add-time-tip {
  font-size: 28rpx;
  color: var(--text-primary);
  margin-bottom: 16rpx;
}

.add-time-limit-tip {
  font-size: 24rpx;
  color: var(--text-tertiary);
  margin-bottom: 32rpx;
}

.add-time-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.add-time-option {
  flex: 1;
  min-width: 30%;
  padding: 24rpx 16rpx;
  text-align: center;
  background: var(--bg-secondary);
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.active {
    background: rgba(0, 187, 136, 0.1);
    border-color: #00BB88;
  }

  .option-label {
    font-size: 28rpx;
    color: var(--text-primary);
  }
}

.custom-input-wrapper {
  margin-top: 16rpx;
}

.custom-input-row {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-radius: 16rpx;
  padding: 0 24rpx;

  .custom-input {
    flex: 1;
    height: 80rpx;
    font-size: 28rpx;
    color: var(--text-primary);
  }

  .custom-unit {
    font-size: 28rpx;
    color: var(--text-tertiary);
    margin-left: 16rpx;
  }
}

.input-placeholder {
  color: var(--text-tertiary);
}
</style>
