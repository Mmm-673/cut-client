<template>
  <view class="pwd-wrapper">
    <!-- 表单区域 -->
    <view class="form-card">
      <view class="form-item">
        <text class="form-label">旧密码</text>
        <input
          class="form-input"
          v-model="user.oldPassword"
          type="password"
          placeholder="请输入旧密码"
          placeholder-class="placeholder"
        />
      </view>
      <view class="form-item">
        <text class="form-label">新密码</text>
        <input
          class="form-input"
          v-model="user.newPassword"
          type="password"
          placeholder="请输入新密码（6-20位）"
          placeholder-class="placeholder"
        />
      </view>
      <view class="form-item">
        <text class="form-label">确认密码</text>
        <input
          class="form-input"
          v-model="user.confirmPassword"
          type="password"
          placeholder="请确认新密码"
          placeholder-class="placeholder"
        />
      </view>
    </view>

    <!-- 提示信息 -->
    <view class="tips-section">
      <text class="tips-text">• 密码长度为6-20位</text>
      <text class="tips-text">• 请妥善保管您的密码</text>
    </view>

    <!-- 提交按钮 -->
    <view class="bottom-section">
      <button class="submit-btn" @click="submit">确认修改</button>
    </view>
  </view>
</template>

<script setup>
import { reactive } from 'vue'

const user = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const submit = () => {
  if (!user.oldPassword) {
    uni.showToast({ title: '旧密码不能为空', icon: 'none' })
    return
  }
  if (!user.newPassword) {
    uni.showToast({ title: '新密码不能为空', icon: 'none' })
    return
  }
  if (user.newPassword.length < 6 || user.newPassword.length > 20) {
    uni.showToast({ title: '密码长度为6-20位', icon: 'none' })
    return
  }
  if (!user.confirmPassword) {
    uni.showToast({ title: '确认密码不能为空', icon: 'none' })
    return
  }
  if (user.newPassword !== user.confirmPassword) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }

  uni.showLoading({ title: '提交中...' })
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '修改成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }, 1000)
}
</script>

<style lang="scss" scoped>
.pwd-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-bottom: 40rpx;
}

/* 表单卡片 */
.form-card {
  margin: 20rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  .form-item {
    padding: 30rpx 0;
    border-bottom: 1rpx solid rgba(255,255,255,0.05);
    &:last-child {
      border-bottom: none;
    }
    .form-label {
      color: #9CA3AF;
      font-size: 28rpx;
      display: block;
      margin-bottom: 20rpx;
    }
    .form-input {
      width: 100%;
      background: #2A3138;
      border-radius: 12rpx;
      padding: 24rpx;
      color: #fff;
      font-size: 28rpx;
      box-sizing: border-box;
    }
    .placeholder {
      color: #666;
    }
  }
}

/* 提示信息 */
.tips-section {
  padding: 20rpx 30rpx;
  .tips-text {
    display: block;
    color: #666;
    font-size: 24rpx;
    margin-bottom: 8rpx;
  }
}

/* 底部按钮 */
.bottom-section {
  padding: 40rpx 30rpx;
  .submit-btn {
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
