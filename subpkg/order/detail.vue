<template>
  <view class="order-detail-wrapper" :class="themeClass">
    <!-- 订单不存在空状态 -->
    <view v-if="orderNotExist" class="empty-state">
      <uni-icons type="info" size="120" color="#9CA3AF"></uni-icons>
      <text class="empty-text">订单不存在或已删除</text>
      <button class="back-btn" @click="goBack">返回</button>
    </view>

    <view v-else class="page-content">
      <!-- 顶部状态卡片 -->
      <order-status-header
          :status="orderInfo.status"
          :status-text="orderInfo.statusText"
          :status-subtitle="getStatusSubtitle(orderInfo.status)"
          :status-icon="getStatusIcon(orderInfo.status)"
          :order-no="orderInfo.orderNo"
          :show-report="orderInfo.status !== ORDER_STATUS.PENDING_PAYMENT"
          :show-countdown="orderInfo.status === ORDER_STATUS.ACCEPTED"
          :show-service-timer="orderInfo.status === ORDER_STATUS.IN_SERVICE"
          :is-fixed="isFixedOrder"
          :countdown-hours="countdownHours"
          :countdown-minutes="countdownMinutes"
          :countdown-seconds="countdownSeconds"
          :elapsed-seconds="timerInfo.elapsedSeconds"
          :remaining-seconds="timerInfo.remainingSeconds"
          @report="showReportPopup = true"
      />

      <!-- 订单信息卡片 -->
      <info-card title="订单信息" title-icon="🖥">
        <view class="info-row">
          <text class="label">服务时间</text>
          <text class="value">{{ orderInfo.serviceTime }}</text>
        </view>

        <view class="info-row" v-if="!isFixedOrder">
          <text class="label">服务时长</text>
          <text class="value">{{ orderInfo.serviceDuration }}分钟</text>
        </view>

        <view class="info-row">
          <text class="label">服务类型</text>
          <text class="value">{{ getServiceTypeName(orderInfo.serviceType) }}</text>
        </view>

        <view class="info-row">
          <text class="label">下单时间</text>
          <text class="value">{{ orderInfo.createTime }}</text>
        </view>

        <view class="info-row" v-if="orderInfo.payMethod">
          <text class="label">支付方式</text>
          <text class="value">{{ orderInfo.payMethod }}</text>
        </view>

        <view class="info-row">
          <text class="label">订单金额</text>
          <text class="value price">¥{{ formatAmount(orderInfo.totalAmount) }}</text>
        </view>

        <view class="info-row" v-if="orderInfo.payAmount > 0">
          <text class="label">实际支付</text>
          <text class="value price">¥{{ formatAmount(orderInfo.payAmount) }}</text>
        </view>

        <view class="info-row" v-if="!isFixedOrder && orderInfo.extraPayAmount > 0">
          <text class="label">加钟支付</text>
          <text class="value price">¥{{ formatAmount(orderInfo.extraPayAmount) }}</text>
        </view>
      </info-card>

      <!-- 陪练教练卡片 -->
      <info-card title="裁教教练" title-icon="👤" card-class="coach-card">
        <view class="coach-info">
          <image class="coach-avatar" :src="orderInfo.coachAvatar || orderInfo.coachMainPhoto" mode="aspectFill"></image>
          <view class="coach-info-right">
            <view class="coach-name-row">
              <text class="coach-name">{{ orderInfo.coachStageName }}</text>
              <view class="coach-tag" :style="{ backgroundColor: levelMap[coachInfo.level] ? levelMap[coachInfo.level].color + '20' : 'rgba(0, 187, 136, 0.2)', color: levelMap[coachInfo.level]?.color || '#00BB88' }">
                {{ levelMap[coachInfo.level]?.text || '初级教练' }}
              </view>
            </view>
            <view class="coach-stats">
              <view class="stat-item">
                <uni-icons type="star-filled" size="14" color="#FFB800" />
                <text>{{ coachInfo.overallScore ? coachInfo.overallScore.toFixed(1) : '暂无' }}</text>
              </view>
              <view class="stat-item">
                <uni-icons type="checkbox" size="14" color="#9CA3AF" />
                <text>{{ coachInfo.serviceCount ? `已完成${coachInfo.serviceCount}单` : '暂无数据' }}</text>
              </view>
            </view>
            <view class="coach-tags" v-if="coachInfo.tags && coachInfo.tags.length > 0">
              <text class="tag" v-for="(tag, index) in coachInfo.tags" :key="index">{{ tag }}</text>
            </view>
          </view>
        </view>
      </info-card>

      <!-- 服务地点卡片 -->
      <info-card card-class="hall-card" v-if="orderInfo.venueName">
        <template #title>
          <view class="card-title-row">
            <view class="card-title">
              <text class="title-icon">📍</text>
              {{ orderInfo.serviceType === SERVICE_TYPE.BILLIARD_COACH ? '球厅信息' : '服务地点' }}
            </view>
            <view>
              <button class="nav-btn" @click="openHallNavigate" v-if="orderInfo.venueLongitude && orderInfo.venueLatitude">
                <uni-icons type="navigation" size="16" color="#fff" />
                导航
              </button>
            </view>
          </view>
        </template>

        <text class="hall-name">{{ orderInfo.venueName }}</text>
        <view class="hall-address" v-if="orderInfo.venueAddress">
          <uni-icons type="location" size="18" color="#9CA3AF" />
          <text>{{ orderInfo.venueAddress }}</text>
        </view>
        <image class="hall-img" :src="orderInfo.venuePhotoUrl" mode="aspectFill" />
      </info-card>
    </view>

    <!-- 底部安全区域 -->
    <view class="safe-area-bottom"></view>

    <!-- 底部操作栏 -->
    <order-bottom-bar
        :status="orderInfo.status"
        :is-fixed-order="isFixedOrder"
        :show-reward="showRewardBtn"
        @cancel="cancelOrderFunc"
        @pay="payOrder"
        @contact="contactCoach"
        @add-time="addTime"
        @reward="goToReward"
        @review="goToReview"
        @book-again="bookAgain"
        @delete="showDeleteConfirm = true"
    />

    <!-- 加钟弹窗 -->
    <add-time-popup
        :visible="showAddTimePopup"
        :options="addTimeOptions"
        :loading="isAddingTime"
        @close="closeAddTimePopup"
        @confirm="confirmAddTime"
    />


    <!-- 支付弹窗 -->
    <pay-method-popup
        :visible="showPayPopup"
        :amount="currentPayAmount"
        :pay-list="payList"
        :selected-value="selectedPay"
        :loading="isPaying"
        :show-countdown="!!(addTimePayOrderId && !isAddTimeExpired && addTimeCountdownText)"
        :countdown-text="addTimeCountdownText"
        :is-expired="!!(addTimePayOrderId && isAddTimeExpired)"
        :expired-text="'该订单已过期，请重新发起加钟请求'"
        :submit-text="isPaying ? '支付中...' : (addTimePayOrderId && isAddTimeExpired ? '已过期' : '确认支付')"
        @close="closePayPopup"
        @select="selectPay"
        @submit="confirmPay"
    />

    <!-- 异常报告弹窗 -->
    <report-popup
      :visible="showReportPopup"
      :loading="isReporting"
      @close="showReportPopup = false"
      @confirm="handleReport"
    />

    <!-- 删除确认弹窗 -->
    <view class="delete-popup-mask" v-if="showDeleteConfirm" @click="showDeleteConfirm = false">
      <view class="delete-popup-wrapper" @click.stop>
        <view class="delete-popup-content">
          <view class="delete-popup-title">确认删除</view>
          <view class="delete-popup-text">确定要删除这个订单吗？删除后无法恢复。</view>
          <view class="delete-popup-buttons">
            <button class="delete-popup-btn cancel" @click="showDeleteConfirm = false">取消</button>
            <button class="delete-popup-btn confirm" @click="handleDeleteOrder">确认删除</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow } from "@dcloudio/uni-app"
import { useThemeStore } from '@/store'
import { ORDER_STATUS, isFinalStatus, getStatusText, getStatusColor } from '@/constants/orderStatus'

// 主题相关
const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)
import { getOrderDetail, cancelOrder, addTimeOrder, deleteOrder } from '@/api/billiard/order'
import { isFixedPricing } from '@/utils/pricing'
import { getCoachDetail } from '@/api/billiard/coach'
import { SERVICE_TYPE, getServiceTypeName } from '@/constants/serviceType'
import { getRewardSwitch } from '@/api/billiard/user'
import { getTimerStatus } from '@/api/billiard/timer'
import { reportException } from '@/api/billiard/exception'
import { executePayment, fetchEnabledChannels } from '@/utils/payment'
import {openMapNavigation} from "../../utils/platform"
import { showCallPermissionModal, requestCallPermission, doCallPhone } from '@/utils/call'
import { guardReviewEntry } from '@/utils/review'
import { formatAmount, formatDateTime } from '@/utils/format'
import OrderStatusHeader from '@/components/order-status-header/order-status-header.vue'
import InfoCard from '@/components/info-card/info-card.vue'
import OrderBottomBar from '@/components/order-bottom-bar/order-bottom-bar.vue'
import AddTimePopup from '@/components/add-time-popup/add-time-popup.vue'
import PayMethodPopup from '@/components/pay-method-popup/pay-method-popup.vue'
import ReportPopup from '@/components/report-popup/report-popup.vue'

// 订单ID
const orderId = ref(null)
// 加载状态
const loading = ref(false)
// 订单不存在状态
const orderNotExist = ref(false)
// 是否显示按钮
const showRewardBtn = ref(false)
// 缓存的球厅图片（避免轮询时随机变化）
let cachedVenuePhotoUrl = null
// 请求锁，防止重复请求
let isRequesting = false
// 支付弹窗显示状态
const showPayPopup = ref(false)
// 选中的支付渠道编码
const selectedPay = ref('')
// 支付中状态
const isPaying = ref(false)
// 创建订单时保存的支付订单ID
const payOrderId = ref(null)
// 当前订单ID（用于支付）
const currentOrderId = ref(null)
// 加钟弹窗显示状态
const showAddTimePopup = ref(false)
// 选中的加钟时长（分钟）
const selectedAddMinutes = ref(120)
// 是否显示自定义输入
const showCustomInput = ref(false)
// 自定义分钟数
const customMinutes = ref('')
// 加钟中的状态
const isAddingTime = ref(false)
// 加钟支付订单ID
const addTimePayOrderId = ref(null)

// 删除订单弹窗
const showDeleteConfirm = ref(false)

// 计时器相关
const timerInfo = ref({
  elapsedSeconds: 0,
  remainingSeconds: 0,
  status: ''
})
let timerPollingInterval = null
let localTimerInterval = null

// 异常报告相关
const showReportPopup = ref(false)
const isReporting = ref(false)

// 加钟时长选项（单位：分钟）
const addTimeOptions = ref([
  { label: '10分钟', value: 10 },
  { label: '30分钟', value: 30 },
  { label: '60分钟', value: 60 },
  { label: '自定义', value: 'custom' }
])
// 【新增】倒计时相关
let countdownTimer = null
const countdownHours = ref('00')
const countdownMinutes = ref('00')
const countdownSeconds = ref('00')

// 支付方式列表（从后端获取）
const payList = ref([])
const selectedPayItem = computed(() => {
  return payList.value.find(item => item.value === selectedPay.value) || null
})
const currentPayOrderId = computed(() => addTimePayOrderId.value || payOrderId.value)
const pendingAddTimeMinutes = ref(0)
const pendingAddTimeAmount = ref(0) // 后端返回的加钟金额（分）
const addTimeExpireTime = ref(0) // 后端返回的加钟支付过期时间（毫秒）
const addTimeCountdownText = ref('') // 倒计时显示文本
let addTimeCountdownTimer = null // 倒计时定时器

const isAddTimeExpired = computed(() => {
  if (!addTimeExpireTime.value) return false
  return Date.now() > addTimeExpireTime.value
})
const currentPayAmount = computed(() => {
  if (addTimePayOrderId.value) {
    return pendingAddTimeAmount.value
  }
  return orderInfo.value.payAmount || orderInfo.value.totalAmount || 0
})

// 是否显示底部操作栏
const showBottomBar = computed(() => {
  return [10, 20, 30, 40, 50, 60].includes(orderInfo.value.status)
})

/**
 * 订单信息 - 根据API文档定义完整字段
 */
const orderInfo = ref({
  id: null,
  orderNo: '',
  coachId: null,
  coachStageName: '',
  coachAvatar: '',
  coachMainPhoto: '',
  venueName: '',
  venueAddress: '',
  venueLongitude: null,
  venueLatitude: null,
  venuePhotoUrl: '',
  serviceType: SERVICE_TYPE.BILLIARD_COACH,
  pricingMode: 1, // 1=小时价 2=固定价
  bookingTime: 0,
  serviceDuration: 0,
  status: 0,
  payAmount: 0,
  extraPayAmount: 0,
  totalAmount: 0,
  createTime: 0,
  payStatus: PAY_STATUS.UNPAID,
  payMethod: '', // 支付方式名称
  statusText: '',
  serviceTime: ''
})

// 是否为固定价订单
const isFixedOrder = computed(() => isFixedPricing(orderInfo.value.pricingMode))

// 裁教详情信息
const coachInfo = ref({
  id: null,
  stageName: '',
  level: 0,
  serviceCount: 0,
  overallScore: 0,
  hourlyPrice: 0,
  tags: []
})

// 裁教等级映射
const levelMap = {
  0: { text: '初级教练', color: '#9CA3AF' },
  1: { text: '中级教练', color: '#F59E0B' },
  2: { text: '高级教练', color: '#00BB88' },
  3: { text: '星级教练', color: '#FFD700' }
}

/**
 * 状态映射 - 根据API文档
 */
const statusMap = {
  10: { text: '待付款' },
  20: { text: '待接单' },
  30: { text: '已接单' },
  40: { text: '进行中' },
  50: { text: '待评价' },
  60: { text: '已完成' },
  70: { text: '已取消' },
  80: { text: '退款中' }
}

const CANCELLABLE_ORDER_STATUSES = [10, 20, 30]
const canCancelOrder = (status) => CANCELLABLE_ORDER_STATUSES.includes(Number(status))

// 获取状态图标
const getStatusIcon = (status) => {
  const iconMap = {
    10: '💳',
    20: '📋',
    30: '✅',
    40: '🏃',
    50: '⭐',
    60: '🎉',
    70: '❌',
    80: '💰'
  }
  return iconMap[status] || '📋'
}

// 获取状态副标题
const getStatusSubtitle = (status) => {
  const subtitleMap = {
    10: '请尽快完成支付',
    20: '等待教练确认接单',
    30: '教练已接单，请按时到达',
    40: '服务进行中',
    50: '服务已完成，期待您的评价',
    60: '感谢您的使用',
    70: '订单已取消',
    80: '退款处理中'
  }
  return subtitleMap[status] || ''
}


// 【新增】倒计时逻辑
const startCountdown = () => {
  // 先停止之前的倒计时
  stopCountdown()

  // 如果没有预约时间，不开始倒计时
  if (!orderInfo.value.bookingTime) {
    return
  }

  const updateCountdown = () => {
    const now = Date.now()
    const bookingTime = orderInfo.value.bookingTime
    let totalSeconds = Math.max(0, Math.floor((bookingTime - now) / 1000))

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    countdownHours.value = String(hours).padStart(2, '0')
    countdownMinutes.value = String(minutes).padStart(2, '0')
    countdownSeconds.value = String(seconds).padStart(2, '0')

    // 如果倒计时结束，停止定时器
    if (totalSeconds <= 0) {
      stopCountdown()
      // 可以选择自动刷新订单状态
      loadOrderDetail(true)
    }
  }

  // 立即执行一次
  updateCountdown()

  // 开始定时器
  countdownTimer = setInterval(updateCountdown, 1000)
}

// 【新增】停止倒计时
const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 加载支付渠道列表
const loadPayChannels = async () => {
  try {
    const channels = await fetchEnabledChannels(10)
    payList.value = channels
    if (!channels.some(item => item.value === selectedPay.value)) {
      selectedPay.value = channels[0]?.value || ''
    }
  } catch (error) {
    console.error('加载支付渠道失败:', error)
    payList.value = []
    selectedPay.value = ''
  }
}

// 选择支付方式
const selectPay = (val) => {
  selectedPay.value = val
}

// 打开球厅导航
const openHallNavigate = () => {
  if (!orderInfo.value.venueAddress) {
    uni.showToast({ title: '球厅地址不存在', icon: 'none' })
    return
  }
  const params = {
    name: orderInfo.value.venueName,
    address: orderInfo.value.venueAddress
  }
  if (orderInfo.value.venueLongitude && orderInfo.value.venueLatitude) {
    params.longitude = orderInfo.value.venueLongitude
    params.latitude = orderInfo.value.venueLatitude
  }

  openMapNavigation({
    latitude: params.latitude,
    longitude: params.longitude,
    name: params.name,
    address: params.address,
    mode: 'driving'
  })
}

// 【新增】联系教练
const contactCoach = async () => {
  try {
    // #ifdef APP-PLUS
    const systemInfo = uni.getSystemInfoSync()
    if (systemInfo.platform !== 'ios') {
      // 显示电话权限用途说明弹窗
      await showCallPermissionModal()
      // 请求系统拨号权限
      await requestCallPermission()
    }
    // #endif


    // 优先使用订单数据里的教练手机号
    const phone = orderInfo.value?.coachPhone || ''

    if (!phone) {
      uni.showToast({ title: '暂无联系电话', icon: 'none' })
      return
    }

    doCallPhone(phone)
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

// 加载裁教详情
const loadCoachDetail = async (coachId) => {
  if (!coachId) return
  try {
    const res = await getCoachDetail({ id: coachId })
    const data = res.data || {}
    Object.assign(coachInfo.value, {
      id: data.id,
      stageName: data.stageName,
      level: data.level,
      serviceCount: data.serviceCount,
      overallScore: data.overallScore,
      hourlyPrice: data.hourlyPrice || data.price || 0,
      tags: data.tags ? data.tags.split(',').filter(tag => tag.trim()) : []
    })
  } catch (error) {
    console.error('加载裁教详情失败:', error)
  }
}

// 加载是否显示按钮
const loadCountdownEnabled = async () => {
  try {
    const res = await getRewardSwitch()
    showRewardBtn.value = res.data === true
  } catch (error) {
    console.error('加载按钮状态失败:', error)
    showRewardBtn.value = false
  }
}

// 加载订单详情
const loadOrderDetail = async (silent = false) => {
  if (!orderId.value) return
  // 如果正在请求中，直接返回，防止重复请求
  if (isRequesting) return

  isRequesting = true
  if (!silent) {
    loading.value = true
  }
  try {
    const res = await getOrderDetail({ id: orderId.value })
    const data = res.data || {}

    // 如果没有数据，认为订单不存在
    if (!data || !data.id) {
      orderNotExist.value = true
      return
    }

    // 订单存在，重置状态
    orderNotExist.value = false

    // 更新订单信息 - 完全按API文档字段处理
    // 处理球厅图片：优先用后端返回的，其次用缓存的，最后才随机获取一次
    let venuePhotoUrl = data.venuePhotoUrl
    if (!venuePhotoUrl) {
      if (!cachedVenuePhotoUrl) {
        cachedVenuePhotoUrl = getRandomDefaultImage()
      }
      venuePhotoUrl = cachedVenuePhotoUrl
    } else {
      // 后端返回了真实图片，更新缓存
      cachedVenuePhotoUrl = venuePhotoUrl
    }

    Object.assign(orderInfo.value, {
      id: data.id,
      orderNo: data.orderNo,
      coachId: data.coachId,
      coachAvatar: data.coachAvatar,
      coachStageName: data.coachStageName,
      coachMainPhoto: data.coachMainPhoto,
      coachPhone: data.coachPhone, // 教练手机号
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      venueLongitude: data.venueLongitude,
      venueLatitude: data.venueLatitude,
      venuePhotoUrl: venuePhotoUrl,
      serviceType: data.serviceType,
      pricingMode: data.pricingMode ?? 1, // 计价模式：1=小时价 2=固定价，默认兜底 1
      bookingTime: data.bookingTime,
      serviceDuration: data.serviceDuration,
      status: data.status,
      payAmount: data.payAmount,
      extraPayAmount: data.extraPayAmount,
      totalAmount: data.totalAmount,
      payStatus: data.payStatus,
      payMethod: data.payMethod || data.payChannelName || '',
      statusText: statusMap[data.status]?.text || '未知',
      serviceTime: formatDateTime(data.bookingTime),
      createTime: formatDateTime(data.createTime)
    })

    // 加载裁教详情
    if (data.coachId) {
      loadCoachDetail(data.coachId)
    }

    // 保存支付订单ID和订单ID
    if (data.payOrderId) {
      payOrderId.value = data.payOrderId
    }
    if (data.id) {
      currentOrderId.value = data.id
    }

    // 待开始状态启动倒计时
    if (data.status === ORDER_STATUS.ACCEPTED) {
      startCountdown()
      stopTimerPolling()
    } else if (data.status === ORDER_STATUS.IN_SERVICE) {
      // 进行中状态启动计时轮询
      stopCountdown()
      startTimerPolling()
    } else {
      stopCountdown()
      stopTimerPolling()
    }

    // 终态停止轮训
    if (isFinalStatus(data.status)) {
      stopPolling()
    } else if (lastStatus !== null && lastStatus !== data.status) {
      // 状态改变时，先停止旧轮询再重新启动新轮询
      stopPolling()
      startPolling()
    }
    lastStatus = data.status
  } catch (error) {
    if (!silent) {
      console.error('加载订单详情失败:', error)
      // 判断是否是订单不存在的错误
      if (error.message && (error.message.includes('不存在') || error.message.includes('not found') || error.code === 404)) {
        orderNotExist.value = true
      } else {
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    }
  } finally {
    if (!silent) {
      loading.value = false
    }
    isRequesting = false
  }
}

// 下拉刷新
const onRefresh = () => {
  loadOrderDetail()
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}


// 取消订单
const cancelOrderFunc = async () => {
  if (!canCancelOrder(orderInfo.value.status)) {
    uni.showToast({ title: '当前状态不可取消', icon: 'none' })
    return
  }

  uni.showModal({
    title: '提示',
    content: '确定要取消这个订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await cancelOrder({ orderId: orderId.value })
          uni.showToast({ title: '订单已取消', icon: 'success' })
          stopCountdown()
          stopTimerPolling()
          setTimeout(() => {
            loadOrderDetail()
          }, 1500)
        } catch (error) {
          console.error('取消订单失败:', error)
        }
      }
    }
  })
}

// 去支付
const payOrder = async () => {
  if (!payOrderId.value) {
    uni.showToast({ title: '支付订单信息缺失', icon: 'none' })
    return
  }
  if (payList.value.length === 0) {
    await loadPayChannels()
  }
  if (payList.value.length === 0) {
    uni.showToast({ title: '暂无可用支付方式', icon: 'none' })
    return
  }
  showPayPopup.value = true
}

// 确认支付
const confirmPay = async () => {
  const payChannel = selectedPayItem.value

  if (!currentPayOrderId.value || !currentOrderId.value) {
    uni.showToast({ title: '支付订单信息缺失', icon: 'none' })
    return
  }

  if (!payChannel) {
    uni.showToast({ title: '请选择支付方式', icon: 'none' })
    return
  }

  // 检查加钟支付是否已过期
  if (addTimePayOrderId.value && isAddTimeExpired.value) {
    uni.showModal({
      title: '提示',
      content: '该加钟订单已过期，请重新发起加钟请求',
      showCancel: false,
      success: () => {
        closePayPopup()
      }
    })
    return
  }

  isPaying.value = true
  try {
    await executePayment({
      payOrderId: currentPayOrderId.value,
      orderId: currentOrderId.value,
      payValue: payChannel.value,
      channelCode: payChannel.channelCode,
      onSuccess: (payResult) => {
        uni.showToast({
          title: addTimePayOrderId.value ? '加钟成功' : '支付成功',
          icon: 'success'
        })
        showPayPopup.value = false
        addTimePayOrderId.value = null
        pendingAddTimeMinutes.value = 0
        pendingAddTimeAmount.value = 0
        addTimeExpireTime.value = 0
        setTimeout(() => {
          loadOrderDetail()
        }, 1500)
      },
      onCancel: () => {
        uni.showToast({ title: '支付已取消', icon: 'none' })
      },
      onError: (error) => {
        if (!error.pending) {
          uni.showToast({
            title: error.message || '支付失败，请重试',
            icon: 'none'
          })
        }
      }
    })
  } catch (error) {
    console.error('支付失败:', error)
  } finally {
    isPaying.value = false
  }
}

// 关闭支付弹窗时清空加钟状态
const closePayPopup = () => {
  showPayPopup.value = false
  // 停止倒计时
  stopAddTimeCountdown()
  // 清空加钟相关状态
  addTimePayOrderId.value = null
  pendingAddTimeMinutes.value = 0
  pendingAddTimeAmount.value = 0
  addTimeExpireTime.value = 0
}

// 加钟 - 打开弹窗
const addTime = () => {
  showAddTimePopup.value = true
  // 设置默认值为10分钟
  const minMinutes = 10
  selectedAddMinutes.value = minMinutes // 默认选最小分钟数
  showCustomInput.value = false
  customMinutes.value = ''
}

// 关闭加钟弹窗
const closeAddTimePopup = () => {
  showAddTimePopup.value = false
  isAddingTime.value = false
  showCustomInput.value = false
  customMinutes.value = ''
  // 注意：不清空加钟业务数据（addTimePayOrderId等），因为关闭弹窗后可能还要显示支付弹窗
  // 业务数据在 closePayPopup() 或支付成功后才清空
}

// 处理选项选择
const handleOptionSelect = (option) => {
  if (option.value === 'custom') {
    showCustomInput.value = true
    // 设置自定义输入的默认值为最小值
    const minMinutes = 10
    customMinutes.value = String(minMinutes)
    selectedAddMinutes.value = minMinutes
  } else {
    showCustomInput.value = false
    selectedAddMinutes.value = option.value
  }
}

// 处理自定义输入
const handleCustomInput = () => {
  const val = parseInt(customMinutes.value)
  if (!isNaN(val)) {
    selectedAddMinutes.value = val
  }
}

// 失焦时兜底校验：低于最小值则补足
const handleCustomBlur = () => {
  const minMinutes = 10
  const val = parseInt(customMinutes.value)
  if (isNaN(val) || val < minMinutes) {
    customMinutes.value = String(minMinutes)
    selectedAddMinutes.value = minMinutes
  }
}


// 确认加钟
const confirmAddTime = async ({ minutes } = {}) => {
  if (isAddingTime.value) return

  const addMinutes = minutes ?? selectedAddMinutes.value

  // 验证时长
  const minMinutes = 10
  if (addMinutes < minMinutes) {
    uni.showToast({
      title: '最少加10分钟',
      icon: 'none'
    })
    return
  }

  isAddingTime.value = true
  try {
    // 调用加钟接口（直接使用分钟数）
    const res = await addTimeOrder({ orderId: orderId.value, addMinutes })

    // 获取加钟支付订单ID、金额和过期时间
    addTimePayOrderId.value = res.data.payOrderId
    pendingAddTimeAmount.value = res.data.addAmount
    addTimeExpireTime.value = res.data.expireTime
    pendingAddTimeMinutes.value = addMinutes // 保存分钟数
    currentOrderId.value = orderId.value

    // 关闭加钟弹窗
    closeAddTimePopup()

    // 显示支付弹窗
    showPayPopup.value = true

    // 启动倒计时
    startAddTimeCountdown()

    // 重新加载支付渠道（可选）
    await loadPayChannels()

    uni.showToast({ title: '请完成支付', icon: 'success' })
  } catch (error) {
    console.error('加钟失败:', error)
    uni.showToast({
      title: error.message || '加钟失败，请重试',
      icon: 'none'
    })
  } finally {
    isAddingTime.value = false
  }
}

// 教练
const goToReward = () => {
  // #ifdef MP-WEIXIN
  uni.showToast({
    title: '微信小程序暂不支持此功能',
    icon: 'none'
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.navigateTo({
    url: `/subpkg/coach/reward?coachId=${orderInfo.value.coachId}`
  })
  // #endif
}

// 去评价
const goToReview = () => {
  uni.navigateTo({
    url: `/subpkg/coach/evaluate?orderId=${orderInfo.value.id}&coachId=${orderInfo.value.coachId}`
  })
}

// 再约一次/返回首页
const bookAgain = () => {
  uni.switchTab({
    url: '/pages/home/index'
  })
}

// 删除订单
const handleDeleteOrder = async () => {
  try {
    await deleteOrder({ orderId: orderId.value })
    uni.showToast({ title: '订单已删除', icon: 'success' })
    showDeleteConfirm.value = false
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('删除订单失败:', error)
    uni.showToast({
      title: error.message || '删除失败，请重试',
      icon: 'none'
    })
  }
}

// 格式化秒数为 HH:MM:SS
const formatSeconds = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 更新加钟倒计时显示
const updateAddTimeCountdown = () => {
  if (!addTimeExpireTime.value) {
    addTimeCountdownText.value = ''
    return
  }

  const now = Date.now()
  const diff = Math.max(0, addTimeExpireTime.value - now)

  if (diff <= 0) {
    addTimeCountdownText.value = '已过期'
    return
  }

  const totalSeconds = Math.floor(diff / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  addTimeCountdownText.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// 启动加钟倒计时
const startAddTimeCountdown = () => {
  // 先清除之前的定时器
  if (addTimeCountdownTimer) {
    clearInterval(addTimeCountdownTimer)
    addTimeCountdownTimer = null
  }

  // 更新一次显示
  updateAddTimeCountdown()

  // 启动定时器每秒更新
  addTimeCountdownTimer = setInterval(() => {
    updateAddTimeCountdown()
  }, 1000)
}

// 停止加钟倒计时
const stopAddTimeCountdown = () => {
  if (addTimeCountdownTimer) {
    clearInterval(addTimeCountdownTimer)
    addTimeCountdownTimer = null
  }
  addTimeCountdownText.value = ''
}

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

// 加载计时状态
const loadTimerStatus = async () => {
  if (orderInfo.value.status !== ORDER_STATUS.IN_SERVICE) return
  try {
    const res = await getTimerStatus({ orderId: orderId.value })
    if (res.data) {
      timerInfo.value = res.data
      // 如果状态已结束，刷新订单详情
      if (res.data.status === 'ENDED') {
        loadOrderDetail(true)
        stopTimerPolling()
      }
    }
  } catch (error) {
    console.error('加载计时状态失败:', error)
  }
}

// 开始计时轮询
const startTimerPolling = () => {
  stopTimerPolling()
  if (orderInfo.value.status !== ORDER_STATUS.IN_SERVICE) return

  // 立即加载一次
  loadTimerStatus()

  // 10秒轮询一次服务端（放慢速度）
  timerPollingInterval = setInterval(loadTimerStatus, 10000)

  // 本地每秒递增已服务时长，用于平滑显示
  localTimerInterval = setInterval(() => {
    timerInfo.value.elapsedSeconds++
    // 小时价模式才递减剩余时间；固定价没有剩余时间概念
    if (!isFixedOrder.value && timerInfo.value.remainingSeconds > 0) {
      timerInfo.value.remainingSeconds--
    }
  }, 1000)
}

// 停止计时轮询
const stopTimerPolling = () => {
  if (timerPollingInterval) {
    clearInterval(timerPollingInterval)
    timerPollingInterval = null
  }
  if (localTimerInterval) {
    clearInterval(localTimerInterval)
    localTimerInterval = null
  }
}

// 处理异常报告
const handleReport = async ({ type, reason }) => {
  isReporting.value = true

  try {
    await reportException({
      orderId: orderId.value,
      exceptionType: type,
      reason: reason,
      evidenceUrls: []
    })

    uni.showToast({ title: '问题已提交，客服会尽快处理', icon: 'success' })
    showReportPopup.value = false
  } catch (error) {
    console.error('提交异常报告失败:', error)
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    })
  } finally {
    isReporting.value = false
  }
}

onLoad((options) => {
  // 审核模式入口守卫
  if (guardReviewEntry()) return
  if (options.id) {
    orderId.value = parseInt(options.id)
  }
})

onMounted(() => {
  // 计算滚动区域高度
  const systemInfo = uni.getSystemInfoSync()
  const windowHeight = systemInfo.windowHeight
  // 底部操作栏高度约 120rpx，转换为px
  const bottomBarHeight = 120 / 2 // rpx to px rough conversion
  // 设置 scroll-view 的高度
  const scrollHeight = windowHeight - bottomBarHeight
  // 使用 CSS 变量或者直接设置
  uni.$once('setScrollHeight', () => {
    // nothing
  })

  // 加载支付渠道
  loadPayChannels()

  // 加载是否显示按钮
  loadCountdownEnabled()

  // 加载数据并启动轮询（只在初始化时执行一次）
  if (orderId.value) {
    loadOrderDetail()
    startPolling()
  }
})

onUnmounted(() => {
  stopCountdown()
  stopPolling()
  stopTimerPolling()
  stopAddTimeCountdown()
})

onShow(() => {
  // 页面显示时只刷新一次数据，不频繁重启轮询
  if (orderId.value && !pollingTimer) {
    loadOrderDetail()
    startPolling()
  }
})

// ---------------------- 状态轮训 ----------------------
// 轮询定时器
let pollingTimer = null
const POLLING_INTERVAL = 8000 // 8秒轮询一次（放慢速度）

// 开始轮训
const startPolling = () => {
  // 如果已经是终态，不要开始轮询
  if (isFinalStatus(orderInfo.value.status)) {
    return
  }

  stopPolling() // 先停止之前的
  pollingTimer = setInterval(() => {
    if (orderId.value) {
      loadOrderDetail(true) // silent refresh
    }
  }, POLLING_INTERVAL)
}

// 停止轮训
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// isFinalStatus 从 @/constants/orderStatus 导入

// 记录上次状态
let lastStatus = null
</script>

<style lang="scss" scoped>
.order-detail-wrapper {
  min-height: 100vh;
  background: var(--bg-page);
  overscroll-behavior: none;
}

/* 空状态 */
.empty-state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 30rpx;
  box-sizing: border-box;

  .empty-text {
    color: var(--text-secondary);
    font-size: 32rpx;
    margin-top: 30rpx;
    margin-bottom: 60rpx;
  }

  .back-btn {
    background: #00BB88;
    color: #fff;
    border-radius: 40rpx;
    padding: 20rpx 80rpx;
    font-size: 30rpx;
    border: none;
    &::after {
      border: none;
    }
  }
}

.page-content {
  min-height: 100vh;
  padding-top: 30rpx;
  padding-bottom: 140rpx;
  background: var(--bg-page);
  box-sizing: border-box;
  overscroll-behavior: none;
}

/* 顶部状态卡片样式已移至 components/order-status-header/order-status-header.vue */
._unused-legacy-status {
  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20rpx;
    flex-shrink: 0;
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex: 1;
    min-width: 0;
  }

  .status-icon {
    font-size: 56rpx;
    flex-shrink: 0;
  }

  .status-text-group {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
    flex: 1;
    min-width: 0;
  }

  .status-title {
    color: var(--text-primary);
    font-size: 36rpx;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-subtitle {
    color: var(--text-secondary);
    font-size: 24rpx;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .order-no {
    color: var(--text-secondary);
    font-size: 24rpx;
    white-space: nowrap;
    flex-shrink: 0;
    text-align: right;
  }

  .countdown-timer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 0;
    flex-shrink: 0;
    .time-item {
      width: 100rpx;
      height: 100rpx;
      background: var(--bg-secondary);
      border-radius: 16rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      .time-num {
        font-size: 40rpx;
        font-weight: 700;
        color: #00BB88;
        line-height: 1;
      }
      .time-label {
        font-size: 20rpx;
        color: var(--text-secondary);
        margin-top: 6rpx;
        line-height: 1;
      }
    }
    .time-colon {
      font-size: 40rpx;
      color: var(--text-secondary);
      font-weight: bold;
      line-height: 1;
    }
  }

  .countdown-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    color: #00BB88;
    font-size: 26rpx;
  }
}

/* 通用信息卡片 */
.info-card {
  margin: 30rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-top: 0;
  &.coach-card {
    margin-top: 20rpx;
  }
  &.hall-card {
    margin-top: 20rpx;
    margin-bottom: 0;
  }
  .card-title {
    display: flex;
    align-items: center;
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 24rpx;
    .title-icon {
      margin-right: 12rpx;
    }
  }
  .card-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;
    .card-title {
      display: flex;
      align-items: center;
      color: var(--text-primary);
      font-size: 32rpx;
      font-weight: 600;
      .title-icon {
        margin-right: 12rpx;
      }
    }
    .view-more {
      color: #00BB88;
      font-size: 28rpx;
      font-weight: normal;
      display: flex;
      align-items: center;
      gap: 4rpx;
    }
    .nav-btn {
      background: #00BB88;
      color: #fff;
      border-radius: 12rpx;
      padding: 10rpx 30rpx;
      font-size: 28rpx;
      line-height: normal;
      border: none;
      display: flex;
      align-items: center;
      gap: 6rpx;
      &::after {
        border: none;
      }
    }
  }
}

/* 信息行 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--border-color);
  &:last-child {
    border-bottom: none;
  }
  .label {
    color: var(--text-secondary);
    font-size: 28rpx;
  }
  .value {
    color: var(--text-primary);
    font-size: 28rpx;
    text-align: right;
    &.price {
      color: #00BB88;
      font-size: 36rpx;
      font-weight: bold;
    }
  }
}

/* 教练信息 */
.coach-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  .coach-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
  }
  .coach-info-right {
    flex: 1;
    .coach-name-row {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 12rpx;
      .coach-name {
        color: var(--text-primary);
        font-size: 36rpx;
        font-weight: 600;
      }
      .coach-tag {
        background: rgba(0, 187, 136, 0.2);
        color: #00BB88;
        font-size: 24rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
      }
    }
    .coach-stats {
      display: flex;
      align-items: center;
      gap: 24rpx;
      margin-bottom: 12rpx;
      .stat-item {
        display: flex;
        align-items: center;
        gap: 6rpx;
        color: var(--text-secondary);
        font-size: 26rpx;
      }
    }
    .coach-tags {
      display: flex;
      gap: 12rpx;
      .tag {
        background: var(--border-color);
        color: var(--text-secondary);
        font-size: 24rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
      }
    }
  }
}

/* 球厅信息 */
.hall-name {
  color: var(--text-primary);
  font-size: 32rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
}
.hall-address {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  color: var(--text-secondary);
  font-size: 28rpx;
  margin-bottom: 20rpx;
}
.hall-img {
  width: 100%;
  height: 320rpx;
  border-radius: 16rpx;
  background: var(--bg-secondary);
}

/* 底部安全区域 */
.safe-area-bottom {
  height: env(safe-area-inset-bottom);
  height: constant(safe-area-inset-bottom);
  width: 100%;
}

/* 删除确认弹窗遮罩 */
.delete-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-popup-wrapper {
  width: 560rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.delete-popup-content {
  padding: 48rpx 40rpx 40rpx;
  .delete-popup-title {
    color: var(--text-primary);
    font-size: 36rpx;
    font-weight: 600;
    text-align: center;
    margin-bottom: 16rpx;
  }
  .delete-popup-text {
    color: var(--text-secondary);
    font-size: 28rpx;
    text-align: center;
    line-height: 1.6;
    margin-bottom: 40rpx;
  }
  .delete-popup-buttons {
    display: flex;
    gap: 20rpx;
    .delete-popup-btn {
      flex: 1;
      height: 80rpx;
      line-height: 80rpx;
      border-radius: 40rpx;
      font-size: 30rpx;
      font-weight: 500;
      border: none;
      &::after { border: none; }
      &.cancel {
        background: rgba(107, 114, 128, 0.2);
        color: var(--text-secondary);
      }
      &.confirm {
        background: #EF4444;
        color: #fff;
      }
    }
  }
}

/* 状态操作栏 */
.status-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.report-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 服务计时器 */
.service-timer {
  margin-top: 20rpx;
  padding: 24rpx;
  background: rgba(0, 187, 136, 0.1);
  border-radius: 16rpx;
}

.timer-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
}

.timer-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.timer-label {
  color: var(--text-secondary);
  font-size: 24rpx;
}

.timer-value {
  color: #00BB88;
  font-size: 40rpx;
  font-weight: 700;
}

.timer-divider {
  width: 2rpx;
  height: 60rpx;
  background: var(--border-color);
}

</style>