<script setup>
// ==========================================
// 最顶部：立即初始化主题（避免深色闪烁）
// ==========================================
import { initThemeEarly } from '@/utils/theme'
initThemeEarly()
// ==========================================

import config from './config'
import { getAccessToken, getRefreshToken, getExpiresTime, setAuthInfo, clearAuthInfo } from '@/utils/token'
import { useConfigStore, useThemeStore } from '@/store'
import { useUserStore } from '@/store/modules/user'
import { applyThemeToPage, setWebviewBackground, getThemeStyleObject, styleObjectToString } from '@/utils/theme'
import { getCurrentInstance, watch, computed } from "vue"
import { onLaunch, onShow} from '@dcloudio/uni-app'
import { initPushService, syncPushForUser, retryPushSyncIfNeeded } from '@/utils/jpush'
import { shouldShowIosPrivacy, setPrivacyAgreedCallback } from '@/utils/privacy'
import { isReviewMode } from '@/utils/review'
import { extractCoachId } from '@/utils/common'

const { proxy } = getCurrentInstance()

// 初始化主题 store
const themeStore = useThemeStore()
themeStore.initTheme()

// 计算主题类和样式
const themeClass = computed(() => `theme-${themeStore.theme}`)
const themeStyle = computed(() => {
  const styleObj = getThemeStyleObject(themeStore.theme)
  return styleObjectToString(styleObj)
})

onLaunch((options) => {
  console.log('[App] onLaunch, 当前主题:', themeStore.theme)
  setPrivacyAgreedCallback(continueAppInit)
  initApp()
  handleLaunchOptions(options)
  // #ifdef H5
  handleDeepLink()
  // #endif
})

onShow((options) => {
  // #ifdef APP-PLUS
  if (shouldShowIosPrivacy()) {
    return
  }
  retryPushSyncIfNeeded()
  // #endif
  checkLogin()

  // 应用主题
  applyThemeToPage(themeStore.theme)

  // #ifdef APP-PLUS
  // 只使用 plus.webview 设置背景
  if (typeof plus !== 'undefined' && plus.webview) {
    try {
      const bgColor = themeStore.theme === 'light' ? '#F5F7FA' : '#121619'
      const currentWebview = plus.webview.currentWebview()
      if (currentWebview) {
        currentWebview.setStyle({ background: bgColor })
      }
    } catch (e) {
      console.warn('[App] onShow 设置背景失败:', e)
    }
  }
  // #endif

  useConfigStore().initReviewMode()
  handleLaunchOptions(options)
})

watch(() => themeStore.theme, () => {
  applyThemeToPage(themeStore.theme)
  // setWebviewBackground 已在 applyThemeToPage 内部调用，无需重复调用
})

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

let lastCoachNavId = null
let lastCoachNavTime = 0

const handleLaunchOptions = (options) => {
  console.log('[App] 启动参数:', options)
  // #ifdef MP-WEIXIN
  if (!options) return

  let coachId = null

  if (options.query && options.query.coachId) {
    coachId = options.query.coachId
  } else if (options.query && options.query.id) {
    coachId = options.query.id
  } else if (options.query && options.query.scene) {
    console.log('[App] query.scene 参数:', options.query.scene)
    coachId = extractCoachId(options.query.scene)
  } else if (options.query && options.query.q) {
    console.log('[App] query.q 参数:', options.query.q)
    coachId = extractCoachId(options.query.q)
  } else if (options.path && options.path.includes('coachId=')) {
    coachId = getQueryParam(options.path, 'coachId') || getQueryParam(options.path, 'id')
  }

  if (coachId) {
    console.log('[App] 检测到 coachId，跳转到详情页:', coachId)
    setTimeout(() => {
      if (isReviewMode()) {
        console.log('[App] 审核模式开启，跳过教练详情跳转')
        return
      }
      const now = Date.now()
      if (lastCoachNavId === String(coachId) && now - lastCoachNavTime < 3000) {
        console.log('[App] 短时间内重复触发，跳过跳转:', coachId)
        return
      }
      try {
        const pages = getCurrentPages()
        const top = pages.length ? pages[pages.length - 1] : null
        if (top && top.route === 'subpkg/coach/detail') {
          const fullPath = (top.$page && top.$page.fullPath) || ''
          const topOpts = top.options || {}
          const topId = extractCoachId(topOpts.id || topOpts.coachId || fullPath || topOpts.scene || topOpts.q)
          if (topId && String(topId) === String(coachId)) {
            console.log('[App] 当前已在该教练详情页，跳过重复跳转:', coachId)
            return
          }
        }
      } catch (e) {}
      lastCoachNavId = String(coachId)
      lastCoachNavTime = now
      uni.navigateTo({ url: `/subpkg/coach/detail?id=${coachId}` })
    }, 500)
  }
  // #endif
}

// H5 深度链接白名单（不需要登录的页面）
const DEEPLINK_PUBLIC_PAGES = [
  '/pages/home/index',
  '/subpkg/coach/detail',
  '/pages/coach/list',
  '/subpkg/booking/pay-success',
]

// H5 深度链接需要登录的页面
const DEEPLINK_PRIVATE_PAGES = [
  '/subpkg/order/detail',
  '/pages/order/list',
  '/pages/mine/index',
]

function handleDeepLink() {
  // #ifdef H5
  try {
    const hash = window.location.hash || ''
    // hash 格式: #/path?query=value
    if (!hash || hash === '#' || hash === '#/') {
      return
    }

    // 解析路径和查询参数
    const hashPath = hash.replace(/^#/, '')
    const [path] = hashPath.split('?')

    // 检查是否是有效页面路径
    const isPublicPage = DEEPLINK_PUBLIC_PAGES.some(p => path.startsWith(p))
    const isPrivatePage = DEEPLINK_PRIVATE_PAGES.some(p => path.startsWith(p))

    if (!isPublicPage && !isPrivatePage) {
      return // 不是深度链接白名单页面，走正常流程
    }

    const token = getAccessToken()
    const hasValidToken = token && getExpiresTime() && new Date() < getExpiresTime()

    if (isPrivatePage && !hasValidToken) {
      // 需要登录但未登录，保存目标路径，跳登录页
      uni.setStorageSync('deep_link_target', hashPath)
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/login/index' })
      }, 100)
      return
    }

    // 已登录或公开页面，直接跳转
    // 延迟执行，确保 App 初始化完成
    setTimeout(() => {
      uni.reLaunch({ url: hashPath })
    }, 300)
  } catch (e) {
    console.warn('[App] 深度链接解析失败:', e)
  }
  // #endif
}

function initApp() {
  initConfig()

  // 主题已经在顶层初始化了

  // #ifdef APP-PLUS
  // 只使用 plus.webview 设置初始背景
  if (typeof plus !== 'undefined' && plus.webview) {
    try {
      const bgColor = themeStore.theme === 'light' ? '#F5F7FA' : '#121619'
      const currentWebview = plus.webview.currentWebview()
      if (currentWebview) {
        currentWebview.setStyle({ background: bgColor })
      }
    } catch (e) {
      console.warn('[App] init 设置背景失败:', e)
    }
  }
  // #endif

  // 应用主题（导航栏和 TabBar）
  applyThemeToPage(themeStore.theme)

  // #ifdef APP-PLUS
  setStatusBarHeight()

  if (shouldShowIosPrivacy()) {
    return
  }
  // #endif

  // #ifdef H5
  setStatusBarHeightH5()
  setVh()
  window.addEventListener('resize', setVh)
  // 移动端地址栏收起/展开时也会触发 resize，自动更新 --vh
  // #endif

  continueAppInit()
}

function continueAppInit() {
  // #ifdef APP-PLUS
  initPushService()
  // #endif

  useConfigStore().initReviewMode()
  checkLogin()
}

function initConfig() {
  useConfigStore().setConfig(config)
}

function setStatusBarHeight() {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 0
  uni.$statusBarHeight = statusBarHeight
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const page = pages[pages.length - 1]
    page.$vm && (page.$vm.statusBarHeight = statusBarHeight)
  }
}

function setStatusBarHeightH5() {
  // #ifdef H5
  try {
    const systemInfo = uni.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    uni.$statusBarHeight = statusBarHeight

    if (statusBarHeight > 0 && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--status-bar-height', statusBarHeight + 'px')
    } else {
      // 兜底：使用 safe-area-inset-top
      document.documentElement.style.setProperty('--status-bar-height', 'env(safe-area-inset-top)')
    }
  } catch (e) {
    console.warn('[App] H5 状态栏高度设置失败:', e)
  }
  // #endif
}

function setVh() {
  // #ifdef H5
  try {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  } catch (e) {
    console.warn('[App] setVh 失败:', e)
  }
  // #endif
}

async function refreshTokenOnStartup() {
  const refreshToken = getRefreshToken()
  console.log('[App] refreshToken:', refreshToken ? '存在' : '不存在')
  if (!refreshToken) {
    return false
  }

  return new Promise((resolve) => {
    uni.request({
      method: 'POST',
      timeout: 10000,
      url: config.baseUrl + '/app-api/member/auth/refresh-token',
      data: { refreshToken },
      header: {
        'Content-Type': 'application/json',
        'tenant-id': '122'
      },
      dataType: 'json',
      success: (response) => {
        const res = response.data
        console.log('[App] 刷新 token 响应:', res)
        if (res.code === 0 && res.data) {
          setAuthInfo(res.data)
          resolve(true)
        } else {
          clearAuthInfo()
          resolve(false)
        }
      },
      fail: (err) => {
        console.log('[App] 刷新 token 失败:', err)
        resolve(false)
      }
    })
  })
}

function restoreUserState() {
  console.log('[App] 恢复用户状态...')
  const userStore = useUserStore()
  userStore.accessToken = getAccessToken()
  userStore.refreshToken = getRefreshToken()
  userStore.expiresTime = getExpiresTime()
  userStore.userId = uni.getStorageSync('auth_user_id') || ''
  userStore.nickname = uni.getStorageSync('auth_nickname') || ''
  userStore.avatar = uni.getStorageSync('auth_avatar') || ''
  userStore.mobile = uni.getStorageSync('auth_mobile') || ''

  console.log('[App] 用户信息:', {
    userId: userStore.userId,
    nickname: userStore.nickname,
    mobile: userStore.mobile
  })

  // #ifdef APP-PLUS
  const userId = userStore.userId
  if (userId) {
    syncPushForUser(userId)
  }
  // #endif
}

async function checkLogin() {
  console.log('[App] checkLogin 开始...')

  const token = getAccessToken()
  const expiresTime = getExpiresTime()

  console.log('[App] 登录信息:', {
    hasToken: !!token,
    expiresTime: expiresTime,
    now: new Date(),
    isValid: expiresTime ? new Date() < expiresTime : false
  })

  if (!token || !expiresTime) {
    console.log('[App] 没有登录信息')
    return false
  }

  const now = new Date()

  if (now >= expiresTime) {
    console.log('[App] Token 已过期，尝试刷新...')
    const refreshSuccess = await refreshTokenOnStartup()
    if (!refreshSuccess) {
      console.log('[App] 刷新失败')
      return false
    }
    console.log('[App] 刷新成功')
  }

  restoreUserState()
  return true
}
</script>

<style lang="scss">
@import '@/static/scss/index.scss';

page {
  min-height: calc(var(--vh, 1vh) * 100);
  background: var(--bg-page);
  transition: background-color 0.3s ease;
}

/* #ifdef H5 */
.theme-transitioning *,
.theme-transitioning *::before,
.theme-transitioning *::after {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease,
              box-shadow 0.3s ease;
}
/* #endif */

/* #ifndef H5 */
view, text, button, image, input, textarea {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease,
              box-shadow 0.3s ease;
}
/* #endif */

body {
  overscroll-behavior: none;
}

::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
