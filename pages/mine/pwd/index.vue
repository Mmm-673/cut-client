<template>
  <view class="set-pwd-wrapper">

    <scroll-view
        scroll-y
        class="pwd-scroll"
        :show-scrollbar="false"
    >
      <!-- 标题区域 -->
      <view class="title-section">
        <text class="main-title">设置新密码</text>
        <text class="sub-title">请设置8-16位包含字母和数字的密码</text>
      </view>

      <!-- 输入框区域 -->
      <view class="input-section">
        <!-- 新密码 -->
        <view class="input-box">
          <uni-icons type="locked" size="24" color="#00BB88" />
          <input
              class="input-field"
              :type="showPass1 ? 'text' : 'password'"
              v-model="newPassword"
              placeholder="请输入新密码"
              placeholder-class="input-placeholder"
              maxlength="16"
          />
          <view class="eye-btn" @click="showPass1 = !showPass1">
            <uni-icons :type="showPass1 ? 'eye' : 'eye-slash'" size="22" color="#9CA3AF" />
          </view>
        </view>

        <!-- 密码强度 -->
        <view class="strength-box" v-if="newPassword">
          <view class="strength-bar">
            <view class="bar-item" :class="strengthClass[0]"></view>
            <view class="bar-item" :class="strengthClass[1]"></view>
            <view class="bar-item" :class="strengthClass[2]"></view>
          </view>
          <text class="strength-text" :style="{color: strengthTextColor}">{{ strengthText }}</text>
        </view>

        <!-- 确认密码 -->
        <view class="input-box" style="margin-top: 30rpx;">
          <uni-icons type="locked" size="24" color="#00BB88" />
          <input
              class="input-field"
              :type="showPass2 ? 'text' : 'password'"
              v-model="confirmPassword"
              placeholder="请再次确认密码"
              placeholder-class="input-placeholder"
              maxlength="16"
          />
          <view class="eye-btn" @click="showPass2 = !showPass2">
            <uni-icons :type="showPass2 ? 'eye' : 'eye-slash'" size="22" color="#9CA3AF" />
          </view>
        </view>
      </view>

      <!-- 完成按钮 -->
      <view class="btn-section">
        <button
            class="submit-btn"
            :class="{disabled: !isBtnActive || isSubmitting}"
            :disabled="!isBtnActive || isSubmitting"
            @click="submitForm"
        >
          {{ isSubmitting ? '提交中...' : '完成' }}
        </button>
      </view>

      <!-- 用户协议与隐私政策 -->
      <view class="agreement-section">
        <view class="agreement-row" @click="userAgree = !userAgree">
          <view class="checkbox-box" :class="{checked: userAgree}">
            <uni-icons v-if="userAgree" type="checkmarkempty" size="20" color="#fff" />
          </view>
          <text class="agreement-text">我已阅读并同意</text>
          <text class="agreement-link" @click.stop="toAgreement('user')">《用户协议》</text>
          <text class="agreement-text">和</text>
          <text class="agreement-link" @click.stop="toAgreement('privacy')">《隐私政策》</text>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from  "@dcloudio/uni-app"

// ---------------------- 状态定义 ----------------------
// 密码输入框显示状态
const showPass1 = ref(false)
const showPass2 = ref(false)
// 密码值
const newPassword = ref('')
const confirmPassword = ref('')
// 用户协议勾选状态
const userAgree = ref(true) // 默认勾选更符合用户习惯，与设计图一致
// 提交中状态
const isSubmitting = ref(false)

// ---------------------- 密码强度逻辑 ----------------------
const strengthInfo = computed(() => {
  const pwd = newPassword.value
  if (!pwd) return { text: '', textColor: '#6B7280', class: ['', '', ''] }
  if (pwd.length < 8) return { text: '弱', textColor: '#EF4444', class: ['active-weak', '', ''] }
  const hasLetter = /[a-zA-Z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  if (hasLetter && hasNumber && pwd.length >= 8 && pwd.length <= 16) {
    return { text: '强', textColor: '#00BB88', class: ['active-strong', 'active-strong', 'active-strong'] }
  } else {
    return { text: '中', textColor: '#FBBF24', class: ['active-medium', 'active-medium', ''] }
  }
})

// 简化的子属性引用（避免模板过长）
const strengthText = computed(() => strengthInfo.value.text)
const strengthTextColor = computed(() => strengthInfo.value.textColor)
const strengthClass = computed(() => strengthInfo.value.class)

// ---------------------- 完成按钮激活逻辑 ----------------------
const isBtnActive = computed(() => {
  const pwd = newPassword.value
  const confirm = confirmPassword.value
  // 激活条件：
  // 1. 新密码长度≥8
  // 2. 确认密码不为空
  // 3. 已勾选协议
  if (pwd.length < 8 || !confirm || !userAgree.value) return false
  // 额外友好条件：确认密码和新密码长度一致时，更大概率是对的
  if (pwd.length !== confirm.length) return false
  return true
})

// ---------------------- 交互方法 ----------------------
const goBack = () => {
  uni.navigateBack()
}

const toAgreement = (type) => {
  uni.showToast({
    title: type === 'user' ? '用户协议功能开发中' : '隐私政策功能开发中',
    icon: 'none'
  })
  // uni.navigateTo({ url: `/pages/agreement/${type}` })
}

// 表单验证
const validateForm = () => {
  const pwd = newPassword.value
  const confirm = confirmPassword.value

  // 检查新密码格式
  if (pwd.length < 8 || pwd.length > 16) {
    uni.showToast({ title: '请设置8-16位密码', icon: 'none' })
    return false
  }
  if (!/[a-zA-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
    uni.showToast({ title: '密码需包含字母和数字', icon: 'none' })
    return false
  }

  // 检查确认密码
  if (pwd !== confirm) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return false
  }

  // 检查协议
  if (!userAgree.value) {
    uni.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
    return false
  }

  return true
}

// 提交表单
const submitForm = async () => {
  if (!validateForm() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    // TODO: 这里调用后端「设置新密码」接口
    await new Promise(resolve => setTimeout(resolve, 1500)) // 模拟请求延迟

    // 成功后的逻辑
    uni.showToast({ title: '密码设置成功', icon: 'success' })
    setTimeout(() => {
      // 根据场景跳转：比如从忘记密码来的跳登录，从修改密码来的跳个人中心
      uni.reLaunch({ url: '/pages/login/index' })
      // 或者 uni.navigateBack({ delta: 2 })
    }, 1500)
  } catch (error) {
    console.error('密码设置失败:', error)
    uni.showToast({ title: '密码设置失败，请重试', icon: 'none' })
  } finally {
    isSubmitting.value = false
  }
}

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  // 页面加载时清空可能的历史值
  newPassword.value = ''
  confirmPassword.value = ''
  userAgree.value = true
  showPass1.value = false
  showPass2.value = false
})

onShow(() => {
  // 页面显示时可以重置焦点
})
</script>

<style lang="scss" scoped>
.set-pwd-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏（只保留返回） */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + constant(safe-area-inset-top));
  padding-top: calc(20rpx + env(safe-area-inset-top));
  .nav-back, .nav-placeholder {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
  .nav-placeholder {
    justify-content: flex-end;
  }
}

.pwd-scroll {
  flex: 1;
  width: 100%;
  padding: 0 30rpx;
}

/* 标题区域 */
.title-section {
  margin: 60rpx 0 80rpx;
  .main-title {
    display: block;
    color: #fff;
    font-size: 52rpx;
    font-weight: 700;
    margin-bottom: 20rpx;
  }
  .sub-title {
    display: block;
    color: #9CA3AF;
    font-size: 28rpx;
  }
}

/* 输入框区域 */
.input-section {
  margin-bottom: 80rpx;
  .input-box {
    display: flex;
    align-items: center;
    gap: 16rpx;
    background: #1E252B;
    border-radius: 24rpx;
    padding: 24rpx 30rpx;
    .input-field {
      flex: 1;
      color: #fff;
      font-size: 32rpx;
      line-height: 1.5;
    }
    .input-placeholder {
      color: #6B7280;
    }
    .eye-btn {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
  }
}

/* 密码强度 */
.strength-box {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
  padding-left: 8rpx;
  .strength-bar {
    flex: 1;
    display: flex;
    gap: 8rpx;
    .bar-item {
      flex: 1;
      height: 8rpx;
      background: #2a3338;
      border-radius: 4rpx;
      &.active-weak {
        background: #EF4444;
      }
      &.active-medium {
        background: #FBBF24;
      }
      &.active-strong {
        background: #00BB88;
      }
    }
  }
  .strength-text {
    font-size: 26rpx;
    width: 60rpx;
    text-align: right;
  }
}

/* 完成按钮 */
.btn-section {
  margin-bottom: 60rpx;
  .submit-btn {
    width: 100%;
    height: 96rpx;
    line-height: 96rpx;
    background: #00BB88;
    color: #fff;
    border-radius: 48rpx;
    font-size: 34rpx;
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

/* 用户协议与隐私政策 */
.agreement-section {
  margin-bottom: 40rpx;
  .agreement-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6rpx;
    padding: 0 8rpx;
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
      font-size: 26rpx;
    }
    .agreement-link {
      color: #00BB88;
      font-size: 26rpx;
    }
  }
}

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>