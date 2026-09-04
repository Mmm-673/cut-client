<template>
  <view class="location-picker-wrapper">
    <uni-data-picker
        class="location-picker"
        :localdata="areaData"
        :clear-icon="false"
        :border="false"
        :map="{value:'id', text:'name', children:'children'}"
        :popup-title="popupTitle"
        @change="handleChange"
    >
      <view class="location-box">
        <uni-icons type="location" size="18" color="#00BB88" />
        <text class="location-text">
          <text v-if="locating">{{ locatingText }}</text>
          <text v-else-if="locationDenied">{{ deniedText }}</text>
          <text v-else-if="displayText">{{ displayText }}</text>
          <text v-else>{{ placeholder }}</text>
        </text>
        <uni-icons type="right" size="16" color="#9CA3AF" />
      </view>
    </uni-data-picker>

    <!-- 重新定位按钮 -->
    <view v-if="showRelocate && selectedId" class="relocate-box" @click="handleRelocate">
      <uni-icons type="refresh" size="14" color="#00BB88" />
      <text class="relocate-text">{{ relocateText }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null
  },
  areaData: {
    type: Array,
    default: () => []
  },
  locating: {
    type: Boolean,
    default: false
  },
  locationDenied: {
    type: Boolean,
    default: false
  },
  displayText: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '选择城市'
  },
  locatingText: {
    type: String,
    default: '定位中...'
  },
  deniedText: {
    type: String,
    default: '定位权限未开启'
  },
  relocateText: {
    type: String,
    default: '重新定位'
  },
  popupTitle: {
    type: String,
    default: '选择城市'
  },
  showRelocate: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'relocate'])

const selectedId = computed(() => props.modelValue)

const handleChange = (e) => {
  const value = e.detail?.value
  if (value && value.length > 0) {
    const id = value[value.length - 1]
    emit('update:modelValue', id)
    emit('change', id)
  }
}

const handleRelocate = () => {
  emit('relocate')
}
</script>

<style lang="scss" scoped>
.location-picker-wrapper {
  margin: 0;
  padding: 0;
}

/* 完全清除uni-data-picker的默认样式 */
.location-picker {
  display: block;
  width: 100%;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  background: transparent !important;
  min-height: auto !important;
  height: auto !important;
}

.location-picker :deep(.uni-data-picker) {
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  background: transparent !important;
  min-height: auto !important;
  height: auto !important;
}

.location-picker :deep(.uni-data-picker__picker) {
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  background: transparent !important;
  min-height: auto !important;
  height: auto !important;
}

.location-picker :deep(.uni-data-picker__box) {
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  background: transparent !important;
  min-height: auto !important;
  height: auto !important;
}

.location-picker :deep(.uni-data-picker__placeholder) {
  padding: 0 !important;
  margin: 0 !important;
  min-height: auto !important;
  height: auto !important;
  display: none !important;
}

.location-picker :deep(.uni-data-picker__input) {
  padding: 0 !important;
  margin: 0 !important;
  min-height: auto !important;
  height: auto !important;
}

/* 定位信息 */
.location-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx;
  background: var(--bg-card);
  border-radius: 16rpx;

  .location-text {
    color: var(--text-primary);
    font-size: 28rpx;
    flex: 1;
  }
}

/* 重新定位按钮 */
.relocate-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin: 16rpx 0 0;
  padding: 12rpx 24rpx;
  background: rgba(0, 187, 136, 0.1);
  border-radius: 32rpx;
  align-self: flex-start;
  width: fit-content;

  .relocate-text {
    color: var(--brand-primary, #00BB88);
    font-size: 24rpx;
  }
}
</style>
