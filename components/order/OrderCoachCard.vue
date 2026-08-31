<template>
  <view class="info-card coach-card" @click="handleClick">
    <view class="card-title">
      <text class="title-icon">👤</text>
      裁教教练
    </view>

    <view class="coach-info">
      <image class="coach-avatar" :src="coachInfo.avatar || coachInfo.mainPhoto || ''" mode="aspectFill"></image>
      <view class="coach-info-right">
        <view class="coach-name-row">
          <text class="coach-name">{{ coachInfo.stageName || coachInfo.name || '未知教练' }}</text>
          <view class="coach-tag" :style="tagStyle">
            {{ coachInfo.levelText || '初级教练' }}
          </view>
        </view>
        <view class="coach-stats">
          <view class="stat-item">
            <uni-icons type="star-filled" size="14" color="#FFB800" />
            <text>{{ scoreText }}</text>
          </view>
          <view class="stat-item">
            <uni-icons type="checkbox" size="14" color="#9CA3AF" />
            <text>{{ serviceCountText }}</text>
          </view>
        </view>
        <view class="coach-tags" v-if="coachInfo.tags && coachInfo.tags.length > 0">
          <text class="tag" v-for="tag in coachInfo.tags" :key="tag">{{ tag }}</text>
        </view>
      </view>
      <view class="contact-btn" v-if="showContact" @click.stop="handleContact">
        <uni-icons type="phone" size="20" color="#00BB88" />
        <text>联系</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  coachInfo: {
    type: Object,
    default: () => ({})
  },
  orderStatus: {
    type: Number,
    default: 0
  },
  showContact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'contact'])

// 等级映射
const levelMap = {
  0: { text: '初级教练', color: '#9CA3AF' },
  1: { text: '中级教练', color: '#F59E0B' },
  2: { text: '高级教练', color: '#00BB88' },
  3: { text: '星级教练', color: '#FFD700' }
}

// 标签样式
const tagStyle = computed(() => {
  const level = props.coachInfo.level
  const levelInfo = levelMap[level] || levelMap[0]
  return {
    backgroundColor: levelInfo.color + '20',
    color: levelInfo.color
  }
})

// 评分显示文本
const scoreText = computed(() => {
  const score = props.coachInfo.overallScore ?? props.coachInfo.rating
  if (score === null || score === undefined || score === 0) return '暂无'
  return Number(score).toFixed(1)
})

// 服务次数显示文本
const serviceCountText = computed(() => {
  const count = props.coachInfo.serviceCount ?? props.coachInfo.orderCount
  if (!count) return '暂无数据'
  return `已完成${count}单`
})

const handleClick = () => {
  emit('click')
}

const handleContact = () => {
  emit('contact')
}
</script>

<style lang="scss" scoped>
.info-card {
  margin: 30rpx;
  margin-top: 20rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;

  .card-title {
    display: flex;
    align-items: center;
    color: var(--text-primary);
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 24rpx;

    .title-icon {
      margin-right: 12rpx;
    }
  }
}

/* 教练信息 */
.coach-info {
  display: flex;
  align-items: center;
  gap: 20rpx;

  .coach-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .coach-info-right {
    flex: 1;
    min-width: 0;

    .coach-name-row {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 12rpx;
      flex-wrap: wrap;

      .coach-name {
        color: var(--text-primary);
        font-size: 36rpx;
        font-weight: 600;
      }

      .coach-tag {
        background: rgba(0, 187, 136, 0.2);
        color: #00BB88;
        font-size: 24rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        flex-shrink: 0;
      }
    }

    .coach-stats {
      display: flex;
      align-items: center;
      gap: 24rpx;
      margin-bottom: 12rpx;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 6rpx;
        color: var(--text-secondary);
        font-size: 26rpx;
      }
    }

    .coach-tags {
      display: flex;
      gap: 12rpx;
      flex-wrap: wrap;

      .tag {
        background: var(--border-color);
        color: var(--text-secondary);
        font-size: 24rpx;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
      }
    }
  }
}

.contact-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(0, 187, 136, 0.1);
  flex-shrink: 0;

  text {
    color: #00BB88;
    font-size: 22rpx;
  }
}
</style>
