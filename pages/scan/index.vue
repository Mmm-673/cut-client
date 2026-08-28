<template>
  <view class="scan-wrapper" :class="themeClass">

    <!-- #ifdef H5 -->
    <!-- H5 端：html5-qrcode 实时相机扫码 -->
    <view class="h5-scan-container">

      <!-- 扫码区域：占位图和相机容器叠加，未开启时显示占位 -->
      <view class="h5-scan-box">
        <!-- 未开启时的占位提示 -->
        <view v-if="!scannerActive" class="h5-scan-placeholder">
          <view class="ph-icon">
            <uni-icons type="scan" size="60" color="#00BB88" />
          </view>
          <text class="ph-title">扫描二维码</text>
          <text class="ph-desc">点击下方按钮开启相机</text>
        </view>
        <!-- html5-qrcode 容器（始终存在，保证初始化可用） -->
        <view id="qr-reader" class="h5-qr-reader" :class="{ active: scannerActive }"></view>
      </view>

      <view class="h5-scan-btns">
        <view v-if="!scannerActive" class="scan-btn" @click="startScanner">
          <text class="scan-btn-text">开启相机扫码</text>
        </view>
        <view v-else class="scan-btn scan-btn-secondary" @click="stopScanner">
          <text class="scan-btn-text">关闭相机</text>
        </view>
        <view class="album-btn" @click="handleAlbumScan">
          <uni-icons type="image" size="22" color="#00BB88" />
          <text class="album-btn-text">从相册选择二维码</text>
        </view>
      </view>
    </view>
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <!-- 非 H5 端：原生扫码 -->
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
    <!-- #endif -->

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
import { ref, computed, onUnmounted } from 'vue'
import { showCameraPurposeModal, showAlbumPurposeModal, showCameraPermissionModal, showAlbumPermissionModal } from '@/utils/photo'
import { useThemeStore } from '@/store'

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

const loading = ref(false)

// #ifdef H5
// H5 端 html5-qrcode 扫码器实例
let html5QrCode = null
const scannerActive = ref(false)

// 启动 H5 相机扫码
const startScanner = async () => {
  try {
    loading.value = true
    const { Html5Qrcode } = await import('html5-qrcode')

    // 创建新实例（保证每次 start 都是干净状态）
    if (html5QrCode) {
      try {
        await html5QrCode.clear()
      } catch (e) { /* ignore */ }
      html5QrCode = null
    }
    html5QrCode = new Html5Qrcode('qr-reader')

    const config = {
      fps: 15,
      // 设为 undefined，由我们自己用 CSS 绘制更精致的扫码框
      qrbox: undefined,
      aspectRatio: 1.0,
      videoConstraints: {
        facingMode: 'environment',
        aspectRatio: 1.0
      }
    }

    const onSuccess = (decodedText) => {
      stopScanner()
      processQrResult(decodedText)
    }
    const onScanFailure = () => {
      // 扫描过程中的识别失败，忽略
    }

    let started = false

    // 1. 先尝试后置摄像头
    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        onSuccess,
        onScanFailure
      )
      started = true
    } catch (firstErr) {
      console.warn('[H5扫码] 后置失败，尝试前置:', firstErr?.message || firstErr)
    }

    // 2. 后置失败，重新 new 实例后尝试前置
    if (!started) {
      try {
        await html5QrCode.clear()
      } catch (e) { /* ignore */ }
      html5QrCode = new Html5Qrcode('qr-reader')

      await html5QrCode.start(
        { facingMode: 'user' },
        config,
        onSuccess,
        onScanFailure
      )
      started = true
    }

    if (started) {
      scannerActive.value = true
    }
    loading.value = false
  } catch (err) {
    console.error('[H5扫码] 启动失败:', err?.name, err?.message)
    loading.value = false
    scannerActive.value = false
    html5QrCode = null

    const msg = (err?.message || err?.name || '').toString().toLowerCase()
    let tip = '相机启动失败，请重试'
    if (msg.includes('notallowederror') || msg.includes('notallowed') || msg.includes('denied') || msg.includes('permission')) {
      tip = '相机权限被拒绝，请在浏览器设置中开启'
      showCameraPermissionModal()
    } else if (msg.includes('notfound') || msg.includes('no device')) {
      tip = '未检测到可用摄像头设备'
    } else if (typeof location !== 'undefined' && location.protocol === 'http:' &&
               location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      tip = 'HTTP 环境无法使用相机，请使用 HTTPS 访问'
    }
    uni.showToast({ title: tip, icon: 'none', duration: 2500 })
  }
}

// 停止 H5 相机扫码
const stopScanner = async () => {
  if (html5QrCode && scannerActive.value) {
    try {
      await html5QrCode.stop()
    } catch (e) {
      console.warn('[H5扫码] stop 异常:', e)
    }
    try {
      await html5QrCode.clear()
    } catch (e) {
      console.warn('[H5扫码] clear 异常:', e)
    }
    html5QrCode = null
    scannerActive.value = false
  }
}

// 页面卸载时清理
onUnmounted(() => {
  if (html5QrCode) {
    html5QrCode.stop().catch(() => {})
    html5QrCode.clear().catch(() => {})
    html5QrCode = null
  }
})
// #endif
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
// #ifndef H5
// 非 H5 端：使用原生扫码
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
// #endif

</script>

<style lang="scss" scoped>
.scan-wrapper {
  min-height: 100vh;
  min-height: calc(var(--vh, 1vh) * 100);
  background-color: #121619;
  display: flex;
  flex-direction: column;
}

/* 通用按钮样式 */
.scan-btn {
  width: 520rpx;
  height: 92rpx;
  background: linear-gradient(135deg, #00BB88 0%, #059669 100%);
  border-radius: 46rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 187, 136, 0.25);
  transition: all 0.2s ease;

  .scan-btn-text {
    color: #FFFFFF;
    font-size: 30rpx;
    font-weight: 600;
  }

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

.scan-btn-secondary {
  background: rgba(0, 187, 136, 0.12);
  border: 2rpx solid rgba(0, 187, 136, 0.3);
  box-shadow: none;

  .scan-btn-text {
    color: #00BB88;
  }
}

.album-btn {
  width: 520rpx;
  height: 92rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-top: 28rpx;
  border: 2rpx solid rgba(0, 187, 136, 0.4);
  border-radius: 46rpx;
  background: transparent;
  transition: all 0.2s ease;

  .album-btn-text {
    color: #00BB88;
    font-size: 28rpx;
    font-weight: 500;
  }

  &:active {
    background: rgba(0, 187, 136, 0.08);
  }
}

/* H5 端扫码视口 */
.h5-scan-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx 0;

  .h5-scan-title {
    color: #FFFFFF;
    font-size: 38rpx;
    font-weight: 700;
    margin-bottom: 12rpx;
  }

  .h5-scan-desc {
    color: #8E9AA8;
    font-size: 26rpx;
    margin-bottom: 50rpx;
  }

  .h5-scan-box {
    width: 540rpx;
    height: 540rpx;
    position: relative;
    border-radius: 32rpx;
    overflow: hidden;
    background: #0B0E10;
    box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .h5-scan-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle, rgba(0, 187, 136, 0.08) 0%, rgba(18, 22, 25, 0.4) 100%);
    border: 2rpx dashed rgba(0, 187, 136, 0.35);
    border-radius: 32rpx;
    z-index: 2;

    .ph-icon {
      width: 140rpx;
      height: 140rpx;
      background: rgba(0, 187, 136, 0.12);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24rpx;
    }

    .ph-title {
      color: #E2E8F0;
      font-size: 32rpx;
      font-weight: 600;
      margin-bottom: 8rpx;
    }

    .ph-desc {
      color: #8E9AA8;
      font-size: 24rpx;
    }
  }

  .h5-qr-reader {
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.3s ease;

    &.active {
      opacity: 1;
    }

    /* 保证视频撑满容器且居中裁剪，彻底消除黑边 */
    & :deep(video) {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      border-radius: 32rpx !important;
    }

    /* 隐藏插件自带的遮罩与控制层 */
    & :deep(#qr-reader__scan_region) {
      background: transparent !important;
    }
    & :deep(#qr-reader__dashboard),
    & :deep(#qr-reader__dashboard_section),
    & :deep(#qr-shaded-region) {
      display: none !important;
    }
  }

  .h5-scan-btns {
    margin-top: 60rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

/* 非 H5 端样式 */
.scan-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 140rpx;

  .scan-icon-box {
    width: 220rpx;
    height: 220rpx;
    background: rgba(0, 187, 136, 0.08);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;
    border: 2rpx dashed rgba(0, 187, 136, 0.4);
  }

  .scan-title {
    color: #FFFFFF;
    font-size: 38rpx;
    font-weight: 700;
    margin-bottom: 12rpx;
  }

  .scan-desc {
    color: #8E9AA8;
    font-size: 26rpx;
    margin-bottom: 70rpx;
  }
}

/* 全局 Loading 蒙层 */
.loading-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;

  .loading-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
    padding: 48rpx 64rpx;
    background: rgba(30, 38, 44, 0.9);
    border-radius: 24rpx;
    border: 1px solid rgba(255, 255, 255, 0.08);

    .loading-text {
      color: #E2E8F0;
      font-size: 26rpx;
    }
  }
}

.safe-area-floor {
  height: env(safe-area-inset-bottom);
}
</style>