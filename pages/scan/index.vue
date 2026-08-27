<template>
  <view class="scan-wrapper" :class="themeClass">

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
import { ref, computed } from 'vue'
import { showCameraPurposeModal, showAlbumPurposeModal, showCameraPermissionModal, showAlbumPermissionModal } from '@/utils/photo'
import { useThemeStore } from '@/store'

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

const loading = ref(false)
// 从 URL 中提取参数
const getQueryParam = (url, param) => {
  const queryString = url.split('?')[1]
  if (!queryString) return null

  const pairs = queryString.split('&')
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=')
    if (pair[0] === param) {
      return decodeURIComponent(pair[1] || '')
    }
  }
  return null
}

// 处理扫码结果（扫码和相册共用）
const processQrResult = (rawResult) => {

  let coachId = null

  // 方式1：尝试解析 JSON 格式
  try {
    const result = JSON.parse(rawResult)
    if (result && typeof result === 'object' && result.coachId) {
      coachId = result.coachId
    }
  } catch (e) {
    // JSON 解析失败，继续尝试其他方式
  }

  // 方式2：如果没有从 JSON 中获取到，尝试解析 URL 格式
  if (!coachId && typeof rawResult === 'string') {
    // 检查是否是指定的 URL 格式
    if (rawResult.includes('coach-link.html') || rawResult.includes('coachId=')) {
      coachId = getQueryParam(rawResult, 'coachId')
    }
    // 兼容新格式：https://qiulem.com/scan?id=27&name=小帅
    else if (rawResult.includes('/scan?id=') || rawResult.includes('qiulem.com')) {
      coachId = getQueryParam(rawResult, 'id')
    }
  }

  if (coachId) {
    uni.navigateTo({
      url: `/subpkg/coach/detail?id=${coachId}`
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

// ---- 相册扫码：解码二维码 ----
const decodeImage = async (filePath) => {
  try {
    // #ifdef APP-PLUS

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


    const code = await new Promise((resolve, reject) => {
      plus.barcode.scan(
          scanPath,
          (type, result) => {
            resolve(result)
          },
          (err) => {
            console.error('[相册扫码] 解码失败:', JSON.stringify(err), err)
            reject(err)
          }
      )
    })

    loading.value = false
    if (code) {
      processQrResult(code)
    } else {
      uni.showToast({ title: '未识别到二维码，请选择清晰的二维码图片', icon: 'none' })
    }
    // #endif

    // #ifdef H5
    // H5 平台：使用 jsQR 解码
    loading.value = true

    try {
      const img = new Image()
      // 仅网络跨域图片需要 crossOrigin，本地临时文件（blob/base64）不需要
      if (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
        img.crossOrigin = 'anonymous'
      }
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0, img.width, img.height)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          // 动态 import jsQR，避免非 H5 打包
          import('jsqr').then(({ default: jsQR }) => {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            })

            loading.value = false
            if (code && code.data) {
              processQrResult(code.data)
            } else {
              uni.showToast({ title: '未识别到二维码，请选择清晰的二维码图片', icon: 'none' })
            }
          }).catch((err) => {
            loading.value = false
            console.error('[相册扫码-H5] jsQR 加载失败:', err)
            uni.showToast({ title: '解码库加载失败', icon: 'none' })
          })
        } catch (err) {
          loading.value = false
          console.error('[相册扫码-H5] 解码异常:', err)
          uni.showToast({ title: '未识别到二维码，请选择清晰的二维码图片', icon: 'none' })
        }
      }
      img.onerror = () => {
        loading.value = false
        uni.showToast({ title: '图片加载失败', icon: 'none' })
      }
      img.src = filePath
    } catch (err) {
      loading.value = false
      console.error('[相册扫码-H5] 异常:', err)
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

    // #ifdef MP-WEIXIN
    // 微信小程序：直接使用 scanCode 的相册功能，避免二次选择
    loading.value = false
    uni.scanCode({
      scanType: ['qrCode'],
      success: (res) => {
        processQrResult(res.result)
      },
      fail: (err) => {
        console.error('[相册扫码-小程序] 失败:', err)
        // 如果用户取消，不显示错误提示
        if (!err.errMsg?.includes('cancel')) {
          uni.showToast({ title: '未识别到二维码，请选择清晰的二维码图片', icon: 'none' })
        }
      }
    })
    // #endif

    // #ifndef MP-WEIXIN
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
    // #endif
  } catch (err) {
    loading.value = false
    if (err?.message === 'user_cancelled') {
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
        processQrResult(res.result)
      },
      fail: (err) => {
        console.error('扫码失败:', err)
        if (err.errMsg && err.errMsg.includes('cancel')) {
          // 用户取消
        } else if (err.errMsg && (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize') || err.errMsg.includes('denied') || err.errMsg.includes('fail'))) {
          // 权限拒绝，显示引导弹窗
          showCameraPermissionModal()
          // #ifdef H5
          // H5 端额外提示：可以使用相册扫码作为替代
          setTimeout(() => {
            uni.showToast({ title: '相机不可用，可尝试从相册选择二维码', icon: 'none', duration: 2500 })
          }, 500)
          // #endif
        } else {
          uni.showToast({
            title: '扫码失败，请重试',
            icon: 'none',
            duration: 1500
          })
        }
      }
    })
  } catch (err) {
    console.error('处理扫码请求失败:', err)
    if (err?.message === 'user_cancelled') {
      // 用户取消了相机权限用途说明，不进行任何操作
    } else {
      uni.showToast({
        title: '扫码失败，请重试',
        icon: 'none',
        duration: 1500
      })
    }
  }
}

</script>

<style lang="scss" scoped>
.scan-wrapper {
  height: calc(var(--vh, 1vh) * 100);
  background-color: var(--bg-page);
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
        color: var(--text-primary);
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
        color: var(--text-primary);
        font-size: 36rpx;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: -1rpx;
      }
      .nav-subtitle {
        color: var(--text-tertiary);
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
    color: var(--text-primary);
    font-size: 36rpx;
    font-weight: 600;
    margin-bottom: 16rpx;
  }

  .scan-desc {
    color: var(--text-tertiary);
    font-size: 28rpx;
    margin-bottom: 80rpx;
  }

  .scan-btn {
    background: linear-gradient(135deg, #00BB88 0%, #059669 100%);
    padding: 24rpx 100rpx;
    border-radius: 50rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 187, 136, 0.3);

    .scan-btn-text {
      color: var(--text-primary);
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
      color: var(--text-primary);
      font-size: 28rpx;
    }
  }
}
</style>