
# API接口集成实施计划

&gt; **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将9个已实现的API接口集成到前端页面，提供完整的用户交互流程

**Architecture:** 保持现有项目结构，修改现有页面集成新功能，使用Vue 3 Composition API + UniApp

**Tech Stack:** UniApp + Vue 3 + Pinia + SCSS

---

## 文件变更清单

### 修改文件
| 文件路径 | 修改内容 |
|---------|----------|
| `subpkg/order/detail.vue` | 添加删除订单、计时状态、异常报告功能 |
| `pages/order/list.vue` | 添加左滑删除功能 |
| `subpkg/mine/recharge.vue` | 重构为套餐选择模式 |
| `subpkg/mine/withdraw.vue` | 完全重写提现逻辑 |
| `subpkg/mine/wallet.vue` | 添加充值/提现记录入口 |

---

## 阶段一：订单删除功能

### Task 1.1: 订单详情页添加删除功能（已部分完成）

**Files:**
- Modify: `subpkg/order/detail.vue`

**Dependencies:** 无

**Status:** 部分完成 - 基础删除功能已添加，但样式需要完善

**Steps:**

- [ ] **Step 1.1.1: 验证现有代码**
  确认deleteOrder已导入，删除确认弹窗已添加

- [ ] **Step 1.1.2: 添加删除按钮样式**
  在`.action-btn`样式后添加删除按钮样式:

  ```scss
  &amp;.delete-order {
    flex: 1;
    margin-right: 16rpx;
    background: rgba(239, 68, 68, 0.2);
    color: #EF4444;
  }
  ```

- [ ] **Step 1.1.3: 添加删除确认弹窗样式**
  在文件末尾`</style>`前添加:

  ```scss
  /* 删除确认弹窗遮罩 */
  .delete-popup-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delete-popup-wrapper {
    width: 560rpx;
    background: #1E252B;
    border-radius: 24rpx;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .delete-popup-content {
    padding: 48rpx 40rpx 40rpx;
    .delete-popup-title {
      color: #fff;
      font-size: 36rpx;
      font-weight: 600;
      text-align: center;
      margin-bottom: 16rpx;
    }
    .delete-popup-text {
      color: #9CA3AF;
      font-size: 28rpx;
      text-align: center;
      line-height: 1.6;
      margin-bottom: 40rpx;
    }
    .delete-popup-buttons {
      display: flex;
      gap: 20rpx;
      .delete-popup-btn {
        flex: 1;
        height: 80rpx;
        line-height: 80rpx;
        border-radius: 40rpx;
        font-size: 30rpx;
        font-weight: 500;
        border: none;
        &amp;::after { border: none; }
        &amp;.cancel {
          background: rgba(107, 114, 128, 0.2);
          color: #9CA3AF;
        }
        &amp;.confirm {
          background: #EF4444;
          color: #fff;
        }
      }
    }
  }
  ```

**验收标准:**
- [ ] 已完成、已取消订单显示删除按钮
- [ ] 点击删除弹出确认弹窗
- [ ] 确认后调用deleteOrder接口
- [ ] 成功后提示并返回列表页

---

### Task 1.2: 订单列表页添加左滑删除

**Files:**
- Modify: `pages/order/list.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 1.2.1: 导入deleteOrder接口**
  在import语句后添加:
  ```javascript
  import { deleteOrder } from '@/api/billiard/order'
  ```

- [ ] **Step 1.2.2: 添加删除确认状态**
  在script setup中添加:
  ```javascript
  // 删除确认弹窗
  const showDeleteConfirm = ref(false)
  const deletingOrder = ref(null)
  ```

- [ ] **Step 1.2.3: 修改订单卡片模板，添加滑动删除**
  找到`.order-card`部分，用uni-swipe-action包装:
  ```vue
  <uni-swipe-action>
    <uni-swipe-action-item :right-options="getRightOptions(item)">
      <view class="order-card" @click="goToDetail(item)">
        <!-- 现有订单卡片内容保持不变 -->
      </view>
    </uni-swipe-action-item>
  </uni-swipe-action>
  ```

- [ ] **Step 1.2.4: 添加获取滑动选项的方法**
  ```javascript
  // 获取右滑选项
  const getRightOptions = (item) => {
    if (item.status === 60 || item.status === 70) {
      return [{
        text: '删除',
        style: {
          backgroundColor: '#EF4444'
        }
      }]
    }
    return []
  }
  ```

- [ ] **Step 1.2.5: 监听滑动点击事件**
  在template中添加:
  ```vue
  <uni-swipe-action @click="onSwipeActionClick">
  ```

  添加处理方法:
  ```javascript
  // 处理滑动点击
  const onSwipeActionClick = (e) => {
    const { content, index } = e
    if (content.text === '删除') {
      deletingOrder.value = orderList.value[index]
      showDeleteConfirm.value = true
    }
  }
  ```

- [ ] **Step 1.2.6: 添加删除确认弹窗**
  在template底部添加:
  ```vue
  <!-- 删除确认弹窗 -->
  <uni-popup ref="deletePopup" type="dialog" :show="showDeleteConfirm" @close="showDeleteConfirm = false">
    <uni-popup-dialog 
      type="error"
      title="删除订单"
      content="确定要删除这个订单吗？删除后无法恢复。"
      :confirm="true"
      :cancel="true"
      @confirm="handleDeleteOrder"
      @close="showDeleteConfirm = false"
    />
  </uni-popup>
  ```

- [ ] **Step 1.2.7: 添加删除处理方法**
  ```javascript
  // 处理删除订单
  const handleDeleteOrder = async () => {
    if (!deletingOrder.value) return
    
    uni.showLoading({ title: '删除中...' })
    
    try {
      await deleteOrder({ orderId: deletingOrder.value.orderId })
      uni.showToast({ title: '删除成功', icon: 'success' })
      // 重新加载列表
      await loadData(true)
    } catch (error) {
      console.error('删除失败:', error)
      uni.showToast({ 
        title: error.message || '删除失败', 
        icon: 'none' 
      })
    } finally {
      uni.hideLoading()
      showDeleteConfirm.value = false
      deletingOrder.value = null
    }
  }
  ```

- [ ] **Step 1.2.8: 如果项目没有uni-popup组件，使用uni.showModal替代**
  如果没有uni-popup，简化为:
  ```javascript
  // 处理滑动点击
  const onSwipeActionClick = (e) => {
    const { content, index } = e
    if (content.text === '删除') {
      const order = orderList.value[index]
      uni.showModal({
        title: '删除订单',
        content: '确定要删除这个订单吗？删除后无法恢复。',
        success: async (res) => {
          if (res.confirm) {
            await handleDeleteOrder(order)
          }
        }
      })
    }
  }

  // 处理删除订单
  const handleDeleteOrder = async (order) => {
    uni.showLoading({ title: '删除中...' })
    
    try {
      await deleteOrder({ orderId: order.orderId })
      uni.showToast({ title: '删除成功', icon: 'success' })
      await loadData(true)
    } catch (error) {
      console.error('删除失败:', error)
      uni.showToast({ 
        title: error.message || '删除失败', 
        icon: 'none' 
      })
    } finally {
      uni.hideLoading()
    }
  }
  ```

**验收标准:**
- [ ] 已完成、已取消订单支持左滑显示删除按钮
- [ ] 点击删除弹出确认对话框
- [ ] 确认后调用deleteOrder接口
- [ ] 成功后刷新列表

---

## 阶段二：提现功能重写

### Task 2.1: 完全重写提现页面

**Files:**
- Modify: `subpkg/mine/withdraw.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 2.1.1: 替换模板部分**
  用以下内容完全替换template:
  ```vue
  &lt;template&gt;
    &lt;view class="withdraw-wrapper"&gt;
      &lt;!-- 可提现余额 --&gt;
      &lt;view class="balance-card"&gt;
        &lt;view class="balance-title"&gt;可提现余额&lt;/view&gt;
        &lt;text class="balance-amount"&gt;¥{{ (balanceInfo.withdrawableAmount / 100).toFixed(2) }}&lt;/text&gt;
        &lt;view class="balance-tips"&gt;
          当前可申请：¥{{ (balanceInfo.availableWithdrawAmount / 100).toFixed(2) }}
        &lt;/view&gt;
      &lt;/view&gt;

      &lt;!-- 提现金额 --&gt;
      &lt;view class="section-card"&gt;
        &lt;view class="section-title"&gt;提现金额&lt;/view&gt;
        &lt;view class="amount-input-wrap"&gt;
          &lt;text class="currency"&gt;¥&lt;/text&gt;
          &lt;input
              class="amount-input"
              type="digit"
              v-model="withdrawAmount"
              placeholder="请输入提现金额"
              placeholder-class="input-placeholder"
              @input="onAmountInput"
          /&gt;
        &lt;/view&gt;
        &lt;view class="quick-amount"&gt;
          &lt;text 
              class="quick-item" 
              v-for="amt in quickAmounts" 
              :key="amt"
              @click="selectQuickAmount(amt)"
          &gt;{{ amt }}&lt;/text&gt;
        &lt;/view&gt;
      &lt;/view&gt;

      &lt;!-- 到账方式 --&gt;
      &lt;view class="section-card"&gt;
        &lt;view class="section-title"&gt;到账方式&lt;/view&gt;
        &lt;view class="account-list"&gt;
          &lt;view
              class="account-item"
              :class="{active: accountForm.accountType === 1}"
              @click="selectAccountType(1)"
          &gt;
            &lt;view class="account-icon wechat"&gt;
              &lt;uni-icons type="chatbubble-filled" size="24" color="#fff" /&gt;
            &lt;/view&gt;
            &lt;text class="account-name"&gt;微信&lt;/text&gt;
            &lt;view class="account-radio"&gt;
              &lt;view class="radio-dot" v-if="accountForm.accountType === 1"&gt;&lt;/view&gt;
            &lt;/view&gt;
          &lt;/view&gt;
          &lt;view
              class="account-item"
              :class="{active: accountForm.accountType === 2}"
              @click="selectAccountType(2)"
          &gt;
            &lt;view class="account-icon alipay"&gt;
              &lt;uni-icons type="chatbubble" size="24" color="#fff" /&gt;
            &lt;/view&gt;
            &lt;text class="account-name"&gt;支付宝&lt;/text&gt;
            &lt;view class="account-radio"&gt;
              &lt;view class="radio-dot" v-if="accountForm.accountType === 2"&gt;&lt;/view&gt;
            &lt;/view&gt;
          &lt;/view&gt;
        &lt;/view&gt;
      &lt;/view&gt;

      &lt;!-- 账户信息 --&gt;
      &lt;view class="section-card" v-if="accountForm.accountType"&gt;
        &lt;view class="section-title"&gt;账户信息&lt;/view&gt;
        &lt;view class="input-group"&gt;
          &lt;text class="input-label"&gt;{{ accountForm.accountType === 1 ? '微信号' : '支付宝账号' }}&lt;/text&gt;
          &lt;input
              class="input-field"
              v-model="accountForm.accountNo"
              placeholder="请输入账号"
              placeholder-class="input-placeholder"
          /&gt;
        &lt;/view&gt;
        &lt;view class="input-group"&gt;
          &lt;text class="input-label"&gt;真实姓名&lt;/text&gt;
          &lt;input
              class="input-field"
              v-model="accountForm.realName"
              placeholder="请输入真实姓名"
              placeholder-class="input-placeholder"
          /&gt;
        &lt;/view&gt;
      &lt;/view&gt;

      &lt;!-- 提示信息 --&gt;
      &lt;view class="tip-card"&gt;
        &lt;view class="tip-title"&gt;温馨提示&lt;/view&gt;
        &lt;view class="tip-item"&gt;1. 提现申请提交后，预计1-3个工作日到账&lt;/view&gt;
        &lt;view class="tip-item"&gt;2. 单笔最低提现金额1元&lt;/view&gt;
        &lt;view class="tip-item"&gt;3. 如有问题请联系客服&lt;/view&gt;
      &lt;/view&gt;

      &lt;!-- 底部安全区域 --&gt;
      &lt;view class="safe-area-bottom"&gt;&lt;/view&gt;

      &lt;!-- 底部按钮 --&gt;
      &lt;view class="bottom-bar"&gt;
        &lt;button 
          class="submit-btn" 
          :disabled="!canWithdraw || submitting" 
          @click="handleSubmit"
        &gt;
          {{ submitting ? '提交中...' : '确认提现' }}
        &lt;/button&gt;
      &lt;/view&gt;
    &lt;/view&gt;
  &lt;/template&gt;
  ```

- [ ] **Step 2.1.2: 替换script部分**
  用以下内容完全替换script setup:
  ```vue
  &lt;script setup&gt;
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { onLoad, onUnload } from '@dcloudio/uni-app'
  import { getWithdrawableBalance, createWithdrawal } from '@/api/billiard/wallet'

  // 余额信息
  const balanceInfo = ref({
    withdrawableAmount: 0,
    availableWithdrawAmount: 0
  })

  // 提现金额
  const withdrawAmount = ref('')

  // 快捷金额选项
  const quickAmounts = [100, 500, 1000, 2000, 5000]

  // 账户表单
  const accountForm = ref({
    accountType: null, // 1微信 2支付宝
    accountNo: '',
    realName: ''
  })

  // 提交状态
  const submitting = ref(false)

  // 是否可以提现
  const canWithdraw = computed(() =&gt; {
    const amount = parseFloat(withdrawAmount.value)
    const available = balanceInfo.value.availableWithdrawAmount / 100
    
    if (!amount || amount &lt;= 0) return false
    if (amount &gt; available) return false
    if (!accountForm.value.accountType) return false
    if (!accountForm.value.accountNo.trim()) return false
    return true
  })

  // 加载可提现余额
  const loadBalance = async () =&gt; {
    try {
      const res = await getWithdrawableBalance()
      if (res.data) {
        balanceInfo.value = {
          withdrawableAmount: res.data.withdrawableAmount || 0,
          availableWithdrawAmount: res.data.availableWithdrawAmount || 0
        }
      }
    } catch (error) {
      console.error('加载余额失败:', error)
      uni.showToast({ 
        title: error.message || '加载失败', 
        icon: 'none' 
      })
    }
  }

  // 金额输入处理
  const onAmountInput = () =&gt; {
    let value = withdrawAmount.value
    // 只允许数字和小数点
    value = value.replace(/[^\d.]/g, '')
    // 只能有一个小数点
    const parts = value.split('.')
    if (parts.length &gt; 2) {
      value = parts[0] + '.' + parts.slice(1).join('')
    }
    // 最多两位小数
    if (parts[1] &amp;&amp; parts[1].length &gt; 2) {
      value = parts[0] + '.' + parts[1].slice(0, 2)
    }
    withdrawAmount.value = value
  }

  // 选择快捷金额
  const selectQuickAmount = (amount) =&gt; {
    const available = balanceInfo.value.availableWithdrawAmount / 100
    withdrawAmount.value = Math.min(amount, available).toString()
  }

  // 选择账户类型
  const selectAccountType = (type) =&gt; {
    accountForm.value.accountType = type
  }

  // 处理提现
  const handleSubmit = async () =&gt; {
    if (!canWithdraw.value) {
      uni.showToast({ 
        title: '请填写完整信息', 
        icon: 'none' 
      })
      return
    }

    uni.showModal({
      title: '确认提现',
      content: `确认提现¥${withdrawAmount.value}到${accountForm.value.accountType === 1 ? '微信' : '支付宝'}账户吗？`,
      success: async (res) =&gt; {
        if (res.confirm) {
          await doSubmit()
        }
      }
    })
  }

  // 执行提交
  const doSubmit = async () =&gt; {
    submitting.value = true
    uni.showLoading({ title: '提交中...' })
    
    try {
      await createWithdrawal({
        withdrawAmount: Math.round(parseFloat(withdrawAmount.value) * 100),
        accountType: accountForm.value.accountType,
        accountNo: accountForm.value.accountNo,
        realName: accountForm.value.realName
      })

      uni.hideLoading()
      uni.showToast({ 
        title: '提现申请已提交', 
        icon: 'success' 
      })
      
      setTimeout(() =&gt; {
        uni.navigateBack()
      }, 1500)
    } catch (error) {
      uni.hideLoading()
      console.error('提现失败:', error)
      uni.showToast({ 
        title: error.message || '提现失败', 
        icon: 'none' 
      })
    } finally {
      submitting.value = false
    }
  }

  onLoad(() =&gt; {
    loadBalance()
  })

  onMounted(() =&gt; {
    // 页面加载
  })

  onUnmounted(() =&gt; {
    // 页面卸载
  })
  &lt;/script&gt;
  ```

- [ ] **Step 2.1.3: 替换style部分**
  用以下内容完全替换style:
  ```vue
  &lt;style lang="scss" scoped&gt;
  .withdraw-wrapper {
    min-height: 100vh;
    background: #121619;
    padding-bottom: 200rpx;
  }

  /* 余额卡片 */
  .balance-card {
    margin: 30rpx;
    background: linear-gradient(135deg, #00BB88 0%, #008866 100%);
    border-radius: 24rpx;
    padding: 40rpx 30rpx;

    .balance-title {
      color: rgba(255,255,255,0.9);
      font-size: 28rpx;
      margin-bottom: 12rpx;
    }

    .balance-amount {
      color: #fff;
      font-size: 64rpx;
      font-weight: bold;
      display: block;
      margin-bottom: 12rpx;
    }

    .balance-tips {
      color: rgba(255,255,255,0.8);
      font-size: 24rpx;
    }
  }

  .section-card {
    margin: 30rpx;
    background: #1E252B;
    border-radius: 24rpx;
    padding: 30rpx;
  }

  .section-title {
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 30rpx;
  }

  /* 金额输入 */
  .amount-input-wrap {
    display: flex;
    align-items: center;
    border-bottom: 1rpx solid rgba(255,255,255,0.1);
    padding-bottom: 20rpx;
    margin-bottom: 20rpx;

    .currency {
      color: #fff;
      font-size: 48rpx;
      font-weight: bold;
      margin-right: 16rpx;
    }

    .amount-input {
      flex: 1;
      color: #fff;
      font-size: 48rpx;
      font-weight: bold;
    }
  }

  .quick-amount {
    display: flex;
    gap: 16rpx;
    flex-wrap: wrap;

    .quick-item {
      padding: 12rpx 32rpx;
      background: rgba(0, 187, 136, 0.1);
      color: #00BB88;
      font-size: 26rpx;
      border-radius: 24rpx;
      border: 1rpx solid rgba(0, 187, 136, 0.3);
    }
  }

  .input-placeholder {
    color: #6B7280;
    font-size: 28rpx;
  }

  /* 账户选择 */
  .account-list {
    .account-item {
      display: flex;
      align-items: center;
      padding: 24rpx 0;
      border-bottom: 1rpx solid rgba(255,255,255,0.05);

      &amp;:last-child {
        border-bottom: none;
      }

      .account-icon {
        width: 70rpx;
        height: 70rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;

        &amp;.wechat {
          background: #07C160;
        }

        &amp;.alipay {
          background: #1677FF;
        }
      }

      .account-name {
        flex: 1;
        color: #fff;
        font-size: 30rpx;
      }

      .account-radio {
        width: 40rpx;
        height: 40rpx;
        border: 3rpx solid #2a3338;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &amp;.active .account-radio {
        border-color: #00BB88;
        .radio-dot {
          width: 20rpx;
          height: 20rpx;
          border-radius: 50%;
          background: #00BB88;
        }
      }
    }
  }

  /* 账户信息 */
  .input-group {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx solid rgba(255,255,255,0.05);

    &amp;:last-child {
      border-bottom: none;
    }

    .input-label {
      width: 160rpx;
      color: #9CA3AF;
      font-size: 28rpx;
    }

    .input-field {
      flex: 1;
      color: #fff;
      font-size: 28rpx;
      text-align: right;
    }
  }

  /* 提示信息 */
  .tip-card {
    margin: 30rpx;
    background: rgba(251, 191, 36, 0.1);
    border: 1rpx solid rgba(251, 191, 36, 0.3);
    border-radius: 16rpx;
    padding: 24rpx;

    .tip-title {
      color: #FBBF24;
      font-size: 28rpx;
      font-weight: 600;
      margin-bottom: 16rpx;
    }

    .tip-item {
      color: #9CA3AF;
      font-size: 26rpx;
      line-height: 1.8;
    }
  }

  /* 底部安全区域 */
  .safe-area-bottom {
    height: constant(safe-area-inset-bottom);
    height: env(safe-area-inset-bottom);
  }

  /* 底部按钮 */
  .bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: #1E252B;
    border-top: 1rpx solid rgba(255,255,255,0.05);
    padding: 20rpx 30rpx;
    padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));

    .submit-btn {
      width: 100%;
      height: 88rpx;
      background: #00BB88;
      color: #fff;
      border-radius: 44rpx;
      font-size: 30rpx;
      font-weight: 600;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;

      &amp;::after {
        border: none;
      }

      &amp;[disabled] {
        background: rgba(0, 187, 136, 0.3);
        color: rgba(255,255,255,0.5);
      }
    }
  }
  &lt;/style&gt;
  ```

**验收标准:**
- [ ] 页面加载时调用getWithdrawableBalance并显示可提现余额
- [ ] 用户可输入提现金额，有快捷金额选项
- [ ] 用户可选择微信/支付宝到账方式
- [ ] 调用createWithdrawal提交提现申请
- [ ] 成功后提示并返回钱包页

---

## 阶段三：充值套餐功能

### Task 3.1: 重构充值页面为套餐选择模式

**Files:**
- Modify: `subpkg/mine/recharge.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 3.1.1: 更新导入语句**
  替换现有import语句:
  ```javascript
  import { ref, computed, onMounted } from 'vue'
  import { getAvailablePayChannels, executePayment } from '@/utils/payment'
  import { getWalletRechargePackages, createWalletRecharge } from '@/api/billiard/pay'
  ```

- [ ] **Step 3.1.2: 更新模板部分**
  替换模板中的金额选择部分:
  ```vue
  &lt;!-- 充值套餐 --&gt;
  &lt;view class="section-card"&gt;
    &lt;view class="section-title"&gt;选择充值套餐&lt;/view&gt;
    &lt;view class="package-grid"&gt;
      &lt;view
          class="package-item"
          :class="{active: selectedPackage?.id === item.id}"
          v-for="item in packageList"
          :key="item.id"
          @click="selectPackage(item)"
      &gt;
        &lt;text class="package-price"&gt;¥{{ (item.payPrice / 100).toFixed(0) }}&lt;/text&gt;
        &lt;text class="package-bonus" v-if="item.bonusPrice &gt; 0"&gt;+送¥{{ (item.bonusPrice / 100).toFixed(0) }}&lt;/text&gt;
      &lt;/view&gt;
      &lt;view
          class="package-item custom"
          :class="{active: isCustomAmount}"
          @click="showCustomInput"
      &gt;
        &lt;text class="package-price" v-if="!isCustomAmount"&gt;自定义&lt;/text&gt;
        &lt;input
            v-else
            class="custom-input"
            type="digit"
            v-model="customAmount"
            placeholder="输入金额"
            placeholder-class="input-placeholder"
            @focus="onCustomFocus"
        /&gt;
      &lt;/view&gt;
    &lt;/view&gt;
  &lt;/view&gt;
  ```

- [ ] **Step 3.1.3: 更新script数据和方法**
  替换script setup中的内容:
  ```javascript
  // 充值套餐列表
  const packageList = ref([])

  // 选中的套餐
  const selectedPackage = ref(null)
  const customAmount = ref('')
  const isCustomAmount = ref(false)

  // 支付方式
  const selectedPay = ref('wechat')
  const payChannels = computed(() =&gt; getAvailablePayChannels())

  // 最终金额
  const finalAmount = computed(() =&gt; {
    if (isCustomAmount.value &amp;&amp; customAmount.value) {
      return parseFloat(customAmount.value).toFixed(2)
    }
    if (selectedPackage.value) {
      return (selectedPackage.value.payPrice / 100).toFixed(2)
    }
    return '0.00'
  })

  // 是否可以支付
  const canPay = computed(() =&gt; {
    return parseFloat(finalAmount.value) &gt; 0
  })

  // 加载套餐列表
  const loadPackages = async () =&gt; {
    try {
      const res = await getWalletRechargePackages()
      packageList.value = res.data || []
      // 默认选中第一个套餐
      if (packageList.value.length &gt; 0) {
        selectedPackage.value = packageList.value[0]
      }
    } catch (error) {
      console.error('加载套餐失败:', error)
    }
  }

  // 选择套餐
  const selectPackage = (pkg) =&gt; {
    selectedPackage.value = pkg
    isCustomAmount.value = false
    customAmount.value = ''
  }

  // 显示自定义输入
  const showCustomInput = () =&gt; {
    isCustomAmount.value = true
    selectedPackage.value = null
  }

  // 自定义金额获得焦点
  const onCustomFocus = () =&gt; {
    isCustomAmount.value = true
    selectedPackage.value = null
  }

  // 选择支付方式
  const selectPay = (value) =&gt; {
    selectedPay.value = value
  }

  // 处理充值
  const handleRecharge = async () =&gt; {
    if (!canPay.value) {
      uni.showToast({ title: '请选择充值金额', icon: 'none' })
      return
    }

    uni.showLoading({ title: '创建充值订单...' })

    try {
      let params = {}
      if (isCustomAmount.value &amp;&amp; customAmount.value) {
        params.payPrice = Math.round(parseFloat(customAmount.value) * 100)
      } else if (selectedPackage.value) {
        params.packageId = selectedPackage.value.id
      } else {
        throw new Error('请选择充值金额')
      }

      // 创建钱包充值订单
      const orderRes = await createWalletRecharge(params)

      const payOrderId = orderRes.data?.payOrderId

      if (!payOrderId) {
        throw new Error('充值订单创建失败')
      }

      uni.hideLoading()

      // 执行支付
      await executePayment({
        payOrderId: payOrderId,
        payValue: selectedPay.value,
        orderId: payOrderId,
        onSuccess: () =&gt; {
          uni.showToast({ title: '充值成功', icon: 'success' })
          setTimeout(() =&gt; {
            uni.redirectTo({
              url: `/subpkg/mine/recharge-success?amount=${finalAmount.value}`
            })
          }, 1500)
        },
        onCancel: () =&gt; {
          uni.showToast({ title: '支付已取消', icon: 'none' })
        },
        onError: (error) =&gt; {
          uni.showToast({ title: error.message || '支付失败', icon: 'none' })
        }
      })
    } catch (error) {
      uni.hideLoading()
      console.error('充值失败:', error)
      uni.showToast({ title: error.message || '充值失败', icon: 'none' })
    }
  }

  onMounted(() =&gt; {
    loadPackages()
  })
  ```

- [ ] **Step 3.1.4: 更新样式**
  替换金额选择相关样式:
  ```scss
  /* 套餐选择 */
  .package-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20rpx;
  }

  .package-item {
    min-height: 140rpx;
    background: #2a3338;
    border-radius: 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16rpx 8rpx;
    border: 2rpx solid transparent;
    transition: all 0.2s;

    &amp;.active {
      background: rgba(0, 187, 136, 0.15);
      border-color: #00BB88;
    }

    .package-price {
      color: #fff;
      font-size: 36rpx;
      font-weight: 600;
      margin-bottom: 8rpx;
    }

    .package-bonus {
      color: #FBBF24;
      font-size: 22rpx;
    }

    &amp;.custom {
      .package-price {
        color: #9CA3AF;
      }
      &amp;.active .package-price {
        color: #00BB88;
      }
    }
  }

  .custom-input {
    width: 100%;
    text-align: center;
    color: #fff;
    font-size: 32rpx;
  }

  .input-placeholder {
    color: #6B7280;
    font-size: 28rpx;
  }
  ```

**验收标准:**
- [ ] 页面加载时调用getWalletRechargePackages获取套餐列表
- [ ] 套餐横向排列，显示支付金额和赠送金额
- [ ] 支持自定义金额输入
- [ ] 调用createWalletRecharge创建充值订单
- [ ] 使用现有支付流程完成支付

---

## 阶段四：计时状态功能

### Task 4.1: 订单详情页添加计时状态

**Files:**
- Modify: `subpkg/order/detail.vue`

**Dependencies:** Task 1.1

**Steps:**

- [ ] **Step 4.1.1: 导入getTimerStatus接口**
  添加导入:
  ```javascript
  import { getTimerStatus } from '@/api/billiard/timer'
  ```

- [ ] **Step 4.1.2: 添加计时状态变量**
  在script setup中添加:
  ```javascript
  // 计时状态
  const timerData = ref(null)
  const timerPolling = ref(null)
  const localTimer = ref(null)
  ```

- [ ] **Step 4.1.3: 添加formatSeconds工具函数**
  ```javascript
  // 格式化秒数为时间显示
  const formatSeconds = (seconds) =&gt; {
    const secs = Math.max(0, Math.floor(seconds))
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h &gt; 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  ```

- [ ] **Step 4.1.4: 添加加载计时状态的方法**
  ```javascript
  // 加载计时状态
  const loadTimerStatus = async () =&gt; {
    if (!orderId.value) return
    
    try {
      const res = await getTimerStatus({ orderId: orderId.value })
      timerData.value = res.data
      
      // 如果计时已结束，刷新订单状态
      if (timerData.value.status === 'ENDED') {
        stopTimerPolling()
        await loadOrderDetail(true)
      }
    } catch (error) {
      console.error('获取计时状态失败:', error)
    }
  }
  ```

- [ ] **Step 4.1.5: 添加轮询控制方法**
  ```javascript
  // 开始计时轮询
  const startTimerPolling = () =&gt; {
    stopTimerPolling()
    
    if (orderInfo.value.status !== 40) return
    
    // 立即加载一次
    loadTimerStatus()
    
    // 每5秒轮询
    timerPolling.value = setInterval(() =&gt; {
      loadTimerStatus()
    }, 5000)
    
    // 本地每秒更新显示，使动画更流畅
    localTimer.value = setInterval(() =&gt; {
      if (timerData.value &amp;&amp; timerData.value.status === 'RUNNING') {
        timerData.value.elapsedSeconds++
        if (timerData.value.remainingSeconds &gt; 0) {
          timerData.value.remainingSeconds--
        }
      }
    }, 1000)
  }

  // 停止计时轮询
  const stopTimerPolling = () =&gt; {
    if (timerPolling.value) {
      clearInterval(timerPolling.value)
      timerPolling.value = null
    }
    if (localTimer.value) {
      clearInterval(localTimer.value)
      localTimer.value = null
    }
  }
  ```

- [ ] **Step 4.1.6: 更新loadOrderDetail方法，在订单加载后处理计时**
  在loadOrderDetail的finally前添加:
  ```javascript
  // 根据订单状态处理计时
  if (data.status === 40) {
    startTimerPolling()
  } else {
    stopTimerPolling()
  }
  ```

- [ ] **Step 4.1.7: 在onUnmounted中清理计时器**
  ```javascript
  onUnmounted(() =&gt; {
    stopCountdown()
    stopPolling()
    stopTimerPolling() // 新增这一行
  })
  ```

- [ ] **Step 4.1.8: 在模板中添加计时状态显示**
  在顶部状态卡片中，在倒计时后面添加:
  ```vue
  &lt;!-- 计时状态 - 仅进行中显示 --&gt;
  &lt;view class="timer-section" v-if="orderInfo.status === 40 &amp;&amp; timerData"&gt;
    &lt;view class="timer-row"&gt;
      &lt;view class="timer-item"&gt;
        &lt;text class="timer-label"&gt;已服务&lt;/text&gt;
        &lt;text class="timer-value"&gt;{{ formatSeconds(timerData.elapsedSeconds) }}&lt;/text&gt;
      &lt;/view&gt;
      &lt;view class="timer-divider"&gt;&lt;/view&gt;
      &lt;view class="timer-item"&gt;
        &lt;text class="timer-label"&gt;剩余时间&lt;/text&gt;
        &lt;text class="timer-value" :class="{overtime: timerData.remainingSeconds &lt;= 0}"&gt;
          {{ formatSeconds(timerData.remainingSeconds) }}
          {{ timerData.remainingSeconds &lt;= 0 ? '(已超时)' : '' }}
        &lt;/text&gt;
      &lt;/view&gt;
    &lt;/view&gt;
  &lt;/view&gt;
  ```

- [ ] **Step 4.1.9: 添加计时状态样式**
  在样式中添加:
  ```scss
  /* 计时状态 */
  .timer-section {
    margin-top: 30rpx;
    padding-top: 30rpx;
    border-top: 1rpx solid rgba(255,255,255,0.1);

    .timer-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 40rpx;

      .timer-item {
        text-align: center;

        .timer-label {
          display: block;
          color: rgba(255,255,255,0.7);
          font-size: 24rpx;
          margin-bottom: 8rpx;
        }

        .timer-value {
          display: block;
          color: #fff;
          font-size: 40rpx;
          font-weight: bold;

          &amp;.overtime {
            color: #EF4444;
          }
        }
      }

      .timer-divider {
        width: 2rpx;
        height: 60rpx;
        background: rgba(255,255,255,0.2);
      }
    }
  }
  ```

**验收标准:**
- [ ] 仅订单状态为进行中(40)时显示计时状态
- [ ] 显示已服务时间和剩余时间
- [ ] 每5秒轮询getTimerStatus更新数据
- [ ] 本地每秒递减刷新显示
- [ ] 计时结束后自动刷新订单状态
- [ ] 页面卸载时清理定时器

---

## 阶段五：异常订单报告

### Task 5.1: 添加异常报告功能

**Files:**
- Modify: `subpkg/order/detail.vue`

**Dependencies:** Task 1.1, Task 4.1

**Steps:**

- [ ] **Step 5.1.1: 导入reportException接口**
  添加导入:
  ```javascript
  import { reportException } from '@/api/billiard/exception'
  ```

- [ ] **Step 5.1.2: 添加异常报告相关状态**
  在script setup中添加:
  ```javascript
  // 异常报告弹窗
  const showReportModal = ref(false)
  const submittingReport = ref(false)

  // 异常表单
  const reportForm = ref({
    exceptionType: null,
    reason: '',
    evidenceUrls: []
  })

  // 异常类型选项
  const exceptionTypeOptions = [
    { value: 1, label: '用户投诉' },
    { value: 2, label: '教练超时' },
    { value: 3, label: '系统异常' },
    { value: 4, label: '其他问题' }
  ]
  ```

- [ ] **Step 5.1.3: 添加投诉按钮到顶部导航栏**
  在模板顶部添加（可放在安全区域或页面顶部）:
  ```vue
  &lt;!-- 投诉按钮 - 仅非待付款状态显示 --&gt;
  &lt;view class="report-btn-wrapper" v-if="orderInfo.status !== 10"&gt;
    &lt;view class="report-btn" @click="showReportModal = true"&gt;
      &lt;uni-icons type="chatboxes" size="20" color="#fff" /&gt;
      &lt;text&gt;投诉&lt;/text&gt;
    &lt;/view&gt;
  &lt;/view&gt;
  ```

- [ ] **Step 5.1.4: 添加异常报告弹窗模板**
  在模板底部添加:
  ```vue
  &lt;!-- 异常报告弹窗 --&gt;
  &lt;uni-popup ref="reportPopup" type="bottom" :show="showReportModal" @close="showReportModal = false"&gt;
    &lt;view class="report-popup-wrapper"&gt;
      &lt;view class="popup-header"&gt;
        &lt;text class="popup-close" @click="showReportModal = false"&gt;取消&lt;/text&gt;
        &lt;text class="popup-title"&gt;报告异常&lt;/text&gt;
        &lt;text class="popup-confirm" :class="{disabled: submittingReport}" @click="handleSubmitReport"&gt;
          {{ submittingReport ? '提交中...' : '提交' }}
        &lt;/text&gt;
      &lt;/view&gt;

      &lt;view class="popup-content"&gt;
        &lt;!-- 异常类型 --&gt;
        &lt;view class="form-section"&gt;
          &lt;view class="form-title"&gt;异常类型&lt;/view&gt;
          &lt;view class="type-list"&gt;
            &lt;view
                class="type-item"
                :class="{active: reportForm.exceptionType === item.value}"
                v-for="item in exceptionTypeOptions"
                :key="item.value"
                @click="reportForm.exceptionType = item.value"
            &gt;
              &lt;text class="type-label"&gt;{{ item.label }}&lt;/text&gt;
              &lt;view class="type-check"&gt;
                &lt;uni-icons type="checkmarkempty" size="20" color="#00BB88" v-if="reportForm.exceptionType === item.value" /&gt;
              &lt;/view&gt;
            &lt;/view&gt;
          &lt;/view&gt;
        &lt;/view&gt;

        &lt;!-- 原因描述 --&gt;
        &lt;view class="form-section"&gt;
          &lt;view class="form-title"&gt;原因描述&lt;/view&gt;
          &lt;textarea
              class="reason-input"
              v-model="reportForm.reason"
              placeholder="请详细描述您遇到的问题，最多500字"
              placeholder-class="input-placeholder"
              :maxlength="500"
              :auto-height="true"
          /&gt;
          &lt;view class="char-count"&gt;{{ reportForm.reason.length }}/500&lt;/view&gt;
        &lt;/view&gt;

        &lt;!-- 上传凭证（可选，占位） --&gt;
        &lt;view class="form-section"&gt;
          &lt;view class="form-title"&gt;凭证上传（选填）&lt;/view&gt;
          &lt;view class="upload-tip"&gt;可上传截图或照片作为凭证&lt;/view&gt;
          &lt;!-- 上传功能可后续扩展 --&gt;
        &lt;/view&gt;
      &lt;/view&gt;
    &lt;/view&gt;
  &lt;/uni-popup&gt;
  ```

- [ ] **Step 5.1.5: 如果没有uni-popup组件，使用自定义弹窗样式**
  如果没有uni-popup，使用与删除弹窗类似的实现方式。

- [ ] **Step 5.1.6: 添加提交报告方法**
  ```javascript
  // 提交异常报告
  const handleSubmitReport = async () =&gt; {
    if (!reportForm.value.exceptionType) {
      uni.showToast({ title: '请选择异常类型', icon: 'none' })
      return
    }
    if (!reportForm.value.reason.trim()) {
      uni.showToast({ title: '请填写原因描述', icon: 'none' })
      return
    }

    submittingReport.value = true
    uni.showLoading({ title: '提交中...' })

    try {
      await reportException({
        orderId: orderId.value,
        exceptionType: reportForm.value.exceptionType,
        reason: reportForm.value.reason.trim(),
        evidenceUrls: reportForm.value.evidenceUrls
      })

      uni.hideLoading()
      uni.showToast({ title: '问题已提交，客服会尽快处理', icon: 'success' })
      
      // 关闭弹窗并重置表单
      setTimeout(() =&gt; {
        showReportModal.value = false
        resetReportForm()
      }, 1500)
    } catch (error) {
      uni.hideLoading()
      console.error('提交失败:', error)
      uni.showToast({ 
        title: error.message || '提交失败，请重试', 
        icon: 'none' 
      })
    } finally {
      submittingReport.value = false
    }
  }

  // 重置报告表单
  const resetReportForm = () =&gt; {
    reportForm.value = {
      exceptionType: null,
      reason: '',
      evidenceUrls: []
    }
  }
  ```

- [ ] **Step 5.1.7: 添加异常报告弹窗样式**
  在样式中添加:
  ```scss
  /* 投诉按钮 */
  .report-btn-wrapper {
    position: fixed;
    top: calc(constant(safe-area-inset-top) + 20rpx);
    top: calc(env(safe-area-inset-top) + 20rpx);
    right: 30rpx;
    z-index: 200;
  }

  .report-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 24rpx;
    background: rgba(239, 68, 68, 0.9);
    border-radius: 40rpx;

    text {
      color: #fff;
      font-size: 26rpx;
      font-weight: 500;
    }
  }

  /* 异常报告弹窗 */
  .report-popup-wrapper {
    background: #1E252B;
    border-radius: 32rpx 32rpx 0 0;
    max-height: 80vh;
    overflow-y: auto;
  }

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1rpx solid rgba(255,255,255,0.05);

    .popup-close {
      color: #9CA3AF;
      font-size: 28rpx;
    }

    .popup-title {
      color: #fff;
      font-size: 32rpx;
      font-weight: 600;
    }

    .popup-confirm {
      color: #00BB88;
      font-size: 28rpx;
      font-weight: 500;

      &amp;.disabled {
        color: rgba(0, 187, 136, 0.5);
      }
    }
  }

  .popup-content {
    padding: 30rpx;
    padding-bottom: calc(30rpx + constant(safe-area-inset-bottom));
    padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  }

  .form-section {
    margin-bottom: 40rpx;

    &amp;:last-child {
      margin-bottom: 0;
    }

    .form-title {
      color: #fff;
      font-size: 30rpx;
      font-weight: 600;
      margin-bottom: 20rpx;
    }

    .type-list {
      display: flex;
      flex-direction: column;
      gap: 12rpx;

      .type-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24rpx;
        background: #2a3338;
        border-radius: 16rpx;
        border: 2rpx solid transparent;

        &amp;.active {
          background: rgba(0, 187, 136, 0.1);
          border-color: #00BB88;
        }

        .type-label {
          color: #fff;
          font-size: 28rpx;
        }
      }
    }

    .reason-input {
      width: 100%;
      min-height: 200rpx;
      padding: 24rpx;
      background: #2a3338;
      border-radius: 16rpx;
      color: #fff;
      font-size: 28rpx;
      line-height: 1.6;
      box-sizing: border-box;
    }

    .char-count {
      text-align: right;
      color: #9CA3AF;
      font-size: 24rpx;
      margin-top: 12rpx;
    }

    .upload-tip {
      color: #9CA3AF;
      font-size: 26rpx;
      padding: 40rpx 20rpx;
      text-align: center;
      background: #2a3338;
      border-radius: 16rpx;
      border: 2rpx dashed rgba(255,255,255,0.2);
    }
  }

  .input-placeholder {
    color: #6B7280;
    font-size: 28rpx;
  }
  ```

**验收标准:**
- [ ] 仅订单状态非待付款(10)时显示投诉按钮
- [ ] 点击按钮弹出异常报告弹窗
- [ ] 支持选择4种异常类型
- [ ] 支持输入原因描述（最多500字）
- [ ] 调用reportException接口提交报告
- [ ] 成功后提示并关闭弹窗

---

## 阶段六：钱包页面调整

### Task 6.1: 添加充值/提现记录入口

**Files:**
- Modify: `subpkg/mine/wallet.vue`

**Dependencies:** 无

**Steps:**

- [ ] **Step 6.1.1: 在余额卡片操作按钮后添加记录入口**
  在`.action-btns`后添加:
  ```vue
  &lt;view class="record-entrance"&gt;
    &lt;view class="record-item" @click="goToRechargeRecord"&gt;
      &lt;view class="record-icon recharge"&gt;
        &lt;uni-icons type="arrowdown" size="20" color="#00BB88" /&gt;
      &lt;/view&gt;
      &lt;view class="record-text"&gt;
        &lt;text class="record-title"&gt;充值记录&lt;/text&gt;
        &lt;text class="record-subtitle"&gt;查看充值历史&lt;/text&gt;
      &lt;/view&gt;
      &lt;uni-icons type="right" size="16" color="#9CA3AF" /&gt;
    &lt;/view&gt;
    &lt;view class="record-item" @click="goToWithdrawRecord"&gt;
      &lt;view class="record-icon withdraw"&gt;
        &lt;uni-icons type="arrowup" size="20" color="#F59E0B" /&gt;
      &lt;/view&gt;
      &lt;view class="record-text"&gt;
        &lt;text class="record-title"&gt;提现记录&lt;/text&gt;
        &lt;text class="record-subtitle"&gt;查看提现历史&lt;/text&gt;
      &lt;/view&gt;
      &lt;uni-icons type="right" size="16" color="#9CA3AF" /&gt;
    &lt;/view&gt;
  &lt;/view&gt;
  ```

- [ ] **Step 6.1.2: 添加跳转方法**
  在script setup中添加:
  ```javascript
  // 跳转充值记录
  const goToRechargeRecord = () =&gt; {
    uni.showToast({ title: '充值记录功能开发中', icon: 'none' })
    // 后续可跳转: uni.navigateTo({ url: '/subpkg/mine/recharge-record' })
  }

  // 跳转提现记录
  const goToWithdrawRecord = () =&gt; {
    uni.showToast({ title: '提现记录功能开发中', icon: 'none' })
    // 后续可跳转: uni.navigateTo({ url: '/subpkg/mine/withdraw-record' })
  }
  ```

- [ ] **Step 6.1.3: 添加记录入口样式**
  在`.balance-card`样式后添加:
  ```scss
  /* 记录入口 */
  .record-entrance {
    margin-top: 30rpx;
    padding-top: 30rpx;
    border-top: 1rpx solid rgba(255,255,255,0.15);
    display: flex;
    flex-direction: column;
    gap: 20rpx;

    .record-item {
      display: flex;
      align-items: center;
      gap: 20rpx;
      padding: 16rpx 0;

      .record-icon {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.15);

        &amp;.recharge {
          background: rgba(0, 187, 136, 0.2);
        }

        &amp;.withdraw {
          background: rgba(245, 158, 11, 0.2);
        }
      }

      .record-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4rpx;

        .record-title {
          color: #fff;
          font-size: 30rpx;
          font-weight: 500;
        }

        .record-subtitle {
          color: rgba(255,255,255,0.7);
          font-size: 24rpx;
        }
      }
    }
  }
  ```

**验收标准:**
- [ ] 钱包页面显示充值记录和提现记录入口
- [ ] 点击入口可以尝试跳转（当前显示开发中提示）
- [ ] 样式与现有设计保持一致

---

## 总体验收标准

### 功能验证

- [ ] 订单删除功能正常工作（详情页+列表页）
- [ ] 提现功能使用新接口，流程完整
- [ ] 充值页面显示套餐，支持自定义金额
- [ ] 进行中订单实时显示计时状态
- [ ] 订单详情页可提交异常报告
- [ ] 钱包页面有充值/提现记录入口

### 代码质量

- [ ] 所有新功能都有完整的错误处理
- [ ] 用户友好的提示信息
- [ ] 页面卸载时正确清理定时器
- [ ] 代码风格与现有项目保持一致
- [ ] 没有遗留的console.log调试语句

### 用户体验

- [ ] 所有操作都有加载状态提示
- [ ] 重要操作有确认步骤
- [ ] 网络错误有友好提示
- [ ] 样式与深色主题保持一致

---

## 实施选择

**Plan complete and saved to `docs/superpowers/plans/2026-05-15-api-interfaces-integration-plan.md`**

**Two execution options:**

1. **Subagent-Driven (推荐)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach would you like to take?**
