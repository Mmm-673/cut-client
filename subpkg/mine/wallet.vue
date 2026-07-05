<template>
  <view class="wallet-page-wrapper">
    <!-- 余额卡片 -->
    <view class="balance-card">
      <view class="balance-header">
        <text class="balance-label">账户余额 (元)</text>
        <view class="eye-btn" @click="toggleBalance">
          <uni-icons :type="showBalance ? 'eye' : 'eye-slash'" size="20" color="#fff" />
        </view>
      </view>

      <text class="balance-num">{{ showBalance ? formatBalance(wallet.balance) : '****' }}</text>
    </view>

    <!-- 收支统计 -->
    <view class="stat-card">
      <view class="stat-header">
        <text class="stat-title">收支统计</text>
        <view class="month-select" @click="selectMonth">
          <text class="month-text">{{ currentMonth }}</text>
          <uni-icons type="down" size="16" color="#9CA3AF" />
        </view>
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

    <!-- 交易记录 -->
    <view class="record-card">
      <view class="record-header">
        <text class="record-title">交易记录</text>
        <text class="view-more" @click="toAllRecord">查看全部 <uni-icons type="right" size="16" color="#9CA3AF" /></text>
      </view>

      <scroll-view
          scroll-y
          class="record-scroll"
          refresher-enabled
          :refresher-triggered="refreshing"
          @refresherrefresh="onRefresh"
      >
        <view class="record-list">
          <view class="record-item" v-for="record in recordList" :key="record.id" @click="toRecordDetail(record.id)">
            <view class="record-icon" :style="{background: record.iconBg}">
              <uni-icons :type="record.icon" size="24" :color="record.iconColor" />
            </view>
            <view class="record-info">
              <text class="record-title">{{ record.title }}</text>
              <text class="record-time">{{ record.time }}</text>
            </view>
            <text class="record-amount" :style="{color: record.amountColor}">{{ record.amount }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

<!--    &lt;!&ndash; 底部安全区域 &ndash;&gt;-->
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from  "@dcloudio/uni-app"
import { getWallet, getWalletTransactions, getWalletTransactionSummary } from '@/api/billiard/wallet'

// 刷新状态
const refreshing = ref(false)
// 是否显示余额
const showBalance = ref(true)
// 当前月份
const currentMonth = ref('本月')

// 当前选中的月份数据
const selectedMonthData = ref({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })

// 钱包数据
const wallet = ref({
  balance: 0,
  totalExpense: 0,
  totalRecharge: 0
})

// 收支统计数据
const statData = ref({
  income: '0.00',
  expense: '0.00'
})

// 交易记录列表
const recordList = ref([])

// bizType 对应的图标和颜色
const bizTypeMap = {
  1: { title: '充值', icon: 'wallet', iconBg: 'rgba(0, 187, 136, 0.2)', iconColor: '#00BB88' },
  2: { title: '充值退款', icon: 'refresh', iconBg: 'rgba(236, 72, 153, 0.2)', iconColor: '#EC4899' },
  3: { title: '支付', icon: 'wallet', iconBg: 'rgba(0, 187, 136, 0.2)', iconColor: '#00BB88' },
  4: { title: '支付退款', icon: 'refresh', iconBg: 'rgba(236, 72, 153, 0.2)', iconColor: '#EC4899' },
  5: { title: '更新余额', icon: 'plus', iconBg: 'rgba(59, 130, 246, 0.2)', iconColor: '#3B82F6' },
  6: { title: '转账', icon: 'transfer', iconBg: 'rgba(251, 191, 36, 0.2)', iconColor: '#FBBF24' }
}

// 获取本月时间范围
const getCurrentMonthRange = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 23:59:59`
  return [startDate, endDate]
}

// 加载钱包余额
const loadWallet = async () => {
  try {
    const res = await getWallet()
    if (res.data) {
      wallet.value = {
        balance: (res.data.balance || 0) / 100,
        totalExpense: (res.data.totalExpense || 0) / 100,
        totalRecharge: (res.data.totalRecharge || 0) / 100
      }
    }
  } catch (error) {
    console.error('加载钱包失败:', error)
  }
}


// 加载交易记录
const loadTransactions = async () => {
  try {
    const res = await getWalletTransactions({
      pageNo: 1,
      pageSize: 10
    })
    const list = res.data?.list || []
    // 时间格式化为 MM-dd HH:mm:ss (24小时制)
    const formatTime = (ts) => {
      if (!ts) return ''
      const d = new Date(Number(ts))

      const month = String(d.getMonth() + 1).padStart(2, '0') // 月份从0开始，必须加1
      const date = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const seconds = String(d.getSeconds()).padStart(2, '0')

      return `${month}-${date} ${hours}:${minutes}:${seconds}`
    }
    recordList.value = list.map(item => {
      const bizInfo = bizTypeMap[item.bizType] || bizTypeMap[3]
      const isIncome = item.bizType === 1 || item.bizType === 2 || item.bizType === 4 || item.bizType === 5
      return {
        id: item.id || Date.now(),
        title: item.title || bizInfo.title,
        time: formatTime(item.createTime) || '',
        icon: bizInfo.icon,
        iconBg: bizInfo.iconBg,
        iconColor: bizInfo.iconColor,
        amount: (isIncome ? '+' : '-') + '¥' + (Math.abs(item.price || 0) / 100).toFixed(2),
        amountColor: isIncome ? '#00BB88' : '#EF4444'
      }
    })
  } catch (error) {
    console.error('加载交易记录失败:', error)
  }
}

// 加载所有数据
const loadAllData = async () => {
  await Promise.all([
    loadWallet(),
    loadStatData(),
    loadTransactions()
  ])
}

// 格式化余额
const formatBalance = (num) => {
  return num.toFixed(2)
}

// 切换余额显示
const toggleBalance = () => {
  showBalance.value = !showBalance.value
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadAllData().then(() => {
    refreshing.value = false
    uni.showToast({ title: '刷新成功', icon: 'success' })
  })
}

// 获取指定月份的时间范围
const getMonthRange = (year, month) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`
  // 获取该月最后一天
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`
  return [startDate, endDate]
}

// 生成最近几个月的选项
const getMonthOptions = () => {
  const now = new Date()
  const options = []
  // 本月
  options.push({ label: '本月', year: now.getFullYear(), month: now.getMonth() + 1 })
  // 近5个月
  for (let i = 1; i <= 5; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      year: date.getFullYear(),
      month: date.getMonth() + 1
    })
  }
  return options
}

// 选择月份
const selectMonth = () => {
  const options = getMonthOptions()
  uni.showActionSheet({
    itemList: options.map(o => o.label),
    success: (res) => {
      const selected = options[res.tapIndex]
      selectedMonthData.value = { year: selected.year, month: selected.month }
      currentMonth.value = selected.label
      // 重新加载该月的数据
      loadStatDataByMonth(selected.year, selected.month)
    }
  })
}

// 加载指定月份的收支统计
const loadStatDataByMonth = async (year, month) => {
  try {
    const timeRange = getMonthRange(year, month)
    const res = await getWalletTransactionSummary({
      createTime: timeRange
    })
    if (res.data) {
      statData.value = {
        income: ((res.data.totalIncome || 0) / 100).toFixed(2),
        expense: ((res.data.totalExpense || 0) / 100).toFixed(2)
      }
    }
  } catch (error) {
    console.error('加载收支统计失败:', error)
  }
}

// 修改原有的loadStatData，使其调用带月份的版本
const loadStatData = async () => {
  await loadStatDataByMonth(selectedMonthData.value.year, selectedMonthData.value.month)
}

// 路由跳转方法
const goBack = () => {
  uni.navigateBack()
}

const toAllRecord = () => {
  uni.navigateTo({ url: '/subpkg/mine/wallet-list' })
}

const toRecordDetail = (recordId) => {
  // uni.showToast({ title: '详情功能开发中', icon: 'none' })
}

// 页面显示刷新数据
onShow(() => {
  loadAllData()
})
</script>

<style lang="scss" scoped>
.wallet-page-wrapper {
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
  .nav-back, .nav-placeholder {
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

.record-scroll {
  height: 630rpx; /* 调整高度以填充更多空间 */
  width: 100%;
}

/* 余额卡片 */
.balance-card {
  margin: 30rpx;
  background: linear-gradient(135deg, #00BB88 0%, #008866 100%);
  border-radius: 32rpx;
  padding: 40rpx 30rpx;
  .balance-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    .balance-label {
      color: rgba(255,255,255,0.9);
      font-size: 28rpx;
    }
    .eye-btn {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  .balance-num {
    color: #fff;
    font-size: 80rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 40rpx;
  }
  .action-btns {
    display: flex;
    gap: 20rpx;
    .action-btn {
      flex: 1;
      height: 80rpx;
      line-height: 80rpx;
      background: rgba(255,255,255,0.2);
      color: #fff;
      border-radius: 40rpx;
      font-size: 30rpx;
      font-weight: 600;
      border: none;
      &::after {
        border: none;
      }
    }
  }

  .record-entries {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 30rpx;
    padding-top: 30rpx;
    border-top: 1rpx solid rgba(255,255,255,0.15);
  }

  .record-entry {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
  }

  .entry-text {
    color: #fff;
    font-size: 26rpx;
  }

  .entry-divider {
    width: 2rpx;
    height: 40rpx;
    background: rgba(255,255,255,0.15);
  }
}

/* 通用卡片 */
.stat-card, .record-card {
  margin: 0 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
}

/* 收支统计 */
.stat-card {
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
    .month-select {
      display: flex;
      align-items: center;
      gap: 8rpx;
      .month-text {
        color: #9CA3AF;
        font-size: 28rpx;
      }
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

/* 交易记录 */
.record-card {
  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    .record-title {
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
  .record-list {
    .record-item {
      display: flex;
      align-items: center;
      gap: 20rpx;
      padding: 20rpx 0;
      border-bottom: 1rpx solid rgba(255,255,255,0.05);
      &:last-child {
        border-bottom: none;
      }
      .record-icon {
        width: 70rpx;
        height: 70rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
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
        .record-time {
          display: block;
          color: #9CA3AF;
          font-size: 26rpx;
        }
      }
      .record-amount {
        font-size: 32rpx;
        font-weight: 600;
      }
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