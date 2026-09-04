/**
 * Storage Key 集中管理
 * 所有本地存储的 key 统一在此定义，避免散落的字符串硬编码
 *
 * 命名规则：
 * - 业务模块前缀（如 AUTH_ / COACH_ / ORDER_ / THEME_ / REVIEW_）
 * - 全大写下划线分隔
 */

// ========== 认证相关 ==========
export const STORAGE_KEYS = {
  // Token 相关（注意：token.js 中实际使用的是 auth_ 前缀）
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRES_TIME: 'auth_expires_time',
  LOGIN_TIME: 'auth_login_time',

  // 用户信息
  USER_ID: 'auth_user_id',
  NICKNAME: 'auth_nickname',
  AVATAR: 'auth_avatar',
  MOBILE: 'auth_mobile',

  // 主题
  APP_THEME: 'app_theme',

  // 登录跳转
  LOGIN_REDIRECT_PAGE: 'loginRedirectPage',
  LOGIN_REDIRECT_PARAMS: 'loginRedirectParams',

  // 设备推送
  DEVICE_REG_ID: 'device_reg_id',

  // 裁教列表
  COACH_LIST_TAB: 'coachListDefaultTab',
  COACH_LIST_TAB_TIMESTAMP: 'coachListTabTimestamp',

  // 订单相关
  CREATED_ORDER_DATA: 'createdOrderData',
  SELECTED_COACH: 'selectedCoach',
  RESELECT_PARAMS: 'reselectParams',

  // 评价相关
  REVIEW_MODE_CACHE: 'reviewModeCache',
  REVIEW_ACCOUNT_PHONE: 'reviewAccountPhone',

  // 远程配置缓存
  REMOTE_CONFIG_CACHE: 'remoteConfigCache',
}

// 兼容旧命名的别名导出（token.js 中已在使用）
export const ACCESS_TOKEN_KEY = STORAGE_KEYS.ACCESS_TOKEN
export const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN
export const EXPIRES_TIME_KEY = STORAGE_KEYS.EXPIRES_TIME
export const LOGIN_TIME_KEY = STORAGE_KEYS.LOGIN_TIME
export const USER_ID_KEY = STORAGE_KEYS.USER_ID
export const NICKNAME_KEY = STORAGE_KEYS.NICKNAME
export const AVATAR_KEY = STORAGE_KEYS.AVATAR
export const MOBILE_KEY = STORAGE_KEYS.MOBILE
export const THEME_STORAGE_KEY = STORAGE_KEYS.APP_THEME
export const REVIEW_MODE_CACHE_KEY = STORAGE_KEYS.REVIEW_MODE_CACHE
export const REVIEW_ACCOUNT_PHONE_KEY = STORAGE_KEYS.REVIEW_ACCOUNT_PHONE
