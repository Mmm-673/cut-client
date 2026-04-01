<template>
  <view class="order-list-wrapper">
    <!-- 顶部Tab -->
    <view class="tab-bar" id="tabBar">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        全部
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'pending' }"
        @click="activeTab = 'pending'"
      >
        待服务
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'completed' }"
        @click="activeTab = 'completed'"
      >
        已完成
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'cancelled' }"
        @click="activeTab = 'cancelled'"
      >
        已取消
      </view>
    </view>

    <!-- 订单列表 -->
    <scroll-view class="order-scroll" scroll-y="true" :style="{ height: scrollHeight + 'px' }">
      <view class="order-container">
        <view
          class="order-card"
          v-for="order in filteredOrderList"
          :key="order.id"
          @click="goToDetail(order)"
        >
          <!-- 订单头部 -->
          <view class="order-header">
            <view class="order-type">
              <text class="type-icon">{{ order.serviceIcon }}</text>
              <text class="type-name">{{ order.serviceName }}</text>
            </view>
            <view class="order-status" :class="order.statusClass">
              {{ order.statusText }}
            </view>
          </view>

          <!-- 助教信息 -->
          <view class="coach-section">
            <image class="coach-avatar" :src="order.coachAvatar" mode="aspectFill"></image>
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
                v-if="order.status === 'pending'"
                class="action-btn cancel"
                @click.stop="cancelOrder(order)"
              >
                取消订单
              </button>
              <button
                v-if="order.status === 'pending'"
                class="action-btn contact"
                @click.stop="contactCoach(order)"
              >
                联系助教
              </button>
              <button
                v-if="order.status === 'completed' && !order.isReviewed"
                class="action-btn review"
                @click.stop="goToReview(order)"
              >
                去评价
              </button>
              <button
                v-if="order.status === 'completed'"
                class="action-btn reward"
                @click.stop="goToReward(order)"
              >
                打赏
              </button>
              <button
                v-if="order.status === 'completed'"
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
      <view v-if="filteredOrderList.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无订单</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 当前Tab
const activeTab = ref('all')
// 滚动区域高度
const scrollHeight = ref(0)

// 订单列表
const orderList = ref([
  {
    id: 1,
    orderNo: 'DD202403310001',
    serviceName: '台球陪练',
    serviceIcon: '🎱',
    coachName: '小雯',
    coachAvatar: 'https://picsum.photos/id/65/200/200',
    date: '03月31日',
    time: '14:00',
    duration: 2,
    hallName: '星空台球俱乐部（朝阳店）',
    price: 198,
    status: 'pending',
    statusText: '待服务',
    statusClass: 'pending',
    isReviewed: false
  },
  {
    id: 2,
    orderNo: 'DD202403300002',
    serviceName: '桌球教学',
    serviceIcon: '🎓',
    coachName: '阿杰',
    coachAvatar: 'https://picsum.photos/id/103/200/200',
    date: '03月30日',
    time: '16:00',
    duration: 1,
    hallName: '8号台球会所',
    price: 158,
    status: 'completed',
    statusText: '已完成',
    statusClass: 'completed',
    isReviewed: false
  },
  {
    id: 3,
    orderNo: 'DD202403280003',
    serviceName: '台球陪练',
    serviceIcon: '🎱',
    coachName: '思思',
    coachAvatar: 'https://picsum.photos/id/64/200/200',
    date: '03月28日',
    time: '19:00',
    duration: 1,
    hallName: '星空台球俱乐部（朝阳店）',
    price: 99,
    status: 'completed',
    statusText: '已完成',
    statusClass: 'completed',
    isReviewed: true
  },
  {
    id: 4,
    orderNo: 'DD202403250004',
    serviceName: '斯诺克教学',
    serviceIcon: '🔴',
    coachName: '大伟',
    coachAvatar: 'https://picsum.photos/id/106/200/200',
    date: '03月25日',
    time: '15:00',
    duration: 2,
    hallName: '乔氏台球会所',
    price: 396,
    status: 'cancelled',
    statusText: '已取消',
    statusClass: 'cancelled',
    isReviewed: false
  }
])

// 筛选后的订单列表
const filteredOrderList = computed(() => {
  if (activeTab.value === 'all') {
    return orderList.value
  }
  return orderList.value.filter(order => order.status === activeTab.value)
})

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
        order.status = 'cancelled'
        order.statusText = '已取消'
        order.statusClass = 'cancelled'
        uni.showToast({ title: '订单已取消', icon: 'success' })
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
    url: '/pages/order/review'
  })
}

// 去打赏
const goToReward = (order) => {
  uni.navigateTo({
    url: `/pages/coach/reward?coachId=${order.id}&coachName=${order.coachName}`
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
      const tabBarHeight = res[0]?.height || 0
      // 减去系统导航栏、tabBar、底部安全区域
      scrollHeight.value = systemInfo.windowHeight - tabBarHeight - (systemInfo.safeAreaInsets?.bottom || 0)
    })
  }, 100)
})

onLoad(() => {
  console.log('订单列表页加载')
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
</style>
