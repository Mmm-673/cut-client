<template>
  <view class="my-page-wrapper">
    <!-- ==========================================
         1. 统一的自定义顶部导航栏（适配上安全区）
         ========================================== -->
    <view class="nav-bar">
      <!-- 占位对称用（右侧没有按钮） -->
      <view class="nav-placeholder"></view>
      <text class="nav-title">我的</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- ==========================================
         2. 统一的滚动容器（撑满剩余+适配下安全区）
         ========================================== -->
    <scroll-view
        scroll-y
        class="my-scroll"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        :lower-threshold="50"
    >
      <!-- ==========================================
           3. 顶部个人信息卡片（统一渐变+安全间距）
           ========================================== -->
      <view class="user-card">
        <view class="user-header">
          <!-- 头像 -->
          <image
              class="user-avatar"
              :src="userInfo.avatar || '/static/default-avatar.png'"
              mode="aspectFill"
              @click="previewAvatar"
          ></image>

          <!-- 用户信息 -->
          <view class="user-info">
            <view class="user-name-row">
              <text class="user-name">{{ userInfo.nickname }}</text>
              <text class="edit-btn" @click="toEditInfo">
                编辑资料
                <uni-icons type="right" size="14" color="#9CA3AF" />
              </text>
            </view>
            <view class="user-phone">{{ userInfo.phone }}</view>
            <text class="user-level" :class="userInfo.levelClass">{{ userInfo.level }}</text>
          </view>

          <!-- 设置按钮 -->
          <view class="setting-btn" @click="toSetting">
            <uni-icons type="gear" size="22" color="#fff" />
          </view>
        </view>

        <!-- 统计数据 -->
        <view class="user-stats">
          <view class="stats-item" @click="toAllOrder">
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

      <!-- ==========================================
           4. 钱包+优惠券双栏卡片（去掉:has()，加专门class兼容所有端）
           ========================================== -->
      <view class="func-card dual-card">
        <view class="dual-item" @click="toWallet">
          <view class="item-icon bg-green">
            <uni-icons type="wallet" size="28" color="#fff" />
          </view>
          <text class="item-title">我的钱包</text>
          <text class="item-value text-green">¥{{ wallet.balance }}</text>
        </view>
        <view class="dual-divider"></view>
        <view class="dual-item" @click="toCoupon">
          <view class="item-icon bg-yellow">
            <uni-icons type="ticket" size="28" color="#fff" />
          </view>
          <text class="item-title">优惠券</text>
          <text class="item-value text-yellow">{{ coupon.availableCount }}张可用</text>
        </view>
      </view>

      <!-- ==========================================
           5. 我的订单模块（独立的func-card！！之前嵌套错了）
           ========================================== -->
      <view class="func-card">
        <view class="card-header">
          <text class="card-title">我的订单</text>
          <text class="view-more" @click="toAllOrder">
            查看全部
            <uni-icons type="right" size="14" color="#9CA3AF" />
          </text>
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
              <uni-icons :type="tab.icon" size="24" :color="tab.color" />
              <text class="badge" v-if="tab.hasBadge"></text>
            </view>
            <text :style="{color: currentOrderTab === tab.value ? tab.color : '#9CA3AF'}">{{ tab.label }}</text>
          </view>
        </view>

        <!-- 订单列表（独立在order-tabs外面！！） -->
        <view class="order-list">
          <view
              class="order-card"
              v-for="order in showOrders"
              :key="order.id"
              @click="toOrderDetail(order.id)"
          >
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

      <!-- ==========================================
           6. 功能菜单列表（独立的func-card！！之前嵌套错了）
           ========================================== -->
      <view class="func-card menu-card">
        <view
            class="menu-item"
            v-for="item in menuList"
            :key="item.key"
            @click="toMenuPage(item)"
        >
          <view class="menu-icon" :style="{background: item.bgColor}">
            <uni-icons :type="item.icon" size="22" :color="item.color" />
          </view>
          <text class="menu-title">{{ item.title }}</text>
          <uni-icons type="right" size="18" color="#9CA3AF" />
        </view>
      </view>

      <!-- ==========================================
           7. 底部安全区域（单独放滚动容器最后）
           ========================================== -->
      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from  "@dcloudio/uni-app"
import { getUserInfo } from '@/api/billiard/user'
import { getWallet } from '@/api/billiard/wallet'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

// ---------------------- 状态定义 ----------------------
// 刷新状态
const refreshing = ref(false)
// 当前订单分类
const currentOrderTab = ref(2) // 默认选中待评价，和设计图一致

// 用户信息
const userInfo = ref({
  avatar: '',
  nickname: '',
  phone: '',
  level: '普通会员',
  levelClass: 'level-normal'
})

// 用户统计
const stats = ref({
  totalOrder: 0,
  finishOrder: 0,
  avgScore: 0
})

// 钱包信息
const wallet = ref({
  balance: 0,
  totalExpense: 0,
  totalRecharge: 0
})

// 加载钱包数据
const loadWallet = async () => {
  try {
    const res = await getWallet()
    if (res.data) {
      wallet.value = {
        balance: (res.data.balance || 0) / 100, // 分转元
        totalExpense: (res.data.totalExpense || 0) / 100,
        totalRecharge: (res.data.totalRecharge || 0) / 100
      }
    }
  } catch (error) {
    console.error('加载钱包失败:', error)
  }
}

// 优惠券信息
const coupon = ref({
  availableCount: 3
})

// 订单分类
const orderTabs = ref([
  { value: 0, label: '待付款', icon: 'clock', color: '#FBBF24', hasBadge: true },
  { value: 1, label: '进行中', icon: 'play', color: '#00BB88', hasBadge: false },
  { value: 2, label: '待评价', icon: 'star', color: '#FBBF24', hasBadge: true },
  { value: 3, label: '已完成', icon: 'checkmarkempty', color: '#00BB88', hasBadge: false },
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

// 功能菜单（修正了跳转路径！！对应刚才整合的pages.json）
const menuList = ref([
  { key: 'collection', title: '我的收藏', icon: 'heart', bgColor: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f', path: '/pages/mine/favorites/index' },
  { key: 'follow', title: '关注教练', icon: 'personadd', bgColor: 'rgba(0, 187, 136, 0.2)', color: '#00BB88', path: '' },
  { key: 'help', title: '帮助中心', icon: 'question', bgColor: 'rgba(107, 114, 128, 0.2)', color: '#6B7280', path: '/pages/mine/help/index' },
])

// ---------------------- 计算属性 ----------------------
// 当前展示的订单
const showOrders = computed(() => {
  return orderList.value[currentOrderTab.value] || []
})

// ---------------------- 数据加载 ----------------------
// 加载用户信息
const loadUserInfo = async () => {
  try {
    const res = await getUserInfo()
    const data = res.data || {}

    // 处理头像
    if (data.avatar) {
      userInfo.value.avatar = data.avatar
    } else {
      userInfo.value.avatar = '/static/default-avatar.png'
    }

    // 处理昵称
    userInfo.value.nickname = data.nickname || '用户'

    // 处理手机号（脱敏显示）
    if (data.mobile) {
      userInfo.value.phone = data.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    }

    // 处理等级（暂时默认普通会员，后续可根据业务扩展）
    userInfo.value.level = '普通会员'
    userInfo.value.levelClass = 'level-normal'

  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// ---------------------- 交互方法 ----------------------
// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  // 重新加载数据
  await Promise.all([
    loadUserInfo(),
    loadWallet()
  ])
  refreshing.value = false
  uni.showToast({ title: '刷新成功', icon: 'success' })
}

// 预览当前头像
const previewAvatar = () => {
  if (!userInfo.value.avatar) return
  uni.previewImage({
    urls: [userInfo.value.avatar],
    current: userInfo.value.avatar
  })
}

// 切换订单分类
const switchOrderTab = (val) => {
  currentOrderTab.value = val
}

// 路由跳转方法（全部修正为新pages.json的路径！！）
const toEditInfo = () => {
  uni.navigateTo({ url: '/pages/mine/info/index' })
}

const toSetting = () => {
  uni.navigateTo({ url: '/pages/mine/setting/index' })
}

const toWallet = () => {
  uni.navigateTo({ url: '/pages/mine/wallet/index' })
}

const toCoupon = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

const toAllOrder = () => {
  uni.switchTab({ url: '/pages/order/list' })
}

const toOrderDetail = (orderId) => {
  uni.navigateTo({ url: `/pages/order/detail?id=${orderId}` })
}

const toReview = (orderId) => {
  uni.navigateTo({ url: `/pages/evaluate/index?id=${orderId}` })
}

const toMenuPage = (item) => {
  if (item.path) {
    uni.navigateTo({ url: item.path })
  } else {
    uni.showToast({ title: '功能开发中', icon: 'none' })
  }
}

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  // 页面加载拉取用户数据
  loadUserInfo()
  loadWallet()
})

// 页面显示刷新数据
onShow(() => {
  // 每次进入页面刷新用户数据
  loadUserInfo()
  loadWallet()
})
</script>

<style lang="scss" scoped>
/* ==========================================
   全局容器与布局（严格安全区+撑满）
   ========================================== */
.my-page-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
}

/* ==========================================
   统一的自定义顶部导航栏（严格上安全区）
   ========================================== */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + constant(safe-area-inset-top));
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: transparent; /* 我的页面导航透明 */
  position: sticky;
  top: 0;
  z-index: 999;
  .nav-placeholder {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-title {
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
  }
}

/* ==========================================
   统一的滚动容器（严格撑满剩余）
   ========================================== */
.my-scroll {
  flex: 1;
  width: 100%;
}

/* ==========================================
   统一的通用卡片样式
   ========================================== */
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
      font-size: 26rpx;
      display: flex;
      align-items: center;
      gap: 4rpx;
    }
  }
}

/* ==========================================
   3. 顶部个人信息卡片
   ========================================== */
.user-card {
  margin: 20rpx 30rpx 30rpx; /* 比通用卡片多20rpx的顶部间距 */
  background: linear-gradient(135deg, rgba(0, 187, 136, 0.2) 0%, #1E252B 100%);
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
      border: 4rpx solid #00BB88;
      flex-shrink: 0;
    }
    .user-info {
      flex: 1;
      padding-top: 8rpx;
      .user-name-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12rpx;
        .user-name {
          color: #fff;
          font-size: 40rpx;
          font-weight: 700;
        }
        .edit-btn {
          color: #9CA3AF;
          font-size: 26rpx;
          font-weight: normal;
          display: flex;
          align-items: center;
          gap: 4rpx;
          flex-shrink: 0;
        }
      }
      .user-phone {
        color: #9CA3AF;
        font-size: 28rpx;
        margin-bottom: 16rpx;
      }
      .user-level {
        display: inline-block;
        padding: 4rpx 24rpx;
        border-radius: 8rpx;
        font-size: 24rpx;
        font-weight: 500;
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
      flex-shrink: 0;
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
        font-size: 44rpx;
        font-weight: bold;
        margin-bottom: 8rpx;
      }
      .stats-label {
        display: block;
        color: #9CA3AF;
        font-size: 26rpx;
      }
    }
    .stats-divider {
      width: 2rpx;
      background: rgba(255,255,255,0.1);
      margin-top: 8rpx;
      margin-bottom: 8rpx;
    }
  }
}

/* ==========================================
   4. 钱包+优惠券双栏卡片（兼容所有端！！去掉:has()）
   ========================================== */
.dual-card {
  display: flex;
  align-items: center;
  gap: 30rpx;
  padding: 30rpx 0; /* 上下留通用padding，左右不要因为flex撑宽变窄 */
  padding-left: 0;
  padding-right: 0;
}
.dual-item {
  flex: 1;
  text-align: center;
  padding: 0 10rpx; /* 左右留间距防溢出 */
  .item-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin: 0 auto 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .item-title {
    display: block;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    margin-bottom: 8rpx;
  }
  .item-value {
    font-size: 26rpx;
    font-weight: 600;
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
  height: 100rpx; /* 固定高度撑住双栏的视觉分隔 */
  background: rgba(255,255,255,0.1);
}

/* ==========================================
   5. 我的订单模块
   ========================================== */
.order-tabs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding: 0 10rpx;
  .tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    flex: 1;
    .tab-icon {
      position: relative;
      width: 44rpx;
      height: 44rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      .badge {
        position: absolute;
        top: 0;
        right: 0;
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
        background: #EF4444;
        border: 2rpx solid #1E252B;
      }
    }
    text {
      font-size: 26rpx;
      white-space: nowrap;
    }
  }
}

.order-list {
  .order-card {
    background: #2a3338;
    border-radius: 20rpx;
    padding: 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    &:last-child {
      margin-bottom: 0;
    }
    .order-left {
      display: flex;
      align-items: center;
      gap: 16rpx;
      flex: 1;
      min-width: 0; /* 防止flex子元素溢出 */
      .coach-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 12rpx;
        flex-shrink: 0;
      }
      .order-info {
        flex: 1;
        min-width: 0; /* 防止flex子元素溢出 */
        .order-title {
          color: #fff;
          font-size: 30rpx;
          font-weight: 600;
          margin-bottom: 8rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .order-subtitle {
          color: #9CA3AF;
          font-size: 24rpx;
          margin-bottom: 12rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .order-time {
          color: #6B7280;
          font-size: 24rpx;
        }
      }
    }
    .order-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12rpx;
      flex-shrink: 0;
      margin-left: 16rpx;
      .order-status {
        padding: 4rpx 14rpx;
        border-radius: 8rpx;
        color: #fff;
        font-size: 24rpx;
        white-space: nowrap;
      }
      .order-action-btn {
        width: 150rpx;
        height: 56rpx;
        line-height: 56rpx;
        border-radius: 28rpx;
        color: #fff;
        font-size: 26rpx;
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
    color: #6B7280;
    font-size: 26rpx;
    padding: 60rpx 0 20rpx;
  }
}

/* ==========================================
   6. 功能菜单列表
   ========================================== */
.menu-card {
  padding: 0 !important; /* 去掉通用卡片的左右padding */
  .menu-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 28rpx 30rpx;
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
      flex-shrink: 0;
    }
    .menu-title {
      flex: 1;
      color: #fff;
      font-size: 30rpx;
      font-weight: 500;
    }
  }
}

/* ==========================================
   7. 底部安全区域
   ========================================== */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
  margin-top: 10rpx; /* 多留一点底部间距更美观 */
}
</style>