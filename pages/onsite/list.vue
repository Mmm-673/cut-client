<template>
  <view class="onsite-list-wrapper" :class="themeClass">
    <scroll-view
      class="onsite-scroll"
      scroll-y="true"
      refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <view class="onsite-container">
        <view
          v-for="order in orderList"
          :key="order.id"
          class="onsite-card"
          @click="goToDetail(order)"
        >
          <!-- 卡片头部：服务类型 + 状态 -->
          <view class="card-header">
            <view class="service-type">
              <text class="service-icon">{{ getServiceIcon(order.serviceType) }}</text>
              <text class="service-name">{{ getServiceTypeName(order.serviceType) }}</text>
            </view>
            <view class="status-tag" :class="getStatusClass(order)">
              {{ getStatusText(order) }}
            </view>
          </view>

          <!-- 助教信息 -->
          <view class="coach-section">
            <image
              class="coach-avatar"
              :src="order.coachMainPhoto || '/static/default-avatar.png'"
              mode="aspectFill"
            ></image>
            <view class="coach-info">
              <text class="coach-name">{{ order.coachStageName || '助教' }}</text>
            </view>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>

          <!-- 订单信息 -->
          <view class="order-info">
            <!-- 进行中：显示开始时间 + 单价 -->
            <template v-if="Number(order.status) === 40">
              <view class="info-item">
                <text class="info-label">开始时间</text>
                <text class="info-value">{{ formatTime(order.startTime) }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">单价</text>
                <text class="info-value price">
                  <text class="unit">¥</text>{{ formatAmount(order.unitPrice) }}
                  <text class="per-hour">/小时</text>
                </text>
              </view>
            </template>
            <!-- 其他状态：显示服务时长 + 实付金额 -->
            <template v-else>
              <view class="info-item">
                <text class="info-label">服务时长</text>
                <text class="info-value">{{ formatDuration(order.billingMinutes) }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">实付金额</text>
                <text class="info-value price">
                  <text class="unit">¥</text>{{ formatAmount(order.payAmount) }}
                </text>
              </view>
            </template>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="orderList.length === 0 && !loading && !refreshing" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无现场订单</text>
      </view>

      <!-- 加载状态 -->
      <view class="loading-status">
        <uni-load-more :status="loadMoreStatus"></uni-load-more>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getOnsiteOrderPage } from '@/api/billiard/onsiteOrder'
import { guardReviewEntry, isReviewMode } from '@/utils/review'
import { usePageTheme } from '@/composables/usePageTheme'
import { useThemeStore } from '@/store'

usePageTheme()

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 服务类型映射
const SERVICE_TYPE_NAMES = {
  1: '台球指导',
  2: '潮玩领航',
  3: '酒艺品鉴',
  4: '影视赏析'
}

const SERVICE_TYPE_ICONS = {
  1: '🎱',
  2: '🌟',
  3: '🍷',
  4: '🎬'
}

// 分页
const pageNo = ref(1)
const pageSize = 10

// 订单列表
const orderList = ref([])
const idSet = ref(new Set())

// 加载状态
const refreshing = ref(false)
const loading = ref(false)
const loadMoreStatus = ref('more') // more | loading | noMore
const hasMore = ref(true)

// 获取服务图标
const getServiceIcon = (type) => {
  return SERVICE_TYPE_ICONS[type] || '🎱'
}

// 获取服务类型名称
const getServiceTypeName = (type) => {
  return SERVICE_TYPE_NAMES[type] || '台球指导'
}

// 获取状态文本
const getStatusText = (order) => {
  const status = Number(order.status)
  // status=45 且 paymentStatus=10 时显示"结算中"
  if (status === 45 && Number(order.paymentStatus) === 10) {
    return '结算中'
  }
  if (status === 40) return '进行中'
  if (status === 45) return '待付款'
  if (status === 50) return '待评价'
  if (status === 60) return '已完成'
  return '未知'
}

// 获取状态样式类
const getStatusClass = (order) => {
  const status = Number(order.status)
  if (status === 40) return 'status-ongoing'
  if (status === 45) {
    // 结算中也用橙色系
    return 'status-pending'
  }
  if (status === 50) return 'status-to-review'
  if (status === 60) return 'status-completed'
  return ''
}

// 解析时间（兼容数字时间戳和字符串格式）
const parseDate = (time) => {
  if (!time) return null
  let timestamp
  if (typeof time === 'number') {
    timestamp = time
  } else if (typeof time === 'string') {
    if (/^\d+$/.test(time)) {
      timestamp = Number(time)
    } else {
      timestamp = new Date(time.replace(/-/g, '/')).getTime()
    }
  } else {
    timestamp = new Date(time).getTime()
  }
  if (isNaN(timestamp)) return null
  return new Date(timestamp)
}

// 格式化时间 (MM-DD HH:mm)
const formatTime = (timeVal) => {
  const date = parseDate(timeVal)
  if (!date) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

// 格式化金额（分转元）
const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00'
  return (Number(amount) / 100).toFixed(2)
}

// 格式化时长（分钟 -> 中文）
const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0分钟'
  const mins = Number(minutes)
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  if (hours > 0 && remainMins > 0) {
    return `${hours}小时${remainMins}分钟`
  }
  if (hours > 0) {
    return `${hours}小时`
  }
  return `${remainMins}分钟`
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

  const currentPage = pageNo.value

  try {
    const res = await getOnsiteOrderPage({
      pageNo: currentPage,
      pageSize
    })
    const data = res.data || {}
    const list = data.list || data.records || []

    if (isRefresh) {
      orderList.value = list
      idSet.value = new Set(list.map(o => o.id))
    } else {
      // 用 id 去重后追加
      const newItems = list.filter(o => !idSet.value.has(o.id))
      newItems.forEach(o => idSet.value.add(o.id))
      orderList.value = [...orderList.value, ...newItems]
    }

    // 判断是否还有更多数据
    const total = data.total || data.totalCount || 0
    if (total > 0) {
      hasMore.value = orderList.value.length < total
    } else {
      hasMore.value = list.length >= pageSize
    }
    loadMoreStatus.value = hasMore.value ? 'more' : 'noMore'
  } catch (error) {
    console.error('加载现场订单列表失败:', error)
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

// 跳转详情
const goToDetail = (order) => {
  uni.navigateTo({
    url: `/subpkg/onsite/detail?id=${order.id}`
  })
}

onLoad(() => {
  // 审核模式入口守卫
  if (guardReviewEntry()) return
  loadData(true)
})

onShow(() => {
  // 审核模式下不加载
  if (isReviewMode()) return
  // 每次页面显示时刷新第一页
  loadData(true)
})
</script>

<style lang="scss" scoped>
.onsite-list-wrapper {
  min-height: 100vh;
  background: var(--bg-page);
}

.onsite-scroll {
  height: 100vh;
}

.onsite-container {
  padding: 20rpx;
}

/* 订单卡片 */
.onsite-card {
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .service-type {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .service-icon {
      font-size: 36rpx;
    }

    .service-name {
      color: var(--text-primary);
      font-size: 30rpx;
      font-weight: 500;
    }
  }

  .status-tag {
    font-size: 26rpx;
    padding: 8rpx 20rpx;
    border-radius: 20rpx;

    &.status-ongoing {
      background: rgba(59, 130, 246, 0.15);
      color: #3B82F6;
    }

    &.status-pending {
      background: rgba(245, 158, 11, 0.15);
      color: #F59E0B;
    }

    &.status-to-review {
      background: rgba(0, 187, 136, 0.15);
      color: #00BB88;
    }

    &.status-completed {
      background: rgba(107, 114, 128, 0.15);
      color: #6B7280;
    }
  }
}

/* 助教信息 */
.coach-section {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-top: 1rpx solid var(--border-color);
  border-bottom: 1rpx solid var(--border-color);

  .coach-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin-right: 16rpx;
    background: #333;
  }

  .coach-info {
    flex: 1;

    .coach-name {
      color: var(--text-primary);
      font-size: 30rpx;
      font-weight: 500;
    }
  }
}

/* 订单信息 */
.order-info {
  padding: 20rpx 0 0;

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8rpx 0;

    .info-label {
      color: var(--text-secondary);
      font-size: 26rpx;
    }

    .info-value {
      color: var(--text-primary);
      font-size: 26rpx;

      &.price {
        color: #00BB88;
        font-weight: bold;
        font-size: 30rpx;

        .unit {
          font-size: 24rpx;
          margin-right: 2rpx;
        }

        .per-hour {
          font-size: 22rpx;
          font-weight: normal;
          color: var(--text-secondary);
          margin-left: 4rpx;
        }
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
