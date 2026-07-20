import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCountdownEnabled } from '@/api/billiard/order'

const REVIEW_MODE_CACHE_KEY = 'review_mode'
const REVIEW_ACCOUNT_PHONE_KEY = 'review_account_phone'

// 根据生效的审核模式更新 tabBar 第二项文案
function applyTabBarLabel(effectiveReviewMode) {
  try {
    uni.setTabBarItem({
      index: 1,
      text: effectiveReviewMode ? '球厅' : '预约'
    })
  } catch (e) {
    console.warn('[config] 设置 tabBar 文案失败:', e)
  }
}

// 读取白名单账号标记（仅 storage）
function readAccountReviewFlag() {
  try {
    return !!uni.getStorageSync(REVIEW_ACCOUNT_PHONE_KEY)
  } catch (e) {
    return false
  }
}

export const useConfigStore = defineStore('config', () => {
  const config = ref()
  const setConfig = (val) => {
    config.value = val
  }

  // 审核模式：开启时隐藏陪玩/教练功能，仅展示球厅预约
  const reviewMode = ref(false)
  const reviewLoaded = ref(false)
  // 白名单账号触发的审核模式（与后端开关取 OR）
  const accountReviewMode = ref(false)
  // 生效的审核模式：后端开关 OR 白名单账号
  const finalReviewMode = computed(() => {
    // #ifdef APP || APP-PLUS
    // App 端不启用审核模式，编译时直接裁剪
    return false
    // #endif
    return reviewMode.value || accountReviewMode.value
  })

  // 防止并发重复拉取
  let reviewFetchPromise = null

  // 重新读取白名单账号标记并应用 tabBar 文案（登录/登出后调用）
  const refreshAccountReviewMode = () => {
    accountReviewMode.value = readAccountReviewFlag()
    applyTabBarLabel(finalReviewMode.value)
  }

  const initReviewMode = () => {
    // #ifdef APP || APP-PLUS
    // App 端不启用审核模式，跳过开关拉取，直接按正常模式就绪
    reviewLoaded.value = true
    return Promise.resolve(false)
    // #endif
    // 1. 同步读取缓存，保证二次启动立即渲染正确界面
    try {
      const cached = uni.getStorageSync(REVIEW_MODE_CACHE_KEY)
      if (typeof cached === 'boolean') {
        reviewMode.value = cached
        reviewLoaded.value = true
      }
    } catch (e) {
      console.warn('[config] 读取审核模式缓存失败:', e)
    }
    // 同步读取白名单账号标记，并按生效模式应用 tabBar 文案
    accountReviewMode.value = readAccountReviewFlag()
    applyTabBarLabel(finalReviewMode.value)

    // 2. 异步拉取最新开关
    if (reviewFetchPromise) {
      return reviewFetchPromise
    }
    reviewFetchPromise = getCountdownEnabled()
        .then((res) => {
          const enabled = res && res.data === true
          reviewMode.value = enabled
          reviewLoaded.value = true
          try {
            uni.setStorageSync(REVIEW_MODE_CACHE_KEY, enabled)
          } catch (e) {
            console.warn('[config] 缓存审核模式失败:', e)
          }
          applyTabBarLabel(finalReviewMode.value)
        })
        .catch((e) => {
          // 拉取失败：保持缓存值/默认正常模式
          console.warn('[config] 获取审核模式开关失败:', e)
          reviewLoaded.value = true
        })
        .finally(() => {
          reviewFetchPromise = null
        })
    return reviewFetchPromise
  }

  return {
    config,
    setConfig,
    reviewMode,
    reviewLoaded,
    accountReviewMode,
    finalReviewMode,
    initReviewMode,
    refreshAccountReviewMode
  }
})
