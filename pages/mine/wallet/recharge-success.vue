<template>
  <view class="recharge-success-wrapper">
    <view class="success-content">
      <!-- 成功图标 -->
      <view class="icon-wrapper">
        <uni-icons type="checkmarkempty" size="120" color="#00BB88" />
      </view>

      <!-- 标题 -->
      <view class="title">充值成功</view>
      <view class="subtitle">您的余额已到账</view>

      <!-- 充值金额 -->
      <view class="amount-card">
        <text class="amount-label">充值金额</text>
        <text class="amount-value">¥{{ amount }}</text>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <view class="btn secondary" @click="goToWallet">查看钱包</view>
      <view class="btn primary" @click="goBack">完成</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const amount = ref('0.00')

onLoad((options) => {
  if (options.amount) {
    amount.value = options.amount
  }
})

const goToWallet = () => {
  uni.switchTab({ url: '/pages/mine/wallet/index' })
}

const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.recharge-success-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
  padding: 120rpx 30rpx 0;
  box-sizing: border-box;
}

.success-content {
  flex: 1;
}

.icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
}

.title {
  text-align: center;
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16rpx;
}

.subtitle {
  text-align: center;
  font-size: 28rpx;
  color: #9CA3AF;
  margin-bottom: 80rpx;
}

.amount-card {
  background: #1E252B;
  border-radius: 24rpx;
  padding: 40rpx;
  text-align: center;

  .amount-label {
    display: block;
    color: #9CA3AF;
    font-size: 28rpx;
    margin-bottom: 16rpx;
  }

  .amount-value {
    display: block;
    color: #00BB88;
    font-size: 60rpx;
    font-weight: 700;
  }
}

.bottom-bar {
  display: flex;
  gap: 20rpx;
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;

  &.primary {
    background: #00BB88;
    color: #fff;
  }

  &.secondary {
    background: #2a3338;
    color: #fff;
  }
}
</style>