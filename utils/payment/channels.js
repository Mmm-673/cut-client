/**
 * 支付渠道管理
 * 包含：渠道配置、各平台支付函数、渠道查询等
 */

import { isMPWeixin, isApp } from '@/utils/platform'
import logger from '@/utils/logger'
import { PAY_CHANNEL } from './constants'

// #ifdef MP-WEIXIN
import { bindWX } from '@/api/billiard/user'
// #endif

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
 * 根据支付方式值获取对应平台的渠道编码
 * @param {string} payValue - 支付方式值（wechat/alipay/wallet）
 * @returns {string|null} 支付渠道编码
 */
function resolvePlatformChannelCode(payValue) {
  if (payValue === 'wechat' && getCurrentPlatform() === 'app-plus') {
    return PAY_CHANNEL.WX_APP
  }

  const channel = ALL_PAY_CHANNELS.find(item => item.value === payValue)
  return channel ? channel.channelCode : null
}

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
  logger.debug('getPayChannelsByEnabled - 当前平台:', currentPlatform)
  logger.debug('getPayChannelsByEnabled - 后端返回的渠道编码:', enabledCodes)

  // 渠道编码映射
  const codeToChannel = {
    'wx_pub': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: 'wx_pub', platforms: ['mp-weixin'] },
    'wx_lite': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: 'wx_lite', platforms: ['mp-weixin'] },
    'wx_app': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: PAY_CHANNEL.WX_APP, platforms: ['app-plus'] },
    'alipay_app': { value: 'alipay', label: '支付宝', icon: '/static/images/pay/alipay.png', bgColor: '#1677FF', channelCode: PAY_CHANNEL.ALIPAY_APP, platforms: ['app-plus'] },
    'wallet': { value: 'wallet', label: '钱包余额', icon: 'wallet', bgColor: '#00BB88', channelCode: PAY_CHANNEL.WALLET, platforms: ['mp-weixin', 'app-plus', 'h5'] }
  }

  const result = []
  const addedValues = new Set()

  // 遍历后端返回的渠道
  enabledCodes.forEach(code => {
    const channel = codeToChannel[code]
    if (channel && channel.platforms && channel.platforms.includes(currentPlatform)) {
      // 避免重复添加相同 value 的渠道
      if (!addedValues.has(channel.value)) {
        logger.debug('getPayChannelsByEnabled - 添加支付渠道:', channel)
        result.push(channel)
        addedValues.add(channel.value)
      }
    }
  })

  logger.debug('getPayChannelsByEnabled - 最终返回的支付渠道:', result)
  return result
}

/**
 * 根据支付方式值获取渠道编码
 * @param {string} payValue - 支付方式值（wechat/alipay/wallet）
 * @param {Array} [channels] - 渠道列表，默认使用本地可用渠道
 * @returns {string|null} 支付渠道编码
 */
export function getChannelCode(payValue, channels) {
  const list = channels || getAvailablePayChannels()
  const channel = list.find(c => c.value === payValue)
  return channel ? channel.channelCode : null
}

// ==================== 各平台支付函数 ====================

/**
 * 微信小程序支付
 * @param {Object} payParams - 支付参数
 * @returns {Promise} 支付结果
 */
export function wechatMiniProgramPay(payParams) {
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.packageValue,
      signType: payParams.signType || 'MD5',
      paySign: payParams.paySign,
      success: (res) => {
        resolve({ success: true, ...res })
      },
      fail: (err) => {
        logger.error('微信小程序支付失败:', err)
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
 * @returns {Promise} 支付结果
 */
export function wechatAppPay(payParams) {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    uni.requestPayment({
      provider: 'wxpay',
      orderInfo: {
        appid: payParams.appid,
        partnerid: payParams.partnerId,
        prepayid: payParams.prepayId,
        package: payParams.packageValue,
        noncestr: payParams.noncestr,
        timestamp: payParams.timestamp,
        sign: payParams.sign
      },
      success: (res) => {
        resolve({ success: true, ...res })
      },
      fail: (err) => {
        logger.error('App微信支付失败:', err)
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
 * @returns {Promise} 支付结果
 */
export function alipayAppPay(payParams) {
  logger.debug(payParams,'支付信息')
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    uni.requestPayment({
      provider: 'alipay',
      orderInfo: payParams.orderString || payParams,
      success: (res) => {
        logger.debug(res)
        resolve({ success: true, ...res })
      },
      fail: (err) => {
        logger.debug(err)
        logger.error('App支付宝支付失败:', err)
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
 * 根据支付方式和平台执行支付 SDK 调用
 * @param {string} payValue - 支付方式值
 * @param {Object} payParams - 支付参数
 * @returns {Promise} 支付结果
 */
export function invokePaymentSDK(payValue, payParams) {
  if (isMPWeixin() && payValue === 'wechat') {
    return wechatMiniProgramPay(payParams)
  } else if (isApp() && payValue === 'wechat') {
    return wechatAppPay(payParams)
  } else if (isApp() && payValue === 'alipay') {
    return alipayAppPay(payParams)
  } else {
    throw new Error('不支持的支付方式或平台')
  }
}

// ==================== 微信绑定（小程序） ====================

// #ifdef MP-WEIXIN
/**
 * 获取微信 code 并绑定（小程序）
 * @returns {Promise} 绑定结果
 */
export async function getWxCodeAndBind() {
  try {
    const loginRes = await new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        onlyAuthorize: true,
        success: resolve,
        fail: reject
      })
    })
    logger.debug('🚀 ~ getWxCode ~ code:', loginRes.code)
    uni.showLoading({ title: '绑定中...', mask: true })
    let platform = 'miniapp'
    // #ifdef APP-PLUS
    platform = 'app'
    // #endif
    const res = await bindWX({
      code: loginRes.code,
      platform,
      state: 'test'
    })
    uni.hideLoading()
    uni.showToast({ title: '绑定成功', icon: 'success' })
    return res
  } catch (error) {
    uni.hideLoading()
    logger.error('绑定微信失败:', error)
    uni.showToast({ title: error?.message || '绑定失败', icon: 'none' })
    throw error
  }
}
// #endif

export default {
  PAY_CHANNEL,
  getAvailablePayChannels,
  getPayChannelsByEnabled,
  getChannelCode,
  wechatMiniProgramPay,
  wechatAppPay,
  alipayAppPay,
  invokePaymentSDK,
}
