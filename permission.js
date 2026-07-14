import { isLoggedIn } from '@/utils/token'

// 拦截路由跳转
const list = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']
list.forEach(item => {
  uni.addInterceptor(item, {
    invoke(e) {
      const url = e.url.split('?')[0]
      console.log('[Permission] 访问页面:', url, '已登录:', isLoggedIn())

      // 已登录用户访问登录页时跳转到首页
      if (isLoggedIn() && url === '/pages/login/index') {
        uni.switchTab({ url: '/pages/home/index' })
        return false
      }

      // 其他情况都允许访问
      return true
    },
    fail(err) {
      console.log(err)
    }
  })
})