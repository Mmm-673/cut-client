<template>
  <view class="home-wrapper" :class="themeClass">
    <!-- 滚动区域 -->
    <scroll-view scroll-y class="scroll-container" show-scrollbar="false" :style="{ paddingTop: navBarHeight + 'rpx', height: `calc(100vh)` }">
      <!-- 欢迎语 -->
      <welcome-bar :welcome-text="welcomeText" @scan-click="toScan" />

      <!-- 轮播图 -->
      <home-banner :banners="bannerList" @item-click="handleBannerClick" />

      <!-- 审核模式：球厅预约 -->
      <review-venue v-if="showVenueSection" />

      <!-- 开关加载中的中性骨架（避免泄露教练内容） -->
      <home-skeleton v-if="!reviewLoaded" :count="3" />

      <!-- 热门裁教 -->
      <view class="section-container" v-if="showCoachSections">
        <home-section-header title="热门裁教" badge="TOP" @more="viewAllHotCoach" />

        <scroll-view class="scroll-view-h" scroll-x="true" show-scrollbar="false">
          <view class="hot-coach-list">
            <hot-coach-card
              v-for="item in hotCoachList"
              :key="item.id"
              :coach="item"
              @click="goCoachDetail"
            />
          </view>
        </scroll-view>
      </view>

      <!-- 新人推荐 -->
      <view class="section-container last-section" v-if="showCoachSections">
        <home-section-header title="新人精选" badge="NEW" badge-color="blue" @more="viewAllNewCoach" />

        <view class="new-coach-section">
          <scroll-view class="scroll-view-h" scroll-x="true" show-scrollbar="false">
            <view class="new-coach-list">
              <new-coach-avatar
                  v-for="item in newCoachList"
                  :key="item.id"
                  :coach="item"
                  @click="goCoachDetail"
              />
            </view>
          </scroll-view>
        </view>
      </view>

<!--      <view class="safe-bottom"></view>-->
    </scroll-view>

    <!-- 重大通知弹窗 -->
    <notify-modal
      :visible="showNotifyModal"
      :title="currentNotify.title"
      :description="currentNotify.summary"
      @cancel="closeNotifyModal('cancel')"
      @confirm="closeNotifyModal('confirm')"
    />

    <!-- #ifdef APP-PLUS -->
    <ios-privacy-dialog ref="privacyDialogRef" @agree="handlePrivacyAgreed" />
    <!-- #endif -->
  </view>
</template>

<script setup>
import {ref, computed, onMounted, nextTick, watch} from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getNewCoachList, getHotCoachList, getBannerList } from '@/api/billiard/coach'
import { getNotificationPage, markAsRead } from '@/api/billiard/notification'
import { shouldShowIosPrivacy, hasPrivacyRefused } from '@/utils/privacy'
import { isIOS, isMPWeixin } from '@/utils/platform'
import { isLoggedIn } from '@/utils/token'
import wsManager from '@/utils/websocket'
import {
  useConfigStore, useThemeStore
} from '@/store'
import { usePageTheme } from '@/composables/usePageTheme'
import IosPrivacyDialog from '@/components/ios-privacy-dialog/ios-privacy-dialog.vue'
import NewCoachAvatar from '@/components/new-coach-avatar/new-coach-avatar.vue'
import HotCoachCard from '@/components/hot-coach-card/hot-coach-card.vue'
import HomeBanner from '@/components/home-banner/home-banner.vue'
import HomeSectionHeader from '@/components/home-section-header/home-section-header.vue'
import WelcomeBar from '@/components/welcome-bar/welcome-bar.vue'
import HomeSkeleton from '@/components/home-skeleton/home-skeleton.vue'
import NotifyModal from '@/components/notify-modal/notify-modal.vue'

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
    hotCoachList.value = Array.isArray(list) ? list.map(item => {
      // 价格取值：优先 serviceItemList[0].price，兜底 hourlyPrice / hourlyRate / price
      const firstService = item.serviceItemList?.[0]
      let displayPrice = 0
      let priceUnit = '小时'
      if (firstService && firstService.price != null) {
        displayPrice = (firstService.price / 100).toFixed(2)
        priceUnit = firstService.priceUnit || '小时'
      } else {
        const rawPrice = item.price ?? item.hourlyPrice ?? item.hourlyRate
        displayPrice = rawPrice ? (rawPrice / 100).toFixed(2) : '0.00'
      }
      return {
        id: item.id,
        name: item.stageName,
        avatar: item.avatar || item.mainPhotoUrl || 'https://picsum.photos/300/300',
        score: item.overallScore || 5.0,
        orderCount: item.serviceCount || 0,
        online: Math.random() > 0.3,
        level: item.level || '资深',
        displayPrice,
        priceUnit
      }
    }) : []
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
  } else if (item.title === '活跃热情') {
    uni.setStorageSync('coachListDefaultTab', '活跃')
    uni.setStorageSync('coachListTabTimestamp', Date.now())
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

// ==================== 重大通知弹窗 ====================
const notificationQueue = ref([])
const showNotifyModal = ref(false)
const currentNotify = ref({ id: 0, title: '', summary: '' })
let wsUnsubscribe = null

// 拉取未读重大通知
const fetchMajorNotifications = async () => {
  if (!isLoggedIn()) return
  try {
    const res = await getNotificationPage({
      pageNo: 1,
      pageSize: 20,
      readStatus: 0
    })
    const records = res.data?.list || res.data?.records || []
    // 筛选 type=1 重大通知，且未在去重池中
    const majorList = records.filter(item => {
      const isMajor = item.type === 1
      const notProcessed = !wsManager.hasProcessed(item.id)
      return isMajor && notProcessed
    })
    if (majorList.length > 0) {
      majorList.forEach(item => {
        wsManager.markProcessed(item.id)
        notificationQueue.value.push(item)
      })
      showNextNotification()
    }
  } catch (e) {
    console.error('[首页] 获取重大通知失败', e)
  }
}

// 显示下一条通知弹窗
const showNextNotification = () => {
  if (showNotifyModal.value) return
  if (notificationQueue.value.length === 0) return

  const item = notificationQueue.value.shift()
  currentNotify.value = item
  showNotifyModal.value = true
}

// 关闭通知弹窗
const closeNotifyModal = async (action) => {
  const item = currentNotify.value

  // 标记已读
  try {
    await markAsRead(item.id)
  } catch (e) {
    console.error('[首页] 标记通知已读失败', e)
  }

  showNotifyModal.value = false

  if (action === 'confirm') {
    // 跳通知详情页
    setTimeout(() => {
      uni.navigateTo({
        url: `/subpkg/mine/notification/detail?id=${item.id}`
      })
    }, 300)
  }

  // 继续弹下一条
  setTimeout(() => {
    showNextNotification()
  }, 350)
}

// 监听 WebSocket 推送的重大通知
const listenMajorNotification = () => {
  if (wsUnsubscribe) return
  wsUnsubscribe = wsManager.onMajorNotification((notification) => {
    const item = {
      id: notification.notificationId,
      type: notification.notificationType,
      title: notification.title,
      summary: notification.summary,
      coverUrl: notification.coverUrl,
      publishTime: notification.publishTime,
      actionType: notification.actionType,
      actionValue: notification.actionValue
    }
    notificationQueue.value.push(item)
    showNextNotification()
  })
}
// ====================================================

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
  // 首次加载拉取未读重大通知
  fetchMajorNotifications()
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
  if (!isLoggedIn()) {
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

  // 监听 WebSocket 推送（只注册一次）
  listenMajorNotification()
  // 如果队列有待弹窗且当前没在展示，继续弹
  if (notificationQueue.value.length > 0 && !isShowingNotification.value) {
    showNextNotification()
  }
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

/* 通用章节 */
.section-container {
  padding: 0 30rpx 50rpx;
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
}

.safe-bottom {
  height: 40rpx;
}

</style>
