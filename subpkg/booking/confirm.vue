<template>
  <view class="confirm-order-wrapper" :class="themeClass">
    <!-- 顶部导航 -->
<!--    <view class="nav-header">-->
<!--      <view class="nav-left" @click="goBack">-->
<!--        <uni-icons type="left" size="22" color="#fff" />-->
<!--      </view>-->
<!--      <text class="nav-title">确认订单</text>-->
<!--      <view class="nav-right"></view>-->
<!--    </view>-->
    <view class="order-content">

    <!-- 教练信息 -->
      <view class="coach-card" v-if="orderData.coachInfo">
        <image class="coach-avatar" :src="orderData.coachInfo.avatar" mode="aspectFill"></image>
        <view class="coach-info">
          <view class="coach-name-row">
            <text class="coach-name">{{ orderData.coachInfo.stageName || orderData.coachInfo.name }}</text>
            <view class="coach-badge" :style="{background: 'rgba(0, 187, 136, 0.2)'}">{{ orderData.coachInfo.levelText || '初级教练' }}</view>
          </view>
          <text class="coach-desc">{{ orderData.coachInfo.intro || '专业台球陪练，耐心教学' }}</text>
          <view class="coach-meta">
            <view class="meta-item">
              <uni-icons type="star-filled" size="14" color="#FBBF24" />
              <text>{{ orderData.coachInfo.overallScore || orderData.coachInfo.rating || 5.0 }}分</text>
            </view>
            <text class="meta-divider">|</text>
            <text class="meta-item">已接单{{ orderData.coachInfo.serviceCount || orderData.coachInfo.orderCount || 0 }}次</text>
            <text class="meta-divider" v-if="orderData.coachInfo.distance">|</text>
            <text class="meta-item" v-if="orderData.coachInfo.distance">{{ orderData.coachInfo.distance }}</text>
          </view>
        </view>
        <view class="coach-score">
          <uni-icons type="star-filled" size="16" color="#FBBF24" />
          <text>{{ orderData.coachInfo.overallScore || orderData.coachInfo.rating || 5.0 }}</text>
        </view>
      </view>

      <!-- 服务信息 -->
      <view class="info-card">
        <view class="card-title">服务信息</view>

        <view class="info-row">
          <text class="label">服务项目</text>
          <text class="value">{{ serviceTypeName }}</text>
        </view>

        <view class="info-row">
          <text class="label">服务时长</text>
          <text class="value">{{ (orderData.serviceDuration / 60) || 2 }}小时</text>
        </view>

        <view class="info-row" v-if="!isOrderCreated" @click="showTimePicker = true">
          <text class="label">服务时间</text>
          <view class="value-wrap">
            <text class="value">{{ orderData.timeText || '请选择服务时间' }}</text>
            <uni-icons type="right" size="18" color="#9CA3AF" />
          </view>
        </view>

        <view class="info-row" v-else>
          <text class="label">服务时间</text>
          <text class="value">{{ orderData.timeText || formatTime(orderData.bookingTime) }}</text>
        </view>

        <view class="info-row venue-row" v-if="serviceType === 1" @click="reselectHall">
          <text class="label">服务地点</text>
          <view class="value-wrap venue-wrap">
            <view class="venue-info">
              <text class="value venue-name">{{ orderData.hallInfo?.name || orderData.venueName || '请选择服务地点' }}</text>
              <text class="venue-address" v-if="orderData.hallInfo?.address || orderData.venueAddress">{{ orderData.hallInfo?.address || orderData.venueAddress }}</text>
            </view>
            <uni-icons type="right" size="18" color="#9CA3AF" />
          </view>
        </view>

        <!-- 服务类型 2/3/4 需要选择服务城市和服务地点 -->
        <view class="info-row venue-row" v-if="[2, 3, 4].includes(serviceType)">
          <text class="label">服务城市</text>
          <view class="value-wrap venue-wrap location-picker-wrapper" @click="showCityPicker = true">
            <view class="location-box">
              <uni-icons type="location" size="18" color="#00BB88" />
              <text class="location-text">
                <text v-if="locating">定位中...</text>
                <text v-else-if="locationDenied">定位权限未开启</text>
                <text v-else-if="displayCityName">{{ displayCityName }}</text>
                <text v-else>选择城市</text>
              </text>
              <uni-icons type="right" size="16" color="#9CA3AF" />
            </view>
          </view>
        </view>

        <view class="info-row venue-row" v-if="[2, 3, 4].includes(serviceType)">
          <text class="label">服务地点</text>
          <view class="value-wrap venue-wrap location-picker-wrapper" @click="showPlacePicker = true">
            <view class="location-box">
              <uni-icons type="location" size="18" color="#00BB88" />
              <text class="location-text">
                <text v-if="selectedPlace">{{ selectedPlace.name }}</text>
                <text v-else>选择服务地点</text>
              </text>
              <uni-icons type="right" size="16" color="#9CA3AF" />
            </view>
          </view>
        </view>


      </view>

      <!-- 订单信息 -->
      <view class="info-card" v-if="orderData.orderNo">
        <view class="card-title">订单信息</view>

        <view class="info-row">
          <text class="label">订单号</text>
          <text class="value">{{ orderData.orderNo }}</text>
        </view>

        <view class="info-row" v-if="orderData.orderId">
          <text class="label">订单ID</text>
          <text class="value">{{ orderData.orderId }}</text>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="info-card" v-if="isOrderCreated">
        <view class="card-title">费用明细</view>

        <view class="fee-row">
          <text class="fee-label">{{ serviceTypeName }} x{{ orderData.quantity || 2 }}小时</text>
          <text class="fee-value">¥{{ (orderData.serviceAmount / 100).toFixed(2) }}</text>
        </view>

        <view class="fee-row" v-if="orderData.travelAmount > 0">
          <text class="fee-label">车费</text>
          <text class="fee-value">¥{{ (orderData.travelAmount / 100).toFixed(2) }}</text>
        </view>

        <view class="fee-row" v-if="orderData.travelDiscountAmount > 0">
          <text class="fee-label">车费优惠</text>
          <text class="fee-value" style="color: #EF4444;">-¥{{ (orderData.travelDiscountAmount / 100).toFixed(2) }}</text>
        </view>

        <view class="fee-total">
          <text class="total-label">实付金额</text>
          <text class="total-value">¥{{ (orderData.payAmount / 100).toFixed(2) }}</text>
        </view>
      </view>

      <!-- 支付倒计时 -->
      <view class="countdown-card" v-if="orderData.expireTime && isOrderCreated">
        <uni-icons type="time" size="18" color="#FBBF24" />
        <text class="countdown-text">请在 <text class="countdown-time">{{ countdownText }}</text> 内完成支付</text>
      </view>

      <!-- 支付方式 -->
      <view class="info-card" v-if="isOrderCreated">
        <view class="card-title">支付方式</view>

        <view
            class="pay-item"
            :class="{active: selectedPay === item.value}"
            v-for="item in payList"
            :key="item.value"
            @click="selectPay(item.value)"
        >
          <view class="pay-left">
            <view class="pay-icon" :style="{background: item.icon && item.icon.startsWith('/') ? 'transparent' : item.bgColor}">
              <image v-if="item.icon && item.icon.startsWith('/')" :src="item.icon" class="pay-icon-img" mode="aspectFit" />
              <uni-icons v-else :type="item.icon" size="24" color="#fff" />
            </view>
            <text class="pay-name">{{ item.label }}</text>
            <text class="pay-balance" v-if="item.balance !== undefined">（可用余额：¥{{ item.balance }}）</text>
          </view>
          <view class="pay-radio">
            <view class="radio-dot" v-if="selectedPay === item.value"></view>
            </view>
        </view>
      </view>

      <!-- 协议 -->
      <view class="agreement-section">
        <view class="agreement-row" @click="userAgree = !userAgree">
          <view class="checkbox-box" :class="{checked: userAgree}">
            <uni-icons v-if="userAgree" type="checkmarkempty" size="18" color="#fff" />
          </view>
          <text class="agreement-text">我已阅读并同意</text>
          <text class="agreement-link" @click.stop="toAgreement('service')">《服务协议》</text>
          <text class="agreement-text">和</text>
          <text class="agreement-link" @click.stop="toAgreement('refund')">《退款规则》</text>
        </view>
        <text class="agreement-tip">，付款后30分钟内未接单自动取消</text>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-bottom"></view>
    </view>

    <!-- 底部支付栏 -->
    <view class="bottom-bar" v-if="showBottomBar">
      <view class="total-info" v-if="isOrderCreated">
        <text class="total-label">总计：</text>
        <text class="total-price">¥{{ (orderData.payAmount / 100).toFixed(2) }}</text>
      </view>
      <button
          class="pay-btn"
          :class="{disabled: !canAction, fullWidth: !isOrderCreated}"
          :disabled="!canAction"
          @click="handleAction"
      >
        {{ isSubmitting ? '处理中...' : (isOrderCreated ? '立即支付' : '创建订单') }}
      </button>
    </view>


    <!-- 手动实现的城市选择器 -->
    <view class="city-picker-mask" v-if="showCityPicker" @click="showCityPicker = false">
      <view class="city-picker-wrapper" @click.stop>
        <view class="city-picker-header">
          <text class="cancel-btn" @click="showCityPicker = false">取消</text>
          <text class="picker-title">选择城市</text>
          <text class="confirm-btn" @click="confirmCitySelection">确定</text>
        </view>
        <view class="city-picker-content">
          <!-- 省份选择 -->
          <view class="province-list">
            <view
                v-for="(province, index) in areaTree"
                :key="index"
                :class="{active: selectedProvinceIndex === index}"
                class="province-item"
                @click="onProvinceSelect(index)"
            >
              {{ province.name }}
            </view>
          </view>
          <!-- 城市选择 -->
          <view class="city-list">
            <view
                v-for="(city, index) in selectedProvince?.children || []"
                :key="index"
                :class="{active: selectedCityIndex === index}"
                class="city-item"
                @click="onCitySelect(index)"
            >
              {{ city.name }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 服务地点选择器 -->
    <view class="place-picker-mask" v-if="showPlacePicker" @click="showPlacePicker = false">
      <view class="place-picker-wrapper" @click.stop>
        <view class="place-picker-header">
          <text class="cancel-btn" @click="showPlacePicker = false">取消</text>
          <text class="picker-title">选择服务地点</text>
          <text class="confirm-btn" @click="confirmPlaceSelection" :class="{disabled: !selectedPlace}">确定</text>
        </view>
        <view class="place-picker-content">
          <!-- 搜索框 -->
          <view class="search-box">
            <uni-icons type="search" size="18" color="#9CA3AF" />
            <input
                v-model="placeSearchKeyword"
                class="search-input"
                placeholder="请输入服务地点关键词"
                @input="onPlaceSearch"
                @confirm="onPlaceSearch"
            />
            <uni-icons
                v-if="placeSearchKeyword"
                type="clear"
                size="18"
                color="#9CA3AF"
                class="clear-icon"
                @click="clearSearch"
            />
          </view>
          <!-- 搜索结果 -->
          <view class="place-results" v-if="placeSearchResults.length > 0">
            <view
                v-for="(place, index) in placeSearchResults"
                :key="index"
                :class="{active: selectedPlace?.name === place.name}"
                class="place-item"
                @click="selectPlace(place)"
            >
              <text class="place-name">{{ place.name }}</text>
              <text class="place-address">{{ place.address }}</text>
            </view>
          </view>
          <!-- 无结果提示 -->
          <view class="no-results" v-if="placeSearchKeyword && placeSearchResults.length === 0">
            未找到相关地点，请尝试其他关键词
          </view>
        </view>
      </view>
    </view>


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
            :indicator-style="indicatorStyle"
            :value="pickerValue"
            @change="onPickerChange"
            indicator-style="height: 80rpx; border-top: 1rpx solid rgba(255,255,255,0.1); border-bottom: 1rpx solid rgba(255,255,255,0.1);"
            mask-style="background-image: linear-gradient(to bottom, rgba(42, 51, 56, 0.95), rgba(42, 51, 56, 0.4), rgba(42, 51, 56, 0.95));"
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

  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/store'
import { fetchEnabledChannels, executePayment } from '@/utils/payment'
import { createOrder } from '@/api/billiard/order'
import { getCoachDetail } from '@/api/billiard/coach'
import { searchServicePlace } from '@/api/billiard/venue'
import { getAreaTree } from '@/api/billiard/area'
import { onLoad } from '@dcloudio/uni-app'
import { getWallet } from '@/api/billiard/wallet'
import { guardReviewEntry } from '@/utils/review'
import { getLocation, extractStreet, extractCity, showPermissionModal, openAppSetting } from '@/utils/location'

// 主题相关
const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// ---------------------- 状态定义 ----------------------
const isSubmitting = ref(false)
const userAgree = ref(false)
const selectedPay = ref('')
const showTimePicker = ref(false)
const createDirect = ref(false)
const isOrderCreated = ref(false)

// 地点选择相关
const placeSearchKeyword = ref('')
const placeSearchResults = ref([])
const selectedPlace = ref(null)

// 定位相关
const locating = ref(false)
const locationDenied = ref(false) // 记录是否已拒绝定位权限
const currentLocation = ref({
  longitude: null,
  latitude: null
})
const currentCity = ref('') // 当前定位的城市名称

// 城市选择相关
const areaLocalData = ref([])
const areaTree = ref([])
const selectedCityId = ref(null)
const showCityPicker = ref(false)
const selectedProvinceIndex = ref(-1)
const selectedCityIndex = ref(-1)

	// 服务地点选择相关
	const showPlacePicker = ref(false)

// 城市选择器操作
const onProvinceSelect = (index) => {
  selectedProvinceIndex.value = index
  selectedCityIndex.value = -1
}

const onCitySelect = (index) => {
  selectedCityIndex.value = index
}

const confirmCitySelection = () => {
  if (selectedProvinceIndex.value !== -1 && selectedCityIndex.value !== -1) {
    const province = areaTree.value[selectedProvinceIndex.value]
    const city = province.children[selectedCityIndex.value]
    selectedCityId.value = city.id
    currentCity.value = city.name
    showCityPicker.value = false
  } else {
    uni.showToast({ title: '请选择城市', icon: 'none' })
  }
}

// 服务地点选择器操作
const confirmPlaceSelection = () => {
  if (selectedPlace.value) {
    showPlacePicker.value = false
  } else {
    uni.showToast({ title: '请选择服务地点', icon: 'none' })
  }
}

const selectPlace = (place) => {
  selectedPlace.value = place
}

const selectedProvince = computed(() => {
  return selectedProvinceIndex.value !== -1 ? areaTree.value[selectedProvinceIndex.value] : null
})

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

// 订单数据
const orderData = ref({})

// 服务类型
const serviceType = ref(1)

// 支付倒计时
const countdownTimer = ref(null)
const countdownText = ref('')

// 钱包余额
const walletBalance = ref(null)

// 支付方式
const payList = ref([])

// 时间选择器相关
const pickerValue = ref([0, 0, 0])
const selectedDateTime = ref({ dateIndex: 0, hourIndex: 0, minuteIndex: 0 })

// 教练信息显示用
const coachInfo = ref({ badgeBg: 'rgba(0, 187, 136, 0.2)' })

// 时间选择器列
const dateColumns = ref([])
const hourColumns = ref([])
const minuteColumns = ref([])

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

// 初始化时间选择器数据
const initTimePickerData = () => {
  const now = new Date()
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    dates.push({ date, dateText: `${month}.${day}` })
  }
  dateColumns.value = dates
  updateHourColumns(0)
  updateMinuteColumns(0, 0)
}

// 设置时间选择器默认值
const setDefaultPickerValue = (targetTime) => {
  const targetDate = new Date(Math.max(Number(targetTime) || 0, getNextValidTime().getTime()))
  const now = new Date()

  // 计算日期索引
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetStartOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  const dateIndex = Math.floor((targetStartOfDay - startOfDay) / (24 * 60 * 60 * 1000))

  if (dateIndex < 0 || dateIndex >= dateColumns.value.length) return

  updateHourColumns(dateIndex)

  // 计算小时索引
  const targetHour = targetDate.getHours()
  let hourIndex = hourColumns.value.findIndex(h => h.hour === targetHour)
  if (hourIndex === -1) hourIndex = 0

  updateMinuteColumns(dateIndex, hourIndex)

  // 计算分钟索引
  const targetMinute = targetDate.getMinutes()
  let minuteIndex = minuteColumns.value.findIndex(m => m.minute >= targetMinute)
  if (minuteIndex === -1) minuteIndex = Math.max(0, minuteColumns.value.length - 1)

  pickerValue.value = [dateIndex, hourIndex, minuteIndex]
  selectedDateTime.value = { dateIndex, hourIndex, minuteIndex }
}

const updateHourColumns = (dateIndex) => {
  const nextValidTime = getNextValidTime()
  const startHour = dateIndex === 0 ? nextValidTime.getHours() : 0
  const hours = []
  for (let i = startHour; i <= 23; i++) {
    hours.push({ hour: i, hourText: String(i).padStart(2, '0') + '时' })
  }
  hourColumns.value = hours
}

const updateMinuteColumns = (dateIndex, hourIndex) => {
  const nextValidTime = getNextValidTime()
  const isToday = dateIndex === 0
  const currentHour = hourColumns.value[hourIndex]?.hour
  const startMinute = isToday && currentHour === nextValidTime.getHours() ? nextValidTime.getMinutes() : 0
  const minutes = []
  for (let i = startMinute; i < 60; i += 5) {
    minutes.push({ minute: i, minuteText: String(i).padStart(2, '0') + '分' })
  }
  minuteColumns.value = minutes
}

const onPickerChange = (e) => {
  const val = e.detail.value
  pickerValue.value = val
  const newDateIndex = val[0]
  const newHourIndex = val[1]
  const newMinuteIndex = val[2]

  if (newDateIndex !== selectedDateTime.value.dateIndex) {
    updateHourColumns(newDateIndex)
    updateMinuteColumns(newDateIndex, 0)
    pickerValue.value = [newDateIndex, 0, 0]
    selectedDateTime.value = { dateIndex: newDateIndex, hourIndex: 0, minuteIndex: 0 }
    return
  }

  if (newHourIndex !== selectedDateTime.value.hourIndex) {
    updateMinuteColumns(newDateIndex, newHourIndex)
    pickerValue.value = [newDateIndex, newHourIndex, 0]
    selectedDateTime.value = { ...selectedDateTime.value, hourIndex: newHourIndex, minuteIndex: 0 }
    return
  }

  selectedDateTime.value = { dateIndex: newDateIndex, hourIndex: newHourIndex, minuteIndex: newMinuteIndex }
}

const cancelTime = () => { showTimePicker.value = false }

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
    setDefaultPickerValue(getNextValidTime().getTime())
    return
  }

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(hourItem.hour).padStart(2, '0')
  const minute = String(minuteItem.minute).padStart(2, '0')

  const isToday = selectedDateTime.value.dateIndex === 0
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekDay = isToday ? '今天' : weekDays[date.getDay()]

  orderData.value.timeText = `${weekDay} ${month}.${day} ${hour}:${minute}`
  orderData.value.bookingTime = date.getTime()
  showTimePicker.value = false
}

// 服务类型名称
const serviceTypeName = computed(() => {
  if (serviceType.value === 1) return '台球指导'
  if (serviceType.value === 2) return '潮玩领航'
  if (serviceType.value === 3) return '酒艺品鉴'
  if (serviceType.value === 4) return '影视赏析'
  return '台球指导'
})

const selectedPayChannel = computed(() => payList.value.find(item => item.value === selectedPay.value))

const applyWalletBalance = (channels) => {
  return channels.map(channel => ({
    ...channel,
    ...(channel.value === 'wallet' && walletBalance.value !== null ? { balance: walletBalance.value } : {})
  }))
}

const ensureSelectedPay = () => {
  if (!payList.value.some(item => item.value === selectedPay.value)) {
    selectedPay.value = payList.value[0]?.value || ''
  }
}

const loadPayChannels = async () => {
  try {
    const channels = await fetchEnabledChannels(10)
    console.log('获取到的支付渠道列表:', channels)
    payList.value = applyWalletBalance(channels)
    ensureSelectedPay()
  } catch (error) {
    console.error('加载支付方式失败:', error)
    payList.value = []
    ensureSelectedPay()
  }
}

// ---------------------- 计算属性 ----------------------
// 是否可以操作
const canAction = computed(() => {
  if (!userAgree.value) return false
  if (isSubmitting.value) return false
  if (orderExpired.value) return false

  if (!isOrderCreated.value) {
    // 服务类型 2/3/4 需要选择服务地点
    if ([2, 3, 4].includes(serviceType.value)) {
      return orderData.value.bookingTime !== undefined && selectedPlace.value
    }
    // 服务类型 1 需要选择球厅
    return orderData.value.bookingTime !== undefined
  } else {
    return orderData.value.payOrderId !== null && orderData.value.payOrderId !== undefined && !!selectedPayChannel.value
  }
})

// ---------------------- 方法 ----------------------
// 获取当前位置（使用统一封装）
const getCurrentLocation = async () => {
  if (locating.value) return
  locating.value = true

  try {
    const { longitude, latitude, regeocodeData } = await getLocation({ needRegeocode: true })
    currentLocation.value = { longitude, latitude }
    currentCity.value = extractCity(regeocodeData)
    locationDenied.value = false // 重置权限拒绝状态
  } catch (err) {
    console.error('定位失败:', err)
    if (err.message === 'permission_denied') {
      locationDenied.value = true // 标记权限被拒绝
      showPermissionModal({
        content: '您未开启定位权限，将无法获取当前位置。是否前往开启？',
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
  }
}

// 选择城市
const selectCity = (city) => {
  currentCity.value = city
  showCityList.value = false
  // 重置地点搜索结果
  placeSearchKeyword.value = ''
  placeSearchResults.value = []
  selectedPlace.value = null
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
    // 重置地点搜索结果
    placeSearchKeyword.value = ''
    placeSearchResults.value = []
    selectedPlace.value = null
  }
}

// 重新定位
const reLocate = async () => {
  selectedCityId.value = null
  await getCurrentLocation()
}

// 地点搜索
const onPlaceSearch = async () => {
  if (!placeSearchKeyword.value.trim()) {
    placeSearchResults.value = []
    return
  }

  try {
    const res = await searchServicePlace({
      keywords: placeSearchKeyword.value,
      city: displayCityName.value
    })
    if (res.code === 0 && res.data) {
      placeSearchResults.value = res.data
    }
  } catch (error) {
    console.error('搜索地点失败:', error)
    uni.showToast({ title: '搜索失败，请重试', icon: 'none' })
  }
}

// 获取选中的城市名称
const getSelectedCityName = () => {
  if (selectedAreaIds.value.length === 0) return null

  // 从 areaTree 中查找选中的城市名称
  const findArea = (list, id) => {
    for (const area of list) {
      if (area.id === id) return area
      if (area.children) {
        const found = findArea(area.children, id)
        if (found) return found
      }
    }
    return null
  }

  const selectedAreaId = selectedAreaIds.value[selectedAreaIds.value.length - 1]
  const area = findArea(areaTree.value, selectedAreaId)
  return area?.name
}

// 清除搜索
const clearSearch = () => {
  placeSearchKeyword.value = ''
  placeSearchResults.value = []
}

// 获取选中的城市名称（使用当前选择的城市）
const selectedAreaName = computed(() => {
  return currentCity.value
})

// 城市选择器显示和隐藏
const showBottomBar = ref(true)
const onPickerShow = () => {
  showBottomBar.value = false
}
const onPickerHide = () => {
  showBottomBar.value = true
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}.${day} ${hour}:${minute}`
}


// 重新选择球厅
const reselectHall = () => {
  const reselectParams = {
    coachInfo: orderData.value.coachInfo,
    serviceDuration: orderData.value.serviceDuration,
    quantity: orderData.value.quantity,
    bookingTime: orderData.value.bookingTime,
    timeText: orderData.value.timeText,
    isReselect: true
  }
  uni.setStorageSync('reselectParams', reselectParams)
  uni.navigateTo({ url: '/subpkg/booking/hall' })
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 选择支付方式
const selectPay = (val) => { selectedPay.value = val }

// 查看协议
const toAgreement = (type) => {
  if (type === 'service') {
    uni.navigateTo({ url: '/subpkg/common/service-agreement' })
  } else {
    uni.navigateTo({ url: '/subpkg/common/refund-policy' })
  }
}

// 加载钱包余额
const loadWalletBalance = async () => {
  try {
    const res = await getWallet()
    if (res.data && res.data.balance !== undefined) {
      walletBalance.value = (res.data.balance / 100).toFixed(2)
      payList.value = applyWalletBalance(payList.value)
    }
  } catch (error) {
    console.error('加载钱包余额失败:', error)
  }
}

// 加载教练详情
const loadCoachDetail = async (coachId) => {
  try {
    const res = await getCoachDetail({ id: coachId })
    if (res.data) {
      const coachData = res.data
      // 从photos中获取主图作为avatar
      const mainPhoto = coachData.photos?.find(p => p.isMain) || coachData.photos?.[0]
      const avatar = coachData.avatar || mainPhoto?.photoUrl || '/static/default-avatar.png'
      // 更新orderData中的教练信息
      orderData.value.coachInfo = {
        ...orderData.value.coachInfo,
        ...coachData,
        avatar
      }
    }
  } catch (error) {
    console.error('加载教练详情失败:', error)
  }
}

// 处理操作：创建订单 或 支付
const handleAction = async () => {
  if (!userAgree.value) {
    uni.showToast({ title: '请先阅读并同意服务协议和退款规则', icon: 'none' })
    return
  }
  if (!canAction.value) {
    // 检查是否缺少地点选择
    if ([2, 3, 4].includes(serviceType.value) && !selectedPlace.value) {
      uni.showToast({ title: '请选择服务地点', icon: 'none' })
    }
    return
  }

  if (!isOrderCreated.value) {
    await handleCreateOrder()
  } else {
    await submitPayment()
  }
}

// 创建订单
const handleCreateOrder = async () => {
  console.log(orderData.value)
  if (!orderData.value.coachInfo?.id) {
    uni.showToast({ title: '教练信息缺失', icon: 'none' })
    return
  }

  if (!orderData.value.bookingTime) {
    uni.showToast({ title: '请选择服务时间', icon: 'none' })
    return
  }
  if (orderData.value.bookingTime <= Date.now()) {
    uni.showToast({ title: '预约时间已过，请重新选择', icon: 'none' })
    setDefaultPickerValue(getNextValidTime().getTime())
    return
  }

  // 服务类型 2/3/4 需要选择服务地点
  if ([2, 3, 4].includes(serviceType.value) && !selectedPlace.value) {
    uni.showToast({ title: '请选择服务地点', icon: 'none' })
    return
  }

  // 服务类型 1 需要球厅名称、地址和坐标
  if (serviceType.value === 1) {
    const venueName = orderData.value.hallInfo?.name || orderData.value.venueName
    const venueAddress = orderData.value.hallInfo?.address || orderData.value.venueAddress
    const venueLongitude = orderData.value.hallInfo?.longitude ?? orderData.value.venueLongitude
    const venueLatitude = orderData.value.hallInfo?.latitude ?? orderData.value.venueLatitude
    if (!venueName) {
      uni.showToast({ title: '请选择球厅', icon: 'none' })
      return
    }
    if (!venueAddress) {
      uni.showToast({ title: '球厅地址缺失', icon: 'none' })
      return
    }
    if (venueLongitude == null || venueLatitude == null) {
      uni.showToast({ title: '球厅坐标缺失', icon: 'none' })
      return
    }
  }

  isSubmitting.value = true
  try {
    const createParams = {
      coachId: orderData.value.coachInfo.id,
      serviceType: serviceType.value,
      bookingTime: orderData.value.bookingTime,
      serviceDuration: orderData.value.serviceDuration || 120,
      quantity: orderData.value.quantity || 2
    }

    // 服务类型 1 使用球厅信息
    if (serviceType.value === 1) {
      createParams.venueId = (orderData.value.hallInfo?.id ?? orderData.value.venueId) ?? null
      createParams.venueName = orderData.value.hallInfo?.name || orderData.value.venueName
      createParams.venueAddress = orderData.value.hallInfo?.address || orderData.value.venueAddress
      createParams.venueLongitude = orderData.value.hallInfo?.longitude ?? orderData.value.venueLongitude
      createParams.venueLatitude = orderData.value.hallInfo?.latitude ?? orderData.value.venueLatitude
    } else if ([2, 3, 4].includes(serviceType.value)) {
      // 服务类型 2/3/4 使用服务地点凭证
      createParams.servicePlaceToken = selectedPlace.value.selectionToken
    }

    // 如果有选中的服务项目，传递服务项目ID
    if (orderData.value.selectedService?.id) {
      createParams.serviceItemId = orderData.value.selectedService.id
    }
    console.log(createParams,'======createParams=====')
    // 处理地点凭证失效的情况
    const createRes = await createOrder(createParams)
    const resultData = createRes.data || {}

    // 合并数据 - 确保使用后端返回的价格数据
    orderData.value = {
      ...orderData.value,
      ...resultData,
      // 确保价格相关字段使用后端返回的数据
      serviceAmount: resultData.serviceAmount ?? 0,
      travelAmount: resultData.travelAmount ?? 0,
      travelDiscountAmount: resultData.travelDiscountAmount ?? 0,
      payAmount: resultData.payAmount ?? 0
    }
    isOrderCreated.value = true

    // 保存到 storage
    uni.setStorageSync('createdOrderData', orderData.value)
    startCountdown()
    await loadPayChannels()

    uni.showToast({ title: '订单创建成功', icon: 'success' })
  } catch (error) {
    console.error('创建订单失败:', error)
    // 处理地点凭证失效的情况
    if (error.code === 1010000336) {
      uni.showToast({ title: '服务地点已失效，请重新选择', icon: 'none' })
      selectedPlace.value = null
    } else {
      uni.showToast({ title: error.message || '创建订单失败，请重试', icon: 'none' })
    }
  } finally {
    isSubmitting.value = false
  }
}

// 提交支付
const submitPayment = async () => {
  if (!canAction.value || !orderData.value.payOrderId) return

  const payChannel = selectedPayChannel.value
  if (!payChannel) {
    uni.showToast({ title: '请选择支付方式', icon: 'none' })
    return
  }

  isSubmitting.value = true
  try {
    await executePayment({
      payOrderId: orderData.value.payOrderId,
      orderId: orderData.value.orderId,
      payValue: selectedPay.value,
      channelCode: payChannel.channelCode,
      onSuccess: (payResult) => {
        uni.showToast({ title: '支付成功', icon: 'success' })
        setTimeout(() => {
          uni.redirectTo({ url: `/subpkg/booking/pay-success?orderId=${orderData.value.orderId}` })
        }, 1500)
      },
      onCancel: () => {
        uni.showToast({ title: '支付已取消', icon: 'none' })
      },
      onError: (error) => {
        if (!error.pending) {
          uni.showToast({ title: error.message || '支付失败，请重试', icon: 'none' })
        }
      }
    })
  } catch (error) {
    console.error('支付失败:', error)
    if (!error.canceled && !error.pending) {
      uni.showToast({ title: error.message || '支付失败，请重试', icon: 'none' })
    }
  } finally {
    isSubmitting.value = false
  }
}

// 订单是否已过期
const orderExpired = ref(false)

// 支付倒计时
const startCountdown = () => {
  if (!orderData.value || !orderData.value.expireTime) return

  const updateCountdown = () => {
    const now = Date.now()
    const diff = orderData.value.expireTime - now

    if (diff <= 0) {
      countdownText.value = '00:00'
      orderExpired.value = true
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
      }
      uni.showToast({ title: '订单已过期，请重新下单', icon: 'none' })
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/coach/list' })
      }, 1500)
      return
    }

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    countdownText.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  updateCountdown()
  countdownTimer.value = setInterval(updateCountdown, 1000)
}

// ---------------------- 生命周期 ----------------------
onLoad((options) => {
  // 审核模式入口守卫
  if (guardReviewEntry()) return
  // 不再需要 createDirect 参数，订单已在 detail 页创建
  initTimePickerData()
})

onMounted(async () => {
  // 加载省市区数据
  await loadAreaTree()

  // 自动获取当前位置和城市信息
  await getCurrentLocation()

  // 从 storage 获取订单数据
  try {
    const createdOrder = uni.getStorageSync('createdOrderData')
    console.log('确认订单页面获取到的订单数据:', createdOrder)

    if (createdOrder && Object.keys(createdOrder).length > 0) {
      orderData.value = createdOrder
      // 设置服务类型
      if (createdOrder.serviceType !== undefined) {
        serviceType.value = createdOrder.serviceType
      } else if (createdOrder.hallInfo) {
        // 如果有球厅信息，默认是台球陪练
        serviceType.value = 1
      }
      uni.removeStorageSync('createdOrderData')

      // 判断订单是否已经创建（通过是否包含 orderId 或 orderNo 来判断）
      isOrderCreated.value = !!(createdOrder.orderId || createdOrder.orderNo)

      if (isOrderCreated.value) {
        startCountdown()
        await loadWalletBalance()
        await loadPayChannels()
      }

      // 重新获取教练详情以确保头像等信息最新
      if (orderData.value.coachInfo?.id) {
        loadCoachDetail(orderData.value.coachInfo.id)
      }
    } else {
      console.error('订单数据为空')
      uni.showToast({ title: '订单数据缺失，请重新下单', icon: 'none', duration: 2000 })
      setTimeout(() => { uni.reLaunch({ url: '/pages/coach/list' }) }, 2000)
    }
  } catch (error) {
    console.error('获取订单数据失败:', error)
    uni.showToast({ title: '加载数据失败，请重试', icon: 'none', duration: 2000 })
    setTimeout(() => { uni.reLaunch({ url: '/pages/coach/list' }) }, 2000)
  }
})

onUnmounted(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
})
</script>

<style lang="scss" scoped>
.confirm-order-wrapper {
  min-height: 100vh;
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 顶部导航 */
.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + constant(safe-area-inset-top));
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: var(--bg-page);
  .nav-left, .nav-right {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-title {
    color: var(--text-primary);
    font-size: 34rpx;
    font-weight: 600;
  }
}

.order-content {
  flex: 1;
  width: 100%;
  padding-bottom: 220rpx; /* 增加底部间距，确保内容不被固定栏遮挡 */
  box-sizing: border-box;
  overflow-y: auto; /* 允许内容垂直滚动 */
  -webkit-overflow-scrolling: touch; /* iOS 惯性滚动支持 */
}

/* 教练信息 */
.coach-card {
  margin: 30rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  .coach-avatar {
    width: 140rpx;
    height: 140rpx;
    border-radius: 20rpx;
    flex-shrink: 0;
  }
  .coach-info {
    flex: 1;
    min-width: 0;
    .coach-name-row {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 8rpx;
      flex-wrap: wrap;
      .coach-name {
        color: var(--text-primary);
        font-size: 32rpx;
        font-weight: 700;
      }
      .coach-badge {
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        font-size: 22rpx;
        color: #00BB88;
        flex-shrink: 0;
      }
    }
    .coach-desc {
      color: var(--text-secondary);
      font-size: 24rpx;
      margin-bottom: 10rpx;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .coach-meta {
      display: flex;
      align-items: center;
      gap: 8rpx;
      flex-wrap: wrap;
      .meta-item {
        color: var(--text-secondary);
        font-size: 24rpx;
        display: flex;
        align-items: center;
        gap: 4rpx;
      }
      .meta-divider {
        color: var(--bg-secondary);
      }
    }
  }
  .coach-score {
    display: flex;
    align-items: center;
    gap: 4rpx;
    color: #FBBF24;
    font-size: 28rpx;
    font-weight: 700;
    flex-shrink: 0;
  }
}

/* 通用卡片 */
.info-card {
  margin: 0 30rpx 30rpx;
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

/* 信息行 */
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
  .value {
    color: var(--text-primary);
    font-size: 28rpx;
  }
}

/* 球厅信息特殊样式 */
.venue-row {
  align-items: flex-start;
  .venue-wrap {
    align-items: flex-start;
    .venue-info {
      flex: 1;
      text-align: right;
      .venue-name {
        color: var(--text-primary);
        font-size: 28rpx;
        display: block;
        margin-bottom: 6rpx;
      }
      .venue-address {
        color: var(--text-secondary);
        font-size: 24rpx;
        display: block;
        line-height: 1.4;
      }
    }
  }
}

/* 费用明细 */
.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  .fee-label {
    color: var(--text-secondary);
    font-size: 28rpx;
  }
  .fee-value {
    color: var(--text-primary);
    font-size: 28rpx;
  }
}
.fee-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid var(--border-color);
  .total-label {
    color: var(--text-primary);
    font-size: 30rpx;
    font-weight: 600;
  }
  .total-value {
    color: #00BB88;
    font-size: 40rpx;
    font-weight: 700;
  }
}

/* 支付倒计时 */
.countdown-card {
  margin: 0 30rpx 30rpx;
  background: rgba(251, 191, 36, 0.1);
  border: 1rpx solid rgba(251, 191, 36, 0.3);
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  .countdown-text {
    color: #FBBF24;
    font-size: 26rpx;
  }
  .countdown-time {
    font-weight: 700;
    font-size: 28rpx;
  }
}

/* 支付方式 */
.pay-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border-color);
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .pay-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    .pay-icon {
      width: 70rpx;
      height: 70rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .pay-icon-img {
        width: 56rpx;
        height: 56rpx;
      }
    }
    .pay-name {
      color: var(--text-primary);
      font-size: 30rpx;
      font-weight: 500;
    }
    .pay-balance {
      color: var(--text-secondary);
      font-size: 24rpx;
    }
  }
  .pay-radio {
    width: 40rpx;
    height: 40rpx;
    border: 3rpx solid var(--bg-secondary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &.active {
    .pay-radio {
      border-color: #00BB88;
      .radio-dot {
        width: 20rpx;
        height: 20rpx;
        border-radius: 50%;
        background: #00BB88;
      }
    }
  }
}

/* 协议 */
.agreement-section {
  padding: 0 30rpx 30rpx;
  .agreement-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6rpx;
    margin-bottom: 8rpx;
    .checkbox-box {
      width: 32rpx;
      height: 32rpx;
      border: 2rpx solid var(--text-secondary);
      border-radius: 6rpx;
      margin-right: 8rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      &.checked {
        background: #00BB88;
        border-color: #00BB88;
      }
    }
    .agreement-text {
      color: var(--text-secondary);
      font-size: 24rpx;
    }
    .agreement-link {
      color: #00BB88;
      font-size: 24rpx;
    }
  }
  .agreement-tip {
    display: block;
    color: var(--text-tertiary);
    font-size: 24rpx;
    padding-left: 48rpx;
  }
}

/* 底部支付栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 999;
  background: var(--bg-card);
  border-top: 1rpx solid var(--border-color);
  padding: 12rpx 24rpx;
  padding-bottom: calc(12rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.3);
  /* 确保在iOS和Android上都能正确固定 */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  .total-info {
    flex: 1;
    .total-label {
      color: var(--text-primary);
      font-size: 24rpx;
    }
    .total-price {
      color: #00BB88;
      font-size: 36rpx;
      font-weight: 700;
    }
  }
  .pay-btn {
    background: #00BB88;
    color: var(--text-primary);
    border-radius: 36rpx;
    padding: 14rpx 44rpx;
    font-size: 28rpx;
    font-weight: 700;
    border: none;
    &::after {
      border: none;
    }
    &.disabled {
      background: rgba(0, 187, 136, 0.3);
    }
    &.fullWidth {
      padding: 18rpx 0;
      font-size: 32rpx;
      width: 100%;
    }
  }
}

/* 手动实现的城市选择器样式 */
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
  background: var(--bg-card);
  border-radius: 32rpx 32rpx 0 0;
  animation: slideUp 0.3s ease;
  z-index: 1000;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.city-picker-header {
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

.city-picker-content {
  display: flex;
  height: 500rpx;
  overflow: hidden;
}

.province-list, .city-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.province-item, .city-item {
  padding: 24rpx 30rpx;
  color: var(--text-primary);
  font-size: 28rpx;
  &.active {
    background: var(--bg-secondary);
    color: #00BB88;
  }
}

/* 底部安全区域 */
.safe-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}

/* 城市选择器外层容器 */
.location-picker-wrapper {
  margin: 0;
  padding: 0;
}

/* 定位信息 */
.location-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx;
  background: var(--bg-card);
  border-radius: 16rpx;
  .location-text {
    color: var(--text-primary);
    font-size: 28rpx;
    flex: 1;
  }
}

/* 重新定位按钮 */
.relocate-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin: 16rpx 30rpx 0rpx;
  padding: 12rpx 24rpx;
  background: rgba(0, 187, 136, 0.1);
  border-radius: 32rpx;
  align-self: flex-start;
  .relocate-text {
    color: var(--brand-primary);
    font-size: 24rpx;
  }
}

/* 地点搜索样式 */
.place-search {
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: var(--bg-secondary);
  margin: 20rpx;
  border-radius: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--text-primary);
  height: 60rpx;
  line-height: 60rpx;
}

.clear-icon {
  padding: 4rpx;
}

.place-results {
  max-height: 600rpx;
  overflow-y: auto;
  padding: 0 20rpx 20rpx;
}

.place-item {
  padding: 24rpx;
  border-bottom: 1rpx solid var(--border-color);
  &:last-child {
    border-bottom: none;
  }
  &.active {
    background: var(--bg-secondary);
  }
}

.place-name {
  color: var(--text-primary);
  font-size: 30rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.place-address {
  color: var(--text-secondary);
  font-size: 24rpx;
  line-height: 1.4;
}

.no-results {
  text-align: center;
  padding: 60rpx 20rpx;
  color: var(--text-secondary);
  font-size: 28rpx;
}

.time-picker-header .confirm-btn.disabled {
  color: var(--text-secondary);
  pointer-events: none;
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

/* 服务地点选择器样式 */
.place-picker-mask {
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

.place-picker-wrapper {
  background: var(--bg-card);
  border-radius: 32rpx 32rpx 0 0;
  animation: slideUp 0.3s ease;
  z-index: 1000;
  max-height: 80vh;
}

.place-picker-header {
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
    &.disabled {
      color: var(--text-secondary);
      pointer-events: none;
    }
  }
}

.place-picker-content {
  padding: 20rpx;
  .search-box {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx;
    background: var(--bg-secondary);
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: var(--text-primary);
      height: 60rpx;
      line-height: 60rpx;
    }
    .clear-icon {
      padding: 4rpx;
    }
  }
  .place-results {
    max-height: 500rpx;
    overflow-y: auto;
    padding: 0 20rpx 20rpx;
  }
  .place-item {
    padding: 24rpx;
    border-bottom: 1rpx solid var(--border-color);
    &:last-child {
      border-bottom: none;
    }
    &.active {
      background: var(--bg-secondary);
    }
    .place-name {
      color: var(--text-primary);
      font-size: 30rpx;
      font-weight: 500;
      margin-bottom: 8rpx;
    }
    .place-address {
      color: var(--text-secondary);
      font-size: 24rpx;
      line-height: 1.4;
    }
  }
  .no-results {
    text-align: center;
    padding: 60rpx 20rpx;
    color: var(--text-secondary);
    font-size: 28rpx;
  }
}
</style>