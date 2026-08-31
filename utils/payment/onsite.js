/**
 * 现场订单支付
 * 包含：现场支付创建、结算状态轮询、现场支付渠道查询
 */

import logger from '@/utils/logger'
import { createOnsitePayment, getOnsitePaymentStatus } from '@/api/billiard/onsitePay'
import { getPayChannelsByEnabled, getAvailablePayChannels, getChannelCode } from './channels'
import { createPoller } from './poller'

/**
 * 执行现场订单支付
 * @description 先创建现场支付尝试，再调用现有 executePayment 执行支付，最后轮询结算状态
 * @param {Object} options - 支付选项
 * @param {number} options.orderId - 现场订单ID
 * @param {string} options.payValue - 支付方式值（wechat / alipay）
 * @param {string} [options.channelCode] - 支付渠道编码，优先使用
 * @param {Function} [options.executePayment] - 支付执行函数（由 index 注入，避免循环依赖）
 * @param {Function} [options.onPaymentSuccess] - 原生支付成功回调（通知页面隐藏支付按钮）
 * @param {Function} [options.onSettlementSuccess] - 结算成功回调
 * @param {Function} [options.onCancel] - 支付取消回调
 * @param {Function} [options.onError] - 支付失败回调
 * @returns {Object} { payResult, poller, paymentData } - 支付结果和轮询器实例
 */
export async function executeOnsitePayment(options) {
  const {
    orderId,
    payValue,
    channelCode,
    executePayment,
    onPaymentSuccess,
    onSettlementSuccess,
    onCancel,
    onError
  } = options

  let poller = null

  try {
    if (!orderId) {
      throw new Error('订单信息缺失')
    }

    // 1. 确定渠道编码
    const finalChannelCode = channelCode || getChannelCode(payValue)
    if (!finalChannelCode) {
      throw new Error('不支持的支付方式')
    }

    // 2. 创建现场支付尝试
    const createRes = await createOnsitePayment({
      orderId,
      channelCode: finalChannelCode
    })
    const paymentData = createRes.data || {}
    const payOrderId = paymentData.payOrderId

    if (!payOrderId) {
      throw new Error('支付单创建失败')
    }

    // 3. 调用支付执行（复用 executePayment）
    const payResult = await executePayment({
      payOrderId,
      payValue,
      channelCode: finalChannelCode,
      orderId,
      onCancel: (err) => {
        if (onCancel && typeof onCancel === 'function') {
          onCancel(err)
        }
      },
      onError: (err) => {
        if (onError && typeof onError === 'function') {
          onError(err)
        }
      }
    })

    // 4. 原生支付成功，通知页面
    if (onPaymentSuccess && typeof onPaymentSuccess === 'function') {
      onPaymentSuccess(paymentData)
    }

    // 5. 启动结算状态轮询
    poller = createPoller({
      fn: () => getOnsitePaymentStatus(orderId).then(res => res.data),
      check: (data) => {
        return data && data.settlementStatus === 20
      }
    })

    poller.start().then((finalStatus) => {
      if (finalStatus && finalStatus.settlementStatus === 20) {
        if (onSettlementSuccess && typeof onSettlementSuccess === 'function') {
          onSettlementSuccess(finalStatus)
        }
      }
    }).catch((err) => {
      logger.error('现场支付结算轮询异常:', err)
    })

    return { payResult, poller, paymentData }
  } catch (error) {
    logger.error('现场支付失败:', error)

    if (error.canceled) {
      throw error
    }

    if (onError && typeof onError === 'function') {
      onError(error)
    }
    throw error
  }
}

/**
 * 获取现场订单可用的支付渠道（仅微信+支付宝App支付+钱包）
 * @param {Array<string>} [enabledCodes] - 后端返回的启用渠道编码
 * @returns {Array} 可用支付渠道列表
 */
export function getOnsitePayChannels(enabledCodes) {
  const onsiteSupported = ['wx_app', 'alipay_app', 'wallet']
  const allChannels = enabledCodes
    ? getPayChannelsByEnabled(enabledCodes)
    : getAvailablePayChannels()
  return allChannels.filter(ch => onsiteSupported.includes(ch.channelCode))
}

export default {
  executeOnsitePayment,
  getOnsitePayChannels,
}
