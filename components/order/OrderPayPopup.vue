<template>
  <view class="popup-mask" v-if="visible" @click="handleClose">
    <view class="popup-wrapper" @click.stop>
      <!-- 头部 -->
      <view class="popup-header">
        <text class="popup-title">选择支付方式</text>
        <text class="popup-close" @click="handleClose">×</text>
      </view>

      <!-- 内容 -->
      <view class="popup-content">
        <view class="pay-amount-row">
          <text class="pay-label">支付金额</text>
          <text class="pay-amount">¥{{ formattedAmount }}</text>
        </view>

        <!-- 倒计时提示 -->
        <view v-if="showCountdown && countdownText" class="countdown-tip">
          <uni-icons type="clock" size="16" color="#00BB88" />
          <text>请在 {{ countdownText }} 内完成支付</text>
        </view>

        <!-- 支付方式列表 -->
        <view class="pay-method-list" v-if="payList.length > 0">
          <view
            v-for="item in payList"
            :key="item.channelCode || item.value"
            class="pay-method-item"
            :class="{ active: selectedPay === item.value }"
            @click="handleSelect(item.value)"
          >
            <view class="pay-method-left">
              <view
                class="pay-method-icon"
                :style="{
                  background: item.icon && item.icon.startsWith('/') ? 'transparent' : (item.bgColor || 'transparent')
                }"
              >
                <image
                  v-if="item.icon && item.icon.startsWith('/')"
                  :src="item.icon"
                  class="pay-method-icon-img"
                  mode="aspectFit"
                />
                <uni-icons v-else :type="item.icon || 'wallet'" size="20" color="#fff" />
              </view>
              <view class="pay-method-info">
                <text class="pay-method-name">{{ item.label }}</text>
                <text v-if="item.balance !== undefined" class="pay-method-balance">
                  余额 ¥{{ formatBalance(item.balance) }}
                </text>
              </view>
            </view>
            <view class="pay-method-radio">
              <view class="radio-dot" v-if="selectedPay === item.value"></view>
            </view>
          </view>
        </view>

        <view v-else class="pay-empty-tip">暂无可用支付方式，请稍后重试</view>
      </view>

      <!-- 底部按钮 -->
      <view class="popup-footer">
        <button
          class="pay-submit-btn"
          :class="{ disabled: isPaying || !selectedPay }"
          :disabled="isPaying || !selectedPay"
          @click="handleConfirmPay"
        >
          {{ isPaying ? '支付中...' : '确认支付' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  payList: {
    type: Array,
    default: () => []
  },
  selectedPay: {
    type: String,
    default: ''
  },
  payAmount: {
    type: Number,
    default: 0
  },
  countdownText: {
    type: String,
    default: ''
  },
  showCountdown: {
    type: Boolean,
    default: false
  },
  isPaying: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'update:selectedPay', 'confirm-pay', 'close'])

const formattedAmount = computed(() => {
  return (Number(props.payAmount) / 100).toFixed(2)
})

const formatBalance = (balance) => {
  return (Number(balance) / 100).toFixed(2)
}

const handleSelect = (value) => {
  emit('update:selectedPay', value)
}

const handleClose = () => {
  emit('close')
  emit('update:visible', false)
}

const handleConfirmPay = () => {
  if (props.isPaying) return
  if (!props.selectedPay) {
    uni.showToast({
      title: '请选择支付方式',
      icon: 'none'
    })
    return
  }
  emit('confirm-pay', {
    payValue: props.selectedPay,
    payAmount: props.payAmount
  })
}
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

.popup-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid var(--border-color);
  flex-shrink: 0;

  .popup-title {
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 600;
  }

  .popup-close {
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
    color: var(--text-secondary);
    font-size: 40rpx;
    line-height: 1;
    background: var(--border-color);
  }
}

.popup-content {
  flex: 1;
  overflow-y: auto;
  padding: 24rpx 30rpx 0;
  -webkit-overflow-scrolling: touch;
}

.pay-amount-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24rpx;
  margin-bottom: 24rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--border-color);

  .pay-label {
    color: var(--text-secondary);
    font-size: 26rpx;
  }

  .pay-amount {
    color: #00BB88;
    font-size: 44rpx;
    font-weight: 700;
    line-height: 1;
  }
}

.countdown-tip {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx;
  margin-bottom: 24rpx;
  border-radius: 16rpx;
  background: rgba(0, 187, 136, 0.1);
  color: #00BB88;
  font-size: 24rpx;
}

.pay-method-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .pay-method-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 112rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: var(--bg-secondary);
    border: 2rpx solid transparent;
    box-sizing: border-box;

    .pay-method-left {
      display: flex;
      align-items: center;
      gap: 18rpx;
      min-width: 0;
      flex: 1;

      .pay-method-icon {
        width: 72rpx;
        height: 72rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .pay-method-icon-img {
          width: 56rpx;
          height: 56rpx;
        }
      }

      .pay-method-info {
        display: flex;
        flex-direction: column;
        gap: 4rpx;
        flex: 1;
        min-width: 0;

        .pay-method-name {
          color: var(--text-primary);
          font-size: 30rpx;
          font-weight: 500;
        }

        .pay-method-balance {
          color: var(--text-secondary);
          font-size: 24rpx;
        }
      }
    }

    .pay-method-radio {
      width: 40rpx;
      height: 40rpx;
      margin-left: 16rpx;
      border: 3rpx solid #4B5563;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    &.active {
      border-color: rgba(0, 187, 136, 0.9);
      background: rgba(0, 187, 136, 0.14);

      .pay-method-radio {
        border-color: #00BB88;

        .radio-dot {
          width: 20rpx;
          height: 20rpx;
          border-radius: 50%;
          background: #00BB88;
        }
      }
    }
  }
}

.pay-empty-tip {
  padding: 48rpx 24rpx;
  text-align: center;
  color: var(--text-secondary);
  font-size: 28rpx;
}

.popup-footer {
  flex-shrink: 0;
  padding: 24rpx 30rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--border-color);
  background: var(--bg-card);
}

.pay-submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  border: none;
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);

  &::after {
    border: none;
  }

  &.disabled {
    opacity: 0.5;
  }
}
</style>
