import request from '@/utils/request'

/**
 * 获取我的订单列表
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码
 * @param {number} [params.pageSize=10] - 每页数量
 * @param {number} [params.status] - 状态筛选；不传则返回所有状态
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
 * @param {number} params.id - 订单ID
 */
export function getOrderDetail(params) {
  return request({
    url: '/app-api/billiard/order/get',
    method: 'get',
    params
  })
}