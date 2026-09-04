<template>
  <view class="service-item" :class="{selected: isSelected}">
    <view class="service-main">
      <view class="service-name-row">
        <text class="service-icon">{{ serviceIcon }}</text>
        <text class="service-name">{{ service.name }}</text>
        <view class="tag hot" v-if="service.hot">热销</view>
      </view>
      <view class="service-desc">{{ service.desc }}</view>
      <view class="service-bottom">
        <view class="service-sales">已售{{ service.sales }}单</view>
        <view class="service-action">
          <view class="service-price">
            <template v-if="service.price != null">
              <text class="price-symbol">¥</text>
              <text class="price">{{ displayPrice }}</text>
              <text class="price-unit">/{{ priceUnitText }}</text>
            </template>
            <text v-else class="price-none">暂无报价</text>
          </view>
          <view
              class="select-btn"
              :class="{active: isSelected, disabled: !canBook}"
              @click.stop="handleSelect">
            {{ !canBook ? '暂不可约' : (isSelected ? '已选择' : '选择') }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { getPriceUnit } from '@/utils/pricing'

const props = defineProps({
  service: {
    type: Object,
    default: () => ({})
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  canBook: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['select'])

// 服务类型图标映射
const serviceIconMap = {
  1: '🎱',
  2: '🎮',
  3: '🍷',
  4: '🎬',
}

const serviceIcon = computed(() => {
  return serviceIconMap[props.service.type] || '🎱'
})

const displayPrice = computed(() => {
  if (props.service.price == null) return ''
  // 价格单位为分，转元
  return (props.service.price / 100).toFixed(2)
})

const priceUnitText = computed(() => {
  return getPriceUnit(props.service)
})

const handleSelect = () => {
  if (!props.canBook) return
  emit('select', props.service)
}
</script>

<style lang="scss" scoped>
.service-item {
  background: var(--bg-card);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;

  &.selected {
    border-color: #00d4aa;
    background: rgba(0, 212, 170, 0.05);
  }

  .service-main {
    width: 100%;
  }

  .service-name-row {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-bottom: 10rpx;

    .service-icon {
      font-size: 28rpx;
    }

    .service-name {
      font-size: 30rpx;
      font-weight: 600;
      color: var(--text-primary);
      flex: 1;
    }

    .tag.hot {
      font-size: 18rpx;
      background: linear-gradient(135deg, #ff6b6b, #ff4757);
      color: #fff;
      padding: 2rpx 10rpx;
      border-radius: 8rpx;
      flex-shrink: 0;
    }
  }

  .service-desc {
    font-size: 24rpx;
    color: var(--text-secondary);
    margin-bottom: 16rpx;
    line-height: 1.4;
  }

  .service-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .service-sales {
      font-size: 22rpx;
      color: var(--text-tertiary);
    }

    .service-action {
      display: flex;
      align-items: center;
      gap: 20rpx;
    }

    .service-price {
      display: flex;
      align-items: baseline;

      .price-symbol {
        font-size: 22rpx;
        color: #ff6b35;
        font-weight: 500;
      }

      .price {
        font-size: 32rpx;
        font-weight: 700;
        color: #ff6b35;
      }

      .price-unit {
        font-size: 20rpx;
        color: var(--text-tertiary);
        margin-left: 2rpx;
      }

      .price-none {
        font-size: 24rpx;
        color: var(--text-tertiary);
      }
    }

    .select-btn {
      padding: 8rpx 24rpx;
      border-radius: 24rpx;
      font-size: 24rpx;
      background: var(--bg-secondary);
      color: var(--text-secondary);
      transition: all 0.2s ease;

      &.active {
        background: #00d4aa;
        color: #fff;
      }

      &.disabled {
        opacity: 0.5;
        pointer-events: none;
      }
    }
  }
}
</style>
