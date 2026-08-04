# 主题切换 - 快速替换参考卡

## 🎯 一键替换清单

### 第一轮：背景色

| 查找内容 | 替换为 | 说明 |
|---------|-------|-----|
| `#121619` | `var(--bg-page)` | 页面主背景 |
| `#1E252B` | `var(--bg-card)` | 卡片背景 |
| `#2a2a2a` | `var(--bg-secondary)` | 次要背景 |
| `#2a3338` | `var(--bg-secondary)` | 次要背景 |

### 第二轮：文字色

| 查找内容 | 替换为 | 说明 |
|---------|-------|-----|
| `color: #fff;` | `color: var(--text-primary);` | 主要文字 |
| `color: #ffffff;` | `color: var(--text-primary);` | 主要文字 |
| `color: #9CA3AF;` | `color: var(--text-secondary);` | 次要文字 |
| `color: #6B7280;` | `color: var(--text-tertiary);` | 三级文字 |
| `color: #999;` | `color: var(--text-tertiary);` | 三级文字 |
| `color: #888;` | `color: var(--text-tertiary);` | 三级文字 |
| `color: #666;` | `color: var(--text-tertiary);` | 三级文字 |

### 第三轮：边框/分割线

| 查找内容 | 替换为 | 说明 |
|---------|-------|-----|
| `rgba(255, 255, 255, 0.05)` | `var(--border-color)` | 半透明白色边框 |
| `rgba(255,255,255,0.05)` | `var(--border-color)` | 半透明白色边框(无空格) |
| `border-top: 1rpx solid #333;` | `border-top: 1rpx solid var(--border-color);` | 顶边框 |
| `border-bottom: 1rpx solid #333;` | `border-bottom: 1rpx solid var(--border-color);` | 底边框 |

### 第四轮：特殊颜色

| 查找内容 | 替换为 | 说明 |
|---------|-------|-----|
| `#FFD700` | `var(--star-color)` | 星星颜色 |
| `#FFB800` | `var(--star-text)` | 评分文字色 |

## 📋 页面适配步骤

1. **打开页面文件** - 定位到 `.vue` 文件的 `<style>` 部分
2. **按顺序执行替换** - 按照上面四轮的顺序进行批量替换
3. **特殊情况处理** - 检查是否有需要单独处理的颜色
4. **测试验证** - 切换两个主题测试效果

## ⚠️ 注意事项

- **不要盲目替换** - 替换前确认该颜色确实需要适配主题
- **注意白色文字** - 有些白色文字可能在按钮或特殊背景上，需要单独评估
- **图片不受影响** - 图片内的颜色不会随主题变化
- **渐变特殊处理** - 渐变背景可能需要在两个主题中分别定义

## ✅ 适配后检查清单

- [ ] 在深色主题下正常显示
- [ ] 在浅色主题下正常显示
- [ ] 文字清晰可读，对比度足够
- [ ] 主题切换时有平滑过渡
- [ ] 所有状态颜色（在线、星星等）正常显示

## 🎨 变量速查表

```scss
// 背景
--bg-page:           // 页面背景
--bg-card:           // 卡片背景
--bg-secondary:      // 次要背景

// 文字
--text-primary:      // 主要文字
--text-secondary:    // 次要文字
--text-tertiary:     // 三级文字
--text-placeholder:  // 占位文字

// 品牌
--brand-primary:     // 品牌主色
--brand-light-bg:    // 品牌浅色背景
--brand-gradient:    // 品牌渐变

// 边框/阴影
--border-color:      // 边框颜色
--divider-color:     // 分割线颜色
--card-shadow:       // 卡片阴影

// 状态
--online-dot:        // 在线状态点
--online-bg:         // 在线状态背景
--star-color:        // 星星颜色
--star-text:         // 评分文字色
```
