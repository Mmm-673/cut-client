<template>
  <view class="info-wrapper">
    <!-- 头像区域 -->
    <view class="avatar-section">
      <image class="avatar" :src="userInfo.avatar || '/static/logo.png'" mode="aspectFill"></image>
      <text class="avatar-tip">点击头像可更换</text>
    </view>

    <!-- 信息列表 -->
    <view class="info-card">
      <view class="info-item">
        <text class="info-label">昵称</text>
        <text class="info-value">{{ userInfo.nickName || '未设置' }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">手机号码</text>
        <text class="info-value">{{ userInfo.phonenumber || '未绑定' }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">邮箱</text>
        <text class="info-value">{{ userInfo.email || '未设置' }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">创建日期</text>
        <text class="info-value">{{ userInfo.createTime || '-' }}</text>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-section">
      <button class="edit-btn" @click="goToEdit">编辑资料</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const userInfo = ref({})

const getUser = () => {
  userInfo.value = userStore.userInfo || {}
}

const goToEdit = () => {
  uni.navigateTo({
    url: '/pages/mine/info/edit'
  })
}

onMounted(() => {
  getUser()
})
</script>

<style lang="scss" scoped>
.info-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-bottom: 40rpx;
}

/* 头像区域 */
.avatar-section {
  padding: 60rpx 30rpx;
  text-align: center;
  .avatar {
    width: 200rpx;
    height: 200rpx;
    border-radius: 50%;
    border: 4rpx solid #00BB88;
    margin-bottom: 16rpx;
  }
  .avatar-tip {
    color: #9CA3AF;
    font-size: 24rpx;
  }
}

/* 信息卡片 */
.info-card {
  margin: 20rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 1rpx solid rgba(255,255,255,0.05);
    &:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #9CA3AF;
      font-size: 28rpx;
    }
    .info-value {
      color: #fff;
      font-size: 28rpx;
    }
  }
}

/* 底部按钮 */
.bottom-section {
  padding: 40rpx 30rpx;
  .edit-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: #00BB88;
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: bold;
    border: none;
    &::after {
      border: none;
    }
  }
}
</style>
