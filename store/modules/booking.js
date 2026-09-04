import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getVenueList } from '@/api/billiard/venue'
import { createOrder, getOrderDetail, getOrderList } from '@/api/billiard/order'

/**
 * 预约/订单相关状态管理
 * - 订单初始化数据（跨页面传递，替代 Storage）
 * - 选中的球馆
 * - 当前订单详情缓存
 */
export const useBookingStore = defineStore('booking', () => {
  // 订单初始化数据（从教练详情页/球厅选择页传递到确认页）
  const orderInitData = ref(null)

  // 选中的球馆
  const selectedVenue = ref(null)

  // 重新选择球馆的参数（从确认页返回时用）
  const reselectVenueParams = ref(null)

  // 当前订单详情缓存
  const currentOrder = ref(null)
  const currentOrderId = ref(null)
  const orderLoading = ref(false)

  // ---- Getters ----
  const hasOrderInitData = computed(() => orderInitData.value != null)
  const hasSelectedVenue = computed(() => selectedVenue.value != null)
  const hasCurrentOrder = computed(() => currentOrder.value != null)
  const hasReselectVenueParams = computed(() => reselectVenueParams.value != null)

  // ---- Actions ----

  /**
   * 设置订单初始化数据（替代 uni.setStorageSync('createdOrderData', ...)）
   */
  function setOrderInitData(data) {
    orderInitData.value = data ? { ...data } : null
    // 同步到 Storage 作为降级方案
    if (data) {
      uni.setStorageSync('createdOrderData', data)
    } else {
      uni.removeStorageSync('createdOrderData')
    }
  }

  /**
   * 从 Storage 恢复订单初始化数据
   */
  function restoreOrderInitData() {
    try {
      const cached = uni.getStorageSync('createdOrderData')
      if (cached) {
        orderInitData.value = cached
        return cached
      }
    } catch (e) {
      console.warn('恢复订单初始化数据失败:', e)
    }
    return null
  }

  /**
   * 清空订单初始化数据
   */
  function clearOrderInitData() {
    orderInitData.value = null
    uni.removeStorageSync('createdOrderData')
  }

  /**
   * 设置选中的球馆（替代 Storage 传参）
   */
  function setSelectedVenue(venue) {
    selectedVenue.value = venue ? { ...venue } : null
  }

  /**
   * 清空选中的球馆
   */
  function clearSelectedVenue() {
    selectedVenue.value = null
  }

  /**
   * 设置重新选择球馆的参数（替代 uni.setStorageSync('reselectParams', ...)）
   */
  function setReselectVenueParams(params) {
    reselectVenueParams.value = params ? { ...params } : null
    // 同步到 Storage 作为降级方案
    if (params) {
      uni.setStorageSync('reselectParams', params)
    } else {
      uni.removeStorageSync('reselectParams')
    }
  }

  /**
   * 从 Storage 恢复重新选择球馆的参数
   */
  function restoreReselectVenueParams() {
    try {
      const cached = uni.getStorageSync('reselectParams')
      if (cached) {
        reselectVenueParams.value = cached
        return cached
      }
    } catch (e) {
      console.warn('恢复重选球馆参数失败:', e)
    }
    return null
  }

  /**
   * 消费（读取并清除）重新选择球馆的参数
   */
  function consumeReselectVenueParams() {
    const params = reselectVenueParams.value
    reselectVenueParams.value = null
    uni.removeStorageSync('reselectParams')
    return params
  }

  /**
   * 加载订单详情
   */
  async function loadOrderDetail(orderId, force = false) {
    if (!orderId) return null
    // 如果已缓存且不强制刷新，直接返回
    if (currentOrderId.value === orderId && currentOrder.value && !force) {
      return currentOrder.value
    }

    orderLoading.value = true
    try {
      const res = await getOrderDetail({ orderId })
      const data = res.data || {}
      currentOrderId.value = orderId
      currentOrder.value = data
      return data
    } catch (error) {
      console.error('加载订单详情失败:', error)
      throw error
    } finally {
      orderLoading.value = false
    }
  }

  /**
   * 清空当前订单缓存
   */
  function clearCurrentOrder() {
    currentOrder.value = null
    currentOrderId.value = null
  }

  /**
   * 创建订单
   */
  async function createNewOrder(orderData) {
    try {
      const res = await createOrder(orderData)
      const data = res.data || {}
      // 创建成功后更新当前订单
      if (data.orderId) {
        currentOrderId.value = data.orderId
        currentOrder.value = data
      }
      return data
    } catch (error) {
      console.error('创建订单失败:', error)
      throw error
    }
  }

  return {
    // state
    orderInitData,
    selectedVenue,
    reselectVenueParams,
    currentOrder,
    currentOrderId,
    orderLoading,
    // getters
    hasOrderInitData,
    hasSelectedVenue,
    hasReselectVenueParams,
    hasCurrentOrder,
    // actions
    setOrderInitData,
    restoreOrderInitData,
    clearOrderInitData,
    setSelectedVenue,
    clearSelectedVenue,
    setReselectVenueParams,
    restoreReselectVenueParams,
    consumeReselectVenueParams,
    loadOrderDetail,
    clearCurrentOrder,
    createNewOrder,
  }
})
