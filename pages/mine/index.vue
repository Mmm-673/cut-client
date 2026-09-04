<template>
  <view class="my-page-wrapper" :class="themeClass">
    <!-- ==========================================
         2. 页面内容容器（普通布局自然滚动）
         ========================================== -->
    <view class="page-content" v-if="isUserLoggedIn">
      <!-- 顶部个人信息卡片 -->
      <user-profile-card
        :user-info="userInfo"
        :stats="stats"
        :show-stats="showOrderSections"
        @avatar-click="previewAvatar"
        @edit-click="toEditInfo"
        @setting-click="toSetting"
        @stats-click="toAllOrder"
      />

      <!-- 我的订单快捷入口（审核模式下隐藏） -->
      <order-quick-entry
        v-if="showOrderSections"
        :tabs="orderTabs"
        :active-tab="currentOrderTab"
        :orders="showOrders"
        empty-text="暂无对应订单"
        @tab-change="switchOrderTab"
        @view-all="toAllOrder"
        @order-click="toOrderDetail"
      />

      <!-- 功能菜单列表 -->
      <mine-menu-list
        :menu-list="visibleMenuList"
        :badge-map="menuBadgeMap"
        @item-click="toMenuPage"
      />

      <!-- 底部安全区域 -->
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
import { onShow, onUnload, onPullDownRefresh } from  "@dcloudio/uni-app"
import { getUserInfo } from '@/api/billiard/user'
import { getOrderList } from '@/api/billiard/order'
import { getUnreadCount } from '@/api/billiard/notification'
import { useUserStore } from '@/store/modules/user'
import { useConfigStore, useThemeStore } from '@/store'
import { usePageTheme } from '@/composables/usePageTheme'
import { isLoggedIn } from '@/utils/token'
import UserProfileCard from '@/components/user-profile-card/user-profile-card.vue'
import OrderQuickEntry from '@/components/order-quick-entry/order-quick-entry.vue'
import MineMenuList from '@/components/mine-menu-list/mine-menu-list.vue'

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

// 页面主题管理
usePageTheme()

// 更新自定义 TabBar 选中状态
const updateCustomTabBar = () => {
  if (uni.$updateCustomTabBar) {
    uni.$updateCustomTabBar(2)
  }
}

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
  [STATUS_MAP.TO_PAY]: '#F59E0B',
  [STATUS_MAP.PENDING_ACCEPT]: '#2563EB',
  [STATUS_MAP.ACCEPTED]: '#2563EB',
  [STATUS_MAP.IN_SERVICE]: '#2563EB',
  [STATUS_MAP.TO_REVIEW]: '#D97706',
  [STATUS_MAP.COMPLETED]: '#059669',
  [STATUS_MAP.CANCELLED]: '#DC2626'
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

// 订单类型常量
const ORDER_TYPE_NORMAL = 1
const ORDER_TYPE_ONSITE = 2

// 判断是否为现场订单
const isOnsiteOrder = (order) => Number(order.type) === ORDER_TYPE_ONSITE

// 转换订单数据
const transformOrder = (item) => {
  const isOnsite = isOnsiteOrder(item)
  // 时长兼容：普通订单 serviceDuration（分钟），现场订单 billingMinutes（分钟）
  const durationMinutes = isOnsite
    ? (item.billingMinutes || item.serviceDuration || 0)
    : (item.serviceDuration || 0)
  const durationHours = Math.round(durationMinutes / 60) || 1
  const bookingTime = isOnsite ? item.startTime : item.bookingTime
  const endTime = bookingTime + durationMinutes * 60 * 1000
  const startTime = new Date(bookingTime)
  const endTimeDate = new Date(endTime)

  const startHour = String(startTime.getHours()).padStart(2, '0')
  const startMin = String(startTime.getMinutes()).padStart(2, '0')
  const endHour = String(endTimeDate.getHours()).padStart(2, '0')
  const endMin = String(endTimeDate.getMinutes()).padStart(2, '0')
  const dateStr = `${startTime.getFullYear()}-${String(startTime.getMonth() + 1).padStart(2, '0')}-${String(startTime.getDate()).padStart(2, '0')}`
  const timeStr = `${dateStr} ${startHour}:${startMin}-${endHour}:${endMin}`

  // 头像兼容：普通订单 coachAvatar，现场订单 coachMainPhoto
  const avatar = isOnsite
    ? (item.coachMainPhoto || '/static/default-avatar.png')
    : (item.coachAvatar || item.coachMainPhoto || '/static/default-avatar.png')

  // 唯一 key，避免普通订单与现场订单 ID 冲突
  const key = isOnsite ? `onsite_${item.id}` : `normal_${item.orderId}`

  return {
    key,
    id: isOnsite ? item.id : item.orderId,
    orderId: item.orderId,
    type: isOnsite ? ORDER_TYPE_ONSITE : ORDER_TYPE_NORMAL,
    coachAvatar: avatar,
    coachName: item.coachStageName || '裁教',
    coachLevel: '教练',
    serviceName: getServiceTypeName(item.serviceType),
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
const configStore = useConfigStore()

// 审核模式状态（响应式）
const reviewMode = computed(() => configStore.reviewMode)
const reviewLoaded = computed(() => configStore.reviewLoaded)
// 审核模式下隐藏订单统计与订单卡片（开关未就绪时也不展示陪玩内容）
const showOrderSections = computed(() => reviewLoaded.value && !reviewMode.value)

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
  // 审核模式下不请求陪玩订单
  if (reviewMode.value) return
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
  { key: 'notification', title: '消息通知', icon: 'chatbubble', bgColor: 'rgba(0, 187, 136, 0.2)', color: '#00BB88', path: '/subpkg/mine/notification/index' },
  { key: 'wallet', title: '收支统计', icon: 'wallet-filled', bgColor: 'rgba(0, 187, 136, 0.2)', color: '#00BB88', path: '/subpkg/mine/wallet' },
  { key: 'collection', title: '我的收藏', icon: 'heart', bgColor: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f', path: '/subpkg/mine/favorites' },
  { key: 'help', title: '客服中心', icon: 'headphones', bgColor: 'rgba(107, 114, 128, 0.2)', color: '#6B7280', path: '/subpkg/mine/help' }
])

// 通知未读数
const notificationUnreadCount = ref(0)

// 审核模式下隐藏陪玩相关入口（收支统计/我的收藏）
const visibleMenuList = computed(() => {
  if (!reviewMode.value) return menuList.value
  return menuList.value.filter(item => !['wallet', 'collection'].includes(item.key))
})

// 菜单角标映射
const menuBadgeMap = computed(() => ({
  notification: notificationUnreadCount.value
}))

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

const toOrderDetail = (order) => {
  if (order.type === ORDER_TYPE_ONSITE) {
    uni.navigateTo({ url: `/subpkg/onsite/detail?id=${order.id}` })
  } else {
    uni.navigateTo({ url: `/subpkg/order/detail?id=${order.orderId}` })
  }
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

// 获取通知未读数
const fetchNotificationUnread = async () => {
  try {
    const res = await getUnreadCount()
    notificationUnreadCount.value = res.data || 0
  } catch (e) {
    console.error('获取通知未读数失败', e)
  }
}

onShow(() => {
  // 同步 tabBar 文案（setTabBarItem 仅 tab 页可调，启动时可能被跳过）
  configStore.syncTabBarLabel()
  isUserLoggedIn.value = isLoggedIn()
  if (isUserLoggedIn.value) {
    loadUserInfo()
    loadOrders()
    fetchNotificationUnread()
  }
  // 更新自定义 TabBar 选中状态
  updateCustomTabBar()
})

// 监听 WebSocket 推送的重大通知，实时更新未读数
const onMajorNotification = () => {
  if (isUserLoggedIn.value) {
    fetchNotificationUnread()
  }
}
uni.$on('major-notification', onMajorNotification)

onUnload(() => {
  uni.$off('major-notification', onMajorNotification)
})
</script>

<style lang="scss" scoped>
.my-page-wrapper {
  min-height: 100vh;
  background: var(--bg-page);
  padding-top: 130rpx;
}

.page-content {
  width: 100%;
  height: 100%;
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
  background: var(--brand-light-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.prompt-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16rpx;
}

.prompt-desc {
  font-size: 28rpx;
  color: var(--text-secondary);
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
