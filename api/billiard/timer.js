import request from '@/utils/request'

/**
 * 查询当前计时状态
 * @param {Object} params - 请求参数
 * @param {number} params.orderId - billiard_order.id
 *
 * 业务校验：订单归属当前登录用户
 *
 * 查询逻辑（BilliardTimerService.getTimerStatus）：
 * 1. 从 Redis 读取 billiard:timer:{orderId}
 * 2. 若 Redis 存在：
 *    - elapsedSeconds = (System.currentTimeMillis() - startTime) / 1000
 *    - 若 status = ENDED：elapsedSeconds = actualDuration * 60（从 billiard_timer_record 读取）
 * 3. 若 Redis 不存在（降级）：
 *    - 从 billiard_timer_record 读取 start_time, end_time, planned_duration, added_duration
 *    - 若 end_time 为空：elapsedSeconds = (当前时间 - start_time).toSeconds()
 *    - 若 end_time 不为空：elapsedSeconds = actualDuration * 60
 *
 * @returns {Promise<Object>} 返回计时状态
 * @returns {number} returns.data.orderId - 订单ID
 * @returns {string} returns.data.startTime - 服务开始时间（服务端时间）
 * @returns {number} returns.data.elapsedSeconds - 已服务秒数（服务端实时计算：now - startTime，ENDED 状态返回 actualDuration * 60）
 * @returns {number} returns.data.plannedDuration - 预定总时长（分钟，含加钟）
 * @returns {number} returns.data.addedDuration - 加钟累计时长（分钟）
 * @returns {number} returns.data.remainingSeconds - 剩余秒数 = (plannedDuration + addedDuration) * 60 - elapsedSeconds；可为负数（超时时）
 * @returns {string} returns.data.status - RUNNING / ENDED
 *
 * 前端展示建议：收到响应后直接替换本地显示值，无需与本地时钟做对账。
 * 对于断网重连场景，下次轮询成功即可获取最新 elapsedSeconds，正常显示。
 */
export function getTimerStatus(params) {
  return request({
    url: '/app-api/billiard/timer/get-status',
    method: 'get',
    params
  })
}

export default {
  getTimerStatus
}
