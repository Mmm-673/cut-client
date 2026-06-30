ne# 台球约 - UI/UX Pro Max 升级方案

## 📋 概览

基于现有的深色主题基础上，进行企业级升级，融合：
- Apple iOS 高级质感
- HarmonyOS 动效体验
- 统一的 Design System

---

## 🎨 Design System 设计规范

### 颜色系统

| 层级 | 色值 | 说明 |
|------|------|------|
| **主色** | `#00BB88` | 翡翠绿，品牌色 |
| **辅助色** | `#F59E0B` | 鎏金色 |
| **主背景** | `#121619` | 页面背景 |
| **次级背景** | `#1E252B` | 组件背景 |
| **卡片背景** | `#2A3338` | Card 背景 |

### 字体系统

| 类型 | 字号(rpx) | 用途 |
|------|-----------|------|
| Display | 56 | 大标题 |
| Title 1 | 44 | 页面标题 |
| Title 2 | 36 | 卡片标题 |
| Body | 28 | 正文 |
| Caption | 20 | 说明文字 |

### 圆角系统

| 组件 | 圆角(rpx) |
|------|-----------|
| Button | 24 |
| Card | 28 |
| Sheet | 40 (top only) |
| Avatar | 50% |

### 阴影系统

```scss
// 克制、柔和、高级
$ds-shadow-md: 0 4rpx 16rpx rgba(0,0,0,0.25);
$ds-shadow-glow-emerald: 0 0 40rpx rgba(0,187,136,0.3);
```

### 动效系统

```scss
$ds-duration-normal: 250ms;
$ds-easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 📁 文件结构

```
cut-client/
├── design-system/              # ✨ 新增：Design System
│   ├── tokens/
│   │   ├── _colors.scss
│   │   ├── _typography.scss
│   │   ├── _spacing.scss
│   │   ├── _radius.scss
│   │   ├── _shadows.scss
│   │   └── _motion.scss
│   └── index.scss
│
├── components/                 # ✨ 新增：高级组件
│   ├── ds-button/
│   ├── ds-card/
│   ├── ds-app-navbar/
│   ├── ds-coach-card/
│   ├── ds-skeleton/
│   └── ...
│
├── static/styles/               # ✨ 新增：全局样式
│   └── animations.scss
│
└── pages/home/
    ├── index.vue            # 现有
    └── index-new.vue      # ✨ 新增：升级版本
```

---

## 🚀 已创建文件清单

### ✅ Design Tokens
1. `design-system/tokens/_colors.scss` - 颜色变量
2. `design-system/tokens/_typography.scss` - 字体变量
3. `design-system/tokens/_spacing.scss` - 间距变量
4. `design-system/tokens/_radius.scss` - 圆角变量
5. `design-system/tokens/_shadows.scss` - 阴影变量
6. `design-system/tokens/_motion.scss` - 动效变量
7. `design-system/index.scss` - 入口文件

### ✅ 组件
8. `components/ds-button/ds-button.vue` - 按钮组件
9. `components/ds-card/ds-card.vue` - 卡片组件
10. `components/ds-app-navbar/ds-app-navbar.vue` - 导航栏
11. `components/ds-coach-card/ds-coach-card.vue` - 裁教卡片
12. `components/ds-skeleton/ds-skeleton.vue` - 骨架屏

### ✅ 页面
13. `pages/home/index-new.vue` - 升级后的首页

### ✅ 样式
14. `static/styles/animations.scss` - 全局动画

---

## 📱 首页升级亮点

### 视觉升级
1. **Glassmorphism 玻璃质感** - 毛玻璃效果 + 内发光
2. **Gradient 渐变按钮** - 翡翠绿渐变 + 顶部光泽
3. **精致阴影** - 克制不厚重
4. **动画加载** - Skeleton 骨架屏

### 体验升级
1. **自定义导航栏** - 固定、毛玻璃、安全区域适配
2. **流畅动画** - 60fps 动效
3. **下拉刷新** - 集成刷新功能
4. **水平滚动卡片** - 更现代的布局

---

## 🎯 HarmonyOS 适配要点

### 安全区域
```vue
const safeAreaTop = ref(0)
onMounted(() => {
  const info = uni.getSystemInfoSync()
  safeAreaTop.value = info.statusBarHeight || 44
})
```

### 性能优化
- 使用硬件加速 `transform: translateZ(0)`
- 避免频繁重绘
- 图片懒加载

---

## 🔧 下一步

### 集成步骤

1. **替换首页** - 将 `index-new.vue` 重命名为 `index.vue`
2. **引入样式** - 在 `App.vue` 或 `main.js` 引入 Design System
3. **其他页面** - 逐步升级教练列表、订单、我的页面
4. **测试多端** - 微信小程序、H5、App 都测试

---

## 📝 注意事项

- 所有新增文件使用 `index-new` 命名，避免覆盖现有代码
- 建议先在开发环境测试，确认无误后再上线
- 保留原文件备份，便于回滚