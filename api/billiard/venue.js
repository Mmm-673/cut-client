import request from '@/utils/request'

/**
 * 获取合作球厅列表
 * @param {Object} params - 请求参数
 * @param {string} [params.keyword] - 搜索关键字，匹配球厅名称
 * @param {number} [params.longitude] - 用户当前经度，用于计算距离
 * @param {number} [params.latitude] - 用户当前纬度，用于计算距离
 * @param {number} [params.sortType] - 排序类型：1=距离最近, 2=价格最低, 3=评分最高
 * @param {string} [params.features] - 设施标签筛选，多个标签用逗号分隔
 * @param {number} [params.pageNo=1] - 页码，默认 1
 * @param {number} [params.pageSize=10] - 每页数量，默认 10
 *
 * @returns {Promise<Object>} 返回球厅列表数据
 * @returns {Array} returns.data.list - 球厅列表
 * @returns {number} returns.data.list[].id - 球厅 ID
 * @returns {string} returns.data.list[].name - 球厅名称
 * @returns {string} [returns.data.list[].coverImageUrl] - 封面图 URL
 * @returns {number} returns.data.list[].price - 价格（分/小时起）
 * @returns {number} returns.data.list[].score - 评分
 * @returns {number} returns.data.list[].reviewCount - 评价数
 * @returns {string} [returns.data.list[].tags] - 标签（逗号分隔）
 * @returns {string} [returns.data.list[].facilityTags] - 设施标签（逗号分隔）
 * @returns {string} [returns.data.list[].promotionText] - 优惠信息
 * @returns {string} [returns.data.list[].phone] - 联系电话
 * @returns {string} returns.data.list[].address - 详细地址
 * @returns {number} returns.data.list[].longitude - 经度
 * @returns {number} returns.data.list[].latitude - 纬度
 * @returns {string} [returns.data.list[].advantage] - 门店优势说明
 * @returns {number} [returns.data.list[].distance] - 距离（km），仅当传入经纬度时返回
 */
export function getVenueList(params) {
  return request({
    url: '/app-api/billiard/venue/list',
    method: 'get',
    params
  })
}

/**
 * 获取球厅详情
 * @param {Object} params - 请求参数
 * @param {number} params.id - 球厅ID
 *
 * @returns {Promise<Object>} 返回球厅详情数据
 */
export function getVenueDetail(params) {
  return request({
    url: '/app-api/billiard/venue/get',
    method: 'get',
    params
  })
}

export default {
  getVenueList,
  getVenueDetail
}