import { createSSRApp } from 'vue'
import App from './App'
import store from './store'
import { install } from './plugins'
import './permission'
import { useDict } from '@/utils/dict'
import platform from '@/utils/platform'
import shareMixin from '@/utils/share'

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.config.globalProperties.useDict = useDict
  app.config.globalProperties.$platform = platform
  // 全局混入分享功能
  app.mixin(shareMixin)
  install(app)
  return {
    app
  }
}

