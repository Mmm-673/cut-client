import request from '@/utils/request'

/**
 * 会员现场订单分页列表
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码，默认 1
 * @param {number} [params.pageSize=10] - 每页数量，默认 10
 *
 * @returns {Promise<Object>} 返回现场订单分页列表数据
 * @returns {Array} returns.data.list - 现场订单列表
 * @returns {number} returns.data.list[].id - 订单ID
 * @returns {string} returns.data.list[].orderNo - 订单号
 * @returns {number} returns.data.list[].userId - 会员ID
 * @returns {number} returns.data.list[].coachId - 助教ID
 * @returns {number} returns.data.list[].customerType - 客户类型：1=会员 2=散客
 * @returns {number} returns.data.list[].serviceType - 服务类型：1=台球指导 2=潮玩领航 3=酒艺品鉴 4=影视赏析
 * @returns {number} returns.data.list[].status - 订单状态
 * @returns {number} returns.data.list[].unitPrice - 小时单价（分/小时）
 * @returns {number} [returns.data.list[].billingMinutes] - 计费分钟数（结束锁价后返回）
 * @returns {number} [returns.data.list[].actualDurationSeconds] - 实际服务秒数（结束锁价后返回）
 * @returns {number} returns.data.list[].returnTravelAmount - 返程车费（分）
 * @returns {number} [returns.data.list[].payAmount] - 最终应付金额（分，结束锁价后返回）
 * @returns {number} returns.data.list[].paymentStatus - 支付主状态：0=未支付 10=已支付 20=支付异常
 * @returns {number} returns.data.list[].settlementStatus - 结算状态：0=未开始 10=处理中 20=成功 30=失败待重试
 * @returns {string} [returns.data.list[].startTime] - 服务端开始时间
 * @returns {string} [returns.data.list[].endTime] - 服务端结束时间
 * @returns {number} returns.data.total - 总记录数
 * @returns {number} returns.data.pageNo - 当前页码
 * @returns {number} returns.data.pageSize - 每页数量
 */
export function getOnsiteOrderPage(params) {
  return request({
    url: '/app-api/billiard/onsite-order/page',
    method: 'get',
    params
  })
}

/**
 * 会员现场订单详情
 * @param {Object} params - 请求参数
 * @param {number} params.id - 订单ID (billiard_onsite_order.id)
 *
 * 业务校验：订单归属当前登录用户（防止越权访问）
 *
 * @returns {Promise<Object>} 返回现场订单详情数据
 * @returns {number} returns.data.id - 订单ID
 * @returns {string} returns.data.orderNo - 订单号
 * @returns {number} returns.data.userId - 会员ID
 * @returns {number} returns.data.coachId - 助教ID
 * @returns {number} returns.data.customerType - 客户类型：1=会员 2=散客
 * @returns {number} returns.data.serviceType - 服务类型：1=台球指导 2=潮玩领航 3=酒艺品鉴 4=影视赏析
 * @returns {number} returns.data.status - 订单状态
 * @returns {number} returns.data.unitPrice - 小时单价（分/小时）
 * @returns {number} [returns.data.billingMinutes] - 计费分钟数（结束锁价后返回）
 * @returns {number} [returns.data.actualDurationSeconds] - 实际服务秒数（结束锁价后返回）
 * @returns {number} returns.data.returnTravelAmount - 返程车费（分）
 * @returns {number} [returns.data.payAmount] - 最终应付金额（分，结束锁价后返回）
 * @returns {number} returns.data.paymentStatus - 支付主状态：0=未支付 10=已支付 20=支付异常
 * @returns {number} returns.data.settlementStatus - 结算状态：0=未开始 10=处理中 20=成功 30=失败待重试
 * @returns {string} [returns.data.startTime] - 服务端开始时间
 * @returns {string} [returns.data.endTime] - 服务端结束时间
 */
export function getOnsiteOrderDetail(params) {
  return request({
    url: '/app-api/billiard/onsite-order/get',
    method: 'get',
    params
  })
}

export default {
  getOnsiteOrderPage,
  getOnsiteOrderDetail
}
