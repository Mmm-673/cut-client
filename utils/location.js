import { regeocode } from '@/api/billiard/amap'

/**
 * 统一的定位工具模块
 * 封装 uni.getLocation + 逆地址解析 + 权限处理
 */

// 定位状态
let isLocating = false

/**
 * 打开应用设置页面（兼容 iOS、Android、鸿蒙）
 */
export const openAppSetting = () => {
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  const platform = systemInfo.platform

  if (platform === 'ios') {
    plus.runtime.openURL(plus.runtime.appid ? 'app-settings:' : 'prefs:root=LOCATION_SERVICES')
  } else if (platform === 'android') {
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
    try {
      const osName = systemInfo.osName || ''
      if (osName.toLowerCase().includes('harmony') || systemInfo.systemName?.toLowerCase().includes('harmony')) {
        const main = plus.android.runtimeMainActivity()
        const Intent = plus.android.importClass('android.content.Intent')
        const Settings = plus.android.importClass('android.provider.Settings')
        try {
          const intent = new Intent(Settings.ACTION_APPLICATION_SETTINGS)
          main.startActivity(intent)
        } catch (he) {
          const intent = new Intent(Settings.ACTION_SETTINGS)
          main.startActivity(intent)
        }
      } else {
        uni.openSetting({ fail: () => uni.showToast({ title: '打开设置失败', icon: 'none' }) })
      }
    } catch (e) {
      uni.openSetting({ fail: () => uni.showToast({ title: '打开设置失败', icon: 'none' }) })
    }
  }
  // #endif
}

/**
 * 显示定位权限引导弹窗
 */
export const showPermissionModal = ({
                                      title = '定位权限未开启',
                                      content = '您未开启定位权限，将无法获取位置信息。是否前往开启？',
                                      onSuccess
                                    } = {}) => {
  // #ifdef MP-WEIXIN
  uni.showModal({
    title,
    content,
    confirmText: '去开启',
    success: (res) => {
      if (res.confirm) {
        uni.openSetting({
          success: (settingRes) => {
            if (settingRes.authSetting['scope.userLocation']) {
              onSuccess && onSuccess()
            }
          },
          fail: () => uni.showToast({ title: '打开设置失败', icon: 'none' })
        })
      }
    }
  })
  // #endif

  // #ifdef APP-PLUS
  uni.showModal({
    title,
    content,
    confirmText: '去开启',
    success: (res) => {
      if (res.confirm) {
        openAppSetting()
      }
    }
  })
  // #endif

  // #ifdef H5
  uni.showToast({ title: '定位失败，请检查浏览器定位权限', icon: 'none' })
  // #endif
}

/**
 * 获取定位 + 逆地址解析
 * @param {Object} options
 * @param {Boolean} options.needRegeocode - 是否需要逆地址解析（默认 true）
 * @param {String} options.type - 定位坐标系类型（默认 gcj02，因为已配置高德）
 * @returns {Promise}
 */
export const getLocation = ({
                              needRegeocode = true,
                              type = 'gcj02'
                            } = {}) => {
  return new Promise((resolve, reject) => {
    if (isLocating) {
      reject(new Error('正在定位中，请稍候'))
      return
    }

    isLocating = true

    const doLocate = () => {
      uni.getLocation({
        type,
        altitude: true,
        success: async (res) => {
          console.log('定位成功:', res)
          const location = {
            longitude: res.longitude,
            latitude: res.latitude
          }

          try {
            if (needRegeocode) {
              const geoRes = await regeocode(location)
              console.log('逆地址解析结果:', geoRes)
              resolve({
                ...location,
                regeocodeData: geoRes.data
              })
            } else {
              resolve(location)
            }
          } catch (e) {
            console.error('逆地址解析失败:', e)
            resolve(location)
          } finally {
            isLocating = false
          }
        },
        fail: (err) => {
          console.error('定位失败:', err)
          isLocating = false
          if (err && err.errMsg && (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize') || err.errMsg.includes('denied'))) {
            reject(new Error('permission_denied'))
          } else {
            reject(err)
          }
        }
      })
    }

    // #ifdef APP-PLUS
    try {
      const systemInfo = uni.getSystemInfoSync()
      // Android 权限申请
      if (systemInfo.platform === 'android') {
        plus.android.requestPermissions(
            ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION'],
            (result) => {
              // 检查授权结果 - 使用标准方式检查
              const granted = result.granted || []
              if (granted.length > 0 &&
                  (granted.includes('android.permission.ACCESS_FINE_LOCATION') ||
                   granted.includes('android.permission.ACCESS_COARSE_LOCATION'))) {
                // 授权成功
                doLocate()
              } else {
                // 权限被拒绝
                isLocating = false
                reject(new Error('permission_denied'))
              }
            },
            (error) => {
              console.error('权限申请失败：', error)
              isLocating = false
              reject(new Error('permission_error'))
            }
        )
      } else {
        // iOS 直接执行定位，系统会自动弹授权
        doLocate()
      }
    } catch (e) {
      isLocating = false
      reject(e)
    }
    // #endif

    // #ifndef APP-PLUS
    doLocate()
    // #endif
  })
}

/**
 * 从逆地址解析数据中提取城市
 */
export const extractCity = (regeocodeData) => {
  if (!regeocodeData) return ''
  let city = regeocodeData.city
  if (city === '[]') city = null
  if (Array.isArray(city)) city = city.length > 0 ? city[0] : null
  return city || regeocodeData.province || ''
}

/**
 * 从逆地址解析数据中提取街道地址
 */
export const extractStreet = (regeocodeData) => {
  if (!regeocodeData) return ''
  return regeocodeData.street || regeocodeData.township || regeocodeData.district || ''
}

/**
 * 格式化距离显示
 */
export const formatDistance = (distance) => {
  if (distance === null || distance === undefined || distance === '') return ''
  if (typeof distance === 'number') {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
  }
  return distance
}