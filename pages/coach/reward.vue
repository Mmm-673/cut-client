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
        <image class="coach-avatar" :src="coachInfo.avatar" mode="aspectFill"></image>
        <view class="coach-name">{{ coachInfo.stageName || coachInfo.name }}</view>
        <view class="coach-level">
          <text class="level-tag">{{ coachInfo.levelText || coachInfo.level }}</text>
          <text class="rating">★ {{ coachInfo.overallScore || coachInfo.rating }}分</text>
        </view>
      </view>

      <!-- 提示文字 -->
      <view class="tip-text">感谢教练的优质服务，打赏表示鼓励吧~</view>

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
            <text class="amount-value">¥{{ item.value }}</text>
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
              placeholder="请输入打赏金额"
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
        <text class="total-label">打赏金额：</text>
        <text class="total-value">¥{{ currentAmount }}</text>
      </view>
      <button class="reward-btn" :class="{ disabled: !currentAmount }" @click="submitReward">
        立即打赏
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onNavigationBarButtonTap, onBackPress } from '@dcloudio/uni-app'
import { getCoachDetail, createRewardOrder, submitRewardPay } from '@/api/billiard/coach'

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

// 页面初始化
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
  2: '高级教练'
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
      avatar: getMainPhoto(data.photos) || data.avatar || '/static/default-avatar.png',
      level: data.level ?? 0,
      levelText: getLevelText(data.level),
      overallScore: data.overallScore || data.rating || 0
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

  loading.value = true
  uni.showLoading({
    title: '处理中...'
  })

  try {
    // 1. 创建打赏支付单（金额单位：分）
    const amountInCents = Math.round(currentAmount.value * 100)
    const createRes = await createRewardOrder({
      coachId: coachId.value,
      amount: amountInCents
    })

    const payOrderId = createRes.data?.payOrderId
    if (!payOrderId) {
      throw new Error('创建支付单失败')
    }

    // 2. 拉起支付
    uni.hideLoading()

    // 获取支付渠道
    let channelCode = 'wx_pub' // 默认微信小程序
    // #ifdef MP-ALIPAY
    channelCode = 'alipay_app'
    // #endif

    uni.showLoading({
      title: '正在调起支付...'
    })

    try {
      const payRes = await submitRewardPay({
        payOrderId: payOrderId,
        channelCode: channelCode
      })

      // 支付参数
      const payData = payRes.data || {}

      // 微信小程序支付
      // #ifdef MP-WEIXIN
      if (payData.wxPayInfo) {
        wx.requestPayment({
          ...payData.wxPayInfo,
          success: () => {
            uni.showToast({
              title: '打赏成功',
              icon: 'success'
            })
            setTimeout(() => {
              uni.navigateBack()
            }, 1500)
          },
          fail: (err) => {
            console.error('支付取消或失败:', err)
            if (err.errMsg !== 'requestPayment:fail cancel') {
              uni.showToast({
                title: '支付失败',
                icon: 'none'
              })
            }
          }
        })
      } else {
        // 模拟支付成功（测试用）
        uni.showToast({
          title: '打赏成功',
          icon: 'success'
        })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
      // #endif

      // 支付宝支付
      // #ifdef MP-ALIPAY
      if (payData.tradeNO) {
        my.tradePay({
          tradeNO: payData.tradeNO,
          success: () => {
            uni.showToast({
              title: '打赏成功',
              icon: 'success'
            })
            setTimeout(() => {
              uni.navigateBack()
            }, 1500)
          },
          fail: (err) => {
            console.error('支付取消或失败:', err)
            if (err.errorMessage !== 'userCancel') {
              uni.showToast({
                title: '支付失败',
                icon: 'none'
              })
            }
          }
        })
      } else {
        uni.showToast({
          title: '打赏成功',
          icon: 'success'
        })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      }
      // #endif

      // 非小程序环境（h5/app）- 直接显示成功
      // #ifndef MP-WEIXIN
      // #ifndef MP-ALIPAY
      uni.showToast({
        title: '打赏成功',
        icon: 'success'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      // #endif
      // #endif

    } catch (payError) {
      console.error('支付失败:', payError)
      uni.hideLoading()
      uni.showToast({
        title: '支付失败，请重试',
        icon: 'none'
      })
    }

  } catch (error) {
    console.error('打赏失败:', error)
    uni.hideLoading()
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
        background-color: rgba(245, 166, 35, 0.1);
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
      font-size: 26rpx;
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
  background-color: #1a1a1a;
  padding: 12rpx 24rpx;
  display: flex;
  align-items: center;
  border-top: 2rpx solid #2a2a2a;

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
    height: 64rpx;
    border: none;
    line-height: 64rpx;

    &.disabled {
      opacity: 0.5;
    }

    &::after {
      border: none;
    }
  }
}
</style>