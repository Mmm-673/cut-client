/**
 * 支付常量
 */

import { TIME_ONE_SECOND, TIME_FIVE_MINUTES, TIME_ONE_DAY } from '@/utils/constants'

/** 支付请求超时后冷却时间（毫秒）— 短时间内不重复发起 */
export const PAY_REQUEST_COOLDOWN = 30 * TIME_ONE_SECOND

/** 通用支付状态轮询 - 默认最大尝试次数 */
export const POLL_DEFAULT_MAX_ATTEMPTS = 30
/** 通用支付状态轮询 - 默认轮询间隔（毫秒） */
export const POLL_DEFAULT_INTERVAL = 2500
/** 订单支付轮询 - 默认最大尝试次数 */
export const ORDER_POLL_MAX_ATTEMPTS = 10
/** 订单支付轮询 - 默认轮询间隔（毫秒） */
export const ORDER_POLL_INTERVAL = 2000

// 支付请求状态枚举
export const PAY_REQUEST_STATUS = {
  PENDING: 'pending',  // 支付中
  TIMEOUT: 'timeout',  // 超时
  FAILED: 'failed',    // 失败
  SUCCESS: 'success'   // 成功
}

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

/** 支付成功状态码 */
export const PAY_SUCCESS_STATUS = 10
