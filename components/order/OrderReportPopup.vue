<template>
  <view class="report-popup-mask" v-if="visible" @click="handleClose">
    <view class="report-popup-wrapper" @click.stop>
      <view class="report-popup-header">
        <text class="close-btn" @click="handleClose">取消</text>
        <text class="report-popup-title">报告异常</text>
        <text class="confirm-btn" :class="{ disabled: isSubmitting }" @click="handleSubmit">提交</text>
      </view>
      <view class="report-popup-content">
        <!-- 异常类型选择 -->
        <view class="type-section">
          <text class="section-label">问题类型</text>
          <view class="type-list">
            <view
              v-for="(item, index) in reportTypes"
              :key="index"
              class="type-item"
              :class="{ active: selectedType === (index + 1) }"
              @click="selectedType = index + 1">
              {{ item }}
            </view>
          </view>
        </view>

        <!-- 问题描述 -->
        <view class="reason-section">
          <text class="section-label">问题描述</text>
          <textarea
            class="reason-input"
            v-model="description"
            placeholder="请描述您遇到的问题"
            placeholder-class="input-placeholder"
            :maxlength="maxLength" />
          <text class="char-count">{{ description.length }}/{{ maxLength }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { reportException } from '@/api/billiard/exception'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: [String, Number],
    default: null
  },
  maxLength: {
    type: Number,
    default: 500
  }
})

const emit = defineEmits(['update:visible', 'submit'])

/** 选中的问题类型 (1-4) */
const selectedType = ref(1)
/** 问题描述 */
const description = ref('')
/** 提交中状态 */
const isSubmitting = ref(false)

/** 问题类型列表（与后端 exceptionType 对应：1=用户投诉 2=教练超时 3=系统异常 4=其他） */
const reportTypes = ['服务态度差', '教练迟到', '未提供服务', '其他']

/** 关闭弹窗 */
const handleClose = () => {
  emit('update:visible', false)
}

/** 重置内部状态 */
const resetState = () => {
  selectedType.value = 1
  description.value = ''
  isSubmitting.value = false
}

/** 提交异常报告 */
const handleSubmit = async () => {
  if (isSubmitting.value) return

  if (!description.value.trim()) {
    uni.showToast({ title: '请描述您遇到的问题', icon: 'none' })
    return
  }

  if (!props.orderId) {
    uni.showToast({ title: '订单信息缺失', icon: 'none' })
    return
  }

  isSubmitting.value = true
  uni.showLoading({ title: '提交中...' })

  try {
    await reportException({
      orderId: props.orderId,
      exceptionType: selectedType.value,
      reason: description.value
    })

    uni.hideLoading()
    uni.showToast({ title: '问题已提交，客服会尽快处理', icon: 'success' })

    emit('submit', {
      type: selectedType.value,
      description: description.value
    })
    emit('update:visible', false)
    resetState()
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    })
  } finally {
    isSubmitting.value = false
  }
}

// 弹窗打开时重置状态
watch(() => props.visible, (val) => {
  if (!val) {
    resetState()
  }
})
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
