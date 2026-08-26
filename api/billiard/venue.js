import request from '@/utils/request'

/**
 * 获取合作球厅列表（分页）
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码，默认 1
 * @param {number} [params.pageSize=10] - 每页数量，默认 10
 * @param {string} [params.keyword] - 搜索关键字，匹配球厅名称
 * @param {number} [params.longitude] - 用户当前经度（WGS-84），必须与 latitude 同时传或同时不传
 * @param {number} [params.latitude] - 用户当前纬度（WGS-84）
 * @param {number} [params.radius=5] - 搜索半径，单位 km，范围 1~50，仅在传入经纬度时生效
 * @param {number} [params.sortType] - 排序类型：1=距离最近, 2=价格最低, 3=评分最高
 * @param {string} [params.features] - 设施标签筛选，多个标签用逗号分隔
 *
 * @returns {Promise<Object>} 返回球厅列表数据
 * @returns {number} returns.code - 0 成功，其他值失败
 * @returns {Object} returns.data - 分页数据
 * @returns {number} returns.data.total - 总条数
 * @returns {Array} returns.data.list - 球厅列表（数组）
 * @returns {number} returns.data.list[].id - 球厅 ID
 * @returns {string} returns.data.list[].name - 球厅名称
 * @returns {string} [returns.data.list[].coverImageUrl] - 封面图 URL
 * @returns {number} returns.data.list[].price - 价格（分/小时起），source=1 时默认 0
 * @returns {number} returns.data.list[].score - 评分，0.00~5.00，source=1 时默认 5.00
 * @returns {number} returns.data.list[].reviewCount - 评价数，source=1 时默认 0
 * @returns {string} [returns.data.list[].tags] - 标签（逗号分隔）
 * @returns {string} [returns.data.list[].facilityTags] - 设施标签（逗号分隔）
 * @returns {string} [returns.data.list[].promotionText] - 优惠信息
 * @returns {Array} [returns.data.list[].phones] - 联系电话数组
 * @returns {string} returns.data.list[].address - 详细地址
 * @returns {number} [returns.data.list[].distance] - 距离（km），仅当传入经纬度时返回
 * @returns {number} returns.data.list[].source - 数据来源：0=平台自维护, 1=高德同步
 */
export function getVenueList(params) {
  return request({
    url: '/app-api/billiard/venue/page',
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

/**
 * 搜索服务地点（高德地图输入提示）
 * @param {Object} params - 请求参数
 * @param {string} params.keywords - 用户输入的地点关键词
 * @param {string} params.city - 当前城市名称或行政区编码，用于限制高德只返回该城市结果
 *
 * @returns {Promise<Object>} 返回搜索结果
 * @returns {Array} returns.data - 搜索结果列表
 * @returns {string} returns.data[].name - 地点名称
 * @returns {string} returns.data[].address - 地点地址
 * @returns {number} returns.data[].longitude - 经度
 * @returns {number} returns.data[].latitude - 纬度
 * @returns {string} returns.data[].selectionToken - 地点选择凭证
 */
export function searchServicePlace(params) {
  return request({
    url: '/app-api/billiard/amap/inputtips',
    method: 'get',
    params
  })
}

export default {
  getVenueList,
  getVenueDetail,
  searchServicePlace
}
