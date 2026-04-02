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
        <view class="coach-name">{{ coachInfo.name }}</view>
        <view class="coach-level">
          <text class="level-tag">{{ coachInfo.level }}</text>
          <text class="rating">★ {{ coachInfo.rating }}分</text>
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

// 状态管理
const statusBarHeight = ref(0)
const safeAreaBottom = ref(0)
const scrollHeight = ref(0)
const isRefreshing = ref(false)
const isCustomAmount = ref(false)
const selectedAmount = ref(10)
const customAmount = ref('')
const message = ref('')

// 教练信息（实际项目中从接口获取）
const coachInfo = ref({
  id: 2,
  name: '阿豪',
  avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
  level: '中级教练',
  rating: 4.8
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
  const options = currentPage.options

  if (options.coachId) {
    loadCoachInfo(parseInt(options.coachId))
  }
})

// 加载教练信息
const loadCoachInfo = (coachId) => {
  // 模拟根据ID加载教练信息
  const coachData = {
    1: {
      id: 1,
      name: '小雯',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      level: '高级教练',
      rating: 4.9
    },
    2: {
      id: 2,
      name: '阿豪',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
      level: '中级教练',
      rating: 4.8
    },
    3: {
      id: 3,
      name: '思思',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      level: '高级教练',
      rating: 4.9
    },
    4: {
      id: 4,
      name: '大飞',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      level: '中级教练',
      rating: 4.7
    }
  }

  if (coachData[coachId]) {
    coachInfo.value = coachData[coachId]
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
const submitReward = () => {
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

  // 模拟打赏提交
  uni.showLoading({
    title: '处理中...'
  })

  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({
      title: '打赏成功',
      icon: 'success'
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }, 1000)
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
  padding: 40rpx 32rpx;
}

/* 教练信息 */
.coach-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;

  .coach-avatar {
    width: 240rpx;
    height: 240rpx;
    border-radius: 120rpx;
    border: 8rpx solid #f5a623;
  }

  .coach-name {
    font-size: 48rpx;
    font-weight: 700;
    color: #ffffff;
    margin-top: 32rpx;
  }

  .coach-level {
    display: flex;
    align-items: center;
    margin-top: 16rpx;

    .level-tag {
      font-size: 24rpx;
      color: #ffffff;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 4rpx 20rpx;
      border-radius: 8rpx;
      margin-right: 16rpx;
    }

    .rating {
      font-size: 28rpx;
      color: #f5a623;
    }
  }
}

/* 提示文字 */
.tip-text {
  text-align: center;
  font-size: 30rpx;
  color: #ffffff;
  margin: 32rpx 0 64rpx;
}

/* 金额选择 */
.amount-section {
  margin-bottom: 48rpx;

  .amount-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24rpx;

    .amount-item {
      background-color: #2a2a2a;
      border-radius: 24rpx;
      padding: 40rpx 24rpx;
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
        font-size: 56rpx;
        font-weight: 700;
        color: #ffffff;
      }

      .amount-label {
        font-size: 24rpx;
        color: #999999;
        margin-top: 8rpx;
      }

      &.custom-item {
        .custom-icon {
          font-size: 56rpx;
          margin-bottom: 8rpx;
        }
      }
    }
  }
}

/* 自定义金额输入 */
.custom-input-section {
  margin-bottom: 48rpx;

  .input-wrapper {
    display: flex;
    align-items: center;
    background-color: #2a2a2a;
    border-radius: 24rpx;
    padding: 32rpx 40rpx;

    .currency-icon {
      font-size: 40rpx;
      color: #f5a623;
      font-weight: 600;
      margin-right: 24rpx;
    }

    .custom-input {
      flex: 1;
      font-size: 32rpx;
      color: #ffffff;

      &::placeholder {
        color: #666666;
      }
    }
  }
}

/* 留言区域 */
.message-section {
  margin-bottom: 48rpx;

  .section-title {
    font-size: 30rpx;
    color: #ffffff;
    margin-bottom: 24rpx;
  }

  .message-input-wrapper {
    background-color: #2a2a2a;
    border-radius: 24rpx;
    padding: 32rpx;

    .message-input {
      width: 100%;
      min-height: 160rpx;
      font-size: 30rpx;
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
  height: 100rpx;
}

/* 底部栏 */
.bottom-bar {
  background-color: #1a1a1a;
  padding: 24rpx 32rpx;
  display: flex;
  align-items: center;
  border-top: 2rpx solid #2a2a2a;

  .total-amount {
    flex: 1;

    .total-label {
      font-size: 28rpx;
      color: #999999;
    }

    .total-value {
      font-size: 48rpx;
      font-weight: 700;
      color: #f5a623;
    }
  }

  .reward-btn {
    background: linear-gradient(135deg, #f5a623 0%, #d98a00 100%);
    color: #1a1a1a;
    font-size: 32rpx;
    font-weight: 600;
    border-radius: 48rpx;
    padding: 0 64rpx;
    height: 96rpx;
    border: none;
    line-height: 96rpx;

    &.disabled {
      opacity: 0.5;
    }

    &::after {
      border: none;
    }
  }
}
</style>