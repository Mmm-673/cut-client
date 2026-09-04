<template>
  <view class="tab-bar-container">
    <view class="tab-bar" :style="{ backgroundColor: bgColor }">
      <view class="tab-bar-border" :style="{ backgroundColor: borderColor }"></view>
      <view
        v-for="(item, index) in tabList"
        :key="index"
        class="tab-bar-item"
        @click="switchTab(item.pagePath, index)"
      >
        <image
          :src="current === index ? item.selectedIconPath : item.iconPath"
          class="tab-bar-icon"
        />
        <text
          class="tab-bar-text"
          :style="{ color: current === index ? selectedColor : textColor }"
        >
          {{ item.text }}
        </text>
      </view>
    </view>
    <view class="safe-area-bottom" :style="{ backgroundColor: bgColor }"></view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      current: 0,
      theme: 'dark',
      tabList: [
        {
          pagePath: '/pages/home/index',
          iconPath: '/static/images/tabbar/home.png',
          selectedIconPath: '/static/images/tabbar/home_.png',
          text: '首页'
        },
        {
          pagePath: '/pages/coach/list',
          iconPath: '/static/images/tabbar/ball.png',
          selectedIconPath: '/static/images/tabbar/ball.png',
          text: '预约'
        },
        {
          pagePath: '/pages/mine/index',
          iconPath: '/static/images/tabbar/mine.png',
          selectedIconPath: '/static/images/tabbar/mine_.png',
          text: '我的'
        }
      ]
    }
  },
  computed: {
    bgColor() {
      return this.theme === 'dark' ? '#1E252B' : '#FFFFFF'
    },
    borderColor() {
      return this.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#E5E7EB'
    },
    textColor() {
      return this.theme === 'dark' ? '#666666' : '#6B7280'
    },
    selectedColor() {
      return '#00BB88'
    }
  },
  methods: {
    switchTab(pagePath, index) {
      this.current = index
      uni.switchTab({ url: pagePath })
    },
    updateCurrent() {
      const pages = getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        const route = '/' + currentPage.route
        const index = this.tabList.findIndex(item => item.pagePath === route)
        if (index !== -1) {
          this.current = index
        }
      }
    },
    readTheme() {
      try {
        const storedTheme = uni.getStorageSync('app_theme')
        if (storedTheme === 'dark' || storedTheme === 'light') {
          this.theme = storedTheme
        }
      } catch (e) {
        console.warn('[TabBar] 读取主题失败:', e)
      }
    }
  },
  mounted() {
    this.readTheme()
    this.updateCurrent()

    // 全局更新方法
    uni.$updateCustomTabBar = (index) => {
      if (typeof index === 'number') {
        this.current = index
      } else {
        this.updateCurrent()
      }
    }

    // 监听主题变更
    uni.$on('themeChanged', (theme) => {
      if (theme === 'dark' || theme === 'light') {
        this.theme = theme
      }
    })
  },
  onShow() {
    this.updateCurrent()
  }
}
</script>

<style lang="scss">
.tab-bar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.tab-bar {
  height: 50px;
  display: flex;
  flex-direction: row;
  box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.08);
}

.tab-bar-border {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  height: 1rpx;
}

.tab-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 4rpx;
}

.tab-bar-icon {
  width: 44rpx;
  height: 44rpx;
  margin-bottom: 2rpx;
}

.tab-bar-text {
  font-size: 20rpx;
  font-weight: 500;
  line-height: 1;
}

.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>
