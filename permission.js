import { useUserStore } from '@/store/modules/user'
import { isLoggedIn } from '@/utils/token'

const whiteList = [
  '/pages/login/index',
  '/pages/common/webview/index',
  '/pages/common/textview/index'
]

// 拦截路由跳转
const list = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']
list.forEach(item => {
  uni.addInterceptor(item, {
    invoke(e) {
      const userStore = useUserStore()
      const url = e.url.split('?')[0]

      if (isLoggedIn()) {
        if (url === '/pages/login/index') {
          uni.switchTab({ url: '/pages/index/index' })
          return false
        }
        return true
      } else {
        if (whiteList.includes(url)) {
          return true
        }
        uni.redirectTo({ url: '/pages/login/index' })
        return false
      }
    },
    fail(err) {
      console.log(err)
    }
  })
})
