<template>
  <view class="scan-wrapper">

    <!-- 扫码区域 -->
    <view class="scan-content">
      <view class="scan-icon-box">
        <uni-icons type="scan" size="80" color="#00BB88" />
      </view>
      <text class="scan-title">扫描二维码</text>
      <text class="scan-desc">将二维码放入框内即可自动扫描</text>
      <view class="scan-btn" @click="handleScan">
        <text class="scan-btn-text">点击扫码</text>
      </view>
    </view>
    <view class="safe-area-floor"></view>

  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(0)

const handleScan = () => {
  // 调用扫码 API
  uni.scanCode({
    success: (res) => {
      console.log('扫码结果:', res)
      let result
      try {
        result = JSON.parse(res.result)
      } catch (e) {
        result = null
      }
      if (!result || typeof result !== 'object') {
        uni.showToast({
          title: '二维码无效，请重新扫描',
          icon: 'none'
        })
        return
      }
      if (result?.coachId) {
        // 跳转到助教详情页，不自动返回
        uni.navigateTo({
          url: `/subpkg/coach/detail?id=${result?.coachId}`
        })
      } else {
        uni.showToast({
          title: '无法识别的二维码',
          icon: 'none'
        })
      }
    },
    fail: (err) => {
      console.error('扫码失败:', err)
      if (err.errMsg && err.errMsg.includes('cancel')) {
        // 用户取消，返回首页
        uni.switchTab({
          url: '/pages/home/index'
        })
      } else {
        uni.showToast({
          title: '扫码失败，请重试',
          icon: 'none',
          duration: 1500,
          complete: () => {
            setTimeout(() => {
              uni.switchTab({
                url: '/pages/home/index'
              })
            }, 1500)
          }
        })
      }
    }
  })
}

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
})
</script>

<style lang="scss" scoped>
.scan-wrapper {
  height: 100vh;
  background-color: #121619;
}

.navbar {
  display: flex;
  align-items: center;
  padding-left: 30rpx;
  padding-right: 30rpx;
  padding-bottom: 24rpx;
  background: rgba(18, 22, 25, 0.9);

  .nav-left {
    display: flex;
    align-items: center;
    .logo-circle {
      width: 60rpx;
      height: 60rpx;
      background: linear-gradient(135deg, #00BB88 0%, #059669 100%);
      border-radius: 18rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16rpx;
      position: relative;
      overflow: hidden;

      .logo-glow {
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 60%);
        animation: glowPulse 4s ease-in-out infinite;
      }

      .logo-text {
        color: #fff;
        font-weight: 800;
        font-size: 34rpx;
        position: relative;
        z-index: 1;
      }
    }
    .nav-title-group {
      display: flex;
      flex-direction: column;
      .nav-title {
        color: #fff;
        font-size: 36rpx;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: -1rpx;
      }
      .nav-subtitle {
        color: #6B7280;
        font-size: 24rpx;
        margin-top: 2rpx;
        font-weight: 500;
      }
    }
  }
}

.scan-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;

  .scan-icon-box {
    width: 200rpx;
    height: 200rpx;
    background: rgba(0, 187, 136, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;
    border: 2rpx dashed rgba(0, 187, 136, 0.3);
  }

  .scan-title {
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
    margin-bottom: 16rpx;
  }

  .scan-desc {
    color: #6B7280;
    font-size: 28rpx;
    margin-bottom: 80rpx;
  }

  .scan-btn {
    background: linear-gradient(135deg, #00BB88 0%, #059669 100%);
    padding: 24rpx 100rpx;
    border-radius: 50rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 187, 136, 0.3);

    .scan-btn-text {
      color: #fff;
      font-size: 32rpx;
      font-weight: 600;
    }

    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }
  }
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}
.safe-area-floor {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  background-color: red; /* 👉 这个颜色每页自己改 */
}
</style>