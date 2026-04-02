<template>
  <view class="detail-container">
    <!-- 下拉刷新区域 -->
    <scroll-view
        scroll-y
        class="scroll-view"
        :style="{ height: scrollViewHeight + 'px' }"
        @scrolltolower="onReachBottom"
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
              <text class="name">{{ coachInfo.name }}</text>
              <view class="tag level" :class="'level-' + coachInfo.level">
                {{ coachInfo.levelText }}
              </view>
            </view>
            <view class="stats-row">
              <view class="stat-item">
                <uni-icons type="star" size="14" color="#ffc107"></uni-icons>
                <text>{{ coachInfo.rating }}</text>
              </view>
              <view class="stat-item">
                <text>{{ coachInfo.orderCount }}单</text>
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
          <text>{{ coachInfo.intro }}</text>
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
      <view class="section">
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
      <view class="section">
        <view class="section-title">
          <uni-icons type="star" size="18" color="#00c896"></uni-icons>
          <text>用户评价 ({{ reviewList.length }})</text>
          <text class="rating-text">{{ coachInfo.rating }}分</text>
        </view>
        <view class="review-list">
          <view class="review-item" v-for="(review, index) in reviewList" :key="index">
            <view class="review-header">
              <image class="review-avatar" :src="review.avatar" mode="aspectFill"></image>
              <view class="review-user">
                <text class="review-name">{{ review.name }}</text>
                <view class="review-stars">
                  <uni-icons type="star" size="12" color="#ffc107" v-for="n in 5" :key="n"></uni-icons>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { onNavigationBarButtonTap } from '@dcloudio/uni-app'

// 状态栏和安全区域高度
const statusBarHeight = ref(0)
const safeAreaBottom = ref(0)
const scrollViewHeight = ref(0)

// 下拉刷新和加载状态
const refreshing = ref(false)
const loading = ref(false)

// 是否已收藏
const isFavorited = ref(false)

// 教练信息
const coachInfo = reactive({
  id: 1,
  name: '小雯',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
  cover: 'https://images.unsplash.com/photo-1519368358672-25b03afee397?w=800&h=400&fit=crop',
  level: 1,
  levelText: '高级教练',
  rating: 4.9,
  orderCount: 128,
  distance: '1.2km',
  price: 99,
  tags: ['免费出行', '斯诺克', '3年教龄'],
  intro: '国家级台球运动员，毕业于体育大学台球专业，拥有3年专业教学经验。擅长斯诺克基础教学和进阶技巧指导，教学风格耐心细致，能够根据学员水平制定个性化训练方案，已帮助100+学员提升台球技术水平。'
})

// 服务项目
const services = ref([
  {
    id: 1,
    name: '台球陪练',
    desc: '2小时起步，包含基础动作指导、技术纠错、实战演练',
    price: 99,
    unit: '小时',
    sales: 86,
    hot: true
  },
  {
    id: 2,
    name: '陪游服务',
    desc: '5小时起步，全天陪同打球+游玩，包含餐饮交通补贴',
    price: 399,
    unit: '天',
    sales: 42,
    hot: false
  }
])

// 相册列表
const albumList = ref([
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=300&h=300&fit=crop'
])

// 评价列表
const reviewList = ref([
  {
    id: 1,
    name: '张先生',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rating: 5,
    time: '2026-03-20',
    content: '教练非常专业，耐心纠正了我很多错误动作，两个小时的学习收获很大，球技提升明显，强烈推荐！',
    tags: ['专业', '耐心', '准时']
  },
  {
    id: 2,
    name: '李女士',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rating: 5,
    time: '2026-03-18',
    content: '第一次学台球，教练教的特别好，很有耐心，零基础也能很快上手，体验非常棒，下次还会约！',
    tags: ['耐心', '负责任']
  }
])

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 跳转到打赏页面
const goToReward = () => {
  uni.navigateTo({
    url: '/pages/coach/reward?id=' + coachInfo.id
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
  uni.previewImage({
    urls: albumList.value,
    current: index
  })
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
    title: '立即预约',
    icon: 'none'
  })
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  // 模拟刷新请求
  setTimeout(() => {
    refreshing.value = false
    uni.showToast({
      title: '刷新成功',
      icon: 'success'
    })
  }, 1000)
}

// 上拉加载
const onReachBottom = () => {
  if (loading.value) return
  loading.value = true
  // 模拟加载更多
  setTimeout(() => {
    loading.value = false
    uni.showToast({
      title: '加载更多',
      icon: 'none'
    })
  }, 1000)
}

onMounted(() => {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
  safeAreaBottom.value = systemInfo.safeAreaInsets?.bottom || 0

  // 计算 scroll-view 高度 - 需要减去底部栏高度和安全区域
  // 底部栏高度约 80px，加上安全区域
  const bottomBarHeight = 80 + safeAreaBottom.value

  // 使用 setTimeout 确保 DOM 渲染完成
  setTimeout(() => {
    scrollViewHeight.value = systemInfo.windowHeight - bottomBarHeight
  }, 100)
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

          &.level-1 {
            background: linear-gradient(135deg, #ffd700 0%, #ffb800 100%);
            color: #1a1a1a;
          }

          &.level-2 {
            background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
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