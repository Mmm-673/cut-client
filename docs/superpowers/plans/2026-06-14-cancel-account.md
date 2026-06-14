# 账号注销 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在设置页退出登录按钮下方新增账号注销能力，支持底部弹层输入可选注销原因，注销成功后立即退出登录。

**Architecture:** 在 `api/billiard/user.js` 新增独立 `cancelAccount(data)` API 封装；`subpkg/mine/setting.vue` 负责按钮、底部弹层状态、提交状态和成功后的登录态清理。复用现有 `userStore.logout()` 完成本地清理和服务端退出，保持设置页内聚。

**Tech Stack:** UniApp、Vue 3 Composition API、Pinia、SCSS、Vitest。

---

## File Structure

- Modify `api/billiard/user.js`: 新增账号注销请求函数 `cancelAccount(data)`。
- Modify `subpkg/mine/setting.vue`: 新增注销按钮、底部原因弹层、提交逻辑和样式。
- Create `tests/cancel-account-api.test.js`: 静态测试 API 路径和方法。
- Create `tests/setting-cancel-account.test.js`: 静态测试设置页包含注销入口、弹层、API 调用和成功退出逻辑。

---

### Task 1: Add cancel account API

**Files:**
- Modify: `api/billiard/user.js`
- Create: `tests/cancel-account-api.test.js`

- [ ] **Step 1: Write the failing API test**

Create `tests/cancel-account-api.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const apiFile = readFileSync(resolve(process.cwd(), 'api/billiard/user.js'), 'utf-8')

describe('账号注销 API', () => {
  it('封装 cancelAccount 并请求注销接口', () => {
    expect(apiFile).toContain('export function cancelAccount(data)')
    expect(apiFile).toContain("url: '/app-api/billiard/user/cancel-account'")
    expect(apiFile).toContain("method: 'post'")
    expect(apiFile).toContain('data')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/cancel-account-api.test.js
```

Expected: FAIL because `cancelAccount` does not exist yet. If the command fails with `vitest: command not found`, dependencies are not installed; record that as an environment blocker and continue implementation.

- [ ] **Step 3: Add minimal API implementation**

Append this to `api/billiard/user.js` after `updateMobile`:

```js
export function cancelAccount(data) {
  return request({
    url: '/app-api/billiard/user/cancel-account',
    method: 'post',
    data
  })
}
```

- [ ] **Step 4: Run the API test again**

Run:

```bash
npm test -- tests/cancel-account-api.test.js
```

Expected: PASS, or the same `vitest: command not found` environment blocker if dependencies are missing.

---

### Task 2: Add setting page cancel account UI and flow

**Files:**
- Modify: `subpkg/mine/setting.vue`
- Create: `tests/setting-cancel-account.test.js`

- [ ] **Step 1: Write the failing setting page test**

Create `tests/setting-cancel-account.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const settingPage = readFileSync(resolve(process.cwd(), 'subpkg/mine/setting.vue'), 'utf-8')

describe('设置页账号注销', () => {
  it('在退出登录下方提供账号注销入口', () => {
    expect(settingPage).toContain('账号注销')
    expect(settingPage).toContain('@click="openCancelAccountPopup"')
  })

  it('提供底部弹层填写可选注销原因', () => {
    expect(settingPage).toContain('cancel-account-popup')
    expect(settingPage).toContain('请输入注销原因（选填）')
    expect(settingPage).toContain('v-model="cancelReason"')
  })

  it('确认注销后调用接口并退出登录', () => {
    expect(settingPage).toContain("import { cancelAccount } from '@/api/billiard/user'")
    expect(settingPage).toContain('await cancelAccount({')
    expect(settingPage).toContain('reason: cancelReason.value.trim()')
    expect(settingPage).toContain("uni.showToast({ title: '账号已注销', icon: 'success' })")
    expect(settingPage).toContain('await userStore.logout()')
    expect(settingPage).toContain("url: '/pages/login/index'")
  })
})
```

- [ ] **Step 2: Run the setting page test to verify it fails**

Run:

```bash
npm test -- tests/setting-cancel-account.test.js
```

Expected: FAIL because the注销 UI and flow do not exist yet. If the command fails with `vitest: command not found`, dependencies are not installed; record that as an environment blocker and continue implementation.

- [ ] **Step 3: Update imports and state**

In `subpkg/mine/setting.vue`, change the script imports from:

```js
import { useUserStore } from '@/store'
```

to:

```js
import { useUserStore } from '@/store'
import { cancelAccount } from '@/api/billiard/user'
```

Add these state refs after `const userStore = useUserStore()`:

```js
const showCancelAccountPopup = ref(false)
const cancelReason = ref('')
const isCancelingAccount = ref(false)
```

- [ ] **Step 4: Add cancel account methods**

Add these methods before `handleLogout`:

```js
const openCancelAccountPopup = () => {
  cancelReason.value = ''
  showCancelAccountPopup.value = true
}

const closeCancelAccountPopup = () => {
  if (isCancelingAccount.value) return
  showCancelAccountPopup.value = false
}

const handleCancelAccount = async () => {
  if (isCancelingAccount.value) return

  try {
    isCancelingAccount.value = true
    uni.showLoading({ title: '注销中...' })
    await cancelAccount({
      reason: cancelReason.value.trim()
    })
    uni.hideLoading()
    uni.showToast({ title: '账号已注销', icon: 'success' })
    await userStore.logout()
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/login/index'
      })
    }, 1200)
  } catch (error) {
    uni.hideLoading()
    console.error('账号注销失败:', error)
  } finally {
    isCancelingAccount.value = false
  }
}
```

- [ ] **Step 5: Add cancel account button below logout button**

In `subpkg/mine/setting.vue`, replace the logout section:

```vue
<view class="logout-section" v-if="isLoggedIn">
  <button class="logout-btn" @click="handleLogout">退出登录</button>
</view>
```

with:

```vue
<view class="logout-section" v-if="isLoggedIn">
  <button class="logout-btn" @click="handleLogout">退出登录</button>
  <button class="cancel-account-btn" @click="openCancelAccountPopup">账号注销</button>
</view>
```

- [ ] **Step 6: Add bottom popup markup**

Add this block immediately after the `</scroll-view>` closing tag and before `</view>` for `.setting-wrapper`:

```vue
<view v-if="showCancelAccountPopup" class="cancel-account-mask" @click="closeCancelAccountPopup">
  <view class="cancel-account-popup" @click.stop>
    <view class="popup-handle"></view>
    <text class="popup-title">账号注销</text>
    <text class="popup-desc">注销后将退出登录，请确认是否继续。</text>
    <textarea
      class="cancel-reason-input"
      v-model="cancelReason"
      placeholder="请输入注销原因（选填）"
      placeholder-class="cancel-reason-placeholder"
      maxlength="255"
      :disabled="isCancelingAccount"
    />
    <view class="popup-actions">
      <button class="popup-btn popup-cancel" :disabled="isCancelingAccount" @click="closeCancelAccountPopup">取消</button>
      <button class="popup-btn popup-confirm" :disabled="isCancelingAccount" @click="handleCancelAccount">
        {{ isCancelingAccount ? '注销中...' : '确认注销' }}
      </button>
    </view>
  </view>
</view>
```

- [ ] **Step 7: Add styles for the new button and popup**

In the existing `.logout-section` style, add `.cancel-account-btn` next to `.logout-btn`:

```scss
  .cancel-account-btn {
    width: 100%;
    height: 96rpx;
    line-height: 96rpx;
    margin-top: 24rpx;
    background: rgba(239, 68, 68, 0.08);
    color: #EF4444;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: 600;
    border: 1rpx solid rgba(239, 68, 68, 0.35);
    &::after {
      border: none;
    }
  }
```

Add this style block before `.safe-area-bottom`:

```scss
.cancel-account-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
}

.cancel-account-popup {
  width: 100%;
  padding: 20rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));
  padding-bottom: calc(30rpx + constant(safe-area-inset-bottom));
  background: #1E252B;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.popup-handle {
  width: 80rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.2);
  align-self: center;
  margin-bottom: 28rpx;
}

.popup-title {
  color: #fff;
  font-size: 36rpx;
  font-weight: 600;
  text-align: center;
}

.popup-desc {
  color: #9CA3AF;
  font-size: 28rpx;
  line-height: 42rpx;
  text-align: center;
  margin-top: 16rpx;
}

.cancel-reason-input {
  width: 100%;
  min-height: 180rpx;
  margin-top: 32rpx;
  padding: 24rpx;
  box-sizing: border-box;
  border-radius: 20rpx;
  background: #121619;
  color: #fff;
  font-size: 28rpx;
  line-height: 40rpx;
}

.cancel-reason-placeholder {
  color: #6B7280;
}

.popup-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 32rpx;
}

.popup-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  &::after {
    border: none;
  }
}

.popup-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: #D1D5DB;
}

.popup-confirm {
  background: #EF4444;
  color: #fff;
}
```

- [ ] **Step 8: Run the setting page test again**

Run:

```bash
npm test -- tests/setting-cancel-account.test.js
```

Expected: PASS, or the same `vitest: command not found` environment blocker if dependencies are missing.

---

### Task 3: Final verification

**Files:**
- Verify: `api/billiard/user.js`
- Verify: `subpkg/mine/setting.vue`
- Verify: `tests/cancel-account-api.test.js`
- Verify: `tests/setting-cancel-account.test.js`

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- tests/cancel-account-api.test.js tests/setting-cancel-account.test.js
```

Expected: PASS. If `vitest: command not found`, report that dependencies are missing and tests could not execute in this environment.

- [ ] **Step 2: Review git diff**

Run:

```bash
git diff -- api/billiard/user.js subpkg/mine/setting.vue tests/cancel-account-api.test.js tests/setting-cancel-account.test.js
```

Expected: Diff only contains the cancel account API, setting page UI/flow, and focused tests.

- [ ] **Step 3: Manual UI smoke test**

Run the app in the normal UniApp target, open 设置页, verify:

1. “账号注销” appears below “退出登录” when logged in.
2. Tapping it opens a bottom popup.
3. Leaving reason empty still allows clicking “确认注销”.
4. Successful API response shows “账号已注销”.
5. User is sent to `/pages/login/index` and login state is cleared.

Do not commit unless the user explicitly asks for a commit.

---

## Self-Review

- Spec coverage: API wrapper, bottom popup, optional reason, success logout redirect, and testing are covered.
- Placeholder scan: no TBD/TODO/implement later placeholders remain.
- Type consistency: `cancelAccount(data)`, `cancelReason`, `showCancelAccountPopup`, and `isCancelingAccount` are used consistently.