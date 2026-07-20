<script setup>
import config from './config'
import { getAccessToken, getRefreshToken, getExpiresTime, setAuthInfo, clearAuthInfo } from '@/utils/token'
import { useConfigStore } from '@/store'
import { useUserStore } from '@/store/modules/user'
import { getCurrentInstance } from "vue"
import { onLaunch, onShow} from '@dcloudio/uni-app'
import { initPushService, syncPushForUser, retryPushSyncIfNeeded } from '@/utils/jpush'
import { shouldShowIosPrivacy, setPrivacyAgreedCallback } from '@/utils/privacy'
import { isReviewMode } from '@/utils/review'


const { proxy } = getCurrentInstance()

onLaunch((options) => {
  setPrivacyAgreedCallback(continueAppInit)
  initApp()
  // 处理小程序启动参数（包括Scheme拉起）
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
  // 刷新审核模式开关（不阻塞启动）
  useConfigStore().initReviewMode()
  // 处理小程序显示参数（包括Scheme拉起）
  handleLaunchOptions(options)
})

// 从 URL 中提取参数
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

// 处理启动参数（Scheme拉起）
const handleLaunchOptions = (options) => {
  console.log('[App] 启动参数:', options)
  // #ifdef MP-WEIXIN
  if (!options) return

  // 从启动参数中获取 coachId
  let coachId = null

  // 方式1：从 query 中获取（推荐）
  if (options.query && options.query.coachId) {
    coachId = options.query.coachId
  } else if (options.query && options.query.id) {
    coachId = options.query.id
  }
  // 方式2：从 scene 中解析（场景值，用于扫码等场景）
  else if (options.scene) {
    // 解析 scene 参数（微信小程序 scene 参数需要 decode）
    const scene = decodeURIComponent(options.scene)
    console.log('[App] Scene 参数:', scene)
    // 尝试从 scene 中提取 coachId，格式可能是 coachId=123 或 id=123
    const match = scene.match(/(?:coachId|id)=(\d+)/)
    if (match) {
      coachId = match[1]
    }
  }
  // 方式3：从 path 中解析
  else if (options.path && options.path.includes('coachId=')) {
    coachId = getQueryParam(options.path, 'coachId') || getQueryParam(options.path, 'id')
  }

  // 如果获取到了 coachId，跳转到详情页
  if (coachId) {
    console.log('[App] 检测到 coachId，跳转到详情页:', coachId)
    // 延迟跳转，等待页面初始化完成
    setTimeout(() => {
      // 审核模式下不跳转教练详情
      if (isReviewMode()) {
        console.log('[App] 审核模式开启，跳过教练详情跳转')
        return
      }
      uni.navigateTo({
        url: `/subpkg/coach/detail?id=${coachId}`
      })
    }, 500)
  }
  // #endif
}

// 初始化应用
function initApp() {
  // 本地配置不涉隐私，需尽早初始化，避免登录页渲染时报错
  initConfig()

  // #ifdef APP-PLUS
  setStatusBarHeight()

  // iOS 需先同意隐私协议，弹窗挂载在登录页，此处仅阻断后续初始化
  if (shouldShowIosPrivacy()) {
    return
  }
  // #endif

  continueAppInit()
}


/** 应用核心初始化流程 */
function continueAppInit() {
  // #ifdef APP-PLUS
  initPushService()
  // #endif

  // 拉取审核模式开关（不阻塞主流程）
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

/**
 * 使用 refreshToken 刷新 accessToken
 */
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
          // 刷新成功，更新本地存储
          setAuthInfo(res.data)
          resolve(true)
        } else {
          // 刷新失败，清除登录信息
          clearAuthInfo()
          resolve(false)
        }
      },
      fail: (err) => {
        console.log('[App] 刷新 token 失败:', err)
        // 网络错误等，不清除登录信息，让用户继续使用（后续请求会处理）
        resolve(false)
      }
    })
  })
}

/**
 * 恢复用户状态到 Store
 */
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

  // 🔥 恢复登录后，自动触发极光别名绑定
  // #ifdef APP-PLUS
  const userId = userStore.userId
  if (userId) {
    syncPushForUser(userId)
  }
  // #endif
}

/**
 * 检查登录状态
 */
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

  // 如果没有登录信息，直接返回
  if (!token || !expiresTime) {
    console.log('[App] 没有登录信息')
    return false
  }

  const now = new Date()

  // Token 已过期，尝试刷新
  if (now >= expiresTime) {
    console.log('[App] Token 已过期，尝试刷新...')
    const refreshSuccess = await refreshTokenOnStartup()
    if (!refreshSuccess) {
      console.log('[App] 刷新失败')
      return false
    }
    console.log('[App] 刷新成功')
  }

  // 恢复用户状态
  restoreUserState()

  return true
}
</script>

<style lang="scss">
@import '@/static/scss/index.scss';

/* 全局样式 - 安全区域适配 */
page {
  min-height: 100vh;
  background: #121619;
}

/* 防止下拉出现白色空白 */
body {
  overscroll-behavior: none;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 顶部安全区域适配 */
.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

/* 底部安全区域适配 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>