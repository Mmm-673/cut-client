<template>
  <view class="home-wrapper">
    <!-- 导航栏 -->
    <view class="navbar" :style="{ paddingTop: statusBarHeight + 'rpx', height: navBarHeight + 'rpx' }">
      <view class="nav-left">
        <view class="logo-circle">
          <image class="logo-img" :src="globalConfig.appInfo.logo" mode="aspectFit"></image>
          <view class="logo-glow"></view>
        </view>
        <view class="nav-title-group">
          <text class="nav-title">初球</text>
          <text class="nav-subtitle">专业助教预约平台</text>
        </view>
      </view>
    </view>

    <!-- 滚动区域 -->
    <scroll-view scroll-y class="scroll-container" show-scrollbar="false" :style="{ paddingTop: navBarHeight + 'rpx', height: `calc(100vh)` }">
      <!-- 欢迎语 -->
      <view class="welcome-section">
        <text class="greeting">你好 👋</text>
        <text class="welcome-text">今天想预约哪位教练？</text>
      </view>

      <!-- 轮播图 -->
      <view class="banner-section">
        <swiper
            class="banner-swiper"
            indicator-dots
            autoplay
            circular
            :interval="3500"
            :duration="400"
            easing-function="easeInOutCubic"
            indicator-active-color="#00BB88"
        >
          <swiper-item v-for="(item, index) in bannerList" :key="index" @click="handleBannerClick(item)">
            <view class="banner-card">
              <image class="banner-img" :src="item.img" mode="aspectFill"></image>
              <view class="banner-overlay">
                <view class="banner-content">
                  <text class="banner-tag">限时特惠</text>
                  <text class="banner-title">新人首单立减50元</text>
                </view>
              </view>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 服务入口 -->
      <view class="service-section">
        <view class="section-title-wrap">
          <text class="section-title">热门服务</text>
          <text class="section-desc">为您精选优质服务</text>
        </view>
        <view class="service-grid">
          <view
              class="service-item"
              v-for="(item, index) in serviceList"
              :key="item.id"
              @click="handleServiceClick(item)"
          >
            <view class="service-bg" :style="{background: item.bgGradient}"></view>
            <view class="service-content">
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
              <view class="service-arrow">
                <uni-icons type="right" size="16" color="rgba(255,255,255,0.5)" />
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 热门助教 -->
      <view class="section-container">
        <view class="section-header">
          <view class="title-left">
            <view class="title-decoration">
              <view class="title-dot"></view>
              <view class="title-line"></view>
            </view>
            <text class="title-text">热门助教</text>
            <view class="title-badge">TOP</view>
          </view>
          <view class="view-more" @click="viewAllHotCoach">
            <text>全部</text>
            <uni-icons type="right" size="14" color="#9CA3AF" />
          </view>
        </view>

        <scroll-view class="scroll-view-h" scroll-x="true" show-scrollbar="false">
          <view class="hot-coach-list">
            <view class="hot-coach-card" v-for="item in hotCoachList" :key="item.id" @click="goCoachDetail(item)">
              <view class="hot-img-box">
                <image class="hot-avatar" :src="item.avatar" mode="aspectFill"></image>
                <view v-if="item.online" class="online-status">
                  <view class="dot-pulse">
                    <view class="dot"></view>
                    <view class="dot-ring"></view>
                  </view>
                  <text>在线</text>
                </view>
                <view class="score-tag">
                  <uni-icons type="star-filled" size="10" color="#FFB800" />
                  <text>{{item.score}}</text>
                </view>
              </view>
              <view class="hot-info">
                <text class="hot-name">{{item.name}}</text>
                <view class="hot-stats">
                  <text class="stat-count">已接{{item.orderCount}}单</text>
                  <view class="order-icon">
                    <uni-icons type="checkbox-filled" size="12" color="#00BB88" />
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 新人推荐 -->
      <view class="section-container last-section">
        <view class="section-header">
          <view class="title-left">
            <view class="title-decoration">
              <view class="title-dot blue"></view>
              <view class="title-line blue"></view>
            </view>
            <text class="title-text">新人推荐</text>
            <view class="title-badge blue">NEW</view>
          </view>
          <view class="view-more" @click="viewAllNewCoach">
            <text>全部</text>
            <uni-icons type="right" size="14" color="#9CA3AF" />
          </view>
        </view>

        <view class="new-coach-section">
          <scroll-view class="scroll-view-h" scroll-x="true" show-scrollbar="false">
            <view class="new-coach-list">
              <view
                  class="new-avatar-item"
                  v-for="(item, index) in newCoachList"
                  :key="item.id"
                  @click="goCoachDetail(item)"
              >
                <view class="new-img-wrap">
                  <view class="avatar-ring"></view>
                  <image class="new-img" :src="item.avatar" mode="aspectFill"></image>
                  <view class="new-label">
                    <text>NEW</text>
                  </view>
                  <view class="shine-overlay"></view>
                </view>
                <text class="new-name">{{item.name}}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>

      <view class="safe-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getNewCoachList, getHotCoachList } from '@/api/billiard/coach'
import { getVenueList } from '@/api/billiard/venue'
import { getLocation, showPermissionModal, prefetchLocation } from '@/utils/location'
import { isIOS } from '@/utils/platform'
import {
  useConfigStore
} from '@/store'
const globalConfig = useConfigStore().config

const statusBarHeight = ref(0)
const navBarHeight = ref(0)
const loading = ref(false)
const locationDenied = ref(false) // 记录是否已拒绝定位权限
const hasQueriedVenue = ref(false) // 记录是否已查询过球厅列表

const bannerList = ref([
  { id: 1, img: '/static/images/banner/banner01.jpg' },
  { id: 2, img: '/static/images/banner/banner02.jpg' }
])

const serviceList = ref([
  {
    id: 1,
    title: '台球陪练',
    price: 99,
    unit: '小时',
    priceColor: '#00BB88',
    icon: '🎱',
    iconBg: 'rgba(0, 187, 136, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(0, 187, 136, 0.15) 0%, rgba(0, 187, 136, 0.05) 100%)'
  },
  {
    id: 2,
    title: '专业教学',
    price: 88,
    unit: '小时',
    priceColor: '#3B82F6',
    icon: '🎓',
    iconBg: 'rgba(59, 130, 246, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)'
  }
])

const hotCoachList = ref([])
const newCoachList = ref([])

const loadHotCoaches = async () => {
  try {
    const res = await getHotCoachList({ limit: 10 })
    const list = res.data || res || []
    hotCoachList.value = Array.isArray(list) ? list.map(item => ({
      id: item.id,
      name: item.stageName,
      avatar: item.avatar || item.mainPhotoUrl || 'https://picsum.photos/300/300',
      score: item.overallScore || 5.0,
      orderCount: item.serviceCount || 0,
      online: Math.random() > 0.3
    })) : []
  } catch (error) {
    console.error('加载热门助教失败:', error)
    uni.showToast({ title: '加载热门助教失败', icon: 'none' })
  }
}

const loadNewCoaches = async () => {
  try {
    const res = await getNewCoachList({ limit: 10 })
    const list = res.data || res || []
    newCoachList.value = Array.isArray(list) ? list.map(item => ({
      id: item.id,
      name: item.stageName,
      avatar: item.avatar || item.mainPhotoUrl || 'https://picsum.photos/300/300',
    })) : []
  } catch (error) {
    console.error('加载新人助教失败:', error)
    uni.showToast({ title: '加载新人助教失败', icon: 'none' })
  }
}

const goCoachList = () => {
  prefetchLocation()
  uni.switchTab({
    url: '/pages/coach/list'
  })
}

const handleBannerClick = () => goCoachList()
const handleServiceClick = () => goCoachList()
const viewAllHotCoach = () => goCoachList()
const viewAllNewCoach = () => goCoachList()

const goCoachDetail = (item) => {
  uni.navigateTo({
    url: `/subpkg/coach/detail?id=${item.id}`
  })
}


// 静默查询球厅列表（智能排序，让后端根据经纬度落库）
const queryVenueListSilently = async () => {
  if (hasQueriedVenue.value) return

  try {
    // 先尝试获取定位
    const { longitude, latitude } = await getLocation({ needRegeocode: false })

    // 获取到定位后，调用球厅列表接口（智能排序=距离最近）
    await getVenueList({
      longitude,
      latitude,
      sortType: 1,
      limit: 100
    })

    hasQueriedVenue.value = true
    locationDenied.value = false
  } catch (error) {
    console.log('静默查询球厅失败:', error)

    // 如果是权限拒绝，提示用户
    if (error.message === 'permission_denied' || error.message === 'permission_denied_always') {
      locationDenied.value = true
      showPermissionModal({
        title: '需要定位权限',
        content: '获取附近球厅需要您的位置信息，是否前往开启？'
      })
    }
  }
}

const initData = async () => {
  loading.value = true
  await Promise.all([
    loadHotCoaches(),
    loadNewCoaches()
  ])
  loading.value = false

  // 静默查询球厅列表
  queryVenueListSilently()
}

onLoad(() => {
  initData()
})

onShow(() => {
  // 从设置回来时，如果之前拒绝了权限且还没查询成功过，重新尝试查询
  if (locationDenied.value && !hasQueriedVenue.value) {
    queryVenueListSilently()
  }
})

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()

  // 导航栏内容高度（根据平台调整）
  const navContentHeight = isIOS() ? 88 : 80 // iOS通常需要更高的导航栏
  statusBarHeight.value = isIOS() ? 110 : systemInfo.statusBarHeight + 15 || 0
  navBarHeight.value = statusBarHeight.value + navContentHeight + 8
})
</script>

<style lang="scss" scoped>
.home-wrapper {
  min-height: 100vh;
  background-color: #121619;
  box-sizing: border-box;
}

.scroll-container {
  width: 100%;
  box-sizing: border-box;
}

/* 导航栏 */
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
  padding-bottom: 24rpx;
  background: rgba(18, 22, 25, 0.9);
  backdrop-filter: blur(20rpx);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.03);

  .nav-left {
    display: flex;
    align-items: center;
    .logo-circle {
      width: 60rpx;
      height: 60rpx;
      background: linear-gradient(135deg, #00BB88 0%, #059669 100%);
      border-radius: 18rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16rpx;
      position: relative;
      overflow: hidden;

      .logo-glow {
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 60%);
        animation: glowPulse 4s ease-in-out infinite;
      }

      .logo-text {
        color: #fff;
        font-weight: 800;
        font-size: 34rpx;
        position: relative;
        z-index: 1;
      }
    }
    .nav-title-group {
      display: flex;
      flex-direction: column;
      .nav-title {
        color: #fff;
        font-size: 36rpx;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: -1rpx;
      }
      .nav-subtitle {
        color: #6B7280;
        font-size: 24rpx;
        margin-top: 2rpx;
        font-weight: 500;
      }
    }
  }
  .nav-right {
    display: flex;
    gap: 24rpx;
    .icon-btn {
      background: rgba(255,255,255,0.06);
      padding: 14rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      position: relative;
      transition: all 0.3s ease;
      border: 1rpx solid rgba(255,255,255,0.06);

      &:active {
        transform: scale(0.9);
        background: rgba(255,255,255,0.1);
      }

      .notice-badge {
        position: absolute;
        top: -4rpx;
        right: -4rpx;
        min-width: 32rpx;
        height: 32rpx;
        background: linear-gradient(135deg, #EF4444, #DC2626);
        border-radius: 50%;
        color: #fff;
        font-size: 18rpx;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3rpx solid #121619;
        box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.4);
        animation: badgeBounce 2s ease-in-out infinite;
      }
    }
  }
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

@keyframes badgeBounce {
  0%, 90%, 100% { transform: scale(1); }
  95% { transform: scale(1.2); }
}

/* 欢迎语 */
.welcome-section {
  padding: 0 30rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;

  .greeting {
    color: #9CA3AF;
    font-size: 26rpx;
    font-weight: 500;
  }

  .welcome-text {
    color: #fff;
    font-size: 36rpx;
    font-weight: 700;
    letter-spacing: -1rpx;
  }
}

/* 轮播图 */
.banner-section {
  margin: 0 30rpx 40rpx;
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
      transform: scale(1.02);
      transition: transform 0.4s ease;
    }

    .banner-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60%;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
      display: flex;
      align-items: flex-end;
      padding: 32rpx;
    }

    .banner-content {
      display: flex;
      flex-direction: column;
      gap: 10rpx;

      .banner-tag {
        display: inline-block;
        background: linear-gradient(135deg, #00BB88, #059669);
        color: #fff;
        font-size: 20rpx;
        font-weight: 600;
        padding: 6rpx 14rpx;
        border-radius: 50rpx;
        align-self: flex-start;
      }

      .banner-title {
        color: #fff;
        font-size: 32rpx;
        font-weight: 700;
      }
    }
  }
}

/* 服务入口 */
.service-section {
  padding: 0 30rpx 40rpx;

  .section-title-wrap {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    margin-bottom: 24rpx;

    .section-title {
      color: #fff;
      font-size: 32rpx;
      font-weight: 700;
    }

    .section-desc {
      color: #6B7280;
      font-size: 24rpx;
    }
  }
}

.service-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .service-item {
    position: relative;
    background: #1E252B;
    border: 1rpx solid rgba(255,255,255,0.05);
    border-radius: 28rpx;
    padding: 28rpx;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &:active {
      transform: scale(0.97);
    }

    .service-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:active .service-bg {
      opacity: 1;
    }

    .service-content {
      position: relative;
      display: flex;
      align-items: center;
      z-index: 1;
    }

    .service-icon-wrap {
      width: 88rpx;
      height: 88rpx;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      transition: all 0.3s ease;
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);

      .service-emoji {
        font-size: 44rpx;
      }
    }

    .service-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6rpx;

      .s-title {
        color: #fff;
        font-size: 34rpx;
        font-weight: 600;
      }

      .s-price {
        display: flex;
        align-items: baseline;

        .s-unit {
          font-size: 24rpx;
          color: #6B7280;
        }

        .s-num {
          font-size: 40rpx;
          font-weight: 800;
          margin: 0 4rpx;
          letter-spacing: -1rpx;
        }
      }
    }

    .service-arrow {
      width: 48rpx;
      height: 48rpx;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    &:active .service-arrow {
      background: rgba(255,255,255,0.1);
      transform: translateX(4rpx);
    }
  }
}

/* 通用章节 */
.section-container {
  padding: 0 30rpx 44rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28rpx;

    .title-left {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .title-decoration {
        display: flex;
        align-items: center;
        gap: 6rpx;

        .title-dot {
          width: 12rpx;
          height: 12rpx;
          background: #00BB88;
          border-radius: 50%;
          box-shadow: 0 0 12rpx rgba(0, 187, 136, 0.5);

          &.blue {
            background: #3B82F6;
            box-shadow: 0 0 12rpx rgba(59, 130, 246, 0.5);
          }
        }

        .title-line {
          width: 24rpx;
          height: 4rpx;
          background: linear-gradient(90deg, #00BB88, transparent);
          border-radius: 2rpx;

          &.blue {
            background: linear-gradient(90deg, #3B82F6, transparent);
          }
        }
      }

      .title-text {
        color: #fff;
        font-size: 34rpx;
        font-weight: 700;
        letter-spacing: -0.5rpx;
      }

      .title-badge {
        background: linear-gradient(135deg, rgba(0, 187, 136, 0.2), rgba(0, 187, 136, 0.08));
        color: #00BB88;
        font-size: 18rpx;
        font-weight: 700;
        padding: 4rpx 10rpx;
        border-radius: 8rpx;
        border: 1rpx solid rgba(0, 187, 136, 0.3);

        &.blue {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.08));
          color: #3B82F6;
          border-color: rgba(59, 130, 246, 0.3);
        }
      }
    }

    .view-more {
      display: flex;
      align-items: center;
      gap: 6rpx;
      padding: 8rpx 12rpx;
      background: rgba(255,255,255,0.04);
      border-radius: 50rpx;
      transition: all 0.3s ease;

      &:active {
        background: rgba(255,255,255,0.08);
      }

      text {
        color: #9CA3AF;
        font-size: 26rpx;
        font-weight: 500;
      }
    }
  }
}

.last-section {
  padding-bottom: 20rpx;
}

/* 横向滚动 */
.scroll-view-h {
  width: 100%;
  white-space: nowrap;
  ::-webkit-scrollbar {
    display: none;
    width: 0 !important;
    height: 0 !important;
    -webkit-appearance: none;
    background: transparent;
  }
}

/* 热门助教 */
.hot-coach-list {
  display: inline-flex;

  .hot-coach-card {
    width: 260rpx;
    margin-right: 20rpx;
    background: linear-gradient(145deg, #1E252B, #1a2024);
    border-radius: 28rpx;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.25);
    border: 1rpx solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &:active {
      transform: translateY(6rpx) scale(0.98);
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
    }

    &:last-child {
      margin-right: 0;
    }

    .hot-img-box {
      position: relative;
      width: 100%;
      height: 260rpx;
      overflow: hidden;

      .hot-avatar {
        width: 100%;
        height: 100%;
        background-color: #2a2e32;
        transition: transform 0.4s ease;
      }

      &:active .hot-avatar {
        transform: scale(1.08);
      }

      .online-status {
        position: absolute;
        top: 16rpx;
        left: 16rpx;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(10rpx);
        padding: 6rpx 14rpx;
        border-radius: 50rpx;
        display: flex;
        align-items: center;
        gap: 8rpx;
        border: 1rpx solid rgba(0, 187, 136, 0.3);

        .dot-pulse {
          position: relative;

          .dot {
            width: 10rpx;
            height: 10rpx;
            background: #00BB88;
            border-radius: 50%;
            position: relative;
            z-index: 1;
          }

          .dot-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 10rpx;
            height: 10rpx;
            background: rgba(0, 187, 136, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: pulseRing 2s ease-out infinite;
          }
        }

        text {
          color: #fff;
          font-size: 20rpx;
          font-weight: 600;
        }
      }

      .score-tag {
        position: absolute;
        bottom: 16rpx;
        right: 16rpx;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(10rpx);
        padding: 6rpx 12rpx;
        border-radius: 50rpx;
        display: flex;
        align-items: center;
        gap: 6rpx;
        border: 1rpx solid rgba(255, 184, 0, 0.25);

        text {
          color: #FFB800;
          font-size: 22rpx;
          font-weight: 700;
        }
      }
    }

    .hot-info {
      padding: 20rpx;

      .hot-name {
        color: #FFFFFF;
        font-size: 30rpx;
        font-weight: 600;
        margin-bottom: 10rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
      }

      .hot-stats {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .stat-count {
          color: #9CA3AF;
          font-size: 22rpx;
          font-weight: 500;
        }

        .order-icon {
          width: 36rpx;
          height: 36rpx;
          background: rgba(0, 187, 136, 0.12);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }
}

@keyframes pulseRing {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}

/* 新人推荐 */
.new-coach-section {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%);
  border-radius: 28rpx;
  padding: 28rpx 0 28rpx 30rpx;
  margin: 0 -30rpx;
  border: 1rpx solid rgba(59, 130, 246, 0.1);
}

.new-coach-list {
  display: inline-flex;
  white-space: nowrap;

  .new-avatar-item {
    margin-right: 32rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.95);
    }

    .new-img-wrap {
      position: relative;
      width: 112rpx;
      height: 112rpx;
      padding: 6rpx;
      background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #3B82F6 100%);
      border-radius: 50%;
      margin-bottom: 14rpx;
      overflow: hidden;
      animation: rotateGradient 8s linear infinite;

      .avatar-ring {
        position: absolute;
        top: 4rpx;
        left: 4rpx;
        right: 4rpx;
        bottom: 4rpx;
        border-radius: 50%;
        border: 2rpx dashed rgba(255, 255, 255, 0.3);
        animation: rotateReverse 12s linear infinite;
      }

      .new-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 4rpx solid #121619;
        object-fit: cover;
        position: relative;
        z-index: 1;
      }

      .new-label {
        position: absolute;
        bottom: 4rpx;
        right: -4rpx;
        background: linear-gradient(90deg, #FF4D4D, #F63B82);
        color: #fff;
        font-size: 16rpx;
        font-weight: 800;
        padding: 5rpx 12rpx;
        border-radius: 50rpx;
        border: 2rpx solid #121619;
        line-height: 1.2;
        z-index: 2;
        box-shadow: 0 4rpx 12rpx rgba(246, 59, 130, 0.4);
      }

      .shine-overlay {
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
          45deg,
          transparent 30%,
          rgba(255, 255, 255, 0.2) 50%,
          transparent 70%
        );
        animation: shine 3s ease-in-out infinite;
        z-index: 3;
      }
    }

    .new-name {
      color: #E5E7EB;
      font-size: 26rpx;
      font-weight: 600;
      max-width: 140rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
    }

    &:last-child {
      margin-right: 0;
    }
  }
}

@keyframes rotateGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes rotateReverse {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

.safe-bottom {
  height: 40rpx;
}
</style>
