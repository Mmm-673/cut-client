# SDD ledger — plan: 地点选择功能实现计划

## Task 1: 修改助教详情页面的立即预约按钮逻辑

**Status:** completed ✅

**Files modified:**
- `/Users/mmm/Jt-code/cut-client/subpkg/coach/detail.vue`

**Changes:**
- 修改 `bookNow` 函数
- 移除服务类型 2/3/4 直接创建订单的代码
- 统一跳转到确认订单页面

**Expected behavior:** 选择任何服务类型都会跳转到确认订单页面，服务类型 2/3/4 会在确认订单页面显示地点选择功能。

## Task 2: 确认订单页面添加地点选择功能

**Status:** completed ✅

**Files modified:**
- `/Users/mmm/Jt-code/cut-client/subpkg/booking/confirm.vue`
- `/Users/mmm/Jt-code/cut-client/api/billiard/venue.js`
- `/Users/mmm/Jt-code/cut-client/api/billiard/order.js`
- `/Users/mmm/Jt-code/cut-client/pages/order/list.vue`
- `/Users/mmm/Jt-code/cut-client/subpkg/order/detail.vue`
- `/Users/mmm/Jt-code/cut-client/utils/request.js`

**Changes:**
- 确认订单页面添加地点选择弹窗
- 集成高德地图地点搜索功能
- 添加省市区三级联动选择
- 修改创建订单API接口
- 订单列表和详情页面显示服务地点信息
- 优化请求拦截器

**Expected behavior:** 服务类型 2/3/4 在确认订单页面会显示地点选择功能，用户需要选择服务地点后才能创建订单。
