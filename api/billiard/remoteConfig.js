import request from '@/utils/request'

/**
 * 获取公开远程配置
 * 鉴权：免登录，不需要 Authorization Token；仍需携带 tenant-id
 * @returns {Promise<Object>} 返回当前租户全部有效配置组成的字符串 Map
 * @returns {Object} returns.data - 配置键值对，key 按升序返回；无配置时返回空对象 {}
 */
export function getRemoteConfig() {
  return request({
    url: '/app-api/billiard/remote-config',
    method: 'get',
    headers: { isToken: false }
  })
}