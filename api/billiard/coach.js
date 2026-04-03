import request from '@/utils/request'

/**
 * 获取在线助教分页列表
 * @param {Object} params - 请求参数
 * @param {number} [params.pageNo=1] - 页码
 * @param {number} [params.pageSize=20] - 每页数量
 * @param {string} [params.keyword] - 关键词，匹配艺名
 * @param {number} [params.level] - 技术等级：0=初级 1=中级 2=高级
 * @param {string} [params.tag] - 标签筛选（如：新人、免费出行）
 * @param {number} [params.longitude] - 用户当前经度
 * @param {number} [params.latitude] - 用户当前纬度
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
 */
export function getCoachDetail(params) {
  return request({
    url: '/app-api/billiard/coach/get',
    method: 'get',
    params
  })
}
