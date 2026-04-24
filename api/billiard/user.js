import request from '@/utils/request'
import upload from '@/utils/upload'

/**
 * 获取用户个人信息
 * @returns {Promise<Object>} 返回用户信息
 * @returns {number} returns.data.id - 用户ID
 * @returns {string} returns.data.avatar - 头像URL
 * @returns {string} returns.data.nickname - 昵称
 * @returns {string} returns.data.mobile - 手机号
 * @returns {number} returns.data.sex - 性别：1=男 / 2=女 / 0=未知
 * @returns {string|null} returns.data.birthday - 生日
 * @returns {number} returns.data.areaId - 地区编号
 * @returns {string} returns.data.introduction - 个人简介
 */
export function getUserInfo() {
  return request({
    url: '/app-api/billiard/user/get',
    method: 'get'
  })
}

/**
 * 上传文件（统一文件上传接口）
 * @param {string} filePath - 文件路径
 * @param {string} [directory] - 保存目录，如 'avatar'
 * @returns {Promise<Object>} 返回上传结果
 * @returns {string} returns.data - 文件完整访问URL
 */
export function uploadFile(filePath, directory = 'avatar') {
  return upload({
    url: '/app-api/infra/file/upload',
    filePath,
    name: 'file',
    formData: { directory }
  })
}

/**
 * 编辑个人信息
 * @param {Object} data - 请求参数（所有字段可选，仅传需要更新的）
 * @param {string} [data.avatar] - 头像URL
 * @param {string} [data.nickname] - 昵称（≤30字符）
 * @param {number} [data.sex] - 性别：1=男 / 2=女 / 0=未知
 * @param {string} [data.birthday] - 生日（格式 yyyy-MM-dd）
 * @param {number} [data.areaId] - 地区编号
 * @param {string} [data.introduction] - 个人简介（≤500字符）
 * @returns {Promise<Object>} 返回更新结果
 */
export function updateUser(data) {
  return request({
    url: '/app-api/billiard/user/update',
    method: 'post',
    data
  })
}

/**
 * 发送换绑手机短信验证码
 * @param {Object} data - 请求参数
 * @param {string} data.mobile - 新手机号
 * @returns {Promise<Object>} 返回发送结果
 */
export function sendUpdateMobileSms(data) {
  return request({
    url: '/app-api/billiard/user/send-update-mobile-sms',
    method: 'post',
    data
  })
}

/**
 * 修改手机号
 * @param {Object} data - 请求参数
 * @param {string} data.mobile - 新手机号
 * @param {string} data.code - 验证码
 * @returns {Promise<Object>} 返回修改结果
 */
export function updateMobile(data) {
  return request({
    url: '/app-api/billiard/user/update-mobile',
    method: 'post',
    data
  })
}
