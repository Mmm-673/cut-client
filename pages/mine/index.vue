<template>
  <view class="my-page-wrapper">
    <!-- ==========================================
         2. 页面内容容器（普通布局自然滚动）
         ========================================== -->
    <view class="page-content" v-if="isUserLoggedIn">
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
            </view>
            <view class="user-phone">{{ userInfo.phone }}</view>
            <text class="edit-btn" @click="toEditInfo">编辑资料</text>
          </view>

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
        </view>
      </view>


      <!-- ==========================================
           5. 我的订单模块
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

        <!-- 订单列表 -->
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
           6. 功能菜单列表
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
           7. 底部安全区域
           ========================================== -->
      <view class="safe-area-bottom"></view>
    </view>

    <!-- ==========================================
         未登录时显示的提示页面
         ========================================== -->
    <view class="login-prompt-wrapper" v-else>
      <view class="prompt-content">
        <view class="prompt-icon">
          <uni-icons type="person" size="120" color="#00BB88" />
        </view>
        <text class="prompt-title">登录后查看更多内容</text>
        <text class="prompt-desc">登录后可查看订单、管理个人信息</text>
        <button class="login-btn" @click="toLogin">立即登录</button>
      </view>
      <view class="safe-area-bottom"></view>
    </view>

    <!-- 图片查看器 -->
    <ImageViewer
      :visible="showImageViewer"
      :images="viewerImages"
      :current="viewerCurrent"
      @close="showImageViewer = false"
    />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from  "@dcloudio/uni-app"
import { getUserInfo } from '@/api/billiard/user'
import { getOrderList } from '@/api/billiard/order'
import { useUserStore } from '@/store/modules/user'
import { isLoggedIn } from '@/utils/token'

// 后端状态映射：10=待付款,20=待接单,30=已接单,40=进行中,50=待评价,60=已完成,70=已取消
const STATUS_MAP = {
  TO_PAY: 10,
  PENDING_ACCEPT: 20,
  ACCEPTED: 30,
  IN_SERVICE: 40,
  TO_REVIEW: 50,
  COMPLETED: 60,
  CANCELLED: 70
}

// 前端Tab -> 后端状态列表
const TAB_TO_STATUSES = {
  0: [STATUS_MAP.TO_PAY], // 待付款
  1: [STATUS_MAP.PENDING_ACCEPT, STATUS_MAP.ACCEPTED, STATUS_MAP.IN_SERVICE], // 进行中
  2: [STATUS_MAP.TO_REVIEW], // 待评价
  3: [STATUS_MAP.COMPLETED], // 已完成
  4: [STATUS_MAP.CANCELLED] // 已取消
}

// 状态文本映射
const STATUS_TEXT = {
  [STATUS_MAP.TO_PAY]: '待付款',
  [STATUS_MAP.PENDING_ACCEPT]: '待接单',
  [STATUS_MAP.ACCEPTED]: '已接单',
  [STATUS_MAP.IN_SERVICE]: '进行中',
  [STATUS_MAP.TO_REVIEW]: '待评价',
  [STATUS_MAP.COMPLETED]: '已完成',
  [STATUS_MAP.CANCELLED]: '已取消'
}

// 状态颜色映射
const STATUS_COLOR = {
  [STATUS_MAP.TO_PAY]: 'rgba(251, 191, 36, 0.2)',
  [STATUS_MAP.PENDING_ACCEPT]: 'rgba(0, 187, 136, 0.2)',
  [STATUS_MAP.ACCEPTED]: 'rgba(0, 187, 136, 0.2)',
  [STATUS_MAP.IN_SERVICE]: 'rgba(0, 187, 136, 0.2)',
  [STATUS_MAP.TO_REVIEW]: 'rgba(0, 187, 136, 0.2)',
  [STATUS_MAP.COMPLETED]: 'rgba(107, 114, 128, 0.2)',
  [STATUS_MAP.CANCELLED]: 'rgba(239, 68, 68, 0.2)'
}

// 服务类型映射
const SERVICE_TYPE_TEXT = {
  1: '台球陪练',
  2: '达人带路'
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const endHour = String(date.getHours() + Math.floor((date.getMinutes() + 0) / 60)).padStart(2, '0')
  const endMinute = String((date.getMinutes() + 0) % 60).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}-${endHour}:${endMinute}`
}

// 转换订单数据
const transformOrder = (item) => {
  const durationHours = Math.round(item.serviceDuration / 60)
  const endTime = item.bookingTime + item.serviceDuration * 60 * 1000
  const startTime = new Date(item.bookingTime)
  const endTimeDate = new Date(endTime)

  const startHour = String(startTime.getHours()).padStart(2, '0')
  const startMin = String(startTime.getMinutes()).padStart(2, '0')
  const endHour = String(endTimeDate.getHours()).padStart(2, '0')
  const endMin = String(endTimeDate.getMinutes()).padStart(2, '0')
  const dateStr = `${startTime.getFullYear()}-${String(startTime.getMonth() + 1).padStart(2, '0')}-${String(startTime.getDate()).padStart(2, '0')}`
  const timeStr = `${dateStr} ${startHour}:${startMin}-${endHour}:${endMin}`

  return {
    id: item.orderId,
    coachAvatar: item.coachMainPhoto || '/static/default-avatar.png',
    coachName: item.coachStageName || '裁教',
    coachLevel: '教练',
    serviceName: SERVICE_TYPE_TEXT[item.serviceType] || '台球陪练',
    duration: durationHours,
    time: timeStr,
    statusText: STATUS_TEXT[item.status] || '未知',
    statusColor: STATUS_COLOR[item.status] || 'rgba(107,114,128,0.2)',
    showAction: item.status === STATUS_MAP.TO_REVIEW,
    actionText: '去评价',
    actionColor: '#00BB88'
  }
}

const userStore = useUserStore()

// ---------------------- 状态定义 ----------------------
// 登录状态
const isUserLoggedIn = ref(isLoggedIn())
// 刷新状态
const refreshing = ref(false)
// 当前订单分类
const currentOrderTab = ref(0)

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

// 计算订单统计
const calculateStats = () => {
  let total = 0
  let finished = 0
  Object.values(orderList.value).forEach(list => {
    total += list.length
  })
  finished = (orderList.value[3] || []).length
  stats.value.totalOrder = total
  stats.value.finishOrder = finished
  stats.value.avgScore = 0
}

// 订单分类
const orderTabs = ref([
  { value: 0, label: '待付款', icon: 'wallet', color: '#FBBF24', hasBadge: true },
  { value: 1, label: '进行中', icon: 'redo', color: '#00BB88', hasBadge: false },
  { value: 2, label: '待评价', icon: 'star', color: '#FBBF24', hasBadge: true },
  { value: 3, label: '已完成', icon: 'checkmarkempty', color: '#00BB88', hasBadge: false },
  { value: 4, label: '已取消', icon: 'close', color: '#EF4444', hasBadge: false },
])

// 订单列表数据
const orderList = ref({
  0: [],
  1: [],
  2: [],
  3: [],
  4: []
})

// 加载订单列表
const loadOrders = async () => {
  try {
    const promises = Object.keys(TAB_TO_STATUSES).map(async (tab) => {
      const statuses = TAB_TO_STATUSES[tab]
      const list = []
      for (const status of statuses) {
        try {
          const res = await getOrderList({ status, pageNo: 1, pageSize: 100 })
          const data = res.data || {}
          const items = data.list || data.records || data.rows || []
          list.push(...items)
        } catch (e) {
          console.error(`加载状态${status}订单失败:`, e)
        }
      }
      orderList.value[tab] = list.map(transformOrder)
    })
    await Promise.all(promises)
    calculateStats()
  } catch (error) {
    console.error('加载订单列表失败:', error)
  }
}

// 功能菜单
const menuList = ref([
  { key: 'wallet', title: '收支统计', icon: 'wallet-filled', bgColor: 'rgba(0, 187, 136, 0.2)', color: '#00BB88', path: '/subpkg/mine/wallet' },
  { key: 'collection', title: '我的收藏', icon: 'heart', bgColor: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f', path: '/subpkg/mine/favorites' },
  { key: 'help', title: '客服中心', icon: 'headphones', bgColor: 'rgba(107, 114, 128, 0.2)', color: '#6B7280', path: '/subpkg/mine/help' }
])

// ---------------------- 计算属性 ----------------------
const showOrders = computed(() => {
  const list = orderList.value[currentOrderTab.value] || []
  return list.slice(0, 3)
})

// ---------------------- 数据加载 ----------------------
const loadUserInfo = async () => {
  try {
    const res = await getUserInfo()
    const data = res.data || {}

    if (data.avatar) {
      userInfo.value.avatar = data.avatar
    } else {
      userInfo.value.avatar = '/static/default-avatar.png'
    }

    userInfo.value.nickname = data.nickname || '用户'

    if (data.mobile) {
      userInfo.value.phone = data.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    }

    userInfo.value.level = '普通会员'
    userInfo.value.levelClass = 'level-normal'

  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// ---------------------- 交互方法 ----------------------
const onRefresh = async () => {
  if (isUserLoggedIn.value) {
    await Promise.all([
      loadUserInfo(),
      loadOrders()
    ])
  }
  uni.stopPullDownRefresh()
  uni.showToast({ title: '刷新成功', icon: 'success' })
}

onPullDownRefresh(() => {
  onRefresh()
})

const showImageViewer = ref(false)
const viewerImages = ref([])
const viewerCurrent = ref(0)

const previewAvatar = () => {
  if (!userInfo.value.avatar) return
  viewerImages.value = [userInfo.value.avatar]
  viewerCurrent.value = 0
  showImageViewer.value = true
}

const switchOrderTab = (val) => {
  currentOrderTab.value = val
}

const toEditInfo = () => {
  uni.navigateTo({ url: '/subpkg/mine/info' })
}

const toSetting = () => {
  uni.navigateTo({ url: '/subpkg/mine/setting' })
}

const toWallet = () => {
  uni.navigateTo({ url: '/subpkg/mine/wallet' })
}

const toCoupon = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

const toAllOrder = () => {
  uni.navigateTo({ url: '/pages/order/list' })
}

const toOrderDetail = (orderId) => {
  uni.navigateTo({ url: `/subpkg/order/detail?id=${orderId}` })
}

const toReview = (orderId) => {
  uni.navigateTo({ url: `/subpkg/coach/evaluate?orderId=${orderId}` })
}

const toMenuPage = (item) => {
  if (item.path) {
    uni.navigateTo({ url: item.path })
  } else {
    uni.showToast({ title: '功能开发中', icon: 'none' })
  }
}

const toLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' })
}

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  if (isUserLoggedIn.value) {
    loadUserInfo()
    loadOrders()
  }
})

onShow(() => {
  isUserLoggedIn.value = isLoggedIn()
  if (isUserLoggedIn.value) {
    loadUserInfo()
    loadOrders()
  }
})
</script>

<style lang="scss" scoped>
.my-page-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-top: 130rpx;
}

.page-content {
  width: 100%;
}

.func-card {
  margin: 0 30rpx 30rpx;
  background: linear-gradient(145deg, #1E252B 0%, #1a2024 100%);
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  border: 1rpx solid rgba(255, 255, 255, 0.03);
  transition: all 0.3s ease;
  transform: translateY(0);

  &:active {
    transform: translateY(2rpx);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  }

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
      transition: color 0.3s ease;
      &:active {
        color: #00BB88;
      }
    }
  }
}

.user-card {
  margin: 20rpx 30rpx 30rpx;
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
          color: #fff;
          font-size: 40rpx;
          font-weight: 700;
        }
      }
      .user-phone {
        color: #9CA3AF;
        font-size: 28rpx;
        margin-bottom: 12rpx;
      }
      .edit-btn {
        color: #9CA3AF;
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
      min-width: 0;
      .coach-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 12rpx;
        flex-shrink: 0;
      }
      .order-info {
        flex: 1;
        min-width: 0;
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

.menu-card {
  padding: 0 !important;
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

.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
  margin-top: 10rpx;
}

/* ==========================================
   未登录提示页面样式
   ========================================== */
.login-prompt-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-top: 0;
  margin-top: -130rpx;
}

.prompt-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 60rpx;
  flex: 1;
  justify-content: center;
}

.prompt-icon {
  width: 200rpx;
  height: 200rpx;
  background: rgba(0, 187, 136, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.prompt-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16rpx;
}

.prompt-desc {
  font-size: 28rpx;
  color: #9CA3AF;
  margin-bottom: 60rpx;
}

.login-btn {
  width: 300rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #00BB88 0%, #00a87a 100%);
  border-radius: 44rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  padding: 0;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(0, 187, 136, 0.3);
  &::after {
    border: none;
  }
  &:active {
    opacity: 0.8;
  }
}
</style>
