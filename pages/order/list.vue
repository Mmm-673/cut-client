<template>
  <view class="order-list-wrapper">
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
          class="order-card"
          v-for="order in orderList"
          :key="order.orderId"
          @click="goToDetail(order)"
        >
          <!-- 订单头部 -->
          <view class="order-header">
            <view class="order-type">
              <text class="type-icon">{{ getServiceIcon(order.serviceType) }}</text>
              <text class="type-name">{{ getServiceTypeName(order.serviceType) }}</text>
            </view>
            <view class="order-status" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </view>
          </view>

          <!-- 助教信息 -->
          <view class="coach-section">
            <image class="coach-avatar" :src="order.coachMainPhoto || '/static/default-avatar.png'" mode="aspectFill"></image>
            <view class="coach-info">
              <text class="coach-name">{{ order.coachStageName }}</text>
              <text class="order-time">{{ formatBookingTime(order.bookingTime) }}</text>
            </view>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>

          <!-- 订单信息 -->
          <view class="order-info">
            <view class="info-item">
              <text class="info-label">时长</text>
              <text class="info-value">{{ order.serviceDuration }}分钟</text>
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
                v-if="order.status === 10"
                class="action-btn cancel"
                @click.stop="cancelOrder(order)"
              >
                取消订单
              </button>
              <button
                v-if="order.status === 50"
                class="action-btn review"
                @click.stop="goToReview(order)"
              >
                去评价
              </button>
              <button
                v-if="order.status === 60"
                class="action-btn book-again"
                @click.stop="bookAgain(order)"
              >
                再约一次
              </button>
            </view>
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
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getOrderList, cancelOrder as cancelOrderApi } from '@/api/billiard/order'

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
  50: { text: '待评价', class: 'to-review' },
  60: { text: '已完成', class: 'completed' },
  70: { text: '已取消', class: 'cancelled' }
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
  return '🎱'
}

// 获取服务类型名称
const getServiceTypeName = (type) => {
  if (type === 1) return '台球陪练'
  if (type === 2) return '陪游'
  return '台球陪练'
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

// 模拟数据开关
const USE_MOCK_DATA = true

// 模拟数据
const getMockOrders = () => {
  const now = Date.now()
  const mockOrders = [
    {
      orderId: 1001,
      orderNo: 'TB202401150001',
      coachId: 1,
      coachStageName: '小雯',
      coachMainPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      serviceType: 1,
      bookingTime: now + 2 * 60 * 60 * 1000,
      serviceDuration: 120,
      status: 10,
      payAmount: 19800,
      totalAmount: 19800,
      createTime: now - 10 * 60 * 1000
    },
    {
      orderId: 1002,
      orderNo: 'TB202401150002',
      coachId: 2,
      coachStageName: '阿豪',
      coachMainPhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
      serviceType: 1,
      bookingTime: now + 24 * 60 * 60 * 1000,
      serviceDuration: 180,
      status: 20,
      payAmount: 29800,
      totalAmount: 29800,
      createTime: now - 30 * 60 * 1000
    },
    {
      orderId: 1003,
      orderNo: 'TB202401150003',
      coachId: 3,
      coachStageName: '思思',
      coachMainPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      serviceType: 1,
      bookingTime: now + 1 * 60 * 60 * 1000,
      serviceDuration: 120,
      status: 30,
      payAmount: 19800,
      totalAmount: 19800,
      createTime: now - 2 * 60 * 60 * 1000
    },
    {
      orderId: 1004,
      orderNo: 'TB202401150004',
      coachId: 4,
      coachStageName: '大飞',
      coachMainPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      serviceType: 1,
      bookingTime: now - 30 * 60 * 1000,
      serviceDuration: 120,
      status: 40,
      payAmount: 19800,
      totalAmount: 19800,
      createTime: now - 3 * 60 * 60 * 1000
    },
    {
      orderId: 1005,
      orderNo: 'TB202401150005',
      coachId: 1,
      coachStageName: '小雯',
      coachMainPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      serviceType: 1,
      bookingTime: now - 2 * 60 * 60 * 1000,
      serviceDuration: 120,
      status: 50,
      payAmount: 19800,
      totalAmount: 19800,
      createTime: now - 4 * 60 * 60 * 1000
    },
    {
      orderId: 1006,
      orderNo: 'TB202401140006',
      coachId: 2,
      coachStageName: '阿豪',
      coachMainPhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
      serviceType: 1,
      bookingTime: now - 24 * 60 * 60 * 1000,
      serviceDuration: 180,
      status: 60,
      payAmount: 29800,
      totalAmount: 29800,
      createTime: now - 26 * 60 * 60 * 1000
    },
    {
      orderId: 1007,
      orderNo: 'TB202401140007',
      coachId: 3,
      coachStageName: '思思',
      coachMainPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      serviceType: 2,
      bookingTime: now - 48 * 60 * 60 * 1000,
      serviceDuration: 300,
      status: 70,
      payAmount: 0,
      totalAmount: 49800,
      createTime: now - 50 * 60 * 60 * 1000
    }
  ]

  // 根据Tab筛选
  if (activeTab.value === null) {
    return mockOrders
  }
  return mockOrders.filter(order => order.status === activeTab.value)
}

// 加载数据
const loadData = async (isRefresh = false) => {
  if (loading.value) return

  loading.value = true
  if (isRefresh) {
    loadMoreStatus.value = 'more'
    hasMore.value = true
    pageNo.value = 1
  } else {
    loadMoreStatus.value = 'loading'
  }

  try {
    let list = []
    let data = {}

    if (USE_MOCK_DATA) {
      // 使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 500))
      list = getMockOrders()
    } else {
      // 使用真实API
      const params = {
        pageNo: pageNo.value,
        pageSize: pageSize.value
      }

      if (activeTab.value !== null) {
        params.status = activeTab.value
      }

      const res = await getOrderList(params)
      data = res.data || {}
      list = data.list || data.records || []
    }

    if (isRefresh) {
      orderList.value = list
    } else {
      orderList.value = [...orderList.value, ...list]
    }

    // 判断是否还有更多数据
    if (USE_MOCK_DATA) {
      hasMore.value = false
      loadMoreStatus.value = 'noMore'
    } else {
      const total = data.total || data.totalCount || 0
      if (total > 0) {
        hasMore.value = orderList.value.length < total
      } else {
        hasMore.value = list.length >= pageSize.value
      }
      loadMoreStatus.value = hasMore.value ? 'more' : 'noMore'
    }

    if (!hasMore.value && pageNo.value > 1) {
      uni.showToast({
        title: '没有更多了',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('加载订单列表失败:', error)
    loadMoreStatus.value = 'more'
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
  loadData(true)
}

// 跳转详情
const goToDetail = (order) => {
  uni.navigateTo({
    url: `/pages/order/detail?id=${order.orderId}`
  })
}

// 取消订单
const cancelOrder = async (order) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消这个订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await cancelOrderApi({ orderId: order.orderId })
          uni.showToast({ title: '订单已取消', icon: 'success' })
          loadData(true)
        } catch (error) {
          uni.showToast({
            title: error.message || '取消失败，请重试', icon: 'none' })
        }
      }
    }
  })
}

// 联系助教
const contactCoach = (order) => {
  uni.showToast({ title: '联系助教功能开发中', icon: 'none' })
}

// 去评价
const goToReview = (order) => {
  uni.navigateTo({
    url: `/pages/evaluate/index?orderId=${order.orderId}`
  })
}

// 去打赏
const goToReward = (order) => {
  uni.navigateTo({
    url: `/pages/coach/reward?coachId=${order.coachId || order.id}&coachName=${order.coachStageName}`
  })
}

// 再约一次
const bookAgain = (order) => {
  uni.switchTab({
    url: '/pages/home/index'
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
  // 加载数据
  loadData(true)
})
</script>

<style lang="scss" scoped>
.order-list-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
}

/* 顶部Tab */
.tab-bar {
  display: flex;
  background: #1E252B;
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
    color: #9CA3AF;
    font-size: 28rpx;
    border-radius: 32rpx;
    white-space: nowrap;
    &.active {
      background: #00BB88;
      color: #fff;
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

/* 订单卡片 */
.order-card {
  background: #1E252B;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
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
      color: #fff;
      font-size: 30rpx;
      font-weight: 500;
    }
  }
  .order-status {
    font-size: 26rpx;
    padding: 8rpx 20rpx;
    border-radius: 20rpx;
    &.pending {
      background: rgba(255, 149, 0, 0.2);
      color: #FF9500;
    }
    &.pending-accept {
      background: rgba(59, 130, 246, 0.2);
      color: #3B82F6;
    }
    &.accepted {
      background: rgba(59, 130, 246, 0.2);
      color: #3B82F6;
    }
    &.ongoing {
      background: rgba(59, 130, 246, 0.2);
      color: #3B82F6;
    }
    &.to-review {
      background: rgba(245, 158, 11, 0.2);
      color: #F59E0B;
    }
    &.completed {
      background: rgba(0, 187, 136, 0.2);
      color: #00BB88;
    }
    &.cancelled {
      background: rgba(107, 114, 128, 0.2);
      color: #6B7280;
    }
  }
}

/* 助教信息 */
.coach-section {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-top: 1rpx solid rgba(255,255,255,0.05);
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  .coach-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 16rpx;
    margin-right: 16rpx;
  }
  .coach-info {
    flex: 1;
    .coach-name {
      color: #fff;
      font-size: 30rpx;
      font-weight: 500;
      display: block;
      margin-bottom: 8rpx;
    }
    .order-time {
      color: #9CA3AF;
      font-size: 24rpx;
    }
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
      color: #9CA3AF;
      font-size: 26rpx;
    }
    .info-value {
      color: #fff;
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
  border-top: 1rpx solid rgba(255,255,255,0.05);
  .order-price {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
    .price-label {
      color: #9CA3AF;
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
        color: #9CA3AF;
      }
      &.review {
        background: rgba(245, 158, 11, 0.2);
        color: #F59E0B;
      }
      &.book-again {
        background: #00BB88;
        color: #fff;
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
    color: #666;
    font-size: 28rpx;
  }
}

.loading-status {
  padding: 20rpx 0;
}
</style>
