<template>
  <view class="coach-list-page">
    <!-- 审核模式：球厅预约 -->
    <scroll-view v-if="reviewLoaded && reviewMode" scroll-y class="review-scroll" show-scrollbar="false">
      <review-venue />
      <view class="safe-area-bottom"></view>
    </scroll-view>

    <!-- 开关加载中：中性骨架，避免闪现教练内容 -->
    <view v-else-if="!reviewLoaded" class="review-loading">
      <view class="skeleton-card" v-for="i in 4" :key="i">
        <view class="skeleton-line title"></view>
        <view class="skeleton-line"></view>
        <view class="skeleton-line short"></view>
      </view>
    </view>

    <!-- 正常模式：教练列表 -->
    <template v-else>
    <view class="header-section">
      <view class="search-bar">
        <view class="search-input-wrapper">
          <uni-icons type="search" size="18" color="#999"></uni-icons>
          <input
              class="search-input"
              placeholder="搜索裁教姓名或特长"
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
        >距离最近
        </view>
        <view
            class="sort-item"
            :class="{ active: currentSort === 1 }"
            @click="switchSort(1)"
        >好评优先
        </view>
      </view>
    </view>

    <!-- 定位信息 -->
    <view class="location-box">
      <uni-icons type="location" size="18" color="#00BB88" />
      <text class="location-text">
        <text v-if="locating">定位中...</text>
        <text v-else-if="locationDenied">定位权限未开启</text>
        <text v-else-if="currentCity">{{ currentCity }}</text>
        <text v-else>定位失败</text>
      </text>
      <view v-if="!locating && (locationDenied || !currentCity)" class="retry-btn" @click="getCurrentLocation">
        重试定位
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
            <image :src="coach.avatar || coach.mainPhotoUrl || '/static/default-avatar.png'" mode="aspectFill"
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
              <view class="right-info">
                <view class="service-status-dot" :class="coach.serviceStatus === 0 ? 'status-idle' : 'status-busy'"></view>
                <text class="service-status-text">{{ coach.serviceStatus === 0 ? '空闲' : '服务中' }}</text>
                <text class="distance" >{{ formatDistance(coach.distance) }}</text>
              </view>
            </view>

            <view class="rating-row">
              <uni-icons type="star-filled" size="14" color="#FFD700"></uni-icons>
              <text class="rating">评分: {{ coach.overallScore }}</text>
              <text class="review-count">({{ coach.serviceCount || coach.reviewCount || 0 }}单)</text>
              <view class="coach-tags">
                <view
                    v-for="(tag, tagIndex) in (coach.tags || []).filter(t => t !== '新人' && t !== '活跃' && t !== '沉稳')"
                    :key="tagIndex"
                    class="coach-tag"
                    :class="getTagClass(tag)"
                >{{ tag }}
                </view>
              </view>
            </view>

            <view class="desc-row">
              <text class="coach-desc">星座：{{ coach.constellation || '白羊座' }}</text>
            </view>

            <view class="bottom-row">
              <view class="price-row">
                <text class="price-symbol">¥</text>
                <text class="price">{{ formatPrice(coach.hourlyPrice) }}</text>
                <text class="price-unit">/小时</text>
              </view>
              <view class="action-buttons">
                <!-- #ifndef MP-WEIXIN -->
                  <button class="reward-btn" v-if="showRewardBtn" @click.stop="goToReward(coach.id)">
                    <uni-icons type="gift" size="14" color="#FF9500"></uni-icons>
                    <text>心意</text>
                  </button>
                <!-- #endif -->
                <button
                  class="book-btn"
                  :class="{ disabled: coach.serviceStatus === 1 }"
                  :disabled="coach.serviceStatus === 1"
                  @click.stop="handleBook(coach)">
                  {{ coach.serviceStatus === 1 ? '服务中' : '预约' }}
                </button>
              </view>
            </view>
          </view>
        </view>

        <view v-if="coachList.length === 0 && !loading && !refreshing" class="empty-state">
          <uni-icons type="info" size="60" color="#666"></uni-icons>
          <text class="empty-text">暂无裁教数据</text>
        </view>

        <view class="loading-status">
          <uni-load-more :status="loadMoreStatus"></uni-load-more>
        </view>
      </view>
      <view class="safe-area-bottom"></view>
    </scroll-view>
    </template>


  </view>
</template>

<script setup>
import {ref, onMounted, computed, watch} from 'vue'
import {onLoad, onShow} from  "@dcloudio/uni-app"
import {getCoachList} from '@/api/billiard/coach'
import {getRewardSwitch} from '@/api/billiard/user'
import {debounce, formatPrice, showLoading, hideLoading} from '@/utils/common'
import {getLocation, extractCity, formatDistance, showPermissionModal} from '@/utils/location'
import {isLoggedIn} from '@/utils/token'
import {useConfigStore} from '@/store'

const configStore = useConfigStore()
// 审核模式状态（响应式）
const reviewMode = computed(() => configStore.reviewMode)
const reviewLoaded = computed(() => configStore.reviewLoaded)

const statusBarHeight = ref(0)
const scrollHeight = ref(0)
const currentTab = ref(0)
const currentSort = ref(0)
const refreshing = ref(false)
const loading = ref(false)
const loadMoreStatus = ref('more') // more: loading前, loading: 加载中, noMore: 没有更多数据
const showRewardBtn = ref(false)

const pageNo = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const coachList = ref([])
const hasMore = ref(true)

// 定位相关
const locating = ref(false)
const locationDenied = ref(false) // 记录是否已拒绝定位权限
const currentLocation = ref({
  longitude: null,
  latitude: null
})
const currentCity = ref('')

const tabs = ['全部', '新人', '低碳出行', '活跃','沉稳','初级', '中级', '高级', '星级',]

// 等级映射
const levelMap = {
  0: {text: '初级', class: 'junior'},
  1: {text: '中级', class: 'middle'},
  2: {text: '高级', class: 'senior'},
  3: {text: '星级', class: 'star'}
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
  '低碳出行': 'tag-free-travel',
  '斯诺克': 'tag-snooker',
  '中式八球': 'tag-eight-ball',
  '初级': 'tag-junior',
  '中级': 'tag-intermediate',
  '高级': 'tag-senior',
  '星级': 'tag-star'
}

// 预定义的随机颜色样式
const randomTagColors = [
  'tag-random-1',
  'tag-random-2',
  'tag-random-3',
  'tag-random-4',
  'tag-random-5',
  'tag-random-6',
  'tag-random-7',
  'tag-random-8'
]

// 基于标签内容生成哈希值，确保相同标签总是得到相同颜色
const hashTag = (tag) => {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    const char = tag.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

const getTagClass = (tag) => {
  if (tagClassMap[tag]) {
    return tagClassMap[tag]
  }
  // 对于随机标签，基于内容分配固定颜色
  const hash = hashTag(tag)
  const colorIndex = hash % randomTagColors.length
  return randomTagColors[colorIndex]
}

const LOCATION_RETRY_COUNT = 2
const LOCATION_RETRY_DELAY = 600

let pageInitPromise = null

const getLocationWithRetry = async () => {
  let lastError = null
  for (let attempt = 0; attempt <= LOCATION_RETRY_COUNT; attempt++) {
    try {
      return await getLocation({ needRegeocode: true })
    } catch (err) {
      lastError = err
      if (err?.message === 'permission_denied' || err?.message === 'user_cancelled') {
        throw err
      }
      if (attempt < LOCATION_RETRY_COUNT) {
        await new Promise(resolve => setTimeout(resolve, LOCATION_RETRY_DELAY * (attempt + 1)))
      }
    }
  }
  throw lastError
}

const handleLocationError = (err, onRetry) => {
  console.error('定位失败:', err)
  if (err?.message === 'permission_denied') {
    locationDenied.value = true
    showPermissionModal({
      content: '您未开启定位权限，将无法按距离排序。是否前往开启？',
      onSuccess: () => {
        locationDenied.value = false
        onRetry && onRetry()
      }
    })
    return false
  } else if (err?.message === 'user_cancelled') {
    // 用户取消了定位用途说明
    console.log('用户取消了定位')
    return false
  }
  return false
}

const hasCoordinates = () => currentLocation.value.longitude && currentLocation.value.latitude

// 确保已获取定位（距离排序依赖经纬度，用于切换排序等场景）
const ensureLocation = async () => {
  if (hasCoordinates()) {
    return true
  }

  locating.value = true
  showLoading('定位中...')

  try {
    const { longitude, latitude, regeocodeData } = await getLocationWithRetry()
    currentLocation.value = { longitude, latitude }
    currentCity.value = extractCity(regeocodeData)
    locationDenied.value = false
    return true
  } catch (err) {
    return handleLocationError(err, () => refreshPageData())
  } finally {
    locating.value = false
    hideLoading()
  }
}

// 页面初始化：定位完成后拉取列表，全程保持定位中状态
const refreshPageData = async () => {
  // 审核模式开关未就绪时先等待；开启时展示球厅，不请求定位/教练数据
  if (!reviewLoaded.value) {
    try {
      await configStore.initReviewMode()
    } catch (e) {
      // initReviewMode 内部已兜底
    }
  }
  if (reviewMode.value) return

  if (pageInitPromise) {
    return pageInitPromise
  }

  pageInitPromise = (async () => {
    locating.value = true
    showLoading('定位中...')
    try {
      if (currentSort.value === 0) {
        const { longitude, latitude, regeocodeData } = await getLocationWithRetry()
        currentLocation.value = { longitude, latitude }
        currentCity.value = extractCity(regeocodeData)
        locationDenied.value = false
      }
      showLoading('加载中...')
      await fetchCoachList(true)
    } catch (err) {
      handleLocationError(err, () => refreshPageData())
    } finally {
      locating.value = false
      hideLoading()
    }
  })().finally(() => {
    pageInitPromise = null
  })

  return pageInitPromise
}

// 手动重试定位
const getCurrentLocation = async () => {
  currentLocation.value = { longitude: null, latitude: null }
  currentCity.value = ''
  locationDenied.value = false
  await refreshPageData()
}

// 请求裁教列表数据
const fetchCoachList = async (isRefresh = false) => {
  // 审核模式下不请求教练接口
  if (reviewMode.value) return
  if (loading.value) return

  loading.value = true
  if (!locating.value) {
    showLoading('加载中...')
  }
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

    // 添加标签筛选
    if (currentTab.value === 1) {
      params.tag = ['新人']
    } else if (currentTab.value === 2) {
      params.tag = ['低碳出行']
    } else if (currentTab.value === 3) {
      params.tag = ['活跃']
    } else if (currentTab.value === 4) {
      params.tag = ['沉稳']
    }

    // 添加等级筛选 (从索引5开始才是等级)
    if (currentTab.value >= 5) {
      params.level = currentTab.value - 5
    }

    // 根据排序类型添加不同的参数
    if (currentSort.value === 0) {
      // 距离最近：添加经纬度（仅登录用户可用）
      params.longitude = currentLocation.value.longitude
      params.latitude = currentLocation.value.latitude
    }

    console.log("🚀 ~ loadData ~ params:", params)
    const res = await getCoachList(params)
    console.log(res,'===res')
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
    console.error('加载裁教列表失败:', error)
    loadMoreStatus.value = 'noMore'
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
    if (!locating.value) {
      hideLoading()
    }
  }
}

const loadData = async (isRefresh = false) => {
  if (currentSort.value === 0 && !hasCoordinates()) {
    return refreshPageData()
  }
  await fetchCoachList(isRefresh)
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  if (currentSort.value === 0 && !hasCoordinates()) {
    refreshPageData().finally(() => {
      refreshing.value = false
    })
    return
  }
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
  const prevSort = currentSort.value
  currentSort.value = index

  if (index === 0) {
    const located = await ensureLocation()
    if (!located) {
      currentSort.value = prevSort
      return
    }
  }

  loadData(true)
}

// 搜索
const handleSearch = debounce(() => {
  loadData(true)
}, 300)

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  loadData(true)
}

// 跳转详情
const goToDetail = (id) => {
  uni.navigateTo({
    url: `/subpkg/coach/detail?id=${id}`
  })
}

// 加载是否显示心意按钮
const loadCountdownEnabled = async () => {
  // 审核模式下不请求心意开关
  if (reviewMode.value) return
  try {
    const res = await getRewardSwitch()
    console.log(res.data ,'===res.data ')
    showRewardBtn.value = res.data === true
  } catch (error) {
    console.error('加载心意按钮状态失败:', error)
    showRewardBtn.value = false
  }
}

// 跳转心意
const goToReward = (id) => {

  if (!isLoggedIn()) {
    uni.showModal({
      title: '温馨提示',
      content: '登录后可以查看更多精彩内容，是否登录？',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.setStorageSync('loginRedirectPage', getCurrentPages()[getCurrentPages().length - 1].route)
          uni.navigateTo({ url: '/pages/login/index' })
        }
      }
    })
    return
  }
  uni.navigateTo({
    url: '/subpkg/coach/reward?coachId=' + id
  })
}

// 预约
const handleBook = (coach) => {
  if (coach.serviceStatus === 1) {
    uni.showToast({
      title: '该裁教正在服务中',
      icon: 'none'
    })
    return
  }
  if (!isLoggedIn()) {
    uni.showModal({
      title: '温馨提示',
      content: '登录后可以查看更多精彩内容，是否登录？',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.setStorageSync('loginRedirectPage', getCurrentPages()[getCurrentPages().length - 1].route)
          uni.navigateTo({ url: '/pages/login/index' })
        }
      }
    })
    return
  }
  // 保存选中的裁教信息
  uni.setStorageSync('selectedCoach', coach)
  uni.navigateTo({url: '/subpkg/booking/hall'})
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

  // 加载是否显示心意按钮
  loadCountdownEnabled()
})

// 根据审核模式更新导航标题
const applyNavTitle = () => {
  try {
    uni.setNavigationBarTitle({
      title: reviewMode.value ? '球厅预约' : '裁教列表'
    })
  } catch (e) {
    console.warn('设置导航标题失败:', e)
  }
}

// 开关就绪/变化时同步导航标题
watch([reviewLoaded, reviewMode], () => {
  applyNavTitle()
})

onShow(() => {
  applyNavTitle()
  // 审核模式下展示球厅预约，跳过教练列表逻辑
  if (reviewMode.value) return
  // 每次显示都检查是否有默认tab参数
  let needRefresh = false
  try {
    const defaultTab = uni.getStorageSync('coachListDefaultTab')
    const tabTimestamp = uni.getStorageSync('coachListTabTimestamp')
    const now = Date.now()

    console.log('onShow 检查默认tab:', defaultTab, '时间戳:', tabTimestamp)

    // 检查是否是3秒内从首页跳转过来的
    const isRecentFromHome = tabTimestamp && (now - tabTimestamp < 3000)

    if (defaultTab && isRecentFromHome) {
      const tabIndex = tabs.indexOf(defaultTab)
      console.log('tab索引:', tabIndex)
      if (tabIndex !== -1 && currentTab.value !== tabIndex) {
        currentTab.value = tabIndex
        needRefresh = true
        console.log('已设置tab为:', defaultTab)
      }
      // 清除参数
      uni.removeStorageSync('coachListDefaultTab')
      uni.removeStorageSync('coachListTabTimestamp')
    } else {
      // 不是从首页跳转过来的，重置为全部
      if (currentTab.value !== 0) {
        console.log('重置为全部')
        currentTab.value = 0
        needRefresh = true
      }
      // 确保清除旧参数
      uni.removeStorageSync('coachListDefaultTab')
      uni.removeStorageSync('coachListTabTimestamp')
    }
  } catch (e) {
    console.error('处理默认tab失败:', e)
  }

  // 如果需要刷新数据
  if (needRefresh) {
    loadData(true)
  } else if (locationDenied.value || !coachList.value.length || !hasCoordinates()) {
    refreshPageData()
  }
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

/* 定位信息 */
.location-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 24rpx 30rpx 0rpx;
  .location-text {
    color: #fff;
    font-size: 26rpx;
    flex: 1;
  }
  .retry-btn {
    color: #00BB88;
    font-size: 24rpx;
    padding: 8rpx 16rpx;
    border: 1rpx solid #00BB88;
    border-radius: 32rpx;
    flex-shrink: 0;
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

/* 裁教卡片样式优化 */
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

          &.star {
            background: rgba(255, 215, 0, 0.2);
            color: #FFD700;
          }
        }

        .new-tag {
          font-size: 18rpx;
          background: #FF3B30;
          color: #fff;
          padding: 2rpx 8rpx;
          border-radius: 4rpx;
        }

        .service-status-tag {
          font-size: 18rpx;
          padding: 2rpx 8rpx;
          border-radius: 4rpx;

          &.status-idle {
            background: rgba(0, 212, 170, 0.2);
            color: #00d4aa;
          }

          &.status-busy {
            background: rgba(255, 59, 48, 0.2);
            color: #FF3B30;
          }
        }
      }

      .right-info {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8rpx;
      }

      .service-status-dot {
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
      }

      .service-status-dot.status-idle {
        background-color: #00d4aa;
        box-shadow: 0 0 8rpx rgba(0, 212, 170, 0.6);
      }

      .service-status-dot.status-busy {
        background-color: #f5a623;
        box-shadow: 0 0 8rpx rgba(245, 166, 35, 0.6);
      }

      .service-status-text {
        font-size: 20rpx;
        color: #999;
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

          &.tag-star {
            background: rgba(255, 215, 0, 0.15);
            color: #FFD700;
            border: 1rpx solid rgba(255, 215, 0, 0.3);
          }

          &.tag-default {
            background: rgba(102, 102, 102, 0.15);
            color: #999;
            border: 1rpx solid rgba(102, 102, 102, 0.3);
          }

          /* 随机标签颜色 */
          &.tag-random-1 {
            background: rgba(255, 59, 48, 0.15);
            color: #FF3B30;
            border: 1rpx solid rgba(255, 59, 48, 0.3);
          }

          &.tag-random-2 {
            background: rgba(255, 149, 0, 0.15);
            color: #FF9500;
            border: 1rpx solid rgba(255, 149, 0, 0.3);
          }

          &.tag-random-3 {
            background: rgba(255, 204, 0, 0.15);
            color: #FFCC00;
            border: 1rpx solid rgba(255, 204, 0, 0.3);
          }

          &.tag-random-4 {
            background: rgba(52, 199, 89, 0.15);
            color: #34C759;
            border: 1rpx solid rgba(52, 199, 89, 0.3);
          }

          &.tag-random-5 {
            background: rgba(0, 212, 170, 0.15);
            color: #00d4aa;
            border: 1rpx solid rgba(0, 212, 170, 0.3);
          }

          &.tag-random-6 {
            background: rgba(0, 122, 255, 0.15);
            color: #007AFF;
            border: 1rpx solid rgba(0, 122, 255, 0.3);
          }

          &.tag-random-7 {
            background: rgba(88, 86, 214, 0.15);
            color: #5856D6;
            border: 1rpx solid rgba(88, 86, 214, 0.3);
          }

          &.tag-random-8 {
            background: rgba(175, 82, 222, 0.15);
            color: #AF52DE;
            border: 1rpx solid rgba(175, 82, 222, 0.3);
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

          &.disabled {
            background: #444;
            color: #888;
          }
        }
      }
    }
  }
}

.loading-status {
  padding: 20rpx 0;
}

/* 审核模式：球厅滚动区 */
.review-scroll {
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  padding-top: 24rpx;
}

/* 开关加载中的中性骨架 */
.review-loading {
  flex: 1;
  min-height: 0;
  padding: 24rpx 30rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .skeleton-card {
    background: #1E252B;
    border: 1rpx solid rgba(255, 255, 255, 0.05);
    border-radius: 20rpx;
    padding: 28rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    animation: skeletonPulse 1.4s ease-in-out infinite;

    .skeleton-line {
      height: 24rpx;
      border-radius: 12rpx;
      background: rgba(255, 255, 255, 0.06);

      &.title {
        width: 50%;
        height: 30rpx;
      }

      &.short {
        width: 70%;
      }
    }
  }
}

@keyframes skeletonPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
</style>
