import { ref, computed } from 'vue'
// #ifdef VUE3
import { onUnload } from '@dcloudio/uni-app'
// #endif
import { onUnmounted } from 'vue'
import { getOrderDetail } from '@/api/billiard/order'
import { getCoachDetail } from '@/api/billiard/coach'
import { formatDateTime, formatAmount } from '@/utils/format'

/**
 * 订单详情加载 + 状态管理 composable
 *
 * 封装订单详情页的数据加载、状态映射和基础业务判断。
 *
 * @param {Object} options - 配置项
 * @param {import('vue').Ref<string|number>} options.orderId - 订单ID
 * @returns {{
 *   orderInfo: import('vue').Ref<Object>,
 *   coachInfo: import('vue').Ref<Object>,
 *   isRequesting: import('vue').Ref<boolean>,
 *   isFinalStatus: import('vue').ComputedRef<boolean>,
 *   statusText: import('vue').ComputedRef<string>,
 *   statusSubtitle: import('vue').ComputedRef<string>,
 *   statusIcon: import('vue').ComputedRef<string>,
 *   payStatusText: import('vue').ComputedRef<string>,
 *   serviceTypeName: import('vue').ComputedRef<string>,
 *   canCancelOrder: import('vue').ComputedRef<boolean>,
 *   orderNotExist: import('vue').Ref<boolean>,
 *   loadDetail: Function,
 *   onRefresh: Function
 * }}
 *
 * @example
 * const { orderInfo, isRequesting, loadDetail, statusText, canCancelOrder } = useOrderDetail({ orderId })
 */
export function useOrderDetail(options) {
  const { orderId } = options

  /** 请求锁，防止重复请求 */
  let requesting = false
  /** 缓存的球厅图片 URL（避免轮询时随机变化） */
  let cachedVenuePhotoUrl = null

  /** 加载状态 */
  const isRequesting = ref(false)
  /** 订单是否不存在 */
  const orderNotExist = ref(false)

  /**
   * 订单信息
   */
  const orderInfo = ref({
    id: null,
    orderNo: '',
    coachId: null,
    coachStageName: '',
    coachAvatar: '',
    coachMainPhoto: '',
    coachPhone: '',
    venueName: '',
    venueAddress: '',
    venueLongitude: null,
    venueLatitude: null,
    venuePhotoUrl: '',
    serviceType: 1,
    pricingMode: 1,
    bookingTime: 0,
    serviceDuration: 0,
    status: 0,
    payAmount: 0,
    extraPayAmount: 0,
    totalAmount: 0,
    createTime: 0,
    payStatus: 0,
    payMethod: '',
    payOrderId: null,
    statusText: '',
    serviceTime: ''
  })

  /** 裁教详情信息 */
  const coachInfo = ref({
    id: null,
    stageName: '',
    level: 0,
    serviceCount: 0,
    overallScore: 0,
    hourlyPrice: 0,
    tags: []
  })

  // ==================== 状态映射 ====================

  /** 订单状态文本映射 */
  const statusMap = {
    10: { text: '待付款' },
    20: { text: '待接单' },
    30: { text: '已接单' },
    40: { text: '进行中' },
    50: { text: '待评价' },
    60: { text: '已完成' },
    70: { text: '已取消' },
    80: { text: '退款中' }
  }

  /** 支付状态映射 */
  const payStatusMap = {
    0: '未支付',
    10: '支付成功',
    20: '已退款',
    30: '支付关闭'
  }

  /** 裁教等级映射 */
  const levelMap = {
    0: { text: '初级教练', color: '#9CA3AF' },
    1: { text: '中级教练', color: '#F59E0B' },
    2: { text: '高级教练', color: '#00BB88' },
    3: { text: '星级教练', color: '#FFD700' }
  }

  /** 终态列表 */
  const FINAL_STATUSES = [50, 60, 70, 80]
  /** 可取消的状态列表 */
  const CANCELLABLE_STATUSES = [10, 20, 30]

  /**
   * 获取状态图标
   * @param {number} status - 订单状态
   * @returns {string}
   */
  const getStatusIcon = (status) => {
    const iconMap = {
      10: '💳',
      20: '📋',
      30: '✅',
      40: '🏃',
      50: '⭐',
      60: '🎉',
      70: '❌',
      80: '💰'
    }
    return iconMap[status] || '📋'
  }

  /**
   * 获取状态副标题
   * @param {number} status - 订单状态
   * @returns {string}
   */
  const getStatusSubtitle = (status) => {
    const subtitleMap = {
      10: '请尽快完成支付',
      20: '等待教练确认接单',
      30: '教练已接单，请按时到达',
      40: '服务进行中',
      50: '服务已完成，期待您的评价',
      60: '感谢您的使用',
      70: '订单已取消',
      80: '退款处理中'
    }
    return subtitleMap[status] || ''
  }

  /**
   * 获取服务类型名称
   * @param {number} type - 服务类型
   * @returns {string}
   */
  const getServiceTypeName = (type) => {
    if (type === 1) return '台球指导'
    if (type === 2) return '潮玩领航'
    if (type === 3) return '酒艺品鉴'
    if (type === 4) return '影视赏析'
    return '台球指导'
  }

  /** 判断订单是否可取消 */
  const canCancelOrder = computed(() =>
    CANCELLABLE_STATUSES.includes(Number(orderInfo.value.status))
  )

  /** 判断是否为终态 */
  const isFinalStatus = computed(() =>
    FINAL_STATUSES.includes(Number(orderInfo.value.status))
  )

  /** 当前状态文本 */
  const statusText = computed(() =>
    statusMap[orderInfo.value.status]?.text || '未知'
  )

  /** 当前状态副标题 */
  const statusSubtitle = computed(() =>
    getStatusSubtitle(orderInfo.value.status)
  )

  /** 当前状态图标 */
  const statusIcon = computed(() =>
    getStatusIcon(orderInfo.value.status)
  )

  /** 支付状态文本 */
  const payStatusText = computed(() =>
    payStatusMap[orderInfo.value.payStatus] || '未知'
  )

  /** 服务类型名称 */
  const serviceTypeName = computed(() =>
    getServiceTypeName(orderInfo.value.serviceType)
  )

  // ==================== 数据加载 ====================

  /** 默认占位图列表 */
  const defaultImages = [
    '/static/images/banner/billiards_1.jpg',
    '/static/images/banner/billiards_2.jpg',
    '/static/images/banner/billiards_3.jpg'
  ]

  /** 获取随机默认图 */
  const getRandomDefaultImage = () => {
    return defaultImages[Math.floor(Math.random() * defaultImages.length)]
  }

  /**
   * 加载裁教详情
   * @param {number} coachId - 裁教ID
   */
  const loadCoachDetail = async (coachId) => {
    if (!coachId) return
    try {
      const res = await getCoachDetail({ id: coachId })
      const data = res.data || {}
      coachInfo.value = {
        id: data.id,
        stageName: data.stageName,
        level: data.level ?? 0,
        serviceCount: data.serviceCount || 0,
        overallScore: data.overallScore || 0,
        hourlyPrice: data.hourlyPrice || data.price || 0,
        tags: data.tags ? data.tags.split(',').filter(tag => tag.trim()) : []
      }
    } catch (error) {
      // 静默失败，不影响订单详情展示
    }
  }

  /**
   * 加载订单详情
   * @param {boolean} [silent=false] - 是否静默加载（不显示 loading 状态）
   * @returns {Promise<Object|null>} 订单数据，失败时返回 null
   */
  const loadDetail = async (silent = false) => {
    if (!orderId.value) return null
    if (requesting) return null

    requesting = true
    if (!silent) {
      isRequesting.value = true
    }

    try {
      const res = await getOrderDetail({ id: orderId.value })
      const data = res.data || {}

      // 无数据视为订单不存在
      if (!data || !data.id) {
        orderNotExist.value = true
        return null
      }

      orderNotExist.value = false

      // 处理球厅图片：优先后端返回，其次缓存，最后随机
      let venuePhotoUrl = data.venuePhotoUrl
      if (!venuePhotoUrl) {
        if (!cachedVenuePhotoUrl) {
          cachedVenuePhotoUrl = getRandomDefaultImage()
        }
        venuePhotoUrl = cachedVenuePhotoUrl
      } else {
        cachedVenuePhotoUrl = venuePhotoUrl
      }

      // 更新订单信息（不可变模式：创建新对象）
      orderInfo.value = {
        id: data.id,
        orderNo: data.orderNo || '',
        coachId: data.coachId ?? null,
        coachAvatar: data.coachAvatar || '',
        coachStageName: data.coachStageName || '',
        coachMainPhoto: data.coachMainPhoto || '',
        coachPhone: data.coachPhone || '',
        venueName: data.venueName || '',
        venueAddress: data.venueAddress || '',
        venueLongitude: data.venueLongitude ?? null,
        venueLatitude: data.venueLatitude ?? null,
        venuePhotoUrl,
        serviceType: data.serviceType ?? 1,
        pricingMode: data.pricingMode ?? 1,
        bookingTime: data.bookingTime ?? 0,
        serviceDuration: data.serviceDuration ?? 0,
        status: data.status ?? 0,
        payAmount: data.payAmount ?? 0,
        extraPayAmount: data.extraPayAmount ?? 0,
        totalAmount: data.totalAmount ?? 0,
        payStatus: data.payStatus ?? 0,
        payMethod: data.payMethod || data.payChannelName || '',
        payOrderId: data.payOrderId ?? null,
        statusText: statusMap[data.status]?.text || '未知',
        serviceTime: data.bookingTime ? formatDateTime(data.bookingTime) : '',
        createTime: data.createTime ? formatDateTime(data.createTime) : ''
      }

      // 加载裁教详情
      if (data.coachId) {
        loadCoachDetail(data.coachId)
      }

      return data
    } catch (error) {
      if (!silent) {
        // 判断是否是订单不存在的错误
        if (
          error.message &&
          (error.message.includes('不存在') ||
            error.message.includes('not found') ||
            error.code === 404)
        ) {
          orderNotExist.value = true
        } else {
          uni.showToast({
            title: '加载失败',
            icon: 'none'
          })
        }
      }
      return null
    } finally {
      if (!silent) {
        isRequesting.value = false
      }
      requesting = false
    }
  }

  /** 下拉刷新 */
  const onRefresh = () => {
    loadDetail()
  }

  // 页面卸载时清理缓存
  const cleanup = () => {
    cachedVenuePhotoUrl = null
    requesting = false
  }

  // #ifdef VUE3
  try { onUnload(cleanup) } catch (e) { /* 非页面上下文忽略 */ }
  // #endif

  try { onUnmounted(cleanup) } catch (e) { /* 非组件上下文忽略 */ }

  return {
    // 数据
    orderInfo,
    coachInfo,
    isRequesting,
    orderNotExist,
    // 映射常量（供模板使用）
    levelMap,
    statusMap,
    payStatusMap,
    // 计算属性
    isFinalStatus,
    statusText,
    statusSubtitle,
    statusIcon,
    payStatusText,
    serviceTypeName,
    canCancelOrder,
    // 方法
    loadDetail,
    onRefresh,
    // 工具函数
    getStatusIcon,
    getStatusSubtitle,
    getServiceTypeName,
    formatAmount
  }
}

export default useOrderDetail
