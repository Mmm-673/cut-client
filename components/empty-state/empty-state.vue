<template>
  <view class="empty-state">
    <uni-icons :type="icon" :size="iconSize" :color="iconColor"></uni-icons>
    <text class="empty-text">{{ text }}</text>
    <slot v-if="$slots.default" />
  </view>
</template>

<script setup>
/**
 * 通用空状态组件
 * @property {string} icon - uni-icons 图标名，默认 info
 * @property {string} text - 空状态文案，默认 "暂无数据"
 * @property {number} iconSize - 图标大小，默认 120
 * @property {string} iconColor - 图标颜色，默认 #9CA3AF
 */
const props = defineProps({
  icon: {
    type: String,
    default: 'info',
  },
  text: {
    type: String,
    default: '暂无数据',
  },
  iconSize: {
    type: Number,
    default: 120,
  },
  iconColor: {
    type: String,
    default: '#9CA3AF',
  },
})
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;

  .empty-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: #9CA3AF;
  }
}
</style>
