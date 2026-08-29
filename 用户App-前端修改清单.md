# 用户 App 前端修改清单

> 来源文档：`2026-08-26-requirements-1-7-frontend-guide.md`
> 测试环境接口前缀：`https://www.qiulem.com/test/app-api`
> 请求头：`tenant-id: 122`、`Authorization: Bearer <token>`

---

## 一、新增：通知中心（需求 2）

### 1.1 页面与入口
- 在 App 合适入口（首页 / 我的 / 消息中心）增加「通知」入口，展示未读数角标。
- 通知列表页（全部 / 未读 / 已读 三 Tab 筛选）。
- 通知详情页。

### 1.2 接口

前缀：`/app-api/billiard/notification-center`

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/page?pageNo=1&pageSize=20&readStatus=0` | 分页；`readStatus` 不传=全部、0=未读、1=已读 |
| GET | `/get?id=1001` | 详情，**不会自动改为已读** |
| GET | `/unread-count` | 未读数（用于角标） |
| POST | `/read` | Body `{"id":1001}`，单条已读，幂等 |
| POST | `/read-all` | 全部已读，无请求体 |

### 1.3 通知响应项

```ts
interface NotificationItem {
  id: number
  type: number          // 1重大通知、2公告、3活动、4版本更新；5为系统自动打赏播报（用户端一般不可见）
  title: string
  summary: string
  content: string
  coverUrl?: string
  actionType: number    // 0无、1通知详情、2App路由、3HTTPS页面、4应用更新
  actionValue?: string
  actionParams?: string // JSON 字符串，按业务类型二次解析
  sourceType: number    // 1运营创建，2系统自动创建
  bizType?: string
  bizId?: string
  targetCity?: string
  topFlag: boolean
  publishTime: string
  readStatus: 0 | 1
  readTime?: string
}
```

### 1.4 客户端要求
- 首页或「我的」使用 `/unread-count` 展示角标。
- 列表支持全部、未读、已读筛选。
- 打开详情后**显式调用** `/read`，再刷新角标；不要把 GET 详情当作自动已读。
- Push 点击只携带通知 ID，再请求详情获取正文；不要依赖 Push 中保存完整内容。
- 下拉刷新 / 分页加载；`topFlag` 置顶通知按后台顺序排在前面。

---

## 二、新增：助教详情视频播放器（需求 3）

### 2.1 接口

```http
GET /app-api/billiard/coach/get?id=1001
```

原助教详情响应中新增字段：

| 字段 | 说明 |
|---|---|
| `videoUrl` | 视频地址，空字符串表示无视频 |
| `videoFileName` | 文件名 |
| `videoFileSize` | 文件大小（字节） |
| `videoMimeType` | MIME 类型，`video/mp4` |

### 2.2 展示规则
- `videoUrl` 非空：在助教详情顶部/资料区展示播放器。
- `videoUrl` 为空：**隐藏整个视频区域**，不要留占位。
- **不默认自动播放**；用户手动点击播放。
- 页面离开或 App 进入后台时**释放播放器**，避免后台继续播放或耗电。
- 播放失败不影响助教资料其他内容和下单流程（降级处理：toast 提示 + 隐藏播放器）。
- 视频最大 50 MiB，建议使用标准 MP4（H.264 + AAC）。

---

## 三、移除：开票入口（需求 7，反向）

### 3.1 背景
- 需求 7「消费发票」后端**未开发**，暂无任何 `billiard` 开票接口。
- 正式上线前用户 App **不得**有真实开票入口或调用不存在的接口。

### 3.2 修改
- 移除/隐藏 App 中所有开票入口（订单详情「开发票」、钱包/我的「发票」等）。
- 如产品必须保留占位，仅展示「功能建设中，敬请期待」静态提示，**不得发起任何 HTTP 请求**。
- 待后端完成发票抬头、可开票金额、申请、审核/开具、状态流转后再接入。

---

## 四、通用约定
- 金额字段单位均为「分」，展示时除以 100 保留两位小数。
- 日期时间使用 `yyyy-MM-dd HH:mm:ss` 或 ISO `yyyy-MM-ddTHH:mm:ss` 格式。
- HTTP 客户端已统一拼接 `/app-api` 前缀时，业务代码只写 `/billiard/**`。
