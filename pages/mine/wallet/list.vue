<template>
  <view class="record-all-wrapper">
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
          <picker
              mode="date"
              :value="pickerDate"
              :start="pickerStart"
              :end="pickerEnd"
              fields="month"
              @change="onMonthChange"
          >
            <view class="tab-item month-picker-btn" :class="{active: currentTab === 'selectMonth'}">
              <text>{{ selectMonthLabel }}</text>
              <uni-icons type="bottom" size="12" color="#9CA3AF" />
            </view>
          </picker>
        </view>
      </scroll-view>

      <!-- 统计概览 -->
      <view class="stat-card" v-if="currentTab !== 'income' && currentTab !== 'expense'">
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
import { onShow } from "@dcloudio/uni-app"
import { getWalletTransactions, getWalletTransactionSummary } from '@/api/billiard/wallet'

onMounted(() => {
  initMonthPicker()
})

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
// 当前统计月份
const currentStatMonth = ref('')
// 选择的月份
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)

// picker 相关状态
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1
const pickerDate = ref(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)
const pickerStart = ref(`${currentYear - 2}-${String(currentMonth).padStart(2, '0')}`)
const pickerEnd = ref(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)

// 统计数据
const statData = ref({
  income: '0.00',
  expense: '0.00'
})

// 交易记录列表（原始数据）
const transactionList = ref([])

// bizType 对应的图标和颜色
const bizTypeMap = {
  1: { title: '充值', icon: 'plus-filled', iconBg: 'rgba(59, 130, 246, 0.2)', iconColor: '#3B82F6' },
  2: { title: '充值退款', icon: 'refresh', iconBg: 'rgba(236, 72, 153, 0.2)', iconColor: '#EC4899' },
  3: { title: '支付', icon: 'wallet', iconBg: 'rgba(0, 187, 136, 0.2)', iconColor: '#00BB88' },
  4: { title: '支付退款', icon: 'refresh', iconBg: 'rgba(236, 72, 153, 0.2)', iconColor: '#EC4899' },
  5: { title: '更新余额', icon: 'plus', iconBg: 'rgba(59, 130, 246, 0.2)', iconColor: '#3B82F6' },
  6: { title: '转账', icon: 'transfer', iconBg: 'rgba(251, 191, 36, 0.2)', iconColor: '#FBBF24' }
}

// 收入类型的 bizType
const incomeBizTypes = [1, 2, 4, 5]

// ---------------------- 计算属性 ----------------------
// 分类标签列表
const tabList = ref([
  { value: 'all', label: '全部' },
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' }
])

// 选择月份的标签
const selectMonthLabel = computed(() => {
  if (currentTab.value === 'selectMonth') {
    return `${selectedYear.value}年${selectedMonth.value}月`
  }
  return '选择月份'
})

// 当前展示的分组列表
const showGroupList = computed(() => {
  // 按日期分组
  const groupMap = {}
  transactionList.value.forEach(item => {
    const dateStr = item.createTime ? item.createTime.split(' ')[0] : ''
    if (!dateStr) return
    // 格式化为中文日期
    const parts = dateStr.split('-')
    const formattedDate = `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`
    if (!groupMap[formattedDate]) {
      groupMap[formattedDate] = []
    }
    groupMap[formattedDate].push(item)
  })
  // 转换为数组并排序
  return Object.keys(groupMap)
    .sort((a, b) => new Date(b) - new Date(a))
    .map(date => ({
      date,
      list: groupMap[date]
    }))
})

// ---------------------- 数据加载 ----------------------
// 获取本月时间范围
const getCurrentMonthRange = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 23:59:59`
  return [startDate, endDate]
}

// 加载统计数据
const loadStatData = async () => {
  try {
    const timeRange = getCurrentMonthRange()
    const res = await getWalletTransactionSummary({
      createTime: timeRange
    })
    if (res.data) {
      statData.value = {
        income: ((res.data.totalIncome || 0) / 100).toFixed(2),
        expense: ((res.data.totalExpense || 0) / 100).toFixed(2)
      }
      // 设置当前月份
      const now = new Date()
      currentStatMonth.value = `${now.getFullYear()}年${now.getMonth() + 1}月`
    }
  } catch (error) {
    console.error('加载收支统计失败:', error)
  }
}

// 加载交易记录
const loadTransactions = async (isRefresh = false) => {
  if (loading.value) return

  loading.value = true
  if (isRefresh) {
    hasMore.value = true
    page.value = 1
  }

  try {
    const params = {
      pageNo: page.value,
      pageSize: pageSize.value
    }

    // 根据 tab 类型添加筛选参数
    if (currentTab.value === 'income') {
      params.type = 1
    } else if (currentTab.value === 'expense') {
      params.type = 2
    } else if (currentTab.value === 'selectMonth') {
      // 按选择月份筛选
      const startDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-01 00:00:00`
      const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
      const endDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`
      params.createTime = [startDate, endDate]
    }

    const res = await getWalletTransactions(params)
    const list = res.data?.list || []

    // 转换数据格式
    const formattedList = list.map(item => {
      const bizInfo = bizTypeMap[item.bizType] || bizTypeMap[3]
      const isIncome = incomeBizTypes.includes(item.bizType)
      return {
        id: item.id || Date.now(),
        title: item.title || bizInfo.title,
        subtitle: item.createTime || '',
        icon: bizInfo.icon,
        iconBg: bizInfo.iconBg,
        iconColor: bizInfo.iconColor,
        amount: (isIncome ? '+' : '-') + '¥' + ((item.price || 0) / 100).toFixed(2),
        amountColor: isIncome ? '#00BB88' : '#EF4444',
        createTime: item.createTime
      }
    })

    if (isRefresh) {
      transactionList.value = formattedList
    } else {
      transactionList.value = [...transactionList.value, ...formattedList]
    }

    // 判断是否还有更多
    hasMore.value = list.length >= pageSize.value
  } catch (error) {
    console.error('加载交易记录失败:', error)
    hasMore.value = false
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载所有数据
const loadAllData = async () => {
  await Promise.all([
    loadStatData(),
    loadTransactions(true)
  ])
}

// ---------------------- 交互方法 ----------------------
// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadTransactions(true).then(() => {
    loadStatData()
    refreshing.value = false
    uni.showToast({ title: '刷新成功', icon: 'success' })
  })
}

// 上拉加载更多
const onLoadMore = () => {
  if (!hasMore.value || loading.value) return
  page.value++
  loadTransactions(false)
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
  // 重新加载数据
  loadTransactions(true)
}

// 初始化月份选择器
const initMonthPicker = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  pickerDate.value = `${year}-${String(month).padStart(2, '0')}`
  pickerStart.value = `${year - 2}-01`
  pickerEnd.value = `${year}-${String(month).padStart(2, '0')}`
}

// 月份选择变化
const onMonthChange = (e) => {
  const value = e.detail.value // 格式: "2024-01"
  const [year, month] = value.split('-')
  selectedYear.value = parseInt(year)
  selectedMonth.value = parseInt(month)
  currentTab.value = 'selectMonth'
  page.value = 1
  hasMore.value = true
  emptyTip.value = '暂无交易记录'
  loadTransactions(true)
  loadStatDataByMonth()
}

// 根据选择的月份加载统计数据
const loadStatDataByMonth = async () => {
  try {
    const startDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-01 00:00:00`
    const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
    const endDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`
    const res = await getWalletTransactionSummary({
      createTime: [startDate, endDate]
    })
    if (res.data) {
      statData.value = {
        income: ((res.data.totalIncome || 0) / 100).toFixed(2),
        expense: ((res.data.totalExpense || 0) / 100).toFixed(2)
      }
      currentStatMonth.value = `${selectedYear.value}年${selectedMonth.value}月`
    }
  } catch (error) {
    console.error('加载收支统计失败:', error)
  }
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
  uni.showToast({ title: '详情功能开发中', icon: 'none' })
}

// ---------------------- 生命周期 ----------------------
onShow(() => {
  initMonthPicker()
  loadAllData()
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