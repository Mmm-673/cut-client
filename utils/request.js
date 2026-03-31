import config from '@/config'
import { getAccessToken, getRefreshToken, shouldRefreshToken, setAuthInfo, clearAuthInfo, isLoggedIn } from '@/utils/token'
import { getErrorMessage } from '@/utils/error-messages'
import { toast } from '@/utils/common'
import { isMP, isHarmony } from '@/utils/platform'

let timeout = 10000
const baseUrl = config.baseUrl

// 刷新Token锁，防止并发刷新
let isRefreshing = false
// 等待刷新的请求队列
let refreshSubscribers = []

// 订阅等待刷新的请求
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

// 通知所有等待的请求
function onTokenRefreshed() {
  refreshSubscribers.forEach(callback => callback())
  refreshSubscribers = []
}

/**
 * 刷新Token
 */
async function refreshTokenRequest() {
  return new Promise((resolve, reject) => {
    uni.request({
      method: 'POST',
      timeout: timeout,
      url: baseUrl + '/app-api/member/auth/refresh-token',
      data: {},
      header: {
        'Content-Type': 'application/json',
        'tenant-id': '122'
      },
      dataType: 'json'
    }).then(response => {
      const res = response
      const code = res.data.code || 0
      if (code === 0 && res.data.data) {
        const data = res.data.data
        setAuthInfo(data)
        resolve(data.accessToken)
      } else {
        reject(res.data)
      }
    }).catch(error => {
      reject(error)
    })
  })
}

const request = async config => {
  // 是否需要设置 token
  const isToken = (config.headers || {}).isToken === false
  config.header = config.header || {}

  // 平台特定请求头处理
  if (isMP()) {
    config.header['X-Platform'] = 'miniprogram'
  } else if (isHarmony()) {
    config.header['X-Platform'] = 'harmony'
  }

  // 添加 tenant-id
  config.header['tenant-id'] = '122'

  // 添加 Authorization header
  const accessToken = getAccessToken()
  if (accessToken && !isToken) {
    config.header['Authorization'] = 'Bearer ' + accessToken
  }

  // 检查是否需要刷新Token（非登录接口）
  const needRefresh = !isToken && accessToken && shouldRefreshToken() && !config.url.includes('/refresh-token')

  if (needRefresh) {
    if (isRefreshing) {
      // 正在刷新，加入等待队列
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(() => {
          // 刷新完成，重新发送请求
          request(config).then(resolve).catch(reject)
        })
      })
    }

    isRefreshing = true

    try {
      await refreshTokenRequest()
      onTokenRefreshed()
    } catch (error) {
      // 刷新失败，清除登录信息
      clearAuthInfo()
      uni.reLaunch({ url: '/pages/login/index' })
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }

    // 更新新的token
    const newToken = getAccessToken()
    if (newToken) {
      config.header['Authorization'] = 'Bearer ' + newToken
    }
  }

  // get请求映射params参数
  if (config.params) {
    let url = config.url + '?'
    for (const propName of Object.keys(config.params)) {
      const value = config.params[propName]
      const part = encodeURIComponent(propName) + '='
      if (value !== null && value !== '' && typeof value !== 'undefined') {
        if (typeof value === 'object') {
          for (const key of Object.keys(value)) {
            const params = propName + '[' + key + ']'
            const subPart = encodeURIComponent(params) + '='
            url += subPart + encodeURIComponent(value[key]) + '&'
          }
        } else {
          url += part + encodeURIComponent(value) + '&'
        }
      }
    }
    url = url.slice(0, -1)
    config.url = url
  }

  return new Promise((resolve, reject) => {
    uni.request({
      method: config.method || 'get',
      timeout: config.timeout || timeout,
      url: config.baseUrl || baseUrl + config.url,
      data: config.data,
      header: config.header,
      dataType: 'json',
      // #ifdef MP-ALIPAY
      enableCookie: true,
      // #endif
      // #ifdef MP-WEIXIN
      enableHttp2: false,
      enableQuic: false,
      enableCache: true,
      // #endif
    }).then(response => {
      const res = response
      const code = res.data.code || 0
      const msg = getErrorMessage(code, res.data.msg)

      if (code === 401) {
        clearAuthInfo()
        uni.reLaunch({ url: '/pages/login/index' })
        reject(msg || '无效的会话，或者会话已过期，请重新登录。')
      } else if (code !== 0) {
        toast(msg)
        reject(code)
      }
      resolve(res.data)
    })
    .catch(error => {
      let { message } = error
      if (message === 'Network Error') {
        message = '后端接口连接异常'
      } else if (message.includes('timeout')) {
        message = '系统接口请求超时'
      } else if (message.includes('Request failed with status code')) {
        message = '系统接口' + message.slice(-3) + '异常'
      }
      toast(message)
      reject(error)
    })
  })
}

export default request
