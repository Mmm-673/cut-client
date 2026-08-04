import { computed } from 'vue'
import { useThemeStore } from '@/store'

/**
 * 主题混入
 * 在页面中使用：
 * import { themeMixin } from '@/mixins/themeMixin'
 *
 * export default {
 *   mixins: [themeMixin]
 * }
 *
 * 或者在 script setup 中：
 * import { useThemePage } from '@/mixins/themeMixin'
 * const { themeClass } = useThemePage()
 */

// 为 Composition API 设计
export function useThemePage() {
  const themeStore = useThemeStore()

  const themeClass = computed(() => {
    return `theme-${themeStore.theme}`
  })

  const isDark = computed(() => themeStore.isDark())
  const isLight = computed(() => themeStore.isLight())

  return {
    themeClass,
    isDark,
    isLight,
    theme: computed(() => themeStore.theme)
  }
}

// 为 Options API 设计
export const themeMixin = {
  computed: {
    themeClass() {
      const themeStore = useThemeStore()
      return `theme-${themeStore.theme}`
    },
    isDark() {
      const themeStore = useThemeStore()
      return themeStore.isDark()
    },
    isLight() {
      const themeStore = useThemeStore()
      return themeStore.isLight()
    }
  }
}
