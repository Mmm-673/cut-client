# 测试Bug修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复测试报告中发现的23个Bug（H5定位问题暂不处理），包括表单验证、功能入口、UI展示等问题。

**Architecture:** 保持现有项目结构，针对具体问题文件进行最小改动修复。

**Tech Stack:** UniApp + Vue 3 + Pinia

---

## 文件变更清单

### 修改文件

| 文件路径 | 修改内容 | 优先级 |
|---------|---------|-------|
| `subpkg/mine/setting.vue` | 集成userStore退出登录功能 | P1 |
| `subpkg/mine/withdraw.vue` | 添加余额校验提示 | P1 |
| `pages/login/resetPassword.vue` | 添加完整表单验证 | P1 |
| `pages/login/index.vue` | 确认表单验证完整性 | P1 |
| `subpkg/mine/pwd.vue` | 确认密码验证完整性 | P1 |
| `pages/mine/index.vue` | 添加优惠券入口跳转 | P2 |
| `pages/home/index.vue` | 添加消息通知入口跳转 | P2 |
| `subpkg/mine/help.vue` | FAQ展开收起功能 | P2 |
| `subpkg/coach/reward.vue` | 评分数据一致性 | P2 |
| `subpkg/coach/detail.vue` | 收藏按钮z-index、查看全部评价跳转 | P2 |
| `subpkg/order/detail.vue` | 订单不存在空状态 | P2 |
| `subpkg/mine/info.vue` | 生日选择器范围限制 | P2 |
| `subpkg/mine/recharge.vue` | 支付方式逻辑调整 | P3 |
| `subpkg/booking/confirm.vue` | 无参数友好提示 | P3 |
| `static/` | 添加favicon | P3 |

---

## 阶段一：P1严重级Bug修复

### Task 1.1: 设置页面退出登录功能完善

**Files:**
- Modify: `subpkg/mine/setting.vue`

**Dependencies:** 无

**Status:** Ready to implement

**Steps:**

- [ ] **Step 1.1.1: 导入userStore**
  在script setup中添加导入：
  ```javascript
  import { useUserStore } from '@/store'
  const userStore = useUserStore()
  ```

- [ ] **Step 1.1.2: 更新isLoggedIn计算属性**
  修改为使用userStore：
  ```javascript
  const isLoggedIn = computed(() => userStore.isLoggedIn)
  ```

- [ ] **Step 1.1.3: 更新handleLogout方法**
  替换handleLogout方法：
  ```javascript
  const handleLogout = () => {
    uni.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          await userStore.logout()
          uni.showToast({ title: '已退出登录', icon: 'success' })
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/login/index' })
          }, 1500)
        }
      }
    })
  }
  ```

**验收标准:**
- [ ] 设置页面显示退出登录按钮
- [ ] 点击按钮弹出确认对话框
- [ ] 确认后调用userStore.logout()
- [ ] 成功后跳转到登录页

---

### Task 1.2: 提现页面余额校验完善

**Files:**
- Modify: `subpkg/mine/withdraw.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 1.2.1: 查看当前提现页面结构**
  先读取现有文件，了解当前实现。

- [ ] **Step 1.2.2: 添加余额校验逻辑**
  在提交方法中添加：
  ```javascript
  const validateWithdraw = () => {
    const amount = parseFloat(form.value.amount)
    if (!amount || amount <= 0) {
      uni.showToast({ title: '请输入提现金额', icon: 'none' })
      return false
    }
    if (amount > balance.value) {
      uni.showToast({ title: '余额不足', icon: 'none' })
      return false
    }
    return true
  }
  ```

**验收标准:**
- [ ] 输入金额超过余额时提示"余额不足"
- [ ] 空金额或负金额时提示正确
- [ ] 余额校验失败时阻止提交

---

### Task 1.3: 重置密码页面表单验证

**Files:**
- Modify: `pages/login/resetPassword.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 1.3.1: 查看当前重置密码页面**
  读取现有文件了解结构。

- [ ] **Step 1.3.2: 添加完整验证逻辑**
  ```javascript
  const validateForm = () => {
    if (!form.value.mobile) {
      uni.showToast({ title: '请输入手机号', icon: 'none' })
      return false
    }
    const phoneReg = /^1[3-9]\d{9}$/
    if (!phoneReg.test(form.value.mobile)) {
      uni.showToast({ title: '手机号格式不正确', icon: 'none' })
      return false
    }
    if (!form.value.code) {
      uni.showToast({ title: '请输入验证码', icon: 'none' })
      return false
    }
    if (!form.value.password) {
      uni.showToast({ title: '请输入新密码', icon: 'none' })
      return false
    }
    if (form.value.password.length < 4) {
      uni.showToast({ title: '密码长度至少4位', icon: 'none' })
      return false
    }
    return true
  }
  ```

**验收标准:**
- [ ] 空手机号有提示
- [ ] 手机号格式不正确有提示
- [ ] 空验证码有提示
- [ ] 密码长度不足有提示

---

### Task 1.4: 登录页面确认验证完整性

**Files:**
- Verify: `pages/login/index.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 1.4.1: 检查登录页现有验证逻辑**
  读取文件，确认checkPhone方法是否在所有提交路径都被调用。

- [ ] **Step 1.4.2: 如有遗漏，补充验证调用**
  确保获取验证码和提交登录时都先验证。

**验收标准:**
- [ ] 空手机号获取验证码时提示
- [ ] 非法手机号获取验证码时提示
- [ ] 未勾选协议时有提示
- [ ] 所有验证逻辑正常工作

---

### Task 1.5: 修改密码页面确认验证完整性

**Files:**
- Verify: `subpkg/mine/pwd.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 1.5.1: 检查修改密码页现有验证**
  读取文件，确认是否已有完整验证。

- [ ] **Step 1.5.2: 如无验证，添加完整验证逻辑**
  包括验证码、新密码、确认密码一致性等验证。

**验收标准:**
- [ ] 空验证码有提示
- [ ] 新密码长度不足有提示
- [ ] 两次密码不一致有提示

---

## 阶段二：P2一般级Bug修复

### Task 2.1: 首页和我的页面功能入口修复

**Files:**
- Modify: `pages/mine/index.vue`
- Modify: `pages/home/index.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 2.1.1: 修复优惠券入口**
  在pages/mine/index.vue中找到优惠券入口，添加点击跳转：
  ```javascript
  const goCoupon = () => {
    uni.showToast({ title: '优惠券功能开发中', icon: 'none' })
    // 后续可替换为真实跳转: uni.navigateTo({ url: '/subpkg/mine/coupon' })
  }
  ```

- [ ] **Step 2.1.2: 修复消息通知入口**
  在pages/home/index.vue中找到消息通知入口，添加点击跳转：
  ```javascript
  const goMessage = () => {
    uni.showToast({ title: '消息通知功能开发中', icon: 'none' })
    // 后续可替换为真实跳转
  }
  ```

**验收标准:**
- [ ] 点击优惠券入口有响应（当前显示开发中）
- [ ] 点击消息通知入口有响应（当前显示开发中）

---

### Task 2.2: 帮助中心FAQ展开收起功能

**Files:**
- Modify: `subpkg/mine/help.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 2.2.1: 添加展开状态管理**
  ```javascript
  const expandedKeys = ref([])

  const toggleExpand = (index) => {
    const idx = expandedKeys.value.indexOf(index)
    if (idx > -1) {
      expandedKeys.value.splice(idx, 1)
    } else {
      expandedKeys.value.push(index)
    }
  }

  const isExpanded = (index) => expandedKeys.value.includes(index)
  ```

- [ ] **Step 2.2.2: 更新模板添加展开收起交互**
  为每个FAQ项添加点击事件和展开状态判断。

- [ ] **Step 2.2.3: 添加展开收起的样式**
  添加旋转箭头或+/-符号切换的样式。

**验收标准:**
- [ ] 点击FAQ问题可以展开查看答案
- [ ] 再次点击可以收起答案
- [ ] 有明显的展开/收起视觉提示

---

### Task 2.3: 打赏页面评分数据一致性

**Files:**
- Modify: `subpkg/coach/reward.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 2.3.1: 检查数据来源**
  查看打赏页评分数据是从哪里来的。

- [ ] **Step 2.3.2: 统一数据来源**
  确保与详情页使用相同的字段或参数传递正确的评分数据。

**验收标准:**
- [ ] 打赏页显示的评分与详情页一致

---

### Task 2.4: 裁教详情页修复

**Files:**
- Modify: `subpkg/coach/detail.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 2.4.1: 修复收藏按钮z-index问题**
  调整收藏按钮样式，添加足够高的z-index：
  ```scss
  .favorite-btn {
    position: relative;
    z-index: 100;
  }
  ```

- [ ] **Step 2.4.2: 添加查看全部评价跳转**
  ```javascript
  const goAllReviews = () => {
    uni.showToast({ title: '全部评价功能开发中', icon: 'none' })
    // 后续可替换为真实跳转
  }
  ```

**验收标准:**
- [ ] 收藏按钮不被导航栏遮挡，可正常点击
- [ ] 点击查看全部评价有响应

---

### Task 2.5: 订单详情页空状态修复

**Files:**
- Modify: `subpkg/order/detail.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 2.5.1: 添加订单不存在的判断**
  ```javascript
  const orderNotExist = ref(false)

  // 在加载订单详情的catch中设置
  orderNotExist.value = true
  ```

- [ ] **Step 2.5.2: 添加空状态模板**
  ```vue
  <view v-if="orderNotExist" class="empty-state">
    <uni-icons type="info" size="60" color="#9CA3AF" />
    <text class="empty-text">订单不存在或已删除</text>
    <button class="back-btn" @click="goBack">返回</button>
  </view>
  ```

**验收标准:**
- [ ] 订单不存在时显示友好提示页面
- [ ] 不渲染空数据模板

---

### Task 2.6: 生日选择器范围限制

**Files:**
- Modify: `subpkg/mine/info.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 2.6.1: 检查当前日期选择器配置**
  查看是否设置了end属性限制最大日期。

- [ ] **Step 2.6.2: 设置正确的日期范围**
  计算当前日期并设置为最大值：
  ```javascript
  const currentDate = computed(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  ```

**验收标准:**
- [ ] 不能选择未来的日期作为生日
- [ ] 日期选择器最大值是当前日期

---

## 阶段三：P3轻微级Bug修复

### Task 3.1: 充值页面支付方式逻辑调整

**Files:**
- Modify: `subpkg/mine/recharge.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 3.1.1: 检查当前支付方式逻辑**
  查看为什么只显示"钱包余额"选项。

- [ ] **Step 3.1.2: 根据需求调整支付方式**
  确认是否应该显示微信/支付宝等外部支付选项。

**验收标准:**
- [ ] 充值页面显示正确的支付方式选项

---

### Task 3.2: 确认订单页无参数友好提示

**Files:**
- Modify: `subpkg/booking/confirm.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 3.2.1: 添加参数检查**
  ```javascript
  onLoad((options) => {
    if (!options.coachId) {
      uni.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/coach/list' })
      }, 1500)
    }
  })
  ```

**验收标准:**
- [ ] 缺少必需参数时显示友好提示
- [ ] 自动跳转回合适的页面

---

### Task 3.3: 添加favicon

**Files:**
- Add: `static/favicon.ico`

**Dependencies:** 无

**Steps:**

- [ ] **Step 3.3.1: 准备favicon**
  （如果没有设计资源，这个可以后补）

**验收标准:**
- [ ] 浏览器标签页显示网站图标
- [ ] 不再报404错误

---

### Task 3.4: 其他控制台警告修复

**Files:**
- 各相关页面

**Steps:**

- [ ] **Step 3.4.1: 修复setNavigationBarTitle警告**
  确保页面标题有值。

- [ ] **Step 3.4.2: 修复text组件嵌套警告**
  调整组件结构。

**验收标准:**
- [ ] 控制台没有Vue相关警告

---

## 总体验收标准

### 功能验证

- [ ] 所有P1级Bug修复完成
- [ ] 所有P2级Bug修复完成
- [ ] 所有P3级Bug修复完成（或合理跳过）
- [ ] 表单验证都有正确的提示反馈
- [ ] 所有功能入口点击有响应
- [ ] 退出登录功能正常工作
- [ ] 生日选择器范围正确
- [ ] 帮助中心FAQ可展开收起

### 代码质量

- [ ] 所有改动保持现有代码风格
- [ ] 没有引入新的Bug
- [ ] 错误处理友好
- [ ] 没有遗留的console.log调试语句

### 用户体验

- [ ] 所有操作都有清晰的提示
- [ ] 错误提示信息用户友好
- [ ] 样式与深色主题保持一致

---

## 实施选择

**Plan complete and saved to `docs/superpowers/plans/2026-05-15-test-bug-fix-plan.md`**

**Two execution options:**

1. **Subagent-Driven (推荐)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach would you like to take?**