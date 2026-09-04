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
import { getNotificationPage, markAsRead } from '@/api/billiard/notification'
import wsManager from '@/utils/websocket'

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

  // 监听 token 刷新，刷新后 WebSocket 用新 token 重连
  uni.$on('token-refreshed', (newToken) => {
    if (newToken) {
      wsManager.reconnect(newToken)
    }
  })

  setPrivacyAgreedCallback(continueAppInit)
  initApp()
  handleLaunchOptions(options)
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
  setWebviewBackground(themeStore.theme)
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
  // #ifdef MP-WEIXIN
  if (!options) return

  let coachId = null

  if (options.query && options.query.coachId) {
    coachId = options.query.coachId
  } else if (options.query && options.query.id) {
    coachId = options.query.id
  } else if (options.query && options.query.scene) {
    coachId = extractCoachId(options.query.scene)
  } else if (options.query && options.query.q) {
    coachId = extractCoachId(options.query.q)
  } else if (options.path && options.path.includes('coachId=')) {
    coachId = getQueryParam(options.path, 'coachId') || getQueryParam(options.path, 'id')
  }

  if (coachId) {
    setTimeout(() => {
      if (isReviewMode()) {
        return
      }
      const now = Date.now()
      if (lastCoachNavId === String(coachId) && now - lastCoachNavTime < 3000) {
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
            return
          }
        }
      } catch (e) {
        console.warn('[App] 获取当前页面失败:', e)
      }
      lastCoachNavId = String(coachId)
      lastCoachNavTime = now
      uni.navigateTo({ url: `/subpkg/coach/detail?id=${coachId}` })
    }, 500)
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

async function refreshTokenOnStartup() {
  const refreshToken = getRefreshToken()
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
        if (res.code === 0 && res.data) {
          setAuthInfo(res.data)
          resolve(true)
        } else {
          clearAuthInfo()
          resolve(false)
        }
      },
      fail: (err) => {
        resolve(false)
      }
    })
  })
}

// 重大通知弹窗队列（仅启动时弹一次）
let notificationQueue = []
let isShowingNotification = false
let hasCheckedImportantNotifications = false

const showNotificationModal = (item) => {
  isShowingNotification = true
  uni.showModal({
    title: item.title,
    content: item.content || item.summary || '',
    showCancel: false,
    confirmText: '我知道了',
    confirmColor: '#00BB88',
    success: async () => {
      // 标记已读
      try {
        await markAsRead(item.id)
      } catch (e) {
        console.error('[App] 标记通知已读失败', e)
      }
      isShowingNotification = false
      // 弹下一条
      showNextNotification()
    }
  })
}

const showNextNotification = () => {
  if (notificationQueue.length === 0) return
  const next = notificationQueue.shift()
  showNotificationModal(next)
}

const checkImportantNotifications = async () => {
  if (hasCheckedImportantNotifications) return
  hasCheckedImportantNotifications = true
  try {
    const res = await getNotificationPage({
      pageNo: 1,
      pageSize: 20,  /* PAGINATION.DEFAULT_PAGE_SIZE */
      readStatus: 0
    })
    const records = res.data?.records || []
    // 筛选 type=1 重大通知
    const importantList = records.filter(item => item.type === 1)
    if (importantList.length > 0) {
      notificationQueue = importantList
      showNextNotification()
    }
  } catch (e) {
    console.error('[App] 获取重大通知失败', e)
  }
}

function restoreUserState() {
  const userStore = useUserStore()
  userStore.accessToken = getAccessToken()
  userStore.refreshToken = getRefreshToken()
  userStore.expiresTime = getExpiresTime()
  userStore.userId = uni.getStorageSync('auth_user_id') || ''
  userStore.nickname = uni.getStorageSync('auth_nickname') || ''
  userStore.avatar = uni.getStorageSync('auth_avatar') || ''
  userStore.mobile = uni.getStorageSync('auth_mobile') || ''

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

  // 检查重大通知（仅首次登录恢复后触发）
  checkImportantNotifications()

  // 建立 WebSocket 连接
  const token = getAccessToken()
  if (token) {
    wsManager.connect(token)
  }
}

async function checkLogin() {

  const token = getAccessToken()
  const expiresTime = getExpiresTime()

    hasToken: !!token,
    expiresTime: expiresTime,
    now: new Date(),
    isValid: expiresTime ? new Date() < expiresTime : false
  })

  if (!token || !expiresTime) {
    return false
  }

  const now = new Date()

  if (now >= expiresTime) {
    const refreshSuccess = await refreshTokenOnStartup()
    if (!refreshSuccess) {
      return false
    }
  }

  restoreUserState()
  return true
}
</script>

<style lang="scss">
@import '@/static/scss/index.scss';

page {
  min-height: 100vh;
  background: var(--bg-page);
  transition: background-color 0.3s ease;
}

/* #ifdef H5 */
* {
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
