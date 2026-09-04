<template>
  <view class="review-section">
    <view class="section-title">
      <uni-icons type="star" size="18" color="#00c896"></uni-icons>
      <text>用户评价 ({{ reviews.length }})</text>
      <text class="rating-text" v-if="rating">{{ rating }}分</text>
    </view>

    <!-- 默认显示前 N 条 -->
    <view class="review-list" v-if="!showAll">
      <review-item-card
          v-for="(review, index) in displayReviews"
          :key="review.id || index"
          :review="review"
          @image-click="(data) => handleImageClick(index, data)"
      />
    </view>

    <!-- 展开显示全部（可滚动） -->
    <scroll-view
      class="review-list-scroll"
      scroll-y="true"
      v-else
      :style="{ height: scrollHeight }"
    >
      <review-item-card
          v-for="(review, index) in reviews"
          :key="review.id || index"
          :review="review"
          @image-click="(data) => handleImageClick(index, data)"
      />
    </scroll-view>

    <view class="more-reviews" @click="toggleShowAll" v-if="reviews.length > defaultShowCount">
      <text>{{ showAll ? '收起评价' : '查看全部' + reviews.length + '条评价' }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import ReviewItemCard from '@/components/review-item-card/review-item-card.vue'

const props = defineProps({
  reviews: {
    type: Array,
    default: () => []
  },
  rating: {
    type: [Number, String],
    default: ''
  },
  defaultShowCount: {
    type: Number,
    default: 2
  },
  scrollHeight: {
    type: String,
    default: '600rpx'
  }
})

const emit = defineEmits(['image-click'])

const showAll = ref(false)

const displayReviews = computed(() => {
  return props.reviews.slice(0, props.defaultShowCount)
})

function toggleShowAll() {
  showAll.value = !showAll.value
}

function handleImageClick(reviewIndex, data) {
  emit('image-click', { reviewIndex, ...data })
}
</script>

<style lang="scss" scoped>
.review-section {
  padding: 48rpx 40rpx;

  .section-title {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 32rpx;
    font-size: 36rpx;
    font-weight: 600;
    color: var(--text-primary);

    .rating-text {
      margin-left: auto;
      font-size: 32rpx;
      font-weight: 600;
      color: #ffc107;
    }
  }

  .review-list {
    display: flex;
    flex-direction: column;
    gap: 32rpx;
  }

  .review-list-scroll {
    display: flex;
    flex-direction: column;
    gap: 32rpx;
  }

  .more-reviews {
    margin-top: 32rpx;
    text-align: center;
    font-size: 28rpx;
    color: var(--brand-primary);
  }
}
</style>
