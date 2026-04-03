<template>
  <view class="detail-container">
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
          <image class="avatar" :src="coachInfo.avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
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
          <view class="service-item" v-for="(service, index) in services" :key="index">
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
              <view class="select-btn" @click="selectService(service)">选择</view>
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
        <text class="price">{{ coachInfo.price }}</text>
        <text class="price-unit">/小时起</text>
      </view>
      <view class="book-btn" @click="bookNow">立即预约</view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from  "@dcloudio/uni-app"
import { getCoachDetail } from '@/api/billiard/coach'

// 状态栏和安全区域高度
const statusBarHeight = ref(0)
const safeAreaBottom = ref(0)
const scrollViewHeight = ref(0)
const coachId = ref(null)
const loading = ref(false)

// 下拉刷新状态
const refreshing = ref(false)

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

// 加载教练详情
const loadCoachData = async () => {
  if (!coachId.value) return

  loading.value = true
  try {
    const res = await getCoachDetail({ id: coachId.value })
    const data = res.data || {}

    // 更新教练信息
    Object.assign(coachInfo, {
      id: data.id,
      name: data.name,
      stageName: data.stageName,
      avatar: data.avatar,
      cover: data.cover,
      level: data.level,
      levelText: data.levelText,
      rating: data.rating || data.overallScore || 4.9,
      overallScore: data.overallScore || data.rating || 4.9,
      orderCount: data.orderCount || data.serviceCount || 0,
      serviceCount: data.serviceCount || data.orderCount || 0,
      distance: data.distance || '',
      price: data.price || 0,
      tags: data.tags || [],
      intro: data.intro || data.introduction || '',
      introduction: data.introduction || data.intro || ''
    })

    // 服务项目（如果接口返回）
    if (data.serviceItems && Array.isArray(data.serviceItems)) {
      services.value = data.serviceItems
    }

    // 相册（如果接口返回）
    if (data.photos && Array.isArray(data.photos)) {
      albumList.value = data.photos
    }

    // 评价（如果接口返回）
    if (data.recentReviews && Array.isArray(data.recentReviews)) {
      reviewList.value = data.recentReviews
    }
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

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadCoachData()
}

// 跳转到打赏页面
const goToReward = () => {
  uni.navigateTo({
    url: '/pages/coach/reward?coachId=' + coachInfo.id
  })
}

// 选择服务
const selectService = (service) => {
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
  uni.showToast({
    title: '预约功能开发中',
    icon: 'none'
  })
}

// 获取页面参数
onLoad((options) => {
  console.log(options,'======options')
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
  const bottomBarHeight = 80 + safeAreaBottom.value

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

.status-bar {
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
}

.scroll-view {
  background-color: #1a1a1a;
}

.header-section {
  position: relative;
  height: 320px;
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
    background: linear-gradient(to bottom, rgba(26, 26, 26, 0.3) 0%, rgba(26, 26, 26, 0.9) 100%);
  }

  .header-content {
    position: relative;
    z-index: 10;
    padding: 140px 20px 20px;
    display: flex;
    align-items: flex-start;
    gap: 16px;

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      border: 3px solid rgba(255, 255, 255, 0.2);
      flex-shrink: 0;
    }

    .info {
      flex: 1;

      .name-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;

        .name {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }

        .tag.level {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 20px;

          &.level-0, &.level-1 {
            background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
            color: #1a1a1a;
          }

          &.level-2 {
            background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
            color: #1a1a1a;
          }
        }
      }

      .stats-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 10px;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: #cccccc;
        }
      }

      .tags-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .tag {
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 20px;
          background-color: rgba(0, 200, 150, 0.2);
          color: #00c896;
          border: 1px solid rgba(0, 200, 150, 0.3);
        }
      }
    }

    .reward-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 16px;
      background: linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 152, 0, 0.2) 100%);
      border: 1px solid rgba(255, 193, 7, 0.4);
      border-radius: 12px;

      text {
        font-size: 12px;
        color: #ffc107;
      }
    }
  }
}

.section {
  padding: 24px 20px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;

    .see-more {
      margin-left: auto;
      font-size: 14px;
      font-weight: 400;
      color: #00c896;
    }

    .rating-text {
      margin-left: auto;
      font-size: 16px;
      font-weight: 600;
      color: #ffc107;
    }
  }

  .intro-content {
    background-color: #2a2a2a;
    border-radius: 16px;
    padding: 16px;

    text {
      font-size: 14px;
      color: #cccccc;
      line-height: 1.8;
    }
  }
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .service-item {
    background-color: #2a2a2a;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .service-left {
      flex: 1;

      .service-name-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;

        .service-name {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }

        .tag.hot {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 20px;
          background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
          color: #ffffff;
        }
      }

      .service-desc {
        font-size: 13px;
        color: #999999;
        margin-bottom: 6px;
        line-height: 1.5;
      }

      .service-sales {
        font-size: 12px;
        color: #666666;
      }
    }

    .service-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;

      .price-row {
        display: flex;
        align-items: baseline;

        .price-symbol {
          font-size: 14px;
          color: #00c896;
          font-weight: 600;
        }

        .price {
          font-size: 24px;
          color: #00c896;
          font-weight: 700;
        }

        .price-unit {
          font-size: 13px;
          color: #999999;
        }
      }

      .select-btn {
        padding: 8px 24px;
        background: linear-gradient(135deg, #00c896 0%, #00a87a 100%);
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
        border-radius: 20px;
      }
    }
  }
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  .album-item {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 12px;
    background-color: #2a2a2a;
  }
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .review-item {
    background-color: #2a2a2a;
    border-radius: 16px;
    padding: 16px;

    .review-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .review-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        margin-right: 12px;
      }

      .review-user {
        flex: 1;

        .review-name {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          display: block;
          margin-bottom: 4px;
        }

        .review-stars {
          display: flex;
          gap: 2px;
        }
      }

      .review-time {
        font-size: 12px;
        color: #666666;
      }
    }

    .review-content {
      font-size: 14px;
      color: #cccccc;
      line-height: 1.6;
      margin-bottom: 12px;
    }

    .review-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .tag.small {
        font-size: 11px;
        padding: 3px 10px;
        border-radius: 20px;
        background-color: rgba(0, 200, 150, 0.15);
        color: #00c896;
      }
    }
  }
}

.more-reviews {
  margin-top: 16px;
  padding: 14px;
  background-color: #2a2a2a;
  border-radius: 12px;
  text-align: center;

  text {
    font-size: 14px;
    color: #999999;
  }
}

/* 适配底部安全区 */
.safe-area-bottom {
  /* constant 对应 iOS < 11.2，env 对应 iOS >= 11.2 */
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
  border-top: 1px solid #333333;
  padding: 12px 20px;
  padding-bottom: calc(12px + constant(safe-area-inset-bottom));
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;

  .price-info {
    display: flex;
    align-items: baseline;

    .price-symbol {
      font-size: 16px;
      color: #00c896;
      font-weight: 600;
    }

    .price {
      font-size: 28px;
      color: #00c896;
      font-weight: 700;
    }

    .price-unit {
      font-size: 14px;
      color: #999999;
    }
  }

  .book-btn {
    padding: 14px 40px;
    background: linear-gradient(135deg, #00c896 0%, #00a87a 100%);
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    border-radius: 28px;
    box-shadow: 0 4px 15px rgba(0, 200, 150, 0.3);
  }
}
</style>