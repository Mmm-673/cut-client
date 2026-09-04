<template>
  <scroll-view class="service-type-scroll" scroll-x="true" :show-scrollbar="false">
    <view class="service-type-list">
      <view
          v-for="item in tabs"
          :key="item.value"
          class="service-type-item"
          :class="{ active: activeValue === item.value }"
          @click="handleClick(item)"
      >
        {{ item.name }}
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
const props = defineProps({
  tabs: {
    type: Array,
    default: () => []
  },
  activeValue: {
    type: [String, Number, Boolean, null],
    default: null
  }
})

const emit = defineEmits(['update:activeValue', 'change'])

const handleClick = (item) => {
  emit('update:activeValue', item.value)
  emit('change', item.value)
}
</script>

<style lang="scss" scoped>
.service-type-scroll {
  white-space: nowrap;
  overflow-x: scroll;
  padding: 0 32rpx;
  box-sizing: border-box;

  .service-type-list {
    display: flex;
    padding: 10rpx 0 12rpx;

    .service-type-item {
      flex-shrink: 0;
      padding: 12rpx 32rpx;
      margin-right: 20rpx;
      border-radius: 40rpx;
      font-size: 26rpx;
      color: var(--text-secondary);
      background-color: var(--bg-secondary);
      transition: all 0.2s;

      &:last-child {
        margin-right: 0;
      }

      &.active {
        background-color: #00d4aa;
        color: #fff;
      }
    }
  }
}
</style>
