
# 初球 App Bug 修复设计文档

**日期**: 2026-05-18  
**项目**: 初球 - 台球预约应用  
**修复范围**: 全部30个问题（高10 / 中12 / 低8）

---

## 1. 概述

本文档列出代码审阅中发现的所有问题，并提供修复思路和验收标准。修复按页面组织，分三个阶段进行。

---

## 2. Bug 列表

### 2.1 高优先级问题（10个）

| ID | 标题 | 页面 | 位置 | 修复思路 |
|----|------|------|------|----------|
| H1 | 选择距离最近排序时，拒绝定位权限后状态混乱 | pages/coach/list.vue | 第359-382行 | 权限拒绝时恢复原排序并提示用户 |
| H2 | 上拉加载失败后loading状态不重置 | pages/coach/list.vue | 第398-403行 | catch中重置loadMoreStatus为'noMore'或'error' |
| H3 | 选择球厅功能未实现 | pages/booking/index.vue | 第172-174行 | 实现跳转到subpkg/booking/hall页面 |
| H4 | 切换订单Tab请求失败时一直显示loading | pages/order/list.vue | 第372-407行 | 请求失败时重置loading状态 |
| H5 | 编辑资料跳转的页面不存在 | pages/mine/index.vue | 第491-494行 | 创建subpkg/mine/info.vue或改跳到其他页面 |
| H6 | 确认订单页刷新后数据丢失 | subpkg/booking/confirm.vue | 第621-683行 | 使用URL参数传递关键数据或临时存储到Pinia |
| H7 | 订单详情轮询函数定义位置问题 | subpkg/order/detail.vue | 第1119-1128行 | 调整函数定义顺序或使用函数声明 |
| H8 | 联系教练使用硬编码手机号 | subpkg/order/detail.vue | 第665-669行 | 从订单数据coachMobile字段获取 |
| H9 | 钱包选择月份功能未实现 | subpkg/mine/wallet.vue | 第227-229行 | 实现月份选择器并对接API |
| H10 | 预约页面入口混乱，状态处理不统一 | pages/booking/index.vue | 整个文件 | 统一从首页和助教列表进入的数据处理逻辑 |

### 2.2 中优先级问题（12个）

| ID | 标题 | 页面 | 位置 | 修复思路 |
|----|------|------|------|----------|
| M1 | 登录手机号验证过于严格 | pages/login/index.vue | 第175行 | 放宽正则为/^1[3-9]\d{9}$/（保持现状，注释说明） |
| M2 | 首页定位权限拒绝后无数据刷新提示 | pages/home/index.vue | 第291-320行 | 权限拒绝后提示用户并显示默认数据 |
| M3 | 首页API失败只打印console | pages/home/index.vue | 第243-246,255-258行 | 显示toast提示用户 |
| M4 | 预约页缺少球厅选择验证 | pages/booking/index.vue | 第177-193行 | 根据服务类型判断是否需要球厅 |
| M5 | 订单列表滑动删除对所有状态显示 | pages/order/list.vue | 第83-91,306-315行 | 只对已取消订单渲染滑动区域 |
| M6 | 我的页面多个请求无统一错误处理 | pages/mine/index.vue | 第433-489行 | 每个请求独立处理错误并提示 |
| M7 | 助教详情收藏无乐观更新 | subpkg/coach/detail.vue | 第409-431行 | 先更新UI再请求API，失败则回滚 |
| M8 | 助教详情服务类型判断可能误判 | subpkg/coach/detail.vue | 第492-494行 | 使用serviceType字段而非名称判断 |
| M9 | 助教详情加载失败无重试 | subpkg/coach/detail.vue | 第344-349行 | 显示重试按钮 |
| M10 | 确认订单重新选择球厅不保存数据 | subpkg/booking/confirm.vue | 第435-447行 | 保存当前表单数据到storage |
| M11 | 确认订单无支付超时提示 | subpkg/booking/confirm.vue | 第586-613行 | 无expireTime时给默认提示 |
| M12 | 钱包交易记录bizType映射不完整 | subpkg/mine/wallet.vue | 第180-191行 | 补充完整的类型映射 |

### 2.3 低优先级问题（8个）

| ID | 标题 | 页面 | 修复思路 |
|----|------|------|----------|
| L1 | 登录获取验证码无成功提示 | pages/login/index.vue | 发送成功后显示toast |
| L2 | 登录切换Tab保留手机号 | pages/login/index.vue | 切换时清空所有字段或明确提示 |
| L3 | 首页教练列表无loading | pages/home/index.vue | 添加loading状态 |
| L4 | 预约页选中服务反馈不明显 | pages/booking/index.vue | 增强选中样式 |
| L5 | 订单列表再约一次无确认 | pages/order/list.vue | 添加确认弹窗 |
| L6 | 订单列表取消后不更新统计 | pages/order/list.vue | 取消后重新获取统计 |
| L7 | 我的页面下拉刷新无反馈 | pages/mine/index.vue | 添加刷新中状态提示 |
| L8 | 钱包余额切换无提示 | subpkg/mine/wallet.vue | 可加可不加，保持现状 |

---

## 3. 修复策略

**按页面修复**，同一页面的问题一起修复：

1. **登录模块**：pages/login/index.vue
2. **首页模块**：pages/home/index.vue
3. **预约模块**：pages/coach/list.vue → pages/booking/index.vue → subpkg/booking/confirm.vue
4. **订单模块**：pages/order/list.vue → subpkg/order/detail.vue
5. **个人中心**：pages/mine/index.vue → subpkg/mine/wallet.vue → subpkg/coach/detail.vue

---

## 4. 分阶段规划

### 阶段1：核心阻塞修复（高优先级）
- 目标：修复所有阻塞用户流程的问题
- 问题：H1-H10

### 阶段2：用户体验修复（中优先级）
- 目标：修复影响用户体验的问题
- 问题：M1-M12

### 阶段3：细节优化（低优先级）
- 目标： polish 细节问题
- 问题：L1-L8

---

## 5. 验收标准

每个问题修复后：
1. 按原问题复现步骤验证已修复
2. 不引入新的bug
3. 代码风格与现有代码保持一致
4. 必要时添加注释说明

---

## 6. 注意事项

- 先备份当前代码（已有git）
- 修复一个验证一个
- 每个页面修复完做完整测试
