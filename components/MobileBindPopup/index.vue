<template>
  <!-- 遮罩层 -->
  <view v-if="visible" class="bind-popup-mask" @click="handleClose">
    <!-- 弹层内容（阻止冒泡） -->
    <view class="bind-popup-wrapper" @click.stop>
      <!-- 顶部栏 -->
      <view class="popup-header">
        <text class="popup-title">{{ title }}</text>
        <view class="popup-close" @click="handleClose">
          <uni-icons type="close" size="20" color="#999" />
        </view>
      </view>

      <!-- 提示文案 -->
      <view class="popup-tip">{{ tip }}</view>

      <!-- 手机号输入 -->
      <view class="input-group">
        <uni-icons type="phone" size="20" color="#00BB88" class="input-icon" />
        <input
          class="input"
          v-model="mobile"
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
            v-model="code"
            placeholder="请输入验证码"
            placeholder-class="placeholder"
            maxlength="6"
            type="number"
          />
        </view>
        <button
          class="btn-code"
          :class="{ 'btn-code-disabled': codeCountdown > 0 }"
          @click="handleSendCode"
          :disabled="codeCountdown > 0 || isSending"
        >
          {{ codeCountdown > 0 ? `${codeCountdown}s重新获取` : (isSending ? '发送中...' : '获取验证码') }}
        </button>
      </view>

      <!-- 确认按钮 -->
      <button class="btn-submit" @click="handleSubmit" :disabled="isSubmitting">
        {{ isSubmitting ? '绑定中...' : submitText }}
      </button>

      <!-- 底部安全区 -->
      <view class="safe-bottom"></view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/store/modules/user'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '绑定手机号'
  },
  tip: {
    type: String,
    default: '预约需要验证手机号，请先绑定'
  },
  submitText: {
    type: String,
    default: '确认绑定'
  }
})

const emit = defineEmits(['close', 'success', 'update:visible'])

const userStore = useUserStore()

const mobile = ref('')
const code = ref('')
const codeCountdown = ref(0)
const isSending = ref(false)
const isSubmitting = ref(false)
let countdownTimer = null

// 显示时重置表单
watch(() => props.visible, (val) => {
  if (val) {
    mobile.value = ''
    code.value = ''
    codeCountdown.value = 0
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }
})

// 手机号格式校验
const isValidMobile = computed(() => {
  return /^1[3-9]\d{9}$/.test(mobile.value)
})

// 关闭弹框
function handleClose() {
  if (isSubmitting.value) return
  emit('close')
  emit('update:visible', false)
}

// 发送验证码
async function handleSendCode() {
  if (!mobile.value) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!isValidMobile.value) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }
  if (codeCountdown.value > 0 || isSending.value) return

  try {
    isSending.value = true
    uni.showLoading({ title: '发送中...' })
    await userStore.sendUpdateMobileSms(mobile.value)
    uni.hideLoading()
    uni.showToast({ title: '验证码已发送', icon: 'success' })

    // 开始倒计时
    codeCountdown.value = 60
    countdownTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    const msg = (error && error.message) || '发送验证码失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    isSending.value = false
  }
}

// 提交绑定
async function handleSubmit() {
  if (!mobile.value) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!isValidMobile.value) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }
  if (!code.value) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  if (isSubmitting.value) return

  try {
    isSubmitting.value = true
    uni.showLoading({ title: '绑定中...', mask: true })
    await userStore.bindMobile({
      mobile: mobile.value,
      code: code.value
    })
    uni.hideLoading()
    uni.showToast({ title: '绑定成功', icon: 'success' })

    // 刷新用户信息
    try {
      await userStore.fetchUserInfo()
    } catch (e) {
      console.warn('[MobileBindPopup] 刷新用户信息失败:', e)
    }

    // 延迟关闭，让用户看到成功提示
    setTimeout(() => {
      emit('success', { mobile: mobile.value })
      emit('update:visible', false)
    }, 1200)
  } catch (error) {
    uni.hideLoading()
    const msg = (error && error.message) || '绑定失败，请重试'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.bind-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bind-popup-wrapper {
  width: 100%;
  background: var(--bg-card);
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx 48rpx 32rpx;
  box-sizing: border-box;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;

  .popup-title {
    font-size: 36rpx;
    font-weight: bold;
    color: var(--text-primary);
  }

  .popup-close {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.popup-tip {
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-bottom: 32rpx;
  line-height: 1.5;
}

.input-group {
  width: 100%;
  height: 96rpx;
  background: var(--bg-secondary);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  padding: 0 0 0 32rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
  position: relative;

  .input-icon {
    margin-right: 16rpx;
  }

  .input {
    flex: 1;
    font-size: 32rpx;
    color: var(--text-primary);
    line-height: 1;
  }

  .placeholder {
    color: var(--text-secondary);
  }
}

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

.btn-submit {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: #00BB88;
  color: #fff;
  border-radius: 48rpx;
  font-size: 36rpx;
  font-weight: bold;
  margin-top: 16rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(0, 187, 136, 0.3);
  &::after { border: none; }
  &[disabled] {
    opacity: 0.6;
  }
}

.safe-bottom {
  height: env(safe-area-inset-bottom);
}
</style>
