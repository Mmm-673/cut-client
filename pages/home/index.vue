<template>
  <view class="home-wrapper">
    <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-left">
        <view class="logo-circle">
          <text class="logo-text">8</text>
        </view>
        <view class="nav-title-group">
          <text class="nav-title">台球约</text>
          <text class="nav-subtitle">专业助教预约平台</text>
        </view>
      </view>
      <view class="nav-right">
        <view class="icon-btn" @click="goSearch">
          <uni-icons type="search" size="20" color="#fff" />
        </view>
        <view class="icon-btn" @click="goNotice">
          <uni-icons type="notification" size="20" color="#fff" />
        </view>
      </view>
    </view>

    <view class="banner-section">
      <swiper
          class="banner-swiper"
          indicator-dots
          autoplay
          circular
          indicator-active-color="#00BB88"
      >
        <swiper-item v-for="(item, index) in bannerList" :key="index" @click="handleBannerClick(item)">
          <view class="banner-card">
            <image class="banner-img" :src="item.img" mode="aspectFill"></image>
            <view class="banner-mask">
              <view class="banner-content">
                <text class="banner-tag">限时特惠</text>
                <text class="banner-title">{{item.title}}</text>
                <text class="banner-desc">{{item.desc}}</text>
              </view>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <view class="service-grid">
      <view
          class="service-item"
          v-for="item in serviceList"
          :key="item.id"
          hover-class="item-hover"
          @click="handleServiceClick(item)"
      >
        <view class="service-icon-wrap" :style="{background: item.iconBg}">
          <text class="service-emoji">{{item.icon}}</text>
        </view>
        <view class="service-body">
          <text class="s-title">{{item.title}}</text>
          <view class="s-price">
            <text class="s-unit">¥</text>
            <text class="s-num" :style="{color: item.priceColor}">{{item.price}}</text>
            <text class="s-unit">/{{item.unit}}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section-container">
      <view class="section-header">
        <view class="title-left">
          <view class="title-line"></view>
          <text class="title-text">热门助教</text>
        </view>
        <view class="view-more" @click="viewAllHotCoach">
          <text>全部</text>
          <uni-icons type="right" size="12" color="#9CA3AF" />
        </view>
      </view>

      <view class="coach-grid">
        <view
            class="coach-card"
            v-for="item in hotCoachList"
            :key="item.id"
            @click="goCoachDetail(item)"
        >
          <view class="coach-img-box">
            <image class="coach-avatar" :src="item.avatar" mode="aspectFill"></image>
            <view v-if="item.online" class="status-dot">在线</view>
          </view>
          <view class="coach-info">
            <text class="c-name">{{item.name}}</text>
            <view class="c-tags">
              <text class="c-tag">⭐ {{item.score}}</text>
              <text class="c-tag">{{item.orderCount}}单</text>
            </view>
            <view class="c-book-btn">立即约</view>
          </view>
        </view>
      </view>
    </view>

    <view class="section-container last-section">
      <view class="section-header">
        <view class="title-left">
          <view class="title-line blue"></view>
          <text class="title-text">新人推荐</text>
        </view>
      </view>
      <scroll-view class="new-coach-scroll" scroll-x enable-flex>
        <view
            class="new-avatar-item"
            v-for="item in newCoachList"
            :key="item.id"
            @click="goCoachDetail(item)"
        >
          <view class="new-img-wrap">
            <image class="new-img" :src="item.avatar" mode="aspectFill"></image>
            <view class="new-label">NEW</view>
          </view>
          <text class="new-name">{{item.name}}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 状态栏高度
const statusBarHeight = ref(0)

const bannerList = ref([
  { id: 1, img: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800', title: '深夜台球局', desc: '全城优质助教随叫随到' },
  { id: 2, img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800', title: '新人领券', desc: '首单预约最高立减50元' }
])

const serviceList = ref([
  { id: 1, title: '台球陪练', price: 99, unit: '小时', priceColor: '#00BB88', icon: '🎱', iconBg: 'rgba(0, 187, 136, 0.15)' },
  { id: 2, title: '桌球教学', price: 158, unit: '小时', priceColor: '#3B82F6', icon: '🎓', iconBg: 'rgba(59, 130, 246, 0.15)' }
])

const hotCoachList = ref([
  { id: 101, name: '思思', avatar: 'https://picsum.photos/id/65/300/300', score: 4.9, orderCount: 128, online: true },
  { id: 102, name: '安妮', avatar: 'https://picsum.photos/id/64/300/300', score: 4.8, orderCount: 256, online: true },
  { id: 103, name: '小杰', avatar: 'https://picsum.photos/id/103/300/300', score: 4.7, orderCount: 89, online: false }
])

const newCoachList = ref([
  { id: 201, name: '茉莉', avatar: 'https://picsum.photos/id/101/200/200' },
  { id: 202, name: '可儿', avatar: 'https://picsum.photos/id/102/200/200' },
  { id: 203, name: '晴天', avatar: 'https://picsum.photos/id/177/200/200' },
  { id: 204, name: '艾米', avatar: 'https://picsum.photos/id/204/200/200' },
  { id: 205, name: 'Luna', avatar: 'https://picsum.photos/id/205/200/200' }
])

const goSearch = () => uni.showToast({ title: '搜索', icon: 'none' })
const goNotice = () => uni.showToast({ title: '通知', icon: 'none' })
const handleBannerClick = (i) => console.log(i)
const handleServiceClick = (i) => uni.showToast({ title: i.title, icon: 'none' })
const viewAllHotCoach = () => console.log('All')
const goCoachDetail = (i) => uni.showToast({ title: i.name, icon: 'none' })

onLoad(() => { console.log('Home Loaded') })

onMounted(() => {
  // 获取状态栏高度
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
})
</script>

<style lang="scss" scoped>
.home-wrapper {
  min-height: 100vh;
  background-color: #121619;
  padding-top: 180rpx; /* 预留导航栏空间，使用rpx自适应 */
  padding-bottom: 40rpx;
  box-sizing: border-box;
}

/* 顶部导航 - 适配状态栏安全区 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 30rpx;
  padding-right: 30rpx;
  padding-bottom: 20rpx;
  background: rgba(18, 22, 25, 0.95);
  backdrop-filter: blur(10px);

  .nav-left {
    display: flex;
    align-items: center;
    .logo-circle {
      width: 56rpx; height: 56rpx; background: #00BB88; border-radius: 16rpx;
      display: flex; align-items: center; justify-content: center; margin-right: 16rpx;
      .logo-text { color: #fff; font-weight: bold; font-size: 32rpx; }
    }
    .nav-title-group {
      display: flex; flex-direction: column;
      .nav-title { color: #fff; font-size: 34rpx; font-weight: 600; line-height: 1.2; }
      .nav-subtitle { color: #666; font-size: 26rpx; margin-top: 4rpx; }
    }
  }
  .nav-right {
    display: flex; gap: 24rpx;
    .icon-btn { background: rgba(255,255,255,0.1); padding: 12rpx; border-radius: 50%; display: flex; align-items: center; }
  }
}

/* Banner区域 */
.banner-section {
  margin: 0 30rpx 40rpx;
  .banner-swiper {
    height: 340rpx;
    .banner-card { position: relative; width: 100%; height: 100%; border-radius: 30rpx; overflow: hidden; }
    .banner-img { width: 100%; height: 100%; }
    .banner-mask {
      position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      display: flex; align-items: flex-end; padding: 30rpx;
      .banner-tag { background: #00BB88; font-size: 24rpx; color: #fff; padding: 4rpx 12rpx; border-radius: 8rpx; margin-bottom: 10rpx; display: inline-block; }
      .banner-title { color: #fff; font-size: 48rpx; font-weight: bold; display: block; }
      .banner-desc { color: #ccc; font-size: 28rpx; }
    }
  }
}

/* 服务入口 */
.service-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20rpx; padding: 0 30rpx 40rpx;
  .service-item {
    background: #1E252B; border: 1px solid rgba(255,255,255,0.05); border-radius: 24rpx; padding: 24rpx; display: flex; align-items: center;
    .service-icon-wrap { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; .service-emoji { font-size: 40rpx; } }
    .s-title { color: #fff; font-size: 32rpx; font-weight: 500; }
    .s-price { margin-top: 4rpx; .s-unit { font-size: 24rpx; color: #9CA3AF; } .s-num { font-size: 36rpx; font-weight: bold; margin: 0 4rpx; } }
  }
}

/* 板块标题 */
.section-container {
  padding: 0 30rpx 40rpx;
  .section-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx;
    .title-left { display: flex; align-items: center; .title-line { width: 8rpx; height: 32rpx; background: #00BB88; border-radius: 4rpx; margin-right: 16rpx; } .title-line.blue { background: #3B82F6; } .title-text { color: #fff; font-size: 36rpx; font-weight: 600; } }
    .view-more { display: flex; align-items: center; text { color: #9CA3AF; font-size: 28rpx; margin-right: 4rpx; } }
  }
}

/* 助教卡片 */
.coach-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20rpx;
  .coach-card {
    background: #1E252B; border-radius: 20rpx; overflow: hidden;
    .coach-img-box { position: relative; height: 210rpx; .coach-avatar { width: 100%; height: 100%; } .status-dot { position: absolute; top: 10rpx; right: 10rpx; background: #00BB88; color: #fff; font-size: 22rpx; padding: 2rpx 10rpx; border-radius: 20rpx; } }
    .coach-info { padding: 16rpx; .c-name { color: #fff; font-size: 30rpx; font-weight: 500; display: block; margin-bottom: 8rpx; } .c-tags { display: flex; justify-content: space-between; .c-tag { color: #9CA3AF; font-size: 24rpx; } } .c-book-btn { margin-top: 16rpx; background: #00BB88; color: #fff; font-size: 28rpx; text-align: center; padding: 8rpx 0; border-radius: 12rpx; } }
  }
}

/* 新人滚动列表 */
.new-coach-scroll {
  display: flex; white-space: nowrap;
  .new-avatar-item {
    margin-right: 32rpx; display: inline-flex; flex-direction: column; align-items: center;
    .new-img-wrap { position: relative; width: 110rpx; height: 110rpx; padding: 4rpx; border: 2rpx solid #3B82F6; border-radius: 50%; .new-img { width: 100%; height: 100%; border-radius: 50%; } .new-label { position: absolute; bottom: -4rpx; right: -4rpx; background: #EF4444; color: #fff; font-size: 20rpx; padding: 2rpx 8rpx; border-radius: 6rpx; } }
    .new-name { color: #9CA3AF; font-size: 26rpx; margin-top: 12rpx; }
  }
}

.item-hover { transform: scale(0.98); opacity: 0.8; }
</style>