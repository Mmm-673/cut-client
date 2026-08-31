<template>
  <view class="coach-card">
    <image class="coach-avatar" :src="coach.avatar" mode="aspectFill"></image>
    <view class="coach-info">
      <view class="coach-name-row">
        <text class="coach-name">{{ coach.stageName || coach.name }}</text>
        <view class="coach-badge" :style="{background: 'rgba(0, 187, 136, 0.2)'}">{{ coach.levelText || '初级教练' }}</view>
      </view>
      <text class="coach-desc">{{ coach.intro || '专业台球陪练，耐心教学' }}</text>
      <view class="coach-meta">
        <view class="meta-item">
          <uni-icons type="star-filled" size="14" color="#FBBF24" />
          <text>{{ coach.overallScore || coach.rating || 5.0 }}分</text>
        </view>
        <text class="meta-divider">|</text>
        <text class="meta-item">已接单{{ coach.serviceCount || coach.orderCount || 0 }}次</text>
        <text class="meta-divider" v-if="coach.distance">|</text>
        <text class="meta-item" v-if="coach.distance">{{ coach.distance }}</text>
      </view>
    </view>
    <view class="coach-score">
      <uni-icons type="star-filled" size="16" color="#FBBF24" />
      <text>{{ coach.overallScore || coach.rating || 5.0 }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  coach: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style lang="scss" scoped>
.coach-card {
  margin: 30rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  .coach-avatar {
    width: 140rpx;
    height: 140rpx;
    border-radius: 20rpx;
    flex-shrink: 0;
  }
  .coach-info {
    flex: 1;
    min-width: 0;
    .coach-name-row {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 8rpx;
      flex-wrap: wrap;
      .coach-name {
        color: var(--text-primary);
        font-size: 32rpx;
        font-weight: 700;
      }
      .coach-badge {
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        font-size: 22rpx;
        color: #00BB88;
        flex-shrink: 0;
      }
    }
    .coach-desc {
      color: var(--text-secondary);
      font-size: 24rpx;
      margin-bottom: 10rpx;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .coach-meta {
      display: flex;
      align-items: center;
      gap: 8rpx;
      flex-wrap: wrap;
      .meta-item {
        color: var(--text-secondary);
        font-size: 24rpx;
        display: flex;
        align-items: center;
        gap: 4rpx;
      }
      .meta-divider {
        color: var(--bg-secondary);
      }
    }
  }
  .coach-score {
    display: flex;
    align-items: center;
    gap: 4rpx;
    color: #FBBF24;
    font-size: 28rpx;
    font-weight: 700;
    flex-shrink: 0;
  }
}
</style>
