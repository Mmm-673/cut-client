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

      <!-- 热门助教横向滚动 -->
      <scroll-view class="scroll-view-h" scroll-x="true" show-scrollbar="false">
        <view class="hot-coach-list">
          <view class="hot-coach-card" v-for="item in hotCoachList" :key="item.id" @click="goCoachDetail(item)">
            <view class="hot-img-box">
              <image class="hot-avatar" :src="item.avatar" mode="aspectFill"></image>
              <view v-if="item.online" class="online-status">
                <view class="dot"></view>
                <text>在线</text>
              </view>
            </view>
            <view class="hot-info">
              <text class="hot-name">{{item.name}}</text>
              <view class="hot-stats">
                <view class="stat-item">
                  <uni-icons type="star-filled" size="12" color="#FFB800" />
                  <text>{{item.score}}</text>
                </view>
                <text class="stat-split">|</text>
                <text class="stat-count">已接{{item.orderCount}}单</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="section-container last-section">
      <view class="section-header">
        <view class="title-left">
          <view class="title-line blue"></view>
          <text class="title-text">新人推荐</text>
        </view>
        <view class="view-more" @click="viewAllNewCoach">
          <text>全部</text>
          <uni-icons type="right" size="12" color="#9CA3AF" />
        </view>
      </view>
      <scroll-view class="scroll-view-h" scroll-x="true" show-scrollbar="false">
        <view class="new-coach-list">
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
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getNewCoachList, getHotCoachList } from '@/api/billiard/coach'

const statusBarHeight = ref(0)
const loading = ref(false)

const bannerList = ref([
  { id: 1, img: '/static/images/banner/banner01.png' },
  { id: 2, img: '/static/images/banner/banner02.png' }
])

const serviceList = ref([
  { id: 1, title: '台球陪练', price: 99, unit: '小时', priceColor: '#00BB88', icon: '🎱', iconBg: 'rgba(0, 187, 136, 0.15)' },
  { id: 2, title: '桌球教学', price: 158, unit: '小时', priceColor: '#3B82F6', icon: '🎓', iconBg: 'rgba(59, 130, 246, 0.15)' }
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
      avatar: item.mainPhotoUrl || 'https://picsum.photos/300/300',
      score: item.overallScore || 5.0,
      orderCount: item.serviceCount || 0,
      online: true
    })) : []
  } catch (error) {
    console.error('加载热门助教失败:', error)
  }
}

const loadNewCoaches = async () => {
  try {
    const res = await getNewCoachList({ limit: 10 })
    const list = res.data || res || []
    newCoachList.value = Array.isArray(list) ? list.map(item => ({
      id: item.id,
      name: item.stageName,
      avatar: item.mainPhotoUrl || 'https://picsum.photos/200/200'
    })) : []
  } catch (error) {
    console.error('加载新人助教失败:', error)
  }
}

const goSearch = () => uni.showToast({ title: '搜索', icon: 'none' })
const goNotice = () => uni.showToast({ title: '通知', icon: 'none' })
const handleBannerClick = (i) => console.log(i)
const handleServiceClick = (i) => uni.showToast({ title: i.title, icon: 'none' })

const viewAllHotCoach = () => {
  uni.switchTab({
    url: '/pages/coach/list'
  })
}

const viewAllNewCoach = () => {
  uni.switchTab({
    url: '/pages/coach/list'
  })
}

const goCoachDetail = (item) => {
  uni.navigateTo({
    url: `/pages/coach/detail?id=${item.id}`
  })
}

const initData = async () => {
  loading.value = true
  await Promise.all([
    loadHotCoaches(),
    loadNewCoaches()
  ])
  loading.value = false
}

onLoad(() => {
  console.log('Home Loaded')
  initData()
})

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
})
</script>

<style lang="scss" scoped>
.home-wrapper {
  min-height: 100vh;
  background-color: #121619;
  padding-top: 180rpx;
  //padding-bottom: 40rpx;
  box-sizing: border-box;
}

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
      width: 56rpx;
      height: 56rpx;
      background: #00BB88;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16rpx;
      .logo-text {
        color: #fff;
        font-weight: bold;
        font-size: 32rpx;
      }
    }
    .nav-title-group {
      display: flex;
      flex-direction: column;
      .nav-title {
        color: #fff;
        font-size: 34rpx;
        font-weight: 600;
        line-height: 1.2;
      }
      .nav-subtitle {
        color: #666;
        font-size: 26rpx;
        margin-top: 4rpx;
      }
    }
  }
  .nav-right {
    display: flex;
    gap: 24rpx;
    .icon-btn {
      background: rgba(255,255,255,0.1);
      padding: 12rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
    }
  }
}

.banner-section {
  margin: 0 30rpx 40rpx;
  .banner-swiper {
    height: 340rpx;
    .banner-card {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 30rpx;
      overflow: hidden;
    }
    .banner-img {
      width: 100%;
      height: 100%;
    }
  }
}

.service-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  padding: 0 30rpx 40rpx;
  .service-item {
    background: #1E252B;
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 24rpx;
    padding: 24rpx;
    display: flex;
    align-items: center;
    .service-icon-wrap {
      width: 80rpx;
      height: 80rpx;
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      .service-emoji {
        font-size: 40rpx;
      }
    }
    .s-title {
      color: #fff;
      font-size: 32rpx;
      font-weight: 500;
    }
    .s-price {
      margin-top: 4rpx;
      .s-unit {
        font-size: 24rpx;
        color: #9CA3AF;
      }
      .s-num {
        font-size: 36rpx;
        font-weight: bold;
        margin: 0 4rpx;
      }
    }
  }
}

.section-container {
  padding: 0 30rpx 40rpx;
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    .title-left {
      display: flex;
      align-items: center;
      .title-line {
        width: 8rpx;
        height: 32rpx;
        background: #00BB88;
        border-radius: 4rpx;
        margin-right: 16rpx;
      }
      .title-line.blue {
        background: #3B82F6;
      }
      .title-text {
        color: #fff;
        font-size: 36rpx;
        font-weight: 600;
      }
    }
    .view-more {
      display: flex;
      align-items: center;
      text {
        color: #9CA3AF;
        font-size: 28rpx;
        margin-right: 4rpx;
      }
    }
  }
}

/* 共同样式：隐藏滚动条 */
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

/* --- 热门助教样式优化 --- */
.hot-coach-list {
  display: inline-flex;
  //padding: 10rpx 30rpx; // 增加内边距防止阴影被截断

  .hot-coach-card {
    width: 240rpx; // 稍微加宽
    margin-right: 24rpx;
    background: #1E252B;
    border-radius: 24rpx;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;

    &:active {
      transform: translateY(4rpx);
    }

    /* 最后一个去掉右边距 ———— 就是加这一段！ */
    &:last-child {
      margin-right: 0 !important;
    }


    .hot-img-box {
      position: relative;
      width: 100%;
      height: 240rpx;

      .hot-avatar {
        width: 100%;
        height: 100%;
        background-color: #2a2e32;
      }

      .online-status {
        position: absolute;
        top: 16rpx;
        left: 16rpx;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        padding: 4rpx 12rpx;
        border-radius: 50rpx;
        display: flex;
        align-items: center;
        gap: 6rpx;
        border: 1rpx solid rgba(0, 187, 136, 0.4);

        .dot {
          width: 10rpx;
          height: 10rpx;
          background: #00BB88;
          border-radius: 50%;
          box-shadow: 0 0 8rpx #00BB88;
        }

        text {
          color: #fff;
          font-size: 20rpx;
        }
      }
    }

    .hot-info {
      padding: 16rpx 20rpx;

      .hot-name {
        color: #FFFFFF;
        font-size: 30rpx;
        font-weight: 600;
        margin-bottom: 8rpx;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .hot-stats {
        display: flex;
        align-items: center;
        justify-content: space-between;
        .stat-item {
          display: flex;
          align-items: center;
          gap: 4rpx;
          text {
            color: #FFB800;
            font-size: 24rpx;
            font-weight: 500;
          }
        }

        .stat-split {
          color: #333;
          margin: 0 10rpx;
          font-size: 20rpx;
        }

        .stat-count {
          color: #9CA3AF;
          font-size: 22rpx;
        }
      }
    }
  }
}

.new-coach-list {
  display: inline-flex;
  //padding: 10rpx 30rpx 20rpx;
  white-space: nowrap;

  .new-avatar-item {
    margin-right: 36rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.2s ease;

    .new-img-wrap {
      position: relative;
      width: 100rpx;
      height: 100rpx;
      padding: 6rpx;
      background: linear-gradient(135deg, #3B82F6 0%, rgba(59, 130, 246, 0.2) 50%, #3B82F6 100%);
      border-radius: 50%;
      margin-bottom: 12rpx;

      .new-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 4rpx solid #121619;
        object-fit: cover;
      }

      .new-label {
        position: absolute;
        bottom: 0rpx;
        right: -4rpx;
        background: linear-gradient(90deg, #FF4D4D, #F63B82);
        color: #fff;
        font-size: 18rpx;
        font-weight: bold;
        padding: 4rpx 12rpx;
        border-radius: 50rpx;
        border: 2rpx solid #121619;
        line-height: 1.2;
      }
    }

    .new-name {
      color: #E5E7EB;
      font-size: 24rpx;
      max-width: 130rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
    }
  }

  /* 最后一个去掉右边距 */
  .new-avatar-item:last-child {
    margin-right: 0;
  }
}

/* 点击效果更柔和 */
.item-hover {
  transform: scale(0.96);
  opacity: 0.85;
  transition: all 0.2s ease;
}

</style>