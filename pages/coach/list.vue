<template>
  <view class="coach-list-page" :class="themeClass">
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
      <coach-search-bar v-model="searchKeyword" @search="handleSearch" />

      <!-- 服务类型筛选 -->
      <coach-filter-tabs :tabs="serviceTypeList" v-model:activeValue="currentServiceType" @change="switchServiceType" />

      <!-- 风格标签筛选（暂隐藏，仅保留服务类型筛选）
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
      -->
    </view>

    <!-- 定位信息 -->
    <view v-if="showCoachCity" style="margin: 24rpx 30rpx 0rpx;">
      <location-picker
          v-model="selectedCityId"
          :area-data="areaLocalData"
          :locating="locating"
          :location-denied="locationDenied"
          :display-text="displayCityName"
          popup-title="选择城市"
          @change="onCityChange"
          @relocate="reLocate"
      />
    </view>

    <scroll-view
        class="list-scroll"
        scroll-y="true"
        :scroll-top="scrollTop"
        refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
        @scroll="onScroll"
    >
      <view class="coach-list">
        <coach-list-card
            v-for="coach in displayCoachList"
            :key="coach.id"
            :coach="coach"
            :show-reward="showRewardBtn"
            @click="goToDetail(coach.id)"
            @book="handleBook"
            @reward="goToReward(coach.id)"
        />

        <empty-state v-if="coachList.length === 0 && !loading && !refreshing" icon="info" text="当前暂未开通，敬请期待" :icon-size="60" icon-color="#666">
          <text class="empty-tip">有意合作请联系客服</text>
        </empty-state>

        <view class="loading-status">
          <uni-load-more :status="loadMoreStatus"></uni-load-more>
        </view>
      </view>
      <view class="safe-area-bottom"></view>
    </scroll-view>

    <!-- 刷新/返回顶部按钮 -->
    <view
        v-show="showBackTop"
        class="back-top-btn"
        @click="scrollToTop"
    >
      <uni-icons type="refresh" size="20" color="#fff"></uni-icons>
      <text class="back-top-text">刷新</text>
    </view>
    </template>


  </view>
</template>

<script setup>
import {ref, onMounted, computed, watch} from 'vue'
import {onLoad, onShow} from  "@dcloudio/uni-app"
import {getCoachList} from '@/api/billiard/coach'
import {getRewardSwitch} from '@/api/billiard/user'
import {getAreaTree} from '@/api/billiard/area'
import {debounce, formatPrice, showLoading, hideLoading} from '@/utils/common'
import { getPriceUnit } from '@/utils/pricing'
import {getLocation, extractCity, formatDistance, showPermissionModal} from '@/utils/location'
import {isLoggedIn} from '@/utils/token'
import {useConfigStore, useThemeStore, useCoachStore} from '@/store'
import {REMOTE_CONFIG_KEYS} from '@/store/modules/config'
import {usePageTheme} from '@/composables/usePageTheme'
import { useList } from '@/composables/useList'
import EmptyState from '@/components/empty-state/empty-state.vue'
import CoachFilterTabs from '@/components/coach-filter-tabs/coach-filter-tabs.vue'
import CoachSearchBar from '@/components/coach-search-bar/coach-search-bar.vue'
import CoachListCard from '@/components/coach-list-card/coach-list-card.vue'
import LocationPicker from '@/components/location-picker/location-picker.vue'

const configStore = useConfigStore()
const themeStore = useThemeStore()
const coachStore = useCoachStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 页面主题管理
usePageTheme()
// 审核模式状态（响应式）
const reviewMode = computed(() => configStore.reviewMode)
const reviewLoaded = computed(() => configStore.reviewLoaded)

// 是否显示裁教城市选择器（远程配置 SHOW_COACH_CITY，默认显示）
const showCoachCity = computed(() => {
  return configStore.getRemoteConfigBoolean(REMOTE_CONFIG_KEYS.SHOW_COACH_CITY, true)
})

// 更新自定义 TabBar 选中状态
const updateCustomTabBar = () => {
  if (uni.$updateCustomTabBar) {
    uni.$updateCustomTabBar(1)
  }
}

const statusBarHeight = ref(0)
const scrollHeight = ref(0)
const currentTab = ref(0)
const currentSort = ref(0)
const currentServiceType = ref(null) // null = 全部
const showRewardBtn = ref(false)

const searchKeyword = ref('')
const listLoaded = ref(false) // 列表是否已加载，onShow 非首次不自动刷新

// 返回顶部
const scrollTop = ref(0)
const showBackTop = ref(false)
const BACK_TOP_THRESHOLD = 500 // 滚动超过 500px 显示返回顶部按钮

const onScroll = (e) => {
  showBackTop.value = e.detail.scrollTop > BACK_TOP_THRESHOLD
}

const scrollToTop = () => {
  // 回到顶部
  scrollTop.value = scrollTop.value === 0 ? 1 : 0
  // 重新加载最新数据（从第1页开始）
  loadData(true)
}

// 定位相关
const locating = ref(false)
const locationDenied = ref(false) // 记录是否已拒绝定位权限
const currentLocation = ref({
  longitude: null,
  latitude: null
})
const currentCity = ref('')
const selectedCityId = ref(null)

// 城市选择相关
const areaLocalData = ref([])
const areaTree = ref([])

// 用于显示的城市名
const displayCityName = computed(() => {
  if (selectedCityId.value) {
    const findName = (list, id) => {
      for (const area of list) {
        if (area.id === id) return area.name
        if (area.children) {
          const found = findName(area.children, id)
          if (found) return found
        }
      }
      return null
    }
    return findName(areaTree.value, selectedCityId.value) || ''
  }
  return currentCity.value || ''
})

const tabs = ['全部', '新人', '低碳出行', '活跃','沉稳','初级', '中级', '高级', '星级',]

// 服务类型列表
const serviceTypeList = [
  { value: null, name: '全部' },
  { value: 1, name: '台球陪练' },
  { value: 2, name: '潮玩领航' },
  { value: 3, name: '酒艺品鉴' },
  { value: 4, name: '影视赏析' }
]

// 切换服务类型
const switchServiceType = (value) => {
  currentServiceType.value = value
  loadData(true)
}

// 列表数据（useList 管理）
const {
  list: coachList,
  loading,
  refreshing,
  loadingMore,
  hasMore,
  loadMoreStatus,
  loadList: fetchCoachList,
  refresh: refreshCoachList,
  loadMore: loadMoreCoachList,
  reset: resetCoachList,
} = useList({
  fetchApi: getCoachList,
  pageSize: 20,
  pageParamName: 'pageNum',
  pageSizeParamName: 'pageSize',
  getParams: () => {
    const params = {}
    // 关键词搜索
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    // tab 筛选：0=全部, 1=新人, 2=低碳出行, 3=活跃, 4=沉稳 (tag筛选)
    if (currentTab.value === 1) {
      params.tag = ['新人']
    } else if (currentTab.value === 2) {
      params.tag = ['低碳出行']
    } else if (currentTab.value === 3) {
      params.tag = ['活跃']
    } else if (currentTab.value === 4) {
      params.tag = ['沉稳']
    }
    // 等级筛选 (从索引5开始才是等级)
    if (currentTab.value >= 5) {
      params.level = currentTab.value - 5
    }
    // 排序：距离最近时添加经纬度
    if (currentSort.value === 0 && currentLocation.value.longitude && currentLocation.value.latitude) {
      params.longitude = currentLocation.value.longitude
      params.latitude = currentLocation.value.latitude
    }
    // 服务类型筛选
    if (currentServiceType.value !== null && currentServiceType.value !== undefined) {
      params.serviceType = currentServiceType.value
    }
    // 城市筛选
    if (showCoachCity.value && currentCity.value) {
      params.city = currentCity.value
    }
    return params
  },
  transform: (res) => {
    const data = res.data || {}
    const list = data.list || data.records || data.rows || []
    // 过滤特殊ID（测试用教练）
    return list.filter(item => item.id !== 27)
  },
  getTotal: (res) => {
    const data = res.data || {}
    return data.total || data.totalCount || 0
  },
  onError: (error) => {
    console.error('加载裁教列表失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  },
  onSuccess: () => {
    listLoaded.value = true
  }
})

// 预处理教练列表展示数据
const displayCoachList = computed(() => {
  return coachList.value.map(coach => {
    const displayPrice = formatPrice(getCoachDisplayPrice(coach))
    const priceUnit = getCoachPriceUnit(coach)
    return {
      ...coach,
      displayPrice,
      priceUnit
    }
  })
})


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

// 加载地区树
const loadAreaTree = async () => {
  try {
    const res = await getAreaTree()
    if (res.code === 0 && res.data) {
      // 处理数据，只保留到市级，去掉区县级
      const processData = (list) => {
        return list.map(item => {
          const newItem = { ...item }
          if (newItem.children && newItem.children.length > 0) {
            // 处理市级，清空市级的children（去掉区县）
            newItem.children = newItem.children.map(city => {
              const cityItem = { ...city }
              cityItem.children = undefined // 去掉区县级
              return cityItem
            })
          }
          return newItem
        })
      }
      const processedData = processData(res.data)
      areaTree.value = processedData
      areaLocalData.value = processedData
    }
  } catch (error) {
    console.error('加载地区树失败:', error)
  }
}

// 从地区树中查找城市名
const findCityNameById = (id) => {
  if (!id) return ''
  const findName = (list, targetId) => {
    for (const area of list) {
      if (area.id === targetId) return area.name
      if (area.children) {
        const found = findName(area.children, targetId)
        if (found) return found
      }
    }
    return null
  }
  return findName(areaTree.value, id) || ''
}

// 城市选择变化
const onCityChange = async (e) => {
  const selected = e.detail.value
  if (selected && selected.length > 0) {
    // 获取最后一级（城市级）
    const selectedArea = selected[selected.length - 1]
    selectedCityId.value = selectedArea.value
    const cityName = findCityNameById(selectedCityId.value)
    // 清空当前城市，使用选中的城市名
    currentCity.value = cityName
    // 重新加载列表
    await loadData(true)
  }
}

// 重新定位
const reLocate = async () => {
  selectedCityId.value = null
  await refreshPageData()
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

// 加载数据（包装 useList，处理定位和审核模式）
const loadData = async (isRefresh = false) => {
  if (reviewMode.value) return
  if (currentSort.value === 0 && !hasCoordinates()) {
    return refreshPageData()
  }
  if (isRefresh) {
    await fetchCoachList()
  } else {
    // useList 的 loadList 总是从第1页开始
    // 这里不做任何事，因为刷新和加载更多由 useList 的方法处理
  }
}

// 下拉刷新
const onRefresh = () => {
  if (reviewMode.value) {
    refreshing.value = false
    return
  }
  if (currentSort.value === 0 && !hasCoordinates()) {
    refreshPageData().finally(() => {
      // refreshPageData 内部会调用 loadData 并管理 refreshing
    })
    return
  }
  refreshCoachList()
}

// 上拉加载更多
const loadMore = () => {
  if (reviewMode.value) return
  loadMoreCoachList()
}

// 切换标签
const switchTab = (index) => {
  currentTab.value = index
  fetchCoachList()
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

// 获取助教展示价格（优先 price，兜底 hourlyPrice）
const getCoachDisplayPrice = (coach) => {
  if (!coach) return 0
  // 优先用 serviceItemList 中第一个服务的 price
  const firstService = coach.serviceItemList?.[0]
  if (firstService && firstService.price != null) {
    return firstService.price
  }
  // 兜底助教顶层 price / hourlyPrice
  return coach.price ?? coach.hourlyPrice ?? 0
}

// 获取助教价格单位
const getCoachPriceUnit = (coach) => {
  if (!coach) return '小时'
  const firstService = coach.serviceItemList?.[0]
  if (firstService) {
    return getPriceUnit(firstService)
  }
  return '小时'
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
  // 保存选中的裁教信息到 Store（同时同步到 Storage 作为降级）
  coachStore.setSelectedCoach(coach)
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

      // 减去系统导航栏、header、底部安全区域
      scrollHeight.value = systemInfo.windowHeight - headerHeight - (systemInfo.safeAreaInsets?.bottom || 0)
    })
  }, 100)

  // 加载远程配置
  configStore.loadRemoteConfig()
  // 加载地区树
  loadAreaTree()
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
  // 同步 tabBar 文案（setTabBarItem 仅 tab 页可调，启动时可能被跳过）
  configStore.syncTabBarLabel()
  // 审核模式下展示球厅预约，跳过教练列表逻辑
  if (reviewMode.value) return

  let needRefresh = false
  try {
    const defaultTab = uni.getStorageSync('coachListDefaultTab')
    const tabTimestamp = uni.getStorageSync('coachListTabTimestamp')
    const now = Date.now()

    // 检查是否是3秒内从首页跳转过来的
    const isRecentFromHome = tabTimestamp && (now - tabTimestamp < 3000)

    if (defaultTab && isRecentFromHome) {
      const tabIndex = tabs.indexOf(defaultTab)
      if (tabIndex !== -1 && currentTab.value !== tabIndex) {
        currentTab.value = tabIndex
        needRefresh = true
      }
      // 清除参数
      uni.removeStorageSync('coachListDefaultTab')
      uni.removeStorageSync('coachListTabTimestamp')
    } else {
      uni.removeStorageSync('coachListDefaultTab')
      uni.removeStorageSync('coachListTabTimestamp')
    }
  } catch (e) {
    console.error('处理默认tab失败:', e)
  }

  // 首次进入加载数据；从首页带tab过来时刷新；其他情况（如从详情页返回）不自动刷新
  if (!listLoaded.value) {
    refreshPageData()
  } else if (needRefresh) {
    loadData(true)
  }

  // 更新自定义 TabBar 选中状态
  updateCustomTabBar()
})
</script>

<style lang="scss" scoped>
/* 全局容器 */
.coach-list-page {
  width: 100%;
  height: 100vh;
  background-color: var(--bg-page);
  display: flex;
  flex-direction: column;
}

/* 顶部固定区域 */
.header-section {
  flex-shrink: 0;
  background-color: var(--bg-card);
  position: sticky;
  top: 0;
  z-index: 100;
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
      color: var(--text-secondary);
      background-color: var(--bg-secondary);
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
  border-top: 1rpx solid var(--border-color);

  .sort-item {
    display: flex;
    align-items: center;
    gap: 4rpx;
    font-size: 26rpx;
    color: var(--text-tertiary);

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
    color: var(--text-tertiary);
  }

  .empty-tip {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: var(--text-tertiary);
    opacity: 0.7;
  }
}

/* 适配底部安全区 */
.safe-area-bottom {
  /* constant 对应 iOS < 11.2，env 对应 iOS >= 11.2 */
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
  background-color: var(--bg-page);
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
    background: var(--bg-card);
    border: 1rpx solid var(--border-color);
    border-radius: 20rpx;
    padding: 28rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    animation: skeletonPulse 1.4s ease-in-out infinite;

    .skeleton-line {
      height: 24rpx;
      border-radius: 12rpx;
      background: var(--bg-secondary);

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

/* 刷新按钮 */
.back-top-btn {
  position: fixed;
  right: 30rpx;
  bottom: 180rpx;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(0, 187, 136, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.25);
  z-index: 999;

  .back-top-text {
    color: #fff;
    font-size: 20rpx;
    line-height: 1;
  }
}
</style>
