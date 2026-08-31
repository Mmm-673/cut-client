import { onUnmounted } from 'vue'
// #ifdef VUE3
import { onUnload } from '@dcloudio/uni-app'
// #endif

/**
 * 自动清理的全局事件监听器
 *
 * 封装 uni.$on / uni.$off，页面卸载/组件销毁时自动取消监听，防止事件泄漏。
 *
 * @param {string} eventName - 事件名称
 * @param {Function} handler - 事件处理函数
 * @returns {{ off: Function }} 取消监听的函数
 *
 * @example
 * const { off } = useGlobalEvent('orderEvaluated', () => {
 *   console.log('订单已评价')
 * })
 *
 * // 手动取消（可选，页面卸载时会自动取消）
 * off()
 */
export function useGlobalEvent(eventName, handler) {
  uni.$on(eventName, handler)

  const cleanup = () => {
    uni.$off(eventName, handler)
  }

  // #ifdef VUE3
  try { onUnload(cleanup) } catch (e) { /* 非页面上下文忽略 */ }
  // #endif

  try { onUnmounted(cleanup) } catch (e) { /* 非组件上下文忽略 */ }

  return { off: cleanup }
}
