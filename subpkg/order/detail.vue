<template>
  <view class="order-detail-wrapper">
    <!-- 订单不存在空状态 -->
    <view v-if="orderNotExist" class="empty-state">
      <uni-icons type="info" size="120" color="#9CA3AF"></uni-icons>
      <text class="empty-text">订单不存在或已删除</text>
      <button class="back-btn" @click="goBack">返回</button>
    </view>

    <view v-else class="page-content">
      <!-- 顶部状态卡片 -->
      <view class="status-card" :class="'status-' + orderInfo.status">
        <view class="status-header">
          <view class="status-info">
            <text class="status-icon">{{ getStatusIcon(orderInfo.status) }}</text>
            <view class="status-text-group">
              <text class="status-title">{{ orderInfo.statusText }}</text>
              <text class="status-subtitle">{{ getStatusSubtitle(orderInfo.status) }}</text>
            </view>
          </view>
          <view class="status-actions">
            <text class="order-no">订单号: {{ orderInfo.orderNo }}</text>
            <view class="report-btn" v-if="orderInfo.status !== 10" @click="showReportPopup = true">
              <uni-icons type="chatbubble" size="20" color="#9CA3AF" />
            </view>
          </view>
        </view>
        <!-- 倒计时（仅已接单状态显示） -->
        <view class="countdown-timer" v-if="orderInfo.status === 30">
          <view class="time-item">
            <text class="time-num">{{ countdownHours }}</text>
            <text class="time-label">小时</text>
          </view>
          <text class="time-colon">:</text>
          <view class="time-item">
            <text class="time-num">{{ countdownMinutes }}</text>
            <text class="time-label">分钟</text>
          </view>
          <text class="time-colon">:</text>
          <view class="time-item">
            <text class="time-num">{{ countdownSeconds }}</text>
            <text class="time-label">秒</text>
          </view>
        </view>

        <!-- 计时状态（仅进行中状态显示） -->
        <view class="service-timer" v-if="orderInfo.status === 40">
          <view class="timer-row">
            <view class="timer-item">
              <text class="timer-label">已服务</text>
              <text class="timer-value">{{ formatSeconds(timerInfo.elapsedSeconds) }}</text>
            </view>
            <view class="timer-divider"></view>
            <view class="timer-item">
              <text class="timer-label">剩余</text>
              <text class="timer-value">{{ formatSeconds(timerInfo.remainingSeconds) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 订单信息卡片 -->
      <view class="info-card">
        <view class="card-title">
          <text class="title-icon">🖥</text>
          订单信息
        </view>

        <view class="info-row">
          <text class="label">服务时间</text>
          <text class="value">{{ orderInfo.serviceTime }}</text>
        </view>

        <view class="info-row">
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

        <view class="info-row">
          <text class="label">支付方式</text>
          <text class="value">微信支付</text>
        </view>

        <view class="info-row">
          <text class="label">订单金额</text>
          <text class="value price">¥{{ formatAmount(orderInfo.totalAmount) }}</text>
        </view>

        <view class="info-row" v-if="orderInfo.payAmount > 0">
          <text class="label">实际支付</text>
          <text class="value price">¥{{ formatAmount(orderInfo.payAmount) }}</text>
        </view>

        <view class="info-row" v-if="orderInfo.extraPayAmount > 0">
          <text class="label">加钟支付</text>
          <text class="value price">¥{{ formatAmount(orderInfo.extraPayAmount) }}</text>
        </view>
      </view>

      <!-- 陪练教练卡片 -->
      <view class="info-card coach-card">
        <view class="card-title">
          <text class="title-icon">👤</text>
          陪练教练
        </view>

        <view class="coach-info">
          <image class="coach-avatar" :src="orderInfo.coachAvatar || orderInfo.coachMainPhoto || '/static/images/profile.jpg'" mode="aspectFill"></image>
          <view class="coach-info-right">
            <view class="coach-name-row">
              <text class="coach-name">{{ orderInfo.coachStageName }}</text>
              <view class="coach-tag" :style="{ backgroundColor: levelMap[coachInfo.level] ? levelMap[coachInfo.level].color + '20' : 'rgba(0, 187, 136, 0.2)', color: levelMap[coachInfo.level]?.color || '#00BB88' }">
                {{ levelMap[coachInfo.level]?.text || '初级教练' }}
              </view>
            </view>
            <view class="coach-stats">
              <view class="stat-item">
                <uni-icons type="star-filled" size="14" color="#FFC107" />
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
      </view>

      <!-- 球厅信息卡片 -->
      <view class="info-card hall-card" v-if="orderInfo.venueName">
        <view class="card-title-row">
          <view class="card-title">
            <text class="title-icon">📍</text>
            球厅信息
          </view>
          <view>
            <button class="nav-btn" @click="openHallNavigate" v-if="orderInfo.venueLongitude && orderInfo.venueLatitude">
              <uni-icons type="navigation" size="16" color="#fff" />
              导航
            </button>
          </view>
        </view>

        <text class="hall-name">{{ orderInfo.venueName }}</text>
        <view class="hall-address" v-if="orderInfo.venueAddress">
          <uni-icons type="location" size="18" color="#9CA3AF" />
          <text>{{ orderInfo.venueAddress }}</text>
        </view>
        <image class="hall-img" :src="orderInfo.venuePhotoUrl" mode="aspectFill" />
      </view>
    </view>

    <!-- 底部安全区域 -->
    <view class="safe-area-bottom"></view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="orderInfo.status === 10">
      <button class="action-btn cancel" @click="cancelOrderFunc">取消订单</button>
      <button class="action-btn pay" @click="payOrder">去支付</button>
    </view>

    <!-- 待接单 -->
    <view class="bottom-bar" v-if="orderInfo.status === 20">
      <button class="action-btn cancel" @click="cancelOrderFunc">取消订单</button>
    </view>

    <!-- 已接单/即将开始 -->
    <view class="bottom-bar" v-if="orderInfo.status === 30">
      <button class="action-btn contact-coach" @click="contactCoach">
        <uni-icons type="phone" size="18" color="#00BB88" />
        联系教练
      </button>
    </view>

    <!-- 进行中 -->
    <view class="bottom-bar" v-if="orderInfo.status === 40">
      <button class="action-btn add-time" @click="addTime">加钟</button>
    </view>

    <!-- 待评价 -->
    <view class="bottom-bar" v-if="orderInfo.status === 50">
      <button class="action-btn reward" @click="goToReward">
        <uni-icons type="gift" size="18" color="#FF9500" />
        打赏教练
      </button>
      <button class="action-btn review" @click="goToReview">去评价</button>
    </view>

    <!-- 已完成 -->
    <view class="bottom-bar" v-if="orderInfo.status === 60">
      <button class="action-btn book-again" @click="bookAgain">再来一单</button>
    </view>

    <!-- 已取消 -->
    <view class="bottom-bar" v-if="orderInfo.status === 70">
      <button class="action-btn delete-order" @click="showDeleteConfirm = true">删除订单</button>
      <button class="action-btn book-again" @click="bookAgain">再来一单</button>
    </view>

    <!-- 加钟弹窗 -->
    <view class="add-time-popup-mask" v-if="showAddTimePopup" @click="closeAddTimePopup">
      <view class="add-time-popup-wrapper" @click.stop>
        <!-- 头部 -->
        <view class="add-time-popup-header">
          <text class="close-btn" @click="closeAddTimePopup">取消</text>
          <text class="add-time-popup-title">选择加钟时长</text>
          <text class="confirm-btn" :class="{ disabled: isAddingTime }" @click="confirmAddTime">
            {{ isAddingTime ? '处理中...' : '确认' }}
          </text>
        </view>
        <!-- 时长选择 -->
        <view class="add-time-popup-content">
          <view class="add-time-tip">请选择需要延长的服务时长</view>
          <view class="add-time-options">
            <view
              v-for="option in addTimeOptions"
              :key="option.value"
              class="add-time-option"
              :class="{ active: selectedAddMinutes === option.value }"
              @click="selectedAddMinutes = option.value"
            >
              <text class="option-label">{{ option.label }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 支付弹窗 -->
    <view class="pay-popup-mask" v-if="showPayPopup" @click="closePayPopup">
      <view class="pay-popup-wrapper" @click.stop>
        <!-- 头部 -->
        <view class="pay-popup-header">
          <text class="close-btn" @click="closePayPopup">取消</text>
          <text class="pay-popup-title">选择支付方式</text>
          <text class="confirm-btn" :class="{ disabled: isPaying }" @click="confirmPay">
            {{ isPaying ? '支付中...' : '确认' }}
          </text>
        </view>
        <!-- 金额 -->
        <view class="pay-popup-content">
          <view class="pay-amount-row">
            <text class="pay-label">支付金额</text>
            <text class="pay-amount">¥{{ formatAmount(orderInfo.payAmount) }}</text>
          </view>
          <!-- 支付方式列表 -->
          <view class="pay-method-list">
            <view
              v-for="item in payList"
              :key="item.value"
              class="pay-method-item"
              :class="{ active: selectedPay === item.value }"
              @click="selectPay(item.value)"
            >
              <view class="pay-method-left">
                <view class="pay-method-icon" :style="{ background: item.bgColor }">
                  <uni-icons :type="item.icon" size="20" color="#fff" />
                </view>
                <text class="pay-method-name">{{ item.label }}</text>
              </view>
              <view class="pay-method-radio">
                <view class="radio-dot" v-if="selectedPay === item.value"></view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 异常报告弹窗 -->
    <view class="report-popup-mask" v-if="showReportPopup" @click="showReportPopup = false">
      <view class="report-popup-wrapper" @click.stop>
        <view class="report-popup-header">
          <text class="close-btn" @click="showReportPopup = false">取消</text>
          <text class="report-popup-title">报告异常</text>
          <text class="confirm-btn" @click="handleReport">提交</text>
        </view>
        <view class="report-popup-content">
          <!-- 异常类型选择 -->
          <view class="type-section">
            <text class="section-label">问题类型</text>
            <view class="type-list">
              <view
                class="type-item"
                :class="{active: exceptionType === 1}"
                @click="exceptionType = 1"
              >
                用户投诉
              </view>
              <view
                class="type-item"
                :class="{active: exceptionType === 2}"
                @click="exceptionType = 2"
              >
                教练超时
              </view>
              <view
                class="type-item"
                :class="{active: exceptionType === 3}"
                @click="exceptionType = 3"
              >
                系统异常
              </view>
              <view
                class="type-item"
                :class="{active: exceptionType === 4}"
                @click="exceptionType = 4"
              >
                其他
              </view>
            </view>
          </view>

          <!-- 问题描述 -->
          <view class="reason-section">
            <text class="section-label">问题描述</text>
            <textarea
              class="reason-input"
              v-model="exceptionReason"
              placeholder="请描述您遇到的问题（最多500字）"
              placeholder-class="input-placeholder"
              :maxlength="500"
            />
            <text class="char-count">{{ exceptionReason.length }}/500</text>
          </view>
        </view>
      </view>
    </view>

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
import { onLoad, onShow } from  "@dcloudio/uni-app"
import { getOrderDetail, cancelOrder, addTimeOrder, deleteOrder } from '@/api/billiard/order'
import { getCoachDetail } from '@/api/billiard/coach'
import { getTimerStatus } from '@/api/billiard/timer'
import { reportException } from '@/api/billiard/exception'
import { executePayment, fetchEnabledChannels } from '@/utils/payment'

// 订单ID
const orderId = ref(null)
// 加载状态
const loading = ref(false)
// 订单不存在状态
const orderNotExist = ref(false)
// 支付弹窗显示状态
const showPayPopup = ref(false)
// 选中的支付方式
const selectedPay = ref('wechat')
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
const exceptionType = ref(1)
const exceptionReason = ref('')
const evidenceUrls = ref([])

// 加钟时长选项
const addTimeOptions = ref([
  { label: '2小时', value: 120 },
  { label: '4小时', value: 240 },
  { label: '6小时', value: 360 },
  { label: '自定义', value: 'custom' }
])
// 【新增】倒计时相关
let countdownTimer = null
const countdownHours = ref('00')
const countdownMinutes = ref('00')
const countdownSeconds = ref('00')

// 支付方式列表（从后端获取）
const payList = ref([])

// 是否显示底部操作栏
const showBottomBar = computed(() => {
  return [10, 20, 30, 40, 50, 60].includes(orderInfo.status)
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
  serviceType: 1,
  bookingTime: 0,
  serviceDuration: 0,
  status: 0,
  payAmount: 0,
  extraPayAmount: 0,
  totalAmount: 0,
  createTime: 0,
  payStatus: 0,
  statusText: '',
  serviceTime: ''
})

// 助教详情信息
const coachInfo = ref({
  id: null,
  stageName: '',
  level: 0,
  serviceCount: 0,
  overallScore: 0,
  tags: []
})

// 助教等级映射
const levelMap = {
  0: { text: '初级教练', color: '#9CA3AF' },
  1: { text: '中级教练', color: '#F59E0B' },
  2: { text: '高级教练', color: '#00BB88' }
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

/**
 * 支付状态映射
 */
const payStatusMap = {
  0: '未支付',
  10: '支付成功',
  20: '已退款',
  30: '支付关闭'
}

// 获取服务类型名称
const getServiceTypeName = (type) => {
  if (type === 1) return '台球陪练'
  if (type === 2) return '陪游'
  return '台球陪练'
}

// 获取支付状态文本
const getPayStatusText = (status) => {
  return payStatusMap[status] || '未知'
}

// 格式化预约时间
const formatBookingTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 格式化下单时间
const formatCreateTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 格式化金额（分转元）
const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00'
  return (amount / 100).toFixed(2)
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
    // 默认选中第一个
    if (channels.length > 0) {
      selectedPay.value = channels[0].value
    }
  } catch (error) {
    console.error('加载支付渠道失败:', error)
    // 使用本地默认渠道
    payList.value = []
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
  uni.openLocation({
    ...params,
    fail: () => uni.showToast({ title: '打开地图失败', icon: 'none' })
  })
}

// 【新增】联系教练
const contactCoach = () => {
  uni.makePhoneCall({
    phoneNumber: '13800008888', // 这里替换为教练的实际手机号
    fail: () => uni.showToast({ title: '拨打电话失败', icon: 'none' })
  })
}

// 加载助教详情
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
      tags: data.tags ? data.tags.split(',').filter(tag => tag.trim()) : []
    })
  } catch (error) {
    console.error('加载助教详情失败:', error)
  }
}

// 加载订单详情
const loadOrderDetail = async (silent = false) => {
  if (!orderId.value) return

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
    Object.assign(orderInfo.value, {
      id: data.id,
      orderNo: data.orderNo,
      coachId: data.coachId,
      coachAvatar: data.coachAvatar,
      coachStageName: data.coachStageName,
      coachMainPhoto: data.coachMainPhoto,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      venueLongitude: data.venueLongitude,
      venueLatitude: data.venueLatitude,
      venuePhotoUrl: data.venuePhotoUrl || getRandomDefaultImage(),
      serviceType: data.serviceType,
      bookingTime: data.bookingTime,
      serviceDuration: data.serviceDuration,
      status: data.status,
      payAmount: data.payAmount,
      extraPayAmount: data.extraPayAmount,
      totalAmount: data.totalAmount,
      payStatus: data.payStatus,
      statusText: statusMap[data.status]?.text || '未知',
      serviceTime: formatBookingTime(data.bookingTime),
      createTime: formatCreateTime(data.createTime)
    })

    // 加载助教详情
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
    if (data.status === 30) {
      startCountdown()
      stopTimerPolling()
    } else if (data.status === 40) {
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
    }

    // 状态改变也停止轮训
    if (lastStatus !== null && lastStatus !== data.status) {
      stopPolling()
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
  uni.showModal({
    title: '提示',
    content: '确定要取消这个订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await cancelOrder({ orderId: orderId.value })
          uni.showToast({ title: '订单已取消', icon: 'success' })
          stopCountdown()
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
const payOrder = () => {
  // 显示支付弹窗
  showPayPopup.value = true
}

// 确认支付
const confirmPay = async () => {
  // 判断是加钟支付还是普通订单支付
  const currentPayOrderId = addTimePayOrderId.value || payOrderId.value

  if (!currentPayOrderId || !currentOrderId.value) {
    uni.showToast({ title: '支付订单信息缺失', icon: 'none' })
    return
  }

  isPaying.value = true
  try {
    await executePayment({
      payOrderId: currentPayOrderId,
      orderId: currentOrderId.value,
      payValue: selectedPay.value,
      onSuccess: (payResult) => {
        // 支付成功
        uni.showToast({
          title: addTimePayOrderId.value ? '加钟成功' : '支付成功',
          icon: 'success'
        })
        showPayPopup.value = false
        // 清空加钟相关状态
        addTimePayOrderId.value = null
        setTimeout(() => {
          loadOrderDetail()
        }, 1500)
      },
      onCancel: () => {
        // 支付取消
        uni.showToast({ title: '支付已取消', icon: 'none' })
      },
      onError: (error) => {
        // 支付失败
        uni.showToast({
          title: error.message || '支付失败，请重试',
          icon: 'none'
        })
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
  addTimePayOrderId.value = null
}

// 加钟 - 打开弹窗
const addTime = () => {
  showAddTimePopup.value = true
  selectedAddMinutes.value = 120 // 默认选2小时
  showCustomInput.value = false
  customMinutes.value = ''
}

// 关闭加钟弹窗
const closeAddTimePopup = () => {
  showAddTimePopup.value = false
  isAddingTime.value = false
  showCustomInput.value = false
  customMinutes.value = ''
}

// 处理选项选择
const handleOptionSelect = (option) => {
  if (option.value === 'custom') {
    showCustomInput.value = true
  } else {
    showCustomInput.value = false
    selectedAddMinutes.value = option.value
  }
}

// 处理自定义输入
const handleCustomInput = (e) => {
  const val = parseInt(e.detail.value)
  if (val > 0) {
    selectedAddMinutes.value = val
  }
}

// 确认加钟
const confirmAddTime = async () => {
  if (isAddingTime.value) return

  isAddingTime.value = true
  try {
    // 调用加钟接口
    const res = await addTimeOrder({
      orderId: orderId.value,
      addMinutes: selectedAddMinutes.value
    })

    // 获取加钟支付订单ID
    addTimePayOrderId.value = res.data
    currentOrderId.value = orderId.value

    // 关闭加钟弹窗
    closeAddTimePopup()

    // 显示支付弹窗
    showPayPopup.value = true

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

// 打赏教练
const goToReward = () => {
  uni.navigateTo({
    url: `/subpkg/coach/reward?coachId=${orderInfo.value.coachId}`
  })
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
  if (orderInfo.value.status !== 40) return
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
  if (orderInfo.value.status !== 40) return

  // 立即加载一次
  loadTimerStatus()

  // 5秒轮询一次服务端
  timerPollingInterval = setInterval(loadTimerStatus, 5000)

  // 本地每秒递减，用于平滑显示
  localTimerInterval = setInterval(() => {
    if (timerInfo.value.remainingSeconds > 0) {
      timerInfo.value.remainingSeconds--
      timerInfo.value.elapsedSeconds++
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
const handleReport = async () => {
  if (!exceptionReason.value.trim()) {
    uni.showToast({ title: '请描述您遇到的问题', icon: 'none' })
    return
  }

  uni.showLoading({ title: '提交中...' })

  try {
    await reportException({
      orderId: orderId.value,
      exceptionType: exceptionType.value,
      reason: exceptionReason.value,
      evidenceUrls: evidenceUrls.value
    })

    uni.hideLoading()
    uni.showToast({ title: '问题已提交，客服会尽快处理', icon: 'success' })

    // 重置状态
    showReportPopup.value = false
    exceptionType.value = 1
    exceptionReason.value = ''
    evidenceUrls.value = []
  } catch (error) {
    uni.hideLoading()
    console.error('提交异常报告失败:', error)
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    })
  }
}

onLoad((options) => {
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

  // 加载数据
  if (orderId.value) {
    loadOrderDetail()
    startPolling()
  }
})

onUnmounted(() => {
  stopCountdown()
  stopPolling()
  stopTimerPolling()
})

onShow(() => {
  // 每次页面显示时刷新订单详情
  if (orderId.value) {
    loadOrderDetail()
    // 重新开始轮询（如果之前停止了）
    if (!pollingTimer) {
      startPolling()
    }
  }
})

// ---------------------- 状态轮训 ----------------------
// 轮询定时器
let pollingTimer = null
const POLLING_INTERVAL = 3000 // 3秒轮询一次

// 开始轮训
const startPolling = () => {
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

// 判断是否是终态（不需要轮训的状态）
const isFinalStatus = (status) => {
  return status === 50 || status === 60 || status === 70 // 已完成/已取消/已退款
}

// 记录上次状态
let lastStatus = null
</script>

<style lang="scss" scoped>
.order-detail-wrapper {
  min-height: 100vh;
  background: #121619;
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
    color: #9CA3AF;
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
  background: #121619;
  box-sizing: border-box;
  overscroll-behavior: none;
}

/* 顶部状态卡片 */
.status-card {
  margin: 0 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;

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
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-subtitle {
    color: #9CA3AF;
    font-size: 24rpx;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .order-no {
    color: #9CA3AF;
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
      background: #2A3338;
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
        color: #9CA3AF;
        margin-top: 6rpx;
        line-height: 1;
      }
    }
    .time-colon {
      font-size: 40rpx;
      color: #9CA3AF;
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
  background: #1E252B;
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
    color: #fff;
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
      color: #fff;
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
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  &:last-child {
    border-bottom: none;
  }
  .label {
    color: #9CA3AF;
    font-size: 28rpx;
  }
  .value {
    color: #fff;
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
        color: #fff;
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
        color: #9CA3AF;
        font-size: 26rpx;
      }
    }
    .coach-tags {
      display: flex;
      gap: 12rpx;
      .tag {
        background: rgba(255,255,255,0.05);
        color: #9CA3AF;
        font-size: 24rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
      }
    }
  }
}

/* 球厅信息 */
.hall-name {
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
}
.hall-address {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  color: #9CA3AF;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}
.hall-img {
  width: 100%;
  height: 320rpx;
  border-radius: 16rpx;
  background: #2A3338;
}

/* 底部安全区域 */
.safe-area-bottom {
  height: env(safe-area-inset-bottom);
  height: constant(safe-area-inset-bottom);
  width: 100%;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #1E252B;
  border-top: 2rpx solid #333333;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
  .action-btn {
    flex: 1;
    height: 72rpx;
    line-height: 72rpx;
    border-radius: 36rpx;
    font-size: 26rpx;
    font-weight: 500;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    &::after { border: none; }
    &.cancel {
      background: rgba(107, 114, 128, 0.2);
      color: #9CA3AF;
    }
    &.pay {
      background: #00BB88;
      color: #fff;
    }
    &.review {
      background: rgba(245, 158, 11, 0.2);
      color: #F59E0B;
    }
    &.book-again {
      background: #00BB88;
      color: #fff;
    }
    &.contact-coach {
      background: rgba(0, 187, 136, 0.2);
      color: #00BB88;
    }
    &.add-time {
      background: #00BB88;
      color: #fff;
    }
    &.reward {
      background: rgba(255, 149, 0, 0.2);
      color: #FF9500;
    }
    &.cancel-order {
      background: rgba(239, 68, 68, 0.2);
      color: #EF4444;
    }
  }
}

/* 支付弹窗遮罩 */
.pay-popup-mask {
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

.pay-popup-wrapper {
  background: #1E252B;
  border-radius: 32rpx 32rpx 0 0;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.pay-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  .close-btn {
    color: #9CA3AF;
    font-size: 30rpx;
  }
  .pay-popup-title {
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
  }
  .confirm-btn {
    color: #00BB88;
    font-size: 30rpx;
    font-weight: 600;
    &.disabled {
      color: rgba(0, 187, 136, 0.5);
      pointer-events: none;
    }
  }
}

.pay-popup-content {
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  padding-bottom: calc(30rpx + constant(safe-area-inset-bottom));
}

.pay-amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 30rpx;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  .pay-label {
    color: #9CA3AF;
    font-size: 28rpx;
  }
  .pay-amount {
    color: #00BB88;
    font-size: 40rpx;
    font-weight: 700;
  }
}

.pay-method-list {
  .pay-method-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid rgba(255,255,255,0.05);
    &:last-child {
      border-bottom: none;
    }
    .pay-method-left {
      display: flex;
      align-items: center;
      gap: 16rpx;
      .pay-method-icon {
        width: 70rpx;
        height: 70rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .pay-method-name {
        color: #fff;
        font-size: 30rpx;
        font-weight: 500;
      }
      .pay-method-balance {
        color: #9CA3AF;
        font-size: 24rpx;
      }
    }
    .pay-method-radio {
      width: 40rpx;
      height: 40rpx;
      border: 3rpx solid #2a3338;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &.active {
      .pay-method-radio {
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
}

/* 加钟弹窗遮罩 */
.add-time-popup-mask {
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

.add-time-popup-wrapper {
  background: #1E252B;
  border-radius: 32rpx 32rpx 0 0;
  animation: slideUp 0.3s ease;
}

.add-time-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  .close-btn {
    color: #9CA3AF;
    font-size: 30rpx;
  }
  .add-time-popup-title {
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
  }
  .confirm-btn {
    color: #00BB88;
    font-size: 30rpx;
    font-weight: 600;
    &.disabled {
      color: rgba(0, 187, 136, 0.5);
      pointer-events: none;
    }
  }
}

.add-time-popup-content {
  padding: 60rpx 40rpx;
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
  padding-bottom: calc(60rpx + constant(safe-area-inset-bottom));
  .add-time-tip {
    color: #9CA3AF;
    font-size: 28rpx;
    margin-bottom: 40rpx;
    text-align: center;
  }
  .add-time-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24rpx;
    .add-time-option {
      background: #2A3338;
      border-radius: 16rpx;
      padding: 50rpx 20rpx;
      text-align: center;
      border: 2rpx solid transparent;
      transition: all 0.2s ease;
      .option-label {
        color: #fff;
        font-size: 32rpx;
        font-weight: 500;
      }
      &.active {
        border-color: #00BB88;
        background: rgba(0, 187, 136, 0.1);
        .option-label {
          color: #00BB88;
        }
      }
    }
  }
  .custom-input-wrapper {
    margin-top: 40rpx;
    .custom-input-row {
      display: flex;
      align-items: center;
      gap: 20rpx;
      background: #2A3338;
      border-radius: 16rpx;
      padding: 30rpx;
      border: 2rpx solid #00BB88;
      .custom-input {
        flex: 1;
        color: #fff;
        font-size: 32rpx;
      }
      .custom-unit {
        color: #9CA3AF;
        font-size: 28rpx;
      }
    }
  }
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
  background: #1E252B;
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
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
    text-align: center;
    margin-bottom: 16rpx;
  }
  .delete-popup-text {
    color: #9CA3AF;
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
        color: #9CA3AF;
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
  color: #9CA3AF;
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
  background: rgba(255, 255, 255, 0.1);
}

/* 异常报告弹窗遮罩 */
.report-popup-mask {
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

.report-popup-wrapper {
  background: #1E252B;
  border-radius: 32rpx 32rpx 0 0;
  animation: slideUp 0.3s ease;
  max-height: 80vh;
}

.report-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  .close-btn {
    color: #9CA3AF;
    font-size: 30rpx;
  }
  .report-popup-title {
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
  }
  .confirm-btn {
    color: #00BB88;
    font-size: 30rpx;
    font-weight: 600;
  }
}

.report-popup-content {
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  padding-bottom: calc(30rpx + constant(safe-area-inset-bottom));
}

.type-section {
  margin-bottom: 40rpx;
}

.section-label {
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
  display: block;
  margin-bottom: 20rpx;
}

.type-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.type-item {
  background: #2A3338;
  border-radius: 12rpx;
  padding: 24rpx 16rpx;
  text-align: center;
  color: #9CA3AF;
  font-size: 26rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
  &.active {
    background: rgba(0, 187, 136, 0.1);
    border-color: #00BB88;
    color: #00BB88;
  }
}

.reason-section {
  position: relative;
}

.reason-input {
  width: 100%;
  min-height: 200rpx;
  background: #2A3338;
  border-radius: 16rpx;
  padding: 24rpx;
  color: #fff;
  font-size: 28rpx;
  line-height: 1.6;
  box-sizing: border-box;
}

.input-placeholder {
  color: #6B7280;
}

.char-count {
  position: absolute;
  right: 16rpx;
  bottom: 16rpx;
  color: #6B7280;
  font-size: 22rpx;
}
</style>