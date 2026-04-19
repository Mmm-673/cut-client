import request from '@/utils/request'

/**
 * 获取地区树（省/市/区）
 * @returns {Promise<Object>} 返回地区树形数据
 * @returns {Array} returns.data - 地区列表
 */
export function getAreaTree() {
  return request({
    url: '/app-api/system/area/tree',
    method: 'get'
  })
}
