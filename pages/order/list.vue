<template>
  <view class="order-list-wrapper" :class="themeClass">
    <!-- 顶部Tab - 滑动 -->
    <view class="tab-bar" id="tabBar">
      <scroll-view scroll-x="true" :show-scrollbar="false" class="tab-scroll">
        <view class="tab-list">
          <view
            class="tab-item"
            :class="{ active: activeTab === null }"
            @click="switchTab(null)"
          >
            全部
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === 10 }"
            @click="switchTab(10)"
          >
            待付款
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === 20 }"
            @click="switchTab(20)"
          >
            待接单
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === 30 }"
            @click="switchTab(30)"
          >
            已接单
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === 40 }"
            @click="switchTab(40)"
          >
            进行中
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === 50 }"
            @click="switchTab(50)"
          >
            待评价
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === 60 }"
            @click="switchTab(60)"
          >
            已完成
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === 70 }"
            @click="switchTab(70)"
          >
            已取消
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 订单列表 -->
    <scroll-view
      class="order-scroll"
      scroll-y="true"
      :style="{ height: scrollHeight + 'px' }"
      refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <view class="order-container">
        <view
          class="order-swipe-wrapper"
          v-for="order in orderList"
          :key="getOrderKey(order)"
        >
          <view
            class="order-swipe-content"
            :class="{ swiped: swipedOrderId === getOrderKey(order) }"
            :style="{ transform: getTransform(order) }"
            @click="handleCardClick(order)"
            @touchstart="onTouchStart($event, order)"
            @touchmove="onTouchMove($event, order)"
            @touchend="onTouchEnd($event, order)"
          >
            <view class="order-card">
              <!-- 订单头部 -->
              <view class="order-header">
                <view class="order-type">
                  <text class="type-icon">{{ getServiceIcon(order.serviceType) }}</text>
                  <text class="type-name">{{ getServiceTypeName(order.serviceType) }}</text>
                  <text
                    class="order-type-tag"
                    :class="isOnsiteOrder(order) ? 'onsite' : 'normal'"
                  >
                    {{ ORDER_TYPE_LABELS[order.type] || ORDER_TYPE_LABELS[ORDER_TYPE_NORMAL] }}
                  </text>
                </view>
                <view class="order-status" :class="getStatusClass(order.status)">
                  {{ getStatusText(order.status) }}
                </view>
              </view>

              <!-- 裁教信息 -->
              <view class="coach-section">
                <image class="coach-avatar" :src="getCoachAvatar(order) || '/static/images/profile.jpg'" mode="aspectFill"></image>
                <view class="coach-info">
                  <text class="coach-name">{{ order.coachStageName }}</text>
                  <text class="order-time">{{ isOnsiteOrder(order) ? '开始时间：' : '预约时间：' }}{{ formatBookingTime(isOnsiteOrder(order) ? order.startTime : order.bookingTime) }}</text>
                </view>
                <uni-icons type="right" size="20" color="#9CA3AF" />
              </view>

              <!-- 服务地点 / 服务时长 -->
              <view class="venue-section" v-if="!isOnsiteOrder(order) && order.venueName">
                <text class="venue-label">{{ order.serviceType === 1 ? '球厅' : '服务地点' }}</text>
                <text class="venue-name">{{ order.venueName }}</text>
                <text class="venue-address" v-if="order.venueAddress">{{ order.venueAddress }}</text>
              </view>


              <!-- 订单信息 -->
              <view class="order-info">
                <view class="info-item" v-if="order.type === 1">
                  <text class="info-label">时长</text>
                  <text class="info-value">{{ order.serviceDuration }}分钟</text>
                </view>
                <view class="info-item" v-else>
                  <text class="info-label">时长</text>
                  <text class="info-name">{{ formatDuration(order.billingMinutes) }}</text>
                </view>
                <view class="info-item">
                  <text class="info-label">订单号</text>
                  <text class="info-value">{{ order.orderNo }}</text>
                </view>
                <view class="info-item">
                  <text class="info-label">下单时间</text>
                  <text class="info-value">{{ formatCreateTime(order.createTime) }}</text>
                </view>
              </view>

              <!-- 订单底部 -->
              <view class="order-footer">
                <view class="order-price">
                  <text class="price-label">实付</text>
                  <text class="price-unit">¥</text>
                  <text class="price-num">{{ formatAmount(order.totalAmount) }}</text>
                </view>
                <view class="order-actions">
                  <button
                    v-if="!isOnsiteOrder(order) && canCancelOrder(order.status)"
                    class="action-btn cancel"
                    @click.stop="cancelOrder(order)"
                  >
                    取消订单
                  </button>
                  <button
                    v-if="isOnsiteOrder(order) && order.status === 45"
                    class="action-btn pay-now"
                    @click.stop="goToDetail(order)"
                  >
                    去支付
                  </button>
                  <button
                    v-if="order.status === 50"
                    class="action-btn review"
                    @click.stop="goToReview(order)"
                  >
                    去评价
                  </button>
                  <button
                    v-if="!isOnsiteOrder(order) && order.status === 60"
                    class="action-btn book-again"
                    @click.stop="bookAgain(order)"
                  >
                    再约一次
                  </button>
                </view>
              </view>
            </view>
          </view>

          <!-- 删除按钮（仅普通订单已取消状态支持左滑删除） -->
          <view
            v-if="!isOnsiteOrder(order) && order.status === 70"
            class="delete-action"
            @click="deleteOrderHandler(order)"
          >
            <text class="delete-text">删除</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="orderList.length === 0 && !loading && !refreshing" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无订单</text>
      </view>

      <!-- 加载状态 -->
      <view class="loading-status">
        <uni-load-more :status="loadMoreStatus"></uni-load-more>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getOrderList, cancelOrder as cancelOrderApi, deleteOrder } from '@/api/billiard/order'
import { guardReviewEntry, isReviewMode } from '@/utils/review'
import { useThemeStore } from '@/store'

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 当前Tab
const activeTab = ref(null)
// 滚动区域高度
const scrollHeight = ref(0)
// 加载状态
const refreshing = ref(false)
const loading = ref(false)
const loadMoreStatus = ref('more') // more: loading前, loading: 加载中, noMore: 没有更多数据
const hasMore = ref(true)

// 分页
const pageNo = ref(1)
const pageSize = ref(10)

// 订单列表
const orderList = ref([])

// 滑动相关
const swipedOrderId = ref(null)
const startX = ref(0)
const currentX = ref(0)
const isDragging = ref(false)
const SWIPE_THRESHOLD = 120 // 滑动阈值

/**
 * 状态映射 - 根据API文档
 * 10=待付款
 * 20=待接单
 * 30=已接单/待服务
 * 40=进行中
 * 50=待评价
 * 60=已完成
 * 70=已取消
 */
const statusMap = {
  10: { text: '待付款', class: 'pending' },
  20: { text: '待接单', class: 'pending-accept' },
  30: { text: '已接单', class: 'accepted' },
  40: { text: '进行中', class: 'ongoing' },
  45: { text: '待支付', class: 'pending' },
  50: { text: '待评价', class: 'to-review' },
  60: { text: '已完成', class: 'completed' },
  70: { text: '已取消', class: 'cancelled' }
}

// 订单类型
const ORDER_TYPE_NORMAL = 1
const ORDER_TYPE_ONSITE = 2

const ORDER_TYPE_LABELS = {
  [ORDER_TYPE_NORMAL]: '普通订单',
  [ORDER_TYPE_ONSITE]: '现场订单'
}

const CANCELLABLE_ORDER_STATUSES = [10, 20, 30]

const canCancelOrder = (status) => CANCELLABLE_ORDER_STATUSES.includes(Number(status))

// 判断是否为现场订单
const isOnsiteOrder = (order) => Number(order.type) === ORDER_TYPE_ONSITE

// 获取订单ID（兼容两种订单的ID字段）
const getOrderId = (order) => {
  if (isOnsiteOrder(order)) {
    return order.id ?? order.orderId
  }
  return order.orderId ?? order.id
}

// 获取订单唯一标识（避免普通订单与现场订单ID冲突）
const getOrderKey = (order) => {
  const id = getOrderId(order)
  if (isOnsiteOrder(order)) {
    return `onsite_${id}`
  }
  return `normal_${id}`
}

// 获取裁教头像
const getCoachAvatar = (order) => {
  if (isOnsiteOrder(order)) {
    return order.coachMainPhoto || order.coachAvatar
  }
  return order.coachAvatar || order.coachMainPhoto
}

// 格式化分钟数为 X小时X分钟
const formatDuration = (minutes) => {
  if (!minutes) return '0分钟'
  const mins = Number(minutes)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0 && m > 0) return `${h}小时${m}分钟`
  if (h > 0) return `${h}小时`
  return `${m}分钟`
}

// 获取状态文本
const getStatusText = (status) => {
  return statusMap[status]?.text || '未知'
}

// 获取状态样式
const getStatusClass = (status) => {
  return statusMap[status]?.class || ''
}

// 获取服务图标
const getServiceIcon = (type) => {
  if (type === 1) return '🎱'
  if (type === 2) return '🌆'
  if (type === 3) return '🍷'
  if (type === 4) return '🎬'
  return '🎱'
}

// 获取服务类型名称
const getServiceTypeName = (type) => {
  if (type === 1) return '台球指导'
  if (type === 2) return '潮玩领航'
  if (type === 3) return '酒艺品鉴'
  if (type === 4) return '影视赏析'
  return '台球指导'
}

// 格式化预约时间
const formatBookingTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

// 格式化下单时间
const formatCreateTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化金额（分转元）
const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00'
  return (amount / 100).toFixed(2)
}

// 获取滑动变换
const getTransform = (order) => {
  const orderKey = getOrderKey(order)
  if (swipedOrderId.value === orderKey) {
    return 'translateX(-120rpx)'
  }
  if (swipedOrderId.value !== orderKey || !isDragging.value) {
    return 'translateX(0)'
  }
  const offsetX = Math.min(0, currentX.value - startX.value)
  if (offsetX > -SWIPE_THRESHOLD) {
    return `translateX(${offsetX}px)`
  }
  return 'translateX(-120rpx)'
}

// 判断是否可左滑删除（仅普通订单已取消状态）
const canSwipeDelete = (order) => {
  return !isOnsiteOrder(order) && Number(order.status) === 70
}

// 触摸开始
const onTouchStart = (e, order) => {
  if (!canSwipeDelete(order)) return
  startX.value = e.touches[0].clientX
  isDragging.value = true
}

// 触摸移动
const onTouchMove = (e, order) => {
  if (!isDragging.value || !canSwipeDelete(order)) return
  currentX.value = e.touches[0].clientX
  const offsetX = currentX.value - startX.value
  if (offsetX < 0) {
    // 向左滑动
  }
}

// 触摸结束
const onTouchEnd = (e, order) => {
  if (!isDragging.value || !canSwipeDelete(order)) {
    isDragging.value = false
    return
  }
  const offsetX = currentX.value - startX.value
  if (offsetX < -SWIPE_THRESHOLD / 2) {
    swipedOrderId.value = getOrderKey(order)
  } else {
    swipedOrderId.value = null
  }
  isDragging.value = false
}

// 处理卡片点击
const handleCardClick = (order) => {
  if (swipedOrderId.value === getOrderKey(order)) {
    swipedOrderId.value = null
  } else {
    swipedOrderId.value = null
    goToDetail(order)
  }
}

// 删除订单
const deleteOrderHandler = (order) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这个订单吗？删除后无法恢复。',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteOrder({ orderId: order.orderId })
          uni.showToast({ title: '订单已删除', icon: 'success' })
          swipedOrderId.value = null
          loadData(true)
        } catch (error) {
          uni.showToast({
            title: error.message || '删除失败，请重试',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 加载数据
const loadData = async (isRefresh = false) => {
  if (loading.value) return

  loading.value = true
  if (isRefresh) {
    loadMoreStatus.value = 'more'
    hasMore.value = true
    pageNo.value = 1
    swipedOrderId.value = null
  } else {
    loadMoreStatus.value = 'loading'
  }

  // 快照当前参数，防止异步请求期间参数被修改
  const currentPage = pageNo.value
  const currentTab = activeTab.value

  try {
    const params = {
      pageNo: currentPage,
      pageSize: pageSize.value
    }

    if (currentTab !== null) {
      params.status = currentTab
    }

    const res = await getOrderList(params)
    const data = res.data || {}
    const list = data.list || data.records || []

    // 请求回来后验证 Tab 是否已切换，若已切换则丢弃数据
    if (activeTab.value !== currentTab) {
      loading.value = false
      refreshing.value = false
      return
    }

    if (isRefresh) {
      orderList.value = list
    } else {
      // 用 getOrderKey 去重后追加，兼容普通订单与现场订单
      const existingKeys = new Set(orderList.value.map(o => getOrderKey(o)))
      const newItems = list.filter(o => !existingKeys.has(getOrderKey(o)))
      orderList.value = [...orderList.value, ...newItems]
    }

    // 判断是否还有更多数据
    const total = data.total || data.totalCount || 0
    if (total > 0) {
      hasMore.value = orderList.value.length < total
    } else {
      hasMore.value = list.length >= pageSize.value
    }
    loadMoreStatus.value = hasMore.value ? 'more' : 'noMore'

    if (!hasMore.value && pageNo.value > 1) {
      uni.showToast({
        title: '没有更多了',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('加载订单列表失败:', error)
    loadMoreStatus.value = 'noMore'
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadData(true)
}

// 上拉加载更多
const loadMore = () => {
  if (loading.value || !hasMore.value) return
  pageNo.value++
  loadData(false)
}

// 切换Tab
const switchTab = (tab) => {
  activeTab.value = tab
  swipedOrderId.value = null
  loadData(true)
}

// 跳转详情
const goToDetail = (order) => {
  const orderId = getOrderId(order)
  if (isOnsiteOrder(order)) {
    uni.navigateTo({
      url: `/subpkg/onsite/detail?id=${orderId}`
    })
  } else {
    uni.navigateTo({
      url: `/subpkg/order/detail?id=${orderId}`
    })
  }
}

// 取消订单
const cancelOrder = async (order) => {
  if (!canCancelOrder(order.status)) {
    uni.showToast({ title: '当前状态不可取消', icon: 'none' })
    return
  }

  uni.showModal({
    title: '提示',
    content: '确定要取消这个订单吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '取消中...' })
        try {
          await cancelOrderApi({ orderId: order.orderId })
          uni.hideLoading()
          uni.showToast({ title: '订单已取消', icon: 'success' })
          loadData(true)
        } catch (error) {
          uni.hideLoading()
          uni.showToast({
            title: error.message || '取消失败，请重试', icon: 'none' })
        }
      }
    }
  })
}

// 联系裁教
const contactCoach = (order) => {
  uni.showToast({ title: '联系裁教功能开发中', icon: 'none' })
}

// 去评价
const goToReview = (order) => {
  const orderId = getOrderId(order)
  uni.navigateTo({
    url: `/subpkg/coach/evaluate?orderId=${orderId}&coachId=${order.coachId}`
  })
}

// 去打赏
const goToReward = (order) => {
  uni.navigateTo({
    url: `/subpkg/coach/reward?coachId=${order.coachId}&coachName=${order.coachStageName}`
  })
}

// 再约一次
const bookAgain = (order) => {
  uni.showModal({
    title: '提示',
    content: '确定要再次预约吗？',
    success: (res) => {
      if (res.confirm) {
        uni.switchTab({
          url: '/pages/home/index'
        })
      }
    }
  })
}

onMounted(() => {
  // 计算滚动区域高度
  const systemInfo = uni.getSystemInfoSync()
  setTimeout(() => {
    const query = uni.createSelectorQuery()
    query.select('#tabBar').boundingClientRect()
    query.exec((res) => {
      const pageTabBarHeight = res[0]?.height || 0
      // 减去顶部tabBar
      scrollHeight.value = systemInfo.windowHeight - pageTabBarHeight
    })
  }, 100)
})

onLoad(() => {
  // 审核模式入口守卫
  if (guardReviewEntry()) return
  // 加载数据
  loadData(true)

  // 监听评价完成事件
  uni.$on('orderEvaluated', () => {
    loadData(true)
  })
})

onShow(() => {
  // 审核模式下不加载订单数据（onLoad 守卫会拦截并返回首页）
  if (isReviewMode()) return
  // 每次页面显示时刷新数据
  loadData(true)
})
</script>

<style lang="scss" scoped>
.order-list-wrapper {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

/* 顶部Tab */
.tab-bar {
  display: flex;
  background: var(--bg-card);
  padding: 20rpx 0;
  flex-shrink: 0;
  .tab-scroll {
    width: 100%;
    white-space: nowrap;
  }
  .tab-list {
    display: flex;
    padding: 0 30rpx;
    gap: 16rpx;
  }
  .tab-item {
    flex-shrink: 0;
    padding: 12rpx 32rpx;
    color: var(--text-secondary);
    font-size: 28rpx;
    border-radius: 32rpx;
    white-space: nowrap;
    &.active {
      background: #00BB88;
      color: var(--text-primary);
    }
  }
}

/* 滚动区域 */
.order-scroll {
  /* 高度通过内联样式动态设置，确保真机正常显示 */
}

.order-container {
  padding: 20rpx;
}

/* 滑动包装器 */
.order-swipe-wrapper {
  position: relative;
  margin-bottom: 20rpx;
  overflow: hidden;
  width: 100%;
}

.order-swipe-content {
  position: relative;
  width: 100%;
  transition: transform 0.3s ease;
  z-index: 2;
  background: var(--bg-card);
  border-radius: 24rpx;
  &.swiped {
    transform: translateX(-120rpx);
  }
}

/* 删除按钮 */
.delete-action {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 120rpx;
  background: #EF4444;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 24rpx 24rpx 0;
  z-index: 1;
  .delete-text {
    color: var(--text-primary);
    font-size: 28rpx;
    font-weight: 500;
  }
}

/* 订单卡片 */
.order-card {
  padding: 24rpx;
}

/* 订单头部 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  .order-type {
    display: flex;
    align-items: center;
    gap: 12rpx;
    .type-icon {
      font-size: 36rpx;
    }
    .type-name {
      color: var(--text-primary);
      font-size: 30rpx;
      font-weight: 500;
    }
    .order-type-tag {
      font-size: 22rpx;
      padding: 4rpx 14rpx;
      border-radius: 16rpx;
      font-weight: 500;
      &.normal {
        background: rgba(0, 187, 136, 0.15);
        color: var(--brand-primary, #00BB88);
      }
      &.onsite {
        background: rgba(245, 166, 35, 0.15);
        color: #f5a623;
      }
    }
  }
  .order-status {
    font-size: 26rpx;
    padding: 8rpx 20rpx;
    border-radius: 20rpx;
    &.pending {
      background: rgba(255, 149, 0, 0.15);
      color: #EA7C00;
    }
    &.pending-accept {
      background: rgba(59, 130, 246, 0.15);
      color: #2563EB;
    }
    &.accepted {
      background: rgba(59, 130, 246, 0.15);
      color: #2563EB;
    }
    &.ongoing {
      background: rgba(59, 130, 246, 0.15);
      color: #2563EB;
    }
    &.to-review {
      background: rgba(245, 158, 11, 0.15);
      color: #D97706;
    }
    &.completed {
      background: rgba(0, 187, 136, 0.15);
      color: #059669;
    }
    &.cancelled {
      background: rgba(107, 114, 128, 0.15);
      color: #4B5563;
    }
  }
}

/* 裁教信息 */
.coach-section {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-top: 1rpx solid var(--border-color);
  border-bottom: 1rpx solid var(--border-color);
  .coach-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 16rpx;
    margin-right: 16rpx;
  }
  .coach-info {
    flex: 1;
    .coach-name {
      color: var(--text-primary);
      font-size: 30rpx;
      font-weight: 500;
      display: block;
      margin-bottom: 8rpx;
    }
    .order-time {
      color: var(--text-secondary);
      font-size: 24rpx;
    }
  }
}

/* 服务地点 */
.venue-section {
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border-color);
  .venue-label {
    color: var(--text-secondary);
    font-size: 24rpx;
    display: block;
    margin-bottom: 8rpx;
  }
  .venue-name {
    color: var(--text-primary);
    font-size: 28rpx;
    font-weight: 500;
    display: block;
    margin-bottom: 4rpx;
  }
  .venue-address {
    color: var(--text-secondary);
    font-size: 24rpx;
  }
}

/* 订单信息 */
.order-info {
  padding: 20rpx 0;
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 8rpx 0;
    .info-label {
      color: var(--text-secondary);
      font-size: 26rpx;
    }
    .info-value {
      color: var(--text-primary);
      font-size: 26rpx;
    }
  }
}

/* 订单底部 */
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid var(--border-color);
  .order-price {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
    .price-label {
      color: var(--text-secondary);
      font-size: 26rpx;
    }
    .price-unit {
      color: #00BB88;
      font-size: 26rpx;
    }
    .price-num {
      color: #00BB88;
      font-size: 36rpx;
      font-weight: bold;
    }
  }
  .order-actions {
    display: flex;
    gap: 12rpx;
    flex-wrap: wrap;
    .action-btn {
      padding: 12rpx 24rpx;
      font-size: 24rpx;
      border-radius: 28rpx;
      border: none;
      line-height: 1.2;
      &::after { border: none; }
      &.cancel {
        background: rgba(107, 114, 128, 0.2);
        color: var(--text-secondary);
      }
      &.review {
        background: rgba(245, 158, 11, 0.2);
        color: #F59E0B;
      }
      &.pay-now {
        background: #f5a623;
        color: var(--text-primary);
      }
      &.book-again {
        background: #00BB88;
        color: var(--text-primary);
      }
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 24rpx;
  }
  .empty-text {
    color: var(--text-tertiary);
    font-size: 28rpx;
  }
}

.loading-status {
  padding: 20rpx 0;
}
</style>