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
