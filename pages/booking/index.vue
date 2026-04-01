<template>
  <view class="booking-wrapper">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="header-title">快速预约</text>
    </view>

    <!-- 选择助教 -->
    <view class="section">
      <view class="section-title">选择助教</view>
      <view class="coach-selector" @click="selectCoach">
        <image v-if="selectedCoach" class="coach-avatar" :src="selectedCoach.avatar" mode="aspectFill"></image>
        <view v-else class="coach-avatar empty">
          <uni-icons type="person" size="32" color="#666" />
        </view>
        <view class="coach-info">
          <text v-if="selectedCoach" class="coach-name">{{ selectedCoach.name }}</text>
          <text v-else class="coach-placeholder">请选择助教</text>
          <text v-if="selectedCoach" class="coach-price">¥{{ selectedCoach.price }}/小时</text>
        </view>
        <uni-icons type="right" size="20" color="#9CA3AF" />
      </view>
    </view>

    <!-- 选择服务 -->
    <view class="section">
      <view class="section-title">选择服务</view>
      <view class="service-grid">
        <view
          class="service-card"
          :class="{ active: selectedService?.id === item.id }"
          v-for="item in serviceList"
          :key="item.id"
          @click="selectedService = item"
        >
          <text class="service-icon">{{ item.icon }}</text>
          <text class="service-name">{{ item.name }}</text>
          <text class="service-price">¥{{ item.price }}</text>
        </view>
      </view>
    </view>

    <!-- 选择时间 -->
    <view class="section">
      <view class="section-title">选择时间</view>
      <view class="date-selector">
        <view
          class="date-item"
          :class="{ active: selectedDate === index }"
          v-for="(item, index) in dateList"
          :key="index"
          @click="selectedDate = index"
        >
          <text class="date-week">{{ item.week }}</text>
          <text class="date-day">{{ item.day }}</text>
        </view>
      </view>
      <view class="time-grid">
        <view
          class="time-item"
          :class="{ active: selectedTime === item.time, disabled: item.disabled }"
          v-for="(item, index) in timeList"
          :key="index"
          @click="!item.disabled && (selectedTime = item.time)"
        >
          {{ item.time }}
        </view>
      </view>
    </view>

    <!-- 选择球厅 -->
    <view class="section">
      <view class="section-title">选择球厅</view>
      <view class="hall-selector" @click="selectHall">
        <view class="hall-info">
          <text v-if="selectedHall" class="hall-name">{{ selectedHall.name }}</text>
          <text v-else class="hall-placeholder">请选择球厅</text>
          <text v-if="selectedHall" class="hall-address">{{ selectedHall.address }}</text>
        </view>
        <uni-icons type="right" size="20" color="#9CA3AF" />
      </view>
    </view>

    <!-- 备注 -->
    <view class="section">
      <view class="section-title">备注</view>
      <textarea
        class="remark-input"
        v-model="remark"
        placeholder="请输入备注信息（选填）"
        placeholder-class="placeholder"
        maxlength="200"
      />
    </view>

    <!-- 底部确认 -->
    <view class="bottom-bar">
      <view class="price-info">
        <text class="price-label">合计</text>
        <text class="price-unit">¥</text>
        <text class="price-num">{{ totalPrice }}</text>
      </view>
      <button class="confirm-btn" @click="goToConfirm">确认预约</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 选中的教练
const selectedCoach = ref(null)
// 选中的服务
const selectedService = ref(null)
// 选中的日期
const selectedDate = ref(0)
// 选中的时间
const selectedTime = ref('')
// 选中的球厅
const selectedHall = ref(null)
// 备注
const remark = ref('')

// 服务列表
const serviceList = ref([
  { id: 1, name: '台球陪练', icon: '🎱', price: 99 },
  { id: 2, name: '桌球教学', icon: '🎓', price: 158 },
  { id: 3, name: '斯诺克', icon: '🔴', price: 198 }
])

// 日期列表
const dateList = ref([
  { week: '今天', day: '31' },
  { week: '明天', day: '01' },
  { week: '周三', day: '02' },
  { week: '周四', day: '03' },
  { week: '周五', day: '04' },
  { week: '周六', day: '05' },
  { week: '周日', day: '06' }
])

// 时间列表
const timeList = ref([
  { time: '10:00', disabled: false },
  { time: '11:00', disabled: false },
  { time: '12:00', disabled: true },
  { time: '13:00', disabled: false },
  { time: '14:00', disabled: false },
  { time: '15:00', disabled: false },
  { time: '16:00', disabled: true },
  { time: '17:00', disabled: false },
  { time: '18:00', disabled: false },
  { time: '19:00', disabled: false },
  { time: '20:00', disabled: false },
  { time: '21:00', disabled: false }
])

// 总价
const totalPrice = computed(() => {
  return selectedService.value?.price || 0
})

// 选择教练
const selectCoach = () => {
  uni.navigateTo({
    url: '/pages/coach/list'
  })
}

// 选择球厅
const selectHall = () => {
  uni.showToast({ title: '选择球厅功能开发中', icon: 'none' })
}

// 去确认页
const goToConfirm = () => {
  if (!selectedCoach.value) {
    uni.showToast({ title: '请先选择助教', icon: 'none' })
    return
  }
  if (!selectedService.value) {
    uni.showToast({ title: '请先选择服务', icon: 'none' })
    return
  }
  if (!selectedTime.value) {
    uni.showToast({ title: '请先选择时间', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: '/pages/booking/confirm'
  })
}

onLoad(() => {
  // 默认选中第一个服务
  selectedService.value = serviceList.value[0]
})
</script>

<style lang="scss" scoped>
.booking-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-bottom: 140rpx;
}

/* 页面头部 */
.page-header {
  padding: 40rpx 30rpx 20rpx;
  .header-title {
    color: #fff;
    font-size: 40rpx;
    font-weight: bold;
  }
}

/* 通用section */
.section {
  padding: 30rpx;
  .section-title {
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    margin-bottom: 20rpx;
  }
}

/* 教练选择器 */
.coach-selector {
  display: flex;
  align-items: center;
  background: #1E252B;
  border-radius: 20rpx;
  padding: 24rpx;
  .coach-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 16rpx;
    margin-right: 20rpx;
    &.empty {
      background: #2A3138;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  .coach-info {
    flex: 1;
    .coach-name, .coach-placeholder {
      color: #fff;
      font-size: 28rpx;
      display: block;
      margin-bottom: 8rpx;
    }
    .coach-placeholder {
      color: #666;
    }
    .coach-price {
      color: #00BB88;
      font-size: 26rpx;
    }
  }
}

/* 服务选择 */
.service-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  .service-card {
    background: #1E252B;
    border-radius: 16rpx;
    padding: 24rpx 16rpx;
    text-align: center;
    border: 2rpx solid transparent;
    &.active {
      border-color: #00BB88;
      background: rgba(0, 187, 136, 0.1);
    }
    .service-icon {
      font-size: 40rpx;
      display: block;
      margin-bottom: 12rpx;
    }
    .service-name {
      color: #fff;
      font-size: 26rpx;
      display: block;
      margin-bottom: 8rpx;
    }
    .service-price {
      color: #00BB88;
      font-size: 28rpx;
      font-weight: bold;
    }
  }
}

/* 日期选择 */
.date-selector {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  overflow-x: auto;
  .date-item {
    flex-shrink: 0;
    width: 100rpx;
    padding: 20rpx 0;
    background: #1E252B;
    border-radius: 16rpx;
    text-align: center;
    border: 2rpx solid transparent;
    &.active {
      border-color: #00BB88;
      background: rgba(0, 187, 136, 0.1);
    }
    .date-week {
      color: #9CA3AF;
      font-size: 22rpx;
      display: block;
      margin-bottom: 8rpx;
    }
    .date-day {
      color: #fff;
      font-size: 28rpx;
      font-weight: bold;
    }
  }
}

/* 时间选择 */
.time-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  .time-item {
    padding: 20rpx 0;
    background: #1E252B;
    border-radius: 12rpx;
    text-align: center;
    color: #fff;
    font-size: 26rpx;
    border: 2rpx solid transparent;
    &.active {
      border-color: #00BB88;
      background: rgba(0, 187, 136, 0.1);
    }
    &.disabled {
      color: #333;
      background: #1A1A1A;
    }
  }
}

/* 球厅选择 */
.hall-selector {
  display: flex;
  align-items: center;
  background: #1E252B;
  border-radius: 20rpx;
  padding: 24rpx;
  .hall-info {
    flex: 1;
    .hall-name, .hall-placeholder {
      color: #fff;
      font-size: 28rpx;
      display: block;
      margin-bottom: 8rpx;
    }
    .hall-placeholder {
      color: #666;
    }
    .hall-address {
      color: #9CA3AF;
      font-size: 24rpx;
    }
  }
}

/* 备注 */
.remark-input {
  width: 100%;
  min-height: 160rpx;
  background: #1E252B;
  border-radius: 20rpx;
  padding: 24rpx;
  box-sizing: border-box;
  color: #fff;
  font-size: 28rpx;
  .placeholder {
    color: #666;
  }
}

/* 底部栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1E252B;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  .price-info {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
    .price-label {
      color: #fff;
      font-size: 28rpx;
    }
    .price-unit {
      color: #00BB88;
      font-size: 28rpx;
    }
    .price-num {
      color: #00BB88;
      font-size: 44rpx;
      font-weight: bold;
    }
  }
  .confirm-btn {
    padding: 0 60rpx;
    height: 88rpx;
    line-height: 88rpx;
    background: #00BB88;
    color: #fff;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: bold;
    border: none;
    &::after { border: none; }
  }
}
</style>
