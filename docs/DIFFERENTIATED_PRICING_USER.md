# 助教服务差异化单价 · 用户端前端改造方案

> **版本**：v1.0
> **日期**：2026-08-25
> **适用端**：用户 App（cut-client）
> **后端状态**：本地开发与回归完成，需先完成测试数据库迁移和测试环境发布后再联调
> **测试环境**：`https://www.qiulem.com/test`

---

## 一、接入目标

四种服务的计价规则调整为：

| 服务类型 | 名称 | 计价方式 | 展示单位 |
|---:|---|---|---|
| 1 | 台球陪练 | 按小时价和服务时长计费 | 元/小时 |
| 2 | 达人带路（潮玩领航） | 按单次固定价计费 | 元/次 |
| 3 | 酒文化讲解（酒艺品鉴） | 按单次固定价计费 | 元/次 |
| 4 | 影视讲解分享（影视赏析） | 按单次固定价计费 | 元/次 |

**核心原则**：
- 所有后端金额字段均为整数"分"，前端展示时除以 `100`
- 用户 App **不得自行计算或提交订单价格**，最终金额以后端返回为准
- 历史订单按订单自身的 `pricingMode` 展示，不根据当前 App 版本推断

---

## 二、版本兼容规则

| `client-version` 请求头 | 类型 1 | 类型 2/3/4 |
|---|---|---|
| `> 1.0.1`（如 `1.0.2`） | 小时价 | 单次固定价 |
| `<= 1.0.1` | 小时价 | 保持旧小时价逻辑 |
| 缺失或非法 | 小时价 | 保持旧小时价逻辑 |

**注意**：
1. 比较规则是**严格大于**，`1.0.1` 仍是旧逻辑
2. 新版 App 的 `client-version` 已在 `config.js` 中配置为 `1.0.2`，`utils/request.js` 自动携带，**无需额外改动**
3. 版本只在**创建订单时**决定订单计价方式，订单创建后以 `pricingMode` 字段为准

---

## 三、pricingMode 两种数据类型

| 出现场景 | 字段类型 | 值 |
|---|---|---|
| `serviceItemList[]` 服务目录 | 字符串 | `HOURLY`、`FIXED` |
| 订单列表、订单详情、计时状态 | 整数 | `1=HOURLY`、`2=FIXED` |

**⚠️ 不要将服务目录字符串和订单数字编码直接比较，必须通过统一工具函数判断。**

---

## 四、新增工具模块

### `utils/pricing.js`

集中管理价格模式相关常量和工具函数：

```js
// 常量
ORDER_PRICING_MODE.HOURLY = 1
ORDER_PRICING_MODE.FIXED = 2
CATALOG_PRICING_MODE.HOURLY = 'HOURLY'
CATALOG_PRICING_MODE.FIXED = 'FIXED'

// 工具函数
isFixedPricing(mode)       // 是否固定价（兼容字符串和整数）
isHourlyPricing(mode)      // 是否小时价
formatServicePrice(item)   // 格式化价格+单位，如 "68.00 元/次"
formatPriceValue(price)    // 分 → 元，保留两位小数
canBookService(item)       // 服务是否可下单（FIXED 且 price=null 不可约）
getPriceUnit(item)         // 获取价格单位
```

---

## 五、服务目录字段变化

`serviceItemList[]` 新增字段：

| 字段 | 类型 | 含义 |
|---|---|---|
| `serviceType` | integer | `1/2/3/4` |
| `serviceName` | string | 服务名称 |
| `hourlyPrice` | integer | 旧版兼容字段，单位分/小时（**新版不再用它展示价格**） |
| `price` | integer/null | 当前服务目录价，单位分；**新版以此字段为准** |
| `pricingMode` | string | `HOURLY` 或 `FIXED` |
| `priceUnit` | string | `小时` 或 `次` |

### 展示规则

```
展示价格 = price / 100
展示文案 = 展示价格 + " 元/" + priceUnit
```

- **HOURLY**：`¥xxx /小时起`（保留"起"字）
- **FIXED**：`¥xxx /次`（不带"起"字）

### FIXED 且 price=null 的处理

- 禁用选择按钮，显示"暂不可预约"
- **不允许**用 `hourlyPrice` 兜底
- 后端兜底错误码：`1010000350`

### 涉及接口

| 方法 | 接口 |
|---|---|
| GET | `/app-api/billiard/coach/list` |
| GET | `/app-api/billiard/coach/new-list` |
| GET | `/app-api/billiard/coach/hot-list` |
| GET | `/app-api/billiard/coach/favorite-page` |
| GET | `/app-api/billiard/coach/get?id={coachId}` |
| GET | `/app-api/billiard/home` |

---

## 六、各页面改造详情

### 6.1 助教详情页 `subpkg/coach/detail.vue` ⭐核心

**改动点**：

1. **服务项目列表**：
   - 价格展示改用 `price` + `priceUnit` 字段，不再用 `hourlyPrice * hourTime` 计算
   - 移除本地 `serviceBaseList` 中的 `hourTime` 起售时长配置（FIXED 不需要）
   - FIXED 且 `price=null` 的服务：选择按钮置灰，显示"暂不可预约"，点击不选中

2. **底部操作栏**：
   - 价格展示：`price` + 单位；HOURLY 带"起"，FIXED 不带"起"
   - `canBookService` 为 false 时，"立即预约"按钮置灰禁用

3. **立即预约 `bookNow`**：
   - HOURLY（类型1 或旧版本类型 2/3/4）：保持原逻辑，设置 `serviceDuration`、`quantity`
   - FIXED（类型 2/3/4）：不设置 `serviceDuration`、`quantity`
   - 跳转到 hall.vue / confirm.vue 时携带的数据结构相应调整

4. **类型 2/3/4 跳转路径**：保持不变（类型1 跳 hall.vue 选球厅，类型 2/3/4 直接跳 confirm.vue）

---

### 6.2 确认订单页 `subpkg/booking/confirm.vue`

**改动点**：

1. **预约信息区**：
   - 服务时长行：FIXED 订单隐藏整行
   - 服务名称展示：FIXED 显示服务名，不显示时长

2. **费用明细**：
   - HOURLY：`{服务名称} x{quantity}小时` + 金额
   - FIXED：`{服务名称} x1次` + 金额

3. **创建订单参数**：
   - HOURLY：照常传 `serviceDuration`、`quantity`
   - FIXED：不传 `serviceDuration`、`quantity`
   - 其他字段（coachId、serviceType、bookingTime、地点信息、serviceItemId）不变

4. **金额展示**：保持使用后端返回的快照字段（`serviceAmount`、`payAmount`、`totalAmount`），不重新计算

---

### 6.3 订单详情页 `subpkg/order/detail.vue`

**改动点**：

1. **预约时长行**：FIXED（`pricingMode=2`）隐藏

2. **计时区域**（进行中状态）：
   - HOURLY：保持原逻辑 — 倒计时、剩余时间、进度条
   - FIXED：只展示已服务时长 `elapsedSeconds`，不展示剩余时间/预计结束时间，不计算进度百分比（避免 `plannedDuration=0` 除零）

3. **加钟按钮**：FIXED 必须隐藏

4. **加钟弹窗**：FIXED 不触发

5. **金额展示**：保持使用后端快照字段，不变

---

### 6.4 助教列表页 `pages/coach/list.vue`

**改动点**：
- 价格展示：优先用助教顶层 `price` 字段 + 判断单位
- 单位根据 `pricingMode` 或列表首个服务的 `priceUnit` 展示
- 保底兼容：如果没有新字段，回退到 `hourlyPrice` + `/小时`

---

### 6.5 首页 `pages/home/index.vue`

**改动点**：
- 热门裁教卡片价格展示适配新字段 `price`
- 新人列表不展示价格，无需改动

---

### 6.6 收藏列表 `subpkg/mine/favorites.vue`

**改动点**：
- 价格展示适配：`price` + 单位，保底 `hourlyPrice` + `/小时`

---

### 6.7 订单列表页 `pages/order/list.vue`

**改动点**：无（保持现状，时长展示暂不调整）

---

### 6.8 球厅选择页 `subpkg/booking/hall.vue`

**改动点**：无（仅类型1使用此页，类型1始终是 HOURLY 模式）

---

## 七、API 注释更新

以下文件的 JSDoc 注释需要更新，标注新增字段：

| 文件 | 更新内容 |
|---|---|
| `api/billiard/coach.js` | `serviceItemList[]` 新增字段：price、pricingMode、priceUnit、serviceName |
| `api/billiard/order.js` | 订单响应新增 `pricingMode`（整数） |
| `api/billiard/timer.js` | 计时状态新增 `pricingMode`（整数） |

---

## 八、改动文件汇总

| 优先级 | 文件 | 改动量 | 说明 |
|---|---|---|---|
| P0 | `utils/pricing.js`（新增） | 小 | 价格模式常量和工具函数 |
| P0 | `subpkg/coach/detail.vue` | 大 | 服务目录展示、预约入口、FIXED 逻辑 |
| P0 | `subpkg/booking/confirm.vue` | 中 | 下单参数、时长展示、费用明细 |
| P0 | `subpkg/order/detail.vue` | 中 | 时长隐藏、计时适配、加钟隐藏 |
| P1 | `pages/coach/list.vue` | 小 | 列表价格单位适配 |
| P1 | `pages/home/index.vue` | 小 | 热门助教价格适配 |
| P1 | `subpkg/mine/favorites.vue` | 小 | 收藏列表价格适配 |
| P2 | `api/billiard/coach.js` | 小 | JSDoc 更新 |
| P2 | `api/billiard/order.js` | 小 | JSDoc 更新 |
| P2 | `api/billiard/timer.js` | 小 | JSDoc 更新 |
| P2 | `components/ds-coach-card/ds-coach-card.vue` | 小 | 组件价格适配（视使用情况） |

---

## 九、验收清单

- [ ] 类型 2/3/4 服务展示"元/次"，下单页不展示时长和数量
- [ ] 类型 2/3/4 下单不传 `serviceDuration`、`quantity` 也能成功
- [ ] 类型 1 仍展示"元/小时起"，下单、加钟行为不变
- [ ] `price=null` 的固定价服务不可点击下单，提示"暂不可预约"
- [ ] 固定价订单详情不显示预约时长、倒计时、剩余时间和加钟入口
- [ ] 历史类型 2/3/4 小时价订单（pricingMode=1）仍正常显示和加钟
- [ ] 订单金额直接使用后端快照字段，不读取助教当前价格重算
- [ ] 助教列表、首页热门、收藏列表价格展示正确

---

## 十、联调前置条件

前端开始联调前，后端发布人必须确认：

1. 差异化单价迁移已在测试库 `ruoyi-vue-dev` 执行成功
2. 测试后端 `48081` 健康检查通过
3. 参与测试的助教已勾选目标服务，并补齐对应固定价
4. `/test/app-api/**`、`/test/coach-api/**`、`/test/admin-api/**` 均已指向测试后端
5. 测试请求统一使用 `tenant-id: 122`，且不要复用生产登录令牌

> 若第 3 项未完成，后端拒绝固定价下单属于正确行为，不是前端故障。
