/**
 * 平台判断工具库
 * 提供统一的平台检测 API
 */

/**
 * 是否为 H5 平台
 */
export function isH5() {
  // #ifdef H5
  return true
  // #endif
  return false
}

/**
 * 是否为小程序平台（任意小程序）
 */
export function isMP() {
  // #ifdef MP
  return true
  // #endif
  return false
}

/**
 * 是否为微信小程序
 */
export function isMPWeixin() {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  return false
}

/**
 * 是否为支付宝小程序
 */
export function isMPAlipay() {
  // #ifdef MP-ALIPAY
  return true
  // #endif
  return false
}

/**
 * 是否为 App 平台
 */
export function isApp() {
  // #ifdef APP-PLUS
  return true
  // #endif
  return false
}

/**
 * 是否为鸿蒙平台
 */
export function isHarmony() {
  // #ifdef HARMONY
  return true
  // #endif
  return false
}

/**
 * 是否为 iOS 平台
 */
export function isIOS() {
  // #ifdef APP-PLUS
  try {
    const systemInfo = uni.getSystemInfoSync()
    return systemInfo.platform === 'ios'
  } catch (e) {
    return false
  }
  // #endif
  return false
}

/**
 * 是否为 Android 平台
 */
export function isAndroid() {
  // #ifdef APP-PLUS
  try {
    const systemInfo = uni.getSystemInfoSync()
    return systemInfo.platform === 'android'
  } catch (e) {
    return false
  }
  // #endif
  return false
}

/**
 * 获取当前平台名称
 */
export function getPlatformName() {
  if (isH5()) return 'H5'
  if (isMPWeixin()) return '微信小程序'
  if (isMPAlipay()) return '支付宝小程序'
  if (isMP()) return '小程序'
  if (isHarmony()) return '鸿蒙'
  if (isIOS()) return 'iOS'
  if (isAndroid()) return 'Android'
  if (isApp()) return 'App'
  return '未知'
}

/**
 * 获取安全区域信息
 */
export function getSafeArea() {
  try {
    const systemInfo = uni.getSystemInfoSync()
    return systemInfo.safeArea || {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  } catch (e) {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  }
}

/**
 * 获取状态栏高度
 */
export function getStatusBarHeight() {
  try {
    const systemInfo = uni.getSystemInfoSync()
    return systemInfo.statusBarHeight || 0
  } catch (e) {
    return 0
  }
}

export default {
  isH5,
  isMP,
  isMPWeixin,
  isMPAlipay,
  isApp,
  isHarmony,
  isIOS,
  isAndroid,
  getPlatformName,
  getSafeArea,
  getStatusBarHeight
}
