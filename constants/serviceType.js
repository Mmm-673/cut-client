/**
 * 服务类型常量
 * 所有服务类型码统一在此定义
 */

// 服务类型枚举
export const SERVICE_TYPE = {
  // 台球指导/台球陪练
  BILLIARD_COACH: 1,

  // 潮玩领航/达人带路
  TREND_GUIDE: 2,

  // 酒艺品鉴
  WINE_TASTING: 3,

  // 影视赏析
  MOVIE_APPRECIATION: 4,
}

// 服务类型中文名称（与业务实际展示用语保持一致）
export const SERVICE_TYPE_NAME = {
  [SERVICE_TYPE.BILLIARD_COACH]: '台球指导',
  [SERVICE_TYPE.TREND_GUIDE]: '潮玩领航',
  [SERVICE_TYPE.WINE_TASTING]: '酒艺品鉴',
  [SERVICE_TYPE.MOVIE_APPRECIATION]: '影视赏析',
}

// 计价模式
export const PRICING_MODE = {
  // 小时价
  HOURLY: 1,
  // 固定价
  FIXED: 2,
}

// 计价模式名称
export const PRICING_MODE_NAME = {
  [PRICING_MODE.HOURLY]: '小时价',
  [PRICING_MODE.FIXED]: '固定价',
}

/** 获取服务类型名称 */
export function getServiceTypeName(type) {
  return SERVICE_TYPE_NAME[type] || '台球指导'
}

/** 是否是台球指导类型（需要选择球厅） */
export function isBilliardService(type) {
  return type === SERVICE_TYPE.BILLIARD_COACH
}

/** 是否是非台球类型（需要选择城市和地点：达人带路、酒艺品鉴、影视赏析） */
export function isNonBilliardService(type) {
  return (
    type === SERVICE_TYPE.TREND_GUIDE ||
    type === SERVICE_TYPE.WINE_TASTING ||
    type === SERVICE_TYPE.MOVIE_APPRECIATION
  )
}

/** 获取计价模式名称 */
export function getPricingModeName(mode) {
  return PRICING_MODE_NAME[mode] || '小时价'
}
