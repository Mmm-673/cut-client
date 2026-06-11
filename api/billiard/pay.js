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
    data,
    timeout: 30000 // 单独设置超时时间为 30 秒
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

/**
 * 获取钱包充值套餐列表
 * @returns {Promise<Object>} 返回套餐列表
 * @returns {Array} returns.data - 套餐数组
 * @returns {number} returns.data[].id - 套餐编号
 * @returns {string} returns.data[].name - 套餐名
 * @returns {number} returns.data[].payPrice - 支付金额（分）
 * @returns {number} returns.data[].bonusPrice - 赠送金额（分）
 */
export function getWalletRechargePackages() {
  return request({
    url: '/app-api/pay/wallet-recharge-package/list',
    method: 'get'
  })
}

/**
 * 创建钱包充值记录
 * @param {Object} data - 请求参数
 * @param {number} [data.payPrice] - 自定义支付金额（分），与packageId二选一
 * @param {number} [data.packageId] - 充值套餐编号，与payPrice二选一
 *
 * 参数约束（完整）：
 * - payPrice 与 packageId 不能同时为空（至少传一个）
 *
 * @returns {Promise<Object>} 返回创建结果
 * @returns {number} returns.data.id - 钱包充值记录编号
 * @returns {number} returns.data.payOrderId - 支付订单编号（用于后续调用 /app-api/pay/order/submit 拉起支付）
 */
export function createWalletRecharge(data) {
  return request({
    url: '/app-api/pay/wallet-recharge/create',
    method: 'post',
    data
  })
}

/**
 * 钱包充值记录分页
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码，从1开始，最小1
 * @param {number} [params.pageSize=10] - 每页条数，最小1，最大200
 *
 * @returns {Promise<Object>} 返回充值记录列表
 * @returns {number} returns.data.total - 总记录数
 * @returns {Array} returns.data.list - 充值记录数组
 * @returns {number} returns.data.list[].id - 充值记录编号
 * @returns {number} returns.data.list[].totalPrice - 用户实际到账余额（分）
 * @returns {number} returns.data.list[].payPrice - 实际支付金额（分）
 * @returns {number} returns.data.list[].bonusPrice - 钱包赠送金额（分）
 * @returns {string} returns.data.list[].payChannelCode - 支付成功渠道编码
 * @returns {string} returns.data.list[].payChannelName - 支付渠道名称
 * @returns {number} returns.data.list[].payOrderId - 支付订单编号
 * @returns {string} returns.data.list[].payOrderChannelOrderNo - 渠道外部订单号
 * @returns {string} returns.data.list[].payTime - 订单支付时间
 * @returns {number} returns.data.list[].refundStatus - 退款状态：0=未退款，10=退款成功，20=退款失败
 */
export function getWalletRechargePage(params) {
  return request({
    url: '/app-api/pay/wallet-recharge/page',
    method: 'get',
    params
  })
}

export default {
  getEnableChannelCodeList,
  submitPayOrder,
  getPayOrder,
  getWalletRechargePackages,
  createWalletRecharge,
  getWalletRechargePage
}