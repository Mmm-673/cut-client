<template>
  <view v-if="visible" class="image-viewer-container" @touchmove.stop.prevent>
    <!-- 背景遮罩 -->
    <view class="viewer-overlay" @click="close"></view>

    <!-- 图片容器 -->
    <view class="viewer-content">
      <!-- 关闭按钮 -->
      <view class="close-btn" @click="close">
        <uni-icons type="close" size="32" color="#ffffff"></uni-icons>
      </view>

      <!-- 图片显示区域 -->
      <view class="image-container" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
        <image
          :src="currentImage"
          class="viewer-image"
          mode="aspectFit"
          :style="imageStyle"
          @longpress="onLongPress"
        ></image>
      </view>

      <!-- 页码指示器 -->
      <view v-if="images.length > 1" class="page-indicator">
        {{ currentIndex + 1 }} / {{ images.length }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

// 属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  images: {
    type: Array,
    default: () => []
  },
  current: {
    type: Number,
    default: 0
  },
  // 是否禁止长按保存（默认禁止）
  disableLongPress: {
    type: Boolean,
    default: true
  }
})

// 事件
const emit = defineEmits(['close'])

// 内部状态
const currentIndex = ref(props.current)
const scale = ref(1)
const touchStart = ref({ x: 0, y: 0 })
const touchMove = ref({ x: 0, y: 0 })
const isDragging = ref(false)

// 计算属性
const currentImage = computed(() => {
  return props.images[currentIndex.value] || ''
})

const imageStyle = computed(() => {
  return {
    transform: `scale(${scale.value})`,
    transition: isDragging.value ? 'none' : 'transform 0.3s ease-out'
  }
})

// 监听属性变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    currentIndex.value = props.current
    scale.value = 1
    touchStart.value = { x: 0, y: 0 }
    touchMove.value = { x: 0, y: 0 }
    isDragging.value = false
  }
})

watch(() => props.current, (newVal) => {
  if (props.visible) {
    currentIndex.value = newVal
    scale.value = 1
  }
})

// 触摸事件处理
const onTouchStart = (e) => {
  isDragging.value = true
  touchStart.value = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY
  }
}

const onTouchMove = (e) => {
  if (!isDragging.value) return

  touchMove.value = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY
  }
}

const onTouchEnd = (e) => {
  isDragging.value = false

  // 计算滑动距离
  const deltaX = touchMove.value.x - touchStart.value.x
  const deltaY = touchMove.value.y - touchStart.value.y

  // 判断是否为左右滑动（用于切换图片）
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    if (deltaX > 0 && currentIndex.value > 0) {
      // 向右滑动，显示上一张
      currentIndex.value--
    } else if (deltaX < 0 && currentIndex.value < props.images.length - 1) {
      // 向左滑动，显示下一张
      currentIndex.value++
    }
  }
}

// 长按事件处理
const onLongPress = () => {
  if (props.disableLongPress) {
    // 禁止长按保存，不做任何处理
    return
  }
  // 如果允许长按，可以添加保存功能
}

// 关闭方法
const close = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
.image-viewer-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  animation: fadeIn 0.2s ease-out;
}

.viewer-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: slideUp 0.3s ease-out;
}

.close-btn {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 60rpx);
  right: 40rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  z-index: 10;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  box-sizing: border-box;
}

.viewer-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.page-indicator {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom) + 60rpx);
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  font-size: 28rpx;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>