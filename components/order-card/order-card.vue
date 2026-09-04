<template>
  <view class="order-card">
    <!-- 订单头部 -->
    <view class="order-header">
      <view class="order-type">
        <text class="type-icon">{{ getServiceIcon(order.serviceType) }}</text>
        <text class="type-name">{{ getServiceTypeName(order.serviceType) }}</text>
        <text
          class="order-type-tag"
          :class="isOnsiteOrder ? 'onsite' : 'normal'"
        >
          {{ ORDER_TYPE_LABELS[order.type] || ORDER_TYPE_LABELS[ORDER_TYPE_NORMAL] }}
        </text>
      </view>
      <view class="order-status" :class="statusClass">
        {{ statusText }}
      </view>
    </view>

    <!-- 裁教信息 -->
    <view class="coach-section">
      <image class="coach-avatar" :src="coachAvatar || '/static/images/profile.jpg'" mode="aspectFill" lazy-load></image>
      <view class="coach-info">
        <text class="coach-name">{{ order.coachStageName }}</text>
        <text class="order-time">{{ timeLabel }}{{ bookingTimeText }}</text>
      </view>
      <uni-icons type="right" size="20" color="#9CA3AF" />
    </view>

    <!-- 服务地点 -->
    <view class="venue-section" v-if="!isOnsiteOrder && order.venueName">
      <text class="venue-label">{{ venueLabel }}</text>
      <text class="venue-name">{{ order.venueName }}</text>
      <text class="venue-address" v-if="order.venueAddress">{{ order.venueAddress }}</text>
    </view>

    <!-- 订单信息 -->
    <view class="order-info">
      <view class="info-item">
        <text class="info-label">时长</text>
        <text v-if="Number(order.type) === ORDER_TYPE_NORMAL" class="info-value">{{ order.serviceDuration }}分钟</text>
        <text v-else class="info-value">{{ durationText }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">订单号</text>
        <text class="info-value">{{ order.orderNo }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">下单时间</text>
        <text class="info-value">{{ createTimeText }}</text>
      </view>
    </view>

    <!-- 订单底部 -->
    <view class="order-footer">
      <view class="order-price">
        <text class="price-label">实付</text>
        <text class="price-unit">¥</text>
        <text class="price-num">{{ amountText }}</text>
      </view>
      <view class="order-actions">
        <button
          v-if="showCancelBtn"
          class="action-btn cancel"
          @click.stop="$emit('cancel', order)"
        >
          取消订单
        </button>
        <button
          v-if="showPayBtn"
          class="action-btn pay-now"
          @click.stop="$emit('pay', order)"
        >
          去支付
        </button>
        <button
          v-if="showReviewBtn"
          class="action-btn review"
          @click.stop="$emit('review', order)"
        >
          去评价
        </button>
        <button
          v-if="showBookAgainBtn"
          class="action-btn book-again"
          @click.stop="$emit('bookAgain', order)"
        >
          再约一次
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { ORDER_STATUS, getStatusText, canCancelOrder } from '@/constants/orderStatus'
import { SERVICE_TYPE, getServiceTypeName } from '@/constants/serviceType'
import { formatDuration, formatAmount, formatDate, formatShortTime } from '@/utils/format'

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
})

defineEmits(['click', 'cancel', 'delete', 'review', 'pay', 'bookAgain'])

// 订单类型常量
const ORDER_TYPE_NORMAL = 1
const ORDER_TYPE_ONSITE = 2

const ORDER_TYPE_LABELS = {
  [ORDER_TYPE_NORMAL]: '普通订单',
  [ORDER_TYPE_ONSITE]: '现场订单',
}

// 状态样式映射
const STATUS_CLASS_MAP = {
  [ORDER_STATUS.PENDING_PAYMENT]: 'pending',
  [ORDER_STATUS.PENDING_ACCEPT]: 'pending-accept',
  [ORDER_STATUS.ACCEPTED]: 'accepted',
  [ORDER_STATUS.IN_SERVICE]: 'ongoing',
  [ORDER_STATUS.PENDING_SETTLEMENT]: 'pending',
  [ORDER_STATUS.PENDING_REVIEW]: 'to-review',
  [ORDER_STATUS.COMPLETED]: 'completed',
  [ORDER_STATUS.CANCELLED]: 'cancelled',
}

// 计算属性
const isOnsiteOrder = computed(() => Number(props.order.type) === ORDER_TYPE_ONSITE)

const statusText = computed(() => getStatusText(props.order.status))

const statusClass = computed(() => STATUS_CLASS_MAP[props.order.status] || '')

const coachAvatar = computed(() => {
  if (isOnsiteOrder.value) {
    return props.order.coachMainPhoto || props.order.coachAvatar
  }
  return props.order.coachAvatar || props.order.coachMainPhoto
})

const timeLabel = computed(() => (isOnsiteOrder.value ? '开始时间：' : '预约时间：'))

const bookingTimeText = computed(() => {
  const time = isOnsiteOrder.value ? props.order.startTime : props.order.bookingTime
  return formatShortTime(time)
})

const venueLabel = computed(() => {
  return Number(props.order.serviceType) === SERVICE_TYPE.BILLIARD_COACH ? '球厅' : '服务地点'
})

const durationText = computed(() => formatDuration(props.order.billingMinutes))

const createTimeText = computed(() => formatDate(props.order.createTime))

const amountText = computed(() => formatAmount(props.order.totalAmount))

const showCancelBtn = computed(() => !isOnsiteOrder.value && canCancelOrder(Number(props.order.status)))

const showPayBtn = computed(() => isOnsiteOrder.value && Number(props.order.status) === ORDER_STATUS.PENDING_SETTLEMENT)

const showReviewBtn = computed(() => Number(props.order.status) === ORDER_STATUS.PENDING_REVIEW)

const showBookAgainBtn = computed(() => !isOnsiteOrder.value && Number(props.order.status) === ORDER_STATUS.COMPLETED)

// 服务图标
const getServiceIcon = (type) => {
  if (type === 1) return '🎱'
  if (type === 2) return '🌆'
  if (type === 3) return '🍷'
  if (type === 4) return '🎬'
  return '🎱'
}
</script>

<style lang="scss" scoped>
.order-card {
  padding: 24rpx;
}

/* 订单头部 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  .order-type {
    display: flex;
    align-items: center;
    gap: 12rpx;
    .type-icon {
      font-size: 36rpx;
    }
    .type-name {
      color: var(--text-primary);
      font-size: 30rpx;
      font-weight: 500;
    }
    .order-type-tag {
      font-size: 22rpx;
      padding: 4rpx 14rpx;
      border-radius: 16rpx;
      font-weight: 500;
      &.normal {
        background: rgba(0, 187, 136, 0.15);
        color: var(--brand-primary, #00BB88);
      }
      &.onsite {
        background: rgba(245, 166, 35, 0.15);
        color: #f5a623;
      }
    }
  }
  .order-status {
    font-size: 26rpx;
    padding: 8rpx 20rpx;
    border-radius: 20rpx;
    &.pending {
      background: rgba(255, 149, 0, 0.15);
      color: #EA7C00;
    }
    &.pending-accept {
      background: rgba(59, 130, 246, 0.15);
      color: #2563EB;
    }
    &.accepted {
      background: rgba(59, 130, 246, 0.15);
      color: #2563EB;
    }
    &.ongoing {
      background: rgba(59, 130, 246, 0.15);
      color: #2563EB;
    }
    &.to-review {
      background: rgba(245, 158, 11, 0.15);
      color: #D97706;
    }
    &.completed {
      background: rgba(0, 187, 136, 0.15);
      color: #059669;
    }
    &.cancelled {
      background: rgba(107, 114, 128, 0.15);
      color: #4B5563;
    }
  }
}

/* 裁教信息 */
.coach-section {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-top: 1rpx solid var(--border-color);
  border-bottom: 1rpx solid var(--border-color);
  .coach-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 16rpx;
    margin-right: 16rpx;
  }
  .coach-info {
    flex: 1;
    .coach-name {
      color: var(--text-primary);
      font-size: 30rpx;
      font-weight: 500;
      display: block;
      margin-bottom: 8rpx;
    }
    .order-time {
      color: var(--text-secondary);
      font-size: 24rpx;
    }
  }
}

/* 服务地点 */
.venue-section {
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border-color);
  .venue-label {
    color: var(--text-secondary);
    font-size: 24rpx;
    display: block;
    margin-bottom: 8rpx;
  }
  .venue-name {
    color: var(--text-primary);
    font-size: 28rpx;
    font-weight: 500;
    display: block;
    margin-bottom: 4rpx;
  }
  .venue-address {
    color: var(--text-secondary);
    font-size: 24rpx;
  }
}

/* 订单信息 */
.order-info {
  padding: 20rpx 0;
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 8rpx 0;
    .info-label {
      color: var(--text-secondary);
      font-size: 26rpx;
    }
    .info-value {
      color: var(--text-primary);
      font-size: 26rpx;
    }
  }
}

/* 订单底部 */
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid var(--border-color);
  .order-price {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
    .price-label {
      color: var(--text-secondary);
      font-size: 26rpx;
    }
    .price-unit {
      color: #00BB88;
      font-size: 26rpx;
    }
    .price-num {
      color: #00BB88;
      font-size: 36rpx;
      font-weight: bold;
    }
  }
  .order-actions {
    display: flex;
    gap: 12rpx;
    flex-wrap: wrap;
    .action-btn {
      padding: 12rpx 24rpx;
      font-size: 24rpx;
      border-radius: 28rpx;
      border: none;
      line-height: 1.2;
      &::after { border: none; }
      &.cancel {
        background: rgba(107, 114, 128, 0.2);
        color: var(--text-secondary);
      }
      &.review {
        background: rgba(245, 158, 11, 0.2);
        color: #F59E0B;
      }
      &.pay-now {
        background: #f5a623;
        color: var(--text-primary);
      }
      &.book-again {
        background: #00BB88;
        color: var(--text-primary);
      }
    }
  }
}
</style>
