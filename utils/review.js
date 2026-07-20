import { useConfigStore } from '@/store'

// 审核白名单账号：该手机号登录后强制展示审核模式界面
export const REVIEW_ACCOUNT_PHONE = '18500776411'

const REVIEW_MODE_CACHE_KEY = 'review_mode'
const REVIEW_ACCOUNT_PHONE_KEY = 'review_account_phone'

// 读取白名单账号标记（仅 storage，pinia 未激活时也可用）
function hasReviewAccount() {
  try {
    return uni.getStorageSync(REVIEW_ACCOUNT_PHONE_KEY) === REVIEW_ACCOUNT_PHONE
  } catch (e) {
    return false
  }
}

/**
 * 读取当前生效的审核模式标记
 * 生效 = 后端开关（store 已加载时取 store，否则取本地缓存）OR 白名单账号
 * @returns {boolean} true = 审核模式（隐藏陪玩/教练功能）
 */
export function isReviewMode() {
  // #ifdef APP || APP-PLUS
  // App 端不启用审核模式，编译时直接裁剪
  return false
  // #endif
  // 白名单账号优先（storage 读取，不依赖 pinia）
  if (hasReviewAccount()) {
    return true
  }
  try {
    const configStore = useConfigStore()
    if (configStore.reviewLoaded) {
      return configStore.reviewMode === true
    }
  } catch (e) {
    // pinia 未激活时忽略，回退到本地缓存
  }
  try {
    return uni.getStorageSync(REVIEW_MODE_CACHE_KEY) === true
  } catch (e) {
    return false
  }
}

/**
 * 登录成功后同步白名单账号状态
 * 命中白名单则写入 storage，未命中则移除；同时刷新 store 标记使 UI 立即切换
 * @param {string} phone - 登录使用的手机号
 * @returns {boolean} 是否命中白名单
 */
export function syncReviewAccount(phone) {
  const matched = String(phone || '') === REVIEW_ACCOUNT_PHONE
  try {
    if (matched) {
      uni.setStorageSync(REVIEW_ACCOUNT_PHONE_KEY, REVIEW_ACCOUNT_PHONE)
    } else {
      uni.removeStorageSync(REVIEW_ACCOUNT_PHONE_KEY)
    }
  } catch (e) {
    console.warn('[review] 同步白名单账号缓存失败:', e)
  }
  try {
    useConfigStore().refreshAccountReviewMode()
  } catch (e) {
    // pinia 未激活时忽略，下次启动会重新读取
  }
  return matched
}

/**
 * 登出时清除白名单账号状态（storage + store 标记）
 */
export function clearReviewAccount() {
  try {
    uni.removeStorageSync(REVIEW_ACCOUNT_PHONE_KEY)
  } catch (e) {
    console.warn('[review] 清除白名单账号缓存失败:', e)
  }
  try {
    useConfigStore().refreshAccountReviewMode()
  } catch (e) {
    // pinia 未激活时忽略，下次启动会重新读取
  }
}

/**
 * 页面入口守卫：审核模式下提示并返回首页
 * 在页面 onLoad（或初始化逻辑）最前面调用，返回 true 时应立即 return，不再加载业务数据
 * @returns {boolean} true = 已拦截（审核模式）
 */
export function guardReviewEntry() {
  if (!isReviewMode()) {
    return false
  }
  uni.showToast({
    title: '功能升级中，敬请期待',
    icon: 'none'
  })
  setTimeout(() => {
    uni.switchTab({
      url: '/pages/home/index'
    })
  }, 600)
  return true
}
