<template>
  <view class="confirm-order-wrapper" :class="themeClass">
    <view class="order-content">

      <!-- 教练信息 -->
      <CoachInfoCard v-if="orderData.coachInfo" :coach="orderData.coachInfo" />

      <!-- 服务信息 -->
      <ServiceInfoCard
          :service-type-name="serviceTypeName"
          :is-fixed-order="isFixedOrder"
          :service-duration="orderData.serviceDuration"
          :is-order-created="isOrderCreated"
          :time-text="orderData.timeText"
          :booking-time="orderData.bookingTime"
          :service-type="serviceType"
          :venue-name="orderData.hallInfo?.name || orderData.venueName"
          :venue-address="orderData.hallInfo?.address || orderData.venueAddress"
          :locating="locating"
          :location-denied="locationDenied"
          :display-city-name="displayCityName"
          :place-name="selectedPlace?.name"
          @select-time="showTimePicker = true"
          @reselect-hall="reselectHall"
          @select-city="showCityPicker = true"
          @select-place="showPlacePicker = true"
      />

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
      <FeeDetailCard
          v-if="isOrderCreated"
          :order-data="orderData"
          :service-type-name="serviceTypeName"
          :service-fee-quantity-text="serviceFeeQuantityText"
      />

      <!-- 支付倒计时 -->
      <view class="countdown-card" v-if="orderData.expireTime && isOrderCreated">
        <uni-icons type="time" size="18" color="#FBBF24" />
        <text class="countdown-text">请在 <text class="countdown-time">{{ countdownText }}</text> 内完成支付</text>
      </view>

      <!-- 支付方式 -->
      <PayMethodCard
          v-if="isOrderCreated"
          :pay-list="payList"
          v-model="selectedPay"
      />

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
    <BookingBottomBar
        :show="showBottomBar"
        :is-order-created="isOrderCreated"
        :pay-amount="orderData.payAmount"
        :can-action="canAction"
        :is-submitting="isSubmitting"
        @action="handleAction"
    />

    <!-- 城市选择器弹窗 -->
    <CityPickerPopup
        v-model:visible="showCityPicker"
        :area-tree="areaTree"
        @confirm="onCityPickerConfirm"
    />

    <!-- 服务地点搜索弹窗 -->
    <PlaceSearchPopup
        v-model:visible="showPlacePicker"
        :search-fn="handlePlaceSearch"
        :city-id="selectedCityId"
        @confirm="handlePlaceConfirm"
    />

    <!-- 时间选择器弹窗 -->
    <TimePickerPopup
        v-model:visible="showTimePicker"
        :default-value="orderData.bookingTime"
        @confirm="onTimePickerConfirm"
    />

  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore, useBookingStore } from '@/store'
import { onLoad } from '@dcloudio/uni-app'
import { getCoachDetail } from '@/api/billiard/coach'
import { guardReviewEntry } from '@/utils/review'
import { logger } from '@/utils/logger'

// 组件
import TimePickerPopup from '@/components/booking/TimePickerPopup.vue'
import CityPickerPopup from '@/components/booking/CityPickerPopup.vue'
import PlaceSearchPopup from '@/components/booking/PlaceSearchPopup.vue'
import CoachInfoCard from '@/components/booking/CoachInfoCard.vue'
import ServiceInfoCard from '@/components/booking/ServiceInfoCard.vue'
import FeeDetailCard from '@/components/booking/FeeDetailCard.vue'
import PayMethodCard from '@/components/booking/PayMethodCard.vue'
import BookingBottomBar from '@/components/booking/BookingBottomBar.vue'

// composables
import { useBookingTime } from '@/composables/useBookingTime'
import { useLocationCity } from '@/composables/useLocationCity'
import { usePayChannels } from '@/composables/usePayChannels'
import { useOrderCreate } from '@/composables/useOrderCreate'

// 主题 & Store
const themeStore = useThemeStore()
const bookingStore = useBookingStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 基础状态
const userAgree = ref(false)
const isOrderCreated = ref(false)
const orderData = ref({})
const serviceType = ref(1)
const showBottomBar = ref(true)
const orderExpired = ref(false)

// 倒计时
const countdownTimer = ref(null)
const countdownText = ref('')

// ===== 组合式函数 =====

// 时间选择
const {
  showTimePicker,
  onTimePickerConfirm,
} = useBookingTime({ orderData })

// 定位 & 城市 & 地点
const {
  locating,
  locationDenied,
  currentCity,
  areaTree,
  selectedCityId,
  showCityPicker,
  showPlacePicker,
  selectedPlace,
  getCurrentLocation,
  loadAreaTree,
  onCityPickerConfirm,
  handlePlaceSearch,
  reLocate,
  getDisplayCityName,
} = useLocationCity()

const displayCityName = computed(() => getDisplayCityName())

const handlePlaceConfirm = (place) => {
  selectedPlace.value = place
  orderData.value.venueName = place.name
  orderData.value.venueAddress = place.address
}

// 支付渠道
const {
  payList,
  selectedPay,
  selectedPayChannel,
  loadPayChannels,
  loadWalletBalance,
} = usePayChannels()

// 服务类型名称
const serviceTypeName = computed(() => {
  if (serviceType.value === 1) return '台球指导'
  if (serviceType.value === 2) return '潮玩领航'
  if (serviceType.value === 3) return '酒艺品鉴'
  if (serviceType.value === 4) return '影视赏析'
  return '台球指导'
})

// 订单创建 & 支付
const {
  isSubmitting,
  isFixedOrder,
  canAction,
  handleAction,
} = useOrderCreate({
  orderData,
  serviceType,
  selectedPlace,
  selectedPay,
  selectedPayChannel,
  userAgree,
  orderExpired,
  isOrderCreated,
  afterCreate: async () => {
    startCountdown()
    await loadWalletBalance()
    await loadPayChannels()
  },
  onPaySuccess: () => {
    setTimeout(() => {
      uni.redirectTo({
        url: `/subpkg/booking/pay-success?orderId=${orderData.value.orderId}`,
      })
    }, 1500)
  },
})

// 费用明细中服务项的数量+单位文案
const serviceFeeQuantityText = computed(() => {
  if (isFixedOrder.value) {
    return 'x1次'
  }
  const qty = orderData.value.quantity || 2
  return `x${qty}小时`
})

// ===== 其他方法 =====

// 重新选择球厅
const reselectHall = () => {
  const reselectParams = {
    coachInfo: orderData.value.coachInfo,
    serviceDuration: orderData.value.serviceDuration,
    quantity: orderData.value.quantity,
    bookingTime: orderData.value.bookingTime,
    timeText: orderData.value.timeText,
    isReselect: true,
  }
  bookingStore.setReselectParams(reselectParams)
  uni.navigateTo({ url: '/subpkg/booking/hall' })
}

// 查看协议
const toAgreement = (type) => {
  if (type === 'service') {
    uni.navigateTo({ url: '/subpkg/common/service-agreement' })
  } else {
    uni.navigateTo({ url: '/subpkg/common/refund-policy' })
  }
}

// 加载教练详情
const loadCoachDetail = async (coachId) => {
  try {
    const res = await getCoachDetail({ id: coachId })
    if (res.data) {
      const coachData = res.data
      const mainPhoto = coachData.photos?.find(p => p.isMain) || coachData.photos?.[0]
      const avatar = coachData.avatar || mainPhoto?.photoUrl || '/static/default-avatar.png'
      orderData.value.coachInfo = {
        ...orderData.value.coachInfo,
        ...coachData,
        avatar,
      }
    }
  } catch (error) {
    logger.error('加载教练详情失败:', error)
  }
}

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

// ===== 生命周期 =====
onLoad(() => {
  guardReviewEntry()
})

onMounted(async () => {
  await loadAreaTree()
  await getCurrentLocation()

  try {
    const createdOrder = bookingStore.createdOrder

    if (createdOrder && Object.keys(createdOrder).length > 0) {
      orderData.value = createdOrder
      if (createdOrder.serviceType !== undefined) {
        serviceType.value = createdOrder.serviceType
      } else if (createdOrder.hallInfo) {
        serviceType.value = 1
      }
      bookingStore.setCreatedOrder(null)

      isOrderCreated.value = !!(createdOrder.orderId || createdOrder.orderNo)

      if (isOrderCreated.value) {
        startCountdown()
        await loadWalletBalance()
        await loadPayChannels()
      }

      if (orderData.value.coachInfo?.id) {
        loadCoachDetail(orderData.value.coachInfo.id)
      }
    } else {
      logger.error('订单数据为空')
      uni.showToast({ title: '订单数据缺失，请重新下单', icon: 'none', duration: 2000 })
      setTimeout(() => { uni.reLaunch({ url: '/pages/coach/list' }) }, 2000)
    }
  } catch (error) {
    logger.error('获取订单数据失败:', error)
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

.order-content {
  flex: 1;
  width: 100%;
  padding-bottom: 220rpx;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 通用卡片（订单信息用） */
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
  .value {
    color: var(--text-primary);
    font-size: 28rpx;
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

/* 底部安全区域 */
.safe-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>
