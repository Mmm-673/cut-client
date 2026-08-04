import { computed } from 'vue'
import { useThemeStore } from '@/store'
import { getThemeStyleObject, styleObjectToString } from '@/utils/theme'

/**
 * 主题组合式函数
 * 在页面中使用：
 * import { useTheme } from '@/composables/useTheme'
 * const { themeClass, themeStyle, isDark, isLight } = useTheme()
 */
export function useTheme() {
  const themeStore = useThemeStore()

  // 当前主题
  const theme = computed(() => themeStore.theme)

  // 是否深色主题
  const isDark = computed(() => themeStore.isDark())

  // 是否浅色主题
  const isLight = computed(() => themeStore.isLight())

  // 主题类名
  const themeClass = computed(() => {
    return `theme-${theme.value}`
  })

  // 主题样式对象（用于内联样式）
  const themeStyleObject = computed(() => {
    return getThemeStyleObject(theme.value)
  })

  // 主题样式字符串（用于 style 属性）
  const themeStyle = computed(() => {
    return styleObjectToString(themeStyleObject.value)
  })

  return {
    theme,
    themeClass,
    themeStyle,
    themeStyleObject,
    isDark,
    isLight
  }
}
