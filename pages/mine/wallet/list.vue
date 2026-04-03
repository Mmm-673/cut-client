<template>
  <view class="record-all-wrapper">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <uni-icons type="left" size="24" color="#fff" />
      </view>
      <text class="nav-title">全部交易记录</text>
      <view class="nav-filter" @click="openFilter">
        <uni-icons type="filter" size="24" color="#fff" />
      </view>
    </view>

    <scroll-view
        scroll-y
        class="record-scroll"
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="onLoadMore"
        :lower-threshold="50"
    >
      <!-- 分类切换栏 -->
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

      <!-- 统计概览（仅综合类标签显示，设计图默认显示） -->
      <view class="stat-card" v-if="['all', 'month'].includes(currentTab)">
        <view class="stat-header">
          <text class="stat-title">统计概览</text>
          <text class="stat-month">{{ currentStatMonth }}</text>
        </view>
        <view class="stat-data">
          <view class="stat-item">
            <text class="stat-label">总收入</text>
            <text class="stat-value income">¥{{ statData.income }}</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-label">总支出</text>
            <text class="stat-value expense">¥{{ statData.expense }}</text>
          </view>
        </view>
      </view>

      <!-- 时间分组列表 -->
      <view class="record-group-list">
        <view class="record-group" v-for="group in showGroupList" :key="group.date">
          <!-- 分组日期标题 -->
          <view class="group-date">{{ group.date }}</view>

          <!-- 分组交易卡片 -->
          <view class="group-card">
            <view
                class="record-item"
                v-for="item in group.list"
                :key="item.id"
                @click="toRecordDetail(item.id)"
            >
              <view class="record-icon" :style="{background: item.iconBg}">
                <uni-icons :type="item.icon" size="24" :color="item.iconColor" />
              </view>
              <view class="record-info">
                <text class="record-title">{{ item.title }}</text>
                <text class="record-subtitle">{{ item.subtitle }}</text>
              </view>
              <text class="record-amount" :style="{color: item.amountColor}">{{ item.amount }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载完成/加载中/空状态 -->
      <view class="load-tip" v-if="showGroupList.length === 0 && !loading">
        {{ emptyTip }}
      </view>
      <view class="load-tip loading" v-if="loading">
        <uni-icons type="spinner-cycle" size="20" color="#9CA3AF" style="animation: spin 1s linear infinite; margin-right: 12rpx;"></uni-icons>
        加载中...
      </view>
      <view class="load-tip" v-if="!hasMore && showGroupList.length > 0">
        已加载全部记录
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from  "@dcloudio/uni-app"

// ---------------------- 状态定义 ----------------------
// 刷新/加载状态
const refreshing = ref(false)
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const pageSize = ref(20)

// 当前选中的标签
const currentTab = ref('all')
// 空状态提示
const emptyTip = ref('暂无交易记录')
// 当前统计月份（默认本月）
const currentStatMonth = ref('2026年3月')

// ---------------------- 模拟数据 ----------------------
// 分类标签列表
const tabList = ref([
  { value: 'all', label: '全部' },
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自定义' }
])

// 统计数据
const statData = ref({
  income: '1,286.00',
  expense: '892.00'
})

// 分组后的完整交易数据（模拟）
const fullGroupList = ref([
  {
    date: '2026年3月28日',
    list: [
      {
        id: 10,
        title: '台球陪练消费',
        subtitle: '16:30 · 订单号:202603281630001',
        icon: 'wallet',
        iconBg: 'rgba(0, 187, 136, 0.2)',
        iconColor: '#00BB88',
        amount: '-¥198.00',
        amountColor: '#EF4444'
      }
    ]
  },
  {
    date: '2026年3月26日',
    list: [
      {
        id: 9,
        title: '订单取消退款',
        subtitle: '10:15 · 订单号:202603251015003',
        icon: 'refresh',
        iconBg: 'rgba(236, 72, 153, 0.2)',
        iconColor: '#EC4899',
        amount: '+¥158.00',
        amountColor: '#00BB88'
      },
      {
        id: 8,
        title: '账户充值',
        subtitle: '09:42 · 支付方式:微信支付',
        icon: 'plus-filled',
        iconBg: 'rgba(59, 130, 246, 0.2)',
        iconColor: '#3B82F6',
        amount: '+¥300.00',
        amountColor: '#00BB88'
      }
    ]
  },
  {
    date: '2026年3月22日',
    list: [
      {
        id: 7,
        title: '台球陪练消费',
        subtitle: '14:00 · 订单号:202603221400007',
        icon: 'wallet',
        iconBg: 'rgba(0, 187, 136, 0.2)',
        iconColor: '#00BB88',
        amount: '-¥168.00',
        amountColor: '#EF4444'
      },
      {
        id: 6,
        title: '陪练收入',
        subtitle: '18:30 · 订单号:202603221830012',
        icon: 'chatbubble-filled', // 替换成coin更合适？uni-icons没有coin用类似的
        iconBg: 'rgba(251, 191, 36, 0.2)',
        iconColor: '#FBBF24',
        amount: '+¥240.00',
        amountColor: '#00BB88'
      }
    ]
  },
  {
    date: '2026年3月18日',
    list: [
      {
        id: 5,
        title: '台球陪练消费',
        subtitle: '15:00 · 订单号:202603181500005',
        icon: 'wallet',
        iconBg: 'rgba(0, 187, 136, 0.2)',
        iconColor: '#00BB88',
        amount: '-¥218.00',
        amountColor: '#EF4444'
      },
      {
        id: 4,
        title: '账户提现',
        subtitle: '11:20 · 到账方式:支付宝',
        icon: 'minus-filled',
        iconBg: 'rgba(59, 130, 246, 0.2)',
        iconColor: '#3B82F6',
        amount: '-¥500.00',
        amountColor: '#EF4444'
      },
      {
        id: 3,
        title: '陪练收入',
        subtitle: '20:00 · 订单号:202603182000018',
        icon: 'chatbubble-filled',
        iconBg: 'rgba(251, 191, 36, 0.2)',
        iconColor: '#FBBF24',
        amount: '+¥320.00',
        amountColor: '#00BB88'
      }
    ]
  },
  {
    date: '2026年3月15日',
    list: [
      {
        id: 2,
        title: '陪练收入',
        subtitle: '16:30 · 订单号:202603151630009',
        icon: 'chatbubble-filled',
        iconBg: 'rgba(251, 191, 36, 0.2)',
        iconColor: '#FBBF24',
        amount: '+¥268.00',
        amountColor: '#00BB88'
      },
      {
        id: 1,
        title: '台球陪练消费',
        subtitle: '19:00 · 订单号:202603151900011',
        icon: 'wallet',
        iconBg: 'rgba(0, 187, 136, 0.2)',
        iconColor: '#00BB88',
        amount: '-¥188.00',
        amountColor: '#EF4444'
      }
    ]
  }
])

// 当前展示的分组列表（简化版筛选，实际项目按接口返回）
const showGroupList = computed(() => {
  if (currentTab.value === 'all' || currentTab.value === 'month') {
    return fullGroupList.value
  } else if (currentTab.value === 'income') {
    // 模拟筛选收入
    return fullGroupList.value.map(group => ({
      date: group.date,
      list: group.list.filter(item => item.amount.startsWith('+'))
    })).filter(group => group.list.length > 0)
  } else if (currentTab.value === 'expense') {
    // 模拟筛选支出
    return fullGroupList.value.map(group => ({
      date: group.date,
      list: group.list.filter(item => item.amount.startsWith('-'))
    })).filter(group => group.list.length > 0)
  } else {
    return fullGroupList.value
  }
})

// ---------------------- 交互方法 ----------------------
// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  page.value = 1
  hasMore.value = true
  loading.value = false
  // TODO: 这里调用后端接口刷新数据
  setTimeout(() => {
    refreshing.value = false
    uni.showToast({ title: '刷新成功', icon: 'success' })
  }, 1000)
}

// 上拉加载更多
const onLoadMore = () => {
  if (!hasMore.value || loading.value) return
  loading.value = true
  // TODO: 这里调用后端接口加载更多数据
  setTimeout(() => {
    loading.value = false
    // 模拟没有更多数据
    hasMore.value = false
  }, 1500)
}

// 切换分类标签
const switchTab = (val) => {
  currentTab.value = val
  page.value = 1
  hasMore.value = true
  // 切换时更新空状态提示
  if (val === 'income') emptyTip.value = '暂无收入记录'
  else if (val === 'expense') emptyTip.value = '暂无支出记录'
  else emptyTip.value = '暂无交易记录'
}

// 打开筛选弹窗
const openFilter = () => {
  uni.showToast({ title: '筛选功能开发中', icon: 'none' })
}

// 路由跳转方法
const goBack = () => {
  uni.navigateBack()
}

const toRecordDetail = (recordId) => {
  uni.navigateTo({ url: `/pages/wallet/record-detail?id=${recordId}` })
}

// ---------------------- 生命周期 ----------------------
onMounted(() => {
  // TODO: 这里调用后端接口初始化数据
})

onShow(() => {
  // 页面显示时可以刷新数据
})
</script>

<style lang="scss" scoped>
.record-all-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + constant(safe-area-inset-top));
  padding-top: calc(20rpx + env(safe-area-inset-top));
  .nav-back, .nav-filter {
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

/* 旋转动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.record-scroll {
  flex: 1;
  width: 100%;
}

/* 分类切换栏 */
.tab-scroll {
  padding: 20rpx 30rpx;
  white-space: nowrap;
  .tab-list {
    display: inline-flex;
    gap: 16rpx;
    .tab-item {
      padding: 16rpx 32rpx;
      background: rgba(30, 37, 43, 1);
      color: #9CA3AF;
      font-size: 28rpx;
      font-weight: 500;
      border-radius: 40rpx;
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

/* 通用统计卡片 */
.stat-card {
  margin: 0 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    .stat-title {
      color: #fff;
      font-size: 32rpx;
      font-weight: 600;
    }
    .stat-month {
      color: #9CA3AF;
      font-size: 26rpx;
    }
  }
  .stat-data {
    display: flex;
    align-items: center;
    .stat-item {
      flex: 1;
      text-align: center;
      .stat-label {
        display: block;
        color: #9CA3AF;
        font-size: 28rpx;
        margin-bottom: 12rpx;
      }
      .stat-value {
        display: block;
        font-size: 40rpx;
        font-weight: bold;
        &.income {
          color: #00BB88;
        }
        &.expense {
          color: #EF4444;
        }
      }
    }
    .stat-divider {
      width: 2rpx;
      height: 80rpx;
      background: rgba(255,255,255,0.1);
    }
  }
}

/* 时间分组列表 */
.record-group-list {
  padding: 0 30rpx;
  .record-group {
    margin-bottom: 30rpx;
    .group-date {
      color: #9CA3AF;
      font-size: 26rpx;
      margin-bottom: 16rpx;
      padding-left: 8rpx;
    }
    .group-card {
      background: #1E252B;
      border-radius: 24rpx;
      padding: 0 30rpx;
      .record-item {
        display: flex;
        align-items: center;
        gap: 20rpx;
        padding: 30rpx 0;
        border-bottom: 1rpx solid rgba(255,255,255,0.05);
        &:last-child {
          border-bottom: none;
        }
        .record-icon {
          width: 80rpx;
          height: 80rpx;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .record-info {
          flex: 1;
          .record-title {
            display: block;
            color: #fff;
            font-size: 30rpx;
            font-weight: 500;
            margin-bottom: 8rpx;
          }
          .record-subtitle {
            display: block;
            color: #9CA3AF;
            font-size: 26rpx;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
        .record-amount {
          font-size: 36rpx;
          font-weight: bold;
          flex-shrink: 0;
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

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>