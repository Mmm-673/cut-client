<template>
  <view class="choose-hall-wrapper">
      <view class="nav-filter" @click="openFilter">
        <uni-icons type="filter" size="22" color="#fff" />
      </view>

    <scroll-view
        scroll-y
        class="hall-scroll"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="onLoadMore"
        :lower-threshold="50"
    >
      <!-- 搜索框 -->
      <view class="search-box">
        <uni-icons type="search" size="20" color="#9CA3AF" />
        <input
          class="search-input"
          placeholder="搜索球厅名称"
          placeholder-class="search-placeholder"
          v-model="searchKeyword"
          confirm-type="search"
          @confirm="handleSearch"
        />
        <uni-icons
          v-if="searchKeyword"
          type="clear"
          size="18"
          color="#9CA3AF"
          class="clear-icon"
          @click="clearSearch"
        />
      </view>

      <!-- 定位信息 -->
      <view class="location-box" @click="switchLocation">
        <uni-icons type="location" size="18" color="#00BB88" />
        <text class="location-text">
          <text v-if="locating">定位中...</text>
          <text v-else-if="currentCity">{{ currentCity }}</text>
          <text v-else>点击定位</text>
        </text>
        <view class="location-switch">
          <text>切换</text>
          <uni-icons type="right" size="14" color="#00BB88" />
        </view>
      </view>

      <!-- 筛选标签 -->
      <scroll-view scroll-x class="tab-scroll" :show-scrollbar="false">
        <view class="tab-list">
          <view
              class="tab-item"
              :class="{active: currentTab === item.value}"
              v-for="item in tabList"
              :key="item.value"
              @click="switchTab(item.value)"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>

      <!-- 球厅列表 -->
      <view class="hall-list" v-if="hallList.length > 0">
        <view
            class="hall-card"
            v-for="hall in hallList"
            :key="hall.id"
        >
          <!-- 球厅图片 -->
          <view class="hall-image-wrap">
            <image
              class="hall-image"
              :src="hall.coverImageUrl || '/static/default-venue.jpg'"
              mode="aspectFill"
            ></image>
            <view
              class="hall-tag"
              v-if="hall.tags && hall.tags.split(',').length > 0"
              :style="{background: hall.tagBg || '#00BB88'}"
            >
              {{ hall.tags.split(',')[0] }}
            </view>
            <view class="hall-distance" v-if="hall.distance">
              {{ formatDistance(hall.distance) }}
            </view>
          </view>

          <!-- 球厅信息 -->
          <view class="hall-info">
            <view class="hall-header">
              <view class="hall-name-wrap">
                <text class="hall-name">{{ hall.name }}</text>
                <view
                  class="hall-badge"
                  v-if="hall.advantage"
                  :style="{background: 'rgba(0, 187, 136, 0.2)'}"
                >
                  {{ hall.advantage }}
                </view>
              </view>
              <view class="hall-price">
                <text class="price-num">¥{{ formatPrice(hall.price) }}</text>
                <text class="price-unit">/小时起</text>
              </view>
            </view>

            <view class="hall-meta">
              <uni-icons type="star-filled" size="16" color="#FBBF24" />
              <text class="meta-text">{{ hall.score }}</text>
              <text class="meta-divider">|</text>
              <text class="meta-text">{{ hall.reviewCount }}条评价</text>
            </view>

            <view class="hall-address">
              <uni-icons type="location" size="14" color="#9CA3AF" />
              <text class="address-text">{{ hall.address }}</text>
            </view>

            <view class="hall-tags" v-if="hall.facilityTags">
              <view
                class="tag-item"
                v-for="(tag, index) in hall.facilityTags.split(',')"
                :key="index"
              >
                {{ tag }}
              </view>
            </view>

            <view class="hall-promo" v-if="hall.promotionText">
              <uni-icons type="gift" size="16" color="#00BB88" />
              <text class="promo-text">{{ hall.promotionText }}</text>
            </view>

            <view class="hall-actions">
              <view class="action-btn secondary" @click="navigateTo(hall)">
                <uni-icons type="navigate" size="18" color="#9CA3AF" />
                <text>导航</text>
              </view>
              <view class="action-btn secondary" @click="callPhone(hall)">
                <uni-icons type="phone" size="18" color="#9CA3AF" />
                <text>电话</text>
              </view>
              <view class="action-btn primary" @click="chooseHall(hall)">
                <text>选择</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="!loading && hallList.length === 0">
        <uni-icons type="info" size="80" color="#374151" />
        <text class="empty-text">暂无球厅</text>
      </view>

      <!-- 加载提示 -->
      <view class="load-tip" v-if="!hasMore && hallList.length > 0">
        已加载全部球厅
      </view>
      <view class="load-tip loading" v-if="loading && page > 1">
        <uni-icons type="spinner-cycle" size="20" color="#9CA3AF" style="animation: spin 1s linear infinite; margin-right: 12rpx;"></uni-icons>
        加载中...
      </view>

      <!-- 底部安全区域 - 增加额外高度避免内容被底部栏遮挡 -->
      <view class="safe-area-bottom" ></view>
    </scroll-view>

    <!-- 底部已选栏 -->
    <view class="bottom-bar" v-if="selectedHall">
      <view class="selected-info">
        <view class="selected-hall">
          <text class="selected-label">已选：</text><text class="selected-name">{{ selectedHall.name }}</text>
        </view>
        <view class="selected-price">
          <text class="price-num">¥{{ formatPrice(selectedHall.price) }}/小时起</text>
        </view>
      </view>

      <button class="confirm-btn" @click="confirmChoose">确认选择</button>
    </view>

    <!-- 城市选择弹窗 -->
    <view class="city-picker-mask" v-if="showCityPicker" @click="closeCityPicker">
      <view class="city-picker-wrapper" @click.stop>
        <view class="city-picker-header">
          <text class="cancel-btn" @click="closeCityPicker">取消</text>
          <text class="picker-title">选择城市</text>
          <text class="confirm-btn" @click="confirmCity">确定</text>
        </view>
        <picker-view
          class="city-picker-view"
          :value="cityPickerValue"
          @change="onCityPickerChange"
          indicator-style="height: 80rpx; border-top: 1rpx solid rgba(255,255,255,0.1); border-bottom: 1rpx solid rgba(255,255,255,0.1);"
          mask-style="background-image: linear-gradient(to bottom, rgba(42, 51, 56, 0.95), rgba(42, 51, 56, 0.4), rgba(42, 51, 56, 0.95));"
        >
          <picker-view-column>
            <view
              v-for="(item, index) in cityList"
              :key="index"
              class="picker-item"
            >
              {{ item.name }}
            </view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onShow } from  "@dcloudio/uni-app"
import { getVenueList } from '@/api/billiard/venue'

// ---------------------- 状态定义 ----------------------
// 刷新/加载状态
const refreshing = ref(false)
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const pageSize = ref(10)

// 搜索关键词
const searchKeyword = ref('')

// 筛选状态
const currentTab = ref('nearest')
const selectedHall = ref(null)

// 定位相关
const locating = ref(false)
const currentLocation = ref({
  longitude: null,
  latitude: null
})
const currentCity = ref('')

// 城市选择相关
const showCityPicker = ref(false)
const cityPickerValue = ref([0])
const selectedCityIndex = ref(0)

// 模拟城市列表
const cityList = ref([
  { name: '北京市', code: '110000' },
  { name: '上海市', code: '310000' },
  { name: '广州市', code: '440100' },
  { name: '深圳市', code: '440300' },
  { name: '杭州市', code: '330100' },
  { name: '南京市', code: '320100' },
  { name: '成都市', code: '510100' },
  { name: '重庆市', code: '500000' },
  { name: '武汉市', code: '420100' },
  { name: '西安市', code: '610100' }
])

// 筛选标签
const tabList = ref([
  { value: 'nearest', label: '距离最近', sortType: 1 },
  { value: 'price', label: '价格最低', sortType: 2 },
  { value: 'score', label: '评分最高', sortType: 3 }
])

// 球厅列表
const hallList = ref([])

// ---------------------- 计算属性 ----------------------
// 获取当前选中的排序类型
const currentSortType = computed(() => {
  const tab = tabList.value.find(t => t.value === currentTab.value)
  return tab ? tab.sortType : 1
})

// ---------------------- 工具方法 ----------------------
// 格式化价格（分转元）
const formatPrice = (price) => {
  if (price === null || price === undefined) return '0.00'
  return (price / 100).toFixed(2)
}

// 格式化距离
const formatDistance = (distance) => {
  if (distance === null || distance === undefined) return ''
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

// ---------------------- 位置相关方法 ----------------------
// 获取当前位置
const getCurrentLocation = () => {
  locating.value = true

  uni.getLocation({
    type: 'gcj02',
    altitude: true,
    success: (res) => {
      console.log('定位成功:', res)
      currentLocation.value = {
        longitude: res.longitude,
        latitude: res.latitude
      }

      // 尝试逆地理编码获取城市名
      reverseGeocode(res.longitude, res.latitude)

      // 重新加载球厅列表
      page.value = 1
      hallList.value = []
      loadHallList()
    },
    fail: (err) => {
      console.error('定位失败:', err)
      uni.showToast({
        title: '定位失败，请检查定位权限',
        icon: 'none',
        duration: 2000
      })
      locating.value = false
    }
  })
}

// 逆地理编码（获取城市名）
const reverseGeocode = (longitude, latitude) => {
  // #ifdef MP-WEIXIN
  // 微信小程序使用内置地图逆地理编码
  uni.request({
    url: 'https://apis.map.qq.com/ws/geocoder/v1/',
    data: {
      location: `${latitude},${longitude}`,
      key: 'your-tencent-map-key' // 需要替换为实际的腾讯地图Key
    },
    success: (res) => {
      if (res.data && res.data.result && res.data.result.address_component) {
        currentCity.value = res.data.result.address_component.city || res.data.result.address_component.province
      }
      locating.value = false
    },
    fail: () => {
      currentCity.value = '定位城市'
      locating.value = false
    }
  })
  // #endif

  // #ifndef MP-WEIXIN
  // 其他平台简化处理
  currentCity.value = '当前城市'
  locating.value = false
  // #endif
}

// 切换定位/城市
const switchLocation = () => {
  // 显示城市选择器
  showCityPicker.value = true
}

// 城市选择器相关
const onCityPickerChange = (e) => {
  const val = e.detail.value
  cityPickerValue.value = val
  selectedCityIndex.value = val[0]
}

const confirmCity = () => {
  const city = cityList.value[selectedCityIndex.value]
  if (city) {
    currentCity.value = city.name
    // 这里可以根据选择的城市重新加载球厅列表
    page.value = 1
    hallList.value = []
    loadHallList()
  }
  closeCityPicker()
}

const closeCityPicker = () => {
  showCityPicker.value = false
}

// ---------------------- 搜索相关方法 ----------------------
const handleSearch = () => {
  page.value = 1
  hallList.value = []
  loadHallList()
}

const clearSearch = () => {
  searchKeyword.value = ''
  page.value = 1
  hallList.value = []
  loadHallList()
}

// ---------------------- 球厅列表方法 ----------------------
// 加载球厅列表
const loadHallList = async () => {
  if (loading.value) return

  loading.value = true
  try {
    const params = {
      pageNo: page.value,
      pageSize: pageSize.value,
      sortType: currentSortType.value
    }

    // 添加搜索关键词
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    // 添加经纬度
    if (currentLocation.value.longitude && currentLocation.value.latitude) {
      params.longitude = currentLocation.value.longitude
      params.latitude = currentLocation.value.latitude
    }

    const res = await getVenueList(params)
    const list = res.data?.list || res.data || []

    if (page.value === 1) {
      hallList.value = list
    } else {
      hallList.value = [...hallList.value, ...list]
    }

    // 判断是否还有更多
    hasMore.value = list.length >= pageSize.value
  } catch (error) {
    console.error('加载球厅列表失败:', error)
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  page.value = 1
  hasMore.value = true
  loadHallList()
}

// 上拉加载更多
const onLoadMore = () => {
  if (!hasMore.value || loading.value) return
  page.value++
  loadHallList()
}

// 切换筛选标签
const switchTab = (val) => {
  currentTab.value = val
  page.value = 1
  hallList.value = []
  loadHallList()
}

// 打开筛选
const openFilter = () => {
  uni.showToast({ title: '高级筛选功能开发中', icon: 'none' })
}

// 导航
const navigateTo = (hall) => {
  uni.showActionSheet({
    itemList: ['百度地图', '高德地图', '本机地图'],
    success: (res) => {
      const index = res.tapIndex
      if (index === 0) {
        openBaiduMap(hall)
      } else if (index === 1) {
        openAmap(hall)
      } else if (index === 2) {
        openNativeMap(hall)
      }
    }
  })
}

// 打开百度地图
const openBaiduMap = (hall) => {
  // #ifdef APP-PLUS
  // App端使用plus环境打开百度地图
  const url = `baidumap://map/geocoder?address=${encodeURIComponent(hall.address)}&name=${encodeURIComponent(hall.name)}`
  plus.runtime.openURL(url, (err) => {
    // 如果没有安装百度地图，打开网页版
    const webUrl = `https://map.baidu.com/search/${encodeURIComponent(hall.address)}`
    plus.runtime.openURL(webUrl)
  })
  // #endif

  // #ifdef MP-WEIXIN
  // 微信小程序使用内置地图
  uni.openLocation({
    latitude: hall.latitude || 39.908823,
    longitude: hall.longitude || 116.397470,
    name: hall.name,
    address: hall.address,
    scale: 18
  })
  // #endif

  // #ifdef H5
  // H5打开百度地图网页版
  window.open(`https://map.baidu.com/search/${encodeURIComponent(hall.address)}`)
  // #endif
}

// 打开高德地图
const openAmap = (hall) => {
  // #ifdef APP-PLUS
  const url = `androidamap://viewMap?sourceApplication=appname&poiname=${encodeURIComponent(hall.name)}&lat=${hall.latitude || 39.908823}&lon=${hall.longitude || 116.397470}&dev=0`
  plus.runtime.openURL(url, (err) => {
    const webUrl = `https://uri.amap.com/marker?position=${hall.longitude || 116.397470},${hall.latitude || 39.908823}&name=${encodeURIComponent(hall.name)}`
    plus.runtime.openURL(webUrl)
  })
  // #endif

  // #ifdef MP-WEIXIN
  uni.openLocation({
    latitude: hall.latitude || 39.908823,
    longitude: hall.longitude || 116.397470,
    name: hall.name,
    address: hall.address,
    scale: 18
  })
  // #endif

  // #ifdef H5
  window.open(`https://uri.amap.com/marker?position=${hall.longitude || 116.397470},${hall.latitude || 39.908823}&name=${encodeURIComponent(hall.name)}`)
  // #endif
}

// 打开本机地图
const openNativeMap = (hall) => {
  // #ifdef MP-WEIXIN
  uni.openLocation({
    latitude: hall.latitude || 39.908823,
    longitude: hall.longitude || 116.397470,
    name: hall.name,
    address: hall.address,
    scale: 18
  })
  // #endif

  // #ifdef APP-PLUS
  plus.openMap({
    latitude: hall.latitude || 39.908823,
    longitude: hall.longitude || 116.397470,
    name: hall.name,
    address: hall.address
  })
  // #endif

  // #ifdef H5
  window.open(`https://www.google.com/maps/search/${encodeURIComponent(hall.address)}`)
  // #endif
}

// 拨打电话
const callPhone = (hall) => {
  if (hall.phone) {
    uni.makePhoneCall({
      phoneNumber: hall.phone,
      fail: () => uni.showToast({ title: '拨打失败', icon: 'none' })
    })
  } else {
    uni.showToast({ title: '暂无联系电话', icon: 'none' })
  }
}

// 选择球厅
const chooseHall = (hall) => {
  selectedHall.value = hall
}

// 确认选择
const confirmChoose = () => {
  if (!selectedHall.value) return

  // 保存选择的球厅信息
  uni.setStorageSync('selectedHall', {
    id: selectedHall.value.id,
    name: selectedHall.value.name,
    address: selectedHall.value.address,
    longitude: selectedHall.value.longitude,
    latitude: selectedHall.value.latitude,
    price: selectedHall.value.price
  })

  // 检查是否从确认订单页跳转过来的
  const fromConfirm = uni.getStorageSync('fromConfirm')
  if (fromConfirm) {
    uni.removeStorageSync('fromConfirm')
    // 返回确认订单页
    uni.navigateBack()
  } else {
    // 跳转到确认订单页
    uni.navigateTo({ url: '/pages/booking/confirm' })
  }
}

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  // 自动获取定位
  getCurrentLocation()

  // 检查是否有从确认订单页返回的选择需求
  const pages = getCurrentPages()
  const prevPage = pages[pages.length - 2]
  if (prevPage && prevPage.$vm && prevPage.$vm.fromConfirm) {
    // 如果是从确认订单页返回的，可以做一些特殊处理
  }
})

onShow(() => {
  // 页面显示时重置选择状态
  // 检查是否有从确认订单页返回的选择
  const returnHall = uni.getStorageSync('returnHall')
  if (returnHall) {
    selectedHall.value = returnHall
    uni.removeStorageSync('returnHall')
  }
})
</script>

<style lang="scss" scoped>
.choose-hall-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 旋转动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 自定义导航栏 */
 .nav-filter {
  width: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hall-scroll {
  flex: 1;
  width: 100%;
  // 为底部栏预留空间
  padding-bottom: 200rpx;
  box-sizing: border-box;
}

/* 搜索框 */
.search-box {
  margin: 20rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  .search-input {
    flex: 1;
    color: #fff;
    font-size: 28rpx;
  }
  .search-placeholder {
    color: #6B7280;
  }
  .clear-icon {
    padding: 4rpx;
  }
}

/* 定位信息 */
.location-box {
  margin: 0 30rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  .location-text {
    color: #fff;
    font-size: 26rpx;
    flex: 1;
  }
  .location-switch {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: #00BB88;
    font-size: 26rpx;
  }
}

/* 筛选标签 */
.tab-scroll {
  padding: 0 30rpx 24rpx;
  white-space: nowrap;
  .tab-list {
    display: inline-flex;
    gap: 16rpx;
    .tab-item {
      padding: 14rpx 28rpx;
      background: rgba(30, 37, 43, 1);
      color: #9CA3AF;
      font-size: 26rpx;
      font-weight: 500;
      border-radius: 32rpx;
      flex-shrink: 0;
      transition: all 0.2s ease;
      &.active {
        background: #00BB88;
        color: #fff;
        font-weight: 600;
      }
    }
  }
}

/* 球厅列表 */
.hall-list {
  padding: 0 30rpx;
  .hall-card {
    background: #1E252B;
    border-radius: 24rpx;
    margin-bottom: 30rpx;
    overflow: hidden;
    .hall-image-wrap {
      position: relative;
      width: 100%;
      height: 360rpx;
      .hall-image {
        width: 100%;
        height: 100%;
      }
      .hall-tag {
        position: absolute;
        top: 20rpx;
        left: 0;
        padding: 8rpx 20rpx;
        border-radius: 0 16rpx 16rpx 0;
        color: #fff;
        font-size: 24rpx;
        font-weight: 600;
      }
      .hall-distance {
        position: absolute;
        top: 20rpx;
        right: 20rpx;
        background: rgba(0,0,0,0.6);
        color: #fff;
        font-size: 24rpx;
        padding: 8rpx 16rpx;
        border-radius: 16rpx;
      }
    }
    .hall-info {
      padding: 24rpx;
      .hall-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12rpx;
        .hall-name-wrap {
          display: flex;
          align-items: center;
          gap: 12rpx;
          flex: 1;
          .hall-name {
            color: #fff;
            font-size: 32rpx;
            font-weight: 700;
          }
          .hall-badge {
            padding: 4rpx 12rpx;
            border-radius: 8rpx;
            font-size: 22rpx;
            color: #00BB88;
            flex-shrink: 0;
          }
        }
        .hall-price {
          display: flex;
          align-items: baseline;
          gap: 4rpx;
          .price-num {
            color: #00BB88;
            font-size: 36rpx;
            font-weight: 700;
          }
          .price-unit {
            color: #9CA3AF;
            font-size: 24rpx;
          }
        }
      }
      .hall-meta {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin-bottom: 12rpx;
        .meta-text {
          color: #9CA3AF;
          font-size: 24rpx;
        }
        .meta-divider {
          color: #2a3338;
        }
      }
      .hall-address {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin-bottom: 16rpx;
        .address-text {
          color: #9CA3AF;
          font-size: 24rpx;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
      .hall-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 12rpx;
        margin-bottom: 16rpx;
        .tag-item {
          background: #2a3338;
          color: #9CA3AF;
          font-size: 22rpx;
          padding: 6rpx 16rpx;
          border-radius: 12rpx;
        }
      }
      .hall-promo {
        background: rgba(0, 187, 136, 0.1);
        border-radius: 12rpx;
        padding: 16rpx;
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-bottom: 20rpx;
        .promo-text {
          color: #00BB88;
          font-size: 24rpx;
          flex: 1;
        }
      }
      .hall-actions {
        display: flex;
        gap: 16rpx;
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8rpx;
          height: 72rpx;
          border-radius: 36rpx;
          font-size: 28rpx;
          font-weight: 600;
          &.secondary {
            flex: 1;
            background: #2a3338;
            color: #9CA3AF;
          }
          &.primary {
            flex: 1.5;
            background: #00BB88;
            color: #fff;
          }
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
  padding: 120rpx 0;
  .empty-text {
    color: #6B7280;
    font-size: 28rpx;
    margin-top: 20rpx;
  }
}

/* 加载提示 */
.load-tip {
  text-align: center;
  color: #6B7280;
  font-size: 26rpx;
  padding: 40rpx 0;
  &.loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* 底部已选栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #1E252B;
  border-top: 1rpx solid rgba(255,255,255,0.05);
  padding: 12rpx 24rpx;
  padding-bottom: calc(12rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.3);
  .selected-info {
    flex: 1;
    min-width: 0;
    .selected-hall {
      .selected-label {
        color: #9CA3AF;
        font-size: 24rpx;
        font-weight: 600;
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .selected-name {
        color: #fff;
        font-size: 24rpx;
        font-weight: 600;
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .selected-price {
      display: flex;
      align-items: baseline;
      gap: 4rpx;
      flex-shrink: 0;
      margin-top: 4rpx;
      .price-num {
        color: #00BB88;
        font-size: 28rpx;
        font-weight: 700;
      }
      .price-unit {
        color: #9CA3AF;
        font-size: 20rpx;
      }
    }
  }

  .confirm-btn {
    background: #00BB88;
    color: #fff;
    border-radius: 32rpx;
    padding: 14rpx 44rpx;
    font-size: 28rpx;
    font-weight: 700;
    border: none;
    flex-shrink: 0;
    &::after {
      border: none;
    }
  }
}

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}

/* 城市选择器遮罩 */
.city-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.city-picker-wrapper {
  background: #1E252B;
  border-radius: 32rpx 32rpx 0 0;
  animation: slideUp 0.3s ease;
}

.city-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  .cancel-btn {
    color: #9CA3AF;
    font-size: 30rpx;
  }
  .picker-title {
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
  }
  .confirm-btn {
    color: #00BB88;
    font-size: 30rpx;
    font-weight: 600;
  }
}

.city-picker-view {
  width: 100%;
  height: 500rpx;
  background-color: #2a3338;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF !important;
  font-size: 32rpx;
  height: 80rpx;
  line-height: 80rpx;
}
</style>