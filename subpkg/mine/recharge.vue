<template>
  <view class="recharge-wrapper">
    <!-- 充值金额 -->
    <view class="section-card">
      <view class="section-title">选择充值金额</view>
      <view class="package-list">
        <view
            class="package-item"
            :class="{active: selectedAmount === item}"
            v-for="item in amountOptions"
            :key="item"
            @click="selectAmount(item)"
        >
          <view class="package-main">
            <text class="package-pay">¥{{ item.toFixed(2) }}</text>
          </view>
        </view>
        <view
            class="package-item input-item"
            :class="{active: isCustomAmount}"
            @click="showCustomInput"
        >
          <view class="package-main">
            <text class="package-pay" v-if="!isCustomAmount">自定义</text>
            <input
                v-else
                class="custom-input"
                type="digit"
                v-model="customAmount"
                placeholder="输入金额"
                placeholder-class="input-placeholder"
                @focus="onCustomFocus"
                @blur="onCustomBlur"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 支付方式 -->
    <view class="section-card">
      <view class="section-title">支付方式</view>
      <view class="pay-list">
        <view
            class="pay-item"
            :class="{active: selectedPay === item.value}"
            v-for="item in payChannels"
            :key="item.value"
            @click="selectPay(item.value)"
        >
          <view class="pay-icon" :style="{background: item.bgColor}">
            <uni-icons :type="item.icon" size="24" color="#fff" />
          </view>
          <text class="pay-name">{{ item.label }}</text>
          <view class="pay-radio">
            <view class="radio-dot" v-if="selectedPay === item.value"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部安全区域 -->
    <view class="safe-area-bottom"></view>

    <!-- 底部支付栏 -->
    <view class="bottom-bar">
      <view class="total-info">
        <text class="total-label">支付金额：</text>
        <text class="total-price">¥{{ finalAmount }}</text>
      </view>
      <button class="pay-btn" :disabled="!canPay" @click="handleRecharge">立即充值</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getAvailablePayChannels, executePayment } from '@/utils/payment'
import { createWalletRecharge } from '@/api/billiard/pay'

// 固定金额选项
const amountOptions = [300, 500, 1000, 2000]

// 选中的金额
const selectedAmount = ref(300)
const customAmount = ref('')
const isCustomAmount = ref(false)

// 支付方式
const selectedPay = ref('wechat')
const payChannels = computed(() => getAvailablePayChannels().filter(c => c.value !== 'wallet'))

// 最终金额
const finalAmount = computed(() => {
  if (isCustomAmount.value && customAmount.value) {
    return parseFloat(customAmount.value).toFixed(2)
  }
  if (selectedAmount.value) {
    return selectedAmount.value.toFixed(2)
  }
  return '0.00'
})

// 是否可以支付
const canPay = computed(() => {
  return parseFloat(finalAmount.value) > 0
})

// 选择金额
const selectAmount = (amount) => {
  selectedAmount.value = amount
  isCustomAmount.value = false
  customAmount.value = ''
}

// 显示自定义输入
const showCustomInput = () => {
  isCustomAmount.value = true
  selectedAmount.value = null
}

// 自定义金额获得焦点
const onCustomFocus = () => {
  isCustomAmount.value = true
  selectedAmount.value = null
}

// 自定义金额失去焦点
const onCustomBlur = () => {
  if (customAmount.value) {
    selectedAmount.value = null
  }
}

// 选择支付方式
const selectPay = (value) => {
  selectedPay.value = value
}

// 处理充值
const handleRecharge = async () => {
  if (!canPay.value) {
    uni.showToast({ title: '请输入充值金额', icon: 'none' })
    return
  }

  uni.showLoading({ title: '创建充值订单...' })

  try {
    // 创建钱包充值订单 - 直接传递 payPrice (单位分)
    const params = {
      payPrice: parseFloat(finalAmount.value) * 100
    }

    const orderRes = await createWalletRecharge(params)

    const payOrderId = orderRes.data?.payOrderId

    if (!payOrderId) {
      throw new Error('充值订单创建失败')
    }

    uni.hideLoading()

    // 执行支付
    await executePayment({
      payOrderId: payOrderId,
      payValue: selectedPay.value,
      orderId: orderRes.data?.id,
      onSuccess: () => {
        uni.showToast({ title: '充值成功', icon: 'success' })
        setTimeout(() => {
          uni.redirectTo({
            url: `/subpkg/mine/recharge-success?amount=${finalAmount.value}`
          })
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
    uni.hideLoading()
    console.error('充值失败:', error)
    uni.showToast({ title: error.message || '充值失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.recharge-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-bottom: 200rpx;
}

.section-card {
  margin: 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
}

.section-title {
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 30rpx;
}

/* 套餐列表 */
.package-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20rpx;
}

.package-item {
  width: calc((100% - 40rpx) / 3);
  background: #2a3338;
  border-radius: 16rpx;
  padding: 24rpx 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.active {
    background: rgba(0, 187, 136, 0.15);
    border-color: #00BB88;
  }

  .package-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;
  }

  .package-pay {
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
  }

  .package-bonus {
    color: #00BB88;
    font-size: 22rpx;
  }

  .package-name {
    color: #9CA3AF;
    font-size: 22rpx;
    margin-top: 8rpx;
  }

  &.input-item {
    .package-pay {
      color: #9CA3AF;
    }
    &.active .package-pay {
      color: #00BB88;
    }
  }
}

.custom-input {
  width: 100%;
  text-align: center;
  color: #fff;
  font-size: 32rpx;
}

.input-placeholder {
  color: #6B7280;
  font-size: 28rpx;
}

/* 支付方式 */
.pay-list {
  .pay-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid rgba(255,255,255,0.05);

    &:last-child {
      border-bottom: none;
    }

    .pay-icon {
      width: 70rpx;
      height: 70rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
    }

    .pay-name {
      flex: 1;
      color: #fff;
      font-size: 30rpx;
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

    &.active .pay-radio {
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

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
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
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 30rpx;

  .total-info {
    flex: 1;
    .total-label {
      color: #9CA3AF;
      font-size: 28rpx;
    }
    .total-price {
      color: #00BB88;
      font-size: 40rpx;
      font-weight: 700;
    }
  }

  .pay-btn {
    background: #00BB88;
    color: #fff;
    border-radius: 44rpx;
    padding: 24rpx 60rpx;
    font-size: 30rpx;
    font-weight: 600;
    border: none;

    &::after {
      border: none;
    }

    &[disabled] {
      background: rgba(0, 187, 136, 0.3);
      color: rgba(255,255,255,0.5);
    }
  }
}
</style>