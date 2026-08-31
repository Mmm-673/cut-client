import { ref, computed } from 'vue'
// #ifdef VUE3
import { onUnload } from '@dcloudio/uni-app'
// #endif
import { onUnmounted } from 'vue'
import { addTimeOrder } from '@/api/billiard/order'
import { executePayment } from '@/utils/payment'

/**
 * 加钟逻辑 composable
 *
 * 封装订单加钟相关的状态和操作，包括：
 * - 加钟弹窗显示控制
 * - 时长选项选择（含自定义输入）
 * - 加钟接口调用
 * - 加钟支付
 *
 * 页面卸载/组件销毁时自动清理副作用。
 *
 * @param {Object} options - 配置项
 * @param {import('vue').Ref<string|number>} options.orderId - 订单ID
 * @param {import('vue').Ref<number>} options.orderStatus - 订单状态
 * @param {Function} [options.onSuccess] - 加钟支付成功后的回调
 * @returns {{
 *   showAddTimePopup: import('vue').Ref<boolean>,
 *   isAddingTime: import('vue').Ref<boolean>,
 *   addTimePayOrderId: import('vue').Ref<string|number|null>,
 *   addTimeExpireTime: import('vue').Ref<number>,
 *   selectedAddMinutes: import('vue').Ref<number>,
 *   showCustomInput: import('vue').Ref<boolean>,
 *   customMinutes: import('vue').Ref<string>,
 *   addTimeOptions: import('vue').Ref<Array<{label: string, value: number|string}>>,
 *   handleOptionSelect: Function,
 *   handleCustomInput: Function,
 *   handleCustomBlur: Function,
 *   confirmAddTime: Function,
 *   closeAddTimePopup: Function
 * }}
 *
 * @example
 * const {
 *   showAddTimePopup, isAddingTime,
 *   selectedAddMinutes, showCustomInput, customMinutes,
 *   handleOptionSelect, handleCustomInput, handleCustomBlur,
 *   confirmAddTime, closeAddTimePopup
 * } = useAddTime({ orderId, orderStatus, onSuccess: () => reloadDetail() })
 */
export function useAddTime(options) {
  const { orderId, orderStatus, onSuccess } = options

  /** 最小加钟时长（分钟） */
  const MIN_ADD_MINUTES = 10
  /** 默认选中的加钟时长（分钟） */
  const DEFAULT_ADD_MINUTES = 120

  /** 加钟弹窗显示状态 */
  const showAddTimePopup = ref(false)
  /** 加钟操作中状态 */
  const isAddingTime = ref(false)
  /** 选中的加钟时长（分钟） */
  const selectedAddMinutes = ref(DEFAULT_ADD_MINUTES)
  /** 是否显示自定义输入框 */
  const showCustomInput = ref(false)
  /** 自定义分钟数（字符串，用于输入框） */
  const customMinutes = ref('')

  /** 加钟支付订单ID */
  const addTimePayOrderId = ref(null)
  /** 加钟支付过期时间（毫秒时间戳） */
  const addTimeExpireTime = ref(0)
  /** 加钟待支付金额（分） */
  const pendingAddTimeAmount = ref(0)
  /** 加钟待支付分钟数 */
  const pendingAddTimeMinutes = ref(0)

  /** 加钟时长选项 */
  const addTimeOptions = ref([
    { label: '10分钟', value: 10 },
    { label: '30分钟', value: 30 },
    { label: '60分钟', value: 60 },
    { label: '自定义', value: 'custom' }
  ])

  /** 打开加钟弹窗 */
  const openAddTimePopup = () => {
    showAddTimePopup.value = true
    selectedAddMinutes.value = MIN_ADD_MINUTES
    showCustomInput.value = false
    customMinutes.value = ''
  }

  /** 关闭加钟弹窗 */
  const closeAddTimePopup = () => {
    showAddTimePopup.value = false
    isAddingTime.value = false
    showCustomInput.value = false
    customMinutes.value = ''
    // 注意：不清空加钟业务数据（addTimePayOrderId 等），
    // 因为关闭弹窗后可能还要显示支付弹窗。
    // 业务数据在支付完成或关闭支付弹窗时清空。
  }

  /**
   * 处理选项点击
   * @param {{label: string, value: number|string}} option - 选中的选项
   */
  const handleOptionSelect = (option) => {
    if (option.value === 'custom') {
      showCustomInput.value = true
      customMinutes.value = String(MIN_ADD_MINUTES)
      selectedAddMinutes.value = MIN_ADD_MINUTES
    } else {
      showCustomInput.value = false
      selectedAddMinutes.value = option.value
    }
  }

  /** 处理自定义输入变化 */
  const handleCustomInput = () => {
    const val = parseInt(customMinutes.value)
    if (!isNaN(val)) {
      selectedAddMinutes.value = val
    }
  }

  /** 处理自定义输入失焦 - 低于最小值则补足 */
  const handleCustomBlur = () => {
    const val = parseInt(customMinutes.value)
    if (isNaN(val) || val < MIN_ADD_MINUTES) {
      customMinutes.value = String(MIN_ADD_MINUTES)
      selectedAddMinutes.value = MIN_ADD_MINUTES
    }
  }

  /**
   * 确认加钟
   * 调用加钟接口，成功后保存支付相关数据。
   * 支付弹窗的展示由调用方控制（组合支付逻辑）。
   * @returns {Promise<boolean>} 是否成功创建加钟支付单
   */
  const confirmAddTime = async () => {
    if (isAddingTime.value) return false

    if (selectedAddMinutes.value < MIN_ADD_MINUTES) {
      uni.showToast({
        title: `最少加${MIN_ADD_MINUTES}分钟`,
        icon: 'none'
      })
      return false
    }

    isAddingTime.value = true
    try {
      const res = await addTimeOrder({
        orderId: orderId.value,
        addMinutes: selectedAddMinutes.value
      })

      const data = res.data || {}

      addTimePayOrderId.value = data.payOrderId
      pendingAddTimeAmount.value = data.addAmount
      addTimeExpireTime.value = data.expireTime
      pendingAddTimeMinutes.value = selectedAddMinutes.value

      closeAddTimePopup()
      uni.showToast({ title: '请完成支付', icon: 'success' })

      return true
    } catch (error) {
      uni.showToast({
        title: error.message || '加钟失败，请重试',
        icon: 'none'
      })
      return false
    } finally {
      isAddingTime.value = false
    }
  }

  /**
   * 执行加钟支付
   * 供调用方在支付弹窗确认时使用。
   * @param {Object} payParams - 支付参数
   * @param {string} payParams.payValue - 支付渠道值
   * @param {string} payParams.channelCode - 支付渠道编码
   * @returns {Promise<boolean>}
   */
  const executeAddTimePayment = async (payParams) => {
    if (!addTimePayOrderId.value) return false

    try {
      await executePayment({
        payOrderId: addTimePayOrderId.value,
        orderId: orderId.value,
        payValue: payParams.payValue,
        channelCode: payParams.channelCode,
        onSuccess: (payResult) => {
          // 清空加钟状态
          addTimePayOrderId.value = null
          pendingAddTimeMinutes.value = 0
          pendingAddTimeAmount.value = 0
          addTimeExpireTime.value = 0

          if (typeof onSuccess === 'function') {
            onSuccess(payResult)
          }
        }
      })
      return true
    } catch (error) {
      return false
    }
  }

  /** 清空加钟支付相关状态 */
  const clearAddTimePayState = () => {
    addTimePayOrderId.value = null
    pendingAddTimeMinutes.value = 0
    pendingAddTimeAmount.value = 0
    addTimeExpireTime.value = 0
  }

  // 页面卸载/组件销毁时自动清理
  const cleanup = () => {
    closeAddTimePopup()
    clearAddTimePayState()
  }

  // #ifdef VUE3
  try { onUnload(cleanup) } catch (e) { /* 非页面上下文忽略 */ }
  // #endif

  try { onUnmounted(cleanup) } catch (e) { /* 非组件上下文忽略 */ }

  return {
    // 弹窗状态
    showAddTimePopup,
    isAddingTime,
    // 支付数据
    addTimePayOrderId,
    addTimeExpireTime,
    pendingAddTimeAmount,
    pendingAddTimeMinutes,
    // 选项状态
    selectedAddMinutes,
    showCustomInput,
    customMinutes,
    addTimeOptions,
    // 操作方法
    openAddTimePopup,
    handleOptionSelect,
    handleCustomInput,
    handleCustomBlur,
    confirmAddTime,
    closeAddTimePopup,
    executeAddTimePayment,
    clearAddTimePayState
  }
}

export default useAddTime
