<template>
  <view class="func-card menu-card">
    <view
        class="menu-item"
        v-for="item in menuList"
        :key="item.key"
        @click="handleItemClick(item)"
        >
      <view class="menu-icon" :style="{background: item.bgColor}">
        <uni-icons :type="item.icon" size="22" :color="item.color" />
      </view>
      <text class="menu-title">{{ item.title }}</text>
      <view
          v-if="badgeMap[item.key] && badgeMap[item.key] > 0"
          class="menu-badge"
      >
        {{ badgeMap[item.key] > 99 ? '99+' : badgeMap[item.key] }}
      </view>
      <uni-icons type="right" size="18" color="#9CA3AF" />
    </view>
  </view>
</template>

<script setup>
defineProps({
  menuList: {
    type: Array,
    default: () => []
  },
  badgeMap: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['itemClick'])

const handleItemClick = (item) => {
  emit('itemClick', item)
}
</script>

<style lang="scss" scoped>
.func-card {
  margin: 0 30rpx 30rpx;
  background: var(--bg-card);
  border-radius: 24rpx;
  box-shadow: var(--card-shadow);
  border: 1rpx solid var(--border-color);
}

.menu-card {
  padding: 0 !important;

  .menu-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 28rpx 30rpx;
    border-bottom: 1rpx solid var(--border-color);

    &:last-child {
      border-bottom: none;
    }

    .menu-icon {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .menu-title {
      flex: 1;
      color: var(--text-primary);
      font-size: 30rpx;
      font-weight: 500;
    }

    .menu-badge {
      min-width: 36rpx;
      height: 36rpx;
      padding: 0 10rpx;
      background-color: #ff4d4f;
      color: #fff;
      font-size: 22rpx;
      border-radius: 18rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      margin-left: auto;
    }
  }
}
</style>
