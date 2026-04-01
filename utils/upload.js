import config from '@/config'
import {
	getAccessToken,
	clearAuthInfo
} from '@/utils/token'
import getErrorMessage from '@/utils/error-messages'
import {
	toast,
	showConfirm,
	tansParams
} from '@/utils/common'

let timeout = 10000
const baseUrl = config.baseUrl

export default function upload(config) {
	// 是否需要设置 token
	const isToken = (config.headers || {}).isToken === false
	config.header = config.header || {}

	// 添加 tenant-id
	config.header['tenant-id'] = '122'

	// 添加 Authorization header
	const accessToken = getAccessToken()
	if (accessToken && !isToken) {
		config.header['Authorization'] = 'Bearer ' + accessToken
	}

	// get请求映射params参数
	if (config.params) {
		let url = config.url + '?' + tansParams(config.params)
		url = url.slice(0, -1)
		config.url = url
	}
	return new Promise((resolve, reject) => {
		uni.uploadFile({
			timeout: config.timeout || timeout,
			url: baseUrl + config.url,
			filePath: config.filePath,
			name: config.name || 'file',
			header: config.header,
			formData: config.formData,
			success: (res) => {
				let result = JSON.parse(res.data)
				const code = result.code || 0
				const msg = getErrorMessage(code, result.msg)
				if (code === 0) {
					resolve(result)
				} else if (code === 401) {
					clearAuthInfo()
					showConfirm("登录状态已过期，您可以继续留在该页面，或者重新登录?").then(res => {
						if (res.confirm) {
							uni.reLaunch({
								url: '/pages/login/index'
							})
						}
					})
					reject(msg || '无效的会话，或者会话已过期，请重新登录。')
				} else if (code !== 0) {
					toast(msg)
					reject(code)
				}
			},
			fail: (error) => {
				let {
					message
				} = error
				if (message === 'Network Error') {
					message = '后端接口连接异常'
				} else if (message.includes('timeout')) {
					message = '系统接口请求超时'
				} else if (message.includes('Request failed with status code')) {
					message = '系统接口' + message.substr(message.length - 3) + '异常'
				}
				toast(message)
				reject(error)
			}
		})
	})
}