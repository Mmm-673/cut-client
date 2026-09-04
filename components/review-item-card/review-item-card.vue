<template>
  <view class="review-item">
    <view class="review-header">
      <image class="review-avatar" :src="review.avatar || '/static/default-avatar.png'" mode="aspectFill" lazy-load></image>
      <view class="review-user">
        <text class="review-name">{{ review.name || '匿名用户' }}</text>
        <view class="review-stars">
          <uni-icons type="star-filled" size="12" color="#ffc107" v-for="n in displayRating" :key="n"></uni-icons>
        </view>
      </view>
      <text class="review-time">{{ review.time }}</text>
    </view>
    <view class="review-content">{{ review.content }}</view>
    <view class="review-images" v-if="reviewImages.length > 0">
      <image
        class="review-image"
        v-for="(img, imgIndex) in displayImages"
        :key="imgIndex"
        :src="img"
        mode="aspectFill"
        lazy-load
        @click.stop="handleImageClick(imgIndex)"
      ></image>
      <view class="review-image-more" v-if="hasMoreImages" @click.stop="handleImageClick(0)">
        <text>+{{ reviewImages.length - 3 }}</text>
      </view>
    </view>
    <view class="review-tags" v-if="review.tags && review.tags.length > 0">
      <view class="tag small" v-for="(tag, tagIndex) in review.tags" :key="tagIndex">{{ tag }}</view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  review: {
    type: Object,
    default: () => ({})
  },
  maxImages: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['image-click'])

const reviewImages = computed(() => {
  return props.review.images || []
})

const displayImages = computed(() => {
  return reviewImages.value.slice(0, props.maxImages)
})

const hasMoreImages = computed(() => {
  return reviewImages.value.length > props.maxImages
})

const displayRating = computed(() => {
  return Math.min(5, Math.max(0, props.review.rating || 0))
})

const handleImageClick = (index) => {
  emit('image-click', { review: props.review, index })
}
</script>

<style lang="scss" scoped>
.review-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  .review-header {
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;

    .review-avatar {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .review-user {
      flex: 1;
      margin-left: 12rpx;

      .review-name {
        font-size: 26rpx;
        color: var(--text-primary);
        font-weight: 500;
        display: block;
        margin-bottom: 4rpx;
      }

      .review-stars {
        display: flex;
        gap: 2rpx;
      }
    }

    .review-time {
      font-size: 22rpx;
      color: var(--text-tertiary);
      flex-shrink: 0;
    }
  }

  .review-content {
    font-size: 26rpx;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 12rpx;
  }

  .review-images {
    display: flex;
    gap: 10rpx;
    margin-bottom: 12rpx;
    position: relative;

    .review-image {
      width: 140rpx;
      height: 140rpx;
      border-radius: 8rpx;
      flex-shrink: 0;
    }

    .review-image-more {
      width: 140rpx;
      height: 140rpx;
      border-radius: 8rpx;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 28rpx;
      font-weight: 500;
      flex-shrink: 0;
    }
  }

  .review-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;

    .tag.small {
      font-size: 20rpx;
      padding: 2rpx 10rpx;
      border-radius: 4rpx;
      background: rgba(0, 212, 170, 0.1);
      color: #00d4aa;
    }
  }
}
</style>
