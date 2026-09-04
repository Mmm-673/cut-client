<template>
  <view class="choose-hall-wrapper" :class="themeClass">
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
    >
      <!-- 服务信息选择 -->
      <view class="info-card" v-if="!isReselect">
        <view class="card-title">预约信息</view>
        <view class="info-row" @click="showTimePicker = true">
          <text class="label">服务时间</text>
          <view class="value-wrap">
            <text class="value">{{ orderInfo.timeText }}</text>
            <uni-icons type="right" size="18" color="#9CA3AF" />
          </view>
        </view>


        <view class="info-row">
          <text class="label">服务时长</text>
          <view class="value-wrap">
            <view class="duration-control">
              <view class="duration-btn" :class="{disabled: orderInfo.duration <= minDuration}" @click="decreaseDuration">
                <uni-icons type="minus" size="20" :color="orderInfo.duration <= minDuration ? '#2a3338' : '#00BB88'" />
              </view>
              <text class="duration-num">{{ orderInfo.duration }}小时</text>
              <view class="duration-btn" :class="{disabled: orderInfo.duration >= 8}" @click="increaseDuration">
                <uni-icons type="plus" size="20" :color="orderInfo.duration >= 8 ? '#2a3338' : '#00BB88'" />
              </view>
            </view>
          </view>
        </view>
      </view>

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
      <view class="location-box">
        <uni-icons type="location" size="18" color="#00BB88" />
        <text class="location-text">
          <text v-if="locating">定位中...</text>
          <text v-else-if="currentStreet">{{ currentStreet }}</text>
          <text v-else>定位失败</text>
        </text>
        <view v-if="locationDenied && !locating" class="retry-btn" @click="getCurrentLocation">
          重试定位
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
        <hall-card
            v-for="hall in hallList"
            :key="getHallKey(hall)"
            :hall="hall"
            :is-creating="creatingHallKey === getHallKey(hall)"
            @choose="chooseHall"
            @navigate="navigateTo"
            @call="callPhone"
        />
      </view>

      <!-- 空状态 -->
      <empty-state
        v-if="!loading && !refreshing && hallList.length === 0"
        icon="info"
        text="暂无球厅"
        :icon-size="80"
        icon-color="#374151"
      />

      <!-- 加载更多状态 -->
      <view class="load-tip" v-if="hallList.length > 0">
        <text v-if="loadingMore">加载中...</text>
        <text v-else-if="noMore">没有更多了</text>
      </view>

      <!-- 底部安全区域 -->
    </scroll-view>

    <!-- 时间选择器弹窗 -->
    <view class="time-picker-mask" v-if="showTimePicker" @click="cancelTime">
      <view class="time-picker-wrapper" @click.stop>
        <view class="time-picker-header">
          <text class="cancel-btn" @click="cancelTime">取消</text>
          <text class="picker-title">选择服务时间</text>
          <text class="confirm-btn" @click="confirmTime">确定</text>
        </view>
        <picker-view
            class="picker-view"
            :indicator-style="pickerIndicatorStyle"
            :value="pickerValue"
            @change="onPickerChange"
            :mask-style="pickerMaskStyle"
        >
          <!-- 日期列 -->
          <picker-view-column>
            <view
                v-for="(item, index) in dateColumns"
                :key="index"
                class="picker-item"
            >
              {{ item.dateText }}
            </view>
          </picker-view-column>
          <!-- 小时列 -->
          <picker-view-column>
            <view
                v-for="(item, index) in hourColumns"
                :key="index"
                class="picker-item"
            >
              {{ item.hourText }}
            </view>
          </picker-view-column>
          <!-- 分钟列 -->
          <picker-view-column>
            <view
                v-for="(item, index) in minuteColumns"
                :key="index"
                class="picker-item"
            >
              {{ item.minuteText }}
            </view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
    <!-- 城市选择弹窗（简化，不显示UI） -->
    <view class="city-picker-mask" v-if="showCityPicker" @click="closeCityPicker">
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onShow } from  "@dcloudio/uni-app"
import { useList } from '@/composables/useList'
import { useThemeStore, useCoachStore, useBookingStore } from '@/store'
import { SERVICE_TYPE } from '@/constants/serviceType'
import { TIME_MS } from '@/constants/time'
import { getVenueList } from '@/api/billiard/venue'
import { createOrder } from '@/api/billiard/order'
import { debounce, showLoading, hideLoading } from '@/utils/common'
import { getLocation, extractStreet, formatDistance, showPermissionModal, openAppSetting } from '@/utils/location'
import {openMapNavigation} from "../../utils/platform";
import { showCallPermissionModal, requestCallPermission, doCallPhone as makePhoneCall } from '@/utils/call';
import EmptyState from '@/components/empty-state/empty-state.vue'
import HallCard from '@/components/hall-card/hall-card.vue'

// 主题相关
const themeStore = useThemeStore()
const coachStore = useCoachStore()
const bookingStore = useBookingStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// ---------------------- 状态定义 ----------------------
// 分页
const pageSize = 25

// 搜索关键词
const searchKeyword = ref('')

// 筛选状态
const currentTab = ref('nearest')

// 定位相关
const locating = ref(false)
const locationDenied = ref(false) // 记录是否已拒绝定位权限
const currentLocation = ref({
  longitude: null,
  latitude: null
})
const currentStreet = ref('')

// 城市选择相关
const showCityPicker = ref(false)
const showTimePicker = ref(false)
const pickerValue = ref([0, 0, 0])

// picker-view 主题适配样式
const pickerIndicatorStyle = computed(() => {
  const isLight = themeStore.theme === 'light'
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'
  return `height: 80rpx; border-top: 1rpx solid ${borderColor}; border-bottom: 1rpx solid ${borderColor};`
})

const pickerMaskStyle = computed(() => {
  const isLight = themeStore.theme === 'light'
  if (isLight) {
    return 'background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.95));'
  }
  return 'background-image: linear-gradient(to bottom, rgba(42, 51, 56, 0.95), rgba(42, 51, 56, 0.4), rgba(42, 51, 56, 0.95));'
})

// 最小服务时长
const minDuration = ref(2)

// 订单信息
const orderInfo = ref({
  serviceType: SERVICE_TYPE.BILLIARD_COACH, // 1=台球陪练 2=达人带路
  duration: 2,
  timeText: '请选择服务时间'
})

// 是否是重新选择
const isReselect = ref(false)

// 选中的预约时间（毫秒时间戳）
const selectedBookingTime = ref(null)

// 当前选中的时间
const selectedDateTime = ref({
  dateIndex: 0,
  hourIndex: 0,
  minuteIndex: 0
})

// 教练信息
const coachInfo = ref(null)

// 搜索半径（km）
const radius = ref(20)

// 创建订单中状态（跟踪正在创建的球厅 key，兼容 id 为 null 的高德直查数据）
const creatingHallKey = ref(null)

const getNextValidTime = () => {
  const next = new Date()
  const nextMinute = Math.ceil((next.getMinutes() + 1) / 5) * 5
  if (nextMinute >= 60) {
    next.setHours(next.getHours() + 1, 0, 0, 0)
  } else {
    next.setMinutes(nextMinute, 0, 0)
  }
  return next
}

// ---------------------- 时间选择器数据 ----------------------
// 生成日期列（从今天开始往后7天）
const generateDateColumns = () => {
  const columns = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() + i * TIME_MS.DAY)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    columns.push({
      date: date,
      dateText: `${month}.${day}`,
      weekDay: weekDays[date.getDay()],
      isToday: i === 0
    })
  }
  return columns
}

// 生成小时列
const generateHourColumns = (dateIndex = 0) => {
  const columns = []
  const nextValidTime = getNextValidTime()
  const startHour = dateIndex === 0 ? nextValidTime.getHours() : 0
  const endHour = 23

  for (let i = startHour; i <= endHour; i++) {
    columns.push({
      hour: i,
      hourText: String(i).padStart(2, '0') + '时'
    })
  }
  return columns
}

// 生成分钟列（5分钟间隔）
const generateMinuteColumns = (dateIndex = 0, hourIndex = 0) => {
  const columns = []
  const nextValidTime = getNextValidTime()
  const isToday = dateIndex === 0
  const currentHour = hourColumns.value[hourIndex]?.hour

  const startMinute = isToday && currentHour === nextValidTime.getHours() ? nextValidTime.getMinutes() : 0
  for (let i = startMinute; i < 60; i += 5) {
    columns.push({
      minute: i,
      minuteText: String(i).padStart(2, '0') + '分'
    })
  }
  return columns
}

const dateColumns = ref(generateDateColumns())
const hourColumns = ref(generateHourColumns(0))
const minuteColumns = ref(generateMinuteColumns(0, 0))

// 筛选标签
const tabList = ref([
  { value: 'nearest', label: '距离最近', sortType: 1 },
  { value: 'price', label: '价格最低', sortType: 2 },
  { value: 'score', label: '评分最高', sortType: 3 }
])

// 球厅列表（useList 管理）
const {
  list: hallList,
  loading,
  refreshing,
  loadingMore,
  hasMore,
  isEmpty,
  loadMoreStatus,
  loadList: loadHallList,
  refresh: refreshHallList,
  loadMore: loadMoreHallList,
  reset: resetHallList,
} = useList({
  fetchApi: getVenueList,
  pageSize: pageSize,
  pageParamName: 'pageNo',
  pageSizeParamName: 'pageSize',
  getParams: () => {
    const params = {}
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (currentLocation.value.longitude && currentLocation.value.latitude) {
      params.longitude = currentLocation.value.longitude
      params.latitude = currentLocation.value.latitude
      params.radius = radius.value
    }
    params.sortType = currentSortType.value
    return params
  },
  transform: (res) => {
    const list = res.data?.list || []
    return list.map(item => ({
      ...item,
      defaultImage: getRandomDefaultImage()
    }))
  },
  getTotal: (res) => res.data?.total || 0,
  onError: (error) => {
    console.error('加载球厅列表失败:', error)
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  },
})

// 兼容旧变量名
const noMore = computed(() => !hasMore.value)


// ---------------------- 计算属性 ----------------------
// 获取当前选中的排序类型
const currentSortType = computed(() => {
  const tab = tabList.value.find(t => t.value === currentTab.value)
  return tab ? tab.sortType : 1
})

// 计算默认服务时间
const calculateDefaultTime = () => {
  const now = new Date()
  const currentMinutes = now.getMinutes()

  // 计算到下一个30分或00分的时间差
  let targetMinutes = currentMinutes < 30 ? 30 : 60
  let minutesDiff = targetMinutes - currentMinutes

  // 如果剩余时间小于15分钟，就加到下一个整点
  if (minutesDiff < 15) {
    targetMinutes = targetMinutes === 30 ? 60 : 60
  }

  // 计算目标时间
  const targetTime = new Date(now.getTime())
  if (targetMinutes === 60) {
    targetTime.setHours(now.getHours() + 1, 0, 0, 0)
  } else {
    targetTime.setMinutes(targetMinutes, 0, 0)
  }

  // 格式化显示
  const month = String(targetTime.getMonth() + 1).padStart(2, '0')
  const day = String(targetTime.getDate()).padStart(2, '0')
  const hour = String(targetTime.getHours()).padStart(2, '0')
  const minute = String(targetTime.getMinutes()).padStart(2, '0')

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const targetDay = new Date(targetTime.getFullYear(), targetTime.getMonth(), targetTime.getDate()).getTime()
  const weekDay = today === targetDay ? '今天' : weekDays[targetTime.getDay()]

  orderInfo.value.timeText = `${weekDay} ${month}.${day} ${hour}:${minute}`
  selectedBookingTime.value = targetTime.getTime()
}

// ---------------------- 工具方法 ----------------------
// 格式化价格（分转元）
const formatPrice = (price) => {
  if (price === null || price === undefined) return '0.00'
  return (price / 100).toFixed(2)
}

// ---------------------- 时间选择器方法 ----------------------
// picker-view 列变化时
const onPickerChange = (e) => {
  const val = e.detail.value
  pickerValue.value = val

  const newDateIndex = val[0]
  const newHourIndex = val[1]
  const newMinuteIndex = val[2]

  if (newDateIndex !== selectedDateTime.value.dateIndex) {
    hourColumns.value = generateHourColumns(newDateIndex)
    minuteColumns.value = generateMinuteColumns(newDateIndex, 0)
    pickerValue.value = [newDateIndex, 0, 0]
    selectedDateTime.value = {
      dateIndex: newDateIndex,
      hourIndex: 0,
      minuteIndex: 0
    }
    return
  }

  if (newHourIndex !== selectedDateTime.value.hourIndex) {
    minuteColumns.value = generateMinuteColumns(newDateIndex, newHourIndex)
    pickerValue.value = [newDateIndex, newHourIndex, 0]
    selectedDateTime.value = {
      ...selectedDateTime.value,
      hourIndex: newHourIndex,
      minuteIndex: 0
    }
    return
  }

  selectedDateTime.value = {
    dateIndex: newDateIndex,
    hourIndex: newHourIndex,
    minuteIndex: newMinuteIndex
  }
}

// 取消时间选择
const cancelTime = () => {
  showTimePicker.value = false
}

// 确认时间选择
const confirmTime = () => {
  const dateItem = dateColumns.value[selectedDateTime.value.dateIndex]
  const hourItem = hourColumns.value[selectedDateTime.value.hourIndex]
  const minuteItem = minuteColumns.value[selectedDateTime.value.minuteIndex]

  if (!dateItem || !hourItem || !minuteItem) {
    uni.showToast({ title: '请选择完整的时间', icon: 'none' })
    return
  }

  const date = new Date(dateItem.date.getTime())
  date.setHours(hourItem.hour, minuteItem.minute, 0, 0)

  if (date.getTime() <= Date.now()) {
    uni.showToast({ title: '请选择未来时间', icon: 'none' })
    hourColumns.value = generateHourColumns(0)
    minuteColumns.value = generateMinuteColumns(0, 0)
    pickerValue.value = [0, 0, 0]
    selectedDateTime.value = { dateIndex: 0, hourIndex: 0, minuteIndex: 0 }
    return
  }

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(hourItem.hour).padStart(2, '0')
  const minute = String(minuteItem.minute).padStart(2, '0')

  const weekDay = dateItem.isToday ? '今天' : dateItem.weekDay
  orderInfo.value.timeText = `${weekDay} ${month}.${day} ${hour}:${minute}`

  // 保存选中的时间戳
  selectedBookingTime.value = date.getTime()

  showTimePicker.value = false
}

// ---------------------- 位置相关方法 ----------------------
// 获取当前位置（使用统一封装）
const getCurrentLocation = async () => {
  if (locating.value) return
  locating.value = true
  showLoading('定位中...')

  try {
    const { longitude, latitude, regeocodeData } = await getLocation({ needRegeocode: true })
    currentLocation.value = { longitude, latitude }
    currentStreet.value = extractStreet(regeocodeData)
    locationDenied.value = false // 重置权限拒绝状态
    loadHallList()
  } catch (err) {
    console.error('定位失败:', err)
    if (err.message === 'permission_denied') {
      locationDenied.value = true // 标记权限被拒绝
      showPermissionModal({
        content: '您未开启定位权限，将无法获取附近球厅。是否前往开启？',
        onSuccess: () => {
          locationDenied.value = false // 用户去设置了，重置状态
          getCurrentLocation()
        }
      })
    } else {
      uni.showToast({ title: '定位失败，请检查定位功能', icon: 'none' })
    }
  } finally {
    locating.value = false
    hideLoading()
  }
}

// 切换定位/城市
const switchLocation = () => {
  // 功能已隐藏
}

const closeCityPicker = () => {
  showCityPicker.value = false
}

// ---------------------- 搜索相关方法 ----------------------
const handleSearch = debounce(() => {
  loadHallList()
}, 300)

const clearSearch = () => {
  searchKeyword.value = ''
  loadHallList()
}

// ---------------------- 球厅列表方法 ----------------------

// 默认占位图
const defaultImages = [
  '/static/images/banner/billiards_1.jpg',
  '/static/images/banner/billiards_2.jpg',
  '/static/images/banner/billiards_3.jpg'
]

// 获取随机图
const getRandomDefaultImage = () => {
  return defaultImages[Math.floor(Math.random() * defaultImages.length)]
}

// 下拉刷新（包装 useList.refresh，增加 loading 提示）
const onRefresh = async () => {
  if (loading.value) return
  try {
    await refreshHallList()
  } finally {
    // 注意：useList.refresh 内部已管理 refreshing 状态
  }
}

// 上拉加载更多
const onLoadMore = () => {
  loadMoreHallList()
}

// 切换筛选标签
const switchTab = (val) => {
  currentTab.value = val

  // 如果切换到"距离最近"且没有定位信息，先获取定位
  if (val === 'nearest' && (!currentLocation.value.longitude || !currentLocation.value.latitude)) {
    if (!locating.value) {
      resetHallList()
      getCurrentLocation()
    }
  } else {
    loadHallList()
  }
}

// 打开筛选
const openFilter = () => {
  uni.showToast({ title: '高级筛选功能开发中', icon: 'none' })
}

// 导航
const navigateTo = (hall) => {
  if (!hall.latitude || !hall.longitude) {
    uni.showToast({ title: '该球厅暂无位置信息', icon: 'none' })
    return
  }

  const lat = hall.latitude
  const lng = hall.longitude
  const name = hall.name || '球厅'
  const address = hall.address || ''

  openMapNavigation({
    latitude: lat,
    longitude: lng,
    name: name,
    address: address,
    mode: 'driving'
  })
}

// 验证电话号码是否有效
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false

  const cleanedPhone = phone.trim()
  if (!cleanedPhone) return false

  // 手机号正则：1开头，11位数字
  const mobileReg = /^1[3-9]\d{9}$/

  // 固定电话正则：支持 010-12345678 或 020-12345678 或 0755-12345678 格式
  // 也支持不带横线的 400/800 电话
  const landlineReg = /^(0\d{2,3}-?\d{7,8}|400-?\d{3}-?\d{4}|800-?\d{3}-?\d{4})$/

  // 先去掉所有横线再验证手机号
  const phoneWithoutDash = cleanedPhone.replace(/-/g, '')

  return mobileReg.test(phoneWithoutDash) || landlineReg.test(cleanedPhone)
}

// 实际拨打电话的函数（兼容数组格式）
const doCallPhone = (validPhones, index = 0) => {
  // 使用公共函数拨打电话
  makePhoneCall(validPhones[index])
}

// 拨打电话
const callPhone = async (hall) => {
  try {
    // iOS 不显示自定义弹窗，直接拨打电话
    // #ifdef APP-PLUS
    const systemInfo = uni.getSystemInfoSync()
    if (systemInfo.platform !== 'ios') {
      // 显示电话权限用途说明弹窗
      await showCallPermissionModal()
      // 请求系统拨号权限
      await requestCallPermission()
    }
    // #endif

    let phones = []

    // 处理 phones 字段，兼容数组和字符串两种格式
    if (hall.phones) {
      if (Array.isArray(hall.phones)) {
        phones = hall.phones
      } else if (typeof hall.phones === 'string') {
        phones = [hall.phones]
      }
    }

    // 过滤空值和无效电话号码
    const validPhones = phones.filter(p => isValidPhone(p))

    if (validPhones.length === 0) {
      uni.showToast({ title: '暂无有效联系电话', icon: 'none' })
      return
    }

    if (validPhones.length === 1) {
      doCallPhone(validPhones, 0)
    } else {
      // 多个电话，让用户选择
      uni.showActionSheet({
        itemList: validPhones,
        success: (res) => {
          doCallPhone(validPhones, res.tapIndex)
        }
      })
    }
  } catch (err) {
    console.error('处理拨打电话请求失败:', err)
    if (err?.message === 'user_cancelled') {
      // 用户取消了电话权限用途说明，不进行任何操作
    } else {
      uni.showToast({
        title: '拨打电话失败，请重试',
        icon: 'none',
        duration: 1500
      })
    }
  }
}

// 增减时长
const decreaseDuration = () => {
  if (orderInfo.value.duration <= minDuration.value) return
  orderInfo.value.duration--
}

const increaseDuration = () => {
  if (orderInfo.value.duration >= 8) return
  orderInfo.value.duration++
}

// 球厅列表唯一 key（兼容 id 为 null 的情况）
const getHallKey = (hall) => {
  if (hall.id != null) return String(hall.id)
  return `${hall.name || ''}-${hall.address || ''}-${hall.longitude || ''}-${hall.latitude || ''}`
}

// 选择球厅 - 创建订单
const chooseHall = async (hall) => {
  if (creatingHallKey.value) return  // 防止重复点击

  if (!coachInfo.value) {
    uni.showToast({ title: '教练信息缺失，请重试', icon: 'none' })
    return
  }
  if (orderInfo.value.timeText === '请选择服务时间') {
    uni.showToast({ title: '请先选择服务时间', icon: 'none' })
    return
  }
  if (selectedBookingTime.value <= Date.now()) {
    uni.showToast({ title: '预约时间已过，请重新选择', icon: 'none' })
    calculateDefaultTime()
    return
  }

  creatingHallKey.value = getHallKey(hall)
  try {
    // 构建创建订单参数
    const createParams = {
      coachId: coachInfo.value.id,
      serviceType: orderInfo.value.serviceType,
      bookingTime: selectedBookingTime.value,
      serviceDuration: orderInfo.value.duration * 60,
      quantity: orderInfo.value.duration,
      venueId: hall.id ?? null,
      venueName: hall.name,
      venueAddress: hall.address,
      venueLongitude: hall.longitude,
      venueLatitude: hall.latitude
    }

    // 如果有选中的服务项目，传递服务项目ID
    if (coachInfo.value.selectedService?.id) {
      createParams.serviceItemId = coachInfo.value.selectedService.id
    }

    // 调用创建订单接口
    const createRes = await createOrder(createParams)

    // 保存订单数据到 store，供 confirm.vue 使用
    bookingStore.setOrderInitData({
      ...createRes.data,
      coachInfo: coachInfo.value,
      hallInfo: hall,
      serviceType: SERVICE_TYPE.BILLIARD_COACH, // 台球陪练
      serviceDuration: orderInfo.value.duration * 60,
      quantity: orderInfo.value.duration,
      bookingTime: selectedBookingTime.value,
      timeText: orderInfo.value.timeText
    })

    uni.showToast({ title: '订单创建成功', icon: 'success' })

    // 跳转到确认支付页
    setTimeout(() => {
      uni.redirectTo({ url: '/subpkg/booking/confirm' })
    }, 500)

  } catch (error) {
    console.error('创建订单失败:', error)
    uni.showToast({
      title: error || '创建订单失败，请重试',
      icon: 'none',
      duration: 2000
    })
  } finally {
    creatingHallKey.value = null
  }
}

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  getCurrentLocation()
})

onShow(() => {
  // 检查是否是重新选择
  const reselectParams = bookingStore.consumeReselectVenueParams()
    || (() => { try { return uni.getStorageSync('reselectParams') } catch(e) { return null } })()

  if (reselectParams) {
    isReselect.value = true
    coachInfo.value = reselectParams.coachInfo
    orderInfo.value.duration = reselectParams.quantity || 2
    orderInfo.value.timeText = reselectParams.timeText || '请选择服务时间'
    selectedBookingTime.value = reselectParams.bookingTime
    // 清除 Storage 中的降级数据
    uni.removeStorageSync('reselectParams')
  } else {
    // 从 store 获取教练信息，降级到 Storage
    const coach = coachStore.selectedCoach
      || (() => { try { return uni.getStorageSync('selectedCoach') } catch(e) { return null } })()

    if (coach) {
      coachInfo.value = coach
    } else {
      uni.showToast({ title: '教练信息缺失', icon: 'none' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    }
    // 设置默认服务时间
    calculateDefaultTime()
  }

  // 从设置回来后，如果还没有定位信息且未拒绝过权限，尝试重新获取定位
  if (!currentLocation.value.longitude || !currentLocation.value.latitude) {
    if (!locating.value && !locationDenied.value) {
      getCurrentLocation()
    }
  }
})
</script>

<style lang="scss" scoped>
.choose-hall-wrapper {
  min-height: 100vh;
  height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.nav-filter {
  width: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hall-scroll {
  flex: 1;
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
}

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}

/* 预约信息卡片 */
.info-card {
  margin: 20rpx 30rpx 30rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;
  .card-title {
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 700;
    margin-bottom: 24rpx;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border-color);
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .label {
    color: var(--text-secondary);
    font-size: 28rpx;
  }
  .value-wrap {
    display: flex;
    align-items: center;
    gap: 12rpx;
    .value {
      color: var(--text-primary);
      font-size: 28rpx;
    }
  }
}

/* 时长控制 */
.duration-control {
  display: flex;
  align-items: center;
  gap: 24rpx;
  .duration-btn {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: var(--bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    &.disabled {
      opacity: 0.3;
      pointer-events: none;
    }
  }
  .duration-num {
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 600;
    min-width: 120rpx;
    text-align: center;
  }
}

/* 搜索框 */
.search-box {
  margin: 0 30rpx 20rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  .search-input {
    flex: 1;
    color: var(--text-primary);
    font-size: 28rpx;
  }
  .search-placeholder {
    color: var(--text-tertiary);
  }
  .clear-icon {
    padding: 4rpx;
  }
}

/* 定位信息 */
.location-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 24rpx 30rpx;
  .location-text {
    color: var(--text-primary);
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
  .retry-btn {
    color: #00BB88;
    font-size: 24rpx;
    padding: 8rpx 16rpx;
    border: 1rpx solid #00BB88;
    border-radius: 32rpx;
    flex-shrink: 0;
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
      background: var(--bg-card);
      color: var(--text-secondary);
      font-size: 26rpx;
      font-weight: 500;
      border-radius: 32rpx;
      flex-shrink: 0;
      transition: all 0.2s ease;
      &.active {
        background: #00BB88;
        color: var(--text-primary);
        font-weight: 600;
      }
    }
  }
}

/* 球厅列表 */
.hall-list {
  padding: 0 30rpx;
}

/* 加载提示 */
.load-tip {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 26rpx;
  padding: 40rpx 0;
  &.loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}

/* 时间选择器遮罩 */
.time-picker-mask {
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

.time-picker-wrapper {
  background: var(--bg-card);
  border-radius: 32rpx 32rpx 0 0;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.time-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid var(--border-color);
  .cancel-btn {
    color: var(--text-secondary);
    font-size: 30rpx;
  }
  .picker-title {
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 600;
  }
  .confirm-btn {
    color: #00BB88;
    font-size: 30rpx;
    font-weight: 600;
  }
}

.picker-view {
  width: 100%;
  height: 500rpx;
  background-color: var(--bg-secondary);
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary) !important;
  font-size: 32rpx;
  height: 80rpx;
  line-height: 80rpx;
}

.city-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 998;
}
</style>