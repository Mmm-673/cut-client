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
 * 防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
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

/**
 * 格式化价格（分转元）
 * @param {number} cents - 价格（分）
 * @param {boolean} keepDecimal - 是否保留小数位，默认 true
 * @returns {string} 格式化后的价格
 */
export function formatPrice(cents, keepDecimal = true) {
  if (cents === null || cents === undefined) return '0'
  const yuan = cents / 100
  if (keepDecimal) {
    return yuan.toFixed(2)
  }
  return yuan.toString()
}

/**
 * 从微信扫码参数中解析教练ID
 * 兼容：小程序码 scene（coachId=12 / id=12 / 纯数字 12）、普通链接二维码 q（完整 URL）
 * @param {string} raw 原始参数值（可能带有 URL 编码）
 * @returns {string|null} 教练ID，解析不到返回 null
 */
export function extractCoachId(raw) {
  if (!raw) return null
  let str = String(raw)
  // 最多解码三轮，兼容二次编码的场景值（如 scene%3Did%253D9）
  for (let i = 0; i < 3; i++) {
    const match = str.match(/(?:coachId|id)=(\d+)/)
    if (match) return match[1]
    const trimmed = str.trim()
    if (/^\d+$/.test(trimmed)) return trimmed
    if (!str.includes('%')) break
    try {
      str = decodeURIComponent(str)
    } catch (e) {
      break
    }
  }
  return null
}
