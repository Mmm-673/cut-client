/**
 * iOS 隐私协议配置与工具
 * 内容与 androidPrivacy.json 保持一致
 */
import androidPrivacy from '../androidPrivacy.json'
import { isIOS } from '@/utils/platform'
import { initPushService } from '@/utils/jpush'

/** 用户是否已在本次会话中明确拒绝隐私协议 */
let privacyRefused = false

/** 用户同意隐私协议后的回调（由 App.vue 注册） */
let onPrivacyAgreedCallback = null

/** 协议链接 */
export const PRIVACY_LINKS = {
  userAgreement: 'https://qiulem.com/agreement/userAgreement.html',
  userPrivacy: 'https://qiulem.com/agreement/userPrivacy.html'
}

/** 首次弹窗配置 */
export const PRIVACY_FIRST = {
  title: androidPrivacy.title,
  paragraphs: [
    '请你务必审慎阅读、充分理解"服务协议"和"隐私政策"各条款，包括但不限于：为了更好的向你提供服务，我们需要收集你的设备标识、操作日志等信息用于分析、优化应用性能。',
    '你可阅读以下协议了解详细信息。如果你同意，请点击下面按钮开始接受我们的服务。'
  ],
  buttonAccept: androidPrivacy.buttonAccept,
  buttonRefuse: androidPrivacy.buttonRefuse
}

/** 二次确认弹窗配置 */
export const PRIVACY_SECOND = {
  title: androidPrivacy.second.title,
  message: '进入应用前，你需先同意《服务协议》和《隐私政策》，否则将退出应用。',
  buttonAccept: androidPrivacy.second.buttonAccept,
  buttonRefuse: androidPrivacy.second.buttonRefuse
}

/**
 * 是否需要在 iOS 端展示隐私协议弹窗
 */
export function shouldShowIosPrivacy() {
  // #ifdef APP-PLUS
  if (!isIOS()) {
    return false
  }
  try {
    return !plus.runtime.isAgreePrivacy()
  } catch (e) {
    return false
  }
  // #endif
  return false
}

/**
 * 用户是否已拒绝隐私协议（本次会话）
 */
export function hasPrivacyRefused() {
  return privacyRefused
}

/**
 * 标记用户已拒绝隐私协议
 */
export function markPrivacyRefused() {
  privacyRefused = true
}

/**
 * 重置拒绝状态（重新查看协议时）
 */
export function resetPrivacyRefused() {
  privacyRefused = false
}

/**
 * 注册隐私协议同意后的回调
 */
export function setPrivacyAgreedCallback(callback) {
  onPrivacyAgreedCallback = callback
}

/**
 * 用户同意隐私协议后的完整处理
 * iOS 需在 agreePrivacy 之后手动初始化推送（pushRegisterMode: manual）
 */
export function completePrivacyAgree() {
  agreePrivacy()
  resetPrivacyRefused()

  // #ifdef APP-PLUS
  if (isIOS()) {
    initPushService()
  }
  // #endif

  onPrivacyAgreedCallback?.()
}

/**
 * 用户同意隐私协议
 */
export function agreePrivacy() {
  // #ifdef APP-PLUS
  plus.runtime.agreePrivacy()
  // #endif
}

/**
 * 用户拒绝隐私协议
 */
export function disagreePrivacy() {
  // #ifdef APP-PLUS
  plus.runtime.disagreePrivacy()
  // #endif
}

/**
 * 使用系统浏览器打开协议链接
 */
export function openPrivacyLink(url) {
  if (!url) {
    return
  }
  // #ifdef APP-PLUS
  plus.runtime.openURL(url)
  // #endif
  // #ifndef APP-PLUS
  uni.navigateTo({
    url: `/subpkg/common/webview?url=${encodeURIComponent(url)}`
  })
  // #endif
}

/**
 * 退出应用
 * Android: 直接退出
 * iOS: 系统不允许程序自杀，退到后台并依赖阻断页阻止继续使用
 */
export function quitApp() {
  // #ifdef APP-PLUS
  if (isIOS()) {
    moveIosAppToBackground()
    return
  }
  plus.runtime.quit()
  // #endif
}

/**
 * iOS 将应用退到后台（plus.runtime.quit 在 iOS 无效）
 */
function moveIosAppToBackground() {
  // #ifdef APP-PLUS
  try {
    const UIApplication = plus.ios.import('UIApplication')
    const sharedApplication = UIApplication.sharedApplication()
    sharedApplication.performSelector('suspend')
    plus.ios.deleteObject(sharedApplication)
    plus.ios.deleteObject(UIApplication)
  } catch (e) {
    console.warn('iOS 退到后台失败', e)
  }
  // #endif
}
