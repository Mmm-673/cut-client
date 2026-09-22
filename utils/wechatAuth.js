/**
 * 微信公众号网页授权登录工具
 * 用于 H5 微信浏览器内的快捷登录
 */

// #ifdef H5
import { isWechatBrowser } from '@/utils/platform'
import { getSocialAuthRedirect, socialLogin as socialLoginApi } from '@/api/auth'
import { useUserStore } from '@/store/modules/user'

// 社交平台类型：微信公众号（后端 JustAuth 的 WECHAT_MP）
const SOCIAL_TYPE_WECHAT_MP = 31
// 微信登录上下文缓存 key
const WX_LOGIN_CONTEXT_KEY = 'wx_login_context'

/**
 * 生成随机 state 字符串（防 CSRF）
 * @param {number} length - 长度，默认 16
 * @returns {string}
 */
function generateState(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 从 location.search 读取指定 URL 参数
 * @param {string} name
 * @returns {string|null}
 */
function getSearchParam(name) {
  try {
    const search = window.location.search || ''
    const matched = new RegExp('[?&]' + name + '=([^&]+)').exec(search)
    return matched ? decodeURIComponent(matched[1]) : null
  } catch (e) {
    return null
  }
}

/**
 * 清除 URL 上的 code/state 参数，避免刷新页面时重复处理
 */
function cleanWxAuthParamsFromUrl() {
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    window.history.replaceState(null, '', url.toString())
  } catch (e) {
    console.warn('[wechatAuth] 清理 URL 参数失败:', e)
  }
}

/**
 * 保存登录上下文
 * @param {Object} ctx - { state, redirectUrl }
 */
function saveLoginContext(ctx) {
  try {
    uni.setStorageSync(WX_LOGIN_CONTEXT_KEY, ctx)
  } catch (e) {
    console.warn('[wechatAuth] 保存登录上下文失败:', e)
  }
}

/**
 * 读取登录上下文
 * @returns {Object|null}
 */
function getLoginContext() {
  try {
    return uni.getStorageSync(WX_LOGIN_CONTEXT_KEY) || null
  } catch (e) {
    return null
  }
}

/**
 * 清除登录上下文
 */
function clearLoginContext() {
  try {
    uni.removeStorageSync(WX_LOGIN_CONTEXT_KEY)
  } catch (e) {
    console.warn('[wechatAuth] 清除登录上下文失败:', e)
  }
}

/**
 * 发起微信公众号授权登录
 * 跳转到微信授权页，授权完成后微信回跳 redirectUri 并携带 code + state
 * @param {string} [redirectUri] - 授权回跳地址，默认当前页面 origin + pathname
 * @param {string} [redirectUrl] - 登录成功后跳转的目标页（站内路径），默认首页
 * @returns {Promise<void>} 页面会跳转，不会 resolve
 */
export async function launchWechatLogin(redirectUri, redirectUrl) {
  if (!isWechatBrowser()) {
    uni.showToast({ title: '请在微信浏览器中打开', icon: 'none' })
    return
  }

  // 回跳地址：默认当前页面（去掉 hash 和 query）
  const finalRedirectUri = redirectUri || (window.location.origin + window.location.pathname)
  // 登录成功后跳转目标：默认首页
  const finalRedirectUrl = redirectUrl || '/pages/home/index'

  // 生成 state 并缓存上下文
  const state = generateState()
  saveLoginContext({
    state,
    redirectUrl: finalRedirectUrl,
    ts: Date.now()
  })

  try {
    uni.showLoading({ title: '跳转中...', mask: true })
    const res = await getSocialAuthRedirect({
      type: SOCIAL_TYPE_WECHAT_MP,
      redirectUri: finalRedirectUri
    })
    uni.hideLoading()
    const authUrl = res.data
    if (!authUrl) {
      clearLoginContext()
      throw new Error('获取微信授权链接失败')
    }
    window.location.href = authUrl
  } catch (error) {
    uni.hideLoading()
    clearLoginContext()
    const msg = (error && error.message) || '获取微信授权失败'
    uni.showToast({ title: msg, icon: 'none' })
    throw error
  }
}

/**
 * 检测并处理微信登录回调
 * 在 App.vue onLaunch 中调用。若检测到 code + 登录上下文，则完成登录并跳转。
 * @returns {Promise<boolean>} 是否处理了登录回调
 */
export async function handleWxLoginCallback() {
  if (!isWechatBrowser()) return false

  const code = getSearchParam('code')
  const state = getSearchParam('state')
  if (!code) return false
  if (!state) return false

  const context = getLoginContext()
  // 仅当存在本模块写入的登录上下文时才处理，避免与其它 OAuth 流程冲突
  if (!context || !context.state) {
    return false
  }

  console.log(code)
  console.log(state)
  // 先清理，避免刷新/重复触发
  // clearLoginContext()
  cleanWxAuthParamsFromUrl()

  // // 校验 state
  // if (state !== context.state) {
  //   uni.showToast({ title: '授权状态异常，请重试', icon: 'none' })
  //   return false
  // }

  try {
    uni.showLoading({ title: '登录中...', mask: true })
    const userStore = useUserStore()
    await userStore.socialLogin({
      type: SOCIAL_TYPE_WECHAT_MP,
      code,
      state
    })
    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })

    // 登录成功后跳转
    const target = context.redirectUrl || '/pages/home/index'
    setTimeout(() => {
      // 判断是否是 tabbar 页面
      const tabBarPages = ['pages/home/index', 'pages/coach/list', 'pages/order/list', 'pages/mine/index']
      const cleanTarget = target.replace(/^\//, '')
      if (tabBarPages.includes(cleanTarget)) {
        uni.switchTab({ url: '/' + cleanTarget })
      } else {
        uni.reLaunch({ url: target })
      }
    }, 500)

    return true
  } catch (error) {
    uni.hideLoading()
    const msg = (error && error.message) || '微信登录失败'
    uni.showToast({ title: msg, icon: 'none' })
    return false
  }
}

export default {
  launchWechatLogin,
  handleWxLoginCallback,
  SOCIAL_TYPE_WECHAT_MP
}
// #endif

// #ifndef H5
// 非 H5 平台导出空实现，避免编译错误
export function launchWechatLogin() {
  return Promise.reject(new Error('仅 H5 平台支持微信快捷登录'))
}
export function handleWxLoginCallback() {
  return Promise.resolve(false)
}
export default {
  launchWechatLogin,
  handleWxLoginCallback
}
// #endif
