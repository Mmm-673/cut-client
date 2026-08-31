import { ref } from 'vue'

/**
 * 预约时间选择管理
 * @param {Object} options - 配置选项
 * @param {Ref<Object>} options.orderData - 订单数据 ref
 * @returns {{ showTimePicker: Ref<boolean>, onTimePickerConfirm: Function, validateBookingTime: Function }}
 */
export function useBookingTime({ orderData }) {
  const showTimePicker = ref(false)

  /**
   * 时间选择器确认回调
   * @param {Object} result - 选择结果
   * @param {number} result.timestamp - 时间戳
   * @param {string} result.dateText - 日期文本
   */
  const onTimePickerConfirm = (result) => {
    if (result.timestamp <= Date.now()) {
      uni.showToast({ title: '请选择未来时间', icon: 'none' })
      return
    }
    orderData.value.timeText = result.dateText
    orderData.value.bookingTime = result.timestamp
  }

  /**
   * 校验预约时间是否有效
   * @returns {boolean} 是否有效
   */
  const validateBookingTime = () => {
    if (!orderData.value.bookingTime) {
      uni.showToast({ title: '请选择服务时间', icon: 'none' })
      return false
    }
    if (orderData.value.bookingTime <= Date.now()) {
      uni.showToast({ title: '预约时间已过，请重新选择', icon: 'none' })
      return false
    }
    return true
  }

  return {
    showTimePicker,
    onTimePickerConfirm,
    validateBookingTime,
  }
}

export default useBookingTime
