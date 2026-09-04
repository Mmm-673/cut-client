<template>
  <view class="report-popup-mask" v-if="visible" @click="handleClose">
    <view class="report-popup-wrapper" @click.stop>
      <view class="report-popup-header">
        <text class="close-btn" @click="handleClose">取消</text>
        <text class="report-popup-title">{{ title }}</text>
        <text class="confirm-btn" :class="{ disabled: loading }" @click="handleConfirm">
          {{ loading ? '提交中...' : '提交' }}
        </text>
      </view>
      <view class="report-popup-content">
        <!-- 异常类型选择 -->
        <view class="type-section">
          <text class="section-label">问题类型</text>
          <view class="type-list">
            <view
              v-for="type in typeOptions"
              :key="type.value"
              class="type-item"
              :class="{ active: selectedType === type.value }"
              @click="selectedType = type.value">
              {{ type.label }}
            </view>
          </view>
        </view>

        <!-- 问题描述 -->
        <view class="reason-section">
          <text class="section-label">问题描述</text>
          <textarea
            class="reason-input"
            v-model="reasonText"
            :placeholder="placeholder"
            placeholder-class="input-placeholder"
            :maxlength="maxLength" />
          <text class="char-count">{{ reasonText.length }}/{{ maxLength }}</text>
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
  title: {
    type: String,
    default: '报告异常'
  },
  placeholder: {
    type: String,
    default: '请描述您遇到的问题（最多500字）'
  },
  maxLength: {
    type: Number,
    default: 500
  },
  typeOptions: {
    type: Array,
    default: () => [
      { label: '用户投诉', value: 1 },
      { label: '教练超时', value: 2 },
      { label: '系统异常', value: 3 },
      { label: '其他', value: 4 }
    ]
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm'])

const selectedType = ref(1)
const reasonText = ref('')

function handleClose() {
  if (props.loading) return
  emit('close')
}

function handleConfirm() {
  if (props.loading) return
  if (!reasonText.value.trim()) {
    uni.showToast({ title: '请描述您遇到的问题', icon: 'none' })
    return
  }
  emit('confirm', {
    type: selectedType.value,
    reason: reasonText.value
  })
}

function reset() {
  selectedType.value = 1
  reasonText.value = ''
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
.report-popup-mask {
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

.report-popup-wrapper {
  background: var(--bg-card);
  border-radius: 32rpx 32rpx 0 0;
  animation: slideUp 0.3s ease;
  max-height: 80vh;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.report-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid var(--border-color);

  .close-btn {
    color: var(--text-secondary);
    font-size: 30rpx;
  }

  .report-popup-title {
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

.report-popup-content {
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  padding-bottom: calc(30rpx + constant(safe-area-inset-bottom));
}

.type-section {
  margin-bottom: 40rpx;
}

.section-label {
  color: var(--text-primary);
  font-size: 28rpx;
  font-weight: 500;
  display: block;
  margin-bottom: 20rpx;
}

.type-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.type-item {
  background: var(--bg-secondary);
  border-radius: 12rpx;
  padding: 24rpx 16rpx;
  text-align: center;
  color: var(--text-secondary);
  font-size: 26rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.active {
    background: rgba(0, 187, 136, 0.1);
    border-color: #00BB88;
    color: #00BB88;
  }
}

.reason-section {
  position: relative;
}

.reason-input {
  width: 100%;
  min-height: 200rpx;
  background: var(--bg-secondary);
  border-radius: 16rpx;
  padding: 24rpx;
  color: var(--text-primary);
  font-size: 28rpx;
  line-height: 1.6;
  box-sizing: border-box;
}

.input-placeholder {
  color: var(--text-tertiary);
}

.char-count {
  position: absolute;
  right: 16rpx;
  bottom: 16rpx;
  color: var(--text-tertiary);
  font-size: 22rpx;
}
</style>
