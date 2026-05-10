import request from '@/utils/request'

/**
 * 获取应用已开启支付渠道编码列表
 * @param {Object} params - 请求参数
 * @param {number} params.appId - 支付应用编号
 * @returns {Promise<Object>} 返回支付渠道编码列表
 * @returns {Array<string>} returns.data - 支付渠道编码列表
 */
export function getEnableChannelCodeList(params) {
  return request({
    url: '/app-api/pay/channel/get-enable-code-list',
    method: 'get',
    params
  })
}

/**
 * 提交支付订单
 * @param {Object} data - 请求参数
 * @param {number} data.id - 支付单编号
 * @param {string} data.channelCode - 支付渠道编码
 * @param {Object} [data.channelExtras] - 渠道额外参数
 * @param {string} [data.displayMode] - 展示模式
 * @param {string} [data.returnUrl] - 支付完成后回跳地址
 * @returns {Promise<Object>} 返回支付结果
 * @returns {number} returns.data.status - 支付状态
 * @returns {string} returns.data.displayMode - 展示模式
 * @returns {string} returns.data.displayContent - 展示内容
 */
export function submitPayOrder(data) {
  return request({
    url: '/app-api/pay/order/submit',
    method: 'post',
    data
  })
}

/**
 * 查询支付订单
 * @param {Object} params - 请求参数
 * @param {number} [params.id] - 支付单编号
 * @param {string} [params.no] - 支付订单号
 * @param {boolean} [params.sync] - 是否同步渠道状态
 * @returns {Promise<Object>} 返回支付订单详情
 */
export function getPayOrder(params) {
  return request({
    url: '/app-api/pay/order/get',
    method: 'get',
    params
  })
}