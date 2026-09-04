/**
 * useList - 通用列表分页 Hook
 *
 * 封装列表页通用逻辑：数据加载、下拉刷新、上拉加载更多、空状态判断
 * 适用于所有标准分页列表页面，减少重复代码
 *
 * @example
 * const {
 *   list, loading, refreshing, hasMore,
 *   loadList, refresh, loadMore, isEmpty,
 *   loadMoreStatus
 * } = useList({
 *   fetchApi: getCoachList,
 *   pageSize: 20,
 *   getParams: () => ({ type: currentType.value }),
 *   transform: (res) => res.data || [],
 * })
 */
import { ref, computed } from 'vue'

export function useList(options = {}) {
  const {
    fetchApi,              // 必传：请求 API 函数
    pageSize = 20,         // 每页条数
    pageParamName = 'pageNum', // 分页页码参数名
    pageSizeParamName = 'pageSize', // 分页大小参数名
    getParams = () => ({}),// 动态参数（返回对象）
    transform = (res) => res.data?.list || res.data?.records || res.rows || res.data || [], // 数据提取
    getTotal = (res) => res.data?.total || res.data?.totalCount || res.total || 0, // 总数提取
    immediate = false,     // 是否立即加载（默认 false，由调用方控制时机）
    onError = null,        // 错误回调
    onSuccess = null,      // 成功回调
    appendStrategy = null, // 自定义追加策略 (existingList, newItems) => finalList，默认直接拼接
  } = options

  const list = ref([])
  const pageNum = ref(1)
  const total = ref(0)
  const loading = ref(false)
  const refreshing = ref(false)
  const loadingMore = ref(false)

  const hasMore = computed(() => {
    if (total.value > 0) {
      return list.value.length < total.value
    }
    // 没有 total 时，通过当前页数量判断
    return list.value.length >= pageNum.value * pageSize
  })

  const isEmpty = computed(() => list.value.length === 0 && !loading.value && !refreshing.value)

  // 用于 uni-load-more 的状态
  const loadMoreStatus = computed(() => {
    if (loadingMore.value) return 'loading'
    if (!hasMore.value && list.value.length > 0) return 'noMore'
    return 'more'
  })

  // 构建请求参数
  const buildParams = (page) => ({
    ...getParams(),
    [pageParamName]: page,
    [pageSizeParamName]: pageSize,
  })

  /** 加载列表（首次/搜索等重置场景） */
  async function loadList() {
    loading.value = true
    try {
      pageNum.value = 1
      const params = buildParams(1)
      const res = await fetchApi(params)
      const items = transform(res)
      list.value = items
      total.value = getTotal(res)
      if (onSuccess) onSuccess(res, items)
    } catch (error) {
      if (onError) onError(error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /** 下拉刷新 */
  async function refresh() {
    if (refreshing.value) return
    refreshing.value = true
    try {
      pageNum.value = 1
      const params = buildParams(1)
      const res = await fetchApi(params)
      const items = transform(res)
      list.value = items
      total.value = getTotal(res)
      if (onSuccess) onSuccess(res, items)
    } catch (error) {
      if (onError) onError(error)
      throw error
    } finally {
      refreshing.value = false
    }
  }

  /** 上拉加载更多 */
  async function loadMore() {
    if (loadingMore.value || loading.value || refreshing.value) return
    if (!hasMore.value) return

    loadingMore.value = true
    try {
      const nextPage = pageNum.value + 1
      const params = buildParams(nextPage)
      const res = await fetchApi(params)
      const newItems = transform(res)

      if (appendStrategy) {
        list.value = appendStrategy(list.value, newItems)
      } else {
        list.value = [...list.value, ...newItems]
      }

      total.value = getTotal(res)
      pageNum.value = nextPage
      if (onSuccess) onSuccess(res, newItems)
    } catch (error) {
      if (onError) onError(error)
      throw error
    } finally {
      loadingMore.value = false
    }
  }

  /** 重置列表（清空数据） */
  function reset() {
    list.value = []
    pageNum.value = 1
    total.value = 0
  }

  // 立即加载
  if (immediate) {
    loadList()
  }

  return {
    // 状态
    list,
    pageNum,
    total,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    isEmpty,
    loadMoreStatus,
    // 方法
    loadList,
    refresh,
    loadMore,
    reset,
  }
}
