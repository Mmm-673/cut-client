/**
 * 权限用途说明弹窗工厂
 * 统一「检查 storage  是否已同意 → showModal → 同意则 setStorage resolve / 拒绝则 reject」模式
 *
 * 用法：
 *   const showXxxPurposeModal = createPurposeModal({
 *     storageKey: 'hasAgreedXxxPurpose',
 *     title: 'XXX权限说明',
 *     content: '为什么需要这个权限...',
 *     skipOnIos: true, // APP-PLUS 的 iOS 端是否直接跳过（可选）
 *   })
 */

/**
 * 创建权限用途说明弹窗
 * @param {Object} options
 * @param {string} options.storageKey - 存储用户同意状态的 key
 * @param {string} options.title - 弹窗标题
 * @param {string} options.content - 弹窗内容
 * @param {string} [options.confirmText='同意'] - 确认按钮文字
 * @param {string} [options.cancelText='取消'] - 取消按钮文字
 * @param {boolean} [options.skipOnIos=false] - APP-PLUS 的 iOS 端是否直接跳过（使用系统权限弹窗替代）
 * @param {number} [options.delay=100] - 延迟显示的毫秒数（确保 DOM 渲染完成）
 * @returns {() => Promise<void>} 弹窗函数，用户同意则 resolve，取消则 reject('user_cancelled')
 */
export function createPurposeModal(options) {
  const {
    storageKey,
    title,
    content,
    confirmText = '同意',
    cancelText = '取消',
    skipOnIos = false,
    delay = 100,
  } = options

  return function showPurposeModal(customContent) {
    return new Promise((resolve, reject) => {
      // iOS APP-PLUS 环境下可选直接跳过（使用系统 info.plist 弹窗）
      // #ifdef APP-PLUS
      if (skipOnIos) {
        const systemInfo = uni.getSystemInfoSync()
        if (systemInfo.platform === 'ios') {
          resolve()
          return
        }
      }
      // #endif

      // 检查是否已经同意过
      const hasAgreed = uni.getStorageSync(storageKey)
      if (hasAgreed) {
        resolve()
        return
      }

      // 延迟显示，确保 DOM 渲染完成
      setTimeout(() => {
        uni.showModal({
          title,
          content: customContent || content,
          confirmText,
          cancelText,
          success: (res) => {
            if (res.confirm) {
              uni.setStorageSync(storageKey, true)
              resolve()
            } else {
              reject(new Error('user_cancelled'))
            }
          },
          fail: (err) => {
            console.error('[permissionModal] showModal 失败:', err)
            reject(err)
          },
        })
      }, delay)
    })
  }
}

export default {
  createPurposeModal,
}
