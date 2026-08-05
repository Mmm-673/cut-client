<template>
  <view class="home-wrapper" :class="themeClass">
    <!-- 滚动区域 -->
    <scroll-view scroll-y class="scroll-container" show-scrollbar="false" :style="{ paddingTop: navBarHeight + 'rpx', height: `calc(100vh)` }">
      <!-- 欢迎语 -->
      <view class="welcome-section">
        <view class="welcome-left">
          <text class="greeting">你好 👋</text>
          <text class="welcome-text">{{ welcomeText }}</text>
        </view>
        <view class="welcome-right">
          <view class="scan-btn" @click="toScan">
            <uni-icons type="scan" size="24" color="#00BB88" />
          </view>
        </view>
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
              <image class="banner-img" :src="item.imageUrl" mode="aspectFill"></image>
<!--              <view class="banner-overlay">-->
<!--                <view class="banner-content">-->
<!--                  <text class="banner-tag">{{ item.tag || '限时特惠' }}</text>-->
<!--                  <text class="banner-title">{{ item.title || '新人首单立减50元' }}</text>-->
<!--                </view>-->
<!--              </view>-->
            </view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 审核模式：球厅预约 -->
      <review-venue v-if="showVenueSection" />

      <!-- 开关加载中的中性骨架（避免泄露教练内容） -->
      <view class="home-skeleton" v-if="!reviewLoaded">
        <view class="skeleton-card" v-for="i in 3" :key="i">
          <view class="skeleton-line title"></view>
          <view class="skeleton-line"></view>
          <view class="skeleton-line short"></view>
        </view>
      </view>


      <!-- 热门裁教 -->
      <view class="section-container" v-if="showCoachSections">
        <view class="section-header">
          <view class="title-left">
            <view class="title-decoration">
              <view class="title-dot"></view>
              <view class="title-line"></view>
            </view>
            <text class="title-text">热门裁教</text>
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
                <!-- 新增：裁教简介 -->
<!--                <text class="hot-desc" v-if="item.desc">{{item.desc}}</text>-->
                <view class="hot-stats">
                  <text class="stat-count">已接{{item.orderCount}}单</text>
                  <view class="order-icon">
                    <uni-icons type="checkbox-filled" size="12" color="#00BB88" />
                  </view>
                </view>
                <!-- 新增：价格信息 -->
                <view class="price-info" v-if="item.price">
                  <text class="price-text">¥{{item.price}}</text>
                  <text class="price-unit">/小时</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 新人推荐 -->
      <view class="section-container last-section" v-if="showCoachSections">
        <view class="section-header">
          <view class="title-left">
            <view class="title-decoration">
              <view class="title-dot blue"></view>
              <view class="title-line blue"></view>
            </view>
            <text class="title-text">新人精选</text>
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
                  <!-- 新增：在线状态指示器 -->
                  <view class="new-online-status" v-if="item.online">
                    <view class="online-dot"></view>
                  </view>
                </view>
                <text class="new-name">{{item.name}}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>

<!--      <view class="safe-bottom"></view>-->
    </scroll-view>
    <!-- #ifdef APP-PLUS -->
    <ios-privacy-dialog ref="privacyDialogRef" @agree="handlePrivacyAgreed" />
    <!-- #endif -->
  </view>
</template>

<script setup>
import {ref, computed, onMounted, nextTick, watch} from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getNewCoachList, getHotCoachList, getBannerList } from '@/api/billiard/coach'
import { shouldShowIosPrivacy, hasPrivacyRefused } from '@/utils/privacy'
import { isIOS, isMPWeixin } from '@/utils/platform'
import { isLoggedIn } from '@/utils/token'
import {
  useConfigStore, useThemeStore
} from '@/store'
import { usePageTheme } from '@/composables/usePageTheme'
import IosPrivacyDialog from '@/components/ios-privacy-dialog/ios-privacy-dialog.vue'

const configStore = useConfigStore()
const themeStore = useThemeStore()
const globalConfig = configStore.config

// 页面主题管理
usePageTheme()

// 主题类名
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 审核模式状态（响应式，开关变化时各区块自动切换）
const reviewMode = computed(() => configStore.reviewMode)
const reviewLoaded = computed(() => configStore.reviewLoaded)
const showCoachSections = computed(() => reviewLoaded.value && !reviewMode.value)
const showVenueSection = computed(() => reviewLoaded.value && reviewMode.value)
const welcomeText = computed(() => {
  if (!reviewLoaded.value) return '欢迎使用'
  return reviewMode.value ? '今天想去哪家球厅？' : '今天想预约哪位教练？'
})

const statusBarHeight = ref(0)
const navBarHeight = ref(0)
const loading = ref(false)

const locationDenied = ref(false) // 记录是否已拒绝定位权限
const hasQueriedVenue = ref(false) // 记录是否已查询过球厅列表

const bannerList = ref([])
const privacyDialogRef = ref(null)

// 更新自定义 TabBar 选中状态
const updateCustomTabBar = () => {
  if (uni.$updateCustomTabBar) {
    uni.$updateCustomTabBar(0)
  }
}


/** 打开 iOS 隐私协议弹窗 */
function openPrivacyDialogIfNeeded() {
  console.log('openPrivacyDialogIfNeeded', shouldShowIosPrivacy(), hasPrivacyRefused())
  if (!shouldShowIosPrivacy() && !hasPrivacyRefused()) {
    return
  }
  // 延迟一点时间，避开 iOS 首次安装的网络权限授权弹窗
  setTimeout(() => {
    nextTick(() => {
      privacyDialogRef.value?.open()
    })
  }, 300)
}

/** 隐私协议同意后的回调 */
function handlePrivacyAgreed() {
  console.log('隐私协议已同意，重新加载数据')
  initData()
}


const hotCoachList = ref([])
const newCoachList = ref([])

const loadBanners = async () => {
  try {
    const res = await getBannerList()
    const list = res.data.banners || []
    bannerList.value = Array.isArray(list) ? list.map(item => ({
      id: item.id,
      imageUrl: item.imageUrl,
      linkType: item.linkType,
      linkUrl: item.linkUrl,
      tag: item.tag,
      title: item.title
    })) : []
  } catch (error) {
    console.error('加载轮播图失败:', error)
  }
}

const loadHotCoaches = async () => {
  try {
    const res = await getHotCoachList({ limit: 20 }) // 减少显示数量以突出单个卡片
    const list = res.data?.filter(item => item.id !== 27) || res || []
    hotCoachList.value = Array.isArray(list) ? list.map(item => ({
      id: item.id,
      name: item.stageName,
      avatar: item.avatar || item.mainPhotoUrl || 'https://picsum.photos/300/300',
      score: item.overallScore || 5.0,
      orderCount: item.serviceCount || 0,
      online: Math.random() > 0.3,
      level: item.level || '资深', // 新增：裁教等级
      // desc: item.introduction || '专业裁教，经验丰富', // 新增：简介
      price: item.hourlyRate || 120 // 新增：小时价格
    })) : []
  } catch (error) {
    console.error('加载热门裁教失败:', error)
    uni.showToast({ title: '加载热门裁教失败', icon: 'none' })
  }
}



const loadNewCoaches = async () => {
  try {
    const res = await getNewCoachList({ limit: 20 })
    const list = res.data || res || []
    newCoachList.value = Array.isArray(list) ? list.map(item => ({
      id: item.id,
      name: item.stageName,
      avatar: item.avatar || item.mainPhotoUrl || 'https://picsum.photos/300/300',
      online: Math.random() > 0.5 // 新增：在线状态
    })) : []
  } catch (error) {
    console.error('加载新人裁教失败:', error)
    uni.showToast({ title: '加载新人裁教失败', icon: 'none' })
  }
}

const goCoachList = () => {
  uni.switchTab({
    url: '/pages/coach/list'
  })
}

const handleBannerClick = (item) => {
 return
}
const handleServiceClick = (item) => {
  // 根据服务类型设置默认筛选标签
  if (item.title === '沉稳耐心') {
    uni.setStorageSync('coachListDefaultTab', '沉稳')
    uni.setStorageSync('coachListTabTimestamp', Date.now())
    console.log('设置默认tab: 沉稳')
  } else if (item.title === '活跃热情') {
    uni.setStorageSync('coachListDefaultTab', '活跃')
    uni.setStorageSync('coachListTabTimestamp', Date.now())
    console.log('设置默认tab: 活跃')
  } else {
    uni.removeStorageSync('coachListDefaultTab')
    uni.removeStorageSync('coachListTabTimestamp')
  }
  // 延迟一点跳转，确保storage已保存
  setTimeout(() => {
    goCoachList()
  }, 50)
}
const viewAllHotCoach = () => goCoachList()
const viewAllNewCoach = () => goCoachList()

const goCoachDetail = (item) => {
  uni.navigateTo({
    url: `/subpkg/coach/detail?id=${item.id}`
  })
}

// 扫码
const toScan = () => {
  uni.navigateTo({
    url: '/pages/scan/index'
  })
}

const initData = async () => {
  // 开关未就绪时先等待，避免审核模式下误加载教练数据
  if (!reviewLoaded.value) {
    try {
      await configStore.initReviewMode()
    } catch (e) {
      // initReviewMode 内部已兜底
    }
  }
  // 审核模式不请求教练接口
  if (reviewMode.value) return
  loading.value = true
  await Promise.all([
    loadBanners(),
    loadHotCoaches(),
    loadNewCoaches()
  ])
  loading.value = false
}

onLoad(() => {
  initData()
})

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()

  // 导航栏内容高度（根据平台调整）
  const navContentHeight = isIOS() ? 88 : 80 // iOS通常需要更高的导航栏
  statusBarHeight.value = isIOS() ? 110 : systemInfo.statusBarHeight + 15 || 0
  let baseNavBarHeight = navContentHeight + 8
  // 小程序需要额外增加一些高度
  if (isMPWeixin()) {
    baseNavBarHeight += 60
  }
  navBarHeight.value = baseNavBarHeight

  // 检查登录状态并显示隐私弹窗（不阻塞数据加载）
  console.log(isLoggedIn(), '====isLoggedIn')
  if (!isLoggedIn()) {
    console.log(isLoggedIn(), '===============')
    openPrivacyDialogIfNeeded()
  }
})

onShow(() => {
  // 同步 tabBar 文案（setTabBarItem 仅 tab 页可调，启动时可能被跳过）
  configStore.syncTabBarLabel()
  if (!isLoggedIn()) {
    openPrivacyDialogIfNeeded()
  }
  initData()
  // 更新自定义 TabBar 选中状态
  updateCustomTabBar()
})
</script>

<style lang="scss" scoped>
.home-wrapper {
  min-height: 100vh;
  background-color: var(--bg-page);
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
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: var(--bg-page);
  z-index: 99;
  padding-top: 20rpx;

  .welcome-left {
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .greeting {
      color: var(--text-secondary);
      font-size: 26rpx;
      font-weight: 500;
    }

    .welcome-text {
      color: var(--text-primary);
      font-size: 36rpx;
      font-weight: 700;
      letter-spacing: -1rpx;
    }
  }

  .welcome-right {
    .scan-btn {
      width: 60rpx;
      height: 60rpx;
      background: var(--brand-light-bg);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1rpx solid rgba(0, 187, 136, 0.3);
      transition: all 0.3s ease;

      &:active {
        background: rgba(0, 187, 136, 0.3);
        transform: scale(0.95);
      }
    }
  }
}

/* 轮播图 */
.banner-section {
  margin: 0 30rpx 50rpx;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.3);

  .banner-swiper {
    height: 420rpx;
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
      color: var(--text-primary);
      font-size: 32rpx;
      font-weight: 700;
    }

    .section-desc {
      color: var(--text-tertiary);
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
    background: var(--bg-card);
    border: 1rpx solid var(--border-color);
    border-radius: 28rpx;
    padding: 28rpx;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: var(--card-shadow);

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
      box-shadow: var(--card-shadow);

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
        color: var(--text-primary);
        font-size: 34rpx;
        font-weight: 600;
      }

      .s-desc {
        color: var(--text-secondary);
        font-size: 24rpx;
      }
    }

    .service-arrow {
      width: 48rpx;
      height: 48rpx;
      background: var(--bg-secondary);
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
  padding: 0 30rpx 50rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;

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
          background: var(--brand-primary);
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
        color: var(--text-primary);
        font-size: 34rpx;
        font-weight: 700;
        letter-spacing: -0.5rpx;
      }

      .title-badge {
        background: var(--brand-light-bg);
        color: var(--brand-primary);
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
      background: var(--bg-secondary);
      border-radius: 50rpx;
      transition: all 0.3s ease;

      &:active {
        background: rgba(255,255,255,0.08);
      }

      text {
        color: var(--text-secondary);
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

/* 热门裁教 */
.hot-coach-list {
  display: inline-flex;

  .hot-coach-card {
    width: 320rpx;
    margin-right: 24rpx;
    background: var(--bg-card);
    border-radius: 32rpx;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: var(--card-shadow);
    border: 1rpx solid var(--border-color);
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
      height: 320rpx;
      overflow: hidden;

      .hot-avatar {
        width: 100%;
        height: 100%;
        background-color: var(--bg-secondary);
        transition: transform 0.4s ease;
      }

      &:active .hot-avatar {
        transform: scale(1.08);
      }

      .online-status {
        position: absolute;
        top: 16rpx;
        left: 16rpx;
        background: var(--online-bg);
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
            background: var(--online-dot);
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
          color: var(--text-primary);
          font-size: 20rpx;
          font-weight: 600;
        }
      }

      .score-tag {
        position: absolute;
        bottom: 16rpx;
        right: 16rpx;
        background: var(--online-bg);
        backdrop-filter: blur(10rpx);
        padding: 6rpx 12rpx;
        border-radius: 50rpx;
        display: flex;
        align-items: center;
        gap: 6rpx;
        border: 1rpx solid rgba(255, 184, 0, 0.25);

        text {
          color: var(--star-color);
          font-size: 22rpx;
          font-weight: 700;
        }
      }

      .level-tag {
        position: absolute;
        top: 16rpx;
        right: 16rpx;
        background: linear-gradient(135deg, #F59E0B, #D97706);
        color: #fff;
        font-size: 18rpx;
        font-weight: 700;
        padding: 4rpx 10rpx;
        border-radius: 20rpx;
        box-shadow: 0 2rpx 8rpx rgba(245, 158, 11, 0.3);
      }
    }

    .hot-info {
      padding: 24rpx;

      .hot-name {
        color: var(--text-primary);
        font-size: 32rpx;
        font-weight: 700;
        margin-bottom: 8rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
      }

      .hot-desc {
        color: var(--text-secondary);
        font-size: 22rpx;
        line-height: 1.4;
        margin-bottom: 12rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .hot-stats {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12rpx;

        .stat-count {
          color: var(--text-secondary);
          font-size: 22rpx;
          font-weight: 500;
        }

        .order-icon {
          width: 36rpx;
          height: 36rpx;
          background: var(--brand-light-bg);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .price-info {
        display: flex;
        align-items: baseline;
        gap: 4rpx;

        .price-text {
          color: var(--brand-primary);
          font-size: 36rpx;
          font-weight: 800;
        }

        .price-unit {
          color: var(--text-secondary);
          font-size: 22rpx;
          font-weight: 500;
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
      width: 140rpx;
      height: 140rpx;
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
        border: 4rpx solid var(--bg-page);
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
        border: 2rpx solid var(--bg-page);
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

      .new-online-status {
        position: absolute;
        bottom: 8rpx;
        left: 50%;
        transform: translateX(-50%);
        z-index: 4;
      }

      .online-dot {
        width: 16rpx;
        height: 16rpx;
        background: #00BB88;
        border-radius: 50%;
        border: 1rpx solid var(--bg-page);
        box-shadow: 0 0 8rpx rgba(0, 187, 136, 0.6);
      }
    }

    .new-name {
      color: var(--text-primary);
      font-size: 28rpx;
      font-weight: 600;
      max-width: 140rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
      margin-bottom: 6rpx;
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

/* 开关加载中的中性骨架 */
.home-skeleton {
  padding: 0 30rpx 40rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .skeleton-card {
    background: var(--bg-card);
    border: 1rpx solid var(--border-color);
    border-radius: 24rpx;
    padding: 28rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    box-shadow: var(--card-shadow);
    animation: skeletonPulse 1.4s ease-in-out infinite;

    .skeleton-line {
      height: 24rpx;
      border-radius: 12rpx;
      background: var(--bg-secondary);

      &.title {
        width: 50%;
        height: 30rpx;
      }

      &.short {
        width: 70%;
      }
    }
  }
}

@keyframes skeletonPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

.safe-bottom {
  height: 40rpx;
}
</style>
