<script setup>
import config from './config'
import { getAccessToken } from '@/utils/token'
import { useConfigStore } from '@/store'
import { useUserStore } from '@/store/modules/user'
import { getCurrentInstance } from "vue"
import { onLaunch, onShow} from '@dcloudio/uni-app'
import { initPushService, syncPushForUser, retryPushSyncIfNeeded } from '@/utils/jpush'
import { shouldShowIosPrivacy, setPrivacyAgreedCallback } from '@/utils/privacy'


const { proxy } = getCurrentInstance()

onLaunch(() => {
  setPrivacyAgreedCallback(continueAppInit)
  initApp()
})

onShow(() => {
  // #ifdef APP-PLUS
  if (shouldShowIosPrivacy()) {
    return
  }
  retryPushSyncIfNeeded()
  // #endif
  checkLogin()
})

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

function checkLogin() {
  const token = getAccessToken()
  const expiresTime = uni.getStorageSync('auth_expires_time')

  if (!token || !expiresTime) {
    setTimeout(() => {
      proxy.$tab.reLaunch('/pages/login/index')
    }, 100)
    return
  }

  const expireDate = new Date(expiresTime)
  if (new Date() >= expireDate) {
    setTimeout(() => {
      proxy.$tab.reLaunch('/pages/login/index')
    }, 100)
    return
  }

  const userStore = useUserStore()
  userStore.accessToken = token
  userStore.refreshToken = uni.getStorageSync('auth_refresh_token') || ''
  userStore.expiresTime = expireDate
  userStore.userId = uni.getStorageSync('auth_user_id') || ''
  userStore.nickname = uni.getStorageSync('auth_nickname') || ''
  userStore.avatar = uni.getStorageSync('auth_avatar') || ''
  userStore.mobile = uni.getStorageSync('auth_mobile') || ''

  // 🔥 静态登录成功后，自动触发极光别名绑定
  // #ifdef APP-PLUS
  const userId = userStore.userId
  if (userId) {
    syncPushForUser(userId)
  }
  // #endif

  // Token 有效时，处理页面跳转逻辑
  // 检查当前页面路由，避免停留在登录页面
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1].route
    // 如果当前在登录页面，跳转到首页
    if (currentPage === 'pages/login/index') {
      setTimeout(() => {
        proxy.$tab.switchTab('/pages/home/index')
      }, 100)
    }
    // 如果在其他页面，保持当前页面状态
  } else {
    // 如果页面路由栈为空（应用被杀掉后台重新打开），跳转到首页
    setTimeout(() => {
      proxy.$tab.switchTab('/pages/home/index')
    }, 100)
  }
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