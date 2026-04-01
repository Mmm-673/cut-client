<template>
  <view class="mine-wrapper">
    <!-- 顶部用户信息 -->
    <view class="header-section">
      <view class="user-card">
        <image v-if="userInfo.avatar" class="user-avatar" :src="userInfo.avatar" mode="aspectFill"></image>
        <view v-else class="user-avatar placeholder">
          <text class="avatar-text">{{ userInfo.nickname ? userInfo.nickname.charAt(0) : '用' }}</text>
        </view>
        <view class="user-info">
          <text v-if="isLoggedIn" class="user-name">{{ userInfo.nickname || '用户' }}</text>
          <text v-else class="user-name" @click="goToLogin">点击登录</text>
          <text v-if="isLoggedIn" class="user-phone">{{ userInfo.phonenumber || '未绑定手机号' }}</text>
        </view>
        <uni-icons v-if="isLoggedIn" type="right" size="20" color="#9CA3AF" @click="goToInfo" />
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-section">
      <view class="quick-grid">
        <view class="quick-item" @click="goToOrderList('pending')">
          <text class="quick-icon">⏰</text>
          <text class="quick-text">待服务</text>
        </view>
        <view class="quick-item" @click="goToOrderList('completed')">
          <text class="quick-icon">✅</text>
          <text class="quick-text">已完成</text>
        </view>
        <view class="quick-item" @click="goToOrderList('cancelled')">
          <text class="quick-icon">❌</text>
          <text class="quick-text">已取消</text>
        </view>
        <view class="quick-item" @click="contactService">
          <text class="quick-icon">💬</text>
          <text class="quick-text">联系客服</text>
        </view>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-section">
      <view class="menu-card">
        <view class="menu-item" @click="goToEditInfo">
          <view class="menu-left">
            <text class="menu-icon">👤</text>
            <text class="menu-text">编辑资料</text>
          </view>
          <uni-icons type="right" size="20" color="#9CA3AF" />
        </view>
        <view class="menu-item" @click="goToPwd">
          <view class="menu-left">
            <text class="menu-icon">🔐</text>
            <text class="menu-text">修改密码</text>
          </view>
          <uni-icons type="right" size="20" color="#9CA3AF" />
        </view>
        <view class="menu-item" @click="goToHelp">
          <view class="menu-left">
            <text class="menu-icon">❓</text>
            <text class="menu-text">常见问题</text>
          </view>
          <uni-icons type="right" size="20" color="#9CA3AF" />
        </view>
      </view>

      <view class="menu-card">
        <view class="menu-item" @click="goToAbout">
          <view class="menu-left">
            <text class="menu-icon">ℹ️</text>
            <text class="menu-text">关于我们</text>
          </view>
          <uni-icons type="right" size="20" color="#9CA3AF" />
        </view>
        <view class="menu-item" @click="goToSetting">
          <view class="menu-left">
            <text class="menu-icon">⚙️</text>
            <text class="menu-text">应用设置</text>
          </view>
          <uni-icons type="right" size="20" color="#9CA3AF" />
        </view>
      </view>

      <view v-if="isLoggedIn" class="menu-card">
        <view class="menu-item logout" @click="handleLogout">
          <text class="menu-text">退出登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 跳转登录
const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/index'
  })
}

// 跳转个人信息
const goToInfo = () => {
  uni.navigateTo({
    url: '/pages/mine/info/index'
  })
}

// 跳转编辑资料
const goToEditInfo = () => {
  uni.navigateTo({
    url: '/pages/mine/info/edit'
  })
}

// 跳转修改密码
const goToPwd = () => {
  uni.navigateTo({
    url: '/pages/mine/pwd/index'
  })
}

// 跳转常见问题
const goToHelp = () => {
  uni.navigateTo({
    url: '/pages/mine/help/index'
  })
}

// 跳转关于我们
const goToAbout = () => {
  uni.navigateTo({
    url: '/pages/mine/about/index'
  })
}

// 跳转应用设置
const goToSetting = () => {
  uni.navigateTo({
    url: '/pages/mine/setting/index'
  })
}

// 跳转订单列表
const goToOrderList = (status) => {
  uni.switchTab({
    url: '/pages/order/list'
  })
}

// 联系客服
const contactService = () => {
  uni.showToast({ title: '联系客服功能开发中', icon: 'none' })
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
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.mine-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-bottom: 40rpx;
}

/* 顶部用户信息 */
.header-section {
  padding: 60rpx 30rpx 20rpx;
  background: linear-gradient(135deg, #00BB88 0%, #008866 100%);
  .user-card {
    display: flex;
    align-items: center;
    .user-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(255,255,255,0.3);
      margin-right: 24rpx;
      &.placeholder {
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        .avatar-text {
          color: #fff;
          font-size: 48rpx;
          font-weight: bold;
        }
      }
    }
    .user-info {
      flex: 1;
      .user-name {
        color: #fff;
        font-size: 36rpx;
        font-weight: bold;
        display: block;
        margin-bottom: 8rpx;
      }
      .user-phone {
        color: rgba(255,255,255,0.8);
        font-size: 26rpx;
      }
    }
  }
}

/* 快捷入口 */
.quick-section {
  padding: 20rpx 30rpx;
  .quick-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: #1E252B;
    border-radius: 24rpx;
    padding: 40rpx 20rpx;
    .quick-item {
      text-align: center;
      .quick-icon {
        font-size: 48rpx;
        display: block;
        margin-bottom: 12rpx;
      }
      .quick-text {
        color: #9CA3AF;
        font-size: 24rpx;
      }
    }
  }
}

/* 菜单列表 */
.menu-section {
  padding: 20rpx 30rpx;
  .menu-card {
    background: #1E252B;
    border-radius: 24rpx;
    margin-bottom: 20rpx;
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
      &.logout {
        justify-content: center;
        .menu-text {
          color: #EF4444;
          font-size: 30rpx;
        }
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
    }
  }
}
</style>
