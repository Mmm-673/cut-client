<template>
  <view class="edit-page-wrapper">
    <scroll-view
        scroll-y
        class="edit-scroll"
    >
      <view class="avatar-section">
        <image
            class="avatar-image"
            :src="userInfo.avatar || '/static/default-avatar.png'"
            mode="aspectFill"
            @click="previewAvatar"
        ></image>
        <view class="camera-btn" @click="uploadAvatarAction">
          <uni-icons type="camera-filled" size="24" color="#fff" />
        </view>
        <text class="avatar-tip">点击头像可查看大图</text>
      </view>

      <view class="info-card">
        <view class="info-row" @click="editNickname">
          <text class="label">昵称</text>
          <view class="value-wrap">
            <text class="value">{{ userInfo.nickname }}</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>

        <view class="info-row" @click="showChangePhoneModal">
          <text class="label">手机号</text>
          <view class="value-wrap">
            <text class="value">{{ userInfo.mobile }}</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>

        <view class="info-row" @click="chooseGender">
          <text class="label">性别</text>
          <view class="value-wrap">
            <text class="value">{{ genderText }}</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>

        <picker
            mode="date"
            :value="userInfo.birthday"
            :start="startBirthday"
            :end="endBirthday"
            fields="day"
            @change="onBirthdayChange"
        >
          <view class="info-row">
            <text class="label">生日</text>
            <view class="value-wrap">
              <text class="value">{{ userInfo.birthday || '未设置' }}</text>
              <uni-icons type="right" size="20" color="#9CA3AF" />
            </view>
          </view>
        </picker>

        <view class="info-row area-row">
          <text class="label">所在城市</text>
          <uni-data-picker
              class="area-picker"
              :localdata="areaLocalData"
              v-model="selectedAreaId"
              :clear-icon="false"
              :border="false"
              :map="{value:'id', text:'name', children:'children'}"
              popup-title="选择地区"
              @change="onAreaChange"
          >
            <view class="value-wrap">
              <text class="value">{{ cityName }}</text>
              <uni-icons type="right" size="20" color="#9CA3AF" />
            </view>
          </uni-data-picker>
        </view>

        <view class="info-row" @click="editIntro">
          <text class="label">个人简介</text>
          <view class="value-wrap">
            <text class="value">{{ userInfo.introduction || '未设置' }}</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>
      </view>

      <view class="safe-area-bottom"></view>
    </scroll-view>

    <!-- 图片查看器 -->
    <ImageViewer
      :visible="showImageViewer"
      :images="viewerImages"
      :current="viewerCurrent"
      @close="showImageViewer = false"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from "@dcloudio/uni-app"
import { getUserInfo, updateUser, sendUpdateMobileSms, updateMobile, uploadFile } from '@/api/billiard/user'
import { getAreaTree } from '@/api/billiard/area'
import { showCameraPurposeModal, showAlbumPurposeModal, requestCameraPermission, requestAlbumPermission, showImageSourceModal } from '@/utils/photo'

// 性别选项
const genderOptions = [
  { value: 0, label: '未知' },
  { value: 1, label: '男' },
  { value: 2, label: '女' }
]

// 用户信息
const userInfo = ref({
  id: null,
  avatar: '',
  nickname: '',
  mobile: '',
  sex: 0,
  birthday: '',
  areaId: null,
  introduction: ''
})

const areaLocalData = ref([])
const areaTree = ref([])
const selectedAreaId = ref(null)

const startBirthday = computed(() => {
  const year = new Date().getFullYear() - 100
  return `${year}-01-01`
})
const endBirthday = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

const genderText = computed(() => {
  const item = genderOptions.find(g => g.value === userInfo.value.sex)
  return item ? item.label : '未知'
})

const cityName = computed(() => {
  if (!userInfo.value.areaId) return '选择地区'
  const findName = (list, id) => {
    for (const area of list) {
      if (area.id === id) return area.name
      if (area.children) {
        const found = findName(area.children, id)
        if (found) return found
      }
    }
    return null
  }
  return findName(areaTree.value, userInfo.value.areaId) || '选择地区'
})

// 格式化日期时间戳为 yyyy-MM-dd
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loadUserInfo = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const res = await getUserInfo()
    if (res.code === 0 && res.data) {
      userInfo.value = {
        id: res.data.id,
        avatar: res.data.avatar || '',
        nickname: res.data.nickname || '',
        mobile: res.data.mobile || '',
        sex: res.data.sex ?? 0,
        birthday: res.data.birthday ? formatDate(res.data.birthday) : '',
        areaId: res.data.areaId,
        introduction: res.data.introduction || ''
      }
      if (res.data.areaId) {
        selectedAreaId.value = res.data.areaId
      }
    }
  } catch (error) {
    uni.showToast({ title: '获取信息失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const loadAreaTree = async () => {
  try {
    const res = await getAreaTree()
    if (res.code === 0 && res.data) {
      areaTree.value = res.data
      areaLocalData.value = res.data
    }
  } catch (error) {}
}

const saveUserInfo = async (data) => {
  try {
    uni.showLoading({ title: '保存中...' })
    const res = await updateUser(data)
    if (res.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' })
      await loadUserInfo()
      return true
    } else {
      uni.showToast({ title: res.msg || '保存失败', icon: 'none' })
      return false
    }
  } catch (error) {
    uni.showToast({ title: '保存失败', icon: 'none' })
    return false
  } finally {
    uni.hideLoading()
  }
}

// 图片查看器
const showImageViewer = ref(false)
const viewerImages = ref([])
const viewerCurrent = ref(0)

const previewAvatar = () => {
  if (!userInfo.value.avatar) return
  viewerImages.value = [userInfo.value.avatar]
  viewerCurrent.value = 0
  showImageViewer.value = true
}

const uploadAvatarAction = async () => {
  try {
    // 让用户选择图片来源
    const sourceType = await showImageSourceModal()

    // 根据选择的来源显示对应的权限说明和请求系统权限
    if (sourceType === 0) {
      // 拍摄照片
      await showCameraPurposeModal('为了能够拍摄头像，我们需要获取您的相机访问权限。该权限仅用于拍摄功能，不会用于其他用途。')
      await requestCameraPermission()
    } else {
      // 从相册选择
      await showAlbumPurposeModal('为了能够从相册选择头像，我们需要获取您的相册访问权限。该权限仅用于选择图片功能，不会用于其他用途。')
      await requestAlbumPermission()
    }

    uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: sourceType === 0 ? ['camera'] : ['album'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]

      // 校验文件大小
      try {
        const fileInfo = await uni.getFileInfo({ filePath: tempFilePath })
        const size = fileInfo?.size || fileInfo?.[1]?.size || 0
        if (size > 5 * 1024 * 1024) {
          uni.showToast({ title: '图片不能超过5MB', icon: 'none' })
          return
        }
      } catch (e) {
        // getFileInfo 不可用时跳过大小校验
      }

      uni.showLoading({ title: '上传中...' })
      try {
        const uploadRes = await uploadFile(tempFilePath, 'avatar')
        if (uploadRes.code === 0 && uploadRes.data) {
          userInfo.value.avatar = uploadRes.data
          await saveUserInfo({ avatar: uploadRes.data })
        }
      } catch (err) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
  } catch (err) {
    console.error('处理头像上传请求失败:', err)
    if (err?.message === 'user_cancelled') {
      // 用户取消了相册/相机权限用途说明，不进行任何操作
      console.log('用户取消了相册/相机权限用途说明')
    } else {
      uni.showToast({
        title: '头像上传失败，请重试',
        icon: 'none',
        duration: 1500
      })
    }
  }
}

const editNickname = () => {
  uni.showModal({
    title: '修改昵称',
    editable: true,
    content: userInfo.value.nickname,
    placeholderText: '请输入昵称（最多30字）',
    success: async (res) => {
      if (res.confirm && res.content.trim()) {
        const nickname = res.content.trim()
        if (nickname.length > 30) {
          uni.showToast({ title: '昵称不能超过30个字符', icon: 'none' })
          return
        }
        if (await saveUserInfo({ nickname })) {
          userInfo.value.nickname = nickname
        }
      }
    }
  })
}

const chooseGender = () => {
  uni.showActionSheet({
    itemList: ['未知', '男', '女'],
    success: async (res) => {
      const sex = res.tapIndex
      if (await saveUserInfo({ sex })) {
        userInfo.value.sex = sex
      }
    }
  })
}

const onBirthdayChange = async (e) => {
  const birthday = e.detail.value
  if (await saveUserInfo({ birthday })) {
    userInfo.value.birthday = birthday
  }
}

const editIntro = () => {
  uni.showModal({
    title: '修改个人简介',
    editable: true,
    content: userInfo.value.introduction,
    placeholderText: '请输入简介（最多500字）',
    success: async (res) => {
      if (res.confirm) {
        const introduction = res.content.trim()
        if (introduction.length > 500) {
          uni.showToast({ title: '简介不能超过500个字符', icon: 'none' })
          return
        }
        if (await saveUserInfo({ introduction })) {
          userInfo.value.introduction = introduction
        }
      }
    }
  })
}

const onAreaChange = async (e) => {
  const selected = e.detail.value
  if (selected && selected.length > 0) {
    const areaId = selected[selected.length - 1].value
    if (areaId !== userInfo.value.areaId) {
      if (await saveUserInfo({ areaId })) {
        userInfo.value.areaId = areaId
      }
    }
  }
}

const showChangePhoneModal = () => {
  uni.showModal({
    title: '更换手机号',
    editable: true,
    success: async (res) => {
      if (res.confirm && res.content.trim()) {
        const mobile = res.content.trim()
        if (!/^1\d{10}$/.test(mobile)) {
          uni.showToast({ title: '手机号格式错误', icon: 'none' })
          return
        }
        await sendSmsAndVerify(mobile)
      }
    }
  })
}

const sendSmsAndVerify = async (mobile) => {
  const sendRes = await sendUpdateMobileSms({ mobile })
  if (sendRes.code === 0) {
    uni.showModal({
      title: '输入验证码',
      editable: true,
      success: async (verifyRes) => {
        if (verifyRes.confirm && verifyRes.content.trim()) {
          const res = await updateMobile({ mobile, code: verifyRes.content.trim() })
          if (res.code === 0) {
            userInfo.value.mobile = mobile
            uni.showToast({ title: '更换成功' })
          }
        }
      }
    })
  }
}

onMounted(() => {
  loadUserInfo()
  loadAreaTree()
})
</script>

<style lang="scss" scoped>
.edit-page-wrapper {
  min-height: 100vh;
  background: #121619;
}

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
  }
  .camera-btn {
    z-index: 2;
    margin-top: -46rpx;
    margin-left: 120rpx;
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
    &:last-child { border-bottom: none; }
    .label { color: #fff; font-size: 30rpx; }
  }

  /* 重点修复：让 picker 撑满整行但保持布局 */
  .area-row {
    padding: 0;
    .area-picker {
      flex: 1;
      padding: 30rpx 0;
    }
  }

  .value-wrap {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12rpx;
    .value {
      color: #9CA3AF;
      font-size: 30rpx;
      text-align: right;
    }
  }
}
//
///* 弹出层样式适配暗黑模式 */
//:deep(.uni-data-tree-dialog) {
//  background-color: #1E252B !important;
//  color: #fff !important;
//  .uni-data-tree-header {
//    background-color: #1E252B !important;
//    border-bottom-color: #2a3338 !important;
//  }
//  .uni-data-tree-list {
//    background-color: #1E252B !important;
//  }
//  .dialog-list-item {
//    color: #fff !important;
//    &.is-selected {
//      color: #00BB88 !important;
//    }
//  }
//  /* 选中态的文字颜色 */
//  .selected-item {
//    color: #00BB88 !important;
//  }
//}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
}
</style>