/**
 * 支付工具库 - 兼容层（已重构为 utils/payment/ 目录）
 *
 * 原 payment.js 已按职责拆分为以下模块：
 * ── payment/
 *    ├── index.js      主入口，导出 executePayment 等公共 API
 *    ├── constants.js  常量（支付渠道、状态、超时时间）
 *    ├── guard.js      防重复提交逻辑
 *    ├── channels.js   各平台支付函数、渠道列表管理
 *    ├── poller.js     支付状态轮询器
 *    └── onsite.js     现场订单支付
 *
 * 此文件为向后兼容层，重新导出所有公共 API。
 * 新代码请直接从 '@/utils/payment' 导入（会自动解析到 payment/index.js）。
 */

export * from './payment/index.js'

export { default } from './payment/index.js'
