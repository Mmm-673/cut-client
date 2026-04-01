/**
 * 显示消息提示框
 * @param content 提示的标题
 */
export function toast(content) {
  uni.showToast({
    icon: 'none',
    title: content,
    duration: 2000
  })
}

/**
 * 显示模态弹窗
 * @param content 提示的标题
 */
export function showConfirm(content) {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: '提示',
      content: content,
      cancelText: '取消',
      confirmText: '确定',
      success: function(res) {
        resolve(res)
      },
      fail: function(err) {
        reject(err)
      }
    })
  })
}

/**
 * 显示加载提示
 * @param title 加载提示文字
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({
    title: title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
export function hideLoading() {
  uni.hideLoading()
}

/**
 * 参数处理
 * @param params 参数
 */
export function tansParams(params) {
  let result = ''
  for (const propName of Object.keys(params)) {
    const value = params[propName]
    var part = encodeURIComponent(propName) + "="
    if (value !== null && value !== "" && typeof (value) !== "undefined") {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== "" && typeof (value[key]) !== 'undefined') {
            let params = propName + '[' + key + ']'
            var subPart = encodeURIComponent(params) + "="
            result += subPart + encodeURIComponent(value[key]) + "&"
          }
        }
      } else {
        result += part + encodeURIComponent(value) + "&"
      }
    }
  }
  return result
}

/**
 * 获取系统信息（安全封装）
 */
export function getSystemInfo() {
  try {
    return uni.getSystemInfoSync()
  } catch (e) {
    console.warn('获取系统信息失败:', e)
    return {
      platform: 'unknown',
      windowWidth: 375,
      windowHeight: 667,
      statusBarHeight: 0
    }
  }
}
