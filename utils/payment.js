/**
 * 支付工具库
 * 支持多端支付：微信小程序支付、App微信支付、App支付宝支付、钱包支付
 */

import { isMPWeixin, isApp, isH5, isWechatBrowser } from '@/utils/platform'
import { submitPayOrder, getEnableChannelCodeList, getPayOrder } from '@/api/billiard/pay'
import { createOnsitePayment, getOnsitePaymentStatus } from '@/api/billiard/onsitePay'
import { bindWX } from '@/api/billiard/user'
import { getSocialAuthRedirect } from '@/api/auth'

// 社交平台类型：微信公众号（后端 JustAuth 的 WECHAT_MP）
const SOCIAL_TYPE_WECHAT_MP = 31
// H5 微信支付「绑定后自动续付」的上下文缓存 key
const WX_PAY_BIND_CONTEXT_KEY = 'wx_pay_bind_context'

// 支付请求状态管理，用于防止重复提交
const payRequestStates = new Map()

// 支付请求状态枚举
const PAY_REQUEST_STATUS = {
  PENDING: 'pending',  // 支付中
  TIMEOUT: 'timeout',  // 超时
  FAILED: 'failed',    // 失败
  SUCCESS: 'success'   // 成功
}

// 检查支付请求状态
function checkPayRequestState(payOrderId, channelCode) {
  const key = `${payOrderId}_${channelCode}`
  return payRequestStates.get(key)
}

// 设置支付请求状态
function setPayRequestState(payOrderId, channelCode, status) {
  const key = `${payOrderId}_${channelCode}`
  payRequestStates.set(key, {
    status,
    timestamp: Date.now()
  })

  // 清理过期的状态（24小时后自动清理）
  const expiredKeys = []
  const now = Date.now()
  payRequestStates.forEach((value, k) => {
    if (now - value.timestamp > 24 * 60 * 60 * 1000) {
      expiredKeys.push(k)
    }
  })
  expiredKeys.forEach(key => payRequestStates.delete(key))
}

/**
 * 支付渠道编码
 */
export const PAY_CHANNEL = {
  // 微信小程序支付/公众号JSAPI支付
  WX_MINIPROGRAM: 'wx_pub',
  // 微信App支付
  WX_APP: 'wx_app',
  // 微信WAP支付（H5）
  WX_WAP: 'wx_wap',
  // 支付宝App支付
  ALIPAY_APP: 'alipay_app',
  // 支付宝WAP支付（H5）
  ALIPAY_WAP: 'alipay_wap',
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
    platforms: ['mp-weixin', 'app-plus', 'h5']
  },
  {
    value: 'alipay',
    label: '支付宝',
    channelCode: PAY_CHANNEL.ALIPAY_APP,
    icon: '/static/images/pay/alipay.png',
    bgColor: '#1677FF',
    platforms: ['app-plus', 'h5']
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
  const wechatBrowser = isWechatBrowser()
  const pureH5 = currentPlatform === 'h5' && !wechatBrowser

  return ALL_PAY_CHANNELS
    .filter(channel => channel.platforms.includes(currentPlatform))
    // 微信浏览器环境：只保留微信支付、支付宝和钱包余额
    .filter(channel => !wechatBrowser || channel.value === 'wechat' || channel.value === 'alipay' || channel.value === 'wallet')
    // 纯 H5 环境（普通浏览器）：只保留支付宝和钱包余额
    .filter(channel => !pureH5 || channel.value === 'alipay' || channel.value === 'wallet')
    .map(channel => ({
      ...channel,
      channelCode: resolvePlatformChannelCode(channel.value)
    }))
}

function resolvePlatformChannelCode(payValue) {
  const platform = getCurrentPlatform()

  if (payValue === 'wechat') {
    if (platform === 'app-plus') {
      return PAY_CHANNEL.WX_APP
    }
    if (platform === 'h5') {
      // H5 微信浏览器用 JSAPI，普通浏览器用 WAP
      return isWechatBrowser() ? PAY_CHANNEL.WX_MINIPROGRAM : PAY_CHANNEL.WX_WAP
    }
    // mp-weixin 默认
    return PAY_CHANNEL.WX_MINIPROGRAM
  }

  if (payValue === 'alipay') {
    if (platform === 'h5') {
      return PAY_CHANNEL.ALIPAY_WAP
    }
    return PAY_CHANNEL.ALIPAY_APP
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
  const wechatBrowser = isWechatBrowser()
  // 纯 H5 环境（非微信浏览器的普通浏览器）
  const pureH5 = currentPlatform === 'h5' && !wechatBrowser

  // 渠道编码映射
  const codeToChannel = {
    'wx_pub': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: 'wx_pub', platforms: ['mp-weixin', 'h5'] },
    'wx_wap': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: 'wx_wap', platforms: ['h5'] },
    'wx_lite': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: 'wx_lite', platforms: ['mp-weixin'] },
    'wx_app': { value: 'wechat', label: '微信支付', icon: '/static/images/pay/wechat.png', bgColor: '#07C160', channelCode: PAY_CHANNEL.WX_APP, platforms: ['app-plus'] },
    'alipay_wap': { value: 'alipay', label: '支付宝', icon: '/static/images/pay/alipay.png', bgColor: '#1677FF', channelCode: PAY_CHANNEL.ALIPAY_WAP, platforms: ['h5'] },
    'alipay_app': { value: 'alipay', label: '支付宝', icon: '/static/images/pay/alipay.png', bgColor: '#1677FF', channelCode: PAY_CHANNEL.ALIPAY_APP, platforms: ['app-plus'] },
    'wallet': { value: 'wallet', label: '钱包余额', icon: 'wallet', bgColor: '#00BB88', channelCode: PAY_CHANNEL.WALLET, platforms: ['mp-weixin', 'app-plus', 'h5'] }
  }

  const result = []
  const addedValues = new Set()

  // 遍历后端返回的渠道
  enabledCodes.forEach(code => {
    const channel = codeToChannel[code]
    if (!channel || !channel.platforms || !channel.platforms.includes(currentPlatform)) {
      return
    }

    // 微信浏览器环境：只保留微信支付(wx_pub)、支付宝(alipay_wap)和钱包余额
    if (wechatBrowser && code !== 'wx_pub' && code !== 'alipay_wap' && code !== 'wallet') {
      return
    }

    // 纯 H5 环境（普通浏览器）：只保留支付宝(alipay_wap)和钱包余额
    if (pureH5 && code !== 'alipay_wap' && code !== 'wallet') {
      return
    }

    // 避免重复添加相同 value 的渠道
    if (!addedValues.has(channel.value)) {
      result.push(channel)
      addedValues.add(channel.value)
    } else if (wechatBrowser && channel.value === 'wechat' && code === 'wx_pub') {
      // 微信浏览器 + 微信支付：如果已经添加了 wx_wap，替换为 wx_pub
      const existingIndex = result.findIndex(item => item.value === 'wechat' && item.channelCode === 'wx_wap')
      if (existingIndex !== -1) {
        result.splice(existingIndex, 1, channel)
      }
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
      package: payParams.packageValue,
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
 * 构造 H5 支付回跳地址
 * @param {number} payOrderId - 支付单ID
 * @returns {string} 完整的回跳 URL
 */
function getReturnUrl(payOrderId) {
  // #ifdef H5
  try {
    const baseUrl = window.location.origin + window.location.pathname
    const hash = '#/pages/booking/pay-success'
    const query = `?payOrderId=${payOrderId}&source=callback`
    return baseUrl + hash + query
  } catch (e) {
    return ''
  }
  // #endif
  // #ifndef H5
  return ''
  // #endif
}

/**
 * H5 微信 JSAPI 支付（公众号内）
 * @param {Object} payParams - 支付参数
 * @param {string} payParams.appId - 公众号ID
 * @param {string} payParams.timeStamp - 时间戳
 * @param {string} payParams.nonceStr - 随机字符串
 * @param {string} payParams.package - 统一下单 prepay_id
 * @param {string} payParams.signType - 签名方式
 * @param {string} payParams.paySign - 签名
 * @returns {Promise} 支付结果
 */
function wechatJsapiPay(payParams) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    // 调试：打印支付参数
    const debugPayParams = {
      appId: payParams.appId,
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.packageValue || payParams.package,
      signType: payParams.signType || 'RSA',
      paySign: payParams.paySign
    }


    if (typeof WeixinJSBridge === 'undefined') {
      uni.showModal({
        title: '【调试】错误',
        content: 'WeixinJSBridge 未定义，请在微信浏览器中打开',
        showCancel: false
      })
      reject({ success: false, message: '请在微信浏览器中打开后再支付' })
      return
    }

    WeixinJSBridge.invoke(
      'getBrandWCPayRequest',
      debugPayParams,
      (res) => {
        if (res.err_msg === 'get_brand_wcpay_request:ok') {
          resolve({ success: true, ...res })
        } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
          reject({ success: false, canceled: true, message: '支付已取消', ...res })
        } else {
          reject({ success: false, message: res.err_msg || '支付失败', ...res })
        }
      }
    )
    // #endif

    // #ifndef H5
    reject({ success: false, message: '非H5环境不支持微信JSAPI支付' })
    // #endif
  })
}

/**
 * H5 WAP 跳转支付（微信 WAP / 支付宝 WAP 通用）
 * 跳转到第三方支付页面，支付完成后通过 returnUrl 跳回
 * @param {string} payUrl - 支付跳转链接
 * @returns {Promise} 永远不会 resolve，因为页面会跳转
 */
function h5WapPay(payUrl) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    if (!payUrl) {
      reject({ success: false, message: '支付链接无效' })
      return
    }
    // 标记支付中状态，用于回跳后的状态恢复
    try {
      uni.setStorageSync('h5_pay_pending', '1')
    } catch (e) {}
    // 跳转到支付页面
    window.location.href = payUrl
    // 不 resolve，等待页面跳转
    // #endif

    // #ifndef H5
    reject({ success: false, message: '非H5环境不支持WAP支付' })
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
// #ifdef MP-WEIXIN
const getWxCode = async () => {
  try {
    const loginRes = await new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        onlyAuthorize: true,
        success: resolve,
        fail: reject
      })
    })
    uni.showLoading({ title: '绑定中...', mask: true })
    const platform = 'miniapp'
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
    console.error('绑定微信失败:', error)
    uni.showToast({ title: error?.message || '绑定失败', icon: 'none' })
    throw error
  }
}
// #endif

// #ifdef H5
// 从 location.search 读取指定参数
function getSearchParam(name) {
  try {
    const search = window.location.search || ''
    const matched = new RegExp('[?&]' + name + '=([^&]+)').exec(search)
    return matched ? decodeURIComponent(matched[1]) : null
  } catch (e) {
    return null
  }
}

// 清除 URL 上的 code/state 参数，避免刷新页面时重复绑定
function cleanWxAuthParamsFromUrl() {
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    window.history.replaceState(null, '', url.toString())
  } catch (e) {}
}

// 跳转到微信公众号网页授权
// 授权 URL 必须由后端生成：state 由后端创建并缓存，回调时后端 JustAuth 会校验，
// 前端自行拼接的 state 会报「Illegal state [WECHAT_MP]」
async function redirectToWxOAuth() {
  // redirect_uri 使用干净的基础地址（不带 hash / query），回跳后 code/state 会在 location.search
  const redirectUri = window.location.origin + window.location.pathname
  const res = await getSocialAuthRedirect({
    type: SOCIAL_TYPE_WECHAT_MP,
    redirectUri
  })
  const authUrl = res.data
  if (!authUrl) {
    throw new Error('获取微信授权链接失败')
  }
  window.location.href = authUrl
}

// 等待 WeixinJSBridge 就绪（回跳后自动续付时使用）
function waitWeixinJSBridge(timeout = 3000) {
  return new Promise((resolve) => {
    if (typeof WeixinJSBridge !== 'undefined') {
      resolve(true)
      return
    }
    let done = false
    const finish = (ok) => {
      if (done) return
      done = true
      resolve(ok)
    }
    document.addEventListener('WeixinJSBridgeReady', () => finish(true), false)
    setTimeout(() => finish(typeof WeixinJSBridge !== 'undefined'), timeout)
  })
}

// 绑定成功后，使用缓存的上下文自动继续微信支付
async function resumeWxPayAfterBind(context) {
  const { payOrderId, payValue, channelCode, orderId } = context || {}
  if (!payOrderId) return

  await waitWeixinJSBridge()

  await executePayment({
    payOrderId,
    payValue: payValue || 'wechat',
    channelCode: channelCode || PAY_CHANNEL.WX_MINIPROGRAM,
    orderId,
    onSuccess: () => {
      const successUrl = orderId
        ? `/subpkg/booking/pay-success?orderId=${orderId}`
        : `/subpkg/booking/pay-success?payOrderId=${payOrderId}`
      uni.showToast({ title: '支付成功', icon: 'success' })
      setTimeout(() => {
        uni.redirectTo({ url: successUrl })
      }, 1200)
    },
    onCancel: () => {
      uni.showToast({ title: '支付已取消', icon: 'none' })
    },
    onError: (err) => {
      if (!err || !err.pending) {
        uni.showToast({ title: (err && err.message) || '支付失败，请重试', icon: 'none' })
      }
    }
  })
}

/**
 * H5 微信浏览器：处理网页授权回跳
 * 在 App.vue onLaunch 中调用。若检测到微信授权 code 且存在待支付上下文，
 * 则完成 openid 绑定并自动继续之前的微信支付。
 * @returns {Promise<boolean>} 是否处理了绑定回跳
 */
export async function handleWxPayBindCallback() {
  if (!isWechatBrowser()) return false

  const code = getSearchParam('code')
  const state = getSearchParam('state')
  if (!code) return false

  let context = null
  try {
    context = uni.getStorageSync(WX_PAY_BIND_CONTEXT_KEY)
  } catch (e) {}

  // 仅当存在本模块写入的待支付上下文时才处理，避免与其它 OAuth 流程冲突
  if (!context || !context.payOrderId) {
    return false
  }

  // 先清理，避免刷新/重复触发
  try {
    uni.removeStorageSync(WX_PAY_BIND_CONTEXT_KEY)
  } catch (e) {}
  cleanWxAuthParamsFromUrl()

  try {
    uni.showLoading({ title: '绑定微信中...', mask: true })
    await bindWX({ code, state, platform: 'h5' })
    uni.hideLoading()
  } catch (e) {
    uni.hideLoading()
    const msg = typeof e === 'string' ? e : (e && e.message) || '微信绑定失败'
    uni.showToast({ title: msg, icon: 'none' })
    return false
  }

  try {
    await resumeWxPayAfterBind(context)
  } catch (e) {
    // 续付异常已在 onError 中提示
    console.error('绑定后续付失败:', e)
  }
  return true
}
// #endif

async function confirmPayOrderPaid(payOrderId) {
  const res = await getPayOrder({ id: payOrderId, sync: true, silent: true })
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


  // 提前定义 channelCode，确保在 catch 块中可用
  let channelCode = selectedChannelCode || getChannelCode(payValue)

  try {
    if (payOrderId === null || payOrderId === undefined || payOrderId === '') {
      throw new Error('支付订单信息缺失')
    }

    // 1. 获取支付渠道编码
    // channelCode = selectedChannelCode || getChannelCode(payValue)

    if (!channelCode) {
      throw new Error('不支持的支付方式')
    }

    // 2. 检查支付请求状态，防止重复提交
    const currentState = checkPayRequestState(payOrderId, channelCode)
    const now = Date.now()

    // 如果是 pending 状态且未超时（5分钟内），阻止重复提交
    if (currentState && currentState.status === PAY_REQUEST_STATUS.PENDING && (now - currentState.timestamp < 2 * 1000)) {
      throw new Error('支付请求处理中，请稍后再试')
    }

    // 如果是 timeout 状态且未超过冷却期（30秒），优先查单确认
    if (currentState && currentState.status === PAY_REQUEST_STATUS.TIMEOUT && (now - currentState.timestamp < 30 * 1000)) {
      try {
        const payResult = await confirmPayOrderPaid(payOrderId)
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(payResult)
        }
        setPayRequestState(payOrderId, channelCode, PAY_REQUEST_STATUS.SUCCESS)
        return payResult
      } catch (error) {
      }
    }

    // 设置支付请求状态为 pending
    setPayRequestState(payOrderId, channelCode, PAY_REQUEST_STATUS.PENDING)

    // 3. 调用后端接口提交支付，获取支付参数
    const submitParams = {
      id: payOrderId,
      channelCode: channelCode,
      displayMode: payValue === 'alipay' ? (isH5() ? undefined : 'app') : undefined
    }

    // H5 WAP 支付下传递 returnUrl，用于支付完成后回跳
    // 微信浏览器内 JSAPI 支付不需要 returnUrl（页面内唤起，不跳转）
    const isWapPay = isH5() && !isWechatBrowser()
    if (isWapPay) {
      submitParams.returnUrl = getReturnUrl(payOrderId)
    }

    const submitRes = await submitPayOrder({ ...submitParams, silent: true })

    // 调试：打印接口完整返回

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

    // 4. 根据 displayMode 解析 displayContent
    //    url  → displayContent 是跳转链接字符串
    //    form → displayContent 是 HTML 表单字符串
    //    json → displayContent 是 JSON 字符串（如微信 JSAPI 参数）
    const displayMode = resultData.displayMode || ''
    let payParams = displayContent

    if (displayMode === 'url' || displayMode === 'form') {
      // URL 或表单模式：displayContent 本身就是原始内容字符串，直接用
      payParams = displayContent
    } else if (typeof displayContent === 'string') {
      // 其他模式（如 json）：尝试 JSON 解析
      try {
        payParams = JSON.parse(displayContent)
      } catch (e) {
        payParams = displayContent
      }
    }

    // 5. 根据支付方式和平台执行支付
    if (isMPWeixin() && payValue === 'wechat') {
      await wechatMiniProgramPay(payParams)
    } else if (isApp() && payValue === 'wechat') {
      await wechatAppPay(payParams)
    } else if (isApp() && payValue === 'alipay') {
      // 支付宝支付
      await alipayAppPay(payParams)
    } else if (isH5() && payValue === 'wechat') {
      // H5 微信支付：微信内用 JSAPI，微信外用 WAP 跳转
      if (isWechatBrowser()) {
        await wechatJsapiPay(payParams)
      } else {
        // WAP 支付：displayContent 是跳转 URL
        const payUrl = typeof payParams === 'string' ? payParams : (payParams.url || payParams.mwebUrl || '')
        await h5WapPay(payUrl)
        // 不会执行到这里（页面跳转）
        return { pending: true }
      }
    } else if (isH5() && payValue === 'alipay') {
      // #ifdef H5
      // H5 支付宝 WAP 支付
      if (displayMode === 'form' && typeof displayContent === 'string' && displayContent.includes('<form')) {
        // form 模式：解析后自动提交表单
        try {
          const parser = new DOMParser()
          const doc = parser.parseFromString(displayContent, 'text/html')
          const formEl = doc.querySelector('form')
          if (formEl) {
            const form = document.createElement('form')
            form.method = formEl.method || 'post'
            form.action = formEl.action || ''
            form.target = formEl.target || '_self'
            form.acceptCharset = formEl.acceptCharset || 'utf-8'
            const inputs = formEl.querySelectorAll('input')
            inputs.forEach(input => {
              const safeInput = document.createElement('input')
              safeInput.type = input.type || 'hidden'
              safeInput.name = input.name
              safeInput.value = input.value
              form.appendChild(safeInput)
            })
            form.style.display = 'none'
            document.body.appendChild(form)
            form.submit()
            return { pending: true }
          }
        } catch (e) {
          console.error('[支付宝H5] 解析表单失败:', e)
        }
      }

      // url 模式：直接跳转支付宝支付页
      const payUrl = typeof payParams === 'string' ? payParams : (payParams.url || '')
      if (!payUrl) {
        throw new Error('支付链接无效，请重试')
      }
      console.log('[支付宝H5] 跳转到支付页:', payUrl)
      await h5WapPay(payUrl)
      // #endif
      return { pending: true }
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

    // #ifdef MP-WEIXIN
    if (error.message === '请先绑定微信后再发起微信支付') {
      return new Promise((resolve, reject) => {
        uni.showModal({
          title: '提示',
          content: '需要绑定微信后才能继续支付，是否立即绑定？',
          success: (modalRes) => {
            if (modalRes.confirm) {
              getWxCode().then(resolve).catch(reject)
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

    // #ifdef H5
    // 微信内置浏览器：JSAPI 支付需要先绑定 openid，引导网页授权后自动续付
    if (typeof error !== 'string' && error.msg.includes('绑定微信') && isWechatBrowser()) {
      return new Promise((resolve, reject) => {
        uni.showModal({
          title: '提示',
          content: '需要绑定微信后才能继续支付，是否立即绑定？',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 缓存待支付上下文，网页授权回跳后自动继续支付
              try {
                uni.setStorageSync(WX_PAY_BIND_CONTEXT_KEY, {
                  payOrderId,
                  payValue,
                  channelCode,
                  orderId: orderId || '',
                  ts: Date.now()
                })
              } catch (e) {}
              // 跳转微信授权，成功后页面离开，不再 resolve/reject
              redirectToWxOAuth().catch((e) => {
                const msg = typeof e === 'string' ? e : (e && e.message) || '获取微信授权链接失败'
                uni.showToast({ title: msg, icon: 'none' })
                reject(error)
              })
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

    console.error('支付出错:', error)

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

/**
 * ========================================
 * 现场订单支付（新增，不影响现有支付逻辑）
 * ========================================
 */

/**
 * 创建轮询器（用于现场支付状态轮询）
 * @param {Object} options
 * @param {Function} options.fn - 轮询执行的异步函数
 * @param {Function} options.check - 检查是否停止的函数，返回 true 则停止并 resolve
 * @param {number} [options.interval=2500] - 轮询间隔（毫秒）
 * @param {number} [options.maxAttempts=30] - 最大轮询次数
 * @returns {Object} 轮询器对象 { start(), stop(), pause(), resume() }
 */
function createPoller({ fn, check, interval = 2500, maxAttempts = 30 }) {
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
 * 执行现场订单支付
 * @description 先创建现场支付尝试，再调用现有 executePayment 执行支付，最后轮询结算状态
 * @param {Object} options - 支付选项
 * @param {number} options.orderId - 现场订单ID
 * @param {string} options.payValue - 支付方式值（wechat / alipay）
 * @param {string} [options.channelCode] - 支付渠道编码，优先使用
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

    // 3. 调用现有支付执行（复用 executePayment）
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
      },
      interval: 2500,
      maxAttempts: 30
    })

    poller.start().then((finalStatus) => {
      if (finalStatus && finalStatus.settlementStatus === 20) {
        if (onSettlementSuccess && typeof onSettlementSuccess === 'function') {
          onSettlementSuccess(finalStatus)
        }
      }
    }).catch((err) => {
      console.error('现场支付结算轮询异常:', err)
    })

    return { payResult, poller, paymentData }
  } catch (error) {
    console.error('现场支付失败:', error)

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
 * 获取现场订单可用的支付渠道（仅微信+支付宝App支付）
 * @param {Array<string>} [enabledCodes] - 后端返回的启用渠道编码
 * @returns {Array} 可用支付渠道列表
 */
export function getOnsitePayChannels(enabledCodes) {
  const onsiteSupported = ['wx_app', 'alipay_app','wallet']
  const allChannels = enabledCodes ? getPayChannelsByEnabled(enabledCodes) : getAvailablePayChannels()
  return allChannels.filter(ch => onsiteSupported.includes(ch.channelCode))
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