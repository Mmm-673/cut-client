import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 通知相关状态管理
 * - 未读消息数量
 * - 消息列表缓存
 * - 推送消息处理
 */
export const useNotificationStore = defineStore('notification', () => {
  // 未读消息总数
  const unreadCount = ref(0)

  // 系统通知列表
  const systemList = ref([])
  // 订单通知列表
  const orderList = ref([])
  // 活动通知列表
  const activityList = ref([])

  // 通知是否已加载
  const loaded = ref(false)
  const loading = ref(false)

  // ---- Getters ----
  const hasUnread = computed(() => unreadCount.value > 0)
  const systemUnread = computed(() => systemList.value.filter(n => !n.read).length)
  const orderUnread = computed(() => orderList.value.filter(n => !n.read).length)
  const activityUnread = computed(() => activityList.value.filter(n => !n.read).length)

  // ---- Actions ----

  /**
   * 设置未读消息总数
   */
  function setUnreadCount(count) {
    unreadCount.value = Math.max(0, parseInt(count) || 0)
  }

  /**
   * 增加未读消息数
   */
  function incrementUnread(count = 1) {
    unreadCount.value += count
  }

  /**
   * 减少未读消息数
   */
  function decrementUnread(count = 1) {
    unreadCount.value = Math.max(0, unreadCount.value - count)
  }

  /**
   * 清空未读消息数
   */
  function clearUnread() {
    unreadCount.value = 0
  }

  /**
   * 添加系统通知
   */
  function addSystemNotification(notification) {
    const item = {
      id: Date.now(),
      read: false,
      time: new Date().toISOString(),
      ...notification
    }
    systemList.value.unshift(item)
    if (!item.read) {
      incrementUnread()
    }
    return item
  }

  /**
   * 添加订单通知
   */
  function addOrderNotification(notification) {
    const item = {
      id: Date.now(),
      read: false,
      time: new Date().toISOString(),
      ...notification
    }
    orderList.value.unshift(item)
    if (!item.read) {
      incrementUnread()
    }
    return item
  }

  /**
   * 添加活动通知
   */
  function addActivityNotification(notification) {
    const item = {
      id: Date.now(),
      read: false,
      time: new Date().toISOString(),
      ...notification
    }
    activityList.value.unshift(item)
    if (!item.read) {
      incrementUnread()
    }
    return item
  }

  /**
   * 标记某类型通知全部已读
   */
  function markAllRead(type = 'all') {
    let readCount = 0
    if (type === 'all' || type === 'system') {
      const before = systemUnread.value
      systemList.value = systemList.value.map(n => ({ ...n, read: true }))
      readCount += before
    }
    if (type === 'all' || type === 'order') {
      const before = orderUnread.value
      orderList.value = orderList.value.map(n => ({ ...n, read: true }))
      readCount += before
    }
    if (type === 'all' || type === 'activity') {
      const before = activityUnread.value
      activityList.value = activityList.value.map(n => ({ ...n, read: true }))
      readCount += before
    }
    if (readCount > 0) {
      decrementUnread(readCount)
    }
  }

  /**
   * 标记单条通知为已读
   */
  function markAsRead(id, type = 'system') {
    const listMap = {
      system: systemList,
      order: orderList,
      activity: activityList
    }
    const list = listMap[type]
    if (!list) return

    const idx = list.value.findIndex(n => n.id === id)
    if (idx >= 0 && !list.value[idx].read) {
      list.value[idx] = { ...list.value[idx], read: true }
      decrementUnread()
    }
  }

  /**
   * 清空所有通知
   */
  function clearAll() {
    systemList.value = []
    orderList.value = []
    activityList.value = []
    unreadCount.value = 0
  }

  /**
   * 重置状态（退出登录时调用）
   */
  function reset() {
    unreadCount.value = 0
    systemList.value = []
    orderList.value = []
    activityList.value = []
    loaded.value = false
    loading.value = false
  }

  return {
    // state
    unreadCount,
    systemList,
    orderList,
    activityList,
    loaded,
    loading,
    // getters
    hasUnread,
    systemUnread,
    orderUnread,
    activityUnread,
    // actions
    setUnreadCount,
    incrementUnread,
    decrementUnread,
    clearUnread,
    addSystemNotification,
    addOrderNotification,
    addActivityNotification,
    markAllRead,
    markAsRead,
    clearAll,
    reset,
  }
})
