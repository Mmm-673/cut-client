<template>
  <view class="coach-detail-header">
    <image class="header-bg" :src="coach.cover || '/static/images/profile.jpg'" mode="aspectFill"></image>
    <view class="header-overlay"></view>
    <view class="header-content">
      <image class="avatar" :src="coach.avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
      <view class="info">
        <view class="name-row">
          <text class="name">{{ coach.stageName || coach.name }}</text>
          <view class="tag level" :class="'level-' + coach.level">
            {{ levelText }}
          </view>
          <view
              class="tag service-status"
              :class="coach.serviceStatus === 0 ? 'status-idle' : 'status-busy'">
            {{ coach.serviceStatus === 0 ? '空闲' : '服务中' }}
          </view>
        </view>
        <view class="stats-row">
          <view class="stat-item">
            <uni-icons type="star" size="14" color="#ffc107"></uni-icons>
            <text>{{ coach.overallScore || coach.rating || 5.0 }}</text>
          </view>
          <view class="stat-item">
            <text>{{ coach.serviceCount || 0 }}单</text>
          </view>
          <view class="stat-item" v-if="coach.distance != null && coach.distance !== ''">
            <text>{{ displayDistance }}</text>
          </view>
        </view>
        <view class="tags-row">
          <view class="tag" v-for="(tag, index) in displayTags" :key="index">{{ tag }}</view>
        </view>
      </view>
      <!-- #ifndef MP-WEIXIN -->
      <view class="reward-btn" v-if="showReward" @click="handleReward">
        <uni-icons type="gift" size="16" color="#ffc107"></uni-icons>
        <text>教学心意</text>
      </view>
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  coach: {
    type: Object,
    default: () => ({})
  },
  showReward: {
    type: Boolean,
    default: true
  },
  excludeTags: {
    type: Array,
    default: () => ['活跃', '沉稳']
  }
})

const emit = defineEmits(['reward'])

const levelMap = {
  0: '初级',
  1: '中级',
  2: '高级',
  3: '星级'
}

const levelText = computed(() => {
  const level = props.coach.level
  if (typeof level === 'string') return level
  return levelMap[level] != null ? levelMap[level] : '初级'
})

const displayTags = computed(() => {
  const tags = props.coach.tags || []
  return tags.filter(t => !props.excludeTags.includes(t))
})

const displayDistance = computed(() => {
  const dist = props.coach.distance
  if (dist == null || dist === '') return ''
  if (typeof dist === 'number') {
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`
  }
  return dist
})

const handleReward = () => {
  emit('reward', props.coach)
}
</script>

<style lang="scss" scoped>
.coach-detail-header {
  position: relative;
  width: 100%;
  padding-bottom: 40rpx;

  .header-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 400rpx;
  }

  .header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 400rpx;
    background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(18,22,25,0.9) 100%);
  }

  .header-content {
    position: relative;
    z-index: 2;
    padding: 200rpx 30rpx 0;
    display: flex;
    align-items: flex-end;
    gap: 24rpx;

    .avatar {
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
      border: 4rpx solid #fff;
      flex-shrink: 0;
      margin-bottom: -20rpx;
    }

    .info {
      flex: 1;
      min-width: 0;

      .name-row {
        display: flex;
        align-items: center;
        gap: 10rpx;
        margin-bottom: 10rpx;
        flex-wrap: wrap;

        .name {
          font-size: 40rpx;
          font-weight: bold;
          color: #fff;
        }

        .tag {
          font-size: 20rpx;
          padding: 2rpx 12rpx;
          border-radius: 6rpx;
          flex-shrink: 0;

          &.level {
            &.level-0 {
              background: rgba(102, 102, 102, 0.6);
              color: #fff;
            }
            &.level-1 {
              background: rgba(255, 149, 0, 0.6);
              color: #fff;
            }
            &.level-2 {
              background: rgba(0, 212, 170, 0.6);
              color: #fff;
            }
            &.level-3 {
              background: rgba(255, 215, 0, 0.6);
              color: #fff;
            }
          }

          &.service-status {
            &.status-idle {
              background: rgba(76, 217, 100, 0.6);
              color: #fff;
            }
            &.status-busy {
              background: rgba(255, 149, 0, 0.6);
              color: #fff;
            }
          }
        }
      }

      .stats-row {
        display: flex;
        align-items: center;
        gap: 20rpx;
        margin-bottom: 10rpx;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6rpx;
          font-size: 24rpx;
          color: rgba(255, 255, 255, 0.8);
        }
      }

      .tags-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8rpx;

        .tag {
          font-size: 20rpx;
          padding: 2rpx 10rpx;
          border-radius: 4rpx;
          background: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }

    .reward-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4rpx;
      width: 100rpx;
      height: 100rpx;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.3);
      flex-shrink: 0;

      text {
        font-size: 20rpx;
        color: #ffc107;
      }
    }
  }
}
</style>
