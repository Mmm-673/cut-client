<template>
  <view class="order-action-bar" v-if="showBar">
    <!-- 待付款：取消 + 去支付 -->
    <template v-if="orderStatus === 10">
      <button class="action-btn cancel" @click="handleCancel">取消订单</button>
      <button class="action-btn pay" @click="handlePay">去支付</button>
    </template>

    <!-- 待接单：取消 -->
    <template v-else-if="orderStatus === 20">
      <button class="action-btn cancel" @click="handleCancel">取消订单</button>
    </template>

    <!-- 已接单：取消 + 联系教练 -->
    <template v-else-if="orderStatus === 30">
      <button class="action-btn cancel" @click="handleCancel">取消订单</button>
      <button class="action-btn contact" @click="handleContact">
        <uni-icons type="phone" size="18" color="#00BB88" />
        联系教练
      </button>
    </template>

    <!-- 进行中（非固定价）：加钟 -->
    <template v-else-if="orderStatus === 40 && !isFixedOrder">
      <button class="action-btn add-time" @click="handleAddTime">加钟</button>
    </template>

    <!-- 待评价：心意表示 + 去评价 -->
    <template v-else-if="orderStatus === 50">
      <!-- #ifndef MP-WEIXIN -->
      <button v-if="showRewardBtn" class="action-btn reward" @click="handleReward">
        <uni-icons type="gift" size="18" color="#FF9500" />
        心意表示
      </button>
      <!-- #endif -->
      <button class="action-btn review" @click="handleReview">去评价</button>
    </template>

    <!-- 已完成：再来一单 -->
    <template v-else-if="orderStatus === 60">
      <button class="action-btn book-again" @click="handleRebook">再来一单</button>
    </template>

    <!-- 已取消：删除 + 再来一单 -->
    <template v-else-if="orderStatus === 70">
      <button class="action-btn delete" @click="handleDelete">删除订单</button>
      <button class="action-btn book-again" @click="handleRebook">再来一单</button>
    </template>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  orderStatus: {
    type: Number,
    default: 0
  },
  isFixedOrder: {
    type: Boolean,
    default: false
  },
  showRewardBtn: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cancel', 'pay', 'contact', 'add-time', 'reward', 'review', 'rebook', 'delete'])

const showBar = computed(() => {
  const status = props.orderStatus
  // 80（退款中）不显示操作栏
  if (status === 80) return false
  // 进行中且固定价不显示
  if (status === 40 && props.isFixedOrder) return false
  return [10, 20, 30, 40, 50, 60, 70].includes(status)
})

const handleCancel = () => emit('cancel')
const handlePay = () => emit('pay')
const handleContact = () => emit('contact')
const handleAddTime = () => emit('add-time')
const handleReward = () => emit('reward')
const handleReview = () => emit('review')
const handleRebook = () => emit('rebook')
const handleDelete = () => emit('delete')
</script>

<style lang="scss" scoped>
.order-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--bg-card);
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  z-index: 100;

  .action-btn {
    flex: 1;
    height: 72rpx;
    line-height: 72rpx;
    border-radius: 36rpx;
    font-size: 26rpx;
    font-weight: 500;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;

    &::after {
      border: none;
    }

    &.cancel {
      background: rgba(107, 114, 128, 0.2);
      color: var(--text-secondary);
    }

    &.pay {
      background: #00BB88;
      color: #fff;
    }

    &.contact {
      background: rgba(0, 187, 136, 0.2);
      color: #00BB88;
    }

    &.add-time {
      background: #00BB88;
      color: #fff;
    }

    &.reward {
      background: rgba(255, 149, 0, 0.2);
      color: #FF9500;
    }

    &.review {
      background: rgba(245, 158, 11, 0.2);
      color: #F59E0B;
    }

    &.book-again {
      background: #00BB88;
      color: #fff;
    }

    &.delete {
      background: rgba(239, 68, 68, 0.2);
      color: #EF4444;
    }
  }
}
</style>
