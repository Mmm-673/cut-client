import { regeocode } from '@/api/billiard/amap'
import { isLoggedIn } from '@/utils/token'

/**
 * 统一的定位工具模块
 * 封装 uni.getLocation + 逆地址解析 + 权限处理
 */

// 坐标获取中的共享 Promise，避免并发调用互相拒绝
let coordinatesPromise = null
// 定位超时定时器
let locationTimeout = null

/**
 * 显示定位用途说明弹窗（自定义弹窗）
 */
export const showLocationPurposeModal = () => {
  return new Promise((resolve, reject) => {
    // 检查用户是否已经同意过定位权限用途说明
    const hasAgreedLocationPurpose = uni.getStorageSync('hasAgreedLocationPurpose')
    console.log('hasAgreedLocationPurpose:', hasAgreedLocationPurpose)
    if (hasAgreedLocationPurpose) {
      resolve()
      return
    }

    console.log('开始显示定位权限说明弹窗')

    // 使用 setTimeout 确保 DOM 渲染完成后再显示弹窗
    setTimeout(() => {
      uni.showModal({
        title: '定位权限说明',
        content: '为了向您推荐附近的台球教练/球厅，我们需要获取您的位置信息。该信息仅用于定位和推荐，不会用于其他用途。',
        confirmText: '同意',
        cancelText: '取消',
        success: (res) => {
          console.log('showModal 回调:', res)
          if (res.confirm) {
            // 存储用户同意状态
            uni.setStorageSync('hasAgreedLocationPurpose', true)
            resolve()
          } else {
            reject(new Error('user_cancelled'))
          }
        },
        fail: (err) => {
          console.error('showModal 失败:', err)
          reject(err)
        }
      })
    }, 100)
  })
}

const clearLocationTimeout = () => {
  if (locationTimeout) {
    clearTimeout(locationTimeout)
    locationTimeout = null
  }
}

/**
 * 打开应用设置页面（兼容 iOS、Android、鸿蒙）
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
        onSuccess && onSuccess()
      }
    }
  })
  // #endif

  // #ifdef H5
  uni.showToast({ title: '定位失败，请检查浏览器定位权限', icon: 'none' })
  // #endif
}

/**
 * 提前发起定位（导航跳转前调用，与页面内 getLocation 共享同一次坐标请求）
 */
export const prefetchLocation = (options = {}) => {
  return fetchCoordinates(options).catch(() => {})
}

/**
 * 获取经纬度坐标（并发调用共享同一次定位请求）
 */
const fetchCoordinates = ({
                            type = 'gcj02',
                            timeout = 15000
                          } = {}) => {
  if (coordinatesPromise) {
    return coordinatesPromise
  }

  coordinatesPromise = new Promise((resolve, reject) => {
    locationTimeout = setTimeout(() => {
      coordinatesPromise = null
      clearLocationTimeout()
      reject(new Error('定位超时'))
    }, timeout)

    const finish = (location) => {
      clearLocationTimeout()
      coordinatesPromise = null
      resolve(location)
    }

    const fail = (err) => {
      clearLocationTimeout()
      coordinatesPromise = null
      reject(err)
    }

    const doLocate = () => {
      uni.getLocation({
        type,
        altitude: false,
        success: (res) => {
          finish({
            longitude: res.longitude,
            latitude: res.latitude
          })
        },
        fail: (err) => {
          if (err && err.errMsg && (err.errMsg.includes('auth deny') || err.errMsg.includes('authorize') || err.errMsg.includes('denied'))) {
            fail(new Error('permission_denied'))
          } else {
            fail(err)
          }
        }
      })
    }

    // #ifdef APP-PLUS
    try {
      const systemInfo = uni.getSystemInfoSync()
      const platform = systemInfo.platform
      const osName = (systemInfo.osName || systemInfo.systemName || '').toLowerCase()
      const isHarmony = osName.includes('harmony')

      if (platform === 'android' || isHarmony) {
        plus.android.requestPermissions(
            ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION'],
            (result) => {
              const granted = result.granted || []
              if (granted.length > 0 &&
                  (granted.includes('android.permission.ACCESS_FINE_LOCATION') ||
                   granted.includes('android.permission.ACCESS_COARSE_LOCATION'))) {
                doLocate()
              } else {
                fail(new Error('permission_denied'))
              }
            },
            () => {
              fail(new Error('permission_error'))
            }
        )
      } else {
        doLocate()
      }
    } catch (e) {
      fail(e)
    }
    // #endif

    // #ifndef APP-PLUS
    doLocate()
    // #endif
  })

  return coordinatesPromise
}

/**
 * 获取定位 + 逆地址解析
 * @param {Object} options
 * @param {Boolean} options.needRegeocode - 是否需要逆地址解析（默认 true）
 * @param {String} options.type - 定位坐标系类型（默认 gcj02，因为已配置高德）
 * @param {Boolean} options.showPurposeModal - 是否显示用途说明弹窗（默认 true）
 * @returns {Promise}
 */
export const getLocation = async ({
                                    needRegeocode = true,
                                    type = 'gcj02',
                                    timeout = 15000,
                                    showPurposeModal = true
                                  } = {}) => {
  // 显示定位用途说明弹窗（iOS 不显示自定义弹窗，直接使用系统定位权限请求）
  // #ifndef APP-PLUS
  if (showPurposeModal) {
    await showLocationPurposeModal()
  }
  // #endif
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  if (showPurposeModal && systemInfo.platform !== 'ios') {
    await showLocationPurposeModal()
  }
  // #endif

  const location = await fetchCoordinates({ type, timeout })

  if (needRegeocode) {
    try {
      const geoRes = await regeocode(location)
      console.log(geoRes,'======handlePrivacyAgreed')
      return {
        ...location,
        regeocodeData: geoRes.data
      }
    } catch (e) {
      return location
    }
  }

  return location
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
