import request from '@/utils/request'

/**
 * 创建现场支付尝试（会员App支付）
 * @param {Object} data - 请求参数
 * @param {number} data.orderId - 现场订单ID
 * @param {string} data.channelCode - 支付渠道编码：wx_app / alipay_app
 * @returns {Promise<Object>} 返回现场支付结果
 * @returns {OnsitePaymentRespVO} returns.data - 现场支付响应信息
 */
export function createOnsitePayment(data) {
  return request({
    url: '/app-api/billiard/onsite-payment/create',
    method: 'post',
    data,
    timeout: 30000 // 单独设置超时时间为 30 秒
  })
}

/**
 * 查询现场支付和结算状态
 * @param {number} orderId - 现场订单ID
 * @returns {Promise<Object>} 返回现场支付状态
 * @returns {OnsitePaymentRespVO} returns.data - 现场支付状态信息
 * @returns {number} returns.data.paymentId - 现场支付聚合ID
 * @returns {number} returns.data.attemptId - 本次支付尝试ID
 * @returns {number} returns.data.payOrderId - pay模块支付单ID
 * @returns {number} returns.data.orderId - 现场订单ID
 * @returns {string} returns.data.merchantOrderNo - 商户支付单号
 * @returns {number} returns.data.amount - 固定支付金额（分）
 * @returns {number} returns.data.paymentStatus - 支付主状态：0=未支付 10=已支付 20=支付异常
 * @returns {number} returns.data.attemptStatus - 本次尝试状态：0=等待支付 10=成功 20=失败 30=已过期 40=重复支付成功 50=金额不一致
 * @returns {number} returns.data.settlementStatus - 结算状态：0=未开始 10=处理中 20=成功 30=失败待重试
 * @returns {string} returns.data.channelCode - 本次固定支付渠道
 * @returns {string} returns.data.displayMode - 展示模式（会员端App支付不使用）
 * @returns {string} returns.data.displayContent - 展示内容（会员端App支付不使用）
 */
export function getOnsitePaymentStatus(orderId) {
  return request({
    url: '/app-api/billiard/onsite-payment/status',
    method: 'get',
    params: { orderId }
  })
}

export default {
  createOnsitePayment,
  getOnsitePaymentStatus
}
