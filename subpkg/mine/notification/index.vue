<template>
  <view :class="themeClass" class="notification-page">
    <!-- Tab 切换 + 管理按钮 -->
    <view class="tab-bar">
      <view class="tab-items">
        <view
          class="tab-item"
          v-for="tab in tabList"
          :key="tab.key"
          :class="{ active: currentTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          <text>{{ tab.label }}</text>
          <view class="tab-badge" v-if="tab.key === 'unread' && unreadCount > 0">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </view>
        </view>
      </view>
      <view class="tab-manage" @click="toggleManageMode">
        <text>{{ isManageMode ? '完成' : '管理' }}</text>
      </view>
    </view>

    <!-- 通知列表 -->
    <scroll-view
      class="notification-scroll"
      scroll-y="true"
      refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <view v-if="list.length === 0 && !loading" class="empty">
        <text class="empty-text">暂无通知</text>
      </view>

      <view
        class="notification-item"
        v-for="item in list"
        :key="item.id"
        :class="{ 'is-top': item.topFlag, 'is-read': item.readStatus === 1, 'is-manage': isManageMode }"
        @click="handleItemClick(item)"
      >
        <!-- 管理模式下的复选框 -->
        <view class="item-checkbox" v-if="isManageMode" @click.stop="toggleSelect(item)">
          <view class="checkbox" :class="{ checked: selectedIds.includes(item.id) }">
            <uni-icons v-if="selectedIds.includes(item.id)" type="checkmarkempty" size="16" color="#fff" />
          </view>
        </view>

        <view class="item-content">
          <view class="item-header">
            <view class="item-tags">
              <text class="tag tag-top" v-if="item.topFlag">置顶</text>
              <text class="tag" :class="'tag-type-' + item.type">{{ getTypeLabel(item.type) }}</text>
            </view>
            <text class="item-title">{{ item.title }}</text>
            <view class="unread-dot" v-if="item.readStatus === 0"></view>
          </view>
          <text class="item-summary">{{ item.summary }}</text>
          <text class="item-time">发布时间:{{ formatTime(item.publishTime) }}</text>
        </view>
      </view>

      <view class="load-more" v-if="loading && list.length > 0">
        <text>加载中...</text>
      </view>
      <view class="load-more" v-if="noMore && list.length > 0">
        <text>没有更多了</text>
      </view>

      <!-- 底部安全区域占位 -->
      <view class="bottom-placeholder" v-if="showBottomBar"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="showBottomBar">
      <!-- 管理模式：全选 + 标记已读 -->
      <template v-if="isManageMode">
        <view class="bottom-left" @click="toggleSelectAll">
          <view class="checkbox" :class="{ checked: isAllSelected }">
            <uni-icons v-if="isAllSelected" type="checkmarkempty" size="16" color="#fff" />
          </view>
          <text class="select-all-text">{{ isAllSelected ? '取消全选' : '全选' }}</text>
        </view>
        <button class="mark-read-btn" :disabled="selectedIds.length === 0" @click="markSelectedRead">
          标记已读({{ selectedIds.length }})
        </button>
      </template>

      <!-- 普通模式：全部已读 -->
      <template v-else>
        <button class="read-all-btn" @click="markAllRead">全部已读</button>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { useThemeStore } from '@/store'
import { getNotificationPage, getUnreadCount, markAllAsRead, markAsRead } from '@/api/billiard/notification'

const themeStore = useThemeStore()
const themeClass = computed(() => `theme-${themeStore.theme}`)

const tabList = [
  { key: '', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'read', label: '已读' }
]

// 通知类型映射
const TYPE_MAP = {
  1: { label: '重大通知', color: '#ff4d4f' },
  2: { label: '公告', color: '#00BB88' },
  3: { label: '活动', color: '#f59e0b' },
  4: { label: '版本更新', color: '#3b82f6' }
}

const getTypeLabel = (type) => {
  return TYPE_MAP[type]?.label || '通知'
}

const currentTab = ref('')
const list = ref([])
const pageNo = ref(1)
const pageSize = 20
const total = ref(0)
const loading = ref(false)
const refreshing = ref(false)
const unreadCount = ref(0)
const hasMore = ref(true)

const noMore = computed(() => !hasMore.value && list.value.length > 0)

// 管理模式
const isManageMode = ref(false)
const selectedIds = ref([])

const isAllSelected = computed(() => {
  if (list.value.length === 0) return false
  // 只统计未读的可选项（已读的不能再标记已读）
  const selectable = list.value.filter(item => item.readStatus === 0)
  if (selectable.length === 0) return false
  return selectable.every(item => selectedIds.value.includes(item.id))
})

const showBottomBar = computed(() => {
  // 管理模式下始终显示底部栏
  if (isManageMode.value) return true
  // 普通模式：未读 tab 或全部 tab 且有未读数时显示全部已读
  return currentTab.value !== 'read' && unreadCount.value > 0
})

const toggleManageMode = () => {
  isManageMode.value = !isManageMode.value
  // 退出管理模式时清空选择
  if (!isManageMode.value) {
    selectedIds.value = []
  }
}

const handleItemClick = (item) => {
  if (isManageMode.value) {
    // 管理模式下点击 = 切换选择
    if (item.readStatus === 1) return // 已读的不能选
    toggleSelect(item)
  } else {
    goDetail(item)
  }
}

const toggleSelect = (item) => {
  if (item.readStatus === 1) return // 已读的不可选
  const idx = selectedIds.value.indexOf(item.id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(item.id)
  }
}

const toggleSelectAll = () => {
  const selectableIds = list.value
    .filter(item => item.readStatus === 0)
    .map(item => item.id)

  if (isAllSelected.value) {
    // 取消全选
    selectedIds.value = []
  } else {
    // 全选
    selectedIds.value = [...new Set([...selectedIds.value, ...selectableIds])]
  }
}

const markSelectedRead = async () => {
  if (selectedIds.value.length === 0) return
  let successCount = 0
  try {
    // 逐条标记已读（串行，避免并发问题）
    for (const id of selectedIds.value) {
      try {
        await markAsRead(id)
        successCount++
      } catch (err) {
        console.warn(`标记通知 ${id} 已读失败:`, err)
      }
    }
    uni.showToast({ title: `已标记 ${successCount} 条为已读`, icon: 'success' })
    selectedIds.value = []
    // 刷新列表和未读数
    pageNo.value = 1
    hasMore.value = true
    fetchList(true)
    fetchUnreadCount()
  } catch (e) {
    console.error('批量标记已读失败', e)
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const fetchList = async (isRefresh = false) => {
  if (loading.value) return
  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize
    }
    if (currentTab.value === 'unread') params.readStatus = 0
    if (currentTab.value === 'read') params.readStatus = 1

    const res = await getNotificationPage(params)
    console.log('====getNotificationPage',res)
    const records = res.data?.list || []
    const totalCount = res.data?.total || 0
    total.value = totalCount
    hasMore.value = records.length >= pageSize && list.value.length + records.length < totalCount

    if (isRefresh || pageNo.value === 1) {
      list.value = records
    } else {
      list.value = [...list.value, ...records]
    }
  } catch (e) {
    console.error('获取通知列表失败', e)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data || 0
  } catch (e) {
    console.error('获取未读数失败', e)
  }
}

const switchTab = (key) => {
  if (currentTab.value === key) return
  currentTab.value = key
  pageNo.value = 1
  hasMore.value = true
  list.value = []
  // 切换 tab 时退出管理模式
  isManageMode.value = false
  selectedIds.value = []
  fetchList(true)
}

const onRefresh = () => {
  pageNo.value = 1
  hasMore.value = true
  refreshing.value = true
  fetchList(true)
  fetchUnreadCount()
}

const loadMore = () => {
  if (loading.value || !hasMore.value) return
  pageNo.value++
  fetchList(false)
}

const goDetail = (item) => {
  uni.navigateTo({
    url: `/subpkg/mine/notification/detail?id=${item.id}`
  })
}

const markAllRead = async () => {
  try {
    await markAllAsRead()
    uni.showToast({ title: '已全部标记为已读', icon: 'success' })
    pageNo.value = 1
    hasMore.value = true
    fetchList(true)
    fetchUnreadCount()
  } catch (e) {
    console.error('全部已读失败', e)
  }
}

const formatTime = (timeVal) => {
  if (!timeVal && timeVal !== 0) return ''

  let date
  // 数字：时间戳（兼容秒和毫秒）
  if (typeof timeVal === 'number') {
    const ts = timeVal > 1e12 ? timeVal : timeVal * 1000
    date = new Date(ts)
  }
  // 字符串
  else if (typeof timeVal === 'string') {
    // 纯数字字符串也按时间戳处理
    if (/^\d+$/.test(timeVal)) {
      const ts = Number(timeVal)
      date = new Date(ts > 1e12 ? ts : ts * 1000)
    } else {
      date = new Date(timeVal.replace('T', ' '))
    }
  } else {
    return ''
  }

  if (isNaN(date.getTime())) return ''

  const pad = (n) => n < 10 ? '0' + n : '' + n
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

onMounted(() => {
  fetchList(true)
  fetchUnreadCount()
})

onShow(() => {
  // 从详情页返回时刷新
  if (list.value.length > 0) {
    pageNo.value = 1
    hasMore.value = true
    fetchList(true)
    fetchUnreadCount()
  }
})

// 监听 WebSocket 推送，实时刷新列表
const onMajorNotificationRefresh = () => {
  pageNo.value = 1
  hasMore.value = true
  fetchList(true)
  fetchUnreadCount()
}
uni.$on('major-notification', onMajorNotificationRefresh)

onUnload(() => {
  uni.$off('major-notification', onMajorNotificationRefresh)
})
</script>

<style lang="scss" scoped>
.notification-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #121619;
}

.tab-bar {
  display: flex;
  align-items: center;
  background-color: #1e252b;
  padding: 0 20rpx 0 20rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
  margin-top: 15rpx;
  .tab-items {
    flex: 1;
    display: flex;
  }

  .tab-manage {
    padding: 0 16rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    flex-shrink: 0;

    text {
      font-size: 26rpx;
      color: #00BB88;
    }
  }

  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx 0;
    font-size: 28rpx;
    color: #999;
    position: relative;

    &.active {
      color: #fff;
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 48rpx;
        height: 4rpx;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 2rpx;
      }
    }
  }

  .tab-badge {
    position: absolute;
    top: 16rpx;
    right: 20%;
    min-width: 32rpx;
    height: 32rpx;
    padding: 0 8rpx;
    background-color: #ff4d4f;
    color: #fff;
    font-size: 20rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
}

.notification-scroll {
  flex: 1;
  padding: 0 24rpx;
}

.notification-item {
  background-color: #1e252b;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-top: 20rpx;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 20rpx;

  &.is-top {
    background-color: rgba(0, 187, 136, 0.08);
    border: 1rpx solid rgba(0, 187, 136, 0.2);
  }

  &.is-read {
    opacity: 0.7;
  }

  .item-checkbox {
    flex-shrink: 0;
    padding-top: 6rpx;

    .checkbox {
      width: 40rpx;
      height: 40rpx;
      border: 2rpx solid #444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &.checked {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-color: transparent;
      }
    }
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-header {
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;

    .item-tags {
      margin-right: 12rpx;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 8rpx;

      .tag {
        font-size: 20rpx;
        padding: 4rpx 12rpx;
        border-radius: 6rpx;

        &.tag-top {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #fff;
        }

        &.tag-type-1 {
          background: rgba(255, 77, 79, 0.15);
          color: #ff4d4f;
        }

        &.tag-type-2 {
          background: rgba(0, 187, 136, 0.15);
          color: #00BB88;
        }

        &.tag-type-3 {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        &.tag-type-4 {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }
      }
    }

    .item-title {
      flex: 1;
      font-size: 30rpx;
      font-weight: 500;
      color: #fff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .unread-dot {
      width: 16rpx;
      height: 16rpx;
      border-radius: 50%;
      background-color: #ff4d4f;
      margin-left: 12rpx;
      flex-shrink: 0;
    }
  }

  .item-summary {
    font-size: 26rpx;
    color: #999;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 12rpx;
  }

  .item-time {
    font-size: 24rpx;
    color: #666;
  }
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;

  .empty-text {
    font-size: 28rpx;
    color: #666;
  }
}

.load-more {
  text-align: center;
  padding: 30rpx 0;
  font-size: 24rpx;
  color: #666;
}

.bottom-placeholder {
  height: 120rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #121619;
  border-top: 1rpx solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  gap: 20rpx;

  .bottom-left {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .checkbox {
      width: 40rpx;
      height: 40rpx;
      border: 2rpx solid #444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      &.checked {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-color: transparent;
      }
    }

    .select-all-text {
      font-size: 28rpx;
      color: #ccc;
    }
  }

  .read-all-btn {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #fff;
    font-size: 30rpx;
    border-radius: 44rpx;
    border: none;
  }

  .mark-read-btn {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #fff;
    font-size: 28rpx;
    border-radius: 44rpx;
    border: none;

    &[disabled] {
      opacity: 0.5;
    }
  }
}
</style>
