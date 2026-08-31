import { ref, computed } from 'vue'
import { createOrder } from '@/api/billiard/order'
import { executePayment } from '@/utils/payment'
import { isFixedPricing } from '@/utils/pricing'
import { useBookingStore } from '@/store'
import { logger } from '@/utils/logger'

/**
 * 订单创建与支付管理
 * @param {Object} options - 配置选项
 * @param {Ref<Object>} options.orderData - 订单数据 ref
 * @param {Ref<number>} options.serviceType - 服务类型 ref
 * @param {Ref<Object>} options.selectedPlace - 选中的地点 ref
 * @param {Ref<string>} options.selectedPay - 选中的支付方式 ref
 * @param {Ref<Object>} options.selectedPayChannel - 选中的支付渠道 ref
 * @param {Ref<boolean>} options.userAgree - 用户是否同意协议 ref
 * @param {Ref<boolean>} options.orderExpired - 订单是否过期 ref
 * @param {Ref<boolean>} options.isOrderCreated - 是否已创建订单 ref
 * @param {Function} [options.afterCreate] - 创建成功后的回调
 * @param {Function} [options.onPaySuccess] - 支付成功回调
 * @returns {Object} 订单创建与支付相关状态与方法
 */
export function useOrderCreate(options) {
  const {
    orderData,
    serviceType,
    selectedPlace,
    selectedPay,
    selectedPayChannel,
    userAgree,
    orderExpired,
    isOrderCreated,
    afterCreate,
    onPaySuccess,
  } = options

  const bookingStore = useBookingStore()
  const isSubmitting = ref(false)

  /**
   * 是否为固定价订单
   */
  const isFixedOrder = computed(() => {
    const mode = orderData.value.selectedService?.pricingMode || orderData.value.pricingMode
    return isFixedPricing(mode)
  })

  /**
   * 底部按钮是否可点击
   */
  const canAction = computed(() => {
    if (!userAgree.value) return false
    if (isSubmitting.value) return false
    if (orderExpired.value) return false

    if (!isOrderCreated.value) {
      if ([2, 3, 4].includes(serviceType.value)) {
        return orderData.value.bookingTime !== undefined && selectedPlace.value
      }
      return orderData.value.bookingTime !== undefined
    } else {
      return (
        orderData.value.payOrderId !== null &&
        orderData.value.payOrderId !== undefined &&
        !!selectedPayChannel.value
      )
    }
  })

  /**
   * 校验创建订单参数
   * @returns {boolean} 是否通过校验
   */
  const validateCreateParams = () => {
    if (!orderData.value.coachInfo?.id) {
      uni.showToast({ title: '教练信息缺失', icon: 'none' })
      return false
    }

    if (!orderData.value.bookingTime) {
      uni.showToast({ title: '请选择服务时间', icon: 'none' })
      return false
    }
    if (orderData.value.bookingTime <= Date.now()) {
      uni.showToast({ title: '预约时间已过，请重新选择', icon: 'none' })
      return false
    }

    if ([2, 3, 4].includes(serviceType.value) && !selectedPlace.value) {
      uni.showToast({ title: '请选择服务地点', icon: 'none' })
      return false
    }

    if (serviceType.value === 1) {
      const venueName = orderData.value.hallInfo?.name || orderData.value.venueName
      const venueAddress = orderData.value.hallInfo?.address || orderData.value.venueAddress
      const venueLongitude = orderData.value.hallInfo?.longitude ?? orderData.value.venueLongitude
      const venueLatitude = orderData.value.hallInfo?.latitude ?? orderData.value.venueLatitude
      if (!venueName) {
        uni.showToast({ title: '请选择球厅', icon: 'none' })
        return false
      }
      if (!venueAddress) {
        uni.showToast({ title: '球厅地址缺失', icon: 'none' })
        return false
      }
      if (venueLongitude == null || venueLatitude == null) {
        uni.showToast({ title: '球厅坐标缺失', icon: 'none' })
        return false
      }
    }

    return true
  }

  /**
   * 组装创建订单参数
   * @returns {Object} 创建参数
   */
  const buildCreateParams = () => {
    const params = {
      coachId: orderData.value.coachInfo.id,
      serviceType: serviceType.value,
      bookingTime: orderData.value.bookingTime,
    }

    if (!isFixedOrder.value) {
      params.serviceDuration = orderData.value.serviceDuration || 120
      params.quantity = orderData.value.quantity || 2
    }

    if (serviceType.value === 1) {
      params.venueId = (orderData.value.hallInfo?.id ?? orderData.value.venueId) ?? null
      params.venueName = orderData.value.hallInfo?.name || orderData.value.venueName
      params.venueAddress = orderData.value.hallInfo?.address || orderData.value.venueAddress
      params.venueLongitude = orderData.value.hallInfo?.longitude ?? orderData.value.venueLongitude
      params.venueLatitude = orderData.value.hallInfo?.latitude ?? orderData.value.venueLatitude
    } else if ([2, 3, 4].includes(serviceType.value)) {
      params.servicePlaceToken = selectedPlace.value.selectionToken
    }

    if (orderData.value.selectedService?.id) {
      params.serviceItemId = orderData.value.selectedService.id
    }

    return params
  }

  /**
   * 创建订单
   */
  const handleCreateOrder = async () => {
    if (!validateCreateParams()) return

    isSubmitting.value = true
    try {
      const createParams = buildCreateParams()
      const createRes = await createOrder(createParams)
      const resultData = createRes.data || {}

      orderData.value = {
        ...orderData.value,
        ...resultData,
        serviceAmount: resultData.serviceAmount ?? 0,
        travelAmount: resultData.travelAmount ?? 0,
        travelDiscountAmount: resultData.travelDiscountAmount ?? 0,
        payAmount: resultData.payAmount ?? 0,
      }
      isOrderCreated.value = true

      bookingStore.setCreatedOrder(orderData.value)

      if (afterCreate && typeof afterCreate === 'function') {
        await afterCreate()
      }

      uni.showToast({ title: '订单创建成功', icon: 'success' })
    } catch (error) {
      logger.error('创建订单失败:', error)
      if (error.code === 1010000336) {
        uni.showToast({ title: '服务地点已失效，请重新选择', icon: 'none' })
        selectedPlace.value = null
      } else {
        uni.showToast({ title: error || '创建订单失败，请重试', icon: 'none' })
      }
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * 提交支付
   */
  const submitPayment = async () => {
    if (!canAction.value || !orderData.value.payOrderId) return

    const payChannel = selectedPayChannel.value
    if (!payChannel) {
      uni.showToast({ title: '请选择支付方式', icon: 'none' })
      return
    }

    isSubmitting.value = true
    try {
      await executePayment({
        payOrderId: orderData.value.payOrderId,
        orderId: orderData.value.orderId,
        payValue: selectedPay.value,
        channelCode: payChannel.channelCode,
        onSuccess: (payResult) => {
          uni.showToast({ title: '支付成功', icon: 'success' })
          if (onPaySuccess && typeof onPaySuccess === 'function') {
            onPaySuccess(payResult)
          } else {
            setTimeout(() => {
              uni.redirectTo({
                url: `/subpkg/booking/pay-success?orderId=${orderData.value.orderId}`,
              })
            }, 1500)
          }
        },
        onCancel: () => {
          uni.showToast({ title: '支付已取消', icon: 'none' })
        },
        onError: (error) => {
          if (!error.pending) {
            uni.showToast({ title: error.message || '支付失败，请重试', icon: 'none' })
          }
        },
      })
    } catch (error) {
      logger.error('支付失败:', error)
      if (!error.canceled && !error.pending) {
        uni.showToast({ title: error.message || '支付失败，请重试', icon: 'none' })
      }
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * 处理操作：创建订单 或 支付
   */
  const handleAction = async () => {
    if (!userAgree.value) {
      uni.showToast({ title: '请先阅读并同意服务协议和退款规则', icon: 'none' })
      return
    }
    if (!canAction.value) {
      if ([2, 3, 4].includes(serviceType.value) && !selectedPlace.value) {
        uni.showToast({ title: '请选择服务地点', icon: 'none' })
      }
      return
    }

    if (!isOrderCreated.value) {
      await handleCreateOrder()
    } else {
      await submitPayment()
    }
  }

  return {
    isSubmitting,
    isFixedOrder,
    canAction,
    handleAction,
    handleCreateOrder,
    submitPayment,
    validateCreateParams,
    buildCreateParams,
  }
}

export default useOrderCreate
