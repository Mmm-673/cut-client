# Phase 1：基础设施 + Bug 修复 设计文档

> 所属计划：[项目优化迭代总体计划](./2026-09-01-项目优化迭代-总体计划.md)
> 阶段编号：Phase 1
> 预估周期：2-3 天
> 风险等级：整体低（1 项中等风险）

---

## 一、阶段目标

修复已知 Bug，清理技术债，建立日志规范，为后续所有优化打好基础。

**核心原则**：
- 零功能变更 — 所有修改不改变任何用户可见的行为
- 渐进式 — 每项独立可验证，改一项验证一项
- 低风险优先 — 先改最安全的，再改中等风险的

---

## 二、改动清单（共 6 项）

### 2.1 Request URL 构造逻辑 Bug 修复（003）

**严重程度**：HIGH（实际影响取决于是否有调用传 `baseUrl`）
**工作量**：5 分钟
**风险等级**：极低

**文件**：`utils/request.js:141`

**问题描述**：
```javascript
// 当前代码
url: config.baseUrl || baseUrl + config.url
```
由于 `||` 优先级低于 `+`，实际执行的是：
```javascript
url: config.baseUrl || (baseUrl + config.url)
```
当 `config.baseUrl` 有值时，直接用 `config.baseUrl`，**完全丢弃了 `config.url`**。

**修复方案**：
```javascript
// 修复后
url: (config.baseUrl || baseUrl) + config.url
```

**影响范围核查**：需要先全局搜索所有传了 `baseUrl` 参数的 request 调用，确认当前是否有调用受此 bug 影响。如果没有，修复后行为不变；如果有，修复后行为变为正确的。

**验证方法**：
1. 全局搜索 `baseUrl:` 确认调用点
2. 如果有受影响的调用，修复后验证请求 URL 是否正确
3. 跑通核心流程确认无异常

---

### 2.2 空 catch 块修复（007）

**严重程度**：HIGH
**工作量**：0.5 小时
**风险等级**：极低

**涉及 3 个文件**：

| 文件 | 位置 | 当前代码 | 修复方案 |
|------|------|---------|---------|
| `App.vue` | 149 行 | `} catch (e) {}` | 添加 `console.warn('[App] 操作失败:', e)` |
| `utils/theme.js` | 38 行 | `} catch (e) {}` | 添加 `console.warn('[theme] 设置主题失败:', e)` |
| `subpkg/mine/info.vue` | 213 行 | `} catch (error) {}` | 添加 `console.error('[info] 操作失败:', error)` + toast 提示 |

**设计原则**：
- 只加日志，不改变任何控制流
- warn 级用于非关键操作失败（如主题设置、存储操作）
- error 级用于用户操作失败（如保存信息），同时给用户提示

**验证方法**：
- 人工触发异常场景（如 storage 写入失败），确认有日志输出
- 不影响正常流程

---

### 2.3 确认订单页 Storage 数据校验（006）

**严重程度**：HIGH
**工作量**：0.5 天
**风险等级**：中

**文件**：`subpkg/booking/confirm.vue`

**问题描述**：
订单金额、时长等关键数据从 `uni.getStorageSync('createdOrderData')` 读取，用户可篡改 storage 中的金额。虽然最终支付以后端订单为准，但展示金额与实际支付金额不一致会引发用户投诉和信任问题。

**修复方案（方案 A：全量从后端获取）**：

**数据读取流程改造**：
1. 页面 onLoad 时，从 `createdOrderData` 中提取 `orderId`
2. 如果有 `orderId`：
   - 设置 `loading = true`
   - 调用订单详情接口（`getOrderDetail(orderId)`）拉取最新数据
   - 接口返回后，用后端数据完全替换本地 orderData
   - 设置 `loading = false`
3. 如果没有 orderId（从其他路径进入，如初次下单）：
   - 走原有的订单创建流程
   - 创建成功后同样以 orderId 为准

**保留不变的 storage 数据**（非关键、非安全敏感）：
- `selectedCoach` — 用户选择的教练信息（草稿性质）
- 时间选择、球厅选择等草稿数据
- 这些数据是用户操作过程中的中间状态，不存在篡改获利的可能

**加载体验优化**：
- 如果 orderId 存在，先显示骨架屏/loading 状态
- 不显示旧的 storage 数据（避免先显示假数据再跳变）
- 加载时间预期在 500ms 以内，用户感知不明显

**验证方法**：
1. **正常流程测试**：首页 → 选择教练 → 选择球厅 → 进入确认页 → 确认金额/时长与下单时一致
2. **篡改测试**：
   - 进入确认页后，在控制台手动修改 storage 中的 payAmount 为 1
   - 重新进入确认页
   - 验证显示的金额是正确值，不是被篡改的 1
3. **无 orderId 测试**：直接访问确认页（不带订单），走创建流程正常
4. **网络失败测试**：断网状态下进入确认页，有友好的错误提示和重试按钮

---

### 2.4 Console.log 清理（009）

**严重程度**：HIGH
**工作量**：1 天
**风险等级**：低

**策略：代码清理 + 构建兜底 双保险**

#### 步骤 1：代码层面清理

**必须删除的**：
- 所有带 `🚀` emoji 的调试 log（如 `console.log("🚀 ~ executePayment ~ payParams:", payParams)`）
- 带 `===`、`------`、`----res----` 等标记的调试 log
- `utils/request.js:163` 的全量响应打印：
  ```javascript
  console.log('当前Code:', code, '返回数据:', resultData);
  ```
  这是最大的安全隐患，所有接口返回数据（含用户信息、token、订单、支付参数）都打印到控制台。
- `utils/payment.js` 中打印完整支付参数的 log
- `pages/scan/index.vue` 中的 19 处调试 log
- `App.vue` 中的调试性 log（保留初始化相关的 warn/error）

**保留的**：
- 所有 `console.warn` — 用于非关键异常告警
- 所有 `console.error` — 用于错误处理
- `utils/jpush.js` 中通过 `jpushLog` 封装的日志（已做级别控制）
- `utils/token.js` 中的 `console.warn`（获取/设置失败告警）

#### 步骤 2：构建层面兜底

在生产构建配置中添加 `drop_console: true`，确保即使有遗漏的 console.log，生产打包后也会被移除。

**配置位置**：根据项目构建工具配置：
- 如果是 vite：`vite.config.js` 中 `build.minify: 'terser'` + `terserOptions.compress.drop_console: true`
- 如果是 vue-cli：`vue.config.js` 中配置
- 如果是 HBuilderX：在 manifest.json 或自定义构建脚本中配置

#### 步骤 3：预留 logger 封装（可选）

新增 `utils/logger.js`，区分 debug / info / warn / error 四级：
- 开发环境全部输出
- 生产环境只输出 warn 和 error

但由于 UniApp 多端限制，此步骤可延后，先通过步骤 1 + 步骤 2 解决问题。

**验证方法**：
1. **H5 生产构建**：打开控制台，操作核心流程，确认无 log 输出，warn/error 正常
2. **代码检查**：全局搜索 `console.log`，确认只存在于 uni_modules 中
3. **小程序测试**：微信开发者工具中确认无敏感数据打印

---

### 2.5 注释代码清理（057）

**严重程度**：LOW
**工作量**：0.5 小时
**风险等级**：极低

**删除清单**：
- `App.vue` — 大段注释掉的旧逻辑
- `subpkg/booking/confirm.vue:4-10` — 注释掉的顶部导航 HTML
- `pages/scan/index.vue:253-269` — 注释掉的跳转逻辑
- `utils/photo.js:237-249` — 注释掉的相册权限弹窗 APP-PLUS 分支
- `subpkg/coach/detail.vue:371,375` — 注释掉的 console.log
- 其他文件中单行/小段注释代码，如确认无用一并删除

**原则**：
- 只删除确定无用的注释代码
- 带 TODO / FIXME 标记的注释保留
- 不确定的保留不动

**验证方法**：
- 编译通过
- 核心流程正常
- 视觉无变化

---

### 2.6 死代码清理（060）

**严重程度**：LOW
**工作量**：0.5 小时
**风险等级**：极低

**删除清单**：

| 文件 | 删除原因 | 验证方法 |
|------|---------|---------|
| `utils/storage.js` | 全局搜索无任何文件 import 它 | 全局搜索 `from '@/utils/storage'` 确认无引用 |
| `mixins/themeMixin.js` | 项目已全面迁移到 Composition API + usePageTheme composable，mixin 无人使用 | 全局搜索 `themeMixin` 确认无引用 |

**删除前确认步骤**：
1. 全局搜索文件名确认无引用
2. 搜索导出的函数名确认无引用
3. 确认无误后删除文件

**验证方法**：
- 编译通过
- 主题切换功能正常
- Storage 相关功能正常（因为本来就没用到这个文件）

---

## 三、实施顺序

按风险从低到高排列：

```
第1步：2.6 死代码清理          （0.5 h，最简单，热热身）
第2步：2.5 注释代码清理          （0.5 h）
第3步：2.1 URL Bug 修复          （5 min）
第4步：2.2 空 catch 修复         （0.5 h）
第5步：2.4 Console.log 清理      （1 天，工作量最大，但不改逻辑）
第6步：2.3 Storage 数据校验      （0.5 天，唯一中等风险项，放最后）
```

---

## 四、风险评估

| 改动 | 风险等级 | 原因 | 回滚方案 |
|------|---------|------|---------|
| 2.1 URL Bug 修复 | 极低 | 一行代码，逻辑明确 | 改回原代码 |
| 2.2 空 catch 修复 | 极低 | 只加日志，不改逻辑 | 删除新增代码 |
| 2.3 Storage 校验 | 中 | 增加网络请求，改变数据来源 | 回退到直接读 storage |
| 2.4 Console 清理 | 低 | 只删日志，不影响功能 | git revert |
| 2.5 注释代码清理 | 极低 | 删除无用代码 | git revert |
| 2.6 死代码清理 | 极低 | 删除未使用的文件 | git revert |

---

## 五、验收标准

### 功能验收
- [ ] H5 端正常构建并运行
- [ ] 微信小程序正常构建并运行
- [ ] 核心流程跑通：首页 → 教练列表 → 选球厅 → 确认订单 → 支付 → 订单详情
- [ ] 所有页面 UI 无变化

### 代码质量验收
- [ ] 生产构建后控制台无 console.log 输出
- [ ] 无空 catch 块
- [ ] 确认订单页金额数据从后端获取，不从 storage 直接展示
- [ ] 死代码文件已删除
- [ ] 大段注释代码已清理

### 安全验收
- [ ] 敏感数据（用户信息、支付参数、订单详情）不打印到控制台
- [ ] URL 构造逻辑正确，传 baseUrl 时不会丢失 path

---

## 六、下一阶段

Phase 1 完成并验收通过后，进入 Phase 2：常量统一 + 工具函数收敛。

---

*文档生成时间：2026-09-01*
