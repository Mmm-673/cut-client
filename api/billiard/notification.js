import request from '@/utils/request'

/**
 * 分页查询通知列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNo - 页码
 * @param {number} params.pageSize - 每页条数
 * @param {number} [params.readStatus] - 阅读状态：不传=全部、0=未读、1=已读
 * @returns {Promise<Object>} 分页结果
 * @returns {Array} returns.data.records - 通知列表
 * @returns {number} returns.data.total - 总条数
 */
export function getNotificationPage(params) {
  return request({
    url: '/app-api/billiard/notification-center/page',
    method: 'get',
    params
  })
}

/**
 * 获取通知详情
 * @param {number} id - 通知ID
 * @returns {Promise<Object>} 通知详情
 * @returns {number} returns.data.id - 通知ID
 * @returns {number} returns.data.type - 类型：1重大通知、2公告、3活动、4版本更新
 * @returns {string} returns.data.title - 标题
 * @returns {string} returns.data.summary - 摘要
 * @returns {string} returns.data.content - 内容
 * @returns {string} [returns.data.coverUrl] - 封面图
 * @returns {number} returns.data.actionType - 动作类型：0无、1通知详情、2App路由、3HTTPS页面、4应用更新
 * @returns {string} [returns.data.actionValue] - 动作值
 * @returns {boolean} returns.data.topFlag - 是否置顶
 * @returns {string} returns.data.publishTime - 发布时间
 * @returns {number} returns.data.readStatus - 阅读状态：0未读、1已读
 */
export function getNotificationDetail(id) {
  return request({
    url: '/app-api/billiard/notification-center/get',
    method: 'get',
    params: { id }
  })
}

/**
 * 获取未读通知数量
 * @returns {Promise<Object>}
 * @returns {number} returns.data - 未读数
 */
export function getUnreadCount() {
  return request({
    url: '/app-api/billiard/notification-center/unread-count',
    method: 'get'
  })
}

/**
 * 标记单条通知为已读
 * @param {number} id - 通知ID
 * @returns {Promise<Object>}
 */
export function markAsRead(id) {
  return request({
    url: '/app-api/billiard/notification-center/read',
    method: 'post',
    data: { id }
  })
}

/**
 * 标记全部通知为已读
 * @returns {Promise<Object>}
 */
export function markAllAsRead() {
  return request({
    url: '/app-api/billiard/notification-center/read-all',
    method: 'post'
  })
}
