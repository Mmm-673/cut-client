<template>
  <view class="reset-wrapper">
    <!-- 返回按钮 -->
    <view class="back-btn" @click="goBack">
      <uni-icons type="back" size="24" color="#fff" />
    </view>

    <!-- 标题区域 -->
    <view class="title-section">
      <text class="title">重置密码</text>
      <text class="subtitle">请填写以下信息完成密码重置</text>
    </view>

    <!-- 表单区域 -->
    <view class="form-section">
      <!-- 手机号输入 -->
      <view class="input-group">
        <uni-icons type="phone" size="20" color="#00BB88" class="input-icon" />
        <input
          class="input"
          v-model="form.mobile"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-class="placeholder"
        />
      </view>

      <!-- 验证码输入 + 获取按钮 -->
      <view class="input-group input-group-row">
        <view class="input-wrap">
          <uni-icons type="locked" size="20" color="#00BB88" class="input-icon" />
          <input
            class="input"
            v-model="form.code"
            type="number"
            maxlength="6"
            placeholder="请输入验证码"
            placeholder-class="placeholder"
          />
        </view>
        <button
          class="btn-code"
          :class="{ 'btn-code-disabled': codeCountdown > 0 }"
          @click="getCode"
          :disabled="codeCountdown > 0"
        >{{ codeCountdown > 0 ? `${codeCountdown}s重新获取` : '获取验证码' }}</button>
      </view>

      <!-- 新密码输入 -->
      <view class="input-group">
        <uni-icons type="locked" size="20" color="#00BB88" class="input-icon" />
        <input
          class="input"
          v-model="form.password"
          :password="!showPassword"
          maxlength="16"
          placeholder="请输入新密码（4-16位）"
          placeholder-class="placeholder"
        />
        <uni-icons
          :type="showPassword ? 'eye' : 'eye-slash'"
          size="20"
          color="#9CA3AF"
          class="password-eye"
          @click="showPassword = !showPassword"
        />
      </view>

      <!-- 密码提示 -->
      <view class="pwd-tip">密码长度4-16位，可包含字母、数字和特殊字符</view>

      <!-- 确认修改按钮 -->
      <button class="btn-submit" @click="handleReset" :disabled="isSubmitting">
        {{ isSubmitting ? '提交中...' : '确认修改' }}
      </button>
    </view>

    <!-- 底部协议 -->
    <view class="agreement">
      <view
        class="checkbox"
        :class="{ 'checkbox-checked': agree }"
        @click="agree = !agree"
      >
        <uni-icons v-if="agree" type="check" size="16" color="#fff" />
      </view>
      <text class="agreement-text">
        我已阅读并同意
        <text class="link" @click="goToAgree('user')">《用户协议》</text>
        和
        <text class="link" @click="goToAgree('privacy')">《隐私政策》</text>
      </text>
    </view>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

// 表单数据
const form = ref({
  mobile: '',
  code: '',
  password: ''
})

// 验证码倒计时
const codeCountdown = ref(0)
let countdownTimer = null

// 协议勾选
const agree = ref(true)

// 显示密码
const showPassword = ref(false)

// 提交中状态
const isSubmitting = ref(false)

// 返回上一页
const goBack = () => {
  uni.navigateBack({
    fail: () => {
      uni.reLaunch({ url: '/pages/login/index' })
    }
  })
}

// 验证手机号
const checkPhone = () => {
  const phoneReg = /^1[3-9]\d{9}$/
  if (!form.value.mobile) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return false
  }
  if (!phoneReg.test(form.value.mobile)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return false
  }
  if (!agree.value) {
    uni.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })
    return false
  }
  return true
}

// 获取验证码
const getCode = async () => {
  if (!checkPhone()) return
  if (codeCountdown.value > 0) return

  try {
    uni.showLoading({ title: '发送中...' })
    // scene: 4 = 重置密码
    await userStore.sendCode(form.value.mobile, 4)
    uni.hideLoading()
    uni.showToast({ title: '验证码已发送', icon: 'success' })

    // 开始倒计时
    codeCountdown.value = 60
    countdownTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        clearInterval(countdownTimer)
      }
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    console.error('发送验证码失败:', error)
  }
}

// 提交重置密码
const handleReset = async () => {
  if (!checkPhone()) return
  if (!form.value.code) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  if (!form.value.password) {
    uni.showToast({ title: '请输入新密码', icon: 'none' })
    return
  }
  if (form.value.password.length < 4 || form.value.password.length > 16) {
    uni.showToast({ title: '密码长度需要4-16位', icon: 'none' })
    return
  }

  try {
    isSubmitting.value = true
    uni.showLoading({ title: '提交中...' })

    await userStore.resetPassword({
      mobile: form.value.mobile,
      code: form.value.code,
      password: form.value.password
    })

    uni.hideLoading()
    uni.showToast({ title: '密码重置成功', icon: 'success' })

    // 重置成功后跳转到登录页
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/login/index' })
    }, 1500)
  } catch (error) {
    uni.hideLoading()
    console.error('重置密码失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

// 跳转用户协议/隐私政策
const goToAgree = (type) => {
  uni.navigateTo({
    url: type === 'user'
      ? '/pages/common/textview/index?type=user'
      : '/pages/common/textview/index?type=privacy'
  })
}

// 页面卸载清除计时器
onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style lang="scss" scoped>
.reset-wrapper {
  min-height: 100vh;
  background: #1E252B;
  padding: 0 48rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding-top: calc(40rpx + var(--status-bar-height));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  position: relative;
}

/* 返回按钮 */
.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

/* 标题区域 */
.title-section {
  margin-bottom: 60rpx;
  .title {
    display: block;
    font-size: 64rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 16rpx;
  }
  .subtitle {
    display: block;
    font-size: 28rpx;
    color: #9CA3AF;
  }
}

/* 表单区域 */
.form-section {
  .input-group {
    width: 100%;
    height: 96rpx;
    background: #2A3138;
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    margin-bottom: 32rpx;
    box-sizing: border-box;
    position: relative;
    .input-icon {
      margin-right: 16rpx;
    }
    .input {
      flex: 1;
      font-size: 32rpx;
      color: #fff;
      line-height: 1;
    }
    .placeholder {
      color: #9CA3AF;
    }
    .password-eye {
      margin-left: 16rpx;
    }
  }
  /* 行内输入（验证码+按钮） */
  .input-group-row {
    display: flex;
    gap: 16rpx;
    .input-wrap {
      flex: 1;
      display: flex;
      align-items: center;
    }
  }
  .btn-code {
    padding: 0 32rpx;
    height: 96rpx;
    line-height: 96rpx;
    background: #00BB88;
    color: #fff;
    border-radius: 48rpx;
    font-size: 28rpx;
    white-space: nowrap;
    border: none;
    &::after { border: none; }
  }
  .btn-code-disabled {
    background: #00BB8880 !important;
    color: #ccc !important;
  }

  /* 密码提示 */
  .pwd-tip {
    font-size: 26rpx;
    color: #9CA3AF;
    margin: -10rpx 0 40rpx 20rpx;
  }

  /* 提交按钮 */
  .btn-submit {
    width: 100%;
    height: 96rpx;
    line-height: 96rpx;
    background: #00BB88;
    color: #fff;
    border-radius: 48rpx;
    font-size: 36rpx;
    font-weight: bold;
    margin: 16rpx 0 48rpx;
    border: none;
    box-shadow: 0 8rpx 24rpx rgba(0, 187, 136, 0.3);
    &::after { border: none; }
    &[disabled] {
      opacity: 0.6;
    }
  }
}

/* 底部协议 */
.agreement {
  position: absolute;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: 48rpx;
  right: 48rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  .checkbox {
    width: 32rpx;
    height: 32rpx;
    border: 2rpx solid #00BB88;
    border-radius: 6rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .checkbox-checked {
    background: #00BB88;
  }
  .agreement-text {
    font-size: 26rpx;
    color: #9CA3AF;
    line-height: 1.4;
  }
  .link {
    color: #00BB88;
  }
}

/* 覆盖uni-icons默认边距 */
:deep(.uni-icons) {
  margin-right: 0 !important;
}
</style>
