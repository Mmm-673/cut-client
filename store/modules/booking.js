import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 预约流程状态管理
 *
 * 用于在预约流程各页面间传递数据，替代之前使用 Storage 直接传参的方式。
 * Storage 作为兜底（刷新/杀进程后恢复），每次 set 时同步写入。
 *
 * 数据流：
 * 教练列表/收藏页 → setSelectedCoach → 教练详情 → 球厅选择 → 确认订单 → 支付成功
 */

const STORAGE_KEYS = {
  SELECTED_COACH: 'selectedCoach',
  CREATED_ORDER: 'createdOrderData',
  RESELECT_PARAMS: 'reselectParams',
}

export const useBookingStore = defineStore('booking', () => {
  // ===== State =====

  /** 选中的教练信息（含 selectedService） */
  const selectedCoach = ref(null)
  /** 已创建的订单数据（支付成功页用） */
  const createdOrder = ref(null)
  /** 重新选择球厅时回传的参数 */
  const reselectParams = ref(null)

  // ===== Actions =====

  /**
   * 设置选中的教练信息
   * @param {Object|null} coach - 教练信息对象，传 null 清除
   */
  const setSelectedCoach = (coach) => {
    selectedCoach.value = coach
    if (coach) {
      uni.setStorageSync(STORAGE_KEYS.SELECTED_COACH, coach)
    } else {
      uni.removeStorageSync(STORAGE_KEYS.SELECTED_COACH)
    }
  }

  /**
   * 设置已创建的订单数据
   * @param {Object|null} order - 订单数据对象，传 null 清除
   */
  const setCreatedOrder = (order) => {
    createdOrder.value = order
    if (order) {
      uni.setStorageSync(STORAGE_KEYS.CREATED_ORDER, order)
    } else {
      uni.removeStorageSync(STORAGE_KEYS.CREATED_ORDER)
    }
  }

  /**
   * 设置重新选择球厅的回传参数
   * @param {Object|null} params - 回传参数，传 null 清除
   */
  const setReselectParams = (params) => {
    reselectParams.value = params
    if (params) {
      uni.setStorageSync(STORAGE_KEYS.RESELECT_PARAMS, params)
    } else {
      uni.removeStorageSync(STORAGE_KEYS.RESELECT_PARAMS)
    }
  }

  /**
   * 从 Storage 恢复所有预约数据（App 启动/页面刷新时调用）
   */
  const restoreFromStorage = () => {
    try {
      const coach = uni.getStorageSync(STORAGE_KEYS.SELECTED_COACH)
      if (coach && Object.keys(coach).length > 0) {
        selectedCoach.value = coach
      }

      const order = uni.getStorageSync(STORAGE_KEYS.CREATED_ORDER)
      if (order && Object.keys(order).length > 0) {
        createdOrder.value = order
      }

      const params = uni.getStorageSync(STORAGE_KEYS.RESELECT_PARAMS)
      if (params && Object.keys(params).length > 0) {
        reselectParams.value = params
      }
    } catch (e) {
      console.warn('[BookingStore] 从 Storage 恢复数据失败:', e)
    }
  }

  /**
   * 清空所有预约数据（预约完成/取消时调用）
   */
  const clearAll = () => {
    selectedCoach.value = null
    createdOrder.value = null
    reselectParams.value = null

    uni.removeStorageSync(STORAGE_KEYS.SELECTED_COACH)
    uni.removeStorageSync(STORAGE_KEYS.CREATED_ORDER)
    uni.removeStorageSync(STORAGE_KEYS.RESELECT_PARAMS)
  }

  return {
    // state
    selectedCoach,
    createdOrder,
    reselectParams,
    // actions
    setSelectedCoach,
    setCreatedOrder,
    setReselectParams,
    restoreFromStorage,
    clearAll,
  }
})
