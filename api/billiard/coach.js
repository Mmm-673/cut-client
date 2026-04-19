import request from '@/utils/request'

/**
 * 获取在线助教分页列表
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码，默认 1
 * @param {number} [params.pageSize=20] - 每页数量，默认 20
 * @param {string} [params.keyword] - 关键词，匹配艺名或球厅名称
 * @param {string} [params.city] - 城市筛选（如"杭州市"）
 * @param {number} [params.level] - 技术等级：0=初级 1=中级 2=高级
 * @param {string} [params.tag] - 标签筛选（如：新人、免费出行），枚举值待运营确认
 * @param {number} [params.longitude] - 用户当前经度（用于距离排序）
 * @param {number} [params.latitude] - 用户当前纬度（用于距离排序）
 * @returns {Promise<Object>} 返回助教列表数据
 * @returns {Array} returns.data.list - 助教列表
 * @returns {number} returns.data.total - 总数
 */
export function getCoachList(params) {
  return request({
    url: '/app-api/billiard/coach/list',
    method: 'get',
    params
  })
}

/**
 * 获取助教详情
 * @param {Object} params - 请求参数
 * @param {number} params.id - 助教ID (billiard_coach.id)
 * @returns {Promise<Object>} 返回助教详情数据
 * @returns {number} returns.data.id - 助教ID
 * @returns {string} returns.data.stageName - 艺名
 * @returns {number} [returns.data.age] - 年龄
 * @returns {string} [returns.data.constellation] - 星座
 * @returns {number} [returns.data.height] - 身高（cm）
 * @returns {number} [returns.data.weight] - 体重（kg）
 * @returns {string} [returns.data.profession] - 职业
 * @returns {number} returns.data.level - 助教级别：0=初级 1=中级 2=高级
 * @returns {number} returns.data.serviceCount - 累计服务次数
 * @returns {number} returns.data.overallScore - 综合评分
 * @returns {string} [returns.data.introduction] - 简介
 * @returns {Array} [returns.data.photos] - 照片列表（对象数组）
 * @returns {number} returns.data.photos[].id - 照片ID
 * @returns {string} returns.data.photos[].photoUrl - 照片URL
 * @returns {number} returns.data.photos[].sort - 排序值
 * @returns {boolean} returns.data.photos[].isMain - 是否主图
 */
export function getCoachDetail(params) {
  return request({
    url: '/app-api/billiard/coach/get',
    method: 'get',
    params
  })
}

/**
 * 获取新人助教列表
 * @param {Object} params - 请求参数
 * @param {number} [params.limit=10] - 返回数量，默认 10
 * @returns {Promise<Object>} 返回新人助教列表
 */
export function getNewCoachList(params) {
  return request({
    url: '/app-api/billiard/coach/new-list',
    method: 'get',
    params
  })
}

/**
 * 获取热门助教列表
 * @param {Object} params - 请求参数
 * @param {number} [params.limit=10] - 返回数量，默认 10
 * @returns {Promise<Object>} 返回热门助教列表
 */
export function getHotCoachList(params) {
  return request({
    url: '/app-api/billiard/coach/hot-list',
    method: 'get',
    params
  })
}

/**
 * 创建打赏支付单
 * @param {Object} data - 请求参数
 * @param {number} data.coachId - 助教ID（billiard_coach.id）
 * @param {number} data.amount - 打赏金额（单位：分），必须大于 0
 * @returns {Promise<Object>} 返回创建结果
 * @returns {number} returns.data.payOrderId - pay_order.id（前端用于拉起支付）
 */
export function createRewardOrder(data) {
  return request({
    url: '/app-api/billiard/reward/create',
    method: 'post',
    data
  })
}

/**
 * 提交打赏支付
 * @param {Object} data - 请求参数
 * @param {number} data.payOrderId - 支付单ID（pay_order.id）
 * @param {string} data.channelCode - 支付渠道编码：wx_pub（微信小程序）、wx_app（微信App）、alipay_app（支付宝App）、wallet（钱包）
 * @returns {Promise<Object>} 返回支付参数
 */
export function submitRewardPay(data) {
  return request({
    url: '/app-api/billiard/reward/pay',
    method: 'post',
    data
  })
}

/**
 * 提交评价
 * @param {Object} data - 请求参数
 * @param {number} data.orderId - 订单ID（billiard_order.id）
 * @param {number} data.star - 星级评分（1~5）
 * @param {string} [data.content] - 评价文字描述
 * @param {string} [data.tags] - 预设标签（逗号分隔，如：专业,准时）
 * @param {Array<string>} [data.images] - 图片 URL 数组（最多9张）
 * @param {boolean} [data.isAnonymous] - 是否匿名评价，默认 false
 * @returns {Promise<Object>} 返回提交结果
 */
export function createReview(data) {
  return request({
    url: '/app-api/billiard/review/create',
    method: 'post',
    data
  })
}

/**
 * 上传评价图片
 * @param {string} filePath - 图片文件路径
 * @returns {Promise<Object>} 返回上传结果
 * @returns {string} returns.data.url - 图片 URL
 */
export function uploadReviewImage(filePath) {
  return request({
    url: '/app-api/billiard/review/upload-image',
    method: 'post',
    filePath,
    name: 'file'
  })
}

/**
 * 助教列表单条数据结构（用于参考）
 * @typedef {Object} CoachItem
 * @property {number} id - 助教ID
 * @property {string} stageName - 艺名
 * @property {string} [mainPhotoUrl] - 主图 URL
 * @property {number} level - 助教级别：0=初级 1=中级 2=高级
 * @property {number} serviceCount - 累计服务次数
 * @property {number} overallScore - 综合评分
 * @property {number|null} [distance] - 与用户的距离（km），未传经纬度时返回 null
 * @property {string} [tags] - 标签列表（逗号分隔，如：新人、免费出行）
 */
