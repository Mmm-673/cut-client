<template>
  <page-meta :background-color="bgColor" />
  <view
    :class="['theme-page-wrapper', themeClass]"
    :style="{ backgroundColor: bgColor }"
  >
    <slot />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useThemeStore } from '@/store'
import { applyThemeToPage } from '@/utils/theme'

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

const bgColor = computed(() => {
  return themeStore.theme === 'light' ? '#F5F7FA' : '#121619'
})

// 页面显示时确保主题应用
onShow(() => {
  applyThemeToPage(themeStore.theme)

  // #ifdef APP-PLUS
  // 使用 plus.webview API 设置当前页面背景
  if (typeof plus !== 'undefined' && plus.webview) {
    try {
      const currentWebview = plus.webview.currentWebview()
      if (currentWebview) {
        currentWebview.setStyle({
          background: bgColor.value
        })
      }
    } catch (e) {
      console.warn('[ThemePage] 设置 webview 背景失败:', e)
    }
  }
  // #endif
})
</script>

<style lang="scss" scoped>
.theme-page-wrapper {
  min-height: calc(var(--vh, 1vh) * 100);
  width: 100%;
  transition: background-color 0.3s ease;
}
</style>
