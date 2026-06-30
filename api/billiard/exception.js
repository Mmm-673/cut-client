import request from '@/utils/request'

/**
 * 用户报告异常
 * @param {Object} data - 请求参数
 * @param {number} data.orderId - billiard_order.id，必须归属当前登录用户
 * @param {number} data.exceptionType - 异常类型：1=用户投诉 2=裁教超时 3=系统异常 4=其他
 * @param {string} data.reason - 异常说明，最长500字符
 * @param {Array<string>} [data.evidenceUrls] - 证据URL数组
 *
 * 业务校验：
 * - 订单存在且归属当前登录用户（防越权）
 * - 订单状态不为 PENDING_PAYMENT (10)（待付款订单无法投诉，尚未发生服务）
 * - 同一订单在24小时内不可重复提交同类型异常（防刷单）
 *
 * 操作：
 * - 插入 billiard_exception_order（status=PENDING，claimUserId=NULL）
 * - 更新 billiard_order.is_abnormal = 1
 * - 推送站内通知给客服组："新异常订单待处理：订单 {orderNo}，类型：{exceptionType}"
 *
 * @returns {Promise<Object>} 返回异常订单ID
 * @returns {number} returns.data - 新创建的exceptionOrderId
 */
export function reportException(data) {
  return request({
    url: '/app-api/billiard/exception/report',
    method: 'post',
    data
  })
}

export default {
  reportException
}
