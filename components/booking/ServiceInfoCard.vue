<template>
  <view class="info-card">
    <view class="card-title">服务信息</view>

    <view class="info-row">
      <text class="label">服务项目</text>
      <text class="value">{{ serviceTypeName }}</text>
    </view>

    <view class="info-row" v-if="!isFixedOrder">
      <text class="label">服务时长</text>
      <text class="value">{{ (serviceDuration / 60) || 2 }}小时</text>
    </view>

    <view class="info-row" v-if="!isOrderCreated" @click="$emit('select-time')">
      <text class="label">服务时间</text>
      <view class="value-wrap">
        <text class="value">{{ timeText || '请选择服务时间' }}</text>
        <uni-icons type="right" size="18" color="#9CA3AF" />
      </view>
    </view>

    <view class="info-row" v-else>
      <text class="label">服务时间</text>
      <text class="value">{{ timeText || formatDate(bookingTime, 'MM.DD HH:mm') }}</text>
    </view>

    <!-- 台球类型：球厅地点 -->
    <view class="info-row venue-row" v-if="serviceType === 1" @click="$emit('reselect-hall')">
      <text class="label">服务地点</text>
      <view class="value-wrap venue-wrap">
        <view class="venue-info">
          <text class="value venue-name">{{ venueName || '请选择服务地点' }}</text>
          <text class="venue-address" v-if="venueAddress">{{ venueAddress }}</text>
        </view>
        <uni-icons type="right" size="18" color="#9CA3AF" />
      </view>
    </view>

    <!-- 非台球类型：服务城市 -->
    <view class="info-row venue-row" v-if="[2, 3, 4].includes(serviceType)">
      <text class="label">服务城市</text>
      <view class="value-wrap venue-wrap location-picker-wrapper" @click="$emit('select-city')">
        <view class="location-box">
          <uni-icons type="location" size="18" color="#00BB88" />
          <text class="location-text">
            <text v-if="locating">定位中...</text>
            <text v-else-if="locationDenied">定位权限未开启</text>
            <text v-else-if="displayCityName">{{ displayCityName }}</text>
            <text v-else>选择城市</text>
          </text>
          <uni-icons type="right" size="16" color="#9CA3AF" />
        </view>
      </view>
    </view>

    <!-- 非台球类型：服务地点 -->
    <view class="info-row venue-row" v-if="[2, 3, 4].includes(serviceType)">
      <text class="label">服务地点</text>
      <view class="value-wrap venue-wrap location-picker-wrapper" @click="$emit('select-place')">
        <view class="location-box">
          <uni-icons type="location" size="18" color="#00BB88" />
          <text class="location-text">
            <text v-if="placeName">{{ placeName }}</text>
            <text v-else>选择服务地点</text>
          </text>
          <uni-icons type="right" size="16" color="#9CA3AF" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { formatDate } from '@/utils/format'

defineProps({
  serviceTypeName: { type: String, default: '' },
  isFixedOrder: { type: Boolean, default: false },
  serviceDuration: { type: Number, default: 0 },
  isOrderCreated: { type: Boolean, default: false },
  timeText: { type: String, default: '' },
  bookingTime: { type: Number, default: 0 },
  serviceType: { type: Number, default: 1 },
  venueName: { type: String, default: '' },
  venueAddress: { type: String, default: '' },
  locating: { type: Boolean, default: false },
  locationDenied: { type: Boolean, default: false },
  displayCityName: { type: String, default: '' },
  placeName: { type: String, default: '' },
})

defineEmits(['select-time', 'reselect-hall', 'select-city', 'select-place'])
</script>

<style lang="scss" scoped>
.info-card {
  margin: 0 30rpx 30rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;
  .card-title {
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 700;
    margin-bottom: 24rpx;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border-color);
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .label {
    color: var(--text-secondary);
    font-size: 28rpx;
  }
  .value-wrap {
    display: flex;
    align-items: center;
    gap: 12rpx;
    .value {
      color: var(--text-primary);
      font-size: 28rpx;
    }
  }
  .value {
    color: var(--text-primary);
    font-size: 28rpx;
  }
}

.venue-row {
  align-items: flex-start;
  .venue-wrap {
    align-items: flex-start;
    .venue-info {
      flex: 1;
      text-align: right;
      .venue-name {
        color: var(--text-primary);
        font-size: 28rpx;
        display: block;
        margin-bottom: 6rpx;
      }
      .venue-address {
        color: var(--text-secondary);
        font-size: 24rpx;
        display: block;
        line-height: 1.4;
      }
    }
  }
}

.location-picker-wrapper {
  margin: 0;
  padding: 0;
}

.location-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx;
  background: var(--bg-card);
  border-radius: 16rpx;
  .location-text {
    color: var(--text-primary);
    font-size: 28rpx;
    flex: 1;
  }
}
</style>
