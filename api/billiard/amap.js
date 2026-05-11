import request from '@/utils/request'

/**
 * 逆地址解析 - 根据经纬度获取地址信息
 * @param {Object} params - 请求参数
 * @param {string|number} params.longitude - 经度
 * @param {string|number} params.latitude - 纬度
 *
 * @returns {Promise<Object>} 返回地址信息
 * @returns {string} returns.data.province - 省份
 * @returns {string} returns.data.city - 城市
 * @returns {string} returns.data.district - 区/县
 * @returns {string} returns.data.township - 街道/乡镇
 * @returns {string} returns.data.street - 街/路
 * @returns {string} returns.data.streetNumber - 门牌号
 * @returns {string} returns.data.formattedAddress - 格式化地址
 * @returns {string} returns.data.nearestPoiName - 最近POI名称
 * @returns {number} returns.data.nearestPoiDistance - 最近POI距离（米）
 */
export function regeocode(params) {
  return request({
    url: '/app-api/billiard/amap/regeocode',
    method: 'get',
    params
  })
}

export default {
  regeocode
}