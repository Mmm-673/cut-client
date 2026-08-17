# 订单融合与现场订单助教信息 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 融合普通订单与现场订单列表，统一入口；现场订单详情页新增助教信息卡片和计费规则提示。

**Architecture:** 在现有订单列表页基础上适配 `type` 字段实现订单融合，卡片条件渲染不同类型订单的字段；点击按 type 分流到对应详情页；我的页面删除现场订单入口并适配融合列表；现场订单详情页新增助教信息卡片（接口新增 `coach` 字段）和计费规则提示卡片；删除独立的现场订单列表页。

**Tech Stack:** UniApp + Vue 3 Composition API + Pinia + SCSS + uni-ui

## Global Constraints

- 不进行 git 操作，用户检查后自行提交
- 深色/浅色主题适配，使用 CSS 变量（`--brand-primary`、`--bg-secondary`、`--text-primary` 等）
- 服务类型映射：1=台球指导🎱、2=潮玩领航🌆、3=酒艺品鉴🍷、4=影视赏析🎬
- 订单类型：type=1 普通订单，type=2 现场订单
- 平台：微信小程序、App(iOS/Android)、H5、鸿蒙

---

## Task 1: 订单列表页 - 新增类型标签与跳转分流

**Files:**
- Modify: `pages/order/list.vue`

**Interfaces:**
- Consumes: `getOrderList(params)` from `@/api/billiard/order` — 返回列表项新增 `type` 字段 (1=普通, 2=现场)
- Produces: 订单卡片展示类型标签，点击按 type 跳转到对应详情页

### 背景
当前 `pages/order/list.vue` 的订单卡片只展示普通预约订单，跳转固定到 `/subpkg/order/detail`。需要适配融合后的列表数据，新增类型标签，并根据 `type` 字段分流跳转。

### 步骤

- [ ] **Step 1: 新增订单类型常量和工具函数**

在 `<script setup>` 中新增：
```js
// 订单类型
const ORDER_TYPE_NORMAL = 1
const ORDER_TYPE_ONSITE = 2

const ORDER_TYPE_LABELS = {
  [ORDER_TYPE_NORMAL]: '普通订单',
  [ORDER_TYPE_ONSITE]: '现场订单'
}
```

- [ ] **Step 2: 修改 goToDetail 方法，按 type 分流跳转**

将原有的：
```js
const goToDetail = (order) => {
  uni.navigateTo({ url: `/subpkg/order/detail?id=${order.orderId}` })
}
```
替换为：
```js
const goToDetail = (order) => {
  if (order.type === ORDER_TYPE_ONSITE) {
    uni.navigateTo({ url: `/subpkg/onsite/detail?id=${order.id}` })
  } else {
    uni.navigateTo({ url: `/subpkg/order/detail?id=${order.orderId}` })
  }
}
```

注意：滑动删除逻辑中 `swipedOrderId` 使用的是 `order.orderId`，现场订单需要改用 `order.id`。将 `swipedOrderId` 的比较逻辑统一用一个 computed 或函数处理：
```js
const getOrderKey = (order) => {
  return order.type === ORDER_TYPE_ONSITE ? `onsite-${order.id}` : `normal-${order.orderId}`
}
```
所有用到 `swipedOrderId.value === order.orderId` 和 `swipedOrderId.value = order.orderId` 的地方都改为使用 `getOrderKey(order)`。

- [ ] **Step 3: 卡片模板新增类型标签**

在 `.order-header` 中的 `.order-type` 内，`.type-name` 后面新增类型标签：

找到模板中类似这样的位置（`.order-type` 内的 `.type-name` 后面）：
```html
<view class="type-name">{{ getServiceTypeName(order.serviceType) }}</view>
```
在其后添加：
```html
<view 
  class="order-type-tag" 
  :class="{ 'tag-onsite': order.type === ORDER_TYPE_ONSITE, 'tag-normal': order.type === ORDER_TYPE_NORMAL }"
>
  {{ ORDER_TYPE_LABELS[order.type] || '普通订单' }}
</view>
```

- [ ] **Step 4: 卡片字段条件渲染 - 裁教/助教信息行**

`.coach-section` 中展示的是"预约时间"。现场订单应展示"开始时间"。

将 `order-time` 标签部分从固定的"预约时间"改为：
```html
<view class="order-time">
  {{ order.type === ORDER_TYPE_ONSITE ? '开始时间' : '预约时间' }}：{{ formatTime(order.type === ORDER_TYPE_ONSITE ? order.startTime : order.bookingTime) }}
</view>
```

同时裁教名称的标签改为动态：
```html
<view class="coach-name">{{ order.type === ORDER_TYPE_ONSITE ? order.coachStageName : order.coachStageName }}</view>
```
（名称字段相同，但可以加一个前缀文字区别：如助教 vs 裁教）

- [ ] **Step 5: 卡片字段条件渲染 - 地点/时长行**

`.venue-section` 是普通订单的球厅地址，对现场订单改为展示服务时长。

将 `.venue-section` 的 `v-if="order.venueName"` 改为 `v-if="order.type !== ORDER_TYPE_ONSITE && order.venueName"`，并在其后新增现场订单的时长行：
```html
<view class="venue-section" v-if="order.type === ORDER_TYPE_ONSITE">
  <text class="venue-label">服务时长</text>
  <text class="venue-name">{{ formatDuration(order.billingMinutes) }}</text>
</view>
```

新增 `formatDuration` 方法：
```js
const formatDuration = (minutes) => {
  if (!minutes) return '0分钟'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours && mins) return `${hours}小时${mins}分钟`
  if (hours) return `${hours}小时`
  return `${mins}分钟`
}
```

- [ ] **Step 6: 操作按钮条件渲染**

操作按钮需要根据订单类型区分：
- 普通订单：取消订单（状态10/20/30）、去评价（50）、再约一次（60）、删除（70，左滑）
- 现场订单：去支付（45）、去评价（50）

在 `.order-actions` 中，现有的取消订单按钮加 `v-if="order.type === ORDER_TYPE_NORMAL && canCancelOrder(order.status)"`
现有的去评价按钮改为 `v-if="order.status === 50"`（两种类型都有）
现有的再约一次按钮加 `v-if="order.type === ORDER_TYPE_NORMAL && order.status === 60"`
新增现场订单的"去支付"按钮：
```html
<button 
  class="action-btn btn-primary" 
  v-if="order.type === ORDER_TYPE_ONSITE && order.status === 45"
  @click.stop="handleOnsitePay(order)"
>
  去支付
</button>
```

新增 `handleOnsitePay` 方法（暂跳转到详情页，实际支付在详情页处理）：
```js
const handleOnsitePay = (order) => {
  uni.navigateTo({ url: `/subpkg/onsite/detail?id=${order.id}` })
}
```

左滑删除保持只对普通订单已取消状态生效：`v-if="order.type === ORDER_TYPE_NORMAL && order.status === 70"`

- [ ] **Step 7: 新增类型标签的样式**

在 `<style lang="scss" scoped>` 中新增：
```scss
.order-type-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-left: 12rpx;
  
  &.tag-normal {
    background: rgba(0, 187, 136, 0.15);
    color: var(--brand-primary, #00BB88);
  }
  
  &.tag-onsite {
    background: rgba(245, 166, 35, 0.15);
    color: #f5a623;
  }
}
```

- [ ] **Step 8: 头像字段兼容**

普通订单头像是 `order.coachAvatar`，现场订单是 `order.coachMainPhoto`。统一处理：
```js
const getCoachAvatar = (order) => {
  return order.coachMainPhoto || order.coachAvatar || ''
}
```
模板中 `:src="order.coachAvatar"` 改为 `:src="getCoachAvatar(order)"`。

---

## Task 2: 我的页面 - 删除现场订单菜单与订单模块适配

**Files:**
- Modify: `pages/mine/index.vue`

**Interfaces:**
- Consumes: `getOrderList(params)` — 返回融合后的订单列表，含 `type` 字段
- Produces: 移除 onsite 菜单项，订单卡片支持两种类型跳转

### 步骤

- [ ] **Step 1: 删除 menuList 中的 onsite 项**

从 `menuList` 数组中删除第一项（`key: 'onsite'` 的现场订单菜单项）。

删除后 menuList 只剩 3 项：wallet（收支统计）、collection（我的收藏）、help（客服中心）。

- [ ] **Step 2: 更新 visibleMenuList 的过滤逻辑**

审核模式下的隐藏逻辑中，将 `'onsite'` 从过滤数组中移除：
```js
// 原：return menuList.value.filter(item => !['wallet', 'collection', 'onsite'].includes(item.key))
// 改为：
return menuList.value.filter(item => !['wallet', 'collection'].includes(item.key))
```

- [ ] **Step 3: 订单卡片点击跳转适配**

将 `toOrderDetail` 方法改为根据 type 分流：
```js
const toOrderDetail = (order) => {
  if (order.type === 2) {
    uni.navigateTo({ url: `/subpkg/onsite/detail?id=${order.id}` })
  } else {
    uni.navigateTo({ url: `/subpkg/order/detail?id=${order.orderId}` })
  }
}
```
同时模板中调用的地方从 `toOrderDetail(order.orderId)` 改为 `toOrderDetail(order)`。

- [ ] **Step 4: 订单卡片新增类型标签**

在我的页面订单卡片的标题区域（服务名旁边）新增类型标签，样式与列表页保持一致。

找到 `.order-card` 中显示服务名的位置，添加类型标签（参考 Task 1 Step 3 的样式类名）。

由于我的页面卡片空间较小，标签可以更小或只在有空间时显示。

- [ ] **Step 5: 头像字段兼容**

同 Task 1 Step 8，普通订单头像是 `coachAvatar`，现场订单是 `coachMainPhoto`，需要兼容。

---

## Task 3: 现场订单详情页 - 新增助教信息卡片

**Files:**
- Modify: `subpkg/onsite/detail.vue`

**Interfaces:**
- Consumes: `getOnsiteOrderDetail(params)` — 返回新增 `coach` 对象字段（id, stageName, avatar）
- Produces: 助教信息卡片展示头像+艺名，点击跳转到助教详情页

### 背景
现场订单详情页已有助教信息展示（头像+名称），但使用的是订单表的 `coachStageName` 和 `coachMainPhoto` 字段。现在接口返回了独立的 `coach` 对象，需要：
1. 改用 `coach` 对象的数据展示（实时读取助教资料）
2. 增加点击跳转到助教详情页的功能

### 步骤

- [ ] **Step 1: 助教信息卡片改为使用 coach 字段**

现有助教信息卡片使用 `orderDetail.coachMainPhoto` 和 `orderDetail.coachStageName`。改为优先使用 `orderDetail.coach` 对象的数据：

```js
// 新增 computed
const coachInfo = computed(() => orderDetail.value?.coach || null)
```

模板中助教头像改为：
```html
:image="coachInfo?.avatar || orderDetail.coachMainPhoto || '/static/images/default-avatar.png'"
```
助教名称改为：
```html
{{ coachInfo?.stageName || orderDetail.coachStageName || '未知助教' }}
```

- [ ] **Step 2: 助教信息卡片添加点击跳转**

给助教信息卡片的最外层容器添加点击事件：
```html
<view class="info-card coach-info-card" @click="goToCoachDetail" v-if="coachInfo || orderDetail.coachId">
```

新增跳转方法：
```js
const goToCoachDetail = () => {
  const coachId = coachInfo.value?.id || orderDetail.value.coachId
  if (!coachId) return
  uni.navigateTo({ url: `/subpkg/coach/detail?id=${coachId}` })
}
```

添加右箭头图标（参考普通订单详情页裁教卡片的样式），表明可点击。

- [ ] **Step 3: coach 为 null 时的降级处理**

如果 `coach` 为 null 但 `coachId` 存在，仍然展示旧字段（`coachStageName` / `coachMainPhoto`）的数据。
如果两者都没有，不展示助教信息卡片（`v-if` 判断）。

---

## Task 4: 现场订单详情页 - 新增计费规则提示卡片

**Files:**
- Modify: `subpkg/onsite/detail.vue`

**Interfaces:**
- Consumes: `orderDetail.serviceType` — 服务类型（1/2/3/4）
- Produces: 根据服务类型展示对应的计费规则提示文案

### 步骤

- [ ] **Step 1: 定义计费规则常量**

在 `<script setup>` 中新增：
```js
// 计费规则
const BILLING_RULES = {
  1: { startHours: 1, tip: '温馨提示：台球指导起步时长为1小时，不足1小时按1小时计费，超出部分按分钟计费。' },
  2: { startHours: 2, tip: '温馨提示：潮玩领航起步时长为2小时，不足2小时按2小时计费，超出部分按分钟计费。' },
  3: { startHours: 4, tip: '温馨提示：酒艺品鉴起步时长为4小时，不足4小时按4小时计费，超出部分按分钟计费。' },
  4: { startHours: 8, tip: '温馨提示：影视赏析起步时长为8小时，不足8小时按8小时计费，超出部分按分钟计费。' }
}

const billingTip = computed(() => {
  const rule = BILLING_RULES[orderDetail.value?.serviceType]
  return rule ? rule.tip : ''
})
```

- [ ] **Step 2: 模板中新增提示卡片**

在服务信息卡片（📋）之后、助教信息卡片（👤）之前插入：
```html
<view class="billing-tip-card" v-if="billingTip">
  <view class="tip-icon">💡</view>
  <view class="tip-text">{{ billingTip }}</view>
</view>
```

- [ ] **Step 3: 添加提示卡片样式**

在 `<style lang="scss" scoped>` 中新增：
```scss
.billing-tip-card {
  display: flex;
  align-items: flex-start;
  padding: 24rpx 28rpx;
  margin: 20rpx 24rpx;
  background: var(--bg-secondary, #2a3338);
  border-radius: 16rpx;
  
  .tip-icon {
    font-size: 28rpx;
    margin-right: 16rpx;
    flex-shrink: 0;
  }
  
  .tip-text {
    font-size: 24rpx;
    color: var(--text-secondary, #9CA3AF);
    line-height: 1.6;
    flex: 1;
  }
}
```

使用 CSS 变量 `--bg-secondary` 和 `--text-secondary` 自动适配深色/浅色主题。

---

## Task 5: 删除现场订单列表页与路由清理

**Files:**
- Delete: `pages/onsite/list.vue`
- Modify: `pages.json`

### 步骤

- [ ] **Step 1: 删除文件 pages/onsite/list.vue**

直接删除该文件。

- [ ] **Step 2: 从 pages.json 中移除现场订单列表页路由**

在 `pages` 数组中找到：
```json
{
  "path": "pages/onsite/list",
  "style": {
    "navigationBarTitleText": "现场订单",
    "navigationBarBackgroundColor": "#121619",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#121619"
  }
}
```
将其整个删除。

- [ ] **Step 3: 移除 pages.json 中的预加载规则**

找到预加载配置中 `pages/onsite/list` 相关的条目并删除：
```json
"pages/onsite/list": {
  "network": "all",
  "packages": ["subpkg/onsite"]
}
```

- [ ] **Step 4: 全局搜索引用并清理**

全局搜索以下内容，确认没有遗漏的引用：
- `/pages/onsite/list` — 所有跳转路径
- `getOnsiteOrderPage` — 所有 API 调用
- `pages/onsite/list` — pages.json 中是否还有其他引用

确认清理干净，没有残留引用。

---

## Task 6: 验证与自查

**Files:** 全部修改过的文件

### 步骤

- [ ] **Step 1: 检查 pages.json 语法**

确认 pages.json 修改后 JSON 语法正确，没有多余逗号或缺失括号。

- [ ] **Step 2: 检查所有跳转路径**

- 订单列表页：普通订单 → `/subpkg/order/detail`，现场订单 → `/subpkg/onsite/detail` ✓
- 我的页面：同上 ✓
- 现场订单详情页：点击助教 → `/subpkg/coach/detail` ✓

- [ ] **Step 3: 检查主题适配**

所有新增的颜色样式都使用了 CSS 变量（`--brand-primary`、`--bg-secondary`、`--text-secondary` 等），确保深色/浅色主题下都正常显示。

- [ ] **Step 4: 检查空值处理**

- `coach` 为 null → 降级用旧字段，最终为空则不展示卡片 ✓
- `serviceType` 不匹配 → 不展示计费提示卡片 ✓
- `type` 字段缺失 → 默认按普通订单处理 ✓

- [ ] **Step 5: 运行编译检查**

运行 `dev:mp-weixin` 或 `dev:h5` 检查是否有编译错误。