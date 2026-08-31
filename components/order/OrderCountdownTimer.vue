<template>
  <view class="countdown-timer" :class="['type-' + type]">
    <view v-if="type === 'countdown'" class="time-blocks">
      <view class="time-item">
        <text class="time-num">{{ displayHours }}</text>
        <text class="time-label">小时</text>
      </view>
      <text class="time-colon">:</text>
      <view class="time-item">
        <text class="time-num">{{ displayMinutes }}</text>
        <text class="time-label">分钟</text>
      </view>
      <text class="time-colon">:</text>
      <view class="time-item">
        <text class="time-num">{{ displaySeconds }}</text>
        <text class="time-label">秒</text>
      </view>
    </view>

    <view v-else class="time-text">
      <text class="timer-value">{{ formatTime }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  expireTime: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    default: 'countdown',
    validator: (val) => ['countdown', 'addtime'].includes(val)
  }
})

const emit = defineEmits(['end'])

const remainingSeconds = ref(0)
let timer = null

const displayHours = computed(() => {
  const hours = Math.floor(remainingSeconds.value / 3600)
  return String(hours).padStart(2, '0')
})

const displayMinutes = computed(() => {
  const minutes = Math.floor((remainingSeconds.value % 3600) / 60)
  return String(minutes).padStart(2, '0')
})

const displaySeconds = computed(() => {
  const seconds = remainingSeconds.value % 60
  return String(seconds).padStart(2, '0')
})

// 文字格式：mm:ss 或 HH:mm:ss
const formatTime = computed(() => {
  const total = remainingSeconds.value
  if (total >= 3600) {
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const updateRemaining = () => {
  const now = Date.now()
  const diff = Math.max(0, Math.floor((props.expireTime - now) / 1000))
  remainingSeconds.value = diff

  if (diff <= 0) {
    stopTimer()
    emit('end')
  }
}

const startTimer = () => {
  stopTimer()
  if (!props.expireTime) return

  updateRemaining()
  timer = setInterval(updateRemaining, 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(() => props.expireTime, () => {
  startTimer()
})

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style lang="scss" scoped>
.countdown-timer {
  &.type-countdown {
    .time-blocks {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12rpx;
      padding: 20rpx 0;

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
  }

  &.type-addtime {
    .time-text {
      display: flex;
      align-items: center;
      gap: 8rpx;
      color: #00BB88;
      font-size: 26rpx;
      justify-content: center;
      padding: 16rpx 0;

      .timer-value {
        font-family: monospace;
        font-weight: 600;
      }
    }
  }
}
</style>
