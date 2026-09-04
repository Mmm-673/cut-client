
<template>
  <view class="detail-container" :class="themeClass">
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 头部导航栏 -->
      <view class="nav-bar">
        <view class="nav-action" @click="handleToggleFavorite">
          <uni-icons :type="isFavorite ? 'heart-filled' : 'heart'" size="20" :color="isFavorite ? '#ff4d4f' : '#fff'"></uni-icons>
        </view>
      </view>

      <!-- 头部信息区域 -->
      <coach-detail-header
          :coach="coachInfo"
          :show-reward="showRewardBtn"
          @reward="goToReward"
      />


      <!-- 服务项目 -->
      <view class="section" >
        <view class="section-title">
          <uni-icons type="list" size="18" color="#00c896"></uni-icons>
          <text>服务项目</text>
        </view>
        <view class="service-list">
          <service-item-card
              v-for="(service, index) in services"
              :key="service.id || index"
              :service="service"
              :is-selected="selectedService?.id === service.id"
              :can-book="canBookService(service)"
              @select="selectService"
          />
        </view>
      </view>

      <!-- 个人介绍 -->
      <view class="section">
        <view class="section-title">
          <uni-icons type="person" size="18" color="#00c896"></uni-icons>
          <text>个人介绍</text>
        </view>
        <view class="intro-content">
          <text>{{ coachInfo.introduction || coachInfo.intro }}</text>
        </view>
      </view>

      <!-- 教学视频（App/H5 使用 DomVideoPlayer，小程序暂不支持） -->
      <!-- #ifdef APP-PLUS || H5 -->
      <view class="section" v-if="coachInfo.videoUrl && videoVisible">
        <view class="section-title">
          <uni-icons type="videocam" size="18" color="#00c896"></uni-icons>
          <text>教学视频</text>
        </view>
        <view class="video-wrap">
          <DomVideoPlayer
            v-if="coachInfo.videoUrl"
            ref="videoPlayerRef"
            :src="coachInfo.videoUrl"
            :autoplay="false"
            :controls="true"
            :loop="false"
            object-fit="contain"
            :is-loading="false"
            @play="onVideoPlay"
            @pause="onVideoPause"
            @ended="onVideoEnded"
            @error="onVideoError"
            @canplay="onVideoCanPlay"
            @loadedmetadata="onVideoLoadedMeta"
            @timeupdate="onVideoTimeUpdate"
            @durationchange="onVideoDurationChange"
            @fullscreenchange="onVideoFullscreenChange"
            class="coach-video-player"
          />
        </view>
      </view>
      <!-- #endif -->

      <!-- 个人相册 -->
      <view class="section" v-if="albumList.length > 0">
        <view class="section-title">
          <uni-icons type="image" size="18" color="#00c896"></uni-icons>
          <text>个人相册 ({{ albumList.length }})</text>
        </view>
        <scroll-view class="album-scroll" scroll-x="true" :show-scrollbar="false">
          <view class="album-grid">
            <image
                class="album-item"
                v-for="(item, index) in albumList"
                :key="item"
                :src="item"
                mode="aspectFill"
                @click="previewImage(index)"
                ></image>
          </view>
        </scroll-view>
      </view>

      <!-- 用户评价 -->
      <review-section
          v-if="isUserLoggedIn && reviewList.length > 0"
          :reviews="reviewList"
          :rating="coachInfo.overallScore || coachInfo.rating"
          @image-click="({ reviewIndex, index: imgIndex }) => previewReviewImage(reviewIndex, imgIndex)"
      />

      <!-- 未登录时显示评价提示 -->
      <view class="section" v-else-if="!isUserLoggedIn">
        <view class="section-title">
          <uni-icons type="star" size="18" color="#00c896"></uni-icons>
          <text>用户评价</text>
        </view>
        <view class="login-tip-box" @click="showLoginDialog">
          <uni-icons type="locked" size="40" color="#666"></uni-icons>
          <text class="login-tip-text">登录后查看用户评价</text>
        </view>
      </view>

      <!-- 底部安全区域留白 -->
      <view class="safe-area-bottom"></view>
    </view>


    <!-- 底部操作栏 -->
    <coach-book-bar
        :price="bottomPrice"
        :price-unit="bottomPriceUnit"
        :show-qi="bottomShowQi"
        :can-book="canBookNow"
        @book="bookNow"
    />
  </view>

  <!-- 图片查看器 -->
  <ImageViewer
    :visible="showImageViewer"
    :images="viewerImages"
    :current="viewerCurrent"
    @close="showImageViewer = false"
  />
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { onLoad, onShow, onHide, onUnload } from "@dcloudio/uni-app"
import { getCoachDetail, toggleCoachFavorite, getCoachReviews } from '@/api/billiard/coach'
import { createOrder } from '@/api/billiard/order'
import { getRewardSwitch } from '@/api/billiard/user'
import { formatPrice, extractCoachId } from '@/utils/common'
import { isLoggedIn } from '@/utils/token'
import { guardReviewEntry, isReviewMode } from '@/utils/review'
import { isFixedPricing, canBookService as checkCanBookService, getPriceUnit } from '@/utils/pricing'
import { useThemeStore, useCoachStore, useBookingStore } from '@/store'
import { SERVICE_TYPE } from '@/constants/serviceType'
import { TIME_MS } from '@/constants/time'
import CoachDetailHeader from '@/components/coach-detail-header/coach-detail-header.vue'
import ServiceItemCard from '@/components/service-item-card/service-item-card.vue'
import ReviewSection from '@/components/review-section/review-section.vue'
import CoachBookBar from '@/components/coach-book-bar/coach-book-bar.vue'

const themeStore = useThemeStore()
const coachStore = useCoachStore()
const bookingStore = useBookingStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 图片查看器
const showImageViewer = ref(false)
const viewerImages = ref([])
const viewerCurrent = ref(0)

const previewImage = (index) => {
  if (albumList.value.length > 0) {
    viewerImages.value = albumList.value
    viewerCurrent.value = index
    showImageViewer.value = true
  }
}

const previewReviewImage = (reviewIndex, imageIndex) => {
  const review = reviewList.value[reviewIndex]
  if (review && review.images && review.images.length > 0) {
    viewerImages.value = review.images
    viewerCurrent.value = imageIndex
    showImageViewer.value = true
  }
}

// 状态栏和安全区域高度
const statusBarHeight = ref(0)
const safeAreaBottom = ref(0)
const coachId = ref(null)
const loading = ref(false)

// 下拉刷新状态
const refreshing = ref(false)
const isFavorite = ref(false)
// 是否显示按钮
const showRewardBtn = ref(false)
// 登录状态
const isUserLoggedIn = ref(isLoggedIn())

// 教练信息
const coachInfo = reactive({
  id: null,
  name: '',
  stageName: '',
  avatar: '',
  cover: '',
  level: 0,
  levelText: '',
  rating: 4.9,
  overallScore: 4.9,
  orderCount: 0,
  serviceCount: 0,
  distance: '',
  price: 0,
  tags: [],
  intro: '',
  introduction: '',
  serviceStatus: 0,
  videoUrl: '',
  videoFileName: '',
  videoFileSize: 0,
  videoMimeType: ''
})

// #ifdef APP-PLUS || H5
import DomVideoPlayer from '@/components/DomVideoPlayer/DomVideoPlayer.vue'
// #endif

// 视频播放器可见性（错误时隐藏）
const videoVisible = ref(true)
const videoPlayerRef = ref(null)

// 视频播放错误处理
const onVideoError = () => {
  uni.showToast({ title: '视频加载失败', icon: 'none' })
  videoVisible.value = false
}

const onVideoPlay = () => {
}

const onVideoPause = () => {
}

const onVideoEnded = () => {
  // 视频播放结束
}

const onVideoCanPlay = () => {
  // 视频可以播放了
}

const onVideoLoadedMeta = (data) => {
  // 视频元数据加载完成
}

const onVideoTimeUpdate = (time) => {
  // 播放进度更新
}

const onVideoDurationChange = (duration) => {
  // 视频总时长
}

// 暂停视频播放
const pauseVideo = () => {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.pause()
  }
}

// 视频全屏状态（仅供事件监听使用）
const isVideoFullscreen = ref(false)

const onVideoFullscreenChange = (isFull) => {
  isVideoFullscreen.value = isFull
}

// 服务项目
const services = ref([])

// 相册列表
const albumList = ref([])

// 评价列表
const reviewList = ref([])

// 等级映射
const levelMap = {
  0: '初级',
  1: '中级',
  2: '高级',
  3: '星级'
}

const getLevelText = (level) => {
  if (typeof level === 'string') {
    return level
  }
  return levelMap[level] || '初级教练'
}

// 格式化距离显示
const formatDistance = (distance) => {
  if (distance === null || distance === undefined || distance === '') {
    return ''
  }
  if (typeof distance === 'number') {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
  }
  return distance
}

// 获取主图（从 photos 数组中找 isMain=true 的）
const getMainPhoto = (photos) => {
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return null
  }
  const mainPhoto = photos.find(p => p.isMain === true || p.is_main === true)
  if (mainPhoto) {
    return mainPhoto.photoUrl || mainPhoto.url || mainPhoto
  }
  // 如果没有主图，返回第一张
  const first = photos[0]
  return first.photoUrl || first.url || first
}

// 加载教练详情
const loadCoachData = async () => {
  if (!coachId.value) return

  // 重置视频可见状态
  videoVisible.value = true

  loading.value = true
  try {
    const res = await getCoachDetail({ id: coachId.value })
    const data = res.data || {}

    // 更新收藏状态
    isFavorite.value = data.favorite || false

    // 更新教练信息 - 完全按 API 文档字段处理
    Object.assign(coachInfo, {
      id: data.id,
      name: data.name || data.stageName,
      stageName: data.stageName || data.name,
      // 主图用 photos 中的 isMain=true 的图，或者用 avatar/cover 兜底
      avatar: data.avatar || getMainPhoto(data.photos) ||  '/static/default-avatar.png',
      cover: data.cover || getMainPhoto(data.photos) || '/static/images/profile.jpg',
      level: data.level ?? 0,
      levelText: getLevelText(data.level),
      rating: data.overallScore || data.rating || 4.9,
      overallScore: data.overallScore || data.rating || 4.9,
      orderCount: data.serviceCount || data.orderCount || 0,
      serviceCount: data.serviceCount || data.orderCount || 0,
      distance: formatDistance(data.distance),
      price: data.hourlyPrice || data.price || 0,
      tags: data.tags || [],
      intro: data.introduction || data.intro || '这位裁教很神秘，什么都没写~',
      introduction: data.introduction || data.intro || '这位裁教很神秘，什么都没写~',
      serviceStatus: data.serviceStatus ?? 0,
      videoUrl: data.videoUrl || '',
      videoFileName: data.videoFileName || '',
      videoFileSize: data.videoFileSize || 0,
      videoMimeType: data.videoMimeType || ''
    })


    const totalServiceCount = data.serviceCount || data.orderCount || 0

    const serviceBaseList = [
      {
        id: 1,
        type: 1,
        name: '台球指导',
        desc: '提供台球基础姿势校正、击球线路规划及进阶战术对练服务。由专业助教协助提升台球技能，打造标准化的体育健身对练体验。',
        sales: 0,
        hot: true,
      },
      {
        id: 2,
        type: 2,
        name: '潮玩领航',
        desc: '提供本地特色店铺打卡指引与特色路线规划服务。由本地达人引导体验特色场景，探索城市优质吃喝玩乐打卡点。',
        sales: 0,
        hot: false,
      },
      {
        id: 3,
        type: 3,
        name: '酒艺品鉴',
        desc: '提供酒类历史文化宣讲、酿造工艺介绍及餐酒搭配指导。侧重酒文化知识分享与品鉴技巧交流，传播健康高雅的酒道文化。',
        sales: 0,
        hot: false,
      },
      {
        id: 4,
        type: 4,
        name: '影视赏析',
        desc: '提供经典影视作品的背景解读、艺术风格赏析与剧本创作探讨。通过线下观影沙龙形式，开展光影艺术交流与影视文化导读。',
        sales: 0,
        hot: false,
      }
    ]

    const availableServices = data.serviceItemList
        .map(item => {
          const localConfig = serviceBaseList.find(
              service => service.type === item.serviceType
          )
          if (!localConfig) return null
          return {
            ...localConfig,
            ...item,
            type: item.serviceType,
            name: item.serviceName || localConfig.name,
            // 新版以 price 字段为准，兼容旧数据兜底
            price: item.price != null ? item.price : item.hourlyPrice,
            // 兼容旧数据：没有 pricingMode 时根据 serviceType 默认判断
            pricingMode: item.pricingMode || (item.serviceType === SERVICE_TYPE.BILLIARD_COACH ? 'HOURLY' : 'HOURLY'),
            priceUnit: item.priceUnit || (item.serviceType === SERVICE_TYPE.BILLIARD_COACH ? '小时' : '小时')
          }
        })
        .filter(Boolean)

    const serviceCount = availableServices.length
    if (serviceCount > 0) {
      const baseSales = Math.floor(totalServiceCount / serviceCount)
      const remainder = totalServiceCount % serviceCount

      availableServices.forEach((service, index) => {
        service.sales = baseSales + (index < remainder ? 1 : 0)
      })
    }

    services.value = availableServices

    // 相册（从 photos 数组中提取 photoUrl）
    if (data.photos && Array.isArray(data.photos)) {
      albumList.value = data.photos
          .sort((a, b) => (a.sort || 0) - (b.sort || 0))
          .map(p => p.photoUrl || p.url || p)
          .filter(Boolean)
    } else if (data.albumList && Array.isArray(data.albumList)) {
      albumList.value = data.albumList
    } else {
      // 默认相册（占位）
      albumList.value = [
        'https://picsum.photos/300/300?random=1',
        'https://picsum.photos/300/300?random=2',
        'https://picsum.photos/300/300?random=3'
      ]
    }

    // 加载真实评价数据
    loadReviews()
  } catch (error) {
    console.error('加载教练详情失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载评价列表
const loadReviews = async () => {
  if (!coachId.value) return
  try {
    const res = await getCoachReviews({
      coachId: coachId.value,
      pageNo: 1,
      pageSize: 50 // 加载更多评价
    })
    const data = res.data || {}
    const list = data.list || data.records || data.rows || []
    // 转换字段格式
    reviewList.value = list.map(item => ({
      id: item.reviewId,
      name: item.userNickname || '匿名用户',
      avatar: item.userAvatar || '/static/default-avatar.png',
      rating: item.star,
      time: formatTime(item.createTime),
      content: item.content || '',
      tags: item.tags || [],
      images: item.images || []
    }))
  } catch (error) {
    console.error('加载评价列表失败:', error)
    reviewList.value = []
  }
}

// 格式化时间戳
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadCoachData()
}


// 收藏/取消收藏
const handleToggleFavorite = async () => {
  if (!coachInfo.id) {
    uni.showToast({ title: '教练信息加载中', icon: 'none' })
    return
  }
  // 乐观更新：先更新UI
  const wasFavorite = isFavorite.value
  isFavorite.value = !wasFavorite

  try {
    uni.showLoading({ title: '处理中...' })
    const res = await toggleCoachFavorite({ coachId: coachInfo.id })
    isFavorite.value = res.data
    uni.showToast({
      title: isFavorite.value ? '已收藏' : '已取消收藏',
      icon: 'none'
    })
  } catch (error) {
    console.error('收藏操作失败:', error)
    // 失败回滚
    isFavorite.value = wasFavorite
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}

// 跳转到页面
const goToReward = () => {
  isUserLoggedIn.value = isLoggedIn()
  if (!isUserLoggedIn.value) {
    showLoginDialog()
    return
  }

  // #ifdef MP-WEIXIN
  uni.showToast({
    title: '微信小程序暂不支持此功能',
    icon: 'none'
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.navigateTo({
    url: '/subpkg/coach/reward?coachId=' + coachInfo.id
  })
  // #endif
}

// 选中的服务
const selectedService = ref(null)

// 底部展示价格
const bottomPrice = computed(() => {
  if (selectedService.value && selectedService.value.price != null) {
    return selectedService.value.price
  }
  return coachInfo.price || 0
})

// 底部展示价格单位
const bottomPriceUnit = computed(() => {
  if (selectedService.value) {
    return getPriceUnit(selectedService.value)
  }
  return '小时'
})

// 底部是否显示"起"字（小时价显示，固定价不显示）
const bottomShowQi = computed(() => {
  if (selectedService.value) {
    return !isFixedPricing(selectedService.value.pricingMode)
  }
  return true // 兜底按小时价，显示"起"
})

// 当前选中的服务是否可预约
const canBookNow = computed(() => {
  if (!selectedService.value) return true // 没选时不置灰，点击时会提示选择
  return checkCanBookService(selectedService.value)
})

// 判断服务是否可预约（模板中用）
const canBookService = (service) => checkCanBookService(service)

// 选择服务
const selectService = (service) => {
  if (!checkCanBookService(service)) {
    uni.showToast({ title: '该服务暂不可预约', icon: 'none' })
    return
  }
  selectedService.value = service
  uni.showToast({
    title: '已选择' + service.name,
    icon: 'none'
  })
}



// 显示登录弹窗
const showLoginDialog = () => {
  uni.showModal({
    title: '温馨提示',
    content: '登录后可以查看更多精彩内容，是否登录？',
    confirmText: '去登录',
    cancelText: '稍后',
    success: (res) => {
      if (res.confirm) {
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1]
        uni.setStorageSync('loginRedirectPage', currentPage.route)
        // 如果是详情页，还需要保存id参数
        if (currentPage.options && currentPage.options.id) {
          uni.setStorageSync('loginRedirectParams', currentPage.options)
        }
        uni.navigateTo({
          url: '/pages/login/index'
        })
      }
    }
  })
}

// 立即预约
const bookNow = async () => {
  // 检查登录状态
  isUserLoggedIn.value = isLoggedIn()
  if (!isUserLoggedIn.value) {
    showLoginDialog()
    return
  }

  if (!selectedService.value) {
    uni.showToast({ title: '请先选择服务项目', icon: 'none' })
    return
  }

  if (!checkCanBookService(selectedService.value)) {
    uni.showToast({ title: '该服务暂不可预约', icon: 'none' })
    return
  }

  // 保存教练信息和选中的服务到 Store（同时同步到 Storage 作为降级）
  coachStore.setSelectedCoach({
    ...coachInfo,
    selectedService: selectedService.value
  })

  // 计算默认预约时间（1小时后）
  const bookingTime = Date.now() + TIME_MS.HOUR

  // 格式化时间显示
  const date = new Date(bookingTime)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const weekDay = weekDays[date.getDay()]
  const timeText = `${weekDay} ${month}.${day} ${hour}:${minute}`

  // 判断是否为固定价模式
  const isFixed = isFixedPricing(selectedService.value.pricingMode)

  // 构建订单初始化数据
  const orderData = {
    coachInfo: coachInfo,
    selectedService: selectedService.value,
    serviceType: selectedService.value.type,
    bookingTime: bookingTime,
    timeText: timeText,
    pricingMode: selectedService.value.pricingMode
  }

  // 小时价模式才设置时长和数量
  if (!isFixed) {
    let serviceDuration = 120 // 默认2小时
    let quantity = 2

    if (selectedService.value.type === 2) {
      // 达人带路（旧版小时价）：5小时
      serviceDuration = 300
      quantity = 5
    } else if (selectedService.value.type === 3) {
      // 酒文化讲解（旧版小时价）：7小时
      serviceDuration = 420
      quantity = 7
    } else if (selectedService.value.type === 4) {
      // 影视讲解分享（旧版小时价）：7小时
      serviceDuration = 420
      quantity = 7
    }

    orderData.serviceDuration = serviceDuration
    orderData.quantity = quantity
  }

  // 保存订单初始化数据到 Store（同时同步到 Storage 作为降级）
  bookingStore.setOrderInitData(orderData)

  // 判断服务类型：1=台球陪练(需要选择球厅)，其他=跳转到确认订单页面
  const isBilliardsService = selectedService.value.type === 1

  if (isBilliardsService) {
    // 台球陪练，需要选择球厅
    uni.navigateTo({ url: '/subpkg/booking/hall' })
  } else {
    // 其他服务类型，直接跳转到确认订单页面
    uni.redirectTo({ url: '/subpkg/booking/confirm' })
  }
}

// 加载是否显示按钮
const loadCountdownEnabled = async () => {
  try {
    const res = await getRewardSwitch()
    showRewardBtn.value = res.data === true
  } catch (error) {
    console.error('加载按钮状态失败:', error)
    showRewardBtn.value = false
  }
}

// 获取页面参数
onLoad((options) => {
  // 审核模式入口守卫
  if (guardReviewEntry()) return
  if (options.id) {
    coachId.value = parseInt(options.id)
  } else if (options.coachId) {
    coachId.value = parseInt(options.coachId)
  } else if (options.scene || options.q) {
    // 微信扫一扫直接进入本页时，教练ID在 scene（小程序码）或 q（普通链接二维码）参数里
    const parsed = extractCoachId(options.scene || options.q)
    if (parsed) coachId.value = parseInt(parsed)
  }
})

onShow(() => {
  // 页面显示时更新登录状态
  isUserLoggedIn.value = isLoggedIn()
  // 每次页面显示时都重新加载数据，确保显示最新内容
  if (coachId.value) {
    loadCoachData()
  }
  // 重新加载按钮状态
  loadCountdownEnabled()
})

onMounted(() => {
  // 审核模式下已被 onLoad 守卫拦截，不再加载数据
  if (isReviewMode()) return
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
  safeAreaBottom.value = systemInfo.safeAreaInsets?.bottom || 0

  // 加载数据
  if (coachId.value) {
    loadCoachData()
  }
  // 加载是否显示按钮
  loadCountdownEnabled()
})

onHide(() => {
  // #ifdef APP-PLUS || H5
  pauseVideo()
  // #endif
})

onUnload(() => {
  // #ifdef APP-PLUS || H5
  pauseVideo()
  // #endif
})
</script>

<style lang="scss" scoped>
.detail-container {
  min-height: 100vh;
  background-color: var(--bg-page);
  position: relative;
}

.content-wrapper {
  min-height: calc(100vh - 120rpx); /* 减去底部栏高度 */
  background-color: var(--bg-page);
  padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx); /* 确保内容不会被底部栏遮挡 */
}

/* 头部导航栏 */
.nav-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 90rpx;
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 30rpx;
  padding-top: calc(constant(safe-area-inset-top) + 20rpx);
  padding-top: calc(env(safe-area-inset-top) + 20rpx);
  z-index: 10;

  .nav-back, .nav-action {
    width: 60rpx;
    height: 60rpx;
    background: rgba(0,0,0,0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-actions {
    display: flex;
    gap: 20rpx;
  }
}

.scroll-view {
  background-color: var(--bg-page);
}

.section {
  padding: 48rpx 40rpx;

  .section-title {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 32rpx;
    font-size: 36rpx;
    font-weight: 600;
    color: var(--text-primary);

    .see-more {
      margin-left: auto;
      font-size: 28rpx;
      font-weight: 400;
      color: var(--text-tertiary);
    }

    .rating-text {
      margin-left: auto;
      font-size: 32rpx;
      font-weight: 600;
      color: #ffc107;
    }
  }

  .intro-content {
    background-color: var(--bg-card);
    border-radius: 32rpx;
    padding: 32rpx;

    text {
      font-size: 28rpx;
      color: var(--text-secondary);
      line-height: 1.8;
    }
  }

  .video-wrap {
    background-color: var(--bg-card);
    border-radius: 32rpx;
    padding: 24rpx;
    margin-top: 24rpx;
    overflow: hidden;
    position: relative;

    .coach-video-player {
      width: 100%;
      height: 380rpx;
      border-radius: 16rpx;
      display: block;
      background-color: #000;
    }
  }

  .login-tip-box {
    background-color: var(--bg-card);
    border-radius: 32rpx;
    padding: 80rpx 32rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24rpx;

    .login-tip-text {
      font-size: 28rpx;
      color: var(--text-tertiary);
    }
  }
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.album-scroll {
  width: 100%;
  //margin-left: -10rpx;
  padding: 0 10rpx;

  .album-grid {
    display: inline-flex;
    flex-direction: row;
    gap: 20rpx;
    white-space: nowrap;

    .album-item {
      width: 200rpx;
      height: 200rpx;
      border-radius: 96;
      background-color: var(--bg-secondary);
      border-color: rgba(0,0,0,0.1);
    }
  }
}

/* 适配底部安全区 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}

</style>
