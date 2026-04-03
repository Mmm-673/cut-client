import request from '@/utils/request'

/**
 * 获取在线助教分页列表
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码
 * @param {number} [params.pageSize=20] - 每页数量
 * @param {string} [params.keyword] - 关键词，匹配艺名
 * @param {number} [params.level] - 技术等级：0=初级 1=中级 2=高级
 * @param {string} [params.tag] - 标签筛选（如：新人、免费出行）
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
 * @param {number} params.id - 助教ID
 * @returns {Promise<Object>} 返回助教详情数据
 * @returns {number} returns.data.id - 助教ID
 * @returns {string} returns.data.stageName - 艺名
 * @returns {number} returns.data.level - 助教级别（0/1/2）
 * @returns {number} returns.data.serviceCount - 累计服务次数
 * @returns {number} returns.data.overallScore - 综合评分
 * @returns {string} returns.data.introduction - 简介
 * @returns {Array} returns.data.photos - 照片列表（含 id、photoUrl、sort、isMain）
 */
export function getCoachDetail(params) {
  return request({
    url: '/app-api/billiard/coach/get',
    method: 'get',
    params
  })
}

/**
 * 助教列表单条数据结构（用于参考）
 * @typedef {Object} CoachItem
 * @property {number} id - 助教ID
 * @property {string} stageName - 艺名
 * @property {string} mainPhotoUrl - 主图 URL
 * @property {number} level - 助教级别（0/1/2）
 * @property {number} serviceCount - 累计服务次数
 * @property {number} overallScore - 综合评分
 * @property {number|null} distance - 与用户的距离（km），未传经纬度时返回 null
 * @property {Array<string>} tags - 标签列表（如：新人、免费出行）
 */
