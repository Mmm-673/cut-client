<script setup>
// ==========================================
// 最顶部：立即初始化主题（避免深色闪烁）
// ==========================================
import { initThemeEarly } from '@/utils/theme'
initThemeEarly()
// ==========================================

import config from './config'
import { getAccessToken, getRefreshToken, getExpiresTime, setAuthInfo, clearAuthInfo } from '@/utils/token'
import { useConfigStore, useThemeStore, useBookingStore } from '@/store'
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
import logger from '@/utils/logger'
import { TIME_ONE_SECOND, DEFAULT_PAGE_SIZE, CODE_SUCCESS } from '@/utils/constants'

/** 重复跳转防抖窗口（毫秒）— 短时间内相同 coachId 不重复跳转 */
const COACH_NAV_DEBOUNCE_MS = 3 * TIME_ONE_SECOND
/** 扫码/分享跳转延迟（毫秒）— 等页面初始化完成后再跳 */
const COACH_NAV_DELAY_MS = 500
/** 启动时刷新 token 请求超时（毫秒） */
const REFRESH_TOKEN_TIMEOUT = 10 * TIME_ONE_SECOND
/** 启动时拉取通知的每页数量 */
const NOTIFICATION_PAGE_SIZE = DEFAULT_PAGE_SIZE
/** 重大通知类型编码 */
const NOTIFICATION_TYPE_IMPORTANT = 1

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
  logger.debug('[App] onLaunch, 当前主题:', themeStore.theme)

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
      logger.warn('[App] onShow 设置背景失败:', e)
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
  logger.debug('[App] 启动参数:', options)
  // #ifdef MP-WEIXIN
  if (!options) return

  let coachId = null

  if (options.query && options.query.coachId) {
    coachId = options.query.coachId
  } else if (options.query && options.query.id) {
    coachId = options.query.id
  } else if (options.query && options.query.scene) {
    logger.debug('[App] query.scene 参数:', options.query.scene)
    coachId = extractCoachId(options.query.scene)
  } else if (options.query && options.query.q) {
    logger.debug('[App] query.q 参数:', options.query.q)
    coachId = extractCoachId(options.query.q)
  } else if (options.path && options.path.includes('coachId=')) {
    coachId = getQueryParam(options.path, 'coachId') || getQueryParam(options.path, 'id')
  }

  if (coachId) {
    logger.debug('[App] 检测到 coachId，跳转到详情页:', coachId)
    setTimeout(() => {
      if (isReviewMode()) {
        logger.debug('[App] 审核模式开启，跳过教练详情跳转')
        return
      }
      const now = Date.now()
      if (lastCoachNavId === String(coachId) && now - lastCoachNavTime < COACH_NAV_DEBOUNCE_MS) {
        logger.debug('[App] 短时间内重复触发，跳过跳转:', coachId)
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
            logger.debug('[App] 当前已在该教练详情页，跳过重复跳转:', coachId)
            return
          }
        }
      } catch (e) {}
      lastCoachNavId = String(coachId)
      lastCoachNavTime = now
      uni.navigateTo({ url: `/subpkg/coach/detail?id=${coachId}` })
    }, COACH_NAV_DELAY_MS)
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
      logger.warn('[App] init 设置背景失败:', e)
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
  logger.debug('[App] refreshToken:', refreshToken ? '存在' : '不存在')
  if (!refreshToken) {
    return false
  }

  return new Promise((resolve) => {
    uni.request({
      method: 'POST',
      timeout: REFRESH_TOKEN_TIMEOUT,
      url: config.baseUrl + '/app-api/member/auth/refresh-token',
      data: { refreshToken },
      header: {
        'Content-Type': 'application/json',
        'tenant-id': '122'
      },
      dataType: 'json',
      success: (response) => {
        const res = response.data
        logger.debug('[App] 刷新 token 响应，code:', res?.code)
        if (res.code === CODE_SUCCESS && res.data) {
          setAuthInfo(res.data)
          resolve(true)
        } else {
          clearAuthInfo()
          resolve(false)
        }
      },
      fail: (err) => {
        logger.debug('[App] 刷新 token 失败:', err)
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
        logger.error('[App] 标记通知已读失败', e)
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
      pageSize: NOTIFICATION_PAGE_SIZE,
      readStatus: 0
    })
    const records = res.data?.records || []
    // 筛选 type=1 重大通知
    const importantList = records.filter(item => item.type === NOTIFICATION_TYPE_IMPORTANT)
    if (importantList.length > 0) {
      notificationQueue = importantList
      showNextNotification()
    }
  } catch (e) {
    logger.error('[App] 获取重大通知失败', e)
  }
}

function restoreUserState() {
  logger.debug('[App] 恢复用户状态...')
  const userStore = useUserStore()
  // 通过 action 恢复状态，保持单向数据流
  userStore.restoreFromStorage()

  // 恢复预约流程数据（Storage 兜底）
  const bookingStore = useBookingStore()
  bookingStore.restoreFromStorage()

  logger.debug('[App] 用户状态已恢复，userId:', userStore.userId)

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
  logger.debug('[App] checkLogin 开始...')

  const token = getAccessToken()
  const expiresTime = getExpiresTime()

  logger.debug('[App] 登录信息:', {
    hasToken: !!token,
    expiresTime: expiresTime,
    now: new Date(),
    isValid: expiresTime ? new Date() < expiresTime : false
  })

  if (!token || !expiresTime) {
    logger.debug('[App] 没有登录信息')
    return false
  }

  const now = new Date()

  if (now >= expiresTime) {
    logger.debug('[App] Token 已过期，尝试刷新...')
    const refreshSuccess = await refreshTokenOnStartup()
    if (!refreshSuccess) {
      logger.debug('[App] 刷新失败')
      return false
    }
    logger.debug('[App] 刷新成功')
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
