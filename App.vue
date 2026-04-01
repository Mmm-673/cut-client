<script setup>
  import config from './config'
  import { isLoggedIn } from '@/utils/token'
  import { useConfigStore } from '@/store'
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
    // 全平台都检查登录状态
    if (!isLoggedIn()) {
      // 避免在页面未加载时跳转
      setTimeout(() => {
        proxy.$tab.reLaunch('/pages/login/index')
      }, 100)
    }
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
