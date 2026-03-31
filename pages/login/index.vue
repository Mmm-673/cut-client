<template>
  <view class="login-wrapper">
    <!-- 顶部Logo区域 -->
    <view class="logo-section">
      <view class="logo-circle">
        <text class="logo-text">⑧</text>
      </view>
      <text class="app-name">台球约</text>
      <text class="app-desc">专业台球陪练平台</text>
    </view>

    <!-- 表单区域 -->
    <view class="form-section">
      <!-- 手机号输入 -->
      <view class="input-group">
        <uni-icons type="phone" size="20" color="#00BB88" class="input-icon" />
        <input
            class="input"
            v-model="form.phone"
            placeholder="请输入手机号"
            placeholder-class="placeholder"
            maxlength="11"
            type="number"
        />
      </view>

      <!-- 验证码输入 + 获取按钮 -->
      <view class="input-group input-group-row">
        <view class="input-wrap">
          <uni-icons type="locked" size="20" color="#00BB88" class="input-icon" />
          <input
              class="input"
              v-model="form.code"
              placeholder="请输入验证码"
              placeholder-class="placeholder"
              maxlength="6"
              type="number"
          />
        </view>
        <button
            class="btn-code"
            :class="{ 'btn-code-disabled': codeCountdown > 0 }"
            @click="getCode"
        >{{ codeCountdown > 0 ? `${codeCountdown}s重新获取` : '获取验证码' }}</button>
      </view>

      <!-- 登录/注册按钮 -->
      <button class="btn-submit" @click="handleSubmit">登录 / 注册</button>

      <!-- 切换登录方式 -->
      <view class="switch-login">
        <text class="switch-text" @click="goToAccountLogin">账号密码登录</text>
      </view>

      <!-- 其他登录方式分割线 -->
      <view class="divider">
        <text class="divider-text">其他登录方式</text>
      </view>

      <!-- 微信一键登录 -->
      <view class="wechat-login" @click="wechatLogin">
        <view class="wechat-circle">
          <text class="wechat-icon">💬</text>
          <!-- 如果有官方图标可以替换成image：
          <image src="/static/wechat-icon.png" class="wechat-icon" mode="aspectFill"></image>
          -->
        </view>
        <text class="wechat-text">微信一键登录</text>
      </view>
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
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 表单数据
const form = ref({
  phone: '',
  code: ''
})

// 验证码倒计时
const codeCountdown = ref(0)
let countdownTimer = null

// 协议勾选
const agree = ref(true)

// 验证手机号
const checkPhone = () => {
  const phoneReg = /^1[3-9]\d{9}$/
  if (!form.value.phone) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return false
  }
  if (!phoneReg.test(form.value.phone)) {
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
const getCode = () => {
  if (!checkPhone()) return
  if (codeCountdown.value > 0) return

  // 调用后端接口获取验证码
  uni.showLoading({ title: '发送中...' })
  setTimeout(() => {
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
  }, 1000)
}

// 提交登录/注册
const handleSubmit = () => {
  if (!checkPhone()) return
  if (!form.value.code) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }

  // 调用后端登录接口，这里模拟
  uni.showLoading({ title: '登录中...' })
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })
    // 登录成功跳首页
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1000)
  }, 1500)
}

// 跳转到账号密码登录
const goToAccountLogin = () => {
  uni.navigateTo({ url: '/pages/login/account-login' })
}

// 微信一键登录（多端兼容）
const wechatLogin = () => {
  if (!agree.value) {
    uni.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })
    return
  }

  // #ifdef MP-WEIXIN
  // 小程序微信登录
  uni.login({
    success: (res) => {
      // 拿code换后端openid，自行替换接口逻辑
      console.log('微信登录code', res.code)
      uni.showLoading({ title: '登录中...' })
    },
    fail: () => {
      uni.showToast({ title: '微信登录失败', icon: 'none' })
    }
  })
  // #endif

  // #ifdef APP-PLUS
  // APP微信登录，需要集成微信开放SDK，自行替换
  uni.showToast({ title: '正在发起微信登录', icon: 'none' })
  // #endif

  // #ifdef H5
  // H5微信登录
  uni.showToast({ title: '正在发起微信登录', icon: 'none' })
  // #endif
}

// 跳转用户协议/隐私政策
const goToAgree = (type) => {
  // 可以换成你自己的协议页面
  uni.navigateTo({
    url: type === 'user'
        ? '/pages/agreement/user'
        : '/pages/agreement/privacy'
  })
}

// 页面卸载清除计时器
onUnload(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style lang="scss" scoped>
.login-wrapper {
  min-height: 100vh;
  background: #1E252B;
  padding: 100rpx 48rpx 40rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: calc(120rpx + var(--status-bar-height));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

/* Logo区域 */
.logo-section {
  text-align: center;
  margin-bottom: 100rpx;
  .logo-circle {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: #00BB88;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 32rpx;
  }
  .logo-text {
    font-size: 64rpx;
    color: #fff;
    font-weight: bold;
    border: 6rpx solid #fff;
    width: 50rpx;
    height: 50rpx;
    line-height: 50rpx;
    text-align: center;
    border-radius: 50%;
  }
  .app-name {
    display: block;
    font-size: 64rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 16rpx;
  }
  .app-desc {
    display: block;
    font-size: 32rpx;
    color: #9CA3AF;
  }
}

/* 表单区域 */
.form-section {
  width: 100%;
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
    margin: 16rpx 0 24rpx;
    border: none;
    box-shadow: 0 8rpx 24rpx rgba(0, 187, 136, 0.3);
    &::after { border: none; }
  }

  /* 切换登录方式 */
  .switch-login {
    text-align: right;
    margin-bottom: 48rpx;
    .switch-text {
      font-size: 26rpx;
      color: #9CA3AF;
      text-decoration: underline;
    }
  }

  /* 分割线 */
  .divider {
    position: relative;
    text-align: center;
    margin-bottom: 40rpx;
    &::before, &::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 40%;
      height: 1rpx;
      background: #2A3138;
    }
    &::before { left: 0; }
    &::after { right: 0; }
    .divider-text {
      font-size: 28rpx;
      color: #9CA3AF;
      padding: 0 16rpx;
      background: #1E252B;
    }
  }

  /* 微信登录 */
  .wechat-login {
    text-align: center;
    .wechat-circle {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16rpx;
    }
    .wechat-icon {
      font-size: 52rpx;
      color: #07C160;
    }
    /* 如果用图片就用这个样式：
    .wechat-icon {
      width: 60rpx;
      height: 50rpx;
    }
    */
    .wechat-text {
      font-size: 28rpx;
      color: #9CA3AF;
    }
  }
}

/* 底部协议 */
.agreement {
  position: absolute;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: 48rpx;
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