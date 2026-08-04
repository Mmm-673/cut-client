import { onShow } from '@dcloudio/uni-app'
import { useThemeStore } from '@/store'
import { applyThemeToPage } from '@/utils/theme'

/**
 * 页面主题管理 composable
 * 在每个页面中调用，确保切换主题时页面能正确更新
 */
export function usePageTheme() {
  const themeStore = useThemeStore()

  // 页面显示时应用主题
  onShow(() => {
    // 确保页面应用当前主题
    applyThemeToPage(themeStore.theme)
  })

  return {
    theme: themeStore.theme,
    isDark: themeStore.isDark,
    isLight: themeStore.isLight
  }
}
