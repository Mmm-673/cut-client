import request from '@/utils/request'

/**
 * 获取钱包余额与累计收支
 * @returns {Promise<Object>} 返回钱包信息
 * @returns {number} returns.data.balance - 钱包余额（分）
 * @returns {number} returns.data.totalExpense - 累计支出（分）
 * @returns {number} returns.data.totalRecharge - 累计充值（分）
 */
export function getWallet() {
  return request({
    url: '/app-api/pay/wallet/get',
    method: 'get'
  })
}

/**
 * 获取钱包流水分页列表
 * @param {Object} params - 请求参数
 * @param {number} params.pageNo - 页码，从 1 开始
 * @param {number} params.pageSize - 每页条数，最大 200
 * @param {number} [params.type] - 流水类型：1=收入，2=支出
 * @param {Array} [params.createTime] - 时间区间 [开始时间, 结束时间]
 * @returns {Promise<Object>} 返回流水分页列表
 */
export function getWalletTransactions(params) {
  return request({
    url: '/app-api/pay/wallet-transaction/page',
    method: 'get',
    params
  })
}

/**
 * 获取钱包流水汇总
 * @param {Object} params - 请求参数
 * @param {Array} params.createTime - 时间区间 [开始时间, 结束时间]
 * @returns {Promise<Object>} 返回流水汇总
 * @returns {number} returns.data.totalExpense - 累计支出（分）
 * @returns {number} returns.data.totalIncome - 累计收入（分）
 */
export function getWalletTransactionSummary(params) {
  return request({
    url: '/app-api/pay/wallet-transaction/get-summary',
    method: 'get',
    params
  })
}