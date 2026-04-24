<template>
  <view class="favorites-page">
    <scroll-view
        class="list-scroll"
        scroll-y="true"
        refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
    >
      <view class="coach-list">
        <view
            v-for="(coach, index) in coachList"
            :key="coach.id"
            class="coach-card"
            @click="goToDetail(coach.id)"
        >
          <view class="coach-avatar">
            <image :src="coach.mainPhotoUrl || coach.avatar || '/static/default-avatar.png'" mode="aspectFill"
                   class="avatar-img"></image>
          </view>

          <view class="coach-info">
            <view class="info-top">
              <view class="name-row">
                <text class="coach-name">{{ coach.stageName || coach.name }}</text>
                <view class="level-tag" :class="getLevelClass(coach.level)">
                  {{ getLevelText(coach.level) }}
                </view>
              </view>
              <text class="favorite-time">{{ formatTime(coach.favoriteTime) }}</text>
            </view>

            <view class="rating-row">
              <uni-icons type="star-filled" size="14" color="#FFD700"></uni-icons>
              <text class="rating">{{ coach.overallScore || coach.rating || 5.0 }}</text>
              <view class="status-tags">
                <view class="status-tag" :class="coach.workStatus === 1 ? 'online' : 'offline'">
                  {{ coach.workStatus === 1 ? '在线' : '离线' }}
                </view>
                <view class="status-tag" :class="coach.serviceStatus === 0 ? 'free' : 'busy'">
                  {{ coach.serviceStatus === 0 ? '空闲' : '服务中' }}
                </view>
              </view>
            </view>

            <view class="desc-row">
              <text class="coach-desc">{{ coach.introduction || coach.desc || '暂无简介' }}</text>
            </view>

            <view class="bottom-row">
              <view class="price-row">
                <text class="price-symbol">¥</text>
                <text class="price">{{ coach.price || 0 }}</text>
                <text class="price-unit">/小时</text>
              </view>
              <view class="action-buttons">
                <button class="reward-btn" @click.stop="goToReward(coach.id)">
                  <uni-icons type="gift" size="14" color="#FF9500"></uni-icons>
                  <text>打赏</text>
                </button>
                <button class="book-btn" @click.stop="handleBook(coach)">预约</button>
              </view>
            </view>
          </view>
        </view>

        <view v-if="coachList.length === 0 && !loading && !refreshing" class="empty-state">
          <uni-icons type="heart" size="60" color="#666"></uni-icons>
          <text class="empty-text">暂无收藏的助教</text>
        </view>

        <view class="loading-status">
          <uni-load-more :status="loadMoreStatus"></uni-load-more>
        </view>
      </view>
      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {getFavoriteCoachPage} from '@/api/billiard/coach'

const statusBarHeight = ref(0)
const refreshing = ref(false)
const loading = ref(false)
const loadMoreStatus = ref('more')

const pageNo = ref(1)
const pageSize = ref(20)
const coachList = ref([])
const hasMore = ref(true)

// 等级映射
const levelMap = {
  0: {text: '初级', class: 'junior'},
  1: {text: '中级', class: 'middle'},
  2: {text: '高级', class: 'senior'}
}

const getLevelText = (level) => {
  if (typeof level === 'string') {
    return level
  }
  return levelMap[level]?.text || '初级'
}

const getLevelClass = (level) => {
  if (typeof level === 'string') {
    return level === '高级' ? 'senior' : 'middle'
  }
  return levelMap[level]?.class || 'junior'
}

// 格式化收藏时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日收藏`
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

    const res = await getFavoriteCoachPage(params)
    const data = res.data || {}
    const list = data.list || data.records || data.rows || []

    if (isRefresh) {
      coachList.value = list
    } else {
      coachList.value = [...coachList.value, ...list]
    }

    const total = data.total || data.totalCount || 0
    if (total > 0) {
      hasMore.value = coachList.value.length < total
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
    console.error('加载收藏列表失败:', error)
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

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 跳转详情
const goToDetail = (id) => {
  uni.navigateTo({
    url: `/pages/coach/detail?id=${id}`
  })
}

// 跳转打赏
const goToReward = (id) => {
  uni.navigateTo({
    url: '/pages/coach/reward?coachId=' + id
  })
}

// 预约
const handleBook = (coach) => {
  uni.setStorageSync('selectedCoach', coach)
  uni.navigateTo({url: '/pages/booking/hall'})
}

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
  loadData(true)
})
</script>

<style lang="scss" scoped>
.favorites-page {
  width: 100%;
  height: 100vh;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
  background-color: #1E252B;
  flex-shrink: 0;

  .nav-back {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #fff;
  }

  .nav-placeholder {
    width: 60rpx;
  }
}

/* 滚动区域 */
.list-scroll {
  flex: 1;
  min-height: 0;

  .coach-list {
    padding: 20rpx 30rpx;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .empty-text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #666;
  }
}

/* 适配底部安全区 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}

/* 助教卡片样式 */
.coach-card {
  display: flex;
  background-color: #2a2a2a;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;

  .coach-avatar .avatar-img {
    width: 180rpx;
    height: 180rpx;
    border-radius: 16rpx;
  }

  .coach-info {
    flex: 1;
    margin-left: 20rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .info-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .name-row {
        display: flex;
        align-items: center;
        gap: 10rpx;

        .coach-name {
          font-size: 32rpx;
          color: #fff;
          font-weight: bold;
        }

        .level-tag {
          font-size: 20rpx;
          padding: 2rpx 10rpx;
          border-radius: 4rpx;

          &.senior {
            background: rgba(0, 212, 170, 0.2);
            color: #00d4aa;
          }

          &.middle {
            background: rgba(255, 149, 0, 0.2);
            color: #FF9500;
          }

          &.junior {
            background: rgba(102, 102, 102, 0.2);
            color: #999;
          }
        }
      }

      .favorite-time {
        font-size: 22rpx;
        color: #666;
      }
    }

    .rating-row {
      display: flex;
      align-items: center;
      margin: 10rpx 0;

      .rating {
        color: #FFD700;
        font-size: 26rpx;
        margin: 0 8rpx;
      }

      .status-tags {
        display: flex;
        gap: 10rpx;
        margin-left: 16rpx;

        .status-tag {
          font-size: 20rpx;
          padding: 2rpx 10rpx;
          border-radius: 4rpx;

          &.online {
            background: rgba(0, 212, 170, 0.2);
            color: #00d4aa;
          }

          &.offline {
            background: rgba(102, 102, 102, 0.2);
            color: #999;
          }

          &.free {
            background: rgba(76, 217, 100, 0.2);
            color: #4cd964;
          }

          &.busy {
            background: rgba(255, 149, 0, 0.2);
            color: #FF9500;
          }
        }
      }
    }

    .desc-row .coach-desc {
      font-size: 24rpx;
      color: #999;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10rpx;

      .price-row {
        .price-symbol {
          color: #00d4aa;
          font-size: 24rpx;
        }

        .price {
          color: #00d4aa;
          font-size: 36rpx;
          font-weight: bold;
        }

        .price-unit {
          color: #777;
          font-size: 22rpx;
        }
      }

      .action-buttons {
        display: flex;
        gap: 10rpx;

        button {
          border: none;
          font-size: 24rpx;
          border-radius: 30rpx;
          padding: 0 24rpx;
          height: 54rpx;
          line-height: 54rpx;
        }

        .reward-btn {
          background: #3a3a3a;
          color: #FF9500;
          display: flex;
          align-items: center;
          gap: 4rpx;
        }

        .book-btn {
          background: #00d4aa;
          color: #fff;
        }
      }
    }
  }
}

.loading-status {
  padding: 20rpx 0;
}
</style>