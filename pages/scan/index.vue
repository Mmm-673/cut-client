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
      <view class="album-btn" @click="handleAlbumScan">
        <uni-icons type="image" size="22" color="#00BB88" />
        <text class="album-btn-text">从相册选择二维码</text>
      </view>
    </view>
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-mask">
      <view class="loading-box">
        <uni-icons type="spinner-cycle" size="48" color="#00BB88" />
        <text class="loading-text">正在识别二维码…</text>
      </view>
    </view>

    <view class="safe-area-floor"></view>

  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showCameraPurposeModal, showAlbumPurposeModal, showCameraPermissionModal, showAlbumPermissionModal } from '@/utils/photo'

const statusBarHeight = ref(0)
const loading = ref(false)
// 处理扫码结果（扫码和相册共用）
const processQrResult = (rawResult) => {
  console.log('[processQrResult] 原始内容:', rawResult, '类型:', typeof rawResult)
  let result
  try {
    result = JSON.parse(rawResult)
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
    uni.navigateTo({
      url: `/subpkg/coach/detail?id=${result.coachId}`
    })
  } else {
    uni.showToast({
      title: '无法识别的二维码',
      icon: 'none'
    })
  }
}

// ---- 将临时路径转为原生绝对路径（plus.barcode.scan 需要原生路径）----
const convertToNativePath = (tempPath) => {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.io.resolveLocalFileSystemURL(tempPath, (entry) => {
      resolve(entry.toLocalURL())
    }, (err) => {
      console.error('路径转换失败:', err)
      reject(err)
    })
    // #endif
    // #ifndef APP-PLUS
    resolve(tempPath)
    // #endif
  })
}

// ---- 相册扫码：plus.barcode.scan 解码 ----
const decodeImage = async (filePath) => {
  try {
    // #ifdef APP-PLUS
    console.log('[相册扫码] 原始临时路径:', filePath)

    // 尝试多种方式获取可用路径
    let scanPath = filePath
    try {
      scanPath = await new Promise((resolve, reject) => {
        plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
          // toURL() 返回平台原生路径
          resolve(entry.toURL())
        }, (err) => {
          console.warn('[相册扫码] resolveLocalFileSystemURL 失败，使用原始路径:', err)
          resolve(filePath)
        })
      })
    } catch (e) {
      console.warn('[相册扫码] 路径转换异常，使用原始路径:', e)
      scanPath = filePath
    }
    console.log('[相册扫码] 最终扫描路径:', scanPath)

    const code = await new Promise((resolve, reject) => {
      plus.barcode.scan(
          scanPath,
          (type, result) => {
            console.log('[相册扫码] 解码成功, type:', type, 'result:', result)
            resolve(result)
          },
          (err) => {
            console.error('[相册扫码] 解码失败:', JSON.stringify(err), err)
            reject(err)
          }
      )
    })

    loading.value = false
    console.log('[相册扫码] 最终解码内容:', code)
    if (code) {
      processQrResult(code)
    } else {
      uni.showToast({ title: '未识别到二维码，请选择清晰的二维码图片', icon: 'none' })
    }
    // #endif
  } catch (err) {
    loading.value = false
    console.error('[相册扫码] 异常:', err?.message || err, JSON.stringify(err))
    uni.showToast({ title: '未识别到二维码，请选择清晰的二维码图片', icon: 'none' })
  }
}

const handleAlbumScan = async () => {
  try {
    await showAlbumPurposeModal()
    loading.value = true

    const res = await new Promise((resolve, reject) => {
      uni.chooseImage({
        count: 1,
        sourceType: ['album'],
        success: resolve,
        fail: (err) => {
          console.error('chooseImage fail:', err)
          // 判断是否是权限拒绝
          if (err && err.errMsg && (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize') || err.errMsg.includes('denied') || err.errMsg.includes('fail'))) {
            showAlbumPermissionModal()
          }
          reject(err)
        }
      })
    })

    if (!res.tempFilePaths || res.tempFilePaths.length === 0) {
      loading.value = false
      return
    }

    await decodeImage(res.tempFilePaths[0])
  } catch (err) {
    loading.value = false
    if (err?.message === 'user_cancelled') {
      console.log('用户取消了相册权限用途说明')
    } else if (err?.errMsg?.includes('cancel')) {
      // 用户取消选图，不做处理
    } else {
      uni.showToast({ title: '操作失败，请重试', icon: 'none' })
    }
  }
}
const handleScan = async () => {
  try {
    // 显示相机权限用途说明弹窗
    await showCameraPurposeModal()

    // 调用扫码 API
    uni.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        console.log('扫码结果:', res)
        processQrResult(res.result)
      },
      fail: (err) => {
        console.error('扫码失败:', err)
        if (err.errMsg && err.errMsg.includes('cancel')) {
          // 用户取消，返回首页
          // uni.switchTab({
          //   url: '/pages/home/index'
          // })
        } else if (err.errMsg && (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize') || err.errMsg.includes('denied') || err.errMsg.includes('fail'))) {
          // 权限拒绝，显示引导弹窗
          showCameraPermissionModal()
        } else {
          uni.showToast({
            title: '扫码失败，请重试',
            icon: 'none',
            duration: 1500,
            complete: () => {
              // setTimeout(() => {
              //   uni.switchTab({
              //     url: '/pages/home/index'
              //   })
              // }, 1500)
            }
          })
        }
      }
    })
  } catch (err) {
    console.error('处理扫码请求失败:', err)
    if (err?.message === 'user_cancelled') {
      // 用户取消了相机权限用途说明，不进行任何操作
      console.log('用户取消了相机权限用途说明')
    } else {
      uni.showToast({
        title: '扫码失败，请重试',
        icon: 'none',
        duration: 1500
      })
    }
  }
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
.album-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-top: 40rpx;
  padding: 20rpx 48rpx;
  border: 2rpx solid rgba(0, 187, 136, 0.4);
  border-radius: 50rpx;

  .album-btn-text {
    color: #00BB88;
    font-size: 28rpx;
    font-weight: 500;
  }

  &:active {
    background: rgba(0, 187, 136, 0.1);
  }
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
}

/* 加载状态 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;

  .loading-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24rpx;
    padding: 60rpx;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 24rpx;
    backdrop-filter: blur(10px);

    .loading-text {
      color: #fff;
      font-size: 28rpx;
    }
  }
}
</style>