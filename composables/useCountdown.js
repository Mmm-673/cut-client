/**
 * useCountdown - 通用倒计时/计时 Hook
 *
 * 封装倒计时/正计时逻辑，自动管理定时器生命周期
 * 适用于支付倒计时、服务计时等场景
 *
 * @example
 * const { timeText, start, stop, remainingSeconds } = useCountdown({
 *   initialSeconds: 300,
 *   format: 'mm:ss',
 *   onEnd: () => console.log('倒计时结束'),
 * })
 */
import { ref, computed, onUnmounted } from 'vue'
import { TIME_MS } from '@/constants/time'

export function useCountdown(options = {}) {
  const {
    initialSeconds = 0, // 初始秒数
    direction = 'down', // 'down' 倒计时 / 'up' 正计时
    format = 'mm:ss',   // 输出格式：mm:ss / hh:mm:ss / 自定义
    interval = 1000,    // 间隔毫秒
    autoStart = false,  // 是否自动开始
    onEnd = null,       // 倒计时结束回调
    onTick = null,      // 每秒回调
  } = options

  const seconds = ref(Math.max(0, initialSeconds))
  let timer = null
  let isRunning = false

  /** 格式化秒数为 mm:ss 或 hh:mm:ss */
  function formatSeconds(totalSec, fmt) {
    const total = Math.max(0, Math.floor(totalSec))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(s).padStart(2, '0')

    if (fmt === 'hh:mm:ss' || h > 0) {
      return `${h}:${mm}:${ss}`
    }
    return `${mm}:${ss}`
  }

  const timeText = computed(() => formatSeconds(seconds.value, format))

  const isFinished = computed(() => direction === 'down' && seconds.value <= 0)

  function tick() {
    if (direction === 'down') {
      if (seconds.value <= 0) {
        stop()
        if (onEnd) onEnd()
        return
      }
      seconds.value--
    } else {
      seconds.value++
    }
    if (onTick) onTick(seconds.value)
  }

  /** 开始计时 */
  function start(fromSeconds) {
    if (isRunning) return
    if (fromSeconds !== undefined) {
      seconds.value = Math.max(0, fromSeconds)
    }
    isRunning = true
    timer = setInterval(tick, interval)
  }

  /** 停止计时 */
  function stop() {
    isRunning = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  /** 重置计时 */
  function reset(toSeconds = initialSeconds) {
    stop()
    seconds.value = Math.max(0, toSeconds)
  }

  /** 设置当前秒数 */
  function setSeconds(val) {
    seconds.value = Math.max(0, val)
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    stop()
  })

  // 自动开始
  if (autoStart) {
    start()
  }

  return {
    seconds,
    timeText,
    isFinished,
    isRunning: computed(() => isRunning),
    start,
    stop,
    reset,
    setSeconds,
  }
}

/**
 * 从目标时间戳计算剩余秒数
 * @param {number|string|Date} targetTime - 目标时间戳（毫秒）
 * @returns {number} 剩余秒数
 */
export function calcRemainingSeconds(targetTime) {
  const target = new Date(targetTime).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((target - now) / TIME_MS.SECOND))
}
