<template>
  <view class="status-header-wrapper">
    <!-- 空状态 -->
    <view v-if="!orderInfo" class="empty-state">
      <uni-icons type="info" size="120" color="#9CA3AF"></uni-icons>
      <text class="empty-text">订单不存在或已删除</text>
    </view>

    <!-- 状态卡片 -->
    <view v-else class="status-card" :class="'status-' + orderInfo.status">
      <view class="status-header">
        <view class="status-info">
          <text class="status-icon">{{ statusIcon }}</text>
          <view class="status-text-group">
            <text class="status-title">{{ statusText }}</text>
            <text class="status-subtitle">{{ statusSubtitle }}</text>
          </view>
        </view>
        <view class="status-actions">
          <text class="order-no">订单号: {{ orderInfo.orderNo }}</text>
          <view class="report-btn" v-if="orderInfo.status !== 10" @click="handleReport">
            <uni-icons type="chatbubble" size="20" color="#9CA3AF" />
          </view>
        </view>
      </view>

      <!-- 倒计时（状态30：已接单） -->
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
      <view class="countdown-tip" v-if="showCountdown && countdownText">
        <text>{{ countdownText }}</text>
      </view>

      <!-- 服务计时（状态40：进行中） -->
      <view class="service-timer" v-if="showTimer">
        <view class="timer-row">
          <view class="timer-item">
            <text class="timer-label">已服务</text>
            <text class="timer-value">{{ timerText }}</text>
          </view>
          <view class="timer-divider" v-if="timerRemainingText"></view>
          <view class="timer-item" v-if="timerRemainingText">
            <text class="timer-label">剩余</text>
            <text class="timer-value">{{ timerRemainingText }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  orderInfo: {
    type: Object,
    default: null
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
  countdownText: {
    type: String,
    default: ''
  },
  showCountdown: {
    type: Boolean,
    default: false
  },
  showTimer: {
    type: Boolean,
    default: false
  },
  timerText: {
    type: String,
    default: '00:00:00'
  },
  timerRemainingText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['report'])

// 从 countdownText 解析时分秒（格式 HH:MM:SS）
const countdownParts = computed(() => {
  if (!props.countdownText) return { hours: '00', minutes: '00', seconds: '00' }
  const parts = props.countdownText.split(':')
  if (parts.length === 3) {
    return { hours: parts[0], minutes: parts[1], seconds: parts[2] }
  }
  if (parts.length === 2) {
    return { hours: '00', minutes: parts[0], seconds: parts[1] }
  }
  return { hours: '00', minutes: '00', seconds: '00' }
})

const countdownHours = computed(() => countdownParts.value.hours)
const countdownMinutes = computed(() => countdownParts.value.minutes)
const countdownSeconds = computed(() => countdownParts.value.seconds)

const handleReport = () => {
  emit('report')
}
</script>

<style lang="scss" scoped>
.status-header-wrapper {
  width: 100%;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 30rpx;
  box-sizing: border-box;

  .empty-text {
    color: var(--text-secondary);
    font-size: 32rpx;
    margin-top: 30rpx;
  }
}

/* 顶部状态卡片 */
.status-card {
  margin: 0 30rpx 30rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20rpx;
    flex-shrink: 0;
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex: 1;
    min-width: 0;
  }

  .status-icon {
    font-size: 56rpx;
    flex-shrink: 0;
  }

  .status-text-group {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
    flex: 1;
    min-width: 0;
  }

  .status-title {
    color: var(--text-primary);
    font-size: 36rpx;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-subtitle {
    color: var(--text-secondary);
    font-size: 24rpx;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .order-no {
    color: var(--text-secondary);
    font-size: 24rpx;
    white-space: nowrap;
    flex-shrink: 0;
    text-align: right;
  }

  .countdown-timer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 0;
    flex-shrink: 0;

    .time-item {
      width: 100rpx;
      height: 100rpx;
      background: var(--bg-secondary);
      border-radius: 16rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .time-num {
        font-size: 40rpx;
        font-weight: 700;
        color: #00BB88;
        line-height: 1;
      }

      .time-label {
        font-size: 20rpx;
        color: var(--text-secondary);
        margin-top: 6rpx;
        line-height: 1;
      }
    }

    .time-colon {
      font-size: 40rpx;
      color: var(--text-secondary);
      font-weight: bold;
      line-height: 1;
    }
  }

  .countdown-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    color: #00BB88;
    font-size: 26rpx;
  }
}

/* 状态操作栏 */
.status-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.report-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 服务计时器 */
.service-timer {
  margin-top: 20rpx;
  padding: 24rpx;
  background: rgba(0, 187, 136, 0.1);
  border-radius: 16rpx;
}

.timer-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
}

.timer-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.timer-label {
  color: var(--text-secondary);
  font-size: 24rpx;
}

.timer-value {
  color: #00BB88;
  font-size: 40rpx;
  font-weight: 700;
}

.timer-divider {
  width: 2rpx;
  height: 60rpx;
  background: var(--border-color);
}
</style>
