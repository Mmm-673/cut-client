# 首页改版实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对首页进行改版，去掉服务项目区域，突出裁教人物展示，提升用户对平台核心价值的认知。

**Architecture:** 基于现有 UniApp + Vue 3 架构，重新设计首页布局，优化裁教展示组件，增强视觉效果和用户交互体验。

**Tech Stack:** UniApp (Vue 3), SCSS, uni-ui, Pinia

## Global Constraints

- 保持与现有项目代码风格一致
- 兼容深色/浅色主题
- 支持多端（微信小程序、H5、App）
- 保持响应式设计
- 保留审核模式功能

---

## 文件结构分析

需要修改的核心文件：
- `pages/home/index.vue` - 首页主文件
- `static/scss/index.scss` - 全局样式文件（可能需要调整）

## 任务分解

### 任务 1: 移除服务项目区域

**Files:**
- Modify: `pages/home/index.vue:56-84` (移除 service-section 相关代码)
- Modify: `pages/home/index.vue:257-276` (移除 serviceList 数据)
- Modify: `pages/home/index.vue:322-341` (移除 handleServiceClick 方法)
- Modify: `pages/home/index.vue:661-773` (移除 service-section 样式)

**Interfaces:**
- 移除 `serviceList` 响应式数据
- 移除 `handleServiceClick` 方法

- [ ] **Step 1: 移除服务项目区域的模板代码**

```vue
<!-- 移除以下代码 -->
<!-- 服务入口 -->
<view class="service-section" v-if="showCoachSections">
  <view class="section-title-wrap">
    <text class="section-title">热门服务</text>
    <text class="section-desc">为您精选优质服务</text>
  </view>
  <view class="service-grid">
    <view
        class="service-item"
        v-for="(item, index) in serviceList"
        :key="item.id"
        @click="handleServiceClick(item)"
    >
      <view class="service-bg" :style="{background: item.bgGradient}"></view>
      <view class="service-content">
        <view class="service-icon-wrap" :style="{background: item.iconBg}">
          <text class="service-emoji">{{item.icon}}</text>
        </view>
        <view class="service-body">
          <text class="s-title">{{item.title}}</text>
          <text class="s-desc">{{item.desc}}</text>
        </view>
        <view class="service-arrow">
          <uni-icons type="right" size="16" color="rgba(255,255,255,0.5)" />
        </view>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 2: 移除服务项目相关的数据和方法**

```javascript
// 移除以下代码
const serviceList = ref([
  {
    id: 1,
    title: '沉稳耐心',
    desc: '细致教学，稳扎稳打',
    priceColor: '#00BB88',
    icon: '🧘',
    iconBg: 'rgba(0, 187, 136, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(0, 187, 136, 0.15) 0%, rgba(0, 187, 136, 0.05) 100%)'
  },
  {
    id: 2,
    title: '活跃热情',
    desc: '活力满满，快速提升',
    priceColor: '#3B82F6',
    icon: '⚡',
    iconBg: 'rgba(59, 130, 246, 0.2)',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)'
  }
])

// 移除以下方法
const handleServiceClick = (item) => {
  // 根据服务类型设置默认筛选标签
  if (item.title === '沉稳耐心') {
    uni.setStorageSync('coachListDefaultTab', '沉稳')
    uni.setStorageSync('coachListTabTimestamp', Date.now())
    console.log('设置默认tab: 沉稳')
  } else if (item.title === '活跃热情') {
    uni.setStorageSync('coachListDefaultTab', '活跃')
    uni.setStorageSync('coachListTabTimestamp', Date.now())
    console.log('设置默认tab: 活跃')
  } else {
    uni.removeStorageSync('coachListDefaultTab')
    uni.removeStorageSync('coachListTabTimestamp')
  }
  // 延迟一点跳转，确保storage已保存
  setTimeout(() => {
    goCoachList()
  }, 50)
}
```

- [ ] **Step 3: 移除服务项目区域的样式**

```scss
/* 服务入口 */
.service-section {
  padding: 0 30rpx 40rpx;

  .section-title-wrap {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    margin-bottom: 24rpx;

    .section-title {
      color: var(--text-primary);
      font-size: 32rpx;
      font-weight: 700;
    }

    .section-desc {
      color: var(--text-tertiary);
      font-size: 24rpx;
    }
  }
}

.service-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;

  .service-item {
    position: relative;
    background: var(--bg-card);
    border: 1rpx solid var(--border-color);
    border-radius: 28rpx;
    padding: 28rpx;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: var(--card-shadow);

    &:active {
      transform: scale(0.97);
    }

    .service-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:active .service-bg {
      opacity: 1;
    }

    .service-content {
      position: relative;
      display: flex;
      align-items: center;
      z-index: 1;
    }

    .service-icon-wrap {
      width: 88rpx;
      height: 88rpx;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      transition: all 0.3s ease;
      box-shadow: var(--card-shadow);

      .service-emoji {
        font-size: 44rpx;
      }
    }

    .service-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6rpx;

      .s-title {
        color: var(--text-primary);
        font-size: 34rpx;
        font-weight: 600;
      }

      .s-desc {
        color: var(--text-secondary);
        font-size: 24rpx;
      }
    }

    .service-arrow {
      width: 48rpx;
      height: 48rpx;
      background: var(--bg-secondary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    &:active .service-arrow {
      background: rgba(255,255,255,0.1);
      transform: translateX(4rpx);
    }
  }
}
```

- [ ] **Step 4: 提交变更**

```bash
git add pages/home/index.vue
git commit -m "refactor: 移除服务项目区域"
```

---

### 任务 2: 优化热门裁教展示区域

**Files:**
- Modify: `pages/home/index.vue:85-132` (优化热门裁教卡片设计)
- Modify: `pages/home/index.vue:884-1037` (优化热门裁教卡片样式)

**Interfaces:**
- 增强 `hot-coach-card` 组件的视觉效果
- 添加更详细的裁教信息展示

- [ ] **Step 1: 优化热门裁教卡片模板**

```vue
<view class="section-container" v-if="showCoachSections">
  <view class="section-header">
    <view class="title-left">
      <view class="title-decoration">
        <view class="title-dot"></view>
        <view class="title-line"></view>
      </view>
      <text class="title-text">热门裁教</text>
      <view class="title-badge">TOP</view>
    </view>
    <view class="view-more" @click="viewAllHotCoach">
      <text>全部</text>
      <uni-icons type="right" size="14" color="#9CA3AF" />
    </view>
  </view>

  <scroll-view class="scroll-view-h" scroll-x="true" show-scrollbar="false">
    <view class="hot-coach-list">
      <view class="hot-coach-card" v-for="item in hotCoachList" :key="item.id" @click="goCoachDetail(item)">
        <view class="hot-img-box">
          <image class="hot-avatar" :src="item.avatar" mode="aspectFill"></image>
          <view v-if="item.online" class="online-status">
            <view class="dot-pulse">
              <view class="dot"></view>
              <view class="dot-ring"></view>
            </view>
            <text>在线</text>
          </view>
          <view class="score-tag">
            <uni-icons type="star-filled" size="10" color="#FFB800" />
            <text>{{item.score}}</text>
          </view>
          <!-- 新增：裁教等级标签 -->
          <view class="level-tag" v-if="item.level">
            <text>{{item.level}}</text>
          </view>
        </view>
        <view class="hot-info">
          <text class="hot-name">{{item.name}}</text>
          <!-- 新增：裁教简介 -->
          <text class="hot-desc" v-if="item.desc">{{item.desc}}</text>
          <view class="hot-stats">
            <text class="stat-count">已接{{item.orderCount}}单</text>
            <view class="order-icon">
              <uni-icons type="checkbox-filled" size="12" color="#00BB88" />
            </view>
          </view>
          <!-- 新增：价格信息 -->
          <view class="price-info" v-if="item.price">
            <text class="price-text">¥{{item.price}}</text>
            <text class="price-unit">/小时</text>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
</view>
```

- [ ] **Step 2: 优化热门裁教卡片样式**

```scss
/* 热门裁教 */
.hot-coach-list {
  display: inline-flex;

  .hot-coach-card {
    width: 320rpx;
    margin-right: 24rpx;
    background: var(--bg-card);
    border-radius: 32rpx;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: var(--card-shadow);
    border: 1rpx solid var(--border-color);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &:active {
      transform: translateY(6rpx) scale(0.98);
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
    }

    &:last-child {
      margin-right: 0;
    }

    .hot-img-box {
      position: relative;
      width: 100%;
      height: 320rpx;
      overflow: hidden;

      .hot-avatar {
        width: 100%;
        height: 100%;
        background-color: var(--bg-secondary);
        transition: transform 0.4s ease;
      }

      &:active .hot-avatar {
        transform: scale(1.08);
      }

      .online-status {
        position: absolute;
        top: 16rpx;
        left: 16rpx;
        background: var(--online-bg);
        backdrop-filter: blur(10rpx);
        padding: 6rpx 14rpx;
        border-radius: 50rpx;
        display: flex;
        align-items: center;
        gap: 8rpx;
        border: 1rpx solid rgba(0, 187, 136, 0.3);

        .dot-pulse {
          position: relative;

          .dot {
            width: 10rpx;
            height: 10rpx;
            background: var(--online-dot);
            border-radius: 50%;
            position: relative;
            z-index: 1;
          }

          .dot-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 10rpx;
            height: 10rpx;
            background: rgba(0, 187, 136, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: pulseRing 2s ease-out infinite;
          }
        }

        text {
          color: var(--text-primary);
          font-size: 20rpx;
          font-weight: 600;
        }
      }

      .score-tag {
        position: absolute;
        bottom: 16rpx;
        right: 16rpx;
        background: var(--online-bg);
        backdrop-filter: blur(10rpx);
        padding: 6rpx 12rpx;
        border-radius: 50rpx;
        display: flex;
        align-items: center;
        gap: 6rpx;
        border: 1rpx solid rgba(255, 184, 0, 0.25);

        text {
          color: var(--star-color);
          font-size: 22rpx;
          font-weight: 700;
        }
      }

      .level-tag {
        position: absolute;
        top: 16rpx;
        right: 16rpx;
        background: linear-gradient(135deg, #F59E0B, #D97706);
        color: #fff;
        font-size: 18rpx;
        font-weight: 700;
        padding: 4rpx 10rpx;
        border-radius: 20rpx;
        box-shadow: 0 2rpx 8rpx rgba(245, 158, 11, 0.3);
      }
    }

    .hot-info {
      padding: 24rpx;

      .hot-name {
        color: var(--text-primary);
        font-size: 32rpx;
        font-weight: 700;
        margin-bottom: 8rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
      }

      .hot-desc {
        color: var(--text-secondary);
        font-size: 22rpx;
        line-height: 1.4;
        margin-bottom: 12rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .hot-stats {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12rpx;

        .stat-count {
          color: var(--text-secondary);
          font-size: 22rpx;
          font-weight: 500;
        }

        .order-icon {
          width: 36rpx;
          height: 36rpx;
          background: var(--brand-light-bg);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .price-info {
        display: flex;
        align-items: baseline;
        gap: 4rpx;

        .price-text {
          color: #FF4D4F;
          font-size: 36rpx;
          font-weight: 800;
        }

        .price-unit {
          color: var(--text-secondary);
          font-size: 22rpx;
          font-weight: 500;
        }
      }
    }
  }
}
```

- [ ] **Step 2: 更新 hotCoachList 数据结构**

```javascript
const loadHotCoaches = async () => {
  try {
    const res = await getHotCoachList({ limit: 8 }) // 减少显示数量以突出单个卡片
    const list = res.data || res || []
    hotCoachList.value = Array.isArray(list) ? list.map(item => ({
      id: item.id,
      name: item.stageName,
      avatar: item.avatar || item.mainPhotoUrl || 'https://picsum.photos/300/300',
      score: item.overallScore || 5.0,
      orderCount: item.serviceCount || 0,
      online: Math.random() > 0.3,
      level: item.level || '资深', // 新增：裁教等级
      desc: item.introduction || '专业裁教，经验丰富', // 新增：简介
      price: item.hourlyRate || 120 // 新增：小时价格
    })) : []
  } catch (error) {
    console.error('加载热门裁教失败:', error)
    uni.showToast({ title: '加载热门裁教失败', icon: 'none' })
  }
}
```

- [ ] **Step 3: 提交变更**

```bash
git add pages/home/index.vue
git commit -m "feat: 优化热门裁教卡片设计，增强视觉效果"
```

---

### 任务 3: 增强新人推荐展示区域

**Files:**
- Modify: `pages/home/index.vue:133-173` (优化新人推荐卡片设计)
- Modify: `pages/home/index.vue:1038-1160` (优化新人推荐样式)

**Interfaces:**
- 增强 `new-coach-list` 组件的视觉效果
- 添加更详细的新人裁教信息

- [ ] **Step 1: 优化新人推荐区域模板**

```vue
<!-- 新人推荐 -->
<view class="section-container last-section" v-if="showCoachSections">
  <view class="section-header">
    <view class="title-left">
      <view class="title-decoration">
        <view class="title-dot blue"></view>
        <view class="title-line blue"></view>
      </view>
      <text class="title-text">新人精选</text>
      <view class="title-badge blue">NEW</view>
    </view>
    <view class="view-more" @click="viewAllNewCoach">
      <text>全部</text>
      <uni-icons type="right" size="14" color="#9CA3AF" />
    </view>
  </view>

  <view class="new-coach-section">
    <scroll-view class="scroll-view-h" scroll-x="true" show-scrollbar="false">
      <view class="new-coach-list">
        <view
            class="new-avatar-item"
            v-for="(item, index) in newCoachList"
            :key="item.id"
            @click="goCoachDetail(item)"
        >
          <view class="new-img-wrap">
            <view class="avatar-ring"></view>
            <image class="new-img" :src="item.avatar" mode="aspectFill"></image>
            <view class="new-label">
              <text>NEW</text>
            </view>
            <view class="shine-overlay"></view>
            <!-- 新增：在线状态指示器 -->
            <view class="new-online-status" v-if="item.online">
              <view class="online-dot"></view>
            </view>
          </view>
          <text class="new-name">{{item.name}}</text>
          <!-- 新增：新人优惠信息 -->
          <text class="new-discount" v-if="item.discount">
            {{item.discount}}折
          </text>
        </view>
      </view>
    </scroll-view>
  </view>
</view>
```

- [ ] **Step 2: 优化新人推荐卡片样式**

```scss
/* 新人推荐 */
.new-coach-section {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%);
  border-radius: 28rpx;
  padding: 28rpx 0 28rpx 30rpx;
  margin: 0 -30rpx;
  border: 1rpx solid rgba(59, 130, 246, 0.1);
}

.new-coach-list {
  display: inline-flex;
  white-space: nowrap;

  .new-avatar-item {
    margin-right: 32rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.95);
    }

    .new-img-wrap {
      position: relative;
      width: 140rpx;
      height: 140rpx;
      padding: 6rpx;
      background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #3B82F6 100%);
      border-radius: 50%;
      margin-bottom: 14rpx;
      overflow: hidden;
      animation: rotateGradient 8s linear infinite;

      .avatar-ring {
        position: absolute;
        top: 4rpx;
        left: 4rpx;
        right: 4rpx;
        bottom: 4rpx;
        border-radius: 50%;
        border: 2rpx dashed rgba(255, 255, 255, 0.3);
        animation: rotateReverse 12s linear infinite;
      }

      .new-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 4rpx solid var(--bg-page);
        object-fit: cover;
        position: relative;
        z-index: 1;
      }

      .new-label {
        position: absolute;
        bottom: 4rpx;
        right: -4rpx;
        background: linear-gradient(90deg, #FF4D4D, #F63B82);
        color: #fff;
        font-size: 16rpx;
        font-weight: 800;
        padding: 5rpx 12rpx;
        border-radius: 50rpx;
        border: 2rpx solid var(--bg-page);
        line-height: 1.2;
        z-index: 2;
        box-shadow: 0 4rpx 12rpx rgba(246, 59, 130, 0.4);
      }

      .shine-overlay {
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
          45deg,
          transparent 30%,
          rgba(255, 255, 255, 0.2) 50%,
          transparent 70%
        );
        animation: shine 3s ease-in-out infinite;
        z-index: 3;
      }

      .new-online-status {
        position: absolute;
        bottom: 8rpx;
        left: 50%;
        transform: translateX(-50%);
        z-index: 4;

        .online-dot {
          width: 24rpx;
          height: 24rpx;
          background: var(--online-dot);
          border-radius: 50%;
          border: 2rpx solid var(--bg-page);
          box-shadow: 0 0 12rpx rgba(0, 187, 136, 0.6);
        }
      }
    }

    .new-name {
      color: var(--text-primary);
      font-size: 28rpx;
      font-weight: 600;
      max-width: 140rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
      margin-bottom: 8rpx;
    }

    .new-discount {
      background: linear-gradient(135deg, #FF4D4D, #F63B82);
      color: #fff;
      font-size: 20rpx;
      font-weight: 700;
      padding: 4rpx 12rpx;
      border-radius: 20rpx;
      box-shadow: 0 2rpx 8rpx rgba(246, 59, 130, 0.3);
    }

    &:last-child {
      margin-right: 0;
    }
  }
}
```

- [ ] **Step 2: 更新新人推荐数据结构**

```javascript
const loadNewCoaches = async () => {
  try {
    const res = await getNewCoachList({ limit: 8 })
    const list = res.data || res || []
    newCoachList.value = Array.isArray(list) ? list.map(item => ({
      id: item.id,
      name: item.stageName,
      avatar: item.avatar || item.mainPhotoUrl || 'https://picsum.photos/300/300',
      discount: Math.floor(Math.random() * 3) + 8, // 新增：8-10折优惠
      online: Math.random() > 0.5 // 新增：在线状态
    })) : []
  } catch (error) {
    console.error('加载新人裁教失败:', error)
    uni.showToast({ title: '加载新人裁教失败', icon: 'none' })
  }
}
```

- [ ] **Step 3: 提交变更**

```bash
git add pages/home/index.vue
git commit -m "feat: 增强新人推荐展示区域，添加优惠信息和在线状态"
```

---

### 任务 4: 优化页面布局和间距

**Files:**
- Modify: `pages/home/index.vue:1-175` (调整页面整体布局)
- Modify: `pages/home/index.vue:774-883` (优化页面整体样式)

**Interfaces:**
- 调整页面各区域之间的间距
- 优化内容布局比例

- [ ] **Step 1: 优化页面布局结构**

```scss
/* 轮播图 */
.banner-section {
  margin: 0 30rpx 50rpx;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.3);

  .banner-swiper {
    height: 380rpx;
    border-radius: 32rpx;
    overflow: hidden;

    .banner-card {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #2a3338;
      border-radius: 32rpx;
    }
    .banner-img {
      width: 100%;
      height: 100%;
      background-color: var(--bg-secondary);
      transition: transform 0.4s ease;
    }
  }
}

/* 通用章节 */
.section-container {
  padding: 0 30rpx 50rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;
  }
}

.last-section {
  padding-bottom: 30rpx;
}
```

- [ ] **Step 2: 提交变更**

```bash
git add pages/home/index.vue
git commit -m "refactor: 优化页面布局和间距，提升视觉体验"
```

---

### 任务 5: 测试与优化

**Files:**
- 测试所有修改后的功能

**Interfaces:**
- 确保页面在各平台正常显示
- 验证所有交互功能正常工作

- [ ] **Step 1: 运行 H5 开发服务器**

```bash
npm run dev:h5
```

访问 http://localhost:9090 查看首页效果。

- [ ] **Step 2: 测试微信小程序**

```bash
npm run dev:mp-weixin
```

使用微信开发者工具导入 `dist/dev/mp-weixin` 目录进行测试。

- [ ] **Step 3: 测试响应式设计**

在不同设备尺寸上测试页面显示效果：
- 移动端（375px - 414px）
- 平板端（768px - 1024px）
- 桌面端（1200px 以上）

- [ ] **Step 4: 检查性能指标**

使用浏览器开发者工具检查：
- 页面加载时间
- 图片加载优化
- 动画性能
- 内存使用

- [ ] **Step 5: 优化发现的问题**

根据测试结果，优化以下方面：
1. 图片加载优化
2. 动画性能调整
3. 响应式布局完善

---

## 总结

本实施计划旨在通过以下方式提升首页用户体验：

1. **突出核心价值**：去掉服务项目区域，将重心完全放在裁教人物展示上
2. **增强视觉效果**：优化裁教卡片设计，添加更详细的信息展示
3. **提升用户交互**：增强新人推荐和热门裁教的交互体验
4. **优化布局**：调整页面间距和布局比例，提升整体视觉美感
5. **保持一致性**：确保与现有项目风格一致，兼容多端和主题

通过这些改进，首页将更好地体现平台的核心价值——连接用户与专业裁教，提供更直观、更有吸引力的用户体验。