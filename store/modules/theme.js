import { defineStore } from 'pinia'
import { ref } from 'vue'

const THEME_STORAGE_KEY = 'app_theme'

export const useThemeStore = defineStore('theme', () => {
  // 当前主题，默认为深色
  const theme = ref('dark')

  // 初始化主题
  const initTheme = () => {
    try {
      const stored = uni.getStorageSync(THEME_STORAGE_KEY)
      if (stored === 'dark' || stored === 'light') {
        theme.value = stored
      }
    } catch (e) {
      console.warn('[Theme] 读取主题设置失败:', e)
    }
  }

  // 设置主题
  const setTheme = (newTheme) => {
    theme.value = newTheme
    try {
      uni.setStorageSync(THEME_STORAGE_KEY, newTheme)
    } catch (e) {
      console.warn('[Theme] 保存主题设置失败:', e)
    }
  }

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme.value === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    return newTheme
  }

  // 判断是否深色主题
  const isDark = () => theme.value === 'dark'

  // 判断是否白天主题
  const isLight = () => theme.value === 'light'

  return {
    theme,
    initTheme,
    setTheme,
    toggleTheme,
    isDark,
    isLight
  }
})
