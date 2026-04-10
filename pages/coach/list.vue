<template>
  <view class="coach-list-page">
    <view class="header-section">
      <view class="search-bar">
        <view class="search-input-wrapper">
          <uni-icons type="search" size="18" color="#999"></uni-icons>
          <input
            class="search-input"
            placeholder="搜索助教姓名或特长"
            placeholder-class="search-placeholder"
            v-model="searchKeyword"
            @confirm="handleSearch"
          />
          <uni-icons
            v-if="searchKeyword"
            type="clear"
            size="16"
            color="#999"
            class="clear-icon"
            @click="clearSearch"
          ></uni-icons>
        </view>
      </view>
      <scroll-view class="tab-scroll" scroll-x="true" :show-scrollbar="false">
        <view class="tab-list">
          <view
            v-for="(tab, index) in tabs"
            :key="index"
            class="tab-item"
            :class="{ active: currentTab === index }"
            @click="switchTab(index)"
          >
            {{ tab }}
          </view>
        </view>
      </scroll-view>

      <view class="sort-bar">
        <view
          class="sort-item"
          :class="{ active: currentSort === 0 }"
          @click="switchSort(0)"
        >
          <text>智能排序</text>
          <uni-icons v-if="currentSort === 0" type="bottom" size="12" color="#00d4aa"></uni-icons>
        </view>
        <view
          class="sort-item"
          :class="{ active: currentSort === 1 }"
          @click="switchSort(1)"
        >距离最近</view>
        <view
          class="sort-item"
          :class="{ active: currentSort === 2 }"
          @click="switchSort(2)"
        >好评优先</view>
      </view>
    </view>

    <scroll-view
      class="list-scroll"
      scroll-y="true"
      refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
      :style="{ height: scrollHeight + 'px' }"
    >
      <view class="coach-list">
        <view
          v-for="(coach, index) in coachList"
          :key="coach.id"
          class="coach-card"
          @click="goToDetail(coach.id)"
        >
          <view class="coach-avatar">
            <image :src="coach.mainPhotoUrl || coach.avatar || '/static/default-avatar.png'" mode="aspectFill" class="avatar-img"></image>
          </view>

          <view class="coach-info">
            <view class="info-top">
              <view class="name-row">
                <text class="coach-name">{{ coach.stageName || coach.name }}</text>
                <view class="level-tag" :class="getLevelClass(coach.level)">
                  {{ getLevelText(coach.level) }}
                </view>
                <view v-if="coach.tags && coach.tags.includes('新人')" class="new-tag">新人</view>
              </view>
              <text class="distance">{{ formatDistance(coach.distance) }}</text>
            </view>

            <view class="rating-row">
              <uni-icons type="star-filled" size="14" color="#FFD700"></uni-icons>
              <text class="rating">{{ coach.overallScore || coach.rating || 5.0 }}</text>
              <text class="review-count">({{ coach.serviceCount || coach.reviewCount || 0 }}单)</text>
              <view class="coach-tags">
                <view
                  v-for="(tag, tagIndex) in (coach.tags || []).filter(t => t !== '新人')"
                  :key="tagIndex"
                  class="coach-tag"
                  :class="getTagClass(tag)"
                >{{ tag }}</view>
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
          <uni-icons type="info" size="60" color="#666"></uni-icons>
          <text class="empty-text">暂无助教数据</text>
        </view>

        <view class="loading-status">
          <uni-load-more :status="loadMoreStatus"></uni-load-more>
        </view>

        <view class="safe-area-bottom"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCoachList } from '@/api/billiard/coach'

const statusBarHeight = ref(0)
const scrollHeight = ref(0)
const currentTab = ref(0)
const currentSort = ref(0)
const refreshing = ref(false)
const loading = ref(false)
const loadMoreStatus = ref('more') // more: loading前, loading: 加载中, noMore: 没有更多数据

const pageNo = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const coachList = ref([])
const hasMore = ref(true)

const tabs = ['全部', '新人', '免费出行', '初级', '中级', '高级']

// 等级映射
const levelMap = {
  0: { text: '初级', class: 'junior' },
  1: { text: '中级', class: 'middle' },
  2: { text: '高级', class: 'senior' }
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

// 标签颜色映射
const tagClassMap = {
  '新人': 'tag-new',
  '免费出行': 'tag-free-travel',
  '斯诺克': 'tag-snooker',
  '中式八球': 'tag-eight-ball',
  '初级': 'tag-junior',
  '中级': 'tag-intermediate',
  '高级': 'tag-senior'
}

const getTagClass = (tag) => {
  return tagClassMap[tag] || 'tag-default'
}

// 格式化距离显示
const formatDistance = (distance) => {
  if (distance === null || distance === undefined || distance === '') {
    return ''
  }
  if (typeof distance === 'number') {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
  }
  return distance
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

    // 添加关键词搜索
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    // 添加等级筛选
    if (currentTab.value >= 3) {
      params.level = currentTab.value - 3
    }

    // 添加标签筛选
    if (currentTab.value === 1) {
      params.tag = '新人'
    } else if (currentTab.value === 2) {
      params.tag = '免费出行'
    }

    const res = await getCoachList(params)
    const data = res.data || {}
    // 兼容不同的返回结构：list / records / rows
    const list = data.list || data.records || data.rows || []

    if (isRefresh) {
      coachList.value = list
    } else {
      coachList.value = [...coachList.value, ...list]
    }

    // 判断是否还有更多数据：优先看 total，其次看返回数量
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
    console.error('加载助教列表失败:', error)
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

// 切换标签
const switchTab = (index) => {
  currentTab.value = index
  loadData(true)
}

// 切换排序
const switchSort = (index) => {
  currentSort.value = index
  // TODO: 根据排序类型调整请求参数
  loadData(true)
}

// 搜索
const handleSearch = () => {
  loadData(true)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  loadData(true)
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
  // 保存选中的助教信息
  uni.setStorageSync('selectedCoach', coach)
  uni.navigateTo({ url: '/pages/booking/hall' })
}

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0

  // 计算滚动区域高度
  setTimeout(() => {
    const query = uni.createSelectorQuery()
    query.select('.header-section').boundingClientRect()
    query.exec((res) => {
      const headerHeight = res[0]?.height || 0
      console.log(systemInfo.windowHeight, headerHeight ,(systemInfo.safeAreaInsets?.bottom))

      // 减去系统导航栏、header、底部安全区域
      scrollHeight.value = systemInfo.windowHeight - headerHeight - (systemInfo.safeAreaInsets?.bottom || 0)
    })
  }, 100)

  // 加载数据
  loadData(true)
})
</script>

<style lang="scss" scoped>
/* 全局容器 */
.coach-list-page {
  width: 100%;
  min-height: 100vh;
  background-color: #1a1a1a;
}

/* 顶部固定区域 */
.header-section {
  background-color: #2a2a2a;
}

.search-bar {
  padding: 20rpx 32rpx;
  .search-input-wrapper {
    display: flex;
    align-items: center;
    background-color: #3a3a3a;
    border-radius: 48rpx;
    padding: 16rpx 32rpx;
    .search-input {
      flex: 1;
      margin-left: 16rpx;
      color: #fff;
      font-size: 28rpx;
    }
    .search-placeholder {
      color: #999;
    }
    .clear-icon {
      margin-left: 10rpx;
    }
  }
}

.tab-scroll {
  white-space: nowrap;
  .tab-list {
    display: flex;
    padding: 10rpx 32rpx 20rpx;
    .tab-item {
      padding: 12rpx 32rpx;
      margin-right: 20rpx;
      border-radius: 40rpx;
      font-size: 26rpx;
      color: #999;
      background-color: #333;
      transition: all 0.2s;
      &.active {
        background-color: #00d4aa;
        color: #fff;
      }
    }
  }
}

.sort-bar {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
  border-top: 1rpx solid #333;
  .sort-item {
    display: flex;
    align-items: center;
    gap: 4rpx;
    font-size: 26rpx;
    color: #999;
    &.active {
      color: #00d4aa;
      font-weight: bold;
    }
  }
}

/* 滚动区域 */
.list-scroll {
  /* 高度通过内联样式动态设置 */

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
  /* constant 对应 iOS < 11.2，env 对应 iOS >= 11.2 */
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}

/* 助教卡片样式优化 */
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
        flex-wrap: wrap;
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
        .new-tag {
          font-size: 20rpx;
          background: #FF3B30;
          color: #fff;
          padding: 2rpx 10rpx;
          border-radius: 4rpx;
        }
      }
      .distance {
        font-size: 24rpx;
        color: #777;
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
      .review-count {
        color: #777;
        font-size: 24rpx;
      }
      .coach-tags {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin-left: 10rpx;
        flex-wrap: wrap;

        .coach-tag {
          font-size: 20rpx;
          padding: 0 10rpx;
          border-radius: 4rpx;
          white-space: nowrap;

          &.tag-new {
            background: rgba(255, 59, 48, 0.15);
            color: #FF3B30;
            border: 1rpx solid rgba(255, 59, 48, 0.3);
          }

          &.tag-free-travel {
            background: rgba(0, 212, 170, 0.15);
            color: #00d4aa;
            border: 1rpx solid rgba(0, 212, 170, 0.3);
          }

          &.tag-snooker {
            background: rgba(255, 59, 48, 0.15);
            color: #FF3B30;
            border: 1rpx solid rgba(255, 59, 48, 0.3);
          }

          &.tag-eight-ball {
            background: rgba(0, 122, 255, 0.15);
            color: #007AFF;
            border: 1rpx solid rgba(0, 122, 255, 0.3);
          }

          &.tag-junior {
            background: rgba(102, 102, 102, 0.15);
            color: #999;
            border: 1rpx solid rgba(102, 102, 102, 0.3);
          }

          &.tag-intermediate {
            background: rgba(255, 149, 0, 0.15);
            color: #FF9500;
            border: 1rpx solid rgba(255, 149, 0, 0.3);
          }

          &.tag-senior {
            background: rgba(0, 212, 170, 0.15);
            color: #00d4aa;
            border: 1rpx solid rgba(0, 212, 170, 0.3);
          }

          &.tag-default {
            background: rgba(102, 102, 102, 0.15);
            color: #999;
            border: 1rpx solid rgba(102, 102, 102, 0.3);
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
