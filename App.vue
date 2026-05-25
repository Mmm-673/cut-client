<script setup>
import config from './config'
import { isLoggedIn, getAccessToken } from '@/utils/token'
import { useConfigStore } from '@/store'
import { useUserStore } from '@/store/modules/user'
import { getCurrentInstance } from "vue"
import { onLaunch } from '@dcloudio/uni-app'

// 1. 【核心修改】放弃 import UTS 组件，改为引入传统原生插件对象
// #ifdef APP-PLUS
const jpushModule = uni.requireNativePlugin("JG-JPush");
// #endif

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

  // 2. 注入极光推送初始化（确保只在手机 App 端运行）
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
  userStore.mobile = uni.getStorageSync('auth_mobile') || ''

  // 🔥 静态登录成功后，自动触发极光别名绑定
  // #ifdef APP-PLUS
  if (userStore.userId) {
    bindPushAlias(userStore.userId)
  }
  // #endif
}

// 3. 传统极光原生插件初始化及通知监听
function initPushService() {
  console.log('--- 【球了么用户端】传统极光原生插件环境检查 ---')

  // 开启调试模式，开发阶段方便在 HBuilderX 控制台看原生日志
  jpushModule.setDebugMode(true);

  // 初始化极光服务
  jpushModule.initJPushService();

  // 监听：【收到】推送消息（App 处于前台或后台挂起时触发）
  jpushModule.addNotificationListener((result) => {
    console.log('【极光用户端】系统收到通知，数据流详情:', result)
  })

  // 监听：【点击】通知栏弹窗（用户点击通知，触发深度拉起或页面跳转）
  jpushModule.addCustomMessageListener((result) => {
    console.log('【极光用户端】用户点击了通知，开始分发路由:', result)

    // 传统原生插件的附加字段存放在 result.notificationExtras 中，且通常是 JSON 字符串，需要解析
    if (result && result.notificationExtras) {
      try {
        const extras = JSON.parse(result.notificationExtras)

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
      } catch (e) {
        console.error('【极光用户端】解析附加字段 extras 失败:', e)
      }
    }
  })

  // 抓取并上报这台手机在极光云端唯一的“设备身份证”：RegistrationID
  setTimeout(() => {
    jpushModule.getRegistrationID((result) => {
      // 传统原生插件返回的字段名为 registerID
      if (result && result.registerID) {
        console.log('========================================');
        console.log('【极光用户端】当前设备 RegID 获取成功:', result.registerID)
        console.log('========================================');

        // 稳稳妥妥地存入本地缓存
        uni.setStorageSync('device_reg_id', result.registerID)

        // 测试阶段：弹窗显示 RegID，方便直接复制去极光后台测试
        uni.showModal({
          title: '测试 RegID (长按可复制)',
          content: result.registerID,
          editable: true,
          confirmText: '去复制'
        });
      } else {
        console.log('【极光用户端】暂未获取到 RegID，等待网络重试...')
      }
    })
  }, 3000) // 延时 3 秒获取，最稳妥
}

// 🔥 统一的别名绑定函数（建立设备与具体用户ID的映射）
function bindPushAlias(userId) {
  // 为用户端定制唯一的别名规则，形如 1_10023
  const targetAlias = `1_${userId}`

  // 传统原生插件设置别名的参数格式
  jpushModule.setAlias({
    'alias': targetAlias,
    'sequence': 1
  })
  console.log('【极光用户端】已向云端发起用户别名绑定，目标别名:', targetAlias)
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