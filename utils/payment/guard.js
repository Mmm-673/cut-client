/**
 * 支付请求防重复提交（状态管理）
 */

import { TIME_FIVE_MINUTES, TIME_ONE_DAY } from '@/utils/constants'
import { PAY_REQUEST_STATUS, PAY_REQUEST_COOLDOWN } from './constants'

// 支付请求状态管理，用于防止重复提交
const payRequestStates = new Map()

/**
 * 检查支付请求状态
 * @param {number|string} payOrderId - 支付单ID
 * @param {string} channelCode - 支付渠道编码
 * @returns {Object|null} 状态对象
 */
export function checkPayRequestState(payOrderId, channelCode) {
  const key = `${payOrderId}_${channelCode}`
  return payRequestStates.get(key)
}

/**
 * 设置支付请求状态
 * @param {number|string} payOrderId - 支付单ID
 * @param {string} channelCode - 支付渠道编码
 * @param {string} status - 状态值（PAY_REQUEST_STATUS）
 */
export function setPayRequestState(payOrderId, channelCode, status) {
  const key = `${payOrderId}_${channelCode}`
  payRequestStates.set(key, {
    status,
    timestamp: Date.now()
  })

  // 清理过期的状态（24小时后自动清理）
  const expiredKeys = []
  const now = Date.now()
  payRequestStates.forEach((value, k) => {
    if (now - value.timestamp > TIME_ONE_DAY) {
      expiredKeys.push(k)
    }
  })
  expiredKeys.forEach(key => payRequestStates.delete(key))
}

/**
 * 检查是否可以发起新的支付请求（防重复提交）
 * @param {number|string} payOrderId - 支付单ID
 * @param {string} channelCode - 支付渠道编码
 * @returns {{ canProceed: boolean, currentState: Object|null }}
 */
export function checkCanProceed(payOrderId, channelCode) {
  const currentState = checkPayRequestState(payOrderId, channelCode)
  const now = Date.now()

  // 如果是 pending 状态且未超时（5分钟内），阻止重复提交
  if (
    currentState &&
    currentState.status === PAY_REQUEST_STATUS.PENDING &&
    (now - currentState.timestamp < TIME_FIVE_MINUTES)
  ) {
    return { canProceed: false, currentState }
  }

  // 如果是 timeout 状态且未超过冷却期（30秒），处于冷却中
  if (
    currentState &&
    currentState.status === PAY_REQUEST_STATUS.TIMEOUT &&
    (now - currentState.timestamp < PAY_REQUEST_COOLDOWN)
  ) {
    return { canProceed: false, currentState, isCoolingDown: true }
  }

  return { canProceed: true, currentState }
}

/**
 * 设置为 pending 状态（支付开始时调用）
 */
export function markPending(payOrderId, channelCode) {
  setPayRequestState(payOrderId, channelCode, PAY_REQUEST_STATUS.PENDING)
}

/**
 * 设置为 timeout 状态（支付超时时调用）
 */
export function markTimeout(payOrderId, channelCode) {
  setPayRequestState(payOrderId, channelCode, PAY_REQUEST_STATUS.TIMEOUT)
}

/**
 * 设置为 failed 状态（支付失败时调用）
 */
export function markFailed(payOrderId, channelCode) {
  setPayRequestState(payOrderId, channelCode, PAY_REQUEST_STATUS.FAILED)
}

/**
 * 设置为 success 状态（支付成功时调用）
 */
export function markSuccess(payOrderId, channelCode) {
  setPayRequestState(payOrderId, channelCode, PAY_REQUEST_STATUS.SUCCESS)
}
