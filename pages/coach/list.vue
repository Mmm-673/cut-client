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
        >距离最近
        </view>
        <view
            class="sort-item"
            :class="{ active: currentSort === 2 }"
            @click="switchSort(2)"
        >好评优先
        </view>
      </view>
    </view>

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
                >{{ tag }}
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
          <uni-icons type="info" size="60" color="#666"></uni-icons>
          <text class="empty-text">暂无助教数据</text>
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
import {getCoachList} from '@/api/billiard/coach'
import {regeocode} from '@/api/billiard/amap'

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

// 定位相关
const locating = ref(false)
const currentLocation = ref({
  longitude: null,
  latitude: null
})
const currentCity = ref('')

const tabs = ['全部', '新人', '免费出行', '初级', '中级', '高级']

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

// 获取当前位置
const getCurrentLocation = () => {
  locating.value = true

  uni.getLocation({
    type: 'gcj02',
    altitude: true,
    success: async (res) => {
      console.log('定位成功:', res)
      currentLocation.value = {
        longitude: res.longitude,
        latitude: res.latitude
      }

      // 调用后端逆地址解析接口获取城市
      try {
        const geoRes = await regeocode({
          longitude: res.longitude,
          latitude: res.latitude
        })
        console.log('逆地址解析结果:', geoRes)
        if (geoRes.data) {
          currentCity.value = geoRes.data.district || ''
        }
      } catch (e) {
        console.error('逆地址解析失败:', e)
      }

      locating.value = false
      loadData(true)
    },
    fail: (err) => {
      console.error('定位失败:', err)
      locating.value = false
      // #ifdef MP-WEIXIN
      if (err.errMsg && (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize'))) {
        uni.showModal({
          title: '定位权限未开启',
          content: '您未开启定位权限，将无法按距离排序。是否前往开启？',
          confirmText: '去开启',
          success: (res) => {
            if (res.confirm) {
              uni.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.userLocation']) {
                    getCurrentLocation()
                  }
                }
              })
            }
          }
        })
      } else {
        uni.showToast({ title: '定位失败，请检查定位功能', icon: 'none' })
      }
      // #endif
      // #ifdef APP-PLUS
      uni.showModal({
        title: '定位权限未开启',
        content: '您未开启定位权限，将无法按距离排序。是否前往开启？',
        confirmText: '去开启',
        success: (res) => {
          if (res.confirm) {
            uni.openSetting()
          }
        }
      })
      // #endif
      // #ifdef H5
      uni.showToast({ title: '定位失败，请检查浏览器定位权限', icon: 'none' })
      // #endif
    }
  })
}

// 加载数据
const loadData = async (isRefresh = false) => {
  if (loading.value) return

  // 如果是距离排序但没有经纬度，先获取定位
  if (currentSort.value === 1 && (!currentLocation.value.longitude || !currentLocation.value.latitude)) {
    if (!locating.value) {
      getCurrentLocation()
    }
    return
  }

  // 如果是智能排序但没有城市信息，先获取定位
  if (currentSort.value === 0 && !currentCity.value) {
    if (!locating.value) {
      getCurrentLocation()
    }
    return
  }

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
      params.tag = ['新人']
    } else if (currentTab.value === 2) {
      params.tag = ['免费出行']
    }

    // 根据排序类型添加不同的参数
    if (currentSort.value === 1) {
      // 距离最近：添加经纬度
      params.longitude = currentLocation.value.longitude
      params.latitude = currentLocation.value.latitude
    } else if (currentSort.value === 0) {
      // 智能排序：添加城市
      params.city = currentCity.value
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
const switchSort = async (index) => {
  currentSort.value = index

  if (index === 1) {
    // 距离最近：需要获取定位
    if (!currentLocation.value.longitude || !currentLocation.value.latitude) {
      // 还没有定位信息，先获取定位，getCurrentLocation内部会调用loadData
      getCurrentLocation()
      return
    }
  } else if (index === 0) {
    // 智能排序：需要城市信息
    if (!currentCity.value) {
      // 还没有城市信息，先获取定位，getCurrentLocation内部会调用loadData
      if (!currentLocation.value.longitude || !currentLocation.value.latitude) {
        getCurrentLocation()
        return
      }
    }
  }

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
  uni.navigateTo({url: '/pages/booking/hall'})
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
      console.log(systemInfo.windowHeight, headerHeight, (systemInfo.safeAreaInsets?.bottom))

      // 减去系统导航栏、header、底部安全区域
      scrollHeight.value = systemInfo.windowHeight - headerHeight - (systemInfo.safeAreaInsets?.bottom || 0)
    })
  }, 100)

  // 默认智能排序，先获取定位
  getCurrentLocation()
})
</script>

<style lang="scss" scoped>
/* 全局容器 */
.coach-list-page {
  width: 100%;
  height: 100vh;
  background-color: #121619;
  display: flex;
  flex-direction: column;
}

/* 顶部固定区域 */
.header-section {
  flex-shrink: 0;
  background-color: #1E252B;
  position: sticky;
  top: 0;
  z-index: 100;
}

.search-bar {
  padding: 20rpx 32rpx;

  .search-input-wrapper {
    display: flex;
    align-items: center;
    background-color: #2a2a2a;
    border-radius: 48rpx;
    padding: 16rpx 32rpx;

    .search-input {
      flex: 1;
      margin-left: 16rpx;
      color: #fff;
      font-size: 28rpx;
    }

    .search-placeholder {
      color: #666;
    }

    .clear-icon {
      margin-left: 10rpx;
    }
  }
}

.tab-scroll {
  white-space: nowrap;
  overflow-x: scroll;
  padding: 0 32rpx;
  box-sizing: border-box;

  .tab-list {
    display: flex;
    padding: 10rpx 0 20rpx;

    .tab-item {
      flex-shrink: 0;
      padding: 12rpx 32rpx;
      margin-right: 20rpx;
      border-radius: 40rpx;
      font-size: 26rpx;
      color: #9CA3AF;
      background-color: #2a2a2a;
      transition: all 0.2s;

      &:last-child {
        margin-right: 0;
      }

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
  padding: 60rpx 0;

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
  background-color: #121619;
}

/* 助教卡片样式优化 */
.coach-card {
  display: flex;
  background-color: #1E252B;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;

  .coach-avatar .avatar-img {
    width: 140rpx;
    height: 140rpx;
    border-radius: 12rpx;
  }

  .coach-info {
    flex: 1;
    margin-left: 16rpx;
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
        gap: 8rpx;
        flex-wrap: wrap;

        .coach-name {
          font-size: 28rpx;
          color: #fff;
          font-weight: bold;
        }

        .level-tag {
          font-size: 18rpx;
          padding: 2rpx 8rpx;
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
          font-size: 18rpx;
          background: #FF3B30;
          color: #fff;
          padding: 2rpx 8rpx;
          border-radius: 4rpx;
        }
      }

      .distance {
        font-size: 22rpx;
        color: #777;
      }
    }

    .rating-row {
      display: flex;
      align-items: center;
      margin: 8rpx 0;

      .rating {
        color: #FFD700;
        font-size: 24rpx;
        margin: 0 6rpx;
      }

      .review-count {
        color: #777;
        font-size: 22rpx;
      }

      .coach-tags {
        display: flex;
        align-items: center;
        gap: 6rpx;
        margin-left: 8rpx;
        flex-wrap: wrap;

        .coach-tag {
          font-size: 18rpx;
          padding: 0 8rpx;
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
      font-size: 22rpx;
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
      margin-top: 8rpx;

      .price-row {
        .price-symbol {
          color: #00d4aa;
          font-size: 22rpx;
        }

        .price {
          color: #00d4aa;
          font-size: 30rpx;
          font-weight: bold;
        }

        .price-unit {
          color: #777;
          font-size: 20rpx;
        }
      }

      .action-buttons {
        display: flex;
        gap: 8rpx;

        button {
          border: none;
          font-size: 22rpx;
          border-radius: 24rpx;
          padding: 0 20rpx;
          height: 48rpx;
          line-height: 48rpx;
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
