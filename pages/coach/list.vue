<template>
  <view class="coach-list-page">
    <view class="header-section">
      <view class="search-bar">
        <view class="search-input-wrapper">
          <uni-icons type="search" size="18" color="#999"></uni-icons>
          <input class="search-input" placeholder="搜索助教姓名或特长" placeholder-class="search-placeholder" />
        </view>
      </view>
      <scroll-view class="tab-scroll" scroll-x="true" :show-scrollbar="false">
        <view class="tab-list">
          <view
              v-for="(tab, index) in tabs"
              :key="index"
              class="tab-item"
              :class="{ active: currentTab === index }"
              @click="switchTab(index)"
          >
            {{ tab }}
          </view>
        </view>
      </scroll-view>

      <view class="sort-bar">
        <view class="sort-item active">
          <text>智能排序</text>
          <uni-icons type="bottom" size="12" color="#00d4aa"></uni-icons>
        </view>
        <view class="sort-item">距离最近</view>
        <view class="sort-item">好评优先</view>
      </view>
    </view>

    <scroll-view
        class="list-scroll"
        scroll-y="true"
        refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
        :style="{ height: scrollHeight + 'px' }"
    >
      <view class="coach-list">
        <view
            v-for="(coach, index) in coachList"
            :key="coach.id"
            class="coach-card"
            @click="goToDetail(coach.id)"
        >
          <view class="coach-avatar">
            <image :src="coach.avatar" mode="aspectFill" class="avatar-img"></image>
          </view>

          <view class="coach-info">
            <view class="info-top">
              <view class="name-row">
                <text class="coach-name">{{ coach.name }}</text>
                <view class="level-tag" :class="coach.level === '高级' ? 'senior' : 'middle'">
                  {{ coach.level }}
                </view>
                <view v-if="coach.isNew" class="new-tag">新人</view>
              </view>
              <text class="distance">{{ coach.distance }}</text>
            </view>

            <view class="rating-row">
              <uni-icons type="star-filled" size="14" color="#FFD700"></uni-icons>
              <text class="rating">{{ coach.rating }}</text>
              <text class="review-count">({{ coach.reviewCount }}单)</text>
              <view v-if="coach.freeTravel" class="free-tag">免费出行</view>
            </view>

            <view class="desc-row">
              <text class="coach-desc">{{ coach.desc }}</text>
            </view>

            <view class="bottom-row">
              <view class="price-row">
                <text class="price-symbol">¥</text>
                <text class="price">{{ coach.price }}</text>
                <text class="price-unit">/小时</text>
              </view>
              <view class="action-buttons">
                <button class="reward-btn" @click.stop="goToReward(coach.id)">
                  <uni-icons type="gift" size="14" color="#FF9500"></uni-icons>
                  <text>打赏</text>
                </button>
                <button class="book-btn">预约</button>
              </view>
            </view>
          </view>
        </view>

        <view class="loading-status">
          <uni-load-more :status="noMore ? 'noMore' : (loadingMore ? 'loading' : 'more')"></uni-load-more>
        </view>

        <view class="safe-area-bottom"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const statusBarHeight = ref(0)
const scrollHeight = ref(0)
const currentTab = ref(0)
const refreshing = ref(false)
const loadingMore = ref(false)
const noMore = ref(false)

const tabs = ['全部', '新人', '免费出行', '初级', '中级', '高级']
const coachList = ref([
  { id: 1, name: '小雯', level: '高级', avatar: 'https://picsum.photos/200/200?random=1', rating: 4.9, reviewCount: 128, distance: '1.2km', price: 99, desc: '国家级台球运动员，擅长斯诺克教学', freeTravel: true, isNew: false },
  { id: 2, name: '阿豪', level: '中级', avatar: 'https://picsum.photos/200/200?random=2', rating: 4.8, reviewCount: 256, distance: '2.5km', price: 89, desc: '省队退役选手，擅长中式八球', freeTravel: false, isNew: true }
])

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0

  // 计算滚动区域高度
  setTimeout(() => {
    const query = uni.createSelectorQuery()
    query.select('.header-section').boundingClientRect()
    query.exec((res) => {
      const headerHeight = res[0]?.height || 0
      // 减去系统导航栏、header、底部安全区域
      scrollHeight.value = systemInfo.windowHeight - headerHeight - (systemInfo.safeAreaInsets?.bottom || 0)
    })
  }, 100)
})

const switchTab = (index) => { currentTab.value = index }
const onRefresh = () => {
  refreshing.value = true
  setTimeout(() => { refreshing.value = false }, 1000)
}
const loadMore = () => {
  if (loadingMore.value || noMore.value) return
  loadingMore.value = true
  setTimeout(() => { loadingMore.value = false }, 1000)
}
const goToDetail = (id) => {
  uni.navigateTo({
    url: `/pages/coach/detail?id=${id}`
  })
}
const goToReward = (id) => {
    // 跳转到打赏页面
    uni.navigateTo({
      url: '/pages/coach/reward?id=' + id
    })
}
</script>

<style lang="scss" scoped>
/* 全局容器 */
.coach-list-page {
  width: 100%;
  min-height: 100vh;
  background-color: #1a1a1a;
}

/* 顶部固定区域 */
.header-section {
  background-color: #2a2a2a;
}

.search-bar {
  padding: 20rpx 32rpx;
  .search-input-wrapper {
    display: flex;
    align-items: center;
    background-color: #3a3a3a;
    border-radius: 48rpx;
    padding: 16rpx 32rpx;
    .search-input { flex: 1; margin-left: 16rpx; color: #fff; font-size: 28rpx; }
    .search-placeholder { color: #999; }
  }
}

.tab-scroll {
  white-space: nowrap;
  .tab-list {
    display: flex;
    padding: 10rpx 32rpx 20rpx;
    .tab-item {
      padding: 12rpx 32rpx;
      margin-right: 20rpx;
      border-radius: 40rpx;
      font-size: 26rpx;
      color: #999;
      background-color: #333;
      transition: all 0.2s;
      &.active { background-color: #00d4aa; color: #fff; }
    }
  }
}

.sort-bar {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
  border-top: 1rpx solid #333;
  .sort-item {
    display: flex;
    align-items: center;
    font-size: 26rpx;
    color: #999;
    &.active { color: #00d4aa; font-weight: bold; }
  }
}

/* 滚动区域 */
.list-scroll {
  /* 高度通过内联样式动态设置 */

  .coach-list {
    padding: 20rpx 30rpx;
  }
}

/* 适配底部安全区 */
.safe-area-bottom {
  /* constant 对应 iOS < 11.2，env 对应 iOS >= 11.2 */
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}

/* 助教卡片样式优化 */
.coach-card {
  display: flex;
  background-color: #2a2a2a;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;

  .coach-avatar .avatar-img {
    width: 180rpx;
    height: 180rpx;
    border-radius: 16rpx;
  }

  .coach-info {
    flex: 1;
    margin-left: 20rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .info-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      .name-row {
        display: flex;
        align-items: center;
        gap: 10rpx;
        .coach-name { font-size: 32rpx; color: #fff; font-weight: bold; }
        .level-tag {
          font-size: 20rpx; padding: 2rpx 10rpx; border-radius: 4rpx;
          &.senior { background: rgba(0,212,170,0.2); color: #00d4aa; }
          &.middle { background: rgba(255,149,0,0.2); color: #FF9500; }
        }
        .new-tag { font-size: 20rpx; background: #FF3B30; color: #fff; padding: 2rpx 10rpx; border-radius: 4rpx; }
      }
      .distance { font-size: 24rpx; color: #777; }
    }

    .rating-row {
      display: flex;
      align-items: center;
      margin: 10rpx 0;
      .rating { color: #FFD700; font-size: 26rpx; margin: 0 8rpx; }
      .review-count { color: #777; font-size: 24rpx; }
      .free-tag { margin-left: 10rpx; font-size: 20rpx; color: #00d4aa; border: 1rpx solid #00d4aa; padding: 0 8rpx; border-radius: 4rpx; }
    }

    .desc-row .coach-desc {
      font-size: 24rpx; color: #999; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
    }

    .bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10rpx;
      .price-row {
        .price-symbol { color: #00d4aa; font-size: 24rpx; }
        .price { color: #00d4aa; font-size: 36rpx; font-weight: bold; }
        .price-unit { color: #777; font-size: 22rpx; }
      }
      .action-buttons {
        display: flex;
        gap: 10rpx;
        button { border: none; font-size: 24rpx; border-radius: 30rpx; padding: 0 24rpx; height: 54rpx; line-height: 54rpx; }
        .reward-btn { background: #3a3a3a; color: #FF9500; display: flex; align-items: center; gap: 4rpx; }
        .book-btn { background: #00d4aa; color: #fff; }
      }
    }
  }
}

.loading-status { padding: 20rpx 0; }
</style>