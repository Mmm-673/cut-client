<script setup>
import config from './config'
import { isLoggedIn, getAccessToken } from '@/utils/token'
import { useConfigStore } from '@/store'
import { useUserStore } from '@/store/modules/user'
import { getCurrentInstance } from "vue"
import { onLaunch } from '@dcloudio/uni-app'

// 1. 引入极光推送在 uni_modules 中导出的 JS SDK
import JPush from '@/uni_modules/jg-jpush-u/js_sdk/jpush-u.js'

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

  // 2. 注入极光推送初始化（使用条件编译，确保只在手机 App 端运行，不影响跨平台）
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

  // 🔥【新增补丁 A】静态登录成功后，自动触发极光别名绑定
  // #ifdef APP-PLUS
  if (userStore.userId) {
    bindPushAlias(userStore.userId)
  }
  // #endif
}

// 3. 极光推送核心初始化及通知监听函数
function initPushService() {
  console.log('--- 【球了么用户端】极光推送环境检查 ---')

  // 安卓系统下必须显式触发 init
  if (uni.getSystemInfoSync().platform === 'android') {
    JPush.initJPush()
  }

  // 开启极光内部日志，方便在 HBuilderX 底部控制台观察推送下发状态
  JPush.setLoggerEnable(true)

  // 监听：【收到】推送消息（App 处于前台或后台挂起时触发）
  JPush.addNotificationListener((result) => {
    console.log('【极光用户端】系统收到通知，数据流详情:', result)
  })

  // 监听：【点击】通知栏弹窗（用户通过手指点击系统状态栏通知，触发深度拉起或页面跳转）
  JPush.addConnectInterfaceListener((result) => {
    console.log('【极光用户端】用户点击了通知，开始分发路由:', result)

    const extras = result.extras
    if (extras) {
      // 加一个小延时保护，防止 App 被冷启动拉起时，页面栈尚未初始化完毕导致路由跳转失败
      setTimeout(() => {
        // 🛠️ 业务路由场景 A：教练接受了台球陪练预约，点击通知直接跳转到预约详情单
        if (extras.type === 'coach_accept' && extras.bookingId) {
          proxy.$tab.navigateTo(`/pages/booking/info?id=${extras.bookingId}`)
        }

        // 🛠️ 业务路由场景 B：系统向学员发放了台球优惠券，点击跳转到我的优惠券列表
        if (extras.type === 'coupon') {
          proxy.$tab.navigateTo(`/pages/mine/coupon/index`)
        }

        // 🛠️ 业务路由场景 C：收到了来自教练端的即时通讯消息，跳转到具体的聊天房间
        if (extras.type === 'chat' && extras.roomId) {
          proxy.$tab.navigateTo(`/pages/chat/room?id=${extras.roomId}`)
        }
      }, 300)
    }
  })

  // 抓取并上报这台手机在极光云端唯一的“设备身份证”：RegistrationID
  JPush.getRegistrationID((result) => {
    if (result.registerID) {
      console.log('【极光用户端】当前设备 RegID 获取成功:', result.registerID)
      // 稳稳妥妥地存入本地缓存
      uni.setStorageSync('device_reg_id', result.registerID)
    } else {
      console.log('【极光用户端】RegID 还在由极光服务器异步生成中，等待下一次轮询...')
    }
  })
}

// 🔥【新增补丁 B】封装统一的别名绑定函数，建立设备与具体用户ID的映射
function bindPushAlias(userId) {
  // 为用户端定制唯一的别名规则，形如 client_user_10023，方便后端做双端区分推送
  const targetAlias = `1_${userId}`

  JPush.setAlias({
    alias: targetAlias,
    sequence: 1 // 操作序列号
  })
  console.log('【极光用户端】已向云端发起用户别名绑定绑定，目标别名:', targetAlias)
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