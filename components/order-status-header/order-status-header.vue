<template>
  <view class="order-status-header" :class="'status-' + status">
    <view class="status-header">
      <view class="status-info">
        <text class="status-icon">{{ statusIcon }}</text>
        <view class="status-text-group">
          <text class="status-title">{{ statusText }}</text>
          <text class="status-subtitle">{{ statusSubtitle }}</text>
        </view>
      </view>
      <view class="status-actions">
        <text class="order-no" v-if="orderNo">订单号: {{ orderNo }}</text>
        <view class="report-btn" v-if="showReport" @click.stop="handleReport">
          <uni-icons type="chatbubble" size="20" color="#9CA3AF" />
        </view>
      </view>
    </view>

    <!-- 倒计时（已接单状态） -->
    <view class="countdown-timer" v-if="showCountdown">
      <view class="time-item">
        <text class="time-num">{{ countdownHours }}</text>
        <text class="time-label">小时</text>
      </view>
      <text class="time-colon">:</text>
      <view class="time-item">
        <text class="time-num">{{ countdownMinutes }}</text>
        <text class="time-label">分钟</text>
      </view>
      <text class="time-colon">:</text>
      <view class="time-item">
        <text class="time-num">{{ countdownSeconds }}</text>
        <text class="time-label">秒</text>
      </view>
    </view>

    <!-- 服务计时器（进行中状态） -->
    <view class="service-timer" v-if="showServiceTimer">
      <!-- 固定价：只展示已服务时长 -->
      <view class="timer-row fixed" v-if="isFixed">
        <view class="timer-item">
          <text class="timer-label">已服务</text>
          <text class="timer-value">{{ formatSeconds(elapsedSeconds) }}</text>
        </view>
      </view>
      <!-- 小时价：已服务 + 剩余 -->
      <view class="timer-row" v-else>
        <view class="timer-item">
          <text class="timer-label">已服务</text>
          <text class="timer-value">{{ formatSeconds(elapsedSeconds) }}</text>
        </view>
        <view class="timer-divider"></view>
        <view class="timer-item">
          <text class="timer-label">剩余</text>
          <text class="timer-value">{{ formatSeconds(remainingSeconds) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: [Number, String],
    default: 0
  },
  statusText: {
    type: String,
    default: ''
  },
  statusSubtitle: {
    type: String,
    default: ''
  },
  statusIcon: {
    type: String,
    default: '📋'
  },
  orderNo: {
    type: String,
    default: ''
  },
  showReport: {
    type: Boolean,
    default: false
  },
  showCountdown: {
    type: Boolean,
    default: false
  },
  showServiceTimer: {
    type: Boolean,
    default: false
  },
  isFixed: {
    type: Boolean,
    default: false
  },
  countdownHours: {
    type: String,
    default: '00'
  },
  countdownMinutes: {
    type: String,
    default: '00'
  },
  countdownSeconds: {
    type: String,
    default: '00'
  },
  elapsedSeconds: {
    type: Number,
    default: 0
  },
  remainingSeconds: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['report'])

const formatSeconds = (seconds) => {
  if (!seconds || seconds < 0) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0')
  ].join(':')
}

const handleReport = () => {
  emit('report')
}
</script>

<style lang="scss" scoped>
.order-status-header {
  padding: 40rpx 30rpx;
  margin-bottom: 24rpx;
  border-radius: 0 0 32rpx 32rpx;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%);
  color: #fff;

  &.status-pending_payment {
    background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
  }
  &.status-pending_accept {
    background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
  }
  &.status-accepted {
    background: linear-gradient(135deg, #007aff 0%, #0051d5 100%);
  }
  &.status-in_service {
    background: linear-gradient(135deg, #34c759 0%, #28a745 100%);
  }
  &.status-completed {
    background: linear-gradient(135deg, #8e8e93 0%, #636366 100%);
  }
  &.status-cancelled {
    background: linear-gradient(135deg, #8e8e93 0%, #636366 100%);
  }

  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .status-info {
      display: flex;
      align-items: center;
      gap: 20rpx;

      .status-icon {
        font-size: 48rpx;
      }

      .status-text-group {
        .status-title {
          font-size: 36rpx;
          font-weight: 700;
          display: block;
          margin-bottom: 6rpx;
        }
        .status-subtitle {
          font-size: 24rpx;
          opacity: 0.8;
        }
      }
    }

    .status-actions {
      text-align: right;

      .order-no {
        font-size: 22rpx;
        opacity: 0.7;
        display: block;
        margin-bottom: 12rpx;
      }

      .report-btn {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
      }
    }
  }

  .countdown-timer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    margin-top: 32rpx;
    padding: 24rpx 0;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 16rpx;

    .time-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .time-num {
        font-size: 40rpx;
        font-weight: 700;
        font-family: monospace;
      }
      .time-label {
        font-size: 20rpx;
        opacity: 0.8;
        margin-top: 4rpx;
      }
    }

    .time-colon {
      font-size: 36rpx;
      font-weight: 700;
      margin-top: -16rpx;
    }
  }

  .service-timer {
    margin-top: 24rpx;
    padding: 24rpx;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 16rpx;

    .timer-row {
      display: flex;
      align-items: center;
      justify-content: space-around;

      &.fixed {
        justify-content: center;
      }

      .timer-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8rpx;

        .timer-label {
          font-size: 24rpx;
          opacity: 0.8;
        }
        .timer-value {
          font-size: 40rpx;
          font-weight: 700;
          font-family: monospace;
        }
      }

      .timer-divider {
        width: 2rpx;
        height: 60rpx;
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}
</style>
