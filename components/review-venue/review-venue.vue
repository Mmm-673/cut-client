<template>
  <view class="review-venue">
    <!-- 头部 -->
    <view class="venue-header">
      <view class="title-left">
        <view class="title-decoration">
          <view class="title-dot"></view>
          <view class="title-line"></view>
        </view>
        <text class="title-text">附近球厅</text>
      </view>
      <text class="venue-subtitle">选择门店，电话预约台球场地</text>
    </view>

    <!-- 加载中 -->
    <view class="venue-loading" v-if="loading">
      <view class="skeleton-card" v-for="i in 3" :key="i">
        <view class="skeleton-line title"></view>
        <view class="skeleton-line"></view>
        <view class="skeleton-line short"></view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="venueList.length === 0">
      <uni-icons type="info" size="60" color="#666" />
      <text class="empty-text">附近暂无球厅</text>
    </view>

    <!-- 球厅列表 -->
    <view class="venue-list" v-else>
      <view class="venue-card" v-for="venue in venueList" :key="venue.id">
        <view class="venue-main">
          <view class="venue-name-row">
            <text class="venue-name">{{ venue.name }}</text>
            <view class="venue-score" v-if="venueScore(venue)">
              <uni-icons type="star-filled" size="12" color="#FFB800" />
              <text>{{ venueScore(venue) }}</text>
            </view>
          </view>
          <view class="venue-address-row">
            <uni-icons type="location" size="13" color="#9CA3AF" />
            <text class="venue-address">{{ formatAddress(venue) }}</text>
            <text class="venue-distance" v-if="venue.distance != null">{{ formatDistance(venue.distance) }}</text>
          </view>
        </view>
        <view class="venue-actions" v-if="firstPhone(venue)">
          <view class="call-btn" @click="callVenue(venue)">
            <uni-icons type="phone" size="15" color="#fff" />
            <text>电话预约</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getVenueList } from '@/api/billiard/venue'

const loading = ref(false)
const venueList = ref([])

// 提取评分（优先平台评分，其次高德评分）
const venueScore = (venue) => {
  const score = venue.score || venue.amapRating
  if (score === null || score === undefined || score === '') return ''
  return Number(score).toFixed(1)
}

// 拼接地址：商圈 + 详细地址
const formatAddress = (venue) => {
  const parts = []
  if (venue.businessArea) parts.push(venue.businessArea)
  if (venue.address) parts.push(venue.address)
  return parts.join(' · ') || '地址详见电话预约'
}

// 格式化距离（km）
const formatDistance = (distance) => {
  const num = Number(distance)
  if (isNaN(num)) return ''
  return num < 1 ? `${Math.round(num * 1000)}m` : `${num.toFixed(1)}km`
}

// 提取第一个有效电话（兼容 phones 数组/字符串与 phone 字段）
const phoneList = (venue) => {
  let phones = []
  if (Array.isArray(venue.phones)) {
    phones = venue.phones
  } else if (typeof venue.phones === 'string' && venue.phones) {
    phones = [venue.phones]
  } else if (venue.phone) {
    phones = [venue.phone]
  }
  return phones.filter(p => p && String(p).trim())
}

const firstPhone = (venue) => phoneList(venue)[0] || ''

// 电话预约
const callVenue = (venue) => {
  const phones = phoneList(venue)
  if (phones.length === 0) {
    uni.showToast({ title: '暂无联系电话', icon: 'none' })
    return
  }
  const doCall = (phone) => {
    uni.makePhoneCall({
      phoneNumber: String(phone).trim(),
      fail: () => {
        uni.showToast({ title: '拨号失败，请重试', icon: 'none' })
      }
    })
  }
  if (phones.length === 1) {
    doCall(phones[0])
  } else {
    uni.showActionSheet({
      itemList: phones,
      success: (res) => doCall(phones[res.tapIndex])
    })
  }
}

// 加载球厅列表
const loadVenueList = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await getVenueList({ limit: 50 })
    venueList.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('加载球厅列表失败:', error)
    venueList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadVenueList()
})
</script>

<style lang="scss" scoped>
.review-venue {
  padding: 0 30rpx 40rpx;
}

/* 头部 */
.venue-header {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
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
      }

      .title-line {
        width: 24rpx;
        height: 4rpx;
        background: linear-gradient(90deg, #00BB88, transparent);
        border-radius: 2rpx;
      }
    }

    .title-text {
      color: #fff;
      font-size: 34rpx;
      font-weight: 700;
      letter-spacing: -0.5rpx;
    }
  }

  .venue-subtitle {
    color: #6B7280;
    font-size: 24rpx;
  }
}

/* 加载骨架 */
.venue-loading {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .skeleton-card {
    background: linear-gradient(145deg, #1E252B, #1a2024);
    border: 1rpx solid rgba(255, 255, 255, 0.05);
    border-radius: 24rpx;
    padding: 28rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    animation: skeletonPulse 1.4s ease-in-out infinite;

    .skeleton-line {
      height: 24rpx;
      border-radius: 12rpx;
      background: rgba(255, 255, 255, 0.06);

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

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;

  .empty-text {
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #666;
  }
}

/* 球厅卡片 */
.venue-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.venue-card {
  display: flex;
  align-items: center;
  background: linear-gradient(145deg, #1E252B, #1a2024);
  border: 1rpx solid rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.25);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
  }

  .venue-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12rpx;

    .venue-name-row {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .venue-name {
        color: #fff;
        font-size: 30rpx;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .venue-score {
        display: flex;
        align-items: center;
        gap: 4rpx;
        flex-shrink: 0;
        background: rgba(255, 184, 0, 0.1);
        border: 1rpx solid rgba(255, 184, 0, 0.25);
        border-radius: 50rpx;
        padding: 2rpx 12rpx;

        text {
          color: #FFB800;
          font-size: 22rpx;
          font-weight: 700;
        }
      }
    }

    .venue-address-row {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .venue-address {
        flex: 1;
        min-width: 0;
        color: #9CA3AF;
        font-size: 24rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .venue-distance {
        flex-shrink: 0;
        color: #00BB88;
        font-size: 22rpx;
        font-weight: 500;
      }
    }
  }

  .venue-actions {
    flex-shrink: 0;
    margin-left: 20rpx;

    .call-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;
      background: linear-gradient(135deg, #00BB88 0%, #059669 100%);
      border-radius: 50rpx;
      padding: 14rpx 28rpx;
      box-shadow: 0 8rpx 20rpx rgba(0, 187, 136, 0.3);
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.94);
        opacity: 0.9;
      }

      text {
        color: #fff;
        font-size: 26rpx;
        font-weight: 600;
      }
    }
  }
}
</style>
