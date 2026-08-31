/**
 * 支付状态轮询器
 * 支持通用轮询（createPoller）和订单支付状态轮询（pollPayStatus）
 */

import { POLL_DEFAULT_MAX_ATTEMPTS, POLL_DEFAULT_INTERVAL, ORDER_POLL_MAX_ATTEMPTS, ORDER_POLL_INTERVAL } from './constants'

/**
 * 创建轮询器
 * @param {Object} options
 * @param {Function} options.fn - 轮询执行的异步函数
 * @param {Function} options.check - 检查是否停止的函数，返回 true 则停止并 resolve
 * @param {number} [options.interval=2500] - 轮询间隔（毫秒）
 * @param {number} [options.maxAttempts=30] - 最大轮询次数
 * @returns {Object} 轮询器对象 { start(), stop(), pause(), resume() }
 */
export function createPoller({ fn, check, interval = POLL_DEFAULT_INTERVAL, maxAttempts = POLL_DEFAULT_MAX_ATTEMPTS }) {
  let timer = null
  let attempts = 0
  let stopped = false
  let paused = false
  let resolvePromise = null
  let rejectPromise = null

  const run = async () => {
    if (stopped || paused) return

    attempts++
    try {
      const result = await fn()

      if (check(result)) {
        stopped = true
        if (resolvePromise) resolvePromise(result)
        return
      }

      if (attempts >= maxAttempts) {
        stopped = true
        if (resolvePromise) resolvePromise(result)
        return
      }

      timer = setTimeout(run, interval)
    } catch (error) {
      stopped = true
      if (rejectPromise) rejectPromise(error)
    }
  }

  return {
    start() {
      return new Promise((resolve, reject) => {
        resolvePromise = resolve
        rejectPromise = reject
        stopped = false
        paused = false
        attempts = 0
        run()
      })
    },
    stop() {
      stopped = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
    pause() {
      paused = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
    resume() {
      if (stopped) return
      paused = false
      run()
    }
  }
}

/**
 * 支付状态轮询（可选，用于确认支付结果）
 * @param {Object} options - 轮询选项
 * @param {number} options.orderId - 订单ID
 * @param {Function} options.checkPayStatus - 检查支付状态的函数
 * @param {number} [options.maxAttempts=10] - 最大轮询次数
 * @param {number} [options.interval=2000] - 轮询间隔（毫秒）
 * @returns {Promise} 支付状态
 */
export function pollPayStatus(options) {
  const { orderId, checkPayStatus, maxAttempts = ORDER_POLL_MAX_ATTEMPTS, interval = ORDER_POLL_INTERVAL } = options

  return new Promise((resolve, reject) => {
    let attempts = 0

    const poll = async () => {
      try {
        attempts++
        const result = await checkPayStatus(orderId)

        if (result.paid) {
          resolve({ paid: true, ...result })
          return
        }

        if (attempts >= maxAttempts) {
          uni.showModal({
            title: '支付结果确认中',
            content: '暂未收到支付结果，请在「我的订单」中查看最新状态，如有疑问请联系客服',
            showCancel: false
          })
          resolve({ paid: false, timeout: true, ...result })
          return
        }

        setTimeout(poll, interval)
      } catch (error) {
        reject(error)
      }
    }

    poll()
  })
}

export default {
  createPoller,
  pollPayStatus,
}
