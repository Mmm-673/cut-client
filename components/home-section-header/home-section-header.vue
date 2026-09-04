<template>
  <view class="section-header">
    <view class="title-left">
      <view class="title-decoration">
        <view class="title-dot" :class="{ blue: badgeColor === 'blue' }"></view>
        <view class="title-line" :class="{ blue: badgeColor === 'blue' }"></view>
      </view>
      <text class="title-text">{{ title }}</text>
      <view class="title-badge" :class="{ blue: badgeColor === 'blue' }" v-if="badge">{{ badge }}</view>
    </view>
    <view class="view-more" v-if="showMore" @click="handleMore">
      <text>{{ moreText }}</text>
      <uni-icons type="right" size="14" color="#9CA3AF" />
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  badge: {
    type: String,
    default: ''
  },
  badgeColor: {
    type: String,
    default: 'default' // 'default' (green/orange) or 'blue'
  },
  showMore: {
    type: Boolean,
    default: true
  },
  moreText: {
    type: String,
    default: '全部'
  }
})

const emit = defineEmits(['more'])

const handleMore = () => {
  emit('more')
}
</script>

<style lang="scss" scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;

  .title-left {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .title-decoration {
      display: flex;
      align-items: center;
      gap: 6rpx;

      .title-dot {
        width: 12rpx;
        height: 12rpx;
        background: var(--brand-primary);
        border-radius: 50%;
        box-shadow: 0 0 12rpx rgba(0, 187, 136, 0.5);

        &.blue {
          background: #3B82F6;
          box-shadow: 0 0 12rpx rgba(59, 130, 246, 0.5);
        }
      }

      .title-line {
        width: 24rpx;
        height: 4rpx;
        background: linear-gradient(90deg, #00BB88, transparent);
        border-radius: 2rpx;

        &.blue {
          background: linear-gradient(90deg, #3B82F6, transparent);
        }
      }
    }

    .title-text {
      color: var(--text-primary);
      font-size: 34rpx;
      font-weight: 700;
      letter-spacing: -0.5rpx;
    }

    .title-badge {
      background: var(--brand-light-bg);
      color: var(--brand-primary);
      font-size: 18rpx;
      font-weight: 700;
      padding: 4rpx 10rpx;
      border-radius: 8rpx;
      border: 1rpx solid rgba(0, 187, 136, 0.3);

      &.blue {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.08));
        color: #3B82F6;
        border-color: rgba(59, 130, 246, 0.3);
      }
    }
  }

  .view-more {
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding: 8rpx 12rpx;
    background: var(--bg-secondary);
    border-radius: 50rpx;
    transition: all 0.3s ease;

    &:active {
      background: rgba(255,255,255,0.08);
    }

    text {
      color: var(--text-secondary);
      font-size: 26rpx;
      font-weight: 500;
    }
  }
}
</style>
