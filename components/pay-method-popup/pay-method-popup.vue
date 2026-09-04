<template>
  <view class="pay-popup-mask" v-if="visible" @click="handleClose">
    <view class="pay-popup-wrapper" @click.stop>
      <!-- 头部 -->
      <view class="pay-popup-header">
        <text class="pay-popup-title">{{ title }}</text>
        <text class="pay-popup-close" @click="handleClose">×</text>
      </view>

      <view class="pay-popup-content">
        <!-- 支付金额 -->
        <view class="pay-amount-row">
          <text class="pay-label">支付金额</text>
          <text class="pay-amount">¥{{ displayAmount }}</text>
        </view>

        <!-- 倒计时提示 -->
        <view v-if="showCountdown && countdownText" class="pay-countdown-tip">
          <uni-icons type="clock" size="16" color="#00BB88" />
          <text>请在 {{ countdownText }} 内完成支付</text>
        </view>

        <!-- 过期提示 -->
        <view v-if="isExpired" class="pay-expire-tip">
          <uni-icons type="info" size="16" color="#F59E0B" />
          <text>{{ expiredText }}</text>
        </view>

        <!-- 支付方式列表 -->
        <view class="pay-method-list" v-if="payList.length > 0">
          <view
            v-for="item in payList"
            :key="item.channelCode || item.value"
            class="pay-method-item"
            :class="{ active: selectedValue === item.value }"
            @click="handleSelect(item.value)">
            <view class="pay-method-left">
              <view class="pay-method-icon" :style="iconStyle(item)">
                <image v-if="item.icon && item.icon.startsWith('/')" :src="item.icon" class="pay-method-icon-img" mode="aspectFit" />
                <uni-icons v-else :type="item.icon" size="20" color="#fff" />
              </view>
              <text class="pay-method-name">{{ item.label }}</text>
            </view>
            <view class="pay-method-radio">
              <view class="radio-dot" v-if="selectedValue === item.value"></view>
            </view>
          </view>
        </view>
        <view v-else class="pay-empty-tip">暂无可用支付方式，请稍后重试</view>
      </view>

      <!-- 底部按钮 -->
      <view class="pay-popup-footer">
        <button
          class="pay-submit-btn"
          :class="{ disabled: !canSubmit }"
          :disabled="!canSubmit"
          @click="handleSubmit">
          {{ submitText }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { formatAmount } from '@/utils/format'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '选择支付方式'
  },
  amount: {
    type: [Number, String],
    default: 0
  },
  payList: {
    type: Array,
    default: () => []
  },
  selectedValue: {
    type: [String, Number],
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  showCountdown: {
    type: Boolean,
    default: false
  },
  countdownText: {
    type: String,
    default: ''
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  expiredText: {
    type: String,
    default: '该订单已过期，请重新发起'
  },
  submitText: {
    type: String,
    default: '确认支付'
  }
})

const emit = defineEmits(['close', 'select', 'submit'])

const displayAmount = computed(() => {
  return formatAmount(props.amount)
})

const canSubmit = computed(() => {
  if (props.loading) return false
  if (props.isExpired) return false
  if (!props.selectedValue) return false
  if (props.payList.length === 0) return false
  return true
})

function iconStyle(item) {
  if (item.icon && item.icon.startsWith('/')) {
    return { background: 'transparent' }
  }
  return { background: item.bgColor || '#00BB88' }
}

function handleClose() {
  if (props.loading) return
  emit('close')
}

function handleSelect(value) {
  emit('select', value)
}

function handleSubmit() {
  if (!canSubmit.value) return
  emit('submit')
}
</script>

<style lang="scss" scoped>
.pay-popup-mask {
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

.pay-popup-wrapper {
  background: var(--bg-card);
  border-radius: 32rpx 32rpx 0 0;
  animation: slideUp 0.3s ease;
  max-height: 78vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.pay-popup-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid var(--border-color);
  flex-shrink: 0;

  .pay-popup-title {
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 600;
  }

  .pay-popup-close {
    position: absolute;
    right: 30rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    color: var(--text-tertiary);
  }
}

.pay-popup-content {
  flex: 1;
  overflow-y: auto;
  padding: 30rpx;
}

.pay-amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0 30rpx;
  border-bottom: 1rpx solid var(--border-color);
  margin-bottom: 20rpx;

  .pay-label {
    font-size: 28rpx;
    color: var(--text-secondary);
  }

  .pay-amount {
    font-size: 40rpx;
    font-weight: 700;
    color: #FF6B35;
  }
}

.pay-countdown-tip {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 24rpx;
  background: rgba(0, 187, 136, 0.1);
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  font-size: 24rpx;
  color: #00BB88;
}

.pay-expire-tip {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 24rpx;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  font-size: 24rpx;
  color: #F59E0B;
}

.pay-method-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.pay-method-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: var(--bg-secondary);
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.active {
    border-color: #00BB88;
    background: rgba(0, 187, 136, 0.05);
  }

  .pay-method-left {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  .pay-method-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .pay-method-icon-img {
      width: 100%;
      height: 100%;
      border-radius: 16rpx;
    }
  }

  .pay-method-name {
    font-size: 28rpx;
    color: var(--text-primary);
    font-weight: 500;
  }

  .pay-method-radio {
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    border: 2rpx solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;

    .radio-dot {
      width: 20rpx;
      height: 20rpx;
      border-radius: 50%;
      background: #00BB88;
    }
  }
}

.pay-empty-tip {
  text-align: center;
  padding: 60rpx 0;
  font-size: 26rpx;
  color: var(--text-tertiary);
}

.pay-popup-footer {
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--border-color);
  flex-shrink: 0;

  .pay-submit-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: linear-gradient(135deg, #00BB88 0%, #00a87a 100%);
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    border-radius: 44rpx;
    border: none;

    &.disabled {
      opacity: 0.5;
    }

    &::after {
      border: none;
    }
  }
}
</style>
