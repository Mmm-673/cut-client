---
name: 多端适配设计方案
description: 为 cut-client 项目添加小程序、iOS、鸿蒙、安卓的完整多端适配
type: project
---

# 多端适配完整设计方案

## 一、项目适配架构

采用 UniApp 条件编译 + 平台兼容层的双轨架构：
- **条件编译**：处理平台特有 API 和配置
- **兼容层**：封装通用接口，抹平平台差异

## 二、适配模块划分

### 1. 配置模块（manifest.json + pages.json）
**目标**：完善各平台配置，支持鸿蒙

**主要内容**：
- 补充 `mp-alipay`、`mp-baidu`、`mp-toutiao` 等小程序配置
- 新增 `harmony` 鸿蒙平台配置
- 优化 `app-plus` 下 iOS/Android 权限配置
- 调整 pages.json 以兼容各平台导航栏样式

### 2. 核心 API 兼容模块
**目标**：封装 uni API，确保各平台行为一致

**子模块**：
- **请求模块** (`utils/request.js`)
  - 处理各平台请求头差异
  - 统一超时和错误处理
  - 鸿蒙网络请求适配
  
- **存储模块** (`utils/storage.js`)
  - 统一同步/异步存储接口
  - 处理存储大小限制差异
  
- **认证模块** (`utils/auth.js`、`permission.js`)
  - 各平台登录态持久化
  - 权限检查兼容

### 3. 平台工具模块
**目标**：新增 `utils/platform.js` 统一平台判断

```javascript
// 平台判断 API
export function isH5() { return /* #ifdef H5 */ true /* #endif */ false }
export function isMP() { return /* #ifdef MP */ true /* #endif */ false }
export function isApp() { return /* #ifdef APP-PLUS */ true /* #endif */ false }
export function isHarmony() { return /* #ifdef HARMONY */ true /* #endif */ false }
export function isIOS() { return /* #ifdef APP-PLUS */ uni.getSystemInfoSync().platform === 'ios' /* #endif */ false }
export function isAndroid() { return /* #ifdef APP-PLUS */ uni.getSystemInfoSync().platform === 'android' /* #endif */ false }
```

### 4. UI 组件适配模块
**目标**：确保 uni-ui 组件和自定义组件在各平台正常显示

**主要工作**：
- 检查并修复自定义组件的平台兼容性
- 补充条件编译处理平台特有样式问题
- 确保 iconfont 在各平台正常加载
- 适配各平台安全区域（刘海屏、底部手势条）

### 5. 页面适配模块
**目标**：逐个页面检查并修复跨平台问题

**页面清单**：
- 登录页 (`pages/login.vue`)
- 首页 (`pages/index.vue`)
- 工作台 (`pages/work/index.vue`)
- 我的 (`pages/mine/index.vue` 及子页面)
- 通用页面 (`pages/common/`)

**适配要点**：
- 去除或兼容 `//#ifdef H5` 独占逻辑
- 图片资源路径兼容
- 页面跳转方式统一
- 表单输入体验优化

### 6. 插件适配模块
**目标**：确保 plugins 目录下的插件全平台可用

**涉及文件**：
- `plugins/auth.js`
- `plugins/modal.js`
- `plugins/tab.js`

## 三、适配检查清单

完成后验证以下内容：
- [ ] 微信小程序可以正常登录、浏览页面
- [ ] iOS App 可以正常登录、浏览页面
- [ ] Android App 可以正常登录、浏览页面
- [ ] H5 可以正常登录、浏览页面
- [ ] 鸿蒙配置完整（可编译）
- [ ] 所有页面样式在各平台基本一致
- [ ] 图片、字体等资源加载正常

## 四、适配优先级

1. **P0 - 核心功能**：配置模块、请求模块、认证模块、登录页
2. **P1 - 主要页面**：首页、工作台、我的页面
3. **P2 - 次要页面**：设置、关于、帮助等
4. **P3 - 细节优化**：UI 微调、性能优化
