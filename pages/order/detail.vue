<template>
  <view class="order-detail-wrapper">
    <view class="page-content">
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
          <text class="order-no">订单号: {{ orderInfo.orderNo }}</text>
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
          <text class="view-more" @click="goToCoachDetail">查看主页 <uni-icons type="right" size="16" color="#00BB88" /></text>
        </view>

        <view class="coach-info">
          <image class="coach-avatar" :src="orderInfo.coachMainPhoto || '/static/default-avatar.png'" mode="aspectFill"></image>
          <view class="coach-info-right">
            <view class="coach-name-row">
              <text class="coach-name">{{ orderInfo.coachStageName }}</text>
              <view class="coach-tag">金牌教练</view>
            </view>
            <view class="coach-stats">
              <view class="stat-item">
                <uni-icons type="star-filled" size="14" color="#FFC107" />
                <text>4.9</text>
              </view>
              <view class="stat-item">
                <uni-icons type="checkbox" size="14" color="#9CA3AF" />
                <text>已完成328单</text>
              </view>
            </view>
            <view class="coach-tags">
              <text class="tag">斯诺克</text>
              <text class="tag">中式八球</text>
              <text class="tag">花式九球</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 球厅信息卡片 -->
      <view class="info-card hall-card" v-if="orderInfo.venueName">
        <view class="card-title">
          <text class="title-icon">📍</text>
          球厅信息
          <button class="nav-btn" @click="openHallNavigate" v-if="orderInfo.venueLongitude && orderInfo.venueLatitude">
            <uni-icons type="navigation" size="16" color="#fff" />
            导航
          </button>
        </view>

        <text class="hall-name">{{ orderInfo.venueName }}</text>
        <view class="hall-address" v-if="orderInfo.venueAddress">
          <uni-icons type="location" size="18" color="#9CA3AF" />
          <text>{{ orderInfo.venueAddress }}</text>
        </view>
        <image class="hall-img" :src="orderInfo.venueImg || 'https://picsum.photos/700/300'" mode="aspectFill" />
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
      <button class="action-btn book-again" @click="bookAgain">再来一单</button>
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
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from  "@dcloudio/uni-app"
import { getOrderDetail, cancelOrder } from '@/api/billiard/order'
import { getAvailablePayChannels, executePayment } from '@/utils/payment'

// ========== Mock数据开关 ==========
const USE_MOCK_DATA = true

// Mock数据 - 各状态订单详情
const getMockOrderData = (id) => {
  const now = Date.now()
  // id 到状态的映射
  const idToStatus = {
    1001: 10, // 待付款
    1002: 20, // 待接单
    1003: 30, // 已接单
    1004: 40, // 进行中
    1005: 50, // 待评价
    1006: 60, // 已完成
    1007: 70  // 已取消
  }

  const status = id ? (idToStatus[id] || 10) : 10

  // 根据状态返回对应的 mock 数据
  const mockDataMap = {
    10: { // 待付款
      id: 1001,
      orderNo: 'TB202401150001',
      coachId: 1,
      coachStageName: '小雯',
      coachMainPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      venueName: '星际台球俱乐部',
      venueAddress: '杭州市西湖区文三路123号',
      venueLongitude: 120.123456,
      venueLatitude: 30.234567,
      venueImg: 'https://picsum.photos/700/300',
      serviceType: 1,
      bookingTime: now + 2 * 60 * 60 * 1000,
      serviceDuration: 120,
      status: 10,
      payAmount: 19800,
      extraPayAmount: 0,
      totalAmount: 19800,
      createTime: now - 10 * 60 * 1000,
      payStatus: 0
    },
    20: { // 待接单
      id: 1002,
      orderNo: 'TB202401150002',
      coachId: 2,
      coachStageName: '阿豪',
      coachMainPhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
      venueName: '皇家台球会所',
      venueAddress: '杭州市拱墅区建国北路456号',
      venueLongitude: 120.134567,
      venueLatitude: 30.245678,
      venueImg: 'https://picsum.photos/700/300',
      serviceType: 1,
      bookingTime: now + 24 * 60 * 60 * 1000,
      serviceDuration: 180,
      status: 20,
      payAmount: 29800,
      extraPayAmount: 0,
      totalAmount: 29800,
      createTime: now - 30 * 60 * 1000,
      payStatus: 10
    },
    30: { // 已接单
      id: 1003,
      orderNo: 'TB202401150003',
      coachId: 3,
      coachStageName: '思思',
      coachMainPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      venueName: '精英台球俱乐部',
      venueAddress: '杭州市滨江区江南大道789号',
      venueLongitude: 120.145678,
      venueLatitude: 30.256789,
      venueImg: 'https://picsum.photos/700/300',
      serviceType: 1,
      bookingTime: now + 1 * 60 * 60 * 1000,
      serviceDuration: 120,
      status: 30,
      payAmount: 19800,
      extraPayAmount: 0,
      totalAmount: 19800,
      createTime: now - 2 * 60 * 60 * 1000,
      payStatus: 10
    },
    40: { // 进行中
      id: 1004,
      orderNo: 'TB202401150004',
      coachId: 4,
      coachStageName: '大飞',
      coachMainPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      venueName: '名人台球会所',
      venueAddress: '杭州市余杭区文一西路321号',
      venueLongitude: 120.156789,
      venueLatitude: 30.267890,
      venueImg: 'https://picsum.photos/700/300',
      serviceType: 1,
      bookingTime: now - 30 * 60 * 1000,
      serviceDuration: 120,
      status: 40,
      payAmount: 19800,
      extraPayAmount: 0,
      totalAmount: 19800,
      createTime: now - 3 * 60 * 60 * 1000,
      payStatus: 10
    },
    50: { // 待评价
      id: 1005,
      orderNo: 'TB202401150005',
      coachId: 1,
      coachStageName: '小雯',
      coachMainPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      venueName: '星际台球俱乐部',
      venueAddress: '杭州市西湖区文三路123号',
      venueLongitude: 120.123456,
      venueLatitude: 30.234567,
      venueImg: 'https://picsum.photos/700/300',
      serviceType: 1,
      bookingTime: now - 2 * 60 * 60 * 1000,
      serviceDuration: 120,
      status: 50,
      payAmount: 19800,
      extraPayAmount: 0,
      totalAmount: 19800,
      createTime: now - 4 * 60 * 60 * 1000,
      payStatus: 10
    },
    60: { // 已完成
      id: 1006,
      orderNo: 'TB202401140006',
      coachId: 2,
      coachStageName: '阿豪',
      coachMainPhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
      venueName: '皇家台球会所',
      venueAddress: '杭州市拱墅区建国北路456号',
      venueLongitude: 120.134567,
      venueLatitude: 30.245678,
      venueImg: 'https://picsum.photos/700/300',
      serviceType: 1,
      bookingTime: now - 24 * 60 * 60 * 1000,
      serviceDuration: 180,
      status: 60,
      payAmount: 29800,
      extraPayAmount: 5000,
      totalAmount: 34800,
      createTime: now - 26 * 60 * 60 * 1000,
      payStatus: 10
    },
    70: { // 已取消
      id: 1007,
      orderNo: 'TB202401140007',
      coachId: 3,
      coachStageName: '思思',
      coachMainPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      venueName: '精英台球俱乐部',
      venueAddress: '杭州市滨江区江南大道789号',
      venueLongitude: 120.145678,
      venueLatitude: 30.256789,
      venueImg: 'https://picsum.photos/700/300',
      serviceType: 2,
      bookingTime: now - 48 * 60 * 60 * 1000,
      serviceDuration: 300,
      status: 70,
      payAmount: 0,
      extraPayAmount: 0,
      totalAmount: 49800,
      createTime: now - 50 * 60 * 60 * 1000,
      payStatus: 30
    }
  }

  return mockDataMap[status]
}

// 订单ID
const orderId = ref(null)
// 加载状态
const loading = ref(false)
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
// 【新增】倒计时相关
let countdownTimer = null
const countdownHours = ref('00')
const countdownMinutes = ref('30')
const countdownSeconds = ref('00')

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
  coachMainPhoto: '',
  venueName: '',
  venueAddress: '',
  venueLongitude: null,
  venueLatitude: null,
  venueImg: '',
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
  // 示例：固定倒计时30分钟
  let totalSeconds = 30 * 60
  countdownTimer = setInterval(() => {
    if (totalSeconds <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      return
    }
    totalSeconds--
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    countdownHours.value = String(hours).padStart(2, '0')
    countdownMinutes.value = String(minutes).padStart(2, '0')
    countdownSeconds.value = String(seconds).padStart(2, '0')
  }, 1000)
}

// 【新增】停止倒计时
const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 支付方式列表
const payList = getAvailablePayChannels()

// 选择支付方式
const selectPay = (val) => {
  selectedPay.value = val
}

// 关闭支付弹窗
const closePayPopup = () => {
  showPayPopup.value = false
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

// 加载订单详情
const loadOrderDetail = async () => {
  if (!orderId.value) return

  loading.value = true
  try {
    let data = {}

    if (USE_MOCK_DATA) {
      // 使用Mock数据
      await new Promise(resolve => setTimeout(resolve, 300))
      data = getMockOrderData(orderId.value)
    } else {
      // 使用真实API
      const res = await getOrderDetail({ id: orderId.value })
      data = res.data || {}
    }

    // 更新订单信息 - 完全按API文档字段处理
    Object.assign(orderInfo.value, {
      id: data.id,
      orderNo: data.orderNo,
      coachId: data.coachId,
      coachStageName: data.coachStageName,
      coachMainPhoto: data.coachMainPhoto,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      venueLongitude: data.venueLongitude,
      venueLatitude: data.venueLatitude,
      venueImg: data.venueImg || '',
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
    } else {
      stopCountdown()
    }
  } catch (error) {
    console.error('加载订单详情失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  loadOrderDetail()
}

// 跳转教练详情
const goToCoachDetail = () => {
  if (orderInfo.value.coachId) {
    uni.navigateTo({
      url: `/pages/coach/detail?id=${orderInfo.value.coachId}`
    })
  }
}

// 取消订单
const cancelOrderFunc = async () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消这个订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await cancelOrder({ id: orderId.value })
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
  if (!payOrderId.value || !currentOrderId.value) {
    uni.showToast({ title: '支付订单信息缺失', icon: 'none' })
    return
  }

  isPaying.value = true
  try {
    await executePayment({
      payOrderId: payOrderId.value,
      orderId: currentOrderId.value,
      payValue: selectedPay.value,
      onSuccess: (payResult) => {
        // 支付成功
        uni.showToast({ title: '支付成功', icon: 'success' })
        showPayPopup.value = false
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

// 加钟
const addTime = () => {
  uni.showModal({
    title: '加钟服务',
    content: '确定要增加服务时长吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '加钟功能开发中', icon: 'none' })
        // TODO: 调用加钟接口
      }
    }
  })
}

// 打赏教练
const goToReward = () => {
  uni.navigateTo({
    url: `/pages/coach/reward?coachId=${orderInfo.value.coachId}`
  })
}

// 去评价
const goToReview = () => {
  uni.navigateTo({
    url: `/pages/evaluate/index?orderId=${orderInfo.value.id}`
  })
}

// 再约一次/返回首页
const bookAgain = () => {
  uni.switchTab({
    url: '/pages/home/index'
  })
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

  // 加载数据
  if (orderId.value) {
    loadOrderDetail()
  }
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<style lang="scss" scoped>
.order-detail-wrapper {
  min-height: 100vh;
  background: #121619;
  position: relative;
}

.page-content {
  padding-bottom: 140rpx;
}

/* 顶部状态卡片 */
.status-card {
  margin: 0 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;

  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20rpx;
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .status-icon {
    font-size: 56rpx;
  }

  .status-text-group {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  .status-title {
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
  }

  .status-subtitle {
    color: #9CA3AF;
    font-size: 24rpx;
  }

  .order-no {
    color: #9CA3AF;
    font-size: 24rpx;
  }

  .countdown-timer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16rpx;
    margin: 30rpx 0;
    .time-item {
      width: 120rpx;
      height: 120rpx;
      background: #2A3338;
      border-radius: 16rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      .time-num {
        font-size: 48rpx;
        font-weight: 700;
        color: #00BB88;
      }
      .time-label {
        font-size: 24rpx;
        color: #9CA3AF;
        margin-top: 8rpx;
      }
    }
    .time-colon {
      font-size: 48rpx;
      color: #9CA3AF;
      font-weight: bold;
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
    justify-content: space-between;
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 24rpx;
    .title-icon {
      margin-right: 12rpx;
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
</style>