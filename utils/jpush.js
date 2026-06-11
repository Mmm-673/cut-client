/**
 * 极光推送（仅 App 端生效，条件编译剥离其他平台）
 */

import {getAccessToken} from '@/utils/token'
import { openPermissionSettings } from '@/utils/platform'

// #ifdef APP-PLUS
const jpushModule = uni.requireNativePlugin('JG-JPush')
const JPUSH_DEBUG = process.env.NODE_ENV === 'development'
let pendingSyncUserId = null
let initCalled = false
let jpushConnected = false
// #endif

const JPUSH_PACKAGE_NAME = 'com.aksjzt.qiuleme.user'
const JPUSH_APP_KEY = '54ce33979670871f9952e1f5'

const LOG_TAG = '【极光-JPush】'

function jpushLog(level, message, detail) {
  const text = `${LOG_TAG} ${message}`
  if (level === 'error') {
    console.error(text, detail !== undefined ? detail : '')
    return
  }
  if (level === 'warn') {
    console.warn(text, detail !== undefined ? detail : '')
    return
  }
  console.log(text, detail !== undefined ? detail : '')
}

function parseExtras(extras) {
  if (!extras) return {}
  if (typeof extras === 'string') {
    try {
      return JSON.parse(extras)
    } catch (e) {
      jpushLog('error', 'extras JSON 解析失败', { raw: extras, error: e })
      return {}
    }
  }
  return extras
}

function handleNotificationNavigation(extras) {
  const data = parseExtras(extras)
  jpushLog('info', '处理通知点击跳转', data)
  // ====== 核心修复 1：点击通知后，立即清空 App 本地及极光服务器的角标数量 ======
  // #ifdef APP-PLUS
  jpushLog('info', '开始清空应用角标...')
  // 传 0 代表清空角标
  callJPushApi('setBadge', 0)

  // 如果是 Android 且配置了厂商通道，部分手机需要同时调用：
  // callJPushApi('setBadgeNumber', 0)
  // #endif
  setTimeout(() => {
    console.log(data,'==========处理通知点击跳转')
    uni.navigateTo({ url: `/pages/home/index` })
  }, 300)
}

function fetchRegistrationIdOnce() {
  // #ifdef APP-PLUS
  return new Promise((resolve) => {
    if (!jpushModule || typeof jpushModule.getRegistrationID !== 'function') {
      jpushLog('warn', 'getRegistrationID 不可用')
      resolve('')
      return
    }
    try {
      jpushModule.getRegistrationID((result) => {
        if (result?.registerID) {
          resolve(result.registerID)
        } else {
          jpushLog('warn', 'getRegistrationID 回调无 registerID', result)
          resolve('')
        }
      })
    } catch (e) {
      jpushLog('error', 'getRegistrationID 调用异常', e)
      resolve('')
    }
  })
  // #endif
  // #ifndef APP-PLUS
  return Promise.resolve('')
  // #endif
}

async function fetchRegistrationIdWithRetry(maxAttempts = 5, intervalMs = 3000) {
  // #ifdef APP-PLUS
  jpushLog('info', `开始获取 RegID，最多重试 ${maxAttempts} 次`)

  for (let i = 0; i < maxAttempts; i++) {
    const regId = await fetchRegistrationIdOnce()
    if (regId) {
      uni.setStorageSync('device_reg_id', regId)
      jpushLog('success', '获取 RegID 成功', { regId, attempt: i + 1 })
      return regId
    }
    if (i < maxAttempts - 1) {
      jpushLog('warn', `第 ${i + 1} 次未拿到 RegID，${intervalMs}ms 后重试`)
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }

  jpushLog('error', '获取 RegID 失败，已达最大重试次数')
  logRegIdTroubleshootHint()
  // #endif
  return ''
}

function logRegIdTroubleshootHint() {
  jpushLog('error', 'RegID 为空常见原因（请逐项核对）', {
    connected: jpushConnected,
    appKey: JPUSH_APP_KEY,
    packageName: JPUSH_PACKAGE_NAME,
    checklist: [
      '极光控制台该 AppKey 绑定的 Android 包名必须为 com.aksjzt.qiuleme.user',
      'JG-JCore / JG-JPush 的 AppKey 与控制台一致',
      '修改 manifest 后需重新制作自定义基座',
      '自定义基座签名需与极光控制台登记一致（或使用调试证书登记）',
      '手机需能访问极光服务器（网络/代理）',
      '控制台需看到「极光连接成功」后再拿 RegID'
    ]
  })
}

function promptNotificationPermission() {
  uni.showModal({
    title: '开启通知权限',
    content: '开启后可及时接收订单状态',
    confirmText: '去设置',
    cancelText: '暂不',
    success: (res) => {
      if (res.confirm) {
        openPermissionSettings()
      }
    }
  })
}

/** 安全调用原生 API，避免个别方法不存在导致整段初始化失败 */
function callJPushApi(methodName, ...args) {
  // #ifdef APP-PLUS
  if (!jpushModule) return false
  const fn = jpushModule[methodName]
  if (typeof fn !== 'function') {
    jpushLog('warn', `当前插件版本无 API「${methodName}」，已跳过`)
    return false
  }
  try {
    fn.apply(jpushModule, args)
    return true
  } catch (e) {
    jpushLog('error', `调用 ${methodName} 异常`, e)
    return false
  }
  // #endif
  return false
}

function enableJPushDebugLog() {
  if (callJPushApi('setLoggerEnable', !!JPUSH_DEBUG)) return
  callJPushApi('setDebugMode', !!JPUSH_DEBUG)
}

function requestNotificationPermission() {
  const handled = callJPushApi('requestNotificationAuthorization', (result) => {
    if (result?.status >= 2) {
      jpushLog('success', '通知权限已授权', result)
    } else {
      jpushLog('warn', '通知权限未完全开启', result)
      if (getAccessToken()) {
        promptNotificationPermission()
      }
    }
  })
  if (!handled) {
    jpushLog('info', '跳过 requestNotificationAuthorization（低版本插件无此方法，不影响推送初始化）')
  }
}

function registerJPushListeners() {
  callJPushApi('addConnectEventListener', (result) => {
    if (result?.connectEnable) {
      jpushConnected = true
      jpushLog('success', '极光连接成功', result)
      fetchRegistrationIdWithRetry(5, 2000)
      if (pendingSyncUserId) {
        jpushLog('info', '连接成功，补绑别名', { userId: pendingSyncUserId })
        bindPushAlias(pendingSyncUserId)
      }
    } else {
      jpushConnected = false
      jpushLog('warn', '极光连接断开或未连接', result)
    }
  })

  callJPushApi('addTagAliasListener', (result) => {
    const { code, alias, sequence, tag } = result || {}
    if (code === 0) {
      jpushLog('success', '别名/标签设置成功', { alias, tag, sequence })
    } else {
      jpushLog('error', '别名/标签设置失败', result)
    }
  })

  callJPushApi('addNotificationListener', (result) => {
    try {
      const { notificationEventType, title, content, extras, messageID } = result || {}

      if (notificationEventType === 'notificationArrived') {
        jpushLog('success', '收到通知栏消息', { messageID, title, content, extras })
        uni.$emit('jpush:notificationArrived', parseExtras(extras))
        return
      }

      if (notificationEventType === 'notificationOpened') {
        jpushLog('success', '用户点击了通知', { messageID, title, content, extras })
        handleNotificationNavigation(extras)
        return
      }

      jpushLog('info', '其他通知事件', result)
    } catch (e) {
      jpushLog('error', '处理通知回调异常', e)
    }
  })

  callJPushApi('addCustomMessageListener', (result) => {
    try {
      jpushLog('success', '收到自定义透传消息', result)
      const extras = parseExtras(result?.extras || result?.content)
      if (extras.type) {
        uni.$emit('jpush:customMessage', extras)
      }
    } catch (e) {
      jpushLog('error', '处理透传消息异常', e)
    }
  })
}

export function initPushService() {
  // #ifdef APP-PLUS
  if (initCalled) {
    jpushLog('warn', 'initPushService 已调用过，跳过重复初始化')
    return
  }
  initCalled = true

  jpushLog('info', '======== 极光推送开始初始化 ========')

  if (!jpushModule) {
    jpushLog('error', '原生插件 JG-JPush 未加载，请确认 manifest 已配置并重新制作自定义基座')
    return
  }

  enableJPushDebugLog()
  jpushLog('info', '原生 SDK 调试日志', { enabled: JPUSH_DEBUG })

  if (!callJPushApi('initJPushService')) {
    jpushLog('error', 'initJPushService 不可用，请确认自定义基座已包含 JG-JPush')
    return
  }
  jpushLog('success', 'initJPushService 调用成功，等待连接事件确认')

  requestNotificationPermission()
  registerJPushListeners()

  // 未触发连接回调时，延迟兜底拉 RegID
  setTimeout(() => {
    if (getDeviceRegId()) return
    if (!jpushConnected) {
      jpushLog('warn', '尚未收到「极光连接成功」，可能 AppKey/包名/网络有问题，仍尝试拉 RegID')
    }
    fetchRegistrationIdWithRetry().catch((e) => {
      jpushLog('error', '拉取 RegID 流程异常', e)
    })
  }, 5000)

  jpushLog('info', '监听器注册流程结束', { appKey: JPUSH_APP_KEY, packageName: JPUSH_PACKAGE_NAME })
  // #endif
}

export function bindPushAlias(userId) {
  // #ifdef APP-PLUS
  if (!userId) {
    jpushLog('warn', 'bindPushAlias 跳过：userId 为空')
    return
  }

  if (!jpushModule) {
    jpushLog('error', 'bindPushAlias 失败：JG-JPush 插件未加载')
    return
  }

  const targetAlias = `1_${userId}`
  if (callJPushApi('setAlias', { alias: targetAlias, sequence: 1 })) {
    jpushLog('info', '已发起别名绑定请求', { alias: targetAlias })
  }
  // #endif
}

/** 登录后同步：绑定别名 + 拉取 RegID（连接成功后会自动重试） */
export function syncPushForUser(userId) {
  // #ifdef APP-PLUS
  if (!userId) {
    jpushLog('warn', 'syncPushForUser 跳过：userId 为空')
    return
  }
  pendingSyncUserId = String(userId)
  jpushLog('info', '同步推送注册信息', { userId: pendingSyncUserId })
  bindPushAlias(pendingSyncUserId)
  fetchRegistrationIdWithRetry().catch((e) => {
    jpushLog('error', 'syncPushForUser 拉取 RegID 异常', e)
  })
  // #endif
}

export function clearPushAlias() {
  // #ifdef APP-PLUS
  pendingSyncUserId = null
  if (callJPushApi('deleteAlias', { sequence: 2 })) {
    jpushLog('success', '已请求清除推送别名')
  }
  uni.removeStorageSync('device_reg_id')
  // #endif
}

export function getDeviceRegId() {
  return uni.getStorageSync('device_reg_id') || ''
}

/** App 回到前台时，若已登录但尚无 RegID 则补同步 */
export function retryPushSyncIfNeeded() {
  // #ifdef APP-PLUS
  // ====== 兜底：只要回到前台，就重置一次角标 ======
  callJPushApi('setBadge', 0)
  // ============================================
  if (!getAccessToken()) return
  const userId = uni.getStorageSync('auth_user_id') || ''
  if (!userId) return

  const regId = getDeviceRegId()
  if (regId) {
    jpushLog('info', '回前台补绑别名', { userId, regId })
    bindPushAlias(userId)
    return
  }

  jpushLog('warn', '回前台发现无 RegID，重新同步', { userId })
  syncPushForUser(userId)
  // #endif
}
