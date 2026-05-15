<template>
  <view class="record-page-wrapper">
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <uni-icons type="left" size="20" color="#fff" />
      </view>
      <text class="nav-title">充值记录</text>
      <view class="nav-placeholder"></view>
    </view>

    <scroll-view
      scroll-y
      class="record-scroll"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <view class="record-list" v-if="recordList.length > 0">
        <view class="record-item" v-for="record in recordList" :key="record.id">
          <view class="record-left">
            <view class="record-icon">
              <uni-icons type="wallet" size="24" color="#00BB88" />
            </view>
            <view class="record-info">
              <text class="record-title">充值</text>
              <text class="record-time">{{ record.createTime || '' }}</text>
              <text class="record-status" :class="getStatusClass(record.status)">
                {{ getStatusText(record.status) }}
              </text>
            </view>
          </view>
          <view class="record-right">
            <text class="record-amount">+¥{{ formatAmount(record.payPrice) }}</text>
            <text class="record-bonus" v-if="record.bonusPrice > 0">+送¥{{ formatAmount(record.bonusPrice) }}</text>
          </view>
        </view>
      </view>

      <view class="empty-state" v-else-if="!loading">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无充值记录</text>
      </view>

      <view class="loading-status">
        <uni-load-more :status="loadMoreStatus" />
      </view>

      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from "@dcloudio/uni-app"
import { getWalletRechargePage } from '@/api/billiard/pay'

// 刷新状态
const refreshing = ref(false)
const loading = ref(false)
const hasMore = ref(true)
const loadMoreStatus = ref('more')

// 分页
const pageNo = ref(1)
const pageSize = ref(10)

// 记录列表
const recordList = ref([])

// 状态映射
const statusMap = {
  0: { text: '待支付', class: 'pending' },
  10: { text: '支付成功', class: 'success' },
  20: { text: '已取消', class: 'cancelled' },
  30: { text: '已退款', class: 'refunded' }
}

// 获取状态文字
const getStatusText = (status) => {
  return statusMap[status]?.text || '未知'
}

// 获取状态样式
const getStatusClass = (status) => {
  return statusMap[status]?.class || ''
}

// 格式化金额
const formatAmount = (amount) => {
  if (amount == null || amount === undefined) return '0.00'
  return (amount / 100).toFixed(2)
}

// 加载数据
const loadData = async (isRefresh = false) => {
  if (loading.value) return

  loading.value = true
  if (isRefresh) {
    pageNo.value = 1
    loadMoreStatus.value = 'more'
    hasMore.value = true
  } else {
    loadMoreStatus.value = 'loading'
  }

  try {
    const res = await getWalletRechargePage({
      pageNo: pageNo.value,
      pageSize: pageSize.value
    })
    const data = res.data || {}
    const list = data.list || data.records || []

    if (isRefresh) {
      recordList.value = list
    } else {
      recordList.value = [...recordList.value, ...list]
    }

    // 判断是否还有更多数据
    const total = data.total || data.totalCount || 0
    if (total > 0) {
      hasMore.value = recordList.value.length < total
    } else {
      hasMore.value = list.length >= pageSize.value
    }
    loadMoreStatus.value = hasMore.value ? 'more' : 'noMore'

  } catch (error) {
    console.error('加载充值记录失败:', error)
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

// 加载更多
const loadMore = () => {
  if (loading.value || !hasMore.value) return
  pageNo.value++
  loadData(false)
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

onShow(() => {
  loadData(true)
})
</script>

<style lang="scss" scoped>
.record-page-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + constant(safe-area-inset-top));
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: #1E252B;
  .nav-back, .nav-placeholder {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-title {
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
  }
}

.record-scroll {
  flex: 1;
  width: 100%;
}

/* 记录列表 */
.record-list {
  padding: 20rpx 30rpx;
}

.record-item {
  background: #1E252B;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.record-left {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  flex: 1;
}

.record-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(0, 187, 136, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.record-title {
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
}

.record-time {
  color: #9CA3AF;
  font-size: 24rpx;
}

.record-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  width: fit-content;
  &.pending {
    background: rgba(251, 191, 36, 0.15);
    color: #FBBF24;
  }
  &.success {
    background: rgba(0, 187, 136, 0.15);
    color: #00BB88;
  }
  &.cancelled {
    background: rgba(107, 114, 128, 0.15);
    color: #9CA3AF;
  }
  &.refunded {
    background: rgba(239, 68, 68, 0.15);
    color: #EF4444;
  }
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
}

.record-amount {
  color: #00BB88;
  font-size: 32rpx;
  font-weight: 700;
}

.record-bonus {
  color: #9CA3AF;
  font-size: 22rpx;
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

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>