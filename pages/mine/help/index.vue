<template>
  <view class="help-wrapper">
    <!-- 问题列表 -->
    <view class="help-section">
      <view class="help-card">
        <view class="card-title">
          <text class="title-icon">💡</text>
          <text class="title-text">常见问题</text>
        </view>

        <view class="faq-list">
          <view
            class="faq-item"
            v-for="(item, index) in faqList"
            :key="index"
            @click="toggleFaq(index)"
          >
            <view class="faq-question">
              <text class="question-text">{{ item.title }}</text>
              <uni-icons
                :type="item.expanded ? 'top' : 'bottom'"
                size="20"
                color="#9CA3AF"
              />
            </view>
            <view v-if="item.expanded" class="faq-answer">
              <text class="answer-text">{{ item.content }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 联系客服 -->
    <view class="contact-section">
      <view class="contact-card">
        <text class="contact-text">还有其他问题？</text>
        <button class="contact-btn" @click="contactService">联系客服</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const faqList = ref([
  {
    title: '如何预约助教？',
    content: '在首页选择助教，选择服务类型和时间，确认预约后完成支付即可。',
    expanded: false
  },
  {
    title: '如何取消订单？',
    content: '在订单详情页点击"取消订单"按钮即可取消。待服务状态的订单可以取消。',
    expanded: false
  },
  {
    title: '如何退出登录？',
    content: '请点击[我的] - [应用设置] - [退出登录]即可退出登录。',
    expanded: false
  },
  {
    title: '如何修改用户头像？',
    content: '请点击[我的] - 点击头像区域 - 选择图片提交即可更换用户头像。',
    expanded: false
  },
  {
    title: '如何修改登录密码？',
    content: '请点击[我的] - [应用设置] - [修改密码]即可修改登录密码。',
    expanded: false
  }
])

const toggleFaq = (index) => {
  faqList.value[index].expanded = !faqList.value[index].expanded
}

const contactService = () => {
  uni.showToast({ title: '联系客服功能开发中', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.help-wrapper {
  min-height: 100vh;
  background: #121619;
  padding-bottom: 40rpx;
}

/* 问题列表 */
.help-section {
  padding: 20rpx 30rpx;
  .help-card {
    background: #1E252B;
    border-radius: 24rpx;
    padding: 30rpx;
    .card-title {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 30rpx;
      .title-icon {
        font-size: 36rpx;
      }
      .title-text {
        color: #fff;
        font-size: 32rpx;
        font-weight: 600;
      }
    }
    .faq-list {
      .faq-item {
        padding: 24rpx 0;
        border-bottom: 1rpx solid rgba(255,255,255,0.05);
        &:last-child {
          border-bottom: none;
        }
        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          .question-text {
            color: #fff;
            font-size: 28rpx;
            flex: 1;
          }
        }
        .faq-answer {
          margin-top: 20rpx;
          padding: 20rpx;
          background: #2A3138;
          border-radius: 12rpx;
          .answer-text {
            color: #9CA3AF;
            font-size: 26rpx;
            line-height: 1.6;
          }
        }
      }
    }
  }
}

/* 联系客服 */
.contact-section {
  padding: 20rpx 30rpx;
  .contact-card {
    background: #1E252B;
    border-radius: 24rpx;
    padding: 40rpx 30rpx;
    text-align: center;
    .contact-text {
      display: block;
      color: #9CA3AF;
      font-size: 28rpx;
      margin-bottom: 24rpx;
    }
    .contact-btn {
      padding: 0 60rpx;
      height: 80rpx;
      line-height: 80rpx;
      background: rgba(0, 187, 136, 0.1);
      color: #00BB88;
      border-radius: 40rpx;
      font-size: 28rpx;
      border: 2rpx solid #00BB88;
      &::after {
        border: none;
      }
    }
  }
}
</style>
