import request from '@/utils/request'

/**
 * 获取我的订单列表
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码，默认 1
 * @param {number} [params.pageSize=10] - 每页数量，默认 10
 * @param {number} [params.status] - 状态筛选；不传则返回所有状态
 *
 * Tab 映射建议（前端分 Tab 展示）：
 * - 待付款: status = 10
 * - 进行中: status = 20, 30, 40 (待接单 + 已接单 + 进行中)
 * - 待评价: status = 50
 * - 已完成: status = 60
 * - 已取消: status = 70
 * - 退款售后: status = 70, 80 (包含已取消退款、异常处理退款等)
 *
 * @returns {Promise<Object>} 返回订单列表数据
 * @returns {Array} returns.data.list - 订单列表
 * @returns {number} returns.data.list[].orderId - 订单ID
 * @returns {string} returns.data.list[].orderNo - 订单号
 * @returns {string} returns.data.list[].coachStageName - 助教艺名
 * @returns {string} [returns.data.list[].coachMainPhoto] - 助教主图 URL
 * @returns {number} returns.data.list[].serviceType - 服务类型：1=台球陪练 2=陪游
 * @returns {number} returns.data.list[].bookingTime - 预约服务开始时间（毫秒时间戳）
 * @returns {number} returns.data.list[].serviceDuration - 预定总时长（分钟）
 * @returns {number} returns.data.list[].status - 订单状态
 * @returns {number} returns.data.list[].totalAmount - 订单总金额（分）
 * @returns {number} returns.data.list[].createTime - 下单时间（毫秒时间戳）
 */
export function getOrderList(params) {
  return request({
    url: '/app-api/billiard/order/page',
    method: 'get',
    params
  })
}

/**
 * 获取订单详情
 * @param {Object} params - 请求参数
 * @param {number} params.id - 订单ID (billiard_order.id)
 *
 * 业务校验：订单归属当前登录用户（防止越权访问）
 *
 * @returns {Promise<Object>} 返回订单详情数据
 * @returns {number} returns.data.id - 订单ID
 * @returns {string} returns.data.orderNo - 订单号
 * @returns {number} returns.data.coachId - 助教ID
 * @returns {string} returns.data.coachStageName - 助教艺名
 * @returns {string} [returns.data.coachMainPhoto] - 助教主图 URL
 * @returns {string} [returns.data.venueName] - 球厅名称
 * @returns {string} [returns.data.venueAddress] - 球厅地址
 * @returns {number} [returns.data.venueLongitude] - 球厅经度
 * @returns {number} [returns.data.venueLatitude] - 球厅纬度
 * @returns {number} returns.data.serviceType - 服务类型：1=台球陪练 2=陪游
 * @returns {number} returns.data.bookingTime - 预约服务开始时间（毫秒时间戳）
 * @returns {number} returns.data.serviceDuration - 预定总时长（分钟）
 * @returns {number} returns.data.status - 订单状态
 * @returns {number} returns.data.payAmount - 实际支付金额（分）
 * @returns {number} returns.data.extraPayAmount - 加钟累计支付金额（分）
 * @returns {number} returns.data.totalAmount - 订单总金额（分）
 * @returns {number} returns.data.createTime - 下单时间（毫秒时间戳）
 * @returns {number} returns.data.payStatus - 支付状态：0=未支付 10=支付成功 20=已退款 30=支付关闭
 */
export function getOrderDetail(params) {
  return request({
    url: '/app-api/billiard/order/get',
    method: 'get',
    params
  })
}