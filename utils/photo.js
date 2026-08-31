/**
 * 相机和相册相关工具函数
 * 相机和相册权限分开处理
 */
import { showPermissionPurposeModal, openPermissionSettings } from '@/utils/platform'

/**
 * 显示相机权限用途说明弹窗
 */
export const showCameraPurposeModal = () => {
  return showPermissionPurposeModal('hasAgreedCameraPurpose', {
    title: '相机权限说明',
    content: '为了能够使用相机功能（拍摄照片、扫描二维码），我们需要获取您的相机访问权限。该权限仅用于拍摄和扫描功能，不会用于其他用途。',
    skipIOS: true
  })
}

/**
 * 显示相册权限用途说明弹窗
 */
export const showAlbumPurposeModal = () => {
  return showPermissionPurposeModal('hasAgreedAlbumPurpose', {
    title: '相册权限说明',
    content: '为了能够从相册选择图片（选择头像、选择二维码），我们需要获取您的相册访问权限。该权限仅用于选择图片功能，不会用于其他用途。',
    skipIOS: true
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
        openPermissionSettings()
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
