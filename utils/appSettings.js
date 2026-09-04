/**
 * 应用系统设置工具
 * 统一打开应用设置页面的逻辑，兼容 iOS、Android、鸿蒙
 */

/**
 * 打开应用设置页面（兼容 iOS、Android、鸿蒙）
 *
 * 说明：iOS 端优先使用 `app-settings:` 深链接跳转到 App 隐私设置
 * 兜底的 `prefs:root=` 在 iOS 10+ 已被 Apple 禁止，仅作为兼容保留。
 */
export const openAppSetting = () => {
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  const platform = systemInfo.platform
  const osName = (systemInfo.osName || systemInfo.systemName || '').toLowerCase()
  const isHarmony = osName.includes('harmony')

  if (platform === 'ios') {
    plus.runtime.openURL(plus.runtime.appid ? 'app-settings:' : 'prefs:root=LOCATION_SERVICES')
  } else if (platform === 'android' || isHarmony) {
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
  } else {
    uni.openSetting({ fail: () => uni.showToast({ title: '打开设置失败', icon: 'none' }) })
  }
  // #endif
}

export default {
  openAppSetting,
}
