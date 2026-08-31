import { ref } from 'vue'
// #ifdef VUE3
import { onUnload } from '@dcloudio/uni-app'
// #endif
import { onUnmounted } from 'vue'
import { useInterval } from './useInterval'

/**
 * 订单状态轮询 + 计时轮询 composable
 *
 * 负责订单详情页的两类轮询：
 * 1. 订单状态轮询（间隔 8 秒）- 检测订单状态变更
 * 2. 计时状态轮询（间隔 10 秒）- 服务进行中的计时数据
 *
 * 终态（50/60/70/80）自动停止轮询。
 * 页面卸载/组件销毁时自动清理所有定时器。
 *
 * @param {Object} options - 配置项
 * @param {import('vue').Ref<string|number>} options.orderId - 订单ID
 * @param {import('vue').Ref<number>} options.orderStatus - 订单状态
 * @param {import('vue').Ref<boolean>} options.isFixedOrder - 是否固定价订单
 * @param {Function} [options.onStatusChange] - 状态变化时回调 (newStatus) => void
 * @param {Function} [options.onTimerUpdate] - 计时数据更新时回调 (timerData) => void
 * @param {Function} options.loadDetail - 加载订单详情的函数 (silent?: boolean) => Promise<void>
 * @param {Function} options.loadTimerStatus - 加载计时状态的函数 () => Promise<void>
 * @returns {{
 *   startPolling: Function,
 *   stopPolling: Function,
 *   startTimerPolling: Function,
 *   stopTimerPolling: Function,
 *   isPolling: import('vue').Ref<boolean>
 * }}
 *
 * @example
 * const { startPolling, stopPolling, startTimerPolling, stopTimerPolling } = useOrderPolling({
 *   orderId, orderStatus, isFixedOrder,
 *   loadDetail: (silent) => loadOrderDetail(silent),
 *   loadTimerStatus: () => loadTimerStatus()
 * })
 */
export function useOrderPolling(options) {
  const {
    orderId,
    orderStatus,
    isFixedOrder,
    onStatusChange,
    onTimerUpdate,
    loadDetail,
    loadTimerStatus
  } = options

  /** 订单状态轮询间隔（毫秒） */
  const POLLING_INTERVAL = 8 * 1000
  /** 计时状态轮询间隔（毫秒） */
  const TIMER_POLLING_INTERVAL = 10 * 1000
  /** 终态状态值 */
  const FINAL_STATUSES = [50, 60, 70, 80]

  /** 上一次状态（用于检测变化） */
  let lastStatus = null
  /** 轮询运行状态 */
  const isPolling = ref(false)

  /** 订单状态轮询定时器 */
  const statusPolling = useInterval(async () => {
    if (!orderId.value) return
    if (typeof loadDetail === 'function') {
      const prevStatus = orderStatus.value
      await loadDetail(true)
      // 检测状态变化
      if (lastStatus !== null && lastStatus !== orderStatus.value) {
        if (typeof onStatusChange === 'function') {
          onStatusChange(orderStatus.value)
        }
      }
      lastStatus = orderStatus.value
    }
  }, POLLING_INTERVAL)

  /** 计时状态轮询定时器 */
  const timerPolling = useInterval(async () => {
    if (orderStatus.value !== 40) return
    if (typeof loadTimerStatus === 'function') {
      await loadTimerStatus()
    }
  }, TIMER_POLLING_INTERVAL)

  /**
   * 判断是否为终态
   * @param {number} status - 订单状态
   * @returns {boolean}
   */
  const isFinalStatus = (status) => FINAL_STATUSES.includes(Number(status))

  /**
   * 启动订单状态轮询
   * 如果已经是终态，则不启动。
   */
  const startPolling = () => {
    if (isFinalStatus(orderStatus.value)) {
      return
    }
    lastStatus = orderStatus.value
    statusPolling.start()
    isPolling.value = true
  }

  /** 停止订单状态轮询 */
  const stopPolling = () => {
    statusPolling.stop()
    isPolling.value = false
  }

  /**
   * 启动计时轮询
   * 仅在进行中状态（40）有效。
   */
  const startTimerPolling = () => {
    if (orderStatus.value !== 40) return
    timerPolling.start()
  }

  /** 停止计时轮询 */
  const stopTimerPolling = () => {
    timerPolling.stop()
  }

  // 页面卸载/组件销毁时自动清理
  const cleanup = () => {
    stopPolling()
    stopTimerPolling()
  }

  // #ifdef VUE3
  try { onUnload(cleanup) } catch (e) { /* 非页面上下文忽略 */ }
  // #endif

  try { onUnmounted(cleanup) } catch (e) { /* 非组件上下文忽略 */ }

  return {
    startPolling,
    stopPolling,
    startTimerPolling,
    stopTimerPolling,
    isPolling
  }
}

export default useOrderPolling
