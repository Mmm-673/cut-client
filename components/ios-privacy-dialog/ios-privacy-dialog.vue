<template>
  <uni-popup
    ref="popupRef"
    type="center"
    :is-mask-click="false"
    :mask-click="false"
    background-color="transparent"
  >
    <view v-if="blocked" class="privacy-dialog privacy-dialog--blocked">
      <text class="privacy-dialog__title">无法继续使用</text>
      <text class="privacy-dialog__text privacy-dialog__text--center">
        您已拒绝《服务协议》和《隐私政策》，无法使用本应用。请关闭应用后重新打开，或点击下方按钮重新查看协议。
      </text>
      <view class="privacy-dialog__actions privacy-dialog__actions--single">
        <button class="privacy-dialog__btn privacy-dialog__btn--accept" @click="handleReviewPrivacy">
          重新查看协议
        </button>
      </view>
    </view>
    <view v-else class="privacy-dialog">
      <text class="privacy-dialog__title">{{ currentStep.title }}</text>

      <scroll-view scroll-y class="privacy-dialog__body">
        <template v-if="step === 'first'">
          <text
            v-for="(paragraph, index) in PRIVACY_FIRST.paragraphs"
            :key="index"
            class="privacy-dialog__text"
          >
            {{ paragraph }}
          </text>
        </template>
        <text v-else class="privacy-dialog__text">{{ PRIVACY_SECOND.message }}</text>

        <view class="privacy-dialog__links">
          <text class="privacy-dialog__link" @click="handleOpenLink(PRIVACY_LINKS.userAgreement)">
            《服务协议》
          </text>
          <text class="privacy-dialog__link-sep">和</text>
          <text class="privacy-dialog__link" @click="handleOpenLink(PRIVACY_LINKS.userPrivacy)">
            《隐私政策》
          </text>
        </view>
      </scroll-view>

      <view class="privacy-dialog__actions">
        <button class="privacy-dialog__btn privacy-dialog__btn--refuse" @click="handleRefuse">
          {{ currentStep.buttonRefuse }}
        </button>
        <button class="privacy-dialog__btn privacy-dialog__btn--accept" @click="handleAccept">
          {{ currentStep.buttonAccept }}
        </button>
      </view>
    </view>
  </uni-popup>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  PRIVACY_FIRST,
  PRIVACY_SECOND,
  PRIVACY_LINKS,
  completePrivacyAgree,
  disagreePrivacy,
  openPrivacyLink,
  quitApp,
  hasPrivacyRefused,
  markPrivacyRefused,
  resetPrivacyRefused
} from '@/utils/privacy'

const emit = defineEmits(['agree'])

const popupRef = ref(null)
const step = ref('first')
const blocked = ref(false)

const currentStep = computed(() => (step.value === 'first' ? PRIVACY_FIRST : PRIVACY_SECOND))

/** 打开弹窗 */
function open() {
  if (hasPrivacyRefused()) {
    blocked.value = true
    step.value = 'second'
  } else {
    blocked.value = false
    step.value = 'first'
  }
  popupRef.value?.open()
}

/** 关闭弹窗 */
function close() {
  popupRef.value?.close()
}

/** 打开协议链接 */
function handleOpenLink(url) {
  openPrivacyLink(url)
}

/** 用户点击同意 */
function handleAccept() {
  completePrivacyAgree()
  close()
  emit('agree')
}

/** 用户点击拒绝 */
function handleRefuse() {
  if (step.value === 'first') {
    step.value = 'second'
    return
  }

  disagreePrivacy()
  markPrivacyRefused()
  blocked.value = true
  quitApp()
}

/** 重新查看协议 */
function handleReviewPrivacy() {
  resetPrivacyRefused()
  blocked.value = false
  step.value = 'first'
}

defineExpose({
  open,
  close
})
</script>

<style lang="scss" scoped>
.privacy-dialog {
  width: 620rpx;
  max-width: 86vw;
  padding: 48rpx 40rpx 40rpx;
  border-radius: 24rpx;
  background: #1e252b;
  box-sizing: border-box;
  position: relative;
  z-index: 10001;
}

.privacy-dialog__title {
  display: block;
  margin-bottom: 28rpx;
  font-size: 34rpx;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  line-height: 1.4;
}

.privacy-dialog__body {
  max-height: 52vh;
  margin-bottom: 36rpx;
}

.privacy-dialog__text {
  display: block;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #c8cdd2;
  line-height: 1.8;
  text-indent: 2em;
}

.privacy-dialog__text--center {
  text-indent: 0;
  text-align: center;
}

.privacy-dialog--blocked {
  .privacy-dialog__text {
    margin-bottom: 36rpx;
  }
}

.privacy-dialog__actions--single {
  .privacy-dialog__btn {
    flex: none;
    width: 100%;
  }
}

.privacy-dialog__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 8rpx;
}

.privacy-dialog__link {
  font-size: 28rpx;
  color: #00bb88;
  line-height: 1.6;
}

.privacy-dialog__link-sep {
  font-size: 28rpx;
  color: #c8cdd2;
}

.privacy-dialog__actions {
  display: flex;
  gap: 20rpx;
}

.privacy-dialog__btn {
  flex: 1;
  height: 84rpx;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 42rpx;
  font-size: 28rpx;
  line-height: 84rpx;

  &::after {
    border: none;
  }
}

.privacy-dialog__btn--refuse {
  color: #c8cdd2;
  background: #2a3338;
}

.privacy-dialog__btn--accept {
  color: #ffffff;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
</style>
