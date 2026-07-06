/**
 * 相机和相册相关工具函数
 * 相机和相册权限分开处理
 */

/**
 * 显示相机权限用途说明弹窗
 */
export const showCameraPurposeModal = () => {
  return new Promise((resolve, reject) => {

   // iOS 环境下不显示自定义弹窗，直接使用系统 info.plist 弹窗
    // #ifdef APP-PLUS
    const systemInfo = uni.getSystemInfoSync()
    if (systemInfo.platform === 'ios') {
      resolve()
      return
    }
    // #endif

    const hasAgreedCameraPurpose = uni.getStorageSync('hasAgreedCameraPurpose')
    console.log('hasAgreedCameraPurpose:', hasAgreedCameraPurpose)
    if (hasAgreedCameraPurpose) {
      resolve()
      return
    }

    console.log('开始显示相机权限说明弹窗')

    setTimeout(() => {
      uni.showModal({
        title: '相机权限说明',
        content: '为了能够使用相机功能（拍摄照片、扫描二维码），我们需要获取您的相机访问权限。该权限仅用于拍摄和扫描功能，不会用于其他用途。',
        confirmText: '同意',
        cancelText: '取消',
        success: (res) => {
          console.log('showModal 回调:', res)
          if (res.confirm) {
            uni.setStorageSync('hasAgreedCameraPurpose', true)
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

/**
 * 显示相册权限用途说明弹窗
 */
export const showAlbumPurposeModal = () => {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    // iOS 环境下不显示自定义弹窗，直接使用系统 info.plist 弹窗
    const systemInfo = uni.getSystemInfoSync()
    if (systemInfo.platform === 'ios') {
      resolve()
      return
    }
    // #endif

    const hasAgreedAlbumPurpose = uni.getStorageSync('hasAgreedAlbumPurpose')
    console.log('hasAgreedAlbumPurpose:', hasAgreedAlbumPurpose)
    if (hasAgreedAlbumPurpose) {
      resolve()
      return
    }

    console.log('开始显示相册权限说明弹窗')

    setTimeout(() => {
      uni.showModal({
        title: '相册权限说明',
        content: '为了能够从相册选择图片（选择头像、选择二维码），我们需要获取您的相册访问权限。该权限仅用于选择图片功能，不会用于其他用途。',
        confirmText: '同意',
        cancelText: '取消',
        success: (res) => {
          console.log('showModal 回调:', res)
          if (res.confirm) {
            uni.setStorageSync('hasAgreedAlbumPurpose', true)
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

/**
 * 请求系统相机权限（仅APP端）
 */
export const requestCameraPermission = () => {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    if (plus.os.name === 'Android') {
      plus.android.requestPermissions(
        ['android.permission.CAMERA'],
        (result) => {
          console.log('Android 相机权限请求结果:', result)
          const granted = result.granted || []
          if (granted.length > 0 && granted.includes('android.permission.CAMERA')) {
            resolve()
          } else {
            reject(new Error('permission_denied'))
          }
        },
        () => {
          reject(new Error('permission_error'))
        }
      )
    } else {
      resolve()
    }
    // #endif

    // #ifndef APP-PLUS
    resolve()
    // #endif
  })
}

/**
 * 请求系统相册权限（仅APP端）
 */
export const requestAlbumPermission = () => {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    if (plus.os.name === 'Android') {
      plus.android.requestPermissions(
        ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'],
        (result) => {
          console.log('Android 存储权限请求结果:', result)
          const granted = result.granted || []
          if (granted.length > 0 && (granted.includes('android.permission.READ_EXTERNAL_STORAGE') || granted.includes('android.permission.WRITE_EXTERNAL_STORAGE'))) {
            resolve()
          } else {
            reject(new Error('permission_denied'))
          }
        },
        () => {
          reject(new Error('permission_error'))
        }
      )
    } else {
      resolve()
    }
    // #endif

    // #ifndef APP-PLUS
    resolve()
    // #endif
  })
}

/**
 * 显示相机权限引导弹窗
 */
export const showCameraPermissionModal = (options = {}) => {
  const { title = '相机权限未开启', content = '您未开启相机权限，将无法拍摄照片。是否前往开启？', onSuccess } = options
  // #ifdef MP-WEIXIN
  uni.showModal({
    title,
    content,
    confirmText: '去开启',
    success: (res) => {
      if (res.confirm) {
        uni.openSetting({
          success: (settingRes) => {
            if (settingRes.authSetting['scope.camera']) {
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
    confirmText: '前往系统设置',
    success: (res) => {
      if (res.confirm) {
        openAppSetting()
        onSuccess && onSuccess()
      }
    }
  })
  // #endif

  // #ifdef H5
  uni.showToast({ title: '请检查浏览器相机权限', icon: 'none' })
  // #endif
}

/**
 * 显示相册权限引导弹窗
 */
export const showAlbumPermissionModal = (options = {}) => {
  const { title = '相册权限未开启', content = '您未开启相册权限，将无法选择照片。是否前往开启？', onSuccess } = options
  // #ifdef MP-WEIXIN
  uni.showModal({
    title,
    content,
    confirmText: '去开启',
    success: (res) => {
      if (res.confirm) {
        uni.openSetting({
          success: (settingRes) => {
            if (settingRes.authSetting['scope.writePhotosAlbum'] || settingRes.authSetting['scope.album']) {
              onSuccess && onSuccess()
            }
          },
          fail: () => uni.showToast({ title: '打开设置失败', icon: 'none' })
        })
      }
    }
  })
  // #endif


  // // #ifdef APP-PLUS
  // uni.showModal({
  //   title,
  //   content,
  //   confirmText: '去开启',
  //   success: (res) => {
  //     if (res.confirm) {
  //       openAppSetting()
  //       onSuccess && onSuccess()
  //     }
  //   }
  // })
  // #endif

  // #ifdef H5
  uni.showToast({ title: '请检查浏览器相册权限', icon: 'none' })
  // #endif
}

/**
* 打开应用设置页面
*/
const openAppSetting = () => {
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  const platform = systemInfo.platform
  const osName = (systemInfo.osName || systemInfo.systemName || '').toLowerCase()
  const isHarmony = osName.includes('harmony')

  if (platform === 'ios') {
    plus.runtime.openURL(plus.runtime.appid ? 'app-settings:' : 'prefs:root=Privacy')
  } else if (platform === 'android' || isHarmony) {
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
 * 选择图片来源
 */
export const showImageSourceModal = () => {
  return new Promise((resolve, reject) => {
    uni.showActionSheet({
      itemList: ['拍摄照片', '从相册选择'],
      itemColor: '#000000',
      success: (res) => {
        resolve(res.tapIndex)
      },
      fail: (err) => {
        reject(new Error('user_cancelled'))
      }
    })
  })
}
