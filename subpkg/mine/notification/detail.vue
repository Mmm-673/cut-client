<template>
  <view :class="themeClass" class="detail-page">
    <view class="detail-content" v-if="detail">
      <text class="detail-title">{{ detail.title }}</text>
      <text class="detail-time">发布时间:{{ formatTime(detail.publishTime) }}</text>
      <view class="detail-body">
        <rich-text :nodes="detail.content" v-if="isRichText"></rich-text>
        <text class="detail-text" v-else>{{ detail.content }}</text>
      </view>
    </view>

    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useThemeStore } from '@/store'
import { getNotificationDetail, markAsRead } from '@/api/billiard/notification'

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

const detail = ref(null)
const loading = ref(true)
const notificationId = ref(null)
const isRichText = ref(false)

const checkRichText = (content) => {
  return /<[^>]+>/.test(content || '')
}

const fetchDetail = async () => {
  if (!notificationId.value) return
  loading.value = true
  try {
    const res = await getNotificationDetail(notificationId.value)
    detail.value = res.data
    isRichText.value = checkRichText(res.data?.content)
    // 标记已读
    if (res.data?.readStatus === 0) {
      await markAsRead(notificationId.value)
    }
  } catch (e) {
    console.error('获取通知详情失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const formatTime = (timeVal) => {
  if (!timeVal && timeVal !== 0) return ''

  let date
  // 数字：时间戳（兼容秒和毫秒）
  if (typeof timeVal === 'number') {
    const ts = timeVal > 1e12 ? timeVal : timeVal * 1000
    date = new Date(ts)
  }
  // 字符串
  else if (typeof timeVal === 'string') {
    // 纯数字字符串也按时间戳处理
    if (/^\d+$/.test(timeVal)) {
      const ts = Number(timeVal)
      date = new Date(ts > 1e12 ? ts : ts * 1000)
    } else {
      date = new Date(timeVal.replace('T', ' '))
    }
  } else {
    return ''
  }

  if (isNaN(date.getTime())) return ''

  const pad = (n) => n < 10 ? '0' + n : '' + n
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

onLoad((options) => {
  notificationId.value = options?.id
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background-color: #121619;
  padding: 30rpx;
  box-sizing: border-box;
}

.detail-content {
  .detail-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #fff;
    line-height: 1.4;
    display: block;
    margin-bottom: 16rpx;
  }

  .detail-time {
    font-size: 24rpx;
    color: #666;
    display: block;
    margin-bottom: 30rpx;
  }

  .detail-body {
    :deep(img) {
      max-width: 100%;
      height: auto;
    }

    :deep(p) {
      margin: 20rpx 0;
      color: #e0e0e0;
      font-size: 30rpx;
      line-height: 1.8;
    }

    :deep(span) {
      color: #e0e0e0;
    }

    :deep(strong) {
      color: #fff;
    }

    :deep(a) {
      color: #00BB88;
    }

    .detail-text {
      font-size: 30rpx;
      color: #e0e0e0;
      line-height: 1.8;
      white-space: pre-wrap;
    }
  }
}

.loading {
  text-align: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: #666;
}
</style>
