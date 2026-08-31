<template>
  <view class="order-hall-card">
    <view class="card-title-row">
      <view class="card-title">
        <text class="title-icon">📍</text>
        {{ titleText }}
      </view>
      <view v-if="canNavigate">
        <button class="nav-btn" @click="handleNavigate">
          <uni-icons type="navigation" size="16" color="#fff" />
          导航
        </button>
      </view>
    </view>

    <text class="hall-name">{{ hallInfo.name || hallInfo.venueName }}</text>
    <view class="hall-address" v-if="hallInfo.address || hallInfo.venueAddress">
      <uni-icons type="location" size="18" color="#9CA3AF" />
      <text>{{ hallInfo.address || hallInfo.venueAddress }}</text>
    </view>
    <image
      v-if="hallInfo.photoUrl || hallInfo.venuePhotoUrl"
      class="hall-img"
      :src="hallInfo.photoUrl || hallInfo.venuePhotoUrl"
      mode="aspectFill"
    />
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  hallInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['navigate'])

const titleText = computed(() => {
  return props.hallInfo.serviceType === 1 ? '球厅信息' : '服务地点'
})

const canNavigate = computed(() => {
  return !!(props.hallInfo.longitude || props.hallInfo.venueLongitude) &&
    !!(props.hallInfo.latitude || props.hallInfo.venueLatitude)
})

const handleNavigate = () => {
  emit('navigate', {
    name: props.hallInfo.name || props.hallInfo.venueName,
    address: props.hallInfo.address || props.hallInfo.venueAddress,
    longitude: props.hallInfo.longitude || props.hallInfo.venueLongitude,
    latitude: props.hallInfo.latitude || props.hallInfo.venueLatitude
  })
}
</script>

<style lang="scss" scoped>
.order-hall-card {
  margin: 20rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;

  .card-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;

    .card-title {
      display: flex;
      align-items: center;
      color: var(--text-primary);
      font-size: 32rpx;
      font-weight: 600;

      .title-icon {
        margin-right: 12rpx;
      }
    }

    .nav-btn {
      background: #00BB88;
      color: #fff;
      border-radius: 12rpx;
      padding: 10rpx 30rpx;
      font-size: 28rpx;
      line-height: normal;
      border: none;
      display: flex;
      align-items: center;
      gap: 6rpx;

      &::after {
        border: none;
      }
    }
  }
}

.hall-name {
  color: var(--text-primary);
  font-size: 32rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
}

.hall-address {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  color: var(--text-secondary);
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

.hall-img {
  width: 100%;
  height: 320rpx;
  border-radius: 16rpx;
  background: var(--bg-secondary);
}
</style>
