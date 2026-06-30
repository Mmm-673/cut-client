<template>
  <view class="help-page-wrapper">

<!--    <scroll-view-->
<!--        scroll-y-->
<!--        class="help-scroll"-->
<!--        refresher-enabled-->
<!--        :refresher-triggered="refreshing"-->
<!--        @refresherrefresh="onRefresh"-->
<!--    >-->

      <!-- 常见问题 -->
      <view class="section-title">常见问题</view>
      <view class="faq-card">
        <view
            class="faq-item"
            v-for="(item, index) in faqList"
            :key="index"
            @click="toggleFaq(item)"
        >
          <view class="faq-header">
            <text class="faq-question">{{ item.question }}</text>
            <uni-icons :type="item.expanded ? 'top' : 'bottom'" size="20" color="#9CA3AF" />
          </view>
          <view v-if="item.expanded" class="faq-answer">
            <text>{{ item.answer }}</text>
          </view>
        </view>
      </view>

      <!-- 联系客服 -->
      <view class="section-title">联系客服</view>
      <view class="service-card">
        <!-- 二维码 -->
        <view class="qr-section">
          <image class="qr-image" :src="serviceInfo.qrImage" mode="aspectFill" @longpress="saveQrImage"></image>
          <text class="qr-tip">{{ serviceInfo.qrTip }}</text>
        </view>

        <!-- 分割线 -->
        <view class="divider"></view>

        <!-- 电话客服 -->
        <view class="service-item">
          <view class="service-icon" style="background: rgba(0, 187, 136, 0.2)">
            <uni-icons type="chat" size="24" color="#00BB88" />
          </view>
          <view class="service-info">
            <text class="service-title">电话客服</text>
            <text class="service-desc">工作时间：9:00-22:00</text>
          </view>
          <button class="call-btn" @click="makeCall">拨打</button>
        </view>

        <!-- 客服热线 -->
        <view class="service-item">
          <view class="service-icon" style="background: rgba(251, 191, 36, 0.2)">
            <uni-icons type="phone" size="24" color="#FBBF24" />
          </view>
          <view class="service-info">
            <text class="service-title">客服热线</text>
            <text class="service-hotline">{{ serviceInfo.hotline }}</text>
          </view>
        </view>
      </view>

<!--    </scroll-view>-->
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from  "@dcloudio/uni-app"
import { showCallPermissionModal, requestCallPermission, doCallPhone } from '@/utils/call'

// 刷新状态
const refreshing = ref(false)

// 常见问题列表
const faqList = ref([
  {
    question: '如何预约台球陪练？',
    answer: '您可以通过首页或预约Tab选择合适的裁教，点击立即预约后选择球厅和服务时间，确认支付即可完成预约。',
    id: 1,
    expanded: false
  },
  {
    question: '订单取消后退款多久到账？',
    answer: '订单取消后，退款会在1-3个工作日内原路返回到您的支付账户。',
    id: 2,
    expanded: false
  }
])

// 展开收起FAQ
const toggleFaq = (item) => {
  item.expanded = !item.expanded
}

// 联系客服信息
const serviceInfo = ref({
  qrImage: '/static/images/qrImage.png',
  qrTip: '微信扫码添加客服好友，一对一咨询',
  hotline: '15900560488'
})


// 实际拨打电话的函数
const doMakeCall = () => {
  if(!serviceInfo.value.hotline) {
      uni.showToast({ title: '暂无有效联系电话', icon: 'none' })
      return
  }
  // 使用公共函数拨打电话
  doCallPhone(serviceInfo.value.hotline)
}

// 点击拨打按钮
const makeCall = async () => {
  try {
    // 显示电话权限用途说明弹窗
    await showCallPermissionModal()

    // 请求系统拨号权限
    await requestCallPermission()

    // 执行拨打电话
    doMakeCall()
  } catch (err) {
    console.error('处理拨打电话请求失败:', err)
    if (err?.message === 'user_cancelled') {
      // 用户取消了电话权限用途说明，不进行任何操作
      console.log('用户取消了电话权限用途说明')
    } else {
      uni.showToast({
        title: '拨打电话失败，请重试',
        icon: 'none',
        duration: 1500
      })
    }
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  setTimeout(() => {
    refreshing.value = false
    uni.showToast({ title: '刷新成功', icon: 'success' })
  }, 1000)
}

const saveQrImage = () => {
  uni.saveImageToPhotosAlbum({
    filePath: serviceInfo.value.qrImage,
    success: () => {
      uni.showToast({ title: '保存成功', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  })
}

onMounted(() => {
  // 页面加载
})

onShow(() => {
  // 页面显示刷新
})
</script>

<style lang="scss" scoped>
.help-page-wrapper {
  min-height: 100vh;
  background: #121619;
  display: flex;
  flex-direction: column;
  padding-top: 20rpx;
}

/* 顶部导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + constant(safe-area-inset-top));
  padding-top: calc(20rpx + env(safe-area-inset-top));
  .nav-back, .nav-service {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-title {
    color: #fff;
    font-size: 36rpx;
    font-weight: 600;
  }
}

.help-scroll {
  flex: 1;
  width: 100%;
  margin-top: 20rpx;
}

/* 搜索框 */
.search-box {
  margin: 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  .search-input {
    flex: 1;
    color: #fff;
    font-size: 28rpx;
  }
  .search-placeholder {
    color: #9CA3AF;
  }
}

/*  section标题 */
.section-title {
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  margin: 0 30rpx 24rpx;
}

/* 常见问题卡片 */
.faq-card {
  margin: 0 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 0 30rpx;
  .faq-item {
    padding: 30rpx 0;
    border-bottom: 1rpx solid rgba(255,255,255,0.05);
    &:last-child {
      border-bottom: none;
    }
    .faq-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .faq-question {
      color: #fff;
      font-size: 30rpx;
      font-weight: 500;
    }
    .faq-answer {
      margin-top: 20rpx;
      padding: 20rpx;
      background: rgba(0, 187, 136, 0.1);
      border-radius: 12rpx;
      text {
        color: #9CA3AF;
        font-size: 26rpx;
        line-height: 1.6;
      }
    }
  }
}

/* 联系客服卡片 */
.service-card {
  margin: 0 30rpx 30rpx;
  background: #1E252B;
  border-radius: 24rpx;
  padding: 30rpx;
  .qr-section {
    text-align: center;
    .qr-image {
      width: 300rpx;
      height: 300rpx;
      border-radius: 20rpx;
      margin-bottom: 20rpx;
    }
    .qr-tip {
      display: block;
      color: #9CA3AF;
      font-size: 26rpx;
    }
  }
  .divider {
    height: 1rpx;
    background: rgba(255,255,255,0.1);
    margin: 30rpx 0;
  }
  .service-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 30rpx;
    &:last-child {
      margin-bottom: 0;
    }
    .service-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .service-info {
      flex: 1;
      .service-title {
        display: block;
        color: #fff;
        font-size: 32rpx;
        font-weight: 600;
        margin-bottom: 8rpx;
      }
      .service-desc {
        display: block;
        color: #9CA3AF;
        font-size: 26rpx;
      }
      .service-hotline {
        display: block;
        color: #00BB88;
        font-size: 36rpx;
        font-weight: bold;
      }
    }
    .call-btn {
      background: #00BB88;
      color: #fff;
      border-radius: 40rpx;
      //padding: 16rpx 32rpx;
      font-size: 28rpx;
      border: none;
      &::after {
        border: none;
      }
    }
  }
}

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
  width: 100%;
}
</style>
