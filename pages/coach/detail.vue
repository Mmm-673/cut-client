<template>
  <view class="detail-container">
    <!-- 头部导航栏 -->
    <view class="nav-bar">
      <view class="nav-action" @click="handleToggleFavorite">
        <uni-icons :type="isFavorite ? 'heart-filled' : 'heart'" size="20" :color="isFavorite ? '#ff4d4f' : '#fff'"></uni-icons>
      </view>
    </view>

    <!-- 下拉刷新区域 -->
    <scroll-view
        scroll-y
        class="scroll-view"
        :style="{ height: scrollViewHeight + 'px' }"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
    >
      <!-- 头部信息区域 -->
      <view class="header-section">
        <image class="header-bg" :src="coachInfo.cover || '/static/default-cover.jpg'" mode="aspectFill"></image>
        <view class="header-overlay"></view>
        <view class="header-content">
          <image class="avatar" :src="coachInfo.avatar || '/static/default-cover.jpg'" mode="aspectFill"></image>
          <view class="info">
            <view class="name-row">
              <text class="name">{{ coachInfo.stageName || coachInfo.name }}</text>
              <view class="tag level" :class="'level-' + coachInfo.level">
                {{ getLevelText(coachInfo.level) }}
              </view>
            </view>
            <view class="stats-row">
              <view class="stat-item">
                <uni-icons type="star" size="14" color="#ffc107"></uni-icons>
                <text>{{ coachInfo.overallScore || coachInfo.rating }}</text>
              </view>
              <view class="stat-item">
                <text>{{ coachInfo.serviceCount || coachInfo.orderCount }}单</text>
              </view>
              <view class="stat-item">
                <text>{{ coachInfo.distance }}</text>
              </view>
            </view>
            <view class="tags-row">
              <view class="tag" v-for="(tag, index) in coachInfo.tags" :key="index">{{ tag }}</view>
            </view>
          </view>
          <view class="reward-btn" @click="goToReward">
            <uni-icons type="gift" size="16" color="#ffc107"></uni-icons>
            <text>打赏</text>
          </view>
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

      <!-- 服务项目 -->
      <view class="section">
        <view class="section-title">
          <uni-icons type="list" size="18" color="#00c896"></uni-icons>
          <text>服务项目</text>
        </view>
        <view class="service-list">
          <view class="service-item" :class="{selected: selectedService?.id === service.id}" v-for="(service, index) in services" :key="index">
            <view class="service-left">
              <view class="service-name-row">
                <text class="service-name">{{ service.name }}</text>
                <view class="tag hot" v-if="service.hot">热销</view>
              </view>
              <view class="service-desc">{{ service.desc }}</view>
              <view class="service-sales">已售{{ service.sales }}单</view>
            </view>
            <view class="service-right">
              <view class="price-row">
                <text class="price-symbol">¥</text>
                <text class="price">{{ service.price }}</text>
                <text class="price-unit">/{{ service.unit }}</text>
              </view>
              <view class="select-btn" :class="{active: selectedService?.id === service.id}" @click="selectService(service)">
                {{ selectedService?.id === service.id ? '已选择' : '选择' }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 个人相册 -->
      <view class="section" v-if="albumList.length > 0">
        <view class="section-title">
          <uni-icons type="image" size="18" color="#00c896"></uni-icons>
          <text>个人相册 ({{ albumList.length }})</text>
          <text class="see-more" @click="viewAlbum">查看全部</text>
        </view>
        <view class="album-grid">
          <image
              class="album-item"
              v-for="(item, index) in albumList.slice(0, 6)"
              :key="index"
              :src="item"
              mode="aspectFill"
              @click="previewImage(index)"
          ></image>
        </view>
      </view>

      <!-- 用户评价 -->
      <view class="section" v-if="reviewList.length > 0">
        <view class="section-title">
          <uni-icons type="star" size="18" color="#00c896"></uni-icons>
          <text>用户评价 ({{ reviewList.length }})</text>
          <text class="rating-text">{{ coachInfo.overallScore || coachInfo.rating }}分</text>
        </view>
        <view class="review-list">
          <view class="review-item" v-for="(review, index) in reviewList" :key="index">
            <view class="review-header">
              <image class="review-avatar" :src="review.avatar" mode="aspectFill"></image>
              <view class="review-user">
                <text class="review-name">{{ review.name }}</text>
                <view class="review-stars">
                  <uni-icons type="star-filled" size="12" color="#ffc107" v-for="n in review.rating" :key="n"></uni-icons>
                </view>
              </view>
              <text class="review-time">{{ review.time }}</text>
            </view>
            <view class="review-content">{{ review.content }}</view>
            <view class="review-tags">
              <view class="tag small" v-for="(tag, tagIndex) in review.tags" :key="tagIndex">{{ tag }}</view>
            </view>
          </view>
        </view>
        <view class="more-reviews" @click="viewAllReviews">
          <text>查看全部{{ reviewList.length }}条评价</text>
        </view>
      </view>

      <!-- 底部安全区域留白 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>


    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="price-info">
        <text class="price-symbol">¥</text>
        <text class="price">{{ selectedService?.price || coachInfo.price }}</text>
        <text class="price-unit">/{{ selectedService?.unit || '小时' }}起</text>
      </view>
      <view class="book-btn" @click="bookNow">立即预约</view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from "@dcloudio/uni-app"
import { getCoachDetail, toggleCoachFavorite, getCoachReviews } from '@/api/billiard/coach'

// 状态栏和安全区域高度
const statusBarHeight = ref(0)
const safeAreaBottom = ref(0)
const scrollViewHeight = ref(0)
const coachId = ref(null)
const loading = ref(false)

// 下拉刷新状态
const refreshing = ref(false)
const isFavorite = ref(false)

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
  introduction: ''
})

// 服务项目
const services = ref([])

// 相册列表
const albumList = ref([])

// 评价列表
const reviewList = ref([])

// 等级映射
const levelMap = {
  0: '初级教练',
  1: '中级教练',
  2: '高级教练'
}

const getLevelText = (level) => {
  if (typeof level === 'string') {
    return level
  }
  return levelMap[level] || '初级教练'
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

// 加载教练详情
const loadCoachData = async () => {
  if (!coachId.value) return

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
      avatar: getMainPhoto(data.photos) || data.avatar || data.mainPhotoUrl || '/static/default-avatar.png',
      cover: data.cover || getMainPhoto(data.photos) || '/static/default-cover.jpg',
      level: data.level ?? 0,
      levelText: getLevelText(data.level),
      rating: data.overallScore || data.rating || 4.9,
      overallScore: data.overallScore || data.rating || 4.9,
      orderCount: data.serviceCount || data.orderCount || 0,
      serviceCount: data.serviceCount || data.orderCount || 0,
      distance: formatDistance(data.distance),
      price: data.price || 0,
      tags: data.tags || [],
      intro: data.introduction || data.intro || '这位助教很神秘，什么都没写~',
      introduction: data.introduction || data.intro || '这位助教很神秘，什么都没写~'
    })

    // 服务项目（如果接口返回）
    if (data.serviceItems && Array.isArray(data.serviceItems)) {
      services.value = data.serviceItems
    } else if (data.services && Array.isArray(data.services)) {
      services.value = data.services
    } else {
      // 默认服务项目（和截图一致）
      services.value = [
        { id: 1, name: '台球陪练', desc: '2小时起步，包含基础动作指导、技术纠错、实战演练', sales: 86, price: 99, unit: '小时', hot: true },
        { id: 2, name: '陪游服务', desc: '5小时起步，全天陪同打球+游玩，包含餐饮交通补贴', sales: 42, price: 399, unit: '天', hot: false }
      ]
    }

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
      pageSize: 10
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

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 分享教练
const shareCoach = () => {
  uni.showToast({ title: '分享功能', icon: 'none' })
}

// 收藏/取消收藏
const handleToggleFavorite = async () => {
  console.log('收藏教练, id:', coachInfo.id)
  if (!coachInfo.id) {
    uni.showToast({ title: '教练信息加载中', icon: 'none' })
    return
  }
  try {
    uni.showLoading({ title: '处理中...' })
    console.log('发送收藏请求, coachId:', coachInfo.id)
    const res = await toggleCoachFavorite({ coachId: coachInfo.id })
    console.log('收藏响应:', res)
    isFavorite.value = res.data
    uni.showToast({
      title: isFavorite.value ? '已收藏' : '已取消收藏',
      icon: 'none'
    })
  } catch (error) {
    console.error('收藏操作失败:', error)
  } finally {
    uni.hideLoading()
  }
}

// 跳转到打赏页面
const goToReward = () => {
  uni.navigateTo({
    url: '/pages/coach/reward?coachId=' + coachInfo.id
  })
}

// 选中的服务
const selectedService = ref(null)

// 选择服务
const selectService = (service) => {
  selectedService.value = service
  uni.showToast({
    title: '已选择' + service.name,
    icon: 'none'
  })
}

// 预览图片
const previewImage = (index) => {
  if (albumList.value.length > 0) {
    uni.previewImage({
      urls: albumList.value,
      current: index
    })
  }
}

// 查看相册
const viewAlbum = () => {
  uni.showToast({
    title: '查看全部相册',
    icon: 'none'
  })
}

// 查看全部评价
const viewAllReviews = () => {
  uni.showToast({
    title: '查看全部评价',
    icon: 'none'
  })
}

// 立即预约
const bookNow = () => {
  if (!selectedService.value) {
    uni.showToast({ title: '请先选择服务项目', icon: 'none' })
    return
  }
  // 保存教练信息和选中的服务
  uni.setStorageSync('selectedCoach', {
    ...coachInfo,
    selectedService: selectedService.value
  })
  uni.navigateTo({ url: '/pages/booking/hall' })
}

// 获取页面参数
onLoad((options) => {
  if (options.id) {
    coachId.value = parseInt(options.id)
  }
})

onMounted(() => {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
  safeAreaBottom.value = systemInfo.safeAreaInsets?.bottom || 0

  // 计算 scroll-view 高度 - 需要减去底部栏高度和安全区域
  const bottomBarHeight = 60 + safeAreaBottom.value

  // 使用 setTimeout 确保 DOM 渲染完成
  setTimeout(() => {
    scrollViewHeight.value = systemInfo.windowHeight - bottomBarHeight
  }, 100)

  // 加载数据
  if (coachId.value) {
    loadCoachData()
  }
})
</script>

<style lang="scss" scoped>
.detail-container {
  min-height: 100vh;
  background-color: #1a1a1a;
  position: relative;
}

/* 头部导航栏 */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 90rpx;
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 30rpx;
  z-index: 100;

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
  background-color: #1a1a1a;
}

.header-section {
  position: relative;
  height: 640rpx;
  overflow: hidden;

  .header-bg {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  .header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(26, 26, 26, 0.1) 0%, rgba(26, 26, 26, 0.9) 100%);
  }

  .header-content {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    padding: 40rpx;
    display: flex;
    align-items: flex-start;
    gap: 32rpx;

    .avatar {
      width: 160rpx;
      height: 160rpx;
      border-radius: 32rpx;
      border: 6rpx solid rgba(255, 255, 255, 0.2);
      flex-shrink: 0;
    }

    .info {
      flex: 1;

      .name-row {
        display: flex;
        align-items: center;
        gap: 20rpx;
        margin-bottom: 16rpx;

        .name {
          font-size: 48rpx;
          font-weight: 700;
          color: #ffffff;
        }

        .tag.level {
          font-size: 24rpx;
          padding: 8rpx 20rpx;
          border-radius: 40rpx;

          &.level-0, &.level-1 {
            background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
            color: #1a1a1a;
          }

          &.level-2 {
            background: linear-gradient(135deg, #00c896 0%, #00a87a 100%);
            color: #ffffff;
          }
        }
      }

      .stats-row {
        display: flex;
        align-items: center;
        gap: 32rpx;
        margin-bottom: 20rpx;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8rpx;
          font-size: 28rpx;
          color: #cccccc;
        }
      }

      .tags-row {
        display: flex;
        flex-wrap: wrap;
        gap: 16rpx;

        .tag {
          font-size: 24rpx;
          padding: 8rpx 24rpx;
          border-radius: 40rpx;
          background-color: rgba(0, 200, 150, 0.2);
          color: #00c896;
          border: 2rpx solid rgba(0, 200, 150, 0.3);
        }
      }
    }

    .reward-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;
      padding: 20rpx 32rpx;
      background: linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 152, 0, 0.2) 100%);
      border: 2rpx solid rgba(255, 193, 7, 0.4);
      border-radius: 24rpx;

      text {
        font-size: 24rpx;
        color: #ffc107;
      }
    }
  }
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
    color: #ffffff;

    .see-more {
      margin-left: auto;
      font-size: 28rpx;
      font-weight: 400;
      color: #666;
    }

    .rating-text {
      margin-left: auto;
      font-size: 32rpx;
      font-weight: 600;
      color: #ffc107;
    }
  }

  .intro-content {
    background-color: #2a2a2a;
    border-radius: 32rpx;
    padding: 32rpx;

    text {
      font-size: 28rpx;
      color: #cccccc;
      line-height: 1.8;
    }
  }
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  .service-item {
    background-color: #2a2a2a;
    border-radius: 32rpx;
    padding: 32rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 4rpx solid transparent;
    transition: all 0.2s ease;

    &.selected {
      border-color: #00c896;
      background-color: rgba(0, 200, 150, 0.1);
    }

    .service-left {
      flex: 1;

      .service-name-row {
        display: flex;
        align-items: center;
        gap: 20rpx;
        margin-bottom: 12rpx;

        .service-name {
          font-size: 32rpx;
          font-weight: 600;
          color: #ffffff;
        }

        .tag.hot {
          font-size: 20rpx;
          padding: 4rpx 16rpx;
          border-radius: 40rpx;
          background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
          color: #ffffff;
        }
      }

      .service-desc {
        font-size: 26rpx;
        color: #999999;
        margin-bottom: 12rpx;
        line-height: 1.5;
      }

      .service-sales {
        font-size: 24rpx;
        color: #666666;
      }
    }

    .service-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 20rpx;

      .price-row {
        display: flex;
        align-items: baseline;

        .price-symbol {
          font-size: 28rpx;
          color: #00c896;
          font-weight: 600;
        }

        .price {
          font-size: 48rpx;
          color: #00c896;
          font-weight: 700;
        }

        .price-unit {
          font-size: 26rpx;
          color: #999999;
        }
      }

      .select-btn {
        padding: 16rpx 48rpx;
        background: linear-gradient(135deg, #00c896 0%, #00a87a 100%);
        color: #ffffff;
        font-size: 28rpx;
        font-weight: 600;
        border-radius: 40rpx;
        transition: all 0.2s ease;

        &.active {
          background: #2a3338;
          border: 2rpx solid #00c896;
          color: #00c896;
        }
      }
    }
  }
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;

  .album-item {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 24rpx;
    background-color: #2a2a2a;
  }
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;

  .review-item {
    background-color: #2a2a2a;
    border-radius: 32rpx;
    padding: 32rpx;

    .review-header {
      display: flex;
      align-items: center;
      margin-bottom: 24rpx;

      .review-avatar {
        width: 96rpx;
        height: 96rpx;
        border-radius: 50%;
        margin-right: 24rpx;
      }

      .review-user {
        flex: 1;

        .review-name {
          font-size: 30rpx;
          font-weight: 600;
          color: #ffffff;
          display: block;
          margin-bottom: 8rpx;
        }

        .review-stars {
          display: flex;
          gap: 4rpx;
        }
      }

      .review-time {
        font-size: 24rpx;
        color: #666666;
      }
    }

    .review-content {
      font-size: 28rpx;
      color: #cccccc;
      line-height: 1.6;
      margin-bottom: 24rpx;
    }

    .review-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;

      .tag.small {
        font-size: 22rpx;
        padding: 6rpx 20rpx;
        border-radius: 40rpx;
        background-color: rgba(0, 200, 150, 0.15);
        color: #00c896;
      }
    }
  }
}

.more-reviews {
  margin-top: 32rpx;
  padding: 28rpx;
  background-color: #2a2a2a;
  border-radius: 24rpx;
  text-align: center;

  text {
    font-size: 28rpx;
    color: #999999;
  }
}

/* 适配底部安全区 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #252525;
  border-top: 2rpx solid #333333;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;

  .price-info {
    display: flex;
    align-items: baseline;

    .price-symbol {
      font-size: 28rpx;
      color: #00c896;
      font-weight: 600;
    }

    .price {
      font-size: 44rpx;
      color: #00c896;
      font-weight: 700;
    }

    .price-unit {
      font-size: 24rpx;
      color: #999999;
    }
  }

  .book-btn {
    padding: 20rpx 56rpx;
    background: linear-gradient(135deg, #00c896 0%, #00a87a 100%);
    color: #ffffff;
    font-size: 28rpx;
    font-weight: 600;
    border-radius: 44rpx;
    box-shadow: 0 8rpx 30rpx rgba(0, 200, 150, 0.3);
  }
}
</style>