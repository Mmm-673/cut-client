<template>
  <view class="evaluate-page">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="iconfont">&#xe61c;</text>
      </view>
      <view class="nav-title">评价服务</view>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 教练信息区 -->
    <view class="coach-info">
      <image class="coach-avatar" :src="coachInfo.avatar" mode="aspectFill" />
      <view class="coach-name">{{ coachInfo.name }}</view>
      <view class="coach-desc">
        {{ coachInfo.serviceType }} · {{ coachInfo.serviceTime }}
      </view>
    </view>

    <!-- 星级评分区 -->
    <view class="score-card">
      <view class="score-title">本次服务您打几分?</view>
      <view class="score-stars">
        <view
            v-for="(star, index) in 5"
            :key="index"
            class="star-item"
            @click="handleScoreClick(index + 1)"
        >
          <text
              class="iconfont"
              :class="{ 'star-active': currentScore >= index + 1 }"
          >
            {{ currentScore >= index + 1 ? '★' : '☆' }}
          </text>
        </view>
      </view>
      <view class="score-desc">{{ scoreDesc[currentScore - 1] }}</view>
    </view>

    <!-- 评价标签区 -->
    <view class="tag-section">
      <view class="section-title">选择评价标签（可多选）</view>
      <view class="tag-list">
        <view
            v-for="(tag, index) in tagList"
            :key="index"
            class="tag-item"
            :class="{ 'tag-active': selectedTags.includes(tag) }"
            @click="handleTagClick(tag)"
        >
          {{ tag }}
        </view>
      </view>
    </view>

    <!-- 体验分享区 -->
    <view class="content-section">
      <view class="section-title">分享你的体验（选填）</view>
      <textarea
          class="content-input"
          v-model="evaluateContent"
          placeholder="详细描述一下你的体验，帮助更多用户选择合适的教练..."
          maxlength="300"
          @input="handleContentInput"
      />
      <view class="content-toolbar">
        <view class="tool-buttons">
          <view class="tool-btn" @click="handleUploadImage">
            <text class="iconfont">&#xe60a;</text>
          </view>
          <view class="tool-btn" @click="handleUploadVideo">
            <text class="iconfont">&#xe60b;</text>
          </view>
        </view>
        <view class="content-count">{{ evaluateContent.length }}/300</view>
      </view>
    </view>

    <!-- 匿名评价开关 -->
    <view class="anonymous-section">
      <view class="anonymous-left">
        <text class="iconfont">&#xe60c;</text>
        <text class="anonymous-text">匿名评价</text>
      </view>
      <switch
          :checked="isAnonymous"
          @change="handleAnonymousChange"
          color="#00b578"
      />
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="reward-btn" @click="handleReward">
        <text class="iconfont">&#xe60d;</text>
        <text>打赏教练</text>
      </view>
      <view class="submit-btn" @click="handleSubmit">
        提交评价
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 教练信息（模拟数据，实际从接口获取）
const coachInfo = reactive({
  avatar: 'https://via.placeholder.com/120x120/333/fff?text=阿豪',
  name: '阿豪',
  serviceType: '台球陪练',
  serviceTime: '2026-03-22 14:00-16:00'
});

// 星级评分相关
const currentScore = ref(4);
const scoreDesc = ref(['非常不满意', '不满意', '一般', '满意', '非常满意']);

// 标签相关
const tagList = ref(['专业', '耐心', '准时', '技术好', '讲解清晰', '态度好', '性价比高', '推荐']);
const selectedTags = ref(['专业', '耐心']);

// 评价内容相关
const evaluateContent = ref('');
const isAnonymous = ref(false);

// 页面生命周期
onLoad(() => {
  // 页面加载时可从接口获取订单/教练信息
});

// 星级点击
const handleScoreClick = (score) => {
  currentScore.value = score;
};

// 标签点击
const handleTagClick = (tag) => {
  const index = selectedTags.value.indexOf(tag);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(tag);
  }
};

// 内容输入
const handleContentInput = () => {
  // 可实时统计字数，已通过v-model绑定
};

// 匿名开关
const handleAnonymousChange = (e) => {
  isAnonymous.value = e.detail.value;
};

// 上传图片
const handleUploadImage = () => {
  uni.chooseImage({
    count: 9,
    success: (res) => {
      console.log('选择图片', res.tempFilePaths);
      // 上传逻辑
    }
  });
};

// 上传视频
const handleUploadVideo = () => {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    success: (res) => {
      console.log('选择视频', res.tempFilePath);
      // 上传逻辑
    }
  });
};

// 返回
const goBack = () => {
  uni.navigateBack();
};

// 打赏
const handleReward = () => {
  uni.showToast({
    title: '打赏功能开发中',
    icon: 'none'
  });
};

// 提交评价
const handleSubmit = () => {
  // 校验
  if (currentScore.value === 0) {
    return uni.showToast({
      title: '请先给教练打分',
      icon: 'none'
    });
  }

  // 提交数据
  const submitData = {
    coachId: '123', // 教练ID
    orderId: '456', // 订单ID
    score: currentScore.value,
    tags: selectedTags.value,
    content: evaluateContent.value,
    isAnonymous: isAnonymous.value
  };

  console.log('提交评价', submitData);
  uni.showLoading({ title: '提交中...' });

  // 模拟接口请求
  setTimeout(() => {
    uni.hideLoading();
    uni.showToast({
      title: '评价提交成功',
      icon: 'success'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }, 1000);
};
</script>

<style scoped lang="scss">
// 全局样式变量
$bg-primary: #1a1a1a;
$bg-card: #2d2d2d;
$text-primary: #ffffff;
$text-secondary: #b3b3b3;
$accent-yellow: #f5c518;
$accent-green: #00b578;
$border-radius: 16px;
$transition: all 0.3s ease;

.evaluate-page {
  min-height: 100vh;
  background-color: $bg-primary;
  color: $text-primary;
  padding-bottom: 120rpx;
}

// 导航栏
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 30rpx;
  background-color: $bg-primary;
  position: sticky;
  top: 0;
  z-index: 999;

  .nav-back {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    .iconfont {
      font-size: 40rpx;
      color: $text-primary;
    }
  }

  .nav-title {
    font-size: 36rpx;
    font-weight: 600;
    color: $text-primary;
  }

  .nav-placeholder {
    width: 60rpx;
  }
}

// 教练信息
.coach-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 30rpx 30rpx;

  .coach-avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    margin-bottom: 20rpx;
    border: 4rpx solid $accent-yellow;
  }

  .coach-name {
    font-size: 40rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 16rpx;
  }

  .coach-desc {
    font-size: 28rpx;
    color: $text-secondary;
  }
}

// 星级评分卡片
.score-card {
  background-color: $bg-card;
  margin: 0 30rpx 40rpx;
  border-radius: $border-radius;
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;

  .score-title {
    font-size: 36rpx;
    font-weight: 600;
    margin-bottom: 40rpx;
  }

  .score-stars {
    display: flex;
    gap: 30rpx;
    margin-bottom: 30rpx;

    .star-item {
      font-size: 80rpx;
      cursor: pointer;
      transition: $transition;

      .iconfont {
        color: #666666;
        transition: $transition;

        &.star-active {
          color: $accent-yellow;
        }
      }

      &:active {
        transform: scale(1.1);
      }
    }
  }

  .score-desc {
    font-size: 32rpx;
    color: $accent-yellow;
    font-weight: 500;
  }
}

// 标签区
.tag-section {
  padding: 0 30rpx 40rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 30rpx;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;

    .tag-item {
      padding: 16rpx 32rpx;
      background-color: $bg-card;
      border-radius: 40rpx;
      font-size: 28rpx;
      color: $text-secondary;
      border: 2rpx solid transparent;
      transition: $transition;

      &.tag-active {
        background-color: rgba(0, 181, 120, 0.15);
        color: $accent-green;
        border-color: $accent-green;
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }
}

// 内容输入区
.content-section {
  padding: 0 30rpx 30rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 20rpx;
  }

  .content-input {
    width: 100%;
    min-height: 240rpx;
    background-color: $bg-card;
    border-radius: $border-radius;
    padding: 30rpx;
    font-size: 28rpx;
    color: $text-primary;
    box-sizing: border-box;
    line-height: 1.5;
    border: none;
    outline: none;
    resize: none;

    &::placeholder {
      color: $text-secondary;
    }
  }

  .content-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20rpx;

    .tool-buttons {
      display: flex;
      gap: 20rpx;

      .tool-btn {
        width: 100rpx;
        height: 100rpx;
        background-color: $bg-card;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        .iconfont {
          font-size: 40rpx;
          color: $text-secondary;
        }
      }
    }

    .content-count {
      font-size: 28rpx;
      color: $text-secondary;
    }
  }
}

// 匿名评价
.anonymous-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx 40rpx;

  .anonymous-left {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .iconfont {
      font-size: 32rpx;
      color: $text-secondary;
    }

    .anonymous-text {
      font-size: 28rpx;
      color: $text-secondary;
    }
  }
}

// 底部操作栏
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx 40rpx;
  background-color: $bg-primary;
  z-index: 999;

  .reward-btn {
    flex: 1;
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    background-color: transparent;
    border: 2rpx solid $accent-yellow;
    border-radius: 48rpx;
    font-size: 32rpx;
    color: $accent-yellow;
    font-weight: 600;

    .iconfont {
      font-size: 36rpx;
    }

    &:active {
      opacity: 0.8;
    }
  }

  .submit-btn {
    flex: 3;
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $accent-green;
    border-radius: 48rpx;
    font-size: 32rpx;
    color: $text-primary;
    font-weight: 600;

    &:active {
      opacity: 0.8;
    }
  }
}
</style>