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
 * @returns {string} returns.data.list[].coachStageName - 裁教艺名
 * @returns {string} [returns.data.list[].coachMainPhoto] - 裁教主图 URL
 * @returns {number} returns.data.list[].serviceType - 服务类型：1=台球陪练 2=达人带路
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
 * @returns {number} returns.data.coachId - 裁教ID
 * @returns {string} returns.data.coachStageName - 裁教艺名
 * @returns {string} [returns.data.coachMainPhoto] - 裁教主图 URL
 * @returns {string} [returns.data.venueName] - 球厅名称
 * @returns {string} [returns.data.venueAddress] - 球厅地址
 * @returns {number} [returns.data.venueLongitude] - 球厅经度
 * @returns {number} [returns.data.venueLatitude] - 球厅纬度
 * @returns {number} returns.data.serviceType - 服务类型：1=台球陪练 2=达人带路
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

/**
 * 创建订单
 * @param {Object} data - 请求参数
 * @param {number} data.coachId - 裁教ID（billiard_coach.id），必须为在线状态
 * @param {number} data.serviceType - 服务类型：1=台球陪练 2=达人带路
 * @param {number} data.bookingTime - 预约服务开始时间（毫秒时间戳）
 * @param {number} data.serviceDuration - 预定时长（分钟），台球陪练 >= 120，达人带路 >= 300
 * @param {number} data.quantity - 份数或小时数，用于金额计算
 * @param {number} [data.serviceItemId] - 选中的服务项目ID，用于确定价格
 * @param {number} [data.venueId] - 台球陪练可传合作球厅ID；达人带路不强制
 * @param {string} [data.venueName] - 服务地址名称（球厅或达人带路约定地点）
 * @param {string} [data.venueAddress] - 服务地址文本，达人带路场景可由前端约定地点回填
 * @param {number} [data.venueLongitude] - 服务地址经度，用于导航与车费测算
 * @param {number} [data.venueLatitude] - 服务地址纬度，用于导航与车费测算
 * @param {number} [data.couponId] - 使用的优惠券ID；不使用则不传
 * @param {string} [data.remark] - 备注，最长 500 字符
 *
 * @returns {Promise<Object>} 返回创建订单结果
 * @returns {number} returns.data.orderId - billiard_order.id
 * @returns {string} returns.data.orderNo - 订单号，展示用
 * @returns {number} returns.data.payOrderId - pay_order.id（前端调用 /app-api/billiard/order/mock-pay 拉起支付时需要此 ID）
 * @returns {number} returns.data.expireTime - 支付截止时间（毫秒时间戳），前端倒计时展示
 * @returns {number} returns.data.serviceAmount - 服务时长费用（分）
 * @returns {number} returns.data.travelAmount - 车费原价（分）
 * @returns {number} returns.data.travelDiscountAmount - 车费优惠（分，开关关闭时大于0）
 * @returns {number} returns.data.payAmount - 实际应付金额（分）
 */
export function createOrder(data) {
  return request({
    url: '/app-api/billiard/order/create',
    method: 'post',
    data
  })
}


/**
 * 取消订单
 * @param {Object} data - 请求参数
 * @param {number} data.orderId - 订单ID (billiard_order.id)
 *
 * 业务校验：
 * - 订单归属当前登录用户
 * - 当前状态必须为 PENDING_PAYMENT / PENDING_ACCEPT / ACCEPTED（进行中 IN_SERVICE 不可取消）
 * - IN_SERVICE 状态返回业务异常："服务进行中，无法取消订单，如有纠纷请联系客服"
 *
 * @returns {Promise<Object>} 返回取消结果
 */
export function cancelOrder(data) {
  return request({
    url: '/app-api/billiard/order/cancel',
    method: 'post',
    data
  })
}

/**
 * 加钟 - 申请延长服务时长并发起支付
 * @param {Object} data - 请求参数
 * @param {number} data.orderId - billiard_order.id
 * @param {number} data.addMinutes - 加钟时长（分钟），必须为正整数
 *
 * 业务校验：
 * - 订单归属当前登录用户
 * - 订单状态必须为 IN_SERVICE (40)
 * - addMinutes > 0
 *
 * @returns {Promise<Object>} 返回加钟结果
 * @returns {number} returns.data.payOrderId - 加钟支付单 ID（pay_order.id，前端用于拉起支付）
 * @returns {number} returns.data.addAmount - 本次加钟金额（分）
 * @returns {number} returns.data.expireTime - 加钟支付单过期时间（毫秒时间戳）
 */
export function addTimeOrder(data) {
  return request({
    url: '/app-api/billiard/order/add-time',
    method: 'post',
    data
  })
}

/**
 * 删除订单
 * @param {Object} data - 请求参数
 * @param {number} data.orderId - 订单ID (billiard_order.id)
 *
 * 业务校验：
 * - 订单归属当前登录用户
 * - 订单状态必须为 CANCELLED (70)
 *
 * @returns {Promise<Object>} 返回删除结果
 */
export function deleteOrder(data) {
  return request({
    url: '/app-api/billiard/order/delete',
    method: 'post',
    data
  })
}

export default {
  getOrderList,
  getOrderDetail,
  createOrder,
  cancelOrder,
  addTimeOrder,
  deleteOrder
}