
# 初球 App Bug 修复实施计划

&gt; **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复代码审阅发现的全部30个问题，恢复App正常用户流程。

**Architecture:** 按页面分三个阶段修复，每个页面内的问题一起处理，确保上下文一致和测试方便。

**Tech Stack:** UniApp + Vue 3 + Pinia + uni-ui

---

## 文件修改映射

| 文件 | 问题ID | 修改说明 |
|------|--------|----------|
| pages/login/index.vue | Hx? No, M1, L1, L2 | 3个问题 |
| pages/home/index.vue | M2, M3, L3 | 3个问题 |
| pages/coach/list.vue | H1, H2, H10? No, H1, H2 | 2个高优 |
| pages/booking/index.vue | H3, H10, M4, L4 | 4个问题 |
| pages/order/list.vue | H4, M5, L5, L6 | 4个问题 |
| pages/mine/index.vue | H5, M6, L7 | 3个问题 |
| subpkg/coach/detail.vue | M7, M8, M9 | 3个问题 |
| subpkg/booking/confirm.vue | H6, M10, M11 | 3个问题 |
| subpkg/order/detail.vue | H7, H8 | 2个高优 |
| subpkg/mine/wallet.vue | H9, M12, L8 | 3个问题 |

---

## 阶段1：核心阻塞修复（高优先级，10个问题）

### 任务1.1：修复裁教列表 - 定位权限拒绝状态混乱（H1）

**Files:**
- Modify: `pages/coach/list.vue:359-382`

- [ ] **Step 1: 读取当前代码**

Read the file to understand current implementation.

- [ ] **Step 2: 修改 sortBy 函数**

找到 `sortBy` 函数中处理定位的部分，修改如下：

```javascript
// 在 catch 中添加
catch (err) {
  uni.showToast({
    title: '获取定位失败，已恢复默认排序',
    icon: 'none'
  })
  // 恢复原排序
  sortType.value = prevSortType
  // 重新加载列表
  loadCoaches(true)
}
```

- [ ] **Step 3: 测试**

1. 进入裁教列表页
2. 选择"距离最近"
3. 拒绝定位权限
4. 验证：显示提示，列表恢复原排序

- [ ] **Step 4: Commit**

```bash
git add pages/coach/list.vue
git commit -m "fix: 修复距离排序拒绝定位权限后状态混乱"
```

---

### 任务1.2：修复裁教列表 - 上拉加载失败状态不重置（H2）

**Files:**
- Modify: `pages/coach/list.vue:398-403`

- [ ] **Step 1: 修改 loadMore 函数**

```javascript
catch (err) {
  console.error(err)
  loadMoreStatus.value = 'noMore' // 或 'error'，根据现有逻辑选择
  uni.showToast({
    title: '加载失败',
    icon: 'none'
  })
}
```

- [ ] **Step 2: 测试**

模拟网络失败，验证上拉加载失败后可以再次触发。

- [ ] **Step 3: Commit**

```bash
git add pages/coach/list.vue
git commit -m "fix: 修复上拉加载失败后状态不重置"
```

---

### 任务1.3：修复预约页 - 选择球厅功能未实现（H3）

**Files:**
- Modify: `pages/booking/index.vue:172-174`

- [ ] **Step 1: 修改 selectVenue 函数**

```javascript
const selectVenue = () => {
  uni.navigateTo({
    url: '/subpkg/booking/hall'
  })
}
```

- [ ] **Step 2: 验证 hall 页面存在**

Check that `subpkg/booking/hall.vue` exists (from earlier file list it does).

- [ ] **Step 3: 测试**

点击"选择球厅"，验证能正常跳转到球厅选择页。

- [ ] **Step 4: Commit**

```bash
git add pages/booking/index.vue
git commit -m "fix: 实现选择球厅功能跳转"
```

---

### 任务1.4：修复预约页 - 入口混乱状态不统一（H10）

**Files:**
- Modify: `pages/booking/index.vue` (整个文件)

- [ ] **Step 1: 分析 onLoad 参数处理**

Read the `onLoad` function to understand how parameters are handled from different entry points.

- [ ] **Step 2: 统一数据初始化逻辑**

```javascript
// 在 onLoad 中
onLoad((options) => {
  // 统一处理两种入口：
  // 1. 从首页进入：可能只有 venueId
  // 2. 从裁教列表进入：有 coachId
  
  // 重置所有选择状态
  selectedCoach.value = null
  selectedService.value = null
  selectedVenue.value = null
  selectedDate.value = null
  selectedTime.value = null
  
  // 根据参数加载对应数据
  if (options.coachId) {
    loadCoachDetail(options.coachId)
  }
  if (options.venueId) {
    loadVenueDetail(options.venueId)
  }
})
```

- [ ] **Step 3: 测试两种入口**

1. 从首页进入预约页
2. 从裁教列表进入预约页
3. 验证两种方式都能正常工作

- [ ] **Step 4: Commit**

```bash
git add pages/booking/index.vue
git commit -m "fix: 统一预约页从不同入口进入的数据处理逻辑"
```

---

### 任务1.5：修复订单列表 - 切换Tab失败一直loading（H4）

**Files:**
- Modify: `pages/order/list.vue:372-407`

- [ ] **Step 1: 修改 tabChange 函数**

```javascript
const tabChange = async (index) => {
  currentTab.value = index
  loading.value = true
  try {
    await loadOrders(true)
  } catch (err) {
    console.error(err)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false // 确保无论成功失败都重置
  }
}
```

- [ ] **Step 2: 测试**

模拟网络失败，验证切换Tab后loading状态会消失。

- [ ] **Step 3: Commit**

```bash
git add pages/order/list.vue
git commit -m "fix: 修复切换订单Tab失败后loading状态不重置"
```

---

### 任务1.6：修复我的页面 - 编辑资料跳转不存在（H5）

**Files:**
- Modify: `pages/mine/index.vue:491-494`
- Create: `subpkg/mine/info.vue` (或检查是否存在)

- [ ] **Step 1: 检查 info 页面是否存在**

检查 `subpkg/mine/info.vue` 是否存在。

- [ ] **Step 2: 方案A - 如果页面不存在，创建简单版本**

```vue
&lt;template&gt;
  &lt;view class="container"&gt;
    &lt;uni-nav-bar title="个人资料" left-icon="back" /&gt;
    &lt;view class="content"&gt;
      &lt;uni-list&gt;
        &lt;uni-list-item title="头像" thumb="{{ avatar }}" /&gt;
        &lt;uni-list-item title="昵称" note="{{ nickname }}" /&gt;
        &lt;uni-list-item title="手机号" note="{{ mobile }}" /&gt;
      &lt;/uni-list&gt;
    &lt;/view&gt;
  &lt;/view&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const avatar = ref(userStore.avatar || '')
const nickname = ref(userStore.nickname || '')
const mobile = ref(userStore.mobile || '')

onMounted(() => {
  // 加载用户详情
})
&lt;/script&gt;
```

- [ ] **Step 3: 方案B - 如果页面已存在，验证跳转**

确认页面存在，跳转逻辑正确。

- [ ] **Step 4: Commit**

```bash
git add pages/mine/index.vue
# 如果创建了新页面
git add subpkg/mine/info.vue
git commit -m "fix: 修复编辑资料页面跳转"
```

---

### 任务1.7：修复确认订单页 - 刷新后数据丢失（H6）

**Files:**
- Modify: `subpkg/booking/confirm.vue:621-683`

- [ ] **Step 1: 修改数据保存策略**

```javascript
// 在保存数据到 storage 时，同时保存到 Pinia store
// 或使用 encodeURIComponent 将关键数据放到 URL 参数中

// 在 onLoad 中：
onLoad((options) => {
  let orderData = null
  
  // 优先从 options 解析
  if (options.data) {
    try {
      orderData = JSON.parse(decodeURIComponent(options.data))
    } catch (e) {}
  }
  
  // 其次从 storage
  if (!orderData) {
    const stored = uni.getStorageSync('bookingConfirmData')
    if (stored) {
      orderData = stored
    }
  }
  
  // 都没有则跳转
  if (!orderData) {
    uni.showToast({ title: '数据已过期', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 1500)
    return
  }
  
  // 使用 orderData 初始化
})
```

- [ ] **Step 2: 修改跳转逻辑，传递URL参数**

```javascript
// 跳转到确认订单页时：
const dataStr = encodeURIComponent(JSON.stringify(confirmData))
uni.navigateTo({
  url: `/subpkg/booking/confirm?data=${dataStr}`
})
```

- [ ] **Step 3: 测试**

1. 进入确认订单页
2. 刷新页面（H5）或杀掉进程重进（App）
3. 验证数据不丢失

- [ ] **Step 4: Commit**

```bash
git add subpkg/booking/confirm.vue
git commit -m "fix: 修复确认订单页刷新后数据丢失"
```

---

### 任务1.8：修复订单详情 - 轮询函数定义位置问题（H7）

**Files:**
- Modify: `subpkg/order/detail.vue:1119-1128,1152-1168`

- [ ] **Step 1: 修复函数提升问题**

将 `startPolling` 函数定义移到使用之前，或改为函数声明：

```javascript
// 方式1：移到前面
const startPolling = () => { ... }

// 在 onMounted 中调用
onMounted(() => {
  startPolling()
})

// 方式2：使用函数声明（注意Vue3 SFC中慎用）
function startPolling() { ... }
```

- [ ] **Step 2: 清理定时器**

```javascript
let pollingTimer = null
let countdownTimer = null

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})
```

- [ ] **Step 3: 测试**

验证进入订单详情页后，轮询正常工作。

- [ ] **Step 4: Commit**

```bash
git add subpkg/order/detail.vue
git commit -m "fix: 修复订单详情轮询函数定义位置问题"
```

---

### 任务1.9：修复订单详情 - 联系教练硬编码手机号（H8）

**Files:**
- Modify: `subpkg/order/detail.vue:665-669`

- [ ] **Step 1: 修改联系教练函数**

```javascript
const contactCoach = () => {
  // 从订单数据中获取手机号
  const phone = orderDetail.value?.coachMobile || orderDetail.value?.coach?.mobile
  if (phone) {
    uni.makePhoneCall({ phoneNumber: phone })
  } else {
    uni.showToast({ title: '暂无教练联系方式', icon: 'none' })
  }
}
```

- [ ] **Step 2: 检查订单数据结构**

确认订单数据中教练手机号字段名。

- [ ] **Step 3: 测试**

验证点击联系教练使用订单数据中的手机号。

- [ ] **Step 4: Commit**

```bash
git add subpkg/order/detail.vue
git commit -m "fix: 修复联系教练使用硬编码手机号"
```

---

### 任务1.10：修复钱包 - 选择月份功能未实现（H9）

**Files:**
- Modify: `subpkg/mine/wallet.vue:227-229`

- [ ] **Step 1: 实现月份选择**

```javascript
const selectMonth = () => {
  // 使用 uni-date-picker 或弹层选择月份
  uni.showActionSheet({
    itemList: ['最近6个月', '2026-04', '2026-03', '2026-02'],
    success: (res) => {
      if (res.tapIndex === 0) {
        currentMonth.value = '' // 最近6个月
      } else {
        currentMonth.value = ['2026-04', '2026-03', '2026-02'][res.tapIndex - 1]
      }
      loadStatData()
      loadTransactions()
    }
  })
}
```

或者使用 `uni-datetime-picker` 组件。

- [ ] **Step 2: 对接API参数**

```javascript
const loadStatData = () => {
  request({
    url: '/api/billiard/wallet/stat',
    method: 'get',
    params: { month: currentMonth.value }
  })
}
```

- [ ] **Step 3: 测试**

验证可以选择不同月份查看数据。

- [ ] **Step 4: Commit**

```bash
git add subpkg/mine/wallet.vue
git commit -m "fix: 实现钱包选择月份功能"
```

---

## 阶段2：用户体验修复（中优先级，12个问题）

### 任务2.1：首页 - 定位权限拒绝后提示（M2）

**Files:**
- Modify: `pages/home/index.vue:291-320`

```javascript
catch (err) {
  uni.showToast({
    title: '定位权限被拒绝，将显示默认数据',
    icon: 'none',
    duration: 2000
  })
  // 继续加载默认数据
  loadVenues()
}
```

Commit: `fix: 首页定位拒绝后提示用户`

---

### 任务2.2：首页 - API失败提示用户（M3）

**Files:**
- Modify: `pages/home/index.vue:243-246,255-258`

```javascript
catch (err) {
  uni.showToast({
    title: '加载失败',
    icon: 'none'
  })
}
```

Commit: `fix: 首页API失败显示用户提示`

---

### 任务2.3：预约页 - 球厅选择验证（M4）

**Files:**
- Modify: `pages/booking/index.vue:177-193`

```javascript
const goConfirm = () => {
  // 根据服务类型判断是否需要球厅
  const needVenue = selectedService.value?.type !== 2 // 假设type=2不需要球厅
  
  if (!selectedCoach.value) {
    uni.showToast({ title: '请选择裁教', icon: 'none' })
    return
  }
  if (!selectedService.value) {
    uni.showToast({ title: '请选择服务', icon: 'none' })
    return
  }
  if (needVenue &amp;&amp; !selectedVenue.value) {
    uni.showToast({ title: '请选择球厅', icon: 'none' })
    return
  }
  // ...
}
```

Commit: `fix: 预约页根据服务类型验证球厅选择`

---

### 任务2.4：订单列表 - 只对已取消显示滑动删除（M5）

**Files:**
- Modify: `pages/order/list.vue:83-91,306-315`

```vue
&lt;!-- 使用 v-if 条件渲染 --&gt;
&lt;uni-swipe-action v-if="item.status === 5"&gt;
  &lt;uni-swipe-action-item :right-options="rightOptions"&gt;
    &lt;order-item :item="item" /&gt;
  &lt;/uni-swipe-action-item&gt;
&lt;/uni-swipe-action&gt;
&lt;order-item v-else :item="item" /&gt;
```

Commit: `fix: 订单列表只对已取消订单显示滑动删除`

---

### 任务2.5：我的页面 - 多个请求独立错误处理（M6）

**Files:**
- Modify: `pages/mine/index.vue:433-489`

```javascript
// 每个请求独立 try-catch
const loadUserData = async () => {
  try {
    await userStore.getUserInfo()
  } catch (e) {
    uni.showToast({ title: '用户信息加载失败', icon: 'none' })
  }
}

const loadWallet = async () => {
  try {
    // ...
  } catch (e) {
    uni.showToast({ title: '钱包信息加载失败', icon: 'none' })
  }
}
```

Commit: `fix: 我的页面每个请求独立错误处理`

---

### 任务2.6：裁教详情 - 收藏乐观更新（M7）

**Files:**
- Modify: `subpkg/coach/detail.vue:409-431`

```javascript
const toggleFavorite = async () => {
  // 乐观更新
  const wasFav = isFavorite.value
  isFavorite.value = !wasFav
  
  try {
    await request({
      url: wasFav ? '/api/billiard/coach/unfavorite' : '/api/billiard/coach/favorite',
      method: 'post',
      data: { coachId }
    })
  } catch (err) {
    // 回滚
    isFavorite.value = wasFav
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}
```

Commit: `fix: 裁教详情收藏使用乐观更新`

---

### 任务2.7：裁教详情 - 服务类型判断优化（M8）

**Files:**
- Modify: `subpkg/coach/detail.vue:492-494`

```javascript
// 使用 serviceType 字段判断，不使用名称
const isOnsiteService = (service) => {
  return service.serviceType === 1 // 1=上门，2=球厅，根据实际定义
}
```

Commit: `fix: 裁教详情使用serviceType字段判断服务类型`

---

### 任务2.8：裁教详情 - 加载失败显示重试（M9）

**Files:**
- Modify: `subpkg/coach/detail.vue:344-349`

```vue
&lt;view v-if="loadError" class="error-wrap"&gt;
  &lt;text class="error-text"&gt;加载失败&lt;/text&gt;
  &lt;button class="retry-btn" @click="retryLoad"&gt;重试&lt;/button&gt;
&lt;/view&gt;
```

```javascript
const retryLoad = () => {
  loadError.value = false
  loadCoachDetail()
}
```

Commit: `fix: 裁教详情加载失败显示重试按钮`

---

### 任务2.9：确认订单 - 重新选择球厅保存数据（M10）

**Files:**
- Modify: `subpkg/booking/confirm.vue:435-447`

```javascript
const reselectVenue = () => {
  // 保存当前数据
  uni.setStorageSync('bookingConfirmTemp', {
    coach: selectedCoach.value,
    service: selectedService.value,
    date: selectedDate.value,
    time: selectedTime.value,
    // ... 其他字段
  })
  
  uni.navigateTo({ url: '/subpkg/booking/hall?reselect=1' })
}

// 在 onLoad 中检查是否有临时数据需要恢复
```

Commit: `fix: 确认订单重新选择球厅时保存当前数据`

---

### 任务2.10：确认订单 - 无支付超时时间时提示（M11）

**Files:**
- Modify: `subpkg/booking/confirm.vue:586-613`

```javascript
if (orderDetail.value?.expireTime) {
  // 正常倒计时
} else {
  // 显示默认提示
  expireText.value = '请尽快完成支付'
}
```

Commit: `fix: 确认订单无超时时显示默认提示`

---

### 任务2.11：钱包 - 完善bizType映射（M12）

**Files:**
- Modify: `subpkg/mine/wallet.vue:180-191`

```javascript
const getBizTypeText = (type) => {
  const map = {
    1: '充值',
    2: '消费',
    3: '提现',
    4: '退款',
    5: '佣金收入',
    // ... 补充完整
  }
  return map[type] || '其他'
}
```

Commit: `fix: 完善钱包交易记录bizType映射`

---

### 任务2.12：登录 - 手机号验证说明（M1）

**Files:**
- Modify: `pages/login/index.vue:175`

```javascript
// 保留现有正则 /^1[3-9]\d{9}$/
// 添加注释说明：此正则匹配中国大陆主流手机号段
const mobileReg = /^1[3-9]\d{9}$/
```

Commit: `docs: 添加手机号验证正则注释`

---

## 阶段3：细节优化（低优先级，8个问题）

### 任务3.1：登录 - 获取验证码成功提示（L1）

**Files:**
- Modify: `pages/login/index.vue`

```javascript
uni.showToast({
  title: '验证码已发送',
  icon: 'success'
})
```

Commit: `fix: 登录获取验证码成功提示`

---

### 任务3.2：登录 - 切换Tab清空所有字段（L2）

**Files:**
- Modify: `pages/login/index.vue`

```javascript
const tabChange = (index) => {
  currentTab.value = index
  // 清空所有字段
  mobile.value = ''
  code.value = ''
  password.value = ''
}
```

Commit: `fix: 登录切换Tab清空所有字段`

---

### 任务3.3：首页 - 教练列表添加loading（L3）

**Files:**
- Modify: `pages/home/index.vue`

```vue
&lt;ds-skeleton v-if="loading" /&gt;
&lt;view v-else&gt;...&lt;/view&gt;
```

Commit: `fix: 首页教练列表添加loading状态`

---

### 任务3.4：预约页 - 增强选中服务反馈（L4）

**Files:**
- Modify: `pages/booking/index.vue`

```css
.service-item.selected {
  border-color: #00BB88;
  background-color: rgba(0, 187, 136, 0.1);
  /* 添加缩放动画 */
  transform: scale(1.02);
  transition: all 0.2s;
}
```

Commit: `fix: 增强预约页选中服务视觉反馈`

---

### 任务3.5：订单列表 - 再约一次添加确认（L5）

**Files:**
- Modify: `pages/order/list.vue`

```javascript
const reorder = () => {
  uni.showModal({
    title: '提示',
    content: '确定要再次预约吗？',
    success: (res) => {
      if (res.confirm) {
        uni.switchTab({ url: '/pages/coach/list' })
      }
    }
  })
}
```

Commit: `fix: 订单列表再约一次添加确认弹窗`

---

### 任务3.6：订单列表 - 取消后更新统计（L6）

**Files:**
- Modify: `pages/order/list.vue`

```javascript
const cancelOrderSuccess = () => {
  loadOrders(true)
  loadOrderStats() // 重新加载统计
}
```

Commit: `fix: 订单列表取消订单后更新统计数据`

---

### 任务3.7：我的页面 - 下拉刷新添加反馈（L7）

**Files:**
- Modify: `pages/mine/index.vue`

```javascript
const onRefresh = async () => {
  // 显示下拉刷新中提示（如果组件支持）
  await Promise.all([
    loadUserData(),
    loadWallet(),
    loadOrderStats()
  ])
  uni.stopPullDownRefresh()
  uni.showToast({ title: '刷新成功', icon: 'success' })
}
```

Commit: `fix: 我的页面下拉刷新添加成功提示`

---

### 任务3.8：钱包 - 余额切换保持现状（L8）

**Files:** None - 保持现状即可。

Commit: 无代码变更。

---

## 总结

- **Total Tasks:** 29个（L8无代码）
- **Phase 1:** 10 tasks (High)
- **Phase 2:** 12 tasks (Medium)
- **Phase 3:** 7 tasks (Low)

---

## 执行选项

Plan complete and saved to `docs/superpowers/plans/2026-05-18-bug-fix-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
