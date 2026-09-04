import { createPurposeModal } from '@/utils/permissionModal'

/**
 * 拨打电话相关工具函数
 */

/**
 * 显示电话权限用途说明弹窗
 * @param {string} content 弹窗内容，可选，有默认值
 * @returns {Promise<void>}
 */
export const showCallPermissionModal = createPurposeModal({
  storageKey: 'hasAgreedCallPermission',
  title: '电话权限说明',
  content: '为了向您提供电话服务，我们需要获取您的拨打电话权限。该权限仅用于拨打电话，不会用于其他用途。',
  skipOnIos: true,
})

/**
 * 请求系统拨号权限
 * @returns {Promise<void>}
 */
export function requestCallPermission() {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    // Android/iOS 平台请求系统权限
    if (plus.os.name === 'Android') {
      // Android 平台
      plus.android.requestPermissions(
        ['android.permission.CALL_PHONE'],
        (e) => {
          if (e.granted.length > 0) {
            // 有权限被授予
            resolve()
          } else {
            // 用户拒绝权限
            reject(new Error('permission_denied'))
          }
        },
        (e) => {
          console.error('Android 权限请求失败:', e)
          reject(e)
        }
      )
    } else if (plus.os.name === 'iOS') {
      // iOS 平台 - iOS 通常不需要显式请求拨打电话权限
      // 直接 resolve，因为调用 tel: scheme 会由系统处理
      resolve()
    } else {
      // 其他平台
      resolve()
    }
    // #endif

    // #ifndef APP-PLUS
    // 非 App 平台不需要额外请求权限
    resolve()
    // #endif
  })
}

/**
 * 实际拨打电话
 * @param {string} phone 电话号码
 */
export function doCallPhone(phone) {
  // #ifdef APP-PLUS
  // 只有【打包成 Android / iOS App】时，才会执行这里
  plus.runtime.openURL(`tel:${phone}`)
  // #endif

  // #ifndef APP-PLUS
  // 只有【不是 App】时（微信小程序、H5、快应用）才执行这里
  uni.makePhoneCall({ phoneNumber: phone })
  // #endif
}

/**
 * 完整的拨打电话流程（权限说明 + 请求权限 + 拨打电话）
 * @param {string} phone 电话号码
 * @param {string} content 权限说明弹窗内容，可选
 */
export async function makeCall(phone, content) {
  // 显示电话权限用途说明弹窗（factory 内置 skipOnIos 逻辑）
  await showCallPermissionModal(content)
  // 请求系统拨号权限
  await requestCallPermission()
  // 执行拨打电话
  doCallPhone(phone)
}
