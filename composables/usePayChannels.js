import { ref, computed } from 'vue'
import { fetchEnabledChannels } from '@/utils/payment'
import { getWallet } from '@/api/billiard/wallet'
import { logger } from '@/utils/logger'

/**
 * 支付渠道加载与选择管理
 * @param {Object} [options] - 配置选项
 * @param {number} [options.appId=10] - 应用ID
 * @returns {Object} 支付渠道相关状态与方法
 */
export function usePayChannels(options = {}) {
  const { appId = 10 } = options

  const payList = ref([])
  const selectedPay = ref('')
  const walletBalance = ref(null)

  const selectedPayChannel = computed(() =>
    payList.value.find(item => item.value === selectedPay.value)
  )

  /**
   * 给钱包渠道注入余额信息
   * @param {Array} channels - 渠道列表
   * @returns {Array} 注入后的渠道列表
   */
  const applyWalletBalance = (channels) => {
    return channels.map(channel => ({
      ...channel,
      ...(channel.value === 'wallet' && walletBalance.value !== null
        ? { balance: walletBalance.value }
        : {})
    }))
  }

  /**
   * 确保有选中的支付方式
   */
  const ensureSelectedPay = () => {
    if (!payList.value.some(item => item.value === selectedPay.value)) {
      selectedPay.value = payList.value[0]?.value || ''
    }
  }

  /**
   * 加载可用支付渠道
   */
  const loadPayChannels = async () => {
    try {
      const channels = await fetchEnabledChannels(appId)
      logger.debug('获取到的支付渠道列表:', channels)
      payList.value = applyWalletBalance(channels)
      ensureSelectedPay()
    } catch (error) {
      logger.error('加载支付方式失败:', error)
      payList.value = []
      ensureSelectedPay()
    }
  }

  /**
   * 选择支付方式
   * @param {string} val - 支付方式值
   */
  const selectPay = (val) => {
    selectedPay.value = val
  }

  /**
   * 加载钱包余额
   */
  const loadWalletBalance = async () => {
    try {
      const res = await getWallet()
      if (res.data && res.data.balance !== undefined) {
        walletBalance.value = (res.data.balance / 100).toFixed(2)
        payList.value = applyWalletBalance(payList.value)
      }
    } catch (error) {
      logger.error('加载钱包余额失败:', error)
    }
  }

  return {
    // 状态
    payList,
    selectedPay,
    walletBalance,
    selectedPayChannel,
    // 方法
    loadPayChannels,
    selectPay,
    loadWalletBalance,
    applyWalletBalance,
    ensureSelectedPay,
  }
}

export default usePayChannels
