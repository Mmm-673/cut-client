/**
 * 订单状态常量
 * 所有订单状态码统一在此定义，禁止在业务代码中硬编码数字
 */

// 订单状态枚举
export const ORDER_STATUS = {
  // 初始状态
  INIT: 0,

  // 待支付
  PENDING_PAYMENT: 10,

  // 待接单（已支付，等待裁教接单）
  PENDING_ACCEPT: 20,

  // 已接单（裁教已接单，等待服务开始）
  ACCEPTED: 30,

  // 进行中（服务中）
  IN_SERVICE: 40,

  // 待结算（现场单，服务结束等待结算）
  PENDING_SETTLEMENT: 45,

  // 待评价
  PENDING_REVIEW: 50,

  // 已完成
  COMPLETED: 60,

  // 已取消/已退款
  CANCELLED: 70,

  // 已退款/售后
  REFUNDED: 80,
}

// 状态对应的中文文案
export const ORDER_STATUS_TEXT = {
  [ORDER_STATUS.INIT]: '未知',
  [ORDER_STATUS.PENDING_PAYMENT]: '待支付',
  [ORDER_STATUS.PENDING_ACCEPT]: '待接单',
  [ORDER_STATUS.ACCEPTED]: '已接单',
  [ORDER_STATUS.IN_SERVICE]: '服务中',
  [ORDER_STATUS.PENDING_SETTLEMENT]: '待结算',
  [ORDER_STATUS.PENDING_REVIEW]: '待评价',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELLED]: '已取消',
  [ORDER_STATUS.REFUNDED]: '已退款',
}

// 状态对应的颜色
export const ORDER_STATUS_COLOR = {
  [ORDER_STATUS.INIT]: '#9CA3AF',
  [ORDER_STATUS.PENDING_PAYMENT]: '#F59E0B',
  [ORDER_STATUS.PENDING_ACCEPT]: '#3B82F6',
  [ORDER_STATUS.ACCEPTED]: '#3B82F6',
  [ORDER_STATUS.IN_SERVICE]: '#00BB88',
  [ORDER_STATUS.PENDING_SETTLEMENT]: '#F59E0B',
  [ORDER_STATUS.PENDING_REVIEW]: '#F59E0B',
  [ORDER_STATUS.COMPLETED]: '#00BB88',
  [ORDER_STATUS.CANCELLED]: '#9CA3AF',
  [ORDER_STATUS.REFUNDED]: '#EF4444',
}

// ============ 状态判断辅助函数 ============

/** 是否是终态（不需要轮询的状态） */
export function isFinalStatus(status) {
  return (
    status === ORDER_STATUS.PENDING_REVIEW ||
    status === ORDER_STATUS.COMPLETED ||
    status === ORDER_STATUS.CANCELLED ||
    status === ORDER_STATUS.REFUNDED
  )
}

/** 是否可以取消订单 */
export function canCancelOrder(status) {
  return (
    status === ORDER_STATUS.PENDING_PAYMENT ||
    status === ORDER_STATUS.PENDING_ACCEPT ||
    status === ORDER_STATUS.ACCEPTED
  )
}

/** 是否可以支付 */
export function canPay(status) {
  return status === ORDER_STATUS.PENDING_PAYMENT
}

/** 是否可以评价 */
export function canReview(status) {
  return status === ORDER_STATUS.PENDING_REVIEW
}

/** 是否进行中（含待接单、已接单、服务中） */
export function isInProgress(status) {
  return (
    status === ORDER_STATUS.PENDING_ACCEPT ||
    status === ORDER_STATUS.ACCEPTED ||
    status === ORDER_STATUS.IN_SERVICE
  )
}

/** 获取状态文案 */
export function getStatusText(status) {
  return ORDER_STATUS_TEXT[status] || '未知'
}

/** 获取状态颜色 */
export function getStatusColor(status) {
  return ORDER_STATUS_COLOR[status] || '#9CA3AF'
}
