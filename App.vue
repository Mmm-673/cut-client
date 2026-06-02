<script setup>
import config from './config'
import { getAccessToken } from '@/utils/token'
import { useConfigStore } from '@/store'
import { useUserStore } from '@/store/modules/user'
import { getCurrentInstance } from "vue"
import { onLaunch, onShow} from '@dcloudio/uni-app'
import { initPushService, syncPushForUser, retryPushSyncIfNeeded } from '@/utils/jpush'


// 1. 【核心修改】放弃 import UTS 组件，改为引入传统原生插件对象
// #ifdef APP-PLUS
// #endif

const { proxy } = getCurrentInstance()

onLaunch(() => {
  initApp()
})

onShow(() => {
  // #ifdef APP-PLUS
  retryPushSyncIfNeeded()
  // #endif
})

// 初始化应用
function initApp() {
  // 初始化应用配置
  initConfig()
  // 设置全局状态栏高度

  // #ifdef APP-PLUS
  setStatusBarHeight()
  // #endif

  // #ifdef APP-PLUS
  initPushService()
  // #endif

  // 检查用户登录状态（全平台）
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

  // Token 有效，跳转到首页
  setTimeout(() => {
    proxy.$tab.reLaunch('/pages/home/index')
  }, 100)
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