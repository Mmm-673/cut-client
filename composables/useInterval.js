import { ref, onUnmounted } from 'vue'
// #ifdef VUE3
import { onUnload } from '@dcloudio/uni-app'
// #endif

/**
 * 自动清理的 setInterval 定时器
 *
 * 页面卸载/组件销毁时自动清除，防止内存泄漏。
 * 同时兼容 UniApp 页面生命周期（onUnload）和 Vue 组件生命周期（onUnmounted）。
 *
 * @param {Function} callback - 回调函数
 * @param {number} delay - 间隔（毫秒）
 * @returns {{ start: Function, stop: Function, isRunning: Ref<boolean> }}
 *
 * @example
 * const { start, stop, isRunning } = useInterval(() => {
 *   console.log('tick')
 * }, 1000)
 *
 * start()  // 开始
 * stop()   // 停止
 */
export function useInterval(callback, delay) {
  let timer = null
  const isRunning = ref(false)

  const start = () => {
    if (timer) return
    isRunning.value = true
    timer = setInterval(callback, delay)
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isRunning.value = false
  }

  // 页面卸载时自动清理
  const cleanup = () => stop()

  // #ifdef VUE3
  try { onUnload(cleanup) } catch (e) { /* 非页面上下文忽略 */ }
  // #endif

  try { onUnmounted(cleanup) } catch (e) { /* 非组件上下文忽略 */ }

  return { start, stop, isRunning }
}

/**
 * 自动清理的 setTimeout 定时器
 *
 * @param {Function} callback - 回调函数
 * @param {number} delay - 延迟（毫秒）
 * @returns {{ start: Function, stop: Function }}
 *
 * @example
 * const { start, stop } = useTimeout(() => {
 *   console.log('done')
 * }, 1000)
 *
 * start()  // 启动定时
 * stop()   // 取消定时
 */
export function useTimeout(callback, delay) {
  let timer = null

  const start = () => {
    stop()
    timer = setTimeout(() => {
      timer = null
      callback()
    }, delay)
  }

  const stop = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  // 页面卸载时自动清理
  const cleanup = () => stop()

  // #ifdef VUE3
  try { onUnload(cleanup) } catch (e) { /* 非页面上下文忽略 */ }
  // #endif

  try { onUnmounted(cleanup) } catch (e) { /* 非组件上下文忽略 */ }

  return { start, stop }
}
