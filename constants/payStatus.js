/**
 * 支付状态常量
 * 所有支付状态码统一在此定义
 */

// 支付状态枚举
export const PAY_STATUS = {
  // 未支付
  UNPAID: 0,

  // 支付成功
  SUCCESS: 10,

  // 已退款
  REFUNDED: 20,

  // 支付关闭
  CLOSED: 30,
}

// 支付状态中文名称
export const PAY_STATUS_TEXT = {
  [PAY_STATUS.UNPAID]: '未支付',
  [PAY_STATUS.SUCCESS]: '支付成功',
  [PAY_STATUS.REFUNDED]: '已退款',
  [PAY_STATUS.CLOSED]: '支付关闭',
}

/** 获取支付状态文案 */
export function getPayStatusText(status) {
  return PAY_STATUS_TEXT[status] || '未知'
}

/** 是否支付成功 */
export function isPaySuccess(status) {
  return Number(status) === PAY_STATUS.SUCCESS
}

/** 是否已退款 */
export function isPayRefunded(status) {
  return Number(status) === PAY_STATUS.REFUNDED
}

/** 是否已支付（支付成功或已退款） */
export function isPaid(status) {
  const s = Number(status)
  return s === PAY_STATUS.SUCCESS || s === PAY_STATUS.REFUNDED
}
