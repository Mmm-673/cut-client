<template>
  <view class="home-page">
    <!-- Custom Navbar -->
    <view class="home-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="home-navbar__left">
        <view class="home-navbar__logo">
          <text class="home-navbar__logo-text">8</text>
        </view>
        <view class="home-navbar__title-group">
          <text class="home-navbar__title">初球</text>
          <text class="home-navbar__subtitle">专业助教预约</text>
        </view>
      </view>
      <view class="home-navbar__right">
        <view class="home-navbar__icon-btn" @click="goSearch">
          <text class="home-navbar__icon">🔍</text>
        </view>
        <view class="home-navbar__icon-btn" @click="goNotice">
          <text class="home-navbar__icon">🔔</text>
        </view>
      </view>
    </view>

    <!-- Scrollable Content -->
    <scroll-view
      scroll-y
      class="home-scroll"
      :style="{ paddingTop: navbarHeight + 'px' }"
      @scroll="onScroll"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- Banner Section -->
      <view class="home-section">
        <swiper
          class="home-banner"
          indicator-dots
          autoplay
          circular
          :interval="3500"
          :duration="400"
          indicator-color="rgba(255,255,255,0.2)"
          indicator-active-color="#00BB88"
        >
          <swiper-item v-for="(item, i) in bannerList" :key="i">
            <view class="home-banner__item" @click="handleBannerClick(item)">
              <image class="home-banner__image" :src="item.img" mode="aspectFill" />
              <view class="home-banner__gradient"></view>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <!-- Service Grid -->
      <view class="home-section">
        <view class="home-service-grid">
          <view
            v-for="item in serviceList"
            :key="item.id"
            class="home-service-card"
            hover-class="home-service-card--active"
            @click="handleServiceClick(item)"
          >
            <view class="home-service-card__icon-wrap" :style="{ background: item.iconBg }">
              <text class="home-service-card__emoji">{{ item.icon }}</text>
            </view>
            <view class="home-service-card__content">
              <text class="home-service-card__title">{{ item.title }}</text>
              <view class="home-service-card__price">
                <text class="home-service-card__currency">¥</text>
                <text class="home-service-card__num" :style="{ color: item.priceColor }">{{ item.price }}</text>
                <text class="home-service-card__unit">/{{ item.unit }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Hot Coaches -->
      <view class="home-section">
        <view class="home-section-header">
          <view class="home-section-title">
            <view class="home-section-title__dot"></view>
            <text>热门助教</text>
          </view>
          <view class="home-section-more" @click="viewAllHotCoach">
            <text>全部</text>
            <text class="home-section-more__arrow">›</text>
          </view>
        </view>

        <scroll-view scroll-x class="home-horizontal-scroll" show-scrollbar="false">
          <view class="home-coach-list">
            <view v-if="loading" class="home-skeleton-card" v-for="i in 3" :key="i"></view>
            <template v-else>
              <ds-coach-card
                v-for="coach in hotCoachList"
                :key="coach.id"
                :coach="coach"
                @click="goCoachDetail(coach)"
              />
            </template>
          </view>
        </scroll-view>
      </view>

      <!-- New Coaches -->
      <view class="home-section home-section--last">
        <view class="home-section-header">
          <view class="home-section-title">
            <view class="home-section-title__dot home-section-title__dot--blue"></view>
            <text>新人推荐</text>
          </view>
          <view class="home-section-more" @click="viewAllNewCoach">
            <text>全部</text>
            <text class="home-section-more__arrow">›</text>
          </view>
        </view>

        <scroll-view scroll-x class="home-horizontal-scroll" show-scrollbar="false">
          <view class="home-avatar-list">
            <view
              v-for="coach in newCoachList"
              :key="coach.id"
              class="home-avatar-item"
              @click="goCoachDetail(coach)"
            >
              <view class="home-avatar-item__wrap">
                <image class="home-avatar-item__image" :src="coach.avatar" mode="aspectFill" />
                <view class="home-avatar-item__ring"></view>
                <view class="home-avatar-item__badge">NEW</view>
              </view>
              <text class="home-avatar-item__name">{{ coach.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- Bottom Spacer -->
      <view class="home-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import DsCoachCard from '@/components/ds-coach-card/ds-coach-card.vue'
import { getNewCoachList, getHotCoachList } from '@/api/billiard/coach'

// State
const statusBarHeight = ref(0)
const navbarHeight = ref(0)
const loading = ref(false)
const refreshing = ref(false)

// Data
const bannerList = ref([
  { id: 1, img: '/static/images/banner/banner01.jpg' },
  { id: 2, img: '/static/images/banner/banner02.jpg' }
])

const serviceList = ref([
  { id: 1, title: '台球陪练', price: 99, unit: '两小时', priceColor: '#00BB88', icon: '🎱', iconBg: 'rgba(0, 187, 136, 0.15)' },
  { id: 2, title: '系统教学', price: 495, unit: '五小时', priceColor: '#3B82F6', icon: '🎓', iconBg: 'rgba(59, 130, 246, 0.15)' }
])

const hotCoachList = ref([])
const newCoachList = ref([])

// Methods
const loadHotCoaches = async () => {
  try {
    const res = await getHotCoachList({ limit: 10 })
    const list = res.data || res || []
    hotCoachList.value = Array.isArray(list) ? list.map(item => ({
      id: item.id,
      name: item.stageName || '助教',
      avatar: item.mainPhotoUrl || 'https://picsum.photos/400/400',
      score: item.overallScore || '5.0',
      orderCount: item.serviceCount || 0,
      price: item.price || 99,
      online: true,
      tags: ['初级教学', '姿势纠正']
    })) : []
  } catch (e) {
    console.error('Load hot coaches failed:', e)
  }
}

const loadNewCoaches = async () => {
  try {
    const res = await getNewCoachList({ limit: 10 })
    const list = res.data || res || []
    newCoachList.value = Array.isArray(list) ? list.map(item => ({
      id: item.id,
      name: item.stageName || '新助教',
      avatar: item.mainPhotoUrl || 'https://picsum.photos/200/200'
    })) : []
  } catch (e) {
    console.error('Load new coaches failed:', e)
  }
}

const initData = async () => {
  loading.value = true
  await Promise.all([loadHotCoaches(), loadNewCoaches()])
  loading.value = false
}

const onRefresh = async () => {
  refreshing.value = true
  await initData()
  refreshing.value = false
}

const onScroll = (e) => {
  // Can handle parallax effects here
}

// Navigation
const goSearch = () => uni.showToast({ title: '搜索', icon: 'none' })
const goNotice = () => uni.showToast({ title: '通知', icon: 'none' })
const handleBannerClick = (i) => console.log('Banner click:', i)
const handleServiceClick = (i) => uni.showToast({ title: i.title, icon: 'none' })

const viewAllHotCoach = () => uni.switchTab({ url: '/pages/coach/list' })
const viewAllNewCoach = () => uni.switchTab({ url: '/pages/coach/list' })

const goCoachDetail = (coach) => {
  uni.navigateTo({ url: `/pages/coach/detail?id=${coach.id}` })
}

// Lifecycle
onLoad(() => {
  initData()
})

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 44
  navbarHeight.value = statusBarHeight.value + 72
})
</script>

<style lang="scss" scoped>
@import '@/design-system/index.scss';

.home-page {
  min-height: 100vh;
  background: var(--ds-bg-primary);
  position: relative;
}

/* Navbar */
.home-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--ds-layout-screen-padding);
  padding-bottom: 16rpx;
  background: linear-gradient(180deg, rgba(18,22,25,0.95) 0%, rgba(18,22,25,0.85) 100%);
  backdrop-filter: blur(20rpx);
  border-bottom: 1rpx solid rgba(255,255,255,0.06);

  &__left {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__logo {
    width: 52rpx;
    height: 52rpx;
    background: var(--ds-gradient-primary);
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6rpx 18rpx rgba(0,187,136,0.3);
  }

  &__logo-text {
    color: #fff;
    font-size: 28rpx;
    font-weight: bold;
    line-height: 1;
  }

  &__title-group {
    display: flex;
    flex-direction: column;
    gap: 2rpx;
  }

  &__title {
    color: var(--ds-text-primary);
    font-size: 28rpx;
    font-weight: var(--ds-font-weight-semibold);
    line-height: 1.2;
  }

  &__subtitle {
    color: var(--ds-text-tertiary);
    font-size: 18rpx;
    line-height: 1.2;
  }

  &__right {
    display: flex;
    gap: 12rpx;
  }

  &__icon-btn {
    width: 52rpx;
    height: 52rpx;
    background: rgba(255,255,255,0.06);
    border-radius: 50%;
    border: 1rpx solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__icon {
    font-size: 22rpx;
  }
}

/* Scroll Content */
.home-scroll {
  height: 100vh;
}

.home-section {
  padding: 0 var(--ds-layout-screen-padding);
  margin-bottom: var(--ds-layout-section-gap);

  &--last {
    margin-bottom: 0;
  }
}

/* Banner */
.home-banner {
  height: 280rpx;
  border-radius: var(--ds-radius-card);
  overflow: hidden;

  &__item {
    width: 100%;
    height: 100%;
    position: relative;
    border-radius: var(--ds-radius-card);
    overflow: hidden;
  }

  &__image {
    width: 100%;
    height: 100%;
  }

  &__gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
  }
}

/* Service Grid */
.home-service-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.home-service-card {
  background: var(--ds-bg-card);
  border: 1rpx solid var(--ds-border-subtle);
  border-radius: var(--ds-radius-card);
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
  box-shadow: var(--ds-shadow-md), var(--ds-shadow-inner-glass);
  transition: all var(--ds-duration-fast) var(--ds-easing-standard);

  &--active {
    transform: scale(0.97);
    filter: brightness(1.03);
  }

  &__icon-wrap {
    width: 72rpx;
    height: 72rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__emoji {
    font-size: 36rpx;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    color: var(--ds-text-primary);
    font-size: 26rpx;
    font-weight: var(--ds-font-weight-semibold);
    display: block;
    margin-bottom: 4rpx;
  }

  &__price {
    display: flex;
    align-items: baseline;
    gap: 4rpx;
  }

  &__currency {
    font-size: 18rpx;
    color: var(--ds-text-tertiary);
  }

  &__num {
    font-size: 28rpx;
    font-weight: bold;
  }

  &__unit {
    font-size: 18rpx;
    color: var(--ds-text-tertiary);
  }
}

/* Section Header */
.home-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.home-section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;

  &__dot {
    width: 6rpx;
    height: 24rpx;
    background: var(--ds-color-primary);
    border-radius: 3rpx;

    &--blue {
      background: #3B82F6;
    }
  }

  text {
    color: var(--ds-text-primary);
    font-size: 28rpx;
    font-weight: var(--ds-font-weight-semibold);
  }
}

.home-section-more {
  display: flex;
  align-items: center;
  gap: 4rpx;

  text {
    color: var(--ds-text-secondary);
    font-size: 22rpx;
  }

  &__arrow {
    font-size: 26rpx;
    font-weight: 300;
    line-height: 1;
    margin-top: -2rpx;
  }
}

/* Horizontal Scroll */
.home-horizontal-scroll {
  width: 100%;
  margin: 0 calc(var(--ds-layout-screen-padding) * -1);
  padding: 0 var(--ds-layout-screen-padding);
  box-sizing: border-box;
}

/* Coach List */
.home-coach-list {
  display: inline-flex;
  gap: 20rpx;
  padding-right: var(--ds-layout-screen-padding);
}

.home-skeleton-card {
  width: 240rpx;
  height: 360rpx;
  background: var(--ds-bg-card);
  border-radius: var(--ds-radius-card);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--ds-gradient-shimmer);
    animation: ds-shimmer 1.5s infinite;
  }
}

/* Avatar List */
.home-avatar-list {
  display: inline-flex;
  gap: 28rpx;
  padding-right: var(--ds-layout-screen-padding);
}

.home-avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;

  &__wrap {
    width: 96rpx;
    height: 96rpx;
    position: relative;
  }

  &__image {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 3rpx solid var(--ds-bg-primary);
    background: var(--ds-bg-card);
    position: relative;
    z-index: 2;
  }

  &__ring {
    position: absolute;
    top: -3rpx;
    left: -3rpx;
    right: -3rpx;
    bottom: -3rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #3B82F6, #8B5CF6, #3B82F6);
    z-index: 1;
    animation: ds-rotate 4s linear infinite;
  }

  &__badge {
    position: absolute;
    bottom: 0;
    right: -6rpx;
    background: linear-gradient(135deg, #FF4D4D, #F63B82);
    color: #fff;
    font-size: 14rpx;
    font-weight: bold;
    padding: 3rpx 8rpx;
    border-radius: 50rpx;
    border: 2rpx solid var(--ds-bg-primary);
    z-index: 3;
    line-height: 1.2;
  }

  &__name {
    color: var(--ds-text-secondary);
    font-size: 18rpx;
    max-width: 120rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }
}

.home-spacer {
  height: 100rpx;
}
</style>