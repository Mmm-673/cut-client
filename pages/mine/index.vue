<template>
  <view class="my-page-wrapper">
    <!-- ==========================================
         1. 统一的自定义顶部导航栏（适配上安全区）
         ========================================== -->
<!--    <view class="nav-bar">-->
<!--      &lt;!&ndash; 占位对称用（右侧没有按钮） &ndash;&gt;-->
<!--      <view class="nav-placeholder"></view>-->
<!--      <text class="nav-title">我的</text>-->
<!--      <view class="nav-placeholder"></view>-->
<!--    </view>-->

    <!-- ==========================================
         2. 页面内容容器（普通布局自然滚动）
         ========================================== -->
    <view class="page-content">
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

<!--          &lt;!&ndash; 设置按钮 &ndash;&gt;-->
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
           7. 底部安全区域
           ========================================== -->
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
    coachLevel: '教练', // 后端暂时没返回等级
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
// 刷新状态
const refreshing = ref(false)
// 当前订单分类
const currentOrderTab = ref(0) // 默认选中待付款，和设计图一致

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
  finished = (orderList.value[3] || []).length // 已完成订单数
  stats.value.totalOrder = total
  stats.value.finishOrder = finished
  stats.value.avgScore = 0 // 暂时没有评分数据
}

// 优惠券信息
const coupon = ref({
  availableCount: 3
})

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
  0: [], // 待付款
  1: [], // 进行中
  2: [], // 待评价
  3: [], // 已完成
  4: [] // 已取消
})

// 加载订单列表
const loadOrders = async () => {
  try {
    // 并行加载所有状态的订单
    const promises = Object.keys(TAB_TO_STATUSES).map(async (tab) => {
      const statuses = TAB_TO_STATUSES[tab]
      const list = []
      for (const status of statuses) {
        try {
          const res = await getOrderList({ status, pageNo: 1, pageSize: 100 }) // 多取点用于统计
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
    calculateStats() // 加载完成后计算统计
  } catch (error) {
    console.error('加载订单列表失败:', error)
  }
}

// 功能菜单（修正了跳转路径！！对应刚才整合的pages.json）
const menuList = ref([
  { key: 'wallet', title: '收支统计', icon: 'wallet-filled', bgColor: 'rgba(0, 187, 136, 0.2)', color: '#00BB88', path: '/subpkg/mine/wallet' },
  { key: 'collection', title: '我的收藏', icon: 'heart', bgColor: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f', path: '/subpkg/mine/favorites' },
  { key: 'help', title: '客服中心', icon: 'headphones', bgColor: 'rgba(107, 114, 128, 0.2)', color: '#6B7280', path: '/subpkg/mine/help' }
])

// ---------------------- 计算属性 ----------------------
// 当前展示的订单（只展示前3条）
const showOrders = computed(() => {
  const list = orderList.value[currentOrderTab.value] || []
  return list.slice(0, 3)
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
// 下拉刷新（页面级）
const onRefresh = async () => {
  // 重新加载数据
  await Promise.all([
    loadUserInfo(),
    loadOrders()
  ])
  uni.stopPullDownRefresh()
  uni.showToast({ title: '刷新成功', icon: 'success' })
}

// 页面下拉刷新生命周期
onPullDownRefresh(() => {
  onRefresh()
})

// 图片查看器
const showImageViewer = ref(false)
const viewerImages = ref([])
const viewerCurrent = ref(0)

// 预览当前头像
const previewAvatar = () => {
  if (!userInfo.value.avatar) return
  viewerImages.value = [userInfo.value.avatar]
  viewerCurrent.value = 0
  showImageViewer.value = true
}

// 切换订单分类
const switchOrderTab = (val) => {
  currentOrderTab.value = val
}

// 路由跳转方法（全部修正为新pages.json的路径！！）
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

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  // 页面加载拉取用户数据
  loadUserInfo()
  loadOrders()
})

// 页面显示刷新数据
onShow(() => {
  // 每次进入页面刷新用户数据
  loadUserInfo()
  loadOrders()
})
</script>

<style lang="scss" scoped>
/* ==========================================
   全局容器与布局（普通布局自然滚动）
   ========================================== */
.my-page-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-top: 130rpx;
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
   页面内容容器
   ========================================== */
.page-content {
  width: 100%;
}

/* ==========================================
   统一的通用卡片样式
   ========================================== */
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
        .user-level {
          display: inline-block;
          padding: 4rpx 16rpx;
          border-radius: 8rpx;
          font-size: 22rpx;
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
   4. 我的订单模块
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