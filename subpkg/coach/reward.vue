
<template>
  <view class="reward-page">
    <scroll-view
        class="scroll-content"
        scroll-y
        @scrolltolower="onReachBottom"
        @refresherrefresh="onRefresh"
        :refresher-enabled="true"
        :refresher-triggered="isRefreshing"
        :style="{ height: scrollHeight + 'px' }"
    >
      <!-- 教练信息 -->
      <view class="coach-info">
        <image class="coach-avatar" :src="coachInfo.avatar" mode="aspectFill" />
        <view class="coach-name">{{ coachInfo.stageName || coachInfo.name }}</view>
        <view class="coach-level">
          <text class="level-tag">{{ coachInfo.levelText || coachInfo.level }}</text>
          <text class="rating">★ {{ coachInfo.overallScore }}分</text>
        </view>
      </view>

      <!-- 提示文字 -->
      <view class="tip-text">感谢教练的优质服务，加鸡腿已表示鼓励吧~</view>

      <!-- 金额选择 -->
      <view class="amount-section">
        <view class="amount-grid">
          <view
              v-for="(item, index) in amountOptions"
              :key="index"
              class="amount-item"
              :class="{ active: selectedAmount === item.value && !isCustomAmount }"
              @click="selectAmount(item.value)"
              >
            <text class="amount-value">{{ item.value }}</text>
            <text class="amount-label">{{ item.label }}</text>
          </view>
          <view
              class="amount-item custom-item"
              :class="{ active: isCustomAmount }"
              @click="selectCustomAmount"
              >
            <text class="custom-icon">✏️</text>
            <text class="amount-label">自定义</text>
          </view>
        </view>
      </view>

      <!-- 自定义金额输入 -->
      <view class="custom-input-section" v-if="isCustomAmount">
        <view class="input-wrapper">
          <text class="currency-icon">¥</text>
          <input
              class="custom-input"
              type="digit"
              v-model="customAmount"
              placeholder="请输入鸡腿数量"
              @input="onCustomAmountInput"
              />
        </view>
      </view>

      <!-- 留言区域 -->
      <view class="message-section">
        <view class="section-title">留言鼓励（选填）</view>
        <view class="message-input-wrapper">
          <textarea
              class="message-input"
              v-model="message"
              placeholder="说点什么感谢教练吧..."
              :maxlength="200"
              auto-height
              ></textarea>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- 底部打赏按钮 -->
    <view class="bottom-bar" :style="{ paddingBottom: safeAreaBottom + 'px' }">
      <view class="total-amount">
        <text class="total-label">鸡腿数量：</text>
        <text class="total-value">{{ currentAmount }}</text>
      </view>
      <button class="reward-btn" :class="{ disabled: !currentAmount }" @click="submitReward">
        确认
      </button>
    </view>

    <!-- 支付方式弹窗 -->
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
            <text class="pay-label">打赏金额</text>
            <text class="pay-amount">¥{{ currentAmount }}</text>
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
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onNavigationBarButtonTap, onBackPress } from '@dcloudio/uni-app'
import { getCoachDetail, createRewardOrder } from '@/api/billiard/coach'
import { executePayment, fetchEnabledChannels } from '@/utils/payment'

// 状态管理
const statusBarHeight = ref(0)
const safeAreaBottom = ref(0)
const scrollHeight = ref(0)
const isRefreshing = ref(false)
const isCustomAmount = ref(false)
const selectedAmount = ref(10)
const customAmount = ref('')
const message = ref('')
const loading = ref(false)
const coachId = ref(null)

// 支付相关
const showPayPopup = ref(false)
const selectedPay = ref('wechat')
const isPaying = ref(false)
const payList = ref([])
const payOrderId = ref(null)

// 教练信息
const coachInfo = ref({
  id: null,
  name: '',
  avatar: '',
  stageName: '',
  level: 0,
  levelText: '',
  overallScore: 0
})

// 金额选项
const amountOptions = ref([
  { value: 10, label: '小意思' },
  { value: 20, label: '很满意' },
  { value: 50, label: '超棒的' },
  { value: 100, label: '太棒了' },
  { value: 200, label: '大神级' }
])

// 当前金额
const currentAmount = computed(() => {
  if (isCustomAmount.value) {
    return parseFloat(customAmount.value) || 0
  }
  return selectedAmount.value
})

// 页面生命周期
onMounted(() => {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
  safeAreaBottom.value = systemInfo.safeAreaInsets?.bottom || 0

  // 计算滚动区域高度
  setTimeout(() => {
    const query = uni.createSelectorQuery()
    query.select('.bottom-bar').boundingClientRect()
    query.exec((res) => {
      const bottomBarHeight = res[0]?.height || 0
      // 减去系统导航栏、底部栏、安全区域
      scrollHeight.value = systemInfo.windowHeight - bottomBarHeight - (systemInfo.safeAreaInsets?.bottom || 0)
    })
  }, 100)

  // 加载支付渠道
  loadPayChannels()

  // 获取传递的参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || currentPage.$page?.options || {}

  if (options.coachId) {
    coachId.value = parseInt(options.coachId)
    loadCoachInfo(coachId.value)
  }
})

// 等级映射
const levelMap = {
  0: '初级教练',
  1: '中级教练',
  2: '高级教练',
  3: '星级教练'
}

const getLevelText = (level) => {
  if (typeof level === 'string') {
    return level
  }
  return levelMap[level] || '初级教练'
}

// 获取主图
const getMainPhoto = (photos) => {
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return null
  }
  const mainPhoto = photos.find(p => p.isMain === true || p.is_main === true)
  if (mainPhoto) {
    return mainPhoto.photoUrl || mainPhoto.url || mainPhoto
  }
  const first = photos[0]
  return first.photoUrl || first.url || first
}

// 加载教练信息
const loadCoachInfo = async (id) => {
  if (!id) return

  loading.value = true
  try {
    const res = await getCoachDetail({ id })
    const data = res.data || {}

    coachInfo.value = {
      id: data.id,
      name: data.stageName || data.name,
      stageName: data.stageName || data.name,
      avatar:  data.avatar || getMainPhoto(data.photos) || '/static/default-avatar.png',
      level: data.level ?? 0,
      levelText: getLevelText(data.level),
      overallScore: data.overallScore ?? data.rating ?? 0
    }
  } catch (error) {
    console.error('加载教练详情失败:', error)
    uni.showToast({
      title: '加载教练信息失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 选择金额
const selectAmount = (amount) => {
  isCustomAmount.value = false
  selectedAmount.value = amount
}

// 选择自定义金额
const selectCustomAmount = () => {
  isCustomAmount.value = true
}

// 自定义金额输入
const onCustomAmountInput = (e) => {
  let value = e.detail.value
  // 限制小数点后两位
  value = value.replace(/^\./g, '')
  value = value.replace(/\.{2,}/g, '.')
  value = value.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.')
  value = value.replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3')
  customAmount.value = value
}

// 返回
const goBack = () => {
  uni.navigateBack()
}

// 下拉刷新
const onRefresh = () => {
  isRefreshing.value = true
  // 模拟刷新数据
  setTimeout(() => {
    isRefreshing.value = false
  }, 1000)
}

// 上拉加载
const onReachBottom = () => {
  // 预留上拉加载接口
}

// 加载支付渠道
const loadPayChannels = async () => {
  try {
    const channels = await fetchEnabledChannels(10)
    console.log('打赏页面获取到的支付渠道:', channels)
    payList.value = channels
    if (channels.length > 0) {
      selectedPay.value = channels[0].value
    }
  } catch (error) {
    console.error('加载支付渠道失败:', error)
  }
}

// 获取当前选中的支付渠道
const selectedPayChannel = computed(() => payList.value.find(item => item.value === selectedPay.value))

// 选择支付方式
const selectPay = (val) => {
  selectedPay.value = val
}

// 关闭支付弹窗
const closePayPopup = () => {
  showPayPopup.value = false
}

// 确认支付
const confirmPay = async () => {
  if (isPaying.value) return
  if (!payOrderId.value) {
    uni.showToast({ title: '支付信息缺失', icon: 'none' })
    return
  }

  const payChannel = selectedPayChannel.value
  if (!payChannel) {
    uni.showToast({ title: '请选择支付方式', icon: 'none' })
    return
  }

  console.log('打赏支付 - 选中的支付渠道:', payChannel)

  isPaying.value = true
  try {
    await executePayment({
      payOrderId: payOrderId.value,
      payValue: selectedPay.value,
      channelCode: payChannel.channelCode,
      orderId: payOrderId.value,
      onSuccess: () => {
        uni.showToast({ title: '打赏成功', icon: 'success' })
        showPayPopup.value = false
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      },
      onCancel: () => {
        uni.showToast({ title: '支付已取消', icon: 'none' })
      },
      onError: (error) => {
        uni.showToast({ title: error.message || '支付失败', icon: 'none' })
      }
    })
  } catch (error) {
    console.error('支付失败:', error)
  } finally {
    isPaying.value = false
  }
}

// 提交打赏
const submitReward = async () => {
  if (!currentAmount.value) {
    uni.showToast({
      title: '请选择打赏金额',
      icon: 'none'
    })
    return
  }

  if (currentAmount.value <= 0) {
    uni.showToast({
      title: '打赏金额必须大于0',
      icon: 'none'
    })
    return
  }

  if (!coachId.value) {
    uni.showToast({
      title: '教练信息加载失败',
      icon: 'none'
    })
    return
  }

  uni.showLoading({ title: '创建订单...' })

  try {
    // 创建打赏支付单（金额单位：分）
    const amountInCents = Math.round(currentAmount.value * 100)
    const createRes = await createRewardOrder({
      coachId: coachId.value,
      amount: amountInCents
    })

    const orderId = createRes.data
    console.log(createRes.data,'=====createRes.data')
    if (!orderId) {
      throw new Error('创建支付单失败')
    }

    payOrderId.value = orderId
    uni.hideLoading()
    // 显示支付弹窗
    showPayPopup.value = true
  } catch (error) {
    uni.hideLoading()
    console.error('打赏失败:', error)
    uni.showToast({
      title: error.message || '打赏失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 监听返回按钮
onBackPress(() => {
  goBack()
})
</script>

<style lang="scss" scoped>
.reward-page {
  min-height: 100vh;
  background-color: #1a1a1a;
}

/* 滚动内容 */
.scroll-content {
  /* 高度通过内联样式动态设置 */
  padding: 24rpx 24rpx;
}

/* 教练信息 */
.coach-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0;

  .coach-avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 80rpx;
    border: 6rpx solid #f5a623;
  }

  .coach-name {
    font-size: 32rpx;
    font-weight: 700;
    color: #ffffff;
    margin-top: 20rpx;
  }

  .coach-level {
    display: flex;
    align-items: center;
    margin-top: 12rpx;

    .level-tag {
      font-size: 22rpx;
      color: #ffffff;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 4rpx 16rpx;
      border-radius: 6rpx;
      margin-right: 12rpx;
    }

    .rating {
      font-size: 24rpx;
      color: #f5a623;
    }
  }
}

/* 提示文字 */
.tip-text {
  text-align: center;
  font-size: 26rpx;
  color: #ffffff;
  margin: 24rpx 0 40rpx;
}

/* 金额选择 */
.amount-section {
  margin-bottom: 32rpx;

  .amount-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16rpx;

    .amount-item {
      background-color: #2a2a2a;
      border-radius: 16rpx;
      padding: 24rpx 16rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 4rpx solid transparent;
      transition: all 0.3s;

      &.active {
        background-color: rgba(245, 166, 35, 0.15);
        border-color: #f5a623;
      }

      .amount-value {
        font-size: 36rpx;
        font-weight: 700;
        color: #ffffff;
      }

      .amount-label {
        font-size: 22rpx;
        color: #999999;
        margin-top: 6rpx;
      }

      &.custom-item {
        .custom-icon {
          font-size: 36rpx;
          margin-bottom: 6rpx;
        }
      }
    }
  }
}

/* 自定义金额输入 */
.custom-input-section {
  margin-bottom: 32rpx;

  .input-wrapper {
    display: flex;
    align-items: center;
    background-color: #2a2a2a;
    border-radius: 16rpx;
    padding: 24rpx 28rpx;

    .currency-icon {
      font-size: 32rpx;
      color: #f5a623;
      font-weight: 600;
      margin-right: 16rpx;
    }

    .custom-input {
      flex: 1;
      font-size: 28rpx;
      color: #ffffff;

      &::placeholder {
        color: #666666;
      }
    }
  }
}

/* 留言区域 */
.message-section {
  margin-bottom: 32rpx;

  .section-title {
    font-size: 26rpx;
    color: #ffffff;
    margin-bottom: 16rpx;
  }

  .message-input-wrapper {
    background-color: #2a2a2a;
    border-radius: 16rpx;
    padding: 24rpx;

    .message-input {
      width: 100%;
      min-height: 120rpx;
      font-size: 28rpx;
      color: #ffffff;
      line-height: 1.6;

      &::placeholder {
        color: #666666;
      }
    }
  }
}

/* 底部占位 */
.bottom-placeholder {
  height: 80rpx;
}

/* 底部栏 */
.bottom-bar {
  //background-color: #1a1a1a;
  padding: 12rpx 24rpx;
  display: flex;
  align-items: center;
  border-top: 2rpx solid #2a2a2a;
  background-color: #1E252B;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  .total-amount {
    flex: 1;

    .total-label {
      font-size: 22rpx;
      color: #999999;
    }

    .total-value {
      font-size: 32rpx;
      font-weight: 700;
      color: #f5a623;
    }
  }

  .reward-btn {
    background: linear-gradient(135deg, #f5a623 0%, #d98a00 100%);
    color: #1a1a1a;
    font-size: 26rpx;
    font-weight: 600;
    border-radius: 32rpx;
    padding: 0 40rpx;
    height: 72rpx;
    border: none;
    line-height: 72rpx;

    &.disabled {
      opacity: 0.5;
    }

    &::after {
      border: none;
    }
  }
}

/* 支付弹窗 */
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
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
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
    font-size: 36rpx;
    font-weight: 600;
  }

  .confirm-btn {
    color: #f5a623;
    font-size: 30rpx;
    font-weight: 600;

    &.disabled {
      color: rgba(245, 166, 35, 0.5);
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
    color: #f5a623;
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

        .pay-method-icon-img {
          width: 56rpx;
          height: 56rpx;
        }
      }

      .pay-method-name {
        color: #fff;
        font-size: 30rpx;
        font-weight: 500;
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
        border-color: #f5a623;

        .radio-dot {
          width: 20rpx;
          height: 20rpx;
          border-radius: 50%;
          background: #f5a623;
        }
      }
    }
  }
}
</style>
