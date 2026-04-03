<template>
  <view class="choose-hall-wrapper">
      <view class="nav-filter" @click="openFilter">
        <uni-icons type="filter" size="22" color="#fff" />
      </view>

    <scroll-view
        scroll-y
        class="hall-scroll"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="onLoadMore"
        :lower-threshold="50"
    >
      <!-- 搜索框 -->
      <view class="search-box">
        <uni-icons type="search" size="20" color="#9CA3AF" />
        <input class="search-input" placeholder="搜索球厅名称" placeholder-class="search-placeholder" />
      </view>

      <!-- 定位信息 -->
      <view class="location-box">
        <uni-icons type="location" size="18" color="#00BB88" />
        <text class="location-text">当前定位：北京市朝阳区</text>
        <view class="location-switch" @click="switchLocation">
          <text>切换</text>
          <uni-icons type="right" size="14" color="#00BB88" />
        </view>
      </view>

      <!-- 筛选标签 -->
      <scroll-view scroll-x class="tab-scroll" :show-scrollbar="false">
        <view class="tab-list">
          <view
              class="tab-item"
              :class="{active: currentTab === item.value}"
              v-for="item in tabList"
              :key="item.value"
              @click="switchTab(item.value)"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>

      <!-- 球厅列表 -->
      <view class="hall-list">
        <view
            class="hall-card"
            v-for="hall in hallList"
            :key="hall.id"
        >
          <!-- 球厅图片 -->
          <view class="hall-image-wrap">
            <image class="hall-image" :src="hall.image" mode="aspectFill"></image>
            <view class="hall-tag" v-if="hall.tag" :style="{background: hall.tagBg}">{{ hall.tag }}</view>
            <view class="hall-distance">{{ hall.distance }}</view>
          </view>

          <!-- 球厅信息 -->
          <view class="hall-info">
            <view class="hall-header">
              <view class="hall-name-wrap">
                <text class="hall-name">{{ hall.name }}</text>
                <view class="hall-badge" v-if="hall.badge" :style="{background: hall.badgeBg}">{{ hall.badge }}</view>
              </view>
              <view class="hall-price">
                <text class="price-num">¥{{ hall.price }}</text>
                <text class="price-unit">/小时起</text>
              </view>
            </view>

            <view class="hall-meta">
              <uni-icons type="star-filled" size="16" color="#FBBF24" />
              <text class="meta-text">{{ hall.score }}</text>
              <text class="meta-divider">|</text>
              <text class="meta-text">{{ hall.reviewCount }}条评价</text>
            </view>

            <view class="hall-address">
              <uni-icons type="location" size="14" color="#9CA3AF" />
              <text class="address-text">{{ hall.address }}</text>
            </view>

            <view class="hall-tags">
              <view class="tag-item" v-for="tag in hall.tags" :key="tag">{{ tag }}</view>
            </view>

            <view class="hall-promo" v-if="hall.promo">
              <uni-icons type="gift" size="16" color="#00BB88" />
              <text class="promo-text">{{ hall.promo }}</text>
            </view>

            <view class="hall-actions">
              <view class="action-btn secondary" @click="navigateTo(hall)">
                <uni-icons type="navigate" size="18" color="#9CA3AF" />
                <text>导航</text>
              </view>
              <view class="action-btn secondary" @click="callPhone(hall)">
                <uni-icons type="phone" size="18" color="#9CA3AF" />
                <text>电话</text>
              </view>
              <view class="action-btn primary" @click="chooseHall(hall)">
                <text>选择</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载提示 -->
      <view class="load-tip" v-if="!hasMore && hallList.length > 0">
        已加载全部球厅
      </view>
      <view class="load-tip loading" v-if="loading">
        <uni-icons type="spinner-cycle" size="20" color="#9CA3AF" style="animation: spin 1s linear infinite; margin-right: 12rpx;"></uni-icons>
        加载中...
      </view>

      <!-- 底部安全区域 - 增加额外高度避免内容被底部栏遮挡 -->
      <view class="safe-area-bottom" ></view>
    </scroll-view>

    <!-- 底部已选栏 -->
    <view class="bottom-bar" v-if="selectedHall">
      <view class="selected-info">
        <view class="selected-hall">
          <text class="selected-label">已选：</text><text class="selected-name">{{ selectedHall.name }}</text></view>
        <view class="selected-price">
          <text class="price-num">¥{{ selectedHall.price }}/小时起</text>
        </view>
      </view>

      <button class="confirm-btn" @click="confirmChoose">确认选择</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from  "@dcloudio/uni-app"

// ---------------------- 状态定义 ----------------------
// 刷新/加载状态
const refreshing = ref(false)
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const pageSize = ref(10)

// 筛选状态
const currentTab = ref('nearest')
const selectedHall = ref(null)

// ---------------------- 模拟数据 ----------------------
const tabList = ref([
  { value: 'nearest', label: '距离最近' },
  { value: 'price', label: '价格最低' },
  { value: 'score', label: '评分最高' },
  { value: '24h', label: '24小时' },
  { value: 'parking', label: '有停车位' }
])

const hallList = ref([
  {
    id: 1,
    name: '星牌台球俱乐部',
    image: 'https://via.placeholder.com/800x400',
    tag: '推荐',
    tagBg: '#00BB88',
    badge: '品牌认证',
    badgeBg: 'rgba(0, 187, 136, 0.2)',
    price: 38,
    score: 4.8,
    reviewCount: 1256,
    address: '朝阳区建国路88号',
    distance: '800m',
    tags: ['24小时营业', '免费停车', '专业助教', '全新球桌'],
    promo: '新用户首单立减20元，助教陪练享8折优惠'
  },
  {
    id: 2,
    name: '乔氏台球会所',
    image: 'https://via.placeholder.com/800x400/2',
    badge: '连锁品牌',
    badgeBg: 'rgba(59, 130, 246, 0.2)',
    price: 58,
    score: 4.9,
    reviewCount: 2341,
    address: '朝阳区光华路1号',
    distance: '1.2km',
    tags: ['VIP包间', '酒水服务', '国家级助教', '定期赛事'],
    promo: '充值500送200，会员享台费7折优惠'
  },
  {
    id: 3,
    name: '8号台球俱乐部',
    image: 'https://via.placeholder.com/800x400/3',
    tag: '新店优惠',
    tagBg: '#EF4444',
    price: 28,
    score: 4.7,
    reviewCount: 867,
    address: '朝阳区青年路23号',
    distance: '2.5km',
    tags: ['新店开业', '桌游区', '美女助教', '平价消费'],
    promo: '开业特惠，所有台费5折，助教陪练买2送1'
  },
  {
    id: 4,
    name: '精英台球会馆',
    image: 'https://via.placeholder.com/800x400/4',
    price: 68,
    score: 4.9,
    reviewCount: 1568,
    address: '朝阳区东三环中路39号',
    distance: '3.8km',
    tags: ['职业球桌', '职业教练', '青少年培训', '专业赛事'],
    promo: '会员充值享折扣，专业课程8折优惠'
  }
])

// ---------------------- 交互方法 ----------------------
// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  page.value = 1
  hasMore.value = true
  loading.value = false
  setTimeout(() => {
    refreshing.value = false
    uni.showToast({ title: '刷新成功', icon: 'success' })
  }, 1000)
}

// 上拉加载更多
const onLoadMore = () => {
  if (!hasMore.value || loading.value) return
  loading.value = true
  setTimeout(() => {
    loading.value = false
    hasMore.value = false
  }, 1500)
}

// 切换筛选标签
const switchTab = (val) => {
  currentTab.value = val
}

// 打开筛选
const openFilter = () => {
  uni.showToast({ title: '筛选功能开发中', icon: 'none' })
}

// 切换定位
const switchLocation = () => {
  uni.showToast({ title: '定位功能开发中', icon: 'none' })
}

// 导航
const navigateTo = (hall) => {
  uni.showActionSheet({
    itemList: ['百度地图', '高德地图', '本机地图'],
    success: (res) => {
      const index = res.tapIndex
      if (index === 0) {
        openBaiduMap(hall)
      } else if (index === 1) {
        openAmap(hall)
      } else if (index === 2) {
        openNativeMap(hall)
      }
    }
  })
}

// 打开百度地图
const openBaiduMap = (hall) => {
  // #ifdef APP-PLUS
  // App端使用plus环境打开百度地图
  const url = `baidumap://map/geocoder?address=${encodeURIComponent(hall.address)}&name=${encodeURIComponent(hall.name)}`
  plus.runtime.openURL(url, (err) => {
    // 如果没有安装百度地图，打开网页版
    const webUrl = `https://map.baidu.com/search/${encodeURIComponent(hall.address)}`
    plus.runtime.openURL(webUrl)
  })
  // #endif

  // #ifdef MP-WEIXIN
  // 微信小程序使用内置地图
  uni.openLocation({
    latitude: hall.latitude || 39.908823,
    longitude: hall.longitude || 116.397470,
    name: hall.name,
    address: hall.address,
    scale: 18
  })
  // #endif

  // #ifdef H5
  // H5打开百度地图网页版
  window.open(`https://map.baidu.com/search/${encodeURIComponent(hall.address)}`)
  // #endif
}

// 打开高德地图
const openAmap = (hall) => {
  // #ifdef APP-PLUS
  const url = `androidamap://viewMap?sourceApplication=appname&poiname=${encodeURIComponent(hall.name)}&lat=${hall.latitude || 39.908823}&lon=${hall.longitude || 116.397470}&dev=0`
  plus.runtime.openURL(url, (err) => {
    const webUrl = `https://uri.amap.com/marker?position=${hall.longitude || 116.397470},${hall.latitude || 39.908823}&name=${encodeURIComponent(hall.name)}`
    plus.runtime.openURL(webUrl)
  })
  // #endif

  // #ifdef MP-WEIXIN
  uni.openLocation({
    latitude: hall.latitude || 39.908823,
    longitude: hall.longitude || 116.397470,
    name: hall.name,
    address: hall.address,
    scale: 18
  })
  // #endif

  // #ifdef H5
  window.open(`https://uri.amap.com/marker?position=${hall.longitude || 116.397470},${hall.latitude || 39.908823}&name=${encodeURIComponent(hall.name)}`)
  // #endif
}

// 打开本机地图
const openNativeMap = (hall) => {
  // #ifdef MP-WEIXIN
  uni.openLocation({
    latitude: hall.latitude || 39.908823,
    longitude: hall.longitude || 116.397470,
    name: hall.name,
    address: hall.address,
    scale: 18
  })
  // #endif

  // #ifdef APP-PLUS
  plus.openMap({
    latitude: hall.latitude || 39.908823,
    longitude: hall.longitude || 116.397470,
    name: hall.name,
    address: hall.address
  })
  // #endif

  // #ifdef H5
  window.open(`https://www.google.com/maps/search/${encodeURIComponent(hall.address)}`)
  // #endif
}

// 拨打电话
const callPhone = (hall) => {
  uni.makePhoneCall({
    phoneNumber: '400-888-8888',
    fail: () => uni.showToast({ title: '拨打失败', icon: 'none' })
  })
}

// 选择球厅
const chooseHall = (hall) => {
  selectedHall.value = hall
}

// 确认选择
const confirmChoose = () => {
  if (!selectedHall.value) return
  // 保存选择的球厅信息，跳转到确认订单页
  uni.setStorageSync('selectedHall', selectedHall.value)
  uni.navigateTo({ url: '/pages/booking/confirm' })
}

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  // 检查是否有从确认订单页返回的选择需求
  const pages = getCurrentPages()
  const prevPage = pages[pages.length - 2]
  if (prevPage && prevPage.$vm && prevPage.$vm.fromConfirm) {
    // 如果是从确认订单页返回的，可以做一些特殊处理
  }
})

onShow(() => {
  // 页面显示时重置选择状态
  // 检查是否有从确认订单页返回的选择
  const returnHall = uni.getStorageSync('returnHall')
  if (returnHall) {
    selectedHall.value = returnHall
    uni.removeStorageSync('returnHall')
  }
})
</script>

<style lang="scss" scoped>
.choose-hall-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 旋转动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 自定义导航栏 */
 .nav-filter {
  width: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hall-scroll {
  flex: 1;
  width: 100%;
  // 为底部栏预留空间
  padding-bottom: 200rpx;
  box-sizing: border-box;
}

/* 搜索框 */
.search-box {
  margin: 20rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  .search-input {
    flex: 1;
    color: #fff;
    font-size: 28rpx;
  }
  .search-placeholder {
    color: #6B7280;
  }
}

/* 定位信息 */
.location-box {
  margin: 0 30rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  .location-text {
    color: #fff;
    font-size: 26rpx;
    flex: 1;
  }
  .location-switch {
    display: flex;
    align-items: center;
    gap: 8rpx;
    color: #00BB88;
    font-size: 26rpx;
  }
}

/* 筛选标签 */
.tab-scroll {
  padding: 0 30rpx 24rpx;
  white-space: nowrap;
  .tab-list {
    display: inline-flex;
    gap: 16rpx;
    .tab-item {
      padding: 14rpx 28rpx;
      background: rgba(30, 37, 43, 1);
      color: #9CA3AF;
      font-size: 26rpx;
      font-weight: 500;
      border-radius: 32rpx;
      flex-shrink: 0;
      transition: all 0.2s ease;
      &.active {
        background: #00BB88;
        color: #fff;
        font-weight: 600;
      }
    }
  }
}

/* 球厅列表 */
.hall-list {
  padding: 0 30rpx;
  .hall-card {
    background: #1E252B;
    border-radius: 24rpx;
    margin-bottom: 30rpx;
    overflow: hidden;
    .hall-image-wrap {
      position: relative;
      width: 100%;
      height: 360rpx;
      .hall-image {
        width: 100%;
        height: 100%;
      }
      .hall-tag {
        position: absolute;
        top: 20rpx;
        left: 0;
        padding: 8rpx 20rpx;
        border-radius: 0 16rpx 16rpx 0;
        color: #fff;
        font-size: 24rpx;
        font-weight: 600;
      }
      .hall-distance {
        position: absolute;
        top: 20rpx;
        right: 20rpx;
        background: rgba(0,0,0,0.6);
        color: #fff;
        font-size: 24rpx;
        padding: 8rpx 16rpx;
        border-radius: 16rpx;
      }
    }
    .hall-info {
      padding: 24rpx;
      .hall-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12rpx;
        .hall-name-wrap {
          display: flex;
          align-items: center;
          gap: 12rpx;
          flex: 1;
          .hall-name {
            color: #fff;
            font-size: 32rpx;
            font-weight: 700;
          }
          .hall-badge {
            padding: 4rpx 12rpx;
            border-radius: 8rpx;
            font-size: 22rpx;
            color: #00BB88;
            flex-shrink: 0;
          }
        }
        .hall-price {
          display: flex;
          align-items: baseline;
          gap: 4rpx;
          .price-num {
            color: #00BB88;
            font-size: 36rpx;
            font-weight: 700;
          }
          .price-unit {
            color: #9CA3AF;
            font-size: 24rpx;
          }
        }
      }
      .hall-meta {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin-bottom: 12rpx;
        .meta-text {
          color: #9CA3AF;
          font-size: 24rpx;
        }
        .meta-divider {
          color: #2a3338;
        }
      }
      .hall-address {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin-bottom: 16rpx;
        .address-text {
          color: #9CA3AF;
          font-size: 24rpx;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
      .hall-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 12rpx;
        margin-bottom: 16rpx;
        .tag-item {
          background: #2a3338;
          color: #9CA3AF;
          font-size: 22rpx;
          padding: 6rpx 16rpx;
          border-radius: 12rpx;
        }
      }
      .hall-promo {
        background: rgba(0, 187, 136, 0.1);
        border-radius: 12rpx;
        padding: 16rpx;
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-bottom: 20rpx;
        .promo-text {
          color: #00BB88;
          font-size: 24rpx;
          flex: 1;
        }
      }
      .hall-actions {
        display: flex;
        gap: 16rpx;
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8rpx;
          height: 72rpx;
          border-radius: 36rpx;
          font-size: 28rpx;
          font-weight: 600;
          &.secondary {
            flex: 1;
            background: #2a3338;
            color: #9CA3AF;
          }
          &.primary {
            flex: 1.5;
            background: #00BB88;
            color: #fff;
          }
        }
      }
    }
  }
}

/* 加载提示 */
.load-tip {
  text-align: center;
  color: #6B7280;
  font-size: 26rpx;
  padding: 40rpx 0;
  &.loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* 底部已选栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #1E252B;
  border-top: 1rpx solid rgba(255,255,255,0.05);
  padding: 12rpx 24rpx;
  padding-bottom: calc(12rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.3);
  .selected-info {
    flex: 1;
    min-width: 0;
    .selected-hall {
      .selected-label {
        color: #9CA3AF;
        font-size: 24rpx;
        font-weight: 600;
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .selected-name {
        color: #fff;
        font-size: 24rpx;
        font-weight: 600;
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .selected-price {
      display: flex;
      align-items: baseline;
      gap: 4rpx;
      flex-shrink: 0;
      margin-top: 4rpx;
      .price-num {
        color: #00BB88;
        font-size: 28rpx;
        font-weight: 700;
      }
      .price-unit {
        color: #9CA3AF;
        font-size: 20rpx;
      }
    }
  }

  .confirm-btn {
    background: #00BB88;
    color: #fff;
    border-radius: 32rpx;
    padding: 14rpx 44rpx;
    font-size: 28rpx;
    font-weight: 700;
    border: none;
    flex-shrink: 0;
    &::after {
      border: none;
    }
  }
}

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>