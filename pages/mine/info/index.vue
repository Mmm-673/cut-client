<template>
  <view class="edit-page-wrapper">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <uni-icons type="left" size="24" color="#fff" />
      </view>
      <text class="nav-title">编辑资料</text>
      <view class="nav-save" :class="{disabled: isSaving}" @click="saveInfo">
        <text v-if="!isSaving">保存</text>
        <uni-icons v-else type="spinner-cycle" size="20" color="#00BB88" style="animation: spin 1s linear infinite;"></uni-icons>
      </view>
    </view>

    <scroll-view
        scroll-y
        class="edit-scroll"
    >
      <!-- 头像区域 -->
      <view class="avatar-section">
        <image
            class="avatar-image"
            :src="userInfo.avatar || '/static/default-avatar.png'"
            mode="aspectFill"
            @click="previewAvatar"
        ></image>
        <view class="camera-btn" @click="uploadAvatar">
          <uni-icons type="camera-filled" size="24" color="#fff" />
        </view>
        <text class="avatar-tip">点击头像可更换图片</text>
      </view>

      <!-- 信息列表 -->
      <view class="info-card">
        <view class="info-row" @click="editNickname">
          <text class="label">昵称</text>
          <view class="value-wrap">
            <text class="value">{{ userInfo.nickname }}</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>

        <view class="info-row" @click="editPhone">
          <text class="label">手机号</text>
          <view class="value-wrap">
            <text class="value">{{ userInfo.phone }}</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>

        <view class="info-row" @click="chooseGender">
          <text class="label">性别</text>
          <view class="value-wrap">
            <text class="value">{{ userInfo.gender }}</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>

        <view class="info-row" @click="showDatePicker = true">
          <text class="label">生日</text>
          <view class="value-wrap">
            <text class="value">{{ userInfo.birthday }}</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>

        <view class="info-row" @click="editCity">
          <text class="label">所在城市</text>
          <view class="value-wrap">
            <text class="value">{{ userInfo.city }}</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>

        <view class="info-row" @click="editIntro">
          <text class="label">个人简介</text>
          <view class="value-wrap">
            <text class="value">{{ userInfo.intro }}</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-section">
        <button class="logout-btn" @click="logout">退出登录</button>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>

    <!-- 生日日期选择器（小程序/App/H5兼容） -->
    <picker
        mode="date"
        :value="userInfo.birthday"
        :start="startBirthday"
        :end="endBirthday"
        fields="day"
        @change="onBirthdayChange"
    >
      <!-- 透明占位层，通过上面的view点击触发 -->
      <view class="picker-placeholder" v-if="showDatePicker"></view>
    </picker>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from  "@dcloudio/uni-app"

// 保存状态
const isSaving = ref(false)
// 控制picker点击触发的占位（简化写法，也可以直接把info-row放picker里，但要调整层级）
const showDatePicker = ref(false)

// 用户信息
const userInfo = ref({
  avatar: '',
  nickname: '张先生',
  phone: '138****8888',
  gender: '男',
  birthday: '1995-08-15',
  city: '北京市',
  intro: '台球爱好者，喜欢斯诺克'
})

// 生日选择器的起止时间
const startBirthday = computed(() => {
  const year = new Date().getFullYear() - 100
  return `${year}-01-01`
})
const endBirthday = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// ---------------------- 核心多端适配头像上传 ----------------------
// 1. 预览当前头像
const previewAvatar = () => {
  if (!userInfo.value.avatar) return
  uni.previewImage({
    urls: [userInfo.value.avatar],
    current: userInfo.value.avatar
  })
}

// 2. 多端选择/拍摄+压缩头像
const uploadAvatar = async () => {
  try {
    // 通用参数（小程序/App/H5兼容）
    const chooseParams = {
      count: 1, // 只选一张
      sizeType: ['compressed', 'original'], // 优先压缩，可选原图
      sourceType: ['album', 'camera'], // 相册或相机
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0]
        // 统一压缩（防止图片过大，适配多端上传）
        const compressedPath = await compressImage(tempFilePath)
        // 更新本地预览
        userInfo.value.avatar = compressedPath
        // TODO: 这里调用后端头像上传接口，传入compressedPath
        uni.showToast({ title: '头像更换成功', icon: 'success' })
      },
      fail: (err) => {
        // 忽略用户取消的情况
        if (err.errMsg && err.errMsg.includes('cancel')) return
        uni.showToast({ title: '选择图片失败', icon: 'none' })
      }
    }

    // H5额外适配（限制格式为图片，更友好的体验）
    // #ifdef H5
    chooseParams.extension = ['jpg', 'jpeg', 'png', 'gif']
    // #endif

    uni.chooseImage(chooseParams)
  } catch (error) {
    console.error('头像上传失败:', error)
    uni.showToast({ title: '头像上传失败', icon: 'none' })
  }
}

// 3. 多端压缩图片（适配大小）
const compressImage = (filePath) => {
  return new Promise((resolve, reject) => {
    // 直接返回H5的临时路径（H5的compressImage有时兼容性问题，chooseImage已经优先选compressed）
    // #ifdef H5
    resolve(filePath)
    // #endif

    // 小程序/App专用压缩
    // #ifndef H5
    uni.compressImage({
      src: filePath,
      quality: 80, // 压缩质量80%
      success: (res) => resolve(res.tempFilePath),
      fail: () => resolve(filePath) // 压缩失败返回原图
    })
    // #endif
  })
}

// ---------------------- 信息编辑 ----------------------
// 编辑昵称（用简单的modal演示，可替换为自定义编辑页）
const editNickname = () => {
  uni.showModal({
    title: '修改昵称',
    editable: true,
    placeholderText: '请输入新昵称',
    content: userInfo.value.nickname,
    success: (res) => {
      if (res.confirm && res.content.trim()) {
        userInfo.value.nickname = res.content.trim()
      }
    }
  })
}

// 编辑手机号（跳转验证页面演示）
const editPhone = () => {
  uni.showToast({ title: '请先验证原手机号', icon: 'none' })
  // uni.navigateTo({ url: '/pages/user/verify-phone' })
}

// 选择性别
const chooseGender = () => {
  uni.showActionSheet({
    itemList: ['男', '女', '保密'],
    success: (res) => {
      userInfo.value.gender = ['男', '女', '保密'][res.tapIndex]
    }
  })
}

// 生日变化
const onBirthdayChange = (e) => {
  userInfo.value.birthday = e.detail.value
  showDatePicker.value = false // 重置占位状态
}

// 编辑城市（可替换为uni-city-picker或接口返回的城市选择器）
const editCity = () => {
  uni.showToast({ title: '城市选择功能开发中', icon: 'none' })
}

// 编辑个人简介（可替换为自定义编辑页）
const editIntro = () => {
  uni.showModal({
    title: '修改个人简介',
    editable: true,
    placeholderText: '请输入个人简介',
    content: userInfo.value.intro,
    success: (res) => {
      if (res.confirm) {
        userInfo.value.intro = res.content.trim() || '台球爱好者，喜欢斯诺克'
      }
    }
  })
}

// ---------------------- 保存与退出 ----------------------
// 保存资料
const saveInfo = () => {
  if (isSaving.value) return
  isSaving.value = true

  // TODO: 调用后端保存资料接口
  setTimeout(() => {
    isSaving.value = false
    // 保存到本地存储
    uni.setStorageSync('userInfo', userInfo.value)
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  }, 1000)
}

// 退出登录
const logout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除本地存储
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')
        // 跳转到登录页
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}

// ---------------------- 生命周期 ----------------------
const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  // 加载本地存储的用户信息
  const localUserInfo = uni.getStorageSync('userInfo')
  if (localUserInfo) {
    Object.assign(userInfo.value, localUserInfo)
  }
})

onShow(() => {
  // 页面显示时可以刷新数据
})
</script>

<style lang="scss" scoped>
.edit-page-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 顶部导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + constant(safe-area-inset-top));
  padding-top: calc(20rpx + env(safe-area-inset-top));
  .nav-back, .nav-save {
    width: 80rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
  .nav-save {
    justify-content: flex-end;
    text {
      color: #00BB88;
      font-size: 32rpx;
      font-weight: 600;
    }
    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  }
  .nav-title {
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
  }
}

/* 旋转动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.edit-scroll {
  flex: 1;
  width: 100%;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0 40rpx;
  .avatar-image {
    width: 200rpx;
    height: 200rpx;
    border-radius: 50%;
    border: 4rpx solid #2a3338;
    position: relative;
  }
  .camera-btn {
    position: relative;
    margin-top: -40rpx;
    left: 60rpx;
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: #00BB88;
    border: 3rpx solid #121619;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .avatar-tip {
    color: #6B7280;
    font-size: 26rpx;
    margin-top: 20rpx;
  }
}

/* 通用信息卡片 */
.info-card {
  margin: 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 0 30rpx;
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 1rpx solid rgba(255,255,255,0.05);
    &:last-child {
      border-bottom: none;
    }
    .label {
      color: #fff;
      font-size: 30rpx;
      font-weight: 500;
    }
    .value-wrap {
      display: flex;
      align-items: center;
      gap: 12rpx;
      .value {
        color: #9CA3AF;
        font-size: 30rpx;
        max-width: 400rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

/* 退出登录区域 */
.logout-section {
  margin: 60rpx 30rpx 30rpx;
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

/* 日期选择器透明占位层 */
.picker-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 999;
}

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>