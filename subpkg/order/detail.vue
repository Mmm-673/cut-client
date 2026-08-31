<template>
  <view class="order-detail-wrapper" :class="themeClass">
    <!-- 空状态 -->
    <view class="empty-state" v-if="orderNotExist">
      <text class="empty-text">订单不存在或已删除</text>
    </view>

    <view class="page-content" v-else>
      <!-- 状态头部 -->
      <OrderStatusHeader
          :order-info="orderInfo"
          :status-text="statusText"
          :status-subtitle="statusSubtitle"
          :status-icon="statusIcon"
          :countdown-text="bookingCountdownText"
          :show-countdown="showBookingCountdown"
          :show-timer="showServiceTimer"
          :timer-text="timerDisplayText"
          :timer-remaining-text="timerRemainingText"
          @report="showReportPopup = true"
      />

      <!-- 服务信息 -->
      <OrderServiceInfo
          :order-info="orderInfo"
          :service-type-name="serviceTypeName"
          :format-date-time="formatDateTime"
          :format-duration="formatDuration"
      />

      <!-- 教练信息 -->
      <OrderCoachCard
          v-if="orderInfo.coachInfo"
          :coach-info="orderInfo.coachInfo"
          :order-status="orderInfo.status"
          :show-contact="canShowContact"
          @click="goToCoachDetail"
          @contact="contactCoach"
      />

      <!-- 球厅信息 -->
      <OrderHallCard
          v-if="showHallCard"
          :hall-info="hallInfo"
          @navigate="openHallNavigate"
      />

      <!-- 费用明细 -->
      <OrderFeeDetail
          v-if="orderInfo.serviceAmount !== undefined"
          :order-info="orderInfo"
          :service-type-name="serviceTypeName"
          :quantity-text="feeQuantityText"
      />

      <!-- 底部安全区域 -->
      <view class="safe-area-bottom"></view>
    </view>

    <!-- 底部操作栏 -->
    <OrderActionBar
        v-if="!orderNotExist && showBottomBar"
        :order-status="orderInfo.status"
        :is-fixed-order="isFixedOrder"
        :show-reward-btn="showRewardBtn"
        @cancel="cancelOrderFunc"
        @pay="openPayPopup"
        @contact="contactCoach"
        @add-time="showAddTimePopup = true"
        @reward="goToReward"
        @review="goToReview"
        @rebook="bookAgain"
        @delete="showDeleteConfirm = true"
    />

    <!-- 加钟弹窗 -->
    <OrderAddTimePopup
        v-model:visible="showAddTimePopup"
        :order-id="orderId"
        :is-adding="isAddingTime"
        @confirm="confirmAddTime"
    />

    <!-- 支付弹窗 -->
    <OrderPayPopup
        v-model:visible="showPayPopup"
        :pay-list="payList"
        v-model:selected-pay="selectedPay"
        :pay-amount="currentPayAmount"
        :countdown-text="payCountdownText"
        :show-countdown="showPayCountdown"
        :is-paying="isPaying"
        @confirm-pay="confirmPay"
    />

    <!-- 异常报告弹窗 -->
    <OrderReportPopup
        v-model:visible="showReportPopup"
        :order-id="orderId"
        @submit="onReportSubmit"
    />

    <!-- 删除确认弹窗 -->
    <OrderDeletePopup
        v-model:visible="showDeleteConfirm"
        @confirm="handleDeleteOrder"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useThemeStore } from '@/store'
import { formatDateTime, formatDuration, formatAmount } from '@/utils/format'
import { isFixedPricing } from '@/utils/pricing'
import { fetchEnabledChannels } from '@/utils/payment'
import { openMapNavigation } from '@/utils/platform'
import { showCallPermissionModal, requestCallPermission, doCallPhone } from '@/utils/call'
import { getRewardSwitch } from '@/api/billiard/user'
import { getCoachDetail } from '@/api/billiard/coach'
import { cancelOrder, deleteOrder } from '@/api/billiard/order'
import { getTimerStatus } from '@/api/billiard/timer'
import { guardReviewEntry } from '@/utils/review'
import { logger } from '@/utils/logger'

// 组件
import OrderStatusHeader from '@/components/order/OrderStatusHeader.vue'
import OrderServiceInfo from '@/components/order/OrderServiceInfo.vue'
import OrderCoachCard from '@/components/order/OrderCoachCard.vue'
import OrderHallCard from '@/components/order/OrderHallCard.vue'
import OrderFeeDetail from '@/components/order/OrderFeeDetail.vue'
import OrderActionBar from '@/components/order/OrderActionBar.vue'
import OrderAddTimePopup from '@/components/order/OrderAddTimePopup.vue'
import OrderPayPopup from '@/components/order/OrderPayPopup.vue'
import OrderReportPopup from '@/components/order/OrderReportPopup.vue'
import OrderDeletePopup from '@/components/order/OrderDeletePopup.vue'

// composables
import { useOrderDetail } from '@/composables/useOrderDetail'
import { useOrderPolling } from '@/composables/useOrderPolling'
import { useCountdown } from '@/composables/useCountdown'
import { useAddTime } from '@/composables/useAddTime'

// 主题
const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 基础状态
const orderId = ref(null)
const showRewardBtn = ref(false)
const showBottomBar = ref(true)

// 弹窗状态
const showPayPopup = ref(false)
const showAddTimePopup = ref(false)
const showReportPopup = ref(false)
const showDeleteConfirm = ref(false)
const selectedPay = ref('')
const isPaying = ref(false)
const payList = ref([])

// ===== 订单详情 =====
const {
  orderInfo,
  orderNotExist,
  isRequesting,
  statusText,
  statusSubtitle,
  statusIcon,
  serviceTypeName,
  isFinalStatus,
  canCancelOrder,
  loadDetail,
  onRefresh,
} = useOrderDetail({ orderId })

// 是否固定价
const isFixedOrder = computed(() => isFixedPricing(orderInfo.value?.pricingMode))

// 显示底部操作栏
const showActionBar = computed(() => !orderNotExist.value && showBottomBar.value)

// ===== 倒计时 =====
const bookingCountdownExpire = computed(() => orderInfo.value?.bookingTime || 0)
const showBookingCountdown = computed(() => orderInfo.value?.status === 30 && bookingCountdownExpire.value > Date.now())

const {
  countdownText: bookingCountdownText,
  start: startBookingCountdown,
} = useCountdown(bookingCountdownExpire, {
  onExpire: () => {
    loadDetail(true)
  }
})

// ===== 服务计时 =====
const showServiceTimer = computed(() => orderInfo.value?.status === 40)

const timerDisplayText = computed(() => {
  const elapsed = orderInfo.value?.timerInfo?.elapsedSeconds || 0
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const timerRemainingText = computed(() => {
  if (isFixedOrder.value) return ''
  const remaining = orderInfo.value?.timerInfo?.remainingSeconds || 0
  if (remaining <= 0) return '即将结束'
  const h = Math.floor(remaining / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = remaining % 60
  return `剩余 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

// ===== 轮询 =====
const {
  startPolling,
  stopPolling,
  startTimerPolling,
  stopTimerPolling,
} = useOrderPolling({
  orderId,
  orderStatus: computed(() => orderInfo.value?.status),
  isFixedOrder,
  onStatusChange: () => {
    loadDetail(true)
  },
  onTimerUpdate: (timerData) => {
    orderInfo.value = { ...orderInfo.value, timerInfo: timerData }
  },
  loadDetail,
  loadTimerStatus: async () => {
    try {
      const res = await getTimerStatus({ orderId: orderId.value })
      if (res.code === 0 && res.data) {
        return res.data
      }
      return null
    } catch (e) {
      logger.error('加载计时状态失败:', e)
      return null
    }
  },
})

// ===== 加钟 =====
const {
  isAddingTime,
  confirmAddTime,
} = useAddTime({
  orderId,
  orderStatus: computed(() => orderInfo.value?.status),
  onSuccess: () => {
    showAddTimePopup.value = false
    loadDetail(true)
  },
})

// ===== 支付 =====
const currentPayAmount = computed(() => {
  return orderInfo.value?.payAmount || 0
})

const payCountdownText = ref('')
const showPayCountdown = ref(false)

const openPayPopup = async () => {
  try {
    const channels = await fetchEnabledChannels(10)
    payList.value = channels
    if (channels.length > 0 && !selectedPay.value) {
      selectedPay.value = channels[0].value
    }
    showPayPopup.value = true
  } catch (error) {
    logger.error('加载支付方式失败:', error)
    uni.showToast({ title: '加载支付方式失败', icon: 'none' })
  }
}

const confirmPay = async () => {
  // 由 useAddTime 或页面逻辑处理，这里先简单跳回
  uni.showToast({ title: '支付功能开发中', icon: 'none' })
}

// ===== 费用明细数量文案 =====
const feeQuantityText = computed(() => {
  if (isFixedOrder.value) return 'x1次'
  const qty = orderInfo.value?.quantity || 1
  return `x${qty}小时`
})

// ===== 球厅信息 =====
const showHallCard = computed(() => {
  const info = orderInfo.value
  return info?.venueName || info?.hallInfo?.name
})

const hallInfo = computed(() => {
  const info = orderInfo.value
  return {
    name: info?.hallInfo?.name || info?.venueName || '',
    address: info?.hallInfo?.address || info?.venueAddress || '',
    photoUrl: info?.hallInfo?.photoUrl || info?.venuePhotoUrl || '',
    longitude: info?.hallInfo?.longitude ?? info?.venueLongitude,
    latitude: info?.hallInfo?.latitude ?? info?.venueLatitude,
  }
})

// 是否显示联系教练按钮
const canShowContact = computed(() => {
  const status = orderInfo.value?.status
  return status === 30 || status === 40 || status === 50 || status === 60
})

// ===== 操作方法 =====

// 取消订单
const cancelOrderFunc = () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await cancelOrder(orderId.value)
          uni.showToast({ title: '取消成功', icon: 'success' })
          loadDetail(true)
        } catch (error) {
          uni.showToast({ title: error?.message || '取消失败', icon: 'none' })
        }
      }
    }
  })
}

// 联系教练
const contactCoach = async () => {
  const phone = orderInfo.value?.coachInfo?.mobile || orderInfo.value?.coachInfo?.phone
  if (!phone) {
    uni.showToast({ title: '暂无联系方式', icon: 'none' })
    return
  }
  try {
    await showCallPermissionModal()
    await requestCallPermission()
    doCallPhone(phone)
  } catch (e) {
    logger.error('联系教练失败:', e)
  }
}

// 跳转到教练详情
const goToCoachDetail = () => {
  const coachId = orderInfo.value?.coachInfo?.id
  if (coachId) {
    uni.navigateTo({ url: `/subpkg/coach/detail?id=${coachId}` })
  }
}

// 导航到球厅
const openHallNavigate = () => {
  const info = hallInfo.value
  if (info.longitude != null && info.latitude != null && info.name) {
    openMapNavigation({
      latitude: info.latitude,
      longitude: info.longitude,
      name: info.name,
      address: info.address,
    })
  }
}

// 去评价
const goToReview = () => {
  uni.navigateTo({ url: `/subpkg/coach/evaluate?orderId=${orderId.value}` })
}

// 去打赏
const goToReward = () => {
  const coachId = orderInfo.value?.coachInfo?.id
  uni.navigateTo({ url: `/subpkg/coach/reward?orderId=${orderId.value}&coachId=${coachId}` })
}

// 再来一单
const bookAgain = () => {
  uni.switchTab({ url: '/pages/coach/list' })
}

// 删除订单
const handleDeleteOrder = async () => {
  try {
    await deleteOrder(orderId.value)
    uni.showToast({ title: '删除成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    uni.showToast({ title: error?.message || '删除失败', icon: 'none' })
  }
}

// 举报提交成功回调
const onReportSubmit = () => {
  showReportPopup.value = false
  uni.showToast({ title: '提交成功', icon: 'success' })
}

// 加载打赏开关
const loadCountdownEnabled = async () => {
  try {
    const res = await getRewardSwitch()
    showRewardBtn.value = res.data === true || res.data === 1
  } catch (e) {
    showRewardBtn.value = false
  }
}

// 加载教练详情（补充头像等信息）
const loadCoachDetail = async (coachId) => {
  try {
    const res = await getCoachDetail({ id: coachId })
    if (res.data) {
      const coachData = res.data
      const mainPhoto = coachData.photos?.find(p => p.isMain) || coachData.photos?.[0]
      const avatar = coachData.avatar || mainPhoto?.photoUrl || ''
      orderInfo.value = {
        ...orderInfo.value,
        coachInfo: {
          ...orderInfo.value.coachInfo,
          ...coachData,
          avatar,
        }
      }
    }
  } catch (error) {
    logger.error('加载教练详情失败:', error)
  }
}

// ===== 生命周期 =====
onLoad((options) => {
  if (guardReviewEntry()) return
  orderId.value = options.id
})

onMounted(async () => {
  await loadDetail()
  await loadCountdownEnabled()

  const coachId = orderInfo.value?.coachInfo?.id
  if (coachId) {
    loadCoachDetail(coachId)
  }

  if (!isFinalStatus.value) {
    startPolling()
  }
  if (orderInfo.value?.status === 30) {
    startBookingCountdown()
  }
  if (orderInfo.value?.status === 40) {
    startTimerPolling()
  }
})

onShow(() => {
  if (orderId.value && !isFinalStatus.value) {
    loadDetail(true)
    startPolling()
  }
})
</script>

<style lang="scss" scoped>
.order-detail-wrapper {
  min-height: 100vh;
  background: var(--bg-page);
  position: relative;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  .empty-text {
    color: var(--text-secondary);
    font-size: 28rpx;
  }
}

.page-content {
  padding-bottom: 200rpx;
  min-height: 100vh;
  box-sizing: border-box;
}

.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}
</style>
