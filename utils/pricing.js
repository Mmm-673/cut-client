/**
 * 价格模式相关工具
 *
 * 注意：服务目录中的 pricingMode 是字符串（HOURLY / FIXED），
 *       订单和计时中的 pricingMode 是整数（1 / 2）。
 *       两者不可直接比较，需要通过统一的工具函数判断。
 */

// 订单/计时中的 pricingMode 整数编码
export const ORDER_PRICING_MODE = {
  HOURLY: 1,
  FIXED: 2
}

// 服务目录中的 pricingMode 字符串值
export const CATALOG_PRICING_MODE = {
  HOURLY: 'HOURLY',
  FIXED: 'FIXED'
}

/**
 * 判断是否为固定价模式
 * @param {string|number|null|undefined} mode - pricingMode 值（字符串或整数都支持）
 * @returns {boolean}
 */
export function isFixedPricing(mode) {
  if (mode === null || mode === undefined) return false
  return mode === CATALOG_PRICING_MODE.FIXED || Number(mode) === ORDER_PRICING_MODE.FIXED
}

/**
 * 判断是否为小时价模式
 * @param {string|number|null|undefined} mode - pricingMode 值
 * @returns {boolean}
 */
export function isHourlyPricing(mode) {
  if (mode === null || mode === undefined) return false
  return mode === CATALOG_PRICING_MODE.HOURLY || Number(mode) === ORDER_PRICING_MODE.HOURLY
}

/**
 * 格式化服务价格展示（分 → 元，带单位）
 * @param {Object} serviceItem - 服务项目对象
 * @param {number|null} serviceItem.price - 价格（分）
 * @param {string} [serviceItem.priceUnit] - 价格单位：小时 / 次
 * @param {string} [serviceItem.pricingMode] - 计价模式
 * @returns {string} 格式化后的价格文案，如 "68.00 元/次"、"120.00 元/小时"
 */
export function formatServicePrice(serviceItem) {
  if (!serviceItem || serviceItem.price === null || serviceItem.price === undefined) {
    return '暂无报价'
  }
  const yuan = (serviceItem.price / 100).toFixed(2)
  const unit = serviceItem.priceUnit || '小时'
  return `${yuan} 元/${unit}`
}

/**
 * 获取格式化后的价格数值（分 → 元，字符串）
 * @param {number|null|undefined} price - 价格（分）
 * @returns {string}
 */
export function formatPriceValue(price) {
  if (price === null || price === undefined) return '0.00'
  return (price / 100).toFixed(2)
}

/**
 * 判断服务项目是否可预约下单
 * 固定价服务 price=null 时不可下单
 * @param {Object} serviceItem - 服务项目对象
 * @returns {boolean}
 */
export function canBookService(serviceItem) {
  if (!serviceItem) return false
  // 固定价但 price 为空 → 不可预约
  if (isFixedPricing(serviceItem.pricingMode) && (serviceItem.price === null || serviceItem.price === undefined)) {
    return false
  }
  return true
}

/**
 * 获取价格单位
 * @param {Object} serviceItem - 服务项目对象
 * @param {string} [serviceItem.priceUnit] - 价格单位
 * @param {string|number} [serviceItem.pricingMode] - 计价模式（兜底判断）
 * @returns {string}
 */
export function getPriceUnit(serviceItem) {
  if (serviceItem?.priceUnit) return serviceItem.priceUnit
  if (isFixedPricing(serviceItem?.pricingMode)) return '次'
  return '小时'
}

export default {
  ORDER_PRICING_MODE,
  CATALOG_PRICING_MODE,
  isFixedPricing,
  isHourlyPricing,
  formatServicePrice,
  formatPriceValue,
  canBookService,
  getPriceUnit
}
