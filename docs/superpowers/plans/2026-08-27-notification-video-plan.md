# 用户 App 通知中心 + 视频播放器 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为用户 App 新增通知中心（列表/详情/角标/启动弹窗）、助教详情视频播放器，并确认开票入口无需改动。

**Architecture:** 通知中心作为独立子系统放在 `subpkg/mine` 分包下，通过新增 `api/billiard/notification.js` 对接后端接口；视频播放器在现有助教详情页内增量插入；开票入口确认无现存代码、本期不新增。

**Tech Stack:** UniApp + Vue 3 Composition API + Pinia + SCSS + uni-ui

**Spec:** `docs/superpowers/specs/2026-08-27-notification-video-invoice-design.md`

## Global Constraints

- 金额字段单位为「分」，展示时除以 100 保留两位小数
- 日期时间使用 `yyyy-MM-dd HH:mm:ss` 或 ISO `yyyy-MM-ddTHH:mm:ss` 格式
- API 路径前缀统一 `/app-api/billiard/`，使用 `@/utils/request` 封装
- 遵循深色主题规范：主背景 `#121619`，卡片背景 `#1E252B`，主色 `#00BB88`
- 支持多端：微信小程序、App (iOS/Android)、H5
- 请求头自动携带 `tenant-id: 122` 和 `Authorization: Bearer <token>`

---

## 任务总览

| 任务 | 模块 | 说明 |
|---|---|---|
| Task 1 | 通知中心 - API | 新增 notification.js 接口封装 |
| Task 2 | 通知中心 - 路由 | pages.json 新增列表页 + 详情页路由 |
| Task 3 | 通知中心 - 列表页 | 实现通知列表页（三 Tab、下拉刷新、上拉加载、置顶、全部已读） |
| Task 4 | 通知中心 - 详情页 | 实现通知详情页（展示 + 标记已读） |
| Task 5 | 通知中心 - 入口 | 「我的」页面加菜单项 + 未读数角标 |
| Task 6 | 通知中心 - 启动弹窗 | App.vue 启动时重大通知依次弹窗 |
| Task 7 | 视频播放器 | 助教详情页新增视频播放器 |
| Task 8 | 开票入口 | 确认无现存开票代码、本期不新增 |

---

### Task 1: 通知中心 API 封装

**Files:**
- Create: `api/billiard/notification.js`

**Interfaces:**
- Produces: `getNotificationPage(params)`, `getNotificationDetail(id)`, `getUnreadCount()`, `markAsRead(id)`, `markAllAsRead()`

**Steps:**

- [ ] **Step 1: 创建 API 文件**

在 `api/billiard/notification.js` 中写入：

```js
import request from '@/utils/request'

/**
 * 分页查询通知列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNo - 页码
 * @param {number} params.pageSize - 每页条数
 * @param {number} [params.readStatus] - 阅读状态：不传=全部、0=未读、1=已读
 * @returns {Promise<Object>} 分页结果
 * @returns {Array} returns.data.records - 通知列表
 * @returns {number} returns.data.total - 总条数
 */
export function getNotificationPage(params) {
  return request({
    url: '/app-api/billiard/notification-center/page',
    method: 'get',
    params
  })
}

/**
 * 获取通知详情
 * @param {number} id - 通知ID
 * @returns {Promise<Object>} 通知详情
 * @returns {number} returns.data.id - 通知ID
 * @returns {number} returns.data.type - 类型：1重大通知、2公告、3活动、4版本更新
 * @returns {string} returns.data.title - 标题
 * @returns {string} returns.data.summary - 摘要
 * @returns {string} returns.data.content - 内容
 * @returns {string} [returns.data.coverUrl] - 封面图
 * @returns {number} returns.data.actionType - 动作类型：0无、1通知详情、2App路由、3HTTPS页面、4应用更新
 * @returns {string} [returns.data.actionValue] - 动作值
 * @returns {boolean} returns.data.topFlag - 是否置顶
 * @returns {string} returns.data.publishTime - 发布时间
 * @returns {number} returns.data.readStatus - 阅读状态：0未读、1已读
 */
export function getNotificationDetail(id) {
  return request({
    url: '/app-api/billiard/notification-center/get',
    method: 'get',
    params: { id }
  })
}

/**
 * 获取未读通知数量
 * @returns {Promise<Object>}
 * @returns {number} returns.data - 未读数
 */
export function getUnreadCount() {
  return request({
    url: '/app-api/billiard/notification-center/unread-count',
    method: 'get'
  })
}

/**
 * 标记单条通知为已读
 * @param {number} id - 通知ID
 * @returns {Promise<Object>}
 */
export function markAsRead(id) {
  return request({
    url: '/app-api/billiard/notification-center/read',
    method: 'post',
    data: { id }
  })
}

/**
 * 标记全部通知为已读
 * @returns {Promise<Object>}
 */
export function markAllAsRead() {
  return request({
    url: '/app-api/billiard/notification-center/read-all',
    method: 'post'
  })
}
```

- [ ] **Step 2: 验证文件格式**

确认文件路径正确、无语法错误（与其他 API 文件对比风格一致）。

---

### Task 2: 通知中心路由配置

**Files:**
- Modify: `pages.json` (subPackages → subpkg/mine → pages 数组)

**Interfaces:**
- Consumes: 无
- Produces: 两个路由 `/subpkg/mine/notification/index` 和 `/subpkg/mine/notification/detail`

**Steps:**

- [ ] **Step 1: 在 pages.json 中新增通知页面路由**

找到 `subPackages` 中 `root: "subpkg/mine"` 的 pages 数组（约第 154-203 行），在数组末尾添加两个页面：

```json
{
  "path": "notification/index",
  "style": {
    "navigationBarTitleText": "消息通知",
    "navigationBarBackgroundColor": "#121619",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#121619"
  }
},
{
  "path": "notification/detail",
  "style": {
    "navigationBarTitleText": "通知详情",
    "navigationBarBackgroundColor": "#121619",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#121619"
  }
}
```

注意：保持与同分包其他页面一致的 style 配置。

- [ ] **Step 2: 验证 JSON 格式**

确认 `pages.json` 语法正确，逗号、括号无误。

---

### Task 3: 通知列表页

**Files:**
- Create: `subpkg/mine/notification/index.vue`

**Interfaces:**
- Consumes: `getNotificationPage(params)`, `getUnreadCount()`, `markAllAsRead()` from `api/billiard/notification.js`
- Produces: 通知列表页面，支持三 Tab 切换、下拉刷新、上拉加载、置顶样式、全部已读

**Steps:**

- [ ] **Step 1: 创建页面文件骨架**

创建 `subpkg/mine/notification/index.vue`，写入基本结构：

```vue
<template>
  <view class="notification-page">
    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view
        class="tab-item"
        v-for="(tab, index) in tabList"
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

    <!-- 通知列表 -->
    <scroll-view
      class="notification-list"
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
        :class="{ 'is-top': item.topFlag, 'is-read': item.readStatus === 1 }"
        @click="goDetail(item)"
      >
        <view class="item-header">
          <view class="item-tags" v-if="item.topFlag">
            <text class="tag tag-top">置顶</text>
          </view>
          <text class="item-title">{{ item.title }}</text>
          <view class="unread-dot" v-if="item.readStatus === 0"></view>
        </view>
        <text class="item-summary">{{ item.summary }}</text>
        <text class="item-time">{{ formatTime(item.publishTime) }}</text>
      </view>

      <view class="load-more" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="load-more" v-if="noMore && list.length > 0">
        <text>没有更多了</text>
      </view>
    </scroll-view>

    <!-- 底部全部已读按钮 -->
    <view class="bottom-bar" v-if="currentTab !== 'read' && list.length > 0">
      <button class="read-all-btn" @click="markAllRead">全部已读</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onShow } from '@dcloudio/uni-app'
import { getNotificationPage, getUnreadCount, markAllAsRead } from '@/api/billiard/notification'

const tabList = [
  { key: '', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'read', label: '已读' }
]

const currentTab = ref('')
const list = ref([])
const pageNo = ref(1)
const pageSize = 20
const total = ref(0)
const loading = ref(false)
const refreshing = ref(false)
const unreadCount = ref(0)

const noMore = computed(() => list.value.length >= total.value && total.value > 0)

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize
    }
    if (currentTab.value === 'unread') params.readStatus = 0
    if (currentTab.value === 'read') params.readStatus = 1

    const res = await getNotificationPage(params)
    const records = res.data?.records || []
    const totalCount = res.data?.total || 0
    total.value = totalCount

    if (pageNo.value === 1) {
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
  list.value = []
  fetchList()
}

const onRefresh = () => {
  pageNo.value = 1
  refreshing.value = true
  fetchList()
  fetchUnreadCount()
}

const loadMore = () => {
  if (loading.value || noMore.value) return
  pageNo.value++
  fetchList()
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
    fetchList()
    fetchUnreadCount()
  } catch (e) {
    console.error('全部已读失败', e)
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  // 截取到分钟级 yyyy-MM-dd HH:mm
  return timeStr.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  fetchList()
  fetchUnreadCount()
})

onShow(() => {
  // 从详情页返回时刷新
  if (list.value.length > 0) {
    pageNo.value = 1
    fetchList()
    fetchUnreadCount()
  }
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
  background-color: #1e252b;
  padding: 0 20rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);

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

.notification-list {
  flex: 1;
  padding: 0 24rpx;
  padding-bottom: 120rpx;
}

.notification-item {
  background-color: #1e252b;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-top: 20rpx;
  position: relative;

  &.is-top {
    background-color: rgba(0, 187, 136, 0.08);
    border: 1rpx solid rgba(0, 187, 136, 0.2);
  }

  &.is-read {
    opacity: 0.7;
  }

  .item-header {
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;

    .item-tags {
      margin-right: 12rpx;

      .tag {
        font-size: 20rpx;
        padding: 4rpx 12rpx;
        border-radius: 6rpx;

        &.tag-top {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #fff;
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

  .read-all-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #fff;
    font-size: 30rpx;
    border-radius: 44rpx;
    border: none;
  }
}
</style>
```

- [ ] **Step 2: 检查页面结构完整性**

确认 template / script / style 三部分完整，import 路径正确，`onShow` 生命周期可用。

---

### Task 4: 通知详情页

**Files:**
- Create: `subpkg/mine/notification/detail.vue`

**Interfaces:**
- Consumes: `getNotificationDetail(id)`, `markAsRead(id)` from `api/billiard/notification.js`
- Produces: 通知详情页面，进入时自动标记已读

**Steps:**

- [ ] **Step 1: 创建详情页**

创建 `subpkg/mine/notification/detail.vue`：

```vue
<template>
  <view class="detail-page">
    <view class="detail-content" v-if="detail">
      <text class="detail-title">{{ detail.title }}</text>
      <text class="detail-time">{{ formatTime(detail.publishTime) }}</text>
      <view class="detail-body">
        <rich-text :nodes="detail.content" v-if="isRichText"></rich-text>
        <text class="detail-text" v-else>{{ detail.content }}</text>
      </view>
    </view>

    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from '@dcloudio/uni-app'
import { getNotificationDetail, markAsRead } from '@/api/billiard/notification'

const detail = ref(null)
const loading = ref(true)
const notificationId = ref(null)

// 简单判断内容是否含 HTML 标签
const isRichText = ref(false)
const checkRichText = (content) => {
  return /<[^>]+>/.test(content || '')
}

const fetchDetail = async () => {
  if (!notificationId.value) return
  loading.value = true
  try {
    const res = await getNotificationDetail(notificationId.value)
    detail.value = res.data
    isRichText.value = checkRichText(res.data?.content)
    // 标记已读
    if (res.data?.readStatus === 0) {
      await markAsRead(notificationId.value)
    }
  } catch (e) {
    console.error('获取通知详情失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ').substring(0, 19)
}

onMounted((options) => {
  notificationId.value = options?.id
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background-color: #121619;
  padding: 30rpx;
}

.detail-content {
  .detail-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #fff;
    line-height: 1.4;
    display: block;
    margin-bottom: 16rpx;
  }

  .detail-time {
    font-size: 24rpx;
    color: #666;
    display: block;
    margin-bottom: 30rpx;
  }

  .detail-body {
    :deep(img) {
      max-width: 100%;
      height: auto;
    }

    :deep(p) {
      margin: 20rpx 0;
    }

    .detail-text {
      font-size: 28rpx;
      color: #ccc;
      line-height: 1.8;
      white-space: pre-wrap;
    }
  }
}

.loading {
  text-align: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: #666;
}
</style>
```

- [ ] **Step 2: 验证 onLoad 参数**

UniApp 中 `onMounted` 的参数在 Vue 3 setup 中需用 `onLoad` 获取。如果 `onMounted` 拿不到 `options`，改用 `onLoad`：

```js
import { ref, onLoad, onMounted } from '@dcloudio/uni-app'

onLoad((options) => {
  notificationId.value = options?.id
})

onMounted(() => {
  fetchDetail()
})
```

按项目实际情况调整（参考项目其他页面的写法）。

---

### Task 5: 「我的」页面通知入口 + 角标

**Files:**
- Modify: `pages/mine/index.vue`

**Interfaces:**
- Consumes: `getUnreadCount()` from `api/billiard/notification.js`
- Produces: 功能菜单新增「消息通知」项，右侧显示未读数角标；点击跳转通知列表

**Steps:**

- [ ] **Step 1: 在 menuList 中新增消息通知项**

找到 `menuList` 数组（约第 396-406 行），在第一项前面插入：

```js
{ key: 'notification', title: '消息通知', icon: 'chatbubble', bgColor: 'rgba(0, 187, 136, 0.2)', color: '#00BB88', path: '/subpkg/mine/notification/index' },
```

完整数组变为：
```js
const menuList = ref([
  { key: 'notification', title: '消息通知', icon: 'chatbubble', bgColor: 'rgba(0, 187, 136, 0.2)', color: '#00BB88', path: '/subpkg/mine/notification/index' },
  { key: 'wallet', title: '收支统计', icon: 'wallet-filled', bgColor: 'rgba(0, 187, 136, 0.2)', color: '#00BB88', path: '/subpkg/mine/wallet' },
  { key: 'collection', title: '我的收藏', icon: 'heart', bgColor: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f', path: '/subpkg/mine/favorites' },
  { key: 'help', title: '客服中心', icon: 'headphones', bgColor: 'rgba(107, 114, 128, 0.2)', color: '#6B7280', path: '/subpkg/mine/help' }
])
```

- [ ] **Step 2: 新增未读数状态和获取方法**

在 script setup 中添加：

```js
import { getUnreadCount } from '@/api/billiard/notification'

const notificationUnreadCount = ref(0)

const fetchNotificationUnread = async () => {
  try {
    const res = await getUnreadCount()
    notificationUnreadCount.value = res.data || 0
  } catch (e) {
    console.error('获取通知未读数失败', e)
  }
}
```

- [ ] **Step 3: 在 onShow 中调用刷新未读数**

找到现有 `onShow` 钩子（或新建），添加调用：

```js
onShow(() => {
  // ... 原有逻辑 ...
  if (isLoggedIn.value) {
    fetchNotificationUnread()
  }
})
```

注意：需要判断登录状态，未登录不调用。参考页面现有 `isLoggedIn` 或 user store 的判断方式。

- [ ] **Step 4: 在菜单项 template 中添加角标**

修改 menu-item 的 template（约第 117-130 行），在右侧箭头前加角标：

```vue
<view class="menu-item" v-for="item in visibleMenuList" :key="item.key" @click="toMenuPage(item)">
  <view class="menu-icon" :style="{background: item.bgColor}">
    <uni-icons :type="item.icon" size="22" :color="item.color" />
  </view>
  <text class="menu-title">{{ item.title }}</text>
  <!-- 新增：消息通知未读数角标 -->
  <view v-if="item.key === 'notification' && notificationUnreadCount > 0" class="menu-badge">
    {{ notificationUnreadCount > 99 ? '99+' : notificationUnreadCount }}
  </view>
  <uni-icons type="right" size="18" color="#9CA3AF" />
</view>
```

- [ ] **Step 5: 添加角标样式**

在 style 中 `.menu-item` 相关样式后添加：

```scss
.menu-badge {
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 10rpx;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 22rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  margin-left: auto;
  margin-right: 8rpx;
}
```

---

### Task 6: App 启动重大通知弹窗

**Files:**
- Modify: `App.vue`

**Interfaces:**
- Consumes: `getNotificationPage(params)`, `markAsRead(id)` from `api/billiard/notification.js`
- Produces: App 启动且已登录时，拉取未读的重大通知（type=1），依次弹出模态框

**Steps:**

- [ ] **Step 1: 在 App.vue 中新增弹窗方法**

在 script 中导入 API 并添加弹窗逻辑：

```js
import { getNotificationPage, markAsRead } from '@/api/billiard/notification'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

// 重大通知弹窗队列
let notificationQueue = []
let isShowingNotification = false

const showNotificationModal = (item) => {
  isShowingNotification = true
  uni.showModal({
    title: item.title,
    content: item.content || item.summary || '',
    showCancel: false,
    confirmText: '我知道了',
    confirmColor: '#00BB88',
    success: async () => {
      // 标记已读
      try {
        await markAsRead(item.id)
      } catch (e) {
        console.error('标记通知已读失败', e)
      }
      isShowingNotification = false
      // 弹下一条
      showNextNotification()
    }
  })
}

const showNextNotification = () => {
  if (notificationQueue.length === 0) return
  const next = notificationQueue.shift()
  showNotificationModal(next)
}

const checkImportantNotifications = async () => {
  if (!userStore.accessToken) return
  try {
    const res = await getNotificationPage({
      pageNo: 1,
      pageSize: 20,
      readStatus: 0
    })
    const records = res.data?.records || []
    // 筛选 type=1 重大通知
    const importantList = records.filter(item => item.type === 1)
    if (importantList.length > 0) {
      notificationQueue = importantList
      showNextNotification()
    }
  } catch (e) {
    console.error('获取重大通知失败', e)
  }
}
```

- [ ] **Step 2: 在登录成功后触发检查**

找到 `continueAppInit` 或 `restoreUserState` 之后（登录状态已恢复），调用 `checkImportantNotifications()`。

建议在 `restoreUserState` 成功后调用，或在 `initApp` 流程登录检查完成且已登录时调用。参考 App.vue 现有结构，找到合适的时机点插入。

如果 `checkLogin` 返回 true 后有回调，放在那里最稳妥。

- [ ] **Step 3: 确认不会重复触发**

确保 `onLaunch` 中只触发一次（不是 `onShow`，否则每次从后台切回来都弹）。

---

### Task 7: 助教详情视频播放器

**Files:**
- Modify: `subpkg/coach/detail.vue`

**Interfaces:**
- Consumes: `coachInfo.videoUrl` (from existing `getCoachDetail` response)
- Produces: 在个人介绍与个人相册之间插入视频播放器，支持播放/暂停/全屏/错误降级

**Steps:**

- [ ] **Step 1: 在 template 中插入视频区块**

找到个人介绍区块（约 94-103 行）和个人相册区块（约 105-123 行）之间，插入：

```vue
<!-- 教学视频 -->
<view class="section" v-if="coachInfo.videoUrl">
  <view class="section-title">
    <uni-icons type="videocam" size="18" color="#00c896"></uni-icons>
    <text>教学视频</text>
  </view>
  <view class="video-wrap">
    <video
      id="coachVideo"
      :src="coachInfo.videoUrl"
      :autoplay="false"
      :controls="true"
      object-fit="contain"
      :enable-progress-gesture="true"
      class="coach-video"
      @error="onVideoError"
    ></video>
  </view>
</view>
```

- [ ] **Step 2: 添加视频相关方法和变量**

在 script setup 中添加：

```js
import { onUnload, onHide } from '@dcloudio/uni-app'

const videoVisible = ref(true)

const onVideoError = (e) => {
  console.error('视频播放失败', e)
  uni.showToast({ title: '视频加载失败', icon: 'none' })
  videoVisible.value = false
}

// 暂停视频（页面隐藏/卸载时调用）
const pauseVideo = () => {
  const videoContext = uni.createVideoContext('coachVideo')
  if (videoContext) {
    videoContext.pause()
  }
}

onHide(() => {
  pauseVideo()
})

onUnload(() => {
  pauseVideo()
})
```

- [ ] **Step 3: v-if 条件改为双重判断**

将 template 中的 `v-if="coachInfo.videoUrl"` 改为：

```vue
<view class="section" v-if="coachInfo.videoUrl && videoVisible">
```

- [ ] **Step 4: 添加视频样式**

在 style 中添加：

```scss
.video-wrap {
  width: 100%;
  margin-top: 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background-color: #000;

  .coach-video {
    width: 100%;
    height: 420rpx; // 16:9 比例（约 750rpx 宽 → 422rpx 高，取整）
    display: block;
  }
}
```

注意：高度根据实际内容区宽度调整，保持 16:9 比例。

---

### Task 8: 开票入口确认

**Files:**
- 无新增/修改文件

**Interfaces:**
- 无

**Steps:**

- [ ] **Step 1: 确认当前代码无开票相关代码**

全局搜索关键词：`发票`、`开票`、`invoice`、`receipt`
- 源码目录（排除 `node_modules`、`unpackage`、`uni_modules`）
- 确认结果：0 条匹配

- [ ] **Step 2: 确认本期不新增任何开票入口**

在本次迭代中不添加任何发票/开票相关的页面、组件、API 调用。
如有产品要求加占位入口，仅展示静态文案「功能建设中，敬请期待」，不发起 HTTP 请求。

---

## 验收清单

### 通知中心
- [ ] 「我的」页面有「消息通知」入口，未读数 > 0 显示红色角标
- [ ] 点击入口进入通知列表页，三个 Tab 可切换
- [ ] 列表支持下拉刷新、上拉加载更多
- [ ] 置顶通知排在前面，有「置顶」标签和特殊背景
- [ ] 未读通知有红点标识
- [ ] 点击列表项进入详情页
- [ ] 进入详情页后通知变为已读，返回列表后状态同步更新
- [ ] 「全部已读」按钮可一键清空未读
- [ ] App 启动（已登录状态）时，重大通知依次弹窗，用户确认后标记已读
- [ ] 未登录状态下不触发任何通知相关接口调用

### 视频播放器
- [ ] 助教有视频时，个人介绍下方显示「教学视频」区块
- [ ] 助教无视频时，视频区块完全隐藏（不占位）
- [ ] 视频不自动播放，需用户手动点击
- [ ] 支持播放/暂停、进度条拖动、全屏播放
- [ ] 页面隐藏或卸载时视频暂停
- [ ] 视频播放失败时 toast 提示并隐藏视频区块，不影响其他内容

### 开票入口
- [ ] 全 App 无任何真实开票入口和接口调用