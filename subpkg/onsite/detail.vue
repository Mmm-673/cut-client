<template>
  <view class="onsite-detail-wrapper" :class="themeClass">
    <view class="page-content">
      <!-- 顶部状态卡片 -->
      <view class="status-card" :class="'status-' + orderStatus">
        <view class="status-center">
          <text class="status-icon">{{ getStatusIcon(orderStatus) }}</text>
          <text class="status-title">{{ getStatusTitle(orderStatus) }}</text>
          <text class="status-subtitle">{{ getStatusSubtitle(orderStatus) }}</text>

          <!-- 进行中：实时计时 -->
          <view class="timer-display" v-if="orderStatus === 40">
            <text class="timer-value">{{ elapsedTimeText }}</text>
          </view>

          <!-- 待付款/待评价/已完成：应付金额 -->
          <view class="amount-display" v-else-if="orderStatus >= 45">
            <text class="amount-label">应付金额</text>
            <text class="amount-value">¥{{ formatAmount(orderDetail.payAmount) }}</text>
          </view>

          <!-- 支付处理中提示 -->
          <view class="processing-tip" v-if="orderStatus === 45 && paymentStatus === 10">
            <text>支付成功，订单处理中...</text>
          </view>
        </view>
      </view>

      <!-- 服务信息卡片 -->
      <view class="info-card">
        <view class="card-title">
          <text class="title-icon">📋</text>
          服务信息
        </view>

        <view class="info-row">
          <text class="label">服务类型</text>
          <text class="value">{{ getServiceTypeName(orderDetail.serviceType) }}</text>
        </view>

        <view class="info-row" v-if="orderStatus >= 40">
          <text class="label">开始时间</text>
          <text class="value">{{ formatFullTime(orderDetail.startTime) }}</text>
        </view>

        <view class="info-row" v-if="orderStatus >= 45">
          <text class="label">结束时间</text>
          <text class="value">{{ formatFullTime(orderDetail.endTime) }}</text>
        </view>

        <view class="info-row" v-if="orderStatus >= 45">
          <text class="label">计费时长</text>
          <text class="value">{{ formatDuration(orderDetail.billingMinutes) }}</text>
        </view>

        <view class="info-row">
          <text class="label">小时单价</text>
          <text class="value">¥{{ formatAmount(orderDetail.unitPrice) }}/小时</text>
        </view>

        <view class="info-row">
          <text class="label">返程车费</text>
          <text class="value">¥{{ formatAmount(orderDetail.returnTravelAmount) }}</text>
        </view>

        <view class="info-row amount-row" v-if="orderStatus >= 45">
          <text class="label">实付金额</text>
          <text class="value price-total">¥{{ formatAmount(orderDetail.payAmount) }}</text>
        </view>
      </view>

      <!-- 计费规则提示卡片 -->
      <view class="billing-tip-card" v-if="billingTipText">
        <text class="tip-icon">💡</text>
        <text class="tip-text">{{ billingTipText }}</text>
      </view>

      <!-- 助教信息卡片 -->
      <view class="info-card coach-card" v-if="hasCoachInfo" @click="goToCoachDetail">
        <view class="card-title">
          <text class="title-icon">👤</text>
          助教信息
        </view>
        <view class="coach-info">
          <image
            class="coach-avatar"
            :src="coachInfo.avatar || '/static/default-avatar.png'"
            mode="aspectFill"
          ></image>
          <view class="coach-info-right">
            <text class="coach-name">{{ coachInfo.stageName || '未知助教' }}</text>
          </view>
          <uni-icons class="coach-arrow" type="right" size="16" :color="arrowColor" />
        </view>
      </view>

      <!-- 订单信息卡片 -->
      <view class="info-card">
        <view class="card-title">
          <text class="title-icon">🆔</text>
          订单信息
        </view>
        <view class="info-row">
          <text class="label">订单编号</text>
          <text class="value">{{ orderDetail.orderNo }}</text>
        </view>
      </view>
    </view>

    <!-- 底部安全区域占位 -->
    <view class="safe-area-bottom" v-if="showBottomBar"></view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="orderStatus === 45 && paymentStatus === 0">
      <button class="action-btn pay" :disabled="isPaying" @click="openPayPopup">
        {{ isPaying ? '支付中...' : '去支付' }}
      </button>
    </view>

    <view class="bottom-bar" v-if="orderStatus === 45 && paymentStatus === 10">
      <view class="processing-bar">
        <text class="processing-text">支付成功，订单处理中...</text>
      </view>
    </view>

    <view class="bottom-bar" v-if="orderStatus === 50">
      <button class="action-btn review" @click="goToEvaluate">去评价</button>
    </view>

    <!-- 支付弹窗 -->
    <view class="pay-popup-mask" v-if="showPayPopup" @click="closePayPopup">
      <view class="pay-popup-wrapper" @click.stop>
        <!-- 头部 -->
        <view class="pay-popup-header">
          <text class="pay-popup-title">选择支付方式</text>
          <text class="pay-popup-close" @click="closePayPopup">×</text>
        </view>
        <view class="pay-popup-content">
          <view class="pay-amount-row">
            <text class="pay-label">支付金额</text>
            <text class="pay-amount">¥{{ formatAmount(orderDetail.payAmount) }}</text>
          </view>
          <view class="pay-method-list" v-if="payChannels.length > 0">
            <view
              v-for="item in payChannels"
              :key="item.channelCode"
              class="pay-method-item"
              :class="{ active: selectedPay === item.value }"
              @click="selectPay(item.value)">
              <view class="pay-method-left">
                <view class="pay-method-icon" :style="{ background: item.icon && item.icon.startsWith('/') ? 'transparent' : item.bgColor }">
                  <image v-if="item.icon && item.icon.startsWith('/')" :src="item.icon" class="pay-method-icon-img" mode="aspectFit" />
                  <uni-icons v-else :type="item.icon" size="20" color="#fff" />
                </view>
                <text class="pay-method-name">{{ item.label }}</text>
              </view>
              <view class="pay-method-radio">
                <view class="radio-dot" v-if="selectedPay === item.value"></view>
              </view>
            </view>
          </view>
          <view v-else class="pay-empty-tip">暂无可用支付方式，请稍后重试</view>
        </view>
        <view class="pay-popup-footer">
          <button
            class="pay-submit-btn"
            :class="{ disabled: isPaying || !selectedPay }"
            :disabled="isPaying || !selectedPay"
            @click="confirmPay">
            {{ isPaying ? '支付中...' : '确认支付' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad, onShow, onHide } from '@dcloudio/uni-app'
import { useThemeStore } from '@/store'
import { usePageTheme } from '@/composables/usePageTheme'
import { getOnsiteOrderDetail } from '@/api/billiard/onsiteOrder'
import { executeOnsitePayment, getOnsitePayChannels, fetchEnabledChannels } from '@/utils/payment'
import { guardReviewEntry } from '@/utils/review'
import { formatAmount, formatDuration } from '@/utils/format'

usePageTheme()

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 订单ID
const orderId = ref(null)
// 加载状态
const loading = ref(false)

// 订单详情
const orderDetail = ref({
  id: null,
  orderNo: '',
  userId: null,
  coachId: null,
  coachStageName: '',
  coachMainPhoto: '',
  customerType: 1,
  serviceType: 1,
  status: 0,
  unitPrice: 0,
  billingMinutes: 0,
  actualDurationSeconds: 0,
  returnTravelAmount: 0,
  payAmount: 0,
  paymentStatus: 0,
  settlementStatus: 0,
  startTime: '',
  endTime: ''
})

// 支付弹窗
const showPayPopup = ref(false)
const selectedPay = ref('')
const isPaying = ref(false)
const payChannels = ref([])
let paymentPoller = null

// 实时计时相关
const elapsedTimeText = ref('00:00:00')
let timerInterval = null
let pollInterval = null

// 服务类型映射
const SERVICE_TYPE_NAMES = {
  1: '台球指导',
  2: '潮玩领航',
  3: '酒艺品鉴',
  4: '影视赏析'
}

// 数字类型的订单状态（统一转为数字，兼容后端返回字符串）
const orderStatus = computed(() => Number(orderDetail.value.status) || 0)
const paymentStatus = computed(() => Number(orderDetail.value.paymentStatus) || 0)

// 助教信息（优先使用 coach 对象，降级使用旧字段）
const coachInfo = computed(() => {
  const detail = orderDetail.value
  const coach = detail.coach
  if (coach && typeof coach === 'object') {
    return {
      id: coach.id ?? detail.coachId,
      stageName: coach.stageName || detail.coachStageName || '',
      avatar: coach.avatar || detail.coachMainPhoto || ''
    }
  }
  return {
    id: detail.coachId,
    stageName: detail.coachStageName || '',
    avatar: detail.coachMainPhoto || ''
  }
})

// 是否有助教信息可展示
const hasCoachInfo = computed(() => {
  const info = coachInfo.value
  return !!(info.id || info.stageName || info.avatar)
})

// 箭头图标颜色（适配主题）
const arrowColor = computed(() => {
  return themeStore.theme === 'dark' ? '#999999' : '#999999'
})

// 计费规则提示
const BILLING_TIPS = {
  1: '温馨提示：台球指导起步时长为1小时，不足1小时按1小时计费，超出部分按分钟计费。',
  2: '温馨提示：潮玩领航起步时长为2小时，不足2小时按2小时计费，超出部分按分钟计费。',
  3: '温馨提示：酒艺品鉴起步时长为4小时，不足4小时按4小时计费，超出部分按分钟计费。',
  4: '温馨提示：影视赏析起步时长为8小时，不足8小时按8小时计费，超出部分按分钟计费。'
}

const billingTipText = computed(() => {
  return BILLING_TIPS[orderDetail.value.serviceType] || ''
})

// 是否显示底部栏
const showBottomBar = computed(() => {
  const status = orderStatus.value
  if (status === 45) return true
  if (status === 50) return true
  return false
})

// 获取服务类型名称
const getServiceTypeName = (type) => {
  return SERVICE_TYPE_NAMES[type] || '台球指导'
}

// 状态图标
const getStatusIcon = (status) => {
  const iconMap = {
    40: '🏃',
    45: '💳',
    50: '⭐',
    60: '🎉'
  }
  return iconMap[status] || '📋'
}

// 状态标题
const getStatusTitle = (status) => {
  const titleMap = {
    40: '服务进行中',
    45: '待付款',
    50: '待评价',
    60: '已完成'
  }
  return titleMap[status] || '未知状态'
}

// 状态副标题
const getStatusSubtitle = (status) => {
  const subtitleMap = {
    40: '服务正在进行，请耐心等待',
    45: '服务已结束，请完成支付',
    50: '服务已完成，期待您的评价',
    60: '感谢您的使用'
  }
  return subtitleMap[status] || ''
}

// 解析时间（兼容数字时间戳和字符串格式）
const parseDate = (time) => {
  if (!time) return null
  let timestamp
  if (typeof time === 'number') {
    timestamp = time
  } else if (typeof time === 'string') {
    if (/^\d+$/.test(time)) {
      timestamp = Number(time)
    } else {
      timestamp = new Date(time.replace(/-/g, '/')).getTime()
    }
  } else {
    timestamp = new Date(time).getTime()
  }
  if (isNaN(timestamp)) return null
  return new Date(timestamp)
}

// 格式化完整时间 (YYYY-MM-DD HH:mm)
const formatFullTime = (timeStr) => {
  const date = parseDate(timeStr)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 格式化秒数为 HH:MM:SS
const formatSeconds = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 加载订单详情
const loadOrderDetail = async (silent = false) => {
  if (!orderId.value) return
  if (!silent) {
    loading.value = true
  }
  try {

    const res = await getOnsiteOrderDetail({ id: orderId.value })
    const data = res.data || {}
    if (!data || !data.id) return

    const prevStatus = orderDetail.value.status
    Object.assign(orderDetail.value, data)

    // 状态变化处理（统一转数字，兼容字符串/数字类型）
    const newStatus = Number(data.status)
    const oldStatus = Number(prevStatus)
    if (oldStatus !== newStatus) {
      if (newStatus === 40) {
        startTimer()
        startDetailPolling()
      } else {
        stopTimer()
        stopDetailPolling()
      }
    }
  } catch (error) {
    console.error('加载现场订单详情失败:', error)
    if (!silent) {
      uni.showToast({ title: '加载失败', icon: 'none' })
    }
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

// 启动实时计时
const startTimer = () => {
  stopTimer()
  updateElapsedTime()
  timerInterval = setInterval(updateElapsedTime, 1000)
}

// 停止实时计时
const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// 更新已服务时长
const updateElapsedTime = () => {
  const startDate = parseDate(orderDetail.value.startTime)
  if (!startDate) return
  const start = startDate.getTime()
  const now = Date.now()
  const seconds = Math.max(0, Math.floor((now - start) / 1000))
  elapsedTimeText.value = formatSeconds(seconds)
}

// 启动详情轮询（30秒校准一次）
const startDetailPolling = () => {
  stopDetailPolling()
  pollInterval = setInterval(() => {
    loadOrderDetail(true)
  }, 30000)
}

// 停止详情轮询
const stopDetailPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

// 加载支付渠道（先查后端启用的渠道，再过滤出现场订单支持的）
const loadPayChannels = async () => {
  try {
    // 先从后端获取启用的支付渠道列表
    const enabledChannels = await fetchEnabledChannels()
    // 过滤出现场订单支持的渠道，并过滤掉微信支付
    const channels = getOnsitePayChannels(enabledChannels.map(ch => ch.channelCode))
      .filter(ch => ch.channelCode !== 'wx_app' && ch.channelCode !== 'wx_lite')
    payChannels.value = channels
    if (channels.length > 0 && !selectedPay.value) {
      selectedPay.value = channels[0].value
    }
  } catch (error) {
    console.error('加载支付渠道失败:', error)
    // 失败时降级为本地渠道，并过滤掉微信支付
    const localChannels = getOnsitePayChannels()
      .filter(ch => ch.channelCode !== 'wx_app' && ch.channelCode !== 'wx_lite')
    payChannels.value = localChannels
    if (localChannels.length > 0 && !selectedPay.value) {
      selectedPay.value = localChannels[0].value
    }
  }
}

// 选择支付方式
const selectPay = (val) => {
  selectedPay.value = val
}

// 获取选中的支付渠道
const selectedChannel = computed(() => {
  return payChannels.value.find(item => item.value === selectedPay.value) || null
})

// 打开支付弹窗
const openPayPopup = async () => {
  if (payChannels.value.length === 0) {
    await loadPayChannels()
  }
  if (payChannels.value.length === 0) {
    uni.showToast({ title: '暂无可用支付方式', icon: 'none' })
    return
  }
  showPayPopup.value = true
}

// 关闭支付弹窗
const closePayPopup = () => {
  if (isPaying.value) return
  showPayPopup.value = false
}

// 确认支付
const confirmPay = async () => {
  const channel = selectedChannel.value
  if (!channel) {
    uni.showToast({ title: '请选择支付方式', icon: 'none' })
    return
  }

  isPaying.value = true
  try {
    const { poller } = await executeOnsitePayment({
      orderId: orderId.value,
      payValue: channel.value,
      channelCode: channel.channelCode,
      onPaymentSuccess: () => {
        showPayPopup.value = false
        // 刷新详情，paymentStatus 会变成 10
        loadOrderDetail(true)
      },
      onSettlementSuccess: () => {
        // 结算成功，刷新详情，状态变 50
        loadOrderDetail(true)
      },
      onCancel: () => {
        uni.showToast({ title: '支付已取消', icon: 'none' })
      },
      onError: (error) => {
        uni.showToast({
          title: error.message || '支付失败，请重试',
          icon: 'none'
        })
      }
    })
    // 保存 poller 引用，用于生命周期管理
    paymentPoller = poller
  } catch (error) {
    console.error('支付失败:', error)
    if (error.canceled) {
      // 用户取消，不做额外提示
    }
  } finally {
    isPaying.value = false
  }
}

// 跳转助教详情
const goToCoachDetail = () => {
  const coachId = coachInfo.value.id
  if (!coachId) return
  uni.navigateTo({
    url: `/subpkg/coach/detail?id=${coachId}`
  })
}

// 去评价
const goToEvaluate = () => {
  uni.navigateTo({
    url: `/subpkg/coach/evaluate?orderId=${orderId.value}&coachId=${orderDetail.value.coachId}`
  })
}

// 生命周期
onLoad((options) => {
  console.log('optionsoptions===',options)
  // 审核模式入口守卫
  if (guardReviewEntry()) return
  if (options.id) {
    orderId.value = Number(options.id)
  }
  loadOrderDetail()
  loadPayChannels()
})

onShow(() => {
  // 页面显示时刷新详情
  if (orderId.value) {
    loadOrderDetail(true)
  }
  // 进行中状态恢复计时
  if (orderStatus.value === 40) {
    startTimer()
    startDetailPolling()
  }
  // 恢复支付轮询
  if (paymentPoller) {
    paymentPoller.resume()
  }
})

onHide(() => {
  // 暂停计时
  stopTimer()
  stopDetailPolling()
  // 暂停支付轮询
  if (paymentPoller) {
    paymentPoller.pause()
  }
})

onUnmounted(() => {
  stopTimer()
  stopDetailPolling()
  if (paymentPoller) {
    paymentPoller.stop()
    paymentPoller = null
  }
})
</script>

<style lang="scss" scoped>
.onsite-detail-wrapper {
  min-height: 100vh;
  background: var(--bg-page);
}

.page-content {
  min-height: 100vh;
  padding-top: 30rpx;
  padding-bottom: 30rpx;
  background: var(--bg-page);
  box-sizing: border-box;
}

/* 顶部状态卡片 */
.status-card {
  margin: 0 30rpx 30rpx;
  border-radius: 24rpx;
  padding: 48rpx 30rpx;
  display: flex;
  flex-direction: column;

  &.status-40 {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.1) 100%);
  }
  &.status-45 {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.1) 100%);
  }
  &.status-50 {
    background: linear-gradient(135deg, rgba(0, 187, 136, 0.25) 0%, rgba(0, 187, 136, 0.1) 100%);
  }
  &.status-60 {
    background: linear-gradient(135deg, rgba(0, 187, 136, 0.25) 0%, rgba(0, 187, 136, 0.1) 100%);
  }

  .status-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
  }

  .status-icon {
    font-size: 72rpx;
    margin-bottom: 8rpx;
  }

  .status-title {
    color: var(--text-primary);
    font-size: 38rpx;
    font-weight: 700;
  }

  .status-subtitle {
    color: var(--text-secondary);
    font-size: 26rpx;
  }

  .timer-display {
    margin-top: 24rpx;
    .timer-value {
      font-size: 64rpx;
      font-weight: 700;
      color: #3B82F6;
      letter-spacing: 4rpx;
      font-family: 'DIN Alternate', monospace;
    }
  }

  .amount-display {
    margin-top: 20rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;

    .amount-label {
      color: var(--text-secondary);
      font-size: 26rpx;
    }

    .amount-value {
      color: #F59E0B;
      font-size: 56rpx;
      font-weight: 700;
    }
  }

  .processing-tip {
    margin-top: 16rpx;
    padding: 10rpx 24rpx;
    background: rgba(0, 187, 136, 0.15);
    border-radius: 20rpx;
    color: #00BB88;
    font-size: 24rpx;
  }
}

/* 通用信息卡片 */
.info-card {
  margin: 24rpx 30rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;

  .card-title {
    display: flex;
    align-items: center;
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 20rpx;
    .title-icon {
      margin-right: 12rpx;
    }
  }
}

/* 信息行 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  &.amount-row {
    border-top: 2rpx solid var(--border-color);
    border-bottom: none;
    padding-top: 24rpx;
    margin-top: 8rpx;
    .label {
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .label {
    color: var(--text-secondary);
    font-size: 28rpx;
  }

  .value {
    color: var(--text-primary);
    font-size: 28rpx;
    text-align: right;

    &.price-total {
      color: #F59E0B;
      font-size: 38rpx;
      font-weight: 700;
    }
  }
}

/* 计费规则提示卡片 */
.billing-tip-card {
  margin: 20rpx 24rpx;
  padding: 24rpx 28rpx;
  background: var(--bg-secondary);
  border-radius: 16rpx;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;

  .tip-icon {
    font-size: 32rpx;
    flex-shrink: 0;
    line-height: 1.4;
  }

  .tip-text {
    flex: 1;
    color: var(--text-secondary);
    font-size: 26rpx;
    line-height: 1.6;
  }
}

/* 助教信息卡片可点击 */
.coach-card {
  cursor: pointer;
}

/* 助教信息 */
.coach-info {
  display: flex;
  align-items: center;
  gap: 20rpx;

  .coach-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background: #333;
  }

  .coach-info-right {
    flex: 1;
    .coach-name {
      color: var(--text-primary);
      font-size: 32rpx;
      font-weight: 600;
    }
  }

  .coach-arrow {
    flex-shrink: 0;
    margin-left: 8rpx;
  }
}

/* 底部安全区域 */
.safe-area-bottom {
  height: calc(120rpx + env(safe-area-inset-bottom));
  height: calc(120rpx + constant(safe-area-inset-bottom));
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--bg-card);
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;

  .action-btn {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
    color: #fff;

    &::after {
      border: none;
    }

    &.pay {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    &.review {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    &[disabled] {
      opacity: 0.6;
    }
  }

  .processing-bar {
    flex: 1;
    text-align: center;
    .processing-text {
      color: #00BB88;
      font-size: 28rpx;
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
  background: var(--bg-card);
  border-radius: 32rpx 32rpx 0 0;
  animation: slideUp 0.3s ease;
  max-height: 78vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  justify-content: center;
  position: relative;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid var(--border-color);
  flex-shrink: 0;

  .pay-popup-title {
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 600;
  }

  .pay-popup-close {
    position: absolute;
    right: 30rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-size: 40rpx;
    line-height: 1;
    background: var(--border-color);
  }
}

.pay-popup-content {
  flex: 1;
  overflow-y: auto;
  padding: 24rpx 30rpx 0;
  -webkit-overflow-scrolling: touch;
}

.pay-amount-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24rpx;
  margin-bottom: 24rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--border-color);

  .pay-label {
    color: var(--text-secondary);
    font-size: 26rpx;
  }

  .pay-amount {
    color: #00BB88;
    font-size: 44rpx;
    font-weight: 700;
    line-height: 1;
  }
}

.pay-method-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .pay-method-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 112rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: var(--bg-secondary);
    border: 2rpx solid transparent;
    box-sizing: border-box;

    .pay-method-left {
      display: flex;
      align-items: center;
      gap: 18rpx;
      min-width: 0;
      flex: 1;

      .pay-method-icon {
        width: 72rpx;
        height: 72rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .pay-method-icon-img {
          width: 56rpx;
          height: 56rpx;
        }
      }

      .pay-method-name {
        color: var(--text-primary);
        font-size: 30rpx;
        font-weight: 500;
        flex: 1;
        min-width: 0;
      }
    }

    .pay-method-radio {
      width: 40rpx;
      height: 40rpx;
      margin-left: 16rpx;
      border: 3rpx solid #4B5563;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    &.active {
      border-color: rgba(0, 187, 136, 0.9);
      background: rgba(0, 187, 136, 0.14);

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

.pay-empty-tip {
  padding: 48rpx 24rpx;
  text-align: center;
  color: var(--text-secondary);
  font-size: 28rpx;
}

.pay-popup-footer {
  flex-shrink: 0;
  padding: 24rpx 30rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--border-color);
  background: var(--bg-card);
}

.pay-submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  border: none;
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);

  &::after {
    border: none;
  }

  &.disabled {
    opacity: 0.5;
  }
}
</style>
