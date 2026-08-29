# 用户 App 前端迭代设计文档

> 日期：2026-08-27
> 来源：`用户App-前端修改清单.md`
> 测试环境接口前缀：`https://www.qiulem.com/test/app-api`
> 请求头：`tenant-id: 122`、`Authorization: Bearer <token>`

---

## 一、通知中心（需求 2）

### 1.1 概述

在用户 App 中新增通知中心功能，包含：
- 通知列表页（全部 / 未读 / 已读 三 Tab 筛选）
- 通知详情页
- 「我的」页面入口 + 未读数角标
- App 启动时重大通知弹窗（模态框）

### 1.2 入口设计

- **位置**：「我的」页面功能菜单列表中新增一项「消息通知」
- **角标**：菜单项右侧显示未读数数字角标（未读数 > 0 时显示）
- **跳转**：点击进入通知列表页

### 1.3 全局弹窗机制

**触发时机**：App 启动时（`App.vue` 的 `onLaunch` 中，登录状态下）拉取未读的重大通知，依次弹出。

**弹窗规则**：
- 仅 `type = 1`（重大通知）触发弹窗
- 每条通知只弹一次，弹窗展示后调用 `/read` 标记已读
- 多条未读重大通知时，依次弹出（关闭一条后再弹下一条）
- 使用模态弹窗（居中，需用户手动关闭）
- 未登录状态下不触发

**实现方式**：
- 在 `App.vue` 中封装一个全局弹窗组件或方法
- 启动时调用通知列表接口，筛选 `type=1` 且 `readStatus=0` 的通知
- 按发布时间倒序，依次弹出
- 弹窗内容：标题 + 内容 + 「我知道了」按钮
- 点击关闭时调用 `/read` 标记已读，然后检查下一条

### 1.4 页面设计

#### 通知列表页 `/subpkg/mine/notification/index`

**布局结构**（从上到下）：
1. 顶部导航栏：标题「消息通知」
2. Tab 切换栏：全部 / 未读 / 已读
3. 通知列表（下拉刷新 + 上拉加载更多）
4. 底部：「全部已读」按钮（仅未读 Tab 显示，或所有 Tab 都显示）

**列表项**：
- 置顶通知（`topFlag=true`）：排在最前，显示「置顶」标签，背景色略深
- 普通通知：标题（一行）、摘要（最多两行）、发布时间
- 未读标识：左侧或右侧显示未读小圆点

**交互**：
- 下拉刷新：重新加载第一页
- 上拉加载：加载下一页
- 点击列表项：跳转通知详情页
- 全部已读：调用 `/read-all`，清空未读数，刷新列表

#### 通知详情页 `/subpkg/mine/notification/detail`

**布局结构**：
1. 顶部导航栏：标题「通知详情」
2. 标题（大号加粗）
3. 发布时间
4. 正文内容（支持富文本，用 `<rich-text>` 渲染；纯文本则普通文本）

**交互**：
- 进入页面时调用 `/read` 标记已读（幂等，重复调用无副作用）
- 已读后返回列表页时刷新未读数和列表状态
- `actionType` 本期不做跳转，纯展示

### 1.5 API 设计

新增文件：`api/billiard/notification.js`

| 方法名 | 接口 | 说明 |
|---|---|---|
| `getNotificationPage(params)` | GET `/billiard/notification-center/page` | 分页列表；params: pageNo, pageSize, readStatus |
| `getNotificationDetail(id)` | GET `/billiard/notification-center/get` | 详情 |
| `getUnreadCount()` | GET `/billiard/notification-center/unread-count` | 未读数 |
| `markAsRead(id)` | POST `/billiard/notification-center/read` | 单条已读，Body: `{id}` |
| `markAllAsRead()` | POST `/billiard/notification-center/read-all` | 全部已读 |

### 1.6 路由配置

在 `subpkg/mine` 分包下新增两个页面：
- `subpkg/mine/notification/index` — 通知列表
- `subpkg/mine/notification/detail` — 通知详情

在 `pages.json` 的 `subPackages` 中 `subpkg/mine` 的 `pages` 数组里添加。

### 1.7 数据刷新联动

- 「我的」页面 `onShow` 时刷新未读数
- 从通知列表页返回「我的」时刷新未读数
- 从通知详情页返回列表时刷新列表项状态和未读数
- 全局弹窗标记已读后，未读数对应减少

---

## 二、助教详情视频播放器（需求 3）

### 2.1 概述

在助教详情页新增视频播放器，展示裁教的教学视频。

### 2.2 改动范围

- **页面**：`subpkg/coach/detail.vue`
- **API**：`api/billiard/coach.js` — `getCoachDetail` 返回值新增字段（无需修改请求，后端自动返回）

### 2.3 新增字段

| 字段 | 说明 |
|---|---|
| `videoUrl` | 视频地址，空字符串表示无视频 |
| `videoFileName` | 文件名 |
| `videoFileSize` | 文件大小（字节） |
| `videoMimeType` | MIME 类型，`video/mp4` |

### 2.4 展示位置

在「个人介绍」区块和「个人相册」区块之间，插入视频播放区块。

### 2.5 展示规则

- `videoUrl` 非空：渲染视频播放器
- `videoUrl` 为空：整个视频区块不渲染（不占位）
- 不默认自动播放，用户手动点击播放
- 视频宽高比 16:9，宽度铺满内容区（左右有 padding）

### 2.6 播放器配置

使用 UniApp 内置 `<video>` 组件：
- `:src="videoUrl"`
- `autoplay="false"`
- `controls="true"`
- `object-fit="contain"`
- `enable-progress-gesture="true"`

### 2.7 生命周期管理

- `onHide` / `onUnload` 时调用 `videoContext.pause()` 暂停播放
- 避免 App 进入后台后继续播放或耗电

### 2.8 错误降级

- 监听 `error` 事件
- 播放失败时：toast 提示「视频加载失败」+ 隐藏视频区块
- 不影响其他页面内容和下单流程

---

## 三、移除开票入口（需求 7，反向）

### 3.1 现状

现有代码中不存在任何发票/开票相关的页面、组件或 API（全局搜索关键词匹配数为 0）。

### 3.2 处理

- 本期无需做任何移除操作
- 确保本期迭代中不新增任何开票入口或接口调用
- 如后续产品要求加占位，仅展示静态文案「功能建设中，敬请期待」，不发起任何 HTTP 请求

---

## 四、通用约定

- 金额字段单位均为「分」，展示时除以 100 保留两位小数
- 日期时间使用 `yyyy-MM-dd HH:mm:ss` 或 ISO `yyyy-MM-ddTHH:mm:ss` 格式
- HTTP 客户端已统一拼接 `/app-api` 前缀，业务代码只写 `/billiard/**`
- 遵循现有代码风格和目录结构规范