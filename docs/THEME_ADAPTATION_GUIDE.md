# 主题切换系统 - 页面适配指南

## 📋 概述

本文档指导开发者如何将现有页面适配到深色/浅色主题切换系统。

## ✅ 已完成适配的页面

- [x] `pages/home/index.vue` - 首页
- [x] `pages/mine/index.vue` - 我的页面
- [x] `pages/coach/list.vue` - 教练列表页
- [x] `subpkg/mine/setting.vue` - 设置页

## 🎯 CSS 变量对照表

### 背景色

| 原硬编码值 | CSS 变量 | 说明 |
|-----------|---------|-----|
| `#121619` | `var(--bg-page)` | 页面主背景 |
| `#1E252B` | `var(--bg-card)` | 卡片背景 |
| `#2a2a2a` / `#2a3338` | `var(--bg-secondary)` | 次要背景 |

### 文字色

| 原硬编码值 | CSS 变量 | 说明 |
|-----------|---------|-----|
| `#fff` / `#ffffff` | `var(--text-primary)` | 主要文字 |
| `#9CA3AF` | `var(--text-secondary)` | 次要文字 |
| `#6B7280` / `#999` / `#888` / `#666` | `var(--text-tertiary)` | 三级文字 |

### 边框/分割线

| 原硬编码值 | CSS 变量 | 说明 |
|-----------|---------|-----|
| `rgba(255, 255, 255, 0.05)` | `var(--border-color)` | 边框颜色 |
| - | `var(--divider-color)` | 分割线颜色 |

### 品牌色/状态色

| 用途 | CSS 变量 | 说明 |
|------|---------|-----|
| 品牌主色 | `var(--brand-primary)` | `#00BB88` |
| 品牌浅色背景 | `var(--brand-light-bg)` | 半透明品牌色 |
| 品牌渐变 | `var(--brand-gradient)` | 渐变背景 |
| 星星颜色 | `var(--star-color)` | 评分星星 |
| 在线状态点 | `var(--online-dot)` | 在线状态指示 |
| 在线状态背景 | `var(--online-bg)` | 在线状态背景 |

### 阴影

| 用途 | CSS 变量 | 说明 |
|------|---------|-----|
| 卡片阴影 | `var(--card-shadow)` | 根据主题自动调整 |

## 🚀 快速适配步骤

### 1. 检查页面根容器背景色

```scss
// 适配前
.page-container {
  background-color: #121619;
}

// 适配后
.page-container {
  background-color: var(--bg-page);
}
```

### 2. 替换卡片/容器背景色

```scss
// 适配前
.card {
  background-color: #1E252B;
}

// 适配后
.card {
  background-color: var(--bg-card);
}
```

### 3. 替换文字颜色

```scss
// 适配前
.title {
  color: #fff;
}

.subtitle {
  color: #9CA3AF;
}

.meta {
  color: #666;
}

// 适配后
.title {
  color: var(--text-primary);
}

.subtitle {
  color: var(--text-secondary);
}

.meta {
  color: var(--text-tertiary);
}
```

### 4. 替换边框颜色

```scss
// 适配前
.border {
  border: 1rpx solid rgba(255, 255, 255, 0.05);
}

// 适配后
.border {
  border: 1rpx solid var(--border-color);
}
```

### 5. 添加过渡动画（可选但推荐）

```scss
// 在页面容器上添加
.page-container {
  transition: background-color 0.3s ease;
}

// 在文字元素上添加
.title {
  transition: color 0.3s ease;
}
```

## 📝 批量替换技巧

### 使用 VS Code 批量替换

1. **替换页面背景色**
   - 查找: `#121619`
   - 替换: `var(--bg-page)`
   - 范围: 当前文件

2. **替换卡片背景色**
   - 查找: `#1E252B`
   - 替换: `var(--bg-card)`

3. **替换白色文字**
   - 查找: `color: #fff;`
   - 替换: `color: var(--text-primary);`
   
   - 查找: `color: #ffffff;`
   - 替换: `color: var(--text-primary);`

4. **替换次要文字**
   - 查找: `color: #9CA3AF;`
   - 替换: `color: var(--text-secondary);`

5. **替换三级文字**
   - 查找: `color: #6B7280;`
   - 替换: `color: var(--text-tertiary);`
   
   - 查找: `color: #999;`
   - 替换: `color: var(--text-tertiary);`
   
   - 查找: `color: #666;`
   - 替换: `color: var(--text-tertiary);`

6. **替换半透明白色边框**
   - 查找: `rgba(255, 255, 255, 0.05)`
   - 替换: `var(--border-color)`

## 🔍 适配检查清单

适配完成后，请逐项检查：

- [ ] 页面背景色正确使用了 `var(--bg-page)`
- [ ] 卡片背景色正确使用了 `var(--bg-card)`
- [ ] 主要文字使用 `var(--text-primary)`
- [ ] 次要文字使用 `var(--text-secondary)`
- [ ] 三级/辅助文字使用 `var(--text-tertiary)`
- [ ] 边框使用 `var(--border-color)`
- [ ] 在浅色主题下测试可读性
- [ ] 在深色主题下测试可读性
- [ ] 测试主题切换时的过渡效果（如果有添加）
- [ ] 检查特殊状态（在线、星星评分等）颜色是否正确

## 🎨 特殊场景处理

### 某些颜色在两个主题下需要不同

如果某个颜色不能简单使用 CSS 变量，可以使用主题类名覆盖：

```scss
.special-element {
  // 默认深色主题
  color: #some-color;
}

// 浅色主题覆盖
.theme-light .special-element {
  color: #another-color;
}
```

### 渐变背景

对于渐变背景，建议直接在两个主题下定义：

```scss
// themes.scss
.theme-dark {
  --special-gradient: linear-gradient(135deg, rgba(0, 187, 136, 0.2), rgba(0, 187, 136, 0.05));
}

.theme-light {
  --special-gradient: linear-gradient(135deg, rgba(0, 187, 136, 0.1), rgba(0, 187, 136, 0.03));
}

// 在页面中使用
.gradient-element {
  background: var(--special-gradient);
}
```

## 📱 待适配页面列表

### 核心页面
- [ ] `pages/login/index.vue` - 登录页
- [ ] `pages/order/list.vue` - 订单列表页
- [ ] `pages/scan/index.vue` - 扫码页

### 分包页面
- [ ] `subpkg/coach/detail.vue` - 教练详情
- [ ] `subpkg/coach/reward.vue` - 打赏页
- [ ] `subpkg/coach/evaluate.vue` - 评价页
- [ ] `subpkg/booking/hall.vue` - 球厅选择
- [ ] `subpkg/booking/confirm.vue` - 预约确认
- [ ] `subpkg/booking/pay-success.vue` - 支付成功
- [ ] `subpkg/order/detail.vue` - 订单详情
- [ ] `subpkg/mine/info.vue` - 个人信息
- [ ] `subpkg/mine/favorites.vue` - 我的收藏
- [ ] `subpkg/mine/pwd.vue` - 修改密码
- [ ] `subpkg/mine/help.vue` - 帮助中心
- [ ] `subpkg/mine/wallet.vue` - 钱包
- [ ] `subpkg/mine/wallet-list.vue` - 钱包流水

## 💡 最佳实践

1. **渐进式适配**: 优先适配核心流程页面，再适配次要页面
2. **测试完整性**: 每次适配后都要在两个主题下测试
3. **保留注释**: 对于特殊处理的地方添加注释说明原因
4. **统一风格**: 全项目使用相同的适配模式
5. **及时更新**: 新增页面直接使用 CSS 变量开发

## 🐛 常见问题

### Q: 切换主题后页面没有变化？
A: 检查是否正确应用了主题类名，确保 CSS 变量定义正确引入。

### Q: 浅色模式下某些文字看不清？
A: 确认文字颜色使用了正确的 CSS 变量，不要使用硬编码的白色。

### Q: 如何添加新的主题颜色变量？
A: 在 `static/scss/themes.scss` 中两个主题类下都添加对应的变量定义。

### Q: uni-app 的导航栏和 TabBar 如何适配？
A: 导航栏和 TabBar 已经在 `utils/theme.js` 中通过 `uni.setNavigationBarColor()` 和 `uni.setTabBarStyle()` 动态处理，无需在页面中单独处理。
