/**
 * 支付工具库
 * 支持多端支付：微信小程序支付、App微信支付、App支付宝支付、钱包支付
 */

import { isMPWeixin, isApp, isIOS, isAndroid } from '@/utils/platform'
import { submitPayOrder } from '@/api/billiard/order'

/**
 * 支付渠道编码
 */
export const PAY_CHANNEL = {
  // 微信小程序支付
  WX_MINIPROGRAM: 'wx_pub',
  // 微信App支付
  WX_APP: 'wx_app',
  // 支付宝App支付
  ALIPAY_APP: 'alipay_app',
  // 钱包余额支付
  WALLET: 'wallet'
}

/**
 * 获取当前平台可用的支付渠道
 * @returns {Array} 可用的支付渠道列表
 */
export function getAvailablePayChannels() {
  const channels = []

  // 微信小程序环境
  if (isMPWeixin()) {
    channels.push({
      value: 'wechat',
      label: '微信支付',
      channelCode: PAY_CHANNEL.WX_MINIPROGRAM,
      icon: 'chatbubble-filled',
      bgColor: '#07C160'
    })
  }

  // App环境
  if (isApp()) {
    channels.push({
      value: 'wechat',
      label: '微信支付',
      channelCode: PAY_CHANNEL.WX_APP,
      icon: 'chatbubble-filled',
      bgColor: '#07C160'
    })
    channels.push({
      value: 'alipay',
      label: '支付宝',
      channelCode: PAY_CHANNEL.ALIPAY_APP,
      icon: 'chatbubble',
      bgColor: '#1677FF'
    })
  }

  // 所有环境都支持钱包支付
  channels.push({
    value: 'wallet',
    label: '钱包余额',
    channelCode: PAY_CHANNEL.WALLET,
    icon: 'wallet',
    bgColor: '#00BB88'
  })

  return channels
}

/**
 * 根据支付方式值获取渠道编码
 * @param {string} payValue - 支付方式值（wechat/alipay/wallet）
 * @returns {string} 支付渠道编码
 */
export function getChannelCode(payValue) {
  const channels = getAvailablePayChannels()
  const channel = channels.find(c => c.value === payValue)
  return channel ? channel.channelCode : null
}

/**
 * 微信小程序支付
 * @param {Object} payParams - 支付参数
 * @param {string} payParams.timeStamp - 时间戳
 * @param {string} payParams.nonceStr - 随机字符串
 * @param {string} payParams.package - 统一下单接口返回的 prepay_id 参数值
 * @param {string} payParams.signType - 签名方式
 * @param {string} payParams.paySign - 签名
 * @returns {Promise} 支付结果
 */
function wechatMiniProgramPay(payParams) {
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType || 'MD5',
      paySign: payParams.paySign,
      success: (res) => {
        console.log('微信小程序支付成功:', res)
        resolve({ success: true, ...res })
      },
      fail: (err) => {
        console.error('微信小程序支付失败:', err)
        if (err.errMsg && err.errMsg.includes('cancel')) {
          reject({ success: false, canceled: true, message: '支付已取消', ...err })
        } else {
          reject({ success: false, message: err.errMsg || '支付失败', ...err })
        }
      }
    })
  })
}

/**
 * App微信支付
 * @param {Object} payParams - 支付参数
 * @param {string} payParams.appid - 应用ID
 * @param {string} payParams.partnerid - 商户号
 * @param {string} payParams.prepayid - 预支付交易会话ID
 * @param {string} payParams.package - 扩展字段
 * @param {string} payParams.noncestr - 随机字符串
 * @param {string} payParams.timestamp - 时间戳
 * @param {string} payParams.sign - 签名
 * @returns {Promise} 支付结果
 */
function wechatAppPay(payParams) {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    uni.requestPayment({
      provider: 'wxpay',
      orderInfo: {
        appid: payParams.appid,
        partnerid: payParams.partnerid,
        prepayid: payParams.prepayid,
        package: payParams.package,
        noncestr: payParams.noncestr,
        timestamp: payParams.timestamp,
        sign: payParams.sign
      },
      success: (res) => {
        console.log('App微信支付成功:', res)
        resolve({ success: true, ...res })
      },
      fail: (err) => {
        console.error('App微信支付失败:', err)
        if (err.errMsg && err.errMsg.includes('cancel')) {
          reject({ success: false, canceled: true, message: '支付已取消', ...err })
        } else {
          reject({ success: false, message: err.errMsg || '支付失败', ...err })
        }
      }
    })
    // #endif

    // #ifndef APP-PLUS
    reject({ success: false, message: '非App环境不支持微信App支付' })
    // #endif
  })
}

/**
 * App支付宝支付
 * @param {Object} payParams - 支付参数
 * @param {string} payParams.orderString - 支付宝订单信息字符串
 * @returns {Promise} 支付结果
 */
function alipayAppPay(payParams) {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    uni.requestPayment({
      provider: 'alipay',
      orderInfo: payParams.orderString || payParams,
      success: (res) => {
        console.log('App支付宝支付成功:', res)
        resolve({ success: true, ...res })
      },
      fail: (err) => {
        console.error('App支付宝支付失败:', err)
        if (err.errMsg && err.errMsg.includes('cancel')) {
          reject({ success: false, canceled: true, message: '支付已取消', ...err })
        } else {
          reject({ success: false, message: err.errMsg || '支付失败', ...err })
        }
      }
    })
    // #endif

    // #ifndef APP-PLUS
    reject({ success: false, message: '非App环境不支持支付宝支付' })
    // #endif
  })
}

/**
 * 钱包支付
 * @param {Object} payParams - 支付参数
 * @returns {Promise} 支付结果
 */
function walletPay(payParams) {
  // 钱包支付通常直接在后端处理，这里只是模拟
  return new Promise((resolve, reject) => {
    // 钱包支付一般不需要前端调用第三方SDK
    // 直接调用 submitPayOrder 后后端会处理支付
    resolve({ success: true, message: '钱包支付成功' })
  })
}

/**
 * 执行支付
 * @param {Object} options - 支付选项
 * @param {number} options.payOrderId - 支付单ID
 * @param {string} options.payValue - 支付方式值（wechat/alipay/wallet）
 * @param {string} options.orderId - 订单id（
 * @param {Function} [options.onSuccess] - 支付成功回调
 * @param {Function} [options.onCancel] - 支付取消回调
 * @param {Function} [options.onError] - 支付失败回调
 * @returns {Promise} 支付结果
 */
export async function executePayment(options) {
  const { payOrderId, payValue, orderId, onSuccess, onCancel, onError } = options

  try {
    // 1. 获取支付渠道编码
    const channelCode = getChannelCode(payValue)
    if (!channelCode) {
      throw new Error('不支持的支付方式')
    }

    // 2. 调用后端接口提交支付，获取支付参数
    const submitRes = await submitPayOrder({
      payOrderId,
      orderId,
      channelCode
    })

    const payParams = submitRes.data

    // 3. 根据支付方式和平台执行支付
    let payResult

    if (isMPWeixin() && payValue === 'wechat') {
      // 微信小程序支付
      payResult = await wechatMiniProgramPay(payParams)
    } else if (isApp() && payValue === 'wechat') {
      // App微信支付
      payResult = await wechatAppPay(payParams)
    } else if (isApp() && payValue === 'alipay') {
      // App支付宝支付
      payResult = await alipayAppPay(payParams)
    } else if (payValue === 'wallet') {
      // 钱包支付
      payResult = await walletPay(payParams)
    } else {
      throw new Error('不支持的支付方式或平台')
    }

    // 4. 支付成功回调
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess(payResult)
    }

    return payResult
  } catch (error) {
    console.error('支付出错:', error)

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
 * 支付状态轮询（可选，用于确认支付结果）
 * @param {Object} options - 轮询选项
 * @param {number} options.orderId - 订单ID
 * @param {Function} options.checkPayStatus - 检查支付状态的函数
 * @param {number} [options.maxAttempts=10] - 最大轮询次数
 * @param {number} [options.interval=2000] - 轮询间隔（毫秒）
 * @returns {Promise} 支付状态
 */
export function pollPayStatus(options) {
  const { orderId, checkPayStatus, maxAttempts = 10, interval = 2000 } = options

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
  PAY_CHANNEL,
  getAvailablePayChannels,
  getChannelCode,
  executePayment,
  pollPayStatus
}