<script setup>
  import config from './config'
  import { isLoggedIn, getAccessToken } from '@/utils/token'
  import { useConfigStore } from '@/store'
  import { useUserStore } from '@/store/modules/user'
  import { getCurrentInstance } from "vue"
  import { onLaunch } from '@dcloudio/uni-app'

  const { proxy } = getCurrentInstance()

  onLaunch(() => {
    initApp()
  })

  // 初始化应用
  function initApp() {
    // 初始化应用配置
    initConfig()
    // 设置全局状态栏高度
    setStatusBarHeight()
    // 检查用户登录状态（全平台）
    checkLogin()
  }

  function initConfig() {
    useConfigStore().setConfig(config)
  }

  function setStatusBarHeight() {
    const systemInfo = uni.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 0
    // 设置CSS变量，供全局使用
    uni.$statusBarHeight = statusBarHeight
    // 也可以通过样式变量设置
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const page = pages[pages.length - 1]
      page.$vm && (page.$vm.statusBarHeight = statusBarHeight)
    }
  }

  function checkLogin() {
    // 直接读取 storage 中的 token，确保是最新的状态
    const token = getAccessToken()
    const expiresTime = uni.getStorageSync('auth_expires_time')

    // 没有 token 或者 token 已过期，跳转登录
    if (!token || !expiresTime) {
      setTimeout(() => {
        proxy.$tab.reLaunch('/pages/login/index')
      }, 100)
      return
    }

    // 检查 token 是否过期
    const expireDate = new Date(expiresTime)
    if (new Date() >= expireDate) {
      // token 已过期，跳转登录
      setTimeout(() => {
        proxy.$tab.reLaunch('/pages/login/index')
      }, 100)
      return
    }

    // 有有效的 token，同步 Pinia store 的状态
    const userStore = useUserStore()
    userStore.accessToken = token
    userStore.refreshToken = uni.getStorageSync('auth_refresh_token') || ''
    userStore.expiresTime = expireDate
    userStore.userId = uni.getStorageSync('auth_user_id') || ''
    userStore.nickname = uni.getStorageSync('auth_nickname') || ''
    userStore.mobile = uni.getStorageSync('auth_mobile') || ''
  }
</script>

<style lang="scss">
  @import '@/static/scss/index.scss';

  /* 全局样式 - 安全区域适配 */
  page {
    ///* 适配底部安全区域 */
    //padding-bottom: constant(safe-area-inset-bottom);
    //padding-bottom: env(safe-area-inset-bottom);
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
