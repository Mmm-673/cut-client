<template>
  <view class="banner-section">
    <swiper
        class="banner-swiper"
        indicator-dots
        autoplay
        circular
        :interval="interval"
        :duration="duration"
        easing-function="easeInOutCubic"
        indicator-active-color="#00BB88"
    >
      <swiper-item v-for="(item, index) in banners" :key="index" @click="handleClick(item)">
        <view class="banner-card">
          <image class="banner-img" :src="item.imageUrl" mode="aspectFill"></image>
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup>
defineProps({
  banners: {
    type: Array,
    default: () => []
  },
  interval: {
    type: Number,
    default: 3500
  },
  duration: {
    type: Number,
    default: 400
  }
})

const emit = defineEmits(['itemClick'])

const handleClick = (item) => {
  emit('itemClick', item)
}
</script>

<style lang="scss" scoped>
.banner-section {
  margin: 0 30rpx 50rpx;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.3);

  .banner-swiper {
    height: 360rpx;
    border-radius: 32rpx;
    overflow: hidden;

    .banner-card {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #2a3338;
      border-radius: 32rpx;
    }
    .banner-img {
      width: 100%;
      height: 100%;
      transition: transform 0.4s ease;
    }
  }
}
</style>
