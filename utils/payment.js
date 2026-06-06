/**
 * 支付工具库
 * 支持多端支付：微信小程序支付、App微信支付、App支付宝支付、钱包支付
 */

import { isMPWeixin, isApp } from '@/utils/platform'
import { submitPayOrder, getEnableChannelCodeList, getPayOrder } from '@/api/billiard/pay'

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
 * 所有可用的支付渠道配置
 */
const ALL_PAY_CHANNELS = [
  {
    value: 'wechat',
    label: '微信支付',
    channelCode: PAY_CHANNEL.WX_MINIPROGRAM, // 默认用JSAPI，App会覆盖
    icon: '/static/images/pay/wechat.png',
    bgColor: '#07C160',
    platforms: ['mp-weixin', 'app-plus']
  },
  {
    value: 'alipay',
    label: '支付宝',
    channelCode: PAY_CHANNEL.ALIPAY_APP,
    icon: '/static/images/pay/alipay.png',
    bgColor: '#1677FF',
    platforms: ['app-plus']
  },
  {
    value: 'wallet',
    label: '钱包余额',
    channelCode: PAY_CHANNEL.WALLET,
    icon: 'wallet',
    bgColor: '#00BB88',
    platforms: ['mp-weixin', 'app-plus', 'h5']
  }
]

/**
 * 获取当前平台可用的支付渠道（仅本地判断，不查询后端）
 * @returns {Array} 可用的支付渠道列表
 */
export function getAvailablePayChannels() {
  const currentPlatform = getCurrentPlatform()
  return ALL_PAY_CHANNELS
    .filter(channel => channel.platforms.includes(currentPlatform))
    .map(channel => ({
      ...channel,
      channelCode: resolvePlatformChannelCode(channel.value)
    }))
}

function resolvePlatformChannelCode(payValue) {
  if (payValue === 'wechat' && getCurrentPlatform() === 'app-plus') {
    return PAY_CHANNEL.WX_APP
  }

  const channel = ALL_PAY_CHANNELS.find(item => item.value === payValue)
  return channel ? channel.channelCode : null
}

/**
 * 获取当前运行平台
 * @returns {string} 平台标识
 */
function getCurrentPlatform() {
  // #ifdef MP-WEIXIN
  return 'mp-weixin'
  // #endif

  // #ifdef APP-PLUS
  return 'app-plus'
  // #endif

  // #ifdef H5
  return 'h5'
  // #endif

  return 'h5'
}

/**
 * 根据后端返回的启用渠道列表，获取可用的支付渠道
 * @param {Array<string>} enabledCodes - 后端返回的启用渠道编码列表
 * @returns {Array} 可用的支付渠道列表
 */
export function getPayChannelsByEnabled(enabledCodes) {
  if (!enabledCodes || !Array.isArray(enabledCodes)) {
    return getAvailablePayChannels()
  }

  const currentPlatform = getCurrentPlatform()

  // 渠道编码映射
  const codeToChannel = {
    'wx_pub': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: 'wx_pub', platforms: ['mp-weixin'] },
    'wx_lite': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: 'wx_lite', platforms: ['mp-weixin'] },
    'wx_app': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: PAY_CHANNEL.WX_APP, platforms: ['app-plus'] },
    'alipay_app': { value: 'alipay', label: '支付宝', icon: '/static/images/pay/alipay.png', bgColor: '#1677FF', channelCode: PAY_CHANNEL.ALIPAY_APP, platforms: ['app-plus'] },
    'wallet': { value: 'wallet', label: '钱包余额', icon: 'wallet', bgColor: '#00BB88', channelCode: PAY_CHANNEL.WALLET, platforms: ['mp-weixin', 'app-plus', 'h5'] }
  }

  const result = []

  // 遍历后端返回的渠道
  enabledCodes.forEach(code => {
    const channel = codeToChannel[code]
    if (channel && channel.platforms && channel.platforms.includes(currentPlatform)) {
      result.push(channel)
    }
  })

  return result
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
    console.error('获取支付渠道失败:', error)
    // 失败时返回本地可用渠道
    return getAvailablePayChannels()
  }
}

/**
 * 根据支付方式值获取渠道编码
 * @param {string} payValue - 支付方式值（wechat/alipay/wallet）
 * @returns {string} 支付渠道编码
 */
export function getChannelCode(payValue, channels = getAvailablePayChannels()) {
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
  console.log(payParams,'支付信息')
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    uni.requestPayment({
      provider: 'alipay',
      orderInfo: payParams.orderString || payParams,
      success: (res) => {
        console.log(res)
        resolve({ success: true, ...res })
      },
      fail: (err) => {
        console.log(err)
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

function isPaySuccessStatus(status) {
  return Number(status) === 10
}

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

  try {
    if (payOrderId === null || payOrderId === undefined || payOrderId === '') {
      throw new Error('支付订单信息缺失')
    }

    // 1. 获取支付渠道编码
    const channelCode = selectedChannelCode || getChannelCode(payValue)
    if (!channelCode) {
      throw new Error('不支持的支付方式')
    }

    // 2. 调用后端接口提交支付，获取支付参数
    const submitRes = await submitPayOrder({
      id: payOrderId,
      channelCode: channelCode
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

    // 5. 根据支付方式和平台执行支付
    if (isMPWeixin() && payValue === 'wechat') {
      await wechatMiniProgramPay(payParams)
    } else if (isApp() && payValue === 'wechat') {
      await wechatAppPay(payParams)
    } else if (isApp() && payValue === 'alipay') {
      await alipayAppPay(payParams)
    } else {
      throw new Error('不支持的支付方式或平台')
    }

    // 6. 后端确认支付状态后再回调成功
    const payResult = await confirmPayOrderPaid(payOrderId)
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
  PAY_CHANNEL,
  getAvailablePayChannels,
  getPayChannelsByEnabled,
  fetchEnabledChannels,
  getChannelCode,
  executePayment,
  pollPayStatus
}