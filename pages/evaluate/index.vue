<template>
  <view class="evaluate-page">
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

      <!-- 已上传图片预览 -->
      <view class="image-preview-list" v-if="uploadedImages.length > 0">
        <view
            class="preview-item"
            v-for="(img, index) in uploadedImages"
            :key="index"
        >
          <image :src="img" mode="aspectFill" class="preview-img" />
          <view class="remove-btn" @click="removeImage(index)">
            <text class="iconfont">&#xe617;</text>
          </view>
        </view>
      </view>

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
      <view class="submit-btn" @click="handleSubmit">
        提交评价
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { createReview, uploadReviewImage } from '@/api/billiard/coach';

// 教练信息
const coachInfo = reactive({
  avatar: '',
  name: '',
  serviceType: '',
  serviceTime: ''
});

// 订单ID
const orderId = ref(null);

// 星级评分相关
const currentScore = ref(5);
const scoreDesc = ['非常不满意', '不满意', '一般', '满意', '非常满意'];

// 标签相关
const tagList = ['专业', '耐心', '准时', '技术好', '讲解清晰', '态度好', '性价比高', '推荐'];
const selectedTags = ref([]);

// 评价内容相关
const evaluateContent = ref('');
const isAnonymous = ref(false);
const uploadedImages = ref([]);

// 页面生命周期
onLoad((options) => {
  // 从上一页传递的参数获取订单ID和教练信息
  if (options.orderId) {
    orderId.value = parseInt(options.orderId);
  }
  if (options.coachAvatar) {
    coachInfo.avatar = options.coachAvatar;
  }
  if (options.coachName) {
    coachInfo.name = options.coachName;
  }
  if (options.serviceType) {
    coachInfo.serviceType = options.serviceType;
  }
  if (options.serviceTime) {
    coachInfo.serviceTime = options.serviceTime;
  }
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
const handleUploadImage = async () => {
  const remaining = 9 - uploadedImages.value.length;
  if (remaining <= 0) {
    uni.showToast({
      title: '最多上传9张图片',
      icon: 'none'
    });
    return;
  }

  uni.chooseImage({
    count: remaining,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePaths = res.tempFilePaths;
      uni.showLoading({ title: '上传中...' });

      try {
        for (const filePath of tempFilePaths) {
          const result = await uploadReviewImage(filePath);
          if (result.data) {
            uploadedImages.value.push(result.data.url);
          }
        }
        uni.hideLoading();
        uni.showToast({
          title: '上传成功',
          icon: 'success'
        });
      } catch (error) {
        uni.hideLoading();
        console.error('上传图片失败:', error);
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        });
      }
    }
  });
};

// 上传视频（暂不支持）
const handleUploadVideo = () => {
  uni.showToast({
    title: '视频上传功能开发中',
    icon: 'none'
  });
};

// 删除已上传图片
const removeImage = (index) => {
  uploadedImages.value.splice(index, 1);
};

// 返回
const goBack = () => {
  uni.navigateBack();
};

// 提交评价
const handleSubmit = async () => {
  // 校验
  if (currentScore.value === 0) {
    return uni.showToast({
      title: '请先给教练打分',
      icon: 'none'
    });
  }

  if (!orderId.value) {
    return uni.showToast({
      title: '订单信息获取失败',
      icon: 'none'
    });
  }

  uni.showLoading({ title: '提交中...' });

  try {
    const submitData = {
      orderId: orderId.value,
      star: currentScore.value,
      content: evaluateContent.value || '',
      tags: selectedTags.value.join(','),
      images: uploadedImages.value,
      isAnonymous: isAnonymous.value
    };

    await createReview(submitData);

    uni.hideLoading();
    uni.showToast({
      title: '评价提交成功',
      icon: 'success'
    });

    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    uni.hideLoading();
    console.error('提交评价失败:', error);
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    });
  }
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

  .image-preview-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 20rpx;

    .preview-item {
      position: relative;
      width: 160rpx;
      height: 160rpx;
      border-radius: 12rpx;
      overflow: hidden;

      .preview-img {
        width: 100%;
        height: 100%;
      }

      .remove-btn {
        position: absolute;
        top: 0;
        right: 0;
        width: 40rpx;
        height: 40rpx;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0 0 0 12rpx;

        .iconfont {
          font-size: 24rpx;
          color: #fff;
        }
      }
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
  padding: 20rpx 30rpx calc(40rpx + env(safe-area-inset-bottom));

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
  padding: 16rpx 24rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background-color: $bg-primary;
  z-index: 999;

  .submit-btn {
    flex: 1;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $accent-green;
    border-radius: 36rpx;
    font-size: 28rpx;
    color: $text-primary;
    font-weight: 600;

    &:active {
      opacity: 0.8;
    }
  }
}
</style>