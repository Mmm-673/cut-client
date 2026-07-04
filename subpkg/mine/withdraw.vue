<template>
  <view class="withdraw-wrapper">
    <!-- 余额信息 -->
    <view class="balance-card">
      <view class="balance-label">可提现余额</view>
      <view class="balance-amount">¥{{ withdrawableBalance }}</view>
      <view class="balance-tip">当前可申请：¥{{ availableWithdrawBalance }}</view>
    </view>

    <!-- 提现金额 -->
    <view class="section-card">
      <view class="section-title">提现金额</view>
      <view class="amount-input-wrap">
        <text class="currency">¥</text>
        <input
            class="amount-input"
            type="digit"
            v-model="withdrawAmount"
            placeholder="请输入提现金额"
            placeholder-class="input-placeholder"
            @input="onAmountInput"
        />
      </view>
      <view class="balance-info">
        <text>可提现余额：¥{{ withdrawableBalance }}</text>
        <text class="all-btn" @click="withdrawAll">全部</text>
      </view>
    </view>

    <!-- 到账方式 -->
    <view class="section-card">
      <view class="section-title">到账方式</view>
      <view class="channel-list">
<!--        <view-->
<!--            class="channel-item"-->
<!--            :class="{active: accountType === 1}"-->
<!--            @click="selectChannel(1)"-->
<!--        >-->
<!--          <view class="channel-icon">-->
<!--            <image src="/static/images/pay/wechat.png" class="channel-icon-img" mode="aspectFit" />-->
<!--          </view>-->
<!--          <text class="channel-name">提现到微信</text>-->
<!--          <view class="channel-radio">-->
<!--            <view class="radio-dot" v-if="accountType === 1"></view>-->
<!--          </view>-->
<!--        </view>-->
        <view
            class="channel-item"
            :class="{active: accountType === 2}"
            @click="selectChannel(2)"
        >
          <view class="channel-icon">
            <image src="/static/images/pay/alipay.png" class="channel-icon-img" mode="aspectFit" />
          </view>
          <text class="channel-name">提现到支付宝</text>
          <view class="channel-radio">
            <view class="radio-dot" v-if="accountType === 2"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 账户信息 -->
    <view class="section-card" v-if="accountType">
      <view class="section-title">账户信息</view>
      <view class="input-group">
        <text class="input-label">{{ accountType === 1 ? '微信账号' : '支付宝账号' }}</text>
        <input
            class="input-field"
            v-model="accountNo"
            :placeholder="accountType === 1 ? '请输入微信账号' : '请输入支付宝账号'"
            placeholder-class="input-placeholder"
        />
      </view>
      <view class="input-group">
        <text class="input-label">真实姓名</text>
        <input
            class="input-field"
            v-model="realName"
            placeholder="请输入真实姓名"
            placeholder-class="input-placeholder"
        />
      </view>
    </view>

    <!-- 提示信息 -->
    <view class="tip-card">
      <view class="tip-title">提现规则</view>
      <view class="tip-item">1. 可提现额度：钱包中的可提现余额均可申请提现</view>
      <view class="tip-item">2. 提现限额：单笔最低提现1元，无最高限额</view>
      <view class="tip-item">3. 提现次数：每日最多可申请3次提现</view>
      <view class="tip-item">4. 提现时间：全天24小时可提交申请，工作日处理</view>
      <view class="tip-item">5. 到账时间：申请提交后，预计1-3个工作日到账</view>
      <view class="tip-item">6. 到账方式：提现金额将直接转入您填写的账户</view>
      <view class="tip-item">7. 注意事项：请确保填写的账户信息准确无误，如因信息错误导致提现失败或资金损失，需自行承担责任</view>
      <view class="tip-item">8. 客服支持：如有问题请联系平台客服处理</view>
      <view class="tip-item">9. 失败处理：若提现失败，资金将原路退回您的可提现余额，请注意查看</view>
    </view>

    <!-- 底部安全区域 -->
    <view class="safe-area-bottom"></view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <button class="submit-btn" :disabled="!canWithdraw || isSubmitting" @click="handleWithdraw">
        {{ isSubmitting ? '处理中...' : '确认提现' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getWithdrawableBalance, createWithdrawal } from '@/api/billiard/wallet'

// 可提现余额
const withdrawableBalance = ref('0.00')
// 当前可申请
const availableWithdrawBalance = ref('0.00')

// 提现金额
const withdrawAmount = ref('')

// 到账方式：1-微信，2-支付宝
const accountType = ref(2)

// 账户信息
const accountNo = ref('')
const realName = ref('')

// 防重复提交
const isSubmitting = ref(false)

// 加载可提现余额
const loadWithdrawableBalance = async () => {
  try {
    const res = await getWithdrawableBalance()
    console.log(res,'==walletBalance')
    if (res.data) {
      withdrawableBalance.value = (res.data.walletBalance / 100).toFixed(2)
      availableWithdrawBalance.value = (res.data.walletBalance / 100).toFixed(2)
    }
  } catch (error) {
    console.error('加载可提现余额失败:', error)
  }
}

// 输入金额时检查
const onAmountInput = () => {
  // 限制只能输入数字，最多两位小数
  let value = withdrawAmount.value
  value = value.replace(/[^\d.]/g, '')
  const parts = value.split('.')
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts[1] && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].slice(0, 2)
  }
  withdrawAmount.value = value
}

// 全部提现
const withdrawAll = () => {
  withdrawAmount.value = availableWithdrawBalance.value
}

// 选择到账方式
const selectChannel = (type) => {
  accountType.value = type
  accountNo.value = ''
  realName.value = ''
}

// 是否可以提现
const canWithdraw = computed(() => {
  const amount = parseFloat(withdrawAmount.value)
  const available = parseFloat(availableWithdrawBalance.value)
  if (!amount || amount <= 0) return false
  if (amount > available) return false
  if (!accountNo.value.trim()) return false
  if (!realName.value.trim()) return false
  return true
})

// 处理提现
const handleWithdraw = async () => {
  if (isSubmitting.value) return

  const amount = parseFloat(withdrawAmount.value)
  const available = parseFloat(availableWithdrawBalance.value)

  if (!amount || amount <= 0) {
    uni.showToast({ title: '请输入提现金额', icon: 'none' })
    return
  }

  if (amount > available) {
    uni.showToast({ title: '余额不足', icon: 'none' })
    return
  }

  if (!accountNo.value.trim()) {
    uni.showToast({ title: '请输入账号', icon: 'none' })
    return
  }

  if (!realName.value.trim()) {
    uni.showToast({ title: '请输入真实姓名', icon: 'none' })
    return
  }

  isSubmitting.value = true
  uni.showLoading({ title: '提交中...' })

  try {
    // 调用提现接口
    await createWithdrawal({
      amount: Math.round(parseFloat(withdrawAmount.value) * 100),
      accountType: accountType.value,
      accountNo: accountNo.value,
      realName: realName.value
    })

    uni.hideLoading()
    uni.showToast({ title: '提现申请已提交', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    uni.hideLoading()
    console.error('提现失败:', error)
    uni.showToast({ title: error.message || '提现失败', icon: 'none' })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadWithdrawableBalance()
})
</script>

<style lang="scss" scoped>
.withdraw-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-bottom: 200rpx;
}

/* 余额卡片 */
.balance-card {
  margin: 30rpx;
  background: linear-gradient(135deg, #00BB88 0%, #059669 100%);
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  .balance-label {
    color: rgba(255,255,255,0.8);
    font-size: 26rpx;
    margin-bottom: 12rpx;
  }
  .balance-amount {
    color: #fff;
    font-size: 56rpx;
    font-weight: bold;
    margin-bottom: 8rpx;
  }
  .balance-tip {
    color: rgba(255,255,255,0.7);
    font-size: 24rpx;
  }
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

/* 金额输入 */
.amount-input-wrap {
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid rgba(255,255,255,0.1);
  padding-bottom: 20rpx;
  margin-bottom: 20rpx;

  .currency {
    color: #fff;
    font-size: 48rpx;
    font-weight: bold;
    margin-right: 16rpx;
  }

  .amount-input {
    flex: 1;
    color: #fff;
    font-size: 48rpx;
    font-weight: bold;
  }
}

.input-placeholder {
  color: #6B7280;
  font-size: 32rpx;
}

.balance-info {
  display: flex;
  justify-content: space-between;
  align-items: center;

  text {
    color: #9CA3AF;
    font-size: 26rpx;
  }

  .all-btn {
    color: #00BB88;
    font-size: 26rpx;
  }
}

/* 到账方式 */
.channel-list {
  .channel-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid rgba(255,255,255,0.05);

    &:last-child {
      border-bottom: none;
    }

    .channel-icon {
      width: 70rpx;
      height: 70rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;

      .channel-icon-img {
        width: 56rpx;
        height: 56rpx;
      }
    }

    .channel-name {
      flex: 1;
      color: #fff;
      font-size: 30rpx;
    }

    .channel-radio {
      width: 40rpx;
      height: 40rpx;
      border: 3rpx solid #2a3338;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &.active .channel-radio {
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

/* 账户信息 */
.input-group {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.05);

  &:last-child {
    border-bottom: none;
  }

  .input-label {
    width: 160rpx;
    color: #9CA3AF;
    font-size: 28rpx;
  }

  .input-field {
    flex: 1;
    color: #fff;
    font-size: 28rpx;
    text-align: right;
  }
}

/* 提示信息 */
.tip-card {
  margin: 30rpx;
  background: rgba(251, 191, 36, 0.1);
  border: 1rpx solid rgba(251, 191, 36, 0.3);
  border-radius: 16rpx;
  padding: 24rpx;

  .tip-title {
    color: #FBBF24;
    font-size: 28rpx;
    font-weight: 600;
    margin-bottom: 16rpx;
  }

  .tip-item {
    color: #9CA3AF;
    font-size: 26rpx;
    line-height: 1.8;
  }
}

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}

/* 底部按钮 */
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

  .submit-btn {
    width: 100%;
    height: 88rpx;
    background: #00BB88;
    color: #fff;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;

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
