<template>
  <view class="time-picker-mask" v-if="visible" @click="handleCancel">
    <view class="time-picker-wrapper" @click.stop>
      <view class="time-picker-header">
        <text class="cancel-btn" @click="handleCancel">取消</text>
        <text class="picker-title">选择服务时间</text>
        <text class="confirm-btn" @click="handleConfirm">确定</text>
      </view>
      <picker-view
          class="picker-view"
          :indicator-style="indicatorStyle"
          :value="pickerValue"
          @change="onPickerChange"
          indicator-style="height: 80rpx; border-top: 1rpx solid rgba(255,255,255,0.1); border-bottom: 1rpx solid rgba(255,255,255,0.1);"
          mask-style="background-image: linear-gradient(to bottom, rgba(42, 51, 56, 0.95), rgba(42, 51, 56, 0.4), rgba(42, 51, 56, 0.95));"
      >
        <!-- 日期列 -->
        <picker-view-column>
          <view
              v-for="item in dateColumns"
              :key="item.dateText"
              class="picker-item"
          >
            {{ item.dateText }}
          </view>
        </picker-view-column>
        <!-- 小时列 -->
        <picker-view-column>
          <view
              v-for="item in hourColumns"
              :key="item.hour"
              class="picker-item"
          >
            {{ item.hourText }}
          </view>
        </picker-view-column>
        <!-- 分钟列 -->
        <picker-view-column>
          <view
              v-for="item in minuteColumns"
              :key="item.minute"
              class="picker-item"
          >
            {{ item.minuteText }}
          </view>
        </picker-view-column>
      </picker-view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  // 默认选中的时间（时间戳）
  defaultValue: {
    type: [Number, Date],
    default: null
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const pickerValue = ref([0, 0, 0])
const selectedDateTime = ref({ dateIndex: 0, hourIndex: 0, minuteIndex: 0 })
const dateColumns = ref([])
const hourColumns = ref([])
const minuteColumns = ref([])

/** 获取下一个有效时间（向上取整到5分钟） */
const getNextValidTime = () => {
  const next = new Date()
  const nextMinute = Math.ceil((next.getMinutes() + 1) / 5) * 5
  if (nextMinute >= 60) {
    next.setHours(next.getHours() + 1, 0, 0, 0)
  } else {
    next.setMinutes(nextMinute, 0, 0)
  }
  return next
}

/** 初始化时间选择器数据（未来7天） */
const initTimePickerData = () => {
  const now = new Date()
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    dates.push({ date, dateText: `${month}.${day}` })
  }
  dateColumns.value = dates
  updateHourColumns(0)
  updateMinuteColumns(0, 0)
}

/** 更新小时列 */
const updateHourColumns = (dateIndex) => {
  const nextValidTime = getNextValidTime()
  const startHour = dateIndex === 0 ? nextValidTime.getHours() : 0
  const hours = []
  for (let i = startHour; i <= 23; i++) {
    hours.push({ hour: i, hourText: String(i).padStart(2, '0') + '时' })
  }
  hourColumns.value = hours
}

/** 更新分钟列 */
const updateMinuteColumns = (dateIndex, hourIndex) => {
  const nextValidTime = getNextValidTime()
  const isToday = dateIndex === 0
  const currentHour = hourColumns.value[hourIndex]?.hour
  const startMinute = isToday && currentHour === nextValidTime.getHours() ? nextValidTime.getMinutes() : 0
  const minutes = []
  for (let i = startMinute; i < 60; i += 5) {
    minutes.push({ minute: i, minuteText: String(i).padStart(2, '0') + '分' })
  }
  minuteColumns.value = minutes
}

/** 设置时间选择器默认值 */
const setDefaultPickerValue = (targetTime) => {
  const targetDate = new Date(Math.max(Number(targetTime) || 0, getNextValidTime().getTime()))
  const now = new Date()

  // 计算日期索引
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetStartOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  const dateIndex = Math.floor((targetStartOfDay - startOfDay) / (24 * 60 * 60 * 1000))

  if (dateIndex < 0 || dateIndex >= dateColumns.value.length) return

  updateHourColumns(dateIndex)

  // 计算小时索引
  const targetHour = targetDate.getHours()
  let hourIndex = hourColumns.value.findIndex(h => h.hour === targetHour)
  if (hourIndex === -1) hourIndex = 0

  updateMinuteColumns(dateIndex, hourIndex)

  // 计算分钟索引
  const targetMinute = targetDate.getMinutes()
  let minuteIndex = minuteColumns.value.findIndex(m => m.minute >= targetMinute)
  if (minuteIndex === -1) minuteIndex = Math.max(0, minuteColumns.value.length - 1)

  pickerValue.value = [dateIndex, hourIndex, minuteIndex]
  selectedDateTime.value = { dateIndex, hourIndex, minuteIndex }
}

/** 滚动变化时联动更新列 */
const onPickerChange = (e) => {
  const val = e.detail.value
  pickerValue.value = val
  const newDateIndex = val[0]
  const newHourIndex = val[1]
  const newMinuteIndex = val[2]

  if (newDateIndex !== selectedDateTime.value.dateIndex) {
    updateHourColumns(newDateIndex)
    updateMinuteColumns(newDateIndex, 0)
    pickerValue.value = [newDateIndex, 0, 0]
    selectedDateTime.value = { dateIndex: newDateIndex, hourIndex: 0, minuteIndex: 0 }
    return
  }

  if (newHourIndex !== selectedDateTime.value.hourIndex) {
    updateMinuteColumns(newDateIndex, newHourIndex)
    pickerValue.value = [newDateIndex, newHourIndex, 0]
    selectedDateTime.value = { ...selectedDateTime.value, hourIndex: newHourIndex, minuteIndex: 0 }
    return
  }

  selectedDateTime.value = { dateIndex: newDateIndex, hourIndex: newHourIndex, minuteIndex: newMinuteIndex }
}

/** 取消选择 */
const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

/** 确认选择 */
const handleConfirm = () => {
  const dateItem = dateColumns.value[selectedDateTime.value.dateIndex]
  const hourItem = hourColumns.value[selectedDateTime.value.hourIndex]
  const minuteItem = minuteColumns.value[selectedDateTime.value.minuteIndex]

  if (!dateItem || !hourItem || !minuteItem) return

  const selectedDate = new Date(dateItem.date)
  selectedDate.setHours(hourItem.hour, minuteItem.minute, 0, 0)

  emit('confirm', {
    timestamp: selectedDate.getTime(),
    date: selectedDate,
    dateText: `${dateItem.dateText} ${hourItem.hourText.replace('时', ':')}${minuteItem.minuteText.replace('分', '')}`,
    dateIndex: selectedDateTime.value.dateIndex,
    hourIndex: selectedDateTime.value.hourIndex,
    minuteIndex: selectedDateTime.value.minuteIndex,
  })
  emit('update:visible', false)
}

// 弹窗显示时初始化数据
watch(() => props.visible, (val) => {
  if (val) {
    initTimePickerData()
    if (props.defaultValue) {
      setDefaultPickerValue(props.defaultValue)
    }
  }
})
</script>

<style lang="scss" scoped>
.time-picker-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.time-picker-wrapper {
  width: 100%;
  background: var(--bg-card, #1E252B);
  border-radius: 24rpx 24rpx 0 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.time-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 32rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);

  .cancel-btn {
    font-size: 30rpx;
    color: #9CA3AF;
  }

  .picker-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
  }

  .confirm-btn {
    font-size: 30rpx;
    color: #00BB88;
    font-weight: 500;
  }
}

.picker-view {
  height: 480rpx;
  width: 100%;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  font-size: 32rpx;
  color: #fff;
}
</style>
