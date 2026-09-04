<template>
  <view class="user-card">
    <view class="user-header">
      <!-- 头像 -->
      <image
          class="user-avatar"
          :src="userInfo.avatar || '/static/default-avatar.png'"
          mode="aspectFill"
          @click="handleAvatarClick"
      ></image>

      <!-- 用户信息 -->
      <view class="user-info">
        <view class="user-name-row">
          <text class="user-name">{{ userInfo.nickname }}</text>
        </view>
        <view class="user-phone">{{ userInfo.phone }}</view>
        <text class="edit-btn" @click="handleEditClick">编辑资料</text>
      </view>

      <view class="setting-btn" @click="handleSettingClick">
        <uni-icons type="gear" size="22" color="#fff" />
      </view>
    </view>

    <!-- 统计数据（审核模式下隐藏） -->
    <view class="user-stats" v-if="showStats" @click="handleStatsClick">
      <view class="stats-item">
        <text class="stats-num">{{ stats.totalOrder }}</text>
        <text class="stats-label">总订单</text>
      </view>
      <view class="stats-divider"></view>
      <view class="stats-item">
        <text class="stats-num">{{ stats.finishOrder }}</text>
        <text class="stats-label">已完成</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  userInfo: {
    type: Object,
    default: () => ({
      avatar: '',
      nickname: '',
      phone: '',
      level: '普通会员'
    })
  },
  stats: {
    type: Object,
    default: () => ({
      totalOrder: 0,
      finishOrder: 0
    })
  },
  showStats: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['avatarClick', 'editClick', 'settingClick', 'statsClick'])

const handleAvatarClick = () => emit('avatarClick')
const handleEditClick = () => emit('editClick')
const handleSettingClick = () => emit('settingClick')
const handleStatsClick = () => emit('statsClick')
</script>

<style lang="scss" scoped>
.user-card {
  margin: 20rpx 30rpx 30rpx;
  background: linear-gradient(135deg, rgba(0, 187, 136, 0.2) 0%, var(--bg-card) 100%);
  border-radius: 40rpx;
  padding: 40rpx 30rpx;

  .user-header {
    display: flex;
    align-items: flex-start;
    gap: 20rpx;
    position: relative;

    .user-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      border: 4rpx solid var(--brand-primary);
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 20rpx;

      .user-name-row {
        display: flex;
        align-items: center;
        gap: 16rpx;
        margin-bottom: 8rpx;

        .user-name {
          color: var(--text-primary);
          font-size: 40rpx;
          font-weight: 700;
        }
      }

      .user-phone {
        color: var(--text-secondary);
        font-size: 28rpx;
        margin-bottom: 12rpx;
      }

      .edit-btn {
        color: var(--text-secondary);
        font-size: 24rpx;
      }
    }

    .setting-btn {
      width: 56rpx;
      height: 56rpx;
      border-radius: 50%;
      background: rgba(0, 187, 136, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      align-self: flex-start;
    }
  }

  .user-stats {
    display: flex;
    margin-top: 40rpx;

    .stats-item {
      flex: 1;
      text-align: center;

      .stats-num {
        display: block;
        color: var(--text-primary);
        font-size: 44rpx;
        font-weight: bold;
        margin-bottom: 8rpx;
      }

      .stats-label {
        display: block;
        color: var(--text-secondary);
        font-size: 26rpx;
      }
    }

    .stats-divider {
      width: 2rpx;
      background: var(--border-color);
      margin-top: 8rpx;
      margin-bottom: 8rpx;
    }
  }
}
</style>
