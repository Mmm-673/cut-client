<template>
  <view class="edit-wrapper">
    <!-- 表单区域 -->
    <view class="form-card">
      <view class="form-item">
        <text class="form-label">用户昵称</text>
        <input
          class="form-input"
          v-model="user.nickName"
          placeholder="请输入昵称"
          placeholder-class="placeholder"
        />
      </view>
      <view class="form-item">
        <text class="form-label">手机号码</text>
        <input
          class="form-input"
          v-model="user.phonenumber"
          placeholder="请输入手机号码"
          placeholder-class="placeholder"
          type="number"
          maxlength="11"
        />
      </view>
      <view class="form-item">
        <text class="form-label">邮箱</text>
        <input
          class="form-input"
          v-model="user.email"
          placeholder="请输入邮箱"
          placeholder-class="placeholder"
        />
      </view>
      <view class="form-item">
        <text class="form-label">性别</text>
        <view class="sex-selector">
          <view
            class="sex-item"
            :class="{ active: user.sex === '0' }"
            @click="user.sex = '0'"
          >
            男
          </view>
          <view
            class="sex-item"
            :class="{ active: user.sex === '1' }"
            @click="user.sex = '1'"
          >
            女
          </view>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="bottom-section">
      <button class="submit-btn" @click="submit">保存修改</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

const user = ref({
  nickName: '',
  phonenumber: '',
  email: '',
  sex: ''
})

const sexs = [
  { text: '男', value: '0' },
  { text: '女', value: '1' }
]

const getUser = () => {
  const userInfo = userStore.userInfo || {}
  user.value = {
    nickName: userInfo.nickName || '',
    phonenumber: userInfo.phonenumber || '',
    email: userInfo.email || '',
    sex: userInfo.sex || ''
  }
}

const submit = () => {
  if (!user.value.nickName) {
    uni.showToast({ title: '用户昵称不能为空', icon: 'none' })
    return
  }
  if (!user.value.phonenumber) {
    uni.showToast({ title: '手机号码不能为空', icon: 'none' })
    return
  }
  const phoneReg = /^1[3-9]\d{9}$/
  if (!phoneReg.test(user.value.phonenumber)) {
    uni.showToast({ title: '请输入正确的手机号码', icon: 'none' })
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

onMounted(() => {
  getUser()
})
</script>

<style lang="scss" scoped>
.edit-wrapper {
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
    .sex-selector {
      display: flex;
      gap: 20rpx;
      .sex-item {
        flex: 1;
        padding: 24rpx;
        text-align: center;
        background: #2A3138;
        border-radius: 12rpx;
        color: #9CA3AF;
        font-size: 28rpx;
        border: 2rpx solid transparent;
        &.active {
          border-color: #00BB88;
          background: rgba(0, 187, 136, 0.1);
          color: #00BB88;
        }
      }
    }
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
