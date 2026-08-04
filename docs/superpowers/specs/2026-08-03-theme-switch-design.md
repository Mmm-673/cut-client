# 主题切换系统设计文档

## 概述

为初球台球预约应用增加深色/白天模式切换功能，支持主题持久化保存，适配所有页面。

## 配色方案

### 深色主题（当前）

| 用途 | 色值 |
|------|------|
| 页面背景 | #121619 |
| 卡片/组件背景 | #1E252B |
| 品牌主色 | #00BB88 |
| 一级文字 | #FFFFFF |
| 二级文字 | #9CA3AF |
| 三级文字 | #6B7280 |
| 边框 | rgba(255,255,255,0.05) |

### 白天主题（新增）

| 用途 | 色值 |
|------|------|
| 页面背景 | #F5F7FA |
| 分组背景 | #FFFFFF |
| 卡片背景 | #FFFFFF |
| Secondary背景 | #F8FAFC |
| 品牌主色 | #00BB88 |
| 品牌Hover | #00A979 |
| 品牌Press | #00996D |
| 品牌浅色背景 | #E8FBF5 |
| 一级文字 | #1F2937 |
| 二级文字 | #6B7280 |
| 三级文字 | #9CA3AF |
| 占位文字 | #C7CDD4 |
| 边框 | #E5E7EB |
| 分割线 | #EEF2F6 |
| 在线状态圆点 | #22C55E |
| 在线状态背景 | #ECFDF3 |
| 评分星星 | #FFB800 |
| 评分数字 | #B7791F |

**卡片阴影：** `0 8px 30px rgba(15,23,42,0.08)`

## 技术方案

### 架构

```
├── store/modules/theme.js       # 主题状态管理
├── static/scss/themes.scss      # 主题变量定义
├── static/scss/index.scss       # 引入主题变量
├── utils/theme.js               # 主题工具函数
├── App.vue                      # 初始化主题
├── pages.json                   # (条件编译注释)
├── subpkg/mine/setting.vue      # 增加主题切换开关
└── [所有页面组件]               # 适配 CSS 变量
```

### 技术选型

- **CSS 变量 + 类名切换** - 性能好、易维护
- **Pinia Store** - 状态管理
- **uni.setStorageSync** - 持久化

## 实现步骤

### 1. 创建主题 Store (`store/modules/theme.js`)

- `theme` state: 'dark' | 'light'
- `toggleTheme()` action
- `setTheme()` action
- 持久化到 `app_theme`

### 2. 定义主题变量 (`static/scss/themes.scss`)

```scss
:root {
  // 共同变量
}

.theme-dark {
  // 深色主题变量
}

.theme-light {
  // 白天主题变量
}
```

### 3. 工具函数 (`utils/theme.js`)

- `getStoredTheme()` - 获取存储的主题
- `setStoredTheme()` - 存储主题
- `applyTheme()` - 应用主题到页面
- `updateNavigationBar()` - 更新导航栏样式
- `updateTabBar()` - 更新 TabBar 样式

### 4. 设置页面 (`subpkg/mine/setting.vue`)

- 增加主题切换开关 UI
- 支持"深色"、"白天"切换

### 5. 全局适配 (`App.vue`)

- onLaunch 时初始化主题
- 应用主题类名到 page

### 6. 页面适配

- 所有页面样式改用 CSS 变量
- 逐步迁移：先核心页面，后次要页面

## 文件清单

### 新增文件

1. `store/modules/theme.js`
2. `static/scss/themes.scss`
3. `utils/theme.js`

### 修改文件

1. `static/scss/index.scss`
2. `App.vue`
3. `subpkg/mine/setting.vue`
4. `store/index.js` (导出 theme store)
5. `pages/home/index.vue`
6. `pages/mine/index.vue`
7. `pages/coach/list.vue`
8. `pages/order/list.vue`
9. `pages/login/index.vue`
10. `subpkg/coach/detail.vue`
11. `subpkg/booking/confirm.vue`
12. `subpkg/order/detail.vue`
13. `subpkg/mine/wallet.vue`
14. ...其他页面

## 注意事项

1. **UniApp 平台差异** - 导航栏、TabBar 需要条件编译处理
2. **渐进式迁移** - 可以先改核心页面，其他页面逐步适配
3. **向后兼容** - 默认主题为深色，保持现有体验
4. **持久化键名** - 使用 `app_theme` 避免冲突
