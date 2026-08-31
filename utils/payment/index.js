/**
 * 支付工具库 - 主入口
 * 支持多端支付：微信小程序支付、App微信支付、App支付宝支付、钱包支付
 *
 * 模块结构：
 * - constants.js   常量（支付渠道、状态、超时时间）
 * - guard.js       防重复提交逻辑
 * - channels.js    各平台支付函数、渠道列表管理
 * - poller.js      支付状态轮询器
 * - onsite.js      现场订单支付
 * - index.js       主入口，编排 executePayment
 */

import logger from '@/utils/logger'
import { submitPayOrder, getEnableChannelCodeList, getPayOrder } from '@/api/billiard/pay'
import { TIME_FIVE_MINUTES } from '@/utils/constants'

import { PAY_CHANNEL, PAY_REQUEST_STATUS, PAY_SUCCESS_STATUS } from './constants'
import { checkPayRequestState, setPayRequestState } from './guard'
import {
  getAvailablePayChannels,
  getPayChannelsByEnabled,
  getChannelCode,
  invokePaymentSDK,
} from './channels'

// #ifdef MP-WEIXIN
import { getWxCodeAndBind } from './channels'
// #endif

import { pollPayStatus, createPoller } from './poller'
import { executeOnsitePayment as onsitePaymentExecutor, getOnsitePayChannels } from './onsite'

/**
 * 钱包支付流程说明：
 * 钱包支付不需要前端调用第三方支付 SDK，由后端直接扣款完成。
 * 完整流程：
 * 1. 调用 submitPayOrder 提交支付订单（支付渠道为 wallet）
 * 2. 后端收到请求后直接从用户钱包扣款
 * 3. 前端通过 confirmPayOrderPaid 轮询确认支付状态
 * 因此前端没有独立的 walletPay 函数。
 */

/**
 * 判断支付状态是否为成功
 * @param {number|string} status - 支付状态码
 * @returns {boolean}
 */
function isPaySuccessStatus(status) {
  return Number(status) === PAY_SUCCESS_STATUS
}

/**
 * 确认支付单是否已支付
 * @param {number|string} payOrderId - 支付单ID
 * @returns {Promise<Object>} 支付结果
 * @throws {Error} 支付结果待确认时抛出带 pending 标记的错误
 */
async function confirmPayOrderPaid(payOrderId) {
  const res = await getPayOrder({ id: payOrderId, sync: true })
  const data = res.data || {}
  const status = data.status ?? data.payStatus

  if (isPaySuccessStatus(status)) {
    return { success: true, status, payOrder: data }
  }

  const pendingError = new Error('支付结果确认中，请稍后在订单中查看')
  pendingError.pending = true
  pendingError.status = status
  pendingError.payOrder = data
  throw pendingError
}

/**
 * 从后端获取启用的支付渠道列表
 * @param {number} appId - 支付应用编号，默认10
 * @returns {Promise<Array>} 启用的支付渠道列表
 */
export async function fetchEnabledChannels(appId = 10) {
  try {
    const res = await getEnableChannelCodeList({ appId })
    const enabledCodes = res.data || []
    return getPayChannelsByEnabled(enabledCodes)
  } catch (error) {
    logger.error('获取支付渠道失败:', error)
    // 失败时返回本地可用渠道
    return getAvailablePayChannels()
  }
}

/**
 * 执行支付
 * @param {Object} options - 支付选项
 * @param {number} options.payOrderId - 支付单ID
 * @param {string} options.payValue - 支付方式值（wechat/alipay/wallet）
 * @param {string} [options.channelCode] - 支付渠道编码，优先使用后端返回的渠道编码
 * @param {string} options.orderId - 订单id
 * @param {Function} [options.onSuccess] - 支付成功回调
 * @param {Function} [options.onCancel] - 支付取消回调
 * @param {Function} [options.onError] - 支付失败回调
 * @returns {Promise} 支付结果
 */
export async function executePayment(options) {
  const { payOrderId, payValue, channelCode: selectedChannelCode, orderId, onSuccess, onCancel, onError } = options

  logger.debug('executePayment 调用参数:', options)

  // 提前定义 channelCode，确保在 catch 块中可用
  let channelCode = selectedChannelCode || getChannelCode(payValue)

  try {
    if (payOrderId === null || payOrderId === undefined || payOrderId === '') {
      throw new Error('支付订单信息缺失')
    }

    logger.debug('支付渠道编码:', channelCode)
    if (!channelCode) {
      throw new Error('不支持的支付方式')
    }

    // 1. 检查支付请求状态，防止重复提交
    const currentState = checkPayRequestState(payOrderId, channelCode)
    const now = Date.now()

    // 如果是 pending 状态且未超时（5分钟内），阻止重复提交
    // 支付全流程（提交订单 + 拉起支付 SDK + 确认结果）都应在 pending 保护期内
    if (
      currentState &&
      currentState.status === PAY_REQUEST_STATUS.PENDING &&
      (now - currentState.timestamp < TIME_FIVE_MINUTES)
    ) {
      throw new Error('支付请求处理中，请稍后再试')
    }

    // 如果是 timeout 状态且未超过冷却期（30秒），优先查单确认
    if (
      currentState &&
      currentState.status === PAY_REQUEST_STATUS.TIMEOUT
    ) {
      try {
        logger.debug('支付超时，优先查单确认')
        const payResult = await confirmPayOrderPaid(payOrderId)
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(payResult)
        }
        setPayRequestState(payOrderId, channelCode, PAY_REQUEST_STATUS.SUCCESS)
        return payResult
      } catch (error) {
        logger.debug('查单未确认支付成功，继续支付流程')
      }
    }

    // 设置支付请求状态为 pending
    setPayRequestState(payOrderId, channelCode, PAY_REQUEST_STATUS.PENDING)

    // 2. 调用后端接口提交支付，获取支付参数
    const submitRes = await submitPayOrder({
      id: payOrderId,
      channelCode: channelCode,
      displayMode: payValue === 'alipay' ? 'app' : undefined // 支付宝支付添加 displayMode: 'app'
    })

    const resultData = submitRes.data || {}
    const payStatus = resultData.status
    const displayContent = resultData.displayContent

    // 3. 如果是钱包支付，后端直接处理完成
    if (payValue === 'wallet') {
      if (isPaySuccessStatus(payStatus)) {
        const payResult = { success: true, status: payStatus }
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(payResult)
        }
        return payResult
      }

      const confirmedResult = await confirmPayOrderPaid(payOrderId)
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(confirmedResult)
      }
      return confirmedResult
    }

    // 4. 解析支付参数 - displayContent 是 JSON 字符串
    let payParams
    try {
      payParams = typeof displayContent === 'string' ? JSON.parse(displayContent) : displayContent
    } catch (e) {
      payParams = displayContent
    }
    logger.debug("🚀 ~ executePayment ~ payParams:", payParams)

    // 5. 根据支付方式和平台执行支付 SDK 调用
    await invokePaymentSDK(payValue, payParams)

    // 6. 后端确认支付状态后再回调成功
    const payResult = await confirmPayOrderPaid(payOrderId)
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess(payResult)
    }

    return payResult
  } catch (error) {
    logger.debug("🚀 ~ error ~ error:", error)
    // #ifdef MP-WEIXIN
    if (error === '请先绑定微信后再发起微信支付') {
      return new Promise((resolve, reject) => {
        uni.showModal({
          title: '提示',
          content: '需要绑定微信后才能继续支付，是否立即绑定？',
          success: (modalRes) => {
            if (modalRes.confirm) {
              getWxCodeAndBind().then(resolve).catch(reject)
            } else {
              reject(error)
            }
          },
          fail: () => {
            reject(error)
          }
        })
      })
    }
    // #endif
    logger.error('支付出错:', error)

    // 更新支付请求状态
    if (error.message && error.message.includes('timeout')) {
      setPayRequestState(payOrderId, channelCode, PAY_REQUEST_STATUS.TIMEOUT)
    } else if (error.canceled) {
      // 支付取消不更新状态，允许重新尝试
    } else {
      setPayRequestState(payOrderId, channelCode, PAY_REQUEST_STATUS.FAILED)
    }

    // 处理支付取消
    if (error.canceled) {
      if (onCancel && typeof onCancel === 'function') {
        onCancel(error)
      }
      throw error
    }

    // 处理支付失败
    if (onError && typeof onError === 'function') {
      onError(error)
    }
    throw error
  }
}

/**
 * 执行现场订单支付
 * 包装 onsite.js 中的 executeOnsitePayment，注入 executePayment 避免循环依赖
 */
export async function executeOnsitePayment(options) {
  return onsitePaymentExecutor({
    ...options,
    executePayment,
  })
}

// 导出所有公共 API
// 注：fetchEnabledChannels、executePayment、executeOnsitePayment 已在函数声明时直接 export
export {
  PAY_CHANNEL,
  PAY_REQUEST_STATUS,
  PAY_SUCCESS_STATUS,
  getAvailablePayChannels,
  getPayChannelsByEnabled,
  getChannelCode,
  pollPayStatus,
  createPoller,
  getOnsitePayChannels,
}

export default {
  PAY_CHANNEL,
  getAvailablePayChannels,
  getPayChannelsByEnabled,
  fetchEnabledChannels,
  getChannelCode,
  executePayment,
  pollPayStatus,
  executeOnsitePayment,
  getOnsitePayChannels,
  createPoller,
}
