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
    // 兼容鸿蒙系统上的 iOS 检测
    const platform = systemInfo.platform
    const osName = systemInfo.osName || systemInfo.systemName || ''
    return platform === 'ios' || (osName.toLowerCase().includes('ios') && !osName.toLowerCase().includes('harmony'))
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
    // 兼容鸿蒙系统上的 Android 检测（鸿蒙也可能返回 android）
    const platform = systemInfo.platform
    const osName = systemInfo.osName || systemInfo.systemName || ''
    return platform === 'android' || (osName.toLowerCase().includes('android') && !osName.toLowerCase().includes('harmony'))
  } catch (e) {
    return false
  }
  // #endif
  return false
}

/**
 * 是否为鸿蒙 Next 平台（独立鸿蒙系统）
 */
export function isHarmonyNext() {
  // #ifdef APP-PLUS
  try {
    const systemInfo = uni.getSystemInfoSync()
    const platform = systemInfo.platform
    const osName = systemInfo.osName || systemInfo.systemName || ''
    return platform === 'harmony' || osName.toLowerCase().includes('harmony')
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
  if (isHarmony() || isHarmonyNext()) return '鸿蒙'
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

// 兼容旧代码 - 登录页面还在用这些函数
export const openPermissionSettings = () => {
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  const platform = systemInfo.platform
  const osName = systemInfo.osName || systemInfo.systemName || ''

  if (platform === 'ios') {
    plus.runtime.openURL('app-settings:')
  } else if (platform === 'android' || osName.toLowerCase().includes('harmony')) {
    // Android 或鸿蒙系统
    const main = plus.android.runtimeMainActivity()
    const Intent = plus.android.importClass('android.content.Intent')
    const Settings = plus.android.importClass('android.provider.Settings')
    const Uri = plus.android.importClass('android.net.Uri')
    const packageName = main.getPackageName()

    try {
      const intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
      const uri = Uri.fromParts('package', packageName, null)
      intent.setData(uri)
      main.startActivity(intent)
    } catch (e) {
      try {
        const intent = new Intent(Settings.ACTION_SETTINGS)
        main.startActivity(intent)
      } catch (e2) {
        uni.showToast({ title: '打开设置失败', icon: 'none' })
      }
    }
  }
  // #endif
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
  openPermissionSettings,
  isMP,
  isMPWeixin,
  isMPAlipay,
  isApp,
  isHarmony,
  isHarmonyNext,
  isIOS,
  isAndroid,
  getPlatformName,
  getSafeArea,
  getStatusBarHeight
}
