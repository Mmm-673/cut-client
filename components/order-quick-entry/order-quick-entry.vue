<template>
  <view class="func-card">
    <view class="card-header">
      <text class="card-title">我的订单</text>
      <text class="view-more" @click="handleViewAll">
        查看全部
        <uni-icons type="right" size="14" color="#9CA3AF" />
      </text>
    </view>

    <!-- 订单分类标签 -->
    <view class="order-tabs">
      <view
          class="tab-item"
          :class="{active: activeTab === tab.value}"
          v-for="tab in tabs"
          :key="tab.value"
          @click="handleTabChange(tab.value)"
          >
        <view class="tab-icon" :style="{color: tab.color}">
          <uni-icons :type="tab.icon" size="24" :color="tab.color" />
          <text class="badge" v-if="tab.hasBadge"></text>
        </view>
        <text :style="{color: activeTab === tab.value ? tab.color : '#9CA3AF'}">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 订单列表 -->
    <view class="order-list">
      <view
          class="order-card"
          v-for="order in orders"
          :key="order.key"
          @click="handleOrderClick(order)"
          >
        <view class="order-left">
          <image class="coach-avatar" :src="order.coachAvatar" mode="aspectFill" lazy-load></image>
          <view class="order-info">
            <view class="order-title-row">
              <text class="order-title">{{ order.coachName }} · {{ order.coachLevel }}</text>
              <text
                class="order-type-tag"
                :class="order.type === 2 ? 'onsite' : 'normal'"
              >
                {{ order.type === 2 ? '现场订单' : '普通订单' }}
              </text>
            </view>
            <view class="order-subtitle">{{ order.serviceName }} · {{ order.duration }}小时</view>
            <view class="order-time">{{ order.time }}</view>
          </view>
        </view>
        <view class="order-right">
          <text class="order-status" :style="{background: order.statusColor}">{{ order.statusText }}</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-tip" v-if="orders.length === 0">
        {{ emptyText }}
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    default: () => []
  },
  activeTab: {
    type: [Number, String],
    default: 0
  },
  orders: {
    type: Array,
    default: () => []
  },
  emptyText: {
    type: String,
    default: '暂无对应订单'
  }
})

const emit = defineEmits(['tabChange', 'viewAll', 'orderClick'])

const handleTabChange = (value) => emit('tabChange', value)
const handleViewAll = () => emit('viewAll')
const handleOrderClick = (order) => emit('orderClick', order)
</script>

<style lang="scss" scoped>
.func-card {
  margin: 0 30rpx 30rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: var(--card-shadow);
  border: 1rpx solid var(--border-color);
  transition: all 0.3s ease;
  transform: translateY(0);

  &:active {
    transform: translateY(2rpx);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .card-title {
      color: var(--text-primary);
      font-size: 32rpx;
      font-weight: 600;
    }

    .view-more {
      color: var(--text-secondary);
      font-size: 26rpx;
      display: flex;
      align-items: center;
      gap: 4rpx;
      transition: color 0.3s ease;

      &:active {
        color: #00BB88;
      }
    }
  }
}

.order-tabs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding: 0 10rpx;

  .tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    flex: 1;

    .tab-icon {
      position: relative;
      width: 44rpx;
      height: 44rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .badge {
        position: absolute;
        top: 0;
        right: 0;
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
        background: #EF4444;
        border: 2rpx solid var(--bg-card);
      }
    }

    text {
      font-size: 26rpx;
      white-space: nowrap;
    }
  }
}

.order-list {
  .order-card {
    background: var(--bg-secondary);
    border-radius: 20rpx;
    padding: 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .order-left {
      display: flex;
      align-items: center;
      gap: 16rpx;
      flex: 1;
      min-width: 0;

      .coach-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 12rpx;
        flex-shrink: 0;
      }

      .order-info {
        flex: 1;
        min-width: 0;

        .order-title-row {
          display: flex;
          align-items: center;
          gap: 10rpx;
          margin-bottom: 8rpx;
          overflow: hidden;

          .order-title {
            color: var(--text-primary);
            font-size: 28rpx;
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex-shrink: 1;
            min-width: 0;
          }

          .order-type-tag {
            font-size: 20rpx;
            padding: 2rpx 10rpx;
            border-radius: 12rpx;
            font-weight: 500;
            flex-shrink: 0;
            line-height: 1.4;

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

        .order-subtitle {
          color: var(--text-secondary);
          font-size: 24rpx;
          margin-bottom: 12rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .order-time {
          color: var(--text-tertiary);
          font-size: 24rpx;
        }
      }
    }

    .order-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12rpx;
      flex-shrink: 0;
      margin-left: 16rpx;

      .order-status {
        padding: 4rpx 14rpx;
        border-radius: 8rpx;
        color: #fff;
        font-size: 24rpx;
        white-space: nowrap;
      }
    }
  }

  .empty-tip {
    text-align: center;
    color: var(--text-tertiary);
    font-size: 26rpx;
    padding: 60rpx 0 20rpx;
  }
}
</style>
