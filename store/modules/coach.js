import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCoachDetail, getCoachReviews, getFavoriteCoachPage } from '@/api/billiard/coach'

/**
 * 教练相关状态管理
 * - 选中的教练信息（跨页面传递，替代 Storage）
 * - 当前查看的教练详情缓存
 * - 收藏列表缓存
 */
export const useCoachStore = defineStore('coach', () => {
  // 当前选中的教练（用于从列表/详情页跳转到球厅选择/预约确认页）
  const selectedCoach = ref(null)

  // 当前查看的教练详情缓存
  const currentCoach = ref(null)
  const currentCoachId = ref(null)
  const coachLoading = ref(false)

  // 当前教练的评价列表
  const reviewList = ref([])

  // 收藏列表缓存
  const favoriteList = ref([])
  const favoriteTotal = ref(0)

  // ---- Getters ----
  const hasSelectedCoach = computed(() => selectedCoach.value != null)
  const hasCurrentCoach = computed(() => currentCoach.value != null)

  // ---- Actions ----

  /**
   * 设置选中的教练（替代 uni.setStorageSync('selectedCoach', ...)）
   */
  function setSelectedCoach(coach) {
    selectedCoach.value = coach ? { ...coach } : null
    // 同步到 Storage 作为降级方案（防止页面刷新丢失）
    if (coach) {
      uni.setStorageSync('selectedCoach', coach)
    } else {
      uni.removeStorageSync('selectedCoach')
    }
  }

  /**
   * 从 Storage 恢复选中的教练（页面刷新/启动时调用）
   */
  function restoreSelectedCoach() {
    try {
      const cached = uni.getStorageSync('selectedCoach')
      if (cached) {
        selectedCoach.value = cached
        return cached
      }
    } catch (e) {
      console.warn('恢复选中教练失败:', e)
    }
    return null
  }

  /**
   * 清空选中的教练
   */
  function clearSelectedCoach() {
    selectedCoach.value = null
    uni.removeStorageSync('selectedCoach')
  }

  /**
   * 加载教练详情
   */
  async function loadCoachDetail(id, force = false) {
    if (!id) return null
    // 如果已缓存且不强制刷新，直接返回
    if (currentCoachId.value === id && currentCoach.value && !force) {
      return currentCoach.value
    }

    coachLoading.value = true
    try {
      const res = await getCoachDetail({ id })
      const data = res.data || {}
      currentCoachId.value = id
      currentCoach.value = data
      return data
    } catch (error) {
      console.error('加载教练详情失败:', error)
      throw error
    } finally {
      coachLoading.value = false
    }
  }

  /**
   * 加载教练评价列表
   */
  async function loadCoachReviews(coachId, pageNo = 1, pageSize = 20) {
    try {
      const res = await getCoachReviews({ coachId, pageNo, pageSize })
      const data = res.data || {}
      const list = data.list || data.records || data.rows || []
      if (pageNo === 1) {
        reviewList.value = list
      } else {
        reviewList.value = [...reviewList.value, ...list]
      }
      return { list, total: data.total || 0 }
    } catch (error) {
      console.error('加载教练评价失败:', error)
      throw error
    }
  }

  /**
   * 清除当前教练详情缓存
   */
  function clearCurrentCoach() {
    currentCoach.value = null
    currentCoachId.value = null
    reviewList.value = []
  }

  return {
    // state
    selectedCoach,
    currentCoach,
    currentCoachId,
    coachLoading,
    reviewList,
    favoriteList,
    favoriteTotal,
    // getters
    hasSelectedCoach,
    hasCurrentCoach,
    // actions
    setSelectedCoach,
    restoreSelectedCoach,
    clearSelectedCoach,
    loadCoachDetail,
    loadCoachReviews,
    clearCurrentCoach,
  }
})
