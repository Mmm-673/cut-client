<template>
  <view class="order-list-wrapper">
    <!-- 顶部Tab -->
    <view class="tab-bar" id="tabBar">
      <view
        class="tab-item"
        :class="{ active: activeTab === '' }"
        @click="switchTab('')"
      >
        全部
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 0 }"
        @click="switchTab(0)"
      >
        待服务
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 1 }"
        @click="switchTab(1)"
      >
        已完成
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 2 }"
        @click="switchTab(2)"
      >
        已取消
      </view>
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
          :key="order.id"
          @click="goToDetail(order)"
        >
          <!-- 订单头部 -->
          <view class="order-header">
            <view class="order-type">
              <text class="type-icon">{{ getServiceIcon(order.serviceName) }}</text>
              <text class="type-name">{{ order.serviceName }}</text>
            </view>
            <view class="order-status" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </view>
          </view>

          <!-- 助教信息 -->
          <view class="coach-section">
            <image class="coach-avatar" :src="order.coachAvatar || '/static/default-avatar.png'" mode="aspectFill"></image>
            <view class="coach-info">
              <text class="coach-name">{{ order.coachName }}</text>
              <text class="order-time">{{ order.date }} {{ order.time }}</text>
            </view>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>

          <!-- 订单信息 -->
          <view class="order-info">
            <view class="info-item">
              <text class="info-label">时长</text>
              <text class="info-value">{{ order.duration }}小时</text>
            </view>
            <view class="info-item">
              <text class="info-label">球厅</text>
              <text class="info-value">{{ order.hallName }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">订单号</text>
              <text class="info-value">{{ order.orderNo }}</text>
            </view>
          </view>

          <!-- 订单底部 -->
          <view class="order-footer">
            <view class="order-price">
              <text class="price-label">实付</text>
              <text class="price-unit">¥</text>
              <text class="price-num">{{ order.price }}</text>
            </view>
            <view class="order-actions">
              <button
                v-if="order.status === 0"
                class="action-btn cancel"
                @click.stop="cancelOrder(order)"
              >
                取消订单
              </button>
              <button
                v-if="order.status === 0"
                class="action-btn contact"
                @click.stop="contactCoach(order)"
              >
                联系助教
              </button>
              <button
                v-if="order.status === 1 && !order.isReviewed"
                class="action-btn review"
                @click.stop="goToReview(order)"
              >
                去评价
              </button>
              <button
                v-if="order.status === 1"
                class="action-btn reward"
                @click.stop="goToReward(order)"
              >
                打赏
              </button>
              <button
                v-if="order.status === 1"
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
import { getOrderList } from '@/api/billiard/order'

// 当前Tab
const activeTab = ref('')
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

// 状态映射
const statusMap = {
  0: { text: '待服务', class: 'pending' },
  1: { text: '已完成', class: 'completed' },
  2: { text: '已取消', class: 'cancelled' }
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
const getServiceIcon = (name) => {
  if (name?.includes('斯诺克')) return '🔴'
  if (name?.includes('教学')) return '🎓'
  return '🎱'
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
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value
    }

    // 添加状态筛选
    if (activeTab.value !== '') {
      params.status = activeTab.value
    }

    const res = await getOrderList(params)
    const data = res.data || {}
    const list = data.list || data.records || []

    if (isRefresh) {
      orderList.value = list
    } else {
      orderList.value = [...orderList.value, ...list]
    }

    // 判断是否还有更多数据
    hasMore.value = list.length >= pageSize.value
    loadMoreStatus.value = hasMore.value ? 'more' : 'noMore'

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
    url: `/pages/order/detail?id=${order.id}`
  })
}

// 取消订单
const cancelOrder = (order) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消这个订单吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '订单已取消', icon: 'success' })
        // TODO: 调用取消订单接口
        loadData(true)
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
  uni.showToast({ title: '评价功能开发中', icon: 'none' })
}

// 去打赏
const goToReward = (order) => {
  uni.navigateTo({
    url: `/pages/coach/reward?coachId=${order.coachId || order.id}&coachName=${order.coachName}`
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
  padding: 20rpx 30rpx;
  gap: 16rpx;
  overflow-x: auto;
  flex-shrink: 0;
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
      background: rgba(59, 130, 246, 0.2);
      color: #3B82F6;
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
      &.contact {
        background: rgba(59, 130, 246, 0.2);
        color: #3B82F6;
      }
      &.review {
        background: rgba(245, 158, 11, 0.2);
        color: #F59E0B;
      }
      &.reward {
        background: rgba(236, 72, 153, 0.2);
        color: #EC4899;
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
