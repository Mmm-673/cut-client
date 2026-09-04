<template>
  <view class="coach-list-card" @click="handleClick">
    <view class="coach-avatar">
      <image :src="coach.avatar || coach.mainPhotoUrl || '/static/default-avatar.png'" mode="aspectFill"
             class="avatar-img" lazy-load></image>
    </view>

    <view class="coach-info">
      <view class="info-top">
        <view class="name-row">
          <text class="coach-name">{{ coach.stageName || coach.name }}</text>
          <view class="level-tag" :class="levelClass">
            {{ levelText }}
          </view>
          <view v-if="isNewCoach" class="new-tag">新人</view>
        </view>
        <view class="right-info">
          <view class="service-status-dot" :class="coach.serviceStatus === 0 ? 'status-idle' : 'status-busy'"></view>
          <text class="service-status-text">{{ coach.serviceStatus === 0 ? '空闲' : '服务中' }}</text>
          <text class="distance">{{ distanceText }}</text>
        </view>
      </view>

      <view class="rating-row">
        <uni-icons type="star-filled" size="14" color="#FFD700"></uni-icons>
        <text class="rating">评分: {{ coach.overallScore }}</text>
        <text class="review-count">({{ coach.serviceCount || coach.reviewCount || 0 }}单)</text>
      </view>

      <view class="desc-row">
        <text class="coach-desc">星座：{{ coach.constellation || '白羊座' }}</text>
        <view class="coach-tags">
          <view
              v-for="(tag, tagIndex) in displayTags"
              :key="tagIndex"
              class="coach-tag"
              :class="getTagClass(tag)"
          >{{ tag }}
          </view>
        </view>
      </view>

      <view class="bottom-row">
        <view class="price-row">
          <text class="price-symbol">¥</text>
          <text class="price">{{ displayPrice }}</text>
          <text class="price-unit">/{{ priceUnit }}起</text>
        </view>
        <view class="action-buttons">
          <!-- #ifndef MP-WEIXIN -->
            <button class="reward-btn" v-if="showReward" @click.stop="handleReward">
              <uni-icons type="gift" size="14" color="#FF9500"></uni-icons>
              <text>心意</text>
            </button>
          <!-- #endif -->
          <button
            class="book-btn"
            :class="{ disabled: coach.serviceStatus === 1 }"
            :disabled="coach.serviceStatus === 1"
            @click.stop="handleBook">
            {{ coach.serviceStatus === 1 ? '服务中' : '预约' }}
          </button>
        </view>
      </view>
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
    default: false
  }
})

const emit = defineEmits(['click', 'book', 'reward'])

// 等级映射
const levelMap = {
  0: { text: '初级', class: 'junior' },
  1: { text: '中级', class: 'middle' },
  2: { text: '高级', class: 'senior' },
  3: { text: '星级', class: 'star' }
}

const levelText = computed(() => {
  if (typeof props.coach.level === 'string') {
    return props.coach.level
  }
  return levelMap[props.coach.level]?.text || '初级'
})

const levelClass = computed(() => {
  if (typeof props.coach.level === 'string') {
    return props.coach.level === '高级' ? 'senior' : 'middle'
  }
  return levelMap[props.coach.level]?.class || 'junior'
})

const isNewCoach = computed(() => {
  return props.coach.tags && props.coach.tags.includes('新人')
})

const displayTags = computed(() => {
  return (props.coach.tags || []).filter(t => t !== '新人' && t !== '活跃' && t !== '沉稳')
})

const distanceText = computed(() => {
  const dist = props.coach.distance
  if (dist === null || dist === undefined || dist === '') return ''
  if (typeof dist === 'number') {
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`
  }
  return dist
})

const displayPrice = computed(() => {
  const price = props.coach.displayPrice || props.coach.price || 0
  return typeof price === 'number' ? price.toFixed(0) : price
})

const priceUnit = computed(() => {
  return props.coach.priceUnit || '小时'
})

// 标签颜色映射
const tagClassMap = {
  '新人': 'tag-new',
  '低碳出行': 'tag-free-travel',
  '斯诺克': 'tag-snooker',
  '中式八球': 'tag-eight-ball',
  '初级': 'tag-junior',
  '中级': 'tag-intermediate',
  '高级': 'tag-senior',
  '星级': 'tag-star'
}

const randomTagColors = [
  'tag-random-1', 'tag-random-2', 'tag-random-3', 'tag-random-4',
  'tag-random-5', 'tag-random-6', 'tag-random-7', 'tag-random-8'
]

const hashTag = (tag) => {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    const char = tag.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

const getTagClass = (tag) => {
  if (tagClassMap[tag]) return tagClassMap[tag]
  const hash = hashTag(tag)
  const colorIndex = hash % randomTagColors.length
  return randomTagColors[colorIndex]
}

const handleClick = () => emit('click', props.coach)
const handleBook = () => emit('book', props.coach)
const handleReward = () => emit('reward', props.coach)
</script>

<style lang="scss" scoped>
.coach-list-card {
  display: flex;
  background-color: var(--bg-card);
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;

  .coach-avatar .avatar-img {
    width: 140rpx;
    height: 140rpx;
    border-radius: 12rpx;
  }

  .coach-info {
    flex: 1;
    margin-left: 16rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .info-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .name-row {
        display: flex;
        align-items: center;
        gap: 8rpx;
        flex-wrap: wrap;

        .coach-name {
          font-size: 28rpx;
          color: var(--text-primary);
          font-weight: bold;
        }

        .level-tag {
          font-size: 18rpx;
          padding: 2rpx 8rpx;
          border-radius: 4rpx;

          &.senior {
            background: rgba(0, 212, 170, 0.2);
            color: #00d4aa;
          }

          &.middle {
            background: rgba(255, 149, 0, 0.2);
            color: #FF9500;
          }

          &.junior {
            background: rgba(102, 102, 102, 0.2);
            color: #999;
          }

          &.star {
            background: rgba(255, 215, 0, 0.2);
            color: #FFD700;
          }
        }

        .new-tag {
          font-size: 18rpx;
          background: #FF3B30;
          color: #fff;
          padding: 2rpx 8rpx;
          border-radius: 4rpx;
        }
      }

      .right-info {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8rpx;
      }

      .service-status-dot {
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
      }

      .service-status-dot.status-idle {
        background-color: #00d4aa;
        box-shadow: 0 0 8rpx rgba(0, 212, 170, 0.6);
      }

      .service-status-dot.status-busy {
        background-color: #f5a623;
        box-shadow: 0 0 8rpx rgba(245, 166, 35, 0.6);
      }

      .service-status-text {
        font-size: 20rpx;
        color: var(--text-tertiary);
      }

      .distance {
        font-size: 22rpx;
        color: var(--text-tertiary);
      }
    }

    .rating-row {
      display: flex;
      align-items: center;
      margin: 8rpx 0;

      .rating {
        color: var(--star-color, #FFD700);
        font-size: 24rpx;
        margin: 0 6rpx;
      }

      .review-count {
        color: var(--text-tertiary);
        font-size: 22rpx;
      }
    }

    .desc-row {
      display: flex;

      .coach-tags {
        display: flex;
        align-items: center;
        gap: 6rpx;
        margin-left: 8rpx;
        flex-wrap: wrap;

        .coach-tag {
          font-size: 18rpx;
          padding: 0 8rpx;
          border-radius: 4rpx;
          white-space: nowrap;

          &.tag-new {
            background: rgba(255, 59, 48, 0.15);
            color: #FF3B30;
            border: 1rpx solid rgba(255, 59, 48, 0.3);
          }

          &.tag-free-travel {
            background: rgba(0, 212, 170, 0.15);
            color: #00d4aa;
            border: 1rpx solid rgba(0, 212, 170, 0.3);
          }

          &.tag-snooker {
            background: rgba(255, 59, 48, 0.15);
            color: #FF3B30;
            border: 1rpx solid rgba(255, 59, 48, 0.3);
          }

          &.tag-eight-ball {
            background: rgba(0, 122, 255, 0.15);
            color: #007AFF;
            border: 1rpx solid rgba(0, 122, 255, 0.3);
          }

          &.tag-junior {
            background: rgba(102, 102, 102, 0.15);
            color: #999;
            border: 1rpx solid rgba(102, 102, 102, 0.3);
          }

          &.tag-intermediate {
            background: rgba(255, 149, 0, 0.15);
            color: #FF9500;
            border: 1rpx solid rgba(255, 149, 0, 0.3);
          }

          &.tag-senior {
            background: rgba(0, 212, 170, 0.15);
            color: #00d4aa;
            border: 1rpx solid rgba(0, 212, 170, 0.3);
          }

          &.tag-star {
            background: rgba(255, 215, 0, 0.15);
            color: #FFD700;
            border: 1rpx solid rgba(255, 215, 0, 0.3);
          }

          &.tag-default {
            background: rgba(102, 102, 102, 0.15);
            color: #999;
            border: 1rpx solid rgba(102, 102, 102, 0.3);
          }

          &.tag-random-1 {
            background: rgba(255, 59, 48, 0.15);
            color: #FF3B30;
            border: 1rpx solid rgba(255, 59, 48, 0.3);
          }
          &.tag-random-2 {
            background: rgba(255, 149, 0, 0.15);
            color: #FF9500;
            border: 1rpx solid rgba(255, 149, 0, 0.3);
          }
          &.tag-random-3 {
            background: rgba(255, 204, 0, 0.15);
            color: #FFCC00;
            border: 1rpx solid rgba(255, 204, 0, 0.3);
          }
          &.tag-random-4 {
            background: rgba(52, 199, 89, 0.15);
            color: #34C759;
            border: 1rpx solid rgba(52, 199, 89, 0.3);
          }
          &.tag-random-5 {
            background: rgba(0, 212, 170, 0.15);
            color: #00d4aa;
            border: 1rpx solid rgba(0, 212, 170, 0.3);
          }
          &.tag-random-6 {
            background: rgba(0, 122, 255, 0.15);
            color: #007AFF;
            border: 1rpx solid rgba(0, 122, 255, 0.3);
          }
          &.tag-random-7 {
            background: rgba(88, 86, 214, 0.15);
            color: #5856D6;
            border: 1rpx solid rgba(88, 86, 214, 0.3);
          }
          &.tag-random-8 {
            background: rgba(175, 82, 222, 0.15);
            color: #AF52DE;
            border: 1rpx solid rgba(175, 82, 222, 0.3);
          }
        }
      }
    }

    .desc-row .coach-desc {
      font-size: 22rpx;
      color: var(--text-tertiary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8rpx;

      .price-row {
        .price-symbol {
          color: #00d4aa;
          font-size: 22rpx;
        }

        .price {
          color: #00d4aa;
          font-size: 30rpx;
          font-weight: bold;
        }

        .price-unit {
          color: var(--text-tertiary);
          font-size: 20rpx;
        }
      }

      .action-buttons {
        display: flex;
        gap: 8rpx;

        button {
          border: none;
          font-size: 22rpx;
          border-radius: 24rpx;
          padding: 0 20rpx;
          height: 48rpx;
          line-height: 48rpx;
        }

        .reward-btn {
          background: var(--bg-secondary);
          color: #FF9500;
          display: flex;
          align-items: center;
          gap: 4rpx;
        }

        .book-btn {
          background: #00d4aa;
          color: #fff;

          &.disabled {
            background: var(--bg-secondary);
            color: var(--text-tertiary);
          }
        }
      }
    }
  }
}
</style>
