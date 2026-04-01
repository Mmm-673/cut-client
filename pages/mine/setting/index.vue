<template>
  <view class="setting-wrapper">
    <!-- 菜单列表 -->
    <view class="menu-section">
      <view class="menu-card">
        <view class="menu-item" @click="goToPwd">
          <view class="menu-left">
            <text class="menu-icon">🔐</text>
            <text class="menu-text">修改密码</text>
          </view>
          <uni-icons type="right" size="20" color="#9CA3AF" />
        </view>
        <view class="menu-item" @click="checkUpgrade">
          <view class="menu-left">
            <text class="menu-icon">📱</text>
            <text class="menu-text">检查更新</text>
          </view>
          <view class="menu-right">
            <text class="menu-version">v1.0.0</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>
        <view class="menu-item" @click="cleanCache">
          <view class="menu-left">
            <text class="menu-icon">🗑️</text>
            <text class="menu-text">清理缓存</text>
          </view>
          <view class="menu-right">
            <text class="menu-cache">12.5MB</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section" v-if="isLoggedIn">
      <view class="logout-card" @click="handleLogout">
        <text class="logout-text">退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 跳转修改密码
const goToPwd = () => {
  uni.navigateTo({
    url: '/pages/mine/pwd/index'
  })
}

// 检查更新
const checkUpgrade = () => {
  uni.showToast({ title: '当前已是最新版本', icon: 'none' })
}

// 清理缓存
const cleanCache = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清理缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '清理中...' })
        setTimeout(() => {
          uni.hideLoading()
          uni.showToast({ title: '清理成功', icon: 'success' })
        }, 1000)
      }
    }
  })
}

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
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
</script>

<style lang="scss" scoped>
.setting-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-bottom: 40rpx;
}

/* 菜单列表 */
.menu-section {
  padding: 20rpx 30rpx;
  .menu-card {
    background: #1E252B;
    border-radius: 24rpx;
    overflow: hidden;
    .menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx;
      border-bottom: 1rpx solid rgba(255,255,255,0.05);
      &:last-child {
        border-bottom: none;
      }
      .menu-left {
        display: flex;
        align-items: center;
        gap: 16rpx;
        .menu-icon {
          font-size: 36rpx;
        }
        .menu-text {
          color: #fff;
          font-size: 28rpx;
        }
      }
      .menu-right {
        display: flex;
        align-items: center;
        gap: 12rpx;
        .menu-version,
        .menu-cache {
          color: #9CA3AF;
          font-size: 26rpx;
        }
      }
    }
  }
}

/* 退出登录 */
.logout-section {
  padding: 40rpx 30rpx;
  .logout-card {
    background: #1E252B;
    border-radius: 24rpx;
    padding: 30rpx;
    text-align: center;
    .logout-text {
      color: #EF4444;
      font-size: 30rpx;
    }
  }
}
</style>
