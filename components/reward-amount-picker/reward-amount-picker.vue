<template>
  <view class="amount-picker">
    <!-- 金额选择网格 -->
    <view class="amount-section">
      <view class="amount-grid">
        <view
            v-for="(item, index) in options"
            :key="index"
            class="amount-item"
            :class="{ active: modelValue === item.value && !isCustom }"
            @click="handleSelect(item.value)"
            >
          <text class="amount-value">{{ item.value }}</text>
          <text class="amount-label">{{ item.label }}</text>
        </view>
        <view
            class="amount-item custom-item"
            :class="{ active: isCustom }"
            @click="handleCustomSelect"
            >
          <text class="custom-icon">✏️</text>
          <text class="amount-label">自定义</text>
        </view>
      </view>
    </view>

    <!-- 自定义金额输入 -->
    <view class="custom-input-section" v-if="isCustom">
      <view class="input-wrapper">
        <text class="currency-icon">¥</text>
        <input
            class="custom-input"
            type="digit"
            :value="customValue"
            :placeholder="placeholder"
            @input="handleCustomInput"
            />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: 0
  },
  options: {
    type: Array,
    default: () => [
      { value: 10, label: '小意思' },
      { value: 20, label: '很满意' },
      { value: 50, label: '超棒的' },
      { value: 100, label: '太棒了' },
      { value: 200, label: '大神级' }
    ]
  },
  placeholder: {
    type: String,
    default: '请输入金额'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const customValue = ref('')
const isCustom = computed(() => {
  // 如果当前值不在预设选项中，则视为自定义
  return !props.options.some(item => item.value === Number(props.modelValue))
})

watch(() => props.modelValue, (val) => {
  if (isCustom.value && val) {
    customValue.value = String(val)
  }
}, { immediate: true })

const handleSelect = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const handleCustomSelect = () => {
  // 切换到自定义模式，发出一个当前自定义值
  const val = parseFloat(customValue.value) || 0
  emit('update:modelValue', val)
  emit('change', val)
}

const handleCustomInput = (e) => {
  let value = e.detail.value
  // 限制小数点后两位
  value = value.replace(/^\./g, '')
  value = value.replace(/\.{2,}/g, '.')
  value = value.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.')
  value = value.replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3')
  customValue.value = value
  const numValue = parseFloat(value) || 0
  emit('update:modelValue', numValue)
  emit('change', numValue)
}
</script>

<style lang="scss" scoped>
.amount-picker {
  width: 100%;
}

/* 金额选择 */
.amount-section {
  margin-bottom: 32rpx;

  .amount-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16rpx;

    .amount-item {
      background-color: var(--bg-card);
      border-radius: 16rpx;
      padding: 24rpx 16rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 4rpx solid transparent;
      transition: all 0.3s;

      &.active {
        background-color: rgba(245, 166, 35, 0.15);
        border-color: #f5a623;
      }

      .amount-value {
        font-size: 36rpx;
        font-weight: 700;
        color: var(--text-primary);
      }

      .amount-label {
        font-size: 22rpx;
        color: var(--text-tertiary);
        margin-top: 6rpx;
      }

      &.custom-item {
        .custom-icon {
          font-size: 36rpx;
          margin-bottom: 6rpx;
        }
      }
    }
  }
}

/* 自定义金额输入 */
.custom-input-section {
  margin-bottom: 32rpx;

  .input-wrapper {
    display: flex;
    align-items: center;
    background-color: var(--bg-card);
    border-radius: 16rpx;
    padding: 24rpx 28rpx;

    .currency-icon {
      font-size: 32rpx;
      color: #f5a623;
      font-weight: 600;
      margin-right: 16rpx;
    }

    .custom-input {
      flex: 1;
      font-size: 28rpx;
      color: var(--text-primary);

      &::placeholder {
        color: var(--text-tertiary);
      }
    }
  }
}
</style>
