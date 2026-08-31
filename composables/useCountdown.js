import { ref, computed, watch } from 'vue'
// #ifdef VUE3
import { onUnload } from '@dcloudio/uni-app'
// #endif
import { onUnmounted } from 'vue'

/**
 * 通用倒计时 composable
 *
 * 根据传入的过期时间戳，计算并更新倒计时显示文本。
 * 页面卸载/组件销毁时自动停止，防止内存泄漏。
 * 兼容 UniApp 页面生命周期（onUnload）和 Vue 组件生命周期（onUnmounted）。
 *
 * @param {import('vue').Ref<number>} expireTimeRef - 过期时间戳（毫秒）的响应式引用
 * @param {Object} [options={}] - 配置项
 * @param {Function} [options.onExpire] - 倒计时结束时的回调
 * @param {number} [options.interval=1000] - 更新间隔（毫秒）
 * @returns {{
 *   countdownText: import('vue').Ref<string>,
 *   isRunning: import('vue').Ref<boolean>,
 *   start: Function,
 *   stop: Function
 * }}
 *
 * @example
 * const expireTime = ref(Date.now() + 5 * 60 * 1000)
 * const { countdownText, start, stop } = useCountdown(expireTime, {
 *   onExpire: () => console.log('倒计时结束')
 * })
 * start()
 */
export function useCountdown(expireTimeRef, options = {}) {
  const { onExpire, interval = 1000 } = options

  const countdownText = ref('')
  const isRunning = ref(false)

  let timer = null

  /**
   * 格式化剩余秒数为可读字符串
   * - 小于 1 小时：mm:ss
   * - 大于等于 1 小时：HH:mm:ss
   * @param {number} totalSeconds - 剩余秒数
   * @returns {string}
   */
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')

    if (hours > 0) {
      const hh = String(hours).padStart(2, '0')
      return `${hh}:${mm}:${ss}`
    }
    return `${mm}:${ss}`
  }

  /** 更新倒计时显示 */
  const update = () => {
    const expireTime = expireTimeRef.value
    if (!expireTime) {
      countdownText.value = ''
      return
    }

    const now = Date.now()
    const diff = Math.max(0, expireTime - now)
    const totalSeconds = Math.floor(diff / 1000)

    countdownText.value = formatTime(totalSeconds)

    if (totalSeconds <= 0) {
      stop()
      if (typeof onExpire === 'function') {
        onExpire()
      }
    }
  }

  /** 启动倒计时 */
  const start = () => {
    if (timer) return

    // 立即更新一次
    update()

    // 如果已经过期，直接返回
    if (!countdownText.value) return

    isRunning.value = true
    timer = setInterval(update, interval)
  }

  /** 停止倒计时 */
  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isRunning.value = false
  }

  // 监听过期时间变化，自动重置倒计时
  watch(
    () => expireTimeRef.value,
    () => {
      if (isRunning.value) {
        stop()
        start()
      }
    }
  )

  // 页面卸载/组件销毁时自动清理
  const cleanup = () => stop()

  // #ifdef VUE3
  try { onUnload(cleanup) } catch (e) { /* 非页面上下文忽略 */ }
  // #endif

  try { onUnmounted(cleanup) } catch (e) { /* 非组件上下文忽略 */ }

  return {
    countdownText,
    isRunning,
    start,
    stop
  }
}

export default useCountdown
