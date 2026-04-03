<template>
  <view class="my-page-wrapper">
    <scroll-view
        scroll-y
        class="my-scroll"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
    >
      <!-- 顶部个人信息卡片 -->
      <view class="user-card">
        <view class="user-header">
          <image class="user-avatar" :src="userInfo.avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
          <view class="user-info">
            <view class="user-name">{{ userInfo.nickname }} <text class="edit-btn" @click="toEditInfo">编辑资料 <uni-icons type="right" size="16" color="#9CA3AF" /></text></view>
            <view class="user-phone">{{ userInfo.phone }}</view>
            <text class="user-level" :class="userInfo.levelClass">{{ userInfo.level }}</text>
          </view>
          <view class="setting-btn" @click="toSetting">
            <uni-icons type="gear" size="24" color="#fff" />
          </view>
        </view>

        <view class="user-stats">
          <view class="stats-item">
            <text class="stats-num">{{ stats.totalOrder }}</text>
            <text class="stats-label">总订单</text>
          </view>
          <view class="stats-divider"></view>
          <view class="stats-item">
            <text class="stats-num">{{ stats.finishOrder }}</text>
            <text class="stats-label">已完成</text>
          </view>
          <view class="stats-divider"></view>
          <view class="stats-item">
            <text class="stats-num">{{ stats.avgScore }}</text>
            <text class="stats-label">平均评分</text>
          </view>
        </view>
      </view>

      <!-- 钱包+优惠券模块 -->
      <view class="func-card">
        <view class="dual-item" @click="toWallet">
          <view class="item-icon bg-green">
            <uni-icons type="wallet" size="30" color="#fff" />
          </view>
          <text class="item-title">我的钱包</text>
          <text class="item-value text-green">¥{{ wallet.balance }}</text>
        </view>
        <view class="dual-divider"></view>
        <view class="dual-item" @click="toCoupon">
          <view class="item-icon bg-yellow">
            <uni-icons type="ticket" size="30" color="#fff" />
          </view>
          <text class="item-title">优惠券</text>
          <text class="item-value text-yellow">{{ coupon.availableCount }}张可用</text>
        </view>
      </view>

      <!-- 我的订单模块 -->
      <view class="func-card">
        <view class="card-header">
          <text class="card-title">我的订单</text>
          <text class="view-more" @click="toAllOrder">查看全部 <uni-icons type="right" size="16" color="#9CA3AF" /></text>
        </view>

        <!-- 订单分类标签 -->
        <view class="order-tabs">
          <view
              class="tab-item"
              :class="{active: currentOrderTab === tab.value}"
              v-for="tab in orderTabs"
              :key="tab.value"
              @click="switchOrderTab(tab.value)"
          >
            <view class="tab-icon" :style="{color: tab.color}">
              <uni-icons :type="tab.icon" size="28" :color="tab.color" />
              <text class="badge" v-if="tab.hasBadge"></text>
            </view>
            <text :style="{color: currentOrderTab === tab.value ? tab.color : '#9CA3AF'}">{{ tab.label }}</text>
          </view>
          </div>

          <!-- 订单列表 -->
          <view class="order-list">
            <view class="order-card" v-for="order in showOrders" :key="order.id" @click="toOrderDetail(order.id)">
              <view class="order-left">
                <image class="coach-avatar" :src="order.coachAvatar" mode="aspectFill"></image>
                <view class="order-info">
                  <view class="order-title">{{ order.coachName }} · {{ order.coachLevel }}</view>
                  <view class="order-subtitle">{{ order.serviceName }} · {{ order.duration }}小时</view>
                  <view class="order-time">{{ order.time }}</view>
                </view>
              </view>
              <view class="order-right">
                <text class="order-status" :style="{background: order.statusColor}">{{ order.statusText }}</text>
                <button
                    v-if="order.showAction"
                    class="order-action-btn"
                    :style="{background: order.actionColor}"
                    @click.stop="toReview(order.id)"
                >
                  {{ order.actionText }}
                </button>
              </view>
            </view>

            <!-- 空状态 -->
            <view class="empty-tip" v-if="showOrders.length === 0">
              暂无对应订单
            </view>
          </view>
        </view>

        <!-- 功能菜单列表 -->
        <view class="func-card menu-card">
          <view
              class="menu-item"
              v-for="item in menuList"
              :key="item.key"
              @click="toMenuPage(item)"
          >
            <view class="menu-icon" :style="{background: item.bgColor, color: item.color}">
              <uni-icons :type="item.icon" size="24" :color="item.color" />
            </view>
            <text class="menu-title">{{ item.title }}</text>
            <uni-icons type="right" size="20" color="#9CA3AF" />
          </view>
        </view>

        <!-- 底部安全区域 -->
        <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from  "@dcloudio/uni-app"

// 刷新状态
const refreshing = ref(false)
// 当前订单分类
const currentOrderTab = ref(2) // 默认选中待评价，和设计图一致

// 用户信息
const userInfo = ref({
  avatar: '', // 你的头像地址
  nickname: '张先生',
  phone: '138****8888',
  level: '普通会员',
  levelClass: 'level-normal'
})

// 用户统计
const stats = ref({
  totalOrder: 12,
  finishOrder: 8,
  avgScore: 4.8
})

// 钱包信息
const wallet = ref({
  balance: 256.00
})

// 优惠券信息
const coupon = ref({
  availableCount: 3
})

// 订单分类
const orderTabs = ref([
  { value: 0, label: '待付款', icon: 'clock', color: '#FBBF24', hasBadge: true },
  { value: 1, label: '进行中', icon: 'play', color: '#00BB88', hasBadge: false },
  { value: 2, label: '待评价', icon: 'star', color: '#FBBF24', hasBadge: true },
  { value: 3, label: '已完成', icon: 'checkmark', color: '#00BB88', hasBadge: false },
  { value: 4, label: '已取消', icon: 'close', color: '#EF4444', hasBadge: false },
])

// 订单列表数据
const orderList = ref({
  0: [], // 待付款
  1: [], // 进行中
  2: [ // 待评价，和设计图一致
    {
      id: 1,
      coachAvatar: 'https://via.placeholder.com/100', // 替换为你的头像地址
      coachName: '阿豪',
      coachLevel: '中级教练',
      serviceName: '台球陪练',
      duration: 2,
      time: '2026-03-22 14:00-16:00',
      statusText: '待评价',
      statusColor: 'rgba(0, 187, 136, 0.2)',
      showAction: true,
      actionText: '去评价',
      actionColor: '#00BB88'
    }
  ],
  3: [], // 已完成
  4: [] // 已取消
})

// 功能菜单
const menuList = ref([
  { key: 'collection', title: '我的收藏', icon: 'heart', bgColor: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', path: '/pages/user/collection' },
  { key: 'follow', title: '关注教练', icon: 'personadd', bgColor: 'rgba(0, 187, 136, 0.2)', color: '#00BB88', path: '/pages/user/follow' },
  { key: 'hall', title: '常用球厅', icon: 'location', bgColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', path: '/pages/user/hall' },
  { key: 'help', title: '帮助中心', icon: 'question', bgColor: 'rgba(107, 114, 128, 0.2)', color: '#6B7280', path: '/pages/help/index' },
])

// 当前展示的订单
const showOrders = computed(() => {
  return orderList.value[currentOrderTab.value] || []
})

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  // 重新加载数据，你可以替换为你的接口请求
  setTimeout(() => {
    refreshing.value = false
    uni.showToast({ title: '刷新成功', icon: 'success' })
  }, 1000)
}

// 切换订单分类
const switchOrderTab = (val) => {
  currentOrderTab.value = val
}

// 路由跳转方法
const toEditInfo = () => {
  uni.navigateTo({ url: '/pages/user/edit' })
}

const toSetting = () => {
  uni.navigateTo({ url: '/pages/setting/index' })
}

const toWallet = () => {
  uni.navigateTo({ url: '/pages/user/wallet' })
}

const toCoupon = () => {
  uni.navigateTo({ url: '/pages/user/coupon' })
}

const toAllOrder = () => {
  uni.navigateTo({ url: '/pages/order/list' })
}

const toOrderDetail = (orderId) => {
  uni.navigateTo({ url: `/pages/order/detail?id=${orderId}` })
}

const toReview = (orderId) => {
  uni.navigateTo({ url: `/pages/order/review?id=${orderId}` })
}

const toMenuPage = (item) => {
  uni.navigateTo({ url: item.path })
}

onMounted(() => {
  // 页面加载拉取用户数据，你可以替换为你的接口
})

// 页面显示刷新数据
onShow(() => {
  // 可以在这里做数据刷新
})
</script>

<style lang="scss" scoped>
.my-page-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-top: 20rpx;
}

.my-scroll {
  width: 100%;
  min-height: 100vh;
}

/* 用户信息卡片 */
.user-card {
  margin: 0 30rpx 30rpx;
  background: linear-gradient(135deg, #00BB8833 0%, #1E252B 100%);
  border-radius: 40rpx;
  padding: 40rpx 30rpx;
  .user-header {
    display: flex;
    align-items: center;
    gap: 24rpx;
    position: relative;
    .user-avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      border: 4rpx solid #00BB88;
    }
    .user-info {
      flex: 1;
      .user-name {
        color: #fff;
        font-size: 40rpx;
        font-weight: 600;
        line-height: 1.4;
        .edit-btn {
          float: right;
          color: #9CA3AF;
          font-size: 28rpx;
          font-weight: normal;
          display: flex;
          align-items: center;
        }
      }
      .user-phone {
        color: #9CA3AF;
        font-size: 30rpx;
        margin: 8rpx 0 16rpx;
      }
      .user-level {
        display: inline-block;
        padding: 4rpx 24rpx;
        border-radius: 8rpx;
        font-size: 26rpx;
        &.level-normal {
          background: rgba(251, 191, 36, 0.2);
          color: #FBBF24;
        }
        &.level-vip {
          background: rgba(236, 72, 153, 0.2);
          color: #EC4899;
        }
      }
    }
    .setting-btn {
      position: absolute;
      top: 0;
      right: 0;
      width: 56rpx;
      height: 56rpx;
      border-radius: 50%;
      background: rgba(0, 187, 136, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
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
        color: #fff;
        font-size: 48rpx;
        font-weight: bold;
        margin-bottom: 8rpx;
      }
      .stats-label {
        display: block;
        color: #9CA3AF;
        font-size: 28rpx;
      }
    }
    .stats-divider {
      width: 2rpx;
      background: rgba(255,255,255,0.1);
    }
  }
}

/* 通用双栏卡片 */
.func-card {
  margin: 0 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    .card-title {
      color: #fff;
      font-size: 32rpx;
      font-weight: 600;
    }
    .view-more {
      color: #9CA3AF;
      font-size: 28rpx;
      display: flex;
      align-items: center;
      gap: 4rpx;
    }
  }
}

/* 钱包优惠券双栏 */
.dual-item {
  flex: 1;
  text-align: center;
  padding: 10rpx 0;
  .item-icon {
    width: 90rpx;
    height: 90rpx;
    border-radius: 50%;
    margin: 0 auto 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .item-title {
    display: block;
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 8rpx;
  }
  .item-value {
    font-size: 28rpx;
    &.text-green {
      color: #00BB88;
    }
    &.text-yellow {
      color: #FBBF24;
    }
  }
}
.bg-green {
  background: rgba(0, 187, 136, 0.2);
}
.bg-yellow {
  background: rgba(251, 191, 36, 0.2);
}
.dual-divider {
  width: 2rpx;
  background: rgba(255,255,255,0.1);
}
.func-card:has(.dual-item) {
  display: flex;
  align-items: center;
  gap: 30rpx;
}

/* 订单分类标签 */
.order-tabs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
  .tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    flex: 1;
    .tab-icon {
      position: relative;
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      .badge {
        position: absolute;
        top: 2rpx;
        right: 2rpx;
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
        background: #EF4444;
        border: 2rpx solid #1E252B;
      }
    }
    text {
      font-size: 28rpx;
    }
  }
}

/* 订单卡片 */
.order-list {
  .order-card {
    background: #2a3338;
    border-radius: 20rpx;
    padding: 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .order-left {
      display: flex;
      align-items: center;
      gap: 16rpx;
      .coach-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 12rpx;
      }
      .order-info {
        .order-title {
          color: #fff;
          font-size: 32rpx;
          font-weight: 600;
          margin-bottom: 8rpx;
        }
        .order-subtitle {
          color: #9CA3AF;
          font-size: 26rpx;
          margin-bottom: 16rpx;
        }
        .order-time {
          color: #9CA3AF;
          font-size: 28rpx;
        }
      }
    }
    .order-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 16rpx;
      .order-status {
        padding: 4rpx 16rpx;
        border-radius: 8rpx;
        color: #fff;
        font-size: 26rpx;
      }
      .order-action-btn {
        width: 160rpx;
        height: 60rpx;
        line-height: 60rpx;
        border-radius: 30rpx;
        color: #fff;
        font-size: 28rpx;
        font-weight: 600;
        padding: 0;
        &::after {
          border: none;
        }
      }
    }
  }
  .empty-tip {
    text-align: center;
    color: #9CA3AF;
    font-size: 28rpx;
    padding: 60rpx 0;
  }
}

/* 菜单列表 */
.menu-card {
  padding: 0 !important;
  .menu-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 20rpx 30rpx;
    border-bottom: 1rpx solid rgba(255,255,255,0.05);
    &:last-child {
      border-bottom: none;
    }
    .menu-icon {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .menu-title {
      flex: 1;
      color: #fff;
      font-size: 32rpx;
      font-weight: 600;
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