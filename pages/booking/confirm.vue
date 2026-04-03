<template>
  <view class="confirm-order-wrapper">
    <!-- 自定义导航栏 -->

    <scroll-view
        scroll-y
        class="order-scroll"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
    >
      <!-- 教练信息 -->
      <view class="coach-card">
        <image class="coach-avatar" :src="coachInfo.avatar" mode="aspectFill"></image>
        <view class="coach-info">
          <view class="coach-name-row">
            <text class="coach-name">{{ coachInfo.name }}</text>
            <view class="coach-badge" :style="{background: coachInfo.badgeBg}">{{ coachInfo.badge }}</view>
          </view>
          <text class="coach-desc">{{ coachInfo.desc }}</text>
          <view class="coach-meta">
            <text class="meta-item">已接单{{ coachInfo.orderCount }}次</text>
            <text class="meta-divider">·</text>
            <text class="meta-item">{{ coachInfo.distance }}</text>
          </view>
        </view>
        <view class="coach-score">
          <uni-icons type="star-filled" size="16" color="#FBBF24" />
          <text>{{ coachInfo.score }}</text>
        </view>
      </view>

      <!-- 服务信息 -->
      <view class="info-card">
        <view class="card-title">服务信息</view>

        <view class="info-row" @click="toServiceSelect">
          <text class="label">服务项目</text>
          <view class="value-wrap">
            <text class="value">{{ orderInfo.serviceName }}</text>
            <uni-icons type="right" size="18" color="#9CA3AF" />
          </view>
        </view>

        <view class="info-row">
          <text class="label">服务时长</text>
          <view class="value-wrap">
            <view class="duration-control">
              <view class="duration-btn" :class="{disabled: orderInfo.duration <= 1}" @click="decreaseDuration">
                <uni-icons type="minus" size="20" :color="orderInfo.duration <= 1 ? '#2a3338' : '#9CA3AF'" />
              </view>
              <text class="duration-num">{{ orderInfo.duration }}小时</text>
              <view class="duration-btn" :class="{disabled: orderInfo.duration >= 8}" @click="increaseDuration">
                <uni-icons type="plus" size="20" :color="orderInfo.duration >= 8 ? '#2a3338' : '#00BB88'" />
              </view>
            </view>
          </view>
        </view>

        <view class="info-row" @click="showTimePicker = true">
          <text class="label">服务时间</text>
          <view class="value-wrap">
            <text class="value">{{ orderInfo.timeText }}</text>
            <uni-icons type="right" size="18" color="#9CA3AF" />
          </view>
        </view>

        <view class="info-row" @click="selectHall">
          <text class="label">服务地点</text>
          <view class="value-wrap">
            <text class="value">{{ orderInfo.hallName }}</text>
            <uni-icons type="right" size="18" color="#9CA3AF" />
          </view>
        </view>
      </view>

      <!-- 优惠券 -->
      <view class="info-card">
        <view class="coupon-row" @click="selectCoupon">
          <view class="coupon-left">
            <uni-icons type="gift" size="20" color="#FBBF24" />
            <text class="coupon-label">优惠券</text>
          </view>
          <view class="coupon-right">
            <text class="coupon-count" v-if="!selectedCoupon">
              <text style="color: #00BB88;">{{ couponCount }}张可用</text>
            </text>
            <text class="coupon-value" v-else style="color: #EF4444;">
              -¥{{ selectedCoupon.value }}
            </text>
            <uni-icons type="right" size="18" color="#9CA3AF" />
          </view>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="info-card">
        <view class="card-title">费用明细</view>

        <view class="fee-row">
          <text class="fee-label">{{ orderInfo.serviceName }} x{{ orderInfo.duration }}小时</text>
          <text class="fee-value">¥{{ orderInfo.basePrice }}</text>
        </view>

        <view class="fee-row">
          <text class="fee-label">服务费</text>
          <text class="fee-value">¥{{ orderInfo.serviceFee }}</text>
        </view>

        <view class="fee-row" v-if="selectedCoupon">
          <text class="fee-label">优惠券抵扣</text>
          <text class="fee-value" style="color: #EF4444;">-¥{{ selectedCoupon.value }}</text>
        </view>

        <view class="fee-total">
          <text class="total-label">实付金额</text>
          <text class="total-value">¥{{ totalPrice }}</text>
        </view>
      </view>

      <!-- 支付方式 -->
      <view class="info-card">
        <view class="card-title">支付方式</view>

        <view
            class="pay-item"
            :class="{active: selectedPay === item.value}"
            v-for="item in payList"
            :key="item.value"
            @click="selectPay(item.value)"
        >
          <view class="pay-left">
            <view class="pay-icon" :style="{background: item.bgColor}">
              <uni-icons :type="item.icon" size="24" color="#fff" />
            </view>
            <text class="pay-name">{{ item.label }}</text>
            <text class="pay-balance" v-if="item.balance">（可用余额：¥{{ item.balance }}）</text>
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

      <!-- 底部安全区域（为底部支付栏留出空间） -->
      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 底部支付栏 -->
    <view class="bottom-bar">
      <view class="total-info">
        <text class="total-label">总计：</text>
        <text class="total-price">¥{{ totalPrice }}</text>
      </view>
      <button
          class="pay-btn"
          :class="{disabled: !canPay}"
          :disabled="!canPay"
          @click="submitOrder"
      >
        {{ isSubmitting ? '提交中...' : '立即支付' }}
      </button>
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
import { ref, computed, onMounted } from 'vue'
import { onShow } from  "@dcloudio/uni-app"

// ---------------------- 状态定义 ----------------------
// 刷新/提交状态
const refreshing = ref(false)
const isSubmitting = ref(false)
// 用户协议勾选
const userAgree = ref(true)
// 选中的支付方式
const selectedPay = ref('wechat')
// 选中的优惠券
const selectedCoupon = ref(null)
// 优惠券数量
const couponCount = ref(1)
// 时间选择器显示状态
const showTimePicker = ref(false)
// 选择器样式
const indicatorStyle = ref('height: 80rpx;')// picker-view的当前选中值
const pickerValue = ref([0, 0, 0])

// ---------------------- 时间选择器数据 ----------------------
// 生成日期列（从今天开始往后7天）
const generateDateColumns = () => {
  const columns = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
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
  const now = new Date()
  const startHour = dateIndex === 0 ? now.getHours() : 0 // 今天从下一小时开始，其他天从9点开始
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
// 生成分钟列（5分钟间隔）
const generateMinuteColumns = (dateIndex = 0, hourIndex = 0) => {
  const columns = []
  const now = new Date()
  const isToday = dateIndex === 0
  const currentHour = hourColumns.value[hourIndex]?.hour

  // 1. 先确定一个基础起点：默认从 0 分开始
  let startMinute = 0

  // 2. 只有在【今天】的情况下，才需要进行时间过滤
  if (isToday) {
    // 情况 A：选的是当前小时（比如现在 14:10，选的是 14时）
    if (currentHour === now.getHours()) {
      startMinute = Math.ceil(now.getMinutes() / 5) * 5
    }
    // 情况 B：选的是今天晚些时候的小时（比如现在 14:10，选的是 15时）
    // 这里如果不需要额外偏移，startMinute 依然是 0
    // 如果你想强制至少提前30分钟预约，可以在这里加逻辑
  }

  // 3. 安全阀：防止 Math.ceil 算出 60 导致循环失效
  if (startMinute >= 60) {
    // 如果当前小时的分钟已经到头了（比如 58分向上取整到 60）
    // 理论上这个小时就不该让选了，或者分钟显示为空提示用户选下一小时
    // 这里我们简单处理为从 0 开始（正常逻辑下，小时列表会自动过滤掉这个点）
    startMinute = 0
  }

  // 4. 生成 5 分钟间隔序列
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

// 当前选中的时间
const selectedDateTime = ref({
  dateIndex: 0,
  hourIndex: 0,
  minuteIndex: 0
})

// ---------------------- 模拟数据 ----------------------
// 教练信息
const coachInfo = ref({
  name: '小雯',
  avatar: 'https://via.placeholder.com/200',
  badge: '高级教练',
  badgeBg: 'rgba(0, 187, 136, 0.2)',
  desc: '国家级台球运动员，擅长斯诺克教学',
  orderCount: 128,
  distance: '1.2km',
  score: 4.9
})

// 订单信息
const orderInfo = ref({
  serviceName: '台球陪练',
  duration: 2,
  timeText: '请选择服务时间',
  hallName: '星牌台球俱乐部(中关村店)',
  basePrice: 198,
  serviceFee: 10
})

// 支付方式列表（根据平台动态显示）
const payList = computed(() => {
  // 判断是否是微信小程序
  // #ifdef MP-WEIXIN
  return [
    { value: 'wechat', label: '微信支付', icon: 'chatbubble-filled', bgColor: '#07C160' },
    { value: 'wallet', label: '钱包余额', icon: 'wallet', bgColor: '#00BB88', balance: 256.00 }
  ]
  // #endif

  // 其他平台显示全部
  // #ifndef MP-WEIXIN
  return [
    { value: 'wechat', label: '微信支付', icon: 'chatbubble-filled', bgColor: '#07C160' },
    { value: 'alipay', label: '支付宝', icon: 'chatbubble', bgColor: '#1677FF' },
    { value: 'wallet', label: '钱包余额', icon: 'wallet', bgColor: '#00BB88', balance: 256.00 }
  ]
  // #endif
})

// ---------------------- 计算属性 ----------------------
// 总价格
const totalPrice = computed(() => {
  let total = orderInfo.value.basePrice + orderInfo.value.serviceFee
  if (selectedCoupon.value) {
    total -= selectedCoupon.value.value
  }
  return Math.max(0, total)
})

// 是否可以支付
const canPay = computed(() => {
  return userAgree.value && !isSubmitting.value && orderInfo.value.timeText !== '请选择服务时间'
})

// ---------------------- 时间选择器方法 ----------------------
// picker-view 列变化时
const onPickerChange = (e) => {
  const val = e.detail.value
  pickerValue.value = val

  const newDateIndex = val[0]
  const newHourIndex = val[1]
  const newMinuteIndex = val[2]

  // 如果日期改变了，重新生成小时和分钟列
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

  // 如果小时改变了，重新生成分钟列
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

  const date = dateItem.date
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(hourItem.hour).padStart(2, '0')
  const minute = String(minuteItem.minute).padStart(2, '0')

  const weekDay = dateItem.isToday ? '今天' : dateItem.weekDay
  orderInfo.value.timeText = `${weekDay} ${month}.${day} ${hour}:${minute}`

  showTimePicker.value = false
}

// ---------------------- 交互方法 ----------------------
// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  setTimeout(() => {
    refreshing.value = false
    uni.showToast({ title: '刷新成功', icon: 'success' })
  }, 1000)
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 联系客服
const toService = () => {
  uni.showToast({ title: '客服功能开发中', icon: 'none' })
}

// 选择服务项目
const toServiceSelect = () => {
  uni.showToast({ title: '服务选择功能开发中', icon: 'none' })
}

// 增减时长
const decreaseDuration = () => {
  if (orderInfo.value.duration <= 1) return
  orderInfo.value.duration--
  orderInfo.value.basePrice = orderInfo.value.duration * 99
}

const increaseDuration = () => {
  if (orderInfo.value.duration >= 8) return
  orderInfo.value.duration++
  orderInfo.value.basePrice = orderInfo.value.duration * 99
}

// 选择球厅（跳转到选择球厅页）
const selectHall = () => {
  // 标记是从确认订单页跳转的
  uni.setStorageSync('fromConfirm', true)
  // 保存当前选择的球厅，方便返回
  uni.setStorageSync('currentHall', { name: orderInfo.value.hallName })
  uni.navigateTo({ url: '/pages/booking/hall' })
}

// 选择优惠券
const selectCoupon = () => {
  uni.showToast({ title: '优惠券选择功能开发中', icon: 'none' })
  // 模拟选择优惠券
  if (!selectedCoupon.value) {
    selectedCoupon.value = { value: 20 }
  } else {
    selectedCoupon.value = null
  }
}

// 选择支付方式
const selectPay = (val) => {
  selectedPay.value = val
}

// 查看协议
const toAgreement = (type) => {
  uni.showToast({
    title: type === 'service' ? '服务协议功能开发中' : '退款规则功能开发中',
    icon: 'none'
  })
}

// 提交订单
const submitOrder = async () => {
  if (!canPay.value) return

  isSubmitting.value = true
  try {
    // TODO: 这里调用后端「创建订单」接口
    await new Promise(resolve => setTimeout(resolve, 1500))

    // TODO: 根据选择的支付方式唤起支付
    if (selectedPay.value === 'wechat') {
      // 微信支付
      uni.showToast({ title: '微信支付功能开发中', icon: 'none' })
    } else if (selectedPay.value === 'alipay') {
      // 支付宝支付
      uni.showToast({ title: '支付宝支付功能开发中', icon: 'none' })
    } else if (selectedPay.value === 'wallet') {
      // 钱包余额支付
      uni.showToast({ title: '钱包支付功能开发中', icon: 'none' })
    }

    // 支付成功后的逻辑
    uni.showToast({ title: '支付成功', icon: 'success' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/order/list' })
    }, 1500)
  } catch (error) {
    console.error('订单提交失败:', error)
    uni.showToast({ title: '订单提交失败，请重试', icon: 'none' })
  } finally {
    isSubmitting.value = false
  }
}

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  // 从本地存储获取选择的球厅
  const selectedHall = uni.getStorageSync('selectedHall')
  if (selectedHall) {
    orderInfo.value.hallName = selectedHall.name
    uni.removeStorageSync('selectedHall')
  }

  // 初始化时间选择器的可选范围
  const now = new Date()
  // 如果现在时间较晚，可能需要调整初始值
})

onShow(() => {
  // 检查是否有从选择球厅页返回的选择
  const returnHall = uni.getStorageSync('returnHall')
  if (returnHall) {
    orderInfo.value.hallName = returnHall.name
    uni.removeStorageSync('returnHall')
  }
})
</script>

<style lang="scss" scoped>
.confirm-order-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
  position: relative;
}


.order-scroll {
  flex: 1;
  width: 100%;
  padding-bottom: 200rpx; /* 为底部支付栏留出足够空间 */
  box-sizing: border-box;
}

/* 通用卡片 */
.info-card {
  margin: 0 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  .card-title {
    color: #fff;
    font-size: 32rpx;
    font-weight: 700;
    margin-bottom: 24rpx;
  }
}

/* 教练信息 */
.coach-card {
  margin: 30rpx;
  background: #1E252B;
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
      margin-bottom: 12rpx;
      .coach-name {
        color: #fff;
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
      color: #9CA3AF;
      font-size: 26rpx;
      margin-bottom: 12rpx;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .coach-meta {
      display: flex;
      align-items: center;
      gap: 8rpx;
      .meta-item {
        color: #9CA3AF;
        font-size: 24rpx;
      }
      .meta-divider {
        color: #2a3338;
      }
    }
  }
  .coach-score {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: #FBBF24;
    font-size: 28rpx;
    font-weight: 700;
    flex-shrink: 0;
  }
}

/* 信息行 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .label {
    color: #9CA3AF;
    font-size: 28rpx;
  }
  .value-wrap {
    display: flex;
    align-items: center;
    gap: 12rpx;
    .value {
      color: #fff;
      font-size: 28rpx;
      max-width: 400rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    background: #2a3338;
    display: flex;
    align-items: center;
    justify-content: center;
    &.disabled {
      opacity: 0.3;
      pointer-events: none;
    }
  }
  .duration-num {
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    min-width: 120rpx;
    text-align: center;
  }
}

/* 优惠券 */
.coupon-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .coupon-left {
    display: flex;
    align-items: center;
    gap: 12rpx;
    .coupon-label {
      color: #fff;
      font-size: 28rpx;
    }
  }
  .coupon-right {
    display: flex;
    align-items: center;
    gap: 12rpx;
    .coupon-count {
      font-size: 28rpx;
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
    color: #9CA3AF;
    font-size: 28rpx;
  }
  .fee-value {
    color: #fff;
    font-size: 28rpx;
  }
}
.fee-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255,255,255,0.05);
  .total-label {
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
  }
  .total-value {
    color: #00BB88;
    font-size: 40rpx;
    font-weight: 700;
  }
}

/* 支付方式 */
.pay-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);
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
    }
    .pay-name {
      color: #fff;
      font-size: 30rpx;
      font-weight: 500;
    }
    .pay-balance {
      color: #9CA3AF;
      font-size: 24rpx;
    }
  }
  .pay-radio {
    width: 40rpx;
    height: 40rpx;
    border: 3rpx solid #2a3338;
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
      border: 2rpx solid #9CA3AF;
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
      color: #9CA3AF;
      font-size: 24rpx;
    }
    .agreement-link {
      color: #00BB88;
      font-size: 24rpx;
    }
  }
  .agreement-tip {
    display: block;
    color: #6B7280;
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
  .total-info {
    flex: 1;
    .total-label {
      color: #fff;
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
    color: #fff;
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
      color: rgba(255,255,255,0.5);
      pointer-events: none;
    }
  }
}

/* 底部安全区域 */
.safe-bottom {
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

.time-picker-header {
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

/* 1. 整体容器背景 */
.picker-view {
  width: 100%;
  height: 500rpx;
  background-color: #2a3338; /* 确保背景色正确 */
}

/* 2. 调整中间选中框的边框颜色（原本默认是灰色的，改成半透明白或品牌绿） */
:deep(.uni-picker-view-indicator) {
  border-top: 1rpx solid rgba(255, 255, 255, 0.1);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
  /* 如果想要品牌色边框，可以用下面这行 */
  /* border-color: rgba(0, 187, 136, 0.3); */
}

/* 3. 核心：强制所有选项文字为白色 */
.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF !important; /* 强制白色 */
  font-size: 32rpx;
  height: 80rpx;
  line-height: 80rpx;
}

/* 4. 优化遮罩层 (让中间更亮，两边更深) */
/* 强制穿透修改原生 mask */

///* 针对中间选中的那块区域，你可以手动给一个背景色来模拟选中感 */
//:deep(.uni-picker-view-indicator) {
//  /* 设置一个比背景色稍微浅一点点或深一点点的颜色，或者干脆透明 */
//  background-color: rgba(255, 255, 255, 0.05);
//  border-top: 1rpx solid rgba(255, 255, 255, 0.1);
//  border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
//}
///* 顺便把中间选中框的边框也调暗，不然默认的白色边框在全黑下会刺眼 */
//:deep(.uni-picker-view-indicator) {
//  border-top: 1rpx solid rgba(255, 255, 255, 0.05) !important;
//  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05) !important;
//  /* 如果完全不想要中间的横线，可以设为 transparent */
//}

/* 5. 针对选中行文字加粗 (可选) */
.picker-view[value] .picker-item {
  /* 这里的逻辑通常由原生组件处理，但我们可以通过样式增强感官 */
  font-weight: 500;
}
</style>
