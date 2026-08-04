<template>
  <view :class="themeClass">
    <uni-card class="view-title" :title="title">
      <text class="uni-body view-content">{{ content }}</text>
    </uni-card>
  </view>
</template>

<script>
import { useThemeStore } from '@/store'

export default {
  data() {
    return {
      title: '',
      content: '',
      themeStore: null
    }
  },
  computed: {
    themeClass() {
      return `theme-${this.themeStore.theme}`
    }
  },
  onLoad(options) {
    this.title = options.title
    this.content = options.content
    uni.setNavigationBarTitle({
      title: options.title
    })
  },
  created() {
    this.themeStore = useThemeStore()
  }
}
</script>

<style scoped>
  page {
    background-color: var(--bg-page);
  }

  .view-title {
    font-weight: bold;
  }

  .view-content {
    font-size: 26rpx;
    padding: 12px 5px 0;
    color: var(--text-primary);
    line-height: 24px;
    font-weight: normal;
  }
</style>
