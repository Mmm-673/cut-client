// 主题工具函数
import { useThemeStore } from '@/store'

// 最早期的主题初始化（在应用启动时立即调用）
export function initThemeEarly() {
  try {
    // 直接读取存储，不依赖 store
    const stored = uni.getStorageSync('app_theme')
    const theme = (stored === 'dark' || stored === 'light') ? stored : 'dark'


    // #ifdef H5
    // H5：立即给 html 和 body 添加主题类
    if (typeof document !== 'undefined') {
      if (theme === 'light') {
        document.documentElement.classList.add('theme-light')
        document.documentElement.classList.remove('theme-dark')
        document.body.classList.add('theme-light')
        document.body.classList.remove('theme-dark')
      } else {
        document.documentElement.classList.add('theme-dark')
        document.documentElement.classList.remove('theme-light')
        document.body.classList.add('theme-dark')
        document.body.classList.remove('theme-light')
      }
    }
    // #endif

    // #ifdef MP-WEIXIN
    // 微信小程序：设置导航栏和 tabBar 样式（尽早设置）
    const systemStyle = getNavigationBarStyle(theme)
    try {
      uni.setNavigationBarColor({
        frontColor: systemStyle.textStyle === 'black' ? '#000000' : '#ffffff',
        backgroundColor: systemStyle.backgroundColor,
      })
    } catch (e) {
      console.warn('[Theme] 设置导航栏颜色失败:', e)
    }
    // #endif

    return theme
  } catch (e) {
    console.warn('[Theme] 早期主题初始化失败:', e)
    return 'dark'
  }
}

// 获取 TabBar 配置（根据主题）
export function getTabBarStyle(theme) {
  if (theme === 'light') {
    return {
      color: '#6B7280',
      selectedColor: '#00BB88',
      backgroundColor: '#FFFFFF',
      borderStyle: 'white'
    }
  }
  return {
    color: '#666666',
    selectedColor: '#00BB88',
    backgroundColor: '#1E252B',
    borderStyle: 'black'
  }
}

// 获取导航栏配置（根据主题）
export function getNavigationBarStyle(theme) {
  if (theme === 'light') {
    return {
      backgroundColor: '#FFFFFF',
      textStyle: 'black',
      titleText: '初球'
    }
  }
  return {
    backgroundColor: '#121619',
    textStyle: 'white',
    titleText: '初球'
  }
}

// 获取主题样式对象（用于小程序内联样式）
export function getThemeStyleObject(theme) {
  if (theme === 'light') {
    return {
      '--bg-page': '#F5F7FA',
      '--bg-card': '#FFFFFF',
      '--bg-secondary': '#F8FAFC',
      '--text-primary': '#1F2937',
      '--text-secondary': '#6B7280',
      '--text-tertiary': '#9CA3AF',
      '--border-color': '#E5E7EB',
      '--divider-color': '#EEF2F6',
      '--card-shadow': '0 8px 30px rgba(15,23,42,0.08)',
      '--online-dot': '#22C55E',
      '--online-bg': '#ECFDF3',
      '--star-color': '#FFB800',
      '--star-text': '#B7791F'
    }
  }
  return {
    '--bg-page': '#121619',
    '--bg-card': '#1E252B',
    '--bg-secondary': '#2a3338',
    '--text-primary': '#ffffff',
    '--text-secondary': '#9CA3AF',
    '--text-tertiary': '#6B7280',
    '--border-color': 'rgba(255,255,255,0.05)',
    '--divider-color': 'rgba(255,255,255,0.08)',
    '--card-shadow': '0 16px 40px rgba(0,0,0,0.3)',
    '--online-dot': '#00BB88',
    '--online-bg': 'rgba(0,0,0,0.6)',
    '--star-color': '#FFB800',
    '--star-text': '#FFB800'
  }
}

// 将样式对象转换为字符串
export function styleObjectToString(styleObj) {
  return Object.entries(styleObj)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ')
}

// 直接使用 plus.webview 设置页面背景
export function setWebviewBackground(theme) {
  const bgColor = theme === 'light' ? '#F5F7FA' : '#121619'

  // #ifdef APP-PLUS
  if (typeof plus !== 'undefined' && plus.webview) {
    try {
      const currentWebview = plus.webview.currentWebview()
      if (currentWebview) {
        currentWebview.setStyle({
          background: bgColor
        })
      }
    } catch (e) {
      console.warn('[Theme] setWebviewBackground 失败:', e)
    }
  }
  // #endif
}

// 更新导航栏样式
export function updateNavigationBarStyle(theme) {
  const style = getNavigationBarStyle(theme)
  try {
    uni.setNavigationBarColor({
      frontColor: style.textStyle === 'black' ? '#000000' : '#ffffff',
      backgroundColor: style.backgroundColor,
      fail: (err) => {
        console.warn('[Theme] 更新导航栏样式失败:', err)
      }
    })
  } catch (e) {
    console.warn('[Theme] 更新导航栏样式异常:', e)
  }
}

// 更新 TabBar 样式
export function updateTabBarStyle(theme) {
  const style = getTabBarStyle(theme)

  try {
    uni.setTabBarStyle({
      color: style.color,
      selectedColor: style.selectedColor,
      backgroundColor: style.backgroundColor,
      borderStyle: style.borderStyle,
      success: () => {
      },
      fail: (err) => {
        console.warn('[Theme] 更新 TabBar 样式失败:', err)
      }
    })
  } catch (e) {
    console.warn('[Theme] 更新 TabBar 样式异常:', e)
  }
}

// 应用主题到当前页面
export function applyThemeToPage(theme) {

  // #ifdef H5
  try {
    if (theme === 'light') {
      document.documentElement.classList.remove('theme-dark')
      document.documentElement.classList.add('theme-light')
      document.body.classList.remove('theme-dark')
      document.body.classList.add('theme-light')
    } else {
      document.documentElement.classList.remove('theme-light')
      document.documentElement.classList.add('theme-dark')
      document.body.classList.remove('theme-light')
      document.body.classList.add('theme-dark')
    }
  } catch (e) {
    console.warn('[Theme] H5 主题类名应用失败:', e)
  }
  // #endif

  // #ifdef MP-WEIXIN
  // 微信小程序：尝试设置 page 元素样式
  try {
    const pages = getCurrentPages()
    if (pages && pages.length > 0) {
      const page = pages[pages.length - 1]
      if (page && page.$vm) {
        // 给页面 vm 添加主题类标记
        page.$vm._themeApplied = theme
      }
    }
  } catch (e) {
    console.warn('[Theme] 小程序主题应用失败:', e)
  }
  // #endif

  // 更新导航栏
  updateNavigationBarStyle(theme)

  // 更新 TabBar
  updateTabBarStyle(theme)

  // 更新 webview 背景
  setWebviewBackground(theme)
}

// 应用主题（入口函数）
export function applyTheme(theme) {
  const themeStore = useThemeStore()

  if (themeStore.theme !== theme) {
    themeStore.setTheme(theme)
  }

  applyThemeToPage(theme)
}

// 初始化主题（在 App onLaunch 调用）
export function initTheme() {
  const themeStore = useThemeStore()
  themeStore.initTheme()

  // 立即应用主题
  applyThemeToPage(themeStore.theme)

  return themeStore.theme
}
