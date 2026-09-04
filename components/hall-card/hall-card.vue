<template>
  <view class="hall-card">
    <!-- 球厅图片 -->
    <view class="hall-image-wrap">
      <image
        class="hall-image"
        :src="hall.coverImageUrl || hall.defaultImage || '/static/images/placeholder.png'"
        mode="aspectFill"
        lazy-load
      ></image>
      <view
        class="hall-tag"
        v-if="firstTag"
        :style="{background: hall.tagBg || '#00BB88'}"
      >
        {{ firstTag }}
      </view>
      <view class="hall-distance" v-if="hall.distance != null && hall.distance !== ''">
        {{ displayDistance }}
      </view>
    </view>

    <!-- 球厅信息 -->
    <view class="hall-info">
      <view class="hall-header">
        <view class="hall-name-wrap">
          <text class="hall-name">{{ hall.name }}</text>
          <view
            class="hall-badge"
            v-if="hall.advantage"
            :style="{background: 'rgba(0, 187, 136, 0.2)'}"
          >
            {{ hall.advantage }}
          </view>
        </view>
        <view class="hall-price">
          <text class="price-num" v-if="hall.price > 0">¥{{ displayPrice }}</text>
          <text class="price-num" v-else>暂无报价</text>
          <text class="price-unit" v-if="hall.price > 0">/小时起</text>
        </view>
      </view>

      <view class="hall-meta">
        <template v-if="hall.score != null || hall.reviewCount != null">
          <uni-icons v-if="hall.score != null" type="star-filled" size="16" color="#FBBF24" />
          <text v-if="hall.score != null" class="meta-text">{{ hall.score }}</text>
          <text v-if="hall.score != null && hall.reviewCount != null" class="meta-divider">|</text>
          <text v-if="hall.reviewCount != null" class="meta-text">{{ hall.reviewCount }}条评价</text>
        </template>
        <text v-else class="meta-text">暂无评分</text>
      </view>

      <view class="hall-address">
        <uni-icons type="location" size="14" color="#9CA3AF" />
        <text class="address-text">{{ hall.address }}</text>
      </view>

      <view class="hall-tags" v-if="facilityTagList.length > 0">
        <view
          class="tag-item"
          v-for="(tag, index) in facilityTagList"
          :key="index"
        >
          {{ tag }}
        </view>
      </view>

      <view class="hall-promo" v-if="hall.promotionText">
        <uni-icons type="gift" size="16" color="#00BB88" />
        <text class="promo-text">{{ hall.promotionText }}</text>
      </view>

      <view class="hall-actions">
        <view class="action-btn secondary" @click.stop="handleNavigate">
          <uni-icons type="navigate" size="18" color="#9CA3AF" />
          <text>导航</text>
        </view>
        <view class="action-btn secondary" @click.stop="handleCall">
          <uni-icons type="phone" size="18" color="#9CA3AF" />
          <text>电话</text>
        </view>
        <view class="action-btn primary" @click.stop="handleChoose">
          <text>{{ isCreating ? '创建中...' : '选择' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  hall: {
    type: Object,
    default: () => ({})
  },
  isCreating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['choose', 'navigate', 'call'])

const firstTag = computed(() => {
  if (!props.hall.tags) return ''
  const tags = props.hall.tags.split(',')
  return tags.length > 0 ? tags[0] : ''
})

const facilityTagList = computed(() => {
  if (!props.hall.facilityTags) return []
  return props.hall.facilityTags.split(',').filter(Boolean)
})

const displayPrice = computed(() => {
  if (!props.hall.price) return '0'
  return (props.hall.price / 100).toFixed(2)
})

const displayDistance = computed(() => {
  const dist = props.hall.distance
  if (dist == null || dist === '') return ''
  if (typeof dist === 'number') {
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`
  }
  return dist
})

const handleNavigate = () => {
  emit('navigate', props.hall)
}

const handleCall = () => {
  emit('call', props.hall)
}

const handleChoose = () => {
  emit('choose', props.hall)
}
</script>

<style lang="scss" scoped>
.hall-card {
  background-color: var(--bg-card);
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  overflow: hidden;

  .hall-image-wrap {
    position: relative;
    width: 100%;
    height: 280rpx;

    .hall-image {
      width: 100%;
      height: 100%;
    }

    .hall-tag {
      position: absolute;
      top: 20rpx;
      left: 20rpx;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
      font-size: 22rpx;
      color: #fff;
      font-weight: 500;
    }

    .hall-distance {
      position: absolute;
      bottom: 16rpx;
      right: 20rpx;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      padding: 4rpx 12rpx;
      border-radius: 16rpx;
      font-size: 22rpx;
    }
  }

  .hall-info {
    padding: 24rpx;

    .hall-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16rpx;

      .hall-name-wrap {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12rpx;
        min-width: 0;

        .hall-name {
          font-size: 32rpx;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hall-badge {
          flex-shrink: 0;
          padding: 4rpx 12rpx;
          border-radius: 8rpx;
          font-size: 20rpx;
          color: #00BB88;
        }
      }

      .hall-price {
        flex-shrink: 0;
        text-align: right;

        .price-num {
          font-size: 32rpx;
          font-weight: 700;
          color: #ff6b35;
        }

        .price-unit {
          font-size: 22rpx;
          color: var(--text-tertiary);
          margin-left: 4rpx;
        }
      }
    }

    .hall-meta {
      display: flex;
      align-items: center;
      margin-bottom: 12rpx;

      .meta-text {
        font-size: 24rpx;
        color: var(--text-secondary);
        margin-left: 6rpx;
      }

      .meta-divider {
        margin: 0 10rpx;
        color: var(--text-tertiary);
        font-size: 22rpx;
      }
    }

    .hall-address {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;

      .address-text {
        font-size: 24rpx;
        color: var(--text-tertiary);
        margin-left: 8rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }
    }

    .hall-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      margin-bottom: 16rpx;

      .tag-item {
        padding: 6rpx 14rpx;
        background: var(--bg-secondary);
        border-radius: 8rpx;
        font-size: 22rpx;
        color: var(--text-secondary);
      }
    }

    .hall-promo {
      display: flex;
      align-items: center;
      margin-bottom: 16rpx;
      padding: 12rpx 16rpx;
      background: rgba(0, 187, 136, 0.1);
      border-radius: 12rpx;

      .promo-text {
        font-size: 24rpx;
        color: #00BB88;
        margin-left: 8rpx;
      }
    }

    .hall-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16rpx;
      margin-top: 8rpx;

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6rpx;
        padding: 12rpx 24rpx;
        border-radius: 24rpx;
        font-size: 24rpx;

        &.secondary {
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }

        &.primary {
          background: #00BB88;
          color: #fff;
          font-weight: 500;
          padding: 12rpx 32rpx;
        }
      }
    }
  }
}
</style>
