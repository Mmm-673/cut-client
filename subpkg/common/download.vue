<template>
  <view class="download-wrapper" :class="themeClass">
    <view class="download-content">
      <!-- Logo -->
      <view class="logo-box">
        <view class="logo-circle">
          <text class="logo-text">初</text>
        </view>
        <text class="app-name">初球</text>
        <text class="app-slogan">专业台球裁教预约平台</text>
      </view>

      <!-- 下载按钮 -->
      <view class="download-btns">
        <view class="btn primary" @click="handleDownload">
          <uni-icons type="download" size="20" color="#fff" />
          <text class="btn-text">下载 APP</text>
        </view>
        <view v-if="isWechatBrowser" class="wechat-tip">
          <uni-icons type="info" size="16" color="#FBBF24" />
          <text class="tip-text">请点击右上角「…」选择浏览器中打开下载</text>
        </view>
      </view>

      <!-- 功能亮点 -->
      <view class="features">
        <view class="feature-item">
          <view class="feature-icon">
            <uni-icons type="person" size="28" color="#00BB88" />
          </view>
          <view class="feature-info">
            <text class="feature-title">专业裁教</text>
            <text class="feature-desc">认证裁判教练，专业可靠</text>
          </view>
        </view>
        <view class="feature-item">
          <view class="feature-icon">
            <uni-icons type="calendar" size="28" color="#00BB88" />
          </view>
          <view class="feature-info">
            <text class="feature-title">在线预约</text>
            <text class="feature-desc">一键预约，快速响应</text>
          </view>
        </view>
        <view class="feature-item">
          <view class="feature-icon">
            <uni-icons type="locked" size="28" color="#00BB88" />
          </view>
          <view class="feature-info">
            <text class="feature-title">安全支付</text>
            <text class="feature-desc">平台担保，交易无忧</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部版权 -->
    <view class="footer">
      <text class="copyright">© 2026 初球 版权所有</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '@/store'
import { isWechatBrowser as checkWechatBrowser } from '@/utils/platform'

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

const isWechatBrowser = checkWechatBrowser()

// #ifdef H5
// H5 端通过 UA 判断 iOS/Android（isIOS()/isAndroid() 仅 App 端有效）
const ua = (navigator?.userAgent || '').toLowerCase()
const isIOSH5 = /iphone|ipad|ipod/.test(ua)
const isAndroidH5 = /android/.test(ua)
// #endif

// #ifndef H5
const isIOSH5 = false
const isAndroidH5 = false
// #endif

// #ifdef H5
const ANDROID_DOWNLOAD_URL = 'https://qiulem.com/app/chuqiu.apk'
const IOS_DOWNLOAD_URL = 'https://apps.apple.com/cn/app/chuqiu/id6502468218'
// #endif

const handleDownload = () => {
  // #ifdef H5
  try {
    if (isWechatBrowser) {
      uni.showToast({
        title: '请在浏览器中打开下载',
        icon: 'none',
        duration: 2500
      })
      return
    }

    const downloadUrl = isIOSH5 ? IOS_DOWNLOAD_URL : ANDROID_DOWNLOAD_URL
    window.location.href = downloadUrl
  } catch (e) {
    console.error('[Download] 下载失败:', e)
    uni.showToast({ title: '下载失败，请稍后重试', icon: 'none' })
  }
  // #endif
}
</script>

<style lang="scss" scoped>
.download-wrapper {
  min-height: calc(var(--vh, 1vh) * 100);
  background: var(--bg-page);
  display: flex;
  flex-direction: column;
  padding: 0 40rpx;
  box-sizing: border-box;
}

.download-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}

.logo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 100rpx;

  .logo-circle {
    width: 160rpx;
    height: 160rpx;
    border-radius: 36rpx;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
    box-shadow: 0 12rpx 32rpx rgba(0, 187, 136, 0.3);

    .logo-text {
      font-size: 72rpx;
      font-weight: 800;
      color: #fff;
    }
  }

  .app-name {
    font-size: 48rpx;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 12rpx;
  }

  .app-slogan {
    font-size: 28rpx;
    color: var(--text-secondary);
  }
}

.download-btns {
  width: 100%;
  margin-bottom: 80rpx;

  .btn {
    width: 100%;
    height: 96rpx;
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;

    &.primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 8rpx 24rpx rgba(0, 187, 136, 0.3);

      .btn-text {
        color: #fff;
        font-size: 32rpx;
        font-weight: 600;
      }
    }

    &:active {
      opacity: 0.8;
      transform: scale(0.98);
    }
  }

  .wechat-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    margin-top: 24rpx;

    .tip-text {
      font-size: 24rpx;
      color: #FBBF24;
    }
  }
}

.features {
  width: 100%;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 40rpx 30rpx;

  .feature-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid var(--border-color);

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    &:first-child {
      padding-top: 0;
    }

    .feature-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 20rpx;
      background: rgba(0, 187, 136, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 24rpx;
    }

    .feature-info {
      display: flex;
      flex-direction: column;

      .feature-title {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 6rpx;
      }

      .feature-desc {
        font-size: 26rpx;
        color: var(--text-secondary);
      }
    }
  }
}

.footer {
  padding: 40rpx 0 calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  text-align: center;

  .copyright {
    font-size: 24rpx;
    color: var(--text-tertiary);
  }
}
</style>
