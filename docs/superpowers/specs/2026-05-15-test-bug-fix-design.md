# 台球预约应用 Bug 修复方案设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | 2026-05-15-test-bug-fix-design.md |
| 创建日期 | 2026-05-15 |
| 方案类型 | Bug修复 |
| 修复范围 | 测试报告中发现的23个问题（H5定位问题暂不处理） |

---

## 1. 背景与目标

### 1.1 背景
根据2026-05-15的端到端测试报告，应用存在25个测试失败问题。
- **H5定位相关的2个P0问题**：暂不处理
- **剩余23个问题**：按计划修复

### 1.2 修复目标
- 修复所有P1级问题，确保核心功能可用
- 修复P2/P3级问题，提升用户体验
- 保持现有架构不变，采用最小改动原则

---

## 2. 问题清单与修复方案

### 2.1 P0 阻断级问题（暂不处理）

| 编号 | 问题 | 说明 |
|------|------|------|
| BUG-001 | 助教列表页始终无数据 | H5定位问题，暂不处理 |
| BUG-002 | 选择球厅页无数据 | H5定位问题，暂不处理 |

---

### 2.2 P1 严重级问题修复

#### BUG-003: 登录页手机号无前端校验
**问题描述**：空手机号、非法手机号点击"获取验证码"或"登录"无提示

**修复方案**：
1. `checkPhone`函数已存在，确保在所有提交路径都被调用
2. 空表单提交时明确提示

**修改文件**：`pages/login/index.vue`

**验证项**：
- [x] 空手机号获取验证码 → 提示"请输入手机号"
- [x] 非法手机号获取验证码 → 提示"手机号格式不正确"
- [x] 空手机号登录 → 提示"请输入手机号"
- [x] 未勾选协议 → 提示"请先同意用户协议和隐私政策"

---

#### BUG-004: 修改密码两次输入不校验一致性
**问题描述**：新密码和确认密码不一致时可直接提交

**修复方案**：
添加提交前验证逻辑

**修改文件**：`subpkg/mine/pwd.vue`

**验证逻辑**：
```javascript
const validateForm = () => {
  if (!form.value.code) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return false
  }
  if (!form.value.newPassword) {
    uni.showToast({ title: '请输入新密码', icon: 'none' })
    return false
  }
  if (form.value.newPassword.length < 4) {
    uni.showToast({ title: '密码长度至少4位', icon: 'none' })
    return false
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' })
    return false
  }
  return true
}
```

---

#### BUG-005: 提现不校验余额充足性
**问题描述**：余额为0时仍可输入提现金额，无提示

**修复方案**：
1. 获取钱包余额
2. 提交时校验金额 ≤ 可用余额

**修改文件**：`subpkg/mine/withdraw.vue`

---

#### BUG-006: 设置页缺少退出登录功能
**问题描述**：设置页面没有退出登录按钮

**修复方案**：
已有退出登录代码，确保正确集成userStore

**修改文件**：`subpkg/mine/setting.vue`

**修改点**：
```javascript
// 引入 userStore
import { useUserStore } from '@/store'
const userStore = useUserStore()

// 修改 handleLogout
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

---

#### BUG-007: 重置密码表单无完整校验
**问题描述**：空表单、密码过短、缺验证码都可直接提交

**修复方案**：
添加完整的表单验证函数

**修改文件**：`pages/login/resetPassword.vue`

---

### 2.3 P2 一般级问题修复

| 编号 | 问题 | 修改文件 | 修复方案 |
|------|------|---------|---------|
| BUG-008 | 优惠券入口无响应 | pages/mine/index.vue | 添加跳转逻辑 |
| BUG-009 | 消息通知入口无响应 | pages/home/index.vue | 添加跳转逻辑 |
| BUG-010 | 帮助中心FAQ无法展开 | subpkg/mine/help.vue | 添加展开/收起状态管理 |
| BUG-011 | 打赏页评分数据不一致 | subpkg/coach/reward.vue | 确保使用相同的数据字段 |
| BUG-012 | 密码登录空表单无提示 | pages/login/index.vue | 补充验证（已有checkPhone，确保调用） |
| BUG-013 | 助教详情收藏按钮被遮挡 | subpkg/coach/detail.vue | 调整z-index层级 |
| BUG-014 | "查看全部评价"无响应 | subpkg/coach/detail.vue | 添加跳转逻辑 |
| BUG-015 | 订单不存在仍渲染空模板 | subpkg/order/detail.vue | 添加错误状态展示 |
| BUG-016 | 生日选择器范围异常 | subpkg/mine/info.vue | 设置end为当前日期 |
| BUG-017 | 修改密码空表单无校验 | subpkg/mine/pwd.vue | 已在P1修复中覆盖 |

---

### 2.4 P3 轻微级问题修复

| 编号 | 问题 | 修改文件 | 修复方案 |
|------|------|---------|---------|
| BUG-018 | favicon.ico 404 | static/ | 添加favicon |
| BUG-019 | 外部占位图加载失败 | 各页面 | 替换为本地占位图 |
| BUG-020 | Vue Warning: Picker prop类型错误 | subpkg/mine/info.vue | 修正end属性格式 |
| BUG-021 | setNavigationBarTitle警告 | 各页面 | 确保title有值 |
| BUG-022 | text组件嵌套警告 | 各页面 | 调整组件结构 |
| BUG-023 | 充值页支付方式逻辑矛盾 | subpkg/mine/recharge.vue | 根据需求调整（微信/支付宝/钱包） |
| BUG-024 | 确认订单页无参数跳转 | subpkg/booking/confirm.vue | 添加友好提示 |
| BUG-025 | 用户协议以图片展示 | subpkg/common/textview.vue | 保持现状（后续优化） |

---

## 3. 文件修改清单

| 文件路径 | 修改内容 | 优先级 |
|---------|---------|-------|
| pages/login/index.vue | 表单验证完善 | P1 |
| pages/login/resetPassword.vue | 表单验证完善 | P1 |
| subpkg/mine/pwd.vue | 表单验证完善 | P1 |
| subpkg/mine/withdraw.vue | 余额校验 | P1 |
| subpkg/mine/setting.vue | 退出登录功能 | P1 |
| pages/mine/index.vue | 优惠券入口修复 | P2 |
| pages/home/index.vue | 消息入口修复 | P2 |
| subpkg/mine/help.vue | FAQ展开修复 | P2 |
| subpkg/coach/reward.vue | 评分数据修复 | P2 |
| subpkg/coach/detail.vue | 收藏按钮+全部评价 | P2 |
| subpkg/order/detail.vue | 空状态修复 | P2 |
| subpkg/mine/info.vue | 生日范围限制 | P2 |
| subpkg/mine/recharge.vue | 支付方式修正 | P3 |
| subpkg/booking/confirm.vue | 无参数提示 | P3 |

---

## 4. 测试验证计划

### 4.1 P1 验证
- [ ] 登录表单各种异常输入都有提示
- [ ] 重置密码表单验证完整
- [ ] 修改密码验证两次密码一致性
- [ ] 提现时余额不足有提示
- [ ] 设置页有退出登录并能正常工作

### 4.2 P2-P3 验证
- [ ] 所有功能入口能正常跳转
- [ ] FAQ可以展开收起
- [ ] 打赏页评分与详情页一致
- [ ] 收藏按钮不被遮挡
- [ ] 订单不存在显示友好提示
- [ ] 生日选择器范围正确

---

## 5. 风险与注意事项

### 5.1 风险点
1. 表单验证修改需要确保不影响正常提交流程

### 5.2 注意事项
1. 所有修改保持现有代码风格
2. 优先复用已有函数（如checkPhone）
3. 修改后进行充分的回归测试

---

## 6. 后续优化建议

1. 统一表单验证机制，提取为公共hooks
2. 完善错误边界处理
3. 用户协议改为富文本展示
4. 接入真实的微信/支付宝支付
5. H5定位问题后续单独处理

