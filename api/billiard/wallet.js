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

/**
 * 查询可提现本金余额
 * @returns {Promise<Object>} 返回余额信息
 * @returns {number} returns.data.walletId - 钱包编号
 * @returns {number} returns.data.walletBalance - 钱包可用余额（分）
 * @returns {number} returns.data.walletFreezePrice - 钱包冻结金额（分）
 * @returns {number} returns.data.withdrawableAmount - 可提现充值本金余额（分）
 * @returns {number} returns.data.frozenAmount - 提现冻结本金（分）
 * @returns {number} returns.data.availableWithdrawAmount - 当前可申请提现金额（分）
 */
export function getWithdrawableBalance() {
  return request({
    url: '/app-api/billiard/wallet/withdrawable-balance',
    method: 'get'
  })
}

/**
 * 创建用户余额提现
 * @param {Object} data - 请求参数
 * @param {number} data.withdrawAmount - 提现金额（分），必须大于0且不超过可申请提现金额
 * @param {number} data.accountType - 收款账号类型：1=微信，2=支付宝
 * @param {string} data.accountNo - 微信openid或支付宝账号
 * @param {string} [data.realName] - 真实姓名；支付宝建议填写，微信小额转账可为空
 *
 * 业务规则：
 * - 同一用户同一时间只允许存在一笔处理中提现
 * - withdrawAmount 不能超过 walletBalance - walletFreezePrice
 * - withdrawAmount 不能超过 withdrawableAmount
 * - 提现创建成功后状态为 PROCESSING (0)，最终状态由 pay 转账通知更新为 SUCCESS (1) 或 FAILED (2)
 *
 * @returns {Promise<Object>} 返回提现申请ID
 * @returns {number} returns.data - 提现申请编号
 */
export function createWithdrawal(data) {
  return request({
    url: '/app-api/billiard/wallet/withdrawal/create',
    method: 'post',
    data
  })
}

/**
 * 查询用户余额提现记录
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码，默认1
 * @param {number} [params.pageSize=10] - 每页数量，默认10
 * @param {number} [params.status] - 提现状态：0=处理中，1=成功，2=失败
 *
 * @returns {Promise<Object>} 返回提现记录列表
 * @returns {number} returns.data.total - 总记录数
 * @returns {Array} returns.data.list - 提现记录数组
 * @returns {number} returns.data.list[].id - 提现申请编号
 * @returns {number} returns.data.list[].withdrawAmount - 提现金额（分）
 * @returns {number} returns.data.list[].accountType - 收款账号类型
 * @returns {string} returns.data.list[].accountNo - 脱敏后的收款账号
 * @returns {number} returns.data.list[].status - 提现状态
 * @returns {string} returns.data.list[].statusName - 状态名称
 * @returns {string} returns.data.list[].transferErrorMsg - 失败原因
 * @returns {number} returns.data.list[].applyTime - 申请时间，毫秒时间戳
 * @returns {number} returns.data.list[].payTime - 到账时间，毫秒时间戳
 */
export function getWithdrawalPage(params) {
  return request({
    url: '/app-api/billiard/wallet/withdrawal/page',
    method: 'get',
    params
  })
}

export default {
  getWallet,
  getWalletTransactions,
  getWalletTransactionSummary,
  getWithdrawableBalance,
  createWithdrawal,
  getWithdrawalPage
}
