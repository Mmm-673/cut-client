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

          <!-- 清理缓存 -->
          <view class="menu-item" @click="cleanCache">
            <view class="menu-left">
              <view class="menu-icon-box" style="background: rgba(251, 191, 36, 0.2);">
                <uni-icons type="trash" size="24" color="#FBBF24" />
              </view>
              <text class="menu-text">清理缓存</text>
            </view>
            <view class="menu-right">
              <text class="menu-meta">{{ cacheSize }}</text>
              <uni-icons type="right" size="20" color="#9CA3AF" />
            </view>
          </view>
        </view>
      </view>

      <!-- 统一的退出登录按钮 -->
      <view class="logout-section" v-if="isLoggedIn">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
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
// 缓存大小
const cacheSize = ref('12.5MB')
// 是否登录（兼容本地存储，也可替换为你的Pinia）
const isLoggedIn = computed(() => {
  // 优先用你的Pinia
  try {
    // 这里只是兼容示例，实际项目可以保留你的 useUserStore
    // import { useUserStore } from '@/store/modules/user'
    // const userStore = useUserStore()
    // return userStore.isLoggedIn
    return !!uni.getStorageSync('token')
  } catch (error) {
    return !!uni.getStorageSync('token')
  }
})

// ---------------------- 交互方法 ----------------------
const goBack = () => {
  uni.navigateBack()
}

// 跳转修改密码
const goToPwd = () => {
  uni.navigateTo({
    url: '/pages/mine/pwd/index'
  })
}

// 检查更新
const checkUpgrade = () => {
  uni.showLoading({ title: '检查中...' })
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '当前已是最新版本', icon: 'none' })
  }, 800)
}

// 清理缓存
const cleanCache = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清理缓存吗？',
    confirmColor: '#00BB88',
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '清理中...' })
        setTimeout(() => {
          uni.hideLoading()
          cacheSize.value = '0MB'
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
    confirmColor: '#EF4444',
    success: (res) => {
      if (res.confirm) {
        // 清除本地存储
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')

        // 清除你的Pinia（如果有的话）
        // userStore.logout()

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

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  // 页面加载时获取真实缓存大小（简化示例）
})

onShow(() => {
  // 页面显示时刷新状态
})
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
  padding: 60rpx 30rpx 30rpx;
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
}

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>