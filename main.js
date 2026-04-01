import { createSSRApp } from 'vue'
import App from './App'
import store from './store'
import { install } from './plugins'
import './permission'
import { useDict } from '@/utils/dict'
import platform from '@/utils/platform'

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.config.globalProperties.useDict = useDict
  app.config.globalProperties.$platform = platform
  install(app)
  return {
    app
  }
}
