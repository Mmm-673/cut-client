<template>
  <view class="setting-wrapper">

    <scroll-view
        scroll-y
        class="setting-scroll"
    >
      <!-- 菜单列表 -->
      <view class="menu-section">
        <view class="menu-card">
          <!-- 修改密码 -->
          <view class="menu-item" @click="goToPwd">
            <view class="menu-left">
              <view class="menu-icon-box" style="background: rgba(0, 187, 136, 0.2);">
                <uni-icons type="locked" size="24" color="#00BB88" />
              </view>
              <text class="menu-text">修改密码</text>
            </view>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>

          <!-- 检查更新 -->
          <view class="menu-item" @click="checkUpgrade">
            <view class="menu-left">
              <view class="menu-icon-box" style="background: rgba(59, 130, 246, 0.2);">
                <uni-icons type="refresh-filled" size="24" color="#3B82F6" />
              </view>
              <text class="menu-text">检查更新</text>
            </view>
            <view class="menu-right">
              <text class="menu-meta">v1.0.0</text>
              <uni-icons type="right" size="20" color="#9CA3AF" />
            </view>
          </view>

        </view>
        <view class="agreement-text">
          我已阅读并同意
          <text class="link" @click="goToAgree('user')">《用户协议》</text>
          和
          <text class="link" @click="goToAgree('privacy')">《隐私政策》</text>
        </view>
      </view>

      <!-- 统一的退出登录按钮 -->
      <view class="logout-section" v-if="isLoggedIn">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
        <button class="cancel-account-btn" @click="openCancelAccountPopup">账号注销</button>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>

    <view v-if="showCancelAccountPopup" class="cancel-account-popup">
      <view class="cancel-account-mask" @click="closeCancelAccountPopup"></view>
      <view class="cancel-account-panel">
        <view class="cancel-account-title">账号注销</view>
        <view class="cancel-account-tip">注销后将退出登录</view>
        <textarea
          v-model="cancelReason"
          class="cancel-account-textarea"
          maxlength="255"
          placeholder="请输入注销原因（选填）"
          :disabled="isCancelingAccount"
        />
        <view class="cancel-account-actions">
          <view class="cancel-account-cancel" :class="{ disabled: isCancelingAccount }" @click="closeCancelAccountPopup">取消</view>
          <view class="cancel-account-confirm" :class="{ disabled: isCancelingAccount }" @click="handleCancelAccount">
            {{ isCancelingAccount ? '注销中...' : '确认注销' }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from  "@dcloudio/uni-app"
import { useUserStore } from '@/store'
import { cancelAccount } from '@/api/billiard/user'

// ---------------------- 状态定义 ----------------------
const userStore = useUserStore()


// 是否登录
const isLoggedIn = computed(() => userStore.checkLoggedIn())
const showCancelAccountPopup = ref(false)
const cancelReason = ref('')
const isCancelingAccount = ref(false)
const agreementUrls = {
  user: 'https://www.baidu.com',
  privacy: 'https://www.baidu.com'
}

// ---------------------- 交互方法 ----------------------
const goBack = () => {
  uni.navigateBack()
}

// 跳转修改密码
const goToPwd = () => {
  uni.navigateTo({
    url: '/subpkg/mine/pwd'
  })
}

const goToAgree = (type) => {
  const title = type === 'user' ? '用户协议' : '隐私政策'
  uni.navigateTo({
    url: `/subpkg/common/webview?url=${encodeURIComponent(agreementUrls[type])}&title=${encodeURIComponent(title)}`
  })
}

// 检查更新
const checkUpgrade = () => {
  // #ifdef MP-WEIXIN
  const updateManager = uni.getUpdateManager()
  uni.showLoading({ title: '检查中...' })
  updateManager.onCheckForUpdate((res) => {
    uni.hideLoading()
    if (res.hasUpdate) {
      uni.showModal({
        title: '发现新版本',
        content: '下载进度：0%',
        showCancel: false,
        confirmColor: '#00BB88'
      })
      updateManager.onUpdateReady(() => {
        uni.hideLoading()
        uni.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          confirmColor: '#00BB88',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })
      updateManager.onUpdateFailed(() => {
        uni.hideLoading()
        uni.showModal({
          title: '更新失败',
          content: '新版本下载失败，是否重试？',
          confirmColor: '#00BB88'
        })
      })
    } else {
      uni.showToast({ title: '当前已是最新版本', icon: 'none' })
    }
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '当前已是最新版本', icon: 'none' })
  // #endif
}

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm) {
        await userStore.logout()
        uni.showToast({ title: '已退出登录', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/login/index'
          })
        }, 1500)
      }
    }
  })
}

const openCancelAccountPopup = () => {
  cancelReason.value = ''
  showCancelAccountPopup.value = true
}

const closeCancelAccountPopup = () => {
  if (isCancelingAccount.value) return
  showCancelAccountPopup.value = false
}

const handleCancelAccount = async () => {
  if (isCancelingAccount.value) return
  isCancelingAccount.value = true
  try {
    await cancelAccount({
      reason: cancelReason.value.trim()
    })
    uni.showToast({ title: '账号已注销', icon: 'success' })
    await userStore.logout()
    uni.reLaunch({
      url: '/pages/login/index'
    })
  } finally {
    isCancelingAccount.value = false
  }
}

// ---------------------- 生命周期 ----------------------

</script>

<style lang="scss" scoped>
.setting-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
}

/* 统一的顶部导航栏 */
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
  .nav-title {
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
  }
}

.setting-scroll {
  flex: 1;
  width: 100%;
}

/* 菜单列表 */
.menu-section {
  padding: 30rpx;
  .menu-card {
    background: #1E252B;
    border-radius: 24rpx;
    padding: 0 30rpx;
    .menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx 0;
      border-bottom: 1rpx solid rgba(255,255,255,0.05);
      &:last-child {
        border-bottom: none;
      }
      .menu-left {
        display: flex;
        align-items: center;
        gap: 20rpx;
        .menu-icon-box {
          width: 70rpx;
          height: 70rpx;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .menu-text {
          color: #fff;
          font-size: 32rpx;
          font-weight: 500;
        }
      }
      .menu-right {
        display: flex;
        align-items: center;
        gap: 12rpx;
        .menu-meta {
          color: #9CA3AF;
          font-size: 28rpx;
        }
      }
    }
  }
}

/* 统一的退出登录按钮（和编辑资料页一致） */
.logout-section {
  padding: 10rpx 30rpx 30rpx;
  .logout-btn {
    width: 100%;
    height: 96rpx;
    line-height: 96rpx;
    background: rgba(239, 68, 68, 0.15);
    color: #EF4444;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: 600;
    border: none;
    &::after {
      border: none;
    }
  }
  .cancel-account-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    margin-top: 24rpx;
    background: rgba(255, 255, 255, 0.08);
    color: #F87171;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 500;
    border: none;
    &::after {
      border: none;
    }
  }
}

.cancel-account-popup {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 999;
}

.cancel-account-mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
}

.cancel-account-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 40rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
  background: #1E252B;
  border-radius: 32rpx 32rpx 0 0;
}

.cancel-account-title {
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
  text-align: center;
}

.cancel-account-tip {
  margin-top: 16rpx;
  color: #9CA3AF;
  font-size: 28rpx;
  text-align: center;
}

.cancel-account-textarea {
  width: 100%;
  height: 180rpx;
  margin-top: 32rpx;
  padding: 24rpx;
  box-sizing: border-box;
  color: #fff;
  background: #121619;
  border-radius: 20rpx;
  font-size: 28rpx;
}

.cancel-account-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 32rpx;
}

.cancel-account-cancel,
.cancel-account-confirm {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  text-align: center;
  box-sizing: border-box;
}

.cancel-account-cancel {
  color: #D1D5DB;
  background: rgba(255, 255, 255, 0.08);
}

.cancel-account-confirm {
  color: #EF4444;
  background: rgba(239, 68, 68, 0.15);
  font-weight: 600;
  border: 1rpx solid rgba(239, 68, 68, 0.35);
  box-shadow: 0 12rpx 28rpx rgba(239, 68, 68, 0.12);
}

.cancel-account-confirm:active {
  background: rgba(239, 68, 68, 0.22);
  transform: scale(0.98);
}

.cancel-account-cancel.disabled,
.cancel-account-confirm.disabled {
  opacity: 0.65;
  transform: none;
}

.agreement-text {
  padding-top: 30rpx;
  font-size: 26rpx;
  color: #9CA3AF;
  line-height: 1.4;
}
.link {
  color: #00BB88;
}
/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>