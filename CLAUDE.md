# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

台球约 - 基于 UniApp + Vue3 的台球预约应用，支持 APP、小程序、H5 多端运行。基于 RuoYi-App 框架改造。

## 技术栈

- **框架**: UniApp (Vue3 Composition API)
- **状态管理**: Pinia
- **UI 组件**: uni-ui
- **样式**: SCSS

## 常用命令

- **运行开发**: `npm run dev:%PLATFORM%` (mp-weixin, h5, app-plus)
- **构建生产**: `npm run build:%PLATFORM%`
- **微信小程序预览**: 使用微信开发者工具导入 `dist/dev/mp-weixin`

## 主题色 (深色主题)

### 背景色
| 用途 | 色值 |
|------|------|
| 主背景 | `#121619` |
| 卡片/组件背景 | `#1E252B`、`#2a2a2a`、`#2d2d2d` |
| 页面背景 (部分) | `#2a3338` |
| 浅色背景 | `#ffffff`、`#f5f6f7` |

### 按钮色
| 用途 | 色值 |
|------|------|
| 主按钮渐变 | `linear-gradient(135deg, #10b981 0%, #059669 100%)` |
| 主按钮/品牌绿 | `#00BB88`、`#00d4aa` |
| 强调按钮 | `#f5a623` (橙色) |
| 图标色 | `#007AFF` (蓝色) |

### 文字色
| 用途 | 色值 |
|------|------|
| 主要文字 | `#333333` |
| 次要文字 | `#888888`、`#999999` |
| 导航栏标题 | `white` |

### 状态色
| 用途 | 色值 |
|------|------|
| 成功色 | `#4cd964` |
| 警告色 | `#f0ad4e` |
| 错误色 | `#dd524d` |

### TabBar
| 用途 | 色值 |
|------|------|
| 背景色 | `#1E252B` |
| 选中色 | `#00BB88` |
| 未选中色 | `#666666` |

## 项目结构

```
├── App.vue            # 应用入口
├── main.js            # Vue 实例初始化
├── config.js         # 应用全局配置 (API 地址、应用信息)
├── pages.json        # 页面路由和 TabBar 配置
├── manifest.json     # 应用manifest配置
├── api/              # API 接口层
│   └── modules/      # 按模块拆分的 API (auth, booking, coach, order 等)
├── pages/            # 页面 (按功能模块组织)
│   ├── login/        # 登录注册
│   ├── home/         # 首页
│   ├── coach/        # 教练列表、详情、打赏
│   ├── booking/      # 球厅选择、预约确认
│   ├── order/        # 订单列表、订单详情
│   └── mine/         # 我的、钱包、设置
├── store/            # Pinia Store
│   └── modules/      # user, config, dict
├── utils/            # 工具函数
│   ├── request.js    # axios 封装 (拦截器、token、错误处理)
│   ├── token.js      # token 管理
│   ├── payment.js    # 支付相关
│   └── ...
├── static/           # 静态资源
│   └── images/tabbar/# TabBar 图标
└── uni_modules/      # uni-ui 组件
```

## 页面路由

TabBar 4个标签页: 首页、预约(教练)、订单、我的

其他页面: 登录页、教练详情、打赏、评价、钱包、设置等

## 重要文件

- `utils/request.js`: 请求拦截器，自动附加 token，错误处理
- `utils/token.js`: token 存储和校验 (isLoggedIn 判断登录)
- `utils/payment.js`: 支付流程封装
- `config.js`: API 基础地址 `http://114.67.69.228`
- `permission.js`: 页面权限控制

## 全局样式

- `uni.scss`: uni-app 内置变量 ($uni-color-primary 等)
- `static/scss/index.scss`: 全局样式

## 登录流程

App.vue 的 `checkLogin()` 检查 token，无效则跳转登录页。登录页使用 `/pages/login/index`。