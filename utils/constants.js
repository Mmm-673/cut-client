/**
 * 项目全局常量
 *
 * 命名规范：
 * - 通用常量：全大写下划线分隔（如 TIME_ONE_SECOND）
 * - 模块专用常量：请定义在模块文件顶部，加 JSDoc 注释
 */

// ===== 时间常量（毫秒） =====
/** 1 秒（毫秒） */
export const TIME_ONE_SECOND = 1000
/** 1 分钟（毫秒） */
export const TIME_ONE_MINUTE = 60 * TIME_ONE_SECOND
/** 5 分钟（毫秒） */
export const TIME_FIVE_MINUTES = 5 * TIME_ONE_MINUTE
/** 1 小时（毫秒） */
export const TIME_ONE_HOUR = 60 * TIME_ONE_MINUTE
/** 1 天（毫秒） */
export const TIME_ONE_DAY = 24 * TIME_ONE_HOUR

// ===== 分页默认值 =====
/** 默认页码（从 1 开始） */
export const DEFAULT_PAGE_NO = 1
/** 默认每页数量 */
export const DEFAULT_PAGE_SIZE = 20

// ===== 存储 key 前缀 =====
/** 本地存储 key 统一前缀，避免与其他项目冲突 */
export const STORAGE_PREFIX = 'cut_app_'

// ===== HTTP 状态码 =====
/** 请求成功 */
export const HTTP_SUCCESS = 200
/** 未授权 */
export const HTTP_UNAUTHORIZED = 401

// ===== 业务状态码 =====
/** 业务成功 */
export const CODE_SUCCESS = 0

// ===== 评分相关 =====
/** 最大星级评分 */
export const MAX_RATING = 5

// ===== 金额相关 =====
/** 分转元的除数 */
export const FEN_TO_YUAN = 100
