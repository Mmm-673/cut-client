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
            :class="{ active: activeTab === ORDER_STATUS.PENDING_PAYMENT }"
            @click="switchTab(ORDER_STATUS.PENDING_PAYMENT)"
          >
            待付款
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === ORDER_STATUS.PENDING_ACCEPT }"
            @click="switchTab(ORDER_STATUS.PENDING_ACCEPT)"
          >
            待接单
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === ORDER_STATUS.ACCEPTED }"
            @click="switchTab(ORDER_STATUS.ACCEPTED)"
          >
            已接单
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === ORDER_STATUS.IN_SERVICE }"
            @click="switchTab(ORDER_STATUS.IN_SERVICE)"
          >
            进行中
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === ORDER_STATUS.PENDING_REVIEW }"
            @click="switchTab(ORDER_STATUS.PENDING_REVIEW)"
          >
            待评价
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === ORDER_STATUS.COMPLETED }"
            @click="switchTab(ORDER_STATUS.COMPLETED)"
          >
            已完成
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === ORDER_STATUS.CANCELLED }"
            @click="switchTab(ORDER_STATUS.CANCELLED)"
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
            <order-card
              :order="order"
              @cancel="cancelOrder"
              @pay="goToDetail"
              @review="goToReview"
              @bookAgain="bookAgain"
            />
          </view>

          <!-- 删除按钮（仅普通订单已取消状态支持左滑删除） -->
          <view
            v-if="!isOnsiteOrder(order) && order.status === ORDER_STATUS.CANCELLED"
            class="delete-action"
            @click="deleteOrderHandler(order)"
          >
            <text class="delete-text">删除</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <empty-state v-if="orderList.length === 0 && !loading && !refreshing" icon="list" text="暂无订单" />

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
import { ORDER_STATUS, canCancelOrder as _canCancelOrder } from '@/constants/orderStatus'
import { formatDuration, formatAmount, formatDate, formatShortTime } from '@/utils/format'
import { useList } from '@/composables/useList'
import EmptyState from '@/components/empty-state/empty-state.vue'
import OrderCard from '@/components/order-card/order-card.vue'

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 当前Tab
const activeTab = ref(null)
// 滚动区域高度
const scrollHeight = ref(0)

// 订单类型
const ORDER_TYPE_NORMAL = 1
const ORDER_TYPE_ONSITE = 2

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

// 判断是否为现场订单
const isOnsiteOrder = (order) => Number(order.type) === ORDER_TYPE_ONSITE

// 使用 useList 管理分页
const {
  list: orderList,
  loading,
  refreshing,
  hasMore,
  loadMoreStatus,
  loadList: loadData,
  refresh,
  loadMore,
  reset: resetList,
} = useList({
  fetchApi: getOrderList,
  pageSize: 10,
  pageParamName: 'pageNo',
  getParams: () => {
    const params = {}
    if (activeTab.value !== null) {
      params.status = activeTab.value
    }
    return params
  },
  transform: (res) => {
    const data = res.data || {}
    return data.list || data.records || []
  },
  getTotal: (res) => {
    const data = res.data || {}
    return data.total || data.totalCount || 0
  },
  onError: (error) => {
    console.error('加载订单列表失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  },
  appendStrategy: (existingList, newItems) => {
    // 用 getOrderKey 去重后追加，兼容普通订单与现场订单
    const existingKeys = new Set(existingList.map(o => getOrderKey(o)))
    const uniqueNew = newItems.filter(o => !existingKeys.has(getOrderKey(o)))
    return [...existingList, ...uniqueNew]
  },
})

// 滑动相关
const swipedOrderId = ref(null)
const startX = ref(0)
const currentX = ref(0)
const isDragging = ref(false)
const SWIPE_THRESHOLD = 120 // 滑动阈值

const ORDER_TYPE_LABELS = {
  [ORDER_TYPE_NORMAL]: '普通订单',
  [ORDER_TYPE_ONSITE]: '现场订单'
}

// 包装常量函数，处理字符串类型的status
const canCancelOrder = (status) => _canCancelOrder(Number(status))

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
  return !isOnsiteOrder(order) && Number(order.status) === ORDER_STATUS.CANCELLED
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
          refresh()
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

// 下拉刷新
const onRefresh = () => {
  refresh()
}

// 切换Tab
const switchTab = (tab) => {
  activeTab.value = tab
  swipedOrderId.value = null
  resetList()
  loadData()
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
          refresh()
        } catch (error) {
          uni.hideLoading()
          uni.showToast({
            title: error.message || '取消失败，请重试', icon: 'none' })
        }
      }
    }
  })
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
  loadData()

  // 监听评价完成事件
  uni.$on('orderEvaluated', () => {
    refresh()
  })
})

onShow(() => {
  // 审核模式下不加载订单数据（onLoad 守卫会拦截并返回首页）
  if (isReviewMode()) return
  // 每次页面显示时刷新数据
  refresh()
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

.loading-status {
  padding: 20rpx 0;
}
</style>